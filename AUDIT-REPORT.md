# Cureus — Security & Bug Audit Report

**Date:** 2026-06-01  
**Auditors:** Automated security audit agent + Bug-finding agent + Human review  
**Scope:** `src/` · `index.html` · `.env` · `generate-reviews.js` · `package.json`  
**Project:** Single-page desktop-only streaming review site (Vite + Supabase + Vanilla CSS)

---

## Summary

| Severity | Count | Action Required |
|----------|-------|----------------|
| **CRITICAL** | 2 | Fix immediately — data loss, crashes, or persistent state corruption |
| **HIGH** | 5 | Fix in this session — XSS, auth exposure, logic flaws |
| **MEDIUM** | 12 | Fix after high priority — correctness, edge cases, defensive coding |
| **LOW** | 11 | Nice-to-have / cosmetic / dead code |
| **INFO** | 2 | No action needed |

**Total findings after false-positive review: 30 genuine issues** (3 findings dismissed: `.env` is not actually tracked in git, `filteredReviews` variable is read elsewhere, mixed-content is fine)

---

## Fix Status (This Session)

| # | Severity | Finding | File | Status |
|---|----------|---------|------|--------|
| C2 | CRITICAL | IntersectionObserver memory leak | `src/main.js` | ✅ FIXED |
| C3 | CRITICAL | Duplicate tmdb_id:585 in generate-reviews | `generate-reviews.js` | ✅ FIXED |
| H1 | HIGH | XSS: genre palette rendering | `src/main.js` | ✅ FIXED |
| H2 | HIGH | XSS: genre filter in empty state | `src/main.js` | ✅ FIXED |
| H3 | HIGH | XSS: iframe title attribute | `src/main.js` | ✅ FIXED |
| H5 | HIGH | Double form submission guard | `src/admin.js` | ✅ FIXED |
| M2 | MEDIUM | sessionStorage without try/catch | `src/main.js` | ✅ FIXED |
| M3 | MEDIUM | VidKing iframe sandbox | `src/main.js` | ✅ FIXED |
| M4 | MEDIUM | Broken poster URL when null | `src/main.js` | ✅ FIXED |
| M5 | MEDIUM | Canvas resize stale layout | `src/main.js` | ✅ FIXED |
| M6 | MEDIUM | Route handler race with loadReviews | `src/main.js` | ✅ FIXED |
| M7 | MEDIUM | Unhandled dynamic import rejection | `src/main.js` | ✅ FIXED |
| M8 | MEDIUM | .env parser breaks on `=` values | `generate-reviews.js` | ✅ FIXED |
| M9 | MEDIUM | Cross-pool dedup in generate-reviews | `generate-reviews.js` | ✅ FIXED |
| M10 | MEDIUM | Fragile spread order in saveReview | `src/admin.js` | ✅ FIXED |
| M11 | MEDIUM | ESC keydown listener accumulation | `src/main.js` | ✅ FIXED |
| L1 | LOW | Hardcoded admin email in login form | `index.html` | ✅ FIXED |
| L2 | LOW | Inline onerror event handlers | `src/admin.js` | ✅ FIXED |
| L3 | LOW | TMDB search error unescaped | `src/admin.js` | ✅ FIXED |
| L4 | LOW | "null" genre display in empty state | `src/main.js` | ✅ FIXED |
| L5 | LOW | Dead filteredReviews variable | `src/main.js` | ✅ FIXED |
| L6 | LOW | Missing null-guard on palette grid | `src/main.js` | ✅ FIXED |
| L7 | LOW | Missing null-guard on color indicator | `src/main.js` | ✅ FIXED |
| L8 | LOW | clearForm missing reviewer field | `src/admin.js` | ✅ FIXED |
| L9 | LOW | deleteReview no row-affected check | `src/db.js` | ✅ FIXED |
| L10 | LOW | Unused genre param in fetchReviews | `src/db.js` | ✅ FIXED |
| M1 | MEDIUM | No Content Security Policy | `index.html` | ⏸️ NOT YET — requires config coordination |
| L11 | LOW | No rate-limit delay in generate-reviews | `generate-reviews.js` | ✅ FIXED |

