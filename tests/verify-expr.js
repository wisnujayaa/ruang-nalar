/* Tests the safe expression parser (js/expr.js). Run: node tests/verify-expr.js */
const path = require('path'); global.window = global; require(path.join(__dirname, '..', 'js/expr.js'));
const E = global.NalarExpr; let bad = 0;
const ok = (src, vars, env, want) => { try { const v = E.compile(src, vars)(env); if (Math.abs(v - want) > 1e-9) { console.log('FAILED', src, '=', v, 'expected', want); bad++; } } catch (e) { console.log('FAILED (error)', src, e.message); bad++; } };
const no = (src, vars) => { try { E.compile(src, vars); console.log('FAILED: should have been rejected:', src); bad++; } catch (e) { } };
ok('a*x^2+b*x+c', ['x', 'a', 'b', 'c'], { x: 2, a: 1, b: -3, c: 2 }, 0);
ok('ax^2 + bx + c', ['x', 'a', 'b', 'c'], { x: 3, a: 2, b: 1, c: -1 }, 20);
ok('2x+3(x-1)', ['x'], { x: 4 }, 17);
ok('-x^2', ['x'], { x: 3 }, -9);
ok('2^-1', ['x'], {}, 0.5);
ok('2^3^2', ['x'], {}, 512);
ok('x²−1', ['x'], { x: 3 }, 8);
ok('sqrt(x+1)·abs(x-5)', ['x'], { x: 3 }, 4);
ok('sin(pi/2) + e - e', ['x'], {}, 1);
ok('(x-1)(x-3)/(x+2)', ['x'], { x: 4 }, 0.5);
ok('e*x', ['x', 'e'], { x: 2, e: 5 }, 10);   // variable e overrides the constant e
ok('1,5x', ['x'], { x: 2 }, 3);
['alert(1)', 'constructor', 'x.constructor', 'x[0]', 'this', 'window', '`x`', 'x;1', 'Function("x")', '__proto__', 'x=1', "'a'"].forEach(s => no(s, ['x']));
no('y+1', ['x']); no('sin x', ['x']); no('(x+1', ['x']); no('x+', ['x']); no('1..2', ['x']); no('x'.repeat(201), ['x']);
console.log(bad ? 'SOMETHING FAILED' : 'EXPRESSION PARSER PASSED'); if (bad) process.exitCode = 1;
