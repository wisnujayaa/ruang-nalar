/* Uji inti aplikasi (js/core.js) tanpa browser:
   - pembersih state menolak data rusak & muatan XSS
   - penggabungan progres dua perangkat
   - hari beruntun (streak)
   - jadwal review berjarak
   Jalankan: npm test */
const path = require('path'); const ROOT = path.join(__dirname, '..');
const store = {}; globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
globalThis.window = globalThis;
require(path.join(ROOT, 'js/math.js'));
globalThis.BC = { BANK: {}, LESSONS: {}, SECTIONS: [], CARDS: [] };
require(path.join(ROOT, 'js/core.js'));
const A = globalThis.BA; let bad = 0;
const ok = (cond, msg) => { if (!cond) { console.log('GAGAL:', msg); bad++; } };
const DAY = 864e5, MIN = 6e4;

/* 1) data rusak tidak membuat macet */
for (const junk of [null, 42, 'teks', [], { attempts: 'bukan array', daily: null, items: 5, sections: [1, 2], mistakes: 'x' }, { attempts: [null, 1, 'a', {}] }]) {
  let s; try { s = A.sanitize(junk); } catch (e) { ok(false, 'sanitize melempar error untuk ' + JSON.stringify(junk)); continue; }
  ok(Array.isArray(s.attempts) && typeof s.daily === 'object' && typeof s.items === 'object', 'bentuk state setelah sanitize');
  try { A.merge(s, A.sanitize(junk)); } catch (e) { ok(false, 'merge melempar error'); }
}
ok(A.parseState('{rusak') === null, 'JSON rusak → null');
ok(A.parseState('"string"') === null, 'JSON bukan objek → null');

/* 2) muatan XSS dipaksa jadi angka / dibuang */
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
ok(evil.attempts.length === 1, 'attempt dengan id berbahaya dibuang');
ok(a0.s === 0 && a0.l === 0 && a0.c === 2 && a0.ms === 0 && a0.src === 'latihan' && !a0.tp, 'field attempt dipaksa angka/aman: ' + JSON.stringify(a0));
ok(a0.k.length === 1 && a0.k[0] === 'linear', 'konsep berbahaya dibuang');
ok(evil.sections[1].step === 0 && !(X in evil.sections) && !(X in evil.sections[1].visited), 'sections aman');
ok(evil.mistakes.b1.s === 0 && evil.mistakes.b1.tr === null, 'mistakes aman');
ok(evil.mistakes.b1.a === X.slice(0, 120), 'teks jawaban tetap teks (dirender dengan escape di UI)');
ok(evil.diag.res.P1.ok === 0, 'diag aman'); ok(!evil.prereq.P1, 'prereq status tak dikenal dibuang');
ok(evil.daily['2026-10-01'] === 0 && Object.keys(evil.daily).length === 1, 'daily aman');
ok(evil.items.b1.iv === 3650 && evil.items.b1.ef === 3 && evil.items.b1.due === 0, 'jadwal dibatasi');
ok(evil.nick.length === 40, 'nick dipotong'); ok(!('unknownField' in evil), 'field tak dikenal dibuang');
ok(!/onerror/.test(flat.replace(/"a":"[^"]*"/, '').replace(/"nick":"[^"]*"/, '')), 'tidak ada muatan HTML di field selain teks bebas');

/* 3) sanitize idempoten & state normal tidak berubah */
const normal = A.fresh(); normal.attempts.push({ t: 1700000000000, i: 'b1', s: 2, l: 3, ok: 1, c: 3, ms: 12000, k: ['linear'], src: 'latihan' }); normal.sections = { 2: { step: 4, done: 0, visited: { 0: 1, 1: 1 } } }; normal.daily = { '2026-10-01': 600000 };
const n2 = A.sanitize(JSON.parse(JSON.stringify(normal)));
ok(JSON.stringify(n2.attempts) === JSON.stringify(normal.attempts) && n2.sections[2].step === 4 && n2.daily['2026-10-01'] === 600000, 'state normal tidak berubah');
ok(JSON.stringify(A.sanitize(n2)) === JSON.stringify(n2), 'sanitize idempoten');

