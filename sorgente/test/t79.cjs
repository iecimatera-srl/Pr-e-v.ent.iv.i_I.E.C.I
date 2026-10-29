// Foto dei dati del cliente (carta d'identità, biglietto da visita, schermata di un messaggio), prezzi sì/no dai file, caselle che vanno a capo sul telefono
const A=require('./_amb.cjs'), path=require('path');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const DOCS=path.join(A.DATI,'documenti');
(async()=>{const b=await A.chromium.launch();
const ctx=await b.newContext({viewport:{width:375,height:800},isMobile:true,hasTouch:true});
const ocr=await A.ocrLocale(ctx);
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S,null,{timeout:20000}).catch(()=>{});
const S=(f,a)=>p.evaluate(f,a);
const pulisci=()=>S(()=>{ const a=window.IECI_T.AS(); a.doc=null; a.res=null; });
async function attendi(){ await p.waitForFunction(()=>window.IECI_T.AS().doc||/err/.test(document.getElementById('as-doc-st').className),null,{timeout:120000}); }

// 1. pulsante dedicato alle foto del cliente
await A.mostra(p,'#as-txt');
let st=await S(()=>{ const i=document.getElementById('as-cli-foto'), l=i&&i.closest('label'); return {c:!!i,acc:i&&i.accept,txt:l&&l.textContent.trim(),vis:l&&l.getBoundingClientRect().width>0}; });
ok(st.c&&/image\/\*/.test(st.acc)&&st.txt==='Foto dati cliente'&&st.vis,'pulsante «Foto dati cliente» (foto dalla fotocamera o dalla galleria)');

// 2. foto: carta d'identità, biglietto da visita, messaggio
if(!ocr) console.log('SALTATO lettura delle foto: lettore di testo non installato (npm install)');
else {
  const casi=[
    ['cliente-carta-identita.jpg',c=>c.name==='Gennaro Esposito'&&c.cf==='SPSGNR68D15F839S'&&c.chk.cf&&c.chk.nomeCf&&/Via Cererie 9/i.test(c.addr)&&/Matera/i.test(c.addr),'carta d\'identità: nome, codice fiscale (controllato col nome) e residenza'],
    ['cliente-biglietto.jpg',c=>c.name==='Giulia Rossi'&&c.tel==='338 1234567'&&c.email==='giulia@studiorossi.it'&&/Corso Umberto I 45, 75100 Matera/.test(c.addr)&&c.cf==='RSSGLI85M41F052O','biglietto da visita: nome, cellulare, email, indirizzo e C.F.'],
    ['cliente-messaggio.jpg',c=>c.name==='Anna Verdi'&&c.tel==='347 1234567'&&c.email==='anna.verdi@gmail.com'&&c.cf==='VRDNNA80A41F052D'&&/Via Dante 10, 75100 Matera/.test(c.addr),'schermata del messaggio: tutti i dati']];
  for(const [f,prova,msg] of casi){
    await pulisci(); await p.setInputFiles('#as-cli-foto',path.join(DOCS,f)); await attendi();
    const r=await S(()=>{ const R=window.IECI_T.AS().doc; return R&&{solo:R.soloCliente,n:R.righe.length,c:R.cliente&&{name:R.cliente.name,addr:R.cliente.addr,tel:R.cliente.tel,email:R.cliente.email,cf:R.cliente.cf,chk:R.cliente.chk},o:document.getElementById('as-out').innerText}; });
    console.log(f,JSON.stringify(r&&r.c));
    ok(r&&r.solo&&!r.n&&r.c&&prova(r.c),msg);
  }
  await p.click('#as-dcli-go'); await p.waitForTimeout(300);
  st=await S(()=>window.IECI_T.S().client);
  ok(st.name==='Anna Verdi'&&st.cf==='VRDNNA80A41F052D'&&st.tel==='347 1234567','«Usa questi dati del cliente»: inseriti nel preventivo');
}
// preventivo del fornitore fotografato
if(ocr){ await pulisci(); await p.setInputFiles('#as-doc',path.join(DOCS,'fornitore-foto.jpg')); await attendi();
  const r=await S(()=>{ const R=window.IECI_T.AS().doc; return R&&{on:R.righe.filter(x=>x.on).map(x=>[x.code,x.br,x.q,x.cost]),ctrl:R.ctrl,cli:R.cliente&&[R.cliente.name,R.cliente.cf,R.cliente.tel].join('|'),sc:R.scarti.length,note:R.note.join(' ')}; });
  console.log(JSON.stringify(r));
  ok(r&&r.on.length===6&&r.ctrl.ok&&r.ctrl.somma===557.3,'foto del preventivo del fornitore: 6 voci e totale che torna');
  ok(r.on[0][0]==='KM4001'&&r.on[0][1]==='Bticino'&&r.on[5][0]==='FS17-2,5-BL'&&r.on[5][2]===200,'codici e marche giusti anche senza intestazione della tabella');
  ok(r.cli==='Anna Verdi|VRDNNA80A41F052D|347 1234567'&&/Esposito Gennaro/.test(r.note)&&r.sc>=1,'resta il cliente appena inserito dalla foto (avviso sul «Rif. cliente» Esposito Gennaro); intestazione scartata');
  await S(()=>{ window.IECI_T.AS().cliRecente=null; const s=window.IECI_T.S(); s.client={name:'',addr:'',tel:'',email:'',cf:''}; });
  await pulisci(); await p.setInputFiles('#as-doc',path.join(DOCS,'fornitore-foto.jpg')); await attendi();
  const r2=await S(()=>{ const R=window.IECI_T.AS().doc; return R.cliente&&[R.cliente.name,R.cliente.cf,R.cliente.tel].join('|'); });
  ok(r2==='Esposito Gennaro|SPSGNR68D15F839S|339 7654321','senza cliente inserito: lo legge dal «Rif. cliente» della foto');
}
// riparazione del codice fiscale letto male dalla foto (O/0, I/1, S/5): solo se il carattere di controllo torna
st=await S(()=>[window.IECI_T.clLeggi('CODICE FISCALE SPSGNR68DI5F839S','contatto').cf,window.IECI_T.clLeggi('Codice fiscale VRDNNA8OA41FO52D','contatto').cf,window.IECI_T.clLeggi('Codice fiscale VRDNNA8OA41FO52X','contatto').cf]);
ok(st[0]==='SPSGNR68D15F839S'&&st[1]==='VRDNNA80A41F052D'&&!st[2],'C.F. con lettere e cifre scambiate: corretto se torna il controllo, altrimenti scartato');

// 3. prezzi dai file: sì o no
await pulisci(); await p.setInputFiles('#as-doc',path.join(DOCS,'fornitore-gestionale.pdf')); await attendi();
st=await S(()=>{ const R=window.IECI_T.AS().doc; return {pz:R.prezzi,box:!!document.getElementById('as-dprezzi'),inp:document.querySelectorAll('#as-out [data-drp]').length}; });
ok(st.pz&&st.box&&st.inp===6,'di base i prezzi del documento ci sono (casella spuntata)');
await p.click('#as-dprezzi'); await p.waitForTimeout(200);
st=await S(()=>{ const R=window.IECI_T.AS().doc; return {pz:R.prezzi,inp:document.querySelectorAll('#as-out [data-drp]').length,o:document.getElementById('as-out').innerText,ls:localStorage.getItem('ieci-doc-prezzi')}; });
ok(!st.pz&&st.inp===0&&/senza prezzo/.test(st.o)&&/prezzi da inserire/.test(st.o)&&st.ls==='0','tolta la spunta: voci senza prezzo, scelta ricordata');
await p.click('#as-dok'); await p.waitForTimeout(800);
st=await S(()=>window.IECI_T.S().lines.map(l=>[l.d,l.p]));
ok(st.length===6&&st.every(x=>x[1]===0)&&st[0][0]==='Interruttore 1P 16A Living Now bianco','preventivo creato con le voci e i prezzi a zero, da scrivere tu');
await pulisci(); await p.setInputFiles('#as-doc',path.join(DOCS,'fornitore-gestionale.pdf')); await attendi();
st=await S(()=>window.IECI_T.AS().doc.prezzi);
ok(st===false,'la volta dopo ricorda la scelta');
await p.click('#as-dprezzi'); await p.waitForTimeout(200);
st=await S(()=>{ const R=window.IECI_T.AS().doc; return {pz:R.prezzi,inp:document.querySelectorAll('#as-out [data-drp]').length}; });
ok(st.pz&&st.inp===6,'rimessa la spunta: tornano i prezzi');

// 4. telefono: nessuna casella con il testo tagliato
await S(()=>{ const s=window.IECI_T.S(); s.client.addr='Via dei Mille 123, scala B, interno 4, 75100 Matera (MT)'; s.meta.title='Rifacimento completo impianto elettrico appartamento al terzo piano'; s.lines.forEach(l=>l.d=l.d+' con placca e supporto compresi nel prezzo'); window.IECI_T.touch(); window.IECI_T.renderAll(); });
const pannelli=['prev','dati','prodotti','listini','menu','messaggi'];
let tagliati=[];
for(const pn of pannelli){
  await S(pn=>{ const b=document.querySelector('.mit[data-p="'+pn+'"]'); if(b) b.click(); document.querySelectorAll('[data-panel="'+pn+'"] details').forEach(d=>d.open=true); },pn); await p.waitForTimeout(300);
  const t=await S(pn=>{ const out=[]; document.querySelectorAll('[data-panel="'+pn+'"] input[type=text],[data-panel="'+pn+'"] input:not([type]),[data-panel="'+pn+'"] textarea').forEach(e=>{ const r=e.getBoundingClientRect(); if(!r.width||!String(e.value||'').trim()) return; if(e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+4&&e.tagName==='TEXTAREA'&&e.classList.contains('t1')) out.push(pn+': '+(e.id||e.getAttribute('data-f')||e.className)+' «'+e.value.slice(0,30)+'»'); if(r.right>innerWidth+1) out.push(pn+' FUORI: '+(e.id||e.className)); }); return out; },pn);
  tagliati=tagliati.concat(t);
}
console.log(JSON.stringify(tagliati.slice(0,12)));
ok(!tagliati.length,'telefono (375 px): nessuna casella taglia il testo');
await A.mostra(p,'#lines'); await p.waitForTimeout(200);
st=await S(()=>{ const d=document.querySelector('#lines [data-f="d"]'); return {tag:d.tagName,h:d.getBoundingClientRect().height}; });
ok(st.tag==='TEXTAREA'&&st.h>60,'la descrizione lunga della voce va a capo e si legge tutta ('+Math.round(st.h)+' px)');
// Invio non va a capo, il testo resta su una riga di dati
await S(()=>window.IECI_T.S().lines.length);
await A.mostra(p,'#lines'); await p.click('#lines [data-f="d"]'); await p.keyboard.press('Control+End'); await p.keyboard.press('Enter'); await p.keyboard.type('X'); await p.waitForTimeout(300);
st=await S(()=>window.IECI_T.S().lines[0].d);
ok(!/\n/.test(st)&&/X$/.test(st),'Invio non spezza la descrizione');

console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
