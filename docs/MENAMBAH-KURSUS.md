# Menambah kursus

Ada dua cara:

| | **Studio kursus (tanpa kode)** | **Kursus berbasis file (kode)** |
|---|---|---|
| Untuk | Akun berperan guru/admin | Pengelola repo |
| Tempat menulis | Formulir di web: **Akun → Studio kursus** | Folder `courses/<id>/` |
| Disimpan di | Database (tabel `courses`) | Repo GitHub |
| Fitur khusus | Teks, contoh bertahap, 6 tipe soal, flashcard, jebakan, sumber belajar, **widget dari pustaka** (grafik, garis bilangan, Desmos/GeoGebra/PhET/YouTube) | Semua itu **plus** widget kustom & generator soal acak (butuh JavaScript) |
| Siapa yang bisa membuka | Draf / **khusus kelas** (terkunci) / lewat tautan / publik (tab Terbitkan) | Semua pengunjung (berkas di repo bersifat publik) |

## Cara 1: Studio kursus (disarankan untuk guru)
1. Masuk, buka **Akun → Studio kursus → Buat kursus baru**.
2. **Info**: judul, mata pelajaran, jenjang, deskripsi.
3. **Bagian & materi**: tiap bagian berisi blok yang disusun dari atas ke bawah (teks, contoh bertahap, soal coba-dulu, jebakan, rangkuman, latihan otomatis, tiket keluar). Teks memakai format ringan: `**tebal**`, `*miring*`, baris `- ` untuk daftar, rumus `$x^2<4$`.
4. **Soal**: pilih tipe, isi pertanyaan, kunci, pembahasan, level (L1–L6). Tombol **Coba soal ini** menampilkan soal persis seperti yang dilihat siswa. Kunci interval langsung dipratinjau di garis bilangan.
5. **Terbitkan**: periksa daftar masalah/saran, pilih Draf/Khusus kelas/Lewat tautan/Publik, klik **Simpan**, lalu **Pratinjau sebagai siswa**.
6. Kursus langsung bisa dipilih saat membuat kelas, dan semua fitur (review berjarak, tugas berstatus otomatis, laporan guru) berlaku.

Keamanan: semua teks dari Studio dibersihkan oleh `js/course-safe.js` sebelum ditampilkan. HTML mentah tidak pernah dirender, rumus dibersihkan, dan tautan wajib `https://`. Diuji oleh `tests/verify-safe.js`.

Widget: lihat [WIDGET.md](WIDGET.md) untuk daftar widget pustaka, cara menambah widget baru, dan cara memindahkan kursus Studio ke kode.

Kursus Studio bisa diekspor/impor sebagai JSON (tab Terbitkan), misalnya untuk cadangan atau memindahkannya ke situs lain.

## Cara 2: kursus berbasis file

Sebuah kursus adalah satu folder di `courses/` berisi file JavaScript biasa yang mengisi objek `BC`. Tidak perlu menyentuh `js/`.

## Langkah cepat
1. Salin `courses/contoh-kursus/` menjadi `courses/<id-kursus>/` (huruf kecil, angka, `-`).
2. Daftarkan di `courses/index.js`:
   ```js
   { id: 'fungsi-kuadrat', title: 'Fungsi kuadrat', brand: 'Parabola', subject: 'Matematika',
     level: 'SMA kelas X', blurb: 'Satu kalimat yang membuat orang ingin mulai.', glyph: 'x²', color: 'sol',
     files: ['course.js'] }
   ```
   `files` dimuat berurutan, jadi kursus besar boleh dipecah (lihat `pertidaksamaan`: konten, bank soal, generator, widget).
   Tambahkan `soon: true` untuk menampilkan kartu "Segera hadir" (kartu pengumuman, belum bisa dibuka), atau `hidden: true` agar kursus tidak tampil di katalog tetapi tetap bisa dibuka lewat tautan `#kursus=<id>`.
3. Jalankan `npm run serve`, buka kursusmu, lalu `npm test` (tambahkan pengecekan kunci soalmu di `tests/verify-keys.js`).

## Field kursus
| Field | Wajib | Isi |
|---|---|---|
| `SECTIONS` | ya | `[{id, short, title, glyph, concepts:[…], jalur?}]` — `jalur`: `sekolah`/`ujian`/`campuran`/`tantangan` (opsional) |
| `LESSONS` | ya | `{ [idBagian]: [blok, …] }` |
| `BANK` | ya | `{ [idSoal]: soal }` |
| `CONCEPTS` | disarankan | `{ kunci: 'Nama konsep' }` untuk peta penguasaan |
| `TRAPS` | disarankan | `{ kunci: {name, sec, wrong, right, tip} }` jebakan umum |
| `CARDS` | opsional | `[{id, sec, kind, f, b, nl?}]` flashcard (muncul setelah bagiannya dibuka) |
| `RES`, `RES_GENERAL` | opsional | sumber eksternal `{type:'artikel'|'video'|'alat'|'buku', title, src, url, note?}` |
| `GEN`, `GEN_BY_SEC` | opsional | generator soal acak `GEN[nama] = {lvl, make(seed) → soal}` |
| `INTRO`, `PREREQ`, `GEN_BY_PRE` | opsional | Bagian 0, prasyarat + drill. Soal ber-id `d-…` menjadi tes diagnostik |
| `CHECK`, `SUMMARY`, `DECISION` | opsional | cek 5 detik per bagian, ringkasan tertutup, peta keputusan |
| `INFO` | opsional | `{introTitle, diagDesc, lintasGens, tips}` |
| `WIDGETS` | opsional | `{ mount(id, el) }` untuk blok widget |

