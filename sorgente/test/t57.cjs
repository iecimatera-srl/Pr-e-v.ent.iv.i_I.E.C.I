const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(require('./_amb.cjs').SRC);await p.waitForTimeout(1500);
// vecchio stato: listini come prima (12 voci senza gruppo, prezzo personalizzato)
const r=await p.evaluate(()=>{const T=window.IECI_T;const st=JSON.parse(JSON.stringify(T.S()));
 const old={vid:[['Telecamera IP 4 MP bullet PoE','cad',199],['Posa cavo UTP cat. 6','m',2.8],['Voce mia','cad',7]],fv:[['Modulo fotovoltaico 430 Wp','cad',111]]};
 st.cat.vid=old.vid;st.cat.fv=old.fv;delete st.__cat2;st.cgroups={};
 const n=T.normalize(st);const g=k=>n.cat[k].filter(x=>x[0]===k);
 const v=n.cat.vid, f=n.cat.fv;const tel=v.find(x=>x[0]==='Telecamera IP 4 MP bullet PoE');
 return {nv:v.length,tel:tel,mia:v.some(x=>x[0]==='Voce mia'),mod:f.find(x=>x[0].startsWith('Modulo fotovoltaico 430 Wp')),gv:n.cgroups.vid,twice:(()=>{const m=T.normalize(JSON.parse(JSON.stringify(n)));return m.cat.vid.length})()}});
console.log(JSON.stringify(r));
ok(r.tel[2]===199&&r.tel[3]==='Telecamere','prezzo personalizzato mantenuto, gruppo assegnato');
ok(r.mia,'voce personale mantenuta');ok(r.nv>=30&&r.twice===r.nv,'voci aggiunte una sola volta');ok(r.mod[2]===111&&r.mod[3]==='Moduli e inverter','fv: prezzo mantenuto');
ok(r.gv[0]==='Telecamere','ordine dei gruppi di fabbrica');
for(const k of ['dom','vid','all','aut','fv','tv','ind','sw']){
 await p.click('[data-m="'+k+'"]');await p.waitForTimeout(300);
 const g=await p.$$eval('#cat .cgh',e=>e.length),n=await p.$$eval('#cat .crow',e=>e.length);
 const cov=await p.evaluate(()=>{const c=document.querySelector('#doc .page.cover');return (c.querySelector('svg.circuit')||{innerHTML:''}).innerHTML.length});
 const t=await p.inputValue('#m-title');
 console.log(k,g,n,cov,t);ok(g>=5&&n>=18&&cov>300,k+': gruppi/voci/copertina');}
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
