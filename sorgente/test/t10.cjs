const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const errs=[];
for(const [n,sch] of [['light','light'],['dark','dark']]){
 const pg=await b.newPage({viewport:{width:1300,height:760},colorScheme:sch}); pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(require('./_amb.cjs').SRC); await pg.waitForTimeout(900);
 await pg.click('#mn-btn');await pg.click('.mit[data-p=prev]'); await pg.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'ui_')+n+'.png'}); console.log(n,await pg.title());
}
const pm=await b.newPage({viewport:{width:390,height:700}}); await pm.goto(require('./_amb.cjs').SRC); await pm.waitForTimeout(900); await pm.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'ui_m.png')});
console.log(await pm.evaluate(()=>document.documentElement.scrollWidth),errs); await b.close();})();
