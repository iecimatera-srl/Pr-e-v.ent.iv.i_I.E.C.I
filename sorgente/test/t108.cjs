// Titolo del preventivo modificabile anche dalla scheda Preventivo (per ogni tipo, videocitofono compreso),
// sempre uguale a quello della scheda Cliente, in copertina e nelle intestazioni
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S,null,{timeout:30000});await p.waitForTimeout(800);
const S=(f,a)=>p.evaluate(f,a);
const stato=()=>S(()=>({meta:window.IECI_T.S().meta.title,prev:document.getElementById('p-title').value,cli:document.getElementById('m-title').value,cop:((document.querySelector('#doc h1')||{}).innerText||'').toLowerCase(),testa:((document.querySelector('#doc .pg-t b')||{}).innerText||'')}));
for(const m of ['vcit','dom','fv']){
  await S(m=>document.querySelector('[data-m="'+m+'"]').click(),m); await p.waitForTimeout(400);
  await A.mostra(p,'#p-title');
  ok(await S(()=>{ const e=document.getElementById('p-title'); return !!e.offsetParent&&e.closest('[data-panel]').getAttribute('data-panel')==='prev'; }),m+': nella scheda Preventivo c\'è il campo «Titolo del preventivo»');
  const v='Titolo scritto in Preventivo '+m;
  await p.fill('#p-title',v); await p.waitForTimeout(500);
  let s=await stato();
  ok(s.meta===v&&s.cli===v,m+': il titolo cambia ed è lo stesso della scheda Cliente');
  ok(s.cop===v.toLowerCase(),m+': il titolo compare in copertina');
  ok(!s.testa||s.testa.toLowerCase()===v.toLowerCase(),m+': e nell\'intestazione delle pagine');
  // dalla scheda Cliente torna anche nella scheda Preventivo
  await A.mostra(p,'#m-title'); await p.fill('#m-title',v+' bis'); await p.waitForTimeout(400);
  s=await stato();
  ok(s.prev===v+' bis'&&s.meta===v+' bis',m+': cambiato dalla scheda Cliente, si aggiorna anche nella scheda Preventivo');
}
// videocitofono: il titolo resta dopo le azioni tipiche e dopo salva/riapri
await S(()=>document.querySelector('[data-m="vcit"]').click()); await p.waitForTimeout(400);
await A.mostra(p,'#p-title'); await p.fill('#p-title','Condominio Le Rose'); await p.waitForTimeout(400);
for(const sel of ['[data-vck="both"]','#vc-fill','[data-vck="brands"]','[data-vck="video"]']){ await S(s=>{ const x=document.querySelector(s); x&&x.click(); },sel); await p.waitForTimeout(500); }
ok((await stato()).meta==='Condominio Le Rose','videocitofono: il titolo resta dopo «Entrambe», «Marche a confronto» e le voci tipiche');
await S(()=>{ const T=window.IECI_T; T.S().client={name:'Cond Le Rose',addr:'',tel:'',email:'',cf:''}; T.touch(); T.saveQuote(true); }); const id=await S(()=>window.IECI_T.S().qid);
await S(()=>document.getElementById('qb-new').click()); await p.waitForTimeout(500);
await S(i=>window.IECI_T.openQuote(i),id); await p.waitForTimeout(600);
const s=await stato();
ok(s.meta==='Condominio Le Rose'&&s.prev==='Condominio Le Rose','salvato e riaperto: il titolo c\'è, anche nel campo della scheda Preventivo');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
