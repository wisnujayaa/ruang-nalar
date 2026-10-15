# Ruang Nalar

Platform e-learning sumber terbuka untuk belajar **sampai paham ke akarnya**: materi yang dimulai dari intuisi, widget interaktif, latihan bertingkat sampai level UTBK dan olimpiade, review berjarak (*spaced repetition*), flashcard, plus **kelas, tugas, dan forum diskusi**.

Kursus pertama: **Pertidaksamaan** (SMA kelas X → UTBK → olimpiade/kuliah). Kursus lain bisa ditambahkan sebagai folder baru tanpa menyentuh kode inti.

> Situs statis murni: HTML + CSS + JavaScript biasa, **tanpa build step**. Bisa langsung di-host di GitHub Pages.

## Fitur

**Untuk siswa**
- Materi per bagian: intuisi → penjelasan formal → contoh bertahap (langkah disembunyikan) → jebakan umum → latihan → tiket keluar
- 25+ widget interaktif dengan "tebak dulu sebelum mencoba"
- 250+ soal buatan tangan + 25 generator soal acak, 6 level (Mekanik → Olimpiade), mode Ulangan/UTBK/Mandiri/Olimpiade, soal lintas bab
- 6 tipe soal: pilihan ganda, isian interval (dengan pratinjau garis bilangan), isian angka, benar/salah, cari langkah yang salah, **susun langkah bukti**
- Diagnosis otomatis jawaban interval yang salah ("coba x = 4: titik ini memenuhi soal, tapi tidak ada di jawabanmu")
- Review harian berjarak, flashcard, buku kesalahan, radar jebakan, cek 5 detik, rating keyakinan, brain dump, tryout berwaktu
- **Dasbor statistik**: cincin penguasaan, runtutan hari belajar, peta aktivitas, konsep terkuat/terlemah, akurasi per level
- **Pusat bantuan** (`#bantuan`): 38 artikel yang bisa dicari, tur kenalan 8 langkah, kartu sambutan untuk pengguna baru
- **Laporkan masalah** dari setiap soal/materi (bug, kunci salah, pembahasan keliru); admin menerima email lewat Edge Function
- Alur akun lengkap: konfirmasi email, kirim ulang tautan, lupa/ganti sandi, tautan kedaluwarsa, halaman selamat datang
- Bisa dipasang sebagai aplikasi (PWA), banner saat offline, judul halaman per tampilan, kontras warna sesuai WCAG AA

**Untuk guru/kakak**
- Kelas dengan kode gabung dan tautan undangan (`#gabung=KODE`)
- Tugas dengan tenggat; **status per siswa dihitung otomatis dari progres** (tidak perlu siswa menekan "selesai")
- Forum diskusi per kelas: utas, balasan, rumus `$…$`, sematkan, tandai terjawab, moderasi
- Laporan per siswa dan per kelas: konsep terlemah, jebakan paling umum, salah-padahal-yakin, aktivitas terakhir
- Pesan ke siswa / seluruh kelas, bisa ditautkan langsung ke materi atau latihan
- **Studio kursus** (khusus akun guru): buat kursus lewat formulir (materi, contoh bertahap, 6 tipe soal dengan pratinjau, flashcard, jebakan, widget grafik/garis bilangan/Desmos/GeoGebra/PhET/YouTube), terbitkan sebagai draf, **khusus kelas** (terkunci, hanya anggota kelasmu), lewat tautan, atau publik. Tanpa menulis kode
- **Peran akun**: siswa, guru, admin. Admin mengangkat guru dari halaman *Kelola pengguna*

**Keamanan**
- Row Level Security di semua tabel, hak kolom paling minim, batas ukuran data, batas percobaan kode kelas (`supabase/hardening.sql`)
- Content Security Policy ketat lewat `_headers` (Netlify): tidak ada skrip inline, tidak ada skrip dari domain lain
- Semua progres dari server/kode progres melewati pembersih (`BA.sanitize`) sebelum dipakai, sehingga data siswa tidak bisa menyisipkan skrip ke tampilan guru
- Templat email Supabase berbahasa Indonesia di `supabase/email-templates/` (panduan: [docs/EMAIL.md](docs/EMAIL.md))

## Tiga mode penyimpanan

