/* Tests BM.evalNum (numbers, fractions, roots, infinity) with eval/Function DISABLED,
   the same situation as the site's CSP. Run: node tests/verify-numparse.js */
const path = require('path'); global.window = global;
const blocked = () => { throw new EvalError('eval is blocked (CSP)'); };
global.eval = blocked; global.Function = blocked;
require(path.join(__dirname, '..', 'js/math.js'));
const N = global.BM.evalNum; let bad = 0;
const ok = (s, want) => { const v = N(s); const same = Number.isNaN(want) ? Number.isNaN(v) : (v === want || Math.abs(v - want) < 1e-9); if (!same) { console.log('FAILED', JSON.stringify(s), '=', v, 'expected', want); bad++; } };
ok('5', 5); ok(' 5 ', 5); ok('-3', -3); ok('−3', -3); ok('+7', 7); ok('0.5', 0.5); ok('.5', 0.5); ok('5.', 5);
ok('3/2', 1.5); ok('-3/2', -1.5); ok('2/3', 2 / 3); ok('1 / 4', 0.25);
ok('2+3*4', 14); ok('(2+3)*4', 20); ok('10-2-3', 5); ok('8/2/2', 2);
ok('2^3', 8); ok('2^3^2', 512); ok('2^-1', 0.5); ok('-2^2', -4);
ok('√2', Math.SQRT2); ok('√(8)', Math.sqrt(8)); ok('sqrt(9)', 3); ok('2√3', 2 * Math.sqrt(3)); ok('-√2', -Math.SQRT2); ok('(1+√5)/2', (1 + Math.sqrt(5)) / 2); ok('3(4+1)', 15);
ok('2 3', 23); ok('∞', Infinity); ok('-∞', -Infinity); ok('inf', Infinity); ok('-inf', -Infinity); ok('tak hingga', Infinity); ok('-tak hingga', -Infinity);
['', 'abc', '1..2', '1.2.3', '(1+2', '1+', '*3', '()', 'alert(1)', 'x', '5)', 'sqrt', '√', '1/0/', '3**2'].forEach(s => ok(s, NaN));
console.log(bad ? 'SOMETHING FAILED' : 'NUMBER PARSER PASSED (eval disabled)'); if (bad) process.exitCode = 1;
