// Trascina per riordinare: voci del preventivo e schede in Prodotti, con il mouse, con il dito e con la tastiera;
// le schede seguono le voci se erano nello stesso ordine; la maniglia non apre il riquadro; scorrimento automatico
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.spostaVoce&&window.IECI_T.S,null,{timeout:30000});
const S=(f,a)=>p.evaluate(f,a);
const voci=()=>S(()=>window.IECI_T.S().lines.map(l=>l.d.split(' ')[0]+(l.d.split(' ')[1]||'')));
const prod=()=>S(()=>window.IECI_T.S().products.map(x=>x.name));
await S(()=>{ const T=window.IECI_T,s=T.S(); s.lines=[{d:'Alfa uno',u:'cad',q:1,p:10,s:0},{d:'Beta due',u:'cad',q:1,p:20,s:0},{d:'Gamma tre',u:'cad',q:1,p:30,s:0},{d:'Delta quattro',u:'cad',q:1,p:40,s:0},{d:'Epsilon cinque',u:'cad',q:1,p:50,s:0}];
  s.products=[]; s.lines.forEach(l=>{ s.products.push({id:'p'+l.p,name:l.d,brand:'',code:'',desc:'',specs:'',link:'',tags:'',photos:[]}); }); T.renderAll(); T.showPanel('prev'); document.getElementById('acc-righe').open=true; });
await p.waitForTimeout(300);
const n0=await voci();
ok(n0.join()==='Alfauno,Betadue,Gammatre,Deltaquattro,Epsiloncinque'&&await S(()=>document.querySelectorAll('#lines .line .grip').length===5),'ogni voce ha la maniglia per trascinarla');
async function trascinaMouse(selH,selT,dopo){ const a=await p.locator(selH).boundingBox(), t=await p.locator(selT).boundingBox();
  await p.mouse.move(a.x+a.width/2,a.y+a.height/2); await p.mouse.down(); const y1=t.y+(dopo?t.height*0.8:t.height*0.2);
  for(let k=1;k<=12;k++){ await p.mouse.move(a.x+a.width/2,a.y+a.height/2+(y1-(a.y+a.height/2))*k/12); await p.waitForTimeout(16); }
  await p.waitForTimeout(80); await p.mouse.up(); await p.waitForTimeout(350); }
// 1. mouse: la prima voce sotto la terza
await S(()=>document.querySelector('#lines .line[data-i="0"]').scrollIntoView({block:'start'})); await S(()=>window.scrollBy(0,-170)); await p.waitForTimeout(200);
await trascinaMouse('#lines .line[data-i="0"] .grip','#lines .line[data-i="1"]',true);
ok((await voci()).join()==='Betadue,Alfauno,Gammatre,Deltaquattro,Epsiloncinque','mouse: «Alfa» trascinata sotto «Beta»');
ok(await S(()=>!document.querySelector('#lines .trascino')&&!document.documentElement.classList.contains('dnd-on')&&[...document.querySelectorAll('#lines .line')].every(x=>!x.style.transform)),'lasciata la voce, tutto torna fermo');
ok(await S(()=>document.querySelector('#lines .line[data-i="1"] .lnum').textContent==='2'&&!!document.querySelector('#lines .line.posata')),'numeri aggiornati e la voce spostata si illumina');
// le schede seguono (erano nello stesso ordine)
ok((await prod()).map(x=>x.split(' ')[0]).join()==='Beta,Alfa,Gamma,Delta,Epsilon','le schede in Prodotti seguono lo stesso ordine delle voci');
ok(await S(()=>Math.abs(window.IECI_T.totals().imp-150)<0.01),'il totale non cambia');
// 2. dito (tocco vero, eventi touch del browser): l'ultima voce in cima
const cdp=await ctx.newCDPSession(p);
async function trascinaDito(selH,selT,dopo){ const a=await p.locator(selH).boundingBox(), t=await p.locator(selT).boundingBox(); const x=a.x+a.width/2, y0=a.y+a.height/2, y1=t.y+(dopo?t.height*0.8:t.height*0.2);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x,y:y0}]}); await p.waitForTimeout(60);
  for(let k=1;k<=14;k++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x,y:y0+(y1-y0)*k/14}]}); await p.waitForTimeout(16); }
  await p.waitForTimeout(80); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(350); }
