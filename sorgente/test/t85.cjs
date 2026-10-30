// Blocco con PIN «Quadro»: ogni tocco conta una volta sola anche mentre l'app si carica (telefono lento simulato),
// niente cifre perse o doppie, sblocco con l'app già pronta, logo subito, impronta (sensore simulato), tastiera
const A=require('./_amb.cjs'), crypto=require('crypto'), http=require('http'), fs=require('fs'), path=require('path');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const PWA=path.dirname(A.PWA_INDEX);
const pinCon=(code,it)=>{ const salt='a1b2c3d4e5f60718'; return {h:crypto.pbkdf2Sync(code,salt,it,32,'sha256').toString('hex'),s:salt,m:'p',i:it,rh:'x',rs:'y',auto:5,f:0,u:0,r:0,tuned:1}; };
(async()=>{const b=await A.chromium.launch(); const E=[];
// piccolo server locale (l'impronta funziona solo su https o localhost, come sul sito dell'app)
const srv=http.createServer((q,r)=>{ let f=decodeURIComponent(q.url.split('?')[0]); if(f==='/') f='/index.html'; const p=path.join(PWA,f); if(!p.startsWith(PWA)||!fs.existsSync(p)){ r.writeHead(404); return r.end(); } r.writeHead(200,{'content-type':/\.html$/.test(p)?'text/html; charset=utf-8':/\.js$/.test(p)?'text/javascript':'application/octet-stream'}); fs.createReadStream(p).pipe(r); });
await new Promise(r=>srv.listen(0,'127.0.0.1',r)); const URL='http://localhost:'+srv.address().port+'/index.html';

// 1. telefono lento (CPU ×4), PIN scritto velocissimo mentre l'app si sta ancora caricando: tutte le cifre, nessun doppione
{ const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await ctx.addInitScript(p=>{ localStorage.setItem('ieci-pin',p); sessionStorage.clear(); window.__d=0; document.addEventListener('pointerdown',()=>window.__d++,true); },JSON.stringify(pinCon('482915',300000)));
  const p=await ctx.newPage(); p.on('pageerror',e=>E.push(e.message)); const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  p.goto(URL).catch(()=>{});
  await p.waitForFunction(()=>{ const l=document.getElementById('lock'); return l&&!l.hidden&&document.querySelectorAll('#lk-pad button[data-k]').length===12; },null,{polling:10,timeout:20000});
  const pos=await p.evaluate(()=>{ const o={}; document.querySelectorAll('#lk-pad button[data-k]').forEach(b=>{ const r=b.getBoundingClientRect(); o[b.getAttribute('data-k')]=[r.x+r.width/2,r.y+r.height/2]; }); return o; });
  for(const k of '482915'){ const [x,y]=pos[k]; cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]}); cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await new Promise(r=>setTimeout(r,90)); }
  await p.waitForFunction(()=>document.getElementById('lock').hidden,null,{timeout:20000}).catch(()=>{});
  const st=await p.evaluate(()=>({aperto:document.getElementById('lock').hidden&&!document.documentElement.classList.contains('locked'),tocchi:window.__d,pin:JSON.parse(localStorage.getItem('ieci-pin'))}));
  ok(st.aperto&&st.tocchi===6&&st.pin.f===0,'telefono lento, PIN scritto durante il caricamento: 6 tocchi, 6 cifre, sbloccato al primo colpo');
  await p.waitForTimeout(1500);
  ok(await p.evaluate(()=>document.querySelectorAll('#lines .line').length>0&&document.querySelectorAll('#doc .page').length>0),'dopo lo sblocco l\'app e il fascicolo sono pronti');
  await ctx.close(); }

