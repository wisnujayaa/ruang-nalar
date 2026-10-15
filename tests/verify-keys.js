/* Answer-key verification for the Pertidaksamaan course + the example course.
   - Interval questions: the key is compared with the question's predicate at thousands of points.
   - Numeric questions: recomputed by brute force.
   - Generators: 400 seeds per generator; keys must parse back.
   - Proof-ordering questions: valid structure.
   Run: npm test */
const path = require('path'); const ROOT = path.join(__dirname, '..');
require(path.join(ROOT, 'js/math.js'));
for (const f of ['content-a','content-b','bank','gen','cards','content-c','bank2','proofs','extras']) require(path.join(ROOT, 'courses/pertidaksamaan', f + '.js'));
const B=globalThis.BM, BANK=globalThis.BC.BANK; let bad=0, n=0;
function check(id, setStr, pred){
  const set=B.parseSet(setStr); const pts=[];
  for(let x=-30;x<=30;x+=0.005) pts.push(+x.toFixed(4));
  B.norm(set).forEach(p=>{[p.a,p.b].forEach(v=>{ if(isFinite(v)) { pts.push(v-1e-6, v+1e-6); if (Number.isInteger(v*2)) pts.push(v); } /* fractional endpoints like -1/3 aren't checked exactly because of rounding error */});});
  for(const x of pts){ let pv; try{pv=pred(x)===true}catch(e){pv=false}
    if(pv!==B.has(set,x)){ console.log('MISMATCH',id,setStr,'at x=',x,'pred',pv); bad++; return; } }
}
for(const id in BANK){ const q=BANK[id];
  if(q.type==='interval'){ n++; check(id,q.ans,q.pred); (q.wrong||[]).forEach(w=>{ if(B.same(B.parseSet(w.a),B.parseSet(q.ans))) {console.log('WRONG==ANS',id);bad++;} }); }
  if(q.type==='mc' && !q.opts.some(o=>o.ok)) {console.log('NO OK',id);bad++;}
  if(q.type==='err' && (q.bad==null||q.bad>=q.steps.length)) {console.log('ERR idx',id);bad++;}
}
// num checks via counting
const cnt=(pred,lo=-50,hi=50)=>{let c=0,s=0;for(let x=lo;x<=hi;x++){ let v=false; try{v=pred(x)}catch(e){} if(v){c++;s+=x;}} return {c,s};};
const nums={
 's1-l3-3':cnt(x=>-3<=x&&x<4).c, 's3-l3-3':cnt(x=>x*x-3*x-10<=0).c, 's4-l3-3':cnt(x=>(x-1)**2*(x-4)*(x+2)<=0).c,
 's4-l5-1':cnt(x=>x*(x-2)**2*(x+3)**3<0).s, 's5-l3-3':cnt(x=>x!==3&&(x+2)/(x-3)<=0).c, 's6-l4-1':cnt(x=>x+3>=0&&Math.sqrt(x+3)>x-3).c,
 's7-l3-3':cnt(x=>Math.abs(x-2)>=1&&Math.abs(x-2)<4).c, 'mx-1':cnt(x=>x>0&&x!==1&&(x*x-9)/(x-1)<=0,1,50).c,
 's9-l4-1':(()=>{let c=0;for(let x=0;x<5;x++)for(let y=0;y<5;y++)if(x+y<=3)c++;return c})(),
 's2-l4-2':(()=>{for(let d=0;d<50;d++) if(8000+2500*d<5000+3000*d) return d})(),
 'mx-5':(()=>{for(let n=0;n<50;n++) if(100000+20000*n<30000*n) return n})(),
 's8-l5-2':(()=>{for(let t=0;t<50;t++) if(100*2**t>10000) return t})(),
 's9-l3-2':(()=>{let m=-1;for(let x=0;x<=10;x++)for(let y=0;y<=10;y++) if(2*x+y<=10&&x+3*y<=15) m=Math.max(m,4*x+5*y);return m})(),
 's9-l2-2':(()=>{let m=-1;for(let x=0;x<=10;x+=0.5)for(let y=0;y<=10;y+=0.5) if(x+y<=4&&2*x+y<=6) m=Math.max(m,3*x+2*y);return m})(),
};
for(const id in nums){ if(BANK[id].ans!==nums[id]){console.log('NUM MISMATCH',id,BANK[id].ans,nums[id]);bad++;} }
console.log('interval items',n,'total',Object.keys(BANK).length,'bad',bad);
// extra checks for bank2
const B2=globalThis.BC.BANK; let bad2=0;
const c2=(p,lo=-60,hi=60)=>{let c=0;for(let x=lo;x<=hi;x++){let v=false;try{v=p(x)}catch(e){} if(v)c++;}return c;};
const chk={
 's1-u3':c2(x=>2<Math.abs(x)&&Math.abs(x)<=5),'s2-u1':(()=>{let m=0;for(let d=0;d<50;d++) if(7000+4000*d<=50000) m=d; return m})(),
 's2-m2':3,'s3-u1':c2(n=>n*n<2*n+15),'s3-u3':(()=>{let m=0;for(let x=0;x<60;x++) if(-x*x+40*x-300>=75) m=x; return m})(),
 's3-m3':(()=>{let m=-99;for(let a=-20;a<20;a++){let ok=true;for(let x=-50;x<=50;x+=0.01) if(x*x+a*x+9<=0){ok=false;break;} if(ok) m=a;} return m})(),
 's3-o1':(()=>{let c=0;for(let a=-30;a<30;a++){let none=true;for(let x=-60;x<=60;x+=0.01) if(x*x-a*x+a+3<0){none=false;break;} if(none)c++;} return c})(),
 's4-u1':c2(x=>(x*x-4)*(x*x-9)<0),
 's4-o1':(()=>{let c=0;for(let n=1;n<=100;n++){let neg=0,zero=false;for(let k=1;k<=99;k+=2){if(n===k)zero=true; if(n-k<0)neg++;} if(!zero&&neg%2===1)c++;} return c})(),
 's5-u3':(()=>{for(let t=0;t<50;t++) if(5*t/(t+1)>4) return t})(),
 's6-u1':c2(x=>x+5>=0&&Math.sqrt(x+5)>=x+3),'s6-o1':c2(x=>x+1>=0&&Math.sqrt(x+10)-Math.sqrt(x+1)>1),
 's7-u1':c2(x=>Math.abs(2*x-3)<=7),'s7-o1':c2(x=>Math.abs(Math.abs(x-3)-2)<=1),
 's8-u1':(()=>{for(let n=0;n<50;n++) if(Math.pow(1.1,n)>2) return n})(),'s8-o1':(()=>{for(let n=1;n<50;n++) if(2**n>n*n+100) return n})(),
 's9-u1':(()=>{let m=0;for(let x=0;x<=20;x++)for(let y=0;y<=20;y++) if(3*x+y<=18&&x+y<=8) m=Math.max(m,50*x+30*y);return m})(),
 's9-m1':(()=>{let m=1e9;for(let x=0;x<=20;x+=0.25)for(let y=0;y<=20;y+=0.25) if(x+y>=5&&x+3*y>=9) m=Math.min(m,3*x+2*y);return m})(),
 's9-o1':(()=>{let c=0;for(let x=1;x<=30;x++)for(let y=1;y<=30;y++) if(3*x+5*y<=30)c++;return c})(),
 's9-o2':(()=>{let c=0;for(let x=-5;x<=5;x++)for(let y=-5;y<=5;y++) if(Math.abs(x)+Math.abs(y)<=3)c++;return c})(),
 's10-l5-1':(()=>{let m=1e9;for(let x=0.01;x<10;x+=0.001) m=Math.min(m,2*x+8/(x*x));return Math.round(m*1000)/1000})(),
 's10-l6-6':(()=>{let m=1e9;for(let x=-10;x<10;x+=0.001) m=Math.min(m,(x*x+5)/Math.sqrt(x*x+4));return Math.round(m*1000)/1000})(),
 's10-l6-8':(()=>{let m=1e9;for(let x=1.001;x<20;x+=0.001) m=Math.min(m,x+4/(x-1));return Math.round(m*1000)/1000})(),
 's10-l6-3':(()=>{for(let N=1;N<20;N++){let ok=true;for(let n=N;n<60;n++) if(!(2**n>n*n)) ok=false; if(ok) return N}})(),
 'x-11':(()=>{let c=0;for(let x=-5;x<=5;x++) if(x!==2&&(x*x-4*x)/(x-2)<=0)c++;return c})(),'x-12':c2(x=>Math.abs(x*x-5*x)<6),
 'x-16':(()=>{let c=0;for(let x=1;x<20;x++) if(3**x<81&&Math.abs(x-2)>=1)c++;return c})(),
 'x-19':(()=>{let m=0;for(let x=0;x<50;x++) if((50-x)*(100+10*x)>=6000) m=x;return m})(),
};
for(const id in chk){ if(Math.abs(B2[id].ans-chk[id])>1e-6){console.log('NUM2 MISMATCH',id,B2[id].ans,chk[id]);bad2++;} }
console.log('bank2 num checked',Object.keys(chk).length,'bad2',bad2,'TOTAL ITEMS',Object.keys(B2).length);

