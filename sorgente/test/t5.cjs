const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({acceptDownloads:true}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(require('./_amb.cjs').SA); await pg.waitForTimeout(600);
await pg.click('#mn-btn');await pg.click('.mit[data-p=dati]'); await require('./_amb.cjs').mostra(pg,'#k-name'); await pg.fill('#k-name','Rossi Mario'); await require('./_amb.cjs').mostra(pg,'#k-addr'); await pg.fill('#k-addr','Via Roma 1, Matera');
await require('./_amb.cjs').mostra(pg,'[data-b="client.tel"]'); await pg.fill('[data-b="client.tel"]','333 1234567'); await require('./_amb.cjs').mostra(pg,'#m-title'); await pg.fill('#m-title','Impianto casa Rossi');
await pg.click('#mn-btn');await pg.click('.mit[data-p=archivio]'); await require('./_amb.cjs').mostra(pg,'#q-save'); await pg.click('#q-save'); await pg.waitForTimeout(500);
console.log('q',await pg.$eval('#q-list',e=>e.innerText.replace(/\s+/g,' ')));
console.log('c',await pg.$eval('#c-list',e=>e.innerText.replace(/\s+/g,' ')));
console.log('l',await pg.$eval('#l-list',e=>e.innerText.replace(/\s+/g,' ')));
await require('./_amb.cjs').mostra(pg,'#q-new'); await pg.click('#q-new'); await pg.waitForTimeout(400);
console.log('new num',await pg.inputValue('#m-num'),'client:',JSON.stringify(await pg.inputValue('#k-name')));
// reuse client via datalist-change
await require('./_amb.cjs').mostra(pg,'#k-name'); await pg.fill('#k-name','Rossi Mario'); await pg.dispatchEvent('#k-name','change');
console.log('filled',await pg.inputValue('#k-addr'));
await pg.click('#mn-btn');await pg.click('.mit[data-p=archivio]');
console.log('q2',await pg.$eval('#q-list',e=>e.innerText.replace(/\s+/g,' ')));
await require('./_amb.cjs').mostra(pg,'[data-qc]'); await pg.click('[data-qc]'); await pg.waitForTimeout(500);
console.log('dup num/title',await pg.inputValue('#m-num'),await pg.inputValue('#m-title'));
await pg.click('#mn-btn');await pg.click('.mit[data-p=archivio]');
// library add product
await pg.click('#mn-btn');await pg.click('.mit[data-p=prodotti]'); const n0=await pg.$$eval('#plist details',x=>x.length);
await pg.selectOption('#lib-pick',{index:1}); await pg.waitForTimeout(200);
console.log('products',n0,'->',await pg.$$eval('#plist details',x=>x.length));
// reload persistence
await pg.waitForTimeout(2200); await pg.reload(); await pg.waitForTimeout(900);
await pg.click('#mn-btn');await pg.click('.mit[data-p=archivio]');
console.log('after reload q',await pg.$$eval('#q-list .rowc',x=>x.length),'c',await pg.$$eval('#c-list .rowc',x=>x.length),'l',await pg.$$eval('#l-list .rowc',x=>x.length));
// delete twice
await require('./_amb.cjs').mostra(pg,'[data-qx]'); await pg.click('[data-qx]'); await require('./_amb.cjs').mostra(pg,'[data-qx]'); await pg.click('[data-qx]'); await pg.waitForTimeout(200);
console.log('after del',await pg.$$eval('#q-list .rowc',x=>x.length));
// export
await require('./_amb.cjs').mostra(pg,'#db-exp'); const [d]=await Promise.all([pg.waitForEvent('download'),pg.click('#db-exp')]);
console.log('export ok'); console.log(errs); await b.close();})();
