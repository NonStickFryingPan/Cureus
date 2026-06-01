# Bigsby API Documentation

## Overview

Bigsby uses two external APIs:
- **TMDB API** (The Movie Database) — catalog, search, auth, account lists
- **VidKing** — third-party embed player for streaming

Everything goes through `https://api.themoviedb.org/3`. Auth is Bearer token (v4) or API key (v3 query param).

---

## Getting API Keys

### TMDB API Key (v3) + Access Token (v4)

1. Create a TMDB account: https://www.themoviedb.org/signup
2. Request API access: https://www.themoviedb.org/settings/api
3. You'll receive:
   - **API Key (v3)**: `fdff619f2acec38a1cdc67b792b11d13`
   - **Access Token (v4 Bearer)**: `eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZGZmNjE5ZjJhY2VjMzhhMWNkYzY3Yjc5MmIxMWQxMyIsIm5iZiI6MTc0ODAyMDkyMi4wNjcwMDAyLCJzdWIiOiI2ODMwYWViYTU5Mzc0YmU5NGUwMzY1Y2MiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.u9Vnvt9bjNPhGA9qriGhWNKUd3FtCa748VcSMtkRguc`

The Bearer token is preferred. If absent, the client falls back to `?api_key=` query param.

### VidKing

No API key needed. Just embed URLs:
```
https://www.vidking.net/embed/movie/{tmdbId}?autoPlay=true
https://www.vidking.net/embed/tv/{tmdbId}/{season}/{episode}?autoPlay=true
```

---

## Base URLs

| Service | URL |
|---|---|
| TMDB API | `https://api.themoviedb.org/3` |
| TMDB Auth (browser) | `https://www.themoviedb.org` |
| TMDB Images | `https://image.tmdb.org/t/p` |
| VidKing Embed | `https://www.vidking.net/embed` |

Image sizes (posters): `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original`

---

## Authentication

### Flow

```
Request Token  →  Browser Auth  →  Session ID  →  Account ID
```

### Step 1: Create Request Token
```
GET /authentication/token/new
```
Response: `{ request_token: string, expires_at: string, success: boolean }`

### Step 2: User Authorizes in Browser
Open URL in system browser:
```
https://www.themoviedb.org/authenticate/{request_token}?redirect_to={your_scheme}://
```
The user logs in to TMDB and approves the token. TMDB redirects back to your app.

### Step 3: Create Session
```
POST /authentication/session/new
Body: { request_token: string }
```
Response: `{ session_id: string, success: boolean }`

### Step 4: Get Account ID
```
GET /account?session_id={session_id}
```
Response: `{ id: number, username: string, name: string, avatar: {...} }`

### Verify / Delete Session
```
GET /account?session_id={session_id}                    // verify (returns 401 if expired)
DELETE /authentication/session?session_id={session_id}  // logout
```

---

## Movies

### Trending
```
GET /trending/movie/week?page=1
GET /movie/popular?page=1
GET /movie/now_playing?page=1
GET /movie/top_rated?page=1
GET /movie/upcoming?page=1
```
Returns `{ page, results: Movie[], total_pages, total_results }`

### Discover
```
GET /discover/movie?page=1&sort_by=popularity.desc&with_genres=...
```
Params: `page`, `sort_by`, `with_genres`, `vote_count.gte`, `vote_average.gte`, `year`, `primary_release_date.gte/lte`, `with_watch_providers`, `watch_region`

### Search
```
GET /search/movie?query={query}&page=1
```

### Detail
```
GET /movie/{id}?append_to_response=credits,videos,recommendations,similar
```
Returns `MovieDetail` with genres, runtime, credits (cast + crew), videos, recommendations, similar.

### Genres
```
GET /genre/movie/list
```
Returns `{ genres: [{ id, name }] }`

---

## TV Shows

### Trending
```
GET /trending/tv/week?page=1
GET /tv/popular?page=1
GET /tv/airing_today?page=1
GET /tv/on_the_air?page=1
GET /tv/top_rated?page=1
```

### Trending All (mixed)
```
GET /trending/all/week?page=1
```
Returns items with `media_type: 'movie' | 'tv'` — useful for discovery walls.

### Discover
```
GET /discover/tv?page=1&sort_by=popularity.desc
```
Params: `page`, `sort_by`, `with_genres`, `vote_count.gte`, `vote_average.gte`, `first_air_date_year`, `with_watch_providers`, `watch_region`

### Search
```
GET /search/tv?query={query}&page=1
```

### Multi-Search (movies + TV + people)
```
GET /search/multi?query={query}&page=1
```
Response items include `media_type` field (`'movie' | 'tv' | 'person'`).

### Detail
```
GET /tv/{id}?append_to_response=credits,videos,recommendations,similar
```
Returns `TVDetail` with seasons, episode count, credits, recommendations, etc.

### Season Detail
```
GET /tv/{id}/season/{season_number}?append_to_response=credits,videos
```
Returns `SeasonDetail` with array of `Episode` objects:
```typescript
interface Episode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  overview: string;
  air_date: string | null;
  still_path: string | null;
  vote_average: number;
  runtime: number | null;
}
```

---

## Account (requires session_id)

### Profile
```
GET /account/{account_id}?session_id={session_id}
```
Returns: username, name, avatar (gravatar + TMDB), location, adult filter.

### Account State (for a single item)
```
GET /movie/{id}/account_states?session_id={session_id}
GET /tv/{id}/account_states?session_id={session_id}
```
Returns: `{ favorite: boolean, watchlist: boolean, rated: false | { value: number } }`

