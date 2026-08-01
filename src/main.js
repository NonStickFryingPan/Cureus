import { fetchReviews } from './db.js';
import { escapeHtml } from './utils.js';

// --- Application State (Functional Pattern) ---
let allReviews = [];
let currentColor = '#000000';
let activeTool = 'cursor'; // default pointer
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let seenObserver = null;

// Classic MS Paint palette colors
const paintColors = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
  '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'
];

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', async () => {
  setupDesktopCheck();
  setupCanvasBoard();
  setupToolbar();
  setupMenuActions();
  setupHashRouter();
  setupPlayerModal();
  setupReviewerModal();
  setupGlobalEscapeHandler();
  setupSpotlightSearch();
  
  // Track cursor coordinates standard in MS Paint
  const workspace = document.getElementById('workspace');
  workspace.addEventListener('mousemove', (e) => {
    const rect = workspace.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    document.getElementById('status-coordinates').textContent = `Cursor: ${x}, ${y}px`;
  });

  // Fetch initial reviews
  await loadReviews();
});

// --- Desktop Only Block Screen ---
function setupDesktopCheck() {
  const check = () => {
    const isNarrow = window.innerWidth < 768;
    // Check for touch capability
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const blocker = document.getElementById('desktop-blocker');
    
    if (isNarrow && isTouch) {
      blocker.style.display = 'flex';
      document.getElementById('app-shell').style.display = 'none';
    } else {
      blocker.style.display = 'none';
      document.getElementById('app-shell').style.display = 'flex';
    }
  };
  
  check();
  window.addEventListener('resize', check);
}

// --- Dynamic Hash Router ---
function setupHashRouter() {
  const handleRoute = () => {
    const hash = window.location.hash;
    const feedView = document.getElementById('feed-view');
    const adminView = document.getElementById('admin-view');
    const aboutView = document.getElementById('about-view');
    const sidebar = document.getElementById('toolbox');
    const palette = document.getElementById('palette-bar');
    
    if (hash === '#admin') {
      feedView.style.display = 'none';
      adminView.style.display = 'block';
      aboutView.style.display = 'none';
      sidebar.style.display = 'none';
      palette.style.display = 'none';
      
      // Lazily load admin script if needed
      import('./admin.js').then((m) => {
        if (m.initAdmin) m.initAdmin();
      }).catch((err) => {
        console.error('Failed to load admin module:', err);
        document.querySelector('#admin-view').innerHTML += '<div style="color:red;padding:20px;">Failed to load admin panel.</div>';
      });
    } else if (hash === '#about') {
      feedView.style.display = 'none';
      adminView.style.display = 'none';
      aboutView.style.display = 'block';
      sidebar.style.display = 'none';
      palette.style.display = 'none';
    } else {
      feedView.style.display = 'block';
      adminView.style.display = 'none';
      aboutView.style.display = 'none';
      sidebar.style.display = 'grid';
      palette.style.display = 'flex';
      
      // Reset view size / canvas resize
      resizeCanvas();
    }
  };
  
  window.addEventListener('hashchange', handleRoute);
  // Initial check (call synchronously before loadReviews)
  handleRoute();
}

