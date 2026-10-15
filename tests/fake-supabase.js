/* Supabase palsu di memori (RLS hanya ditiru untuk akses kursus) untuk menguji alur UI mode Supabase. Dibagi antar tab via localStorage. */
(function () {
  const K = 'FAKE_SB';
  const load = () => JSON.parse(localStorage.getItem(K) || '{"users":[],"profiles":[],"progress":[],"classes":[],"class_members":[],"assignments":[],"forum_threads":[],"forum_posts":[],"messages":[],"courses":[]}');
  const save = (d) => localStorage.setItem(K, JSON.stringify(d));
  const uuid = () => 'u' + Math.random().toString(16).slice(2, 10) + Date.now().toString(16);
  let session = JSON.parse(sessionStorage.getItem('FAKE_SESSION') || 'null');
  const listeners = [];
  const setSession = (s) => { session = s; sessionStorage.setItem('FAKE_SESSION', JSON.stringify(s)); listeners.forEach(f => f(s ? 'SIGNED_IN' : 'SIGNED_OUT', s)); };
  const me = () => session && session.user.id;
  function enrich(table, row, sel, db) {
    const r = Object.assign({}, row);
    if (/profiles\(display_name\)/.test(sel)) { const key = table === 'class_members' ? 'user_id' : 'author_id'; const p = db.profiles.find(p => p.id === row[key]); const alias = /author:profiles/.test(sel) ? 'author' : 'profiles'; r[alias] = p ? { display_name: p.display_name } : null; }
    if (/forum_posts\(count\)/.test(sel)) r.forum_posts = [{ count: db.forum_posts.filter(p => p.thread_id === row.id).length }];
    return r;
  }
  function Q(table) {
    const st = { op: 'select', filters: [], sel: '*', single: false, maybe: false, order: [], limit: null, payload: null, ret: false };
    const q = {
      select(s) { if (st.op === 'select') st.sel = s || '*'; else st.ret = true; return q; },
      eq(c, v) { st.filters.push(r => r[c] === v); return q; },
      in(c, vs) { st.filters.push(r => vs.includes(r[c])); return q; },
      or(expr) { const parts = expr.split(/,(?![^()]*\))/).map(x => x.split('.')); st.filters.push(r => parts.some(([c, op, ...v]) => { v = v.join('.'); return op === 'eq' ? String(r[c]) === v : op === 'in' ? v.replace(/[()]/g, '').split(',').includes(String(r[c])) : false; })); return q; },
      order(c, o) { st.order.push([c, !o || o.ascending !== false]); return q; },
      limit(n) { st.limit = n; return q; },
      single() { st.single = true; return q; }, maybeSingle() { st.maybe = true; return q; },
      insert(o) { st.op = 'insert'; st.payload = o; return q; }, upsert(o) { st.op = 'upsert'; st.payload = o; return q; },
      update(o) { st.op = 'update'; st.payload = o; return q; }, delete() { st.op = 'delete'; return q; },
      then(res, rej) { return Promise.resolve().then(run).then(res, rej); }
    };
    /* Tiruan RLS kursus (lihat supabase/course-access.sql) */
    const canRead = (db, k) => ['unlisted', 'public'].includes(k.visibility) || k.owner_id === me() ||
      (k.visibility === 'class' && db.classes.some(c => c.course_id === k.id && c.owner_id === k.owner_id && (c.owner_id === me() || db.class_members.some(m => m.class_id === c.id && m.user_id === me()))));
    const guard = (db, ownerId, cid) => !/^c-/.test(cid || '') || db.courses.some(k => k.id === cid && (k.owner_id === ownerId || ['unlisted', 'public'].includes(k.visibility)));
    function run() {
      const db = load(); const T = db[table] || (db[table] = []); const now = new Date().toISOString();
      if (table === 'classes' && (st.op === 'insert' || (st.op === 'update' && st.payload && 'course_id' in st.payload)) && !guard(db, st.op === 'insert' ? me() : (T.find(r => st.filters.every(f => f(r))) || {}).owner_id, st.payload.course_id))
        return { data: null, error: { message: 'Kursus ini terkunci dan tidak bisa dipakai di kelasmu.', code: 'P0001' } };
      if (st.op === 'insert') {
        const row = Object.assign({ id: uuid(), created_at: now }, st.payload);
        if (table === 'reports') Object.assign(row, { user_id: me(), status: 'baru', admin_note: '', notified_at: null });
        if (table === 'classes') row.join_code = Math.random().toString(36).slice(2, 8).toUpperCase().replace(/[01IO]/g, 'X');
        if (table === 'forum_threads') Object.assign(row, { author_id: me(), pinned: false, solved: false, last_activity: now, body: row.body || '' });
        if (table === 'forum_posts') { row.author_id = me(); const t = db.forum_threads.find(t => t.id === row.thread_id); if (t) t.last_activity = now; }
        if (table === 'messages') { row.from_user = me(); row.read_at = null; }
        if (table === 'assignments') row.created_by = me();
        if (table === 'courses') { row.id = 'c-' + Math.random().toString(36).slice(2, 12); row.owner_id = me(); row.updated_at = now; }
        T.push(row); save(db); return { data: st.single || st.ret ? row : null, error: null };
      }
      if (st.op === 'upsert') { const i = T.findIndex(r => r.user_id === st.payload.user_id && r.course_id === st.payload.course_id); if (i >= 0) T[i] = Object.assign(T[i], st.payload); else T.push(st.payload); save(db); return { data: null, error: null }; }
      let rows = T.filter(r => st.filters.every(f => f(r)) && (table !== 'courses' || st.op !== 'select' || canRead(db, r)) && (table !== 'reports' || r.user_id === me() || (db.profiles.find(p => p.id === me()) || {}).role === 'admin'));
      if (st.op === 'update') { rows.forEach(r => Object.assign(r, st.payload)); save(db); return { data: null, error: null }; }
      if (st.op === 'delete') { db[table] = T.filter(r => !rows.includes(r)); if (table === 'forum_threads') db.forum_posts = db.forum_posts.filter(p => !rows.some(r => r.id === p.thread_id)); save(db); return { data: null, error: null }; }
      for (const [c, asc] of st.order.slice().reverse()) rows.sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1));
      if (st.limit) rows = rows.slice(0, st.limit);
      rows = rows.map(r => enrich(table, r, st.sel, db));
      if (st.single) return rows[0] ? { data: rows[0], error: null } : { data: null, error: { message: 'not found' } };
      if (st.maybe) return { data: rows[0] || null, error: null };
      return { data: rows, error: null };
    }
    return q;
  }
  window.supabase = { createClient: () => ({
    from: Q,
    functions: { invoke: async (name, o) => { const d = load(); (d.invoked = d.invoked || []).push({ name, body: o && o.body }); save(d); return { data: { ok: true, sent: true, channels: { email: 'tidak diatur' } }, error: null }; } },
    rpc: async (fn, a) => {
      const db0 = load(); const myRole = (db0.profiles.find(p => p.id === me()) || {}).role;
      if (fn === 'admin_list_users') { if (myRole !== 'admin') return { data: null, error: { message: 'Hanya admin' } }; return { data: db0.profiles.map(p => ({ id: p.id, display_name: p.display_name, email: (db0.users.find(u => u.id === p.id) || {}).email, role: p.role, created_at: new Date().toISOString() })), error: null }; }
      if (fn === 'admin_set_role') { if (myRole !== 'admin') return { data: null, error: { message: 'Hanya admin' } }; const p = db0.profiles.find(x => x.id === a.p_user); p.role = a.p_role; save(db0); return { data: null, error: null }; }
      if (fn !== 'join_class') return { error: { message: 'no fn' } }; const db = load(); const c = db.classes.find(c => c.join_code === String(a.p_code).trim().toUpperCase()); if (!c) return { data: null, error: null }; if (!db.class_members.some(m => m.class_id === c.id && m.user_id === me())) db.class_members.push({ class_id: c.id, user_id: me(), joined_at: new Date().toISOString() }); save(db); return { data: c.id, error: null }; },
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: (f) => { listeners.push(f); return { data: { subscription: { unsubscribe() {} } } }; },
      signUp: async ({ email, password, options }) => { const db = load(); if (db.users.some(u => u.email === email)) return { error: { message: 'User already registered' } }; const u = { id: uuid(), email, password, user_metadata: options.data, redirect: options.emailRedirectTo }; db.users.push(u); db.profiles.push({ id: u.id, display_name: options.data.display_name, role: 'student' }); save(db);
        if (localStorage.getItem('FAKE_CONFIRM')) { u.unconfirmed = true; u.code = '123456'; save(Object.assign(db, { users: db.users })); return { data: { session: null, user: u }, error: null }; }
        setSession({ user: u }); return { data: { session: { user: u } }, error: null }; },
      resend: async ({ type, email }) => { const d = load(); (d.resent = d.resent || []).push({ type, email }); save(d); return { data: {}, error: null }; },
      updateUser: async ({ password }) => { if (!session) return { error: { message: 'Auth session missing!' } }; const d = load(); const u = d.users.find(x => x.id === session.user.id); if (u.password === password) return { error: { message: 'New password should be different from the old password.', code: 'same_password' } }; u.password = password; save(d); return { data: { user: u }, error: null }; },
      signInWithPassword: async ({ email, password }) => { const u = load().users.find(u => u.email === email && u.password === password); if (!u) return { error: { message: 'Invalid login credentials' } }; if (u.unconfirmed) return { error: { message: 'Email not confirmed', code: 'email_not_confirmed' } }; setSession({ user: u }); return { data: {}, error: null }; },
      signOut: async () => setSession(null),
      resetPasswordForEmail: async (email, o) => { const d = load(); const u = d.users.find(x => x.email === email); if (u) { u.rcode = '654321'; u.rredirect = o && o.redirectTo; } save(d); return { data: {}, error: null }; },
      /* Kode 6 digit dari email: 123456 untuk aktivasi, 654321 untuk lupa sandi */
      verifyOtp: async ({ email, token, type }) => { const d = load(); const u = d.users.find(x => x.email === email); (d.verified = d.verified || []).push({ email, type }); save(d);
        const ok = u && ((type === 'signup' || type === 'email') && token === u.code || type === 'recovery' && token === u.rcode);
        if (!ok) return { data: { session: null, user: null }, error: { message: 'Token has expired or is invalid', code: 'otp_expired' } };
        u.unconfirmed = false; save(d); setSession({ user: u }); return { data: { session: { user: u }, user: u }, error: null }; },
      signInWithOAuth: async ({ provider, options }) => { const d = load(); d.oauth = { provider, redirectTo: options && options.redirectTo }; save(d); return { data: { provider, url: null }, error: null }; }
    }
  }) };
})();
