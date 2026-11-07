// Preventivo «Illuminazione»: listino dedicato, copertina disegnata, calcolatori grafici (strip LED, faretti per stanza),
// voci aggiunte con i numeri giusti, assistente che capisce fari/faretti/plafoniere/strip, riepilogo luce nel fascicolo
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const ctx=await b.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.luStripCalc,null,{timeout:30000});
const S=(f,a)=>p.evaluate(f,a);
await S(()=>{ const s=window.IECI_T.S(); s.lines=[]; s.products=[]; window.IECI_T.renderAll(); });

// 1. il tipo «Illuminazione»
ok(await S(()=>!document.getElementById('acc-lu')||document.getElementById('acc-lu').hidden),'negli altri tipi i calcolatori luce non ci sono');
await A.mostra(p,'#tabs'); await p.click('#tabs [data-m="luce"]'); await p.waitForTimeout(400); await A.mostra(p,'#cat');
let st=await S(()=>({m:window.IECI_T.S().model,t:window.IECI_T.S().meta.title,lu:!document.getElementById('acc-lu').hidden,cat:document.getElementById('cat').innerText}));
ok(st.m==='luce'&&st.t==='Impianto di illuminazione'&&st.lu,'nuovo tipo «Illuminazione»: titolo e calcolatori luce');
ok(['Faretti','Plafoniere e lampade','Fari ed esterni','Strip LED','Comandi e regolazione'].every(g=>new RegExp(g,'i').test(st.cat))&&/Alimentatore LED 24 V 150 W/.test(st.cat)&&/Montaggio lampadario/.test(st.cat),'listino dedicato: faretti, plafoniere, fari, strip LED con alimentatori, comandi, montaggio lampadari');

// 2. strip LED: 14 m RGB in 2 tratti
await A.mostra(p,'#acc-lu');
await p.fill('[data-lu="st.m"]','14'); await p.fill('[data-lu="st.tr"]','2'); await p.selectOption('[data-lu="st.t"]','rgb'); await p.waitForTimeout(200);
st=await S(()=>{ const R=window.IECI_T.luStripCalc(); return {P:R.P,al:R.al,feeds:R.feeds,ct:document.querySelector('[data-lu="st.ct"]').value,svg:!!document.querySelector('[data-luout="st"] svg'),txt:document.querySelector('[data-luout="st"]').innerText}; });
ok(Math.round(st.P)===202&&st.al.w===150&&st.al.n===1&&st.feeds===2&&st.ct==='wifi'&&st.svg,'strip: 202 W, alimentatore 150 W per tratto, 2 punti di alimentazione, comando Wi-Fi proposto per l\'RGB, disegno');
ok(/2 punti/.test(st.txt)&&/0,75 mm²/.test(st.txt),'spiega dove alimentare e che cavo usare');
await p.click('[data-luadd="st"]'); await p.waitForTimeout(400);
st=await S(()=>window.IECI_T.S().lines.map(l=>[l.d,l.q,l.u]));
ok(JSON.stringify(st)===JSON.stringify([['Strip LED RGB / RGBW 24 V',14,'m'],['Profilo in alluminio con diffusore opale',14,'m'],['Alimentatore LED 24 V 150 W',2,'cad'],['Controller RGB / RGBW Wi-Fi con app',2,'cad']]),'«Aggiungi la strip»: strip, profilo, 2 alimentatori, 2 controller '+JSON.stringify(st));
// 12 V: le descrizioni dicono 12 V
await S(()=>{ window.IECI_T.S().lines=[]; }); await p.selectOption('[data-lu="st.v"]','12'); await p.selectOption('[data-lu="st.t"]','w'); await p.fill('[data-lu="st.m"]','4'); await p.fill('[data-lu="st.tr"]','1'); await p.click('[data-luadd="st"]'); await p.waitForTimeout(300);
st=await S(()=>window.IECI_T.S().lines.map(l=>l.d));
ok(/^Strip LED 12 V bianca 14,4 W\/m, 3000 K/.test(st[0])&&st.some(x=>/^Alimentatore LED 12 V 100 W$/.test(x)),'a 12 V le voci lo dicono (strip e alimentatore 12 V) '+JSON.stringify(st));

// 3. faretti per stanza: soggiorno 6 × 4,2 m a 200 lux
await S(()=>{ window.IECI_T.S().lines=[]; });
await p.click('[data-lutab="sp"]'); await p.fill('[data-lu="sp.l"]','6'); await p.fill('[data-lu="sp.w"]','4.2'); await p.waitForTimeout(200);
st=await S(()=>{ const Q=window.IECI_T.luSpotCalc(); return {n:Q.g.n,r:Q.g.r,c:Q.g.c,Em:Math.round(Q.Em),spots:document.querySelectorAll('[data-luout="sp"] svg circle[r="4.2"]').length}; });
ok(st.n===20&&st.r*st.c===20&&st.Em>=200&&st.spots===20,'soggiorno 25,2 m²: 20 faretti in griglia, ≈'+st.Em+' lux, disegnati sulla piantina');
await p.click('[data-luadd="sp"]'); await p.waitForTimeout(300);
st=await S(()=>window.IECI_T.S().lines.map(l=>[l.d,l.q]));
ok(st[0][0]==='Faretto LED da incasso 7 W 3000 K · Soggiorno, fornito e posato'&&st[0][1]===20&&/Foro su cartongesso/.test(st[1][0])&&st[1][1]===20,'«Aggiungi i faretti»: 20 faretti con watt, colore e stanza, più i fori nel cartongesso');
await p.selectOption('[data-lu="sp.r"]','ba'); await p.waitForTimeout(150);
st=await S(()=>({lx:document.querySelector('[data-lu="sp.lx"]').value}));
ok(st.lx==='250','cambiando locale (bagno) cambia la luce consigliata: 250 lux');
await p.click('[data-luadd="sp"]'); await p.waitForTimeout(300);
ok(await S(()=>window.IECI_T.S().lines.some(l=>/^Faretto LED da incasso IP65 7 W 3000 K · Bagno/.test(l.d))),'in bagno il faretto è IP65');

