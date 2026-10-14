/* Batas — widget interaktif tambahan */
(function (G) {
  'use strict';
  const B = G.BM, W = G.BC.WIDGETS;
  const { slider, seg, bindSeg, segVal, frame, pathOf, relFn, RELT, RELX, fmt, R } = W._;
  const NLX = (lo, hi) => (v) => 30 + (v - lo) / (hi - lo) * 540;
  function axis(lo, hi, X, y, step) {
    let g = '<line x1="10" x2="590" y1="' + y + '" y2="' + y + '" class="nl-ax"/>';
    for (let t = Math.ceil(lo); t <= hi; t++) g += '<line x1="' + X(t) + '" x2="' + X(t) + '" y1="' + (y - 5) + '" y2="' + (y + 5) + '" class="nl-tk"/>' + (t % (step || 2) === 0 ? '<text x="' + X(t) + '" y="' + (y + 26) + '" class="nl-lb">' + fmt(t) + '</text>' : '');
    return g;
  }
  function solLine(S, X, y) {
    let g = '';
    S.forEach(p => { const a = p.a === -Infinity ? 10 : X(p.a), b = p.b === Infinity ? 590 : X(p.b); if (b > a) g += '<line x1="' + a + '" x2="' + b + '" y1="' + y + '" y2="' + y + '" class="nl-sol"/>'; [[p.a, p.ca], [p.b, p.cb]].forEach(([v, c]) => { if (isFinite(v)) g += '<circle cx="' + X(v) + '" cy="' + y + '" r="7" class="' + (c ? 'nl-dot' : 'nl-hole') + '"/>'; }); });
    return g;
  }

  /* ---------- Cermin di titik 0 ---------- */
  W.cermin = function (el) {
    el.innerHTML = '<div class="w-grid3">' + slider('cm-a', 'a', -6, 6, 1, 2) + slider('cm-b', 'b', -6, 6, 1, 5) + '</div><svg class="w-svg" viewBox="0 0 600 150" id="cm-svg" role="img" aria-label="Bilangan a dan b serta cerminannya"></svg><p class="w-read" id="cm-o" aria-live="polite"></p>';
    const A = el.querySelector('#cm-a'), Bv = el.querySelector('#cm-b'), svg = el.querySelector('#cm-svg'), X = NLX(-7, 7);
    function draw() {
      const a = +A.value, b = +Bv.value; el.querySelector('#cm-a-o').textContent = a; el.querySelector('#cm-b-o').textContent = b;
      let g = axis(-7, 7, X, 76, 1) + '<line x1="' + X(0) + '" x2="' + X(0) + '" y1="16" y2="120" class="w-asym"/><text x="' + X(0) + '" y="12" class="w-tl" text-anchor="middle">cermin</text>';
      const arc = (v, cls) => v === 0 ? '' : '<path d="M' + X(v) + ' 66 Q' + X(0) + ' ' + (66 - Math.abs(v) * 7) + ' ' + X(-v) + ' 66" class="' + cls + '" fill="none" stroke-dasharray="4 4"/>';
      g += arc(a, 'w-arcA') + arc(b, 'w-arcB');
      g += '<circle cx="' + X(a) + '" cy="76" r="8" class="w-ptA"/><text x="' + X(a) + '" y="132" class="w-lgA" text-anchor="middle">a</text>';
      g += '<circle cx="' + X(b) + '" cy="76" r="8" class="w-ptB"/><text x="' + X(b) + '" y="132" class="w-lgB" text-anchor="middle">b</text>';
      g += '<circle cx="' + X(-a) + '" cy="76" r="6" class="w-ghostA"/><circle cx="' + X(-b) + '" cy="76" r="6" class="w-ghostB"/>';
      svg.innerHTML = g;
      const r1 = a < b ? '<' : a > b ? '>' : '=', r2 = -a < -b ? '<' : -a > -b ? '>' : '=';
      el.querySelector('#cm-o').innerHTML = B.rich('$' + a + r1 + b + '$') + ' &nbsp;→ dikali −1 →&nbsp; ' + B.rich('$' + (-a) + r2 + (-b) + '$') + (r1 !== '=' ? ' <em class="flip">urutannya terbalik</em>' : '') + '<br><span class="muted">Titik kecil berwarna adalah bayangan cermin −a dan −b. Yang tadinya di kiri pindah ke kanan.</span>';
    }
    A.addEventListener('input', draw); Bv.addEventListener('input', draw); draw();
  };

  /* ---------- Mengkuadratkan: kapan aman? ---------- */
  W.kuadratAman = function (el) {
    el.innerHTML = '<div class="w-grid3">' + slider('ka-a', 'a', -5, 5, 0.5, -3) + slider('ka-b', 'b', -5, 5, 0.5, 1) + '</div><div class="w-truth" id="ka-t" aria-live="polite"></div>';
    const A = el.querySelector('#ka-a'), Bv = el.querySelector('#ka-b');
    function draw() {
      const a = +A.value, b = +Bv.value; el.querySelector('#ka-a-o').textContent = fmt(a, 1); el.querySelector('#ka-b-o').textContent = fmt(b, 1);
      const p = a < b, q = a * a < b * b, safe = a >= 0 && b >= 0;
      const row = (t, v) => '<div class="' + (v ? 'ok' : 'bad') + '"><span>' + t + '</span><b>' + (v ? 'benar' : 'salah') + '</b></div>';
      el.querySelector('#ka-t').innerHTML = row(B.rich('$a<b$: $' + B.numTex(a) + '<' + B.numTex(b) + '$'), p) + row(B.rich('$a^2<b^2$: $' + B.numTex(R(a * a, 2)) + '<' + B.numTex(R(b * b, 2)) + '$'), q) +
        '<p>' + (safe ? 'Keduanya ≥ 0, jadi mengkuadratkan <b>aman</b>: kalau a &lt; b maka a² &lt; b².' : p && !q ? '<b class="flip">Lihat!</b> a &lt; b benar, tapi a² &lt; b² salah. Ada bilangan negatif, jadi mengkuadratkan <b>tidak aman</b>.' : 'Ada bilangan negatif. Coba cari pasangan di mana a &lt; b tapi a² &gt; b², misalnya a = −3, b = 1.') + '</p>';
    }
    A.addEventListener('input', draw); Bv.addEventListener('input', draw); draw();
  };

  /* ---------- Pembongkar langkah (linear) ---------- */
  W.langkah = function (el) {
    const P = [{ a: 3, b: -7, r: '<', c: 8 }, { a: -2, b: 5, r: '>=', c: 11 }, { a: -4, b: -3, r: '<=', c: 9 }];
    el.innerHTML = seg('lk-p', P.map((p, i) => [String(i), B.rich('$' + lin(p.a, p.b) + RELX[p.r] + ' ' + p.c + '$')]), '0') + '<div class="w-eq" id="lk-eq" aria-live="polite"></div><div class="w-btns" id="lk-b"></div><ol class="w-log" id="lk-log"></ol>';
    function lin(a, b) { let s = a === 1 ? 'x' : a === -1 ? '-x' : a + 'x'; if (b) s += (b > 0 ? '+' : '-') + Math.abs(b); return s; }
    const FL = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
    let st;
    function reset() { const p = P[+segVal(el, 'lk-p')]; st = Object.assign({}, p, { stage: 0 }); el.querySelector('#lk-log').innerHTML = ''; draw(); }
    function draw() {
      const eq = st.stage === 2 ? 'x' + RELX[st.r] + ' ' + B.numTex(st.c) : lin(st.a, st.b) + RELX[st.r] + ' ' + B.numTex(st.c);
      el.querySelector('#lk-eq').innerHTML = B.rich('$$' + eq + '$$');
      const btns = [];
      if (st.stage === 0 && st.b) btns.push(['sub', (st.b > 0 ? 'Kurangi ' + st.b : 'Tambah ' + (-st.b)) + ' di kedua ruas']);
      if (st.stage <= 1 && !(st.stage === 0 && st.b)) btns.push(['div', 'Bagi kedua ruas dengan ' + st.a]);
      if (st.stage === 2) btns.push(['reset', 'Ulangi']);
      el.querySelector('#lk-b').innerHTML = btns.map(b => '<button type="button" data-a="' + b[0] + '" class="' + (b[0] === 'div' && st.a < 0 ? 'w-neg' : '') + '">' + b[1] + '</button>').join('');
      if (st.stage === 2) { const S = B.solve(x => relFn(st.r)(x, st.c), [st.c]); el.querySelector('#lk-eq').insertAdjacentHTML('beforeend', B.numberLine(S)); }
    }
    function log(t, flip) { const li = document.createElement('li'); li.innerHTML = t + (flip ? ' <em class="flip">tanda dibalik karena membagi bilangan negatif!</em>' : ''); el.querySelector('#lk-log').appendChild(li); }
    el.querySelector('#lk-b').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'reset') return reset();
      if (b.dataset.a === 'sub') { st.c -= st.b; log('Kedua ruas ' + (st.b > 0 ? 'dikurangi ' + st.b : 'ditambah ' + (-st.b)) + ' → ' + B.rich('$' + st.a + 'x' + RELX[st.r] + ' ' + st.c + '$')); st.b = 0; st.stage = 1; }
      else if (b.dataset.a === 'div') { const flip = st.a < 0; st.c = st.c / st.a; if (flip) st.r = FL[st.r]; log('Kedua ruas dibagi ' + st.a + ' → ' + B.rich('$x' + RELX[st.r] + ' ' + B.numTex(st.c) + '$'), flip); st.a = 1; st.stage = 2; }
      draw();
    });
    bindSeg(el, 'lk-p', reset); reset();
  };

  /* ---------- Uji titik per daerah (polinomial / rasional) ---------- */
  W.regiontest = function (el, preset) {
    const PR = {
      kuad: { tex: '(x-3)(x+2)\\le 0', f: x => (x - 3) * (x + 2), crit: [-2, 3], ex: [], rel: '<=' },
      poli: { tex: 'x(x-2)(x+2)\\ge 0', f: x => x * (x - 2) * (x + 2), crit: [-2, 0, 2], ex: [], rel: '>=' },
      rasi: { tex: '\\frac{x+3}{(x-1)(x+1)}\\ge 0', f: x => (x + 3) / ((x - 1) * (x + 1)), crit: [-3, -1, 1], ex: [-1, 1], rel: '>=' }
    };
    el.innerHTML = seg('rt-p', [['kuad', 'Kuadrat'], ['poli', 'Kubik'], ['rasi', 'Pecahan']], preset || 'kuad') + '<p class="w-read" id="rt-q"></p><svg class="w-svg" viewBox="0 0 600 120" id="rt-svg" role="img" aria-label="Garis bilangan dengan daerah yang bisa diuji"></svg><p class="w-hint">Ketuk setiap daerah di antara titik kritis untuk mengujinya dengan satu bilangan.</p><div id="rt-o" aria-live="polite"></div>';
    const svg = el.querySelector('#rt-svg'); let tested = {};
    function cur() { return PR[segVal(el, 'rt-p')]; }
    function regions(p) { const b = [-Infinity].concat(p.crit, [Infinity]); const r = []; for (let i = 0; i < b.length - 1; i++) { const a = b[i], c = b[i + 1]; r.push({ a, b: c, t: a === -Infinity ? c - 1 : c === Infinity ? a + 1 : (a + c) / 2 }); } return r; }
    function draw() {
      const p = cur(); const X = NLX(-6, 6); const rg = regions(p);
      el.querySelector('#rt-q').innerHTML = 'Soal: ' + B.rich('$' + p.tex + '$') + '. Titik kritis: ' + p.crit.join(', ') + (p.ex.length ? ' (pembuat nol penyebut: ' + p.ex.join(', ') + ')' : '');
      let g = axis(-6, 6, X, 70, 1);
      rg.forEach((r, i) => { const x1 = r.a === -Infinity ? 10 : X(r.a), x2 = r.b === Infinity ? 590 : X(r.b); const t = tested[i]; g += '<rect data-r="' + i + '" x="' + (x1 + 3) + '" y="20" width="' + Math.max(8, x2 - x1 - 6) + '" height="36" rx="8" class="w-reg ' + (t == null ? '' : t > 0 ? 'pos' : 'neg') + '"/><text x="' + ((x1 + x2) / 2) + '" y="44" class="w-regt" text-anchor="middle">' + (t == null ? 'uji?' : t > 0 ? '+' : '−') + '</text>'; });
      p.crit.forEach(c => { g += '<circle cx="' + X(c) + '" cy="70" r="6" class="' + (p.ex.includes(c) ? 'nl-hole' : 'nl-dot') + '"/>'; });
      svg.innerHTML = g;
      const done = Object.keys(tested).length === rg.length;
      let o = Object.keys(tested).map(i => { const r = rg[+i]; const v = p.f(r.t); return '<li>Daerah ' + (r.a === -Infinity ? 'x < ' + fmt(r.b) : r.b === Infinity ? 'x > ' + fmt(r.a) : fmt(r.a) + ' < x < ' + fmt(r.b)) + ': coba x = ' + fmt(r.t) + ' → nilai ' + fmt(v, 2) + ' (' + (v > 0 ? 'positif' : 'negatif') + ')</li>'; }).join('');
      o = '<ul class="w-list">' + o + '</ul>';
      if (done) { const S = B.solve(x => !p.ex.includes(x) && relFn(p.rel)(p.f(x), 0), p.crit); o += '<p><b>Kesimpulan:</b> ambil daerah bertanda ' + (p.rel[0] === '<' ? '−' : '+') + ', lalu cek titik kritisnya. ' + B.rich('$' + B.toIneqTex(S) + '$') + '</p>' + B.numberLine(S); }
      el.querySelector('#rt-o').innerHTML = o;
    }
    svg.addEventListener('click', e => { const r = e.target.closest('[data-r]'); if (!r) return; const i = +r.dataset.r; tested[i] = cur().f(regions(cur())[i].t); draw(); });
    bindSeg(el, 'rt-p', () => { tested = {}; draw(); }); draw();
  };

  /* ---------- Parameter m: selalu positif? ---------- */
  W.paramm = function (el) {
    el.innerHTML = '<p class="w-read">' + B.rich('$f(x)=mx^2-4x+m$') + '</p><div class="w-row">' + slider('pm-m', 'm', -4, 4, 0.25, 1) + '</div><svg class="w-svg" viewBox="0 0 600 300" id="pm-svg" role="img" aria-label="Grafik f untuk berbagai m"></svg><div class="w-truth" id="pm-o" aria-live="polite"></div>';
    const M = el.querySelector('#pm-m'), svg = el.querySelector('#pm-svg');
    function draw() {
      const m = +M.value; el.querySelector('#pm-m-o').textContent = fmt(m, 2);
      const f = x => m * x * x - 4 * x + m; const F = frame(-6, 6, -10, 10, 600, 300, { sx: 1, sy: 2, lx: 2, ly: 4 });
      svg.innerHTML = F.g + '<g ' + F.clip + '><path d="' + pathOf(f, F) + '" class="w-curve"/></g>';
      const D = 16 - 4 * m * m, all = m > 0 && D < 0;
      const row = (t, v) => '<div class="' + (v ? 'ok' : 'bad') + '"><span>' + t + '</span><b>' + (v ? 'ya' : 'tidak') + '</b></div>';
      el.querySelector('#pm-o').innerHTML = row('Terbuka ke atas (m &gt; 0)', m > 0) + row('Tidak menyentuh sumbu-x (D = ' + fmt(D, 2) + ' &lt; 0)', D < 0) + '<p>' + (all ? '<b class="ok">Selalu positif untuk semua x.</b>' : 'Belum selalu positif. Geser m sampai kedua syarat terpenuhi.') + ' Jawaban akhir: m &gt; 2.</p>';
    }
    M.addEventListener('input', draw); draw();
  };

  /* ---------- Saklar tanda faktor ---------- */
  W.saklar = function (el) {
    const F = [{ t: 'x+2', r: -2, p: 1 }, { t: 'x-1', r: 1, p: 1 }, { t: '(x-3)^2', r: 3, p: 2 }];
    el.innerHTML = '<p class="w-read">' + B.rich('$f(x)=(x+2)(x-1)(x-3)^2$') + '</p><div class="w-row">' + slider('sk-x', 'x', -5, 6, 0.1, -3) + '</div><div class="w-lamps" id="sk-l" aria-live="polite"></div><svg class="w-svg" viewBox="0 0 600 90" id="sk-svg" role="img" aria-label="Posisi x di garis bilangan"></svg>';
    const xs = el.querySelector('#sk-x'), svg = el.querySelector('#sk-svg'), X = NLX(-5, 6);
    function draw() {
      const x = +xs.value; el.querySelector('#sk-x-o').textContent = fmt(x, 1);
      let prod = 1; const lamps = F.map(f => { const v = Math.pow(x - f.r, f.p); prod *= v; const s = Math.abs(v) < 1e-9 ? 0 : Math.sign(v); return '<div class="w-lamp ' + (s > 0 ? 'pos' : s < 0 ? 'neg' : 'zero') + '"><span>' + B.rich('$' + f.t + '$') + '</span><b>' + (s > 0 ? '+' : s < 0 ? '−' : '0') + '</b></div>'; });
      const s = Math.abs(prod) < 1e-9 ? 0 : Math.sign(prod);
      el.querySelector('#sk-l').innerHTML = lamps.join('<i>×</i>') + '<i>=</i><div class="w-lamp big ' + (s > 0 ? 'pos' : s < 0 ? 'neg' : 'zero') + '"><span>f(x)</span><b>' + (s > 0 ? '+' : s < 0 ? '−' : '0') + '</b></div>';
      let g = axis(-5, 6, X, 50, 1); F.forEach(f => { g += '<circle cx="' + X(f.r) + '" cy="50" r="6" class="' + (f.p % 2 ? 'w-pt' : 'w-pt2') + '"/>'; });
      g += '<path d="M' + X(x) + ' 18 l-7 -10 h14 z" class="w-ptA"/><line x1="' + X(x) + '" x2="' + X(x) + '" y1="20" y2="58" class="w-cursor"/>';
      svg.innerHTML = g;
    }
    xs.addEventListener('input', draw); draw();
  };

  /* ---------- Tanda pecahan ---------- */
  W.pecahantanda = function (el) {
    el.innerHTML = '<p class="w-read">' + B.rich('$\\frac{x+3}{x-1}$') + '</p><div class="w-row">' + slider('pt-x', 'x', -6, 6, 0.1, -4) + '</div><div class="w-lamps" id="pt-l" aria-live="polite"></div><p class="w-read" id="pt-o"></p>';
    const xs = el.querySelector('#pt-x');
    function draw() {
      let x = +xs.value; el.querySelector('#pt-x-o').textContent = fmt(x, 1);
      const P = x + 3, Q = x - 1; const sg = v => Math.abs(v) < 1e-9 ? 0 : Math.sign(v);
      const lamp = (t, s, extra) => '<div class="w-lamp ' + (extra || (s > 0 ? 'pos' : s < 0 ? 'neg' : 'zero')) + '"><span>' + t + '</span><b>' + (extra ? '✗' : s > 0 ? '+' : s < 0 ? '−' : '0') + '</b></div>';
      const forb = Math.abs(Q) < 1e-9;
      el.querySelector('#pt-l').innerHTML = lamp('pembilang x+3', sg(P)) + '<i>÷</i>' + lamp('penyebut x−1', sg(Q)) + '<i>=</i>' + (forb ? lamp('hasil', 0, 'forb') : lamp('hasil', sg(P / Q)));
      el.querySelector('#pt-o').innerHTML = forb ? '<b class="bad">x = 1 terlarang:</b> pembagian dengan nol tidak terdefinisi.' : 'Nilai: ' + fmt(P / Q, 2) + '. Perhatikan: tanda hasil bagi selalu sama dengan tanda hasil kali (x+3)(x−1).';
    }
    xs.addEventListener('input', draw); draw();
  };

  /* ---------- Gerbang akar ---------- */
  W.gerbang = function (el) {
    el.innerHTML = '<p class="w-read">' + B.rich('$\\sqrt{x-3}<2$') + '</p><div class="w-row">' + slider('gb-x', 'x', -2, 10, 0.5, 1) + '</div><div class="w-lamps" id="gb-l" aria-live="polite"></div><svg class="w-svg" viewBox="0 0 600 90" id="gb-svg" role="img" aria-label="Garis bilangan dengan daerah terlarang"></svg>';
    const xs = el.querySelector('#gb-x'), svg = el.querySelector('#gb-svg'), X = NLX(-2, 10);
    function draw() {
      const x = +xs.value; el.querySelector('#gb-x-o').textContent = fmt(x, 1);
      const inside = x - 3, ok1 = inside >= 0; const v = ok1 ? Math.sqrt(inside) : NaN; const ok2 = ok1 && v < 2;
      el.querySelector('#gb-l').innerHTML = '<div class="w-lamp ' + (ok1 ? 'pos' : 'forb') + '"><span>Syarat 1: isi akar x−3 = ' + fmt(inside, 1) + '</span><b>' + (ok1 ? '≥ 0 ✓' : '< 0 ✗') + '</b></div><i>→</i><div class="w-lamp ' + (!ok1 ? 'zero' : ok2 ? 'pos' : 'neg') + '"><span>Syarat 2: √(x−3) ' + (ok1 ? '= ' + fmt(v, 2) : 'tidak ada') + '</span><b>' + (!ok1 ? '—' : ok2 ? '< 2 ✓' : '≥ 2 ✗') + '</b></div>';
      let g = '<rect x="10" y="20" width="' + (X(3) - 10) + '" height="40" class="w-forbid"/><text x="' + ((10 + X(3)) / 2) + '" y="16" class="w-tl" text-anchor="middle">gerbang tertutup</text>' + axis(-2, 10, X, 50, 1) + solLine([B.I(3, 7, true, false)], X, 50);
      g += '<path d="M' + X(x) + ' 30 l-7 -10 h14 z" class="' + (ok2 ? 'w-pt' : 'w-pt2') + '"/>';
      svg.innerHTML = g;
    }
    xs.addEventListener('input', draw); draw();
  };

  /* ---------- Titik tengah: lebih dekat ke a atau b ---------- */
  W.titiktengah = function (el) {
    el.innerHTML = '<p class="w-read">' + B.rich('$|x-a|<|x-b|$: titik yang lebih dekat ke $a$ daripada ke $b$') + '</p><div class="w-grid3">' + slider('tt-a', 'a', -6, 6, 1, 2) + slider('tt-b', 'b', -6, 6, 1, -4) + slider('tt-x', 'x', -8, 8, 0.5, 0) + '</div><svg class="w-svg" viewBox="0 0 600 130" id="tt-svg" role="img" aria-label="Jarak x ke a dan ke b"></svg><p class="w-read" id="tt-o" aria-live="polite"></p>';
    const ids = ['a', 'b', 'x'].map(k => el.querySelector('#tt-' + k)), svg = el.querySelector('#tt-svg'), X = NLX(-8, 8);
    function draw() {
      const [a, b, x] = ids.map(i => +i.value); ids.forEach((i, k) => el.querySelector('#tt-' + 'abx'[k] + '-o').textContent = fmt(+i.value, 1));
      const m = (a + b) / 2; const S = a === b ? [] : B.solve(v => Math.abs(v - a) < Math.abs(v - b), [m]);
      let g = axis(-8, 8, X, 90, 2) + solLine(S, X, 90);
      g += '<line x1="' + X(x) + '" x2="' + X(a) + '" y1="30" y2="30" class="w-distA"/><line x1="' + X(x) + '" x2="' + X(b) + '" y1="50" y2="50" class="w-distB"/>';
      g += '<circle cx="' + X(a) + '" cy="90" r="7" class="w-ptA"/><circle cx="' + X(b) + '" cy="90" r="7" class="w-ptB"/><line x1="' + X(m) + '" x2="' + X(m) + '" y1="64" y2="104" class="w-asym"/><text x="' + X(m) + '" y="62" class="w-tl" text-anchor="middle">tengah ' + fmt(m, 1) + '</text>';
      g += '<path d="M' + X(x) + ' 78 l-7 -10 h14 z" class="w-center"/>';
      svg.innerHTML = g;
      const da = Math.abs(x - a), db = Math.abs(x - b);
      el.querySelector('#tt-o').innerHTML = 'Jarak ke a: <b class="w-cA">' + fmt(da, 1) + '</b> · jarak ke b: <b class="w-cB">' + fmt(db, 1) + '</b> → ' + (da < db ? '<b class="ok">lebih dekat ke a ✓</b>' : '<b class="bad">tidak lebih dekat ke a</b>') + '<br>Penyelesaian: ' + B.rich('$' + B.toIneqTex(S) + '$') + ' (semua titik di sisi a dari titik tengah).';
    }
    ids.forEach(i => i.addEventListener('input', draw)); draw();
  };

  /* ---------- Grafik logaritma ---------- */
  W.loggraph = function (el) {
    el.innerHTML = '<p class="w-read">' + B.rich('$\\log_a x>k$') + '</p><div class="w-grid3">' + slider('lg-a', 'a', 0.2, 4, 0.1, 2) + slider('lg-k', 'k', -2, 3, 0.5, 1) + '</div><svg class="w-svg" viewBox="0 0 600 300" id="lg-svg" role="img" aria-label="Grafik logaritma"></svg><div id="lg-nl"></div><p class="w-read" id="lg-o" aria-live="polite"></p>';
    const A = el.querySelector('#lg-a'), K = el.querySelector('#lg-k'), svg = el.querySelector('#lg-svg');
    function draw() {
      let a = +A.value; if (Math.abs(a - 1) < 0.05) a = 1.1; const k = +K.value;
      el.querySelector('#lg-a-o').textContent = fmt(a, 1); el.querySelector('#lg-k-o').textContent = fmt(k, 1);
      const f = x => x > 0 ? Math.log(x) / Math.log(a) : NaN; const F = frame(-2, 10, -4, 4, 600, 300, { sx: 1, sy: 1, lx: 2, ly: 1 });
      const N = Math.pow(a, k); const S = a > 1 ? [B.I(N, Infinity, false, false)] : [B.I(0, N, false, false)];
      let g = F.g + '<rect x="' + F.X(-2) + '" width="' + (F.X(0) - F.X(-2)) + '" y="' + F.Y(4) + '" height="' + (F.Y(-4) - F.Y(4)) + '" class="w-forbid"/>';
      S.forEach(p => { const x1 = Math.max(p.a, -2), x2 = Math.min(p.b, 10); if (x2 > x1) g += '<rect x="' + F.X(x1) + '" width="' + (F.X(x2) - F.X(x1)) + '" y="' + F.Y(4) + '" height="' + (F.Y(-4) - F.Y(4)) + '" class="w-zone"/>'; });
      g += '<g ' + F.clip + '><path d="' + pathOf(f, F, 600) + '" class="w-curve"/><line x1="' + F.X(-2) + '" x2="' + F.X(10) + '" y1="' + F.Y(k) + '" y2="' + F.Y(k) + '" class="w-curve2"/></g>';
      if (N <= 10) g += '<circle cx="' + F.X(N) + '" cy="' + F.Y(k) + '" r="5" class="w-pt"/>';
      svg.innerHTML = g;
      el.querySelector('#lg-nl').innerHTML = B.numberLine(S, { range: [-1, 10] });
      el.querySelector('#lg-o').innerHTML = 'Batas: x = a<sup>k</sup> = ' + fmt(N, 2) + '. ' + (a > 1 ? 'Basis &gt; 1, grafik naik: <b>x &gt; ' + fmt(N, 2) + '</b>.' : 'Basis &lt; 1, grafik turun: tanda dibalik, <b class="flip">0 &lt; x &lt; ' + fmt(N, 2) + '</b>.') + ' Abu-abu: x ≤ 0, log tidak terdefinisi.';
    }
    A.addEventListener('input', draw); K.addEventListener('input', draw); draw();
  };

  /* ---------- Garis dari dua titik potong ---------- */
  W.garisdua = function (el) {
    el.innerHTML = '<div class="w-grid3">' + slider('gd-a', 'a', 1, 8, 1, 4) + slider('gd-b', 'b', 1, 8, 1, 2) + '</div>' + seg('gd-s', [['in', 'memuat (0,0)'], ['out', 'tidak memuat (0,0)']], 'in') + seg('gd-t', [['n', 'garis tegas (≤ / ≥)'], ['s', 'putus-putus (< / >)']], 'n') + '<svg class="w-svg" viewBox="0 0 600 380" id="gd-svg" role="img" aria-label="Garis melalui dua titik potong sumbu"></svg><p class="w-read" id="gd-o" aria-live="polite"></p>';
    const A = el.querySelector('#gd-a'), Bv = el.querySelector('#gd-b'), svg = el.querySelector('#gd-svg');
    function draw() {
      const a = +A.value, b = +Bv.value, side = segVal(el, 'gd-s'), strict = segVal(el, 'gd-t') === 's';
      el.querySelector('#gd-a-o').textContent = a; el.querySelector('#gd-b-o').textContent = b;
      const F = frame(-1, 9, -1, 9, 600, 380, { sx: 1, sy: 1, lx: 1, ly: 1 });
      const poly = side === 'in' ? [[-1, -1], [-1, b + b / a], [a + a / b, -1]] : [[-1, b + b / a], [-1, 9], [9, 9], [9, -1], [a + a / b, -1]];
      let g = F.g + '<g ' + F.clip + '><polygon points="' + poly.map(p => F.X(p[0]) + ',' + F.Y(p[1])).join(' ') + '" class="w-region"/><line x1="' + F.X(-1) + '" y1="' + F.Y(b + b / a) + '" x2="' + F.X(9) + '" y2="' + F.Y(b - 9 * b / a) + '" class="w-bline' + (strict ? ' dashed' : '') + '"/></g>';
      g += '<circle cx="' + F.X(a) + '" cy="' + F.Y(0) + '" r="6" class="w-ptA"/><circle cx="' + F.X(0) + '" cy="' + F.Y(b) + '" r="6" class="w-ptB"/><circle cx="' + F.X(0) + '" cy="' + F.Y(0) + '" r="4" class="w-center"/>';
      svg.innerHTML = g;
      const g0 = B.gcd(B.gcd(a, b), a * b); const A2 = b / g0, B2 = a / g0, C2 = a * b / g0;
      const rel = side === 'in' ? (strict ? '<' : '\\le') : (strict ? '>' : '\\ge');
      el.querySelector('#gd-o').innerHTML = 'Garis lewat (' + a + ', 0) dan (0, ' + b + '): ' + B.rich('$' + b + 'x+' + a + 'y=' + (a * b) + '$') + ' → disederhanakan ' + B.rich('$' + (A2 === 1 ? '' : A2) + 'x+' + (B2 === 1 ? '' : B2) + 'y=' + C2 + '$') + '.<br>Pertidaksamaannya: <b>' + B.rich('$' + (A2 === 1 ? '' : A2) + 'x+' + (B2 === 1 ? '' : B2) + 'y' + rel + ' ' + C2 + '$') + '</b> (uji (0,0): 0 ' + (side === 'in' ? 'memenuhi' : 'tidak memenuhi') + ').';
    }
    A.addEventListener('input', draw); Bv.addEventListener('input', draw); bindSeg(el, 'gd-s', draw); bindSeg(el, 'gd-t', draw); draw();
  };

  /* ---------- AM-GM: persegi panjang keliling tetap ---------- */
  W.amgm = function (el) {
    el.innerHTML = '<p class="w-read">Keliling selalu 20, jadi panjang + lebar = 10. Ubah panjangnya.</p><div class="w-row">' + slider('ag-x', 'panjang', 0.5, 9.5, 0.5, 8) + '</div><svg class="w-svg" viewBox="0 0 600 260" id="ag-svg" role="img" aria-label="Persegi panjang dan perbandingan rata-rata"></svg><p class="w-read" id="ag-o" aria-live="polite"></p>';
    const xs = el.querySelector('#ag-x'), svg = el.querySelector('#ag-svg');
    function draw() {
      const p = +xs.value, l = 10 - p; el.querySelector('#ag-x-o').textContent = fmt(p, 1);
      const s = 20; const am = (p + l) / 2, gm = Math.sqrt(p * l);
      let g = '<rect x="20" y="' + (230 - l * s) + '" width="' + (p * s) + '" height="' + (l * s) + '" class="w-box"/><text x="' + (20 + p * s / 2) + '" y="' + (230 - l * s / 2 + 6) + '" class="w-boxt" text-anchor="middle">L = ' + fmt(p * l, 2) + '</text>';
      g += '<rect x="20" y="30" width="100" height="100" class="w-ghostbox"/><text x="70" y="22" class="w-tl lg" text-anchor="middle">persegi 5×5 = 25</text>';
      const bx = 300; g += '<text x="' + bx + '" y="40" class="w-tl lg" text-anchor="start">AM = (p+l)/2 = ' + fmt(am, 2) + '</text><rect x="' + bx + '" y="48" width="' + (am * 28) + '" height="22" rx="5" class="w-fill-ok"/>';
      g += '<text x="' + bx + '" y="104" class="w-tl lg" text-anchor="start">GM = √(p·l) = ' + fmt(gm, 2) + '</text><rect x="' + bx + '" y="112" width="' + (gm * 28) + '" height="22" rx="5" class="w-fill-gm"/>';
      svg.innerHTML = g;
      el.querySelector('#ag-o').innerHTML = 'GM ≤ AM selalu: ' + fmt(gm, 2) + ' ≤ ' + fmt(am, 2) + '. Luas = GM² ≤ AM² = 25. ' + (Math.abs(p - 5) < 1e-9 ? '<b class="ok">Sama persis saat panjang = lebar (persegi)!</b>' : 'Sama dengan hanya jika panjang = lebar.');
    }
    xs.addEventListener('input', draw); draw();
  };

  /* ---------- Ketaksamaan segitiga |a+b| ≤ |a|+|b| ---------- */
  W.segitiga = function (el) {
    el.innerHTML = '<div class="w-grid3">' + slider('sg-a', 'a', -6, 6, 1, 4) + slider('sg-b', 'b', -6, 6, 1, -3) + '</div><svg class="w-svg" viewBox="0 0 600 150" id="sg-svg" role="img" aria-label="Langkah a lalu b di garis bilangan"></svg><p class="w-read" id="sg-o" aria-live="polite"></p>';
    const A = el.querySelector('#sg-a'), Bv = el.querySelector('#sg-b'), svg = el.querySelector('#sg-svg'), X = NLX(-12, 12);
    function draw() {
      const a = +A.value, b = +Bv.value; el.querySelector('#sg-a-o').textContent = a; el.querySelector('#sg-b-o').textContent = b;
      let g = axis(-12, 12, X, 120, 4);
      g += '<path d="M' + X(0) + ' 40 L' + X(a) + ' 40" class="w-stepA" marker-end=""/><circle cx="' + X(a) + '" cy="40" r="5" class="w-ptA"/>';
      g += '<path d="M' + X(a) + ' 70 L' + X(a + b) + ' 70" class="w-stepB"/><circle cx="' + X(a + b) + '" cy="70" r="5" class="w-ptB"/>';
      g += '<line x1="' + X(0) + '" x2="' + X(a + b) + '" y1="100" y2="100" class="w-stepS"/><circle cx="' + X(a + b) + '" cy="120" r="7" class="nl-dot"/>';
      g += '<text x="' + X(0) + '" y="30" class="w-tl" text-anchor="middle">mulai di 0</text>';
      svg.innerHTML = g;
      const L = Math.abs(a + b), Rr = Math.abs(a) + Math.abs(b);
      el.querySelector('#sg-o').innerHTML = 'Jarak akhir dari 0: |a + b| = ' + L + ' · total langkah: |a| + |b| = ' + Rr + ' → ' + (L === Rr ? '<b class="ok">sama, karena a dan b searah (atau salah satunya 0)</b>' : '<b class="flip">lebih pendek, karena ada langkah balik arah</b>') + '.';
    }
    A.addEventListener('input', draw); Bv.addEventListener('input', draw); draw();
  };
})(typeof window !== 'undefined' ? window : globalThis);
