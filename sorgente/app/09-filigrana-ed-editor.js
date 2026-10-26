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
function wmApply(html){
  var d=$('doc'), w=wmGen();
  if(!w||!w.url){ d.style.removeProperty('--wm'); return html; }
  d.style.setProperty('--wm','url('+w.url+')');
  var cls=w.mode==='one'?'one':'tile', sz='background-size:'+Math.round(w.w)+'px '+Math.round(w.h)+'px';
  return html.split('<section class="page">').join('<section class="page"><div class="wm '+cls+'" style="'+sz+'"></div>');
}
function renderDoc(){
  applyBrand();
  var order=S.layout;
  var fn={cover:secCover,azienda:secAzienda,prodotti:secProdotti,prev:secPreventivo,cond:secCond,planimetria:secPlan,fv:secFv,crono:secCrono,fiducia:secFiducia,conferma:secConferma,lavoro:secLavoro,collaudo:secCollaudo};
  var html=order.map(function(k){return k.indexOf('c:')===0?secCustom(k.slice(2)):fn[k]();}).join('');
  html=wmApply(html);
  $('doc').innerHTML=html||'<div style="background:#fff;padding:40px;text-align:center;color:#5d646c">Nessuna sezione selezionata. Riattivale dalla scheda Contenuto.</div>';
  fit();
}
function schedule(){ if(raf) cancelAnimationFrame(raf); raf=requestAnimationFrame(function(){ raf=0; renderDoc(); renderQbar(); }); }
function fit(){
  var wrap=$('paperWrap'),d=$('doc'); if(!wrap||!d) return;
  var avail=wrap.clientWidth-24, z=Math.min(1,avail/794); if(!(z>0)) z=1;
  d.style.zoom=z;
}
window.addEventListener('resize',fit);

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
function renderQbar(){
  var el=$('qbar'); if(!el||!S||!S.client) return;
  var nm=String(S.client.name||'').trim();
  $('qb-name').textContent=nm?quoteName():'Preventivo senza cliente';
  $('qb-sub').innerHTML='<span class="dot '+(S.qid?'ok':'wip')+'"></span>'+esc(MODELS[S.model].short)+' · n. '+esc(S.meta.num)+' · '+(S.qid?'salvato':'non salvato')+' · <span class="chip st-'+(S.meta.status||'bozza')+'" style="padding:0 7px;min-height:0;cursor:default">'+(STL[S.meta.status||'bozza'])+'</span>';
  $('qb-tot').textContent=headTotal();
  apSub();
  renderVc();
  $('qb-n').textContent=DB.quotes.length?'('+DB.quotes.length+')':'';
}
$('qb-save').addEventListener('click',function(){ saveQuote(false); renderQbar(); });
$('qb-new').addEventListener('click',newQuote);

