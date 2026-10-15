/* Verifikasi independen generator soal: teks soal (LaTeX) diterjemahkan menjadi predikat, lalu kunci jawaban
   dibandingkan di ribuan titik. Ini menangkap generator yang salah menghitung kunci, bukan sekadar kunci yang
   bisa dibaca. Jalankan: npm test */
const path = require('path'); const ROOT = path.join(__dirname, '..');
globalThis.window = globalThis;
require(path.join(ROOT, 'js/math.js')); require(path.join(ROOT, 'js/expr.js'));
for (const f of ['content-a', 'content-b', 'bank', 'gen', 'cards', 'content-c', 'bank2', 'proofs', 'extras']) require(path.join(ROOT, 'courses/pertidaksamaan', f + '.js'));
const B = globalThis.BM, C = globalThis.BC, E = globalThis.NalarExpr;

/* --- LaTeX (subset yang dipakai generator) → ekspresi NalarExpr --- */
function group(s, i) { if (s[i] !== '{') return [s[i], i + 1]; let d = 0; for (let j = i; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}' && !--d) return [s.slice(i + 1, j), j + 1]; } throw new Error('kurung kurawal tidak seimbang'); }
function tr(s) {
  let r = '', i = 0, absOpen = false;
  while (i < s.length) {
    if (s.startsWith('\\dfrac', i) || s.startsWith('\\frac', i)) { i += s.startsWith('\\dfrac', i) ? 6 : 5; const [a, i1] = group(s, i); const [b, i2] = group(s, i1); r += '((' + tr(a) + ')/(' + tr(b) + '))'; i = i2; continue; }
    if (s.startsWith('\\sqrt', i)) { i += 5; if (s[i] === '[') throw new Error('akar pangkat n tidak didukung verifikator'); const [a, i1] = group(s, i); r += 'sqrt(' + tr(a) + ')'; i = i1; continue; }
    if (s.startsWith('\\log', i)) {
      i += 4; let base = '10'; if (s[i] === '_') { const [b, i1] = group(s, i + 1); base = tr(b); i = i1; }
      while (s[i] === ' ') i++;
      let arg; if (s[i] === '(') { let d = 0, j = i; for (; j < s.length; j++) { if (s[j] === '(') d++; else if (s[j] === ')' && !--d) break; } arg = s.slice(i + 1, j); i = j + 1; } else { const m = /^[a-z0-9]+/i.exec(s.slice(i)); arg = m[0]; i += arg.length; }
      r += '(ln(' + tr(arg) + ')/ln(' + base + '))'; continue;
    }
    if (s[i] === '^') { const [a, i1] = group(s, i + 1); r += '^(' + tr(a) + ')'; i = i1; continue; }
    if (s[i] === '|') { r += absOpen ? ')' : 'abs('; absOpen = !absOpen; i++; continue; }
    if (s.startsWith('\\pi', i)) { r += 'pi'; i += 3; continue; }
    if (s.startsWith('\\cdot', i) || s.startsWith('\\times', i)) { r += '*'; i += s.startsWith('\\cdot', i) ? 5 : 6; continue; }
    if (s.startsWith('\\left', i)) { i += 5; continue; } if (s.startsWith('\\right', i)) { i += 6; continue; }
    if (s[i] === '\\' && /[,;! ]/.test(s[i + 1])) { i += 2; continue; }
    if (s[i] === '\\') throw new Error('perintah LaTeX tak dikenal: ' + s.slice(i, i + 8));
    if (s[i] === '{' || s[i] === '}') { r += s[i] === '{' ? '(' : ')'; i++; continue; }
    r += s[i] === '−' ? '-' : s[i]; i++;
  }
  return r;
}
const REL = /\\geq?|\\leq?|\\neq?|\\ne|<|>|=/g;
const OPS = { '\\ge': (a, b) => a >= b - 1e-9, '\\geq': (a, b) => a >= b - 1e-9, '\\le': (a, b) => a <= b + 1e-9, '\\leq': (a, b) => a <= b + 1e-9, '<': (a, b) => a < b - 1e-9, '>': (a, b) => a > b + 1e-9, '\\ne': (a, b) => Math.abs(a - b) > 1e-9, '\\neq': (a, b) => Math.abs(a - b) > 1e-9 };
function relPred(math) {
  const ops = math.match(REL) || []; const parts = math.split(REL);
  if (!ops.length || ops.some(o => !OPS[o])) throw new Error('relasi tak dikenal');
  const fs = parts.map(p => E.compile(tr(p.trim()), ['x']));
  return (x) => { const v = fs.map(f => f({ x })); if (v.some(t => !isFinite(t))) return false; return ops.every((o, k) => OPS[o](v[k], v[k + 1])); };
}
/* Interval tertulis seperti (-\infty,\,-1] → predikat keanggotaan, dibaca sendiri (tidak memakai BM) */
function intervalPred(t) {
  const m = /^\s*([(\[])\s*([^,]+?)\s*,\s*([^\])]+?)\s*([)\]])\s*$/.exec(t.replace(/\\,/g, '').replace(/\\infty/g, 'inf').replace(/−/g, '-'));
  if (!m) throw new Error('interval tak terbaca: ' + t);
  const val = (v) => v === '-inf' ? -Infinity : v === 'inf' || v === '+inf' ? Infinity : E.compile(tr(v), [])({});
  const a = val(m[2]), b = val(m[3]), lo = m[1] === '[', hi = m[4] === ']';
  return (x) => (lo ? x >= a - 1e-12 : x > a + 1e-12) && (hi ? x <= b + 1e-12 : x < b - 1e-12);
}
function predicateOf(q) {
  const maths = [...q.matchAll(/\$([^$]+)\$/g)].map(m => m[1]); const math = maths[0]; if (!math) throw new Error('tidak ada rumus');
  if (/^Tentukan domain/.test(q)) { const ex = math.replace(/^[a-z]\(x\)\s*=\s*/, ''); const f = E.compile(tr(ex), ['x']); return (x) => isFinite(f({ x })); }
  if (/^Tentukan semua \$x\$ yang memenuhi/.test(q)) { const ps = maths.slice(1).map(relPred); if (!ps.length) throw new Error('tanpa syarat'); return (x) => ps.every(p => p(x)); }
  if (/^Tentukan \$/.test(q) && /\\cap|\\cup/.test(math)) {   // operasi himpunan interval
    const ops = math.match(/\\cap|\\cup/g); const parts = math.split(/\\cap|\\cup/).map(intervalPred);
    return (x) => ops.reduce((acc, o, k) => o === '\\cap' ? acc && parts[k + 1](x) : acc || parts[k + 1](x), parts[0](x));
  }
  if (/^Jika \$/.test(q) && /maka nilai \$/.test(q)) {   // bayangan fungsi linear: y ada di jawaban ⇔ x = f⁻¹(y) memenuhi syarat
    const cond = relPred(maths[0]); const f = E.compile(tr(maths[1]), ['x']); const n = f({ x: 0 }), m = f({ x: 1 }) - n;
    if (Math.abs(m) < 1e-12) throw new Error('fungsi konstan'); return (y) => cond((y - n) / m);
  }
  if (/^(Selesaikan|Tulis)/.test(q)) {
    const alts = math.split(/\\text\{\s*atau\s*\}/).map(relPred);   // "x<a atau x>b"
    return (x) => alts.some(p => p(x));
  }
  throw new Error('bentuk soal belum didukung');
}

