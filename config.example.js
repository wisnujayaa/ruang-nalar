/* Copy this file to config.js and fill it in.
   Without Supabase the site still works fully in "serverless mode":
   progress is stored in the browser, and classes/forums are local only.
   The Supabase "anon" key is safe to publish: data security is enforced
   by Row Level Security in supabase/schema.sql. NEVER put a service_role key here. */
window.NALAR_CONFIG = {
  siteName: 'Ruang Nalar',
  // WhatsApp number for the "Send via WhatsApp" button after reporting (optional, PUBLICLY VISIBLE). Example: '62812xxxxxxx'
  reportWhatsApp: '',
  // Source repository (for the "Open on GitHub" links in the Studio). Leave empty to hide them.
  repoUrl: '',
  tagline: 'Belajar sedikit tiap hari, paham sampai ke akarnya.',
  supabaseUrl: '',      // e.g. 'https://abcdefgh.supabase.co'
  supabaseAnonKey: ''   // Project Settings → API → anon public key
};
