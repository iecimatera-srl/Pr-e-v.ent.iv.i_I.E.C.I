// Foto su GitHub come file separati: archivio leggero, ogni foto caricata una volta sola, il telefono scarica solo
// quelle che non ha; compatibile con l'archivio vecchio (foto dentro il file); se una foto non arriva non si tocca nulla
const A=require('./_amb.cjs'); const G=require('./_github_finto.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch(); const errs=[];
async function disp(nome,vp){ const ctx=await b.newContext({viewport:vp}); await G.finto(ctx); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(nome+': '+e.message)); p.on('dialog',d=>d.accept()); await p.goto(A.SA); await p.waitForTimeout(1500); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.ghSync&&window.IECI_T.DB,null,{timeout:30000}); await p.waitForFunction(()=>!window.IECI_T.ghBusy()); await p.waitForTimeout(1500); await p.waitForFunction(()=>!window.IECI_T.ghBusy(),null,{timeout:30000}); return p; }
async function sinc(p){ await p.waitForFunction(()=>!window.IECI_T.ghBusy()); await p.evaluate(()=>window.IECI_T.ghSync(false)); await p.waitForTimeout(150); await p.waitForFunction(()=>!window.IECI_T.ghBusy(),null,{timeout:60000}); await p.waitForTimeout(300); return p.evaluate(()=>document.getElementById('gh-state').textContent); }
const W=await disp('Windows',{width:1366,height:900});
// preventivo ricco: 12 prodotti × 3 foto diverse (con l'originale accanto), e la libreria che le ripete
await W.evaluate(()=>{ const T=window.IECI_T, s=T.S(); s.client.name='Condominio Via Roma'; s.lines=[]; s.products=[];
  const foto=(k)=>{ const c=document.createElement('canvas'); c.width=900; c.height=700; const x=c.getContext('2d'); for(let i=0;i<60;i++){ x.fillStyle='hsl('+((k*37+i*11)%360)+',70%,'+(30+i%40)+'%)'; x.fillRect((i*53+k*7)%900,(i*31+k*13)%700,120,90); } return c.toDataURL('image/jpeg',.85); };
  for(let i=1;i<=12;i++){ const f=[foto(i*3),foto(i*3+1),foto(i*3+2)]; s.lines.push({d:'Prodotto '+i,u:'cad',q:1,p:100,s:0}); s.products.push({id:'p'+i,name:'Prodotto '+i,brand:'Vimar',code:'',desc:'',specs:'',link:'',tags:'',photos:f,po:f.slice()}); }
  T.renderAll(); T.saveQuote(false); });