### Favorites

```
GET /account/{account_id}/favorite/movies?session_id={session_id}&page=1&sort_by=created_at.desc
GET /account/{account_id}/favorite/tv?session_id={session_id}&page=1&sort_by=created_at.desc
POST /account/{account_id}/favorite?session_id={session_id}
  Body: { media_type: 'movie'|'tv', media_id: number, favorite: boolean }
```

### Watchlist

```
GET /account/{account_id}/watchlist/movies?session_id={session_id}&page=1
GET /account/{account_id}/watchlist/tv?session_id={session_id}&page=1
POST /account/{account_id}/watchlist?session_id={session_id}
  Body: { media_type: 'movie'|'tv', media_id: number, watchlist: boolean }
```

### Rated

```
GET /account/{account_id}/rated/movies?session_id={session_id}&page=1
GET /account/{account_id}/rated/tv?session_id={session_id}&page=1
```

---

## Custom Lists (TMDB `/list` endpoints)

Used for "Watching" and "On Hold" lists. Created once per account on first login.

### List CRUD

| Action | Method | Endpoint |
|---|---|---|
| Get all lists | `GET` | `/account/{account_id}/lists?session_id={session_id}&page=1` |
| Create list | `POST` | `/list?session_id={session_id}` — Body: `{ name, description, language: 'en' }` |
| Get detail | `GET` | `/list/{list_id}?session_id={session_id}` |
| Add item | `POST` | `/list/{list_id}/add_item?session_id={session_id}` — Body: `{ media_id, media_type: 'movie'|'tv' }` |
| Remove item | `POST` | `/list/{list_id}/remove_item?session_id={session_id}` — Body: `{ media_id, media_type: 'movie'|'tv' }` |
| Check item | `GET` | `/list/{list_id}/item_status?session_id={session_id}&media_id={id}` — Returns `{ item_present: boolean }` |
| Delete list | `DELETE` | `/list/{list_id}?session_id={session_id}` |

---

## Configuration / Images

```
GET /configuration
```
Returns image base URLs and available sizes:
```typescript
interface ImageConfig {
  base_url: string;            // "http://image.tmdb.org/t/p"
  secure_base_url: string;     // "https://image.tmdb.org/t/p"
  poster_sizes: string[];      // ["w92","w154","w185","w342","w500","w780","original"]
  backdrop_sizes: string[];    // ["w300","w780","w1280","original"]
  logo_sizes: string[];
  profile_sizes: string[];     // ["w45","w185","h632","original"]
  still_sizes: string[];
}
```

Image URL format: `{secure_base_url}/{size}{path}`

Example: `https://image.tmdb.org/t/p/w342/wwemzKWzjKYJFfCeiB57q3r4Bcm.png`

---

## Stream Embed (VidKing)

No API, just embed URLs. The WebView loads these directly:

```
Movie:  https://www.vidking.net/embed/movie/{tmdb_id}?autoPlay=true
TV:     https://www.vidking.net/embed/tv/{tmdb_id}/{season}/{episode}?autoPlay=true
```

There is no server-side integration with VidKing — it's purely a WebView embed.

---

## TMDB Types (simplified)

```typescript
interface Movie {
  id: number; title: string; overview: string;
  poster_path: string | null; backdrop_path: string | null;
  release_date: string; vote_average: number; vote_count: number;
  genre_ids: number[]; popularity: number;
}

interface TVShow {
  id: number; name: string; overview: string;
  poster_path: string | null; backdrop_path: string | null;
  first_air_date: string; vote_average: number; vote_count: number;
  genre_ids: number[]; popularity: number;
  number_of_seasons: number; number_of_episodes: number;
  seasons: Season[];
}

interface Season {
  id: number; name: string; season_number: number;
  episode_count: number; air_date: string | null;
  poster_path: string | null;
}

interface Episode {
  id: number; name: string; episode_number: number;
  season_number: number; overview: string;
  air_date: string | null; still_path: string | null;
  vote_average: number; runtime: number | null;
}

interface CastMember {
  id: number; name: string; character: string;
  profile_path: string | null; order: number;
}

interface MultiSearchResult {
  id: number; media_type: 'movie' | 'tv' | 'person';
  title?: string; name?: string;
  poster_path: string | null; profile_path: string | null;
  overview?: string; vote_average?: number;
}
```

---

## Retry & Error Handling

| Error | When | Status |
|---|---|---|
| `SessionExpiredError` | 401 response | session_id is invalid/expired |
| `ApiError` | 4xx/5xx response | carries `status` and `code` |
| `NetworkError` | timeout / network failure | retried up to 3 times with exponential backoff |

**Retry policy**: GET requests retry up to `RETRY_COUNT` (3) times with `RETRY_BACKOFF_MS` (1000ms) exponential backoff. POST/DELETE do not retry.

**Timeout**: 10 seconds per request.

---

## Env Vars

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_TMDB_ACCESS_TOKEN` | Bearer token (v4 auth) — preferred |
| `EXPO_PUBLIC_TMDB_API_KEY` | API key fallback (v3 query param) |

Both are gitignored. For Expo: stored as EAS secrets.

---

## Rate Limits

TMDB free tier: **40 requests per 10 seconds** per IP. No documented daily limit but heavy scraping may get throttled.

Auth endpoints (token/session creation) are more aggressively rate-limited.
