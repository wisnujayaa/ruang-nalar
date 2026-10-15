/* Ruang Nalar — inti aplikasi: state per kursus, simpan lokal, sinkronisasi, jadwal ulang berjarak, statistik */
(function (G) {
  'use strict';
  const B = G.BM, C = G.BC, A = G.BA = {};
  const SKEY = 'nalar-settings-v1';
  const keyOf = (id) => 'nalar-state-v1:' + id;
  A.course = null;
  const now = () => Date.now();
  const DAY = 86400000, MIN = 60000;
  A.today = (t) => { const d = new Date(t || now()); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  function fresh() {
    return { v: 1, nick: '', nickT: 0, created: now(), attempts: [], items: {}, cards: {}, prereq: {}, diag: { done: 0, t: 0, res: {} }, intro: 0,
      sections: {}, mistakes: {}, dumps: {}, daily: {}, exits: {}, predicts: {}, unlock: {}, exDone: {}, notesRead: {} };
  }
  A.fresh = fresh;

  /* ---------- pembersih state ----------
     Progres bisa datang dari luar: server (perangkat lain), kode progres, atau progres siswa yang dibuka guru.
     Semua field dipaksa ke tipe & batas yang benar supaya (1) data rusak tidak membuat aplikasi macet, dan
     (2) progres yang sengaja direkayasa tidak bisa menyisipkan HTML/skrip ke layar orang lain. */
  const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  const num = (v, d, lo, hi) => { let n = typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' ? +v : NaN); if (!isFinite(n)) n = d; if (lo != null && n < lo) n = lo; if (hi != null && n > hi) n = hi; return n; };
  const int = (v, d, lo, hi) => Math.round(num(v, d, lo, hi));
  const bit = (v) => v ? 1 : 0;
  const KEY = /^[A-Za-z0-9_:.\-]{1,80}$/;
  const key = (v) => typeof v === 'string' && KEY.test(v) ? v : null;
  const str = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
  const T_MAX = 4102444800000;   // tahun 2100
  const mapOf = (m, fn, maxKeys) => { const o = {}; if (!isObj(m)) return o; let k = 0; for (const [kk, v] of Object.entries(m)) { if (!key(kk) || k++ >= (maxKeys || 5000)) continue; const r = fn(v, kk); if (r != null) o[kk] = r; } return o; };
  const sched = (v) => isObj(v) ? { iv: num(v.iv, 0, 0, 3650), ef: num(v.ef, 2.4, 1.3, 3), n: int(v.n, 0, 0, 1e4), lapses: int(v.lapses, 0, 0, 1e4), due: num(v.due, 0, 0, T_MAX), last: num(v.last, 0, 0, T_MAX) } : null;
  A.sanitize = function (raw) {
    const j = isObj(raw) ? raw : {}; const o = fresh();
    o.attempts = (Array.isArray(j.attempts) ? j.attempts : []).slice(-1400).map(a => {
      if (!isObj(a) || !key(a.i)) return null;
      const r = { t: num(a.t, 0, 0, T_MAX), i: a.i, s: int(a.s, 0, 0, 999), l: int(a.l, 0, 0, 9), ok: bit(a.ok), c: int(a.c, 2, 1, 3), ms: num(a.ms, 0, 0, 30 * MIN), k: (Array.isArray(a.k) ? a.k : []).map(key).filter(Boolean).slice(0, 12), src: key(a.src) || 'latihan' };
      if (key(a.tp)) r.tp = a.tp; if (key(a.th)) r.th = a.th; if (key(a.p)) r.p = a.p;
      return r.t ? r : null;
    }).filter(Boolean);
    o.items = mapOf(j.items, sched); o.cards = mapOf(j.cards, sched);
    o.prereq = mapOf(j.prereq, v => isObj(v) && ['lulus', 'latih'].includes(v.st) ? { st: v.st, t: num(v.t, 0, 0, T_MAX) } : null, 500);
    o.diag = isObj(j.diag) ? { done: bit(j.diag.done), t: num(j.diag.t, 0, 0, T_MAX), res: mapOf(j.diag.res, v => isObj(v) ? { ok: int(v.ok, 0, 0, 999), n: int(v.n, 0, 0, 999) } : null, 500) } : o.diag;
    o.intro = bit(j.intro);
    o.sections = mapOf(j.sections, v => isObj(v) ? { step: int(v.step, 0, 0, 999), done: bit(v.done), visited: mapOf(v.visited, () => 1, 999) } : null, 999);
    o.mistakes = mapOf(j.mistakes, v => isObj(v) && key(v.i) ? { t: num(v.t, 0, 0, T_MAX), i: v.i, g: key(v.g), sd: v.sd == null ? null : int(v.sd, 0, 0, 2 ** 32), a: str(v.a, 120), tr: key(v.tr), y: bit(v.y), fx: bit(v.fx), s: int(v.s, 0, 0, 999) } : null, 400);
    o.dumps = mapOf(j.dumps, v => isObj(v) ? { t: num(v.t, 0, 0, T_MAX), text: str(v.text, 2000), got: int(v.got, 0, 0, 999) } : null, 200);
    o.exits = mapOf(j.exits, v => isObj(v) ? { t: num(v.t, 0, 0, T_MAX), text: str(v.text, 1200), pts: int(v.pts, 0, 0, 999) } : null, 200);
    o.daily = {}; if (isObj(j.daily)) for (const [d, v] of Object.entries(j.daily)) if (/^\d{4}-\d{2}-\d{2}$/.test(d)) o.daily[d] = num(v, 0, 0, DAY);
    o.predicts = mapOf(j.predicts, v => int(v, 0, 0, 99), 2000);
    o.exDone = mapOf(j.exDone, v => isObj(v) ? mapOf(v, () => 1, 99) : null, 2000);
    o.unlock = mapOf(j.unlock, v => v ? 1 : null, 999);
    o.notesRead = mapOf(j.notesRead, v => v ? 1 : null, 2000);
    o.nick = str(j.nick, 40); o.nickT = num(j.nickT, 0, 0, T_MAX);
    o.created = num(j.created, now(), 0, T_MAX); if (j.updated != null) o.updated = num(j.updated, 0, 0, T_MAX);
    return o;
  };
  /* Teks JSON/objek dari luar → state bersih; null bila tidak terbaca */
  A.parseState = function (remote) { try { const j = typeof remote === 'string' ? JSON.parse(remote) : remote; return isObj(j) ? A.sanitize(j) : null; } catch (e) { return null; } };
  /* ---------- simpan lokal ---------- */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function readState(id) {
    try {
      let raw = lsGet(keyOf(id));
      if (!raw && id === 'pertidaksamaan') raw = lsGet('batas-state-v1'); // migrasi dari versi lama
      const j = JSON.parse(raw || 'null'); if (j && j.v === 1) return A.sanitize(j);
    } catch (e) { }
    return fresh();
  }
  A.S = fresh();
  A.readState = readState;
  /* Pindah kursus aktif: simpan yang lama, muat yang baru, lalu sinkronkan */
  A.useCourse = function (id) {
    if (A.course === id) return;
    if (A.course) { A.flush(); A.sync.push(); }
    A.course = id; A.S = readState(id); A.sync.lastPushed = ''; A.sync.pull();
  };
  A.set = (() => { try { return Object.assign({ theme: 'system', recallAll: false, checklist: true, radar: true, jalur: 'semua', goal: 20 }, JSON.parse(lsGet(SKEY) || lsGet('batas-settings-v1') || '{}')); } catch (e) { return { theme: 'system', recallAll: false, checklist: true, radar: true, jalur: 'semua', goal: 20 }; } })();
  A.saveSettings = () => lsSet(SKEY, JSON.stringify(A.set));
  let saveT = null;
  A.save = function () {
    A.S.updated = now();
    clearTimeout(saveT);
    saveT = setTimeout(() => { if (A.course) lsSet(keyOf(A.course), JSON.stringify(A.S)); A.sync.queue(); }, 250);
  };
  A.flush = () => { clearTimeout(saveT); if (A.course) lsSet(keyOf(A.course), JSON.stringify(A.S)); };

  /* ---------- waktu belajar ---------- */
  let lastTick = 0;
  A.tick = function () {
    const t = now();
    if (lastTick && t - lastTick < 2 * MIN) { const d = A.today(t); A.S.daily[d] = (A.S.daily[d] || 0) + (t - lastTick); }
    lastTick = t;
  };
  A.minutesToday = () => Math.round((A.S.daily[A.today()] || 0) / MIN);
  /* Hari beruntun: hari aktif = belajar ≥ 3 menit atau menjawab ≥ 1 soal. Streak tetap hidup sampai hari ini berakhir.
     Kumpulan hari aktif dihitung sekali (bukan per hari × per jawaban), lalu mundur per tanggal kalender
     (setDate, jam 12 siang) supaya aman dari pergeseran jam musim panas. */
  A.streak = function () {
    const days = new Set();
    for (const [d, v] of Object.entries(A.S.daily || {})) if (v >= 3 * MIN) days.add(d);
    for (const a of A.S.attempts) days.add(A.today(a.t));
    const d = new Date(now()); d.setHours(12, 0, 0, 0);
    if (!days.has(A.today(d.getTime()))) d.setDate(d.getDate() - 1);
    let s = 0; while (s < 5000 && days.has(A.today(d.getTime()))) { s++; d.setDate(d.getDate() - 1); }
    return s;
  };

  /* ---------- jadwal ulang berjarak (ala SM-2, disederhanakan) ----------
     grade: 0 lupa/salah, 1 susah/menebak, 2 ingat, 3 mudah/yakin */
  const IV_MAX = 365;   // jarak review terpanjang (hari)
  A.schedule = function (map, key, grade, extra) {
    const t = now();
    const s = map[key] || { iv: 0, ef: 2.4, n: 0, lapses: 0, due: t, last: 0 };
    if (grade === 0) { s.n = 0; s.iv = 0; s.lapses++; s.ef = Math.max(1.3, s.ef - 0.2); s.due = t + (extra && extra.confident ? 5 : 10) * MIN; }
    else {
      if (grade === 1) { s.iv = Math.max(1, s.iv * 1.2); s.ef = Math.max(1.3, s.ef - 0.15); }
      else if (grade === 2) { s.iv = s.n === 0 ? 1 : s.n === 1 ? 3 : Math.round(s.iv * s.ef); }
      else { s.iv = s.n === 0 ? 2 : s.n === 1 ? 5 : Math.round(s.iv * s.ef * 1.3); s.ef = Math.min(3, s.ef + 0.15); }
      s.iv = Math.min(IV_MAX, Math.max(1, s.iv)); s.n++; s.due = t + s.iv * DAY;
    }
    s.last = t; map[key] = s; return s;
  };
  A.isDue = (s) => s && s.due <= now();

  /* ---------- item: ambil dari bank atau generator ---------- */
  A.item = function (ref) {
    if (!ref) return null;
    if (typeof ref === 'string') {
      if (ref.startsWith('g:')) { const [, g, seed] = ref.split(':'); return C.makeGen(g, +seed); }
      return C.BANK[ref] || null;
    }
    if (ref.gen) return C.makeGen(ref.gen, ref.seed);
    return ref;
  };
  A.schedKey = (it) => it.gen ? 'g:' + it.gen : it.id;
  A.newSeed = () => (Math.floor(Math.random() * 2 ** 31) ^ (now() & 0xffff)) >>> 0;

  /* ---------- mencatat jawaban ---------- */
  A.record = function (it, res) {
    // res: {ok, conf(1..3), ms, ans, trapHit, src}
    const a = { t: now(), i: it.id, s: it.sec || 0, l: it.lvl || 0, ok: res.ok ? 1 : 0, c: res.conf || 2, ms: Math.min(res.ms || 0, 30 * MIN), k: it.concepts || [], src: res.src || 'latihan' };
    if (it.trap) a.tp = it.trap;
    if (res.trapHit) a.th = res.trapHit;
    if (it.pre) a.p = it.pre;
    A.S.attempts.push(a);
    if (A.S.attempts.length > 1400) A.S.attempts.splice(0, A.S.attempts.length - 1400);
    const grade = !res.ok ? 0 : res.conf === 1 ? 1 : res.conf === 2 ? 2 : 3;
    if (res.src !== 'diagnostik') A.schedule(A.S.items, A.schedKey(it), grade, { confident: !res.ok && res.conf === 3 });
    if (!res.ok) {
      A.S.mistakes[it.id] = { t: now(), i: it.id, g: it.gen || null, sd: it.seed || null, a: String(res.ans || '').slice(0, 120), tr: res.trapHit || it.trap || null, y: res.conf === 3 ? 1 : 0, fx: 0, s: it.sec || 0 };
      const keys = Object.keys(A.S.mistakes); if (keys.length > 160) { keys.sort((x, y) => A.S.mistakes[x].t - A.S.mistakes[y].t); keys.slice(0, keys.length - 160).forEach(k => delete A.S.mistakes[k]); }
    } else if (A.S.mistakes[it.id] && res.src === 'kesalahan') { A.S.mistakes[it.id].fx = 1; A.S.mistakes[it.id].t = now(); }
    A.tick(); A.save();
    return a;
  };

  /* ---------- statistik turunan (dihitung dari log, tidak disimpan) ---------- */
  A.stats = function (S) {
    S = S || A.S;
    const conc = {}, traps = {};
    for (const a of S.attempts) {
      for (const k of (a.k || [])) { const c = conc[k] || (conc[k] = { n: 0, m: 0.5, ok: 0 }); c.n++; c.ok += a.ok; c.m = c.m * 0.65 + a.ok * 0.35; }
      if (a.th) { const tr = traps[a.th] || (traps[a.th] = { hits: 0, streak: 0, seen: 0 }); tr.hits++; tr.streak = 0; }
      if (a.tp) { const tr = traps[a.tp] || (traps[a.tp] = { hits: 0, streak: 0, seen: 0 }); tr.seen++; if (a.ok) tr.streak++; else { tr.streak = 0; if (a.th !== a.tp) tr.hits++; } }
    }
    const tot = S.attempts.length, ok = S.attempts.filter(a => a.ok).length;
    const confWrong = S.attempts.filter(a => !a.ok && a.c === 3);
    return { conc, traps, tot, ok, acc: tot ? ok / tot : 0, confWrong };
  };
  A.trapActive = function (trap) { if (!trap || !A.set.radar) return false; const s = A.stats().traps[trap]; return !s || s.streak < 3; };
  A.levelInfo = function (sec, lvl, S) {
    S = S || A.S;
    const at = S.attempts.filter(a => a.s === sec && a.l === lvl && a.src !== 'diagnostik');
    const last = at.slice(-5);
    return { n: at.length, last5: last.filter(a => a.ok).length, lastN: last.length, acc: at.length ? at.filter(a => a.ok).length / at.length : 0 };
  };
  A.levelUnlocked = function (sec, lvl) {
    if (lvl <= 1) return true;
    if (A.S.unlock[sec + ':' + lvl]) return true;
    const p = A.levelInfo(sec, lvl - 1); return p.lastN >= 5 && p.last5 >= 4;
  };
  A.secProgress = function (sec) {
    const st = A.S.sections[sec] || {}; const L = C.LESSONS[sec] || [];
    return { step: st.step || 0, total: L.length, done: !!st.done, started: (st.step || 0) > 0 || !!st.done };
  };
  A.prereqStatus = function (P) {
    const p = A.S.prereq[P]; if (p) return p.st;
    if (A.S.diag.done) { const r = A.S.diag.res[P]; if (r) return r.ok === r.n ? 'lulus' : 'latih'; }
    return 'belum';
  };
  A.dueItems = function () { return Object.keys(A.S.items).filter(k => A.isDue(A.S.items[k])); };
  A.dueCards = function (pool) { return (pool || G.BC.CARDS).filter(c => !A.S.cards[c.id] || A.isDue(A.S.cards[c.id])); };
  A.cardPool = function (all) {
    if (all) return C.CARDS;
    return C.CARDS.filter(c => A.secProgress(c.sec).started);
  };

  /* ---------- ekspor / impor ---------- */
  A.exportCode = function () { const j = JSON.stringify(A.S); return 'BATAS1.' + btoa(unescape(encodeURIComponent(j))); };
  A.decodeCode = function (code) {
    code = String(code || '').trim(); if (!code.startsWith('BATAS1.')) throw new Error('Kode tidak dikenali. Kode diawali dengan BATAS1.');
    let j; try { j = JSON.parse(decodeURIComponent(escape(atob(code.slice(7).replace(/\s+/g, ''))))); } catch (e) { throw new Error('Kode rusak atau terpotong. Salin ulang seluruh kode.'); }
    if (!j || j.v !== 1) throw new Error('Isi kode rusak.'); return A.sanitize(j);
  };

  /* ---------- gabung dua state (HP + laptop) ---------- */
  A.merge = function (a, b) {
    const o = fresh();
    const seen = new Set(); o.attempts = a.attempts.concat(b.attempts).filter(x => { const k = x.t + '|' + x.i; if (seen.has(k)) return false; seen.add(k); return true; }).sort((x, y) => x.t - y.t).slice(-1400);
    const byLast = (m1, m2, f) => { const r = {}; for (const k of new Set(Object.keys(m1 || {}).concat(Object.keys(m2 || {})))) { const x = (m1 || {})[k], y = (m2 || {})[k]; r[k] = !x ? y : !y ? x : ((f(x) >= f(y)) ? x : y); } return r; };
    o.items = byLast(a.items, b.items, s => s.last || 0);
    o.cards = byLast(a.cards, b.cards, s => s.last || 0);
    o.prereq = byLast(a.prereq, b.prereq, s => s.t || 0);
    o.mistakes = byLast(a.mistakes, b.mistakes, s => s.t || 0);
    { const ks = Object.keys(o.mistakes); if (ks.length > 160) ks.sort((x, y) => (o.mistakes[x].t || 0) - (o.mistakes[y].t || 0)).slice(0, ks.length - 160).forEach(k => delete o.mistakes[k]); }
    o.dumps = byLast(a.dumps, b.dumps, s => s.t || 0);
    o.exits = byLast(a.exits, b.exits, s => s.t || 0);
    o.predicts = Object.assign({}, b.predicts, a.predicts);
    o.exDone = Object.assign({}, b.exDone, a.exDone);
    o.unlock = Object.assign({}, b.unlock, a.unlock);
    o.notesRead = Object.assign({}, b.notesRead, a.notesRead);
    o.daily = {}; for (const d of new Set(Object.keys(a.daily).concat(Object.keys(b.daily)))) o.daily[d] = Math.max(a.daily[d] || 0, b.daily[d] || 0);
    o.sections = {}; for (const k of new Set(Object.keys(a.sections).concat(Object.keys(b.sections)))) { const x = a.sections[k] || {}, y = b.sections[k] || {}; o.sections[k] = { step: Math.max(x.step || 0, y.step || 0), done: (x.done || y.done) ? 1 : 0, visited: Object.assign({}, y.visited, x.visited) }; }
    o.diag = (a.diag.t || 0) >= (b.diag.t || 0) ? a.diag : b.diag;
    o.intro = Math.max(a.intro || 0, b.intro || 0);
    if ((a.nickT || 0) >= (b.nickT || 0)) { o.nick = a.nick; o.nickT = a.nickT; } else { o.nick = b.nick; o.nickT = b.nickT; }
    o.created = Math.min(a.created || now(), b.created || now());
    o.updated = Math.max(a.updated || 0, b.updated || 0);
    return o;
  };

  /* ---------- sinkronisasi lewat backend (lokal / Claude / Supabase) ---------- */
  const sync = A.sync = { status: 'lokal', busy: false, pending: false, timer: null, listeners: [], lastPushed: '', notes: [] };
  const BB = () => G.BB;
  sync.on = (fn) => sync.listeners.push(fn);
  const emit = () => sync.listeners.forEach(f => { try { f(); } catch (e) { } });
  A.emit = emit;
  Object.defineProperty(sync, 'owner', { get: () => !!(BB() && BB().isAdmin) });
  Object.defineProperty(sync, 'uid', { get: () => BB() && BB().user ? BB().user.id : null });
  Object.defineProperty(sync, 'online', { get: () => !!(BB() && BB().online) });
  function packState() {
    const S = JSON.parse(JSON.stringify(A.S));
    let s = JSON.stringify(S);
    while (s.length > 230000 && S.attempts.length > 200) { S.attempts.splice(0, 150); s = JSON.stringify(S); }
    return s;
  }
  sync.queue = function () {
    if (!sync.online || !A.course) return;
    sync.pending = true; clearTimeout(sync.timer); sync.timer = setTimeout(sync.push, 2500);
  };
  sync.push = async function () {
    if (!sync.online || !A.course || sync.busy) return;
    const s = packState(); if (s === sync.lastPushed) { sync.pending = false; return; }
    sync.busy = true; sync.status = 'menyimpan'; emit();
    try { await BB().progress.save(A.course, s); sync.lastPushed = s; sync.pending = false; sync.status = 'tersinkron'; }
    catch (e) { sync.status = (e && e.code === 'readonly') ? 'hanya-baca' : 'gagal'; setTimeout(() => sync.pending && sync.push(), 6000 + Math.random() * 4000); }
    sync.busy = false; emit();
  };
  /* Ambil progres dari server lalu gabungkan dengan yang ada di perangkat */
  sync.pull = async function () {
    if (!sync.online || !A.course) { sync.status = sync.online ? 'tersinkron' : 'lokal'; emit(); return; }
    const course = A.course;
    try {
      const remote = await BB().progress.load(course);
      if (course !== A.course) return;
      const r = remote ? A.parseState(remote) : null;
      if (r) { A.S = A.merge(A.S, r); A.flush(); }
      sync.status = 'tersinkron'; emit(); sync.queue();
    } catch (e) { sync.status = 'gagal'; emit(); }
  };
  sync.init = async function () {
    const b = BB(); if (!b) return;
    await b.init();
    sync.status = b.online ? 'tersinkron' : 'lokal';
    if (b.notes && b.notes.watch) b.notes.watch(list => { sync.notes = list || []; emit(); });
    if (b.progress && b.progress.watch) b.progress.watch((course, remote) => {
      if (course !== A.course || !remote) return;
      try { const r = A.parseState(remote); if (!r) return; const m = A.merge(A.S, r); if (m.attempts.length !== A.S.attempts.length || (m.updated || 0) > (A.S.updated || 0)) { A.S = m; A.flush(); emit(); } } catch (e) { }
    });
    emit(); sync.pull();
  };
  sync.sendNote = (sid, text, link) => BB().notes.send(sid, text, link);
  sync.markNoteRead = (id) => BB().notes.markRead && BB().notes.markRead(id);
})(typeof window !== 'undefined' ? window : globalThis);
