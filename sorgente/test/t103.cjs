// Protezioni dei salvataggi: un dispositivo con una versione dell'app troppo vecchia per l'archivio non unisce e non
// scrive nulla (e lo dice); la versione minima non scende mai; avviso se un altro dispositivo ha una versione più nuova;
// una copia di sicurezza al giorno, leggera (le foto restano su GitHub come file)
const A=require('./_amb.cjs'); const G=require('./_github_finto.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch(); const errs=[];
const ctx=await b.newContext({viewport:{width:1366,height:900}}); await G.finto(ctx); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>d.accept());
await p.goto(A.SA); await p.waitForTimeout(1500); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.ghSync,null,{timeout:30000});
const attesa=async()=>{ await p.waitForTimeout(500); await p.waitForFunction(()=>!window.IECI_T.ghBusy(),null,{timeout:60000}); await p.waitForTimeout(300); };
const S=(f,a)=>p.evaluate(f,a); await attesa();
const VER=await S(()=>document.documentElement.innerHTML.match(/APP_VER = '([^']+)'/)?document.documentElement.innerHTML.match(/APP_VER = '([^']+)'/)[1]:'');
await S(()=>{ const T=window.IECI_T, s=T.S(); s.client.name='Mario Bianchi'; s.lines=[{d:'Quadro',u:'cad',q:1,p:300,s:0}]; T.saveQuote(false); });
await S(()=>window.IECI_T.ghSync(false)); await attesa();
let o=G.grezzo();
ok(o.v===3&&o.min&&o.app,'l\'archivio porta la versione dell\'app che l\'ha scritto ('+o.app+') e la versione minima per leggerlo ('+o.min+')');
// un altro dispositivo con un'app più nuova alza la versione minima oltre la nostra
o.min='2099.1.1.1'; o.app='2099.1.1.1'; o.db.quotes.push({id:'zz',num:'X',st:'bozza',client:'Dal futuro',tot:1,upd:Date.now()+1e6,model:'dom',data:{client:{name:'Dal futuro'},lines:[],products:[]}}); G.scrivi(o);
const put0=G.stato.put;
await S(()=>window.IECI_T.ghSync(false)); await attesa();
let st=await S(()=>({q:window.IECI_T.DB().quotes.some(x=>x.client==='Dal futuro'),msg:document.getElementById('gh-state').textContent}));
ok(!st.q&&G.stato.put===put0,'versione dell\'app troppo vecchia per l\'archivio: non unisce e non scrive nulla');
ok(/versione vecchia dell'app/.test(st.msg)&&/2099\.1\.1\.1/.test(st.msg),'e spiega cosa fare: «'+st.msg.slice(0,120)+'…»');
// avviso di versione più nuova (che però resta leggibile)
o=G.grezzo(); o.min='2026.11.16.5'; o.app='2099.1.1.1'; G.scrivi(o);
await S(()=>window.IECI_T.ghSync(false)); await attesa(); await p.waitForTimeout(1700);
st=await S(()=>({q:window.IECI_T.DB().quotes.some(x=>x.client==='Dal futuro'),t:document.getElementById('toast').innerText}));
ok(st.q&&/versione più nuova dell'app/.test(st.t),'archivio leggibile ma scritto da una versione più nuova: unisce e avvisa di aggiornare');
ok(G.grezzo().min==='2026.11.24.1','la versione minima non scende mai sotto quella necessaria');
o=G.grezzo(); o.min='2026.11.16.4'; G.scrivi(o); await S(()=>window.IECI_T.ghSync(false)); await attesa();
ok(G.grezzo().min==='2026.11.24.1','se un archivio dice una minima più bassa, si rialza alla minima giusta');
// copia di sicurezza del giorno: una sola al giorno e leggera
st=await S(()=>new Promise(r=>{ const T=window.IECI_T; T.kvGet?r(null):r(null); }));
const snaps=await S(()=>new Promise(r=>{ const q=indexedDB.open('preventivi-ieci',1); q.onsuccess=()=>{ const g=q.result.transaction('kv').objectStore('kv').get('snaps'); g.onsuccess=()=>r((g.result||[]).map(s=>({why:s.why,kb:Math.round(s.json.length/1024),light:/"leggera":1/.test(s.json)}))); }; }));
console.log(JSON.stringify(snaps));
const giorno=snaps.filter(s=>s.why==='Copia automatica del giorno');
ok(giorno.length===1,'una copia di sicurezza del giorno è stata fatta (una sola, anche dopo più sincronizzazioni)');
ok(giorno[0]&&giorno[0].light,'con GitHub collegato la copia è leggera (le foto restano su GitHub come file)');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
