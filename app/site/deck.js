// A tiny slide engine. Slides are plain HTML fragments in git; steps reveal
// elements, drive the animated git graphs, and light up flow diagrams.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let slides = [], idx = 0, step = 0;
const maxStep = (s) => +(s.dataset.steps || 0);

// ---------- git graph ----------
const LANE_COLORS = ['#6ea8ff', '#3ddc97', '#ffb454', '#c792ea', '#ff6b6b'];
function hash(s) { let h = 5381; for (const ch of s) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0; return h.toString(16).padStart(8, '0').slice(0, 7); }

function simulate(ops) {
  const commits = [], branches = { main: null }, lanes = ['main'], remote = {};
  let head = 'main', n = 0;
  const add = (parents, lane, label, extra = {}) => {
    const c = { id: 'C' + (++n), parents, lane, label, ...extra }; c.hash = hash(c.id + parents.join() + label);
    c.x = commits.length; commits.push(c); return c;
  };
  for (const op of ops) {
    if ('c' in op) { const c = add(branches[head] ? [branches[head]] : [], lanes.indexOf(head), op.c || ''); branches[head] = c.id; }
    else if ('b' in op) { branches[op.b] = branches[head]; if (!lanes.includes(op.b)) lanes.push(op.b); head = op.b; }
    else if ('co' in op) head = op.co;
    else if ('m' in op) { const c = add([branches[head], branches[op.m]], lanes.indexOf(head), 'merge'); branches[head] = c.id; }
    else if ('push' in op) remote[head] = branches[head];
    else if ('rc' in op) { const c = add([remote[op.rc] || branches[op.rc]], lanes.indexOf(op.rc), op.label || '', { remoteOnly: true }); remote[op.rc] = c.id; }
    else if ('pull' in op) { branches[head] = remote[head]; commits.forEach((c) => { if (c.id === remote[head]) c.remoteOnly = false; }); }
    else if ('revert' in op) { const c = add([branches[head]], lanes.indexOf(head), 'revert', { revert: true }); branches[head] = c.id; }
  }
  return { commits, branches, lanes, remote, head };
}

function drawGraph(el, opsAll, st) {
  const ops = opsAll.slice(0, st + 1).flat();
  const g = simulate(ops), X = 90, Y = 62, R = 17, padL = 40, padT = 50;
  const W = padL + Math.max(g.commits.length, 4) * X + 220, H = padT + g.lanes.length * Y + 20;
  const pos = (c) => [padL + c.x * X, padT + c.lane * Y];
  const byId = Object.fromEntries(g.commits.map((c) => [c.id, c]));
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="git history">`;
  g.lanes.forEach((l, i) => svg += `<text x="4" y="${padT + i * Y + 5}" fill="var(--dim)" font-size="13">${esc(l)}</text>`);
  for (const c of g.commits) for (const p of c.parents) {
    const a = pos(byId[p]), b = pos(c), col = LANE_COLORS[c.lane % 5];
    svg += `<path d="M${a[0]} ${a[1]} C ${a[0] + 40} ${a[1]}, ${b[0] - 40} ${b[1]}, ${b[0]} ${b[1]}" stroke="${col}" stroke-width="3" fill="none" ${c.remoteOnly ? 'stroke-dasharray="6 5"' : ''}/>`;
  }
  for (const c of g.commits) {
    const [x, y] = pos(c), col = LANE_COLORS[c.lane % 5];
    svg += `<circle cx="${x}" cy="${y}" r="${R}" fill="${c.revert ? 'var(--bad)' : col}" fill-opacity="${c.remoteOnly ? .25 : 1}" stroke="${col}" stroke-width="3" ${c.remoteOnly ? 'stroke-dasharray="4 3"' : ''}/>`;
    svg += `<text x="${x}" y="${y + 36}" text-anchor="middle" fill="var(--dim)" font-size="12">${c.hash}</text>`;
    if (c.label) svg += `<text x="${x}" y="${y - 26}" text-anchor="middle" fill="var(--text)" font-size="12">${esc(c.label)}</text>`;
  }
  const tips = {};
  for (const [b, id] of Object.entries(g.branches)) if (id) (tips[id] ||= []).push({ t: b, kind: 'local' });
  for (const [b, id] of Object.entries(g.remote)) (tips[id] ||= []).push({ t: 'origin/' + b, kind: 'remote' });
  for (const [id, list] of Object.entries(tips)) {
    const [x, y] = pos(byId[id]);
    list.forEach((p, i) => {
      const w = p.t.length * 8 + 22, px = x + R + 8, py = y - 12 + i * 26 - (list.length - 1) * 13;
      const isHead = p.kind === 'local' && p.t === g.head;
      svg += `<rect x="${px}" y="${py}" width="${w}" height="22" rx="11" fill="${p.kind === 'remote' ? 'none' : 'var(--panel)'}" stroke="${isHead ? 'var(--accent)' : 'var(--line)'}" stroke-width="${isHead ? 2 : 1.5}" ${p.kind === 'remote' ? 'stroke-dasharray="4 3"' : ''}/>`;
      svg += `<text x="${px + 11}" y="${py + 15}" fill="var(--text)" font-size="12">${esc(p.t)}${isHead ? '  ← HEAD' : ''}</text>`;
    });
  }
  el.innerHTML = svg + '</svg>';
}

// ---------- live ticker (public repo only) ----------
async function loadTicker(el) {
  const repo = el.dataset.repo;
  try {
    const [cs, ps] = await Promise.all([
      fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`).then((r) => r.json()),
      fetch(`https://api.github.com/repos/${repo}/pulls?state=all&per_page=4`).then((r) => r.json()),
    ]);
    el.innerHTML = '<h3>Pull requests</h3>' + ps.map((p) =>
      `<div><span class="sha">#${p.number}</span><span>${esc(p.title)}</span><span class="st ${p.merged_at ? 'merged' : p.state}">${p.merged_at ? 'merged' : p.state}</span></div>`).join('') +
      '<h3 style="margin-top:1.2vh">Latest commits on main</h3>' + cs.map((c) =>
      `<div><span class="sha">${c.sha.slice(0, 7)}</span><span>${esc(c.commit.message.split('\n')[0])}</span><span class="st">${esc(c.commit.author.name)}</span></div>`).join('');
  } catch (e) { el.innerHTML = '<p class="hint">GitHub unreachable. Press R to retry.</p>'; }
}

