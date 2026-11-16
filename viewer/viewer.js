// RapidSteel MTO - browser IFC viewer (three.js + web-ifc from the CDN, no build step).
// Geometry: every element is merged into ONE BufferGeometry (per-element vertex / index ranges kept),
// so 12k+ members draw in a single call. Picking renders element ids to a 1x1 target (GPU picking).
// Properties: every IfcRelDefinesByProperties is read once after load into a map by expressID.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as WEBIFC from 'web-ifc';

const WEBIFC_VERSION = '0.0.74';
const DEFAULT_MODEL = 'models/' + ((window.RS_QUERIES && window.RS_QUERIES.model) || 'plant_MODEL.ifc');   // per case (queries-<case>.js)
const PREVIEW = !!(window.RS_QUERIES && window.RS_QUERIES.preview);      // preview case: the model and the queries only - no weights, lengths, BOM or downloads
const STATUS = {
  CONFIRMED:   { label: 'Confirmed',   color: '#4d8cd9' },
  ASSUMED:     { label: 'Assumed',     color: '#e8891c' },
  PROVISIONAL: { label: 'Provisional', color: '#999999' },
};
const NO_STATUS = { label: 'No status', color: '#d5dbe1' };
const TYPE_COLOURS = { IFCBEAM: '#8796a6', IFCCOLUMN: '#6e7f91', IFCMEMBER: '#9aa7b4', IFCPLATE: '#aab4be' };
const OTHER_COLOUR = '#b4bcc4';
const HIGHLIGHT = '#d6246e';

const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtT = (kg) => (kg / 1000).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' t';
const fmtKg = (kg) => kg.toLocaleString('en-AU', { maximumFractionDigits: 1 }) + ' kg';
const fmtN = (n) => n.toLocaleString('en-AU');
const sleep = () => new Promise((r) => setTimeout(r, 0));

// ---------- three.js scene ----------
const stage = $('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
stage.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeef1f4);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1e6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.zoomToCursor = true;
scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
camera.add(sun); sun.position.set(0.4, 1, 0.6); scene.add(camera);

