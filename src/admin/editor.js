/**
 * Cureus — Admin Review Editor
 *
 * Handles the review creation / editing form in the admin dashboard.
 * Integrates with TMDB search for metadata auto-fill.
 */

import { posterUrl, searchMulti, fetchGenres, resolveGenres } from './tmdb.js';
import { createReview, updateReview, deleteReview, fetchReviews } from '../supabase.js';

let currentResult = null;     // Currently selected TMDB result
let editingId = null;         // UUID if editing an existing review
let genreList = [];           // Cached TMDB genre list

// DOM refs (set on init)
const $ = (sel) => document.querySelector(sel);

const form = {
  searchInput: null,
  searchResults: null,
  title: null,
  year: null,
  posterPreview: null,
  posterPath: null,
  type: null,
  genres: null,
  tmdbId: null,
  review: null,
  reviewer: null,
  rating: null,
  saveBtn: null,
  cancelBtn: null,
};

/**
 * Initialize the editor with DOM references.
 * @param {object} refs - DOM element references
 */
export async function initEditor(refs) {
  Object.assign(form, refs);

  // Load genre list from TMDB
  try {
    genreList = await fetchGenres();
  } catch (err) {
    console.warn('Failed to load genre list:', err.message);
    genreList = [];
  }

  // Bind events
  form.searchInput.addEventListener('input', debounce(onSearch, 400));
  form.saveBtn.addEventListener('click', onSave);
  if (form.cancelBtn) {
    form.cancelBtn.addEventListener('click', onCancel);
  }
}

/**
 * Handle TMDB search as user types.
 */
async function onSearch() {
  const query = form.searchInput.value.trim();
  const container = form.searchResults;

  if (query.length < 2) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  container.innerHTML = '<div class="search-hint">Searching…</div>';

  try {
    const results = await searchMulti(query);

    if (results.length === 0) {
      container.innerHTML = '<div class="search-hint">No results found.</div>';
      return;
    }

    container.innerHTML = results
      .map((r) => {
        const label = r.media_type === 'movie' ? r.title : r.name;
        const year = r.media_type === 'movie'
          ? (r.release_date || '').slice(0, 4)
          : (r.first_air_date || '').slice(0, 4);
        const img = r.poster_path
          ? `<img src="${posterUrl(r.poster_path, 'w92')}" alt="" class="search-poster" />`
          : '<div class="search-poster-empty">No Poster</div>';

        return `
          <button type="button" class="search-result-item" data-tmdb-id="${r.id}" data-media-type="${r.media_type}">
            ${img}
            <div class="search-result-info">
              <strong>${label}</strong>
              <span>${year} · ${r.media_type === 'movie' ? 'Movie' : 'TV'}</span>
            </div>
          </button>
        `;
      })
      .join('');

    // Bind click on results
    container.querySelectorAll('.search-result-item').forEach((btn) => {
      btn.addEventListener('click', () =>
        selectResult(
          parseInt(btn.dataset.tmdbId),
          btn.dataset.mediaType
        )
      );
    });
  } catch (err) {
    container.innerHTML = `<div class="search-hint error">${err.message}</div>`;
  }
}

/**
 * Select a TMDB result and populate the form.
 */
