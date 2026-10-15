/* App core tests (js/core.js) without a browser:
   - the state sanitizer rejects corrupt data & XSS payloads
   - merging progress from two devices
   - daily streak
   - spaced-repetition schedule
   Run: npm test */
const path = require('path'); const ROOT = path.join(__dirname, '..');
const store = {}; globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
globalThis.window = globalThis;
require(path.join(ROOT, 'js/math.js'));
globalThis.BC = { BANK: { b1: { id: 'b1' } }, GEN: { lin: {} }, LESSONS: {}, SECTIONS: [], CARDS: [] };
require(path.join(ROOT, 'js/core.js'));
const A = globalThis.BA; let bad = 0;
const ok = (cond, msg) => { if (!cond) { console.log('FAILED:', msg); bad++; } };
const DAY = 864e5, MIN = 6e4;

/* 1) corrupt data doesn't crash */
for (const junk of [null, 42, 'teks', [], { attempts: 'bukan array', daily: null, items: 5, sections: [1, 2], mistakes: 'x' }, { attempts: [null, 1, 'a', {}] }]) {
  let s; try { s = A.sanitize(junk); } catch (e) { ok(false, 'sanitize threw for ' + JSON.stringify(junk)); continue; }
  ok(Array.isArray(s.attempts) && typeof s.daily === 'object' && typeof s.items === 'object', 'state shape after sanitize');
  try { A.merge(s, A.sanitize(junk)); } catch (e) { ok(false, 'merge threw'); }
}
ok(A.parseState('{rusak') === null, 'broken JSON → null');
ok(A.parseState('"string"') === null, 'non-object JSON → null');

/* 2) XSS payloads are coerced to numbers / dropped */
const X = '<img src=x onerror=alert(1)>';
const evil = A.sanitize({
  v: 1, nick: X + 'x'.repeat(100),
  attempts: [{ t: Date.now(), i: 'b1', s: X, l: X, ok: X, c: X, ms: X, k: [X, 'linear'], src: X, tp: X }, { t: Date.now(), i: X, s: 1 }],
  sections: { 1: { step: X, done: X, visited: { [X]: 1, 2: 1 } }, [X]: { step: 1 } },
  mistakes: { b1: { i: 'b1', a: X, t: 1, tr: X, s: X } },
  diag: { done: 1, t: 1, res: { P1: { ok: X, n: 3 } } },
  daily: { '2026-10-01': X, [X]: 5 },
  prereq: { P1: { st: X } }, items: { b1: { iv: 1e9, ef: 99, due: X } }, unknownField: X
});
const flat = JSON.stringify(evil);
const a0 = evil.attempts[0];
ok(evil.attempts.length === 1, 'attempt with a malicious id dropped');
ok(a0.s === 0 && a0.l === 0 && a0.c === 2 && a0.ms === 0 && a0.src === 'latihan' && !a0.tp, 'attempt fields coerced to numbers/safe: ' + JSON.stringify(a0));
ok(a0.k.length === 1 && a0.k[0] === 'linear', 'malicious concept dropped');
ok(evil.sections[1].step === 0 && !(X in evil.sections) && !(X in evil.sections[1].visited), 'sections safe');
ok(evil.mistakes.b1.s === 0 && evil.mistakes.b1.tr === null, 'mistakes safe');
ok(evil.mistakes.b1.a === X.slice(0, 120), 'answer text stays text (escaped by the UI)');
ok(evil.diag.res.P1.ok === 0, 'diag safe'); ok(!evil.prereq.P1, 'unknown prereq status dropped');
ok(evil.daily['2026-10-01'] === 0 && Object.keys(evil.daily).length === 1, 'daily safe');
ok(evil.items.b1.iv === 3650 && evil.items.b1.ef === 3 && evil.items.b1.due === 0, 'schedule clamped');
ok(evil.nick.length === 40, 'nick truncated'); ok(!('unknownField' in evil), 'unknown field dropped');
ok(!/onerror/.test(flat.replace(/"a":"[^"]*"/, '').replace(/"nick":"[^"]*"/, '')), 'no HTML payload outside free-text fields');

/* 3) sanitize is idempotent & leaves normal state unchanged */
const normal = A.fresh(); normal.attempts.push({ t: 1700000000000, i: 'b1', s: 2, l: 3, ok: 1, c: 3, ms: 12000, k: ['linear'], src: 'latihan' }); normal.sections = { 2: { step: 4, done: 0, visited: { 0: 1, 1: 1 } } }; normal.daily = { '2026-10-01': 600000 };
const n2 = A.sanitize(JSON.parse(JSON.stringify(normal)));
ok(JSON.stringify(n2.attempts) === JSON.stringify(normal.attempts) && n2.sections[2].step === 4 && n2.daily['2026-10-01'] === 600000, 'normal state unchanged');
ok(JSON.stringify(A.sanitize(n2)) === JSON.stringify(n2), 'sanitize idempotent');