const mats = {
  solid: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  ghost: new THREE.MeshLambertMaterial({ color: 0xc3ccd5, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide }),
  focus: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  hi: new THREE.MeshLambertMaterial({ color: HIGHLIGHT, emissive: 0x3a0018, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  pick: new THREE.ShaderMaterial({
    vertexShader: 'attribute vec3 pid; varying vec3 vPid; void main(){ vPid = pid; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vPid; void main(){ gl_FragColor = vec4(vPid,1.0); }',
    side: THREE.DoubleSide,
  }),
};
let needsRender = true;
const requestRender = () => { needsRender = true; };
controls.addEventListener('change', requestRender);
function loop() { requestAnimationFrame(loop); if (needsRender) { needsRender = false; renderer.render(scene, camera); } }
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix(); requestRender();
}
new ResizeObserver(resize).observe(stage);
loop();

// ---------- model state ----------
let ifcAPI = null;
const M = {
  modelID: -1, name: '', geom: null, mesh: null, focusMesh: null, hiMesh: null,
  el: [],            // [{eid, type, v0, vn, i0, in, box:[6]}]
  byEid: new Map(),  // expressID -> element index
  props: new Map(),  // expressID -> {pset name: {prop: value}}
  rs: [],            // element index -> RapidSteel pset (or null)
  material: new Map(),
  colourMode: 'type',
  selection: new Set(), selSource: 'click', isolate: null, activeQuery: null,
  queries: [], bbox: null, multi: false,
};

function setLoad(title, text, frac) {
  $('overlay').classList.remove('hide');
  if (title) $('ldTitle').textContent = title;
  if (text != null) $('ldText').textContent = text;
  if (frac != null) $('ldBar').style.width = Math.round(frac * 100) + '%';
}

async function initIfc() {
  if (ifcAPI) return;
  ifcAPI = new WEBIFC.IfcAPI();
  ifcAPI.SetWasmPath(new URL("./", location.href).href, true);   // web-ifc.wasm ships next to this page (CDN runtime fetches are blocked on hosted pages)
  await ifcAPI.Init(undefined, true); // single thread: works on plain static hosting (no COOP/COEP headers)
}

function disposeModel() {
  for (const k of ['mesh', 'focusMesh', 'hiMesh']) if (M[k]) { scene.remove(M[k]); if (k !== 'mesh') M[k].geometry.dispose(); M[k] = null; }
  if (M.geom) { M.geom.dispose(); M.geom = null; }
  if (M.modelID >= 0) { ifcAPI.CloseModel(M.modelID); M.modelID = -1; }
  Object.assign(M, { el: [], byEid: new Map(), props: new Map(), rs: [], material: new Map(), selection: new Set(), isolate: null, activeQuery: null, queries: [] });
}

async function loadBuffer(buf, name) {
  const t0 = performance.now(); const T = { };
  setLoad('Loading ' + name, 'Starting the IFC engine…', 0.05); await sleep();
  await initIfc();
  disposeModel();
  M.name = name; $('fileName').textContent = name;
  setLoad(null, 'Reading the IFC file…', 0.15); await sleep();
  let t = performance.now();
  M.modelID = ifcAPI.OpenModel(new Uint8Array(buf), { COORDINATE_TO_ORIGIN: true });
  T.open = performance.now() - t;

  setLoad(null, 'Building 3D geometry…', 0.3); await sleep();
  t = performance.now();
  buildGeometry();
  T.geometry = performance.now() - t;

  setLoad(null, 'Reading member properties…', 0.8); await sleep();
  t = performance.now();
  readProperties();
  T.properties = performance.now() - t;

  buildQueries();
  applyColours();
  fitTo(null, true);
  renderTonnage(); renderQueries(); renderElement();
  updateButtons();
  T.total = performance.now() - t0; T.sincePageOpen = performance.now();
  const verts = M.geom.attributes.position.count, tris = M.geom.index.count / 3;
  $('stats').textContent = `${fmtN(M.el.length)} members · ${fmtN(Math.round(tris))} triangles · loaded in ${(T.total / 1000).toFixed(1)} s`;
  console.info('[RapidSteel viewer] load timings ms', Object.fromEntries(Object.entries(T).map(([k, v]) => [k, Math.round(v)])), { elements: M.el.length, verts, tris });
  window.__rsViewer = { M, T, verts, tris, camera, THREE }; // debug / test handle
  $('overlay').classList.add('hide');
  requestRender();
}

function buildGeometry() {
  const api = ifcAPI, id = M.modelID;
  const cache = new Map(); // geometryExpressID -> {v: Float32Array (xyz nxnynz), i: Uint32Array}
  const inst = []; let nv = 0, ni = 0;
  api.StreamAllMeshes(id, (mesh) => {
    const pgs = mesh.geometries; const n = pgs.size();
    const parts = [];
    for (let k = 0; k < n; k++) {
      const pg = pgs.get(k);
      let g = cache.get(pg.geometryExpressID);
      if (!g) {
        const geo = api.GetGeometry(id, pg.geometryExpressID);
        g = { v: api.GetVertexArray(geo.GetVertexData(), geo.GetVertexDataSize()).slice(), i: api.GetIndexArray(geo.GetIndexData(), geo.GetIndexDataSize()).slice() };
        if (geo.delete) geo.delete();
        cache.set(pg.geometryExpressID, g);
      }
      parts.push({ g, m: Array.from(pg.flatTransformation) });
      nv += g.v.length / 6; ni += g.i.length;
    }
    if (parts.length) inst.push({ eid: mesh.expressID, parts });
  });
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), pid = new Uint8Array(nv * 3), col = new Uint8Array(nv * 3), idx = new Uint32Array(ni);
  let vo = 0, io = 0; const box = new THREE.Box3();
  inst.forEach((it, ei) => {
    const v0 = vo, i0 = io; const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    const code = ei + 1, r = code & 255, gch = (code >> 8) & 255, bch = (code >> 16) & 255;
    for (const { g, m } of it.parts) {
      const base = vo, src = g.v, cnt = src.length / 6;
      for (let q = 0; q < cnt; q++) {
        const s = q * 6, x = src[s], y = src[s + 1], z = src[s + 2], nx = src[s + 3], ny = src[s + 4], nz = src[s + 5];
        const X = m[0] * x + m[4] * y + m[8] * z + m[12], Y = m[1] * x + m[5] * y + m[9] * z + m[13], Z = m[2] * x + m[6] * y + m[10] * z + m[14];
        const d = vo * 3; pos[d] = X; pos[d + 1] = Y; pos[d + 2] = Z;
        nor[d] = m[0] * nx + m[4] * ny + m[8] * nz; nor[d + 1] = m[1] * nx + m[5] * ny + m[9] * nz; nor[d + 2] = m[2] * nx + m[6] * ny + m[10] * nz;
        pid[d] = r; pid[d + 1] = gch; pid[d + 2] = bch;
        if (X < b[0]) b[0] = X; if (Y < b[1]) b[1] = Y; if (Z < b[2]) b[2] = Z; if (X > b[3]) b[3] = X; if (Y > b[4]) b[4] = Y; if (Z > b[5]) b[5] = Z;
        vo++;
      }
      const gi = g.i; for (let q = 0; q < gi.length; q++) idx[io++] = gi[q] + base;
    }
    M.el.push({ eid: it.eid, type: '', v0, vn: vo - v0, i0, in: io - i0, box: b });
    M.byEid.set(it.eid, ei);
    if (b[0] <= b[3]) { box.expandByPoint(new THREE.Vector3(b[0], b[1], b[2])); box.expandByPoint(new THREE.Vector3(b[3], b[4], b[5])); }
  });
  for (const e of M.el) e.type = api.GetNameFromTypeCode(api.GetLineType(id, e.eid)) || '';
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geom.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
  geom.setAttribute('pid', new THREE.BufferAttribute(pid, 3, true));
  geom.setIndex(new THREE.BufferAttribute(idx, 1));
  geom.boundingBox = box.clone(); geom.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
  M.geom = geom; M.bbox = box;
  M.mesh = new THREE.Mesh(geom, mats.solid); scene.add(M.mesh);
}

