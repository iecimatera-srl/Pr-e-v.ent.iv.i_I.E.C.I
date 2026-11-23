// Niente copie: un preventivo = una riga. I ritocchi automatici dell'app non contano come modifiche; le «copie di
// conflitto» delle versioni di prima diventano versioni DENTRO il loro preventivo (le uguali spariscono, nessun doppione
// nel cestino); «Usa questa» e «Togli» valgono su tutti i dispositivi; una copia senza originale torna un preventivo normale.
const A=require('./_amb.cjs');
const G=require('./_github_finto.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const errs=[];
async function dispositivo(nome,mobile){
  const ctx=await b.newContext(mobile?{viewport:{width:390,height:820},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:900}});
  await G.finto(ctx);
  await ctx.addInitScript(n=>{ window.IECI_AUTO={quiete:700,max:2500,poll:1500,ritorno:0}; try{ const g=JSON.parse(localStorage.getItem('ieci-gh')||'{}'); if(!g.nome){ g.nome=n; localStorage.setItem('ieci-gh',JSON.stringify(g)); } }catch(e){} },nome);
  const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(nome+': '+e.message)); p.on('dialog',d=>d.accept());
  await p.goto(A.SA); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S&&window.IECI_T.DB&&window.IECI_T.DB().quotes,null,{timeout:30000});
  await p.waitForFunction(()=>document.getElementById('gh-chip').dataset.st==='ok',null,{timeout:20000}).catch(()=>{});
  return {ctx,p,S:(f,a)=>p.evaluate(f,a)};
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
await W.S(()=>{ window.IECI_T.touch(); window.IECI_T.renderAll&&window.IECI_T.renderAll(); }); await W.p.waitForTimeout(6800);
ok(await W.S(i=>!window.IECI_T.auto.qmod()[i],id),'aperto e ritoccato dall\'app (senza modifiche tue): il preventivo NON risulta modificato');
ok(await W.S(([i,u])=>window.IECI_T.DB().quotes.find(x=>x.id===i).upd===u,[id,upd0]),'…e non diventa «più recente» di quello degli altri dispositivi');
// 2. intanto su Android lo cambi davvero
await D.S(i=>{ window.IECI_T.openQuote(i); },id); await D.p.waitForTimeout(400);
await D.S(()=>{ const s=window.IECI_T.S(); s.meta.title='Videocitofono Rose - modificato su Android'; window.IECI_T.touch(); window.IECI_T.saveQuote(true); window.IECI_T.ghSync(false); }); await fermo(D);
await W.S(()=>window.IECI_T.ghSync(false)); await fermo(W); await W.p.waitForTimeout(500);
ok(await W.S(i=>{ const q=window.IECI_T.DB().quotes.find(x=>x.id===i); return !window.IECI_T.DB().quotes.some(x=>x.conf)&&!(q.alt&&q.alt.length); },id),'Windows riceve la modifica di Android senza copie né versioni inutili');
ok(await W.S(i=>/modificato su Android/.test(window.IECI_T.DB().quotes.find(x=>x.id===i).title),id),'…e il preventivo è quello aggiornato da Android');
// 3. copie create dalle versioni di prima: diventano versioni dentro il preventivo
const nC0=await W.S(()=>window.IECI_T.auto.cest().length), nQ0=await W.S(()=>window.IECI_T.DB().quotes.length);
await W.S(i=>{ const T=window.IECI_T, DB=T.DB(), o=DB.quotes.find(x=>x.id===i);
  const copia=(tit,k,orig)=>{ const c=JSON.parse(JSON.stringify(o)); c.id='cc'+k; c.conf={dv:'Android',t:o.upd,orig:orig||o.id}; c.title=(tit||o.title)+' · versione di Android'; c.data.qid=c.id; c.data.meta.title=(tit||o.data.meta.title)+' · versione di Android'; c.upd=Date.now()+k; DB.quotes.push(c); };
  copia('',1); copia('',2); copia('',3); copia('Versione davvero diversa',4); copia('Versione davvero diversa',5); copia('Rimasta sola',6,'qnonce');
  T.dbSave(); },id);
