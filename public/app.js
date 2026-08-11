/* ── CURSOR ── */
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  if (cursor) { cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'; }
});
(function ringLoop() {
  rx += (mx - rx) * 0.08;
  ry += (my - ry) * 0.08;
  if (cursorRing) { cursorRing.style.left = rx + 'px'; cursorRing.style.top = ry + 'px'; }
  requestAnimationFrame(ringLoop);
})();
document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => cursor?.classList.add('big'));
  el.addEventListener('mouseleave', () => cursor?.classList.remove('big'));
});

/* ── MENU BURGER MOBILE ── */
const burger = document.getElementById('nav-burger');
const mobileMenu = document.getElementById('mobile-menu');
burger?.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  burger.classList.toggle('open', open);
});
function closeMobileMenu() {
  mobileMenu?.classList.remove('open');
  burger?.classList.remove('open');
}

/* ── SCROLL REVEAL ── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ── CONTACT FORM ── */
const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');
if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    btn.textContent = 'Envoi…'; btn.disabled = true;
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      statusEl.textContent = 'Message envoyé — nous vous répondrons rapidement.';
      form.reset();
      if (result.mailtoLink) window.location.href = result.mailtoLink;
    } catch {
      statusEl.textContent = 'Erreur. Contactez-nous à INFO@PARISAUDIT.COM';
    } finally {
      btn.textContent = 'Envoyer la demande'; btn.disabled = false;
    }
  });
}
