/* Batas — inti matematika: himpunan interval, parser jawaban, solver, renderer rumus */
(function (G) {
  'use strict';
  const EPS = 1e-9;
  const eq = (a, b) => (a === b) || Math.abs(a - b) < EPS;

  /* ---------- RNG berbiji (supaya soal acak bisa diulang persis) ---------- */
  function rng(seed) {
    let s = (seed >>> 0) || 0x9e3779b9;
    const r = function () {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
    r.int = (a, b) => a + Math.floor(r() * (b - a + 1));
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.nz = (a, b) => { let v = 0; while (v === 0) v = r.int(a, b); return v; };
    r.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    return r;
  }

  /* ---------- Bilangan -> teks ---------- */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
  function frac(n) { // -> {p,q} atau null
    if (!isFinite(n)) return null;
    for (let q = 1; q <= 60; q++) { const p = Math.round(n * q); if (Math.abs(p / q - n) < 1e-9) { const g = gcd(p, q) || 1; return { p: p / g, q: q / g }; } }
    return null;
  }
  function numTex(n) {
    if (n === Infinity) return '\\infty';
    if (n === -Infinity) return '-\\infty';
    const f = frac(n);
    if (!f) return (Math.round(n * 1000) / 1000).toString();
    if (f.q === 1) return String(f.p);
    return (f.p < 0 ? '-' : '') + '\\frac{' + Math.abs(f.p) + '}{' + f.q + '}';
  }
  function numTxt(n) {
    if (n === Infinity) return '∞';
    if (n === -Infinity) return '−∞';
    const f = frac(n);
    if (!f) return String(Math.round(n * 1000) / 1000).replace('-', '−');
    return (f.q === 1 ? String(f.p) : f.p + '/' + f.q).replace('-', '−');
  }

  /* ---------- Himpunan interval ----------
     set = [{a, b, ca, cb}]  a<=b, ca/cb = ujung tertutup */
  const I = (a, b, ca, cb) => ({ a, b, ca: a === -Infinity ? false : !!ca, cb: b === Infinity ? false : !!cb });
  const ALL = () => [I(-Infinity, Infinity, false, false)];
  const PT = (x) => I(x, x, true, true);

  function norm(set) {
    let s = set.filter(p => p.a < p.b - EPS || (eq(p.a, p.b) && p.ca && p.cb))
      .map(p => eq(p.a, p.b) ? I(p.a, p.a, true, true) : I(p.a, p.b, p.ca, p.cb));
    s.sort((x, y) => (eq(x.a, y.a) ? (y.ca - x.ca) : x.a - y.a));
    const out = [];
    for (const p of s) {
      const c = out[out.length - 1];
      if (c && (p.a < c.b - EPS || (eq(p.a, c.b) && (c.cb || p.ca)))) {
        if (p.b > c.b + EPS) { c.b = p.b; c.cb = p.cb; }
        else if (eq(p.b, c.b)) c.cb = c.cb || p.cb;
        if (eq(p.a, c.a)) c.ca = c.ca || p.ca;
      } else out.push({ ...p });
    }
    return out;
  }
  function same(s1, s2) {
    const a = norm(s1), b = norm(s2);
    if (a.length !== b.length) return false;
    return a.every((p, i) => eq(p.a, b[i].a) && eq(p.b, b[i].b) && p.ca === b[i].ca && p.cb === b[i].cb);
  }
  function has(set, x) {
    return set.some(p => (x > p.a + EPS || (eq(x, p.a) && p.ca)) && (x < p.b - EPS || (eq(x, p.b) && p.cb)) || (eq(p.a, p.b) && eq(x, p.a)));
  }
  function complement(set) {
    const s = norm(set); const out = []; let cur = -Infinity, cc = false;
    for (const p of s) {
      out.push(I(cur, p.a, cc, !p.ca));
      cur = p.b; cc = !p.cb;
    }
    out.push(I(cur, Infinity, cc, false));
    return norm(out);
  }
  function intersect(s1, s2) {
    const out = [];
    for (const p of norm(s1)) for (const q of norm(s2)) {
      let a, ca, b, cb;
      if (p.a > q.a + EPS) { a = p.a; ca = p.ca; } else if (q.a > p.a + EPS) { a = q.a; ca = q.ca; } else { a = p.a; ca = p.ca && q.ca; }
      if (p.b < q.b - EPS) { b = p.b; cb = p.cb; } else if (q.b < p.b - EPS) { b = q.b; cb = q.cb; } else { b = p.b; cb = p.cb && q.cb; }
      out.push(I(a, b, ca, cb));
    }
    return norm(out);
  }
  const union = (s1, s2) => norm(s1.concat(s2));
  const minus = (s1, s2) => intersect(s1, complement(s2));
  const isAll = (s) => { const n = norm(s); return n.length === 1 && n[0].a === -Infinity && n[0].b === Infinity; };

  /* titik saksi: satu bilangan yang ada di dalam set (untuk umpan balik "coba x = ...") */
  function witness(set) {
    const s = norm(set); if (!s.length) return null;
    const p = s[0];
    if (eq(p.a, p.b)) return p.a;
    if (p.a === -Infinity && p.b === Infinity) return 0;
    if (p.a === -Infinity) return Math.floor(p.b - 1);
    if (p.b === Infinity) return Math.ceil(p.a + 1);
    if (p.ca) return p.a; if (p.cb) return p.b;
    const m = (p.a + p.b) / 2; const r = Math.round(m);
    if (r > p.a + EPS && r < p.b - EPS) return r;
    const h = Math.round(m * 2) / 2; if (h > p.a + EPS && h < p.b - EPS) return h;
    return m;
  }

  /* ---------- Format ---------- */
  function toTex(set) {
    const s = norm(set);
    if (!s.length) return '\\emptyset';
    if (isAll(s)) return '\\R';
    return s.map(p => eq(p.a, p.b) ? '\\{' + numTex(p.a) + '\\}' :
      (p.ca ? '[' : '(') + numTex(p.a) + ',\\,' + numTex(p.b) + (p.cb ? ']' : ')')).join(' \\cup ');
  }
  function toIneqTex(set, v) {
    v = v || 'x';
    const s = norm(set);
    if (!s.length) return '\\text{tidak ada } ' + v + '\\text{ yang memenuhi}';
    if (isAll(s)) return v + '\\in\\R\\text{ (semua bilangan real)}';
    // kasus R minus titik-titik
    const comp = complement(s);
    if (comp.length && comp.every(p => eq(p.a, p.b))) return comp.map(p => v + '\\ne ' + numTex(p.a)).join(',\\ ');
    return s.map(p => {
      if (eq(p.a, p.b)) return v + '=' + numTex(p.a);
      if (p.a === -Infinity) return v + (p.cb ? '\\le ' : '<') + numTex(p.b);
      if (p.b === Infinity) return v + (p.ca ? '\\ge ' : '>') + numTex(p.a);
      return numTex(p.a) + (p.ca ? '\\le ' : '<') + v + (p.cb ? '\\le ' : '<') + numTex(p.b);
    }).join('\\ \\text{ atau }\\ ');
  }
  function toTxt(set) {
    const s = norm(set);
    if (!s.length) return '∅';
    if (isAll(s)) return 'ℝ';
    return s.map(p => eq(p.a, p.b) ? '{' + numTxt(p.a) + '}' : (p.ca ? '[' : '(') + numTxt(p.a) + ', ' + numTxt(p.b) + (p.cb ? ']' : ')')).join(' ∪ ');
  }

  /* ---------- Evaluasi ujung (angka, pecahan, akar, ∞) ---------- */
  function evalNum(str) {
    let t = String(str).trim().toLowerCase()
      .replace(/−|–|—/g, '-').replace(/\s+/g, '')
      .replace(/∞|inf(inity|initas)?|tak[-]?hingga/g, 'I');
    if (t === 'i' || t === '+i' || t === 'I' || t === '+I') return Infinity;
    if (t === '-i' || t === '-I') return -Infinity;
    if (!/^[-+0-9./*()√sqrt^ ]+$/.test(t)) return NaN;
    t = t.replace(/√\(?([0-9.]+)\)?/g, 'Math.sqrt($1)').replace(/(^|[^.])sqrt\(([^)]+)\)/g, '$1Math.sqrt($2)').replace(/\^/g, '**');
    if (/[a-ln-z]/i.test(t.replace(/Math\.sqrt/g, ''))) return NaN;
    try { const v = Function('"use strict";return (' + t + ')')(); return typeof v === 'number' && !isNaN(v) ? v : NaN; } catch (e) { return NaN; }
  }

  /* ---------- Parser jawaban siswa ----------
     Menerima: notasi interval "(−∞,−2) ∪ [3,∞)", himpunan "{2}", "R", "kosong",
     dan bentuk pertidaksamaan "x < −2 atau x ≥ 3", "-1 <= x < 4", "x != 2". */
  function parseAnswer(raw, v) {
    v = (v || 'x').toLowerCase();
    let s = String(raw || '').trim();
    if (!s) return { ok: false, err: 'Jawabannya masih kosong.' };
    s = s.replace(/−|–|—/g, '-').replace(/≤|=</g, '<=').replace(/≥|=>/g, '>=').replace(/≠|=\/=|<>/g, '!=')
      .replace(/\binf(inity)?\b|∞/gi, '∞');
    const low = s.toLowerCase().replace(/\s+/g, ' ').trim();
    if (/^(∅|\{\s*\}|kosong|tidak ada|tidak ada (solusi|penyelesaian)|himpunan kosong|none)$/.test(low)) return { ok: true, set: [] };
    if (/^(r|ℝ|semua( bilangan)?( real)?|semua x|x ∈ (r|ℝ)|x anggota (r|ℝ)|\(-?∞ ?, ?∞\)|\(-∞ ?, ?\+?∞\))$/.test(low)) return { ok: true, set: ALL() };
    // pisahkan bagian-bagian
    const parts = s.split(/∪|\bU\b|\bu\b|\batau\b|\bor\b|\|\|/i).map(p => p.trim()).filter(Boolean);
    let set = [];
    let restrict = null; // untuk "x != a" yang berdiri sendiri digabung "dan"
    for (let part of parts) {
      // "dan" -> irisan
      const ands = part.split(/\bdan\b|\band\b|&&|,(?=\s*x\s*!=)/i).map(p => p.trim()).filter(Boolean);
      let acc = ALL();
      for (const a of ands) {
        const r = parsePiece(a, v);
        if (!r.ok) return r;
        acc = intersect(acc, r.set);
      }
      set = set.concat(acc);
    }
    if (restrict) set = intersect(set, restrict);
    return { ok: true, set: norm(set) };
  }
  function parsePiece(p, v) {
    p = p.trim();
    if (/^(r|ℝ)$/i.test(p)) return { ok: true, set: ALL() };
    if (/^(∅|\{\s*\})$/.test(p)) return { ok: true, set: [] };
    // himpunan titik {a, b}
    let m = /^\{(.+)\}$/.exec(p);
    if (m && !/x/i.test(m[1])) {
      const vals = m[1].split(/[;,]/);
      const pts = []; for (const t of vals) { const n = evalNum(t); if (isNaN(n) || !isFinite(n)) return { ok: false, err: 'Aku tidak bisa membaca bilangan "' + t.trim() + '".' }; pts.push(PT(n)); }
      return { ok: true, set: norm(pts) };
    }
    // interval [a,b), (a;b], dll
    m = /^([\[\(\]])\s*([^,;]+?)\s*[,;]\s*([^,;]+?)\s*([\]\)\[])$/.exec(p);
    if (m) {
      const a = evalNum(m[2]), b = evalNum(m[3]);
      if (isNaN(a) || isNaN(b)) return { ok: false, err: 'Ujung interval "' + p + '" belum bisa kubaca. Contoh penulisan: [−1, 4) atau (−∞, 2].' };
      const ca = m[1] === '[', cb = m[4] === ']';
      if ((a === -Infinity && ca) || (b === Infinity && cb)) return { ok: false, err: 'Ujung ∞ selalu memakai kurung biasa ( ), bukan siku [ ]. ∞ bukan bilangan, jadi tidak pernah "termasuk".', trap: 'siku-tak-hingga' };
      if (a > b) return { ok: false, err: 'Pada interval, ujung kiri harus lebih kecil dari ujung kanan: "' + p + '".' };
      return { ok: true, set: norm([I(a, b, ca, cb)]) };
    }
    // bentuk pertidaksamaan
    const q = p.replace(/\s+/g, '').toLowerCase().replace(/\bx∈/, 'x');
    const V = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const R = '(<=|>=|<|>|!=|=)';
    // a < x < b
    m = new RegExp('^(.+?)' + R + V + R + '(.+)$').exec(q);
    if (m) {
      const a = evalNum(m[1]), b = evalNum(m[4]);
      if (isNaN(a) || isNaN(b)) return { ok: false, err: 'Bilangan di "' + p + '" belum bisa kubaca.' };
      const o1 = m[2], o2 = m[3];
      if ((o1[0] === '<') && (o2[0] === '<')) { if (a > b) return { ok: true, set: [] }; return { ok: true, set: norm([I(a, b, o1 === '<=', o2 === '<=')]) }; }
      if ((o1[0] === '>') && (o2[0] === '>')) { return { ok: true, set: norm([I(b, a, o2 === '>=', o1 === '>=')]) }; }
      return { ok: false, err: 'Bentuk "' + p + '" campur arah. Tulis berantai dari kecil ke besar, misalnya −1 ≤ x < 4.' };
    }
    m = new RegExp('^' + V + R + '(.+)$').exec(q);
    if (m) {
      const a = evalNum(m[2]); if (isNaN(a)) return { ok: false, err: 'Bilangan "' + m[2] + '" belum bisa kubaca.' };
      return { ok: true, set: rel(m[1], a) };
    }
    m = new RegExp('^(.+?)' + R + V + '$').exec(q);
    if (m) {
      const a = evalNum(m[1]); if (isNaN(a)) return { ok: false, err: 'Bilangan "' + m[1] + '" belum bisa kubaca.' };
      const flip = { '<': '>', '>': '<', '<=': '>=', '>=': '<=', '!=': '!=', '=': '=' };
      return { ok: true, set: rel(flip[m[2]], a) };
    }
    return { ok: false, err: 'Aku belum paham tulisan "' + p + '". Coba bentuk interval seperti (−∞, 2] ∪ (5, ∞), atau bentuk x < 2 atau x > 5.' };
  }
  function rel(op, a) {
    switch (op) {
      case '<': return [I(-Infinity, a, false, false)];
      case '<=': return [I(-Infinity, a, false, true)];
      case '>': return [I(a, Infinity, false, false)];
      case '>=': return [I(a, Infinity, true, false)];
      case '=': return [PT(a)];
      case '!=': return norm([I(-Infinity, a, false, false), I(a, Infinity, false, false)]);
    }
    return [];
  }
  const parseSet = (str) => { const r = parseAnswer(str); if (!r.ok) throw new Error('parseSet gagal: ' + str + ' — ' + r.err); return r.set; };

  /* ---------- Solver: dari predikat + titik kritis -> himpunan tepat ---------- */
  function solve(pred, crit) {
    const c = Array.from(new Set(crit.filter(isFinite).map(x => +x.toFixed(12)))).sort((a, b) => a - b);
    const safe = (x) => { try { const r = pred(x); return r === true; } catch (e) { return false; } };
    const pieces = [];
    if (!c.length) return safe(0) ? ALL() : [];
    const bounds = [-Infinity].concat(c, [Infinity]);
    for (let i = 0; i < bounds.length - 1; i++) {
      const a = bounds[i], b = bounds[i + 1];
      let t = a === -Infinity ? b - 1 : b === Infinity ? a + 1 : (a + b) / 2;
      if (safe(t)) pieces.push(I(a, b, false, false));
    }
    for (const x of c) if (safe(x)) pieces.push(PT(x));
    return norm(pieces);
  }

  /* ---------- Renderer rumus mini (subset TeX -> HTML) ---------- */
  const SYM = {
    le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', lt: '<', gt: '>', infty: '∞', cup: '∪', cap: '∩', in: '∈', notin: '∉',
    pm: '±', mp: '∓', cdot: '·', times: '×', div: '÷', Rightarrow: '⇒', Leftrightarrow: '⇔', iff: '⇔', to: '→', implies: '⇒',
    R: 'ℝ', emptyset: '∅', varnothing: '∅', dots: '…', ldots: '…', approx: '≈', circ: '°', alpha: 'α', beta: 'β', Delta: 'Δ',
    quad: ' ', qquad: '  ', mid: '|', varepsilon: 'ε', epsilon: 'ε', delta: 'δ', theta: 'θ', sum: 'Σ', subset: '⊂', forall: '∀', checkmark: '✓', neg: '¬'
  };
  const REL = new Set(['≤', '≥', '≠', '<', '>', '=', '⇒', '⇔', '→', '∈', '∉', '≈', '⊂']);
  const BIN = new Set(['∪', '∩', '±', '∓', '·', '×', '÷', '+', '−']);
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function tex(src) {
    let i = 0;
    const wrapSym = (ch) => REL.has(ch) ? '<span class="mr">' + esc(ch) + '</span>' : BIN.has(ch) ? '<span class="mb">' + esc(ch) + '</span>' : esc(ch);
    function skip() { while (src[i] === ' ') i++; }
    function group() { let out = ''; while (i < src.length) { if (src[i] === '}') { i++; return out; } out += atom(); } return out; }
    function arg() { skip(); if (src[i] === '{') { i++; return group(); } return atom(); }
    function atom() {
      const c = src[i];
      if (c === '\\') {
        i++;
        const m = /^[a-zA-Z]+/.exec(src.slice(i));
        if (!m) { const ch = src[i++]; if (ch === ',' ) return '<span class="mth"></span>'; if (ch === ' ') return ' '; if (ch === '!') return ''; return esc(ch); }
        const name = m[0]; i += name.length;
        if (name === 'frac' || name === 'dfrac') { const a = arg(), b = arg(); return '<span class="mf"><span class="mn">' + a + '</span><span class="md">' + b + '</span></span>'; }
        if (name === 'sqrt') { skip(); let idx = ''; if (src[i] === '[') { const j = src.indexOf(']', i); idx = src.slice(i + 1, j); i = j + 1; } const a = arg(); return '<span class="msq">' + (idx ? '<sup class="mix">' + esc(idx) + '</sup>' : '') + '√<span class="msb">' + a + '</span></span>'; }
        if (name === 'text' || name === 'mathrm' || name === 'textbf') { skip(); if (src[i] === '{') { let d = 0, j = i; for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (!d) break; } } const t = src.slice(i + 1, j); i = j + 1; return '<span class="mt' + (name === 'textbf' ? ' mtb' : '') + '">' + esc(t) + '</span>'; } return ''; }
        if (name === 'log') { skip(); let base = ''; if (src[i] === '_') { i++; base = '<sub>' + arg() + '</sub>'; } return '<span class="mfn">log</span>' + base; }
        if (name === 'left' || name === 'right' || name === 'displaystyle' || name === 'big' || name === 'Big') return '';
        if (name === 'overline') return '<span class="mov">' + arg() + '</span>';
        if (name === 'boxed') return '<span class="mbx">' + arg() + '</span>';
        if (name === 'hl') return '<span class="mhl">' + arg() + '</span>';
        if (name === 'flip') return '<span class="mflip">' + arg() + '</span>';
        if (SYM[name] !== undefined) return wrapSym(SYM[name]);
        return esc(name);
      }
      if (c === '^') { i++; return '<sup>' + arg() + '</sup>'; }
      if (c === '_') { i++; return '<sub>' + arg() + '</sub>'; }
      if (c === '{') { i++; return group(); }
      i++;
      if (/[a-zA-Z]/.test(c)) return '<i>' + c + '</i>';
      if (c === '<') { if (src[i] === '=') { i++; return wrapSym('≤'); } return wrapSym('<'); }
      if (c === '>') { if (src[i] === '=') { i++; return wrapSym('≥'); } return wrapSym('>'); }
      if (c === '!' && src[i] === '=') { i++; return wrapSym('≠'); }
      if (c === '-') { const before = src.slice(0, i - 1).replace(/\s+$/, ''); if (!before || /[([{,=<>|^_]$/.test(before) || /\\(le|ge|lt|gt|ne|leq|geq|neq|cup|cap|in|Rightarrow|Leftrightarrow|iff|implies|to|quad|qquad|pm|cdot|times|text\{[^}]*\})$/.test(before)) return '<span class="mu">−</span>'; return wrapSym('−'); }
      if (c === '+' || c === '=') return wrapSym(c);
      if (c === ' ') return '';
      if (c === '~') return ' ';
      if (c === '*') return wrapSym('·');
      if (c === ',') return ',<span class="mth"></span>';
      return esc(c);
    }
    let out = '';
    while (i < src.length) { if (src[i] === '}') { i++; continue; } out += atom(); }
    return out;
  }
  /* rich(): teks HTML dengan $...$ sebagai rumus inline dan $$...$$ sebagai rumus blok */
  function rich(s) {
    if (s == null) return '';
    return String(s)
      .replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => '<span class="mblk"><span class="m">' + tex(t.trim()) + '</span></span>')
      .replace(/\$([^$]+?)\$/g, (_, t) => '<span class="m">' + tex(t) + '</span>');
  }

  /* ---------- Garis bilangan (SVG) ---------- */
  function numberLine(set, opt) {
    opt = opt || {};
    const s = norm(set);
    const fin = [];
    s.forEach(p => { if (isFinite(p.a)) fin.push(p.a); if (isFinite(p.b)) fin.push(p.b); });
    (opt.marks || []).forEach(m => fin.push(m));
    let lo, hi;
    if (opt.range) { lo = opt.range[0]; hi = opt.range[1]; }
    else if (fin.length) { lo = Math.min(...fin); hi = Math.max(...fin); const pad = Math.max(1.5, (hi - lo) * 0.25); lo -= pad; hi += pad; }
    else { lo = -5; hi = 5; }
    const W = 460, H = opt.h || 62, L = 24, Rr = W - 24, y = 26;
    const X = (v) => v === -Infinity ? L - 4 : v === Infinity ? Rr + 4 : L + (v - lo) / (hi - lo) * (Rr - L);
    let g = '<svg class="nl" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Garis bilangan: ' + esc(toTxt(s)) + '">';
    g += '<line x1="' + (L - 14) + '" y1="' + y + '" x2="' + (Rr + 14) + '" y2="' + y + '" class="nl-ax"/>';
    g += '<path d="M' + (Rr + 14) + ' ' + y + ' l-7 -4.5 v9 z" class="nl-arr"/><path d="M' + (L - 14) + ' ' + y + ' l7 -4.5 v9 z" class="nl-arr"/>';
    const lab = new Set();
    if (0 > lo && 0 < hi && !fin.some(v => eq(v, 0))) lab.add(0);
    fin.forEach(v => lab.add(v));
    // ticks
    const step = (hi - lo) > 24 ? 5 : (hi - lo) > 12 ? 2 : 1;
    for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) g += '<line x1="' + X(t) + '" x2="' + X(t) + '" y1="' + (y - 4) + '" y2="' + (y + 4) + '" class="nl-tk"/>';
    (opt.forbid || []).forEach(v => { g += '<line x1="' + X(v) + '" x2="' + X(v) + '" y1="' + (y - 16) + '" y2="' + (y + 16) + '" class="nl-forbid"/>'; });
    s.forEach(p => {
      if (!eq(p.a, p.b)) {
        const x1 = Math.max(X(p.a), L - 14), x2 = Math.min(X(p.b), Rr + 14);
        g += '<line x1="' + x1 + '" x2="' + x2 + '" y1="' + y + '" y2="' + y + '" class="nl-sol"/>';
        if (p.a === -Infinity) g += '<path d="M' + (L - 18) + ' ' + y + ' l9 -6 v12 z" class="nl-solarr"/>';
        if (p.b === Infinity) g += '<path d="M' + (Rr + 18) + ' ' + y + ' l-9 -6 v12 z" class="nl-solarr"/>';
      }
    });
    s.forEach(p => {
      [[p.a, p.ca], [p.b, p.cb]].forEach(([v, c], k) => {
        if (!isFinite(v)) return; if (k === 1 && eq(p.a, p.b)) return;
        g += '<circle cx="' + X(v) + '" cy="' + y + '" r="6.5" class="' + (c ? 'nl-dot' : 'nl-hole') + '"/>';
      });
    });
    lab.forEach(v => { g += '<text x="' + X(v) + '" y="' + (y + 30) + '" class="nl-lb">' + esc(numTxt(v)) + '</text>'; });
    return g + '</svg>';
  }

  G.BM = { EPS, eq, rng, frac, numTex, numTxt, I, ALL, PT, norm, same, has, complement, intersect, union, minus, isAll, witness, toTex, toIneqTex, toTxt, evalNum, parseAnswer, parseSet, solve, tex, rich, esc, numberLine, gcd };
})(typeof window !== 'undefined' ? window : globalThis);
