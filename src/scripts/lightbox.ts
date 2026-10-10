/* the darkroom lightbox is :target-driven (works with JS off); this adds
   keyboard, swipe, and keeps the history clean so Back leaves the darkroom */
const boxes = Array.from(document.querySelectorAll<HTMLElement>('.lb[id]'));
if (boxes.length) {
  const ids = boxes.map((b) => b.id);
  const current = () => ids.indexOf(location.hash.slice(1));
  const go = (i: number) => {
    const id = ids[(i + ids.length) % ids.length];
    history.replaceState(null, '', '#' + id);
    // :target doesn't update on replaceState — nudge it
    location.replace('#' + id);
    boxes.find((b) => b.id === id)?.querySelector<HTMLElement>('a.btn')?.focus();
  };
  const close = () => { history.replaceState(null, '', location.pathname + '#gallery'); location.replace('#gallery'); };
  document.addEventListener('keydown', (e) => {
    const i = current(); if (i < 0) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') go(i + 1);
    else if (e.key === 'ArrowLeft') go(i - 1);
  });
  let x0: number | null = null;
  document.addEventListener('touchstart', (e) => { if (current() >= 0) x0 = e.changedTouches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const i = current(); if (i < 0 || x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 45) go(i + (dx < 0 ? 1 : -1));
  }, { passive: true });
  // in-lightbox links: replace instead of push so Back exits in one step
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('.lb a[href^="#"], .photos a[href^="#"]');
    if (!a) return;
    const inside = !!a.closest('.lb');
    if (inside) { e.preventDefault(); const id = a.getAttribute('href')!.slice(1); if (id === 'gallery') close(); else go(ids.indexOf(id)); }
  });
  // first open: focus the close button
  window.addEventListener('hashchange', () => { const i = current(); if (i >= 0) boxes[i].querySelector<HTMLElement>('a.btn')?.focus(); });
}
