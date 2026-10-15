/* Ruang Nalar — pustaka widget interaktif yang bisa dipakai guru di Studio (tanpa kode).
   Guru hanya mengisi PARAMETER (data). Kode widget ditulis pengelola situs di file ini,
   sehingga aman: guru tidak bisa menyisipkan JavaScript ke browser siswa.

   Menambah widget baru (untuk pengelola situs):
     W.def({ id, name, desc, params: [...skema...], mount(el, p) { ... } })
   Jenis parameter: text, longtext, num, select, bool, vars (daftar slider), url.
   sanitize() membersihkan parameter sesuai skema, jadi mount() selalu menerima data yang valid. */
(function (G) {
  'use strict';
  const W = G.NalarWidgets = { defs: {}, list: [] };
  const B = () => G.BM;
  const escH = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const clamp = (v, lo, hi, d) => { v = +v; return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  const fmt = (v) => { if (!isFinite(v)) return v > 0 ? '∞' : '−∞'; const r = Math.round(v * 100) / 100; return String(r).replace('-', '−').replace('.', ','); };
  W.def = function (d) { W.defs[d.id] = d; W.list.push(d); };

  /* Bersihkan parameter sesuai skema widget. Hasil null = widget tidak dikenal. */
  W.sanitize = function (id, raw) {
    const d = W.defs[id]; if (!d) return null; raw = raw || {}; const out = {};
    d.params.forEach(s => {
      const v = raw[s.key];
      if (s.type === 'text') out[s.key] = String(v == null ? s.def || '' : v).slice(0, s.max || 200);
      else if (s.type === 'longtext') out[s.key] = String(v == null ? s.def || '' : v).slice(0, 1000);
      else if (s.type === 'num') out[s.key] = clamp(v, s.min != null ? s.min : -1e6, s.max != null ? s.max : 1e6, s.def);
      else if (s.type === 'select') out[s.key] = s.opts.some(o => o[0] === v) ? v : s.def;
      else if (s.type === 'bool') out[s.key] = v == null ? !!s.def : !!v;
      else if (s.type === 'url') out[s.key] = String(v || '').slice(0, 400);
      else if (s.type === 'vars') out[s.key] = (Array.isArray(v) ? v : s.def || []).slice(0, 4).map(x => {
        const name = /^[a-df-wyz]$/.test(x && x.name) ? x.name : null; if (!name) return null;
        const min = clamp(x.min, -1000, 1000, -5), max = clamp(x.max, -1000, 1000, 5);
        return { name, min: Math.min(min, max), max: Math.max(min, max), step: clamp(x.step, 0.001, 100, 0.1), value: clamp(x.value, Math.min(min, max), Math.max(min, max), 1) };
      }).filter((x, i, a) => x && a.findIndex(y => y && y.name === x.name) === i);
    });
    return d.clean ? d.clean(out) : out;
  };
  W.mount = function (id, el, raw) {
    const d = W.defs[id]; if (!d) { el.innerHTML = '<p class="muted">Widget tidak dikenal.</p>'; return; }
    try { d.mount(el, W.sanitize(id, raw)); } catch (e) { console.warn('widget', id, e.message); el.innerHTML = '<p class="bad"></p>'; el.querySelector('p').textContent = 'Widget gagal dimuat: ' + e.message; }
  };

  /* ---------------- 1. Grafik fungsi dengan slider ---------------- */
  W.def({
    id: 'grafik', name: 'Grafik fungsi + slider',
    desc: 'Siswa menggeser parameter dan melihat grafik berubah. Bisa mengarsir daerah tempat f(x) > 0 atau < 0, cocok untuk pertidaksamaan.',
    params: [
      { key: 'expr', type: 'text', label: 'Rumus f(x)', def: 'a*x^2 + b*x + c', help: 'Pakai x dan nama slider. Contoh: a*x^2+b*x+c, sqrt(x)-k, abs(x-a)-2, sin(b*x).' },
      { key: 'vars', type: 'vars', label: 'Slider', def: [{ name: 'a', min: -3, max: 3, step: 0.1, value: 1 }, { name: 'b', min: -5, max: 5, step: 0.5, value: -2 }, { name: 'c', min: -5, max: 5, step: 0.5, value: -3 }] },
      { key: 'shade', type: 'select', label: 'Arsir daerah', def: 'gt', opts: [['none', 'Tidak ada'], ['gt', 'f(x) > 0'], ['ge', 'f(x) ≥ 0'], ['lt', 'f(x) < 0'], ['le', 'f(x) ≤ 0']] },
      { key: 'xmin', type: 'num', label: 'x paling kiri', def: -6, min: -1000, max: 1000 },
      { key: 'xmax', type: 'num', label: 'x paling kanan', def: 6, min: -1000, max: 1000 },
      { key: 'ymin', type: 'num', label: 'y paling bawah', def: -8, min: -1000, max: 1000 },
      { key: 'ymax', type: 'num', label: 'y paling atas', def: 8, min: -1000, max: 1000 }
    ],
    clean(p) { if (p.xmax <= p.xmin) { p.xmin = -6; p.xmax = 6; } if (p.ymax <= p.ymin) { p.ymin = -8; p.ymax = 8; } return p; },
    mount(el, p) {
      const names = p.vars.map(v => v.name); const f = G.NalarExpr.compile(p.expr, ['x'].concat(names));
      const env = {}; p.vars.forEach(v => { env[v.name] = v.value; });
      const Wd = 460, H = 300, X = (x) => (x - p.xmin) / (p.xmax - p.xmin) * Wd, Y = (y) => H - (y - p.ymin) / (p.ymax - p.ymin) * H;
      const REL = { gt: '>', ge: '≥', lt: '<', le: '≤' };
      el.innerHTML = '<svg class="w-svg wl-plot" viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="Grafik fungsi"></svg><div class="wl-read"></div><div class="wl-sliders">' + p.vars.map(v => '<label class="wl-sl"><span><i>' + v.name + '</i> = <b data-v="' + v.name + '"></b></span><input type="range" min="' + v.min + '" max="' + v.max + '" step="' + v.step + '" value="' + v.value + '" data-s="' + v.name + '"></label>').join('') + '</div>';
      const svg = el.querySelector('svg'); const clip = 'wlc' + Math.random().toString(36).slice(2, 8);
      function solveSet(sign) {
        // cari interval tempat f memenuhi relasi dengan sampel + bisection di titik perubahan
        const N = 800, xs = [], fs = []; for (let i = 0; i <= N; i++) { const x = p.xmin + (p.xmax - p.xmin) * i / N; xs.push(x); fs.push(f(Object.assign({ x }, env))); }
        const okAt = (v) => isFinite(v) && (sign === 'gt' ? v > 1e-9 : sign === 'ge' ? v >= -1e-9 : sign === 'lt' ? v < -1e-9 : v <= 1e-9);
        const segs = []; let start = null;
        for (let i = 0; i <= N; i++) {
          const o = okAt(fs[i]);
          if (o && start === null) start = i === 0 ? -Infinity : edge(xs[i - 1], xs[i]);
          if (!o && start !== null) { segs.push([start, edge(xs[i - 1], xs[i])]); start = null; }
        }
        if (start !== null) segs.push([start, Infinity]);
        function edge(a, b) { let fa = f(Object.assign({ x: a }, env)); for (let k = 0; k < 40; k++) { const m = (a + b) / 2, fm = f(Object.assign({ x: m }, env)); if (okAt(fm) === okAt(fa)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }
        return segs;
      }
      function draw() {
        let g = '';
        // kisi & sumbu
        const span = p.xmax - p.xmin, step = span <= 16 ? 1 : span <= 40 ? 5 : Math.pow(10, Math.floor(Math.log10(span / 4)));
        for (let x = Math.ceil(p.xmin / step) * step; x <= p.xmax; x += step) g += '<line x1="' + X(x) + '" y1="0" x2="' + X(x) + '" y2="' + H + '" class="wl-grid"/>' + (Math.abs(x) > 1e-9 && p.ymin <= 0 && p.ymax >= 0 ? '<text x="' + X(x) + '" y="' + Math.min(H - 4, Y(0) + 15) + '" class="wl-tick">' + fmt(x) + '</text>' : '');
        const ys = (p.ymax - p.ymin) <= 16 ? 1 : (p.ymax - p.ymin) <= 40 ? 5 : Math.pow(10, Math.floor(Math.log10((p.ymax - p.ymin) / 4)));
        for (let y = Math.ceil(p.ymin / ys) * ys; y <= p.ymax; y += ys) g += '<line x1="0" y1="' + Y(y) + '" x2="' + Wd + '" y2="' + Y(y) + '" class="wl-grid"/>';
        if (p.ymin <= 0 && p.ymax >= 0) g += '<line x1="0" y1="' + Y(0) + '" x2="' + Wd + '" y2="' + Y(0) + '" class="wl-axis"/>';
        if (p.xmin <= 0 && p.xmax >= 0) g += '<line x1="' + X(0) + '" y1="0" x2="' + X(0) + '" y2="' + H + '" class="wl-axis"/>';
        // arsiran di sumbu x
        let segs = [];
        if (p.shade !== 'none') {
          segs = solveSet(p.shade); const y0 = Math.max(4, Math.min(H - 4, Y(0)));
          segs.forEach(s => { const a = X(Math.max(s[0], p.xmin)), b = X(Math.min(s[1], p.xmax)); g += '<rect x="' + a + '" y="0" width="' + Math.max(0, b - a) + '" height="' + H + '" class="wl-shade"/><line x1="' + a + '" y1="' + y0 + '" x2="' + b + '" y2="' + y0 + '" class="wl-sol"/>'; });
        }
        // kurva (putus di titik tak terdefinisi / loncatan besar)
        let d = '', pen = false, prev = null; const N = 600, big = (p.ymax - p.ymin) * 3;
        for (let i = 0; i <= N; i++) {
          const x = p.xmin + (p.xmax - p.xmin) * i / N; const y = f(Object.assign({ x }, env));
          if (!isFinite(y) || (prev !== null && Math.abs(y - prev) > big)) { pen = false; prev = isFinite(y) ? y : null; continue; }
          const yy = Math.max(-H, Math.min(2 * H, Y(y))); d += (pen ? 'L' : 'M') + X(x).toFixed(1) + ' ' + yy.toFixed(1); pen = true; prev = y;
        }
        g += '<clipPath id="' + clip + '"><rect x="0" y="0" width="' + Wd + '" height="' + H + '"/></clipPath><path d="' + d + '" class="wl-curve" clip-path="url(#' + clip + ')"/>';
        svg.innerHTML = g;
        p.vars.forEach(v => { const b = el.querySelector('[data-v="' + v.name + '"]'); if (b) b.textContent = fmt(env[v.name]); });
        let read = '';
        if (p.shade !== 'none') {
          const txt = !segs.length ? 'tidak ada x yang memenuhi (di rentang grafik)' : segs.map(s => s[0] === -Infinity && s[1] === Infinity ? 'semua x' : s[0] === -Infinity ? 'x < ' + fmt(s[1]) : s[1] === Infinity ? 'x > ' + fmt(s[0]) : fmt(s[0]) + ' < x < ' + fmt(s[1])).join('  atau  ');
          read = '<p class="small"><b>f(x) ' + REL[p.shade] + ' 0</b> saat: <span class="mono wl-ans"></span></p><p class="muted small">Ujung interval dibulatkan; batas grafik ' + fmt(p.xmin) + ' sampai ' + fmt(p.xmax) + '.</p>';
          el.querySelector('.wl-read').innerHTML = read; el.querySelector('.wl-ans').textContent = txt; return;
        }
        el.querySelector('.wl-read').innerHTML = '';
      }
      el.querySelector('.wl-sliders').addEventListener('input', (e) => { const s = e.target.dataset.s; if (!s) return; env[s] = +e.target.value; draw(); });
      draw();
    }
  });

  /* ---------------- 2. Garis bilangan interaktif ---------------- */
  W.def({
    id: 'garis', name: 'Garis bilangan interaktif',
    desc: 'Siswa mengetik pertidaksamaan atau interval, dan langsung melihat garis bilangannya.',
    params: [
      { key: 'prompt', type: 'text', label: 'Petunjuk untuk siswa', def: 'Ketik himpunan penyelesaian, lalu lihat garis bilangannya.', max: 200 },
      { key: 'initial', type: 'text', label: 'Contoh awal', def: 'x < -1 atau x >= 3', max: 100 },
      { key: 'v', type: 'select', label: 'Variabel', def: 'x', opts: [['x', 'x'], ['t', 't'], ['y', 'y'], ['p', 'p']] }
    ],
    mount(el, p) {
      el.innerHTML = '<p class="wl-pr"></p><input class="ans mono wl-in" autocomplete="off" spellcheck="false"><div class="preview wl-out" aria-live="polite"></div>';
      el.querySelector('.wl-pr').textContent = p.prompt; const inp = el.querySelector('.wl-in'); inp.value = p.initial;
      const upd = () => { const r = B().parseAnswer(inp.value, p.v); const o = el.querySelector('.wl-out'); if (!inp.value.trim()) { o.innerHTML = ''; return; } if (r.ok) o.innerHTML = B().numberLine(r.set) + '<div class="pv-t">' + B().rich('$' + B().toTex(r.set) + '$') + '</div>'; else { o.innerHTML = '<span class="muted"></span>'; o.firstChild.textContent = r.err; } };
      inp.addEventListener('input', upd); upd();
    }
  });

  /* ---------------- 3. Sematan alat tepercaya ---------------- */
  /* Hanya situs pendidikan tertentu; tautan diubah ke alamat embed resminya. */
  W.embedUrl = function (u) {
    u = String(u || '').trim(); let m;
    if ((m = u.match(/^https:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:.*&)?v=([A-Za-z0-9_-]{6,20})/)) || (m = u.match(/^https:\/\/youtu\.be\/([A-Za-z0-9_-]{6,20})/)) || (m = u.match(/^https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{6,20})/))) return { src: 'https://www.youtube-nocookie.com/embed/' + m[1], kind: 'Video YouTube', ratio: '56.25%' };
    if ((m = u.match(/^https:\/\/www\.desmos\.com\/calculator\/([A-Za-z0-9]{4,20})/))) return { src: 'https://www.desmos.com/calculator/' + m[1] + '?embed', kind: 'Desmos', ratio: '70%' };
    if ((m = u.match(/^https:\/\/www\.geogebra\.org\/(?:m|classic|calculator|graphing|geometry|3d)\/([A-Za-z0-9]{4,20})/)) || (m = u.match(/^https:\/\/www\.geogebra\.org\/material\/iframe\/id\/([A-Za-z0-9]{4,20})/))) return { src: 'https://www.geogebra.org/material/iframe/id/' + m[1], kind: 'GeoGebra', ratio: '70%' };
    if ((m = u.match(/^https:\/\/phet\.colorado\.edu\/sims\/html\/([a-z0-9-]{2,60})\/latest\/([a-z0-9-]{2,60})_([a-z]{2}(?:_[A-Z]{2})?|all)\.html$/))) return { src: 'https://phet.colorado.edu/sims/html/' + m[1] + '/latest/' + m[2] + '_' + m[3] + '.html', kind: 'Simulasi PhET', ratio: '66%' };
    return null;
  };
  W.def({
    id: 'sematan', name: 'Sematan: Desmos / GeoGebra / PhET / YouTube',
    desc: 'Tampilkan alat interaktif atau video dari situs pendidikan tepercaya langsung di materi.',
    params: [
      { key: 'url', type: 'url', label: 'Tautan', def: '', help: 'Contoh: https://www.desmos.com/calculator/abcd1234, https://www.geogebra.org/m/abcd1234, tautan simulasi PhET (…_all.html atau …_in.html), atau https://www.youtube.com/watch?v=…' },
      { key: 'caption', type: 'text', label: 'Keterangan (opsional)', def: '', max: 200 }
    ],
    mount(el, p) {
      const e = W.embedUrl(p.url);
      if (!e) { el.innerHTML = '<p class="muted small">Tautan belum didukung. Gunakan tautan Desmos, GeoGebra, simulasi PhET, atau YouTube.</p>'; return; }
      el.innerHTML = '<div class="wl-embed" style="padding-top:' + e.ratio + '"><iframe src="' + escH(e.src) + '" title="' + escH(e.kind) + '" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe></div><p class="muted small wl-cap"></p>';
      el.querySelector('.wl-cap').textContent = (p.caption ? p.caption + ' · ' : '') + 'Sumber: ' + e.kind;
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
