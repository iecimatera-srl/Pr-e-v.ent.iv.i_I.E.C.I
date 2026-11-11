// Aggiunta rapida: «3 prese» / «20 m canalina» / «presa x4», suggerimenti da listino, voci mie, libreria e voci già usate,
// voce nuova libera, «Le più usate», quantità con − e +, Invio per passare alla voce dopo
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.qaCerca&&window.IECI_T.S,null,{timeout:30000});
const S=(f,a)=>p.evaluate(f,a);
// 1. lettura di quantità e unità
let st=await S(()=>{ const f=window.IECI_T.qaLeggi; return [f('3 prese'),f('20 m canalina'),f('presa usb x4'),f('2,5 h manodopera'),f('quadro elettrico'),f('12 moduli quadro')].map(o=>o.q+'|'+o.u+'|'+o.t); });
ok(st.join(';')==='3||prese;20|m|canalina;4||presa usb;2.5|h|manodopera;1||quadro elettrico;12||moduli quadro','capisce quantità e unità: '+st.join(' ; '));
await S(()=>{ const T=window.IECI_T, s=T.S(); s.lines=[]; s.client.name='Prova'; const Q=T.DB().quotes; Q.length=0;
  for(let k=0;k<3;k++){ const d=JSON.parse(JSON.stringify(s)); delete d.cat; d.lines=[{d:'Presa bivalente 10/16 A',u:'pt',q:4,p:38+k,s:0},{d:'Canalina portacavi 40x17',u:'m',q:20,p:6.5,s:0},{d:'Punto luce semplice',u:'pt',q:5,p:45,s:0}]; Q.push({id:'h'+k,num:'x'+k,st:'accettato',client:'C'+k,tot:1000,upd:1000+k,model:'dom',data:d}); }
  T.DB().prods.push({id:'lp1',name:'Termostato Wi-Fi Smarther',brand:'Bticino',code:'XW8002',desc:'',specs:'',link:'',tags:'',photos:[],lp:210,lu:'cad'});
  T.renderAll(); });
