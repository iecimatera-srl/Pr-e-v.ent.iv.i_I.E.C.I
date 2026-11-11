// «Oggi»: il cruscotto d'apertura. Numeri giusti dall'archivio, «Da seguire» con sollecito ed esito (con Annulla),
// grafico, ultimi preventivi, pulsanti grandi, scelta della pagina d'apertura, scorciatoie dell'icona, numero sull'icona
process.env.IECI_OGGI='1';
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await ctx.addInitScript(()=>{ window.__open=[]; window.open=function(u){ window.__open.push(u); return null; }; window.__badge=null; navigator.setAppBadge=function(n){ window.__badge=n; return Promise.resolve(); }; navigator.clearAppBadge=function(){ window.__badge=0; return Promise.resolve(); }; });
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.ogStato&&window.IECI_T.S,null,{timeout:30000});
const S=(f,a)=>p.evaluate(f,a);
const pan=()=>S(()=>[...document.querySelectorAll('[data-panel]')].find(s=>!s.hidden).getAttribute('data-panel'));
// 1. si apre su «Oggi», primo avvio
let st=await S(()=>({t:document.getElementById('og').innerText,qb:document.getElementById('qbar').checkVisibility(),cur:(document.querySelector('#bnav [aria-current="page"]')||{}).innerText}));
ok(await pan()==='home'&&/Buon(giorno| pomeriggio|asera)/.test(st.t)&&/Come funziona/.test(st.t)&&/Nuovo preventivo/.test(st.t)&&/Descrivi il lavoro/.test(st.t),'l\'app si apre su «Oggi»: saluto, due pulsanti grandi e, senza preventivi, «Come funziona»');
ok(!st.qb&&st.cur.trim()==='Oggi','in «Oggi» la barra del preventivo lascia spazio; «Oggi» acceso nella barra in basso');
// 2. archivio di prova: numeri
await S(()=>{ const T=window.IECI_T, g=86400000, now=Date.now(), Q=T.DB().quotes; Q.length=0;
  const mk=(id,c,tot,st,gg,tel)=>{ const d=JSON.parse(JSON.stringify(T.S())); delete d.cat; d.client={name:c,tel:tel||'',addr:'',email:'',cf:''}; d.meta.status=st; d.meta.date=new Date(now-gg*g).toISOString().slice(0,10); d.meta.num='2026/'+id; d.qid=id; Q.push({id:id,num:d.meta.num,st:st,name:'',title:'Impianto',client:c,tot:tot,upd:now-gg*g,sat:now-gg*g,model:'dom',data:d}); };
  mk('a1','Anna Bianchi',4850,'inviato',6,'333 123 4567'); mk('a2','Luca Verdi',2180,'inviato',1,''); mk('a3','Studio Rinaldi',6900,'accettato',0); mk('a4','Bar Centrale',1890,'rifiutato',20); mk('a5','Giulia Moro',1450,'bozza',0); mk('a6','Hotel Sassi',9800,'accettato',400);
  T.renderOggi(); });
