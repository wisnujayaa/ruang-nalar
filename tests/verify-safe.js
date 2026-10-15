/* Tests the teacher-course sanitizer (js/course-safe.js): no HTML/JS may get through. Run: node tests/verify-safe.js */
const path = require('path'); const ROOT = path.join(__dirname, '..');
global.window = global; ['js/math.js', 'js/expr.js', 'js/widget-lib.js', 'js/course-safe.js'].forEach(f => require(path.join(ROOT, f)));
const S = global.NalarSafe, B = global.BM; let bad = 0;
const PAY = ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '$<img src=x onerror=alert(1)>$', '$$<svg onload=alert(1)>$$', '"><b onmouseover=alert(1)>', "$a$<scr$ipt>$b$", '**<i onclick=x>**', '$x</span><img src=x onerror=1>$', 'javascript:alert(1)', '\u0001' + '0' + '\u0002'];
const out = [];
const raw = {
  SECTIONS: [{ id: 1, short: PAY[4], title: PAY[0], glyph: PAY[1] }],
  LESSONS: { 1: [{ k: 'text', title: PAY[2], md: PAY.join('\n\n- ') }, { k: 'example', problem: PAY[3], steps: [{ t: PAY[5], ask: PAY[6] }] }, { k: 'widget', id: 'evil' }, { k: 'widget', w: 'grafik', params: { expr: 'alert(1)', vars: [{ name: 'x' }, { name: '<b>', min: 1 }, { name: 'a', min: 9, max: -9, value: 99 }], xmin: 'NaN', shade: 'evil' }, predict: { q: PAY[2], opts: [PAY[1], 'b'], ans: 7, after: PAY[0] } }, { k: 'widget', w: 'sematan', params: { url: 'javascript:alert(1)' } }, { k: 'widget', w: 'tidak-ada' }, { k: 'q', id: 'q-1' }, { k: 'recap', items: PAY }, { k: 'exit', prompt: PAY[0], points: PAY, qs: ['q-1', 'nope'] }] },
  BANK: {
    'q-1': { id: 'q-1', sec: 1, lvl: 1, type: 'mc', q: PAY.join(' '), opts: [{ t: PAY[1], ok: true, why: PAY[7] }, { t: PAY[2] }], sol: PAY[3], hints: PAY },
    'q-2': { id: 'q-2', sec: 1, lvl: 2, type: 'interval', q: 'Selesaikan $x^2<4$', ans: '(-2, 2)' },
    'q-3': { id: 'q-3', sec: 1, lvl: 2, type: 'num', q: 'x', ans: '3/2', unit: PAY[1] },
    '"><x': { id: '"><x', sec: 1, lvl: 1, type: 'mc', q: 'id jahat', opts: [{ t: 'a', ok: true }, { t: 'b' }] },
    'q-4': { id: 'q-4', sec: 1, lvl: 1, type: 'mc', q: 'tanpa kunci', opts: [{ t: 'a' }, { t: 'b' }] }
  },
  CARDS: [{ id: 'k-1', sec: 1, kind: PAY[0], f: PAY[2], b: PAY[1] }],
  TRAPS: { 't-1': { name: PAY[0], sec: 1, wrong: PAY[2], right: PAY[1], tip: PAY[3] } },
  RES: { 1: [{ type: 'video', title: PAY[0], url: 'javascript:alert(1)' }, { type: 'artikel', title: 'ok', url: 'https://example.com/a?b=1' }, { title: 'x', url: 'https://x.com/"onmouseover=1' }] }
};
const C = S.compile(raw);
// Simulate every way the UI renders: rich() for rich text, esc() for plain text
const rendered = [];
const R = (s) => rendered.push(B.rich(s)), E = (s) => rendered.push(B.esc(s));
C.SECTIONS.forEach(s => { E(s.short); E(s.title); E(s.glyph); });
Object.values(C.LESSONS).flat().forEach(b => { if (b.title) R(b.title); if (b.html) R(b.html); if (b.problem) R(b.problem); (b.steps || []).forEach(x => { R(x.t); if (x.ask) R(x.ask); }); (b.items || []).forEach(R); if (b.prompt) E(b.prompt); (b.points || []).forEach(E); });
Object.values(C.BANK).forEach(q => { R(q.q); (q.opts || []).forEach(o => { R(o.t); if (o.why) R(o.why); }); if (q.sol) R(q.sol); (q.hints || []).forEach(R); if (q.unit) E(q.unit); });
C.CARDS.forEach(c => { E(c.kind); R(c.f); R(c.b); });
Object.values(C.TRAPS).forEach(t => { E(t.name); R(t.wrong); R(t.right); R(t.tip); });
Object.values(C.RES).flat().forEach(r => { rendered.push('<a href="' + B.esc(r.url) + '">' + B.esc(r.title) + '</a>'); });
const html = rendered.join('\n');
const tags = html.match(/<\/?([a-z0-9]+)/gi).map(t => t.replace(/[<\/]/g, '').toLowerCase());
const allowed = new Set(['span', 'i', 'b', 'p', 'br', 'ul', 'ol', 'li', 'a', 'sup', 'sub', 'em', 'strong']);
const badTags = [...new Set(tags.filter(t => !allowed.has(t)))];
if (badTags.length) { console.log('FAILED: unexpected tag:', badTags); bad++; }
if (/\son[a-z]+\s*=/i.test(html.replace(/&[a-z#0-9]+;/g, ''))) { const m = html.match(/<[^>]*\son[a-z]+\s*=[^>]*>/i); if (m) { console.log('FAILED: event attribute inside a tag:', m[0]); bad++; } }
if (/javascript:/i.test(html.match(/href="[^"]*"/g).join(''))) { console.log('FAILED: javascript: link got through'); bad++; }
if ((C.RES[1] || []).length !== 1) { console.log('FAILED: unsafe links must be dropped, left', C.RES[1]); bad++; }
const ws = C.LESSONS[1].filter(b => b.k === 'widget');
if (ws.some(b => !b.lib)) { console.log('FAILED: custom-code widgets (not from the library) must be dropped'); bad++; }
if (ws.length !== 2) { console.log('FAILED: expected 2 library widgets (graph & embed), got', ws.length); bad++; }
const g = ws.find(b => b.lib === 'grafik');
if (g.params.vars.some(v => v.name === 'x' || v.name === '<b>') || g.params.vars[0].min > g.params.vars[0].max || g.params.shade !== 'gt' || !isFinite(g.params.xmin)) { console.log('FAILED: graph parameters not sanitized', g.params); bad++; }
if (g.predict.ans !== 1 || /<img/.test(B.rich(g.predict.q))) { console.log('FAILED: widget prediction', g.predict); bad++; }
if (global.NalarWidgets.embedUrl('javascript:alert(1)') || global.NalarWidgets.embedUrl('https://evil.com/?https://www.desmos.com/calculator/abcd') || global.NalarWidgets.embedUrl('https://www.desmos.com.evil.com/calculator/abcd')) { console.log('FAILED: embed accepted a foreign site'); bad++; }
if (!global.NalarWidgets.embedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ') || !global.NalarWidgets.embedUrl('https://www.geogebra.org/m/abcd1234')) { console.log('FAILED: official embed rejected'); bad++; }
const vw = S.validate(raw); if (!vw.some(x => /grafik/.test(x.msg)) || !vw.some(x => /sematan/.test(x.msg))) { console.log('FAILED: widget validation', vw.filter(x => /Widget/.test(x.msg))); bad++; }
if (C.BANK['"><x'] || C.BANK['q-4']) { console.log('FAILED: questions with malicious ids / no key must be dropped'); bad++; }
if (!C.BANK['q-2'] || !B.same(C.BANK['q-2'].ansSet, B.parseSet('(-2,2)'))) { console.log('FAILED: interval key'); bad++; }
if (C.BANK['q-3'].ans !== 1.5) { console.log('FAILED: fraction key'); bad++; }
if (C.LESSONS[1].find(b => b.k === 'exit').qs.join() !== 'q-1') { console.log('FAILED: exit ticket must drop missing questions'); bad++; }
// Math still renders correctly
const mathOk = B.rich(S.text('Jika $x<3$ dan **tebal**, maka $$y>2$$')); if (!/class="m"/.test(mathOk) || !/<b>tebal<\/b>/.test(mathOk) || !/&lt;/.test(mathOk)) { console.log('FAILED: formatting/math not rendered:', mathOk); bad++; }
const md = S.md('Paragraf $a<b$\n\n- satu\n- dua $x$\n\n1. a\n2. b'); if (!/<ul><li>satu<\/li>/.test(md) || !/<ol>/.test(md)) { console.log('FAILED: md', md); bad++; }
// Validation gives the right messages
const v = S.validate(raw); if (!v.some(x => /q-4|tanpa kunci/.test(x.q + x.msg))) { console.log('FAILED: validation missed a question without a key', v); bad++; }
console.log(bad ? 'SOMETHING FAILED' : 'COURSE SANITIZER PASSED (' + rendered.length + ' text fragments rendered, tags seen: ' + [...new Set(tags)].join(', ') + ')');
if (bad) process.exitCode = 1;
