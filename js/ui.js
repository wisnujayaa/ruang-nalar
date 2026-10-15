/* Ruang Nalar — antarmuka belajar (halaman kursus, soal, review, flashcard, statistik).
   Halaman platform (beranda katalog, kelas, forum, akun) ada di platform.js dan
   memakai helper yang diekspor lewat G.BU. */
(function (G) {
  'use strict';
  const B = G.BM, C = G.BC, A = G.BA;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = B.esc, rich = B.rich;
  const view = () => $('#view');
  const secMeta = (id) => (C.SECTIONS || []).find(s => s.id === +id) || { id: +id, short: 'Bagian ' + id, title: 'Bagian ' + id, concepts: [] };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { } };
  const LV = { 1: 'Mekanik', 2: 'Konsep', 3: 'Aplikasi', 4: 'Ujian', 5: 'Tantangan', 6: 'Olimpiade' };
  const OKW = ['Tepat!', 'Mantap, benar.', 'Betul!', 'Benar sekali.', 'Yes, tepat.'];
  const BADW = ['Nyaris!', 'Belum tepat.', 'Hampir.', 'Coba cek lagi.', 'Belum, tapi ini berguna.'];
  const info = () => C.INFO || {};
  const hasDiag = () => Object.keys(C.BANK).some(k => k.startsWith('d-'));

  /* ------------------------ ikon kecil ------------------------ */
  const IC = {
    home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>', map: '<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h6a4 4 0 000-8h-2a4 4 0 010-8h6" fill="none"/>',
    review: '<path d="M20 12a8 8 0 11-3-6.2" fill="none"/><path d="M20 4v5h-5" fill="none"/>', cards: '<rect x="3" y="6" width="14" height="14" rx="2" fill="none"/><path d="M7 3h12a2 2 0 012 2v12" fill="none"/>',
    me: '<circle cx="12" cy="8" r="4" fill="none"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6" fill="none"/>', back: '<path d="M15 5l-7 7 7 7" fill="none"/>', x: '<path d="M6 6l12 12M18 6L6 18" fill="none"/>',
    radar: '<circle cx="12" cy="12" r="9" fill="none"/><circle cx="12" cy="12" r="4" fill="none"/><path d="M12 12l6-6" fill="none"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2" fill="none"/><path d="M8 11V8a4 4 0 018 0v3" fill="none"/>',
    flame: '<path d="M12 3c1 4 6 6 6 11a6 6 0 01-12 0c0-3 2-4 3-6 1 2 2 2 3 2 0-3-1-5 0-7z" fill="none"/>', check: '<path d="M5 12l5 5 9-10" fill="none"/>', bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 00-4-10z" fill="none"/>',
    clock: '<circle cx="12" cy="12" r="9" fill="none"/><path d="M12 7v5l3 2" fill="none"/>', send: '<path d="M4 12l16-8-6 16-2-6z" fill="none"/>',
    users: '<circle cx="9" cy="8" r="3.5" fill="none"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5" fill="none"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14.5c2 .7 3.2 2.6 3.6 5.5" fill="none"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z" fill="none"/>', book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z" fill="none"/><path d="M4 19V5" fill="none"/>',
    plus: '<path d="M12 5v14M5 12h14" fill="none"/>', pin: '<path d="M9 3h6l-1 6 4 4H6l4-4zM12 13v8" fill="none"/>', task: '<rect x="4" y="4" width="16" height="16" rx="3" fill="none"/><path d="M8 12l3 3 5-6" fill="none"/>',
    out: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" fill="none"/>', grid: '<rect x="4" y="4" width="7" height="7" rx="1.5" fill="none"/><rect x="13" y="4" width="7" height="7" rx="1.5" fill="none"/><rect x="4" y="13" width="7" height="7" rx="1.5" fill="none"/><rect x="13" y="13" width="7" height="7" rx="1.5" fill="none"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2" fill="none"/><path d="M4 16V5a1 1 0 011-1h11" fill="none"/>', trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" fill="none"/>'
    , flag: '<path d="M5 21V4h11l-2 4 2 4H5" fill="none"/>', trend: '<path d="M3 17l6-6 4 4 8-8" fill="none"/><path d="M15 7h6v6" fill="none"/>', target: '<circle cx="12" cy="12" r="8" fill="none"/><circle cx="12" cy="12" r="3" fill="none"/>'
  };
  const ic = (n, cls) => '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || '') + '</svg>';

  /* ------------------------ kursus aktif ------------------------ */
  async function openCourse(id) {
    await G.NR.load(id);
    A.useCourse(id);
    if (A.set.lastCourse !== id) { A.set.lastCourse = id; A.saveSettings(); }
    return G.NR.current();
  }
  /* Halaman yang butuh kursus aktif */
  const COURSE_VIEWS = new Set(['course', 'map', 'intro', 'diag', 'prereq', 'lesson', 'summary', 'mixed', 'lintas', 'tryout', 'dump', 'traps', 'review', 'run', 'mistakes', 'cards', 'stats']);

  /* ------------------------ navigasi ------------------------ */
  const ROOTS = ['home', 'course', 'review', 'kelas', 'me'];
  const nav = { stack: [], cur: { v: 'home' } };
  /* Riwayat browser: setiap pindah halaman dicatat dengan history.pushState, sehingga tombol Kembali
     di browser/HP berpindah antarhalaman di dalam situs, bukan langsung keluar. history.state hanya
     menyimpan nomor urut + id sesi; isi halamannya (nav.cur) disimpan di memori (HIST). */
  const SID = Math.random().toString(36).slice(2, 10);
  const HIST = []; let pos = 0;
  const hasHist = !!(G.history && G.history.pushState);
  const cleanUrl = () => location.pathname + location.search;
  function record(push) {
    if (!hasHist) return;
    try {
      if (push) { pos++; HIST.length = pos; HIST[pos] = nav.cur; history.pushState({ rn: pos, sid: SID }, '', cleanUrl()); }
      else { HIST[pos] = nav.cur; history.replaceState({ rn: pos, sid: SID }, '', cleanUrl()); }
    } catch (e) { /* mis. dalam iframe tanpa izin: tetap jalan tanpa riwayat */ }
  }
  function stopActive() { if (nav.active && nav.active.cleanup) nav.active.cleanup(); nav.active = null; }
  function go(v, p, opt) {
    stopActive();
    const same = nav.cur.v === v && ['klas', 'login'].includes(v) && (!p || p.id === nav.cur.id);
    const push = !(opt && opt.replace) && !same;
    if (push) nav.stack.push(nav.cur);
    if (ROOTS.includes(v)) nav.stack = [];
    nav.cur = Object.assign({ v }, p || {});
    record(push);
    render();
    try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); }
  }
  /* Tombol kembali di dalam aplikasi = tombol Kembali browser, supaya keduanya selalu seirama */
  function back() {
    if (hasHist && pos > 0 && HIST[pos - 1]) { history.back(); return; }
    const p = nav.stack.pop() || { v: 'home' }; stopActive(); nav.cur = p; record(false); render();
  }
  /* Kembali ke halaman v: pakai riwayat bila halaman sebelumnya memang v, selain itu ganti halaman ini */
  function up(v, p) { if (hasHist && pos > 0 && HIST[pos - 1] && HIST[pos - 1].v === v) history.back(); else go(v, p, { replace: true }); }
  /* #gabung=KODE, #kursus=id, #bagian3 → buka halamannya; false bila hash tidak dikenali */
  function routeHash(hash) {
    const h = decodeURIComponent((hash || '').slice(1));
    let m;
    if ((m = h.match(/^gabung=([A-Za-z0-9]{4,12})$/))) go('kelas', { join: m[1].toUpperCase() });
    else if ((m = h.match(/^kursus=([a-z0-9_-]+)$/)) && (G.NR.isDb(m[1]) || (G.NR.meta(m[1]) && !G.NR.meta(m[1]).soon))) go('course', { course: m[1] });
    else if ((m = h.match(/^bagian(\d{1,2})$/))) go('lesson', { sec: +m[1] });
    else return false;
    return true;
  }
  function onPop(e) {
    const st = e.state;
    if (!st && location.hash && routeHash(location.hash)) return;   // tautan #... dibuka saat situs sudah terbuka
    if (nav.cur.v === 'editor' && G.BE && G.BE.dirty && !confirm('Ada perubahan yang belum disimpan. Tetap keluar?')) {
      try { history.pushState({ rn: pos, sid: SID }, '', cleanUrl()); } catch (er) {} return;
    }
    if (G.BE && nav.cur.v === 'editor') G.BE.dirty = false;
    stopActive();
    if (st && st.sid === SID && HIST[st.rn]) { pos = st.rn; nav.cur = HIST[pos]; }
    else { pos = st && st.sid === SID ? st.rn : 0; nav.cur = { v: 'home' }; HIST[pos] = nav.cur; }   // entri dari sebelum halaman dimuat ulang
    nav.stack = [];
    render();
  }
  const TAB = { home: 'home', course: 'course', map: 'course', intro: 'course', diag: 'course', prereq: 'course', lesson: 'course', summary: 'course', mixed: 'course', lintas: 'course', tryout: 'course', dump: 'course', traps: 'course',
    review: 'review', mistakes: 'review', cards: 'review', kelas: 'kelas', klas: 'kelas', thread: 'kelas', student: 'kelas', me: 'me', settings: 'me', stats: 'me', login: 'me', studio: 'me', editor: 'me', admin: 'me', lapor: 'me', laporan: 'me' };
  function tabOf(v) { return v === 'run' ? (nav.cur.tab === 'map' ? 'course' : nav.cur.tab || 'review') : TAB[v] || 'home'; }
  /* Kursus Studio yang tidak boleh kubuka (draf, khusus kelas, atau sudah dihapus) */
  function lockedHTML() {
    const inUser = G.BB && G.BB.user;
    return '<div class="card locked"><span class="lk-ic">' + ic('lock') + '</span><h2>Kursus ini terkunci</h2><p>Kursus ini hanya bisa dibuka oleh <b>anggota kelas</b> gurunya' + (inUser ? '' : ', jadi kamu perlu masuk dulu') + '. Minta <b>kode kelas</b> ke gurumu, lalu gabung lewat menu Kelas.</p><p class="muted small">Bisa juga kursusnya masih draf atau sudah dihapus.</p><div class="row">' + (inUser ? '<button class="btn primary" data-go="kelas">Gabung kelas</button>' : '<button class="btn primary" data-go="login">Masuk</button>') + '<button class="btn" data-go="home">Ke beranda</button></div></div>';
  }
  let loadingCourse = false;
  function render() {
    const v = nav.cur.v;
    $$('.tabs a').forEach(a => a.setAttribute('aria-current', a.dataset.go === tabOf(v) ? 'page' : 'false'));
    document.body.dataset.view = v;
    if (COURSE_VIEWS.has(v) && (!A.course || nav.cur.course && nav.cur.course !== A.course)) {
      const want = nav.cur.course || A.set.lastCourse || (G.NR.list().find(c => !c.soon && !c.hidden) || {}).id;
      if (!want) { nav.cur = { v: 'home' }; return render(); }
      if (loadingCourse) return;
      loadingCourse = true; view().innerHTML = '<div class="loading"><span class="spin"></span><p class="muted">Memuat kursus…</p></div>';
      openCourse(want).then(() => { loadingCourse = false; render(); }).catch(e => { loadingCourse = false; if (A.set.lastCourse === want) { A.set.lastCourse = null; A.saveSettings(); } view().innerHTML = G.NR.isDb(want) ? lockedHTML() : '<div class="card"><p class="bad">' + esc(e.message) + '</p><button class="btn" data-go="home">Ke beranda</button></div>'; });
      return;
    }
    const fn = V[v] || V.home;
    fn(nav.cur);
    renderTop();
  }
  function renderTop() {
    const st = A.sync.status; const bb = G.BB || {};
    const lab = { 'lokal': bb.mode === 'supabase' ? 'Belum masuk: progres tersimpan di perangkat ini' : 'Tersimpan di perangkat ini', 'tersinkron': 'Tersinkron', 'menyimpan': 'Menyimpan…', 'gagal': 'Gagal sinkron, tersimpan lokal', 'hanya-baca': 'Hanya-baca, tersimpan lokal' }[st] || st;
    const sy = $('#sync'); if (sy) { sy.className = 'sync s-' + st; sy.title = lab; $('#sync-t').textContent = lab; }
    const sk = $('#streak'); if (sk) { sk.innerHTML = ic('flame') + '<b>' + (A.course ? A.streak() : 0) + '</b>'; sk.title = 'Hari beruntun belajar' + (A.course ? ' di kursus ini' : ''); sk.hidden = !A.course; }
    const cc = $('#course-chip'); if (cc) { const m = A.course && G.NR.meta(A.course); cc.hidden = !m; if (m) { cc.textContent = m.brand || m.title; cc.title = 'Kursus aktif: ' + m.title; } }
  }

  /* ======================== KOMPONEN SOAL ======================== */
  function qTags(it) {
    const t = [];
    if (it.sec) t.push('<span class="tag">' + esc(secMeta(it.sec).short) + '</span>'); else if (it.pre) t.push('<span class="tag">Prasyarat ' + it.pre + '</span>');
    if (it.lvl) t.push('<span class="tag t-l' + it.lvl + '">L' + it.lvl + ' · ' + LV[it.lvl] + '</span>');
    if ((it.mode || []).includes('utbk')) t.push('<span class="tag t-utbk">Gaya UTBK</span>');
    if ((it.mode || []).includes('mandiri')) t.push('<span class="tag t-mandiri">Ujian mandiri</span>');
    if ((it.mode || []).includes('olimpiade')) t.push('<span class="tag t-olim">Olimpiade/kuliah</span>');
    if (it.lintas) t.push('<span class="tag t-lintas">Lintas bab</span>');
    return '<div class="tags">' + t.join('') + '</div>';
  }
  /* QComp: render satu soal. opts: {src, tryout, onDone(res), hideSol} */
  /* Dua himpunan sama bentuknya (jenis kurung & jumlah ruas) dan ujung-ujungnya berbeda paling banyak tol */
  function nearSame(s1, s2, tol) {
    const a = B.norm(s1), b = B.norm(s2); if (a.length !== b.length) return false;
    const close = (x, y) => (x === y) || Math.abs(x - y) <= tol;
    return a.every((p, i) => close(p.a, b[i].a) && close(p.b, b[i].b) && p.ca === b[i].ca && p.cb === b[i].cb);
  }
  function QComp(host, it, opts) {
    opts = opts || {};
    const t0 = Date.now();
    const st = { sel: null, conf: null, hints: 0, tf: {}, done: false, revealed: !(it.type === 'mc' && (it.recall || A.set.recallAll) && !opts.tryout) };
    const optsOrder = it.type === 'mc' ? shuffle(it.opts.map((o, i) => i)) : null;
    const ordPool = it.type === 'order' ? shuffle(it.steps.map((x, i) => 's' + i).concat((it.extra || []).map((x, i) => 'e' + i))) : null;
    st.ord = [];
    const ordTxt = (k) => k[0] === 's' ? it.steps[+k.slice(1)] : it.extra[+k.slice(1)];
    const radar = !opts.tryout && it.trap && A.trapActive(it.trap) && C.TRAPS[it.trap];
    const chk = !opts.tryout && A.set.checklist && C.CHECK && C.CHECK[it.sec];
    let html = '<article class="q">' + qTags(it);
    if (radar) html += '<div class="radar">' + ic('radar') + '<span>Radar jebakan: <b>' + esc(C.TRAPS[it.trap].name) + '</b>. Hati-hati di bagian ini.</span></div>';
    html += '<div class="q-text">' + rich(it.q) + '</div><div class="q-body"></div>';
    html += '<div class="q-hint" hidden></div>';
    html += '<fieldset class="conf"><legend>Seberapa yakin kamu?</legend><div class="conf-b">' + [[1, 'Menebak'], [2, 'Agak yakin'], [3, 'Yakin']].map(c => '<button type="button" data-c="' + c[0] + '" aria-pressed="false">' + c[1] + '</button>').join('') + '</div></fieldset>';
    if (chk) html += '<details class="chk"><summary>' + ic('check') + ' Cek 5 detik sebelum kirim</summary><ul>' + C.CHECK[it.sec].map(c => '<li><label><input type="checkbox"> ' + esc(c) + '</label></li>').join('') + '</ul></details>';
    html += '<p class="err" role="alert"></p><div class="q-act">';
    if (!opts.tryout && it.hints && it.hints.length) html += '<button type="button" class="btn ghost" data-q="hint">' + ic('bulb') + ' Petunjuk <span>(' + it.hints.length + ')</span></button>';
    html += '<button type="button" class="btn primary" data-q="submit">' + (opts.tryout ? 'Simpan & lanjut' : 'Periksa') + '</button></div><div class="fb" aria-live="polite"></div></article>';
    host.innerHTML = html;
    const root = host.querySelector('.q'), body = root.querySelector('.q-body'), err = root.querySelector('.err');
    const setErr = (m) => { err.textContent = m || ''; };

    function drawBody() {
      if (it.type === 'mc') {
        if (!st.revealed) {
          body.innerHTML = '<div class="recall"><p>' + ic('bulb') + ' <b>Jawab dulu, pilihan belakangan.</b> Kerjakan di kertas atau tulis jawabanmu di sini, baru buka pilihannya.</p><textarea id="rc-' + it.id.replace(/[^a-z0-9]/gi, '') + '" rows="2" placeholder="Jawabanku…"></textarea><button type="button" class="btn" data-q="reveal">Tampilkan pilihan</button></div>';
          return;
        }
        body.innerHTML = '<div class="opts" role="radiogroup">' + optsOrder.map((oi, k) => '<button type="button" role="radio" class="opt" data-o="' + oi + '" aria-checked="' + (st.sel === oi) + '"><span class="key">' + 'ABCDE'[k] + '</span><span class="ot">' + rich(it.opts[oi].t) + '</span></button>').join('') + '</div>';
      } else if (it.type === 'interval') {
        const id = 'ans-' + it.id.replace(/[^a-z0-9]/gi, '');
        body.innerHTML = '<label class="lbl" for="' + id + '">Jawabanmu' + (it.v && it.v !== 'x' ? ' (dalam ' + it.v + ')' : '') + '</label><input class="ans mono" id="' + id + '" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="(−∞, 2] ∪ (5, ∞)   atau   x ≤ 2 atau x > 5">' +
          '<div class="keys">' + ['(', ')', '[', ']', '∞', '−', ',', '∪', '<', '≤', '>', '≥', (it.v || 'x'), 'atau', 'R', '∅', '⌫'].map(k => '<button type="button" data-k="' + esc(k) + '">' + esc(k) + '</button>').join('') + '</div>' +
          '<div class="preview" aria-live="polite"><span class="muted">Pratinjau garis bilangan muncul saat kamu mengetik.</span></div>';
        const inp = body.querySelector('input');
        const upd = () => { setErr(''); const r = B.parseAnswer(inp.value, it.v); const pv = body.querySelector('.preview'); if (!inp.value.trim()) { pv.innerHTML = '<span class="muted">Pratinjau garis bilangan muncul saat kamu mengetik.</span>'; return; } pv.innerHTML = r.ok ? B.numberLine(r.set) + '<div class="pv-t">' + rich('$' + B.toTex(r.set) + '$') + '</div>' : '<span class="muted">' + esc(r.err) + '</span>'; };
        inp.addEventListener('input', upd);
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
        body.querySelector('.keys').addEventListener('click', e => {
          const b = e.target.closest('button'); if (!b) return; const k = b.dataset.k; const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? s;
          if (k === '⌫') { if (s === en && s > 0) { inp.value = inp.value.slice(0, s - 1) + inp.value.slice(en); inp.setSelectionRange(s - 1, s - 1); } else { inp.value = inp.value.slice(0, s) + inp.value.slice(en); inp.setSelectionRange(s, s); } }
          else { const ins = k === 'atau' ? ' atau ' : k === '∪' ? ' ∪ ' : k === ',' ? ', ' : k; inp.value = inp.value.slice(0, s) + ins + inp.value.slice(en); const p = s + ins.length; inp.setSelectionRange(p, p); }
          inp.focus({ preventScroll: true }); upd();
        });
      } else if (it.type === 'num') {
        const id = 'num-' + it.id.replace(/[^a-z0-9]/gi, '');
        body.innerHTML = '<label class="lbl" for="' + id + '">Jawabanmu' + (it.unit ? ' (' + esc(it.unit) + ')' : '') + '</label><input class="ans mono num" id="' + id + '" inputmode="decimal" autocomplete="off" placeholder="angka">';
        body.querySelector('input').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
        body.querySelector('input').addEventListener('input', () => setErr(''));
      } else if (it.type === 'tf') {
        body.innerHTML = '<div class="tf">' + it.stmts.map((s, i) => '<div class="tf-r"><div class="tf-t">' + rich(s.t) + '</div><div class="tf-b" role="radiogroup" aria-label="Pernyataan ' + (i + 1) + '"><button type="button" data-tf="' + i + ':1" aria-pressed="' + (st.tf[i] === true) + '">Benar</button><button type="button" data-tf="' + i + ':0" aria-pressed="' + (st.tf[i] === false) + '">Salah</button></div></div>').join('') + '</div>';
      } else if (it.type === 'order') {
        const left = ordPool.filter(k => !st.ord.includes(k));
        body.innerHTML = '<div class="ord"><p class="lbl">Buktimu' + (st.ord.length ? ' <span class="muted small">(ketuk langkah untuk mengembalikannya)</span>' : '') + '</p>' +
          (st.ord.length ? '<ol class="ord-ans">' + st.ord.map((k, i) => '<li><button type="button" class="opt" data-ord-rm="' + i + '"><span class="key">' + (i + 1) + '</span><span class="ot">' + rich(ordTxt(k)) + '</span></button></li>').join('') + '</ol>' : '<div class="ord-empty">Ketuk langkah di bawah sesuai urutan yang benar. ' + ((it.extra || []).length ? '<b>Awas:</b> ada langkah pengecoh yang tidak boleh dipakai.' : '') + '</div>') +
          (left.length ? '<p class="lbl">Langkah tersedia</p><div class="ord-pool">' + left.map(k => '<button type="button" class="opt" data-ord-add="' + k + '"><span class="key">+</span><span class="ot">' + rich(ordTxt(k)) + '</span></button>').join('') + '</div>' : '') + '</div>';
      } else if (it.type === 'err') {
        body.innerHTML = '<ol class="errsteps">' + it.steps.map((s, i) => '<li><button type="button" class="opt" data-e="' + i + '" aria-pressed="' + (st.sel === i) + '"><span class="key">' + (i + 1) + '</span><span class="ot">' + rich(s) + '</span></button></li>').join('') + '</ol><p class="muted">Ketuk langkah yang pertama kali salah.</p>';
      }
    }
    drawBody();

    root.addEventListener('click', e => {
      if (st.done) return;
      const b = e.target.closest('button'); if (!b) return;
      A.tick();
      if (b.dataset.q === 'reveal') { st.revealed = true; drawBody(); return; }
      if (b.dataset.ordAdd) { st.ord.push(b.dataset.ordAdd); setErr(''); drawBody(); return; }
      if (b.dataset.ordRm != null) { st.ord.splice(+b.dataset.ordRm, 1); drawBody(); return; }
      if (b.dataset.o != null) { st.sel = +b.dataset.o; setErr(''); $$('.opt', body).forEach(x => x.setAttribute('aria-checked', x === b)); return; }
      if (b.dataset.e != null) { st.sel = +b.dataset.e; setErr(''); $$('.opt', body).forEach(x => x.setAttribute('aria-pressed', x === b)); return; }
      if (b.dataset.tf) { const [i, v] = b.dataset.tf.split(':'); st.tf[+i] = v === '1'; setErr(''); $$('[data-tf^="' + i + ':"]', body).forEach(x => x.setAttribute('aria-pressed', x === b)); return; }
      if (b.dataset.c) { st.conf = +b.dataset.c; setErr(''); $$('.conf-b button', root).forEach(x => x.setAttribute('aria-pressed', x === b)); return; }
      if (b.dataset.q === 'hint') {
        const hb = root.querySelector('.q-hint'); st.hints = Math.min(st.hints + 1, it.hints.length); hb.hidden = false;
        hb.innerHTML = it.hints.slice(0, st.hints).map((x, i) => '<p><b>Petunjuk ' + (i + 1) + '.</b> ' + rich(x) + '</p>').join('');
        const left = it.hints.length - st.hints; b.querySelector('span').textContent = '(' + left + ')'; if (!left) b.disabled = true; return;
      }
      if (b.dataset.q === 'submit') submit();
    });

    function evaluate() {
      if (it.type === 'mc') {
        if (!st.revealed) return { err: 'Buka pilihannya dulu.' };
        if (st.sel == null) return { err: 'Pilih salah satu jawaban dulu.' };
        const o = it.opts[st.sel]; return { ok: !!o.ok, trapHit: o.trap, why: o.why, ans: B.esc(o.t).slice(0, 80) };
      }
      if (it.type === 'interval') {
        const raw = body.querySelector('input').value; if (!raw.trim()) return { err: 'Tulis jawabanmu dulu.' };
        const r = B.parseAnswer(raw, it.v); if (!r.ok) return { err: r.err, trapHit: r.trap };
        const ans = it.ansSet || B.parseSet(it.ans);
        if (B.same(r.set, ans)) return { ok: true, ans: raw, user: r.set };
        // Ujung ditulis sebagai desimal pembulatan (0.67 untuk 2/3): penalarannya benar, jadi beri kesempatan memperbaiki
        if (/\d[.,]\d/.test(raw) && nearSame(r.set, ans, 0.006)) return { err: 'Hampir! Bentuk intervalnya sudah benar, tapi tulis ujungnya sebagai pecahan persis (misalnya 2/3), bukan desimal yang dibulatkan.' };
        for (const w of (it.wrong || [])) { const ws = w.set || B.parseSet(w.a); if (B.same(ws, r.set)) return { ok: false, why: w.why, trapHit: w.trap, ans: raw, user: r.set }; }
        return Object.assign({ ok: false, ans: raw, user: r.set }, diagnose(r.set, ans, it));
      }
      if (it.type === 'num') {
        const raw = body.querySelector('input').value; if (!raw.trim()) return { err: 'Tulis angkanya dulu.' };
        const v = B.evalNum(raw.replace(',', '.')); if (isNaN(v)) return { err: 'Itu belum terbaca sebagai angka. Contoh: 7, −3, 0.5, atau 3/2.' };
        const ok = Math.abs(v - it.ans) <= (it.tol || 1e-9);
        if (!ok) { const w = (it.wrong || []).find(w => Math.abs(w.v - v) < 1e-9); if (w) return { ok, why: w.why, trapHit: w.trap, ans: raw }; }
        return { ok, ans: raw };
      }
      if (it.type === 'tf') {
        if (it.stmts.some((s, i) => st.tf[i] == null)) return { err: 'Tentukan benar/salah untuk semua pernyataan.' };
        const wrong = it.stmts.map((s, i) => st.tf[i] === s.v ? null : i).filter(x => x != null);
        return { ok: !wrong.length, wrongIdx: wrong, ans: it.stmts.map((s, i) => st.tf[i] ? 'B' : 'S').join('') };
      }
      if (it.type === 'order') {
        if (st.ord.length < 2) return { err: 'Susun langkah-langkahnya dulu.' };
        const seq = st.ord.join(','); const good = [it.steps.map((x, i) => 's' + i).join(',')].concat((it.alt || []).map(o => o.map(i => 's' + i).join(',')));
        const ok = good.includes(seq);
        let why = null;
        if (!ok) {
          if (st.ord.some(k => k[0] === 'e')) why = it.why || 'Ada langkah pengecoh yang ikut dipakai.';
          else if (st.ord.length < it.steps.length) why = 'Masih ada langkah yang belum dipakai. Bukti harus lengkap: setiap lompatan perlu alasan.';
          else { const k = st.ord.findIndex((x, i) => x !== 's' + i); why = 'Urutannya mulai keliru di posisi ' + (k + 1) + '. Tanyakan pada setiap langkah: "fakta apa yang sudah kupunya sehingga langkah ini boleh dilakukan?"'; }
        }
        return { ok, why, ans: 'urutan ' + st.ord.map(k => k[0] === 'e' ? 'X' : (+k.slice(1) + 1)).join('-') };
      }
      if (it.type === 'err') {
        if (st.sel == null) return { err: 'Ketuk langkah yang salah dulu.' };
        return { ok: st.sel === it.bad, trapHit: st.sel === it.bad ? null : null, ans: 'langkah ' + (st.sel + 1) };
      }
      return { err: 'Tipe soal tidak dikenal.' };
    }
    function submit() {
      if (st.done) return;
      const r = evaluate(); if (r.err) { setErr(r.err); return; }
      if (st.conf == null) { setErr('Pilih dulu seberapa yakin kamu.'); root.querySelector('.conf').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      st.done = true; root.classList.add('done');
      $$('button, input, textarea', root).forEach(x => { if (!x.closest('.fb')) x.disabled = true; });
      const res = { ok: r.ok, conf: st.conf, ms: Date.now() - t0, ans: r.ans, trapHit: r.trapHit, src: opts.src, hints: st.hints };
      if (!opts.noRecord) A.record(it, res);
      if (opts.tryout) { opts.onDone && opts.onDone(Object.assign({ it, r }, res)); return; }
      showFeedback(r);
      buzz(r.ok ? 12 : [20, 40, 20]);
      opts.onDone && opts.onDone(Object.assign({ it, r }, res), true);
    }
    function showFeedback(r) {
      const fb = root.querySelector('.fb');
      let h = '<div class="fbx ' + (r.ok ? 'good' : 'bad') + '">';
      h += '<p class="verdict">' + (r.ok ? pick(OKW) : pick(BADW)) + '</p>';
      if (!r.ok && r.trapHit && C.TRAPS[r.trapHit]) h += '<p class="trapline">Jebakan: <b>' + esc(C.TRAPS[r.trapHit].name) + '</b></p>';
      if (r.why) h += '<p>' + rich(r.why) + '</p>';
      if (!r.ok && st.conf === 3) h += '<p class="note">' + ic('flame') + ' Salah tapi yakin. Justru ini kesempatan emas: soal ini akan muncul lagi lebih cepat di review supaya ingatanmu dikoreksi.</p>';
      if (r.ok && st.conf === 1) h += '<p class="note">Benar, tapi kamu menebak. Soal serupa tetap dijadwalkan ulang.</p>';
      // jawaban benar
      if (it.type === 'mc') { const c = it.opts.find(o => o.ok); if (!r.ok) h += '<p><b>Jawaban:</b> ' + rich(c.t) + '</p>'; }
      if (it.type === 'interval') { const ans = it.ansSet || B.parseSet(it.ans); h += (r.ok ? '' : '<p><b>Jawaban:</b> ' + rich('$' + B.toTex(ans) + '$') + ' &nbsp;atau&nbsp; ' + rich('$' + B.toIneqTex(ans, it.v) + '$') + '</p>') + B.numberLine(ans); }
      if (it.type === 'num' && !r.ok) h += '<p><b>Jawaban:</b> ' + esc(String(it.ans).replace('.', ',')) + (it.unit ? ' ' + esc(it.unit) : '') + '</p>';
      if (it.type === 'tf') h += '<ul class="tf-fb">' + it.stmts.map((s, i) => '<li class="' + (st.tf[i] === s.v ? 'ok' : 'bad') + '"><b>' + (s.v ? 'Benar' : 'Salah') + '.</b> ' + rich(s.t) + ' — ' + rich(s.why || '') + '</li>').join('') + '</ul>';
      if (it.type === 'err') h += '<p><b>Langkah ' + (it.bad + 1) + ' yang salah.</b> ' + rich(it.why) + '</p>';
      if (it.type === 'order') h += (r.ok ? '' : '<p><b>Urutan yang benar:</b></p>') + (r.ok ? '' : '<ol class="ord-key">' + it.steps.map(x => '<li>' + rich(x) + '</li>').join('') + '</ol>') + ((it.extra || []).length ? '<p class="muted small"><b>Langkah pengecoh:</b> ' + it.extra.map(x => rich(x)).join(' · ') + '</p>' : '');
      if (it.sol && !opts.hideSol) h += '<details class="sol"' + (r.ok ? '' : ' open') + '><summary>Pembahasan</summary><div>' + rich(it.sol) + '</div></details>';
      if (!opts.tryout) h += '<p class="fb-rep"><button type="button" class="linkbtn small" data-rep="soal" data-qid="' + esc(it.id) + '"' + (it.sec ? ' data-sec="' + it.sec + '"' : '') + '>' + ic('flag') + ' Soal, kunci, atau pembahasan ini salah? Laporkan</button></p>';
      h += '</div>';
      fb.innerHTML = h;
      if (it.type === 'err') { const lis = $$('.errsteps .opt', root); lis[it.bad] && lis[it.bad].classList.add('is-bad'); }
      if (it.type === 'order') { const okSeq = r.ok ? st.ord : it.steps.map((x, i) => 's' + i); $$('.ord-ans .opt', root).forEach((x, i) => x.classList.add(st.ord[i] === okSeq[i] ? 'is-ok' : 'is-bad')); }
      if (it.type === 'mc' && st.revealed) { $$('.opt', body).forEach(x => { const o = it.opts[+x.dataset.o]; if (o.ok) x.classList.add('is-ok'); else if (+x.dataset.o === st.sel) x.classList.add('is-bad'); }); }
      if (r.ok) root.classList.add('pop');
    }
    return { submit };
  }
  /* diagnosis otomatis jawaban interval */
  function diagnose(user, ans, it) {
    const sameEnds = (() => { const e = s => B.norm(s).flatMap(p => [p.a, p.b]).filter(isFinite).map(v => B.numTxt(v)).sort().join('|'); return e(user) === e(ans) && e(ans) !== ''; })();
    const strip = s => B.norm(s.map(p => B.I(p.a, p.b, false, false)));
    if (sameEnds && B.same(strip(user), strip(ans))) return { why: 'Daerahnya sudah benar, tapi ada titik ujung yang keliru (penuh/kosong). Masukkan titik ujung itu ke soal asli: apakah memenuhi?', trapHit: 'titik-ujung' };
    const comp = B.complement(ans);
    if (sameEnds && B.same(strip(user), strip(comp))) return { why: 'Arah daerahnya terbalik. Uji satu titik, misalnya $x=' + B.numTex(B.witness(ans)) + '$: titik ini memenuhi soal, tapi tidak ada di jawabanmu.', trapHit: it.trap === 'balik-tanda' || it.trap === 'basis-kecil' ? it.trap : 'arah-daerah' };
    const miss = B.minus(ans, user), extra = B.minus(user, ans);
    let why = '';
    if (extra.length) { const w = B.witness(extra); why += 'Coba $x=' + B.numTex(w) + '$: titik ini ada di jawabanmu, padahal tidak memenuhi soal. '; }
    if (miss.length) { const w = B.witness(miss); why += (why ? 'Lalu ' : 'Coba ') + '$x=' + B.numTex(w) + '$: titik ini memenuhi soal, tapi tidak ada di jawabanmu.'; }
    return { why: why || 'Bandingkan dengan pembahasan di bawah.', trapHit: null };
  }

  /* ======================== RUNNER (sesi soal) ======================== */
  /* refs: array id / {gen, seed}; cfg: {title, src, tryout:{seconds}, until(results), after(results), tab, intro} */
  function startRun(refs, cfg) { go('run', { refs, cfg, tab: cfg.tab }); }
  const V = {};
  V.run = function (p) {
    const cfg = p.cfg || {}, items = (p.refs || []).map(A.item).filter(Boolean);
    const results = []; let idx = 0, timer = null, deadline = cfg.tryout ? Date.now() + cfg.tryout.seconds * 1000 : 0;
    const el = view();
    el.innerHTML = '<section class="run"><header class="run-h"><button class="iconbtn" data-act="back" aria-label="Keluar dari sesi">' + ic('x') + '</button><div class="bar"><span id="run-bar"></span></div><span class="run-n" id="run-n"></span>' + (cfg.tryout ? '<span class="timer" id="run-t">' + ic('clock') + '<b></b></span>' : '') + '</header><h1 class="run-title">' + esc(cfg.title || 'Latihan') + '</h1><div id="run-q"></div><div class="run-next" id="run-next"></div></section>';
    if (!items.length) { $('#run-q').innerHTML = '<div class="empty"><p>Belum ada soal untuk sesi ini.</p><button class="btn" data-act="back">Kembali</button></div>'; return; }
    function bar() { $('#run-bar').style.width = (idx / items.length * 100) + '%'; $('#run-n').textContent = Math.min(idx + 1, items.length) + '/' + items.length; }
    function show() {
      bar(); $('#run-next').innerHTML = '';
      const it = items[idx];
      QComp($('#run-q'), it, {
        src: cfg.src, tryout: !!cfg.tryout, onDone: (res) => {
          results.push(res);
          if (cfg.tryout) { next(); return; }
          const stop = cfg.until && cfg.until(results);
          $('#run-next').innerHTML = '<button class="btn primary wide" id="run-go">' + (stop ? 'Selesai' : idx + 1 < items.length ? 'Lanjut' : 'Lihat hasil') + '</button>';
          const b = $('#run-go'); b.addEventListener('click', () => stop ? finish(stop) : next()); setTimeout(() => b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
        }
      });
    }
    function next() { idx++; if (idx >= items.length) finish(); else { show(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }
    function finish(stopMsg) {
      clearInterval(timer); bar(); $('#run-bar').style.width = '100%';
      const ok = results.filter(r => r.ok).length;
      let h = '<div class="result"><p class="big">' + ok + '<span>/' + results.length + '</span></p><p class="muted">' + (typeof stopMsg === 'string' ? esc(stopMsg) : ok === results.length && results.length ? 'Sempurna. Otakmu sedang menguatkan jalurnya.' : 'Setiap kesalahan sudah masuk Buku kesalahan dan akan muncul lagi di review.') + '</p>';
      if (cfg.tryout) {
        const tm = results.reduce((s, r) => s + r.ms, 0);
        h += '<p class="muted">Waktu: ' + Math.round(tm / 60000) + ' menit · rata-rata ' + Math.round(tm / Math.max(1, results.length) / 1000) + ' detik/soal</p>';
        const byC = {}; results.forEach(r => (r.it.concepts || []).forEach(k => { const c = byC[k] || (byC[k] = { n: 0, ok: 0 }); c.n++; c.ok += r.ok ? 1 : 0; }));
        h += '<div class="chips">' + Object.keys(byC).map(k => '<span class="chip ' + (byC[k].ok === byC[k].n ? 'ok' : byC[k].ok ? 'mid' : 'bad') + '">' + esc(C.CONCEPTS[k] || k) + ' ' + byC[k].ok + '/' + byC[k].n + '</span>').join('') + '</div>';
      }
      h += '<ol class="rlist">' + results.map((r, i) => '<li class="' + (r.ok ? 'ok' : 'bad') + '"><details><summary><span>' + (r.ok ? '✓' : '✗') + '</span> ' + rich(r.it.q.replace(/<[^>]+>/g, '').slice(0, 110)) + (cfg.tryout ? ' <em>' + Math.round(r.ms / 1000) + ' dtk</em>' : '') + '</summary><div class="rdet">' + answerOf(r.it) + (r.it.sol ? '<p>' + rich(r.it.sol) + '</p>' : '') + '</div></details></li>').join('') + '</ol>';
      h += '<div class="row"><button class="btn primary" data-act="back">Selesai</button>' + (results.some(r => !r.ok) ? '<button class="btn" id="run-retry">Ulangi yang salah</button>' : '') + '</div></div>';
      $('#run-q').innerHTML = h; $('#run-next').innerHTML = '';
      const rr = $('#run-retry'); if (rr) rr.addEventListener('click', () => startRun(results.filter(r => !r.ok).map(r => r.it.gen ? { gen: r.it.gen, seed: A.newSeed() } : r.it.id), { title: 'Ulangi yang salah', src: 'kesalahan', tab: cfg.tab }));
      cfg.after && cfg.after(results);
      A.save();
    }
    if (cfg.tryout) {
      const tick = () => { const left = Math.max(0, deadline - Date.now()); const m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60; const t = $('#run-t b'); if (t) t.textContent = m + ':' + String(s).padStart(2, '0'); if (left <= 0) { clearInterval(timer); while (results.length < items.length && idx < items.length) { idx++; } finish('Waktu habis.'); } };
      timer = setInterval(tick, 1000); tick();
    }
    nav.active = { cleanup: () => clearInterval(timer) };
    show();
  };
  function answerOf(it) {
    if (it.type === 'mc') return '<p><b>Jawaban:</b> ' + rich(it.opts.find(o => o.ok).t) + '</p>';
    if (it.type === 'interval') { const s = it.ansSet || B.parseSet(it.ans); return '<p><b>Jawaban:</b> ' + rich('$' + B.toTex(s) + '$') + '</p>' + B.numberLine(s); }
    if (it.type === 'num') return '<p><b>Jawaban:</b> ' + esc(String(it.ans).replace('.', ',')) + '</p>';
    if (it.type === 'tf') return '<ul>' + it.stmts.map(s => '<li><b>' + (s.v ? 'Benar' : 'Salah') + '</b>: ' + rich(s.t) + '</li>').join('') + '</ul>';
    if (it.type === 'err') return '<p><b>Langkah ' + (it.bad + 1) + '</b> salah. ' + rich(it.why) + '</p>';
    if (it.type === 'order') return '<p><b>Urutan bukti:</b></p><ol class="ord-key">' + it.steps.map(x => '<li>' + rich(x) + '</li>').join('') + '</ol>';
    return '';
  }
  /* mini-runner tertanam (di dalam materi) */
  function miniRun(host, refs, cfg) {
    cfg = cfg || {}; const items = refs.map(A.item).filter(Boolean); let i = 0; const res = [];
    host.innerHTML = '<div class="mini"><div class="mini-n"></div><div class="mini-q"></div><div class="mini-next"></div></div>';
    const step = () => {
      if (i >= items.length) { host.querySelector('.mini-q').innerHTML = '<p class="done-msg">' + ic('check') + ' Selesai: ' + res.filter(r => r.ok).length + '/' + res.length + ' benar.</p>'; host.querySelector('.mini-next').innerHTML = ''; host.querySelector('.mini-n').textContent = ''; cfg.after && cfg.after(res); return; }
      host.querySelector('.mini-n').textContent = items.length > 1 ? 'Soal ' + (i + 1) + ' dari ' + items.length : '';
      host.querySelector('.mini-next').innerHTML = '';
      QComp(host.querySelector('.mini-q'), items[i], { src: cfg.src || 'materi', onDone: (r) => { res.push(r); const b = document.createElement('button'); b.className = 'btn'; b.textContent = i + 1 < items.length ? 'Soal berikutnya' : 'Selesai'; b.onclick = () => { i++; step(); }; host.querySelector('.mini-next').appendChild(b); } });
    };
    step();
  }

  /* ======================== PEMILIH SOAL ======================== */
  function bankFor(sec, lvl, mode) {
    return Object.values(C.BANK).filter(q => q.sec === sec && q.lvl === lvl && !/-pre$|-err$/.test(q.id) && !q.id.startsWith('d-') && (!mode || mode === 'semua' || (q.mode || []).includes(mode)));
  }
  function seenCount(id) { return A.S.attempts.filter(a => a.i === id).length; }
  function lastOk(id) { const a = A.S.attempts.filter(a => a.i === id).pop(); return a ? a.ok : null; }
  function buildPractice(sec, lvl, mode, n) {
    n = n || 6;
    let hand = bankFor(sec, lvl, mode);
    hand.sort((a, b) => (seenCount(a.id) - seenCount(b.id)) || ((lastOk(a.id) === 0 ? -1 : 0) - (lastOk(b.id) === 0 ? -1 : 0)) || Math.random() - 0.5);
    const gens = (C.GEN_BY_SEC[sec] || []).filter(g => C.GEN[g].lvl <= lvl && lvl <= 3);
    const out = [];
    const takeHand = lvl >= 4 ? n : Math.min(hand.length, lvl === 1 ? 2 : 3);
    hand.slice(0, takeHand).forEach(q => out.push(q.id));
    let guard = 0;
    while (out.length < n && gens.length && guard++ < 20) out.push({ gen: gens[out.length % gens.length], seed: A.newSeed() });
    if (out.length < n) hand.slice(takeHand).forEach(q => { if (out.length < n) out.push(q.id); });
    return shuffle(out);
  }
  function startedSecs() { return C.SECTIONS.filter(s => A.secProgress(s.id).started).map(s => s.id); }
  function buildMixed(n, secs, lvls, mode) {
    secs = secs && secs.length ? secs : C.SECTIONS.map(s => s.id);
    const pool = Object.values(C.BANK).filter(q => secs.includes(q.sec) && lvls.includes(q.lvl) && !/-pre$/.test(q.id) && !q.id.startsWith('d-') && (!mode || (q.mode || []).includes(mode)));
    const out = []; const per = {};
    shuffle(pool).forEach(q => { if (out.length < n && (per[q.sec] || 0) < Math.ceil(n / secs.length) + 1) { out.push(q.id); per[q.sec] = (per[q.sec] || 0) + 1; } });
    secs.forEach(s => (C.GEN_BY_SEC[s] || []).forEach(g => { if (out.length < n && lvls.some(l => l <= 3)) out.push({ gen: g, seed: A.newSeed() }); }));
    return shuffle(out).slice(0, n);
  }
  function buildReview() {
    const due = A.dueItems().sort((a, b) => A.S.items[a].due - A.S.items[b].due);
    const refs = due.slice(0, 12).map(k => k.startsWith('g:') ? { gen: k.slice(2), seed: A.newSeed() } : k).filter(r => typeof r !== 'string' || C.BANK[r]);
    if (refs.length < 6) {
      const secs = startedSecs();
      if (secs.length) buildMixed(8 - refs.length, secs, [1, 2, 3]).forEach(r => refs.push(r));
    }
    return shuffle(refs).slice(0, 12);
  }

  /* ======================== VIEWS ======================== */
  function nextStep() {
    const S = A.S, I = info();
    if (C.INTRO.length && !S.intro) return { t: 'Mulai dari sini', d: 'Bagian 0: ' + (I.introTitle || 'pengantar'), go: ['intro'] };
    if (hasDiag() && !S.diag.done) return { t: 'Tes diagnostik', d: I.diagDesc || 'Soal singkat untuk memetakan fondasimu', go: ['diag'] };
    const weak = C.PREREQ.find(p => A.prereqStatus(p.id) === 'latih' && (C.GEN_BY_PRE[p.id] || []).length + Object.values(C.BANK).filter(q => q.pre === p.id).length > 0);
    if (weak) return { t: 'Latih prasyarat ' + weak.id, d: weak.title, go: ['prereq', { id: weak.id }] };
    const cur = C.SECTIONS.find(s => { const pr = A.secProgress(s.id); return pr.started && !pr.done; });
    if (cur) return { t: 'Lanjutkan Bagian ' + cur.id, d: cur.title, go: ['lesson', { sec: cur.id, i: A.secProgress(cur.id).step }] };
    const nx = C.SECTIONS.find(s => !A.secProgress(s.id).done && (A.set.jalur === 'semua' || !s.jalur || s.jalur === A.set.jalur || s.jalur === 'campuran'));
    if (nx) return { t: 'Mulai Bagian ' + nx.id, d: nx.title, go: ['lesson', { sec: nx.id, i: 0 }] };
    return { t: 'Tryout', d: 'Semua bagian selesai. Uji dirimu dengan waktu.', go: ['tryout'] };
  }
  /* Halaman kursus: lanjutkan + alat latihan + peta belajar */
  const JALUR = { sekolah: 'Jalur sekolah', ujian: 'Jalur ujian PT', campuran: 'Eksponen: sekolah · Log: ujian PT', tantangan: 'Tantangan: olimpiade & kuliah' };
  V.course = function () {
    const S = A.S, ns = nextStep(), due = A.dueItems().length, dc = A.dueCards(A.cardPool()).length, mk = Object.values(S.mistakes).filter(m => !m.fx).length;
    const min = A.minutesToday(), goal = A.set.goal || 20, pct = Math.min(1, min / goal);
    const meta = G.NR.meta(A.course) || {};
    let h = '<section class="home">';
    h += '<div class="hello"><div><p class="eyebrow"><button class="linkbtn" data-go="home">' + ic('grid') + ' Semua kursus</button></p><h1>' + esc(meta.title || 'Kursus') + '</h1><p class="muted small">' + esc(meta.subject || '') + (meta.level ? ' · ' + esc(meta.level) : '') + '</p></div><div class="ring" role="img" aria-label="' + min + ' dari ' + goal + ' menit hari ini"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" class="ring-bg"/><circle cx="22" cy="22" r="18" class="ring-fg" style="stroke-dasharray:' + (113.1 * pct) + ' 200"/></svg><span><b>' + min + '</b>/' + goal + ' mnt</span></div></div>';
    h += '<button class="cta" data-act="cta"><span class="eyebrow">Lanjutkan</span><span class="cta-t">' + esc(ns.t) + '</span><span class="cta-d">' + esc(ns.d) + '</span><span class="cta-glyph" aria-hidden="true">' + glyphLine() + '</span></button>';
    h += '<div class="tiles">';
    h += tile('review', 'Review harian', due ? due + ' soal jatuh tempo' : 'Campuran soal lama', due ? 'hot' : '');
    h += tile('cards', 'Flashcard', dc + ' kartu siap', '');
    h += tile('mistakes', 'Buku kesalahan', mk + ' belum dikuasai', mk ? 'warn' : '');
    h += tile('tryout', 'Tryout', 'Soal campuran berwaktu', '');
    h += '</div>';
    const st = A.stats();
    const topTrap = Object.entries(st.traps).filter(([, v]) => v.hits).sort((a, b) => b[1].hits - a[1].hits)[0];
    if (topTrap && C.TRAPS[topTrap[0]]) h += '<div class="trapcard"><p class="eyebrow">Jebakan favoritmu</p><p><b>' + esc(C.TRAPS[topTrap[0]].name) + '</b> · kena ' + topTrap[1].hits + '×</p><p class="muted">' + rich(C.TRAPS[topTrap[0]].tip) + '</p></div>';
    h += '</section>' + mapHTML();
    view().innerHTML = h;
  };
  V.map = V.course;
  function greet() { const hr = new Date().getHours(); return hr < 11 ? 'Selamat pagi' : hr < 15 ? 'Selamat siang' : hr < 19 ? 'Selamat sore' : 'Selamat malam'; }
  function tile(act, t, d, cls) { return '<button class="tile ' + (cls || '') + '" data-go="' + act + '"><span class="tile-t">' + t + '</span><span class="tile-d">' + d + '</span></button>'; }
  function glyphLine() { return '<svg viewBox="0 0 120 24"><line x1="4" y1="12" x2="116" y2="12"/><circle cx="34" cy="12" r="5" class="h"/><line x1="34" y1="12" x2="88" y2="12" class="s"/><circle cx="88" cy="12" r="5" class="f"/></svg>'; }

  function mapHTML() {
    const S = A.S, jal = A.set.jalur;
    const jalurs = Array.from(new Set(C.SECTIONS.map(s => s.jalur).filter(Boolean)));
    let h = '<section class="map" id="peta"><h2 class="h1like">Peta belajar</h2>';
    if (jalurs.includes('sekolah') && jalurs.includes('ujian')) {
      h += '<div class="seg" role="radiogroup" aria-label="Jalur">' + [['semua', 'Semua'], ['sekolah', 'Jalur sekolah'], ['ujian', 'Jalur ujian PT']].map(j => '<button role="radio" data-act="jalur" data-j="' + j[0] + '" aria-checked="' + (jal === j[0]) + '">' + j[1] + '</button>').join('') + '</div>';
      h += '<p class="muted small">Jalur sekolah: materi yang umumnya ada di kelas X. Jalur ujian PT: materi tambahan yang sering keluar di UTBK dan ujian mandiri.</p>';
    }
    h += '<ol class="path">';
    if (C.INTRO.length) h += pathItem('intro', 0, info().introTitle || 'Pengantar', S.intro ? 'done' : 'now', '0');
    if (hasDiag()) h += pathItem('diag', 0, 'Tes diagnostik prasyarat', S.diag.done ? 'done' : S.intro ? 'now' : '', 'D');
    if (C.PREREQ.length) h += '<li class="pre"><p class="eyebrow">Prasyarat</p><div class="pregrid">' + C.PREREQ.map(p => { const s = A.prereqStatus(p.id); return '<button class="pre-b s-' + s + '" data-go="prereq" data-id="' + p.id + '"><b>' + p.id + '</b><span>' + esc(p.title) + '</span><em>' + ({ lulus: 'lulus', latih: 'perlu latihan', belum: 'belum dites' })[s] + '</em></button>'; }).join('') + '</div></li>';
    const st = A.stats();
    C.SECTIONS.forEach(s => {
      if (jal !== 'semua' && s.jalur && s.jalur !== jal && s.jalur !== 'campuran' && !(jal === 'ujian' && s.jalur === 'tantangan')) return;
      const pr = A.secProgress(s.id);
      const ms = (s.concepts || []).map(k => st.conc[k]).filter(Boolean); const m = ms.length ? ms.reduce((a, c) => a + c.m, 0) / ms.length : null;
      h += '<li class="sec ' + (pr.done ? 'done' : pr.started ? 'now' : '') + '"><button data-go="lesson" data-sec="' + s.id + '"><span class="num">' + s.id + '</span><span class="sec-g" aria-hidden="true">' + esc(s.glyph || '') + '</span><span class="sec-t"><b>' + esc(s.title) + '</b><small>' + (s.jalur && JALUR[s.jalur] ? JALUR[s.jalur] + ' · ' : '') + (C.LESSONS[s.id] || []).length + ' subbab</small></span><span class="sec-p"><i style="width:' + (pr.done ? 100 : Math.round(pr.step / Math.max(1, pr.total - 1) * 100)) + '%"></i></span>' + (m != null ? '<span class="mast" title="Penguasaan">' + Math.round(m * 100) + '%</span>' : '') + '</button></li>';
    });
    const nL = Object.values(C.BANK).filter(q => q.lintas).length;
    h += '<li class="end"><p class="eyebrow">Penutup</p><div class="tiles">' + (C.SUMMARY ? tile('summary', 'Ringkasan', 'Isi dulu, baru buka') : '') + tile('mixed', 'Latihan campuran', '12 soal acak dari banyak bab') + (nL ? tile('lintas', 'Soal lintas bab', nL + ' soal gabungan beberapa bab') : '') + tile('tryout', 'Tryout', 'Berwaktu, level ujian') + (C.SUMMARY ? tile('dump', 'Brain dump', 'Tulis semua yang kamu ingat') : '') + (Object.keys(C.TRAPS).length ? tile('traps', 'Katalog jebakan', Object.keys(C.TRAPS).length + ' jebakan umum') : '') + '</div></li>';
    return h + '</ol></section>';
  }
  function pathItem(go, _, t, cls, num) { return '<li class="sec ' + cls + '"><button data-go="' + go + '"><span class="num">' + num + '</span><span class="sec-t"><b>' + esc(t) + '</b></span></button></li>'; }

  /* ---------- Bagian 0 & materi (stepper) ---------- */
  V.intro = function (p) { lessonView(0, p.i || 0); };
  V.lesson = function (p) { lessonView(+p.sec, p.i != null ? +p.i : A.secProgress(+p.sec).step); };
  const GRP = { pemanasan: 'Pemanasan', materi: 'Materi', contoh: 'Contoh', ringkas: 'Rangkuman & jebakan', latihan: 'Latihan', sumber: 'Sumber belajar' };
  function grpOf(b) {
    if (b.k === 'retrieval') return 'pemanasan';
    if (b.k === 'q') return /Pemburu/.test(b.tag || '') ? 'ringkas' : 'pemanasan';
    if (b.k === 'example') return 'contoh';
    if (b.k === 'recap' || b.k === 'traps') return 'ringkas';
    if (b.k === 'practice' || b.k === 'exit') return 'latihan';
    if (b.k === 'res') return 'sumber';
    return 'materi';
  }
  function lessonView(sec, i) {
    const L = sec === 0 ? C.INTRO : C.LESSONS[sec]; i = Math.max(0, Math.min(i, L.length - 1));
    if (sec) { const s = A.S.sections[sec] || (A.S.sections[sec] = { step: 0, done: 0 }); s.visited = s.visited || {}; s.visited[i] = 1; s.step = Math.max(s.step || 0, i); A.save(); }
    const blk = L[i]; const meta = sec ? secMeta(sec) : { title: info().introTitle || 'Pengantar' };
    const visited = sec ? ((A.S.sections[sec] || {}).visited || {}) : {};
    const goBtn = (k, cls, label) => '<button class="' + cls + '" data-act="les-go" data-sec="' + sec + '" data-i="' + k + '">' + label + '</button>';
    // daftar isi berkelompok
    let toc = '', lastG = null; const seenG = {};
    L.forEach((b, k) => {
      const g = grpOf(b);
      if (g !== lastG) { toc += (lastG ? '</ol>' : '') + '<p class="toc-g">' + GRP[g] + (seenG[g] ? ' lanjutan' : '') + '</p><ol class="toc-l">'; seenG[g] = 1; lastG = g; }
      toc += '<li><button class="toc-i' + (k === i ? ' cur' : '') + (visited[k] || k < i ? ' seen' : '') + '" data-act="les-go" data-sec="' + sec + '" data-i="' + k + '"' + (k === i ? ' aria-current="step"' : '') + '><span class="toc-n">' + (k + 1) + '</span><span>' + rich(blkName(b)) + '</span></button></li>';
    });
    toc += '</ol>';
    const wide = (() => { try { return matchMedia('(min-width: 960px)').matches; } catch (e) { return false; } })();
    const jumps = sec ? [['latihan', 'Latihan'], ['sumber', 'Sumber belajar']].map(([g, lab]) => { const k = L.findIndex(b => grpOf(b) === g); return k >= 0 ? goBtn(k, 'chipbtn' + (grpOf(blk) === g ? ' on' : ''), lab) : ''; }).join('') : '';
    let h = '<section class="lesson"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div class="les-ht"><p class="eyebrow">' + (sec ? 'Bagian ' + sec + ' · ' + GRP[grpOf(blk)] : 'Bagian 0') + '</p><h1>' + esc(meta.title) + '</h1><div class="les-prog"><span class="bar"><span style="width:' + Math.round((i + 1) / L.length * 100) + '%"></span></span><span class="muted small">Subbab ' + (i + 1) + ' dari ' + L.length + '</span>' + jumps + '</div></div></header>';
    h += '<div class="les-grid"><aside class="toc"><details class="toc-d"' + (wide ? ' open' : '') + '><summary><span>Daftar isi</span><b>' + (i + 1) + '. ' + rich(blkName(blk)) + '</b></summary><nav aria-label="Daftar isi bagian">' + toc + '</nav></details></aside><div class="les-main">';
    h += '<div class="card blk" id="blk"></div>';
    const prev = i > 0 ? goBtn(i - 1, 'btn les-prev', '<span class="muted small">Sebelumnya</span><span>' + rich(blkName(L[i - 1])) + '</span>') : '<span></span>';
    const next = i < L.length - 1 ? goBtn(i + 1, 'btn primary les-next', '<span class="small">Lanjut</span><span>' + rich(blkName(L[i + 1])) + '</span>') : (sec === 0 ? '<button class="btn primary" data-act="intro-done">' + (hasDiag() ? 'Ke tes diagnostik' : 'Mulai belajar') + '</button>' : '<button class="btn primary" data-go="course">Ke peta belajar</button>');
    h += '<nav class="les-nav">' + prev + next + '</nav><p class="fb-rep"><button type="button" class="linkbtn small" data-rep="materi" data-sec="' + sec + '" data-i="' + i + '">' + ic('flag') + ' Ada yang salah atau membingungkan di materi ini? Laporkan</button></p></div></div></section>';
    view().innerHTML = h;
    renderBlock($('#blk'), blk, sec, i);
  }
  function blkName(b) { return b.title || ({ retrieval: 'Pemanasan ingatan', q: 'Coba dulu', traps: 'Awas jebakan', practice: 'Latihan bertingkat', exit: 'Tiket keluar', res: 'Sumber belajar', recap: 'Rangkuman mini' })[b.k] || b.k; }
  function tagHead(tag, title) { return '<p class="ctag ctag-' + (tag || '').toLowerCase().replace(/[^a-z]+/g, '-') + '">' + esc(tag || '') + '</p>' + (title ? '<h2>' + rich(title) + '</h2>' : ''); }
  function renderBlock(el, b, sec, i) {
    if (b.k === 'text') { el.innerHTML = tagHead(b.tag, b.title) + '<div class="prose">' + rich(b.html) + '</div>'; return; }
    if (b.k === 'q') { el.innerHTML = tagHead(b.tag, b.title) + (b.note ? '<p class="muted">' + esc(b.note) + '</p>' : '') + '<div class="slot"></div>'; miniRun($('.slot', el), [b.id], { src: 'materi' }); return; }
    if (b.k === 'widget') {
      const key = sec + ':' + i; const pr = b.predict; const got = A.S.predicts[key];
      el.innerHTML = tagHead(b.tag || 'Eksperimen', b.title) + (pr ? '<div class="predict"><p class="eyebrow">Tebak dulu</p><p>' + rich(pr.q) + '</p><div class="popts">' + pr.opts.map((o, k) => '<button class="btn" data-act="predict" data-key="' + key + '" data-k="' + k + '"' + (got != null ? ' disabled' : '') + ' aria-pressed="' + (got === k) + '">' + rich(o) + '</button>').join('') + '</div><div class="pfb"></div></div>' : '') + '<div class="widget" ' + (pr && got == null ? 'hidden' : '') + '></div>';
      const showW = () => { const w = $('.widget', el); w.hidden = false; if (!w.dataset.m) { w.dataset.m = 1; if (b.lib && G.NalarWidgets) G.NalarWidgets.mount(b.lib, w, b.params); else if (C.WIDGETS && C.WIDGETS.mount) C.WIDGETS.mount(b.id, w); else w.innerHTML = '<p class="muted">Widget tidak tersedia.</p>'; } if (pr) $('.pfb', el).innerHTML = '<p class="' + (A.S.predicts[key] === pr.ans ? 'ok' : 'flip') + '">' + (A.S.predicts[key] === pr.ans ? 'Tebakanmu tepat! ' : 'Jawabannya: <b>' + rich(pr.opts[pr.ans]) + '</b>. ') + esc(pr.after || '') + '</p>'; };
      el.querySelector('.popts') && el.querySelector('.popts').addEventListener('click', e => { const bt = e.target.closest('button'); if (!bt) return; A.S.predicts[key] = +bt.dataset.k; A.save(); $$('.popts button', el).forEach(x => { x.disabled = true; x.setAttribute('aria-pressed', x === bt); }); showW(); });
      if (!pr || got != null) showW();
      return;
    }
    if (b.k === 'example') {
      const key = sec + ':' + i;
      let h = tagHead(b.tag, b.title) + '<div class="problem">' + rich(b.problem) + '</div><ol class="exsteps">';
      b.steps.forEach((s, k) => {
        const open = !s.hide || (A.S.exDone[key] || {})[k];
        h += '<li class="' + (s.hide ? 'fade' : '') + '" data-k="' + k + '">' + (open ? '<div class="st">' + rich(s.t) + '</div>' : '<div class="ask"><p>' + rich(s.ask || 'Apa langkah berikutnya?') + '</p><textarea rows="2" aria-label="Jawabanmu untuk langkah ' + (k + 1) + '" placeholder="Tulis di sini atau di kertas…"></textarea><button class="btn small" data-act="ex-open" data-key="' + key + '" data-k="' + k + '">Tampilkan langkah</button></div>') + '</li>';
      });
      h += '</ol>' + (b.nl ? '<div class="exnl">' + B.numberLine(B.parseSet(b.nl)) + '</div>' : '');
      el.innerHTML = h;
      el.addEventListener('click', e => {
        const bt = e.target.closest('[data-act="ex-open"]'); if (!bt) return;
        const k = +bt.dataset.k; const li = bt.closest('li'); const s = b.steps[k];
        (A.S.exDone[key] = A.S.exDone[key] || {})[k] = 1; A.tick(); A.save();
        li.innerHTML = '<div class="st reveal">' + rich(s.t) + '</div><div class="self"><span class="muted">Sama dengan punyamu?</span><button class="btn small" data-self="1">Sama</button><button class="btn small ghost" data-self="0">Beda</button></div>';
        li.querySelector('.self').addEventListener('click', ev => { const sb = ev.target.closest('button'); if (!sb) return; li.querySelector('.self').innerHTML = sb.dataset.self === '1' ? '<span class="ok">' + ic('check') + ' Bagus.</span>' : '<span class="muted">Tidak apa-apa. Baca langkahnya pelan-pelan, lalu coba lagi soal berikutnya.</span>'; });
      });
      return;
    }
    if (b.k === 'traps') {
      const st = A.stats().traps;
      el.innerHTML = tagHead('Awas jebakan', 'Jebakan yang paling sering menjebak') + '<div class="traplist">' + b.ids.map(id => { const t = C.TRAPS[id]; const s = st[id]; return '<div class="trap"><p class="tn">' + esc(t.name) + (s && s.hits ? ' <span class="chip bad">kamu kena ' + s.hits + '×</span>' : '') + '</p><p class="tw"><span>Salah</span>' + rich(t.wrong) + '</p><p class="tr"><span>Benar</span>' + rich(t.right) + '</p><p class="tt">' + rich(t.tip) + '</p></div>'; }).join('') + '</div>';
      return;
    }
    if (b.k === 'retrieval') {
      const refs = retrievalFor(sec);
      if (!refs.length) { el.innerHTML = tagHead('Pemanasan ingatan', 'Siap mulai') + '<p class="muted">Belum ada materi sebelumnya untuk diingat. Langsung lanjut ke subbab berikutnya.</p>'; return; }
      el.innerHTML = tagHead('Pemanasan ingatan', 'Sebelum mulai, ingat-ingat dulu') + '<p class="muted">Mengingat sebelum belajar hal baru membuat materi lama makin awet. Dua soal singkat saja.</p><div class="slot"></div>';
      miniRun($('.slot', el), refs, { src: 'review' }); return;
    }
    if (b.k === 'practice') { practicePanel(el, sec); return; }
    if (b.k === 'recap') { el.innerHTML = tagHead('Rangkuman', b.title) + '<p class="muted">Baca sekali, lalu tutup mata dan coba sebutkan ulang. Mengingat lebih ampuh daripada membaca ulang.</p><ul class="recap">' + b.items.map(x => '<li>' + ic('check') + '<span>' + rich(x) + '</span></li>').join('') + '</ul>'; return; }
    if (b.k === 'res') {
      const list = (C.RES[sec] || []).concat(C.RES_GENERAL || []);
      const TY = { artikel: 'Artikel', video: 'Video', alat: 'Alat', buku: 'Buku/PDF' };
      el.innerHTML = tagHead('Sumber belajar', 'Perdalam dengan sumber lain') + '<p class="muted">Belajar dari beberapa penjelasan berbeda membantu konsep makin kokoh. Tautan dibuka di tab baru. Video pencarian YouTube sudah diberi kata kunci yang tepat; pilih yang dari kanal pendidikan.</p><ul class="res">' + list.map(r => '<li><a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer"><span class="rt rt-' + r.type + '">' + TY[r.type] + '</span><span class="rti">' + esc(r.title) + '</span><span class="rs">' + esc(r.src) + (r.note ? ' · ' + esc(r.note) : '') + '</span></a></li>').join('') + '</ul>';
      return;
    }
    if (b.k === 'exit') {
      const key = 's' + sec; const ex = A.S.exits[key];
      el.innerHTML = tagHead('Tiket keluar', 'Tiga soal + satu penjelasan') + '<div class="slot"></div><div class="explain"><label for="ex-' + sec + '"><b>Jelaskan dengan kata-katamu sendiri.</b> ' + esc(b.prompt) + '</label><textarea id="ex-' + sec + '" rows="4">' + esc(ex ? ex.text : '') + '</textarea><div class="pts" hidden><p class="eyebrow">Bandingkan dengan poin kunci</p>' + b.points.map((p, k) => '<label><input type="checkbox" data-pt="' + k + '"> ' + esc(p) + '</label>').join('') + '</div><p class="err" role="alert"></p><div class="row"><button class="btn" data-act="exit-cmp">Bandingkan</button><button class="btn primary" data-act="exit-done" data-sec="' + sec + '">Selesaikan Bagian ' + sec + '</button></div></div>';
      miniRun($('.slot', el), b.qs, { src: 'materi' });
      el.addEventListener('click', e => {
        const bt = e.target.closest('button'); if (!bt) return;
        if (bt.dataset.act === 'exit-cmp') { $('.pts', el).hidden = false; }
        if (bt.dataset.act === 'exit-done') {
          const txt = $('textarea', el).value.trim(); if (txt.length < 15) { $('.err', el).textContent = 'Tulis penjelasan singkat dulu (minimal satu kalimat). Menjelaskan adalah cara terbaik menguji pemahaman.'; return; }
          A.S.exits[key] = { t: Date.now(), text: txt.slice(0, 1200), pts: $$('[data-pt]:checked', el).length };
          A.S.sections[sec] = Object.assign(A.S.sections[sec] || {}, { done: 1 }); A.save();
          el.innerHTML = '<div class="donebox">' + ic('check') + '<h2>Bagian ' + sec + ' selesai!</h2><p>Kartu-kartu bagian ini sudah masuk ke Flashcard, dan soal-soalnya akan muncul lagi di Review harian.</p><div class="row"><button class="btn primary" data-go="course">Ke peta</button>' + (C.SECTIONS.some(x => x.id === sec + 1) ? '<button class="btn" data-go="lesson" data-sec="' + (sec + 1) + '">Bagian ' + (sec + 1) + '</button>' : '') + '</div></div>';
        }
      });
      return;
    }
    el.innerHTML = '<p>Blok tidak dikenal.</p>';
  }
  function retrievalFor(sec) {
    if (sec <= 1) return ['d-P1b', 'd-P2'].filter(k => C.BANK[k]);
    const prev = [];
    for (let s = sec - 1; s >= 1 && prev.length < 2; s--) {
      const cands = Object.values(C.BANK).filter(q => q.sec === s && q.lvl <= 2 && !/-pre$|-err$/.test(q.id));
      const pk = shuffle(cands)[0]; if (pk) prev.push(pk.id);
    }
    return prev;
  }
  function practicePanel(el, sec) {
    const mode = nav.pmode || 'semua';
    let h = tagHead('Latihan bertingkat', 'Dari mekanik sampai level ujian') + '<p class="muted">Level berikutnya terbuka setelah 4 dari 5 soal terakhir benar. Boleh juga dibuka paksa.</p>';
    h += '<div class="seg small" role="radiogroup" aria-label="Mode soal">' + [['semua', 'Semua'], ['sekolah', 'Ulangan'], ['utbk', 'UTBK'], ['mandiri', 'Mandiri'], ['olimpiade', 'Olimpiade']].map(m => '<button role="radio" data-act="pmode" data-m="' + m[0] + '" data-sec="' + sec + '" aria-checked="' + (mode === m[0]) + '">' + m[1] + '</button>').join('') + '</div><div class="levels">';
    for (let l = 1; l <= 6; l++) {
      const li = A.levelInfo(sec, l), un = A.levelUnlocked(sec, l), cnt = bankFor(sec, l, mode).length + ((C.GEN_BY_SEC[sec] || []).some(g => C.GEN[g].lvl <= l) && l <= 3 ? 99 : 0);
      h += '<div class="lv ' + (un ? '' : 'locked') + '"><div class="lv-h"><b>L' + l + '</b><span>' + LV[l] + '</span></div><div class="lv-bar" aria-label="' + li.last5 + ' dari ' + li.lastN + ' benar"><i style="width:' + (li.lastN ? li.last5 / 5 * 100 : 0) + '%"></i></div><p class="muted small">' + (li.n ? li.n + ' dijawab · ' + Math.round(li.acc * 100) + '% benar' : 'belum dicoba') + '</p>' +
        (cnt ? (un ? '<button class="btn small primary" data-act="practice" data-sec="' + sec + '" data-l="' + l + '">Mulai</button>' : '<button class="btn small ghost" data-act="unlock" data-sec="' + sec + '" data-l="' + l + '">' + ic('lock') + ' Buka paksa</button>') : '<p class="muted small">Belum ada soal untuk mode ini.</p>') + '</div>';
    }
    el.innerHTML = h + '</div>';
  }

  /* ---------- diagnostik & prasyarat ---------- */
  V.diag = function () {
    const S = A.S;
    let h = '<section class="page"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div><p class="eyebrow">Fondasi</p><h1>Tes diagnostik</h1></div></header><div class="card">';
    if (S.diag.done) {
      h += '<p>Hasil tesmu. Prasyarat berwarna oranye perlu dilatih dulu.</p><div class="pregrid">' + C.PREREQ.map(p => { const s = A.prereqStatus(p.id); const r = S.diag.res[p.id]; return '<button class="pre-b s-' + s + '" data-go="prereq" data-id="' + p.id + '"><b>' + p.id + '</b><span>' + esc(p.title) + '</span><em>' + (r ? r.ok + '/' + r.n : '') + ' · ' + ({ lulus: 'lulus', latih: 'perlu latihan', belum: '' })[s] + '</em></button>'; }).join('') + '</div><div class="row"><button class="btn" data-act="diag-start">Ulangi tes</button><button class="btn primary" data-act="cta">Lanjut</button></div>';
    } else h += '<p>16 soal singkat, sekitar 10 menit. Tidak ada nilai: hasilnya hanya menentukan prasyarat mana yang perlu dilatih. Jawab jujur, termasuk tingkat keyakinanmu. Kalau tidak tahu, pilih "Menebak".</p><button class="btn primary" data-act="diag-start">Mulai tes</button>';
    view().innerHTML = h + '</div></section>';
  };
  V.prereq = function (p) {
    const P = C.PREREQ.find(x => x.id === p.id); if (!P) return V.map();
    const s = A.prereqStatus(P.id);
    view().innerHTML = '<section class="page"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div><p class="eyebrow">Prasyarat ' + P.id + ' · ' + ({ lulus: 'lulus', latih: 'perlu latihan', belum: 'belum dites' })[s] + '</p><h1>' + esc(P.title) + '</h1></div></header>' +
      '<div class="card"><p class="ctag ctag-kenapa-begitu-">Kenapa perlu?</p><p>' + rich(P.why) + '</p><div class="prose">' + rich(P.html) + '</div></div>' +
      '<div class="card"><h2>Drill</h2><p class="muted">Soal terus berganti sampai kamu benar 4 dari 5 soal terakhir (maksimal 12 soal).</p><button class="btn primary" data-act="drill" data-id="' + P.id + '">Mulai drill</button></div></section>';
  };
  function drillRefs(P) {
    const gens = C.GEN_BY_PRE[P] || []; const hand = Object.values(C.BANK).filter(q => q.pre === P).map(q => q.id);
    const out = []; for (let k = 0; k < 12; k++) { if (gens.length && (k % 3 !== 2 || !hand.length)) out.push({ gen: gens[k % gens.length], seed: A.newSeed() }); else if (hand.length) out.push(hand[k % hand.length]); }
    return out.length ? out : hand;
  }

  /* ---------- review, campuran, tryout ---------- */
  V.review = function () {
    const due = A.dueItems().length, refs = buildReview();
    view().innerHTML = '<section class="page"><h1>Review harian</h1><div class="card"><p class="big2">' + due + '</p><p>soal jatuh tempo hari ini' + (due < 6 ? ', ditambah soal campuran dari bagian yang sudah kamu buka' : '') + '.</p><p class="muted">Soal dicampur dari banyak bab (interleaving). Rasanya lebih berat daripada latihan per bab, dan justru itulah yang membuat ingatan bertahan lama.</p>' + (refs.length ? '<button class="btn primary" data-act="review-start">Mulai review (' + refs.length + ' soal)</button>' : '<p class="muted">Belum ada yang bisa direview. Mulai dulu salah satu bagian materi.</p><button class="btn" data-go="map">Ke peta belajar</button>') + '</div>' +
      '<div class="tiles">' + tile('mistakes', 'Buku kesalahan', Object.values(A.S.mistakes).filter(m => !m.fx).length + ' belum dikuasai') + tile('dump', 'Brain dump', 'Tulis semua yang kamu ingat') + tile('mixed', 'Latihan campuran', '12 soal lintas bab') + tile('traps', 'Katalog jebakan', 'Kenali polanya') + '</div></section>';
  };
  V.mixed = function () {
    view().innerHTML = '<section class="page"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div><p class="eyebrow">Penutup</p><h1>Latihan campuran</h1></div></header><div class="card"><p>12 soal dari berbagai bab, dicampur acak. Tantangan utamanya bukan menghitung, melainkan <b>mengenali tipe soal</b> tanpa petunjuk bab.</p><label class="lbl">Ambil dari</label><div class="seg" role="radiogroup">' + [['started', 'Bagian yang sudah dibuka'], ['all', 'Semua bagian']].map((m, k) => '<button role="radio" data-act="mix-scope" data-m="' + m[0] + '" aria-checked="' + ((nav.mixScope || 'started') === m[0]) + '">' + m[1] + '</button>').join('') + '</div><button class="btn primary" data-act="mix-start">Mulai</button></div></section>';
  };
  V.lintas = function () {
    const items = Object.values(C.BANK).filter(q => q.lintas);
    view().innerHTML = '<section class="page"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div><p class="eyebrow">Penutup</p><h1>Soal lintas bab</h1></div></header><div class="card"><p>Setiap soal di sini menggabungkan <b>dua bab atau lebih</b>, misalnya domain fungsi yang memuat akar sekaligus pecahan, atau logaritma yang bertemu nilai mutlak. Ini gaya favorit UTBK (Pengetahuan Kuantitatif) dan ujian mandiri.</p><p class="muted">Kuncinya: pecah soal menjadi syarat-syarat kecil, selesaikan masing-masing, lalu iris.</p><button class="btn primary" data-act="lintas-start">Mulai 10 soal acak</button></div><div class="card"><h2>Yang akan kamu temui</h2><div class="chips">' + Array.from(new Set(items.flatMap(q => q.concepts.filter(k => k !== 'lintas')))).map(k => '<span class="chip">' + esc(C.CONCEPTS[k] || k) + '</span>').join('') + '</div></div></section>';
  };
  V.tryout = function () {
    const f = nav.toFocus || 'utbk';
    view().innerHTML = '<section class="page"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div><p class="eyebrow">Simulasi</p><h1>Tryout</h1></div></header><div class="card"><p>15 soal, 30 menit. Tidak ada petunjuk dan pembahasan sampai selesai, persis seperti ujian.</p><label class="lbl">Fokus</label><div class="seg wrap" role="radiogroup">' + [['utbk', 'Gaya UTBK'], ['mandiri', 'Ujian mandiri'], ['sekolah', 'Ulangan sekolah'], ['olimpiade', 'Olimpiade/kuliah']].map(m => '<button role="radio" data-act="to-focus" data-m="' + m[0] + '" aria-checked="' + (f === m[0]) + '">' + m[1] + '</button>').join('') + '</div><p class="muted small">Strategi: kerjakan yang mudah dulu, pakai uji titik untuk mengeliminasi pilihan, dan jangan terpaku lebih dari 3 menit di satu soal.</p><button class="btn primary" data-act="to-start">Mulai tryout</button></div></section>';
  };

  /* ---------- flashcard ---------- */
  V.cards = function () {
    const deck = nav.deck || 'due';
    const pool = deck === 'all' ? C.CARDS : deck === 'opened' ? A.cardPool() : deck === 'due' ? A.dueCards(A.cardPool()) : C.CARDS.filter(c => c.sec === +deck);
    const list = deck === 'due' ? pool : shuffle(pool);
    let h = '<section class="page"><h1>Flashcard</h1><div class="seg wrap" role="radiogroup" aria-label="Pilih dek">' + [['due', 'Jatuh tempo (' + A.dueCards(A.cardPool()).length + ')'], ['opened', 'Bagian yang dibuka'], ['all', 'Semua']].map(d => '<button role="radio" data-act="deck" data-d="' + d[0] + '" aria-checked="' + (deck === d[0]) + '">' + d[1] + '</button>').join('') + '</div>';
    h += '<div class="seg wrap small" role="radiogroup" aria-label="Per bagian">' + C.SECTIONS.map(s => '<button role="radio" data-act="deck" data-d="' + s.id + '" aria-checked="' + (deck === String(s.id)) + '">' + s.id + '</button>').join('') + '</div>';
    if (!list.length) h += '<div class="card empty"><p>' + (deck === 'due' ? (A.cardPool().length ? 'Semua kartu sudah direview. Kembali besok!' : 'Kartu muncul setelah kamu membuka bagian materi. Atau pilih "Semua".') : 'Tidak ada kartu.') + '</p></div>';
    else h += '<div id="fc"></div>';
    view().innerHTML = h + '</section>';
    if (list.length) flash($('#fc'), list);
  };
  function flash(host, list) {
    let i = 0, flipped = false;
    const draw = () => {
      if (i >= list.length) { host.innerHTML = '<div class="card empty"><p>' + ic('check') + ' Dek selesai: ' + list.length + ' kartu.</p><button class="btn" data-go="cards">Muat ulang dek</button></div>'; return; }
      const c = list[i]; flipped = false;
      host.innerHTML = '<p class="muted center">' + (i + 1) + ' / ' + list.length + ' · Bagian ' + c.sec + ' · ' + esc(c.kind) + '</p><button class="flash" aria-live="polite"><div class="ff">' + rich(c.f) + '<span class="muted small">Ingat-ingat dulu, lalu ketuk untuk membalik</span></div></button><div class="rate" hidden><button class="btn r0" data-r="0">Lupa</button><button class="btn r1" data-r="1">Susah</button><button class="btn r2" data-r="2">Ingat</button><button class="btn r3" data-r="3">Mudah</button></div>';
      const fc = host.querySelector('.flash');
      fc.addEventListener('click', () => { if (flipped) return; flipped = true; A.tick(); fc.classList.add('flipped'); fc.innerHTML = '<div class="fb2"><div class="muted small">' + rich(c.f) + '</div><div class="fa">' + rich(c.b) + '</div>' + (c.nl ? B.numberLine(B.parseSet(c.nl)) : '') + '</div>'; host.querySelector('.rate').hidden = false; });
      host.querySelector('.rate').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; A.schedule(A.S.cards, c.id, +b.dataset.r); A.tick(); A.save(); i++; draw(); });
    };
    draw();
  }

  /* ---------- buku kesalahan ---------- */
  V.mistakes = function () {
    const all = Object.values(A.S.mistakes).sort((a, b) => b.t - a.t); const f = nav.mf || 'open';
    const list = all.filter(m => f === 'open' ? !m.fx : m.fx);
    let h = '<section class="page"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div><p class="eyebrow">Review</p><h1>Buku kesalahan</h1></div></header>';
    h += '<div class="seg" role="radiogroup">' + [['open', 'Belum dikuasai (' + all.filter(m => !m.fx).length + ')'], ['fixed', 'Sudah dikuasai (' + all.filter(m => m.fx).length + ')']].map(x => '<button role="radio" data-act="mf" data-f="' + x[0] + '" aria-checked="' + (f === x[0]) + '">' + x[1] + '</button>').join('') + '</div>';
    if (f === 'open' && list.length) h += '<button class="btn primary" data-act="mist-run">Latih ulang semua (' + Math.min(list.length, 12) + ')</button><p class="muted small">Soal acak akan muncul dengan angka baru, jadi kamu benar-benar menguji konsepnya, bukan menghafal jawabannya.</p>';
    if (!list.length) h += '<div class="card empty"><p>' + (f === 'open' ? 'Belum ada kesalahan tercatat. Kesalahan itu informasi, bukan hukuman. Nanti mereka berkumpul di sini.' : 'Belum ada.') + '</p></div>';
    h += '<ul class="mlist">' + list.map(m => { const it = A.item(m.g ? { gen: m.g, seed: m.sd } : m.i); if (!it) return ''; return '<li class="card"><div class="mh">' + (m.y ? '<span class="chip flip">salah tapi yakin</span>' : '') + (m.tr && C.TRAPS[m.tr] ? '<span class="chip bad">' + esc(C.TRAPS[m.tr].name) + '</span>' : '') + '<span class="muted small">' + new Date(m.t).toLocaleDateString('id-ID') + '</span></div><div class="mq">' + rich(it.q) + '</div><p class="small"><span class="muted">Jawabanmu:</span> <span class="mono">' + (m.a.includes('$') ? rich(m.a) : esc(m.a)) + '</span></p><details><summary>Lihat jawaban & pembahasan</summary>' + answerOf(it) + (it.sol ? '<p>' + rich(it.sol) + '</p>' : '') + '</details>' + (f === 'open' ? '<div class="row"><button class="btn small" data-act="mist-one" data-id="' + esc(m.i) + '">Latih soal ini</button><button class="btn small ghost" data-act="mist-fix" data-id="' + esc(m.i) + '">Tandai paham</button></div>' : '') + '</li>'; }).join('') + '</ul></section>';
    view().innerHTML = h;
  };
  function mistakeRef(m) { return m.g ? { gen: m.g, seed: A.newSeed() } : m.i; }

  /* ---------- ringkasan, brain dump, katalog jebakan ---------- */
  V.summary = function () {
    let h = '<section class="page"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div><p class="eyebrow">Penutup</p><h1>Ringkasan</h1></div></header><p class="muted">Jangan langsung dibaca! Untuk tiap kotak tertutup, tebak dulu isinya di kepala, baru ketuk untuk membuka.</p><div class="sumgrid">';
    (C.SUMMARY || []).forEach(s => {
      h += '<div class="card sum"><p class="eyebrow">Bagian ' + s.sec + '</p><h2>' + esc(s.type) + '</h2>' + [['Langkah pertama', s.first], ['Aturan inti', s.key], ['Jebakan utama', s.trap]].map(r => '<button class="cover" data-act="uncover"><span class="cl">' + r[0] + '</span><span class="cv">' + esc(r[1]) + '</span><span class="cq">ketuk untuk buka</span></button>').join('') + '</div>';
    });
    view().innerHTML = h + '</div><div class="card"><h2>Peta keputusan: soal ini tipe apa?</h2><ol class="steps"><li>Ada <b>akar</b>? Tulis syarat isi akar dulu (Bagian 6).</li><li>Ada <b>nilai mutlak</b>? Baca sebagai jarak (Bagian 7).</li><li>Ada <b>log</b> atau pangkat bervariabel? Syarat numerus, samakan basis (Bagian 8).</li><li>Ada <b>x di penyebut</b>? Jangan kali silang, satukan pecahan (Bagian 5).</li><li>Polinomial? Nolkan, faktorkan, tabel tanda (Bagian 3–4).</li><li>Linear? Isolasi x, hati-hati tanda negatif (Bagian 2).</li></ol></div></section>';
  };
  V.dump = function () {
    const sec = nav.dsec || 1; const prev = A.S.dumps['s' + sec]; const S2 = (C.SUMMARY || []).find(s => s.sec === sec) || { points: [] };
    view().innerHTML = '<section class="page"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div><p class="eyebrow">Retrieval practice</p><h1>Brain dump</h1></div></header><div class="card"><p>Pilih topik, lalu tulis <b>semua</b> yang kamu ingat tanpa melihat catatan: aturan, langkah, contoh, jebakan. Sekitar 3 menit. Setelah itu bandingkan dengan poin kunci.</p><div class="seg wrap small" role="radiogroup">' + C.SECTIONS.map(s => '<button role="radio" data-act="dsec" data-s="' + s.id + '" aria-checked="' + (sec === s.id) + '">' + s.id + ' · ' + esc(s.short) + '</button>').join('') + '</div><label class="lbl" for="dump-t">Yang kuingat tentang ' + esc(secMeta(sec).short) + '</label><textarea id="dump-t" rows="8" placeholder="Tulis apa saja…">' + esc(prev ? prev.text : '') + '</textarea><p class="err" role="alert"></p><button class="btn primary" data-act="dump-cmp">Bandingkan dengan poin kunci</button><div class="pts" id="dump-p" hidden><p class="eyebrow">Centang yang sudah kamu tulis</p>' + S2.points.map((p, k) => '<label><input type="checkbox" data-pt="' + k + '"> ' + esc(p) + '</label>').join('') + '<button class="btn" data-act="dump-save" data-s="' + sec + '">Simpan</button></div>' + (prev ? '<p class="muted small">Terakhir: ' + new Date(prev.t).toLocaleDateString('id-ID') + ' · ' + prev.got + '/' + S2.points.length + ' poin</p>' : '') + '</div></section>';
  };
  V.traps = function () {
    const st = A.stats().traps;
    const ids = Object.keys(C.TRAPS).sort((a, b) => ((st[b] || {}).hits || 0) - ((st[a] || {}).hits || 0) || C.TRAPS[a].sec - C.TRAPS[b].sec);
    view().innerHTML = '<section class="page"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div><p class="eyebrow">Ketelitian</p><h1>Katalog jebakan</h1></div></header><p class="muted">Kesalahan karena tidak teliti itu berpola. Yang paling sering menjebakmu ada di atas. Ikon radar di soal akan memudar setelah kamu benar 3× berturut-turut pada jebakan itu.</p><div class="traplist">' + ids.map(id => { const t = C.TRAPS[id], s = st[id] || {}; return '<div class="trap card"><p class="tn">' + esc(t.name) + ' <span class="muted small">' + (t.sec ? 'Bagian ' + t.sec : 'Umum') + '</span>' + (s.hits ? ' <span class="chip bad">kena ' + s.hits + '×</span>' : '') + (s.streak >= 3 ? ' <span class="chip ok">radar mati</span>' : '') + '</p><p class="tw"><span>Salah</span>' + rich(t.wrong) + '</p><p class="tr"><span>Benar</span>' + rich(t.right) + '</p><p class="tt">' + rich(t.tip) + '</p></div>'; }).join('') + '</div></section>';
  };

  /* ---------- statistik / saya / dashboard ---------- */
  /* Dashboard statistik ada di js/stats.js */
  function statsHTML(S, opt) { return G.NalarStats ? G.NalarStats.html(S, opt) : ''; }
  function streakOf(S) { const save = A.S; A.S = S; const s = A.streak(); A.S = save; return s; }
  V.stats = function () {
    const meta = G.NR.meta(A.course) || {};
    view().innerHTML = '<section class="page"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div><p class="eyebrow">Statistik</p><h1>' + esc(meta.title || 'Kursus') + '</h1></div></header>' + statsHTML(A.S) + '</section>';
  };
  /* Nama yang ditampilkan: akun online > nama di pengaturan > nama lama di progres */
  A.displayName = () => { const bb = G.BB || {}; return (bb.mode !== 'local' && bb.user && bb.user.name) || A.set.name || A.S.nick || ''; };
  V.settings = function () {
    const s = A.set; const sy = A.sync; const bb = G.BB || {};
    const syncTxt = {
      'lokal': bb.mode === 'supabase' ? 'Kamu belum masuk. Progres tersimpan di perangkat ini dan otomatis digabung ke akunmu setelah masuk.' : bb.mode === 'claude' ? 'Progres tersimpan di perangkat ini saja.' : 'Mode tanpa server: progres tersimpan di browser ini saja. Pemilik situs bisa menghubungkan Supabase (lihat README) supaya akun, kelas, dan forum bisa dipakai bersama.',
      'tersinkron': 'Tersinkron ke akunmu. Perangkat lain yang masuk dengan akun yang sama memakai progres yang sama.', 'menyimpan': 'Sedang menyimpan…',
      'gagal': 'Sinkronisasi gagal sementara. Progres aman di perangkat ini dan akan dicoba lagi.', 'hanya-baca': 'Akunmu hanya bisa melihat, belum bisa menyimpan.' }[sy.status];
    const meta = A.course && G.NR.meta(A.course);
    view().innerHTML = '<section class="page"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div><h1>Pengaturan</h1></div></header>' +
      '<div class="card form"><label class="lbl" for="nick">Nama yang ditampilkan</label><input id="nick" value="' + esc(A.displayName()) + '" maxlength="40" placeholder="misalnya: Dika">' +
      '<label class="lbl">Tema</label><div class="seg" role="radiogroup">' + [['system', 'Ikuti sistem'], ['light', 'Terang'], ['dark', 'Gelap']].map(t => '<button role="radio" data-act="theme" data-t="' + t[0] + '" aria-checked="' + (s.theme === t[0]) + '">' + t[1] + '</button>').join('') + '</div>' +
      '<label class="lbl" for="goal">Target menit per hari</label><input id="goal" type="number" min="5" max="120" value="' + (s.goal || 20) + '">' +
      '<label class="tog"><input type="checkbox" id="recallAll"' + (s.recallAll ? ' checked' : '') + '> <span><b>Jawab dulu, pilihan belakangan</b> untuk semua soal pilihan ganda</span></label>' +
      '<label class="tog"><input type="checkbox" id="checklist"' + (s.checklist ? ' checked' : '') + '> <span><b>Cek 5 detik</b> sebelum mengirim jawaban</span></label>' +
      '<label class="tog"><input type="checkbox" id="radar"' + (s.radar ? ' checked' : '') + '> <span><b>Radar jebakan</b> (memudar otomatis setelah dikuasai)</span></label><button class="btn primary" data-act="set-save">Simpan</button><p class="ok small" id="set-ok" aria-live="polite"></p></div>' +
      '<div class="card"><h2>Sinkronisasi</h2><p><span class="sync s-' + sy.status + '"><i></i></span> ' + esc(syncTxt) + '</p></div>' +
      (meta ? '<div class="card"><h2>Kode progres · ' + esc(meta.title) + '</h2><p class="muted">Cadangan manual, atau kirim ke guru/kakak lewat WhatsApp kalau belum memakai akun. Tempelkan kode di perangkat lain untuk menggabungkan progres.</p><div class="row"><button class="btn" data-act="exp">Buat kode</button></div><textarea id="code" rows="3" class="mono small" placeholder="Tempel kode BATAS1… di sini untuk impor"></textarea><div class="row"><button class="btn" data-act="copy">Salin</button><button class="btn" data-act="imp">Impor & gabungkan</button></div><p class="small" id="code-m" aria-live="polite"></p></div>' +
      '<div class="card"><h2>Mulai dari awal</h2><p class="muted">Menghapus semua progres kursus <b>' + esc(meta.title) + '</b> di perangkat ini' + (sy.online ? ' dan di akunmu' : '') + '.</p><div id="rst"><button class="btn danger" data-act="reset1">Hapus progres kursus ini</button></div></div>' : '<p class="muted small">Buka salah satu kursus untuk melihat kode progres dan opsi hapus progres.</p>') + '</section>';
  };
  /* ======================== AKSI ======================== */
  document.addEventListener('click', async (e) => {
    const g = e.target.closest('[data-go]');
    if (g && !g.disabled) { e.preventDefault(); A.tick(); const d = g.dataset; const v = d.go; const p = {}; if (d.sec) p.sec = +d.sec; if (d.id) p.id = d.id; if (d.course) p.course = d.course; if (d.tab) p.ktab = d.tab; if (d.f) p.f = d.f; if (v === 'lesson' && (!d.course || d.course === A.course)) p.i = A.secProgress(+d.sec).step; go(v, p); return; }
    const a = e.target.closest('[data-act]'); if (!a || a.disabled) return;
    const d = a.dataset; A.tick();
    switch (d.act) {
      case 'back': back(); break;
      case 'cta': { const ns = nextStep(); go(ns.go[0], ns.go[1]); break; }
      case 'les-go': { const sec = +d.sec, i = +d.i; if (sec === 0) go('intro', { i }, { replace: true }); else go('lesson', { sec, i }, { replace: true }); break; }
      case 'intro-done': A.S.intro = 1; A.save(); go(hasDiag() ? 'diag' : 'course', {}, { replace: true }); break;
      case 'jalur': A.set.jalur = d.j; A.saveSettings(); render(); break;
      case 'pmode': nav.pmode = d.m; practicePanel($('#blk'), +d.sec); break;
      case 'unlock': A.S.unlock[d.sec + ':' + d.l] = 1; A.save(); practicePanel($('#blk'), +d.sec); break;
      case 'practice': { const sec = +d.sec, l = +d.l; startRun(buildPractice(sec, l, nav.pmode || 'semua'), { title: 'Bagian ' + sec + ' · L' + l + ' ' + LV[l], src: 'latihan', tab: 'map' }); break; }
      case 'diag-start': startRun(Object.values(C.BANK).filter(q => q.id.startsWith('d-')).map(q => q.id), { title: 'Tes diagnostik', src: 'diagnostik', tab: 'map', after: (res) => {
        const r = {}; res.forEach(x => { const P = x.it.pre; const o = r[P] || (r[P] = { n: 0, ok: 0 }); o.n++; o.ok += (x.ok && x.conf > 1) ? 1 : 0; });
        A.S.diag = { done: 1, t: Date.now(), res: r }; Object.keys(r).forEach(P => { A.S.prereq[P] = { st: r[P].ok === r[P].n ? 'lulus' : 'latih', t: Date.now() }; }); A.save();
      } }); break;
      case 'drill': { const P = d.id; startRun(drillRefs(P), { title: 'Drill ' + P, src: 'drill', tab: 'map', until: (res) => { const l5 = res.slice(-5); return l5.length >= 5 && l5.filter(x => x.ok).length >= 4 ? 'Lulus! 4 dari 5 soal terakhir benar.' : false; }, after: (res) => { const l5 = res.slice(-5); A.S.prereq[P] = { st: l5.length >= 5 && l5.filter(x => x.ok).length >= 4 ? 'lulus' : 'latih', t: Date.now() }; A.save(); } }); break; }
      case 'predict': break;
      case 'review-start': startRun(buildReview(), { title: 'Review harian', src: 'review', tab: 'review' }); break;
      case 'mix-scope': nav.mixScope = d.m; render(); break;
      case 'mix-start': { const secs = (nav.mixScope || 'started') === 'started' ? startedSecs() : C.SECTIONS.map(s => s.id); startRun(buildMixed(12, secs.length ? secs : [1, 2, 3], [2, 3, 4]), { title: 'Latihan campuran', src: 'campuran', tab: 'map' }); break; }
      case 'to-focus': nav.toFocus = d.m; render(); break;
      case 'lintas-start': startRun(shuffle(shuffle(Object.values(C.BANK).filter(q => q.lintas).map(q => q.id)).slice(0, 7).concat((info().lintasGens || []).filter(g => C.GEN[g]).map(g => ({ gen: g, seed: A.newSeed() })))), { title: 'Soal lintas bab', src: 'campuran', tab: 'map' }); break;
      case 'to-start': { const f = nav.toFocus || 'utbk'; let refs = buildMixed(15, C.SECTIONS.map(s => s.id), f === 'sekolah' ? [2, 3, 4] : f === 'olimpiade' ? [5, 6] : [3, 4, 5], f === 'sekolah' ? null : f); if (refs.length < 15) buildMixed(15 - refs.length, C.SECTIONS.map(s => s.id), [3, 4]).forEach(r => refs.push(r)); startRun(refs.slice(0, 15), { title: 'Tryout · ' + ({ utbk: 'Gaya UTBK', mandiri: 'Ujian mandiri', sekolah: 'Ulangan', olimpiade: 'Olimpiade/kuliah' })[f], src: 'tryout', tryout: { seconds: 30 * 60 }, tab: 'map' }); break; }
      case 'deck': nav.deck = d.d; render(); break;
      case 'mf': nav.mf = d.f; render(); break;
      case 'mist-run': { const ms = Object.values(A.S.mistakes).filter(m => !m.fx).sort((x, y) => x.t - y.t).slice(0, 12); startRun(ms.map(mistakeRef), { title: 'Latih ulang kesalahan', src: 'kesalahan', tab: 'review', after: (res) => { res.forEach(r => { if (r.ok) { const m = A.S.mistakes[r.it.id] || Object.values(A.S.mistakes).find(x => x.g && x.g === r.it.gen && !x.fx); if (m) { m.fx = 1; m.t = Date.now(); } } }); A.save(); } }); break; }
      case 'mist-one': { const m = A.S.mistakes[d.id]; if (m) startRun([mistakeRef(m)], { title: 'Latih ulang', src: 'kesalahan', tab: 'review', after: (res) => { if (res[0] && res[0].ok) { m.fx = 1; m.t = Date.now(); A.save(); } } }); break; }
      case 'mist-fix': { const m = A.S.mistakes[d.id]; if (m) { m.fx = 1; m.t = Date.now(); A.save(); render(); } break; }
      case 'uncover': a.classList.add('open'); break;
      case 'dsec': nav.dsec = +d.s; render(); break;
      case 'dump-cmp': { const t = $('#dump-t').value.trim(); if (t.length < 10) { $('.err').textContent = 'Tulis dulu apa yang kamu ingat, minimal satu kalimat.'; return; } $('.err').textContent = ''; $('#dump-p').hidden = false; break; }
      case 'dump-save': { const sec = +d.s; A.S.dumps['s' + sec] = { t: Date.now(), text: $('#dump-t').value.slice(0, 2000), got: $$('#dump-p [data-pt]:checked').length }; A.save(); render(); break; }
      case 'theme': A.set.theme = d.t; A.saveSettings(); applyTheme(); render(); break;
      case 'set-save': { const n = $('#nick').value.trim().slice(0, 40); if (n !== A.set.name) { A.set.name = n; if (G.BB && G.BB.setName && n) { try { await G.BB.setName(n); } catch (err) { } } } if (A.course && n !== A.S.nick) { A.S.nick = n; A.S.nickT = Date.now(); } A.set.goal = Math.max(5, Math.min(120, +$('#goal').value || 20)); A.set.recallAll = $('#recallAll').checked; A.set.checklist = $('#checklist').checked; A.set.radar = $('#radar').checked; A.saveSettings(); A.save(); $('#set-ok').textContent = 'Tersimpan.'; break; }
      case 'exp': $('#code').value = A.exportCode(); $('#code-m').textContent = 'Kode dibuat. Salin dan simpan atau kirim ke kakak.'; break;
      case 'copy': { const v = $('#code').value; try { await navigator.clipboard.writeText(v); $('#code-m').textContent = 'Tersalin.'; } catch (err) { $('#code').select(); $('#code-m').textContent = 'Tekan salin (Ctrl+C) untuk menyalin teks yang terpilih.'; } break; }
      case 'imp': { try { const st = A.decodeCode($('#code').value); A.S = A.merge(A.S, st); A.save(); $('#code-m').textContent = 'Berhasil digabungkan: ' + st.attempts.length + ' jawaban dari kode.'; } catch (err) { $('#code-m').textContent = err.message; } break; }
      case 'reset1': $('#rst').innerHTML = '<p class="bad">Yakin? Semua progres akan hilang dan tidak bisa dikembalikan.</p><div class="row"><button class="btn danger" data-act="reset2">Ya, hapus semua</button><button class="btn" data-act="reset0">Batal</button></div>'; break;
      case 'reset0': render(); break;
      case 'reset2': { const ns = A.fresh(); ns.nick = A.S.nick; ns.nickT = Date.now(); ns.resetAt = Date.now(); A.S = ns; A.flush(); A.sync.lastPushed = ''; A.sync.queue(); go('course'); break; }
    }
  });

  /* ======================== TEMA & BOOT ======================== */
  function applyTheme() { const t = A.set.theme; if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }
  /* Jalankan target tugas/pesan, misalnya {kind:'practice', sec:5, lvl:3}. Kursus harus sudah aktif. */
  function doTarget(t) {
    t = t || {};
    if (t.kind === 'lesson' && secMeta(t.sec)) return go('lesson', { sec: +t.sec });
    if (t.kind === 'practice') return startRun(buildPractice(+t.sec, +t.lvl, 'semua'), { title: 'Bagian ' + t.sec + ' · L' + t.lvl + ' ' + LV[t.lvl], src: 'latihan', tab: 'course' });
    if (t.kind === 'prereq') return go('prereq', { id: t.id });
    if (['diag', 'review', 'tryout', 'mixed', 'lintas', 'cards', 'mistakes', 'summary', 'dump'].includes(t.kind)) return go(t.kind);
    go('course');
  }
  /* Dipakai platform.js */
  Object.assign(G.BU = G.BU || {}, { QComp, go, back, up, render, renderTop, V, nav, ic, esc, rich, $, $$, view, statsHTML, openCourse, tile, LV, secMeta, shuffle, greet, startRun, applyTheme, COURSE_VIEWS, doTarget, hasDiag });

  function boot() {
    applyTheme();
    const h0 = location.hash;
    if (hasHist) { record(false); window.addEventListener('popstate', onPop); }
    let lastUid = undefined;
    A.sync.on(() => {
      renderTop();
      const uid = A.sync.uid;
      if (uid !== lastUid) {
        const first = lastUid === undefined; lastUid = uid;
        if (!first && A.sync.online) A.sync.pull();
        if (!first) G.NR.refreshRemote().then(() => { if (['home', 'me', 'kelas', 'studio'].includes(nav.cur.v)) render(); });
        if (['home', 'me', 'kelas', 'klas', 'login', 'settings', 'thread', 'studio', 'editor'].includes(nav.cur.v)) render();
        return;
      }
      if (nav.cur.v === 'home' || nav.cur.v === 'settings') render();
    });
    // Pilih backend: Supabase (bila dikonfigurasi) atau lokal; di claude.ai, tunggu runtime Artifact muncul
    const start = () => A.sync.init().catch(e => { console.error(e); A.sync.status = 'lokal'; renderTop(); })
      .then(() => G.NR.refreshRemote()).then(() => { if (['home', 'me', 'kelas', 'studio'].includes(nav.cur.v)) render(); });
    const cfg = G.NALAR_CONFIG || {};
    if (G.BB.mode === 'local' && !(cfg.supabaseUrl && cfg.supabaseAnonKey) && G.NALAR_makeClaude) {
      const tryClaude = (n) => {
        if (G.claude && G.claude.use) { G.BB = G.NALAR_makeClaude(); start(); }
        else if (n < 5) setTimeout(() => tryClaude(n + 1), 300 * (n + 1));
        else start();
      };
      tryClaude(0);
    } else start();
    window.addEventListener('pagehide', A.flush);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { A.flush(); A.sync.push(); } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.cur.v !== 'home') { const t = e.target; if (!t.matches || !t.matches('input,textarea,select')) back(); } });
    // Tautan langsung: #gabung=KODE, #kursus=id, #bagian3 (hash dibaca sebelum riwayat menghapusnya dari URL)
    if (!routeHash(h0)) render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof window !== 'undefined' ? window : globalThis);
