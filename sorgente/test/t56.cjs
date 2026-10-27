const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(require('./_amb.cjs').SRC);await p.waitForTimeout(1500);
ok((await p.$$eval('#tabs .tab',e=>e.map(x=>x.textContent))).includes('Wallbox'),'scheda Wallbox');
ok((await p.$$eval('#m-type option',e=>e.map(x=>x.textContent))).some(x=>/Wallbox/.test(x)),'nel selettore tipo');
await p.click('[data-m="wb"]');await p.waitForTimeout(500);
const g=await p.$$eval('#cat .cgh',e=>e.map(x=>x.textContent));console.log(g.join(' | '));ok(g.length===5,'5 categorie');
ok((await p.inputValue('#m-title')).includes('wallbox'),'titolo aggiornato al tipo');
await p.evaluate(()=>document.getElementById('clear-lines').click());
for(const n of ['Wallbox trifase 11 kW','Differenziale tipo B','Posa e fissaggio','Manodopera oraria','Sopralluogo e progetto']){
 await p.evaluate(n=>{const r=[...document.querySelectorAll('#cat .crow')].find(x=>x.textContent.includes(n));r.querySelector('[data-add]').click();},n);await p.waitForTimeout(200);}
ok((await p.$$('#lines .line')).length===5,'5 righe aggiunte');
await p.evaluate(()=>window.IECI_T.prodotti());const prods=await p.$$eval('#plist .pn',e=>e.map(x=>x.textContent));console.log(prods.join(' | '));
ok(prods.some(x=>/Wallbox/.test(x))&&prods.some(x=>/Differenziale/.test(x))&&!prods.some(x=>/Posa|Manodopera|Sopralluogo/.test(x)),'schede prodotto solo per i componenti');
const cov=await p.evaluate(()=>{const c=document.querySelector('#doc .page.cover');return {kick:c.querySelector('.kicker').textContent,n:c.querySelector('svg.circuit').innerHTML.length}});
ok(/WALLBOX/i.test(cov.kick)&&cov.n>800,'copertina con illustrazione');
ok((await p.inputValue('#m-notes')).includes('CEI 64-8'),'note del tipo');
const coll=await p.evaluate(()=>JSON.stringify(window.IECI_T.S().docs.collaudo).slice(0,80));console.log(coll);
await p.click('[data-m="dom"]');await p.waitForTimeout(300);
ok((await p.inputValue('#m-title')).includes('Rifacimento'),'tornando a dom il titolo torna generico');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
