/* Fuzzing: the interval answer reader (BM.parseAnswer) and the formula parser (NalarExpr) must never hang or throw
   unexpected errors for any input a student/teacher could type. Run: npm test */
const path = require('path'); const ROOT = path.join(__dirname, '..');
globalThis.window = globalThis;
require(path.join(ROOT, 'js/math.js')); require(path.join(ROOT, 'js/expr.js'));
const B = globalThis.BM, E = globalThis.NalarExpr;
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const ALPH = 'x0123456789-+*/^()[]{}<>=≤≥≠∪∩∅ℝ,.; ∞infuUoOrRatauataudanxyabe√|!$\\';
const pieces = ['x', '<', '>', '<=', '>=', '∪', 'atau', 'dan', '(', ')', '[', ']', '-', '∞', '1/2', '√2', '3', ',', 'R', 'ℝ', '∅', 'x²', '2x', 'e', 'pi', ' '];
let n = 0, bad = 0; const t0 = Date.now();
for (let i = 0; i < 40000; i++) {
  const len = 1 + Math.floor(rnd() * 25);
  let s = ''; for (let k = 0; k < len; k++) s += rnd() < 0.6 ? pieces[Math.floor(rnd() * pieces.length)] : ALPH[Math.floor(rnd() * ALPH.length)];
  n++;
  try { const r = B.parseAnswer(s, 'x'); if (!r || typeof r.ok !== 'boolean') throw new Error('malformed result'); if (r.ok) { B.toTex(r.set); B.numberLine(r.set); } }
  catch (e) { bad++; if (bad < 6) console.log('parseAnswer threw for', JSON.stringify(s), '→', e.message); }
  try { const f = E.compile(s.slice(0, 200), ['x', 'a', 'b']); const v = f({ x: rnd() * 10 - 5, a: 2, b: -1 }); if (typeof v !== 'number') throw new Error('bukan angka'); }
  catch (e) { if (!/^[A-Z]/.test(e.message) || /undefined|null|Cannot|is not/.test(e.message)) { bad++; if (bad < 6) console.log('NalarExpr unexpected error for', JSON.stringify(s), '→', e.message); } }
  try { B.rich('$' + s + '$'); B.tex(s); } catch (e) { bad++; if (bad < 6) console.log('tex threw for', JSON.stringify(s), e.message); }
}
// Edge cases people often type
for (const s of ['', ' ', 'x', 'x<', '<3', 'x<3 atau', '(', ')', '[1,', '1,2]', 'x>=∞', '−∞<x<∞', '1/0<x', 'x<1/0', '9'.repeat(400), '('.repeat(500)]) {
  try { const r = B.parseAnswer(s, 'x'); if (!r || typeof r.ok !== 'boolean') throw new Error('malformed result'); } catch (e) { bad++; console.log('parseAnswer edge case', JSON.stringify(s.slice(0, 30)), e.message); }
  try { E.compile(s, ['x']); } catch (e) { if (/Maximum call stack|undefined|Cannot/.test(e.message)) { bad++; console.log('NalarExpr edge case', JSON.stringify(s.slice(0, 30)), e.message); } }
}
const ms = Date.now() - t0;
if (bad) { console.log(bad + ' FUZZ PROBLEMS'); process.exit(1); }
console.log('FUZZ PASSED: ' + n + ' random inputs × 3 parsers without a crash (' + ms + ' ms)');
