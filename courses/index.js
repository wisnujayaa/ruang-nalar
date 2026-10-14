/* Daftar kursus di platform.
   Menambah kursus baru: buat folder courses/<id>/ berisi file konten, lalu daftarkan di sini.
   Panduan lengkap: docs/MENAMBAH-KURSUS.md */
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
    files: ['course.js']
  },
  { id: 'fungsi-kuadrat', title: 'Fungsi kuadrat', subject: 'Matematika', level: 'SMA kelas X', blurb: 'Segera hadir.', glyph: 'x²', soon: true },
  { id: 'statistika', title: 'Statistika dasar', subject: 'Matematika', level: 'SMA kelas X', blurb: 'Segera hadir.', glyph: 'σ', soon: true }
];
