// Assistente potenziato: richieste brevi, errori di battitura, serie delle marche, comandi sul preventivo aperto, parole imparate
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(A.SRC);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S,null,{timeout:20000}).catch(()=>{});
const S=(f,a)=>p.evaluate(f,a);
const vuoto=()=>S(()=>{ const s=window.IECI_T.S(); s.lines=[]; });
const prepara=async t=>{ await A.mostra(p,'#as-txt'); await p.fill('#as-txt',t); await p.click('#as-go'); await p.waitForTimeout(150); return S(()=>{ const o=document.getElementById('as-out'); return {txt:o.innerText,tit:(document.getElementById('as-tit')||{}).value||'',righe:[...o.querySelectorAll('.as-r')].map(r=>({d:r.querySelector('.as-d').childNodes[0].textContent,q:+r.querySelector('.as-q').value,p:(r.querySelector('.as-p')||{}).textContent||''})),mods:[...o.querySelectorAll('.as-mod')].map(m=>m.innerText.replace(/\s+/g,' ').trim())}; }); };
const riga=(r,re)=>r.righe.find(x=>re.test(x.d));

// --- richieste brevi
await vuoto();
let r=await prepara('citofono 10');
ok(/Videocitofonia/.test(r.txt)&&/Condomini 10 · solo citofono/.test(r.txt)&&riga(r,/Posto interno citofono/).q===10,'«citofono 10»: citofono per 10 condomini');
r=await prepara('fv 6 con batteria 10');
ok(riga(r,/Modulo fotovoltaico/).q===14&&riga(r,/Batteria di accumulo 10/)&&r.tit==='Impianto fotovoltaico 6 kWp con accumulo 10 kWh','«fv 6 con batteria 10»: 6 kWp con 10 kWh');
r=await prepara('wallbox 22 25m');
ok(riga(r,/Wallbox trifase 22/)&&riga(r,/5G6/).q===25,'«wallbox 22 25m»');
r=await prepara('8 cam 4 mp');
ok(riga(r,/Telecamera IP 4 MP/).q===8,'«8 cam 4 mp»: 8 telecamere');
r=await prepara('fotovoltaico 4.5 senza batteria');
ok(riga(r,/Modulo fotovoltaico/).q===11&&!riga(r,/Batteria/),'«senza batteria»: niente accumulo');

// --- errori di battitura
r=await prepara('fotovoltacio 4 kw');
ok(/Fotovoltaico/.test(r.txt)&&riga(r,/Modulo fotovoltaico/).q===10,'«fotovoltacio» capito');
r=await prepara('vidocitofono per 6 condomini');
ok(/Videocitofonia/.test(r.txt)&&riga(r,/Monitor interno/).q===6,'«vidocitofono» capito');
r=await prepara('telecamre 5');
ok(riga(r,/Telecamera IP/).q===5,'«telecamre 5» capito');

// --- serie delle marche
r=await prepara('Trilocale Vimar Plana per Bianchi Anna');
ok(/Appartamento/.test(r.txt)&&/Marca Vimar Plana/.test(r.txt)&&/Bianchi Anna/.test(r.txt)&&/CAMERA DA LETTO 2/i.test(r.txt)&&/CORRIDOIO/i.test(r.txt),'«trilocale Vimar Plana»: stanze, marca e serie, cliente');
r=await prepara('Classe 300 per 8 condomini');
ok(/Videocitofonia/.test(r.txt)&&/Marca Bticino Classe 300/.test(r.txt),'«Classe 300» = videocitofono Bticino');
r=await prepara('Robus 600 con 2 telecomandi');
ok(riga(r,/cancello scorrevole/)&&/Nice Robus/.test(r.txt)&&riga(r,/Radiocomando/).q===2,'«Robus» = cancello scorrevole Nice');

// --- «ho capito» mentre scrivi
await p.fill('#as-txt',''); await p.type('#as-txt','fv 6 con batteria 10',{delay:5}); await p.waitForTimeout(500);
let live=await S(()=>document.getElementById('as-live').innerText);
ok(/Ho capito/.test(live)&&/Fotovoltaico/.test(live)&&/6 kWp/.test(live),'mentre scrivi: «ho capito» ('+live.replace(/\n/g,' ')+')');

