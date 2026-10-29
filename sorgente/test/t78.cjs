// Assistente che legge i documenti: preventivi dei fornitori (PDF con foto, Excel, Word, testo) e dati dei clienti (contatto, messaggi)
// Nessuna voce inventata, totale ricontrollato, foto accanto alla riga giusta, cliente senza confusione con ditta e fornitore
const A=require('./_amb.cjs'), path=require('path');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const DOCS=path.join(A.DATI,'documenti');
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:430,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SRC);await p.waitForTimeout(1800);
const S=(f,a)=>p.evaluate(f,a);
async function carica(files){
  await S(()=>{ const a=window.IECI_T.AS(); a.doc=null; a.res=null; });
  await A.mostra(p,'#as-txt'); await p.setInputFiles('#as-doc',files.map(f=>path.join(DOCS,f)));
  await p.waitForFunction(()=>window.IECI_T.AS().doc||/err/.test(document.getElementById('as-doc-st').className),null,{timeout:60000});
  return S(()=>{ const R=window.IECI_T.AS().doc; if(!R) return null;
    // colore medio dell'angolo della foto ritagliata (le foto di prova sono quadrati colorati)
    return Promise.all(R.righe.map(r=>!r.img?Promise.resolve(''):new Promise(ok=>{ const im=new Image(); im.onload=()=>{ const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0); const d=x.getImageData(Math.round(im.width*0.12),Math.round(im.height*0.12),4,4).data; ok([d[0],d[1],d[2]].join(',')); }; im.onerror=()=>ok('x'); im.src=r.img; }))).then(col=>({
      righe:R.righe.map((r,i)=>({on:r.on,d:r.d,code:r.code,br:r.br,u:r.u,q:r.q,cost:r.cost,list:r.list,ver:r.ver,warn:r.warn,img:r.img?r.imgK:'',col:col[i]})),
      ctrl:R.ctrl,tipo:R.tipo,forn:R.forn,spese:R.spese,scarti:R.scarti,posa:R.posa.map(x=>({on:x.on,d:x.d,q:x.q,u:x.u})),cli:R.cliente&&{name:R.cliente.name,addr:R.cliente.addr,tel:R.cliente.tel,email:R.cliente.email,cf:R.cliente.cf,chk:R.cliente.chk},note:R.note,out:document.getElementById('as-out').innerText}));
  });
}
const vicino=(c,rgb)=>{ if(!c) return false; const a=c.split(',').map(Number); return a.every((v,i)=>Math.abs(v-rgb[i])<40); };

