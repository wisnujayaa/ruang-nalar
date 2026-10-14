/* Ruang Nalar — registry & pemuat kursus.
   Semua file konten kursus menulis ke `window.BC`. Di sini BC adalah Proxy yang
   meneruskan baca/tulis ke objek kursus yang sedang aktif, sehingga file konten
   tidak perlu tahu ada banyak kursus. */
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
  const R = G.NR = {
    list: () => (G.NALAR_COURSES || []),
    meta: (id) => (G.NALAR_COURSES || []).find(c => c.id === id),
    loaded: {},
    active: null,
    base: 'courses/'
  };
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Gagal memuat ' + src)); document.head.appendChild(s); });
  }
  /* Muat kursus (sekali saja), lalu jadikan aktif */
  R.load = async function (id) {
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
  R.use = function (id) { if (!R.loaded[id]) return false; holder.cur = R.loaded[id]; R.active = id; return true; };
  R.current = () => holder.cur;
  /* Lengkapi field opsional supaya UI tidak perlu banyak pengecekan */
  R.normalize = function (o) {
    o.SECTIONS = o.SECTIONS || []; o.LESSONS = o.LESSONS || {}; o.BANK = o.BANK || {}; o.GEN = o.GEN || {};
    o.CARDS = o.CARDS || []; o.TRAPS = o.TRAPS || {}; o.PREREQ = o.PREREQ || []; o.INTRO = o.INTRO || [];
    o.CONCEPTS = o.CONCEPTS || {}; o.RES = o.RES || {}; o.RES_GENERAL = o.RES_GENERAL || [];
    o.GEN_BY_SEC = o.GEN_BY_SEC || {}; o.GEN_BY_PRE = o.GEN_BY_PRE || {};
    o.SUMMARY = o.SUMMARY || null; o.CHECK = o.CHECK || null;
    if (!o.makeGen) o.makeGen = (name, seed) => { const g = o.GEN[name]; if (!g) return null; try { return g.make(seed >>> 0); } catch (e) { console.error(e); return null; } };
  };
})(window);
