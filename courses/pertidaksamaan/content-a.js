/* Batas — konten bagian A: peta, katalog jebakan, prasyarat, Bagian 0 */
(function (G) {
  'use strict';
  const C = G.BC = G.BC || {};

  /* ---------------- Peta bagian ---------------- */
  C.SECTIONS = [
    { id: 1, short: 'Konsep & sifat', title: 'Konsep dasar, sifat, dan notasi interval', jalur: 'sekolah', glyph: 'a<b', concepts: ['sifat-dasar', 'notasi-interval'] },
    { id: 2, short: 'Linear', title: 'Pertidaksamaan linear dan bentuk berantai', jalur: 'sekolah', glyph: 'ax+b', concepts: ['linear', 'berantai', 'soal-cerita'] },
    { id: 3, short: 'Kuadrat', title: 'Pertidaksamaan kuadrat', jalur: 'sekolah', glyph: 'x²', concepts: ['kuadrat', 'diskriminan', 'parameter'] },
    { id: 4, short: 'Polinomial', title: 'Pertidaksamaan polinomial (derajat tinggi)', jalur: 'ujian', glyph: 'x³', concepts: ['polinomial', 'tabel-tanda'] },
    { id: 5, short: 'Rasional', title: 'Pertidaksamaan rasional (pecahan)', jalur: 'ujian', glyph: 'p/q', concepts: ['rasional', 'syarat-penyebut'] },
    { id: 6, short: 'Irasional', title: 'Pertidaksamaan irasional (bentuk akar)', jalur: 'ujian', glyph: '√', concepts: ['irasional', 'syarat-akar'] },
    { id: 7, short: 'Nilai mutlak', title: 'Pertidaksamaan nilai mutlak', jalur: 'ujian', glyph: '|x|', concepts: ['mutlak'] },
    { id: 8, short: 'Eksponen & log', title: 'Pertidaksamaan eksponen dan logaritma', jalur: 'campuran', glyph: 'aˣ', concepts: ['eksponen', 'logaritma'] },
    { id: 9, short: 'SPtLDV', title: 'Sistem pertidaksamaan linear dua variabel', jalur: 'sekolah', glyph: 'x,y', concepts: ['sptldv'] }
  ];

  C.CONCEPTS = {
    'tanda': 'Aturan tanda (+/−)', 'urutan': 'Urutan bilangan real', 'aljabar': 'Operasi aljabar', 'faktor': 'Pemfaktoran',
    'persamaan': 'Persamaan linear & kuadrat', 'pecahan-aljabar': 'Pecahan aljabar', 'interval-ops': 'Interval, irisan, gabungan',
    'grafik': 'Grafik garis & parabola', 'akar-mutlak': 'Akar & |x|', 'eksp-log-dasar': 'Sifat eksponen & log',
    'sifat-dasar': 'Sifat pertidaksamaan', 'notasi-interval': 'Notasi interval', 'linear': 'Linear satu variabel', 'berantai': 'Bentuk berantai',
    'soal-cerita': 'Soal cerita / model', 'kuadrat': 'Kuadrat', 'diskriminan': 'Diskriminan & definit', 'parameter': 'Soal parameter',
    'polinomial': 'Polinomial', 'tabel-tanda': 'Tabel tanda', 'rasional': 'Rasional', 'syarat-penyebut': 'Syarat penyebut',
    'irasional': 'Irasional', 'syarat-akar': 'Syarat isi akar', 'mutlak': 'Nilai mutlak', 'eksponen': 'Eksponen', 'logaritma': 'Logaritma', 'sptldv': 'SPtLDV'
  };

  /* ---------------- Katalog jebakan ---------------- */
  C.TRAPS = {
    'balik-tanda': { name: 'Lupa membalik tanda', sec: 1, wrong: '$-2x<6 \\Rightarrow x<-3$', right: '$-2x<6 \\Rightarrow x>-3$', tip: 'Setiap kali mengali atau membagi dengan bilangan negatif, lingkari tandanya dan balik saat itu juga.' },
    'kali-variabel': { name: 'Mengali/membagi dengan variabel', sec: 1, wrong: '$\\frac{1}{x}<2 \\Rightarrow 1<2x$', right: 'Pindahkan ruas: $\\frac{1}{x}-2<0 \\Rightarrow \\frac{1-2x}{x}<0$', tip: 'Tanda $x$ belum diketahui, jadi kamu tidak tahu harus membalik tanda atau tidak. Jangan kalikan/bagi dengan ekspresi bervariabel.' },
    'kuadrat-dua-ruas': { name: 'Mengkuadratkan dua ruas sembarangan', sec: 1, wrong: '$-3<2 \\Rightarrow 9<4$', right: 'Kuadratkan hanya jika kedua ruas pasti $\\ge 0$', tip: 'Mengkuadratkan aman hanya kalau kedua ruas tak negatif.' },
    'balik-pecahan': { name: 'Membalik pecahan sembarangan', sec: 1, wrong: '$-2<3 \\Rightarrow -\\frac12<\\frac13$… lalu tanda dibalik jadi $>$', right: '$a<b \\Rightarrow \\frac1a>\\frac1b$ hanya jika $a$ dan $b$ bertanda sama', tip: 'Cek dulu tanda kedua ruas sebelum membalik pecahan.' },
    'siku-tak-hingga': { name: 'Kurung siku pada ∞', sec: 1, wrong: '$[3,\\infty]$', right: '$[3,\\infty)$', tip: '∞ bukan bilangan; tidak bisa "termasuk". Selalu kurung biasa.' },
    'dan-atau': { name: 'Tertukar "dan" dengan "atau"', sec: 1, wrong: '$x<-2$ atau $x>3$ ditulis $3<x<-2$', right: 'Dua daerah terpisah ditulis dengan "atau" (gabungan ∪)', tip: 'Bentuk $a<x<b$ artinya "dan" (satu ruas garis). Tidak mungkin $x$ lebih dari 3 dan kurang dari −2 sekaligus.' },
    'titik-ujung': { name: 'Bulat penuh vs kosong tertukar', sec: 1, wrong: '$x>3$ digambar bulat penuh di 3', right: '$>$ atau $<$: bulat kosong; $\\ge$ atau $\\le$: bulat penuh', tip: 'Tanya: "Apakah titik ujung ini sendiri memenuhi?" Masukkan ke soal asli.' },
    'arah-daerah': { name: 'Arah daerah terbalik', sec: 3, wrong: '$x^2>9 \\Rightarrow -3<x<3$', right: '$x^2>9 \\Rightarrow x<-3$ atau $x>3$', tip: 'Selalu uji satu titik, misalnya $x=0$, lalu cocokkan.' },
    'terjemah-cerita': { name: 'Salah menerjemahkan kalimat', sec: 2, wrong: '"paling sedikit 5" ditulis $x<5$', right: '"paling sedikit 5" berarti $x\\ge 5$', tip: '"paling sedikit/minimal/tidak kurang dari" = ≥; "paling banyak/maksimal/tidak lebih dari" = ≤.' },
    'berantai-sebagian': { name: 'Bentuk berantai diolah sebagian', sec: 2, wrong: '$-1<2x+3<7 \\Rightarrow -1<2x<4$', right: '$-1-3<2x<7-3 \\Rightarrow -4<2x<4$', tip: 'Operasi apa pun dilakukan ke ketiga ruas sekaligus.' },
    'distribusi-negatif': { name: 'Salah distribusi tanda negatif', sec: 2, wrong: '$5-2(x-3)=5-2x-6$', right: '$5-2(x-3)=5-2x+6$', tip: '$-2\\cdot(-3)=+6$. Tulis langkah distribusinya, jangan di kepala.' },
    'lupa-akar-negatif': { name: 'Lupa akar negatif', sec: 3, wrong: '$x^2>9 \\Rightarrow x>3$', right: '$x^2>9 \\Rightarrow x<-3$ atau $x>3$', tip: '$(-4)^2=16>9$. Bilangan negatif juga punya kuadrat besar.' },
    'plusminus': { name: 'Menulis $x<\\pm3$', sec: 3, wrong: '$x^2<9 \\Rightarrow x<\\pm 3$', right: '$x^2<9 \\Rightarrow -3<x<3$', tip: 'Tanda ± di pertidaksamaan tidak punya arti tunggal. Selalu tulis daerahnya.' },
    'bagi-x': { name: 'Membagi kedua ruas dengan $x$', sec: 3, wrong: '$x^2<3x \\Rightarrow x<3$', right: '$x^2-3x<0 \\Rightarrow 0<x<3$', tip: 'Membagi dengan $x$ = membagi dengan sesuatu yang tandanya belum diketahui (dan bisa nol).' },
    'a-negatif': { name: 'Koefisien $x^2$ negatif', sec: 3, wrong: '$-x^2+4>0$ dianggap seperti $x^2-4>0$', right: 'Kali $-1$ dulu dan balik tanda: $x^2-4<0$', tip: 'Biasakan membuat koefisien $x^2$ positif dulu, sambil membalik tanda.' },
    'd-negatif': { name: 'D < 0 dianggap "tidak ada solusi"', sec: 3, wrong: '$x^2+x+1>0 \\Rightarrow$ tidak ada solusi', right: '$x^2+x+1>0$ berlaku untuk semua $x$ real', tip: 'Parabola tidak menyentuh sumbu-x: seluruhnya di atas (a>0) atau seluruhnya di bawah (a<0).' },
    'tanda-akar-genap': { name: 'Tanda dianggap selalu berganti', sec: 4, wrong: 'Tanda selalu berselang-seling di setiap akar', right: 'Di akar berpangkat genap, tanda TIDAK berganti', tip: 'Faktor $(x-r)^2$ selalu ≥ 0, jadi tidak mengubah tanda.' },
    'kuadrat-sempurna': { name: 'Kasus kuadrat sempurna', sec: 4, wrong: '$(x-2)^2>0$ dianggap semua $x$', right: '$(x-2)^2>0 \\Rightarrow x\\ne 2$', tip: 'Kuadrat bernilai 0 tepat di satu titik. Periksa titik itu.' },
    'kali-silang': { name: 'Kali silang pada pertidaksamaan', sec: 5, wrong: '$\\frac{x+1}{x-2}>1 \\Rightarrow x+1>x-2$', right: '$\\frac{x+1}{x-2}-1>0 \\Rightarrow \\frac{3}{x-2}>0$', tip: 'Penyebut bisa negatif. Pindahkan semua ke satu ruas, jangan kali silang.' },
    'penyebut-tertutup': { name: 'Pembuat nol penyebut ditutup', sec: 5, wrong: '$\\frac{x-3}{x+1}\\le0 \\Rightarrow -1\\le x\\le3$', right: '$-1<x\\le3$', tip: 'Penyebut tidak boleh nol: titiknya selalu bulat kosong walau tandanya ≤ atau ≥.' },
    'coret-faktor': { name: 'Mencoret faktor tanpa mencatat syarat', sec: 5, wrong: '$\\frac{(x-1)(x+2)}{x-1}\\ge0 \\Rightarrow x\\ge-2$', right: '$x\\ge-2$ dan $x\\ne1$', tip: 'Sebelum mencoret, tulis dulu syarat penyebut ≠ 0.' },
    'syarat-akar': { name: 'Lupa syarat isi akar', sec: 6, wrong: '$\\sqrt{x-3}<2 \\Rightarrow x<7$', right: '$3\\le x<7$', tip: 'Langkah pertama soal akar: tulis syarat isi akar ≥ 0.' },
    'kuadrat-ruas-negatif': { name: 'Mengkuadratkan saat ruas kanan bisa negatif', sec: 6, wrong: '$\\sqrt{x+2}>x \\Rightarrow x+2>x^2$ saja', right: 'Pecah kasus: ruas kanan negatif, dan ruas kanan ≥ 0', tip: 'Akar selalu ≥ 0, jadi kalau ruas kanan negatif, $\\sqrt{f}>g$ otomatis benar.' },
    'mutlak-negatif-kecil': { name: '|f| < bilangan negatif', sec: 7, wrong: '$|x-1|<-2 \\Rightarrow -(-2)<x-1<-2$ …', right: 'Tidak ada solusi (∅)', tip: 'Nilai mutlak tidak pernah negatif, apalagi lebih kecil dari bilangan negatif.' },
    'mutlak-negatif-besar': { name: '|f| > bilangan negatif', sec: 7, wrong: '$|x-1|>-2$ diselesaikan panjang', right: 'Semua bilangan real', tip: 'Nilai mutlak ≥ 0 > −2, selalu benar.' },
    'dekat-jauh': { name: 'Arah "dekat" dan "jauh" tertukar', sec: 7, wrong: '$|x|>3 \\Rightarrow -3<x<3$', right: '$|x|>3 \\Rightarrow x<-3$ atau $x>3$', tip: '< artinya dekat (satu ruas garis); > artinya jauh (dua arah).' },
    'basis-kecil': { name: 'Basis 0–1 tidak membalik tanda', sec: 8, wrong: '$(\\frac12)^x>(\\frac12)^3 \\Rightarrow x>3$', right: '$x<3$', tip: 'Basis antara 0 dan 1 = mesin pengecil, urutannya terbalik.' },
    'syarat-numerus': { name: 'Lupa syarat numerus log', sec: 8, wrong: '$\\log_2(x-1)<3 \\Rightarrow x<9$', right: '$1<x<9$', tip: 'Isi log (numerus) harus > 0. Tulis syarat ini paling awal.' },
    'garis-putus': { name: 'Garis putus-putus vs tegas', sec: 9, wrong: '$x+y<4$ digambar garis tegas', right: '< atau >: putus-putus; ≤ atau ≥: tegas', tip: 'Garis tegas berarti titik di garis ikut memenuhi.' },
    'arsir-salah': { name: 'Arsiran salah sisi', sec: 9, wrong: 'Menebak sisi dari arah tanda saja', right: 'Uji satu titik (misalnya (0,0)) yang tidak di garis', tip: 'Tanda "<" tidak selalu berarti "di bawah garis", terutama jika koefisien $y$ negatif.' },
    'aritmetika': { name: 'Salah hitung / salah salin tanda', sec: 0, wrong: '$-3-5=2$', right: '$-3-5=-8$', tip: 'Lakukan uji balik: masukkan satu titik dari jawabanmu ke soal asli.' }
  };

  /* ---------------- Prasyarat ---------------- */
  C.PREREQ = [
    { id: 'P1', title: 'Garis bilangan & urutan', concept: 'urutan',
      why: 'Jawaban pertidaksamaan adalah <b>daerah</b> di garis bilangan. Kalau urutan bilangan negatif masih ragu, semua langkah berikutnya goyah.',
      html: `<p>Bayangkan garis bilangan sebagai termometer yang direbahkan. Makin ke <b>kanan</b>, makin besar. Makin ke kiri, makin kecil, termasuk bilangan negatif.</p>
<p>Jadi $-7<-3$ karena $-7$ ada di sebelah kiri $-3$. Suhu −7°C lebih dingin daripada −3°C.</p>
<p class="tip">Trik cepat: dari dua bilangan negatif, yang "angkanya" lebih besar justru lebih kecil. $-10<-2$.</p>` },
    { id: 'P2', title: 'Aturan tanda', concept: 'tanda',
      why: 'Metode garis bilangan (yang dipakai di hampir semua bab) hanya menghitung tanda: positif atau negatif.',
      html: `<p>Perkalian dan pembagian punya aturan tanda yang sama:</p>
<ul><li>$(+)\\cdot(+)=+$ dan $(-)\\cdot(-)=+$ (tanda sama, hasil positif)</li><li>$(+)\\cdot(-)=-$ (tanda beda, hasil negatif)</li></ul>
<p>Untuk banyak faktor: <b>hitung saja ada berapa faktor negatif</b>. Genap → positif. Ganjil → negatif. Kalau ada faktor nol, hasilnya nol.</p>
<p class="tip">Contoh: $(-2)(3)(-1)(-5)$ punya 3 faktor negatif (ganjil), jadi hasilnya negatif.</p>` },
    { id: 'P3', title: 'Aljabar & distributif', concept: 'aljabar',
      why: 'Sebelum menyelesaikan, kita harus bisa merapikan kedua ruas tanpa salah tanda.',
      html: `<p>Distributif: $a(b+c)=ab+ac$. Yang paling sering salah adalah tanda <b>negatif di depan kurung</b>:</p>
$$5-2(x-3)=5-2x+6=11-2x$$
<p>Karena $-2\\cdot(-3)=+6$. Anggap tanda minus "menempel" pada angka 2 dan ikut dikalikan ke semua isi kurung.</p>` },
    { id: 'P4', title: 'Pemfaktoran', concept: 'faktor',
      why: 'Titik-titik batas pertidaksamaan kuadrat dan polinomial didapat dari faktor.',
      html: `<p>Memfaktorkan $x^2+bx+c$ artinya mencari dua bilangan yang <b>dikali = c</b> dan <b>dijumlah = b</b>.</p>
<p>Contoh: $x^2-5x+6$: dikali 6, dijumlah −5 → $-2$ dan $-3$. Jadi $x^2-5x+6=(x-2)(x-3)$.</p>
<p>Bentuk khusus: selisih kuadrat $a^2-b^2=(a-b)(a+b)$, misalnya $x^2-9=(x-3)(x+3)$.</p>
<p class="tip">Cek dengan mengalikan balik. Kalau koefisien $x^2$ bukan 1, misalnya $2x^2-x-3$, cari dua bilangan yang dikali $2\\cdot(-3)=-6$ dan dijumlah $-1$: yaitu $-3$ dan $2$. Hasilnya $(2x-3)(x+1)$.</p>` },
    { id: 'P5', title: 'Persamaan linear & kuadrat', concept: 'persamaan',
      why: 'Titik batas pertidaksamaan = akar persamaannya. Pertidaksamaan "dimulai" dari persamaan.',
      html: `<p>Linear: isolasi $x$. $3x-7=8 \\Rightarrow 3x=15 \\Rightarrow x=5$.</p>
<p>Kuadrat $ax^2+bx+c=0$: faktorkan, atau pakai rumus abc $$x=\\frac{-b\\pm\\sqrt{D}}{2a},\\quad D=b^2-4ac$$</p>
<p>Diskriminan $D$ memberi tahu banyaknya akar: $D>0$ dua akar, $D=0$ satu akar (kembar), $D<0$ tidak ada akar real.</p>` },
    { id: 'P6', title: 'Pecahan aljabar', concept: 'pecahan-aljabar',
      why: 'Pertidaksamaan rasional mengharuskan kita menggabung pecahan menjadi satu.',
      html: `<p>Menjumlah pecahan aljabar sama seperti pecahan biasa: <b>samakan penyebut</b>.</p>
$$\\frac{1}{x}-\\frac{2}{x+1}=\\frac{(x+1)-2x}{x(x+1)}=\\frac{1-x}{x(x+1)}$$
<p class="tip">Kurung itu penting! $-(2x)$ bukan masalah, tapi $-(x-2)$ harus jadi $-x+2$.</p>` },
    { id: 'P7', title: 'Interval, irisan, gabungan', concept: 'interval-ops',
      why: 'Jawaban akhir ditulis sebagai interval, dan banyak soal butuh irisan (dan) atau gabungan (atau).',
      html: `<p><b>Irisan</b> (∩, "dan"): bagian yang memenuhi keduanya. <b>Gabungan</b> (∪, "atau"): bagian yang memenuhi salah satu saja sudah cukup.</p>
<p>Contoh: $(-\\infty,3]\\cap(1,5)=(1,3]$. Gambar dua daerah di garis bilangan, lalu ambil yang tumpang tindih.</p>
<p class="tip">Kurung siku [ ] = ujung termasuk. Kurung biasa ( ) = tidak termasuk. Ujung ∞ selalu kurung biasa.</p>` },
    { id: 'P8', title: 'Grafik garis & parabola', concept: 'grafik',
      why: 'Grafik membuat pertidaksamaan bisa "dilihat": f(x) > 0 artinya grafik di atas sumbu-x.',
      html: `<p>Parabola $y=ax^2+bx+c$: terbuka ke <b>atas</b> jika $a>0$ (lembah), ke <b>bawah</b> jika $a<0$ (bukit). Memotong sumbu-y di $(0,c)$. Memotong sumbu-x di akar-akarnya.</p>
<p>Garis $y=mx+n$: naik jika $m>0$, turun jika $m<0$.</p>` },
    { id: 'P9', title: 'Akar & nilai mutlak', concept: 'akar-mutlak',
      why: 'Bab irasional dan nilai mutlak bergantung pada sifat ini, terutama $\\sqrt{x^2}=|x|$.',
      html: `<p>$\\sqrt{a}$ selalu bernilai <b>tak negatif</b>, dan hanya terdefinisi untuk $a\\ge0$. Jadi $\\sqrt{9}=3$, bukan $\\pm3$.</p>
<p>Akibatnya $\\sqrt{x^2}=|x|$, bukan $x$. Contoh: $\\sqrt{(-5)^2}=\\sqrt{25}=5=|-5|$.</p>
<p>$|a|$ = jarak $a$ ke 0, selalu ≥ 0. $|a-b|$ = jarak antara $a$ dan $b$.</p>` },
    { id: 'P10', title: 'Sifat eksponen & logaritma', concept: 'eksp-log-dasar',
      why: 'Dibutuhkan di Bagian 8. Kalau sekolahmu belum sampai sini, boleh dilewati dulu.',
      html: `<p>$a^m\\cdot a^n=a^{m+n}$, $\\frac{a^m}{a^n}=a^{m-n}$, $(a^m)^n=a^{mn}$, $a^{-n}=\\frac{1}{a^n}$, $a^0=1$.</p>
<p>Logaritma adalah kebalikan eksponen: $\\log_a b=c \\iff a^c=b$. Contoh $\\log_2 8=3$ karena $2^3=8$.</p>
<p>Syarat: basis $a>0$, $a\\ne1$, dan numerus $b>0$.</p>` }
  ];

  /* ---------------- Bagian 0 ---------------- */
  C.INTRO = [
    { k: 'text', tag: 'Mulai di sini', title: 'Dunia jarang bertanya "berapa tepatnya?"', html: `<p>Persamaan menjawab pertanyaan "berapa <b>tepatnya</b>?" Jawabannya biasanya satu titik: $x=4$.</p>
<p>Tapi hidup lebih sering bertanya "berapa <b>batasnya</b>?" Berapa paling banyak yang bisa kubeli? Berapa paling sedikit nilai yang kubutuhkan? Sampai jarak berapa tarif ini lebih murah? Jawabannya bukan satu titik, melainkan <b>satu wilayah</b> yang aman.</p>
<p>Itulah pertidaksamaan: <b>matematika tentang batas</b>. Makanya web ini bernama Batas.</p>` },
    { k: 'widget', id: 'jajan', title: 'Coba dulu: uang jajan seminggu', tag: 'Eksperimen',
      predict: { q: 'Uang jajan Rp50.000 seminggu. Satu gelas es kopi Rp12.000. Paling banyak berapa gelas yang bisa dibeli?', opts: ['3 gelas', '4 gelas', '5 gelas'], ans: 1, after: 'Geser slider di bawah dan lihat kapan uangmu "jebol".' } },
    { k: 'text', tag: 'Intuisi', title: 'Persamaan vs pertidaksamaan', html: `<p>Kalau ditulis matematis, masalah tadi adalah $12.000\\,x\\le 50.000$. Hasilnya $x\\le 4{,}16\\ldots$, dan karena gelas harus bulat, paling banyak <b>4 gelas</b>.</p>
<p>Perhatikan: jawabannya bukan "4", melainkan "0, 1, 2, 3, atau 4". Semua itu aman. Pertidaksamaan memberi kita <b>daftar semua pilihan yang aman</b>, bukan satu jawaban.</p>
<div class="pair"><div><b>Persamaan</b><br>$2x+1=7$<br>jawaban: satu titik, $x=3$</div><div><b>Pertidaksamaan</b><br>$2x+1<7$<br>jawaban: satu wilayah, $x<3$</div></div>` },
    { k: 'widget', id: 'ojol', title: 'Ojol A atau ojol B?', tag: 'Eksperimen',
      predict: { q: 'Ojol A: Rp8.000 + Rp2.500/km. Ojol B: Rp5.000 + Rp3.000/km. Mana yang lebih murah untuk perjalanan jauh?', opts: ['A', 'B', 'Selalu sama'], ans: 0, after: 'Geser jaraknya. Perhatikan titik di mana kedua garis berpotongan: di situlah batasnya.' } },
    { k: 'text', tag: 'Dunia nyata', title: 'Di mana saja pertidaksamaan muncul?', html: `<div class="realgrid">
<div><b>Nilai rapor</b><p>"Nilai UAS minimal berapa supaya rata-rataku ≥ 75?"</p></div>
<div><b>Dosis obat</b><p>Harus di atas dosis efektif dan di bawah dosis berbahaya: $a<\\text{dosis}<b$.</p></div>
<div><b>Toleransi pabrik</b><p>Baut 10 mm boleh meleset 0,05 mm: $|x-10|\\le0{,}05$. Ini nilai mutlak!</p></div>
<div><b>Bisnis</b><p>Untung maksimal dengan bahan dan waktu terbatas: sistem pertidaksamaan, lalu program linear.</p></div>
<div><b>Teknologi</b><p>Kapasitas server, batas kecepatan, sampai batasan (constraint) di algoritma AI.</p></div>
<div><b>Ujian masuk PT</b><p>Muncul di UTBK (Pengetahuan Kuantitatif dan Penalaran Matematika) dan ujian mandiri.</p></div></div>` },
    { k: 'text', tag: 'Cara belajar di sini', title: 'Kenapa web ini terasa "berbeda"', html: `<ul class="howlist">
<li><b>Coba dulu sebelum diajari.</b> Setiap bagian dibuka dengan soal yang belum kamu pelajari. Salah itu wajar dan justru membuat penjelasan sesudahnya lebih nempel.</li>
<li><b>Tebak dulu, baru geser.</b> Di setiap widget, tebak hasilnya dulu.</li>
<li><b>Mengingat lebih ampuh daripada membaca ulang.</b> Review harian mencampur soal lama. Rasanya lebih berat, tapi itu tanda otakmu sedang menguatkan ingatan.</li>
<li><b>Jujur soal keyakinan.</b> Setelah menjawab, pilih "menebak / agak yakin / yakin". Soal yang salah padahal yakin akan dimunculkan lagi lebih cepat.</li>
<li><b>Sedikit tapi rutin.</b> 20 menit sehari jauh lebih ampuh daripada 3 jam sekali seminggu.</li></ul>` },
    { k: 'text', tag: 'Langkah berikutnya', title: 'Cek dulu fondasimu', html: `<p>Sebelum masuk materi, ada <b>tes diagnostik</b> singkat (15 soal, sekitar 10 menit). Hasilnya menentukan prasyarat mana yang perlu kamu latih dan mana yang boleh dilewati. Tidak ada nilai, ini hanya peta.</p>` }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
