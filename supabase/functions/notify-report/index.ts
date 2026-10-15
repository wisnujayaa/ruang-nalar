// Ruang Nalar — email the admin about a new problem report (via Resend).
// Called by the browser after a report is saved: supabase.functions.invoke('notify-report', { body: { id } }).
// Safe to call repeatedly: each report is processed only ONCE (notified_at is claimed atomically),
// and only reports younger than 10 minutes are processed.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY, REPORT_EMAIL   required for the email to be sent
//   REPORT_EMAIL_FROM              optional sender (needs a domain verified in Resend)
//   SITE_URL                       optional site address for the link (default https://ruang-nalar.pages.dev)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by Supabase.
// The email text is in Indonesian because it goes to the (Indonesian) site admin.

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

// Hide secret values from error messages/logs
const SECRET_KEYS = ['RESEND_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
export function redact(env: Env, msg: string) {
  let m = String(msg);
  for (const v of SECRET_KEYS.map(k => env[k])) { if (v && v.length >= 6) m = m.split(v).join('***'); }
  return m.slice(0, 300);
}

async function sendEmail(env: Env, f: Fetch, subject: string, text: string): Promise<string> {
  if (!(env.RESEND_API_KEY && env.REPORT_EMAIL)) return 'not configured';
  try {
    const r = await f('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.REPORT_EMAIL_FROM || 'Ruang Nalar <onboarding@resend.dev>', to: [env.REPORT_EMAIL], subject, text }),
    });
    if (r.ok) return 'sent';
    let body = ''; try { body = await r.text(); } catch (_) { /* ignore */ }
    return redact(env, 'failed ' + r.status + (body ? ': ' + body.slice(0, 200) : ''));
  } catch (e) { return redact(env, 'failed: ' + (e as Error).message); }
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
  const email = await sendEmail(env, f, subject, text);
  console.log('notify-report', id.slice(0, 8), 'email:', email);   // visible in Supabase → Edge Functions → Logs
  // sent = the report was claimed and processed (even if email isn't configured)
  return json({ ok: true, sent: true, channels: { email } });
}

// On Supabase (Deno) start the server; under Node (tests) this is skipped
const D = (globalThis as any).Deno;
if (D && D.serve) D.serve((req: Request) => handle(req, D.env.toObject()));
