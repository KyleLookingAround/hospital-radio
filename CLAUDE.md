# CLAUDE.md — handoff notes for Claude Code

This repo is a refactor of a working single-file band site into a proper,
buildable static-site project. The single file already worked; this splits it
into editable source + plain-text content + a build step, ready for GitHub.

**The original working file is at `reference/original-single-file.html`.** Treat
it as the source of truth for how the site should look and behave — the built
`dist/index.html` should be functionally identical to it.

> ⚠️ Heads up: the assistant that created this repo had **no network access**,
> so it could not run `npm install` or execute the real (js-yaml) build. The
> code and content were written and the JS was syntax-checked, and the
> template-injection pipeline was verified with the known config — but the
> **YAML build path itself has not been run**. Your first job is to install,
> build, and fix anything that trips.
>
> A **pre-built `dist/` is included** (produced from this same content) so you
> can open/preview it immediately. `npm run build` regenerates it; it's
> gitignored, so it won't be committed (CI rebuilds it on deploy).

---

## The plan — get it built and live

1. **Install & build**
   ```bash
   npm install
   npm run build
   ```
   The build should print something like
   `✓ Built dist/ — 4 shows · 2 songs · 6 photos` and create `dist/`.

2. **Preview & verify** (`npm run serve`, then open the local URL). Sanity-check
   against `reference/original-single-file.html`. Confirm:
   - Home: hero/logo, scrolling ticker, the two video players, next-show teaser,
     merch strip, mailing-list section.
   - Routing works (hash routes): `#/shows`, `#/archive`, `#/listen`,
     `#/lyrics`, a single lyric like `#/lyrics/l-a`, `#/photos`, `#/booking`.
   - **Shows vs Archive** split correctly by today's date (dates are strings).
   - **Radio player** ("Tune In" button) opens and loads the Spotify embed.
   - **Gallery** opens the lightbox (arrows / swipe / Esc, prev button is above
     the image).
   - **Intro** plays once per session and is skippable / motion-safe.
   - **/booking** "Print / Save as PDF" → clean single-page A4.

3. **Fix anything that doesn't build or behave.** Likely suspects if something's
   off: a YAML quoting/indentation slip in `content/*.yml`, or the front-matter
   parse in `build.mjs`. Keep `dist/index.html` behaviourally identical to the
   reference file.

4. **Initialise git and push to GitHub**
   ```bash
   git init && git add -A && git commit -m "Hospital Radio. site"
   # create the repo (e.g. with gh) and push to main
   ```
   Running `npm install` will have created `package-lock.json` — commit it. (You
   may then switch the workflow's `npm install` to `npm ci` if you prefer.)

5. **Turn on Pages:** repo **Settings → Pages → Build and deployment →
   Source = "GitHub Actions"**. The workflow in `.github/workflows/deploy.yml`
   builds and deploys `dist/` on every push to `main`.

6. **Confirm the live URL** works end-to-end (re-run the checks from step 2).

---

## Architecture (how it fits together)

- **Content** lives in `/content` as YAML + Markdown (see `README.md` for the
  editing guide aimed at the non-dev band members).
- **The app** lives in `/src` (`index.html`, `styles.css`, `app.js`). It's the
  original site's markup/CSS/JS, unchanged in behaviour. The only change to the
  JS: instead of an inline `const CONFIG = {…}`, the top now reads
  `const CONFIG = window.SITE || {}`.
- **`build.mjs`** merges the content into one object and injects it into
  `src/index.html` at the `<!-- build:site-data -->` marker as
  `window.SITE = {…}`, then copies `styles.css`/`app.js` into `dist/`. Only
  dependency is `js-yaml`.

```
content/*.yml + lyrics/*.md  ──build.mjs──►  window.SITE  ──►  src/app.js renders
```

## Gotchas / invariants (don't regress these)

- **Dates in `shows.yml` must stay quoted strings** (`"2026-06-07"`). Unquoted,
  YAML parses them as Date objects and `app.js` (which does
  `new Date(date + "T00:00:00")`) breaks.
- **`src/index.html` must keep the `<!-- build:site-data -->` marker** — the
  build throws without it.
- **`window.SITE` must be defined before `app.js` runs.** The injected data tag
  sits immediately before `<script src="./app.js">`; keep that order.
- Lyrics files starting with `_` (e.g. `_TEMPLATE.md`) are intentionally ignored
  by the build.
- Asset links in `dist/index.html` are relative (`./styles.css`, `./app.js`), so
  Pages serves correctly from a project subpath.

## Possible enhancements (optional, only if asked)

- Commit `package-lock.json` and switch the workflow to `npm ci`.
- Minify `dist` assets in the build.
- Swap the OG/Twitter `image` in `src/index.html` for a real 1200×630 promo.
- Real lyrics in `content/lyrics/` (currently lorem ipsum placeholders).
