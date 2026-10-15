# Connecting Supabase

Supabase provides a Postgres database plus authentication. The free tier is enough for small to medium classes. The site stays 100% static: the browser talks to Supabase directly, and **security is enforced by Row Level Security (RLS)** in the database, not by JavaScript.

## 1. Create a project
1. Sign up at <https://supabase.com> and click **New project**.
2. Pick the nearest region (e.g. Singapore) and keep the database password somewhere safe.

## 2. Install the schema
1. Open **SQL Editor → New query**.
2. Paste all of `supabase/schema.sql` and click **Run**.
   The script is safe to re-run (`if not exists` / `create or replace`).
3. Then run, in order:
   - `supabase/courses.sql`: teacher-made courses for the Course Studio
   - `supabase/roles.sql`: student / teacher / admin roles
   - `supabase/course-access.sql`: course access (draft / class-only / unlisted / public)
   - `supabase/reports.sql`: problem reports (email notifications: [REPORTS.md](REPORTS.md))
   - `supabase/hardening.sql`: least-privilege column grants, size limits, class-code attempt limits
4. Make your account **admin** (after signing up on the site). In the SQL Editor:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
   After that, the admin promotes teachers from **Akun → Kelola pengguna** (Account → Manage users) on the site, no more SQL needed.

### Roles
| Role | Can |
|---|---|
| Student (default) | learn, create/join classes, use forums |
| Teacher | + create courses in the Studio |
| Admin | + change other users' roles (there is always at least one admin) |

Roles live in `profiles.role` and **users cannot change their own** (the only writable column is `display_name`); changes go through `admin_set_role`, which checks for an admin. Tested in `supabase/test-rls-roles.sql`.

What gets created:

| Table | Contents | Who can read |
|---|---|---|
| `profiles` | display name, role | yourself + classmates |
| `progress` | progress per (user, course), JSON | yourself + class teachers **for that class's course only** |
| `classes` | classes, 6-character join code | teacher + members |
| `class_members` | membership | people in that class |
| `assignments` | assignment + target + due date | people in the class; only the teacher writes |
| `forum_threads`, `forum_posts` | forum | people in the class; edit/delete your own; teachers moderate; only teachers pin |
| `messages` | teacher → student messages | sender & recipient; only a teacher of a shared class may send |
| `courses` | teacher-made courses (Studio) | public/unlisted: everyone; class-only: owner + members of the owner's classes that use it; draft: owner only. A class may only use a locked course its owner owns (trigger). Only the owner edits/deletes |
| `reports` | problem reports | reporter (own reports) + admins |
| `join_attempts` | wrong class-code attempts | nobody through the API (used by `join_class`) |

Students join through `join_class(code)`, so nobody can add themselves to a class without the code.

## 3. Fill in `config.js`
From **Project Settings → API**, copy:
- **Project URL** → `supabaseUrl`
- **anon public** key → `supabaseAnonKey`

```js
window.NALAR_CONFIG = {
  siteName: 'Ruang Nalar',
  supabaseUrl: 'https://abcdefgh.supabase.co',
  supabaseAnonKey: 'eyJhbGciOi...'
};
```

The anon key is designed to be public (every Supabase site ships it). What must **never** go into the repo: the `service_role` key and the database password.

## 4. Configure authentication
**Authentication → URL Configuration**:
- **Site URL**: your site address without a trailing slash, e.g. `https://ruang-nalar.pages.dev`
- **Redirect URLs**: add `https://ruang-nalar.pages.dev/**` (and `http://localhost:8765/**` for local testing). List only addresses you own.

**Authentication → Sign In / Providers → Email**: keep it enabled with "Confirm email" on, and set the minimum password length to 8.

**Emails:** Supabase's built-in sender is for testing only (it may refuse non-team addresses and allows only a few emails per hour). Configure your own SMTP and paste the code-based templates; see [EMAIL.md](EMAIL.md). Google sign-in, which needs no confirmation email at all, is described there too.

## 5. Try it
1. Open the site, **Akun → Masuk/Daftar** (Account → Sign in/Sign up), and create a teacher account.
2. **Kelas → Buat kelas baru** (Classes → New class), pick a course, and copy the code or invite link.
3. In another browser (or a private window), sign up as a student, open the invite link, and press **Gabung** (Join).
4. The student practises; the teacher opens the class's **Progres** and **Tugas** tabs to see the status.

## Security tests (optional, for developers)
`tests/run-rls.sh` runs teacher / two students / outsider scenarios on an **empty local Postgres** (it creates a fake `auth` schema) and fails on any leaked access. Never point it at a production database.

## Known limitations
- Progress is stored as one JSON document per (user, course) and trimmed automatically when too large (the oldest answers are dropped; capped at 600 KB by a database constraint).
- Messages are polled every 60 seconds (not real-time).
- Signed-out visitors can still learn; their progress is merged into the account on the first sign-in on that device.
