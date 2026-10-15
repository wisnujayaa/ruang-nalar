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

// 0) Tombol Google muncul hanya bila penyedia Google aktif di Supabase (dibaca dari /auth/v1/settings)
let googleOn = false;
await ctx.route(/\/auth\/v1\/settings/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ external: { google: googleOn, email: true } }) }));

// 1) Daftar saat konfirmasi email wajib → kartu "Masukkan kode aktivasi"
await p.goto(URL); await p.evaluate(() => localStorage.setItem('FAKE_CONFIRM', '1')); await p.reload(); await p.waitForSelector('.catalog');
await p.evaluate(() => BU.go('login', { t: 'daftar' })); await p.waitForSelector('#l-name'); await p.waitForTimeout(150);
if (await p.$eval('#g-box', e => !e.hidden)) fail('tombol Google tampil padahal Google belum aktif');
await p.fill('#l-name', 'Rani'); await p.fill('#l-email', 'rani@x.id'); await p.fill('#l-pass', 'abc');
await p.waitForFunction(() => /pendek/.test(document.querySelector('#pw-h').textContent)); await p.fill('#l-pass', 'RahasiaKuat#2026');
if (!/Kuat/.test(await p.$eval('#pw-h', e => e.textContent))) fail('indikator sandi kuat');
await p.click('[data-pact="pw-eye"]'); if ((await p.$eval('#l-pass', e => e.type)) !== 'text') fail('tombol lihat sandi'); await p.click('[data-pact="pw-eye"]');
await p.click('#lform button[type=submit]'); await p.waitForSelector('.mailcard #otp');
if (!(await p.$eval('.mailcard', e => e.textContent)).includes('rani@x.id')) fail('email tidak tampil di kartu');
if (!/\/$|index\.html$/.test((await fakeDb()).users[0].redirect || '')) fail('emailRedirectTo harus ke situs: ' + (await fakeDb()).users[0].redirect);
console.log('daftar → kartu "Masukkan kode aktivasi" OK');
await p.click('.mailcard [data-pact="resend"]'); await p.waitForFunction(() => /Tunggu \d+ detik/.test(document.querySelector('#resend-m').textContent));
if ((await fakeDb()).resent) fail('kirim ulang langsung setelah daftar harus menunggu jeda');
console.log('jeda kirim ulang 60 detik OK');

// 2) Masuk sebelum konfirmasi → pesan jelas + tombol "Masukkan kode aktivasi"
await p.evaluate(() => BU.go('login')); await p.waitForSelector('#l-email');
await p.fill('#l-email', 'rani@x.id'); await p.fill('#l-pass', 'RahasiaKuat#2026'); await p.click('#lform button[type=submit]');
await p.waitForFunction(() => /belum dikonfirmasi/.test(document.querySelector('#l-err').textContent));
await p.click('#l-err [data-pact="code-in"]'); await p.waitForSelector('#otp');
console.log('masuk sebelum konfirmasi → arahkan ke kode aktivasi OK');

// 3) Kode salah → pesan jelas; kode benar → akun aktif + sambutan
await p.fill('#otp', '12 34'); await p.click('#otpf button[type=submit]');
await p.waitForFunction(() => /6 angka/.test(document.querySelector('#otp-e').textContent));
await p.fill('#otp', '999999'); await p.click('#otpf button[type=submit]');
await p.waitForFunction(() => /salah atau sudah kedaluwarsa/.test(document.querySelector('#otp-e').textContent));
await p.fill('#otp', '123 456'); if ((await p.$eval('#otp', e => e.value)) !== '123456') fail('spasi di kode harus dibuang');
await p.click('#otpf button[type=submit]'); await p.waitForSelector('.welcome');
if (!(await p.$eval('.welcome', e => e.textContent)).includes('Rani')) fail('nama di sambutan');
if (!(await p.$eval('header', e => e.textContent)).includes('Rani') && !(await p.evaluate(() => BB.user && BB.user.name === 'Rani'))) fail('belum masuk setelah kode benar');
if ((await fakeDb()).users[0].unconfirmed) fail('akun belum aktif');
console.log('kode aktivasi salah/benar → akun aktif + sambutan OK');

