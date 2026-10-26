const {chromium}=require('./_amb.cjs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [n,w,h] of [['m',390,800],['d',1200,800]]){
const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();
await p.goto(require('./_amb.cjs').SRC);await p.waitForTimeout(1200);
await p.evaluate(()=>{localStorage.setItem('ieci-pin',JSON.stringify({h:'x',s:'s',m:'p',i:1000,rh:'y',rs:'r',auto:5,f:0,u:0,r:0}));sessionStorage.clear()});
await p.reload();await p.waitForTimeout(1200);await p.keyboard.press('4');await p.keyboard.press('8');await p.keyboard.press('2');
await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,`lock_${n}.png`)});
await p.evaluate(()=>{localStorage.removeItem('ieci-pin');sessionStorage.setItem('ieci-pin-ok',''+Date.now())});await p.close();}
const p=await (await b.newContext({viewport:{width:390,height:800}})).newPage();
await p.goto(require('./_amb.cjs').SRC);await p.waitForTimeout(1200);
await p.evaluate(()=>{localStorage.setItem('ieci-pin',JSON.stringify({h:'x',s:'s',m:'p',i:1000,rh:'y',rs:'r',auto:5,f:0,u:0,r:0}));sessionStorage.setItem('ieci-pin-ok',''+Date.now())});
await p.reload();await p.waitForTimeout(1200);await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'lock_hdr.png'),clip:{x:0,y:0,width:390,height:200}});
await b.close()})();