// --- HTML5 Canvas Scribble Board ---
function setupCanvasBoard() {
  const canvas = document.getElementById('scribble-board');
  const container = document.getElementById('canvas-container');
  const ctx = canvas.getContext('2d');
  
  const resize = () => {
    // Keep drawings when resizing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Set styles
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  };
  
  window.resizeCanvas = resize;
  window.addEventListener('resize', resize);
  requestAnimationFrame(resize);

  let startX = 0;
  let startY = 0;
  let savedImageState = null;

  // Drawing mouse handlers
  const startDraw = (e) => {
    if (e.button !== 0) return; // Left click only
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    startX = lastX = e.clientX - rect.left;
    startY = lastY = e.clientY - rect.top;
    
    if (activeTool === 'rect') {
      savedImageState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.strokeStyle = currentColor;
    
    if (activeTool === 'pencil') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === 'spray') {
      // Classic MS Paint spray paint scatter
      ctx.fillStyle = currentColor;
      const density = 15;
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 8;
        const sx = x + Math.cos(angle) * radius;
        const sy = y + Math.sin(angle) * radius;
        ctx.fillRect(sx, sy, 1, 1);
      }
    } else if (activeTool === 'rect') {
      // Preview rectangle shape
      if (savedImageState) {
        ctx.putImageData(savedImageState, 0, 0);
      }
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(startX, startY, x - startX, y - startY);
      ctx.stroke();
    } else if (activeTool === 'eraser') {
      // Clear screen rectangle
      ctx.clearRect(x - 10, y - 10, 20, 20);
    }
    
    lastX = x;
    lastY = y;
  };

  const stopDraw = () => {
    isDrawing = false;
  };

  // Canvas drawing triggers
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);

  // In drawing mode (pointer-events: auto), the canvas captures wheel events;
  // forward them to the feed viewport so scroll still works.
  // In cursor mode (pointer-events: none), wheel events pass through the
  // canvas naturally to the feed-viewport below — no listener interference.
  canvas.addEventListener('wheel', (e) => {
    const viewport = document.getElementById('feed-view');
    if (viewport) {
      viewport.scrollTop += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });
}

// --- Sidebar Toolbar Actions ---
function setupToolbar() {
  const tools = {
    'tool-cursor': 'cursor',
    'tool-pencil': 'pencil',
    'tool-spray': 'spray',
    'tool-rect': 'rect',
    'tool-eraser': 'eraser'
  };

  const canvas = document.getElementById('scribble-board');
  const container = document.getElementById('canvas-container');

  // Disable pointer-events by default (since cursor is active tool initially)
  canvas.style.pointerEvents = 'none';
  container.className = ''; // default cursor

  Object.entries(tools).forEach(([id, name]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      // Toggle active class
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTool = name;
      
      // Update workspace cursor
      container.className = '';
      if (name === 'pencil') container.classList.add('cursor-pencil');
      else if (name === 'spray') container.classList.add('cursor-spray');
      else if (name === 'eraser') container.classList.add('cursor-eraser');
      else if (name === 'rect') container.classList.add('cursor-rect');
      
      // Toggle pointer-events on the canvas overlay
      if (name === 'cursor') {
        canvas.style.pointerEvents = 'none';
      } else {
        canvas.style.pointerEvents = 'auto';
      }
    });
  });

  // Search button (not a drawing tool)
  document.getElementById('tool-search').addEventListener('click', () => {
    if (window.openSpotlight) window.openSpotlight();
  });

  // Eraser clears drawings if double clicked, or clear button clicked
  document.getElementById('tool-clear').addEventListener('click', clearCanvas);
}

function clearCanvas() {
  const canvas = document.getElementById('scribble-board');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// --- Menu Bar Actions ---
function setupMenuActions() {
  document.getElementById('btn-menu-feed').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '';
  });
  
  document.getElementById('btn-menu-admin').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = 'admin';
  });

  document.getElementById('btn-menu-shuffle').addEventListener('click', () => {
    shuffleAndRender();
  });

  document.getElementById('btn-menu-search').addEventListener('click', (e) => {
    e.preventDefault();
    if (window.openSpotlight) window.openSpotlight();
  });

  document.getElementById('btn-menu-clear-draw').addEventListener('click', () => {
    clearCanvas();
  });

  document.getElementById('btn-menu-about').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = 'about';
  });
  
  // Close admin handler
  document.getElementById('btn-admin-close').addEventListener('click', () => {
    window.location.hash = '';
  });

  // Close about Notepad handler
  document.getElementById('btn-about-close').addEventListener('click', () => {
    window.location.hash = '';
  });

  // Apply to be a Reviewer handler
  document.getElementById('btn-menu-apply').addEventListener('click', (e) => {
    e.preventDefault();
    openReviewerModal();
  });
}

