const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({acceptDownloads:true}); const pg=await ctx.newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(require('./_amb.cjs').SA); await pg.waitForTimeout(500);
await pg.click('#mn-btn');await pg.click('.mit[data-p=prodotti]');
await pg.locator('[data-ppdf="0"]').setInputFiles(require('path').join(require('./_amb.cjs').DATI,'q1.pdf')); await pg.waitForTimeout(400);
await pg.locator('#plist details.pe > summary').nth(1).click();
await pg.locator('[data-ppdf="1"]').setInputFiles(require('path').join(require('./_amb.cjs').DATI,'q2.pdf')); await pg.waitForTimeout(400);
await pg.click('#mn-btn');await pg.click('.mit[data-p=invio]');
console.log(await pg.$eval('#pdf-count',e=>e.textContent));
const [d]=await Promise.all([pg.waitForEvent('download'),pg.click('#pdf-only')]);
await d.saveAs(require('path').join(require('./_amb.cjs').TMP,'merged.pdf'));
console.log('prodotto doc shows note:',(await pg.$eval('#doc',e=>e.innerText)).includes('allegata in fondo'));
console.log(errs); await b.close();
})();
