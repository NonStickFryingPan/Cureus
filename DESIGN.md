UI Style: 90s Windows XP Paint Style. Clumsy, scribbly, and utterly pathetic. Use a white background, and make it look like MS Paint with a mouse. It should be vaguely similar but also not really, kind of matching but also off in a confusing, awkward way, with that low-quality pixel-by-pixel feel that really emphasizes how ridiculously bad it is. Actually, you know what, whatever, just make it however you want. Append this DESIGN.md as you go.

---

### Redesign & Implementation Details (90s Windows XP MS Paint Style)

We have fully realized the MS Paint/Windows XP aesthetic across the entire public feed site:

1. **Desktop Workspace Grid Layout**:
   - The body is designed as an active MS Paint application interface.
   - **Left Sidebar**: A retro grey `#d4d0c8` toolbox containing a 16-button grid of MS Paint icons (pencil, brush, bucket, eraser, lasso, text tool, curve line, spray can, etc.).
   - **Interactive Tools**: Clicking any tool dynamically alters the `body` cursor style. For example, selecting the Pencil tool turns your cursor into a pencil, the Eraser tool changes the cursor to an eraser square, and the Fill bucket turns it into a bucket, with live status bar explanations.
   - **Bottom Bar**: Styled as the classic MS Paint Color Palette, complete with double overlapping active foreground/background color squares. The Dynamic Swatches double as the live Supabase genre filter chips! Selecting a genre updates the active foreground color box to match that genre's dynamic color swatch!

2. **Luna Blue Title Windows**:
   - Each review card is styled as an MS Paint application window center-aligned in a medium-grey workspace.
   - Features the iconic Windows XP Luna gradient title bar (`#0054e3` to `#2788f5`) with bold white text (e.g. `Cureus Paint - [Title].bmp`).
   - Classic control buttons (Minimize `🗕`, Maximize `🗖`, and close `✕` in red).
   - Classic retro text menu option links (`File` `Edit` `View` `Image` `Colors` `Help`).

3. **Drawing Canvas Details**:
   - The card details sit on a pure white drawing canvas block (`#ffffff`) with a beveled 3D inset border.
   - The review details are enclosed inside a dotted "Text Tool" bounding box, complete with 8 drag handles at the corners and midsections.
   - The poster sits on the right side of the canvas, styled inside a classic dotted "Selection Box" with active sizing handles.
   - The "Watch Now" button is styled as a retro beveled grey Windows XP dialog button that presses inward when active.

4. **Pathetic/Clumsy Typography**:
   - Styled primarily in **Comic Sans MS**, system-wide fallback fonts, and **Times New Roman** for headings, capturing the awkward, mouse-drawn feel explicitly requested.
   - Layout is fully responsive to prevent posters from being pushed off-screen or cut off. All images use `max-height` constraints with object containment.

- **TMDB API** (The Movie Database) — catalog, search, auth, account lists
- https://developer.themoviedb.org/docs/getting-started
- **VidKing** — third-party embed player for streaming
https://www.vidking.net/#documentation

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
