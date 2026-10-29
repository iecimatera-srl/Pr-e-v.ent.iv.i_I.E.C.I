// Schede prodotto che si compilano da sole (gratis): compilatore senza IA, schede ufficiali Open Icecat, IA sul telefono facoltativa con controllo anti-invenzioni
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
// immagine di prova 64×64 (le immagini troppo piccole vengono scartate come non valide)
const PNG=(()=>{ const z=require('zlib'), W=64; const crc=b=>{ let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;} c=0xffffffff; for(const x of b)c=t[(c^x)&255]^(c>>>8); return (c^0xffffffff)>>>0; };
  const ch=(ty,d)=>{ const l=Buffer.alloc(4);l.writeUInt32BE(d.length); const td=Buffer.concat([Buffer.from(ty),d]); const c=Buffer.alloc(4);c.writeUInt32BE(crc(td)); return Buffer.concat([l,td,c]); };
  const h=Buffer.alloc(13); h.writeUInt32BE(W,0);h.writeUInt32BE(W,4);h[8]=8;h[9]=2; const raw=Buffer.alloc((W*3+1)*W); for(let y=0;y<W;y++){ raw[y*(W*3+1)]=0; for(let x=0;x<W;x++){ const o=y*(W*3+1)+1+x*3; raw[o]=x*4;raw[o+1]=y*4;raw[o+2]=(x*y)&255; } }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch('IHDR',h),ch('IDAT',z.deflateSync(raw)),ch('IEND',Buffer.alloc(0))]); })();
(async()=>{const b=await A.chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const richieste=[];
await ctx.route(/live\.icecat\.biz\/api/,r=>{ const u=new URL(r.request().url()); richieste.push(u.search);
  if(u.searchParams.get('ProductCode')!=='DS-2CD2143G2-I') return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({msg:'Error',statusCode:4})});
  r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({msg:'OK',data:{GeneralInfo:{Title:'Hikvision DS-2CD2143G2-I',Description:{LongDesc:'<p>Telecamera di rete dome da 4 MP con tecnologia AcuSense.</p><p>Filtra i falsi allarmi causati da animali e foglie.</p>'},BrandLogo:'https://images.icecat.biz/img/brand/hik.png'},Image:{HighPic:'https://images.icecat.biz/img/p1.jpg'},Gallery:[{Pic500x500:'https://images.icecat.biz/img/p1.jpg'},{Pic500x500:'https://images.icecat.biz/img/p2.jpg'}],FeaturesGroups:[{Features:[{Feature:{Name:{Value:'Risoluzione massima'}},PresentationValue:'2688 x 1520 Pixel'},{Feature:{Name:{Value:'Grado di protezione'}},PresentationValue:'IP67'}]}]}})}); });
await ctx.route(/images\.icecat\.biz/,r=>r.fulfill({status:200,contentType:'image/png',headers:{'access-control-allow-origin':'*'},body:PNG}));
await ctx.route(/wikidata|wikimedia|openverse|wsrv\.nl/,r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{}'}));
// IA di Chrome finta: la prima risposta è corretta, la seconda inventa una garanzia (va scartata)
await ctx.addInitScript(()=>{ let n=0;   window.LanguageModel={availability:async()=>'available',create:async()=>({prompt:async(t)=>{ n++; window.__iaPrompt=t; return n===1?'Comando Bticino della serie Living Now, unipolare da 16 A: si usa per accendere e spegnere le luci con un gesto semplice.':'Comando Bticino da 16 A con garanzia di 10 anni e certificazione europea.'; }})}; });
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.pcScrivi,null,{timeout:20000}).catch(()=>{});await p.waitForTimeout(800);
const S=(f,a)=>p.evaluate(f,a);

// 1. impostazione
await A.mostra(p,'#ap-pcomp');
let st=await S(()=>({v:document.getElementById('ap-pcomp').value,o:[...document.querySelectorAll('#ap-pcomp option')].map(o=>o.value),ia:!document.getElementById('ap-pcia').hidden}));
ok(st.v==='auto'&&st.o.join()==='auto,ia,man'&&st.ia,'impostazione: da sole senza IA (predefinito), con IA sul telefono, solo a richiesta');

