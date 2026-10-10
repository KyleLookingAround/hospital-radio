# Hospital Radio. — the redesign

*A small station that keeps a meticulous log.*

This document explains what the redesign is, how it works, and where to change things. The band-facing editing guide is the [README](../README.md); the visual rules are in [BRANDING.md](../BRANDING.md).

---

## 1. The idea

The site is calm, cream and typographic, and its substance is the band's own record. The 24-show, 18-setlist archive stops being a grey list and becomes the station's **ledger**: every song ever played gets a page, a chart ranks them by plays with pencil tally marks, openers and closers are stamped, cities and venues are tallied, and the first gig is marked as the first transmission. The band's history is drawn once as a thin **pulse line**, a heartbeat with one beat per show, flat in dead air and busy on tour. With nothing booked the schedule says so plainly ("between transmissions · 21 days of dead air") and shows what went out last, so the site never looks abandoned. Photography is used large and in colour, with navy reserved for two places: the photo hero and the footer. There is also a **request line**: fans pick a song and a ward, write a dedication, and send it to the band.

## 2. The system

**One material, two accents.** The body is cream paper (`--paper`) with navy ink (`--ink`). The hero and the footer carry the class `.booth` and switch to navy with cream text and pink accents. Components use "booth" tokens that resolve to paper values everywhere else, so a block reads correctly wherever it sits. The allowed text pairings are listed in `src/styles/tokens.css`; they all pass WCAG AA and every page is checked with axe.

**Type.** Fraunces for the voice (the wordmark at 600, titles at 330 with an italic rose accent word, chart numerals at 700), IBM Plex Mono only for small data (dates, counts, ledger lines, labels), Caveat for one handwritten line per screen at most. The same self-hosted files as before; no new fonts.

**Photos.** Resized to WebP at build time (`src/lib/images.ts`), always with width and height, lazy below the fold. Desaturated slightly by default (the brand's treatment); colour returns on hover and in the lightbox.

**Motion** is sparse and lives in one file (`src/styles/motion.css`) inside the reduced-motion guard: the hero fades in, the pulse line draws and tally marks fill as they scroll into view. With reduced motion everything renders at rest.

**Styles** moved from `public/styles.css` to `src/styles/` in cascade layers (`fonts, tokens, base, shell, components, pages, motion, print`), one file per page under `src/styles/pages/`.

## 3. The ledger (`src/lib/stats.ts`)

Everything is derived at build from `content/shows.yml`: per-song plays (a song repeated in one set counts once and is stamped ×2), openers, closers, first and last played, longest run, debut show; venue and city tallies; headline numbers; the acts the band has shared stages with, parsed from the free-text `with` lines; the median set length; photo groups by caption. Nothing is typed by hand, so the chart, the pulse, the stats and the promoter's numbers update when a show is logged.

## 4. Pages

| Page | What it is now |
|---|---|
| `/` | Photo hero with the wordmark and one status line; the pulse line and the ledger numbers; latest releases; the chart (top five); last heard (or up next); photos; merch |
| `/shows.html` | The schedule, or the dead-air state: days since the last show, the last three with their running orders, where the band has played, how to book |
| `/archive.html` | The log: year bands, numbered transmissions, running orders with opener / closer / debut stamps, the first gig marked, the stats sheet, "I was there" stamps kept in the visitor's browser |
| `/lyrics.html` | The chart of every song ever played, with tally marks, play counts, a square per logged set, and the openers and closers |
| `/lyrics/<song>.html` | One page per song: the words when they are filed, the punch card of the shows it was played at, the facts, "heard at" |
| `/listen.html` | The bio, platform links, releases, other videos |
| `/photos.html` | Photos grouped by venue, with a lightbox that works without JavaScript |
| `/booking.html` | The promoter's file: the pitch, the numbers, the dossier, recent rooms, one-tap contact; prints to A4 |
| `/request.html` | The request line: a dedication card to save, copy and send |

Old links keep working: every URL is unchanged and the hash-route shim is still in `Base.astro`. Every page works with JavaScript switched off.

## 5. Content changes (all additive, all mirrored in `/admin`)

| File | Field | Default | Used for |
|---|---|---|---|
| `band.yml` | `heroPhoto` | `""` → first landscape gallery photo | the photo behind the home-page hero |
| `band.yml` | `status` | `""` | a handwritten line under "last heard" when nothing is booked |
| `music.yml` | `releases[].audio` | `""` | reserved for a hosted audio file; not used by the site yet |
| `booking.yml` | `setLength` | `""` | the "typical set" line on the promoter's file |

Nothing was renamed or removed; a bad edit still fails the build and leaves the live site as it was.

## 6. What was tried and dropped
An earlier pass made the home page a working radio (a draggable dial with synthesised static, the band's music fading in at 87.7, pages as frequencies, a clock-driven programme that reordered the front page, a bedside monitor, two-ink riso prints, stickers and tape). It was too much, and it was cut back to what you see now. The pulse line and the ledger are what survived.
