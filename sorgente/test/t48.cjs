const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:390,height:800}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const url=require('./_amb.cjs').SRC;
await p.goto(url);await p.waitForTimeout(1200);
const typ=async d=>{for(const c of d){await p.keyboard.press(c);}await p.waitForTimeout(700)};
const lockVis=()=>p.evaluate(()=>!document.getElementById('lock').hidden);
ok(!(await lockVis()),'senza PIN: nessun blocco');
await p.evaluate(()=>{showPanel&&0}).catch(()=>{});
await p.evaluate(()=>document.getElementById('pn-set').click());await p.waitForTimeout(300);
ok(await lockVis(),'imposta: appare tastierino');
await typ('123456');ok((await p.textContent('#lk-msg')).includes('semplice'),'PIN banale rifiutato');
await p.waitForTimeout(300);await typ('482915');await typ('482916');await p.waitForTimeout(1300);
ok((await p.textContent('#lk-msg')).includes('coincid')||(await p.textContent('#lk-title')).includes('Scegli'),'conferma diversa rifiutata');
await typ('482915');await typ('482915');await p.waitForTimeout(2500);
const rec=(await p.textContent('#lk-code')).trim();ok(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(rec),'codice recupero '+rec);
const raw=await p.evaluate(()=>localStorage.getItem('ieci-pin'));
ok(raw&&!raw.includes('482915')&&!raw.includes(rec),'PIN e codice non salvati in chiaro');
await p.click('#lk-done');await p.waitForTimeout(300);ok(!(await lockVis()),'attivato, sbloccato');
await p.evaluate(()=>document.getElementById('pn-lock').click());await p.waitForTimeout(300);
ok(await lockVis(),'blocca ora');
await typ('111111');ok((await p.textContent('#lk-msg')).includes('errato'),'PIN errato');
await p.waitForTimeout(700);await typ('482915');await p.waitForTimeout(800);ok(!(await lockVis()),'PIN giusto sblocca');
// reload within 2 min: stays open (session)
await p.reload();await p.waitForTimeout(1200);
// new context-like: clear session
await p.evaluate(()=>sessionStorage.clear());await p.reload();await p.waitForTimeout(1200);
ok(await lockVis(),'riapertura: blocco attivo');
const vis=await p.evaluate(()=>getComputedStyle(document.querySelector('.wrap')).visibility+'|'+document.querySelector('.wrap').hasAttribute('inert'));console.log(vis);
// lockout
for(let i=0;i<5;i++){await typ('000001');await p.waitForTimeout(600);}
ok((await p.textContent('#lk-msg')).includes('Troppi'),'blocco temporaneo dopo 5 errori');
// recovery
await p.evaluate(()=>{const d=JSON.parse(localStorage.getItem('ieci-pin'));d.u=0;localStorage.setItem('ieci-pin',JSON.stringify(d));});await p.reload();await p.waitForTimeout(1200);
await p.click('#lk-forgot');await p.fill('#lk-recin','AAAA-AAAA-AAAA');await p.click('#lk-recok');await p.waitForTimeout(800);
ok((await p.textContent('#lk-msg')).includes('non valido'),'codice recupero errato');
await p.fill('#lk-recin',rec);await p.click('#lk-recok');await p.waitForTimeout(1200);
ok(!(await lockVis())&&!(await p.evaluate(()=>localStorage.getItem('ieci-pin'))),'recupero toglie il blocco');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
