/* keep the schedule honest between deploys: the upcoming/past split happens
   at build time (plus a weekly rebuild); if a date has passed since, hide it.
   Also recount the dead-air days from the build-time anchor. */
const today = new Date(); today.setHours(0, 0, 0, 0);
const stale = (iso?: string) => { if (!iso) return false; const d = new Date(iso + 'T00:00:00'); return !isNaN(+d) && d < today; };
let hidden = 0;
document.querySelectorAll<HTMLElement>('.show[data-date]').forEach((el) => { if (stale(el.dataset.date)) { el.hidden = true; hidden++; } });
if (hidden) {
  const left = Array.from(document.querySelectorAll<HTMLElement>('.show[data-date]')).filter((r) => !r.hidden).length;
  const count = document.querySelector('[data-show-count]');
  if (count) count.textContent = `${left} scheduled`;
  if (!left) {
    document.querySelectorAll<HTMLElement>('[data-upcoming]').forEach((el) => { el.hidden = true; });
    document.querySelectorAll<HTMLElement>('[data-empty-fallback]').forEach((el) => { el.hidden = false; });
  }
}
document.querySelectorAll<HTMLElement>('[data-since]').forEach((el) => {
  const d = new Date(el.dataset.since + 'T00:00:00'); if (isNaN(+d)) return;
  el.textContent = String(Math.max(0, Math.round((+today - +d) / 86400000)));
});
