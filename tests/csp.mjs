// Uji Content-Security-Policy dari file _headers: semua halaman harus jalan tanpa pelanggaran CSP.
// Jalankan: node tests/csp.mjs (butuh server di :8765)
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch (e) { pw = require(process.env.PLAYWRIGHT_PATH); }
const URL = process.env.URL || 'http://localhost:8765/';
const csp = fs.readFileSync(new globalThis.URL('../_headers', import.meta.url), 'utf8').match(/^\s+Content-Security-Policy: (.+)$/m)[1];
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const p = await (await b.newContext()).newPage(); const bad = [];
p.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) bad.push(m.text()); });
p.on('pageerror', e => bad.push('pageerror: ' + e.message));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.route(/\/config\.js$/, r => r.fulfill({ contentType: 'application/javascript', body: 'window.NALAR_CONFIG = {};' }));
await p.route(u => /localhost:8765\/(\?|#|$|index\.html)/.test(u.href), async r => { const res = await r.fetch(); r.fulfill({ response: res, headers: Object.assign({}, res.headers(), { 'content-security-policy': csp.replace(' upgrade-insecure-requests', '') }) }); });
await p.goto(URL + '#kursus=pertidaksamaan'); await p.waitForSelector('.path .sec');
for (const v of ['home', 'course', 'review', 'cards', 'mistakes', 'stats', 'me', 'settings', 'kelas', 'lapor', 'studio', 'traps', 'tryout', 'summary']) { await p.evaluate(v => BU.go(v), v); await p.waitForTimeout(150); }
await p.evaluate(() => BU.go('lesson', { sec: 1, i: 3 })); await p.waitForTimeout(300);
for (let i = 0; i < 12; i++) { await p.evaluate(i => BU.go('lesson', { sec: 1, i }), i); await p.waitForTimeout(80); }   // widget interaktif
await p.evaluate(() => BU.go('editor', { id: 'new' })); await p.waitForTimeout(300);
// Simulasi celah XSS: skrip sisipan harus diblokir browser
await p.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<img src="x:y" onerror="window.__pwn=1"><a id="jsl" href="javascript:window.__pwn2=1">x</a>'); document.getElementById('jsl').click(); });
await p.waitForTimeout(400);
const pwned = await p.evaluate(() => !!(window.__pwn || window.__pwn2));
if (pwned) bad.push('skrip inline sisipan TIDAK diblokir'); else console.log('Skrip sisipan (onerror / javascript:) diblokir CSP');
const before = bad.length; bad.splice(0, bad.length, ...bad.filter(x => !/Refused to (execute inline event handler|run the JavaScript URL|load the image 'x:y')/i.test(x) && !/javascript:|x:y/.test(x)));
const hasCsp = await p.evaluate(async () => (await fetch(location.href)).headers.get('content-security-policy'));
if (!hasCsp) bad.push('header CSP tidak terpasang di uji ini');
await b.close();
if (bad.length) { console.error('GAGAL CSP:\n' + [...new Set(bad)].join('\n')); process.exit(1); }
console.log('CSP OK: semua halaman jalan tanpa pelanggaran (' + csp.split(';').length + ' aturan)');
