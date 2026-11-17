// Niente copie di conflitto inutili: i ritocchi automatici dell'app non contano come modifiche; le copie uguali
// all'originale (o uguali tra loro) spariscono da sole; «Tieni questa versione» ed «Elimina tutte le copie».
const A=require('./_amb.cjs');
const G=require('./_github_finto.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const errs=[];
async function dispositivo(nome,mobile){
  const ctx=await b.newContext(mobile?{viewport:{width:390,height:820},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:900}});
  await G.finto(ctx);
  const st={giu:false,lento:0};
  // rete staccata (solo per questo dispositivo) e salvataggio lento, per le prove
  await ctx.route('https://api.github.com/**',async r=>{ if(st.giu) return r.abort('internetdisconnected'); if(st.lento&&r.request().method()==='PUT'&&/archivio-preventivi/.test(r.request().url())) await new Promise(f=>setTimeout(f,st.lento)); return r.fallback(); });
  await ctx.addInitScript(n=>{ window.IECI_AUTO={quiete:700,max:2500,poll:1500,ritorno:0}; try{ const g=JSON.parse(localStorage.getItem('ieci-gh')||'{}'); if(!g.nome){ g.nome=n; localStorage.setItem('ieci-gh',JSON.stringify(g)); } }catch(e){} },nome);
  const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(nome+': '+e.message)); p.on('dialog',d=>d.accept());
  await p.goto(A.SA); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S&&window.IECI_T.DB&&window.IECI_T.DB().quotes,null,{timeout:30000});
  await p.waitForFunction(()=>document.getElementById('gh-chip').dataset.st==='ok',null,{timeout:20000}).catch(()=>{});
  return {ctx,p,st,S:(f,a)=>p.evaluate(f,a)};
}
const aspetta=(d,f,a,t)=>d.p.waitForFunction(f,a,{timeout:t||20000}).then(()=>true).catch(()=>false);
const fermo=d=>aspetta(d,()=>document.getElementById('gh-chip').dataset.st==='ok'&&!window.IECI_T.ghBusy()&&!window.IECI_T.GH().dirty);
const W=await dispositivo('Windows',false);
await W.S(()=>{ const s=window.IECI_T.S(); s.qid=''; s.client={name:'Condominio Rose',addr:'Via Roma 1',tel:'',email:'',cf:''}; s.meta.title='Videocitofono Rose'; s.lines=[{d:'Monitor',u:'cad',q:6,p:150,s:0}]; window.IECI_T.touch(); window.IECI_T.saveQuote(true); });
await W.S(()=>window.IECI_T.ghSync(false)); await fermo(W);
const id=await W.S(()=>window.IECI_T.S().qid);
const D=await dispositivo('Android',true);
await aspetta(D,i=>window.IECI_T.DB().quotes.some(q=>q.id===i),id); await fermo(D);
// 1. su Windows il preventivo è stato salvato da una versione vecchia dell'app: all'apertura l'app lo «ritocca» da sola
await W.S(i=>{ const T=window.IECI_T, q=T.DB().quotes.find(x=>x.id===i); delete q.data.cond.vm; delete q.data.econ.agreed; T.dbSave(true); },id);
await W.S(i=>{ window.IECI_T.S().qid=''; window.IECI_T.openQuote(i); },id); await W.p.waitForTimeout(400);
const upd0=await W.S(i=>window.IECI_T.DB().quotes.find(x=>x.id===i).upd,id);
const prima=await W.S(i=>JSON.stringify(window.IECI_T.DB().quotes.find(x=>x.id===i).data),id);
await W.S(()=>{ window.IECI_T.touch(); window.IECI_T.renderAll&&window.IECI_T.renderAll(); }); await W.p.waitForTimeout(6800);
ok(await W.S(i=>!window.IECI_T.auto.qmod()[i]&&window.IECI_T.DB().quotes.find(x=>x.id===i).upd===0||!window.IECI_T.auto.qmod()[i],id),'aperto e ritoccato dall\'app (senza modifiche tue): il preventivo NON risulta modificato');
{ const dopo=await W.S(i=>JSON.stringify(window.IECI_T.DB().quotes.find(x=>x.id===i).data),id); if(dopo!==prima){ let k=0; while(k<prima.length&&prima[k]===dopo[k]) k++; console.log('DIFF: …'+prima.slice(Math.max(0,k-120),k+120)+'\n  ≠ …'+dopo.slice(Math.max(0,k-120),k+120)); } }
ok(await W.S(([i,u])=>window.IECI_T.DB().quotes.find(x=>x.id===i).upd===u,[id,upd0]),'…e non diventa «più recente» di quello degli altri dispositivi');
// 2. intanto su Android lo cambi davvero
await D.S(i=>{ window.IECI_T.openQuote(i); },id); await D.p.waitForTimeout(400);
await D.S(()=>{ const s=window.IECI_T.S(); s.meta.title='Videocitofono Rose - modificato su Android'; window.IECI_T.touch(); window.IECI_T.saveQuote(true); window.IECI_T.ghSync(false); }); await fermo(D);
await W.S(()=>window.IECI_T.ghSync(false)); await fermo(W); await W.p.waitForTimeout(500);
ok(await W.S(()=>!window.IECI_T.DB().quotes.some(q=>q.conf)),'Windows riceve la modifica di Android SENZA creare copie di conflitto');
ok(await W.S(i=>/modificato su Android/.test(window.IECI_T.DB().quotes.find(x=>x.id===i).title),id),'…e il preventivo è quello aggiornato da Android');
// 3. copie già create in passato: quelle uguali all'originale o doppie spariscono da sole
const nC0=await W.S(()=>window.IECI_T.auto.cest().length);
await W.S(i=>{ const T=window.IECI_T, DB=T.DB(), o=DB.quotes.find(x=>x.id===i);
  const copia=(tit,k)=>{ const c=JSON.parse(JSON.stringify(o)); c.id='cc'+k; c.conf={dv:'Android',t:o.upd,orig:o.id}; c.title=(tit||o.title)+' · versione di Android'; c.data.qid=c.id; c.data.meta.title=(tit||o.data.meta.title)+' · versione di Android'; c.upd=Date.now()+k; DB.quotes.push(c); };
  copia('',1); copia('',2); copia('',3); copia('Versione davvero diversa',4); copia('Versione davvero diversa',5);
  T.dbSave(); },id);
