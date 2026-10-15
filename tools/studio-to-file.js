#!/usr/bin/env node
/* Convert a Studio course (the "Export JSON" output from the Publish tab) into a file-based course,
   so it can continue in code: custom widgets, random question generators, etc.
   Usage:   node tools/studio-to-file.js course.json fungsi-kuadrat
   Output:  courses/fungsi-kuadrat/course.js  (+ a snippet for courses/index.js)
   Note: once moved to a file, the course is edited in code (no longer in the Studio). */
const fs = require('fs'), path = require('path');
const [, , input, id] = process.argv;
if (!input || !id || !/^[a-z0-9-]{2,40}$/.test(id)) { console.error('Usage: node tools/studio-to-file.js <file.json> <lowercase-course-id>'); process.exit(1); }
const ROOT = path.join(__dirname, '..');
global.window = global; ['js/math.js', 'js/expr.js', 'js/widget-lib.js', 'js/course-safe.js'].forEach(f => require(path.join(ROOT, f)));
const j = JSON.parse(fs.readFileSync(input, 'utf8')); const raw = j.content || j; const meta = j.meta || {};
const c = global.NalarSafe.compile(raw);   // text is already sanitized & rendered to the file-course format
Object.values(c.BANK).forEach(q => { delete q.ansSet; });   // interval: re-parsed from q.ans on load
const dir = path.join(ROOT, 'courses', id);
if (fs.existsSync(dir)) { console.error('Folder already exists: ' + dir); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
const out = ['/* ' + (meta.title || id) + ' — moved from the Studio on ' + new Date().toISOString().slice(0, 10) + '.',
  '   Edit this file from now on. Custom widgets: implement C.WIDGETS.mount(id, el) and use a {k:\'widget\', id} block. */',
  '(function (G) {', "  'use strict';", '  const C = G.BC;'];
['SECTIONS', 'CONCEPTS', 'TRAPS', 'BANK', 'LESSONS', 'CARDS', 'RES'].forEach(k => out.push('  C.' + k + ' = ' + JSON.stringify(c[k], null, 1).replace(/\n/g, '\n  ') + ';'));
out.push('  // C.WIDGETS = { mount(id, el) { /* custom widgets go here */ } };', '})(window);', '');
fs.writeFileSync(path.join(dir, 'course.js'), out.join('\n'));
console.log('Created: courses/' + id + '/course.js');
console.log('Add this to courses/index.js:');
console.log(JSON.stringify({ id, title: meta.title || id, subject: meta.subject || '', level: meta.level || '', blurb: meta.blurb || '', glyph: meta.glyph || '', color: meta.color || 'accent', files: ['course.js'] }, null, 2));
