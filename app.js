(function () {
'use strict';
const B = window.BIBLE;
const NP = B.P.length;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const trunc = (s, n) => s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
const COLORS = { quote: '#2fbf94', parallel: '#4a9bf0', xref: '#9a98a0', event: '#d9962b', person: '#9a8cf5', place: '#7fc23e', curated: '#d46aa0' };
const COMMON = 200; // entities in more passages than this are "very common"
const ENT = /\[\[([pl])(\d+)\|([^\]]+)\]\]/g;

/* ======================================================= indexes */
const pPeople = [], pPlaces = [];
const personPass = B.people.map(() => []), placePass = B.places.map(() => []);
const pStart = [], pEnd = [];
B.P.forEach((p, pid) => {
  const ps = new Set(), ls = new Set();
  p[2].replace(ENT, (m, k, i) => { (k === 'p' ? ps : ls).add(+i); return m; });
  pPeople[pid] = [...ps]; pPlaces[pid] = [...ls];
  ps.forEach(i => personPass[i].push(pid)); ls.forEach(i => placePass[i].push(pid));
  const m = /(\d+):(\d+)(?:–(?:(\d+):)?(\d+))?$/.exec(p[0]);
  pStart[pid] = [+m[1], +m[2]];
  pEnd[pid] = m[4] ? [m[3] ? +m[3] : +m[1], +m[4]] : [+m[1], +m[2]];
});
const pBook = B.P.map(p => p[1]);
const pLabel = pid => B.P[pid][0];
const isNT = pid => B.books[pBook[pid]][2] === 1;
const personName = i => B.people[i][0], placeName = i => B.places[i][0];
const entName = (k, i) => k === 'p' ? personName(i) : placeName(i);
const entPass = (k, i) => k === 'p' ? personPass[i] : placePass[i];

const pEvents = Array.from({ length: NP }, () => []);
B.events.forEach((e, ei) => e[3].forEach(pid => pEvents[pid].push(ei)));
const evSucc = B.events.map(() => []);
B.events.forEach((e, ei) => e[4].forEach(pr => evSucc[pr].push(ei)));

const qOut = Array.from({ length: NP }, () => []), qIn = Array.from({ length: NP }, () => []);
B.quotes.forEach(([nt, ot]) => { qOut[nt].push(ot); qIn[ot].push(nt); });
const par = Array.from({ length: NP }, () => []);
B.parallels.forEach(([a, b, w]) => { par[a].push([b, w]); par[b].push([a, w]); });
const xr = Array.from({ length: NP }, () => new Map());
B.xref.forEach((list, pid) => list.forEach(([q, w]) => {
  xr[pid].set(q, Math.max(xr[pid].get(q) || 0, w));
  xr[q].set(pid, Math.max(xr[q].get(pid) || 0, w));
}));
const idfP = i => Math.log(NP / Math.max(1, personPass[i].length));
const idfL = i => Math.log(NP / Math.max(1, placePass[i].length));
const byBook = B.books.map(() => []);
B.P.forEach((p, pid) => byBook[pBook[pid]].push(pid));

const snipCache = {};
function snippet(pid) {
  return snipCache[pid] || (snipCache[pid] = trunc(B.P[pid][2].replace(ENT, '$3').replace(/^\d+ /gm, '').replace(/\n/g, ' ').replace(/_/g, ''), 130));
}
function sharesEvent(a, b) { return pEvents[a].some(e => pEvents[b].includes(e)); }

/* ======================================================= candidate ranking */
function gather(pid, dir, entity) {
  const c = new Map();
  const add = (q, type, w, detail) => {
    if (q === pid) return;
    let o = c.get(q);
    if (!o) { o = { pid: q, score: 0, by: {} }; c.set(q, o); }
    o.score += w;
    let b = o.by[type];
    if (!b) b = o.by[type] = { w: 0, names: [], detail };
    b.w += w;
    if (type === 'person' || type === 'place') b.names.push([detail, w]);
  };
  if (entity) {
    const type = entity.k === 'p' ? 'person' : 'place';
    const name = entName(entity.k, entity.i);
    const myP = new Set(pPeople[pid]), myL = new Set(pPlaces[pid]);
    for (const q of entPass(entity.k, entity.i)) {
      if (q === pid) continue;
      let s = 1;
      pPeople[q].forEach(i => { if (myP.has(i) && !(entity.k === 'p' && entity.i === i)) s += Math.min(idfP(i), 6) * 0.35; });
      pPlaces[q].forEach(i => { if (myL.has(i) && !(entity.k === 'l' && entity.i === i)) s += Math.min(idfL(i), 6) * 0.35; });
      const xw = xr[pid].get(q); if (xw) s += Math.min(9, 1.2 * Math.log(1 + xw));
      if (sharesEvent(pid, q)) s += 2;
      if (pBook[q] === pBook[pid]) s += 0.6;
      add(q, type, s, name);
    }
    return c;
  }
  const all = dir === 'all';
  if (all || dir === 'quote') {
    qOut[pid].forEach(q => add(q, 'quote', 6, 'src'));
    qIn[pid].forEach(q => add(q, 'quote', 6, 'cite'));
  }
  if (all || dir === 'parallel') par[pid].forEach(([q, w]) => add(q, 'parallel', 4.5 + Math.min(w, 3) * 0.2, ''));
  if (all || dir === 'xref') xr[pid].forEach((w, q) => add(q, 'xref', Math.min(9, 1.4 * Math.log(1 + w)), w));
  if (all || dir === 'event') {
    pEvents[pid].forEach(ei => {
      const e = B.events[ei], list = e[3], at = list.indexOf(pid);
      list.forEach((q, k) => add(q, 'event', Math.abs(k - at) === 1 ? 3.6 : 2.4, e[0]));
      e[4].forEach(pr => { const l = B.events[pr][3]; if (l.length) add(l[l.length - 1], 'event', 2.8, 'after: ' + B.events[pr][0]); });
      evSucc[ei].forEach(sc => { const l = B.events[sc][3]; if (l.length) add(l[0], 'event', 2.8, 'next: ' + B.events[sc][0]); });
    });
  }
  if (all || dir === 'person') pPeople[pid].forEach(i => {
    if (personPass[i].length > COMMON) return;
    const w = Math.min(idfP(i), 7) * 0.7;
    personPass[i].forEach(q => add(q, 'person', w, personName(i)));
  });
  if (all || dir === 'place') pPlaces[pid].forEach(i => {
    if (placePass[i].length > COMMON) return;
    const w = Math.min(idfL(i), 7) * 0.7;
    placePass[i].forEach(q => add(q, 'place', w, placeName(i)));
  });
  return c;
}

function finalize(o) {
  let best = null, bw = -1;
  for (const t in o.by) if (o.by[t].w > bw) { bw = o.by[t].w; best = t; }
  o.primary = best; o.types = Object.keys(o.by).sort((a, b) => o.by[b].w - o.by[a].w);
  return o;
}
function reasonText(o) {
  const d = o.by[o.primary];
  switch (o.primary) {
    case 'quote': return d.detail === 'cite' ? 'quotes this passage' : 'quoted by this passage';
    case 'parallel': return 'parallel account';
    case 'xref': return 'cross-reference';
    case 'event': return trunc(d.detail.includes(':') ? d.detail : 'same story: ' + d.detail, 34);
    default: {
      const seen = new Map();
      d.names.forEach(([n, w]) => seen.set(n, (seen.get(n) || 0) + w));
      const names = [...seen.entries()].sort((a, b) => b[1] - a[1]).map(x => x[0]);
      const head = names.slice(0, 2).join(', ');
      return (o.primary === 'person' ? 'also: ' : 'also at: ') + head + (names.length > 2 ? ` +${names.length - 2}` : '');
    }
  }
}
function scopeOk(q, cur, scope) {
  if (scope === 'any') return true;
  if (scope === 'book') return pBook[q] === pBook[cur];
  return scope === 'ot' ? !isNT(q) : isNT(q);
}
function rank(pid, st, exclude) {
  const arr = [];
  gather(pid, st.dir, st.entity).forEach(o => {
    if (exclude.has(o.pid) || !scopeOk(o.pid, pid, st.scope)) return;
    arr.push(finalize(o));
  });
  arr.sort((a, b) => b.score - a.score);
  return arr;
}
function pick(arr, n) {
  const out = [], cnt = {}, rest = [];
  for (const o of arr) {
    const b = pBook[o.pid];
    if ((cnt[b] || 0) < 2) { out.push(o); cnt[b] = (cnt[b] || 0) + 1; if (out.length >= n) return out; }
    else rest.push(o);
  }
  for (const o of rest) { if (out.length >= n) break; out.push(o); }
  return out;
}

/* ======================================================= journeys */
const KEY = 'storyJourneys.v1';
let store = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || { journeys: {}, jid: null }; } catch (e) { return { journeys: {}, jid: null }; } })();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage full or blocked */ } };
const ui = { view: 'explore', dir: 'all', entity: null, scope: 'any', more: 6, pop: null, jq: '' };
const J = () => store.journeys[store.jid];

