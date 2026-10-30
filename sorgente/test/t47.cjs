// Copia automatica nella cartella: la richiesta «Consenti» del browser non compare più al primo tocco
// (finiva sul tastierino del PIN). Barra discreta a app sbloccata e tranquilla, oppure quando premi «Salva».
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(A.SRC);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.mir,null,{timeout:20000});
const S=(f,a)=>p.evaluate(f,a);
const finta=()=>S(()=>{ const M=window.IECI_T.mir(); window.__perm='prompt'; window.__asked=0; window.__wrote=0;
  M.h={name:'Dati IECI',queryPermission:async()=>window.__perm,requestPermission:async()=>{ window.__asked++; window.__perm='granted'; return 'granted'; },getFileHandle:async()=>{ window.__wrote++; return {createWritable:async()=>({write:async()=>{},close:async()=>{}}),getFile:async()=>({lastModified:Date.now(),text:async()=>'{}'})}; }};
  M.need=true; window.IECI_T.renderMir(); });
const stato=()=>S(()=>({asked:window.__asked,wrote:window.__wrote,bar:!document.getElementById('mi-banner').hidden,need:window.IECI_T.mir().need,lock:!document.getElementById('lock').hidden}));

// 1. con il PIN sullo schermo: i tocchi sul tastierino non fanno comparire la richiesta, e nemmeno la barra
await S(()=>new Promise(r=>window.PINPAD.hash('482915','s4lt','p',150000,h=>{ localStorage.setItem('ieci-pin',JSON.stringify({h,s:'s4lt',m:'p',i:150000,rh:'x',rs:'y',auto:5,f:0,u:0,r:0,tuned:1})); r(); })));
await S(()=>window.PINPAD.lock()); await finta();
await p.click('#lk-pad [data-k="4"]'); await p.click('#lk-pad [data-k="8"]'); await p.waitForTimeout(5600);
let st=await stato(); ok(st.lock&&st.asked===0&&!st.bar,'PIN aperto: nessuna richiesta «Consenti» e nessuna barra');
for(const c of '2915') await p.click('#lk-pad [data-k="'+c+'"]');
await p.waitForFunction(()=>document.getElementById('lock').hidden,null,{timeout:8000});
// 2. subito dopo lo sblocco e al primo tocco: ancora niente richiesta
await p.mouse.click(200,300); await p.waitForTimeout(600);
st=await stato(); ok(!st.lock&&st.asked===0&&!st.bar,'appena sbloccata, il primo tocco non fa comparire la richiesta');
// 3. dopo qualche secondo: barra discreta con «Riattiva»
await p.waitForTimeout(5200); st=await stato();
ok(st.bar&&st.asked===0&&await S(()=>/Consenti a ogni visita/.test(document.getElementById('mi-bmsg').textContent)),'a app tranquilla compare la barra con «Riattiva» (spiega «Consenti a ogni visita»)');
await p.click('#mi-bok'); await p.waitForTimeout(800); st=await stato();
ok(st.asked===1&&!st.need&&!st.bar&&st.wrote>0,'«Riattiva»: permesso chiesto una volta, copia ripartita, barra chiusa');
// 4. «Dopo» chiude la barra; la richiesta arriva quando premi «Salva»
await finta(); await S(()=>{ const B=document.getElementById('mi-banner'); B.hidden=false; }); await p.click('#mi-bx'); await p.waitForTimeout(200);
st=await stato(); ok(!st.bar&&st.asked===0,'«Dopo»: barra chiusa, nessuna richiesta');
await p.click('#qb-save'); await p.waitForTimeout(800); st=await stato();
ok(st.asked===1&&!st.need,'premendo «Salva» il permesso viene chiesto (momento giusto)');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