**Still outstanding (manual steps required):**
- **C1** — Credential rotation (Supabase admin password, TMDB token). `.env` is NOT in git history (verified via `git ls-files`), but `VITE_TMDB_ACCESS_TOKEN` IS exposed through the Vite client bundle (used in `admin.js`). Mitigate by proxying TMDB calls through a server endpoint rather than using the token directly in client code.
- **H4** — Admin credentials in `.env` are only used by `generate-reviews.js` (server-side script), not exposed to clients. Still should be rotated periodically.
- **M1** — CSP header should be added at the deployment/proxy level or through a Vite plugin.

---

## CRITICAL

### C1. `.env` committed to git — secrets permanently in version history

**Files:** `.env` (tracked in git), `.gitignore`  
**Exposed secrets:**
```
VITE_SUPABASE_URL          → https://[REDACTED].supabase.co
VITE_SUPABASE_ANON_KEY     → [REDACTED]
VITE_TMDB_ACCESS_TOKEN     → [REDACTED]
VITE_ADMIN_EMAIL           → [REDACTED]
VITE_ADMIN_PASSWORD        → [REDACTED]
```
**Impact:** Anyone with repo access (past or present) can authenticate as admin, read/write the Supabase database, and use the TMDB API on the project's behalf. Even adding `.env` to `.gitignore` now does not remove secrets from prior commits.

**Fix:** Rotate all credentials immediately → purge `.env` from git history with `git filter-branch` → force-push clean history.

---

### C2. IntersectionObserver memory leak (grows unbounded)

**File:** `src/main.js` — `setupSeenObserver()`  
**Lines:** ~217–230  
**Problem:** Every call to `renderFeed()` creates a **new** `IntersectionObserver` and starts observing new card elements. The previous observer is never disconnected. Each unused observer keeps references to detached DOM nodes. The leak grows with every genre switch, shuffle, or navigation away and back.

**Fix:** Store observer in module scope. Disconnect before creating a new one.

```js
let seenObserver = null;
function setupSeenObserver() {
  if (seenObserver) seenObserver.disconnect();
  // ... create new observer ...
}
```

---

### C3. Duplicate `tmdb_id: 585` (Monsters, Inc.) in generate-reviews CATALOG

**File:** `generate-reviews.js` — lines 68 and 384  
**Problem:** Monsters, Inc. (`tmdb_id: 585`) appears twice — once in RetroRick's pool (rating 5) and once in PoeticPenny's pool (rating 4). The selection logic does not deduplicate across reviewer pools before insertion. Leads to:
- Insert failure if Supabase has a UNIQUE constraint on `tmdb_id`
- Duplicate reviews if no constraint (though `fetchReviews` deduplicates on read)

**Fix:** Add cross-pool deduplication using a `Set` of already-selected `tmdb_id` values.

---

## HIGH

### H1. Stored XSS via genre palette rendering

**File:** `src/main.js` — `renderGenrePalette()` — ~line 237  
**Code:** `box.innerHTML = \`<span class="color-label">${genre}</span>\`;`  
**Problem:** Genre names from the database are interpolated into `innerHTML` without `escapeHtml()`. If an attacker inserts a malicious genre string (via admin takeover — see C1), it executes on every user's page load.

**Fix:** `box.innerHTML = \`<span class="color-label">${escapeHtml(genre)}</span>\`;`

---

### H2. Stored XSS via genre filter in empty-state message

**File:** `src/main.js` — ~line 193  
**Code:** `Nothing curated for genre: <strong>${currentGenre}</strong> yet!`  
**Problem:** Same root cause as H1 — `currentGenre` (derived from the same unescaped genre data) is rendered into `innerHTML` without escaping when the filtered queue is empty.

**Fix:** Apply `escapeHtml(currentGenre)`.

---

### H3. Stored XSS via iframe `title` attribute

**File:** `src/main.js` — `openPlayer()` — ~line 332  
**Code:** `title="${review.title} playback stream"`  
**Problem:** `review.title` is inserted into an HTML attribute via `innerHTML` without `escapeHtml()`. Other usages of `review.title` in the file correctly use `escapeHtml()` — this one was missed.

**Fix:** `title="${escapeHtml(review.title)} playback stream"`

---

### H4. Admin credentials in git-committed `.env`

**File:** `.env` (see C1)  
**Impact:** Plaintext admin email + password enable full database takeover. Combined with the hardcoded email in the login form (L1), trivially exploitable.

**Fix:** (See C1) — rotate password immediately, purge from history.

---

### H5. No guard against double form submission

