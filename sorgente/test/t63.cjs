const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SRC);await p.waitForTimeout(1500);
const S=(f,a)=>p.evaluate(f,a);
await p.click('[data-m="dom"]');await p.waitForTimeout(200);
await S(()=>{const s=window.IECI_T.S();s.lines=[];s.products=[];window.IECI_T.db().prods.push({id:'lib1',name:'Termostato ambiente Wi-Fi',brand:'Bticino',code:'XW8002',desc:'Termostato smart',photos:['data:image/png;base64,iVBORw0KGgo='],specs:'',link:''});window.IECI_T.touch();});
const addCat=async n=>{await S(n=>{const r=[...document.querySelectorAll('#cat .crow')].find(x=>x.textContent.includes(n));r.querySelector('[data-add]').click();},n);await p.waitForTimeout(250);};
await addCat('Interruttore magnetotermico differenziale');
let st=await S(()=>{const s=window.IECI_T.S();return {l:s.lines.length,pid:s.lines[0].pid,np:s.products.length,link:s.products[0]&&s.products[0].id}});
ok(st.np===1&&st.pid===st.link,'voce e scheda collegate');
ok(/Scheda prodotto: Interruttore/.test(await S(()=>document.querySelector('#lines .pchip').textContent)),'la voce mostra la sua scheda');
// rinomina la voce: la scheda la segue, niente doppioni
const ren=async(i,v)=>{await S(([i,v])=>{const el=document.querySelectorAll('#lines .line [data-f="d"]')[i];el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},[i,v]);await p.waitForTimeout(300);};
await ren(0,'Magnetotermico differenziale Bticino 1P+N 16A');
st=await S(()=>{const s=window.IECI_T.S();return {np:s.products.length,name:s.products[0].name}});
ok(st.np===1&&st.name==='Magnetotermico differenziale Bticino 1P+N 16A','rinominando la voce, la scheda segue (nessun doppione)');
// nome della scheda cambiato a mano + marca: il collegamento resta
await S(()=>{const s=window.IECI_T.S();s.products[0].name='FH81C16';s.products[0].man=true;s.products[0].brand='Bticino';window.IECI_T.touch();});await p.waitForTimeout(300);
await ren(0,'Magnetotermico differenziale 16A');
st=await S(()=>{const s=window.IECI_T.S();return {np:s.products.length,name:s.products[0].name}});
ok(st.np===1&&st.name==='FH81C16','nome scelto a mano sulla scheda rispettato');
ok(/Marca: Bticino/.test(await S(()=>document.querySelector('#doc .qt').innerText)),'la marca resta sulla voce anche con nomi diversi');
// libreria: la scheda nuova prende foto e dati
await addCat('Termostato ambiente Wi-Fi');
st=await S(()=>{const s=window.IECI_T.S();const p=s.products.find(x=>/Termostato/.test(x.name));return p&&{b:p.brand,c:p.code,ph:p.photos.length}});
ok(st&&st.b==='Bticino'&&st.c==='XW8002'&&st.ph===1,'scheda nuova completata dalla libreria prodotti (marca, codice, foto)');
// voce di servizio: niente scheda automatica, ma un tocco la crea
await addCat('Manodopera oraria');
const chips=await S(()=>[...document.querySelectorAll('#lines .pchip')].map(x=>x.textContent));console.log(chips.join(' / '));
ok(/\+ Crea la scheda prodotto/.test(chips[2]),'manodopera: proposta, non automatica');
await S(()=>document.querySelectorAll('#lines .pchip')[2].click());await p.waitForTimeout(300);
ok(await S(()=>window.IECI_T.S().products.some(x=>x.name==='Manodopera oraria')),'un tocco crea la scheda');
// elimina voce con scheda vuota: via anche la scheda
const del=async i=>{await S(i=>document.querySelectorAll('#lines [data-rm]')[i].click(),i);await p.waitForTimeout(300);};
await del(2);
ok(await S(()=>!window.IECI_T.S().products.some(x=>x.name==='Manodopera oraria')),'voce eliminata: scheda vuota eliminata');
// elimina voce con scheda compilata: la scheda resta, segnalata
await del(1);
st=await S(()=>{const s=window.IECI_T.S();return {has:s.products.some(x=>/Termostato/.test(x.name))}});ok(st.has,'scheda con foto e dati conservata');
await S(()=>{document.querySelectorAll('[data-panel]').forEach(s=>s.hidden=s.getAttribute('data-panel')!=='prodotti');});
const warn=await S(()=>[...document.querySelectorAll('#plist .pwarn')].length);ok(warn===1,'segnata come non più nel preventivo');
// apri scheda dalla voce
await S(()=>{document.querySelectorAll('[data-panel]').forEach(s=>s.hidden=s.getAttribute('data-panel')!=='prev');});
// crea dalle righe: riga libera
await S(()=>{const s=window.IECI_T.S();s.lines.push({d:'Telecamera dome 4MP',u:'cad',q:2,p:150,s:0});s.lines.push({d:'Posa cavo',u:'m',q:30,p:2,s:0});window.IECI_T.touch();});
await S(()=>document.getElementById('p-import').click());await p.waitForTimeout(300);
st=await S(()=>{const s=window.IECI_T.S();return {names:s.products.map(x=>x.name),cam:s.lines.find(l=>/Telecamera/.test(l.d)).pid}});console.log(st.names.join(' / '));
ok(st.names.includes('Telecamera dome 4MP')&&!st.names.includes('Posa cavo')&&!!st.cam,'crea le schede mancanti con le stesse regole e collegate');
ok(st.names[0]==='FH81C16'&&st.names[1]==='Telecamera dome 4MP','schede ordinate come le voci');
// articolo fornitore: una sola scheda
const one=await S(()=>{const D=window.IECI_T.db();D.arts.push({id:'art9',name:'Monitor XYZ',code:'M9',brand:'Urmet',um:'cad',price:200,photos:[],desc:'Monitor 7'});return true});
await S(()=>{document.querySelectorAll('[data-panel]').forEach(s=>s.hidden=s.getAttribute('data-panel')!=='prev');});
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
