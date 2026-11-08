/* ===== Listino ⇄ Prodotti: le tue voci a portata di mano =====
   - «Mia»: voce creata da te (non c'era nel listino originale); «Prezzo tuo»: voce originale col prezzo cambiato
   - filtri Tutte · Le mie · Con scheda · Senza prezzo, in Listini e in «Aggiungi dal listino»
   - ogni voce mostra la foto e la scheda del prodotto con lo stesso nome (preventivo o libreria prodotti) e la apre in Prodotti
   - «+» mette la voce nel preventivo; nelle schede di Prodotti «Nel listino…» o «Aggiungi al listino» */
var LSX={def:{},f:'tutte',cf:'tutte'};
try{ LSX.f=localStorage.getItem('ieci-lsf')||'tutte'; LSX.cf=localStorage.getItem('ieci-catf')||'tutte'; }catch(e){}
function lsDef(m){
  if(typeof LSX==='undefined'||!LSX) return {};
  if(!LSX.def[m]){ var o={}; try{ (fresh().cat[m]||[]).forEach(function(it){ o[lcn(it[0])]=num(it[2]); }); }catch(e){} LSX.def[m]=o; }
  return LSX.def[m];
}
// '' originale · 'mia' creata da te · 'prezzo' originale con il tuo prezzo
function lsTipo(m,it){ var d=lsDef(m), k=lcn(it[0]); if(!k) return ''; if(!(k in d)) return 'mia'; return Math.abs(num(it[2])-d[k])>0.004?'prezzo':''; }
// la scheda prodotto con lo stesso nome: prima quella del preventivo aperto, poi la libreria
// indice dei nomi (preventivo + libreria), rifatto al massimo ogni mezzo secondo o se cambia il numero di schede
function lsIdx(){
  var dp=(typeof DB!=='undefined'&&DB&&DB.prods)?DB.prods:[], k=(S.products||[]).length+'|'+dp.length, X=(typeof LSX!=='undefined'&&LSX)?LSX:{};
  if(X.ix&&X.ixk===k&&Date.now()-X.ixt<500) return X.ix;
  var ix={}; (S.products||[]).forEach(function(x){ var n=lcn(x.name); if(n){ ix[n]=ix[n]||{}; if(!ix[n].q) ix[n].q=x; } }); dp.forEach(function(x){ var n=lcn(x.name); if(n){ ix[n]=ix[n]||{}; if(!ix[n].l) ix[n].l=x; } });
  X.ix=ix; X.ixk=k; X.ixt=Date.now(); return ix;
}
function lsProd(it){
  var n=lcn(it[0]); if(!n) return null; var e=lsIdx()[n]; if(!e) return null;
  var q=e.q||null, l=e.l||null;
  var a=q||l, ph=(a.photos&&a.photos[0])||(l&&l.photos&&l.photos[0])||'', br=a.brand||(l&&l.brand)||'';
  return {q:q,l:l,ph:ph,br:br,nf:Math.max((q&&q.photos||[]).length,(l&&l.photos||[]).length)};
}
function lsPassa(f,m,it){
  if(f==='mie') return lsTipo(m,it)!=='';
  if(f==='scheda') return !!lsProd(it);
  if(f==='zero') return !(num(it[2])>0);
  return true;
}
function lsConta(m){ var it=S.cat[m]||[], c={tutte:it.length,mie:0,scheda:0,zero:0}; it.forEach(function(x){ if(lsTipo(m,x)) c.mie++; if(lsProd(x)) c.scheda++; if(!(num(x[2])>0)) c.zero++; }); return c; }
function lsChips(f,c,extraMie){
  var L=[['tutte','Tutte'],['mie','Le mie voci'],['scheda','Con scheda'],['zero','Senza prezzo']];
  return L.map(function(o){ var n=c[o[0]]+(o[0]==='mie'&&extraMie?extraMie:0); if(o[0]==='zero'&&!n&&f!=='zero') return ''; if(o[0]==='scheda'&&!n&&f!=='scheda') return '';
    return '<button type="button" class="lsc'+(o[0]==='mie'?' mie':'')+'" data-lsf="'+o[0]+'" aria-pressed="'+(f===o[0])+'">'+o[1]+' <b>'+n+'</b></button>'; }).join('');
}
function lsBadge(t){ return t==='mia'?'<span class="lsb mia">Mia</span>':t==='prezzo'?'<span class="lsb prz">Prezzo tuo</span>':''; }
function lsThumb(P,cls){
  if(!P) return '';
  if(P.ph) return '<img class="'+cls+'" src="'+esc(imgB(P.ph))+'" alt="" loading="lazy" referrerpolicy="no-referrer">';
  var lg=P.br&&typeof brandLogo==='function'?brandLogo(P.br):''; if(lg) return '<img class="'+cls+' lg" src="'+esc(lg)+'" alt="" loading="lazy" referrerpolicy="no-referrer">';
  return '';
}
function lsSchedaChip(it,i){
  var P=lsProd(it);
  if(P) return '<button type="button" class="pchip on" data-lsp="'+i+'"><span class="pdot"></span>Scheda'+(P.br?' · '+esc(P.br):'')+(P.nf?' · '+P.nf+' foto':'')+' ›</button>';
  return '<button type="button" class="pchip" data-lsp="'+i+'">+ Crea la scheda prodotto</button>';
}
// apre (o crea) la scheda del prodotto in Prodotti
function lsApriScheda(m,i){
  var it=(S.cat[m]||[])[i]; if(!it) return;
  var P=lsProd(it), p=P&&P.q, msg='';
  if(!p&&P&&P.l){ useProd(P.l.id); p=S.products[S.products.length-1]; msg='Scheda «'+it[0]+'» aperta in Prodotti: le modifiche si salvano anche nella libreria'; }
  if(!p){ p={id:uid(),name:String(it[0]).trim(),brand:'',code:'',desc:'',specs:'',link:'',tags:'',photos:[]}; libFill(p,null); S.products.push(p); touch(); msg='Scheda creata: aggiungi foto, marca e descrizione'; }
  openP[p.id]=true; showPanel('prodotti'); renderProducts(true);
  setTimeout(function(){ var d=document.querySelector('#plist details.pe[data-pid="'+p.id+'"]'); if(d){ d.open=true; try{ d.scrollIntoView({behavior:'smooth',block:'start'}); }catch(x){} d.classList.add('trovato'); setTimeout(function(){ d.classList.remove('trovato'); },2000); } },80);
  if(msg) toast(msg);
}
// mette una voce di qualsiasi listino nel preventivo aperto
function lsAlPreventivo(m,i,btn){
  var it=(S.cat[m]||[])[i]; if(!it) return;
  if(m===S.model) catAdd(i);
  else {
    var l={d:it[0],u:it[1]||'cad',q:1,p:num(it[2]),s:0}; if(S.model==='app'&&curKey()) l.r=curKey(); brTag(l);
    var lk=linkLine(l); S.lines.push(l); if(lk&&lk.created) renderProducts(); renderLines(); touch(); toast('Aggiunto al preventivo: '+it[0]);
  }
  if(btn){ btn.classList.add('fatto'); setTimeout(function(){ btn.classList.remove('fatto'); },900); }
}
// nella scheda di Prodotti: dov'è nel listino
function prodListino(p,i){
  var n=lcn(p.name); if(!n) return '';
  var trov=null; [S.model].concat(ORDER.filter(function(k){ return k!==S.model; })).forEach(function(m){ if(trov) return; (S.cat[m]||[]).forEach(function(it,ix){ if(!trov&&lcn(it[0])===n) trov={m:m,i:ix,it:it}; }); });
  if(trov) return '<div class="plist-ls"><span>Nel listino «'+esc(MODELS[trov.m].short)+'» · '+(num(trov.it[2])>0?eur(num(trov.it[2]))+'/'+esc(trov.it[1]):'senza prezzo')+'</span><button type="button" class="btn ghost sm" data-plsgo="'+trov.m+'|'+trov.i+'">Apri nel listino ›</button></div>';
  return '<div class="plist-ls no"><span>Non è nel listino: aggiungila e la ritrovi tra «Le mie voci».</span><button type="button" class="btn ghost sm" data-plsadd="'+i+'">+ Aggiungi al listino «'+esc(MODELS[S.model].short)+'»</button></div>';
}
function lsVaiVoce(m,ix){
  lsModel=m; lsQ=''; LSX.f='tutte'; var it=(S.cat[m]||[])[ix]; if(!it) return;
  var gl=cgSync(m), gn=it[3]&&gl.indexOf(it[3])>-1?it[3]:''; lsClosed[m+'|'+(gn||'~')]=false;
  showPanel('listini'); $('ls-q').value=''; renderListini();
  setTimeout(function(){ var r=document.querySelector('#ls-body .lsr[data-i="'+ix+'"]'); if(r){ try{ r.scrollIntoView({behavior:'smooth',block:'center'}); }catch(x){} r.classList.add('trovato'); setTimeout(function(){ r.classList.remove('trovato'); },2000); } },80);
}
function prodiInLibreriaNonInListino(q){
  if(typeof DB==='undefined'||!DB||!DB.prods) return [];
  var nomi={}; ORDER.forEach(function(m){ (S.cat[m]||[]).forEach(function(it){ nomi[lcn(it[0])]=1; }); });
  var qq=lc(q||'');
  return DB.prods.filter(function(p){ if(nomi[lcn(p.name)]) return false; return !qq||lc(p.name+' '+(p.brand||'')+' '+(p.code||'')+' '+(p.tags||'')).indexOf(qq)>-1; });
}
function libRigheHtml(L){
  if(!L.length) return '';
  return '<div class="cgh libh">Dalla tua libreria prodotti</div>'+L.slice(0,30).map(function(p){
    var ph=(p.photos||[])[0];
    return '<div class="crow lib">'+(ph?'<img class="cth" src="'+esc(imgB(ph))+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'')+'<span class="d">'+esc(p.name)+(p.brand?'<small>'+esc(p.brand)+'</small>':'')+'</span><span class="u">'+(num(p.lp)?eur(num(p.lp))+'/'+esc(p.lu||'cad'):'scrivi il prezzo')+'</span><button type="button" class="btn sm" data-libadd="'+esc(p.id)+'" aria-label="Aggiungi al preventivo">+</button></div>';
  }).join('');
}
/* ---- eventi ---- */
$('ls-f').addEventListener('click',function(e){ var b=e.target.closest('[data-lsf]'); if(!b) return; LSX.f=b.getAttribute('data-lsf'); try{ localStorage.setItem('ieci-lsf',LSX.f); }catch(x){} renderListini(); });
$('cat-fl').addEventListener('click',function(e){ var b=e.target.closest('[data-lsf]'); if(!b) return; LSX.cf=b.getAttribute('data-lsf'); try{ localStorage.setItem('ieci-catf',LSX.cf); }catch(x){} renderCat(); });
$('ls-body').addEventListener('click',function(e){
  var b;
  if((b=e.target.closest('[data-lsadd]'))){ e.stopPropagation(); lsAlPreventivo(lsModel,+b.getAttribute('data-lsadd'),b); return; }
  if((b=e.target.closest('[data-lsp]'))){ e.stopPropagation(); lsApriScheda(lsModel,+b.getAttribute('data-lsp')); return; }
},true);
$('cat').addEventListener('click',function(e){
  var b;
  if((b=e.target.closest('[data-libadd]'))){ e.stopPropagation(); libAggiungi(b.getAttribute('data-libadd')); renderCat(); return; }
  if((b=e.target.closest('[data-csp]'))){ e.stopPropagation(); lsApriScheda(S.model,+b.getAttribute('data-csp')); return; }
},true);
$('plist').addEventListener('click',function(e){
  var b;
  if((b=e.target.closest('[data-plsgo]'))){ var a=b.getAttribute('data-plsgo').split('|'); lsVaiVoce(a[0],+a[1]); return; }
  if((b=e.target.closest('[data-plsadd]'))){
    var p=S.products[+b.getAttribute('data-plsadd')]; if(!p||!String(p.name||'').trim()) return;
    var pz=libPrezzo(p,S.lines)||{p:num(p.lp),u:p.lu||'cad'};
    S.cat[S.model].push([String(p.name).trim(),pz.u||'cad',num(pz.p)]); lsChanged(); renderProducts(true);
    toast('«'+p.name+'» aggiunta al listino «'+MODELS[S.model].short+'»'+(num(pz.p)?' a '+eur(num(pz.p)):': scrivi il prezzo')); return;
  }
});
// aperto col dito: il cursore va sulla descrizione (solo se lo apri tu, non quando si apre da solo)
$('ls-new').querySelector('summary').addEventListener('click',function(){ if(!$('ls-new').open) setTimeout(function(){ if($('ls-new').open&&!/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement||{}).tagName||'')) try{ $('ls-nd').focus({preventScroll:true}); }catch(x){} },60); });
(function(T){ if(!T) return; T.lsTipo=lsTipo; T.lsProd=lsProd; T.lsConta=lsConta; T.LSX=LSX; })(window.IECI_T);
