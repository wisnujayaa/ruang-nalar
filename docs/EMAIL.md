# Email akun (konfirmasi, lupa sandi, dll.)

Supabase mengirim email akun dengan template bawaan berbahasa Inggris yang minim informasi.
Folder `supabase/email-templates/` berisi pengganti berbahasa Indonesia yang menjelaskan: email apa ini,
apa yang terjadi setelah tombol diklik, masa berlaku tautan, dan apa yang harus dilakukan kalau tidak merasa meminta.

## Memasang template (± 5 menit)

Supabase Dashboard → **Authentication → Emails** (atau *Email Templates*). Untuk tiap jenis email,
ganti **Subject** dan tempel seluruh isi file ke kotak **Body (HTML)**, lalu **Save**.

| Jenis di Supabase | Subject (salin persis) | File |
|---|---|---|
| Confirm signup | `Aktifkan akun Ruang Nalar-mu` | `confirm-signup.html` |
| Reset password | `Buat kata sandi baru untuk Ruang Nalar` | `reset-password.html` |
| Magic link | `Tautan masuk ke Ruang Nalar` | `magic-link.html` |
| Change email address | `Konfirmasi email baru akun Ruang Nalar` | `change-email.html` |
| Invite user | `Kamu diundang ke Ruang Nalar` | `invite.html` |

Variabel seperti `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}`, `{{ .NewEmail }}` diisi otomatis oleh Supabase. Jangan diubah.
Logo di email diambil dari `{{ .SiteURL }}/assets/icon-180.png`, jadi **Site URL harus benar** (lihat di bawah).

## Wajib dicek: URL Configuration

Authentication → **URL Configuration**:
- **Site URL**: `https://ruang-nalar.netlify.app`
- **Redirect URLs**: tambahkan `https://ruang-nalar.netlify.app/**`

Tanpa ini, tautan di email bisa mengarah ke `localhost` atau ditolak. Aplikasi meminta Supabase mengarahkan
tautan ke alamat situs yang sedang dibuka (`emailRedirectTo`), dan alamat itu harus ada di daftar ini.

## Apa yang terjadi setelah tautan diklik (sudah ditangani aplikasi)

| Tautan | Hasil di situs |
|---|---|
| Konfirmasi akun | Langsung masuk → halaman "Akunmu sudah aktif!" + tiga langkah pertama |
| Lupa sandi | Formulir "Buat sandi baru" |
| Kedaluwarsa / sudah dipakai | Penjelasan + tombol kirim ulang email konfirmasi / minta tautan atur ulang |

Tautan sering "sudah dipakai" karena pemindai keamanan email (misalnya di email sekolah/kantor) membuka tautan
lebih dulu. Halaman penjelasan menyebutkan ini dan menyediakan tombol kirim ulang.

## Disarankan (Authentication → Providers / Policies)
- **Minimum password length: 8** (aplikasi sudah meminta 8, server sebaiknya sama).
- **Leaked password protection: ON** (menolak sandi yang pernah bocor di internet).
- Masa berlaku tautan email (*Email OTP Expiration*) bawaannya 1 jam; teks email menulis "sekitar 1 jam".
  Kalau diubah, sesuaikan juga teks di `confirm-signup.html` dan `reset-password.html`.

Catatan: *Leaked password protection* hanya tersedia di paket **Pro** ke atas. Di paket gratis, lewati saja
(peringatan di Security Advisor akan tetap muncul, dan itu wajar).

## Pengirim email (PENTING sebelum dipakai siswa)
Pengirim bawaan Supabase hanya untuk uji coba. Menurut dokumentasi resmi Supabase, pengirim ini:
- **hanya mengirim ke alamat anggota tim proyek** (Organization → Team). Alamat lain bisa ditolak dengan
  *"Email address not authorized"*, sehingga siswa tidak bisa mengaktifkan akun;
- dibatasi beberapa email **per jam** untuk seluruh proyek;
- tanpa jaminan terkirim.

Solusi gratis tanpa domain: **SMTP Gmail** (± 500 email/hari).
1. Pakai Gmail yang sudah ada, atau buat akun khusus situs kalau tidak ingin alamat pribadimu terlihat sebagai pengirim.
   (Nama pengirim tetap tampil "Ruang Nalar"; alamatnya terlihat kalau penerima membuka detail email.)
2. Di akun itu nyalakan **Verifikasi 2 Langkah**, lalu buat **Sandi Aplikasi** di https://myaccount.google.com/apppasswords
   (16 huruf). Sandi ini hanya ditempel di Supabase, jangan disimpan di repo.
3. Supabase → Authentication → Emails → **SMTP Settings** → Enable custom SMTP:
   - Sender email: alamat Gmail tadi · Sender name: `Ruang Nalar`
   - Host: `smtp.gmail.com` · Port: `587` · Username: alamat Gmail tadi · Password: Sandi Aplikasi
4. Authentication → **Rate Limits**: naikkan batas email per jam (misalnya 30) setelah SMTP aktif.
5. Uji: daftar dengan email teman (bukan anggota tim) dan pastikan emailnya masuk.

Kalau nanti punya domain sendiri, ganti ke Resend/Brevo dengan domain terverifikasi agar email tidak masuk Spam.
