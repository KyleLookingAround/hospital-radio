# Hospital Radio. — the redesign

*87.7 FM is a real radio. The site is a small station that broadcasts to people stuck in beds, takes requests, keeps a meticulous log, and runs all night.*

This document explains what the redesign is, how it works, and where to change things. The band-facing editing guide is still the [README](../README.md); the visual rules are in [BRANDING.md](../BRANDING.md).

---

## 1. The idea in one paragraph

Every page is a **station on the dial**. The home page is a radio face you actually tune: drag the band or the knob, use the arrow keys, scroll on it. Between stations you hear static; approach 87.7 and the band fades in. Let go on another station and the site retunes through a flash of static. The station is **always on air**: a 24-hour programme (the night shift, ward rounds, visiting hours…) is read from the visitor's clock, named in the tuner, and used to reorder the home page, so the site is different at 2am than at 6pm. The 24-show, 18-setlist archive is the station's **ledger**: every song ever played gets a page, a chart, tally marks, openers and closers, cities and venues, and a bedside **ECG whose beats are the gigs**. Hospital radio takes dedications, so there is a **request line**: fans pick a song and a ward, write a dedication, and get a card to post and a DM to send; the most-requested song gets played at the next show. Visually it is a two-ink **riso print** of the band's photography (navy and pink, misregistered, halftoned) with cream paper sheets, stickers, tape and stamps pinned onto a navy booth.

## 2. The three pillars

### The radio (`src/scripts/radio.ts`, `src/components/RadioFace.astro`, `src/components/Tuner.astro`)
- The band runs 87.0–91.4 FM. Stations: index 87.7 · shows 88.1 · archive 88.5 · lyrics (songs) 88.9 · listen 89.3 · photos (the darkroom) 89.7 · booking (for promoters) 90.1 · request 90.5. The table is `STATIONS` in `src/lib/site.ts`; adding a page is one row.
- Signal strength = closeness to the nearest station. It drives the readout, the needle, the knob angle, the five-bar meter, and the "fragment" of the nearest station's content that bleeds in (built at build time in `Base.astro`).
- **Power** (the `pwr` switch in the tuner, the big switch on the face) gates all sound, so nothing plays until a tap. Static is synthesised with the Web Audio API (white noise through a band-pass filter, with random crackle), louder the further you are from a station.
- **The band's music.** Near 87.7 the latest release plays on the booth monitor: by default the release video's audio through YouTube's player API (volume follows the signal, the tray opens so the video is visible). If a release has an `audio` field (`content/music.yml`, an mp3 under `public/assets/audio/`), the radio plays that file through a real tuning chain instead: a low-pass filter that opens as the signal locks, so an off-station song sounds like a distant AM broadcast. Drop in the files and the richer version switches on by itself.
- Letting go within ±0.12 FM of another station navigates there after 420 ms. Cross-document view transitions (`@view-transition`) morph the needle and readout and play the static keyframes. The last frequency is remembered per session so the readout sweeps in from where you left it.
- Keyboard: arrows ±0.1, shift+arrows ±0.5, PageUp/PageDown to the next/previous station, Home/End, Enter to go. The knob is a `role="slider"`. With JavaScript off the band's station labels and the tuner's ruler are plain links, and the DIAL sheet is a `<details>`.

### The programme (`src/lib/programme.ts`, `src/scripts/clock.ts`)
Seven programmes cover the day. `clock.ts` sets `html[data-programme]` and `html[data-shift="day|night"]`, writes the clock and the programme name into `[data-clock]` / `[data-programme-name]` / `[data-programme-strap]`, and sets `order` on the home page's `[data-slot]` sections so the programme's lead slots come first. After 21:00 and before 06:00 the booth dims. The build renders the daytime default so the page is complete without scripts. The weekly rebuild keeps the "days of dead air" counter honest; `[data-since]` is recomputed client-side too.

### The ledger (`src/lib/stats.ts`)
Everything is derived at build from `content/shows.yml`: per-song plays (a song repeated in one set counts once, and is stamped ×2), openers, closers, first/last played, longest run, debut show; venue and city tallies; headline numbers; shared stages parsed from the free-text `with` lines; median set length; gallery groups by caption; the lamp state. Nothing is typed by hand, so the chart, the ECG, the stats strip and the promoter's numbers all update when a show is logged.

