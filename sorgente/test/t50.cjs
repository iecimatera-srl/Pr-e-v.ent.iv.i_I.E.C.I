const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SRC);await p.waitForTimeout(1500);
ok(await p.evaluate(()=>document.getElementById('acc-vc').hidden),'nascosto negli altri tipi');
await p.click('[data-m="vcit"]');await p.waitForTimeout(500);
ok(!(await p.evaluate(()=>document.getElementById('acc-vc').hidden)),'visibile su videocitofoni');
await p.evaluate(()=>document.getElementById('clear-lines').click());
await p.fill('#vc-n','8');await p.waitForTimeout(200);
await p.click('#vc-fill');await p.waitForTimeout(600);
let L=await p.evaluate(()=>window.IECI_T&&0||null);
const rows=await p.$$eval('#lines .line',els=>els.map(e=>e.querySelector('[data-f="d"]').value+'|'+e.querySelector('[data-f="q"]').value));
console.log(rows.join('\n'));
ok(rows.length===6&&rows[0].endsWith('|8')&&rows[1].endsWith('|8')&&rows[2].endsWith('|1'),'voci tipiche: per condomino x8, comuni x1');
let res=await p.textContent('#vc-res');console.log(res);
// calcolo: (180+35)*8 + 220+45+40+150 = 1720+455=2175 ; iva 22% => 2653.5 ; /8
ok(res.includes('2.653,50')&&res.includes('331,69'),'totale e quota (331,69)');
await p.click('#vc-p');await p.waitForTimeout(300);
ok((await p.inputValue('#vc-n'))==='9'&&(await p.$eval('#lines .line [data-f="q"]',e=>e.value))==='9','+ aggiorna le quantita a 9');
await p.click('#vc-m');await p.waitForTimeout(300);
// kind -> citofono
await p.click('[data-vck="cit"]');await p.waitForTimeout(600);
const rows2=await p.$$eval('#lines .line',els=>els.map(e=>e.querySelector('[data-f="d"]').value));
ok(rows2[0].includes('citofono con cornetta')&&rows2.some(x=>x.includes('esterna citofonica')),'passa a solo citofono: voci sostituite');
const catTxt=await p.textContent('#cat');ok(!catTxt.includes('Monitor interno a colori')&&catTxt.includes('Posto interno citofono'),'listino filtrato per citofono');
await p.click('#cat-f');await p.waitForTimeout(200);ok((await p.textContent('#cat')).includes('Monitor interno a colori'),'mostra tutte');
// aggiunta da listino di voce per condomino
await p.click('#cat-f');
await p.evaluate(()=>{const i=[...document.querySelectorAll('#cat .crow')].find(r=>r.textContent.includes('Suoneria supplementare'));i.querySelector('[data-add]').click();});await p.waitForTimeout(300);
const last=await p.$$eval('#lines .line',els=>{const e=els[els.length-1];return e.querySelector('[data-f="d"]').value+'|'+e.querySelector('[data-f="q"]').value});
ok(last==='Suoneria supplementare|8','voce da listino prende N=8');
// documento
await p.waitForTimeout(500);
const doc=await p.evaluate(()=>{const d=document.getElementById('doc');return d?d.innerText:''});
ok(/Ripartizione della spesa/i.test(doc)&&/a condomino|Quota a condomino/.test(doc)&&/8 condomini/.test(doc),'quota scritta nel preventivo');
await p.uncheck('#vc-show');await p.waitForTimeout(500);
ok(!(await p.evaluate(()=>document.getElementById('doc').innerText)).toLowerCase().includes("ripartizione della spesa"),'quota nascondibile');
await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'vc_m.png'),fullPage:false});
// altro tipo: nessuna quota
await p.check('#vc-show');await p.click('[data-m="dom"]');await p.waitForTimeout(500);
ok(!(await p.evaluate(()=>document.getElementById('doc').innerText)).toLowerCase().includes("ripartizione della spesa"),'altri tipi: nessuna quota');

// ---- entrambe le soluzioni
await p.click('[data-m="vcit"]');await p.waitForTimeout(300);
await p.click('[data-vck="both"]');await p.waitForTimeout(700);
const st=await p.evaluate(()=>{const r=[...document.querySelectorAll('#lines .line')].map(e=>e.querySelector('[data-f="d"]').value);return r});
ok(st.length>=8,'entrambe: voci di tutte e due le soluzioni ('+st.length+')');
const res2=await p.textContent('#vc-res');console.log(res2);
ok(res2.includes('Solo citofono')&&res2.includes('Videocitofono')&&res2.includes('consigliata'),'riepilogo a due livelli');
await p.waitForTimeout(400);
const d2=await p.evaluate(()=>document.getElementById('doc').innerText);
ok(/solo citofono/i.test(d2)&&/videocitofono/i.test(d2)&&/Ripartizione della spesa/i.test(d2),'preventivo: confronto e quote per soluzione');
ok(/Videocitofono/i.test(d2)&&/Solo citofono/i.test(d2)&&/Soluzione 1/i.test(d2)&&/Soluzione 2/i.test(d2),'schede prodotto: blocchi delle due soluzioni');
await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'vc_both.png')});
const pg=p.locator('#doc .page').filter({hasText:'Prodotti e soluzioni'}).first();await pg.scrollIntoViewIfNeeded();await pg.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'vc_prod.png')});
const pg2=p.locator('#doc .page').filter({hasText:'Preventivo economico'}).first();await pg2.scrollIntoViewIfNeeded();await pg2.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'vc_econ.png')});
// torna a una sola soluzione
await p.click('[data-vck="video"]');await p.waitForTimeout(700);
const back=await p.evaluate(()=>{return {tiers:document.querySelector('#acc-vc')&&true}});
const d3=await p.evaluate(()=>document.getElementById('doc').innerText);
ok(!/SOLUZIONE CITOFONO/i.test(d3)&&!/consigliata/i.test(d3),'ritorno a soluzione unica: niente confronto');
const l3=await p.$$eval('#lines .line',els=>els.map(e=>e.querySelector('[data-f="d"]').value));
ok(l3.length===7&&!l3.some(x=>/citofono con cornetta/.test(x)),'ritorno: solo voci videocitofono');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
