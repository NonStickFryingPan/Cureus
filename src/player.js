/**
 * Cureus — Player Module
 *
 * Manages the fullscreen overlay that embeds the streaming player.
 * Opens on "Watch Now", closes on ESC or backdrop click.
 */

const overlay  = document.getElementById('player-overlay');
const iframe   = document.getElementById('player-iframe');
const titleEl  = document.getElementById('player-title');
const closeBtn = document.getElementById('player-close');
const backdrop = overlay?.querySelector('.player-backdrop');

/**
 * Open the player overlay with the given embed URL and title.
 * @param {string} embedSrc - Full iframe src URL
 * @param {string} title    - Human-readable title shown in header
 */
export function openPlayer(embedSrc, title) {
  if (!overlay || !iframe) return;

  titleEl.textContent = title;
  iframe.src = embedSrc;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  closeBtn?.focus();
}

/**
 * Close the player and stop the iframe.
 */
export function closePlayer() {
  if (!overlay) return;

  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  // Give close animation time before nuking src
  setTimeout(() => {
    if (iframe) iframe.src = '';
    if (titleEl) titleEl.textContent = '';
  }, 300);
}

/**
 * Wire up player events (ESC key + backdrop click).
 * Call once on boot.
 */
export function initPlayer() {
  if (!overlay) return;

  // Close on backdrop click
  backdrop?.addEventListener('click', closePlayer);

  // Close on close button
  closeBtn?.addEventListener('click', closePlayer);

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closePlayer();
    }
  });
}
