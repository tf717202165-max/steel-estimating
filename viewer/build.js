// Build-sequence demo: loads a real tender IFC and reveals it stage by stage in the order the model is built
// (grids -> columns -> rafters & beams -> bracing -> purlins & girts -> bridging & fly braces -> connections -> checks).
// One merged BufferGeometry whose index buffer is ordered by stage, so the reveal is only a draw-range change.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as WEBIFC from 'web-ifc';

const CASES = {
  warehouse: { file: 'warehouse_MODEL.ifc', label: 'Warehouse and office, VIC' },
  haigslea: { file: 'haigslea_MODEL.ifc', label: 'School hall, QLD' },
  'anzac-avenue': { file: 'anzac-avenue_MODEL.ifc', label: 'Retail development, QLD' },
  plant: { file: 'plant_MODEL.ifc', label: 'Industrial plant, WA' },
};
const STAGES = [
  { name: 'Grids & levels', col: '#c0392b', ai: 'AI reads the architectural and structural drawings and sets out every grid line and level.', me: 'I confirm the set-out against the drawings before any steel goes in.' },
  { name: 'Columns', col: '#2f5f8a', ai: 'Columns placed from the framing plans and member schedules: section, base and top level for each one.', me: 'Checked against the schedule count and the levels on the sections.' },
  { name: 'Rafters, beams & trusses', col: '#4d8cd9', ai: 'Rafters, haunches, trusses and floor beams written straight into Tekla Structures through its API.', me: 'Supports checked: every member lands on a face, nothing stops short.' },
  { name: 'Bracing & struts', col: '#e8891c', ai: 'Roof and wall bracing, struts and rods from the bracing plans and elevations.', me: 'Bay positions and sizes checked against the bracing layout.' },
  { name: 'Purlins & girts', col: '#6aa84f', ai: 'Purlins and girts laid out to the spacing schedule and lapped over the supports, using supplier sections.', me: 'Quotation lengths and laps checked: they drive the price per metre.' },
  { name: 'Bridging & fly braces', col: '#8e7cc3', ai: 'Bridging rows, fly braces, sag rods and hangers from the purlin schedule and the typical details.', me: 'Rows per span checked; priced by length, kept apart from the steel weight.' },
  { name: 'Connections & plates', col: '#b8860b', ai: 'End plates, base plates, stiffeners, cleats and splices modelled from the engineer’s standard details.', me: 'Plate sizes the drawings do not give are flagged as assumed on every plate.' },
  { name: 'Checks → BOM + IFC', col: '#16324f', ai: 'Clash check and completeness check against the schedules, then the bill of materials, IFC and query list are exported from the model.', me: 'Final estimator review of scope, assumptions and queries before issue.' },
];
const stageOf = (type, name) => {
  const n = (name || '').toUpperCase();
  if (/PLATE/i.test(type)) return 6;
  if (/BRIDGING|FLY BRACE|SAG ROD|HANGER|GUTTER STRAP/.test(n)) return 5;
  if (/PURLIN|GIRT|WALL RAIL|HEADER|JOIST|GLAZING HEAD|CEILING|TRIMMER/.test(n)) return 4;
  if (/BRAC|STRUT|ROD|LACING|RAKING|SURGE/.test(n)) return 3;
  if (/COLUMN|MULLION|POST|STUB|DROPPER$/.test(n)) return 1;
  return 2;
};

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const CASE = CASES[params.get('case')] ? params.get('case') : 'warehouse';
const stage = $('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
stage.prepend(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xeef1f4);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1e6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.autoRotateSpeed = 0.7;
scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.5); camera.add(sun); sun.position.set(0.4, 1, 0.6); scene.add(camera);
function resize() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(stage); resize();

const S = { geom: null, playing: false };
const DUR = [2.2, 3.2, 3.6, 2.6, 4.2, 3.6, 4.0, 2.6];          // seconds per stage
const T0 = []; { let a = 0; for (const d of DUR) { T0.push(a); a += d; } S.total = a; }
S.t = 0;
const tick = () => new Promise((r) => setTimeout(r, 30));
function setLoad(text, frac) { $('loadText').textContent = text; $('loadBar').style.width = Math.round(frac * 100) + '%'; }

