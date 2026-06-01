import { supabase } from './supabase.js';

// --- Application State (Functional Pattern) ---
let allReviews = [];
let filteredReviews = [];
let currentGenre = null;
let activeTool = 'cursor'; // default pointer
let isDrawing = false;
let lastX = 0;
let lastY = 0;

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
  // Initial check
  setTimeout(handleRoute, 100);
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
  setTimeout(resize, 200);

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
    
    ctx.strokeStyle = '#000000';
    
    if (activeTool === 'pencil') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === 'spray') {
      // Classic MS Paint spray paint scatter
      ctx.fillStyle = '#000000';
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

  // Forward wheel scrolling events from canvas to scrollable feed viewport
  canvas.addEventListener('wheel', (e) => {
    if (canvas.style.pointerEvents !== 'none') {
      const viewport = document.getElementById('feed-view');
      if (viewport) {
        viewport.scrollBy({
          top: e.deltaY,
          behavior: 'auto'
        });
        e.preventDefault();
      }
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
}

// --- Supabase Data Loading ---
async function loadReviews() {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allReviews = data || [];
    
    // Derive unique genres
    const uniqueGenres = new Set();
    allReviews.forEach(r => {
      if (Array.isArray(r.genres)) {
        r.genres.forEach(g => uniqueGenres.add(g));
      }
    });
    
    // Set up Palette bar with unique genres
    renderGenrePalette(Array.from(uniqueGenres));

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
  const seenStr = sessionStorage.getItem('cureus_seen_ids');
  return seenStr ? JSON.parse(seenStr) : [];
}

function markAsSeen(id) {
  const seen = getSeenIds();
  if (!seen.includes(id)) {
    seen.push(id);
    sessionStorage.setItem('cureus_seen_ids', JSON.stringify(seen));
  }
}

// --- Shuffle & Filtering Engine ---
function shuffleAndRender() {
  const seenIds = getSeenIds();
  
  // Filter by genre
  let filtered = allReviews;
  if (currentGenre) {
    filtered = allReviews.filter(r => r.genres && r.genres.includes(currentGenre));
  }

  // Deduplicate by tmdb_id to prevent duplicate movie/TV cards in the feed
  const seenTmdbIds = new Set();
  const deduped = [];
  filtered.forEach(r => {
    if (!seenTmdbIds.has(r.tmdb_id)) {
      seenTmdbIds.add(r.tmdb_id);
      deduped.push(r);
    }
  });
  
  // Split into unseen and seen
  const unseen = deduped.filter(r => !seenIds.includes(r.id));
  const seen = deduped.filter(r => seenIds.includes(r.id));
  
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
            Nothing curated for genre: <strong>${currentGenre}</strong> yet!
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
      ? r.genres.map(g => `<span class="genre-pill">${g}</span>`).join('')
      : '';
      
    // Stars
    const starStr = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    
    // Truncated review text
    const shouldTruncate = r.review.length > 280;
    const displayText = shouldTruncate ? r.review.slice(0, 280) : r.review;
    
    // Build card HTML
    card.innerHTML = `
      <div class="review-left">
        <h2 class="review-title">${r.title}</h2>
        <div class="review-meta">
          <span>(${r.year})</span>
          <span class="review-stars" title="${r.rating} stars">${starStr}</span>
        </div>
        <div class="review-genres">${genreSpans}</div>
        <div class="reviewer-name">Reviewed by: ${r.reviewer} ${r.type === 'tv' ? `(S${r.season}E${r.episode})` : ''}</div>
        
        <div class="review-text-container">
          <p class="review-text">${displayText}${shouldTruncate ? `<button class="read-more-btn" data-id="${r.id}" id="btn-more-${r.id}">...more</button>` : ''}</p>
        </div>

        <button class="clumsy-btn watch-now-btn" id="btn-watch-${r.id}" data-id="${r.id}">
          ▶ Watch Now
        </button>
      </div>
      
      <div class="review-right">
        <div class="poster-wrapper">
          <img class="poster-image" src="https://image.tmdb.org/t/p/w500${r.poster}" alt="${r.title} Poster" loading="lazy">
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
      sessionStorage.removeItem('cureus_seen_ids');
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
        textContainer.innerHTML = `<p class="review-text">${reviewObj.review}</p>`;
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
  const cards = document.querySelectorAll('.review-card[data-id]');
  
  const observer = new IntersectionObserver((entries) => {
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
  
  cards.forEach(card => observer.observe(card));
}

// --- Dynamic Genre Palette Renderer ---
function renderGenrePalette(genres) {
  const paletteGrid = document.getElementById('genre-palette-grid');
  paletteGrid.innerHTML = '';

  // Add a special 'ALL' color box (Gray standard Paint color)
  const allBox = document.createElement('div');
  allBox.className = `color-box ${currentGenre === null ? 'active' : ''}`;
  allBox.style.backgroundColor = '#808080';
  allBox.title = 'Show All Genres';
  allBox.innerHTML = `<span class="color-label">All Genres</span>`;
  allBox.id = 'color-box-all';
  
  allBox.addEventListener('click', () => {
    currentGenre = null;
    document.querySelectorAll('.color-box').forEach(b => b.classList.remove('active'));
    allBox.classList.add('active');
    
    // Update active color blocks
    document.querySelector('.selected-color-indicator').style.backgroundColor = '#808080';
    document.getElementById('status-selected-genre').textContent = 'Filter: NONE';
    
    shuffleAndRender();
  });
  
  paletteGrid.appendChild(allBox);

  // Render derived DB genres
  genres.forEach((genre, index) => {
    const color = paintColors[index % paintColors.length];
    
    const box = document.createElement('div');
    box.className = `color-box ${currentGenre === genre ? 'active' : ''}`;
    box.style.backgroundColor = color;
    box.title = `Filter by: ${genre}`;
    box.innerHTML = `<span class="color-label">${genre}</span>`;
    box.id = `color-box-${genre.toLowerCase().replace(/\s+/g, '-')}`;
    
    box.addEventListener('click', () => {
      currentGenre = genre;
      document.querySelectorAll('.color-box').forEach(b => b.classList.remove('active'));
      box.classList.add('active');
      
      // Update selected color indicator block
      document.querySelector('.selected-color-indicator').style.backgroundColor = color;
      document.getElementById('status-selected-genre').textContent = `Filter: ${genre.toUpperCase()}`;
      
      shuffleAndRender();
    });
    
    paletteGrid.appendChild(box);
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
  
  // ESC key to close modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

function openPlayer(review) {
  const overlay = document.getElementById('player-overlay');
  const titleSpan = document.getElementById('player-window-title');
  const iframeContainer = document.getElementById('player-iframe-root');
  
  titleSpan.textContent = `VidKing Stream: ${review.title} (${review.year}) - Paint Player`;
  
  // Format VidKing URLs
  let embedUrl = '';
  if (review.type === 'movie') {
    embedUrl = `https://www.vidking.net/embed/movie/${review.tmdb_id}?autoPlay=true`;
  } else if (review.type === 'tv') {
    embedUrl = `https://www.vidking.net/embed/tv/${review.tmdb_id}/${review.season || 1}/${review.episode || 1}?autoPlay=true`;
  }
  
  // Inject Iframe
  iframeContainer.innerHTML = `
    <iframe 
      id="vidking-stream-frame"
      src="${embedUrl}" 
      allow="autoplay; fullscreen" 
      allowfullscreen
      title="${review.title} playback stream">
    </iframe>
  `;
  
  overlay.style.display = 'flex';
}

// Export functions for other scripts (like admin.js)
window.loadReviews = loadReviews;