// Read every property set once: IfcRelDefinesByProperties -> pset -> single values.
function readProperties() {
  const api = ifcAPI, id = M.modelID;
  const valCache = new Map(), psetCache = new Map();
  const value = (pid) => {
    if (valCache.has(pid)) return valCache.get(pid);
    const p = api.GetLine(id, pid); let out = null;
    if (p && p.Name) {
      const nv = p.NominalValue; out = [p.Name.value, nv && nv.value !== undefined ? nv.value : (nv ?? '')];
    }
    valCache.set(pid, out); return out;
  };
  const pset = (psid) => {
    if (psetCache.has(psid)) return psetCache.get(psid);
    const ps = api.GetLine(id, psid); let out = null;
    if (ps && ps.HasProperties) {
      const o = {}; for (const h of ps.HasProperties) { const v = value(h.value); if (v) o[v[0]] = v[1]; }
      out = { name: ps.Name ? ps.Name.value : 'Properties', props: o };
    } else if (ps && ps.Quantities) {
      const o = {};
      for (const h of ps.Quantities) {
        const q = api.GetLine(id, h.value); if (!q || !q.Name) continue;
        const k = Object.keys(q).find((key) => /Value$/.test(key) && q[key] && q[key].value !== undefined);
        if (k) o[q.Name.value] = q[k].value;
      }
      out = { name: ps.Name ? ps.Name.value : 'Quantities', props: o };
    }
    psetCache.set(psid, out); return out;
  };
  const rels = api.GetLineIDsWithType(id, WEBIFC.IFCRELDEFINESBYPROPERTIES);
  for (let k = 0; k < rels.size(); k++) {
    const rel = api.GetLine(id, rels.get(k));
    const ps = rel && rel.RelatingPropertyDefinition ? pset(rel.RelatingPropertyDefinition.value) : null;
    if (!ps) continue;
    for (const o of rel.RelatedObjects || []) {
      let m = M.props.get(o.value); if (!m) { m = {}; M.props.set(o.value, m); }
      m[ps.name] = ps.props;
    }
  }
  const mrels = api.GetLineIDsWithType(id, WEBIFC.IFCRELASSOCIATESMATERIAL);
  for (let k = 0; k < mrels.size(); k++) {
    const rel = api.GetLine(id, mrels.get(k)); if (!rel || !rel.RelatingMaterial) continue;
    const mat = api.GetLine(id, rel.RelatingMaterial.value);
    const nm = mat && mat.Name ? mat.Name.value : '';
    if (nm) for (const o of rel.RelatedObjects || []) M.material.set(o.value, nm);
  }
  M.rs = M.el.map((e) => { const p = M.props.get(e.eid); return p && p.RapidSteel ? p.RapidSteel : null; });
}

// ---------- colours ----------
const rgb = (hex) => { const c = new THREE.Color(hex); return [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255)]; };
function statusOf(i) { const r = M.rs[i]; const s = r && String(r.Status || '').toUpperCase(); return STATUS[s] ? s : null; }
function applyColours() {
  const col = M.geom.attributes.color.array;
  const typeCache = {};
  M.el.forEach((e, i) => {
    let c;
    if (M.colourMode === 'status') { const s = statusOf(i); c = rgb(s ? STATUS[s].color : NO_STATUS.color); }
    else c = typeCache[e.type] || (typeCache[e.type] = rgb(TYPE_COLOURS[e.type] || OTHER_COLOUR));
    for (let v = e.v0 * 3, end = (e.v0 + e.vn) * 3; v < end; v += 3) { col[v] = c[0]; col[v + 1] = c[1]; col[v + 2] = c[2]; }
  });
  M.geom.attributes.color.needsUpdate = true;
  if (M.isolate) rebuildFocus();
  renderLegend(); updateButtons(); requestRender();
}
function renderLegend() {
  const lg = $('legend');
  if (M.colourMode !== 'status') { lg.classList.remove('show'); return; }
  const t = totals([...M.el.keys()]);
  const rows = Object.entries(STATUS).map(([k, s]) => `<div><span class="sw" style="background:${s.color}"></span>${s.label}: ${fmtN(t.by[k].n)}${PREVIEW ? '' : ' · ' + fmtT(t.by[k].kg)}</div>`);
  if (t.none.n) rows.push(`<div><span class="sw" style="background:${NO_STATUS.color}"></span>${NO_STATUS.label}: ${fmtN(t.none.n)}</div>`);
  lg.innerHTML = rows.join(''); lg.classList.add('show');
}

