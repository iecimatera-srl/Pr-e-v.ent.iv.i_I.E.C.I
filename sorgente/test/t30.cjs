const {chromium}=require('./_amb.cjs');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1200,height:900}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(1500);
const names=['red','white','green','ring'];const res=[];
for(const n of names){const u='data:image/jpeg;base64,'+fs.readFileSync(require('./_amb.cjs').DATI+'/'+n+'.jpg').toString('base64');
 const r=await p.evaluate(u=>new Promise(res=>IECI_T.cutout(u,(o,ok)=>res([o.length,ok,o.slice(0,20)]))),u);console.log(n,r);
 const out=await p.evaluate(u=>new Promise(res=>IECI_T.cutout(u,(o,ok)=>res(o))),u);fs.writeFileSync(require('./_amb.cjs').DATI+'/out_'+n+'.txt',out);}
await b.close();})();