let checked = 0, skipped = 0, bad = 0; const perGen = {};
for (const name in C.GEN) {
  for (let s = 1; s <= 300; s++) {
    const it = C.makeGen(name, s * 104729 + 17); if (!it || it.type !== 'interval') continue;
    let pred; try { pred = predicateOf(it.q); } catch (e) { skipped++; (perGen[name] = perGen[name] || { ok: 0, skip: 0, bad: 0, why: e.message }).skip++; continue; }
    const set = it.ansSet; const ends = []; B.norm(set).forEach(p => { if (isFinite(p.a)) ends.push(p.a); if (isFinite(p.b)) ends.push(p.b); });
    let mismatch = null;
    for (let x = -40; x <= 40 && !mismatch; x += 0.0137) {
      if (ends.some(e => Math.abs(e - x) < 1e-3)) continue;      // ujung diuji terpisah
      if (pred(x) !== B.has(set, x)) mismatch = x;
    }
    // ujung-ujung interval: termasuk/tidak harus cocok dengan predikat (bila predikat terdefinisi di sana)
    for (const e of ends) { if (mismatch != null) break; let pv; try { pv = pred(e); } catch (er) { continue; } if (pv !== B.has(set, e)) mismatch = e; }
    const g = (perGen[name] = perGen[name] || { ok: 0, skip: 0, bad: 0 });
    checked++;
    if (mismatch != null) { bad++; g.bad++; if (g.bad <= 2) console.log('KUNCI SALAH?', name, 'seed', s, '| soal:', it.q.replace(/<[^>]+>/g, ''), '| kunci:', it.ans, '| beda di x =', +mismatch.toFixed(4)); }
    else g.ok++;
  }
}
const summary = Object.entries(perGen).map(([k, v]) => k + ':' + v.ok + (v.skip ? '/lewati ' + v.skip : '') + (v.bad ? '/SALAH ' + v.bad : '')).join('  ');
console.log('verifikasi generator → ' + summary);
const unsupported = Object.entries(perGen).filter(([, v]) => v.skip && !v.ok).map(([k, v]) => k + ' (' + v.why + ')');
if (unsupported.length) console.log('belum bisa diverifikasi otomatis: ' + unsupported.join(', '));
if (bad) { console.log(bad + ' KUNCI GENERATOR TIDAK COCOK'); process.exit(1); }
console.log('GENERATOR TERVERIFIKASI: ' + checked + ' soal acak, kunci cocok dengan soal di ~5.800 titik masing-masing');
