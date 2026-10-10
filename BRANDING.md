# Hospital Radio. — Brand Guidelines

*A grain-soaked midwest-emo broadcast from Manchester.*

Hospital Radio. is a four-piece (Mike, Curtis, Russo, Tom), formed **MMXXIII**
(2023). The brand is built on one idea: the band as a **small in-hospital
radio station** — an 87.7 FM transmission, heart-on-sleeve and a little
broken. On the website that idea is carried quietly: in the words (the log,
transmissions, dead air, the request line) and in one detail, the pulse line,
not in gimmicks.

> The whole system is defined once as design tokens in
> `src/styles/tokens.css` (`:root`). This document explains those tokens;
> change them there and the site re-themes. The web design itself is
> described in `docs/REDESIGN.md`.

---

## 1. The name & wordmark

- The name is always **"Hospital Radio."** — *with the full stop.* The dot is
  part of the mark, not punctuation you can drop.
- In the UI the wordmark is set **lowercase**: `hospital radio.`
- **Two-tone rule:** `hospital` sits in navy (`--ink`); `radio` and the dot
  take the pink/rose accent. On dark surfaces (the dock) `radio.` uses the
  brighter pink (`--pink`); on light surfaces it uses the deeper rose
  (`--rose`) for legibility.
- Typeset in **Fraunces, weight 600**, tight tracking (`-0.03em`).

**Don't:** drop the full stop · title-case or all-caps the wordmark · recolour
"hospital" · stretch, outline, or add effects beyond the defined glow on the dot.

### Logo
- The primary logo is the **radio-with-headphones mascot** (`assets/logo.png`),
  shown large in the hero.
- If the image is missing, the site falls back to the **typed wordmark** — that
  fallback always looks right and is an acceptable logo on its own.
- Give the logo generous clear space; never crowd it with text or borders.

---

## 2. Colour palette

The band's three colours — **cream, navy, pink** — carry the whole identity.
Everything else is a tint or surface derived from them.

### One material, two accents
The page is cream paper with navy ink. Navy as a surface (`--booth #16224A`)
appears in exactly two places — the photo hero and the footer — where text is
cream and the accent is pink. Everywhere else the accent is rose.

### Core three
| Role | Hex | Token | Use |
|------|-----|-------|-----|
| Cream (paper) | `#F5E9D7` | `--paper` | The page. Every background starts here. |
| Navy (ink) | `#2D458F` | `--ink` | All primary text, lines, the "hospital" wordmark. |
| Pink (accent) | `#DF8090` | `--pink` | Decorative pops — the dot, glows, the live lamp, dark-surface accents. |

### Navy text tints (cool, for hierarchy)
| Hex | Token | Use |
|-----|-------|-----|
| `#1D2E63` | `--ink-deep` | Hover/pressed states, deepest text. |
| `#52649F` | `--muted` | Secondary text, body copy on light. |
| `#6F7CAC` | `--soft` | Tertiary — mono labels, captions. |
| `#A2AACB` | `--faint` | Faintest meta, disabled, watermarks. |

### Rose (the legible pink)
| Hex | Token | Use |
|-----|-------|-----|
| `#C5586C` | `--rose` | Pink that stays legible at small sizes — links, kickers, small accent text, the "radio" wordmark on light. |
| `#A8455A` | `--rose-deep` | Hover for rose elements, hairline dashes. |

