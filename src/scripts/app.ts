/* ============================================================
   Hospital Radio. — the behaviour layer.
   The pages are fully rendered at build time; this file only adds
   the live touches: the CRT intro, the broadcast dock, click-to-play
   videos, the gallery lightbox, entrance reveals, and keeping the
   shows list honest between deploys. The site works without it.
   ============================================================ */

const $ = <T extends HTMLElement = HTMLElement>(s: string, el: ParentNode = document) =>
  el.querySelector<T>(s);

/* ── entrance reveals (staggered animation delays) ── */
document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el, i) => {
  el.style.animationDelay = Math.min(i * 0.06, 0.8) + 's';
});

/* ── mobile menu ── */
const menuBtn = $('#menuBtn');
const nav = $('#nav');
if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

/* ── logo image: reveal on success, fall back to wordmark on error ── */
const logoImg = $<HTMLImageElement>('#logoImg');
const logoStage = $('#logoStage');
if (logoImg && logoStage) {
  if (logoImg.complete && logoImg.naturalWidth > 0) logoStage.classList.add('loaded');
  else logoImg.addEventListener('load', () => logoStage.classList.add('loaded'));
}

/* ── click-to-play: swap the facade for the real YouTube player ── */
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('.video-fac[data-yt]');
  if (!btn) return;
  const frame = btn.closest('.video-frame');
  if (!frame) return;
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0&modestbranding=1&color=white&playsinline=1`;
  iframe.title = 'YouTube video player';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  frame.replaceChildren(iframe);
});

/* video thumbnails: maxres → hq fallback */
document.querySelectorAll<HTMLImageElement>('.video-fac .thumb[data-fallback]').forEach((img) => {
  img.addEventListener('error', () => {
    if (img.dataset.fallback && img.src !== img.dataset.fallback) img.src = img.dataset.fallback;
  }, { once: true });
});

/* ── persistent broadcast dock (transport bar) ── */
const dock = $('#dock');
const launch = $('#radioLaunch');
const rframe = $<HTMLIFrameElement>('#radioFrame');
if (dock && launch && rframe) {
  const setOpen = (open: boolean) => {
    if (open && !rframe.src) rframe.src = dock.dataset.embed || ''; // load (and start) only on first open
    dock.classList.toggle('open', open);
    launch.setAttribute('aria-expanded', open ? 'true' : 'false');
    const t = launch.querySelector('.dock-toggle-t');
    if (t) t.textContent = open ? 'Close' : 'Tune In';
  };
  launch.addEventListener('click', () => setOpen(!dock.classList.contains('open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dock.classList.contains('open')) setOpen(false);
  });
}

/* ── mailing list submit (validate, confirm, post to hidden sink) ── */
document.addEventListener('submit', (e) => {
  const form = e.target as HTMLFormElement;
  if (form.id !== 'tuneForm') return;
  const input = $<HTMLInputElement>('#tuneEmail');
  const msg = $('#tuneMsg');
  if (!input || !msg) return;
  const email = (input.value || '').trim();
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  if (form.dataset.connected !== '1') { e.preventDefault(); return; }
  if (!valid) {
    e.preventDefault();
    msg.className = 'tune-msg err'; msg.textContent = "That email doesn't look right — try again.";
    return;
  }
  msg.className = 'tune-msg ok'; msg.textContent = "✓ You're tuned in. Welcome to the broadcast.";
  input.value = '';
});

/* ── gallery lightbox ── */
const tiles = Array.from(document.querySelectorAll<HTMLElement>('.ph[data-i]'));
const lb = $('#lightbox');
const lbImg = $<HTMLImageElement>('#lbImg');
const lbCap = $('#lbCap');
if (lb && lbImg && lbCap && tiles.length) {
  let lbIndex = 0;
  const openLb = (i: number) => {
    lbIndex = (i + tiles.length) % tiles.length;
    const tile = tiles[lbIndex];
    const img = tile.querySelector('img');
    lbImg.src = img?.getAttribute('src') || '';
    lbCap.textContent = tile.dataset.cap || '';
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('#lbClose')?.focus();
  };
  const closeLb = () => {
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  tiles.forEach((tile) => tile.addEventListener('click', () => openLb(parseInt(tile.dataset.i || '0', 10))));
  // hide broken tiles quietly
  tiles.forEach((tile) => tile.querySelector('img')?.addEventListener('error', () => { tile.style.display = 'none'; }, { once: true }));
  $('#lbClose')?.addEventListener('click', closeLb);
  $('#lbPrev')?.addEventListener('click', () => openLb(lbIndex - 1));
  $('#lbNext')?.addEventListener('click', () => openLb(lbIndex + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  let touchX: number | null = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 45) openLb(lbIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') openLb(lbIndex - 1);
    else if (e.key === 'ArrowRight') openLb(lbIndex + 1);
  });
}

/* ── keep the shows list honest between deploys ──
   The upcoming/past split happens at build time (plus a weekly rebuild);
   if a show's date has passed since the last deploy, quietly hide it. */
(function tidyShows() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const stale = (iso?: string) => {
    if (!iso) return false;
    const d = new Date(iso + 'T00:00:00');
    return !isNaN(d.getTime()) && d < today;
  };
  let hidden = 0;
  document.querySelectorAll<HTMLElement>('.show[data-date]').forEach((el) => {
    if (stale(el.dataset.date)) { el.style.display = 'none'; hidden++; }
  });
  if (hidden) {
    const rows = Array.from(document.querySelectorAll<HTMLElement>('.show[data-date]'));
    const left = rows.filter((r) => r.style.display !== 'none').length;
    const count = $('[data-show-count]');
    if (count) count.textContent = `${left} SCHEDULED`;
    if (!left) {
      const list = $('.shows'); if (list) list.style.display = 'none';
      const fallback = $('[data-empty-fallback]'); if (fallback) fallback.hidden = false;
    }
  }
  // home teaser + "up next" strip
  document.querySelectorAll<HTMLElement>('.teaser[data-date], .up-next[data-date]').forEach((el) => {
    if (stale(el.dataset.date)) el.style.display = 'none';
  });
})();

/* ── print button (press page) ── */
$('[data-print]')?.addEventListener('click', () => window.print());

/* ── intro / tune-in sequence (once per session, skippable, motion-safe) ── */
(function intro() {
  const el = $('#intro');
  if (!el) return;
  let seen = false; try { seen = sessionStorage.getItem('hr_intro') === '1'; } catch (_) {}
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (seen || reduce) { el.remove(); return; }
  document.body.classList.add('intro-on');
  const read = $('#introRead'), freq = $('#introFreq');
  const steps = [['○', 'scanning the dial…'], ['◐', 'tuning · 87.7 fm…'], ['●', 'signal acquired']];
  let i = 0;
  const fInt = setInterval(() => { if (freq) freq.textContent = (85 + Math.random() * 9).toFixed(1) + ' FM'; }, 85);
  const sInt = setInterval(() => { i++; if (read && i < steps.length) read.innerHTML = steps[i][0] + '&nbsp;&nbsp;' + steps[i][1]; }, 660);
  let done = false;
  function onKey() { clearTimeout(t); finish(); }
  function finish() {
    if (done) return; done = true;
    clearInterval(fInt); clearInterval(sInt);
    if (freq) freq.textContent = '87.7 FM';
    try { sessionStorage.setItem('hr_intro', '1'); } catch (_) {}
    el!.classList.add('done');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => { el!.remove(); document.body.classList.remove('intro-on'); }, 580);
  }
  const t = setTimeout(finish, 2700);
  el.addEventListener('click', () => { clearTimeout(t); finish(); });
  document.addEventListener('keydown', onKey);
})();
