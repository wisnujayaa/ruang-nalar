// Uji alur mode Supabase (guru & siswa, kelas, tugas, forum, pesan) memakai Supabase palsu di memori.
// Tidak menguji RLS (itu tugas tests/run-rls.sh). Jalankan: npm run serve, lalu npm run test:flow
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const pw = (() => { try { return require('playwright'); } catch (e) { return require(process.env.PLAYWRIGHT_PATH); } })();
const fs = require('fs'); const MOCK = fs.readFileSync(new globalThis.URL('./fake-supabase.js', import.meta.url), 'utf8');
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.route(/fonts\./, r => r.abort());
await ctx.route(/vendor\/supabase\.js/, r => r.fulfill({ contentType: 'application/javascript', body: MOCK }));
const errs = []; const URL = process.env.URL || 'http://localhost:8765/';
async function pg() { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); }); return p; }
async function signup(p, name, email) {
  await p.goto(URL); await p.waitForSelector('.catalog'); if (!(await p.$('.nudge'))) throw new Error('nudge login tidak muncul');
  await p.click('.nudge [data-go="login"]'); await p.click('[data-pact="ltab"][data-t="daftar"]');
  await p.fill('#l-name', name); await p.fill('#l-email', email); await p.fill('#l-pass', 'rahasia123'); await p.click('#lform button[type=submit]');
  await p.waitForFunction(n => document.querySelector('.hello h1') && document.querySelector('.hello h1').textContent.includes(n), name);
}
const T = await pg(); await signup(T, 'Bu Guru', 'guru@x.id');
// Admin pertama dibuat manual (seperti SQL di docs/SUPABASE.md)
await T.evaluate(() => { const d = JSON.parse(localStorage.getItem('FAKE_SB')); d.profiles[0].role = 'admin'; localStorage.setItem('FAKE_SB', JSON.stringify(d)); }); await T.reload(); await T.waitForSelector('.catalog'); console.log('guru daftar & masuk OK, sync:', await T.$eval('#sync', e => e.className));
await T.click('.tabs a[data-go="kelas"]'); await T.waitForSelector('#newc'); await T.click('#newc summary'); await T.fill('#cname', 'X-3'); await T.click('#cform button[type=submit]');
await T.waitForSelector('.codebox .code'); const code = await T.$eval('.codebox .code', e => e.textContent); console.log('kode kelas', code);
await T.click('#asgf summary'); await T.selectOption('#a-kind', 'practice'); await T.selectOption('#a-sec', '1'); await T.selectOption('#a-lvl', '1'); await T.click('#aform button[type=submit]'); await T.waitForSelector('.asg'); console.log('tugas guru:', await T.$eval('.asg .chip', e => e.textContent));
const S = await pg(); await signup(S, 'Dika', 'dika@x.id');
await S.goto(URL + '#gabung=' + code); await S.waitForSelector('#jcode'); console.log('kode terisi:', await S.inputValue('#jcode'));
await S.click('#joinf button[type=submit]'); await S.waitForSelector('.asg'); console.log('siswa lihat tugas:', await S.$eval('.asg .chip', e => e.textContent));
// siswa mengerjakan 5 soal benar: rekam langsung lalu push
await S.evaluate(async () => { await BU.openCourse('pertidaksamaan'); for (let i = 0; i < 5; i++) BA.record({ id: 'x' + i, sec: 1, lvl: 1, concepts: ['sifat-dasar'] }, { ok: true, conf: 3, ms: 1000, src: 'latihan' }); BA.flush(); await BA.sync.push(); });
await S.click('[data-tab="forum"]'); await S.waitForSelector('#tnew'); await S.click('#tnew summary'); await S.fill('#t-title', 'Kenapa $-x<3$ jadi $x>-3$?'); await S.fill('#t-body', 'Bingung'); await S.click('#tform button[type=submit]'); await S.waitForSelector('#rform'); console.log('siswa buat utas OK');
await T.reload(); await T.waitForSelector('.catalog'); await T.click('.tabs a[data-go="kelas"]'); await T.waitForSelector('.klas-card'); await T.click('.klas-card'); await T.waitForSelector('.asg');
await T.click('.asg-st summary'); console.log('status di guru:', await T.$$eval('.stlist li', l => l.map(x => x.innerText.replace(/\n/g, ' '))), await T.$eval('.asg .chip', e => e.textContent));
await T.click('[data-tab="forum"]'); await T.waitForSelector('.thread-b'); await T.click('.thread-b'); await T.waitForSelector('#rform'); await T.fill('#r-body', 'Karena dikali $-1$'); await T.click('#rform button[type=submit]'); await T.waitForFunction(() => document.querySelectorAll('.posts .post').length === 1); await T.click('[data-pact="t-pin"]'); await T.waitForTimeout(300); console.log('guru balas & sematkan OK');
await T.click('[data-act="back"]'); await T.click('[data-tab="anggota"]'); await T.waitForSelector('.ktbl'); console.log('progres tabel:', await T.$eval('.ktbl tbody tr', e => e.innerText.replace(/\s+/g, ' ')));
await T.click('.ktbl .sn'); await T.waitForSelector('#note-t'); await T.fill('#note-t', 'Mantap Dika! Lanjut L2 ya.'); await T.selectOption('#note-l', 'k:pertidaksamaan|lesson:2'); await T.click('[data-pact="note-send"]'); await T.waitForSelector('#nhist .notes li'); console.log('pesan terkirim OK');
await S.reload(); await S.waitForSelector('.catalog'); await S.waitForSelector('.note-k', { timeout: 5000 }); console.log('siswa terima pesan:', await S.$eval('.note-txt', e => e.textContent));
await S.click('[data-pact="note-open"]'); await S.waitForSelector('.lesson'); console.log('tautan pesan membuka:', await S.$eval('.les-ht h1', e => e.textContent));
// Siswa tidak bisa memakai Studio; admin mengangkatnya jadi guru lewat halaman admin
await S.evaluate(() => BU.go('studio')); await S.waitForSelector('.page'); if (await S.$('[data-eact="new"]')) throw new Error('siswa bisa membuka Studio'); console.log('Studio tertutup untuk siswa OK');
await T.evaluate(() => BU.go('admin')); await T.waitForSelector('[data-adm]');
const dikaId = await T.evaluate(() => JSON.parse(localStorage.getItem('FAKE_SB')).profiles.find(p => p.display_name === 'Dika').id);
await T.selectOption(`[data-adm="${dikaId}"]`, 'teacher'); await T.waitForFunction(() => /tersimpan/.test(document.querySelector('.adm-m.ok') ? document.querySelector('.adm-m.ok').textContent : ''));
console.log('admin mengangkat Dika jadi guru OK');
await S.reload(); await S.waitForSelector('.catalog'); await S.evaluate(() => BU.go('studio')); await S.waitForSelector('[data-eact="new"]'); console.log('Dika (guru) kini bisa membuka Studio');
// Guru membuat kursus di Studio, memakainya untuk kelas baru; siswa bergabung dan membukanya
await T.evaluate(() => BU.go('studio')); await T.click('[data-eact="new"]'); await T.waitForSelector('[data-b="meta.title"]');
await T.fill('[data-b="meta.title"]', 'Kursus Guru');
await T.click('[data-eact="tab"][data-t="soal"]'); await T.click('[data-eact="q-add"]');
const gq = await T.$eval('.ed-q [data-b$=".q"]', e => e.dataset.b.split('.')[2]);
await T.fill(`[data-b="raw.BANK.${gq}.q"]`, '$1+1=$?'); await T.fill(`[data-b="raw.BANK.${gq}.opts.0.t"]`, '2'); await T.fill(`[data-b="raw.BANK.${gq}.opts.1.t"]`, '3');
await T.click('.ed-bar [data-eact="save"]'); await T.waitForFunction(() => /Tersimpan/.test(document.querySelector('#ed-status').textContent));
const gcid = await T.evaluate(() => BE.id); console.log('kursus guru disimpan (draf):', gcid);
await T.evaluate(() => BU.go('kelas')); await T.waitForSelector('#newc'); await T.click('#newc summary'); await T.fill('#cname', 'Kelas kursus guru'); await T.selectOption('#ccourse', gcid); await T.click('#cform button[type=submit]');
await T.waitForSelector('.codebox .code'); const code2 = await T.$eval('.codebox .code', e => e.textContent);
await S.evaluate(() => BU.go('kelas')); await S.waitForSelector('#jcode'); await S.fill('#jcode', 'ZZZZZZ'); await S.click('#joinf button[type=submit]'); await S.waitForFunction(() => /tidak ditemukan/.test(document.querySelector('#jerr, #joinf + .err, .err[role=alert]')?.textContent || document.body.textContent)); console.log('kode salah → pesan jelas OK');
await S.fill('#jcode', code2); await S.click('#joinf button[type=submit]'); await S.waitForSelector('.asgs, .empty');
// Kursus masih draf: anggota kelas pun belum bisa membuka
await S.evaluate((id) => BU.go('course', { course: id }), gcid); await S.waitForSelector('.locked'); console.log('kursus draf terkunci untuk siswa OK');
// Guru melihat peringatan di halaman kelas, lalu membuka kursus untuk anggota kelas (khusus kelas)
await T.waitForSelector('.warnbox [data-pact="k-vis"]'); await T.click('.warnbox [data-pact="k-vis"]'); await T.waitForSelector('.acc-note');
if ((await T.evaluate(() => JSON.parse(localStorage.getItem('FAKE_SB')).courses[0].visibility)) !== 'class') throw new Error('visibilitas tidak menjadi class');
console.log('guru mengunci kursus untuk kelas OK');
await S.evaluate(() => BU.go('home')); await S.evaluate(() => NR.refreshRemote().then(() => BU.render())); await S.waitForFunction(() => /Dari kelasmu/.test(document.querySelector('.catalog').textContent));
await S.evaluate((id) => BU.go('course', { course: id }), gcid); await S.waitForSelector('.path .sec'); console.log('anggota kelas membuka kursus khusus kelas:', await S.$eval('.hello h1', e => e.textContent));
// Orang yang bukan anggota tetap terkunci walau punya tautannya
{ const X = await pg(); await signup(X, 'Orang Lain', 'lain@x.id'); await X.goto(URL + '#kursus=' + gcid); await X.waitForSelector('.locked'); console.log('bukan anggota: terkunci OK'); await X.close(); }
// Guru mengelola kelas: ganti nama, kode baru, hapus
await T.evaluate(() => BU.go('kelas')); await T.waitForSelector('.klas-card');
const cards = await T.$$('.klas-card'); for (const cd of cards) { if ((await cd.innerText()).includes('Kelas kursus guru')) { await cd.click(); break; } }
await T.waitForSelector('[data-tab="atur"]'); await T.click('[data-tab="atur"]'); await T.waitForSelector('#k-name');
await T.fill('#k-name', 'Kelas Guru v2'); await T.click('[data-pact="k-rename"]'); await T.waitForFunction(() => /Tersimpan/.test(document.querySelector('#k-name-m').textContent));
if (await T.$eval('.cn', e => e.textContent) !== 'Kelas Guru v2') throw new Error('ganti nama'); console.log('ganti nama kelas OK');
const oldCode = code2; await T.click('[data-pact="k-code1"]'); await T.click('[data-pact="k-code2"]'); await T.waitForFunction((o) => { const e = document.querySelector('.codebox .code'); return e && e.textContent !== o; }, oldCode, { timeout: 8000 }).catch(() => {});
const newCode = await T.$eval('.codebox .code', e => e.textContent); if (newCode === oldCode) throw new Error('kode baru'); console.log('kode baru:', oldCode, '→', newCode);
await T.click('[data-tab="atur"]'); await T.waitForSelector('[data-pact="k-del1"]'); await T.click('[data-pact="k-del1"]');
await T.fill('#k-del-n', 'salah'); await T.click('[data-pact="k-del2"]'); if (!/tidak cocok/.test(await T.$eval('#k-del-e', e => e.textContent))) throw new Error('konfirmasi hapus');
await T.fill('#k-del-n', 'Kelas Guru v2'); await T.click('[data-pact="k-del2"]'); await T.waitForSelector('#clist .clist, #clist .empty');
const left = await T.$$eval('.klas-card .cn', l => l.map(x => x.textContent)); if (left.includes('Kelas Guru v2')) throw new Error('kelas tidak terhapus'); console.log('hapus kelas OK, sisa:', left.join(', '));
// Siswa melaporkan soal yang salah dari halaman soal; admin melihatnya di kotak masuk
await S.evaluate(() => BU.startRun(['b1'].concat(Object.keys(BC.BANK || {}).slice(0, 1)), { title: 'uji', tab: 'review' }));
await S.waitForSelector('.q'); await S.evaluate(() => { const o = document.querySelector('.opt'); if (o) o.click(); });
await S.click('[data-q="submit"]').catch(() => {}); await S.waitForTimeout(200);
if (await S.$('.conf-b button')) { await S.click('.conf-b button[data-c="2"]').catch(() => {}); await S.click('[data-q="submit"]').catch(() => {}); }
await S.waitForSelector('[data-rep="soal"]'); await S.click('[data-rep="soal"]'); await S.waitForSelector('#repf');
if (!(await S.$eval('.rq', e => e.textContent)).length) throw new Error('teks soal tidak ikut');
await S.fill('#rep-body', 'Kunci jawabannya kelihatannya salah'); await S.click('#repf button[type=submit]'); await S.waitForSelector('.rep-ok');
await S.waitForFunction(() => (JSON.parse(localStorage.getItem('FAKE_SB')).invoked || []).some(x => x.name === 'notify-report'));
const rep = await S.evaluate(() => JSON.parse(localStorage.getItem('FAKE_SB')).reports[0]); if (rep.kind !== 'soal' || !rep.context.qid) throw new Error('isi laporan: ' + JSON.stringify(rep));
console.log('siswa melapor soal OK, notifikasi dipanggil, konteks:', rep.context.qid, rep.context.view);
await S.waitForSelector('#rep-mine .rep'); console.log('siswa melihat "Laporanku" OK');
await T.evaluate(() => BU.go('me')); await T.waitForSelector('#rep-new:not([hidden])'); await T.click('[data-go="laporan"]'); await T.waitForSelector('#rep-in .rep');
await T.selectOption('#rep-in [data-rst]', 'selesai'); await T.fill('#rep-in [data-rnote]', 'Sudah diperbaiki, terima kasih!'); await T.click('#rep-in [data-rsave]');
await T.waitForFunction(() => /tersimpan/.test(document.querySelector('#rep-in .rm').textContent));
if ((await T.evaluate(() => JSON.parse(localStorage.getItem('FAKE_SB')).reports[0].status)) !== 'selesai') throw new Error('status laporan');
console.log('admin menandai laporan selesai OK');
await S.evaluate(() => BU.go('me')); await S.click('[data-pact="logout"]'); await S.waitForSelector('.nudge'); console.log('keluar OK');
if (errs.length) { console.error('GAGAL, error konsol:', errs); process.exitCode = 1; } else console.log('Alur Supabase OK, tanpa error konsol.'); await b.close();