| Mode | Kapan aktif | Akun | Kelas & forum |
|---|---|---|---|
| **Tanpa server** | `config.js` kosong (bawaan) | – | Hanya di browser itu (cocok untuk mencoba; guru bisa memantau lewat *kode progres*) |
| **Supabase** | `config.js` berisi URL & anon key | Email + sandi | Online, multi-perangkat, aman dengan Row Level Security |
| **Claude Artifact** | Dibuka sebagai artifact di claude.ai | Akun Claude | Online di dalam claude.ai |

## Mulai cepat

```bash
git clone https://github.com/<username>/ruang-nalar.git
cd ruang-nalar
python3 -m http.server 8765      # atau: npm run serve
# buka http://localhost:8765
```

Harus lewat server lokal (bukan membuka `index.html` langsung), karena kursus dimuat dinamis.

## Terbitkan ke GitHub Pages

1. Push repo ke GitHub (branch `main`).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Workflow `.github/workflows/pages.yml` menjalankan verifikasi kunci jawaban, lalu menerbitkan situs ke `https://<username>.github.io/ruang-nalar/`.

## Aktifkan akun, kelas online, dan forum (Supabase, gratis)

Ringkasnya: buat proyek Supabase → jalankan `supabase/schema.sql`, `supabase/courses.sql`, `supabase/roles.sql`, `supabase/course-access.sql`, `supabase/reports.sql`, lalu `supabase/hardening.sql` di SQL Editor → jadikan akunmu admin → isi `config.js` dengan Project URL dan **anon** key → atur Site URL. Panduan langkah demi langkah: [docs/SUPABASE.md](docs/SUPABASE.md).

## Menambah kursus

Tanpa kode: **Akun → Studio kursus**. Dengan kode (bisa memakai widget interaktif & generator soal): salin `courses/contoh-kursus/`, ubah isinya, daftarkan di `courses/index.js`. Panduan lengkap beserta format setiap blok dan tipe soal: [docs/MENAMBAH-KURSUS.md](docs/MENAMBAH-KURSUS.md).

## Struktur

```
index.html              kerangka halaman
config.js               konfigurasi situs (Supabase opsional)
assets/                 CSS & ikon
js/
  math.js               mesin interval, parser jawaban, mini-TeX, garis bilangan
  registry.js           pemuat kursus (window.BC = kursus aktif)
  backend.js            adaptor penyimpanan: lokal / Claude / Supabase
  core.js               progres per kursus, review berjarak, statistik, sinkronisasi
  ui.js                 halaman belajar: materi, soal, review, flashcard, statistik
  platform.js           beranda katalog, akun, kelas, tugas, forum, laporan
  stats.js              dasbor statistik
  help.js               pusat bantuan & tur kenalan
  report.js             formulir laporan masalah & kotak masuk admin
  site.js               nama situs dari config.js (dipisah dari HTML demi CSP)
  editor.js             Studio kursus (editor tanpa kode)
  widget-lib.js         pustaka widget untuk Studio (lihat docs/WIDGET.md)
  expr.js               parser rumus aman untuk widget
  course-safe.js        pembersih & kompilasi kursus buatan guru
courses/
  index.js              daftar kursus
  pertidaksamaan/       kursus utama
  contoh-kursus/        templat kursus
supabase/               skema database + uji keamanan
tests/                  verifikasi kunci jawaban, uji UI, uji RLS
docs/                   arsitektur, panduan kursus, widget, Supabase
tools/                  studio-to-file.js: pindahkan kursus Studio ke kode
```

Penjelasan alur data: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Pengujian

```bash
npm test             # kunci jawaban, pembersih kursus & progres, merge/streak/SRS, fuzz 40 ribu input,
                     # verifikasi independen 17 generator soal, Edge Function laporan (Node, tanpa dependensi)
npm run test:ui      # uji asap antarmuka dengan Playwright (jalankan `npm run serve` dulu)
npm run test:flow    # alur guru & siswa mode Supabase (Supabase palsu di memori)
npm run test:editor  # guru membuat kursus di Studio → siswa mengerjakan
npm run test:auth    # daftar, konfirmasi email, kirim ulang, lupa & ganti sandi
npm run test:help    # pusat bantuan, pencarian, tur kenalan
npm run test:csp     # CSP dari _headers diterapkan; skrip sisipan harus diblokir
PGHOST=localhost PGUSER=postgres npm run test:rls   # uji kebijakan keamanan di Postgres LOKAL
```

## Lisensi

Kode: MIT (lihat `LICENSE`). Tautan sumber belajar eksternal di dalam materi tetap milik pemiliknya masing-masing.
