// Prontuario materiali, libreria marche, assistente che li usa e calcoli da cantiere
const A=require('./_amb.cjs'), fs=require('fs'), path=require('path');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const PNG=fs.readFileSync(path.join(A.ROOT,'statici/icone/any-192.png'));
(async()=>{const b=await A.chromium.launch();
const ctx=await b.newContext({viewport:{width:430,height:900}});
// Wikidata simulata: ogni marca e' un'azienda con il suo logo
const cors={'Access-Control-Allow-Origin':'*','Content-Type':'application/json'};
await ctx.route(/https:\/\/www\.wikidata\.org\/.*/,r=>{ const u=new URL(r.request().url()); const a=u.searchParams.get('action');
  if(a==='wbsearchentities') return r.fulfill({headers:cors,body:JSON.stringify({search:[{id:'Q_'+encodeURIComponent(u.searchParams.get('search'))}]})});
  const out={}; u.searchParams.get('ids').split('|').forEach(id=>{ const n=decodeURIComponent(id.slice(2)); out[id]={labels:{it:{value:n}},descriptions:{it:{value:'azienda italiana'}},claims:{P154:[{mainsnak:{datavalue:{value:n+' logo.png'}}}]}}; });
  r.fulfill({headers:cors,body:JSON.stringify({entities:out})}); });
await ctx.route(/https:\/\/commons\.wikimedia\.org\/.*/,r=>{ const u=new URL(r.request().url()); const pages={}; (u.searchParams.get('titles')||'').split('|').filter(Boolean).forEach((t,i)=>{ pages[-1-i]={title:t,index:i,imageinfo:[{mime:'image/png',url:'https://upload.wikimedia.org/x/'+i+'.png',thumburl:'https://upload.wikimedia.org/x/500px-'+i+'.png',extmetadata:{LicenseShortName:{value:'Public domain'}}}]}; }); r.fulfill({headers:cors,body:JSON.stringify({query:{pages}})}); });
await ctx.route(/https:\/\/upload\.wikimedia\.org\/.*/,r=>r.fulfill({headers:{'Access-Control-Allow-Origin':'*','Content-Type':'image/png'},body:PNG}));
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SRC);await p.waitForTimeout(1500);
const S=(f,a)=>p.evaluate(f,a);
let st=await S(()=>({v:window.IECI_T.prVoci().length,amb:new Set(window.IECI_T.prVoci().map(v=>v.amb)).size,m:window.IECI_T.maVoci().length}));
ok(st.v>=400&&st.amb>=17&&st.m>=200,'prontuario: '+st.v+' voci in '+st.amb+' ambiti · libreria: '+st.m+' marche');

// --- ricerca nel listino del preventivo: compaiono le voci del prontuario
await S(()=>{ const s=window.IECI_T.S(); s.model='dom'; s.lines=[]; });
await A.mostra(p,'#cat-q');
await p.fill('#cat-q','armadio rack'); await p.waitForTimeout(200);
ok(await S(()=>/Dal prontuario IECI/i.test(document.getElementById('cat').innerText)&&!!document.querySelector('#cat [data-prn]')),'cerca «armadio rack»: la voce arriva dal prontuario');
await S(()=>document.querySelector('#cat [data-prn]').click()); await p.waitForTimeout(200);
st=await S(()=>{ const s=window.IECI_T.S(); return {l:s.lines.map(l=>l.d),c:s.cat.dom.some(c=>/rack/.test(c[0]))}; });
ok(st.l.some(d=>/rack/.test(d))&&st.c,'con + va nel preventivo e nel tuo listino');
await p.fill('#cat-q','');

// --- pannello Listini: sfoglia il prontuario e porta un gruppo intero
await A.mostra(p,'#pr-box'); await S(()=>{ const s=document.getElementById('ls-model'); s.value='vid'; s.dispatchEvent(new Event('change')); });
await p.selectOption('#pr-amb','tvc'); await p.waitForTimeout(150);
ok(await S(()=>/Telecamere/.test(document.getElementById('pr-list').innerText)&&document.getElementById('pr-dest').textContent.length>0),'prontuario per ambito: videosorveglianza');
const prima=await S(()=>window.IECI_T.S().cat.vid.length);
await S(()=>document.querySelector('[data-prg^="tvc|Telecamere"]').click()); await p.waitForTimeout(150);
ok(await S(n=>window.IECI_T.S().cat.vid.length>n&&window.IECI_T.S().cat.vid.some(c=>/Campanello video smart/.test(c[0])),prima),'«Aggiungi tutte»: il gruppo entra nel listino videosorveglianza');
await p.fill('#pr-q','rack'); await p.waitForTimeout(150);
ok(await S(()=>/Armadio rack/.test(document.getElementById('pr-list').innerText)),'ricerca nel prontuario');

// --- l'assistente usa il prontuario
const prepara=async t=>{ await A.mostra(p,'#as-txt'); await p.fill('#as-txt',t); await p.click('#as-go'); await p.waitForTimeout(150); return S(()=>{ const o=document.getElementById('as-out'); return {txt:o.innerText,righe:[...o.querySelectorAll('.as-r')].map(r=>({d:r.querySelector('.as-d').childNodes[0].textContent,q:+r.querySelector('.as-q').value,p:(r.querySelector('.as-p')||{}).textContent||''}))}; }); };
const riga=(r,re)=>r.righe.find(x=>re.test(x.d));
await S(()=>{ window.IECI_T.S().lines=[]; });
let r=await prepara('casa: 6 punti luce, aggiungi rilevatore di monossido, 2 access point wifi');
ok(riga(r,/monossido/)&&/prontuario/i.test(riga(r,/monossido/).p)&&riga(r,/Access point/).q===2,'voci che non sono nel listino: prese dal prontuario');
await p.click('#as-ok'); await p.waitForTimeout(300);
ok(await S(()=>window.IECI_T.S().cat.dom.some(c=>/Access point/.test(c[0]))&&/prontuario nel tuo listino/.test(document.getElementById('toast').textContent)),'applicate: entrano anche nel listino');
r=await prepara('videosorveglianza hikvision 4 telecamere colorvu');
ok(riga(r,/turret a colori/).q===4&&/Marca Hikvision ColorVu/.test(r.txt),'«colorvu»: telecamere a colori di notte Hikvision');
r=await prepara('allarme Ksenia 5 sensori');
ok(/Marca Ksenia Security/.test(r.txt),'marca scritta corta: «Ksenia» = Ksenia Security');
r=await prepara('preventivo per simon, 4 prese');
ok(!/Marca Simon/.test(r.txt),'«simon» minuscolo non è la marca');
await p.click('#as-x');

// --- calcoli da cantiere
r=await prepara('sezione cavo 32 a 40 m');
ok(/sezione minima 6 mm²/.test(r.txt)&&/caduta di tensione 3,76%/.test(r.txt)&&riga(r,/FG16OR16 3G6/).q===40&&riga(r,/Magnetotermico 1P\+N 32 A/),'sezione: 32 A su 40 m → 6 mm², cavo e interruttore pronti');
r=await prepara('che sezione per wallbox 22 kw trifase 50 m');
ok(/sezione minima 6 mm²/.test(r.txt)&&riga(r,/5G6/)&&riga(r,/Magnetotermico 4P 32 A/),'wallbox 22 kW trifase 50 m → 5G6 con 4P 32 A');
r=await prepara('sezione 7,4 kw wallbox 30 m');
ok(/magnetotermico <?b?>?32 A/.test(r.txt.replace(/\n/g,' '))||/magnetotermico 32 A/.test(r.txt),'wallbox 7,4 kW: 32 A (non 40 A)');
r=await prepara('caduta di tensione 2,5 mm 30 m 16 a');
ok(/caduta 3,38%/.test(r.txt)&&/Entro il 4%/.test(r.txt),'caduta di tensione');
r=await prepara('che differenziale per la wallbox');
ok(/tipo B/.test(r.txt)&&await S(()=>document.getElementById('as-x').textContent==='Chiudi'&&!document.getElementById('as-ok')),'consiglio: differenziale per wallbox, solo «Chiudi»');
r=await prepara('quanto produce un fotovoltaico da 6 kw');
ok(/8400 kWh all'anno/.test(r.txt),'produzione fotovoltaica stimata');
r=await prepara('3 kw quanti ampere');
ok(/14,5 A/.test(r.txt)&&/16 A/.test(r.txt),'corrente da potenza');
await p.click('#as-x');

// --- libreria marche: settori, ricerca, loghi di un settore in un colpo
await A.mostra(p,'#ma-grid'); await S(()=>{ document.getElementById('ma-d').open=true; document.getElementById('ma-d').dispatchEvent(new Event('toggle')); }); await p.waitForTimeout(100);
await S(()=>document.querySelector('[data-mas="aut"]').click());
st=await S(()=>({n:document.querySelectorAll('#ma-grid .ma-c').length,t:document.getElementById('ma-grid').innerText}));
ok(st.n>=20&&/Came/.test(st.t)&&/Nice/.test(st.t)&&/Robus/.test(st.t),'settore automazioni: '+st.n+' marche con le serie');
await p.fill('#ma-q','plana'); await p.waitForTimeout(100);
ok(await S(()=>document.querySelectorAll('#ma-grid .ma-c').length===1&&/Vimar/.test(document.getElementById('ma-grid').innerText)),'cerca per serie: «plana» → Vimar');
await p.fill('#ma-q',''); await p.waitForTimeout(100);
await S(()=>document.querySelector('[data-mas="ric"]').click());
const nric=await S(()=>document.querySelectorAll('#ma-grid .ma-c').length);
await S(()=>document.getElementById('ma-all').click());
await p.waitForFunction(()=>/Loghi trovati/.test(document.getElementById('toast').textContent),null,{timeout:20000}).catch(()=>{});
st=await S(()=>({has:document.querySelectorAll('#ma-grid .ma-c.has').length,all:document.querySelectorAll('#ma-grid .ma-c').length,t:document.getElementById('toast').textContent,btn:document.getElementById('ma-all').textContent}));
console.log(JSON.stringify(st));
ok(st.has===st.all&&st.all===nric&&/Tutti i loghi presi/.test(st.btn),'«Prendi i loghi del settore»: tutti i loghi della ricarica auto');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
