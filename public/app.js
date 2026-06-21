/* ── Custom Cursor ── */
const cursor = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursor-trail');
let mouseX = 0, mouseY = 0, trailX = 0, trailY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursor) {
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  }
});

function animateTrail() {
  trailX += (mouseX - trailX) * 0.1;
  trailY += (mouseY - trailY) * 0.1;
  if (cursorTrail) {
    cursorTrail.style.left = trailX + 'px';
    cursorTrail.style.top = trailY + 'px';
  }
  requestAnimationFrame(animateTrail);
}
animateTrail();

/* ── Three.js Particle Background ── */
(function initThree() {
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 500;

  const count = 800;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 2000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1200;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xc9a96e,
    size: 1.8,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  const torusGeo = new THREE.TorusGeometry(160, 1.5, 8, 60);
  const torusMat = new THREE.LineBasicMaterial({ color: 0xc9a96e, transparent: true, opacity: 0.06 });
  const torus = new THREE.LineSegments(new THREE.WireframeGeometry(torusGeo), torusMat);
  torus.rotation.x = Math.PI / 3;
  scene.add(torus);

  let mouseInflX = 0, mouseInflY = 0;
  document.addEventListener('mousemove', e => {
    mouseInflX = (e.clientX / window.innerWidth - 0.5) * 0.3;
    mouseInflY = (e.clientY / window.innerHeight - 0.5) * 0.3;
  });

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.0003;
    particles.rotation.y = t * 0.5 + mouseInflX * 0.4;
    particles.rotation.x = t * 0.2 + mouseInflY * 0.2;
    torus.rotation.y += 0.001;
    torus.rotation.z += 0.0005;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

/* ── Sticky Header ── */
const header = document.getElementById('site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ── Hero Title Reveal ── */
window.addEventListener('load', () => {
  const lines = document.querySelectorAll('.line-inner');
  lines.forEach((el, i) => {
    setTimeout(() => el.classList.add('revealed'), 200 + i * 120);
  });
  setTimeout(() => {
    document.querySelectorAll('.reveal-fade').forEach(el => el.classList.add('revealed'));
    const heroCard = document.querySelector('.hero-card');
    if (heroCard) heroCard.classList.add('revealed');
  }, 800);
});

/* ── Scroll Reveal ── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.section-reveal').forEach(el => revealObserver.observe(el));

/* ── 3D Card Tilt ── */
document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(4px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.5s ease';
    card.style.transform = 'perspective(600px) rotateY(0) rotateX(0) translateZ(0)';
  });
  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform 0.1s ease';
  });
});

/* ── Contact Form ── */
const form = document.getElementById('contact-form');
const statusElement = document.getElementById('form-status');

function setStatus(message, type) {
  statusElement.textContent = message;
  statusElement.className = `form-status ${type || ''}`.trim();
}

if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    setStatus('Envoi en cours...', '');

    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setStatus(result.error || 'Une erreur est survenue.', 'error');
        return;
      }
      setStatus('Demande préparée. Votre messagerie va s\'ouvrir pour finaliser l\'email.', 'success');
      form.reset();
      if (result.mailtoLink) window.location.href = result.mailtoLink;
    } catch {
      setStatus('Impossible d\'envoyer la demande pour le moment.', 'error');
    }
  });
}
