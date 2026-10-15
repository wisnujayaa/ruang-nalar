// Account flow test with a fake Supabase: sign-up + email confirmation, resend, sign-in before confirming,
// password reset → new password, expired links, welcome after activation. Run: node tests/auth-flow.mjs
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const pw = (() => { try { return require('playwright'); } catch (e) { return require(process.env.PLAYWRIGHT_PATH); } })();
const fs = require('fs'); const MOCK = fs.readFileSync(new globalThis.URL('./fake-supabase.js', import.meta.url), 'utf8');
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.route(/fonts\./, r => r.abort());
await ctx.route(/vendor\/supabase\.js/, r => r.fulfill({ contentType: 'application/javascript', body: MOCK }));
const URL = process.env.URL || 'http://localhost:8765/'; const errs = [];
const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
const fail = (m) => { console.error('FAILED:', m); process.exitCode = 1; };
const fakeDb = () => p.evaluate(() => JSON.parse(localStorage.getItem('FAKE_SB')));

// 0) The Google button only appears when the Google provider is enabled in Supabase (read from /auth/v1/settings)
let googleOn = false;
await ctx.route(/\/auth\/v1\/settings/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ external: { google: googleOn, email: true } }) }));

// 1) Sign-up with email confirmation required → "enter activation code" card
await p.goto(URL); await p.evaluate(() => localStorage.setItem('FAKE_CONFIRM', '1')); await p.reload(); await p.waitForSelector('.catalog');
await p.evaluate(() => BU.go('login', { t: 'daftar' })); await p.waitForSelector('#l-name'); await p.waitForTimeout(150);
if (await p.$eval('#g-box', e => !e.hidden)) fail('Google button shown while Google is disabled');
await p.fill('#l-name', 'Rani'); await p.fill('#l-email', 'rani@x.id'); await p.fill('#l-pass', 'abc');
await p.waitForFunction(() => /pendek/.test(document.querySelector('#pw-h').textContent)); await p.fill('#l-pass', 'RahasiaKuat#2026');
if (!/Kuat/.test(await p.$eval('#pw-h', e => e.textContent))) fail('strong password indicator');
await p.click('[data-pact="pw-eye"]'); if ((await p.$eval('#l-pass', e => e.type)) !== 'text') fail('show-password button'); await p.click('[data-pact="pw-eye"]');
await p.click('#lform button[type=submit]'); await p.waitForSelector('.mailcard #otp');
if (!(await p.$eval('.mailcard', e => e.textContent)).includes('rani@x.id')) fail('email not shown on the card');
if (!/\/$|index\.html$/.test((await fakeDb()).users[0].redirect || '')) fail('emailRedirectTo must point to the site: ' + (await fakeDb()).users[0].redirect);
console.log('sign-up → "enter activation code" card OK');
await p.click('.mailcard [data-pact="resend"]'); await p.waitForFunction(() => /Tunggu \d+ detik/.test(document.querySelector('#resend-m').textContent));
if ((await fakeDb()).resent) fail('resend right after sign-up must wait for the cooldown');
console.log('60 s resend cooldown OK');

// 2) Sign-in before confirming → clear message + "enter activation code" button
await p.evaluate(() => BU.go('login')); await p.waitForSelector('#l-email');
await p.fill('#l-email', 'rani@x.id'); await p.fill('#l-pass', 'RahasiaKuat#2026'); await p.click('#lform button[type=submit]');
await p.waitForFunction(() => /belum dikonfirmasi/.test(document.querySelector('#l-err').textContent));
await p.click('#l-err [data-pact="code-in"]'); await p.waitForSelector('#otp');
console.log('sign-in before confirming → sent to the activation code OK');

// 3) Wrong code → clear message; right code → account active + welcome
await p.fill('#otp', '12 34'); await p.click('#otpf button[type=submit]');
await p.waitForFunction(() => /6 angka/.test(document.querySelector('#otp-e').textContent));
await p.fill('#otp', '999999'); await p.click('#otpf button[type=submit]');
await p.waitForFunction(() => /salah atau sudah kedaluwarsa/.test(document.querySelector('#otp-e').textContent));
await p.fill('#otp', '123 456'); if ((await p.$eval('#otp', e => e.value)) !== '123456') fail('spaces in the code must be stripped');
await p.click('#otpf button[type=submit]'); await p.waitForSelector('.welcome');
if (!(await p.$eval('.welcome', e => e.textContent)).includes('Rani')) fail('name on the welcome page');
if (!(await p.$eval('header', e => e.textContent)).includes('Rani') && !(await p.evaluate(() => BB.user && BB.user.name === 'Rani'))) fail('not signed in after a correct code');
if ((await fakeDb()).users[0].unconfirmed) fail('account not activated');
console.log('wrong/right activation code → account active + welcome OK');

// 3b) Links from older emails still work
await p.goto(URL + '#access_token=abc&refresh_token=def&expires_in=3600&token_type=bearer&type=signup'); await p.reload();
await p.waitForSelector('.welcome'); if (/access_token/.test(p.url())) fail('token left in the URL: ' + p.url());
console.log('old confirmation link → welcome, URL cleaned OK');