function newJourney(pid, via) {
  const id = 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const j = { id, title: '', notes: '', tags: [], starred: false, created: Date.now(), updated: Date.now(), root: 1, cur: 1, next: 2,
    nodes: { 1: { id: 1, parent: 0, pid, via: via || { t: 'start', label: 'start' }, kids: [], ts: Date.now() } } };
  store.journeys[id] = j; store.jid = id; save();
  return j;
}
function addNode(j, parentId, pid, via) {
  const parent = j.nodes[parentId];
  const found = parent.kids.map(k => j.nodes[k]).find(n => n.pid === pid);
  if (found) return found.id;
  const id = j.next++;
  j.nodes[id] = { id, parent: parentId, pid, via, kids: [], ts: Date.now() };
  parent.kids.push(id);
  return id;
}
function advance(pid, via) {
  const j = J(); j.cur = addNode(j, j.cur, pid, via); j.updated = Date.now();
  ui.pop = null; ui.more = 6; save(); sync();
}
function advance2(p1, v1, p2, v2) {
  const j = J(); j.cur = addNode(j, j.cur, p1, v1); j.cur = addNode(j, j.cur, p2, v2); j.updated = Date.now();
  ui.pop = null; ui.more = 6; save(); sync();
}
function goto(nid, keepEntity) {
  const j = J(); j.cur = nid; j.updated = Date.now();
  if (!keepEntity) ui.entity = null;
  ui.pop = null; ui.more = 6; save(); sync();
}
function pathOf(j) {
  const out = []; let n = j.nodes[j.cur];
  while (n) { out.unshift(n); n = j.nodes[n.parent]; }
  return out;
}
function tipOf(j, nid) {
  let n = j.nodes[nid], steps = 0;
  while (n.kids.length) { n = j.nodes[n.kids.reduce((a, b) => j.nodes[a].ts >= j.nodes[b].ts ? a : b)]; steps++; }
  return { id: n.id, steps };
}
function journeyTitle(j) {
  if (j.title) return j.title;
  const r = j.nodes[j.root], c = j.nodes[j.cur];
  const rv = r.via && r.via.t === 'event' ? r.via.label.replace(/^story: /, '') : pLabel(r.pid);
  return c.id === r.id ? rv : `${rv} → ${pLabel(c.pid)}`;
}
function ago(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return m + ' min ago';
  const h = Math.round(m / 60); if (h < 24) return h + ' h ago';
  return Math.round(h / 24) + ' d ago';
}

