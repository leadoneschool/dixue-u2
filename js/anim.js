/* ===== 專業級 SVG 動畫：中洋脊張裂、隱沒帶、斷層錯動 =====
   全部以向量繪製，幾何由程式即時計算，不會破圖。 */
(function (root) {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const S = (t, a) => { const n = document.createElementNS(NS, t); for (const k in (a || {})) n.setAttribute(k, a[k]); return n; };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function mix(c1, c2, t) {
  const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [a, b] = [p(c1), p(c2)];
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
}

/* ---------- 外殼：標題列 + 舞台 + 控制列 ---------- */
function shell(title, hint) {
  const wrap = el('div', 'anim');
  const head = el('div', 'anim-head');
  head.innerHTML = `<span class="anim-dot"></span><span>${title}</span>` +
                   (hint ? `<span class="anim-hint">${hint}</span>` : '');
  wrap.appendChild(head);
  const stage = el('div', 'anim-stage');
  wrap.appendChild(stage);
  const cap = el('div', 'anim-cap');
  wrap.appendChild(cap);
  const ctrl = el('div', 'anim-ctrl');
  wrap.appendChild(ctrl);
  return { wrap, stage, cap, ctrl };
}

function controls(ctrl, api) {
  const play = el('button', 'btn', '❚❚ 暫停');
  const slow = el('div', 'seg');
  [['0.5×', .5], ['1×', 1], ['2×', 2]].forEach(([lab, v], i) => {
    const b = el('button', i === 1 ? 'on' : '', lab);
    b.onclick = () => { api.speed(v); Array.from(slow.children).forEach(x => x.classList.remove('on')); b.classList.add('on'); };
    slow.appendChild(b);
  });
  const rst = el('button', 'btn sec', '↺ 重播');
  play.onclick = () => { play.textContent = api.toggle() ? '❚❚ 暫停' : '▶ 播放'; };
  rst.onclick = () => { api.reset(); play.textContent = '❚❚ 暫停'; };
  ctrl.appendChild(play); ctrl.appendChild(slow); ctrl.appendChild(rst);
  const sc = el('span', 'anim-stage-label');
  ctrl.appendChild(sc);
  return sc;
}

/* 驅動器 */
function driver(step) {
  let raf = null, t = 0, last = 0, sp = 1, on = true;
  function loop(now) {
    if (!last) last = now;
    const dt = Math.min(0.05, (now - last) / 1000) * sp;
    last = now;
    if (on) t += dt;
    step(t);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
  return {
    toggle() { on = !on; return on; },
    speed(v) { sp = v; },
    reset() { t = 0; on = true; step(0); },
    stop() { if (raf) cancelAnimationFrame(raf); raf = null; }
  };
}

/* =========================================================
   1) 中洋脊：板塊張裂 → 岩漿上升 → 噴發 → 新海洋地殼
========================================================= */
function ridge() {
  const W = 1000, H = 540, AX = 500;
  const { wrap, stage, cap, ctrl } = shell('中洋脊　板塊張裂與海底擴張', '向量動畫');
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}` });
  svg.setAttribute('class', 'anim-svg');
  stage.appendChild(svg);

  const defs = S('defs');
  defs.innerHTML = `
   <linearGradient id="rg-sea" x1="0" y1="0" x2="0" y2="1">
     <stop offset="0" stop-color="#8fc6e6"/><stop offset="1" stop-color="#2f6f96"/></linearGradient>
   <linearGradient id="rg-ast" x1="0" y1="0" x2="0" y2="1">
     <stop offset="0" stop-color="#e2602b"/><stop offset=".55" stop-color="#f0903a"/>
     <stop offset="1" stop-color="#f7c65a"/></linearGradient>
   <radialGradient id="rg-magma"><stop offset="0" stop-color="#fff2b0"/>
     <stop offset=".45" stop-color="#ff8a2b"/><stop offset="1" stop-color="#e03c15" stop-opacity=".15"/></radialGradient>
   <marker id="rg-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5.5" markerHeight="5.5"
     orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#fff"/></marker>
   <marker id="rg-ary" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5"
     orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#ffe36b"/></marker>
   <clipPath id="rg-scene"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>`;
  svg.appendChild(defs);
  const scene = S('g', { 'clip-path': 'url(#rg-scene)' });
  svg.appendChild(scene);

  const topY = x => 212 + 58 * Math.pow(clamp(Math.abs(x - AX) / 430, 0, 1), .62);
  const botY = x => topY(x) + 42 + 38 * clamp(Math.abs(x - AX) / 430, 0, 1);

  // 軟流圈
  scene.appendChild(S('rect', { x: 0, y: 300, width: W, height: H - 300, fill: 'url(#rg-ast)' }));
  // 海水
  const seaPath = ['M0,46', `L${W},46`, `L${W},${botY(W)}`];
  for (let x = W; x >= 0; x -= 10) seaPath.push(`L${x},${topY(x)}`);
  scene.appendChild(S('path', { d: seaPath.join(' ') + ' Z', fill: 'url(#rg-sea)' }));

  // 熱對流
  const cellL = S('path', { d: 'M470,330 C470,318 420,312 380,322 C318,338 300,392 316,428 C332,462 404,470 450,448 C472,437 470,400 470,372',
    fill: 'none', stroke: '#ffe36b', 'stroke-width': 4, 'stroke-linecap': 'round',
    'stroke-dasharray': '10 14', opacity: .95, 'marker-end': 'url(#rg-ary)' });
  const cellR = S('path', { d: 'M530,330 C530,318 580,312 620,322 C682,338 700,392 684,428 C668,462 596,470 550,448 C528,437 530,400 530,372',
    fill: 'none', stroke: '#ffe36b', 'stroke-width': 4, 'stroke-linecap': 'round',
    'stroke-dasharray': '10 14', opacity: .95, 'marker-end': 'url(#rg-ary)' });
  scene.appendChild(cellL); scene.appendChild(cellR);

  // 岩漿囊
  scene.appendChild(S('ellipse', { cx: AX, cy: 322, rx: 96, ry: 54, fill: 'url(#rg-magma)' }));
  const plume = S('path', { fill: 'url(#rg-magma)', opacity: .95 });
  scene.appendChild(plume);

  // 地殼底層（避免兩側留白）
  const baseCrust = S('path', { fill: '#454c57' });
  scene.appendChild(baseCrust);
  // 地殼條帶
  const gCrust = S('g');
  scene.appendChild(gCrust);
  const N = 18, SPAN = 505;
  const stripes = [];
  for (let i = 0; i < N; i++) {
    for (const sgn of [-1, 1]) {
      const p = S('path', { stroke: '#2b3038', 'stroke-width': .8 });
      gCrust.appendChild(p);
      stripes.push({ node: p, i, sgn });
    }
  }
  function band(x1, x2) {
    const d = [`M${x1},${topY(x1)}`];
    for (let x = x1; x <= x2; x += 6) d.push(`L${x},${topY(x)}`);
    d.push(`L${x2},${topY(x2)}`);
    for (let x = x2; x >= x1; x -= 6) d.push(`L${x},${botY(x)}`);
    d.push(`L${x1},${botY(x1)}`, 'Z');
    return d.join(' ');
  }

  // 噴發閃光
  const flash = S('circle', { cx: AX, cy: 214, r: 0, fill: '#ffd86b', opacity: 0 });
  scene.appendChild(flash);
  const lava = S('path', { fill: '#ff6a2a', opacity: 0 });
  scene.appendChild(lava);

  // 板塊移動箭頭
  const arL = S('path', { d: `M424,250 L286,258`, stroke: '#fff', 'stroke-width': 5,
    'stroke-linecap': 'round', 'marker-end': 'url(#rg-ar)', opacity: .95 });
  const arR = S('path', { d: `M576,250 L714,258`, stroke: '#fff', 'stroke-width': 5,
    'stroke-linecap': 'round', 'marker-end': 'url(#rg-ar)', opacity: .95 });
  scene.appendChild(arL); scene.appendChild(arR);

  // 標示
  const lab = (x, y, t, cls) => {
    const g = S('g', { class: 'anim-lab ' + (cls || '') });
    const txt = S('text', { x, y, 'text-anchor': 'middle' }); txt.textContent = t;
    g.appendChild(txt); svg.appendChild(g); return g;
  };
  lab(AX, 186, '中洋脊');
  lab(120, 120, '海　水', 'light');
  lab(AX, 352, '岩漿上升', 'light');
  lab(AX, 500, '軟流圈熱對流上升', 'light');
  lab(118, 252, '老', 'dark'); lab(882, 252, '老', 'dark');
  lab(AX - 92, 232, '新', 'dark'); lab(AX + 92, 232, '新', 'dark');

  // 年齡圖例
  const lg = S('g');
  lg.innerHTML = `<rect x="700" y="76" width="210" height="14" rx="7" fill="url(#rg-age)"/>`;
  const ageGrad = S('linearGradient', { id: 'rg-age', x1: '0', y1: '0', x2: '1', y2: '0' });
  ageGrad.innerHTML = `<stop offset="0" stop-color="#e2743a"/><stop offset="1" stop-color="#454c57"/>`;
  defs.appendChild(ageGrad);
  const t1 = S('text', { x: 700, y: 68, class: 'anim-leg' }); t1.textContent = '新';
  const t2 = S('text', { x: 910, y: 68, class: 'anim-leg', 'text-anchor': 'end' }); t2.textContent = '老';
  const t3 = S('text', { x: 805, y: 68, class: 'anim-leg', 'text-anchor': 'middle' }); t3.textContent = '海洋地殼年齡';
  lg.appendChild(t1); lg.appendChild(t2); lg.appendChild(t3);
  svg.appendChild(lg);

  const STAGES = [
    '① 軟流圈熱對流上升，把兩個板塊往兩側拉開',
    '② 地殼被拉裂，底下的岩漿沿裂隙上升',
    '③ 岩漿噴出海底，冷卻凝固成新的海洋地殼',
    '④ 新地殼不斷把舊地殼往外推 → 年齡由中洋脊向兩側遞增'
  ];
  const stageLabel = controls(ctrl, {
    toggle: () => drv.toggle(), speed: v => drv.speed(v), reset: () => drv.reset()
  });
  cap.textContent = '海底擴張：新的海洋地殼在中洋脊生成，再被推向兩側。';

  baseCrust.setAttribute('d', band(0, W));
  const drv = driver(t => {
    const cyc = 2.6;                      // 每 2.6 秒生成一條新地殼
    const phase = (t % cyc) / cyc;
    for (const s of stripes) {
      const age = ((s.i + phase) / N);
      const x1 = AX + s.sgn * age * SPAN;
      const x2 = AX + s.sgn * (age + 1 / N) * SPAN;
      const a = Math.min(x1, x2), b = Math.max(x1, x2);
      s.node.setAttribute('d', band(a, b));
      s.node.setAttribute('fill', mix('#e2743a', '#454c57', Math.pow(age, .55)));
    }
    // 岩漿脈動
    const pw = 16 + 7 * Math.sin(t * 5);
    plume.setAttribute('d', `M${AX - pw},322 C${AX - pw},268 ${AX - pw * .7},236 ${AX},216
      C${AX + pw * .7},236 ${AX + pw},268 ${AX + pw},322 Z`);
    // 噴發
    const e = phase < .18 ? 1 - phase / .18 : 0;
    flash.setAttribute('r', 8 + 42 * e); flash.setAttribute('opacity', .75 * e);
    lava.setAttribute('opacity', .9 * e);
    lava.setAttribute('d', `M${AX - 34},216 Q${AX},${206 - 26 * e} ${AX + 34},216 Q${AX},228 ${AX - 34},216 Z`);
    // 流線
    const off = -(t * 44) % 24;
    [cellL, cellR, arL, arR].forEach(n => n.setAttribute('stroke-dashoffset', off));
    arL.setAttribute('stroke-dasharray', '14 10'); arR.setAttribute('stroke-dasharray', '14 10');
    stageLabel.textContent = STAGES[Math.floor((t / cyc) % 4 * 1) % 4] || STAGES[0];
    stageLabel.textContent = STAGES[Math.min(3, Math.floor(phase * 4))];
  });
  wrap._stop = () => drv.stop();
  return wrap;
}

/* =========================================================
   2) 隱沒帶：海溝、熔融、火山噴發
========================================================= */
function subduction() {
  const W = 1000, H = 540;
  const SEA = 150, OCT = 290, OCTHK = 44, TRX = 540, LBASE = 408;
  const { wrap, stage, cap, ctrl } = shell('隱沒帶　海洋板塊沒入、岩漿上升、火山噴發', '向量動畫');
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}` });
  svg.setAttribute('class', 'anim-svg');
  stage.appendChild(svg);

  const defs = S('defs');
  defs.innerHTML = `
   <linearGradient id="sb-sky" x1="0" y1="0" x2="0" y2="1">
     <stop offset="0" stop-color="#dceaf2"/><stop offset="1" stop-color="#eef4f7"/></linearGradient>
   <linearGradient id="sb-sea" x1="0" y1="0" x2="0" y2="1">
     <stop offset="0" stop-color="#8fc6e6"/><stop offset="1" stop-color="#2f6f96"/></linearGradient>
   <linearGradient id="sb-ast" x1="0" y1="0" x2="0" y2="1">
     <stop offset="0" stop-color="#e2602b"/><stop offset="1" stop-color="#f7c65a"/></linearGradient>
   <linearGradient id="sb-cont" x1="0" y1="0" x2="0" y2="1">
     <stop offset="0" stop-color="#cba96c"/><stop offset="1" stop-color="#8e6c3c"/></linearGradient>
   <radialGradient id="sb-magma"><stop offset="0" stop-color="#fff0a8"/>
     <stop offset=".5" stop-color="#ff7f2a"/><stop offset="1" stop-color="#e03c15" stop-opacity="0"/></radialGradient>
   <marker id="sb-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5.5" markerHeight="5.5"
     orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#fff"/></marker>
   <clipPath id="sb-scene"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>`;
  svg.appendChild(defs);
  const scene = S('g', { 'clip-path': 'url(#sb-scene)' });
  svg.appendChild(scene);

  // 天空 / 軟流圈
  scene.appendChild(S('rect', { x: 0, y: 0, width: W, height: SEA + 4, fill: 'url(#sb-sky)' }));
  scene.appendChild(S('rect', { x: 0, y: SEA, width: W, height: H - SEA, fill: 'url(#sb-ast)' }));

  // 海水（含海溝凹陷）
  scene.appendChild(S('path', { d: `M0,${SEA} L${TRX + 46},${SEA} L${TRX + 10},248
     L${TRX},318 L${TRX - 26},${OCT} L0,${OCT} Z`, fill: 'url(#sb-sea)' }));

  // 隱沒板塊路徑
  const slabPath = S('path', { d: `M-60,${OCT} L${TRX - 20},${OCT} Q${TRX + 130},${OCT + 26} ${862},496`,
    fill: 'none', stroke: 'none' });
  scene.appendChild(slabPath);
  const slabLen = slabPath.getTotalLength();
  const gSlab = S('g');
  scene.appendChild(gSlab);
  const NSEG = 24, segs = [];
  for (let i = 0; i < NSEG; i++) {
    const n = S('path', { stroke: '#1d2128', 'stroke-width': 1 });
    gSlab.appendChild(n); segs.push({ node: n, i });
  }

  // 大陸岩石圈（蓋住部分隱沒板塊，呈現「沒入下方」）
  const landTop = `M${TRX + 2},318 L${TRX + 34},244 L${600},${SEA}
     L${646},132 Q${700},40 ${756},118 Q${812},176 ${872},136 L${W},128`;
  scene.appendChild(S('path', { d: `${landTop} L${W},${LBASE} Q${TRX + 150},${LBASE + 6} ${TRX + 2},318 Z`,
    fill: 'url(#sb-cont)', stroke: '#6f5326', 'stroke-width': 2 }));
  scene.appendChild(S('path', { d: `${landTop} L${W},${158} Q${860},168 ${800},188
     Q${740},92 ${684},150 L${620},${SEA + 8} L${600},${SEA} Z`, fill: '#6fa84a', opacity: .95 }));

  // 火山
  const VX = 712, VY = 52;
  const conduit = S('path', { d: `M${VX},${VY + 18} C${VX + 8},180 ${VX + 44},300 ${VX + 86},432`,
    fill: 'none', stroke: '#ff7a33', 'stroke-width': 7, 'stroke-linecap': 'round',
    'stroke-dasharray': '12 14', opacity: .9 });
  scene.appendChild(conduit);
  const conduitLen = conduit.getTotalLength();
  const blobs = [];
  for (let i = 0; i < 5; i++) {
    const c = S('circle', { r: 9, fill: 'url(#sb-magma)' });
    scene.appendChild(c); blobs.push(c);
  }
  scene.appendChild(S('path', { d: `M${VX - 62},142 L${VX - 15},${VY + 16} L${VX + 15},${VY + 16} L${VX + 62},142 Z`,
    fill: '#6b4f2c', stroke: '#4f3a1f', 'stroke-width': 2 }));
  const ash = S('path', { fill: '#b9b2a8', opacity: 0 });
  const lava2 = S('path', { fill: '#ff6a2a', opacity: 0 });
  scene.appendChild(ash); scene.appendChild(lava2);

  const arO = S('path', { d: `M170,${OCT - 44} L420,${OCT - 44}`, stroke: '#fff', 'stroke-width': 5,
    'stroke-linecap': 'round', 'stroke-dasharray': '14 10', 'marker-end': 'url(#sb-ar)' });
  const arC = S('path', { d: 'M958,300 L838,300', stroke: '#fff', 'stroke-width': 5,
    'stroke-linecap': 'round', 'stroke-dasharray': '14 10', 'marker-end': 'url(#sb-ar)' });
  scene.appendChild(arO); scene.appendChild(arC);

  const lab = (x, y, t, cls) => {
    const g = S('g', { class: 'anim-lab ' + (cls || '') });
    const n = S('text', { x, y, 'text-anchor': 'middle' }); n.textContent = t;
    g.appendChild(n); svg.appendChild(g); return g;
  };
  lab(TRX + 6, 212, '海　溝');
  lab(220, 210, '海　水', 'light');
  lab(250, 312, '海洋地殼', 'dark');
  lab(VX, 32, '火　山');
  lab(886, 94, '山脈（造山運動）');
  lab(150, 470, '軟流圈', 'light');
  lab(742, 492, '熔融成岩漿', 'light');
  lab(820, 250, '大陸地殼', 'dark');

  const STAGES = [
    '① 海洋地殼密度較大，被推擠時沒入大陸地殼下方',
    '② 隱沒處的海底被拉出狹長的凹陷 → 海溝',
    '③ 板塊下沉到高溫高壓處，部分岩石熔融成岩漿',
    '④ 岩漿上升噴出地表 → 火山；大陸岩層隆起 → 山脈'
  ];
  const stageLabel = controls(ctrl, {
    toggle: () => drv.toggle(), speed: v => drv.speed(v), reset: () => drv.reset()
  });
  cap.textContent = '海洋地殼與大陸地殼互相推擠：一次造出海溝、火山與山脈。';

  function slabBand(a, b) {
    const f = [], back = [];
    for (let s2 = a; s2 <= b; s2 += 6) {
      const q = slabPath.getPointAtLength(clamp(s2, 0, slabLen));
      const q2 = slabPath.getPointAtLength(clamp(s2 + 2, 0, slabLen));
      const dx = q2.x - q.x, dy = q2.y - q.y, L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L * OCTHK / 2, ny = dx / L * OCTHK / 2;
      f.push(`${q.x - nx},${q.y - ny}`);
      back.unshift(`${q.x + nx},${q.y + ny}`);
    }
    return f.length ? 'M' + f.join(' L') + ' L' + back.join(' L') + ' Z' : '';
  }

  const drv = driver(t => {
    const cyc = 3.2, phase = (t % cyc) / cyc, step = slabLen / NSEG;
    for (const sg of segs) {
      const d0 = ((sg.i + phase) % NSEG) * step;
      sg.node.setAttribute('d', slabBand(d0, d0 + step * .84));
      const deep = clamp((d0 - slabLen * .58) / (slabLen * .42), 0, 1);
      sg.node.setAttribute('fill', mix('#39404a', '#8f3a1c', deep));
    }
    const off = -(t * 52) % 26;
    [arO, arC, conduit].forEach(n => n.setAttribute('stroke-dashoffset', off));
    blobs.forEach((bb, i) => {
      const u = ((t * .34) + i / blobs.length) % 1;
      const q = conduit.getPointAtLength((1 - u) * conduitLen);
      bb.setAttribute('cx', q.x); bb.setAttribute('cy', q.y);
      bb.setAttribute('r', lerp(7, 13, u));
      bb.setAttribute('opacity', u < .08 ? u / .08 : (u > .92 ? (1 - u) / .08 : 1));
    });
    const e = phase < .22 ? 1 - phase / .22 : 0;
    ash.setAttribute('opacity', .5 * e);
    ash.setAttribute('d', `M${VX - 20},${VY + 14} C${VX - 74},${VY - 56 * e} ${VX + 74},${VY - 84 * e}
       ${VX + 22},${VY + 14} Z`);
    lava2.setAttribute('opacity', .95 * e);
    lava2.setAttribute('d', `M${VX - 16},${VY + 16} L${VX},${VY - 32 * e} L${VX + 16},${VY + 16} Z`);
    stageLabel.textContent = STAGES[Math.min(3, Math.floor(phase * 4))];
  });
  wrap._stop = () => drv.stop();
  return wrap;
}

