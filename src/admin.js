import { supabase } from './supabase.js';

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
  document.getElementById('form-review').value = '';
}

document.getElementById('btn-form-clear').addEventListener('click', clearForm);

// --- Form Submission (Save Review) ---
function setupFormSubmit() {
  document.getElementById('review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!session) return alert('You must be authenticated to curation reviews!');

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
      if (id) {
        // Update
        const { error } = await supabase
          .from('reviews')
          .update(record)
          .eq('id', id);
          
        if (error) throw error;
        alert('Review updated successfully!');
      } else {
        // Insert
        const { error } = await supabase
          .from('reviews')
          .insert([record]);
          
        if (error) throw error;
        alert('Review created successfully!');
      }

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
    }
  });
}

// --- Fetch and Display Database Reviews ---
async function loadAdminReviewsList() {
  const container = document.getElementById('admin-reviews-list');
  container.innerHTML = '<div style="font-size: 0.9rem; color:#888;">Fetching current library...</div>';
  
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    currentReviews = data || [];
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
          <img src="https://image.tmdb.org/t/p/w92${r.poster}" alt="Poster" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2292%22 height=%22138%22><rect width=%22100%%22 height=%22100%%22 fill=%22%23ccc%22/></svg>'">
          <div class="search-card-info">
            <div class="search-card-title">${r.title} <span style="font-size:0.9rem;">(${r.year})</span></div>
            <div class="search-card-meta">Movie | ${stars}</div>
            <div class="search-card-meta" style="font-style: italic;">By ${r.reviewer}</div>
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
          const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', id);
            
          if (error) throw error;
          
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
        
        card.innerHTML = `
          <img src="https://image.tmdb.org/t/p/w92${posterPath}" alt="Poster" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2292%22 height=%22138%22><rect width=%22100%%22 height=%22100%%22 fill=%22%23ccc%22/></svg>'">
          <div class="search-card-info">
            <div class="search-card-title">${title}</div>
            <div class="search-card-meta">MOVIE | Release: ${year}</div>
            <div class="search-card-meta">TMDB ID: ${item.id}</div>
          </div>
        `;
        
        // Click to auto-fill form
        card.addEventListener('click', () => {
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
          
          // Flash form background to indicate autofill succeeded
          const formSec = document.querySelector('.admin-form-container');
          formSec.style.transition = 'background-color 0.1s';
          formSec.style.backgroundColor = '#90ee90';
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
      resultsContainer.innerHTML = `<div style="font-size: 0.9rem; padding: 10px; color: #f00;">Search failed: ${err.message}</div>`;
    }
  };
  
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
  });
}