// 2. compilatore senza IA: solo i dati scritti, niente invenzioni
st=await S(()=>window.IECI_T.pcScrivi({name:'Differenziale puro 2P 40A 30 mA tipo A',brand:'Hager',code:'ADA240G'}));
ok(/^Interruttore differenziale bipolare tipo A Hager con corrente nominale di 40 A e sensibilità di 30 mA\./.test(st.desc)&&/Sensibilità: 30 mA/.test(st.specs)&&/Codice: ADA240G/.test(st.specs),'senza IA: «'+st.desc+'»');
st=await S(()=>{ const r=window.IECI_T.pcScrivi({name:'Telecamera dome IP 4 MP ottica 2,8 mm IR 30 m PoE',brand:'Hikvision',code:''}); return r.desc; });
const numeri=s=>(s.match(/\d+(?:,\d+)?/g)||[]).sort().join();
ok(numeri(st)==='2,8,30,4','nessun numero inventato (solo 4 MP, 2,8 mm, 30 m)');
ok(await S(()=>window.IECI_T.pcScrivi({name:'Prodotto XZ',brand:'',code:''})===null),'se non sa cos\'è, non scrive niente');

// 3. in automatico: nuovo prodotto → descrizione, caratteristiche e foto ufficiale (Icecat) da sole
await S(()=>{ const s=window.IECI_T.S(); s.client={name:'Cliente Prova',addr:'',tel:'',email:'',cf:''};
  const D=window.IECI_T.DB(); D.logos=(D.logos||[]).filter(x=>!/hikvision/i.test(x.name)); (s.trust.bgroups||[]).forEach(g=>g.items=(g.items||[]).filter(it=>!/hikvision/i.test(it.name)));
  s.lines.push({d:'Telecamera dome 4 MP',u:'cad',q:2,p:150,s:0}); s.lines.push({d:'Interruttore 1P 16A Living Now bianco',u:'cad',q:5,p:9,s:0});
  const L1=s.lines[s.lines.length-2], L2=s.lines[s.lines.length-1];
  window.IECI_T.linkLine(L1,{force:true,brand:'Hikvision',code:'DS-2CD2143G2-I'}); window.IECI_T.linkLine(L2,{force:true,brand:'Bticino',code:'KM4001'});
  const pr=s.products.find(x=>x.name==='Interruttore 1P 16A Living Now bianco'); pr.desc='La mia descrizione';
  s.products.push({id:'p'+(Date.now()-40*864e5).toString(36)+'abcd',name:'Differenziale 2P 25A 30 mA',brand:'Hager',code:'',desc:'',specs:'',link:'',tags:'',photos:[]});
  window.IECI_T.touch(); });
await p.waitForTimeout(6000);
st=await S(()=>{ const s=window.IECI_T.S(); const t=s.products.find(x=>x.code==='DS-2CD2143G2-I'), i=s.products.find(x=>x.code==='KM4001'); return {td:t.desc,ts:t.specs,tf:(t.photos||[]).length,tp:t.pcs,id:i.desc,is:i.specs}; });
console.log(JSON.stringify(st));
ok(/AcuSense/.test(st.td)&&/falsi allarmi/.test(st.td)&&st.tp&&st.tp.desc==='icecat','marca e codice esatti: descrizione dalla scheda ufficiale del produttore');
ok(/Grado di protezione: IP67/.test(st.ts)&&st.tf===1,'caratteristiche e foto ufficiali aggiunte');
ok(await S(()=>(window.IECI_T.DB().logos||[]).some(x=>/hikvision/i.test(x.name)&&x.src==='Open Icecat'&&/^data:image/.test(x.img))),'logo della marca preso dalla scheda ufficiale (mancava) e ricordato per tutti i preventivi');
ok(await S(()=>{ const x=window.IECI_T.S().products.find(x=>x.name==='Differenziale 2P 25A 30 mA'); return !x.desc&&!x.specs; }),'le schede dei preventivi fatti prima non cambiano da sole');
ok(st.id==='La mia descrizione'&&/Serie: Living Now/.test(st.is),'la descrizione che avevo scritto resta; le caratteristiche vuote si compilano');
ok(richieste.length>0&&richieste.every(q=>!/Cliente|Prova/.test(q))&&richieste.some(q=>/Brand=Hikvision/.test(q)&&/ProductCode=DS-2CD2143G2-I/.test(q)),'a internet vanno solo marca e codice, mai i dati del cliente');
await A.mostra(p,'#plist'); await S(()=>document.querySelectorAll('#plist details.pe').forEach(d=>d.open=true)); await p.waitForTimeout(300);
ok(await S(()=>/dalla scheda ufficiale del produttore/.test(document.getElementById('plist').innerText)),'sulla scheda è scritto da dove arriva la descrizione');

