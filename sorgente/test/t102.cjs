// Controllo foto dei preventivi: trova i preventivi con schede senza foto o con foto in arrivo e le recupera
// dalla libreria, dalle copie di sicurezza del dispositivo e dalle versioni precedenti dell'archivio su GitHub
const A=require('./_amb.cjs'); const G=require('./_github_finto.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch(); const errs=[];
const ctx=await b.newContext({viewport:{width:1366,height:900}}); await G.finto(ctx); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>d.accept());
await p.goto(A.SA); await p.waitForTimeout(1500); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.cfRecupera,null,{timeout:30000});
const attesa=async()=>{ await p.waitForTimeout(500); await p.waitForFunction(()=>!window.IECI_T.ghBusy()&&!window.IECI_T.CF.busy,null,{timeout:90000}); await p.waitForTimeout(300); };
await attesa();
const S=(f,a)=>p.evaluate(f,a);
// tre preventivi con foto, sincronizzati (le versioni restano nella cronologia di GitHub)
await S(()=>{ const T=window.IECI_T; const f=(k)=>{ const c=document.createElement('canvas'); c.width=500; c.height=380; const x=c.getContext('2d'); x.fillStyle='hsl('+k*47+',60%,45%)'; x.fillRect(0,0,500,380); x.fillStyle='#fff'; x.fillRect(40+k*9,60,180,120); return c.toDataURL('image/jpeg',.85); };
  const mk=(id,cli,prod)=>{ const s=T.S(); s.qid=''; s.client.name=cli; s.meta.num='2026/'+id; s.lines=prod.map(n=>({d:n,u:'cad',q:1,p:100,s:0})); s.products=prod.map((n,i)=>({id:id+i,name:n,brand:'',code:'',desc:'',specs:'',link:'',tags:'',photos:[f(id.length*10+i),f(id.length*10+i+5)],po:['','']})); T.renderAll(); T.saveQuote(false); };
  mk('a','Penultimo Rossi',['Quadro 12 moduli','Differenziale 30 mA','Presa schuko']); mk('bb','Ultimo Bianchi',['Videocitofono','Placca']); mk('ccc','Vecchio Verdi',['Lampada']); });
await S(()=>window.IECI_T.ghSync(false)); await attesa();
// la sciagura: il penultimo perde le foto su questo dispositivo e su GitHub (una sincronizzazione sbagliata)
await S(()=>{ const T=window.IECI_T, q=T.DB().quotes.find(x=>x.client==='Penultimo Rossi'); q.data.products.forEach(p=>{ p.photos=[]; p.po=[]; p.phu=Date.now(); p.phs=''; }); q.upd=Date.now(); T.DB().prods.forEach(p=>{ if(/Quadro 12|Differenziale 30|Presa schuko/.test(p.name)){ p.photos=[]; p.po=[]; p.phu=Date.now(); } }); });
await S(()=>window.IECI_T.ghSync(false)); await attesa();
ok(G.archivio().db.quotes.find(x=>x.client==='Penultimo Rossi').data.products.every(p=>!p.photos.length),'situazione: il penultimo non ha più le foto, né qui né su GitHub');
// il controllo
await S(()=>window.IECI_T.showPanel('salva')); await p.click('#cf-go'); await p.waitForTimeout(300);
let st=await S(()=>({r:[...document.querySelectorAll('#cf-list .cf-r')].map(r=>r.innerText.replace(/\n/g,' | ')),fix:!document.getElementById('cf-fix').hidden,st:document.getElementById('cf-st').textContent}));
console.log(JSON.stringify(st.r));
ok(st.r.some(x=>/Penultimo Rossi.*0\/3 con foto.*3 senza foto/.test(x))&&st.r.some(x=>/Ultimo Bianchi.*2\/2 con foto/.test(x))&&st.fix,'il controllo mostra il penultimo con 3 schede senza foto e gli altri a posto');
await p.click('#cf-fix'); await attesa(); await p.waitForTimeout(1500); await attesa();
st=await S(()=>({q:window.IECI_T.DB().quotes.find(x=>x.client==='Penultimo Rossi').data.products.map(p=>p.photos.filter(f=>f.startsWith('data:image/jpeg')).length).join(),msg:document.getElementById('cf-st').textContent}));
console.log(st.msg);
ok(st.q==='2,2,2','recuperate le foto del penultimo (2 per scheda) dalle versioni precedenti');
ok(/Recuperate 3 schede/.test(st.msg),'il messaggio dice cosa ha recuperato');
await p.waitForTimeout(1500); await attesa();
ok(G.archivio().db.quotes.find(x=>x.client==='Penultimo Rossi').data.products.every(p=>p.photos.length===2),'e le foto tornano anche su GitHub, quindi su tutti i dispositivi');
// apertura del preventivo: le foto si vedono nel fascicolo
const id=await S(()=>window.IECI_T.DB().quotes.find(x=>x.client==='Penultimo Rossi').id);
await S(i=>window.IECI_T.openQuote(i),id); await p.waitForTimeout(2500);
ok(await S(()=>[...document.querySelectorAll('#doc img')].filter(i=>i.naturalWidth>50).length>=3),'aprendo il penultimo le foto si vedono');
// recupero dalla libreria e dalle copie di sicurezza, senza GitHub
await S(()=>{ const T=window.IECI_T, q=T.DB().quotes.find(x=>x.client==='Ultimo Bianchi'); q.data.products[0].photos=[]; q.data.products[0].po=[]; T.GH().on=false; T.showPanel('salva'); });
await p.click('#cf-go'); await p.waitForTimeout(200); await p.click('#cf-fix'); await attesa();
ok(await S(()=>window.IECI_T.DB().quotes.find(x=>x.client==='Ultimo Bianchi').data.products[0].photos.length===2),'senza GitHub le foto si recuperano dalla libreria prodotti');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