// 2. suggerimenti
await p.fill('#qa-in','3 pres'); await p.waitForTimeout(250);
st=await S(()=>[...document.querySelectorAll('#qa-sug .qa-o')].map(o=>o.querySelector('.qa-d').textContent+' | '+o.querySelector('.qa-r').textContent));
console.log(JSON.stringify(st));
ok(/^3 × Presa bivalente 10\/16 A \| Già usata40,00 €\/pt$/.test(st[0]),'«3 pres»: per prima la voce che usi di più, con l\'ultimo prezzo (40 €)');
ok(st.some(x=>/^3 × Punto presa 10\/16 A \| 42,00 €\/pt/.test(x))&&/Voce nuova: «pres»/.test(st[st.length-1]),'poi il listino, e in fondo «Voce nuova»');
await p.keyboard.press('Enter'); await p.waitForTimeout(300);
st=await S(()=>({l:window.IECI_T.S().lines.map(l=>[l.d,l.q,l.u,l.p]),v:document.getElementById('qa-in').value,f:document.activeElement.id,n:!!document.querySelector('#lines .line.nuova')}));
ok(JSON.stringify(st.l)==='[["Presa bivalente 10/16 A",3,"pt",40]]'&&st.v===''&&st.f==='qa-in'&&st.n,'Invio: aggiunte 3 prese a 40 €, casella vuota e pronta per la prossima, voce evidenziata');
// listino del tipo aperto, con il dito
await p.fill('#qa-in','quadro'); await p.waitForTimeout(200);
const primo=await S(()=>document.querySelector('#qa-sug .qa-o .qa-d').textContent);
await p.click('#qa-sug .qa-o >> nth=0'); await p.waitForTimeout(300);
ok(await S(d=>{ const L=window.IECI_T.S().lines; return L.length===2&&L[1].d===d&&L[1].q===1&&L[1].p>0; },primo),'tocco sul suggerimento del listino: «'+primo+'» aggiunto');
// unità scritta da me
await p.fill('#qa-in','20 m canalina'); await p.waitForTimeout(200); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
ok(await S(()=>{ const l=window.IECI_T.S().lines[2]; return l.d==='Canalina portacavi 40x17'&&l.q===20&&l.u==='m'&&l.p===6.5; }),'«20 m canalina»: 20 metri a 6,50 € (voce già usata)');
// stessa voce di nuovo: si somma
await p.fill('#qa-in','2 presa bival'); await p.waitForTimeout(200); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
ok(await S(()=>{ const L=window.IECI_T.S().lines; return L.length===3&&L[0].q===5; }),'la stessa voce non si raddoppia: la quantità sale a 5');
// libreria prodotti
await p.fill('#qa-in','smarther'); await p.waitForTimeout(200);
st=await S(()=>document.querySelector('#qa-sug .qa-o').innerText.replace(/\n/g,' | '));
ok(/Termostato Wi-Fi Smarther/.test(st)&&/Libreria/.test(st)&&/210,00/.test(st),'trova anche i prodotti della libreria: '+st);
await p.keyboard.press('Enter'); await p.waitForTimeout(300);
ok(await S(()=>{ const s=window.IECI_T.S(); return s.lines[3].d==='Termostato Wi-Fi Smarther'&&s.lines[3].p===210&&s.products.some(x=>x.name==='Termostato Wi-Fi Smarther'); }),'aggiunto con la sua scheda prodotto');
// voce nuova libera: cursore sul prezzo, poi Invio torna alla casella
await p.fill('#qa-in','2 sopralluogo tecnico zzz'); await p.waitForTimeout(200);
ok(await S(()=>document.querySelectorAll('#qa-sug .qa-o').length===1),'niente di simile: resta solo «Voce nuova»');
await p.keyboard.press('Enter'); await p.waitForTimeout(300);
st=await S(()=>{ const l=window.IECI_T.S().lines[4], a=document.activeElement; return {l:[l.d,l.q,l.p],f:a.getAttribute('data-f'),i:a.closest('.line')&&a.closest('.line').getAttribute('data-i')}; });
ok(JSON.stringify(st.l)==='["Sopralluogo tecnico zzz",2,0]'&&st.f==='p'&&st.i==='4','voce nuova con l\'iniziale maiuscola; il cursore va sul prezzo da scrivere');
await p.keyboard.type('60'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
ok(await S(()=>window.IECI_T.S().lines[4].p===60&&document.activeElement.id==='qa-in'),'scritto il prezzo, Invio riporta alla casella per la voce dopo');
// frecce
await p.fill('#qa-in','punto'); await p.waitForTimeout(200); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(100);
ok(await S(()=>document.querySelectorAll('#qa-sug .qa-o')[1].classList.contains('sel')),'con le frecce si scorre tra i suggerimenti');
await p.keyboard.press('Escape'); await p.waitForTimeout(100);
ok(await S(()=>document.getElementById('qa-sug').hidden&&!document.getElementById('qa-in').value),'Esc chiude');
// 3. le più usate: solo quelle non ancora nel preventivo
st=await S(()=>[...document.querySelectorAll('#qa-chips .qa-c')].map(c=>c.textContent));
ok(st.length===1&&st[0]==='+ Punto luce semplice','«Le più usate» propone ciò che manca ancora: '+JSON.stringify(st));
await p.click('#qa-chips .qa-c'); await p.waitForTimeout(300);
ok(await S(()=>{ const L=window.IECI_T.S().lines; return L[5].d==='Punto luce semplice'&&L[5].p===45&&!document.querySelector('#qa-chips .qa-c'); }),'un tocco e la voce è nel preventivo (poi sparisce dai suggerimenti)');
// 4. quantità con − e +
await p.click('#lines .line[data-i="0"] [data-qpm="1"]'); await p.click('#lines .line[data-i="0"] [data-qpm="1"]'); await p.click('#lines .line[data-i="0"] [data-qpm="-1"]'); await p.waitForTimeout(500);
st=await S(()=>({q:window.IECI_T.S().lines[0].q,t:document.querySelector('#lines .line[data-i="0"] .tot').textContent,v:document.querySelector('#lines .line[data-i="0"] [data-f="q"]').value}));
ok(st.q===6&&st.v==='6'&&/240,00/.test(st.t),'+ + −: quantità 6 e totale della voce aggiornato ('+st.t+')');
await S(()=>{ window.IECI_T.S().lines[1].q=1; window.IECI_T.renderAll(); }); await p.click('#lines .line[data-i="1"] [data-qpm="-1"]'); await p.waitForTimeout(200);
ok(await S(()=>window.IECI_T.S().lines[1].q===1),'il − si ferma a 1 (per togliere la voce c\'è il cestino)');
// 5. totale generale e 360 px
ok(await S(()=>Math.abs(window.IECI_T.totals().imp-(6*40+window.IECI_T.S().lines[1].p+20*6.5+210+2*60+45))<0.01),'il totale del preventivo torna con le voci aggiunte');
await p.setViewportSize({width:360,height:780}); await p.fill('#qa-in','pres'); await p.waitForTimeout(250);
st=await S(()=>{ const o=[]; document.querySelectorAll('#acc-righe *').forEach(e=>{ if(e.closest('.qa-chips')) return; const r=e.getBoundingClientRect(); if(r.width&&r.right>innerWidth+1) o.push(e.className||e.tagName); }); return o; });
ok(!st.length,'360 px: niente esce dallo schermo '+JSON.stringify(st.slice(0,4)));
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
