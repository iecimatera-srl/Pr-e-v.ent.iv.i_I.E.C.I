// Il caso «Bia Patrizia»: un preventivo su Android che su Windows non arrivava. Una foto mancante su GitHub non deve
// più bloccare niente (né ricevere né mandare); la foto viene ricaricata da chi ce l'ha; controllo «qui · su GitHub»;
// «Oggi» con gli stessi numeri su tutti e due; avviso per un dispositivo con versione vecchia; «Dov'è il mio preventivo?»
// che lo ritrova nelle copie dei giorni passati su GitHub e lo rimette.
const A=require('./_amb.cjs');
const G=require('./_github_finto.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const errs=[];
async function dispositivo(nome,mobile){
  const ctx=await b.newContext(mobile?{viewport:{width:390,height:820},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:900}});
  await G.finto(ctx);
  await ctx.addInitScript(n=>{ window.IECI_AUTO={quiete:700,max:2500,poll:1500,ritorno:0}; try{ const g=JSON.parse(localStorage.getItem('ieci-gh')||'{}'); if(!g.nome){ g.nome=n; localStorage.setItem('ieci-gh',JSON.stringify(g)); } }catch(e){} },nome);
  const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(nome+': '+e.message)); p.on('dialog',d=>d.accept());
  await p.goto(A.SA); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S&&window.IECI_T.DB&&window.IECI_T.DB().quotes,null,{timeout:30000});
  await p.waitForFunction(()=>document.getElementById('gh-chip').dataset.st==='ok',null,{timeout:20000}).catch(()=>{});
  return {ctx,p,S:(f,a)=>p.evaluate(f,a)};
}
const aspetta=(d,f,a,t)=>d.p.waitForFunction(f,a,{timeout:t||20000}).then(()=>true).catch(()=>false);
const fermo=d=>aspetta(d,()=>document.getElementById('gh-chip').dataset.st==='ok'&&!window.IECI_T.ghBusy()&&!window.IECI_T.GH().dirty,null,30000);
const sinc=async d=>{ await aspetta(d,()=>!window.IECI_T.ghBusy()); await d.S(()=>window.IECI_T.ghSync(false)); await d.p.waitForTimeout(200); await fermo(d); };
const fotoNel=()=>Object.keys(G.stato.files).filter(k=>k.startsWith('foto/'));

// 1. Android: «Bia Patrizia», inviato, con la foto del monitor
const D=await dispositivo('Android',true);
await D.S(()=>{ const T=window.IECI_T, s=T.S(); const c=document.createElement('canvas'); c.width=300; c.height=200; const x=c.getContext('2d'); x.fillStyle='#246'; x.fillRect(0,0,300,200); x.fillStyle='#fc0'; x.fillRect(40,40,120,80); const f=c.toDataURL('image/jpeg',.9);
  s.qid=''; s.client={name:'Bia Patrizia',addr:'Via Lucana 10, Matera',tel:'',email:'',cf:''}; s.meta.title='Impianto elettrico Bia'; s.meta.status='inviato';
  s.lines=[{d:'Punto luce',u:'pt',q:5,p:40,s:0}]; s.products=[{id:'pb',name:'Monitor Bia',brand:'Vimar',code:'',desc:'',specs:'',link:'',tags:'',photos:[f],po:[f]}];
  T.touch(); T.renderAll(); T.saveQuote(true); T.ghSync(false); });
await fermo(D);
const idB=await D.S(()=>window.IECI_T.DB().quotes.find(q=>q.client==='Bia Patrizia').id);
const fb=fotoNel();
ok(G.archivio()&&G.archivio().db.quotes.some(q=>q.client==='Bia Patrizia')&&fb.length>=1,'Android: «Bia Patrizia» su GitHub, con la foto come file ('+fb.length+')');
// la foto su GitHub sparisce (è quello che fermava tutto)
const persi={}; fb.forEach(k=>{ persi[k]=G.stato.files[k]; delete G.stato.files[k]; });

