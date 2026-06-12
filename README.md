# Hospital Radio. — website

The official site for Hospital Radio., a Manchester midwest-emo four-piece.
A grain-soaked broadcast: shows, releases, an in-page radio player, lyrics,
photos, a mailing list and a press kit — all driven from a few plain-text
content files so anyone can update it.

**Live site: https://kylelookingaround.github.io/hospital-radio/**

It's a **static site**. A small build step turns the content files into a
finished site in `dist/`, and GitHub Pages serves it. There's no database and
nothing to run in the background.

---

## ✏️ Updating the site (no coding needed)

You only ever touch the **`content/`** folder. The three things you'll change:

### Add or change a gig → `content/shows.yml`
Open the file, copy one of the show blocks, paste it, and change the details.
Dates go in quotes as `"YYYY-MM-DD"`. The site automatically files anything
in the future under **Shows** and anything past under **Archive** — you never
sort by hand. (Remember to delete the two `example:` shows once you've added
real ones.)

### Add lyrics → `content/lyrics/`
Each song is its own file. Copy `_TEMPLATE.md`, rename it (e.g.
`3-new-song.md`), fill in the title/year/link at the top, and type the words
below. That's it — it appears on the Lyrics page automatically.

### Everything else → `content/site.yml`
Band name, social links, releases, merch, the photo gallery, the radio
player and the press-kit details all live here, each clearly labelled with a
comment explaining what it does. Change the text inside the `"quotes"`, keep
the labels and the indentation as they are.

> **Editing on github.com is the easy way:** open any file in the `content/`
> folder, click the ✏️ pencil, make your change, and hit *Commit*. The site
> rebuilds and goes live on its own a minute or two later.

A couple of gentle rules so nothing breaks: keep dates inside quotes, use
spaces (never tabs) for indentation, and line up the `-` and indentation in a
list with the examples already there.

---

## 🛠️ Running it locally (for developers)

```bash
npm install      # one time
npm run build    # writes the finished site to dist/
npm run serve    # builds, then serves dist/ at http://localhost:5173
```

---

## 🚀 How it gets published

Pushing to the `main` branch (including editing content on github.com) triggers
the GitHub Actions workflow in `.github/workflows/deploy.yml`, which builds the
site and deploys `dist/` to **GitHub Pages**.

One-time setup: in the repo, go to **Settings → Pages → Build and deployment**
and set **Source = "GitHub Actions"**.

---

## 📁 Project structure

```
hospital-radio/
├── content/                  ← edit these (plain text, no code)
│   ├── site.yml              ← band, links, releases, merch, gallery, press, settings
│   ├── shows.yml             ← tour dates
│   └── lyrics/
│       ├── _TEMPLATE.md      ← copy this to add a song (ignored by the build)
│       ├── 1-la.md
│       └── 2-dreaming.md
├── src/                      ← the site itself (for developers)
│   ├── index.html            ← page structure
│   ├── styles.css            ← all styling
│   └── app.js                ← behaviour (routing, players, gallery, intro…)
├── build.mjs                 ← merges content/ → dist/
├── package.json
├── .github/workflows/deploy.yml
├── dist/                     ← the built site (generated; not committed)
└── reference/
    └── original-single-file.html   ← the pre-split version, for reference
```

**How the build works:** `build.mjs` reads `site.yml`, `shows.yml` and the
lyrics files, combines them into one object, and injects it into the page as
`window.SITE`. `src/app.js` reads `window.SITE` and renders everything. So the
*content* lives in `content/` and the *behaviour* lives in `src/` — they're
never tangled together.

---

## 📌 Good to know / nice next steps

- **Brand palette** — the whole look is driven by the band's three colours
  (cream `#F5E9D7`, navy `#2D458F`, pink `#DF8090`), defined once as design
  tokens at the top of `src/styles.css` (`:root`). Change them there and the
  entire site re-themes.
- **Logo** — the hero pulls the band's "Shade" logo from Big Cartel. To use a
  different one, change `band.logoImage` in `site.yml` (or set it to `""` to use
  the typed wordmark, which always looks right).
- **Share image** — for the best-looking link previews (WhatsApp, Discord, etc.)
  add a 1200×630 promo image and point the `og:image`/`twitter:image` tags in
  `src/index.html` at it. It currently uses a photo from the store.
- **Gallery photos** are pulled live from Big Cartel; they work now but can
  disappear if the store theme changes — re-host them somewhere permanent when
  convenient and update the URLs in `site.yml`.
- **Lyrics** are placeholder lorem ipsum until the band drops their real words
  into the files in `content/lyrics/`.
- **Custom domain** — add a `CNAME` file (or set it in Settings → Pages) when
  you've got one.
