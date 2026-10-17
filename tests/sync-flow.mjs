// Cross-device progress sync: two separate browsers ("laptop" and "phone") share one fake server.
// The server (the fake's database) is moved between the two browsers step by step so the order of events is exact.
// Each scenario is something that really went wrong: progress "lost" when switching devices.
// Run: npm run serve, then node tests/sync-flow.mjs
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const pw = (() => { try { return require('playwright'); } catch (e) { return require(process.env.PLAYWRIGHT_PATH); } })();
const fs = require('fs'); const MOCK = fs.readFileSync(new globalThis.URL('./fake-supabase.js', import.meta.url), 'utf8');
const URL_ = process.env.URL || 'http://localhost:8765/';
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const errs = []; const problems = [];
const fail = (m) => { problems.push(m); console.error('FAILED:', m); };   // soft: later scenarios still run, so every problem is reported
let seen = 0; const ok = (m) => { if (problems.length === seen) console.log('OK:', m); seen = problems.length; };
let server = null;   // the fake's whole database, as JSON text

async function device(name) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/fonts\./, r => r.abort());
  await ctx.route(/vendor\/supabase\.js/, r => r.fulfill({ contentType: 'application/javascript', body: MOCK }));
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(name + ': ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(name + ': ' + m.text()); });
  await page.goto(URL_); await page.waitForSelector('.catalog');
  return { name, page };
}
const upload = (d) => d.page.evaluate(() => localStorage.getItem('FAKE_SB')).then(s => { server = s; });       // device → server
const download = (d) => d.page.evaluate(s => { if (s) localStorage.setItem('FAKE_SB', s); }, server);          // server → device
const serverRow = () => { const r = JSON.parse(server).progress.find(p => p.course_id === 'pertidaksamaan'); return r ? (typeof r.state === 'string' ? JSON.parse(r.state) : r.state) : null; };
const idsOnServer = () => (serverRow() ? serverRow().attempts.map(a => a.i) : []).sort();
async function signup(d, name, email) {
  const p = d.page; await p.click('.nudge [data-go="login"]'); await p.click('[data-pact="ltab"][data-t="daftar"]');
  await p.fill('#l-name', name); await p.fill('#l-email', email); await p.fill('#l-pass', 'rahasia123'); await p.click('#lform button[type=submit]');
  await p.waitForSelector('.welcome'); await p.evaluate(() => BU.go('home'));
}
async function login(d, email) {
  const p = d.page; await p.evaluate(() => BU.go('login')); await p.waitForSelector('#l-email');
  await p.fill('#l-email', email); await p.fill('#l-pass', 'rahasia123'); await p.click('#lform button[type=submit]');
  await p.waitForFunction(() => BB.user); await p.evaluate(() => BU.go('home'));
}
const answer = (d, ids) => d.page.evaluate((ids) => { ids.forEach(id => BA.record({ id, sec: 1, lvl: 1, concepts: ['sifat-dasar'] }, { ok: true, conf: 3, ms: 1000, src: 'latihan' })); BA.save(); }, ids);
// Wait until this device's copy of the server holds all of these answers (the save is debounced by 2.5 s)
const settled = (d, ids) => d.page.waitForFunction((ids) => {
  const row = JSON.parse(localStorage.getItem('FAKE_SB')).progress.find(p => p.course_id === 'pertidaksamaan'); if (!row) return false;
  const st = typeof row.state === 'string' ? JSON.parse(row.state) : row.state; const have = st.attempts.map(a => a.i);
  return ids.every(i => have.includes(i)) && (BA.sync.status === 'tersinkron') && !BA.sync.busy;
}, ids, { timeout: 15000 });
const cta = (d) => d.page.$eval('.cta-t', e => e.textContent).catch(() => null);
const foreground = (d) => d.page.evaluate(() => { BA.sync.minPullGap = 0; Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); });
const fast = (d) => d.page.evaluate(() => { BA.sync.timeoutMs = 700; BA.sync.retryMs = 300; BA.sync.minPullGap = 0; });

