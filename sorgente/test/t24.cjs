const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
// fake GitHub
let store=null, sha=0, priv=true, puts=0;
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,PUT,OPTIONS'};
async function route(r){
  const q=r.request(), u=new URL(q.url());
  if(q.method()==='OPTIONS') return r.fulfill({status:204,headers:cors});
  if(u.pathname==='/repos/mario/dati') return r.fulfill({status:200,headers:{...cors,'content-type':'application/json'},body:JSON.stringify({private:priv})});
  if(u.pathname==='/repos/mario/dati/contents/archivio-preventivi-ieci.json'){
    if(q.headers().authorization!=='Bearer github_pat_ok') return r.fulfill({status:401,headers:cors,body:'{}'});
    if(q.method()==='GET'){
      if(store===null) return r.fulfill({status:404,headers:cors,body:'{}'});
      if((q.headers().accept||'').includes('raw')) return r.fulfill({status:200,headers:{...cors,'content-type':'application/json'},body:store});
      return r.fulfill({status:200,headers:{...cors,'content-type':'application/json'},body:JSON.stringify({sha:'s'+sha,content:'',encoding:'none'})});
    }
    if(q.method()==='PUT'){
      const j=JSON.parse(q.postData());
      if(store!==null&&j.sha!=='s'+sha) return r.fulfill({status:409,headers:cors,body:'{}'});
      store=Buffer.from(j.content,'base64').toString('utf8'); sha++; puts++;
      return r.fulfill({status:200,headers:{...cors,'content-type':'application/json'},body:'{}'});
    }
  }
  r.fulfill({status:404,headers:cors,body:'{}'});
}
async function dev(){ const c=await b.newContext({viewport:{width:430,height:900}}); const pg=await c.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); await c.route('https://api.github.com/**',route);
  await pg.goto('http://localhost:8143/preventivi-elettrici.html'); await pg.waitForTimeout(1800); pg.errs=errs;
  pg.go=async x=>{await require('./_amb.cjs').mostra(pg,'#mn-btn'); await pg.click('#mn-btn'); await pg.click('.mit[data-p='+x+']'); await pg.waitForTimeout(150);}; return pg; }
const A=await dev(), B=await dev();
// A: crea preventivo e collega (prima con archivio pubblico)
await A.go('dati'); await require('./_amb.cjs').mostra(A,'#k-name'); await A.fill('#k-name','Cliente Alfa'); await A.waitForTimeout(2200);
await A.go('archivio'); await require('./_amb.cjs').mostra(A,'#gh-repo'); await A.fill('#gh-repo','https://github.com/mario/dati'); await require('./_amb.cjs').mostra(A,'#gh-token'); await A.fill('#gh-token','github_pat_ok');
priv=false; await require('./_amb.cjs').mostra(A,'#gh-on'); await A.click('#gh-on'); await A.waitForTimeout(600); console.log('public ->',await A.textContent('#gh-state'));
priv=true; await require('./_amb.cjs').mostra(A,'#gh-on'); await A.click('#gh-on'); await A.waitForTimeout(2500); console.log('A',await A.textContent('#gh-state'));
// B collega e riceve
await B.go('archivio'); await require('./_amb.cjs').mostra(B,'#gh-repo'); await B.fill('#gh-repo','mario/dati'); await require('./_amb.cjs').mostra(B,'#gh-token'); await B.fill('#gh-token','github_pat_ok'); await require('./_amb.cjs').mostra(B,'#gh-on'); await B.click('#gh-on'); await B.waitForTimeout(2500);
console.log('B state',await B.textContent('#gh-state')); console.log('B list',await B.textContent('#q-list'));
// B crea Beta e sincronizza, A riceve
await B.go('dati'); await require('./_amb.cjs').mostra(B,'#qb-new'); await B.click('#qb-new'); await B.waitForTimeout(500); await require('./_amb.cjs').mostra(B,'#k-name'); await B.fill('#k-name','Cliente Beta'); await B.waitForTimeout(2200);
await B.go('archivio'); await require('./_amb.cjs').mostra(B,'#gh-sync'); await B.click('#gh-sync'); await B.waitForTimeout(2500);
await require('./_amb.cjs').mostra(A,'#gh-sync'); await A.click('#gh-sync'); await A.waitForTimeout(2500); console.log('A list',await A.textContent('#q-list'));
// token errato
await require('./_amb.cjs').mostra(A,'#gh-token'); await A.fill('#gh-token','sbagliato'); await require('./_amb.cjs').mostra(A,'#gh-on'); await A.click('#gh-on'); await A.waitForTimeout(800); console.log('bad',await A.textContent('#gh-state'));
// nessun ciclo: contare put in 30s di quiete
const p0=puts; await require('./_amb.cjs').mostra(A,'#gh-token'); await A.fill('#gh-token','github_pat_ok'); await require('./_amb.cjs').mostra(A,'#gh-on'); await A.click('#gh-on'); await A.waitForTimeout(2500); const p1=puts; await A.waitForTimeout(40000); console.log('puts durante quiete',puts-p1,'(dopo connessione',p1-p0,')');
console.log(A.errs,B.errs); await b.close();})();