// ---------- sub-geometry for focus (isolate) and highlight ----------
function subGeometry(indices, withColour) {
  let nv = 0, ni = 0; for (const i of indices) { nv += M.el[i].vn; ni += M.el[i].in; }
  const A = M.geom.attributes, pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), pid = new Uint8Array(nv * 3), idx = new Uint32Array(ni);
  const col = withColour ? new Uint8Array(nv * 3) : null; const srcIdx = M.geom.index.array;
  let vo = 0, io = 0;
  for (const i of indices) {
    const e = M.el[i], a = e.v0 * 3, b = (e.v0 + e.vn) * 3;
    pos.set(A.position.array.subarray(a, b), vo * 3); nor.set(A.normal.array.subarray(a, b), vo * 3); pid.set(A.pid.array.subarray(a, b), vo * 3);
    if (col) col.set(A.color.array.subarray(a, b), vo * 3);
    const shift = vo - e.v0; for (let q = e.i0; q < e.i0 + e.in; q++) idx[io++] = srcIdx[q] + shift;
    vo += e.vn;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('pid', new THREE.BufferAttribute(pid, 3, true)); if (col) g.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
  return g;
}
function rebuildFocus() {
  if (M.focusMesh) { scene.remove(M.focusMesh); M.focusMesh.geometry.dispose(); M.focusMesh = null; }
  if (M.isolate && M.isolate.size) { M.focusMesh = new THREE.Mesh(subGeometry(M.isolate, true), mats.focus); scene.add(M.focusMesh); }
  M.mesh.material = M.isolate ? mats.ghost : mats.solid;
  requestRender();
}
function rebuildHighlight() {
  if (M.hiMesh) { scene.remove(M.hiMesh); M.hiMesh.geometry.dispose(); M.hiMesh = null; }
  const show = M.selection.size && !(M.isolate && M.selSource === 'query');
  if (show) { M.hiMesh = new THREE.Mesh(subGeometry(M.selection, false), mats.hi); M.hiMesh.renderOrder = 2; scene.add(M.hiMesh); }
  requestRender();
}

// ---------- picking ----------
// Renders element ids into a small window around the pointer and takes the hit nearest the centre,
// so thin members (purlins, rods, bracing) are easy to hit: radius 5 CSS px for a mouse, 12 for touch.
const pickTarget = new THREE.WebGLRenderTarget(1, 1);
const pickScene = new THREE.Scene();
function pick(clientX, clientY, touch) {
  const r = renderer.domElement.getBoundingClientRect();
  const x = clientX - r.left, y = clientY - r.top; if (x < 0 || y < 0 || x > r.width || y > r.height) return -1;
  const src = M.isolate && M.focusMesh ? M.focusMesh : M.mesh; if (!src) return -1;
  const pr = renderer.getPixelRatio(), R = Math.max(1, Math.round((touch ? 12 : 5) * pr)), N = 2 * R + 1;
  if (pickTarget.width !== N) pickTarget.setSize(N, N);
  const m = new THREE.Mesh(src.geometry, mats.pick); pickScene.add(m);
  camera.setViewOffset(r.width * pr, r.height * pr, Math.round(x * pr) - R, Math.round(y * pr) - R, N, N);
  renderer.setRenderTarget(pickTarget); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(pickScene, camera);
  renderer.setRenderTarget(null); camera.clearViewOffset(); pickScene.remove(m);
  const px = new Uint8Array(N * N * 4);
  renderer.readRenderTargetPixels(pickTarget, 0, 0, N, N, px);
  requestRender();
  let best = -1, bestD = Infinity;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const o = (j * N + i) * 4, code = px[o] | (px[o + 1] << 8) | (px[o + 2] << 16);
    if (code <= 0 || code > M.el.length) continue;
    const d = (i - R) * (i - R) + (j - R) * (j - R);
    if (d < bestD) { bestD = d; best = code - 1; }
  }
  return best;
}
let down = null;
renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, b: e.button, touch: e.pointerType === 'touch' || e.pointerType === 'pen' }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!down || down.b !== 0 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 || !M.mesh) { down = null; return; }
  const touch = down.touch; down = null;
  const i = pick(e.clientX, e.clientY, touch);
  const add = e.ctrlKey || e.metaKey || e.shiftKey || M.multi;
  if (M.selSource === 'query') { M.selection = new Set(); M.selSource = 'click'; }
  if (i < 0) { if (!add) M.selection.clear(); }
  else if (add) { M.selection.has(i) ? M.selection.delete(i) : M.selection.add(i); }
  else { M.selection = new Set([i]); }
  M.lastPicked = i;
  rebuildHighlight(); renderElement(); renderTonnage(); updateButtons();
  if (i >= 0) showTab('pElement');
});

