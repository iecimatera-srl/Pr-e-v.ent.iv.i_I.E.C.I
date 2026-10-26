// Controllo prima dell'invio e riepilogo «solo per te»
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(A.SRC);await p.waitForTimeout(1500);
const S=(f,a)=>p.evaluate(f,a);
const lista=()=>S(()=>window.IECI_T.ckList().map(x=>x.l+':'+x.t));
await S(()=>{ const s=window.IECI_T.S(); s.model='dom'; s.lines=[{d:'Punto luce semplice',u:'cad',q:4,p:45,s:0},{d:'Quadro elettrico',u:'cad',q:1,p:0,s:0},{d:'Manodopera',u:'h',q:8,p:35,s:0}];
  s.client={name:'',addr:'',tel:'',email:''}; s.meta.num=''; s.meta.date='2025-01-10'; s.meta.val=30; s.pay=''; window.IECI_T.touch(); });
let L=await lista(); console.log(JSON.stringify(L));
ok(L.some(x=>/^err:Manca il nome del cliente/.test(x))&&L.some(x=>/Nessun telefono/.test(x))&&L.some(x=>/1 voce senza prezzo: «Quadro elettrico»/.test(x))&&L.some(x=>/Manca il numero/.test(x))&&L.some(x=>/giorni fa/.test(x))&&L.some(x=>/condizioni di pagamento/.test(x)),'trova cliente, telefono, prezzo zero, numero, data vecchia, pagamento');
await A.mostra(p,'#ck-box');
ok(await S(()=>/cose da controllare prima di inviare/.test(document.getElementById('ck-box').innerText)),'riquadro nel pannello Invio');
// sistemare con un tocco
const clic=async re=>{ await S(re=>{ const b=[...document.querySelectorAll('#ck-box [data-ck]')].find(x=>new RegExp(re).test(x.closest('li').innerText)); b.click(); },re); await p.waitForTimeout(250); };
await clic('Manca il numero'); ok(await S(()=>/^\d{4}\/\d{3}$/.test(window.IECI_T.S().meta.num)),'«Numera»: numero assegnato');
await A.mostra(p,'#ck-box'); await clic('giorni fa'); ok(await S(()=>window.IECI_T.S().meta.date===new Date().toISOString().slice(0,10)),'«Metti oggi»: data aggiornata');
await A.mostra(p,'#ck-box'); await clic('senza prezzo'); await p.waitForTimeout(200);
ok(await S(()=>!document.querySelector('[data-panel="prev"]').hidden&&document.querySelector('#lines .line.flash .lt')&&window.IECI_T.S().lines[+document.querySelector('#lines .line.flash').getAttribute('data-i')].d==='Quadro elettrico'),'«Mostra»: porta alla voce senza prezzo e la evidenzia');
await A.mostra(p,'#ck-box'); await clic('nome del cliente');
ok(await S(()=>!document.querySelector('[data-panel="dati"]').hidden&&document.activeElement.id==='k-name'),'«Scrivilo»: apre i dati del cliente');
// nella finestra di invio
await S(()=>document.getElementById('qb-share').click()); await p.waitForTimeout(300);
ok(await S(()=>/cose? da controllare/.test(document.getElementById('sh-ck').innerText)),'anche nella finestra «Condividi»');
await S(()=>document.getElementById('sh-x').click());
await S(()=>{ const s=window.IECI_T.S(); s.client={name:'Neri Paolo',addr:'',tel:'333 0001112',email:''}; s.lines[1].p=180; s.pay='30% alla firma, saldo a fine lavori'; window.IECI_T.touch(); });
await S(()=>document.getElementById('qb-share').click()); await p.waitForTimeout(300);
ok(await S(()=>document.getElementById('sh-ck').innerHTML===''),'tutto a posto: nessun avviso nella finestra «Condividi»');
await S(()=>document.getElementById('sh-x').click());
// solo per te: lavoro e guadagno sugli articoli dei fornitori
await S(()=>{ const s=window.IECI_T.S(), D=window.IECI_T.DB(); D.arts.push({id:'ar1',sup:'Rexel',code:'X1',name:'Plafoniera LED',um:'pz',cost:50,markup:60,price:80,photos:[],hist:[]}); s.lines.push({d:'Plafoniera LED',u:'pz',q:2,p:80,s:0,art:'ar1'}); window.IECI_T.touch(); });
await A.mostra(p,'#ck-box'); await p.waitForTimeout(200);
const me=await S(()=>document.querySelector('#ck-box .ck-me').innerText);
console.log(me.replace(/\n/g,' | '));
ok(/Solo per te/i.test(me)&&/Solo lavoro e servizi\s*280,00 €\s*·\s*8 h/.test(me)&&/Guadagno sugli articoli dei fornitori \(1\)\s*60,00 € · 37,5%/.test(me),'solo per te: ore di lavoro e guadagno sugli articoli');
ok(await S(()=>!/Solo per te/i.test(document.querySelector('#doc').innerText)),'il riepilogo non finisce nel preventivo');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