const n=await W.S(()=>window.IECI_T.auto.copiePulisci());
ok(n===6&&await W.S(()=>!window.IECI_T.DB().quotes.some(q=>q.conf)),'sistemate tutte e 6 le copie: nell\'archivio non c\'è più nessuna copia ('+n+')');
const alt=await W.S(i=>(window.IECI_T.DB().quotes.find(x=>x.id===i).alt||[]).map(v=>v.title),id);
ok(alt.length===1&&alt[0]==='Versione davvero diversa','le 3 copie uguali spariscono, le 2 diverse uguali tra loro diventano UNA versione dentro il preventivo ('+JSON.stringify(alt)+')');
ok(await W.S(()=>{ const q=window.IECI_T.DB().quotes.find(x=>x.id==='cc6'); return q&&!q.conf&&q.title==='Rimasta sola'; }),'la copia senza preventivo originale non si perde: torna un preventivo normale (senza «versione di…»)');
ok(await W.S(()=>window.IECI_T.DB().quotes.length)===nQ0+1,'nell\'archivio: '+(await W.S(()=>window.IECI_T.DB().quotes.length))+' righe, una per preventivo');
ok(await W.S(n=>window.IECI_T.auto.cest().length===n,nC0),'nessun doppione nel cestino (le versioni sono già dentro il preventivo)');
await W.S(()=>window.IECI_T.showPanel('salva')); await W.p.waitForTimeout(300);
ok(await W.S(()=>/2 versioni/.test(document.getElementById('q-list').textContent)),'la riga del preventivo dice «2 versioni»');
await W.S(()=>window.IECI_T.ghSync(false)); await fermo(W);
await D.S(()=>window.IECI_T.ghSync(false)); await fermo(D);
ok(await D.S(i=>!window.IECI_T.DB().quotes.some(q=>q.conf)&&(window.IECI_T.DB().quotes.find(x=>x.id===i).alt||[]).length===1,id),'anche su Android: nessuna copia, una versione dentro il preventivo');
ok(!G.archivio().db.quotes.some(q=>q.conf),'e su GitHub nessuna copia');
// 4. «Usa questa»
const vid=await W.S(i=>window.IECI_T.DB().quotes.find(x=>x.id===i).alt[0].id,id);
await A.mostra(W.p,'[data-qvu="'+id+':'+vid+'"]'); await W.p.click('[data-qvu="'+id+':'+vid+'"]'); await W.p.waitForTimeout(400);
ok(await W.S(i=>{ const q=window.IECI_T.DB().quotes.find(x=>x.id===i); return q.title==='Versione davvero diversa'&&q.alt.length===1&&/modificato su Android/.test(q.alt[0].title); },id),'«Usa questa»: il preventivo diventa quella versione, quella di prima resta tra le versioni');
await W.S(()=>window.IECI_T.ghSync(false)); await fermo(W);
await D.S(()=>window.IECI_T.ghSync(false)); await fermo(D);
ok(await D.S(i=>{ const q=window.IECI_T.DB().quotes.find(x=>x.id===i); return q.title==='Versione davvero diversa'&&q.alt.length===1; },id),'anche su Android: versione scelta, senza doppioni');
// 5. «Togli» (due tocchi): sparisce ovunque e non torna
const vid2=await W.S(i=>window.IECI_T.DB().quotes.find(x=>x.id===i).alt[0].id,id);
await A.mostra(W.p,'[data-qvx="'+id+':'+vid2+'"]'); await W.p.click('[data-qvx="'+id+':'+vid2+'"]'); await W.p.click('[data-qvx="'+id+':'+vid2+'"]'); await W.p.waitForTimeout(400);
ok(await W.S(i=>!(window.IECI_T.DB().quotes.find(x=>x.id===i).alt||[]).length,id),'«Togli» (due tocchi): la versione non c\'è più');
await W.S(()=>window.IECI_T.ghSync(false)); await fermo(W);
await D.S(()=>window.IECI_T.ghSync(false)); await fermo(D);
await W.S(()=>window.IECI_T.ghSync(false)); await fermo(W);
ok(await D.S(i=>!(window.IECI_T.DB().quotes.find(x=>x.id===i).alt||[]).length,id)&&await W.S(i=>!(window.IECI_T.DB().quotes.find(x=>x.id===i).alt||[]).length,id),'tolta anche su Android, e non ritorna su Windows');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
