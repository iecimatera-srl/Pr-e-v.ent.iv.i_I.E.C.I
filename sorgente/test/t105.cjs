// NIENTE SI PERDE tra dispositivi: un dispositivo «pieno» (ogni impostazione, immagini ovunque, archivio completo)
// e un dispositivo appena installato. Si confronta TUTTO, sezione per sezione, in più scenari:
// A) il nuovo si collega subito; B) il nuovo è stato toccato prima di collegarsi (nome ditta, colore…);
// C) dopo, ognuno cambia una sezione diversa: le modifiche si sommano, nessuna cancella l'altra;
// D) un dispositivo con le impostazioni di fabbrica non cancella mai quelle vere degli altri.
const A=require('./_amb.cjs');
const G=require('./_github_finto.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
function img(n,c){ const svg='<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120"><rect width="300" height="120" fill="'+c+'"/><text x="10" y="60">'+n+' '+'x'.repeat(1400)+'</text></svg>'; return 'data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'); }
const IM={logo:img('LOGO','#123'),stamp:img('TIMBRO','#234'),hager:img('HAGER','#e30613'),bt:img('BTICINO','#333'),work:img('LAVORO','#456'),ph1:img('FOTO1','#567'),ph2:img('FOTO2','#678'),art:img('ART','#789'),mem:img('VIMAR','#89a'),app:img('APP','#9ab'),prof:img('PROF','#abc')};
(async()=>{const b=await A.chromium.launch();
const errs=[];
async function dispositivo(nome,opz){
  opz=opz||{};
  const ctx=await b.newContext({viewport:{width:1280,height:900}});
  if(opz.scollegato) await ctx.addInitScript(()=>{ try{ if(!localStorage.getItem('ieci-gh')) localStorage.setItem('ieci-gh',JSON.stringify({repo:'iecimatera/preventivi-ieci-dati',token:'github_pat_prova',on:false})); }catch(e){} });
  await G.finto(ctx);
  await ctx.addInitScript(n=>{ window.IECI_AUTO={quiete:700,max:2500,poll:1500,ritorno:0}; try{ const g=JSON.parse(localStorage.getItem('ieci-gh')||'{}'); if(!g.nome){ g.nome=n; localStorage.setItem('ieci-gh',JSON.stringify(g)); } }catch(e){} },nome);
  const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(nome+': '+e.message)); p.on('dialog',d=>d.accept());
  await p.goto(A.SA); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S&&window.IECI_T.DB&&window.IECI_T.DB().quotes,null,{timeout:30000});
  if(!opz.scollegato) await p.waitForFunction(()=>document.getElementById('gh-chip').dataset.st==='ok',null,{timeout:20000}).catch(()=>{});
  return {ctx,p,S:(f,a)=>p.evaluate(f,a)};
}
const aspetta=(d,f,a,t)=>d.p.waitForFunction(f,a,{timeout:t||20000}).then(()=>true).catch(()=>false);
const fermo=async d=>{ await d.p.waitForTimeout(300); return aspetta(d,()=>document.getElementById('gh-chip').dataset.st==='ok'&&!window.IECI_T.ghBusy()&&!window.IECI_T.GH().dirty,null,30000); };
// fotografia di TUTTO ciò che deve essere uguale su tutti i dispositivi (le immagini ridotte a un'impronta)
function foto(){
  const T=window.IECI_T, S=T.S(), DB=T.DB();
  function imp(s){ let h=0; for(let i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))|0; } return 'IMG#'+(h>>>0).toString(36)+'/'+s.length; }
  function nor(x){ if(typeof x==='string'){ if(x.indexOf('data:image/')===0) return imp(x); if(x.indexOf('ghf:')===0) return 'RIF-NON-SCARICATO'; return x; } if(Array.isArray(x)) return x.map(nor); if(x&&typeof x==='object'){ const o={}; Object.keys(x).sort().forEach(k=>{ if(['upd','phu','phs','bu','dvn','conf'].indexOf(k)>-1) return; o[k]=nor(x[k]); }); return o; } return x; }
  const byId=a=>(a||[]).slice().sort((x,y)=>String(x.id||x.name).localeCompare(String(y.id||y.name)));
  const q=byId(DB.quotes).map(x=>{ const d=JSON.parse(JSON.stringify(x.data||{})); ['cat','cgroups','company','profile','trust','msgs','ccond','mtpl','mdef','qid'].forEach(k=>delete d[k]); return {id:x.id,num:x.num,st:x.st,name:x.name,title:x.title,client:x.client,tot:x.tot,data:d}; });
  const app={}; const AP=T.APP?T.APP():{}; Object.keys(AP).forEach(k=>{ if(k!=='view') app[k]=AP[k]; });
  return nor({company:S.company,profile:S.profile,trust:S.trust,cat:S.cat,cgroups:S.cgroups,ccond:S.ccond,mtpl:S.mtpl,mdef:S.mdef,msgs:S.msgs,menu:T.MENU?T.MENU():null,app:app,
    clients:byId(DB.clients).map(c=>({name:c.name,addr:c.addr,tel:c.tel,email:c.email,cf:c.cf})),prods:byId(DB.prods),quotes:q,arts:byId(DB.arts),logos:byId(DB.logos),parole:(DB.parole||[]).map(x=>x.m+'|'+x.k).sort()});
}
function confronta(a,b){ const diff=[]; Object.keys(a).forEach(k=>{ if(JSON.stringify(a[k])!==JSON.stringify(b[k])) diff.push(k); }); return diff; }
function dettaglio(a,b,k){ const x=JSON.stringify(a[k]), y=JSON.stringify(b[k]); let i=0; while(i<x.length&&x[i]===y[i]) i++; return k+': …'+x.slice(Math.max(0,i-60),i+80)+'  ≠  …'+y.slice(Math.max(0,i-60),i+80); }

