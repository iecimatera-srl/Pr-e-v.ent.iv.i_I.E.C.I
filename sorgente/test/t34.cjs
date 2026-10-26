const {chromium}=require('./_amb.cjs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1280,height:900}});
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(2000);
await p.click('#mn-btn');await p.click('.mit[data-p="salva"]');await p.waitForTimeout(300);
const el=await p.$('#salva');await el.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'m3.png')});await b.close();})();