/* ======================================================= share codes */
// A path code is plain text ("BSP1." + base64url JSON) that can be pasted into any browser.
const b64 = s => btoa(unescape(encodeURIComponent(s)));
const unb64 = s => decodeURIComponent(escape(atob(s)));
const toUrlSafe = s => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromUrlSafe = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return s; };
function shareCode() {
  const j = J(); if (!j) return '';
  const data = pathOf(j).map(n => [n.pid, n.via ? n.via.t : '', n.via ? trunc(n.via.label, 48) : '']);
  return 'BSP1.' + toUrlSafe(b64(JSON.stringify({ v: NP, p: data })));
}
// Accepts a path code, or an older share link containing #s=
function parseShared(text) {
  text = String(text || '').trim();
  let json;
  const code = /BSP1\.([A-Za-z0-9_-]+)/.exec(text);
  try {
    if (code) json = unb64(fromUrlSafe(code[1]));
    else if (text.includes('#s=')) json = unb64(decodeURIComponent(text.slice(text.indexOf('#s=') + 3).trim()));
    else return { error: 'That doesn\u2019t look like a path code. It should start with BSP1.' };
    let data = JSON.parse(json);
    if (data && !Array.isArray(data) && data.p) {
      if (data.v !== NP) return { error: 'This code was made with a different version of the data, so it can\u2019t be opened here.' };
      data = data.p;
    }
    if (!Array.isArray(data) || !data.length || data.some(d => !(d[0] >= 0 && d[0] < NP))) return { error: 'The code is damaged or incomplete. Copy it again in full.' };
    return { data };
  } catch (e) { return { error: 'The code is damaged or incomplete. Copy it again in full.' }; }
}
function importPath(data) {
  const sig = data.map(d => d[0]).join(',');
  for (const j of Object.values(store.journeys)) {
    if (pathOf(j).map(n => n.pid).join(',') === sig) { store.jid = j.id; save(); return; }
  }
  const j = newJourney(data[0][0], { t: data[0][1] || 'start', label: data[0][2] || 'start' });
  j.title = 'Shared path';
  data.slice(1).forEach(d => { j.cur = addNode(j, j.cur, d[0], { t: d[1], label: d[2] }); });
  save();
}
function loadFromHash() { // older links: still opens them
  if (!location.hash.startsWith('#s=')) return false;
  const r = parseShared(location.hash);
  if (!r.data) return false;
  importPath(r.data); return true;
}
function openShareDialog() {
  $('#overlay').classList.add('open');
  $('#picker').innerHTML = `<h2>Open a shared path</h2>
    <div style="color:var(--dim);font-size:13px">Paste a path code that someone copied with “Copy path code”. It opens as a new journey you can keep exploring.</div>
    <textarea id="sc" rows="4" placeholder="BSP1.…" spellcheck="false"></textarea>
    <div id="serr" class="warn" style="min-height:20px"></div>
    <div class="btnrow" style="margin:6px 0 0"><button class="btn primary" data-act="doimport">Open path</button><button class="btn" data-act="closeov">Cancel</button></div>`;
  $('#sc').focus();
}

