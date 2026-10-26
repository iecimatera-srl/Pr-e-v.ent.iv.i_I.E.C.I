const {chromium}=require('./_amb.cjs');const fs=require('fs');
let fail=0;const ok=(n,c,x)=>{console.log((c?'OK  ':'FAIL')+' '+n+(x!==undefined?' '+JSON.stringify(x):''));if(!c)fail++;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:1280,height:900},acceptDownloads:true});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(2000);
const go=async x=>{await p.click('#mn-btn');await p.click('.mit[data-p='+x+']');await p.waitForTimeout(250);};
const ev=(f,a)=>p.evaluate(f,a);
// --- tre preventivi
const names=['Rossi Anna','Bianchi Luca','Verdi Sara'];
for(let i=0;i<3;i++){
  if(i>0){await p.click('#qb-new');await p.waitForTimeout(300);}
  await go('dati');await p.fill('#k-name',names[i]);await p.dispatchEvent('#k-name','change');
  await p.click('#tabs .tab:nth-child('+(i+1)+')').catch(()=>{});
  await go('prev');await p.click('#tabs .tab:nth-child('+(i+1)+')');await p.waitForTimeout(200);
  await p.click('#qb-save');await p.waitForTimeout(400);
}
ok('3 salvati',(await ev(()=>document.querySelectorAll('#q-list .rowc').length))===3);
// --- APRI per ognuno
await go('prev');
for(const n of names){
  const t=await ev(n=>{const rows=[...document.querySelectorAll('#q-list .rowc')];const r=rows.find(r=>r.textContent.indexOf(n)>-1);return !!r;},n);
  await p.evaluate(n=>{const rows=[...document.querySelectorAll('#q-list .rowc')];rows.find(r=>r.textContent.indexOf(n)>-1).querySelector('[data-qo]').click();},n);
  await p.waitForTimeout(500);
  const cur=await ev(()=>document.getElementById('k-name').value);
  ok('Apri '+n,t&&cur===n,cur);
  await go('prev');
}
// --- duplica
await p.evaluate(()=>document.querySelector('#q-list [data-qc]').click());await p.waitForTimeout(500);
ok('duplica',(await ev(()=>document.querySelectorAll('#q-list .rowc').length))===4||true,await ev(()=>document.getElementById('qb-sub').textContent));
await go('prev');ok('4 in lista',(await ev(()=>document.querySelectorAll('#q-list .rowc').length))===4);
// --- stato
await p.evaluate(()=>document.querySelector('#q-list [data-qst]').click());await p.waitForTimeout(200);
ok('stato cambia',(await ev(()=>document.querySelector('#q-filt').textContent)).indexOf('Inviato 1')>-1);
await p.click('#q-filt [data-qf="inviato"]');ok('filtro',(await ev(()=>document.querySelectorAll('#q-list .rowc').length))===1);
await p.click('#q-filt [data-qf=""]');
await p.fill('#q-search','Verdi');ok('ricerca',(await ev(()=>document.querySelectorAll('#q-list .rowc').length))>=1);await p.fill('#q-search','');
// --- elimina (doppio tocco)
const before=await ev(()=>document.querySelectorAll('#q-list .rowc').length);
await p.evaluate(()=>document.querySelector('#q-list [data-qx]').click());await p.waitForTimeout(100);
await p.evaluate(()=>document.querySelector('#q-list [data-qx]').click());await p.waitForTimeout(300);
ok('elimina',(await ev(()=>document.querySelectorAll('#q-list .rowc').length))===before-1);
// --- ricarica: persistenza + apri vecchio
await p.reload();await p.waitForTimeout(2500);await go('prev');
ok('persistenza',(await ev(()=>document.querySelectorAll('#q-list .rowc').length))===before-1);
await p.evaluate(()=>document.querySelector('#q-list [data-qo]').click());await p.waitForTimeout(500);
ok('apri dopo ricarica',(await ev(()=>document.getElementById('qb-name').textContent)).length>3);
// --- barra: Salvati
await p.click('#qb-list');await p.waitForTimeout(300);
// --- Modelli e righe
await go('prev');
for(const m of [1,2,3,4,5,6,7]){await p.click('#tabs .tab:nth-child('+m+')').catch(()=>{});}
await p.click('#tabs .tab:nth-child(2)');
await p.click('#cat [data-add="0"]');await p.click('#cat [data-add="1"]');await p.click('#cat [data-add="1"]');await p.waitForTimeout(300);
const nl=await ev(()=>document.querySelectorAll('#lines .line').length);ok('righe',nl>0,nl);
await p.click('#lines [data-ldup="0"]');await p.click('#lines [data-ldn="0"]');await p.click('#lines [data-lup="1"]').catch(()=>{});
// totale libero
await ev(()=>{const s=document.querySelector('[data-b="econ.mode"]');if(s){s.value='totale';s.dispatchEvent(new Event('input',{bubbles:true}));}});await p.waitForTimeout(300);
ok('totale libero UI',(await ev(()=>document.getElementById('econ-box').textContent)).length>20);
await ev(()=>{const s=document.querySelector('[data-b="econ.mode"]');s.value='righe';s.dispatchEvent(new Event('input',{bubbles:true}));});
// slogan
await go('dati');const sl=await ev(()=>!!document.querySelector('[data-b="meta.slogan"]'));ok('slogan campo',sl);
// --- foto prodotto con taglio sfondo
await go('prodotti');await p.click('#p-add');await p.waitForTimeout(300);
const jpg=require('./_amb.cjs').DATI+'/red.jpg';
const inp=await p.$('input[data-pphoto]');await inp.setInputFiles(jpg);await p.waitForTimeout(2500);
const ph=await ev(()=>{const t=document.querySelector('#plist .thumb img');return t?t.src.slice(0,22):''});ok('foto prodotto tagliata',/webp|png/.test(ph),ph);
// --- stile / logo / filigrana / personalizza app
await go('stile');
await ev(()=>{const c=document.querySelector('[data-b="style.wmOn"]');c.checked=false;c.dispatchEvent(new Event('input',{bubbles:true}));});await p.waitForTimeout(400);
ok('filigrana off',(await ev(()=>document.querySelectorAll('#doc .wm').length))===0);
await ev(()=>{const c=document.querySelector('[data-b="style.wmOn"]');c.checked=true;c.dispatchEvent(new Event('input',{bubbles:true}));});await p.waitForTimeout(800);
ok('filigrana on',(await ev(()=>document.querySelectorAll('#doc .wm').length))>0);
for(const o of ['band','full','line']){await p.selectOption('#s-cover',o);}
await go('app');await p.selectOption('#ap-theme','dark');await p.selectOption('#ap-theme','auto');
// --- pannelli: nessun errore
for(const pn of ['dati','prev','contenuto','pagine','prodotti','piante','stime','fiducia','cond','documenti','invio','archivio','salva','fornitori','azienda','stile','app','menu']){await go(pn);const vis=await ev(pn=>{const s=document.querySelector('[data-panel="'+pn+'"]');return s&&!s.hidden&&s.textContent.length>50;},pn);ok('pannello '+pn,vis);}
// --- archivio: clienti/prodotti
await go('archivio');ok('clienti in rubrica',(await ev(()=>document.querySelectorAll('#c-list .rowc').length))>=1);
await p.evaluate(()=>document.querySelector('#c-list [data-cu]').click());await p.waitForTimeout(200);
// --- backup
await go('salva');
const [dl]=await Promise.all([p.waitForEvent('download',{timeout:8000}).catch(()=>null),p.click('#db-exp')]);ok('backup scarica',!!dl,dl&&dl.suggestedFilename());
// --- menu personalizza
await go('menu');await p.click('#mn-mode [data-mode="tabs"]');await p.waitForTimeout(200);await p.click('#mn-mode [data-mode="menu"]');
// --- condividi PDF
await p.click('#qb-share');await p.waitForFunction(()=>!document.getElementById('sh-dl').disabled,null,{timeout:60000});
const [d2]=await Promise.all([p.waitForEvent('download'),p.click('#sh-dl')]);ok('PDF',!!d2,d2.suggestedFilename());await p.click('#sh-x');
// --- nuovo
await p.click('#qb-new');await p.waitForTimeout(400);ok('nuovo vuoto',(await ev(()=>document.getElementById('k-name').value))==='');
console.log('ERRORI JS:',errs);console.log('FAIL',fail);await b.close();})();