## Blok materi (`LESSONS`)
| `k` | Contoh | Catatan |
|---|---|---|
| `text` | `{k:'text', tag:'Intuisi', title, html}` | `html` boleh memuat rumus `$…$` / `$$…$$` |
| `widget` | `{k:'widget', id:'persen', title, predict?:{q, opts, ans, after}}` | `predict` = tebak dulu sebelum widget terbuka |
| `example` | `{k:'example', title, problem, steps:[{t, hide?, ask?}], nl?}` | langkah `hide:true` harus ditebak dulu (*faded example*) |
| `q` | `{k:'q', id:'p1-2', tag:'Coba dulu'}` | satu soal dari `BANK` |
| `traps` | `{k:'traps', ids:[…]}` | kartu jebakan |
| `retrieval` | `{k:'retrieval'}` | 2 soal acak dari bagian sebelumnya |
| `recap` | `{k:'recap', title, items:[…]}` | |
| `practice` | `{k:'practice'}` | panel latihan bertingkat L1–L6 |
| `res` | `{k:'res'}` | menampilkan `RES[bagian]` + `RES_GENERAL` |
| `exit` | `{k:'exit', qs:[3 id], prompt, points:[…]}` | menyelesaikan bagian; dipakai status tugas "selesaikan bagian" |

## Tipe soal (`BANK`)
Field umum: `id, sec, lvl (1–6), type, q, concepts, mode?, trap?, hints?, sol?, lintas?`.
`mode` berisi kombinasi `sekolah`, `utbk`, `mandiri`, `olimpiade`.

| `type` | Field khusus |
|---|---|
| `mc` | `opts:[{t, ok?, why?, trap?}]` — pilihan diacak; isi `why` di pengecoh supaya umpan baliknya mendidik |
| `num` | `ans`, `tol?`, `unit?`, `wrong:[{v, why, trap?}]` |
| `interval` | `ans` (mis. `'(-inf,2]U(5,inf)'`), `v?`, `wrong:[{a, why, trap?}]` — jawaban salah lain didiagnosis otomatis |
| `tf` | `stmts:[{t, v, why}]` |
| `err` | `steps:[…]`, `bad` (indeks langkah salah pertama), `why` |
| `order` | `steps:[…]` (urutan benar), `extra?:[pengecoh]`, `alt?:[[indeks…]]` urutan lain yang sah, `why` |

Level yang disarankan: L1 mekanik, L2 konsep, L3 aplikasi, L4 ujian (UTBK/mandiri), L5 tantangan, L6 olimpiade/kuliah. Level berikutnya terbuka setelah 4 dari 5 jawaban terakhir benar.

## Tips menulis soal yang baik
- Pengecoh pilihan ganda = kesalahan nyata siswa, bukan angka acak. Beri `why` di setiap pengecoh.
- Hubungkan soal ke `trap` yang sama dengan katalog jebakan agar radar jebakan bekerja.
- Uji setiap kunci dengan komputer (lihat `tests/verify-keys.js`): kunci yang salah merusak kepercayaan siswa.

## Mengunci kursus untuk kelas tertentu

Kursus Studio punya empat tingkat akses (tab **Terbitkan**):

| Akses | Siapa yang bisa membuka | Guru lain boleh memakainya di kelasnya? |
|---|---|---|
| Draf | hanya pembuat | tidak |
| **Khusus kelas** | pembuat + anggota kelas **milik pembuat** yang memakai kursus ini | tidak |
| Lewat tautan | siapa pun yang punya tautan | ya |
| Publik | semua orang, tampil di katalog | ya |

Alurnya: buat kursus → pilih **Khusus kelas** → buat kelas (menu Kelas) dengan kursus itu → bagikan kode kelas.
Siswa yang bergabung otomatis bisa membuka kursus, dan yang keluar atau dikeluarkan otomatis kehilangan akses.
Kunci ini ditegakkan di database (RLS, `supabase/course-access.sql`), bukan sekadar disembunyikan di tampilan.

Kursus **berkas** (folder `courses/`) tidak bisa dikunci: file-nya disajikan Netlify ke siapa pun.
Jika materinya perlu dikunci, buat ulang di Studio.
