/* Ruang Nalar — course registry & loader.
   Every course content file writes to `window.BC`. Here BC is a Proxy that
   forwards reads/writes to the currently active course object, so content files
   don't need to know that several courses exist. */
(function (G) {
  'use strict';
  const holder = { cur: {} };
  G.BC = new Proxy({}, {
    get: (_, k) => holder.cur[k],
    set: (_, k, v) => { holder.cur[k] = v; return true; },
    has: (_, k) => k in holder.cur,
    deleteProperty: (_, k) => delete holder.cur[k],
    ownKeys: () => Reflect.ownKeys(holder.cur),
    getOwnPropertyDescriptor: (_, k) => { const d = Object.getOwnPropertyDescriptor(holder.cur, k); if (d) d.configurable = true; return d; }
  });
  /* Two course sources:
     - file  : courses/index.js (written in code, e.g. Pertidaksamaan)
     - db    : created by teachers in the web editor (id starts with "c-"), loaded from the backend */
  const R = G.NR = {
    remote: [],
    list: () => (G.NALAR_COURSES || []).concat(R.remote.filter(r => !(G.NALAR_COURSES || []).some(c => c.id === r.id))),
    meta: (id) => R.list().find(c => c.id === id),
    isDb: (id) => /^c-[a-z0-9]{6,20}$/.test(String(id || '')),
    loaded: {},
    active: null,
    base: 'courses/'
  };
  /* Refresh the course list from the backend (called after sign-in/out and after saving in the editor) */
  R.refreshRemote = async function () {
    try { R.remote = (G.BB && G.BB.courses) ? await G.BB.courses.list() : []; } catch (e) { R.remote = []; }
    return R.remote;
  };
  /* Force a reload (e.g. after a course was edited) */
  R.forget = function (id) { delete R.loaded[id]; if (R.active === id) R.active = null; };
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Gagal memuat ' + src)); document.head.appendChild(s); });
  }
  /* Load a course (once), then make it active */
  R.load = async function (id) {
    if (R.isDb(id)) {
      if (!R.loaded[id]) {
        const got = G.BB && G.BB.courses ? await G.BB.courses.get(id) : null;
        if (!got || !got.content) throw new Error('Kursus tidak ditemukan atau belum dibagikan.');
        if (!R.remote.some(r => r.id === id)) R.remote.push(got.meta);
        R.install(id, got.meta, got.content);
      }
      R.use(id); return R.loaded[id];
    }
    const meta = R.meta(id); if (!meta || meta.soon) throw new Error('Kursus tidak ditemukan: ' + id);
    if (!R.loaded[id]) {
      const obj = { id, meta };
      const prev = holder.cur; holder.cur = obj;
      try { for (const f of meta.files) await loadScript(R.base + id + '/' + f); }
      catch (e) { holder.cur = prev; throw e; }
      R.normalize(obj);
      R.loaded[id] = obj;
    }
    R.use(id);
    return R.loaded[id];
  };
  /* Install a course from raw editor data (already sanitized by NalarSafe.compile) */
  /* Studio course visibility — labels & descriptions used by the Studio, catalog, and class pages */
  R.VIS = {
    draft: { label: 'Draf', cls: 'st-todo', desc: 'Hanya kamu. Siswa di kelasmu pun belum bisa membukanya. Pakai saat masih menulis.' },
    class: { label: 'Khusus kelas', cls: 'st-doing', desc: 'Terkunci: hanya kamu dan siswa yang bergabung ke kelasmu yang memakai kursus ini. Orang lain tidak bisa membukanya, walau punya tautannya.' },
    unlisted: { label: 'Lewat tautan', cls: 'st-doing', desc: 'Siapa pun yang punya tautannya, tanpa perlu bergabung ke kelas. Tidak muncul di katalog.' },
    public: { label: 'Publik', cls: 'st-done', desc: 'Muncul di katalog beranda untuk semua pengunjung.' }
  };
  R.visLabel = (v) => (R.VIS[v] || R.VIS.draft).label;
  R.install = function (id, meta, raw) {
    const obj = Object.assign({ id, meta, fromDb: true }, G.NalarSafe.compile(raw));
    R.normalize(obj); R.loaded[id] = obj; return obj;
  };
  R.use = function (id) { if (!R.loaded[id]) return false; holder.cur = R.loaded[id]; R.active = id; return true; };
  R.current = () => holder.cur;
  /* Fill optional fields so the UI needs fewer checks */
  R.normalize = function (o) {
    o.SECTIONS = o.SECTIONS || []; o.LESSONS = o.LESSONS || {}; o.BANK = o.BANK || {}; o.GEN = o.GEN || {};
    o.CARDS = o.CARDS || []; o.TRAPS = o.TRAPS || {}; o.PREREQ = o.PREREQ || []; o.INTRO = o.INTRO || [];
    o.CONCEPTS = o.CONCEPTS || {}; o.RES = o.RES || {}; o.RES_GENERAL = o.RES_GENERAL || [];
    o.GEN_BY_SEC = o.GEN_BY_SEC || {}; o.GEN_BY_PRE = o.GEN_BY_PRE || {};
    o.SUMMARY = o.SUMMARY || null; o.CHECK = o.CHECK || null;
    if (!o.makeGen) o.makeGen = (name, seed) => { const g = o.GEN[name]; if (!g) return null; try { return g.make(seed >>> 0); } catch (e) { console.error(e); return null; } };
  };
})(window);
