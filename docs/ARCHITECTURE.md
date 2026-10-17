# Architecture

## Principles
- **No build step.** Every JS file is a plain IIFE attached to `window`. Easy to read, easy to fork, runs on any static host.
- **Courses are data.** The core code knows nothing about inequalities; all lessons, questions, widgets, and traps live in `courses/<id>/`.
- **One backend interface.** The UI never calls Supabase directly; it always goes through `window.BB`.
- **Code in English, product in Indonesian.** Identifiers, comments, docs, and tests are English. User-facing text (UI strings, course content, emails, help articles) is Indonesian. Route names that appear in shared URLs (`#gabung=`, `#kursus=`, `#bantuan=`) and stored data keys are kept stable on purpose.

## Globals
| Name | File | Contents |
|---|---|---|
| `BM` | `js/math.js` | interval sets `{a,b,ca,cb}`, `parseAnswer`, `solve`, `tex/rich` (mini-TeX), `numberLine` |
| `NR` | `js/registry.js` | course list & loader |
| `BC` | `js/registry.js` | **Proxy** to the active course object. Course files write `BC.BANK = …` etc. |
| `BB` | `js/backend.js` | active backend: local or Supabase |
| `BA` | `js/core.js` | active course progress (`BA.S`), answer recording, review schedule, stats, sync |
| `BU` | `js/ui.js` | router & UI components used by `platform.js` |
| `BP` | `js/platform.js` | class page cache |
| `NalarStats` | `js/stats.js` | stats dashboard (computed from `BA.stats`) |
| `NalarHelp` | `js/help.js` | help articles, accent-insensitive search, guided tour |
| `NalarReport` | `js/report.js` | user problem reports |

## Data trust
- **Progress is never trusted raw.** Every way in (localStorage, progress codes, `sync.pull`, student progress read by a teacher) goes through `BA.sanitize` / `BA.parseState`: each field is coerced to the right type & range, keys are limited to `[A-Za-z0-9_:.-]`, and text is truncated. Together with `esc()` (which escapes `& < > " '`) and a CSP without inline scripts, stored XSS from a student to a teacher is blocked in several layers.
- **Cross-device reset:** a reset writes `resetAt`; during `BA.merge`, data older than `resetAt` is dropped, so another device can't "resurrect" old progress.
- **Ordered sync:** `sync.push` calls are chained (a promise chain) and the last pushed version is tracked per course, so two quick saves can't overwrite each other out of order.
- **Spaced repetition:** the maximum interval is 365 days; questions/cards deleted from a course are ignored when computing what's due.
- **Streak:** computed from the set of active days, stepping back one calendar date at a time (safe across daylight-saving changes).

## Loading a course
1. `NR.load(id)` creates an empty object, makes it the `BC` target, then loads `courses/<id>/<file>` one by one with `<script>` tags.
2. `NR.normalize` fills optional fields with empty values.
3. `BA.useCourse(id)` saves the old course's progress, reads the new one from `localStorage` (`nalar-state-v1:<id>`), then pulls the server version and **merges** them (`BA.merge`: union of answer history, newest value per card/question).

Views that need a course (`COURSE_VIEWS` in `ui.js`) automatically load the last course when none is active.

## Keeping devices in sync (`BA.sync` in `core.js`)
One account can be open on several devices (laptop + phone), so syncing follows these rules. Each one exists because its absence once lost progress:
- **Read-merge-write.** Every save first reads the server copy and merges it (`BA.merge`) with the local one; only then is it written. A plain upsert is "last writer wins" and would silently erase what another device saved.
- **Pull on return.** An already-open device does not hear about changes, so it pulls when the tab comes to the front, on `focus`, when the network returns, and every minute while visible (`sync.refresh`, throttled by `sync.minPullGap`).
- **Redraw.** When a pull brings in new data `sync.rev` is incremented, and `boot()` in `ui.js` redraws the current screen if it is a progress screen (`REFRESHABLE`; never a question, lesson or timed test). Without this, the merged progress was in memory but invisible.
- **Timeouts.** Every request is limited to `sync.timeoutMs`. A request that never answers used to block the queue of saves forever. Failures retry with back-off (6 s … 1 min) and the reason is shown in Settings, next to a "Sinkronkan sekarang" (sync now) button.
- **`keepalive`.** Small requests are sent with `keepalive`, so a save made just before the tab is closed or backgrounded can still finish.
- Still possible: two devices saving at the very same moment (a few milliseconds apart) can race between the read and the write. The next pull on either device merges the difference back, because merging only ever adds data.
- Tested by `tests/sync-flow.mjs` (two browsers, one shared fake server).