/* ---------- Scenario 1: finish on the laptop, open the phone ---------- */
const laptop = await device('laptop'); await signup(laptop, 'Dika', 'dika@x.id');
await laptop.page.evaluate(async () => { await BU.openCourse('pertidaksamaan'); });
await answer(laptop, ['a1', 'a2', 'a3']); await laptop.page.evaluate(() => { BA.S.intro = 1; BA.save(); }); await settled(laptop, ['a1', 'a2', 'a3']); await upload(laptop);
if (idsOnServer().join() !== 'a1,a2,a3') fail('laptop progress did not reach the server: ' + idsOnServer());
ok('laptop progress reaches the server');

const phone = await device('phone'); await download(phone); await login(phone, 'dika@x.id');
// Slow connection: the phone shows the map first, the server answer arrives later
await phone.page.evaluate(() => { window.__FAKE_DELAY = 700; });
await phone.page.evaluate(async () => { await BU.openCourse('pertidaksamaan'); BU.go('course'); });
await phone.page.waitForSelector('.cta-t');
const early = await cta(phone);
await phone.page.waitForFunction(() => BA.S.attempts.length === 3, null, { timeout: 8000 }).catch(() => fail('phone never received the laptop progress'));
await phone.page.waitForTimeout(400);
const late = await cta(phone);
if (late === early || /Mulai dari sini/.test(late || '')) fail('phone merged the progress but the screen still shows the old state ("' + late + '")');
ok('phone screen updates by itself when the server answer arrives (' + early + ' → ' + late + ')');
await phone.page.evaluate(() => { window.__FAKE_DELAY = 0; });

/* ---------- Scenario 2: both devices open, both answer: nothing may be overwritten ---------- */
await settled(phone, ['a1', 'a2', 'a3']); await upload(phone); await fast(phone); await fast(laptop);
await answer(laptop, ['l1', 'l2']); await settled(laptop, ['l1', 'l2']); await upload(laptop);          // laptop writes first
await download(phone);                                                                      // phone has NOT pulled: it still holds the old state in memory
await answer(phone, ['p1', 'p2']); await settled(phone, ['p1', 'p2']); await upload(phone);              // phone writes second
const want = ['a1', 'a2', 'a3', 'l1', 'l2', 'p1', 'p2'].sort().join();
if (idsOnServer().join() !== want) fail('a device overwrote the other. server has: ' + idsOnServer() + ' expected: ' + want);
ok('two devices writing in turn keep each other\'s answers');

/* ---------- Scenario 3: a device that stayed open catches up when brought to the front ---------- */
await download(laptop);                                                                     // server now holds the phone's answers
await foreground(laptop);
await laptop.page.waitForFunction(() => BA.S.attempts.length >= 7, null, { timeout: 8000 }).catch(async () => fail('open device did not catch up (has ' + await laptop.page.evaluate(() => BA.S.attempts.length) + ' of 7)'));
ok('an already-open device pulls new progress when it returns to the foreground');

/* ---------- Scenario 4: a request that never answers must not freeze syncing for good ---------- */
await laptop.page.evaluate(() => { window.__FAKE_HANG = 1; });
await answer(laptop, ['h1']);                                                               // this write hangs
await laptop.page.waitForTimeout(3500);
await answer(laptop, ['h2']);                                                               // later answers must still get through
await settled(laptop, ['h1', 'h2']).catch(async () => fail('sync stayed stuck after a hanging request (status ' + await laptop.page.evaluate(() => BA.sync.status) + ')'));
await upload(laptop);
if (!idsOnServer().includes('h1') || !idsOnServer().includes('h2')) fail('answers made around a hanging request never arrived: ' + idsOnServer());
ok('a hanging request times out and syncing recovers');

if (errs.length) fail('browser errors:\n' + [...new Set(errs)].join('\n'));
await b.close();
if (problems.length) { console.error('SYNC FLOW FAILED (' + problems.length + ' problem' + (problems.length > 1 ? 's' : '') + ')'); process.exit(1); }
console.log('SYNC FLOW PASSED');
