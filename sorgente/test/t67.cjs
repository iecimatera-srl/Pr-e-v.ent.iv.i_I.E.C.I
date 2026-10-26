const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>{ if(d.type()==='prompt') d.accept('Condominio veloce'); else d.accept(); });
await p.addInitScript(()=>{ Object.defineProperty(navigator,'canShare',{value:()=>true,configurable:true}); Object.defineProperty(navigator,'share',{value:d=>{ window.__shared=d; return Promise.resolve(); },configurable:true}); });
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(1800);
const S=(f,a)=>p.evaluate(f,a);
await p.click('#mn-btn');
ok(await S(()=>[...document.querySelectorAll('.mdrop .mit')].some(b=>/Messaggi di invio/.test(b.textContent))),'voce «Messaggi di invio» nel menu');
await p.click('.mit[data-p=messaggi]');await p.waitForTimeout(300);
ok(await S(()=>!document.querySelector('[data-panel="messaggi"]').hidden&&document.querySelectorAll('#mt-list details.mt').length===4),'pannello con i 4 messaggi');
ok(await S(()=>document.querySelectorAll('#mt-list .mtd').length===1),'un messaggio predefinito segnato');
// modifica il testo del predefinito e inserisci un segnaposto
const ta='#mt-list details.mt.def [data-mtf="wa"]';
await p.fill(ta,'Ciao ');await p.dispatchEvent(ta,'input');
await S(()=>{const t=document.querySelector('#mt-list details.mt.def [data-mtf="wa"]');t.focus();t.setSelectionRange(5,5);});
await p.click('#mt-list details.mt.def [data-mtph="cliente"]');await p.waitForTimeout(200);
await S(()=>{const t=document.querySelector('#mt-list details.mt.def [data-mtf="wa"]');t.value+=', ecco il preventivo n. {numero}. Totale {totale}.';t.dispatchEvent(new Event('input',{bubbles:true}));});
const prev=await S(()=>document.querySelector('#mt-list details.mt.def [data-mtprev]').textContent);console.log(prev);
ok(/^Ciao Mario Rossi, ecco il preventivo n\. 2026\/001\. Totale/.test(prev),'anteprima con i dati del preventivo');
// nuovo messaggio come predefinito
await p.click('#mt-add');await p.waitForTimeout(300);
await S(()=>{const d=[...document.querySelectorAll('#mt-list details.mt')].pop();const n=d.querySelector('[data-mtf="n"]');n.value='Messaggio cortese';n.dispatchEvent(new Event('input',{bubbles:true}));const w=d.querySelector('[data-mtf="wa"]');w.value='Gentile {cliente}, in allegato il preventivo {numero}. Buona giornata!';w.dispatchEvent(new Event('input',{bubbles:true}));d.querySelector('[data-mta="def"]').click();});await p.waitForTimeout(300);
ok(await S(()=>{const s=window.IECI_T.S();return s.mtpl.length===5&&s.mtpl.find(t=>t.id===s.mdef).n==='Messaggio cortese'}),'nuovo messaggio creato e reso predefinito');
// apri Condividi: testo pronto e modificabile
await S(()=>document.getElementById('qb-share').click());await p.waitForTimeout(400);
let v=await S(()=>document.getElementById('sh-txt').value);console.log(v);
ok(v==='Gentile Mario Rossi, in allegato il preventivo 2026/001. Buona giornata!','Condividi: messaggio predefinito già pronto');
await p.fill('#sh-txt','Gentile Mario Rossi, come d\'accordo al telefono le invio il preventivo 2026/001.');await p.dispatchEvent('#sh-txt','input');
ok(await S(()=>decodeURIComponent(document.getElementById('sh-wat').href).includes('come d\'accordo al telefono')),'testo modificato anche nel link WhatsApp');
// invio: il testo modificato parte con il PDF
await p.waitForFunction(()=>!document.getElementById('sh-wa').disabled,null,{timeout:60000});
await S(()=>document.getElementById('sh-wa').click());await p.waitForTimeout(500);
const sh=await S(()=>window.__shared&&{t:window.__shared.text,f:window.__shared.files&&window.__shared.files.length});console.log(JSON.stringify(sh));
ok(sh&&sh.f===1&&/come d'accordo al telefono/.test(sh.t),'WhatsApp riceve il PDF con il testo modificato');
// scelta di un altro messaggio nella finestra
await S(()=>{document.getElementById('qb-share').click();});await p.waitForTimeout(300);
await S(()=>{const s=document.getElementById('sh-tpl');s.value=window.IECI_T.S().mtpl[1].id;s.dispatchEvent(new Event('change',{bubbles:true}));});
v=await S(()=>document.getElementById('sh-txt').value);ok(/ha avuto modo di vedere il preventivo n\. 2026\/001/.test(v),'scelta di un altro messaggio dalla finestra');
// salva come mio messaggio: i dati diventano segnaposto
await p.fill('#sh-txt','Buongiorno Mario Rossi, preventivo 2026/001 pronto.');await p.dispatchEvent('#sh-txt','input');
await S(()=>document.getElementById('sh-save').click());await p.waitForTimeout(300);
const sv=await S(()=>{const s=window.IECI_T.S();const t=s.mtpl.find(x=>x.n==='Condominio veloce');return t&&t.wa});console.log(sv);
ok(sv==='Buongiorno {cliente}, preventivo {numero} pronto.','salvato come mio messaggio, con i segnaposto');
// nuovo preventivo: usa il predefinito
await S(()=>document.getElementById('sh-x').click());
await S(()=>document.getElementById('q-new').click());await p.waitForTimeout(600);
ok(await S(()=>/in allegato il preventivo/.test(window.IECI_T.S().msgs.wa)),'nuovo preventivo: messaggio predefinito');
ok(await S(()=>(window.IECI_T.payload().mtpl||[]).length===6),'messaggi nel backup e nella sincronizzazione');
await p.reload();await p.waitForTimeout(1800);
ok(await S(()=>window.IECI_T.S().mtpl.some(t=>t.n==='Condominio veloce')),'restano dopo la riapertura');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
