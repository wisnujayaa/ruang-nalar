# Problem reports → email / WhatsApp / Telegram

Users can report problems from three places:
- **Akun → Laporkan kendala** (Account → Report a problem), for bugs, suggestions, or anything else;
- the **"Soal, kunci, atau pembahasan ini salah? Laporkan"** button under every answered question;
- the **"Ada yang salah di materi ini? Laporkan"** button under every lesson subsection.

Reports automatically carry context: course, section, question id, question text, page, device, and
(bug reports only) the last few error messages. Reporters can see this before sending.

## Data flow

```
Browser ──insert──▶ reports table (RLS)                          ← main inbox: Akun → Laporan masuk
   └──invoke──▶ Edge Function notify-report ──▶ admin email / WhatsApp / Telegram
```

- Anyone may report, including signed-out visitors. Limits: 10 reports/hour per account,
  and 20 reports/hour across all anonymous visitors.
- Reporters only see their own reports. Admins see everything, change the status
  (baru → diproses → selesai, i.e. new → in progress → done), and write a reply the reporter can see.
- Each report is sent to the admin **at most once**: the `notified_at` column is claimed atomically.
- SQL: `supabase/reports.sql` · Function: `supabase/functions/notify-report/index.ts` · Tests: `supabase/test-rls-reports.sql`, `tests/verify-notify.mjs`.

The notification text itself is in Indonesian (it goes to the site admin).

## Enabling notifications

Deploy the function, then set **secrets** in the Supabase Dashboard →
**Edge Functions → Secrets**. Channels with empty secrets are skipped. Set up one or more:

### Email (Resend, free 100 emails/day), recommended
1. Sign up at resend.com **with the email address that should receive reports**. Without your own domain,
   Resend only lets you send to your own account address, which is all that's needed here.
2. API Keys → Create API key, and copy it.
3. Create the secrets `RESEND_API_KEY` = that key and `REPORT_EMAIL` = your email.

### WhatsApp: CallMeBot (free, to your own number only)
1. Open the "Free API WhatsApp" page on callmebot.com from your phone and save the bot number listed there.
2. Send `I allow callmebot to send me messages` to that bot. It replies with an **apikey**.
   (The free bots are sometimes full and stop accepting new users.)
3. Create the secrets `CALLMEBOT_PHONE` = your number with country code (e.g. `62812xxxx`) and `CALLMEBOT_APIKEY`.

### WhatsApp: Fonnte (Indonesian service; the free plan adds a "sent via fonnte" label)
1. Sign up at fonnte.com, connect a WhatsApp number as the sender, and copy its device **token**.
2. Create the secrets `FONNTE_TOKEN` = token and `REPORT_WA` = the recipient number (e.g. `62812xxxx`).

### Telegram (free)
1. Chat with @BotFather → `/newbot` → copy the bot token. Never paste it anywhere public.
2. Send any message to your new bot, open `https://api.telegram.org/bot<TOKEN>/getUpdates`,
   and note the numeric `chat.id`.
3. Create the secrets `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.

Optional: `SITE_URL` (the link in messages; default `https://ruang-nalar.pages.dev`) and `REPORT_EMAIL_FROM` (the sender, if you have your own domain).

### No service at all: the "Send via WhatsApp" button
Set `reportWhatsApp: '62812xxxx'` in `config.js`. After sending a report, users see a button that
opens their WhatsApp with a ready-to-send message to that number.
Note: the number in `config.js` is **public** to anyone who views the site's source.

## Checking
Send a test report from the site, then open Supabase → Edge Functions → notify-report → **Logs**.
Each call logs the status of every channel, e.g. `{"email":"sent","wa_callmebot":"not configured"}`.
The same status appears in the reporter's browser console (`Notifikasi laporan: …`).