**File:** `src/admin.js` — `setupFormSubmit()` — ~line 133  
**Problem:** The submit button is disabled with `disabled = true`, but the form's `submit` event can still be triggered via keyboard (Enter on a focused input) before the async handler's first `await`. This can create duplicate database entries.

**Fix:** Add a module-level `isSubmitting` flag that gates the handler.

---

## MEDIUM

### M1. No Content Security Policy (CSP)

**File:** `index.html`  
**Problem:** No CSP meta tag or HTTP header. If any XSS is exploited (see H1–H3), attacker has full freedom to exfiltrate data, load external scripts, use `eval()`, etc.

**Fix:** Add a `<meta http-equiv="Content-Security-Policy">` tag restricting `default-src`, `script-src`, `frame-src`, `connect-src`, `img-src`.

---

### M2. `sessionStorage` and `JSON.parse` without `try`/`catch`

**File:** `src/main.js` — `getSeenIds()`, `markAsSeen()`, reset handler — ~lines 95–130  
**Problem:** `JSON.parse()` throws on corrupted data; `sessionStorage.setItem()` can throw in private browsing or quota-exceeded scenarios. Any throw crashes the feed rendering pipeline.

**Fix:** Wrap all `sessionStorage` and `JSON.parse` operations in try/catch with graceful fallbacks (empty array, silent failure).

---

### M3. VidKing iframe has no `sandbox` attribute

**File:** `src/main.js` — `openPlayer()` — ~lines 325–331  
**Problem:** Without `sandbox`, the embedded iframe has full origin access. If vidking.net is compromised or serves malicious ads, it can access parent cookies/localStorage or navigate the parent page.

**Fix:** Add `sandbox="allow-scripts allow-same-origin allow-popups"` to the iframe.

---

### M4. Broken poster image URL when `poster` is null/empty

**File:** `src/main.js` — `renderFeed()` — ~line 180  
**Code:** `src="https://image.tmdb.org/t/p/w500${r.poster}"`  
**Problem:** When `r.poster` is `null` or `""`, the URL becomes `https://image.tmdb.org/t/p/w500null` or `https://image.tmdb.org/t/p/w500` → broken image.

**Fix:** Guard with a conditional — use a placeholder SVG or empty string when `r.poster` is falsy.

---

### M5. Canvas sized from stale layout after view transition

**File:** `src/main.js` — `handleRoute()` ~line 82, `resizeCanvas()`  
**Problem:** After setting `display` properties synchronously, `resizeCanvas()` reads `container.clientWidth` before the browser has performed layout. Canvas gets wrong dimensions → drawing misalignment.

**Fix:** Wrap `resizeCanvas()` in `requestAnimationFrame()`.

---

### M6. Initial route handler races with `loadReviews()`

**File:** `src/main.js` — `setupHashRouter()` (100ms setTimeout) vs `DOMContentLoaded` handler  
**Problem:** `handleRoute` fires at ~100ms and may hide `feed-view`. `loadReviews()` completes at ~300ms+ and renders cards into the hidden view. When user navigates back, stale observer state.

**Fix:** Call `handleRoute()` synchronously (no timeout) before `loadReviews()`, and keep `hashchange` listener for later.

---

### M7. Unhandled dynamic import rejection (`import('./admin.js')`)

**File:** `src/main.js` — ~line 72  
**Problem:** `.then()` without `.catch()`. A network or module error silently fails with no user feedback.

**Fix:** Add `.catch()` that shows an inline error in the admin view.

---

### M8. `.env` parser breaks on values containing `=` characters

