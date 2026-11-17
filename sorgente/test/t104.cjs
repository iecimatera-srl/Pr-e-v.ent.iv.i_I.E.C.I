// Salvataggio continuo: Windows e Android sullo stesso archivio GitHub, senza premere niente.
// Arrivo automatico delle modifiche, nessun rimbalzo, conflitti senza perdite, offline, cestino condiviso,
// copia del giorno su GitHub, ritorno a una versione passata, modifiche fatte durante il salvataggio.
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
// 1. Windows scrive un preventivo nuovo e non preme niente
await W.S(()=>{ const s=window.IECI_T.S(); s.qid=''; s.client={name:'Rossi Bagno',addr:'Via Roma 1',tel:'',email:'',cf:''}; s.meta.title='Bagno Rossi'; s.lines=[{d:'Punto luce',u:'pt',q:4,p:40,s:0}]; window.IECI_T.touch(); });
let r=await aspetta(W,()=>window.IECI_T.DB().quotes.some(q=>q.client==='Rossi Bagno')&&document.getElementById('gh-chip').dataset.st==='ok',null,25000);
await fermo(W);
let o=G.archivio();
ok(r&&o&&o.db.quotes.some(q=>q.client==='Rossi Bagno'),'Windows: preventivo nuovo su GitHub da solo, senza premere niente');
ok(o&&o.disp&&Object.values(o.disp).some(d=>d.n==='Windows'),'l\'archivio sa quale dispositivo ha salvato (Windows)');
const oggi=(()=>{ const d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); })();
ok(!!G.stato.files['copie/'+oggi+'.json'],'copia del giorno su GitHub: copie/'+oggi+'.json');

// 2. Android si apre: trova tutto da solo
const D=await dispositivo('Android',true);
r=await aspetta(D,()=>window.IECI_T.DB().quotes.some(q=>q.client==='Rossi Bagno'));
ok(r,'Android: all\'apertura il preventivo di Windows è già lì');
await fermo(D);
const idQ=await D.S(()=>window.IECI_T.DB().quotes.find(q=>q.client==='Rossi Bagno').id);
// 3. Android lo modifica; Windows (aperto, senza toccare niente) riceve la modifica entro pochi secondi
await D.S(id=>{ window.IECI_T.openQuote(id); },idQ); await D.p.waitForTimeout(400);
await D.S(()=>{ const s=window.IECI_T.S(); s.lines[0].q=10; s.meta.title='Bagno Rossi rifatto'; window.IECI_T.touch(); });
r=await aspetta(W,id=>{ const q=window.IECI_T.DB().quotes.find(x=>x.id===id); return q&&/rifatto/.test(q.title||'')&&q.tot>0; },idQ,25000);
ok(r,'Windows: la modifica fatta su Android arriva da sola mentre l\'app è aperta');
await fermo(W); await fermo(D);
ok(await W.S(()=>document.getElementById('as-disp').textContent.includes('Android')&&document.getElementById('as-disp').textContent.includes('Windows')),'pannello: si vedono i due dispositivi collegati (Windows e Android)');
// 4. nessun rimbalzo: fermi, nessuno scrive su GitHub
let p0=G.stato.put; await W.p.waitForTimeout(6000);
ok(G.stato.put===p0,'tutti e due fermi per 6 secondi: nessun salvataggio inutile ('+(G.stato.put-p0)+')');
ok((G.stato.n304||0)>0,'i controlli «è cambiato qualcosa?» sono leggerissimi (risposte 304: '+(G.stato.n304||0)+')');

// 5. stesso preventivo cambiato su due dispositivi, uno senza rete: nessuna versione persa
D.st.giu=true;
await D.S(()=>{ const s=window.IECI_T.S(); s.meta.title='Versione Android'; s.lines[0].p=55; window.IECI_T.touch(); });
r=await aspetta(D,()=>document.getElementById('gh-chip').dataset.st==='net',null,20000);
ok(r,'Android senza rete: il comando in alto dice «Offline» (modifiche al sicuro sul telefono)');
ok(await aspetta(D,id=>JSON.stringify(window.IECI_T.DB().quotes.find(x=>x.id===id).data.meta).includes('Versione Android'),idQ,15000),'…e la modifica è salvata sul telefono');
await W.S(id=>{ window.IECI_T.openQuote(id); },idQ); await W.p.waitForTimeout(400);
await W.S(()=>{ const s=window.IECI_T.S(); s.meta.title='Versione Windows'; s.lines[0].p=60; window.IECI_T.touch(); });
await aspetta(W,()=>window.IECI_T.DB().quotes.some(q=>/Versione Windows/.test(q.title||'')),null,15000); await fermo(W);
ok(/Versione Windows/.test(JSON.stringify(G.grezzo().db.quotes)),'intanto Windows salva la sua versione su GitHub');
D.st.giu=false; await D.S(()=>window.dispatchEvent(new Event('online')));
r=await aspetta(D,()=>window.IECI_T.DB().quotes.some(q=>q.conf),null,25000); await fermo(D);
o=G.grezzo();
const tit=o.db.quotes.map(q=>q.title||'').join(' | ');
ok(r&&/Versione Android/.test(tit)&&/Versione Windows/.test(tit),'tornata la rete: su GitHub ci sono TUTTE E DUE le versioni ('+tit.replace(/Bagno Rossi rifatto/g,'').slice(0,120)+')');
ok(o.db.quotes.filter(q=>q.conf).length===1,'una sola copia segnata «versione di …», nessun doppione');
r=await aspetta(W,()=>window.IECI_T.DB().quotes.some(q=>q.conf),null,20000);
ok(r,'anche Windows riceve la copia dell\'altra versione da solo');
await W.S(()=>{ window.IECI_T.showPanel?window.IECI_T.showPanel('salva'):0; });
ok(await W.S(()=>!!document.querySelector('#q-list .qconf-b')||window.IECI_T.DB().quotes.some(q=>q.conf)),'nell\'archivio la copia è segnata «Versione di …»');
await fermo(W); await fermo(D);
p0=G.stato.put; await W.p.waitForTimeout(5000);
ok(G.stato.put===p0,'dopo il conflitto nessun rimbalzo ('+(G.stato.put-p0)+')');