## Teacher-made courses (Studio)
- Stored in the backend (`BB.courses`) with ids like `c-xxxxxxxxxx`. `NR.refreshRemote()` fetches public courses plus your own; `NR.load('c-…')` fetches the content.
- Course content is user data, so it **always** goes through `NalarSafe.compile()` (`js/course-safe.js`): only safe block & question types, escaped text, math stripped of `< > &`, https-only links. The output has the same format as file-based courses, so `ui.js` treats both the same.
- The editor (`js/editor.js`) edits the raw data `E.raw` through `data-b="path"` attributes on inputs; structural changes (add/remove/move) re-render the tab.
- Visibility: `draft` (owner only), `class` (members of the owner's classes that use the course), `unlisted` (by link), `public` (catalog). Enforced by RLS in `supabase/course-access.sql`.

## Progress
One JSON document per (user, course): answer history (max 1,400), the review schedule for each question & card, mistakes, lesson position, etc. Statistics (concept mastery, traps) are **never stored**; they're recomputed from the history (`BA.stats`). That's why teacher reports and assignment status only need to read the student's progress document.

## Assignment status
An assignment `target` is data, e.g. `{kind:'practice', sec:5, lvl:3}`. `statusOf` in `platform.js` computes the status from the student's progress:

| kind | done when |
|---|---|
| `lesson` | the section's exit ticket is completed |
| `practice` | 4 of the last 5 answers in that section & level are correct |
| `prereq` | the prerequisite drill is passed |
| `diag` | the diagnostic test is finished |
| `review` / `mixed` | number of questions from that source since the assignment was created ≥ n |
| `tryout` | ≥ 10 tryout questions answered since the assignment was created |

## Accounts (Supabase mode)
- **Google sign-in** via `auth.signInGoogle()`; the button appears automatically when `/auth/v1/settings` reports the Google provider as enabled.
- **Email + password** with a **one-time code**: sign-up and password reset send a code (`{{ .Token }}` in the email templates), verified with `auth.verifyCode(email, code, 'signup' | 'recovery')`. Codes can't be consumed by email link scanners and code-only emails rarely land in spam. Old email links are still handled by `handleLanding` in `ui.js`.
- The URL hash from email/OAuth redirects is kept until Supabase has read it, then cleaned before routing.

## Backend
`backend.js` picks an adapter on load: Supabase when `config.js` has credentials, otherwise local. The interface:

```
init(), mode, online, user, isAdmin
auth.{needsLogin, signUp, signIn, signOut, resetPassword, resend?, verifyCode?, updatePassword?, providers?, signInGoogle?}
progress.{load, save, watch?}
classes.{mine, create, join?, remove, leave?, members, memberProgress, kick, setMembers?, candidates?, canCreate, usesCode, manual}
assign.{list, create, remove}
forum.{threads, create, posts, reply, update, remove, removePost}
notes.{watch, send, markRead?, history}
courses.{…}, reports.{…}, admin.{listUsers, setRole}
profiles(ids)
```

Adding another backend (Firebase, your own server) only requires implementing this interface.

## Security
- All user-written text (names, titles, forum posts) is inserted with `textContent` or escaped before `$…$` math is rendered. The smoke test checks that `<script>` in the forum never runs.
- In Supabase mode the access rules live in the database (RLS), tested by `supabase/test-rls*.sql` via `npm run test:rls`.
- `_headers` sets a strict CSP (no inline scripts, connections only to Supabase), `frame-ancestors 'none'`, and related headers; `npm run test:csp` applies it in a real browser.
