// Controllo generale: in ogni tipo di preventivo e in ogni pannello
// 1) ogni casella collegata (data-b) scrive in un campo che esiste davvero nei dati (lo sbaglio che azzerava i totali delle proposte A/B);
// 2) ogni pulsante visibile si può premere senza errori (le conferme vengono annullate, niente condivisioni o file).
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const ctx=await b.newContext({viewport:{width:420,height:900}});
await ctx.addInitScript(()=>{ window.open=function(){ return null; }; try{ navigator.share=undefined; }catch(e){} });
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
p.on('filechooser',()=>{});p.on('popup',pp=>pp.close().catch(()=>{}));
await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.showPanel&&window.IECI_T.S,null,{timeout:30000});
const S=(f,a)=>p.evaluate(f,a);
const models=await S(()=>[...document.querySelectorAll('#tabs [data-m]')].map(e=>e.getAttribute('data-m')));
const panels=await S(()=>[...new Set([...document.querySelectorAll('[data-panel]')].map(e=>e.getAttribute('data-panel')))]);
console.log('tipi',models.join(' '),'| pannelli',panels.join(' '));
ok(models.length>=13&&panels.length>=18,'trovati '+models.length+' tipi di preventivo e '+panels.length+' pannelli');

const audit=()=>S((P)=>{ const T=window.IECI_T, s=T.S(), bad=[];
  P.forEach(pn=>{ T.showPanel(pn);
    document.querySelectorAll('[data-b]').forEach(el=>{ const path=el.getAttribute('data-b'); const a=path.split('.'); let o=s;
      for(let i=0;i<a.length-1;i++){ o=o==null?undefined:o[a[i]]; }
      const leaf=a[a.length-1]; if(o==null||typeof o!=='object'||(!(leaf in o)&&!Array.isArray(o))) bad.push(path); }); });
  T.showPanel('prev'); return [...new Set(bad)]; },panels);

// stati da controllare: ogni tipo, poi le proposte, il videocitofono a confronto e il totale libero
let bad=[];
for(const m of models){ await A.mostra(p,'#tabs'); await p.click('#tabs [data-m="'+m+'"]'); await p.waitForTimeout(250); bad=bad.concat((await audit()).map(x=>m+':'+x)); }
await p.click('#tabs [data-m="dom"]'); await p.waitForTimeout(250);
await S(()=>{ const s=window.IECI_T.S(); s.econ.mode='totale'; window.IECI_T.renderAll(); }); bad=bad.concat((await audit()).map(x=>'dom-totale:'+x));
await A.mostra(p,'#br-on'); await S(()=>{ const s=window.IECI_T.S(); s.econ.mode='righe'; window.IECI_T.renderAll(); }); await p.check('#br-on'); await p.waitForTimeout(300);
await S(()=>{ const s=window.IECI_T.S(); s.econ.mode='totale'; window.IECI_T.renderAll(); }); bad=bad.concat((await audit()).map(x=>'proposte-totale:'+x));
await S(()=>{ const s=window.IECI_T.S(); s.cmp.on=false; s.tiers.on=false; s.econ.mode='righe'; window.IECI_T.renderAll(); });
await p.click('#tabs [data-m="vcit"]'); await p.waitForTimeout(250);
for(const k of ['both','brands']){ await A.mostra(p,'[data-vck="'+k+'"]'); await p.click('[data-vck="'+k+'"]'); await p.waitForTimeout(300); await A.mostra(p,'[data-vcp="totale"]'); await p.click('[data-vcp="totale"]'); await p.waitForTimeout(300); bad=bad.concat((await audit()).map(x=>'vcit-'+k+'-totale:'+x)); await p.click('[data-vcp="righe"]'); }
console.log('caselle senza campo:',JSON.stringify(bad));
ok(!bad.length,'ogni casella collegata scrive in un campo esistente, in tutti i tipi e in tutte le modalità');

// pulsanti: premo tutto ciò che è visibile, pannello per pannello, in tre tipi molto diversi
const SKIP=/elimin|cancell|svuot|ripristin|azzera|reset|esci|blocca|condividi|whatsapp|e-?mail|invia|stampa|scarica|pdf|apri il file|carica|foto|fotocamera|scegli file|importa|collega|scollega|sincronizz|github|drive|aggiorna l.app|installa|disinstalla|nuovo preventivo|chiudi il confronto|tieni solo|cerca in rete|cerca online|sostituisci tutto/i;
const clickAll=async(pn)=>S(async([pn,src])=>{ const T=window.IECI_T, re=new RegExp(src,'i'), done=new Set(); let n=0;
  for(let giro=0;giro<3;giro++){ T.showPanel(pn);
    const root=document.querySelector('[data-panel="'+pn+'"]'); if(!root) break;
    const list=[...root.querySelectorAll('button,[role="button"],summary,input[type=checkbox],input[type=radio]')].filter(e=>{ const r=e.getBoundingClientRect(); const t=(e.innerText||e.getAttribute('aria-label')||e.title||e.value||'').trim(); const key=(e.id||'')+'|'+t+'|'+(e.getAttribute('data-act')||e.getAttribute('data-sy')||e.getAttribute('data-lu')||''); if(done.has(key)) return false; done.add(key); return !e.disabled&&r.width>0&&!e.closest('[hidden]')&&!re.test(t)&&!re.test(e.title||'')&&e.type!=='file'&&!e.closest('label')?.querySelector('input[type=file]'); });
    if(!list.length) break;
    for(const e of list){ try{ e.click(); n++; }catch(x){} await new Promise(r=>setTimeout(r,15)); if(panelNow()!==pn) T.showPanel(pn); }
  }
  function panelNow(){ const v=[...document.querySelectorAll('[data-panel]')].find(s=>!s.hidden); return v&&v.getAttribute('data-panel'); }
  document.querySelectorAll('dialog[open]').forEach(d=>{ try{ d.close(); }catch(x){} });
  document.querySelectorAll('.ov.on,.modal.on,.sheet.on').forEach(d=>d.classList.remove('on'));
  return n; },[pn,SKIP.source]);
let tot=0;
for(const m of ['dom','vcit','luce']){
  const okm=await S(m=>{ document.querySelectorAll('dialog[open]').forEach(d=>d.close()); window.IECI_T.showPanel('prev'); const t=document.querySelector('#tabs [data-m="'+m+'"]'); if(t) t.click(); return window.IECI_T.S().model===m; },m); ok(okm,'tipo «'+m+'» aperto'); await p.waitForTimeout(300);
  for(const pn of panels){ const e0=errs.length; const n=await clickAll(pn); tot+=n; if(errs.length>e0) console.log('  errori in',m,pn,JSON.stringify(errs.slice(e0))); }
}
console.log('pulsanti premuti:',tot);
ok(tot>300,'premuti '+tot+' pulsanti e scelte in tutti i pannelli');
ok(!errs.length,'nessun errore premendo tutto '+JSON.stringify(errs.slice(0,5)));
// l'app resta usabile dopo
await S(()=>{ document.querySelectorAll('dialog[open]').forEach(d=>d.close()); window.IECI_T.showPanel('prev'); });
ok(await S(()=>{ const s=window.IECI_T.S(); s.lines.push({d:'Prova finale',u:'cad',q:1,p:10,s:0}); window.IECI_T.touch(); return true; })&&await S(()=>new Promise(r=>setTimeout(()=>r(/Prova finale/.test(document.getElementById('doc').innerText)),1800))),'dopo tutto l\'app funziona ancora: la voce nuova arriva nel preventivo');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