// ---------- engine ----------
function render() {
  const s = slides[idx];
  slides.forEach((x, i) => x.classList.toggle('active', i === idx));
  $$('[data-show]', s).forEach((e) => e.classList.toggle('on', +e.dataset.show <= step));
  // highlight the most recently revealed item in a flow/places group
  $$('[data-cur-group]', s).forEach((grp) => {
    const items = $$('[data-show]', grp).filter((e) => +e.dataset.show <= step);
    $$('[data-show]', grp).forEach((e) => e.classList.remove('cur'));
    if (items.length) items.reduce((a, b) => (+b.dataset.show >= +a.dataset.show ? b : a)).classList.add('cur');
  });
  // data-at='{"2":"gone","3":"new"}': the class applied from that step onward
  $$('[data-at]', s).forEach((e) => {
    const m = JSON.parse(e.dataset.at), ks = Object.keys(m).map(Number).sort((a, b) => a - b);
    Object.values(m).forEach((c) => e.classList.remove(c));
    const k = ks.filter((x) => x <= step).pop();
    if (k !== undefined) e.classList.add(m[k]);
  });
  $$('.graph', s).forEach((g) => drawGraph(g, JSON.parse(g.dataset.ops), step));
  $$('.cap', s).forEach((c) => { const caps = JSON.parse(c.dataset.caps || '[]'); c.textContent = caps[Math.min(step, caps.length - 1)] || ''; });
  $$('.ticker', s).forEach((t) => { if (!t.dataset.loaded) { t.dataset.loaded = 1; loadTicker(t); } });
  $('#bar-fill').style.width = ((idx + (maxStep(s) ? step / maxStep(s) : 1)) / slides.length * 100) + '%';
  $('#where').textContent = `${idx + 1} / ${slides.length} · ${s.dataset.part || ''}`;
  try { history.replaceState(null, '', '#' + s.dataset.id); } catch (e) { /* ignore */ }
}
const go = (i, st = 0) => { idx = Math.max(0, Math.min(slides.length - 1, i)); step = st; render(); };
const next = () => (step < maxStep(slides[idx]) ? (step++, render()) : go(idx + 1));
const prev = () => (step > 0 ? (step--, render()) : idx > 0 && go(idx - 1, maxStep(slides[idx - 1])));

function overview() {
  const o = $('#overview');
  if (!o.hidden) { o.hidden = true; return; }
  o.innerHTML = '<ol>' + slides.map((s, i) => `<li data-i="${i}">${esc(($('h2', s) || {}).textContent || s.dataset.id)}</li>`).join('') + '</ol>';
  o.hidden = false;
  o.onclick = (e) => { const li = e.target.closest('li'); if (li) { o.hidden = true; go(+li.dataset.i); } };
}

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(k)) { e.preventDefault(); next(); }
  else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
  else if (k === 'Home') go(0);
  else if (k === 'End') go(slides.length - 1);
  else if (k === 'f' || k === 'F') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
  else if (k === 'n' || k === 'N') document.body.classList.toggle('notes');
  else if (k === 'o' || k === 'O') overview();
  else if (k === 'Escape') $('#overview').hidden = true;
  else if (k === 'r' || k === 'R') $$('.ticker', slides[idx]).forEach((t) => loadTicker(t));
});
let touchX = null;
document.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', (e) => { if (touchX === null) return; const d = e.changedTouches[0].clientX - touchX; if (Math.abs(d) > 50) (d < 0 ? next : prev)(); touchX = null; });

(async function init() {
  const cfg = await (await fetch('/deck.json', { cache: 'no-store' })).json();
  const parts = cfg.parts.filter((p) => p.unlocked);
  const html = await Promise.all(parts.map((p) => fetch('/' + p.file, { cache: 'no-store' }).then((r) => r.text())));
  $('#deck').innerHTML = html.join('');
  slides = $$('section.slide');
  const h = location.hash.slice(1);
  go(Math.max(0, slides.findIndex((s) => s.dataset.id === h)));
})();
