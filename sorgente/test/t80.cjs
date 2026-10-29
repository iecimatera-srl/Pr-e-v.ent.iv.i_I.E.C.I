// Il cliente non si perde: foto/contatto del cliente, poi preventivo del fornitore → stesso cliente; niente dati mescolati; giro completo senza errori
const A=require('./_amb.cjs'), path=require('path');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const DOCS=path.join(A.DATI,'documenti');
(async()=>{const b=await A.chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const ocr=await A.ocrLocale(ctx);
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S&&window.IECI_T.DB,null,{timeout:20000}).catch(()=>{});
await p.waitForTimeout(800);
const S=(f,a)=>p.evaluate(f,a);
const attendi=()=>p.waitForFunction(()=>window.IECI_T.AS().doc||/err/.test(document.getElementById('as-doc-st').className),null,{timeout:120000});
async function carica(sel,f){ await S(()=>{ const a=window.IECI_T.AS(); a.doc=null; a.res=null; }); await A.mostra(p,'#as-txt'); await p.setInputFiles(sel,path.join(DOCS,f)); await attendi(); }
const cli=()=>S(()=>Object.assign({},window.IECI_T.S().client));

// A. preventivo di esempio aperto: foto del cliente, poi preventivo del fornitore
const n0=await S(()=>window.IECI_T.S().lines.length);
await carica('#as-cli-foto',ocr?'cliente-messaggio.jpg':'cliente.vcf');
await p.click('#as-dcli-go'); await p.waitForTimeout(400);
let c=await cli(), st=await S(()=>({o:document.getElementById('as-out').innerText,rub:window.IECI_T.DB().clients.map(x=>x.name)}));
const nome='Anna Verdi';
ok(c.name===nome&&c.cf==='VRDNNA80A41F052D'&&/347/.test(c.tel),'cliente dalla foto inserito: '+[c.name,c.addr,c.tel,c.cf].join(' · '));
ok(c.addr!=='Via Verdi 12, appartamento 3','niente indirizzo rimasto dal cliente di prima');
ok(st.rub.indexOf(nome)>-1&&/salvato in rubrica/.test(st.o),'salvato anche in rubrica');
await carica('#as-doc','fornitore-videosorveglianza.pdf');
st=await S(()=>{ const R=window.IECI_T.AS().doc; return {c:R.cliente&&R.cliente.name,t:R.cliente&&R.cliente.tenuto,note:R.note.join(' '),o:document.getElementById('as-out').innerText}; });
ok(st.c===nome&&st.t&&/già inserito da te/.test(st.o),'nel riepilogo resta il cliente che hai inserito tu');
ok(/Bianchi Luca/.test(st.note),'avvisa che nel documento c\'è un altro nome (Bianchi Luca)');
await p.click('#as-dok'); await p.waitForTimeout(1200);
c=await cli(); st=await S(()=>{ const s=window.IECI_T.S(), D=window.IECI_T.DB(); return {n:s.lines.length,model:s.model,q:D.quotes.map(q=>q.client),qid:s.qid}; });
ok(c.name===nome&&c.cf==='VRDNNA80A41F052D'&&/347/.test(c.tel),'nuovo preventivo creato con il cliente giusto: '+c.name);
ok(st.n===10&&st.model==='vid','con le voci del fornitore ('+st.n+')');
ok(st.qid&&st.q.indexOf(nome)>-1,'salvato subito nell\'archivio con il cliente');
ok(await S(()=>/Anna Verdi/.test(document.getElementById('doc').innerText)),'il fascicolo mostra il cliente');
await p.reload(); await p.waitForTimeout(2000);
c=await cli(); ok(c.name===nome&&(await S(()=>window.IECI_T.S().lines.length))===10,'riaprendo l\'app cliente e voci ci sono ancora');

// B. «+ Nuovo» e poi solo il preventivo del fornitore: il cliente è quello del documento
await S(()=>document.getElementById('qb-new').click()); await p.waitForTimeout(500);
ok(!(await cli()).name,'«+ Nuovo»: preventivo vuoto, nessun cliente');
await carica('#as-doc','fornitore-videosorveglianza.pdf');
await p.click('#as-dok'); await p.waitForTimeout(900);
c=await cli(); ok(c.name==='Bianchi Luca'&&c.addr==='Via Lucana 45, 75100 Matera','senza cliente inserito prima: usa quello del documento (Rif. cantiere)');

// C. cliente scritto a mano su un preventivo nuovo: resta
await S(()=>document.getElementById('qb-new').click()); await p.waitForTimeout(500);
await A.mostra(p,'#k-name'); await p.fill('#k-name','Carlo Neri'); await p.fill('#k-addr','Via Roma 5, Matera'); await p.waitForTimeout(300);
await carica('#as-doc','fornitore-fotovoltaico.pdf');
await p.click('#as-dok'); await p.waitForTimeout(900);
c=await cli(); ok(c.name==='Carlo Neri'&&c.addr==='Via Roma 5, Matera','cliente scritto a mano: resta (non lo sostituisce «Destinazione merce»)');

// D. aggiungo voci a un preventivo che ha già il suo cliente: il cliente non cambia
await carica('#as-doc','fornitore-allarme.docx');
await p.click('#as-dadd'); await p.waitForTimeout(900);
c=await cli(); ok(c.name==='Carlo Neri'&&c.addr==='Via Roma 5, Matera','«Aggiungi alle voci attuali»: cliente invariato');

// E. un altro cliente sostituisce tutta la scheda (niente dati mescolati)
await S(()=>{ const s=window.IECI_T.S(); s.client={name:'Pippo Bianco',addr:'Via X 1, Bari',tel:'333 0000000',email:'pippo@x.it',cf:''}; window.IECI_T.touch(); });
await S(()=>{ const a=window.IECI_T.AS(); a.doc=null; a.res=null; }); await A.mostra(p,'#as-txt');
await p.fill('#as-txt','Gino Russo\nCell. 328 4445556'); await p.click('#as-go');
await p.waitForFunction(()=>window.IECI_T.AS().doc,null,{timeout:20000});
await p.click('#as-dcli-go'); await p.waitForTimeout(300);
c=await cli(); ok(c.name==='Gino Russo'&&c.tel==='328 4445556'&&!c.addr&&!c.email,'nuovo cliente: la scheda è solo sua (né indirizzo né email del precedente)');

// F. giro completo di tutte le sezioni, anteprima e condivisione: nessun errore
const pans=await S(()=>[...document.querySelectorAll('[data-panel]')].map(x=>x.getAttribute('data-panel')));
for(const pn of pans){ await S(pn=>{ const bt=document.querySelector('.mit[data-p="'+pn+'"]'); if(bt) bt.click(); document.querySelectorAll('[data-panel="'+pn+'"] details').forEach(d=>d.open=true); },pn); await p.waitForTimeout(200); }
await S(()=>{ const tabs=[...document.querySelectorAll('#tabs [data-m]')]; tabs.forEach(t=>t.click()); tabs[0]&&tabs[0].click(); }); await p.waitForTimeout(500);
await S(()=>document.getElementById('qb-view').click()); await p.waitForTimeout(500); await S(()=>document.getElementById('qb-view').click());
await S(()=>document.getElementById('qb-share').click()); await p.waitForFunction(()=>!document.getElementById('sh-wa').disabled,null,{timeout:60000}).catch(()=>{});
ok(await S(()=>!document.getElementById('sh-wa').disabled),'PDF pronto per l\'invio');
await S(()=>document.getElementById('sh-x').click());
ok(errs.length===0,'nessun errore in tutto il giro ('+pans.length+' sezioni)');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
