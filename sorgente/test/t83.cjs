// Libreria prodotti automatica: ogni scheda (a mano, dall'assistente, da un documento) si salva da sola con tutto;
// recupero dei prodotti dei preventivi già salvati; prodotto eliminato non torna; «Aggiungi al preventivo» con prezzo e foto
const A=require('./_amb.cjs'), path=require('path');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.DB,null,{timeout:20000}).catch(()=>{});await p.waitForTimeout(1500);
const S=(f,a)=>p.evaluate(f,a);
const lib=()=>S(()=>window.IECI_T.DB().prods.map(x=>({id:x.id,name:x.name,brand:x.brand,code:x.code,desc:x.desc,specs:x.specs,link:x.link,ph:(x.photos||[]).length,pdf:!!x.pdf,lp:x.lp,lu:x.lu,tags:x.tags})));
const foto=()=>{ const c=document.createElement('canvas'); c.width=c.height=60; const x=c.getContext('2d'); x.fillStyle='#c33'; x.fillRect(0,0,60,60); return c.toDataURL('image/jpeg',0.8); };

// 1. preventivi già salvati: i loro prodotti vengono recuperati nella libreria (una volta sola)
await S(f=>{ const D=window.IECI_T.DB(), s=JSON.parse(JSON.stringify(window.IECI_T.S())), ph=(new Function('return ('+f+')()'))();
  s.products=[{id:'pa',name:'Telecamera dome 4 MP',brand:'Hikvision',code:'DS-2CD2143G2-I',desc:'Telecamera da interno con visione notturna',specs:'Risoluzione: 4 MP\nIR: 30 m',link:'https://example.com/t',tags:'tvcc',photos:[ph],po:[''],pdf:{name:'scheda.pdf',data:'data:application/pdf;base64,JVBERi0xLjQK'},ps:50}];
  s.lines=[{d:'Telecamera dome 4 MP',u:'cad',q:4,p:147.42,s:0,pid:'pa'}];
  const s2=JSON.parse(JSON.stringify(s)); s2.products=[{id:'pb',name:'Placca 3 moduli Plana bianca',brand:'Vimar',code:'14653',desc:'',specs:'',link:'',tags:'',photos:[]}]; s2.lines=[{d:'Placca 3 moduli Plana bianca',u:'cad',q:10,p:3.25,s:0,pid:'pb'}];
  D.prods=[]; D.libMig=0; D.quotes=[{id:'qa',num:'2026/700',client:'Rossi',name:'Rossi',title:'',tot:1,upd:Date.now(),model:'vid',st:'bozza',data:s},{id:'qb',num:'2026/701',client:'Bianchi',name:'Bianchi',title:'',tot:1,upd:Date.now(),model:'dom',st:'bozza',data:s2}];
  window.IECI_T.idbFlush&&window.IECI_T.idbFlush(); },foto.toString());
await S(()=>window.IECI_T.libMigra());
let L=await lib();
const t=L.find(x=>x.name==='Telecamera dome 4 MP'), pl=L.find(x=>x.name==='Placca 3 moduli Plana bianca');
ok(t&&t.brand==='Hikvision'&&t.code==='DS-2CD2143G2-I'&&/visione notturna/.test(t.desc)&&/IR: 30 m/.test(t.specs)&&t.ph===1&&t.pdf&&t.link&&t.tags==='tvcc','dai preventivi salvati: prodotto recuperato con marca, codice, descrizione, caratteristiche, foto, PDF, link, etichette');
ok(t.lp===147.42&&t.lu==='cad'&&pl&&pl.lp===3.25,'con l\'ultimo prezzo usato');
const n1=L.length; await S(()=>window.IECI_T.libMigra()); ok((await lib()).length===n1,'il recupero si fa una volta sola');

// 2. prodotto nuovo creato a mano: si salva da solo con quello che scrivo
await S(()=>{ const s=window.IECI_T.S(); s.lines.push({d:'Rilevatore di fumo radio',u:'cad',q:2,p:65,s:0}); window.IECI_T.touch(); window.IECI_T.renderAll(); });
await A.mostra(p,'#lines'); await p.waitForTimeout(200);
await S(()=>{ const c=[...document.querySelectorAll('#lines [data-lmk]')].pop(); c.click(); }); await p.waitForTimeout(400);
await A.mostra(p,'#plist'); await p.waitForTimeout(300);
const pi=await S(()=>window.IECI_T.S().products.findIndex(x=>x.name==='Rilevatore di fumo radio'));
await S(pi=>{ const d=document.querySelector('#plist details[data-pid="'+window.IECI_T.S().products[pi].id+'"]'); if(d) d.open=true; },pi); await p.waitForTimeout(200);
await p.fill('#plist [data-pf="brand"][data-pi="'+pi+'"]','Ajax'); await p.fill('#plist [data-pf="desc"][data-pi="'+pi+'"]','Rilevatore di fumo senza fili con sirena integrata');
await p.setInputFiles('#plist [data-pphoto="'+pi+'"]',{name:'fumo.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC','base64')});
await p.waitForTimeout(3500);
L=await lib(); let f=L.find(x=>x.name==='Rilevatore di fumo radio');
ok(f&&f.brand==='Ajax'&&/sirena integrata/.test(f.desc)&&f.ph===1&&f.lp===65,'prodotto creato a mano: salvato da solo con marca, descrizione, foto e prezzo');
ok(await S(pi=>/Nella libreria prodotti/.test(document.querySelector('#plist [data-act="lib"][data-pi="'+pi+'"]').closest('.plib').innerText),pi),'sulla scheda si vede che è nella libreria');
// rinomino: si aggiorna la stessa voce di libreria, niente doppioni
await p.fill('#plist [data-pf="name"][data-pi="'+pi+'"]','Rilevatore di fumo radio Ajax FireProtect'); await p.waitForTimeout(3000);
L=await lib(); ok(L.filter(x=>/Rilevatore di fumo/.test(x.name)).length===1&&L.some(x=>x.name==='Rilevatore di fumo radio Ajax FireProtect'&&x.id===f.id),'rinominato: aggiornato lo stesso prodotto in libreria (nessun doppione)');

