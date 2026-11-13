// Everything here is read from the live backend. Nothing about versions or
// pods is typed into the page, so it can't drift from what is running.
const pods = new Map();            // hostname -> { version, color, seen }
let nginxVersion = null, podinfoVersion = null, scan = null;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function pollBackend() {
  try {
    const r = await fetch('/api/', { cache: 'no-store', headers: { Accept: 'application/json' } });
    const j = await r.json();
    pods.set(j.hostname, { version: j.version, color: j.color, message: j.message, seen: Date.now() });
    podinfoVersion = j.version;
    const m = /nginx\/([\w.]+)/.exec(r.headers.get('server') || '');
    if (m) nginxVersion = m[1];
    $('live').className = 'live ok';
    $('live-text').textContent = 'live · served by ' + (j.hostname || '?');
  } catch (e) {
    $('live').className = 'live bad';
    $('live-text').textContent = 'backend unreachable';
  }
  renderPods();
  renderBom();
}

function renderPods() {
  const now = Date.now();
  for (const [h, p] of pods) if (now - p.seen > 20000) pods.delete(h);
  $('pods').innerHTML = [...pods.entries()].sort().map(([h, p]) => {
    const age = now - p.seen;
    const cls = age < 1800 ? 'pod fresh' : age > 6000 ? 'pod stale' : 'pod';
    return `<div class="${cls}" style="border-left-color:${esc(p.color || '#6ea8ff')}">
      <b>${esc(h)}</b><span>backend v${esc(p.version)}</span></div>`;
  }).join('') || '<span class="hint">no pods answering</span>';
}

function scanCell(name) {
  const s = scan && scan[name];
  if (!s) return '<span class="badge">not scanned yet</span>';
  const bad = s.critical + s.high;
  return `<span class="badge ${bad ? 'bad' : 'ok'}">${bad ? 'FAIL' : 'PASS'}</span> ` +
    `<span class="mono">C:${s.critical} H:${s.high} M:${s.medium}</span>`;
}

function renderBom() {
  const rows = [
    ['web tier (nginx)', nginxVersion, 'nginx'],
    ['backend (podinfo)', podinfoVersion, 'podinfo'],
  ];
  $('bom').innerHTML = rows.map(([n, v, k]) =>
    `<tr><td>${n}</td><td class="mono">${esc(v || '…')}</td><td>${scanCell(k)}</td></tr>`).join('');
}

async function pollScan() {
  try {
    const r = await fetch('/scan.json', { cache: 'no-store' });
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) scan = await r.json();
  } catch (e) { /* scanner not deployed yet */ }
  renderBom();
}

let current = null;
async function showChapter(id) {
  current = id;
  document.querySelectorAll('.chapters button').forEach((b) => b.classList.toggle('active', +b.dataset.id === id));
  const r = await fetch(`/chapter-${id}.html`, { cache: 'no-store' });
  $('lesson').innerHTML = await r.text();
}

async function loadChapters() {
  const { chapters } = await (await fetch('/chapters.json', { cache: 'no-store' })).json();
  $('chapters').innerHTML = chapters.map((c) =>
    `<button data-id="${c.id}" ${c.unlocked ? '' : 'disabled'} title="${esc(c.blurb)}">${c.unlocked ? '' : '🔒 '}${c.id}. ${esc(c.title)}</button>`).join('');
  $('chapters').onclick = (e) => { const b = e.target.closest('button'); if (b && !b.disabled) showChapter(+b.dataset.id); };
  const unlocked = chapters.filter((c) => c.unlocked);
  // Follow the lesson forward as chapters unlock, but don't yank a reader who chose one.
  if (current === null || (unlocked.length && current < unlocked[unlocked.length - 1].id && !window.__picked)) {
    showChapter(unlocked[unlocked.length - 1].id);
  }
}

pollBackend(); setInterval(pollBackend, 1500);
pollScan();    setInterval(pollScan, 10000);
loadChapters(); setInterval(loadChapters, 5000);
$('chapters').addEventListener('click', () => { window.__picked = true; });
