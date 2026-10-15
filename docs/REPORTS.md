# Problem reports → admin email

Users can report problems from three places:
- **Akun → Laporkan kendala** (Account → Report a problem), for bugs, suggestions, or anything else;
- the **"Soal, kunci, atau pembahasan ini salah? Laporkan"** button under every answered question;
- the **"Ada yang salah di materi ini? Laporkan"** button under every lesson subsection.

Reports automatically carry context: course, section, question id, question text, page, device, and
(bug reports only) the last few error messages. Reporters can see this before sending.

## Data flow

```
Browser ──insert──▶ reports table (RLS)                    ← main inbox: Akun → Laporan masuk
   └──invoke──▶ Edge Function notify-report ──▶ admin email (Resend)
```

- Anyone may report, including signed-out visitors. Limits: 10 reports/hour per account,
  and 20 reports/hour across all anonymous visitors.
- Reporters only see their own reports. Admins see everything, change the status
  (baru → diproses → selesai, i.e. new → in progress → done), and write a reply the reporter can see.
- Each report is processed **at most once**: the `notified_at` column is claimed atomically.
- SQL: `supabase/reports.sql` · Function: `supabase/functions/notify-report/index.ts` · Tests: `supabase/test-rls-reports.sql`, `tests/verify-notify.mjs`.

The email itself is in Indonesian (it goes to the site admin).

## Enabling email notifications (Resend, free 100 emails/day)

1. Sign up at resend.com **with the email address that should receive reports**. Without your own domain,
   Resend only lets you send to your own account address, which is all that's needed here.
2. API Keys → Create API key, and copy it.
3. In Supabase → **Edge Functions → Secrets**, create `RESEND_API_KEY` = that key and `REPORT_EMAIL` = your email.

Optional secrets: `SITE_URL` (the link in the email; default `https://ruang-nalar.pages.dev`) and
`REPORT_EMAIL_FROM` (a custom sender, once you have a domain verified in Resend).

Without these secrets reports still work; they just wait in the admin inbox on the site.

## Checking
Send a test report from the site, then open Supabase → Edge Functions → notify-report → **Logs**.
Each call logs the email status, e.g. `email: sent` or `email: not configured`.
The same status appears in the reporter's browser console (`Notifikasi laporan: …`).
