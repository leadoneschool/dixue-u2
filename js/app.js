/* ===== 互動講義 app ===== */
(function () {
'use strict';

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const KEY = 'dixue-u2-v1';

/* ---------- 內容覆寫層（pages-rich.js） ---------- */
if (typeof RICH !== 'undefined') {
  CHAPTERS.forEach(ch => ch.pages.forEach(p => {
    const r = RICH[p.id];
    if (!r) return;
    if (r.lede !== undefined) p.lede = r.lede;
    if (r.title !== undefined) p.title = r.title;
    if (r.kind !== undefined) p.kind = r.kind;
    if (r.lab !== undefined) p.lab = r.lab || undefined;
    if (r.blocks !== undefined) p.blocks = r.blocks;
  }));
}

/* ---------- 攤平頁面 ---------- */
const PAGES = [];
CHAPTERS.forEach((ch, ci) => ch.pages.forEach((p, pi) => {
  PAGES.push(Object.assign({}, p, { ch, ci, pi, idx: PAGES.length }));
}));

/* ---------- 進度 ---------- */
let store = { seen: {}, quiz: {} };
try { const r = localStorage.getItem(KEY); if (r) store = Object.assign(store, JSON.parse(r)); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };

let cur = 0;

/* =======================================================
   側邊欄
   ======================================================= */
function buildSidebar() {
  const wrap = $('#chlist'); wrap.innerHTML = '';
  CHAPTERS.forEach((ch, ci) => {
    const box = el('div', 'ch'); box.dataset.ci = ci;
    const b = el('button', 'ch-btn');
    b.innerHTML = `<span class="ch-dot" style="background:${ch.accent}"></span>
      <span>${esc(ch.label)}</span><span class="ch-count">${ch.pages.length}</span>`;
    b.onclick = () => {
      box.classList.add('open');
      const first = PAGES.findIndex(x => x.ch.id === ch.id);
      if (first >= 0) { go(first); closeDrawer(); }
    };
    box.appendChild(b);
    const ul = el('div', 'ch-pages');
    ch.pages.forEach(p => {
      const gi = PAGES.findIndex(x => x.id === p.id);
      const pb = el('button', 'pg-btn');
      pb.dataset.gi = gi;
      pb.innerHTML = `<span class="pg-done" data-done>${store.seen[p.id] ? '✓' : ''}</span>
        <span>${esc(p.title)}</span><span class="pg-p">P.${bookPage(p.src)}</span>`;
      pb.onclick = () => { go(gi); closeDrawer(); };
      ul.appendChild(pb);
    });
    box.appendChild(ul);
    wrap.appendChild(box);
  });
}
function syncSidebar() {
  $$('.pg-btn').forEach(b => {
    const gi = +b.dataset.gi, p = PAGES[gi];
    b.classList.toggle('active', gi === cur);
    const d = $('[data-done]', b); if (d) d.textContent = store.seen[p.id] ? '✓' : '';
  });
  $$('.ch').forEach(c => { if (+c.dataset.ci === PAGES[cur].ci) c.classList.add('open'); });
  const done = PAGES.filter(p => store.seen[p.id]).length;
  $('#sbprog').textContent = `已讀 ${done} / ${PAGES.length} 頁`;
  $('#tbprog').style.width = ((cur + 1) / PAGES.length * 100) + '%';
}

/* =======================================================
   區塊渲染
   ======================================================= */

const SVG_FIGURES = new Set(['conv-cc', 'law-superposition', 'law-crosscut',
  'fold-anticline', 'mem3-fold2', 'fold-syncline', 'mem3-fold1', 'fold-main', 'mem4-f1', 'mem4-f2', 'mem4-f3', 'seq-example1', 'seq-example2', 'geo-event-fig', 'aftershock-flow',
  'b-q1', 'b-q10', 'b-q9', 'h3-q1', 'h3-q3', 'h3-q4', 'h3-q4-opts', 'lit-q3', 'var-q1', 'b-q13', 'm-q3', 'r3-q1', 'r3-q2', 'b-q11', 'b-q16',
  'sw-q15', 'r1-q7', 'h2-q2-opts', 'h2-q2', 'r1-q1', 'r1-q5', 'h2-q3',
  'h1-q2-opts', 'seq-q8-opts', 'var-q1-opts', 'h2-q5-opts', 'var-q5-opts', 'm-q2-opts', 'b-q6-opts', 'b-q15-opts', 'b-q23-opts', 'gps-q2-opts', 'm-q5-opts', 'r2-q4-opts', 'h2-q3-opts',
  'h2-q5-map', 'tw-rift-valley', 'conv-oc', 'r4-q5', 'h4-q2-map', 'h4-q1', 'm-q1', 'tw-3d', 'r4-q1', 'b-q17', 'cwa-report',
  'andes', 'rift-eastafrica', 'h3-q2', 'lit-q2', 'bridge-photo', 'var-q5', 'm-q4', 'lit-q1', 'comic-b', 'comic-strip', 'fossil-ages', 'mem1-earth', 'mem2-plates', 'seismic-waves', 'var-q3-opts',
  'tw-rocks', 'b-q21', 'gps-q3', 'read-intensity', 'm-q2', 'gps-map', 'eew-map', 'r2-q2', 'lit-q4', 'h2-q1',
  'earth-section', 'quake-terms', 'plates-world', 'quake-volcano-map']);
function imageUrl(name) {
  return 'img/' + name + (SVG_FIGURES.has(name) ? '.svg' : '.webp');
}


function earthquakeReport() {
  const report = el('div', 'earthquake-report');
  const info = el('div', 'figure-table');
  const table = el('table', 't');
  const caption = table.createCaption();
  caption.textContent = '中央氣象署　地震報告';
  const body = table.createTBody();
  const rows = [
    ['編號', '第 109001 號'],
    ['日期', '109 年 1 月 1 日'],
    ['時間', '3 時 10 分 10.9 秒'],
    ['位置', '北緯 24.09 度、東經 121.66 度', 'location'],
    ['地震深度', '7.2 公里', 'depth'],
    ['芮氏規模', '4.8', 'magnitude'],
    ['各地最大震度', '花蓮縣太魯閣 4 級、宜蘭縣澳花 3 級、臺中市梨山 2 級、南投縣南投市 1 級', 'intensity']
  ];
  for (const [heading, text, anchor] of rows) {
    const row = body.insertRow();
    const label = el('th');
    label.scope = 'row';
    label.textContent = heading;
    row.appendChild(label);
    const cell = row.insertCell();
    cell.textContent = text;
    if (anchor) cell.dataset.hotAnchor = anchor;
  }
  info.appendChild(table);
  report.appendChild(info);
  const map = el('div', 'earthquake-report-map');
  map.dataset.hotAnchor = 'map';
  const img = el('img');
  img.src = imageUrl('cwa-report');
  img.alt = '地震震度分布圖';
  img.loading = 'lazy';
  map.appendChild(img);
  report.appendChild(map);
  return report;
}

function tableFigure(name, label) {
  if (name === 'cwa-report') return earthquakeReport();
  if (name === 'h1-q2-hint') {
    const hint = el('p', 'figure-hint');
    hint.textContent = '提示：甲、乙、丙三構造中，甲的密度最大。';
    return hint;
  }
  if (!Object.prototype.hasOwnProperty.call(FIGURE_TABLES, name)) return null;
  const [headers, ...rows] = FIGURE_TABLES[name];
  const wrap = el('div', 'figure-table');
  const table = el('table', 't');
  table.setAttribute('aria-label', label || '講義資料表');
  const head = table.createTHead().insertRow();
  headers.forEach(value => {
    const cell = el('th');
    cell.scope = 'col';
    cell.textContent = value;
    head.appendChild(cell);
  });
  const body = table.createTBody();
  rows.forEach(values => {
    const row = body.insertRow();
    values.forEach(value => { row.insertCell().textContent = value; });
  });
  wrap.appendChild(table);
  return wrap;
}

function figure(src, cap, note, opt) {
  opt = opt || {};
  const f = el('figure', 'fig' + (opt.half ? ' half' : ''));
  const table = tableFigure(src, cap);
  if (table) f.appendChild(table);
  else {
    const w = el('div', 'imgwrap');
    const img = el('img'); img.src = imageUrl(src); img.alt = cap || '';
    img.loading = 'lazy';
    w.appendChild(img);
    w.appendChild(el('span', 'zoomhint', '點擊放大'));
    w.onclick = () => lightbox(img.src, cap || '');
    f.appendChild(w);
  }
  if (cap || note) {
    const c = el('figcaption', '', cap ? esc(cap) : '');
    if (note) c.appendChild(el('div', 'note', note));
    f.appendChild(c);
  }
  return f;
}

function renderBlock(b) {
  switch (b.t) {
    case 'fig': return figure(b.src, b.cap, b.note, { half: b.half });
    case 'two': {
      const g = el('div', 'twocol');
      g.appendChild(figure(b.left.fig, b.left.cap));
      g.appendChild(figure(b.right.fig, b.right.cap));
      return g;
    }
    case 'list': {
      const c = el('div', 'card');
      if (b.title) c.appendChild(el('h3', '', esc(b.title)));
      const ul = el('ul', 'bul');
      b.items.forEach(i => ul.appendChild(el('li', '', i)));
      c.appendChild(ul); return c;
    }
    case 'table': {
      const w = el('div', 'tablewrap');
      const t = el('table', 't');
      const th = el('thead'); const tr = el('tr');
      b.head.forEach(h => tr.appendChild(el('th', '', h)));
      th.appendChild(tr); t.appendChild(th);
      const tb = el('tbody');
      b.rows.forEach(r => {
        const x = el('tr'); r.forEach(c => x.appendChild(el('td', '', c))); tb.appendChild(x);
      });
      t.appendChild(tb); w.appendChild(t); return w;
    }
    case 'callout': {
      const c = el('div', 'callout ' + (b.tone || 'note'));
      const icon = b.tone === 'myth' ? '❓' : b.tone === 'key' ? '★' : 'ℹ';
      c.appendChild(el('div', 'ct', icon + ' ' + esc(b.title || '')));
      if (b.q) c.appendChild(el('span', 'mq', 'Q：' + b.q));
      c.appendChild(el('div', '', b.body));
      return c;
    }
    case 'grid4': case 'grid5': {
      const g = el('div', 'gridc ' + (b.t === 'grid4' ? 'g4' : 'g5'));
      b.items.forEach(i => {
        const c = el('div', 'gcard');
        if (i.n) c.appendChild(el('div', 'n', esc(i.n)));
        c.appendChild(el('div', 'h', i.h));
        c.appendChild(el('div', 'd', i.d));
        g.appendChild(c);
      });
      return g;
    }
    case 'anim': {
      const n = ANIM[b.kind]();
      (window.__animNodes = window.__animNodes || []).push(n);
      return n;
    }
    case 'hotspots': return IX.hotspots(b, b.src === 'cwa-report' ? earthquakeReport() : imageUrl(b.src));
    case 'order':    return IX.order(b);
    case 'sort':     return IX.sortInto(b);
    case 'bigterm': {
      const n = el('div', 'bigterm');
      n.innerHTML = `<div class="bt-k"><span>${esc(b.kicker || '關鍵名詞')}</span><b>${esc(b.term)}</b></div>
                     <div class="bt-d">${b.def}</div>`;
      return n;
    }
    case 'facts': {
      const g = el('div', 'facts n' + (b.cols || Math.min(3, b.items.length)));
      b.items.forEach(i => {
        const c = el('div', 'fact');
        c.innerHTML = (i.k ? `<div class="fk">${esc(i.k)}</div>` : '') +
          `<div class="fv">${i.v}</div>` + (i.d ? `<div class="fd">${i.d}</div>` : '');
        g.appendChild(c);
      });
      return g;
    }
    case 'vs': {
      const n = el('div', 'vs');
      const col = c => `<div class="vcol"><div class="vh">${esc(c.h)}</div><ul>` +
        c.items.map(x => `<li>${x}</li>`).join('') + '</ul></div>';
      n.innerHTML = col(b.left) + '<div class="vmid"></div>' + col(b.right);
      return n;
    }
    case 'steps': {
      const g = el('div', 'steps');
      b.items.forEach((i, k) => {
        const c = el('div', 'step');
        c.innerHTML = `<div class="sn">${k + 1}</div><div class="sb">
          <div class="sh">${i.h}</div><div class="sd">${i.d}</div></div>`;
        g.appendChild(c);
      });
      return g;
    }
    case 'law': {
      const g = el('div', 'law');
      b.items.forEach(i => {
        const c = el('div', 'lawc');
        c.appendChild(el('div', 'num', i.n));
        const body = el('div', 'body');
        body.appendChild(el('div', 'h', i.h));
        body.appendChild(el('div', '', i.d));
        c.appendChild(body);
        if (i.fig) {
          const im = el('img'); im.src = imageUrl(i.fig); im.loading = 'lazy';
          im.onclick = () => lightbox(im.src, i.h);
          c.appendChild(im);
        }
        g.appendChild(c);
      });
      return g;
    }
  }
  return el('div');
}

/* =======================================================
   題目
   ======================================================= */
const LET = ['A', 'B', 'C', 'D', 'E'];

function renderQuiz(page, host) {
  const bar = el('div', 'quizbar');
  bar.innerHTML = `<span class="sc" data-sc>作答 0 / ${page.quiz.length}</span>
    <span class="bar"><i data-bar></i></span>
    <span data-acc style="color:var(--muted);font-weight:700"></span>`;
  const rst = el('button', 'mini', '重做本頁');
  rst.onclick = () => {
    page.quiz.forEach((q, i) => delete store.quiz[page.id + ':' + i]);
    save(); render();
  };
  bar.appendChild(rst);
  host.appendChild(bar);

  page.quiz.forEach((q, qi) => host.appendChild(renderQ(page, q, qi, bar)));
  updBar(page, bar);
}

function updBar(page, bar) {
  let done = 0, ok = 0;
  page.quiz.forEach((q, i) => {
    const r = store.quiz[page.id + ':' + i];
    if (r != null) { done++; if (r === q.ans) ok++; }
  });
  $('[data-sc]', bar).textContent = `作答 ${done} / ${page.quiz.length}`;
  $('[data-bar]', bar).style.width = (done / page.quiz.length * 100) + '%';
  $('[data-acc]', bar).textContent = done ? `答對 ${ok} 題` : '點選選項即可對答案';
}

function renderQ(page, q, qi, bar) {
  const box = el('div', 'q');
  const head = el('div', 'q-head');
  head.appendChild(el('div', 'q-no', String(qi + 1)));
  head.appendChild(el('div', 'q-text', q.q));
  box.appendChild(head);

  if (q.year || q.rate || q.tag) {
    const bd = el('div', 'q-badges');
    if (q.year) bd.appendChild(el('span', 'badge year', esc(q.year)));
    if (q.rate) bd.appendChild(el('span', 'badge rate', '通過率 ' + q.rate));
    if (q.tag) bd.appendChild(el('span', 'badge tag', esc(q.tag)));
    box.appendChild(bd);
  }

  if (q.fig || q.fig2) {
    const fw = el('div', 'q-fig tall');
    [q.fig, q.fig2].filter(Boolean).forEach(s => {
      const table = tableFigure(s, '題目附圖');
      if (table) { fw.appendChild(table); return; }
      const im = el('img'); im.src = imageUrl(s); im.loading = 'lazy';
      im.onclick = () => lightbox(im.src, '題目附圖');
      fw.appendChild(im);
    });
    box.appendChild(fw);
  }
  if (q.table) {
    const w = el('div', 'tablewrap'); w.style.margin = '14px 0 2px 42px';
    const t = el('table', 't'); const th = el('thead'); const tr = el('tr');
    q.table.head.forEach(h => tr.appendChild(el('th', '', h)));
    th.appendChild(tr); t.appendChild(th);
    const tb = el('tbody');
    q.table.rows.forEach(r => { const x = el('tr'); r.forEach(c => x.appendChild(el('td', '', c))); tb.appendChild(x); });
    t.appendChild(tb); w.appendChild(t); box.appendChild(w);
  }
  if (q.optfig) {
    const w = el('div', 'q-optfig');
    const table = tableFigure(q.optfig, '選項圖');
    if (table) w.appendChild(table);
    else {
      const im = el('img'); im.src = imageUrl(q.optfig); im.loading = 'lazy';
      im.onclick = () => lightbox(im.src, '選項圖');
      w.appendChild(im);
    } box.appendChild(w);
  }

  const opts = el('div', 'opts');
  const ans = el('div', 'ans');
  const key = page.id + ':' + qi;

  q.opts.forEach((o, oi) => {
    const b = el('button', 'opt');
    b.innerHTML = `<span class="k">${LET[oi]}</span><span>${o}</span>`;
    b.onclick = () => {
      if (store.quiz[key] != null) return;
      store.quiz[key] = oi; save();
      paint(); updBar(page, bar); markSeen(page);
    };
    opts.appendChild(b);
  });
  box.appendChild(opts);
  box.appendChild(ans);

  const again = el('div', 'q-reset');
  const ab = el('button', 'mini', '再試一次');
  ab.onclick = () => { delete store.quiz[key]; save(); paint(); updBar(page, bar); };
  again.appendChild(ab);
  box.appendChild(again);

  function paint() {
    const pick = store.quiz[key];
    const bs = $$('.opt', opts);
    bs.forEach((b, i) => {
      b.className = 'opt';
      if (pick == null) return;
      b.classList.add('locked');
      if (i === q.ans) b.classList.add('right');
      else if (i === pick) b.classList.add('wrong');
      else b.classList.add('dim');
    });
    if (pick == null) { ans.className = 'ans'; ans.innerHTML = ''; again.style.display = 'none'; return; }
    const good = pick === q.ans;
    ans.className = 'ans show ' + (good ? 'ok' : 'no');
    ans.innerHTML =
      `<div class="vt">${good ? '✓ 答對了' : '✗ 再想想'}　正解：${LET[q.ans]}</div>` +
      (q.key ? `<div class="keyline"><b>解題關鍵｜</b>${q.key}</div>` : '') +
      `<div>${q.why}</div>`;
    again.style.display = '';
  }
  paint();
  return box;
}

/* =======================================================
   互動實驗區
   ======================================================= */
function labShell(title, hint) {
  const l = el('div', 'lab');
  const h = el('div', 'lab-head');
  h.innerHTML = `<span class="dotlive"></span><span>${esc(title)}</span>` +
    (hint ? `<span class="hint">${esc(hint)}</span>` : '');
  l.appendChild(h);
  const body = el('div', 'lab-body'); l.appendChild(body);
  return { root: l, body: body, ctrl: () => { const c = el('div', 'lab-ctrl'); l.appendChild(c); return c; } };
}

/* --- 地球內部構造：熱點 --- */
const EARTH_HOT = [
  { x: 46, y: 43, n: '地核', d: '地球最內層，主要由<b>鐵、鎳</b>等金屬組成，密度最大。', c: '金屬（鐵、鎳）', den: '大', th: '約 3470 km' },
  { x: 57, y: 35, n: '地函', d: '介於地殼與地核之間，主要由岩石（<b>橄欖岩</b>）組成。軟流圈就位在地函裡。', c: '岩石（橄欖岩）', den: '中', th: '約 2900 km' },
  { x: 83, y: 35, n: '大陸地殼', d: '地殼的一種，主要由<b>花岡岩</b>組成，<b>較厚但密度最小</b>。', c: '岩石（花岡岩）', den: '最小', th: '約 40 km' },
  { x: 83, y: 53, n: '海洋地殼', d: '地殼的一種，主要由<b>玄武岩</b>組成，<b>較薄但密度較大</b>，推擠時會隱沒到大陸地殼下方。', c: '岩石（玄武岩）', den: '小', th: '約 7 km' },
  { x: 57, y: 65, n: '岩石圈', d: '<b>地殼＋地函最上部</b>，為固態岩石。岩石圈的碎塊就是<b>板塊</b>，會隨軟流圈流動而移動。', c: '地殼＋小部分地函', den: '—', th: '約 100 km' },
  { x: 51, y: 78, n: '軟流圈', d: '位於<b>地函</b>，呈熔融狀態、具可塑性與流動性，有<b>熱對流</b>現象，會帶動板塊移動。', c: '屬於地函', den: '—', th: '約 150 km' }
];
function labEarth(host) {
  const s = labShell('互動剖面圖　點選圓點查看各層', '共 6 個標籤');
  const grid = el('div', 'hotlab');
  const w = el('div', 'hotwrap');
  const img = el('img'); img.src = imageUrl("earth-section"); img.alt = '地球內部構造剖面';
  w.appendChild(img);
  const info = el('div', 'hotinfo empty');
  info.innerHTML = `<div class="hn">點選圖上的圓點</div><div class="hd">由外而內：地殼 → 地函 → 地核；另外依物理性質分為岩石圈與軟流圈。</div>`;
  EARTH_HOT.forEach((h, i) => {
    const d = el('button', 'hot', String(i + 1));
    d.style.left = h.x + '%'; d.style.top = h.y + '%';
    d.onclick = () => {
      $$('.hot', w).forEach(x => x.classList.remove('on'));
      d.classList.add('on');
      info.className = 'hotinfo';
      info.innerHTML = `<div class="hn">${h.n}</div><div class="hd">${h.d}</div>
        <div class="hmeta"><span>組成：<b>${h.c}</b></span><span>密度：<b>${h.den}</b></span><span>厚度：<b>${h.th}</b></span></div>`;
    };
    w.appendChild(d);
  });
  grid.appendChild(w); grid.appendChild(info);
  s.body.appendChild(grid);
  host.appendChild(s.root);
}

/* --- 板塊分離 / 推擠 --- */
function labPlates(host, mode) {
  const diverge = mode === 'diverge';
  const name = diverge ? 'ov-divergent' : 'ov-convergent';
  const s = labShell(diverge ? '板塊互相分離　拖動滑桿把板塊拉開' : '板塊互相推擠　拖動滑桿把板塊推在一起',
                     diverge ? '熱對流上升處' : '熱對流下降處');
  const st = el('div', 'platestage');
  const sp = el('img', 'spacer'); sp.src = imageUrl(name);
  const L = el('img', 'h'); L.src = imageUrl(name + "-L");
  const R = el('img', 'h'); R.src = imageUrl(name + "-R");
  st.appendChild(sp); st.appendChild(L); st.appendChild(R);
  s.body.appendChild(st);

  const note = el('div', 'fault-note');
  note.innerHTML = diverge
    ? `<span class="pill hot">軟流圈熱對流上升</span><span class="pill">海底 → 中洋脊</span><span class="pill">陸地 → 裂谷</span><span class="pill">生成新海洋地殼</span>`
    : `<span class="pill hot">軟流圈熱對流下降</span><span class="pill">海洋 × 大陸 → 海溝＋山脈＋火山</span><span class="pill">大陸 × 大陸 → 高聳山脈</span>`;
  s.body.appendChild(note);

  const c = s.ctrl();
  c.appendChild(el('span', 'ctrl-label', diverge ? '張裂程度' : '推擠程度'));
  const r = el('input'); r.type = 'range'; r.min = 0; r.max = 100; r.value = 0;
  const out = el('span', 'readout', '0 %');
  const play = el('button', 'btn', '▶ 自動播放');
  c.appendChild(r); c.appendChild(out); c.appendChild(play);

  const MAX = diverge ? 13 : 7;
  function set(v) {
    const t = v / 100 * MAX;
    L.style.transform = `translateX(${-t}%)`;
    R.style.transform = `translateX(${t}%)`;
    out.textContent = Math.round(v) + ' %';
  }
  r.oninput = () => { stop(); set(+r.value); };
  let raf = null, t0 = 0;
  function stop() { if (raf) cancelAnimationFrame(raf); raf = null; play.textContent = '▶ 自動播放'; }
  play.onclick = () => {
    if (raf) { stop(); return; }
    play.textContent = '❚❚ 暫停'; t0 = performance.now();
    (function loop(now) {
      const p = ((now - t0) / 2600) % 2;
      const v = (p < 1 ? p : 2 - p) * 100;
      r.value = v; set(v);
      raf = requestAnimationFrame(loop);
    })(t0);
  };
  set(0);
  host.appendChild(s.root);
  host._stops = (host._stops || []).concat(stop);
}

/* --- 熱對流動畫 --- */
function labFault(host) {
  const s = labShell('三種斷層　拖動滑桿，讓岩塊沿著斷層面真的滑動', '使用講義原圖切層');
  let idx = 0;

  const seg = el('div', 'seg');
  FAULTS.forEach((f, i) => {
    const b = el('button', i === 0 ? 'on' : '', f.name);
    b.onclick = () => { idx = i; $$('button', seg).forEach(x => x.classList.remove('on')); b.classList.add('on'); load(); };
    seg.appendChild(b);
  });
  const segwrap = el('div'); segwrap.style.cssText = 'display:flex;justify-content:center;margin-bottom:18px';
  segwrap.appendChild(seg);
  s.body.appendChild(segwrap);

  const st = el('div', 'faultstage');
  const sp = el('img', 'spacer'); const A = el('img', 'fl a'); const B = el('img', 'fl b');
  st.appendChild(sp); st.appendChild(A); st.appendChild(B);
  s.body.appendChild(st);

  const info = el('div', 'fault-note');
  s.body.appendChild(info);

  const c = s.ctrl();
  c.appendChild(el('span', 'ctrl-label', '← 未錯動　｜　已錯動 →'));
  const r = el('input'); r.type = 'range'; r.min = 0; r.max = 100; r.value = 100;
  const out = el('span', 'readout', '錯動 100%');
  const play = el('button', 'btn', '▶ 播放錯動');
  c.appendChild(r); c.appendChild(out); c.appendChild(play);

  function set(v) {
    const f = FAULTS[idx], m = FAULTMETA[f.k];
    const k = (100 - v) / 100;           // 0 = 講義原圖(已錯動)，1 = 還原成未錯動
    const dx = m.dx / m.w * 100 * k, dy = m.dy / m.h * 100 * k;
    B.style.transform = `translate(${dx}%, ${dy}%)`;
    out.textContent = '錯動 ' + Math.round(v) + '%';
  }
  function load() {
    const f = FAULTS[idx];
    sp.src = imageUrl(f.file + "-a");
    A.src = imageUrl(f.file + "-a");
    B.src = imageUrl(f.file + "-b");
    info.innerHTML = `<span class="pill hot">${f.name}</span>
      <span class="pill">作用力：${f.force}</span>
      <span class="pill">${f.move}</span>
      <span class="pill">常見於：${f.where}</span>`;
    r.value = 100; set(100);
  }
  r.oninput = () => { stop(); set(+r.value); };
  let raf = null;
  function stop() { if (raf) cancelAnimationFrame(raf); raf = null; play.textContent = '▶ 播放錯動'; }
  play.onclick = () => {
    if (raf) { stop(); return; }
    play.textContent = '❚❚ 暫停'; const t0 = performance.now();
    (function loop(now) {
      const p = ((now - t0) / 3000) % 2;
      const v = (p < 1 ? p : 2 - p) * 100;
      r.value = v; set(v);
      raf = requestAnimationFrame(loop);
    })(t0);
  };
  load();
  host.appendChild(s.root);
  host._stops = (host._stops || []).concat(stop);

  const tbl = el('div', 'tablewrap');
  tbl.innerHTML = `<table class="t"><thead><tr><th>種類</th><th>作用力</th><th>上盤相對移動</th><th>常見位置</th></tr></thead>
   <tbody>
   <tr><td>正斷層</td><td>拉張力</td><td>相對<b>向下</b></td><td>板塊互相分離處</td></tr>
   <tr><td>逆斷層</td><td>擠壓力</td><td>相對<b>向上</b></td><td>板塊互相推擠處（臺灣多屬此類）</td></tr>
   <tr><td>平移斷層</td><td>水平作用力</td><td>水平錯動，無明顯上下位移</td><td>板塊水平錯動處</td></tr>
   </tbody></table>`;
  host.appendChild(tbl);
}

/* --- 地震名詞：熱點 --- */
const QUAKE_HOT = [
  { x: 41, y: 44, n: '震央', d: '<b>震源正上方的地表位置</b>。離震央越近，震度通常越大。' },
  { x: 41, y: 64, n: '震源', d: '地底下<b>岩層破裂、錯動而引發地震之處</b>，也是地震波開始傳出的地方。' },
  { x: 49, y: 55, n: '震源深度', d: '<b>震源到震央（地表）的垂直距離</b>。深度越淺，地表感受到的搖晃通常越劇烈。' },
  { x: 75, y: 74, n: '地震波', d: '由震源向四面八方傳出的波動。科學家就是用它來探測地球內部構造。' }
];
function labQuake(host) {
  const s = labShell('地震名詞互動圖　點選圓點查看定義', '共 4 個名詞');
  const grid = el('div', 'hotlab');
  const w = el('div', 'hotwrap');
  const img = el('img'); img.src = imageUrl("quake-terms"); img.alt = '震源與震央';
  w.appendChild(img);
  const info = el('div', 'hotinfo empty');
  info.innerHTML = `<div class="hn">點選圖上的圓點</div><div class="hd">震源在地底、震央在地表，兩者位置不同——這是考試最常考的區別。</div>`;
  QUAKE_HOT.forEach((h, i) => {
    const d = el('button', 'hot', String(i + 1));
    d.style.left = h.x + '%'; d.style.top = h.y + '%';
    d.onclick = () => {
      $$('.hot', w).forEach(x => x.classList.remove('on')); d.classList.add('on');
      info.className = 'hotinfo';
      info.innerHTML = `<div class="hn">${h.n}</div><div class="hd">${h.d}</div>`;
    };
    w.appendChild(d);
  });
  grid.appendChild(w); grid.appendChild(info);
  s.body.appendChild(grid);
  host.appendChild(s.root);
}

/* --- 兩張世界地圖疊合 --- */
function labMaps(host) {
  const s = labShell('全球板塊分布 vs 地震火山分布　拖動滑桿疊合兩張圖', '海岸線與觀測資料');
  const w = el('div', 'maplay');
  const a = el('img'); a.src = imageUrl("plates-world");
  const b = el('img', 'ov'); b.src = imageUrl("quake-volcano-map");
  w.appendChild(a); w.appendChild(b);
  s.body.appendChild(w);
  const note = el('div', 'fault-note');
  note.innerHTML = `<span class="pill">左：全球板塊分布圖</span>
    <span class="pill">右：全球地震及火山分布圖</span><span class="pill hot">兩者大致相符</span>`;
  s.body.appendChild(note);

  const c = s.ctrl();
  c.appendChild(el('span', 'ctrl-label', '板塊分布'));
  const r = el('input'); r.type = 'range'; r.min = 0; r.max = 100; r.value = 50;
  const lab2 = el('span', 'ctrl-label', '地震火山分布');
  c.appendChild(r); c.appendChild(lab2);
  r.oninput = () => { b.style.opacity = r.value / 100; };
  b.style.opacity = .5;
  host.appendChild(s.root);

  host.appendChild(renderBlock({ t: 'callout', tone: 'key', title: '結論',
    body: '板塊交界處的岩層受到巨大作用力，常產生<b>斷裂、錯動</b>，造成頻繁的<b>地震</b>；附近也常有<b>火山</b>活動。所以全球地震與火山的位置，大多分布在板塊交界處。' }));
}

/* --- 圖像記憶 --- */
function renderMemory(page, host) {
  const s = labShell('圖像記憶　先看圖回想，再點卡片對答案', '點卡片顯示答案');
  const figs = [page.fig, page.fig2, page.fig3].filter(Boolean);
  const fw = el('div'); fw.style.cssText = 'display:flex;gap:14px;flex-wrap:wrap;justify-content:center';
  figs.forEach(f => {
    const im = el('img'); im.src = imageUrl(f);
    im.style.cssText = 'max-width:100%;border:1px solid var(--line-2);border-radius:9px;cursor:zoom-in;' +
      (figs.length > 1 ? 'flex:1 1 240px;min-width:220px;' : (page.figHalf ? 'max-width:320px;' : ''));
    im.onclick = () => lightbox(im.src, page.title);
    fw.appendChild(im);
  });
  s.body.appendChild(fw);

  const g = el('div', 'memgrid'); g.style.marginTop = '20px';
  page.cards.forEach((c, i) => {
    const b = el('button', 'memcard');
    b.innerHTML = `<span class="mn">${c.n}</span><span class="mq">${c.q}</span>
      <span class="ma">${c.a}</span><span class="tapme">點我看答案</span>`;
    b.onclick = () => { b.classList.toggle('open'); markSeen(page); };
    g.appendChild(b);
  });
  s.body.appendChild(g);

  const c = s.ctrl();
  const all = el('button', 'btn', '全部顯示');
  const none = el('button', 'btn sec', '全部隱藏');
  all.onclick = () => $$('.memcard', g).forEach(x => x.classList.add('open'));
  none.onclick = () => $$('.memcard', g).forEach(x => x.classList.remove('open'));
  c.appendChild(all); c.appendChild(none);
  host.appendChild(s.root);
}

/* =======================================================
   封面
   ======================================================= */
function renderCover(page, host) {
  const c = el('div', 'cover');
  c.innerHTML = `<div class="ck">${esc(BOOK.subject)}　${esc(BOOK.unit)}</div>
    <h1>${esc(page.title)}</h1><p>${page.lede}</p>
    <div class="meta"><span>原書 P.${bookPage(1)}–P.${bookPage(27)}</span>
      <span>${PAGES.length} 個互動單頁</span><span>4 個重點 ＋ 會考培訓</span></div>`;
  const b = el('button', 'startbtn', '開始學習 →');
  b.onclick = () => go(1);
  c.appendChild(b);
  host.appendChild(c);

  const g = el('div', 'covergrid');
  CHAPTERS.slice(1).forEach(ch => {
    const card = el('button', 'cg');
    const first = PAGES.findIndex(p => p.ch.id === ch.id);
    const done = ch.pages.filter(p => store.seen[p.id]).length;
    card.innerHTML = `<div class="cn" style="color:${ch.accent}">${esc(ch.short)}</div>
      <div class="ch2">${esc(ch.label.replace(/^重點\s*\d\s*/, ''))}</div>
      <div class="cd">${ch.pages.length} 頁　${done ? '已讀 ' + done : '尚未開始'}</div>`;
    card.onclick = () => go(first);
    g.appendChild(card);
  });
  host.appendChild(g);
}

/* =======================================================
   渲染主頁
   ======================================================= */
function markSeen(page) {
  if (!store.seen[page.id]) { store.seen[page.id] = 1; save(); syncSidebar(); }
}

function render() {
  const p = PAGES[cur];
  const stage = $('#stage');
  (window.__animNodes || []).forEach(n => { try { n._stop && n._stop(); } catch (e) {} });
  window.__animNodes = [];
  (stage._stops || []).forEach(f => { try { f(); } catch (e) {} });
  stage._stops = [];
  stage.innerHTML = '';
  const sheet = el('div', 'sheet');
  sheet._stops = [];
  document.documentElement.style.setProperty('--accent', p.ch.accent);

  if (p.kind === 'cover') {
    renderCover(p, sheet);
  } else {
    const k = el('div', 'pg-kicker');
    k.innerHTML = `<span class="tag">${esc(p.ch.short)}</span>
      <span class="src">講義 P.${bookPage(p.src)}　·　第 ${cur + 1} / ${PAGES.length} 頁</span>`;
    sheet.appendChild(k);
    sheet.appendChild(el('h1', 'pg-title', esc(p.title)));
    if (p.lede) sheet.appendChild(el('p', 'pg-lede', p.lede));

    if (p.kind === 'memory') renderMemory(p, sheet);
    if (p.kind === 'lab') {
      if (p.lab === 'earth') labEarth(sheet);
      if (p.lab === 'diverge') labPlates(sheet, 'diverge');
      if (p.lab === 'converge') labPlates(sheet, 'converge');
      if (p.lab === 'fault') labFault(sheet);
      if (p.lab === 'quake') labQuake(sheet);
      if (p.lab === 'maps') labMaps(sheet);
    }
    (p.blocks || []).forEach(b => sheet.appendChild(renderBlock(b)));
    if (p.quiz) renderQuiz(p, sheet);
  }

  /* 上下頁 */
  const nav = el('div', 'pagenav');
  const prev = el('button', 'pn');
  if (cur > 0) {
    prev.innerHTML = `<span class="dir">← 上一頁</span><span class="nm">${esc(PAGES[cur - 1].title)}</span>`;
    prev.onclick = () => go(cur - 1);
  } else { prev.disabled = true; prev.innerHTML = `<span class="dir">← 上一頁</span><span class="nm">已是第一頁</span>`; }
  const next = el('button', 'pn next');
  if (cur < PAGES.length - 1) {
    next.innerHTML = `<span class="dir">下一頁 →</span><span class="nm">${esc(PAGES[cur + 1].title)}</span>`;
    next.onclick = () => go(cur + 1);
  } else { next.disabled = true; next.innerHTML = `<span class="dir">下一頁 →</span><span class="nm">已是最後一頁</span>`; }
  nav.appendChild(prev); nav.appendChild(next);
  sheet.appendChild(nav);

  stage.appendChild(sheet);
  stage._stops = sheet._stops.concat(stage._stops || []);

  $('#crumb').innerHTML = `${esc(p.ch.label)}　<b>${esc(p.title)}</b>`;
  $('#srcchip').textContent = '講義 P.' + bookPage(p.src);
  syncSidebar();
  if (p.kind !== 'quiz') markSeen(p);
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function go(i) {
  if (i < 0 || i >= PAGES.length) return;
  cur = i;
  history.replaceState(null, '', '#' + PAGES[i].id);
  render();
}

/* =======================================================
   lightbox / 原頁檢視
   ======================================================= */
function lightbox(src, cap) {
  const o = $('#lb');
  setLightboxZoom(false);
  $('#lbimg').src = src;
  $('#lbcap').textContent = cap || '';
  o.classList.add('on');
}
function setLightboxZoom(enlarged) {
  const view = $('#lbview');
  view.classList.toggle('enlarged', enlarged);
  view.scrollTo(0, 0);
  const button = $('#lbzoom');
  button.setAttribute('aria-pressed', String(enlarged));
  button.textContent = enlarged ? '縮小' : '放大';
}
let scanPage = 1;
function openScan(n) {
  scanPage = n;
  const o = $('#scan'); o.classList.add('on'); paintScan();
}
function paintScan() {
  $('#scanimg').src = 'pages/p' + String(scanPage).padStart(2, '0') + '.webp';
  $('#scancap').textContent = `原始講義　第 ${bookPage(scanPage)} 頁　（掃描第 ${scanPage} / ${BOOK.totalScans} 頁）`;
  $('#scanprev').disabled = scanPage <= 1;
  $('#scannext').disabled = scanPage >= BOOK.totalScans;
}

/* =======================================================
   啟動
   ======================================================= */
function closeDrawer() { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('on'); }

function init() {
  buildSidebar();
  const h = location.hash.replace('#', '');
  const i = PAGES.findIndex(p => p.id === h);
  cur = i >= 0 ? i : 0;
  render();

  $('#burger').onclick = () => { $('#sidebar').classList.toggle('open'); $('#scrim').classList.toggle('on'); };
  $('#scrim').onclick = closeDrawer;
  $('#srcchip').onclick = () => openScan(PAGES[cur].src);
  $('#lb').onclick = e => { if (e.target === $('#lb')) $('#lb').classList.remove('on'); };
  $('#lbzoom').onclick = () => setLightboxZoom(!$('#lbview').classList.contains('enlarged'));
  $('#lbx').onclick = () => $('#lb').classList.remove('on');
  $('#scanx').onclick = () => $('#scan').classList.remove('on');
  $('#scanprev').onclick = e => { e.stopPropagation(); if (scanPage > 1) { scanPage--; paintScan(); } };
  $('#scannext').onclick = e => { e.stopPropagation(); if (scanPage < BOOK.totalScans) { scanPage++; paintScan(); } };
  $('#scan').onclick = e => { if (e.target.id === 'scan') $('#scan').classList.remove('on'); };
  $('#resetall').onclick = () => {
    if (confirm('確定要清除所有學習紀錄（已讀頁面與作答結果）嗎？')) {
      store = { seen: {}, quiz: {} }; save(); render();
    }
  };

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if ($('#lb').classList.contains('on') || $('#scan').classList.contains('on')) {
      if (e.key === 'Escape') { $('#lb').classList.remove('on'); $('#scan').classList.remove('on'); }
      if ($('#scan').classList.contains('on')) {
        if (e.key === 'ArrowLeft' && scanPage > 1) { scanPage--; paintScan(); }
        if (e.key === 'ArrowRight' && scanPage < BOOK.totalScans) { scanPage++; paintScan(); }
      }
      return;
    }
    if (e.key === 'ArrowRight') go(cur + 1);
    if (e.key === 'ArrowLeft') go(cur - 1);
  });
}
window.__u2 = { pages: PAGES, go: go, store: () => store };
document.addEventListener('DOMContentLoaded', init);
})();
