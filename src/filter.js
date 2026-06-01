/**
 * Cureus — Genre Filter Bar (MS Paint Style Redesign)
 *
 * Maps genres to dynamic 90s-style colors. Shows them as color blocks in the palette.
 * Selecting a genre re-shuffles matching cards into the feed.
 */

let activeGenre = null;  // null = All

// Retro palette colors mapped to genres
const GENRE_COLORS = {
  All: '#000000',
  Action: '#ff0000',
  Adventure: '#ff8000',
  Animation: '#ff00ff',
  Comedy: '#ffff00',
  Crime: '#800000',
  Documentary: '#008000',
  Drama: '#0000ff',
  Family: '#00ffff',
  Fantasy: '#800080',
  History: '#808000',
  Horror: '#000080',
  Music: '#ff0080',
  Mystery: '#008080',
  Romance: '#ffb3ba',
  'Science Fiction': '#00ff00',
  Thriller: '#ff6600',
  TV: '#a080f0',
  Western: '#964b00',
};

/**
 * Initialize the genre filter bar.
 *
 * @param {Array}    reviews       - Full review dataset
 * @param {Function} onFilter      - Called with filtered & shuffled array
 */
export function initFilter(reviews, onFilter) {
  const bar = document.getElementById('filter-bar');
  if (!bar) return;

  // Clear loading indicators/previous chips
  bar.innerHTML = '';

  // Collect all unique genres from the data
  const genreSet = new Set();
  for (const r of reviews) {
    for (const g of (r.genres || [])) {
      genreSet.add(g);
    }
  }
  const genres = [...genreSet].sort();

  // Build chips
  const allChip = makeChip('All', true);
  allChip.addEventListener('click', () => {
    setActive(allChip, null, reviews, onFilter, bar);
  });
  bar.appendChild(allChip);

  for (const genre of genres) {
    const chip = makeChip(genre, false);
    chip.addEventListener('click', () => {
      setActive(chip, genre, reviews, onFilter, bar);
    });
    bar.appendChild(chip);
  }
}

/**
 * Create a single filter chip element.
 */
function makeChip(label, isActive) {
  const chip = document.createElement('button');
  chip.className = 'filter-chip' + (isActive ? ' active' : '');
  
  const color = GENRE_COLORS[label] || '#7f7f7f';
  
  chip.innerHTML = `
    <span class="palette-swatch-box" style="background-color: ${color};"></span>
    <span class="palette-swatch-label">${label}</span>
  `;
  
  chip.dataset.genre = label;
  chip.dataset.color = color;
  chip.type = 'button';
  return chip;
}

/**
 * Activate a chip, deactivate others, filter + re-render.
 */
function setActive(chip, genre, reviews, onFilter, bar) {
  // Update active chip
  bar.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
  chip.classList.add('active');
  activeGenre = genre;

  // Sync with MS Paint Active Foreground Color block
  const fgColor = document.getElementById('active-fg-color');
  if (fgColor) {
    fgColor.style.backgroundColor = chip.dataset.color || '#000000';
  }

  // Filter
  const filtered = genre
    ? reviews.filter((r) => (r.genres || []).includes(genre))
    : reviews;

  // Shuffle and pass back
  onFilter(shuffle([...filtered]));
}

/**
 * Fisher–Yates shuffle.
 */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