// 4. riepilogo luce nel fascicolo e copertina
await S(()=>{ const s=window.IECI_T.S(); s.lines.push({d:'Proiettore LED 50 W IP65 con sensore di movimento',u:'cad',q:2,p:95,s:0}); s.lines.push({d:'Strip LED 24 V bianca 14,4 W/m, posa inclusa',u:'m',q:10,p:22,s:0}); window.IECI_T.touch(); });
await p.waitForTimeout(1800);
st=await S(()=>{ const d=document.getElementById('doc'); const b=d.querySelector('.lubox'); const cv=d.querySelector('.page svg.circuit'); return {b:b&&b.innerText,cv:cv?cv.innerHTML.length:0,r:window.IECI_T.luRiepilogo()}; });
console.log(JSON.stringify(st.r));
ok(st.b&&/faretti/.test(st.b)&&/2\s*fari/.test(st.b)&&/m di strip LED/.test(st.b)&&/Potenza LED installata/.test(st.b)&&/kWh all'anno/.test(st.b)&&/3000 K/.test(st.b),'fascicolo: «La tua illuminazione in breve» con corpi illuminanti, potenza, consumo e colore della luce');
ok(st.r.W>0&&Math.abs(st.r.W-(st.r.far*7+2*50+10*14.4))<1,'potenza calcolata dalle voci: '+st.r.W+' W');
ok(st.cv>800,'copertina con il disegno dedicato all\'illuminazione');
await A.mostra(p,'#acc-lu'); await p.click('[data-lu="show"]'); await p.waitForTimeout(1500);
ok(await S(()=>!document.querySelector('#doc .lubox')),'tolta la spunta, il riepilogo non compare nel preventivo');

// 5. assistente
st=await S(()=>{ const r=window.IECI_T.asAnalizza('Preventivo illuminazione: 12 faretti nel controsoffitto in cartongesso del soggiorno, 8 metri di strip led rgb nella gola del salone, 3 fari in giardino con sensore di movimento, 2 plafoniere in garage'); return {m:r.model,t:r.titolo,r:r.righe.map(x=>x.q+'|'+x.d)}; });
console.log(JSON.stringify(st));
ok(st.m==='luce'&&/12 faretti, 2 plafoniere, 3 fari e 8 m di strip LED/.test(st.t),'assistente: capisce che è un lavoro di illuminazione');
ok(['12|Faretto LED da incasso fisso 7 W, fornito e posato','3|Proiettore LED 30 W IP65','2|Plafoniera LED 24 W da interno','8|Strip LED RGB / RGBW 24 V','1|Alimentatore LED 24 V 150 W','1|Controller RGB / RGBW Wi-Fi con app','12|Foro su cartongesso o controsoffitto','1|Sensore di movimento / presenza'].every(x=>st.r.indexOf(x)>-1),'assistente: faretti, fari, plafoniere, strip con alimentatore calcolato, controller, fori, sensore');
st=await S(()=>[window.IECI_T.asAnalizza('appartamento con 2 camere, cucina e bagno, 10 faretti in soggiorno').model,window.IECI_T.asAnalizza('impianto elettrico casa con 10 punti luce e 15 prese').model,window.IECI_T.asAnalizza('montare 4 lampadari e 6 applique, 10 metri di strip led cob con dimmer').model]);
ok(st[0]==='app'&&st[1]==='dom'&&st[2]==='luce','gli altri lavori restano riconosciuti come prima (appartamento, impianto di casa)');

// 6. telefono stretto e salvataggio
await A.mostra(p,'#acc-lu'); await p.waitForTimeout(200);
st=await S(()=>{ const o=[]; document.querySelectorAll('#acc-lu *').forEach(e=>{ const r=e.getBoundingClientRect(); if(r.width&&r.right>innerWidth+1) o.push(e.className||e.tagName); }); return o; });
ok(!st.length,'telefono 360 px: niente esce dallo schermo '+JSON.stringify(st.slice(0,3)));
await p.waitForTimeout(1200); await p.reload(); await p.waitForTimeout(2000); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S);
st=await S(()=>({m:window.IECI_T.S().model,l:window.IECI_T.S().luce.sp.l,tab:window.IECI_T.S().luce.tab,show:window.IECI_T.S().luce.show}));
ok(st.m==='luce'&&+st.l===6&&st.tab==='sp'&&st.show===false,'riaprendo l\'app i calcolatori ricordano le scelte');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
