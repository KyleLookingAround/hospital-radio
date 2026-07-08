# Hospital Radio. — website

The site for **Hospital Radio.**, a midwest-emo four-piece from Manchester.
Shows, the archive (with setlists), releases, lyrics, photos and a press kit —
all driven from a handful of plain-text content files so anyone in the band
can update it.

**Live site: https://hospitalradiofullstop.co.uk/**

It's a **static site**, built with [Astro](https://astro.build) and served by
GitHub Pages. Every page is real HTML (search engines can finally read the
shows and lyrics), with a light JavaScript layer on top for the CRT intro, the
"Tune In" broadcast dock, click-to-play videos and the photo lightbox. The
site works with JavaScript switched off.

---

## ✏️ Updating the site (no coding needed)

**The easy way: the editor at [`/admin/`](https://hospitalradiofullstop.co.uk/admin/).**
Every content file as a simple form — add a show, paste lyrics, upload photos.
Hit **Save** and the site rebuilds and goes live a minute or two later.

Signing in: you need a (free) GitHub account added as a **collaborator** on
this repository, and a *classic* personal access token (GitHub → Settings →
Developer settings → Tokens (classic) → Generate new token, tick the **repo**
scope). Paste it into the editor's sign-in box once; it's remembered.

**The hands-on way:** edit the files in [`content/`](content/) on github.com:

| File | What's in it |
|---|---|
| `content/shows.yml` | Tour dates — the file you'll edit most. The site sorts upcoming vs archive by date automatically. |
| `content/lyrics/` | One markdown file per song (`_TEMPLATE.md` shows the format). Repeated verses style as the chorus automatically. |
| `content/band.yml` | Name, members, ticker headlines, links, the radio dock, mailing list |
| `content/music.yml` | Releases, extra videos, the merch teaser |
| `content/gallery.yml` | Photos (files live in `public/assets/`) |
| `content/booking.yml` | The press kit / booking page |

**A safety net either way:** every edit is checked when the site rebuilds. If
something's off, the build stops with a clear message and **the live site
stays exactly as it was** — you'll get an email from GitHub saying the
workflow failed, which just means the last edit didn't go live.

---

## 🛠️ Running it locally (for developers)

```bash
npm install      # one time
npm run dev      # live-reloading dev server at http://localhost:4321
npm run build    # writes the finished site to dist/
npm run preview  # serves the built dist/
```

---

## 🚀 How it gets published

Pushing to `main` (including saving in `/admin/`) triggers
`.github/workflows/deploy.yml`, which builds and deploys `dist/` to GitHub
Pages on the custom domain (`public/CNAME`). Pull requests get a build check
(`ci.yml`). A weekly scheduled build keeps the upcoming/archive show split
fresh even when nothing's been edited — and the site also nudges stale rows
client-side between builds.

---

## 📁 Project structure

```
hospital-radio/
├── content/                  ← edit these: all the site's words
├── src/
│   ├── content.config.ts       schemas that guard every content file at build time
│   ├── layouts/Base.astro      shared shell (head, nav, footer, radio dock, lightbox)
│   ├── components/             show rows, video facades, the EKG divider…
│   ├── pages/                  one .astro file per page (+ lyrics/[slug])
│   ├── scripts/app.ts          the behaviour layer (intro, dock, lightbox, reveals)
│   └── lib/site.ts             build-time helpers (show split, lyrics, JSON-LD)
├── public/                   ← served as-is
│   ├── styles.css              all styling (design tokens at the top)
│   ├── assets/                 photos, fonts (self-hosted), icons
│   ├── admin/                  the content editor (Sveltia CMS)
│   └── CNAME · robots.txt · 404.html · site.webmanifest
├── astro.config.mjs
└── .github/workflows/        deploy.yml (publish on main + weekly) · ci.yml (PR check)
```

Good to know: old share links using hash routes (`/#/shows`, `/#/lyrics/l-a`)
still work — a tiny shim on every page bounces them to the real pages. Fonts
are self-hosted in `public/assets/fonts/` (no Google Fonts CDN call). The
gallery JPGs are served as-is; resizing the largest ones is a nice future win.