async function selectResult(tmdbId, mediaType) {
  // Find the result from the search results (we already have it in the DOM data)
  const items = form.searchResults.querySelectorAll('.search-result-item');
  let selectedData = null;

  // We need to re-fetch since we only have minimal data in the DOM
  try {
    const results = await searchMulti(form.searchInput.value.trim());
    selectedData = results.find((r) => r.id === tmdbId && r.media_type === mediaType);
  } catch (err) {
    console.error('Failed to get result details:', err);
    return;
  }

  if (!selectedData) return;

  currentResult = selectedData;

  const label = mediaType === 'movie' ? selectedData.title : selectedData.name;
  const year = mediaType === 'movie'
    ? (selectedData.release_date || '').slice(0, 4)
    : (selectedData.first_air_date || '').slice(0, 4);

  form.title.value = label || '';
  form.year.value = year || '';
  form.tmdbId.value = tmdbId;
  form.type.value = mediaType;
  form.posterPath.value = selectedData.poster_path || '';
  form.genres.value = resolveGenres(selectedData.genre_ids || [], genreList).join(', ');

  // Show poster preview
  if (selectedData.poster_path) {
    form.posterPreview.innerHTML = `<img src="${posterUrl(selectedData.poster_path, 'w342')}" alt="Poster preview" class="poster-preview-img" />`;
    form.posterPreview.classList.remove('hidden');
  } else {
    form.posterPreview.innerHTML = '<div class="poster-preview-empty">No poster available</div>';
    form.posterPreview.classList.remove('hidden');
  }

  // Hide search results
  form.searchResults.classList.add('hidden');

  // Scroll to form
  form.saveBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Save the review to Supabase (create or update).
 */
async function onSave() {
  const reviewData = {
    tmdb_id: parseInt(form.tmdbId.value),
    type: form.type.value,
    title: form.title.value.trim(),
    year: form.year.value ? parseInt(form.year.value) : null,
    poster: form.posterPath.value,
    genres: form.genres.value.split(',').map((g) => g.trim()).filter(Boolean),
    review: form.review.value.trim(),
    reviewer: form.reviewer.value.trim(),
    rating: parseInt(form.rating.value),
  };

  // Validate
  if (!reviewData.title) return alert('Title is required.');
  if (!reviewData.review) return alert('Review text is required.');
  if (!reviewData.reviewer) return alert('Reviewer name is required.');
  if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
    return alert('Rating must be between 1 and 5.');
  }

  form.saveBtn.disabled = true;
  form.saveBtn.textContent = 'Saving…';

  try {
    let result;
    if (editingId) {
      result = await updateReview(editingId, reviewData);
    } else {
      result = await createReview(reviewData);
    }

    if (result.error) {
      alert(`Failed to save: ${result.error.message}`);
      return;
    }

    resetForm();
    alert('Review saved!');
  } catch (err) {
    alert(`Unexpected error: ${err.message}`);
  } finally {
    form.saveBtn.disabled = false;
    form.saveBtn.textContent = editingId ? 'Update Review' : 'Save Review';
  }
}

/**
 * Cancel editing / clear form.
 */
function onCancel() {
  resetForm();
}

/**
 * Reset the form to empty state.
 */
export function resetForm() {
  editingId = null;
  currentResult = null;
  form.searchInput.value = '';
  form.searchResults.innerHTML = '';
  form.searchResults.classList.add('hidden');
  form.title.value = '';
  form.year.value = '';
  form.posterPreview.innerHTML = '';
  form.posterPreview.classList.add('hidden');
  form.posterPath.value = '';
  form.type.value = 'movie';
  form.genres.value = '';
  form.tmdbId.value = '';
  form.review.value = '';
  form.reviewer.value = '';
  form.rating.value = '5';
  form.saveBtn.textContent = 'Save Review';
  if (form.cancelBtn) form.cancelBtn.classList.add('hidden');
}

/**
 * Load an existing review into the form for editing.
 * @param {object} review - Review object from Supabase
 */
export function loadForEdit(review) {
  editingId = review.id;
  currentResult = { id: review.tmdb_id, media_type: review.type };

  form.tmdbId.value = review.tmdb_id;
  form.type.value = review.type;
  form.title.value = review.title;
  form.year.value = review.year || '';
  form.posterPath.value = review.poster || '';
  form.genres.value = (review.genres || []).join(', ');
  form.review.value = review.review;
  form.reviewer.value = review.reviewer;
  form.rating.value = review.rating;

  if (review.poster) {
    form.posterPreview.innerHTML = `<img src="${posterUrl(review.poster, 'w342')}" alt="Poster preview" class="poster-preview-img" />`;
    form.posterPreview.classList.remove('hidden');
  }

  form.saveBtn.textContent = 'Update Review';
  if (form.cancelBtn) form.cancelBtn.classList.remove('hidden');
}

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