// ---------- camera ----------
function fitTo(indices, initial) {
  const box = new THREE.Box3();
  if (indices && indices.size) { for (const i of indices) { const b = M.el[i].box; if (b[0] <= b[3]) { box.expandByPoint(new THREE.Vector3(b[0], b[1], b[2])); box.expandByPoint(new THREE.Vector3(b[3], b[4], b[5])); } } }
  else box.copy(M.bbox);
  if (box.isEmpty()) return;
  const sph = box.getBoundingSphere(new THREE.Sphere()); const rad = Math.max(sph.radius, 1e-3);
  const vf = THREE.MathUtils.degToRad(camera.fov) / 2, hf = Math.atan(Math.tan(vf) * camera.aspect); const dist = rad / Math.sin(Math.min(vf, hf)) * 1.08;
  let dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
  if (initial || !isFinite(dir.x) || dir.lengthSq() === 0) dir = new THREE.Vector3(1, 0.8, 1.2).normalize();
  const modelRad = M.bbox.getBoundingSphere(new THREE.Sphere()).radius;
  camera.near = Math.max(rad / 1000, modelRad / 20000); camera.far = modelRad * 20 + dist * 4; camera.updateProjectionMatrix();
  controls.target.copy(sph.center); camera.position.copy(sph.center).addScaledVector(dir, dist); controls.update(); requestRender();
}

// ---------- queries ----------
function buildQueries() {
  const src = window.RS_QUERIES;
  const planIds = M.rs.map((r) => (r && r.PlanId ? String(r.PlanId) : ''));
  if (src && src.model && M.name.toLowerCase() === String(src.model).toLowerCase()) {
    M.queries = src.queries.map((q) => {
      const rx = (q.elements || []).map((p) => new RegExp(p));
      const els = []; planIds.forEach((pid, i) => { if (pid && rx.some((r) => r.test(pid))) els.push(i); });
      return { ...q, els };
    });
    M.querySource = 'list';
  } else {
    // Other models: group members by the RapidSteel "Query" property.
    const g = new Map();
    M.rs.forEach((r, i) => { const q = r && r.Query ? String(r.Query) : ''; if (q) { if (!g.has(q)) g.set(q, []); g.get(q).push(i); } });
    M.queries = [...g.keys()].sort().map((k) => ({ id: k, title: 'Members tagged with query ' + k, description: '', els: g.get(k) }));
    M.querySource = 'property';
  }
}
function renderQueries() {
  const p = $('pQueries');
  if (!M.queries.length) { p.innerHTML = '<h3>Engineer queries</h3><div class="empty">No queries found for this model.</div>'; return; }
  const intro = M.querySource === 'list'
    ? 'Each query lists the members it affects. Click one to isolate those members and zoom to them.'
    : 'No query list is attached to this file; queries are grouped from the Query property on each member.';
  p.innerHTML = `<h3>Engineer queries (${M.queries.length})</h3><div class="muted">${intro}</div><ul class="qlist">` + M.queries.map((q, k) => {
    const t = totals(q.els);
    return `<li data-k="${k}" class="${M.activeQuery === k ? 'on' : ''}"><div class="qh"><span class="qid">${esc(q.id)}</span><span class="qt">${esc(q.title)}</span></div>
      <div class="qmeta">${[q.type, q.status, q.sheet ? 'Sheet ' + q.sheet : ''].filter(Boolean).map(esc).join(' · ')}${q.type || q.status || q.sheet ? ' · ' : ''}${fmtN(q.els.length)} members${PREVIEW ? '' : ' · ' + fmtT(t.kg)}</div>
      <div class="qd">${esc(q.description)}${q.description ? '<br><br>' : ''}<b>${fmtN(q.els.length)} members${PREVIEW ? '' : ', ' + fmtT(t.kg)}</b>${PREVIEW ? '' : ' — ' + statusSplit(t)}</div></li>`;
  }).join('') + '</ul>';
  p.querySelectorAll('li').forEach((li) => li.addEventListener('click', () => {
    selectQuery(+li.dataset.k);
    if (M.activeQuery != null && matchMedia('(max-width: 820px)').matches) stage.scrollIntoView({ behavior: 'smooth' }); // phone: show the model
  }));
}
function selectQuery(k) {
  if (M.activeQuery === k) { showAll(); return; }
  const q = M.queries[k]; M.activeQuery = k;
  M.selection = new Set(q.els); M.selSource = 'query';
  M.isolate = new Set(q.els);
  rebuildFocus(); rebuildHighlight(); fitTo(M.isolate);
  renderQueries(); renderElement(); renderTonnage(); updateButtons();
}
function showAll() {
  M.isolate = null; M.activeQuery = null;
  if (M.selSource === 'query') { M.selection = new Set(); M.selSource = 'click'; }
  rebuildFocus(); rebuildHighlight(); renderQueries(); renderElement(); renderTonnage(); updateButtons();
}