// 2. clic in ritardo dopo il tocco (telefono occupato): non diventa una seconda cifra
{ const ctx=await b.newContext({viewport:{width:390,height:844}}); await ctx.addInitScript(p=>{ localStorage.setItem('ieci-pin',p); sessionStorage.clear(); },JSON.stringify(pinCon('482915',150000)));
  const p=await ctx.newPage(); p.on('pageerror',e=>E.push(e.message)); await p.goto(URL); await p.waitForTimeout(800);
  const n=await p.evaluate(()=>{ const B=k=>document.querySelector('#lk-pad [data-k="'+k+'"]'); const pd=k=>B(k).dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',isPrimary:true})); const ck=k=>B(k).dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}));
    pd('4'); pd('8'); ck('4'); ck('8'); pd('2'); ck('2'); return document.querySelectorAll('#lk-dots i.on').length; });
  ok(n===3,'tocchi e clic arrivati in disordine: 3 tocchi = 3 cifre ('+n+')');
  // tastiera: cifre e Cancella; Invio sul tasto selezionato conta una volta
  await p.keyboard.press('Backspace'); await p.keyboard.press('Backspace'); await p.keyboard.press('Backspace');
  await p.keyboard.type('4829'); await p.focus('#lk-pad [data-k="1"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  ok(await p.evaluate(()=>document.querySelectorAll('#lk-dots i.on').length===5),'tastiera del computer: cifre, Cancella e Invio sul tasto');
  // PIN sbagliato: spie rosse, messaggio, tentativi contati
  await p.keyboard.press('7'); await p.waitForTimeout(150);
  const e1=await p.evaluate(()=>({m:document.getElementById('lk-msg').textContent,c:document.getElementById('lk-dots').className,f:JSON.parse(localStorage.getItem('ieci-pin')).f}));
  ok(/PIN errato/.test(e1.m)&&/bad/.test(e1.c)&&e1.f===1,'PIN sbagliato: spie rosse, «PIN errato · restano 4 tentativi»');
  await p.waitForTimeout(500); await p.keyboard.type('482915'); await p.waitForFunction(()=>document.getElementById('lock').hidden,null,{timeout:8000}).catch(()=>{});
  ok(await p.evaluate(()=>document.getElementById('lock').hidden),'poi il PIN giusto sblocca');
  // logo e colore ricordati: alla prossima apertura il logo c'è già prima che l'app sia pronta
  await p.waitForTimeout(1500); const look=await p.evaluate(()=>JSON.parse(localStorage.getItem('ieci-lk-look')||'null'));
  ok(look&&/^data:image\/png/.test(look.logo)&&/^#/.test(look.col),'logo piccolo e colore salvati per la schermata del PIN');
  await p.evaluate(()=>sessionStorage.clear()); await p.goto(URL,{waitUntil:'commit'});
  await p.waitForFunction(()=>{ const l=document.getElementById('lock'); return l&&!l.hidden; },null,{polling:10,timeout:10000});
  const lg=await p.evaluate(()=>({img:!!document.querySelector('#lk-logo img'),app:!!(window.IECI_T&&window.IECI_T.S)}));
  ok(lg.img,'riapertura: logo sulla schermata del PIN da subito'+(lg.app?'':' (app non ancora pronta)'));
  await p.screenshot({path:path.join(A.TMP,'pin-quadro.png')});
  await ctx.close(); }

// 3. impronta con sensore simulato: si attiva dalle impostazioni, poi sblocca da sola all'apertura
{ const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage(); p.on('pageerror',e=>E.push(e.message)); p.on('dialog',d=>d.accept());
  const cdp=await ctx.newCDPSession(p); await cdp.send('WebAuthn.enable'); const {authenticatorId}=await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true}});
  await ctx.addInitScript(p=>{ if(!sessionStorage.getItem('__x')){ localStorage.setItem('ieci-pin',p); sessionStorage.setItem('__x','1'); sessionStorage.setItem('ieci-pin-ok',String(Date.now())); } },JSON.stringify(pinCon('482915',150000)));
  await p.goto(URL); await p.waitForTimeout(1500); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.pin,null,{timeout:15000});
  await A.mostra(p,'#pn-bio'); await p.waitForTimeout(300);
  ok(await p.evaluate(()=>!document.getElementById('pn-bio').hidden&&!document.getElementById('pn-bio-on').hidden),'impostazioni: «Attiva l\'impronta» (il telefono ha il sensore)');
  await p.click('#pn-bio-on'); await p.waitForTimeout(300); await p.keyboard.type('482915');
  await p.waitForFunction(()=>{ const x=JSON.parse(localStorage.getItem('ieci-pin')); return x&&x.bio; },null,{timeout:10000}).catch(()=>{});
  const pin=await p.evaluate(()=>JSON.parse(localStorage.getItem('ieci-pin')));
  ok(pin.bio&&pin.bio.id&&pin.bio.pk&&pin.h===pinCon('482915',150000).h,'impronta attivata dopo la conferma del PIN (sul dispositivo resta solo la chiave pubblica)');
  // riapertura: sblocca con l'impronta, da sola, senza toccare il tastierino
  await p.evaluate(()=>sessionStorage.removeItem('ieci-pin-ok')); await p.reload();
  await p.waitForFunction(()=>document.getElementById('lock').hidden&&!document.documentElement.classList.contains('locked'),null,{timeout:10000}).catch(()=>{});
  ok(await p.evaluate(()=>document.getElementById('lock').hidden),'riapertura: sbloccata con l\'impronta, senza scrivere il PIN');
  // chiave manomessa: la firma non torna e l'impronta non apre
  await p.evaluate(()=>{ const x=JSON.parse(localStorage.getItem('ieci-pin')); const k=crypto.getRandomValues(new Uint8Array(8)); x.bio.pk=x.bio.pk.slice(0,40)+btoa(String.fromCharCode(...k)).slice(0,8)+x.bio.pk.slice(48); localStorage.setItem('ieci-pin',JSON.stringify(x)); sessionStorage.removeItem('ieci-pin-ok'); });
  await p.reload(); await p.waitForTimeout(2500);
  ok(await p.evaluate(()=>!document.getElementById('lock').hidden),'chiave manomessa: l\'impronta non apre, serve il PIN');
  await p.keyboard.type('482915'); await p.waitForFunction(()=>document.getElementById('lock').hidden,null,{timeout:8000}).catch(()=>{});
  ok(await p.evaluate(()=>document.getElementById('lock').hidden),'il PIN funziona sempre');
  await cdp.send('WebAuthn.removeVirtualAuthenticator',{authenticatorId});
  await ctx.close(); }

// 4. telefono basso (640 px): il tastierino entra tutto nello schermo
{ const ctx=await b.newContext({viewport:{width:360,height:640},isMobile:true,hasTouch:true}); await ctx.addInitScript(p=>{ localStorage.setItem('ieci-pin',p); sessionStorage.clear(); },JSON.stringify(pinCon('482915',150000)));
  const p=await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(800);
  const r=await p.evaluate(()=>{ const a=[...document.querySelectorAll('#lk-pad button:not(.lk-ph), #lk-forgot')].map(b=>b.getBoundingClientRect()); return a.every(x=>x.top>=0&&x.bottom<=innerHeight&&x.left>=0&&x.right<=innerWidth); });
  ok(r,'schermo basso (360×640): tutti i tasti e «PIN dimenticato?» visibili'); await ctx.close(); }
srv.close();
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(E));await b.close()})();
