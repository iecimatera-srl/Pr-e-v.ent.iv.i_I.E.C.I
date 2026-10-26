const {chromium}=require('./_amb.cjs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:480,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(2000);
await p.click('#mn-btn');await p.waitForTimeout(200);await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'m1.png')});
await p.click('.mit[data-p="salva"]');await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelectorAll('#salva details.acc').forEach(d=>d.open=true));
await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'m2.png'),fullPage:true});
console.log(errs);await b.close();})();
