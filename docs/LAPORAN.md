# Laporan kendala → email / WhatsApp / Telegram

Pengguna bisa melapor dari tiga tempat:
- **Akun → Laporkan kendala**, untuk bug, saran, atau hal lain;
- tombol **"Soal, kunci, atau pembahasan ini salah? Laporkan"** di bawah setiap soal yang sudah dijawab;
- tombol **"Ada yang salah di materi ini? Laporkan"** di bawah setiap subbab materi.

Laporan otomatis membawa konteks: kursus, bagian, id soal, teks soal, halaman, perangkat, dan
(khusus laporan bug) beberapa pesan error terakhir. Pelapor bisa melihat isinya sebelum mengirim.

## Alur data

```
Browser ──insert──▶ tabel reports (RLS)                       ← tempat utama: Akun → Laporan masuk
   └──invoke──▶ Edge Function notify-report ──▶ email / WA / Telegram admin
```

- Siapa pun boleh melapor, termasuk yang belum masuk. Batasnya 10 laporan/jam per akun,
  dan 20 laporan/jam untuk semua pengunjung tanpa akun.
- Pelapor hanya melihat laporannya sendiri. Admin melihat semua, mengubah status
  (Baru → Diproses → Selesai), dan menulis balasan yang terlihat oleh pelapor.
- Setiap laporan dikirim ke admin **paling banyak sekali**: kolom `notified_at` diklaim secara atomik.
- SQL: `supabase/reports.sql` · Function: `supabase/functions/notify-report/index.ts` · Tes: `supabase/test-rls-reports.sql`, `tests/verify-notify.mjs`.

## Mengaktifkan notifikasi

Function sudah terpasang. Yang tersisa adalah mengisi **secret** di Supabase Dashboard →
**Edge Functions → Secrets** (atau Project Settings → Edge Functions). Saluran yang secret-nya kosong dilewati.
Isi satu saluran atau lebih:

### Email (Resend, gratis 100 email/hari)
1. Daftar di resend.com **memakai email yang ingin menerima laporan**. Tanpa domain sendiri,
   Resend hanya mengizinkan pengiriman ke email akunmu sendiri, dan itu sudah cukup di sini.
2. Buka API Keys → Create API key, lalu salin kuncinya.
3. Buat secret `RESEND_API_KEY` = kunci tadi, dan `REPORT_EMAIL` = emailmu.

### WhatsApp: CallMeBot (gratis, khusus ke nomormu sendiri)
1. Buka halaman "Free API WhatsApp" di callmebot.com dari HP, lalu simpan nomor bot yang tertera di sana.
2. Kirim pesan `I allow callmebot to send me messages` ke bot itu. Bot membalas dengan **apikey**.
3. Buat secret `CALLMEBOT_PHONE` = nomormu dengan kode negara (misalnya `62812xxxx`), dan `CALLMEBOT_APIKEY` = apikey tadi.

### WhatsApp: Fonnte (layanan Indonesia; paket gratis memberi label "sent via fonnte")
1. Daftar di fonnte.com, hubungkan satu nomor WhatsApp sebagai pengirim, lalu salin **token** perangkatnya.
2. Buat secret `FONNTE_TOKEN` = token, dan `REPORT_WA` = nomor penerima (misalnya `62812xxxx`).

### Telegram (gratis, paling stabil)
1. Chat @BotFather → `/newbot` → salin token bot.
2. Kirim pesan apa saja ke bot barumu, lalu buka `https://api.telegram.org/bot<TOKEN>/getUpdates`
   dan catat angka `chat.id`.
3. Buat secret `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID`.

Opsional: `SITE_URL` (tautan di pesan) dan `REPORT_EMAIL_FROM` (pengirim email, bila punya domain sendiri).

### Tanpa layanan apa pun: tombol "Kirim lewat WhatsApp"
Isi `reportWhatsApp: '62812xxxx'` di `config.js`. Setelah mengirim laporan, pengguna melihat tombol
yang membuka WhatsApp mereka dengan pesan siap kirim ke nomor itu.
Catatan: nomor di `config.js` **terlihat publik** oleh siapa pun yang membuka kode situs.

## Memeriksa
Kirim laporan uji dari situs, lalu buka Supabase → Edge Functions → notify-report → **Logs**.
Respons berisi status tiap saluran, misalnya `{"email":"terkirim","wa_callmebot":"tidak diatur"}`.
Status yang sama juga muncul di konsol browser pelapor (`Notifikasi laporan: …`).