// ---------- tonnage ----------
function totals(indices) {
  const by = {}; for (const k of Object.keys(STATUS)) by[k] = { n: 0, kg: 0 };
  const none = { n: 0, kg: 0 }; let kg = 0, n = 0, noWeight = 0;
  for (const i of indices) {
    const r = M.rs[i]; const w = r ? parseFloat(r.Weight_kg) : NaN; const s = statusOf(i);
    const ok = isFinite(w); if (!ok) noWeight++;
    const slot = s ? by[s] : none; slot.n++; if (ok) { slot.kg += w; kg += w; } n++;
  }
  return { by, none, kg, n, noWeight };
}
function statusSplit(t) { return Object.entries(STATUS).filter(([k]) => t.by[k].n).map(([k, s]) => `${s.label} ${fmtT(t.by[k].kg)}`).join(', ') || 'no status'; }
function tonTable(t) {
  const rows = Object.entries(STATUS).map(([k, s]) => {
    const pct = t.kg ? (100 * t.by[k].kg / t.kg).toFixed(1) + '%' : '–';
    return `<tr><td><span class="sw" style="background:${s.color}"></span> ${s.label}</td><td class="n">${fmtN(t.by[k].n)}</td><td class="n">${fmtT(t.by[k].kg)}</td><td class="n">${pct}</td></tr>`;
  });
  if (t.none.n) rows.push(`<tr><td><span class="sw" style="background:${NO_STATUS.color}"></span> ${NO_STATUS.label}</td><td class="n">${fmtN(t.none.n)}</td><td class="n">${fmtT(t.none.kg)}</td><td class="n"></td></tr>`);
  const bar = t.kg ? '<div class="bar">' + Object.entries(STATUS).map(([k, s]) => `<i style="width:${100 * t.by[k].kg / t.kg}%;background:${s.color}"></i>`).join('') + '</div>' : '';
  return bar + `<table class="ton"><tr><th>Status</th><th class="n">Members</th><th class="n">Weight</th><th class="n">Share</th></tr>${rows.join('')}
    <tr class="tot"><td>Total</td><td class="n">${fmtN(t.n)}</td><td class="n">${fmtT(t.kg)}</td><td class="n"></td></tr></table>` +
    (t.noWeight ? `<div class="muted">${fmtN(t.noWeight)} members have no weight in the file.</div>` : '');
}
function renderTonnage() {
  const p = $('pTonnage'); if (!M.el.length) { p.innerHTML = ''; return; }
  const all = totals([...M.el.keys()]);
  let sel = '';
  if (M.selection.size) {
    const t = totals(M.selection);
    const what = M.selSource === 'query' && M.activeQuery != null ? `Query ${esc(M.queries[M.activeQuery].id)}` : (M.selection.size === 1 ? 'Selected member' : 'Selected members');
    sel = `<div class="selbox"><div class="sect" style="margin-top:0">${what}</div><div class="big">${fmtT(t.kg)}</div><div class="muted">${fmtKg(t.kg)}</div><div class="muted">${fmtN(t.n)} member${t.n === 1 ? '' : 's'}</div>${tonTable(t)}</div>`;
  } else sel = '<div class="selbox"><div class="sect" style="margin-top:0">Selection</div><div class="muted">Nothing selected. Click a member (Ctrl-click or Multi-select to add more), or pick a query, to see its weight here.</div></div>';
  p.innerHTML = `<h3>Tonnage</h3><div class="muted">Whole model</div><div class="big">${fmtT(all.kg)}</div>${tonTable(all)}${sel}`;
}