async function load() {
  setLoad('Downloading the model…', 0.03);
  const res = await fetch('models/' + CASES[CASE].file); if (!res.ok) throw new Error('download failed (' + res.status + ')');
  const total = +res.headers.get('content-length') || 0; let buf;
  if (res.body && total) {
    const rd = res.body.getReader(), parts = []; let got = 0;
    for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; setLoad('Downloading the model… ' + (got / 1e6).toFixed(1) + ' MB', 0.03 + 0.3 * got / total); }
    buf = new Uint8Array(got); let o = 0; for (const p of parts) { buf.set(p, o); o += p.length; }
  } else buf = new Uint8Array(await res.arrayBuffer());
  setLoad('Building the 3D geometry…', 0.4); await tick();
  const api = new WEBIFC.IfcAPI(); api.SetWasmPath(new URL('./', location.href).href, true); await api.Init(undefined, true);
  const id = api.OpenModel(buf, { COORDINATE_TO_ORIGIN: true });
  const cache = new Map(), inst = []; let nv = 0, ni = 0;
  api.StreamAllMeshes(id, (mesh) => {
    const pgs = mesh.geometries, parts = [];
    for (let k = 0; k < pgs.size(); k++) {
      const pg = pgs.get(k); let g = cache.get(pg.geometryExpressID);
      if (!g) { const geo = api.GetGeometry(id, pg.geometryExpressID); g = { v: api.GetVertexArray(geo.GetVertexData(), geo.GetVertexDataSize()).slice(), i: api.GetIndexArray(geo.GetIndexData(), geo.GetIndexDataSize()).slice() }; if (geo.delete) geo.delete(); cache.set(pg.geometryExpressID, g); }
      parts.push({ g, m: Array.from(pg.flatTransformation) }); nv += g.v.length / 6; ni += g.i.length;
    }
    if (parts.length) inst.push({ eid: mesh.expressID, parts });
  });
  setLoad('Sorting the members into build stages…', 0.75); await tick();
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Uint8Array(nv * 3);
  const el = []; let vo = 0; const box = new THREE.Box3(), p = new THREE.Vector3();
  for (const it of inst) {
    const line = api.GetLine(id, it.eid); const type = api.GetNameFromTypeCode(api.GetLineType(id, it.eid)) || '';
    const st = stageOf(type, line && line.Name ? line.Name.value : '');
    const c = new THREE.Color(STAGES[st].col); const cr = Math.round(c.r * 255), cg = Math.round(c.g * 255), cb = Math.round(c.b * 255);
    const tris = []; let cx = 0, cy = 0, cz = 0, n = 0, ymin = Infinity;
    for (const { g, m } of it.parts) {
      const base = vo, src = g.v, cnt = src.length / 6;
      for (let q = 0; q < cnt; q++) {
        const s = q * 6, x = src[s], y = src[s + 1], z = src[s + 2], nx = src[s + 3], ny = src[s + 4], nz = src[s + 5];
        const X = m[0] * x + m[4] * y + m[8] * z + m[12], Y = m[1] * x + m[5] * y + m[9] * z + m[13], Z = m[2] * x + m[6] * y + m[10] * z + m[14];
        const d = vo * 3; pos[d] = X; pos[d + 1] = Y; pos[d + 2] = Z;
        nor[d] = m[0] * nx + m[4] * ny + m[8] * nz; nor[d + 1] = m[1] * nx + m[5] * ny + m[9] * nz; nor[d + 2] = m[2] * nx + m[6] * ny + m[10] * nz;
        col[d] = cr; col[d + 1] = cg; col[d + 2] = cb; cx += X; cy += Y; cz += Z; n++; if (Y < ymin) ymin = Y;
        box.expandByPoint(p.set(X, Y, Z)); vo++;
      }
      for (const k of g.i) tris.push(k + base);
    }
    if (n) el.push({ st, tris, c: [cx / n, cy / n, cz / n], ymin });
  }
  // sweep bay by bay along the long plan axis, bottom up inside each bay
  const size = box.getSize(new THREE.Vector3()); const ax = size.x >= size.z ? 0 : 2; const bay = Math.max(size.x, size.z) / 40;
  el.sort((a, b) => a.st - b.st || Math.floor(a.c[ax] / bay) - Math.floor(b.c[ax] / bay) || a.ymin - b.ymin);
  const idx = new Uint32Array(ni); let io = 0;
  S.ends = []; S.counts = STAGES.map(() => 0); S.first = STAGES.map(() => -1); S.last = STAGES.map(() => -1);
  el.forEach((e, k) => { for (const q of e.tris) idx[io++] = q; S.ends.push(io); S.counts[e.st]++; if (S.first[e.st] < 0) S.first[e.st] = k; S.last[e.st] = k; });
  S.n = el.length;
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geom.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(col, 3, true)); geom.setIndex(new THREE.BufferAttribute(idx, 1));
  geom.setDrawRange(0, 0); geom.boundingBox = box.clone(); geom.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
  S.geom = geom; scene.add(new THREE.Mesh(geom, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));
  buildGrid(el, box); api.CloseModel(id);
  const sph = box.getBoundingSphere(new THREE.Sphere()); const dir = new THREE.Vector3(1, 0.7, 1.3).normalize();
  const vf = THREE.MathUtils.degToRad(camera.fov) / 2, hf = Math.atan(Math.tan(vf) * camera.aspect);
  const dist = sph.radius / Math.sin(Math.min(vf, hf)) * 1.0;
  camera.near = sph.radius / 500; camera.far = sph.radius * 40; camera.updateProjectionMatrix();
  controls.target.copy(sph.center); camera.position.copy(sph.center).addScaledVector(dir, dist); controls.update();
  renderStages(); $('overlay').classList.add('hide');
  $('stats').textContent = CASES[CASE].label + ' · ' + S.n.toLocaleString('en-AU') + ' members from the delivered tender model';
  play();
}

