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

/* ── THREE.JS HERO 3D ── */
(function () {
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  const W = window.innerWidth, H = window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 0, 7);

  /* Lights */
  const ambient = new THREE.AmbientLight(0xffffff, 0.15);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0xf0d090, 8, 20);
  keyLight.position.set(4, 5, 4);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0xc9a96e, 4, 20);
  fillLight.position.set(-5, -2, 3);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffffff, 3, 15);
  rimLight.position.set(0, -6, -4);
  scene.add(rimLight);

  const accentLight = new THREE.PointLight(0xd4a853, 5, 12);
  accentLight.position.set(0, 8, 0);
  scene.add(accentLight);

  /* Main Object — Icosahedron (crystal gem) */
  const mainGeo = new THREE.IcosahedronGeometry(2.2, 1);
  const mainMat = new THREE.MeshPhongMaterial({
    color: 0x0a0800,
    emissive: 0x180e00,
    specular: 0xf0d090,
    shininess: 180,
    flatShading: true,
  });
  const mainMesh = new THREE.Mesh(mainGeo, mainMat);
  mainMesh.castShadow = true;
  scene.add(mainMesh);

  /* Wireframe overlay */
  const wireGeo = new THREE.IcosahedronGeometry(2.22, 1);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xc9a96e,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  const wireMesh = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wireMesh);

  /* Inner glowing core */
  const coreGeo = new THREE.IcosahedronGeometry(1.0, 0);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xc9a96e,
    transparent: true,
    opacity: 0.04,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  scene.add(coreMesh);

  /* Outer ring */
  const ringGeo = new THREE.TorusGeometry(3.2, 0.008, 3, 120);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xc9a96e, transparent: true, opacity: 0.18 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.4;
  scene.add(ring);

  const ring2Geo = new THREE.TorusGeometry(3.6, 0.005, 3, 140);
  const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xc9a96e, transparent: true, opacity: 0.08 });
  const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2.rotation.x = Math.PI / 3;
  ring2.rotation.z = 0.4;
  scene.add(ring2);

  /* Floating particles around the object */
  const partCount = 200;
  const partPositions = new Float32Array(partCount * 3);
  for (let i = 0; i < partCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 3 + Math.random() * 2.5;
    partPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    partPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    partPositions[i * 3 + 2] = r * Math.cos(phi);
  }
  const partGeo = new THREE.BufferGeometry();
  partGeo.setAttribute('position', new THREE.BufferAttribute(partPositions, 3));
  const partMat = new THREE.PointsMaterial({ color: 0xc9a96e, size: 0.025, transparent: true, opacity: 0.6 });
  const particles = new THREE.Points(partGeo, partMat);
  scene.add(particles);

  /* Mouse influence */
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;
  document.addEventListener('mousemove', e => {
    targetRotY = ((e.clientX / window.innerWidth) - 0.5) * 1.2;
    targetRotX = ((e.clientY / window.innerHeight) - 0.5) * 0.8;
  });

  /* Animation */
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.006;

    /* Smooth mouse follow */
    currentRotX += (targetRotX - currentRotX) * 0.04;
    currentRotY += (targetRotY - currentRotY) * 0.04;

    /* Auto-rotate + mouse */
    mainMesh.rotation.y = t * 0.3 + currentRotY;
    mainMesh.rotation.x = t * 0.15 + currentRotX;
    wireMesh.rotation.y = t * 0.3 + currentRotY;
    wireMesh.rotation.x = t * 0.15 + currentRotX;
    coreMesh.rotation.y = -t * 0.4;

    /* Pulsing core */
    const pulse = 1 + Math.sin(t * 2) * 0.06;
    coreMesh.scale.setScalar(pulse);
    coreMat.opacity = 0.03 + Math.sin(t * 2) * 0.02;

    /* Rings */
    ring.rotation.z = t * 0.12;
    ring2.rotation.z = -t * 0.08;

    /* Particles orbit */
    particles.rotation.y = t * 0.08;
    particles.rotation.x = t * 0.04;

    /* Light animation */
    keyLight.position.x = Math.sin(t * 0.5) * 5;
    keyLight.position.z = Math.cos(t * 0.5) * 5;
    fillLight.position.x = Math.cos(t * 0.4) * -5;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const W = window.innerWidth, H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
})();

/* ── SCROLL REVEAL ── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
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
    btn.textContent = 'Envoi…';
    btn.disabled = true;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      statusEl.textContent = 'Message envoyé — nous vous répondrons rapidement.';
      form.reset();
      if (result.mailtoLink) window.location.href = result.mailtoLink;
    } catch {
      statusEl.textContent = 'Erreur. Contactez-nous à INFO@PARISAUDIT.COM';
    } finally {
      btn.textContent = 'Envoyer la demande';
      btn.disabled = false;
    }
  });
}
