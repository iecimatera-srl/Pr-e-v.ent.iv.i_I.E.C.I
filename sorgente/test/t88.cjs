// Totale libero con le proposte A/B (confronto marche), con impianti a confronto del videocitofono, con «entrambe le soluzioni» e con il totale unico:
// la cifra scritta deve arrivare nei totali, nel fascicolo, nel messaggio e restare dopo la riapertura; recupero dei totali salvati nel posto sbagliato
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.totals&&window.IECI_T.S,null,{timeout:30000});
const S=(f,a)=>p.evaluate(f,a);
const docTxt=()=>S(()=>document.getElementById('doc').innerText);
const typeIn=async(sel,v)=>{await A.mostra(p,sel);await p.fill(sel,v);await p.waitForTimeout(250);};

// 1. Proposte A/B in un preventivo normale
await A.mostra(p,'#tabs');await p.click('#tabs [data-m="dom"]');await p.waitForTimeout(300);
await S(()=>{const s=window.IECI_T.S();s.lines=[];s.products=[];s.econ.mode='righe';s.econ.vat='incl';window.IECI_T.renderAll();});
await A.mostra(p,'#br-on');await p.check('#br-on');await p.waitForTimeout(400);
await S(()=>{const s=window.IECI_T.S(),l=s.cmp.sys;l[0].b='Bticino';l[1].b='Vimar';
  s.lines.push({d:'Punto luce',u:'cad',q:10,p:40,s:0,tm:[0],sy:l[0].id});s.lines.push({d:'Punto luce',u:'cad',q:10,p:45,s:0,tm:[1],sy:l[1].id});window.IECI_T.renderAll();window.IECI_T.touch();});
await A.mostra(p,'#econ-box');await p.selectOption('#econ-box [data-b="econ.mode"]','totale');await p.waitForTimeout(400);
let st=await S(()=>({f:[...document.querySelectorAll('#econ-box input[type=number][data-b]')].map(e=>e.getAttribute('data-b')),pre:window.IECI_T.S().cmp.sys.map(x=>x.tot)}));
ok(st.f.join()==='cmp.sys.0.tot,cmp.sys.1.tot','le caselle del totale scrivono nelle proposte ('+st.f.join()+')');
ok(st.pre.every(v=>+v>0),'passando al totale libero le caselle partono dalla somma delle voci '+JSON.stringify(st.pre));
await S(()=>{const s=window.IECI_T.S();s.cmp.sys[1].tot='';window.IECI_T.renderAll();});await p.waitForTimeout(300);
st=await S(()=>window.IECI_T.ckList().filter(x=>x.a==='tot').map(x=>x.l+':'+x.t));
ok(st.length===1&&/^err:Totale a zero per «Proposta Vimar»/.test(st[0]),'controllo prima dell\'invio: segnala la proposta con il totale a zero '+JSON.stringify(st));
await typeIn('#econ-box [data-b="cmp.sys.0.tot"]','3500');await typeIn('#econ-box [data-b="cmp.sys.1.tot"]','4200.50');
await p.waitForTimeout(1500);
st=await S(()=>{const T=window.IECI_T;return {a:T.totals(0).tot,b:T.totals(1).tot,h:T.headTotal(),cs:T.S().cond.sys,ia:T.totals(0).imp,iv:+T.S().meta.iva};});
ok(st.a===3500&&st.b===4200.5,'Proposta A 3.500 € e Proposta B 4.200,50 € (non più 0): '+st.a+' / '+st.b);
ok(Math.abs(st.ia-3500/(1+st.iv/100))<0.02,'IVA scorporata giusta dal totale IVA inclusa: imponibile '+st.ia);
ok(/3\.500,00/.test(st.h),'in testa: «da '+st.h+'»');
ok(Array.isArray(st.cs)&&!st.cs.length,'nessun dato finisce nel videocitofono');
let d=await docTxt();
ok(/3\.500,00/.test(d)&&/4\.200,50/.test(d),'il fascicolo mostra i due totali');
ok(await S(()=>/3\.500,00/.test(document.getElementById('br-sys').innerText)),'il riquadro delle proposte mostra il totale');
await S(()=>{const s=window.IECI_T.S();s.tiers.sel=1;window.IECI_T.renderAll();window.IECI_T.touch();});await p.waitForTimeout(600);
ok(/4\.200,50/.test(await S(()=>window.IECI_T.headTotal())),'scelta la Proposta B, il totale accettato è 4.200,50');
await S(()=>{const s=window.IECI_T.S();s.tiers.sel=-1;window.IECI_T.touch();});
// IVA esclusa
await p.selectOption('#econ-box [data-b="econ.vat"]','excl');await p.waitForTimeout(500);
st=await S(()=>window.IECI_T.totals(0));
ok(st.imp===3500&&st.tot===4270,'IVA esclusa: 3.500 + IVA 22% = 4.270');
await p.selectOption('#econ-box [data-b="econ.vat"]','incl');await p.waitForTimeout(300);
// riapertura
await p.waitForTimeout(1500);await p.reload();await p.waitForTimeout(2000);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.totals&&window.IECI_T.S);
st=await S(()=>({a:window.IECI_T.totals(0).tot,b:window.IECI_T.totals(1).tot,v:[...document.querySelectorAll('#econ-box input[data-b^="cmp.sys"]')].map(e=>e.value)}));
ok(st.a===3500&&st.b===4200.5&&st.v.map(Number).join()==='3500,4200.5','riaprendo l\'app i totali restano e le caselle li mostrano '+JSON.stringify(st));