> **Pink vs. rose:** `--pink` (#DF8090) is the signal colour *on the booth*
> (it passes AA there) and purely decorative on paper. On paper, small accent
> text uses `--rose-text` (#9E3A4F); `--rose` (#C5586C) is for display sizes
> and borders only. `--soft` and `--faint` are never used for small text. The
> build is checked with axe and these are the only pairings that pass.

### Surfaces & hairlines
| Token | Value | Use |
|-------|-------|-----|
| `--paper-2` | `#EFE2CB` | Slightly deeper cream — gradients, the dock embed. |
| `--card` / `--card-2` | `#FBF3E3` / `#F3E7CF` | Raised "paper stock" panels (cards, dossier, hero). |
| `--line` | `rgba(45,69,143,.22)` | Standard navy hairline. |
| `--line-2` | `rgba(45,69,143,.42)` | Stronger borders, dial ticks. |
| `--shadow` | `0 20px 50px -24px rgba(45,69,143,.30)` | The one soft, navy-tinted elevation shadow. |

**Contrast:** navy on cream is the workhorse pair. Reserve pink/rose for
emphasis — it should feel like a signal cutting through, never the body.

---

## 3. Typography

Three families, each with a clear job. Defined as `--serif`, `--mono`,
`--scrawl`; loaded from Google Fonts.

### Fraunces — *the voice* · `--serif`
`"Fraunces", Georgia, serif` · variable (optical sizing on).
- **Used for:** headings (`h1`–`h3`), the wordmark, lyric titles, release &
  venue names, and body copy.
- **Weights:** Light **330** (large italic section titles), Regular **400**
  (body), Semibold **600** (wordmark), Black **900** (display emphasis).
- Italic is used for the accent word in section heads (e.g. Latest
  *transmissions*). Tight tracking on large sizes (`-0.03em` to `-0.045em`).

### IBM Plex Mono — *the machine* · `--mono`
`"IBM Plex Mono", ui-monospace, monospace` · weights 300–700 (+ italic).
- **Used for:** everything that should feel like equipment read-out — nav,
  buttons, kickers/labels, dates, metadata, frequencies, the tuner dial,
  ticker, "ON AIR" / "NOW BROADCASTING".
- Almost always **UPPERCASE** with wide letter-spacing (`.16em`–`.34em`) and
  small (10–13px).

### Caveat — *the human* · `--scrawl`
`"Caveat", cursive` · weights 400/600.
- **Used for:** handwritten asides — the hero scrawl ("dead air never sounded
  so good"), show notes, the footer credit, empty-state lines.
- Always slightly rotated (`-1°` to `-2°`) and in rose. Use sparingly — it's
  the warm, off-the-cuff voice, not a workhorse.

**Pairing rule:** serif for substance, mono for system chrome, scrawl for
personality. A typical block reads: mono kicker → big Fraunces headline →
mono meta, with the occasional Caveat aside.

---

## 4. Voice & tone

Write like a late-night radio broadcast that's a bit in love and a bit falling
apart. Warm, wry, lowercase, never corporate.

**Lexicon (use these):** transmission · broadcast · on air · now broadcasting ·
tune in · dead air · the booth · the dial · signal · 87.7 FM · est. MMXXIII.
Hospital nods are welcome but dry (the press kit is a "patient file", ref
**HR-877**).

- **Sections** are framed as broadcast language: Shows = the schedule, Archive =
  the *transmission log*, Photos = *transmissions*, mailing list = *join the
  broadcast*, press kit = *for promoters / patient file*.
- Prefer lowercase for the wordmark and ticker; sentence case elsewhere.
- Earnest over ironic. Midwest-emo sincerity is the point.

---

## 5. Motifs & UI signatures

These recurring details *are* the brand as much as the logo:

- **The pulse line** — the band's history as one thin ECG line, a beat per
  show, placed by date. It sits under the home-page hero and marks the years
  in the log.
- **Tally marks** — pencil strokes in fives for play counts on the chart.
- **Rubber stamps** — small mono labels: OPENER, CLOSER, DEBUT, FIRST
  TRANSMISSION, UP NEXT.
- **Ledger lines** — label, dotted leader, value: the footer, the facts on a
  song page, the numbers on the promoter's file.
- **The lamp** — a small rose dot in the header with the one line that matters
  ("on air since may ’25", "live tonight").

Dropped: the animated grain, scanline and vignette overlays, the light leaks,
the glitch hover, the ticker and the one-time CRT intro. Motion is sparse —
the hero fades in, the pulse draws, tallies fill — and all of it respects
`prefers-reduced-motion`.

---

## 6. Photography

- **Treatment:** used large and nearly natural — a light desaturation
  (`grayscale(.35)`) so shots sit together; colour returns on hover and in
  the lightbox. The home hero sits under a navy wash so the wordmark reads.
- Live shots, grain, and low light suit the brand; over-polished, bright,
  saturated stock imagery does not.
- **Self-host** everything in `public/assets/` (logo, gallery, share image)
  so it deploys with the site; the build resizes photos to WebP. The
  link-preview/share image is `public/assets/og-image.jpg` (1200×630).

---

## 7. Quick reference

```css
/* Paper (the page) */
--paper:#F5E9D7;  --paper-2:#EFE2CB;            /* page / deeper cream  */
--card:#FBF3E3;   --card-2:#F3E7CF;             /* quiet cards          */
--ink:#2D458F;    --ink-deep:#1D2E63;           /* navy text            */
--muted:#4A5C97;  --soft:#6F7CAC;               /* secondary / display  */
--rose:#C5586C;   --rose-text:#9E3A4F;  --rose-deep:#8C3142;  /* accents */
--marker:color-mix(in srgb, var(--pink) 42%, transparent);  /* highlighter */
--line:rgba(45,69,143,.22);  --line-2:rgba(45,69,143,.42);  /* hairlines */
/* Navy, used as a surface only inside .booth (the hero, the footer) */
--booth:#16224A;  --booth-ink:#F5E9D7;  --pink:#DF8090;

/* Type */
--serif:"Fraunces",Georgia,serif;               /* headings, body, mark */
--mono:"IBM Plex Mono",ui-monospace,monospace;  /* labels, nav, meta    */
--scrawl:"Caveat",cursive;                       /* handwritten accents  */
```

**Constants:** Name *Hospital Radio.* · Frequency *87.7 FM* · Founded *MMXXIII* ·
From *Manchester* · Genre *midwest emo* · Tagline *"Manchester · midwest emo"* ·
Scrawl *"dead air never sounded so good"*.

*Source of truth: the `:root` tokens in `src/styles/tokens.css`. Keep this
document and those tokens in sync.*
