// Uji alur Studio: guru membuat kursus lewat formulir → menyimpan → siswa membuka & mengerjakan.
// Mode tanpa server (config.js diabaikan). Jalankan: npm run serve, lalu npm run test:editor
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = (() => { try { return require('playwright'); } catch (e) { return require(process.env.PLAYWRIGHT_PATH); } })();
const URL = process.env.URL || 'http://localhost:8765/';
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.route(/fonts\./, r => r.abort());
await ctx.route(/\/config\.js$/, r => r.fulfill({ contentType: 'application/javascript', body: 'window.NALAR_CONFIG = {};' }));
const p = await ctx.newPage(); const errs = [];
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
p.on('dialog', d => d.accept());
const fail = (m) => { console.error('GAGAL:', m); process.exitCode = 1; };
const XSS = '<img src=x onerror="window.__xss=1">';
await p.goto(URL); await p.waitForSelector('.catalog');
await p.evaluate(() => BU.go('studio')); await p.waitForSelector('[data-eact="new"]'); await p.click('[data-eact="new"]');
await p.waitForSelector('[data-b="meta.title"]');
await p.fill('[data-b="meta.title"]', 'Persamaan Linear'); await p.fill('[data-b="meta.subject"]', 'Matematika'); await p.fill('[data-b="meta.blurb"]', 'Kursus uji ' + XSS); await p.fill('[data-b="meta.glyph"]', 'ax+b');
// Materi
await p.click('[data-eact="tab"][data-t="materi"]'); await p.fill('[data-b="raw.SECTIONS.0.title"]', 'Konsep dasar persamaan');
await p.click('.ed-blk [data-eact="blk-open"]');
await p.fill('[data-b="raw.LESSONS.1.0.md"]', 'Persamaan itu seperti **timbangan seimbang**.\n\n- Kurangi kedua ruas dengan bilangan yang sama\n- Bagi kedua ruas\n\nContoh: $2x+3=7$ maka $x=2$. Bahaya: ' + XSS);
await p.click('[data-eact="md-prev"]'); await p.waitForSelector('.ed-prev .m');
// Soal: pilihan ganda
await p.click('[data-eact="tab"][data-t="soal"]');
await p.selectOption('#addq', 'mc'); await p.click('[data-eact="q-add"]'); await p.waitForSelector('.ed-q [data-b$=".q"]');
let qid = await p.$eval('.ed-q [data-b$=".q"]', e => e.dataset.b.split('.')[2]);
await p.fill(`[data-b="raw.BANK.${qid}.q"]`, 'Penyelesaian $2x+3=7$ adalah… ' + XSS);
await p.fill(`[data-b="raw.BANK.${qid}.opts.0.t"]`, '$x=2$'); await p.fill(`[data-b="raw.BANK.${qid}.opts.1.t"]`, '$x=5$'); await p.fill(`[data-b="raw.BANK.${qid}.opts.2.t"]`, '$x=-2$');
await p.fill(`[data-b="raw.BANK.${qid}.opts.1.why"]`, 'Lupa mengurangi 3 dulu.');
await p.fill(`[data-b="raw.BANK.${qid}.sol"]`, 'Kurangi 3: $2x=4$, bagi 2: $x=2$.');
await p.click(`[data-eact="q-try"][data-id="${qid}"]`); await p.waitForSelector(`#try-${qid} .q`); console.log('pratinjau soal di editor OK');
// isian angka
await p.selectOption('#addq', 'num'); await p.click('[data-eact="q-add"]');
const ids = await p.$$eval('.ed-q [data-b$=".q"]', els => els.map(e => e.dataset.b.split('.')[2])); const nid = ids.find(i => i !== qid);
await p.fill(`[data-b="raw.BANK.${nid}.q"]`, 'Nilai $x$ jika $3x=12$?'); await p.fill(`[data-b="raw.BANK.${nid}.ans"]`, '4');
// interval dengan pratinjau garis bilangan
await p.selectOption('#addq', 'interval'); await p.click('[data-eact="q-add"]');
const ids2 = await p.$$eval('.ed-q [data-b$=".q"]', els => els.map(e => e.dataset.b.split('.')[2])); const iid = ids2.find(i => i !== qid && i !== nid);
await p.fill(`[data-b="raw.BANK.${iid}.q"]`, 'Selesaikan $x-1>2$'); await p.fill(`[data-b="raw.BANK.${iid}.ans"]`, 'x > 3');
await p.waitForSelector(`#ivp-${iid} svg`); console.log('pratinjau interval OK');
// Terbitkan: pemeriksaan + publik + simpan
await p.click('[data-eact="tab"][data-t="terbit"]');
const issues = await p.$$eval('.ed-issues li', l => l.map(x => x.textContent)); console.log('saran pemeriksaan:', issues.length);
await p.check('input[name="vis"][value="public"]');
await p.click('.ed-bar [data-eact="save"]'); await p.waitForFunction(() => /Tersimpan/.test(document.querySelector('#ed-status').textContent));
const cid = await p.evaluate(() => BE.id); if (!/^c-[a-z0-9]+$/.test(cid)) fail('id kursus: ' + cid); console.log('disimpan sebagai', cid);
// tiket keluar memilih soal
await p.click('[data-eact="tab"][data-t="materi"]');
const exitIdx = await p.evaluate(() => BE.raw.LESSONS[1].findIndex(b => b.k === 'exit'));
await p.click(`.ed-blocks li:nth-child(${exitIdx + 1}) [data-eact="blk-open"]`);
await p.click(`[data-eact-chk="exit-q"][data-id="${qid}"]`);
await p.click('.ed-bar [data-eact="save"]'); await p.waitForFunction(() => /Tersimpan/.test(document.querySelector('#ed-status').textContent));
// Pratinjau sebagai siswa
await p.click('.ed-bar [data-eact="preview"]'); await p.waitForSelector('.path .sec');
console.log('kursus terbuka:', await p.$eval('.hello h1', e => e.textContent));
await p.click('[data-go="lesson"][data-sec="1"]'); await p.waitForSelector('#blk');
const firstBlk = await p.$eval('#blk', e => e.innerHTML);
if (!/<b>timbangan seimbang<\/b>/.test(firstBlk) || !/<li>/.test(firstBlk) || !/class="m"/.test(firstBlk)) fail('materi tidak dirender dengan format');
// latihan L1
const L = await p.evaluate(() => BC.LESSONS[1].findIndex(b => b.k === 'practice'));
await p.evaluate((i) => BU.go('lesson', { sec: 1, i }), L); await p.waitForSelector('[data-act="practice"][data-l="1"]');
await p.click('[data-act="practice"][data-l="1"]'); await p.waitForSelector('.run .q');
console.log('latihan L1 berjalan:', await p.$eval('#run-n', e => e.textContent), 'soal');
// XSS tidak boleh tereksekusi atau menjadi elemen
const xss = await p.evaluate(() => ({ flag: window.__xss, imgs: document.querySelectorAll('img[src="x"]').length }));
await p.evaluate(() => BU.go('home')); await p.waitForSelector('.catalog');
const xss2 = await p.evaluate(() => ({ flag: window.__xss, imgs: document.querySelectorAll('img[src="x"]').length }));
if (xss.flag || xss.imgs || xss2.flag || xss2.imgs) fail('HTML dari guru lolos ke halaman'); else console.log('HTML berbahaya dari guru tidak lolos');
const cards = await p.$$eval('.ccard h3', l => l.map(x => x.textContent)); if (!cards.includes('Persamaan Linear')) fail('kursus baru tidak muncul di katalog'); else console.log('muncul di katalog');
// bisa dipilih saat membuat kelas
await p.evaluate(() => BU.go('kelas')); await p.waitForSelector('#ccourse', { state: 'attached' });
const opt = await p.$eval('#ccourse', (s, id) => [...s.options].some(o => o.value === id), cid); if (!opt) fail('kursus tidak bisa dipilih untuk kelas'); else console.log('bisa dipakai untuk kelas');
// edit ulang dari Studio
await p.evaluate(() => { BE.raw = null; BE.id = null; BU.go('studio'); }); await p.waitForSelector('.st-card'); await p.click('.st-card [data-eact="edit"]'); await p.waitForSelector('[data-b="meta.title"]');
if (await p.inputValue('[data-b="meta.title"]') !== 'Persamaan Linear') fail('membuka ulang kursus'); else console.log('buka ulang dari Studio OK');
if (errs.length) fail('error konsol: ' + errs.join(' | ')); else console.log('Tanpa error konsol.');
await b.close();