// 1. PDF del fornitore con foto e righe che vanno a capo
let r=await carica(['fornitore-videosorveglianza.pdf']);
console.log(JSON.stringify({ctrl:r.ctrl,tipo:r.tipo,cli:r.cli,n:r.righe.length}));
ok(r.righe.length===8&&r.righe.every(x=>x.on),'PDF: 8 righe articolo, tutte vere (anche quelle con descrizione e codice a capo)');
ok(r.ctrl&&r.ctrl.ok===true&&r.ctrl.somma===1354.7,'totale ricontrollato: la somma delle righe coincide con il totale merce del fornitore');
ok(/Ho ricontrollato/.test(r.out),'il controllo del totale si vede');
ok(r.tipo.model==='vid'&&r.tipo.certo,'capisce che è un impianto di videosorveglianza');
ok(r.righe[0].code==='DS-2CD2143G2-I'&&r.righe[2].code==='DS-7608NXI-K2/8P'&&r.righe[0].br==='Hikvision','codici ricomposti e marca riconosciuta');
ok(/^Hikvision telecamera dome IP 4 MP/.test(r.righe[0].d)&&/PoE$/.test(r.righe[0].d),'descrizione pulita (non tutta maiuscola): '+r.righe[0].d);
ok(r.righe[0].q===4&&r.righe[0].cost===113.4&&r.righe[0].list===189&&r.righe[0].ver,'quantità, costo netto e listino giusti, importo verificato');
ok(r.righe[5].d.startsWith('Connettore RJ45')&&r.righe[4].d.startsWith('Cavo UTP'),'la riga che va a capo resta nella sua voce');
ok(vicino(r.righe[0].col,[211,47,47])&&vicino(r.righe[1].col,[46,125,50])&&vicino(r.righe[2].col,[21,101,192])&&vicino(r.righe[3].col,[249,168,37])&&vicino(r.righe[6].col,[106,27,154]),'foto dei prodotti ritagliate dal PDF e messe accanto alla riga giusta');
ok(!r.righe[4].img&&!r.righe[5].img&&!r.righe[7].img,'nessuna foto inventata dove il fornitore non la mette (e il logo in intestazione non è una foto)');
ok(r.cli&&r.cli.name==='Bianchi Luca'&&r.cli.addr==='Via Lucana 45, 75100 Matera'&&r.cli.tel==='347 1122334','cliente dal «Rif. cantiere»: nome, indirizzo e cellulare');
ok(!/0835|elettrolucane|IECI|Pesci/i.test(JSON.stringify(r.cli)),'nel cliente niente dati del fornitore né della tua ditta');
ok(r.spese.length===1&&r.spese[0].v===15&&/trasporto/i.test(r.out),'spese di trasporto riconosciute e non messe tra le voci');
ok(r.posa.some(x=>x.on&&/telecamera/i.test(x.d)&&x.q===6)&&r.posa.some(x=>x.on&&/cavo UTP/i.test(x.d)&&x.q===305),'posa dal tuo listino: 6 telecamere e 305 m di cavo');
ok(r.forn.nome==='ELETTROFORNITURE LUCANE S.r.l.'&&r.forn.num==='1543/2026','fornitore e numero dell\'offerta');
// creo il preventivo
await S(()=>{ const s=window.IECI_T.S(); s.lines=[]; s.client={name:'Vecchio Cliente',addr:'',tel:'',email:'',cf:''}; });
await p.click('#as-dok'); await p.waitForTimeout(900);
let st=await S(()=>{ const s=window.IECI_T.S(); return {model:s.model,tit:s.meta.title,cli:s.client,n:s.lines.length,l0:s.lines[0],ph:s.products.filter(x=>x.photos&&x.photos.length).length,arts:window.IECI_T.DB().arts.filter(a=>/ELETTROFORNITURE/.test(a.sup)).length,doc:document.getElementById('doc').innerText,out:document.getElementById('as-out').innerText}; });
ok(st.model==='vid'&&st.tit==='Impianto di videosorveglianza'&&st.n===10,'preventivo creato: videosorveglianza, 8 voci + 2 di posa');
ok(st.cli.name==='Bianchi Luca'&&st.cli.tel==='347 1122334','cliente nuovo, il vecchio non resta');
ok(st.l0.p===147.42&&st.l0.br==='Hikvision','prezzo al cliente = costo + ricarico 30%');
ok(st.ph===5,'5 schede prodotto con la foto del fornitore');
ok(st.arts===8,'articoli e costi salvati in Fornitori per lo storico');
ok(/Bianchi Luca/.test(st.doc)&&/Hikvision telecamera dome/.test(st.doc),'il fascicolo mostra cliente e voci');
ok(/Cerca le foto mancanti \(3\)/.test(st.out),'propone di cercare le 3 foto mancanti');

// 2. fotovoltaico senza foto: kWp per il montaggio, cliente da «Destinazione merce»
r=await carica(['fornitore-fotovoltaico.pdf']);
ok(r.tipo.model==='fv'&&r.ctrl.ok&&r.righe.length===7,'PDF fotovoltaico: 7 righe, totale imponibile verificato');
ok(r.posa.some(x=>x.on&&x.u==='kWp'&&x.q===6.02),'montaggio calcolato dai moduli: 14 × 430 W = 6,02 kWp');
ok(r.cli.name==='Az. Agricola Rossi Mario'&&/Pisticci \(MT\)/.test(r.cli.addr),'cliente da «Destinazione merce»');
ok(r.righe[0].br==='JA Solar'&&r.righe[1].br==='Huawei'&&/con display e Wi-Fi integrato/.test(r.righe[1].d),'marche e descrizione su due righe');