// grid lines from the column positions (clusters of 2+ columns), drawn on the lowest level
function buildGrid(el, box) {
  const cols = el.filter((e) => e.st === 1); const size = box.getSize(new THREE.Vector3()); const L = Math.max(size.x, size.z), tol = L / 150;
  const lines = (k) => { const v = cols.map((e) => e.c[k]).sort((a, b) => a - b), out = []; let grp = [];
    const flush = () => { if (grp.length >= 2) out.push(grp.reduce((a, b) => a + b) / grp.length); grp = []; };
    for (const x of v) { if (grp.length && x - grp[grp.length - 1] > tol) flush(); grp.push(x); } flush(); return out; };
  const y = box.min.y, pad = L * 0.04, pts = [];
  for (const x of lines(0)) pts.push(x, y, box.min.z - pad, x, y, box.max.z + pad);
  for (const z of lines(2)) pts.push(box.min.x - pad, y, z, box.max.x + pad, y, z);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  S.grid = new THREE.LineSegments(g, new THREE.LineDashedMaterial({ color: 0xc0392b, dashSize: tol * 1.2, gapSize: tol * 0.6, transparent: true, opacity: 0 }));
  S.grid.computeLineDistances(); scene.add(S.grid);
  S.floor = new THREE.Mesh(new THREE.PlaneGeometry(size.x + pad * 4, size.z + pad * 4), new THREE.MeshBasicMaterial({ color: 0xd5dde4, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  S.floor.rotation.x = -Math.PI / 2; S.floor.position.set((box.min.x + box.max.x) / 2, y - tol * 0.05, (box.min.z + box.max.z) / 2); scene.add(S.floor);
}

function renderStages() {
  $('stages').innerHTML = STAGES.map((s, i) => `<li data-i="${i}"><span class="sw" style="background:${s.col}"></span><b>${s.name}</b><em>${i > 0 && i < 7 ? S.counts[i].toLocaleString('en-AU') : ''}</em></li>`).join('');
  $('stages').querySelectorAll('li').forEach((li) => li.addEventListener('click', () => { S.t = T0[+li.dataset.i]; play(); }));
}
function stageAt(t) { let i = 0; while (i + 1 < T0.length && t >= T0[i + 1]) i++; return i; }
let lastSi = -1;
function apply() {
  const t = S.t, si = stageAt(t), f = Math.min(1, (t - T0[si]) / DUR[si]);
  let shown = 0;
  for (let i = 1; i < 7; i++) {
    if (S.first[i] < 0) continue;
    if (i < si) shown = S.last[i] + 1;
    else if (i === si) shown = S.first[i] + Math.round((S.last[i] - S.first[i] + 1) * (1 - Math.pow(1 - f, 1.6)));
  }
  if (si >= 7) shown = S.n;
  S.geom.setDrawRange(0, shown ? S.ends[shown - 1] : 0);
  const ga = si === 0 ? f : 1; S.grid.material.opacity = si === 0 ? 0.9 * f : Math.max(0.3, 0.9 - 0.6 * Math.min(1, (t - T0[1]) / 2)); S.floor.material.opacity = 0.5 * ga;
  if (si !== lastSi) {
    lastSi = si; const s = STAGES[si];
    $('stages').querySelectorAll('li').forEach((li, i) => { li.className = i < si ? 'done' : i === si ? 'on' : ''; });
    $('capStep').textContent = 'Step ' + (si + 1) + ' of ' + STAGES.length; $('capName').textContent = s.name;
    $('capAi').textContent = s.ai; $('capMe').textContent = s.me;
  }
  $('prog').style.width = (100 * t / S.total) + '%';
  $('count').textContent = shown.toLocaleString('en-AU') + ' / ' + S.n.toLocaleString('en-AU') + ' members';
}
function play() { if (S.t >= S.total) S.t = 0; S.playing = true; $('play').textContent = 'Pause'; controls.autoRotate = true; }
$('play').addEventListener('click', () => { if (S.playing) { S.playing = false; $('play').textContent = 'Play'; controls.autoRotate = false; } else play(); });
$('replay').addEventListener('click', () => { S.t = 0; play(); });
document.querySelectorAll('[data-case]').forEach((a) => { if (a.dataset.case === CASE) a.classList.add('cur'); a.href = '?case=' + a.dataset.case + (params.get('embed') ? '&embed=1' : ''); });
if (params.get('embed')) document.body.classList.add('embed');
$('open').href = 'index.html?case=' + CASE;
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (S.geom) { if (S.playing) { S.t = Math.min(S.total, S.t + dt); if (S.t >= S.total) { S.playing = false; $('play').textContent = 'Replay'; } } apply(); }
  controls.update(); renderer.render(scene, camera);
}
requestAnimationFrame(loop);
load().catch((e) => { console.error(e); setLoad('Could not open the model: ' + (e && e.message || e), 0); });
