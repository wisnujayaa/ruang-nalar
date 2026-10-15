# Adding courses

There are two ways:

| | **Course Studio (no code)** | **File-based course (code)** |
|---|---|---|
| For | Teacher/admin accounts | Repo maintainers |
| Where you write | Web forms: **Akun → Studio kursus** (Account → Course Studio) | The folder `courses/<id>/` |
| Stored in | The database (`courses` table) | The GitHub repo |
| Special features | Text, worked examples, 6 question types, flashcards, traps, resources, **library widgets** (graph, number line, Desmos/GeoGebra/PhET/YouTube) | All of that **plus** custom widgets & random question generators (needs JavaScript) |
| Who can open it | Draft / **class-only** (locked) / unlisted / public (Publish tab) | Every visitor (repo files are public) |

Course content is written in Indonesian for Indonesian learners; field names and this guide are English.

## Option 1: Course Studio (recommended for teachers)
1. Sign in and open **Akun → Studio kursus → Buat kursus baru** (new course).
2. **Info**: title, subject, level, description.
3. **Sections & lessons**: each section is a top-to-bottom list of blocks (text, worked example, try-it question, traps, recap, auto practice, exit ticket). Text uses light formatting: `**bold**`, `*italic*`, `- ` lines for lists, math `$x^2<4$`.
4. **Questions**: pick a type, fill in the question, key, explanation, and level (L1–L6). **Coba soal ini** (try this question) shows it exactly as students will see it. Interval keys are previewed on a number line.
5. **Publish**: review the list of problems/suggestions, choose Draft / Class-only / Unlisted / Public, click **Simpan** (save), then preview as a student.
6. The course can now be picked when creating a class, and every feature (spaced review, auto-status assignments, teacher reports) applies.

Security: all Studio text is sanitized by `js/course-safe.js` before display. Raw HTML is never rendered, math is cleaned, and links must be `https://`. Tested by `tests/verify-safe.js`.

Widgets: see [WIDGETS.md](WIDGETS.md) for the widget library, adding new widgets, and moving a Studio course into code.

Studio courses can be exported/imported as JSON (Publish tab), e.g. for backups or moving to another site.

## Option 2: file-based course

A course is a folder in `courses/` containing plain JavaScript files that fill the `BC` object. No changes to `js/` are needed.

### Quick steps
1. Copy `courses/contoh-kursus/` to `courses/<course-id>/` (lowercase letters, digits, `-`).
2. Register it in `courses/index.js`:
   ```js
   { id: 'fungsi-kuadrat', title: 'Fungsi kuadrat', brand: 'Parabola', subject: 'Matematika',
     level: 'SMA kelas X', blurb: 'One sentence that makes people want to start.', glyph: 'x²', color: 'sol',
     files: ['course.js'] }
   ```
   `files` load in order, so a big course can be split up (see `pertidaksamaan`: content, question bank, generators, widgets).
   Add `soon: true` to show a "Segera hadir" (coming soon) card that can't be opened yet, or `hidden: true` to keep the course out of the catalog while still reachable via `#kursus=<id>`.
3. Run `npm run serve`, open your course, then `npm test` (add checks for your answer keys to `tests/verify-keys.js`).

### Course fields
| Field | Required | Contents |
|---|---|---|
| `SECTIONS` | yes | `[{id, short, title, glyph, concepts:[…], jalur?}]`; `jalur` (track) is optional: `sekolah`/`ujian`/`campuran`/`tantangan` |
| `LESSONS` | yes | `{ [sectionId]: [block, …] }` |
| `BANK` | yes | `{ [questionId]: question }` |
| `CONCEPTS` | recommended | `{ key: 'Concept name' }` for the mastery map |
| `TRAPS` | recommended | `{ key: {name, sec, wrong, right, tip} }` common traps |
| `CARDS` | optional | `[{id, sec, kind, f, b, nl?}]` flashcards (shown once their section is opened) |
| `RES`, `RES_GENERAL` | optional | external resources `{type:'artikel'|'video'|'alat'|'buku', title, src, url, note?}` |
| `GEN`, `GEN_BY_SEC` | optional | random question generators `GEN[name] = {lvl, make(seed) → question}` |
| `INTRO`, `PREREQ`, `GEN_BY_PRE` | optional | Section 0, prerequisites + drills. Questions with ids `d-…` form the diagnostic test |
| `CHECK`, `SUMMARY`, `DECISION` | optional | 5-second checks per section, collapsed summary, decision map |
| `INFO` | optional | `{introTitle, diagDesc, lintasGens, tips}` |
| `WIDGETS` | optional | `{ mount(id, el) }` for widget blocks |

