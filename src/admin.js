import { supabase } from './supabase.js';
import { fetchReviews, saveReview, deleteReview } from './db.js';
import { escapeHtml } from './utils.js';

let isSubmitting = false;

// TMDB Genre ID lookup map
const TMDB_GENRES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};

// Admin State
let session = null;
let currentReviews = [];
let initialized = false;

// --- Initialize Admin System ---
export async function initAdmin() {
  if (initialized) {
    checkSessionAndUI();
    return;
  }
  
  initialized = true;
  setupAuthListeners();
  setupSearchActions();
  setupFormSubmit();
  setupLogoutAction();
  
  // Verify initial session
  const { data } = await supabase.auth.getSession();
  session = data.session;
  checkSessionAndUI();
}

// --- Auth State Handlers ---
function setupAuthListeners() {
  // Listen to Supabase auth changes
  supabase.auth.onAuthStateChange((event, newSession) => {
    session = newSession;
    checkSessionAndUI();
  });
  
  // Close Auth Modal
  document.getElementById('btn-auth-close').addEventListener('click', () => {
    document.getElementById('auth-overlay').style.display = 'none';
    window.location.hash = ''; // Send home
  });

  // Login form submission
  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorDiv = document.getElementById('auth-error-message');
    const submitBtn = document.getElementById('btn-auth-submit');
    
    errorDiv.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Authenticating...';

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Success will trigger session listener
    } catch (err) {
      console.error('Auth error:', err);
      errorDiv.textContent = err.message || 'Authentication failed.';
      errorDiv.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '🔑 Authenticate';
    }
  });
}

function checkSessionAndUI() {
  const authOverlay = document.getElementById('auth-overlay');
  const logoutBtn = document.getElementById('btn-menu-logout');
  const statusEditor = document.getElementById('status-editor');
  
  if (window.location.hash !== '#admin') {
    authOverlay.style.display = 'none';
    return;
  }

  if (!session) {
    // Show login overlay
    authOverlay.style.display = 'flex';
    logoutBtn.style.display = 'none';
    statusEditor.textContent = 'Editor: Guest';
  } else {
    // Authenticated
    authOverlay.style.display = 'none';
    logoutBtn.style.display = 'block';
    statusEditor.textContent = `Editor: ${session.user.email}`;
    
    // Load admin lists
    loadAdminReviewsList();
  }
}

function setupLogoutAction() {
  document.getElementById('btn-menu-logout').addEventListener('click', async (e) => {
    e.preventDefault();
    if (confirm('Logout as administrator?')) {
      await supabase.auth.signOut();
      window.location.hash = '';
    }
  });
}

// --- Form Reset/Clear ---
function clearForm() {
  document.getElementById('form-review-id').value = '';
  document.getElementById('form-type').value = 'movie';
  document.getElementById('form-title').value = '';
  document.getElementById('form-tmdb-id').value = '';
  document.getElementById('form-year').value = '';
  document.getElementById('form-poster').value = '';
  document.getElementById('form-genres').value = '';
  document.getElementById('form-rating').value = '5';
  document.getElementById('form-reviewer').value = 'The TasteMaker';
  document.getElementById('form-review').value = '';
}

document.getElementById('btn-form-clear').addEventListener('click', clearForm);

// --- Form Submission (Save Review) ---
function setupFormSubmit() {
  document.getElementById('review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!session) return alert('You must be authenticated to curation reviews!');
    isSubmitting = true;

    const id = document.getElementById('form-review-id').value;
    const type = document.getElementById('form-type').value;
    const title = document.getElementById('form-title').value;
    const tmdb_id = parseInt(document.getElementById('form-tmdb-id').value, 10);
    const year = parseInt(document.getElementById('form-year').value, 10) || null;
    const poster = document.getElementById('form-poster').value;
    const rating = parseInt(document.getElementById('form-rating').value, 10);
    const reviewer = document.getElementById('form-reviewer').value;
    const review = document.getElementById('form-review').value;
    
    // Parse genres
    const genreStr = document.getElementById('form-genres').value;
    const genres = genreStr
      ? genreStr.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];
      
    const record = {
      tmdb_id,
      type: 'movie',
      title,
      year,
      poster,
      genres,
      rating,
      reviewer,
      review,
      season: null,
      episode: null
    };

    const submitBtn = document.getElementById('btn-form-save');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving review...';

    try {
      // Save review using deep DB module (handles insert or update internally)
      await saveReview({ ...record, id });
      alert(id ? 'Review updated successfully!' : 'Review created successfully!');

      clearForm();
      
      // Reload lists and refresh main feed
      await loadAdminReviewsList();
      if (window.loadReviews) {
        await window.loadReviews();
      }

    } catch (err) {
      console.error('Failed to save review:', err);
      alert('Error saving review to database: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Save Review';
      isSubmitting = false;
    }
  });
}

