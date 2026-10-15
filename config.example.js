/* Salin file ini menjadi config.js lalu isi.
   Tanpa Supabase, situs tetap berjalan penuh dalam "mode tanpa server":
   progres tersimpan di browser, dan kelas/forum hanya lokal.
   Kunci "anon" Supabase memang aman untuk dipublikasikan: keamanan data dijaga
   oleh Row Level Security di supabase/schema.sql. JANGAN pernah memasukkan kunci service_role. */
window.NALAR_CONFIG = {
  siteName: 'Ruang Nalar',
  // Nomor WA untuk tombol "Kirim lewat WhatsApp" setelah melapor (opsional, TERLIHAT PUBLIK). Contoh: '62812xxxxxxx'
  reportWhatsApp: '',
  tagline: 'Belajar sedikit tiap hari, paham sampai ke akarnya.',
  supabaseUrl: '',      // contoh: 'https://abcdefgh.supabase.co'
  supabaseAnonKey: ''   // Project Settings → API → anon public key
};