// 3. dall'assistente con un documento del fornitore: tutti i prodotti con foto e codice
await S(()=>{ const a=window.IECI_T.AS(); a.doc=null; a.res=null; }); await A.mostra(p,'#as-txt');
await p.setInputFiles('#as-doc',path.join(A.DATI,'documenti','fornitore-videosorveglianza.pdf'));
await p.waitForFunction(()=>window.IECI_T.AS().doc,null,{timeout:60000}); await p.click('#as-dok'); await p.waitForTimeout(3500);
L=await lib(); const hk=L.filter(x=>x.brand==='Hikvision');
ok(L.some(x=>x.code==='DS-7608NXI-K2/8P'&&x.ph===1&&x.lp>0)&&L.some(x=>x.code==='UPS-850'&&x.ph===1),'dall\'assistente: prodotti del fornitore in libreria con codice, foto e prezzo');
ok(!L.some(x=>/Installazione e puntamento/.test(x.name)),'la posa (servizio) non diventa un prodotto');
const dome=L.filter(x=>x.code==='DS-2CD2143G2-I');
ok(dome.length===1&&dome[0].pdf&&dome[0].ph===1&&/visione notturna/.test(dome[0].desc)===false||dome.length===1&&dome[0].pdf,'stesso codice già in libreria: un solo prodotto aggiornato (resta anche la scheda PDF di prima)');

// 4. elimino un prodotto dalla libreria: non torna da solo
const nvr=L.find(x=>x.code==='DS-7608NXI-K2/8P');
await S(()=>document.querySelector('.mit[data-p="archivio"]')?document.querySelector('.mit[data-p="archivio"]').click():0); await A.mostra(p,'#l-list');
await S(id=>{ const bt=document.querySelector('#l-list [data-lx="'+id+'"]'); bt.click(); bt.click(); },nvr.id); await p.waitForTimeout(300);
await S(()=>{ const s=window.IECI_T.S(); const pr=s.products.find(x=>x.code==='DS-7608NXI-K2/8P'); pr.desc='modificato'; window.IECI_T.touch(); }); await p.waitForTimeout(3000);
ok(!(await lib()).some(x=>x.code==='DS-7608NXI-K2/8P'),'eliminato dalla libreria: non viene risalvato da solo');

// 5. «Aggiungi al preventivo» dalla libreria: voce con prezzo e scheda con foto
await S(()=>{ window.IECI_T.S().lines=[]; window.IECI_T.S().products=[]; window.IECI_T.touch(); window.IECI_T.renderAll(); });
await S(id=>document.querySelector('#l-list [data-lu="'+id+'"]').click(),t.id); await p.waitForTimeout(400);
let st=await S(()=>{ const s=window.IECI_T.S(); return {l:s.lines.map(l=>[l.d,l.p,l.u]),p:s.products.map(x=>[x.name,(x.photos||[]).length,!!x.pdf,x.desc])}; });
ok(st.l.length===1&&st.l[0][1]===147.42&&st.p.length===1&&st.p[0][1]===1&&st.p[0][2]&&/visione notturna/.test(st.p[0][3]),'«Aggiungi al preventivo»: voce a 147,42 € e scheda con foto, PDF e descrizione');
await p.waitForTimeout(800); console.log(await S(()=>document.getElementById('doc').innerText.slice(0,600).replace(/\n+/g,' | ')));
ok(await S(n=>document.getElementById('doc').innerText.indexOf(n)>-1,st.l[0][0]),'il fascicolo mostra il prodotto');
// 6. dopo la riapertura c'è tutto
await p.waitForTimeout(1200); await p.reload(); await p.waitForTimeout(2500);
L=await lib(); console.log(JSON.stringify(L.map(x=>[x.name,x.ph,x.pdf,x.code])));
ok(L.some(x=>x.name==='Rilevatore di fumo radio Ajax FireProtect'&&x.ph===1)&&L.some(x=>x.code==='DS-2CD2143G2-I'&&x.pdf)&&!L.some(x=>x.code==='DS-7608NXI-K2/8P'),'riaprendo l\'app la libreria è com\'era');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
