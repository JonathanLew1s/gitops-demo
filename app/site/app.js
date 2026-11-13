// Everything here is read from the live backend. Nothing about versions or
// pods is typed into the page, so it can't drift from what is running.
const pods = new Map();            // hostname -> { version, color, seen }
const history = [];                // last N backend requests: { ok, version, color }
const HISTORY = 80, MIX = 40;
let total = 0, failed = 0;
let nginxVersion = null, podinfoVersion = null, scan = null;
let track = 'auto';
try { track = sessionStorage.getItem('track') || 'auto'; } catch (e) { /* storage blocked */ }

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function pollBackend() {
  total++;
  try {
    const r = await fetch('/api/', { cache: 'no-store', headers: { Accept: 'application/json', 'X-Track': track } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    pods.set(j.hostname, { version: j.version, color: j.color, message: j.message, seen: Date.now() });
    podinfoVersion = j.version;
    history.push({ ok: true, version: j.version, color: j.color });
    nginxVersion = r.headers.get('x-web-version') || (/nginx\/([\w.]+)/.exec(r.headers.get('server') || '') || [])[1] || nginxVersion;
    $('live').className = 'live ok';
    $('live-text').textContent = 'live · answered by ' + j.hostname;
    $('b-version').textContent = 'backend v' + j.version;
    $('b-message').textContent = j.message || '';
    $('banner').style.borderLeftColor = j.color || '';
    document.title = 'v' + j.version + ' · The Living Lesson';
  } catch (e) {
    failed++;
    history.push({ ok: false });
    $('live').className = 'live bad';
    $('live-text').textContent = 'outage: no backend answered';
    $('b-version').textContent = 'no answer';
    $('b-message').textContent = 'Every red block below is a request that failed.';
    $('banner').style.borderLeftColor = 'var(--bad)';
  }
  if (history.length > HISTORY) history.shift();
  render();
}

function render() {
  renderPods(); renderBom();
  $('timeline').innerHTML = history.map((h) => `<i class="${h.ok ? '' : 'fail'}"></i>`).join('');
  $('s-total').textContent = total;
  $('s-fail').textContent = failed;
  $('s-up').textContent = (total ? ((total - failed) / total * 100).toFixed(1) : '100') + '%';
  const recent = history.slice(-MIX), counts = {}, colors = {};
  for (const h of recent) { const k = h.ok ? 'v' + h.version : 'failed'; counts[k] = (counts[k] || 0) + 1; colors[k] = h.ok ? h.color : 'var(--bad)'; }
  const keys = Object.keys(counts).sort();
  $('mix').innerHTML = keys.map((k) => `<div style="flex-grow:${counts[k]};background:${esc(colors[k])}"></div>`).join('');
  $('mix-legend').innerHTML = keys.map((k) =>
    `<span><i style="background:${esc(colors[k])}"></i>${esc(k)} ${Math.round(counts[k] / recent.length * 100)}%</span>`).join('');
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
  try {
    const { chapters } = await (await fetch('/chapters.json', { cache: 'no-store' })).json();
    $('chapters').innerHTML = chapters.map((c) =>
      `<button data-id="${c.id}" ${c.unlocked ? '' : 'disabled'} title="${esc(c.blurb)}">${c.unlocked ? '' : '🔒 '}${c.id}. ${esc(c.title)}</button>`).join('');
    const unlocked = chapters.filter((c) => c.unlocked);
    // Follow the lesson forward as chapters unlock, but don't yank a reader who chose one.
    if (unlocked.length && (current === null || (current < unlocked[unlocked.length - 1].id && !window.__picked))) {
      showChapter(unlocked[unlocked.length - 1].id);
    } else if (current !== null) {
      document.querySelectorAll('.chapters button').forEach((b) => b.classList.toggle('active', +b.dataset.id === current));
    }
  } catch (e) { /* mid-rollout; try again next tick */ }
}

$('chapters').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b && !b.disabled) { window.__picked = true; showChapter(+b.dataset.id); }
});
$('track').value = track;
$('track').addEventListener('change', (e) => {
  track = e.target.value;
  try { sessionStorage.setItem('track', track); } catch (err) { /* ignore */ }
  history.length = 0; pods.clear();
});

pollBackend(); setInterval(pollBackend, 1000);
pollScan();    setInterval(pollScan, 10000);
loadChapters(); setInterval(loadChapters, 5000);
