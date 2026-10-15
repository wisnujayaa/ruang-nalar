/* Ruang Nalar — Studio: editor kursus berbasis formulir untuk guru (tanpa menulis kode).
   Data yang diedit (E.raw) memakai format kursus yang sama dengan kursus berbasis file,
   tetapi teks materi ditulis dengan format ringan (md) dan selalu dibersihkan oleh NalarSafe.compile()
   sebelum ditampilkan ke siswa. */
(function (G) {
  'use strict';
  const A = G.BA, U = G.BU, NR = G.NR, Sf = G.NalarSafe, B = G.BM;
  const { go, back, render, V, ic, rich, $, $$, view, openCourse } = U;
  const bb = () => G.BB;
  const escA = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const LV = U.LV;
  const TYPE = { mc: 'Pilihan ganda', num: 'Isian angka', interval: 'Isian interval', tf: 'Benar / salah', err: 'Cari langkah yang salah', order: 'Susun langkah (bukti)' };
  const KIND = { text: 'Teks materi', example: 'Contoh bertahap', q: 'Soal "coba dulu"', traps: 'Awas jebakan', recap: 'Rangkuman mini', practice: 'Latihan bertingkat (otomatis)', retrieval: 'Pemanasan ingatan (otomatis)', res: 'Sumber belajar', exit: 'Tiket keluar' };
  const TAGS = ['Intuisi', 'Analogi', 'Materi', 'Kenapa begitu?', 'Catatan', 'Contoh'];
  const MODES = [['sekolah', 'Ulangan'], ['utbk', 'UTBK'], ['mandiri', 'Mandiri'], ['olimpiade', 'Olimpiade']];
  const E = G.BE = { id: null, meta: null, raw: null, dirty: false, tab: 'info', sec: null, open: {}, saving: false };
  const plainPreview = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n || 80) || '(kosong)';
  const field = (label, html, help) => '<label class="ed-f"><span class="lbl">' + label + '</span>' + html + '</label>' + (help ? '<p class="muted small ed-help">' + help + '</p>' : '');
  const inp = (path, val, ph, extra) => '<input data-b="' + path + '" value="' + escA(val) + '"' + (ph ? ' placeholder="' + escA(ph) + '"' : '') + (extra || '') + '>';
  const ta = (path, val, rows, ph, t) => '<textarea data-b="' + path + '" rows="' + (rows || 3) + '"' + (t ? ' data-t="' + t + '"' : '') + (ph ? ' placeholder="' + escA(ph) + '"' : '') + '>' + escA(val) + '</textarea>';
  const sel = (path, val, opts, t) => '<select data-b="' + path + '"' + (t ? ' data-t="' + t + '"' : '') + '>' + opts.map(o => '<option value="' + escA(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + escA(o[1]) + '</option>').join('') + '</select>';
  const btn = (act, label, extra, cls) => '<button type="button" class="' + (cls || 'btn small') + '" data-eact="' + act + '"' + (extra || '') + '>' + label + '</button>';
  const FMT = 'Format: **tebal**, *miring*, baris diawali "- " untuk daftar, "1. " untuk daftar bernomor, baris kosong untuk paragraf baru, rumus di antara $…$ (contoh $x^2-4<0$) atau $$…$$ untuk rumus di baris sendiri.';

  /* ---------- akses data ---------- */
  function getPath(o, path) { return path.split('.').reduce((x, k) => x == null ? x : x[k], o); }
  function setPath(o, path, v) { const ks = path.split('.'); const last = ks.pop(); const t = ks.reduce((x, k) => x[k], o); t[last] = v; }
  const secs = () => E.raw.SECTIONS;
  const qsOf = (sec) => Object.values(E.raw.BANK).filter(q => +q.sec === +sec).sort((a, b) => a.lvl - b.lvl);
  function markDirty() { E.dirty = true; const s = $('#ed-status'); if (s) { s.textContent = 'Belum disimpan'; s.className = 'chip st-doing'; } }
  function newQ(type, sec) {
    const q = { id: Sf.newId('q'), sec: +sec, lvl: 1, type, q: '', mode: ['sekolah'], sol: '' };
    return initType(q, type);
  }
  function initType(q, type) {
    q.type = type;
    if (type === 'mc' && !q.opts) q.opts = [{ t: '', ok: true, why: '' }, { t: '', ok: false, why: '' }, { t: '', ok: false, why: '' }];
    if (type === 'num' && q.ans == null) q.ans = '';
    if (type === 'interval') { if (typeof q.ans !== 'string') q.ans = ''; q.v = q.v || 'x'; }
    if (type === 'tf' && !q.stmts) q.stmts = [{ t: '', v: true, why: '' }, { t: '', v: false, why: '' }];
    if ((type === 'err' || type === 'order') && !q.steps) q.steps = ['', '', ''];
    if (type === 'err' && q.bad == null) q.bad = 1;
    if (type === 'order' && !q.extra) q.extra = [];
    return q;
  }

  /* ---------- Studio: daftar kursus saya ---------- */
  V.studio = function () {
    const b = bb(); const can = b.courses && b.courses.canEdit;
    let h = '<section class="page"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div><p class="eyebrow">Untuk guru</p><h1>Studio kursus</h1></div></header>';
    if (!can) {
      h += '<div class="card"><p>' + (b.mode === 'supabase' ? 'Masuk dulu untuk membuat kursus.' : b.mode === 'claude' ? 'Di versi Claude, hanya pemilik halaman yang bisa membuat kursus.' : 'Editor kursus belum tersedia.') + '</p>' + (b.mode === 'supabase' ? '<button class="btn primary" data-go="login">Masuk / daftar</button>' : '') + '</div></section>';
      view().innerHTML = h; return;
    }
    h += '<div class="card nudge"><p><b>Buat kursus tanpa menulis kode.</b> Susun bagian materi, contoh bertahap, soal 6 tipe, flashcard, dan jebakan umum. Semua fitur platform (review berjarak, buku kesalahan, kelas, tugas, laporan guru) langsung berlaku untuk kursusmu.</p>' + btn('new', ic('plus') + ' Buat kursus baru', '', 'btn primary') + '</div>';
    if (b.mode === 'local') h += '<p class="muted small">Mode tanpa server: kursus hanya tersimpan di browser ini.</p>';
    h += '<div id="st-list">' + '<div class="loading"><span class="spin"></span></div>' + '</div></section>';
    view().innerHTML = h;
    NR.refreshRemote().then(list => {
      const box = $('#st-list'); if (!box) return;
      const mine = list.filter(c => c.mine);
      if (!mine.length) { box.innerHTML = '<div class="card empty"><p>Belum ada kursus buatanmu.</p></div>'; return; }
      const VIS = { draft: ['Draf', 'st-todo'], unlisted: ['Lewat tautan', 'st-doing'], public: ['Publik', 'st-done'] };
      box.innerHTML = '<div class="clist">' + mine.map(c => '<div class="ccard st-card"><span class="cglyph" aria-hidden="true"></span><div><p class="eyebrow sub"></p><h3 class="tt"></h3><p class="muted small">' + (c.updated ? 'Diubah ' + new Date(c.updated).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '') + '</p></div><span class="chip ' + VIS[c.visibility][1] + '">' + VIS[c.visibility][0] + '</span><div class="row">' + btn('edit', 'Edit', ' data-id="' + escA(c.id) + '"', 'btn small primary') + '<button class="btn small" data-go="course" data-course="' + escA(c.id) + '">Buka</button><span id="del-' + escA(c.id) + '">' + btn('del1', ic('trash') + ' Hapus', ' data-id="' + escA(c.id) + '"', 'btn small ghost') + '</span></div></div>').join('') + '</div>';
      $$('.st-card', box).forEach((el, k) => { $('.tt', el).textContent = mine[k].title; $('.sub', el).textContent = [mine[k].subject, mine[k].level].filter(Boolean).join(' · ') || 'Kursus'; $('.cglyph', el).textContent = mine[k].glyph || '•'; });
    });
  };

  /* ---------- Editor ---------- */
  V.editor = function (p) {
    if (p.id === 'new') {
      if (!E.raw || E.id || !E.isNew) Object.assign(E, { id: null, isNew: true, meta: { title: '', subject: '', level: '', blurb: '', glyph: '', color: 'accent', visibility: 'draft' }, raw: Sf.blank(), dirty: false, tab: 'info', open: {}, sec: 1 });
      return drawEditor();
    }
    if (E.id === p.id && E.raw) return drawEditor();
    view().innerHTML = '<div class="loading"><span class="spin"></span><p class="muted">Membuka kursus…</p></div>';
    bb().courses.get(p.id).then(got => {
      if (!got) { view().innerHTML = '<div class="card"><p>Kursus tidak ditemukan.</p><button class="btn" data-go="studio">Ke Studio</button></div>'; return; }
      if (!got.meta.mine) { view().innerHTML = '<div class="card"><p>Kamu bukan pemilik kursus ini.</p></div>'; return; }
      const raw = Object.assign(Sf.blank(), got.content || {});
      ['BANK', 'TRAPS', 'RES'].forEach(k => { if (!raw[k] || typeof raw[k] !== 'object') raw[k] = {}; });
      ['CARDS', 'SECTIONS'].forEach(k => { if (!Array.isArray(raw[k])) raw[k] = []; });
      Object.assign(E, { id: got.meta.id, isNew: false, meta: Object.assign({}, got.meta), raw, dirty: false, tab: E.id === got.meta.id ? E.tab : 'info', open: {}, sec: (raw.SECTIONS[0] || {}).id || 1 });
      drawEditor();
    }).catch(e => { view().innerHTML = '<div class="card"><p class="bad"></p></div>'; $('.bad').textContent = e.message; });
  };

  function drawEditor() {
    const t = E.tab;
    const issues = Sf.validate(E.raw); const nErr = issues.filter(i => i.level === 'error').length;
    let h = '<section class="page wide editor"><header class="les-h"><button class="iconbtn" data-eact="leave" aria-label="Kembali ke Studio">' + ic('back') + '</button><div><p class="eyebrow">Studio kursus</p><h1 class="ed-title"></h1></div></header>';
    h += '<div class="ed-bar"><span id="ed-status" class="chip ' + (E.dirty ? 'st-doing' : 'st-done') + '">' + (E.dirty ? 'Belum disimpan' : E.id ? 'Tersimpan' : 'Belum pernah disimpan') + '</span>' + btn('save', 'Simpan', '', 'btn small primary') + btn('preview', 'Pratinjau sebagai siswa') + '</div>';
    h += '<div class="seg ed-tabs" role="tablist">' + [['info', 'Info'], ['materi', 'Bagian & materi'], ['soal', 'Soal (' + Object.keys(E.raw.BANK).length + ')'], ['kartu', 'Kartu & jebakan'], ['terbit', 'Terbitkan' + (nErr ? ' ⚠' : '')]].map(x => '<button role="tab" data-eact="tab" data-t="' + x[0] + '" aria-checked="' + (t === x[0]) + '">' + x[1] + '</button>').join('') + '</div>';
    h += '<div id="ed-body">' + ({ info: tabInfo, materi: tabMateri, soal: tabSoal, kartu: tabKartu, terbit: tabTerbit })[t](issues) + '</div></section>';
    const y = window.scrollY; view().innerHTML = h; window.scrollTo(0, y);
    $('.ed-title').textContent = E.meta.title || 'Kursus baru';
    $$('[data-preview-interval]').forEach(updIntervalPreview);
  }

  function tabInfo() {
    const m = E.meta;
    return '<div class="card form">' +
      field('Judul kursus', inp('meta.title', m.title, 'misalnya: Fungsi Kuadrat', ' maxlength="80"')) +
      field('Mata pelajaran', inp('meta.subject', m.subject, 'misalnya: Matematika', ' maxlength="40"')) +
      field('Jenjang', inp('meta.level', m.level, 'misalnya: SMA kelas X · UTBK', ' maxlength="60"')) +
      field('Deskripsi singkat', ta('meta.blurb', m.blurb, 2, 'Satu-dua kalimat yang membuat orang ingin mulai.'), 'Tampil di kartu katalog.') +
      field('Simbol', inp('meta.glyph', m.glyph, 'x²', ' maxlength="8"'), 'Maksimal 8 karakter, tampil di kartu kursus.') +
      field('Warna', sel('meta.color', m.color, [['accent', 'Biru'], ['sol', 'Hijau toska']])) + '</div>';
  }

  /* ---------- Tab materi ---------- */
  function tabMateri() {
    let h = '<p class="muted small">Setiap bagian adalah satu bab kecil. Di dalamnya, susun blok dari atas ke bawah: mulai dari intuisi, lalu penjelasan, contoh, jebakan, latihan, dan tiket keluar.</p>';
    secs().forEach((s, si) => {
      const P = 'raw.SECTIONS.' + si; const L = E.raw.LESSONS[s.id] = E.raw.LESSONS[s.id] || [];
      h += '<article class="card ed-sec"><div class="ed-sec-h"><span class="num">' + s.id + '</span><div class="ed-grow">' + field('Judul bagian', inp(P + '.title', s.title, 'misalnya: Titik puncak parabola', ' maxlength="100"')) + '<div class="ed-2">' + field('Judul pendek', inp(P + '.short', s.short, 'Titik puncak', ' maxlength="30"')) + field('Simbol', inp(P + '.glyph', s.glyph, '', ' maxlength="8"')) + '</div></div><div class="ed-tools">' + btn('sec-up', '↑', ' data-i="' + si + '" aria-label="Naikkan"') + btn('sec-down', '↓', ' data-i="' + si + '" aria-label="Turunkan"') + '<span id="secdel-' + si + '">' + btn('sec-del1', ic('trash'), ' data-i="' + si + '" aria-label="Hapus bagian"') + '</span></div></div>';
      h += '<ol class="ed-blocks">' + L.map((b, bi) => blockRow(s, b, bi)).join('') + '</ol>';
      h += '<div class="row ed-add"><select id="addk-' + s.id + '">' + Object.entries(KIND).map(([k, v]) => '<option value="' + k + '">' + v + '</option>').join('') + '</select>' + btn('blk-add', ic('plus') + ' Tambah blok', ' data-s="' + s.id + '"') + '</div>';
      h += resEditor(s) + '</article>';
    });
    h += btn('sec-add', ic('plus') + ' Tambah bagian', '', 'btn primary');
    return h;
  }
  function blockSummary(s, b) {
    if (b.k === 'text') return (b.title || '') + ' — ' + plainPreview(b.md, 60);
    if (b.k === 'example') return (b.title || '') + ' — ' + plainPreview(b.problem, 60);
    if (b.k === 'q') { const q = E.raw.BANK[b.id]; return q ? plainPreview(q.q, 70) : '(pilih soal)'; }
    if (b.k === 'traps') return (b.ids || []).length + ' jebakan';
    if (b.k === 'recap') return (b.items || []).length + ' poin';
    if (b.k === 'exit') return (b.qs || []).length + ' soal · ' + (b.points || []).length + ' poin kunci';
    return '';
  }
  function blockRow(s, b, bi) {
    const key = s.id + ':' + bi; const open = E.open[key];
    const P = 'raw.LESSONS.' + s.id + '.' + bi;
    const editable = !['practice', 'retrieval', 'res'].includes(b.k);
    let h = '<li class="ed-blk' + (open ? ' open' : '') + '"><div class="ed-blk-h"><span class="ed-kind">' + escA(KIND[b.k] || b.k) + '</span><span class="ed-sum">' + escA(blockSummary(s, b)) + '</span><span class="ed-tools">' + (editable ? btn('blk-open', open ? 'Tutup' : 'Edit', ' data-k="' + key + '"') : '') + btn('blk-up', '↑', ' data-s="' + s.id + '" data-i="' + bi + '" aria-label="Naikkan"') + btn('blk-down', '↓', ' data-s="' + s.id + '" data-i="' + bi + '" aria-label="Turunkan"') + btn('blk-del', ic('trash'), ' data-s="' + s.id + '" data-i="' + bi + '" aria-label="Hapus blok"') + '</span></div>';
    if (!editable) h += '<p class="muted small ed-note">' + ({ practice: 'Panel latihan L1–L6 diisi otomatis dari soal bagian ini.', retrieval: 'Dua soal acak dari bagian sebelumnya, supaya materi lama tetap diingat.', res: 'Menampilkan sumber belajar bagian ini (atur di bawah).' })[b.k] + '</p>';
    if (open) h += '<div class="ed-blk-b form">' + blockForm(s, b, P) + '</div>';
    return h + '</li>';
  }
  function blockForm(s, b, P) {
    const qs = qsOf(s.id);
    if (b.k === 'text') return '<div class="ed-2">' + field('Label', sel(P + '.tag', b.tag || 'Materi', TAGS.map(x => [x, x]))) + field('Judul', inp(P + '.title', b.title, 'Judul subbab')) + '</div>' + field('Isi', ta(P + '.md', b.md, 10, 'Mulai dari intuisi atau analogi sebelum definisi formal…'), FMT) + btn('md-prev', 'Pratinjau', ' data-p="' + P + '"') + '<div class="preview-f ed-prev" id="prev-' + P.replace(/\./g, '_') + '" hidden></div>';
    if (b.k === 'example') {
      return '<div class="ed-2">' + field('Label', sel(P + '.tag', b.tag || 'Contoh', [['Contoh', 'Contoh'], ['Giliranmu', 'Giliranmu']])) + field('Judul', inp(P + '.title', b.title, 'Contoh lengkap')) + '</div>' + field('Soal contoh', ta(P + '.problem', b.problem, 2, 'Selesaikan $x^2-5x+6<0$.')) +
        '<p class="lbl">Langkah penyelesaian</p><ol class="ed-list">' + (b.steps = b.steps || []).map((st, k) => '<li>' + ta(P + '.steps.' + k + '.t', st.t, 2, 'Langkah ' + (k + 1)) + '<label class="tog small"><input type="checkbox" data-b="' + P + '.steps.' + k + '.hide" data-t="bool"' + (st.hide ? ' checked' : '') + '> <span>Sembunyikan (siswa menebak dulu)</span></label>' + (st.hide ? inp(P + '.steps.' + k + '.ask', st.ask, 'Pertanyaan pancingan, misal: Apa akar-akarnya?') : '') + btn('arr-del', 'Hapus langkah', ' data-p="' + P + '.steps" data-i="' + k + '"', 'linkbtn small') + '</li>').join('') + '</ol>' + btn('arr-add', ic('plus') + ' Langkah', ' data-p="' + P + '.steps" data-new="step"');
    }
    if (b.k === 'q') return qs.length ? field('Soal', sel(P + '.id', b.id || '', [['', '(pilih soal)']].concat(qs.map(q => [q.id, 'L' + q.lvl + ' · ' + plainPreview(q.q, 70)])))) + field('Label', inp(P + '.tag', b.tag || 'Coba dulu', '')) : '<p class="muted">Buat soal dulu di tab Soal untuk Bagian ' + s.id + '.</p>';
    if (b.k === 'traps') { const ts = Object.entries(E.raw.TRAPS); return ts.length ? '<div class="kmem">' + ts.map(([id, t]) => '<label><input type="checkbox" data-eact-chk="blk-trap" data-p="' + P + '" data-id="' + escA(id) + '"' + ((b.ids || []).includes(id) ? ' checked' : '') + '> <span>' + escA(t.name || id) + '</span></label>').join('') + '</div>' : '<p class="muted">Belum ada jebakan. Tambahkan di tab Kartu & jebakan.</p>'; }
    if (b.k === 'recap') return field('Judul', inp(P + '.title', b.title, 'Rangkuman mini')) + field('Poin-poin (satu per baris)', ta(P + '.items', (b.items || []).join('\n'), 5, '', 'lines'));
    if (b.k === 'exit') return field('Pertanyaan penjelasan', inp(P + '.prompt', b.prompt, 'Jelaskan dengan kata-katamu sendiri…')) + field('Poin kunci jawaban (satu per baris)', ta(P + '.points', (b.points || []).join('\n'), 3, '', 'lines'), 'Siswa mencentang poin yang sudah ia tulis setelah membandingkan.') +
      '<p class="lbl">Soal tiket keluar (maksimal 3)</p>' + (qs.length ? '<div class="kmem">' + qs.map(q => '<label><input type="checkbox" data-eact-chk="exit-q" data-p="' + P + '" data-id="' + escA(q.id) + '"' + ((b.qs || []).includes(q.id) ? ' checked' : '') + '> <span>L' + q.lvl + ' · ' + escA(plainPreview(q.q, 60)) + '</span></label>').join('') + '</div>' : '<p class="muted small">Belum ada soal di bagian ini.</p>');
    return '';
  }
  function resEditor(s) {
    const list = E.raw.RES[s.id] = E.raw.RES[s.id] || []; const P = 'raw.RES.' + s.id;
    return '<details class="ed-res"' + (list.length ? '' : '') + '><summary>Sumber belajar eksternal (' + list.length + ')</summary>' + list.map((r, k) => '<div class="ed-res-row">' + sel(P + '.' + k + '.type', r.type || 'artikel', [['artikel', 'Artikel'], ['video', 'Video'], ['alat', 'Alat'], ['buku', 'Buku/PDF']]) + inp(P + '.' + k + '.title', r.title, 'Judul') + inp(P + '.' + k + '.url', r.url, 'https://…') + inp(P + '.' + k + '.src', r.src, 'Sumber, misal YouTube') + btn('arr-del', ic('trash'), ' data-p="' + P + '" data-i="' + k + '" aria-label="Hapus"') + '</div>').join('') + btn('arr-add', ic('plus') + ' Tambah tautan', ' data-p="' + P + '" data-new="res"') + '<p class="muted small">Hanya tautan https:// yang ditampilkan.</p></details>';
  }

  /* ---------- Tab soal ---------- */
  function tabSoal(issues) {
    if (!secs().length) return '<p class="muted">Tambahkan bagian dulu.</p>';
    if (!secs().some(s => s.id === E.sec)) E.sec = secs()[0].id;
    const bad = new Set(issues.filter(i => i.q && i.level === 'error').map(i => i.q));
    let h = '<div class="seg wrap small" role="radiogroup" aria-label="Bagian">' + secs().map(s => '<button role="radio" data-eact="qsec" data-s="' + s.id + '" aria-checked="' + (E.sec === s.id) + '">' + s.id + ' · ' + escA(s.short || s.title) + ' (' + qsOf(s.id).length + ')</button>').join('') + '</div>';
    h += '<div class="row ed-add"><select id="addq">' + Object.entries(TYPE).map(([k, v]) => '<option value="' + k + '">' + v + '</option>').join('') + '</select>' + btn('q-add', ic('plus') + ' Tambah soal', '', 'btn small primary') + '</div>';
    const qs = qsOf(E.sec);
    if (!qs.length) h += '<div class="card empty"><p>Belum ada soal di bagian ini. Buat minimal beberapa soal level 1–3 supaya panel latihan bisa dipakai.</p></div>';
    h += qs.map(q => qCard(q, bad.has(q.id))).join('');
    return h;
  }
  function qCard(q, isBad) {
    const open = E.open['q:' + q.id]; const P = 'raw.BANK.' + q.id;
    let h = '<article class="card ed-q' + (isBad ? ' ed-incomplete' : '') + '"><div class="ed-blk-h"><span class="tag t-l' + q.lvl + '">L' + q.lvl + '</span><span class="ed-kind">' + TYPE[q.type] + '</span><span class="ed-sum">' + escA(plainPreview(q.q, 90)) + '</span><span class="ed-tools">' + (isBad ? '<span class="chip st-late">belum lengkap</span>' : '') + btn('q-open', open ? 'Tutup' : 'Edit', ' data-id="' + escA(q.id) + '"') + btn('q-dup', 'Duplikat', ' data-id="' + escA(q.id) + '"') + btn('q-del', ic('trash'), ' data-id="' + escA(q.id) + '" aria-label="Hapus soal"') + '</span></div>';
    if (open) {
      h += '<div class="form ed-blk-b"><div class="ed-3">' + field('Bagian', sel(P + '.sec', q.sec, secs().map(s => [s.id, s.id + ' · ' + (s.short || s.title)]), 'num')) + field('Level', sel(P + '.lvl', q.lvl, [1, 2, 3, 4, 5, 6].map(l => [l, 'L' + l + ' · ' + LV[l]]), 'num')) + field('Tipe', '<select data-eact-sel="q-type" data-id="' + escA(q.id) + '">' + Object.entries(TYPE).map(([k, v]) => '<option value="' + k + '"' + (q.type === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select>') + '</div>';
      h += '<p class="lbl">Cocok untuk</p><div class="row ed-modes">' + MODES.map(m => '<label class="tog small"><input type="checkbox" data-b="' + P + '.mode" data-t="arr" data-v="' + m[0] + '"' + ((q.mode || []).includes(m[0]) ? ' checked' : '') + '> <span>' + m[1] + '</span></label>').join('') + '</div>';
      h += field('Pertanyaan', ta(P + '.q', q.q, 3, 'Tulis soalnya. Rumus di antara $…$'), FMT);
      h += typeForm(q, P);
      h += field('Petunjuk (opsional, satu per baris, dibuka bertahap)', ta(P + '.hints', (q.hints || []).join('\n'), 2, '', 'lines'));
      h += field('Pembahasan', ta(P + '.sol', q.sol, 3, 'Jelaskan langkahnya. Pembahasan muncul setelah siswa menjawab.'));
      const ts = Object.entries(E.raw.TRAPS); if (ts.length) h += field('Jebakan terkait (opsional)', sel(P + '.trap', q.trap || '', [['', '(tidak ada)']].concat(ts.map(([id, t]) => [id, t.name || id]))), 'Radar jebakan muncul di soal ini sampai siswa benar 3× berturut-turut.');
      h += '<div class="row">' + btn('q-try', 'Coba soal ini', ' data-id="' + escA(q.id) + '"') + '</div><div class="ed-try" id="try-' + escA(q.id) + '"></div></div>';
    }
    return h + '</article>';
  }
  function listRows(P, arr, rowFn, addKind, addLabel) { return '<ol class="ed-list">' + arr.map((x, k) => '<li>' + rowFn(x, k) + '</li>').join('') + '</ol>' + btn('arr-add', ic('plus') + ' ' + addLabel, ' data-p="' + P + '" data-new="' + addKind + '"'); }
  function typeForm(q, P) {
    if (q.type === 'mc') return '<p class="lbl">Pilihan jawaban <span class="muted small">(urutan diacak untuk siswa; isi "kenapa salah" supaya umpan baliknya mendidik)</span></p>' + listRows(P + '.opts', q.opts, (o, k) => '<div class="ed-opt"><label class="ed-ok"><input type="radio" name="ok-' + escA(q.id) + '" data-eact-chk="mc-ok" data-id="' + escA(q.id) + '" data-i="' + k + '"' + (o.ok ? ' checked' : '') + '> benar</label>' + inp(P + '.opts.' + k + '.t', o.t, 'Pilihan ' + 'ABCDEFGH'[k]) + btn('arr-del', ic('trash'), ' data-p="' + P + '.opts" data-i="' + k + '" aria-label="Hapus pilihan"') + '</div>' + (o.ok ? '' : inp(P + '.opts.' + k + '.why', o.why, 'Kenapa pilihan ini salah? (opsional)', ' class="ed-why"')), 'opt', 'Pilihan');
    if (q.type === 'num') return '<div class="ed-2">' + field('Kunci jawaban', inp(P + '.ans', q.ans, 'misal 7, -3, 0.5, 3/2')) + field('Satuan (opsional)', inp(P + '.unit', q.unit, 'cm, rupiah, …')) + '</div>';
    if (q.type === 'interval') return '<div class="ed-2">' + field('Kunci jawaban', '<input data-b="' + P + '.ans" data-preview-interval="' + escA(q.id) + '" value="' + escA(q.ans) + '" placeholder="(-inf, 2] U (5, inf)   atau   x <= 2 atau x > 5">', 'Ujung tak hingga: inf. Gabungan: U atau "atau". Semua jawaban siswa yang setara otomatis dinilai benar.') + field('Variabel', inp(P + '.v', q.v || 'x', 'x', ' maxlength="1"')) + '</div><div class="ed-ivprev" id="ivp-' + escA(q.id) + '"></div>';
    if (q.type === 'tf') return '<p class="lbl">Pernyataan</p>' + listRows(P + '.stmts', q.stmts, (x, k) => '<div class="ed-opt">' + sel(P + '.stmts.' + k + '.v', x.v ? '1' : '', [['1', 'Benar'], ['', 'Salah']], 'bool') + inp(P + '.stmts.' + k + '.t', x.t, 'Pernyataan ' + (k + 1)) + btn('arr-del', ic('trash'), ' data-p="' + P + '.stmts" data-i="' + k + '" aria-label="Hapus"') + '</div>' + inp(P + '.stmts.' + k + '.why', x.why, 'Alasan', ' class="ed-why"'), 'stmt', 'Pernyataan');
    if (q.type === 'err') return '<p class="lbl">Langkah-langkah (tandai langkah PERTAMA yang salah)</p>' + listRows(P + '.steps', q.steps, (x, k) => '<div class="ed-opt"><label class="ed-ok"><input type="radio" name="bad-' + escA(q.id) + '" data-eact-chk="err-bad" data-id="' + escA(q.id) + '" data-i="' + k + '"' + (+q.bad === k ? ' checked' : '') + '> salah</label>' + inp(P + '.steps.' + k, x, 'Langkah ' + (k + 1)) + btn('arr-del', ic('trash'), ' data-p="' + P + '.steps" data-i="' + k + '" aria-label="Hapus"') + '</div>', 'str', 'Langkah') + field('Kenapa langkah itu salah?', ta(P + '.why', q.why, 2));
    if (q.type === 'order') return '<p class="lbl">Langkah dalam urutan yang BENAR <span class="muted small">(diacak untuk siswa)</span></p>' + listRows(P + '.steps', q.steps, (x, k) => '<div class="ed-opt"><span class="key">' + (k + 1) + '</span>' + inp(P + '.steps.' + k, x, 'Langkah ' + (k + 1)) + btn('arr-up', '↑', ' data-p="' + P + '.steps" data-i="' + k + '" aria-label="Naikkan"') + btn('arr-del', ic('trash'), ' data-p="' + P + '.steps" data-i="' + k + '" aria-label="Hapus"') + '</div>', 'str', 'Langkah') +
      '<p class="lbl">Langkah pengecoh (opsional) <span class="muted small">penalaran keliru yang tidak boleh dipakai</span></p>' + listRows(P + '.extra', q.extra || (q.extra = []), (x, k) => '<div class="ed-opt">' + inp(P + '.extra.' + k, x, 'Pengecoh') + btn('arr-del', ic('trash'), ' data-p="' + P + '.extra" data-i="' + k + '" aria-label="Hapus"') + '</div>', 'str', 'Pengecoh') + field('Kenapa pengecoh itu salah?', ta(P + '.why', q.why, 2));
    return '';
  }
  function updIntervalPreview(el) {
    const id = el.dataset.previewInterval; const box = $('#ivp-' + CSS.escape(id)); if (!box) return;
    const q = E.raw.BANK[id]; const r = B.parseAnswer(el.value || '', (q && q.v) || 'x');
    box.innerHTML = !el.value.trim() ? '' : r.ok ? B.numberLine(r.set) + '<p class="small">' + rich('$' + B.toTex(r.set) + '$') + '</p>' : '<p class="bad small"></p>';
    if (!r.ok && el.value.trim()) $('p', box).textContent = r.err;
  }

  /* ---------- Tab kartu & jebakan ---------- */
  function tabKartu() {
    const secOpts = secs().map(s => [s.id, s.id + ' · ' + (s.short || s.title)]);
    let h = '<h2 class="h1like small">Flashcard</h2><p class="muted small">Kartu muncul di menu Flashcard setelah siswa membuka bagiannya, lalu dijadwalkan ulang otomatis (review berjarak).</p>';
    h += E.raw.CARDS.map((c, k) => { const P = 'raw.CARDS.' + k; return '<article class="card form ed-card"><div class="ed-3">' + field('Bagian', sel(P + '.sec', c.sec, secOpts, 'num')) + field('Jenis', inp(P + '.kind', c.kind, 'Konsep / Rumus / Jebakan', ' maxlength="20"')) + '<div class="ed-tools ed-end">' + btn('arr-del', ic('trash') + ' Hapus', ' data-p="raw.CARDS" data-i="' + k + '"') + '</div></div>' + field('Depan (pertanyaan)', ta(P + '.f', c.f, 2)) + field('Belakang (jawaban)', ta(P + '.b', c.b, 2)) + '</article>'; }).join('');
    h += btn('arr-add', ic('plus') + ' Tambah kartu', ' data-p="raw.CARDS" data-new="card"', 'btn small primary');
    h += '<h2 class="h1like small">Katalog jebakan</h2><p class="muted small">Kesalahan umum yang ingin kamu ingatkan. Bisa dipasang di blok "Awas jebakan" dan dihubungkan ke soal.</p>';
    h += Object.entries(E.raw.TRAPS).map(([id, t]) => { const P = 'raw.TRAPS.' + id; return '<article class="card form ed-card"><div class="ed-3">' + field('Nama jebakan', inp(P + '.name', t.name, 'misal: Lupa membalik tanda', ' maxlength="80"')) + field('Bagian', sel(P + '.sec', t.sec || '', [['', 'Umum']].concat(secOpts), 'num')) + '<div class="ed-tools ed-end">' + btn('trap-del', ic('trash') + ' Hapus', ' data-id="' + escA(id) + '"') + '</div></div>' + field('Contoh yang salah', inp(P + '.wrong', t.wrong, '$-2x<6 \\Rightarrow x<-3$')) + field('Yang benar', inp(P + '.right', t.right, '$-2x<6 \\Rightarrow x>-3$')) + field('Tips supaya tidak terjebak', ta(P + '.tip', t.tip, 2)) + '</article>'; }).join('');
    h += btn('trap-add', ic('plus') + ' Tambah jebakan', '', 'btn small');
    return h;
  }

  /* ---------- Tab terbitkan ---------- */
  function tabTerbit(issues) {
    const m = E.meta; const link = E.id ? location.origin + location.pathname + '#kursus=' + E.id : '';
    const errs = issues.filter(i => i.level === 'error'), warns = issues.filter(i => i.level === 'warn');
    let h = '<div class="card"><h2>Siapa yang bisa melihat?</h2>' + [['draft', 'Draf', 'Hanya kamu, dan siswa di kelas yang memakai kursus ini.'], ['unlisted', 'Lewat tautan', 'Siapa pun yang punya tautannya. Tidak muncul di katalog.'], ['public', 'Publik', 'Muncul di katalog beranda untuk semua pengunjung.']].map(v => '<label class="tog ed-vis"><input type="radio" name="vis" data-b="meta.visibility" value="' + v[0] + '"' + (m.visibility === v[0] ? ' checked' : '') + '> <span><b>' + v[1] + '</b><br><span class="muted small">' + v[2] + '</span></span></label>').join('');
    h += link ? '<p class="lbl">Tautan kursus</p><div class="row"><input readonly value="' + escA(link) + '" class="mono small ed-link">' + '<button class="btn small" data-pact="copy" data-v="' + escA(link) + '">' + ic('copy') + ' Salin</button></div>' : '<p class="muted small">Tautan tersedia setelah disimpan.</p>';
    h += '<div class="row">' + btn('save', 'Simpan', '', 'btn primary') + btn('preview', 'Pratinjau sebagai siswa') + '</div></div>';
    h += '<div class="card"><h2>Pemeriksaan kursus</h2>' + (!issues.length ? '<p class="ok">' + ic('check') + ' Tidak ada masalah. Kursus siap dipakai.</p>' : '') + (errs.length ? '<p class="bad"><b>' + errs.length + ' masalah</b> (bagian ini tidak akan tampil ke siswa):</p><ul class="ed-issues bad-l">' + errs.map(i => '<li></li>').join('') + '</ul>' : '') + (warns.length ? '<p><b>' + warns.length + ' saran</b>:</p><ul class="ed-issues">' + warns.map(() => '<li></li>').join('') + '</ul>' : '') + '</div>';
    h += '<div class="card"><h2>Ekspor / impor</h2><p class="muted small">Cadangan kursus dalam format JSON. Bisa juga dipakai untuk memindahkan kursus ke situs Ruang Nalar lain.</p><div class="row">' + btn('export', 'Ekspor JSON') + btn('import', 'Impor JSON (ganti isi)') + '</div><textarea id="ed-json" rows="4" class="mono small" placeholder="Tempel JSON kursus di sini untuk impor"></textarea><p class="small" id="ed-json-m"></p></div>';
    setTimeout(() => { const lis = $$('.ed-issues li'); errs.concat(warns).forEach((i, k) => { if (lis[k]) lis[k].textContent = i.msg; }); });
    return h;
  }

  /* ---------- simpan & pratinjau ---------- */
  async function save(quiet) {
    if (E.saving) return false;
    if (!(E.meta.title || '').trim()) { E.tab = 'info'; drawEditor(); const t = $('[data-b="meta.title"]'); if (t) { t.focus(); t.insertAdjacentHTML('afterend', '<p class="err">Beri judul kursus dulu.</p>'); } return false; }
    E.saving = true; const st = $('#ed-status'); if (st) { st.textContent = 'Menyimpan…'; st.className = 'chip st-doing'; }
    try {
      const id = await bb().courses.save(E.id, E.meta, E.raw);
      const wasNew = !E.id; E.id = id; E.isNew = false; E.dirty = false;
      NR.forget(id); await NR.refreshRemote();
      if (wasNew) U.nav.cur = { v: 'editor', id };
      if (!quiet) drawEditor();
      return true;
    } catch (e) {
      if (st) { st.textContent = 'Gagal menyimpan: ' + e.message; st.className = 'chip st-late'; }
      return false;
    } finally { E.saving = false; }
  }
  async function preview() {
    if (E.dirty || !E.id) { if (!(await save(true))) return; }
    NR.forget(E.id); A.course === E.id && (A.course = null);
    go('course', { course: E.id });
  }

  /* ---------- event ---------- */
  function coerce(el) {
    const t = el.dataset.t; const v = el.type === 'checkbox' ? el.checked : el.value;
    if (t === 'bool') return el.type === 'checkbox' ? el.checked : !!el.value;
    if (t === 'num') return v === '' ? '' : +v;
    if (t === 'lines') return String(v).split('\n').map(x => x.trim()).filter(Boolean);
    return v;
  }
  document.addEventListener('input', (e) => {
    const el = e.target; if (!el.dataset || !el.dataset.b || !E.raw || !el.closest('.editor')) return;
    if (el.dataset.t === 'arr') return;   // ditangani di 'change'
    if (el.type === 'radio' && !el.checked) return;
    setPath(E, el.dataset.b, coerce(el)); markDirty();
    if (el.dataset.b === 'meta.title') { const t = $('.ed-title'); if (t) t.textContent = el.value || 'Kursus baru'; }
    if (el.dataset.previewInterval) updIntervalPreview(el);
  });
  document.addEventListener('change', (e) => {
    const el = e.target; if (!E.raw || !el.closest || !el.closest('.editor')) return;
    if (el.dataset.t === 'arr') { const arr = getPath(E, el.dataset.b) || []; const v = el.dataset.v; const next = el.checked ? Array.from(new Set(arr.concat([v]))) : arr.filter(x => x !== v); setPath(E, el.dataset.b, next); markDirty(); return; }
    if (el.dataset.b && (el.tagName === 'SELECT' || el.type === 'checkbox')) { setPath(E, el.dataset.b, coerce(el)); markDirty(); if (/\.(sec|hide|lvl)$/.test(el.dataset.b)) drawEditor(); return; }
    const c = el.dataset.eactChk, d = el.dataset;
    if (c === 'mc-ok') { E.raw.BANK[d.id].opts.forEach((o, k) => { o.ok = k === +d.i; }); markDirty(); drawEditor(); }
    if (c === 'err-bad') { E.raw.BANK[d.id].bad = +d.i; markDirty(); }
    if (c === 'blk-trap' || c === 'exit-q') {
      const b = getPath(E, d.p); const key = c === 'blk-trap' ? 'ids' : 'qs'; let arr = b[key] || [];
      arr = el.checked ? arr.concat([d.id]) : arr.filter(x => x !== d.id);
      if (c === 'exit-q' && arr.length > 3) { el.checked = false; return; }
      b[key] = arr; markDirty();
    }
    if (el.dataset.eactSel === 'q-type') { initType(E.raw.BANK[d.id], el.value); markDirty(); drawEditor(); }
  });
  const NEW = { step: () => ({ t: '', hide: false }), res: () => ({ type: 'artikel', title: '', url: '', src: '' }), opt: () => ({ t: '', ok: false, why: '' }), stmt: () => ({ t: '', v: true, why: '' }), str: () => '', card: () => ({ id: Sf.newId('k'), sec: E.sec || (secs()[0] || {}).id || 1, kind: 'Konsep', f: '', b: '' }) };
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-eact]'); if (!a) return;
    if (!E.raw && !['new', 'edit', 'del1', 'del2'].includes(a.dataset.eact)) return;
    const d = a.dataset; const S = E.raw ? secs() : [];
    const move = (arr, i, j) => { if (j < 0 || j >= arr.length) return; const [x] = arr.splice(i, 1); arr.splice(j, 0, x); };
    switch (d.eact) {
      case 'new': E.raw = null; E.isNew = false; go('editor', { id: 'new' }); return;
      case 'edit': go('editor', { id: d.id }); return;
      case 'del1': $('#del-' + CSS.escape(d.id)).innerHTML = '<span class="bad small">Hapus permanen? Progres siswa di kursus ini ikut tidak bisa dibuka.</span> ' + btn('del2', 'Ya, hapus', ' data-id="' + escA(d.id) + '"', 'btn small danger'); return;
      case 'del2': try { await bb().courses.remove(d.id); NR.forget(d.id); if (A.set.lastCourse === d.id) { A.set.lastCourse = null; A.saveSettings(); } } catch (err) { alert(err.message); } render(); return;
      case 'leave': if (E.dirty && !confirm('Ada perubahan yang belum disimpan. Tetap keluar?')) return; E.dirty = false; go('studio'); return;
      case 'tab': E.tab = d.t; drawEditor(); return;
      case 'save': save(); return;
      case 'preview': preview(); return;
      case 'sec-add': { const id = Math.max(0, ...S.map(s => s.id)) + 1; S.push({ id, short: 'Bagian ' + id, title: 'Bagian ' + id, glyph: '' }); E.raw.LESSONS[id] = [{ k: 'retrieval' }, { k: 'text', tag: 'Intuisi', title: 'Pengantar', md: '' }, { k: 'practice' }, { k: 'exit', prompt: 'Jelaskan dengan kata-katamu sendiri inti bagian ini.', points: [], qs: [] }]; break; }
      case 'sec-up': move(S, +d.i, +d.i - 1); break;
      case 'sec-down': move(S, +d.i, +d.i + 1); break;
      case 'sec-del1': $('#secdel-' + d.i).innerHTML = '<span class="bad small">Hapus bagian beserta soalnya?</span> ' + btn('sec-del2', 'Ya', ' data-i="' + d.i + '"', 'btn small danger'); return;
      case 'sec-del2': { const s = S[+d.i]; S.splice(+d.i, 1); delete E.raw.LESSONS[s.id]; delete E.raw.RES[s.id]; Object.values(E.raw.BANK).forEach(q => { if (+q.sec === s.id) delete E.raw.BANK[q.id]; }); E.raw.CARDS = E.raw.CARDS.filter(c => +c.sec !== s.id); break; }
      case 'blk-add': { const k = $('#addk-' + d.s).value; const L = E.raw.LESSONS[d.s]; const b = { k }; if (k === 'text') Object.assign(b, { tag: 'Materi', title: '', md: '' }); if (k === 'example') Object.assign(b, { tag: 'Contoh', title: '', problem: '', steps: [{ t: '' }, { t: '', hide: true }] }); if (k === 'recap') Object.assign(b, { title: 'Rangkuman mini', items: [] }); if (k === 'exit') Object.assign(b, { prompt: '', points: [], qs: [] }); if (k === 'traps') b.ids = []; const ex = L.findIndex(x => x.k === 'exit'); const at = ex >= 0 && k !== 'exit' ? ex : L.length; L.splice(at, 0, b); E.open[d.s + ':' + at] = true; break; }
      case 'blk-open': E.open[d.k] = !E.open[d.k]; drawEditor(); return;
      case 'blk-up': move(E.raw.LESSONS[d.s], +d.i, +d.i - 1); E.open = {}; break;
      case 'blk-down': move(E.raw.LESSONS[d.s], +d.i, +d.i + 1); E.open = {}; break;
      case 'blk-del': E.raw.LESSONS[d.s].splice(+d.i, 1); E.open = {}; break;
      case 'md-prev': { const b = getPath(E, d.p); const box = $('#prev-' + d.p.replace(/\./g, '_')); box.hidden = false; box.innerHTML = '<div class="prose">' + rich(Sf.md(b.md || '')) + '</div>'; return; }
      case 'arr-add': { const arr = getPath(E, d.p) || []; arr.push(NEW[d.new]()); setPath(E, d.p, arr); break; }
      case 'arr-del': getPath(E, d.p).splice(+d.i, 1); break;
      case 'arr-up': move(getPath(E, d.p), +d.i, +d.i - 1); break;
      case 'qsec': E.sec = +d.s; break;
      case 'q-add': { const q = newQ($('#addq').value, E.sec); E.raw.BANK[q.id] = q; E.open['q:' + q.id] = true; break; }
      case 'q-open': E.open['q:' + d.id] = !E.open['q:' + d.id]; drawEditor(); return;
      case 'q-dup': { const q = JSON.parse(JSON.stringify(E.raw.BANK[d.id])); q.id = Sf.newId('q'); E.raw.BANK[q.id] = q; E.open['q:' + q.id] = true; break; }
      case 'q-del': delete E.raw.BANK[d.id]; Object.values(E.raw.LESSONS).forEach(L => L.forEach(b => { if (b.k === 'exit') b.qs = (b.qs || []).filter(x => x !== d.id); })); break;
      case 'q-try': {
        const comp = Sf.compile(E.raw); const it = comp.BANK[d.id]; const box = $('#try-' + CSS.escape(d.id));
        if (!it) { box.innerHTML = '<p class="bad small">Soal belum lengkap, jadi belum bisa dicoba. Lihat tab Terbitkan untuk detailnya.</p>'; return; }
        U.QComp(box, it, { src: 'pratinjau', noRecord: true }); return;
      }
      case 'trap-add': { const id = Sf.newId('t'); E.raw.TRAPS[id] = { name: '', sec: E.sec || '', wrong: '', right: '', tip: '' }; break; }
      case 'trap-del': delete E.raw.TRAPS[d.id]; Object.values(E.raw.BANK).forEach(q => { if (q.trap === d.id) delete q.trap; }); break;
      case 'export': $('#ed-json').value = JSON.stringify({ format: 'ruang-nalar-course', v: 1, meta: E.meta, content: E.raw }, null, 1); $('#ed-json-m').textContent = 'Salin teks di atas dan simpan sebagai file .json.'; return;
      case 'import': {
        try { const j = JSON.parse($('#ed-json').value); const c = j.content || j; if (!Array.isArray(c.SECTIONS)) throw new Error('Format tidak dikenali: tidak ada SECTIONS.'); E.raw = Object.assign(Sf.blank(), c); if (j.meta) Object.assign(E.meta, j.meta, { visibility: E.meta.visibility }); E.open = {}; markDirty(); drawEditor(); $('#ed-json-m').textContent = 'Berhasil diimpor. Jangan lupa Simpan.'; }
        catch (err) { $('#ed-json-m').textContent = 'Gagal impor: ' + err.message; }
        return;
      }
      default: return;
    }
    markDirty(); drawEditor();
  });
  document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 's' && U.nav.cur.v === 'editor') { e.preventDefault(); save(); } });
  window.addEventListener('beforeunload', (e) => { if (E.dirty && U.nav.cur.v === 'editor') { e.preventDefault(); e.returnValue = ''; } });
})(window);
