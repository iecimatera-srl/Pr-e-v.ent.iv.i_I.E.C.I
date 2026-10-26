const {chromium}=require('./_amb.cjs');
const store={file:null,id:'F1'};
const GIS=`window.google={accounts:{oauth2:{initTokenClient:function(c){return {requestAccessToken:function(){setTimeout(function(){c.callback({access_token:'tok',expires_in:3600});},50);}}},revoke:function(){}}}};`;
async function mk(b){
  const ctx=await b.newContext(); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('https://accounts.google.com/gsi/client',r=>r.fulfill({contentType:'text/javascript',body:GIS}));
  await pg.route('https://www.googleapis.com/**',async r=>{
    const u=r.request().url(), m=r.request().method();
    const cors={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
    if(m==='OPTIONS') return r.fulfill({status:204,headers:cors});
    if(u.includes('/upload/')){ const body=r.request().postData(); const j=body.split('\r\n\r\n').slice(2).join('\r\n\r\n').replace(/\r\n--ieci[^\r]*--$/,''); store.file=j; return r.fulfill({status:200,headers:cors,contentType:'application/json',body:'{"id":"F1"}'}); }
    if(u.includes('alt=media')) return r.fulfill({status:200,headers:cors,contentType:'application/json',body:store.file});
    return r.fulfill({status:200,headers:cors,contentType:'application/json',body:JSON.stringify({files:store.file?[{id:'F1'}]:[]})});
  });
  await pg.goto('http://localhost:8765/preventivi-elettrici.html'); await pg.waitForTimeout(600);
  return {pg,errs};
}
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const A=await mk(b), B=await mk(b);
const a=A.pg;
await require('./_amb.cjs').mostra(a,'#mn-btn'); await a.click('#mn-btn');await a.click('.mit[data-p=dati]'); await require('./_amb.cjs').mostra(a,'#k-name'); await a.fill('#k-name','Bianchi Luca'); await require('./_amb.cjs').mostra(a,'#m-title'); await a.fill('#m-title','Quadro negozio');
await require('./_amb.cjs').mostra(a,'#c-addr'); await a.fill('#c-addr','Via Nuova 5 Matera');
await require('./_amb.cjs').mostra(a,'#mn-btn'); await a.click('#mn-btn');await a.click('.mit[data-p=archivio]'); await require('./_amb.cjs').mostra(a,'#q-save'); await a.click('#q-save');
await require('./_amb.cjs').mostra(a,'#gd-cid'); await a.fill('#gd-cid','test.apps.googleusercontent.com'); await require('./_amb.cjs').mostra(a,'#gd-on'); await a.click('#gd-on'); await a.waitForTimeout(1500);
console.log('A:',await a.textContent('#gd-state'));
const bp=B.pg; await require('./_amb.cjs').mostra(bp,'#mn-btn'); await bp.click('#mn-btn');await bp.click('.mit[data-p=archivio]'); await require('./_amb.cjs').mostra(bp,'#gd-cid'); await bp.fill('#gd-cid','test.apps.googleusercontent.com'); await require('./_amb.cjs').mostra(bp,'#gd-on'); await bp.click('#gd-on'); await bp.waitForTimeout(1500);
console.log('B:',await bp.textContent('#gd-state'));
console.log('B quotes',await bp.$eval('#q-list',e=>e.innerText.replace(/\s+/g,' ')));
console.log('B clients',await bp.$eval('#c-list',e=>e.innerText.replace(/\s+/g,' ')));
await require('./_amb.cjs').mostra(bp,'#mn-btn'); await bp.click('#mn-btn');await bp.click('.mit[data-p=dati]'); console.log('B company addr',await bp.inputValue('#c-addr'));
// B deletes the quote and syncs; A syncs
await require('./_amb.cjs').mostra(bp,'#mn-btn'); await bp.click('#mn-btn');await bp.click('.mit[data-p=archivio]'); await require('./_amb.cjs').mostra(bp,'[data-qx]'); await bp.click('[data-qx]'); await require('./_amb.cjs').mostra(bp,'[data-qx]'); await bp.click('[data-qx]'); await require('./_amb.cjs').mostra(bp,'#gd-sync'); await bp.click('#gd-sync'); await bp.waitForTimeout(1200);
await require('./_amb.cjs').mostra(a,'#gd-sync'); await a.click('#gd-sync'); await a.waitForTimeout(1200);
console.log('A quotes after B delete:',await a.$$eval('#q-list .rowc',x=>x.length),'clients',await a.$$eval('#c-list .rowc',x=>x.length));
console.log(A.errs,B.errs); await b.close();})();
