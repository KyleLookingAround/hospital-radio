/* the tuner: player tray, the DIAL sheet, the lamp */
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s);

const tunein = $<HTMLButtonElement>('#tunein');
const tray = $('#tray');
const frame = $<HTMLIFrameElement>('#radioFrame');
const lampWord = $('#lampWord');
const lamp = $('#lamp');
let lampWas = lamp?.dataset.state || 'standby';
let wordWas = lampWord?.textContent || '';

const spot = document.querySelector<HTMLDetailsElement>('.tray-spotify');
spot?.addEventListener('toggle', () => { if (spot.open && frame && !frame.src) frame.src = tray?.dataset.embed || ''; }); // load the embed only when asked for
const setOpen = (open: boolean) => {
  if (!tunein || !tray) return;
  tray.hidden = !open;
  tunein.setAttribute('aria-expanded', open ? 'true' : 'false');
  const t = tunein.querySelector('.t'); if (t) t.textContent = open ? 'close' : 'monitor';
  if (lamp && lampWord) {
    if (open) { lampWas = lamp.dataset.state || lampWas; wordWas = lampWord.textContent || wordWas; lamp.dataset.state = 'onair'; lampWord.textContent = 'on air'; }
    else { lamp.dataset.state = lampWas; lampWord.textContent = wordWas; }
  }
  if (open) $('#trayClose')?.focus(); else tunein.focus();
};
tunein?.addEventListener('click', () => setOpen(tray?.hidden ?? true));
$('#trayClose')?.addEventListener('click', () => setOpen(false));

/* the DIAL sheet (mobile): lock scroll while open, Escape closes, focus the current station */
const dial = $<HTMLDetailsElement>('#dial');
dial?.addEventListener('toggle', () => {
  document.documentElement.style.overflow = dial.open ? 'hidden' : '';
  if (dial.open) (dial.querySelector<HTMLElement>('[aria-current="page"]') || dial.querySelector<HTMLElement>('.dial-row'))?.focus();
});

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
