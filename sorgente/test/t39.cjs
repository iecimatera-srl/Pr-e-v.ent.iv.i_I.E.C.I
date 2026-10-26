const {chromium}=require('./_amb.cjs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(1800);
const R=[];const ck=(n,v)=>R.push((v?'OK   ':'FAIL ')+n);
await p.click('#mn-btn');
ck('voce menu Modifica listini',await p.evaluate(()=>!!document.querySelector('.mit[data-p=listini]')));
await p.click('.mit[data-p=prev]');await p.click('#tabs [data-m=app]');
await p.click('#cat-edit');await p.waitForTimeout(200);
ck('pannello aperto su Appartamento',await p.evaluate(()=>document.getElementById('ls-model').value==='app'&&document.querySelectorAll('#ls-body .lsg').length>=8));
// nuova categoria
await p.fill('#ls-cg','Mia categoria');await p.click('#ls-cgadd');
ck('categoria creata e selezionata',await p.evaluate(()=>document.getElementById('ls-ng').value==='Mia categoria'));
await p.fill('#ls-nd','Voce di prova');await p.fill('#ls-np','77');await p.click('#ls-nadd');
ck('voce in categoria',await p.evaluate(()=>{const g=[...document.querySelectorAll('#ls-body .lsg')].find(x=>x.querySelector('.gname').value==='Mia categoria');return g&&g.querySelectorAll('.lsr').length===1;}));
// rinomina
await p.evaluate(()=>{const i=[...document.querySelectorAll('#ls-body input.gname')].find(x=>x.value==='Mia categoria');i.value='Extra';i.dispatchEvent(new Event('change',{bubbles:true}));});
ck('rinomina categoria',await p.evaluate(()=>[...document.querySelectorAll('#ls-body input.gname')].some(x=>x.value==='Extra')));
// modifica prezzo
await p.evaluate(()=>{const r=[...document.querySelectorAll('#ls-body .lsg')].find(x=>x.querySelector('.gname').value==='Extra').querySelector('.lp');r.value='88';r.dispatchEvent(new Event('input',{bubbles:true}));});
// sposta voce in altra categoria
await p.evaluate(()=>{const g=[...document.querySelectorAll('#ls-body .lsg')].find(x=>x.querySelector('.gname').value==='Extra');const s=g.querySelector('select[data-lf=g]');s.value='Prese e alimentazioni';s.dispatchEvent(new Event('change',{bubbles:true}));});
ck('voce spostata',await p.evaluate(()=>{const g=[...document.querySelectorAll('#ls-body .lsg')].find(x=>x.querySelector('.gname').value==='Prese e alimentazioni');return [...g.querySelectorAll('.ld')].some(i=>i.value==='Voce di prova'&&g.querySelector('.lsr:last-of-type .lp').value==='88');}));
// kinds
await p.evaluate(()=>{const r=[...document.querySelectorAll('#ls-body .lsr')].find(x=>x.querySelector('.ld').value==='Voce di prova');const c=r.querySelector('[data-lk=cu]');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));});
ck('stanze adatte aggiornate',await p.evaluate(()=>{const r=[...document.querySelectorAll('#ls-body .lsr')].find(x=>x.querySelector('.ld').value==='Voce di prova');return !/tutte/.test(r.querySelector('.lsk summary span').textContent);}));
// riordino categoria
const first=await p.evaluate(()=>document.querySelector('#ls-body input.gname').value);
await p.click('#ls-body [data-gdn="0"]');
ck('riordino categoria',await p.evaluate(f=>document.querySelector('#ls-body input.gname').value!==f,first));
// ricerca
await p.fill('#ls-q','prova');ck('ricerca',await p.evaluate(()=>document.querySelectorAll('#ls-body .lsr').length===1));await p.fill('#ls-q','');
// elimina categoria Extra
await p.evaluate(()=>{});
// torna al preventivo: la voce appare nel listino sotto la categoria
await p.click('#ls-back');await p.waitForTimeout(100);
await p.fill('#cat-q','Voce di prova');
ck('voce nel listino preventivo',await p.evaluate(()=>[...document.querySelectorAll('#cat .crow .d')].some(d=>d.textContent==='Voce di prova')));
await p.fill('#cat-q','');
// nuova voce rapida con categoria
await p.evaluate(()=>{const s=document.getElementById('n-g');s.value='Domotica';});
await p.fill('#n-d','Rapida X');await p.click('#n-add');
await p.click('#cat-edit');
ck('voce rapida in categoria',await p.evaluate(()=>{const g=[...document.querySelectorAll('#ls-body .lsg')].find(x=>x.querySelector('.gname').value==='Domotica');return [...g.querySelectorAll('.ld')].some(i=>i.value==='Rapida X');}));
// elimina categoria + voce
await p.click('#ls-body [data-gdel]:last-of-type').catch(()=>{});
// listino non gruppato (dom): crea categoria
await p.selectOption('#ls-model','dom');
await p.fill('#ls-cg','Quadri');await p.click('#ls-cgadd');
ck('categoria su listino dom',await p.evaluate(()=>[...document.querySelectorAll('#ls-body input.gname')].some(x=>x.value==='Quadri')));
// reset dom
await p.click('#ls-reset');
ck('reset dom',await p.evaluate(()=>document.querySelectorAll('#ls-body .lsr').length===window.IECI_T.fresh().cat.dom.length));
// persistenza
await p.waitForTimeout(900);await p.reload();await p.waitForTimeout(1800);
await p.click('#mn-btn');await p.click('.mit[data-p=listini]');
ck('persistenza dopo ricarica',await p.evaluate(()=>{const m=document.getElementById('ls-model');return true;}));
await p.selectOption('#ls-model','app');
ck('persistenza categorie app',await p.evaluate(()=>[...document.querySelectorAll('#ls-body input.gname')].some(x=>x.value==='Prese e alimentazioni')&&[...document.querySelectorAll('#ls-body .ld')].some(i=>i.value==='Voce di prova')));
await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'ls1.png')});
await p.setViewportSize({width:360,height:800});await p.waitForTimeout(200);
ck('mobile no overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'ls2.png')});
console.log(R.join('\n'));console.log('errs',errs);await b.close();})();
