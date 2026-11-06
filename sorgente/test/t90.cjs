// Giro completo su OGNI tipo di preventivo: voci dal listino, totali, fascicolo, totale libero, tutti i pulsanti di tutti i pannelli, PDF
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
const models=await S(()=>[...document.querySelectorAll('#tabs [data-m]')].map(e=>[e.getAttribute('data-m'),e.innerText.trim()]));
const panels=await S(()=>[...new Set([...document.querySelectorAll('[data-panel]')].map(e=>e.getAttribute('data-panel')))]);
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

const SOLO=(process.env.IECI_TIPI||'').split(',').filter(Boolean);
for(const [m,nome] of models){ if(SOLO.length&&SOLO.indexOf(m)<0) continue;
  const e0=errs.length, tag='['+nome.replace(/\s+/g,' ')+'] ';
  const okm=await S(m=>{ document.querySelectorAll('dialog[open]').forEach(d=>d.close()); const T=window.IECI_T; T.showPanel('prev'); document.querySelector('#tabs [data-m="'+m+'"]').click(); const s=T.S(); s.lines=[]; s.cmp.on=false; s.tiers.on=false; s.tiers.sel=-1; s.econ.mode='righe'; s.meta.disc=0; T.renderAll(); return s.model===m; },m);
  ok(okm,tag+'tipo aperto');
  // 1. voci dal listino col pulsante «+»
  const r1=await S(async()=>{ const T=window.IECI_T; const d=document.querySelector('#acc-cat'); if(d) d.open=true; await new Promise(r=>setTimeout(r,150));
    const bt=[...document.querySelectorAll('#cat [data-add]')].slice(0,3); bt.forEach(x=>x.click()); await new Promise(r=>setTimeout(r,300));
    const s=T.S(), L=s.lines.filter(l=>!l.vm&&!l.off); return {nb:bt.length,n:L.length,d:L.map(l=>l.d),sum:L.filter(l=>!l.opt).reduce((a,l)=>a+(+l.q||0)*(+l.p||0)*(1-(+l.s||0)/100),0),iva:+s.meta.iva}; });
  ok(r1.nb>=3&&r1.n>=3,tag+'listino: aggiunte '+r1.n+' voci col «+»');
  await p.waitForTimeout(1600);
  const r2=await S(()=>{ const T=window.IECI_T, t=T.totals(); return {t:t,doc:document.getElementById('doc').innerText,pg:document.querySelectorAll('#doc section.page').length,h:T.headTotal()}; });
  const att=Math.round(r1.sum*(1+r1.iva/100)*100)/100;
  ok(r2.t.tot>0&&Math.abs(r2.t.tot-att)<0.06,tag+'totale giusto: '+r2.t.tot+' (atteso '+att+')');
  ok(Math.abs(r2.t.imp+r2.t.iva-r2.t.tot)<0.011,tag+'imponibile + IVA = totale');
  ok(r2.pg>=2&&r1.d.every(x=>r2.doc.indexOf(x.slice(0,25))>-1),tag+'fascicolo con '+r2.pg+' pagine e tutte le voci');
  // 2. sconto e totale libero
  const r3=await S(async()=>{ const T=window.IECI_T,s=T.S(); s.meta.disc=10; T.touch(); const a=T.totals(); s.meta.disc=0; s.econ.mode='totale'; s.econ.vat='incl'; s.econ.total='1234,50'; T.renderAll(); T.touch(); const b=T.totals(); await new Promise(r=>setTimeout(r,1500)); const d=document.getElementById('doc').innerText; s.econ.mode='righe'; s.econ.total=''; T.renderAll(); T.touch(); return {a:a,b:b,d:/1\.234,50/.test(d)}; });
  ok(Math.abs(r3.a.imp-Math.round(r1.sum*0.9*100)/100)<0.06,tag+'sconto 10% applicato');
  ok(r3.b.tot===1234.5&&r3.d,tag+'totale libero 1.234,50 nei conti e nel fascicolo');
  // 3. tutti i pulsanti di tutti i pannelli
  let n=0; for(const pn of panels){ const ee=errs.length; n+=await clickAll(pn); if(errs.length>ee) console.log('  errori in',m,pn,JSON.stringify(errs.slice(ee))); }
  ok(n>150,tag+'premuti '+n+' pulsanti e scelte in '+panels.length+' pannelli');
  // 4. PDF
  const pdf=await S(()=>{ document.querySelectorAll('dialog[open]').forEach(d=>d.close()); window.IECI_T.showPanel('prev'); return Promise.race([window.IECI_T.buildPdf(false).then(b=>b.size).catch(e=>'ERR '+e.message),new Promise(r=>setTimeout(()=>r('ERR tempo scaduto'),90000))]); });
  ok(typeof pdf==='number'&&pdf>20000,tag+'PDF creato ('+(typeof pdf==='number'?Math.round(pdf/1024)+' KB':pdf)+')');
  ok(errs.length===e0,tag+'nessun errore '+JSON.stringify(errs.slice(e0,e0+3)));
}
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
