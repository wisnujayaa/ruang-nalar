/* Ruang Nalar — parser ekspresi matematika yang aman (tanpa eval/Function).
   Dipakai widget yang rumusnya ditulis guru, misalnya grafik "a*x^2 + b*x + c".
   Mendukung: + - * / ^, kurung, perkalian implisit (2x, 3(x+1), ax → a·x),
   fungsi sin cos tan sqrt abs ln log exp floor ceil, konstanta pi dan e.
   NalarExpr.compile(src, ['x','a','b']) → fungsi (env) => angka, atau melempar Error berbahasa Indonesia. */
(function (G) {
  'use strict';
  const FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan, sqrt: Math.sqrt, akar: Math.sqrt, abs: Math.abs, ln: Math.log, log: (v) => Math.log10(v), exp: Math.exp, floor: Math.floor, ceil: Math.ceil };
  const CONST = { pi: Math.PI, e: Math.E };
  function tokenize(src) {
    const s = String(src).replace(/²/g, '^2').replace(/³/g, '^3').replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/π/g, 'pi').replace(/,/g, '.');
    if (s.length > 200) throw new Error('Rumus terlalu panjang (maksimal 200 karakter).');
    const out = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; const t = s.slice(i, j); if (!/^\d*\.?\d+$|^\d+\.$/.test(t)) throw new Error('Angka "' + t + '" tidak valid.'); out.push({ t: 'n', v: parseFloat(t) }); i = j; continue; }
      if (/[a-zA-Z]/.test(c)) { let j = i; while (j < s.length && /[a-zA-Z]/.test(s[j])) j++; out.push({ t: 'w', v: s.slice(i, j) }); i = j; continue; }
      if ('+-*/^()'.includes(c)) { out.push({ t: c }); i++; continue; }
      throw new Error('Karakter "' + c + '" tidak dikenal dalam rumus.');
    }
    return out;
  }
  function compile(src, vars) {
    const allowed = new Set(vars || ['x']);
    /* Kata yang bukan fungsi/konstanta/variabel dipecah per huruf: "ax" → a x (lalu dikali implisit), sehingga ax^2 = a·x² */
    const tk = []; tokenize(src).forEach(t => { if (t.t === 'w' && t.v.length > 1 && !FN[t.v.toLowerCase()] && CONST[t.v.toLowerCase()] === undefined && !allowed.has(t.v)) t.v.split('').forEach(ch => tk.push({ t: 'w', v: ch })); else tk.push(t); });
    let p = 0, depth = 0;
    const peek = () => tk[p], eat = (t) => { if (!tk[p] || tk[p].t !== t) throw new Error('Rumus belum lengkap: kurang "' + t + '".'); p++; };
    /* Kata "ax" dipecah menjadi a·x jika bukan nama fungsi/konstanta */
    function word(w) {
      const lw = w.toLowerCase();
      if (FN[lw]) { const f = FN[lw]; if (!peek() || peek().t !== '(') throw new Error('Fungsi ' + w + ' butuh kurung, misalnya ' + w + '(x).'); eat('('); const a = expr(); eat(')'); return (env) => f(a(env)); }
      if (allowed.has(w)) return (env) => env[w];
      if (CONST[lw] !== undefined) { const v = CONST[lw]; return () => v; }
      if (w.length > 1) { const parts = w.split('').map(ch => { if (CONST[ch] !== undefined && !allowed.has(ch)) { const v = CONST[ch]; return () => v; } if (!allowed.has(ch)) throw new Error('Variabel "' + ch + '" belum didefinisikan. Variabel yang tersedia: ' + Array.from(allowed).join(', ') + '.'); return (env) => env[ch]; }); return (env) => parts.reduce((m, f) => m * f(env), 1); }
      if (CONST[w] !== undefined) { const v = CONST[w]; return () => v; }
      throw new Error('Variabel "' + w + '" belum didefinisikan. Variabel yang tersedia: ' + Array.from(allowed).join(', ') + '.');
    }
    function primary() {
      const t = peek(); if (!t) throw new Error('Rumus belum lengkap.');
      if (t.t === 'n') { p++; const v = t.v; return () => v; }
      if (t.t === 'w') { p++; return word(t.v); }
      if (t.t === '(') { p++; if (++depth > 30) throw new Error('Kurung terlalu dalam.'); const e = expr(); eat(')'); depth--; return e; }
      throw new Error('Ada simbol "' + t.t + '" di tempat yang salah.');
    }
    function unary() { const t = peek(); if (t && (t.t === '-' || t.t === '+')) { p++; const u = unary(); return t.t === '-' ? (env) => -u(env) : u; } return power(); }
    function power() { const b = primary(); if (peek() && peek().t === '^') { p++; const e = unary(); return (env) => Math.pow(b(env), e(env)); } return b; }
    function term() {
      let l = unary();
      for (;;) {
        const t = peek(); if (!t) break;
        if (t.t === '*' || t.t === '/') { p++; const r = unary(); const L = l; l = t.t === '*' ? (env) => L(env) * r(env) : (env) => L(env) / r(env); continue; }
        if (t.t === 'n' || t.t === 'w' || t.t === '(') { const r = power(); const L = l; l = (env) => L(env) * r(env); continue; }   // perkalian implisit
        break;
      }
      return l;
    }
    function expr() { let l = term(); for (;;) { const t = peek(); if (!t || (t.t !== '+' && t.t !== '-')) break; p++; const r = term(); const L = l; l = t.t === '+' ? (env) => L(env) + r(env) : (env) => L(env) - r(env); } return l; }
    if (!tk.length) throw new Error('Rumus masih kosong.');
    const f = expr(); if (p < tk.length) throw new Error('Ada bagian rumus yang tidak terbaca di dekat "' + (tk[p].v != null ? tk[p].v : tk[p].t) + '".');
    return f;
  }
  G.NalarExpr = { compile, tokenize };
})(typeof window !== 'undefined' ? window : globalThis);