// 2b. gestionale: tabella fitta, colonne Rif/Marca/Codice, mittente e destinatario affiancati, C.F. del cliente
r=await carica(['fornitore-gestionale.pdf']);
ok(r.righe.length===6&&r.ctrl.ok&&r.ctrl.somma===557.3,'PDF da gestionale: 6 righe, totale merce verificato');
ok(r.righe[2].code==='KA4803KW'&&r.righe[0].code==='KM4001'&&r.righe[0].br==='Bticino'&&r.righe[3].br==='Hager','codice dalla colonna «Codice» (non il riferimento) e marca dalla colonna «Marca»');
ok(r.righe[0].d==='Interruttore 1P 16A Living Now bianco'&&r.righe[4].d==='Differenziale puro 2P 40A 30 mA tipo A'&&r.righe[3].d==='Magnetotermico 1P+N 16A 4,5 kA C','descrizioni pulite: serie, unità e sigle giuste');
ok(r.cli.name==='Esposito Gennaro'&&r.cli.cf==='SPSGNR68D15F839S'&&r.cli.chk.nomeCf&&r.cli.tel==='339 7654321'&&!/Altamura|080|IECI/i.test(JSON.stringify(r.cli)),'cliente dal «Rif. cliente» con C.F. controllato; esclusi mittente e destinatario affiancati');
ok(r.forn.nome==='Elettrica Murgia S.r.l.','fornitore riconosciuto');

// 3. Excel con colonna Marca, sconto in percentuale e foto nelle celle
r=await carica(['fornitore-domestico.xlsx']);
ok(r.righe.length===6&&r.ctrl.ok&&r.ctrl.somma===265,'Excel: 6 righe e totale imponibile verificato');
ok(r.righe.slice(0,4).every(x=>x.br===r.righe[0].br)&&r.righe[0].br==='Vimar'&&r.righe[4].br==='Gewiss','marca presa dalla colonna «Marca»');
ok(r.righe[0].cost===4.85&&r.righe[0].list===7.46,'prezzo netto e listino dall\'Excel');
ok(vicino(r.righe[0].col,[198,40,40])&&vicino(r.righe[1].col,[46,125,50])&&vicino(r.righe[2].col,[21,101,192])&&!r.righe[3].img,'foto dell\'Excel accanto alle righe giuste');
ok(r.cli.name==='Verdi Anna'&&r.cli.addr==='Via Dante 10, 75100 Matera'&&!r.cli.cf,'cliente dal «Riferimento», senza la P.IVA del fornitore');

// 4. Word con tabella e foto
r=await carica(['fornitore-allarme.docx']);
ok(r.tipo.model==='all'&&r.ctrl.ok&&r.righe.length===5,'Word: allarme, 5 righe, totale verificato');
ok(r.righe.filter(x=>x.img==='documento').length===3,'Word: 3 foto dalle celle della tabella');
ok(r.cli.name==='Condominio Le Rose'&&r.cli.addr==='Via Gramsci 8, 75100 Matera','cliente dal «Cantiere», non l\'indirizzo del fornitore');
ok(r.posa.some(x=>x.on&&/sensori/i.test(x.d)&&x.q===6),'posa dei 6 sensori');

// 5. contatto del telefono (vCard): solo dati del cliente
r=await carica(['cliente.vcf']);
ok(!r.righe.length&&r.cli.name==='Anna Verdi'&&r.cli.tel==='+39 347 123 4567'&&r.cli.addr==='Via San Rocco 5, 75100 Matera (MT)'&&r.cli.cf==='VRDNNA80A41F052D'&&r.cli.chk.cf&&r.cli.chk.nomeCf,'vCard: nome, cellulare, indirizzo e C.F. controllato (corrisponde al nome)');
ok(/C\.F\. valido e corrisponde al nome/.test(r.out)&&/Usa questi dati del cliente/.test(r.out),'mostra il controllo del codice fiscale');
await p.click('#as-dcli-go'); await p.waitForTimeout(300);
st=await S(()=>({c:window.IECI_T.S().client,cov:document.querySelector('#doc .cover')&&document.querySelector('#doc .cover').innerText}));
ok(st.c.name==='Anna Verdi'&&st.c.cf==='VRDNNA80A41F052D'&&st.c.email==='anna.verdi@gmail.com','dati del cliente inseriti nel preventivo, con il C.F.');
ok(!st.cov||/VRDNNA80A41F052D/.test(st.cov),'il C.F. compare in copertina');

