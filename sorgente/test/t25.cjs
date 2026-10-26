const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const pg=await (await b.newContext({viewport:{width:412,height:860}})).newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:8150/preventivi-elettrici.html'); await pg.waitForTimeout(2000);
const go=async x=>{await require('./_amb.cjs').mostra(pg,'#mn-btn'); await pg.click('#mn-btn'); await pg.click('.mit[data-p='+x+']'); await pg.waitForTimeout(200);};
const T=async(n,f)=>console.log(n,JSON.stringify(await pg.evaluate(f)));
await go('dati'); await require('./_amb.cjs').mostra(pg,'#k-name'); await pg.fill('#k-name','Rossi Luca'); await pg.waitForTimeout(2300);
await T('autosave',()=>document.getElementById('qb-sub').textContent+' | '+document.getElementById('qb-name').textContent);
for(let i=0;i<6;i++){ await require('./_amb.cjs').mostra(pg,'#qb-new'); await pg.click('#qb-new'); await pg.waitForTimeout(300); await go('dati'); await require('./_amb.cjs').mostra(pg,'#k-name'); await pg.fill('#k-name','Cliente '+i); await require('./_amb.cjs').mostra(pg,'#qb-save'); await pg.click('#qb-save'); await pg.waitForTimeout(200); }
await require('./_amb.cjs').mostra(pg,'#qb-list'); await pg.click('#qb-list'); await pg.waitForTimeout(500);
await T('list',()=>({n:document.querySelectorAll('#q-list .rowc').length,more:document.getElementById('q-more').hidden,badge:document.getElementById('acc-save-n').textContent,qbn:document.getElementById('qb-n').textContent}));
await require('./_amb.cjs').mostra(pg,'#q-more'); await pg.click('#q-more'); await T('all',()=>document.querySelectorAll('#q-list .rowc').length);
await require('./_amb.cjs').mostra(pg,'#q-search'); await pg.fill('#q-search','Rossi'); await T('search',()=>document.querySelectorAll('#q-list .rowc').length);
// apri un preventivo dalla lista
await require('./_amb.cjs').mostra(pg,'#q-list [data-qo]'); await pg.click('#q-list [data-qo]'); await pg.waitForTimeout(300); await T('open',()=>document.getElementById('qb-name').textContent);
// archivio
await go('archivio'); await require('./_amb.cjs').mostra(pg,'#acc-sync>summary'); await pg.click('#acc-sync>summary'); await T('gh visible',()=>!!document.getElementById('gh-repo').offsetParent);
await require('./_amb.cjs').mostra(pg,'#go-prev'); await pg.click('#go-prev'); await pg.waitForTimeout(500); await T('go-prev',()=>document.querySelector('[data-panel=prev]').hidden);
// totale libero e nuovo
await go('prev'); await T('totale',()=>document.getElementById('qb-tot').textContent);
console.log(errs); await b.close();})();
