/* ---------- offerte, opzioni, totali ---------- */
function mainLines(){ return activeLines().filter(function(l){return !l.opt;}); }
function optLines(){ return activeLines().filter(function(l){return !!l.opt;}); }
function tierN(){ return Math.max(2,Math.min(3,parseInt(S.tiers.n,10)||3)); }
function tierRec(){ var r=parseInt(S.tiers.rec,10); return (r>=0&&r<tierN())?r:-1; }
function tierSel(){ var r=parseInt(S.tiers.sel,10); return (r>=0&&r<tierN())?r:-1; }
function inTier(l,j){ return !l.tm||l.tm.indexOf(j)>-1; }
var ECJ=null, VM_OFF=false;
function econVal(){ if(ECJ!=null&&brOn()) return (sysList()[ECJ]||{}).tot; if(ECJ!=null&&vcBothFlag()){ return ECJ===0?S.cond.tc:S.cond.tv; } return S.econ.total; }
function tiersOn(){ return !!S.tiers.on&&(!econOn()||vcBothFlag()||brOn()); }
function econOn(){ return !!(S.econ&&S.econ.mode==='totale'); }
function FREE(){ return econOn(); }
function agreedOn(){ return !!(S.econ&&S.econ.mode!=='totale'&&!S.tiers.on&&num(S.econ.agreed)>0); }
function fromTot(v){
  var r=num(S.meta.iva), imp, iva, tot; v=r2(v);
  if(S.econ.vat==='excl'){ imp=v; iva=r2(imp*r/100); tot=r2(imp+iva); } else { tot=v; imp=r2(tot/(1+r/100)); iva=r2(tot-imp); }
  return {imp:imp,iva:iva,tot:tot};
}
function calc(sub){
  sub=r2(sub);
  var disc,imp,iva,tot,f,ag=false;
  if(econOn()){ f=fromTot(num(econVal())); var ex=vmExtra(); if(ex){ f.imp=r2(f.imp+ex); f.iva=r2(f.imp*num(S.meta.iva)/100); f.tot=r2(f.imp+f.iva); } sub=f.imp; disc=0; imp=f.imp; iva=f.iva; tot=f.tot; }
  else {
    disc=r2(sub*num(S.meta.disc)/100); imp=r2(sub-disc);
    if(agreedOn()){ f=fromTot(num(S.econ.agreed)); if(f.imp<sub){ imp=f.imp; disc=r2(sub-imp); iva=f.iva; tot=f.tot; ag=true; } }
    if(!ag){ iva=r2(imp*num(S.meta.iva)/100); tot=r2(imp+iva); }
  }
  var dep=r2(tot*num(S.meta.dep)/100);
  return {sub:sub,disc:disc,imp:imp,iva:iva,tot:tot,dep:dep,saldo:r2(tot-dep),ag:ag};
}
function totals(j){
  var L=mainLines(); if(VM_OFF) L=L.filter(function(l){return !l.vm;}); if(j!=null) L=L.filter(function(l){return inTier(l,j);});
  ECJ=(j==null)?null:j; var r=calc(L.reduce(function(a,l){return a+lineTotal(l);},0)); ECJ=null; return r;
}
function acceptedCalc(){ ECJ=((vcBothFlag()||brOn())&&tierSel()>=0)?tierSel():null; var r=calc(acceptedLines().reduce(function(a,l){return a+lineTotal(l);},0)); ECJ=null; return r; }
function headTotal(){
  if(tiersOn()&&tierSel()<0){ var n=tierN(),m=Infinity,j; for(j=0;j<n;j++) m=Math.min(m,totals(j).tot); return 'da '+eur(m); }
  return eur(acceptedCalc().tot);
}