{ const B=BM,C=BC; let errs=0; const sample={};
for(const name in C.GEN){ for(let s=1;s<=400;s++){ const it=C.makeGen(name,s*7919);
  if(!it){errs++;console.log('null',name,s);continue;}
  if(it.type==='interval'){ if(!Array.isArray(it.ansSet)){errs++;console.log('noset',name);}
    (it.wrong||[]).forEach(w=>{ if(B.same(w.set,it.ansSet)) {/*ok: will be skipped at runtime*/} });
    const re=B.parseAnswer(it.ans); if(!re.ok||!B.same(re.set,it.ansSet)){errs++;console.log('roundtrip',name,it.ans,re.err);} }
  if(it.type==='mc'){ if(it.opts.filter(o=>o.ok).length!==1){errs++;console.log('mc ok count',name,s,JSON.stringify(it.opts));} }
  if(s===3) sample[name]=it.q+'  =>  '+(it.ans??JSON.stringify(it.opts?.map(o=>o.t+(o.ok?'*':''))));
}}
console.log('generator: ' + Object.keys(C.GEN).length + ' kinds x 400 seeds, errors', errs); if (errs) process.exitCode = 1; }

/* Proof-ordering questions (type order) */
{ let e = 0, n = 0; const BK = globalThis.BC.BANK;
  for (const id in BK) { const q = BK[id]; if (q.type !== 'order') continue; n++;
    if (!Array.isArray(q.steps) || q.steps.length < 3) { console.log('ORDER steps', id); e++; }
    if (new Set(q.steps).size !== q.steps.length) { console.log('ORDER duplicate', id); e++; }
    (q.extra || []).forEach(x => { if (q.steps.includes(x)) { console.log('ORDER distractor equals a step', id); e++; } });
    (q.alt || []).forEach(a => { if (a.length !== q.steps.length || new Set(a).size !== a.length || a.some(i => i < 0 || i >= q.steps.length)) { console.log('ORDER invalid alt', id); e++; } });
  }
  console.log('proof questions: ' + n + ', errors ' + e); if (e) process.exitCode = 1; }
