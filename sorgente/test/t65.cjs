const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAADwAAAAUCAYAAADRA14pAAAAN0lEQVR4nO3PMREAMAgEQZTgXwquEhnMPFtcf1vT/S5V2wPAwMDAwMDAdwJODzg94PSA0wNO7wPmg26Yn74aDwAAAABJRU5ErkJggg==','base64');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SRC);await p.waitForTimeout(1500);
const S=(f,a)=>p.evaluate(f,a);
const set=async(sel,v)=>{await p.fill(sel,v);await p.dispatchEvent(sel,'change');await p.waitForTimeout(200);};
const addCat=async n=>{await S(n=>{const r=[...document.querySelectorAll('#cat .crow')].find(x=>x.textContent.includes(n));r.querySelector('[data-add]').click();},n);await p.waitForTimeout(250);};
await p.click('[data-m="dom"]');await S(()=>{const s=window.IECI_T.S();s.lines=[];s.products=[];window.IECI_T.touch();});
ok(await S(()=>!document.getElementById('acc-br').hidden),'riquadro «Proposte a confronto» presente');
await addCat('Interruttore magnetotermico differenziale');await addCat('Termostato ambiente Wi-Fi');await addCat('Manodopera oraria');
await S(()=>{document.getElementById('acc-br').open=true;const c=document.getElementById('br-on');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(500);
let st=await S(()=>{const s=window.IECI_T.S();return {on:s.cmp.on,n:s.cmp.sys.length,l:s.lines.map(l=>(l.tm||[]).join()).join(''),pr:s.products.map(p=>p.sys?s.cmp.sys.findIndex(x=>x.id===p.sys):-1).join(''),tiers:s.tiers.on}});console.log(JSON.stringify(st));
ok(st.on&&st.n===2&&st.l==='000111'&&st.tiers,'attivato: voci nella proposta A e copiate nella B');
ok(st.pr==='0011','schede prodotto per ogni proposta');
await set('[data-syf="b:0"]','Bticino');await set('[data-syf="b:1"]','Vimar');
st=await S(()=>{const s=window.IECI_T.S();return {br:s.lines.map(l=>l.br).join(','),pb:s.products.map(p=>p.brand).join(','),names:s.tiers.names.join('|')}});console.log(JSON.stringify(st));
ok(st.br==='Bticino,Bticino,Bticino,Vimar,Vimar,Vimar'&&st.pb==='Bticino,Bticino,Vimar,Vimar','marche sulle voci e sulle schede');
ok(st.names==='Proposta Bticino|Proposta Vimar','nomi delle proposte');
await S(()=>{const s=window.IECI_T.S();s.lines[3].p=150;window.IECI_T.touch();});await p.waitForTimeout(300);
// logo caricato
await p.setInputFiles('[data-sylogo="1"]',{name:'vimar.png',mimeType:'image/png',buffer:PNG});await p.waitForTimeout(800);
ok(await S(()=>/^data:image/.test(window.IECI_T.S().cmp.sys[1].logo||'')),'logo caricato per la proposta Vimar');
ok(await S(()=>!!document.querySelector('#br-sys .sylg-p img')),'anteprima del logo nel pannello');
const sum=await S(()=>document.querySelector('#doc .sysum').innerText.replace(/\n+/g,' | '));console.log(sum);
ok(/Proposta Bticino/.test(sum)&&/Proposta Vimar/.test(sum)&&!/condomino/i.test(sum),'riepilogo delle proposte (senza quota condominio)');
ok(await S(()=>!!document.querySelector('#doc .sysum .sumlg')&&!!document.querySelector('#doc .sysb .syslg')),'logo nel preventivo economico');
const tots=await S(()=>[...document.querySelectorAll('#doc .sysb .grand span:last-child')].map(e=>e.textContent));console.log(tots.join(' / '));ok(tots.length===2&&tots[0]!==tots[1],'un totale per proposta');
const g=await S(()=>[...document.querySelectorAll('#doc .pgrp .pgrp-t')].map(e=>e.textContent));console.log(g.join(' / '));ok(g[0]==='Bticino'&&g[1]==='Vimar','Prodotti divisi per marca');
ok(await S(()=>!!document.querySelector('#doc .pgrp-l img')&&document.querySelectorAll('#doc .pcmp-c').length===2),'logo e confronto nella sezione Prodotti');
// nuove voci nella proposta scelta
await S(()=>document.querySelector('#br-sys [data-sy="cur:1"]').click());await p.waitForTimeout(300);
await addCat('Dimmer');
st=await S(()=>{const s=window.IECI_T.S();const l=s.lines.find(l=>/Dimmer/.test(l.d));return l.tm.join()+'|'+l.br});ok(st==='1|Vimar','voce del listino nella proposta scelta');
await S(()=>document.getElementById('add-free').click());await p.waitForTimeout(200);
ok(await S(()=>{const s=window.IECI_T.S();const l=s.lines[s.lines.length-1];return l.tm&&l.tm[0]===1&&l.br==='Vimar'}),'riga libera nella proposta scelta');
// totale libero per proposta
await S(()=>{const e=document.querySelector('[data-b="econ.mode"]');e.value='totale';e.dispatchEvent(new Event('change',{bubbles:true}));e.dispatchEvent(new Event('input',{bubbles:true}));});await p.waitForTimeout(400);
st=await S(()=>window.IECI_T.S().cmp.sys.map(x=>x.tot).join('|'));console.log('totali liberi iniziali',st);ok(/\d/.test(st.split('|')[0])&&/\d/.test(st.split('|')[1]),'totale libero: un campo per proposta, già compilato');
await S(()=>{const e=document.querySelector('[data-b="econ.mode"]');e.value='righe';e.dispatchEvent(new Event('change',{bubbles:true}));e.dispatchEvent(new Event('input',{bubbles:true}));});await p.waitForTimeout(300);
// chiudi tenendo Vimar
await S(()=>document.querySelector('#br-sys [data-sy="keep:1"]').click());await p.waitForTimeout(400);
st=await S(()=>{const s=window.IECI_T.S();return {on:s.cmp.on,l:s.lines.map(l=>l.br+(l.sy?'*':'')+(l.tm?'#':'')).join(','),pb:s.products.map(p=>p.brand+(p.sys?'*':'')).join(','),tiers:s.tiers.on}});console.log(JSON.stringify(st));
ok(!st.on&&!st.tiers&&!/\*|#/.test(st.l+st.pb)&&!/Bticino/.test(st.l+st.pb),'chiuso: resta solo la proposta Vimar, pulita');
// Appartamento con stanze
await p.click('[data-m="app"]');await p.waitForTimeout(300);
await S(()=>{const s=window.IECI_T.S();s.lines=[];s.products=[];window.IECI_T.touch();});
await addCat('Punto presa 10/16 A');await addCat('Punto luce semplice');
await S(()=>{const c=document.getElementById('br-on');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(500);
await set('[data-syf="b:0"]','Bticino');await set('[data-syf="b:1"]','Vimar');
ok(await S(()=>document.querySelectorAll('#doc .sysb').length===2&&!!document.querySelector('#doc .sysb tr.rmh')),'Appartamento: proposte con le voci divise per stanza');
// Automazioni
await p.click('[data-m="aut"]');await p.waitForTimeout(300);
ok(await S(()=>window.IECI_T.S().cmp.on&&!document.getElementById('acc-br').hidden),'Automazioni: confronto disponibile');
// videocitofono: pannello suo, riquadro generico nascosto
await p.click('[data-m="vcit"]');await p.waitForTimeout(300);
ok(await S(()=>document.getElementById('acc-br').hidden),'Videocitofono: usa il suo pannello «Più marche»');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
