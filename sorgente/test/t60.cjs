const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SRC);await p.waitForTimeout(1500);
const S=f=>p.evaluate(f);
await p.click('[data-m="vcit"]');await p.waitForTimeout(300);
await p.click('[data-vck="brands"]');await p.waitForTimeout(500);
let st=await S(()=>{const s=window.IECI_T.S();return {n:s.cond.sys.length,l:s.lines.filter(l=>l.sy).length,tm:s.lines.filter(l=>l.sy).map(l=>l.tm.join()).join(''),tiers:s.tiers.on,names:s.tiers.names.join('|'),prods:s.products.filter(x=>x.sys).length}});
console.log(JSON.stringify(st));
ok(st.n===2&&st.l===12&&st.tm==='000000111111'&&st.tiers,'2 impianti con 6 voci ciascuno');
const set=async(f,v)=>{await p.fill('[data-syf="'+f+'"]',v);await p.dispatchEvent('[data-syf="'+f+'"]','change');await p.waitForTimeout(250);};
await set('b:0','Bticino');await set('b:1','Urmet');
st=await S(()=>{const s=window.IECI_T.S();return {names:s.tiers.names.join('|'),br:[...new Set(s.lines.filter(l=>l.sy).map(l=>l.br))].join(),pb:s.products.filter(x=>x.sys).map(x=>x.brand).join(',')}});
console.log(JSON.stringify(st));
ok(st.names==='Impianto Bticino|Impianto Urmet'&&st.br==='Bticino,Urmet','nomi e marche propagati');
// prezzo diverso sul monitor di Urmet
await S(()=>{const s=window.IECI_T.S();const l=s.lines.find(l=>l.sy&&l.tm[0]===1&&/Monitor interno a colori/.test(l.d));l.p=250;window.IECI_T.touch();});
await p.waitForTimeout(400);
const doc=await S(()=>document.querySelector('#doc').innerText);
const sum=await S(()=>document.querySelector('#doc .sysum').innerText.replace(/\n+/g,' | '));console.log(sum);
ok(/Impianto Bticino/.test(sum)&&/Impianto Urmet/.test(sum)&&/Bticino/.test(sum)&&/Urmet/.test(sum),'riepilogo con i due impianti e le marche');
ok(/Quota a condomino/i.test(sum),'quota a condomino per impianto');
const nb=await S(()=>document.querySelectorAll('#doc .sysb').length);ok(nb===2,'un blocco di dettaglio per impianto');
ok(await S(()=>[...document.querySelectorAll('#doc .sysb')].every(e=>/Marca/.test(e.innerText))),'marca su ogni voce');
const tots=await S(()=>[...document.querySelectorAll('#doc .sysb .grand span:last-child')].map(e=>e.textContent));console.log(tots.join(' / '));
ok(tots.length===2&&tots[0]!==tots[1],'totali diversi per impianto');
const lab=await S(()=>[...document.querySelectorAll('#doc .pgrp-t')].map(e=>e.textContent));console.log([...new Set(lab)].join(' / '));
ok(lab.some(x=>/Bticino/.test(x))&&lab.some(x=>/Urmet/.test(x)),'schede prodotto etichettate per impianto');
// catalogo: aggiunge all'impianto selezionato
await p.click('[data-sy="cur:1"]');await p.waitForTimeout(300);
await S(()=>{const r=[...document.querySelectorAll('#cat .crow')].find(x=>x.textContent.includes('Pulsantiera aggiuntiva'));r.querySelector('[data-add]').click();});await p.waitForTimeout(300);
const add=await S(()=>{const s=window.IECI_T.S();const l=s.lines.find(l=>/Pulsantiera/.test(l.d));return l&&[l.tm.join(),l.br,l.sy===s.cond.sys[1].id].join('|')});console.log(add);
ok(add==='1|Urmet|true','voce del listino aggiunta all\'impianto scelto con la sua marca');
// totale libero per impianto
await p.click('[data-vcp="totale"]');await p.waitForTimeout(300);
await p.fill('[data-b="cond.sys.0.tot"]','4000');await p.dispatchEvent('[data-b="cond.sys.0.tot"]','input');
await p.fill('[data-b="cond.sys.1.tot"]','5500');await p.dispatchEvent('[data-b="cond.sys.1.tot"]','input');await p.waitForTimeout(400);
const tl=await S(()=>[...document.querySelectorAll('#doc .sysum tbody tr')].map(r=>r.innerText.replace(/\n+/g,' ')).join(' || '));console.log(tl);
ok(/4\.000,00/.test(tl)&&/5\.500,00/.test(tl),'totali liberi per impianto');
await p.click('[data-vcp="righe"]');await p.waitForTimeout(300);
// terzo impianto e cancellazione del primo
await p.click('[data-sy="add:0"]');await p.waitForTimeout(400);
ok(await S(()=>window.IECI_T.S().cond.sys.length===3),'terzo impianto');
await set('b:2','Videx');
await p.click('[data-sy="del:0"]');await p.waitForTimeout(400);
st=await S(()=>{const s=window.IECI_T.S();return {n:s.cond.sys.length,bad:s.lines.filter(l=>l.sy&&s.cond.sys[l.tm[0]].id!==l.sy).length,l:s.lines.filter(l=>l.sy).length}});console.log(JSON.stringify(st));
ok(st.n===2&&st.bad===0,'cancellando il primo gli indici restano coerenti');
// varianti del posto interno per impianto
await S(()=>{});
const hasVm=await p.$('#vc-vm .vms');ok(!!hasVm,'modelli posto interno per impianto');
await p.click('[data-vm^="add:"]');await p.waitForTimeout(300);
const vmk=await S(()=>Object.keys(window.IECI_T.S().cond.vm).join());console.log(vmk);
// ritorno a un solo impianto
await p.click('[data-vck="video"]');await p.waitForTimeout(500);
st=await S(()=>{const s=window.IECI_T.S();return {sy:s.lines.filter(l=>l.sy).length,tiers:s.tiers.on,prods:s.products.filter(x=>x.sys).length,tp:s.lines.filter(l=>l.tp).length}});console.log(JSON.stringify(st));
ok(st.sy===0&&!st.tiers&&st.prods===0&&st.tp>0,'ritorno a un solo impianto pulito');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