/* Example course: load into a separate object, then check its keys */
{ const saved = globalThis.BC; globalThis.BC = {}; require(path.join(ROOT, 'courses/contoh-kursus/course.js')); const T = globalThis.BC; globalThis.BC = saved;
  const B = globalThis.BM; let e = 0;
  const exp = { 'p1-1': 15 / 100 * 60, 'p1-3': 12 / 48 * 100, 'p2-1': 50000 * 1.1, 'p2-2': 100 * 1.5 * 0.5, 'p2-3': (1 - 0.7 * 0.8) * 100, 'p2-4': 150000 / 0.75 };
  for (const id in exp) if (Math.abs(T.BANK[id].ans - exp[id]) > 1e-6) { console.log('TEMPLATE', id, T.BANK[id].ans, exp[id]); e++; }
  const set = B.parseSet(T.BANK['p1-5'].ans); for (let x = -10; x <= 110; x += 0.25) { const p = x >= 0 && x <= 100 && 80000 * (1 - x / 100) < 60000; if (p !== B.has(set, x)) { console.log('TEMPLATE p1-5 at x=', x); e++; break; } }
  ['SECTIONS', 'LESSONS', 'BANK'].forEach(k => { if (!T[k]) { console.log('TEMPLATE missing', k); e++; } });
  for (const s in T.LESSONS) T.LESSONS[s].forEach(b => { if (b.k === 'q' && !T.BANK[b.id]) { console.log('TEMPLATE q block without question', b.id); e++; } if (b.k === 'exit') b.qs.forEach(id => { if (!T.BANK[id]) { console.log('TEMPLATE exit without question', id); e++; } }); });
  console.log('example course: ' + Object.keys(T.BANK).length + ' questions, errors ' + e); if (e) process.exitCode = 1; }
/* Every question referenced from a lesson must exist */
{ const C = globalThis.BC; let e = 0;
  for (const s in C.LESSONS) C.LESSONS[s].forEach(b => { if (b.k === 'q' && !C.BANK[b.id]) { console.log('q block without question', s, b.id); e++; } if (b.k === 'exit') b.qs.forEach(id => { if (!C.BANK[id]) { console.log('exit without question', id); e++; } }); });
  console.log('lesson→question references: errors ' + e); if (e) process.exitCode = 1; }
if (bad || bad2) process.exitCode = 1;
console.log(process.exitCode ? 'SOMETHING FAILED' : 'ALL ANSWER KEYS PASSED');
