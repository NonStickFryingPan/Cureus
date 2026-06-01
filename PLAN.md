# Streaming Review Site — Full Plan

## Concept

A curated, cinematic streaming site. Full-viewport snap scroll feed where each card shows one handpicked review alongside its movie or TV show poster. Click watch, go straight to the player. No noise, no algorithm, just taste.

## Artifacts

Read DESIGN.md & DOCS.md for everything. This is the implementation plan.

---

## User-Facing Site

### Feed
- Desktop only
- CSS snap scroll — one card per viewport, 100vh
- Every page load shuffles the reviews randomly
- Each card:
  - Left: title, year, genres, star rating, reviewer name, review text (truncated ~280 chars, expandable)
  - Right: movie/show poster (2:3 ratio)
  - Bottom left: `▶ Watch Now` button

### Watch Now
- Clicks open a fullscreen overlay with the streaming player iframe
- No page navigation — instant, in-place
- ESC or click outside to dismiss

### Filter
- Genre/mood filter bar (fixed top or side)
- Options derived from what's actually in the DB — no hardcoded list
- Selecting a genre re-shuffles only matching cards
- No search

### Performance
- Zero TMDB API calls at runtime — metadata baked into Supabase at curation time
- One Supabase fetch on load, everything rendered from that
- `preconnect` to Supabase and streaming API domains in `<head>`
- Posters lazy-loaded, next card poster preloaded while reading current
- Skeleton screens on initial load, never a spinner

---

## Data Model

Single `reviews` table in Supabase:

```sql
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  tmdb_id     integer not null,
  type        text not null check (type in ('movie', 'tv')),
  title       text not null,
  year        integer,
  poster      text,          -- TMDB poster path e.g. /abc123.jpg
  genres      text[],        -- e.g. ['Drama', 'Crime']
  review      text not null,
  reviewer    text not null,
  rating      integer check (rating between 1 and 5),
  created_at  timestamptz default now()
);
```

Row-level security: public can SELECT, only authenticated user can INSERT/UPDATE/DELETE.

---

## Dashboard (Admin)

### Access
- Route: `/admin`
- Password-protected via Supabase Auth (email + password, just you)
- No public link to this page

### Workflow
1. Search TMDB by title → results appear instantly
2. Click a result → metadata auto-fills (title, year, poster, genres)
3. Write the review, pick reviewer name, set star rating
4. Hit Save → writes to Supabase
5. Entry is live on the site immediately (next page load)

### Dashboard also shows
- All existing reviews in a table
- Edit / delete any entry
- Preview what the card will look like

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vanilla JS + Vite | No framework overhead, full control |
| Database | Supabase free tier | Postgres, JS client, auth, no backend needed |
| Streaming | External iframe API | Plug-and-play, not our problem |
| TMDB | Curation-time only | No runtime API dependency |
| Deploy | Cloudflare Pages | Free, global CDN, auto-deploy from GitHub |
| Auth | Supabase Auth | Built-in, free, handles the admin gate |

---

## File Structure

```
/
├── index.html
├── style.css
└── src/
    ├── main.js          ← boot, fetch from Supabase, shuffle, render
    ├── feed.js          ← renders cards, snap scroll setup
    ├── card.js          ← single card HTML template
    ├── player.js        ← fullscreen overlay + iframe logic
    ├── filter.js        ← genre filter bar, re-render on select
    ├── supabase.js      ← Supabase client init + query helpers
    └── admin/
        ├── index.html   ← dashboard shell
        ├── auth.js      ← login gate
        ├── tmdb.js      ← TMDB search at curation time
        └── editor.js    ← review form, save to Supabase
```

---

## Deployment

- Repo on GitHub
- Cloudflare Pages connected to repo — every push to `main` auto-deploys
- Environment variables in Cloudflare dashboard:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Custom domain optional, free SSL either way

---

## Known Gotchas

**Supabase free tier pauses after 1 week of inactivity.** First visitor after a pause gets a cold-start delay (~2s). Workaround: set up a free cron job (cron-job.org) to ping Supabase once a day.

**TMDB poster URLs** need a base: `https://image.tmdb.org/t/p/w500{poster_path}`. Store just the path in Supabase, construct the full URL at render time.

**Streaming API** — the `/admin` dashboard should let you test the player iframe before saving a review, so you know the stream actually works for that title.

---

## What's Not In Scope

- User accounts
- Watchlists or favourites
- Comments or likes
- Mobile layout
- SEO / metadata (can add later)