/* 4) merge: union, no duplicates, bounded */
const p1 = A.fresh(), p2 = A.fresh(); const t0 = 1700000000000;
for (let i = 0; i < 900; i++) p1.attempts.push({ t: t0 + i * 1000, i: 'q' + i, s: 1, l: 1, ok: 1, c: 2, ms: 1, k: [], src: 'latihan' });
for (let i = 500; i < 1500; i++) p2.attempts.push({ t: t0 + i * 1000, i: 'q' + i, s: 1, l: 1, ok: 0, c: 2, ms: 1, k: [], src: 'latihan' });
for (let i = 0; i < 120; i++) { p1.mistakes['m' + i] = { t: i, i: 'm' + i }; p2.mistakes['n' + i] = { t: 1000 + i, i: 'n' + i }; }
p1.sections = { 1: { step: 5, done: 0 } }; p2.sections = { 1: { step: 3, done: 1 } };
p1.items = { x: { last: 5, iv: 1 } }; p2.items = { x: { last: 9, iv: 7 } };
const m = A.merge(p1, p2);
ok(m.attempts.length === 1400, 'attempts capped at 1400 (got ' + m.attempts.length + ')');
ok(new Set(m.attempts.map(a => a.t + a.i)).size === m.attempts.length, 'no duplicates');
ok(m.attempts[m.attempts.length - 1].i === 'q1499' && m.attempts.every((a, k) => !k || m.attempts[k - 1].t <= a.t), 'time-ordered, newest kept');
ok(Object.keys(m.mistakes).length === 160 && m.mistakes.n119 && !m.mistakes.m0, 'mistake notebook capped at 160, newest kept');
ok(m.sections[1].step === 5 && m.sections[1].done === 1, 'section progress takes the furthest');
ok(m.items.x.iv === 7, 'review schedule takes the most recently updated');
ok(JSON.stringify(A.merge(m, m).attempts) === JSON.stringify(m.attempts), 'merging with itself is a no-op');

/* 5) streak */
const realNow = Date.now; const today = new Date(); today.setHours(15, 0, 0, 0); const T = today.getTime();
Date.now = () => T;
const day = (k) => { const d = new Date(T); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - k); return A.today(d.getTime()); };
A.S = A.fresh(); [0, 1, 2, 4].forEach(k => { A.S.daily[day(k)] = 5 * MIN; });
ok(A.streak() === 3, 'streak 3 (today, yesterday, the day before; gap 3 days ago) → ' + A.streak());
A.S = A.fresh(); [1, 2].forEach(k => { A.S.daily[day(k)] = 5 * MIN; });
ok(A.streak() === 2, 'no study yet today: yesterday\'s streak stays alive → ' + A.streak());
A.S = A.fresh(); A.S.daily[day(0)] = 2 * MIN; ok(A.streak() === 0, '< 3 minutes without questions does not count');
A.S.attempts.push({ t: T - 1000, i: 'b1' }); ok(A.streak() === 1, 'one question today is enough');
A.S = A.fresh(); for (let k = 0; k < 500; k++) A.S.daily[day(k)] = 5 * MIN; ok(A.streak() === 500, 'long streak not cut at 400 → ' + A.streak());
A.S = A.fresh(); for (let k = 0; k < 1400; k++) A.S.attempts.push({ t: T - k * 3600e3, i: 'q' + k });
const t1 = realNow(); for (let r = 0; r < 50; r++) A.streak(); const ms = realNow() - t1;
ok(ms < 1500, 'streak is fast (50× with 1400 answers: ' + ms + ' ms)');

/* 6) review schedule */
const map = {}; let s;
s = A.schedule(map, 'k', 2); ok(s.iv === 1 && s.n === 1, 'first recall: 1 day');
s = A.schedule(map, 'k', 2); ok(s.iv === 3, 'second recall: 3 days');
s = A.schedule(map, 'k', 3); ok(s.iv > 3 && s.ef > 2.4, 'easy: interval grows, ef rises');
s = A.schedule(map, 'k', 0); ok(s.iv === 0 && s.n === 0 && s.lapses === 1 && s.due - T <= 10 * MIN, 'forgot: back to start, due again within 10 minutes');
for (let i = 0; i < 40; i++) s = A.schedule(map, 'k', 3);
ok(s.iv === 365 && s.due === T + 365 * DAY, 'longest interval capped at 365 days (got ' + s.iv + ')');
s = A.schedule(map, 'j', 1); ok(s.iv >= 1 && s.ef < 2.4, 'guessed but right: at least 1 day, ef drops');
for (let i = 0; i < 20; i++) s = A.schedule(map, 'j', 0); ok(s.ef === 1.3, 'ef never drops below 1.3');
Date.now = realNow;

