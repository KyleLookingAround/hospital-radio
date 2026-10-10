/* the station clock: what's on air right now (local time) orders the home page
   and names the programme in the tuner. Without JS the daytime default stands. */
type Programme = { id: string; from: number; to: number; name: string; strap: string; lead: string[]; shift: string };
const data = document.getElementById('programmes');
if (data) {
  const programmes: Programme[] = JSON.parse(data.textContent || '[]');
  const html = document.documentElement;
  const tick = () => {
    const now = new Date();
    const hour = now.getHours();
    const p = programmes.find((x) => hour >= x.from && hour < x.to) || programmes[0];
    html.dataset.programme = p.id;
    html.dataset.shift = p.shift;
    const hh = String(hour).padStart(2, '0'), mm = String(now.getMinutes()).padStart(2, '0');
    document.querySelectorAll<HTMLElement>('[data-clock]').forEach((el) => { el.textContent = `${hh}:${mm}`; });
    document.querySelectorAll<HTMLElement>('[data-programme-name]').forEach((el) => { el.textContent = p.name; });
    document.querySelectorAll<HTMLElement>('[data-programme-strap]').forEach((el) => { el.textContent = p.strap; });
    // reorder the home page: the programme's lead slots come first, the rest keep their order
    const slots = Array.from(document.querySelectorAll<HTMLElement>('[data-slot]'));
    slots.forEach((el) => { const i = p.lead.indexOf(el.dataset.slot || ''); el.style.order = i >= 0 ? String(i + 1) : String(10 + slots.indexOf(el)); });
    // the next programme, for the "up next on 87.7" line
    const next = programmes.find((x) => x.from === p.to) || programmes[0];
    document.querySelectorAll<HTMLElement>('[data-programme-next]').forEach((el) => { el.textContent = `${String(next.from).padStart(2, '0')}:00 ${next.name}`; });
  };
  tick();
  setInterval(tick, 30000);
}
