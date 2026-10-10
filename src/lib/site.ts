/**
 * Hospital Radio. — build-time helpers shared by the layout and pages.
 * (Ported from the old client-side app.js and build.mjs.)
 */
import { getCollection, getEntry } from 'astro:content';

/* ── the stations: every page is a frequency on the dial ── */
export type Station = { id: string; freq: string; href: string; label: string };
export const STATIONS: Station[] = [
  { id: 'index',   freq: '87.7', href: '/',             label: 'index' },
  { id: 'shows',   freq: '88.1', href: '/shows.html',   label: 'shows' },
  { id: 'archive', freq: '88.5', href: '/archive.html', label: 'log' },
  { id: 'lyrics',  freq: '88.9', href: '/lyrics.html',  label: 'songs' },
  { id: 'listen',  freq: '89.3', href: '/listen.html',  label: 'listen' },
  { id: 'photos',  freq: '89.7', href: '/photos.html',  label: 'photos' },
  { id: 'booking', freq: '90.1', href: '/booking.html', label: 'press' },
  { id: 'request', freq: '90.5', href: '/request.html', label: 'requests' },
];
/** the dial's visible band and where the stations sit on it */
export const BAND = { min: 87.0, max: 91.4, first: 87.7, last: 90.5 };
export const station = (id: string) => STATIONS.find((s) => s.id === id) ?? STATIONS[0];

export const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export async function getBand() {
  const entry = await getEntry('band', 'main');
  if (!entry) throw new Error('content/band.yml is missing');
  return entry.data;
}

export async function getMusic() {
  const entry = await getEntry('music', 'main');
  if (!entry) throw new Error('content/music.yml is missing');
  return entry.data;
}

export async function getBooking() {
  const entry = await getEntry('booking', 'main');
  if (!entry) throw new Error('content/booking.yml is missing');
  return entry.data;
}

export async function getGallery() {
  const entry = await getEntry('gallery', 'main');
  if (!entry) throw new Error('content/gallery.yml is missing');
  return entry.data.photos;
}

/* ── shows ── */
export type Show = {
  date: string; venue: string; city: string;
  with?: string; tickets?: string; soldOut?: boolean; note?: string;
  setlist?: string[]; example?: boolean;
  _d: Date;
};

const parseDay = (s: string) => new Date(s + 'T00:00:00');
const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export async function getShows(): Promise<{ upcoming: Show[]; past: Show[] }> {
  const entry = await getEntry('shows', 'main');
  const all: Show[] = (entry?.data.shows ?? [])
    .map((s) => ({ ...s, _d: parseDay(s.date) }))
    .filter((s) => !isNaN(s._d.getTime()));
  const today = todayStart();
  return {
    // the build-time split; a small client-side check re-hides anything that
    // slips past between deploys (plus the weekly rebuild cron)
    upcoming: all.filter((s) => s._d >= today).sort((a, b) => +a._d - +b._d),
    past: all.filter((s) => s._d < today).sort((a, b) => +b._d - +a._d),
  };
}

/** " ’25" year suffix, only when the show isn't this year */
export const yearSuffix = (d: Date) =>
  d.getFullYear() === new Date().getFullYear() ? '' : ' ’' + String(d.getFullYear()).slice(2);

/* ── songs / lyrics ── */
export const slug = (s: string) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function getSongs() {
  const entries = await getCollection('lyrics');
  return entries
    .map((e) => ({ ...e.data, lyrics: (e.body ?? '').replace(/\s+$/, ''), slug: slug(e.data.title) }))
    .sort((a, b) => a.order - b.order);
}

const esc = (t: unknown) =>
  String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

/** Render a lyric body into verse blocks — highlights the repeated chorus
 *  and mutes parenthetical backing lines. (Port of the old renderLyrics.) */
export function renderLyrics(text: string): string {
  const stanzas = String(text || '').replace(/\r\n/g, '\n').trim().split(/\n[ \t]*\n/);
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const counts: Record<string, number> = {};
  stanzas.forEach((st) => { const k = norm(st); if (k) counts[k] = (counts[k] || 0) + 1; });
  return stanzas.map((st) => {
    const lines = st.split('\n');
    const chorus = lines.length > 1 && counts[norm(st)] > 1;
    const body = lines.map((ln) =>
      /^\(.*\)$/.test(ln.trim()) ? `<span class="bk">${esc(ln)}</span>` : esc(ln)
    ).join('\n');
    return `<div class="verse${chorus ? ' chorus' : ''}">${body}</div>`;
  }).join('');
}

/** How many logged shows had this song in the setlist */
export function playedLive(title: string, shows: Show[]): number {
  return shows.filter((sh) =>
    Array.isArray(sh.setlist) && sh.setlist.some((t) => slug(t) === slug(title))).length;
}

/* ── videos ── */
/** extract an 11-char YouTube id from any youtu.be / watch / embed url */
export function ytId(url: string): string | null {
  const m = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

/* ── social links (skips blanks, in display order) ── */
export function socialList(links: Record<string, string>): [string, string][] {
  const order: [string, string][] = [
    ['Spotify', links.spotify], ['Apple Music', links.appleMusic], ['YouTube', links.youtube],
    ['Instagram', links.instagram], ['TikTok', links.tiktok], ['Facebook', links.facebook],
    ['SoundCloud', links.soundcloud], ['Merch', links.merch],
  ];
  return order.filter(([, u]) => u) as [string, string][];
}

/* ── JSON-LD so search engines understand the band + upcoming gigs ── */
export function jsonLd(band: { name: string; links: Record<string, string> }, upcoming: Show[], siteUrl: string) {
  const sameAs = ['spotify', 'appleMusic', 'youtube', 'tiktok', 'instagram', 'facebook', 'soundcloud']
    .map((k) => band.links[k]).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: band.name,
    url: siteUrl,
    genre: 'Midwest emo',
    foundingLocation: { '@type': 'City', name: 'Manchester' },
    sameAs,
    event: upcoming
      .filter((s) => !s.example)
      .map((s) => ({
        '@type': 'MusicEvent',
        name: `${band.name} at ${s.venue}`,
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
}
