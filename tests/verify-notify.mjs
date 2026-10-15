// Tests the notify-report Edge Function offline: fetch is faked. Run: node --experimental-strip-types tests/verify-notify.mjs
import { handle, buildMessage } from '../supabase/functions/notify-report/index.ts';
const fail = (m) => { console.error('FAILED:', m); process.exit(1); };
const ID = '11111111-2222-3333-4444-555555555555';
let row, calls;
function mkFetch(resend) {
  calls = [];
  return async (url, init = {}) => {
    url = String(url); calls.push({ url, init });
    const ok = (o) => new Response(JSON.stringify(o), { status: 200 });
    if (url.includes('/rest/v1/reports')) { if (row && !row.notified_at) { row.notified_at = 'x'; return ok([row]); } return ok([]); }
    if (url.includes('/rest/v1/profiles')) return ok([{ display_name: 'Dika' }]);
    if (url.includes('/auth/v1/admin/users/')) return ok({ email: 'dika@x.id' });
    if (url.includes('resend') && resend) return resend(url, init);
    return new Response('{}', { status: 200 });
  };
}
const env = { SUPABASE_URL: 'https://p.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'svc', RESEND_API_KEY: ' re_key\n', REPORT_EMAIL: 'admin@x.id\n' };
const req = (body, method = 'POST') => new Request('https://f/notify-report', { method, body: body == null ? undefined : JSON.stringify(body) });

// 1) new report → email sent with context, secrets trimmed
row = { id: ID, user_id: 'u1', kind: 'soal', body: 'Kunci soal 3 salah, harusnya x > 2', contact: '0812', context: { course: 'pertidaksamaan', qid: 'b12', q: 'Selesaikan x+1>3', ua: 'Mozilla' }, notified_at: null };
let r = await (await handle(req({ id: ID }), env, mkFetch())).json();
if (!r.sent || r.channels.email !== 'sent') fail('first send: ' + JSON.stringify(r));
const call = calls.find(c => c.url.includes('resend')); const mail = JSON.parse(call.init.body);
if (call.init.headers.Authorization !== 'Bearer re_key' || mail.to[0] !== 'admin@x.id') fail('secrets not trimmed');
if (!/Dika <dika@x.id>/.test(mail.text) || !/soal b12/.test(mail.text) || !mail.subject.includes('Soal atau kunci')) fail('email body: ' + mail.text);
if (calls.find(c => c.url.includes('/rest/v1/reports')).init.method !== 'PATCH') fail('claim must use PATCH');
console.log('first send OK →', JSON.stringify(r.channels));
// 2) called again → not sent twice
r = await (await handle(req({ id: ID }), env, mkFetch())).json();
if (r.sent || calls.some(c => /resend/.test(c.url))) fail('sent twice'); console.log('repeat call does not resend OK');
// 3) invalid id / wrong method / CORS
if ((await handle(req({ id: "1' or 1=1" }), env, mkFetch())).status !== 400) fail('invalid id must be 400');
if ((await handle(req(null, 'GET'), env, mkFetch())).status !== 405) fail('GET must be 405');
if ((await handle(new Request('https://f', { method: 'OPTIONS' }), env, mkFetch())).headers.get('Access-Control-Allow-Origin') !== '*') fail('CORS');
// 4) anonymous visitor, email not configured → processed, nothing sent
row = { id: ID, user_id: null, kind: 'bug', body: 'Tombol tidak bisa ditekan', context: { errors: ['TypeError: x is null'] }, notified_at: null };
r = await (await handle(req({ id: ID }), { SUPABASE_URL: 'https://p', SUPABASE_SERVICE_ROLE_KEY: 's' }, mkFetch())).json();
if (!r.sent || r.channels.email !== 'not configured' || calls.some(c => /resend/.test(c.url))) fail('not configured: ' + JSON.stringify(r));
const m = buildMessage(row, 'Pengunjung (belum masuk)', 'https://s');
if (!/Error terakhir: TypeError/.test(m.text)) fail('recent errors missing from message');
// 5) provider error: response body is logged, keys redacted
row = { id: ID, user_id: null, kind: 'bug', body: 'Tes gagal kirim', context: {}, notified_at: null };
r = await (await handle(req({ id: ID }), { SUPABASE_URL: 'https://p', SUPABASE_SERVICE_ROLE_KEY: 'svc-key-123', RESEND_API_KEY: 'SECRETKEY777', REPORT_EMAIL: 'a@x.id' },
  mkFetch(() => new Response('{"message":"invalid key SECRETKEY777"}', { status: 401 })))).json();
if (!/failed 401/.test(r.channels.email)) fail('provider error body: ' + r.channels.email);
if (/SECRETKEY777/.test(JSON.stringify(r))) fail('key leaked: ' + JSON.stringify(r));
console.log('provider error logged & key redacted OK →', r.channels.email);
console.log('REPORT NOTIFICATIONS PASSED');