// ===== dispositivo pieno: Windows di tutti i giorni =====
const W=await dispositivo('Windows');
await W.S(IM=>{
  const T=window.IECI_T, S=T.S(), DB=T.DB();
  S.company.name='IECI S.r.l. PROVA'; S.company.stamp=IM.stamp; S.company.tel='Tel. 333 0000000';
  S.style.logo=IM.logo; S.style.b1='#AA2200';
  S.profile.slogan='Slogan personale'; S.profile.photo=IM.prof;
  S.trust.bgroups[0].items=[{name:'Hager',img:IM.hager},{name:'BTicino',img:IM.bt}];
  S.trust.works=[{img:IM.work,t:'Villa al mare'}]; S.trust.rev=[{n:'Anna',t:'Bravissimi'}];
  S.cat.dom.push(['Voce mia personale','cad',99]);
  S.ccond={dom:{pay:'Pagamento mio'}};
  S.mtpl=S.mtpl.concat([{id:'mx',n:'Modello mio',wa:'Ciao {cliente}',subj:'Oggetto mio',body:'Corpo mio'}]); S.mdef='mx';
  S.msgs.body='Messaggio personalizzato';
  if(T.MENU){ const M=T.MENU(); M.names=M.names||{}; M.names.cliente='Clienti miei'; }
  if(T.APP){ const AP=T.APP(); AP.name='IECI Matera'; AP.col='#AA2200'; AP.greet='Buongiorno capo'; AP.logo=IM.app; }
  DB.clients.push({id:'c1',name:'Rossi Mario',addr:'Via 1',tel:'1',email:'',cf:''},{id:'c2',name:'Verdi Anna',addr:'Via 2',tel:'2',email:'',cf:''});
  DB.prods.push({id:'p1',name:'Differenziale 30 mA',brand:'Hager',code:'CDA',photos:[IM.ph1],po:[''],desc:'d',upd:Date.now()},{id:'p2',name:'Placca',brand:'BTicino',code:'PL',photos:[IM.ph2],po:[''],upd:Date.now()});
  DB.arts.push({id:'a1',d:'Cavo FG16',brand:'',code:'FG',u:'m',p:1.2,photos:[IM.art],upd:Date.now()});
  DB.logos=(DB.logos||[]).concat([{id:'l1',name:'Vimar',img:IM.mem,src:'',upd:Date.now()}]);
  DB.parole=(DB.parole||[]).concat([{id:'w1',m:'dom',k:'presa',v:'Punto presa 16A',upd:Date.now()}]);
  S.client={name:'Rossi Mario',addr:'Via 1',tel:'1',email:'',cf:''}; S.meta.title='Impianto Rossi';
  S.products=[{id:'x1',name:'Differenziale 30 mA',brand:'Hager',photos:[IM.ph1],po:['']}];
  S.qid=''; T.touch(); T.saveQuote(false);
  T.settingsStamp&&T.settingsStamp();
  if(T.menuSave) T.menuSave(); if(T.apStore) T.apStore();
  T.dbSave(); T.renderAll();
},IM);
await W.p.waitForTimeout(800);
await W.S(()=>window.IECI_T.ghSync(true)); await fermo(W);
const fW=await W.S(foto);
ok(/IMG#/.test(JSON.stringify(fW.trust))&&fW.quotes.length>=1,'Windows pieno: '+fW.quotes.length+' preventivi, '+fW.prods.length+' prodotti, marchi con logo, timbro, foto…');

// ===== A) dispositivo nuovo che si collega subito =====
const P=await dispositivo('Nuovo PC');
await fermo(P); await P.p.waitForTimeout(800);
await W.S(()=>window.IECI_T.ghSync(false)); await fermo(W);
const fW1=await W.S(foto); let fP=await P.S(foto), d=confronta(fW1,fP);
ok(confronta(fW,fW1).filter(k=>k!=='cgroups').length===0,'A) Windows dopo il collegamento del nuovo: niente cambiato');
ok(d.length===0,'A) nuovo dispositivo collegato subito: tutto uguale'+(d.length?' — DIVERSO: '+d.join(', '):''));
d.slice(0,6).forEach(k=>console.log('     '+dettaglio(fW1,fP,k).slice(0,330)));

// ===== B) dispositivo nuovo toccato PRIMA di collegarsi =====
const N=await dispositivo('Telefono nuovo',{scollegato:true});
await N.S(()=>{ const T=window.IECI_T, S=T.S(); S.style.b1='#00AA00'; S.company.tel='Tel. 999'; T.touch(); T.settingsStamp&&T.settingsStamp(); });
await N.p.waitForTimeout(6500); // salvataggio automatico locale
await N.S(()=>{ const T=window.IECI_T, S=T.S(); S.trust.qrTitle='Scrivimi'; T.touch(); T.settingsStamp&&T.settingsStamp(); });
await N.p.waitForTimeout(1500);
await N.S(()=>{ const g=window.IECI_T.GH(); g.on=true; window.IECI_T.ghSync(true); }); await fermo(N); await N.p.waitForTimeout(800);
const fN=await N.S(foto);
ok(/IMG#/.test(JSON.stringify(fN.trust.bgroups))&&JSON.stringify(fN.trust.bgroups)===JSON.stringify(fW.trust.bgroups),'B) nuovo dispositivo già toccato: i loghi dei marchi arrivano lo stesso');
ok(fN.company.stamp===fW.company.stamp&&fN.company.name===fW.company.name,'B) …e anche timbro e nome della ditta');
// e soprattutto: il dispositivo nuovo NON ha rovinato gli altri
await W.S(()=>window.IECI_T.ghSync(false)); await fermo(W); await W.p.waitForTimeout(500);
const fW2=await W.S(foto);
await N.S(()=>window.IECI_T.ghSync(false)); await fermo(N);
const fN2=await N.S(foto); d=confronta(fW2,fN2);
ok(d.length===0,'B) poi i due dispositivi sono identici in tutto (compreso il telefono 999 scelto sul nuovo)'+(d.length?' — DIVERSO: '+d.join(', '):''));
d.slice(0,6).forEach(k=>console.log('     '+dettaglio(fW2,fN2,k).slice(0,330)));
ok(fW2.company.tel==='Tel. 999','B) la modifica fatta sul nuovo (telefono) arriva anche a Windows');
ok(JSON.stringify(fW2.trust.bgroups)===JSON.stringify(fW.trust.bgroups)&&fW2.company.stamp===fW.company.stamp&&fW2.msgs.body===fW.msgs.body&&JSON.stringify(fW2.mtpl)===JSON.stringify(fW.mtpl)&&JSON.stringify(fW2.cat)===JSON.stringify(fW.cat),'B) Windows dopo: marchi, timbro, messaggi, modelli e listino intatti');

// ===== C) ognuno cambia una sezione diversa: si sommano =====
await W.S(()=>{ const T=window.IECI_T, S=T.S(); S.cat.dom.push(['Voce aggiunta su Windows','cad',10]); T.touch(); T.settingsStamp&&T.settingsStamp(); });
await P.S(()=>{ const T=window.IECI_T, S=T.S(); S.trust.bgroups[1].items=[{name:'Ajax',img:'data:image/png;base64,'+'A'.repeat(1800)}]; T.touch(); T.settingsStamp&&T.settingsStamp(); });
await W.p.waitForTimeout(1500); await W.S(()=>window.IECI_T.ghSync(false)); await fermo(W);
await P.S(()=>window.IECI_T.ghSync(false)); await fermo(P);
await W.S(()=>window.IECI_T.ghSync(false)); await fermo(W); await W.p.waitForTimeout(500);
const cW=await W.S(()=>({cat:JSON.stringify(window.IECI_T.S().cat.dom),tr:window.IECI_T.S().trust.bgroups.map(g=>g.items.map(i=>i.name).join('+')).join('|')}));
const cP=await P.S(()=>({cat:JSON.stringify(window.IECI_T.S().cat.dom),tr:window.IECI_T.S().trust.bgroups.map(g=>g.items.map(i=>i.name).join('+')).join('|')}));
ok(/Voce aggiunta su Windows/.test(cW.cat)&&/Ajax/.test(cW.tr)&&/Hager/.test(cW.tr),'C) Windows ha la sua voce di listino E il marchio aggiunto sull\'altro PC ('+cW.tr+')');
ok(/Voce aggiunta su Windows/.test(cP.cat)&&/Ajax/.test(cP.tr)&&/Hager/.test(cP.tr),'C) l\'altro PC ha il suo marchio E la voce di listino di Windows');

// ===== D) un dispositivo «di fabbrica» con data più recente non cancella niente =====
const F=await dispositivo('Fabbrica',{scollegato:true});
await F.S(()=>{ const T=window.IECI_T; T.DB().su=Date.now()+86400000; T.dbSave(true); });
await F.S(()=>{ const g=window.IECI_T.GH(); g.on=true; window.IECI_T.ghSync(true); }); await fermo(F);
await W.S(()=>window.IECI_T.ghSync(false)); await fermo(W); await W.p.waitForTimeout(500);
const fW3=await W.S(foto);
ok(/Hager/.test(JSON.stringify(fW3.trust))&&fW3.company.stamp===fW.company.stamp&&fW3.company.name===fW.company.name&&fW3.msgs.body===fW.msgs.body,'D) un dispositivo con le impostazioni di fabbrica non cancella ditta, marchi e messaggi degli altri');
const fF=await F.S(foto);
ok(/Hager/.test(JSON.stringify(fF.trust))&&fF.company.stamp===fW.company.stamp,'D) …anzi le riceve');

// ===== E) dati dell'archivio: tutto presente ovunque =====
const tutti=[fP,fN,fF].every(f=>f.quotes.length===fW3.quotes.length&&f.prods.length===fW3.prods.length&&f.clients.length===fW3.clients.length&&f.arts.length===fW3.arts.length&&f.logos.length===fW3.logos.length);
ok(tutti,'E) preventivi, prodotti, clienti, articoli e loghi ricordati: stessi numeri su tutti i dispositivi');
ok(![fP,fN,fF,fW3].some(f=>/RIF-NON-SCARICATO/.test(JSON.stringify(f))),'E) nessuna immagine rimasta «in arrivo» su nessun dispositivo');
// ===== F) cancellare apposta un marchio: sparisce ovunque e non ritorna =====
const giro=async()=>{ for(const x of [W,P,W,P]){ await x.S(()=>window.IECI_T.ghSync(false)); await fermo(x); } };
await giro();
await W.S(()=>{ const T=window.IECI_T, S=T.S(); S.trust.bgroups[0].items=S.trust.bgroups[0].items.filter(i=>i.name!=='BTicino'); T.touch(); T.settingsStamp(); });
await W.p.waitForTimeout(400); await giro(); await giro();
const tr=async x=>x.S(()=>window.IECI_T.S().trust.bgroups.map(g=>g.items.map(i=>i.name).join('+')).join('|'));
let tw=await tr(W), tp=await tr(P);
ok(!/BTicino/.test(tw)&&!/BTicino/.test(tp)&&/Hager/.test(tw)&&/Hager/.test(tp)&&/Ajax/.test(tp),'F) marchio tolto apposta su Windows: sparito anche sull\'altro PC e non ritorna; gli altri restano ('+tw+')');
// ===== G) modifica di un cliente: arriva sull'altro dispositivo =====
await P.S(()=>{ const T=window.IECI_T, c=T.DB().clients.find(x=>x.name==='Rossi Mario'); c.tel='347 1234567'; c.addr='Via Nuova 5'; T.dbSave(); });
await giro();
ok(await W.S(()=>{ const c=window.IECI_T.DB().clients.find(x=>x.name==='Rossi Mario'); return c&&c.tel==='347 1234567'&&c.addr==='Via Nuova 5'; }),'G) telefono e indirizzo di un cliente cambiati sull\'altro PC: arrivano su Windows');
// ===== H) modifica di una scheda della libreria prodotti =====
await W.S(()=>{ const T=window.IECI_T, p=T.DB().prods.find(x=>x.id==='p2'); p.desc='Descrizione riscritta su Windows'; p.specs='Bianca, 3 moduli'; T.dbSave(); });
await giro();
ok(await P.S(()=>{ const p=window.IECI_T.DB().prods.find(x=>x.id==='p2'); return p&&p.desc==='Descrizione riscritta su Windows'&&p.specs==='Bianca, 3 moduli'&&p.photos.length===1; }),'H) descrizione e caratteristiche di un prodotto cambiate su Windows: arrivano sull\'altro PC (con la foto)');
// ===== I) eliminato su un dispositivo mentre l'altro lo modificava: il lavoro più recente resta =====
await W.S(()=>{ const T=window.IECI_T, DB=T.DB(), c=DB.clients.find(x=>x.name==='Verdi Anna'); DB.del[c.id]=Date.now(); DB.clients.splice(DB.clients.indexOf(c),1); T.dbSave(); });
await P.p.waitForTimeout(30);
await P.S(()=>{ const T=window.IECI_T, c=T.DB().clients.find(x=>x.name==='Verdi Anna'); c.addr='Via aggiornata dopo'; T.dbSave(); });
await giro();
ok(await W.S(()=>{ const c=window.IECI_T.DB().clients.find(x=>x.name==='Verdi Anna'); return !!c&&c.addr==='Via aggiornata dopo'; })&&await P.S(()=>!!window.IECI_T.DB().clients.find(x=>x.name==='Verdi Anna')),'I) cliente eliminato su Windows ma modificato DOPO sull\'altro PC: resta, con la modifica');
// ===== J) ripristino da una copia di sicurezza: la sincronizzazione non lo annulla =====
const idQ=await W.S(()=>window.IECI_T.DB().quotes[0].id);
await W.S(()=>new Promise(r=>window.IECI_T.snapSave?window.IECI_T.snapSave('prova',r):r()));
// eliminato dall'archivio come fa una persona (è anche il preventivo aperto): due tocchi sulla ×
await A.mostra(W.p,'[data-qx="'+idQ+'"]'); await W.p.waitForTimeout(300);
await W.p.click('[data-qx="'+idQ+'"]'); await W.p.click('[data-qx="'+idQ+'"]'); await W.p.waitForTimeout(300);
await giro();
ok(await P.S(id=>!window.IECI_T.DB().quotes.some(q=>q.id===id),idQ),'J) preventivo eliminato: sparito anche sull\'altro PC');
const ripr=await W.S(()=>new Promise(r=>{ if(!window.IECI_T.snapList) return r(false); window.IECI_T.snapList(a=>{ const s=a.find(x=>x.why==='prova'); if(!s) return r(false); window.IECI_T.restoreObj(JSON.parse(s.json)); r(true); }); }));
await W.p.waitForTimeout(600); await giro();
ok(ripr&&await W.S(id=>window.IECI_T.DB().quotes.some(q=>q.id===id),idQ)&&await P.S(id=>window.IECI_T.DB().quotes.some(q=>q.id===id),idQ),'J) ripristinata la copia: il preventivo torna su Windows E sull\'altro PC (la sincronizzazione non lo cancella di nuovo)');
ok(await W.S(()=>/Hager/.test(JSON.stringify(window.IECI_T.S().trust))&&window.IECI_T.S().company.stamp&&window.IECI_T.S().company.stamp.length>100),'J) dopo tutto: marchi e timbro sempre al loro posto');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
