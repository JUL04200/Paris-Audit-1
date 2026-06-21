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

/* ── THREE.JS — GRAPHIQUE FINANCIER 3D INTERACTIF ── */
(function () {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); /* transparent — fond rue visible */
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1, 10);

  /* ── LUMIÈRES ── */
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  const keyLight = new THREE.PointLight(0xf0d090, 6, 25);
  keyLight.position.set(5, 8, 6);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0xc9a96e, 3, 20);
  fillLight.position.set(-6, -2, 4);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffd080, 1.5);
  rimLight.position.set(0, 10, -5);
  scene.add(rimLight);

  /* ── MATÉRIAUX ── */
  const goldMat = new THREE.MeshPhongMaterial({
    color: 0x1a1200,
    emissive: 0x0d0800,
    specular: 0xf0d090,
    shininess: 200,
    flatShading: false,
  });
  const goldEdgeMat = new THREE.LineBasicMaterial({
    color: 0xc9a96e,
    transparent: true,
    opacity: 0.35,
  });
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xc9a96e,
    wireframe: true,
    transparent: true,
    opacity: 0.07,
  });

  /* ── DONNÉES FINANCIÈRES (hauteurs relatives) ── */
  const data = [0.4, 0.65, 0.5, 0.85, 0.7, 1.0, 0.78, 0.92];
  const barGroup = new THREE.Group();
  const barMeshes = [];
  const targetHeights = [];
  const currentHeights = [];
  const baseHeights = data.map(v => v * 3.8);

  const barW = 0.32, barD = 0.32, gap = 0.52;
  const totalW = data.length * (barW + gap) - gap;
  const startX = -totalW / 2 + barW / 2;

  data.forEach((val, i) => {
    const h = baseHeights[i];
    const x = startX + i * (barW + gap);

    /* Barre principale */
    const geo = new THREE.BoxGeometry(barW, h, barD);
    const mesh = new THREE.Mesh(geo, goldMat.clone());
    mesh.position.set(x, h / 2 - 2.2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    barGroup.add(mesh);
    barMeshes.push(mesh);
    targetHeights.push(h);
    currentHeights.push(h);

    /* Contour doré */
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, goldEdgeMat.clone());
    line.position.copy(mesh.position);
    barGroup.add(line);

    /* Top cap lumineux */
    const capGeo = new THREE.BoxGeometry(barW + 0.04, 0.04, barD + 0.04);
    const capMat = new THREE.MeshBasicMaterial({ color: 0xf0d090, transparent: true, opacity: 0.9 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(x, h - 2.2, 0);
    barGroup.add(cap);
    mesh.userData.cap = cap;
  });

  /* Sol / grille */
  const gridHelper = new THREE.GridHelper(12, 12, 0xc9a96e, 0xc9a96e);
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.06;
  gridHelper.position.y = -2.2;
  barGroup.add(gridHelper);

  /* Ligne de base */
  const baseLineMat = new THREE.LineBasicMaterial({ color: 0xc9a96e, transparent: true, opacity: 0.3 });
  const baseLineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-totalW / 2 - 0.3, -2.2, 0),
    new THREE.Vector3(totalW / 2 + 0.3, -2.2, 0),
  ]);
  barGroup.add(new THREE.Line(baseLineGeo, baseLineMat));

  /* Ligne de tendance (courbe) */
  const trendPoints = data.map((v, i) => new THREE.Vector3(
    startX + i * (barW + gap), v * 3.8 - 2.2, 0.3
  ));
  const trendCurve = new THREE.CatmullRomCurve3(trendPoints);
  const trendGeo = new THREE.BufferGeometry().setFromPoints(trendCurve.getPoints(60));
  const trendMat = new THREE.LineBasicMaterial({ color: 0xf0d090, transparent: true, opacity: 0.55 });
  barGroup.add(new THREE.Line(trendGeo, trendMat));

  /* Points sur la courbe */
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xf0d090 });
  trendPoints.forEach(pt => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), dotMat);
    dot.position.copy(pt);
    barGroup.add(dot);
  });

  /* Particules flottantes */
  const pCount = 120;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 14;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xc9a96e, size: 0.03, transparent: true, opacity: 0.5 });
  barGroup.add(new THREE.Points(pGeo, pMat));

  /* Position groupe — décalé vers la droite pour laisser place au texte */
  barGroup.position.set(1.8, 0, 0);
  scene.add(barGroup);

  /* ── INTERACTION SOURIS ── */
  let mouseInflX = 0, mouseInflY = 0;
  let targetInflX = 0, targetInflY = 0;

  /* Raycaster pour hover interactif sur les barres */
  const raycaster = new THREE.Raycaster();
  const mouse2D = new THREE.Vector2();
  const hoveredBars = new Set();

  document.addEventListener('mousemove', e => {
    targetInflX = (e.clientX / window.innerWidth - 0.5) * 2.0;
    targetInflY = (e.clientY / window.innerHeight - 0.5) * 1.2;
    mouse2D.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse2D.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  /* ── ANIMATION ── */
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;

    /* Smooth mouse parallax */
    mouseInflX += (targetInflX - mouseInflX) * 0.05;
    mouseInflY += (targetInflY - mouseInflY) * 0.05;

    barGroup.rotation.y = mouseInflX * 0.28;
    barGroup.rotation.x = mouseInflY * 0.12;

    /* Légère rotation automatique quand souris immobile */
    barGroup.rotation.y += Math.sin(t * 0.3) * 0.002;

    /* Raycaster hover — barres qui montent */
    raycaster.setFromCamera(mouse2D, camera);
    const intersects = raycaster.intersectObjects(barMeshes);
    const hitSet = new Set(intersects.map(i => i.object));

    barMeshes.forEach((bar, i) => {
      const isHit = hitSet.has(bar);
      targetHeights[i] = isHit ? baseHeights[i] * 1.22 : baseHeights[i];

      /* Smooth height interpolation */
      currentHeights[i] += (targetHeights[i] - currentHeights[i]) * 0.1;
      const h = currentHeights[i];

      /* Rescale bar */
      bar.scale.y = h / baseHeights[i];
      bar.position.y = h / 2 - 2.2;

      /* Cap position */
      if (bar.userData.cap) bar.userData.cap.position.y = h - 2.2;

      /* Glow on hover */
      if (isHit) {
        bar.material.emissive.setHex(0x3a2800);
        bar.material.specular.setHex(0xffeebb);
      } else {
        bar.material.emissive.setHex(0x0d0800);
        bar.material.specular.setHex(0xf0d090);
      }
    });

    /* Lumière animée */
    keyLight.position.x = 5 + Math.sin(t * 0.4) * 2;
    keyLight.position.z = 6 + Math.cos(t * 0.3) * 2;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

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
