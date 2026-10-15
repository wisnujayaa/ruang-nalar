# Interactive widgets

There are three paths, from easiest to most flexible:

```
                      who writes the code?     who can use it?            safe for students?
1. Widget library     site maintainer (once)   EVERY teacher in Studio    yes: teachers only fill in parameters
2. File-course widget site maintainer          that course only           yes: the code is in the repo, reviewed
3. Studio → file      site maintainer          that course only           yes (same as #2)
```

**Why can't teachers write JavaScript directly in the Studio?** One teacher's code would run in the browser of every student who opens the course, with that student's session. Malicious (or merely careless) code could read progress, send messages as the student, and so on. So the Studio only accepts **data**, while widget **code** is written by the maintainer in the repo.

## 1. Widget library (available to every teacher)

File: `js/widget-lib.js`. Currently available:

| id | Name (in the Studio UI) | Parameters |
|---|---|---|
| `grafik` | Function graph + sliders | formula `f(x)`, up to 4 sliders, shade the region `f(x) > 0` / `< 0` / etc., axis bounds |
| `garis` | Interactive number line | instructions, starting example, variable name |
| `sematan` | Desmos / GeoGebra / PhET / YouTube embed | link (trusted domains only), caption |

The graph widget's formula is parsed by the safe parser `js/expr.js` (no `eval`), tested in `tests/verify-expr.js`.

### Adding a widget to the library

```js
// in js/widget-lib.js
W.def({
  id: 'lingkaran',                       // lowercase, unique
  name: 'Lingkaran satuan',              // shown in the Studio menu (Indonesian UI)
  desc: 'Geser sudut, lihat sin dan cos.',
  params: [                              // the Studio form is generated from this schema
    { key: 'sudut', type: 'num', label: 'Sudut awal (derajat)', def: 30, min: 0, max: 360 },
    { key: 'tampilTan', type: 'bool', label: 'Tampilkan tan', def: false }
  ],
  mount(el, p) {                         // p is already sanitized against the schema
    el.innerHTML = '<svg class="w-svg" viewBox="0 0 300 300"></svg><input type="range" min="0" max="360">';
    // ... draw & attach events
  }
});
```

Parameter types: `text`, `longtext`, `num` (with `min`/`max`), `select` (with `opts: [[value, label], ...]`), `bool`, `url`, `vars` (slider list). Once pushed, the widget shows up in the Studio's **Widget interaktif** menu for every teacher.

Rules to keep it safe:
- Never put parameter text into `innerHTML`; use `textContent`, or escape it first.
- Never run parameter text as code (`eval`, `Function`, `setTimeout(string)`). For formulas, use `NalarExpr.compile`.
- File-based courses can use the library too: `{ k: 'widget', lib: 'grafik', params: { expr: 'x^2-4' } }`.

## 2. Custom widgets in a file-based course

For a widget used by one course only (like the 25 widgets in the Pertidaksamaan course):

```js
// courses/<id>/course.js
C.WIDGETS = {
  mount(id, el) {
    if (id === 'timbangan') { el.innerHTML = '...'; /* any JavaScript */ }
  }
};
C.LESSONS[1].push({ k: 'widget', id: 'timbangan', title: 'Timbangan seimbang', predict: { q: '…', opts: ['…', '…'], ans: 0 } });
```

## 3. Moving a Studio course into code

When a teacher's course needs a very specific widget:
1. In the Studio, **Terbitkan → Ekspor JSON** (Publish → Export JSON), and save it as `course.json`.
2. `node tools/studio-to-file.js course.json course-name` creates `courses/course-name/course.js`.
3. Add the printed snippet to `courses/index.js`, write the widget in `C.WIDGETS`, and push.

From then on the course is edited in code, not in the Studio. Usually path #1 is better: build the widget once in the library and every teacher benefits.