/* 4) merge: gabungan, tanpa duplikat, terbatas */
const p1 = A.fresh(), p2 = A.fresh(); const t0 = 1700000000000;
for (let i = 0; i < 900; i++) p1.attempts.push({ t: t0 + i * 1000, i: 'q' + i, s: 1, l: 1, ok: 1, c: 2, ms: 1, k: [], src: 'latihan' });
for (let i = 500; i < 1500; i++) p2.attempts.push({ t: t0 + i * 1000, i: 'q' + i, s: 1, l: 1, ok: 0, c: 2, ms: 1, k: [], src: 'latihan' });
for (let i = 0; i < 120; i++) { p1.mistakes['m' + i] = { t: i, i: 'm' + i }; p2.mistakes['n' + i] = { t: 1000 + i, i: 'n' + i }; }
p1.sections = { 1: { step: 5, done: 0 } }; p2.sections = { 1: { step: 3, done: 1 } };
p1.items = { x: { last: 5, iv: 1 } }; p2.items = { x: { last: 9, iv: 7 } };
const m = A.merge(p1, p2);
ok(m.attempts.length === 1400, 'attempts dibatasi 1400 (dapat ' + m.attempts.length + ')');
ok(new Set(m.attempts.map(a => a.t + a.i)).size === m.attempts.length, 'tanpa duplikat');
ok(m.attempts[m.attempts.length - 1].i === 'q1499' && m.attempts.every((a, k) => !k || m.attempts[k - 1].t <= a.t), 'urut waktu, yang terbaru disimpan');
ok(Object.keys(m.mistakes).length === 160 && m.mistakes.n119 && !m.mistakes.m0, 'buku kesalahan dibatasi 160, yang terbaru disimpan');
ok(m.sections[1].step === 5 && m.sections[1].done === 1, 'progres bagian diambil yang terjauh');
ok(m.items.x.iv === 7, 'jadwal review diambil yang terakhir diperbarui');
ok(JSON.stringify(A.merge(m, m).attempts) === JSON.stringify(m.attempts), 'merge dengan diri sendiri tidak berubah');

/* 5) streak */
const realNow = Date.now; const today = new Date(); today.setHours(15, 0, 0, 0); const T = today.getTime();
Date.now = () => T;
const day = (k) => { const d = new Date(T); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - k); return A.today(d.getTime()); };
A.S = A.fresh(); [0, 1, 2, 4].forEach(k => { A.S.daily[day(k)] = 5 * MIN; });
ok(A.streak() === 3, 'streak 3 (hari ini, kemarin, lusa; bolong 3 hari lalu) → ' + A.streak());
A.S = A.fresh(); [1, 2].forEach(k => { A.S.daily[day(k)] = 5 * MIN; });
ok(A.streak() === 2, 'hari ini belum belajar: streak kemarin tetap hidup → ' + A.streak());
A.S = A.fresh(); A.S.daily[day(0)] = 2 * MIN; ok(A.streak() === 0, 'belajar < 3 menit tanpa soal tidak dihitung');
A.S.attempts.push({ t: T - 1000, i: 'b1' }); ok(A.streak() === 1, 'satu soal hari ini cukup');
A.S = A.fresh(); for (let k = 0; k < 500; k++) A.S.daily[day(k)] = 5 * MIN; ok(A.streak() === 500, 'streak panjang tidak terpotong 400 → ' + A.streak());
A.S = A.fresh(); for (let k = 0; k < 1400; k++) A.S.attempts.push({ t: T - k * 3600e3, i: 'q' + k });
const t1 = realNow(); for (let r = 0; r < 50; r++) A.streak(); const ms = realNow() - t1;
ok(ms < 1500, 'streak cepat (50× dengan 1400 jawaban: ' + ms + ' ms)');

/* 6) jadwal review */
const map = {}; let s;
s = A.schedule(map, 'k', 2); ok(s.iv === 1 && s.n === 1, 'ingat pertama: 1 hari');
s = A.schedule(map, 'k', 2); ok(s.iv === 3, 'ingat kedua: 3 hari');
s = A.schedule(map, 'k', 3); ok(s.iv > 3 && s.ef > 2.4, 'mudah: jarak membesar, ef naik');
s = A.schedule(map, 'k', 0); ok(s.iv === 0 && s.n === 0 && s.lapses === 1 && s.due - T <= 10 * MIN, 'lupa: kembali ke awal, muncul lagi ≤ 10 menit');
for (let i = 0; i < 40; i++) s = A.schedule(map, 'k', 3);
ok(s.iv === 365 && s.due === T + 365 * DAY, 'jarak terpanjang dibatasi 365 hari (dapat ' + s.iv + ')');
s = A.schedule(map, 'j', 1); ok(s.iv >= 1 && s.ef < 2.4, 'menebak tapi benar: jarak minimal 1 hari, ef turun');
for (let i = 0; i < 20; i++) s = A.schedule(map, 'j', 0); ok(s.ef === 1.3, 'ef tidak turun di bawah 1,3');
Date.now = realNow;

/* 7) kode progres */
A.S = A.fresh(); A.S.attempts.push({ t: 1700000000000, i: 'b1', s: 1, l: 1, ok: 1, c: 2, ms: 1, k: [], src: 'latihan' });
const code = A.exportCode(); const back = A.decodeCode(code + '\n');
ok(back.attempts.length === 1, 'kode progres bolak-balik');
let msg = ''; try { A.decodeCode('BATAS1.@@@'); } catch (e) { msg = e.message; } ok(/rusak|terpotong/.test(msg), 'kode rusak → pesan jelas: ' + msg);

if (bad) { console.log(bad + ' TES INTI GAGAL'); process.exit(1); }
console.log('INTI APLIKASI LULUS (sanitize, merge, streak, review berjarak, kode progres)');
