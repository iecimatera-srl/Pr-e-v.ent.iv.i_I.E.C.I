const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const ctx=await b.newContext({viewport:{width:430,height:900}}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:8126/index.html'); await pg.waitForTimeout(2500); await pg.reload(); await pg.waitForTimeout(1500);
const c=await ctx.newCDPSession(pg); console.log(JSON.stringify(await c.send('Page.getInstallabilityErrors')));
await require('./_amb.cjs').mostra(pg,'#mn-btn'); await pg.click('#mn-btn'); await pg.click('.mit[data-p=archivio]'); await require('./_amb.cjs').mostra(pg,'#in-diag'); await pg.click('#in-diag'); await pg.waitForTimeout(1500);
console.log(await pg.textContent('#in-out')); console.log(await pg.textContent('#in-state')); console.log(errs); await b.close();})();