/* ======================================================= rendering */
function sync() { render(); }

function renderRail() {
  const j = J();
  let h = `<h1>Follow a story</h1><p class="sub">Choose a direction at each step. Everything you do is remembered.</p>
    <div class="seg" style="margin-bottom:12px"><button class="${ui.view === 'explore' ? 'on' : ''}" data-act="view" data-v="explore">Explore</button><button class="${ui.view === 'journeys' ? 'on' : ''}" data-act="view" data-v="journeys">Journeys</button></div>
    <div class="btnrow"><button class="btn primary" data-act="new">New journey</button>
    <button class="btn" data-act="back">Back one step</button><button class="btn" data-act="share">Copy path code</button><button class="btn" data-act="openshared">Open shared path</button></div>`;
  if (j) {
    const path = pathOf(j);
    h += '<div class="sect">This path</div>';
    path.forEach((n, i) => {
      const last = i === path.length - 1, nextId = last ? null : path[i + 1].id;
      h += `<div class="step${last ? ' now lastp' : ''}" data-act="goto" data-n="${n.id}">${esc(pLabel(n.pid))}<small>${esc(n.via ? n.via.label : '')}</small></div>`;
      const others = n.kids.filter(k => k !== nextId);
      others.forEach(k => {
        const t = tipOf(j, k), tn = j.nodes[t.id], cn = j.nodes[k];
        h += `<div class="branch${last ? ' cont' : ''}" data-act="goto" data-n="${t.id}">${last ? 'Continue' : 'Other branch'}: ${esc(pLabel(cn.pid))}${t.steps ? ` … ${esc(pLabel(tn.pid))} (${t.steps + 1} steps)` : ''}</div>`;
      });
    });
  }
  const all = Object.values(store.journeys).sort((a, b) => (b.starred - a.starred) || (b.updated - a.updated));
  const q = ui.jq.trim().toLowerCase();
  const list = !q ? all : all.filter(x => (journeyTitle(x) + ' ' + Object.values(x.nodes).map(n => pLabel(n.pid) + ' ' + (n.via ? n.via.label : '')).join(' ')).toLowerCase().includes(q));
  h += `<div class="sect">Saved journeys (${all.length})</div>`;
  if (all.length > 3 || q) h += `<input class="search" id="jq" placeholder="Search your journeys" value="${esc(ui.jq)}" style="margin-bottom:8px">`;
  list.forEach(x => {
    h += `<div class="journey${x.id === store.jid ? ' on' : ''}" data-act="open" data-j="${x.id}">
      <span class="acts"><button class="${x.starred ? 'on' : ''}" title="Star" data-act="star" data-j="${x.id}">★</button>
      <button title="Rename" data-act="rename" data-j="${x.id}">✎</button><button title="Delete" data-act="del" data-j="${x.id}">✕</button></span>
      <b>${esc(trunc(journeyTitle(x), 44))}</b><small>${Object.keys(x.nodes).length} steps · ${ago(x.updated)}</small></div>`;
  });
  if (!list.length) h += `<p class="sub">${all.length ? 'No journeys match.' : 'Your journeys will appear here.'}</p>`;
  $('#rail').innerHTML = h;
  const jq = $('#jq'); if (jq) jq.oninput = e => { ui.jq = e.target.value; const pos = e.target.selectionStart; renderRail(); const n = $('#jq'); n.focus(); n.setSelectionRange(pos, pos); };
}

const DIRS = [['all', 'All links', null], ['quote', 'Quotations', 'quote'], ['parallel', 'Parallels', 'parallel'],
  ['xref', 'Cross-references', 'xref'], ['event', 'Same story', 'event'], ['person', 'Same people', 'person'], ['place', 'Same place', 'place']];

function passageHtml(pid) {
  return B.P[pid][2].split('\n').map(line => {
    const sp = line.indexOf(' ');
    const t = esc(line.slice(sp + 1)).replace(ENT, (m, k, i, w) =>
      `<span class="ent ${k}${ui.pop && ui.pop.k === k && ui.pop.i === +i ? ' sel' : ''}" data-act="ent" data-k="${k}" data-i="${i}">${w}</span>`)
      .replace(/_([^_<>]+)_/g, '<i>$1</i>');
    return `<sup>${line.slice(0, sp)}</sup>${t}`;
  }).join(' ');
}