/* 6b) a reset on one device is not undone by another device */
{ const old = A.fresh(); for (let i = 0; i < 5; i++) old.attempts.push({ t: 1700000000000 + i, i: 'q' + i, s: 1, l: 1, ok: 1, c: 2, ms: 1, k: [], src: 'latihan' });
  old.sections = { 1: { step: 9, done: 1 } }; old.items = { b1: { last: 1700000000000, iv: 3 } }; old.daily = { '2023-11-14': 600000 }; old.updated = 1700000001000;
  const R = 1800000000000; const reset = A.fresh(); reset.resetAt = R; reset.attempts.push({ t: R + 5, i: 'baru', s: 1, l: 1, ok: 1, c: 2, ms: 1, k: [], src: 'latihan' });
  const m1 = A.merge(old, reset), m2 = A.merge(reset, old);
  ok(m1.attempts.length === 1 && m1.attempts[0].i === 'baru' && !m1.sections[1] && !m1.items.b1 && !Object.keys(m1.daily).length && m1.resetAt === R, 'reset not resurrected by old data');
  ok(JSON.stringify(m1.attempts) === JSON.stringify(m2.attempts) && m2.resetAt === R, 'merge order does not matter');
  const late = A.fresh(); late.attempts.push({ t: R + 99, i: 'offline', s: 1, l: 1, ok: 1, c: 2, ms: 1, k: [], src: 'latihan' });
  ok(A.merge(reset, late).attempts.length === 2, 'answers after the reset from another device are kept'); }

/* 6c) items deleted from the course are not counted as due */
A.S = A.fresh(); A.S.items = { b1: { due: 1, last: 1 }, hilang: { due: 1, last: 1 }, 'g:lin': { due: 1, last: 1 }, 'g:gone': { due: 1, last: 1 } };
ok(JSON.stringify(A.dueItems().sort()) === JSON.stringify(['b1', 'g:lin']), 'dueItems ignores orphaned items: ' + A.dueItems());

/* 7) progress codes */
A.S = A.fresh(); A.S.attempts.push({ t: 1700000000000, i: 'b1', s: 1, l: 1, ok: 1, c: 2, ms: 1, k: [], src: 'latihan' });
const code = A.exportCode(); const back = A.decodeCode(code + '\n');
ok(back.attempts.length === 1, 'progress code round-trip');
ok(code.startsWith('NALAR1.') && A.decodeCode('BATAS1.' + code.slice(7)).attempts.length === 1, 'new NALAR1 prefix; old BATAS1 codes still import');
let msg = ''; try { A.decodeCode('NALAR1.@@@'); } catch (e) { msg = e.message; } ok(/rusak|terpotong/.test(msg), 'broken code → clear message: ' + msg);

/* 8) sync: switching courses while a push is in flight loses no changes */
(async () => {
  const saved = []; globalThis.BB = { online: true, user: { id: 'u' }, progress: { async save(c, s) { await new Promise(r => setTimeout(r, 30)); saved.push([c, JSON.parse(s).attempts.length]); }, async load() { return null; } } };
  A.course = null; A.useCourse('kursusA');
  A.S.attempts.push({ t: 1, i: 'a1' }); const p1 = A.sync.push();       // first push in flight…
  A.S.attempts.push({ t: 2, i: 'a2' }); A.flush();
  A.useCourse('kursusB');                                              // …then switch course immediately
  await p1; await new Promise(r => setTimeout(r, 120));
  const lastA = saved.filter(x => x[0] === 'kursusA').pop();
  ok(lastA && lastA[1] === 2, 'the last change to course A is still pushed after switching: ' + JSON.stringify(saved));
  ok(!saved.some(x => x[0] === 'kursusB' && x[1] > 0), 'progress A is not pushed to course B');
  if (bad) { console.log(bad + ' CORE TESTS FAILED'); process.exit(1); }
  console.log('APP CORE PASSED (sanitize, merge, reset, streak, spaced review, progress codes, sync)');
})();
