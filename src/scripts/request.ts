/* The request line. The slip fills the request card as you type; the card
   can be saved as a 1080×1350 PNG (drawn on a canvas with the site's own
   fonts), shared straight to a story where the browser allows it, copied as
   text, or sent to the band by Instagram DM / email. The request is mirrored
   into the URL hash so a pasted link opens the same card. Nothing is stored. */

const form = document.querySelector<HTMLFormElement>('#slip');
const card = document.querySelector<HTMLElement>('#card');

if (form && card) {
  const PAGE_URL = form.dataset.pageUrl || 'hospitalradiofullstop.co.uk/request.html';
  const EMAIL = form.dataset.email || '';
  const q = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
  const field = (name: string) => q<HTMLElement>(`[data-f="${name}"]`, card)!;

  // the sample the server rendered — what the card shows until a field is filled
  const sample = {
    song: field('song').textContent || '',
    ward: field('ward').textContent || '',
    name: field('name').textContent || '',
    note: field('note').textContent || '',
  };

  const wardText = q<HTMLInputElement>('#wardText')!;
  const wardNew = q<HTMLInputElement>('#wardNew')!;
  const fromName = q<HTMLInputElement>('#fromName')!;
  const note = q<HTMLTextAreaElement>('#note')!;
  const count = q<HTMLOutputElement>('#count')!;
  const reqText = q<HTMLTextAreaElement>('#reqText')!;
  const msg = q<HTMLElement>('#reqMsg')!;
  const saveBtn = q<HTMLButtonElement>('#saveCard')!;
  const shareBtn = q<HTMLButtonElement>('#shareCard')!;
  const copyBtn = q<HTMLButtonElement>('#copyReq')!;
  const mailLink = q<HTMLAnchorElement>('#mailLink');

  const MONS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const today = (() => { const d = new Date(); return `${String(d.getDate()).padStart(2, '0')} ${MONS[d.getMonth()]} ’${String(d.getFullYear()).slice(2)}`; })();
  field('date').textContent = today;

  const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

  type State = { song: string; slug: string; ward: string; name: string; note: string; chosen: boolean; wardFilled: boolean; nameFilled: boolean; noteFilled: boolean };
  const read = (): State => {
    const picked = q<HTMLInputElement>('input[name="song"]:checked', form);
    const wardPick = q<HTMLInputElement>('input[name="ward"]:checked', form);
    const wardIsNew = !!wardPick && wardPick === wardNew;
    const ward = wardIsNew ? clean(wardText.value).slice(0, 40) : wardPick ? wardPick.value : '';
    const name = clean(fromName.value).slice(0, 30);
    const text = clean(note.value).slice(0, 140);
    return {
      song: picked ? picked.dataset.title || picked.value : sample.song,
      slug: picked ? picked.value : '',
      ward: ward || (wardIsNew ? 'somewhere' : sample.ward),
      name: name || sample.name,
      note: text || (touched ? '' : sample.note),
      chosen: !!picked,
      wardFilled: !!ward,
      nameFilled: !!name,
      noteFilled: !!text,
    };
  };

  let touched = false; // once the dedication has been typed in, an empty box stays empty on the card

  const requestLine = (s: State) =>
    `REQUEST for the ${s.ward} ward: ‘${s.song}’${s.note ? ` — ${s.note}` : ''} — from ${s.nameFilled ? s.name : 'a listener'} · ${PAGE_URL}${hashFor(s)}`;

  const hashFor = (s: State) => {
    const p = new URLSearchParams();
    if (s.slug) p.set('song', s.slug);
    if (s.wardFilled) p.set('ward', s.ward);
    if (s.nameFilled) p.set('from', s.name);
    if (s.noteFilled) p.set('note', s.note);
    const str = p.toString();
    return str ? '#' + str : '';
  };

  const render = () => {
    const s = read();
    card.classList.add('live');
    field('song').textContent = s.song;
    field('song').classList.toggle('ph', !s.chosen);
    card.style.setProperty('--len', String(Math.max(4, s.song.length)));
    field('ward').textContent = s.ward;
    field('ward').classList.toggle('ph', !s.wardFilled);
    field('name').textContent = s.name;
    field('name').classList.toggle('ph', !s.nameFilled);
    field('note').textContent = s.note;
    field('note').classList.toggle('ph', !s.noteFilled);
    const left = 140 - note.value.length;
    count.value = `${left} left`;
    count.classList.toggle('low', left <= 20);
    reqText.value = requestLine(s);
    if (mailLink && EMAIL) mailLink.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Request line')}&body=${encodeURIComponent(requestLine(s))}`;
    const h = hashFor(s);
    try { history.replaceState(null, '', h || location.pathname + location.search); } catch { /* fine */ }
  };

  // a pasted link re-opens the same card
  const restore = () => {
    const p = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (![...p.keys()].length) return;
    const slug = p.get('song');
    if (slug) { const r = q<HTMLInputElement>(`input[name="song"][value="${CSS.escape(slug)}"]`, form); if (r) r.checked = true; }
    const ward = p.get('ward');
    if (ward) {
      const r = q<HTMLInputElement>(`input[name="ward"][value="${CSS.escape(ward)}"]`, form);
      if (r && r !== wardNew) r.checked = true; else { wardNew.checked = true; wardText.value = ward.slice(0, 40); }
    }
    if (p.get('from')) fromName.value = p.get('from')!.slice(0, 30);
    if (p.get('note')) { note.value = p.get('note')!.slice(0, 140); touched = true; }
  };

  form.addEventListener('input', (e) => {
    if (e.target === note) touched = true;
    if (e.target === wardNew && wardNew.checked) wardText.focus();
    render();
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  restore();
  render();

  const say = (t: string) => { msg.textContent = t; };
  const needSong = () => {
    if (read().chosen) return false;
    say('pick a song first.');
    const first = q<HTMLInputElement>('input[name="song"]', form);
    first?.focus();
    return true;
  };

  /* ---- the card as a PNG: 1080×1350, drawn with the site's fonts ---- */
  const W = 1080, H = 1350, PAD = 84;
  const INK = '#2D458F', ROSE = '#C5586C', ROSE_TEXT = '#9E3A4F', MUTED = '#4A5C97', PAPER = '#FBF3E3', LINE = 'rgba(45,69,143,.42)';
  const fontsNeeded = ['600 72px Fraunces', 'italic 300 230px Fraunces', '500 60px Caveat', '500 28px "IBM Plex Mono"', '600 28px "IBM Plex Mono"'];

  const wrap = (ctx: CanvasRenderingContext2D, text: string, max: number) => {
    const lines: string[] = [];
    for (const para of text.split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const t = line ? line + ' ' + word : word;
        if (ctx.measureText(t).width > max && line) { lines.push(line); line = word; } else line = t;
      }
      lines.push(line);
    }
    return lines;
  };
  const spaced = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number, align: 'left' | 'right' = 'left') => {
    // letter-spaced mono labels; drawn char by char so it matches the page everywhere
    const chars = [...text];
    const width = chars.reduce((a, c) => a + ctx.measureText(c).width + tracking, -tracking);
    let cx = align === 'right' ? x - width : x;
    ctx.textAlign = 'left';
    for (const c of chars) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + tracking; }
    return width;
  };

  const draw = async (): Promise<HTMLCanvasElement> => {
    await Promise.all(fontsNeeded.map((f) => document.fonts.load(f).catch(() => null)));
    await document.fonts.ready;
    const s = read();
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';

    // head: wordmark + ident
    let y = PAD + 58;
    ctx.fillStyle = INK; ctx.font = '600 72px Fraunces'; ctx.textAlign = 'left';
    const w1 = ctx.measureText('hospital ').width;
    ctx.fillText('hospital ', PAD, y);
    ctx.fillStyle = ROSE_TEXT; ctx.fillText('radio.', PAD + w1 - 6, y);
    ctx.font = '600 24px "IBM Plex Mono"'; ctx.fillStyle = ROSE_TEXT;
    spaced(ctx, 'REQUEST', W - PAD, PAD + 24, 5, 'right');
    ctx.font = '500 24px "IBM Plex Mono"'; ctx.fillStyle = MUTED;
    spaced(ctx, today.toUpperCase(), W - PAD, PAD + 62, 5, 'right');
    y = PAD + 106;
    ctx.fillStyle = INK; ctx.fillRect(PAD, y, W - 2 * PAD, 2);

    // foot: the unfilled stamp + the url (drawn now so the body can centre between)
    const footTop = H - PAD - 74;
    ctx.strokeStyle = LINE; ctx.setLineDash([3, 6]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PAD, footTop); ctx.lineTo(W - PAD, footTop); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '500 22px "IBM Plex Mono"'; ctx.fillStyle = ROSE_TEXT; ctx.strokeStyle = ROSE;
    const stampY = footTop + 26, stampH = 52;
    const labelW = spaced(ctx, 'PLAYED ON AIR', -9999, -9999, 3); // measure only
    const stampW = labelW + 70;
    ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeRect(PAD, stampY, stampW, stampH); ctx.setLineDash([]);
    ctx.strokeRect(PAD + 18, stampY + 18, 16, 16);
    spaced(ctx, 'PLAYED ON AIR', PAD + 50, stampY + 34, 3);
    ctx.fillStyle = MUTED; ctx.font = '500 22px "IBM Plex Mono"'; ctx.textAlign = 'right';
    ctx.fillText(PAGE_URL.replace(/\/.*$/, ''), W - PAD, stampY + 34);

    // body: ward · song · note · from — measured first, then centred in the space
    const maxW = W - 2 * PAD;
    const n = s.song.length;
    let songSize = n <= 9 ? 230 : n <= 14 ? 190 : n <= 20 ? 160 : 140; // wraps to two or three lines rather than shrinking
    let songLines: string[] = [];
    for (;;) {
      ctx.font = `italic 300 ${songSize}px Fraunces`;
      songLines = wrap(ctx, s.song, maxW);
      if (songLines.length <= 3 || songSize <= 72) break;
      songSize -= 8;
    }
    ctx.font = '500 52px Caveat';
    const noteLines = s.note ? wrap(ctx, s.note, maxW - 40) : [];
    const songLH = songSize * 0.98, noteLH = 62;
    const blockH = 30 + 28 + songLines.length * songLH + (noteLines.length ? 34 + noteLines.length * noteLH : 0) + 54 + 30;
    const top = y + 2, bottom = footTop;
    let by = top + Math.max(40, (bottom - top - blockH) / 2);

    ctx.fillStyle = MUTED; ctx.font = '500 26px "IBM Plex Mono"';
    spaced(ctx, `FOR THE ${s.ward.toUpperCase()} WARD`, PAD, by + 30, 5);
    by += 30 + 28;
    ctx.fillStyle = ROSE; ctx.font = `italic 300 ${songSize}px Fraunces`; ctx.textAlign = 'left';
    for (const ln of songLines) { by += songLH; ctx.fillText(ln, PAD - songSize * 0.04, by); }
    if (noteLines.length) {
      by += 34;
      ctx.fillStyle = INK; ctx.font = '500 52px Caveat';
      for (const ln of noteLines) { by += noteLH; ctx.fillText(ln, PAD, by); }
    }
    by += 54;
    ctx.font = '500 26px "IBM Plex Mono"'; ctx.fillStyle = INK;
    const fw = spaced(ctx, 'FROM ', PAD, by, 4);
    ctx.fillStyle = ROSE_TEXT;
    spaced(ctx, s.name.toUpperCase(), PAD + fw + 4, by, 4);
    return c;
  };

  const toBlob = (c: HTMLCanvasElement) => new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
  const fileName = () => `request-${read().song.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'card'}.png`;

  saveBtn.hidden = false;
  saveBtn.addEventListener('click', async () => {
    if (needSong()) return;
    say('drawing the card…');
    try {
      const blob = await toBlob(await draw());
      if (!blob) throw new Error('no blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName(); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      say('saved — 1080×1350, story-sized.');
    } catch { say('couldn’t draw the card here — a screenshot works just as well.'); }
  });

  // share straight to a story where the browser can hand a file to another app (phones, mostly)
  if (typeof navigator.canShare === 'function') {
    try {
      const probe = new File([new Uint8Array(1)], 'x.png', { type: 'image/png' });
      if (navigator.canShare({ files: [probe] })) shareBtn.hidden = false;
    } catch { /* no file sharing here */ }
  }
  shareBtn.addEventListener('click', async () => {
    if (needSong()) return;
    try {
      const blob = await toBlob(await draw());
      if (!blob) throw new Error('no blob');
      const file = new File([blob], fileName(), { type: 'image/png' });
      await navigator.share({ files: [file], title: 'Request line', text: requestLine(read()) });
      say('shared.');
    } catch (e) { if ((e as Error)?.name !== 'AbortError') say('couldn’t share from here — save the card instead.'); }
  });

  copyBtn.hidden = false;
  copyBtn.addEventListener('click', async () => {
    if (needSong()) return;
    const text = requestLine(read());
    try {
      if (!navigator.clipboard) throw new Error('no clipboard');
      await navigator.clipboard.writeText(text);
      say('copied — paste it into the DM.');
    } catch {
      // fallback: show the text and select it
      reqText.hidden = false;
      reqText.focus(); reqText.select();
      try { document.execCommand('copy'); say('copied — paste it into the DM.'); }
      catch { say('select-all and copy the text above.'); }
    }
  });
}
