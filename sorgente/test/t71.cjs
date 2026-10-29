// Loghi e foto dal web: Wikidata, Wikimedia Commons, Openverse (risposte simulate: nei test non si va su internet)
const A=require('./_amb.cjs'), fs=require('fs'), path=require('path');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const PNG=fs.readFileSync(path.join(A.ROOT,'statici/icone/any-192.png')), PNG2=fs.readFileSync(path.join(A.ROOT,'statici/icone/apple-180.png'));
const visti=[];
const ENT={
  bticino:{Q1:{lab:'BTicino',des:'azienda italiana di materiale elettrico',logo:'BTicino logo.svg',site:'https://www.bticino.it'},Q9:{lab:'Bticino Hall',des:'edificio',logo:'Hall logo.png'}},
  vimar:{Q2:{lab:'Vimar',des:'azienda italiana',logo:'Vimar logo.png'}},
  came:{Q3:{lab:'CAME S.p.A.',des:'azienda italiana di automazioni',logo:'Came logo.png'}},
  nice:{Q4:{lab:'Nizza',des:'città francese',logo:'Nice logo city.svg'}}
};
async function rotte(ctx){
  const cors={'Access-Control-Allow-Origin':'*','Content-Type':'application/json'};
  await ctx.route(/https:\/\/www\.wikidata\.org\/.*/,r=>{ const u=new URL(r.request().url()); visti.push(u.href); const a=u.searchParams.get('action');
    if(a==='wbsearchentities'){ const e=ENT[u.searchParams.get('search').toLowerCase()]||{}; return r.fulfill({headers:cors,body:JSON.stringify({search:Object.keys(e).map(id=>({id}))})}); }
    const ids=u.searchParams.get('ids').split('|'), out={}; Object.values(ENT).forEach(g=>Object.keys(g).forEach(id=>{ if(ids.includes(id)){ const x=g[id]; out[id]={labels:{it:{value:x.lab}},descriptions:{it:{value:x.des}},claims:{P154:[{mainsnak:{datavalue:{value:x.logo}}}],P856:x.site?[{mainsnak:{datavalue:{value:x.site}}}]:[]}}; } }));
    r.fulfill({headers:cors,body:JSON.stringify({entities:out})}); });
  await ctx.route(/https:\/\/commons\.wikimedia\.org\/.*/,r=>{ const u=new URL(r.request().url()); visti.push(u.href); const pages={};
    const mk=(i,t,lic)=>({title:'File:'+t,index:i,imageinfo:[{mime:'image/png',url:'https://upload.wikimedia.org/o/'+encodeURIComponent(t),thumburl:'https://upload.wikimedia.org/thumb/960px-'+encodeURIComponent(t)+'.png',descriptionurl:'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(t),extmetadata:{LicenseShortName:{value:lic},Artist:{value:'<a href="x" onerror="window.XSS=1">Mario Foto</a>'}}}]});
    if(u.searchParams.get('titles')) u.searchParams.get('titles').split('|').forEach((t,i)=>{ pages[-1-i]=mk(i,t.replace(/^File:/,''),'Public domain'); });
    else { pages[11]=mk(1,'Videocitofono esempio.jpg','CC BY-SA 4.0'); pages[12]=mk(2,'Monitor esempio.jpg','CC0'); pages[13]={title:'File:Manuale.pdf',index:3,imageinfo:[{mime:'application/pdf',url:'https://upload.wikimedia.org/x.pdf'}]}; }
    r.fulfill({headers:cors,body:JSON.stringify({query:{pages}})}); });
  await ctx.route(/https:\/\/api\.openverse\.org\/v1\/images\/\?.*/,r=>{ visti.push(r.request().url()); r.fulfill({headers:cors,body:JSON.stringify({results:[{title:'Wallbox in garage',thumbnail:'https://api.openverse.org/v1/images/a1/thumb/',url:'https://non-cors.example/a1.jpg',license:'by',license_version:'2.0',creator:'Anna',foreign_landing_url:'https://flickr.example/a1'}]})}); });
  await ctx.route(/https:\/\/(upload\.wikimedia\.org|api\.openverse\.org\/v1\/images\/a1\/thumb|wsrv\.nl)\/.*/,r=>{ const u=r.request().url(); visti.push(u); r.fulfill({headers:{'Access-Control-Allow-Origin':'*','Content-Type':'image/png'},body:/openverse|Monitor/.test(u)?PNG2:PNG}); });
  await ctx.route(/https:\/\/non-cors\.example\/.*/,r=>{ visti.push(r.request().url()); r.abort('accessdenied'); });
}
(async()=>{const b=await A.chromium.launch();
const ctx=await b.newContext({viewport:{width:430,height:900}}); await rotte(ctx);
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SRC);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S,null,{timeout:20000}).catch(()=>{});
const S=(f,a)=>p.evaluate(f,a);
ok(await S(()=>!!document.getElementById('iw-fill')&&!!document.getElementById('iw-mem')),'Prodotti: «Trova foto e loghi mancanti» e «Loghi delle marche»');

// 1. confronto Bticino / Vimar dall'assistente: i loghi arrivano da soli
await S(()=>{ const s=window.IECI_T.S(); s.client.name='Rossi Mario'; s.client.tel='333 1112223'; });
await A.mostra(p,'#as-txt'); await p.fill('#as-txt','Appartamento 80 mq per Rossi Mario, Bticino oppure Vimar a confronto'); await p.click('#as-go'); await p.waitForTimeout(150); await p.click('#as-ok');
await p.waitForFunction(()=>{ const t=document.getElementById('toast'); return /Loghi trovati da soli|trovato da solo/.test(t.textContent); },null,{timeout:9000}).catch(()=>{});
let st=await S(()=>{ const s=window.IECI_T.S(); return {mem:(window.IECI_T.DB().logos||[]).map(x=>x.name+'|'+x.src).join(','),sys:s.cmp.sys.map(x=>!!x.logo).join(','),toast:document.getElementById('toast').textContent}; });
console.log(JSON.stringify(st));
ok(/Bticino\|Logo ufficiale/.test(st.mem)&&/Vimar\|Logo ufficiale/.test(st.mem),'loghi Bticino e Vimar trovati su Wikidata e ricordati');
ok(st.sys==='false,false','gli impianti usano il logo ricordato (nessuna copia nel preventivo)');
ok(await S(()=>{ const im=[...document.querySelectorAll('#doc img')].filter(i=>/^(data:image\/png|blob:)/.test(i.src)); return im.length>=2; }),'loghi nel fascicolo');
ok(!visti.some(u=>/rossi|mario|333/i.test(decodeURIComponent(u))),'nessun dato del cliente nelle richieste ('+visti.length+' richieste)');
ok(await S(()=>/Logo della marca salvato/.test(document.getElementById('br-sys').textContent)),'scheda dell\'impianto: logo salvato per tutti i preventivi');

// 2. non prende loghi sbagliati: "Nice" su Wikidata e' la città (descrizione non aziendale)
await S(()=>{ const s=window.IECI_T.S(); s.products.push({id:'pn1',name:'Motore Nice',brand:'Nice',code:'',desc:'',specs:'',link:'',tags:'',photos:[]}); s.lines.push({d:'Motore Nice',u:'cad',q:1,p:300,s:0,pid:'pn1'}); });
await S(()=>new Promise(r=>{ window.IECI_T.iwScan(); setTimeout(r,1200); }));
ok(await S(()=>!(window.IECI_T.DB().logos||[]).some(x=>/nice/i.test(x.name))),'«Nice» = città di Nizza: logo non preso in automatico');

// 3. finestra «Trova le foto» su una scheda prodotto
await A.mostra(p,'#plist');
const pi=await S(()=>window.IECI_T.S().products.findIndex(x=>x.id==='pn1'));
await S(i=>window.IECI_T.iwProd(i,'iwph'),pi); await p.waitForTimeout(400);
st=await S(()=>({vis:!document.getElementById('iw-bg').hidden,q:document.getElementById('iw-q').value,sec:[...document.querySelectorAll('.iw-st')].map(x=>x.textContent),n:document.querySelectorAll('#iw-res .iw-c:not(.sk)').length,g:document.getElementById('iw-gimg').href,xss:!!window.XSS}));
console.log(JSON.stringify(st));
ok(st.vis&&st.q==='Nice Motore Nice'&&st.n===3&&st.sec.some(t=>/Commons/.test(t))&&st.sec.some(t=>/Openverse/.test(t)),'risultati da Commons e Openverse (il PDF scartato)');
ok(/google\.com\/search\?tbm=isch&q=Nice%20Motore/.test(st.g),'pulsante Google Immagini con la ricerca pronta');
ok(!st.xss,'autori e licenze letti come testo (nessun codice eseguito)');
await p.click('#iw-res .iw-c:not(.sk)'); await p.waitForTimeout(900);
st=await S(i=>{ const pr=window.IECI_T.S().products[i]; const lib=window.IECI_T.DB().prods.find(x=>x.name==='Motore Nice'); return {n:pr.photos.length,cr:JSON.stringify(pr.cr||{}),lib:lib?lib.photos.length:0,open:!document.getElementById('iw-bg').hidden}; },pi);
console.log(JSON.stringify(st));
ok(st.n===1&&/CC BY-SA 4.0/.test(st.cr)&&/Mario Foto/.test(st.cr),'foto aggiunta con autore e licenza');
ok(st.lib===1,'foto ricordata nella libreria prodotti');
ok(st.open,'la finestra resta aperta per aggiungere altre foto');
// openverse: originale senza CORS -> usa la miniatura
await p.click('#iw-res .iw-sec:last-child .iw-c'); await p.waitForTimeout(900);
ok(await S(i=>window.IECI_T.S().products[i].photos.length===2,pi),'Openverse: se l\'originale non si scarica uso la miniatura');
await p.keyboard.press('Escape'); await p.waitForTimeout(100);
ok(await S(()=>document.getElementById('iw-bg').hidden),'Esc chiude');
ok(await S(()=>/Foto: Mario Foto · CC BY-SA 4.0 \(Wikimedia Commons\) · Anna · CC BY 2.0 \(Openverse\)/.test(document.querySelector('#doc').textContent)),'nel fascicolo: credito della foto');

// 4. la volta dopo la foto arriva da sola (stesso nome)
await S(()=>{ const s=window.IECI_T.S(); s.products=s.products.filter(x=>x.id!=='pn1'); s.lines=s.lines.filter(l=>l.pid!=='pn1'); const l={d:'Motore Nice',u:'cad',q:1,p:300,s:0}; s.lines.push(l); window.IECI_T.linkLine(l,{force:true}); });
ok(await S(()=>{ const pr=window.IECI_T.S().products.find(x=>x.name==='Motore Nice'); return !!pr&&pr.photos.length===2&&!!pr.cr; }),'nuova scheda con lo stesso nome: foto e crediti dalla libreria');

// 5. «Trova foto e loghi mancanti»: tutto in una schermata
await S(()=>{ const s=window.IECI_T.S(); s.products.push({id:'pw1',name:'Wallbox 7 kW',brand:'Came',code:'',desc:'',specs:'',link:'',tags:'',photos:[]}); s.lines.push({d:'Wallbox 7 kW',u:'cad',q:1,p:900,s:0,pid:'pw1'}); });
await S(()=>document.getElementById('iw-fill').click()); await p.waitForTimeout(900);
st=await S(()=>({vis:!document.getElementById('iwf-bg').hidden,rows:[...document.querySelectorAll('.iwf-r')].map(r=>r.querySelector('.iwf-k').textContent+': '+r.querySelector('b').textContent)}));
console.log(JSON.stringify(st));
ok(st.vis&&st.rows.includes('Logo della marca: Came')&&st.rows.includes('Logo della marca: Nice')&&st.rows.includes('Foto del prodotto: Wallbox 7 kW'),'elenco di cosa manca: loghi e foto');
ok(st.rows.filter(x=>x==='Foto del prodotto: Videocitofono: monitor interno').length===1,'stesso prodotto in due proposte: una riga sola');
ok(await S(()=>document.querySelectorAll('#iwf-rows .iw-c.sk').length>0),'le righe lontane si caricano solo quando arrivano sullo schermo');
await p.locator('.iwf-r:has(b:text-is("Wallbox 7 kW"))').scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
await p.click('.iwf-r:has(b:text-is("Wallbox 7 kW")) .iw-c:not(.sk)'); await p.waitForTimeout(900);
const vm=await S(()=>window.IECI_T.S().products.filter(x=>x.name==='Videocitofono: monitor interno').map(x=>x.id));
await p.locator('.iwf-r:has(b:text-is("Videocitofono: monitor interno"))').scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
await p.click('.iwf-r:has(b:text-is("Videocitofono: monitor interno")) .iw-c:not(.sk)'); await p.waitForTimeout(1200);
ok(await S(ids=>ids.length===2&&ids.every(id=>window.IECI_T.S().products.find(x=>x.id===id).photos.length===1),vm),'un tocco: la foto va su tutte le schede con quel nome');
ok(await S(()=>window.IECI_T.S().products.find(x=>x.id==='pw1').photos.length===1&&/✓ fatto/.test(document.getElementById('iwf-rows').innerText)),'un tocco: foto messa e riga sistemata');
await p.click('.iwf-r:has(b:text-is("Came")) .iw-c'); await p.waitForTimeout(900);
ok(await S(()=>(window.IECI_T.DB().logos||[]).some(x=>x.name==='Came')),'un tocco: logo Came ricordato');
await p.click('#iwf-ok'); await p.waitForTimeout(100);

// 6. Marchi che installiamo: scrivi i nomi, i loghi arrivano
await A.mostra(p,'#tr-brand');
await p.fill('[data-bgn="0"]','Bticino, Came'); await p.click('[data-bgw="0"]'); await p.waitForTimeout(600);
ok(await S(()=>window.IECI_T.S().trust.bgroups[0].items.map(x=>x.name).join(',')==='Bticino,Came'),'Marchi che installiamo: loghi aggiunti scrivendo i nomi');

// 7. elenco dei loghi: elimina
await A.mostra(p,'#iw-mem');
const nl=await S(()=>window.IECI_T.DB().logos.length);
await S(()=>document.querySelector('[data-iwmx]').click()); await p.waitForTimeout(100);
ok(await S(n=>window.IECI_T.DB().logos.length===n-1&&Object.keys(window.IECI_T.DB().del).length>0,nl),'logo eliminato (anche sugli altri dispositivi)');

// 8. senza internet o ricerca spenta
await S(()=>{ window.IECI_T.APP().webimg='off'; });
await S(i=>window.IECI_T.iwProd(i,'iwph'),0); await p.waitForTimeout(200);
ok(await S(()=>/ricerca su internet è spenta/.test(document.getElementById('iw-res').innerText)),'ricerca spenta: lo dice e propone le alternative');
await p.click('#iw-x');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
