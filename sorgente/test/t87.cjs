// Loghi delle marche: grandezza regolabile nella scheda prodotto (anche per tutti), piccolo logo nelle voci del preventivo
// economico (si può togliere); comando GitHub sempre in alto nella prima schermata (stato e un tocco per sincronizzare)
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const LOGO='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><rect width="200" height="60" fill="#e30613"/><text x="100" y="40" font-size="30" text-anchor="middle" fill="#fff">HAGER</text></svg>').toString('base64');
(async()=>{const b=await A.chromium.launch();
// GitHub finto
let store=null, sha=0, puts=0, guasto=false;
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,PUT,OPTIONS'};
async function gh(r){ const q=r.request(), u=new URL(q.url());
  if(q.method()==='OPTIONS') return r.fulfill({status:204,headers:cors});
  if(guasto) return r.fulfill({status:503,headers:cors,body:'{}'});
  if(u.pathname==='/repos/mario/dati') return r.fulfill({status:200,headers:{...cors,'content-type':'application/json'},body:JSON.stringify({private:true})});
  if(q.method()==='GET'){ if(store===null) return r.fulfill({status:404,headers:cors,body:'{}'}); if((q.headers().accept||'').includes('raw')) return r.fulfill({status:200,headers:{...cors,'content-type':'application/json'},body:store}); return r.fulfill({status:200,headers:{...cors,'content-type':'application/json'},body:JSON.stringify({sha:'s'+sha})}); }
  if(q.method()==='PUT'){ const j=JSON.parse(q.postData()); store=Buffer.from(j.content,'base64').toString('utf8'); sha++; puts++; return r.fulfill({status:200,headers:{...cors,'content-type':'application/json'},body:JSON.stringify({content:{sha:'s'+sha}})}); }
  r.fulfill({status:404,headers:cors,body:'{}'}); }
const ctx=await b.newContext({viewport:{width:375,height:800},isMobile:true,hasTouch:true});
await ctx.route('https://api.github.com/**',gh);
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S,null,{timeout:30000});
const S=(f,a)=>p.evaluate(f,a);

// 1. comando GitHub in alto: non collegato → porta alla sezione per collegarlo
let st=await S(()=>{ const c=document.getElementById('gh-chip'), r=c.getBoundingClientRect(); return {st:c.dataset.st,top:Math.round(r.top),vis:r.width>0,tip:c.title,inHead:!!c.closest('header.top')}; });
ok(st.vis&&st.inHead&&st.top<60&&st.st==='off'&&/non collegato/.test(st.tip),'in alto nella prima schermata, piccolo: «GitHub non collegato»');
await p.click('#gh-chip'); await p.waitForTimeout(500);
ok(await S(()=>!document.getElementById('salva').hidden&&document.activeElement&&document.activeElement.id==='gh-repo'),'toccandolo apre «Salva e sincronizza» pronto per collegare GitHub');
await p.fill('#gh-repo','mario/dati'); await p.fill('#gh-token','github_pat_ok'); await p.click('#gh-on');
await p.waitForFunction(()=>document.getElementById('gh-chip').dataset.st==='ok',null,{timeout:15000}).catch(()=>{});
st=await S(()=>{ const c=document.getElementById('gh-chip'); return {st:c.dataset.st,tip:c.title}; });
ok(st.st==='ok'&&/Tutto salvato su GitHub/.test(st.tip)&&puts>=1,'collegato: pallino verde «Sincronizzato» ('+puts+' salvataggi)');
// una modifica: «Da salvare», poi un tocco salva e sincronizza
await S(()=>{ const s=window.IECI_T.S(); s.meta.title='Prova sincronizzazione'; window.IECI_T.touch(); }); await p.click('#qb-save'); await p.waitForTimeout(600);
st=await S(()=>document.getElementById('gh-chip').dataset.st);
ok(st==='dirty','dopo una modifica: pallino giallo «Da salvare»');
const p0=puts; await S(()=>window.scrollTo(0,0)); await p.click('#gh-chip'); await p.waitForFunction(()=>document.getElementById('gh-chip').dataset.st==='ok',null,{timeout:15000}).catch(()=>{});
ok(puts>p0&&/Prova sincronizzazione/.test(store||''),'un tocco in alto: salvato e sincronizzato su GitHub');
guasto=true; await p.click('#gh-chip'); await p.waitForFunction(()=>document.getElementById('gh-chip').dataset.st==='err',null,{timeout:15000}).catch(()=>{});
ok(await S(()=>{ const c=document.getElementById('gh-chip'); return c.dataset.st==='err'&&/Tocca per riprovare/.test(c.title); }),'se GitHub non risponde: pallino rosso «Riprova»');
guasto=false; await p.click('#gh-chip'); await p.waitForFunction(()=>document.getElementById('gh-chip').dataset.st==='ok',null,{timeout:15000}).catch(()=>{});
ok(await S(()=>document.getElementById('gh-chip').dataset.st==='ok'),'riprovando torna verde');
st=await S(()=>{ const c=document.getElementById('gh-chip').getBoundingClientRect(), h=document.querySelector('header.top h1').getBoundingClientRect(); return {sov:!(c.right<=h.left||c.left>=h.right||c.bottom<=h.top||c.top>=h.bottom),w:Math.round(c.width)}; });
ok(!st.sov&&st.w<=40,'sul telefono è solo un\'icona e non copre il nome');

// 2. logo della marca: grandezza regolabile
await S(l=>{ const s=window.IECI_T.S(); s.trust.bgroups=[{id:'bg0',t:'Marchi',items:[{name:'Hager',img:l}]}];
  s.lines=[{d:'Interruttore differenziale 2P 40 A',u:'cad',q:2,p:95,s:0,br:'Hager'},{d:'Manodopera oraria',u:'h',q:3,p:38,s:0}]; s.products=[];
  window.IECI_T.linkLine(s.lines[0],{force:true,brand:'Hager',code:'CDA240'}); s.style.showProdotti=true; s.show.prodotti=true; window.IECI_T.touch(); window.IECI_T.renderAll(); },LOGO);
await p.waitForTimeout(1500);
const altezza=()=>S(()=>{ const d=document.getElementById('doc'); d.classList.add('cattura'); const im=d.querySelector('.p-i .brand.lg img'); return im?Math.round(im.getBoundingClientRect().height/(parseFloat(d.style.zoom)||1)):0; });
let h=await altezza(); ok(h===18,'nel fascicolo il logo parte a 18 px ('+h+')');
await A.mostra(p,'#plist'); await S(()=>document.querySelectorAll('#plist details.pe').forEach(d=>d.open=true)); await p.waitForTimeout(300);
ok(await S(()=>!!document.querySelector('#plist [data-pf="ls"]')&&!!document.querySelector('#plist .lsz-p img')),'scheda prodotto: «Grandezza del logo nel documento» con l\'anteprima');
await S(()=>{ const r=document.querySelector('#plist [data-pf="ls"]'); r.value='40'; r.dispatchEvent(new Event('input',{bubbles:true})); }); await p.waitForTimeout(1500);
st=await S(()=>({v:document.querySelector('#plist .lsv').textContent,pv:document.querySelector('#plist .lsz-p img').style.height,ls:window.IECI_T.S().products[0].ls}));
h=await altezza();
ok(st.v==='40 px'&&st.pv==='40px'&&st.ls===40&&h===40,'logo ingrandito a 40 px: anteprima e fascicolo cambiano subito');
await S(()=>{ const r=document.querySelector('#plist [data-pf="ls"]'); r.value='12'; r.dispatchEvent(new Event('input',{bubbles:true})); }); await p.waitForTimeout(1500);
ok(await altezza()===12,'e rimpicciolito a 12 px');
// «Usa questa grandezza per tutti»
await S(()=>{ const s=window.IECI_T.S(); s.lines.push({d:'Magnetotermico 1P+N 16 A',u:'cad',q:4,p:20,s:0,br:'Hager'}); window.IECI_T.linkLine(s.lines[2],{force:true,brand:'Hager',code:'MFN716'}); window.IECI_T.renderAll(); });
await S(()=>document.querySelectorAll('#plist details.pe').forEach(d=>d.open=true)); await p.waitForTimeout(200);
await S(()=>{ const r=document.querySelector('#plist [data-pf="ls"]'); r.value='30'; r.dispatchEvent(new Event('input',{bubbles:true})); }); await p.waitForTimeout(200);
await p.click('#plist [data-act="lsall"]'); await p.waitForTimeout(300);
st=await S(()=>({ls:window.IECI_T.S().products.map(x=>x.ls),g:window.IECI_T.S().style.logoH}));
ok(st.ls.every(x=>x===30)&&st.g===30,'«Usa questa grandezza per tutti i loghi»: tutti a 30 px, anche per i prossimi prodotti');

// 3. piccolo logo nel preventivo economico
await p.waitForTimeout(1500);
st=await S(()=>{ const d=document.getElementById('doc'); d.classList.add('cattura'); const rows=[...d.querySelectorAll('table.qt tbody tr')]; return rows.map(r=>({t:r.innerText.split('\n')[0],lg:!!r.querySelector('img.brl'),h:r.querySelector('img.brl')?Math.round(r.querySelector('img.brl').getBoundingClientRect().height/(parseFloat(d.style.zoom)||1)):0})); });
console.log(JSON.stringify(st));
ok(st.some(r=>/differenziale/.test(r.t)&&r.lg&&r.h===14)&&st.some(r=>/Manodopera/.test(r.t)&&!r.lg),'preventivo economico: piccolo logo (14 px) accanto alle voci con la marca, niente sulle altre');
await S(()=>{ window.IECI_T.S().show.pvLogo=false; window.IECI_T.touch(); }); await p.waitForTimeout(1500);
ok(await S(()=>!document.querySelector('#doc table.qt img.brl')&&/Marca: Hager/.test(document.querySelector('#doc table.qt').innerText.replace(/\s+/g,' '))),'si può togliere da Contenuto (resta scritto «Marca: Hager»)');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