function popHtml(pid) {
  const p = ui.pop; if (!p) return '';
  const name = entName(p.k, p.i), pass = entPass(p.k, p.i);
  const books = new Set(pass.map(x => pBook[x])).size;
  let h = `<div class="pop"><h3>${esc(name)}<span>${p.k === 'p' ? 'Person' : 'Place'}</span></h3>`;
  if (p.k === 'p') {
    const e = B.people[p.i];
    const bits = [e[1], e[2] && 'born ' + e[2], e[3] && 'died ' + e[3], e[4]].filter(Boolean);
    if (bits.length) h += `<p style="color:var(--faint);margin:3px 0">${esc(bits.join(' · '))}</p>`;
    if (e[5]) h += `<p>${esc(e[5])}</p>`;
  } else {
    const e = B.places[p.i];
    const bits = [e[1], e[5] && 'also ' + e[5]].filter(Boolean);
    if (bits.length) h += `<p style="color:var(--faint);margin:3px 0">${esc(bits.join(' · '))}</p>`;
    if (e[4]) h += `<p>${esc(e[4])}</p>`;
    if (e[2] != null) h += `<p style="margin:3px 0"><a style="color:var(--accent)" target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/?mlat=${e[2]}&mlon=${e[3]}#map=8/${e[2]}/${e[3]}">Show on a map</a> <span style="color:var(--faint)">(${e[2]}, ${e[3]})</span></p>`;
  }
  h += `<p style="margin:3px 0">In ${pass.length} passage${pass.length === 1 ? '' : 's'} across ${books} book${books === 1 ? '' : 's'}.</p>`;
  if (pass.length > COMMON) h += `<p class="warn">Very common name. Narrow it with the scope menu above, or the list will be broad. Results are ranked by how closely they connect to this passage.</p>`;
  h += `<div class="row"><button class="btn primary" data-act="follow" data-k="${p.k}" data-i="${p.i}">Follow ${esc(trunc(name, 24))}</button>
    <button class="btn" data-act="scope" data-s="book">Same book only</button><button class="btn" data-act="scope" data-s="nt">New Testament only</button>
    <button class="btn" data-act="scope" data-s="ot">Old Testament only</button><button class="btn" data-act="closepop">Close</button></div>`;
  if (p.k === 'p') {
    const e = B.people[p.i];
    const fam = [];
    if (e[6] >= 0) fam.push(['Father', [e[6]]]); if (e[7] >= 0) fam.push(['Mother', [e[7]]]);
    if (e[8].length) fam.push(['Partner', e[8]]); if (e[9].length) fam.push(['Children', e[9]]); if (e[10].length) fam.push(['Siblings', e[10]]);
    fam.forEach(([lab, ids]) => { h += `<div class="row">${lab}: ${ids.map(i => `<button class="pill p" data-act="ent" data-k="p" data-i="${i}">${esc(personName(i))}</button>`).join('')}</div>`; });
  }
  const others = [...pPeople[pid].filter(i => !(p.k === 'p' && p.i === i)).map(i => ['p', i]), ...pPlaces[pid].filter(i => !(p.k === 'l' && p.i === i)).map(i => ['l', i])];
  if (others.length) h += `<div class="row">Also in this passage: ${others.slice(0, 14).map(([k, i]) => `<button class="pill ${k}" data-act="ent" data-k="${k}" data-i="${i}">${esc(entName(k, i))}</button>`).join('')}</div>`;
  return h + '</div>';
}

