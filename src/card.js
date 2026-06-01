/**
 * Cureus — Single Card HTML Template (MS Paint Style Redesign)
 *
 * Renders one review card as a retro Windows XP MS Paint window.
 */

const POSTER_BASE = 'https://image.tmdb.org/t/p';
const REVIEW_TRUNCATE = 250;

/**
 * Build the full poster URL from a path.
 * @param {string|null} path - e.g. /abc123.jpg
 * @param {string} size - e.g. w500
 */
export function posterUrl(path, size = 'w500') {
  if (!path) return null;
  return `${POSTER_BASE}/${size}${path}`;
}

/**
 * Render a single review as a card HTML string.
 *
 * @param {object} review - Review row from Supabase
 * @param {number} index - Zero-based position in the feed
 * @param {number} total - Total number of cards
 * @returns {string} HTML string for one card
 */
export function renderCard(review, index, total) {
  const poster500 = posterUrl(review.poster, 'w500');
  const poster342 = posterUrl(review.poster, 'w342');

  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const year = review.year || 'N/A';
  const genres = review.genres || [];

  // Review text — truncate with expand toggle
  const fullText = review.review || '';
  const isTruncatable = fullText.length > REVIEW_TRUNCATE;
  const shortText = isTruncatable ? fullText.slice(0, REVIEW_TRUNCATE).trimEnd() + '…' : fullText;

  const reviewHtml = isTruncatable
    ? `<p class="paint-review" data-full="${encodeURIComponent(fullText)}" data-short="${encodeURIComponent(shortText)}" data-expanded="false">${shortText}</p>
       <button class="card-review-toggle" aria-label="Read more">Read more ↓</button>`
    : `<p class="paint-review">${fullText}</p>`;

  // Poster with fallback
  const posterHtml = poster500
    ? `<img
         class="poster-img"
         src="${poster500}"
         alt="${review.title} poster"
         loading="lazy"
         data-next-src="${poster342 || ''}"
       />`
    : `<div class="poster-no-img">No poster loaded</div>`;

  return `
    <article
      class="card"
      data-id="${review.id}"
      data-tmdb-id="${review.tmdb_id}"
      data-type="${review.type}"
      data-title="${encodeURIComponent(review.title)}"
      role="article"
      aria-label="${review.title} review"
    >
      <div class="paint-window">
        <!-- Windows XP Title Bar (Luna blue theme style) -->
        <div class="window-title-bar">
          <div class="window-title-text">
            <span class="window-title-icon">🎨</span>
            <strong>Cureus Paint - ${review.title}.bmp [${index + 1}/${total}]</strong>
          </div>
          <div class="window-controls">
            <button class="win-btn" aria-label="Minimize">🗕</button>
            <button class="win-btn" aria-label="Maximize">🗖</button>
            <button class="win-btn win-btn-close" aria-label="Close">✕</button>
          </div>
        </div>

        <!-- Paint Menu Bar -->
        <div class="window-menu-bar">
          <span class="menu-item"><u>F</u>ile</span>
          <span class="menu-item"><u>E</u>dit</span>
          <span class="menu-item"><u>V</u>iew</span>
          <span class="menu-item"><u>I</u>mage</span>
          <span class="menu-item"><u>C</u>olors</span>
          <span class="menu-item"><u>H</u>elp</span>
        </div>

        <!-- Inner White Canvas Area -->
        <div class="paint-canvas">
          <canvas class="paint-drawing-layer"></canvas>
          <div class="canvas-left">
            
            <!-- Metadata and Genre tags -->
            <div class="canvas-meta">
              ${genres.map(g => `<span class="paint-genre-tag">${g}</span>`).join('')}
              <span class="paint-type-tag">${review.type === 'tv' ? 'TV Show' : 'Movie'}</span>
            </div>

            <!-- active Text Box (dashed border with handles) -->
            <div class="paint-text-tool-box">
              <!-- Selection corner handles -->
              <div class="text-tool-handle n"></div>
              <div class="text-tool-handle s"></div>
              <div class="text-tool-handle e"></div>
              <div class="text-tool-handle w"></div>
              <div class="text-tool-handle nw"></div>
              <div class="text-tool-handle ne"></div>
              <div class="text-tool-handle sw"></div>
              <div class="text-tool-handle se"></div>

              <h2 class="paint-card-title">${review.title}</h2>
              <div class="paint-year">Released: ${year}</div>
              
              <div class="paint-rating">
                <span class="paint-stars" aria-label="${review.rating} out of 5 stars">${stars}</span>
                <span class="paint-reviewer">Curated by ${review.reviewer}</span>
              </div>
              
              <div class="paint-divider-line"></div>
              
              <div class="paint-review-container">
                ${reviewHtml}
              </div>
            </div>

            <!-- Watch Button styled like a retro grey XP bevel button -->
            <div class="paint-actions">
              <button
                class="btn-watch paint-btn-watch"
                data-tmdb-id="${review.tmdb_id}"
                data-type="${review.type}"
                data-title="${encodeURIComponent(review.title)}"
                id="watch-${review.id}"
                aria-label="Watch ${review.title}"
              >
                <span class="btn-watch-icon">▶</span>
                Watch Now
              </button>
            </div>
          </div>

          <div class="canvas-right">
            <!-- Selected Image Area (dashed selection border with handles) -->
            <div class="paint-selection-box">
              <div class="selection-handle n"></div>
              <div class="selection-handle s"></div>
              <div class="selection-handle e"></div>
              <div class="selection-handle w"></div>
              <div class="selection-handle nw"></div>
              <div class="selection-handle ne"></div>
              <div class="selection-handle sw"></div>
              <div class="selection-handle se"></div>
              ${posterHtml}
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}
