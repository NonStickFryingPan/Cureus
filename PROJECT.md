# P: Cureus | SCOPE: Single-page desktop-only streaming review site with 90s Windows XP Paint aesthetic | STATE: ACTIVE — Supabase integrated, moving to Feed & Interactive Shell.
LAST: Initialized Supabase client, verified seeded data | NEXT: Build Feed and interactive canvas drawing layer
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
  . T4.1 Implement 100vh CSS snap scroll layout
  . T4.2 Add browser seen-tracking and randomized shuffle logic
  . T4.3 Create dynamic genre tag pills and filter mechanism
  . T4.4 Build Watch Now MS Paint window parody modal with VidKing player iframe
> T5 Admin Panel (/#admin)
  . T5.1 Build basic admin UI & Supabase Auth login
  . T5.2 Integrate TMDB search and auto-complete review forms

DEPENDENCIES: 
  @supabase/supabase-js@2 — Backend database and authentication [PENDING]
  vite@latest — Build tool and dev server [PENDING]

FILES:
  index.html — Application entrypoint [PENDING]
  src/style.css — Core style sheet containing XP Paint design tokens [PENDING]
  src/main.js — Frontend client code and feed controller [PENDING]
  src/supabase.js — Supabase client configuration [PENDING]
  src/admin.js — Curation panel and TMDB search logic [PENDING]
