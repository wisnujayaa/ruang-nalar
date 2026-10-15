// Help center & guided tour test (local mode). Run: node tests/help-flow.mjs
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const pw = (() => { try { return require('playwright'); } catch (e) { return require(process.env.PLAYWRIGHT_PATH); } })();
const URL = process.env.URL || 'http://localhost:8765/'; const SHOTS = process.env.SHOTS;
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const errs = []; const fail = (m) => { console.error('FAILED:', m); process.exitCode = 1; };
for (const [w, h] of [[390, 844], [1280, 860]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load/.test(m.text())) errs.push(m.text()); });
  await p.route(/fonts\./, r => r.abort());
  await p.route(/\/config\.js$/, r => r.fulfill({ contentType: 'application/javascript', body: 'window.NALAR_CONFIG = {};' }));
  await p.goto(URL); await p.waitForSelector('.catalog');
  // welcome card for new visitors → tour
  await p.waitForSelector('.welcome-k'); await p.click('.welcome-k [data-hact="tour"]'); await p.waitForSelector('.tour-bub');
  const titles = []; for (let i = 0; i < 8; i++) { titles.push(await p.$eval('.tour-t', e => e.textContent)); if (SHOTS && i === 3) await p.screenshot({ path: `${SHOTS}/tour-${w}.png` }); if (i < 7) await p.click('[data-tour="next"]'); }
  if (titles.length !== 8 || !titles.includes('Review')) fail('tour steps: ' + titles.join(' | '));
  // the tour bubble must stay on-screen at every step
  const inView = await p.evaluate(() => { const r = document.querySelector('.tour-bub').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; });
  if (!inView) fail('tour bubble off-screen at width ' + w);
  await p.click('[data-tour="next"]'); if (await p.$('.tour')) fail('tour did not close');
  if (await p.$('.welcome-k')) { await p.evaluate(() => BU.render()); } if (await p.$('.welcome-k')) fail('welcome card still shown after the tour');
  // Esc menutup tur
  await p.evaluate(() => G => 0); await p.evaluate(() => NalarHelp.tour()); await p.waitForSelector('.tour'); await p.keyboard.press('Escape'); if (await p.$('.tour')) fail('Esc did not close the tour');
  // ? button → help center, search & topics
  await p.click('.helpbtn'); await p.waitForSelector('#h-q');
  const nAll = await p.$$eval('.hart', l => l.length); if (nAll < 30) fail('too few articles: ' + nAll);
  await p.fill('#h-q', 'email konfirmasi'); await p.waitForFunction(() => document.querySelector('.hart summary') && /email konfirmasi/i.test(document.querySelector('.hart summary').textContent));
  await p.fill('#h-q', 'KODE kélas'); await p.waitForFunction(() => /kelas/i.test(document.querySelector('.hart summary').textContent));
  await p.fill('#h-q', 'zzqqxx'); await p.waitForSelector('.empty');
  await p.fill('#h-q', ''); await p.click('[data-hact="topik"][data-t="guru"]'); const g = await p.$$eval('.hart', l => l.length); if (g < 3 || g > 6) fail('teacher topic filter: ' + g);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/help-${w}.png`, fullPage: false });
  // article action buttons open the target page
  await p.click('[data-hact="topik"][data-t=""]'); await p.click('#h-interval summary'); await p.click('#h-level summary');
  await p.click('#h-review-harian summary'); await p.click('#h-review-harian [data-hact="go"]'); await p.waitForFunction(() => BU.nav.cur.v === 'review');
  // contextual help link on Review → article opens
  await p.click('.help-l'); await p.waitForFunction(() => document.querySelector('#h-review-harian') && document.querySelector('#h-review-harian').open);
  // deep link #bantuan=akun (account topic)
  await p.goto(URL + '#bantuan=akun'); await p.waitForSelector('[data-t="akun"][aria-selected="true"]');
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (ov > 1) fail('overflow horizontal ' + ov);
  console.log('Help & tour OK at width ' + w + ' (' + nAll + ' articles)');
}
await b.close();
if (errs.length) { console.error('FAILED, console errors:', errs); process.exitCode = 1; } else if (!process.exitCode) console.log('Help center OK, no console errors.');
