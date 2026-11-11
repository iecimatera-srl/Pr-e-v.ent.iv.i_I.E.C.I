/* ===== Aggiunta rapida delle voci =====
   Una sola casella sopra le voci: scrivi «3 prese» o «20 m canalina» e scegli dal suggerimento (o premi Invio).
   Cerca insieme: il listino del tipo aperto, le tue voci, gli altri listini, la libreria prodotti e le voci
   che hai già usato nei preventivi salvati (con l'ultimo prezzo). Se non trova nulla aggiunge una voce libera.
   Sotto, «Le più usate»: le voci che metti più spesso, a un tocco. Quantità con − e + sulle voci. */
var QA={usi:null,usiK:'',res:[],sel:0};
function qaLeggi(t){
  t=String(t||'').trim(); var q=1, u='', m;
  if((m=t.match(/^(\d+(?:[.,]\d+)?)\s*(metri|metro|mt|m|pz|pezzi|cad|ore|h|kg|pt|punti|nr|n)?\s+(.+)$/i))){ q=num(m[1].replace(',','.')); u=(m[2]||'').toLowerCase(); t=m[3]; }
  else if((m=t.match(/^(.+?)\s*[x×]\s*(\d+(?:[.,]\d+)?)$/i))){ q=num(m[2].replace(',','.')); t=m[1]; }
  if(/^(metri|metro|mt|m)$/.test(u)) u='m'; else if(/^(ore|h)$/.test(u)) u='h'; else if(/^(pz|pezzi|cad|nr|n)$/.test(u)) u='cad'; else if(/^(pt|punti)$/.test(u)) u='pt';
  return {q:q>0?q:1,u:u,t:t.trim()};
}
// quante volte e a che prezzo hai usato ogni voce nei preventivi salvati
function qaUsi(){
  var Q=(typeof DB!=='undefined'&&DB&&DB.quotes)?DB.quotes:[], k=Q.length+'|'+(Q.length?Q[Q.length-1].upd:0)+'|'+(Q.length?Q[0].upd:0);
  if(QA.usi&&QA.usiK===k) return QA.usi;
  var U={}; Q.forEach(function(q){ ((q.data&&q.data.lines)||[]).forEach(function(l){ var n=lcn(l.d); if(!n||l.vm) return; var e=U[n]||(U[n]={d:l.d,n:0,p:0,u:l.u||'cad',t:0,m:{}}); e.n++; e.m[q.model]=(e.m[q.model]||0)+1; if((q.upd||0)>=e.t&&num(l.p)>0){ e.t=q.upd||0; e.p=num(l.p); e.u=l.u||e.u; e.d=l.d; } }); });
  QA.usi=U; QA.usiK=k; return U;
}
function qaCerca(testo){
  var P=qaLeggi(testo), w=lc(P.t).normalize('NFD').replace(/[̀-ͯ]/g,'').split(/\s+/).filter(Boolean); if(!w.length) return {P:P,r:[]};
  var U=qaUsi(), out=[], visti={};
  function punti(nome){ var n=' '+lc(nome).normalize('NFD').replace(/[̀-ͯ]/g,''), s=0; for(var i=0;i<w.length;i++){ var x=w[i], a=n.indexOf(' '+x); if(a>-1) s+=a===0?12:9; else if(x.length>2&&n.indexOf(x)>-1) s+=4; else if(x.length>3&&n.indexOf(x.slice(0,-1))>-1) s+=3; else return 0; } return s; }
  function metti(o,s){ var k=lcn(o.d); if(visti[k]) return; visti[k]=1; var us=U[k]; o.s=s+(us?Math.min(8,us.n*2):0)-o.d.length/60; out.push(o); }
  (S.cat[S.model]||[]).forEach(function(it,i){ var s=punti(it[0]); if(s) metti({d:it[0],u:it[1],p:num(it[2]),ix:i,da:lsTipo(S.model,it)==='mia'?'Mia':'',k:'ls'},s+6+(lsTipo(S.model,it)?3:0)); });
  if(typeof DB!=='undefined'&&DB&&DB.prods) DB.prods.forEach(function(p){ var s=punti(p.name+' '+(p.brand||'')+' '+(p.code||'')); if(s) metti({d:p.name,u:p.lu||'cad',p:num(p.lp),lib:p.id,da:'Libreria',k:'lib'},s+3); });
  Object.keys(U).forEach(function(k){ var e=U[k], s=punti(e.d); if(s) metti({d:e.d,u:e.u,p:e.p,da:'Già usata',k:'uso'},s+2); });
  ORDER.forEach(function(m){ if(m===S.model) return; (S.cat[m]||[]).forEach(function(it){ var s=punti(it[0]); if(s) metti({d:it[0],u:it[1],p:num(it[2]),da:MODELS[m].short,k:'alt'},s); }); });
  out.sort(function(a,b){ return b.s-a.s; });
  return {P:P,r:out.slice(0,6)};
}
function qaPiuUsate(){
  var U=qaUsi(), L=[], inCat={}; (S.cat[S.model]||[]).forEach(function(it,i){ inCat[lcn(it[0])]=i; });
  Object.keys(U).forEach(function(k){ var e=U[k], n=(e.m[S.model]||0)*2+e.n; if(e.n<2&&!(e.m[S.model])) return; L.push({d:e.d,u:e.u,p:e.p,n:n,ix:inCat[k]}); });
  L.sort(function(a,b){ return b.n-a.n; });
  var gia={}; S.lines.forEach(function(l){ gia[lcn(l.d)]=1; });
  return L.filter(function(x){ return !gia[lcn(x.d)]; }).slice(0,8);
}
function qaAggiungi(o,q,u){
  var prima=S.lines.slice(), l=null, np=false;
  if(o.k==='ls'&&o.ix!=null&&S.cat[S.model][o.ix]&&S.cat[S.model][o.ix][0]===o.d){
    catAdd(o.ix); S.lines.forEach(function(x){ if(!l&&prima.indexOf(x)<0) l=x; });
    if(!l) l=S.lines.filter(function(x){ return x.d===o.d&&num(x.p)===num(o.p); })[0];
    if(l&&q!==1){ l.q=num(l.q)+q-1; }
  } else if(o.k==='lib'&&o.lib){ var n0=S.lines.length; libAggiungi(o.lib); l=S.lines[S.lines.length-1]; if(l&&S.lines.length>n0) l.q=q; }
  else {
    l=addToRoom([o.d,u||o.u||'cad',num(o.p)],q); brTag(l); var lk=linkLine(l); np=!!(lk&&lk.created); if(np) renderProducts();
  }
  if(l&&u&&o.k!=='ls') l.u=u;
  renderLines(); renderRooms(); touch(); tocco(8);
  var i=S.lines.indexOf(l);
  setTimeout(function(){ var r=document.querySelector('#lines .line[data-i="'+i+'"]'); if(!r) return; r.classList.remove('nuova'); void r.offsetWidth; r.classList.add('nuova'); if(!(num(l.p)>0)&&!FREE()){ var pi=r.querySelector('[data-f="p"]'); if(pi){ try{ pi.focus(); pi.select(); }catch(e){} } } },30);
  return l;
}
function qaMostra(){
  var inp=$('qa-in'), box=$('qa-sug'), v=inp.value; $('qa-x').hidden=!v;
  if(!v.trim()){ box.hidden=true; box.innerHTML=''; QA.res=[]; inp.setAttribute('aria-expanded','false'); qaChips(); return; }
  var R=qaCerca(v), P=R.P; QA.res=R.r; QA.P=P; if(QA.sel>R.r.length) QA.sel=0;
  var qq=P.q!==1?'<b class="qa-q">'+esc(qfmt(P.q))+' ×</b> ':'';
  var h=R.r.map(function(o,i){ return '<button type="button" role="option" class="qa-o'+(i===QA.sel?' sel':'')+'" data-qa="'+i+'" aria-selected="'+(i===QA.sel)+'"><span class="qa-d">'+qq+esc(o.d)+'</span><span class="qa-r">'+(o.da?'<i class="qa-t '+o.k+'">'+esc(o.da)+'</i>':'')+'<b>'+(num(o.p)>0?esc(eur(o.p))+'<small>/'+esc(P.u||o.u)+'</small>':'<small>senza prezzo</small>')+'</b></span></button>'; }).join('');
  h+='<button type="button" role="option" class="qa-o lib'+(QA.sel===R.r.length?' sel':'')+'" data-qa="-1"><span class="qa-d">'+qq+'Voce nuova: «'+esc(P.t)+'»</span><span class="qa-r"><small>scrivi tu il prezzo</small></span></button>';
  box.innerHTML=h; box.hidden=false; inp.setAttribute('aria-expanded','true'); $('qa-chips').hidden=true;
}
function qaChips(){
  var c=$('qa-chips'); if(!c) return; var L=qaPiuUsate(); c.hidden=!L.length||!!$('qa-in').value.trim();
  var h=L.length?'<span class="qa-cl">Le più usate</span>'+L.map(function(o,i){ return '<button type="button" class="qa-c" data-qac="'+i+'" title="'+esc(o.d+(o.p?' · '+eur(o.p):''))+'">+ '+esc(o.d.length>30?o.d.slice(0,28)+'…':o.d)+'</button>'; }).join(''):'';
  if(c.getAttribute('data-h')!==h){ c.innerHTML=h; c.setAttribute('data-h',h); } QA.chips=L;
}
function qaScegli(i){
  var P=QA.P||qaLeggi($('qa-in').value), o=i>=0?QA.res[i]:null; if(!o&&!P.t) return;
  if(!o) o={d:P.t.charAt(0).toUpperCase()+P.t.slice(1),u:P.u||'cad',p:0,k:'nuova'};
  qaAggiungi(o,P.q,P.u);
  var inp=$('qa-in'); inp.value=''; QA.sel=0; qaMostra(); if(num(o.p)>0||FREE()) try{ inp.focus({preventScroll:true}); }catch(e){}
}
$('qa-in').addEventListener('input',function(){ QA.sel=0; qaMostra(); });
$('qa-in').addEventListener('focus',function(){ if(this.value.trim()) qaMostra(); });
$('qa-in').addEventListener('keydown',function(e){
  var n=QA.res.length+1;
  if(e.key==='Enter'){ e.preventDefault(); if(this.value.trim()) qaScegli(QA.sel<QA.res.length?QA.sel:-1); }
  else if(e.key==='ArrowDown'&&!$('qa-sug').hidden){ e.preventDefault(); QA.sel=(QA.sel+1)%n; qaMostra(); }
  else if(e.key==='ArrowUp'&&!$('qa-sug').hidden){ e.preventDefault(); QA.sel=(QA.sel+n-1)%n; qaMostra(); }
  else if(e.key==='Escape'){ this.value=''; qaMostra(); }
});
$('qa-x').addEventListener('click',function(){ $('qa-in').value=''; qaMostra(); $('qa-in').focus(); });
$('qa-sug').addEventListener('click',function(e){ var b=e.target.closest('[data-qa]'); if(b) qaScegli(+b.getAttribute('data-qa')); });
$('qa-sug').addEventListener('mousedown',function(e){ e.preventDefault(); });
$('qa-chips').addEventListener('click',function(e){ var b=e.target.closest('[data-qac]'); if(!b) return; var o=(QA.chips||[])[+b.getAttribute('data-qac')]; if(!o) return; qaAggiungi(o.ix!=null?{d:o.d,u:o.u,p:o.p,ix:o.ix,k:(S.cat[S.model][o.ix]&&S.cat[S.model][o.ix][0]===o.d)?'ls':'uso'}:{d:o.d,u:o.u,p:o.p,k:'uso'},1,''); qaChips(); });
/* quantità con − e + */
$('lines').addEventListener('click',function(e){
  var b=e.target.closest('[data-qpm]'); if(!b) return;
  var r=b.closest('.line'), inp=r&&r.querySelector('[data-f="q"]'); if(!inp) return;
  var v=num(inp.value), d=+b.getAttribute('data-qpm'), nv=Math.max(0,Math.round((v+d)*1000)/1000); if(d<0&&v<=1&&v>0&&v%1===0) nv=Math.max(1,nv);
  inp.value=String(nv); inp.dispatchEvent(new Event('input',{bubbles:true})); tocco(6);
  var t=r.querySelector('.tot'); if(t){ t.classList.remove('batte'); void t.offsetWidth; t.classList.add('batte'); }
});
// Invio sul prezzo dell'ultima voce: si torna alla casella per aggiungere la prossima
$('lines').addEventListener('keydown',function(e){
  if(e.key!=='Enter'||!e.target.matches('[data-f="p"],[data-f="q"]')) return;
  var r=e.target.closest('.line'); if(!r) return; e.preventDefault();
  if(e.target.matches('[data-f="q"]')){ var p=r.querySelector('[data-f="p"]'); if(p){ p.focus(); p.select(); return; } }
  try{ $('qa-in').focus(); $('qa-in').scrollIntoView({block:'center',behavior:'smooth'}); }catch(x){}
});
(function(T){ if(!T) return; T.qaLeggi=qaLeggi; T.qaCerca=qaCerca; T.qaPiuUsate=qaPiuUsate; T.qaChips=qaChips; })(window.IECI_T);
