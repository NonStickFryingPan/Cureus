/**
 * Cureus — TMDB Curation API
 *
 * Used by the admin dashboard to search TMDB and pull metadata
 * when writing reviews. No runtime dependency for the public site.
 */

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

function getHeaders() {
  const token = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      'Missing VITE_TMDB_ACCESS_TOKEN environment variable. ' +
      'Get one from https://www.themoviedb.org/settings/api'
    );
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Search TMDB for movies and TV shows by title.
 * @param {string} query - Search term
 * @returns {Promise<Array>} Array of results with media_type
 */
export async function searchMulti(query) {
  if (!query || query.trim().length === 0) return [];

  const url = `${TMDB_BASE}/search/multi?query=${encodeURIComponent(query)}&page=1`;
  const res = await fetch(url, { headers: getHeaders() });

  if (!res.ok) {
    throw new Error(`TMDB search failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  // Filter to movies and TV only (exclude people)
  return (json.results || []).filter(
    (item) => item.media_type === 'movie' || item.media_type === 'tv'
  );
}

/**
 * Fetch full details for a movie or TV show.
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {number} id - TMDB ID
 * @returns {Promise<object>} Detailed metadata
 */
export async function fetchDetails(mediaType, id) {
  const url = `${TMDB_BASE}/${mediaType}/${id}?append_to_response=credits,videos`;
  const res = await fetch(url, { headers: getHeaders() });

  if (!res.ok) {
    throw new Error(`TMDB detail fetch failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Get the full poster URL from a path.
 * @param {string|null} path - Poster path like /abc123.jpg
 * @param {string} size - Image size (w92, w154, w185, w342, w500, w780, original)
 * @returns {string|null}
 */
export function posterUrl(path, size = 'w500') {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

/**
 * Extract genre names from genre IDs using a genre list.
 * @param {Array} genreIds - Array of genre IDs from search result
 * @param {Array} genreList - Full genre list [{id, name}, ...]
 * @returns {string[]} Genre name strings
 */
export function resolveGenres(genreIds, genreList) {
  if (!genreIds || !genreList) return [];
  return genreIds
    .map((id) => {
      const match = genreList.find((g) => g.id === id);
      return match ? match.name : null;
    })
    .filter(Boolean);
}

/**
 * Fetch the full genre list from TMDB (cached in memory).
 * @returns {Promise<Array<{id: number, name: string}>>}
 */
let genreCache = null;
export async function fetchGenres() {
  if (genreCache) return genreCache;

  const [moviesRes, tvRes] = await Promise.all([
    fetch(`${TMDB_BASE}/genre/movie/list`, { headers: getHeaders() }),
    fetch(`${TMDB_BASE}/genre/tv/list`, { headers: getHeaders() }),
  ]);

  const movies = await moviesRes.json();
  const tv = await tvRes.json();

  // Merge and deduplicate
  const all = [...(movies.genres || []), ...(tv.genres || [])];
  const seen = new Set();
  genreCache = all.filter((g) => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });

  return genreCache;
}
