import { supabase } from './supabase.js';

/**
 * Fetch all movie reviews from the database, pre-deduplicated by tmdb_id.
 * Orders reviews by created_at descending (most recent first) so that
 * deduplication keeps the newest review for any given movie.
 * 
 * @param {string|null} genre - Optional genre to filter by.
 * @returns {Promise<Array>} A list of clean, unique movie review records.
 */
export async function fetchReviews(genre = null) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch reviews from database: ${error.message}`);
  }

  const allReviews = data || [];
  
  // Filter by genre if provided
  let filtered = allReviews;
  if (genre) {
    filtered = allReviews.filter(r => r.genres && r.genres.includes(genre));
  }

  // Deduplicate by tmdb_id (keeping the most recent)
  const seenTmdbIds = new Set();
  const deduped = [];
  filtered.forEach(r => {
    if (!seenTmdbIds.has(r.tmdb_id)) {
      seenTmdbIds.add(r.tmdb_id);
      deduped.push(r);
    }
  });

  return deduped;
}

/**
 * Save a movie review (intelligent Insert or Update).
 * If the record contains a valid UUID 'id' parameter, updates the existing row.
 * Otherwise, inserts a new review row.
 * 
 * @param {Object} record - The movie review details to save.
 * @returns {Promise<Object>} The saved review record.
 */
export async function saveReview(record) {
  const { id, ...dataFields } = record;

  if (id && id.trim().length > 0) {
    // Update existing review
    const { data, error } = await supabase
      .from('reviews')
      .update(dataFields)
      .eq('id', id)
      .select();

    if (error) {
      throw new Error(`Failed to update review: ${error.message}`);
    }
    if (!data || data.length === 0) {
      throw new Error(`Review with ID ${id} not found.`);
    }
    return data[0];
  } else {
    // Insert new review
    const { data, error } = await supabase
      .from('reviews')
      .insert([dataFields])
      .select();

    if (error) {
      throw new Error(`Failed to create review: ${error.message}`);
    }
    return data[0];
  }
}

/**
 * Delete a movie review by ID.
 * 
 * @param {string} id - The database UUID of the review to delete.
 * @returns {Promise<boolean>} True if deleted successfully.
 */
export async function deleteReview(id) {
  if (!id) {
    throw new Error('Review ID is required for deletion.');
  }

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete review: ${error.message}`);
  }

  return true;
}
