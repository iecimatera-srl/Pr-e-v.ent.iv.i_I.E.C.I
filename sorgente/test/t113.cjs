// Il caso «Bruno»: 3.500 € su un dispositivo, 2.400 € (la versione di quando l'avevi duplicato) sull'altro.
// Non conta più l'orologio ma il contenuto: un dispositivo rimasto indietro (anche con l'orologio avanti, anche con il
// preventivo rimasto aperto) non riporta mai indietro gli altri; se lo stesso preventivo cambia davvero su tutti e due,
// resta UN preventivo con dentro le due versioni «da scegliere», e scegli tu. Mai copie.
const A=require('./_amb.cjs');
const G=require('./_github_finto.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const errs=[], RETE={giu:false};
async function contesto(nome,mobile){
  const ctx=await b.newContext(mobile?{viewport:{width:390,height:820},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:900}});
  await G.finto(ctx);
  await ctx.route('https://api.github.com/**',r=>RETE.giu?r.abort('internetdisconnected'):r.fallback());
  await ctx.addInitScript(n=>{ window.IECI_AUTO={quiete:700,max:2500,poll:1500,ritorno:0}; try{ const g=JSON.parse(localStorage.getItem('ieci-gh')||'{}'); if(!g.nome){ g.nome=n; localStorage.setItem('ieci-gh',JSON.stringify(g)); } }catch(e){} },nome);
  return ctx;
}
async function apri(ctx,nome){
  const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(nome+': '+e.message)); p.on('dialog',d=>d.accept());
  await p.goto(A.SA); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S&&window.IECI_T.DB&&window.IECI_T.DB().quotes,null,{timeout:30000});
  await p.waitForFunction(()=>document.getElementById('gh-chip').dataset.st==='ok',null,{timeout:20000}).catch(()=>{});
  return {ctx,p,S:(f,a)=>p.evaluate(f,a)};
}
const aspetta=(d,f,a,t)=>d.p.waitForFunction(f,a,{timeout:t||20000}).then(()=>true).catch(()=>false);
const fermo=d=>aspetta(d,()=>document.getElementById('gh-chip').dataset.st==='ok'&&!window.IECI_T.ghBusy()&&!window.IECI_T.GH().dirty,null,30000);
const sinc=async d=>{ await aspetta(d,()=>!window.IECI_T.ghBusy()); await d.S(()=>window.IECI_T.ghSync(false)); await d.p.waitForTimeout(250); await fermo(d); };
const netto=(d,id)=>d.S(i=>{ const q=window.IECI_T.DB().quotes.find(x=>x.id===i); return q?q.data.lines[0].p:null; },id);
const suGH=id=>{ const q=G.archivio().db.quotes.filter(x=>x.id===id); return q.length===1?q[0].data.lines[0].p:'righe:'+q.length; };
const prezzo=(d,id,v)=>d.S(([i,v])=>{ const T=window.IECI_T; if(T.S().qid!==i) T.openQuote(i); const s=T.S(); s.lines[0].p=v; T.touch(); T.saveQuote(true); },[id,v]);

