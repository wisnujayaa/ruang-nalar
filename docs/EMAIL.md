# Email akun (konfirmasi, lupa sandi, dll.)

Supabase mengirim email akun dengan template bawaan berbahasa Inggris yang minim informasi.
Folder `supabase/email-templates/` berisi pengganti berbahasa Indonesia yang menjelaskan: email apa ini,
apa yang terjadi setelah tombol diklik, masa berlaku tautan, dan apa yang harus dilakukan kalau tidak merasa meminta.

## Kenapa kode, bukan tautan?
Email aktivasi dan lupa sandi berisi **kode angka**, tanpa tautan dan tanpa gambar:
- Penyaring spam (Gmail dsb.) paling curiga pada email otomatis berisi tombol + tautan yang dialihkan ke domain lain
  (`*.supabase.co` → `*.netlify.app`). Itu pola phishing. Email berisi kode saja jauh lebih jarang masuk Spam.
- Pemindai keamanan email sekolah/kantor sering "mengklik" tautan lebih dulu sehingga tautan sudah terpakai. Kode tidak.
- Kode bisa dibaca di HP lalu diketik di laptop.

Tautan dari email lama tetap didukung aplikasi.

## Memasang template (± 5 menit)

Supabase Dashboard → **Authentication → Emails → Templates**. Untuk tiap jenis email,
ganti **Subject** dan tempel seluruh isi file ke kotak **Body**, lalu **Save**.

| Jenis di Supabase | Subject (salin persis) | File |
|---|---|---|
| Confirm signup | `Kode aktivasi akun Ruang Nalar` | `confirm-signup.html` (kode) |
| Reset password | `Kode atur ulang sandi Ruang Nalar` | `reset-password.html` (kode) |
| Magic link | `Tautan masuk ke Ruang Nalar` | `magic-link.html` |
| Change email address | `Konfirmasi email baru akun Ruang Nalar` | `change-email.html` |
| Invite user | `Kamu diundang ke Ruang Nalar` | `invite.html` |

Variabel seperti `{{ .Token }}` (kode), `{{ .Email }}`, `{{ .ConfirmationURL }}`, `{{ .SiteURL }}` diisi otomatis oleh Supabase. Jangan diubah.
Panjang kode diatur di Authentication → Sign In / Providers → Email (**Email OTP Length**, bawaan 6). Aplikasi menerima 6–10 angka.

## Wajib dicek: URL Configuration

Authentication → **URL Configuration**:
- **Site URL**: `https://ruang-nalar.pages.dev`
- **Redirect URLs**: tambahkan `https://ruang-nalar.pages.dev/**`

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

## Masuk dengan Google (paling ampuh: tanpa email konfirmasi sama sekali)
Akun Google sudah terverifikasi, jadi pengguna yang masuk dengan Google **tidak menerima email apa pun**.
Tombol "Masuk dengan Google" muncul otomatis di halaman Masuk/Daftar begitu penyedia Google diaktifkan di Supabase.

1. https://console.cloud.google.com → buat proyek (misalnya "Ruang Nalar").
2. **APIs & Services → OAuth consent screen** (Google Auth Platform): User type **External**, isi nama aplikasi
   "Ruang Nalar", email dukungan, lalu **Publish app** (status *In production*) supaya semua orang bisa masuk.
   Cakupan bawaan (email, profile, openid) tidak memerlukan verifikasi Google.
3. **Credentials → Create credentials → OAuth client ID** → *Web application*:
   - Authorized JavaScript origins: `https://ruang-nalar.pages.dev`
   - Authorized redirect URIs: salin **Callback URL** dari Supabase → Authentication → Sign In / Providers → Google
     (bentuknya `https://<project-ref>.supabase.co/auth/v1/callback`).
4. Salin **Client ID** dan **Client Secret** ke Supabase → Authentication → Sign In / Providers → **Google** → Enable → Save.
5. Uji di jendela incognito: Masuk → "Masuk dengan Google".

Pengguna lama yang dulu daftar dengan email + sandi bisa masuk dengan Google memakai email yang sama;
Supabase menautkan keduanya ke akun yang sama bila email itu sudah terkonfirmasi.
