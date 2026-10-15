// Uji Edge Function notify-report tanpa jaringan: fetch dipalsukan. Jalankan: node --experimental-strip-types tests/verify-notify.mjs
import { handle, buildMessage } from '../supabase/functions/notify-report/index.ts';
const fail = (m) => { console.error('GAGAL:', m); process.exit(1); };
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
const env = { SUPABASE_URL: 'https://p.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'svc', RESEND_API_KEY: 're', REPORT_EMAIL: 'admin@x.id', TELEGRAM_BOT_TOKEN: ' t\n', TELEGRAM_CHAT_ID: '9\n' };
const req = (body, method = 'POST') => new Request('https://f/notify-report', { method, body: body == null ? undefined : JSON.stringify(body) });

// 1) laporan baru → email & telegram terkirim, WA tidak diatur
row = { id: ID, user_id: 'u1', kind: 'soal', body: 'Kunci soal 3 salah, harusnya x > 2', contact: '0812', context: { course: 'pertidaksamaan', qid: 'b12', q: 'Selesaikan x+1>3', ua: 'Mozilla' }, notified_at: null };
let f = mkFetch(); let r = await (await handle(req({ id: ID }), env, f)).json();
if (!r.sent || r.channels.email !== 'terkirim' || r.channels.telegram !== 'terkirim' || r.channels.wa_callmebot !== 'tidak diatur') fail('kirim pertama: ' + JSON.stringify(r));
const mail = JSON.parse(calls.find(c => c.url.includes('resend')).init.body);
const tg = calls.find(c => c.url.includes('telegram')); if (!tg.url.endsWith('/bott/sendMessage') || JSON.parse(tg.init.body).chat_id !== '9') fail('secret tidak dirapikan: ' + tg.url);
if (!/Dika <dika@x.id>/.test(mail.text) || !/soal b12/.test(mail.text) || !mail.subject.includes('Soal atau kunci')) fail('isi email: ' + mail.text);
if (calls.find(c => c.url.includes('/rest/v1/reports')).init.method !== 'PATCH') fail('klaim harus PATCH');
console.log('kirim pertama OK →', JSON.stringify(r.channels));
// 2) dipanggil lagi → tidak dikirim dua kali
f = mkFetch(); r = await (await handle(req({ id: ID }), env, f)).json();
if (r.sent || calls.some(c => /resend|telegram/.test(c.url))) fail('terkirim dua kali'); console.log('panggilan ulang tidak mengirim lagi OK');
// 3) id tidak valid / metode salah / CORS
if ((await handle(req({ id: "1' or 1=1" }), env, mkFetch())).status !== 400) fail('id tidak valid harus 400');
if ((await handle(req(null, 'GET'), env, mkFetch())).status !== 405) fail('GET harus 405');
if ((await handle(new Request('https://f', { method: 'OPTIONS' }), env, mkFetch())).headers.get('Access-Control-Allow-Origin') !== '*') fail('CORS');
// 4) pengunjung tanpa akun, tanpa saluran sama sekali
row = { id: ID, user_id: null, kind: 'bug', body: 'Tombol tidak bisa ditekan', context: { errors: ['TypeError: x is null'] }, notified_at: null };
r = await (await handle(req({ id: ID }), { SUPABASE_URL: 'https://p', SUPABASE_SERVICE_ROLE_KEY: 's' }, mkFetch())).json();
if (!r.sent || Object.values(r.channels).some(v => v !== 'tidak diatur')) fail('tanpa saluran: ' + JSON.stringify(r));
const m = buildMessage(row, 'Pengunjung (belum masuk)', 'https://s');
if (!/Error terakhir: TypeError/.test(m.text)) fail('error terakhir tidak ikut');
// 5) error dari layanan: isi balasan ikut dicatat, token disensor
row = { id: ID, user_id: null, kind: 'bug', body: 'Tes gagal kirim', context: {}, notified_at: null };
const failFetch = async (url) => { url = String(url); if (url.includes('/rest/v1/reports')) { if (!row.notified_at) { row.notified_at = 'x'; return new Response(JSON.stringify([row])); } return new Response('[]'); }
  if (url.includes('telegram')) return new Response('{"ok":false,"description":"Bad Request: chat not found"}', { status: 400 });
  throw new Error('error sending request for url (' + url + ')'); };
const env2 = { SUPABASE_URL: 'https://p', SUPABASE_SERVICE_ROLE_KEY: 'svc-key-123', TELEGRAM_BOT_TOKEN: '999:SECRETTOKEN', TELEGRAM_CHAT_ID: '1', CALLMEBOT_PHONE: '62', CALLMEBOT_APIKEY: 'APIKEY777' };
r = await (await handle(req({ id: ID }), env2, failFetch)).json();
if (!/chat not found/.test(r.channels.telegram)) fail('isi error telegram: ' + r.channels.telegram);
if (/SECRETTOKEN|APIKEY777/.test(JSON.stringify(r))) fail('token bocor: ' + JSON.stringify(r));
console.log('error layanan tercatat & token disensor OK →', r.channels.wa_callmebot);
console.log('NOTIFIKASI LAPORAN LULUS');