const tolte=await W.S(()=>window.IECI_T.auto.copiePulisci());
const rest=await W.S(()=>window.IECI_T.DB().quotes.filter(q=>q.conf).map(q=>q.id));
ok(tolte===4&&rest.length===1&&rest[0]==='cc4','copie uguali all\'originale (3) e doppione della copia diversa (1) tolte da sole: resta solo la copia davvero diversa ('+tolte+' tolte, restano '+JSON.stringify(rest)+')');
ok(await W.S(n=>window.IECI_T.auto.cest().length>=n+4,nC0),'le copie tolte sono nel cestino (si possono rimettere)');
await A.mostra(W.p,'[data-qk="cc4"]');
ok(await W.S(()=>/1 copia di conflitto/.test(document.getElementById('q-list').textContent)),'nell\'archivio un avviso dice quante copie di conflitto ci sono');
// 4. «Tieni questa versione»
await W.p.click('[data-qk="cc4"]'); await W.p.waitForTimeout(400);
ok(await W.S(i=>{ const DB=window.IECI_T.DB(), q=DB.quotes.find(x=>x.id===i); return q&&q.title==='Versione davvero diversa'&&!DB.quotes.some(x=>x.conf); },id),'«Tieni questa versione»: il preventivo diventa quella versione (senza «versione di…» nel titolo) e la copia sparisce');
ok(await W.S(i=>window.IECI_T.auto.cest().some(e=>e.oid===i&&e.v),id),'la versione che c\'era prima è nel cestino');
await W.S(()=>window.IECI_T.ghSync(false)); await fermo(W);
await D.S(()=>window.IECI_T.ghSync(false)); await fermo(D);
ok(await D.S(i=>window.IECI_T.DB().quotes.find(x=>x.id===i).title==='Versione davvero diversa'&&!window.IECI_T.DB().quotes.some(q=>q.conf),id),'anche su Android: versione scelta e nessuna copia');
// 5. «Elimina tutte le copie»
await W.S(i=>{ const T=window.IECI_T, DB=T.DB(), o=DB.quotes.find(x=>x.id===i); [7,8].forEach(k=>{ const c=JSON.parse(JSON.stringify(o)); c.id='cx'+k; c.conf={dv:'Android',t:1,orig:o.id}; c.data.qid=c.id; c.data.meta.title='Diversa '+k; c.title='Diversa '+k; DB.quotes.push(c); }); T.dbSave(); T.renderAll(); },id);
await A.mostra(W.p,'[data-qkall]'); await W.p.click('[data-qkall]'); await W.p.click('[data-qkall]'); await W.p.waitForTimeout(400);
ok(await W.S(()=>!window.IECI_T.DB().quotes.some(q=>q.conf)),'«Elimina tutte le copie» (due tocchi): nessuna copia di conflitto');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
