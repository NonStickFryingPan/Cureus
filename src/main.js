/**
 * Cureus — Main Boot
 *
 * Entry point for the public feed site.
 * Fetches all reviews from Supabase, shuffles them,
 * renders the feed, and sets up the genre filter.
 */

import { fetchReviews } from './supabase.js';
import { renderFeed } from './feed.js';
import { initFilter, shuffle } from './filter.js';
import { initPlayer } from './player.js';

const feed = document.getElementById('feed');

async function boot() {
  // Init player overlay events
  initPlayer();

  // Fetch from Supabase
  const { data, error } = await fetchReviews();

  if (error) {
    console.error('Failed to load reviews:', error);
    feed.innerHTML = `
      <div class="error-state">
        <div class="error-state-icon">⚠️</div>
        <p>Could not load reviews. Please try again later.</p>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    feed.innerHTML = `
      <div class="error-state">
        <div class="error-state-icon">🎬</div>
        <p>No reviews yet. Check back soon.</p>
      </div>
    `;
    return;
  }

  // Shuffle on every page load
  const shuffled = shuffle([...data]);

  // Render feed
  renderFeed(shuffled);

  // Init genre filter — re-render on filter change
  initFilter(data, (filtered) => {
    renderFeed(filtered);
  });
}

boot();
