// Assistente: dal testo al preventivo (senza internet)
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(A.SRC);await p.waitForTimeout(1500);
const S=(f,a)=>p.evaluate(f,a);
const prepara=async t=>{ await A.mostra(p,'#as-txt'); await p.fill('#as-txt',t); await p.click('#as-go'); await p.waitForTimeout(150); return S(()=>{ const o=document.getElementById('as-out'); return {txt:o.innerText,tit:(document.getElementById('as-tit')||{}).value||'',righe:[...o.querySelectorAll('.as-r')].map(r=>({d:r.querySelector('.as-d').childNodes[0].textContent,q:+r.querySelector('.as-q').value,p:(r.querySelector('.as-p')||{}).textContent||''}))}; }); };
const riga=(r,re)=>r.righe.find(x=>re.test(x.d));
ok(await S(()=>!!document.getElementById('acc-as')),'riquadro Assistente nel pannello Preventivo');
ok(await S(()=>document.querySelectorAll('#as-ex [data-asex]').length>=6),'esempi pronti');

// --- appartamento con stanze, cliente e marca
let r=await prepara('Rifacimento impianto appartamento 95 mq per Rossi Mario, via Roma 3, Matera: ingresso, cucina, soggiorno, 2 camere, 2 bagni, Bticino');
ok(/Appartamento/.test(r.txt)&&/Rossi Mario/.test(r.txt)&&/via Roma 3, Matera/.test(r.txt)&&/Marca Bticino/.test(r.txt),'appartamento: tipo, cliente, indirizzo, marca');
ok(/CAMERA DA LETTO 2/i.test(r.txt)&&/BAGNO 2/i.test(r.txt)&&/CUCINA/i.test(r.txt),'appartamento: stanze con le quantità');
ok(r.tit==='Rifacimento impianto elettrico appartamento di 95 mq','appartamento: titolo');
await p.click('#as-ok');await p.waitForTimeout(400);
let st=await S(()=>{const s=window.IECI_T.S();return {model:s.model,rooms:s.rooms.map(x=>x.name),cli:s.client.name+'|'+s.client.addr,tit:s.meta.title,n:s.lines.length,r:s.lines.filter(l=>l.r).length,br:s.lines.filter(l=>l.br==='Bticino').length,pb:s.products.filter(p=>p.brand==='Bticino').length}});
console.log(JSON.stringify(st));
ok(st.model==='app'&&st.rooms.length===7&&st.rooms.includes('Camera da letto 2')&&st.rooms.includes('Bagno 2'),'applicato: stanze create');
ok(st.cli==='Rossi Mario|via Roma 3, Matera'&&st.tit==='Rifacimento impianto elettrico appartamento di 95 mq','applicato: cliente e titolo');
ok(st.n>40&&st.r>30&&st.br===st.n&&st.pb>0,'applicato: voci nelle stanze, con marca e schede prodotto');
ok(await S(()=>/Camera da letto 2/i.test(document.querySelector('#doc').innerText)),'nel fascicolo, divise per stanza');

// --- domestico con quantità esplicite
r=await prepara('casa: 10 punti luce, 15 prese, 4 punti rete, quadro nuovo e 8 ore di manodopera');
ok(riga(r,/^Punto luce semplice/).q===10&&riga(r,/^Punto presa 10\/16/).q===15&&riga(r,/RJ45/).q===4&&riga(r,/^Quadro elettrico/).q===1&&riga(r,/Manodopera/).q===8,'domestico: quantità esplicite');
// aggiungere alle voci attuali
const prima=await S(()=>window.IECI_T.S().lines.length);
ok(await p.$('#as-add')!==null,'con voci già presenti propone anche «Aggiungi»');

