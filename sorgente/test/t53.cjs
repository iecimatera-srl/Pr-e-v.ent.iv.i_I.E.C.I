const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const URL=require('./_amb.cjs').SRC;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
const A=await (await b.newContext()).newPage();A.on('pageerror',e=>errs.push(e.message));
await A.goto(URL);await A.waitForTimeout(1500);
ok(await A.evaluate(()=>window.IECI_T.isFactory()),'dispositivo nuovo = impostazioni di fabbrica');
await A.evaluate((png)=>{const S=window.IECI_T.S();S.trust.bgroups=[{id:'g1',t:'Sicurezza',items:[{name:'Axis',img:png},{name:'Hanwha',img:png}]},{id:'g2',t:'Civile',items:[{name:'Bticino',img:png},{name:'Vimar',img:png},{name:'Ave',img:png}]}];window.IECI_T.touch();},PNG);
await A.waitForTimeout(800);
ok(!(await A.evaluate(()=>window.IECI_T.isFactory())),'dopo la personalizzazione non è più di fabbrica');
// 1) salvataggio: ricarico
await A.reload();await A.waitForTimeout(1500);
const n1=await A.evaluate(()=>window.IECI_T.S().trust.bgroups.reduce((a,g)=>a+g.items.length,0));
ok(n1===5,'i loghi restano dopo la riapertura ('+n1+')');
// 2) archivio che A manderebbe a GitHub (su=0, mai "timbrato")
const payload=await A.evaluate(()=>{const p=window.IECI_T.payload();p.su=0;return p;});
ok(payload.trust.bgroups.length===2&&payload.su===0,'payload contiene i loghi (su=0 come un archivio vecchio)');
// 3) DISPOSITIVO B nuovo e vuoto sincronizza: deve PRENDERE i loghi
const B=await (await b.newContext()).newPage();B.on('pageerror',e=>errs.push(e.message));
await B.goto(URL);await B.waitForTimeout(1500);
await B.evaluate((p)=>window.IECI_T.merge(p),payload);await B.waitForTimeout(800);
const nb=await B.evaluate(()=>window.IECI_T.S().trust.bgroups.reduce((a,g)=>a+g.items.length,0));
ok(nb===5,'dispositivo nuovo adotta i loghi dell\'archivio ('+nb+')');
const pb=await B.evaluate(()=>window.IECI_T.payload());
ok(pb.trust.bgroups.reduce((a,g)=>a+g.items.length,0)===5,'e ciò che rimanda su GitHub conserva i loghi');
// 4) dispositivo con impostazioni sue e archivio con su piu vecchio: salva una copia prima
const C=await (await b.newContext()).newPage();C.on('pageerror',e=>errs.push(e.message));
await C.goto(URL);await C.waitForTimeout(1500);
await C.evaluate(()=>{const S=window.IECI_T.S();S.company.name='Ditta C';window.IECI_T.touch();});await C.waitForTimeout(600);
await C.evaluate((p)=>{p.su=Date.now()+1000;window.IECI_T.merge(p);},payload);await C.waitForTimeout(1200);
const nc=await C.evaluate(()=>window.IECI_T.S().trust.bgroups.reduce((a,g)=>a+g.items.length,0));
ok(nc===5,'archivio più recente: impostazioni aggiornate');
const snaps=await C.evaluate(()=>new Promise(r=>{const q=indexedDB.open('preventivi-ieci',1);q.onsuccess=()=>{const g=q.result.transaction('kv').objectStore('kv').get('snaps');g.onsuccess=()=>r((g.result||[]).map(s=>s.why));}}));
console.log(JSON.stringify(snaps));ok(snaps.some(w=>/unire/.test(w)),'copia di sicurezza fatta prima di sovrascrivere');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
