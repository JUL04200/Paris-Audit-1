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

/* ── THREE.JS — BALANCE COMPTABLE 3D ── */
(function () {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  const mobile = window.innerWidth <= 768;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true });
  renderer.setPixelRatio(mobile ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = !mobile;   /* ombres désactivées sur mobile */
  if (!mobile) renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.4, 9);

  /* ── LUMIÈRES ── */
  scene.add(new THREE.AmbientLight(0xfff8e7, mobile ? 0.35 : 0.12));

  const keyLight = mobile
    ? new THREE.PointLight(0xffd080, 6, 30)
    : new THREE.SpotLight(0xffd080, 10, 35, Math.PI / 4.5, 0.25, 1);
  keyLight.position.set(6, 9, 7);
  if (!mobile) { keyLight.castShadow = true; keyLight.shadow.mapSize.set(1024, 1024); }
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0xc9a96e, mobile ? 3 : 5, 22);
  fillLight.position.set(-5, 2, 5);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffe8b0, mobile ? 0.8 : 1.4);
  rimLight.position.set(1, 8, -5);
  scene.add(rimLight);

  if (!mobile) {
    const bottomLight = new THREE.PointLight(0xd4941a, 2.5, 14);
    bottomLight.position.set(3, -3, 3);
    scene.add(bottomLight);
  }

  /* ── MATÉRIAUX ── */
  function goldPhong(options) {
    return new THREE.MeshPhongMaterial(Object.assign({
      color:     0x160e00,
      emissive:  0x090500,
      specular:  0xffd060,
      shininess: mobile ? 180 : 280,
    }, options));
  }
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xd4a843, transparent: true, opacity: 0.45 });

  /* Segments réduits sur mobile */
  const S = mobile ? 0.45 : 1;   /* facteur de subdivision */
  function seg(n) { return Math.max(4, Math.round(n * S)); }

  function addEdges(geo, parent, offset) {
    if (mobile) return;   /* pas d'edge-lines sur mobile */
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat.clone());
    if (offset) e.position.copy(offset);
    parent.add(e);
  }

  /* ── GROUPE BALANCE ── */
  const scaleGroup = new THREE.Group();

  /* BASE PLATE */
  const baseGeo = new THREE.CylinderGeometry(1.05, 1.25, 0.09, seg(48));
  const base = new THREE.Mesh(baseGeo, goldPhong());
  base.position.y = -2.05;
  if (!mobile) base.castShadow = true;
  scaleGroup.add(base);
  addEdges(baseGeo, scaleGroup, base.position.clone());

  /* BASE MOULURE — desktop seulement */
  if (!mobile) {
    const moldGeo = new THREE.TorusGeometry(0.9, 0.038, 10, 48);
    const mold = new THREE.Mesh(moldGeo, goldPhong({ shininess: 320 }));
    mold.rotation.x = Math.PI / 2;
    mold.position.y = -1.98;
    scaleGroup.add(mold);
  }

  /* PIED COURT */
  const footGeo = new THREE.CylinderGeometry(0.1, 0.18, 0.38, seg(20));
  const foot = new THREE.Mesh(footGeo, goldPhong());
  foot.position.y = -1.82;
  scaleGroup.add(foot);

  /* COLONNE PRINCIPALE */
  const pillarGeo = new THREE.CylinderGeometry(0.052, 0.088, 3.55, seg(18));
  const pillar = new THREE.Mesh(pillarGeo, goldPhong({ shininess: mobile ? 200 : 240 }));
  pillar.position.y = -0.07;
  if (!mobile) pillar.castShadow = true;
  scaleGroup.add(pillar);
  addEdges(pillarGeo, scaleGroup, pillar.position.clone());

  /* ANNEAU CENTRAL — desktop seulement */
  if (!mobile) {
    const ringGeo = new THREE.TorusGeometry(0.11, 0.03, 10, 24);
    const ring = new THREE.Mesh(ringGeo, goldPhong({ shininess: 320 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.5;
    scaleGroup.add(ring);
  }

  /* FINIAL SPHÈRE */
  const finialGeo = new THREE.SphereGeometry(0.092, seg(20), seg(20));
  const finial = new THREE.Mesh(finialGeo, goldPhong({ shininess: mobile ? 240 : 360 }));
  finial.position.y = 1.71;
  scaleGroup.add(finial);

  const coneGeo = new THREE.ConeGeometry(0.065, 0.17, seg(18));
  const cone = new THREE.Mesh(coneGeo, goldPhong());
  cone.position.y = 1.54;
  scaleGroup.add(cone);

  /* ── BRAS DE BALANCE ── */
  const ARM = 2.15;
  const ARM_Y = 1.60;

  const armGeo = new THREE.CylinderGeometry(0.022, 0.022, ARM * 2, seg(10));
  armGeo.rotateZ(Math.PI / 2);
  const arm = new THREE.Mesh(armGeo, goldPhong({ shininess: mobile ? 200 : 300 }));
  arm.position.y = ARM_Y;
  scaleGroup.add(arm);
  addEdges(armGeo, scaleGroup, arm.position.clone());

  /* Pivot */
  if (!mobile) {
    const pivotGeo = new THREE.TorusGeometry(0.055, 0.02, 10, 20);
    const pivotMesh = new THREE.Mesh(pivotGeo, goldPhong({ shininess: 340 }));
    pivotMesh.position.y = ARM_Y;
    scaleGroup.add(pivotMesh);
  }

  /* ── PLATEAUX ── */
  const PAN_R = 0.72;
  const PAN_BASE_Y = 0.48;

  function createPanGroup() {
    const g = new THREE.Group();
    const discGeo = new THREE.CylinderGeometry(PAN_R, PAN_R * 0.93, 0.046, seg(40));
    const disc = new THREE.Mesh(discGeo, goldPhong({ shininess: mobile ? 240 : 340, color: 0x110a00 }));
    if (!mobile) disc.castShadow = true;
    g.add(disc);
    const rimGeo = new THREE.TorusGeometry(PAN_R, 0.016, seg(10), seg(40));
    const rim = new THREE.Mesh(rimGeo, goldPhong({ shininess: mobile ? 240 : 360 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.023;
    g.add(rim);
    if (!mobile) {
      const innerGeo = new THREE.CircleGeometry(PAN_R * 0.88, 32);
      const inner = new THREE.Mesh(innerGeo, goldPhong({ color: 0x0a0700, shininess: 400, emissive: 0x040200 }));
      inner.rotation.x = -Math.PI / 2;
      inner.position.y = 0.024;
      g.add(inner);
    }
    return g;
  }

  const leftPan = createPanGroup();
  const rightPan = createPanGroup();
  leftPan.position.set(-ARM, PAN_BASE_Y, 0);
  rightPan.position.set(ARM, PAN_BASE_Y, 0);
  scaleGroup.add(leftPan);
  scaleGroup.add(rightPan);

  /* ── CHAÎNES ── */
  /* Mobile : 1 seule chaîne par plateau (centré) / Desktop : 3 */
  const CHAIN_OFFSETS = mobile
    ? [new THREE.Vector3(0, 0, 0)]
    : [
        new THREE.Vector3(0,     0,  0.28),
        new THREE.Vector3(-0.24, 0, -0.14),
        new THREE.Vector3(0.24,  0, -0.14),
      ];

  function makeChain() {
    const geo = new THREE.CylinderGeometry(0.011, 0.011, 1, mobile ? 4 : 6);
    return new THREE.Mesh(geo, goldPhong({ shininess: 200 }));
  }

  const leftChains  = CHAIN_OFFSETS.map(() => { const m = makeChain(); scaleGroup.add(m); return m; });
  const rightChains = CHAIN_OFFSETS.map(() => { const m = makeChain(); scaleGroup.add(m); return m; });

  const _up  = new THREE.Vector3(0, 1, 0);
  const _dir = new THREE.Vector3();
  const _mid = new THREE.Vector3();
  const _top = new THREE.Vector3();
  const _bot = new THREE.Vector3();

  function updateChain(chain, topX, topY, topZ, botX, botY, botZ) {
    _top.set(topX, topY, topZ);
    _bot.set(botX, botY, botZ);
    _dir.subVectors(_bot, _top);
    const len = _dir.length();
    _mid.lerpVectors(_top, _bot, 0.5);
    chain.position.copy(_mid);
    chain.scale.y = len;
    if (len > 0.001) chain.quaternion.setFromUnitVectors(_up, _dir.divideScalar(len));
  }

  /* ── PARTICULES ── */
  const P = mobile ? 30 : 100;
  const pPos = new Float32Array(P * 3);
  for (let i = 0; i < P; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 11;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xc9a96e, size: mobile ? 0.04 : 0.028, transparent: true, opacity: 0.4 });
  scaleGroup.add(new THREE.Points(pGeo, pMat));

  /* Position : centré sur mobile, décalé à droite sur desktop */
  scaleGroup.position.set(mobile ? 0 : 2.85, mobile ? -0.2 : 0.05, 0);
  scene.add(scaleGroup);

  /* ── INTERACTION ── */
  let tgtX = 0, tgtY = 0, curX = 0, curY = 0;

  /* Souris (desktop) */
  document.addEventListener('mousemove', e => {
    tgtX = (e.clientX / window.innerWidth  - 0.5) * 2.0;
    tgtY = (e.clientY / window.innerHeight - 0.5) * 1.2;
  });

  /* Gyroscope / touch (mobile) */
  if (mobile) {
    window.addEventListener('deviceorientation', e => {
      if (e.gamma !== null) tgtX = Math.max(-1, Math.min(1, e.gamma / 20));
      if (e.beta  !== null) tgtY = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
    }, { passive: true });
    document.addEventListener('touchmove', e => {
      const t = e.touches[0];
      tgtX = (t.clientX / window.innerWidth  - 0.5) * 2;
      tgtY = (t.clientY / window.innerHeight - 0.5) * 1.2;
    }, { passive: true });
  }

  /* ── ANIMATION ── */
  let t = 0;

  function animate() {
    requestAnimationFrame(animate);
    t += 0.006;

    curX += (tgtX - curX) * 0.042;
    curY += (tgtY - curY) * 0.042;
    scaleGroup.rotation.y = curX * 0.20 + Math.sin(t * 0.22) * 0.004;
    scaleGroup.rotation.x = curY * 0.09;

    const swing   = Math.sin(t * 0.62) * 0.30;
    const armTilt = swing * 0.055;
    arm.rotation.z = armTilt;

    const leftY  = PAN_BASE_Y + swing;
    const rightY = PAN_BASE_Y - swing;
    leftPan.position.y  = leftY;
    rightPan.position.y = rightY;

    const leftTipY  = ARM_Y + armTilt * ARM;
    const rightTipY = ARM_Y - armTilt * ARM;

    CHAIN_OFFSETS.forEach((off, i) => {
      updateChain(leftChains[i],
        -ARM + off.x, leftTipY, off.z,
        -ARM + off.x, leftY + 0.024, off.z);
      updateChain(rightChains[i],
        ARM + off.x, rightTipY, off.z,
        ARM + off.x, rightY + 0.024, off.z);
    });

    if (!mobile) {
      keyLight.position.x = 6 + Math.sin(t * 0.33) * 1.8;
      keyLight.position.z = 7 + Math.cos(t * 0.27) * 1.6;
    }

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

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
