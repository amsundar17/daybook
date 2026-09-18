# Daybook — Life OS

A personal daily-routine and life dashboard: Today view, Capture, Tasks, Routines,
Projects, Content, People, Library, Domains, Financial, and Health (BMI + macros).
Static HTML/CSS/JS, installable as a PWA on iPhone and Windows. No build step.

## Local development

```
python3 dev-server.py 8791 .
```

Then open http://localhost:8791. (`dev-server.py` just adds `Cache-Control: no-store`
so edits show up on refresh instead of getting stuck behind the browser's cache.)

## Deployment

Pushing to `main` deploys automatically to GitHub Pages via
`.github/workflows/deploy-pages.yml`. One-time setup: in this repo's
**Settings → Pages**, set **Source** to **GitHub Actions**.

## Optional integrations (set up per-device in Settings)

- **Google Calendar / Tasks / Gmail** — needs your own OAuth Client ID. Instructions
  are in the app's Settings tab.
- **Postgres sync (Supabase)** — run `supabase-schema.sql` once in a Supabase
  project's SQL editor, then paste the project URL + anon key into Settings.

Data lives in the browser (localStorage) and is mirrored to Postgres only if you
configure Supabase. Nothing here is medical or financial advice.

## Updating the cache-busting version

`index.html`'s `<script>`/`<link>` tags and `sw.js`'s `CACHE` constant both carry a
`?v=N` / `daybook-vN` tag. Bump `N` in both places whenever you ship JS/CSS changes,
or devices with the PWA already installed may keep running the old cached version.
