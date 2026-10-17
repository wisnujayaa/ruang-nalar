// Answers EVERY question the way a student would, through the real UI, under the site's real CSP.
//   - the correct answer must be graded correct (right-answer variants: raw key, pretty form, decimal comma…)
//   - a clearly wrong answer must be graded wrong
//   - no CSP violation, no page error, no console error may appear while doing so
// This exists because a blocked Function() once made every numeric answer "unreadable" on the live site
// while all tests were green. Run: node tests/answers-flow.mjs (needs a server on :8765)
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch (e) { pw = require(process.env.PLAYWRIGHT_PATH); }
const URL_ = process.env.URL || 'http://localhost:8765/';
const csp = fs.readFileSync(new URL('../_headers', import.meta.url), 'utf8').match(/^\s+Content-Security-Policy: (.+)$/m)[1].replace(' upgrade-insecure-requests', '');
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await b.newContext({ viewport: { width: 1000, height: 900 } });
const p = await ctx.newPage(); const problems = [];
p.on('pageerror', e => problems.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) problems.push('console.error: ' + m.text().slice(0, 200)); });
await p.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ← ' + (e.blockedURI || '') + ' ' + (e.sample || ''))); });
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.route(/\/config\.js$/, r => r.fulfill({ contentType: 'application/javascript', body: 'window.NALAR_CONFIG = {};' }));
await p.route(u => /localhost:8765\/(\?|#|$|index\.html)/.test(u.href), async r => { const res = await r.fetch(); r.fulfill({ response: res, headers: Object.assign({}, res.headers(), { 'content-security-policy': csp }) }); });
await p.goto(URL_ + '#kursus=pertidaksamaan'); await p.waitForSelector('.path .sec');

// Runs inside the page. The clicks/inputs fire the page's own handlers, so the CSP applies exactly as for a real student.
async function solveCourse(courseId) {
  return await p.evaluate(async (courseId) => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    await BU.openCourse(courseId);
    const refs = Object.keys(BC.BANK).map(id => id);
    const gens = Object.keys(BC.GEN || {}); for (const g of gens) for (const seed of [1, 7, 123, 4242, 99991]) refs.push({ gen: g, seed });
    const bad = []; let n = 0, wrongChecked = 0;
    const $ = (s, r) => (r || document).querySelector(s);
    const click = (el) => el && el.click();
    const setVal = (inp, v) => { inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); };
    async function attempt(ref, mode) {   // mode: 'right' | 'right2' | 'wrong'
      const it = BA.item(ref); if (!it) { bad.push(JSON.stringify(ref) + ': item not found'); return; }
      const label = (it.gen ? it.gen + '#' + (ref.seed) : it.id) + ' [' + it.type + '/' + mode + ']';
      BU.go('run', { refs: [ref], cfg: { src: 'answers-test' } });
      await sleep(0);
      const q = $('#run-q .q'); if (!q) { bad.push(label + ': question did not render'); return; }
      try {
        if (it.type === 'mc') {
          const rv = $('[data-q="reveal"]', q); if (rv) { click(rv); }
          const want = mode === 'wrong' ? it.opts.findIndex(o => !o.ok) : it.opts.findIndex(o => o.ok);
          const btn = $('[data-o="' + want + '"]', q); if (!btn) throw new Error('option button missing');
          click(btn);
        } else if (it.type === 'num') {
          const v = mode === 'wrong' ? String(Number(it.ans) + 7.5) : mode === 'right2' ? String(it.ans).replace('.', ',') : String(it.ans);
          setVal($('input', q), v);
        } else if (it.type === 'interval') {
          const set = it.ansSet || BM.parseSet(it.ans);
          let txt = it.ans;
          if (mode === 'right2') txt = BM.toTxt(set);
          if (mode === 'wrong') { const c = BM.complement(set); if (!c.length || BM.same(c, set)) return; txt = BM.toTxt(c); }
          setVal($('input', q), txt);
        } else if (it.type === 'tf') {
          it.stmts.forEach((s, i) => { const v = mode === 'wrong' && i === 0 ? !s.v : s.v; click($('[data-tf="' + i + ':' + (v ? 1 : 0) + '"]', q)); });
        } else if (it.type === 'err') {
          const pick = mode === 'wrong' ? (it.bad === 0 ? 1 : 0) : it.bad; click($('[data-e="' + pick + '"]', q));
        } else if (it.type === 'order') {
          if (mode === 'wrong') return;
          for (let i = 0; i < it.steps.length; i++) { click($('[data-ord-add="s' + i + '"]', q)); }
        }
        click($('[data-c="3"]', q));
        click($('[data-q="submit"]', q));
        await sleep(0);
        const msg = $('.err', q).textContent.trim();
        const good = !!$('.fbx.good', q), badFb = !!$('.fbx.bad', q);
        if (msg) bad.push(label + ': UI error "' + msg + '"');
        else if (mode === 'wrong') { wrongChecked++; if (good || !badFb) bad.push(label + ': wrong answer was NOT graded wrong'); }
        else if (!good) bad.push(label + ': correct answer was NOT graded correct' + (badFb ? ' (shown as wrong)' : ' (no feedback)'));
        n++;
      } catch (e) { bad.push(label + ': ' + e.message); }
    }
    for (const ref of refs) { await attempt(ref, 'right'); const it = BA.item(ref); if (it && (it.type === 'num' || it.type === 'interval')) await attempt(ref, 'right2'); await attempt(ref, 'wrong'); }
    return { course: courseId, questions: refs.length, attempts: n, wrongChecked, bad };
  }, courseId);
}

let failed = false;
for (const id of ['pertidaksamaan', 'contoh-kursus']) {
  const r = await solveCourse(id);
  console.log(`${id}: ${r.questions} questions → ${r.attempts} answers submitted (${r.wrongChecked} wrong-answer checks)`);
  if (r.bad.length) { failed = true; console.error('  PROBLEMS:\n   - ' + r.bad.slice(0, 40).join('\n   - ') + (r.bad.length > 40 ? '\n   … +' + (r.bad.length - 40) + ' more' : '')); }
}
const v = await p.evaluate(() => window.__csp); if (v.length) { failed = true; console.error('CSP violations:\n - ' + [...new Set(v)].join('\n - ')); }
if (problems.length) { failed = true; console.error('Browser errors:\n - ' + [...new Set(problems)].join('\n - ')); }
await b.close();
if (failed) { console.error('ANSWER FLOW FAILED'); process.exit(1); }
console.log('ANSWER FLOW OK: every question answered through the real UI under the CSP; no violations, no errors');
