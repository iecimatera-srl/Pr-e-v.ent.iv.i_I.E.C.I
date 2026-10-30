/* ---------- filigrana ---------- */
var WM={key:'',url:'',w:0,h:0,busy:''};
function wmGen(){
  var st=S.style, src=logoSrcPage(); if(!src||st.wmOn===false) return null;
  var size=Math.max(60,+st.wmSize||170), op=Math.max(1,+st.wmOp||10)/100, rot=+st.wmRot||0, mode=st.wmMode==='one'?'one':'tile';
  var key=[src.length,src.slice(-24),size,op,rot,mode].join('|');
  if(WM.key===key&&WM.url) return WM;
  if(WM.busy===key) return WM.url?WM:null;
  WM.busy=key;
  var im=new Image(); im.onload=function(){
    try{
      var ar=im.naturalHeight/im.naturalWidth, lw=size, lh=size*ar, ang=rot*Math.PI/180, ex=Math.abs(Math.cos(ang))*lw+Math.abs(Math.sin(ang))*lh, ey=Math.abs(Math.sin(ang))*lw+Math.abs(Math.cos(ang))*lh;
      var cw=ex*1.12, ch=ey*0.82, K=2, c=document.createElement('canvas'), x;
      if(mode==='one'){ c.width=Math.ceil(ex*K); c.height=Math.ceil(ey*K); }
      else { c.width=Math.ceil(cw*K); c.height=Math.ceil(ch*2*K); }
      x=c.getContext('2d'); x.scale(K,K); x.globalAlpha=op;
      function put(px,py){ x.save(); x.translate(px,py); x.rotate(ang); x.drawImage(im,-lw/2,-lh/2,lw,lh); x.restore(); }
      if(mode==='one') put(ex/2,ey/2); else { put(cw*0.5,ch*0.5); put(0,ch*1.5); put(cw,ch*1.5); put(cw*0.5,ch*2.5); put(cw*0.5,-ch*0.5); }
      WM={key:key,url:c.toDataURL('image/png'),w:mode==='one'?ex:cw,h:mode==='one'?ey:ch*2,busy:'',mode:mode};
      schedule();
    }catch(e){ WM.busy=''; }
  }; im.onerror=function(){ WM.busy=''; }; im.src=src;
  return WM.url?WM:null;
}
/* ---------- motore dell'anteprima ----------
   Il fascicolo viene ricostruito come testo, ma nella pagina si sostituiscono SOLO le pagine cambiate.
   Le foto (data URL di centinaia di KB) diventano indirizzi blob: brevi, decodificati una volta sola dal browser. */
