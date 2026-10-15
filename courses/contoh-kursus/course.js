/* Example course: "Persen dalam 15 menit" (percentages in 15 minutes).
   This small course deliberately uses EVERY block and question type the platform supports,
   so it can be copied as the starting point for a new course. Guide: docs/ADDING-COURSES.md
   (Course content is in Indonesian because the learners are Indonesian.)

   All data is written to the object `C` (= window.BC, the course being loaded).
   Fields recognized by the UI:
     SECTIONS, LESSONS, BANK, CARDS, TRAPS, CONCEPTS, RES, RES_GENERAL, GEN, GEN_BY_SEC,
     INTRO, PREREQ, GEN_BY_PRE, CHECK, SUMMARY, DECISION, INFO, WIDGETS
   Only SECTIONS, LESSONS, and BANK are required. */
(function (G) {
  'use strict';
  const C = G.BC;
  const B = G.BM; // math utilities: B.esc, B.rich (renders $…$), B.numberLine, etc.

  C.INFO = { introTitle: 'Pengantar', tips: 'Kursus contoh: lihat kodenya di courses/contoh-kursus/course.js' };

  /* 1. Section map. concepts feed the mastery map. jalur (track) is optional. */
  C.SECTIONS = [
    { id: 1, short: 'Arti persen', title: 'Persen = per seratus', glyph: '%', concepts: ['arti-persen'] },
    { id: 2, short: 'Naik & turun', title: 'Kenaikan, penurunan, dan diskon bertingkat', glyph: '±%', concepts: ['perubahan-persen'] }
  ];
  C.CONCEPTS = { 'arti-persen': 'Arti persen', 'perubahan-persen': 'Perubahan persen' };

  /* 2. Trap catalog: shown as a "radar" on questions that share the trap. */
  C.TRAPS = {
    'naik-turun': { name: 'Naik p% lalu turun p% dianggap kembali semula', sec: 2, wrong: 'Naik 50% lalu turun 50% → kembali ke 100', right: '$100\\to150\\to75$', tip: 'Persen kedua dihitung dari nilai yang <b>baru</b>, bukan dari nilai awal.' },
    'diskon-jumlah': { name: 'Diskon bertingkat dijumlahkan', sec: 2, wrong: 'Diskon 30% + 20% = 50%', right: 'Sisa harga $0{,}7\\times0{,}8=0{,}56$, jadi diskon total 44%', tip: 'Diskon bertingkat dikalikan (sisanya), bukan dijumlahkan.' },
    'basis-persen': { name: 'Salah memilih "dari" (basis)', sec: 1, wrong: 'Harga setelah diskon 25% = 150 → semula $150\\times1{,}25$', right: 'Semula $=150\\div0{,}75=200$', tip: 'Tanyakan: persen ini dihitung <b>dari</b> angka yang mana?' }
  };

  /* 3. Question bank. Types: mc, num, interval, tf, err, order. lvl 1–6. mode: sekolah/utbk/mandiri/olimpiade (school/UTBK/entrance/olympiad). */
  const Q = (o) => { o.mode = o.mode || ['sekolah']; C.BANK[o.id] = o; };
  C.BANK = {};
  Q({ id: 'p1-1', sec: 1, lvl: 1, type: 'num', concepts: ['arti-persen'], q: 'Berapa $15\\%$ dari $60$?', ans: 9, sol: '$\\frac{15}{100}\\times60=9$.' });
  Q({ id: 'p1-2', sec: 1, lvl: 2, type: 'mc', concepts: ['arti-persen'], q: '$0{,}5\\%$ sama dengan…', opts: [
    { t: '$0{,}005$', ok: true }, { t: '$0{,}05$', why: 'Itu $5\\%$.' }, { t: '$0{,}5$', why: 'Itu $50\\%$.' }, { t: '$5$', why: 'Itu $500\\%$.' }], sol: 'Bagi 100: $0{,}5\\div100=0{,}005$.' });
  Q({ id: 'p1-3', sec: 1, lvl: 3, type: 'num', unit: '%', concepts: ['arti-persen'], q: '$12$ adalah berapa persen dari $48$?', ans: 25, wrong: [{ v: 400, why: 'Terbalik: itu $48$ dibanding $12$.', trap: 'basis-persen' }], sol: '$\\frac{12}{48}=\\frac14=25\\%$.' });
  Q({ id: 'p1-4', sec: 1, lvl: 2, type: 'tf', concepts: ['arti-persen'], q: 'Tentukan benar atau salah:', stmts: [
    { t: '$200\\%$ dari $30$ adalah $60$.', v: true, why: '$2\\times30=60$.' },
    { t: '$x\\%$ dari $y$ sama dengan $y\\%$ dari $x$.', v: true, why: 'Keduanya $\\frac{xy}{100}$. Trik hitung cepat: $8\\%$ dari $50$ = $50\\%$ dari $8$ = 4.' },
    { t: 'Persen tidak boleh lebih dari 100.', v: false, why: 'Boleh, misalnya kenaikan $150\\%$.' }] });
  Q({ id: 'p1-5', sec: 1, lvl: 3, type: 'interval', v: 'x', concepts: ['arti-persen'], q: 'Harga barang Rp80.000 diberi diskon $x\\%$ ($0\\le x\\le100$). Agar harga akhirnya <b>kurang dari</b> Rp60.000, nilai $x$ yang mungkin adalah…', ans: '(25,100]', sol: '$80\\,000(1-\\frac{x}{100})<60\\,000 \\Rightarrow 1-\\frac x{100}<\\frac34 \\Rightarrow x>25$. Digabung dengan $x\\le100$: $(25,100]$.' });
  Q({ id: 'p2-1', sec: 2, lvl: 1, type: 'num', unit: 'rupiah', concepts: ['perubahan-persen'], q: 'Harga Rp50.000 naik $10\\%$. Harga barunya…', ans: 55000, sol: '$50\\,000\\times1{,}1=55\\,000$.' });
  Q({ id: 'p2-2', sec: 2, lvl: 2, type: 'num', trap: 'naik-turun', concepts: ['perubahan-persen'], q: 'Nilai $100$ naik $50\\%$, lalu hasilnya turun $50\\%$. Nilai akhirnya…', ans: 75, wrong: [{ v: 100, why: 'Turun 50% dihitung dari 150, bukan dari 100.', trap: 'naik-turun' }], hints: ['Hitung satu per satu: berapa setelah naik?'], sol: '$100\\to150\\to75$.' });
  Q({ id: 'p2-3', sec: 2, lvl: 3, type: 'num', unit: '%', trap: 'diskon-jumlah', concepts: ['perubahan-persen'], q: 'Toko memberi diskon $30\\%$, lalu diskon tambahan $20\\%$ dari harga setelah diskon pertama. Diskon totalnya setara berapa persen?', ans: 44, wrong: [{ v: 50, why: 'Diskon bertingkat tidak dijumlahkan.', trap: 'diskon-jumlah' }], sol: 'Sisa harga: $0{,}7\\times0{,}8=0{,}56$, jadi diskon total $44\\%$.' });
  Q({ id: 'p2-4', sec: 2, lvl: 4, mode: ['sekolah', 'utbk'], type: 'num', unit: 'rupiah', trap: 'basis-persen', concepts: ['perubahan-persen'], q: 'Setelah didiskon $25\\%$, harga sebuah tas Rp150.000. Harga sebelum diskon…', ans: 200000, wrong: [{ v: 187500, why: 'Diskon 25% dihitung dari harga awal, bukan dari Rp150.000.', trap: 'basis-persen' }], sol: '$0{,}75H=150\\,000 \\Rightarrow H=200\\,000$.' });
  Q({ id: 'p2-5', sec: 2, lvl: 3, type: 'err', concepts: ['perubahan-persen'], q: 'Di langkah mana kesalahan pertama terjadi?', steps: ['Gaji Rp4 juta naik $10\\%$: $4\\times1{,}1=4{,}4$ juta.', 'Tahun berikutnya turun $10\\%$.', 'Turun 10% dari 4,4 juta adalah 0,4 juta.', 'Jadi gaji kembali menjadi 4 juta.'], bad: 2, why: '$10\\%$ dari $4{,}4$ juta adalah $0{,}44$ juta, bukan $0{,}4$ juta. Gaji akhir $3{,}96$ juta.' });
  Q({ id: 'p2-6', sec: 2, lvl: 5, mode: ['olimpiade'], type: 'order', concepts: ['perubahan-persen', 'arti-persen'],
    q: 'Buktikan: jika harga $H>0$ naik $p\\%$ lalu turun $p\\%$ (dengan $0<p<100$), harga akhirnya selalu <b>lebih kecil</b> dari $H$.',
    steps: ['Tulis $r=\\frac{p}{100}$, sehingga $0<r<1$.', 'Setelah naik: $H(1+r)$. Setelah turun: $H(1+r)(1-r)$.', 'Jabarkan: $H(1+r)(1-r)=H(1-r^2)$.', 'Karena $r>0$, $r^2>0$, sehingga $1-r^2<1$.', 'Kalikan dengan $H>0$ (tanda tetap): $H(1-r^2)<H$. Terbukti.'],
    extra: ['Naik $p\\%$ dan turun $p\\%$ saling menghapus.'],
    why: 'Justru itu pernyataan keliru yang sedang dibantah: turunnya dihitung dari nilai yang lebih besar.' });

  /* 4. Lessons: each section is a list of blocks. */
  C.LESSONS = {
    1: [
      { k: 'text', tag: 'Intuisi', title: 'Persen itu "dari setiap seratus"', html: '<p>Kalau 30% siswa suka matematika, artinya <b>dari setiap 100 siswa, 30 orang</b> suka matematika. Simbol % sendiri berasal dari tulisan "per cento" (per seratus).</p><p>Jadi $p\\%=\\frac{p}{100}$. Itu saja rumusnya: semua soal persen adalah perkalian dengan pecahan ini.</p>' },
      { k: 'widget', id: 'persen', title: 'Geser dan lihat', predict: { q: 'Mana yang lebih besar: $8\\%$ dari $50$, atau $50\\%$ dari $8$?', opts: ['$8\\%$ dari $50$', '$50\\%$ dari $8$', 'Sama besar'], ans: 2, after: 'Keduanya $\\frac{8\\times50}{100}=4$. Coba buktikan dengan penggeser.' } },
      { k: 'example', tag: 'Contoh', title: 'Mencari persen dari suatu bilangan', problem: 'Berapa $35\\%$ dari $240$?', steps: [{ t: 'Ubah persen menjadi pecahan: $35\\%=\\frac{35}{100}$.' }, { t: 'Kalikan: $\\frac{35}{100}\\times240=84$.', hide: true, ask: 'Berapa hasil kalinya?' }] },
      { k: 'q', id: 'p1-2', tag: 'Coba dulu' },
      { k: 'traps', ids: ['basis-persen'] },
      { k: 'recap', title: 'Rangkuman mini', items: ['$p\\%=\\frac p{100}$.', '"$p\\%$ dari $N$" = $\\frac p{100}\\times N$.', '"$a$ itu berapa persen dari $b$" = $\\frac ab\\times100\\%$.'] },
      { k: 'practice' },
      { k: 'res' },
      { k: 'exit', qs: ['p1-1', 'p1-3', 'p1-5'], prompt: 'Jelaskan arti "25% dari 80" kepada temanmu.', points: ['Menyebut "per seratus"', 'Menyebut perkalian dengan 25/100', 'Hasilnya 20'] }
    ],
    2: [
      { k: 'retrieval' },
      { k: 'text', tag: 'Intuisi', title: 'Persen kedua dihitung dari angka yang baru', html: '<p>Naik 50% lalu turun 50% <b>tidak</b> kembali semula. Kenapa? Turunnya dihitung dari angka yang sudah membesar: $100\\to150\\to75$.</p><p>Cara paling aman: ubah setiap perubahan menjadi <b>faktor pengali</b>. Naik $p\\%$ = kali $(1+\\frac p{100})$, turun $p\\%$ = kali $(1-\\frac p{100})$. Perubahan berturut-turut = faktornya dikalikan.</p>' },
      { k: 'example', tag: 'Contoh', title: 'Diskon bertingkat', problem: 'Diskon $20\\%$ lalu $10\\%$. Total diskon?', steps: [{ t: 'Faktor sisa: $0{,}8$ dan $0{,}9$.' }, { t: 'Dikalikan: $0{,}8\\times0{,}9=0{,}72$.', hide: true, ask: 'Berapa sisa harganya (sebagai desimal)?' }, { t: 'Sisa $72\\%$, jadi diskon total $28\\%$ (bukan $30\\%$).' }] },
      { k: 'traps', ids: ['naik-turun', 'diskon-jumlah'] },
      { k: 'practice' },
      { k: 'exit', qs: ['p2-2', 'p2-3', 'p2-4'], prompt: 'Kenapa diskon 30% + 20% tidak sama dengan diskon 50%?', points: ['Diskon kedua dihitung dari harga yang sudah turun', 'Faktor sisa dikalikan: 0,7 × 0,8', 'Diskon total 44%'] }
    ]
  };

  /* 5. Flashcards */
  C.CARDS = [
    { id: 'c1', sec: 1, kind: 'Konsep', f: 'Apa arti $p\\%$?', b: '$\\frac{p}{100}$, "per seratus".' },
    { id: 'c2', sec: 1, kind: 'Trik', f: '$8\\%$ dari $50$ = ?', b: '$= 50\\%$ dari $8 = 4$. ($x\\%$ dari $y$ = $y\\%$ dari $x$.)' },
    { id: 'c3', sec: 2, kind: 'Jebakan', f: 'Naik $p\\%$ lalu turun $p\\%$: kembali semula?', b: '<b>Tidak.</b> Hasilnya $H(1-r^2)$, selalu lebih kecil.' },
    { id: 'c4', sec: 2, kind: 'Rumus', f: 'Diskon $a\\%$ lalu $b\\%$: sisa harga?', b: '$(1-\\frac a{100})(1-\\frac b{100})$ dari harga awal.' }
  ];

  /* 6. External resources per section */
  C.RES = {
    1: [{ type: 'artikel', title: 'Percentages (bahasa Inggris, interaktif)', src: 'Math is Fun', url: 'https://www.mathsisfun.com/percentage.html' }],
    2: [{ type: 'video', title: 'Cari video: diskon bertingkat', src: 'YouTube (pencarian)', url: 'https://www.youtube.com/results?search_query=diskon+bertingkat+persen+matematika' }]
  };

  /* 7. Summary & 5-second checks (optional) */
  C.CHECK = { 1: ['Persen ini dihitung dari angka yang mana?'], 2: ['Perubahan kedua dihitung dari angka baru?', 'Diskon bertingkat dikalikan, bukan dijumlah?'] };
  C.SUMMARY = [
    { sec: 1, type: 'Arti persen', first: 'Ubah p% menjadi p/100', key: 'p% dari N = pN/100', trap: 'Salah memilih basis', points: ['p% = p/100', 'p% dari N = pN/100', 'a dari b dalam persen = a/b × 100%'] },
    { sec: 2, type: 'Perubahan persen', first: 'Ubah ke faktor pengali', key: 'Perubahan berturut-turut = kalikan faktornya', trap: 'Naik-turun dianggap batal; diskon dijumlah', points: ['Naik p% = ×(1+p/100)', 'Turun p% = ×(1−p/100)', 'Bertingkat: kalikan faktor', 'Naik lalu turun p%: hasil H(1−r²) < H'] }
  ];

  /* 8. This course's own interactive widgets. mount(id, el) is called by a {k:'widget', id} block. */
  C.WIDGETS = {
    mount(id, el) {
      if (id !== 'persen') { el.textContent = 'Widget tidak dikenal: ' + id; return; }
      el.innerHTML = '<label class="lbl">Persen: <b class="mono" id="wp-pv"></b></label><input type="range" min="0" max="200" value="35" id="wp-p" style="width:100%">' +
        '<label class="lbl">Dari bilangan: <b class="mono" id="wp-nv"></b></label><input type="range" min="0" max="400" value="240" step="4" id="wp-n" style="width:100%">' +
        '<div style="background:var(--surface-2);border-radius:10px;height:22px;overflow:hidden;margin:12px 0"><div id="wp-bar" style="height:100%;background:var(--sol);transition:width .15s"></div></div><p class="big2 center" id="wp-out" aria-live="polite"></p>';
      const p = el.querySelector('#wp-p'), n = el.querySelector('#wp-n');
      const upd = () => {
        const pv = +p.value, nv = +n.value, r = pv * nv / 100;
        el.querySelector('#wp-pv').textContent = pv + '%'; el.querySelector('#wp-nv').textContent = nv;
        el.querySelector('#wp-bar').style.width = Math.min(100, pv / 2) + '%';
        el.querySelector('#wp-out').innerHTML = B.rich('$' + pv + '\\%$ dari $' + nv + '$ = $' + String(Math.round(r * 100) / 100).replace('.', '{,}') + '$');
      };
      p.addEventListener('input', upd); n.addEventListener('input', upd); upd();
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
