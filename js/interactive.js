/* ===== 互動元件：圖上熱點、拖曳排序、拖曳分類 =====
   以 pointer events 實作，滑鼠與觸控皆可用。 */
(function (root) {
'use strict';
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/* ---------------------------------------------------------
   通用拖曳：回傳 {onDown} 綁在把手上
   opts.onDrop(item, x, y)  放開時呼叫
---------------------------------------------------------- */
function makeDraggable(node, opts) {
  let ghost = null, dx = 0, dy = 0, dragging = false, startX = 0, startY = 0;

  function down(e) {
    if (e.button != null && e.button !== 0) return;
    const r = node.getBoundingClientRect();
    startX = e.clientX; startY = e.clientY;
    dx = e.clientX - r.left; dy = e.clientY - r.top;
    dragging = false;
    node.setPointerCapture(e.pointerId);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
  }
  function move(e) {
    if (!dragging) {
      if (Math.abs(e.clientX - startX) < 4 && Math.abs(e.clientY - startY) < 4) return;
      dragging = true;
      const r = node.getBoundingClientRect();
      ghost = node.cloneNode(true);
      ghost.classList.add('ix-ghost');
      ghost.style.width = r.width + 'px';
      document.body.appendChild(ghost);
      node.classList.add('ix-source');
      if (opts.onStart) opts.onStart();
    }
    e.preventDefault();
    ghost.style.left = (e.clientX - dx) + 'px';
    ghost.style.top = (e.clientY - dy) + 'px';
    if (opts.onMove) opts.onMove(e.clientX, e.clientY);
  }
  function up(e) {
    node.removeEventListener('pointermove', move);
    node.removeEventListener('pointerup', up);
    node.removeEventListener('pointercancel', up);
    try { node.releasePointerCapture(e.pointerId); } catch (_) {}
    if (!dragging) { if (opts.onTap) opts.onTap(); return; }
    dragging = false;
    if (ghost) { ghost.remove(); ghost = null; }
    node.classList.remove('ix-source');
    if (opts.onDrop) opts.onDrop(e.clientX, e.clientY);
  }
  node.addEventListener('pointerdown', down);
  node.style.touchAction = 'none';
}

/* =========================================================
   1) 圖上熱點標註
   block: {src, points:[{x,y,n,d,tag}], intro, panelTitle}
========================================================= */
function hotspots(b) {
  const wrap = el('div', 'ix ix-hot');
  const head = el('div', 'ix-head');
  head.innerHTML = `<span class="ix-dot"></span><span>圖上標註　點圖中的號碼看說明</span>
    <span class="ix-hint">共 ${b.points.length} 個</span>`;
  wrap.appendChild(head);

  const grid = el('div', 'hotlab');
  const w = el('div', 'hotwrap');
  const img = el('img'); img.src = 'img/' + b.src + '.webp'; img.alt = b.panelTitle || '';
  img.loading = 'lazy';
  w.appendChild(img);

  const info = el('div', 'hotinfo empty');
  const reset = () => {
    info.className = 'hotinfo empty';
    info.innerHTML = `<div class="hn">${esc(b.panelTitle || '點圖上的號碼')}</div>
      <div class="hd">${b.intro || '每個號碼都有說明，點點看。'}</div>`;
  };
  reset();

  b.points.forEach((pt, i) => {
    const d = el('button', 'hot', String(i + 1));
    d.style.left = pt.x + '%'; d.style.top = pt.y + '%';
    d.onclick = () => {
      Array.from(w.querySelectorAll('.hot')).forEach(x => x.classList.remove('on'));
      d.classList.add('on');
      info.className = 'hotinfo';
      info.innerHTML = `<div class="hn">${esc(pt.n)}</div><div class="hd">${pt.d}</div>` +
        (pt.tag ? `<div class="hmeta"><span>${pt.tag}</span></div>` : '');
      done.add(i); mark();
    };
    w.appendChild(d);
  });

  const done = new Set();
  const prog = el('div', 'ix-prog');
  const mark = () => {
    prog.innerHTML = `已看過 <b>${done.size}</b> / ${b.points.length}`;
    prog.classList.toggle('all', done.size === b.points.length);
  };
  mark();

  grid.appendChild(w); grid.appendChild(info);
  wrap.appendChild(grid);
  wrap.appendChild(prog);
  return wrap;
}

/* =========================================================
   2) 拖曳排序
   block: {title, prompt, items:[...正確順序...], leftLabel, rightLabel, why}
========================================================= */
function order(b) {
  const wrap = el('div', 'ix ix-order');
  const head = el('div', 'ix-head');
  head.innerHTML = `<span class="ix-dot"></span><span>${esc(b.title || '拖曳排序')}</span>
    <span class="ix-hint">拖動卡片調整順序</span>`;
  wrap.appendChild(head);
  if (b.prompt) wrap.appendChild(el('div', 'ix-prompt', b.prompt));

  const axis = el('div', 'ix-axis');
  axis.innerHTML = `<span>${esc(b.leftLabel || '先')}</span><i></i><span>${esc(b.rightLabel || '後')}</span>`;
  wrap.appendChild(axis);

  const list = el('div', 'ix-list');
  let cur = shuffle(b.items.map((t, i) => ({ t, i })));
  if (cur.every((o, k) => o.i === k)) cur = cur.slice().reverse();

  function paint() {
    list.innerHTML = '';
    cur.forEach((o, k) => {
      const card = el('div', 'ix-item');
      card.innerHTML = `<span class="ix-grip">⠿</span><span class="ix-num">${k + 1}</span><span class="ix-t">${o.t}</span>`;
      makeDraggable(card, {
        onDrop: (x, y) => {
          const rects = Array.from(list.children).map(n => n.getBoundingClientRect());
          let target = rects.findIndex(r => y < r.top + r.height / 2 && x > r.left - 400);
          if (target < 0) target = cur.length - 1;
          const from = k;
          const it = cur.splice(from, 1)[0];
          cur.splice(target > from ? target : target, 0, it);
          paint();
        }
      });
      list.appendChild(card);
    });
  }
  paint();
  wrap.appendChild(list);

  const bar = el('div', 'ix-bar');
  const chk = el('button', 'btn', '對答案');
  const rst = el('button', 'btn sec', '重排');
  const msg = el('span', 'ix-msg');
  chk.onclick = () => {
    const ok = cur.every((o, k) => o.i === k);
    msg.className = 'ix-msg ' + (ok ? 'ok' : 'no');
    msg.innerHTML = ok ? '✓ 順序正確！' : '✗ 還不對，再想想順序';
    Array.from(list.children).forEach((n, k) => {
      n.classList.remove('right', 'wrong');
      n.classList.add(cur[k].i === k ? 'right' : 'wrong');
    });
    if (ok && b.why) {
      let w = wrap.querySelector('.ix-why');
      if (!w) { w = el('div', 'ix-why'); wrap.appendChild(w); }
      w.innerHTML = '<b>為什麼：</b>' + b.why;
    }
  };
  rst.onclick = () => { cur = shuffle(b.items.map((t, i) => ({ t, i }))); paint(); msg.textContent = ''; const w = wrap.querySelector('.ix-why'); if (w) w.remove(); };
  bar.appendChild(chk); bar.appendChild(rst); bar.appendChild(msg);
  wrap.appendChild(bar);
  return wrap;
}

/* =========================================================
   3) 拖曳分類
   block: {title, prompt, buckets:[{id,label,note}], items:[{t,b}], why}
========================================================= */
function sortInto(b) {
  const wrap = el('div', 'ix ix-sort');
  const head = el('div', 'ix-head');
  head.innerHTML = `<span class="ix-dot"></span><span>${esc(b.title || '拖曳分類')}</span>
    <span class="ix-hint">把卡片拖進正確的欄位</span>`;
  wrap.appendChild(head);
  if (b.prompt) wrap.appendChild(el('div', 'ix-prompt', b.prompt));

  const pool = el('div', 'ix-pool');
  const zones = el('div', 'ix-zones');
  zones.style.gridTemplateColumns = `repeat(${b.buckets.length},minmax(0,1fr))`;
  const zoneEls = {};
  b.buckets.forEach(bk => {
    const z = el('div', 'ix-zone');
    z.innerHTML = `<div class="ix-zt">${esc(bk.label)}</div>` +
      (bk.note ? `<div class="ix-zn">${esc(bk.note)}</div>` : '');
    const body = el('div', 'ix-zbody');
    z.appendChild(body);
    zoneEls[bk.id] = { zone: z, body: body };
    zones.appendChild(z);
  });

  function place(item, host) { host.appendChild(item.node); item.where = host; }

  const items = shuffle(b.items.slice()).map(it => {
    const node = el('div', 'ix-chip', it.t);
    const obj = { data: it, node: node, where: pool };
    makeDraggable(node, {
      onStart: () => Object.values(zoneEls).forEach(z => z.zone.classList.add('live')),
      onDrop: (x, y) => {
        Object.values(zoneEls).forEach(z => z.zone.classList.remove('live'));
        let hit = null;
        Object.keys(zoneEls).forEach(id => {
          const r = zoneEls[id].zone.getBoundingClientRect();
          if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) hit = id;
        });
        node.classList.remove('right', 'wrong');
        place(obj, hit ? zoneEls[hit].body : pool);
      }
    });
    return obj;
  });
  items.forEach(o => pool.appendChild(o.node));

  wrap.appendChild(pool);
  wrap.appendChild(zones);

  const bar = el('div', 'ix-bar');
  const chk = el('button', 'btn', '對答案');
  const rst = el('button', 'btn sec', '全部放回');
  const msg = el('span', 'ix-msg');
  chk.onclick = () => {
    let ok = 0, placed = 0;
    items.forEach(o => {
      o.node.classList.remove('right', 'wrong');
      if (o.where === pool) return;
      placed++;
      const inZone = Object.keys(zoneEls).find(id => zoneEls[id].body === o.where);
      if (inZone === o.data.b) { o.node.classList.add('right'); ok++; }
      else o.node.classList.add('wrong');
    });
    const all = items.length;
    msg.className = 'ix-msg ' + (ok === all ? 'ok' : 'no');
    msg.innerHTML = placed < all
      ? `還有 <b>${all - placed}</b> 張沒分類`
      : (ok === all ? '✓ 全部正確！' : `答對 <b>${ok}</b> / ${all}，紅色的放錯了`);
    if (ok === all && b.why) {
      let w = wrap.querySelector('.ix-why');
      if (!w) { w = el('div', 'ix-why'); wrap.appendChild(w); }
      w.innerHTML = '<b>為什麼：</b>' + b.why;
    }
  };
  rst.onclick = () => {
    items.forEach(o => { o.node.classList.remove('right', 'wrong'); place(o, pool); });
    msg.textContent = ''; const w = wrap.querySelector('.ix-why'); if (w) w.remove();
  };
  bar.appendChild(chk); bar.appendChild(rst); bar.appendChild(msg);
  wrap.appendChild(bar);
  return wrap;
}

root.IX = { hotspots, order, sortInto };
})(window);
