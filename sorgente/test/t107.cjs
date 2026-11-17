// CONTROLLO GENERALE: ogni tipo di preventivo, nelle combinazioni più usate.
// Per ognuna: nessun errore del programma, nessun testo rotto nel documento (NaN, undefined, null, [object…]),
// totale calcolato giusto (ricontato a parte), pagine A4 che non sforano.
const A=require('./_amb.cjs');
let fail=0, nok=0;const ok=(c,m)=>{ if(!c){ console.log('FAIL '+m); fail++; } else nok++; };
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S,null,{timeout:30000});await p.waitForTimeout(800);
const S=(f,a)=>p.evaluate(f,a);
const ORDER=await S(()=>{ const s=new Set(); document.querySelectorAll('[data-m]').forEach(b=>s.add(b.getAttribute('data-m'))); return [...s]; });
console.log('tipi di preventivo:',ORDER.join(', '));
async function controlla(tipo,caso,atteso){
  await S(()=>{ const T=window.IECI_T; T.touch(); T.renderAll&&T.renderAll(); });
  await p.waitForTimeout(450);
  const r=await S(()=>{
    const T=window.IECI_T, S=T.S(), d=document.getElementById('doc'), tx=d?d.innerText:'';
    const rotti=(tx.match(/NaN|undefined|\bnull\b|\[object|Infinity/g)||[]);
    const alte=[...document.querySelectorAll('#doc section.page')].map(x=>x.offsetHeight).filter(h=>h>1130);
    // totale ricontato a parte (righe normali, senza opzioni/escluse): imponibile, sconto, IVA
    let imp=0, semplice=!S.tiers.on&&!(S.cmp&&S.cmp.on)&&S.econ.mode!=='totale'&&!(S.cond&&S.cond.kind==='brands'||S.cond&&S.cond.kind==='both');
    S.lines.forEach(l=>{ if(l.off||l.opt||l.vm) { if(l.opt) semplice=false; return; } imp+=Math.round((+l.q||0)*(+l.p||0)*(1-(+l.s||0)/100)*100)/100; });
    const tot=T.totals?T.totals():null;
    const mio=Math.round(imp*(1-(+S.meta.disc||0)/100)*(1+(+S.meta.iva||0)/100)*100)/100;
    const g=document.querySelector('#doc .tots .grand span:last-child');
    return {rotti:rotti.slice(0,5),ctx:rotti.length?tx.slice(Math.max(0,tx.search(/NaN|undefined|\bnull\b|\[object|Infinity/)-60),tx.search(/NaN|undefined|\bnull\b|\[object|Infinity/)+40):'',alte,semplice,mio,tot:tot&&tot.tot,grand:g?g.textContent:'',pagine:document.querySelectorAll('#doc section.page').length,righe:S.lines.length};
  });
  const nome=tipo+' · '+caso;
  ok(!errs.length,nome+': nessun errore del programma '+(errs.length?JSON.stringify(errs.splice(0)):''));
  ok(!r.rotti.length,nome+': nessun testo rotto nel documento '+(r.rotti.length?JSON.stringify(r.rotti)+' «'+r.ctx.replace(/\n/g,' ')+'»':''));
  ok(!r.alte.length,nome+': tutte le pagine A4 ('+r.pagine+' pagine'+(r.alte.length?', troppo alte: '+r.alte.join(','):'')+')');
  ok(r.pagine>0,nome+': il documento c\'è');
  if(r.semplice&&r.righe) ok(Math.abs((r.tot||0)-r.mio)<0.06,nome+': totale giusto (app '+r.tot+' · ricontato '+r.mio+')');
  if(atteso) ok(r.grand.indexOf(atteso)>-1,nome+': nel totale compare '+atteso+' («'+r.grand+'»)');
  return r;
}
async function riempi(tipo){
  await S(m=>{ const b=document.querySelector('[data-m="'+m+'"]'); b&&b.click(); },tipo); await p.waitForTimeout(350);
  await S(()=>{ const T=window.IECI_T,s=T.S(); s.lines=[]; s.products=[]; s.tiers.on=false; if(s.cmp) s.cmp.on=false; s.econ.mode='righe'; s.econ.total=''; s.meta.disc=0; s.meta.iva=22; T.touch(); });
  await p.waitForTimeout(300);
  const n=await S(()=>{ const rows=[...document.querySelectorAll('#cat .crow [data-add]')].slice(0,7); rows.forEach(b=>b.click()); return rows.length; });
  await p.waitForTimeout(400);
  await S(()=>{ const s=window.IECI_T.S(); s.lines.forEach((l,i)=>{ l.q=(i%3)+1; }); s.client={name:'Cliente Controllo',addr:'Via Prova 1',tel:'',email:'',cf:''}; window.IECI_T.touch(); });
  return n;
}
for(const tipo of ORDER){
  const n=await riempi(tipo);
  ok(n>0,tipo+': voci aggiunte dal listino ('+n+')');
  await controlla(tipo,'normale');
  await S(()=>{ const s=window.IECI_T.S(); s.meta.disc=10; s.meta.iva=10; });
  await controlla(tipo,'sconto 10% e IVA 10%');
  await S(()=>{ const s=window.IECI_T.S(); s.meta.disc=0; s.meta.iva=22; s.econ.mode='totale'; s.econ.total='5000'; });
  await controlla(tipo,'totale libero 5.000','5.000,00');
  await S(()=>{ const s=window.IECI_T.S(); s.econ.mode='righe'; s.econ.total=''; });
  // proposte a confronto (A/B), dove c'è
  const br=await S(()=>{ const a=document.getElementById('acc-br'); if(!a||a.hidden) return false; a.open=true; const c=document.getElementById('br-on'); if(!c) return false; c.checked=true; c.dispatchEvent(new Event('change',{bubbles:true})); return true; });
  if(br){ await p.waitForTimeout(500); await controlla(tipo,'proposte A/B');
    await S(()=>{ const s=window.IECI_T.S(); s.econ.mode='totale'; s.econ.total='4200'; }); await controlla(tipo,'proposte A/B con totale libero');
    await S(()=>{ const s=window.IECI_T.S(); s.econ.mode='righe'; s.econ.total=''; const c=document.getElementById('br-on'); c.checked=false; c.dispatchEvent(new Event('change',{bubbles:true})); }); await p.waitForTimeout(400); }
  // livelli (Base / Comfort / Premium)
  await S(()=>{ const s=window.IECI_T.S(); s.tiers.on=true; s.lines.forEach((l,i)=>{ if(i===s.lines.length-1) l.tm=[1,2]; }); });
  await controlla(tipo,'livelli Base/Comfort/Premium');
  await S(()=>{ const s=window.IECI_T.S(); s.tiers.on=false; s.lines.forEach(l=>{ delete l.tm; }); });
}
// videocitofono: tutte le varianti, con un modello alternativo IVA inclusa
for(const k of ['video','cit','both','brands']){
  await S(()=>{ const b=document.querySelector('[data-m="vcit"]'); b&&b.click(); }); await p.waitForTimeout(300);
  await S(()=>{ const T=window.IECI_T,s=T.S(); s.lines=[]; s.products=[]; s.tiers.on=false; s.econ.mode='righe'; s.cond.sys=[]; T.touch(); });
  await S(k=>{ const b=document.querySelector('[data-vck="'+k+'"]'); b&&b.click(); },k); await p.waitForTimeout(500);
  await S(()=>{ const b=document.getElementById('vc-fill'); b&&!b.closest('[hidden]')&&b.click(); }); await p.waitForTimeout(500);
  const kk=await S(()=>{ const b=document.querySelector('[data-vm^="add:"]'); if(!b) return ''; b.click(); return b.getAttribute('data-vm').split(':')[1]; }); await p.waitForTimeout(300);
  if(kk){ await S(kk=>{ const o=window.IECI_T.S().cond.vm[kk].o[0]; o.n='Monitor alternativo prova'; o.pm='inc'; o.p=219.6; },kk); }
  const r=await controlla('videocitofono','variante '+k);
  if(kk){ const box=await S(()=>{ const x=document.querySelector('#doc .vmbox'); return x?x.innerText:''; });
    ok(/219,60 € IVA inclusa/.test(box),'videocitofono · variante '+k+': modello alternativo IVA inclusa → 219,60 € IVA inclusa'); }
  // totale libero come lo scrivi tu: un campo unico, oppure uno per soluzione / impianto
  await S(()=>document.querySelector('[data-vcp="totale"]').click()); await p.waitForTimeout(400);
  const campi=await S(()=>{ const v={}; [...document.querySelectorAll('#vc-tot [data-b]')].filter(x=>x.offsetParent&&x.tagName==='INPUT').forEach(x=>v[x.getAttribute('data-b')]=1); return Object.keys(v); });
  let val=3000; for(const f of campi){ await S(([f,v])=>{ const x=document.querySelector('#vc-tot [data-b="'+f+'"]'); x.value=String(v); x.dispatchEvent(new Event('input',{bubbles:true})); },[f,val]); val+=1000; }
  await p.waitForTimeout(400);
  await controlla('videocitofono','variante '+k+' con totale libero');
  const dt=await S(()=>document.getElementById('doc').innerText);
  ok(campi.length>0&&/3\.000,00/.test(dt)&&(campi.length<2||/4\.000,00/.test(dt)),'videocitofono · variante '+k+' con totale libero: i totali scritti compaiono nel preventivo ('+campi.join(', ')+')');
  await S(()=>document.querySelector('[data-vcp="righe"]').click()); await p.waitForTimeout(300);
}
console.log('controlli superati: '+nok);
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
