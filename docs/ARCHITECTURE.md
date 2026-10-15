# Arsitektur

## Prinsip
- **Tanpa build step.** Setiap file JS adalah IIFE biasa yang menempel ke `window`. Mudah dibaca, mudah di-fork, jalan di GitHub Pages.
- **Kursus = data.** Kode inti tidak tahu apa pun tentang pertidaksamaan; semua materi, soal, widget, dan jebakan ada di `courses/<id>/`.
- **Satu antarmuka backend.** UI tidak pernah memanggil Supabase/Claude langsung, selalu lewat `window.BB`.

## Namespace global
| Nama | File | Isi |
|---|---|---|
| `BM` | `js/math.js` | himpunan interval `{a,b,ca,cb}`, `parseAnswer`, `solve`, `tex/rich` (mini-TeX), `numberLine` |
| `NR` | `js/registry.js` | daftar & pemuat kursus |
| `BC` | `js/registry.js` | **Proxy** ke objek kursus aktif. File kursus menulis `BC.BANK = …` dsb. |
| `BB` | `js/backend.js` | backend aktif: lokal / Claude / Supabase |
| `BA` | `js/core.js` | state progres kursus aktif (`BA.S`), rekam jawaban, jadwal review, statistik, sinkronisasi |
| `BU` | `js/ui.js` | router & komponen UI yang dipakai `platform.js` |
| `BP` | `js/platform.js` | cache halaman kelas |

## Alur memuat kursus
1. `NR.load(id)` membuat objek kosong, menjadikannya target `BC`, lalu memuat `courses/<id>/<file>` satu per satu dengan tag `<script>`.
2. `NR.normalize` mengisi field opsional dengan nilai kosong.
3. `BA.useCourse(id)` menyimpan progres kursus lama, membaca progres kursus baru dari `localStorage` (`nalar-state-v1:<id>`), lalu menarik versi server dan **menggabungkannya** (`BA.merge`: gabungan riwayat jawaban, nilai terbaru per kartu/soal).

Halaman yang butuh kursus (daftar `COURSE_VIEWS` di `ui.js`) otomatis memuat kursus terakhir bila belum ada yang aktif.

## Kursus buatan guru (Studio)
- Disimpan di backend (`BB.courses`), id berbentuk `c-xxxxxxxxxx`. `NR.refreshRemote()` mengambil daftar kursus publik + milik sendiri; `NR.load('c-…')` mengambil isinya.
- Isi kursus adalah data dari pengguna, jadi **selalu** melewati `NalarSafe.compile()` (`js/course-safe.js`): hanya blok & tipe soal yang aman, teks di-escape, rumus dibersihkan dari `< > &`, tautan wajib https. Hasilnya berformat sama dengan kursus berbasis file, sehingga `ui.js` tidak membedakan keduanya.
- Editor (`js/editor.js`) mengedit data mentah `E.raw` lewat atribut `data-b="path"` pada input; perubahan struktur (tambah/hapus/pindah) menggambar ulang tab.

## Progres
Satu dokumen JSON per (pengguna, kursus): riwayat jawaban (maks 1.400), jadwal review tiap soal & kartu, kesalahan, posisi materi, dll. Statistik (penguasaan konsep, jebakan) **tidak disimpan**, selalu dihitung ulang dari riwayat (`BA.stats`). Karena itu laporan guru dan status tugas cukup membaca dokumen progres siswa.

## Status tugas
`target` tugas berupa data, misalnya `{kind:'practice', sec:5, lvl:3}`. Fungsi `statusOf` di `platform.js` menghitung status dari progres siswa:

| kind | selesai jika |
|---|---|
| `lesson` | tiket keluar bagian itu diselesaikan |
| `practice` | 4 dari 5 jawaban terakhir di bagian & level itu benar |
| `prereq` | drill prasyarat lulus |
| `diag` | tes diagnostik selesai |
| `review` / `mixed` | jumlah soal dari sumber itu sejak tugas dibuat ≥ n |
| `tryout` | ≥ 10 soal tryout dijawab sejak tugas dibuat |

## Backend
`backend.js` memilih adaptor saat dimuat; `ui.js` beralih ke adaptor Claude jika runtime Artifact muncul belakangan. Antarmukanya:

```
init(), mode, online, user, isAdmin
auth.{needsLogin, signUp, signIn, signOut, resetPassword}
progress.{load, save, watch?}
classes.{mine, create, join?, remove, leave?, members, memberProgress, kick, setMembers?, candidates?, canCreate, usesCode, manual}
assign.{list, create, remove}
forum.{threads, create, posts, reply, update, remove, removePost}
notes.{watch, send, markRead?, history}
profiles(ids)
```

Menambah backend lain (Firebase, server sendiri) cukup dengan mengimplementasikan antarmuka ini.

## Keamanan
- Semua teks buatan pengguna (nama, judul, isi forum) dimasukkan lewat `textContent` atau di-escape dulu sebelum rumus `$…$` dirender. Uji asap memastikan `<script>` di forum tidak dieksekusi.
- Di mode Supabase, aturan akses ada di database (RLS), diuji oleh `supabase/test-rls.sql`.