// 3c) Forgot password with a code
await p.evaluate(() => { sessionStorage.removeItem('FAKE_SESSION'); }); await p.goto(URL); await p.reload(); await p.waitForSelector('.catalog');
await p.evaluate(() => BU.go('login', { t: 'lupa' })); await p.waitForSelector('#l-email'); await p.fill('#l-email', 'rani@x.id'); await p.click('#lform button[type=submit]');
await p.waitForSelector('#otp'); if (!/atur ulang/i.test(await p.$eval('.mailcard h2', e => e.textContent))) fail('reset code card');
await p.fill('#otp', '123456'); await p.click('#otpf button[type=submit]'); await p.waitForFunction(() => /salah/.test(document.querySelector('#otp-e').textContent));
await p.fill('#otp', '654321'); await p.click('#otpf button[type=submit]'); await p.waitForSelector('#pwf');
if (!/Kode atur ulang diterima/.test(await p.$eval('#pwf', e => e.textContent))) fail('new password form (recovery)');
await p.fill('#pw1', 'SandiKode#2026'); await p.fill('#pw2', 'SandiKode#2026'); await p.click('#pwf button[type=submit]'); await p.waitForSelector('.rep-ok');
if ((await fakeDb()).users[0].password !== 'SandiKode#2026') fail('new password via code not saved');
console.log('forgot password → code → new password OK');

// 3d) "Already have a code?" from the sign-in page
await p.evaluate(() => sessionStorage.removeItem('FAKE_SESSION')); await p.goto(URL); await p.reload(); await p.waitForSelector('.catalog');
await p.evaluate(() => BU.go('login', { t: 'lupa' })); await p.waitForSelector('[data-pact="have-code"]'); await p.click('[data-pact="have-code"]');
await p.waitForFunction(() => /Tulis dulu email/.test(document.querySelector('#l-err').textContent));
await p.fill('#l-email', 'rani@x.id'); await p.click('[data-pact="have-code"]'); await p.waitForSelector('#otp');
console.log('"Already have a code?" OK');

// 3e) Google enabled → button shown → redirected to Google with a return address to this site
googleOn = true; await p.goto(URL); await p.reload(); await p.waitForSelector('.catalog');
await p.evaluate(() => BU.go('login')); await p.waitForSelector('#g-box:not([hidden])'); await p.click('[data-pact="google"]'); await p.waitForTimeout(150);
const oa = (await fakeDb()).oauth; if (!oa || oa.provider !== 'google' || !/\/$|index\.html$/.test(oa.redirectTo || '')) fail('Google sign-in: ' + JSON.stringify(oa));
// back from Google as a new user → welcome
await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('FAKE_SB')); const u = { id: 'g-1', email: 'g@gmail.com', created_at: new Date().toISOString(), user_metadata: { full_name: 'Gita Google' } }; d.users.push(u); d.profiles.push({ id: 'g-1', display_name: 'Gita Google', role: 'student' }); localStorage.setItem('FAKE_SB', JSON.stringify(d)); sessionStorage.setItem('FAKE_SESSION', JSON.stringify({ user: u })); });
await p.goto(URL + '#access_token=abc&refresh_token=def&expires_in=3600&token_type=bearer&provider_token=x'); await p.reload();
await p.waitForSelector('.welcome'); if (!(await p.$eval('.welcome', e => e.textContent)).includes('Gita')) fail('welcome for a new Google user');
if (/access_token/.test(p.url())) fail('Google token left in the URL');
console.log('sign in with Google → return → welcome OK');
googleOn = false;
await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('FAKE_SB')); sessionStorage.setItem('FAKE_SESSION', JSON.stringify({ user: d.users[0] })); localStorage.removeItem('FAKE_CONFIRM'); });

// 4) Password-reset link → new password form → saved
await p.goto(URL + '#access_token=abc&type=recovery'); await p.reload(); await p.waitForSelector('#pwf');
await p.fill('#pw1', 'SandiBaru#2026'); await p.fill('#pw2', 'beda'); await p.click('#pwf button[type=submit]');
await p.waitForFunction(() => /belum sama/.test(document.querySelector('#pw-e').textContent));
await p.fill('#pw2', 'SandiBaru#2026'); await p.click('#pwf button[type=submit]'); await p.waitForSelector('.rep-ok');
if ((await fakeDb()).users[0].password !== 'SandiBaru#2026') fail('password unchanged');
console.log('password-reset link → new password saved OK');

// 5) Expired link → explanation + resend from that page
await p.evaluate(() => sessionStorage.removeItem('FAKE_SESSION'));
await p.goto(URL + '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'); await p.reload();
await p.waitForFunction(() => /tidak berlaku/.test(document.body.textContent));
await p.click('[data-pact="go-resend"]'); await p.fill('#rs-email', 'rani@x.id'); await p.waitForTimeout(100);
console.log('expired link → explanation page OK');

// 6) Change password from the Account menu (signed in)
await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('FAKE_SB')); sessionStorage.setItem('FAKE_SESSION', JSON.stringify({ user: d.users[0] })); }); await p.goto(URL); await p.reload(); await p.waitForSelector('.catalog');
await p.evaluate(() => BU.go('me')); await p.click('[data-go="sandi"]'); await p.waitForSelector('#pwf');
await p.fill('#pw1', 'SandiBaru#2026'); await p.fill('#pw2', 'SandiBaru#2026'); await p.click('#pwf button[type=submit]');
await p.waitForFunction(() => /berbeda dari yang lama/.test(document.querySelector('#pw-e').textContent));
console.log('change password from Account (same password → clear message) OK');

await b.close();
if (errs.length) { console.error('FAILED, console errors:', errs); process.exitCode = 1; } else if (!process.exitCode) console.log('Account flow OK, no console errors.');
