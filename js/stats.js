/* Ruang Nalar — dashboard statistik belajar.
   Semua angka dihitung dari log jawaban (S.attempts), menit harian (S.daily), dan jadwal review (S.items).
   Grafik digambar sebagai SVG biasa; warna memakai token CSS supaya ikut mode terang/gelap.
   Dipakai halaman Statistik siswa dan halaman progres siswa milik guru (opt.mentor). */
(function (G) {
  'use strict';
  const DAY = 86400000;
  const pct = (x) => Math.round(x * 100);
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const median = (a) => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y); const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
  const accOf = (list) => list.length ? sum(list.map(a => a.ok)) / list.length : null;
  /* Penguasaan "terkini": rata-rata eksponensial, jawaban terbaru lebih berbobot (sama seperti peta konsep) */
  const recentMastery = (list) => list.reduce((m, a) => m * 0.65 + a.ok * 0.35, 0.5);

  /* ---------- angka turunan ---------- */
  function compute(S) {
    const A = G.BA, C = G.BC;
    const t = Date.now(), at = S.attempts || [], daily = S.daily || {};
    const minutesOn = (d) => Math.round((daily[d] || 0) / 60000);
    const dayKey = (ms) => A.today(ms);
    const inRange = (from, to) => at.filter(a => a.t >= from && a.t < to);
    const startToday = new Date(new Date(t).toDateString()).getTime();
    const w0 = startToday - 6 * DAY, w1 = w0 - 7 * DAY;
    const thisW = inRange(w0, t + 1), prevW = inRange(w1, w0);
    const minW = (from) => { let m = 0; for (let i = 0; i < 7; i++) m += minutesOn(dayKey(from + i * DAY)); return m; };
    const secs = (C.SECTIONS || []).map(s => {
      const list = at.filter(a => a.s === s.id && a.src !== 'diagnostik');
      const st = (S.sections || {})[s.id] || {}; const L = ((C.LESSONS || {})[s.id] || []).length || 1;
      return { id: s.id, name: s.short || s.title, n: list.length, acc: accOf(list), m: list.length ? recentMastery(list) : null, prog: st.done ? 1 : Math.min(1, (st.step || 0) / L), done: !!st.done };
    });
    const conf = [1, 2, 3].map(c => { const l = at.filter(a => a.c === c); return { c, n: l.length, acc: accOf(l) }; });
    const lv = [1, 2, 3, 4, 5, 6].map(l => { const x = at.filter(a => a.l === l); return { l, n: x.length, acc: accOf(x) }; }).filter(x => x.n);
    const SLOTS = [['Pagi', 4, 11], ['Siang', 11, 15], ['Sore', 15, 19], ['Malam', 19, 28]];
    const hourOf = (ms) => { const h = new Date(ms).getHours(); return h < 4 ? h + 24 : h; };
    const slots = SLOTS.map(([name, a, b]) => { const l = at.filter(x => { const h = hourOf(x.t); return h >= a && h < b; }); return { name, n: l.length, acc: accOf(l) }; });
    const items = Object.values(S.items || {});
    const mem = { fragile: items.filter(s => (s.iv || 0) < 4).length, mid: items.filter(s => s.iv >= 4 && s.iv < 21).length, strong: items.filter(s => s.iv >= 21).length, due: items.filter(s => s.due <= t).length, total: items.length };
    // tren 30 hari: akurasi per hari (hanya hari yang ada jawaban)
    const trend = []; for (let i = 29; i >= 0; i--) { const from = startToday - i * DAY; const l = inRange(from, from + DAY); trend.push({ d: from, n: l.length, acc: accOf(l) }); }
    const totalMin = Math.round(sum(Object.values(daily)) / 60000);
    const ms = at.map(a => a.ms).filter(x => x > 0 && x < 15 * 60000);
    return { t, at, daily, minutesOn, dayKey, startToday, thisW, prevW, minThis: minW(w0), minPrev: minW(w1), secs, conf, lv, slots, mem, trend, totalMin, medSec: Math.round(median(ms) / 1000) };
  }

  /* ---------- komponen ---------- */
  const delta = (now, prev, unit, isPct) => {
    if (prev == null || now == null) return '';
    const d = isPct ? pct(now) - pct(prev) : now - prev;
    if (!d) return '<span class="dl flat">sama seperti minggu lalu</span>';
    return '<span class="dl ' + (d > 0 ? 'up' : 'down') + '">' + (d > 0 ? '▲ ' : '▼ ') + Math.abs(d) + (unit || '') + ' vs minggu lalu</span>';
  };
  function ring(value, label) {
    const r = 46, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, value || 0));
    return '<svg class="ring" viewBox="0 0 120 120" role="img" aria-label="' + label + ' ' + pct(v) + '%"><circle class="ring-bg" cx="60" cy="60" r="' + r + '"/><circle class="ring-fg" cx="60" cy="60" r="' + r + '" stroke-dasharray="' + (c * v).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 60 60)"/><text x="60" y="58" class="ring-v">' + pct(v) + '%</text><text x="60" y="76" class="ring-l">' + label + '</text></svg>';
  }
  /* Kalender aktivitas 18 minggu (seperti GitHub): satu warna, makin pekat makin lama belajar */
  function heatmap(D, goal) {
    const weeks = 18, cell = 12, gap = 3, top = 16, left = 24;
    const today = new Date(D.startToday); const dow = (today.getDay() + 6) % 7;   // Senin = 0
    const start = D.startToday - (dow + (weeks - 1) * 7) * DAY;
    let cells = '', months = '', lastM = -1;
    const lvl = (m) => m <= 0 ? 0 : m < Math.max(5, goal / 2) ? 1 : m < goal ? 2 : m < goal * 2 ? 3 : 4;
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const ms = start + (w * 7 + d) * DAY; if (ms > D.startToday) continue;
        const key = D.dayKey(ms), m = D.minutesOn(key), n = D.at.filter(a => D.dayKey(a.t) === key).length;
        const x = left + w * (cell + gap), y = top + d * (cell + gap);
        cells += '<rect class="hm hm' + lvl(m) + (ms === D.startToday ? ' hm-today' : '') + '" x="' + x + '" y="' + y + '" width="' + cell + '" height="' + cell + '" rx="3"><title>' + new Date(ms).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) + ': ' + m + ' menit' + (n ? ', ' + n + ' soal' : '') + '</title></rect>';
        if (d === 0) { const mo = new Date(ms).getMonth(); if (mo !== lastM) { if (w < weeks - 1) months += '<text class="ax" x="' + x + '" y="10">' + new Date(ms).toLocaleDateString('id-ID', { month: 'short' }) + '</text>'; lastM = mo; } }
      }
    }
    const days = ['Sen', '', 'Rab', '', 'Jum', '', ''].map((s, i) => s ? '<text class="ax" x="0" y="' + (top + i * (cell + gap) + 10) + '">' + s + '</text>' : '').join('');
    const W = left + weeks * (cell + gap), H = top + 7 * (cell + gap);
    const legend = '<div class="hm-leg"><span>Sedikit</span>' + [0, 1, 2, 3, 4].map(i => '<i class="hm' + i + '"></i>').join('') + '<span>Banyak</span><span class="muted">· kotak ke-3 = target ' + goal + ' menit</span></div>';
    return '<div class="hm-wrap"><svg class="heatcal" style="width:' + Math.round(W * 1.45) + 'px" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Kalender aktivitas belajar 18 minggu">' + months + days + cells + '</svg></div>' + legend;
  }
  /* Garis akurasi harian 30 hari; jumlah soal ada di tooltip (bukan sumbu kedua) */
  function trendChart(D) {
    const W = 560, H = 170, l = 34, r = 10, tp = 10, b = 24, iw = W - l - r, ih = H - tp - b;
    const pts = D.trend.map((p, i) => ({ x: l + i / 29 * iw, y: p.acc == null ? null : tp + (1 - p.acc) * ih, p }));
    const have = pts.filter(p => p.y != null);
    if (have.length < 2) return '<p class="muted small">Grafik muncul setelah kamu menjawab soal di minimal 2 hari berbeda dalam 30 hari terakhir.</p>';
    const grid = [0, 0.5, 1].map(v => { const y = tp + (1 - v) * ih; return '<line class="gl" x1="' + l + '" x2="' + (W - r) + '" y1="' + y + '" y2="' + y + '"/><text class="ax" x="' + (l - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + pct(v) + '%</text>'; }).join('');
    const path = have.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
    const area = path + ' L' + have[have.length - 1].x.toFixed(1) + ' ' + (tp + ih) + ' L' + have[0].x.toFixed(1) + ' ' + (tp + ih) + ' Z';
    const dots = have.map(p => '<g class="tdot"><circle class="hit" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="10"/><circle class="dot" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4"/><title>' + new Date(p.p.d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ': ' + pct(p.p.acc) + '% benar dari ' + p.p.n + ' soal</title></g>').join('');
    const xl = [0, 14, 29].map(i => '<text class="ax" x="' + pts[i].x.toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (i === 0 ? 'start' : i === 29 ? 'end' : 'middle') + '">' + (i === 29 ? 'hari ini' : new Date(D.trend[i].d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })) + '</text>').join('');
    const last = have[have.length - 1];
    return '<svg class="trend" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Akurasi harian 30 hari terakhir">' + grid + '<path class="t-area" d="' + area + '"/><path class="t-line" d="' + path + '"/>' + dots + '<text class="t-end" x="' + Math.min(last.x, W - r - 4).toFixed(1) + '" y="' + Math.max(12, last.y - 10).toFixed(1) + '" text-anchor="end">' + pct(last.p.acc) + '%</text>' + xl + '</svg>';
  }
  /* Batang horizontal satu warna; teks nilai memakai warna tinta, bukan warna batang */
  function hbars(rows, opt) {
    opt = opt || {};
    return '<ul class="hbars">' + rows.map(r => '<li title="' + (r.tip || '') + '"><span class="hb-l">' + r.label + '</span><span class="hb-t"><i style="width:' + Math.max(r.v == null ? 0 : 2, pct(r.v || 0)) + '%"' + (r.v == null ? ' class="none"' : '') + '></i>' + (opt.mark ? '<em style="left:' + pct(opt.mark) + '%"></em>' : '') + '</span><b>' + (r.v == null ? '–' : pct(r.v) + '%') + '</b><small>' + (r.sub || '') + '</small></li>').join('') + '</ul>';
  }

  /* ---------- insight otomatis ---------- */
  function insights(D, S, opt) {
    const out = [], who = opt.mentor ? 'Siswa ini' : 'Kamu';
    const weak = D.secs.filter(s => s.n >= 5).sort((a, b) => a.m - b.m)[0];
    if (weak && weak.m < 0.7) out.push({ ic: 'target', t: '<b>Fokus berikutnya: Bagian ' + weak.id + ' (' + G.BU.esc(weak.name) + ')</b>. Penguasaan terkininya ' + pct(weak.m) + '%, terendah di antara bagian yang sudah dikerjakan.', go: opt.mentor ? '' : '<button class="btn small" data-go="lesson" data-sec="' + weak.id + '">Buka bagian ' + weak.id + '</button>' });
    const sure = D.conf[2], guess = D.conf[0];
    if (sure.n >= 5 && sure.acc < 0.7) out.push({ ic: 'radar', t: '<b>Sering yakin, tapi salah.</b> Saat memilih "Yakin", akurasinya hanya ' + pct(sure.acc) + '%. Ini tanda ada salah paham tersembunyi: cek dulu sebelum menekan Periksa.' });
    else if (sure.n >= 5 && sure.acc >= 0.85) out.push({ ic: 'check', t: '<b>Rasa yakinnya bisa dipercaya.</b> Saat "Yakin", ' + pct(sure.acc) + '% jawabannya benar.' });
    if (guess.n >= 5 && guess.acc >= 0.7) out.push({ ic: 'bulb', t: '<b>Tebakannya sering benar (' + pct(guess.acc) + '%).</b> ' + who + ' lebih paham daripada yang ' + (opt.mentor ? 'ia' : 'kamu') + ' kira. Coba lebih percaya diri.' });
    if (!opt.mentor && D.mem.due) out.push({ ic: 'review', t: '<b>' + D.mem.due + ' soal menunggu direview hari ini.</b> Mengulang tepat sebelum lupa adalah cara paling hemat untuk mengingat jangka panjang.', go: '<button class="btn small primary" data-go="review">Mulai review</button>' });
    const best = D.slots.filter(s => s.n >= 8).sort((a, b) => b.acc - a.acc)[0], worst = D.slots.filter(s => s.n >= 8).sort((a, b) => a.acc - b.acc)[0];
    if (best && worst && best !== worst && best.acc - worst.acc >= 0.1) out.push({ ic: 'clock', t: '<b>Jam terbaik: ' + best.name.toLowerCase() + '.</b> Akurasinya ' + pct(best.acc) + '%, dibanding ' + pct(worst.acc) + '% saat ' + worst.name.toLowerCase() + '.' });
    if (!out.length) out.push({ ic: 'bulb', t: D.at.length < 10 ? '<b>Kerjakan beberapa soal lagi</b> supaya pola belajarmu mulai terbaca. Insight muncul setelah sekitar 10 soal.' : '<b>Pertahankan ritmenya!</b> Belum ada titik lemah yang menonjol.' });
    return out.slice(0, 4);
  }

  /* ---------- halaman ---------- */
  function html(S, opt) {
    opt = opt || {};
    const A = G.BA, C = G.BC, U = G.BU, ic = U.ic, esc = U.esc;
    const D = compute(S); const goal = A.set.goal || 20;
    const streak = (() => { const save = A.S; A.S = S; const s = A.streak(); A.S = save; return s; })();
    const accAll = accOf(D.at), accW = accOf(D.thisW), accP = accOf(D.prevW);
    const known = D.secs.filter(s => s.m != null);
    const mastery = known.length ? sum(D.secs.map(s => s.m == null ? 0 : s.m)) / Math.max(1, D.secs.length) : 0;
    const progress = D.secs.length ? sum(D.secs.map(s => s.prog)) / D.secs.length : 0;

    let h = '<div class="st-hero card"><div class="st-rings">' + ring(progress, 'materi') + ring(mastery, 'penguasaan') + '</div><div class="st-hero-t"><p class="eyebrow">' + (opt.mentor ? 'Ringkasan' : 'Perjalananmu') + '</p><p class="st-big">' + (streak ? ic('flame') + ' ' + streak + ' hari beruntun' : 'Mulai rantai belajarmu hari ini') + '</p><p class="muted small">Materi = subbab yang sudah dibaca. Penguasaan = rata-rata kemampuan terkini per bagian, dengan jawaban terbaru lebih berbobot.</p></div></div>';

    h += '<div class="kpis st-kpis">' +
      '<div><b>' + D.minThis + '</b><span>menit 7 hari</span>' + delta(D.minThis, D.minPrev, ' mnt') + '</div>' +
      '<div><b>' + D.thisW.length + '</b><span>soal 7 hari</span>' + delta(D.thisW.length, D.prevW.length) + '</div>' +
      '<div><b>' + (accW == null ? (accAll == null ? '–' : pct(accAll) + '%') : pct(accW) + '%') + '</b><span>' + (accW == null ? 'akurasi total' : 'akurasi 7 hari') + '</span>' + (accW != null && accP != null ? delta(accW, accP, ' poin', true) : '') + '</div>' +
      '<div><b>' + (D.medSec ? D.medSec + ' dtk' : '–') + '</b><span>waktu tipikal per soal</span><span class="dl flat">' + D.at.length + ' soal · ' + D.totalMin + ' menit total</span></div></div>';

    const ins = insights(D, S, opt);
    h += '<div class="card st-ins"><h2>' + ic('bulb') + ' Yang bisa dilakukan sekarang</h2><ul>' + ins.map(x => '<li>' + ic(x.ic) + '<div><p>' + x.t + '</p>' + (x.go || '') + '</div></li>').join('') + '</ul></div>';

    h += '<div class="card"><h2>Kalender belajar</h2><p class="muted small">Setiap kotak satu hari. Arahkan kursor atau ketuk kotak untuk melihat detailnya.</p>' + heatmap(D, goal) + '</div>';
    h += '<div class="card"><h2>Akurasi harian, 30 hari</h2>' + trendChart(D) + '</div>';

    if (D.secs.length) h += '<div class="card"><h2>Penguasaan per bagian</h2><p class="muted small">Panjang batang = kemampuan terkini. Keterangan kanan = jumlah soal dan progres materi.</p>' +
      hbars(D.secs.map(s => ({ label: s.id + '. ' + esc(s.name), v: s.m, sub: (s.n ? s.n + ' soal' : 'belum ada soal') + ' · ' + (s.done ? 'materi selesai' : pct(s.prog) + '% materi'), tip: s.acc == null ? '' : 'Akurasi total ' + pct(s.acc) + '%' })), { mark: 0.8 }) + '<p class="muted small hb-note"><em class="hb-mk"></em> garis 80% = dianggap kuasai</p></div>';

    const CONF = ['Menebak', 'Agak yakin', 'Yakin'];
    h += '<div class="st-two">';
    h += '<div class="card"><h2>Seberapa jujur rasa yakin?</h2><p class="muted small">Idealnya batang makin panjang dari "Menebak" ke "Yakin".</p>' + hbars(D.conf.map(c => ({ label: CONF[c.c - 1], v: c.acc, sub: c.n + ' soal' }))) + '</div>';
    if (D.lv.length) h += '<div class="card"><h2>Akurasi per level</h2><p class="muted small">Wajar menurun di level tinggi. Yang penting, level yang sedang dikerjakan stabil di atas 70%.</p>' + hbars(D.lv.map(x => ({ label: 'L' + x.l + ' ' + ((U.LV && U.LV[x.l]) || ''), v: x.acc, sub: x.n + ' soal' })), { mark: 0.7 }) + '</div>';
    h += '</div>';

    const M = D.mem;
    if (M.total) {
      const seg = (n, cls, lab) => n ? '<i class="' + cls + '" style="flex:' + n + '" title="' + lab + ': ' + n + ' soal"></i>' : '';
      h += '<div class="card"><h2>Kekuatan ingatan</h2><p class="muted small">Dari jadwal review berjarak: makin lama jarak review, makin kuat ingatannya.</p><div class="memo">' + seg(M.fragile, 'm1', 'Rapuh') + seg(M.mid, 'm2', 'Sedang') + seg(M.strong, 'm3', 'Kuat') + '</div>' +
        '<div class="memo-leg"><span><i class="m1"></i>Rapuh (&lt; 4 hari) <b>' + M.fragile + '</b></span><span><i class="m2"></i>Sedang (4–20 hari) <b>' + M.mid + '</b></span><span><i class="m3"></i>Kuat (≥ 21 hari) <b>' + M.strong + '</b></span></div>' +
        (M.due ? '<p class="small">' + ic('clock') + ' <b>' + M.due + '</b> soal jatuh tempo hari ini.</p>' : '<p class="small muted">Tidak ada review yang jatuh tempo hari ini.</p>') + '</div>';
    }
    const sl = D.slots.filter(s => s.n);
    if (sl.length > 1) h += '<div class="card"><h2>Kapan belajar paling efektif?</h2>' + hbars(D.slots.map(s => ({ label: s.name, v: s.acc, sub: s.n + ' soal' }))) + '</div>';

    // bagian lama yang tetap berguna
    const st = A.stats(S);
    if (C.CONCEPTS && Object.keys(C.CONCEPTS).length) h += '<div class="card"><h2>Peta penguasaan konsep</h2><p class="muted small">Per konsep, dari jawaban terakhir (yang terbaru lebih berbobot).</p><div class="heat">' + Object.keys(C.CONCEPTS).map(k => { const c = st.conc[k]; const cls = !c ? 'h0' : c.n < 3 ? 'h1' : c.m >= 0.8 ? 'h4' : c.m >= 0.55 ? 'h3' : 'h2'; return '<div class="hc ' + cls + '" title="' + esc(C.CONCEPTS[k]) + (c ? ' · ' + c.n + ' soal' : '') + '"><span>' + esc(C.CONCEPTS[k]) + '</span></div>'; }).join('') + '</div><div class="heat-leg"><span><i class="hc h0"></i>belum</span><span><i class="hc h1"></i>baru mulai</span><span><i class="hc h2"></i>perlu latihan</span><span><i class="hc h3"></i>cukup</span><span><i class="hc h4"></i>kuat</span></div></div>';
    const tr = Object.entries(st.traps).filter(([k, v]) => v.hits && C.TRAPS && C.TRAPS[k]).sort((a, b) => b[1].hits - a[1].hits).slice(0, 6);
    if (tr.length) h += '<div class="card"><h2>Jebakan yang paling sering mengena</h2><ul class="trapbars">' + tr.map(([k, v]) => '<li><span>' + esc(C.TRAPS[k].name) + '</span><i style="width:' + Math.min(100, v.hits * 12) + '%"></i><b>' + v.hits + '×</b></li>').join('') + '</ul></div>';
    const cw = st.confWrong.slice(-8).reverse();
    if (cw.length) h += '<div class="card"><h2>Salah padahal yakin</h2><p class="muted small">' + (opt.mentor ? 'Paling layak dibahas berdua: di sinilah salah paham tersembunyi.' : 'Soal-soal ini paling berharga untuk dipelajari ulang.') + '</p><ul class="cwlist">' + cw.map(a => { const it = A.item(a.i); return it ? '<li>' + U.rich(String(it.q).replace(/<[^>]+>/g, '').slice(0, 120)) + ' <span class="muted small">' + new Date(a.t).toLocaleDateString('id-ID') + '</span></li>' : ''; }).join('') + '</ul></div>';
    if (opt.mentor) {
      const ex = Object.entries(S.exits || {}); if (ex.length) h += '<div class="card"><h2>Penjelasan di tiket keluar</h2>' + ex.map(([k, v]) => '<blockquote><p class="eyebrow">Bagian ' + k.slice(1) + ' · ' + v.pts + ' poin kunci dicentang</p>' + esc(v.text) + '</blockquote>').join('') + '</div>';
      const dm = Object.entries(S.dumps || {}); if (dm.length) h += '<div class="card"><h2>Brain dump</h2>' + dm.map(([k, v]) => '<blockquote><p class="eyebrow">Bagian ' + k.slice(1) + ' · ' + v.got + ' poin</p>' + esc(v.text) + '</blockquote>').join('') + '</div>';
      const rec = D.at.slice(-12).reverse();
      if (rec.length) h += '<div class="card"><h2>Aktivitas terakhir</h2><ul class="rec">' + rec.map(a => '<li class="' + (a.ok ? 'ok' : 'bad') + '">' + (a.ok ? '✓' : '✗') + ' <span>' + esc(a.s ? U.secMeta(a.s).short : (a.p || 'prasyarat')) + ' · L' + a.l + '</span> <span class="muted small">' + new Date(a.t).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) + ' · ' + ['', 'menebak', 'agak yakin', 'yakin'][a.c || 2] + '</span></li>').join('') + '</ul></div>';
    }
    return h;
  }
  G.NalarStats = { html, compute };
})(typeof window !== 'undefined' ? window : globalThis);
