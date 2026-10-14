/* Batas — data pendukung UI: cek 5 detik, ringkasan, peta keputusan, info kursus */
(function (G) {
  'use strict';
  const C = G.BC = G.BC || {};

  /* Info yang dipakai UI generik */
  C.INFO = {
    introTitle: 'Kenapa pertidaksamaan penting',
    diagDesc: '16 soal singkat untuk memetakan fondasimu',
    lintasGens: ['x1', 'x2', 'x3'],
    tips: 'Tips: 20 menit sehari jauh lebih ampuh daripada 3 jam sekali seminggu.'
  };

  /* Daftar "cek 5 detik" per bagian, muncul di bawah setiap soal */
  C.CHECK = {
    1: ['Sudah membalik tanda saat kali/bagi bilangan negatif?', 'Ujung ∞ pakai kurung biasa?', 'Bulat penuh untuk ≤/≥, kosong untuk < / >?'],
    2: ['Operasi dilakukan ke semua ruas?', 'Distribusi tanda minus benar?', 'Sudah uji balik dengan satu titik?'],
    3: ['Ruas kanan sudah nol?', 'Koefisien x² sudah positif?', 'Di antara atau di luar? Uji x = 0.'],
    4: ['Daerah paling kanan bertanda koefisien utama?', 'Akar berpangkat genap: tanda tetap?', 'Titik akar ikut atau tidak?'],
    5: ['Tidak kali silang?', 'Penyebut bulat kosong?', 'Sudah satu pecahan dengan ruas kanan nol?'],
    6: ['Syarat isi akar ≥ 0 sudah ditulis?', 'Ruas kanan bisa negatif? Pecah kasus.', 'Jawaban akhir sudah diiris dengan syarat?'],
    7: ['< = dekat (satu interval), > = jauh (dua arah)?', 'Ruas kanan negatif? Cek kasus khusus.', 'Pusatnya benar (|x + 2| berpusat di −2)?'],
    8: ['Basis < 1? Balik tanda.', 'Syarat numerus > 0?', 'Substitusi: ingat p = aˣ > 0.'],
    9: ['Garis putus-putus untuk < / >?', 'Sisi daerah ditentukan dengan uji titik?', 'Daerah akhir = irisan semua aturan?'],
    10: ['Semua suku positif (syarat AM-GM)?', 'Titik kesamaan bisa dicapai di domain?', 'Sudah coba kasus kesamaan (a = b = c)?']
  };

  /* Ringkasan (ditampilkan tertutup, dibuka satu per satu) & poin kunci brain dump */
  C.SUMMARY = [
    { sec: 1, type: 'Sifat dasar', first: 'Lakukan operasi yang sama ke kedua ruas', key: 'Kali/bagi negatif → balik tanda', trap: 'Lupa membalik tanda; ∞ pakai siku', points: ['a < b berarti b − a positif', 'Tambah/kurang: tanda tetap', 'Kali/bagi positif: tanda tetap', 'Kali/bagi negatif: tanda dibalik', 'Mengkuadratkan dan membalik pecahan tidak selalu aman', 'Bulat penuh = ≤/≥, kosong = < / >, ∞ selalu kurung biasa'] },
    { sec: 2, type: 'Linear & berantai', first: 'Kumpulkan x di satu ruas', key: 'Berantai: ketiga ruas sekaligus', trap: 'Hanya mengolah sebagian ruas', points: ['Hilangkan kurung dan pecahan', 'Kumpulkan x di ruas yang koefisiennya positif', 'Berantai: operasi ke tiga ruas', 'x di lebih dari satu ruas: pecah dua lalu iris', 'Kamus: paling sedikit = ≥, paling banyak = ≤', 'Uji balik dengan titik di dalam dan di luar'] },
    { sec: 3, type: 'Kuadrat', first: 'Nolkan ruas kanan, buat a > 0', key: 'a > 0: < di antara akar, > di luar akar', trap: 'Lupa akar negatif; membagi x', points: ['Pindahkan semua ke kiri', 'Faktorkan atau rumus abc', 'Lembah (a > 0): negatif di antara akar', 'D < 0: definit, jawabannya ℝ atau ∅', 'Kuadrat sempurna: cek titik akarnya', 'Syarat selalu positif: a > 0 dan D < 0'] },
    { sec: 4, type: 'Polinomial', first: 'Faktorkan sepenuhnya', key: 'Kanan +, ganti di pangkat ganjil, tetap di pangkat genap', trap: 'Tanda dianggap selalu berganti', points: ['Faktorkan semua', 'Daerah paling kanan = tanda koefisien utama', 'Pangkat ganjil: tanda berganti', 'Pangkat genap: tanda tetap (grafik memantul)', 'Faktor definit positif boleh diabaikan', 'Periksa titik akar satu per satu'] },
    { sec: 5, type: 'Rasional', first: 'Syarat penyebut ≠ 0, pindahkan semua ke kiri', key: 'Satukan jadi P/Q, tabel tanda', trap: 'Kali silang; penyebut ditutup', points: ['Jangan kali silang', 'Pindahkan semua ke kiri, kanan 0', 'Satukan menjadi satu pecahan', 'Pembuat nol pembilang dan penyebut', 'Tanda P/Q sama dengan tanda P·Q', 'Penyebut selalu bulat kosong'] },
    { sec: 6, type: 'Irasional', first: 'Tulis syarat isi akar ≥ 0', key: '√f < g: f ≥ 0, g > 0, f < g²', trap: 'Lupa syarat; kuadratkan saat ruas kanan negatif', points: ['Syarat isi akar ≥ 0', 'Akar selalu ≥ 0', '√f < g: f ≥ 0, g > 0, f < g²', '√f > g: dua kasus (g < 0 atau g ≥ 0)', '√f < √g: f ≥ 0 dan f < g', 'Iris semua syarat di akhir'] },
    { sec: 7, type: 'Nilai mutlak', first: 'Baca sebagai jarak', key: '< dekat (satu interval), > jauh (dua arah)', trap: 'Dekat/jauh tertukar; ruas kanan negatif', points: ['|x − a| = jarak x ke a', '|f| < c ⇔ −c < f < c', '|f| > c ⇔ f < −c atau f > c', '|f| < negatif: ∅; |f| > negatif: semua x', '|f| < |g| ⇔ (f − g)(f + g) < 0', 'Ruas kanan bervariabel: −g < f < g'] },
    { sec: 8, type: 'Eksponen & log', first: 'Samakan basis; tulis syarat numerus', key: 'Basis > 1 tetap, 0 < basis < 1 dibalik', trap: 'Basis kecil; syarat numerus', points: ['Samakan basis kedua ruas', 'Basis > 1: tanda tetap', '0 < basis < 1: tanda dibalik', 'Numerus log harus > 0', 'Substitusi p = aˣ untuk bentuk kuadrat', 'Iris dengan syarat di akhir'] },
    { sec: 9, type: 'SPtLDV', first: 'Gambar garis batas tiap pertidaksamaan', key: 'Uji titik untuk sisi; irisan semua daerah', trap: 'Garis tegas/putus; arsir salah sisi', points: ['Titik potong sumbu untuk menggambar garis', 'Tegas untuk ≤/≥, putus-putus untuk < / >', 'Uji titik (0,0) bila tidak di garis', 'Daerah penyelesaian = irisan', 'Garis lewat (a,0),(0,b): bx + ay = ab', 'Nilai optimum di titik pojok'] },
    { sec: 10, type: 'Ketaksamaan klasik', first: 'Cari kasus kesamaan dulu', key: 'AM ≥ GM; Cauchy; segitiga', trap: 'Bilangan negatif; kesamaan tak tercapai', points: ['AM-GM: (a+b)/2 ≥ √(ab) untuk a, b ≥ 0', 'Kesamaan hanya saat a = b', 'Pilih suku yang hasil kalinya konstan', 'Cauchy–Schwarz: (a²+b²)(x²+y²) ≥ (ax+by)²', 'Segitiga: |a+b| ≤ |a|+|b|', 'Cek titik kesamaan ada di domain'] }
  ];

  /* Peta keputusan di halaman ringkasan */
  C.DECISION = '<h2>Peta keputusan: soal ini tipe apa?</h2><ol class="steps"><li>Ada <b>akar</b>? Tulis syarat isi akar dulu (Bagian 6).</li><li>Ada <b>nilai mutlak</b>? Baca sebagai jarak (Bagian 7).</li><li>Ada <b>log</b> atau pangkat bervariabel? Syarat numerus, samakan basis (Bagian 8).</li><li>Ada <b>x di penyebut</b>? Jangan kali silang, satukan pecahan (Bagian 5).</li><li>Polinomial? Nolkan, faktorkan, tabel tanda (Bagian 3–4).</li><li>Linear? Isolasi x, hati-hati tanda negatif (Bagian 2).</li><li>Diminta <b>membuktikan</b> atau mencari nilai minimum? Coba AM-GM, kuadrat ≥ 0, atau Cauchy (Bagian 10).</li></ol>';
})(typeof window !== 'undefined' ? window : globalThis);
