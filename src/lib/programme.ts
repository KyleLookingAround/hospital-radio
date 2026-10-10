/**
 * Hospital Radio. — the 24-hour programme.
 * A hospital radio station is always on. The home page is ordered by what's
 * on air right now (local time, in the visitor's browser); the build renders
 * the daytime default so the page is complete without JavaScript.
 */
export type Programme = { id: string; from: number; to: number; name: string; strap: string; lead: string[]; shift: 'day' | 'night' };
export const PROGRAMMES: Programme[] = [
  { id: 'night-shift', from: 0,  to: 6,  name: 'the night shift',        strap: 'quiet on the ward · words and slow songs', lead: ['songs', 'transmissions', 'chart', 'booth'], shift: 'night' },
  { id: 'early-doors', from: 6,  to: 9,  name: 'early doors',            strap: 'first light · what’s coming up',            lead: ['schedule', 'transmissions', 'request'],     shift: 'day' },
  { id: 'ward-rounds', from: 9,  to: 12, name: 'ward rounds',            strap: 'the log, the chart, the numbers',           lead: ['chart', 'reach', 'schedule'],                    shift: 'day' },
  { id: 'lunch',       from: 12, to: 14, name: 'lunch on the ward',      strap: 'requests open · the station shop',          lead: ['request', 'merch', 'transmissions'],        shift: 'day' },
  { id: 'afternoon',   from: 14, to: 18, name: 'afternoon transmission', strap: 'new music and pictures from the booth',     lead: ['transmissions', 'booth', 'chart'],          shift: 'day' },
  { id: 'visiting',    from: 18, to: 21, name: 'visiting hours',         strap: 'shows, tickets, dedications',               lead: ['schedule', 'request', 'merch'],             shift: 'day' },
  { id: 'lights-out',  from: 21, to: 24, name: 'lights out',             strap: 'last orders on the dial',                   lead: ['songs', 'booth', 'transmissions'],          shift: 'night' },
];
export const programmeAt = (hour: number) => PROGRAMMES.find((p) => hour >= p.from && hour < p.to) ?? PROGRAMMES[0];
/** the daytime default used at build time */
export const DEFAULT_PROGRAMME = programmeAt(15);
