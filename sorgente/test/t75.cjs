// Motore più fluido: anteprima incrementale, foto come blob, cursore conservato, librerie PDF a parte, PIN rapido
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:430,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SRC);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S,null,{timeout:20000}).catch(()=>{});
const S=(f,a)=>p.evaluate(f,a);
await A.mostra(p,'#as-txt'); await p.fill('#as-txt','Bilocale per Rossi Mario, Bticino'); await p.click('#as-go'); await p.waitForTimeout(200); await p.click('#as-ok'); await p.waitForTimeout(800);
await S(()=>{ const c=document.createElement('canvas'); c.width=400; c.height=300; const x=c.getContext('2d'); x.fillStyle='#c33'; x.fillRect(0,0,400,300); x.fillStyle='#fff'; x.fillRect(50,50,120,90); const u=c.toDataURL('image/jpeg',0.9); const s=window.IECI_T.S(); s.products.slice(0,3).forEach(p=>p.photos=[u]); window.IECI_T.touch(); });
await p.waitForTimeout(600);
let st=await S(()=>{ const im=[...document.querySelectorAll('#doc img')]; return {blob:im.filter(i=>i.src.startsWith('blob:')).length,data:im.filter(i=>/^data:image\/(jpeg|png);base64,.{400}/.test(i.src)).length}; });
ok(st.blob>=3&&st.data===0,'foto del fascicolo come blob (decodificate una volta): '+st.blob);
// segno tutte le pagine: dopo una modifica a una riga deve cambiare solo la pagina del preventivo
await S(()=>[...document.querySelectorAll('#doc > .page')].forEach((pg,i)=>pg.__id='p'+i));
const n0=await S(()=>document.querySelectorAll('#doc > .page').length);
await A.mostra(p,'#lines');
await p.click('#lines .line input[data-f="d"]'); await p.keyboard.type(' XYZ',{delay:30}); await p.waitForTimeout(700);
st=await S(()=>{ const pgs=[...document.querySelectorAll('#doc > .page')]; return {n:pgs.length,same:pgs.filter(x=>x.__id).length,changed:pgs.filter(x=>!x.__id).map(x=>x.innerText.slice(0,40)),has:/XYZ/.test(document.getElementById('doc').innerText)}; });
console.log(JSON.stringify(st));
ok(st.has&&st.n===n0&&st.changed.length>=1&&st.same>=st.n-2,'scrivendo cambia solo la pagina interessata ('+st.changed.length+' su '+st.n+')');
// cursore: dalla descrizione tocco la quantità e scrivo, senza perdere il campo
await p.click('#lines .line input[data-f="q"]'); await p.waitForTimeout(150);
st=await S(()=>({f:document.activeElement&&document.activeElement.getAttribute('data-f'),conn:document.activeElement&&document.activeElement.isConnected}));
ok(st.f==='q'&&st.conn,'passando alla quantità il campo resta attivo (non viene ridisegnato)');
await p.keyboard.press('Control+A'); await p.keyboard.type('7'); await p.waitForTimeout(300);
ok(await S(()=>window.IECI_T.S().lines[0].q===7&&/XYZ/.test(window.IECI_T.S().lines[0].d)),'quantità e descrizione salvate');
// la scheda Prodotti si disegna quando la apri
await S(()=>{ const s=window.IECI_T.S(); s.products[0].name='Nome cambiato fuori vista'; window.IECI_T.touch(); });
await A.mostra(p,'#plist'); await p.waitForTimeout(200);
ok(await S(()=>/Nome cambiato fuori vista/.test(document.getElementById('plist').innerHTML)),'Prodotti aggiornata appena la apri');
// salvataggio quando si chiude l'app
await S(()=>{ window.IECI_T.S().meta.title='Titolo salvato alla chiusura'; window.IECI_T.touch(); window.dispatchEvent(new Event('pagehide')); });
await p.waitForTimeout(400); await p.reload(); await p.waitForTimeout(1500);
ok(await S(()=>window.IECI_T.S().meta.title==='Titolo salvato alla chiusura'),'nessuna modifica persa riaprendo');

// app installata: le librerie PDF sono file a parte e il PDF si crea lo stesso
const q=await (await b.newContext({viewport:{width:430,height:900}})).newPage(); q.on('pageerror',e=>errs.push(e.message));
const req=[]; q.on('request',r=>req.push(r.url()));
await q.goto('http://localhost:8124/index.html'); await q.waitForTimeout(2000);
const peso=await q.evaluate(()=>performance.getEntriesByType('navigation')[0].decodedBodySize);
ok(peso<2500000&&!req.some(u=>/lib-pdf/.test(u)),'app installata: pagina leggera ('+Math.round(peso/1e6*10)/10+' MB), librerie PDF non scaricate all\'avvio');
const pdf=await q.evaluate(()=>window.IECI_T.buildPdf(false).then(b=>b.size).catch(e=>'ERR '+e.message));
ok(typeof pdf==='number'&&pdf>20000&&req.some(u=>/lib-pdf\.js/.test(u)),'PDF creato caricando la libreria quando serve ('+pdf+' byte)');

// PIN: tastierino subito e sblocco
await p.evaluate(async()=>{ const e=new TextEncoder(), salt='ab12'; const k=await crypto.subtle.importKey('raw',e.encode('135790'),'PBKDF2',false,['deriveBits']); const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:e.encode(salt),iterations:600000,hash:'SHA-256'},k,256); const h=[...new Uint8Array(bits)].map(x=>('0'+x.toString(16)).slice(-2)).join(''); localStorage.setItem('ieci-pin',JSON.stringify({h,s:salt,m:'p',i:600000,rh:'x',rs:'y',auto:5,f:0,u:0,r:0})); sessionStorage.removeItem('ieci-pin-ok'); });
await p.goto(A.SRC,{waitUntil:'commit'});
await p.waitForFunction(()=>{ const l=document.getElementById('lock'); return l&&!l.hidden&&document.querySelectorAll('#lk-pad button[data-k]').length===11; },null,{polling:10,timeout:20000});
for(const c of '135') await p.click('#lk-pad [data-k="'+c+'"]');
await p.waitForTimeout(1200);
ok(await S(()=>document.querySelectorAll('#lk-dots i.on').length===3&&document.documentElement.classList.contains('locked')),'tasti premuti mentre l\'app si carica: tenuti');
for(const c of '790') await p.click('#lk-pad [data-k="'+c+'"]');
await p.waitForFunction(()=>document.getElementById('lock').hidden,null,{timeout:10000}).catch(()=>{});
ok(await S(()=>document.getElementById('lock').hidden&&!document.documentElement.classList.contains('locked')),'sbloccato con il PIN');
await p.waitForTimeout(800);
ok(await S(()=>document.querySelectorAll('#doc .page').length>0&&document.querySelectorAll('#lines .line').length>0),'dopo lo sblocco l\'app si disegna');
await p.waitForTimeout(3500);
st=await S(()=>JSON.parse(localStorage.getItem('ieci-pin')));
ok(st.tuned===1&&((st.i<600000&&st.i>=150000&&st.ri===600000)||(st.i===600000&&!st.ri)),'PIN ricifrato su misura per il dispositivo ('+st.i+' iterazioni)');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
