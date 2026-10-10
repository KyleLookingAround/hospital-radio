/**
 * Hospital Radio. — build-time image optimisation for content images.
 *
 * Content files (and the /admin editor) refer to images as "/assets/x.jpg"
 * in public/. Astro only optimises imported images, so we glob the public
 * folder at build time and hand the matching file to getImage(). Pages get
 * a responsive srcset of WebP variants; the original path still works as a
 * fallback (and is what the lightbox / press kit download use).
 */
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

const modules = import.meta.glob<{ default: ImageMetadata }>(
  '../../public/assets/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

/** "/assets/foo.jpg" → the imported ImageMetadata, or null if not found */
export function findImage(publicPath: string): ImageMetadata | null {
  const name = publicPath.replace(/^\/assets\//, '');
  const key = Object.keys(modules).find((k) => k.endsWith('/public/assets/' + name));
  return key ? modules[key].default : null;
}

export type Responsive = {
  /** best single src (largest variant) */
  src: string;
  srcset: string;
  width: number;
  height: number;
  /** the original public path, untouched */
  original: string;
};

const cache = new Map<string, Promise<Responsive | null>>();

/**
 * Responsive WebP variants for a "/assets/…" path. `widths` are the
 * rendered widths to generate (never upscaled past the source width).
 * Returns null if the file isn't in public/assets (callers fall back to
 * a plain <img src={path}>).
 */
export function responsive(publicPath: string, widths: number[] = [480, 800, 1200], quality = 72): Promise<Responsive | null> {
  const key = `${publicPath}|${widths.join(',')}|${quality}`;
  if (!cache.has(key)) {
    cache.set(key, (async () => {
      const meta = findImage(publicPath);
      if (!meta) return null;
      const ws = Array.from(new Set(widths.map((w) => Math.min(w, meta.width)))).sort((a, b) => a - b);
      const variants = await Promise.all(ws.map((width) => getImage({ src: meta, width, format: 'webp', quality })));
      const largest = variants[variants.length - 1];
      return {
        src: largest.src,
        srcset: variants.map((v, i) => `${v.src} ${ws[i]}w`).join(', '),
        width: meta.width,
        height: meta.height,
        original: publicPath,
      };
    })());
  }
  return cache.get(key)!;
}
