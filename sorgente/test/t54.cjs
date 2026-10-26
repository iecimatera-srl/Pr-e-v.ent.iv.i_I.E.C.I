const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SRC);await p.waitForTimeout(1500);
const cnt=()=>p.evaluate(()=>window.IECI_T.S().trust.bgroups.reduce((a,g)=>a+g.items.length,0));
// preventivo B salvato PRIMA dei loghi
await p.evaluate(()=>{window.IECI_T.S().client.name='Cliente B';window.IECI_T.touch();});await p.click('#qb-save');await p.waitForTimeout(600);
await p.click('#qb-new');await p.waitForTimeout(600);
// aggiungo i loghi, poi preventivo A
await p.evaluate((png)=>{const S=window.IECI_T.S();S.trust.bgroups=[{id:'g1',t:'Sicurezza',items:[{name:'Axis',img:png},{name:'Hanwha',img:png}]},{id:'g2',t:'Civile',items:[{name:'Bticino',img:png},{name:'Vimar',img:png},{name:'Ave',img:png}]}];window.IECI_T.touch();},PNG);
await p.waitForTimeout(500);
ok((await cnt())===5,'loghi presenti nel nuovo preventivo');
await p.evaluate(()=>{window.IECI_T.S().client.name='Cliente A';window.IECI_T.touch();});await p.click('#qb-save');await p.waitForTimeout(600);
// apro il vecchio preventivo B (salvato prima dei loghi)
const ids=await p.evaluate(()=>[...document.querySelectorAll('#q-list [data-qo]')].map(b=>b.getAttribute('data-qo')+'|'+b.closest('.rowc,.qrow,div').textContent.slice(0,40)));console.log(ids.join(' ; '));
const bid=ids.find(x=>x.includes('Cliente B')).split('|')[0];await p.evaluate((i)=>{document.querySelector('#q-list [data-qo="'+i+'"]').click();},bid);
await p.waitForTimeout(800);
const nm=await p.evaluate(()=>window.IECI_T.S().client.name);ok(nm==='Cliente B','aperto il preventivo vecchio ('+nm+')');
ok((await cnt())===5,'aprendo un preventivo vecchio i loghi NON spariscono');
// autoguarigione: senza loghi, aprire il preventivo che li ha li riporta e restano per tutti
await p.evaluate(()=>{const S=window.IECI_T.S();S.trust.bgroups=[];window.IECI_T.touch();});await p.waitForTimeout(400);
const aid=ids.find(x=>x.includes('Cliente A')).split('|')[0];await p.evaluate((i)=>{document.querySelector('#q-list [data-qo="'+i+'"]').click();},aid);await p.waitForTimeout(800);
ok((await cnt())===5,'senza loghi: aprendo il preventivo che li ha, tornano');
await p.evaluate((i)=>{document.querySelector('#q-list [data-qo="'+i+'"]').click();},bid);await p.waitForTimeout(800);
ok((await cnt())===5,'e restano anche aprendo il preventivo vecchio');
// simulo la perdita e uso il recupero
await p.evaluate(()=>{const S=window.IECI_T.S();S.trust.bgroups=[];window.IECI_T.touch();});await p.waitForTimeout(500);
ok((await cnt())===0,'(simulata perdita)');
await p.evaluate(()=>document.getElementById('acc-auto').open=true);
await p.evaluate(()=>{const e=document.querySelector('#acc-auto');});
const lst=await p.evaluate(()=>{window.IECI_T.S();return document.getElementById('rc-list').innerText});console.log(lst.replace(/\n+/g,' | '));
ok(/5 loghi/.test(lst)&&/Cliente A/.test(lst),'elenco di recupero mostra il preventivo con 5 loghi');
await p.evaluate(()=>{document.querySelector('[data-rcb]').click();});await p.waitForTimeout(1200);
ok((await cnt())===5,'«Recupera i marchi» ripristina i 5 loghi');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
