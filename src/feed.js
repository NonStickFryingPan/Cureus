/**
 * Cureus — Feed Renderer
 *
 * Renders cards into the feed container and sets up:
 * - CSS snap scroll behaviour
 * - Watch Now button delegation
 * - Expand/collapse review text
 * - Next card poster preloading
 */

import { renderCard } from './card.js';
import { openPlayer } from './player.js';

const feed = document.getElementById('feed');

/**
 * Render all reviews into the feed.
 * Replaces any existing cards.
 *
 * @param {Array} reviews - Shuffled review array
 */
export function renderFeed(reviews) {
  if (!feed) return;

  if (reviews.length === 0) {
    feed.innerHTML = `
      <div class="error-state">
        <div class="error-state-icon">🎬</div>
        <p>No reviews match this filter.</p>
      </div>
    `;
    return;
  }

  const total = reviews.length;

  // Build HTML for all cards
  feed.innerHTML = reviews
    .map((r, i) => renderCard(r, i, total))
    .join('');

  // Add scroll hint on first render
  addScrollHint();

  // Wire up interactions
  bindWatchButtons();
  bindReviewToggle();
  setupPosterPreload();
  initDrawingLayer();
}

/**
 * Bind all Watch Now buttons via event delegation.
 */
function bindWatchButtons() {
  // Remove old listener if any
  feed.removeEventListener('click', handleWatchClick);
  feed.addEventListener('click', handleWatchClick);
}

function handleWatchClick(e) {
  const btn = e.target.closest('.btn-watch');
  if (!btn) return;

  const title = decodeURIComponent(btn.dataset.title || '');
  const tmdbId = btn.dataset.tmdbId;
  const type = btn.dataset.type;

  const src = type === 'movie'
    ? `https://www.vidking.net/embed/movie/${tmdbId}?autoPlay=true`
    : `https://www.vidking.net/embed/tv/${tmdbId}/1/1?autoPlay=true`;

  openPlayer(src, title);
}

/**
 * Bind review expand/collapse toggles.
 */
function bindReviewToggle() {
  feed.removeEventListener('click', handleToggleClick);
  feed.addEventListener('click', handleToggleClick);
}

function handleToggleClick(e) {
  const toggle = e.target.closest('.card-review-toggle');
  if (!toggle) return;

  const reviewEl = toggle.previousElementSibling;
  if (!reviewEl) return;

  const isExpanded = reviewEl.dataset.expanded === 'true';

  if (isExpanded) {
    reviewEl.textContent = decodeURIComponent(reviewEl.dataset.short || '');
    reviewEl.dataset.expanded = 'false';
    toggle.textContent = 'Read more ↓';
  } else {
    reviewEl.textContent = decodeURIComponent(reviewEl.dataset.full || '');
    reviewEl.dataset.expanded = 'true';
    toggle.textContent = 'Read less ↑';
  }
}

/**
 * Preload the next card's poster as the user scrolls.
 * Uses IntersectionObserver to detect the current card.
 */
function setupPosterPreload() {
  const cards = feed.querySelectorAll('.card[data-id]');
  if (!cards.length) return;

  // Disconnect any previous observer
  if (window._cureusObserver) {
    window._cureusObserver.disconnect();
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // Find the next card's poster and preload it
        const next = entry.target.nextElementSibling;
        if (!next) return;

        const nextImg = next.querySelector('.poster-img');
        if (nextImg && nextImg.dataset.nextSrc) {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'image';
          link.href = nextImg.dataset.nextSrc;
          document.head.appendChild(link);
        }
      });
    },
    { root: feed, threshold: 0.5 }
  );

  cards.forEach((c) => observer.observe(c));
  window._cureusObserver = observer;
}

/**
 * Append a one-time scroll hint arrow at the bottom of the viewport.
 */
function addScrollHint() {
  // Remove previous hint
  const old = document.querySelector('.scroll-hint');
  if (old) old.remove();

  const hint = document.createElement('div');
  hint.className = 'scroll-hint';
  hint.innerHTML = `
    <span class="scroll-hint-arrow">↓</span>
    <span class="scroll-hint-label">Scroll</span>
  `;
  document.body.appendChild(hint);
}

/**
 * Wire up interactive MS Paint drawing capabilities on the canvas base layers.
 */
function initDrawingLayer() {
  const canvases = feed.querySelectorAll('.paint-drawing-layer');
  if (!canvases.length) return;

  canvases.forEach((canvas) => {
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // Synchronize canvas buffer resolution with CSS display dimensions
    function resizeCanvas() {
      try {
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        if (width === 0 || height === 0) return; // Skip resizing if not visible yet

        // Create a temporary backup of drawn contents before resizing cleans it
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx && tempCanvas.width > 0 && tempCanvas.height > 0 && canvas.width > 0 && canvas.height > 0) {
          tempCtx.drawImage(canvas, 0, 0);
        }

        canvas.width = width;
        canvas.height = height;

        // Restore drawn contents
        if (ctx && tempCanvas.width > 0 && tempCanvas.height > 0 && canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(tempCanvas, 0, 0);
        }
      } catch (err) {
        console.warn('Canvas resize backup failed:', err);
      }
    }

    // Call resize on init and window resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Event listeners
    canvas.addEventListener('mousedown', (e) => {
      const activeToolBtn = document.querySelector('.tool-btn.active');
      const activeTool = activeToolBtn ? activeToolBtn.dataset.tool : 'select';

      // Selection tools do not draw
      if (activeTool === 'select' || activeTool === 'scissors') return;

      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;

      const activeColor = getActiveColor();

      if (activeTool === 'fill') {
        ctx.fillStyle = activeColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        isDrawing = false;
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;

      const activeToolBtn = document.querySelector('.tool-btn.active');
      const activeTool = activeToolBtn ? activeToolBtn.dataset.tool : 'select';
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const activeColor = getActiveColor();
      const activeWidth = getActiveLineWidth();

      ctx.beginPath();
      
      if (activeTool === 'pencil') {
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (activeTool === 'brush') {
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = activeWidth * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (activeTool === 'eraser') {
        ctx.strokeStyle = '#ffffff'; // erase to white background
        ctx.lineWidth = activeWidth * 4;
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (activeTool === 'spray') {
        ctx.fillStyle = activeColor;
        const radius = activeWidth * 3;
        for (let i = 0; i < 12; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * radius;
          const dotX = x + Math.cos(angle) * dist;
          const dotY = y + Math.sin(angle) * dist;
          ctx.fillRect(dotX, dotY, 1.5, 1.5);
        }
      }

      lastX = x;
      lastY = y;
    });

    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseleave', () => isDrawing = false);
  });
}

// Helpers
function getActiveColor() {
  const fgColorEl = document.getElementById('active-fg-color');
  if (fgColorEl) {
    return fgColorEl.style.backgroundColor || '#000000';
  }
  return '#000000';
}

function getActiveLineWidth() {
  const activeLineWidthBtn = document.querySelector('.line-width-option.active');
  if (!activeLineWidthBtn) return 2;
  if (activeLineWidthBtn.classList.contains('thick')) return 8;
  if (activeLineWidthBtn.classList.contains('medium')) return 4;
  return 2;
}
