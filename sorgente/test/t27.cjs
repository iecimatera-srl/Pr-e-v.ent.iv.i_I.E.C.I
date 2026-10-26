const {chromium}=require('./_amb.cjs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const cs of ['light','dark']){const p=await b.newPage({viewport:{width:1100,height:800},colorScheme:cs});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(2500);
await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'h_')+cs+'.png',clip:{x:0,y:0,width:1100,height:160}});
if(cs==='light'){const el=await p.$('#doc .page');await el.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'cover.png')});}
await p.close();}
await b.close();})();