var DOCC={raw:[],wk:'',wm:'',pend:false,gen:0,tutto:false}, IMGC={}, IMGN=0;
function imgKey(u){ var h=5381, st=Math.max(1,Math.floor(u.length/2000)); for(var i=0;i<u.length;i+=st) h=((h<<5)+h+u.charCodeAt(i))|0; return (h>>>0).toString(36)+'_'+u.length+'_'+u.charCodeAt(u.length-3); }
function imgBlob(u){
  var k=imgKey(u), b=IMGC[k]; if(b) return b;
  try{ var c=u.indexOf(','), bin=atob(u.slice(c+1)), n=bin.length, a=new Uint8Array(n); for(var i=0;i<n;i++) a[i]=bin.charCodeAt(i);
    b=URL.createObjectURL(new Blob([a],{type:u.slice(5,u.indexOf(';'))})); IMGC[k]=b; IMGN++; return b; }catch(e){ return u; }
}
// foto lunghe (data URL) → indirizzi blob. Cerco con indexOf (veloce) invece di un'espressione regolare che
// leggerebbe carattere per carattere megabyte di testo: sul telefono passa da più di un secondo a pochi millesimi.
var DI_T=/^data:image\/(?:png|jpe?g|webp|gif);base64,$/;
// immagine come indirizzo blob (corto) se è un data URL lungo: l'HTML resta leggero da leggere per il browser
function imgB(u){ return typeof u==='string'&&u.length>400&&u.indexOf('data:image/')===0?imgBlob(u):u; }
function docImgs(h){
  var i=h.indexOf('data:image/'); if(i<0) return h;
  var out=[], last=0, n=h.length;
  while(i>-1){
    var b=h.indexOf(';base64,',i), next;
    if(b<0) break;
    if(b-i<=20&&DI_T.test(h.slice(i,b+8))){
      var st=b+8, e=n, k, cs=['"',"'",')','&',' ','<','\\'];
      for(k=0;k<cs.length;k++){ var q=h.indexOf(cs[k],st); if(q>-1&&q<e) e=q; }
      if(e-st>=400){ out.push(h.slice(last,i),imgBlob(h.slice(i,e))); last=e; }
      next=e;
    } else next=i+11;
    i=h.indexOf('data:image/',next);
  }
  if(!last) return h; out.push(h.slice(last)); return out.join('');
}
function wmPrep(){
  var d=$('doc'), w=wmGen();
  if(!w||!w.url){ if(DOCC.wm){ d.style.removeProperty('--wm'); DOCC.wm=''; } return ''; }
  if(DOCC.wm!==w.url){ d.style.setProperty('--wm','url('+imgBlob(w.url)+')'); DOCC.wm=w.url; }
  return '<div class="wm '+(w.mode==='one'?'one':'tile')+'" style="background-size:'+Math.round(w.w)+'px '+Math.round(w.h)+'px"></div>';
}
var PG0='<section class="page';
function docSplit(html){ var out=[], i=html.indexOf(PG0), j; if(i<0) return [html]; if(i>0&&html.slice(0,i).trim()) out.push(html.slice(0,i)); while(i>-1){ j=html.indexOf(PG0,i+PG0.length); out.push(html.slice(i,j<0?html.length:j)); i=j; } return out; }
function docEl(chunk,wk){
  var t=document.createElement('template'), h=chunk.indexOf('<section class="page">')===0?'<section class="page">'+wk+chunk.slice(22):chunk;
  t.innerHTML=docImgs(h).trim(); var c=t.content; return c.childNodes.length===1&&c.firstChild.nodeType===1?c.firstChild:null;
}
function renderDoc(){
  if(document.documentElement.classList.contains('locked')){ DOCC.pend=true; return; }
  var gen=++DOCC.gen;
  applyBrand();
  var order=S.layout, d=$('doc');
  var fn={cover:secCover,azienda:secAzienda,prodotti:secProdotti,prev:secPreventivo,cond:secCond,planimetria:secPlan,fv:secFv,crono:secCrono,fiducia:secFiducia,conferma:secConferma,lavoro:secLavoro,collaudo:secCollaudo};
  // primo disegno (apertura, sblocco): una sezione alla volta, pochi millesimi per fotogramma: l'app risponde subito
  if(!d.children.length&&order.length>1&&!DOCC.tutto){
    var wk0=wmPrep(), k0=0, tutte=[]; DOCC.raw=[]; DOCC.wk=wk0;
    var passo=function(){ if(gen!==DOCC.gen) return; var t0=performance.now();
      while(k0<order.length){ var ky=order[k0++], h0=ky.indexOf('c:')===0?secCustom(ky.slice(2)):fn[ky](); if(h0){ var ps=docSplit(h0);
          for(var j=0;j<ps.length;j++){ var e0=docEl(ps[j],wk0); if(!e0){ DOCC.gen++; d.innerHTML=''; DOCC.raw=[]; DOCC.tutto=true; try{ renderDoc(); }finally{ DOCC.tutto=false; } return; } d.appendChild(e0); tutte.push(ps[j]); } }
        if(performance.now()-t0>8) break; }
      DOCC.raw=tutte.slice(); fit();
      if(k0<order.length){ if(document.hidden) setTimeout(passo,30); else requestAnimationFrame(passo); }
      else if(!tutte.length){ d.innerHTML='<div style="background:#fff;padding:40px;text-align:center;color:#5d646c">Nessuna sezione selezionata. Riattivale dalla scheda Contenuto.</div>'; DOCC.raw=[]; } };
    passo(); return;
  }
  var html=order.map(function(k){return k.indexOf('c:')===0?secCustom(k.slice(2)):fn[k]();}).join(''), wk=wmPrep();
  if(!html){ d.innerHTML='<div style="background:#fff;padding:40px;text-align:center;color:#5d646c">Nessuna sezione selezionata. Riattivale dalla scheda Contenuto.</div>'; DOCC.raw=[]; fit(); return; }
  var parts=docSplit(html), old=DOCC.raw, full=old.length!==d.children.length||DOCC.wk!==wk, i, el, kids=d.children;
  if(!full){
    for(i=0;i<parts.length;i++){
      if(old[i]===parts[i]&&kids[i]) continue;
      el=docEl(parts[i],wk); if(!el){ full=true; break; }
      if(kids[i]) d.replaceChild(el,kids[i]); else d.appendChild(el);
    }
    while(!full&&d.children.length>parts.length) d.removeChild(d.lastElementChild);
  }
  if(full){ d.innerHTML=docImgs(parts.map(function(c){ return c.indexOf('<section class="page">')===0?'<section class="page">'+wk+c.slice(22):c; }).join('')); }
  DOCC.raw=d.children.length===parts.length?parts:[]; DOCC.wk=wk;
  fit();
}
// l'anteprima si aggiorna al massimo una volta per fotogramma e, mentre scrivi, quando fai una pausa
var DOCT=0, DOCLAST=0;
function schedule(){
  clearTimeout(DOCT); if(raf){ cancelAnimationFrame(raf); raf=0; }
  var ae=document.activeElement, typing=ae&&(ae.tagName==='TEXTAREA'||(ae.tagName==='INPUT'&&!/^(checkbox|radio|file|button)$/.test(ae.type)));
  DOCT=setTimeout(function(){ raf=requestAnimationFrame(function(){ raf=0; DOCLAST=Date.now(); renderDoc(); renderQbar(); }); },typing?180:0);
}
var FITZ=0, FITW=0;
function fit(){
  // con il PIN sullo schermo non misuro niente (costringerebbe il browser a impaginare l'app nascosta): si fa allo sblocco
  if(document.documentElement.classList.contains('locked')) return;
  var wrap=$('paperWrap'),d=$('doc'); if(!wrap||!d) return;
  if(!FITW) FITW=wrap.clientWidth;
  var z=Math.min(1,(FITW-24)/794); if(!(z>0)) z=1;
  if(z!==FITZ||String(d.style.zoom)!==String(z)){ d.style.zoom=z; FITZ=z; }
}
window.addEventListener('resize',function(){ FITW=0; fit(); });
try{ new ResizeObserver(function(){ var w=$('paperWrap').clientWidth; if(w&&w!==FITW){ FITW=w; fit(); } }).observe($('paperWrap')); }catch(e){}

