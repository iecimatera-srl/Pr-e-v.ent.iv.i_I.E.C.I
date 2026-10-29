// Telefono: il riepilogo del documento non esce mai dallo schermo (nomi di file e testi lunghi, tema scuro);
// righe con i numeri in disordine (foto/screenshot): rimesse a posto con listino, sconto e importo
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const T=['OFFERTA FOX ESS - Elettro Solare srl',
 'Modulo fotovoltaico CANADIAN-465 bifacciale CS6.2-48TD-465  22  160,43  58%  67,38  1.482,36',
 'Smart meter FOX trifase 80A inserzione diretta DTSU666  344  58%  144,48  1',
 'Batteria FOX CM2800 BMS integrato 2,8 kWh  1.719,00  58%  722  1',
 'Inverter FOX H3-10.0-E trifase 10 kW  1  2.150,00  58%  903,00  903,00',
 'Cavo solare 6 mmq  100  1,20  58%  0,50  50,40'].join('\n');
(async()=>{const b=await A.chromium.launch();const errs=[];
for(const w of [320,360,390,412]){
  const ctx=await b.newContext({viewport:{width:w,height:860},isMobile:true,hasTouch:true,colorScheme:'dark'});
  const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
  await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.docApri,null,{timeout:20000}).catch(()=>{});
  await A.mostra(p,'#as-txt');
  const misura=async()=>p.evaluate(()=>{ const box=document.querySelector('#acc-as .accb').getBoundingClientRect(), out=[]; document.querySelectorAll('#acc-as .accb *').forEach(e=>{ const c=e.getBoundingClientRect(); if(c.width&&c.right>box.right+1&&out.length<5) out.push(e.tagName+'.'+String(e.className).slice(0,20)+' «'+String(e.value||e.textContent||'').trim().slice(0,25)+'»'); }); return out; });
  for(const prezzi of ['1','0']){
    await p.evaluate(v=>{ localStorage.setItem('ieci-doc-prezzi',v); const a=window.IECI_T.AS(); a.doc=null; a.res=null; },prezzi);
    await p.evaluate(t=>window.IECI_T.docApri([new File([t],'Screenshot_20261029_112250_Chrome_preventivo_fornitore_FOX_ESS.txt',{type:'text/plain'})]),T);
    await p.waitForFunction(()=>window.IECI_T.AS().doc,null,{timeout:20000}); await p.waitForTimeout(250);
    const f=await misura(); ok(!f.length,w+' px, prezzi '+(prezzi==='1'?'sì':'no')+': niente esce dallo schermo'+(f.length?' '+JSON.stringify(f):''));
  }
  if(w===390){
    const r=await p.evaluate(()=>window.IECI_T.AS().doc.righe.map(r=>({on:r.on,q:r.q,cost:r.cost,list:r.list})));
    console.log(JSON.stringify(r));
    ok(r[1].q===1&&r[1].cost===144.48&&r[1].list===344&&r[1].on,'«344» era il listino, non la quantità: 1 × 144,48 € (344 − 58%)');
    ok(r[2].q===1&&r[2].cost===721.98&&r[2].list===1719&&r[2].on,'batteria: netto 721,98 € (1.719 − 58%), quantità 1');
    ok(r[0].q===22&&r[0].cost===67.38&&r[3].q===1&&r[3].cost===903,'le righe già giuste restano uguali');
    ok(r[4].q===100&&Math.abs(r[4].cost-0.504)<0.0001,'cavo: netto preciso 0,504 €/m, così 100 m fanno 50,40 €');
  }
  await ctx.close();
}
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
