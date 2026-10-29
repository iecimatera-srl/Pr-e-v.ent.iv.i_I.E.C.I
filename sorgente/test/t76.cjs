// Marca nelle righe e collegamento nei due sensi tra righe del preventivo e schede Prodotti (nome e marca)
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:430,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SRC);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S,null,{timeout:20000}).catch(()=>{});
const S=(f,a)=>p.evaluate(f,a);
await S(()=>{ const s=window.IECI_T.S(); s.model='dom'; s.products=[]; s.lines=[{d:'Presa con USB',u:'cad',q:2,p:58,s:0},{d:'Presa con USB (Sala)',u:'cad',q:1,p:58,s:0},{d:'Manodopera oraria',u:'h',q:4,p:38,s:0}];
  window.IECI_T.linkLine(s.lines[0],{force:true}); s.lines[1].pid=s.lines[0].pid; window.IECI_T.touch(); });
await S(()=>window.IECI_T.renderAll&&window.IECI_T.renderAll());
await A.mostra(p,'#lines'); await S(()=>document.querySelector('.tab[data-m="dom"]')&&document.querySelector('.tab[data-m="dom"]').click()); await p.waitForTimeout(300);
let st=await S(()=>[...document.querySelectorAll('#lines .line')].map(r=>!!r.querySelector('[data-f="br"]')));
ok(st[0]&&st[1]&&!st[2],'campo Marca sulle voci di materiale (non sulla manodopera)');
ok(await S(()=>!!document.querySelector('#lines .line .lbr-k')),'si vede che la riga è collegata alla scheda');

// 1. marca scritta nella riga -> scheda e altre righe dello stesso prodotto
await p.click('#lines .line[data-i="0"] [data-f="br"]'); await p.keyboard.type('Vimar',{delay:20}); await p.waitForTimeout(150);
st=await S(()=>({act:document.activeElement&&document.activeElement.getAttribute('data-f'),l0:window.IECI_T.S().lines[0].br,l1:window.IECI_T.S().lines[1].br,pb:window.IECI_T.S().products[0].brand,v1:document.querySelector('#lines .line[data-i="1"] [data-f="br"]').value}));
console.log(JSON.stringify(st));
ok(st.act==='br'&&st.l0==='Vimar'&&st.pb==='Vimar','riga → scheda: marca Vimar, senza perdere il campo mentre scrivi');
ok(st.l1==='Vimar'&&st.v1==='Vimar','anche l\'altra riga dello stesso prodotto');
await p.keyboard.press('Tab'); await p.waitForTimeout(500);
ok(await S(()=>/Marca: Vimar/.test(document.getElementById('doc').innerText)),'nel fascicolo: «Marca: Vimar»');

// 2. nome cambiato nella scheda Prodotti -> righe corrette (anche quella con testo in più)
await A.mostra(p,'#plist'); await S(()=>{ document.querySelector('#plist details.pe').open=true; });
await p.fill('#plist [data-pf="name"]',''); await p.type('#plist [data-pf="name"]','Presa USB-C Eikon',{delay:10});
await p.press('#plist [data-pf="name"]','Tab'); await p.waitForTimeout(400);
st=await S(()=>({d:window.IECI_T.S().lines.map(l=>l.d),t:document.getElementById('toast').textContent}));
console.log(JSON.stringify(st));
ok(st.d[0]==='Presa USB-C Eikon'&&st.d[1]==='Presa USB-C Eikon (Sala)'&&st.d[2]==='Manodopera oraria','scheda → righe: nome aggiornato (e il testo in più resta)');
ok(/anche in 2 righe del preventivo/.test(st.t),'avviso: «aggiornato anche in 2 righe»');
// 3. marca cambiata nella scheda -> righe
await p.fill('#plist [data-pf="brand"]','Bticino'); await p.press('#plist [data-pf="brand"]','Tab'); await p.waitForTimeout(400);
st=await S(()=>window.IECI_T.S().lines.map(l=>l.br||''));
ok(st[0]==='Bticino'&&st[1]==='Bticino'&&st[2]==='','scheda → righe: marca Bticino');
await A.mostra(p,'#lines'); await p.waitForTimeout(200);
st=await S(()=>({v:[...document.querySelectorAll('#lines [data-f="d"]')].map(x=>x.value),b:[...document.querySelectorAll('#lines [data-f="br"]')].map(x=>x.value),sync:document.querySelectorAll('#lines .line.sync').length}));
console.log(JSON.stringify(st));ok(st.v[0]==='Presa USB-C Eikon'&&st.b[0]==='Bticino'&&st.sync>=2,'nelle righe si vede subito, evidenziato');
await p.waitForTimeout(400);
ok(await S(()=>/Presa USB-C Eikon/.test(document.getElementById('doc').innerText)&&/Marca: Bticino/.test(document.getElementById('doc').innerText)),'fascicolo aggiornato');

// 4. nome cambiato nella riga -> scheda (anche se la scheda era stata rinominata a mano)
await S(()=>{ const s=window.IECI_T.S(); s.lines.splice(1,1); window.IECI_T.touch(); }); await S(()=>window.IECI_T.renderAll()); await p.waitForTimeout(200);
await p.click('#lines .line[data-i="0"] [data-f="d"]'); await p.keyboard.press('End'); await p.keyboard.type(' nera'); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
ok(await S(()=>window.IECI_T.S().products[0].name==='Presa USB-C Eikon nera'),'riga → scheda: nome aggiornato');

// 5. una marca per tutte le voci
await S(()=>{ const s=window.IECI_T.S(); s.lines.push({d:'Interruttore unipolare 10 A',u:'cad',q:3,p:22,s:0}); window.IECI_T.touch(); }); await S(()=>window.IECI_T.renderAll()); await p.waitForTimeout(200);
await p.fill('#l-brall','Vimar'); await p.click('#l-brgo'); await p.waitForTimeout(300);
st=await S(()=>window.IECI_T.S().lines.map(l=>(l.br||'')+'|'+l.d));
console.log(JSON.stringify(st));
ok(st.filter(x=>x.startsWith('Vimar|')).length===2&&st.some(x=>x==='|Manodopera oraria')&&await S(()=>window.IECI_T.S().products[0].brand==='Vimar'),'«Marca per tutte»: materiali e schede, non la manodopera');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
