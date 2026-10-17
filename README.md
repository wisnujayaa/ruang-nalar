# Ruang Nalar

An open-source e-learning platform for learning things **down to their roots**: lessons that start from intuition, interactive widgets, graded practice up to university-entrance and olympiad level, spaced repetition, flashcards, plus **classes, assignments, and discussion forums**.

**Live site:** https://ruang-nalar.pages.dev

The first course is **Pertidaksamaan** (inequalities): from Indonesian high-school grade 10 to UTBK (the national university entrance test) to olympiad/college level. More courses can be added as new folders without touching the core code.

> The app's interface and course content are in **Indonesian**, because the learners are Indonesian. The code, comments, docs, and tests are in English.

> Pure static site: plain HTML + CSS + JavaScript, **no build step**. It runs on any static host; the live site uses Cloudflare Pages.

## Features

**For students**
- Lessons per section: intuition → formal explanation → worked examples (steps revealed one at a time) → common traps → practice → exit ticket
- 25+ interactive widgets with "predict before you try"
- 250+ hand-written questions + 25 random question generators, 6 levels (mechanics → olympiad), school / UTBK / entrance-exam / olympiad modes, cross-chapter questions
- 6 question types: multiple choice, interval answers (with a number-line preview), numeric, true/false, find-the-wrong-step, **order the proof steps**
- Automatic diagnosis of wrong interval answers ("try x = 4: this point satisfies the question but isn't in your answer")
- Daily spaced review, flashcards, mistake notebook, trap radar, 5-second checks, confidence ratings, brain dumps, timed tryouts
- **Stats dashboard**: mastery ring, daily streak, activity calendar, strongest/weakest concepts, accuracy per level
- **Help center** (`#bantuan`): 38 searchable articles, an 8-step guided tour, a welcome card for new users
- **Report a problem** from any question or lesson (bugs, wrong keys, wrong explanations); the admin is notified by email via an Edge Function
- Accounts: **sign in with Google**, or email + password with a **6-digit activation code** (no fragile links), password reset by code, change password, welcome page
- Installable as an app (PWA), offline banner, per-page titles, WCAG AA color contrast

