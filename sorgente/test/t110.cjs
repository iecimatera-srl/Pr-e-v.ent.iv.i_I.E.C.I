// Confronto tra marche con TRE impianti: per ogni prodotto scelgo io, in modo indipendente, in quali impianti va
// (es. A e C sì, B no). Nessuna casella = componenti comuni (una volta sola).
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S,null,{timeout:30000});await p.waitForTimeout(800);
const S=(f,a)=>p.evaluate(f,a);
await S(()=>document.querySelector('[data-m="vcit"]').click()); await p.waitForTimeout(300);
await S(()=>document.querySelector('[data-vck="brands"]').click()); await p.waitForTimeout(600);
await S(()=>{ const b=document.querySelector('[data-sy^="add:"]'); b&&b.click(); }); await p.waitForTimeout(600);
const n=await S(()=>window.IECI_T.S().cond.sys.length);
ok(n===3,'tre impianti a confronto ('+n+')');
await S(()=>{ const s=window.IECI_T.S(); s.cond.sys[0].b='Bticino'; s.cond.sys[1].b='Urmet'; s.cond.sys[2].b='Comelit'; window.IECI_T.touch(); window.IECI_T.renderAll(); }); await p.waitForTimeout(400);
const ids=await S(()=>window.IECI_T.S().cond.sys.map(x=>x.id));
const idx=await S(()=>{ const s=window.IECI_T.S(); s.products.push({id:'pall',name:'Alimentatore di sistema',brand:'',code:'',desc:'Alimenta l\'impianto',specs:'',link:'',tags:'',photos:[]}); window.IECI_T.touch(); window.IECI_T.renderAll(); return s.products.length-1; });
await S(()=>window.IECI_T.showPanel('prodotti')); await p.waitForTimeout(600);
const box=(id)=>'[data-psy="'+idx+':'+id+'"]';
await A.mostra(p,box(ids[0]));
ok(await S(i=>document.querySelectorAll('[data-psy^="'+i+':"]').length,idx)===4,'nella scheda prodotto: una casella per ognuno dei 3 impianti + «Componenti comuni»');
ok(await S(s=>document.querySelector(s).checked,box('')),'all\'inizio il prodotto è tra i componenti comuni');
const gruppi=()=>S(()=>{ const out={}; let cur=''; document.querySelectorAll('#doc .pgrp-t, #doc .pgrp-mini, #doc .prod h3').forEach(e=>{ if(e.matches('.pgrp-t')) cur=e.textContent; else if(e.matches('.pgrp-mini')) cur=e.textContent.replace(/ · continua$/,''); else (out[cur]=out[cur]||[]).push(e.textContent); }); return out; });
const dove=async()=>{ const g=await gruppi(); const r={}; ['Bticino','Urmet','Comelit','comuni'].forEach(k=>{ r[k]=Object.keys(g).filter(t=>new RegExp(k,'i').test(t)).some(t=>g[t].includes('Alimentatore di sistema')); }); return r; };
const spunta=async(id,v)=>{ await A.mostra(p,box(id)); const c=await S(s=>document.querySelector(s).checked,box(id)); if(c!==v){ await p.click(box(id)); await p.waitForTimeout(400); } };
// A e C sì, B no
await spunta(ids[0],true); await spunta(ids[2],true);
let r=await dove(); console.log('     A+C: '+JSON.stringify(r));
ok(r.Bticino&&!r.Urmet&&r.Comelit&&!r.comuni,'spuntati A (Bticino) e C (Comelit): compare sotto Bticino e Comelit, NON sotto Urmet né tra i comuni');
ok(await S(()=>window.IECI_T.S().products.find(x=>x.id==='pall').sys.split('|').length===2),'scelta salvata nel prodotto (due impianti)');
// B e C sì, A no
await spunta(ids[0],false); await spunta(ids[1],true);
r=await dove(); console.log('     B+C: '+JSON.stringify(r));
ok(!r.Bticino&&r.Urmet&&r.Comelit&&!r.comuni,'spuntati B e C: compare sotto Urmet e Comelit, non sotto Bticino');
// solo B
await spunta(ids[2],false);
r=await dove();
ok(!r.Bticino&&r.Urmet&&!r.Comelit&&!r.comuni,'solo B: compare solo sotto Urmet');
// tutti e tre
await spunta(ids[0],true); await spunta(ids[2],true);
r=await dove();
ok(r.Bticino&&r.Urmet&&r.Comelit&&!r.comuni,'tutti e tre spuntati: compare sotto ogni impianto');
// componenti comuni
await A.mostra(p,box('')); await p.click(box('')); await p.waitForTimeout(400);
r=await dove();
ok(!r.Bticino&&!r.Urmet&&!r.Comelit&&r.comuni,'«Componenti comuni»: una volta sola, tra i comuni');
// salvato e riaperto
await spunta(ids[0],true); await spunta(ids[2],true);
await S(()=>{ const T=window.IECI_T; T.S().client={name:'Cond Prova',addr:'',tel:'',email:'',cf:''}; T.touch(); T.saveQuote(true); }); const qid=await S(()=>window.IECI_T.S().qid);
await S(()=>document.getElementById('qb-new').click()); await p.waitForTimeout(400);
await S(i=>window.IECI_T.openQuote(i),qid); await p.waitForTimeout(600);
r=await dove();
ok(r.Bticino&&!r.Urmet&&r.Comelit,'salvato e riaperto: resta in A e C, non in B');
// tolgo l'impianto C: il prodotto resta solo in A
await S(()=>{ const b=[...document.querySelectorAll('[data-sy^="del:"]')].pop(); b&&b.click(); }); await p.waitForTimeout(600);
ok(await S(()=>{ const x=window.IECI_T.S().products.find(x=>x.id==='pall'); return x&&x.sys===window.IECI_T.S().cond.sys[0].id; }),'tolto l\'impianto C: il prodotto resta solo nell\'impianto A');
// un prodotto vecchio «in ogni impianto» (versione di prima) vale per gli impianti che c'erano: si vede spuntato in tutti
await S(()=>{ const s=window.IECI_T.S(); s.products.find(x=>x.id==='pall').sys='*'; window.IECI_T.touch(); window.IECI_T.renderAll(); window.IECI_T.showPanel('prodotti'); }); await p.waitForTimeout(600);
ok(await S(()=>{ const i=window.IECI_T.S().products.findIndex(x=>x.id==='pall'); return [...document.querySelectorAll('[data-psy^="'+i+':"]')].filter(x=>x.checked).length===2; }),'prodotto salvato con la versione di prima («in tutti»): le caselle mostrano gli impianti spuntati');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
