const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const ctx=await b.newContext(); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{ if(m.type()==='error'||m.type()==='warning') errs.push(m.type()+':'+m.text().slice(0,200)); });
await pg.goto('http://localhost:8124/index.html'); await pg.waitForTimeout(3000);
const c=await ctx.newCDPSession(pg);
const r=await c.send('Page.getInstallabilityErrors'); console.log('installability:',JSON.stringify(r));
const mf=await c.send('Page.getAppManifest'); console.log('manifest errors:',JSON.stringify(mf.errors),'url',mf.url); console.log(mf.data.slice(0,600));
console.log('sw:',await pg.evaluate(async()=>{ const r=await navigator.serviceWorker.getRegistration(); return r?[!!r.active,!!r.installing,!!r.waiting]:null; }));
console.log(errs); await b.close();})();
