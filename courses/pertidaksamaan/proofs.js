/* Batas — soal menyusun bukti (tipe 'order').
   steps  : langkah dalam urutan yang BENAR (UI mengacaknya)
   extra  : langkah pengecoh yang tidak boleh dipakai (penalaran keliru / melingkar)
   alt    : urutan lain yang juga sah, berupa array indeks ke `steps` */
(function (G) {
  'use strict';
  const C = G.BC = G.BC || {};
  const B = C.BANK;
  const O = ['olimpiade'];
  const P = (o) => { o.type = 'order'; o.mode = o.mode || O; o.concepts = o.concepts || ['pembuktian']; B[o.id] = o; };

  P({ id: 'pf-1', sec: 1, lvl: 5, concepts: ['sifat-dasar', 'pembuktian'],
    q: 'Buktikan: jika $a<b$ dan $c<0$, maka $ac>bc$. Susun langkah-langkah berikut menjadi bukti yang sah.',
    steps: ['Dari $a<b$ diperoleh $b-a>0$.', 'Dari $c<0$ diperoleh $-c>0$.', 'Hasil kali dua bilangan positif juga positif: $(b-a)(-c)>0$.', 'Jabarkan: $-bc+ac>0$.', 'Pindahkan $-bc$ ke kanan: $ac>bc$. Terbukti.'],
    extra: ['Bagi kedua ruas $a<b$ dengan $c$, maka tandanya dibalik.'],
    alt: [[1, 0, 2, 3, 4]],
    hints: ['Mulailah dari definisi: $a<b$ artinya $b-a$ positif.', 'Kalikan dua bilangan yang sudah pasti positif.'],
    why: 'Aturan "balik tanda" justru yang sedang dibuktikan, jadi tidak boleh dipakai sebagai alasan (penalaran melingkar).',
    sol: 'Inti bukti: ubah semua informasi menjadi pernyataan "sesuatu > 0", kalikan dua bilangan positif, lalu jabarkan. Langkah 1 dan 2 boleh ditukar.' });

  P({ id: 'pf-2', sec: 10, lvl: 5, concepts: ['amgm', 'pembuktian'],
    q: 'Buktikan AM-GM dua bilangan: untuk $a,b\\ge0$ berlaku $\\frac{a+b}{2}\\ge\\sqrt{ab}$.',
    steps: ['Karena $a,b\\ge0$, bilangan $\\sqrt a$ dan $\\sqrt b$ ada (real).', 'Kuadrat bilangan real tidak pernah negatif: $(\\sqrt a-\\sqrt b)^2\\ge0$.', 'Jabarkan: $a-2\\sqrt{ab}+b\\ge0$.', 'Pindahkan suku: $a+b\\ge2\\sqrt{ab}$.', 'Bagi dengan 2 (positif, tanda tetap): $\\frac{a+b}2\\ge\\sqrt{ab}$. Sama dengan saat $a=b$.'],
    extra: ['Anggap $\\frac{a+b}2\\ge\\sqrt{ab}$ benar, lalu kuadratkan kedua ruasnya.'],
    hints: ['Fakta paling dasar tentang pertidaksamaan: $x^2\\ge0$ untuk setiap $x$ real. Pilih $x$ yang tepat.'],
    why: 'Memulai dari kesimpulan yang ingin dibuktikan adalah penalaran melingkar. Boleh dipakai di kertas buram untuk mencari ide, tapi bukti resmi harus berjalan dari fakta yang sudah pasti benar.',
    sol: 'Trik klasik: setiap ketaksamaan "kuadrat" berasal dari $(\\ldots)^2\\ge0$. Bentuk $(\\sqrt a-\\sqrt b)^2$ dipilih karena menghasilkan suku $\\sqrt{ab}$.' });

  P({ id: 'pf-3', sec: 10, lvl: 6, concepts: ['ketaksamaan-klasik', 'pembuktian'],
    q: 'Buktikan: untuk semua bilangan real $a,b,c$ berlaku $a^2+b^2+c^2\\ge ab+bc+ca$.',
    steps: ['Setiap kuadrat tidak negatif: $(a-b)^2\\ge0$, $(b-c)^2\\ge0$, $(c-a)^2\\ge0$.', 'Jumlahkan ketiganya: $(a-b)^2+(b-c)^2+(c-a)^2\\ge0$.', 'Jabarkan: $2a^2+2b^2+2c^2-2ab-2bc-2ca\\ge0$.', 'Bagi dengan 2: $a^2+b^2+c^2-ab-bc-ca\\ge0$.', 'Jadi $a^2+b^2+c^2\\ge ab+bc+ca$, dengan kesamaan saat $a=b=c$.'],
    extra: ['Karena $a^2\\ge ab$, $b^2\\ge bc$, dan $c^2\\ge ca$ untuk semua bilangan real.'],
    hints: ['Selisih kedua ruas, dikali 2, bisa ditulis sebagai jumlah tiga kuadrat.'],
    why: '$a^2\\ge ab$ tidak selalu benar. Contoh $a=1$, $b=2$: $1\\ge2$ salah.',
    sol: 'Kalikan 2 dulu lalu kelompokkan: $2(a^2+b^2+c^2-ab-bc-ca)=(a-b)^2+(b-c)^2+(c-a)^2$. Jumlah kuadrat pasti $\\ge0$.' });

  P({ id: 'pf-4', sec: 10, lvl: 6, concepts: ['pembuktian'],
    q: 'Buktikan dengan induksi matematika: $2^n>n^2$ untuk setiap bilangan asli $n\\ge5$.',
    steps: ['Basis: untuk $n=5$, $2^5=32>25=5^2$. Benar.', 'Hipotesis: misalkan untuk suatu $k\\ge5$ berlaku $2^k>k^2$.', 'Maka $2^{k+1}=2\\cdot2^k>2k^2$.', 'Untuk $k\\ge5$: $2k^2-(k+1)^2=k^2-2k-1=(k-1)^2-2\\ge14>0$, jadi $2k^2>(k+1)^2$.', 'Akibatnya $2^{k+1}>(k+1)^2$. Dengan induksi, pernyataan benar untuk semua $n\\ge5$.'],
    extra: ['Basis: untuk $n=1$, $2^1=2>1$. Benar.'],
    hints: ['Basis harus di titik awal yang diklaim. Cek: apakah $2^n>n^2$ benar untuk $n=2,3,4$?', 'Setelah $2^{k+1}>2k^2$, kamu tinggal membandingkan $2k^2$ dengan $(k+1)^2$.'],
    why: 'Basis $n=1$ tidak cukup karena langkah induksinya hanya berlaku untuk $k\\ge5$. Lagi pula $2^4=16=4^2$ (tidak lebih besar), jadi pernyataan memang gagal untuk $n=4$.',
    sol: 'Struktur induksi: basis → hipotesis → pakai hipotesis untuk kasus $k+1$ → tutup celahnya. Langkah 4 adalah bagian yang paling sering terlewat.' });

  P({ id: 'pf-5', sec: 7, lvl: 6, concepts: ['mutlak', 'ketaksamaan-klasik', 'pembuktian'],
    q: 'Buktikan ketaksamaan segitiga: $|a+b|\\le|a|+|b|$ untuk semua bilangan real $a,b$.',
    steps: ['Untuk setiap bilangan real $x$ berlaku $-|x|\\le x\\le|x|$.', 'Terapkan pada $a$ dan $b$: $-|a|\\le a\\le|a|$ dan $-|b|\\le b\\le|b|$.', 'Jumlahkan kedua rantai: $-(|a|+|b|)\\le a+b\\le|a|+|b|$.', 'Ingat: untuk $c\\ge0$, $-c\\le y\\le c \\iff |y|\\le c$. Pakai $y=a+b$, $c=|a|+|b|$.', 'Jadi $|a+b|\\le|a|+|b|$. Terbukti.'],
    extra: ['Karena $|a+b|=|a|+|b|$ untuk semua bilangan real $a,b$.'],
    hints: ['Pertidaksamaan mutlak "< c" artinya "terjepit di antara $-c$ dan $c$".'],
    why: 'Kesamaan $|a+b|=|a|+|b|$ hanya berlaku jika $a$ dan $b$ tidak berlawanan tanda. Contoh $a=3$, $b=-3$: $0\\ne6$.',
    sol: 'Ide bukti: ubah nilai mutlak menjadi bentuk berantai, jumlahkan, lalu ubah kembali menjadi nilai mutlak.' });

  P({ id: 'pf-6', sec: 10, lvl: 6, concepts: ['pembuktian'],
    q: 'Buktikan dengan definisi $\\varepsilon$-$\\delta$: $\\text{lim}_{x\\to2}\\,3x=6$. Artinya: untuk setiap $\\varepsilon>0$ ada $\\delta>0$ sehingga $0<|x-2|<\\delta \\Rightarrow |3x-6|<\\varepsilon$.',
    steps: ['Ambil sebarang $\\varepsilon>0$.', 'Pilih $\\delta=\\frac{\\varepsilon}{3}$; jelas $\\delta>0$.', 'Misalkan $0<|x-2|<\\delta$.', 'Maka $|3x-6|=3|x-2|<3\\delta$.', 'Karena $3\\delta=\\varepsilon$, diperoleh $|3x-6|<\\varepsilon$. Terbukti.'],
    extra: ['Pilih $\\delta=3\\varepsilon$.'],
    hints: ['$|3x-6|=3|x-2|$. Jarak output tiga kali jarak input, jadi jarak input harus dibuat sepertiganya.'],
    why: 'Dengan $\\delta=3\\varepsilon$ hanya didapat $|3x-6|<9\\varepsilon$, terlalu longgar.',
    sol: 'Pola semua bukti $\\varepsilon$-$\\delta$: "ambil ε → pilih δ (dari kertas buram) → misalkan x dekat → hitung → tutup". Ini materi kalkulus tahun pertama kuliah, dibangun sepenuhnya dari pertidaksamaan nilai mutlak.' });

  P({ id: 'pf-7', sec: 10, lvl: 6, concepts: ['ketaksamaan-klasik', 'pembuktian'],
    q: 'Buktikan ketaksamaan Bernoulli: untuk $x\\ge-1$ dan bilangan asli $n$, $(1+x)^n\\ge1+nx$.',
    steps: ['Basis $n=1$: $(1+x)^1=1+x\\ge1+1\\cdot x$. Benar (sama).', 'Hipotesis: misalkan $(1+x)^k\\ge1+kx$.', 'Kalikan kedua ruas dengan $1+x$. Karena $x\\ge-1$, $1+x\\ge0$, jadi tanda tetap: $(1+x)^{k+1}\\ge(1+kx)(1+x)$.', 'Jabarkan: $(1+kx)(1+x)=1+(k+1)x+kx^2$.', 'Karena $kx^2\\ge0$: $(1+x)^{k+1}\\ge1+(k+1)x$. Terbukti dengan induksi.'],
    extra: ['Kalikan kedua ruas dengan $1+x$. Karena $x$ bisa negatif, tandanya dibalik.'],
    hints: ['Syarat $x\\ge-1$ ada gunanya. Di langkah mana syarat itu dipakai?'],
    why: 'Yang menentukan tanda adalah faktor pengalinya, yaitu $1+x$, bukan $x$. Karena $x\\ge-1$, $1+x\\ge0$, jadi tanda tetap. Inilah satu-satunya tempat syarat $x\\ge-1$ dipakai.',
    sol: 'Perhatikan bagaimana sifat dasar Bagian 1 (kali bilangan tak negatif: tanda tetap) dan "kuadrat ≥ 0" muncul di bukti tingkat kuliah.' });

  P({ id: 'pf-8', sec: 10, lvl: 6, concepts: ['ketaksamaan-klasik', 'pembuktian'],
    q: 'Buktikan Cauchy–Schwarz dua suku: $(a^2+b^2)(x^2+y^2)\\ge(ax+by)^2$ untuk semua bilangan real.',
    steps: ['Jabarkan ruas kiri: $a^2x^2+a^2y^2+b^2x^2+b^2y^2$.', 'Jabarkan ruas kanan: $a^2x^2+2abxy+b^2y^2$.', 'Kurangkan: kiri − kanan $=a^2y^2-2abxy+b^2x^2$.', 'Ini kuadrat sempurna: $a^2y^2-2abxy+b^2x^2=(ay-bx)^2\\ge0$.', 'Jadi kiri $\\ge$ kanan, dengan kesamaan saat $ay=bx$.'],
    extra: ['Ambil akar kedua ruas: $\\sqrt{a^2+b^2}\\cdot\\sqrt{x^2+y^2}\\ge ax+by$, lalu kuadratkan kembali.'],
    alt: [[1, 0, 2, 3, 4]],
    hints: ['Cara paling aman membandingkan dua ekspresi: hitung selisihnya.'],
    why: 'Langkah itu memakai bentuk lain dari kesimpulan untuk membuktikan dirinya sendiri (melingkar).',
    sol: 'Teknik "selisih = kuadrat sempurna" adalah senjata utama pembuktian ketaksamaan. Dua langkah pertama boleh ditukar urutannya.' });
})(typeof window !== 'undefined' ? window : globalThis);