// 6. modifiche fatte MENTRE si sta salvando: non si perdono
W.st.lento=2500;
await W.S(()=>{ const s=window.IECI_T.S(); s.meta.title='Prima del salvataggio lento'; window.IECI_T.touch(); window.IECI_T.saveQuote(true); window.IECI_T.ghSync(false); });
await W.p.waitForTimeout(700);
await W.S(()=>{ const s=window.IECI_T.S(); s.meta.title='Scritto durante il salvataggio'; window.IECI_T.touch(); window.IECI_T.saveQuote(true); });
W.st.lento=0;
r=await aspetta(W,()=>false,null,1); // niente
await W.p.waitForTimeout(3500); await fermo(W);
ok(/Scritto durante il salvataggio/.test(JSON.stringify(G.grezzo().db.quotes)),'una modifica fatta mentre il salvataggio era in corso arriva comunque su GitHub');

// 7. cestino condiviso: eliminato su Windows, ripristinato da Android
const idC=await W.S(()=>window.IECI_T.DB().quotes.find(q=>q.conf).id);
await W.S(id=>{ const T=window.IECI_T, DB=T.DB(); DB.del[id]=Date.now(); DB.quotes.splice(DB.quotes.findIndex(q=>q.id===id),1); T.dbSave(); },idC);
await fermo(W);
r=await aspetta(D,id=>!window.IECI_T.DB().quotes.some(q=>q.id===id),idC,20000);
ok(r,'eliminato su Windows: sparisce anche da Android');
ok(await D.S(id=>window.IECI_T.auto.cest().some(e=>e.oid===id&&!e.r),idC),'…ma è nel cestino anche su Android');
ok(await D.S(()=>{ const t=document.getElementById('cs-list').textContent; return /Versione/.test(t)&&/Ripristina/.test(t); }),'il cestino lo mostra con «Ripristina»');
await D.S(id=>{ const e=window.IECI_T.auto.cest().find(x=>x.oid===id&&!x.r); window.IECI_T.auto.cestRipristina(e.id); },idC);
r=await aspetta(W,()=>window.IECI_T.DB().quotes.filter(q=>q.conf||/Versione/.test(q.title||'')).length>=2,null,25000);
ok(r,'ripristinato su Android: torna anche su Windows da solo');
await fermo(W); await fermo(D);

// 8. torna indietro nel tempo: dalla copia del giorno rimetto la versione di stamattina
const n0=await W.S(()=>window.IECI_T.DB().quotes.length);
// la copia del giorno «di stamattina», con il preventivo com'era all'inizio (indipendente dai tempi della prova)
{ const o=G.grezzo(); const q=o.db.quotes.find(x=>x.id===idQ); q.title='Bagno Rossi'; q.upd=1; if(q.data&&q.data.meta) q.data.meta.title='Bagno Rossi';
  G.stato.files['copie/'+oggi+'.json']={sha:'s'+(++G.stato.n),b64:Buffer.from(JSON.stringify(o)).toString('base64')}; }
await W.S(()=>window.IECI_T.auto.tempoFonti());
r=await aspetta(W,()=>/GitHub/.test(document.getElementById('tp-list').textContent),null,10000);
ok(r,'«Torna indietro nel tempo»: compare la copia del giorno di GitHub');
const iGh=await W.S(()=>{ const b=[...document.querySelectorAll('#tp-list [data-tpo]')]; const r=b.find(x=>/GitHub/.test(x.closest('.rowc').textContent)); return r?+r.getAttribute('data-tpo'):-1; });
await W.S(i=>window.IECI_T.auto.tempoApri(i),iGh);
r=await aspetta(W,()=>/diverso da adesso/.test(document.getElementById('tp-list').textContent),null,10000);
ok(r,'aperta la copia: il preventivo cambiato dopo è segnato «diverso da adesso»');
await W.S(id=>window.IECI_T.auto.tempoRipristina(id),idQ);
r=await aspetta(W,id=>{ const q=window.IECI_T.DB().quotes.find(x=>x.id===id); return q&&q.title==='Bagno Rossi'; },idQ,10000);
ok(r,'«Torna a questa»: il preventivo è com\'era nella copia');
ok(await W.S(id=>window.IECI_T.auto.cest().some(e=>e.oid===id&&e.v&&!e.r),idQ),'la versione di prima non si perde: è nel cestino come «versione sostituita»');
ok(await W.S(()=>window.IECI_T.DB().quotes.length)===n0,'nessun preventivo in più o in meno');
r=await aspetta(D,id=>{ const q=window.IECI_T.DB().quotes.find(x=>x.id===id); return q&&q.title==='Bagno Rossi'; },idQ,25000);
ok(r,'e anche Android torna alla versione rimessa, da solo');

// 9. registro attività
ok(await D.S(()=>{ const t=document.getElementById('as-log').textContent; return /Salvato su GitHub/.test(t)&&/due dispositivi/.test(t); }),'«Ultime attività»: salvataggi e conflitto risolto');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