// 3b) Tautan dari email lama tetap bisa dipakai
await p.goto(URL + '#access_token=abc&refresh_token=def&expires_in=3600&token_type=bearer&type=signup'); await p.reload();
await p.waitForSelector('.welcome'); if (/access_token/.test(p.url())) fail('token masih tertinggal di URL: ' + p.url());
console.log('tautan konfirmasi lama → sambutan, URL dibersihkan OK');

// 3c) Lupa sandi dengan kode
await p.evaluate(() => { sessionStorage.removeItem('FAKE_SESSION'); }); await p.goto(URL); await p.reload(); await p.waitForSelector('.catalog');
await p.evaluate(() => BU.go('login', { t: 'lupa' })); await p.waitForSelector('#l-email'); await p.fill('#l-email', 'rani@x.id'); await p.click('#lform button[type=submit]');
await p.waitForSelector('#otp'); if (!/atur ulang/i.test(await p.$eval('.mailcard h2', e => e.textContent))) fail('kartu kode atur ulang');
await p.fill('#otp', '123456'); await p.click('#otpf button[type=submit]'); await p.waitForFunction(() => /salah/.test(document.querySelector('#otp-e').textContent));
await p.fill('#otp', '654321'); await p.click('#otpf button[type=submit]'); await p.waitForSelector('#pwf');
if (!/Kode atur ulang diterima/.test(await p.$eval('#pwf', e => e.textContent))) fail('formulir sandi baru (pemulihan)');
await p.fill('#pw1', 'SandiKode#2026'); await p.fill('#pw2', 'SandiKode#2026'); await p.click('#pwf button[type=submit]'); await p.waitForSelector('.rep-ok');
if ((await fakeDb()).users[0].password !== 'SandiKode#2026') fail('sandi baru dari kode tidak tersimpan');
console.log('lupa sandi → kode → sandi baru OK');

// 3d) "Sudah punya kode?" dari halaman masuk
await p.evaluate(() => sessionStorage.removeItem('FAKE_SESSION')); await p.goto(URL); await p.reload(); await p.waitForSelector('.catalog');
await p.evaluate(() => BU.go('login', { t: 'lupa' })); await p.waitForSelector('[data-pact="have-code"]'); await p.click('[data-pact="have-code"]');
await p.waitForFunction(() => /Tulis dulu email/.test(document.querySelector('#l-err').textContent));
await p.fill('#l-email', 'rani@x.id'); await p.click('[data-pact="have-code"]'); await p.waitForSelector('#otp');
console.log('"Sudah punya kode?" OK');

// 3e) Google aktif → tombol tampil → diarahkan ke Google dengan alamat kembali ke situs ini
googleOn = true; await p.goto(URL); await p.reload(); await p.waitForSelector('.catalog');
await p.evaluate(() => BU.go('login')); await p.waitForSelector('#g-box:not([hidden])'); await p.click('[data-pact="google"]'); await p.waitForTimeout(150);
const oa = (await fakeDb()).oauth; if (!oa || oa.provider !== 'google' || !/\/$|index\.html$/.test(oa.redirectTo || '')) fail('masuk Google: ' + JSON.stringify(oa));
// kembali dari Google sebagai pengguna baru → sambutan
await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('FAKE_SB')); const u = { id: 'g-1', email: 'g@gmail.com', created_at: new Date().toISOString(), user_metadata: { full_name: 'Gita Google' } }; d.users.push(u); d.profiles.push({ id: 'g-1', display_name: 'Gita Google', role: 'student' }); localStorage.setItem('FAKE_SB', JSON.stringify(d)); sessionStorage.setItem('FAKE_SESSION', JSON.stringify({ user: u })); });
await p.goto(URL + '#access_token=abc&refresh_token=def&expires_in=3600&token_type=bearer&provider_token=x'); await p.reload();
await p.waitForSelector('.welcome'); if (!(await p.$eval('.welcome', e => e.textContent)).includes('Gita')) fail('sambutan pengguna Google baru');
if (/access_token/.test(p.url())) fail('token Google tertinggal di URL');
console.log('masuk dengan Google → kembali → sambutan OK');
googleOn = false;
await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('FAKE_SB')); sessionStorage.setItem('FAKE_SESSION', JSON.stringify({ user: d.users[0] })); localStorage.removeItem('FAKE_CONFIRM'); });

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
