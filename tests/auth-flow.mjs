// Uji alur akun dengan Supabase palsu: daftar + konfirmasi email, kirim ulang, masuk sebelum konfirmasi,
// tautan lupa sandi → sandi baru, tautan kedaluwarsa, sambutan setelah aktif. Jalankan: node tests/auth-flow.mjs
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const pw = (() => { try { return require('playwright'); } catch (e) { return require(process.env.PLAYWRIGHT_PATH); } })();
const fs = require('fs'); const MOCK = fs.readFileSync(new globalThis.URL('./fake-supabase.js', import.meta.url), 'utf8');
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.route(/fonts\./, r => r.abort());
await ctx.route(/vendor\/supabase\.js/, r => r.fulfill({ contentType: 'application/javascript', body: MOCK }));
const URL = process.env.URL || 'http://localhost:8765/'; const errs = [];
const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
const fail = (m) => { console.error('GAGAL:', m); process.exitCode = 1; };
const fakeDb = () => p.evaluate(() => JSON.parse(localStorage.getItem('FAKE_SB')));

// 1) Daftar saat konfirmasi email wajib → kartu "Cek emailmu", tautan email menuju situs ini
await p.goto(URL); await p.evaluate(() => localStorage.setItem('FAKE_CONFIRM', '1')); await p.reload(); await p.waitForSelector('.catalog');
await p.evaluate(() => BU.go('login', { t: 'daftar' })); await p.waitForSelector('#l-name');
await p.fill('#l-name', 'Rani'); await p.fill('#l-email', 'rani@x.id'); await p.fill('#l-pass', 'abc');
await p.waitForFunction(() => /pendek/.test(document.querySelector('#pw-h').textContent)); await p.fill('#l-pass', 'RahasiaKuat#2026');
if (!/Kuat/.test(await p.$eval('#pw-h', e => e.textContent))) fail('indikator sandi kuat');
await p.click('[data-pact="pw-eye"]'); if ((await p.$eval('#l-pass', e => e.type)) !== 'text') fail('tombol lihat sandi'); await p.click('[data-pact="pw-eye"]');
await p.click('#lform button[type=submit]'); await p.waitForSelector('.mailcard');
if (!(await p.$eval('.mailcard', e => e.textContent)).includes('rani@x.id')) fail('email tidak tampil di kartu');
if (!/\/$|index\.html$/.test((await fakeDb()).users[0].redirect || '')) fail('emailRedirectTo harus ke situs: ' + (await fakeDb()).users[0].redirect);
console.log('daftar → kartu "Cek emailmu" OK');
await p.click('.mailcard [data-pact="resend"]'); await p.waitForFunction(() => /dikirim/.test(document.querySelector('#resend-m').textContent));
await p.click('.mailcard [data-pact="resend"]'); await p.waitForFunction(() => /Tunggu \d+ detik/.test(document.querySelector('#resend-m').textContent));
if ((await fakeDb()).resent.length !== 1) fail('jeda kirim ulang tidak berlaku');
console.log('kirim ulang + jeda 60 detik OK');

// 2) Masuk sebelum konfirmasi → pesan jelas + tombol kirim ulang
await p.evaluate(() => BU.go('login')); await p.waitForSelector('#l-email');
await p.fill('#l-email', 'rani@x.id'); await p.fill('#l-pass', 'RahasiaKuat#2026'); await p.click('#lform button[type=submit]');
await p.waitForFunction(() => /belum dikonfirmasi/.test(document.querySelector('#l-err').textContent));
if (!(await p.$('#l-err [data-pact="resend"]'))) fail('tombol kirim ulang di pesan error');
await p.fill('#l-pass', 'salah-sekali'); await p.click('#lform button[type=submit]'); await p.waitForFunction(() => /salah/.test(document.querySelector('#l-err').textContent));
console.log('masuk sebelum konfirmasi / sandi salah → pesan Indonesia OK');

// 3) Membuka tautan konfirmasi dari email → sambutan "Akunmu sudah aktif"
await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('FAKE_SB')); d.users[0].unconfirmed = false; localStorage.setItem('FAKE_SB', JSON.stringify(d)); sessionStorage.setItem('FAKE_SESSION', JSON.stringify({ user: d.users[0] })); localStorage.removeItem('FAKE_CONFIRM'); });
await p.goto(URL + '#access_token=abc&refresh_token=def&expires_in=3600&token_type=bearer&type=signup'); await p.reload();
await p.waitForSelector('.welcome'); if (/access_token/.test(p.url())) fail('token masih tertinggal di URL: ' + p.url());
if (!(await p.$eval('.welcome', e => e.textContent)).includes('Rani')) fail('nama di sambutan');
console.log('tautan konfirmasi → halaman sambutan, URL dibersihkan OK');

// 4) Tautan lupa sandi → formulir sandi baru → tersimpan
await p.goto(URL + '#access_token=abc&type=recovery'); await p.reload(); await p.waitForSelector('#pwf');
await p.fill('#pw1', 'SandiBaru#2026'); await p.fill('#pw2', 'beda'); await p.click('#pwf button[type=submit]');
await p.waitForFunction(() => /belum sama/.test(document.querySelector('#pw-e').textContent));
await p.fill('#pw2', 'SandiBaru#2026'); await p.click('#pwf button[type=submit]'); await p.waitForSelector('.rep-ok');
if ((await fakeDb()).users[0].password !== 'SandiBaru#2026') fail('sandi tidak berubah');
console.log('tautan lupa sandi → sandi baru tersimpan OK');

// 5) Tautan kedaluwarsa → penjelasan + kirim ulang dari halaman itu
await p.evaluate(() => sessionStorage.removeItem('FAKE_SESSION'));
await p.goto(URL + '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'); await p.reload();
await p.waitForFunction(() => /tidak berlaku/.test(document.body.textContent));
await p.click('[data-pact="go-resend"]'); await p.fill('#rs-email', 'rani@x.id'); await p.waitForTimeout(100);
console.log('tautan kedaluwarsa → halaman penjelasan OK');

// 6) Ganti sandi dari menu Akun (sudah masuk)
await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('FAKE_SB')); sessionStorage.setItem('FAKE_SESSION', JSON.stringify({ user: d.users[0] })); }); await p.goto(URL); await p.reload(); await p.waitForSelector('.catalog');
await p.evaluate(() => BU.go('me')); await p.click('[data-go="sandi"]'); await p.waitForSelector('#pwf');
await p.fill('#pw1', 'SandiBaru#2026'); await p.fill('#pw2', 'SandiBaru#2026'); await p.click('#pwf button[type=submit]');
await p.waitForFunction(() => /berbeda dari yang lama/.test(document.querySelector('#pw-e').textContent));
console.log('ganti sandi dari Akun (sandi sama → pesan jelas) OK');

await b.close();
if (errs.length) { console.error('GAGAL, error konsol:', errs); process.exitCode = 1; } else if (!process.exitCode) console.log('Alur akun OK, tanpa error konsol.');
