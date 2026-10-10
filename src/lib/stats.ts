/**
 * Hospital Radio. — derived data from the show log.
 *
 * The archive holds every show with (mostly) full setlists. From that one
 * dataset we derive the song catalogue (plays, openers, closers, first/last
 * played), venue and city tallies, and a few headline numbers. Everything
 * here is computed at build time from content/shows.yml; nothing is edited
 * by hand.
 */
import { slug, type Show } from './site';

export type SongStat = {
  title: string;
  slug: string;
  /** number of logged shows this song appeared in (a song repeated in one set counts once) */
  plays: number;
  opened: number;
  closed: number;
  firstPlayed: string | null;
  lastPlayed: string | null;
  /** true for "(… cover)" titles */
  cover: boolean;
  /** shows it was played at, oldest first */
  shows: { date: string; venue: string; city: string; position: number; of: number }[];
};

export type VenueStat = { venue: string; city: string; count: number; firstDate: string; lastDate: string };
export type CityStat = { city: string; count: number; venues: string[] };

export const isCover = (title: string) => /\bcover\b/i.test(title);

/** Strip a trailing "(…cover)" note for display, e.g. "Radiate (Hey Ya! cover)" → "Radiate" */
export const displayTitle = (title: string) => title.replace(/\s*\((?:[^)]*\bcover\b[^)]*)\)\s*$/i, '').trim() || title;

/**
 * Song catalogue from logged (past) shows, most-played first; ties broken by
 * most recently played, then title. `preferredTitles` lets a lyric page's
 * title win over setlist spelling when they slug to the same thing.
 */
export function songStats(past: Show[], preferredTitles: string[] = []): SongStat[] {
  const titleFor = new Map(preferredTitles.map((t) => [slug(t), t]));
  const map = new Map<string, SongStat>();
  const chronological = [...past].sort((a, b) => +a._d - +b._d);
  for (const show of chronological) {
    const set = Array.isArray(show.setlist) ? show.setlist.filter((t) => t && t.trim()) : [];
    if (!set.length) continue;
    const seen = new Set<string>();
    set.forEach((raw, i) => {
      const s = slug(raw);
      if (!s) return;
      let stat = map.get(s);
      if (!stat) {
        stat = { title: titleFor.get(s) ?? raw.trim(), slug: s, plays: 0, opened: 0, closed: 0,
          firstPlayed: null, lastPlayed: null, cover: isCover(raw), shows: [] };
        map.set(s, stat);
      }
      if (i === 0) stat.opened++;
      if (i === set.length - 1) stat.closed++;
      if (seen.has(s)) return; // same song twice in one set: one play
      seen.add(s);
      stat.plays++;
      stat.firstPlayed = stat.firstPlayed ?? show.date;
      stat.lastPlayed = show.date;
      stat.shows.push({ date: show.date, venue: show.venue, city: show.city, position: i + 1, of: set.length });
    });
  }
  return [...map.values()].sort((a, b) =>
    b.plays - a.plays || (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? '') || a.title.localeCompare(b.title));
}

export function venueStats(past: Show[]): VenueStat[] {
  const map = new Map<string, VenueStat>();
  for (const s of [...past].sort((a, b) => +a._d - +b._d)) {
    const key = s.venue.trim().toLowerCase();
    const v = map.get(key);
    if (v) { v.count++; v.lastDate = s.date; }
    else map.set(key, { venue: s.venue, city: s.city, count: 1, firstDate: s.date, lastDate: s.date });
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.lastDate.localeCompare(a.lastDate));
}

export function cityStats(past: Show[]): CityStat[] {
  const map = new Map<string, CityStat>();
  for (const s of past) {
    const city = (s.city || 'Unknown').trim();
    const key = city.toLowerCase();
    const c = map.get(key) ?? { city, count: 0, venues: [] };
    c.count++;
    if (!c.venues.includes(s.venue)) c.venues.push(s.venue);
    map.set(key, c);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
}

/** Headline numbers for the home page / press kit. */
export function headline(past: Show[], upcoming: Show[]) {
  const withSet = past.filter((s) => Array.isArray(s.setlist) && s.setlist.length);
  const songs = songStats(past);
  const cities = cityStats(past);
  const chronological = [...past].sort((a, b) => +a._d - +b._d);
  const first = chronological[0] ?? null;
  const latest = chronological[chronological.length - 1] ?? null;
  const byYear: Record<string, number> = {};
  for (const s of past) byYear[s.date.slice(0, 4)] = (byYear[s.date.slice(0, 4)] || 0) + 1;
  return {
    showsPlayed: past.length,
    showsUpcoming: upcoming.length,
    showsWithSetlists: withSet.length,
    songsPlayed: songs.filter((s) => !s.cover).length,
    coversPlayed: songs.filter((s) => s.cover).length,
    cities: cities.length,
    venues: venueStats(past).length,
    firstShow: first,
    latestShow: latest,
    byYear,
    avgSetLength: withSet.length ? +(withSet.reduce((a, s) => a + (s.setlist?.length ?? 0), 0) / withSet.length).toFixed(1) : 0,
    mostPlayed: songs[0] ?? null,
    usualOpener: [...songs].sort((a, b) => b.opened - a.opened)[0] ?? null,
    usualCloser: [...songs].sort((a, b) => b.closed - a.closed)[0] ?? null,
  };
}

/* ── additions for the redesign ─────────────────────────────────────── */

export const ONE_DAY = 86400000;
export const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const parseDay = (s: string) => new Date(s + 'T00:00:00');

/** whole days between an ISO date and today (negative if in the future) */
export function daysSince(date: string, today: Date = todayStart()): number {
  return Math.round((+today - +parseDay(date)) / ONE_DAY);
}

/** the N most recent past shows */
export const lastN = (past: Show[], n: number) => [...past].sort((a, b) => +b._d - +a._d).slice(0, n);

/** past shows that have a logged setlist, oldest first */
export const loggedShows = (past: Show[]) =>
  [...past].filter((s) => Array.isArray(s.setlist) && s.setlist.length).sort((a, b) => +a._d - +b._d);

/** max consecutive logged shows (oldest→newest) that contained this song */
export function longestRun(stat: SongStat, past: Show[]): number {
  const dates = new Set(stat.shows.map((s) => s.date));
  let best = 0, run = 0;
  for (const s of loggedShows(past)) { run = dates.has(s.date) ? run + 1 : 0; best = Math.max(best, run); }
  return best;
}

/** for each show date, the set of song slugs played for the first time ever at that show */
export function debutSlugsByShow(past: Show[]): Map<string, Set<string>> {
  const seen = new Set<string>();
  const out = new Map<string, Set<string>>();
  for (const s of loggedShows(past)) {
    const set = new Set<string>();
    for (const t of s.setlist ?? []) { const k = slug(t); if (k && !seen.has(k)) { seen.add(k); set.add(k); } }
    out.set(s.date, set);
  }
  return out;
}

/** songs repeated within a single setlist: slug → number of extra plays, per show date */
export function repeatsByShow(show: Show): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of show.setlist ?? []) { const k = slug(t); if (k) counts.set(k, (counts.get(k) || 0) + 1); }
  return new Map([...counts].filter(([, n]) => n > 1));
}

