/* Batas — generator soal (tak terbatas, berbiji, kunci dihitung otomatis) */
(function (G) {
  'use strict';
  const B = G.BM, C = G.BC = G.BC || {};
  const T = B.numTex;
  const GEN = C.GEN = {};
  const REL = ['<', '\\le', '>', '\\ge'];
  const relFn = { '<': (a, b) => a < b, '\\le': (a, b) => a <= b + 1e-12, '>': (a, b) => a > b, '\\ge': (a, b) => a >= b - 1e-12 };
  const flipRel = { '<': '>', '>': '<', '\\le': '\\ge', '\\ge': '\\le' };
  // koefisien linear "ax+b" sebagai TeX rapi
  function lin(a, b, v) {
    v = v || 'x';
    let s = a === 1 ? v : a === -1 ? '-' + v : a + v;
    if (b > 0) s += '+' + b; else if (b < 0) s += '-' + (-b);
    return s;
  }
  function poly2(a, b, c) { // ax^2+bx+c
    let s = a === 1 ? 'x^2' : a === -1 ? '-x^2' : a + 'x^2';
    if (b) s += (b > 0 ? '+' : '-') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'x';
    if (c) s += (c > 0 ? '+' : '-') + Math.abs(c);
    return s;
  }
  const fac = (r) => r === 0 ? 'x' : r > 0 ? '(x-' + r + ')' : '(x+' + (-r) + ')';
  function mk(name, seed, o) {
    o.id = 'g:' + name + ':' + seed; o.gen = name; o.seed = seed; o.mode = o.mode || ['sekolah'];
    if (o.ansSet) o.ans = B.toTxt(o.ansSet);
    return o;
  }
  function mcFromSets(correct, wrongs) { // -> opts
    const opts = [{ t: '$' + B.toIneqTex(correct) + '$', ok: 1 }];
    const seen = [correct];
    for (const w of wrongs) {
      if (seen.some(s => B.same(s, w.set))) continue;
      seen.push(w.set); opts.push({ t: '$' + B.toIneqTex(w.set) + '$', why: w.why, trap: w.trap });
      if (opts.length >= 4) break;
    }
    return opts;
  }

  /* ----------------- PRASYARAT ----------------- */
  GEN.p1 = { pre: 'P1', lvl: 1, concepts: ['urutan'], make(seed) {
    const r = B.rng(seed);
    const kinds = [() => [-r.int(1, 15), -r.int(1, 15)], () => [-r.int(1, 9) / r.pick([2, 4, 5]), -r.int(1, 9) / r.pick([3, 4, 10])], () => [r.int(-9, 9) / 10, r.int(-99, 99) / 100]];
    let [a, b] = r.pick(kinds)(); if (B.eq(a, b)) b = b - 1;
    const right = a < b ? '<' : '>';
    const opts = [{ t: '$' + T(a) + '<' + T(b) + '$', ok: right === '<' ? 1 : 0 }, { t: '$' + T(a) + '>' + T(b) + '$', ok: right === '>' ? 1 : 0 }];
    opts.forEach(o => { if (!o.ok) o.why = 'Di garis bilangan, $' + T(Math.min(a, b)) + '$ ada di sebelah kiri $' + T(Math.max(a, b)) + '$.'; });
    return mk('p1', seed, { sec: 0, pre: 'P1', lvl: 1, type: 'mc', concepts: ['urutan'], q: 'Mana yang benar?', opts, sol: '$' + T(Math.min(a, b)) + '<' + T(Math.max(a, b)) + '$ (lebih kiri = lebih kecil).' });
  } };
  GEN.p2 = { pre: 'P2', lvl: 1, concepts: ['tanda'], make(seed) {
    const r = B.rng(seed); const n = r.int(3, 5); const fs = []; for (let i = 0; i < n; i++) fs.push(r.nz(-9, 9));
    const div = r() < 0.5; const neg = fs.filter(v => v < 0).length;
    const parts = fs.map(v => '(' + v + ')');
    const q = div ? '$\\frac{' + parts.slice(0, n - 1).join('') + '}{' + parts[n - 1] + '}$' : '$' + parts.join('') + '$';
    const pos = neg % 2 === 0;
    return mk('p2', seed, { sec: 0, pre: 'P2', lvl: 1, type: 'mc', concepts: ['tanda'], q: 'Tanda dari ' + q + ' adalah…', opts: [
      { t: 'positif', ok: pos ? 1 : 0, why: pos ? '' : 'Ada ' + neg + ' faktor negatif (ganjil).' }, { t: 'negatif', ok: pos ? 0 : 1, why: pos ? 'Ada ' + neg + ' faktor negatif (genap).' : '' }, { t: 'nol', why: 'Tidak ada faktor nol.' }],
      sol: 'Faktor negatif ada ' + neg + ' (' + (pos ? 'genap → positif' : 'ganjil → negatif') + ').' });
  } };
  GEN.p3 = { pre: 'P3', lvl: 1, concepts: ['aljabar'], make(seed) {
    const r = B.rng(seed); const a = r.int(2, 12), b = r.int(2, 5), c = r.nz(-6, 6);
    // a - b(x - c) = (a + b c) - b x
    const k = a + b * c, kw = a - b * c;
    const e = (k0) => '$' + (k0 === 0 ? '' : k0) + '-' + b + 'x$';
    const opts = [{ t: e(k), ok: 1 }, { t: e(kw), why: 'Tanda $-' + b + '\\cdot(' + (-c) + ')$ belum dibalik dengan benar.', trap: 'distribusi-negatif' }, { t: '$' + (a - b) + 'x' + (c > 0 ? '-' : '+') + Math.abs((a - b) * c) + '$', why: 'Perkalian didahulukan; $' + a + '$ tidak boleh dikurangkan dengan ' + b + ' dulu.' }, { t: '$' + (a + c) + '-' + b + 'x$', why: 'Bilangan ' + (-c) + ' di dalam kurung juga harus dikali ' + (-b) + '.' }];
    return mk('p3', seed, { sec: 0, pre: 'P3', lvl: 1, type: 'mc', concepts: ['aljabar'], trap: 'distribusi-negatif', q: 'Sederhanakan $' + a + '-' + b + '(x' + (c > 0 ? '-' : '+') + Math.abs(c) + ')$.', opts, sol: '$' + a + '-' + b + 'x' + (b * c >= 0 ? '+' : '') + (b * c) + '=' + k + '-' + b + 'x$.' });
  } };
  GEN.p4 = { pre: 'P4', lvl: 1, concepts: ['faktor'], make(seed) {
    const r = B.rng(seed); let p = r.nz(-7, 7), q = r.nz(-7, 7); if (p === -q) q += 1; if (q === 0) q = 2;
    const b = -(p + q), c = p * q;
    const f = (x, y) => '$' + fac(x) + fac(y) + '$';
    const cands = [[p, q, 1], [-p, -q, 0], [p, -q, 0], [-p, q, 0]];
    const opts = []; const seen = new Set();
    cands.forEach(([x, y, ok]) => { const k = [x, y].sort().join(','); if (seen.has(k)) return; seen.add(k); opts.push({ t: f(x, y), ok, why: ok ? '' : 'Kalikan balik: hasilnya bukan $' + poly2(1, b, c) + '$.' }); });
    return mk('p4', seed, { sec: 0, pre: 'P4', lvl: 1, type: 'mc', concepts: ['faktor'], q: 'Faktorkan $' + poly2(1, b, c) + '$.', opts, sol: 'Dua bilangan: dikali ' + c + ', dijumlah ' + b + ' → ' + p + ' dan ' + q + '. Hasil: ' + f(p, q) + '.' });
  } };
  GEN.p5 = { pre: 'P5', lvl: 1, concepts: ['persamaan'], make(seed) {
    const r = B.rng(seed); const a = r.nz(-8, 8), b0 = r.int(2, 9), c0 = r.nz(-9, 9);
    // linear: a x + c0 = b0*a + c0  -> x = b0
    const rhs = a * b0 + c0;
    return mk('p5', seed, { sec: 0, pre: 'P5', lvl: 1, type: 'num', concepts: ['persamaan'], q: 'Selesaikan $' + lin(a, c0) + '=' + rhs + '$. Nilai $x$ = …', ans: b0, sol: '$' + a + 'x=' + (rhs - c0) + ' \\Rightarrow x=' + b0 + '$.' });
  } };
  GEN.p7 = { pre: 'P7', lvl: 2, concepts: ['interval-ops'], make(seed) {
    const r = B.rng(seed);
    const rnd = () => { const t = r.int(0, 3); const a = r.int(-6, 4), b = a + r.int(1, 6); if (t === 0) return B.I(-Infinity, b, false, r() < .5); if (t === 1) return B.I(a, Infinity, r() < .5, false); return B.I(a, b, r() < .5, r() < .5); };
    let s1 = [rnd()], s2 = [rnd()]; const op = r() < 0.6 ? 'cap' : 'cup';
    let ans = op === 'cap' ? B.intersect(s1, s2) : B.union(s1, s2);
    if (op === 'cap' && !ans.length) { s2 = [B.I(s1[0].a === -Infinity ? -8 : s1[0].a - 1, Infinity, true, false)]; ans = B.intersect(s1, s2); }
    return mk('p7', seed, { sec: 0, pre: 'P7', lvl: 2, type: 'interval', concepts: ['interval-ops'], q: 'Tentukan $' + B.toTex(s1) + (op === 'cap' ? '\\cap ' : '\\cup ') + B.toTex(s2) + '$.', ansSet: ans, hints: ['Gambar keduanya di satu garis bilangan.', op === 'cap' ? 'Irisan: ambil yang tumpang tindih.' : 'Gabungan: ambil semuanya.'], sol: 'Jawaban: $' + B.toTex(ans) + '$.' });
  } };
  GEN.p9 = { pre: 'P9', lvl: 1, concepts: ['akar-mutlak'], make(seed) {
    const r = B.rng(seed); const a = r.int(-12, 12), b = r.int(-12, 12);
    if (r() < 0.5) return mk('p9', seed, { sec: 0, pre: 'P9', lvl: 1, type: 'num', concepts: ['akar-mutlak'], q: '$\\sqrt{(' + a + ')^2}=\\;?$', ans: Math.abs(a), wrong: a < 0 ? [{ v: a, why: 'Akar kuadrat selalu tak negatif.' }] : [], sol: '$\\sqrt{' + a * a + '}=' + Math.abs(a) + '$.' });
    return mk('p9', seed, { sec: 0, pre: 'P9', lvl: 1, type: 'num', concepts: ['akar-mutlak'], q: 'Jarak antara $' + a + '$ dan $' + b + '$ di garis bilangan, yaitu $|' + a + '-(' + b + ')|$, adalah…', ans: Math.abs(a - b), sol: '$|' + (a - b) + '|=' + Math.abs(a - b) + '$.' });
  } };
  GEN.p10 = { pre: 'P10', lvl: 1, concepts: ['eksp-log-dasar'], make(seed) {
    const r = B.rng(seed); const a = r.pick([2, 3, 5]); const k = r.int(-2, 4);
    const val = Math.pow(a, k);
    const vt = k < 0 ? '\\frac{1}{' + Math.pow(a, -k) + '}' : String(val);
    return mk('p10', seed, { sec: 0, pre: 'P10', lvl: 1, type: 'num', concepts: ['eksp-log-dasar'], q: '$\\log_' + a + ' ' + vt + '=\\;?$', ans: k, sol: '$' + a + '^{' + k + '}=' + vt + '$.' });
  } };

  /* ----------------- BAGIAN 1 ----------------- */
  GEN.s1a = { sec: 1, lvl: 1, concepts: ['notasi-interval'], make(seed) {
    const r = B.rng(seed); const a = r.int(-8, 3), b = a + r.int(1, 7); const t = r.int(0, 3);
    const ca = r() < .5, cb = r() < .5;
    let set, txt;
    if (t === 0) { set = [B.I(a, b, ca, cb)]; txt = a + (ca ? '\\le ' : '<') + 'x' + (cb ? '\\le ' : '<') + b; }
    else if (t === 1) { set = [B.I(-Infinity, b, false, cb)]; txt = 'x' + (cb ? '\\le ' : '<') + b; }
    else if (t === 2) { set = [B.I(a, Infinity, ca, false)]; txt = 'x' + (ca ? '\\ge ' : '>') + a; }
    else { set = B.norm([B.I(-Infinity, a, false, ca), B.I(b, Infinity, cb, false)]); txt = 'x' + (ca ? '\\le ' : '<') + a + '\\text{ atau }x' + (cb ? '\\ge ' : '>') + b; }
    const flipEnds = B.norm(set.map(p => B.I(p.a, p.b, isFinite(p.a) ? !p.ca : false, isFinite(p.b) ? !p.cb : false)));
    return mk('s1a', seed, { sec: 1, lvl: 1, type: 'interval', concepts: ['notasi-interval'], trap: 'titik-ujung', q: 'Tulis $' + txt + '$ dalam notasi interval.', ansSet: set, wrong: [{ set: flipEnds, why: 'Kurungnya tertukar: ≤/≥ pakai [ ], < / > pakai ( ).', trap: 'titik-ujung' }], sol: '$' + B.toTex(set) + '$.' });
  } };
  GEN.s1b = { sec: 1, lvl: 2, concepts: ['sifat-dasar'], make(seed) {
    const r = B.rng(seed); const k = r.int(-5, 5), a = r.nz(-4, 4), b = r.int(-6, 6); const rel = r.pick(REL);
    // diketahui x rel k, tentukan himpunan nilai a x + b
    const lim = a * k + b;
    const out = a > 0 ? rel : flipRel[rel];
    const set = solveRel(out, lim);
    const wrongSet = solveRel(rel, lim);
    return mk('s1b', seed, { sec: 1, lvl: 2, type: 'interval', concepts: ['sifat-dasar'], trap: 'balik-tanda', q: 'Jika $x' + rel + ' ' + k + '$, maka nilai $' + lin(a, b) + '$ berada pada interval… <span class="muted">(tulis sebagai interval)</span>', ansSet: set,
      wrong: a < 0 ? [{ set: wrongSet, why: 'Mengali ' + a + ' (negatif) harus membalik tanda.', trap: 'balik-tanda' }] : [],
      hints: ['Kalikan kedua ruas $x' + rel + ' ' + k + '$ dengan ' + a + (a < 0 ? ' (negatif!)' : '') + ', lalu tambahkan ' + b + '.'], sol: '$' + lin(a, b) + (out) + ' ' + lim + '$, jadi $' + B.toTex(set) + '$.' });
  } };
  function solveRel(rel, k) { return rel === '<' ? [B.I(-Infinity, k, false, false)] : rel === '\\le' ? [B.I(-Infinity, k, false, true)] : rel === '>' ? [B.I(k, Infinity, false, false)] : [B.I(k, Infinity, true, false)]; }

  /* ----------------- BAGIAN 2 ----------------- */
  GEN.s2a = { sec: 2, lvl: 1, concepts: ['linear'], make(seed) {
    const r = B.rng(seed);
    let a = r.nz(-7, 7), c = r.nz(-7, 7); while (a === c) c = r.nz(-7, 7);
    const x0 = r.int(-6, 6), b = r.int(-9, 9), d = (a - c) * x0 + b; // a x + b = c x + d at x0
    const rel = r.pick(REL);
    const pred = x => relFn[rel](a * x + b, c * x + d);
    const set = B.solve(pred, [x0]);
    const wrongSet = B.complement(set).filter(p => !B.eq(p.a, p.b));
    return mk('s2a', seed, { sec: 2, lvl: 1, type: 'interval', concepts: ['linear'], trap: (a - c) < 0 ? 'balik-tanda' : undefined, q: 'Selesaikan $' + lin(a, b) + rel + ' ' + lin(c, d) + '$.', ansSet: set,
      wrong: [{ set: B.norm(wrongSet.map(p => B.I(p.a, p.b, isFinite(p.a) ? set.some(s => s.cb) : false, isFinite(p.b) ? set.some(s => s.ca) : false))), why: 'Arah tandanya terbalik. Biasanya karena membagi bilangan negatif tanpa membalik tanda.', trap: 'balik-tanda' }],
      hints: ['Kumpulkan suku $x$ di satu ruas, konstanta di ruas lain.', 'Kalau membagi negatif, balik tanda.'], sol: '$' + (a - c) + 'x' + rel + ' ' + (d - b) + '$, jadi $' + B.toIneqTex(set) + '$.' });
  } };
  GEN.s2b = { sec: 2, lvl: 2, concepts: ['berantai'], make(seed) {
    const r = B.rng(seed); const a = r.nz(-4, 4), b = r.int(-8, 8);
    const x1 = r.int(-6, 2), x2 = x1 + r.int(2, 7);
    let lo = a * x1 + b, hi = a * x2 + b; if (lo > hi) [lo, hi] = [hi, lo];
    const r1 = r.pick(['<', '\\le']), r2 = r.pick(['<', '\\le']);
    const pred = x => relFn[r1](lo, a * x + b) && relFn[r2](a * x + b, hi);
    const set = B.solve(pred, [x1, x2]);
    return mk('s2b', seed, { sec: 2, lvl: 2, type: 'interval', concepts: ['berantai'], trap: a < 0 ? 'balik-tanda' : 'berantai-sebagian', q: 'Selesaikan $' + lo + r1 + ' ' + lin(a, b) + r2 + ' ' + hi + '$.', ansSet: set,
      hints: ['Kurangi ' + b + ' di ketiga ruas.', 'Bagi ketiga ruas dengan ' + a + (a < 0 ? ' dan balik kedua tanda.' : '.')], sol: '$' + B.toIneqTex(set) + '$.' });
  } };

  /* ----------------- BAGIAN 3 ----------------- */
  GEN.s3a = { sec: 3, lvl: 1, concepts: ['kuadrat'], make(seed) {
    const r = B.rng(seed); let p = r.int(-6, 5), q = p + r.int(1, 7);
    const lead = r() < 0.25 ? -1 : 1; const rel = r.pick(REL);
    const b = -lead * (p + q), c = lead * p * q;
    const pred = x => relFn[rel](lead * (x * x) + b * x + c, 0);
    const set = B.solve(pred, [p, q]);
    const flip = B.solve(x => relFn[flipRel[rel]](lead * (x * x) + b * x + c, 0), [p, q]);
    return mk('s3a', seed, { sec: 3, lvl: lead < 0 ? 2 : 1, type: 'interval', concepts: ['kuadrat'], trap: lead < 0 ? 'a-negatif' : 'arah-daerah', q: 'Selesaikan $' + poly2(lead, b, c) + rel + ' 0$.', ansSet: set,
      wrong: [{ set: flip, why: 'Daerahnya terbalik. Uji satu titik, misalnya $x=' + B.witness(flip) + '$.', trap: lead < 0 ? 'a-negatif' : 'arah-daerah' }],
      hints: [lead < 0 ? 'Kalikan −1 dulu dan balik tandanya.' : 'Faktorkan dulu.', 'Akarnya ' + p + ' dan ' + q + '. Di antara atau di luar?'], sol: (lead < 0 ? '$' + poly2(1, -b, -c) + flipRel[rel] + ' 0$, ' : '') + '$' + fac(p) + fac(q) + (lead < 0 ? flipRel[rel] : rel) + ' 0$ → $' + B.toIneqTex(set) + '$.' });
  } };
  GEN.s3b = { sec: 3, lvl: 2, concepts: ['kuadrat', 'diskriminan'], make(seed) {
    const r = B.rng(seed); const lead = r.pick([1, 1, -1]); const k = r.int(-4, 4); const m = r.int(1, 6); const rel = r.pick(REL);
    // lead*((x-k)^2 + m)  -> D<0 ; atau kuadrat sempurna (m=0) sesekali
    const perf = r() < 0.35; const mm = perf ? 0 : m;
    const a = lead, b = -2 * k * lead, c = lead * (k * k + mm);
    const pred = x => relFn[rel](a * x * x + b * x + c, 0);
    const set = B.solve(pred, [k]);
    return mk('s3b', seed, { sec: 3, lvl: 2, type: 'interval', concepts: ['diskriminan'], trap: perf ? 'kuadrat-sempurna' : 'd-negatif', q: 'Selesaikan $' + poly2(a, b, c) + rel + ' 0$. <span class="muted">(Ketik R untuk semua bilangan real, atau kosong.)</span>', ansSet: set,
      hints: ['Hitung $D=b^2-4ac$.', perf ? 'Bentuknya kuadrat sempurna: $' + (lead < 0 ? '-' : '') + fac(k) + '^2$.' : '$D<0$: parabola tidak menyentuh sumbu-x.'], sol: '$D=' + (b * b - 4 * a * c) + '$. Jawaban: $' + B.toTex(set) + '$.' });
  } };

  /* ----------------- BAGIAN 4 ----------------- */
  GEN.s4a = { sec: 4, lvl: 2, concepts: ['tabel-tanda'], make(seed) {
    const r = B.rng(seed); const n = r.int(2, 3); const roots = r.shuffle([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4]).slice(0, n).sort((a, b) => a - b);
    const pw = roots.map(() => r() < 0.35 ? 2 : 1); if (pw.every(v => v === 2)) pw[0] = 1;
    const rel = r.pick(REL);
    const f = x => roots.reduce((acc, ro, i) => acc * Math.pow(x - ro, pw[i]), 1);
    const set = B.solve(x => relFn[rel](f(x), 0), roots);
    const naive = B.solve(x => relFn[rel](roots.reduce((acc, ro) => acc * (x - ro), 1), 0), roots);
    const expr = roots.map((ro, i) => fac(ro) + (pw[i] === 2 ? '^2' : '')).join('');
    return mk('s4a', seed, { sec: 4, lvl: pw.includes(2) ? 3 : 2, type: 'interval', concepts: ['tabel-tanda'], trap: pw.includes(2) ? 'tanda-akar-genap' : undefined, q: 'Selesaikan $' + expr + rel + ' 0$.', ansSet: set,
      wrong: pw.includes(2) ? [{ set: naive, why: 'Di akar berpangkat genap, tanda tidak berganti.', trap: 'tanda-akar-genap' }] : [],
      hints: ['Daerah paling kanan bertanda +.', 'Berganti di akar berpangkat ganjil, tetap di akar berpangkat genap.', 'Cek titik-titik akar satu per satu.'], sol: 'Jawaban: $' + B.toTex(set) + '$.' });
  } };

  /* ----------------- BAGIAN 5 ----------------- */
  GEN.s5a = { sec: 5, lvl: 1, concepts: ['rasional', 'syarat-penyebut'], make(seed) {
    const r = B.rng(seed); let a = r.int(-6, 6), b = r.int(-6, 6); while (a === b) b = r.int(-6, 6);
    const rel = r.pick(REL);
    const f = x => (x - a) / (x - b);
    const set = B.solve(x => x !== b && relFn[rel](f(x), 0), [a, b]);
    const closed = B.union(set, (rel === '\\le' || rel === '\\ge') ? [B.PT(b)] : []);
    return mk('s5a', seed, { sec: 5, lvl: 1, type: 'interval', concepts: ['rasional', 'syarat-penyebut'], trap: 'penyebut-tertutup', q: 'Selesaikan $\\frac{' + lin(1, -a) + '}{' + lin(1, -b) + '}' + rel + ' 0$.', ansSet: set,
      wrong: [{ set: closed, why: '$x=' + b + '$ membuat penyebut nol, jadi tidak boleh termasuk.', trap: 'penyebut-tertutup' }],
      hints: ['Pembuat nol pembilang ' + a + ', penyebut ' + b + '.', 'Penyebut selalu bulat kosong.'], sol: '$' + B.toIneqTex(set) + '$.' });
  } };
  GEN.s5b = { sec: 5, lvl: 2, concepts: ['rasional'], make(seed) {
    const r = B.rng(seed); const b = r.int(-5, 5); let k = r.nz(-3, 3); let a = r.int(-6, 6); if (a === b) a = b + 2;
    const rel = r.pick(REL);
    // (x-a)/(x-b) rel k  -> ((1-k)x + (kb - a))/(x-b) rel 0
    const f = x => (x - a) / (x - b) - k;
    const crit = [b]; if (1 - k !== 0) crit.push((a - k * b) / (1 - k));
    const set = B.solve(x => x !== b && relFn[rel]((x - a) / (x - b), k), crit);
    const cross = B.solve(x => relFn[rel](x - a, k * (x - b)), crit.length > 1 ? [crit[1]] : [0]);
    return mk('s5b', seed, { sec: 5, lvl: 2, type: 'interval', concepts: ['rasional'], trap: 'kali-silang', q: 'Selesaikan $\\frac{' + lin(1, -a) + '}{' + lin(1, -b) + '}' + rel + ' ' + k + '$.', ansSet: set,
      wrong: [{ set: B.minus(cross, [B.PT(b)]), why: 'Itu hasil kali silang. Penyebut bisa negatif, jadi tanda bisa harus dibalik.', trap: 'kali-silang' }],
      hints: ['Pindahkan ' + k + ' ke ruas kiri.', 'Satukan menjadi satu pecahan, lalu tabel tanda.'], sol: 'Jawaban: $' + B.toIneqTex(set) + '$.' });
  } };

  /* ----------------- BAGIAN 6 ----------------- */
  GEN.s6a = { sec: 6, lvl: 1, concepts: ['irasional', 'syarat-akar'], make(seed) {
    const r = B.rng(seed); const p = r.pick([1, 1, 2]); const q = r.int(-6, 6); const k = r.int(1, 4); const rel = r.pick(REL);
    // sqrt(p x - q) rel k
    const dom = q / p, bound = (k * k + q) / p;
    const set = B.solve(x => p * x - q >= -1e-12 && relFn[rel](Math.sqrt(Math.max(0, p * x - q)), k), [dom, bound]);
    const noDom = B.solve(x => relFn[rel](p * x - q, k * k), [bound]);
    return mk('s6a', seed, { sec: 6, lvl: 1, type: 'interval', concepts: ['irasional', 'syarat-akar'], trap: 'syarat-akar', q: 'Selesaikan $\\sqrt{' + lin(p, -q) + '}' + rel + ' ' + k + '$.', ansSet: set,
      wrong: [{ set: noDom, why: 'Syarat isi akar ≥ 0 belum dipakai.', trap: 'syarat-akar' }],
      hints: ['Syarat: $' + lin(p, -q) + '\\ge0$.', 'Ruas kanan positif, jadi boleh dikuadratkan.'], sol: 'Syarat $x\\ge' + T(dom) + '$. Kuadratkan: $' + lin(p, -q) + rel + ' ' + k * k + '$. Iris: $' + B.toTex(set) + '$.' });
  } };

  /* ----------------- BAGIAN 7 ----------------- */
  GEN.s7a = { sec: 7, lvl: 1, concepts: ['mutlak'], make(seed) {
    const r = B.rng(seed); const p = r.pick([1, 1, 2, 3, -1, -2]); const q = r.int(-6, 6); const neg = r() < 0.12; const k = neg ? -r.int(1, 3) : r.int(1, 6); const rel = r.pick(REL);
    const f = x => Math.abs(p * x + q);
    const crit = [(-k - q) / p, (k - q) / p, -q / p];
    const set = B.solve(x => relFn[rel](f(x), k), crit);
    const swapRel = { '<': '>', '\\le': '\\ge', '>': '<', '\\ge': '\\le' }[rel];
    const swapped = neg ? [] : B.solve(x => relFn[swapRel](f(x), k), crit);
    return mk('s7a', seed, { sec: 7, lvl: neg ? 2 : 1, type: 'interval', concepts: ['mutlak'], trap: neg ? (rel[0] === '<' || rel === '\\le' ? 'mutlak-negatif-kecil' : 'mutlak-negatif-besar') : 'dekat-jauh', q: 'Selesaikan $|' + lin(p, q) + '|' + rel + ' ' + k + '$.' + (neg ? ' <span class="muted">(Ketik R atau kosong bila perlu.)</span>' : ''), ansSet: set,
      wrong: neg ? [] : [{ set: B.norm(swapped), why: rel[0] === '<' || rel === '\\le' ? '"Kurang dari" = dekat = satu interval.' : '"Lebih dari" = jauh = dua arah.', trap: 'dekat-jauh' }],
      hints: neg ? ['Nilai mutlak tidak pernah negatif.'] : ['Ubah ke bentuk tanpa mutlak.', rel[0] === '<' || rel === '\\le' ? '$-' + k + rel + ' ' + lin(p, q) + rel + ' ' + k + '$' : '$' + lin(p, q) + flipRel[rel] + ' -' + k + '$ atau $' + lin(p, q) + rel + ' ' + k + '$'], sol: 'Jawaban: $' + B.toTex(set) + '$.' });
  } };

  /* ----------------- BAGIAN 8 ----------------- */
  GEN.s8a = { sec: 8, lvl: 1, concepts: ['eksponen'], make(seed) {
    const r = B.rng(seed); const base = r.pick([[2, '2'], [3, '3'], [0.5, '\\frac12'], [1 / 3, '\\frac13']]); const p = r.pick([1, 1, 2, -1]); const q = r.int(-3, 3); const k = r.int(-2, 4); const rel = r.pick(REL);
    const bb = base[0];
    const rhsVal = Math.pow(bb, k); const rhs = B.frac(rhsVal); const rhsT = rhs ? (rhs.q === 1 ? String(rhs.p) : '\\frac{' + rhs.p + '}{' + rhs.q + '}') : T(rhsVal);
    const flip = B.solve(x => relFn[rel](p * x + q, k), [(k - q) / p]);
    // catatan: untuk basis<1, a^f rel a^k <=> f rel' k (dibalik)
    const correct = bb > 1 ? flip : B.solve(x => relFn[flipRel[rel]](p * x + q, k), [(k - q) / p]);
    return mk('s8a', seed, { sec: 8, lvl: bb < 1 ? 2 : 1, type: 'interval', concepts: ['eksponen'], trap: bb < 1 ? 'basis-kecil' : undefined, q: 'Selesaikan $' + base[1] + '^{' + lin(p, q) + '}' + rel + ' ' + rhsT + '$.', ansSet: correct,
      wrong: bb < 1 ? [{ set: flip, why: 'Basis antara 0 dan 1: tanda harus dibalik.', trap: 'basis-kecil' }] : [],
      hints: ['Tulis ruas kanan sebagai $' + base[1] + '^{' + k + '}$.', bb > 1 ? 'Basis > 1: tanda tetap.' : 'Basis < 1: tanda dibalik.'], sol: '$' + lin(p, q) + (bb > 1 ? rel : flipRel[rel]) + ' ' + k + '$ → $' + B.toIneqTex(correct) + '$.' });
  } };
  GEN.s8b = { sec: 8, lvl: 2, concepts: ['logaritma'], make(seed) {
    const r = B.rng(seed); const base = r.pick([[2, '2'], [3, '3'], [0.5, '\\frac12']]); const c = r.int(-4, 4); const k = r.int(0, 3); const rel = r.pick(REL);
    const bb = base[0]; const N = Math.pow(bb, k); // log_b(x - c) rel k  <=> x - c rel' N, x > c
    const relN = bb > 1 ? rel : flipRel[rel];
    const correct = B.solve(x => x - c > 0 && relFn[relN](x - c, N), [c, c + N]);
    const noDom = B.solve(x => relFn[relN](x - c, N), [c + N]);
    return mk('s8b', seed, { sec: 8, lvl: 2, type: 'interval', concepts: ['logaritma'], trap: 'syarat-numerus', q: 'Selesaikan $\\log_{' + base[1] + '}(' + lin(1, -c) + ')' + rel + ' ' + k + '$.', ansSet: correct,
      wrong: [{ set: noDom, why: 'Syarat numerus $' + lin(1, -c) + '>0$ terlupa.', trap: 'syarat-numerus' }],
      hints: ['Syarat numerus: $' + lin(1, -c) + '>0$.', '$' + k + '=\\log_{' + base[1] + '}' + T(N) + '$.' + (bb < 1 ? ' Basis < 1, balik tanda.' : '')], sol: 'Jawaban: $' + B.toIneqTex(correct) + '$.' });
  } };

  /* ----------------- BAGIAN 9 ----------------- */
  GEN.s9a = { sec: 9, lvl: 1, concepts: ['sptldv'], make(seed) {
    const r = B.rng(seed); const a = r.int(1, 4), b = r.int(1, 4), c = r.int(6, 14);
    const pts = []; const ok = (x, y) => a * x + b * y <= c && x >= 0 && y >= 0;
    // satu titik benar
    let good; for (let i = 0; i < 50 && !good; i++) { const x = r.int(0, 5), y = r.int(0, 5); if (ok(x, y)) good = [x, y]; }
    if (!good) good = [0, 0];
    const bads = []; for (let i = 0; i < 200 && bads.length < 3; i++) { const x = r.int(-2, 7), y = r.int(-1, 7); if (!ok(x, y) && !bads.some(p => p[0] === x && p[1] === y)) bads.push([x, y]); }
    const why = (x, y) => x < 0 ? '$x\\ge0$ tidak terpenuhi.' : y < 0 ? '$y\\ge0$ tidak terpenuhi.' : '$' + a + '\\cdot' + x + '+' + b + '\\cdot' + y + '=' + (a * x + b * y) + '>' + c + '$.';
    const opts = [{ t: '$(' + good[0] + ',' + good[1] + ')$', ok: 1 }].concat(bads.map(p => ({ t: '$(' + p[0] + ',' + p[1] + ')$', why: why(p[0], p[1]) })));
    return mk('s9a', seed, { sec: 9, lvl: 1, type: 'mc', concepts: ['sptldv'], q: 'Titik mana yang ada di daerah $' + (a === 1 ? '' : a) + 'x+' + (b === 1 ? '' : b) + 'y\\le' + c + '$, $x\\ge0$, $y\\ge0$?', opts, sol: 'Substitusikan tiap titik ke semua pertidaksamaan.' });
  } };


  /* ----------------- LINTAS BAB ----------------- */
  GEN.x1 = { sec: 6, lvl: 4, concepts: ['rasional', 'syarat-akar', 'lintas'], make(seed) {
    const r = B.rng(seed); let a = r.int(-6, 6), b = r.int(-6, 6); while (a === b) b = r.int(-6, 6);
    const set = B.solve(x => x !== b && (x - a) / (x - b) >= 0, [a, b]);
    return mk('x1', seed, { sec: 6, lvl: 4, lintas: 1, mode: ['utbk', 'mandiri'], type: 'interval', concepts: ['rasional', 'syarat-akar', 'lintas'], trap: 'penyebut-tertutup', q: 'Tentukan domain $f(x)=\\sqrt{\\frac{' + lin(1, -a) + '}{' + lin(1, -b) + '}}$.', ansSet: set,
      wrong: [{ set: B.union(set, [B.PT(b)]), why: '$x=' + b + '$ membuat penyebut nol.', trap: 'penyebut-tertutup' }], hints: ['Isi akar harus $\\ge0$, penyebut $\\ne0$.'], sol: '$\\frac{' + lin(1, -a) + '}{' + lin(1, -b) + '}\\ge0$ → $' + B.toTex(set) + '$.' });
  } };
  GEN.x2 = { sec: 7, lvl: 4, concepts: ['mutlak', 'kuadrat', 'lintas'], make(seed) {
    const r = B.rng(seed); const c = r.int(-3, 3), k = r.int(2, 5); let p = r.int(-5, 3), q = p + r.int(2, 5);
    const set = B.solve(x => Math.abs(x - c) < k && (x - p) * (x - q) >= 0, [c - k, c + k, p, q]);
    return mk('x2', seed, { sec: 7, lvl: 4, lintas: 1, mode: ['utbk', 'mandiri'], type: 'interval', concepts: ['mutlak', 'kuadrat', 'lintas'], q: 'Tentukan semua $x$ yang memenuhi $|' + lin(1, -c) + '|<' + k + '$ <b>dan</b> $' + fac(p) + fac(q) + '\\ge0$. <span class="muted">(Ketik kosong bila tidak ada.)</span>', ansSet: set,
      hints: ['Selesaikan masing-masing, lalu iris.'], sol: '$(' + (c - k) + ',' + (c + k) + ')$ diiris dengan $x\\le' + p + '$ atau $x\\ge' + q + '$: $' + B.toTex(set) + '$.' });
  } };
  GEN.x3 = { sec: 8, lvl: 4, concepts: ['logaritma', 'kuadrat', 'lintas'], make(seed) {
    const r = B.rng(seed); let p = r.int(-5, 2), q = p + r.int(1, 6);
    const set = B.solve(x => (x - p) * (x - q) > 0, [p, q]);
    return mk('x3', seed, { sec: 8, lvl: 3, lintas: 1, mode: ['utbk'], type: 'interval', concepts: ['logaritma', 'kuadrat', 'lintas'], trap: 'syarat-numerus', q: 'Tentukan domain $f(x)=\\log(' + poly2(1, -(p + q), p * q) + ')$.', ansSet: set, hints: ['Numerus harus $>0$.'], sol: '$' + fac(p) + fac(q) + '>0$ → $' + B.toTex(set) + '$.' });
  } };

  /* Peta: generator mana untuk bagian & level apa */
  C.GEN_BY_SEC = { 1: ['s1a', 's1b'], 2: ['s2a', 's2b'], 3: ['s3a', 's3b'], 4: ['s4a'], 5: ['s5a', 's5b'], 6: ['s6a'], 7: ['s7a'], 8: ['s8a', 's8b'], 9: ['s9a'] };
  C.GEN_BY_PRE = { P1: ['p1'], P2: ['p2'], P3: ['p3'], P4: ['p4'], P5: ['p5'], P6: [], P7: ['p7'], P8: [], P9: ['p9'], P10: ['p10'] };
  C.makeGen = function (name, seed) { const g = GEN[name]; if (!g) return null; try { return g.make(seed >>> 0); } catch (e) { console.error('gen', name, e); return null; } };
})(typeof window !== 'undefined' ? window : globalThis);
