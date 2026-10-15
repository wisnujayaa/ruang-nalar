/* Pertidaksamaan — flashcards. f = front, b = back, nl = number line on the back (optional) */
(function (G) {
  'use strict';
  const C = G.BC = G.BC || {};
  const K = [];
  const c = (sec, kind, f, b, nl) => K.push({ id: 'k' + (K.length + 1), sec, kind, f, b, nl });

  // Section 1
  c(1, 'Sifat', 'Kapan tanda pertidaksamaan harus <b>dibalik</b>?', 'Saat kedua ruas <b>dikali atau dibagi bilangan negatif</b>. (Juga: membalik pecahan bertanda sama, dan fungsi turun seperti basis 0–1.)');
  c(1, 'Sifat', 'Kenapa $2<5$ tapi $-2>-5$?', 'Mengali −1 = bercermin di titik 0, urutan terbalik. Atau: utang 2 juta lebih "kaya" daripada utang 5 juta.');
  c(1, 'Jebakan', 'Benar atau salah: jika $a<b$ maka $a^2<b^2$.', '<b>Salah.</b> $-3<1$ tapi $9>1$. Mengkuadratkan aman hanya jika kedua ruas ≥ 0.');
  c(1, 'Notasi', 'Bulat penuh ● atau kosong ○ untuk $x>3$?', 'Bulat <b>kosong</b> ○ di 3, karena 3 sendiri tidak memenuhi $x>3$.', '(3,inf)');
  c(1, 'Notasi', 'Tulis $-1\\le x<4$ dalam notasi interval.', '$[-1,\\,4)$', '[-1,4)');
  c(1, 'Jebakan', 'Kenapa $[3,\\infty]$ salah?', '∞ bukan bilangan, tidak pernah "termasuk". Selalu kurung biasa: $[3,\\infty)$.');
  c(1, 'Notasi', '"Atau" dan "dan" di himpunan penyelesaian berarti…', '"atau" = <b>gabungan</b> ∪ (dua daerah boleh terpisah). "dan" = <b>irisan</b> ∩ (harus memenuhi keduanya).');
  c(1, 'Kenapa', 'Buktikan: $a<b$ dan $c<0 \\Rightarrow ac>bc$.', '$b-a>0$. Positif × negatif: $c(b-a)<0 \\Rightarrow cb-ca<0 \\Rightarrow ca>cb$.');
  // Section 2
  c(2, 'Langkah', 'Cara mengerjakan $a<px+q<b$ (x hanya di tengah)?', 'Kerjakan <b>ketiga ruas</b> sekaligus. Jika membagi negatif, balik <b>kedua</b> tanda, lalu tulis ulang dari kecil ke besar.');
  c(2, 'Langkah', 'Kapan bentuk berantai harus <b>dipecah dua</b>?', 'Jika $x$ muncul di lebih dari satu ruas, misalnya $2x-1<x+3<3x+1$. Selesaikan dua-duanya lalu <b>iris</b>.');
  c(2, 'Kamus', '"Paling sedikit", "minimal", "tidak kurang dari" = …', '$\\ge$');
  c(2, 'Kamus', '"Paling banyak", "maksimal", "tidak lebih dari" = …', '$\\le$');
  c(2, 'Trik', 'Trik menghindari membagi bilangan negatif?', 'Kumpulkan $x$ di ruas yang koefisiennya positif. $3x+2\\le5x-6 \\Rightarrow 8\\le2x$.');
  c(2, 'Kebiasaan', 'Apa itu <b>uji balik</b>?', 'Ambil satu titik di dalam jawaban (harus benar) dan satu di luar (harus salah), masukkan ke soal asli.');
  // Section 3
  c(3, 'Langkah', 'Langkah pertama pertidaksamaan kuadrat?', '<b>Nolkan ruas kanan</b>: pindahkan semua suku ke kiri. Lalu buat $a>0$, faktorkan, garis bilangan.');
  c(3, 'Pola', '$a>0$, dua akar $x_1<x_2$. $f(x)<0$ di mana?', '<b>Di antara</b> akar: $x_1<x<x_2$ (lembah di bawah tanah).');
  c(3, 'Pola', '$a>0$, dua akar. $f(x)>0$ di mana?', '<b>Di luar</b> akar: $x<x_1$ atau $x>x_2$.');
  c(3, 'Jebakan', '$x^2>9 \\Rightarrow x>3$. Apa yang salah?', 'Lupa akar negatif: $(-4)^2=16>9$. Benar: $x<-3$ atau $x>3$.', '(-inf,-3)u(3,inf)');
  c(3, 'Jebakan', 'Boleh $x^2<3x \\Rightarrow x<3$?', '<b>Tidak.</b> Membagi $x$ yang tandanya belum diketahui. $x(x-3)<0 \\Rightarrow 0<x<3$.', '(0,3)');
  c(3, 'Definit', '$D<0$ dan $a>0$: $f(x)>0$ untuk…', '<b>Semua</b> $x$ real (definit positif). Dan $f(x)<0$: tidak ada solusi.');
  c(3, 'Kuadrat sempurna', '$(x-2)^2>0$ penyelesaiannya?', 'Semua $x$ <b>kecuali</b> $x=2$.', '(-inf,2)u(2,inf)');
  c(3, 'Parameter', 'Syarat $ax^2+bx+c>0$ untuk semua $x$?', '$a>0$ <b>dan</b> $D<0$.');
  c(3, 'Parameter', 'Syarat $ax^2+bx+c<0$ untuk semua $x$?', '$a<0$ <b>dan</b> $D<0$.');
  // Section 4
  c(4, 'Aturan', 'Tanda daerah paling kanan pada tabel tanda polinomial?', 'Sama dengan tanda <b>koefisien utama</b> (setelah difaktorkan sebagai $(x-r)$).');
  c(4, 'Aturan', 'Kapan tanda TIDAK berganti di suatu akar?', 'Di akar berpangkat <b>genap</b>, misalnya $(x-3)^2$. Grafik memantul.');
  c(4, 'Trik', 'Faktor $x^2+1$ atau $x^2+x+1$ boleh diapakan?', 'Diabaikan (dibagi), karena selalu positif ($D<0$, $a>0$), tidak mengubah tanda.');
  c(4, 'Jebakan', '$(x+2)^2(x-1)\\ge0$ — jangan lupa titik apa?', '$x=-2$ (nilainya 0). Jawaban: $\\{-2\\}\\cup[1,\\infty)$.', '{-2}u[1,inf)');
  // Section 5
  c(5, 'Larangan', 'Kenapa pertidaksamaan pecahan tidak boleh <b>dikali silang</b>?', 'Penyebut bisa negatif, sehingga tanda mungkin harus dibalik, dan kita tidak tahu yang mana.');
  c(5, 'Langkah', 'Langkah baku pertidaksamaan rasional?', 'Syarat penyebut ≠ 0 → pindahkan semua ke kiri → satukan jadi $\\frac PQ$ → pembuat nol → tabel tanda → penyebut selalu bulat kosong.');
  c(5, 'Aturan', 'Pembuat nol penyebut: bulat penuh atau kosong?', 'Selalu <b>kosong</b>, bahkan untuk tanda ≤ atau ≥.');
  c(5, 'Jebakan', '$\\frac{x+1}{x-2}>1$ dikali silang jadi $1>-2$ (semua x). Jawaban sebenarnya?', '$\\frac{3}{x-2}>0 \\Rightarrow x>2$.', '(2,inf)');
  c(5, 'Kenapa', 'Tanda $\\frac PQ$ sama dengan tanda…', '$P\\cdot Q$ (dengan syarat $Q\\ne0$). Aturan tanda pembagian sama dengan perkalian.');
  // Section 6
  c(6, 'Syarat', 'Dua aturan "gerbang" akar?', '1) Isi akar ≥ 0. 2) Hasil akar selalu ≥ 0.');
  c(6, 'Resep', '$\\sqrt f<g$ setara dengan…', '$f\\ge0$ dan $g>0$ dan $f<g^2$.');
  c(6, 'Resep', '$\\sqrt f>g$ setara dengan…', '[$f\\ge0$ dan $g<0$] <b>atau</b> [$g\\ge0$ dan $f>g^2$].');
  c(6, 'Resep', '$\\sqrt f<\\sqrt g$ setara dengan…', '$f\\ge0$ dan $f<g$.');
  c(6, 'Jebakan', '$\\sqrt{x-3}<2 \\Rightarrow x<7$. Kurang apa?', 'Syarat isi akar: $x\\ge3$. Jawaban $3\\le x<7$.', '[3,7)');
  // Section 7
  c(7, 'Makna', '$|x-a|$ artinya…', '<b>Jarak</b> antara $x$ dan $a$ di garis bilangan.');
  c(7, 'Pola', '$|f|<c$ ($c>0$) setara dengan…', '$-c<f<c$ (dekat → satu interval).');
  c(7, 'Pola', '$|f|>c$ ($c>0$) setara dengan…', '$f<-c$ atau $f>c$ (jauh → dua arah).');
  c(7, 'Kasus', '$|f|<-2$ penyelesaiannya?', 'Tidak ada ($\\emptyset$). Jarak tidak pernah negatif.');
  c(7, 'Kasus', '$|f|>-2$ penyelesaiannya?', 'Semua $x$ (di domain $f$).');
  c(7, 'Trik', '$|f|<|g|$ setara dengan…', '$(f-g)(f+g)<0$ (kuadratkan, lalu selisih kuadrat).');
  c(7, 'Contoh', '$|x-3|<2$ di garis bilangan', '$1<x<5$: semua titik berjarak kurang dari 2 dari titik 3.', '(1,5)');
  // Section 8
  c(8, 'Aturan', '$a^f>a^g$ untuk $a>1$?', '$f>g$ (fungsi naik, tanda tetap).');
  c(8, 'Aturan', '$a^f>a^g$ untuk $0<a<1$?', '$f<g$ (fungsi turun, tanda <b>dibalik</b>).');
  c(8, 'Syarat', 'Syarat logaritma $\\log_a f$?', 'Numerus $f>0$, basis $a>0$, $a\\ne1$.');
  c(8, 'Trik', 'Bentuk $4^x-6\\cdot2^x+8<0$ diselesaikan dengan…', 'Substitusi $p=2^x$ (ingat $4^x=p^2$ dan $p>0$).');
  // Section 9
  c(9, 'Garis', 'Garis tegas atau putus-putus untuk $2x+y<6$?', '<b>Putus-putus</b> (tanda <, titik di garis tidak ikut).');
  c(9, 'Langkah', 'Cara menentukan sisi daerah penyelesaian?', '<b>Uji titik</b> yang tidak di garis, biasanya $(0,0)$.');
  c(9, 'Rumus', 'Garis lewat $(a,0)$ dan $(0,b)$:', '$bx+ay=ab$');
  c(9, 'Koneksi', 'Di mana nilai maksimum/minimum fungsi objektif?', 'Di salah satu <b>titik pojok</b> daerah penyelesaian (program linear, kelas XI).');
  C.CARDS = K;
})(typeof window !== 'undefined' ? window : globalThis);
