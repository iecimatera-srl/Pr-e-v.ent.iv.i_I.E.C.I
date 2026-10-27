const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:900,height:1100}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SRC);await p.waitForTimeout(1500);
await p.click('[data-m="vcit"]');await p.waitForTimeout(400);
await p.evaluate(()=>document.getElementById('clear-lines').click());
await p.fill('#vc-n','10');
await p.click('[data-vck="both"]');await p.waitForTimeout(600);
await p.evaluate(()=>window.IECI_T.prodotti());await p.evaluate(()=>{const pe=[...document.querySelectorAll('#plist .pe')].find(x=>x.querySelector('[data-pf="name"]').value.startsWith('Monitor interno'));pe.open=true;const i=pe.querySelector('[data-pf="brand"]');i.value='Bticino';i.dispatchEvent(new Event('input',{bubbles:true}));const c=pe.querySelector('[data-pf="code"]');c.value='Classe 100X16E';c.dispatchEvent(new Event('input',{bubbles:true}));});
await p.waitForTimeout(500);
let d=await p.evaluate(()=>document.getElementById('doc').innerText);
ok(/Marca: Bticino/.test(d)&&/Classe 100X16E/.test(d),'marca e modello dal prodotto nel preventivo (a livelli)');
await p.click('[data-vcp="totale"]');await p.waitForTimeout(700);
const vals=await p.$$eval('#vc-tot input[data-b]',e=>e.map(x=>x.getAttribute('data-b')+'='+x.value));console.log(vals.join(' '));
ok(vals.length===2&&vals.every(v=>!/=$/.test(v)),'due totali precompilati');
await p.fill('#vc-tot [data-b="cond.tc"]','5000');await p.fill('#vc-tot [data-b="cond.tv"]','9000');await p.waitForTimeout(700);
const res=await p.textContent('#vc-res');console.log(res);
ok(res.includes('500,00')&&res.includes('900,00'),'quota a condomino da totali liberi: 500 e 900');
d=await p.evaluate(()=>document.getElementById('doc').innerText);
ok(/5\.000,00 €/.test(d)&&/9\.000,00 €/.test(d),'preventivo mostra i due totali');
ok(!/180,00 €/.test(d)&&!/55,00 €/.test(d),'nessun prezzo sulle voci');
ok(/Marca: Bticino/.test(d),'marca presente anche col totale libero');
ok(/500,00 €/.test(d)&&/900,00 €/.test(d),'quota nel documento');
const hd=await p.textContent('#qb-tot');console.log('qb',hd);ok(/5\.000,00/.test(hd),'barra: da (minimo) 5000');
await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'vc_free_ui.png')});
const pg=p.locator('#doc .page').filter({hasText:'Preventivo economico'}).first();await pg.scrollIntoViewIfNeeded();await pg.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'vc_free.png')});
// scelta cliente di un livello => totale accettato
await p.evaluate(()=>{const s=document.getElementById('t-sel');if(s){s.value='1';s.dispatchEvent(new Event('input',{bubbles:true}));}});await p.waitForTimeout(600);
const hd2=await p.textContent('#qb-tot');console.log('qb2',hd2);ok(/9\.000,00/.test(hd2),'livello scelto: totale 9000');
// singola soluzione + totale libero
await p.click('[data-vck="cit"]');await p.waitForTimeout(700);
await p.fill('#vc-tot [data-b="econ.total"]','4880');await p.waitForTimeout(600);
const r3=await p.textContent('#vc-res');console.log(r3);ok(r3.includes('488,00'),'singola: 4880/10 = 488,00');
d=await p.evaluate(()=>document.getElementById('doc').innerText);
ok(/4\.880,00 €/.test(d)&&!/Marca: Bticino/.test(d),'singola soluzione citofono: totale libero, niente monitor');
// righe: marca in tabella prezzi
await p.click('[data-vcp="righe"]');await p.waitForTimeout(600);
await p.click('[data-vck="video"]');await p.waitForTimeout(700);
d=await p.evaluate(()=>document.getElementById('doc').innerText);
ok(/Marca: Bticino/.test(d),'marca anche nella tabella con prezzi');
// opzione per nascondere
await p.evaluate(()=>{document.querySelector('[data-sk="pvBrand"]').click();});await p.waitForTimeout(500);
d=await p.evaluate(()=>document.getElementById('doc').innerText);
ok(!/Marca: Bticino/.test(d),'marca nascondibile dalle opzioni');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
