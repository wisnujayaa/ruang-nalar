/* Ruang Nalar — compiling & sanitizing teacher-made courses.
   Courses from the web editor are USER DATA, so they are never trusted:
   - no raw HTML: text uses light formatting (**bold**, *italic*, "- " lists, $…$ math)
   - all text is escaped; math is stripped of < > & before rendering
   - only safe block types & question types are allowed (no custom widgets/JS)
   - resource links must be https://
   compile() returns the same format as file-based courses, so the UI can't tell them apart. */
(function (G) {
  'use strict';
  const S = G.NalarSafe = {};
  const str = (v, max) => String(v == null ? '' : v).slice(0, max || 5000);
  const escH = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\$/g, '&#36;');
  const MATH = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  const cleanMath = (m) => m.replace(/</g, '\\lt ').replace(/>/g, '\\gt ').replace(/&/g, '\\& ');
  const inline = (t) => t.replace(/\*\*([^*\n]+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<i>$2</i>');
  /* Pull out math → replace with tokens, escape the rest, format, then put the sanitized math back */
  function protect(s) {
    const maths = [];
    const body = str(s).replace(MATH, (m) => { maths.push(cleanMath(m)); return '\u0001' + (maths.length - 1) + '\u0002'; });
    return { text: escH(body), restore: (h) => h.replace(/\u0001(\d+)\u0002/g, (_, i) => maths[+i]) };
  }
  /* Single-line / short text (question, choices, solution, etc.) */
  S.text = function (s, max) { const p = protect(str(s, max)); return p.restore(inline(p.text).replace(/\n/g, '<br>')); };
  /* Long text with paragraphs & lists */
  S.md = function (s) {
    const p = protect(str(s, 20000));
    const blocks = p.text.replace(/\r/g, '').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    const html = blocks.map(b => {
      const lines = b.split('\n');
      if (lines.every(l => /^[-•]\s+/.test(l))) return '<ul>' + lines.map(l => '<li>' + inline(l.replace(/^[-•]\s+/, '')) + '</li>').join('') + '</ul>';
      if (lines.every(l => /^\d+[.)]\s+/.test(l))) return '<ol>' + lines.map(l => '<li>' + inline(l.replace(/^\d+[.)]\s+/, '')) + '</li>').join('') + '</ol>';
      return '<p>' + lines.map(inline).join('<br>') + '</p>';
    }).join('');
    return p.restore(html);
  };
  const ID = /^[a-z0-9-]{1,40}$/;
  const plain = (v, max) => str(v, max).replace(/[\u0000-\u001f]/g, ' ').trim();   // for fields rendered through esc()
  const MODES = ['sekolah', 'utbk', 'mandiri', 'olimpiade'];
  const BLOCKS = ['text', 'example', 'q', 'traps', 'retrieval', 'recap', 'practice', 'res', 'exit', 'widget'];
  const TYPES = ['mc', 'num', 'interval', 'tf', 'err', 'order'];
  const RES_TYPES = ['artikel', 'video', 'alat', 'buku'];
  const safeUrl = (u) => /^https:\/\/[^\s"'<>`\\]+$/i.test(String(u || '')) ? String(u) : null;
  S.newId = (p) => (p || 'x') + '-' + Math.random().toString(36).slice(2, 8);

  /* Empty course skeleton for the editor */
  S.blank = function () {
    return { v: 1, SECTIONS: [{ id: 1, short: 'Bagian 1', title: 'Bagian 1', glyph: '' }],
      LESSONS: { 1: [{ k: 'text', tag: 'Intuisi', title: 'Pengantar', md: 'Tulis penjelasan di sini. Gunakan **tebal**, *miring*, daftar dengan "- ", dan rumus seperti $x^2-4<0$.' }, { k: 'practice' }, { k: 'exit', prompt: 'Jelaskan dengan kata-katamu sendiri inti bagian ini.', points: [], qs: [] }] },
      BANK: {}, CARDS: [], TRAPS: {}, RES: {} };
  };

  function cleanQ(q, secIds, traps, B) {
    if (!q || !ID.test(q.id || '') || !TYPES.includes(q.type) || !secIds.has(+q.sec)) return null;
    const o = { id: q.id, sec: +q.sec, lvl: Math.max(1, Math.min(6, Math.round(+q.lvl) || 1)), type: q.type, q: S.text(q.q),
      mode: (Array.isArray(q.mode) ? q.mode : ['sekolah']).filter(m => MODES.includes(m)), concepts: ['s' + (+q.sec)] };
    if (!o.mode.length) o.mode = ['sekolah'];
    if (q.sol) o.sol = S.text(q.sol);
    if (Array.isArray(q.hints)) o.hints = q.hints.map(h => S.text(h, 1000)).filter(Boolean).slice(0, 5);
    if (q.trap && traps[q.trap]) o.trap = q.trap;
    if (q.type === 'mc') {
      o.opts = (q.opts || []).slice(0, 8).map(x => ({ t: S.text(x.t, 1000), ok: !!x.ok, why: x.why ? S.text(x.why, 1000) : undefined })).filter(x => x.t);
      if (o.opts.length < 2 || !o.opts.some(x => x.ok)) return null;
    } else if (q.type === 'num') {
      const a = typeof q.ans === 'number' ? q.ans : B.evalNum(String(q.ans).replace(',', '.'));
      if (!isFinite(a)) return null; o.ans = a;
      if (+q.tol > 0) o.tol = +q.tol; if (q.unit) o.unit = plain(q.unit, 20);
    } else if (q.type === 'interval') {
      o.v = /^[a-z]$/.test(q.v || '') ? q.v : 'x';
      const r = B.parseAnswer(String(q.ans || ''), o.v); if (!r.ok) return null;
      o.ansSet = r.set; o.ans = plain(q.ans, 200);
    } else if (q.type === 'tf') {
      o.stmts = (q.stmts || []).slice(0, 8).map(x => ({ t: S.text(x.t, 1000), v: !!x.v, why: S.text(x.why || '', 1000) })).filter(x => x.t);
      if (!o.stmts.length) return null;
    } else if (q.type === 'err') {
      o.steps = (q.steps || []).slice(0, 12).map(x => S.text(x, 1000)).filter(Boolean); o.bad = Math.round(+q.bad); o.why = S.text(q.why || '');
      if (o.steps.length < 2 || !(o.bad >= 0 && o.bad < o.steps.length)) return null;
    } else if (q.type === 'order') {
      o.steps = (q.steps || []).slice(0, 12).map(x => S.text(x, 1000)).filter(Boolean);
      o.extra = (q.extra || []).slice(0, 4).map(x => S.text(x, 1000)).filter(Boolean); o.why = S.text(q.why || '');
      if (o.steps.length < 2) return null;
    }
    return o;
  }

  /* raw (from database/editor) → ready-to-use course object, safe to render */
  S.compile = function (raw) {
    raw = raw || {}; const B = G.BM; const o = {};
    o.SECTIONS = (raw.SECTIONS || []).slice(0, 40).map(s => ({ id: Math.round(+s.id), short: plain(s.short || s.title, 30) || 'Bagian', title: plain(s.title, 100) || 'Bagian', glyph: plain(s.glyph, 8), concepts: ['s' + Math.round(+s.id)] }))
      .filter((s, i, a) => s.id >= 1 && s.id <= 99 && a.findIndex(x => x.id === s.id) === i);
    const secIds = new Set(o.SECTIONS.map(s => s.id));
    o.CONCEPTS = {}; o.SECTIONS.forEach(s => { o.CONCEPTS['s' + s.id] = s.short; });
    o.TRAPS = {};
    Object.entries(raw.TRAPS || {}).slice(0, 60).forEach(([id, t]) => { if (!ID.test(id) || !t) return; o.TRAPS[id] = { name: plain(t.name, 80) || 'Jebakan', sec: secIds.has(+t.sec) ? +t.sec : 0, wrong: S.text(t.wrong, 600), right: S.text(t.right, 600), tip: S.text(t.tip, 800) }; });
    o.BANK = {};
    Object.values(raw.BANK || {}).slice(0, 1500).forEach(q => { const c = cleanQ(q, secIds, o.TRAPS, B); if (c) o.BANK[c.id] = c; });
    o.LESSONS = {};
    o.SECTIONS.forEach(s => {
      const L = (raw.LESSONS || {})[s.id] || [];
      o.LESSONS[s.id] = L.slice(0, 80).filter(b => b && BLOCKS.includes(b.k)).map(b => {
        const t = b.title ? S.text(b.title, 120) : undefined, tag = b.tag ? plain(b.tag, 30) : undefined;
        switch (b.k) {
          case 'text': return { k: 'text', tag: tag || 'Materi', title: t, html: S.md(b.md || '') };
          case 'example': return { k: 'example', tag: tag || 'Contoh', title: t, problem: S.text(b.problem), steps: (b.steps || []).slice(0, 15).map(x => ({ t: S.text(x.t, 1500), hide: !!x.hide, ask: x.ask ? S.text(x.ask, 300) : undefined })).filter(x => x.t) };
          case 'q': return o.BANK[b.id] ? { k: 'q', tag: tag || 'Coba dulu', title: t, id: b.id } : null;
          case 'traps': { const ids = (b.ids || []).filter(id => o.TRAPS[id]); return ids.length ? { k: 'traps', ids } : null; }
          case 'recap': return { k: 'recap', title: t || 'Rangkuman', items: (b.items || []).slice(0, 12).map(x => S.text(x, 500)).filter(Boolean) };
          case 'widget': {
            const NW = G.NalarWidgets; const params = NW && NW.sanitize(b.w, b.params); if (!params) return null;
            const o2 = { k: 'widget', tag: tag || 'Eksperimen', title: t, id: 'lib', lib: b.w, params };
            const pr = b.predict; if (pr && String(pr.q || '').trim() && Array.isArray(pr.opts) && pr.opts.filter(x => String(x).trim()).length >= 2) {
              const opts = pr.opts.map(x => S.text(x, 300)).filter(Boolean).slice(0, 5); o2.predict = { q: S.text(pr.q, 500), opts, ans: Math.max(0, Math.min(opts.length - 1, Math.round(+pr.ans) || 0)), after: plain(pr.after, 400) };
            }
            return o2;
          }
          case 'exit': return { k: 'exit', prompt: plain(b.prompt, 300) || 'Jelaskan inti bagian ini dengan kata-katamu sendiri.', points: (b.points || []).slice(0, 6).map(x => plain(x, 200)).filter(Boolean), qs: (b.qs || []).filter(id => o.BANK[id]).slice(0, 3) };
          default: return { k: b.k };   // retrieval, practice, res
        }
      }).filter(Boolean);
    });
    o.CARDS = (raw.CARDS || []).slice(0, 400).filter(c => c && ID.test(c.id || '') && secIds.has(+c.sec)).map(c => ({ id: c.id, sec: +c.sec, kind: plain(c.kind, 20) || 'Kartu', f: S.text(c.f, 800), b: S.text(c.b, 1500) })).filter(c => c.f && c.b);
    o.RES = {};
    Object.entries(raw.RES || {}).forEach(([sec, list]) => { if (!secIds.has(+sec)) return; o.RES[sec] = (list || []).slice(0, 20).map(r => { const url = safeUrl(r.url); return url ? { type: RES_TYPES.includes(r.type) ? r.type : 'artikel', title: plain(r.title, 120) || url, src: plain(r.src, 60), url, note: r.note ? plain(r.note, 120) : undefined } : null; }).filter(Boolean); });
    return o;
  };

  /* Problems to show in the editor. level: 'error' (that part won't be shown) | 'warn' (suggestion) */
  S.validate = function (raw) {
    const out = []; const B = G.BM; raw = raw || {};
    const secs = raw.SECTIONS || []; const secIds = new Set(secs.map(s => +s.id));
    if (!secs.length) out.push({ level: 'error', msg: 'Kursus belum punya bagian.' });
    const traps = raw.TRAPS || {};
    const bank = raw.BANK || {};
    Object.values(bank).forEach(q => {
      const name = 'Soal "' + String(q.q || '').replace(/\s+/g, ' ').slice(0, 40) + '…"';
      if (!String(q.q || '').trim()) out.push({ level: 'error', msg: 'Ada soal tanpa pertanyaan.', q: q.id });
      else if (!cleanQ(q, secIds, traps, B)) {
        let why = 'isiannya belum lengkap';
        if (q.type === 'mc') why = (q.opts || []).filter(x => String(x.t || '').trim()).length < 2 ? 'butuh minimal 2 pilihan' : 'belum ada pilihan yang ditandai benar';
        if (q.type === 'num') why = 'kunci jawaban harus berupa angka (boleh pecahan seperti 3/2)';
        if (q.type === 'interval') why = 'kunci jawaban interval tidak terbaca, contoh: (-inf, 2] U (5, inf) atau x <= 2 atau x > 5';
        if (q.type === 'err') why = 'butuh minimal 2 langkah dan satu langkah yang ditandai salah';
        if (q.type === 'order') why = 'butuh minimal 2 langkah';
        if (q.type === 'tf') why = 'butuh minimal 1 pernyataan';
        if (!secIds.has(+q.sec)) why = 'bagiannya sudah dihapus';
        out.push({ level: 'error', msg: name + ': ' + why + '. Soal ini tidak akan tampil.', q: q.id });
      } else if (!q.sol) out.push({ level: 'warn', msg: name + ': belum ada pembahasan.', q: q.id });
    });
    secs.forEach(s => {
      const qs = Object.values(bank).filter(q => +q.sec === +s.id);
      const L = (raw.LESSONS || {})[s.id] || [];
      if (!L.some(b => b.k === 'text' || b.k === 'example')) out.push({ level: 'warn', msg: 'Bagian ' + s.id + ' belum punya materi (blok teks/contoh).' });
      if (!qs.length) out.push({ level: 'warn', msg: 'Bagian ' + s.id + ' belum punya soal, jadi panel latihan akan kosong.' });
      const lv = new Set(qs.map(q => +q.lvl)); if (qs.length && !lv.has(1)) out.push({ level: 'warn', msg: 'Bagian ' + s.id + ' belum punya soal level 1. Siswa mulai dari L1; level berikutnya terbuka setelah 4 dari 5 benar.' });
      const ex = L.find(b => b.k === 'exit');
      if (!ex) out.push({ level: 'warn', msg: 'Bagian ' + s.id + ' tidak punya tiket keluar, sehingga bagian ini tidak pernah tercatat "selesai" (tugas "selesaikan bagian" tidak bisa dipakai).' });
      else if (!(ex.qs || []).filter(id => bank[id]).length) out.push({ level: 'warn', msg: 'Tiket keluar Bagian ' + s.id + ' belum memilih soal.' });
    });
    Object.entries(raw.LESSONS || {}).forEach(([sec, L]) => (L || []).forEach(b => {
      if (b.k !== 'widget') return; const NW = G.NalarWidgets; const nm = 'Widget di Bagian ' + sec;
      if (!NW || !NW.defs[b.w]) { out.push({ level: 'error', msg: nm + ': jenis widget belum dipilih.' }); return; }
      const p = NW.sanitize(b.w, b.params);
      if (b.w === 'grafik') { try { G.NalarExpr.compile(p.expr, ['x'].concat(p.vars.map(v => v.name))); } catch (e) { out.push({ level: 'error', msg: nm + ' (grafik): ' + e.message }); } }
      if (b.w === 'sematan' && !NW.embedUrl(p.url)) out.push({ level: 'error', msg: nm + ' (sematan): tautan belum didukung. Gunakan Desmos, GeoGebra, PhET, atau YouTube.' });
    }));
    Object.entries(raw.RES || {}).forEach(([sec, list]) => (list || []).forEach(r => { if (!safeUrl(r.url)) out.push({ level: 'error', msg: 'Tautan sumber "' + String(r.title || r.url || '').slice(0, 40) + '" harus diawali https://' }); }));
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
