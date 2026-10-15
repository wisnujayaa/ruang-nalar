#!/usr/bin/env node
/* Ubah kursus Studio (hasil "Ekspor JSON" di tab Terbitkan) menjadi kursus berbasis file,
   supaya bisa dilanjutkan di kode: menambah widget kustom, generator soal acak, dll.
   Pemakaian:  node tools/studio-to-file.js kursus.json fungsi-kuadrat
   Hasil:      courses/fungsi-kuadrat/course.js  (+ potongan untuk courses/index.js)
   Catatan: setelah dipindah ke file, kursus diedit di kode (bukan lagi di Studio). */
const fs = require('fs'), path = require('path');
const [, , input, id] = process.argv;
if (!input || !id || !/^[a-z0-9-]{2,40}$/.test(id)) { console.error('Pemakaian: node tools/studio-to-file.js <file.json> <id-kursus-huruf-kecil>'); process.exit(1); }
const ROOT = path.join(__dirname, '..');
global.window = global; ['js/math.js', 'js/expr.js', 'js/widget-lib.js', 'js/course-safe.js'].forEach(f => require(path.join(ROOT, f)));
const j = JSON.parse(fs.readFileSync(input, 'utf8')); const raw = j.content || j; const meta = j.meta || {};
const c = global.NalarSafe.compile(raw);   // teks sudah dibersihkan & dirender ke format kursus file
Object.values(c.BANK).forEach(q => { delete q.ansSet; });   // interval: dibaca ulang dari q.ans saat dimuat
const dir = path.join(ROOT, 'courses', id);
if (fs.existsSync(dir)) { console.error('Folder sudah ada: ' + dir); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
const out = ['/* ' + (meta.title || id) + ' — dipindahkan dari Studio pada ' + new Date().toISOString().slice(0, 10) + '.',
  '   Mulai sekarang edit di file ini. Widget kustom: isi C.WIDGETS.mount(id, el) dan pakai blok {k:\'widget\', id}. */',
  '(function (G) {', "  'use strict';", '  const C = G.BC;'];
['SECTIONS', 'CONCEPTS', 'TRAPS', 'BANK', 'LESSONS', 'CARDS', 'RES'].forEach(k => out.push('  C.' + k + ' = ' + JSON.stringify(c[k], null, 1).replace(/\n/g, '\n  ') + ';'));
out.push('  // C.WIDGETS = { mount(id, el) { /* widget kustom di sini */ } };', '})(window);', '');
fs.writeFileSync(path.join(dir, 'course.js'), out.join('\n'));
console.log('Dibuat: courses/' + id + '/course.js');
console.log('Tambahkan ke courses/index.js:');
console.log(JSON.stringify({ id, title: meta.title || id, subject: meta.subject || '', level: meta.level || '', blurb: meta.blurb || '', glyph: meta.glyph || '', color: meta.color || 'accent', files: ['course.js'] }, null, 2));
