/* the header: the player tray, the phone menu, the lamp */
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s);

const tunein = $<HTMLButtonElement>('#tunein');
const tray = $('#tray');
const frame = $<HTMLIFrameElement>('#radioFrame');
const lampWord = $('#lampWord');
const lamp = $('#lamp');
let lampWas = lamp?.dataset.state || 'standby';
let wordWas = lampWord?.textContent || '';

const setOpen = (open: boolean) => {
  if (!tunein || !tray) return;
  if (open && frame && !frame.src) frame.src = tray.dataset.embed || ''; // load (and start) only on first open
  tray.hidden = !open;
  tunein.setAttribute('aria-expanded', open ? 'true' : 'false');
  const t = tunein.querySelector('.t'); if (t) t.textContent = open ? 'close' : 'listen';
  if (lamp && lampWord) {
    if (open) { lampWas = lamp.dataset.state || lampWas; wordWas = lampWord.textContent || wordWas; lamp.dataset.state = 'onair'; lampWord.textContent = 'on air'; }
    else { lamp.dataset.state = lampWas; lampWord.textContent = wordWas; }
  }
  if (open) $('#trayClose')?.focus(); else tunein.focus();
};
tunein?.addEventListener('click', () => setOpen(tray?.hidden ?? true));
$('#trayClose')?.addEventListener('click', () => setOpen(false));

/* the phone menu: Escape closes, click outside closes */
const dial = $<HTMLDetailsElement>('#menu');
document.addEventListener('click', (e) => { if (dial?.open && !dial.contains(e.target as Node)) dial.open = false; });

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (tray && !tray.hidden) setOpen(false);
  if (dial?.open) { dial.open = false; dial.querySelector('summary')?.focus(); }
});

/* the lamp re-checks the calendar (deploys are weekly) */
(function relight() {
  if (!lamp || !lampWord || lamp.dataset.state === 'onair') return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dates = Array.from(document.querySelectorAll<HTMLElement>('.show[data-date]')).map((el) => new Date(el.dataset.date + 'T00:00:00'));
  if (dates.some((d) => +d === +today)) { lamp.dataset.state = 'live'; lampWord.textContent = 'live tonight'; }
})();