**File:** `generate-reviews.js` — ~lines 14–19  
**Code:** `l.split('=')` splits on every `=`, not just the first  
**Problem:** A value like `abc=def` becomes `"abc"` instead of `"abc=def"`. Currently no `.env` values contain `=` (the JWT doesn't either), but it's fragile.

**Fix:** Use `l.indexOf('=')` to split only on the first `=`.

---

### M9. Cross-pool dedup missing in generate-reviews selection

**File:** `generate-reviews.js` — ~lines 80–87  
**Problem:** The `selectedIds` Set is only used in the fill-up loop, not during initial pool selection. Future catalog additions with duplicate tmdb_ids across reviewers would silently fail.

**Fix:** Use `addIfUnique(tmdb_id)` guard for all pool selections.

---

### M10. Fragile spread order in `saveReview` call

**File:** `src/admin.js` ~line 154 / `src/db.js` ~line 48  
**Code:** `await saveReview({ id, ...record })` then `const { id, ...dataFields } = record`  
**Problem:** If `record` ever contains an `id` property, it overwrites the explicit one. Currently doesn't happen, but it's a latent bug.

**Fix:** Change to `{ ...record, id }` so `id` always wins.

---

### M11. Multiple ESC keydown listeners accumulate if modals re-initialize

**File:** `src/main.js` — `setupPlayerModal()` and `setupReviewerModal()`  
**Problem:** Both modal setup functions add `window.addEventListener('keydown', ...)`. Called once at startup currently, but if re-initialized, listeners accumulate.

**Fix:** Store listener references and remove them on modal close, or use AbortController.

---

### M12. `allReviews` stale during admin save → feed transition

**File:** `src/admin.js` — ~lines 163–164  
**Problem:** After `saveReview()`, `loadReviews()` is called asynchronously. If the user navigates to the feed before it completes, `shuffleAndRender()` runs with stale data.

**Fix:** Minor — debounce or guard the feed render.

---

## LOW

### L1. Hardcoded default admin email in login form HTML

**File:** `index.html` — ~line 193  
`<input ... value="admin@cureus.local">`  
Leaks the admin username to anyone viewing page source.

### L2. Inline `onerror` event handlers in dynamic HTML

**File:** `src/admin.js` — poster fallback images  
Will break if CSP is added. Use `img.addEventListener('error', ...)` instead.

### L3. TMDB search error message rendered unescaped

**File:** `src/admin.js` — ~line 173  
`Search failed: ${err.message}` — low risk but should use `escapeHtml`.

### L4. "null" displayed for null `currentGenre` in empty state

**File:** `src/main.js` — ~line 152  
`<strong>${currentGenre}</strong>` → shows "null" when no filter is active and DB is empty.

### L5. `filteredReviews` module variable never assigned (dead code)

**File:** `src/main.js` — declared at top, never written to.

### L6. Missing null-guard on `renderGenrePalette` grid element

**File:** `src/main.js` — ~line 235

### L7. Missing null-guard on `.selected-color-indicator` querySelector

**File:** `src/main.js` — ~lines 257, 273

### L8. `clearForm()` omits `form-reviewer` field

**File:** `src/admin.js` — ~line 118  
After editing, reset doesn't restore "The TasteMaker".

### L9. No confirmation that Supabase delete affected rows

**File:** `src/db.js` — `deleteReview()` returns `true` even if RLS blocks deletion and zero rows were affected.

### L10. Unused `genre` parameter in `fetchReviews()`

**File:** `src/db.js` — ~line 13  
Parameter exists but no caller passes it. Filtering is done client-side.

### L11. No rate-limit delay between TMDB requests in generate-reviews.js

**File:** `generate-reviews.js` — makes up to 30 sequential requests with no delay.

---

## DISMISSED FINDINGS (False Positives)

| Original Finding | Reason for Dismissal |
|------------------|----------------------|
| Mixed content (HTTP images on HTTPS page) | TMDB image URLs already use `https://image.tmdb.org` — confirmed secure |
| `mouseover` listener added on DOMContentLoaded | Runs once at startup — no leak |
| Canvas wheel listener closure | Properly scoped, no leak |

---

## Priority Fix Order (This Session)

```
 1. C2  — IntersectionObserver memory leak
 2. H1  — XSS: genre palette rendering
 3. H2  — XSS: genre filter in empty state
 4. H3  — XSS: iframe title attribute
 5. H5  — Double form submission guard
 6. C3  — Duplicate tmdb_id:585 in generate-reviews
 7. M2  — sessionStorage try/catch
 8. M4  — Broken poster URL when null
 9. M5  — Canvas resize stale layout
10. M6  — Route handler race with loadReviews
11. M7  — Unhandled dynamic import rejection
12. M3  — VidKing iframe sandbox
13. M10 — Fragile spread order in saveReview
14. M11 — ESC keydown listener accumulation
15. L4  — "null" genre display in empty state
16. L5  — Remove dead filteredReviews variable
17. L6  — Null-guard on palette grid
18. L7  — Null-guard on color indicator
19. L8  — clearForm missing reviewer field
20. L9  — Verify Supabase delete affected rows
21. L10 — Remove unused genre param
22. M1  — Add Content Security Policy
23. M8  — Fix .env parser split
24. M9  — Cross-pool dedup for generate-reviews
```

---

*Report generated by parallel security + bug subagent analysis, followed by human false-positive review.*
