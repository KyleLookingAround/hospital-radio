/* ============================================================
   Hospital Radio. — app logic
   Content/config is injected at build time as window.SITE
   (see build.mjs + the /content folder). Edit content there,
   not here. This file is the behaviour: routing, players,
   gallery, intro, etc.
   ============================================================ */
const CONFIG = window.SITE || {};

/* ───────────────────────── engine ───────────────────────── */
const DOW = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const MON = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const $ = (s,el=document)=>el.querySelector(s);

const todayStart = (()=>{ const d=new Date(); d.setHours(0,0,0,0); return d; })();
const parseDay = s => new Date(s+"T00:00:00");

const allShows = CONFIG.shows
  .map(s => ({ ...s, _d: parseDay(s.date) }))
  .filter(s => !isNaN(s._d));

const upcoming = allShows.filter(s => s._d >= todayStart).sort((a,b)=>a._d-b._d);
const past     = allShows.filter(s => s._d <  todayStart).sort((a,b)=>b._d-a._d);

const esc = t => String(t??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const yr  = d => d.getFullYear()===todayStart.getFullYear() ? "" : " ’"+String(d.getFullYear()).slice(2);

/* the heartbeat divider, reused */
function ekg(){
  return `<svg class="ekg" viewBox="0 0 1200 46" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 23 H360 l14 0 l10 -17 l11 33 l9 -28 l8 20 l7 -8 H520 l16 0 l9 -15 l10 28 l8 -22 l7 14 H1200"/>
    <path class="pulse" d="M0 23 H360 l14 0 l10 -17 l11 33 l9 -28 l8 20 l7 -8 H520 l16 0 l9 -15 l10 28 l8 -22 l7 14 H1200"/>
  </svg>`;
}

/* extract an 11-char YouTube id from any youtu.be / watch / embed url */
function ytId(url){
  const m = String(url||"").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

/* a click-to-play YouTube player (loads nothing until tapped) */
function videoPlayer(item){
  const id = ytId(item.url);
  const meta = [item.type, item.year].filter(Boolean).join(" · ");
  if (!id){ // not a youtube link — fall back to a plain link card
    return `<figure class="video" data-reveal><div class="video-frame"><a class="video-fac" href="${esc(item.url)}" target="_blank" rel="noopener"><span class="play-big"><span class="tri"></span></span></a></div>
      <figcaption><span class="vt">${esc(item.title)}</span>${meta?`<span class="vm">${esc(meta)}</span>`:""}</figcaption></figure>`;
  }
  const thumb = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  const fallback = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return `<figure class="video" data-reveal>
    <div class="video-frame">
      <button class="video-fac" data-yt="${id}" aria-label="Play ${esc(item.title)}">
        <img class="thumb" src="${thumb}" onerror="this.onerror=null;this.src='${fallback}'" alt="">
        <span class="rec">Play</span>
        <span class="play-big"><span class="tri"></span></span>
      </button>
    </div>
    <figcaption><span class="vt">${esc(item.title)}</span>${meta?`<span class="vm">${esc(meta)}</span>`:""}</figcaption>
  </figure>`;
}

/* one show row */
function showRow(s, archived){
  const dow = DOW[s._d.getDay()], day = String(s._d.getDate()).padStart(2,"0"), m = MON[s._d.getMonth()];
  let act = "";
  if (archived){
    act = `<div class="aired">aired</div>`;
  } else if (s.soldOut){
    act = `<div class="act"><span class="soldout">Sold out</span></div>`;
  } else if (s.tickets){
    act = `<div class="act"><a class="btn" href="${esc(s.tickets)}" target="_blank" rel="noopener">Tickets <span class="arr">↗</span></a></div>`;
  } else {
    act = `<div class="act"><span class="soldout" style="color:var(--soft);border-color:var(--line-2)">Info soon</span></div>`;
  }
  return `<div class="show" data-reveal>
    <div class="date">
      <div class="dow">${dow}</div>
      <div class="day">${day}</div>
      <div class="my">${m}${yr(s._d)}</div>
    </div>
    <div class="body">
      <h3>${esc(s.venue)}</h3>
      <div class="sub">${esc(s.city||"")}${s.with?` &nbsp;·&nbsp; <span class="w">${esc(s.with)}</span>`:""}</div>
      ${s.note?`<div class="note">${esc(s.note)}</div>`:""}
      ${s.example?`<span class="stamp eg">Example — delete me</span>`:""}
    </div>
    ${act}
  </div>`;
}

/* social array (skips blanks) */
function socialList(){
  const L = CONFIG.links;
  const order = [
    ["Spotify",L.spotify],["Apple Music",L.appleMusic],["YouTube",L.youtube],
    ["Instagram",L.instagram],["TikTok",L.tiktok],["Facebook",L.facebook],
    ["SoundCloud",L.soundcloud],["Merch",L.merch],
  ];
  return order.filter(([,u])=>u);
}

/* mailing-list section ("join the broadcast") */
function mailingForm(){
  const m = CONFIG.mailingList || {};
  const on = !!m.action;
  const field = m.fieldName || "email";
  return `
  <section class="wrap section">
    <div class="tune" data-reveal>
      <div class="tune-scrawl">don't miss a transmission</div>
      <div class="kicker">Join the broadcast</div>
      <h2>Tune <em>in</em>.</h2>
      <p>New singles, show announcements and the occasional transmission from the booth — straight to your inbox. No noise, just the signal.</p>
      <form class="tune-form" id="tuneForm" ${on?`action="${esc(m.action)}" method="post" target="tuneSink"`:""} novalidate>
        <input type="email" name="${esc(field)}" id="tuneEmail" placeholder="you@example.com" autocomplete="email" required ${on?"":"disabled"}>
        <button class="btn solid" type="submit" ${on?"":"disabled"}>Subscribe</button>
      </form>
      <div class="tune-msg ${on?"":"note"}" id="tuneMsg" role="status">${on?"":"Mailing list isn't connected yet — drop your provider's form URL into the config to switch it on."}</div>
    </div>
  </section>`;
}

/* ───────────────────────── views ───────────────────────── */
function viewHome(){
  const rel = CONFIG.releases.map(videoPlayer).join("");

  const merch = CONFIG.merchItems.slice(0,4).map(m=>`
    <a class="mitem" data-reveal href="${esc(m.url)}" target="_blank" rel="noopener">
      <div class="tag">Merch</div>
      <h3>${esc(m.name)}</h3>
      <div class="price">${esc(m.price)}</div>
      <div class="shop">Shop ↗</div>
    </a>`).join("");

  const next = upcoming[0];
  const teaser = next ? `
    <div class="section">
      <div class="kicker" data-reveal>Next transmission</div>
      <div class="teaser" data-reveal style="margin-top:24px">
        <div class="when">
          <div class="d">${String(next._d.getDate()).padStart(2,"0")}</div>
          <div class="m">${MON[next._d.getMonth()]}${yr(next._d)}</div>
        </div>
        <div class="info">
          <h3>${esc(next.venue)}</h3>
          <div class="loc">${esc(next.city||"")}${next.with?` · ${esc(next.with)}`:""}</div>
        </div>
        <div>${ next.soldOut ? `<span class="soldout">Sold out</span>`
              : next.tickets ? `<a class="btn solid" href="${esc(next.tickets)}" target="_blank" rel="noopener">Get tickets</a>`
              : `<a class="btn" href="#/shows">All shows</a>` }</div>
      </div>
    </div>` : "";

  const ticker = CONFIG.band.ticker.map(t=>`<span>${esc(t)}</span><i>+</i>`).join("");

  return `
  <section class="wrap hero">
    <div class="freq" data-reveal>
      <span><b>87.7</b> FM</span>
      <span>EST. MANCHESTER · ${esc(CONFIG.band.foundedRoman)}</span>
      <span>NOW BROADCASTING</span>
    </div>
    <div class="logo-stage" id="logoStage" data-reveal>
      <img class="logo-img" id="logoImg" src="${esc(CONFIG.band.logoImage)}" alt="Hospital Radio.">
      <h1 class="logo-fallback glitch">hospital radio<span class="dot">.</span></h1>
    </div>
    <div class="hero-tag" data-reveal>${esc(CONFIG.band.tagline)}</div>
    <div class="hero-sub" data-reveal>${esc(CONFIG.band.scrawl)}</div>

    <div class="ticker" data-reveal><div class="ticker-row">${ticker}${ticker}</div></div>

    <div class="quick" data-reveal>
      ${CONFIG.links.spotify?`<a class="btn solid" href="${esc(CONFIG.links.spotify)}" target="_blank" rel="noopener">▶ Listen now</a>`:""}
      <a class="btn" href="#/shows">Shows</a>
      ${CONFIG.links.merch?`<a class="btn red" href="${esc(CONFIG.links.merch)}" target="_blank" rel="noopener">Merch ↗</a>`:""}
    </div>
  </section>

  ${ekg()}

  <section class="wrap section">
    <div class="sec-head" data-reveal>
      <h2>Latest <em>transmissions</em></h2>
      <a class="btn" href="#/listen">All releases →</a>
    </div>
    <div class="grid vid-grid">${rel}</div>
  </section>

  ${teaser}

  <section class="wrap section">
    <div class="sec-head" data-reveal>
      <h2>Wear the <em>signal</em></h2>
      ${CONFIG.links.merch?`<a class="btn red" href="${esc(CONFIG.links.merch)}" target="_blank" rel="noopener">Full store ↗</a>`:""}
    </div>
    <div class="grid merch-grid">${merch}</div>
  </section>

  ${mailingForm()}`;
}

function viewShows(){
  const body = upcoming.length
    ? `<div class="shows">${upcoming.map(s=>showRow(s,false)).join("")}</div>`
    : `<div class="empty" data-reveal>
         <div class="big">Dead air.</div>
         <div class="small">No shows on the schedule right now</div>
         <div class="static">…but we'll be back on the airwaves soon</div>
       </div>`;
  return `
  <section class="wrap section">
    <div class="kicker" data-reveal>Broadcast schedule</div>
    <div class="sec-head" data-reveal style="margin-top:16px">
      <h2>Upcoming <em>shows</em></h2>
      <span style="font-family:var(--mono);font-size:12px;letter-spacing:.16em;color:var(--soft)">${upcoming.length} SCHEDULED</span>
    </div>
    ${body}
    <p style="font-family:var(--mono);font-size:11px;letter-spacing:.12em;color:var(--faint);margin-top:30px">
      Looking for a past gig? → <a href="#/archive" style="color:var(--rose)">the archive</a>
    </p>
  </section>`;
}

function viewArchive(){
  const body = past.length
    ? `<div class="shows archive">${past.map(s=>showRow(s,true)).join("")}</div>`
    : `<div class="empty" data-reveal>
         <div class="big">Nothing logged yet.</div>
         <div class="small">Past shows will appear here once they've aired</div>
       </div>`;
  return `
  <section class="wrap section">
    <div class="kicker" data-reveal>Transmission log</div>
    <div class="sec-head" data-reveal style="margin-top:16px">
      <h2>The <em>archive</em></h2>
      <span style="font-family:var(--mono);font-size:12px;letter-spacing:.16em;color:var(--soft)">${past.length} PLAYED</span>
    </div>
    ${body}
    <p style="font-family:var(--mono);font-size:11px;letter-spacing:.12em;color:var(--faint);margin-top:30px">
      → <a href="#/shows" style="color:var(--rose)">upcoming shows</a>
    </p>
  </section>`;
}

function viewListen(){
  const plats = socialList()
    .filter(([n])=>["Spotify","Apple Music","YouTube","SoundCloud"].includes(n))
    .map(([n,u])=>`<a class="plat" data-reveal href="${esc(u)}" target="_blank" rel="noopener"><span class="nm">${esc(n)}</span><span class="go">Open ↗</span></a>`).join("");

  const rel = CONFIG.releases.map(videoPlayer).join("");

  const vids = (CONFIG.videos||[]).map(videoPlayer).join("");

  return `
  <section class="wrap section">
    <div class="kicker" data-reveal>On the dial</div>
    <div class="sec-head" data-reveal style="margin-top:16px"><h2>Listen <em>in</em></h2></div>
    <div class="bio" data-reveal style="margin-bottom:34px">
      <p class="pq">Now broadcasting<span class="dot">.</span></p>
      <p style="margin-top:22px">${esc(CONFIG.bio)}</p>
      ${(CONFIG.band.members||[]).length?`<p style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--rose);margin-top:20px">Line-up · ${CONFIG.band.members.map(esc).join(" &nbsp;·&nbsp; ")}</p>`:""}
    </div>
    <div class="grid plat-grid">${plats}</div>
  </section>

  ${ekg()}

  <section class="wrap section">
    <div class="sec-head" data-reveal><h2>Music <em>videos</em></h2></div>
    <div class="grid vid-grid">${rel}</div>
    ${vids?`<div class="sec-head" data-reveal style="margin-top:50px"><h2 style="font-size:30px">Watch</h2></div><div class="grid vid-grid">${vids}</div>`:""}
  </section>`;
}

/* ───────────────────────── lyrics ───────────────────────── */
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

function viewLyrics(){
  const songs = CONFIG.songs || [];
  if (!songs.length){
    return `<section class="wrap section"><div class="kicker" data-reveal>Words</div>
      <div class="sec-head" data-reveal style="margin-top:16px"><h2>Lyrics</h2></div>
      <div class="empty" data-reveal><div class="big">No words logged yet.</div></div></section>`;
  }
  const list = songs.map((s,i)=>`
    <a class="lyric-card" data-reveal href="#/lyrics/${slug(s.title)}">
      <span class="ix">${String(i+1).padStart(2,"0")}</span>
      <span class="ti">${esc(s.title)}</span>
      <span class="yr">${esc([s.type||"Single", s.year].filter(Boolean).join(" · "))}</span>
    </a>`).join("");
  return `
  <section class="wrap section">
    <div class="kicker" data-reveal>Words</div>
    <div class="sec-head" data-reveal style="margin-top:16px"><h2>Lyrics</h2></div>
    <div class="lyric-list">${list}</div>
  </section>`;
}

function viewLyric(s){
  const back = `<a class="lyric-back" href="#/lyrics">← all lyrics</a>`;
  return `
  <section class="wrap section">
    ${back}
    <h1 class="lyric-title" data-reveal>${esc(s.title).replace(/\.$/,'<span class="dot">.</span>')}</h1>
    <div class="lyric-meta" data-reveal>${esc([s.type||"Single", s.year].filter(Boolean).join(" · "))}</div>
    ${ekg()}
    <div class="lyrics-body" data-reveal>${esc(s.lyrics||"")}</div>
    ${s.listen?`<a class="btn solid" data-reveal href="${esc(s.listen)}" target="_blank" rel="noopener">▶ Listen</a> `:""}
    <a class="btn" data-reveal href="#/lyrics">← all lyrics</a>
  </section>`;
}

/* ───────────────────────── photos ───────────────────────── */
function viewGallery(){
  const g = CONFIG.gallery || [];
  if (!g.length){
    return `<section class="wrap section"><div class="kicker" data-reveal>Transmissions</div>
      <div class="sec-head" data-reveal style="margin-top:16px"><h2>Photos</h2></div>
      <div class="empty" data-reveal><div class="big">No photos yet.</div><div class="small">Add image URLs in the config</div></div></section>`;
  }
  const tiles = g.map((p,i)=>`
    <button class="ph" data-i="${i}" aria-label="View photo ${i+1}">
      <img src="${esc(p.src)}" alt="${esc(p.caption||"Hospital Radio.")}" loading="lazy" onerror="this.closest('.ph').style.display='none'">
      ${(p.caption||p.credit)?`<span class="cap">${esc([p.caption,p.credit].filter(Boolean).join(" · "))}</span>`:""}
    </button>`).join("");
  return `
  <section class="wrap section">
    <div class="kicker" data-reveal>Transmissions</div>
    <div class="sec-head" data-reveal style="margin-top:16px">
      <h2>Photos</h2>
      <span style="font-family:var(--mono);font-size:12px;letter-spacing:.16em;color:var(--soft)">TAP TO ENLARGE</span>
    </div>
    <div class="gallery" data-reveal>${tiles}</div>
  </section>`;
}

/* ───────────────────────── for promoters ───────────────────────── */
function viewPromoters(){
  const b = CONFIG.booking || {}, band = CONFIG.band || {};
  const members = (band.members||[]).join(" · ");
  const contact = b.email ? `mailto:${b.email}?subject=Booking%20enquiry%20—%20Hospital%20Radio.` : (b.contactUrl||CONFIG.links.instagram||"#");
  const contactLabel = b.email ? b.email : "Get in touch";
  const row = (dt,dd)=> dd ? `<div class="d-row"><dt>${dt}</dt><dd>${dd}</dd></div>` : "";
  return `
  <section class="wrap section">
    <div class="kicker" data-reveal>Press kit · for promoters</div>
    <div class="sec-head" data-reveal style="margin-top:14px"><h2 class="wordmark">${esc(band.name||"Hospital Radio.").replace(/\.$/,'<span class="dot">.</span>')}</h2></div>
    <p class="promo-sub" data-reveal>${esc(band.tagline||"midwest emo")} · est. ${esc(band.foundedRoman||"")}</p>
    <div class="bio" data-reveal style="margin:18px 0 30px"><p style="font-size:20px;line-height:1.65;color:var(--muted)">${esc(b.pitch||CONFIG.bio||"")}</p></div>

    <div class="dossier" data-reveal>
      <div class="d-top"><span class="tag">● Patient file — press</span><span class="ref">REF · HR-877 · ${esc(band.foundedRoman||"")}</span></div>
      <dl style="margin:0">
        ${row("Origin", esc(band.location||"Manchester, UK"))}
        ${row("Genre", esc(band.tagline||"midwest emo"))}
        ${row("Line-up", members?`<span class="mono">${esc(members)}</span>`:"")}
        ${row("Formed", esc(band.foundedRoman||""))}
        ${row("For fans of", b.forFansOf?`<span class="mono">${esc(b.forFansOf)}</span>`:"")}
        ${row("Spotify", band.spotifyListeners?`<span class="mono">${esc(band.spotifyListeners)} monthly listeners</span>`:"")}
        ${row("Stage notes", b.stageNotes?`<span class="mono">${esc(b.stageNotes)}</span>`:"")}
        ${row("Booking", b.email?`<a class="mono" href="mailto:${esc(b.email)}">${esc(b.email)}</a>`:(b.contactUrl?`<a class="mono" href="${esc(b.contactUrl)}" target="_blank" rel="noopener">${esc(b.contactUrl)}</a>`:""))}
      </dl>
    </div>

    <div class="d-assets" data-reveal>
      <a class="btn solid" href="${esc(contact)}" ${b.email?"":'target="_blank" rel="noopener"'}>✉ Book us · ${esc(contactLabel)}</a>
      ${band.logoImage?`<a class="btn" href="${esc(band.logoImage)}" target="_blank" rel="noopener" download>↓ Logo</a>`:""}
      <a class="btn" href="#/photos">Press photos</a>
      ${CONFIG.links.spotify?`<a class="btn" href="${esc(CONFIG.links.spotify)}" target="_blank" rel="noopener">Spotify ↗</a>`:""}
      ${CONFIG.links.youtube?`<a class="btn" href="${esc(CONFIG.links.youtube)}" target="_blank" rel="noopener">YouTube ↗</a>`:""}
      <button class="btn" type="button" onclick="window.print()">⎙ Print / Save as PDF</button>
    </div>
  </section>`;
}

/* ───────────────────────── router ───────────────────────── */
function render(){
  const raw = location.hash.replace(/^#/,"") || "/";
  const parts = raw.split("/").filter(Boolean);     // e.g. ["lyrics","l-a"]
  const section = parts[0] || "";
  let active = section ? "/"+section : "/";
  let html;
  switch (section){
    case "":        html = viewHome(); break;
    case "shows":   html = viewShows(); break;
    case "archive": html = viewArchive(); break;
    case "listen":  html = viewListen(); break;
    case "photos":  html = viewGallery(); break;
    case "booking": html = viewPromoters(); break;
    case "lyrics":
      if (parts[1]){
        const song = (CONFIG.songs||[]).find(s=>slug(s.title)===parts[1]);
        html = song ? viewLyric(song) : viewLyrics();
      } else html = viewLyrics();
      break;
    default:        html = viewHome(); active = "/";
  }
  const view = $("#view");
  view.innerHTML = html;

  // page title (history / bookmarks / shared links)
  const titleMap = { shows:"Shows", archive:"Archive", listen:"Listen", lyrics:"Lyrics", photos:"Photos", booking:"For promoters" };
  let pageName = titleMap[section] || "";
  if (section==="lyrics" && parts[1]){
    const song = (CONFIG.songs||[]).find(s=>slug(s.title)===parts[1]);
    if (song) pageName = song.title;
  }
  document.title = section==="" ? "Hospital Radio. — Manchester midwest emo" : pageName + " · Hospital Radio.";

  // nav active state
  document.querySelectorAll("nav a[data-route]").forEach(a=>{
    a.classList.toggle("active", a.dataset.route===active);
  });

  // staggered entrance
  view.querySelectorAll("[data-reveal]").forEach((el,i)=>{
    el.style.animationDelay = Math.min(i*0.06, 0.8)+"s";
  });

  // logo image: reveal on success, fall back to wordmark on error
  const img = $("#logoImg"), stage = $("#logoStage");
  if (img && stage){
    if (img.complete && img.naturalWidth>0) stage.classList.add("loaded");
    else { img.addEventListener("load", ()=>stage.classList.add("loaded")); img.addEventListener("error", ()=>{}); }
  }

  // close mobile menu + scroll up on navigation
  $("#nav").classList.remove("open");
  $("#menuBtn").setAttribute("aria-expanded","false");
  window.scrollTo({top:0, behavior: section===""?"auto":"smooth"});
}

window.addEventListener("hashchange", render);

/* ───────────────────────── chrome / footer ───────────────────────── */
function boot(){
  // merch nav link
  const mn = $("#merchNav");
  if (CONFIG.links.merch){ mn.href = CONFIG.links.merch; } else { mn.style.display="none"; }

  // footer
  const mem = (CONFIG.band.members||[]).map(n=>n.toLowerCase());
  const memStr = mem.length>1 ? mem.slice(0,-1).join(", ")+" & "+mem.slice(-1) : (mem[0]||"");
  $("#footCred").textContent = memStr ? "an emo transmission from "+memStr : "an emo transmission";
  $("#footMeta").innerHTML =
    `broadcasting from manchester<br>${esc(CONFIG.band.tagline)}<br>© ${new Date().getFullYear()} <span class="wordmark">hospital radio<span class="dot">.</span></span>`;
  $("#footSocials").innerHTML = socialList()
    .map(([n,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join("");

  // mobile menu
  $("#menuBtn").addEventListener("click", ()=>{
    const open = $("#nav").classList.toggle("open");
    $("#menuBtn").setAttribute("aria-expanded", open ? "true" : "false");
  });

  // click-to-play: swap the facade for the real YouTube player on demand
  $("#view").addEventListener("click", e=>{
    const btn = e.target.closest(".video-fac[data-yt]");
    if (!btn) return;
    const frame = btn.closest(".video-frame");
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0&modestbranding=1&color=white&playsinline=1" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  });

  // ── persistent "tune in" radio player ──
  const radio = CONFIG.radio || {};
  const launch = $("#radioLaunch"), panel = $("#radioPanel"), rframe = $("#radioFrame");
  if (!radio.enabled || !radio.embedUrl){
    if (launch) launch.style.display = "none";
  } else {
    const f = radio.frequency || "87.7";
    $("#radioFreq").textContent = f; $("#radioFreq2").textContent = f;
    rframe.style.height = (radio.height || 352) + "px";
    const open = ()=>{
      if (!rframe.src) rframe.src = radio.embedUrl;     // load (and start) only on first open
      panel.classList.add("open"); panel.setAttribute("aria-hidden","false");
      launch.classList.add("hidden");
    };
    const close = ()=>{                                  // minimise — keeps playing in the background
      panel.classList.remove("open"); panel.setAttribute("aria-hidden","true");
      launch.classList.remove("hidden");
    };
    launch.addEventListener("click", open);
    $("#radioClose").addEventListener("click", close);
    document.addEventListener("keydown", e=>{ if (e.key==="Escape" && panel.classList.contains("open")) close(); });
  }

  // ── mailing list submit (validate, confirm, post to hidden sink) ──
  document.addEventListener("submit", e=>{
    if (e.target.id !== "tuneForm") return;
    const input = $("#tuneEmail"), msg = $("#tuneMsg");
    const email = (input.value || "").trim();
    const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    const connected = !!(CONFIG.mailingList && CONFIG.mailingList.action);
    if (!connected){ e.preventDefault(); return; }
    if (!valid){
      e.preventDefault();
      msg.className = "tune-msg err"; msg.textContent = "That email doesn't look right — try again.";
      return;
    }
    // valid → let the native POST reach the hidden iframe, and confirm
    msg.className = "tune-msg ok"; msg.textContent = "✓ You're tuned in. Welcome to the broadcast.";
    input.value = "";
  });

  // ── gallery lightbox ──
  const GAL = CONFIG.gallery || [];
  const lb = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCap");
  let lbIndex = 0;
  function openLb(i){
    if (!GAL.length) return;
    lbIndex = (i + GAL.length) % GAL.length;
    const it = GAL[lbIndex];
    lbImg.src = it.full || it.src;
    lbCap.textContent = [it.caption, it.credit].filter(Boolean).join("  ·  ");
    lb.classList.add("open"); lb.setAttribute("aria-hidden","false"); document.body.style.overflow = "hidden";
    $("#lbClose").focus();
  }
  function closeLb(){ lb.classList.remove("open"); lb.setAttribute("aria-hidden","true"); document.body.style.overflow = ""; }
  $("#view").addEventListener("click", e=>{
    const tile = e.target.closest(".ph[data-i]");
    if (tile) openLb(parseInt(tile.dataset.i, 10));
  });
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", ()=>openLb(lbIndex-1));
  $("#lbNext").addEventListener("click", ()=>openLb(lbIndex+1));
  lb.addEventListener("click", e=>{ if (e.target === lb) closeLb(); });
  // swipe between photos on touch
  let touchX = null;
  lb.addEventListener("touchstart", e=>{ touchX = e.changedTouches[0].clientX; }, {passive:true});
  lb.addEventListener("touchend", e=>{
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 45) openLb(lbIndex + (dx < 0 ? 1 : -1));
  }, {passive:true});
  document.addEventListener("keydown", e=>{
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") openLb(lbIndex-1);
    else if (e.key === "ArrowRight") openLb(lbIndex+1);
  });

  // ── intro / tune-in sequence (once per session, skippable, motion-safe) ──
  (function intro(){
    const el = $("#intro");
    if (!el) return;
    if (CONFIG.intro && CONFIG.intro.enabled === false){ el.remove(); return; }
    let seen = false; try { seen = sessionStorage.getItem("hr_intro") === "1"; } catch(_){}
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce){ el.remove(); return; }
    document.body.classList.add("intro-on");
    const read = $("#introRead"), freq = $("#introFreq");
    const steps = [["○","scanning the dial…"], ["◐","tuning · 87.7 fm…"], ["●","signal acquired"]];
    let i = 0;
    const fInt = setInterval(()=>{ freq.textContent = (85 + Math.random()*9).toFixed(1) + " FM"; }, 85);
    const sInt = setInterval(()=>{ i++; if (i < steps.length) read.innerHTML = steps[i][0] + "&nbsp;&nbsp;" + steps[i][1]; }, 660);
    let done = false;
    function finish(){
      if (done) return; done = true;
      clearInterval(fInt); clearInterval(sInt);
      freq.textContent = "87.7 FM";
      try { sessionStorage.setItem("hr_intro","1"); } catch(_){}
      el.classList.add("done");
      document.removeEventListener("keydown", onKey);
      setTimeout(()=>{ el.remove(); document.body.classList.remove("intro-on"); }, 580);
    }
    const t = setTimeout(finish, 2700);
    el.addEventListener("click", ()=>{ clearTimeout(t); finish(); });
    function onKey(){ clearTimeout(t); finish(); document.removeEventListener("keydown", onKey); }
    document.addEventListener("keydown", onKey);
  })();

  render();
}
boot();