// 2. Windows si apre: riceve lo stesso «Bia Patrizia», e non si blocca
const W=await dispositivo('Windows',false);
let r=await aspetta(W,i=>window.IECI_T.DB().quotes.some(q=>q.id===i),idB,30000);
ok(r,'Windows riceve «Bia Patrizia» anche se la sua foto su GitHub manca (prima non arrivava proprio)');
await fermo(W);
ok(await W.S(()=>document.getElementById('gh-chip').dataset.st==='ok'),'…e il salvataggio di Windows non è bloccato (stato: «Salvato»)');
ok(/foto non scaricat/.test(await W.S(()=>document.getElementById('gh-state').textContent)),'il messaggio dice che una foto è ancora in arrivo');
// 3. Windows lavora: le sue modifiche arrivano su GitHub
await W.S(()=>{ const T=window.IECI_T, s=T.S(); s.qid=''; s.client={name:'Rossi Mario',addr:'',tel:'',email:'',cf:''}; s.meta.title='Quadro Rossi'; s.meta.status='inviato'; s.lines=[{d:'Quadro elettrico',u:'cad',q:1,p:900,s:0}]; s.products=[]; T.touch(); T.renderAll(); T.saveQuote(true); });
await fermo(W); await sinc(W);
ok(G.archivio().db.quotes.some(q=>q.client==='Rossi Mario'),'Windows manda su GitHub il suo preventivo nuovo (non è più fermo)');
// 4. Android si accorge che la foto manca e la ricarica
await sinc(D);
ok(fotoNel().length>=fb.length,'Android vede che su GitHub la foto manca e la ricarica da solo');
ok(await D.S(()=>window.IECI_T.DB().quotes.some(q=>q.client==='Rossi Mario')),'Android riceve il preventivo di Windows');
// 5. Windows riceve la foto
await sinc(W); await sinc(W);
ok(await W.S(i=>{ const q=window.IECI_T.DB().quotes.find(x=>x.id===i); return JSON.stringify(q).indexOf('ghf:')<0&&/data:image/.test(JSON.stringify(q.data.products)); },idB),'Windows riceve anche la foto di «Bia Patrizia»');
// 6. controllo di coerenza su tutti e due
await sinc(D); await sinc(W);
const cW=await W.S(()=>window.IECI_T.tr.coer()), cD=await D.S(()=>window.IECI_T.tr.coer());
ok(cW.qui===2&&cW.gh===2&&!cW.mancaQui.length&&!cW.mancaGh.length&&cD.qui===2&&cD.gh===2,'controllo: «2 preventivi qui · 2 su GitHub» su Windows e su Android');
ok(await D.S(()=>{ const d=window.IECI_T.GH().disp; return Object.values(d).filter(v=>v.nq===2).length===2; }),'nel pannello ogni dispositivo dice quanti preventivi ha (2 e 2)');

// 7. «Oggi»: stessi numeri su tutti e due, anche con una vecchia copia di conflitto rimasta su un dispositivo
await W.S(i=>{ const DB=window.IECI_T.DB(), o=DB.quotes.find(x=>x.id===i), c=JSON.parse(JSON.stringify(o)); c.id='vecchiacopia'; c.conf={dv:'Android',t:1,orig:'nessuno'}; DB.quotes.push(c); },idB);
const oW=await W.S(()=>window.IECI_T.tr.oggi()), oD=await D.S(()=>window.IECI_T.tr.oggi());
console.log('     Oggi Windows '+JSON.stringify(oW.att)+' · Android '+JSON.stringify(oD.att));
ok(oW.att.n===2&&oD.att.n===2&&Math.round(oW.att.v)===Math.round(oD.att.v),'«In attesa di risposta»: stesso totale su Windows e Android (la copia vecchia non conta)');
await W.S(()=>{ const DB=window.IECI_T.DB(); DB.quotes.splice(DB.quotes.findIndex(q=>q.id==='vecchiacopia'),1); });
// un sì da Android: «Accettati questo mese» uguale anche su Windows
const idR=await D.S(()=>window.IECI_T.DB().quotes.find(q=>q.client==='Rossi Mario').id);
await D.S(i=>{ document.querySelector('[data-ogq]'); const q=window.IECI_T.DB().quotes.find(x=>x.id===i); q.st='accettato'; q.data.meta.status='accettato'; q.upd=Date.now(); q.stT=q.upd; window.IECI_T.dbSave(); },idR);
await fermo(D); await sinc(D); await sinc(W);
const aW=await W.S(()=>window.IECI_T.tr.oggi()), aD=await D.S(()=>window.IECI_T.tr.oggi());
ok(aW.accM.n===1&&aD.accM.n===1&&Math.round(aW.accM.v)===Math.round(aD.accM.v)&&aW.att.n===1&&aD.att.n===1,'«Accettati questo mese» e «In attesa»: uguali sui due dispositivi ('+aW.accM.n+'/'+aD.accM.n+', '+aW.att.n+'/'+aD.att.n+')');
ok(await W.S(i=>!!window.IECI_T.DB().quotes.find(x=>x.id===i).stT,idR),'la data del «sì» viaggia con il preventivo');

