/* Batas — konten bagian B: materi Bagian 1–9 */
(function (G) {
  'use strict';
  const C = G.BC = G.BC || {};
  C.LESSONS = {};

  /* ======================= BAGIAN 1 ======================= */
  C.LESSONS[1] = [
    { k: 'retrieval' },
    { k: 'q', id: 's1-pre', tag: 'Coba dulu', title: 'Sebelum diajari, tebak dulu', note: 'Belum diajari? Justru itu intinya. Coba jawab, salah pun tidak apa-apa.' },
    { k: 'text', tag: 'Intuisi', title: 'Timbangan dan jungkat-jungkit', html: `<p>Persamaan $a=b$ itu seperti <b>timbangan yang seimbang</b>. Pertidaksamaan $a<b$ itu seperti <b>jungkat-jungkit yang miring</b>: sisi $b$ lebih berat, jadi turun.</p>
<p>Sekarang pikirkan apa yang bisa kamu lakukan tanpa mengubah arah miringnya:</p>
<ul><li><b>Menambah atau mengurangi beban yang sama</b> di kedua sisi → tetap miring ke arah yang sama.</li>
<li><b>Melipatgandakan kedua sisi</b> (kali bilangan positif) → tetap miring ke arah yang sama.</li>
<li><b>Mengali dengan bilangan negatif</b> → nah, ini yang ajaib. Kemiringannya <b>terbalik</b>.</li></ul>` },
    { k: 'text', tag: 'Analogi', title: 'Kenapa negatif membalik? Bayangkan utang', html: `<p>Kamu punya Rp2 juta, temanmu Rp5 juta. Jelas $2<5$.</p>
<p>Sekarang bayangkan keduanya utang: kamu utang Rp2 juta ($-2$), temanmu utang Rp5 juta ($-5$). Siapa yang "lebih kaya"? Kamu! Jadi $-2>-5$.</p>
<p>Mengali dengan $-1$ itu seperti <b>bercermin di titik 0</b>: yang tadinya di kanan pindah ke kiri, dan sebaliknya. Urutannya ikut terbalik.</p>` },
    { k: 'widget', id: 'seesaw', title: 'Jungkat-jungkit pertidaksamaan', tag: 'Eksperimen',
      predict: { q: 'Mulai dari $2<5$. Kalau kedua ruas dikali $-1$, hasilnya…', opts: ['$-2<-5$', '$-2>-5$', '$-2=-5$'], ans: 1, after: 'Sekarang coba sendiri. Tekan tombol operasinya dan perhatikan kapan jungkat-jungkitnya terbalik.' } },
    { k: 'text', tag: 'Definisi formal', title: 'Apa arti $a<b$ sebenarnya?', html: `<p>Secara formal: $a<b$ artinya $b-a$ <b>positif</b>. Semua sifat di bawah lahir dari definisi ini.</p>
<table class="tbl"><tr><th>Sifat</th><th>Bentuk</th><th>Tanda</th></tr>
<tr><td>Tambah/kurang bilangan yang sama</td><td>$a<b \\Rightarrow a+c<b+c$</td><td>tetap</td></tr>
<tr><td>Kali/bagi bilangan <b>positif</b></td><td>$a<b,\\ c>0 \\Rightarrow ac<bc$</td><td>tetap</td></tr>
<tr><td>Kali/bagi bilangan <b>negatif</b></td><td>$a<b,\\ c<0 \\Rightarrow ac>bc$</td><td class="flip">dibalik</td></tr>
<tr><td>Transitif</td><td>$a<b$ dan $b<c \\Rightarrow a<c$</td><td>tetap</td></tr></table>` },
    { k: 'text', tag: 'Kenapa begitu?', title: 'Bukti singkat sifat "dibalik"', html: `<p>Misalkan $a<b$ dan $c<0$. Karena $a<b$, maka $b-a>0$ (positif).</p>
<p>Positif dikali negatif hasilnya negatif: $c(b-a)<0$, artinya $cb-ca<0$, artinya $ca>cb$.</p>
<p>Selesai! Tanda terbalik bukan "aturan hafalan", tapi akibat langsung dari aturan tanda perkalian.</p>` },
    { k: 'text', tag: 'Hati-hati', title: 'Operasi yang TIDAK selalu aman', html: `<p><b>Mengkuadratkan.</b> $-3<2$ benar, tapi $(-3)^2<2^2$ artinya $9<4$, salah! Mengkuadratkan aman hanya jika kedua ruas $\\ge0$.</p>
<p><b>Membalik pecahan.</b> $2<3 \\Rightarrow \\frac12>\\frac13$ benar. Tapi $-2<3$ dan $-\\frac12<\\frac13$, tandanya tidak berbalik. Membalik pecahan membalik tanda hanya jika kedua ruas bertanda sama.</p>
<p><b>Mengali dengan variabel.</b> Kalau mengali dengan $x$, kamu tidak tahu $x$ positif atau negatif, jadi tidak tahu harus membalik tanda atau tidak. Jangan lakukan. Cara amannya akan kita pelajari di Bagian 5.</p>` },
    { k: 'text', tag: 'Definisi formal', title: 'Empat cara menulis jawaban yang sama', html: `<table class="tbl"><tr><th>Pertidaksamaan</th><th>Interval</th><th>Himpunan</th></tr>
<tr><td>$-1\\le x<4$</td><td>$[-1,\\,4)$</td><td>$\\{x\\mid -1\\le x<4\\}$</td></tr>
<tr><td>$x>2$</td><td>$(2,\\,\\infty)$</td><td>$\\{x\\mid x>2\\}$</td></tr>
<tr><td>$x\\le-3$ atau $x>1$</td><td>$(-\\infty,-3]\\cup(1,\\infty)$</td><td>$\\{x\\mid x\\le-3 \\text{ atau } x>1\\}$</td></tr></table>
<p>Cara keempat: <b>garis bilangan</b>. Aturannya:</p>
<ul><li>$\\le$ atau $\\ge$ → bulat <b>penuh</b> ● dan kurung siku [ ] (titiknya termasuk).</li>
<li>$<$ atau $>$ → bulat <b>kosong</b> ○ dan kurung biasa ( ) (titiknya tidak termasuk).</li>
<li>∞ selalu kurung biasa, karena ∞ bukan bilangan dan tidak pernah "dicapai".</li></ul>` },
    { k: 'widget', id: 'interval', title: 'Pembuat interval', tag: 'Eksperimen',
      predict: { q: 'Daerah "semua bilangan dari −1 sampai 4, termasuk −1 tapi tidak termasuk 4" ditulis…', opts: ['$(-1,4]$', '$[-1,4)$', '$[-1,4]$'], ans: 1, after: 'Seret titik ujungnya, klik titik untuk mengganti penuh/kosong, dan lihat ketiga bentuk penulisan berubah bersamaan.' } },
    { k: 'example', tag: 'Contoh', title: 'Contoh lengkap', problem: 'Selesaikan $-3x+5\\ge 11$.', steps: [
      { t: 'Kurangi kedua ruas dengan 5: $-3x\\ge 6$' },
      { t: 'Bagi kedua ruas dengan $-3$ (negatif!), jadi tanda \\flip{dibalik}: $x\\le-2$' },
      { t: 'Interval: $(-\\infty,-2]$. Uji balik: $x=-3$ → $9+5=14\\ge11$ ✓' }], nl: '(-inf,-2]' },
    { k: 'example', tag: 'Giliranmu', title: 'Satu langkah disembunyikan', problem: 'Selesaikan $4-2x<10$.', steps: [
      { t: 'Kurangi 4: $-2x<6$' },
      { t: 'Bagi $-2$ dan balik tanda: $x>-3$', hide: true, ask: 'Bagi kedua ruas dengan −2. Tandanya jadi apa, dan berapa hasilnya?' },
      { t: 'Interval: $(-3,\\infty)$', hide: true, ask: 'Tulis dalam notasi interval.' }], nl: '(-3,inf)' },
    { k: 'traps', ids: ['balik-tanda', 'siku-tak-hingga', 'titik-ujung', 'dan-atau', 'kuadrat-dua-ruas', 'balik-pecahan'] },
    { k: 'q', id: 's1-err', tag: 'Pemburu jebakan', title: 'Temukan langkah yang salah' },
    { k: 'practice' },
    { k: 'exit', qs: ['s1-l1-1', 's1-l2-2', 's1-l3-1'], prompt: 'Jelaskan dengan kata-katamu sendiri: kenapa tanda harus dibalik saat mengali bilangan negatif?', points: ['Menyebut contoh bilangan, misalnya 2<5 tapi −2>−5', 'Menyebut "bercermin di titik 0" atau urutan terbalik', 'Menyebut bahwa positif × negatif = negatif'] }
  ];

  /* ======================= BAGIAN 2 ======================= */
  C.LESSONS[2] = [
    { k: 'retrieval' },
    { k: 'q', id: 's2-pre', tag: 'Coba dulu', title: 'Tebak dulu' },
    { k: 'text', tag: 'Intuisi', title: 'Membuka kado berlapis', html: `<p>Bayangkan $x$ adalah hadiah yang dibungkus berlapis-lapis. Pada $3x-7<8$, lapisan terluarnya "−7", lapisan dalamnya "×3".</p>
<p>Untuk mengambil hadiahnya, buka lapisan dari luar ke dalam dengan <b>operasi kebalikan</b>, dan lakukan ke <b>kedua ruas</b>: tambah 7 dulu ($3x<15$), lalu bagi 3 ($x<5$).</p>
<p>Bedanya dengan persamaan hanya satu: kalau di tengah jalan kamu mengali atau membagi dengan negatif, balik tandanya.</p>` },
    { k: 'widget', id: 'ujititik', title: 'Uji titik: geser x', tag: 'Eksperimen',
      predict: { q: 'Untuk $2x-1>5$, apakah $x=3$ memenuhi?', opts: ['Ya', 'Tidak', 'Tergantung'], ans: 1, after: 'Geser titik x dan lihat kapan pertidaksamaannya benar (hijau). Perhatikan: tepat di x = 3 hasilnya 5 > 5, yang salah.' } },
    { k: 'text', tag: 'Definisi formal', title: 'Langkah baku pertidaksamaan linear', html: `<ol class="steps"><li>Hilangkan kurung dan pecahan (kali KPK penyebut, bilangan positif, tanda tetap).</li>
<li>Kumpulkan suku $x$ di satu ruas, konstanta di ruas lain.</li>
<li>Bagi dengan koefisien $x$. Kalau negatif, balik tanda.</li>
<li>Tulis jawaban (interval/garis bilangan) dan uji balik.</li></ol>
<p class="tip">Trik menghindari pembagian negatif: kumpulkan $x$ di ruas yang koefisiennya jadi positif. $3x+2\\le5x-6$ → pindahkan ke kanan: $8\\le2x$ → $x\\ge4$. Tanpa membalik tanda sama sekali!</p>` },
    { k: 'text', tag: 'Definisi formal', title: 'Bentuk berantai: tiga ruas sekaligus', html: `<p>Bentuk $a<px+q<b$ artinya dua syarat sekaligus ("dan"). Karena $x$ hanya di tengah, kerjakan <b>ketiga ruas</b> bersamaan:</p>
$$-5<1-2x\\le7 \\;\\Rightarrow\\; -6<-2x\\le6 \\;\\Rightarrow\\; 3>x\\ge-3$$
<p>Lalu tulis ulang dari kecil ke besar: $-3\\le x<3$.</p>
<p><b>Tapi</b> kalau $x$ muncul di lebih dari satu ruas, misalnya $2x-1<x+3<3x-5$, pecah jadi dua pertidaksamaan, selesaikan masing-masing, lalu <b>iris</b>.</p>` },
    { k: 'text', tag: 'Soal cerita', title: 'Kamus kalimat → simbol', html: `<table class="tbl"><tr><th>Kalimat</th><th>Simbol</th></tr>
<tr><td>kurang dari, di bawah</td><td>$<$</td></tr><tr><td>lebih dari, melebihi, di atas</td><td>$>$</td></tr>
<tr><td>paling banyak, maksimal, tidak lebih dari, tidak melebihi</td><td>$\\le$</td></tr>
<tr><td>paling sedikit, minimal, tidak kurang dari, sekurang-kurangnya</td><td>$\\ge$</td></tr></table>
<p class="tip">Jangan lupa konteks: jumlah barang harus bilangan bulat, panjang harus positif, dan seterusnya.</p>` },
    { k: 'example', tag: 'Contoh', title: 'Contoh lengkap', problem: 'Selesaikan $3(x-2)-4\\le5x+2$.', steps: [
      { t: 'Distribusi: $3x-6-4\\le5x+2$, jadi $3x-10\\le5x+2$' },
      { t: 'Pindahkan $3x$ ke kanan dan $2$ ke kiri: $-12\\le2x$' },
      { t: 'Bagi 2 (positif, tanda tetap): $-6\\le x$, yaitu $x\\ge-6$' }], nl: '[-6,inf)' },
    { k: 'example', tag: 'Giliranmu', title: 'Berantai', problem: 'Selesaikan $-5<1-2x\\le7$.', steps: [
      { t: 'Kurangi 1 di ketiga ruas: $-6<-2x\\le6$' },
      { t: 'Bagi $-2$ dan balik kedua tanda: $3>x\\ge-3$', hide: true, ask: 'Bagi ketiga ruas dengan −2. Apa yang terjadi pada kedua tanda?' },
      { t: 'Ditulis rapi: $-3\\le x<3$, interval $[-3,3)$', hide: true, ask: 'Tulis ulang dari kecil ke besar.' }], nl: '[-3,3)' },
    { k: 'example', tag: 'Giliranmu', title: 'Soal cerita', problem: 'Nilai ulangan Dina: 70, 80, 65. Berapa nilai minimal ulangan ke-4 agar rata-ratanya paling sedikit 75?', steps: [
      { t: 'Misalkan nilai ke-4 = $n$. "Paling sedikit" berarti $\\ge$: $\\frac{70+80+65+n}{4}\\ge75$', hide: true, ask: 'Tulis model pertidaksamaannya.' },
      { t: 'Kali 4: $215+n\\ge300$, jadi $n\\ge85$', hide: true, ask: 'Selesaikan.' },
      { t: 'Nilai minimal ulangan ke-4 adalah <b>85</b>.' }] },
    { k: 'traps', ids: ['berantai-sebagian', 'terjemah-cerita', 'distribusi-negatif', 'balik-tanda'] },
    { k: 'text', tag: 'Kebiasaan juara', title: 'Uji balik: 20 detik yang menyelamatkan nilai', html: `<p>Setelah dapat jawaban, ambil <b>satu titik di dalam</b> jawaban dan <b>satu titik di luar</b>. Masukkan ke soal asli.</p>
<p>Titik di dalam harus membuat pertidaksamaan benar, titik di luar harus membuatnya salah. Kalau tidak, ada yang keliru. Cara ini menangkap hampir semua kesalahan tanda.</p>` },
    { k: 'q', id: 's2-err', tag: 'Pemburu jebakan', title: 'Temukan langkah yang salah' },
    { k: 'practice' },
    { k: 'exit', qs: ['s2-l1-1', 's2-l2-1', 's2-l3-2'], prompt: 'Jelaskan bagaimana cara mengerjakan bentuk berantai seperti −1 < 2x + 3 < 7, dan kapan bentuk berantai harus dipecah dua.', points: ['Operasi dilakukan ke ketiga ruas sekaligus', 'Balik kedua tanda jika membagi negatif', 'Dipecah dua jika x muncul di lebih dari satu ruas'] }
  ];

  /* ======================= BAGIAN 3 ======================= */
  C.LESSONS[3] = [
    { k: 'retrieval' },
    { k: 'q', id: 's3-pre', tag: 'Coba dulu', title: 'Tebak dulu' },
    { k: 'text', tag: 'Intuisi', title: 'Parabola sebagai bukit dan lembah', html: `<p>Grafik $y=x^2-x-6$ adalah parabola. Anggap <b>sumbu-x sebagai permukaan tanah</b>.</p>
<ul><li>$x^2-x-6>0$ artinya: di mana kurvanya ada <b>di atas tanah</b>?</li>
<li>$x^2-x-6<0$ artinya: di mana kurvanya ada <b>di bawah tanah</b>?</li></ul>
<p>Akar-akar persamaan $x^2-x-6=0$ (yaitu $x=-2$ dan $x=3$) adalah titik di mana kurva menembus tanah. Hanya di titik-titik inilah tandanya bisa berubah.</p>
<p>Karena $a>0$, parabolanya berbentuk <b>lembah</b>: di antara kedua akar ia di bawah tanah, di luar kedua akar ia di atas tanah.</p>` },
    { k: 'widget', id: 'parabola', title: 'Penjelajah parabola', tag: 'Eksperimen',
      predict: { q: 'Untuk $x^2-x-6<0$, daerah penyelesaiannya ada…', opts: ['di antara kedua akar', 'di luar kedua akar', 'semua x'], ans: 0, after: 'Ubah a, b, c dan tanda pertidaksamaannya. Perhatikan daerah yang menyala dan garis bilangan di bawahnya.' } },
    { k: 'text', tag: 'Definisi formal', title: 'Langkah baku pertidaksamaan kuadrat', html: `<ol class="steps"><li><b>Nolkan ruas kanan.</b> Pindahkan semua suku ke kiri: $ax^2+bx+c\\;\\square\\;0$.</li>
<li><b>Buat $a$ positif</b> (opsional tapi sangat membantu): kali $-1$ dan balik tanda.</li>
<li><b>Cari akar</b> dengan faktor atau rumus abc.</li>
<li><b>Garis bilangan:</b> tandai akar, uji tanda di tiap daerah (atau pakai pola).</li>
<li><b>Pilih daerah</b> sesuai tanda, tentukan ujung penuh/kosong, lalu uji balik.</li></ol>
<p>Pola untuk $a>0$ dengan dua akar $x_1<x_2$:</p>
<table class="tbl"><tr><th>Soal</th><th>Jawaban</th><th>Ingat sebagai</th></tr>
<tr><td>$f(x)<0$ atau $\\le0$</td><td>$x_1<x<x_2$</td><td>di antara (lembah di bawah tanah)</td></tr>
<tr><td>$f(x)>0$ atau $\\ge0$</td><td>$x<x_1$ atau $x>x_2$</td><td>di luar</td></tr></table>` },
    { k: 'text', tag: 'Kenapa begitu?', title: 'Kenapa tidak boleh langsung diakarkan?', html: `<p>Godaan besar: $x^2>9 \\Rightarrow x>3$. Tapi coba $x=-4$: $(-4)^2=16>9$, benar! Padahal $-4$ tidak memenuhi $x>3$.</p>
<p>Akarnya: $\\sqrt{x^2}=|x|$, bukan $x$. Jadi $x^2>9 \\iff |x|>3 \\iff x<-3$ atau $x>3$. Lebih aman lagi, pakai langkah baku: $x^2-9>0 \\Rightarrow (x-3)(x+3)>0$.</p>` },
    { k: 'text', tag: 'Definisi formal', title: 'Kalau tidak ada akar: D < 0 dan D = 0', html: `<p>Jika $D=b^2-4ac<0$, parabola tidak menyentuh tanah sama sekali. Ia melayang seluruhnya di atas (jika $a>0$) atau tenggelam seluruhnya di bawah (jika $a<0$).</p>
<table class="tbl"><tr><th></th><th>$a>0$, $D<0$ (definit positif)</th><th>$a<0$, $D<0$ (definit negatif)</th></tr>
<tr><td>$f>0$</td><td>semua $x$ ($\\R$)</td><td>$\\emptyset$</td></tr>
<tr><td>$f<0$</td><td>$\\emptyset$</td><td>semua $x$ ($\\R$)</td></tr></table>
<p>Jika $D=0$, parabola menyentuh tanah di satu titik $x_0$. Contoh $(x-2)^2$: $>0$ → semua $x$ kecuali 2; $\\ge0$ → semua $x$; $<0$ → $\\emptyset$; $\\le0$ → hanya $x=2$.</p>` },
    { k: 'example', tag: 'Contoh', title: 'Contoh lengkap', problem: 'Selesaikan $x^2-x-6\\le0$.', steps: [
      { t: 'Faktorkan: $(x-3)(x+2)\\le0$, akar $x=-2$ dan $x=3$' },
      { t: '$a>0$ dan soalnya $\\le0$ → daerah <b>di antara</b> akar' },
      { t: 'Tanda $\\le$ → ujung penuh. Jawaban: $-2\\le x\\le3$. Uji $x=0$: $-6\\le0$ ✓' }], nl: '[-2,3]' },
    { k: 'example', tag: 'Giliranmu', title: 'Koefisien negatif', problem: 'Selesaikan $-x^2+4x+5<0$.', steps: [
      { t: 'Kali $-1$, balik tanda: $x^2-4x-5>0$', hide: true, ask: 'Buat koefisien x² positif. Apa yang terjadi pada tandanya?' },
      { t: 'Faktorkan: $(x-5)(x+1)>0$, akar $-1$ dan $5$', hide: true, ask: 'Faktorkan.' },
      { t: '$>0$ → di luar: $x<-1$ atau $x>5$', hide: true, ask: 'Di antara atau di luar?' }], nl: '(-inf,-1)u(5,inf)' },
    { k: 'example', tag: 'Giliranmu', title: 'Jebakan membagi x', problem: 'Selesaikan $x^2<3x$.', steps: [
      { t: 'Jangan bagi dengan $x$! Pindahkan: $x^2-3x<0$', hide: true, ask: 'Langkah pertama yang aman?' },
      { t: 'Faktorkan: $x(x-3)<0$, akar 0 dan 3', hide: true, ask: 'Faktorkan.' },
      { t: 'Di antara: $0<x<3$. (Kalau dibagi $x$, kamu akan dapat $x<3$ dan keliru memasukkan $x=-1$.)', hide: true, ask: 'Tentukan daerahnya.' }], nl: '(0,3)' },
    { k: 'text', tag: 'Level ujian', title: 'Soal parameter: "berlaku untuk semua x"', html: `<p>Soal favorit ujian masuk PT: <i>Tentukan $m$ agar $mx^2-4x+m>0$ untuk semua $x$ real.</i></p>
<p>Terjemahkan ke gambar: parabola harus <b>selalu di atas tanah</b>. Syaratnya dua:</p>
<ol class="steps"><li>Terbuka ke atas: $m>0$.</li><li>Tidak menyentuh tanah: $D<0 \\Rightarrow 16-4m^2<0 \\Rightarrow m^2>4 \\Rightarrow m<-2$ atau $m>2$.</li></ol>
<p>Irisan keduanya: $m>2$. (Kasus $m=0$ dicek terpisah: $-4x>0$ tidak berlaku untuk semua $x$.)</p>` },
    { k: 'traps', ids: ['lupa-akar-negatif', 'arah-daerah', 'plusminus', 'bagi-x', 'a-negatif', 'd-negatif'] },
    { k: 'q', id: 's3-err', tag: 'Pemburu jebakan', title: 'Temukan langkah yang salah' },
    { k: 'practice' },
    { k: 'exit', qs: ['s3-l1-1', 's3-l2-1', 's3-l3-2'], prompt: 'Jelaskan dengan gambar bukit/lembah: kapan jawaban pertidaksamaan kuadrat berada "di antara" akar dan kapan "di luar" akar?', points: ['a > 0 berarti lembah (terbuka ke atas)', 'Lembah di bawah tanah di antara akar → f < 0 di antara', 'f > 0 di luar akar', 'Jika a < 0, kebalikannya'] }
  ];

  /* ======================= BAGIAN 4 ======================= */
  C.LESSONS[4] = [
    { k: 'retrieval' },
    { k: 'q', id: 's4-pre', tag: 'Coba dulu', title: 'Tebak dulu' },
    { k: 'text', tag: 'Intuisi', title: 'Setiap faktor adalah saklar', html: `<p>Bayangkan $(x-1)(x+2)(x-4)$ sebagai rangkaian tiga <b>saklar tanda</b>. Faktor $(x-r)$ bernilai negatif saat $x<r$ dan positif saat $x>r$. Setiap kali $x$ melewati $r$, saklarnya pindah.</p>
<p>Faktor $(x-r)^2$ itu seperti dua saklar di titik yang sama: pindah dua kali = kembali seperti semula. Itu sebabnya grafiknya <b>memantul</b> di akar berpangkat genap, dan <b>menyeberang</b> di akar berpangkat ganjil.</p>` },
    { k: 'widget', id: 'signchart', title: 'Pembangun tabel tanda', tag: 'Eksperimen',
      predict: { q: 'Pada $(x-1)(x-3)^2$, apakah tanda berganti saat melewati $x=3$?', opts: ['Ya', 'Tidak'], ans: 1, after: 'Atur akar dan pangkatnya. Perhatikan grafik memantul di akar berpangkat genap.' } },
    { k: 'text', tag: 'Definisi formal', title: 'Aturan cepat tabel tanda', html: `<ol class="steps"><li>Nolkan ruas kanan dan faktorkan sepenuhnya.</li>
<li>Tandai semua akar di garis bilangan beserta pangkatnya.</li>
<li><b>Daerah paling kanan</b> selalu bertanda sama dengan koefisien utama (untuk $x$ sangat besar, semua faktor $(x-r)$ positif).</li>
<li>Bergerak ke kiri: tanda <b>berganti</b> di akar berpangkat ganjil, <b>tetap</b> di akar berpangkat genap.</li>
<li>Pilih daerah, lalu cek titik-titik akar (termasuk atau tidak).</li></ol>
<p class="tip">Faktor yang selalu positif, seperti $x^2+1$ atau $x^2+x+1$ (D &lt; 0, a &gt; 0), boleh "dibuang" karena tidak memengaruhi tanda.</p>` },
    { k: 'example', tag: 'Contoh', title: 'Contoh lengkap', problem: 'Selesaikan $x^3-4x\\ge0$.', steps: [
      { t: 'Faktorkan: $x(x-2)(x+2)\\ge0$. Akar $-2, 0, 2$ (semua pangkat 1)' },
      { t: 'Paling kanan ($x>2$): +. Lalu berganti: $(0,2)$ −, $(-2,0)$ +, $(-\\infty,-2)$ −' },
      { t: 'Ambil + dan akar (karena ≥): $-2\\le x\\le0$ atau $x\\ge2$' }], nl: '[-2,0]u[2,inf)' },
    { k: 'example', tag: 'Giliranmu', title: 'Akar kembar', problem: 'Selesaikan $(x-2)^2(x+3)>0$.', steps: [
      { t: 'Akar $-3$ (pangkat 1) dan $2$ (pangkat 2)' },
      { t: 'Kanan: +. Di $x=2$ tidak berganti → $(-3,2)$ juga +. Di $-3$ berganti → $x<-3$ −', hide: true, ask: 'Isi tanda tiap daerah.' },
      { t: 'Ambil +, akar tidak termasuk: $x>-3$ dan $x\\ne2$', hide: true, ask: 'Tulis jawabannya (hati-hati titik 2).' }], nl: '(-3,2)u(2,inf)' },
    { k: 'example', tag: 'Giliranmu', title: 'Kubik dengan teorema faktor', problem: 'Selesaikan $x^3-2x^2-5x+6>0$.', steps: [
      { t: 'Coba $x=1$: $1-2-5+6=0$, jadi $(x-1)$ faktor', hide: true, ask: 'Cari satu akar dengan mencoba pembagi dari 6.' },
      { t: 'Bagi (Horner): $x^3-2x^2-5x+6=(x-1)(x^2-x-6)=(x-1)(x-3)(x+2)$', hide: true, ask: 'Faktorkan sisanya.' },
      { t: 'Tanda: $x>3$ +, $(1,3)$ −, $(-2,1)$ +, $x<-2$ −. Jawaban: $-2<x<1$ atau $x>3$', hide: true, ask: 'Tabel tanda dan jawaban.' }], nl: '(-2,1)u(3,inf)' },
    { k: 'traps', ids: ['tanda-akar-genap', 'kuadrat-sempurna', 'bagi-x'] },
    { k: 'q', id: 's4-err', tag: 'Pemburu jebakan', title: 'Temukan langkah yang salah' },
    { k: 'practice' },
    { k: 'exit', qs: ['s4-l1-1', 's4-l2-1', 's4-l3-1'], prompt: 'Kenapa tanda tidak berganti di akar yang berpangkat genap?', points: ['(x−r)² selalu ≥ 0', 'Melewati r, faktor (x−r) berganti dua kali', 'Grafik memantul, tidak menyeberang'] }
  ];

  /* ======================= BAGIAN 5 ======================= */
  C.LESSONS[5] = [
    { k: 'retrieval' },
    { k: 'q', id: 's5-pre', tag: 'Coba dulu', title: 'Tebak dulu' },
    { k: 'text', tag: 'Intuisi', title: 'Pecahan = pembagian, dan pembagian ikut aturan tanda', html: `<p>Tanda $\\frac{P}{Q}$ ditentukan persis seperti tanda $P\\cdot Q$: sama-sama positif atau sama-sama negatif → positif; beda tanda → negatif. Jadi metode tabel tanda dari Bagian 4 tetap jalan.</p>
<p>Bedanya satu: penyebut adalah <b>pintu terlarang</b>. Membagi dengan nol tidak bermakna (bayangkan membagi pizza ke 0 orang). Jadi pembuat nol penyebut <b>tidak pernah</b> masuk jawaban.</p>` },
    { k: 'widget', id: 'kalisilang', title: 'Kenapa kali silang gagal?', tag: 'Eksperimen',
      predict: { q: 'Untuk $\\frac{x+1}{x-2}>1$, kali silang menghasilkan $x+1>x-2$, yaitu $1>-2$ (selalu benar). Apakah berarti semua $x$ memenuhi?', opts: ['Ya, semua x', 'Tidak'], ans: 1, after: 'Geser x ke daerah kurang dari 2 dan bandingkan nilai aslinya dengan hasil kali silang.' } },
    { k: 'text', tag: 'Definisi formal', title: 'Langkah baku pertidaksamaan rasional', html: `<ol class="steps"><li><b>Syarat:</b> tulis penyebut $\\ne0$.</li>
<li><b>Nolkan ruas kanan:</b> pindahkan semua ke kiri. <b>Jangan kali silang.</b></li>
<li><b>Satukan</b> menjadi satu pecahan $\\frac{P(x)}{Q(x)}\\;\\square\\;0$ (samakan penyebut).</li>
<li><b>Faktorkan</b> pembilang dan penyebut, cari semua pembuat nol.</li>
<li><b>Tabel tanda</b> seperti polinomial.</li>
<li><b>Ujung:</b> pembuat nol pembilang ikut jika tanda $\\le/\\ge$; pembuat nol penyebut <b>selalu bulat kosong</b>.</li></ol>` },
    { k: 'text', tag: 'Kenapa begitu?', title: 'Kenapa kali silang dilarang?', html: `<p>Kali silang pada $\\frac{x+1}{x-2}>1$ berarti mengali kedua ruas dengan $(x-2)$. Kalau $x-2$ positif, tanda tetap. Kalau negatif, tanda harus dibalik. Kita tidak tahu yang mana, jadi hasilnya bisa salah.</p>
<p>Bukti: $x=0$. Kiri: $\\frac{1}{-2}=-0{,}5$, dan $-0{,}5>1$ salah. Tapi kali silang bilang $1>-2$ benar. Kontradiksi!</p>` },
    { k: 'example', tag: 'Contoh', title: 'Contoh lengkap', problem: 'Selesaikan $\\frac{x-3}{x+1}\\le0$.', steps: [
      { t: 'Syarat $x\\ne-1$. Pembuat nol: pembilang $3$, penyebut $-1$' },
      { t: 'Tanda: $x>3$ +, $(-1,3)$ −, $x<-1$ +' },
      { t: 'Ambil −. $3$ ikut (≤), $-1$ tidak (penyebut): $-1<x\\le3$' }], nl: '(-1,3]' },
    { k: 'example', tag: 'Giliranmu', title: 'Yang tadi gagal dikali silang', problem: 'Selesaikan $\\frac{x+1}{x-2}>1$.', steps: [
      { t: 'Pindahkan: $\\frac{x+1}{x-2}-1>0$', hide: true, ask: 'Nolkan ruas kanan.' },
      { t: 'Satukan: $\\frac{x+1-(x-2)}{x-2}=\\frac{3}{x-2}>0$', hide: true, ask: 'Samakan penyebut (hati-hati tanda minus).' },
      { t: 'Pembilang 3 selalu positif, jadi cukup $x-2>0$: $x>2$', hide: true, ask: 'Kapan pecahan ini positif?' }], nl: '(2,inf)' },
    { k: 'example', tag: 'Giliranmu', title: 'Dua pecahan', problem: 'Selesaikan $\\frac{2}{x-1}\\ge\\frac{1}{x+1}$.', steps: [
      { t: 'Syarat $x\\ne1, x\\ne-1$. Pindahkan: $\\frac{2}{x-1}-\\frac{1}{x+1}\\ge0$' },
      { t: 'Satukan: $\\frac{2(x+1)-(x-1)}{(x-1)(x+1)}=\\frac{x+3}{(x-1)(x+1)}\\ge0$', hide: true, ask: 'Samakan penyebut.' },
      { t: 'Tanda: $x>1$ +, $(-1,1)$ −, $(-3,-1)$ +, $x<-3$ −', hide: true, ask: 'Tabel tanda dengan titik −3, −1, 1.' },
      { t: 'Jawaban: $-3\\le x<-1$ atau $x>1$', hide: true, ask: 'Pilih daerah dan ujungnya.' }], nl: '[-3,-1)u(1,inf)' },
    { k: 'traps', ids: ['kali-silang', 'penyebut-tertutup', 'coret-faktor', 'kali-variabel'] },
    { k: 'q', id: 's5-err', tag: 'Pemburu jebakan', title: 'Temukan langkah yang salah' },
    { k: 'practice' },
    { k: 'exit', qs: ['s5-l1-1', 's5-l2-1', 's5-l3-1'], prompt: 'Jelaskan ke temanmu kenapa pertidaksamaan pecahan tidak boleh dikali silang, dan apa yang harus dilakukan sebagai gantinya.', points: ['Penyebut bisa negatif, sehingga tanda mungkin harus dibalik', 'Pindahkan semua ke satu ruas lalu satukan pecahan', 'Pembuat nol penyebut selalu bulat kosong'] }
  ];

  /* ======================= BAGIAN 6 ======================= */
  C.LESSONS[6] = [
    { k: 'retrieval' },
    { k: 'q', id: 's6-pre', tag: 'Coba dulu', title: 'Tebak dulu' },
    { k: 'text', tag: 'Intuisi', title: 'Akar adalah gerbang dengan dua aturan', html: `<p>Fungsi akar $\\sqrt{\\;\\;}$ itu seperti gerbang dengan dua aturan tetap:</p>
<ol class="steps"><li><b>Syarat masuk:</b> isi akar harus $\\ge0$. $\\sqrt{-4}$ tidak ada di bilangan real.</li>
<li><b>Hasil keluar:</b> selalu $\\ge0$. $\\sqrt{9}=3$, tidak pernah $-3$.</li></ol>
<p>Mengkuadratkan kedua ruas adalah alat utama untuk menghilangkan akar, tapi alat ini aman <b>hanya jika kedua ruas tak negatif</b> (ingat Bagian 1: $-3<2$ tapi $9>4$).</p>` },
    { k: 'widget', id: 'akar', title: 'Akar vs garis', tag: 'Eksperimen',
      predict: { q: 'Untuk $\\sqrt{x-3}<2$, apakah $x=0$ termasuk jawaban?', opts: ['Ya, karena 0 < 7', 'Tidak, akarnya tidak terdefinisi'], ans: 1, after: 'Daerah abu-abu adalah tempat akar tidak terdefinisi. Geser nilainya dan perhatikan.' } },
    { k: 'text', tag: 'Definisi formal', title: 'Tiga tipe dan resepnya', html: `<table class="tbl"><tr><th>Bentuk</th><th>Setara dengan</th></tr>
<tr><td>$\\sqrt{f}<g$</td><td>$f\\ge0$ <b>dan</b> $g>0$ <b>dan</b> $f<g^2$</td></tr>
<tr><td>$\\sqrt{f}>g$</td><td>[$f\\ge0$ dan $g<0$] <b>atau</b> [$g\\ge0$ dan $f>g^2$]</td></tr>
<tr><td>$\\sqrt{f}<\\sqrt{g}$</td><td>$f\\ge0$ <b>dan</b> $f<g$</td></tr></table>
<p>Untuk $\\le$ atau $\\ge$, ganti tanda yang sesuai (misalnya $\\sqrt{f}\\le g$: $f\\ge0$, $g\\ge0$, $f\\le g^2$).</p>
<p class="tip">Kenapa $\\sqrt{f}>g$ punya dua kasus? Kalau $g$ negatif, akar (yang selalu ≥ 0) otomatis lebih besar, asal akarnya terdefinisi.</p>` },
    { k: 'example', tag: 'Contoh', title: 'Contoh lengkap', problem: 'Selesaikan $\\sqrt{x-3}<2$.', steps: [
      { t: 'Syarat isi akar: $x-3\\ge0 \\Rightarrow x\\ge3$' },
      { t: 'Ruas kanan 2 positif, kuadratkan: $x-3<4 \\Rightarrow x<7$' },
      { t: 'Iris: $3\\le x<7$' }], nl: '[3,7)' },
    { k: 'example', tag: 'Giliranmu', title: 'Dua akar', problem: 'Selesaikan $\\sqrt{2x-4}\\le\\sqrt{x+1}$.', steps: [
      { t: 'Syarat: $2x-4\\ge0 \\Rightarrow x\\ge2$ (dan $x+1\\ge0$ otomatis)', hide: true, ask: 'Tulis syarat isi akar.' },
      { t: 'Kuadratkan: $2x-4\\le x+1 \\Rightarrow x\\le5$', hide: true, ask: 'Kuadratkan kedua ruas.' },
      { t: 'Iris: $2\\le x\\le5$', hide: true, ask: 'Gabungkan dengan syarat.' }], nl: '[2,5]' },
    { k: 'example', tag: 'Giliranmu', title: 'Dua kasus', problem: 'Selesaikan $\\sqrt{x+2}>x$.', steps: [
      { t: 'Syarat: $x\\ge-2$' },
      { t: 'Kasus 1, ruas kanan negatif ($x<0$): otomatis benar → $-2\\le x<0$', hide: true, ask: 'Apa yang terjadi jika x negatif?' },
      { t: 'Kasus 2, $x\\ge0$: kuadratkan $x+2>x^2 \\Rightarrow x^2-x-2<0 \\Rightarrow -1<x<2$, diiris → $0\\le x<2$', hide: true, ask: 'Jika x ≥ 0, kuadratkan.' },
      { t: 'Gabung: $-2\\le x<2$', hide: true, ask: 'Gabungkan kedua kasus.' }], nl: '[-2,2)' },
    { k: 'traps', ids: ['syarat-akar', 'kuadrat-ruas-negatif', 'kuadrat-dua-ruas'] },
    { k: 'q', id: 's6-err', tag: 'Pemburu jebakan', title: 'Temukan langkah yang salah' },
    { k: 'practice' },
    { k: 'exit', qs: ['s6-l1-1', 's6-l2-1', 's6-l3-1'], prompt: 'Sebutkan semua syarat yang harus ditulis sebelum mengkuadratkan √f < g, dan jelaskan kenapa masing-masing diperlukan.', points: ['f ≥ 0 karena isi akar tidak boleh negatif', 'g > 0 karena akar selalu ≥ 0', 'Baru kemudian f < g²'] }
  ];

  /* ======================= BAGIAN 7 ======================= */
  C.LESSONS[7] = [
    { k: 'retrieval' },
    { k: 'q', id: 's7-pre', tag: 'Coba dulu', title: 'Tebak dulu' },
    { k: 'text', tag: 'Intuisi', title: 'Nilai mutlak adalah JARAK', html: `<p>Lupakan dulu definisi formal. $|x-3|$ artinya <b>jarak antara $x$ dan 3</b> di garis bilangan.</p>
<ul><li>$|x-3|<2$: "titik-titik yang jaraknya ke 3 <b>kurang</b> dari 2 langkah" → semua titik <b>dekat</b> 3 → $1<x<5$.</li>
<li>$|x-3|>2$: "titik-titik yang jaraknya ke 3 <b>lebih</b> dari 2 langkah" → <b>jauh</b> dari 3, ke kiri atau ke kanan → $x<1$ atau $x>5$.</li></ul>
<p>Kata kuncinya: <b>kurang dari = dekat = satu ruas garis</b>, <b>lebih dari = jauh = dua arah</b>.</p>` },
    { k: 'widget', id: 'mutlak', title: 'Jarak di garis bilangan', tag: 'Eksperimen',
      predict: { q: '$|x+1|\\le3$ artinya jarak $x$ ke titik berapa kurang dari atau sama dengan 3?', opts: ['ke 1', 'ke −1', 'ke 3'], ans: 1, after: 'Ingat |x + 1| = |x − (−1)|. Geser pusat dan jari-jarinya.' } },
    { k: 'text', tag: 'Definisi formal', title: 'Definisi dan sifat', html: `<p>$|x|=x$ jika $x\\ge0$, dan $|x|=-x$ jika $x<0$. Untuk $c>0$:</p>
<table class="tbl"><tr><th>Bentuk</th><th>Setara dengan</th></tr>
<tr><td>$|f|<c$</td><td>$-c<f<c$</td></tr>
<tr><td>$|f|>c$</td><td>$f<-c$ atau $f>c$</td></tr>
<tr><td>$|f|<|g|$</td><td>$f^2<g^2 \\iff (f-g)(f+g)<0$</td></tr>
<tr><td>$|f|<g$ ($g$ bervariabel)</td><td>$-g<f<g$</td></tr>
<tr><td>$|f|>g$ ($g$ bervariabel)</td><td>$f<-g$ atau $f>g$</td></tr></table>
<p><b>Jika $c$ negatif:</b> $|f|<c$ tidak punya solusi; $|f|>c$ berlaku untuk semua $x$ (di domain $f$).</p>` },
    { k: 'text', tag: 'Kenapa begitu?', title: 'Kenapa $|f|<|g|$ boleh dikuadratkan?', html: `<p>Kedua ruas nilai mutlak pasti $\\ge0$, jadi mengkuadratkan aman (ingat syaratnya dari Bagian 1). Dan $|f|^2=f^2$. Lalu $f^2-g^2<0$ bisa difaktorkan sebagai selisih kuadrat: $(f-g)(f+g)<0$.</p>` },
    { k: 'example', tag: 'Contoh', title: 'Contoh lengkap', problem: 'Selesaikan $|2x-1|\\ge5$.', steps: [
      { t: '"≥" berarti jauh: $2x-1\\le-5$ atau $2x-1\\ge5$' },
      { t: '$2x\\le-4 \\Rightarrow x\\le-2$, atau $2x\\ge6 \\Rightarrow x\\ge3$' },
      { t: 'Jawaban: $x\\le-2$ atau $x\\ge3$' }], nl: '(-inf,-2]u[3,inf)' },
    { k: 'example', tag: 'Giliranmu', title: 'Mutlak di kedua ruas', problem: 'Selesaikan $|x-2|<|x+4|$.', steps: [
      { t: 'Kuadratkan: $(x-2)^2<(x+4)^2$', hide: true, ask: 'Kenapa boleh dikuadratkan? Tulis bentuknya.' },
      { t: '$(x-2-x-4)(x-2+x+4)<0 \\Rightarrow (-6)(2x+2)<0$', hide: true, ask: 'Pakai selisih kuadrat.' },
      { t: 'Bagi $-6$ (balik tanda): $2x+2>0 \\Rightarrow x>-1$', hide: true, ask: 'Selesaikan.' },
      { t: 'Cek makna jarak: lebih dekat ke 2 daripada ke −4 → di kanan titik tengah −1 ✓' }], nl: '(-1,inf)' },
    { k: 'example', tag: 'Giliranmu', title: 'Ruas kanan bervariabel', problem: 'Selesaikan $|x-1|\\le2x$.', steps: [
      { t: 'Bentuk: $-2x\\le x-1\\le2x$', hide: true, ask: 'Tulis bentuk berantainya.' },
      { t: 'Kiri: $-2x\\le x-1 \\Rightarrow x\\ge\\frac13$. Kanan: $x-1\\le2x \\Rightarrow x\\ge-1$', hide: true, ask: 'Pecah dua (x ada di ketiga ruas).' },
      { t: 'Iris: $x\\ge\\frac13$', hide: true, ask: 'Iris keduanya.' }], nl: '[1/3,inf)' },
    { k: 'traps', ids: ['dekat-jauh', 'mutlak-negatif-kecil', 'mutlak-negatif-besar'] },
    { k: 'q', id: 's7-err', tag: 'Pemburu jebakan', title: 'Temukan langkah yang salah' },
    { k: 'practice' },
    { k: 'exit', qs: ['s7-l1-1', 's7-l2-1', 's7-l3-1'], prompt: 'Pakai kata "jarak" untuk menjelaskan kenapa |x − a| < r menghasilkan satu interval, sedangkan |x − a| > r menghasilkan dua.', points: ['|x − a| adalah jarak x ke a', '< r: titik yang dekat dengan a, satu ruas garis a − r sampai a + r', '> r: titik yang jauh, ke kiri atau ke kanan'] }
  ];

  /* ======================= BAGIAN 8 ======================= */
  C.LESSONS[8] = [
    { k: 'retrieval' },
    { k: 'q', id: 's8-pre', tag: 'Coba dulu', title: 'Tebak dulu' },
    { k: 'text', tag: 'Intuisi', title: 'Mesin pembesar dan mesin pengecil', html: `<p>Fungsi $y=2^x$ adalah <b>mesin pembesar</b>: makin besar input, makin besar output (fungsi naik). Jadi urutan dijaga: $2^a<2^b \\iff a<b$.</p>
<p>Fungsi $y=(\\frac12)^x$ adalah <b>mesin pengecil</b>: makin besar input, makin kecil output (fungsi turun). Urutan dibalik: $(\\frac12)^a<(\\frac12)^b \\iff a>b$.</p>
<p>Ini sama persis dengan Bagian 1: fungsi turun membalik urutan, seperti mengali bilangan negatif.</p>` },
    { k: 'widget', id: 'eksplog', title: 'Basis dan arah', tag: 'Eksperimen',
      predict: { q: 'Jika basis $a=0{,}5$, grafik $y=a^x$…', opts: ['naik', 'turun', 'datar'], ans: 1, after: 'Geser basisnya melewati angka 1 dan perhatikan grafiknya berubah arah.' } },
    { k: 'text', tag: 'Definisi formal', title: 'Aturannya', html: `<table class="tbl"><tr><th></th><th>$a>1$ (naik)</th><th>$0<a<1$ (turun)</th></tr>
<tr><td>$a^{f}>a^{g}$</td><td>$f>g$</td><td class="flip">$f<g$</td></tr>
<tr><td>$\\log_a f>\\log_a g$</td><td>$f>g>0$</td><td class="flip">$0<f<g$</td></tr></table>
<p><b>Syarat logaritma:</b> numerus (isi log) harus $>0$. Tulis ini paling awal.</p>
<p><b>Substitusi:</b> bentuk seperti $4^x-6\\cdot2^x+8<0$ menjadi kuadrat dengan $p=2^x$ (ingat $4^x=(2^x)^2$). Selesaikan untuk $p$, lalu kembalikan ke $x$, dan ingat $p=2^x$ selalu positif.</p>` },
    { k: 'example', tag: 'Contoh', title: 'Contoh lengkap', problem: 'Selesaikan $3^{2x-1}\\ge27$.', steps: [
      { t: 'Samakan basis: $27=3^3$, jadi $3^{2x-1}\\ge3^3$' },
      { t: 'Basis 3 > 1, tanda tetap: $2x-1\\ge3$' },
      { t: '$x\\ge2$' }], nl: '[2,inf)' },
    { k: 'example', tag: 'Giliranmu', title: 'Logaritma', problem: 'Selesaikan $\\log_2(x-1)<3$.', steps: [
      { t: 'Syarat numerus: $x-1>0 \\Rightarrow x>1$', hide: true, ask: 'Syarat apa yang ditulis dulu?' },
      { t: '$3=\\log_2 8$, basis 2 > 1: $x-1<8 \\Rightarrow x<9$', hide: true, ask: 'Ubah 3 menjadi log basis 2, lalu bandingkan.' },
      { t: 'Iris: $1<x<9$', hide: true, ask: 'Gabungkan.' }], nl: '(1,9)' },
    { k: 'example', tag: 'Giliranmu', title: 'Basis kurang dari 1', problem: 'Selesaikan $\\log_{\\frac12}(x+2)\\ge-1$.', steps: [
      { t: 'Syarat: $x+2>0 \\Rightarrow x>-2$' },
      { t: '$-1=\\log_{\\frac12}2$. Basis < 1, tanda dibalik: $x+2\\le2 \\Rightarrow x\\le0$', hide: true, ask: 'Ubah −1 ke log basis ½. Tanda tetap atau dibalik?' },
      { t: 'Iris: $-2<x\\le0$', hide: true, ask: 'Gabungkan.' }], nl: '(-2,0]' },
    { k: 'example', tag: 'Giliranmu', title: 'Substitusi', problem: 'Selesaikan $4^x-6\\cdot2^x+8<0$.', steps: [
      { t: 'Misalkan $p=2^x$: $p^2-6p+8<0 \\Rightarrow (p-2)(p-4)<0 \\Rightarrow 2<p<4$', hide: true, ask: 'Substitusi dan selesaikan untuk p.' },
      { t: '$2<2^x<4 \\Rightarrow 2^1<2^x<2^2 \\Rightarrow 1<x<2$', hide: true, ask: 'Kembalikan ke x.' }], nl: '(1,2)' },
    { k: 'traps', ids: ['basis-kecil', 'syarat-numerus'] },
    { k: 'q', id: 's8-err', tag: 'Pemburu jebakan', title: 'Temukan langkah yang salah' },
    { k: 'practice' },
    { k: 'exit', qs: ['s8-l1-1', 's8-l2-1', 's8-l3-1'], prompt: 'Apa hubungan antara "basis antara 0 dan 1" dan "mengali dengan bilangan negatif" di Bagian 1?', points: ['Keduanya membalik urutan', 'Fungsi (½)^x turun', 'Fungsi naik menjaga urutan, fungsi turun membaliknya'] }
  ];

  /* ======================= BAGIAN 9 ======================= */
  C.LESSONS[9] = [
    { k: 'retrieval' },
    { k: 'q', id: 's9-pre', tag: 'Coba dulu', title: 'Tebak dulu' },
    { k: 'text', tag: 'Intuisi', title: 'Satpam-satpam di bidang koordinat', html: `<p>Pertidaksamaan dua variabel seperti $2x+3y\\le12$ bukan lagi daerah di <b>garis</b>, melainkan daerah di <b>bidang</b>.</p>
<p>Garis $2x+3y=12$ membelah bidang menjadi dua sisi. Satu sisi "boleh", satu sisi "dilarang". Anggap setiap pertidaksamaan adalah seorang <b>satpam</b> yang menjaga satu garis.</p>
<p><b>Sistem</b> pertidaksamaan = beberapa satpam sekaligus. Daerah penyelesaiannya adalah tempat yang lolos dari <b>semua</b> satpam: irisan semua daerah "boleh".</p>` },
    { k: 'widget', id: 'sptldv', title: 'Daerah penyelesaian', tag: 'Eksperimen',
      predict: { q: 'Untuk $x+y\\le4$, apakah titik $(0,0)$ termasuk daerah penyelesaian?', opts: ['Ya', 'Tidak'], ans: 0, after: 'Ubah tanda tiap pertidaksamaan dan seret titik uji. Daerah yang lolos semua aturan menyala.' } },
    { k: 'text', tag: 'Definisi formal', title: 'Langkah menggambar', html: `<ol class="steps"><li><b>Gambar garis batas</b> $ax+by=c$. Cara cepat: titik potong sumbu, $x=0 \\Rightarrow y=\\frac cb$ dan $y=0 \\Rightarrow x=\\frac ca$.</li>
<li><b>Jenis garis:</b> $\\le$ atau $\\ge$ → garis tegas; $<$ atau $>$ → garis putus-putus.</li>
<li><b>Uji titik</b> yang tidak di garis, biasanya $(0,0)$. Kalau memenuhi, sisi yang memuat titik itu adalah daerah "boleh".</li>
<li>Ulangi untuk semua pertidaksamaan. Daerah penyelesaian = <b>irisan</b>.</li></ol>
<p class="tip">Perhatikan konvensi bukumu! Sebagian buku mengarsir daerah penyelesaian, sebagian lagi mengarsir daerah yang <b>bukan</b> penyelesaian (daerah bersih = jawaban). Baca petunjuk soal.</p>` },
    { k: 'text', tag: 'Trik', title: 'Membuat pertidaksamaan dari gambar', html: `<p>Garis yang memotong sumbu-x di $(a,0)$ dan sumbu-y di $(0,b)$ punya persamaan $$bx+ay=ab$$</p>
<p>Contoh: memotong di $(4,0)$ dan $(0,2)$: $2x+4y=8$, disederhanakan $x+2y=4$. Kalau daerahnya memuat $(0,0)$: $0\\le4$ benar, jadi $x+2y\\le4$.</p>` },
    { k: 'example', tag: 'Contoh', title: 'Soal cerita ke model', problem: 'Toko kue membuat kue A (2 kg tepung, 1 kg gula) dan kue B (1 kg tepung, 3 kg gula). Tersedia tepung 10 kg dan gula 15 kg. Tulis modelnya.', steps: [
      { t: 'Misalkan $x$ = banyak kue A, $y$ = banyak kue B' },
      { t: 'Tepung: $2x+y\\le10$. Gula: $x+3y\\le15$' },
      { t: 'Tidak mungkin negatif: $x\\ge0$, $y\\ge0$ (dan bulat)' }] },
    { k: 'example', tag: 'Giliranmu', title: 'Titik pojok', problem: 'Tentukan titik-titik pojok daerah $x+y\\le4$, $2x+y\\le6$, $x\\ge0$, $y\\ge0$.', steps: [
      { t: 'Pojok di sumbu: $(0,0)$, $(3,0)$ dari $2x+y=6$, $(0,4)$ dari $x+y=4$', hide: true, ask: 'Mana titik potong garis dengan sumbu yang masih di dalam daerah?' },
      { t: 'Perpotongan $x+y=4$ dan $2x+y=6$: kurangkan → $x=2$, $y=2$', hide: true, ask: 'Cari perpotongan kedua garis.' },
      { t: 'Titik pojok: $(0,0), (3,0), (2,2), (0,4)$. Di program linear (kelas XI), nilai maksimum/minimum selalu ada di titik pojok.' }] },
    { k: 'traps', ids: ['garis-putus', 'arsir-salah'] },
    { k: 'q', id: 's9-err', tag: 'Pemburu jebakan', title: 'Temukan langkah yang salah' },
    { k: 'practice' },
    { k: 'exit', qs: ['s9-l1-1', 's9-l2-1', 's9-l3-1'], prompt: 'Jelaskan langkah menentukan sisi mana yang menjadi daerah penyelesaian 3x − 2y < 6.', points: ['Gambar garis 3x − 2y = 6 putus-putus', 'Uji titik (0,0): 0 < 6 benar', 'Daerah yang memuat (0,0) adalah daerah penyelesaian'] }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