let lastOpts = [];
function renderMain() {
  const j = J();
  if (!j) { $('#main').innerHTML = `<div class="card"><h2>Pick a story to start</h2><p style="color:var(--dim)">Search for a story, a passage, a person or a place.</p><button class="btn primary" data-act="new">Start</button></div>`; return; }
  const cur = j.nodes[j.cur].pid, path = pathOf(j), exclude = new Set(path.map(n => n.pid));
  const st = { dir: ui.dir, entity: ui.entity, scope: ui.scope };
  const arr = rank(cur, st, exclude), shown = pick(arr, ui.more);
  shown.forEach(o => {
    const r2 = rank(o.pid, st, new Set([...exclude, o.pid]));
    o.next = pick(r2, 2); o.further = Math.max(0, r2.length - o.next.length);
  });
  lastOpts = shown;

  let h = '<div class="bar">';
  DIRS.forEach(([k, lab, col]) => { h += `<button class="chip${!ui.entity && ui.dir === k ? ' on' : ''}" data-act="dir" data-d="${k}">${col ? `<span class="dot" style="background:${COLORS[col]}"></span>` : ''}${lab}</button>`; });
  h += `<select class="chip" id="scope" title="Limit where the next steps can come from">${[['any', 'Anywhere'], ['book', 'Same book'], ['ot', 'Old Testament'], ['nt', 'New Testament']].map(([v, l]) => `<option value="${v}"${ui.scope === v ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  if (ui.entity) h += `<button class="chip follow" data-act="unfollow" title="Stop following">Following ${esc(entName(ui.entity.k, ui.entity.i))} ✕</button>`;
  h += '</div>';

  const evs = pEvents[cur].map(ei => `<button class="evchip${ui.dir === 'event' ? ' on' : ''}" data-act="dir" data-d="event" title="Show passages from the same story">${esc(B.events[ei][0])}</button>`).join('');
  h += `<div class="card"><h2>${esc(pLabel(cur))}</h2><div class="meta"><span>${esc(B.books[pBook[cur]][0])} · King James Version</span>${evs}</div>
    <div class="ptext">${passageHtml(cur)}</div>
    <div style="font-size:12px;color:var(--faint);margin-top:6px">Underlined names and places are clickable: <span class="ent p">person</span> <span class="ent l">place</span></div>${popHtml(cur)}
    <details class="notebox"${j.nodes[j.cur].note ? ' open' : ''}><summary>${j.nodes[j.cur].note ? 'Your note on this step' : 'Add a note to this step'}</summary>
    <textarea id="stepnote" rows="3" placeholder="Why does this step matter? Notes are saved with the journey.">${esc(j.nodes[j.cur].note || '')}</textarea></details></div>`;

  h += `<div class="flowhead"><b>Where next?</b><span>${arr.length ? `showing ${shown.length} of ${arr.length}` : ''}</span></div>`;
  h += '<div class="flow" id="flow"><svg id="links"></svg>';
  h += `<div class="curnode"><b>${esc(pLabel(cur))}</b><small>you are here</small></div>`;
  if (!shown.length) h += `<div class="empty">No further links for this direction${ui.scope !== 'any' ? ' and scope' : ''}. Try <b>All links</b>, widen the scope, or go back a step.</div>`;
  shown.forEach((o, idx) => {
    const col = COLORS[o.primary];
    h += `<button class="opt" style="--c:${col}" data-act="step" data-o="${idx}" data-c="${col}"><b>${esc(pLabel(o.pid))}</b>
      <span class="why">${o.types.slice(0, 3).map(t => `<i style="background:${COLORS[t]}"></i>`).join('')}${esc(reasonText(o))}</span><span class="snip">${esc(snippet(o.pid))}</span></button>`;
    h += `<div class="stub">${o.next.length ? o.next.map((n, k) => `<button data-act="hop2" data-o="${idx}" data-k="${k}" title="${esc(reasonText(n))}">${esc(pLabel(n.pid))}</button>`).join('') + (o.further ? `<span>+${o.further} further</span>` : '') : '<span>end of this thread</span>'}</div>`;
  });
  h += '</div>';
  if (arr.length > shown.length && ui.more < 24) h += `<button class="btn more" data-act="more">Show more options</button>`;
  h += `<div class="legend" style="margin-top:14px">${[['quote', 'quotation'], ['parallel', 'parallel passage'], ['xref', 'cross-reference'], ['event', 'same story'], ['person', 'shared person'], ['place', 'shared place']].map(([k, l]) => `<span><i style="background:${COLORS[k]}"></i>${l}</span>`).join('')}</div>`;
  h += `<div class="foot">${esc(B.credits.line)}
    Links come from third-party data and are only as complete and accurate as it is. Dates and names follow those sources. See DATA_SOURCES.md.</div>`;
  $('#main').innerHTML = h;
  const sn = $('#stepnote'); if (sn) sn.oninput = e => { j.nodes[j.cur].note = e.target.value; j.updated = Date.now(); save(); };
  const sc = $('#scope'); if (sc) sc.onchange = e => { ui.scope = e.target.value; ui.more = 6; renderMain(); };
  requestAnimationFrame(drawLinks);
}

function drawLinks() {
  const flow = $('#flow'), svg = $('#links'); if (!flow || !svg) return;
  const fr = flow.getBoundingClientRect(), cn = flow.querySelector('.curnode');
  if (!cn) return;
  const cr = cn.getBoundingClientRect();
  const x0 = cr.right - fr.left, y0 = cr.top + cr.height / 2 - fr.top;
  let d = '';
  flow.querySelectorAll('.opt').forEach(o => {
    const r = o.getBoundingClientRect(), x1 = r.left - fr.left, y1 = r.top + r.height / 2 - fr.top, mx = x0 + (x1 - x0) * 0.55;
    d += `<path d="M${x0} ${y0} C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}" fill="none" stroke="${o.dataset.c}" stroke-opacity=".75" stroke-width="1.6"/>`;
    const stub = o.nextElementSibling;
    if (stub && stub.classList.contains('stub')) {
      const s = stub.getBoundingClientRect();
      d += `<line x1="${r.right - fr.left}" y1="${y1}" x2="${s.left - fr.left}" y2="${s.top + s.height / 2 - fr.top}" stroke="${o.dataset.c}" stroke-opacity=".35" stroke-dasharray="3 4" stroke-width="1.2"/>`;
    }
  });
  svg.setAttribute('viewBox', `0 0 ${fr.width} ${fr.height}`);
  svg.innerHTML = d;
}

function render() {
  renderRail();
  if (ui.view === 'journeys' && window.StoryJourneys) window.StoryJourneys.render($('#main'));
  else { ui.view = 'explore'; renderMain(); }
}

/* ======================================================= picker */
const FEATURED = ['Birth of Jesus', 'Creation of all things', 'The Great Flood', 'Exodus from Egypt', 'David Kills Goliath', 'Sermon on the Mount', 'Crucifixion and Burial', 'Resurrection and Ascension', 'Peter preaches at Pentecost', 'Saul is converted'];
const evByTitle = t => B.events.findIndex(e => e[0] === t);
function parseRef(q) {
  const m = /^\s*([1-3]?\s?[A-Za-z][A-Za-z ]*?)\s*(\d+)?(?::(\d+))?\s*$/.exec(q);
  if (!m || !m[1]) return null;
  const key = m[1].toLowerCase().replace(/\s+/g, '');
  const bi = B.books.findIndex(b => b[0].toLowerCase().replace(/\s+/g, '').startsWith(key));
  if (bi < 0 || key.length < 2) return null;
  const ch = m[2] ? +m[2] : 1, v = m[3] ? +m[3] : 1;
  const list = byBook[bi];
  let pid = list.find(p => (pStart[p][0] < ch || (pStart[p][0] === ch && pStart[p][1] <= v)) && (pEnd[p][0] > ch || (pEnd[p][0] === ch && pEnd[p][1] >= v)));
  if (pid == null) pid = list.find(p => pStart[p][0] >= ch) ?? list[list.length - 1];
  return pid;
}
function openPicker() {
  $('#overlay').classList.add('open');
  $('#picker').innerHTML = `<h2>Start a journey</h2><div style="color:var(--dim);font-size:13px">Pick a story, or search for a passage (“Luke 2”), a person or a place.</div>
    <input id="pq" placeholder="Search stories, passages, names, places" autocomplete="off"><div id="pres"></div>
    <div style="margin-top:12px;font-size:12.5px;color:var(--faint)">Have a path code from someone else? <a href="#" data-act="openshared" style="color:var(--accent)">Open a shared path</a></div>`;
  const input = $('#pq'); input.focus(); input.oninput = () => pickerResults(input.value); pickerResults('');
}
function pickerResults(q) {
  q = q.trim(); const lq = q.toLowerCase(); let h = '';
  const evItem = ei => `<button class="pitem" data-act="startev" data-e="${ei}"><span>${esc(B.events[ei][0])}</span><small>${B.events[ei][3].length} passage${B.events[ei][3].length === 1 ? '' : 's'}</small></button>`;
  if (!q) {
    h += '<div class="pgroup">Popular stories</div>' + FEATURED.map(evByTitle).filter(i => i >= 0).map(evItem).join('');
  } else {
    const ref = /\d/.test(q) || q.length > 2 ? parseRef(q) : null;
    if (ref != null) h += `<div class="pgroup">Passage</div><button class="pitem" data-act="startp" data-p="${ref}"><span>${esc(pLabel(ref))}</span><small>${esc(trunc(snippet(ref), 50))}</small></button>`;
    const evs = B.events.map((e, i) => [e[0], i]).filter(x => x[0].toLowerCase().includes(lq)).slice(0, 10);
    if (evs.length) h += '<div class="pgroup">Stories</div>' + evs.map(x => evItem(x[1])).join('');
    const ents = [];
    B.people.forEach((p, i) => { if (personPass[i].length && p[0].toLowerCase().includes(lq)) ents.push(['p', i, personPass[i].length]); });
    B.places.forEach((p, i) => { if (placePass[i].length && p[0].toLowerCase().includes(lq)) ents.push(['l', i, placePass[i].length]); });
    ents.sort((a, b) => b[2] - a[2]);
    if (ents.length) h += '<div class="pgroup">People and places</div>' + ents.slice(0, 10).map(([k, i, n]) =>
      `<button class="pitem" data-act="startent" data-k="${k}" data-i="${i}"><span>${esc(entName(k, i))} <small>${k === 'p' ? 'person' : 'place'}</small></span><small>${n} passages</small></button>`).join('');
    if (!h) h = '<p style="color:var(--dim)">Nothing found. Try a book and chapter such as “Matthew 2”, or a name such as “Bethlehem”.</p>';
  }
  $('#pres').innerHTML = h;
}
function closePicker() { $('#overlay').classList.remove('open'); }
function begin(pid, via, entity) {
  ui.view = 'explore'; newJourney(pid, via); ui.dir = 'all'; ui.scope = 'any'; ui.more = 6; ui.pop = null; ui.entity = entity || null;
  closePicker(); sync();
}

/* ======================================================= events */
document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-act]'); if (!t) { if (ev.target.id === 'overlay') closePicker(); return; }
  const a = t.dataset.act, j = J();
  switch (a) {
    case 'view': ui.view = t.dataset.v; render(); break;
    case 'new': openPicker(); break;
    case 'back': if (j && j.nodes[j.cur].parent) goto(j.nodes[j.cur].parent); break;
    case 'share': {
      const code = shareCode(), label = t.textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(
        () => { t.textContent = 'Copied'; setTimeout(() => t.textContent = label, 1400); },
        () => { prompt('Copy this path code:', code); });
      break;
    }
    case 'openshared': ev.preventDefault(); openShareDialog(); break;
    case 'closeov': closePicker(); break;
    case 'doimport': {
      const r = parseShared($('#sc').value);
      if (!r.data) { $('#serr').textContent = r.error; break; }
      importPath(r.data); ui.view = 'explore'; ui.entity = null; ui.pop = null; ui.more = 6; ui.dir = 'all'; ui.scope = 'any'; closePicker(); sync(); break;
    }
    case 'goto': goto(+t.dataset.n); break;
    case 'open': ev.stopPropagation(); store.jid = t.dataset.j; ui.view = 'explore'; ui.entity = null; ui.pop = null; ui.more = 6; save(); sync(); break;
    case 'star': ev.stopPropagation(); store.journeys[t.dataset.j].starred = !store.journeys[t.dataset.j].starred; save(); renderRail(); break;
    case 'rename': { ev.stopPropagation(); const x = store.journeys[t.dataset.j]; const n = prompt('Name this journey', journeyTitle(x)); if (n !== null) { x.title = n.trim(); save(); renderRail(); } break; }
    case 'del': { ev.stopPropagation(); const x = store.journeys[t.dataset.j]; if (confirm(`Delete “${journeyTitle(x)}”? This can't be undone.`)) { delete store.journeys[x.id]; if (store.jid === x.id) store.jid = null; save(); const rest = Object.values(store.journeys).sort((p, q) => q.updated - p.updated)[0]; if (rest) store.jid = rest.id; sync(); if (!rest) openPicker(); } break; }
    case 'dir': ui.dir = t.dataset.d; ui.entity = null; ui.more = 6; renderMain(); break;
    case 'unfollow': ui.entity = null; ui.more = 6; renderMain(); break;
    case 'scope': ui.scope = t.dataset.s; ui.more = 6; renderMain(); break;
    case 'more': ui.more = Math.min(24, ui.more + 6); renderMain(); break;
    case 'ent': ui.pop = { k: t.dataset.k, i: +t.dataset.i }; renderMain(); break;
    case 'closepop': ui.pop = null; renderMain(); break;
    case 'follow': ui.entity = { k: t.dataset.k, i: +t.dataset.i }; ui.pop = null; ui.more = 6; renderMain(); break;
    case 'step': { const o = lastOpts[+t.dataset.o]; advance(o.pid, { t: o.primary, label: reasonText(o) }); break; }
    case 'hop2': { const o = lastOpts[+t.dataset.o], n = o.next[+t.dataset.k]; advance2(o.pid, { t: o.primary, label: reasonText(o) }, n.pid, { t: n.primary, label: reasonText(n) }); break; }
    case 'startev': { const e = B.events[+t.dataset.e]; if (e[3].length) begin(e[3][0], { t: 'event', label: 'story: ' + e[0] }); break; }
    case 'startp': begin(+t.dataset.p, { t: 'start', label: 'start' }); break;
    case 'startent': { const k = t.dataset.k, i = +t.dataset.i; begin(entPass(k, i)[0], { t: 'start', label: 'start: ' + entName(k, i) }, { k, i }); break; }
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closePicker(); return; }
  if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (e.key === 'ArrowLeft' && J() && J().nodes[J().cur].parent && !$('#overlay').classList.contains('open')) goto(J().nodes[J().cur].parent, true);
});
window.addEventListener('resize', () => requestAnimationFrame(drawLinks));

/* ======================================================= boot */
window.StoryCore = { B, NP, ui, COLORS, esc, trunc, ago, store: () => store, save, J, pathOf, tipOf, journeyTitle, addNode, newJourney,
  pLabel, pBook, pPeople, pPlaces, personName, placeName, entName, personPass, placePass, pEvents, xr, snippet, gather, finalize, reasonText,
  parseRef, openPicker, openShareDialog, render, ENT, isNT };
window.__story = { B, rank, gather, advance, begin, ui, store: () => store, pathOf, pLabel, personPass, placePass, pEvents };
loadFromHash();
if (!J()) { const ids = Object.keys(store.journeys); if (ids.length) store.jid = ids[0]; }
render();
if (!J()) openPicker();
})();
