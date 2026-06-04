<div align="center">

# 🎨 Cureus
**Curated streaming reviews served in a 90s Windows XP Paint parody**

![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)

[About](#about) · [Stack](#stack) · [Getting Started](#getting-started) · [License](#license)

</div>

---

## About

Cureus is a single-page desktop-only review site that mimics the look and feel of Microsoft Paint from Windows XP. Scroll through handpicked movie reviews, filter by genre via the color palette, scribble doodles over the feed, and watch movies directly through the embedded player.

Built as a playful homage to retro UI design with pixel fonts, jagged borders, and a full Paint-style toolbox included.

## Stack

- **Vite** - Build tool and dev server
- **Supabase** - Database, auth, and storage
- **Vanilla CSS** - No framework, all hand-styled
- **TMDB API** - Movie metadata and poster images

## Getting Started

```bash
# Clone the repo
git clone git@github.com:NonStickFryingPan/Cureus.git
cd Cureus

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Supabase credentials and TMDB token

# Start the dev server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_TMDB_ACCESS_TOKEN` | TMDB API read access token |
| `VITE_ADMIN_EMAIL` | Admin login email |
| `VITE_ADMIN_PASSWORD` | Admin login password |

## Features

- **Snap-scroll feed** - Full-screen cards that scroll smoothly
- **Genre palette** - MS Paint color boxes that filter by genre
- **Scribble overlay** - Pencil, spray can, rectangle, and eraser tools to doodle on top of reviews
- **Shuffle engine** - Smart shuffle that prioritizes unseen reviews
- **Watch now** - Embedded player overlay for direct streaming
- **Admin dashboard** - TMDB search, review curation, and authentication

## License

MIT