/* ---------- editor ---------- */
var SEC=[{p:'dati',l:'Dati'},{p:'prev',l:'Preventivo'},{p:'contenuto',l:'Contenuto'},{p:'pagine',l:'Pagine'},{p:'prodotti',l:'Prodotti'},{p:'piante',l:'Piante'},{p:'stime',l:'Stime'},{p:'fiducia',l:'Fiducia'},{p:'cond',l:'Condizioni e firma'},{p:'documenti',l:'Documenti'},{p:'invio',l:'Invio'},{p:'messaggi',l:'Messaggi di invio'},{p:'archivio',l:'Archivio'},{p:'listini',l:'Modifica listini'},{p:'fornitori',l:'Fornitori'},{p:'azienda',l:'Azienda'},{p:'stile',l:'Stile e logo'},{p:'salva',l:'Salvataggi e aggiornamenti'},{p:'app',l:'Personalizza app'},{p:'menu',l:'Personalizza menu'}];
function secDef(p){ for(var i=0;i<SEC.length;i++) if(SEC[i].p===p) return SEC[i].l; return p; }
function secLabel(p){ var n=MENU&&MENU.names&&MENU.names[p]; return n?n:secDef(p); }
function applyNames(){
  Array.prototype.forEach.call(document.querySelectorAll('[data-panel]'),function(s){
    var h=s.querySelector('h2'); if(!h) return; if(!h.hasAttribute('data-orig')) h.setAttribute('data-orig',h.textContent);
    var n=MENU&&MENU.names&&MENU.names[s.getAttribute('data-panel')]; h.textContent=n?n:h.getAttribute('data-orig');
  });
}
function menuDefault(){
  var g={g1:['dati','prev','prodotti','contenuto','pagine'],g5:['piante','stime','fiducia','cond','documenti','invio','messaggi'],g2:['archivio','fornitori','listini'],g3:['azienda','stile'],g4:['salva','app','menu']}, it=[];
  Object.keys(g).forEach(function(k){ g[k].forEach(function(p){ it.push({p:p,g:k,on:true}); }); });
  return {v:2,mode:'menu',names:{},groups:[{id:'g1',n:'Preventivo'},{id:'g5',n:'Allegati e invio'},{id:'g2',n:'Catalogo e archivio'},{id:'g3',n:'Azienda e stile'},{id:'g4',n:'Gestione app'}],items:it};
}
var MENU=menuDefault();
function menuFix(){
  var d=menuDefault(); if(!MENU||!MENU.groups||!MENU.items) MENU=d;
  if(MENU.mode!=='tabs') MENU.mode='menu'; if(!MENU.names||typeof MENU.names!=='object') MENU.names={};
  if(!MENU.groups.length) MENU.groups=d.groups;
  var gid={}; MENU.groups.forEach(function(g){ gid[g.id]=1; });
  var seen={}; MENU.items=MENU.items.filter(function(i){ if(!secLabel(i.p)||secLabel(i.p)===i.p&&!SEC.some(function(s){ return s.p===i.p; })||seen[i.p]) return false; seen[i.p]=1; return true; });
  MENU.items.forEach(function(i){ if(!gid[i.g]) i.g=MENU.groups[0].id; if(i.p==='menu') i.on=true; });
  d.items.forEach(function(i){ if(!seen[i.p]){ var dg=d.groups.filter(function(x){ return x.id===i.g; })[0], ex=MENU.groups.filter(function(x){ return x.id===i.g; })[0]; MENU.items.push({p:i.p,g:ex?i.g:MENU.groups[0].id,on:true}); } });
}
function menuLoad(){ try{ var o=JSON.parse(localStorage.getItem('ieci-menu')||'null'); if(o){ if((o.v||0)<2){ var nm=o.names&&typeof o.names==='object'?o.names:{}, md=o.mode==='tabs'?'tabs':'menu'; o=menuDefault(); o.names=nm; o.mode=md; } MENU=o; } }catch(e){} menuFix(); }
function menuSave(){ try{ localStorage.setItem('ieci-menu',JSON.stringify(MENU)); }catch(e){} }
function menuFlat(){ var o=[]; MENU.groups.forEach(function(g){ MENU.items.forEach(function(i){ if(i.g===g.id&&i.on) o.push(i.p); }); }); return o; }
var panel='stile', mnOpen=false;
function renderNav(){
  applyNames();
  var el=$('ptabs'); el.setAttribute('role',MENU.mode==='tabs'?'tablist':'navigation');
  if(MENU.mode==='tabs'){
    el.className='ptabs'; el.innerHTML=menuFlat().map(function(p){ return '<button class="ptab" role="tab" data-p="'+p+'" aria-selected="'+(p===panel)+'" type="button">'+esc(secLabel(p))+'</button>'; }).join(''); return;
  }
  el.className='mnav';
  var gname='', gi=MENU.items.filter(function(i){ return i.p===panel; })[0]; if(gi){ var g=MENU.groups.filter(function(x){ return x.id===gi.g; })[0]; gname=g?g.n:''; }
  var h='<button type="button" class="mstep" data-step="-1" aria-label="Sezione precedente">‹</button><button type="button" class="mbtn" id="mn-btn" aria-expanded="'+mnOpen+'" aria-haspopup="true">'+navIc(panel)+'<span class="mt"><small>'+esc(gname||'Menu')+'</small>'+esc(secLabel(panel))+'</span><span class="ar">▾</span></button><button type="button" class="mstep" data-step="1" aria-label="Sezione successiva">›</button>';
  h+='<div class="mdrop" id="mn-drop"'+(mnOpen?'':' hidden')+'>';
  MENU.groups.forEach(function(g){
    var its=MENU.items.filter(function(i){ return i.g===g.id&&i.on; }); if(!its.length) return;
    h+='<div><div class="mgt">'+esc(g.n)+'</div><div class="mgi">'+its.map(function(i){ return '<button type="button" class="mit" data-p="'+i.p+'"'+(i.p===panel?' aria-current="true"':'')+'>'+navIc(i.p)+'<span>'+esc(secLabel(i.p))+'</span></button>'; }).join('')+'</div></div>';
  });
  el.innerHTML=h+'</div>';
}