// --- Supabase Data Loading ---
async function loadReviews() {
  try {
    allReviews = await fetchReviews();
    
    // Set up Palette bar with drawing colors
    renderColorPalette();

    // Initial shuffle and render
    shuffleAndRender();

  } catch (err) {
    console.error('Failed to load reviews from Supabase:', err);
    document.getElementById('feed-view').innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: var(--font-pixel); font-size: 2rem;">
        ⚠️ Error: Could not connect to Supabase database.<br>
        Check VITE_SUPABASE credentials in .env file.
      </div>
    `;
  }
}

// --- Seen Tracking ---
function getSeenIds() {
  try {
    const seenStr = sessionStorage.getItem('cureus_seen_ids');
    return seenStr ? JSON.parse(seenStr) : [];
  } catch {
    return [];
  }
}

function markAsSeen(id) {
  try {
    const seen = getSeenIds();
    if (!seen.includes(id)) {
      seen.push(id);
      sessionStorage.setItem('cureus_seen_ids', JSON.stringify(seen));
    }
  } catch {
    // Silent — seen tracking is non-critical
  }
}

// --- Shuffle & Filtering Engine ---
function shuffleAndRender() {
  const seenIds = getSeenIds();
  
  // Split into unseen and seen (records are pre-deduplicated by db.js)
  const unseen = filtered.filter(r => !seenIds.includes(r.id));
  const seen = filtered.filter(r => seenIds.includes(r.id));
  
  // Fisher-Yates Shuffle
  const shuffle = (array) => {
    let m = array.length, t, i;
    while (m) {
      i = Math.floor(Math.random() * m--);
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
    return array;
  };

  const shuffledUnseen = shuffle([...unseen]);
  const shuffledSeen = shuffle([...seen]);
  
  // Feed order: Unseen first, then Seen
  const shuffledQueue = [...shuffledUnseen, ...shuffledSeen];
  
  renderFeed(shuffledQueue, shuffledUnseen.length === 0);
}

// --- Feed Renderer ---
function renderFeed(queue, allSeen) {
  const feedView = document.getElementById('feed-view');
  feedView.innerHTML = ''; // Clear loader
  
  if (queue.length === 0) {
    feedView.innerHTML = `
      <div class="review-card">
        <div style="text-align: center;">
          <h2 class="review-title" style="font-size: 3rem;">No reviews found</h2>
          <p style="font-family: var(--font-clumsy); font-size: 1.5rem; margin-top: 20px;">
            Nothing curated yet!
          </p>
        </div>
      </div>
    `;
    return;
  }

  // Draw cards
  queue.forEach((r, idx) => {
    const card = document.createElement('article');
    card.className = 'review-card';
    card.dataset.id = r.id;
    
    // Genres layout
    const genreSpans = r.genres
      ? r.genres.map(g => `<span class="genre-pill">${escapeHtml(g)}</span>`).join('')
      : '';
      
    // Stars
    const starStr = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    
    // Truncated review text
    const shouldTruncate = r.review.length > 280;
    const displayText = shouldTruncate ? r.review.slice(0, 280) : r.review;
    
    // Build card HTML
    card.innerHTML = `
      <div class="review-left">
        <h2 class="review-title">${escapeHtml(r.title)}</h2>
        <div class="review-meta">
          <span>(${escapeHtml(r.year)})</span>
          <span class="review-stars" title="${r.rating} stars">${starStr}</span>
        </div>
        <div class="review-genres">${genreSpans}</div>
        <div class="reviewer-name">Reviewed by: ${escapeHtml(r.reviewer)}</div>
        
        <div class="review-text-container">
          <p class="review-text">${escapeHtml(displayText)}${shouldTruncate ? `<button class="read-more-btn" data-id="${r.id}" id="btn-more-${r.id}">...more</button>` : ''}</p>
        </div>

        <button class="clumsy-btn watch-now-btn" id="btn-watch-${r.id}" data-id="${r.id}">
          ▶ Watch Now
        </button>
      </div>
      
      <div class="review-right">
        <div class="poster-wrapper">
          <img class="poster-image" src="${r.poster ? 'https://image.tmdb.org/t/p/w500' + r.poster : ''}" alt="${escapeHtml(r.title)} Poster" loading="lazy">
        </div>
      </div>
    `;
    
    feedView.appendChild(card);
  });

  // Append End of Feed message if everything has been seen!
  if (allSeen) {
    const endCard = document.createElement('div');
    endCard.className = 'review-card end-of-feed-card';
    endCard.innerHTML = `
      <div style="text-align: center; max-width: 500px;" class="clumsy-box">
        <h2 class="end-title">That's all folks! 🐷</h2>
        <p class="end-subtitle">
          You've read every handpicked review in this selection. 
          Reset seen-tracking or shuffle to read again!
        </p>
        <button class="clumsy-btn" id="btn-reset-seen" style="margin-top: 20px;">
          🔄 Clear seen history
        </button>
      </div>
    `;
    feedView.appendChild(endCard);
    
    document.getElementById('btn-reset-seen').addEventListener('click', () => {
      try { sessionStorage.removeItem('cureus_seen_ids'); } catch {}
      shuffleAndRender();
    });
  }

  // Set up event listeners inside feed
  setupFeedListeners();
  setupSeenObserver();
}

// --- Feed Event Listeners ---
function setupFeedListeners() {
  // Read more expander
  document.querySelectorAll('.read-more-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const reviewObj = allReviews.find(r => r.id === id);
      if (reviewObj) {
        const textContainer = btn.closest('.review-text-container');
        textContainer.innerHTML = `<p class="review-text">${escapeHtml(reviewObj.review)}</p>`;
      }
    });
  });

  // Watch Now overlay triggers
  document.querySelectorAll('.watch-now-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const reviewObj = allReviews.find(r => r.id === id);
      if (reviewObj) {
        openPlayer(reviewObj);
      }
    });
  });
}

// --- Seen Intersection Observer ---
function setupSeenObserver() {
  // Disconnect previous observer to prevent memory leak
  if (seenObserver) seenObserver.disconnect();
  
  const cards = document.querySelectorAll('.review-card[data-id]');
  
  seenObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.dataset.id;
        markAsSeen(id);
      }
    });
  }, {
    root: document.getElementById('feed-view'),
    threshold: 0.6 // Trigger when card is 60% in view
  });
  
  cards.forEach(card => seenObserver.observe(card));
}

// --- Color Palette Renderer (picks drawing color) ---
function renderColorPalette() {
  const paletteGrid = document.getElementById('genre-palette-grid');
  paletteGrid.innerHTML = '';

  paintColors.forEach((color, index) => {
    const box = document.createElement('div');
    box.className = `color-box ${color === currentColor ? 'active' : ''}`;
    box.style.backgroundColor = color;
    box.title = color;
    box.id = `color-box-${index}`;
    
    box.addEventListener('click', () => {
      currentColor = color;
      document.querySelectorAll('.color-box').forEach(b => b.classList.remove('active'));
      box.classList.add('active');
      
      // Update selected color indicator block (MS Paint style)
      const indicator = document.querySelector('.selected-color-indicator');
      if (indicator) indicator.style.backgroundColor = color;
    });
    
    paletteGrid.appendChild(box);
  });
}

// --- Global Escape Handler (shared by all modals, registered once) ---
function setupGlobalEscapeHandler() {
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const playerOverlay = document.getElementById('player-overlay');
    const reviewerOverlay = document.getElementById('reviewer-overlay');
    if (playerOverlay.style.display === 'flex') {
      playerOverlay.style.display = 'none';
      document.getElementById('player-iframe-root').innerHTML = '';
    } else if (reviewerOverlay.style.display === 'flex') {
      reviewerOverlay.style.display = 'none';
    }
  });
}

// --- Watch Now Player Modal ---
function setupPlayerModal() {
  const overlay = document.getElementById('player-overlay');
  const closeBtn = document.getElementById('btn-player-close');
  
  const close = () => {
    overlay.style.display = 'none';
    document.getElementById('player-iframe-root').innerHTML = ''; // Stop stream
  };
  
  closeBtn.addEventListener('click', close);
  
  // Click overlay background to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  
}

function openPlayer(review) {
  const overlay = document.getElementById('player-overlay');
  const titleSpan = document.getElementById('player-window-title');
  const iframeContainer = document.getElementById('player-iframe-root');
  
  titleSpan.textContent = `${review.title} (${review.year}) - Cureus Player`;
  
  // Format embed URL
  const embedUrl = `https://www.vidking.net/embed/movie/${review.tmdb_id}?autoPlay=true`;
  
  // Inject Iframe
  iframeContainer.innerHTML = `
    <iframe 
      id="stream-frame"
      src="${embedUrl}"
      allow="autoplay; fullscreen" 
      allowfullscreen
      title="${escapeHtml(review.title)} playback stream">
    </iframe>
  `;
  
  overlay.style.display = 'flex';
}

// --- Reviewer Application Dialog Box Parody ---
function setupReviewerModal() {
  const overlay = document.getElementById('reviewer-overlay');
  const closeBtn = document.getElementById('btn-apply-close');
  const form = document.getElementById('apply-form');
  const processing = document.getElementById('apply-processing');
  const success = document.getElementById('apply-success');
  const okBtn = document.getElementById('btn-apply-ok');
  const progressBar = document.getElementById('apply-progress-bar');
  const statusText = document.getElementById('apply-status-text');

  const close = () => {
    overlay.style.display = 'none';
    // Reset dialogue states
    form.style.display = 'block';
    processing.style.display = 'none';
    success.style.display = 'none';
    progressBar.style.width = '0%';
    form.reset();
  };

  closeBtn.addEventListener('click', close);
  okBtn.addEventListener('click', close);

  // Handle form submit with parodied progress bar loading
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Transition display to transmission pane
    form.style.display = 'none';
    processing.style.display = 'block';
    progressBar.style.width = '0%';
    
    // Animate progress text over ticks
    statusText.textContent = 'Connecting to dial-up server...';
    
    setTimeout(() => {
      statusText.textContent = 'Handshaking (Beep-boop-kzzzzt-shhhhhh)...';
      progressBar.style.width = '35%';
    }, 700);

    setTimeout(() => {
      statusText.textContent = 'Uploading taste coefficients to mainframe...';
      progressBar.style.width = '70%';
    }, 1600);

    setTimeout(() => {
      statusText.textContent = 'Validating aesthetic standards...';
      progressBar.style.width = '95%';
    }, 2500);

    setTimeout(() => {
      progressBar.style.width = '100%';
      processing.style.display = 'none';
      success.style.display = 'block';
    }, 3200);
  });
}