// ---------- element panel ----------
function attr(line, k) { const v = line && line[k]; return v && v.value !== undefined ? v.value : (v ?? ''); }
function renderElement() {
  const p = $('pElement');
  if (!M.el.length) return;
  if (!M.selection.size) {
    p.innerHTML = '<div class="empty">Click any member in the model to see where it comes from: drawing sheet, reference, status and weight.<br><br>Ctrl-click (or turn on Multi-select) to add members and add up their weight.</div>';
    return;
  }
  if (M.selection.size > 1 || M.selSource === 'query') {
    const t = totals(M.selection);
    const head = M.selSource === 'query' && M.activeQuery != null ? `Query ${esc(M.queries[M.activeQuery].id)}: ${esc(M.queries[M.activeQuery].title)}` : `${fmtN(M.selection.size)} members selected`;
    const list = [...M.selection].slice(0, 200).map((i) => { const r = M.rs[i]; return `<tr><td>${esc(r ? r.PlanId : '#' + M.el[i].eid)}</td><td>${esc(r ? r.Mark : '')} ${esc(r ? r.Status : '')} · ${!PREVIEW && r && isFinite(parseFloat(r.Weight_kg)) ? fmtN(Math.round(parseFloat(r.Weight_kg))) + ' kg' : ''}</td></tr>`; }).join('');
    p.innerHTML = `<h3>${head}</h3>` + (PREVIEW ? '' : `<div class="big">${fmtT(t.kg)}</div><div class="muted">${fmtKg(t.kg)}</div><div class="muted">${statusSplit(t)}</div>`) + `
      <div class="sect">Members${M.selection.size > 200 ? ' (first 200)' : ''}</div><table class="kv">${list}</table>`;
    return;
  }
  const i = [...M.selection][0], e = M.el[i];
  const line = ifcAPI.GetLine(M.modelID, e.eid) || {};
  const r = M.rs[i] || {};
  const s = statusOf(i);
  const w = parseFloat(r.Weight_kg);
  const row = (k, v) => `<tr><td>${esc(k)}</td><td>${v === '' || v == null ? '<span class="muted">–</span>' : v}</td></tr>`;
  const qid = r.Query ? String(r.Query) : '';
  const qk = M.queries.findIndex((q) => q.id === qid);
  let html = `<h3>${esc(r.Mark || attr(line, 'Name') || e.type)}</h3><div class="muted">${esc(r.PlanId || '')}</div>`;
  if (M.rs[i]) {
    html += `<div class="sect">RapidSteel take-off</div><table class="kv">` +
      row('Status', s ? `<span class="pill" style="background:${STATUS[s].color}">${STATUS[s].label}</span>` : esc(r.Status)) +
      row('Sheet', esc(r.Sheet)) + row('Reference', esc(r.Reference)) + row('Basis', esc(r.Basis)) +
      row('Query', qid ? (qk >= 0 ? `<button class="link" data-q="${qk}">${esc(qid)}</button>` : esc(qid)) : '') +
      row('Note', esc(r.Note)) + row('Revision', esc(r.Revision)) +
      (PREVIEW ? '' : row('Weight', isFinite(w) ? `${w.toLocaleString('en-AU', { maximumFractionDigits: 2 })} kg` : '')) +
      row('Plan id', esc(r.PlanId)) + (r.Batch ? row('Batch', esc(r.Batch)) : '') + '</table>';
    const L = parseFloat(r.Length_mm), zb = parseFloat(r.Bottom_Z_mm), zt = parseFloat(r.Top_Z_mm);
    const zfmt = (z, rl) => `${z >= 0 ? '+' : '−'}${Math.abs(Math.round(z)).toLocaleString('en-AU')} mm` + (rl ? ` <span class="muted">(${esc(rl)})</span>` : '');
    if (isFinite(L) || isFinite(zb) || isFinite(zt)) {
      html += `<div class="sect">Geometry</div><table class="kv">` +
        (PREVIEW ? '' : row('Length', isFinite(L) ? `${Math.round(L).toLocaleString('en-AU')} mm` : '')) +
        row('Bottom of steel', isFinite(zb) ? zfmt(zb, r.Bottom_RL) : '') +
        row('Top of steel', isFinite(zt) ? zfmt(zt, r.Top_RL) : '') + '</table>';
    }
  } else html += '<div class="empty">This member has no RapidSteel take-off properties.</div>';
  const prof = attr(line, 'Description') || attr(line, 'ObjectType');
  html += `<div class="sect">IFC</div><table class="kv">` + row('Type', esc(e.type.replace(/^IFC/, 'Ifc').replace(/^Ifc(\w)(\w*)/, (m, a, b) => 'Ifc' + a + b.toLowerCase()))) +
    row('Name', esc(attr(line, 'Name'))) + row('Profile', esc(prof)) + row('Material', esc(M.material.get(e.eid) || '')) +
    (attr(line, 'Tag') && attr(line, 'Tag') !== M.material.get(e.eid) ? row('Tag', esc(attr(line, 'Tag'))) : '') +
    row('GlobalId', esc(attr(line, 'GlobalId'))) + '</table>';
  const other = Object.entries(M.props.get(e.eid) || {}).filter(([n]) => n !== 'RapidSteel');
  for (const [n, props] of other) html += `<div class="sect">${esc(n)}</div><table class="kv">` + Object.entries(props).map(([k, v]) => row(k, esc(v))).join('') + '</table>';
  p.innerHTML = html;
  p.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => { selectQuery(+b.dataset.q); showTab('pQueries'); }));
}

