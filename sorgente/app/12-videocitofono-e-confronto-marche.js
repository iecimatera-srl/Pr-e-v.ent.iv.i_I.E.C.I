/* ===== Impianto condominiale: quota a condomino ===== */
var VCG='Per ogni condomino';
var VCSET=[['Posto interno citofono con cornetta',1,'cit'],['Monitor interno a colori 7"',1,'video'],['Posa e collegamento posto interno',1,'*'],
  ['Postazione esterna citofonica (solo audio)',0,'cit'],['Postazione esterna videocitofonica',0,'video'],['Alimentatore per citofono',0,'cit'],['Alimentatore per videocitofono',0,'video'],
  ['Elettroserratura / apriporta',0,'*'],['Installazione e configurazione',0,'*']];

/* ===== Impianti a confronto: piu marche nello stesso preventivo ===== */
function brS(){ if(vcOn()) return S.cond; if(!S.cmp||typeof S.cmp!=='object') S.cmp={on:false,cur:0,sys:[]}; return S.cmp; }
function brOn(){ return vcOn()?vcBr():!!(S.cmp&&S.cmp.on); }
function brW(){ return vcOn()?'Impianto':'Proposta'; }
function brWp(){ return vcOn()?'impianti':'proposte'; }
function brRec(){ return vcOn()?'consigliato':'consigliata'; }
function sysLogo(x){ return x&&(x.logo||brandLogo(x.b))||''; }
function sysList(){ var o=brS(); if(!Array.isArray(o.sys)) o.sys=[]; return o.sys; }
function sysEnsure(){ var l=sysList(); while(l.length<2) l.push({id:uid(),n:'',b:'',k:'video',tot:''}); if(l.length>3) l.length=3; if(!(brS().cur>=0&&brS().cur<l.length)) brS().cur=0; }
function sysName(x,i){ var n=String(x.n||'').trim(); if(n) return n; var b=String(x.b||'').trim(); return brW()+' '+(b?b:String.fromCharCode(65+i)); }
function sysIdx(id){ var r=-1; sysList().forEach(function(x,i){ if(x.id===id) r=i; }); return r; }
function sysById(id){ var r=null; sysList().forEach(function(x){ if(x.id===id) r=x; }); return r; }
function sysCur(){ sysEnsure(); return sysList()[brS().cur]; }
function sysTiers(){ if(!brOn()) return; sysEnsure(); var l=sysList(); S.tiers.on=true; S.tiers.n=l.length; S.tiers.names=l.map(sysName); var r=parseInt(S.tiers.rec,10); if(!(r>=-1&&r<l.length)) S.tiers.rec=-1; var q=parseInt(S.tiers.sel,10); if(!(q>=-1&&q<l.length)) S.tiers.sel=-1; }
function sysProd(name,unit,x){
  var nm=String(name||'').trim(); if(!nm||!x) return null;
  var low=nm.toLowerCase(), f=null; S.products.forEach(function(p){ if(!f&&String(p.name||'').trim().toLowerCase()===low&&p.sys===x.id) f=p; });
  if(f) return f;
  if(APP.autop==='off'||SERVICE_U.test(String(unit||'').trim())||SKIP_P.test(nm)) return null;
  f={id:uid(),name:nm,brand:x.b||'',code:'',desc:'',specs:'',link:'',tags:'',photos:[],sol:'',sys:x.id}; S.products.push(f); renderProducts(); return f;
}
function vcTypicalSys(x,i){
  var cat=S.cat.vcit||[], added=0;
  VCSET.forEach(function(v){
    if(v[2]!=='*'&&v[2]!==x.k) return;
    var it=null; cat.forEach(function(c){ if(c[0]===v[0]) it=c; }); if(!it) return;
    var nl={d:it[0],u:it[1],q:v[1]?vcN():1,p:it[2],s:0,tp:1,tm:[i],br:x.b||'',sy:x.id}; if(v[1]) nl.pc=1;
    var pr=sysProd(it[0],it[1],x); if(pr) nl.pid=pr.id; S.lines.push(nl); added++;
  });
  return added;
}
function vcTypicalBr(){
  S.lines=S.lines.filter(function(l){ return !l.tp; }); var n=0;
  sysList().forEach(function(x,i){ n+=vcTypicalSys(x,i); }); return n;
}
function sysRemove(i){
  var l=sysList(), x=l[i]; if(!x||l.length<=2) return;
  S.lines=S.lines.filter(function(ln){ return ln.sy!==x.id; });
  S.lines.forEach(function(ln){ if(ln.tm){ ln.tm=ln.tm.filter(function(t){ return t!==i; }).map(function(t){ return t>i?t-1:t; }); if(!ln.tm.length) ln.off=true; } });
  S.products=S.products.filter(function(p){ return p.sys!==x.id; });
  if(S.cond.vm) delete S.cond.vm[x.id];
  l.splice(i,1); if(brS().cur>=l.length) brS().cur=l.length-1;
  if(parseInt(S.tiers.sel,10)===i) S.tiers.sel=-1; else if(parseInt(S.tiers.sel,10)>i) S.tiers.sel=parseInt(S.tiers.sel,10)-1;
  if(parseInt(S.tiers.rec,10)===i) S.tiers.rec=-1; else if(parseInt(S.tiers.rec,10)>i) S.tiers.rec=parseInt(S.tiers.rec,10)-1;
}
function vcFreeFields(){ return sysList().map(function(x,i){ return '<label class="f">Totale: '+esc(sysName(x,i))+' (€)<input type="number" step="any" min="0" inputmode="decimal" data-b="cond.sys.'+i+'.tot" placeholder="es. 4500"></label>'; }).join(''); }
function prodSysLabel(p){ var x=p.sys&&sysById(p.sys); return '<div><span class="solb t">'+(x?esc(sysName(x,sysIdx(x.id))):(vcOn()?'Per tutti gli impianti':'Per tutte le proposte'))+'</span></div>'; }
function prodSysSel(p,i){ return '<label class="f">Questo prodotto fa parte di<select data-pf="sys" data-pi="'+i+'"><option value=""'+(p.sys?'':' selected')+'>'+(vcOn()?'Tutti gli impianti':'Tutte le proposte')+'</option>'+sysList().map(function(x,j){ return '<option value="'+x.id+'"'+(p.sys===x.id?' selected':'')+'>'+esc(sysName(x,j))+'</option>'; }).join('')+'</select></label>'; }
function brLead(){ var l=sysList(); return '<p class="lead">Questo preventivo mette a confronto '+l.length+' impianti: '+l.map(function(x,i){ return '<b>'+esc(sysName(x,i))+'</b>'+(x.b?' ('+esc(x.b)+')':''); }).join(', ')+'. Qui sotto trovi i prodotti di ciascuno.</p>'; }
function sysKindName(k){ return k==='cit'?'Citofono':'Videocitofono'; }
function brTag(l){ if(!brOn()) return; var sy=sysCur(); l.tm=[brS().cur]; l.sy=sy.id; l.br=sy.b||''; }
function brCopy(from,to){
  var l=sysList(), A=l[from], B=l[to]; if(!A||!B) return 0; var n=0;
  S.lines=S.lines.filter(function(ln){ return ln.sy!==B.id; });
  S.lines.slice().forEach(function(ln){ if(ln.sy!==A.id||ln.vm) return; var c=JSON.parse(JSON.stringify(ln)); delete c.pid; c.sy=B.id; c.tm=[to]; c.br=B.b||''; S.lines.push(c); linkLine(c); n++; });
  return n;
}
function brEnable(){
  var o=brS(); o.on=true; sysEnsure(); var A=sysList()[0]; S.tiers.rec=-1; S.tiers.sel=-1; sysTiers();
  var had=0;
  S.lines.forEach(function(ln){ if(ln.opt||ln.vm||ln.sy) return; var p=prodOfLine(ln); ln.sy=A.id; ln.tm=[0]; if(A.b) ln.br=A.b; if(p&&!p.sys){ p.sys=A.id; ln.pid=p.id; } had++; });
  if(had&&confirm('Le voci già inserite vanno nella «'+sysName(A,0)+'».\n\nLe copio anche nella «'+sysName(sysList()[1],1)+'», così ti basta cambiare marca e prezzi?')) brCopy(0,1);
}
function brClose(keep){
  var l=sysList(), K=l[keep]; if(!K) return;
  var gone=l.filter(function(x){ return x!==K; }).map(function(x){ return x.id; });
  S.lines=S.lines.filter(function(ln){ return gone.indexOf(ln.sy)<0; });
  S.lines.forEach(function(ln){ if(ln.sy===K.id){ delete ln.sy; } delete ln.tm; });
  S.products=S.products.filter(function(p){ return gone.indexOf(p.sys)<0; }); S.products.forEach(function(p){ if(p.sys===K.id) delete p.sys; });
  var o=brS(); o.on=false; o.sys=[]; o.cur=0; S.tiers.on=false; S.tiers.sel=-1; S.tiers.rec=-1;
}
function renderBrPanel(){
  var acc=$('acc-br'); if(!acc) return; acc.hidden=vcOn();
  var cb=$('br-on'); if(cb) cb.checked=!vcOn()&&brOn();
  if(!vcOn()) renderSys();
}
function renderSys(){
  var vc=vcOn(), el=$(vc?'vc-sys':'br-sys'); if(!el) return;
  var other=$(vc?'br-sys':'vc-sys'); if(other&&other.innerHTML){ other.innerHTML=''; other.removeAttribute('data-k'); }
  if(!brOn()){ el.innerHTML=''; el.removeAttribute('data-k'); return; }
  var ae=document.activeElement; if(ae&&ae!==document.body&&el.contains(ae)&&el.getAttribute('data-k')){ try{ ae.blur(); }catch(e){} }
  sysEnsure(); sysTiers(); var l=sysList(), cur=brS().cur, W=brW(), Wl=W.toLowerCase();
  var h='<div class="vmp"><b>'+(vc?'Impianti a confronto':'Proposte a confronto')+'</b><small>Fino a tre '+brWp()+' di marche diverse nello stesso preventivo. '+(vc?'Ognuno ha le sue voci, il suo totale e la sua quota a condomino.':'Ognuna ha le sue voci, il suo totale e le sue schede prodotto.')+'</small>';
  l.forEach(function(x,i){
    var T=totals(i), lg=sysLogo(x), src=i===0?1:0, nv=S.lines.filter(function(ln){ return ln.sy===x.id&&!ln.vm; }).length;
    h+='<div class="vms sysc'+(i===cur?' cur':'')+'"><div class="vmo-h"><b class="vmt">'+W+' '+String.fromCharCode(65+i)+'</b><span>'+(l.length>2?'<button type="button" class="btn ghost sm" data-sy="del:'+i+'" aria-label="Elimina">Elimina</button>':'')+'</span></div>'+
      '<div class="grid2"><label class="f">Marca<input type="text" data-syf="b:'+i+'" value="'+esc(x.b||'')+'" placeholder="es. '+(i===0?'Bticino':i===1?'Vimar':'AVE')+'"></label>'+
      '<label class="f">Nome '+(vc?'dell\'impianto':'della proposta')+'<input type="text" data-syf="n:'+i+'" value="'+esc(x.n||'')+'" placeholder="'+esc(sysName({n:'',b:x.b},i))+'"></label></div>'+
      '<div class="sylg"><div class="sylg-p">'+(lg?'<img src="'+lg+'" alt="">':'<span>'+esc(String(x.b||W).slice(0,2).toUpperCase())+'</span>')+'</div><div class="sylg-t"><b>Logo</b><small>'+(x.logo?'Il tuo logo caricato.':lg?(iwLogoSrc(x.b)==='trust'?'Preso dai «Marchi che installiamo».':'Logo della marca salvato: vale per tutti i preventivi.'):(x.b&&iwMode()==='auto'&&iwNet()&&!iwTried(x.b)?'Cerco il logo di '+esc(iwBase(x.b))+'… oppure scegli tu.':'Per ora le iniziali: trova o carica il logo.'))+'</small><div class="row"><button type="button" class="btn ghost sm" data-sy="iwlogo:'+i+'">'+(lg?'Cambia dal web':'Trova il logo')+'</button><label class="btn ghost sm">'+(x.logo?'Cambia file':'Carica file')+'<input type="file" accept="image/*" hidden data-sylogo="'+i+'"></label>'+(x.logo?'<button type="button" class="btn ghost sm" data-sy="nologo:'+i+'">Rimuovi</button>':'')+'</div></div></div>'+
      (vc?'<label class="f">Tipo<select data-syf="k:'+i+'"><option value="video"'+(x.k==='cit'?'':' selected')+'>Videocitofono</option><option value="cit"'+(x.k==='cit'?' selected':'')+'>Solo citofono</option></select></label>':'')+
      '<div class="row"><button type="button" class="btn'+(i===cur?'':' ghost')+' sm" data-sy="cur:'+i+'" aria-pressed="'+(i===cur)+'">'+(i===cur?'✓ Le nuove voci vanno qui':'Aggiungi qui le nuove voci')+'</button>'+
        (vc?'<button type="button" class="btn ghost sm" data-sy="typ:'+i+'">Voci tipiche</button>':'')+
        '<button type="button" class="btn ghost sm" data-sy="copy:'+i+'">Copia qui le voci di «'+esc(sysName(l[src],src))+'»</button></div>'+
      '<div class="hint">'+nv+(nv===1?' voce':' voci')+(T.tot>0?' · totale '+eur(T.tot)+' IVA inclusa'+(vc?' · '+eur(vcQuota(T,i))+' a condomino':''):'')+'</div></div>';
  });
  h+=(l.length<3?'<div class="row"><button type="button" class="btn ghost" data-sy="add:0">+ Aggiungi '+(vc?'un terzo impianto':'una terza proposta')+'</button></div>':'');
  if(!vc) h+='<div class="vms brk"><b>Chiudi il confronto</b><small>Quando il cliente ha scelto, tieni solo quella proposta: le altre voci e schede vengono rimosse.</small><div class="row">'+l.map(function(x,i){ return '<button type="button" class="btn ghost sm" data-sy="keep:'+i+'">Tieni solo «'+esc(sysName(x,i))+'»</button>'; }).join('')+'</div></div>';
  h+='</div>';
  if(el.getAttribute('data-k')!==h){ el.innerHTML=h; el.setAttribute('data-k',h); }
}
(function(){
  function after(){ sysTiers(); vmClamp(); vmSync(); renderLines(); renderCat(); renderTiers(); renderEcon(); renderProducts(); renderVc(); renderRooms(); touch(); }
  function bindW(w){ if(!w) return;
    w.addEventListener('click',function(e){
      var t=e.target.closest('[data-sy]'); if(!t) return; var a=t.getAttribute('data-sy').split(':'), act=a[0], i=+a[1], l=sysList(), vc=vcOn();
      if(act==='cur') brS().cur=i;
      else if(act==='del'){ if(l.length<=2||!confirm('Elimino «'+sysName(l[i],i)+'» con le sue voci e le sue schede prodotto?')) return; sysRemove(i); }
      else if(act==='add'){ if(l.length>=3) return; var x={id:uid(),n:'',b:'',k:'video',tot:''}; l.push(x); brS().cur=l.length-1; sysTiers(); if(vc) vcTypicalSys(x,l.length-1); else if(confirm('Copio nella nuova proposta le voci della «'+sysName(l[0],0)+'»?')) brCopy(0,l.length-1); }
      else if(act==='typ'){ var x2=l[i]; if(!x2) return; if(S.lines.some(function(ln){ return ln.sy===x2.id&&ln.tp; })&&!confirm('Sostituisco le voci tipiche di «'+sysName(x2,i)+'»?')) return;
        S.lines=S.lines.filter(function(ln){ return !(ln.sy===x2.id&&ln.tp); }); vcTypicalSys(x2,i); }
      else if(act==='copy'){ var src=i===0?1:0; if(S.lines.some(function(ln){ return ln.sy===l[i].id&&!ln.vm; })&&!confirm('Sostituisco le voci di «'+sysName(l[i],i)+'» con una copia di quelle di «'+sysName(l[src],src)+'»?')) return; var n=brCopy(src,i); toast('Copiate '+n+' voci in «'+sysName(l[i],i)+'»: ora cambia marca e prezzi'); }
      else if(act==='nologo'){ delete l[i].logo; }
      else if(act==='iwlogo'){ iwSysLogo(i); return; }
      else if(act==='keep'){ if(!confirm('Chiudo il confronto e tengo solo «'+sysName(l[i],i)+'»? Le voci e le schede delle altre proposte vengono rimosse.')) return; var nm=sysName(l[i],i); brClose(i); toast('Confronto chiuso: resta «'+nm+'»'); }
      else return;
      after(); renderBrPanel();
    });
    w.addEventListener('change',function(e){
      var t=e.target, lg=t.getAttribute('data-sylogo');
      if(lg!=null){ var f=t.files&&t.files[0], x0=sysList()[+lg]; t.value=''; if(!f||!x0) return; readImage(f,360,true,function(url){ if(!url){ toast('Immagine non valida'); return; } x0.logo=url; after(); toast('Logo caricato per «'+sysName(x0,+lg)+'»'); }); return; }
      var fa=t.getAttribute('data-syf'); if(!fa) return; var a=fa.split(':'), fld=a[0], i=+a[1], x=sysList()[i]; if(!x) return;
      if(fld==='b'){ var old=x.b||''; x.b=t.value.trim(); S.lines.forEach(function(ln){ if(ln.sy===x.id&&(ln.br||'')===old) ln.br=x.b; }); S.products.forEach(function(p){ if(p.sys===x.id&&(p.brand||'')===old) p.brand=x.b; }); }
      else if(fld==='n') x.n=t.value.trim();
      else if(fld==='k'){ if(t.value!==x.k){ x.k=t.value; if(S.lines.some(function(ln){ return ln.sy===x.id&&ln.tp; })){ S.lines=S.lines.filter(function(ln){ return !(ln.sy===x.id&&ln.tp); }); vcTypicalSys(x,i); } } }
      after();
    });
  }
  bindW($('vc-sys')); bindW($('br-sys'));
  var cb=$('br-on'); if(cb) cb.addEventListener('change',function(){
    if(cb.checked){ brEnable(); toast('Confronto attivo: scrivi la marca di ogni proposta'); }
    else { var l=sysList(), k=tierSel()>=0?tierSel():(tierRec()>=0?tierRec():0); if(!l[k]){ brS().on=false; } else if(!confirm('Chiudo il confronto e tengo solo «'+sysName(l[k],k)+'»? Le voci e le schede delle altre proposte vengono rimosse.')){ cb.checked=true; return; } else brClose(k); }
    after(); renderBrPanel();
  });
})();
function vcOn(){ return S.model==='vcit'; }
function vcN(){ return Math.max(1,Math.min(999,parseInt(S.cond.n,10)||1)); }
function vcMode(){ return S.cond.kind==='cit'?'cit':(S.cond.kind==='both'?'both':(S.cond.kind==='brands'?'brands':'video')); }
function vcBr(){ return vcOn()&&vcMode()==='brands'; }
function vcKind(){ return vcMode()==='cit'?'cit':'video'; }
function vcBothFlag(){ return vcOn()&&(vcMode()==='both'||vcMode()==='brands')&&!!S.tiers.on; }
function vcBoth(){ return vcBothFlag(); }
function vcSolOf(it){ return it&&(it[4]==='video'||it[4]==='cit')?it[4]:''; }
function vcSolData(k){ if(!S.cond.sol||typeof S.cond.sol!=='object') S.cond.sol={}; var o=S.cond.sol; if(!o[k]||typeof o[k]!=='object') o[k]={n:'',logo:''}; return o[k]; }
function vcSolTitle(k){ var n=String(vcSolData(k).n||'').trim(); return n||(k==='cit'?'Solo citofono':'Videocitofono'); }
function vcSolName(k){ var n=String(vcSolData(k).n||'').trim(); return n||(k==='cit'?'Soluzione citofono':'Soluzione videocitofono'); }
function vcSolLogo(k){ return vcSolData(k).logo||''; }
function vcSolSync(){ if(vcOn()&&vcMode()==='both'&&S.tiers.on){ S.tiers.n=2; S.tiers.names=[vcSolTitle('cit'),vcSolTitle('video')]; } }
function tierLogo(k){ if(vcOn()&&vcMode()==='both'&&S.tiers.on) return vcSolLogo(k===0?'cit':'video'); if(brOn()){ var x=sysList()[k]; return x?sysLogo(x):''; } return ''; }
function renderSol(){
  var el=$('vc-sol'); if(!el) return;
  if(!(vcOn()&&vcMode()==='both')){ if(el.innerHTML){ el.innerHTML=''; el.removeAttribute('data-k'); } return; }
  var ae=document.activeElement; if(ae&&ae!==document.body&&el.contains(ae)&&el.getAttribute('data-k')){ try{ ae.blur(); }catch(e){} }
  vcSolSync();
  var h='<div class="vmp"><b>Le due soluzioni</b><small>Dai a ciascuna il nome e il logo che vuoi: compaiono nel preventivo economico, nella quota a condomino e nella sezione Prodotti.</small>';
  [['video',1,'Videocitofono','es. Videocitofono Bticino Classe 100'],['cit',0,'Solo citofono','es. Citofono Urmet Mod. 1150']].forEach(function(a){
    var k=a[0], d=vcSolData(k), lg=d.logo, T=totals(a[1]);
    h+='<div class="vms"><div class="vmo-h"><b class="vmt">Soluzione '+(k==='cit'?'audio':'video')+(tierRec()===a[1]?' · consigliata':'')+'</b></div>'+
      '<label class="f">Titolo della soluzione<input type="text" data-solf="n:'+k+'" value="'+esc(d.n||'')+'" placeholder="'+esc(a[2])+' ('+esc(a[3])+')"></label>'+
      '<div class="sylg"><div class="sylg-p">'+(lg?'<img src="'+lg+'" alt="">':'<span>'+(k==='cit'?'AU':'VI')+'</span>')+'</div><div class="sylg-t"><b>Logo</b><small>'+(lg?'Il tuo logo caricato.':'Nessun logo: carica quello della marca o il tuo.')+'</small><div class="row"><button type="button" class="btn ghost sm" data-solw="'+k+'">Trova il logo</button><label class="btn ghost sm">'+(lg?'Cambia file':'Carica file')+'<input type="file" accept="image/*" hidden data-sollogo="'+k+'"></label>'+(lg?'<button type="button" class="btn ghost sm" data-solx="'+k+'">Rimuovi</button>':'')+'</div></div></div>'+
      '<div class="hint">'+(T.tot>0?'Totale '+eur(T.tot)+' IVA inclusa · '+eur(vcQuota(T,a[1]))+' a condomino':'Nessuna voce ancora')+'</div></div>';
  });
  h+='</div>';
  if(el.getAttribute('data-k')!==h){ el.innerHTML=h; el.setAttribute('data-k',h); }
}
(function(){
  var w=$('vc-sol'); if(!w) return;
  function after(){ vcSolSync(); renderTiers(); renderLines(); renderEcon(); renderProducts(); renderVc(); touch(); }
  w.addEventListener('change',function(e){
    var t=e.target, lk=t.getAttribute('data-sollogo');
    if(lk!=null){ var f=t.files&&t.files[0]; t.value=''; if(!f) return; readImage(f,360,true,function(url){ if(!url){ toast('Immagine non valida'); return; } vcSolData(lk).logo=url; after(); toast('Logo caricato per «'+vcSolTitle(lk)+'»'); }); return; }
    var fa=t.getAttribute('data-solf'); if(!fa) return; var a=fa.split(':'); vcSolData(a[1]).n=t.value.trim(); after();
  });
  w.addEventListener('click',function(e){ var fw=e.target.closest('[data-solw]'); if(fw){ iwSolLogo(fw.getAttribute('data-solw')); return; } var b=e.target.closest('[data-solx]'); if(!b) return; vcSolData(b.getAttribute('data-solx')).logo=''; after(); });
})();
function vcSyncQty(){ S.lines.forEach(function(l){ if(l.pc) l.q=vcN(); }); }
function vcTypical(mode){
  mode=mode||vcMode();
  if(mode==='brands') return vcTypicalBr();
  S.lines=S.lines.filter(function(l){ return !l.tp; });
  var added=0, cat=S.cat.vcit||[];
  VCSET.forEach(function(x){
    if(mode!=='both'&&x[2]!=='*'&&x[2]!==mode) return;
    var it=null; cat.forEach(function(c){ if(c[0]===x[0]) it=c; }); if(!it) return;
    var nl={d:it[0],u:it[1],q:x[1]?vcN():1,p:it[2],s:0,tp:1}; if(x[1]) nl.pc=1;
    if(mode==='both'&&x[2]==='cit') nl.tm=[0]; else if(mode==='both'&&x[2]==='video') nl.tm=[1];
    S.lines.push(nl); added++; linkLine(nl,{sol:x[2]==='*'?'':x[2]}); renderProducts();
  });
  return added;
}
function vcApplyMode(nk){
  var prev=vcMode();
  if(nk==='brands'){
    S.cond.kind='brands'; sysEnsure(); sysTiers(); S.tiers.sel=-1; S.tiers.rec=-1;
    S.lines.forEach(function(l){ delete l.tm; });
    vcTypicalBr();
    return 'Confronto tra '+sysList().length+' impianti pronto: scrivi la marca di ciascuno';
  }
  if(prev==='brands'){
    if(!confirm('Torno a un solo impianto: le voci e le schede prodotto degli impianti a confronto vengono rimosse. Continuo?')){ S.cond.kind='brands'; return ''; }
    S.lines=S.lines.filter(function(l){ return !l.sy; }); S.products=S.products.filter(function(p){ return !p.sys; });
    S.lines.forEach(function(l){ delete l.tm; }); S.tiers.on=false; S.tiers.sel=-1;
  }
  S.cond.kind=nk;
  if(nk==='both'){
    S.tiers.on=true; S.tiers.n=2; S.tiers.names=[vcSolTitle('cit'),vcSolTitle('video')]; S.tiers.rec=1; S.tiers.sel=-1;
    vcTypical('both'); return 'Offerta a due livelli pronta: Solo citofono e Videocitofono';
  }
  if(prev==='both'||prev==='brands'){
    S.tiers.on=false; S.lines.forEach(function(l){ delete l.tm; });
    vcTypical(nk); return 'Soluzione unica: '+(nk==='cit'?'solo citofono':'videocitofono');
  }
  if(S.lines.some(function(l){ return l.tp; })){
    if(confirm('Aggiorno le voci tipiche per '+(nk==='cit'?'il solo citofono':'il videocitofono')+'? Le voci inserite con «Aggiungi le voci tipiche» vengono sostituite.')) vcTypical(nk);
  }
  return '';
}
function vcQuota(t,j){ return r2(vmBase(j,t).tot/vcN()); }
function renderVc(){
  renderBrPanel();
  var box=$('acc-vc'); if(!box) return; var on=vcOn(); box.hidden=!on; if(!on) return;
  renderVcPrice(); renderSys(); renderSol(); renderVm();
  var k=vcMode(), n=vcN();
  Array.prototype.forEach.call(box.querySelectorAll('[data-vck]'),function(b){ b.setAttribute('aria-pressed',String(b.getAttribute('data-vck')===k)); });
  var inp=$('vc-n'); if(inp&&document.activeElement!==inp) inp.value=String(n);
  $('vc-show').checked=S.cond.show!==false;
  var T=totals(), r=$('vc-res'), tiers=tiersOn();
  if(tiers){
    var h='',j,nm=S.tiers.names.slice(0,tierN());
    for(j=0;j<nm.length;j++){ var tj=totals(j); h+='<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline"><span>'+esc(nm[j])+(j===tierRec()?' <small style="display:inline;color:var(--brand);font-weight:700">consigliata</small>':'')+'</span><span class="q" style="font-size:1.25rem">'+(tj.tot>0?eur(vcQuota(tj,j)):'—')+'</span></div>'; }
    r.innerHTML=h+'<small>Quota a condomino, IVA inclusa, per '+n+' condomini</small>'; return;
  }
  r.innerHTML=T.tot>0?'<div class="q">'+eur(vcQuota(T,null))+' <span style="font-size:.9rem;font-weight:600">a condomino</span></div><small>IVA inclusa · totale '+eur(vmBase(null,T).tot)+' ÷ '+n+' condomini</small><small>IVA esclusa: '+eur(r2(vmBase(null,T).imp/n))+' a condomino</small>':'<div class="q">—</div><small>Aggiungi le voci per vedere la quota a condomino.</small>';
}
function renderVcPrice(){
  var box=$('acc-vc'), t=$('vc-tot'); if(!box||!t) return;
  var m=S.econ.mode==='totale'?'totale':'righe', h='';
  Array.prototype.forEach.call(box.querySelectorAll('[data-vcp]'),function(b){ b.setAttribute('aria-pressed',String(b.getAttribute('data-vcp')===m)); });
  if(m==='totale'){
    h='<div class="grid2">'+(brOn()?vcFreeFields():vcBothFlag()
      ?'<label class="f">Totale: '+esc(S.tiers.names[0]||'soluzione 1')+' (€)<input type="number" step="any" min="0" inputmode="decimal" data-b="cond.tc" placeholder="es. 4500"></label><label class="f">Totale: '+esc(S.tiers.names[1]||'soluzione 2')+' (€)<input type="number" step="any" min="0" inputmode="decimal" data-b="cond.tv" placeholder="es. 7800"></label>'
      :'<label class="f">Totale dei lavori (€)<input type="number" step="any" min="0" inputmode="decimal" data-b="econ.total" placeholder="es. 4500"></label>')+
      '<label class="f">Il totale è<select data-b="econ.vat"><option value="incl">IVA inclusa</option><option value="excl">IVA esclusa (si aggiunge)</option></select></label></div>'+
      '<p class="hint">Le voci descrivono i lavori (con marca e quantità) e non mostrano prezzi: nel preventivo compaiono solo i totali'+(brOn()?', uno per impianto':vcBothFlag()?', uno per soluzione':'')+'.</p>';
  } else h='<p class="hint">Il prezzo si scrive su ogni voce e il totale si somma da solo.</p>';
  if(t.getAttribute('data-k')!==h){ t.innerHTML=h; t.setAttribute('data-k',h); syncB(); }
}
function vcSetPriceMode(m){
  if(m==='totale'&&S.econ.mode!=='totale'){
    if(S.econ.vat==='incl'){
      if(brOn()){ sysList().forEach(function(x,i){ if(!num(x.tot)) x.tot=totals(i).tot||''; }); }
      else if(vcBothFlag()){ if(!num(S.cond.tc)) S.cond.tc=totals(0).tot||''; if(!num(S.cond.tv)) S.cond.tv=totals(1).tot||''; }
      else if(!num(S.econ.total)) S.econ.total=totals().tot||'';
    }
  }
  S.econ.mode=m; renderEcon(); renderLines(); renderTiers(); renderContent(); renderVc(); renderInvio(); touch();
}
function vcBox(){
  if(!vcOn()||S.cond.show===false) return '';
  var n=vcN(), kn=vcKind()==='cit'?'citofonico':'videocitofonico', tiers=tiersOn(), rows='', sub;
  if(tiers){
    var j,names=S.tiers.names.slice(0,tierN()); for(j=0;j<names.length;j++){ var tj=totals(j); var tlj=tierLogo(j); rows+='<div class="vr"><span>'+(tlj?'<img class="vrlg" src="'+tlj+'" alt="">':'')+esc(names[j])+(j===tierRec()?' (consigliata)':'')+'</span><b>'+(tj.tot>0?eur(vcQuota(tj,j)):'—')+'</b></div>'; }
    sub=n+' condomini · quota a condomino IVA inclusa per ogni soluzione';
  } else {
    var T=totals(); rows='<div class="vr"><span>Quota a condomino, IVA inclusa</span><b>'+eur(vcQuota(T,null))+'</b></div><div class="vr" style="margin-top:2px"><span>Quota IVA esclusa</span><span>'+eur(r2(vmBase(null,T).imp/n))+' + IVA</span></div>';
    sub='Impianto '+kn+' · totale '+eur(vmBase(null,T).tot)+' IVA inclusa ÷ '+n+' condomini';
  }
  return '<div class="vcbox"><div class="vh">Ripartizione della spesa tra i condomini</div>'+rows+'<div class="vs">'+esc(sub)+'</div></div>';
}
(function(){
  var w=$('acc-vc'); if(!w) return;
  w.addEventListener('click',function(e){
    var pb=e.target.closest('[data-vcp]'); if(pb){ vcSetPriceMode(pb.getAttribute('data-vcp')); return; }
    var b=e.target.closest('[data-vck]'); if(!b) return;
    var nk=b.getAttribute('data-vck'); if(nk===vcMode()) return;
    var msg=vcApplyMode(nk); vmClamp(); vmSync();
    renderVc(); renderCat(); renderLines(); renderTiers(); renderEcon(); renderProducts(); renderRooms(); touch(); if(msg) toast(msg);
  });
  function setN(v){ S.cond.n=Math.max(1,Math.min(999,parseInt(v,10)||1)); vcSyncQty(); vmClamp(); vmSync(); renderLines(); renderVc(); touch(); }
  $('vc-m').addEventListener('click',function(){ $('vc-n').blur(); setN(vcN()-1); });
  $('vc-p').addEventListener('click',function(){ setN(vcN()+1); });
  $('vc-n').addEventListener('input',function(e){ var v=parseInt(e.target.value,10); if(v>=1){ S.cond.n=Math.min(999,v); vcSyncQty(); vmClamp(); vmSync(); renderLines(); renderVc(); touch(); } });
  $('vc-n').addEventListener('change',function(e){ setN(e.target.value); e.target.value=String(vcN()); });
  $('vc-show').addEventListener('change',function(e){ S.cond.show=e.target.checked; touch(); });
  $('vc-fill').addEventListener('click',function(){
    var has=S.lines.some(function(l){ return l.tp; });
    if(has&&!confirm('Esistono già voci tipiche: le sostituisco con quelle della soluzione scelta?')) return;
    if(brOn()) sysTiers();
    if(vcMode()==='both'){ S.tiers.on=true; S.tiers.n=2; S.tiers.names=[vcSolTitle('cit'),vcSolTitle('video')]; if(S.tiers.rec<0||S.tiers.rec>1) S.tiers.rec=1; }
    var a=vcTypical(); renderLines(); renderRooms(); renderVc(); renderTiers(); touch();
    toast(a?('Aggiunte '+a+' voci tipiche per '+vcN()+' condomini'):'Nel listino mancano le voci tipiche: aggiungile dal listino');
  });
})();