function openReviewerModal() {
  const overlay = document.getElementById('reviewer-overlay');
  overlay.style.display = 'flex';
}

// --- Spotlight Movie Search Overlay (Cmd+K) ---
function setupSpotlightSearch() {
  const overlay = document.getElementById('spotlight-overlay');
  const input = document.getElementById('spotlight-input');
  const results = document.getElementById('spotlight-results');
  const settings = document.getElementById('spotlight-settings');
  const statusLeft = document.getElementById('spotlight-status-left');
  const statusRight = document.getElementById('spotlight-status-right');

  const SEARCH_FAST_LIMIT = 30;
  let searchTimer = null;
  let curatedIds = new Set();

  // TMDB genre ID mapping for result labels
  const GENRE_NAMES = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
  };

  // Load curated movie IDs from our DB
  async function loadCuratedIds() {
    try {
      const reviews = await fetchReviews();
      curatedIds = new Set(reviews.map(r => Number(r.tmdb_id)));
    } catch {}
  }
  loadCuratedIds();

  function getSearchCount() {
    return parseInt(sessionStorage.getItem('cureus_search_count') || '0');
  }

  function incrementSearchCount() {
    const count = getSearchCount() + 1;
    sessionStorage.setItem('cureus_search_count', String(count));
    return count;
  }

  function getTmdbToken() {
    const custom = sessionStorage.getItem('cureus_custom_tmdb_token');
    return custom || import.meta.env.VITE_TMDB_ACCESS_TOKEN;
  }

  function isSlowMode() {
    return getSearchCount() >= SEARCH_FAST_LIMIT;
  }

  // Open / Close
  function openSpotlight() {
    overlay.style.display = 'flex';
    input.value = '';
    results.innerHTML = '<div class="spotlight-empty">Start typing to search movies from TMDB</div>';
    settings.style.display = 'none';
    results.style.display = 'flex';
    document.getElementById('spotlight-menu-search').style.fontWeight = 'bold';
    document.getElementById('spotlight-menu-settings').style.fontWeight = 'normal';
    updateStatus();
    setTimeout(() => input.focus(), 100);
  }

  function closeSpotlight() {
    overlay.style.display = 'none';
    clearTimeout(searchTimer);
  }

  function updateStatus() {
    const count = getSearchCount();
    const slow = isSlowMode();
    if (slow) {
      statusLeft.textContent = '\u26A0\uFE0F Slow mode - ' + count + ' searches used. Add your own TMDB token in Settings for full speed.';
    } else {
      statusLeft.textContent = (SEARCH_FAST_LIMIT - count) + ' fast searches remaining';
    }
    const hasCustom = sessionStorage.getItem('cureus_custom_tmdb_token');
    statusRight.textContent = hasCustom ? 'TMDB (custom token)' : 'TMDB';
  }

  // Search
  async function performSearch(query) {
    if (query.length < 2) {
      results.innerHTML = '<div class="spotlight-empty">Type at least 2 characters</div>';
      return;
    }

    const token = getTmdbToken();
    if (!token) {
      results.innerHTML = '<div class="spotlight-error">No TMDB token configured. Add one in Settings.</div>';
      return;
    }

    results.innerHTML = '<div class="spotlight-loading">Searching movies...</div>';

    try {
      const response = await fetch(
        'https://api.themoviedb.org/3/search/movie?query=' + encodeURIComponent(query) + '&include_adult=false',
        { headers: { accept: 'application/json', Authorization: 'Bearer ' + token } }
      );

      if (!response.ok) throw new Error('TMDB responded with ' + response.status);

      const data = await response.json();
      const movies = data.results || [];

      incrementSearchCount();
      updateStatus();
      renderResults(movies);
    } catch (err) {
      results.innerHTML = '<div class="spotlight-error">Search failed: ' + escapeHtml(err.message) + '</div>';
    }
  }

  function renderResults(movies) {
    if (movies.length === 0) {
      results.innerHTML = '<div class="spotlight-empty">No movies found</div>';
      return;
    }

    let html = '';

    if (isSlowMode()) {
      html += '<div class="spotlight-slow-notice">\u26A0\uFE0F Slow mode active - searches are delayed to protect API quota. Add your own TMDB token in Settings for full speed.</div>';
    }

    movies.forEach(function (movie) {
      const title = movie.title || 'Unknown';
      const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
      const posterPath = movie.poster_path;
      const posterSrc = posterPath
        ? 'https://image.tmdb.org/t/p/w92' + escapeHtml(posterPath)
        : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="46" height="69"><rect width="100%" height="100%" fill="%23ccc"/></svg>';
      const isCurated = curatedIds.has(Number(movie.id));
      const badge = isCurated ? '<span class="spotlight-curated-badge">[CURATED]</span>' : '';

      const genreLabels = (movie.genre_ids || [])
        .map(function (id) { return GENRE_NAMES[id]; })
        .filter(Boolean)
        .join(', ') || 'Movie';

      html += '<div class="spotlight-result-card" data-tmdb-id="' + movie.id + '" data-title="' + escapeHtml(title) + '" data-year="' + escapeHtml(year) + '">' +
        '<img src="' + posterSrc + '" alt="' + escapeHtml(title) + '" loading="lazy">' +
        '<div class="spotlight-result-info">' +
        '<div class="spotlight-result-title">' + escapeHtml(title) + ' <span style="font-size:0.9rem;color:var(--paint-shadow-dark);">(' + escapeHtml(year) + ')</span>' + badge + '</div>' +
        '<div class="spotlight-result-meta">' + escapeHtml(genreLabels) + '</div>' +
        '</div>' +
        '<button class="clumsy-btn spotlight-play-btn">\u25B6 Play</button>' +
        '</div>';
    });

    results.innerHTML = html;

    // Wire play buttons
    results.querySelectorAll('.spotlight-play-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const card = btn.closest('.spotlight-result-card');
        const tmdbId = parseInt(card.dataset.tmdbId, 10);
        const title = card.dataset.title;
        const year = card.dataset.year;

        // Find matching review for rich player experience
        const review = allReviews.find(function (r) { return Number(r.tmdb_id) === tmdbId; });
        if (review) {
          openPlayer(review);
        } else {
          openPlayer({
            tmdb_id: tmdbId,
            title: title,
            year: year || null,
            reviewer: 'Cureus',
            rating: 0,
            review: '',
            genres: [],
            poster: null
          });
        }
        closeSpotlight();
      });
    });
  }

  // --- Event wiring ---

  // Close button
  document.getElementById('btn-spotlight-close').addEventListener('click', closeSpotlight);

  // Click backdrop to close
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeSpotlight();
  });

  // Escape closes spotlight
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.style.display === 'flex') {
      closeSpotlight();
    }
  });

  // Cmd+K / Ctrl+K global trigger
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSpotlight();
    }
  });

  // Search input with debounce
  input.addEventListener('input', function () {
    clearTimeout(searchTimer);
    const query = input.value.trim();

    if (query.length < 2) {
      results.innerHTML = '<div class="spotlight-empty">Type at least 2 characters</div>';
      return;
    }

    const delay = isSlowMode() ? 2000 : 300;

    searchTimer = setTimeout(function () { performSearch(query); }, delay);
  });

  // Settings toggle
  document.getElementById('spotlight-menu-settings').addEventListener('click', function () {
    const show = settings.style.display !== 'block';
    settings.style.display = show ? 'block' : 'none';
    results.style.display = show ? 'none' : 'flex';
    document.getElementById('spotlight-menu-search').style.fontWeight = show ? 'normal' : 'bold';
    document.getElementById('spotlight-menu-settings').style.fontWeight = show ? 'bold' : 'normal';

    if (show) {
      const existing = sessionStorage.getItem('cureus_custom_tmdb_token');
      document.getElementById('spotlight-token-input').value = existing || '';
    }
  });

  // Token save
  document.getElementById('btn-spotlight-token-save').addEventListener('click', function () {
    const token = document.getElementById('spotlight-token-input').value.trim();
    if (token) {
      sessionStorage.setItem('cureus_custom_tmdb_token', token);
      updateStatus();
      alert('Custom TMDB token saved for this session.');
    } else {
      alert('Please paste a valid TMDB API Read Access Token.');
    }
  });

  // Token clear
  document.getElementById('btn-spotlight-token-clear').addEventListener('click', function () {
    sessionStorage.removeItem('cureus_custom_tmdb_token');
    document.getElementById('spotlight-token-input').value = '';
    updateStatus();
  });

  // Expose so menu/toolbar buttons can call it
  window.openSpotlight = openSpotlight;
}

// Export functions for other scripts (like admin.js)
window.loadReviews = loadReviews;