const cW=await contesto('Windows',false), cD=await contesto('Android',true);
let W=await apri(cW,'Windows');
// 1. Windows: preventivo duplicato all'inizio, 2.400 €
await W.S(()=>{ const T=window.IECI_T, s=T.S(); s.qid=''; s.client={name:'Bruno',addr:'Via Roma 3',tel:'',email:'',cf:''}; s.meta.title='Impianto Bruno'; s.lines=[{d:'Impianto elettrico',u:'cad',q:1,p:2400,s:0}]; T.touch(); T.saveQuote(true); });
await sinc(W); const id=await W.S(()=>window.IECI_T.S().qid);
const D=await apri(cD,'Android'); await aspetta(D,i=>window.IECI_T.DB().quotes.some(q=>q.id===i),id); await fermo(D);
ok(await netto(D,id)===2400&&suGH(id)===2400,'all\'inizio: Bruno a 2.400 € ovunque');
// Windows resta con Bruno APERTO e con l'orologio avanti di giorni, poi viene chiuso
await W.S(i=>{ const T=window.IECI_T, q=T.DB().quotes.find(x=>x.id===i); q.upd=Date.now()+5*864e5; T.dbSave(true); },id);
await W.p.waitForTimeout(1500); await W.p.close();
// 2. Android lo porta a 3.500 €
await prezzo(D,id,3500); await fermo(D); await sinc(D);
ok(suGH(id)===3500,'Android: Bruno a 3.500 €, salvato su GitHub');
// 3. Windows si riapre (preventivo vecchio aperto, orologio avanti): prima tornava a 2.400 € per tutti
W=await apri(cW,'Windows'); await fermo(W); await sinc(W); await W.p.waitForTimeout(800);
ok(await netto(W,id)===3500,'Windows riaperto: Bruno a 3.500 € (non torna a 2.400 €, anche con l\'orologio avanti)');
ok(await W.S(()=>window.IECI_T.S().lines[0].p)===3500,'…e anche il preventivo aperto sullo schermo è quello da 3.500 €');
await sinc(W); await sinc(D);
ok(suGH(id)===3500&&await netto(D,id)===3500,'su GitHub e su Android resta 3.500 €');
ok(await W.S(i=>{ const q=window.IECI_T.DB().quotes.find(x=>x.id===i); return !q.dsc&&!(q.alt||[]).length&&window.IECI_T.DB().quotes.length===1; },id),'nessuna copia, nessuna versione inutile: una riga sola');
// 4. stesso preventivo cambiato davvero su tutti e due (senza rete): nessuno sovrascrive l'altro
RETE.giu=true;
await prezzo(W,id,3600); await prezzo(D,id,3700); await W.p.waitForTimeout(500);
RETE.giu=false;
await sinc(D); await sinc(W); await sinc(D); await sinc(W);
const st=async d=>d.S(i=>{ const T=window.IECI_T, q=T.DB().quotes.find(x=>x.id===i); return {n:T.DB().quotes.length,p:q.data.lines[0].p,dsc:!!q.dsc,alt:(q.alt||[]).map(v=>v.data.lines[0].p)}; },id);
let sw=await st(W), sd=await st(D); console.log('     Windows '+JSON.stringify(sw)+' · Android '+JSON.stringify(sd));
ok(sw.n===1&&sd.n===1&&!G.archivio().db.quotes.some(q=>q.conf)&&G.archivio().db.quotes.length===1,'cambiato su tutti e due: resta UN preventivo (nessuna copia)');
ok(sw.p===sd.p&&[sw.p].concat(sw.alt).includes(3600)&&[sw.p].concat(sw.alt).includes(3700)&&[sd.p].concat(sd.alt).includes(3600)&&[sd.p].concat(sd.alt).includes(3700),'dentro ci sono tutte e due le versioni (3.600 e 3.700), uguali su Windows e Android');
ok(sw.alt.length===1&&sd.alt.length===1,'nessun doppione tra le versioni: quella in uso + UNA da scegliere');
ok(sw.dsc&&sd.dsc,'segnato «da scegliere» su tutti e due');
await W.S(()=>window.IECI_T.showPanel('salva')); await W.p.waitForTimeout(400);
ok(await W.S(()=>/Da scegliere/.test(document.getElementById('q-list').textContent)&&!!document.querySelector('#q-list details.qver-d[open] [data-qvk]')),'in Archivio: «⚠ Da scegliere», con «Tieni questa» e «Usa questa» già aperti');
ok(await W.S(()=>window.IECI_T.tr.problemi().some(x=>/Bruno/.test(x.t)&&/scegli/.test(x.t))),'e l\'avviso compare anche in «Oggi»');
// scelgo la 3.700 su Windows con «Usa questa» (se quella in uso è la 3.600) o «Tieni questa» (se è già la 3.700)
if(sw.p===3700) await W.S(i=>window.IECI_T.base.tieni(i),id);
else { const vid=await W.S(i=>window.IECI_T.DB().quotes.find(x=>x.id===i).alt.find(v=>v.data.lines[0].p===3700).id,id); await A.mostra(W.p,'[data-qvu="'+id+':'+vid+'"]'); await W.p.click('[data-qvu="'+id+':'+vid+'"]'); }
await W.p.waitForTimeout(400); await fermo(W); await sinc(W); await sinc(D);
sw=await st(W); sd=await st(D);
ok(sw.p===3700&&sd.p===3700&&!sw.dsc&&!sd.dsc&&suGH(id)===3700,'scelta la 3.700: vale su Windows, Android e GitHub, e non è più «da scegliere»');
// 5. editor rimasto dalla versione di prima dell'app, diverso dall'archivio: non viene salvato sopra
await W.S(i=>{ const T=window.IECI_T; if(T.S().qid!==i) T.openQuote(i); T.base.edVia(); const s=T.S(); s.lines[0].p=2400; T.touch(); },id);
await W.S(()=>window.IECI_T.saveQuote(true)); await W.p.waitForTimeout(400);
sw=await st(W);
ok(sw.p===3700&&sw.alt.includes(2400)&&sw.dsc,'preventivo vecchio rimasto aperto (app di prima): l\'archivio resta 3.700, il 2.400 diventa una versione da scegliere, non vince');
ok(await W.S(()=>window.IECI_T.S().lines[0].p)===3700,'…e sullo schermo torna quello dell\'archivio');
await W.S(i=>window.IECI_T.base.tieni(i),id); await fermo(W); await sinc(W); await sinc(D);
// 6. «Dov'è il mio preventivo?» ritrova una versione diversa nelle copie dei giorni passati
{ const o=G.grezzo(); const q=JSON.parse(JSON.stringify(o.db.quotes.find(x=>x.id===id))); q.data.lines[0].p=3500; q.tot=4270; q.alt=[]; delete q.dsc; o.db.quotes=[q];
  G.stato.files['copie/2026-11-22.json']={sha:'s'+(++G.stato.n),b64:Buffer.from(JSON.stringify(o)).toString('base64')}; }
