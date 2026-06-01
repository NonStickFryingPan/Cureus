/**
 * Safely escapes HTML special characters to prevent Cross-Site Scripting (XSS) attacks.
 * 
 * @param {string} str - The raw string to escape.
 * @returns {string} The HTML-safe escaped string.
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