await p.waitForTimeout(900);
st=await S(()=>{ const o=window.IECI_T.ogStato(); return {att:[o.att.n,o.att.v],accM:[o.accM.n,o.accM.v],tasso:o.tasso,boz:o.boz,daSeg:o.daSeg,k:[...document.querySelectorAll('#og .og-k')].map(k=>k.innerText.replace(/\n+/g,' | ')),badge:window.__badge}; });
console.log(JSON.stringify(st.k));
ok(st.att.join()==='2,7030'&&st.accM.join()==='1,6900'&&st.tasso===67&&st.boz===1,'conti: 2 in attesa (7.030 €), 1 accettato nel mese (6.900 €), 67% dicono sì, 1 bozza');
ok(/7\.030 €/.test(st.k[0])&&/6\.900 €/.test(st.k[1])&&/67%/.test(st.k[2])&&/2 sì · 1 no/.test(st.k[2]),'i riquadri mostrano gli stessi numeri');
ok(st.daSeg===1&&st.badge===1,'1 preventivo da seguire (inviato da 6 giorni): il numero va anche sull\'icona dell\'app');
st=await S(()=>({tit:document.querySelector('.og-tit').innerText,seg:[...document.querySelectorAll('#og .og-s')].map(s=>s.className+'|'+s.querySelector('.og-sm').innerText.replace(/\n/g,' | ')+'|wa:'+!!s.querySelector('[data-ogwa]')),gr:document.querySelectorAll('#og .og-graf .og-col').length,ul:[...document.querySelectorAll('#og .og-u .og-ut b')].map(x=>x.textContent)}));
ok(/1 preventivo aspetta/.test(st.tit),'il titolo dice cosa c\'è da fare: «'+st.tit+'»');
ok(st.seg.length===2&&/caldo\|Anna Bianchi \| 4\.850,00 € · inviato da 6 giorni\|wa:true/.test(st.seg[0])&&/Luca Verdi.*inviato ieri\|wa:false/.test(st.seg[1]),'«Da seguire»: il più vecchio per primo ed evidenziato; WhatsApp solo se c\'è il telefono');
ok(st.gr===6&&st.ul.length===5,'grafico di 6 mesi e ultimi 5 preventivi');
// 3. sollecito su WhatsApp: solo verso il numero del cliente, e resta segnato
await p.click('#og [data-ogwa="a1"]'); await p.waitForTimeout(300);
st=await S(()=>({u:window.__open[0],t:document.querySelector('#og .og-s').innerText,ds:window.IECI_T.ogStato().daSeg}));
ok(/^https:\/\/wa\.me\/393331234567\?text=/.test(st.u)&&/Buongiorno%20Anna%20Bianchi/.test(st.u)&&/2026%2Fa1/.test(st.u),'«Sollecita» apre WhatsApp del cliente con il messaggio pronto');
ok(/sollecitato oggi/.test(st.t)&&st.ds===0,'resta segnato «sollecitato oggi» e non è più tra quelli da seguire');
// 4. esito con un tocco, con Annulla
await p.click('#og [data-ogst="a2|accettato"]'); await p.waitForTimeout(300);
st=await S(()=>({q:window.IECI_T.DB().quotes.find(x=>x.id==='a2').st,n:window.IECI_T.ogStato().att.n,to:document.getElementById('toast').innerText}));
ok(st.q==='accettato'&&st.n===1&&/Luca Verdi: accettato/.test(st.to)&&/Annulla/.test(st.to),'«Accettato» con un tocco, con «Annulla» a portata di mano');
await p.click('#toast button'); await p.waitForTimeout(300);
ok(await S(()=>window.IECI_T.DB().quotes.find(x=>x.id==='a2').st==='inviato'&&window.IECI_T.ogStato().att.n===2),'«Annulla» rimette com\'era');
// 5. tocco su un preventivo: si apre
await p.click('#og .og-u[data-ogq="a3"]'); await p.waitForTimeout(500);
ok(await pan()==='prev'&&await S(()=>window.IECI_T.S().client.name==='Studio Rinaldi'&&document.getElementById('qbar').checkVisibility()),'tocco su «Studio Rinaldi»: preventivo aperto, pronto da modificare');
await p.click('#bnav [data-bp="home"]'); await p.waitForTimeout(400);
st=await S(()=>document.querySelector('#og .og-rip').innerText.replace(/\n/g,' | '));
ok(/Riprendi \| Studio Rinaldi/i.test(st),'tornando su «Oggi» c\'è «Riprendi · Studio Rinaldi»');
// 6. pulsanti grandi
await p.click('#og [data-og="nuovo"]'); await p.waitForTimeout(500);
ok(await pan()==='dati'&&await S(()=>!window.IECI_T.S().client.name&&!window.IECI_T.S().lines.length),'«Nuovo preventivo»: preventivo vuoto, si parte dal cliente');
await S(()=>window.IECI_T.showPanel('home')); await p.waitForTimeout(300);
await p.click('#og [data-og="detta"]'); await p.waitForTimeout(600);
ok(await pan()==='prev'&&await S(()=>document.getElementById('acc-as').open&&document.activeElement.id==='as-txt'),'«Descrivi il lavoro»: assistente aperto con il cursore pronto');
await S(()=>window.IECI_T.showPanel('home')); await p.waitForTimeout(300);
await p.click('#og .og-k.att'); await p.waitForTimeout(500);
ok(await pan()==='prev'&&await S(()=>document.getElementById('acc-save').open&&document.querySelectorAll('#q-list .rowc').length===2),'tocco su «In attesa di risposta»: i 2 preventivi inviati, già filtrati');
// 7. scelta della pagina d'apertura
await S(()=>window.IECI_T.showPanel('app')); await p.selectOption('#ap-avvio','prev'); await p.waitForTimeout(200);
await p.reload(); await p.waitForTimeout(1500); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.ogStato);
ok(await pan()==='prev','scelto «Il preventivo aperto»: alla riapertura si parte dal preventivo');
await S(()=>localStorage.setItem('ieci-avvio','home'));
// 8. scorciatoie dell'icona
await p.goto(A.SA+'?azione=nuovo'); await p.waitForTimeout(1500); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.ogStato);
ok(await pan()==='dati'&&!/azione/.test(p.url()),'scorciatoia «Nuovo preventivo» dall\'icona: parte un preventivo nuovo');
await p.goto(A.SA+'?azione=detta'); await p.waitForTimeout(1600); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.ogStato);
ok(await pan()==='prev'&&await S(()=>document.getElementById('acc-as').open),'scorciatoia «Descrivi il lavoro»: assistente aperto');
const mf=require('fs').readFileSync(require('path').join(require('path').dirname(A.PWA_INDEX),'manifest.webmanifest'),'utf8');
ok(JSON.parse(mf).shortcuts.length===3&&JSON.parse(mf).share_target,'il manifesto dell\'app dichiara le 3 scorciatoie (e resta la condivisione verso l\'app)');
// 9. computer e 360 px
await p.goto(A.SA); await p.waitForTimeout(1500); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.ogStato);
await p.setViewportSize({width:360,height:780}); await p.waitForTimeout(300);
st=await S(()=>{ const o=[]; document.querySelectorAll('#oggi *').forEach(e=>{ if(e.closest('.og-aur')||e.classList.contains('og-aur')||e.closest('svg')) return; const r=e.getBoundingClientRect(); if(r.width&&r.right>innerWidth+1) o.push(e.className||e.tagName); }); return {o:o,pan:[...document.querySelectorAll('[data-panel]')].find(s=>!s.hidden).getAttribute('data-panel')}; });
ok(st.pan==='home'&&!st.o.length,'360 px: niente esce dallo schermo '+JSON.stringify(st.o.slice(0,4)));
await p.setViewportSize({width:1366,height:900}); await p.waitForTimeout(300);
ok(await S(()=>document.getElementById('paperWrap').checkVisibility()&&document.getElementById('og').checkVisibility()),'sul computer: «Oggi» a sinistra e anteprima del fascicolo a destra');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
