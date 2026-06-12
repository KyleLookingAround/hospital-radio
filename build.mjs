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
 *   dist/index.html  (template + inlined window.SITE)
 *   dist/styles.css  (copied from src)
 *   dist/app.js      (copied from src)
 *
 * Only dependency: js-yaml.   Run with:  npm run build
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

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

// 4) inject into the template + copy assets ----------------------------
const template = readFileSync(r('src/index.html'), 'utf8');
if (!template.includes('<!-- build:site-data -->')) {
  throw new Error('src/index.html is missing the <!-- build:site-data --> marker.');
}
// escape "<" so nothing in the data (e.g. "</script>") can break the inline tag
const dataTag = `<script>window.SITE = ${JSON.stringify(SITE).replace(/</g, '\\u003c')};</script>`;
const html = template.replace('<!-- build:site-data -->', dataTag);

mkdirSync(r('dist'), { recursive: true });
writeFileSync(r('dist/index.html'), html);
copyFileSync(r('src/styles.css'), r('dist/styles.css'));
copyFileSync(r('src/app.js'), r('dist/app.js'));

console.log(`✓ Built dist/  —  ${shows.length} shows · ${songs.length} songs · ${(site.gallery || []).length} photos`);
