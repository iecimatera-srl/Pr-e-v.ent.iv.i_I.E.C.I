const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SRC);await p.waitForTimeout(1500);
const S=(f,a)=>p.evaluate(f,a);
const typ=async(id,v)=>{await S(([id,v])=>{const t=document.getElementById(id);t.value=v;t.dispatchEvent(new Event('input',{bubbles:true}));},[id,v]);await p.waitForTimeout(200);};
const st=()=>S(()=>({n:document.getElementById('m-notes').value,p:document.getElementById('m-pay').value,s:document.querySelector('#cc-box .ccst').textContent}));
await p.click('[data-m="vcit"]');await p.waitForTimeout(300);
await typ('m-notes','Mie clausole videocitofono');await typ('m-pay','Pagamento 50% e saldo a fine lavori');
let x=await st();console.log(x.s);ok(/non ancora salvate/.test(x.s),'avvisa che non sono salvate');
await S(()=>document.querySelector('[data-cc="save"]').click());await p.waitForTimeout(300);
x=await st();console.log(x.s);ok(/In uso le tue condizioni/.test(x.s),'salvate e in uso');
await p.click('[data-m="dom"]');await p.waitForTimeout(300);
x=await st();ok(x.n.includes('CEI 64-8')&&/Acconto del 30%/.test(x.p),'altro tipo: condizioni sue (predefinite)');
await p.click('[data-m="vcit"]');await p.waitForTimeout(300);
x=await st();ok(x.n==='Mie clausole videocitofono'&&x.p==='Pagamento 50% e saldo a fine lavori','tornando al tipo: le mie condizioni');
// clausole modificate a mano nel preventivo non vengono sovrascritte
await typ('m-notes','Clausola speciale solo per questo cliente');
await p.click('[data-m="dom"]');await p.waitForTimeout(300);
x=await st();ok(x.n==='Clausola speciale solo per questo cliente','modifiche del singolo preventivo rispettate');
// condizioni anche per domestico, poi nuovo preventivo
await typ('m-notes','Mie clausole domestico');await S(()=>document.querySelector('[data-cc="save"]').click());await p.waitForTimeout(300);
await S(()=>document.getElementById('q-new').click());await p.waitForTimeout(600);
x=await st();ok(x.n==='Mie clausole domestico','nuovo preventivo: le mie condizioni del tipo');
await S(()=>document.querySelector('[data-m="vcit"]').click());await p.waitForTimeout(300);
x=await st();ok(x.n==='Mie clausole videocitofono','nuovo preventivo, passando a videocitofonia: le mie');
const pl=await S(()=>JSON.stringify(window.IECI_T.payload().ccond||{}));ok(/Mie clausole videocitofono/.test(pl)&&/Mie clausole domestico/.test(pl),'salvate nel backup e nella sincronizzazione');
ok(await S(()=>!window.IECI_T.isFactory()),'non più impostazioni di fabbrica');
// elimina
await S(()=>document.querySelector('[data-cc="del"]').click());await p.waitForTimeout(300);
ok(await S(()=>!window.IECI_T.S().ccond.vcit),'eliminate');
// riapertura dopo ricarica
await p.reload();await p.waitForTimeout(1500);
ok(await S(()=>!!window.IECI_T.S().ccond.dom),'restano dopo la riapertura dell\'app');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
