# P: Cureus | SCOPE: Single-page desktop-only streaming review site with 90s Windows XP Paint aesthetic | STATE: DONE — Application fully built, compiled, and verified.
LAST: Completed all feed scroll-snaps, seen shuffle, drawing board, and TMDB administration tools | NEXT: Project ready for deployment
TASKS: +done -blocked >next .todo
> T1 Setup and Infrastructure
  + T1.1 Create project structure and configuration templates
  + T1.2 Initialize package.json and install dependencies (Vite, Supabase JS)
  + T1.3 Configure .env with Supabase and TMDB credentials
> T2 Core UI and Styles
  + T2.1 Build index.html structure
  + T2.2 Write 90s MS Paint CSS (pixel fonts, jagged boxes, retro palette)
> T3 Supabase Integration and Seed Data
  + T3.1 Set up Supabase Client
  + T3.2 Seed database with initial curated reviews
> T4 Feed & Interactive Shell
  + T4.1 Implement 100vh CSS snap scroll layout
  + T4.2 Add browser seen-tracking and randomized shuffle logic
  + T4.3 Create dynamic genre tag pills and filter mechanism
  + T4.4 Build Watch Now MS Paint window parody modal with VidKing player iframe
> T5 Admin Panel (/#admin)
  + T5.1 Build basic admin UI & Supabase Auth login
  + T5.2 Integrate TMDB search and auto-complete review forms

DEPENDENCIES: 
  @supabase/supabase-js@2 — Backend database and authentication [READY]
  vite@latest — Build tool and dev server [READY]

FILES:
  index.html — Application entrypoint [EXISTS]
  src/style.css — Core style sheet containing XP Paint design tokens [EXISTS]
  src/main.js — Frontend client code and feed controller [EXISTS]
  src/supabase.js — Supabase client configuration [EXISTS]
  src/db.js — Deep Database Storage Seam [EXISTS]
  src/admin.js — Curation panel and TMDB search logic [EXISTS]

## Decisions (grill 2026-06-01)

### Architectural Restructure & Seams

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage Seam | Deep Database Module (`src/db.js`) | Hides raw database client queries to maximize leverage and keep views clean. |
| Deduplication Placement | Inside `src/db.js` `fetchReviews` | The database fetch pre-deduplicates reviews by `tmdb_id` before returning, keeping views thin. |
| Error Handling | Standard JS `Error` exceptions | Callers use `try/catch` wrappers which is robust and standard. |
| Client Isolation | Full Encapsulation (no backdoor) | Exposes only abstract CRUD operations (`fetchReviews`, `saveReview`, `deleteReview`) to guarantee easy mock testing. |
