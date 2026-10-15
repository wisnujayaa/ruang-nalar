// Tests the notify-report Edge Function offline: fetch is faked. Run: node --experimental-strip-types tests/verify-notify.mjs
import { handle, buildMessage } from '../supabase/functions/notify-report/index.ts';
const fail = (m) => { console.error('FAILED:', m); process.exit(1); };
const ID = '11111111-2222-3333-4444-555555555555';
let row, calls;
function mkFetch() {
  calls = [];
  return async (url, init = {}) => {
    url = String(url); calls.push({ url, init });
    const ok = (o) => new Response(JSON.stringify(o), { status: 200 });
    if (url.includes('/rest/v1/reports')) { if (row && !row.notified_at) { row.notified_at = 'x'; return ok([row]); } return ok([]); }
    if (url.includes('/rest/v1/profiles')) return ok([{ display_name: 'Dika' }]);
    if (url.includes('/auth/v1/admin/users/')) return ok({ email: 'dika@x.id' });
    return new Response('{}', { status: 200 });
  };
}
const env = { SUPABASE_URL: 'https://p.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'svc', RESEND_API_KEY: 're', REPORT_EMAIL: 'admin@x.id', TELEGRAM_BOT_TOKEN: ' "bot1234567890:AAHabcdefghijklmnopqrstuvwxyz12345"\n', TELEGRAM_CHAT_ID: '9123\n' };
const req = (body, method = 'POST') => new Request('https://f/notify-report', { method, body: body == null ? undefined : JSON.stringify(body) });

// 1) new report → email & telegram sent, WhatsApp not configured
row = { id: ID, user_id: 'u1', kind: 'soal', body: 'Kunci soal 3 salah, harusnya x > 2', contact: '0812', context: { course: 'pertidaksamaan', qid: 'b12', q: 'Selesaikan x+1>3', ua: 'Mozilla' }, notified_at: null };
let f = mkFetch(); let r = await (await handle(req({ id: ID }), env, f)).json();
if (!r.sent || r.channels.email !== 'sent' || r.channels.telegram !== 'sent' || r.channels.wa_callmebot !== 'not configured') fail('first send: ' + JSON.stringify(r));
const mail = JSON.parse(calls.find(c => c.url.includes('resend')).init.body);
const tg = calls.find(c => c.url.includes('telegram')); if (!tg.url.endsWith('/bot1234567890:AAHabcdefghijklmnopqrstuvwxyz12345/sendMessage') || JSON.parse(tg.init.body).chat_id !== '9123') fail('secret not trimmed: ' + tg.url);
if (!/Dika <dika@x.id>/.test(mail.text) || !/soal b12/.test(mail.text) || !mail.subject.includes('Soal atau kunci')) fail('email body: ' + mail.text);
if (calls.find(c => c.url.includes('/rest/v1/reports')).init.method !== 'PATCH') fail('claim must use PATCH');
console.log('first send OK →', JSON.stringify(r.channels));
// 2) called again → not sent twice
f = mkFetch(); r = await (await handle(req({ id: ID }), env, f)).json();
if (r.sent || calls.some(c => /resend|telegram/.test(c.url))) fail('sent twice'); console.log('repeat call does not resend OK');
// 3) invalid id / wrong method / CORS
if ((await handle(req({ id: "1' or 1=1" }), env, mkFetch())).status !== 400) fail('invalid id must be 400');
if ((await handle(req(null, 'GET'), env, mkFetch())).status !== 405) fail('GET must be 405');
if ((await handle(new Request('https://f', { method: 'OPTIONS' }), env, mkFetch())).headers.get('Access-Control-Allow-Origin') !== '*') fail('CORS');
// 4) anonymous visitor, no channels configured at all
row = { id: ID, user_id: null, kind: 'bug', body: 'Tombol tidak bisa ditekan', context: { errors: ['TypeError: x is null'] }, notified_at: null };
r = await (await handle(req({ id: ID }), { SUPABASE_URL: 'https://p', SUPABASE_SERVICE_ROLE_KEY: 's' }, mkFetch())).json();
if (!r.sent || Object.values(r.channels).some(v => v !== 'not configured')) fail('no channels: ' + JSON.stringify(r));
const m = buildMessage(row, 'Pengunjung (belum masuk)', 'https://s');
if (!/Error terakhir: TypeError/.test(m.text)) fail('recent errors missing from message');
// 5) provider errors: response body is logged, tokens redacted
row = { id: ID, user_id: null, kind: 'bug', body: 'Tes gagal kirim', context: {}, notified_at: null };
const failFetch = async (url) => { url = String(url); if (url.includes('/rest/v1/reports')) { if (!row.notified_at) { row.notified_at = 'x'; return new Response(JSON.stringify([row])); } return new Response('[]'); }
  if (url.includes('telegram')) return new Response('{"ok":false,"description":"Bad Request: chat not found"}', { status: 400 });
  throw new Error('error sending request for url (' + url + ')'); };
const env2 = { SUPABASE_URL: 'https://p', SUPABASE_SERVICE_ROLE_KEY: 'svc-key-123', TELEGRAM_BOT_TOKEN: '999999999:SECRETTOKENabcdefghijklmnopqrstuvwxyz', TELEGRAM_CHAT_ID: '1234', CALLMEBOT_PHONE: '62', CALLMEBOT_APIKEY: 'APIKEY777' };
r = await (await handle(req({ id: ID }), env2, failFetch)).json();
if (!/chat not found/.test(r.channels.telegram)) fail('telegram error body: ' + r.channels.telegram);
if (/SECRETTOKEN|APIKEY777/.test(JSON.stringify(r))) fail('token leaked: ' + JSON.stringify(r));
console.log('provider error logged & token redacted OK →', r.channels.wa_callmebot);
// 6) malformed token / username chat id → diagnostic message, Telegram not called
const { telegramToken } = await import('../supabase/functions/notify-report/index.ts');
if (telegramToken('@ruangnalar_bot').ok || !/NO colon/.test(telegramToken('@ruangnalar_bot').hint)) fail('token diagnosis');
row = { id: ID, user_id: null, kind: 'bug', body: 'Tes token', context: {}, notified_at: null };
let tgCalled = false; const f3 = async (url) => { url = String(url); if (url.includes('telegram')) tgCalled = true; if (url.includes('/rest/v1/reports')) { if (!row.notified_at) { row.notified_at = 'x'; return new Response(JSON.stringify([row])); } return new Response('[]'); } return new Response('{}'); };
r = await (await handle(req({ id: ID }), { SUPABASE_URL: 'https://p', SUPABASE_SERVICE_ROLE_KEY: 's', TELEGRAM_BOT_TOKEN: '1234567890:AAHabcdefghijklmnopqrstuvwxyz12345', TELEGRAM_CHAT_ID: '@wisnu' }, f3)).json();
if (tgCalled || !/must be numeric/.test(r.channels.telegram)) fail('username chat id: ' + JSON.stringify(r));
console.log('token & chat id diagnosis OK');
console.log('REPORT NOTIFICATIONS PASSED');
