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
