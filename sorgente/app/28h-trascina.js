/* ===== Trascina per riordinare: voci del preventivo e schede in Prodotti =====
   Una maniglia (⠿) a sinistra: tieni premuto e trascina, con il dito o con il mouse. Le altre voci si spostano
   per fare posto; vicino ai bordi dello schermo la pagina scorre da sola. Con la tastiera: frecce su e giù sulla maniglia.
   Se le schede prodotto erano nello stesso ordine delle voci, spostando una voce si sposta anche la sua scheda. */
var DND={on:null};
function grip(lab){ return '<button type="button" class="grip" aria-label="'+esc(lab)+'" title="Tieni premuto e trascina per spostare"><svg viewBox="0 0 12 20" width="12" height="20" aria-hidden="true"><circle cx="3" cy="4" r="1.7"/><circle cx="9" cy="4" r="1.7"/><circle cx="3" cy="10" r="1.7"/><circle cx="9" cy="10" r="1.7"/><circle cx="3" cy="16" r="1.7"/><circle cx="9" cy="16" r="1.7"/></svg></button>'; }
function dndLista(box,itemSel,fatto){
  box.addEventListener('pointerdown',function(e){
    var h=e.target.closest('.grip'); if(!h||!box.contains(h)||DND.on||(e.pointerType==='mouse'&&e.button!==0)) return;
    var it=h.closest(itemSel); if(!it) return;
    var items=Array.prototype.slice.call(box.querySelectorAll(':scope > '+itemSel)), from=items.indexOf(it); if(from<0||items.length<2) return;
    e.preventDefault();
    // posizioni misurate rispetto all'elenco (non alla pagina): restano giuste anche se sopra qualcosa cambia altezza o la pagina scorre
    var bt=function(){ return box.getBoundingClientRect().top; }, b0=bt(), R=items.map(function(x){ var r=x.getBoundingClientRect(); return {t:r.top-b0,h:r.height}; });
    var gap=R.length>1?Math.max(0,R[1].t-(R[0].t+R[0].h)):8, H=R[from].h+gap;
    var st={box:box,items:items,from:from,to:from,y0:e.clientY-b0,y:e.clientY,R:R,H:H,el:it,id:e.pointerId,raf:0,h:h};
    DND.on=st; try{ h.setPointerCapture(e.pointerId); }catch(x){}
    it.classList.add('trascino'); box.classList.add('dnd'); document.documentElement.classList.add('dnd-on'); tocco(12);
    function posa(){
      var py=st.y-bt(), dy=py-st.y0, c=py, to=from, i; // conta dove sta il dito, non il centro della voce
      for(i=from+1;i<items.length;i++) if(c>R[i].t+R[i].h/2) to=i;
      for(i=from-1;i>=0;i--) if(c<R[i].t+R[i].h/2) to=i;
      it.style.transform='translate3d(0,'+dy+'px,0) scale(1.02)';
      if(to!==st.to){ st.to=to; tocco(5); }
      items.forEach(function(x,k){ if(k===from) return; var s=(from<k&&k<=to)?-H:(to<=k&&k<from)?H:0; x.style.transform=s?'translate3d(0,'+s+'px,0)':''; });
    }
    function giro(){ // scorrimento automatico vicino ai bordi
      st.raf=0; if(DND.on!==st) return;
      var v=window.innerHeight, bordoSu=110, bordoGiu=v-120, d=0;
      if(st.y<bordoSu) d=-Math.ceil((bordoSu-st.y)/6); else if(st.y>bordoGiu) d=Math.ceil((st.y-bordoGiu)/6);
      if(d){ var y0=window.scrollY; window.scrollBy(0,d); if(window.scrollY!==y0) posa(); st.raf=requestAnimationFrame(giro); }
    }
    function muovi(ev){ if(ev.pointerId!==st.id) return; ev.preventDefault(); st.y=ev.clientY; posa(); if(!st.raf) st.raf=requestAnimationFrame(giro); }
    function fine(ev){
      if(ev&&ev.pointerId!==st.id) return;
      h.removeEventListener('pointermove',muovi); h.removeEventListener('pointerup',fine); h.removeEventListener('pointercancel',annulla);
      if(st.raf) cancelAnimationFrame(st.raf);
      var to=ev&&ev.type==='pointerup'?st.to:from;
      items.forEach(function(x){ x.style.transform=''; }); it.classList.remove('trascino'); box.classList.remove('dnd'); document.documentElement.classList.remove('dnd-on');
      DND.on=null;
      if(to!==from){ fatto(from,to); tocco(10); } else if(st.rif){ if(box.id==='lines') renderLines(); else renderProducts(true); }
    }
    function annulla(ev){ fine({type:'pointercancel',pointerId:ev.pointerId}); }
    h.addEventListener('pointermove',muovi); h.addEventListener('pointerup',fine); h.addEventListener('pointercancel',annulla);
  });
  // la maniglia non apre/chiude il riquadro e non fa altro al tocco
  box.addEventListener('click',function(e){ if(e.target.closest('.grip')){ e.preventDefault(); e.stopPropagation(); } },true);
  // tastiera: frecce su e giù sulla maniglia
  box.addEventListener('keydown',function(e){
    var h=e.target.closest('.grip'); if(!h||(e.key!=='ArrowUp'&&e.key!=='ArrowDown')) return; e.preventDefault();
    var items=Array.prototype.slice.call(box.querySelectorAll(':scope > '+itemSel)), from=items.indexOf(h.closest(itemSel)), to=from+(e.key==='ArrowUp'?-1:1);
    if(from<0||to<0||to>=items.length) return; fatto(from,to);
    setTimeout(function(){ var n=box.querySelectorAll(':scope > '+itemSel)[to], g=n&&n.querySelector('.grip'); if(g) g.focus(); },30);
  });
}
function insync(){ var pos=[]; S.lines.forEach(function(l){ var p=prodOfLine(l); if(p&&pos.indexOf(p)<0) pos.push(p); }); var lp=S.products.filter(function(p){ return pos.indexOf(p)>-1; }); return lp.every(function(p,i){ return p===pos[i]; }); }
function spostaVoce(from,to){
  var L=S.lines; if(!L[from]) return; var segui=S.products.length>1&&insync();
  L.splice(to,0,L.splice(from,1)[0]);
  if(segui){ prodOrderLikeLines(); renderProducts(); }
  renderLines(); renderRooms(); touch();
  setTimeout(function(){ var r=document.querySelector('#lines .line[data-i="'+to+'"]'); if(r){ r.classList.remove('posata'); void r.offsetWidth; r.classList.add('posata'); } },20);
}
function spostaProdotto(from,to){
  var P=S.products; if(!P[from]) return; P.splice(to,0,P.splice(from,1)[0]); renderProducts(true); touch();
  setTimeout(function(){ var r=$('plist').querySelectorAll(':scope > details.pe')[to]; if(r){ r.classList.remove('posata'); void r.offsetWidth; r.classList.add('posata'); } },20);
}
dndLista($('lines'),'.line',spostaVoce);
dndLista($('plist'),'details.pe',spostaProdotto);
(function(T){ if(!T) return; T.spostaVoce=spostaVoce; T.spostaProdotto=spostaProdotto; })(window.IECI_T);