// --- videocitofono
r=await prepara('Videocitofono per condominio di 12 condomini, via Lucana 40');
ok(/Videocitofonia/.test(r.txt)&&/Condomini 12/.test(r.txt)&&riga(r,/Monitor interno a colori 7"/).q===12&&!/Non ho trovato/.test(r.txt),'videocitofono: 12 condomini, monitor per ognuno');
await p.click('#as-ok');await p.waitForTimeout(400);
st=await S(()=>{const s=window.IECI_T.S();return {m:s.model,n:s.cond.n,k:s.cond.kind,pc:s.lines.filter(l=>l.pc).map(l=>l.q).join(',')}});
ok(st.m==='vcit'&&st.n===12&&st.k==='video'&&st.pc==='12,12','applicato: videocitofono con quota a condomino');
ok(await S(()=>/a condomino/i.test(document.getElementById('vc-res').innerText)),'quota a condomino calcolata');
r=await prepara('solo citofono per 8 famiglie');
ok(/solo citofono/.test(r.txt)&&riga(r,/Posto interno citofono/).q===8&&!riga(r,/Monitor/),'citofono: solo audio per 8');

// --- fotovoltaico
r=await prepara('Fotovoltaico 6 kW trifase con batteria 10 kWh su tetto a falda per Bianchi Luca, tel 333 1234567');
ok(riga(r,/Modulo fotovoltaico/).q===14&&riga(r,/Batteria di accumulo 10/)&&riga(r,/Inverter trifase/)&&riga(r,/Montaggio/).q===6,'fotovoltaico: moduli, inverter, batteria, kWp');
ok(/Bianchi Luca · 333 1234567/.test(r.txt)&&r.tit==='Impianto fotovoltaico 6 kWp con accumulo 10 kWh','fotovoltaico: cliente, telefono e titolo');

// --- wallbox
r=await prepara('Wallbox 11 kW trifase, 25 metri dal quadro, cliente Verdi Anna');
ok(riga(r,/Wallbox trifase 11/)&&riga(r,/5G6/).q===25&&riga(r,/tipo B/)&&/Verdi Anna/.test(r.txt)&&!riga(r,/^Quadro di protezione/).q!==1,'wallbox: potenza, metri di linea, protezioni, cliente');

// --- automazione
r=await prepara('Cancello scorrevole con 3 telecomandi e app sullo smartphone');
ok(riga(r,/Motore per cancello scorrevole/)&&riga(r,/Radiocomando/).q===3&&riga(r,/Wi-Fi/)&&riga(r,/fotocellule/),'automazione: motore, 3 radiocomandi, app');
ok(r.tit==='Automazione cancello scorrevole','automazione: titolo');

// --- videosorveglianza e allarme
r=await prepara('Videosorveglianza 6 telecamere 4 mp con hard disk 8 tb');
ok(riga(r,/Telecamera IP 4 MP/).q===6&&riga(r,/Hard disk 8 TB/)&&riga(r,/Installazione e puntamento/).q===6&&!/Non ho trovato/.test(r.txt),'videosorveglianza: 6 telecamere e disco 8 TB');
r=await prepara('Allarme radio con app, 5 sensori volumetrici e 6 contatti magnetici');
ok(riga(r,/Sensore volumetrico/).q===5&&riga(r,/Contatto magnetico/).q===6&&riga(r,/radio con app/)&&riga(r,/Posa e fissaggio sensori/).q===11,'allarme: sensori e posa');

// --- modifica in anteprima: togli una voce e cambia una quantità
await S(()=>{const c=document.querySelector('[data-asr="0"]');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));});
await S(()=>{const q=document.querySelector('[data-asq="1"]');q.value='9';q.dispatchEvent(new Event('change',{bubbles:true}));});
await p.click('#as-ok');await p.waitForTimeout(400);
st=await S(()=>{const s=window.IECI_T.S();return {m:s.model,sv:s.lines.some(l=>/Sensore volumetrico/.test(l.d)),cm:(s.lines.find(l=>/Contatto magnetico/.test(l.d))||{}).q}});
ok(st.m==='all'&&!st.sv&&st.cm===9,'anteprima modificabile: voce tolta e quantità cambiata');

// --- confronto tra marche
r=await prepara('Appartamento 80 mq, Bticino oppure Vimar a confronto');
ok(/Proposte a confronto Bticino · Vimar/.test(r.txt)&&/stimate dai 80 mq/.test(r.txt),'confronto marche riconosciuto, stanze stimate dai mq');
await p.click('#as-ok');await p.waitForTimeout(500);
st=await S(()=>{const s=window.IECI_T.S();return {on:s.cmp.on,b:s.cmp.sys.map(x=>x.b).join('|'),a:s.lines.filter(l=>l.tm&&l.tm[0]===0).length,bb:s.lines.filter(l=>l.tm&&l.tm[0]===1).length,brB:s.lines.filter(l=>l.tm&&l.tm[0]===1).every(l=>l.br==='Vimar')}});
console.log(JSON.stringify(st));
ok(st.on&&st.b==='Bticino|Vimar'&&st.a>20&&st.a===st.bb&&st.brB,'applicato: due proposte complete, Bticino e Vimar');
ok(await S(()=>/Le proposte a confronto/i.test(document.querySelector('#doc').innerText)),'nel preventivo: proposte a confronto');

// --- testo non riconosciuto: nessun danno
r=await prepara('ciao come va');
ok(/Non ho riconosciuto voci/.test(r.txt),'testo senza voci: avviso chiaro');
await p.click('#as-x');ok(await S(()=>document.getElementById('as-out').innerHTML===''),'annulla: anteprima chiusa');

// --- dettato: pulsante nascosto se il browser non lo supporta
ok(await S(()=>{const sr=window.SpeechRecognition||window.webkitSpeechRecognition;return !!sr===!document.getElementById('as-mic').hidden;}),'pulsante Detta solo dove il dettato esiste');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
