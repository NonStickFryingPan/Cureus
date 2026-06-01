# AGENTS.md — Cureus
> this folder is educational, we'll be building a real project from scratch
> from primitive data structures to higher-level architecture; 0-100%; learn as you go

## project
goal: Single-page desktop-only streaming review site with a 90s Windows XP Paint aesthetic.
stack: Vite · Supabase · Vanilla CSS
constraints: Desktop-only, 90s Paint aesthetic, pixel-filtered images, VidKing embeds only, client-side shuffle.
style/practices: Jagged borders, retro pixel fonts, clumsy hand-drawn UI style, functional patterns (no OOP).

## build + learn rules
- one task at a time — never scaffold the whole thing upfront
- when a new concept appears mid-build: pause, show the pattern, ask what they think, then use it
- explain every decision: "we're doing X because in real projects Y"
- commit after every working piece
- functional patterns only - no OOP we hate OOP

## save progress (trigger: user says "save progress")
update PROJECT.md → append/update in-place
update PPT.html → append new slides only, never delete existing ones

## PROJECT.md format
```
# P: <name> | SCOPE: <one-line> | STATE: [ACTIVE|BLOCKED|DONE] — <detail>
LAST: <done> | NEXT: <next>
TASKS: +done -blocked >next .todo
> T1 <feature>
  + T1.1  . T1.2  - T1.3 <reason>
DEPENDENCIES: <name>@<path|url> — <why> [READY|MISSING|PARTIAL]
FILES: <file> — <purpose> [EXISTS|PENDING]
```
`+` done · `-` blocked (reason) · `>` next · `.` todo

## PPT.html rules
colors: bg #0a0a0a · elevated #111111 · card #161616 · text #e8e8e8 · muted #888888 · accent #4fc3f7 · accent-bg rgba(79,195,247,0.15) · radius 12px
font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
layout: fullscreen dark · centered · max-width 900px · slide padding 80px 40px 100px
cards: bg #161616 · border 1px solid rgba(255,255,255,0.06) · hover border rgba(79,195,247,0.3)
animation: opacity:0 translateY(24px) → opacity:1 translateY(0) · respect prefers-reduced-motion
nav: 2px progress bar top · #slide-counter top · prev/next bottom-fixed · cyan = primary
responsive: grids → single column below 700px

permitted:
<div class="slide"><div class="card">
  <span class="muted">YYYY-MM-DD</span>
  <h1/><h2/><p/><ul><li/></ul>
  <div class="insight-box"><p/></div>
</div></div>

## when unsure
ask-question · 2-4 options · recommended first · include "look it up" if research needed (lookup=websearch by agent/user)
if answerable by exploring files or running commands → do that instead of asking