## 3. The system

**Two materials.** The body is the navy **booth** (`--booth`, with `--booth-2` for raised chrome and `--booth-3` for the darkroom and screens). Anything you read sits on a cream **sheet** (`Sheet.astro`, `.sheet`). Navy ink appears only on paper; cream and pink only on the booth; Caveat handwriting only on paper. Allowed text pairings are listed in `src/styles/tokens.css`; they all pass WCAG AA and the build is checked with axe.

**Type.** Fraunces for the voice (the wordmark at 600, titles at 330 with an italic pink accent word, numerals at 700), IBM Plex Mono for everything that reads as equipment (readouts, labels, ledgers, dates, tabular numbers), Caveat for one handwritten line per screen. The same self-hosted files as before; no new fonts.

**Riso print.** `.riso` turns any photo into a two-ink print: the image is desaturated and screened over navy, a pink layer multiplies over it, a radial-gradient halftone sits on top, and an optional `.riso-ghost` copy drifts a few pixels for misregistration. Stickers (`.sticker`), tape (`.tape` on sheet corners), rubber stamps (`Stamp.astro`), tally marks (`Tally.astro`), marker highlights (`.marker`) and wayfinding-sign rows (`.dial-row.sign`) are the rest of the vocabulary.

**Motion** lives in one file (`src/styles/motion.css`) inside `prefers-reduced-motion: no-preference`: station-change transitions, the lamp's breathe/beat, sheets settling and traces drawing on scroll (`animation-timeline: view()` behind `@supports`), the monitor sweep, the print's drift. With reduced motion everything renders at rest.

**Styles** moved from `public/styles.css` to `src/styles/` with cascade layers (`fonts, tokens, base, shell, components, pages, motion, print`) so no file needs `!important` and pages can be built independently.

## 4. Pages

| Station | Page | What it is now |
|---|---|---|
| 87.7 | `/` | The radio face, the programme strip with the vitals monitor, then the day's slots: latest transmissions, the schedule slip (or "between transmissions" with the last three shows), the chart, the request-line slip, the signal-has-reached stats, the photo strip, a lyric excerpt, the station shop |
| 88.1 | `/shows.html` | The schedule, or the dead-air state with the last transmissions and their running orders |
| 88.5 | `/archive.html` | The log: year bands, numbered rows, running orders with opener/closer/debut stamps, the first transmission stamped, the stats sheet, "were you there?" |
| 88.9 | `/lyrics.html`, `/lyrics/<song>.html` | The chart of every song ever played; one page per song with the words (when filed), a punch card of the shows it was played at, facts and "heard at" |
| 89.3 | `/listen.html` | The bio, platform presets, releases, off-air videos |
| 89.7 | `/photos.html` | The darkroom: riso contact sheet by venue, colour under your finger, a lightbox that works without JavaScript |
| 90.1 | `/booking.html` | The promoter's file: a stamped patient chart with the numbers, the dossier, recent rooms and one-tap contact; prints to A4 |
| 90.5 | `/request.html` | The request line and the patient record |

Old links keep working: every URL is unchanged and the hash-route shim is still in `Base.astro`.

## 5. Content changes (all additive, all mirrored in `/admin`)

| File | Field | Default | Used for |
|---|---|---|---|
| `band.yml` | `heroPhoto` | `""` → first landscape gallery photo | the print behind the radio face |
| `band.yml` | `status` | `""` | the handwritten line in the dead-air state |
| `band.yml` | `intro.enabled` | unchanged | now toggles the static between stations |
| `music.yml` | `releases[].audio` | `""` | an mp3 for the radio to play through the tuning filter |
| `booking.yml` | `setLength` | `""` | the "typical set" line on the promoter's file |

Nothing was renamed or removed; a bad edit still fails the build and leaves the live site as it was.

## 6. What we deliberately did not do
No theme toggle (the booth and the paper are the theme). No new fonts, frameworks or CDNs. No client-side data or fake numbers. No audio before a tap. No autoplay, no CRT overlays, no glitch effects. No storage of requests: the card, the DM and the e-mail are the delivery, and the band keeps the tally.
