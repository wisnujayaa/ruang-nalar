/* Batas — widget interaktif (SVG murni) */
(function (G) {
  'use strict';
  const B = G.BM, W = G.BC.WIDGETS = {};
  const R = (v, d) => { const m = Math.pow(10, d == null ? 2 : d); return Math.round(v * m) / m; };
  const fmt = (v, d) => String(R(v, d)).replace('-', '−').replace('.', ',');
  const rp = (v) => 'Rp' + Math.round(v).toLocaleString('id-ID');
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  function slider(id, label, min, max, step, val) {
    return '<label class="w-sl" for="' + id + '"><span class="w-sl-l' + (label.length <= 2 ? ' v' : '') + '">' + label + '</span><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><output id="' + id + '-o"></output></label>';
  }
  function seg(id, opts, val) {
    return '<div class="w-seg" role="radiogroup" id="' + id + '">' + opts.map(o => '<button type="button" role="radio" data-v="' + o[0] + '" aria-checked="' + (o[0] === val) + '">' + o[1] + '</button>').join('') + '</div>';
  }
  function bindSeg(root, id, cb) {
    const el = root.querySelector('#' + id);
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; el.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', x === b)); cb(b.dataset.v); });
  }
  const segVal = (root, id) => root.querySelector('#' + id + ' [aria-checked="true"]').dataset.v;
  // kerangka grafik
  let cpN = 0;
  function frame(x0, x1, y0, y1, Wd, Ht, opt) {
    opt = opt || {};
    const pad = 28; const cid = 'bcp' + (++cpN);
    const X = x => pad + (x - x0) / (x1 - x0) * (Wd - 2 * pad);
    const Y = y => Ht - pad - (y - y0) / (y1 - y0) * (Ht - 2 * pad);
    let g = '';
    const sx = opt.sx || 1, sy = opt.sy || 1;
    for (let x = Math.ceil(x0 / sx) * sx; x <= x1; x += sx) g += '<line class="w-grid" x1="' + X(x) + '" x2="' + X(x) + '" y1="' + Y(y0) + '" y2="' + Y(y1) + '"/>';
    for (let y = Math.ceil(y0 / sy) * sy; y <= y1; y += sy) g += '<line class="w-grid" y1="' + Y(y) + '" y2="' + Y(y) + '" x1="' + X(x0) + '" x2="' + X(x1) + '"/>';
    if (y0 <= 0 && y1 >= 0) g += '<line class="w-axis" x1="' + X(x0) + '" x2="' + X(x1) + '" y1="' + Y(0) + '" y2="' + Y(0) + '"/>';
    if (x0 <= 0 && x1 >= 0) g += '<line class="w-axis" x1="' + X(0) + '" x2="' + X(0) + '" y1="' + Y(y0) + '" y2="' + Y(y1) + '"/>';
    const lx = opt.lx || sx * (x1 - x0 > 16 ? 4 : 2), ly = opt.ly || sy * (y1 - y0 > 16 ? 4 : 2);
    for (let x = Math.ceil(x0 / lx) * lx; x <= x1; x += lx) if (x !== 0) g += '<text class="w-tl" x="' + X(x) + '" y="' + (Math.min(Math.max(Y(0), pad), Ht - pad) + 14) + '">' + fmt(x) + '</text>';
    for (let y = Math.ceil(y0 / ly) * ly; y <= y1; y += ly) if (y !== 0) g += '<text class="w-tl" text-anchor="end" x="' + (Math.min(Math.max(X(0), pad), Wd - pad) - 5) + '" y="' + (Y(y) + 4) + '">' + fmt(y) + '</text>';
    g = '<defs><clipPath id="' + cid + '"><rect x="' + pad + '" y="' + pad + '" width="' + (Wd - 2 * pad) + '" height="' + (Ht - 2 * pad) + '"/></clipPath></defs>' + g;
    return { X, Y, g, x0, x1, y0, y1, pad, clip: 'clip-path="url(#' + cid + ')"' };
  }
  function pathOf(f, F, n, clip) {
    n = n || 300; let d = '', pen = false;
    for (let i = 0; i <= n; i++) {
      const x = F.x0 + (F.x1 - F.x0) * i / n; const y = f(x);
      if (!isFinite(y) || y > F.y1 + 4 * (F.y1 - F.y0) || y < F.y0 - 4 * (F.y1 - F.y0) || (clip && clip(x))) { pen = false; continue; }
      d += (pen ? 'L' : 'M') + R(F.X(x), 1) + ' ' + R(F.Y(y), 1); pen = true;
    }
    return d;
  }
  function relFn(rel) { return { '<': (a, b) => a < b, '<=': (a, b) => a <= b + 1e-9, '>': (a, b) => a > b, '>=': (a, b) => a >= b - 1e-9 }[rel]; }
  const RELT = { '<': '<', '<=': '≤', '>': '>', '>=': '≥' };
  const RELX = { '<': '<', '<=': '\\le', '>': '>', '>=': '\\ge' };
  function dragX(svg, F, onX) {
    let active = false;
    const toX = (e) => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return F.x0 + (p.x - F.pad) / (svg.viewBox.baseVal.width - 2 * F.pad) * (F.x1 - F.x0); };
    svg.addEventListener('pointerdown', e => { active = true; svg.setPointerCapture(e.pointerId); onX(toX(e), 'down'); });
    svg.addEventListener('pointermove', e => { if (active) onX(toX(e), 'move'); });
    svg.addEventListener('pointerup', () => { active = false; });
    svg.addEventListener('pointercancel', () => { active = false; });
  }

  /* ============ 0a. Uang jajan ============ */
  W.jajan = function (el) {
    el.innerHTML = '<div class="w-row">' + slider('jj-n', 'Gelas es kopi', 0, 7, 1, 2) + '</div><svg class="w-svg" viewBox="0 0 600 150" id="jj-svg" role="img" aria-label="Batang pengeluaran dibandingkan uang jajan"></svg><p class="w-read" id="jj-r" aria-live="polite"></p>';
    const n = el.querySelector('#jj-n'), svg = el.querySelector('#jj-svg'), out = el.querySelector('#jj-r');
    function draw() {
      const k = +n.value; el.querySelector('#jj-n-o').textContent = k;
      const spend = 12000 * k, cap = 50000, max = 90000; const Xp = v => 20 + v / max * 560;
      let s = '<rect x="20" y="30" width="' + (Xp(spend) - 20) + '" height="34" rx="6" class="' + (spend <= cap ? 'w-fill-ok' : 'w-fill-bad') + '"/>';
      s += '<line x1="' + Xp(cap) + '" x2="' + Xp(cap) + '" y1="18" y2="76" class="w-limit"/><text x="' + Xp(cap) + '" y="14" class="w-tl" text-anchor="middle">batas Rp50.000</text>';
      s += '<text x="26" y="52" class="w-bt">' + rp(spend) + '</text>';
      // garis bilangan bilangan bulat
      for (let i = 0; i <= 7; i++) { const x = 40 + i * 74; s += '<circle cx="' + x + '" cy="118" r="9" class="' + (12000 * i <= cap ? 'nl-dot' : 'nl-hole') + (i === k ? ' w-cur' : '') + '"/><text x="' + x + '" y="144" class="w-tl" text-anchor="middle">' + i + '</text>'; }
      s += '<text x="20" y="98" class="w-tl">banyak gelas yang aman: 12.000x ≤ 50.000</text>';
      svg.innerHTML = s;
      out.innerHTML = spend <= cap ? 'Aman. Sisa uang ' + rp(cap - spend) + '.' : '<b class="bad">Jebol!</b> Kurang ' + rp(spend - cap) + '. Batasnya 4 gelas.';
    }
    n.addEventListener('input', draw); draw();
  };

  /* ============ 0b. Ojol ============ */
  W.ojol = function (el) {
    el.innerHTML = '<div class="w-row">' + slider('oj-d', 'Jarak (km)', 0, 14, 0.5, 3) + '</div><svg class="w-svg" viewBox="0 0 600 300" id="oj-svg" role="img" aria-label="Grafik biaya ojol A dan B"></svg><p class="w-read" id="oj-r" aria-live="polite"></p>';
    const d = el.querySelector('#oj-d'), svg = el.querySelector('#oj-svg'), out = el.querySelector('#oj-r');
    const A = x => 8 + 2.5 * x, Bf = x => 5 + 3 * x;
    function draw() {
      const k = +d.value; el.querySelector('#oj-d-o').textContent = fmt(k, 1);
      const F = frame(0, 14, 0, 50, 600, 300, { sx: 1, sy: 5, lx: 2, ly: 10 });
      let s = F.g;
      s += '<rect x="' + F.X(6) + '" y="' + F.Y(50) + '" width="' + (F.X(14) - F.X(6)) + '" height="' + (F.Y(0) - F.Y(50)) + '" class="w-zone"/>';
      s += '<g ' + F.clip + '><path d="' + pathOf(A, F) + '" class="w-curve"/><path d="' + pathOf(Bf, F) + '" class="w-curve2"/></g>';
      s += '<circle cx="' + F.X(6) + '" cy="' + F.Y(23) + '" r="5" class="w-pt"/><text x="' + (F.X(6) + 8) + '" y="' + (F.Y(23) - 8) + '" class="w-tl">titik impas (6 km)</text>';
      s += '<line x1="' + F.X(k) + '" x2="' + F.X(k) + '" y1="' + F.Y(0) + '" y2="' + F.Y(50) + '" class="w-cursor"/>';
      s += '<circle cx="' + F.X(k) + '" cy="' + F.Y(A(k)) + '" r="5" class="w-ptA"/><circle cx="' + F.X(k) + '" cy="' + F.Y(Bf(k)) + '" r="5" class="w-ptB"/>';
      s += '<text x="' + F.X(13.8) + '" y="' + (F.Y(A(13.8)) + 16) + '" class="w-lgA" text-anchor="end">A</text><text x="' + F.X(13.8) + '" y="' + (F.Y(Bf(13.8)) - 8) + '" class="w-lgB" text-anchor="end">B</text>';
      s += '<text x="' + (F.X(10)) + '" y="' + (F.Y(48)) + '" class="w-tl" text-anchor="middle">daerah A lebih murah</text>';
      svg.innerHTML = s;
      const a = A(k) * 1000, b = Bf(k) * 1000;
      out.innerHTML = 'A: ' + rp(a) + ' · B: ' + rp(b) + ' → ' + (a < b ? '<b class="ok">A lebih murah</b>' : a > b ? '<b>B lebih murah</b>' : '<b>sama</b>') + '. Pertidaksamaannya: 8.000 + 2.500x &lt; 5.000 + 3.000x ⇔ x &gt; 6.';
    }
    d.addEventListener('input', draw); draw();
  };

  /* ============ 1a. Jungkat-jungkit ============ */
  W.seesaw = function (el) {
    el.innerHTML = '<svg class="w-svg" viewBox="0 0 600 220" id="ss-svg" role="img" aria-label="Jungkat-jungkit dua ruas"></svg>' +
      '<div class="w-btns" id="ss-b"><button type="button" data-op="+3">+3</button><button type="button" data-op="-4">−4</button><button type="button" data-op="*2">×2</button><button type="button" data-op="*-1" class="w-neg">×(−1)</button><button type="button" data-op="/-2" class="w-neg">÷(−2)</button><button type="button" data-op="reset" class="w-ghost">Ulang</button></div>' +
      '<ol class="w-log" id="ss-log" aria-live="polite"></ol>';
    let L = 2, Rv = 5; const svg = el.querySelector('#ss-svg'), log = el.querySelector('#ss-log');
    const sign = () => L < Rv ? '<' : L > Rv ? '>' : '=';
    let lastFlip = false;
    function draw() {
      const s = sign(); const ang = s === '<' ? 12 : s === '>' ? -12 : 0;
      let g = '<g transform="translate(300 150)"><polygon points="-26,52 26,52 0,4" class="w-fulcrum"/>';
      g += '<g class="w-beam" style="transform:rotate(' + ang + 'deg)"><rect x="-250" y="-8" width="500" height="12" rx="6" class="w-plank"/>';
      g += '<g transform="translate(-200 -46)"><rect x="-52" y="0" width="104" height="38" rx="10" class="w-box"/><text y="26" class="w-boxt" text-anchor="middle">' + fmt(L) + '</text></g>';
      g += '<g transform="translate(200 -46)"><rect x="-52" y="0" width="104" height="38" rx="10" class="w-box"/><text y="26" class="w-boxt" text-anchor="middle">' + fmt(Rv) + '</text></g></g>';
      g += '<text y="-92" text-anchor="middle" class="w-big' + (lastFlip ? ' w-flipt' : '') + '">' + fmt(L) + ' ' + s + ' ' + fmt(Rv) + '</text></g>';
      svg.innerHTML = g;
    }
    el.querySelector('#ss-b').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; const op = b.dataset.op;
      if (op === 'reset') { L = 2; Rv = 5; log.innerHTML = ''; lastFlip = false; draw(); return; }
      const before = sign(); const k = parseFloat(op.slice(1).replace('−', '-'));
      if (op[0] === '+') { L += k; Rv += k; } else if (op[0] === '-') { L -= +op.slice(1); Rv -= +op.slice(1); } else if (op[0] === '*') { L *= k; Rv *= k; } else if (op[0] === '/') { L /= k; Rv /= k; }
      L = R(L, 4); Rv = R(Rv, 4);
      const after = sign(); lastFlip = before !== after && before !== '=';
      const li = document.createElement('li');
      li.innerHTML = '<span>' + b.textContent + '</span> → <b>' + fmt(L) + ' ' + after + ' ' + fmt(Rv) + '</b>' + (lastFlip ? ' <em class="flip">tanda terbalik!</em>' : ' <em>tanda tetap</em>');
      log.prepend(li); while (log.children.length > 5) log.lastChild.remove();
      draw();
    });
    draw();
  };

  /* ============ 1b. Pembuat interval ============ */
  W.interval = function (el) {
    el.innerHTML = seg('iv-m', [['in', 'di antara'], ['out', 'di luar'], ['l', 'ke kiri'], ['r', 'ke kanan']], 'in') +
      '<svg class="w-svg w-drag" viewBox="0 0 600 90" id="iv-svg" role="img" aria-label="Seret titik ujung pada garis bilangan"></svg>' +
      '<p class="w-hint">Seret titik. Ketuk titik untuk mengganti penuh/kosong.</p><div class="w-forms" id="iv-f" aria-live="polite"></div>';
    const st = { a: -1, b: 4, ca: true, cb: false, m: 'in' };
    const svg = el.querySelector('#iv-svg');
    const F = { x0: -8, x1: 8, pad: 30, X: x => 30 + (x + 8) / 16 * 540 };
    let drag = null, moved = false;
    function set() {
      if (st.m === 'in') return [B.I(st.a, st.b, st.ca, st.cb)];
      if (st.m === 'out') return B.norm([B.I(-Infinity, st.a, false, st.ca), B.I(st.b, Infinity, st.cb, false)]);
      if (st.m === 'l') return [B.I(-Infinity, st.b, false, st.cb)];
      return [B.I(st.a, Infinity, st.ca, false)];
    }
    function draw() {
      const S = set();
      let g = '<line x1="10" x2="590" y1="40" y2="40" class="nl-ax"/>';
      for (let x = -8; x <= 8; x++) g += '<line x1="' + F.X(x) + '" x2="' + F.X(x) + '" y1="35" y2="45" class="nl-tk"/>' + (x % 2 === 0 || x === st.a || x === st.b ? '<text x="' + F.X(x) + '" y="72" class="nl-lb">' + fmt(x) + '</text>' : '');
      S.forEach(p => { const x1 = p.a === -Infinity ? 10 : F.X(p.a), x2 = p.b === Infinity ? 590 : F.X(p.b); g += '<line x1="' + x1 + '" x2="' + x2 + '" y1="40" y2="40" class="nl-sol"/>'; if (p.a === -Infinity) g += '<path d="M6 40 l10 -7 v14z" class="nl-solarr"/>'; if (p.b === Infinity) g += '<path d="M594 40 l-10 -7 v14z" class="nl-solarr"/>'; });
      const showA = st.m !== 'l', showB = st.m !== 'r';
      if (showA) g += '<circle data-h="a" cx="' + F.X(st.a) + '" cy="40" r="10" class="' + (st.ca ? 'nl-dot' : 'nl-hole') + ' w-handle"/>';
      if (showB) g += '<circle data-h="b" cx="' + F.X(st.b) + '" cy="40" r="10" class="' + (st.cb ? 'nl-dot' : 'nl-hole') + ' w-handle"/>';
      svg.innerHTML = g;
      el.querySelector('#iv-f').innerHTML = '<div><span>Pertidaksamaan</span>' + B.rich('$' + B.toIneqTex(S) + '$') + '</div><div><span>Interval</span>' + B.rich('$' + B.toTex(S) + '$') + '</div><div><span>Himpunan</span>' + B.rich('$\\{x\\mid ' + B.toIneqTex(S) + '\\}$') + '</div>';
    }
    const toX = (e) => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return Math.round((p.x - 30) / 540 * 16 - 8); };
    svg.addEventListener('pointerdown', e => { const x = toX(e); const da = Math.abs(x - st.a), db = Math.abs(x - st.b); drag = st.m === 'l' ? 'b' : st.m === 'r' ? 'a' : (da <= db ? 'a' : 'b'); moved = false; svg.setPointerCapture(e.pointerId); });
    svg.addEventListener('pointermove', e => { if (!drag) return; let x = Math.max(-8, Math.min(8, toX(e))); if (drag === 'a' && st.m !== 'r') x = Math.min(x, st.b - 1); if (drag === 'b' && st.m !== 'l') x = Math.max(x, st.a + 1); if (x !== st[drag]) { st[drag] = x; moved = true; draw(); } });
    svg.addEventListener('pointerup', () => { if (drag && !moved) { st['c' + drag] = !st['c' + drag]; draw(); } drag = null; });
    bindSeg(el, 'iv-m', v => { st.m = v; draw(); });
    draw();
  };

  /* ============ 2. Uji titik ============ */
  W.ujititik = function (el) {
    const P = [{ t: '2x-1>5', f: x => 2 * x - 1, r: '>', k: 5, crit: 3 }, { t: '-3x+4\\le10', f: x => -3 * x + 4, r: '<=', k: 10, crit: -2 }, { t: '\\frac x2+1<3', f: x => x / 2 + 1, r: '<', k: 3, crit: 4 }];
    el.innerHTML = seg('ut-p', P.map((p, i) => [String(i), B.rich('$' + p.t + '$')]), '0') + '<div class="w-row">' + slider('ut-x', 'x', -8, 8, 0.5, 0) + '</div><svg class="w-svg" viewBox="0 0 600 80" id="ut-svg" role="img" aria-label="Garis bilangan uji titik"></svg><p class="w-read" id="ut-r" aria-live="polite"></p><label class="w-chk"><input type="checkbox" id="ut-show"> Tampilkan daerah penyelesaian</label>';
    const xs = el.querySelector('#ut-x'), svg = el.querySelector('#ut-svg'), out = el.querySelector('#ut-r'), show = el.querySelector('#ut-show');
    function draw() {
      const p = P[+segVal(el, 'ut-p')]; const x = +xs.value; el.querySelector('#ut-x-o').textContent = fmt(x, 1);
      const S = B.solve(v => relFn(p.r)(p.f(v), p.k), [p.crit]);
      const X = v => 30 + (v + 8) / 16 * 540;
      let g = '<line x1="10" x2="590" y1="34" y2="34" class="nl-ax"/>';
      for (let i = -8; i <= 8; i += 2) g += '<text x="' + X(i) + '" y="68" class="nl-lb">' + fmt(i) + '</text><line x1="' + X(i) + '" x2="' + X(i) + '" y1="29" y2="39" class="nl-tk"/>';
      if (show.checked) S.forEach(q => { const a = q.a === -Infinity ? 10 : X(q.a), b = q.b === Infinity ? 590 : X(q.b); g += '<line x1="' + a + '" x2="' + b + '" y1="34" y2="34" class="nl-sol"/>'; [[q.a, q.ca], [q.b, q.cb]].forEach(([v, c]) => { if (isFinite(v)) g += '<circle cx="' + X(v) + '" cy="34" r="6" class="' + (c ? 'nl-dot' : 'nl-hole') + '"/>'; }); });
      const ok = relFn(p.r)(p.f(x), p.k);
      g += '<g class="w-probe ' + (ok ? 'ok' : 'bad') + '"><line x1="' + X(x) + '" x2="' + X(x) + '" y1="8" y2="46"/><circle cx="' + X(x) + '" cy="10" r="7"/></g>';
      svg.innerHTML = g;
      out.innerHTML = B.rich('Untuk $x=' + B.numTex(x) + '$: ruas kiri $=' + B.numTex(R(p.f(x), 3)) + '$, dan $' + B.numTex(R(p.f(x), 3)) + RELX[p.r] + ' ' + p.k + '$ ') + (ok ? '<b class="ok">benar ✓</b>' : '<b class="bad">salah ✗</b>');
    }
    xs.addEventListener('input', draw); show.addEventListener('change', draw); bindSeg(el, 'ut-p', draw); draw();
  };

  /* ============ 3. Parabola ============ */
  W.parabola = function (el) {
    el.innerHTML = '<div class="w-grid3">' + slider('pb-a', 'a', -3, 3, 0.5, 1) + slider('pb-b', 'b', -6, 6, 1, -1) + slider('pb-c', 'c', -9, 9, 1, -6) + '</div>' + seg('pb-r', [['<', '&lt; 0'], ['<=', '≤ 0'], ['>', '&gt; 0'], ['>=', '≥ 0']], '<') +
      '<svg class="w-svg" viewBox="0 0 600 340" id="pb-svg" role="img" aria-label="Grafik parabola dan daerah penyelesaian"></svg><div id="pb-nl"></div><p class="w-read" id="pb-o" aria-live="polite"></p>';
    const ids = ['a', 'b', 'c'].map(k => el.querySelector('#pb-' + k)); const svg = el.querySelector('#pb-svg');
    function draw() {
      let [a, b, c] = ids.map(i => +i.value); if (a === 0) { a = 0.5; ids[0].value = 0.5; }
      ids.forEach((i, k) => el.querySelector('#pb-' + 'abc'[k] + '-o').textContent = fmt(+i.value, 1));
      const rel = segVal(el, 'pb-r'); const f = x => a * x * x + b * x + c; const D = b * b - 4 * a * c;
      const roots = D > 1e-12 ? [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)].sort((p, q) => p - q) : Math.abs(D) <= 1e-12 ? [-b / (2 * a)] : [];
      const S = B.solve(x => relFn(rel)(f(x), 0), roots);
      const F = frame(-8, 8, -12, 12, 600, 340, { sx: 1, sy: 2, lx: 2, ly: 4 });
      let g = F.g;
      S.forEach(p => { const x1 = Math.max(p.a, -8), x2 = Math.min(p.b, 8); if (x2 > x1) g += '<rect x="' + F.X(x1) + '" width="' + (F.X(x2) - F.X(x1)) + '" y="' + F.Y(12) + '" height="' + (F.Y(-12) - F.Y(12)) + '" class="w-zone"/>'; });
      g += '<g ' + F.clip + '><path d="' + pathOf(f, F) + '" class="w-curve"/><path d="' + pathOf(f, F, 400, x => !B.has(S, x)) + '" class="w-curve-hi"/></g>';
      roots.forEach(r => { if (r >= -8 && r <= 8) g += '<circle cx="' + F.X(r) + '" cy="' + F.Y(0) + '" r="5" class="w-pt"/>'; });
      svg.innerHTML = g;
      el.querySelector('#pb-nl').innerHTML = B.numberLine(S, { range: [-8, 8] });
      const poly = (a === 1 ? '' : a === -1 ? '-' : fmt(a, 1)) + 'x²' + (b ? (b > 0 ? ' + ' : ' − ') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'x' : '') + (c ? (c > 0 ? ' + ' : ' − ') + Math.abs(c) : '');
      el.querySelector('#pb-o').innerHTML = '<b>' + poly + ' ' + RELT[rel] + ' 0</b> · D = ' + fmt(D, 2) + (D > 0 ? ' (dua akar)' : D === 0 ? ' (akar kembar)' : ' (tidak ada akar real)') + ' · ' + (a > 0 ? 'lembah' : 'bukit') + '<br>Penyelesaian: ' + B.rich('$' + B.toIneqTex(S) + '$');
    }
    ids.forEach(i => i.addEventListener('input', draw)); bindSeg(el, 'pb-r', draw); draw();
  };

  /* ============ 4. Tabel tanda ============ */
  W.signchart = function (el) {
    el.innerHTML = '<div class="w-factors" id="sc-f"></div>' + seg('sc-r', [['<', '&lt; 0'], ['<=', '≤ 0'], ['>', '&gt; 0'], ['>=', '≥ 0']], '<') +
      '<svg class="w-svg" viewBox="0 0 600 250" id="sc-svg" role="img" aria-label="Sketsa grafik polinomial"></svg><div id="sc-tab" class="w-tab"></div><div id="sc-nl"></div>';
    const st = [{ r: 1, p: 1 }, { r: 3, p: 2 }, { r: -2, p: 0 }];
    const fbox = el.querySelector('#sc-f');
    fbox.innerHTML = st.map((f, i) => '<div class="w-fac"><span>Faktor ' + (i + 1) + '</span>' + slider('sc-r' + i, 'akar', -5, 5, 1, f.r) + '<select id="sc-p' + i + '" aria-label="Pangkat faktor ' + (i + 1) + '"><option value="0">tidak dipakai</option><option value="1">pangkat 1</option><option value="2">pangkat 2</option><option value="3">pangkat 3</option></select></div>').join('');
    st.forEach((f, i) => { el.querySelector('#sc-p' + i).value = f.p; });
    const svg = el.querySelector('#sc-svg');
    function draw() {
      st.forEach((f, i) => { f.r = +el.querySelector('#sc-r' + i).value; f.p = +el.querySelector('#sc-p' + i).value; el.querySelector('#sc-r' + i + '-o').textContent = f.r; });
      let used = st.filter(f => f.p > 0);
      // gabungkan akar sama
      const m = {}; used.forEach(f => { m[f.r] = (m[f.r] || 0) + f.p; });
      const roots = Object.keys(m).map(Number).sort((a, b) => a - b);
      const rel = segVal(el, 'sc-r');
      const f = x => roots.reduce((acc, r) => acc * Math.pow(x - r, m[r]), 1);
      const S = roots.length ? B.solve(x => relFn(rel)(f(x), 0), roots) : [];
      // grafik terskala (tanda saja)
      const F = frame(-6, 6, -6, 6, 600, 250, { sx: 1, sy: 2, lx: 1, ly: 100 });
      const deg = Math.max(1, roots.reduce((s, r) => s + m[r], 0));
      const g2 = x => { const v = f(x); return Math.sign(v) * 5.2 * Math.tanh(Math.pow(Math.abs(v), 1 / deg) / 2.4); };
      let g = F.g + '<g ' + F.clip + '><path d="' + pathOf(g2, F, 500) + '" class="w-curve"/></g>';
      roots.forEach(r => { g += '<circle cx="' + F.X(r) + '" cy="' + F.Y(0) + '" r="5" class="' + (m[r] % 2 ? 'w-pt' : 'w-pt2') + '"/>'; });
      svg.innerHTML = g;
      // tabel tanda
      if (!roots.length) { el.querySelector('#sc-tab').innerHTML = '<p class="muted">Pilih minimal satu faktor.</p>'; el.querySelector('#sc-nl').innerHTML = ''; return; }
      const bounds = [-Infinity].concat(roots, [Infinity]);
      let t = '<div class="w-signrow">';
      for (let i = 0; i < bounds.length - 1; i++) {
        const a = bounds[i], b = bounds[i + 1]; const mid = a === -Infinity ? b - 1 : b === Infinity ? a + 1 : (a + b) / 2;
        const sg = f(mid) > 0 ? '+' : '−';
        t += '<span class="w-sg ' + (sg === '+' ? 'pos' : 'neg') + '">' + sg + '</span>';
        if (b !== Infinity) t += '<span class="w-rt">' + fmt(b) + '<small>' + (m[b] % 2 ? 'ganti' : 'tetap') + '</small></span>';
      }
      el.querySelector('#sc-tab').innerHTML = t + '</div><p class="w-read">' + B.rich('$' + roots.map(r => (r === 0 ? 'x' : '(x' + (r > 0 ? '-' : '+') + Math.abs(r) + ')') + (m[r] > 1 ? '^' + m[r] : '')).join('') + RELX[rel] + ' 0$') + ' → ' + B.rich('$' + B.toIneqTex(S) + '$') + '</p>';
      el.querySelector('#sc-nl').innerHTML = B.numberLine(S, { range: [-6, 6] });
    }
    fbox.addEventListener('input', draw); fbox.addEventListener('change', draw); bindSeg(el, 'sc-r', draw); draw();
  };

  /* ============ 5. Kali silang ============ */
  W.kalisilang = function (el) {
    el.innerHTML = '<div class="w-row">' + slider('ks-x', 'x', -6, 8, 0.1, 0) + '</div><svg class="w-svg" viewBox="0 0 600 300" id="ks-svg" role="img" aria-label="Grafik y=(x+1)/(x−2) dan y=1"></svg><div class="w-compare" id="ks-c" aria-live="polite"></div>';
    const xs = el.querySelector('#ks-x'), svg = el.querySelector('#ks-svg');
    const f = x => (x + 1) / (x - 2);
    function draw() {
      let x = +xs.value; if (Math.abs(x - 2) < 0.05) x = 2.1; el.querySelector('#ks-x-o').textContent = fmt(x, 1);
      const F = frame(-6, 8, -6, 8, 600, 300, { sx: 1, sy: 1, lx: 2, ly: 2 });
      let g = F.g;
      g += '<rect x="' + F.X(-6) + '" width="' + (F.X(2) - F.X(-6)) + '" y="' + F.Y(8) + '" height="' + (F.Y(-6) - F.Y(8)) + '" class="w-badzone"/>';
      g += '<line x1="' + F.X(2) + '" x2="' + F.X(2) + '" y1="' + F.Y(8) + '" y2="' + F.Y(-6) + '" class="w-asym"/>';
      g += '<g ' + F.clip + '><path d="' + pathOf(f, F, 700, v => Math.abs(v - 2) < 0.02) + '" class="w-curve"/></g><line x1="' + F.X(-6) + '" x2="' + F.X(8) + '" y1="' + F.Y(1) + '" y2="' + F.Y(1) + '" class="w-curve2"/>';
      const y = Math.max(-6, Math.min(8, f(x)));
      g += '<circle cx="' + F.X(x) + '" cy="' + F.Y(y) + '" r="6" class="w-ptA"/>';
      g += '<text x="' + F.X(-5.8) + '" y="' + F.Y(7.3) + '" class="w-tl">merah: kali silang bilang "benar", padahal salah</text>';
      svg.innerHTML = g;
      const ori = f(x) > 1, cross = (x + 1) > (x - 2);
      el.querySelector('#ks-c').innerHTML = '<div class="' + (ori ? 'ok' : 'bad') + '"><span>Soal asli</span>' + B.rich('$\\frac{x+1}{x-2}=' + B.numTex(R(f(x), 2)) + '$') + '<b>' + (ori ? '> 1 ✓' : '> 1 ✗') + '</b></div><div class="' + (cross === ori ? 'ok' : 'bad') + '"><span>Hasil kali silang</span>' + B.rich('$x+1>x-2 \\iff 1>-2$') + '<b>' + (cross ? 'selalu ✓' : '✗') + '</b></div>' + (cross !== ori ? '<p class="bad">Untuk x = ' + fmt(x, 1) + ', penyebut ' + fmt(x - 2, 1) + ' negatif. Kali silang lupa membalik tanda!</p>' : '<p>Untuk x &gt; 2 penyebutnya positif, jadi kali silang kebetulan benar.</p>');
    }
    xs.addEventListener('input', draw); draw();
  };

  /* ============ 6. Akar vs garis ============ */
  W.akar = function (el) {
    el.innerHTML = '<p class="w-read">' + B.rich('$\\sqrt{x-a}\\;\\square\\;mx+n$') + '</p><div class="w-grid3">' + slider('ak-a', 'a', -4, 4, 1, 3) + slider('ak-m', 'm', -2, 2, 0.5, 0) + slider('ak-n', 'n', -3, 5, 0.5, 2) + '</div>' + seg('ak-r', [['<', '&lt;'], ['<=', '≤'], ['>', '&gt;'], ['>=', '≥']], '<') +
      '<svg class="w-svg" viewBox="0 0 600 300" id="ak-svg" role="img" aria-label="Grafik akar dan garis"></svg><div id="ak-nl"></div><p class="w-read" id="ak-o" aria-live="polite"></p>';
    const ids = ['a', 'm', 'n'].map(k => el.querySelector('#ak-' + k)), svg = el.querySelector('#ak-svg');
    function draw() {
      const [a, m, n] = ids.map(i => +i.value); ids.forEach((i, k) => el.querySelector('#ak-' + 'amn'[k] + '-o').textContent = fmt(+i.value, 1));
      const rel = segVal(el, 'ak-r');
      const s = x => x - a >= -1e-12 ? Math.sqrt(Math.max(0, x - a)) : NaN, l = x => m * x + n;
      // titik potong: x - a = (mx+n)^2
      const crit = [a]; const A2 = m * m, B2 = 2 * m * n - 1, C2 = n * n + a;
      if (Math.abs(A2) < 1e-12) { if (Math.abs(B2) > 1e-12) crit.push(-C2 / B2); } else { const D = B2 * B2 - 4 * A2 * C2; if (D >= 0) crit.push((-B2 - Math.sqrt(D)) / (2 * A2), (-B2 + Math.sqrt(D)) / (2 * A2)); }
      const S = B.solve(x => x - a >= -1e-12 && relFn(rel)(s(x), l(x)), crit.map(v => R(v, 9)));
      const F = frame(-6, 10, -3, 6, 600, 300, { sx: 1, sy: 1, lx: 2, ly: 2 });
      let g = F.g + '<rect x="' + F.X(-6) + '" width="' + Math.max(0, F.X(a) - F.X(-6)) + '" y="' + F.Y(6) + '" height="' + (F.Y(-3) - F.Y(6)) + '" class="w-forbid"/>';
      S.forEach(p => { const x1 = Math.max(p.a, -6), x2 = Math.min(p.b, 10); if (x2 > x1) g += '<rect x="' + F.X(x1) + '" width="' + (F.X(x2) - F.X(x1)) + '" y="' + F.Y(6) + '" height="' + (F.Y(-3) - F.Y(6)) + '" class="w-zone"/>'; });
      g += '<g ' + F.clip + '><path d="' + pathOf(s, F, 500) + '" class="w-curve"/><path d="' + pathOf(l, F) + '" class="w-curve2"/></g>';
      g += '<text x="' + (F.X(-5.8)) + '" y="' + F.Y(5.4) + '" class="w-tl">abu-abu: akar tidak terdefinisi</text>';
      svg.innerHTML = g;
      el.querySelector('#ak-nl').innerHTML = B.numberLine(S, { range: [-6, 10] });
      el.querySelector('#ak-o').innerHTML = 'Syarat: x ≥ ' + fmt(a) + '. Penyelesaian: ' + B.rich('$' + B.toIneqTex(S) + '$');
    }
    ids.forEach(i => i.addEventListener('input', draw)); bindSeg(el, 'ak-r', draw); draw();
  };

  /* ============ 7. Mutlak = jarak ============ */
  W.mutlak = function (el) {
    el.innerHTML = '<div class="w-grid3">' + slider('mt-a', 'pusat a', -5, 5, 1, -1) + slider('mt-r', 'batas r', -2, 6, 1, 3) + '</div>' + seg('mt-s', [['<', '&lt; r'], ['<=', '≤ r'], ['>', '&gt; r'], ['>=', '≥ r']], '<=') +
      '<svg class="w-svg" viewBox="0 0 600 120" id="mt-svg" role="img" aria-label="Jarak di garis bilangan"></svg><p class="w-read" id="mt-o" aria-live="polite"></p>';
    const A = el.querySelector('#mt-a'), Rr = el.querySelector('#mt-r'), svg = el.querySelector('#mt-svg');
    function draw() {
      const a = +A.value, r = +Rr.value, rel = segVal(el, 'mt-s'); el.querySelector('#mt-a-o').textContent = a; el.querySelector('#mt-r-o').textContent = r;
      const S = B.solve(x => relFn(rel)(Math.abs(x - a), r), [a - r, a + r, a]);
      const X = v => 30 + (v + 12) / 24 * 540;
      let g = '<line x1="10" x2="590" y1="70" y2="70" class="nl-ax"/>';
      for (let i = -12; i <= 12; i += 2) g += '<line x1="' + X(i) + '" x2="' + X(i) + '" y1="65" y2="75" class="nl-tk"/><text x="' + X(i) + '" y="100" class="nl-lb">' + fmt(i) + '</text>';
      S.forEach(p => { const x1 = p.a === -Infinity ? 10 : X(p.a), x2 = p.b === Infinity ? 590 : X(p.b); if (x2 > x1) g += '<line x1="' + x1 + '" x2="' + x2 + '" y1="70" y2="70" class="nl-sol"/>'; [[p.a, p.ca], [p.b, p.cb]].forEach(([v, c]) => { if (isFinite(v)) g += '<circle cx="' + X(v) + '" cy="70" r="6.5" class="' + (c ? 'nl-dot' : 'nl-hole') + '"/>'; }); });
      g += '<circle cx="' + X(a) + '" cy="70" r="4" class="w-center"/><text x="' + X(a) + '" y="50" class="w-tl" text-anchor="middle">pusat ' + a + '</text>';
      if (r > 0) { g += '<path d="M' + X(a) + ' 30 L' + X(a + r) + ' 30" class="w-dist" /><path d="M' + X(a) + ' 30 L' + X(a - r) + ' 30" class="w-dist"/><text x="' + X(a + r / 2) + '" y="24" class="w-tl" text-anchor="middle">' + r + '</text><text x="' + X(a - r / 2) + '" y="24" class="w-tl" text-anchor="middle">' + r + '</text>'; }
      svg.innerHTML = g;
      const near = rel[0] === '<';
      el.querySelector('#mt-o').innerHTML = B.rich('$|x' + (a > 0 ? '-' + a : a < 0 ? '+' + (-a) : '') + '|' + RELX[rel] + ' ' + r + '$') + ': titik yang ' + (near ? '<b>dekat</b>' : '<b>jauh</b>') + ' dari ' + a + ' (jarak ' + RELT[rel] + ' ' + r + ') → ' + B.rich('$' + B.toIneqTex(S) + '$') + (r < 0 ? '<br><em class="flip">r negatif: jarak tidak pernah negatif!</em>' : r === 0 ? '<br><em>r = 0: perhatikan baik-baik.</em>' : '');
    }
    A.addEventListener('input', draw); Rr.addEventListener('input', draw); bindSeg(el, 'mt-s', draw); draw();
  };

  /* ============ 8. Eksponen & log ============ */
  W.eksplog = function (el) {
    el.innerHTML = '<div class="w-grid3">' + slider('el-a', 'basis a', 0.2, 3, 0.1, 2) + slider('el-m', 'pangkat m', -3, 3, 0.5, -1) + slider('el-n', 'pangkat n', -3, 3, 0.5, 1.5) + '</div>' +
      '<svg class="w-svg" viewBox="0 0 600 300" id="el-svg" role="img" aria-label="Grafik y = a pangkat x"></svg><p class="w-read" id="el-o" aria-live="polite"></p>';
    const ids = ['a', 'm', 'n'].map(k => el.querySelector('#el-' + k)), svg = el.querySelector('#el-svg');
    function draw() {
      let [a, m, n] = ids.map(i => +i.value); if (Math.abs(a - 1) < 0.05) { a = 1.1; }
      ids.forEach((i, k) => el.querySelector('#el-' + 'amn'[k] + '-o').textContent = fmt(k === 0 ? a : +i.value, 1));
      const f = x => Math.pow(a, x);
      const F = frame(-4, 4, -1, 8, 600, 300, { sx: 1, sy: 1, lx: 1, ly: 2 });
      let g = F.g + '<g ' + F.clip + '><path d="' + pathOf(f, F) + '" class="w-curve"/></g>';
      [[m, 'w-ptA', 'm'], [n, 'w-ptB', 'n']].forEach(([v, c, lab]) => { const y = Math.min(8, f(v)); g += '<line x1="' + F.X(v) + '" x2="' + F.X(v) + '" y1="' + F.Y(0) + '" y2="' + F.Y(y) + '" class="w-guide"/><line x1="' + F.X(-4) + '" x2="' + F.X(v) + '" y1="' + F.Y(y) + '" y2="' + F.Y(y) + '" class="w-guide"/><circle cx="' + F.X(v) + '" cy="' + F.Y(y) + '" r="6" class="' + c + '"/><text x="' + F.X(v) + '" y="' + (F.Y(0) + 26) + '" class="w-tl" text-anchor="middle">' + lab + '</text>'; });
      svg.innerHTML = g;
      const r1 = m < n ? '<' : m > n ? '>' : '=', fm = f(m), fn = f(n), r2 = fm < fn - 1e-12 ? '<' : fm > fn + 1e-12 ? '>' : '=';
      const flipped = r1 !== r2 && r1 !== '=';
      el.querySelector('#el-o').innerHTML = 'm ' + r1 + ' n &nbsp;⇒&nbsp; ' + fmt(a, 1) + '<sup>m</sup> ' + r2 + ' ' + fmt(a, 1) + '<sup>n</sup> &nbsp;(' + fmt(fm, 2) + ' vs ' + fmt(fn, 2) + ') · ' + (a > 1 ? '<b>mesin pembesar</b>, urutan dijaga' : '<b class="flip">mesin pengecil</b>, urutan dibalik') + (flipped ? ' <em class="flip">tanda terbalik!</em>' : '');
    }
    ids.forEach(i => i.addEventListener('input', draw)); draw();
  };

  /* ============ 9. SPtLDV ============ */
  W.sptldv = function (el) {
    const L = [{ a: 1, b: 1, c: 4, lab: 'x + y' }, { a: 2, b: 1, c: 6, lab: '2x + y' }, { a: 1, b: 0, c: 0, lab: 'x' }, { a: 0, b: 1, c: 0, lab: 'y' }];
    const rel = ['<=', '<=', '>=', '>='];
    el.innerHTML = '<div class="w-cons" id="sp-c">' + L.map((l, i) => '<div class="w-con"><span>' + l.lab + '</span>' + seg('sp-r' + i, [['<', '&lt;'], ['<=', '≤'], ['>', '&gt;'], ['>=', '≥']], rel[i]) + '<span>' + l.c + '</span></div>').join('') + '</div>' +
      '<svg class="w-svg w-drag" viewBox="0 0 600 420" id="sp-svg" role="img" aria-label="Daerah penyelesaian sistem pertidaksamaan"></svg><p class="w-read" id="sp-o" aria-live="polite"></p>';
    const svg = el.querySelector('#sp-svg'); let P = { x: 1, y: 1 };
    const F = frame(-2, 8, -2, 7, 600, 420, { sx: 1, sy: 1, lx: 1, ly: 1 });
    function clip(poly, a, b, c, r) { // simpan sisi yang memenuhi a x + b y r c (r: <=,>= ; strict diperlakukan sama untuk gambar)
      const inside = p => (r[0] === '<' ? a * p[0] + b * p[1] <= c + 1e-9 : a * p[0] + b * p[1] >= c - 1e-9);
      const out = [];
      for (let i = 0; i < poly.length; i++) {
        const P1 = poly[i], P2 = poly[(i + 1) % poly.length]; const i1 = inside(P1), i2 = inside(P2);
        if (i1) out.push(P1);
        if (i1 !== i2) { const v1 = a * P1[0] + b * P1[1] - c, v2 = a * P2[0] + b * P2[1] - c; const t = v1 / (v1 - v2); out.push([P1[0] + t * (P2[0] - P1[0]), P1[1] + t * (P2[1] - P1[1])]); }
      }
      return out;
    }
    function draw() {
      L.forEach((l, i) => rel[i] = segVal(el, 'sp-r' + i));
      let poly = [[-2, -2], [8, -2], [8, 7], [-2, 7]];
      L.forEach((l, i) => { if (poly.length) poly = clip(poly, l.a, l.b, l.c, rel[i]); });
      let g = F.g + '<g ' + F.clip + '>';
      if (poly.length > 2) g += '<polygon points="' + poly.map(p => F.X(p[0]) + ',' + F.Y(p[1])).join(' ') + '" class="w-region"/>';
      L.forEach((l, i) => {
        let pts;
        if (l.b === 0) pts = [[l.c / l.a, -2], [l.c / l.a, 7]]; else pts = [[-2, (l.c + 2 * l.a) / l.b], [8, (l.c - 8 * l.a) / l.b]];
        g += '<line x1="' + F.X(pts[0][0]) + '" y1="' + F.Y(pts[0][1]) + '" x2="' + F.X(pts[1][0]) + '" y2="' + F.Y(pts[1][1]) + '" class="w-bline' + (rel[i].length === 1 ? ' dashed' : '') + '"/>';
      });
      g += '</g>';
      const ok = L.map((l, i) => relFn(rel[i])(l.a * P.x + l.b * P.y, l.c));
      g += '<circle cx="' + F.X(P.x) + '" cy="' + F.Y(P.y) + '" r="9" class="w-probe-pt ' + (ok.every(Boolean) ? 'ok' : 'bad') + '"/>';
      svg.innerHTML = g;
      el.querySelector('#sp-o').innerHTML = 'Titik uji (' + fmt(P.x, 1) + ', ' + fmt(P.y, 1) + '): ' + L.map((l, i) => '<span class="' + (ok[i] ? 'ok' : 'bad') + '">' + l.lab + ' = ' + fmt(l.a * P.x + l.b * P.y, 1) + ' ' + RELT[rel[i]] + ' ' + l.c + (ok[i] ? ' ✓' : ' ✗') + '</span>').join(' · ') + (poly.length > 2 ? '' : '<br><b>Tidak ada daerah penyelesaian.</b>') + '<br><span class="muted">Seret titik untuk menguji. Garis putus-putus = tanda &lt; atau &gt;.</span>';
    }
    let active = false;
    const toP = (e) => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return { x: R(F.x0 + (p.x - F.pad) / (600 - 2 * F.pad) * (F.x1 - F.x0), 1), y: R(F.y0 + (420 - F.pad - p.y) / (420 - 2 * F.pad) * (F.y1 - F.y0), 1) }; };
    svg.addEventListener('pointerdown', e => { active = true; svg.setPointerCapture(e.pointerId); P = toP(e); draw(); });
    svg.addEventListener('pointermove', e => { if (active) { P = toP(e); draw(); } });
    svg.addEventListener('pointerup', () => active = false);
    L.forEach((l, i) => bindSeg(el, 'sp-r' + i, draw));
    draw();
  };

  W._ = { slider, seg, bindSeg, segVal, frame, pathOf, relFn, RELT, RELX, fmt, R };
  W.mount = function (id, el) { const [name, arg] = String(id).split(':'); if (W[name]) { try { W[name](el, arg); } catch (e) { console.error('widget', id, e); el.innerHTML = '<p class="bad">Widget gagal dimuat.</p>'; } } };
})(typeof window !== 'undefined' ? window : globalThis);
