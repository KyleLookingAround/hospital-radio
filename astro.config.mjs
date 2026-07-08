// Hospital Radio. — Astro configuration.
//
// The site lives at the root of its custom domain (public/CNAME), so there
// is no base path. `build.format: 'file'` keeps URLs as plain .html files;
// internal links in templates are written relative (./shows.html) so the
// site would survive a domain change with only this file updated.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hospitalradiofullstop.co.uk',
  trailingSlash: 'ignore',
  build: { format: 'file' },
  integrations: [
    sitemap({
      // pages are served as real .html files — keep that in the sitemap
      serialize: (item) => {
        const url = new URL(item.url);
        if (url.pathname !== '/' && !url.pathname.endsWith('.html')) {
          item.url = item.url.replace(/\/?$/, '.html');
        }
        return item;
      },
    }),
  ],
});