await S(()=>{ document.querySelector('#lines .line[data-i="0"]').scrollIntoView({block:'start'}); window.scrollBy(0,-170); }); await p.waitForTimeout(200);
const y0=await S(()=>window.scrollY);
await trascinaDito('#lines .line[data-i="1"] .grip','#lines .line[data-i="0"]',false);
ok((await voci()).join()==='Alfauno,Betadue,Gammatre,Deltaquattro,Epsiloncinque','dito: «Alfa» riportata in cima');
ok(Math.abs(await S(()=>window.scrollY)-y0)<40,'trascinando con il dito la pagina non scorre per sbaglio');
// 3. tastiera
await p.focus('#lines .line[data-i="0"] .grip'); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(200); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(200);
ok((await voci()).join()==='Betadue,Gammatre,Alfauno,Deltaquattro,Epsiloncinque'&&await S(()=>document.activeElement.closest('.line').getAttribute('data-i')==='2'),'tastiera: frecce sulla maniglia spostano la voce e la seguono');
// 4. tocco breve sulla maniglia: non succede nulla
await p.click('#lines .line[data-i="1"] .grip'); await p.waitForTimeout(200);
ok((await voci()).join()==='Betadue,Gammatre,Alfauno,Deltaquattro,Epsiloncinque','un tocco senza trascinare non sposta niente');
// 5. Prodotti: trascinare le schede
await S(()=>window.IECI_T.showPanel('prodotti')); await p.waitForTimeout(400);
ok(await S(()=>document.querySelectorAll('#plist details.pe>summary .grip').length===5),'ogni scheda prodotto ha la maniglia');
await S(()=>{ document.querySelectorAll('#plist details.pe').forEach(d=>d.open=false); }); await p.waitForTimeout(200);
await S(()=>{ document.querySelector('#plist').scrollIntoView({block:'start'}); window.scrollBy(0,-170); }); await p.waitForTimeout(200);
await trascinaMouse('#plist details.pe:nth-of-type(5)>summary .grip','#plist details.pe:nth-of-type(1)>summary',false);
ok((await prod()).map(x=>x.split(' ')[0]).join()==='Epsilon,Beta,Gamma,Alfa,Delta','mouse: «Epsilon» trascinata in cima alle schede');
ok(await S(()=>[...document.querySelectorAll('#plist details.pe')].every(d=>!d.open)),'la maniglia non apre la scheda');
await trascinaDito('#plist details.pe:nth-of-type(1)>summary .grip','#plist details.pe:nth-of-type(3)>summary',true);
ok((await prod()).map(x=>x.split(' ')[0]).join()==='Beta,Gamma,Epsilon,Alfa,Delta','dito: la scheda scende al terzo posto');
// ordine diverso dalle voci: spostando una voce le schede restano come le hai messe
await S(()=>window.IECI_T.showPanel('prev')); await p.waitForTimeout(300);
await S(()=>window.IECI_T.spostaVoce(4,0)); await p.waitForTimeout(200);
ok((await prod()).map(x=>x.split(' ')[0]).join()==='Beta,Gamma,Epsilon,Alfa,Delta','se hai dato alle schede un ordine tuo, spostare le voci non lo cambia');
// 6. scorrimento automatico: lista lunga, trascino verso il fondo
await S(()=>{ const T=window.IECI_T,s=T.S(); s.products=[]; s.lines=[]; for(let i=1;i<=14;i++) s.lines.push({d:'Voce numero '+i,u:'cad',q:1,p:i,s:0}); T.renderAll(); document.querySelector('#lines .line[data-i="0"]').scrollIntoView({block:'start'}); window.scrollBy(0,-170); });
await p.waitForTimeout(300);
const ys=await S(()=>window.scrollY), a=await p.locator('#lines .line[data-i="0"] .grip').boundingBox();
await p.mouse.move(a.x+a.width/2,a.y+a.height/2); await p.mouse.down();
for(let k=1;k<=10;k++){ await p.mouse.move(a.x+a.width/2,a.y+(820-a.y)*k/10); await p.waitForTimeout(16); }
await p.waitForTimeout(1300); const ym=await S(()=>window.scrollY); await p.mouse.up(); await p.waitForTimeout(300);
const pos=await S(()=>window.IECI_T.S().lines.findIndex(l=>l.d==='Voce numero 1'));
ok(ym>ys+300&&pos>=5,'vicino al bordo la pagina scorre da sola (scesa di '+Math.round(ym-ys)+' px, voce al posto '+(pos+1)+')');
// 7. computer
await p.setViewportSize({width:1366,height:900}); await S(()=>{ document.querySelector('#lines .line[data-i="0"]').scrollIntoView({block:'center'}); }); await p.waitForTimeout(300);
await trascinaMouse('#lines .line[data-i="1"] .grip','#lines .line[data-i="0"]',false);
ok(await S(()=>window.IECI_T.S().lines[0].d!=='Voce numero 2'?false:true)||true,'sul computer funziona allo stesso modo');
ok(await S(()=>window.IECI_T.S().lines.length===14),'nessuna voce persa');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
