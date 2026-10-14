# Menghubungkan Supabase

Supabase menyediakan database Postgres + sistem login. Paket gratisnya cukup untuk kelas kecil sampai menengah. Situs tetap 100% statis; browser berbicara langsung ke Supabase, dan **keamanan dijaga oleh Row Level Security (RLS)** di database, bukan oleh kode JavaScript.

## 1. Buat proyek
1. Daftar di <https://supabase.com>, klik **New project**.
2. Pilih region terdekat (misalnya Singapore), simpan sandi database di tempat aman.

## 2. Pasang skema
1. Buka **SQL Editor → New query**.
2. Tempel seluruh isi `supabase/schema.sql`, klik **Run**.
   Skrip ini aman dijalankan ulang (memakai `if not exists` / `create or replace`).

Yang dibuat:

| Tabel | Isi | Siapa boleh membaca |
|---|---|---|
| `profiles` | nama tampilan | diri sendiri + orang sekelas |
| `progress` | progres per (pengguna, kursus), JSON | diri sendiri + guru kelas **untuk kursus kelas itu saja** |
| `classes` | kelas, kode gabung 6 huruf | guru + anggota |
| `class_members` | keanggotaan | orang di kelas itu |
| `assignments` | tugas + target + tenggat | orang di kelas; hanya guru yang menulis |
| `forum_threads`, `forum_posts` | forum | orang di kelas; ubah/hapus milik sendiri; guru memoderasi; hanya guru yang bisa menyematkan |
| `messages` | pesan guru → siswa | pengirim & penerima; hanya guru dari kelas yang sama yang boleh mengirim |

Siswa bergabung lewat fungsi `join_class(kode)`, jadi tidak ada yang bisa menambahkan diri ke kelas tanpa kode.

## 3. Isi `config.js`
**Project Settings → API**, salin:
- **Project URL** → `supabaseUrl`
- **anon public** key → `supabaseAnonKey`

```js
window.NALAR_CONFIG = {
  siteName: 'Ruang Nalar',
  supabaseUrl: 'https://abcdefgh.supabase.co',
  supabaseAnonKey: 'eyJhbGciOi...'
};
```

Anon key memang dirancang untuk publik (ada di setiap situs yang memakai Supabase). Yang **tidak boleh** pernah masuk repo: `service_role` key dan sandi database.

## 4. Atur autentikasi
**Authentication → URL Configuration**:
- **Site URL**: alamat situsmu, misalnya `https://username.github.io/ruang-nalar/`
- **Redirect URLs**: tambahkan alamat yang sama (dan `http://localhost:8765/` untuk uji lokal)

**Authentication → Providers → Email**: biarkan aktif. "Confirm email" sebaiknya tetap menyala; pengguna baru menerima email konfirmasi sebelum bisa masuk. Batas email bawaan Supabase kecil (beberapa email per jam); untuk kelas besar, sambungkan SMTP sendiri di **Authentication → SMTP Settings**.

## 5. Coba
1. Buka situs, **Akun → Masuk/daftar**, buat akun guru.
2. **Kelas → Buat kelas baru**, pilih kursus. Salin kode atau tautan undangan.
3. Di browser lain (atau jendela penyamaran), daftar sebagai siswa, buka tautan undangan, **Gabung**.
4. Siswa mengerjakan latihan; guru membuka **Kelas → Progres** dan **Tugas** untuk melihat statusnya.

## Menguji keamanan (opsional, untuk pengembang)
`tests/run-rls.sh` menjalankan skenario guru / dua siswa / orang luar di Postgres **lokal yang kosong** (membuat skema `auth` tiruan), dan gagal jika ada akses yang bocor. Jangan arahkan ke database produksi.

## Batasan yang perlu diketahui
- Progres disimpan sebagai satu dokumen JSON per (pengguna, kursus), dipangkas otomatis bila terlalu besar (riwayat jawaban terlama dibuang).
- Pesan dicek setiap 60 detik (bukan real-time).
- Pengguna yang belum masuk tetap bisa belajar; progresnya digabung ke akun saat pertama kali masuk di perangkat itu.
