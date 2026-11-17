// Videocitofono con due marche a confronto: un prodotto può stare SIA nell'impianto A SIA nel B (ripetuto sotto
// ognuno), oltre a «solo A», «solo B» e «componenti comuni» (una volta sola)
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S,null,{timeout:30000});await p.waitForTimeout(800);
const S=(f,a)=>p.evaluate(f,a);
await S(()=>document.querySelector('[data-m="vcit"]').click()); await p.waitForTimeout(300);
await S(()=>document.querySelector('[data-vck="brands"]').click()); await p.waitForTimeout(600);
await S(()=>{ const s=window.IECI_T.S(); s.cond.sys[0].b='Bticino'; s.cond.sys[1].b='Urmet'; window.IECI_T.touch(); window.IECI_T.renderAll(); }); await p.waitForTimeout(400);
// un prodotto in più, che va in tutti e due gli impianti (es. alimentatore o cavo)
const idx=await S(()=>{ const s=window.IECI_T.S(); s.products.push({id:'pall',name:'Alimentatore di sistema',brand:'',code:'',desc:'Alimenta tutto l\'impianto',specs:'',link:'',tags:'',photos:[],sys:s.cond.sys[0].id}); window.IECI_T.touch(); window.IECI_T.renderAll(); return s.products.length-1; });
await p.waitForTimeout(400);
await S(()=>window.IECI_T.showPanel('prodotti')); await p.waitForTimeout(600);
await A.mostra(p,'[data-pf="sys"][data-pi="'+idx+'"]');
const opz=await S(i=>[...document.querySelector('[data-pf="sys"][data-pi="'+i+'"]').options].map(o=>o.value+'='+o.textContent),idx);
console.log('     scelte: '+opz.join(' | '));
ok(opz.some(x=>/^\*=Sia nell'impianto A che nel B/.test(x)),'nella scheda prodotto c\'è la scelta «Sia nell\'impianto A che nel B»');
ok(opz.some(x=>/^=Componenti comuni/.test(x))&&opz.filter(x=>/^[^*=][^=]*=Solo /.test(x)).length===2,'restano «Solo A», «Solo B» e «Componenti comuni»');
await p.selectOption('[data-pf="sys"][data-pi="'+idx+'"]','*'); await p.waitForTimeout(500);
ok(await S(()=>window.IECI_T.S().products.find(x=>x.id==='pall').sys==='*'),'scelta salvata nel prodotto');
const gruppi=()=>S(()=>{ const out={}; let cur=''; document.querySelectorAll('#doc .pgrp-t, #doc .pgrp-mini, #doc .prod h3').forEach(e=>{ if(e.matches('.pgrp-t')) cur=e.textContent; else if(e.matches('.pgrp-mini')) cur=e.textContent.replace(/ · continua$/,''); else (out[cur]=out[cur]||[]).push(e.textContent); }); return out; });
let g=await gruppi();
console.log('     '+JSON.stringify(Object.fromEntries(Object.entries(g).map(([k,v])=>[k,v.filter(x=>/Alimentatore/.test(x)).length]))));
const inA=Object.keys(g).filter(k=>/Bticino/.test(k)).some(k=>g[k].includes('Alimentatore di sistema'));
const inB=Object.keys(g).filter(k=>/Urmet/.test(k)).some(k=>g[k].includes('Alimentatore di sistema'));
const inC=Object.keys(g).filter(k=>/comuni/i.test(k)).some(k=>g[k].includes('Alimentatore di sistema'));
ok(inA&&inB,'nel fascicolo il prodotto compare sotto l\'impianto Bticino E sotto l\'impianto Urmet');
ok(!inC,'…e non tra i componenti comuni');
// componenti comuni: una volta sola
await p.selectOption('[data-pf="sys"][data-pi="'+idx+'"]',''); await p.waitForTimeout(500);
g=await gruppi();
const c2=Object.keys(g).filter(k=>/comuni/i.test(k)).some(k=>g[k].includes('Alimentatore di sistema')), a2=Object.keys(g).filter(k=>/Bticino|Urmet/.test(k)).some(k=>g[k].includes('Alimentatore di sistema'));
ok(c2&&!a2,'«Componenti comuni»: compare una volta sola, tra i comuni');
// solo B
const idB=await S(()=>window.IECI_T.S().cond.sys[1].id);
await p.selectOption('[data-pf="sys"][data-pi="'+idx+'"]',idB); await p.waitForTimeout(500);
g=await gruppi();
ok(Object.keys(g).filter(k=>/Urmet/.test(k)).some(k=>g[k].includes('Alimentatore di sistema'))&&!Object.keys(g).filter(k=>/Bticino/.test(k)).some(k=>g[k].includes('Alimentatore di sistema')),'«Solo Urmet»: compare solo sotto Urmet');
// salvato e riaperto: la scelta «in entrambi» resta
await p.selectOption('[data-pf="sys"][data-pi="'+idx+'"]','*'); await p.waitForTimeout(300);
await S(()=>{ const T=window.IECI_T; T.S().client={name:'Cond Prova',addr:'',tel:'',email:'',cf:''}; T.touch(); T.saveQuote(true); }); const id=await S(()=>window.IECI_T.S().qid);
await S(()=>document.getElementById('qb-new').click()); await p.waitForTimeout(400);
await S(i=>window.IECI_T.openQuote(i),id); await p.waitForTimeout(600);
ok(await S(()=>window.IECI_T.S().products.find(x=>x.id==='pall').sys==='*'),'salvato e riaperto: il prodotto resta in entrambi gli impianti');
// tornando a un solo impianto il prodotto diventa normale
await S(()=>document.querySelector('[data-vck="video"]').click()); await p.waitForTimeout(500);
ok(await S(()=>{ const x=window.IECI_T.S().products.find(x=>x.id==='pall'); return !x||!x.sys; }),'tornando a «Videocitofono» (una marca) il prodotto non resta legato agli impianti');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