**For teachers / tutors**
- Classes with a join code and invite link (`#gabung=CODE`)
- Assignments with due dates; **per-student status is computed from progress** (students never press "done")
- Per-class discussion forum: threads, replies, `$…$` math, pinning, mark as answered, moderation
- Per-student and per-class reports: weakest concepts, most common traps, wrong-but-confident answers, recent activity
- Messages to one student or the whole class, linkable straight to a lesson or practice set
- **Course Studio** (teacher accounts): build a course with forms (lessons, worked examples, 6 question types with preview, flashcards, traps, graph / number-line / Desmos / GeoGebra / PhET / YouTube widgets), publish as draft, **class-only** (locked to your classes' members), unlisted, or public. No code needed
- **Roles**: student, teacher, admin. Admins promote teachers on the *Manage users* page

**Security**
- Row Level Security on every table, least-privilege column grants, size limits, class-code attempt limits (`supabase/hardening.sql`)
- Strict Content Security Policy via `_headers`: no inline scripts, no third-party scripts
- All progress from the server or progress codes passes through a sanitizer (`BA.sanitize`) before use, so student data can't inject scripts into a teacher's screen
- Supabase email templates (code-only, in Indonesian) in `supabase/email-templates/` (guide: [docs/EMAIL.md](docs/EMAIL.md))

## Two storage modes

| Mode | When | Accounts | Classes & forums |
|---|---|---|---|
| **Serverless** | `config.js` empty (default) | – | Only in that browser (good for trying it out; teachers can follow students via *progress codes*) |
| **Supabase** | `config.js` has the URL & anon key | Google, or email + password | Online, multi-device, protected by Row Level Security |

## Quick start

```bash
git clone https://github.com/wisnujayaa/ruang-nalar.git
cd ruang-nalar
python3 -m http.server 8765      # or: npm run serve
# open http://localhost:8765
```

It must be served (not opened as a `file://`), because courses are loaded dynamically.

## Deploy (Cloudflare Pages, free)

1. dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git** → pick this repo.
   (If the dashboard offers a *Worker* first, use the "Looking to deploy Pages?" link.)
2. Production branch `main` · Framework preset **None** · Build command **empty** · Build output directory `/`.
3. Environment variable `SKIP_DEPENDENCY_INSTALL` = `true` (Playwright is only for local tests).
4. **Save and Deploy**. Every push to `main` is published automatically, and `_headers` (CSP & security headers) applies as is.
5. When the site address changes, update **Supabase → Authentication → URL Configuration** (Site URL + Redirect URLs)
   and, if you use Google sign-in, the **Authorized JavaScript origins** in Google Cloud (see [docs/EMAIL.md](docs/EMAIL.md)).

## Enable accounts, online classes, and forums (Supabase, free)

In short: create a Supabase project → run `supabase/schema.sql`, `courses.sql`, `roles.sql`, `course-access.sql`, `reports.sql`, then `hardening.sql` in the SQL Editor → make your account admin → put the Project URL and **anon** key in `config.js` → set the Site URL. Step by step: [docs/SUPABASE.md](docs/SUPABASE.md).

## Adding courses

Without code: **Account → Course Studio**. With code (custom widgets & question generators): copy `courses/contoh-kursus/`, change the content, and register it in `courses/index.js`. The full guide with every block and question format: [docs/ADDING-COURSES.md](docs/ADDING-COURSES.md).

## Project layout

```
index.html              page shell
privasi.html            privacy policy (Indonesian, linked from sign-in and Google OAuth)
config.js               site configuration (Supabase optional; public anon key only)
_headers                security headers & CSP (Cloudflare Pages)
manifest.webmanifest    PWA manifest
assets/                 CSS & icons
js/
  math.js               interval engine, answer parser, mini-TeX, number line
  registry.js           course loader (window.BC = active course)
  backend.js            storage adapters: local / Supabase
  core.js               per-course progress, spaced repetition, stats, sync, sanitizer
  ui.js                 learning pages: lessons, questions, review, flashcards, routing
  platform.js           catalog home, account, classes, assignments, forum, reports
  stats.js              stats dashboard
  help.js               help center & guided tour
  report.js             problem-report form & admin inbox
  site.js               site name from config.js (kept out of HTML for the CSP)
  editor.js             Course Studio (no-code editor)
  widget-lib.js         widget library for the Studio (see docs/WIDGETS.md)
  expr.js               safe formula parser for widgets
  course-safe.js        sanitizer & compiler for teacher-made courses
courses/
  index.js              course list
  pertidaksamaan/       main course (inequalities)
  contoh-kursus/        example/template course
supabase/               database schema, security tests, Edge Function, email templates
tests/                  answer-key verification, UI flows, RLS tests
docs/                   architecture, course guide, widgets, Supabase, email, reports
tools/                  studio-to-file.js: move a Studio course into code
```

How data flows: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Testing

```bash
npm test             # answer keys, course & progress sanitizers, merge/streak/SRS, 40k-input fuzzing,
                     # independent verification of 17 generators, report Edge Function (Node, no deps)
npm run test:ui      # UI smoke test with Playwright (run `npm run serve` first)
npm run test:flow    # teacher & student flows in Supabase mode (in-memory fake Supabase)
npm run test:editor  # a teacher builds a course in the Studio → a student works through it
npm run test:auth    # sign-up, activation code, resend, password reset & change, Google sign-in
npm run test:help    # help center, search, guided tour
npm run test:csp     # the _headers CSP is applied and injected scripts are blocked
npm run test:answers # answers every question through the real UI under the CSP (right and wrong answers)
npm run test:sync    # two devices share one account: progress must not be lost, overwritten or stuck
PGHOST=localhost PGUSER=postgres npm run test:rls   # security policy tests on a LOCAL Postgres
```

## License

Code: MIT (see `LICENSE`). External learning resources linked from the lessons belong to their respective owners.
