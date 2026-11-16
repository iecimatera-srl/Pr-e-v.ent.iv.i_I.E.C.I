// Preventivo fatto sul telefono e aperto sul computer, dopo che una versione vecchia dell'app aveva lasciato
// sul computer le foto come riferimenti «ghf:»: all'avvio e alla sincronizzazione le foto tornano da sole;
// nel frattempo al posto di un'immagine rotta c'è «foto in arrivo da GitHub»
const A=require('./_amb.cjs'); const G=require('./_github_finto.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch(); const errs=[];
async function disp(nome,vp,auto){ const ctx=await b.newContext({viewport:vp}); await G.finto(ctx); if(auto===false) await ctx.addInitScript(()=>{ try{ const o=JSON.parse(localStorage.getItem('ieci-gh')); o.auto=false; localStorage.setItem('ieci-gh',JSON.stringify(o)); }catch(e){} }); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(nome+': '+e.message)); p.on('dialog',d=>d.accept()); await p.goto(A.SA); await p.waitForTimeout(1500); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.ghSync&&window.IECI_T.DB,null,{timeout:30000}); await attesa(p); return {p,ctx}; }
async function attesa(p){ await p.waitForTimeout(800); await p.waitForFunction(()=>!window.IECI_T.ghBusy(),null,{timeout:60000}); await p.waitForTimeout(400); }
async function sinc(p){ await p.waitForFunction(()=>!window.IECI_T.ghBusy()); await p.evaluate(()=>window.IECI_T.ghSync(false)); await attesa(p); }
// 1. sul telefono: preventivo con 4 foto, sincronizzato (le foto vanno su GitHub come file)
const T=await disp('Android',{width:390,height:844});
await T.p.evaluate(()=>{ const X=window.IECI_T, s=X.S(); s.client.name='Luca Verdi'; s.lines=[{d:'Termostato Wi-Fi',u:'cad',q:1,p:210,s:0},{d:'Presa USB',u:'cad',q:3,p:35,s:0}];
  const f=(k)=>{ const c=document.createElement('canvas'); c.width=600; c.height=450; const x=c.getContext('2d'); x.fillStyle='hsl('+k*70+',60%,45%)'; x.fillRect(0,0,600,450); x.fillStyle='#fff'; x.fillRect(80+k*20,80,200,150); return c.toDataURL('image/jpeg',.85); };
  s.products=[{id:'t1',name:'Termostato Wi-Fi',brand:'Bticino',code:'',desc:'',specs:'',link:'',tags:'',photos:[f(1),f(2)],po:['','']},{id:'t2',name:'Presa USB',brand:'Vimar',code:'',desc:'',specs:'',link:'',tags:'',photos:[f(3),f(4)],po:['','']}];
  X.renderAll(); X.saveQuote(false); });
await sinc(T.p);
const qid=await T.p.evaluate(()=>window.IECI_T.S().qid);
// 2. sul computer c'era una versione vecchia: ha preso l'archivio con i riferimenti senza saperli scaricare
const raw=G.grezzo();
const W=await disp('Windows',{width:1366,height:900},false);
await W.p.evaluate(r=>{ const X=window.IECI_T, D=X.DB(); D.quotes.length=0; r.db.quotes.forEach(q=>D.quotes.push(q)); r.db.prods.forEach(p=>D.prods.push(p)); },raw);
await W.p.evaluate(id=>window.IECI_T.openQuote(id),qid); await W.p.waitForTimeout(1500);
let st=await W.p.evaluate(()=>({ref:window.IECI_T.S().products.map(p=>p.photos.filter(f=>f.startsWith('ghf:')).length).join(),att:[...document.querySelectorAll('#doc img')].filter(i=>/foto%20in%20arrivo/.test(i.src)).length,rotte:[...document.querySelectorAll('#doc img')].filter(i=>i.complete&&i.naturalWidth===0).length}));
ok(st.ref==='2,2','situazione di partenza: sul computer le foto sono riferimenti (come le lasciava la versione vecchia)');
ok(st.att>=2&&st.rotte===0,'nel frattempo al posto delle immagini rotte c\'è «foto in arrivo da GitHub» ('+st.att+')');
// 3. aggiornata l'app sul computer: al riavvio (anche senza sincronizzazione automatica) le foto tornano
await W.p.reload(); await W.p.waitForTimeout(1500); await W.p.waitForFunction(()=>window.IECI_T&&window.IECI_T.ghSync); await attesa(W.p); await W.p.waitForTimeout(1500); await attesa(W.p);
st=await W.p.evaluate(id=>{ const X=window.IECI_T; return {aperto:X.S().products.map(p=>p.photos.filter(f=>f.startsWith('data:image/jpeg')).length).join(),arch:X.DB().quotes.find(q=>q.id===id).data.products.map(p=>p.photos.filter(f=>f.startsWith('data:image/jpeg')).length).join(),lib:X.DB().prods.filter(p=>/Termostato|Presa USB/.test(p.name)).every(p=>(p.photos||[]).every(f=>f.startsWith('data:'))),ref:JSON.stringify(X.DB()).indexOf('"ghf:'),msg:document.getElementById('toast').innerText}; },qid);
ok(st.aperto==='2,2'&&st.arch==='2,2','riaprendo l\'app sul computer le foto tornano nel preventivo aperto e in archivio '+JSON.stringify(st));
await W.p.waitForTimeout(2500);
st=await W.p.evaluate(()=>{ const X=window.IECI_T; return {lib:X.DB().prods.filter(p=>/Termostato|Presa USB/.test(p.name)).every(p=>(p.photos||[]).every(f=>f.startsWith('data:image/jpeg'))),ref:JSON.stringify(X.DB()).indexOf('"ghf:')}; });
ok(st.lib&&st.ref<0,'anche nella libreria prodotti: nessun riferimento rimasto');
ok(await W.p.evaluate(()=>[...document.querySelectorAll('#doc img')].filter(i=>i.naturalWidth>50).length>=4),'nel fascicolo del computer le foto si vedono');
// 4. e il caso normale: un altro preventivo nuovo fatto sul telefono arriva al computer con le foto
await T.p.evaluate(()=>{ const X=window.IECI_T; X.newQuote&&X.newQuote(); const s=X.S(); s.client.name='Sara Neri'; s.lines=[{d:'Lampada a sospensione',u:'cad',q:2,p:120,s:0}]; const c=document.createElement('canvas'); c.width=640; c.height=480; c.getContext('2d').fillRect(0,0,640,480); s.products=[{id:'n1',name:'Lampada a sospensione',brand:'',code:'',desc:'',specs:'',link:'',tags:'',photos:[c.toDataURL('image/jpeg',.9)],po:['']}]; s.qid=''; X.saveQuote(false); });
await sinc(T.p); await sinc(W.p);
ok(await W.p.evaluate(()=>{ const q=window.IECI_T.DB().quotes.find(x=>x.client==='Sara Neri'); return !!q&&q.data.products[0].photos[0].startsWith('data:image/jpeg'); }),'un preventivo nuovo del telefono arriva sul computer con le foto');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
