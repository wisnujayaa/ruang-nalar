# Widget interaktif

Ada tiga jalur, dari yang paling mudah sampai yang paling bebas:

```
                      siapa menulis kode?     siapa bisa memakai?       aman untuk siswa?
1. Pustaka widget     pengelola situs (sekali)  SEMUA guru di Studio      ya: guru hanya mengisi parameter
2. Widget kursus file pengelola situs           kursus itu saja           ya: kode ada di repo, direview
3. Studio → file      pengelola situs           kursus itu saja           ya (sama dengan no. 2)
```

**Kenapa guru tidak boleh menulis JavaScript langsung di Studio?** Kode dari satu guru akan berjalan di browser setiap siswa yang membuka kursusnya, dengan sesi login siswa itu. Kode jahat (atau sekadar ceroboh) bisa membaca progres, mengirim pesan atas nama siswa, dan sebagainya. Karena itu Studio hanya menerima **data**, sedangkan **kode** widget ditulis pengelola situs di repo.

## 1. Pustaka widget (dipakai semua guru)

File: `js/widget-lib.js`. Saat ini tersedia:

| id | Nama | Parameter |
|---|---|---|
| `grafik` | Grafik fungsi + slider | rumus `f(x)`, sampai 4 slider, arsir daerah `f(x) > 0` / `< 0` / dst., batas sumbu |
| `garis` | Garis bilangan interaktif | petunjuk, contoh awal, nama variabel |
| `sematan` | Desmos / GeoGebra / PhET / YouTube | tautan (hanya domain tepercaya), keterangan |

Rumus pada widget grafik dibaca oleh parser aman `js/expr.js` (tanpa `eval`), diuji di `tests/verify-expr.js`.

### Menambah widget ke pustaka

```js
// di js/widget-lib.js
W.def({
  id: 'lingkaran',                       // huruf kecil, unik
  name: 'Lingkaran satuan',              // tampil di menu Studio
  desc: 'Geser sudut, lihat sin dan cos.',
  params: [                              // formulir di Studio dibuat otomatis dari skema ini
    { key: 'sudut', type: 'num', label: 'Sudut awal (derajat)', def: 30, min: 0, max: 360 },
    { key: 'tampilTan', type: 'bool', label: 'Tampilkan tan', def: false }
  ],
  mount(el, p) {                         // p sudah dibersihkan sesuai skema
    el.innerHTML = '<svg class="w-svg" viewBox="0 0 300 300"></svg><input type="range" min="0" max="360">';
    // ... gambar & pasang event
  }
});
```

Jenis parameter: `text`, `longtext`, `num` (dengan `min`/`max`), `select` (dengan `opts: [[nilai, label], ...]`), `bool`, `url`, `vars` (daftar slider). Setelah di-push, widget langsung muncul di menu **Widget interaktif** di Studio untuk semua guru.

Aturan supaya tetap aman:
- Jangan masukkan teks dari parameter ke `innerHTML`; pakai `textContent`, atau escape dulu.
- Jangan jalankan teks parameter sebagai kode (`eval`, `Function`, `setTimeout(string)`). Untuk rumus, pakai `NalarExpr.compile`.
- Kursus berbasis file juga bisa memakai pustaka: `{ k: 'widget', lib: 'grafik', params: { expr: 'x^2-4' } }`.

## 2. Widget khusus di kursus berbasis file

Untuk widget yang hanya dipakai satu kursus (seperti 25 widget di kursus Pertidaksamaan):

```js
// courses/<id>/course.js
C.WIDGETS = {
  mount(id, el) {
    if (id === 'timbangan') { el.innerHTML = '...'; /* bebas pakai JavaScript */ }
  }
};
C.LESSONS[1].push({ k: 'widget', id: 'timbangan', title: 'Timbangan seimbang', predict: { q: '…', opts: ['…', '…'], ans: 0 } });
```

## 3. Memindahkan kursus Studio ke kode

Kalau kursus buatan guru perlu widget yang sangat khusus:
1. Di Studio, tab **Terbitkan → Ekspor JSON**, simpan sebagai `kursus.json`.
2. `node tools/studio-to-file.js kursus.json nama-kursus` akan membuat `courses/nama-kursus/course.js`.
3. Tambahkan potongan yang dicetak ke `courses/index.js`, tulis widgetnya di `C.WIDGETS`, lalu push.

Mulai saat itu kursus diedit di kode, bukan di Studio lagi. Biasanya jalur no. 1 lebih baik: buat widgetnya sekali di pustaka, dan semua guru ikut menikmatinya.
