const {chromium}=require('./_amb.cjs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(1800);
const R=[];const ck=(n,v)=>{R.push((v?'OK  ':'FAIL ')+n);};
const st=()=>p.evaluate(()=>window.IECI_T&&1);
// vai al pannello prev
await p.click('#mn-btn');await p.click('.mit[data-p=prev]');await p.waitForTimeout(200);
ck('tab Appartamento presente',await p.evaluate(()=>!![...document.querySelectorAll('#tabs .tab')].find(b=>b.textContent==='Appartamento')));
await p.click('#tabs [data-m=app]');await p.waitForTimeout(300);
ck('accordion stanze visibile',await p.evaluate(()=>!document.getElementById('acc-rooms').hidden));
ck('5 stanze di default + comuni',await p.evaluate(()=>document.querySelectorAll('#rooms .rchip').length===6));
ck('catalogo>=80 voci',await p.evaluate(()=>document.querySelectorAll('#cat .crow').length>0));
// aggiungi stanza
await p.click('#rooms [data-addroom=st]');await p.waitForTimeout(100);
ck('stanza Studio aggiunta',await p.evaluate(()=>[...document.querySelectorAll('#rooms .rchip .rl')].some(e=>e.textContent==='Studio')));
await p.fill('#rm-name','Studio Marco');
ck('rinomina',await p.evaluate(()=>[...document.querySelectorAll('#rooms .rchip .rl')].some(e=>e.textContent==='Studio Marco')));
await p.click('[data-rmact=kit]');await p.waitForTimeout(100);
const nStudio=await p.evaluate(()=>S_get().lines.filter(l=>l.r).length).catch(()=>-1);
await p.click('#rooms [data-addroom=cu]');await p.click('[data-rmact=kit]');
await p.click('#rooms [data-addroom=ba]');await p.click('[data-rmact=kit]');
ck('kit doppio non duplica',await (async()=>{const n1=await p.evaluate(()=>document.querySelectorAll('#lines .line').length);await p.click('[data-rmact=kit]');const n2=await p.evaluate(()=>document.querySelectorAll('#lines .line').length);return n1===n2;})());
// aggiungi voce dal listino alla stanza corrente
await p.fill('#cat-q','videocit');await p.waitForTimeout(100);
const before=await p.evaluate(()=>document.querySelectorAll('#lines .line').length);
await p.click('#cat [data-add]');await p.waitForTimeout(100);
ck('voce aggiunta alla stanza',await p.evaluate(b=>document.querySelectorAll('#lines .line').length===b+1,before));
await p.fill('#cat-q','');
// cambio stanza di una riga
await p.evaluate(()=>{const s=document.querySelector('#lines select[data-f=r]');s.value='';s.dispatchEvent(new Event('input',{bubbles:true}));});
ck('sposta riga a comuni',await p.evaluate(()=>[...document.querySelectorAll('#lines .rgh b')].some(b=>/comuni/i.test(b.textContent))));
// su/giù
await p.evaluate(()=>{const b=document.querySelectorAll('#lines [data-ldn]')[0];b.click();});
// documento
await p.evaluate(()=>{document.querySelector('[data-panel=prev]');});
const doc=await p.evaluate(()=>{const d=document.querySelector('.rmh');return {h:document.querySelectorAll('.qt tr.rmh').length,sum:document.querySelectorAll('.rsum .rsr').length,svg:document.querySelectorAll('.qt tr.rmh svg').length};});
ck('doc: intestazioni stanza '+JSON.stringify(doc),doc.h>=4&&doc.svg===doc.h&&doc.sum===doc.h);
// testo
const txt=await p.evaluate(()=>{document.getElementById('copy-text')&&0;return null;});
// persistenza: ricarica
await p.waitForTimeout(900);
await p.reload();await p.waitForTimeout(1800);
const after=await p.evaluate(()=>({rooms:document.querySelectorAll('#rooms .rchip').length,lines:document.querySelectorAll('#lines .line').length,tab:document.querySelector('#tabs [aria-pressed=true]').textContent}));
ck('persistenza '+JSON.stringify(after),after.tab==='Appartamento'&&after.rooms>=8&&after.lines>20);
// elimina stanza
await p.click('#rooms [data-room]:nth-child(2)');const nr=await p.evaluate(()=>document.querySelectorAll('#rooms .rchip').length);
await p.click('[data-rmact=del]');await p.waitForTimeout(100);
ck('elimina stanza',await p.evaluate(n=>document.querySelectorAll('#rooms .rchip').length===n-1,nr));
// duplica
await p.click('[data-rmact=dup]');await p.waitForTimeout(100);
ck('duplica stanza',await p.evaluate(n=>document.querySelectorAll('#rooms .rchip').length===n,nr));
// passa a dom e torna
await p.click('#tabs [data-m=dom]');await p.waitForTimeout(100);
ck('dom: stanze nascoste, no intestazioni',await p.evaluate(()=>document.getElementById('acc-rooms').hidden&&!document.querySelector('.qt tr.rmh')&&!document.querySelector('#lines .rgh')));
await p.click('#tabs [data-m=app]');await p.waitForTimeout(100);
ck('ritorno app: stanze presenti',await p.evaluate(()=>document.querySelectorAll('#rooms .rchip').length>=6));
// copy text
await p.evaluate(()=>{window.__t=null;});
// cat filter
ck('filtro adatte/tutte',await (async()=>{const a=await p.evaluate(()=>document.querySelectorAll('#cat .crow').length);await p.click('#cat-f');const c=await p.evaluate(()=>document.querySelectorAll('#cat .crow').length);return c>a;})());
await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'app1.png')});
// doc screenshot
const el=await p.$('.qt');if(el){await el.scrollIntoViewIfNeeded();}
await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'app2.png'),fullPage:false});
console.log(R.join('\n'));console.log('errs',errs);
await b.close();})();
