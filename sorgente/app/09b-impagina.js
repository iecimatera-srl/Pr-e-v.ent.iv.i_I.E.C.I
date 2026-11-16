/* ===== Impaginazione A4 del fascicolo =====
   Ogni pagina è un A4 (794 × 1123 px). Se il contenuto di una pagina non ci sta, quello che avanza passa a una
   pagina di continuazione con la stessa intestazione e lo stesso piè di pagina, e così via finché serve.
   - si va a capo tra un elemento e l'altro (un prodotto, una riga, un paragrafo): niente tagliato a metà;
   - un elemento grande (una tabella, un elenco) si divide al suo interno; le tabelle ripetono l'intestazione;
   - un titolo non resta da solo in fondo alla pagina: va con quello che introduce;
   - se un singolo elemento è più alto di una pagina intera, viene rimpicciolito quanto basta.
   Le misure sono prese sullo schermo con il rapporto della larghezza (l'anteprima è ridotta con lo zoom). */
var A4H=1123, A4W=794;
function impScala(pg){ var r=pg.getBoundingClientRect(); return r.width?r.width/A4W:1; }
function impTitolo(e){ return !!e&&(/^H[1-6]$/.test(e.tagName)||/(^|\s)(sec|lead|kick|pgrp-head|pgrp-mini|grp-h|eyebrow)(\s|$)/.test(String(e.className||''))); }
function impSpezzabile(e,s){
  if(!e||!e.children.length) return false;
  if(/^(TABLE|TBODY|THEAD|UL|OL|DL|SECTION|DIV|ARTICLE)$/.test(e.tagName)===false) return false;
  if(/^(IMG|SVG|CANVAS|TR|FIGURE|PICTURE)$/.test(e.tagName)) return false;
  // le cose piccole (una scheda prodotto, un riquadro) restano intere; si dividono solo quelle grandi o le tabelle
  return e.tagName==='TABLE'||e.tagName==='TBODY'||e.tagName==='UL'||e.tagName==='OL'||e.getBoundingClientRect().height/s>300;
}
// divide «el» al limite (coordinate dello schermo): restituisce il clone con quello che passa alla pagina dopo, o null
function impDividi(el,lim,s,cima){
  var kids=Array.prototype.slice.call(el.children).filter(function(k){ var cs=getComputedStyle(k); return cs.position!=='absolute'&&cs.position!=='fixed'&&cs.display!=='none'; });
  var cut=-1, i;
  for(i=0;i<kids.length;i++){ var r=kids[i].getBoundingClientRect(); if(r.bottom>lim+1*s){ cut=i; break; } }
  if(cut<0) return null;
  var k=kids[cut], rk=k.getBoundingClientRect(), cl=el.cloneNode(false), da=cut, parte=null;
  cl.removeAttribute('id');
  if(impSpezzabile(k,s)&&rk.top<lim-40*s) parte=impDividi(k,lim,s,false);
  if(parte){ da=cut+1; }
  else { while(da>0&&impTitolo(kids[da-1])) da--; } // il titolo va con quello che introduce
  if(da===0&&!parte&&!cima) return null; // a questo livello non resta niente: si sposta il contenitore intero
  if(da===0&&!parte&&cima){ // il primo elemento non ci sta neanche da solo: lo rimpicciolisco
    var hmax=(lim-k.getBoundingClientRect().top)/s, hk=rk.height/s;
    if(hk>40&&hmax>40){ k.style.zoom=String(Math.max(.3,Math.floor(hmax/hk*1000)/1000)); }
    return null;
  }
  if(parte) cl.appendChild(parte);
  for(i=da;i<kids.length;i++) if(i!==cut||!parte) cl.appendChild(kids[i]);
  if(el.tagName==='TABLE'&&el.tHead&&!cl.tHead) cl.insertBefore(el.tHead.cloneNode(true),cl.firstChild);
  return cl.children.length?cl:null;
}
function impNuova(pg){
  var b=pg.querySelector(':scope>.pg-b'), np=pg.cloneNode(false);
  Array.prototype.forEach.call(pg.children,function(c){ np.appendChild(c===b?b.cloneNode(false):c.cloneNode(true)); });
  np.classList.add('pg-cont'); np.removeAttribute('id'); np._da=pg._da||pg;
  pg.parentNode.insertBefore(np,pg.nextSibling); return np;
}
// sposta nella pagina dopo quello che non ci sta; ripete sulle pagine nuove
function impTrabocca(pg,n){
  n=n||0; if(!pg||n>60) return;
  var b=pg.querySelector(':scope>.pg-b'); if(!b) return;
  var cv=pg.style.contentVisibility; pg.style.contentVisibility='visible';
  try{
    var s=impScala(pg), rp=pg.getBoundingClientRect();
    if(rp.height/s<=A4H+1) return;
    // spazio per il corpo: altezza A4 meno intestazione, piè di pagina e margini (tutto quello che non è corpo)
    var rb=b.getBoundingClientRect(), fuori=rp.height-rb.height, lim=rb.top+(A4H*s-fuori);
    var via=impDividi(b,lim,s,true); if(!via) return;
    var nx=pg.nextElementSibling, own=pg._da||pg;
    if(!(nx&&nx.classList.contains('pg-cont')&&(nx._da===own))) nx=impNuova(pg);
    var nb=nx.querySelector(':scope>.pg-b'), fr=document.createDocumentFragment();
    while(via.firstChild) fr.appendChild(via.firstChild);
    nb.insertBefore(fr,nb.firstChild);
  } finally { pg.style.contentVisibility=cv; }
  impTrabocca(pg.nextElementSibling&&pg.nextElementSibling.classList.contains('pg-cont')?pg.nextElementSibling:null,n+1);
  impTrabocca(pg,n+1);
}
// pagine «principali» (una per ogni parte del fascicolo) e le loro continuazioni
function docPrim(d){ return Array.prototype.filter.call(d.children,function(c){ return !c.classList||!c.classList.contains('pg-cont'); }); }
function docTogliCont(el){ var n=el.nextElementSibling; while(n&&n.classList.contains('pg-cont')&&n._da===el){ var x=n.nextElementSibling; n.remove(); n=x; } }
function impagina(el){ if(el&&el.classList&&el.classList.contains('page')&&!el.classList.contains('pg-cont')){ el._da=el; impTrabocca(el,0); } }
function impaginaTutto(){ var d=$('doc'); if(!d||document.documentElement.classList.contains('locked')) return; docPrim(d).forEach(function(p){ impagina(p); var n=p.nextElementSibling; while(n&&n.classList.contains('pg-cont')){ impTrabocca(n,0); n=n.nextElementSibling; } }); }
// le foto arrivano dopo: se una pagina si allunga, il di più passa alla pagina dopo
(function(){
  var d=$('doc'), T=0, Q=[];
  if(!d) return;
  d.addEventListener('load',function(e){ if(e.target.tagName!=='IMG') return; var pg=e.target.closest('.page'); if(pg&&Q.indexOf(pg)<0) Q.push(pg); clearTimeout(T); T=setTimeout(function(){ var L=Q; Q=[]; L.forEach(function(p){ if(p.isConnected) impTrabocca(p,0); }); },60); },true);
  try{ document.fonts&&document.fonts.ready.then(function(){ impaginaTutto(); }); }catch(e){}
})();
