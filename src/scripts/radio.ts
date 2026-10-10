/* ============================================================
   THE RADIO. One engine for the big dial on the home page and the
   mini ruler on every other page.
   - a frequency, dragged with a knob / the needle / keys / the wheel
   - signal strength = how close you are to a station
   - power on → static (synthesised) that fades as the signal locks,
     and at 87.7 the band fades in: a hosted audio file through a real
     tuning filter when one exists, otherwise the release video's audio
     via YouTube's player (shown on the booth monitor)
   - land on another station and let go → the site retunes (navigates)
   Everything here is an enhancement: the ruler is real links.
   ============================================================ */
type Station = { id: string; freq: number; href: string; label: string; fragment: string };
type Config = { min: number; max: number; stations: Station[]; current: string; music: { freq: number; audio: string; yt: string; title: string } };

const cfgEl = document.getElementById('radio-config');
if (cfgEl) {
  const cfg: Config = JSON.parse(cfgEl.textContent || '{}');
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s);
  const $$ = <T extends HTMLElement = HTMLElement>(s: string) => Array.from(document.querySelectorAll<T>(s));
  const html = document.documentElement;
  const SNAP = 0.12, LOCK = 0.3;
  const current = cfg.stations.find((s) => s.id === cfg.current);
  const store = { get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch {} } };

  let freq = current ? current.freq : cfg.music.freq;
  let power = store.get('hr_power') === '1';
  let dragging = false;
  let navTimer: number | undefined;

  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  const nearest = () => { let best = cfg.stations[0], d = 99; for (const s of cfg.stations) { const dd = Math.abs(s.freq - freq); if (dd < d) { d = dd; best = s; } } return { station: best, dist: d }; };
  const signal = () => { const { dist } = nearest(); return clamp(1 - dist / LOCK, 0, 1); };
  const pos = () => (freq - cfg.min) / (cfg.max - cfg.min);

  /* ---- audio ---- */
  let ctx: AudioContext | null = null;
  let staticGain: GainNode | null = null;
  let crackle: number | undefined;
  let music: { kind: 'file'; el: HTMLAudioElement; gain: GainNode; filter: BiquadFilterNode } | { kind: 'yt'; player: any; ready: boolean } | null = null;

  const ensureCtx = () => {
    if (ctx) return ctx;
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC() as AudioContext;
    // white noise → band-pass (the hiss of an empty frequency) → gain
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 0.6;
    staticGain = ctx.createGain(); staticGain.gain.value = 0;
    src.connect(bp).connect(staticGain).connect(ctx.destination);
    src.start();
    return ctx;
  };

  const ensureMusic = () => {
    if (music) return;
    if (cfg.music.audio) {
      const c = ensureCtx(); if (!c) return;
      const el = new Audio(cfg.music.audio); el.loop = true; el.crossOrigin = 'anonymous'; el.preload = 'auto';
      const srcNode = c.createMediaElementSource(el);
      const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900; filter.Q.value = 0.9;
      const gain = c.createGain(); gain.gain.value = 0;
      srcNode.connect(filter).connect(gain).connect(c.destination);
      music = { kind: 'file', el, gain, filter };
    } else if (cfg.music.yt) {
      const host = $('#monitor-player'); if (!host) return;
      music = { kind: 'yt', player: null, ready: false };
      const make = () => {
        const YT = (window as any).YT;
        const m = music as any;
        m.player = new YT.Player('monitor-player', {
          videoId: cfg.music.yt, host: 'https://www.youtube-nocookie.com',
          playerVars: { autoplay: 0, controls: 1, rel: 0, modestbranding: 1, playsinline: 1, loop: 1, playlist: cfg.music.yt },
          events: { onReady: () => { m.ready = true; m.player.setVolume(0); apply(); } },
        });
      };
      if ((window as any).YT?.Player) make();
      else {
        (window as any).onYouTubeIframeAPIReady = make;
        const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);
      }
    }
  };

  const openMonitor = (open: boolean) => {
    const tray = $('#tray'); const btn = $<HTMLButtonElement>('#tunein');
    if (!tray || !btn) return;
    if (open && !tray.hidden) return;
    if (!open && tray.hidden) return;
    btn.click();
  };

  /* ---- apply state to the page + audio ---- */
  const apply = () => {
    const sig = signal();
    const { station, dist } = nearest();
    html.style.setProperty('--freq', freq.toFixed(2));
    html.style.setProperty('--signal', sig.toFixed(3));
    html.style.setProperty('--dialpos', pos().toFixed(4));
    html.dataset.tuned = sig > 0.75 ? station.id : '';
    html.dataset.radio = power ? 'on' : 'off';
    $$('[data-readout]').forEach((el) => { el.textContent = freq.toFixed(1); });
    $$('[data-knob]').forEach((el) => { el.style.setProperty('--angle', `${pos() * 300 - 150}deg`); el.setAttribute('aria-valuenow', freq.toFixed(1)); el.setAttribute('aria-valuetext', `${freq.toFixed(1)} FM${sig > 0.75 ? ', ' + station.label : ', static'}`); });
    $$('[data-fragment]').forEach((el) => {
      const show = dist < LOCK + 0.1;
      el.textContent = show ? station.fragment : '';
      el.style.setProperty('--sig', sig.toFixed(3));
      el.dataset.station = show ? station.id : '';
    });
    $$('[data-signal-word]').forEach((el) => { el.textContent = sig > 0.75 ? `${station.label} · locked` : sig > 0.3 ? 'tuning…' : 'static'; });
    $$('[data-power]').forEach((el) => { el.setAttribute('aria-pressed', power ? 'true' : 'false'); });
    // audio
    const musicSig = clamp(1 - Math.abs(cfg.music.freq - freq) / LOCK, 0, 1);
    if (power) {
      const c = ensureCtx();
      if (c) {
        if (c.state === 'suspended') c.resume();
        const hiss = (1 - sig) * 0.28 + 0.02;
        staticGain!.gain.setTargetAtTime(hiss, c.currentTime, 0.08);
        if (!crackle) crackle = window.setInterval(() => { if (!staticGain || !ctx) return; if (signal() < 0.6 && Math.random() < 0.35) { const t = ctx.currentTime; staticGain.gain.setValueAtTime(staticGain.gain.value + 0.25, t); staticGain.gain.setTargetAtTime((1 - signal()) * 0.28 + 0.02, t + 0.02, 0.05); } }, 140);
      }
      if (musicSig > 0.02) ensureMusic();
      if (music?.kind === 'file') {
        const c2 = ctx!;
        music.gain.gain.setTargetAtTime(musicSig, c2.currentTime, 0.1);
        music.filter.frequency.setTargetAtTime(600 + musicSig * musicSig * 16000, c2.currentTime, 0.1);
        if (musicSig > 0.02 && music.el.paused) music.el.play().catch(() => {});
        if (musicSig <= 0.02 && !music.el.paused) music.el.pause();
      } else if (music?.kind === 'yt' && music.ready) {
        const p = music.player;
        p.setVolume(Math.round(musicSig * 100));
        const st = p.getPlayerState?.();
        if (musicSig > 0.05) { if (st !== 1 && st !== 3) { p.playVideo(); openMonitor(true); } }
        else if (st === 1) p.pauseVideo();
      }
    } else {
      if (ctx && staticGain) staticGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      if (crackle) { clearInterval(crackle); crackle = undefined; }
      if (music?.kind === 'file') { music.gain.gain.value = 0; music.el.pause(); }
      if (music?.kind === 'yt' && music.ready) music.player.pauseVideo();
    }
    store.set('hr_freq', freq.toFixed(2));
  };

  const setFreq = (f: number) => { freq = clamp(Math.round(f * 100) / 100, cfg.min, cfg.max); apply(); };

  /* ---- letting go on another station retunes the site ---- */
  const settle = () => {
    const { station, dist } = nearest();
    clearTimeout(navTimer);
    if (dist <= SNAP) {
      setFreq(station.freq);
      if (station.id !== cfg.current) {
        html.dataset.retuning = station.id;
        navTimer = window.setTimeout(() => { location.href = station.href; }, 420);
      }
    }
  };

  /* ---- inputs: knob (angle), band (position), keys, wheel ---- */
  const bindDrag = (el: HTMLElement, mode: 'angle' | 'band') => {
    let rect: DOMRect;
    const read = (e: PointerEvent) => {
      if (mode === 'band') { const x = clamp((e.clientX - rect.left) / rect.width, 0, 1); return cfg.min + x * (cfg.max - cfg.min); }
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      let a = Math.atan2(e.clientX - cx, -(e.clientY - cy)) * 180 / Math.PI; // 0 = up, clockwise positive
      a = clamp(a, -150, 150);
      return cfg.min + ((a + 150) / 300) * (cfg.max - cfg.min);
    };
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      rect = el.getBoundingClientRect(); dragging = true; html.dataset.dragging = '1'; el.setPointerCapture(e.pointerId); clearTimeout(navTimer);
      setFreq(read(e)); e.preventDefault();
    });
    el.addEventListener('pointermove', (e) => { if (dragging) setFreq(read(e)); });
    const end = (e: PointerEvent) => { if (!dragging) return; dragging = false; delete html.dataset.dragging; try { el.releasePointerCapture(e.pointerId); } catch {} settle(); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 0.5 : 0.1;
      const { station } = nearest();
      const idx = cfg.stations.indexOf(station);
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setFreq(freq + step); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setFreq(freq - step); e.preventDefault(); }
      else if (e.key === 'PageUp') { setFreq((cfg.stations[Math.min(idx + 1, cfg.stations.length - 1)]).freq); e.preventDefault(); }
      else if (e.key === 'PageDown') { setFreq((cfg.stations[Math.max(idx - 1, 0)]).freq); e.preventDefault(); }
      else if (e.key === 'Home') { setFreq(cfg.stations[0].freq); e.preventDefault(); }
      else if (e.key === 'End') { setFreq(cfg.stations[cfg.stations.length - 1].freq); e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === ' ') { settle(); e.preventDefault(); return; }
      else return;
      clearTimeout(navTimer); navTimer = window.setTimeout(settle, 900);
    });
    el.addEventListener('wheel', (e) => { setFreq(freq + (e.deltaY > 0 ? 0.05 : -0.05)); clearTimeout(navTimer); navTimer = window.setTimeout(settle, 700); e.preventDefault(); }, { passive: false });
  };
  $$('[data-knob]').forEach((el) => bindDrag(el, 'angle'));
  $$('[data-band]').forEach((el) => bindDrag(el, 'band'));

  /* station links on the face/ruler: tune first, then go (the transition does the static) */
  $$('[data-station-link]').forEach((a) => a.addEventListener('click', (e) => {
    const f = parseFloat((a as HTMLElement).dataset.stationLink || ''); if (!f) return;
    e.preventDefault(); setFreq(f); html.dataset.retuning = nearest().station.id;
    setTimeout(() => { location.href = (a as HTMLAnchorElement).href; }, 260);
  }));

  /* power */
  $$('[data-power]').forEach((b) => b.addEventListener('click', () => { power = !power; store.set('hr_power', power ? '1' : '0'); if (power) ensureCtx(); apply(); }));

  /* presets on the face: tap a station tile */
  $$('[data-preset]').forEach((b) => b.addEventListener('click', () => { setFreq(parseFloat((b as HTMLElement).dataset.preset || '')); clearTimeout(navTimer); navTimer = window.setTimeout(settle, 500); }));

  document.addEventListener('visibilitychange', () => { if (document.hidden && ctx && staticGain) staticGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05); else apply(); });

  // arrive tuned to this page's station; the readout "sweeps" in from wherever the last page left the dial
  const from = parseFloat(store.get('hr_freq') || '');
  if (!isNaN(from) && current && Math.abs(from - current.freq) > 0.01 && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    freq = from; apply();
    const target = current.freq; const start = performance.now();
    const sweep = (t: number) => { const k = clamp((t - start) / 520, 0, 1); const e = 1 - Math.pow(1 - k, 3); freq = from + (target - from) * e; apply(); if (k < 1) requestAnimationFrame(sweep); };
    requestAnimationFrame(sweep);
  } else apply();
}
