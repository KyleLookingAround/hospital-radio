# Hospital Radio. — website

The site for **Hospital Radio.**, a midwest-emo four-piece from Manchester.
It is built as a radio station you tune: every page is a frequency on the
dial, the home page is a working radio (static between stations, the band at
87.7), a 24-hour programme reorders the front page by the clock, the show log
is turned into a chart of every song ever played, and there is a request line
for dedications. All of it is driven from a handful of plain-text content
files so anyone in the band can update it. The design is explained in
[docs/REDESIGN.md](docs/REDESIGN.md).

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
| `content/band.yml` | Name, members, ticker headlines, links, the player, mailing list, the hero photo, the dead-air status line |
| `content/music.yml` | Releases (optionally with an mp3 for the radio), extra videos, the merch teaser |
| `content/gallery.yml` | Photos (files live in `public/assets/`) |
| `content/booking.yml` | The press kit / booking page (the promoter's file), incl. set length |

**The radio and the band's music.** Flick `pwr` in the tuner and the site makes
sound: static between stations, and the latest release as you tune towards
87.7. By default that is the release video's audio on the booth monitor. For
the full effect — the song heard through a real tuning filter, like a distant
station locking in — add an mp3 under `public/assets/audio/` and set
`audio: "/assets/audio/your-song.mp3"` on the release in `content/music.yml`
(or upload it in `/admin/`). Nothing plays until a visitor taps the switch.

**The programme.** The front page is ordered by what's "on air" in the
visitor's local time (the night shift, ward rounds, visiting hours…). The
schedule lives in `src/lib/programme.ts`; the copy is easy to change.

**The request line** (`/request.html`) needs nothing set up: fans build a
dedication card, save it, copy the text, and send it to the band by Instagram
DM or e-mail. Keep an eye on the DMs — the most-requested song is yours to play.

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
├── docs/REDESIGN.md          ← what the design is and how the radio works
├── src/
│   ├── content.config.ts       schemas that guard every content file at build time
│   ├── layouts/Base.astro      shared shell (head, the tuner, the monitor, footer)
│   ├── components/             the radio face, the vitals monitor, sheets, ledgers, stamps…
│   ├── pages/                  one .astro file per page (+ lyrics/[slug] for every song)
│   ├── scripts/                the behaviour layer: radio.ts (the dial + audio), clock.ts
│   │                           (the programme), tuner.ts, lightbox.ts, shows.ts…
│   ├── styles/                 all styling in cascade layers (tokens.css holds the palette)
│   └── lib/                    site.ts (stations, helpers), stats.ts (the ledger), images.ts
├── public/                   ← served as-is
│   ├── assets/                 photos, fonts (self-hosted), icons, the share card
│   ├── admin/                  the content editor (Sveltia CMS)
│   └── CNAME · robots.txt · 404.html · site.webmanifest
├── astro.config.mjs
└── .github/workflows/        deploy.yml (publish on main + weekly) · ci.yml (PR check)
```

Good to know: old share links using hash routes (`/#/shows`, `/#/lyrics/l-a`)
still work — a tiny shim on every page bounces them to the real pages. Fonts
are self-hosted in `public/assets/fonts/` (no Google Fonts CDN call). Photos
are resized to WebP at build time (`src/lib/images.ts`), so drop full-size
JPGs into `public/assets/` and the site does the rest. Every page works with
JavaScript switched off; the radio, the clock and the lightbox extras are
enhancements on top.
