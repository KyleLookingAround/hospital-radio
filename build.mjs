/**
 * Hospital Radio. — build
 *
 * Reads the human-friendly content in /content (YAML + Markdown),
 * merges it into one object, injects that into src/index.html as
 * `window.SITE`, and writes the deployable site to /dist.
 *
 *   content/site.yml        → everything except dates & lyrics
 *   content/shows.yml        → tour dates (a list)
 *   content/lyrics/*.md      → one song per file (front-matter + lyrics)
 *
 * Output:
 *   dist/index.html  (template + inlined window.SITE + JSON-LD for search engines)
 *   dist/styles.css  (minified from src)
 *   dist/app.js      (minified from src)
 *   dist/assets/     (copied from /assets — icons, images)
 *
 * Dependencies: js-yaml (content), esbuild (minify).   Run with:  npm run build
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { transformSync } from 'esbuild';

// The published URL — keep in sync with og:url/canonical in src/index.html.
// (Both move to the custom domain when there is one.)
const SITE_URL = 'https://kylelookingaround.github.io/hospital-radio/';

const root = dirname(fileURLToPath(import.meta.url));
const r = (...p) => join(root, ...p);

function loadYaml(rel) {
  const file = r(rel);
  if (!existsSync(file)) { console.warn(`!  missing ${rel} — skipping`); return undefined; }
  try {
    return yaml.load(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`Couldn't read ${rel} — check the indentation/quotes.\n   ${err.message}`);
  }
}

// 1) structured content ------------------------------------------------
const site  = loadYaml('content/site.yml')  || {};
const shows = loadYaml('content/shows.yml') || [];

// 2) lyrics — one markdown file per song (front-matter + body) ----------
const lyricsDir = r('content/lyrics');
let songs = [];
if (existsSync(lyricsDir)) {
  songs = readdirSync(lyricsDir)
    .filter(f => f.toLowerCase().endsWith('.md') && !f.startsWith('_') && !f.startsWith('.'))
    .map(f => {
      const raw = readFileSync(join(lyricsDir, f), 'utf8').replace(/^\uFEFF/, '');
      const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
      if (!m) throw new Error(`lyrics/${f} is missing its --- front-matter --- block.`);
      let front;
      try { front = yaml.load(m[1]) || {}; }
      catch (err) { throw new Error(`Front-matter in lyrics/${f} is malformed.\n   ${err.message}`); }
      return { ...front, lyrics: m[2].replace(/\s+$/, '') };
    })
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

// 3) assemble the single object the app reads as window.SITE -----------
const SITE = { ...site, shows, songs };

// 4) JSON-LD so search engines understand the band + upcoming gigs -----
const links = site.links || {};
const sameAs = ['spotify', 'appleMusic', 'youtube', 'tiktok', 'instagram', 'facebook', 'soundcloud']
  .map(k => links[k]).filter(Boolean);
const today = new Date().toISOString().slice(0, 10);
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MusicGroup',
  name: site.band?.name || 'Hospital Radio.',
  url: SITE_URL,
  genre: 'Midwest emo',
  foundingLocation: { '@type': 'City', name: 'Manchester' },
  sameAs,
  event: shows
    .filter(s => !s.example && String(s.date) >= today)
    .map(s => ({
      '@type': 'MusicEvent',
      name: `${site.band?.name || 'Hospital Radio.'} at ${s.venue}`,
      startDate: s.date,
      location: { '@type': 'Place', name: s.venue, address: s.city },
      ...(s.tickets ? {
        offers: {
          '@type': 'Offer',
          url: s.tickets,
          availability: s.soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        },
      } : {}),
    })),
};

// 5) inject into the template + write minified assets -------------------
const template = readFileSync(r('src/index.html'), 'utf8');
if (!template.includes('<!-- build:site-data -->')) {
  throw new Error('src/index.html is missing the <!-- build:site-data --> marker.');
}
// escape "<" so nothing in the data (e.g. "</script>") can break the inline tags
const esc = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const dataTag =
  `<script>window.SITE = ${esc(SITE)};</script>\n` +
  `<script type="application/ld+json">${esc(jsonLd)}</script>`;
const html = template.replace('<!-- build:site-data -->', dataTag);

const minify = (file, loader) =>
  transformSync(readFileSync(r('src', file), 'utf8'), { loader, minify: true }).code;

mkdirSync(r('dist'), { recursive: true });
writeFileSync(r('dist/index.html'), html);
writeFileSync(r('dist/styles.css'), minify('styles.css', 'css'));
writeFileSync(r('dist/app.js'), minify('app.js', 'js'));
if (existsSync(r('assets'))) cpSync(r('assets'), r('dist/assets'), { recursive: true });

console.log(`✓ Built dist/  —  ${shows.length} shows · ${songs.length} songs · ${(site.gallery || []).length} photos`);
