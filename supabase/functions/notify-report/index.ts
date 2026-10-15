// Ruang Nalar — notify the admin about a new problem report by email / WhatsApp / Telegram.
// Called by the browser after a report is saved: supabase.functions.invoke('notify-report', { body: { id } }).
// Safe to call repeatedly: each report is sent only ONCE (notified_at is claimed atomically),
// and only reports younger than 10 minutes are processed.
//
// A channel is active when its secrets are set (Supabase → Edge Functions → Secrets):
//   Email (Resend)       : RESEND_API_KEY, REPORT_EMAIL, [REPORT_EMAIL_FROM]
//   WhatsApp (CallMeBot) : CALLMEBOT_PHONE, CALLMEBOT_APIKEY
//   WhatsApp (Fonnte)    : FONNTE_TOKEN, REPORT_WA
//   Telegram             : TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
//   [SITE_URL]           : site address used in message links (default https://ruang-nalar.pages.dev)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by Supabase.
// Message text is in Indonesian because it goes to the (Indonesian) site admin.

type Env = Record<string, string | undefined>;
type Fetch = typeof fetch;

const KIND: Record<string, string> = {
  bug: 'Bug / error',
  soal: 'Soal atau kunci jawaban salah',
  materi: 'Materi / pembahasan salah',
  saran: 'Saran',
  lain: 'Lainnya',
};
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const cut = (s: unknown, n: number) => { const t = String(s ?? ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

export function buildMessage(r: Record<string, any>, who: string, site: string) {
  const c = (r.context && typeof r.context === 'object') ? r.context : {};
  const lines = [
    `Laporan baru di Ruang Nalar: ${KIND[r.kind] || r.kind}`,
    '',
    cut(r.body, 1500),
    '',
    `Dari: ${who}`,
  ];
  if (r.contact) lines.push(`Kontak: ${cut(r.contact, 120)}`);
  const where = [c.course && `kursus ${c.course}`, c.sec && `bagian ${c.sec}`, c.qid && `soal ${c.qid}`, c.view && `halaman ${c.view}`].filter(Boolean).join(', ');
  if (where) lines.push(`Lokasi: ${cut(where, 200)}`);
  if (c.q) lines.push(`Teks soal: ${cut(c.q, 300)}`);
  if (Array.isArray(c.errors) && c.errors.length) lines.push(`Error terakhir: ${cut(c.errors.join(' | '), 400)}`);
  if (c.ua) lines.push(`Perangkat: ${cut(c.ua, 160)}`);
  lines.push('', `Kelola: ${site}  (Akun → Laporan masuk)`);
  const subject = `[Ruang Nalar] ${KIND[r.kind] || 'Laporan'}: ${cut(String(r.body).replace(/\s+/g, ' '), 60)}`;
  return { subject, text: lines.join('\n') };
}

// Hide secret values from error messages/logs (Telegram & CallMeBot URLs contain the token/apikey)
const SECRET_KEYS = ['RESEND_API_KEY', 'CALLMEBOT_APIKEY', 'FONNTE_TOKEN', 'TELEGRAM_BOT_TOKEN', 'SUPABASE_SERVICE_ROLE_KEY'];
export function redact(env: Env, msg: string) {
  let m = String(msg);
  const vals = SECRET_KEYS.map(k => env[k]).concat([telegramToken(env.TELEGRAM_BOT_TOKEN).token]);
  for (const v of vals) { if (v && v.length >= 6) m = m.split(v).join('***').split(encodeURIComponent(v)).join('***'); }
  return m.slice(0, 300);
}

/* A valid Telegram bot token looks like "digits:random", e.g. 1234567890:AAH... (about 46 chars).
   Fix common paste mistakes (quotes, a "bot" prefix), then describe the shape if it still doesn't match — without revealing it. */
export function telegramToken(raw: string | undefined) {
  const t = String(raw || '').replace(/^["'`\s]+|["'`\s]+$/g, '').replace(/^bot(?=\d)/i, '');
  if (/^\d{6,}:[A-Za-z0-9_-]{30,}$/.test(t)) return { ok: true, token: t, hint: '' };
  const hint = `token format does not match (length ${t.length}, ` + (t.includes(':') ? 'has a colon' : 'NO colon') + ', ' + (/^\d/.test(t) ? 'starts with a digit' : 'does NOT start with a digit') + (/\s/.test(t) ? ', contains a space' : '') + '). Copy it again from @BotFather: /mybots → pick the bot → API Token';
  return { ok: false, token: t, hint };
}

async function sendAll(env: Env, f: Fetch, subject: string, text: string) {
  const out: Record<string, string> = {};
  const tryIt = async (name: string, ok: boolean, run: () => Promise<Response>) => {
    if (!ok) { out[name] = 'not configured'; return; }
    try {
      const r = await run();
      if (r.ok) out[name] = 'sent';
      else { let body = ''; try { body = await r.text(); } catch (_) { /* ignore */ } out[name] = redact(env, 'failed ' + r.status + (body ? ': ' + body.slice(0, 200) : '')); }
    } catch (e) { out[name] = redact(env, 'failed: ' + (e as Error).message); }
  };
  await Promise.all([
    tryIt('email', !!(env.RESEND_API_KEY && env.REPORT_EMAIL), () => f('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.REPORT_EMAIL_FROM || 'Ruang Nalar <onboarding@resend.dev>', to: [env.REPORT_EMAIL], subject, text }),
    })),
    tryIt('wa_callmebot', !!(env.CALLMEBOT_PHONE && env.CALLMEBOT_APIKEY), () => f('https://api.callmebot.com/whatsapp.php?' + new URLSearchParams({
      phone: env.CALLMEBOT_PHONE!, apikey: env.CALLMEBOT_APIKEY!, text: cut(text, 1500),
    }))),
    tryIt('wa_fonnte', !!(env.FONNTE_TOKEN && env.REPORT_WA), () => f('https://api.fonnte.com/send', {
      method: 'POST', headers: { Authorization: env.FONNTE_TOKEN! }, body: new URLSearchParams({ target: env.REPORT_WA!, message: text }),
    })),
    (async () => {
      if (!(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID)) { out.telegram = 'not configured'; return; }
      const tk = telegramToken(env.TELEGRAM_BOT_TOKEN);
      if (!tk.ok) { out.telegram = 'failed: ' + tk.hint; return; }
      if (!/^-?\d{3,}$/.test(env.TELEGRAM_CHAT_ID!)) { out.telegram = 'failed: TELEGRAM_CHAT_ID must be numeric (from @userinfobot), not a username'; return; }
      await tryIt('telegram', true, () => f(`https://api.telegram.org/bot${tk.token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: cut(text, 4000), disable_web_page_preview: true }),
      }));
    })(),
  ]);
  return out;
}

export async function handle(req: Request, rawEnv: Env, f: Fetch = fetch): Promise<Response> {
  // Pasted secrets often carry trailing spaces/newlines; trim them first
  const env: Env = {}; for (const [k, v] of Object.entries(rawEnv)) env[k] = typeof v === 'string' ? v.trim() : v;
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);
  let id = '';
  try { id = String((await req.json()).id || ''); } catch (_) { /* empty body */ }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return json({ error: 'invalid id' }, 400);
  const base = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return json({ error: 'Server not configured' }, 500);
  const H = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

  // Claim the report: succeeds only once, and only for recent reports
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const claim = await f(`${base}/rest/v1/reports?id=eq.${id}&notified_at=is.null&created_at=gte.${encodeURIComponent(since)}`, {
    method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify({ notified_at: new Date().toISOString() }),
  });
  if (!claim.ok) return json({ error: 'Could not read the report' }, 500);
  const rows = await claim.json();
  const r = Array.isArray(rows) ? rows[0] : null;
  if (!r) return json({ ok: true, sent: false, reason: 'already sent or not found' });

  let who = 'Pengunjung (belum masuk)';
  if (r.user_id) {
    let name = '', email = '';
    try { const p = await f(`${base}/rest/v1/profiles?id=eq.${r.user_id}&select=display_name`, { headers: H }); const a = await p.json(); name = (a[0] && a[0].display_name) || ''; } catch (_) { /* ignore */ }
    try { const u = await f(`${base}/auth/v1/admin/users/${r.user_id}`, { headers: H }); if (u.ok) email = (await u.json()).email || ''; } catch (_) { /* ignore */ }
    who = [name, email && `<${email}>`].filter(Boolean).join(' ') || r.user_id;
  }
  const { subject, text } = buildMessage(r, who, env.SITE_URL || 'https://ruang-nalar.pages.dev');
  const channels = await sendAll(env, f, subject, text);
  console.log('notify-report', id.slice(0, 8), JSON.stringify(channels));   // visible in Supabase → Edge Functions → Logs
  return json({ ok: true, sent: true, channels });
}

// On Supabase (Deno) start the server; under Node (tests) this is skipped
const D = (globalThis as any).Deno;
if (D && D.serve) D.serve((req: Request) => handle(req, D.env.toObject()));
