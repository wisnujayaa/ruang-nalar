/* Ruang Nalar — halaman platform: beranda katalog, akun, kelas, tugas, forum diskusi, laporan siswa.
   Semua data lewat G.BB (backend.js), jadi halaman ini sama untuk mode lokal, Claude, dan Supabase. */
(function (G) {
  'use strict';
  const A = G.BA, C = G.BC, U = G.BU, NR = G.NR;
  const { go, back, render, V, nav, ic, esc, rich, $, $$, view, statsHTML, openCourse, greet } = U;
  const bb = () => G.BB;
  const DAY = 86400000;
  const fmtDate = (t, time) => t ? new Date(t).toLocaleString('id-ID', time ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }) : '–';
  const ago = (t) => { const d = Date.now() - t; if (d < 60000) return 'baru saja'; if (d < 3600000) return Math.round(d / 60000) + ' menit lalu'; if (d < DAY) return Math.round(d / 3600000) + ' jam lalu'; if (d < 7 * DAY) return Math.round(d / DAY) + ' hari lalu'; return fmtDate(t); };
  const courseTitle = (id) => (NR.meta(id) || {}).title || id;
  const openCourses = () => NR.list().filter(c => !c.soon);
  const P = G.BP = { classes: null, cache: {} };
  const page = (title, eyebrow, body, opt) => '<section class="page' + (opt && opt.wide ? ' wide' : '') + '">' + (opt && opt.noBack ? '<h1>' + title + '</h1>' : '<header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div>' + (eyebrow ? '<p class="eyebrow">' + eyebrow + '</p>' : '') + '<h1>' + title + '</h1></div></header>') + body + '</section>';
  const loading = '<div class="loading"><span class="spin"></span><p class="muted">Memuat…</p></div>';
  const fail = (e) => '<div class="card"><p class="bad">' + esc((e && e.message) || 'Terjadi kesalahan.') + '</p><button class="btn" data-pact="retry">Coba lagi</button></div>';
  const needLogin = () => bb().auth && bb().auth.needsLogin;
  const myId = () => bb().user ? bb().user.id : null;
  const stateFor = (course) => A.course === course ? A.S : A.readState(course);
  const readNotes = () => { A.set.readNotes = A.set.readNotes || {}; return A.set.readNotes; };

  async function myClasses(force) {
    if (needLogin()) return [];
    if (!P.classes || force) { P.classes = await bb().classes.mine(); await ensureMeta(P.classes.map(c => c.course)); }
    return P.classes;
  }
  /* Kursus buatan guru yang masih draf tidak ada di katalog; ambil metadatanya supaya judulnya tampil */
  async function ensureMeta(ids) {
    for (const id of Array.from(new Set(ids))) {
      if (!NR.isDb(id) || NR.meta(id) || !bb().courses) continue;
      try { const got = await bb().courses.get(id); if (got && !NR.remote.some(r => r.id === id)) NR.remote.push(got.meta); } catch (e) { }
    }
  }
  const findClass = async (id) => (await myClasses()).find(c => c.id === id) || (await myClasses(true)).find(c => c.id === id);

  /* ============ Tugas: deskripsi & status ============ */
  const KINDS = [['lesson', 'Selesaikan materi satu bagian'], ['practice', 'Lulus latihan level tertentu'], ['prereq', 'Lulus drill prasyarat'], ['diag', 'Kerjakan tes diagnostik'], ['review', 'Review harian (jumlah soal)'], ['mixed', 'Latihan campuran'], ['tryout', 'Tryout berwaktu']];
  function targetLabel(t, course) {
    const sameCourse = course === A.course;
    const sec = (id) => { const s = sameCourse && (C.SECTIONS || []).find(x => x.id === +id); return 'Bagian ' + id + (s ? ': ' + s.short : ''); };
    switch (t.kind) {
      case 'lesson': return 'Selesaikan ' + sec(t.sec) + ' sampai tiket keluar';
      case 'practice': return 'Lulus latihan ' + sec(t.sec) + ' level ' + t.lvl + ' (' + U.LV[t.lvl] + '): 4 dari 5 soal terakhir benar';
      case 'prereq': return 'Lulus drill prasyarat ' + t.id;
      case 'diag': return 'Kerjakan tes diagnostik';
      case 'review': return 'Jawab ' + (t.n || 10) + ' soal review harian';
      case 'mixed': return 'Kerjakan ' + (t.n || 12) + ' soal latihan campuran';
      case 'tryout': return 'Selesaikan satu tryout berwaktu';
      default: return 'Tugas';
    }
  }
  /* Status dihitung dari progres siswa: tidak perlu siswa menekan "selesai" */
  function statusOf(a, S) {
    const t = a.target || {}; const since = a.t || 0;
    let st = 'todo', txt = 'Belum dimulai';
    if (!S) return { st, txt: 'Belum ada progres' };
    const cnt = (src) => S.attempts.filter(x => x.src === src && x.t >= since).length;
    if (t.kind === 'lesson') { const s = (S.sections || {})[t.sec] || {}; if (s.done) { st = 'done'; txt = 'Selesai'; } else if (s.step) { st = 'doing'; txt = 'Sampai subbab ' + (s.step + 1); } }
    else if (t.kind === 'practice') { const li = A.levelInfo(+t.sec, +t.lvl, S); if (li.lastN >= 5 && li.last5 >= 4) { st = 'done'; txt = 'Lulus (' + li.last5 + '/5)'; } else if (li.n) { st = 'doing'; txt = li.last5 + '/' + li.lastN + ' terakhir benar'; } }
    else if (t.kind === 'prereq') { const p = (S.prereq || {})[t.id]; if (p && p.st === 'lulus') { st = 'done'; txt = 'Lulus'; } else if (p) { st = 'doing'; txt = 'Perlu latihan'; } }
    else if (t.kind === 'diag') { if (S.diag && S.diag.done) { st = 'done'; txt = 'Selesai'; } }
    else if (t.kind === 'review' || t.kind === 'mixed') { const n = cnt(t.kind === 'review' ? 'review' : 'campuran'), need = t.n || (t.kind === 'review' ? 10 : 12); if (n >= need) { st = 'done'; txt = n + ' soal'; } else if (n) { st = 'doing'; txt = n + '/' + need + ' soal'; } }
    else if (t.kind === 'tryout') { const n = cnt('tryout'); if (n >= 10) { st = 'done'; txt = 'Selesai'; } else if (n) { st = 'doing'; txt = n + ' soal dijawab'; } }
    if (st !== 'done' && a.due && Date.now() > a.due) { st = 'late'; txt += ' · terlambat'; }
    return { st, txt };
  }
  const chipSt = (s) => '<span class="chip st-' + s.st + '">' + esc(s.txt) + '</span>';
  function dueTxt(a) {
    if (!a.due) return 'Tanpa tenggat'; const when = fmtDate(a.due, true);
    if (a.due < Date.now()) return 'Tenggat lewat · ' + when;
    const day = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
    const n = Math.round((day(a.due) - day(Date.now())) / DAY);
    return 'Tenggat ' + (n === 0 ? 'hari ini' : n === 1 ? 'besok' : n + ' hari lagi') + ' · ' + when;
  }
  async function doTargetIn(course, target) { await openCourse(course); U.doTarget(target); }
  /* Tautan pesan: "k:<kursus>|<target>" atau format lama "lesson:3" / "review" */
  function parseLink(l) {
    if (!l) return null; let course = A.set.lastCourse || 'pertidaksamaan', rest = l;
    const m = l.match(/^k:([a-z0-9_-]+)\|(.*)$/); if (m) { course = m[1]; rest = m[2]; }
    if (rest.startsWith('lesson:')) return { course, target: { kind: 'lesson', sec: +rest.slice(7) } };
    if (rest.startsWith('practice:')) { const [s, l2] = rest.slice(9).split(':'); return { course, target: { kind: 'practice', sec: +s, lvl: +l2 } }; }
    return { course, target: { kind: rest } };
  }

  /* ============ Beranda: katalog kursus ============ */
  V.home = function () {
    const name = A.displayName();
    const notes = (A.sync.notes || []).slice().reverse().filter(n => !n.read && !readNotes()[n.id]);
    let h = '<section class="home">';
    h += '<div class="hello"><div><p class="eyebrow">' + greet() + '</p><h1>' + (name ? 'Hai, ' + esc(name) : 'Hai!') + '</h1><p class="muted small">' + esc((G.NALAR_CONFIG || {}).tagline || 'Belajar sedikit tiap hari, paham sampai ke akarnya.') + '</p></div></div>';
    if (bb().mode === 'supabase' && needLogin()) h += '<div class="card nudge"><p><b>Masuk atau daftar</b> supaya progresmu tersimpan di akun, bisa dibuka dari HP maupun laptop, dan kamu bisa bergabung ke kelas.</p><div class="row"><button class="btn primary" data-go="login">Masuk / daftar</button></div></div>';
    if (notes.length) h += '<div class="note-k">' + ic('send') + '<div><p class="eyebrow">Pesan dari guru/kakak' + (notes.length > 1 ? ' · ' + notes.length + ' baru' : '') + '</p><p class="note-txt"></p><div class="row">' + (notes[0].link ? '<button class="btn small" data-pact="note-open" data-id="' + esc(notes[0].id) + '">Kerjakan</button>' : '') + '<button class="btn small ghost" data-pact="note-read" data-id="' + esc(notes[0].id) + '">Sudah dibaca</button></div></div></div>';
    const last = A.set.lastCourse && NR.meta(A.set.lastCourse);
    if (last && !last.soon) {
      const S = stateFor(last.id); const done = Object.values(S.sections || {}).filter(x => x.done).length;
      h += '<button class="cta" data-go="course" data-course="' + esc(last.id) + '"><span class="eyebrow">Lanjutkan belajar</span><span class="cta-t">' + esc(last.title) + '</span><span class="cta-d">' + done + ' bagian selesai · ' + S.attempts.length + ' soal dijawab' + (S.updated ? ' · terakhir ' + ago(S.updated) : '') + '</span><span class="cta-glyph glyph-t" aria-hidden="true">' + esc(last.glyph || '') + '</span></button>';
    }
    h += '<div id="home-tasks"></div>';
    h += '<h2 class="h1like">Kursus</h2><div class="catalog">' + NR.list().map(courseCard).join('') + '</div>';
    h += '<p class="foot muted small">' + esc(siteName()) + ' · sumber terbuka. Ingin membuat kursus sendiri? <button class="linkbtn small" data-go="studio">Buka Studio kursus</button></p></section>';
    view().innerHTML = h;
    const nt = $('.note-txt'); if (nt) nt.textContent = notes[0].text;
    homeTasks();
  };
  const siteName = () => (G.NALAR_CONFIG || {}).siteName || 'Ruang Nalar';
  function courseCard(c) {
    if (c.soon) return '<div class="ccard soon"><span class="cglyph" aria-hidden="true">' + esc(c.glyph || '') + '</span><div><p class="eyebrow">' + esc(c.subject || '') + '</p><h3>' + esc(c.title) + '</h3><p class="muted small">' + esc(c.blurb || '') + '</p></div><span class="chip">Segera hadir</span></div>';
    const S = stateFor(c.id); const started = S.attempts.length || Object.keys(S.sections || {}).length || S.intro;
    const vis = c.db && c.mine && c.visibility !== 'public' ? '<span class="chip st-todo">' + (c.visibility === 'draft' ? 'Draf' : 'Lewat tautan') + '</span>' : '';
    return '<button class="ccard c-' + esc(c.color || 'accent') + '" data-go="course" data-course="' + esc(c.id) + '"><span class="cglyph" aria-hidden="true">' + esc(c.glyph || '') + '</span><div><p class="eyebrow">' + esc(c.subject || '') + (c.level ? ' · ' + esc(c.level) : '') + '</p><h3>' + esc(c.title) + '</h3><p class="muted small">' + esc(c.blurb || '') + '</p></div>' + vis + '<span class="chip ' + (started ? 'ok' : '') + '">' + (started ? 'Lanjutkan · ' + S.attempts.length + ' soal' : 'Mulai') + '</span></button>';
  }
  /* Tugas yang belum selesai dari semua kelas tempat aku menjadi siswa */
  async function homeTasks() {
    const box = $('#home-tasks'); if (!box || needLogin()) return;
    try {
      const cls = (await myClasses()).filter(c => !c.isOwner);
      const rows = [];
      for (const c of cls.slice(0, 8)) { const as = await bb().assign.list(c.id); as.forEach(a => { const s = statusOf(a, stateFor(c.course)); if (s.st !== 'done') rows.push({ a, c, s }); }); }
      if (!$('#home-tasks')) return;
      rows.sort((x, y) => (x.a.due || 9e15) - (y.a.due || 9e15));
      if (!rows.length) { box.innerHTML = cls.length ? '<div class="card slim"><p class="muted small">' + ic('check') + ' Semua tugas kelas sudah beres.</p></div>' : ''; return; }
      box.innerHTML = '<div class="card"><h2>' + ic('task') + ' Tugas kelas</h2><ul class="asg-mini">' + rows.slice(0, 5).map(r => '<li><div><b class="t"></b><span class="muted small"> · ' + esc(r.c.name) + '</span><br><span class="small ' + (r.s.st === 'late' ? 'bad' : 'muted') + '">' + esc(dueTxt(r.a)) + '</span></div><button class="btn small primary" data-pact="asg-go" data-cls="' + esc(r.c.id) + '" data-aid="' + esc(r.a.id) + '">Kerjakan</button></li>').join('') + '</ul></div>';
      $$('.asg-mini .t', box).forEach((b, k) => { b.textContent = rows[k].a.title; });
      P.cache.homeRows = rows;
    } catch (e) { box.innerHTML = ''; }
  }

  /* ============ Akun ============ */
  V.me = function () {
    const b = bb(); const u = b.user; const name = A.displayName();
    const modeTxt = { local: 'Mode tanpa server · data di browser ini', claude: 'Akun Claude', supabase: u ? 'Akun ' + (u.email || '') : 'Belum masuk' }[b.mode];
    let h = '<div class="card acct"><span class="av big">' + esc((name || '?').slice(0, 1).toUpperCase()) + '</span><div><h2 class="nm"></h2><p class="muted small">' + esc(modeTxt) + '</p></div></div>';
    h += '<div class="row wrap"><button class="btn" data-go="settings">Pengaturan</button>' + (b.mode === 'supabase' ? (u ? '<button class="btn ghost" data-pact="logout">' + ic('out') + ' Keluar</button>' : '<button class="btn primary" data-go="login">Masuk / daftar</button>') : '') + '</div>';
    const ROLE = { student: 'Siswa', teacher: 'Guru', admin: 'Admin' };
    if (u && b.mode !== 'local') h = h.replace('</p></div></div>', ' · <span class="chip role-' + esc(u.role || 'student') + '">' + ROLE[u.role || 'student'] + '</span></p></div></div>');
    if (b.admin && b.isAdmin) h += '<div class="card studio-cta"><div><h2>' + ic('users') + ' Kelola pengguna</h2><p class="muted small">Angkat akun menjadi guru supaya bisa membuat kursus, atau jadikan admin.</p></div><button class="btn" data-go="admin">Buka halaman admin</button></div>';
    if (u && b.mode === 'supabase' && !(b.courses && b.courses.canEdit)) h += '<p class="muted small">Akunmu berperan <b>siswa</b>. Untuk membuat kursus di Studio, minta admin mengubah akunmu menjadi guru (sebutkan email <span class="mono">' + esc(u.email || '') + '</span>).</p>';
    if (b.courses && b.courses.canEdit) h += '<div class="card studio-cta"><div><h2>' + ic('book') + ' Studio kursus</h2><p class="muted small">Buat kursusmu sendiri lewat formulir: materi, contoh, soal, flashcard. Tanpa menulis kode.</p></div><button class="btn primary" data-go="studio">Buka Studio</button></div>';
    h += '<h2 class="h1like">Progres per kursus</h2><div class="cprog">' + openCourses().map(c => { const S = stateFor(c.id); const st = A.stats(S); return '<div class="card"><p class="eyebrow">' + esc(c.subject || '') + '</p><h3>' + esc(c.title) + '</h3><div class="kpis small"><div><b>' + Object.values(S.sections || {}).filter(x => x.done).length + '</b><span>bagian selesai</span></div><div><b>' + st.tot + '</b><span>soal</span></div><div><b>' + (st.tot ? Math.round(st.acc * 100) + '%' : '–') + '</b><span>akurasi</span></div></div><div class="row"><button class="btn small" data-go="stats" data-course="' + esc(c.id) + '">Statistik lengkap</button><button class="btn small ghost" data-go="course" data-course="' + esc(c.id) + '">Buka kursus</button></div></div>'; }).join('') + '</div>';
    view().innerHTML = page(name ? esc(name) : 'Akun', '', h, { noBack: true });
    const nm = $('.acct .nm'); if (nm) nm.textContent = name || 'Tanpa nama';
  };

  /* ============ Admin: kelola peran pengguna ============ */
  V.admin = function () {
    const b = bb();
    if (!b.admin || !b.isAdmin) { view().innerHTML = page('Admin', '', '<div class="card"><p>Halaman ini hanya untuk admin.</p></div>'); return; }
    view().innerHTML = page('Kelola pengguna', 'Admin', '<div class="card"><p class="muted small"><b>Siswa</b>: belajar, gabung kelas, forum. <b>Guru</b>: + membuat kursus di Studio. <b>Admin</b>: + mengelola peran. Siapa pun bisa membuat kelas.</p><input id="adm-q" placeholder="Cari nama atau email…"></div><div id="adm-list">' + loading + '</div>', { wide: true });
    const ROLE = [['student', 'Siswa'], ['teacher', 'Guru'], ['admin', 'Admin']];
    const draw = (list) => {
      const q = ($('#adm-q').value || '').toLowerCase(); const rows = list.filter(u => !q || (u.name + ' ' + u.email).toLowerCase().includes(q));
      const box = $('#adm-list');
      box.innerHTML = '<div class="card"><p class="muted small">' + list.length + ' pengguna · ' + list.filter(u => u.role === 'teacher').length + ' guru · ' + list.filter(u => u.role === 'admin').length + ' admin</p><div class="tblwrap"><table class="ktbl adm"><thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Bergabung</th></tr></thead><tbody>' + rows.map(u => '<tr><td class="nm"></td><td class="em small"></td><td><select data-adm="' + esc(u.id) + '" aria-label="Peran">' + ROLE.map(r => '<option value="' + r[0] + '"' + (u.role === r[0] ? ' selected' : '') + '>' + r[1] + '</option>').join('') + '</select> <span class="small adm-m"></span></td><td class="small">' + fmtDate(u.created) + '</td></tr>').join('') + '</tbody></table></div></div>';
      $$('.adm tbody tr', box).forEach((tr, k) => { $('.nm', tr).textContent = rows[k].name + (rows[k].id === myId() ? ' (kamu)' : ''); $('.em', tr).textContent = rows[k].email; });
    };
    let users = [];
    b.admin.listUsers().then(list => { users = list; draw(users); }).catch(e => { $('#adm-list').innerHTML = fail(e); });
    $('#adm-q').addEventListener('input', () => draw(users));
    $('#adm-list').addEventListener('change', async (e) => {
      const s = e.target.closest('[data-adm]'); if (!s) return; const m = s.parentNode.querySelector('.adm-m'); const u = users.find(x => x.id === s.dataset.adm); const prev = u.role;
      s.disabled = true; m.textContent = 'menyimpan…'; m.className = 'small adm-m muted';
      try { await b.admin.setRole(u.id, s.value); u.role = s.value; m.textContent = '✓ tersimpan'; m.className = 'small adm-m ok'; if (u.id === myId()) { b.user.role = s.value; b.isAdmin = s.value === 'admin'; } }
      catch (err) { s.value = prev; m.textContent = /admin/i.test(err.message) ? 'Minimal harus ada satu admin.' : err.message; m.className = 'small adm-m bad'; }
      s.disabled = false;
    });
  };

  V.login = function (p) {
    const b = bb();
    if (b.mode !== 'supabase') { view().innerHTML = page('Akun', '', '<div class="card"><p>Situs ini belum terhubung ke server akun. Progres tersimpan di browser ini. Pemilik situs bisa mengaktifkan akun, kelas online, dan forum dengan Supabase (lihat <code>docs/SUPABASE.md</code>).</p></div>'); return; }
    if (b.user) { view().innerHTML = page('Akun', '', '<div class="card"><p>Kamu sudah masuk sebagai <b class="nm"></b>.</p><div class="row"><button class="btn primary" data-go="home">Ke beranda</button><button class="btn ghost" data-pact="logout">Keluar</button></div></div>'); $('.nm').textContent = b.user.name; return; }
    const tab = p.t || 'masuk';
    let f = '<div class="seg" role="tablist">' + [['masuk', 'Masuk'], ['daftar', 'Daftar'], ['lupa', 'Lupa sandi']].map(x => '<button role="tab" data-pact="ltab" data-t="' + x[0] + '" aria-checked="' + (tab === x[0]) + '">' + x[1] + '</button>').join('') + '</div><form class="card form" id="lform" novalidate>';
    if (tab === 'daftar') f += '<label class="lbl" for="l-name">Nama yang ditampilkan</label><input id="l-name" maxlength="40" autocomplete="nickname" required placeholder="misalnya: Dika">';
    f += '<label class="lbl" for="l-email">Email</label><input id="l-email" type="email" autocomplete="email" required placeholder="nama@contoh.com">';
    if (tab !== 'lupa') f += '<label class="lbl" for="l-pass">Kata sandi</label><input id="l-pass" type="password" minlength="8" autocomplete="' + (tab === 'daftar' ? 'new-password' : 'current-password') + '" required placeholder="minimal 8 karakter">';
    f += '<p class="err" role="alert" id="l-err"></p><p class="ok small" id="l-ok" aria-live="polite"></p><button class="btn primary wide" type="submit">' + ({ masuk: 'Masuk', daftar: 'Buat akun', lupa: 'Kirim tautan atur ulang' })[tab] + '</button>';
    if (tab === 'daftar') f += '<p class="muted small">Progres yang sudah ada di perangkat ini akan otomatis digabung ke akun barumu.</p>';
    f += '</form>';
    view().innerHTML = page(tab === 'daftar' ? 'Buat akun' : tab === 'lupa' ? 'Atur ulang sandi' : 'Masuk', siteName(), f);
    $('#lform').addEventListener('submit', async (e) => {
      e.preventDefault(); const er = $('#l-err'), ok = $('#l-ok'); er.textContent = ''; ok.textContent = '';
      const email = $('#l-email').value.trim(), pass = ($('#l-pass') || {}).value || '', nm = (($('#l-name') || {}).value || '').trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) { er.textContent = 'Tulis email yang valid.'; return; }
      if (tab !== 'lupa' && pass.length < 8) { er.textContent = 'Kata sandi minimal 8 karakter.'; return; }
      if (tab === 'daftar' && !nm) { er.textContent = 'Tulis nama yang ingin ditampilkan.'; return; }
      const btn = $('#lform button[type=submit]'); btn.disabled = true;
      try {
        if (tab === 'masuk') { await b.auth.signIn(email, pass); go(p.next || 'home'); }
        else if (tab === 'daftar') { const r = await b.auth.signUp(email, pass, nm); A.set.name = nm; A.saveSettings(); if (r && r.session) go(p.next || 'home'); else ok.textContent = 'Akun dibuat. Cek email untuk konfirmasi, lalu masuk.'; }
        else { await b.auth.resetPassword(email); ok.textContent = 'Jika email terdaftar, tautan atur ulang sudah dikirim.'; }
      } catch (err) { er.textContent = authMsg(err); }
      btn.disabled = false;
    });
  };
  function authMsg(e) {
    const m = (e && e.message) || '';
    if (/invalid login/i.test(m)) return 'Email atau kata sandi salah.';
    if (/already registered/i.test(m)) return 'Email ini sudah terdaftar. Coba masuk.';
    if (/email not confirmed/i.test(m)) return 'Email belum dikonfirmasi. Cek kotak masuk (dan folder spam).';
    if (/rate limit/i.test(m)) return 'Terlalu banyak percobaan. Tunggu sebentar.';
    return m || 'Gagal. Coba lagi.';
  }

  /* ============ Daftar kelas ============ */
  V.kelas = function (p) {
    const b = bb();
    if (needLogin()) { view().innerHTML = page('Kelas', '', '<div class="card"><p>Masuk dulu untuk membuat atau bergabung ke kelas.</p>' + (p.join ? '<p class="muted small">Kode kelas <b class="mono">' + esc(p.join) + '</b> akan diisi otomatis setelah masuk.</p>' : '') + '<button class="btn primary" data-pact="login-next" data-join="' + esc(p.join || '') + '">Masuk / daftar</button></div>', { noBack: true }); return; }
    let h = '';
    if (b.mode === 'local') h += '<div class="card slim"><p class="small"><b>Mode tanpa server.</b> Kelas, tugas, dan forum hanya tersimpan di browser ini, cocok untuk mencoba atau untuk satu guru yang memantau siswa lewat <b>kode progres</b>. Supaya siswa bisa bergabung dari perangkat masing-masing, hubungkan Supabase (lihat README).</p></div>';
    if (b.classes.usesCode) h += '<div class="card"><h2>Gabung ke kelas</h2><form class="inline" id="joinf"><input id="jcode" class="mono" maxlength="12" autocapitalize="characters" placeholder="Kode dari guru, misal K7QX2M" value="' + esc(p.join || '') + '"><button class="btn primary" type="submit">Gabung</button></form><p class="err" role="alert" id="jerr"></p></div>';
    if (b.classes.canCreate) h += '<details class="card" id="newc"' + (p.create ? ' open' : '') + '><summary><b>' + ic('plus') + ' Buat kelas baru</b> <span class="muted small">(kamu menjadi gurunya)</span></summary><form id="cform" class="form"><label class="lbl" for="cname">Nama kelas</label><input id="cname" maxlength="60" placeholder="misalnya: X-3 Matematika atau Les Sabtu"><label class="lbl" for="ccourse">Kursus</label><select id="ccourse">' + openCourses().map(c => '<option value="' + esc(c.id) + '"' + (c.id === A.set.lastCourse ? ' selected' : '') + '>' + esc(c.title) + (c.db && c.mine ? ' (buatanmu' + (c.visibility === 'draft' ? ', draf' : '') + ')' : '') + '</option>').join('') + '</select><p class="err" role="alert" id="cerr"></p><button class="btn primary" type="submit">Buat kelas</button></form></details>';
    h += '<div id="clist">' + loading + '</div>';
    view().innerHTML = page('Kelas', '', h, { noBack: true });
    const jf = $('#joinf'); if (jf) jf.addEventListener('submit', async (e) => {
      e.preventDefault(); const code = $('#jcode').value.trim().toUpperCase(); if (code.length < 4) { $('#jerr').textContent = 'Tulis kode kelasnya.'; return; }
      try { const cid = await b.classes.join(code); await myClasses(true); try { history.replaceState(null, '', location.pathname + location.search); } catch (er) { } go('klas', { id: cid }); }
      catch (err) { $('#jerr').textContent = /tidak ditemukan|not found|invalid/i.test(err.message) ? 'Kode tidak ditemukan. Periksa lagi hurufnya.' : err.message; }
    });
    const cf = $('#cform'); if (cf) cf.addEventListener('submit', async (e) => {
      e.preventDefault(); const name = $('#cname').value.trim(); if (!name) { $('#cerr').textContent = 'Beri nama kelasnya dulu.'; return; }
      try { const r = await b.classes.create({ name, course: $('#ccourse').value }); await myClasses(true); go('klas', { id: r.id, fresh: 1 }); }
      catch (err) { $('#cerr').textContent = err.message; }
    });
    myClasses(true).then(list => {
      const box = $('#clist'); if (!box) return;
      if (!list.length) { box.innerHTML = '<div class="card empty"><p>' + ic('users') + ' Belum ada kelas. ' + (b.classes.usesCode ? 'Minta kode dari gurumu, atau buat kelas sendiri.' : b.classes.canCreate ? 'Buat kelas pertamamu di atas.' : 'Tunggu gurumu menambahkanmu ke kelas.') + '</p></div>'; return; }
      box.innerHTML = '<div class="clist">' + list.map(c => '<button class="ccard klas-card" data-go="klas" data-id="' + esc(c.id) + '"><span class="cglyph" aria-hidden="true">' + esc((NR.meta(c.course) || {}).glyph || '•') + '</span><div><p class="eyebrow">' + esc(courseTitle(c.course)) + '</p><h3 class="cn"></h3><p class="muted small">' + (c.isOwner ? 'Kamu guru' + (c.code ? ' · kode <span class="mono">' + esc(c.code) + '</span>' : '') + (c.members ? ' · ' + c.members.length + ' anggota' : '') : 'Kamu siswa') + '</p></div></button>').join('') + '</div>';
      $$('.klas-card .cn', box).forEach((el, k) => { el.textContent = list[k].name; });
    }).catch(e => { const box = $('#clist'); if (box) box.innerHTML = fail(e); });
  };

  /* ============ Halaman satu kelas ============ */
  V.klas = function (p) {
    view().innerHTML = loading;
    const tok = P.tok = {};
    (async () => {
      const c = await findClass(p.id);
      if (!c) { view().innerHTML = page('Kelas', '', '<div class="card"><p>Kelas tidak ditemukan atau kamu bukan anggotanya lagi.</p><button class="btn" data-go="kelas">Ke daftar kelas</button></div>'); return; }
      const meta = NR.meta(c.course);
      if ((meta && !meta.soon) || NR.isDb(c.course)) { try { await openCourse(c.course); } catch (e) { console.warn(e); } }
      if (P.tok !== tok) return;
      P.cur = c;
      const tab = p.ktab || 'tugas';
      let h = '<section class="page wide"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div><p class="eyebrow">' + esc(courseTitle(c.course)) + ' · ' + (c.isOwner ? 'Kamu guru' : 'Kamu siswa') + '</p><h1 class="cn"></h1></div></header>';
      if (c.isOwner && c.code) h += '<div class="card codebox' + (p.fresh ? ' hi' : '') + '"><div><p class="eyebrow">Kode kelas</p><p class="code mono">' + esc(c.code) + '</p><p class="muted small">Bagikan kode ini atau tautannya ke siswa. Siswa masuk/daftar, lalu menekan Gabung.</p></div><div class="row"><button class="btn small" data-pact="copy" data-v="' + esc(c.code) + '">' + ic('copy') + ' Salin kode</button><button class="btn small" data-pact="copy" data-v="' + esc(joinLink(c.code)) + '">' + ic('copy') + ' Salin tautan</button></div></div>';
      h += '<div class="seg tabs3" role="tablist">' + [['tugas', 'Tugas', 'task'], ['forum', 'Forum', 'chat'], ['anggota', c.isOwner ? 'Progres' : 'Anggota', 'users']].concat(c.isOwner ? [['atur', 'Atur', 'grid']] : []).map(x => '<button role="tab" data-go="klas" data-id="' + esc(c.id) + '" data-tab="' + x[0] + '" aria-checked="' + (tab === x[0]) + '">' + ic(x[2]) + ' ' + x[1] + '</button>').join('') + '</div><div id="kbody">' + loading + '</div></section>';
      view().innerHTML = h; $('.cn').textContent = c.name;
      const body = $('#kbody');
      try {
        if (tab === 'tugas') await tabTugas(body, c);
        else if (tab === 'forum') await tabForum(body, c);
        else if (tab === 'atur' && c.isOwner) tabAtur(body, c);
        else await tabAnggota(body, c);
      } catch (e) { if (P.tok === tok) body.innerHTML = fail(e); console.error(e); }
    })().catch(e => { view().innerHTML = fail(e); });
  };
  const joinLink = (code) => location.origin + location.pathname + '#gabung=' + code;

  /* ---------- Tab Atur (khusus guru pemilik kelas) ---------- */
  function tabAtur(body, c) {
    const b = bb();
    let h = '<div class="card form"><h2>Nama kelas</h2><div class="inline-f"><input id="k-name" maxlength="60" value="' + esc(c.name) + '"><button class="btn primary" data-pact="k-rename">Simpan</button></div><p class="small" id="k-name-m" aria-live="polite"></p></div>';
    h += '<div class="card form"><h2>Kursus kelas</h2><select id="k-course">' + openCourses().map(x => '<option value="' + esc(x.id) + '"' + (x.id === c.course ? ' selected' : '') + '>' + esc(x.title) + '</option>').join('') + (NR.meta(c.course) ? '' : '<option value="' + esc(c.course) + '" selected>' + esc(courseTitle(c.course)) + '</option>') + '</select><p class="muted small">Progres siswa tersimpan per kursus, jadi tidak ada yang hilang. Tapi laporan progres dan status tugas akan membaca kursus yang baru, dan tugas lama bisa merujuk bagian yang tidak ada di kursus baru.</p><div class="row"><button class="btn" data-pact="k-course">Ganti kursus</button></div><p class="small" id="k-course-m" aria-live="polite"></p></div>';
    if (b.classes.usesCode && b.classes.newCode) h += '<div class="card"><h2>Kode gabung</h2><p>Kode saat ini: <b class="mono">' + esc(c.code || '') + '</b></p><p class="muted small">Buat kode baru kalau kode lama tersebar ke orang yang tidak seharusnya. Kode dan tautan lama langsung tidak berlaku; anggota yang sudah bergabung tetap di kelas.</p><span id="k-code"><button class="btn" data-pact="k-code1">Buat kode baru</button></span></div>';
    h += '<div class="card danger-zone"><h2>Hapus kelas</h2><p class="muted small">Menghapus kelas beserta <b>semua tugas, diskusi forum, dan daftar anggotanya</b>. Progres belajar siswa <b>tidak</b> ikut terhapus. Tindakan ini tidak bisa dibatalkan.</p><span id="k-del"><button class="btn danger" data-pact="k-del1">Hapus kelas ini…</button></span></div>';
    body.innerHTML = h;
  }

  /* ---------- Tab Tugas ---------- */
  async function tabTugas(body, c) {
    const list = await bb().assign.list(c.id);
    let h = '';
    if (c.isOwner) h += asgForm(c);
    if (!list.length) h += '<div class="card empty"><p>' + ic('task') + ' Belum ada tugas.' + (c.isOwner ? ' Buat tugas pertama di atas: statusnya akan terisi otomatis dari progres siswa.' : '') + '</p></div>';
    let prog = null, mem = null;
    if (c.isOwner && list.length) { [prog, mem] = await Promise.all([bb().classes.memberProgress(c.id, c.course), bb().classes.members(c.id)]); }
    h += '<div class="asgs">' + list.map((a, k) => {
      let x = '<article class="card asg"><div class="asg-h"><div><h3 class="t"></h3><p class="small ' + (a.due && Date.now() > a.due ? 'bad' : 'muted') + '">' + ic('clock') + ' ' + esc(dueTxt(a)) + '</p></div>';
      if (!c.isOwner) { const s = statusOf(a, stateFor(c.course)); x += chipSt(s) + '</div>'; }
      else { const rows = (mem || []).map(m => { const pr = (prog || []).find(q => q.id === m.id); return { m, s: statusOf(a, pr && pr.state) }; }); const done = rows.filter(r => r.s.st === 'done').length; x += '<span class="chip ' + (rows.length && done === rows.length ? 'st-done' : '') + '">' + done + '/' + rows.length + ' selesai</span></div>'; a._rows = rows; }
      x += '<p class="asg-tg">' + esc(targetLabel(a.target || {}, c.course)) + '</p>' + (a.desc ? '<p class="asg-d muted"></p>' : '');
      if (!c.isOwner) x += '<div class="row"><button class="btn primary small" data-pact="asg-go" data-cls="' + esc(c.id) + '" data-aid="' + esc(a.id) + '">Kerjakan</button></div>';
      else x += '<details class="asg-st"><summary>Status per siswa</summary>' + (a._rows.length ? '<ul class="stlist">' + a._rows.map(r => '<li><span class="sn"></span>' + chipSt(r.s) + '</li>').join('') + '</ul>' : '<p class="muted small">Belum ada anggota.</p>') + '</details><div class="row"><span id="adel-' + k + '"><button class="btn small ghost" data-pact="asg-del1" data-k="' + k + '" data-aid="' + esc(a.id) + '">' + ic('trash') + ' Hapus</button></span></div>';
      return x + '</article>';
    }).join('') + '</div>';
    body.innerHTML = h;
    $$('.asg', body).forEach((el, k) => { const a = list[k]; $('.t', el).textContent = a.title; const d = $('.asg-d', el); if (d) d.textContent = a.desc; if (a._rows) $$('.sn', el).forEach((sn, j) => { sn.textContent = a._rows[j].m.name || 'Siswa'; }); });
    P.cache.asg = list;
    if (c.isOwner) bindAsgForm(c);
  }
  function asgForm(c) {
    const secs = C.SECTIONS || [];
    return '<details class="card" id="asgf"><summary><b>' + ic('plus') + ' Buat tugas</b></summary><form class="form" id="aform">' +
      '<label class="lbl" for="a-kind">Jenis tugas</label><select id="a-kind">' + KINDS.filter(k => k[0] !== 'diag' || U.hasDiag()).filter(k => k[0] !== 'prereq' || (C.PREREQ || []).length).map(k => '<option value="' + k[0] + '">' + k[1] + '</option>').join('') + '</select>' +
      '<div id="a-sec-w"><label class="lbl" for="a-sec">Bagian</label><select id="a-sec">' + secs.map(s => '<option value="' + s.id + '">' + s.id + '. ' + esc(s.short) + '</option>').join('') + '</select></div>' +
      '<div id="a-lvl-w" hidden><label class="lbl" for="a-lvl">Level</label><select id="a-lvl">' + [1, 2, 3, 4, 5, 6].map(l => '<option value="' + l + '"' + (l === 3 ? ' selected' : '') + '>L' + l + ' · ' + U.LV[l] + '</option>').join('') + '</select></div>' +
      '<div id="a-pre-w" hidden><label class="lbl" for="a-pre">Prasyarat</label><select id="a-pre">' + (C.PREREQ || []).map(p => '<option value="' + esc(p.id) + '">' + esc(p.id + ' · ' + p.title) + '</option>').join('') + '</select></div>' +
      '<div id="a-n-w" hidden><label class="lbl" for="a-n">Jumlah soal</label><input id="a-n" type="number" min="5" max="50" value="10"></div>' +
      '<label class="lbl" for="a-title">Judul</label><input id="a-title" maxlength="120">' +
      '<label class="lbl" for="a-due">Tenggat (opsional)</label><input id="a-due" type="datetime-local">' +
      '<label class="lbl" for="a-desc">Catatan untuk siswa (opsional)</label><textarea id="a-desc" rows="2" maxlength="2000" placeholder="Misalnya: fokus ke soal yang ada pecahan di penyebut."></textarea>' +
      '<p class="err" role="alert" id="a-err"></p><button class="btn primary" type="submit">Simpan tugas</button></form></details>';
  }
  function bindAsgForm(c) {
    const f = $('#aform'); if (!f) return;
    let autoTitle = true;
    const upd = () => {
      const k = $('#a-kind').value;
      $('#a-sec-w').hidden = !['lesson', 'practice'].includes(k); $('#a-lvl-w').hidden = k !== 'practice'; $('#a-pre-w').hidden = k !== 'prereq'; $('#a-n-w').hidden = !['review', 'mixed'].includes(k);
      if (k === 'mixed' && +$('#a-n').value === 10) $('#a-n').value = 12;
      if (autoTitle) $('#a-title').value = targetLabel(readTarget(), c.course).replace(/: 4 dari 5.*$/, '').replace(/ sampai tiket keluar$/, '');
    };
    $('#a-title').addEventListener('input', () => { autoTitle = false; });
    ['a-kind', 'a-sec', 'a-lvl', 'a-pre', 'a-n'].forEach(id => $('#' + id).addEventListener('change', upd));
    upd();
    f.addEventListener('submit', async (e) => {
      e.preventDefault(); const title = $('#a-title').value.trim(); if (!title) { $('#a-err').textContent = 'Judul tugas belum diisi.'; return; }
      const dv = $('#a-due').value; const due = dv ? new Date(dv).getTime() : null; if (dv && isNaN(due)) { $('#a-err').textContent = 'Tanggal tidak valid.'; return; }
      try { await bb().assign.create(c.id, { title, desc: $('#a-desc').value.trim(), target: readTarget(), due }); render(); }
      catch (err) { $('#a-err').textContent = err.message; }
    });
  }
  function readTarget() {
    const k = $('#a-kind').value, t = { kind: k };
    if (k === 'lesson' || k === 'practice') t.sec = +$('#a-sec').value;
    if (k === 'practice') t.lvl = +$('#a-lvl').value;
    if (k === 'prereq') t.id = $('#a-pre').value;
    if (k === 'review' || k === 'mixed') t.n = Math.max(5, Math.min(50, +$('#a-n').value || 10));
    return t;
  }

  /* ---------- Tab Forum ---------- */
  async function tabForum(body, c) {
    const list = await bb().forum.threads(c.id);
    let h = '<details class="card" id="tnew"><summary><b>' + ic('plus') + ' Tulis pertanyaan atau diskusi baru</b></summary><form class="form" id="tform"><label class="lbl" for="t-title">Judul</label><input id="t-title" maxlength="150" placeholder="misalnya: Kenapa tanda dibalik saat dikali negatif?"><label class="lbl" for="t-body">Isi</label><textarea id="t-body" rows="4" maxlength="5000" placeholder="Jelaskan di bagian mana kamu bingung dan apa yang sudah kamu coba."></textarea><p class="muted small">Rumus: tulis di antara tanda dolar, misalnya <code>$x^2-4&lt;0$</code> menjadi ' + rich('$x^2-4<0$') + '.</p><div class="preview-f" id="t-prev" hidden></div><p class="err" role="alert" id="t-err"></p><div class="row"><button class="btn ghost" type="button" data-pact="t-prev">Pratinjau</button><button class="btn primary" type="submit">Kirim</button></div></form></details>';
    if (!list.length) h += '<div class="card empty"><p>' + ic('chat') + ' Belum ada diskusi. Pertanyaan pertama selalu yang paling berani!</p></div>';
    else h += '<ul class="threads">' + list.map(t => '<li><button class="thread-b' + (t.solved ? ' solved' : '') + '" data-go="thread" data-id="' + esc(t.id) + '">' + (t.pin ? '<span class="pin" title="Disematkan">' + ic('pin') + '</span>' : '') + '<span class="tt"><b></b><span class="muted small"><span class="au"></span> · ' + ago(t.la || t.t) + '</span></span><span class="tc">' + (t.solved ? '<span class="chip st-done">Terjawab</span>' : '') + '<span class="cnt">' + ic('chat') + ' ' + t.n + '</span></span></button></li>').join('') + '</ul>';
    body.innerHTML = h;
    $$('.thread-b', body).forEach((b, k) => { $('b', b).innerHTML = safeRich(list[k].title); $('.au', b).textContent = list[k].authorName || 'Anggota'; });
    $('#tform').addEventListener('submit', async (e) => {
      e.preventDefault(); const title = $('#t-title').value.trim(), tb = $('#t-body').value.trim();
      if (title.length < 4) { $('#t-err').textContent = 'Judulnya terlalu pendek.'; return; }
      const btn = $('#tform button[type=submit]'); btn.disabled = true;
      try { const r = await bb().forum.create(c.id, { title, body: tb }); go('thread', { id: r.id, cls: c.id }); }
      catch (err) { $('#t-err').textContent = err.message; btn.disabled = false; }
    });
  }
  V.thread = function (p) {
    view().innerHTML = loading;
    (async () => {
      const c = P.cur && (!p.cls || P.cur.id === p.cls) ? P.cur : await findClass(p.cls);
      if (!c) { view().innerHTML = page('Diskusi', '', '<div class="card"><p>Kelas tidak ditemukan.</p></div>'); return; }
      p.cls = c.id; P.cur = c;
      const threads = await bb().forum.threads(c.id); const t = threads.find(x => x.id === p.id);
      if (!t) { view().innerHTML = page('Diskusi', '', '<div class="card"><p>Utas ini sudah dihapus.</p><button class="btn" data-act="back">Kembali</button></div>'); return; }
      const posts = await bb().forum.posts(t.id);
      const me = myId(), mod = c.isOwner, mine = t.a === me;
      let h = '<article class="card post op"><p class="muted small"><b class="au"></b> · ' + fmtDate(t.t, true) + (t.pin ? ' · ' + ic('pin') + ' disematkan' : '') + '</p><h2 class="tt"></h2><div class="prose pb"></div><div class="row">';
      if (mine || mod) h += '<button class="btn small" data-pact="t-solve" data-id="' + esc(t.id) + '" data-v="' + (t.solved ? 0 : 1) + '">' + ic('check') + ' ' + (t.solved ? 'Tandai belum terjawab' : 'Tandai terjawab') + '</button>';
      if (mod) h += '<button class="btn small" data-pact="t-pin" data-id="' + esc(t.id) + '" data-v="' + (t.pin ? 0 : 1) + '">' + ic('pin') + ' ' + (t.pin ? 'Lepas sematan' : 'Sematkan') + '</button>';
      if (mine || mod) h += '<span id="tdel"><button class="btn small ghost" data-pact="t-del1" data-id="' + esc(t.id) + '">' + ic('trash') + ' Hapus utas</button></span>';
      h += '</div></article>';
      h += '<h2 class="h1like small">' + posts.length + ' balasan</h2><div class="posts">' + posts.map(x => '<article class="card post' + (x.a === c.ownerId ? ' by-t' : '') + '"><p class="muted small"><b class="au"></b>' + (c.ownerId && x.a === c.ownerId ? ' <span class="chip">Guru</span>' : '') + ' · ' + ago(x.t) + '</p><div class="prose pb"></div>' + (x.a === me || mod ? '<button class="linkbtn small" data-pact="p-del" data-tid="' + esc(t.id) + '" data-id="' + esc(x.id) + '">Hapus</button>' : '') + '</article>').join('') + '</div>';
      h += '<form class="card form" id="rform"><label class="lbl" for="r-body">Balas</label><textarea id="r-body" rows="3" maxlength="5000" placeholder="Bantu jelaskan, atau tanyakan lebih lanjut. Rumus di antara $…$"></textarea><div class="preview-f" id="r-prev" hidden></div><p class="err" role="alert" id="r-err"></p><div class="row"><button class="btn ghost" type="button" data-pact="r-prev">Pratinjau</button><button class="btn primary" type="submit">' + ic('send') + ' Kirim balasan</button></div></form>';
      view().innerHTML = page('Diskusi', esc(c.name), h, { wide: true });
      const op = $('.op'); $('.au', op).textContent = t.authorName || 'Anggota'; $('.tt', op).innerHTML = safeRich(t.title); $('.pb', op).innerHTML = safeRich(t.body);
      $$('.posts .post').forEach((el, k) => { $('.au', el).textContent = posts[k].authorName || 'Anggota'; $('.pb', el).innerHTML = safeRich(posts[k].body); });
      $('#rform').addEventListener('submit', async (e) => {
        e.preventDefault(); const v = $('#r-body').value.trim(); if (!v) { $('#r-err').textContent = 'Balasan masih kosong.'; return; }
        const btn = $('#rform button[type=submit]'); btn.disabled = true;
        try { await bb().forum.reply(t.id, v); render(); } catch (err) { $('#r-err').textContent = err.message; btn.disabled = false; }
      });
    })().catch(e => { view().innerHTML = fail(e); });
  };
  /* Teks pengguna: escape dulu (tidak ada HTML), lalu render rumus $…$ dan baris baru */
  function safeRich(s) { return String(s || '').split(/(\$\$[^$]+\$\$|\$[^$\n]+\$)/).map((part, i) => i % 2 ? rich(part) : esc(part).replace(/\n/g, '<br>')).join(''); }

  /* ---------- Tab Anggota ---------- */
  function summ(st) {
    const t = Date.now(), W = 7 * DAY; const a7 = st.attempts.filter(a => t - a.t < W);
    let min7 = 0; for (let i = 0; i < 7; i++) min7 += (st.daily[A.today(t - i * DAY)] || 0);
    const stt = A.stats(st); const weak = Object.entries(stt.conc).filter(([, c]) => c.n >= 3).sort((x, y) => x[1].m - y[1].m)[0];
    const last = Math.max(0, ...st.attempts.map(a => a.t));
    return { done: Object.values(st.sections || {}).filter(x => x.done).length, n7: a7.length, acc7: a7.length ? a7.filter(a => a.ok).length / a7.length : null, min7: Math.round(min7 / 60000), last, weak: weak ? weak[0] : null, weakM: weak ? weak[1].m : null, cw: stt.confWrong.length, stats: stt };
  }
  async function tabAnggota(body, c) {
    const b = bb();
    const members = await b.classes.members(c.id);
    if (!c.isOwner) {
      body.innerHTML = '<div class="card"><h2>' + members.length + ' anggota</h2><ul class="mem">' + members.map(() => '<li><span class="av"></span><span class="nm"></span></li>').join('') + '</ul>' + (b.classes.leave ? '<div class="row"><span id="leave"><button class="btn small ghost" data-pact="leave1">Keluar dari kelas</button></span></div>' : '') + '</div>';
      $$('.mem li', body).forEach((li, k) => { const n = members[k].name || 'Anggota'; $('.nm', li).textContent = n + (members[k].id === myId() ? ' (kamu)' : ''); $('.av', li).textContent = n.slice(0, 1).toUpperCase(); });
      return;
    }
    const prog = await b.classes.memberProgress(c.id, c.course);
    P.cache.prog = prog; P.cache.members = members;
    const mem = members.map(m => { const pr = prog.find(x => x.id === m.id); const st = pr && pr.state ? Object.assign(A.fresh(), pr.state) : null; return Object.assign({ m, st, u: pr && pr.u }, st ? summ(st) : { done: 0, n7: 0, acc7: null, min7: 0, last: 0, weak: null, cw: 0, stats: null }); });
    const act = mem.filter(m => m.n7 > 0).length; const accs = mem.filter(m => m.acc7 != null); const avgAcc = accs.length ? accs.reduce((a, m) => a + m.acc7, 0) / accs.length : null;
    let h = '<div class="kpis"><div><b>' + mem.length + '</b><span>siswa</span></div><div><b>' + act + '</b><span>aktif 7 hari</span></div><div><b>' + mem.reduce((a, m) => a + m.n7, 0) + '</b><span>soal 7 hari</span></div><div><b>' + (avgAcc == null ? '–' : Math.round(avgAcc * 100) + '%') + '</b><span>rata-rata akurasi</span></div></div>';
    if (b.classes.manual) h += manageMembers(c, members);
    if (!mem.length) { body.innerHTML = h + '<div class="card empty"><p>' + (b.classes.usesCode ? 'Belum ada siswa. Bagikan kode kelas di atas.' : 'Belum ada anggota. Tambahkan di atas.') + '</p></div>'; bindManage(c); return; }
    const sort = nav.ksort || 'n7';
    const sorted = mem.slice().sort((x, y) => sort === 'name' ? (x.m.name || '').localeCompare(y.m.name || '') : sort === 'acc' ? (x.acc7 ?? 2) - (y.acc7 ?? 2) : (y[sort] || 0) - (x[sort] || 0));
    h += '<div class="card"><h2>Progres siswa</h2><div class="seg small" role="radiogroup" aria-label="Urutkan">' + [['n7', 'Paling aktif'], ['acc', 'Akurasi terendah'], ['cw', 'Salah-yakin terbanyak'], ['name', 'Nama']].map(o => '<button role="radio" data-pact="ksort" data-s="' + o[0] + '" aria-checked="' + (sort === o[0]) + '">' + o[1] + '</button>').join('') + '</div>';
    h += '<div class="tblwrap"><table class="ktbl"><thead><tr><th>Siswa</th><th>Bab selesai</th><th>Soal 7 hr</th><th>Akurasi 7 hr</th><th>Menit 7 hr</th><th>Salah-yakin</th><th>Konsep terlemah</th><th>Terakhir</th>' + (b.classes.kick ? '<th></th>' : '') + '</tr></thead><tbody>' + sorted.map(m => '<tr><td><button class="linkbtn sn" data-go="student" data-id="' + esc(m.m.id) + '"' + (m.st ? '' : ' disabled') + '></button></td><td>' + m.done + '/' + (C.SECTIONS || []).length + '</td><td>' + m.n7 + '</td><td class="' + (m.acc7 == null ? '' : m.acc7 >= 0.8 ? 'ok' : m.acc7 >= 0.55 ? 'mid' : 'bad') + '">' + (m.acc7 == null ? '–' : Math.round(m.acc7 * 100) + '%') + '</td><td>' + m.min7 + '</td><td>' + m.cw + '</td><td>' + (m.weak ? esc(C.CONCEPTS[m.weak] || m.weak) + ' <span class="muted small">' + Math.round(m.weakM * 100) + '%</span>' : '–') + '</td><td class="small">' + (m.last ? fmtDate(m.last) : m.st ? '–' : 'belum mulai') + '</td>' + (b.classes.kick ? '<td><span id="kick-' + esc(m.m.id) + '"><button class="linkbtn small" data-pact="kick1" data-id="' + esc(m.m.id) + '">Keluarkan</button></span></td>' : '') + '</tr>').join('') + '</tbody></table></div></div>';
    const conc = {}, traps = {};
    mem.filter(m => m.stats).forEach(m => { Object.entries(m.stats.conc).forEach(([k, v]) => { if (v.n < 3) return; const c2 = conc[k] || (conc[k] = { sum: 0, n: 0, weak: 0 }); c2.sum += v.m; c2.n++; if (v.m < 0.55) c2.weak++; }); Object.entries(m.stats.traps).forEach(([k, v]) => { if (v.hits) { const t2 = traps[k] || (traps[k] = { hits: 0, who: 0 }); t2.hits += v.hits; t2.who++; } }); });
    const cl = Object.entries(conc).map(([k, v]) => [k, v.sum / v.n, v.weak, v.n]).sort((x, y) => x[1] - y[1]).slice(0, 6);
    h += '<div class="kgrid"><div class="card"><h2>Konsep paling lemah di kelas</h2>' + (cl.length ? '<ul class="trapbars">' + cl.map(([k, avg, w, n]) => '<li><span>' + esc(C.CONCEPTS[k] || k) + ' <span class="muted small">' + w + '/' + n + ' siswa lemah</span></span><i style="width:' + Math.round(avg * 100) + '%;background:var(--accent)"></i><b>' + Math.round(avg * 100) + '%</b></li>').join('') + '</ul><p class="muted small">Konsep dengan rata-rata rendah cocok dibahas bersama di kelas.</p>' : '<p class="muted">Belum cukup data (minimal 3 soal per konsep per siswa).</p>') + '</div>';
    const tl = Object.entries(traps).filter(([k]) => C.TRAPS[k]).sort((x, y) => y[1].hits - x[1].hits).slice(0, 6);
    h += '<div class="card"><h2>Jebakan paling umum di kelas</h2>' + (tl.length ? '<ul class="trapbars">' + tl.map(([k, v]) => '<li><span>' + esc(C.TRAPS[k].name) + ' <span class="muted small">' + v.who + ' siswa</span></span><i style="width:' + Math.min(100, v.hits * 8) + '%"></i><b>' + v.hits + '×</b></li>').join('') + '</ul>' : '<p class="muted">Belum ada jebakan tercatat.</p>') + '</div></div>';
    const online = members.filter(m => !String(m.id).startsWith('L:'));
    if (b.mode !== 'local') h += '<div class="card"><h2>Kirim pesan ke seluruh kelas</h2>' + (online.length ? '<p class="muted small">Muncul di beranda setiap anggota (' + online.length + ' siswa).</p><textarea id="knote" rows="3" maxlength="600" placeholder="Misalnya: Minggu ini kita fokus Bagian 5. Kerjakan latihan L3 sampai lulus ya!"></textarea>' + linkSelect('knote-l', c.course) + '<p class="err" role="alert" id="knote-e"></p><button class="btn primary" data-pact="kelas-note">' + ic('send') + ' Kirim ke semua</button>' : '<p class="muted">Belum ada anggota.</p>') + '</div>';
    body.innerHTML = h;
    $$('.ktbl .sn', body).forEach((el, k) => { el.textContent = sorted[k].m.name || 'Siswa'; });
    bindManage(c);
  }
  function linkSelect(id, course) {
    return '<label class="lbl" for="' + id + '">Tautkan ke</label><select id="' + id + '"><option value="">(tidak ada)</option><option value="k:' + course + '|review">Review harian</option><option value="k:' + course + '|mistakes">Buku kesalahan</option><option value="k:' + course + '|tryout">Tryout</option>' + ((C.SECTIONS || []).map(x => '<option value="k:' + course + '|lesson:' + x.id + '">Bagian ' + x.id + ': ' + esc(x.short) + '</option>').join('')) + '</select>';
  }
  /* Mode lokal/Claude: guru memilih anggota sendiri (siswa dari kode progres / pengguna yang pernah membuka situs) */
  function manageMembers(c, members) {
    const b = bb();
    return '<details class="card" id="mman"><summary><b>' + ic('users') + ' Atur anggota</b></summary><div id="mcand"><p class="muted">Memuat daftar…</p></div>' +
      (b.mode === 'local' ? '<div class="form"><h3>Tambah siswa dari kode progres</h3><p class="muted small">Siswa membuat kode di menu Akun → Pengaturan → Kode progres, lalu mengirimnya ke kamu. Kirim ulang kode untuk memperbarui datanya.</p><label class="lbl" for="dname">Nama siswa</label><input id="dname" maxlength="30" placeholder="misalnya: Dika"><label class="lbl" for="dcode">Kode</label><textarea id="dcode" rows="3" class="mono small" placeholder="Tempel kode BATAS1…"></textarea><p class="err" role="alert" id="dcode-e"></p><button class="btn" data-pact="add-code">Tambahkan ke kelas</button></div>' : '<p class="muted small">Daftar berisi semua orang yang pernah menyimpan progres di situs ini.</p>') + '</details>';
  }
  async function bindManage(c) {
    const box = $('#mcand'); if (!box) return;
    const [cand, members] = await Promise.all([bb().classes.candidates(), bb().classes.members(c.id)]);
    const ids = new Set(members.map(m => m.id));
    box.innerHTML = cand.length ? '<div class="kmem">' + cand.map(s => '<label><input type="checkbox" data-sid="' + esc(s.id) + '"' + (ids.has(s.id) ? ' checked' : '') + '> <span></span></label>').join('') + '</div><p class="err" id="mm-e"></p><button class="btn primary small" data-pact="mem-save">Simpan anggota</button>' : '<p class="muted">Belum ada calon anggota.</p>';
    $$('.kmem span', box).forEach((sp, k) => { sp.textContent = cand[k].name || 'Siswa'; });
  }

  /* ---------- Laporan satu siswa (untuk guru) ---------- */
  V.student = function (p) {
    const c = P.cur; const pr = (P.cache.prog || []).find(x => x.id === p.id); const m = (P.cache.members || []).find(x => x.id === p.id) || {};
    if (!c || !pr) { go('kelas', {}, { replace: true }); return; }
    const S = Object.assign(A.fresh(), pr.state);
    let h = statsHTML(S, { mentor: true });
    if (bb().mode !== 'local' && !String(p.id).startsWith('L:')) h += '<div class="card"><h2>Kirim pesan</h2><p class="muted small">Muncul di beranda siswa. Bingkai sebagai bantuan, bukan pengawasan.</p><textarea id="note-t" rows="3" maxlength="600" placeholder="Misalnya: Mantap progresnya! Besok coba latihan L3 Bagian 5 ya."></textarea>' + linkSelect('note-l', c.course) + '<p class="err" role="alert" id="note-e"></p><button class="btn primary" data-pact="note-send" data-id="' + esc(p.id) + '">' + ic('send') + ' Kirim</button><div id="nhist"></div></div>';
    view().innerHTML = page('<span class="sn"></span>', 'Laporan siswa · ' + esc(c.name), h, { wide: true });
    $('.sn').textContent = m.name || pr.name || 'Siswa';
    noteHistory(p.id);
  };
  async function noteHistory(sid) {
    const box = $('#nhist'); if (!box || !bb().notes.history) return;
    try { const list = (await bb().notes.history(sid)).slice().reverse(); if (!list.length) return; box.innerHTML = '<h3>Pesan sebelumnya</h3><ul class="notes">' + list.map(n => '<li><span class="muted small">' + fmtDate(n.t, true) + (n.read ? ' · dibaca' : '') + '</span><p></p></li>').join('') + '</ul>'; $$('.notes p', box).forEach((el, k) => { el.textContent = list[k].text; }); } catch (e) { }
  }

  /* ============ Aksi ============ */
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-pact]'); if (!a || a.disabled) return;
    const d = a.dataset; const b = bb();
    try {
      switch (d.pact) {
        case 'retry': render(); break;
        case 'ltab': go('login', { t: d.t, next: nav.cur.next }, { replace: true }); break;
        case 'login-next': go('login', { next: 'kelas' }); if (d.join) P.pendingJoin = d.join; break;
        case 'logout': await b.auth.signOut(); P.classes = null; A.sync.status = 'lokal'; go('home'); break;
        case 'copy': { try { await navigator.clipboard.writeText(d.v); a.insertAdjacentHTML('afterend', '<span class="ok small tmp"> Tersalin</span>'); setTimeout(() => { const t = a.parentNode && a.parentNode.querySelector('.tmp'); if (t) t.remove(); }, 1500); } catch (err) { prompt('Salin teks ini:', d.v); } break; }
        case 'note-read': { readNotes()[d.id] = 1; A.saveSettings(); if (b.notes.markRead) b.notes.markRead(d.id); render(); break; }
        case 'note-open': { const n = (A.sync.notes || []).find(x => x.id === d.id); readNotes()[d.id] = 1; A.saveSettings(); if (b.notes.markRead) b.notes.markRead(d.id); const l = n && parseLink(n.link); if (l && NR.meta(l.course)) await doTargetIn(l.course, l.target); else render(); break; }
        case 'asg-go': {
          let as = P.cache.asg && P.cache.asg.find(x => x.id === d.aid); if (!as && P.cache.homeRows) { const r = P.cache.homeRows.find(x => x.a.id === d.aid); as = r && r.a; }
          const c = await findClass(d.cls); if (as && c) await doTargetIn(c.course, as.target || {}); break; }
        case 'k-rename': {
          const n = $('#k-name').value.trim(); const m = $('#k-name-m'); if (!n) { m.textContent = 'Nama tidak boleh kosong.'; m.className = 'small bad'; return; }
          a.disabled = true; await b.classes.update(P.cur.id, { name: n }); P.cur.name = n; P.classes = null; $('.cn').textContent = n; m.textContent = '✓ Tersimpan'; m.className = 'small ok'; a.disabled = false; break; }
        case 'k-course': {
          const id = $('#k-course').value; if (id === P.cur.course) return; a.disabled = true;
          await b.classes.update(P.cur.id, { course: id }); P.cur.course = id; P.classes = null; render(); break; }
        case 'k-code1': $('#k-code').innerHTML = '<span class="bad small">Kode lama tidak bisa dipakai lagi. Lanjut?</span> <button class="btn small danger" data-pact="k-code2">Ya, buat kode baru</button>'; break;
        case 'k-code2': { a.disabled = true; const code = await b.classes.newCode(P.cur.id); P.cur.code = code; P.classes = null; render(); break; }
        case 'k-del1': $('#k-del').innerHTML = '<p class="small">Ketik nama kelas <b class="mono"></b> untuk konfirmasi:</p><div class="inline-f"><input id="k-del-n" autocomplete="off"><button class="btn danger" data-pact="k-del2">Hapus permanen</button></div><p class="err" id="k-del-e"></p>'; $('#k-del .mono').textContent = P.cur.name; break;
        case 'k-del2': {
          if ($('#k-del-n').value.trim() !== P.cur.name) { $('#k-del-e').textContent = 'Nama tidak cocok.'; return; }
          a.disabled = true; await b.classes.remove(P.cur.id); P.classes = null; P.cur = null; go('kelas'); break; }
        case 'asg-del1': $('#adel-' + d.k).innerHTML = '<span class="bad small">Hapus tugas ini?</span> <button class="btn small danger" data-pact="asg-del2" data-aid="' + esc(d.aid) + '">Ya, hapus</button>'; break;
        case 'asg-del2': await b.assign.remove(P.cur.id, d.aid); render(); break;
        case 't-prev': case 'r-prev': { const src = $(d.pact === 't-prev' ? '#t-body' : '#r-body').value; const pv = $(d.pact === 't-prev' ? '#t-prev' : '#r-prev'); pv.hidden = false; pv.innerHTML = src.trim() ? safeRich(src) : '<span class="muted">Belum ada isi.</span>'; break; }
        case 't-solve': await b.forum.update(d.id, { solved: d.v === '1' }); render(); break;
        case 't-pin': await b.forum.update(d.id, { pin: d.v === '1' }); render(); break;
        case 't-del1': $('#tdel').innerHTML = '<span class="bad small">Hapus utas beserta semua balasannya?</span> <button class="btn small danger" data-pact="t-del2" data-id="' + esc(d.id) + '">Ya, hapus</button>'; break;
        case 't-del2': await b.forum.remove(d.id); back(); break;
        case 'p-del': await b.forum.removePost(d.tid, d.id); render(); break;
        case 'ksort': nav.ksort = d.s; render(); break;
        case 'leave1': $('#leave').innerHTML = '<span class="bad small">Keluar dari kelas ini? Gurumu tidak lagi melihat progresmu.</span> <button class="btn small danger" data-pact="leave2">Ya, keluar</button>'; break;
        case 'leave2': await b.classes.leave(P.cur.id); P.classes = null; go('kelas'); break;
        case 'kick1': $('#kick-' + CSS.escape(d.id)).innerHTML = '<button class="btn small danger" data-pact="kick2" data-id="' + esc(d.id) + '">Yakin?</button>'; break;
        case 'kick2': await b.classes.kick(P.cur.id, d.id); render(); break;
        case 'mem-save': { const ids = $$('#mcand input:checked').map(x => x.dataset.sid); await b.classes.setMembers(P.cur.id, ids); P.classes = null; render(); break; }
        case 'add-code': {
          const nm = $('#dname').value.trim(); const code = $('#dcode').value.trim();
          let st; try { st = A.decodeCode(code); } catch (err) { $('#dcode-e').textContent = err.message; return; }
          const name = nm || st.nick || 'Siswa';
          const exist = b.students().find(x => x.name === name);
          let sid;
          if (exist) { const all = b.students(); all.find(x => x.id === exist.id).code = code; all.find(x => x.id === exist.id).t = Date.now(); localStorage.setItem('nalar-local-students', JSON.stringify(all)); sid = exist.id; }
          else sid = b.addStudent(name, code);
          const mem = (await b.classes.members(P.cur.id)).map(m => m.id); if (!mem.includes(sid)) mem.push(sid);
          await b.classes.setMembers(P.cur.id, mem); render(); break; }
        case 'kelas-note': {
          const t = $('#knote').value.trim(); if (!t) { $('#knote-e').textContent = 'Tulis pesannya dulu.'; return; }
          const ids = (P.cache.members || []).map(m => m.id).filter(id => !String(id).startsWith('L:'));
          a.disabled = true; let ok = 0; for (const sid of ids) { try { await b.notes.send(sid, t, $('#knote-l').value || null); ok++; } catch (err) { } }
          $('#knote-e').textContent = ''; $('#knote').value = ''; a.disabled = false; a.insertAdjacentHTML('afterend', '<span class="ok small"> Terkirim ke ' + ok + ' siswa.</span>'); break; }
        case 'note-send': {
          const t = $('#note-t').value.trim(); if (!t) { $('#note-e').textContent = 'Tulis pesannya dulu.'; return; }
          a.disabled = true; try { await b.notes.send(d.id, t, $('#note-l').value || null); $('#note-t').value = ''; $('#note-e').textContent = ''; noteHistory(d.id); } catch (err) { $('#note-e').textContent = 'Gagal mengirim: ' + err.message; } a.disabled = false; break; }
      }
    } catch (err) { console.error(err); const el = a.closest('.card') || view(); let m = el.querySelector('.err.pact'); if (!m) { m = document.createElement('p'); m.className = 'err pact'; m.setAttribute('role', 'alert'); el.appendChild(m); } m.textContent = (err && err.message) || 'Terjadi kesalahan.'; }
  });
  /* Setelah masuk lewat tautan undangan, isi kode kelas otomatis */
  A.sync.on(() => { if (P.pendingJoin && bb().user && nav.cur.v !== 'kelas') { const j = P.pendingJoin; P.pendingJoin = null; P.classes = null; go('kelas', { join: j }); } });
})(window);
