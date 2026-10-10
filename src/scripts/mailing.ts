/* mailing list submit: validate, confirm, post to the hidden sink */
document.addEventListener('submit', (e) => {
  const form = e.target as HTMLFormElement;
  if (form.id !== 'tuneForm') return;
  const input = document.querySelector<HTMLInputElement>('#tuneEmail');
  const msg = document.querySelector<HTMLElement>('#tuneMsg');
  if (!input || !msg) return;
  const email = (input.value || '').trim();
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  if (form.dataset.connected !== '1') { e.preventDefault(); return; }
  if (!valid) { e.preventDefault(); msg.className = 'tune-msg err'; msg.textContent = "That email doesn't look right — try again."; return; }
  msg.className = 'tune-msg ok'; msg.textContent = "✓ You're tuned in. Welcome to the broadcast.";
  input.value = '';
});