// --- comandi sul preventivo aperto
await vuoto(); await prepara('bilocale per Verdi'); await p.click('#as-ok'); await p.waitForTimeout(400);
let st=await S(()=>{ const s=window.IECI_T.S(); const cu=s.rooms.find(x=>x.kind==='cu'); const pr=s.lines.find(l=>l.r===cu.id&&/^Punto presa 10\/16/.test(l.d)); return {rooms:s.rooms.length,prese:pr?pr.q:0,quadro:s.lines.filter(l=>/^Quadro/.test(l.d)).length,n:s.lines.length}; });
console.log(JSON.stringify(st));
ok(st.rooms===5&&st.quadro>=1,'bilocale creato');
r=await prepara('aggiungi 3 prese in cucina, togli il quadro, sconto 10%');
console.log(JSON.stringify(r.mods));
ok(/Modifiche al preventivo aperto/i.test(r.txt)&&r.mods.some(m=>/togli Quadro/i.test(m))&&r.mods.some(m=>/Sconto 10%/.test(m))&&riga(r,/^Punto presa 10\/16/).q===3,'anteprima delle modifiche: aggiungi, togli, sconto');
ok(await S(()=>document.getElementById('as-add').textContent==='Applica le modifiche'&&!document.getElementById('as-ok')),'un solo pulsante: «Applica le modifiche»');
await p.click('#as-add'); await p.waitForTimeout(400);
let st2=await S(()=>{ const s=window.IECI_T.S(); const cu=s.rooms.find(x=>x.kind==='cu'); const pr=s.lines.filter(l=>l.r===cu.id&&/^Punto presa 10\/16/.test(l.d)); return {prese:pr.map(l=>l.q),quadro:s.lines.filter(l=>/^Quadro/.test(l.d)).length,disc:s.meta.disc,n:s.lines.length,cli:s.client.name}; });
console.log(JSON.stringify(st2));
ok(st2.prese.length===1&&st2.prese[0]===st.prese+3,'prese in cucina: la stessa riga aumenta di 3');
ok(st2.quadro===0&&st2.disc===10,'quadro tolto, sconto 10%');
r=await prepara('porta i punti luce in cucina a 5');
ok(r.mods.some(m=>/Punto luce semplice · Cucina: \d+ → 5/i.test(m)),'«porta i punti luce in cucina a 5»');
await p.click('#as-add'); await p.waitForTimeout(300);
ok(await S(()=>{ const s=window.IECI_T.S(); const cu=s.rooms.find(x=>x.kind==='cu'); return s.lines.find(l=>l.r===cu.id&&l.d==='Punto luce semplice').q===5; }),'quantità cambiata nella stanza giusta');
r=await prepara('togli il rilevatore di gas e lo scaricatore di sovratensione');
console.log(JSON.stringify(r.mods));
ok(r.mods.some(m=>/^togli Rilevatore di gas/i.test(m))&&r.mods.some(m=>/^togli Scaricatore/i.test(m)),'«togli X e Y»: il comando vale per entrambi');
r=await prepara('togli il rilevatore di fumo');
ok(!r.mods.length&&/Non ho trovato «rilevatore di fumo»/.test(r.txt),'non toglie la voce sbagliata (fumo ≠ gas)');
await p.click('#as-x');

// --- parole imparate
r=await prepara('aggiungi 3 ciabattine');
ok(/Non ho trovato nel listino/.test(r.txt)&&await S(()=>!!document.querySelector('[data-asl="0"]')),'parola sconosciuta: posso insegnarla');
const idx=await S(()=>[...document.querySelectorAll('[data-asl="0"] optgroup:last-child option')].find(o=>/^Presa con USB/.test(o.textContent)).value);
await p.selectOption('[data-asl="0"]',idx); await p.waitForTimeout(200);
r=await S(()=>({t:document.getElementById('as-out').innerText,par:(window.IECI_T.DB().parole||[]).map(x=>x.k+'='+x.d).join(',')}));
ok(/Presa con USB/.test(r.t)&&/imparata/i.test(r.t)&&r.par==='ciabattine=Presa con USB','imparata e aggiunta all\'anteprima');
await p.click('#as-x');
r=await prepara('aggiungi 5 ciabattine');
ok(riga(r,/^Presa con USB/).q===5&&/imparata/.test(riga(r,/^Presa con USB/).p),'la volta dopo la capisce da sola');
ok(await S(()=>!document.getElementById('as-par-d').hidden&&/ciabattine/.test(document.getElementById('as-par').textContent)),'elenco «Parole che ho imparato»');
await S(()=>document.querySelector('[data-asdel]').click());
ok(await S(()=>(window.IECI_T.DB().parole||[]).length===0),'parola dimenticata');
await p.click('#as-x');

// --- videocitofono aperto: «metti 14 condomini»
await vuoto(); await prepara('videocitofono 8 condomini'); await p.click('#as-ok'); await p.waitForTimeout(300);
r=await prepara('metti 14 condomini');
ok(r.mods.some(m=>/Condomini: 8 → 14/.test(m)),'«metti 14 condomini» sul videocitofono aperto');
await p.click('#as-add'); await p.waitForTimeout(300);
ok(await S(()=>{ const s=window.IECI_T.S(); return s.cond.n===14&&s.lines.filter(l=>l.pc).every(l=>l.q===14); }),'condomini e quantità aggiornati');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