/**
 * Act names parsed out of the free-text `with` lines, e.g.
 * "supporting I Am The Avalanche · w/ Cold Years" → ["I Am The Avalanche", "Cold Years"].
 * First-seen order, de-duplicated case-insensitively.
 */
export function sharedStages(past: Show[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of [...past].sort((a, b) => +b._d - +a._d)) {
    if (!s.with) continue;
    let text = s.with;
    text = text.replace(/^[^:]*presents?:/i, '');            // "Tru Alt Presents: Alternative Night · w/ …"
    for (const part of text.split(/\s*(?:·|,|\/\s|\bw\/\s*|&)\s*/)) {
      let name = part.replace(/^(supporting|co-headline(?:\s+with)?|with|w\/)\s+/i, '').trim();
      name = name.replace(/^(alternative night|the\s+\w+\s+night)$/i, '').trim();
      if (!name || /night$/i.test(name) || name.length < 3) continue;
      if (/^(co-?headline|headline|support(ing)?|with)$/i.test(name)) continue;
      const k = name.toLowerCase();
      if (!seen.has(k)) { seen.add(k); out.push(name); }
    }
  }
  return out;
}

export function medianSetLength(past: Show[]): number {
  const lens = loggedShows(past).map((s) => s.setlist!.length).sort((a, b) => a - b);
  if (!lens.length) return 0;
  const mid = Math.floor(lens.length / 2);
  return lens.length % 2 ? lens[mid] : Math.round((lens[mid - 1] + lens[mid]) / 2);
}

/** group upcoming shows that share a `note` (a tour name); singles stay ungrouped */
export function toursByNote(shows: Show[]): { note: string | null; shows: Show[] }[] {
  const groups: { note: string | null; shows: Show[] }[] = [];
  for (const s of shows) {
    const note = s.note?.trim() || null;
    const g = note ? groups.find((x) => x.note === note) : null;
    if (g) g.shows.push(s); else groups.push({ note, shows: [s] });
  }
  return groups.map((g) => (g.shows.length > 1 ? g : { note: null, shows: g.shows }));
}

export type Photo = { src: string; caption?: string; credit?: string };
/** photos grouped by caption, first-seen order; untitled photos fall into "Live" */
export function galleryGroups(photos: Photo[], bandName = ''): { title: string; promo: boolean; photos: (Photo & { index: number })[] }[] {
  const groups: { title: string; promo: boolean; photos: (Photo & { index: number })[] }[] = [];
  photos.forEach((p, index) => {
    const title = (p.caption || 'Live').trim();
    let g = groups.find((x) => x.title.toLowerCase() === title.toLowerCase());
    if (!g) { g = { title, promo: !!bandName && title.toLowerCase() === bandName.toLowerCase(), photos: [] }; groups.push(g); }
    g.photos.push({ ...p, index });
  });
  return groups;
}

export type LampState = 'standby' | 'scheduled' | 'live';
export function lampState(upcoming: Show[], today: Date = todayStart()): LampState {
  if (upcoming.some((s) => +s._d === +today)) return 'live';
  return upcoming.length ? 'scheduled' : 'standby';
}

/** "19 sep ’26" style short date for mono lines */
const MONS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export function shortDate(iso: string, withYear = true): string {
  const d = parseDay(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MONS[d.getMonth()]}${withYear ? ' ’' + String(d.getFullYear()).slice(2) : ''}`;
}
export const monthYear = (iso: string) => { const d = parseDay(iso); return `${MONS[d.getMonth()]} ’${String(d.getFullYear()).slice(2)}`; };
