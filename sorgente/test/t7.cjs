const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const pg=await b.newPage({viewport:{width:1400,height:1100}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(require('./_amb.cjs').SRC); await pg.waitForTimeout(600);
await pg.click('#mn-btn');await pg.click('.mit[data-p=fiducia]'); await pg.check('[data-b="trust.qr.wa2"]'); await pg.check('[data-b="trust.qr.mail"]'); await pg.waitForTimeout(300);
console.log(await pg.$$eval('.cti',x=>x.map(a=>a.getAttribute('href'))));
const el=await pg.$('.ctl'); await el.scrollIntoViewIfNeeded(); await el.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'ctl.png')});
console.log(errs); await b.close();})();
