/* Ruang Nalar — lapisan backend.
   Satu antarmuka, tiga implementasi:
   - supabase : dipakai jika config.js berisi supabaseUrl & supabaseAnonKey (untuk GitHub Pages / hosting sendiri)
   - claude   : dipakai jika halaman berjalan sebagai Artifact di claude.ai
   - local    : cadangan; semua data di browser ini saja (mode demo / tanpa akun)
   Antarmuka yang dipakai UI:
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

  /* =========================== LOCAL =========================== */
  function LocalBackend() {
    const K = { cls: 'nalar-local-classes', stu: 'nalar-local-students', asg: 'nalar-local-assign', thr: 'nalar-local-threads', pst: 'nalar-local-posts', me: 'nalar-local-me' };
    const me = ls.get(K.me, null) || (() => { const m = { id: 'local', name: 'Kamu' }; ls.set(K.me, m); return m; })();
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
        async remove(id) { ls.set(K.cls, ls.get(K.cls, []).filter(c => c.id !== id)); },
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
      async profiles(ids) { const st = B.students(); const o = {}; ids.forEach(i => { const s = st.find(x => x.id === i); o[i] = i === me.id ? me.name : s ? s.name : 'Anggota'; }); return o; }
    };
    return B;
  }

  /* =========================== CLAUDE ARTIFACT =========================== */
  function ClaudeBackend() {
    let db = null, user = null; const subs = {};
    const B = {
      mode: 'claude', online: false, isAdmin: false, user: null,
      async init() {
        try {
          [db, user] = await Promise.all([G.claude.use('db'), G.claude.use('user')]);
          const id = user ? await user.id() : null;
          B.isAdmin = user ? await user.isOwner() : false;
          if (db && id) { const nm = user ? (await user.me()).name : ''; B.user = { id, name: nm || 'Kamu' }; B.online = true; }
        } catch (e) { B.online = false; }
        return B;
      },
      auth: { needsLogin: false, async signOut() { } },
      progress: {
        async load(course) {
          const ref = db.doc('progress/' + B.user.id + '/kursus/' + course); let sn = await ref.get();
          if (!sn.exists && course === 'pertidaksamaan') { const old = await db.doc('progress/' + B.user.id).get(); if (old.exists && old.data().s) return old.data().s; }
          if (subs.p) subs.p();
          subs.p = ref.onSnapshot(x => { if (x.exists && !x.metadata.hasPendingWrites && subs.cb) subs.cb(course, x.data().s); }, () => { });
          return sn.exists ? sn.data().s : null;
        },
        async save(course, s) {
          try {
            await db.doc('progress/' + B.user.id + '/kursus/' + course).set({ s, u: now() });
            const nick = (G.BA && G.BA.S && G.BA.S.nick) || '';
            await db.doc('progress/' + B.user.id).set({ u: now(), nick, last: course });
          } catch (e) { throw err(e.message || 'gagal', e.code === 'invalid_argument' ? 'readonly' : e.code); }
        },
        watch(cb) { subs.cb = cb; }
      },
      classes: {
        get canCreate() { return B.isAdmin; }, usesCode: false, manual: true,
        async mine() {
          const q = await db.collection('kelas').limit(100).get();
          return q.docs.map(d => Object.assign({ id: d.id }, d.data())).filter(c => B.isAdmin || (c.members || []).includes(B.user.id)).map(c => ({ id: c.id, name: c.name, course: c.course || 'pertidaksamaan', members: c.members || [], isOwner: B.isAdmin, ownerId: null }));
        },
        async create(c) { const id = 'k' + uid8(); await db.doc('kelas/' + id).set({ name: c.name, course: c.course, members: [], t: now() }); return { id }; },
        async remove(id) { await db.doc('kelas/' + id).delete(); },
        async setMembers(id, ids) { const sn = await db.doc('kelas/' + id).get(); const d = sn.exists ? sn.data() : {}; await db.doc('kelas/' + id).set(Object.assign({}, d, { members: ids })); },
        async candidates() { const q = await db.collection('progress').limit(200).get(); const ids = q.docs.map(d => d.id); const names = await B.profiles(ids, q.docs); return ids.map(id => ({ id, name: names[id] })); },
        async members(id) { const sn = await db.doc('kelas/' + id).get(); const ids = sn.exists ? (sn.data().members || []) : []; const names = await B.profiles(ids); return ids.map(i => ({ id: i, name: names[i] })); },
        async memberProgress(id, course) {
          const ms = await B.classes.members(id); const out = [];
          for (const m of ms) {
            let sn = await db.doc('progress/' + m.id + '/kursus/' + course).get(); let s = sn.exists ? sn.data().s : null; let u = sn.exists ? sn.data().u : null;
            if (!s && course === 'pertidaksamaan') { const o = await db.doc('progress/' + m.id).get(); if (o.exists && o.data().s) { s = o.data().s; u = o.data().u; } }
            if (s) { try { out.push({ id: m.id, name: m.name, state: JSON.parse(s), u }); } catch (e) { } }
          }
          return out;
        },
        async kick(id, sid) { const sn = await db.doc('kelas/' + id).get(); if (sn.exists) await B.classes.setMembers(id, (sn.data().members || []).filter(m => m !== sid)); }
      },
      assign: {
        async list(cid) { const q = await db.collection('kelas/' + cid + '/tugas').limit(200).get(); return q.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => (a.due || 9e15) - (b.due || 9e15)); },
        async create(cid, a) { const id = 'a' + uid8(); await db.doc('kelas/' + cid + '/tugas/' + id).set(Object.assign({ t: now() }, a)); return { id }; },
        async remove(cid, id) { await db.doc('kelas/' + cid + '/tugas/' + id).delete(); }
      },
      forum: {
        async threads(cid) { const q = await db.collection('forum').where('cls', '==', cid).limit(300).get(); const list = q.docs.map(d => Object.assign({ id: d.id }, d.data())); const names = await B.profiles(list.map(t => t.a)); return list.map(t => ({ id: t.id, classId: t.cls, title: t.title, body: t.body, a: t.a, authorName: names[t.a], t: t.t, la: t.la || t.t, pin: t.pin ? 1 : 0, solved: t.solved ? 1 : 0, n: t.n || 0 })).sort((a, b) => (b.pin - a.pin) || (b.la - a.la)); },
        async create(cid, t) { const id = 't' + uid8(); await db.doc('forum/' + id).set({ cls: cid, title: t.title, body: t.body, a: B.user.id, t: now(), la: now(), pin: false, solved: false, n: 0 }); return { id }; },
        async posts(tid) { const q = await db.collection('forum/' + tid + '/posts').limit(500).get(); const list = q.docs.map(d => Object.assign({ id: d.id }, d.data())); const names = await B.profiles(list.map(p => p.a)); return list.map(p => Object.assign(p, { authorName: names[p.a] })).sort((a, b) => a.t - b.t); },
        async reply(tid, body) { await db.doc('forum/' + tid + '/posts/p' + uid8()).set({ a: B.user.id, body, t: now() }); const sn = await db.doc('forum/' + tid).get(); if (sn.exists) await db.doc('forum/' + tid).update({ la: now(), n: (sn.data().n || 0) + 1 }); },
        async update(tid, patch) { const p = {}; if ('pin' in patch) p.pin = !!patch.pin; if ('solved' in patch) p.solved = !!patch.solved; if ('title' in patch) p.title = patch.title; if ('body' in patch) p.body = patch.body; await db.doc('forum/' + tid).update(p); },
        async remove(tid) { await db.doc('forum/' + tid).delete(); },
        async removePost(tid, pid) { await db.doc('forum/' + tid + '/posts/' + pid).delete(); }
      },
      notes: {
        watch(cb) { if (!B.online) return cb([]); db.doc('pesan/' + B.user.id).onSnapshot(sn => cb(sn.exists ? (sn.data().items || []) : []), () => cb([])); },
        async history(sid) { const sn = await db.doc('pesan/' + sid).get(); return sn.exists ? (sn.data().items || []) : []; },
        async send(sid, text, link) { const ref = db.doc('pesan/' + sid); const sn = await ref.get(); const items = (sn.exists ? (sn.data().items || []) : []).slice(-19); items.push({ id: 'n' + now(), t: now(), text: String(text).slice(0, 600), link: link || null }); await ref.set({ items }); }
      },
      async profiles(ids, progDocs) {
        const out = {}; ids = Array.from(new Set(ids.filter(Boolean)));
        try { const ps = user ? await user.profiles(ids) : {}; ids.forEach(i => { out[i] = (ps[i] && ps[i].name) || ''; }); } catch (e) { }
        const miss = ids.filter(i => !out[i]);
        for (const i of miss) { try { const d = progDocs ? progDocs.find(x => x.id === i) : null; const data = d ? d.data() : ((await db.doc('progress/' + i).get()).data() || {}); out[i] = data.nick || 'Anggota'; } catch (e) { out[i] = 'Anggota'; } }
        if (B.user) out[B.user.id] = out[B.user.id] || B.user.name;
        return out;
      }
    };
    return B;
  }

  /* =========================== SUPABASE =========================== */
  function SupabaseBackend() {
    const sb = G.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } });
    /* Jika server menolak karena tidak ada izin padahal UI mengira sudah masuk, berarti token sesi
       tidak ikut terkirim (sesi hilang/kedaluwarsa). Periksa ulang lalu minta pengguna masuk lagi. */
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
    let noteCb = null, noteTimer = null;
    const B = {
      mode: 'supabase', online: false, isAdmin: false, user: null, client: sb,
      async init() {
        const { data } = await sb.auth.getSession();
        await setUser(data && data.session ? data.session.user : null);
        sb.auth.onAuthStateChange((_ev, session) => { const u = session ? session.user : null; if ((u && u.id) !== (B.user && B.user.id)) setUser(u).then(() => G.BA && G.BA.emit && G.BA.emit('auth')); });
        return B;
      },
      auth: {
        get needsLogin() { return !B.user; },
        async signUp(email, password, name) { const r = await sb.auth.signUp({ email, password, options: { data: { display_name: name } } }); chk(r); return r.data; },
        async signIn(email, password) { chk(await sb.auth.signInWithPassword({ email, password })); },
        async signOut() { await sb.auth.signOut(); await setUser(null); },
        async resetPassword(email) { chk(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] })); }
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
        async join(code) { return chk(await sb.rpc('join_class', { p_code: code })); },
        async remove(id) { chk(await sb.from('classes').delete().eq('id', id)); },
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
      async profiles(ids) { const out = {}; ids = Array.from(new Set(ids.filter(Boolean))); if (!ids.length) return out; const r = chk(await sb.from('profiles').select('id,display_name').in('id', ids)); r.forEach(p => { out[p.id] = p.display_name; }); return out; }
    };
    async function pollNotes() {
      if (!noteCb || !B.user) return noteCb && noteCb([]);
      try { const r = chk(await sb.from('messages').select('id,body,link,created_at,read_at').eq('to_user', B.user.id).order('created_at', { ascending: false }).limit(20)); noteCb(r.reverse().map(m => ({ id: m.id, t: Date.parse(m.created_at), text: m.body, link: m.link, read: !!m.read_at }))); } catch (e) { }
    }
    async function setUser(u) {
      if (!u) { B.user = null; B.online = false; return; }
      let name = (u.user_metadata && u.user_metadata.display_name) || (u.email || '').split('@')[0];
      try { const p = chk(await sb.from('profiles').select('display_name').eq('id', u.id).maybeSingle()); if (p) name = p.display_name; } catch (e) { }
      B.user = { id: u.id, name, email: u.email }; B.online = true; pollNotes();
    }
    return B;
  }

  /* Pilih backend */
  let chosen;
  if (CFG.supabaseUrl && CFG.supabaseAnonKey && G.supabase && G.supabase.createClient) chosen = SupabaseBackend();
  else if (G.claude && G.claude.use) chosen = ClaudeBackend();
  else chosen = LocalBackend();
  G.BB = chosen;
  G.BB_LOCAL = chosen.mode === 'local' ? chosen : null;
  G.NALAR_makeLocal = LocalBackend;
  G.NALAR_makeClaude = ClaudeBackend;
})(window);
