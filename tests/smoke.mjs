// Uji asap (smoke test) antarmuka dalam mode tanpa server. Jalankan: npm run test:ui (butuh server di :8765)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch (e) { pw = require(process.env.PLAYWRIGHT_PATH); }
const URL = process.env.URL || 'http://localhost:8765/';
const browser = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const errors = [];
const fail = (m) => { console.error('GAGAL:', m); process.exitCode = 1; };
async function mk(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  return { ctx, page };
}
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const { page } = await mk(390, 800);
await page.goto(URL);
await page.waitForSelector('.catalog');
const cards = await page.$$eval('.ccard', els => els.length);
if (cards < 3) fail('katalog kurang dari 3 kartu');
console.log('Beranda: ' + cards + ' kartu kursus');
// buka kursus pertidaksamaan
await page.click('.ccard[data-course="pertidaksamaan"]');
await page.waitForSelector('.path .sec');
console.log('Kursus: ' + await page.$$eval('.path li.sec', e => e.length) + ' item peta');
if (await overflow(page) > 1) fail('overflow horizontal di halaman kursus');
// materi bagian 1 dengan widget
await page.click('[data-go="lesson"][data-sec="1"]');
await page.waitForSelector('#blk');
for (let i = 0; i < 4; i++) { const n = await page.$('.les-next'); if (!n) break; await n.click(); await page.waitForTimeout(80); }
console.log('Materi bagian 1 OK');
// soal menyusun bukti
await page.evaluate(() => BU.startRun(['pf-2', 'pf-4'], { title: 'Uji bukti', src: 'latihan', tab: 'course' }));
await page.waitForSelector('.ord-pool');
const correct = await page.evaluate(() => BC.BANK['pf-2'].steps.length);
for (let i = 0; i < correct; i++) await page.click('[data-ord-add="s' + i + '"]');
await page.click('.conf-b button[data-c="3"]');
await page.click('[data-q="submit"]');
await page.waitForSelector('.fbx');
if (!(await page.$('.fbx.good'))) fail('urutan bukti benar dinilai salah');
await page.click('#run-go');
await page.waitForSelector('[data-ord-add="e0"]');
await page.click('[data-ord-add="e0"]'); await page.click('[data-ord-add="s1"]');
await page.click('.ord-ans [data-ord-rm="0"]');
if ((await page.$$('.ord-ans li')).length !== 1) fail('hapus langkah gagal');
await page.click('[data-ord-add="s0"]');
await page.click('.conf-b button[data-c="2"]'); await page.click('[data-q="submit"]');
await page.waitForSelector('.fbx.bad');
console.log('Soal urutan bukti OK');
// kelas: buat kelas, tugas, forum
await page.click('.tabs a[data-go="kelas"]');
await page.waitForSelector('#newc');
await page.click('#newc summary');
await page.fill('#cname', 'Kelas Uji');
await page.click('#cform button[type=submit]');
await page.waitForSelector('#asgf');
await page.click('#asgf summary');
await page.selectOption('#a-kind', 'practice'); await page.selectOption('#a-sec', '5'); await page.selectOption('#a-lvl', '3');
const title = await page.inputValue('#a-title'); if (!/Bagian 5/.test(title)) fail('judul tugas otomatis: ' + title);
await page.fill('#a-due', '2030-01-10T20:00');
await page.click('#aform button[type=submit]');
await page.waitForSelector('.asg');
console.log('Tugas: ' + await page.$eval('.asg .t', e => e.textContent) + ' | ' + await page.$eval('.asg .chip', e => e.textContent));
await page.click('[data-tab="forum"]');
await page.waitForSelector('#tnew');
await page.click('#tnew summary');
await page.fill('#t-title', 'Kenapa tanda dibalik?');
await page.fill('#t-body', 'Bingung di $-2x<6$. <script>alert(1)</script> <img src=x onerror=alert(2)> $<img src=x onerror=alert(3)>$');
await page.click('#tform button[type=submit]');
await page.waitForSelector('#rform');
if (await page.$('.op .pb script, .op .pb img')) fail('HTML pengguna tidak di-escape');
if (!(await page.$('.op .pb .m'))) fail('rumus di forum tidak dirender');
await page.fill('#r-body', 'Karena bercermin di titik $0$!');
await page.click('#rform button[type=submit]');
await page.waitForFunction(() => document.querySelectorAll('.posts .post').length === 1);
await page.click('[data-pact="t-pin"]'); await page.waitForTimeout(150);
await page.click('[data-pact="t-solve"]'); await page.waitForTimeout(150);
await page.click('[data-act="back"]');
await page.waitForSelector('.thread-b.solved .pin');
console.log('Forum: utas, balasan, sematkan, terjawab OK');
await page.click('[data-tab="anggota"]');
await page.waitForSelector('#mman');
// tambah siswa lewat kode progres
const code = await page.evaluate(() => { const S = BA.fresh(); S.nick = 'Dika'; for (let i = 0; i < 5; i++) S.attempts.push({ t: Date.now() + i, i: 's5-l3-' + i, s: 5, l: 3, ok: i ? 1 : 0, c: 3, ms: 1000, k: ['rasional'], src: 'latihan' }); return 'BATAS1.' + btoa(unescape(encodeURIComponent(JSON.stringify(S)))); });
await page.click('#mman summary');
await page.fill('#dname', 'Dika'); await page.fill('#dcode', code);
await page.click('[data-pact="add-code"]');
await page.waitForSelector('.ktbl');
console.log('Anggota: ' + await page.$eval('.ktbl .sn', e => e.textContent));
await page.click('.ktbl .sn'); await page.waitForSelector('.kpis');
await page.click('[data-act="back"]');
await page.click('[data-tab="tugas"]'); await page.waitForSelector('.asg-st');
const stx = await page.$eval('.asg .chip', e => e.textContent); console.log('Status tugas per siswa: ' + stx); if (stx !== '1/1 selesai') fail('status tugas seharusnya 1/1 (4 dari 5 benar)');
if (await overflow(page) > 1) fail('overflow horizontal di halaman kelas');
// kursus templat
await page.click('.tabs a[data-go="home"]');
await page.click('.ccard[data-course="contoh-kursus"]');
await page.waitForSelector('.path .sec');
await page.click('[data-go="lesson"][data-sec="1"]');
await page.click('.toc-d summary').catch(() => {});
await page.click('[data-act="les-go"][data-i="1"]');
await page.click('[data-act="predict"][data-k="2"]').catch(async () => { await page.click('.popts button:nth-child(3)'); });
await page.waitForSelector('#wp-out');
console.log('Widget templat: ' + await page.$eval('#wp-out', e => e.textContent));
// review, kartu, akun, pengaturan
for (const v of ['review', 'cards', 'me', 'settings', 'stats', 'summary', 'tryout', 'mistakes', 'traps']) { await page.evaluate(v => BU.go(v), v); await page.waitForTimeout(120); if (await overflow(page) > 1) fail('overflow di ' + v); }
await page.evaluate(() => BU.go('course', { course: 'pertidaksamaan' })); await page.waitForTimeout(400);
for (const v of ['summary', 'dump', 'lintas', 'diag']) { await page.evaluate(v => BU.go(v), v); await page.waitForTimeout(120); }
// desktop
const d = await mk(1280, 860);
await d.page.goto(URL + '#kursus=pertidaksamaan');
await d.page.waitForSelector('.path .sec');
if (await overflow(d.page) > 1) fail('overflow desktop');
// tautan gabung tanpa server -> halaman kelas tampil
await d.page.goto(URL + '#gabung=ABC123'); await d.page.reload(); await d.page.waitForSelector('#clist');
console.log('Desktop & tautan langsung OK');
if (errors.length) { fail('error di konsol:\n' + errors.join('\n')); }
else console.log('Tanpa error konsol.');
await browser.close();
