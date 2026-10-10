/* ============================================================
   Hospital Radio. — the behaviour layer.
   Every page is fully rendered at build time; this only adds the live
   touches. The site works without it: the menu is a <details>, the
   lightbox is :target-driven, "listen" has a <noscript> link.
   ============================================================ */
import './tuner';
import './video';
import './lightbox';
import './shows';
import './mailing';

/* print button (the promoter's file) */
document.querySelector('[data-print]')?.addEventListener('click', () => window.print());
