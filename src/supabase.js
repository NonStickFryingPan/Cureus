/**
 * Cureus — Supabase Client
 *
 * Initializes the Supabase client using environment variables.
 * Provides query helpers for the reviews table.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// -----------------------------------------------------------
// Reviews — Public queries (used by the feed)
// -----------------------------------------------------------

/**
 * Fetch all reviews, ordered by newest first.
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Fetch a single review by ID.
 * @param {string} id - UUID of the review
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function fetchReviewById(id) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

// -----------------------------------------------------------
// Reviews — Admin CRUD (requires authentication)
// -----------------------------------------------------------

/**
 * Insert a new review.
 * @param {object} review - Review data matching the schema
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createReview(review) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([review])
    .select()
    .single();

  return { data, error };
}

/**
 * Update an existing review.
 * @param {string} id - UUID of the review to update
 * @param {object} updates - Fields to update
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateReview(id, updates) {
  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a review.
 * @param {string} id - UUID of the review to delete
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function deleteReview(id) {
  const { data, error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

// -----------------------------------------------------------
// Auth — Admin login / logout
// -----------------------------------------------------------

/**
 * Sign in with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/**
 * Sign out the current user.
 * @returns {Promise<{error: object|null}>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current session (checks if user is logged in).
 * @returns {Promise<{data: {session: object|null}|null, error: object|null}>}
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}

/**
 * Listen for auth state changes.
 * @param {function} callback - Called with (event, session) on change
 * @returns {object} Subscription object with .unsubscribe()
 */
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