// --- Fetch and Display Database Reviews ---
async function loadAdminReviewsList() {
  const container = document.getElementById('admin-reviews-list');
  container.innerHTML = '<div style="font-size: 0.9rem; color:#888;">Fetching current library...</div>';
  
  try {
    // Fetch reviews using deep DB module
    currentReviews = await fetchReviews();
    container.innerHTML = '';
    
    if (currentReviews.length === 0) {
      container.innerHTML = '<div style="font-size: 0.9rem; color:#888;">No reviews in the database yet.</div>';
      return;
    }
    
    currentReviews.forEach(r => {
      const card = document.createElement('div');
      card.className = 'search-card';
      card.style.justifyContent = 'space-between';
      card.id = `admin-db-card-${r.id}`;
      
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      
      card.innerHTML = `
        <div style="display: flex; gap: 10px;">
          <img src="https://image.tmdb.org/t/p/w92${escapeHtml(r.poster)}" alt="Poster" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2292%22 height=%22138%22><rect width=%22100%%22 height=%22100%%22 fill=%22%23ccc%22/></svg>'">
          <div class="search-card-info">
            <div class="search-card-title">${escapeHtml(r.title)} <span style="font-size:0.9rem;">(${escapeHtml(r.year)})</span></div>
            <div class="search-card-meta">Movie | ${stars}</div>
            <div class="search-card-meta" style="font-style: italic;">By ${escapeHtml(r.reviewer)}</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; justify-content: center; gap: 5px;">
          <button class="clumsy-btn edit-db-btn" data-id="${r.id}" style="font-size: 1rem; padding: 2px 8px; background: #e0f0ff;" id="btn-edit-${r.id}">Edit</button>
          <button class="clumsy-btn delete-db-btn" data-id="${r.id}" style="font-size: 1rem; padding: 2px 8px; background: #ffe0e0;" id="btn-delete-${r.id}">Delete</button>
        </div>
      `;
      
      container.appendChild(card);
    });
    
    // Bind edit/delete clicks
    setupDbListListeners();

  } catch (err) {
    console.error('Error fetching admin reviews list:', err);
    container.innerHTML = '<div style="font-size: 0.9rem; color:#f00;">Error fetching database. Check logs.</div>';
  }
}

function setupDbListListeners() {
  // Edit review
  document.querySelectorAll('.edit-db-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const r = currentReviews.find(item => item.id === id);
      if (r) {
        document.getElementById('form-review-id').value = r.id;
        document.getElementById('form-type').value = r.type;
        document.getElementById('form-title').value = r.title;
        document.getElementById('form-tmdb-id').value = r.tmdb_id;
        document.getElementById('form-year').value = r.year || '';
        document.getElementById('form-poster').value = r.poster || '';
        document.getElementById('form-genres').value = r.genres ? r.genres.join(', ') : '';
        document.getElementById('form-rating').value = r.rating;
        document.getElementById('form-reviewer').value = r.reviewer;
        document.getElementById('form-review').value = r.review;
        
        // Scroll form into view
        document.getElementById('review-form').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Delete review
  document.querySelectorAll('.delete-db-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const r = currentReviews.find(item => item.id === id);
      if (r && confirm(`Are you absolutely sure you want to delete the review for "${r.title}"?`)) {
        try {
          await deleteReview(id);
          
          alert('Review deleted successfully.');
          
          // Reload
          await loadAdminReviewsList();
          if (window.loadReviews) {
            await window.loadReviews();
          }
        } catch (err) {
          console.error('Delete error:', err);
          alert('Could not delete review: ' + err.message);
        }
      }
    });
  });
}

