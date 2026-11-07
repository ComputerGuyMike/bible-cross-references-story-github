(function () {
'use strict';
const C = window.StoryCore;
if (!C) return;
const { B, NP, ui, esc, trunc, COLORS, ENT } = C;
const $ = s => document.querySelector(s);
const store = () => C.store();
const allJ = () => Object.values(store().journeys);
const NT_START = B.books.findIndex(b => b[2] === 1);
const TYPE_LABEL = { quote: 'quotation', parallel: 'parallel passage', xref: 'cross-reference', event: 'same story', person: 'shared person', place: 'shared place', curated: 'curated link', start: 'start' };
const col = t => COLORS[t] || '#7d8296';

const jv = { tab: 'mine', sel: null, view: 'tree', node: null, sort: 'recent', tag: '', q: '', open: null,
  guide: { text: true, ents: true, all: false }, bg: true, mergeTo: '' };

/* ===================================================== ready-made journeys */
const LIBRARY = [
  { id: 'bethlehem', title: 'Born in Bethlehem: promise and fulfilment', tags: ['Christmas', 'Prophecy', 'Gospels'],
    summary: 'Follow the promise to David and the prophets who point to Bethlehem, then the Gospel accounts that draw on them.',
    steps: [
      ['2 Samuel 7:12', 'God promises David that his descendant will have a lasting throne.'],
      ['Micah 5:2', 'A prophet names Bethlehem Ephratah as the place a ruler will come from.'],
      ['Isaiah 7:14', 'The sign of a child called Immanuel, "God with us".'],
      ['Matthew 1:18', 'Matthew 1:22–23 quotes Isaiah 7:14.'],
      ['Luke 1:26', 'The birth is announced to Mary, in language that echoes the promise to David.'],
      ['Luke 2:1', 'A decree takes Joseph and Mary to the city of David, Bethlehem.'],
      ['Matthew 2:1', 'Wise men ask where the king of the Jews is born. Matthew 2:5–6 quotes Micah 5:2.'],
      ['Hosea 11:1', '"Out of Egypt I called my son", first said about Israel.'],
      ['Matthew 2:13', 'Matthew 2:15 applies Hosea 11:1 to the family\'s time in Egypt.'],
      ['Jeremiah 31:15', 'Rachel weeping for her children.'],
      ['Matthew 2:16', 'Matthew 2:17–18 quotes Jeremiah 31:15.']] },
  { id: 'passover', title: 'From Passover to the Lamb of God', tags: ['Passover', 'Easter', 'Law', 'Gospels'],
    summary: 'The Passover lamb in Exodus, and how the New Testament writers use the image of the lamb.',
    steps: [
      ['Exodus 12:1', 'The lamb is chosen and its blood put on the doorposts.'],
      ['Exodus 12:43', 'Rules for the Passover meal, including that no bone of the lamb is to be broken.'],
      ['Isaiah 53:7', 'Like a lamb led to the slaughter.'],
      ['John 1:29', 'John the Baptist calls Jesus "the Lamb of God".'],
      ['Luke 22:7', 'Jesus shares the Passover meal with his disciples.'],
      ['John 19:31', 'John notes that Jesus\'s legs were not broken, and cites Scripture for it.'],
      ['1 Corinthians 5:6', 'Paul calls Christ "our passover".'],
      ['1 Peter 1:18', 'Redeemed with the blood of a lamb without blemish.'],
      ['Revelation 5:6', 'The Lamb appears in the heavenly scene.']] },
  { id: 'servant', title: 'The suffering servant', tags: ['Prophecy', 'Isaiah', 'Easter'],
    summary: 'Isaiah\'s servant passage and the places the New Testament quotes or echoes it.',
    steps: [
      ['Isaiah 52:13', 'The servant who will be lifted up and exalted.'],
      ['Isaiah 53:1', 'Despised, wounded for transgressions, bearing the sin of many.'],
      ['Matthew 8:16', 'Matthew 8:17 quotes Isaiah 53:4 about healing.'],
      ['Luke 22:37', 'Jesus says Isaiah 53:12, "numbered with the transgressors", must be fulfilled in him.'],
      ['John 12:37', 'John 12:38 quotes Isaiah 53:1 about unbelief.'],
      ['Acts 8:26', 'An Ethiopian official is reading Isaiah 53 and Philip explains it.'],
      ['1 Peter 2:21', 'Peter draws on Isaiah 53 to describe Christ\'s suffering.']] },
  { id: 'abraham', title: 'Abraham\'s promise', tags: ['Genesis', 'Faith', 'Letters'],
    summary: 'The promise to Abraham and how Paul and Hebrews read it.',
    steps: [
      ['Genesis 12:1', 'God calls Abram and promises blessing to all the families of the earth.'],
      ['Genesis 15:1', 'Abram believes God, and it is counted to him for righteousness.'],
      ['Genesis 22:1', 'Abraham is tested over Isaac.'],
      ['Romans 4:1', 'Paul uses Genesis 15:6 in his argument about faith.'],
      ['Galatians 3:6', 'Paul says the promise to bless the nations was announced to Abraham.'],
      ['Hebrews 11:8', 'Abraham\'s faith in leaving for a land he did not know.']] },
  { id: 'beginning', title: 'In the beginning', tags: ['Creation', 'John', 'Revelation'],
    summary: 'From the opening words of Genesis to the new heaven and new earth.',
    steps: [
      ['Genesis 1:1', 'Creation by God\'s word.'],
      ['Psalm 33:6', '"By the word of the LORD were the heavens made".'],
      ['John 1:1', 'John opens with the same words, "In the beginning".'],
      ['Colossians 1:15', 'All things created through and for Christ.'],
      ['Hebrews 11:3', 'The worlds were framed by the word of God.'],
      ['Isaiah 65:17', '"Behold, I create new heavens and a new earth".'],
      ['Revelation 21:1', 'The vision of a new heaven and a new earth.']] },
  { id: 'david', title: 'David: shepherd, king and promise', tags: ['David', 'Kingship'],
    summary: 'From the anointing in Bethlehem to the promise of a lasting throne and the later titles drawn from it.',
    steps: [
      ['1 Samuel 16:1', 'Samuel is sent to Bethlehem and anoints David, the youngest son of Jesse.'],
      ['1 Samuel 17:32', 'David volunteers to face Goliath.'],
      ['2 Samuel 5:1', 'The tribes make David king over all Israel.'],
      ['2 Samuel 7:8', 'God\'s promise of a house and a lasting throne.'],
      ['Psalm 23:1', '"The LORD is my shepherd".'],
      ['Isaiah 11:1', 'A shoot from the stem of Jesse.'],
      ['Matthew 1:1', 'The genealogy opens with "the son of David".'],
      ['Revelation 22:16', '"I am the root and the offspring of David".']] },
  { id: 'jonah', title: 'The sign of Jonah', tags: ['Prophets', 'Gospels'],
    summary: 'Jonah\'s story and how Jesus refers to it.',
    steps: [
      ['Jonah 1:1', 'Jonah runs from his commission and is swallowed by a great fish.'],
      ['Jonah 2:1', 'Jonah prays from inside the fish.'],
      ['Jonah 3:1', 'Nineveh repents at his preaching.'],
      ['Matthew 12:38', 'Jesus gives "the sign of the prophet Jonas" and speaks of three days and three nights.'],
      ['Luke 11:29', 'Luke\'s account of the sign of Jonas and the men of Nineveh.']] },
  { id: 'psalm22', title: 'Psalm 22 and the cross', tags: ['Psalms', 'Easter'],
    summary: 'A psalm of suffering and praise, and where the Gospel accounts of the crucifixion echo it.',
    steps: [
      ['Psalm 22:1', '"My God, my God, why hast thou forsaken me?"'],
      ['Matthew 27:35', 'The soldiers divide his garments and cast lots, as in Psalm 22:18.'],
      ['Matthew 27:45', 'Jesus cries out the words of Psalm 22:1.'],
      ['John 19:23', 'John also notes the division of the garments and cites Scripture.'],
      ['Hebrews 2:11', 'Hebrews 2:12 quotes Psalm 22:22.'],
      ['Psalm 22:22', 'The psalm turns to praise.']] },
  { id: 'manna', title: 'Manna and the bread of life', tags: ['Exodus', 'Gospels'],
    summary: 'The wilderness bread and the sayings about bread in Matthew, John and Paul.',
    steps: [
      ['Exodus 16:1', 'Israel is fed with manna in the wilderness.'],
      ['Deuteronomy 8:1', 'Moses recalls that "man doth not live by bread only".'],
      ['Matthew 4:1', 'Jesus answers the tempter with Deuteronomy 8:3.'],
      ['John 6:25', 'The crowd mentions the manna, and Jesus speaks of the true bread from heaven.'],
      ['John 6:47', '"I am the bread of life".'],
      ['1 Corinthians 10:1', 'Paul looks back on the wilderness generation, the cloud, the sea and the manna.']] },
  { id: 'melchizedek', title: 'Melchizedek', tags: ['Hebrews', 'Psalms'],
    summary: 'A brief figure in Genesis, one verse in a psalm, and a long argument in Hebrews.',
    steps: [
      ['Genesis 14:17', 'Melchizedek, king of Salem and priest, blesses Abram.'],
      ['Psalm 110:1', 'Verse 4: "Thou art a priest for ever after the order of Melchizedek".'],
      ['Hebrews 5:5', 'Hebrews quotes Psalm 110:4.'],
      ['Hebrews 7:1', 'Hebrews reflects on Melchizedek in detail.'],
      ['Hebrews 7:11', 'A different priesthood from Levi\'s.']] },
  { id: 'exodus', title: 'The Exodus remembered', tags: ['Exodus', 'Psalms', 'Letters'],
    summary: 'From the burning bush and the sea to the psalms, Paul, Hebrews and Revelation.',
    steps: [
      ['Exodus 3:1', 'God calls Moses from the burning bush.'],
      ['Exodus 14:21', 'The sea divides and Israel crosses.'],
      ['Psalm 114:1', 'The psalm recalls the Exodus.'],
      ['1 Corinthians 10:1', 'Paul says the fathers were baptised "unto Moses in the cloud and in the sea".'],
      ['Hebrews 11:23', 'Moses by faith: Passover and the Red Sea.'],
      ['Revelation 15:3', 'The song of Moses and the song of the Lamb.']] },
  { id: 'pentecost', title: 'Pentecost and the prophets', tags: ['Acts', 'Prophecy'],
    summary: 'Joel\'s promise of the Spirit and the Old Testament passages Peter cites in his sermon.',
    steps: [
      ['Joel 2:28', '"I will pour out my spirit upon all flesh".'],
      ['Acts 2:1', 'The day of Pentecost.'],
      ['Acts 2:14', 'Peter quotes Joel 2:28–32.'],
      ['Psalm 16:8', 'Peter applies verses 8–11 to the resurrection (Acts 2:25–28).'],
      ['Acts 2:29', 'Peter also cites Psalm 110:1 (Acts 2:34–35).']] },
  { id: 'water', title: 'Living water and new birth', tags: ['John', 'Prophets'],
    summary: 'Water and Spirit imagery from Ezekiel and Isaiah through John\'s Gospel to Revelation.',
    steps: [
      ['Ezekiel 36:25', 'Clean water and a new spirit.'],
      ['John 3:1', 'Nicodemus and being born of water and the Spirit.'],
      ['Isaiah 55:1', '"Ho, every one that thirsteth, come ye to the waters".'],
      ['John 4:7', 'The woman at the well and "living water".'],
      ['John 7:37', 'Jesus invites the thirsty on the last day of the feast.'],
      ['Revelation 22:1', 'The river of the water of life.']] },
  { id: 'law', title: 'The Law and the Sermon on the Mount', tags: ['Law', 'Gospels'],
    summary: 'The commandments Jesus cites and reworks in Matthew 5 and 22.',
    steps: [
      ['Exodus 20:1', 'The ten commandments.'],
      ['Matthew 5:17', 'Jesus says he came to fulfil the law, then deepens several commandments.'],
      ['Leviticus 19:17', 'Verse 18: love your neighbour as yourself.'],
      ['Matthew 5:38', '"An eye for an eye", and love of enemies.'],
      ['Deuteronomy 6:4', '"Hear, O Israel".'],
      ['Matthew 22:34', 'The two great commandments.']] },
];

/* ===================================================== helpers */
function relate(a, b) {
  for (const [x, y] of [[a, b], [b, a]]) {
    const o = C.gather(x, 'all', null).get(y);
    if (o) { C.finalize(o); return { t: o.primary, label: C.reasonText(o) }; }
  }
  return { t: 'curated', label: 'curated link' };
}
function resolveSteps(def) {
  return def.steps.map(([ref, note]) => ({ pid: C.parseRef(ref), note, ref }));
}
function startFromLibrary(def) {
  const steps = resolveSteps(def);
  const j = C.newJourney(steps[0].pid, { t: 'start', label: 'ready-made journey' });
  j.title = def.title; j.notes = def.summary; j.tags = def.tags.concat('Ready-made');
  j.nodes[1].note = steps[0].note;
  let prev = 1;
  for (let i = 1; i < steps.length; i++) {
    const id = j.next++;
    j.nodes[id] = { id, parent: prev, pid: steps[i].pid, via: relate(steps[i - 1].pid, steps[i].pid), kids: [], ts: Date.now() + i, note: steps[i].note };
    j.nodes[prev].kids.push(id); prev = id;
  }
  j.cur = 1; j.updated = Date.now();
  C.save(); ui.view = 'explore'; ui.entity = null; ui.pop = null; ui.dir = 'all'; ui.scope = 'any'; ui.more = 6; C.render();
}
function layoutTree(j) {
  const pos = {}; let row = 0, maxD = 0;
  (function walk(id, d) {
    const n = j.nodes[id]; maxD = Math.max(maxD, d);
    const kids = n.kids.slice().sort((a, b) => j.nodes[a].ts - j.nodes[b].ts);
    if (!kids.length) { pos[id] = { d, y: row++ }; return; }
    kids.forEach(k => walk(k, d + 1));
    const ys = kids.map(k => pos[k].y); pos[id] = { d, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
  })(j.root, 0);
  return { pos, rows: row, maxD };
}
const onPath = j => new Set(C.pathOf(j).map(n => n.id));
const countBranches = j => Object.values(j.nodes).filter(n => n.kids.length > 1).length;
const stepCount = j => Object.keys(j.nodes).length;
function plainPassage(pid) {
  return B.P[pid][2].split('\n').map(line => {
    const sp = line.indexOf(' ');
    const t = esc(line.slice(sp + 1)).replace(ENT, (m, k, i, w) => w).replace(/_([^_<>]+)_/g, '<i>$1</i>');
    return `<sup>${line.slice(0, sp)}</sup>${t}`;
  }).join(' ');
}
function mdPassage(pid) {
  return B.P[pid][2].split('\n').map(line => {
    const sp = line.indexOf(' ');
    return `**${line.slice(0, sp)}** ` + line.slice(sp + 1).replace(ENT, (m, k, i, w) => w).replace(/_([^_]+)_/g, '*$1*');
  }).join(' ');
}
const peopleOf = pid => C.pPeople[pid].map(C.personName);
const placesOf = pid => C.pPlaces[pid].map(C.placeName);
const normTag = s => s.trim().replace(/\s+/g, ' ').slice(0, 24);
function download(name, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime || 'text/plain' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'journey';
const today = () => new Date().toISOString().slice(0, 10);
function setCur(jid, nid) { store().jid = jid; const j = store().journeys[jid]; if (nid) j.cur = nid; j.updated = Date.now(); ui.entity = null; ui.pop = null; ui.more = 6; ui.view = 'explore'; C.save(); C.render(); }

/* ===================================================== journey operations */
function duplicate(j) {
  const copy = JSON.parse(JSON.stringify(j));
  copy.id = 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  copy.title = (j.title || C.journeyTitle(j)) + ' (copy)'; copy.created = copy.updated = Date.now(); copy.starred = false;
  store().journeys[copy.id] = copy; C.save(); return copy;
}
function mergeInto(srcId, dstId) {
  const s = store().journeys[srcId], d = store().journeys[dstId]; if (!s || !d || s === d) return;
  const map = {}, sroot = s.nodes[s.root];
  const same = Object.values(d.nodes).find(n => n.pid === sroot.pid);
  if (same) { map[s.root] = same.id; if (!same.note && sroot.note) same.note = sroot.note; }
  else {
    const nid = d.next++; d.nodes[nid] = { id: nid, parent: d.root, pid: sroot.pid, via: { t: 'curated', label: 'merged from: ' + trunc(C.journeyTitle(s), 30) }, kids: [], ts: Date.now(), note: sroot.note || '' };
    d.nodes[d.root].kids.push(nid); map[s.root] = nid;
  }
  (function walk(id) {
    s.nodes[id].kids.forEach(k => {
      const kn = s.nodes[k], parent = d.nodes[map[id]];
      const ex = parent.kids.map(x => d.nodes[x]).find(x => x.pid === kn.pid);
      if (ex) { map[k] = ex.id; if (!ex.note && kn.note) ex.note = kn.note; }
      else { const nid = d.next++; d.nodes[nid] = { id: nid, parent: map[id], pid: kn.pid, via: kn.via, kids: [], ts: kn.ts, note: kn.note || '' }; parent.kids.push(nid); map[k] = nid; }
      walk(k);
    });
  })(s.root);
  d.tags = [...new Set((d.tags || []).concat(s.tags || []))];
  if (s.notes && !(d.notes || '').includes(s.notes)) d.notes = ((d.notes || '') + '\n\n' + s.notes).trim();
  d.updated = Date.now(); C.save();
}
function prune(j, nid) {
  const n = j.nodes[nid]; if (!n || !n.parent) return;
  const doomed = new Set();
  (function walk(id) { doomed.add(id); j.nodes[id].kids.forEach(walk); })(nid);
  const p = j.nodes[n.parent]; p.kids = p.kids.filter(k => k !== nid);
  doomed.forEach(id => delete j.nodes[id]);
  if (doomed.has(j.cur)) j.cur = p.id;
  j.updated = Date.now(); C.save();
}
function sanitize(j) {
  if (!j || typeof j !== 'object' || !j.nodes || !j.nodes[j.root]) return null;
  for (const n of Object.values(j.nodes)) {
    if (!(n.pid >= 0 && n.pid < NP) || !Array.isArray(n.kids)) return null;
    n.kids = n.kids.filter(k => j.nodes[k]);
  }
  if (!j.nodes[j.cur]) j.cur = j.root;
  j.tags = Array.isArray(j.tags) ? j.tags.map(String).slice(0, 12) : []; j.notes = String(j.notes || '');
  j.title = String(j.title || ''); j.starred = !!j.starred; j.created = +j.created || Date.now(); j.updated = +j.updated || Date.now();
  j.next = Math.max(+j.next || 0, ...Object.keys(j.nodes).map(Number)) + 1;
  return j;
}
function importJson(text) {
  let data; try { data = JSON.parse(text); } catch (e) { return { error: 'That file is not valid JSON.' }; }
  if (!data || data.format !== 'bible-story-journeys') return { error: 'That file was not made by this tool\'s export.' };
  if (data.dataVersion !== NP) return { error: 'The file was made with a different version of the data, so it can\'t be opened here.' };
  const list = data.journeys ? Object.values(data.journeys) : (data.journey ? [data.journey] : []);
  let added = 0, skipped = 0;
  list.forEach(raw => {
    const j = sanitize(raw); if (!j) { skipped++; return; }
    if (store().journeys[j.id]) { j.id = 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); j.title = (j.title || C.journeyTitle(j)) + ' (imported)'; }
    store().journeys[j.id] = j; added++;
  });
  C.save(); return { added, skipped };
}

/* ===================================================== exporters */
function guideSteps(j) {
  const out = [];
  if (!jv.guide.all) {
    // the line through the current step: root to here, then on along the most recently used steps
    const line = C.pathOf(j); let cur = j.nodes[j.cur];
    while (cur.kids.length) { cur = j.nodes[cur.kids.reduce((a, b) => j.nodes[a].ts >= j.nodes[b].ts ? a : b)]; line.push(cur); }
    line.forEach((n2, i) => out.push({ n: n2, depth: 0, branch: false, first: i === 0 }));
    return out;
  }
  (function walk(id, depth, branch) {
    const n = j.nodes[id]; out.push({ n, depth, branch, first: id === j.root });
    n.kids.slice().sort((a, b) => j.nodes[a].ts - j.nodes[b].ts).forEach((k, i) => walk(k, depth + (i > 0 ? 1 : 0), i > 0));
  })(j.root, 0, false);
  return out;
}
function viaText(n) { return n.via && n.via.label && n.via.t !== 'start' ? n.via.label : ''; }
function markdown(j) {
  const title = j.title || C.journeyTitle(j);
  let md = `# ${title}\n\n`;
  if ((j.tags || []).length) md += `Tags: ${j.tags.join(', ')}\n\n`;
  if (j.notes) md += `${j.notes}\n\n`;
  guideSteps(j).forEach((s, i) => {
    const pid = s.n.pid;
    md += `## ${i + 1}. ${C.pLabel(pid)}\n\n`;
    if (s.branch) md += `*Branch from an earlier step.*\n\n`;
    const v = viaText(s.n); if (v) md += `*How it connects: ${v}*\n\n`;
    if (jv.guide.text) md += mdPassage(pid) + '\n\n';
    if (jv.guide.ents) {
      const pe = peopleOf(pid), pl = placesOf(pid);
      if (pe.length) md += `**People:** ${pe.join(', ')}  \n`;
      if (pl.length) md += `**Places:** ${pl.join(', ')}  \n`;
      if (pe.length || pl.length) md += '\n';
    }
    if (s.n.note) md += s.n.note.split('\n').map(l => '> ' + l).join('\n') + '\n\n';
  });
  md += `---\n${B.credits.line} Made ${today()}.\n`;
  return md;
}
function exportJson(j) {
  return JSON.stringify({ format: 'bible-story-journeys', version: 1, dataVersion: NP, exported: new Date().toISOString(), journey: j }, null, 1);
}

/* ===================================================== views: list */
function miniTree(j) {
  const { pos, rows, maxD } = layoutTree(j), path = onPath(j);
  const W = 128, H = 46, dx = (W - 12) / Math.max(1, maxD), dy = (H - 12) / Math.max(1, rows - 1);
  const xy = id => [6 + pos[id].d * dx, rows === 1 ? H / 2 : 6 + pos[id].y * dy];
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">`;
  Object.values(j.nodes).forEach(n => { if (n.parent) { const [x1, y1] = xy(n.parent), [x2, y2] = xy(n.id); s += `<path d="M${x1} ${y1}C${(x1 + x2) / 2} ${y1},${(x1 + x2) / 2} ${y2},${x2} ${y2}" fill="none" stroke="${path.has(n.id) ? '#6ea8ff' : '#444a5e'}" stroke-width="1.3"/>`; } });
  Object.values(j.nodes).forEach(n => { const [x, y] = xy(n.id); s += `<circle cx="${x}" cy="${y}" r="${n.id === j.cur ? 3.6 : 2.4}" fill="${n.id === j.cur ? '#6ea8ff' : (path.has(n.id) ? '#9db8e8' : '#666d85')}"/>`; });
  return s + '</svg>';
}
function sortFn() {
  return { recent: (a, b) => b.updated - a.updated, created: (a, b) => b.created - a.created, steps: (a, b) => stepCount(b) - stepCount(a),
    name: (a, b) => C.journeyTitle(a).localeCompare(C.journeyTitle(b)), starred: (a, b) => (b.starred - a.starred) || (b.updated - a.updated) }[jv.sort];
}
function viewList() {
  const all = allJ();
  const counts = {}; all.forEach(j => (j.tags || []).forEach(t => counts[t] = (counts[t] || 0) + 1));
  const q = jv.q.trim().toLowerCase();
  const list = all.filter(j => (!jv.tag || (j.tags || []).includes(jv.tag)) && (!q ||
    (C.journeyTitle(j) + ' ' + (j.notes || '') + ' ' + (j.tags || []).join(' ') + ' ' + Object.values(j.nodes).map(n => C.pLabel(n.pid) + ' ' + (n.note || '') + ' ' + (n.via ? n.via.label : '')).join(' ')).toLowerCase().includes(q))).sort(sortFn());
  let h = `<div class="tools"><input type="search" id="jqs" placeholder="Search titles, passages, notes and tags" value="${esc(jv.q)}">
    <select id="jsort" title="Sort">${[['recent', 'Recently used'], ['starred', 'Starred first'], ['name', 'Name'], ['steps', 'Most steps'], ['created', 'Newest']].map(([v, l]) => `<option value="${v}"${jv.sort === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
    <button class="btn primary" data-act="new">New journey</button><button class="btn" data-jv="tab" data-t="library">Browse ready-made journeys</button></div>`;
  if (Object.keys(counts).length) h += `<div class="tools" style="margin-top:-6px"><button class="tagchip${jv.tag ? '' : ' on'}" data-jv="tag" data-t="">All<small>${all.length}</small></button>${Object.keys(counts).sort().map(t => `<button class="tagchip${jv.tag === t ? ' on' : ''}" data-jv="tag" data-t="${esc(t)}">${esc(t)}<small>${counts[t]}</small></button>`).join('')}</div>`;
  if (!list.length) return h + `<div class="card"><h2>${all.length ? 'No journeys match' : 'No journeys yet'}</h2><p style="color:var(--dim)">${all.length ? 'Try a different search or tag.' : 'Start one in Explore, or pick a ready-made journey to begin with.'}</p></div>`;
  h += '<div class="jgrid">';
  list.forEach(j => {
    const first = Object.values(j.nodes).find(n => n.note);
    h += `<div class="jcard${j.id === store().jid ? ' cur' : ''}" data-jv="sel" data-j="${j.id}">
      <h3><span>${esc(trunc(C.journeyTitle(j), 52))}</span><button class="star${j.starred ? ' on' : ''}" data-jv="star" data-j="${j.id}" title="Star">★</button></h3>
      ${miniTree(j)}<div class="meta">${stepCount(j)} step${stepCount(j) === 1 ? '' : 's'}${countBranches(j) ? ` · ${countBranches(j)} fork${countBranches(j) === 1 ? '' : 's'}` : ''} · ${C.ago(j.updated)}</div>
      ${j.notes || first ? `<div class="desc">${esc(j.notes || first.note)}</div>` : ''}
      ${(j.tags || []).length ? `<div class="tags">${j.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}</div>`;
  });
  return h + '</div>';
}

/* ===================================================== views: detail */
function viewDetail(j) {
  const views = [['tree', 'Tree'], ['arcs', 'Arcs'], ['map', 'Map'], ['timeline', 'Timeline'], ['guide', 'Study guide']];
  const others = allJ().filter(x => x.id !== j.id);
  let h = `<div class="jd"><button class="crumb" data-jv="back">← All journeys</button>
    <input class="title" id="jtitle" value="${esc(j.title || C.journeyTitle(j))}" aria-label="Journey title">
    <div class="meta2">${stepCount(j)} steps · ${countBranches(j)} fork${countBranches(j) === 1 ? '' : 's'} · started ${new Date(j.created).toLocaleDateString()} · last used ${C.ago(j.updated)}</div>
    <div class="row"><button class="btn primary" data-jv="open" data-j="${j.id}">Open in Explore</button>
      <button class="star${j.starred ? ' on' : ''}" data-jv="star" data-j="${j.id}" title="Star" style="font-size:20px">★</button>
      <button class="btn" data-jv="dup">Duplicate</button>
      ${others.length ? `<span style="color:var(--faint);font-size:12.5px">Merge into</span><select id="jmerge"><option value="">choose…</option>${others.map(x => `<option value="${x.id}"${jv.mergeTo === x.id ? ' selected' : ''}>${esc(trunc(C.journeyTitle(x), 40))}</option>`).join('')}</select><button class="btn" data-jv="merge">Merge</button>` : ''}
      <button class="btn danger" data-jv="del">Delete</button></div>
    <div class="row" style="margin:4px 0"><span class="tags">${(j.tags || []).map(t => `<span class="tag">${esc(t)}<button data-jv="rmtag" data-t="${esc(t)}" aria-label="Remove tag">✕</button></span>`).join('')}</span>
      <input class="tagadd" id="jtag" placeholder="+ add tag" maxlength="24"></div>
    <textarea id="jnotes" rows="2" placeholder="What is this journey about? (optional)">${esc(j.notes || '')}</textarea>
    <div class="row" style="margin-top:14px"><div class="seg">${views.map(([v, l]) => `<button class="${jv.view === v ? 'on' : ''}" data-jv="view" data-v="${v}">${l}</button>`).join('')}</div></div>
    <div class="vbody">`;
  if (jv.view === 'tree') h += viewTree(j);
  else if (jv.view === 'arcs') h += viewArcs(j);
  else if (jv.view === 'map') h += viewMap(j);
  else if (jv.view === 'timeline') h += viewTimeline(j);
  else h += viewGuide(j);
  return h + '</div></div>';
}

function nodeBox(j, n, x, y, w, hgt, path) {
  const cur = n.id === j.cur, sel = n.id === jv.node;
  const stroke = sel ? '#ffd95a' : (cur ? '#6ea8ff' : (path.has(n.id) ? '#4d6fb0' : '#3a3e4d'));
  return `<g data-jv="node" data-n="${n.id}" style="cursor:pointer"><rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="7" fill="${cur ? '#1d2740' : '#14151b'}" stroke="${stroke}" stroke-width="${sel || cur ? 1.8 : 1}"/>
    <rect x="${x}" y="${y}" width="4" height="${hgt}" rx="2" fill="${col(n.via ? n.via.t : 'start')}"/>
    <text x="${x + 11}" y="${y + 17}" style="font-weight:600">${esc(trunc(C.pLabel(n.pid), 21))}</text>
    <text x="${x + 11}" y="${y + 33}" style="fill:#8b90a3;font-size:10.5px">${esc(trunc(n.via && n.via.t !== 'start' ? n.via.label : 'start', 25))}${n.note ? ' ✎' : ''}</text></g>`;
}
function viewTree(j) {
  const { pos, rows, maxD } = layoutTree(j), path = onPath(j);
  const bw = 168, bh = 42, gx = 62, gy = 16, vert = maxD >= 5 && maxD + 1 > rows * 1.5, gdy = 30;
  const W = vert ? 20 + rows * (bw + gy + 8) : 20 + (maxD + 1) * (bw + gx), H = vert ? 20 + (maxD + 1) * (bh + gdy) : 20 + rows * (bh + gy);
  const xy = id => vert ? [10 + pos[id].y * (bw + gy + 8), 10 + pos[id].d * (bh + gdy)] : [10 + pos[id].d * (bw + gx), 10 + pos[id].y * (bh + gy)];
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tree of the journey's steps and branches">`;
  Object.values(j.nodes).forEach(n => {
    if (!n.parent) return;
    const [x1, y1] = xy(n.parent), [x2, y2] = xy(n.id);
    let d;
    if (vert) { const a = x1 + bw / 2, b = y1 + bh, c = x2 + bw / 2, e = y2, m = b + (e - b) / 2; d = `M${a} ${b}C${a} ${m},${c} ${m},${c} ${e}`; }
    else { const a = x1 + bw, b = y1 + bh / 2, c = x2, e = y2 + bh / 2, m = a + (c - a) / 2; d = `M${a} ${b}C${m} ${b},${m} ${e},${c} ${e}`; }
    s += `<path d="${d}" fill="none" stroke="${col(n.via ? n.via.t : 'start')}" stroke-opacity="${path.has(n.id) ? .95 : .5}" stroke-width="${path.has(n.id) ? 2 : 1.3}"/>`;
  });
  Object.values(j.nodes).forEach(n => { const [x, y] = xy(n.id); s += nodeBox(j, n, x, y, bw, bh, path); });
  s += '</svg>';
  let h = `<div class="caption">Every step and fork of this journey. Blue outline marks where you are; the brighter line is your current path. Click a step for details and notes.</div><div class="treewrap">${s}</div>`;
  const n = j.nodes[jv.node];
  if (n) {
    const pe = peopleOf(n.pid), pl = placesOf(n.pid);
    h += `<div class="card nodepanel"><h2>${esc(C.pLabel(n.pid))}</h2>
      <div class="meta">${n.via && n.via.t !== 'start' ? `<span style="color:${col(n.via.t)}">${esc(TYPE_LABEL[n.via.t] || n.via.t)}</span><span>${esc(n.via.label)}</span>` : '<span>Starting point</span>'}</div>
      <div class="ptext" style="max-height:200px">${plainPassage(n.pid)}</div>
      ${pe.length || pl.length ? `<div style="margin-top:8px;font-size:12.5px;color:var(--faint)">${pe.length ? 'People: ' + pe.slice(0, 12).map(x => `<span class="pillx">${esc(x)}</span>`).join('') : ''} ${pl.length ? 'Places: ' + pl.slice(0, 12).map(x => `<span class="pillx">${esc(x)}</span>`).join('') : ''}</div>` : ''}
      <textarea id="nnote" rows="3" placeholder="Add a note to this step" data-n="${n.id}">${esc(n.note || '')}</textarea>
      <div class="row"><button class="btn primary" data-jv="here" data-n="${n.id}">Continue from here in Explore</button>${n.parent ? `<button class="btn danger" data-jv="prune" data-n="${n.id}">Remove this step and everything after it</button>` : ''}</div></div>`;
  }
  return h;
}

function labelRows(items, getX, widthOf, minRows) {
  const rows = []; const out = [];
  items.slice().sort((a, b) => getX(a) - getX(b)).forEach(it => {
    const w = widthOf(it), x0 = getX(it) - w / 2; let r = rows.findIndex(end => end + 8 < x0);
    if (r < 0) { r = rows.length; rows.push(-1e9); }
    rows[r] = x0 + w; out.push({ it, row: r });
  });
  return { out, nrows: Math.max(minRows || 1, rows.length) };
}
function uniqByPid(j) { const m = new Map(); Object.values(j.nodes).forEach(n => { if (!m.has(n.pid)) m.set(n.pid, []); m.get(n.pid).push(n); }); return m; }

function viewArcs(j) {
  const W = 1000, m = 20, plotW = W - 2 * m, base = 380, xOf = pid => m + (pid + 0.5) / NP * plotW;
  const pids = uniqByPid(j), path = onPath(j);
  const { out, nrows } = labelRows([...pids.keys()], xOf, pid => C.pLabel(pid).length * 6.1 + 6);
  const H = base + 26 + nrows * 15 + 14;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Arc diagram of the journey across the Bible">`;
  // book band
  const bookStart = {}; B.P.forEach((p, pid) => { const b = p[1]; if (!bookStart[b]) bookStart[b] = [pid, pid]; bookStart[b][1] = pid; });
  Object.entries(bookStart).forEach(([b, [a, z]]) => { s += `<rect x="${xOf(a) - plotW / NP / 2}" y="${base + 3}" width="${(z - a + 1) / NP * plotW}" height="7" fill="${b < 1 ? '#fff' : (+b === NT_START ? '#fff' : (b % 2 ? '#4b4e5b' : '#8b8e9c'))}"/>`; });
  s += `<text x="${xOf(0)}" y="${base + 24}" style="fill:#7d8296;font-size:10.5px" text-anchor="start"></text>`;
  Object.values(j.nodes).forEach(n => {
    if (!n.parent) return;
    const a = xOf(j.nodes[n.parent].pid), b = xOf(n.pid), x1 = Math.min(a, b), x2 = Math.max(a, b), rx = (x2 - x1) / 2;
    if (rx < 0.5) return;
    const ry = Math.min(rx * 0.85, 330);
    s += `<path d="M${x1} ${base}A${rx} ${ry} 0 0 1 ${x2} ${base}" fill="none" stroke="${col(n.via ? n.via.t : 'start')}" stroke-width="${path.has(n.id) ? 2.4 : 1.5}" stroke-opacity="${path.has(n.id) ? .95 : .6}"/>`;
  });
  out.forEach(({ it: pid, row }) => {
    const x = xOf(pid), ly = base + 26 + row * 15, nodes = pids.get(pid), isCur = nodes.some(n => n.id === j.cur), onP = nodes.some(n => path.has(n.id));
    s += `<line x1="${x}" y1="${base + 10}" x2="${x}" y2="${ly - 11}" stroke="#555a6e" stroke-width=".6"/><circle cx="${x}" cy="${base}" r="${isCur ? 5.5 : 3.6}" fill="${isCur ? '#6ea8ff' : (onP ? '#c9d6f5' : '#8a90a6')}"/>
      <text x="${x}" y="${ly}" text-anchor="middle" style="${isCur ? 'fill:#9cc2ff;font-weight:600' : ''}">${esc(C.pLabel(pid))}</text>`;
  });
  s += '</svg>';
  return `<div class="caption">Position runs from Genesis (left) to Revelation (right). Each arc joins a step to the step that followed it, coloured by the kind of link. The faint lines behind are the Bible's wider cross-reference web.</div>
    <div class="opts noprint"><label><input type="checkbox" data-jv="bg"${jv.bg ? ' checked' : ''}> Show the cross-reference web behind</label>${legend()}</div>
    <div class="stagewrap" id="arcstage"><canvas id="arcbg"></canvas>${s}</div>`;
}
function legend() {
  return '<div class="legend" style="display:inline-flex;margin-left:8px">' + ['quote', 'parallel', 'xref', 'event', 'person', 'place', 'curated'].map(k => `<span><i style="background:${COLORS[k]}"></i>${TYPE_LABEL[k]}</span>`).join('') + '</div>';
}
function drawBackdrop() {
  const cv = $('#arcbg'), st = $('#arcstage'); if (!cv || !st) return;
  const r = st.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr * r.width / 1000, 0, 0, dpr * r.width / 1000, 0, 0);
  if (!jv.bg) return;
  const m = 20, plotW = 960, base = 380, xOf = pid => m + (pid + 0.5) / NP * plotW;
  ctx.strokeStyle = 'rgba(120,140,200,0.016)'; ctx.lineWidth = 0.7;
  B.xref.forEach((list, pid) => list.forEach(([q, w]) => {
    if (q <= pid || w < 12) return;
    const a = xOf(pid), b = xOf(q), rx = (b - a) / 2;
    ctx.beginPath(); ctx.ellipse(a + rx, base, rx, Math.min(rx * 0.85, 330), 0, Math.PI, 2 * Math.PI); ctx.stroke();
  }));
}

function viewMap(j) {
  const land = window.LAND || [];
  const nodes = Object.values(j.nodes), placeCount = new Map(), pcent = {};
  nodes.forEach(n => {
    const pts = C.pPlaces[n.pid].map(i => ({ i, p: B.places[i] })).filter(x => x.p[2] != null);
    C.pPlaces[n.pid].forEach(i => placeCount.set(i, (placeCount.get(i) || 0) + 1));
    if (pts.length) pcent[n.id] = [pts.reduce((a, x) => a + x.p[3], 0) / pts.length, pts.reduce((a, x) => a + x.p[2], 0) / pts.length];
  });
  const mapped = [...placeCount.keys()].filter(i => B.places[i][2] != null), unmapped = [...placeCount.keys()].filter(i => B.places[i][2] == null);
  if (!mapped.length) return `<div class="card"><p style="color:var(--dim)">None of the passages in this journey mention a place with known coordinates.</p></div>`;
  let lons = mapped.map(i => B.places[i][3]).sort((a, b) => a - b), lats = mapped.map(i => B.places[i][2]).sort((a, b) => a - b);
  const q = (arr, f) => arr[Math.min(arr.length - 1, Math.max(0, Math.round(f * (arr.length - 1))))];
  // ignore far outliers when there are many places, but keep every dot on the map if it fits
  let lo = lons[0], hi = lons[lons.length - 1], la0 = lats[0], la1 = lats[lats.length - 1];
  if (mapped.length > 12) { lo = q(lons, 0.03); hi = q(lons, 0.97); la0 = q(lats, 0.03); la1 = q(lats, 0.97); }
  let lonSpan = Math.max(hi - lo, 7) * 1.18, latSpan = Math.max(la1 - la0, 5) * 1.22;
  const cLon = (lo + hi) / 2, cLat = (la0 + la1) / 2, cosM = Math.cos(cLat * Math.PI / 180), W = 1000;
  let Hh = W * latSpan / (lonSpan * cosM);
  if (Hh > 640) { Hh = 640; lonSpan = latSpan * W / (Hh * cosM); } else if (Hh < 300) { Hh = 300; latSpan = Hh * lonSpan * cosM / W; }
  const x = lon => (lon - (cLon - lonSpan / 2)) / lonSpan * W, y = lat => ((cLat + latSpan / 2) - lat) / latSpan * Hh;
  let s = `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Map of the places in the journey"><rect width="${W}" height="${Hh}" fill="#0f1a2a"/>`;
  const step = lonSpan > 40 ? 10 : (lonSpan > 16 ? 5 : 2);
  for (let g = Math.ceil((cLon - lonSpan / 2) / step) * step; g <= cLon + lonSpan / 2; g += step) s += `<line x1="${x(g)}" y1="0" x2="${x(g)}" y2="${Hh}" stroke="#223350" stroke-width=".6"/><text x="${x(g) + 3}" y="${Hh - 5}" style="fill:#4d6385;font-size:10px">${g}°E</text>`;
  for (let g = Math.ceil((cLat - latSpan / 2) / step) * step; g <= cLat + latSpan / 2; g += step) s += `<line x1="0" y1="${y(g)}" x2="${W}" y2="${y(g)}" stroke="#223350" stroke-width=".6"/><text x="4" y="${y(g) - 3}" style="fill:#4d6385;font-size:10px">${g}°N</text>`;
  land.forEach(poly => {
    const d = poly.map(ring => 'M' + ring.map(([lo2, la2]) => x(lo2).toFixed(1) + ' ' + y(la2).toFixed(1)).join('L') + 'Z').join('');
    s += `<path d="${d}" fill="#26324a" stroke="#3a4a6b" stroke-width=".8" fill-rule="evenodd"/>`;
  });
  nodes.forEach(n => {
    if (!n.parent || !pcent[n.id] || !pcent[n.parent]) return;
    const [x1, y1] = [x(pcent[n.parent][0]), y(pcent[n.parent][1])], [x2, y2] = [x(pcent[n.id][0]), y(pcent[n.id][1])];
    if (Math.hypot(x2 - x1, y2 - y1) < 2) return;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.18;
    s += `<path d="M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}" fill="none" stroke="${col(n.via ? n.via.t : 'start')}" stroke-width="1.8" stroke-opacity=".85" stroke-dasharray="5 3"/>`;
  });
  const top = mapped.slice().sort((a, b) => placeCount.get(b) - placeCount.get(a));
  const nLab = new Set(top.slice(0, 22));
  const labs = labelRows(top.filter(i => nLab.has(i)), i => x(B.places[i][3]), i => C.placeName(i).length * 6.2 + 8, 1);
  top.forEach(i => {
    const [, , lat, lon] = B.places[i], cx = x(lon), cy = y(lat), c = placeCount.get(i);
    if (cx < -5 || cx > W + 5 || cy < -5 || cy > Hh + 5) return;
    s += `<circle cx="${cx}" cy="${cy}" r="${3 + Math.min(c, 6)}" fill="#7fc23e" fill-opacity=".85" stroke="#0f1a2a" stroke-width="1"><title>${esc(C.placeName(i))}: in ${c} step${c === 1 ? '' : 's'}</title></circle>`;
  });
  const used = [];
  labs.out.forEach(({ it: i }) => {
    const cx = x(B.places[i][3]), cy = y(B.places[i][2]); if (cx < 0 || cx > W || cy < 0 || cy > Hh) return;
    let ty = cy - 8; for (let k = 0; k < 8; k++) { if (!used.some(u => Math.abs(u[0] - cx) < 60 && Math.abs(u[1] - ty) < 11)) break; ty -= 11; }
    used.push([cx, ty]);
    s += `<text x="${cx}" y="${ty}" text-anchor="middle" style="fill:#e8ecf5;font-size:11px;paint-order:stroke;stroke:#0f1a2a;stroke-width:3px">${esc(C.placeName(i))}</text>`;
  });
  s += '</svg>';
  return `<div class="caption">Places mentioned in the journey's passages (from the Theographic place data). Dashed lines join each step to the step that followed it, where both mention a place. Dot size shows how many steps mention the place. ${land.length ? 'Coastline: Natural Earth 110m (public domain), so small features such as the Sea of Galilee and the Dead Sea are not drawn.' : 'No coastline data is loaded, so only a latitude and longitude grid is shown.'}</div>
    <div class="opts noprint">${legend()}</div><div class="stagewrap">${s}</div>
    <div class="timeline-undated">${mapped.length} place${mapped.length === 1 ? '' : 's'} shown${unmapped.length ? `. No coordinates in the data for: ${unmapped.slice(0, 20).map(i => esc(C.placeName(i))).join(', ')}${unmapped.length > 20 ? '…' : ''}` : ''}.</div>`;
}

function yearOf(str) {
  str = String(str || '');
  if (/^-?\d+$/.test(str)) return +str;
  const m = /^(\d{4})-\d\d-\d\d/.exec(str); return m ? +m[1] : null;
}
const yLabel = y => y <= 0 ? `${1 - y} BC` : `AD ${y}`;
function viewTimeline(j) {
  const nodes = Object.values(j.nodes), dated = [], undated = [];
  nodes.forEach(n => {
    const evs = C.pEvents[n.pid].map(e => B.events[e]).filter(e => yearOf(e[1]) != null).sort((a, b) => a[3].length - b[3].length);
    if (evs.length) dated.push({ n, y: yearOf(evs[0][1]), ev: evs[0][0] }); else undated.push(n);
  });
  if (!dated.length) return `<div class="card"><p style="color:var(--dim)">None of this journey's passages belong to an event with a date in the source data. Dates exist for 450 events, mostly narrative passages, so letters and psalms are often undated.</p></div>`;
  let y0 = Math.min(...dated.map(d => d.y)), y1 = Math.max(...dated.map(d => d.y));
  if (y1 - y0 < 10) { y0 -= 5; y1 += 5; }
  const pad = (y1 - y0) * 0.06; y0 -= pad; y1 += pad;
  const W = 1000, m = 40, base = 330, xOf = y => m + (y - y0) / (y1 - y0) * (W - 2 * m);
  const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000]; const tick = steps.find(t => (y1 - y0) / t <= 9) || 2000;
  const byY = new Map(); dated.forEach(d => { const k = d.n.pid; if (!byY.has(k)) byY.set(k, d); });
  const items = [...byY.values()];
  const { out, nrows } = labelRows(items, d => xOf(d.y), d => C.pLabel(d.n.pid).length * 6.1 + 6);
  const H = base + 50 + nrows * 15 + 14, pos = {}; dated.forEach(d => pos[d.n.id] = xOf(d.y));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Timeline of the journey's dated steps">`;
  for (let t = Math.ceil(y0 / tick) * tick; t <= y1; t += tick) s += `<line x1="${xOf(t)}" y1="${base - 4}" x2="${xOf(t)}" y2="${base + 6}" stroke="#7d8296"/><text x="${xOf(t)}" y="${base + 20}" text-anchor="middle" style="fill:#8b90a3;font-size:10.5px">${yLabel(Math.round(t))}</text>`;
  s += `<line x1="${m - 10}" y1="${base}" x2="${W - m + 10}" y2="${base}" stroke="#7d8296"/>`;
  nodes.forEach(n => {
    if (!n.parent || pos[n.id] == null || pos[n.parent] == null) return;
    const a = Math.min(pos[n.id], pos[n.parent]), b = Math.max(pos[n.id], pos[n.parent]), rx = (b - a) / 2; if (rx < 0.5) return;
    s += `<path d="M${a} ${base}A${rx} ${Math.min(rx * 0.7, 260)} 0 0 1 ${b} ${base}" fill="none" stroke="${col(n.via ? n.via.t : 'start')}" stroke-width="1.8" stroke-opacity=".8"/>`;
  });
  out.forEach(({ it: d, row }) => {
    const x = xOf(d.y), ly = base + 40 + row * 15, isCur = d.n.id === j.cur;
    s += `<line x1="${x}" y1="${base + 4}" x2="${x}" y2="${ly - 11}" stroke="#555a6e" stroke-width=".6"/><circle cx="${x}" cy="${base}" r="${isCur ? 5.5 : 3.8}" fill="${isCur ? '#6ea8ff' : '#c9d6f5'}"><title>${esc(d.ev)} (${yLabel(d.y)})</title></circle>
      <text x="${x}" y="${ly}" text-anchor="middle" style="${isCur ? 'fill:#9cc2ff;font-weight:600' : ''}">${esc(C.pLabel(d.n.pid))}</text>`;
  });
  s += '</svg>';
  return `<div class="caption">Steps placed by the date of the event they belong to. These dates follow one scholar's chronology (Floyd Nolen Jones) as used by Theographic; other chronologies differ by years or centuries, so treat the positions as a guide to order, not a fact.</div>
    <div class="opts noprint">${legend()}</div><div class="stagewrap">${s}</div>
    ${undated.length ? `<div class="timeline-undated">No date in the source for ${undated.length} step${undated.length === 1 ? '' : 's'}: ${[...new Set(undated.map(n => C.pLabel(n.pid)))].slice(0, 24).map(x => `<span class="pillx">${esc(x)}</span>`).join('')}</div>` : ''}`;
}

function viewGuide(j) {
  const steps = guideSteps(j);
  let h = `<div class="opts noprint" style="margin-bottom:10px"><label><input type="checkbox" data-jv="gopt" data-o="text"${jv.guide.text ? ' checked' : ''}> Include passage text</label>
    <label><input type="checkbox" data-jv="gopt" data-o="ents"${jv.guide.ents ? ' checked' : ''}> Include people and places</label>
    <label><input type="checkbox" data-jv="gopt" data-o="all"${jv.guide.all ? ' checked' : ''}> Include all branches, not just the line through your current step</label></div>
    <div class="row noprint"><button class="btn primary" data-jv="dlmd">Download Markdown</button><button class="btn" data-jv="cpmd">Copy as text</button><button class="btn" data-jv="print">Print or save as PDF</button><button class="btn" data-jv="dljson">Download journey file</button></div>
    <div class="guide"><h1>${esc(j.title || C.journeyTitle(j))}</h1>${(j.tags || []).length ? `<div class="ents">${j.tags.map(esc).join(' · ')}</div>` : ''}${j.notes ? `<p>${esc(j.notes).replace(/\n/g, '<br>')}</p>` : ''}`;
  steps.forEach((s, i) => {
    const pid = s.n.pid, v = viaText(s.n), pe = peopleOf(pid), pl = placesOf(pid);
    h += `<div class="gstep"><h2>${i + 1}. ${esc(C.pLabel(pid))}</h2>${s.branch ? '<div class="gbranch">Branch from an earlier step</div>' : ''}${v ? `<div class="via">How it connects: ${esc(v)}</div>` : ''}
      ${jv.guide.text ? `<div class="gtext">${plainPassage(pid)}</div>` : ''}
      ${jv.guide.ents && (pe.length || pl.length) ? `<div class="ents">${pe.length ? '<b>People:</b> ' + esc(pe.join(', ')) : ''}${pe.length && pl.length ? '<br>' : ''}${pl.length ? '<b>Places:</b> ' + esc(pl.join(', ')) : ''}</div>` : ''}
      ${s.n.note ? `<div class="gnote">${esc(s.n.note).replace(/\n/g, '<br>')}</div>` : ''}</div>`;
  });
  return h + `<div class="ents" style="margin-top:18px">${esc(B.credits.line)}</div></div>`;
}

/* ===================================================== views: library and backup */
function viewLibrary() {
  let h = `<div class="caption" style="margin-bottom:12px">Ready-made journeys follow well-known threads through the Bible. The steps and short notes were chosen by hand; each link between steps is labelled with what the data shows (quotation, cross-reference and so on), or "curated link" where the data has none. Starting one copies it into your journeys, where you can branch off from any step.</div>`;
  LIBRARY.forEach(def => {
    const steps = resolveSteps(def), bad = steps.some(s => s.pid == null);
    h += `<div class="libcard"><h3>${esc(def.title)}</h3><div class="tags">${def.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div><p>${esc(def.summary)}</p>
      <div class="row"><button class="btn primary" data-jv="startlib" data-id="${def.id}"${bad ? ' disabled' : ''}>Start this journey</button>
      <button class="btn" data-jv="preview" data-id="${def.id}">${jv.open === def.id ? 'Hide' : 'Preview'} ${steps.length} steps</button></div>`;
    if (jv.open === def.id) {
      h += '<ol class="libsteps">';
      steps.forEach((s, i) => { const r = i ? relate(steps[i - 1].pid, s.pid) : null; h += `<li><b>${esc(C.pLabel(s.pid))}</b>${r ? ` <span style="color:${col(r.t)};font-size:12px">· ${esc(r.t === 'curated' ? 'curated link' : r.label)}</span>` : ''}<small>${esc(s.note)}</small></li>`; });
      h += '</ol>';
    }
    h += '</div>';
  });
  return h;
}
function viewBackup() {
  const all = allJ(), size = JSON.stringify(store()).length;
  return `<div class="backup"><div class="card"><h2>Back up and restore</h2>
    <p>Your journeys, notes and tags live in this browser only. Download a backup file to keep them safe, move them to another browser, or share the whole set.</p>
    <p style="color:var(--faint)">${all.length} journey${all.length === 1 ? '' : 's'}, ${(size / 1024).toFixed(1)} KB stored.</p>
    <div class="row"><button class="btn primary" data-jv="dlall"${all.length ? '' : ' disabled'}>Download backup of all journeys</button>
    <label class="btn" style="cursor:pointer">Restore from a backup file<input type="file" id="jfile" accept=".json,application/json" style="display:none"></label></div>
    <div id="jmsg" class="warn" style="min-height:20px"></div>
    <p style="font-size:12.5px;color:var(--faint)">Restoring adds the journeys in the file next to the ones you have. A journey with the same id is kept and the restored copy is renamed "(imported)". Files made with a different version of the data are refused.</p></div>
    <div class="card"><h2>Share one journey</h2><p>Open a journey and use <b>Study guide</b> for a printable or Markdown version, or <b>Copy path code</b> in the left panel to send the current path to someone who has this same folder.</p></div></div>`;
}

/* ===================================================== render + events */
function render(main) {
  const tabs = [['mine', 'My journeys'], ['library', 'Ready-made'], ['backup', 'Backup']];
  let h = `<div class="jhead"><h2>Journeys</h2><div class="seg">${tabs.map(([t, l]) => `<button class="${jv.tab === t ? 'on' : ''}" data-jv="tab" data-t="${t}">${l}</button>`).join('')}</div></div>`;
  if (jv.tab === 'mine') { const j = store().journeys[jv.sel]; h += j ? viewDetail(j) : viewList(); }
  else if (jv.tab === 'library') h += viewLibrary();
  else h += viewBackup();
  main.innerHTML = h;
  if (jv.tab === 'mine' && jv.sel && jv.view === 'arcs') requestAnimationFrame(drawBackdrop);
}
const rerender = () => C.render();
const curJ = () => store().journeys[jv.sel];

document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-jv]'); if (!t) return;
  const a = t.dataset.jv, j = curJ();
  switch (a) {
    case 'tab': jv.tab = t.dataset.t; if (jv.tab === 'mine' && t.dataset.t === 'library') jv.sel = null; rerender(); break;
    case 'sel': jv.sel = t.dataset.j; jv.node = null; jv.view = 'tree'; rerender(); break;
    case 'back': jv.sel = null; rerender(); break;
    case 'star': { const x = store().journeys[t.dataset.j]; x.starred = !x.starred; C.save(); rerender(); break; }
    case 'tag': jv.tag = t.dataset.t; rerender(); break;
    case 'open': setCur(t.dataset.j); break;
    case 'dup': { const c = duplicate(j); jv.sel = c.id; rerender(); break; }
    case 'merge': { const to = ($('#jmerge') || {}).value; if (!to) break; if (confirm(`Merge “${C.journeyTitle(j)}” into “${C.journeyTitle(store().journeys[to])}”? The original stays as it is.`)) { mergeInto(j.id, to); jv.sel = to; jv.mergeTo = ''; rerender(); } break; }
    case 'del': if (confirm(`Delete “${C.journeyTitle(j)}”? This can't be undone.`)) { delete store().journeys[j.id]; if (store().jid === j.id) store().jid = (allJ().sort((p, q) => q.updated - p.updated)[0] || {}).id || null; jv.sel = null; C.save(); rerender(); } break;
    case 'rmtag': j.tags = (j.tags || []).filter(x => x !== t.dataset.t); C.save(); rerender(); break;
    case 'view': jv.view = t.dataset.v; rerender(); break;
    case 'node': jv.node = +t.dataset.n; rerender(); break;
    case 'here': setCur(j.id, +t.dataset.n); break;
    case 'prune': if (confirm('Remove this step and every step after it? This can\'t be undone.')) { prune(j, +t.dataset.n); jv.node = null; rerender(); } break;
    case 'startlib': startFromLibrary(LIBRARY.find(d => d.id === t.dataset.id)); break;
    case 'preview': jv.open = jv.open === t.dataset.id ? null : t.dataset.id; rerender(); break;
    case 'dlmd': download(slug(j.title || C.journeyTitle(j)) + '.md', markdown(j), 'text/markdown'); break;
    case 'cpmd': (navigator.clipboard ? navigator.clipboard.writeText(markdown(j)) : Promise.reject()).then(() => { t.textContent = 'Copied'; setTimeout(() => t.textContent = 'Copy as text', 1400); }, () => prompt('Copy this text:', markdown(j))); break;
    case 'print': window.print(); break;
    case 'dljson': download(slug(j.title || C.journeyTitle(j)) + '.journey.json', exportJson(j), 'application/json'); break;
    case 'dlall': download(`bible-journeys-backup-${today()}.json`, JSON.stringify({ format: 'bible-story-journeys', version: 1, dataVersion: NP, exported: new Date().toISOString(), journeys: store().journeys }, null, 1), 'application/json'); break;
  }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.id === 'jsort') { jv.sort = t.value; rerender(); }
  else if (t.id === 'jmerge') jv.mergeTo = t.value;
  else if (t.id === 'jtitle') { const j = curJ(); if (j) { j.title = t.value.trim(); j.updated = Date.now(); C.save(); rerender(); } }
  else if (t.dataset && t.dataset.jv === 'gopt') { jv.guide[t.dataset.o] = t.checked; rerender(); }
  else if (t.dataset && t.dataset.jv === 'bg') { jv.bg = t.checked; drawBackdrop(); }
  else if (t.id === 'jfile' && t.files[0]) {
    const rd = new FileReader();
    rd.onload = () => { const r = importJson(String(rd.result)); const m = $('#jmsg'); if (r.error) { m.textContent = r.error; return; } rerender(); const m2 = $('#jmsg'); if (m2) { m2.style.color = 'var(--quote)'; m2.textContent = `Restored ${r.added} journey${r.added === 1 ? '' : 's'}${r.skipped ? `, skipped ${r.skipped} damaged` : ''}.`; } };
    rd.readAsText(t.files[0]);
  }
});
document.addEventListener('input', ev => {
  const t = ev.target, j = curJ();
  if (t.id === 'jqs') { jv.q = t.value; const pos = t.selectionStart; rerender(); const n = $('#jqs'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }
  else if (t.id === 'jnotes' && j) { j.notes = t.value; j.updated = Date.now(); C.save(); }
  else if (t.id === 'nnote' && j) { const n = j.nodes[+t.dataset.n]; if (n) { n.note = t.value; j.updated = Date.now(); C.save(); } }
});
document.addEventListener('keydown', ev => {
  if (ev.target.id === 'jtag' && ev.key === 'Enter') {
    const j = curJ(), v = normTag(ev.target.value); ev.preventDefault();
    if (j && v && !(j.tags || []).includes(v)) { j.tags = (j.tags || []).concat(v); C.save(); rerender(); const n = $('#jtag'); if (n) n.focus(); }
  }
});
window.addEventListener('resize', () => { if (ui.view === 'journeys' && jv.view === 'arcs') drawBackdrop(); });

window.StoryJourneys = { render, jv, LIBRARY, relate, resolveSteps, markdown, mergeInto, importJson, exportJson, layoutTree, sanitize, yearOf, startFromLibrary };
})();
