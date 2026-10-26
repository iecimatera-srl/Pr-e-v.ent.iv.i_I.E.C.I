const {chromium}=require('./_amb.cjs'); const fs=require('fs');
const store={};
async function mk(b){ const ctx=await b.newContext({viewport:{width:1100,height:1200}}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.exposeFunction('__rd',n=>store[n]==null?null:store[n]); await pg.exposeFunction('__wr',(n,t)=>{ store[n]=t; });
 await pg.addInitScript(()=>{ window.showDirectoryPicker=async()=>({name:'DatiIECI',queryPermission:async()=>'granted',requestPermission:async()=>'granted',
  getFileHandle:async(n,o)=>{ const cur=await window.__rd(n); if(cur==null&&!(o&&o.create)){ const e=new Error('nf'); e.name='NotFoundError'; throw e; }
   return {getFile:async()=>{ const t=(await window.__rd(n))||''; return {size:t.length,lastModified:Date.now(),text:async()=>t}; },
    createWritable:async()=>{ let buf=''; return {write:async s=>{buf=s;},close:async()=>{ await window.__wr(n,buf); }}; }}; }}); });
 return {ctx,pg,errs}; }
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
let {pg,errs}=await mk(b);
await pg.goto(require('./_amb.cjs').SA); await pg.waitForTimeout(900);
console.log('banner vuoto visibile:',await pg.$eval('#nw-banner',e=>!e.hidden));
await pg.click('#mn-btn');await pg.click('.mit[data-p=archivio]').catch(async()=>{ await pg.click('#mn-btn'); await pg.click('.mit[data-p=archivio]'); });
console.log('ver:',await pg.textContent('#up-ver'));
await require('./_amb.cjs').mostra(pg,'#mi-pick'); await pg.click('#mi-pick'); await pg.waitForTimeout(500);
// crea dati: cliente + salvataggio
await pg.evaluate(()=>{});
await pg.click('#mn-btn'); await pg.click('.mit[data-p=dati]');
await require('./_amb.cjs').mostra(pg,'[data-b="client.name"]'); await pg.fill('[data-b="client.name"]','Mario Rossi').catch(e=>console.log('fill client fail'));
await pg.click('#mn-btn'); await pg.click('.mit[data-p=archivio]');
await require('./_amb.cjs').mostra(pg,'#c-save'); await pg.click('#c-save'); await pg.waitForTimeout(5500);
console.log('mir state:',await pg.textContent('#mi-state'));
console.log('file scritto:',store['archivio-IECI.json']?store['archivio-IECI.json'].length:'NO', store['archivio-IECI.json']&&JSON.parse(store['archivio-IECI.json']).db.clients.map(c=>c.name));
console.log(errs);
// nuovo "dispositivo" vuoto
let c2=await mk(b); await c2.pg.goto(require('./_amb.cjs').SA); await c2.pg.waitForTimeout(900);
console.log('banner nuovo:',await c2.pg.$eval('#nw-banner',e=>!e.hidden), 'dirbtn:',await c2.pg.$eval('#nw-dir',e=>!e.hidden));
await c2.pg.click('#nw-dir'); await c2.pg.waitForTimeout(1500);
await c2.pg.click('#mn-btn'); await c2.pg.click('.mit[data-p=archivio]');
console.log('clienti dopo recupero:',await c2.pg.$$eval('#c-list .rowc',e=>e.map(x=>x.innerText.split('\n')[0])));
console.log('state:',await c2.pg.textContent('#mi-state'));
console.log(c2.errs);
await b.close();})();