// ---------- BOM tab: the delivered bill of materials (bom-<case>.js = the workbook rows + the file to download) ----------
function renderBom() {
  const B = window.RS_BOM; if (!B || !B.rows) return;
  $('tabBom').style.display = '';
  const num = (v) => (Number.isInteger(v) ? v.toLocaleString('en-AU') : v.toLocaleString('en-AU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  let h = `<h3>${esc(B.title)}</h3><div class="muted">${esc(B.subtitle || '')}</div>` +
    `<p style="margin:12px 0 4px"><a class="btn primary" href="${esc(B.file)}" download>Download the Excel workbook</a> <button class="btn" id="bBomWide">Wider table</button></p>` +
    '<div class="bomwrap"><table class="bomt">';
  for (const r of B.rows) {
    if (r.k === 'sec' || r.k === 'txt') { h += `<tr class="${r.k}"><td colspan="${B.cols}">${esc(r.c[0])}</td></tr>`; continue; }
    h += `<tr class="${r.k || ''}">` + r.c.map((v, i) => (typeof v === 'number' ? `<td class="n">${num(v)}</td>` : `<td>${esc(v)}</td>`)).join('') + '</tr>';
  }
  $('pBom').innerHTML = h + '</table></div>';
  $('bBomWide').addEventListener('click', () => { const w = document.querySelector('main').classList.toggle('wide'); $('bBomWide').textContent = w ? 'Narrower table' : 'Wider table'; window.dispatchEvent(new Event('resize')); });
}
renderBom();
if (PREVIEW) {      // hide the quantity tabs and the downloads
  document.querySelectorAll('.tabs button[data-t="pTonnage"], .tabs button[data-t="pIfc"], .tabs button[data-t="pBom"]').forEach((b) => { b.style.display = 'none'; });
  const fn = document.getElementById('footNote'); if (fn) fn.textContent = 'Preview: 3D model and engineer queries. Quantities, weights and the bill of materials are released with the take-off.';
}
// ---------- IFC tab: the model file itself, to download and open in any IFC viewer ----------
$('pIfc').innerHTML = `<h3>3D model (IFC)</h3><div class="muted">The model shown here, as an IFC4 file. It opens in any IFC viewer or in Tekla, Revit, Navisworks and Trimble Connect. ` +
  `Every member carries its drawing sheet, status, weight, length and levels.</div>` +
  `<p style="margin:14px 0 4px"><a class="btn primary" href="${esc(DEFAULT_MODEL)}" download>Download the IFC model</a></p><div class="muted">${esc(DEFAULT_MODEL.split('/').pop())}</div>`;

// ---------- UI wiring ----------
function showTab(id) {
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === id));
  document.querySelectorAll('.pane').forEach((p) => p.classList.toggle('on', p.id === id));
}
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
function updateButtons() {
  $('bStatus').classList.toggle('on', M.colourMode === 'status');
  $('bShowAll').disabled = !M.isolate; $('bClear').disabled = !M.selection.size;
  $('bMulti').classList.toggle('on', M.multi);
}
$('bStatus').onclick = () => { M.colourMode = 'status'; applyColours(); };
$('bReset').onclick = () => { M.colourMode = 'type'; applyColours(); };
$('bFit').onclick = () => fitTo(M.selection.size ? M.selection : M.isolate);
$('bShowAll').onclick = () => { showAll(); fitTo(null); };
$('bClear').onclick = () => { if (M.selSource === 'query') showAll(); M.selection = new Set(); M.selSource = 'click'; rebuildHighlight(); renderElement(); renderTonnage(); updateButtons(); };
$('bMulti').onclick = () => { M.multi = !M.multi; updateButtons(); };
async function openFile(f) {
  if (!f) return;
  try { await loadBuffer(await f.arrayBuffer(), f.name); } catch (err) { fail(err); }
}
$('filePick').addEventListener('change', (e) => { openFile(e.target.files[0]); e.target.value = ''; });
stage.addEventListener('dragover', (e) => { e.preventDefault(); });
stage.addEventListener('drop', (e) => { e.preventDefault(); openFile(e.dataTransfer.files[0]); });
function fail(err) { console.error(err); setLoad('Could not open the model', String(err && err.message || err), 0); }

async function loadDefault() {
  let url = new URLSearchParams(location.search).get('model') || DEFAULT_MODEL;
  if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(url) || !/\.ifc$/i.test(url)) url = DEFAULT_MODEL; // same-site .ifc paths only
  const name = decodeURIComponent(url.split('/').pop());
  setLoad('Loading ' + name, 'Downloading…', 0.02);
  const res = await fetch(url); if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const total = +res.headers.get('content-length') || 0;
  let buf;
  if (res.body && total) {
    const reader = res.body.getReader(); const chunks = []; let got = 0;
    for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got += value.length; setLoad(null, `Downloading… ${(got / 1e6).toFixed(1)} of ${(total / 1e6).toFixed(1)} MB`, 0.02 + 0.1 * got / total); }
    buf = new Uint8Array(got); let o = 0; for (const c of chunks) { buf.set(c, o); o += c.length; }
  } else buf = new Uint8Array(await res.arrayBuffer());
  await loadBuffer(buf.buffer, name);
}
loadDefault().catch(fail);
