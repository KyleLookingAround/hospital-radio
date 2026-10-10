/* "were you there?" — stamp a logged show as attended. Kept in this browser
   only (localStorage `hr_attended` = JSON array of ISO dates), shared with the
   request line's patient record. The buttons are rendered hidden and only
   revealed here, so nothing dead shows with JavaScript off. */
const KEY = 'hr_attended';
const read = (): string[] => {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter((d) => typeof d === 'string') : []; }
  catch { return []; }
};
const write = (dates: string[]) => { try { localStorage.setItem(KEY, JSON.stringify(dates)); } catch { /* private mode: the stamp still shows for this page view */ } };

const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-attend]'));
if (buttons.length) {
  const counters = document.querySelectorAll<HTMLElement>('[data-attended-n]');
  const wraps = document.querySelectorAll<HTMLElement>('[data-attended]');
  const render = () => {
    const set = new Set(read());
    let n = 0;
    for (const b of buttons) {
      const on = set.has(b.dataset.attend || '');
      if (on) n++;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.closest('.log-row')?.classList.toggle('went', on);
    }
    counters.forEach((c) => { c.textContent = String(n); });
    wraps.forEach((w) => { w.hidden = false; });
    document.querySelectorAll<HTMLElement>('[data-attended-none]').forEach((el) => { el.hidden = n > 0; });
    document.querySelectorAll<HTMLElement>('[data-attended-some]').forEach((el) => { el.hidden = n === 0; });
    document.body.dataset.attended = String(n);
  };
  for (const b of buttons) {
    b.hidden = false;
    b.addEventListener('click', () => {
      const date = b.dataset.attend || '';
      const dates = read();
      const i = dates.indexOf(date);
      if (i >= 0) dates.splice(i, 1); else dates.push(date);
      dates.sort();
      write(dates);
      render();
    });
  }
  render();
  // another tab (the request line's patient record) changed the stamps
  window.addEventListener('storage', (e) => { if (e.key === KEY) render(); });
}
