/* Batas — konten tambahan: penjelasan lebih dalam, widget baru, sumber belajar, Bagian 10 */
(function (G) {
  'use strict';
  const C = G.BC = G.BC || {};
  const L = C.LESSONS;
  function ins(sec, anchor, blocks) {
    const arr = L[sec]; let i = arr.findIndex(b => b.title === anchor || b.k === anchor);
    if (i < 0) { console.warn('anchor tidak ketemu', sec, anchor); i = arr.length - 1; }
    arr.splice(i + 1, 0, ...blocks);
  }
  function before(sec, k, blocks) { const arr = L[sec]; const i = arr.findIndex(b => b.k === k); arr.splice(i < 0 ? arr.length : i, 0, ...blocks); }

  /* ================= BAGIAN 1 ================= */
  ins(1, 'Sebelum diajari, tebak dulu', [
    { k: 'text', tag: 'Dasar', title: 'Bahasa simbol: membaca <, >, ≤, ≥', html: `<p>Sebelum masuk sifat-sifatnya, pastikan kita sepakat soal "kamus" simbolnya.</p>
<table class="tbl"><tr><th>Simbol</th><th>Dibaca</th><th>Contoh benar</th></tr>
<tr><td>$a<b$</td><td>$a$ kurang dari $b$</td><td>$-5<-2$</td></tr><tr><td>$a>b$</td><td>$a$ lebih dari $b$</td><td>$0>-1$</td></tr>
<tr><td>$a\\le b$</td><td>$a$ kurang dari <b>atau sama dengan</b> $b$</td><td>$3\\le3$ (benar!)</td></tr><tr><td>$a\\ge b$</td><td>$a$ lebih dari atau sama dengan $b$</td><td>$4\\ge 1$</td></tr></table>
<p><b>Trik ingat:</b> ujung yang <b>terbuka lebar</b> selalu menghadap bilangan yang lebih besar, seperti mulut buaya yang ingin memakan yang lebih banyak. Dan garis kecil di bawah ($\\le$, $\\ge$) artinya "boleh sama".</p>
<p><b>Membaca dari kanan:</b> $3<x$ sama artinya dengan $x>3$. Biasakan menulis variabel di kiri supaya tidak bingung.</p>
<p class="tip">Kenapa $3\\le3$ benar? Karena ≤ artinya "kurang dari <b>atau</b> sama dengan". Cukup salah satu benar. Di sini "sama dengan" benar.</p>` }
  ]);
  ins(1, 'Kenapa negatif membalik? Bayangkan utang', [
    { k: 'widget', id: 'cermin', tag: 'Eksperimen', title: 'Cermin di titik nol', predict: { q: 'Jika $a=2$ dan $b=5$ dicerminkan di titik 0, mana yang sekarang lebih besar?', opts: ['$-2$', '$-5$', 'sama'], ans: 0, after: 'Geser a dan b. Perhatikan: bayangan cermin selalu membalik urutan, tidak peduli posisi awalnya.' } }
  ]);
  ins(1, 'Operasi yang TIDAK selalu aman', [
    { k: 'widget', id: 'kuadratAman', tag: 'Eksperimen', title: 'Kapan mengkuadratkan itu aman?', predict: { q: 'Jika $a<b$, apakah selalu $a^2<b^2$?', opts: ['Ya, selalu', 'Tidak selalu'], ans: 1, after: 'Cari sendiri pasangan a dan b yang membuat baris kedua salah padahal baris pertama benar.' } }
  ]);
  before(1, 'traps', [
    { k: 'recap', title: 'Rangkuman mini Bagian 1', items: ['$a<b$ artinya $b-a$ positif.', 'Tambah/kurang bilangan yang sama: tanda tetap.', 'Kali/bagi bilangan positif: tanda tetap.', 'Kali/bagi bilangan negatif: tanda <b>dibalik</b> (bercermin di titik 0).', 'Mengkuadratkan dan membalik pecahan hanya aman dengan syarat tertentu.', 'Penulisan: bulat penuh ↔ [ ], bulat kosong ↔ ( ), ∞ selalu ( ).'] }
  ]);

  /* ================= BAGIAN 2 ================= */
  ins(2, 'Membuka kado berlapis', [
    { k: 'widget', id: 'langkah', tag: 'Eksperimen', title: 'Bongkar langkah demi langkah', predict: { q: 'Pada $-2x+5\\ge11$, setelah dikurangi 5 jadi $-2x\\ge6$. Lalu dibagi $-2$, hasilnya…', opts: ['$x\\ge-3$', '$x\\le-3$'], ans: 1, after: 'Pilih soalnya, lalu tekan tombol satu per satu. Perhatikan kapan tanda berwarna oranye (dibalik).' } }
  ]);
  ins(2, 'Langkah baku pertidaksamaan linear', [
    { k: 'text', tag: 'Teknik', title: 'Ada pecahan? Kalikan dengan KPK', html: `<p>Pecahan membuat hitungan rawan salah. Cara rapinya: kalikan <b>semua suku di kedua ruas</b> dengan KPK penyebut. KPK selalu positif, jadi tanda tidak berubah.</p>
$$\\frac{x}{2}-\\frac{x-1}{3}\\le1 \\quad\\Rightarrow\\quad 3x-2(x-1)\\le6$$
<p>Perhatikan dua hal yang sering terlupa:</p>
<ol class="steps"><li>Angka 1 di ruas kanan <b>juga</b> dikali 6, jadi 6.</li><li>Pembilang $x-1$ dibungkus kurung karena seluruhnya dikali 2: $-2(x-1)=-2x+2$.</li></ol>
<p>Lanjutkan: $3x-2x+2\\le6 \\Rightarrow x\\le4$.</p>` },
    { k: 'text', tag: 'Kasus khusus', title: 'Kapan jawabannya kosong atau semua bilangan?', html: `<p>Kadang suku $x$ habis saat dipindahkan. Hasil akhirnya tinggal pernyataan tentang angka saja:</p>
<ul><li>$2x+1<2x+3 \\Rightarrow 1<3$: <b>selalu benar</b>, jadi jawabannya <b>semua bilangan real</b> ($\\R$).</li>
<li>$2x+5<2x+3 \\Rightarrow 5<3$: <b>selalu salah</b>, jadi jawabannya <b>tidak ada</b> ($\\emptyset$).</li></ul>
<p>Jangan panik saat $x$ "hilang". Itu justru informasi penting: pertidaksamaannya tidak bergantung pada $x$.</p>` }
  ]);
  ins(2, 'Soal cerita', [
    { k: 'example', tag: 'Giliranmu', title: 'Paket data', problem: 'Paket A: Rp30.000 untuk 10 GB, lalu Rp4.000 per GB tambahan. Paket B: Rp5.000 per GB. Untuk pemakaian lebih dari 10 GB, mulai berapa GB paket A lebih hemat?', steps: [
      { t: 'Misalkan pemakaian $g$ GB ($g>10$). Biaya A: $30000+4000(g-10)$. Biaya B: $5000g$.' },
      { t: 'A lebih hemat: $30000+4000g-40000<5000g \\Rightarrow -10000<1000g \\Rightarrow g>-10$', hide: true, ask: 'Tulis pertidaksamaannya dan sederhanakan.' },
      { t: 'Hasil $g>-10$ selalu benar untuk $g>10$. Artinya untuk pemakaian berapa pun di atas 10 GB, A selalu lebih hemat. Cek $g=11$: A = 34.000, B = 55.000 ✓', hide: true, ask: 'Apa artinya hasil itu dalam konteks soal?' }] }
  ]);
  before(2, 'traps', [
    { k: 'recap', title: 'Rangkuman mini Bagian 2', items: ['Isolasi $x$ dengan operasi kebalikan, dari lapisan terluar.', 'Ada pecahan: kalikan KPK (positif, tanda tetap).', 'Berantai: operasi ke ketiga ruas; dibagi negatif → balik kedua tanda.', '$x$ di beberapa ruas: pecah dua, selesaikan, lalu iris.', '$x$ hilang: jawabannya $\\R$ (selalu benar) atau $\\emptyset$ (selalu salah).', 'Soal cerita: terjemahkan kata kunci, perhatikan syarat bulat/positif.'] }
  ]);

  /* ================= BAGIAN 3 ================= */
  ins(3, 'Langkah baku pertidaksamaan kuadrat', [
    { k: 'text', tag: 'Kenapa begitu?', title: 'Dari mana pola "di antara" dan "di luar"?', html: `<p>Pola itu bukan hafalan. Ambil $(x-3)(x+2)$. Titik $-2$ dan $3$ membagi garis bilangan menjadi tiga daerah. Di dalam satu daerah, tanda tidak pernah berubah (karena hanya bisa berubah saat melewati nol). Jadi cukup uji <b>satu</b> bilangan per daerah:</p>
<table class="tbl"><tr><th>Daerah</th><th>Uji</th><th>$(x-3)$</th><th>$(x+2)$</th><th>Hasil</th></tr>
<tr><td>$x<-2$</td><td>$x=-3$</td><td>−</td><td>−</td><td>+</td></tr>
<tr><td>$-2<x<3$</td><td>$x=0$</td><td>−</td><td>+</td><td>−</td></tr>
<tr><td>$x>3$</td><td>$x=4$</td><td>+</td><td>+</td><td>+</td></tr></table>
<p>Lihat polanya: +, −, +. Negatif di tengah, positif di luar. Itulah asal "di antara" dan "di luar". Coba sendiri di widget berikut.</p>` },
    { k: 'widget', id: 'regiontest:kuad', tag: 'Eksperimen', title: 'Uji satu titik per daerah', predict: { q: 'Untuk $(x-3)(x+2)$, tanda di daerah $-2<x<3$ adalah…', opts: ['positif', 'negatif'], ans: 1, after: 'Ketuk tiap daerah untuk mengujinya. Setelah semua daerah diuji, kesimpulan muncul.' } }
  ]);
  ins(3, 'Kalau tidak ada akar: D < 0 dan D = 0', [
    { k: 'text', tag: 'Teknik', title: 'Akar tidak bulat? Pakai rumus abc', html: `<p>Tidak semua kuadrat bisa difaktorkan dengan bilangan bulat. Contoh $x^2-2x-1<0$. Akarnya pakai rumus abc:</p>
$$x=\\frac{2\\pm\\sqrt{4+4}}{2}=1\\pm\\sqrt2$$
<p>Jadi $x_1=1-\\sqrt2\\approx-0{,}41$ dan $x_2=1+\\sqrt2\\approx2{,}41$. Karena $a>0$ dan tanda $<0$, jawabannya di antara: $1-\\sqrt2<x<1+\\sqrt2$.</p>
<p class="tip">Untuk soal "berapa bilangan bulat yang memenuhi", taksir akarnya dengan desimal: bilangan bulat di antara −0,41 dan 2,41 adalah 0, 1, 2 (tiga buah).</p>` }
  ]);
  ins(3, 'Soal parameter: "berlaku untuk semua x"', [
    { k: 'widget', id: 'paramm', tag: 'Eksperimen', title: 'Geser m sampai selalu positif', predict: { q: 'Untuk $m=1$, apakah $x^2-4x+1>0$ untuk semua $x$?', opts: ['Ya', 'Tidak'], ans: 1, after: 'Geser m. Kurva harus terbuka ke atas dan melayang di atas sumbu-x.' } }
  ]);
  before(3, 'traps', [
    { k: 'recap', title: 'Rangkuman mini Bagian 3', items: ['Nolkan ruas kanan, buat koefisien $x^2$ positif.', 'Cari akar (faktor atau rumus abc).', 'Tanda hanya bisa berubah di akar: uji satu titik per daerah.', '$a>0$: negatif di antara akar, positif di luar.', '$D<0$: definit, jawabannya $\\R$ atau $\\emptyset$.', 'Jangan bagi dengan $x$, jangan akarkan dua ruas.'] }
  ]);

  /* ================= BAGIAN 4 ================= */
  ins(4, 'Setiap faktor adalah saklar', [
    { k: 'widget', id: 'saklar', tag: 'Eksperimen', title: 'Lampu tanda tiap faktor', predict: { q: 'Saat $x$ bergerak dari 2 ke 4 melewati 3, tanda $(x-3)^2$…', opts: ['berubah', 'tetap positif (0 tepat di 3)'], ans: 1, after: 'Geser x dari kiri ke kanan. Lampu (x+2) dan (x−1) berganti sekali, lampu (x−3)² tidak pernah merah.' } }
  ]);
  ins(4, 'Aturan cepat tabel tanda', [
    { k: 'widget', id: 'regiontest:poli', tag: 'Eksperimen', title: 'Uji daerah pada kubik', predict: { q: 'Untuk $x(x-2)(x+2)$, berapa banyak daerah yang harus diuji?', opts: ['3', '4', '6'], ans: 1, after: 'Tiga titik kritis membagi garis menjadi 4 daerah.' } },
    { k: 'text', tag: 'Teknik', title: 'Memfaktorkan kubik: tebak akar lalu bagi', html: `<p>Untuk $x^3-2x^2-5x+6$:</p>
<ol class="steps"><li><b>Tebak akar</b> dari pembagi konstanta (±1, ±2, ±3, ±6). Coba $x=1$: $1-2-5+6=0$ ✓. Jadi $(x-1)$ faktor.</li>
<li><b>Bagi</b> dengan cara Horner: tulis koefisien 1, −2, −5, 6. Turunkan 1; kali 1 tambah −2 → −1; kali 1 tambah −5 → −6; kali 1 tambah 6 → 0 (sisa 0 ✓). Hasil bagi $x^2-x-6$.</li>
<li><b>Faktorkan sisanya:</b> $x^2-x-6=(x-3)(x+2)$.</li></ol>
<p>Jadi $x^3-2x^2-5x+6=(x-1)(x-3)(x+2)$.</p>
<p class="tip">Cek cepat: jumlah koefisien = 0 berarti $x=1$ pasti akar. Di sini $1-2-5+6=0$.</p>` }
  ]);
  before(4, 'traps', [
    { k: 'recap', title: 'Rangkuman mini Bagian 4', items: ['Faktorkan sepenuhnya (teorema faktor + Horner).', 'Daerah paling kanan = tanda koefisien utama.', 'Pangkat ganjil: tanda berganti. Pangkat genap: tetap.', 'Faktor definit positif (misal $x^2+1$) boleh diabaikan.', 'Untuk ≥/≤, cek setiap akar: bisa jadi ada titik terpencil seperti $\\{-2\\}$.'] }
  ]);

  /* ================= BAGIAN 5 ================= */
  ins(5, 'Pecahan = pembagian, dan pembagian ikut aturan tanda', [
    { k: 'widget', id: 'pecahantanda', tag: 'Eksperimen', title: 'Tanda pembilang, penyebut, dan hasil', predict: { q: 'Jika pembilang negatif dan penyebut negatif, hasil baginya…', opts: ['positif', 'negatif'], ans: 0, after: 'Geser x dan amati tiga kotak tanda. Tepat di x = 1 kotak hasil menjadi terlarang.' } }
  ]);
  ins(5, 'Kenapa kali silang dilarang?', [
    { k: 'text', tag: 'Teknik alternatif', title: 'Trik aman: kalikan dengan kuadrat penyebut', html: `<p>Masalah kali silang adalah tanda penyebut tidak diketahui. Bagaimana kalau kita kalikan kedua ruas dengan sesuatu yang <b>pasti positif</b>? Kuadrat penyebut $(x-2)^2$ selalu positif (untuk $x\\ne2$)!</p>
$$\\frac{x+1}{x-2}>1 \\;\\Rightarrow\\; (x+1)(x-2)>(x-2)^2$$
<p>Pindahkan: $(x-2)\\big[(x+1)-(x-2)\\big]>0 \\Rightarrow 3(x-2)>0 \\Rightarrow x>2$. Hasilnya sama dengan cara biasa.</p>
<p class="tip">Cara ini sah karena kita mengali bilangan positif. Tapi jangan lupa syarat $x\\ne2$ tetap ditulis.</p>` },
    { k: 'widget', id: 'regiontest:rasi', tag: 'Eksperimen', title: 'Uji daerah pada pecahan', predict: { q: 'Pada $\\frac{x+3}{(x-1)(x+1)}\\ge0$, apakah $x=1$ boleh masuk jawaban?', opts: ['Boleh', 'Tidak boleh'], ans: 1, after: 'Titik kosong menandai pembuat nol penyebut. Ketuk tiap daerah.' } }
  ]);
  before(5, 'traps', [
    { k: 'recap', title: 'Rangkuman mini Bagian 5', items: ['Tulis syarat penyebut ≠ 0.', 'Jangan kali silang: pindahkan semua ke satu ruas.', 'Satukan menjadi $\\frac PQ\\;\\square\\;0$, faktorkan.', 'Tanda $\\frac PQ$ = tanda $P\\cdot Q$.', 'Atau: kalikan kuadrat penyebut (selalu positif).', 'Pembuat nol penyebut selalu bulat kosong.'] }
  ]);

  /* ================= BAGIAN 6 ================= */
  ins(6, 'Akar adalah gerbang dengan dua aturan', [
    { k: 'widget', id: 'gerbang', tag: 'Eksperimen', title: 'Lewati gerbang akar', predict: { q: 'Untuk $\\sqrt{x-3}<2$, apakah $x=7$ memenuhi?', opts: ['Ya', 'Tidak'], ans: 1, after: 'Geser x. Syarat 1 harus hijau dulu, baru syarat 2 berarti.' } }
  ]);
  ins(6, 'Tiga tipe dan resepnya', [
    { k: 'text', tag: 'Kenapa begitu?', title: 'Membedah resep $\\sqrt f<g$', html: `<p>Setiap syarat punya alasan:</p>
<ol class="steps"><li>$f\\ge0$ karena akar bilangan negatif tidak ada.</li>
<li>$g>0$ karena akar selalu $\\ge0$. Bilangan $\\ge0$ tidak mungkin kurang dari bilangan $\\le0$. Jadi kalau $g\\le0$, otomatis gagal.</li>
<li>$f<g^2$ didapat dengan mengkuadratkan. Ini sah karena kedua ruas sekarang dijamin $\\ge0$.</li></ol>
<p>Untuk $\\sqrt f>g$, logikanya terbalik: kalau $g<0$, akar (yang $\\ge0$) <b>otomatis</b> lebih besar, asal terdefinisi. Itulah sebabnya ada kasus tambahan.</p>
<p class="tip">Cara cek tanpa resep: gambar $y=\\sqrt f$ dan $y=g$ (widget berikutnya), lalu lihat di mana kurva akar ada di bawah/atas garis.</p>` }
  ]);
  before(6, 'traps', [
    { k: 'recap', title: 'Rangkuman mini Bagian 6', items: ['Selalu mulai dengan syarat isi akar ≥ 0.', 'Akar selalu ≥ 0.', '$\\sqrt f<g$: $f\\ge0$, $g>0$, $f<g^2$.', '$\\sqrt f>g$: kasus $g<0$ (otomatis) atau $g\\ge0$ (kuadratkan).', 'Akhiri dengan mengiris semua syarat.'] }
  ]);

  /* ================= BAGIAN 7 ================= */
  ins(7, 'Nilai mutlak adalah JARAK', [
    { k: 'text', tag: 'Dasar', title: 'Membaca $|x+2|$: pusatnya di −2', html: `<p>$|x+2|=|x-(-2)|$, jadi artinya jarak $x$ ke <b>−2</b>, bukan ke 2. Tanda di dalam selalu dibalik saat menentukan pusat.</p>
<p>Untuk bentuk $|2x-6|$, keluarkan dulu koefisiennya: $|2x-6|=2|x-3|$. Jadi $|2x-6|<4 \\iff |x-3|<2$: jarak ke 3 kurang dari 2, yaitu $1<x<5$.</p>` }
  ]);
  ins(7, 'Kenapa $|f|<|g|$ boleh dikuadratkan?', [
    { k: 'widget', id: 'titiktengah', tag: 'Eksperimen', title: 'Lebih dekat ke a atau ke b?', predict: { q: '$|x-2|<|x+4|$: titik-titik yang lebih dekat ke 2 daripada ke −4 ada di sebelah mana titik tengah −1?', opts: ['kiri', 'kanan'], ans: 1, after: 'Geser a, b, dan x. Batasnya selalu titik tengah a dan b.' } },
    { k: 'text', tag: 'Teknik', title: 'Metode pecah kasus (paling umum)', html: `<p>Kalau ada beberapa nilai mutlak, misalnya $|x-1|+|x+2|\\le5$, gunakan definisi. Titik nol isinya: $x=1$ dan $x=-2$. Pecah tiga daerah:</p>
<table class="tbl"><tr><th>Daerah</th><th>Bentuk tanpa mutlak</th><th>Hasil</th></tr>
<tr><td>$x<-2$</td><td>$-(x-1)-(x+2)=-2x-1\\le5$</td><td>$x\\ge-3$ → $[-3,-2)$</td></tr>
<tr><td>$-2\\le x<1$</td><td>$-(x-1)+(x+2)=3\\le5$</td><td>selalu → $[-2,1)$</td></tr>
<tr><td>$x\\ge1$</td><td>$(x-1)+(x+2)=2x+1\\le5$</td><td>$x\\le2$ → $[1,2]$</td></tr></table>
<p>Gabungkan: $-3\\le x\\le2$. Makna jarak: jumlah jarak ke 1 dan ke −2 paling banyak 5.</p>` }
  ]);
  before(7, 'traps', [
    { k: 'recap', title: 'Rangkuman mini Bagian 7', items: ['$|x-a|$ = jarak $x$ ke $a$.', '< dekat (satu interval), > jauh (dua arah).', 'Ruas kanan negatif: $<$ → ∅, $>$ → semua $x$.', '$|f|<|g| \\iff (f-g)(f+g)<0$.', 'Beberapa mutlak: pecah kasus di titik nol isinya.'] }
  ]);

  /* ================= BAGIAN 8 ================= */
  ins(8, 'Aturannya', [
    { k: 'widget', id: 'loggraph', tag: 'Eksperimen', title: 'Grafik logaritma dan batasnya', predict: { q: 'Untuk basis $a=0{,}5$, $\\log_a x>1$ berarti…', opts: ['$x>0{,}5$', '$0<x<0{,}5$'], ans: 1, after: 'Geser basis melewati 1. Perhatikan arah grafik dan daerah abu-abu (x ≤ 0).' } },
    { k: 'text', tag: 'Hati-hati', title: 'Kenapa syarat numerus wajib ditulis paling awal?', html: `<p>Lihat $\\log x+\\log(x-3)<1$. Kalau langsung digabung: $\\log(x(x-3))<\\log10 \\Rightarrow x^2-3x-10<0 \\Rightarrow -2<x<5$.</p>
<p>Tapi $x=1$ ada di jawaban itu, padahal $\\log(1-3)=\\log(-2)$ <b>tidak ada</b>! Masalahnya: menggabungkan dua log menjadi satu memperluas domain. $x(x-3)$ bisa positif walau masing-masing negatif.</p>
<p>Karena itu syarat ditulis <b>dari soal asli</b>: $x>0$ dan $x-3>0$, jadi $x>3$. Iris: $3<x<5$.</p>` }
  ]);
  before(8, 'traps', [
    { k: 'recap', title: 'Rangkuman mini Bagian 8', items: ['Samakan basis.', 'Basis > 1: tanda tetap. 0 < basis < 1: tanda dibalik.', 'Numerus > 0, ditulis dari soal asli sebelum menggabung log.', 'Substitusi $p=a^x$ (ingat $p>0$).', 'Akhiri dengan mengiris syarat.'] }
  ]);

  /* ================= BAGIAN 9 ================= */
  ins(9, 'Membuat pertidaksamaan dari gambar', [
    { k: 'widget', id: 'garisdua', tag: 'Eksperimen', title: 'Buat garis dari dua titik potong', predict: { q: 'Garis memotong $(4,0)$ dan $(0,2)$, daerahnya memuat $(0,0)$. Pertidaksamaannya…', opts: ['$x+2y\\le4$', '$2x+y\\le4$'], ans: 0, after: 'Geser titik potong dan pilih sisi daerahnya. Rumus bx + ay = ab muncul otomatis.' } }
  ]);
  ins(9, 'Langkah menggambar', [
    { k: 'text', tag: 'Teknik', title: 'Dari soal cerita ke model: 4 langkah', html: `<ol class="steps"><li><b>Tentukan variabel:</b> apa yang dicari banyaknya? ($x$ = kue A, $y$ = kue B)</li>
<li><b>Buat tabel</b> sumber daya: baris = jenis barang, kolom = bahan/biaya/waktu, plus baris "tersedia".</li>
<li><b>Baca tiap kolom</b> sebagai satu pertidaksamaan: "kebutuhan total ≤ yang tersedia".</li>
<li><b>Syarat alami:</b> $x\\ge0$, $y\\ge0$, dan bilangan bulat jika barang tidak bisa dipecah.</li></ol>
<table class="tbl"><tr><th></th><th>Tepung</th><th>Gula</th></tr><tr><td>Kue A ($x$)</td><td>2</td><td>1</td></tr><tr><td>Kue B ($y$)</td><td>1</td><td>3</td></tr><tr><td>Tersedia</td><td>10</td><td>15</td></tr></table>
<p>Kolom tepung: $2x+y\\le10$. Kolom gula: $x+3y\\le15$.</p>` }
  ]);
  before(9, 'traps', [
    { k: 'recap', title: 'Rangkuman mini Bagian 9', items: ['Gambar garis lewat titik potong sumbu.', 'Tegas untuk ≤/≥, putus-putus untuk < / >.', 'Uji titik (0,0) untuk memilih sisi.', 'Daerah penyelesaian = irisan semua daerah.', 'Soal cerita: tabel → satu kolom satu pertidaksamaan.', 'Optimum fungsi tujuan ada di titik pojok.'] }
  ]);

  /* ================= BAGIAN 10: TANTANGAN ================= */
  C.SECTIONS.push({ id: 10, short: 'Tantangan', title: 'Tantangan: ketaksamaan klasik (olimpiade & kuliah)', jalur: 'tantangan', glyph: 'AM≥GM', concepts: ['amgm', 'ketaksamaan-klasik', 'pembuktian'] });
  Object.assign(C.CONCEPTS, { 'amgm': 'AM-GM & rata-rata', 'ketaksamaan-klasik': 'Cauchy, segitiga, Bernoulli', 'pembuktian': 'Penalaran & pembuktian', 'lintas': 'Soal lintas bab' });
  L[10] = [
    { k: 'retrieval' },
    { k: 'text', tag: 'Mulai di sini', title: 'Dari "menyelesaikan" ke "membuktikan"', html: `<p>Sampai Bagian 9, kita <b>menyelesaikan</b> pertidaksamaan: mencari semua $x$ yang memenuhi. Di olimpiade dan di kuliah, pertanyaannya sering berbalik: <b>buktikan</b> bahwa suatu pertidaksamaan berlaku untuk <b>semua</b> bilangan (dengan syarat tertentu), atau cari <b>nilai terkecil/terbesar</b> suatu ekspresi.</p>
<p>Alatnya adalah beberapa "ketaksamaan klasik". Semuanya lahir dari satu fakta yang sangat sederhana:</p>
$$\\text{bilangan real apa pun dikuadratkan hasilnya}\\ \\ge0$$
<p>Bagian ini tantangan: tidak wajib untuk ulangan sekolah, tapi sangat melatih cara berpikir.</p>` },
    { k: 'q', id: 's10-pre', tag: 'Coba dulu', title: 'Tebak dulu' },
    { k: 'text', tag: 'Intuisi', title: 'Persegi panjang dengan keliling tetap', html: `<p>Kamu punya tali sepanjang 20 cm untuk membentuk persegi panjang. Bentuk apa yang luasnya paling besar? Coba bayangkan: persegi panjang yang sangat pipih (9,5 × 0,5) luasnya hanya 4,75. Persegi 5 × 5 luasnya 25.</p>
<p>Ternyata yang paling luas selalu <b>persegi</b>. Ini adalah wajah geometris dari ketaksamaan AM-GM.</p>` },
    { k: 'widget', id: 'amgm', tag: 'Eksperimen', title: 'AM-GM dalam persegi panjang', predict: { q: 'Keliling 20. Panjang 8 dan lebar 2 menghasilkan luas…', opts: ['16', '20', '25'], ans: 0, after: 'Geser panjangnya. Batang hijau (rata-rata hitung) selalu 5, batang ungu (rata-rata ukur) tidak pernah melebihinya.' } },
    { k: 'text', tag: 'Definisi formal', title: 'Ketaksamaan AM-GM', html: `<p>Untuk $a,b\\ge0$: $$\\frac{a+b}{2}\\ge\\sqrt{ab}$$ dengan <b>kesamaan jika dan hanya jika $a=b$</b>.</p>
<p><b>Bukti satu baris:</b> $(\\sqrt a-\\sqrt b)^2\\ge0 \\Rightarrow a-2\\sqrt{ab}+b\\ge0 \\Rightarrow a+b\\ge2\\sqrt{ab}$.</p>
<p>Untuk $n$ bilangan tak negatif: $\\frac{a_1+\\dots+a_n}{n}\\ge\\sqrt[n]{a_1a_2\\cdots a_n}$.</p>
<p><b>Rantai rata-rata</b> (untuk $a,b>0$): $$\\sqrt{\\frac{a^2+b^2}{2}}\\ \\ge\\ \\frac{a+b}{2}\\ \\ge\\ \\sqrt{ab}\\ \\ge\\ \\frac{2}{\\frac1a+\\frac1b}$$ (QM ≥ AM ≥ GM ≥ HM).</p>` },
    { k: 'example', tag: 'Contoh', title: 'Mencari nilai minimum', problem: 'Tentukan nilai minimum $x+\\frac4x$ untuk $x>0$.', steps: [
      { t: 'Kedua suku positif, jadi AM-GM berlaku: $x+\\frac4x\\ge2\\sqrt{x\\cdot\\frac4x}=2\\sqrt4=4$' },
      { t: 'Kesamaan saat $x=\\frac4x \\Rightarrow x^2=4 \\Rightarrow x=2$ (positif). Cek: $2+2=4$ ✓' },
      { t: 'Nilai minimum <b>4</b>, dicapai di $x=2$. Kunci trik: pilih suku-suku yang <b>hasil kalinya konstan</b>.' }] },
    { k: 'example', tag: 'Giliranmu', title: 'Jebakan kesamaan', problem: 'Nilai minimum $x+\\frac1x$ untuk $x\\ge2$ adalah…', steps: [
      { t: 'AM-GM memberi $x+\\frac1x\\ge2$, kesamaan di $x=1$.', hide: true, ask: 'Apa batas bawah dari AM-GM, dan kapan kesamaannya?' },
      { t: 'Tapi $x=1$ <b>tidak boleh</b> (syarat $x\\ge2$). Jadi 2 tidak pernah dicapai.', hide: true, ask: 'Apakah titik kesamaan itu ada di domain?' },
      { t: 'Fungsi $x+\\frac1x$ naik untuk $x\\ge1$, jadi minimum di $x=2$: $2+\\frac12=\\frac52$.', hide: true, ask: 'Lalu minimum sebenarnya di mana?' }] },
    { k: 'widget', id: 'segitiga', tag: 'Eksperimen', title: 'Ketaksamaan segitiga', predict: { q: 'Melangkah 4 ke kanan lalu 3 ke kiri. Jarakmu dari titik awal dibanding total langkah…', opts: ['lebih kecil', 'sama', 'lebih besar'], ans: 0, after: '|a + b| ≤ |a| + |b|. Sama hanya jika keduanya searah.' } },
    { k: 'text', tag: 'Definisi formal', title: 'Tiga ketaksamaan klasik lain', html: `<p><b>1. Ketaksamaan segitiga:</b> $|a+b|\\le|a|+|b|$. Akibatnya $\\big||a|-|b|\\big|\\le|a-b|$. Dipakai terus-menerus di kalkulus.</p>
<p><b>2. Cauchy–Schwarz (dua suku):</b> $(a^2+b^2)(x^2+y^2)\\ge(ax+by)^2$. Bukti: selisihnya $=(ay-bx)^2\\ge0$.<br>Contoh: jika $x^2+y^2=25$, maka $3x+4y\\le\\sqrt{(9+16)\\cdot25}=25$.</p>
<p><b>3. Bernoulli:</b> $(1+x)^n\\ge1+nx$ untuk $x\\ge-1$ dan $n$ bilangan asli. Intuisi: bunga majemuk selalu minimal sebesar bunga tunggal.</p>` },
    { k: 'text', tag: 'Level kuliah', title: 'Pertidaksamaan di kalkulus: epsilon dan delta', html: `<p>Di kuliah, definisi limit memakai pertidaksamaan nilai mutlak. "$\\text{lim}_{x\\to2}\\,3x=6$" artinya: untuk setiap $\\varepsilon>0$ ada $\\delta>0$ sehingga $$|x-2|<\\delta \\Rightarrow |3x-6|<\\varepsilon$$</p>
<p>Karena $|3x-6|=3|x-2|$, cukup pilih $\\delta=\\frac\\varepsilon3$. Lihat: kemampuan memanipulasi $|x-a|$ dari Bagian 7 langsung terpakai!</p>
<p>Bentuk lain yang sering muncul: "sejak $n$ berapa $2^n>n^2$?" Cek: $n=4$ memberi $16=16$ (belum), $n=5$ memberi $32>25$ ✓, dan sejak itu selalu benar (bisa dibuktikan dengan induksi).</p>` },
    { k: 'text', tag: 'Strategi', title: 'Peta strategi soal olimpiade', html: `<ol class="steps"><li><b>Cari kasus kesamaan dulu.</b> Coba $a=b=c$ atau nilai simetris. Itu biasanya titik optimum dan menunjukkan ketaksamaan mana yang cocok.</li>
<li><b>Hasil kali konstan?</b> Pakai AM-GM. <b>Jumlah kuadrat?</b> Pakai Cauchy–Schwarz.</li>
<li><b>Ubah menjadi kuadrat.</b> Pindahkan semua ke satu ruas, lalu coba tulis sebagai jumlah kuadrat (teknik SOS).</li>
<li><b>Periksa syarat.</b> AM-GM butuh bilangan tak negatif, dan titik kesamaannya harus bisa dicapai.</li></ol>` },
    { k: 'traps', ids: ['amgm-positif', 'amgm-kesamaan', 'kuadrat-dua-ruas'] },
    { k: 'practice' },
    { k: 'exit', qs: ['s10-l5-1', 's10-l5-2', 's10-l6-1'], prompt: 'Jelaskan kenapa AM-GM hanya memberi nilai minimum yang sebenarnya jika titik kesamaannya ada di dalam domain.', points: ['AM-GM memberi batas bawah', 'Batas itu dicapai hanya saat kesamaan terjadi', 'Jika titik kesamaan di luar domain, batas tidak tercapai dan minimum lebih besar'] }
  ];
  Object.assign(C.TRAPS, {
    'amgm-positif': { name: 'AM-GM untuk bilangan negatif', sec: 10, wrong: '$x+\\frac1x\\ge2$ untuk semua $x\\ne0$', right: 'Hanya untuk $x>0$. Untuk $x=-1$: $-2\\ge2$ salah.', tip: 'AM-GM butuh semua suku tak negatif.' },
    'amgm-kesamaan': { name: 'Titik kesamaan tidak tercapai', sec: 10, wrong: 'min $x+\\frac1x$ di $x\\ge2$ adalah 2', right: 'Minimum $\\frac52$ di $x=2$', tip: 'Selalu cek apakah nilai kesamaan ada di domain.' }
  });

  /* ================= Bagian 0: cara memakai halaman materi ================= */
  C.INTRO.splice(C.INTRO.length - 1, 0, { k: 'text', tag: 'Cara memakai', title: 'Peta halaman materi', html: `<p>Setiap bagian materi punya susunan yang sama, supaya kamu selalu tahu sedang di mana:</p>
<ol class="steps"><li><b>Pemanasan</b>: dua soal dari bab sebelumnya.</li><li><b>Coba dulu</b>: satu soal sebelum diajari.</li><li><b>Materi</b>: intuisi → widget → definisi formal → kenapa begitu.</li><li><b>Contoh</b>: dari yang lengkap sampai yang kamu isi sendiri.</li><li><b>Rangkuman mini & jebakan</b>.</li><li><b>Latihan L1–L6</b> dan <b>tiket keluar</b>.</li><li><b>Sumber belajar</b>: artikel dan video untuk memperdalam.</li></ol>
<p>Di laptop, daftar isi ada di kiri. Di HP, ketuk <b>Daftar isi</b> di atas materi. Kamu bisa lompat ke subbab mana pun kapan saja.</p>` });

  /* ================= SUMBER BELAJAR EKSTERNAL ================= */
  const yt = (q) => ({ type: 'video', title: 'Cari video: "' + q + '"', src: 'YouTube (hasil pencarian)', url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q), note: 'Pilih video berdurasi 10–20 menit dari kanal pendidikan.' });
  const RG = (title, url) => ({ type: 'video', title, src: 'Ruangguru (video, mungkin perlu login)', url });
  const DESMOS = { type: 'alat', title: 'Desmos: gambar sendiri grafik pertidaksamaan', src: 'desmos.com', url: 'https://www.desmos.com/calculator', note: 'Ketik misalnya y < x^2 - x - 6 dan lihat daerahnya.' };
  C.RES = {
    1: [{ type: 'artikel', title: 'Pertidaksamaan Linear Satu Variabel: pengertian, sifat, contoh', src: 'Quipper Blog', url: 'https://www.quipper.com/id/blog/mapel/matematika/pertidaksamaan-linear-satu-variabel/' },
      { type: 'artikel', title: 'Solving Inequalities (bahasa Inggris, banyak gambar)', src: 'Math is Fun', url: 'https://www.mathsisfun.com/algebra/inequality-solving.html' },
      { type: 'artikel', title: 'Pertidaksamaan', src: 'Wikipedia bahasa Indonesia', url: 'https://id.wikipedia.org/wiki/Pertidaksamaan' },
      RG('Konsep dasar persamaan dan pertidaksamaan (UTBK)', 'https://app.ruangguru.com/ruangbelajar/utbk-ujian-mandiri-tps/pengetahuan-kuantitatif/aljabar-dan-fungsi/konsep-dasar-persamaan-dan-pertidaksamaan-new'),
      yt('sifat sifat pertidaksamaan kelas 10')],
    2: [{ type: 'artikel', title: 'Pertidaksamaan Linear Satu Variabel', src: 'Quipper Blog', url: 'https://www.quipper.com/id/blog/mapel/matematika/pertidaksamaan-linear-satu-variabel/' },
      { type: 'artikel', title: 'Matematika Dasar SBMPTN: persamaan dan pertidaksamaan linear', src: 'Quipper Blog', url: 'https://www.quipper.com/id/blog/masuk-ptn/sbmptn/matematika-sbmptn/matematika-dasar-sbmptn-tentang-persamaan-linear-dan-pertidaksamaan-linear/' },
      { type: 'artikel', title: 'Pengertian dan cara penyelesaian pertidaksamaan', src: 'Ruangguru Blog', url: 'https://www.ruangguru.com/blog/?p=6463' },
      yt('pertidaksamaan linear satu variabel bentuk berantai'), yt('soal cerita pertidaksamaan linear')],
    3: [RG('Pertidaksamaan Kuadrat (Kurikulum Merdeka kelas 10)', 'https://app.ruangguru.com/ruangbelajar/sma-kelas-10-kurikulum-merdeka/matematika/fungsi-persamaan-dan-pertidaksamaan-kuadrat/pertidaksamaan-kuadrat'),
      { type: 'artikel', title: 'Solving Quadratic Inequalities (bahasa Inggris)', src: 'LibreTexts Mathematics', url: 'https://math.libretexts.org/Bookshelves/Algebra/Advanced_Algebra/06:_Solving_Equations_and_Inequalities/605:_Solving_Quadratic_Inequalities' },
      { type: 'artikel', title: 'Contoh soal pertidaksamaan kuadrat dan pembahasan', src: 'Mamikos Info', url: 'https://mamikos.com/info/contoh-soal-pertidaksamaan-kuadrat-pljr/' },
      DESMOS, yt('pertidaksamaan kuadrat garis bilangan')],
    4: [{ type: 'artikel', title: 'Solve Polynomial Inequalities: tutorial (bahasa Inggris)', src: 'Analyzemath', url: 'https://www.analyzemath.com/Inequalities_Polynomial/Inequalities_Polynomial_T.html' },
      { type: 'artikel', title: 'Polynomial and Rational Inequalities (bahasa Inggris)', src: 'LibreTexts Mathematics', url: 'https://math.libretexts.org/Courses/Monroe_Community_College/MTH_165_College_Algebra_MTH_175_Precalculus/03%3A_Polynomial_and_Rational_Functions/3.08%3A_Polynomial_and_Rational_Inequalities' },
      yt('pertidaksamaan polinomial tabel tanda'), yt('teorema faktor horner suku banyak')],
    5: [{ type: 'artikel', title: 'Pertidaksamaan Rasional', src: 'Quipper Blog', url: 'https://www.quipper.com/id/blog/mapel/matematika/pertidaksamaan-rasional/' },
      RG('Pertidaksamaan Rasional (Kurikulum Merdeka kelas 11)', 'https://app.ruangguru.com/ruangbelajar/sma-kelas-11-kurikulum-merdeka/matematika/fungsi-persamaan-dan-pertidaksamaan-rasional/pertidaksamaan-rasional'),
      { type: 'artikel', title: 'Pertidaksamaan irasional dan rasional kelas 10', src: 'Quipper Blog', url: 'https://www.quipper.com/id/blog/mapel/matematika/pertidaksamaan-irasional-dan-rasional-matematika-ipa-kelas-10/' },
      yt('pertidaksamaan pecahan rasional kelas 10')],
    6: [{ type: 'artikel', title: 'Pertidaksamaan irasional dan rasional kelas 10', src: 'Quipper Blog', url: 'https://www.quipper.com/id/blog/mapel/matematika/pertidaksamaan-irasional-dan-rasional-matematika-ipa-kelas-10/' },
      RG('Pertidaksamaan Irasional (Bentuk Akar)', 'https://app.ruangguru.com/ruangbelajar/sma-kelas-10-ips/matematika-wajib/fungsi-persamaan-dan-pertidaksamaan-irasional-bentuk-akar/pertidaksamaan-irasional-bentuk-akar'),
      yt('pertidaksamaan irasional bentuk akar')],
    7: [{ type: 'artikel', title: 'Persamaan dan Pertidaksamaan Nilai Mutlak', src: 'Quipper Blog', url: 'https://www.quipper.com/id/blog/mapel/matematika/persamaan-dan-pertidaksamaan-nilai-mutlak/' },
      { type: 'artikel', title: 'Contoh soal persamaan dan pertidaksamaan nilai mutlak', src: 'detikEdu', url: 'https://www.detik.com/edu/detikpedia/d-7427391/contoh-soal-persamaan-dan-pertidaksamaan-nilai-mutlak-serta-penyelesaiannya' },
      RG('Pertidaksamaan Nilai Mutlak Linear', 'https://app.ruangguru.com/ruangbelajar/sma-kelas-10-ips/matematika-wajib/fungsi-persamaan-dan-pertidaksamaan-nilai-mutlak/pertidaksamaan-nilai-mutlak-linear'),
      RG('Pertidaksamaan Nilai Mutlak Nonlinear', 'https://app.ruangguru.com/ruangbelajar/sma-kelas-10-ipa/matematika-wajib-dan-minat/fungsi-persamaan-dan-pertidaksamaan-nilai-mutlak/pertidaksamaan-nilai-mutlak-nonlinear'),
      yt('pertidaksamaan nilai mutlak sebagai jarak')],
    8: [{ type: 'artikel', title: 'Pertidaksamaan Eksponen', src: 'Quipper Blog', url: 'https://www.quipper.com/id/blog/mapel/matematika/pertidaksamaan-eksponen/' },
      { type: 'artikel', title: 'Pertidaksamaan Logaritma', src: 'Quipper Blog', url: 'https://www.quipper.com/id/blog/mapel/matematika/pertidaksamaan-logaritma/' },
      { type: 'artikel', title: 'Pertidaksamaan Eksponen', src: 'Catatan Matematika', url: 'https://catatanmatematika.com/2022/08/pertidaksamaan-eksponen.html' },
      RG('Konsep kilat eksponen dan logaritma (UTBK & Mandiri)', 'https://app.ruangguru.com/ruangbelajar/utbk-&-ujian-mandiri-sbmptn/matematika/aljabar-dan-fungsi/konsep-kilat-eksponen-dan-logaritma-new'),
      yt('pertidaksamaan logaritma basis kurang dari 1')],
    9: [{ type: 'artikel', title: 'Contoh soal pertidaksamaan linear dua variabel', src: 'Mamikos Info', url: 'https://mamikos.com/info/contoh-soal-pertidaksamaan-linear-dua-variabel-pljr/' },
      { type: 'buku', title: 'Modul Matematika Umum kelas XI: program linear (PDF)', src: 'Repositori Kemdikbud', url: 'https://repositori.kemdikbud.go.id/19635/1/Kelas%20XI_Matematika%20Umum_KD%203.2%20%281%29.pdf' },
      DESMOS, yt('sistem pertidaksamaan linear dua variabel daerah penyelesaian')],
    10: [{ type: 'artikel', title: 'AM-GM Inequality (bahasa Inggris)', src: 'Art of Problem Solving Wiki', url: 'https://artofproblemsolving.com/wiki/index.php/AM-GM_Inequality' },
      { type: 'artikel', title: 'Proofs of AM-GM (berbagai bukti)', src: 'Art of Problem Solving Wiki', url: 'https://artofproblemsolving.com/wiki/index.php/Proofs_of_AM-GM' },
      { type: 'artikel', title: 'RMS-AM-GM-HM Inequality', src: 'Art of Problem Solving Wiki', url: 'https://artofproblemsolving.com/wiki/index.php/Root-Mean_Square-Arithmetic_Mean-Geometric_Mean-Harmonic_mean_Inequality' },
      { type: 'artikel', title: 'Ketaksamaan QM-AM-GM-HM: rumus, bukti, soal', src: 'Math Cyber 1997', url: 'https://mathcyber1997.com/?p=23662' },
      yt('ketaksamaan AM-GM olimpiade matematika'), yt('Cauchy Schwarz inequality intuition')]
  };
  C.RES_GENERAL = [
    { type: 'buku', title: 'Buku Matematika SMA Kelas X Semester 1 (BSE, PDF)', src: 'Kemdikbud, mirror Unpad', url: 'https://mirror.unpad.ac.id/bse/Kurikulum_2013/Siswa/Kelas_10_SMA_Matematika_Siswa_Semester_1.pdf' },
    DESMOS
  ];
  for (let s = 1; s <= 10; s++) L[s].push({ k: 'res', title: 'Sumber belajar' });
  /* ================= Flashcard tambahan ================= */
  [[10, 'AM-GM', 'Bunyi AM-GM untuk dua bilangan?', '$\\frac{a+b}2\\ge\\sqrt{ab}$ untuk $a,b\\ge0$, sama jika dan hanya jika $a=b$.'],
   [10, 'AM-GM', 'Bukti satu baris AM-GM?', '$(\\sqrt a-\\sqrt b)^2\\ge0 \\Rightarrow a+b\\ge2\\sqrt{ab}$.'],
   [10, 'Strategi', 'Kapan AM-GM cocok dipakai untuk mencari minimum?', 'Saat suku-sukunya positif dan <b>hasil kalinya konstan</b>, misalnya $x+\\frac4x$.'],
   [10, 'Jebakan', 'Kenapa min $x+\\frac1x$ untuk $x\\ge2$ bukan 2?', 'Kesamaan AM-GM di $x=1$, di luar domain. Minimum sebenarnya $\\frac52$ di $x=2$.'],
   [10, 'Cauchy', 'Ketaksamaan Cauchy–Schwarz (dua suku)?', '$(a^2+b^2)(x^2+y^2)\\ge(ax+by)^2$.'],
   [10, 'Segitiga', 'Ketaksamaan segitiga?', '$|a+b|\\le|a|+|b|$, sama jika $a$ dan $b$ searah.'],
   [10, 'Rantai', 'Urutan QM, AM, GM, HM?', 'QM ≥ AM ≥ GM ≥ HM (untuk bilangan positif).'],
   [3, 'Teknik', 'Akar kuadrat tidak bulat, misalnya $x^2-2x-1<0$?', 'Rumus abc: $1-\\sqrt2<x<1+\\sqrt2$.'],
   [5, 'Teknik', 'Cara aman selain pindah ruas untuk pecahan?', 'Kalikan dengan kuadrat penyebut (selalu positif), jangan lupa syarat penyebut ≠ 0.'],
   [7, 'Teknik', 'Ada dua nilai mutlak dijumlah. Caranya?', 'Pecah kasus di titik nol tiap isi mutlak.'],
   [2, 'Kasus', '$x$ hilang dan tersisa $1<3$. Artinya?', 'Selalu benar: penyelesaiannya semua bilangan real.'],
   [8, 'Jebakan', 'Kenapa syarat numerus ditulis dari soal asli?', 'Menggabung dua log bisa memperluas domain secara keliru.']
  ].forEach((c, i) => C.CARDS.push({ id: 'kc' + (i + 1), sec: c[0], kind: c[1], f: c[2], b: c[3] }));

})(typeof window !== 'undefined' ? window : globalThis);