// --- TMDB Search Integration ---
function setupSearchActions() {
  const searchBtn = document.getElementById('btn-tmdb-search');
  const searchInput = document.getElementById('input-tmdb-search');
  
  const performSearch = async () => {
    const query = searchInput.value.trim();
    if (!query) return;
    
    const indicator = document.getElementById('tmdb-search-indicator');
    const resultsContainer = document.getElementById('tmdb-results');
    
    indicator.style.display = 'block';
    resultsContainer.style.display = 'none';
    resultsContainer.innerHTML = '';
    
    try {
      // Ensure we have the absolute latest database reviews before rendering search results
      try {
        currentReviews = await fetchReviews();
      } catch (dbErr) {
        console.warn('Failed to refresh reviews for curation check:', dbErr);
      }

      const tmdbToken = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
      if (!tmdbToken) throw new Error('VITE_TMDB_ACCESS_TOKEN is missing in environment variables.');
      
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&include_adult=false`,
        {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${tmdbToken}`
          }
        }
      );
      
      if (!response.ok) throw new Error('TMDB Search Request failed.');
      
      const data = await response.json();
      const results = data.results || [];
      
      indicator.style.display = 'none';
      resultsContainer.style.display = 'flex';
      
      if (results.length === 0) {
        resultsContainer.innerHTML = '<div style="font-size: 0.9rem; padding: 10px; color: #888;">No results match query.</div>';
        return;
      }
      
      results.forEach(item => {
        const title = item.title;
        const type = 'movie';
        const date = item.release_date || '';
        const year = date ? date.split('-')[0] : 'N/A';
        const posterPath = item.poster_path || '';
        const cardId = `tmdb-result-card-${item.id}`;
        
        const card = document.createElement('div');
        card.className = 'search-card';
        card.id = cardId;

        // Check if this movie has already been curated in the library (using type-safe comparison)
        const existing = currentReviews.find(r => Number(r.tmdb_id) === Number(item.id));
        const badge = existing 
          ? `<span class="curated-badge" style="background: #ece9d8; border: 1px dashed #808080; font-size: 0.75rem; padding: 1px 4px; font-weight: bold; color: #800000; margin-left: 8px; font-family: monospace;">[CURATED]</span>` 
          : '';
        
        if (existing) {
          card.style.backgroundColor = '#f4f2ea';
          card.style.border = '1px dashed #808080';
        }
        
        card.innerHTML = `
          <img src="https://image.tmdb.org/t/p/w92${escapeHtml(posterPath)}" alt="Poster" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2292%22 height=%22138%22><rect width=%22100%%22 height=%22100%%22 fill=%22%23ccc%22/></svg>'">
          <div class="search-card-info">
            <div class="search-card-title">${escapeHtml(title)}${badge}</div>
            <div class="search-card-meta">MOVIE | Release: ${escapeHtml(year)}</div>
            <div class="search-card-meta">TMDB ID: ${escapeHtml(item.id)}</div>
          </div>
        `;
        
        // Click to auto-fill form (Edit existing review or Create a new one)
        card.addEventListener('click', () => {
          const formSec = document.querySelector('.admin-form-container');
          
          if (existing) {
            // Populate form with existing curated review for editing
            document.getElementById('form-review-id').value = existing.id;
            document.getElementById('form-type').value = 'movie';
            document.getElementById('form-title').value = existing.title;
            document.getElementById('form-tmdb-id').value = existing.tmdb_id;
            document.getElementById('form-year').value = existing.year || '';
            document.getElementById('form-poster').value = existing.poster;
            document.getElementById('form-genres').value = existing.genres ? existing.genres.join(', ') : '';
            document.getElementById('form-rating').value = existing.rating;
            document.getElementById('form-reviewer').value = existing.reviewer;
            document.getElementById('form-review').value = existing.review;
            document.getElementById('btn-form-save').textContent = '💾 Update Review';
            
            // Flash a gold color to alert the administrator of "Edit Mode"
            formSec.style.transition = 'background-color 0.1s';
            formSec.style.backgroundColor = '#ffd700';
          } else {
            // Populate form with TMDB metadata to create a new review
            document.getElementById('form-review-id').value = '';
            document.getElementById('form-type').value = 'movie';
            document.getElementById('form-title').value = title;
            document.getElementById('form-tmdb-id').value = item.id;
            document.getElementById('form-year').value = year !== 'N/A' ? year : '';
            document.getElementById('form-poster').value = posterPath;
            
            // Map genre names
            const genreNames = item.genre_ids
              ? item.genre_ids.map(id => TMDB_GENRES[id]).filter(Boolean)
              : [];
            document.getElementById('form-genres').value = genreNames.join(', ');
            
            document.getElementById('form-rating').value = '5';
            document.getElementById('form-reviewer').value = '';
            document.getElementById('form-review').value = '';
            document.getElementById('btn-form-save').textContent = '💾 Save Review';
            
            // Flash green for successful new autofill
            formSec.style.transition = 'background-color 0.1s';
            formSec.style.backgroundColor = '#90ee90';
          }
          
          setTimeout(() => {
            formSec.style.backgroundColor = 'var(--paint-canvas)';
          }, 300);
        });
        
        resultsContainer.appendChild(card);
      });
      
    } catch (err) {
      console.error('TMDB Fetch Error:', err);
      indicator.style.display = 'none';
      resultsContainer.style.display = 'flex';
      resultsContainer.innerHTML = `<div style="font-size: 0.9rem; padding: 10px; color: #f00;">Search failed: ${escapeHtml(err.message)}</div>`;
    }
  };
  
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
  });
}