await W.S(()=>window.IECI_T.tr.cerca('bruno'));
await aspetta(W,()=>/Ricerca finita/.test(document.getElementById('tr-st').textContent),null,25000);
const rv=await W.S(()=>window.IECI_T.tr.ris()); console.log('     '+JSON.stringify(rv.map(x=>x.dove)));
const iv=rv.findIndex(x=>/22\/11\/2026/.test(x.dove)&&/versione diversa/.test(x.dove)&&x.az==='Mettila tra le versioni');
ok(rv.length&&/È qui/.test(rv[0].dove)&&iv>-1,'cerco «bruno»: «È qui» + «nella copia del 22/11/2026: una versione diversa da quella in uso»');
await W.S(i=>window.IECI_T.tr.fai(i),iv); await W.p.waitForTimeout(400);
sw=await st(W);
ok(sw.p===3700&&sw.alt.includes(3500)&&sw.dsc,'«Mettila tra le versioni»: la 3.500 è dentro Bruno, da scegliere (niente copie)');
// 7. primo avvio con questa versione (nessuna base comune ancora) e un preventivo diverso da GitHub: non decide l'app
await W.S(i=>window.IECI_T.base.tieni(i),id); await fermo(W); await sinc(W); await sinc(D);
await W.S(i=>{ const T=window.IECI_T, DB=T.DB(), q=DB.quotes.find(x=>x.id===i); if(T.S().qid===i){ document.getElementById('qb-new').click(); } DB.qb={}; q.data.lines[0].p=1111; q.upd=Date.now()-864e5; delete (T.GH().qmod||{})[i]; T.dbSave(true); },id);
await sinc(W); sw=await st(W);
ok(sw.p===3700&&sw.alt.includes(1111)&&sw.dsc&&suGH(id)===3700,'prima volta, preventivo diverso da GitHub: tenuti tutti e due, «da scegliere» (nessuno sovrascritto)');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
