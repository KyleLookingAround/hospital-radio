/* click-to-play: swap the facade for the real YouTube player */
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('.video-fac[data-yt]');
  if (!btn) return;
  const frame = btn.closest('.video-frame');
  if (!frame) return;
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0&modestbranding=1&color=white&playsinline=1`;
  iframe.title = 'YouTube video player';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  frame.replaceChildren(iframe);
});
/* thumbnails: maxres → hq fallback */
document.querySelectorAll<HTMLImageElement>('.video-fac .thumb[data-fallback]').forEach((img) => {
  img.addEventListener('error', () => { if (img.dataset.fallback && img.src !== img.dataset.fallback) img.src = img.dataset.fallback; }, { once: true });
});
