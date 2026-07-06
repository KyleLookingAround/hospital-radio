/**
 * Hospital Radio. — content collections.
 *
 * Each YAML file in /content is one collection with a single entry ("main"),
 * lyrics are one markdown file per song. Everything is validated against the
 * schemas below at build time: a bad edit (missing field, broken indentation,
 * wrong type) fails the build with a clear message — the previously deployed
 * site stays live, so a mistake never ships.
 */
import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { load, CORE_SCHEMA } from 'js-yaml';

// CORE_SCHEMA keeps unquoted dates as plain strings (the default schema turns
// "date: 2026-07-13" into a Date object — the /admin editor writes them
// unquoted, and the schemas below expect strings).
const parse = (text: string) => load(text, { schema: CORE_SCHEMA });

// Wrap a whole YAML file as one entry so `getEntry(name, 'main')` returns it.
const single = (path: string) =>
  file(path, { parser: (text) => [{ id: 'main', ...(parse(text) as Record<string, unknown>) }] });

// Image paths are stored as "/assets/…" — the form the /admin editor writes,
// and the form the pages use directly (the site sits at its domain root, and
// root-absolute paths work at every page depth, including /lyrics/…).
const image = z.string().regex(/^\/assets\//, 'image paths start with /assets/');

// "" means hidden/off for links — allow empty string or a real URL.
const optionalUrl = z.union([z.literal(''), z.string().url()]);

const band = defineCollection({
  loader: single('content/band.yml'),
  schema: z.object({
    name: z.string().min(1),
    tagline: z.string(),
    members: z.array(z.string()).default([]),
    scrawl: z.string().default(''),
    foundedRoman: z.string().default(''),
    spotifyListeners: z.string().default(''),
    logoImage: z.union([z.literal(''), image]),
    ticker: z.array(z.string()).default([]),
    bio: z.string().default(''),
    links: z.object({
      spotify: optionalUrl.default(''),
      appleMusic: optionalUrl.default(''),
      youtube: optionalUrl.default(''),
      tiktok: optionalUrl.default(''),
      instagram: optionalUrl.default(''),
      facebook: optionalUrl.default(''),
      soundcloud: optionalUrl.default(''),
      merch: optionalUrl.default(''),
    }),
    radio: z.object({
      enabled: z.boolean().default(true),
      frequency: z.string().default('87.7'),
      embedUrl: optionalUrl.default(''),
      height: z.number().default(352),
    }),
    mailingList: z.object({
      action: z.string().default(''),
      fieldName: z.string().default('email'),
    }),
    intro: z.object({ enabled: z.boolean().default(true) }),
  }),
});

const music = defineCollection({
  loader: single('content/music.yml'),
  schema: z.object({
    releases: z.array(z.object({
      title: z.string(),
      type: z.string().default(''),
      year: z.string().default(''),
      url: z.string().url(),
      label: z.string().optional(),
    })).default([]),
    videos: z.array(z.object({
      title: z.string(),
      url: z.string().url(),
    })).default([]),
    merchItems: z.array(z.object({
      name: z.string(),
      price: z.string(),
      url: z.string().url(),
    })).default([]),
  }),
});

const shows = defineCollection({
  loader: single('content/shows.yml'),
  schema: z.object({
    shows: z.array(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dates are YYYY-MM-DD'),
      venue: z.string().min(1),
      city: z.string().default(''),
      with: z.string().optional(),
      tickets: z.string().url().optional(),
      soldOut: z.boolean().optional(),
      note: z.string().optional(),
      setlist: z.array(z.string()).optional(),
      example: z.boolean().optional(),
    })).default([]),
  }),
});

const gallery = defineCollection({
  loader: single('content/gallery.yml'),
  schema: z.object({
    photos: z.array(z.object({
      src: image,
      caption: z.string().optional(),
      credit: z.string().optional(),
    })).default([]),
  }),
});

const booking = defineCollection({
  loader: single('content/booking.yml'),
  schema: z.object({
    email: z.string().default(''),
    contactUrl: optionalUrl.default(''),
    pitch: z.string().default(''),
    forFansOf: z.string().default(''),
    stageNotes: z.string().default(''),
  }),
});

// One markdown file per song; files starting with "_" (the template) are
// ignored, same as the old build.
const lyrics = defineCollection({
  loader: glob({ pattern: ['*.md', '!_*'], base: './content/lyrics' }),
  schema: z.object({
    title: z.string().min(1),
    type: z.string().optional(),
    year: z.string().optional(),
    listen: z.string().url().optional(),
    order: z.number().default(999),
  }),
});

export const collections = { band, music, shows, gallery, booking, lyrics };
