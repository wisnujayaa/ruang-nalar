/* Ruang Nalar — laporan kendala: formulir untuk semua pengguna, kotak masuk untuk admin.
   Laporan disimpan lewat G.BB.reports (lokal / Claude / Supabase). Di mode Supabase, Edge Function
   notify-report meneruskannya ke email / WhatsApp / Telegram admin (lihat docs/LAPORAN.md). */
(function (G) {
  'use strict';
  /* Catat beberapa error terakhir supaya laporan bug lebih mudah dilacak (tanpa data pribadi) */
  const recentErrors = [];
  const pushErr = (m) => { m = String(m || '').slice(0, 160); if (!m) return; recentErrors.push(m); if (recentErrors.length > 5) recentErrors.shift(); };
  G.addEventListener && G.addEventListener('error', e => pushErr(e.message + (e.filename ? ' @' + e.filename.split('/').pop() + ':' + e.lineno : '')));
  G.addEventListener && G.addEventListener('unhandledrejection', e => pushErr('Promise: ' + ((e.reason && e.reason.message) || e.reason)));

  const A = G.BA, U = G.BU;
  const { go, V, nav, ic, esc, $, $$, view } = U;
  const bb = () => G.BB;
  const KINDS = [
    ['bug', 'Bug / error', 'Apa yang kamu lakukan, apa yang terjadi, dan apa yang seharusnya terjadi?'],
    ['soal', 'Soal / kunci salah', 'Bagian mana yang salah? Menurutmu jawaban yang benar apa, dan kenapa?'],
    ['materi', 'Materi / pembahasan salah', 'Kalimat atau langkah mana yang keliru atau membingungkan?'],
    ['saran', 'Saran', 'Fitur atau perbaikan apa yang kamu inginkan?'],
    ['lain', 'Lainnya', 'Ceritakan kendalanya.']
  ];
  const KIND_LABEL = Object.fromEntries(KINDS.map(k => [k[0], k[1]]));
  const STATUS = { baru: ['Baru', 'st-todo'], diproses: ['Diproses', 'st-doing'], selesai: ['Selesai', 'st-done'] };
  const fmt = (t) => t ? new Date(t).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const page = (title, eyebrow, body) => '<section class="page"><header class="les-h"><button class="iconbtn" data-act="back" aria-label="Kembali">' + ic('back') + '</button><div>' + (eyebrow ? '<p class="eyebrow">' + eyebrow + '</p>' : '') + '<h1>' + title + '</h1></div></header>' + body + '</section>';
  const ctxLine = (c) => [c.course && 'Kursus: ' + c.course, c.sec && 'Bagian ' + c.sec + (c.i != null ? ', subbab ' + (+c.i + 1) : ''), c.qid && 'Soal ' + c.qid, c.view && 'Halaman: ' + c.view].filter(Boolean).join(' · ');

  /* Konteks otomatis: di mana pengguna berada saat melapor */
  function autoContext(kind, extra) {
    const c = Object.assign({}, extra || {});
    c.view = c.view || 'akun';
    if (!c.course && A.course) c.course = A.course;
    c.ua = (navigator.userAgent || '').slice(0, 200);
    c.screen = (G.innerWidth || 0) + 'x' + (G.innerHeight || 0);
    if (kind === 'bug' && recentErrors.length) c.errors = recentErrors.slice();
    return c;
  }

  /* ---------------- Formulir laporan ---------------- */
  V.lapor = function (p) {
    const b = bb(); const kind = p.kind || 'bug'; const ctx = p.ctx || {};
    if (!b.reports) { view().innerHTML = page('Laporkan kendala', '', '<div class="card"><p>Fitur laporan belum tersedia di mode ini.</p></div>'); return; }
    const k = KINDS.find(x => x[0] === kind) || KINDS[0];
    let h = '<form class="card form" id="repf" novalidate><p class="muted small">Temukan bug, soal yang kuncinya salah, atau pembahasan yang keliru? Ceritakan di sini. Laporanmu langsung sampai ke pengelola situs.</p>';
    h += '<p class="lbl">Jenis kendala</p><div class="seg wrap" role="radiogroup">' + KINDS.map(x => '<button type="button" role="radio" data-rk="' + x[0] + '" aria-checked="' + (x[0] === kind) + '">' + x[1] + '</button>').join('') + '</div>';
    if (ctx.q || ctx.title) h += '<blockquote class="rep-quote"><p class="eyebrow">' + (ctx.qid ? 'Soal yang dilaporkan' : 'Materi yang dilaporkan') + '</p><p class="rq"></p></blockquote>';
    h += '<label class="lbl" for="rep-body">Ceritakan kendalanya</label><textarea id="rep-body" rows="5" maxlength="2000" placeholder="' + esc(k[2]) + '"></textarea>';
    h += '<label class="lbl" for="rep-contact">Kontak untuk dikabari <span class="muted">(opsional: nomor WA atau email)</span></label><input id="rep-contact" maxlength="120" autocomplete="email" placeholder="misalnya: 0812… atau nama@email.com">';
    if (b.user && b.mode === 'supabase') h += '<p class="muted small">Kamu masuk sebagai <b class="rme"></b>, jadi pengelola bisa membalas lewat akunmu.</p>';
    h += '<details class="rep-tech"><summary class="small">Info teknis yang ikut terkirim</summary><p class="small muted rt"></p></details>';
    h += '<p class="err" role="alert" id="rep-err"></p><button class="btn primary" type="submit">' + ic('send') + ' Kirim laporan</button></form>';
    h += '<div id="rep-mine"></div>';
    view().innerHTML = page('Laporkan kendala', 'Bantuan', h);
    if ($('.rq')) $('.rq').textContent = ctx.q || ctx.title;
    if ($('.rme')) $('.rme').textContent = b.user.name;
    const tech = autoContext(kind, ctx);
    $('.rt').textContent = [ctxLine(tech), 'Perangkat: ' + tech.ua, 'Layar: ' + tech.screen, tech.errors ? 'Error terakhir: ' + tech.errors.join(' | ') : ''].filter(Boolean).join('\n');
    drawMine();
  };

  async function drawMine() {
    const box = $('#rep-mine'); if (!box) return;
    let list = []; try { list = await bb().reports.mine(); } catch (e) { return; }
    if (!list.length || !$('#rep-mine')) return;
    box.innerHTML = '<h2 class="h1like">Laporanku</h2><div class="rep-list">' + list.slice(0, 10).map(r => '<div class="card rep"><div class="rep-h"><span class="chip">' + esc(KIND_LABEL[r.kind] || r.kind) + '</span><span class="chip ' + STATUS[r.status][1] + '">' + STATUS[r.status][0] + '</span><span class="muted small">' + fmt(r.t) + '</span></div><p class="rb"></p><p class="small rn"></p></div>').join('') + '</div>';
    $$('.rep', box).forEach((el, i) => { $('.rb', el).textContent = list[i].body; const n = $('.rn', el); if (list[i].note) n.textContent = 'Balasan pengelola: ' + list[i].note; else n.remove(); });
  }

  async function submit() {
    const b = bb(); const p = nav.cur; const kind = ($('[data-rk][aria-checked="true"]') || {}).dataset ? $('[data-rk][aria-checked="true"]').dataset.rk : 'bug';
    const body = $('#rep-body').value.trim(), contact = $('#rep-contact').value.trim(), err = $('#rep-err');
    if (body.length < 5) { err.textContent = 'Ceritakan kendalanya sedikit lebih lengkap (minimal 5 karakter).'; $('#rep-body').focus(); return; }
    const btn = $('#repf button[type=submit]'); btn.disabled = true; err.textContent = '';
    try {
      const context = autoContext(kind, p.ctx);
      const id = await b.reports.send({ kind, body, contact, context });
      const sent = b.reports.canNotify ? b.reports.notify(id) : null;   // tidak ditunggu: laporan sudah aman tersimpan
      const wa = String((G.NALAR_CONFIG || {}).reportWhatsApp || '').replace(/\D/g, '');
      const waText = '[Laporan Ruang Nalar · ' + KIND_LABEL[kind] + ']\n' + body + (ctxLine(context) ? '\n(' + ctxLine(context) + ')' : '') + '\nNo. laporan: ' + id.slice(0, 8);
      $('#repf').outerHTML = '<div class="card rep-ok"><span class="lk-ic">' + ic('check') + '</span><h2>Terima kasih!</h2><p>Laporanmu sudah masuk dengan nomor <b class="mono">' + esc(id.slice(0, 8)) + '</b>. Pengelola akan memeriksanya' + (contact ? ' dan mengabarimu' : '') + '.</p>' +
        (wa ? '<p class="muted small">Butuh cepat? Kirim juga lewat WhatsApp:</p><a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + wa + '?text=' + encodeURIComponent(waText) + '">' + ic('send') + ' Kirim lewat WhatsApp</a>' : '') +
        '<div class="row"><button class="btn primary" data-act="back">Kembali</button><button class="btn ghost" data-go="lapor">Laporkan hal lain</button></div></div>';
      if (sent) sent.then(r => { if (r && r.channels) console.info('Notifikasi laporan:', r.channels); });
      drawMine();
    } catch (e) { btn.disabled = false; err.textContent = e.message || 'Gagal mengirim. Coba lagi.'; }
  }

  /* ---------------- Kotak masuk admin ---------------- */
  V.laporan = function (p) {
    const b = bb();
    if (!b.reports || !b.isAdmin) { view().innerHTML = page('Laporan masuk', 'Admin', '<div class="card"><p>Halaman ini hanya untuk admin.</p></div>'); return; }
    const f = p.f || 'aktif';
    view().innerHTML = page('Laporan masuk', 'Admin', '<div class="seg" role="radiogroup">' + [['aktif', 'Perlu ditangani'], ['selesai', 'Selesai'], ['semua', 'Semua']].map(x => '<button role="radio" data-go="laporan" data-f="' + x[0] + '" aria-checked="' + (f === x[0]) + '">' + x[1] + '</button>').join('') + '</div>' +
      (b.reports.canNotify ? '<p class="muted small">Laporan baru juga dikirim ke email/WA-mu bila notifikasi sudah diatur (docs/LAPORAN.md).</p>' : '') + '<div id="rep-in"><div class="loading"><span class="spin"></span></div></div>');
    b.reports.all().then(all => {
      const list = all.filter(r => f === 'semua' || (f === 'selesai' ? r.status === 'selesai' : r.status !== 'selesai'));
      const box = $('#rep-in'); if (!box) return;
      if (!list.length) { box.innerHTML = '<div class="card empty"><p>' + ic('check') + ' Tidak ada laporan di sini.</p></div>'; return; }
      box.innerHTML = list.map(r => '<div class="card rep" data-rid="' + esc(r.id) + '"><div class="rep-h"><span class="chip">' + esc(KIND_LABEL[r.kind] || r.kind) + '</span><span class="chip ' + STATUS[r.status][1] + '">' + STATUS[r.status][0] + '</span><span class="muted small">' + fmt(r.t) + ' · <span class="mono">' + esc(r.id.slice(0, 8)) + '</span></span></div>' +
        '<p class="rb"></p><p class="small muted rw"></p><p class="small muted rc"></p>' +
        '<details class="rep-tech"><summary class="small">Info teknis</summary><p class="small muted rt"></p></details>' +
        '<div class="rep-adm"><select data-rst aria-label="Status">' + Object.keys(STATUS).map(s => '<option value="' + s + '"' + (r.status === s ? ' selected' : '') + '>' + STATUS[s][0] + '</option>').join('') + '</select>' +
        '<input data-rnote maxlength="1000" placeholder="Balasan / catatan (terlihat oleh pelapor)"><button class="btn small primary" data-rsave>Simpan</button><button class="btn small ghost" data-rdel>' + ic('trash') + '</button><span class="small rm"></span></div></div>').join('');
      $$('.rep', box).forEach((el, i) => {
        const r = list[i], c = r.context || {};
        $('.rb', el).textContent = r.body;
        $('.rw', el).textContent = 'Dari: ' + (r.who || 'Pengunjung') + (r.contact ? ' · Kontak: ' + r.contact : '');
        $('.rc', el).textContent = ctxLine(c) + (c.q ? ' · "' + String(c.q).slice(0, 140) + '"' : '') + (c.title ? ' · ' + c.title : '');
        $('.rt', el).textContent = JSON.stringify(c, null, 1);
        $('[data-rnote]', el).value = r.note || '';
      });
    }).catch(e => { const box = $('#rep-in'); if (box) box.innerHTML = '<div class="card"><p class="bad"></p></div>', $('#rep-in .bad').textContent = e.message; });
  };

  /* ---------------- Interaksi ---------------- */
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-rep],[data-rk],[data-rsave],[data-rdel]'); if (!t) return;
    if (t.dataset.rep != null) {   // tombol "Laporkan" di soal / materi
      e.preventDefault();
      const q = t.closest('.q'); const les = t.closest('.lesson');
      const ctx = { view: nav.cur.v };
      if (t.dataset.qid) ctx.qid = t.dataset.qid;
      if (t.dataset.sec) ctx.sec = +t.dataset.sec;
      if (t.dataset.i) ctx.i = +t.dataset.i;
      if (q) ctx.q = ($('.q-text', q) || q).textContent.trim().slice(0, 400);
      if (les) ctx.title = ($('h1', les) || {}).textContent;
      go('lapor', { kind: t.dataset.rep || 'bug', ctx });
      return;
    }
    if (t.dataset.rk) {
      $$('[data-rk]').forEach(x => x.setAttribute('aria-checked', String(x === t)));
      const k = KINDS.find(x => x[0] === t.dataset.rk); $('#rep-body').placeholder = k[2];
      nav.cur.kind = t.dataset.rk; return;
    }
    const card = t.closest('.rep'); if (!card) return; const id = card.dataset.rid, m = $('.rm', card);
    try {
      if (t.dataset.rsave != null) { t.disabled = true; await bb().reports.setStatus(id, $('[data-rst]', card).value, $('[data-rnote]', card).value.trim()); m.textContent = '✓ tersimpan'; m.className = 'small rm ok'; t.disabled = false; }
      if (t.dataset.rdel != null) {
        if (!t.dataset.sure) { t.dataset.sure = '1'; t.textContent = 'Yakin hapus?'; return; }
        await bb().reports.remove(id); card.remove();
      }
    } catch (er) { m.textContent = er.message; m.className = 'small rm bad'; t.disabled = false; }
  });
  document.addEventListener('submit', (e) => { if (e.target && e.target.id === 'repf') { e.preventDefault(); submit(); } });

  G.NalarReport = { recentErrors: () => recentErrors.slice() };
})(typeof window !== 'undefined' ? window : globalThis);
