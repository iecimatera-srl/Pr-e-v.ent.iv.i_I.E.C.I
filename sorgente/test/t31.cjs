const {chromium}=require('./_amb.cjs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1100,height:900}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(2500);
const pages=await p.$$('#doc .page');console.log(pages.length, await p.$$eval('#doc .wm',e=>e.length));
await pages[3].screenshot({path:require('path').join(require('./_amb.cjs').TMP,'wm1.png')});
await b.close();})();
