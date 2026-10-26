const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(require('./_amb.cjs').SRC);await p.waitForTimeout(1500);
// stato vecchio senza 'rip' nel listino
await p.evaluate(()=>{});
ok((await p.$$eval('#tabs .tab',e=>e.map(x=>x.textContent))).includes('Riparazione'),'scheda Riparazione tra i tipi');
ok((await p.$$eval('#m-type option',e=>e.map(x=>x.textContent))).includes('Riparazione elettrica'),'presente nel selettore del tipo');
await p.click('[data-m="rip"]');await p.waitForTimeout(500);
ok((await p.textContent('#cat-name')).includes('Riparazione elettrica'),'listino del tipo');
const g=await p.$$eval('#cat .cgh',e=>e.map(x=>x.textContent));console.log(g.join(' | '));ok(g.length===6,'6 categorie nel listino');
await p.evaluate(()=>document.getElementById('clear-lines').click());
await p.evaluate(()=>{const r=[...document.querySelectorAll('#cat .crow')].find(x=>x.textContent.includes('Interruttore magnetotermico'));r.querySelector('[data-add]').click();});await p.waitForTimeout(300);
await p.evaluate(()=>{const r=[...document.querySelectorAll('#cat .crow')].find(x=>x.textContent.includes('Manodopera oraria'));r.querySelector('[data-add]').click();});await p.waitForTimeout(300);
const lines=await p.$$eval('#lines .line',els=>els.map(e=>e.querySelector('[data-f="d"]').value));console.log(lines.join(' | '));ok(lines.length===2,'righe aggiunte');
const prods=await p.$$eval('#plist .pn',e=>e.map(x=>x.textContent));console.log(prods.join(' | '));
ok(prods.some(x=>x.includes('magnetotermico'))&&!prods.some(x=>/Manodopera/.test(x)),'scheda prodotto solo per il componente');
const cov=await p.evaluate(()=>{const c=document.querySelector('#doc .page.cover');return {svg:!!c.querySelector('svg.circuit'),kick:c.querySelector('.kicker')&&c.querySelector('.kicker').textContent,n:c.querySelector('svg.circuit').innerHTML.length}});
console.log(JSON.stringify(cov));ok(cov.svg&&/RIPARAZIONE ELETTRICA/i.test(cov.kick)&&cov.n>800,'copertina con illustrazione e tipo');
const notes=await p.inputValue('#m-notes');ok(notes.includes('impianto esistente'),'note del tipo caricate');
await p.click('[data-m="dom"]');await p.waitForTimeout(300);await p.click('[data-m="rip"]');await p.waitForTimeout(300);
// pannello Collaudo/cronoprogramma per il tipo
const coll=await p.evaluate(()=>{document.getElementById('co-def')&&document.getElementById('co-def').click();return document.querySelector('[data-b="docs.collaudo.list"]')?document.querySelector('[data-b="docs.collaudo.list"]').value:'n/d'});console.log(coll.slice(0,60));
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