/* ---------- barra preventivo, icone menu, scorciatoie ---------- */
var QBT=null, QBT_T=0;
function renderQbar(){
  var el=$('qbar'); if(!el||!S||!S.client) return;
  var nm=String(S.client.name||'').trim();
  $('qb-name').textContent=nm?quoteName():'Preventivo senza cliente';
  $('qb-sub').innerHTML='<span class="dot '+(S.qid?'ok':'wip')+'"></span>'+esc(MODELS[S.model].short)+' · n. '+esc(S.meta.num)+' · '+(S.qid?'salvato':'non salvato')+' · <span class="chip st-'+(S.meta.status||'bozza')+'" style="padding:0 7px;min-height:0;cursor:default">'+(STL[S.meta.status||'bozza'])+'</span>';
  var tt=headTotal(); $('qb-tot').textContent=tt;
  // il totale è cambiato: la linea «in tensione» del quadro si accende
  if(QBT!==null&&QBT!==tt){ el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); clearTimeout(QBT_T); QBT_T=setTimeout(function(){ el.classList.remove('pulse'); },1000); } QBT=tt;
  apSub();
  renderVc();
  $('qb-n').textContent=DB.quotes.length?String(DB.quotes.length):''; $('qb-n').hidden=!DB.quotes.length;
}
$('qb-save').addEventListener('click',function(){ saveQuote(false); renderQbar(); });
$('qb-new').addEventListener('click',newQuote);

