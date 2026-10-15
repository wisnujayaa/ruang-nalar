# Account emails & sign-in (activation, password reset, Google)

Supabase's default account emails are minimal and in English. `supabase/email-templates/` contains
Indonesian replacements that say what the email is, what to do with it, how long it's valid, and what to do
if you didn't ask for it.

## Why codes instead of links?
Activation and password-reset emails contain a **numeric code** and no links or images:
- Spam filters (Gmail etc.) are most suspicious of automated emails with a button + a link that redirects to
  another domain (`*.supabase.co` → `*.pages.dev`). That's a phishing pattern; we saw emails arrive and then get
  moved to Spam. Code-only emails rarely get flagged.
- School/office email scanners often "click" links before the user does, so the link is already used up. Codes aren't.
- A code can be read on a phone and typed on a laptop.

Links from older emails are still handled by the app.

## Installing the templates (~5 minutes)

Supabase Dashboard → **Authentication → Emails → Templates**. For each email type, replace the
**Subject** and paste the whole file into **Body**, then **Save**.

| Supabase type | Subject (copy exactly) | File |
|---|---|---|
| Confirm signup | `Kode aktivasi akun Ruang Nalar` | `confirm-signup.html` (code) |
| Reset password | `Kode atur ulang sandi Ruang Nalar` | `reset-password.html` (code) |
| Magic link | `Tautan masuk ke Ruang Nalar` | `magic-link.html` |
| Change email address | `Konfirmasi email baru akun Ruang Nalar` | `change-email.html` |
| Invite user | `Kamu diundang ke Ruang Nalar` | `invite.html` |

Variables such as `{{ .Token }}` (the code), `{{ .Email }}`, `{{ .ConfirmationURL }}`, `{{ .SiteURL }}` are filled in by Supabase; don't change them.
The code length is set in Authentication → Sign In / Providers → Email (**Email OTP Length**, default 6). The app accepts 6–10 digits.

How the app uses the codes:

| Situation | What the user sees |
|---|---|
| After sign-up | "Masukkan kode aktivasi" card → correct code → signed in → welcome page |
| Sign-in before activating | Clear message + "Masukkan kode aktivasi" button |
| Forgot password | "Masukkan kode atur ulang" card → new-password form |
| Tab closed | "Sudah punya kode … dari email?" link on the sign-in page |
| Old link expired / already used | Explanation page with a resend button |

## Required: URL Configuration

Authentication → **URL Configuration**:
- **Site URL**: `https://ruang-nalar.pages.dev` (no trailing slash)
- **Redirect URLs**: `https://ruang-nalar.pages.dev/**`

The app asks Supabase to redirect to the address currently open (`emailRedirectTo`), and that address must be listed.
**Only list addresses you own.** If you stop using a host (e.g. an old `*.netlify.app` site), remove it here and in
Google Cloud: someone else could claim that subdomain and receive your users' login tokens.

## Recommended (Authentication → Sign In / Providers)
- **Minimum password length: 8** (the app already requires 8).
- **Leaked password protection** rejects known-breached passwords, but it's only available on the **Pro** plan.
  On the free plan the Security Advisor warning about it is expected.
- *Email OTP Expiration* defaults to 1 hour, and the email text says "about 1 hour". If you change it, update both templates.

## Email sender (IMPORTANT before students use it)
Supabase's built-in sender is for testing only. According to the Supabase docs it:
- **may only deliver to members of the project's team** (Organization → Team); other addresses can fail with
  *"Email address not authorized"*, so students couldn't activate their accounts;
- is limited to a few emails **per hour** for the whole project;
- has no delivery guarantee.

Free option without a domain: **Gmail SMTP** (~500 emails/day).
1. Use an existing Gmail account, or a dedicated one if you don't want your personal address visible as the sender
   (the sender name still shows "Ruang Nalar").
2. Turn on **2-Step Verification**, then create an **App Password** at https://myaccount.google.com/apppasswords
   (16 letters). Paste it only into Supabase; never commit it.
3. Supabase → Authentication → Emails → **SMTP Settings** → Enable custom SMTP:
   - Sender email: that Gmail address · Sender name: `Ruang Nalar`
   - Host: `smtp.gmail.com` · Port: `587` · Username: that Gmail address · Password: the App Password
4. Authentication → **Rate Limits**: raise the email limit (e.g. 30/hour) once SMTP is on.
5. Test by signing up with an address that isn't on the Supabase team.

With your own domain later, switch to Resend/Brevo with a verified domain (SPF/DKIM) for the best deliverability.

## Sign in with Google (no confirmation email at all)
Google accounts are already verified, so Google users **receive no email at all**.
The "Masuk dengan Google" button appears automatically on the sign-in/sign-up pages once the Google provider is
enabled in Supabase (the app reads `/auth/v1/settings`). No billing or free trial is needed; ignore Google Cloud's
"Start free" banners.

1. https://console.cloud.google.com/auth/overview (Google Auth Platform) → create a project (e.g. "Ruang Nalar") → **Get started**:
   app name "Ruang Nalar", support email, audience **External**, contact email → Create.
2. **Clients → Create client** → *Web application*:
   - Authorized JavaScript origins: `https://ruang-nalar.pages.dev`
   - Authorized redirect URIs: the **Callback URL** shown in Supabase → Authentication → Sign In / Providers → Google
     (`https://<project-ref>.supabase.co/auth/v1/callback`)
   - Leave "Use this client for an AI-powered agent" unchecked.
   - Copy the **Client secret** right away: Google shows it only once. If you lose it, open the client and use **Add secret**.
3. **Branding**: app name, support email, home page `https://ruang-nalar.pages.dev`, privacy policy
   `https://ruang-nalar.pages.dev/privasi.html`, authorized domain `ruang-nalar.pages.dev`.
   Leave the **logo empty**: uploading one triggers a brand verification that can take days.
4. **Audience → Publish app** so the status is *In production* (in *Testing* only listed test users can sign in).
   The basic scopes (email, profile, openid) need no Google verification and have no user cap.
5. Paste the **Client ID** and **Client secret** into Supabase → Authentication → Sign In / Providers → **Google** → Enable → Save.
6. Test in a private window: Masuk → "Masuk dengan Google". New Google users land on the welcome page.

If someone already has an unconfirmed email + password account with the same address, delete that account
in Supabase → Authentication → Users first, so Google creates a clean one.