// 6. due documenti insieme: preventivo del fornitore + contatto del cliente
r=await carica(['fornitore-videosorveglianza.pdf','cliente.vcf']);
ok(r.righe.length===8&&r.cli.name==='Anna Verdi'&&r.note.some(n=>/Bianchi Luca/.test(n)),'due documenti: voci dal fornitore, cliente dal contatto e avviso sull\'altro nome');

// 7. messaggi e testi: il cliente senza confusione
const T=[
 ["Buongiorno, sono Anna Verdi. Vi lascio i miei dati per il preventivo: Via Dante 10, 75100 Matera. Cell. 347 1234567, email anna.verdi@gmail.com, codice fiscale VRDNNA80A41F052D. Mi servirebbe un videocitofono.",['Anna Verdi','Via Dante 10, 75100 Matera','347 1234567','anna.verdi@gmail.com','VRDNNA80A41F052D']],
 ["Mario Rossi\nVia Roma 3\n75100 Matera MT\n333 9876543\nmario.rossi@libero.it",['Mario Rossi','Via Roma 3, 75100 Matera (MT)','333 9876543','mario.rossi@libero.it','']],
 ["Ciao, ti giro il contatto del cliente. Il fornitore è Elettro Sud srl tel 0835 111222 info@elettrosud.it.\n\nCliente: Lucia Bianco, Piazza Vittorio Veneto 12, 75100 Matera (MT), tel. 320 5556677, P.IVA 01234567897\n\nGrazie, IECI S.r.l. 392 762 2111",['Lucia Bianco','Piazza Vittorio Veneto 12, 75100 Matera (MT)','320 5556677','','P.IVA 01234567897']],
 ["Gentile IECI, sono il geom. Paolo Neri dello studio tecnico. Per il cantiere di via Lazio 22 a Matera la committente è la sig.ra Maria Gialli, 349 1112223. Saluti\nPaolo Neri",['Maria Gialli','Via Lazio 22, Matera','349 1112223','','']],
 ["STUDIO ROSSI\nArch. Giulia Rossi\nCorso Umberto I, 45 - 75100 Matera (MT)\nTel. 0835 123456 - Cell. 338 1234567\ngiulia@studiorossi.it\nC.F. RSSGLI85M41F052O",['Giulia Rossi','Corso Umberto I 45, 75100 Matera (MT)','338 1234567','giulia@studiorossi.it','RSSGLI85M41F052O']],
];
for(const [t,att] of T){ const c=await S(t=>{ const x=window.IECI_T.clLeggi(t,'libero'); return [x.name,x.addr,x.tel,x.email,x.cf]; },t); ok(JSON.stringify(c)===JSON.stringify(att),'testo → cliente: '+c.join(' · ')+(JSON.stringify(c)===JSON.stringify(att)?'':'  (atteso '+att.join(' · ')+')')); }
ok(await S(()=>window.IECI_T.clCfOk('VRDNNA80A41F052D')&&!window.IECI_T.clCfOk('VRDNNA80A41F052X')&&window.IECI_T.clPivaOk('01234567897')&&!window.IECI_T.clPivaOk('01234567890')),'controllo di codice fiscale e partita IVA');
// messaggio incollato nell'assistente: riconosce i dati del cliente
await S(()=>{ const a=window.IECI_T.AS(); a.doc=null; a.res=null; }); await A.mostra(p,'#as-txt');
await p.fill('#as-txt',T[0][0]); await p.click('#as-go'); await p.waitForTimeout(400);
st=await S(()=>({o:document.getElementById('as-out').innerText,doc:!!window.IECI_T.AS().doc}));
ok(/Anna Verdi/.test(st.o)&&/C\.F\. valido/.test(st.o),'descrizione con i dati del cliente: li legge e controlla il C.F.');

