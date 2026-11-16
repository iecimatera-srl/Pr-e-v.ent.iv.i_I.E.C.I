// Foto tra dispositivi (GitHub): un telefono con una copia vecchia senza foto non deve più cancellarle;
// le foto più recenti vincono anche nella libreria prodotti; le foto già perse ritornano dal dispositivo che le ha
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const G=require('./_github_finto.cjs'); const GHF=G.stato;
const finto=G.finto;
(async()=>{const b=await A.chromium.launch();
const errs=[];
async function dispositivo(nome,vp){ const ctx=await b.newContext({viewport:vp}); await finto(ctx); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(nome+': '+e.message)); p.on('dialog',d=>d.accept()); return {ctx,p,nome}; }
async function apri(D){ await D.p.goto(A.SA); await D.p.waitForTimeout(1500); await D.p.waitForFunction(()=>window.IECI_T&&window.IECI_T.ghSync&&window.IECI_T.DB,null,{timeout:30000}); await sinc(D); }
async function sinc(D){ await D.p.waitForFunction(()=>!window.IECI_T.ghBusy()); await D.p.evaluate(()=>window.IECI_T.ghSync(false)); await D.p.waitForTimeout(150); await D.p.waitForFunction(()=>!window.IECI_T.ghBusy(),null,{timeout:20000}); await D.p.waitForTimeout(400); }
const FOTO=async(D)=>D.p.evaluate(()=>{ const c=document.createElement('canvas'); c.width=320; c.height=240; const x=c.getContext('2d'); x.fillStyle='#d33'; x.fillRect(0,0,320,240); return c.toDataURL('image/jpeg',.8); });
const W=await dispositivo('Windows',{width:1366,height:900}), T=await dispositivo('Android',{width:390,height:844});
// 1. sul computer: preventivo senza foto, sincronizzato
await apri(W);
await W.p.evaluate(()=>{ const T=window.IECI_T, s=T.S(); s.client.name='Anna Bianchi'; s.lines=[{d:'Videocitofono Classe 300',u:'cad',q:1,p:450,s:0},{d:'Placca Axolute',u:'cad',q:2,p:30,s:0}]; s.products=[{id:'pv',name:'Videocitofono Classe 300',brand:'Bticino',code:'344682',desc:'',specs:'',link:'',tags:'',photos:[]},{id:'pp',name:'Placca Axolute',brand:'Bticino',code:'',desc:'',specs:'',link:'',tags:'',photos:[]}]; T.renderAll(); T.saveQuote(false); });
await sinc(W);
const qid=await W.p.evaluate(()=>window.IECI_T.S().qid);
// 2. il telefono si sincronizza e apre il preventivo (ancora senza foto)
await apri(T);
// il telefono ha impostazioni sue (qui un messaggio di accompagnamento diverso), come succede davvero
await T.p.evaluate(()=>{ const s=window.IECI_T.S(); s.msgs=JSON.parse(JSON.stringify(s.msgs||{})); s.msgs.wa='Messaggio scritto sul telefono'; window.IECI_T.touch(); });
await T.p.evaluate(id=>window.IECI_T.openQuote(id),qid); await T.p.waitForTimeout(800);
ok(await T.p.evaluate(()=>window.IECI_T.S().client.name==='Anna Bianchi'&&window.IECI_T.S().products.length===2),'il telefono ha il preventivo (senza foto, come sul computer in quel momento)');
// 3. sul computer aggiungo le foto e sincronizzo
const f1=await FOTO(W);
await W.p.waitForTimeout(1200);
await W.p.evaluate(f=>{ const T=window.IECI_T, s=T.S(); s.products[0].photos=[f,f]; s.products[0].po=['','']; s.products[1].photos=[f]; s.products[1].po=['']; T.touch(); T.saveQuote(false); },f1);
await sinc(W);
ok(G.archivio().db.quotes.find(q=>q.id===qid).data.products[0].photos.length===2,'su GitHub il preventivo ha le foto');
// 4. il telefono riapre l'app (con il preventivo vecchio aperto): prima le cancellava, ora le riceve
await T.p.reload(); await T.p.waitForTimeout(1500); await T.p.waitForFunction(()=>window.IECI_T&&window.IECI_T.ghSync); await T.p.waitForTimeout(2500); await sinc(T);
let st=await T.p.evaluate(id=>{ const T=window.IECI_T; return {aperto:T.S().products.map(p=>(p.photos||[]).length).join(),arch:T.DB().quotes.find(q=>q.id===id).data.products.map(p=>(p.photos||[]).length).join(),lib:T.DB().prods.filter(p=>/Videocitofono Classe 300|Placca Axolute/.test(p.name)).map(p=>(p.photos||[]).length).join()}; },qid);
ok(st.aperto==='2,1'&&st.arch==='2,1','sul telefono il preventivo ora mostra le foto (2 e 1) '+JSON.stringify(st));
ok(G.archivio().db.quotes.find(q=>q.id===qid).data.products.map(p=>(p.photos||[]).length).join()==='2,1','e su GitHub le foto restano');
ok(await T.p.evaluate(()=>{ const ims=[...document.querySelectorAll('#doc img')]; return ims.filter(i=>i.naturalWidth>0).length>=2; }),'nel fascicolo del telefono le foto si vedono');
// 5. la libreria del telefono: una scheda già esistente senza foto riceve le foto
ok(st.lib.split(',').every(n=>+n>0),'libreria prodotti del telefono: le schede che c\'erano già ricevono le foto ('+st.lib+')');
// 6. recupero: GitHub ha una versione più nuova senza foto (scritta da un telefono con la versione vecchia)
const o=G.archivio(); const q=o.db.quotes.find(x=>x.id===qid); q.upd=Date.now()+60000; q.data.products.forEach(p=>{ p.photos=[]; p.po=[]; delete p.phu; delete p.phs; }); o.db.prods.forEach(p=>{ p.photos=[]; delete p.phu; delete p.phs; }); G.scrivi(o);
await sinc(W);
st=await W.p.evaluate(id=>window.IECI_T.DB().quotes.find(q=>q.id===id).data.products.map(p=>(p.photos||[]).length).join(),qid);
ok(st==='2,1'&&G.archivio().db.quotes.find(x=>x.id===qid).data.products.map(p=>(p.photos||[]).length).join()==='2,1','foto perse da una sincronizzazione vecchia: il computer che le ha le rimette su GitHub da solo');
await sinc(T);
ok(await T.p.evaluate(id=>window.IECI_T.DB().quotes.find(q=>q.id===id).data.products.map(p=>(p.photos||[]).length).join(),qid)==='2,1','e il telefono le riceve');
// 7. foto tolte apposta: la rimozione più recente vince (non tornano indietro)
await W.p.waitForTimeout(1100);
await W.p.evaluate(id=>{ const T=window.IECI_T; if(T.S().qid!==id) T.openQuote(id); const s=T.S(); s.products[1].photos=[]; s.products[1].po=[]; T.touch(); T.saveQuote(false); },qid);
await sinc(W); await sinc(T);
ok(await T.p.evaluate(id=>window.IECI_T.DB().quotes.find(q=>q.id===id).data.products.map(p=>(p.photos||[]).length).join(),qid)==='2,0','una foto tolta apposta sul computer resta tolta anche sul telefono');
// 8. aprire un preventivo senza toccarlo non lo rende «più recente»
const u0=await T.p.evaluate(id=>window.IECI_T.DB().quotes.find(q=>q.id===id).upd,qid);
await T.p.evaluate(id=>window.IECI_T.openQuote(id),qid); await T.p.waitForTimeout(500); await T.p.evaluate(()=>window.IECI_T.saveQuote(true)); await T.p.waitForTimeout(300);
ok(await T.p.evaluate(id=>window.IECI_T.DB().quotes.find(q=>q.id===id).upd,qid)===u0,'aprire un preventivo senza cambiarlo non lo segna come modificato');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