// 4. solo a richiesta: nessuna compilazione automatica, poi «Completa la scheda» e «Usa tutto»
await S(()=>{ const sel=document.getElementById('ap-pcomp'); sel.value='man'; sel.dispatchEvent(new Event('change',{bubbles:true})); });
await S(()=>{ const s=window.IECI_T.S(); s.lines.push({d:'Magnetotermico 1P+N 16A 4,5 kA',u:'cad',q:3,p:20,s:0}); window.IECI_T.linkLine(s.lines[s.lines.length-1],{force:true,brand:'Hager',code:'MFN716'}); window.IECI_T.touch(); window.IECI_T.renderAll(); });
await p.waitForTimeout(3500);
const mi=await S(()=>window.IECI_T.S().products.findIndex(x=>x.code==='MFN716'));
ok(await S(i=>!window.IECI_T.S().products[i].desc,mi),'«solo a richiesta»: la scheda resta vuota');
await A.mostra(p,'#plist'); await S(i=>{ const d=document.querySelectorAll('#plist details.pe')[i]; d.open=true; },mi); await p.waitForTimeout(200);
await p.click('#plist [data-pcgo="'+mi+'"]'); await p.waitForFunction(i=>document.querySelector('#plist [data-pcuse="'+i+':tutto"]'),mi,{timeout:15000});
await p.click('#plist [data-pcuse="'+mi+':tutto"]'); await p.waitForTimeout(500);
st=await S(i=>window.IECI_T.S().products[i],mi);
ok(/^Interruttore magnetotermico 1P\+N Hager/.test(st.desc)&&/Potere di interruzione: 4,5 kA/.test(st.specs),'«Completa la scheda» → «Usa tutto»: descrizione e caratteristiche');

// 5. IA sul telefono: testo più scorrevole, ma se inventa (garanzie, numeri nuovi) viene scartato
const ii=await S(()=>window.IECI_T.S().products.findIndex(x=>x.code==='KM4001'));
await S(i=>{ const d=document.querySelectorAll('#plist details.pe')[i]; d.open=true; },ii);
await p.click('#plist [data-pcia="'+ii+'"]'); await p.waitForFunction(i=>document.querySelector('#plist [data-pcuse="'+i+':desc"]'),ii,{timeout:15000});
st=await S(i=>({o:document.querySelector('#plist [data-pcb="'+i+'"]').innerText,pr:window.__iaPrompt}),ii);
ok(/scritta dall'IA sul telefono/.test(st.o)&&/accendere e spegnere le luci con un gesto semplice/.test(st.o),'IA sul telefono: descrizione riscritta');
ok(/Usa SOLO i dati forniti/.test(st.pr)&&/Corrente nominale: 16 A/.test(st.pr),'all\'IA vanno solo i dati del prodotto, con la regola di non inventare');
await p.click('#plist [data-pcx="'+ii+'"]'); await p.click('#plist [data-pcia="'+ii+'"]'); await p.waitForFunction(i=>document.querySelector('#plist [data-pcuse="'+i+':tutto"]'),ii,{timeout:15000});
st=await S(i=>document.querySelector('#plist [data-pcb="'+i+'"]').innerText,ii);
ok(!/garanzia/.test(st)&&/scartato/.test(st)&&/scritta in automatico/.test(st),'IA che inventa una garanzia: testo scartato, resta quello senza IA');
st=await S(()=>[window.IECI_T.pcIAControlla('Telecamera da 4 MP con ottica da 2,8 mm, adatta agli interni.','4 MP 2,8 mm'),window.IECI_T.pcIAControlla('Telecamera da 8 MP con ottica da 2,8 mm, adatta agli interni.','4 MP 2,8 mm'),window.IECI_T.pcIAControlla('The camera has a great image quality and night vision.','4 MP')]);
ok(st[0]&&!st[1]&&!st[2],'controllo: numeri nuovi o testo in inglese vengono scartati');
await p.setViewportSize({width:360,height:780}); await p.waitForTimeout(300);
await p.click('#plist [data-pcgo="'+ii+'"]'); await p.waitForFunction(i=>document.querySelector('#plist [data-pcuse="'+i+':tutto"]'),ii,{timeout:15000});
st=await S(()=>{ const out=[]; document.querySelectorAll('#plist .pcbox, #plist .pcbox *').forEach(e=>{ const r=e.getBoundingClientRect(); if(r.width&&r.right>innerWidth+1) out.push(e.className||e.tagName); }); return out; });
ok(!st.length,'telefono (360 px): il riquadro dei risultati non esce dallo schermo '+JSON.stringify(st.slice(0,4)));
// 6. tutto finisce anche nella libreria prodotti
await p.waitForTimeout(2500);
st=await S(()=>window.IECI_T.DB().prods.filter(x=>x.code==='DS-2CD2143G2-I').map(x=>[!!/AcuSense/.test(x.desc),(x.photos||[]).length,x.pcs===undefined]));
ok(st.length===1&&st[0][0]&&st[0][1]===1&&st[0][2],'la scheda completata è salvata nella libreria prodotti');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
