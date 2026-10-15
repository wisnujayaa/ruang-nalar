/* Course list for the platform.
   To add a course: create a folder courses/<id>/ with its content files, then register it here.
   Full guide: docs/ADDING-COURSES.md */
window.NALAR_COURSES = [
  {
    id: 'pertidaksamaan',
    title: 'Pertidaksamaan',
    brand: 'Batas',
    subject: 'Matematika',
    level: 'SMA kelas X · UTBK · olimpiade',
    blurb: 'Dari intuisi jungkat-jungkit sampai ketaksamaan klasik olimpiade. 10 bab, 25 widget interaktif, 250+ soal bertingkat.',
    glyph: 'a<b',
    color: 'sol',
    files: ['content-a.js', 'content-b.js', 'bank.js', 'gen.js', 'cards.js', 'content-c.js', 'bank2.js', 'proofs.js', 'extras.js', 'widgets.js', 'widgets2.js']
  },
  {
    id: 'contoh-kursus',
    title: 'Contoh kursus (templat)',
    brand: 'Templat',
    subject: 'Panduan',
    level: 'Untuk pembuat materi',
    blurb: 'Kursus mini yang menunjukkan semua jenis blok dan soal. Salin foldernya untuk membuat kursus baru.',
    glyph: '{ }',
    color: 'accent',
    hidden: true,   // hidden from the catalog; still reachable via #kursus=contoh-kursus
    files: ['course.js']
  },
  /* A course in preparation can be shown as a "Segera hadir" (coming soon) card that can't be opened:
     { id: 'fungsi-kuadrat', title: 'Fungsi kuadrat', subject: 'Matematika', blurb: 'Segera hadir.', glyph: 'x²', soon: true } */
];
