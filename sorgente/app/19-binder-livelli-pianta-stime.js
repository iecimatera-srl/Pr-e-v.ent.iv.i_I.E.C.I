/* ---------- binder generico (data-b) ---------- */
function getPath(p){ var a=p.split('.'),o=S,i; for(i=0;i<a.length;i++){ if(o==null) return ''; o=o[a[i]]; } return o; }
function setPath(p,v){ var a=p.split('.'),o=S,i; for(i=0;i<a.length-1;i++){ if(o[a[i]]==null) o[a[i]]={}; o=o[a[i]]; } o[a[a.length-1]]=v; }
function syncB(){
  Array.prototype.forEach.call(document.querySelectorAll('[data-b]'),function(el){
    var v=getPath(el.getAttribute('data-b'));
    if(el.type==='checkbox') el.checked=!!v; else el.value=(v==null?'':v);
  });
}
function afterB(el){
  var a=el.getAttribute('data-after'), p=el.getAttribute('data-b');
  if(a==='content'){ renderContent(); renderOrder(); }
  if(a==='fv') renderFvRes();
  if(a==='invio') renderInvio();
  if(p.indexOf('econ.')===0){ if(p==='econ.mode'&&brOn()&&S.econ.mode==='totale'){ S.econ.mode='righe'; var tt0=sysList().map(function(x,i){ return totals(i).tot; }); S.econ.mode='totale'; sysList().forEach(function(x,i){ if(!num(x.tot)) x.tot=tt0[i]||''; }); }
  if(p==='econ.mode'){ renderEcon(); renderLines(); renderTiers(); renderContent(); } renderInvio(); }
  if(p.indexOf('tiers.')===0){
    if(p==='tiers.n'||p==='tiers.on'){ renderTiers(); renderContent(); }
    else if(p.indexOf('tiers.names')===0) updateTierOpts();
    renderLines();
  }
  if(p.indexOf('company.')===0||p.indexOf('trust.')===0||p.indexOf('client.')===0) renderInvio();
  if(p.indexOf('cond.')===0||p==='econ.total'||p==='econ.vat') syncB();
}
document.addEventListener('input',function(e){
  var t=e.target, p=t.getAttribute&&t.getAttribute('data-b'); if(!p) return;
  var v=t.type==='checkbox'?t.checked:t.value;
  if(t.hasAttribute('data-int')) v=parseInt(v,10);
  setPath(p,v); afterB(t); touch();
});
/* ---------- offerte a livelli (editor) ---------- */
function renderEcon(){
  var b=$('econ-box'); if(!b) return;
  var h='<label class="f">Come vuoi mostrare il prezzo<select data-b="econ.mode"><option value="righe">Prezzo su ogni voce (somma automatica)</option><option value="totale">Solo un totale libero (nessun prezzo sulle voci)</option></select></label>';
  if(econOn()){
    h+='<div class="grid2">'+(brOn()?vcFreeFields():vcBothFlag()?'<label class="f">Totale: '+esc(S.tiers.names[0]||'soluzione 1')+' (€)<input type="number" step="any" min="0" data-b="cond.tc"></label><label class="f">Totale: '+esc(S.tiers.names[1]||'soluzione 2')+' (€)<input type="number" step="any" min="0" data-b="cond.tv"></label>':'<label class="f">Totale (€)<input type="number" step="any" min="0" data-b="econ.total" placeholder="es. 4500"></label>')+
      '<label class="f">Il totale è<select data-b="econ.vat"><option value="incl">IVA inclusa</option><option value="excl">IVA esclusa (si aggiunge)</option></select></label></div>'+
      '<label class="f">Dicitura del totale (facoltativa)<textarea rows="1" class="t1" data-b="econ.label" placeholder="es. Totale lavori chiavi in mano"></textarea></label>'+
      '<label class="chk"><input type="checkbox" data-b="econ.breakdown">Mostra imponibile e IVA sopra il totale</label>'+
      '<label class="f">Nota sotto il totale (facoltativa)<textarea data-b="econ.note" style="min-height:60px" placeholder="es. Comprensivo di materiali, manodopera e dichiarazione di conformità"></textarea></label>'+
      '<p class="hint">Le righe qui sotto servono solo a descrivere i lavori e non mostrano prezzi. Sconto % e offerta a livelli non si applicano.</p>';
  } else {
    h+='<div class="grid2"><label class="f">Totale finale concordato (facoltativo)<input type="number" step="any" min="0" data-b="econ.agreed" placeholder="vuoto = somma delle righe"></label>'+
      '<label class="f">L\'importo concordato è<select data-b="econ.vat"><option value="incl">IVA inclusa</option><option value="excl">IVA esclusa</option></select></label></div>'+
      '<p class="hint">Se è più basso della somma delle righe, nel preventivo compare lo sconto concordato (sostituisce lo sconto %).</p>';
  }
  b.innerHTML=h; syncB();
}
function renderTiers(){
  if(vcOn()&&vcMode()==='both'&&S.tiers.on){ vcSolSync(); $('tier-box').innerHTML='<p class="hint">Titoli e loghi delle due soluzioni si cambiano nel riquadro «Impianto condominiale». Qui indichi quale consigli e, a trattativa conclusa, quale ha scelto il cliente.</p><div class="grid2"><label class="f">Soluzione consigliata<select id="t-rec" data-b="tiers.rec" data-int></select></label><label class="f">Soluzione scelta dal cliente<select id="t-sel" data-b="tiers.sel" data-int></select></label></div>'; updateTierOpts(); syncB(); return; }
  if(brOn()){ sysTiers(); $('tier-box').innerHTML='<p class="hint">'+(vcOn()?'Gli impianti a confronto si gestiscono nel riquadro «Impianto condominiale».':'Le proposte a confronto si gestiscono nel riquadro «Proposte a confronto per marca».')+' Qui indichi quale consigli e, a trattativa conclusa, quale ha scelto il cliente.</p><div class="grid2"><label class="f">'+brW()+' '+brRec()+'<select id="t-rec" data-b="tiers.rec" data-int></select></label><label class="f">'+brW()+' scelt'+(vcOn()?'o':'a')+' dal cliente<select id="t-sel" data-b="tiers.sel" data-int></select></label></div>'; updateTierOpts(); syncB(); return; }
  if(econOn()&&!vcBothFlag()&&!brOn()){ $('tier-box').innerHTML='<p class="hint">L\'offerta a livelli non è disponibile con il totale libero.</p>'; return; }
  var n=tierN(), h='<label class="chk"><input type="checkbox" data-b="tiers.on"><b>Offerta a livelli (es. Base / Comfort / Premium)</b></label>';
  if(S.tiers.on){
    h+='<div class="grid2"><label class="f">Numero di livelli<select data-b="tiers.n" data-int><option value="2">2</option><option value="3">3</option></select></label>'+
      '<label class="f">Livello consigliato<select id="t-rec" data-b="tiers.rec" data-int></select></label>'+
      '<label class="f">Livello scelto dal cliente<select id="t-sel" data-b="tiers.sel" data-int></select></label></div><div class="grid2">';
    for(var j=0;j<n;j++) h+='<label class="f">Nome livello '+(j+1)+'<input type="text" data-b="tiers.names.'+j+'"></label>';
    h+='</div><p class="hint">Sulle righe spunta i livelli in cui ogni voce è inclusa. Le righe facoltative restano fuori dai livelli.</p>';
  }
  $('tier-box').innerHTML=h; updateTierOpts(); syncB();
}
function updateTierOpts(){
  var r=$('t-rec'), s=$('t-sel'); if(!r||!s) return;
  var n=tierN(), o='', k;
  for(k=0;k<n;k++) o+='<option value="'+k+'">'+esc(S.tiers.names[k])+'</option>';
  var keepR=r.value, keepS=s.value;
  r.innerHTML='<option value="-1">Nessuno</option>'+o; s.innerHTML='<option value="-1">Non ancora scelto</option>'+o;
  r.value=String(S.tiers.rec); s.value=String(S.tiers.sel);
}
/* ---------- pianta ---------- */
var plSel=-1, plType=0, plDrag=null;
function renderPlan(){
  var T=MARKT[S.model]||MARKT.dom;
  if(plType>=T.length) plType=0;
  $('pl-types').innerHTML=T.map(function(t,i){ return '<button type="button" class="tab" data-plt="'+i+'" aria-pressed="'+(i===plType)+'"><span class="dot" style="background:'+t[1]+'"></span>'+esc(t[0])+'</button>'; }).join('');
  var P=S.plan;
  if(!P.img){ $('pl-ed').innerHTML='<div class="empty">Carica una planimetria o uno schizzo per iniziare.</div>'; }
  else $('pl-ed').innerHTML='<div class="pled" id="pl-box"><img src="'+P.img+'" alt="" draggable="false">'+
    P.marks.map(function(k,i){ return '<span class="mk'+(i===plSel?' sel':'')+'" data-mi="'+i+'" style="left:'+(k.x*100)+'%;top:'+(k.y*100)+'%;background:'+k.c+';color:'+(lum(k.c)>0.6?'#111':'#fff')+'">'+(i+1)+'</span>'; }).join('')+'</div>';
  $('pl-count').textContent=P.marks.length?(P.marks.length+' segnaposto. Il tipo scelto sopra vale per i prossimi che aggiungi.'):'';
  $('pl-rm').disabled=!P.img; $('pl-clr').disabled=!P.marks.length; $('pl-del').disabled=plSel<0;
}
$('pl-types').addEventListener('click',function(e){ var b=e.target.closest('[data-plt]'); if(!b) return; plType=+b.getAttribute('data-plt'); renderPlan(); });
$('pl-file').addEventListener('change',function(e){
  var f=e.target.files&&e.target.files[0]; e.target.value=''; if(!f) return;
  readImage(f,1600,false,function(url){
    if(!url){ toast('Immagine non valida'); return; }
    var im=new Image(); im.onload=function(){ S.plan.img=url; S.plan.w=im.naturalWidth; S.plan.h=im.naturalHeight; S.plan.marks=[]; plSel=-1; renderPlan(); touch(); toast('Planimetria caricata'); }; im.src=url;
  });
});
$('pl-rm').addEventListener('click',function(){ S.plan={img:'',w:0,h:0,marks:[]}; plSel=-1; renderPlan(); touch(); });
$('pl-clr').addEventListener('click',function(){ S.plan.marks=[]; plSel=-1; renderPlan(); touch(); });
$('pl-del').addEventListener('click',function(){ if(plSel>=0){ S.plan.marks.splice(plSel,1); plSel=-1; renderPlan(); touch(); } });
function plPos(e){ var box=$('pl-box'),r=box.getBoundingClientRect(); return {x:Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y:Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))}; }
$('pl-ed').addEventListener('pointerdown',function(e){
  var m=e.target.closest('.mk'); if(!m) return;
  e.preventDefault(); plSel=+m.getAttribute('data-mi'); plDrag={i:plSel,moved:false};
  Array.prototype.forEach.call($('pl-box').querySelectorAll('.mk'),function(x){ x.classList.toggle('sel',+x.getAttribute('data-mi')===plSel); });
  $('pl-del').disabled=false; try{ m.setPointerCapture(e.pointerId); }catch(x){}
});
$('pl-ed').addEventListener('pointermove',function(e){
  if(!plDrag) return; var p=plPos(e), k=S.plan.marks[plDrag.i], m=$('pl-box').querySelector('[data-mi="'+plDrag.i+'"]');
  k.x=p.x; k.y=p.y; plDrag.moved=true; if(m){ m.style.left=(p.x*100)+'%'; m.style.top=(p.y*100)+'%'; }
});
function plEnd(){ if(plDrag){ var mv=plDrag.moved; plDrag=null; if(mv) touch(); } }
$('pl-ed').addEventListener('pointerup',plEnd); $('pl-ed').addEventListener('pointercancel',plEnd);
$('pl-ed').addEventListener('click',function(e){
  if(e.target.closest('.mk')) return;
  if(e.target.tagName!=='IMG') return;
  var T=MARKT[S.model]||MARKT.dom, t=T[plType]||T[0], p=plPos(e);
  S.plan.marks.push({x:p.x,y:p.y,k:t[0],c:t[1]}); plSel=S.plan.marks.length-1; renderPlan(); touch();
});
$('pl-ed').addEventListener('dblclick',function(e){
  var m=e.target.closest('.mk'); if(!m) return; S.plan.marks.splice(+m.getAttribute('data-mi'),1); plSel=-1; renderPlan(); touch();
});
/* ---------- stime ---------- */
function renderFvRes(){
  var R=fvCalc();
  $('fv-res').innerHTML='Produzione 1° anno: <b>'+fmt0n(R.prod1)+' kWh</b> · Risparmio 1° anno: <b>'+fmt0(R.save1)+'</b> · Rientro: <b>'+(R.pay!=null?'≈ '+qfmt(Math.round(R.pay*10)/10)+' anni':'oltre '+R.N+' anni')+'</b> · Costo considerato: <b>'+eur(R.cost)+'</b>';
}
$('cr-def').addEventListener('click',function(){ S.crono.phases=CRONO_DEF[S.model]||''; syncB(); touch(); toast('Fasi del modello caricate'); });
$('co-def').addEventListener('click',function(){ S.docs.collaudo.list=COLL[S.model]||''; syncB(); touch(); toast('Elenco del modello caricato'); });
