/* Konfigurasi situs Ruang Nalar.
   Kunci di bawah adalah kunci "anon" (publik) Supabase: memang aman ada di browser,
   karena semua akses data dijaga Row Level Security (supabase/schema.sql).
   JANGAN pernah menaruh kunci service_role / secret di sini. */
window.NALAR_CONFIG = {
  siteName: 'Ruang Nalar',
  tagline: 'Belajar sedikit tiap hari, paham sampai ke akarnya.',
  supabaseUrl: 'https://qrupegzfpecuiullaqeu.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXBlZ3pmcGVjdWl1bGxhcWV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5ODQ4MzksImV4cCI6MjEwNzU2MDgzOX0._bqw6M3jNxW8pRENpzEG2PE9EF5CwxQQAwCnC6uRxHg'
};