/* =========================================================
   3) 斷層：正／逆（剖面） + 平移（俯視）
========================================================= */
function fault() {
  const W = 900, H = 440;
  const { wrap, stage, cap, ctrl } = shell('三種斷層　岩層沿斷層面錯動', '向量動畫');

  const seg = el('div', 'seg anim-seg');
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}` });
  svg.setAttribute('class', 'anim-svg');
  stage.appendChild(seg); stage.appendChild(svg);

  const defs = S('defs');
  defs.innerHTML = `<marker id="ft-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6"
     orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#d4342a"/></marker>
   <clipPath id="ft-fw"><path id="ft-fwp"/></clipPath>
   <clipPath id="ft-hw"><path id="ft-hwp"/></clipPath>
   <clipPath id="ft-scene"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>
   <pattern id="ft-face" width="10" height="10" patternUnits="userSpaceOnUse"
     patternTransform="rotate(38)">
     <rect width="10" height="10" fill="#7a5f3d"/>
     <line x1="0" y1="0" x2="0" y2="10" stroke="#5f4a2e" stroke-width="3"/></pattern>`;
  svg.appendChild(defs);
  const scene = S('g', { 'clip-path': 'url(#ft-scene)' });
  svg.appendChild(scene);

  const BANDS = [
    { y: 92,  h: 46, c: '#dcc89c' },
    { y: 138, h: 44, c: '#c09463' },
    { y: 182, h: 48, c: '#b4553c' },
    { y: 230, h: 46, c: '#d3b07a' },
    { y: 276, h: 60, c: '#9d7446' },
    { y: 336, h: 320, c: '#7d5c33' }
  ];
  const TOP = 92, BOT = 336;

  const gFW = S('g'), gHW = S('g');
  const fwStrata = S('g', { 'clip-path': 'url(#ft-fw)' });
  const hwStrata = S('g', { 'clip-path': 'url(#ft-hw)' });
  BANDS.forEach(b => {
    [[fwStrata], [hwStrata]].forEach(([host]) => {
      host.appendChild(S('rect', { x: -400, y: b.y, width: W + 800, height: b.h, fill: b.c }));
      host.appendChild(S('rect', { x: -400, y: b.y + b.h - 2, width: W + 800, height: 2, fill: '#00000022' }));
    });
  });
  const grassFW = S('rect', { x: -400, y: TOP - 10, width: W + 800, height: 12, fill: '#6fa84a' });
  const grassHW = S('rect', { x: -400, y: TOP - 10, width: W + 800, height: 12, fill: '#6fa84a' });
  fwStrata.insertBefore(grassFW, fwStrata.firstChild);
  hwStrata.insertBefore(grassHW, hwStrata.firstChild);
  gFW.appendChild(fwStrata); gHW.appendChild(hwStrata);
  const fwLine = S('path', { fill: 'none', stroke: '#3b2f22', 'stroke-width': 2.4 });
  const hwLine = S('path', { fill: 'none', stroke: 'none' });
  gFW.appendChild(fwLine); gHW.appendChild(hwLine);
  const faceFill = S('path', { fill: 'url(#ft-face)', stroke: '#4a3a22', 'stroke-width': 1.6 });
  scene.appendChild(faceFill);
  scene.appendChild(gFW); scene.appendChild(gHW);

  // 俯視（平移斷層）
  const gMap = S('g', { opacity: 0 });
  scene.appendChild(gMap);
  const mapA = S('g'), mapB = S('g');
  const mk = (host, y0, y1, fill) => {
    host.appendChild(S('rect', { x: -200, y: y0, width: W + 400, height: y1 - y0, fill }));
  };
  mk(mapA, 24, 215, '#8fbf63'); mk(mapB, 225, 416, '#7fb158');
  // 河流被錯開
  mapA.appendChild(S('path', { d: `M300,24 C330,110 290,168 320,215`, fill: 'none',
    stroke: '#4d9ad1', 'stroke-width': 13, 'stroke-linecap': 'round' }));
  mapB.appendChild(S('path', { d: `M320,225 C350,286 310,340 340,416`, fill: 'none',
    stroke: '#4d9ad1', 'stroke-width': 13, 'stroke-linecap': 'round' }));
  // 道路
  mapA.appendChild(S('rect', { x: -200, y: 146, width: W + 400, height: 9, fill: '#e8e2d6' }));
  mapB.appendChild(S('rect', { x: -200, y: 292, width: W + 400, height: 9, fill: '#e8e2d6' }));
  gMap.appendChild(mapA); gMap.appendChild(mapB);
  gMap.appendChild(S('rect', { x: -200, y: 215, width: W + 400, height: 10, fill: '#44352a' }));
  const mapLab = S('g');
  const ml = (x, y, t) => { const g = S('g', { class: 'anim-lab' });
    const n = S('text', { x, y, 'text-anchor': 'middle' }); n.textContent = t;
    g.appendChild(n); mapLab.appendChild(g); };
  ml(122, 206, '斷層線'); ml(566, 70, '河流被錯開'); ml(116, 52, '俯　視');
  gMap.appendChild(mapLab);

  // 作用力箭頭
  const f1 = S('path', { stroke: '#d4342a', 'stroke-width': 7, 'stroke-linecap': 'round',
    'marker-end': 'url(#ft-ar)', fill: 'none' });
  const f2 = S('path', { stroke: '#d4342a', 'stroke-width': 7, 'stroke-linecap': 'round',
    'marker-end': 'url(#ft-ar)', fill: 'none' });
  scene.appendChild(f1); scene.appendChild(f2);

  const lab = (x, y, t, cls) => {
    const g = S('g', { class: 'anim-lab ' + (cls || '') });
    const n = S('text', { x, y, 'text-anchor': 'middle' }); n.textContent = t;
    g.appendChild(n); svg.appendChild(g); return g;
  };
  const lFW = lab(160, 66, '下盤'), lHW = lab(742, 66, '上盤'), lPL = lab(0, 0, '斷層面');

  const TYPES = {
    normal:  { name: '正斷層', force: '拉張力', move: '上盤相對向下', dip: 62, dir: 1,  where: '板塊互相分離處' },
    reverse: { name: '逆斷層', force: '擠壓力', move: '上盤相對向上', dip: 36, dir: -1, where: '板塊互相推擠處（臺灣多屬此類）' },
    strike:  { name: '平移斷層', force: '水平作用力', move: '兩側岩層水平錯動', dip: 90, dir: 0, where: '板塊水平錯動處' }
  };
  let cur = 'normal';
  Object.keys(TYPES).forEach((k, i) => {
    const b = el('button', i === 0 ? 'on' : '', TYPES[k].name);
    b.onclick = () => { cur = k; Array.from(seg.children).forEach(x => x.classList.remove('on')); b.classList.add('on'); drv.reset(); };
    seg.appendChild(b);
  });

  const stageLabel = controls(ctrl, {
    toggle: () => drv.toggle(), speed: v => drv.speed(v), reset: () => drv.reset()
  });

  const CX = 455;
  function faultLineX(y, dipDeg) {
    const th = dipDeg * Math.PI / 180;
    return CX + (y - (TOP + BOT) / 2) / Math.tan(th);
  }

  const drv = driver(t => {
    const T = TYPES[cur];
    const cyc = 3.4;
    const ph = (t % cyc) / cyc;
    const grow = ph < .55 ? ph / .55 : 1;
    const d = 54 * grow;                     // 位移量
    const strike = cur === 'strike';

    gMap.setAttribute('opacity', strike ? 1 : 0);
    [gFW, gHW].forEach(g => g.setAttribute('opacity', strike ? 0 : 1));
    [lFW, lHW, lPL].forEach(n => n.setAttribute('opacity', strike ? 0 : 1));

    if (strike) {
      faceFill.setAttribute('opacity', 0);
      mapA.setAttribute('transform', `translate(${d * 1.5},0)`);
      mapB.setAttribute('transform', `translate(${-d * 1.5},0)`);
      f1.setAttribute('d', `M630,120 L810,120`);
      f2.setAttribute('d', `M570,336 L390,336`);
      stageLabel.textContent = `平移斷層：受水平作用力，兩側岩層沿斷層面<b>水平錯開</b>`.replace(/<[^>]+>/g, '');
    } else {
      const th = T.dip * Math.PI / 180;
      const ux = Math.cos(th), uy = Math.sin(th);      // 沿斷層面向下的方向
      const dx = T.dir * d * ux, dy = T.dir * d * uy;
      const xTop = faultLineX(TOP - 160, T.dip), xBot = faultLineX(BOT + 260, T.dip);
      const fw = `M-400,${TOP - 160} L${xTop},${TOP - 160} L${xBot},${BOT + 260} L-400,${BOT + 260} Z`;
      const hw = `M${xTop},${TOP - 160} L${W + 400},${TOP - 160} L${W + 400},${BOT + 260} L${xBot},${BOT + 260} Z`;
      defs.querySelector('#ft-fwp').setAttribute('d', fw);
      defs.querySelector('#ft-hwp').setAttribute('d', hw);
      fwLine.setAttribute('d', `M${xTop},${TOP} L${xBot},${BOT}`);
      hwLine.setAttribute('d', `M${xTop},${TOP} L${xBot},${BOT}`);
      gHW.setAttribute('transform', `translate(${dx},${dy})`);
      gFW.setAttribute('transform', 'translate(0,0)');
      faceFill.setAttribute('opacity', d > 1 ? 1 : 0);
      faceFill.setAttribute('d',
        `M${xTop},${TOP - 160} L${xBot},${BOT + 260} L${xBot + dx},${BOT + 260 + dy} L${xTop + dx},${TOP - 160 + dy} Z`);
      lHW.setAttribute('transform', `translate(${dx},${dy})`);
      if (T.dir > 0) {   // 正斷層：向外拉
        f1.setAttribute('d', 'M250,250 L120,250');
        f2.setAttribute('d', 'M650,250 L790,250');
      } else {           // 逆斷層：向內推
        f1.setAttribute('d', 'M120,250 L250,250');
        f2.setAttribute('d', 'M790,250 L650,250');
      }
      const lx = faultLineX(316, T.dip);
      lPL.setAttribute('transform', `translate(${lx - 88},318)`);
      stageLabel.textContent = `${T.name}：受${T.force}，${T.move}`;
    }
    cap.textContent = `${T.name}　作用力：${T.force}　·　${T.move}　·　常見於${T.where}`;
  });
  wrap._stop = () => drv.stop();
  return wrap;
}

root.ANIM = { ridge, subduction, fault };
})(window);