### Lesson blocks (`LESSONS`)
| `k` | Example | Notes |
|---|---|---|
| `text` | `{k:'text', tag:'Intuisi', title, html}` | `html` may contain `$…$` / `$$…$$` math |
| `widget` | `{k:'widget', id:'persen', title, predict?:{q, opts, ans, after}}` | `predict` = guess before the widget opens |
| `example` | `{k:'example', title, problem, steps:[{t, hide?, ask?}], nl?}` | `hide:true` steps must be guessed first (*faded example*) |
| `q` | `{k:'q', id:'p1-2', tag:'Coba dulu'}` | one question from `BANK` |
| `traps` | `{k:'traps', ids:[…]}` | trap cards |
| `retrieval` | `{k:'retrieval'}` | 2 random questions from earlier sections |
| `recap` | `{k:'recap', title, items:[…]}` | |
| `practice` | `{k:'practice'}` | graded L1–L6 practice panel |
| `res` | `{k:'res'}` | shows `RES[section]` + `RES_GENERAL` |
| `exit` | `{k:'exit', qs:[3 ids], prompt, points:[…]}` | completes the section; used by "finish section" assignments |

### Question types (`BANK`)
Common fields: `id, sec, lvl (1–6), type, q, concepts, mode?, trap?, hints?, sol?, lintas?`.
`mode` is any combination of `sekolah` (school), `utbk`, `mandiri` (university entrance), `olimpiade`.

| `type` | Specific fields |
|---|---|
| `mc` | `opts:[{t, ok?, why?, trap?}]`; options are shuffled; give every distractor a `why` so the feedback teaches |
| `num` | `ans`, `tol?`, `unit?`, `wrong:[{v, why, trap?}]` |
| `interval` | `ans` (e.g. `'(-inf,2]U(5,inf)'`), `v?`, `wrong:[{a, why, trap?}]`; other wrong answers are diagnosed automatically |
| `tf` | `stmts:[{t, v, why}]` |
| `err` | `steps:[…]`, `bad` (index of the first wrong step), `why` |
| `order` | `steps:[…]` (correct order), `extra?:[distractors]`, `alt?:[[indices…]]` other valid orders, `why` |

Suggested levels: L1 mechanics, L2 concepts, L3 application, L4 exams (UTBK/entrance), L5 challenge, L6 olympiad/college. The next level unlocks after 4 of the last 5 answers are correct.

### Writing good questions
- Multiple-choice distractors should be real student mistakes, not random numbers. Give each one a `why`.
- Link questions to the same `trap` keys as the trap catalog so the trap radar works.
- Verify every key by computer (see `tests/verify-keys.js` and `tests/verify-gen.js`): a wrong key destroys students' trust.

## Locking a course to specific classes

Studio courses have four access levels (Publish tab):

| Access | Who can open it | May other teachers use it in their classes? |
|---|---|---|
| Draft | the author only | no |
| **Class-only** | the author + members of **the author's** classes that use this course | no |
| Unlisted | anyone with the link | yes |
| Public | everyone, shown in the catalog | yes |

Flow: create the course → choose **Class-only** → create a class (Classes menu) with that course → share the class code.
Students who join can open the course automatically; students who leave or are removed lose access automatically.
The lock is enforced in the database (RLS, `supabase/course-access.sql`), not just hidden in the UI.

**File** courses (the `courses/` folder) can't be locked: the static host serves those files to anyone.
If the material needs to be locked, rebuild it in the Studio.