// 8. testo del fornitore incollato: righe vere, scarta il resto, segnala il totale che non torna
const incollato=['Offerta Elettro Sud S.r.l. - P.IVA 01234567897 - IBAN IT60X0542811101000000123456','Codice\tDescrizione\tUM\tQ.tà\tPrezzo\tImporto','A100\tMagnetotermico 1P+N 16A 4,5kA\tNR\t4\t9,50\t38,00','A200\tDifferenziale puro 2P 40A 30mA tipo A\tNR\t1\t48,00\t48,00','B300\tCorrugato pesante diametro 25 mm\tMT\t50\t0,42\t21,00','Via Roma 1 - 75100 Matera','Trasporto\t\t\t\t\t12,00','Totale imponibile\t\t\t\t\t130,00'].join('\n');
await S(()=>{ const a=window.IECI_T.AS(); a.doc=null; a.res=null; });
await p.fill('#as-txt',incollato); await p.click('#as-go');
await p.waitForFunction(()=>window.IECI_T.AS().doc,null,{timeout:20000});
st=await S(()=>{ const R=window.IECI_T.AS().doc; return {n:R.righe.length,d:R.righe.map(r=>r.d),u:R.righe.map(r=>r.u),ctrl:R.ctrl,sp:R.spese,o:document.getElementById('as-out').innerText,tipo:R.tipo.model}; });
console.log(JSON.stringify({ctrl:st.ctrl,d:st.d,u:st.u,n:st.n,sp:st.sp}));
ok(st.n===3&&st.u.join()==='cad,cad,m'&&!st.d.some(d=>/Roma|IBAN|Totale|Trasporto/i.test(d)),'testo incollato: solo le 3 righe articolo (niente indirizzi, IBAN, totali, trasporto)');
ok(st.ctrl.ok===false&&st.ctrl.diff===11&&/non coincide/.test(st.o),'totale che non torna: lo segnala (mancano 11,00 €)');

// 9. app installata: «Condividi» da WhatsApp verso l'app apre l'assistente con il documento
const q=await (await b.newContext({viewport:{width:430,height:900}})).newPage(); q.on('pageerror',e=>errs.push(e.message));
await q.goto('http://localhost:8124/index.html'); await q.evaluate(()=>navigator.serviceWorker.ready); await q.reload(); await q.waitForTimeout(1500);
const man=await q.evaluate(()=>fetch('manifest.webmanifest').then(r=>r.json()));
ok(man.share_target&&man.share_target.method==='POST'&&man.share_target.params.files[0].accept.indexOf('application/pdf')>-1,'manifest: l\'app compare in «Condividi» per PDF, foto, Excel, Word e contatti');
const fs=require('fs'); const b64=fs.readFileSync(path.join(DOCS,'fornitore-domestico.xlsx')).toString('base64');
const red=await q.evaluate(async b64=>{ const u=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)); const fd=new FormData(); fd.append('file',new File([u],'offerta.xlsx',{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})); fd.append('text','Ecco il preventivo'); const r=await fetch('condividi',{method:'POST',body:fd}); return r.url; },b64);
ok(/index\.html\?condiviso=1/.test(red),'il documento condiviso arriva all\'app');
await q.goto(red); await q.waitForFunction(()=>window.IECI_T&&window.IECI_T.AS&&window.IECI_T.AS().doc,null,{timeout:30000}).catch(()=>{});
st=await q.evaluate(()=>{ const R=window.IECI_T.AS().doc; return R&&{n:R.righe.length,f:R.file,u:location.search}; });
ok(st&&st.n===6&&st.f[0]==='offerta.xlsx'&&!st.u,'aperto da solo nell\'assistente: 6 voci lette');

console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