const pesoInLinea=await W.evaluate(()=>JSON.stringify({q:window.IECI_T.DB().quotes,p:window.IECI_T.DB().prods}).length);
const p0=G.stato.put; let msg=await sinc(W);
const raw=G.grezzo(), nf=Object.keys(G.stato.files).filter(k=>k.startsWith('foto/')).length, txt=JSON.stringify(raw);
console.log('in linea',Math.round(pesoInLinea/1024),'KB → archivio',Math.round(txt.length/1024),'KB,',nf,'file di foto');
const extra=Object.keys(G.stato.files).filter(k=>k.startsWith('foto/')).filter(k=>!JSON.stringify(raw.db.quotes.map(q=>q.data.products)).includes('ghf:'+k.slice(5).replace(/\.\w+$/,''))).length;
ok(nf-extra===36,'36 foto diverse → 36 file nella cartella «foto/» (ognuna una volta sola, anche se ripetuta in preventivo, originali e libreria)'+(extra?' + '+extra+' immagine della ditta':''));
ok(txt.length<300*1024&&!/data:image\/[a-z]+;base64,.{1500}/.test(txt),'il file dell\'archivio resta leggero ('+Math.round(txt.length/1024)+' KB invece di '+Math.round(pesoInLinea/1024)+' KB) e senza foto dentro');
ok(new RegExp(nf+' foto come file a parte').test(msg),'il messaggio lo dice: «'+msg.slice(0,140)+'»');
const p1=G.stato.put; await sinc(W);
ok(G.stato.put===p1+1,'sincronizzando di nuovo senza cambiare nulla non ricarica nessuna foto (solo l\'archivio)');
// telefono nuovo: scarica tutto, poi solo quello che manca
const T=await disp('Android',{width:390,height:844});
const g0=G.stato.get; await sinc(T);
let st=await T.evaluate(()=>{ const q=window.IECI_T.DB().quotes.find(x=>x.client==='Condominio Via Roma'); return {n:q?q.data.products.reduce((a,p)=>a+p.photos.filter(f=>f.startsWith('data:image/jpeg')).length,0):0,ref:JSON.stringify(window.IECI_T.DB()).indexOf('ghf:')}; });
ok(st.n===36&&st.ref<0,'il telefono riceve il preventivo con tutte le 36 foto vere (nessun riferimento rimasto)');
const g1=G.stato.get; await sinc(T);
ok(G.stato.get-g1<=2,'alla sincronizzazione dopo il telefono non riscarica le foto ('+(G.stato.get-g1)+' richieste)');
const qid=await T.evaluate(()=>window.IECI_T.DB().quotes.find(x=>x.client==='Condominio Via Roma').id);
await T.evaluate(id=>window.IECI_T.openQuote(id),qid); await T.waitForTimeout(2500);
ok(await T.evaluate(()=>{ const im=[...document.querySelectorAll('#doc img')].filter(i=>i.naturalWidth>0); return im.length>=12; }),'nel fascicolo del telefono le foto si vedono');
// una foto nuova aggiunta sul telefono: va su GitHub come file e arriva al computer
const nuova=await T.evaluate(()=>{ const c=document.createElement('canvas'); c.width=500; c.height=400; const x=c.getContext('2d'); x.fillStyle='#0a6'; x.fillRect(0,0,500,400); x.fillStyle='#fff'; x.fillRect(50,50,200,100); return c.toDataURL('image/png'); });
await T.waitForTimeout(1100);
await T.evaluate(f=>{ const s=window.IECI_T.S(); s.products[0].photos.push(f); window.IECI_T.touch(); window.IECI_T.saveQuote(false); },nuova);
const fprima=Object.keys(G.stato.files).filter(k=>k.startsWith('foto/')).length;
await sinc(T);
ok(Object.keys(G.stato.files).filter(k=>k.startsWith('foto/')).length===fprima+1&&Object.keys(G.stato.files).some(k=>/^foto\/.+\.png$/.test(k)),'la foto nuova (PNG) del telefono va su GitHub come file .png');
await sinc(W);
ok(await W.evaluate(id=>window.IECI_T.DB().quotes.find(x=>x.id===id).data.products[0].photos.length===4,qid),'e il computer la riceve');
// archivio scritto da una versione vecchia (foto dentro il file): si legge e si converte
const vecchio=G.archivio(); delete vecchio.foto; vecchio.v=2; G.scrivi(vecchio);
const N=await disp('Tablet',{width:800,height:1000}); await sinc(N);
ok(await N.evaluate(()=>{ const q=window.IECI_T.DB().quotes.find(x=>x.client==='Condominio Via Roma'); return !!q&&q.data.products[0].photos.length===4&&q.data.products[0].photos.every(f=>f.startsWith('data:image/')); }),'un archivio vecchio con le foto dentro il file si legge come prima');
ok(!/data:image\/[a-z]+;base64,.{1500}/.test(JSON.stringify(G.grezzo())),'e alla prima sincronizzazione viene alleggerito');
// riferimenti senza tipo (versione intermedia): il formato si trova da solo
const r2=G.grezzo(); delete r2.foto; G.stato.files[G.FILE]={sha:'s'+(++G.stato.n),b64:Buffer.from(JSON.stringify(r2)).toString('base64')};
const M=await disp('Telefono2',{width:390,height:844}); await sinc(M);
ok(await M.evaluate(()=>{ const q=window.IECI_T.DB().quotes.find(x=>x.client==='Condominio Via Roma'); return !!q&&q.data.products[0].photos.length===4&&q.data.products[0].photos.some(f=>f.startsWith('data:image/png'))&&JSON.stringify(window.IECI_T.DB()).indexOf('ghf:')<0; }),'anche senza l\'elenco dei tipi le foto (JPEG e PNG) arrivano giuste');
// una foto che non si riesce a scaricare: non si unisce niente, i dati restano intatti
const cr=G.grezzo().db.quotes.find(x=>x.client==='Condominio Via Roma').data.products[1].photos[0].slice(4); const rotta=Object.keys(G.stato.files).find(k=>k.startsWith('foto/'+cr+'.')); G.stato.rotte.add(rotta);
const R=await disp('Telefono3',{width:390,height:844}); msg=await sinc(R);
st=await R.evaluate(()=>({ref:JSON.stringify(window.IECI_T.DB()).indexOf('ghf:'),q:window.IECI_T.DB().quotes.filter(x=>x.client==='Condominio Via Roma').length}));
ok(st.ref<0&&st.q===0&&/Non sono riuscito a scaricare 1 foto/.test(msg),'foto non scaricabile: niente di rotto sul dispositivo e un messaggio chiaro («'+msg.slice(0,70)+'…»)');
G.stato.rotte.clear(); await sinc(R);
ok(await R.evaluate(()=>window.IECI_T.DB().quotes.some(x=>x.client==='Condominio Via Roma')),'alla sincronizzazione dopo arriva tutto');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
