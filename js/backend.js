/* Ruang Nalar — backend layer.
   One interface, two implementations:
   - supabase : used when config.js has supabaseUrl & supabaseAnonKey
   - local    : fallback; all data stays in this browser (serverless mode / no accounts)
   Interface used by the UI:
     init(), mode, online, user {id,name,email}, isAdmin, auth.{signUp,signIn,signOut,needsLogin}
     progress.{load,save,watch}, classes.{mine,create,join,remove,leave,members,kick,memberProgress,setMembers,candidates,canCreate,usesCode}
     assign.{list,create,remove}, forum.{threads,create,posts,reply,update,remove,removePost}
     notes.{watch,send,markRead}, profiles(ids) */
(function (G) {
  'use strict';
  const CFG = G.NALAR_CONFIG || {};
  const now = () => Date.now();
  const uid8 = () => Math.random().toString(36).slice(2, 10) + now().toString(36).slice(-4);
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
  const err = (m, code) => { const e = new Error(m); if (code) e.code = code; return e; };
  /* Teacher-made courses: metadata fields the editor may change */
  /* Studio course visibility: draft (owner only), class (members of the owner's classes), unlisted (by link), public (catalog) */
  const VIS = ['draft', 'class', 'unlisted', 'public'];
  const COURSE_FIELDS = ['title', 'subject', 'level', 'blurb', 'glyph', 'color', 'visibility'];
  const pickMeta = (m) => { const o = {}; COURSE_FIELDS.forEach(k => { if (m && m[k] != null) o[k] = String(m[k]); }); o.title = (o.title || 'Kursus tanpa judul').slice(0, 80); if (!VIS.includes(o.visibility)) o.visibility = 'draft'; if (!['accent', 'sol'].includes(o.color)) o.color = 'accent'; return o; };
  const courseMeta = (row, me) => ({ id: row.id, title: row.title, subject: row.subject || '', level: row.level || '', blurb: row.blurb || '', glyph: row.glyph || '', color: row.color || 'accent', visibility: row.visibility || 'draft', ownerId: row.owner_id || row.owner || null, mine: !!me && (row.owner_id || row.owner) === me, updated: row.updated_at ? Date.parse(row.updated_at) : (row.u || row.t || null), db: true });
  /* Problem reports: known kinds, input sanitizer, and the row shape the UI uses */
  const REPORT_KINDS = ['bug', 'soal', 'materi', 'saran', 'lain'];
  const REPORT_STATUS = ['baru', 'diproses', 'selesai'];
  const uuid = () => (G.crypto && G.crypto.randomUUID) ? G.crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  const cleanReport = (r) => {
    const kind = REPORT_KINDS.includes(r && r.kind) ? r.kind : 'lain';
    const body = String((r && r.body) || '').trim().slice(0, 2000);
    if (body.length < 5) throw err('Ceritakan kendalanya minimal 5 karakter.');
    let context = (r && r.context) || {}; let txt = JSON.stringify(context);
    if (txt.length > 3800) { context = { note: 'konteks dipangkas', view: context.view, course: context.course, qid: context.qid }; txt = JSON.stringify(context); }
    return { kind, body, contact: String((r && r.contact) || '').trim().slice(0, 120), context: JSON.parse(txt) };
  };
  const repRow = (x, who) => ({ id: x.id, kind: x.kind, body: x.body, contact: x.contact || '', context: x.context || {}, status: x.status || 'baru', note: x.admin_note || x.note || '', t: Date.parse(x.created_at) || x.t || null, userId: x.user_id || x.a || null, who: who || '' });
  const newCourseId = () => 'c-' + Math.random().toString(36).slice(2, 7) + now().toString(36).slice(-5);

  /* =========================== LOCAL =========================== */
  function LocalBackend() {
    const K = { cls: 'nalar-local-classes', stu: 'nalar-local-students', asg: 'nalar-local-assign', thr: 'nalar-local-threads', pst: 'nalar-local-posts', me: 'nalar-local-me', crs: 'nalar-local-courses' };
    const me = ls.get(K.me, null) || (() => { const m = { id: 'local', name: 'Kamu' }; ls.set(K.me, m); return m; })();
    me.role = 'admin';   // the single user of this browser owns everything
    const B = {
      mode: 'local', online: false, isAdmin: true, user: me,
      async init() { return B; },
      auth: { needsLogin: false, async signOut() { } },
      setName(n) { me.name = n || 'Kamu'; ls.set(K.me, me); },
      progress: { async load() { return null; }, async save() { } },
      students: () => ls.get(K.stu, []),
      addStudent(name, code) { const st = ls.get(K.stu, []); const id = 'L:' + uid8(); st.push({ id, name, code, t: now() }); ls.set(K.stu, st); return id; },
      classes: {
        canCreate: true, usesCode: false, manual: true,
        async mine() { return ls.get(K.cls, []).map(c => Object.assign({ isOwner: true, ownerId: me.id }, c)); },
        async create(c) { const all = ls.get(K.cls, []); const n = { id: 'c' + uid8(), name: c.name, course: c.course, members: [], t: now() }; all.push(n); ls.set(K.cls, all); return n; },
        async remove(id) { ls.set(K.cls, ls.get(K.cls, []).filter(c => c.id !== id)); ls.set(K.asg, ls.get(K.asg, []).filter(a => a.classId !== id)); const th = ls.get(K.thr, []); const gone = th.filter(t => t.classId === id).map(t => t.id); ls.set(K.thr, th.filter(t => t.classId !== id)); ls.set(K.pst, ls.get(K.pst, []).filter(p => !gone.includes(p.tid))); },
        async update(id, patch) { const all = ls.get(K.cls, []); const c = all.find(x => x.id === id); if (c) { if (patch.name) c.name = String(patch.name).slice(0, 60); if (patch.course) c.course = patch.course; } ls.set(K.cls, all); },
        async setMembers(id, ids) { const all = ls.get(K.cls, []); const c = all.find(x => x.id === id); if (c) c.members = ids; ls.set(K.cls, all); },
        async candidates() { return B.students().map(s => ({ id: s.id, name: s.name })); },
        async members(id) { const c = ls.get(K.cls, []).find(x => x.id === id); const st = B.students(); return (c ? c.members : []).map(m => { const s = st.find(x => x.id === m); return s ? { id: s.id, name: s.name } : null; }).filter(Boolean); },
        async memberProgress(id, course) {
          const c = ls.get(K.cls, []).find(x => x.id === id); const st = B.students();
          return (c ? c.members : []).map(m => { const s = st.find(x => x.id === m); if (!s) return null; let state = null; try { state = G.BA.decodeCode(s.code); } catch (e) { } return { id: s.id, name: s.name, state, u: s.t, local: 1 }; }).filter(x => x && x.state);
        },
        async kick(id, sid) { const all = ls.get(K.cls, []); const c = all.find(x => x.id === id); if (c) c.members = c.members.filter(m => m !== sid); ls.set(K.cls, all); }
      },
      assign: {
        async list(cid) { return ls.get(K.asg, []).filter(a => a.classId === cid).sort((a, b) => (a.due || 9e15) - (b.due || 9e15)); },
        async create(cid, a) { const all = ls.get(K.asg, []); const n = Object.assign({ id: 'a' + uid8(), classId: cid, t: now() }, a); all.push(n); ls.set(K.asg, all); return n; },
        async remove(cid, id) { ls.set(K.asg, ls.get(K.asg, []).filter(a => a.id !== id)); }
      },
      forum: {
        async threads(cid) { const ps = ls.get(K.pst, []); return ls.get(K.thr, []).filter(t => t.classId === cid).map(t => Object.assign({}, t, { n: ps.filter(p => p.tid === t.id).length, authorName: t.a === me.id ? me.name : 'Anggota' })).sort((a, b) => (b.pin - a.pin) || (b.la - a.la)); },
        async create(cid, t) { const all = ls.get(K.thr, []); const n = { id: 't' + uid8(), classId: cid, title: t.title, body: t.body, a: me.id, t: now(), la: now(), pin: 0, solved: 0 }; all.push(n); ls.set(K.thr, all); return n; },
        async posts(tid) { return ls.get(K.pst, []).filter(p => p.tid === tid).map(p => Object.assign({ authorName: p.a === me.id ? me.name : 'Anggota' }, p)).sort((a, b) => a.t - b.t); },
        async reply(tid, body) { const all = ls.get(K.pst, []); all.push({ id: 'p' + uid8(), tid, a: me.id, body, t: now() }); ls.set(K.pst, all); const th = ls.get(K.thr, []); const t = th.find(x => x.id === tid); if (t) t.la = now(); ls.set(K.thr, th); },
        async update(tid, patch) { const th = ls.get(K.thr, []); const t = th.find(x => x.id === tid); if (t) Object.assign(t, patch); ls.set(K.thr, th); },
        async remove(tid) { ls.set(K.thr, ls.get(K.thr, []).filter(t => t.id !== tid)); ls.set(K.pst, ls.get(K.pst, []).filter(p => p.tid !== tid)); },
        async removePost(tid, pid) { ls.set(K.pst, ls.get(K.pst, []).filter(p => p.id !== pid)); }
      },
      notes: { watch(cb) { cb([]); }, async send() { throw err('Pesan butuh akun online.'); }, async history() { return []; } },
      courses: {
        canEdit: true,
        async list() { return ls.get(K.crs, []).map(c => courseMeta(Object.assign({ owner_id: me.id }, c), me.id)); },
        async get(id) { const c = ls.get(K.crs, []).find(x => x.id === id); return c ? { meta: courseMeta(Object.assign({ owner_id: me.id }, c), me.id), content: c.content } : null; },
        async save(id, m, content) { const all = ls.get(K.crs, []); let c = id && all.find(x => x.id === id); if (!c) { c = { id: newCourseId(), created_at: new Date().toISOString() }; all.push(c); } Object.assign(c, pickMeta(m), { content, updated_at: new Date().toISOString() }); ls.set(K.crs, all); return c.id; },
        async remove(id) { ls.set(K.crs, ls.get(K.crs, []).filter(c => c.id !== id)); },
        async setVisibility(id, v) { if (!VIS.includes(v)) throw err('Visibilitas tidak dikenal.'); const all = ls.get(K.crs, []); const c = all.find(x => x.id === id); if (c) { c.visibility = v; ls.set(K.crs, all); } }
      },
      reports: {
        canNotify: false,
        async send(r) { const all = ls.get('nalar-local-reports', []); const row = Object.assign({ id: uuid(), user_id: me.id, status: 'baru', admin_note: '', created_at: new Date().toISOString() }, cleanReport(r)); all.unshift(row); ls.set('nalar-local-reports', all.slice(0, 200)); return row.id; },
        async mine() { return ls.get('nalar-local-reports', []).map(x => repRow(x, me.name)); },
        async all() { return ls.get('nalar-local-reports', []).map(x => repRow(x, me.name)); },
        async setStatus(id, status, note) { if (!REPORT_STATUS.includes(status)) throw err('Status tidak dikenal.'); const all = ls.get('nalar-local-reports', []); const x = all.find(r => r.id === id); if (x) { x.status = status; if (note != null) x.admin_note = String(note).slice(0, 1000); ls.set('nalar-local-reports', all); } },
        async remove(id) { ls.set('nalar-local-reports', ls.get('nalar-local-reports', []).filter(r => r.id !== id)); },
        async notify() { return null; }
      },
      async profiles(ids) { const st = B.students(); const o = {}; ids.forEach(i => { const s = st.find(x => x.id === i); o[i] = i === me.id ? me.name : s ? s.name : 'Anggota'; }); return o; }
    };
    return B;
  }

  /* Site address for links in emails (without #hash). Must be listed in Supabase → Authentication → URL Configuration. */
  const siteUrl = () => location.origin + location.pathname;
  /* =========================== SUPABASE =========================== */
  function SupabaseBackend() {
    /* keepalive lets a save that was just sent survive the tab being closed or sent to the background (phones do this
       all the time). Browsers cap keepalive bodies at 64 KB, so only small requests get it. */
    const keepFetch = (url, opt) => { opt = opt || {}; const small = !opt.body || (typeof opt.body === 'string' && opt.body.length < 60000); return fetch(url, small ? Object.assign({}, opt, { keepalive: true }) : opt); };
    const sb = G.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true }, global: { fetch: keepFetch } });
    /* If the server denies permission while the UI believes the user is signed in, the session token
       was not sent (session lost/expired). Re-check, then ask the user to sign in again. */
    let rechecking = false;
    async function recheckSession() {
      if (rechecking) return; rechecking = true;
      try { const { data } = await sb.auth.getSession(); if (!data || !data.session) { await setUser(null); G.BA && G.BA.emit && G.BA.emit('auth'); } } catch (e) { }
      rechecking = false;
    }
    const chk = (r) => {
      if (r.error) {
        const code = r.error.code, msg = r.error.message || 'Terjadi kesalahan';
        if (B.user && (code === '42501' || code === 'PGRST301' || code === 'PGRST303' || /permission denied|JWT/i.test(msg))) {
          recheckSession();
          throw err('Sesi login tidak terbaca oleh server. Coba Keluar lalu Masuk lagi (menu Akun).', 'session');
        }
        throw err(msg, code);
      }
      return r.data;
    };
    let noteCb = null, noteTimer = null, provCache = null;
    const B = {
      mode: 'supabase', online: false, isAdmin: false, user: null, client: sb,
      async init() {
        const { data } = await sb.auth.getSession();
        await setUser(data && data.session ? data.session.user : null);
        sb.auth.onAuthStateChange((ev, session) => {
          const u = session ? session.user : null;
          // A "forgot password" link opens a recovery session: the app must show the new-password form
          if (ev === 'PASSWORD_RECOVERY') { B.recovery = true; try { G.dispatchEvent(new CustomEvent('nalar-auth', { detail: 'recovery' })); } catch (e) { } }
          if ((u && u.id) !== (B.user && B.user.id)) setUser(u).then(() => G.BA && G.BA.emit && G.BA.emit('auth'));
        });
        return B;
      },
      auth: {
        get needsLogin() { return !B.user; },
        async signUp(email, password, name) { const r = await sb.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: siteUrl() } }); chk(r); return r.data; },
        /* Resend the sign-up confirmation email */
        async resend(email) { chk(await sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: siteUrl() } })); },
        /* Change password (while signed in, or after opening a "forgot password" link) */
        async updatePassword(password) { chk(await sb.auth.updateUser({ password })); B.recovery = false; },
        canEmail: true,
        async signIn(email, password) { chk(await sb.auth.signInWithPassword({ email, password })); },
        async signOut() { await sb.auth.signOut(); await setUser(null); },
        async resetPassword(email) { chk(await sb.auth.resetPasswordForEmail(email, { redirectTo: siteUrl() })); },
        /* One-time code from email (activation / password reset). Unlike links, codes cannot be "used up" by
           email link scanners, and link-free emails are far less likely to be flagged as spam. kind: 'signup' | 'recovery' */
        async verifyCode(email, code, kind) {
          const type = kind === 'recovery' ? 'recovery' : 'signup';
          let r = await sb.auth.verifyOtp({ email, token: code, type });
          // Codes from "magic link" emails (sent from the dashboard) use type 'email'
          if (r.error && type === 'signup') { const r2 = await sb.auth.verifyOtp({ email, token: code, type: 'email' }); if (!r2.error) r = r2; }
          chk(r);
          const s = r.data && r.data.session; if (!s) throw err('Kode tidak bisa dipakai. Minta kode baru.', 'otp');
          if (kind === 'recovery') B.recovery = true;
          await setUser(s.user); G.BA && G.BA.emit && G.BA.emit('auth');
          return r.data;
        },
        /* Sign in with Google: shown automatically when the Google provider is enabled in Supabase */
        async providers() {
          if (provCache) return provCache;
          try {
            const ac = typeof AbortController === 'function' ? new AbortController() : null; const t = ac && setTimeout(() => ac.abort(), 5000);
            const r = await fetch(CFG.supabaseUrl.replace(/\/+$/, '') + '/auth/v1/settings', { headers: { apikey: CFG.supabaseAnonKey }, signal: ac && ac.signal });
            if (t) clearTimeout(t);
            const j = r.ok ? await r.json() : {}; provCache = { google: !!(j.external && j.external.google) };
          } catch (e) { return { google: false }; }
          return provCache;
        },
        async signInGoogle() { chk(await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: siteUrl(), queryParams: { prompt: 'select_account' } } })); }
      },
      admin: {
        async listUsers() { return chk(await sb.rpc('admin_list_users')).map(u => ({ id: u.id, name: u.display_name, email: u.email, role: u.role, created: Date.parse(u.created_at) })); },
        async setRole(id, role) { chk(await sb.rpc('admin_set_role', { p_user: id, p_role: role })); }
      },
      async setName(n) { if (!B.user) return; chk(await sb.from('profiles').update({ display_name: n }).eq('id', B.user.id)); B.user.name = n; },
      progress: {
        async load(course) { const r = chk(await sb.from('progress').select('state').eq('user_id', B.user.id).eq('course_id', course).maybeSingle()); return r ? r.state : null; },
        async save(course, s) { chk(await sb.from('progress').upsert({ user_id: B.user.id, course_id: course, state: JSON.parse(s), updated_at: new Date().toISOString() })); }
      },
      classes: {
        canCreate: true, usesCode: true, manual: false,
        async mine() { const r = chk(await sb.from('classes').select('id,name,course_id,owner_id,join_code,created_at').order('created_at')); return r.map(c => ({ id: c.id, name: c.name, course: c.course_id, ownerId: c.owner_id, isOwner: c.owner_id === B.user.id, code: c.join_code })); },
        async create(c) { const r = chk(await sb.from('classes').insert({ name: c.name, course_id: c.course, owner_id: B.user.id }).select().single()); return { id: r.id, code: r.join_code }; },
        /* Wrong code → the server returns NULL (not an error) so the attempt is recorded for the anti-guessing limit */
        async join(code) { const id = chk(await sb.rpc('join_class', { p_code: code })); if (!id) throw err('Kode kelas tidak ditemukan. Periksa lagi hurufnya (huruf O dan angka 0, huruf I dan angka 1 tidak dipakai).', 'notfound'); return id; },
        async remove(id) { chk(await sb.from('classes').delete().eq('id', id)); },
        async update(id, patch) { const p = {}; if (patch.name) p.name = String(patch.name).slice(0, 60); if (patch.course) p.course_id = patch.course; chk(await sb.from('classes').update(p).eq('id', id)); },
        /* New code: the old link/code stops working (existing members stay) */
        async newCode(id) {
          const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          for (let i = 0; i < 5; i++) {
            const code = Array.from(crypto.getRandomValues(new Uint32Array(6)), n => A[n % 32]).join('');
            const r = await sb.from('classes').update({ join_code: code }).eq('id', id);
            if (!r.error) return code; if (r.error.code !== '23505') chk(r);
          }
          throw err('Gagal membuat kode baru. Coba lagi.');
        },
        async leave(id) { chk(await sb.from('class_members').delete().eq('class_id', id).eq('user_id', B.user.id)); },
        async members(id) { const r = chk(await sb.from('class_members').select('user_id, joined_at, profiles(display_name)').eq('class_id', id)); return r.map(m => ({ id: m.user_id, name: (m.profiles && m.profiles.display_name) || 'Anggota', joined: m.joined_at })); },
        async kick(id, sid) { chk(await sb.from('class_members').delete().eq('class_id', id).eq('user_id', sid)); },
        async memberProgress(id, course) {
          const ms = await B.classes.members(id); if (!ms.length) return [];
          const r = chk(await sb.from('progress').select('user_id,state,updated_at').eq('course_id', course).in('user_id', ms.map(m => m.id)));
          return r.map(p => ({ id: p.user_id, name: (ms.find(m => m.id === p.user_id) || {}).name, state: p.state, u: Date.parse(p.updated_at) }));
        }
      },
      assign: {
        async list(cid) { const r = chk(await sb.from('assignments').select('*').eq('class_id', cid).order('due_at', { ascending: true, nullsFirst: false })); return r.map(a => ({ id: a.id, title: a.title, desc: a.description, target: a.target, due: a.due_at ? Date.parse(a.due_at) : null, t: Date.parse(a.created_at) })); },
        async create(cid, a) { return chk(await sb.from('assignments').insert({ class_id: cid, title: a.title, description: a.desc || '', target: a.target, due_at: a.due ? new Date(a.due).toISOString() : null }).select().single()); },
        async remove(cid, id) { chk(await sb.from('assignments').delete().eq('id', id)); }
      },
      forum: {
        async threads(cid) { const r = chk(await sb.from('forum_threads').select('*, author:profiles(display_name), forum_posts(count)').eq('class_id', cid).order('pinned', { ascending: false }).order('last_activity', { ascending: false }).limit(200)); return r.map(t => ({ id: t.id, classId: t.class_id, title: t.title, body: t.body, a: t.author_id, authorName: t.author ? t.author.display_name : 'Anggota', t: Date.parse(t.created_at), la: Date.parse(t.last_activity), pin: t.pinned ? 1 : 0, solved: t.solved ? 1 : 0, n: (t.forum_posts && t.forum_posts[0] && t.forum_posts[0].count) || 0 })); },
        async create(cid, t) { return chk(await sb.from('forum_threads').insert({ class_id: cid, title: t.title, body: t.body }).select().single()); },
        async posts(tid) { const r = chk(await sb.from('forum_posts').select('*, author:profiles(display_name)').eq('thread_id', tid).order('created_at')); return r.map(p => ({ id: p.id, a: p.author_id, authorName: p.author ? p.author.display_name : 'Anggota', body: p.body, t: Date.parse(p.created_at) })); },
        async reply(tid, body) { chk(await sb.from('forum_posts').insert({ thread_id: tid, body })); },
        async update(tid, patch) { const p = {}; if ('pin' in patch) p.pinned = !!patch.pin; if ('solved' in patch) p.solved = !!patch.solved; if ('title' in patch) p.title = patch.title; if ('body' in patch) p.body = patch.body; chk(await sb.from('forum_threads').update(p).eq('id', tid)); },
        async remove(tid) { chk(await sb.from('forum_threads').delete().eq('id', tid)); },
        async removePost(tid, pid) { chk(await sb.from('forum_posts').delete().eq('id', pid)); }
      },
      notes: {
        watch(cb) { noteCb = cb; pollNotes(); clearInterval(noteTimer); noteTimer = setInterval(pollNotes, 60000); },
        async send(sid, text, link) { chk(await sb.from('messages').insert({ to_user: sid, body: String(text).slice(0, 600), link: link || null })); },
        async history(sid) { const r = chk(await sb.from('messages').select('id,body,link,created_at,read_at').eq('to_user', sid).eq('from_user', B.user.id).order('created_at').limit(30)); return r.map(m => ({ id: m.id, t: Date.parse(m.created_at), text: m.body, link: m.link, read: !!m.read_at })); },
        async markRead(id) { await sb.from('messages').update({ read_at: new Date().toISOString() }).eq('id', id); }
      },
      courses: {
        get canEdit() { return !!B.user && ['teacher', 'admin'].includes(B.user.role); },
        async list() {
          let q = sb.from('courses').select('id,title,subject,level,blurb,glyph,color,visibility,owner_id,updated_at').order('updated_at', { ascending: false }).limit(200);
          // 'class' is requested too: server-side RLS only returns class-only courses I'm allowed to open (from my classes)
          q = B.user ? q.or('visibility.in.(public,class),owner_id.eq.' + B.user.id) : q.eq('visibility', 'public');
          const r = await q; if (r.error) return []; return r.data.map(c => courseMeta(c, B.user && B.user.id));
        },
        async get(id) { const r = chk(await sb.from('courses').select('*').eq('id', id).maybeSingle()); return r ? { meta: courseMeta(r, B.user && B.user.id), content: r.content } : null; },
        async save(id, m, content) {
          const row = Object.assign(pickMeta(m), { content, updated_at: new Date().toISOString() });
          if (id) { chk(await sb.from('courses').update(row).eq('id', id)); return id; }
          return chk(await sb.from('courses').insert(row).select('id').single()).id;
        },
        async remove(id) { chk(await sb.from('courses').delete().eq('id', id)); },
        async setVisibility(id, v) { if (!VIS.includes(v)) throw err('Visibilitas tidak dikenal.'); chk(await sb.from('courses').update({ visibility: v, updated_at: new Date().toISOString() }).eq('id', id)); }
      },
      reports: {
        canNotify: true,
        /* The id is generated in the browser: anonymous visitors may not read the table, so "insert … returning" is not possible */
        async send(r) { const id = uuid(); chk(await sb.from('reports').insert(Object.assign({ id }, cleanReport(r)))); return id; },
        async mine() { if (!B.user) return []; return chk(await sb.from('reports').select('*').eq('user_id', B.user.id).order('created_at', { ascending: false }).limit(50)).map(x => repRow(x, B.user.name)); },
        async all() {
          const rows = chk(await sb.from('reports').select('*').order('created_at', { ascending: false }).limit(300));
          let users = []; try { users = await B.admin.listUsers(); } catch (e) { }
          return rows.map(x => { const u = users.find(v => v.id === x.user_id); return repRow(x, x.user_id ? (u ? u.name + (u.email ? ' <' + u.email + '>' : '') : 'Pengguna') : 'Pengunjung (belum masuk)'); });
        },
        async setStatus(id, status, note) { if (!REPORT_STATUS.includes(status)) throw err('Status tidak dikenal.'); const p = { status }; if (note != null) p.admin_note = String(note).slice(0, 1000); chk(await sb.from('reports').update(p).eq('id', id)); },
        async remove(id) { chk(await sb.from('reports').delete().eq('id', id)); },
        /* Ask the Edge Function to notify the admin. A failure here does not cancel the report. */
        async notify(id) { try { const r = await sb.functions.invoke('notify-report', { body: { id } }); return r.error ? null : r.data; } catch (e) { return null; } }
      },
      async profiles(ids) { const out = {}; ids = Array.from(new Set(ids.filter(Boolean))); if (!ids.length) return out; const r = chk(await sb.from('profiles').select('id,display_name').in('id', ids)); r.forEach(p => { out[p.id] = p.display_name; }); return out; }
    };
    async function pollNotes() {
      if (!noteCb || !B.user) return noteCb && noteCb([]);
      try { const r = chk(await sb.from('messages').select('id,body,link,created_at,read_at').eq('to_user', B.user.id).order('created_at', { ascending: false }).limit(20)); noteCb(r.reverse().map(m => ({ id: m.id, t: Date.parse(m.created_at), text: m.body, link: m.link, read: !!m.read_at }))); } catch (e) { }
    }
    async function setUser(u) {
      if (!u) { B.user = null; B.online = false; B.isAdmin = false; return; }
      const md = u.user_metadata || {};
      let name = md.display_name || md.full_name || md.name || (u.email || '').split('@')[0], role = 'student';
      try {
        const r = await sb.from('profiles').select('display_name, role').eq('id', u.id).maybeSingle();
        if (r.data) { name = r.data.display_name; role = r.data.role || 'student'; }
      } catch (e) { }
      B.user = { id: u.id, name, email: u.email, role, created: Date.parse(u.created_at) || 0 }; B.isAdmin = role === 'admin'; B.online = true; pollNotes();
    }
    return B;
  }

  /* Pick the backend */
  let chosen;
  if (CFG.supabaseUrl && CFG.supabaseAnonKey && G.supabase && G.supabase.createClient) chosen = SupabaseBackend();
  else chosen = LocalBackend();
  G.BB = chosen;
})(window);