// 8. un terzo dispositivo con la versione vecchia: avviso chiaro
{ const o=G.grezzo(); o.disp=o.disp||{}; o.disp.dvecchio={n:'Portatile',a:'2026.11.10.1',t:Date.now(),m:'file'}; G.scrivi(o); }
r=await aspetta(W,()=>window.IECI_T.tr.problemi().some(x=>/Portatile/.test(x.t)&&/versione vecchia/.test(x.t)),null,20000);
ok(r,'Windows avvisa: «Portatile ha una versione vecchia dell\'app: non riceve e non salva più»');
await W.S(()=>{ window.IECI_T.showPanel('home'); }); await W.p.waitForTimeout(500);
ok(await W.S(()=>!!document.querySelector('#og .tr-ban')&&/Portatile/.test(document.querySelector('#og .tr-ban').textContent)),'l\'avviso si vede in «Oggi», con «Vedi i dettagli»');
await W.S(()=>document.querySelector('#og [data-trvai]').click()); await W.p.waitForTimeout(500);
ok(await W.S(()=>document.getElementById('acc-sync').open&&/Portatile/.test(document.getElementById('tr-coer').textContent)),'«Vedi i dettagli» apre il salvataggio con il problema spiegato');

// 9. «Dov'è il mio preventivo?»: un preventivo che c'è solo in una copia di giorni fa su GitHub
{ const o=G.grezzo(); const q=JSON.parse(JSON.stringify(o.db.quotes.find(x=>x.client==='Rossi Mario'))); q.id='qbianchi'; q.client='Bianchi Luca'; q.name=''; q.title='Bagno Bianchi'; q.data.qid=q.id; q.data.client.name='Bianchi Luca'; q.data.meta.title='Bagno Bianchi'; o.db.quotes=[q];
  G.stato.files['copie/2026-11-20.json']={sha:'s'+(++G.stato.n),b64:Buffer.from(JSON.stringify(o)).toString('base64')}; }
await W.S(()=>window.IECI_T.tr.cerca('bia patrizia'));
await aspetta(W,()=>/Ricerca finita/.test(document.getElementById('tr-st').textContent),null,25000);
let rv=await W.S(()=>window.IECI_T.tr.ris());
ok(rv.length>=1&&/È qui/.test(rv[0].dove),'cerco «bia patrizia» (minuscolo): «È qui, nell\'archivio di questo dispositivo» '+JSON.stringify(rv.map(x=>x.dove)));
await W.S(()=>window.IECI_T.tr.cerca('Bianchi'));
await aspetta(W,()=>/Ricerca finita/.test(document.getElementById('tr-st').textContent),null,25000);
rv=await W.S(()=>window.IECI_T.tr.ris());
const iB=rv.findIndex(x=>/20\/11\/2026/.test(x.dove)&&x.az==='Rimettilo qui');
ok(iB>-1,'cerco «Bianchi»: trovato «Nella copia del giorno 20/11/2026 su GitHub», con «Rimettilo qui» '+JSON.stringify(rv.map(x=>x.dove)));
await W.S(i=>window.IECI_T.tr.fai(i),iB); await W.p.waitForTimeout(800);
ok(await W.S(()=>window.IECI_T.DB().quotes.some(q=>q.client==='Bianchi Luca')),'«Rimettilo qui»: il preventivo torna nell\'archivio');
await fermo(W); await sinc(W);
ok(G.archivio().db.quotes.some(q=>q.client==='Bianchi Luca'),'…e va su GitHub da solo');
r=await aspetta(D,()=>window.IECI_T.DB().quotes.some(q=>q.client==='Bianchi Luca'),null,25000);
ok(r,'…e arriva anche su Android');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