// 2. recupero dei totali scritti con la versione difettosa
st=await S(()=>{const T=window.IECI_T,o=JSON.parse(JSON.stringify(T.S()));o.cmp.sys.forEach(x=>x.tot='');o.cond.sys={0:{tot:'2800'},1:{tot:'3100'}};const n=T.normalize(o);return {t:n.cmp.sys.map(x=>x.tot),c:n.cond.sys};});
ok(st.t.join()==='2800,3100'&&Array.isArray(st.c)&&!st.c.length,'preventivi salvati prima: i totali scritti vengono recuperati '+JSON.stringify(st));

// 3. videocitofono, impianti di marche diverse
await A.mostra(p,'#tabs');await p.click('#tabs [data-m="vcit"]');await p.waitForTimeout(300);
await S(()=>{const s=window.IECI_T.S();s.lines=[];s.products=[];s.econ.mode='righe';window.IECI_T.renderAll();});
await A.mostra(p,'[data-vck="brands"]');await p.click('[data-vck="brands"]');await p.waitForTimeout(500);
await A.mostra(p,'[data-vcp="totale"]');await p.click('[data-vcp="totale"]');await p.waitForTimeout(400);
st=await S(()=>[...document.querySelectorAll('#vc-tot input[data-b]')].map(e=>e.getAttribute('data-b')));
ok(st.join()==='cond.sys.0.tot,cond.sys.1.tot','videocitofono, marche a confronto: caselle sugli impianti');
await typeIn('#vc-tot [data-b="cond.sys.0.tot"]','5000');await typeIn('#vc-tot [data-b="cond.sys.1.tot"]','6200');await p.waitForTimeout(1200);
st=await S(()=>({a:window.IECI_T.totals(0).tot,b:window.IECI_T.totals(1).tot}));
ok(st.a===5000&&st.b===6200,'impianti a confronto: 5.000 e 6.200');
d=await docTxt();ok(/5\.000,00/.test(d)&&/6\.200,00/.test(d),'fascicolo del videocitofono con i due totali');

// 4. videocitofono, entrambe le soluzioni
await A.mostra(p,'[data-vck="both"]');await p.click('[data-vck="both"]');await p.waitForTimeout(500);
st=await S(()=>[...document.querySelectorAll('#vc-tot input[data-b]')].map(e=>e.getAttribute('data-b')));
ok(st.join()==='cond.tc,cond.tv','videocitofono, entrambe: casella per citofono e videocitofono');
await typeIn('#vc-tot [data-b="cond.tc"]','2900');await typeIn('#vc-tot [data-b="cond.tv"]','4400');await p.waitForTimeout(1200);
st=await S(()=>({a:window.IECI_T.totals(0).tot,b:window.IECI_T.totals(1).tot}));
ok(st.a===2900&&st.b===4400,'entrambe le soluzioni: 2.900 e 4.400');

// 5. totale unico
await A.mostra(p,'#tabs');await p.click('#tabs [data-m="dom"]');await p.waitForTimeout(300);
await S(()=>{const s=window.IECI_T.S();s.cmp.on=false;s.tiers.on=false;s.lines=[{d:'Quadro',u:'cad',q:1,p:300,s:0}];window.IECI_T.renderAll();window.IECI_T.touch();});
await A.mostra(p,'#econ-box');await p.selectOption('#econ-box [data-b="econ.mode"]','totale');await p.waitForTimeout(300);
await typeIn('#econ-box [data-b="econ.total"]','1890');await p.waitForTimeout(1200);
ok(await S(()=>window.IECI_T.totals().tot===1890)&&/1\.890,00/.test(await docTxt()),'totale unico: 1.890 € nei conti e nel fascicolo');
ok(await S(()=>!window.IECI_T.ckList().some(x=>x.a==='tot')),'con i totali scritti il controllo non segnala nulla');
await S(()=>{const s=window.IECI_T.S();s.econ.total='';window.IECI_T.renderAll();});
ok(await S(()=>window.IECI_T.ckList().some(x=>x.a==='tot'&&/Il totale libero è a zero/.test(x.t))),'totale unico vuoto: il controllo lo segnala');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
