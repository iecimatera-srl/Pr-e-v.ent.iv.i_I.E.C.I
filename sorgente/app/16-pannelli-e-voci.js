function renderTabs(){
  $('tabs').innerHTML=ORDER.map(function(k){ return '<button type="button" class="tab" data-m="'+k+'" aria-pressed="'+(S.model===k)+'">'+esc(MODELS[k].short)+'</button>'; }).join('');
}
function renderCat(){
  var app=S.model==='app';
  $('cat-name').textContent='· '+MODELS[S.model].name;
  var items=S.cat[S.model]||[], q=($('cat-q')?$('cat-q').value:'').trim().toLowerCase(), kd=curKind();
  var vc=S.model==='vcit'; if(vc) kd=vcKind();
  var useF=(app&&!catAll&&!q&&kd!=='al')||(vc&&vcMode()!=='both'&&vcMode()!=='brands'&&!catAll&&!q);
  if($('cat-f')){ $('cat-f').hidden=!(app||(vc&&vcMode()!=='both'&&vcMode()!=='brands')); if(app||(vc&&vcMode()!=='both'&&vcMode()!=='brands')){ $('cat-f').textContent=vc?(catAll?'Tutte le voci · mostra solo '+(kd==='cit'?'il citofono':'il videocitofono'):'Solo voci per '+(kd==='cit'?'citofono':'videocitofono')+' · mostra tutte'):(catAll?'Tutte le voci · mostra solo le adatte':'Solo voci adatte · mostra tutte'); $('cat-f').classList.toggle('on',!catAll); } }
  $('cat-hint').textContent=vc?(brOn()?'Tocca + per aggiungere la voce a «'+sysName(sysCur(),brS().cur)+'» (cambia impianto qui sopra). Le voci «Per ogni condomino» prendono da sole il numero dei condomini.':'Tocca + per aggiungere la voce. Le voci «Per ogni condomino» prendono da sole il numero dei condomini.'):app?('Tocca + per aggiungere la voce a «'+curRoomName()+'». Cerca per trovare qualunque voce.'):'Tocca + per aggiungere la voce al preventivo. I prezzi sono di esempio: modificali, restano salvati.';
  if(!vc&&brOn()) $('cat-hint').textContent='Le voci vanno in «'+sysName(sysCur(),brS().cur)+'»: cambia proposta nel riquadro «Proposte a confronto per marca». '+$('cat-hint').textContent;
  var html='', lastG=null, hasG=cgSync(S.model).length>0;
  catOrderIdx(S.model).forEach(function(i){
    var it=items[i];
    if(q&&String(it[0]).toLowerCase().indexOf(q)<0) return;
    if(useF&&it[4]&&it[4]!=='*'&&it[4].split(',').indexOf(kd)<0) return;
    var gn=it[3]&&cgSync(S.model).indexOf(it[3])>-1?it[3]:'';
    if(hasG&&gn!==lastG){ lastG=gn; html+='<div class="cgh">'+esc(gn||'Altre voci')+'</div>'; }
    html+='<div class="crow"><span class="d">'+esc(it[0])+'</span><span class="u">€/'+esc(it[1])+'</span>'+
      '<input type="number" step="any" min="0" value="'+esc(it[2])+'" data-cp="'+i+'" aria-label="Prezzo '+esc(it[0])+'">'+
      '<button type="button" class="btn sm" data-add="'+i+'" aria-label="Aggiungi al preventivo">+</button>'+
      '<button type="button" class="btn x" data-del="'+i+'" aria-label="Elimina dal listino">×</button></div>';
  });
  if($('n-g')){ var cv=$('n-g').value; $('n-g').innerHTML=groupOpts(S.model,cv,'Categoria…'); $('n-g').value=cgSync(S.model).indexOf(cv)>-1?cv:''; }
  var prh=q?prCatHtml(q,items):'';
  $('cat').innerHTML=(html||(prh?'':'<div class="empty">'+(q?'Nessuna voce trovata.':(items.length?'Nessuna voce per questo filtro: mostra tutte.':'Listino vuoto. Aggiungi una voce qui sotto.'))+'</div>'))+prh;
}
/* ridisegnare un elenco senza perdere il campo in cui stai scrivendo (e la posizione del cursore) */
function focusSel(a){
  var own=Array.prototype.filter.call(a.attributes||[],function(x){ return /^data-/.test(x.name); }).map(function(x){ return '['+x.name+'="'+String(x.value).replace(/"/g,'\\"')+'"]'; }).join('');
  if(!own) return ''; var row=a.parentElement&&a.parentElement.closest('[data-i]'); return (row?'[data-i="'+row.getAttribute('data-i')+'"] ':'')+own;
}
function keepFocus(box,fn){
  var a=document.activeElement, k=null;
  if(a&&box&&box.contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)){ k={sel:focusSel(a),s:null,e:null}; try{ k.s=a.selectionStart; k.e=a.selectionEnd; }catch(e){} }
  fn();
  if(k&&k.sel){ var n=null; try{ n=box.querySelector(k.sel); }catch(e){} if(n&&n!==document.activeElement){ try{ n.focus({preventScroll:true}); if(k.s!=null&&n.setSelectionRange) n.setSelectionRange(k.s,k.e); }catch(e){} } }
}
function renderLines(){ keepFocus($('lines'),renderLines0); }
function renderLines0(){
  $('lines-count').textContent=S.lines.length?'· '+S.lines.length+' voci':'';
  if(!S.lines.length){ $('lines').innerHTML='<div class="empty">Nessuna riga. Aggiungi voci dal listino o crea una riga libera.</div>'; return; }
  var n=tierN();
  var lineHtml=function(l,i){
    var extra='<div class="nums2"><label class="chk"><input type="checkbox" data-f="opt"'+(l.opt?' checked':'')+'>Facoltativa</label>';
    if(l.opt) extra+='<label class="chk"><input type="checkbox" data-f="acc"'+(l.acc?' checked':'')+'>Scelta dal cliente</label>';
    else if(S.tiers.on){ extra+='<span class="hint">'+(brOn()?(vcOn()?'Impianti':'Proposte'):'Livelli')+':</span>'; for(var j=0;j<n;j++) extra+='<label class="chk"><input type="checkbox" data-tm="'+j+'"'+(inTier(l,j)?' checked':'')+'>'+esc(S.tiers.names[j])+'</label>'; }
    if(l.pc) extra+='<span class="hint">Per ogni condomino: la quantità segue il numero dei condomini ('+vcN()+')</span>';
    if(S.model==='app') extra+='<label class="f rsel">Stanza<select data-f="r">'+roomOpts(l.r)+'</select></label>';
    extra+=prodChip(l,i)+'</div>';
    return '<div class="line'+(l.off?' off':'')+(SYNC.set.has(l)?' sync':'')+'" data-i="'+i+'"><div class="ltools"><span class="lnum">'+(i+1)+'</span><span class="sp"></span><button type="button" class="lt" data-lup="'+i+'" aria-label="Sposta su"'+(i?'':' disabled')+'>▲</button><button type="button" class="lt" data-ldn="'+i+'" aria-label="Sposta giù"'+(i<S.lines.length-1?'':' disabled')+'>▼</button><button type="button" class="lt" data-ldup="'+i+'">Duplica</button><button type="button" class="lt del" data-rm="'+i+'" aria-label="Rimuovi riga">Elimina</button></div><textarea rows="1" class="t1" data-f="d" aria-label="Descrizione">'+esc(l.d)+'</textarea>'+lineBrandHtml(l)+'<div class="nums">'+
      '<label class="f">Q.tà<input type="number" step="any" min="0" data-f="q" value="'+esc(l.q)+'"></label>'+
      '<label class="f">U.m.<input type="text" data-f="u" value="'+esc(l.u)+'"></label>'+
      (FREE()?'':'<label class="f">€ unit.<input type="number" step="any" min="0" data-f="p" value="'+esc(l.p)+'"></label>'+
      '<label class="f">Sc. %<input type="number" step="any" min="0" max="100" data-f="s" value="'+esc(l.s)+'"></label>')+
      '<label class="chk" style="padding-bottom:6px"><input type="checkbox" data-f="off"'+(l.off?'':' checked')+'>Incl.</label>'+
      (FREE()?'':'<span class="tot">'+eur(lineTotal(l))+'</span>')+
      '</div>'+extra+'</div>';
  };
  brDatalist();
  if(S.model==='app'){
    morph($('lines'),docImgs(groupLines(S.lines).map(function(g){
      return '<div class="rgh"><span class="ri">'+roomSvg(g.room?g.room.kind:'ge','rsvg')+'</span><b>'+esc(groupName(g))+'</b><span class="rs">'+g.items.length+' · '+eur(groupSum(g))+'</span></div>'+g.items.map(function(x){ return lineHtml(x.l,x.i); }).join('');
    }).join('')));
  } else morph($('lines'),docImgs(S.lines.map(lineHtml).join('')));
  if(!$('lines').closest('[data-panel]').hidden) setTimeout(function(){ if(Date.now()-(SYNC.addT||0)>2400) SYNC.set=new WeakSet(); },2500);
}
/* marca nelle righe: si scrive qui oppure nella scheda Prodotti, e resta uguale nei due posti */
var SYNC={set:new WeakSet(),t:0,n:0,rows:0};
function lineBrandOf(l){ var p=prodOfLine(l); return String(l.br||(p&&p.brand)||'').trim(); }
function lineBrandHtml(l){
  if(l.vm) return ''; var p=prodOfLine(l), b=lineBrandOf(l); if(!b&&!p&&!prodWorthy(l)) return '';
  var lg=b?brandLogo(b):'';
  return '<div class="lbr"><div class="lbr-h"><span class="lbr-t">Marca</span>'+(p?'<span class="lbr-k" title="Nome e marca restano uguali a quelli della scheda in Prodotti">⇄ collegata alla scheda</span>':'')+'</div><div class="lbr-r"><span class="lbr-lg">'+(lg?'<img src="'+lg+'" alt="">':'')+'</span><input type="text" data-f="br" data-brsug value="'+esc(b)+'" placeholder="es. Bticino" aria-label="Marca" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="done"></div></div>';
}
function brDatalist(){
  var seen={}, L=[]; function add(b){ b=String(b||'').trim(); var k=b.toLowerCase(); if(b&&!seen[k]){ seen[k]=1; L.push(b); } }
  S.lines.forEach(function(l){ add(l.br); }); S.products.forEach(function(p){ add(p.brand); }); (DB.logos||[]).forEach(function(x){ add(x.name); }); maVoci().forEach(function(m){ add(m.n); });
  BRL=L;
}
/* suggerimenti delle marche mentre scrivi: chip grandi da toccare (l'elenco nativo del browser sui telefoni copre la tastiera) */
var BRL=[];
function brSugHide(){ var x=document.getElementById('br-sug'); if(x) x.remove(); }
function brSugShow(inp){
  var q=String(inp.value||'').trim().toLowerCase(); brSugHide(); if(!q) return; if(!BRL.length) brDatalist();
  var M=BRL.filter(function(b){ var l=b.toLowerCase(); return l!==q&&(l.indexOf(q)===0||l.indexOf(' '+q)>-1); }).slice(0,6); if(!M.length) return;
  var box=document.createElement('div'); box.id='br-sug'; box.className='brsug'; box.setAttribute('role','listbox');
  box.innerHTML=M.map(function(b){ var lg=brandLogo(b); return '<button type="button" role="option" data-brs="'+esc(b)+'">'+(lg?'<img src="'+imgBlob(lg)+'" alt="">':'')+esc(b)+'</button>'; }).join('');
  var host=inp.closest('.lbr')||inp.closest('.lbulk')||inp.parentElement; host.appendChild(box);
}
document.addEventListener('input',function(e){ var t=e.target; if(t&&t.hasAttribute&&t.hasAttribute('data-brsug')) brSugShow(t); },true);
document.addEventListener('focusout',function(e){ var t=e.target; if(t&&t.hasAttribute&&t.hasAttribute('data-brsug')) setTimeout(function(){ var a=document.activeElement; if(!a||!a.hasAttribute||!a.hasAttribute('data-brsug')) brSugHide(); },180); },true);
// il tocco sul suggerimento non deve togliere il fuoco al campo (tastiera aperta)
document.addEventListener('pointerdown',function(e){ if(e.target.closest&&e.target.closest('#br-sug')) e.preventDefault(); },true);
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-brs]'); if(!b) return;
  var box=b.closest('#br-sug'), host=box&&box.parentElement, inp=host&&host.querySelector('[data-brsug]'); if(!inp) return;
  inp.value=b.getAttribute('data-brs'); brSugHide(); inp.dispatchEvent(new Event('input',{bubbles:true})); inp.dispatchEvent(new Event('change',{bubbles:true})); try{ inp.focus({preventScroll:true}); }catch(x){}
});
function lineBrandSet(L,v,row){
  var ob=lineBrandOf(L); L.br=v; var p=prodOfLine(L), n=0;
  if(p){ L.pid=p.id; var pb=p.brand||''; p.brand=v;
    S.lines.forEach(function(x,k){ if(x===L||x.vm||prodOfLine(x)!==p) return; if(!x.br||lc(x.br)===lc(ob)||lc(x.br)===lc(pb)){ x.br=v; n++; var inp=$('lines').querySelector('.line[data-i="'+k+'"] [data-f="br"]'); if(inp&&inp!==document.activeElement) inp.value=v; } });
    renderProducts(); }
  var lg=row&&row.querySelector('.lbr-lg'); if(lg){ var u=v?brandLogo(v):''; lg.innerHTML=u?'<img src="'+imgBlob(u)+'" alt="">':''; }
  return n;
}
var openP={}, MAXPH=6, MAXCP=4;
// la scheda Prodotti (piena di foto) si ridisegna solo quando la guardi
var PLAZY=false;
function renderProducts(force){ var sec=$('plist').closest('[data-panel]'); if(sec&&sec.hidden&&force!==true){ PLAZY=true; return; } PLAZY=false; keepFocus($('plist'),renderProducts0); }
(function(){ var sec=$('plist').closest('[data-panel]'); if(sec&&window.MutationObserver) new MutationObserver(function(){ if(!sec.hidden&&PLAZY) renderProducts(); }).observe(sec,{attributes:true,attributeFilter:['hidden']}); })();
function renderProducts0(){
  if(!S.products.length){ $('plist').innerHTML='<div class="empty">Nessun prodotto. Aggiungine uno o crealo dalle righe del preventivo.</div>'; return; }
  morph($('plist'),docImgs(S.products.map(function(p,i){
    var th=(p.photos||[]).map(function(u,j){ return '<div class="thumb"><img src="'+u+'" alt=""><button type="button" data-rph="'+i+':'+j+'" aria-label="Rimuovi foto">×</button>'+(j>0?'<button type="button" class="star" data-mph="'+i+':'+j+'" aria-label="Usa come foto principale" title="Foto principale">★</button>':'')+'</div>'; }).join('');
    return '<details class="pe" data-pid="'+esc(p.id)+'"'+(openP[p.id]?' open':'')+'><summary><span class="pn"'+(p.on===false?' style="opacity:.5"':'')+'>'+esc(p.name||'Nuovo prodotto')+'</span>'+(prodUsers(p).length?'':'<span class="pwarn">non nel preventivo</span>')+
      '<button type="button" class="btn ghost sm" data-act="up" data-pi="'+i+'" aria-label="Sposta su">▲</button>'+
      '<button type="button" class="btn ghost sm" data-act="down" data-pi="'+i+'" aria-label="Sposta giù">▼</button>'+
      '<button type="button" class="btn x" data-act="rm" data-pi="'+i+'" aria-label="Elimina prodotto">×</button></summary><div class="pbody">'+prodLinkInfo(p,i)+
      '<div class="subs" style="padding-left:0"><label class="chk sub"><input type="checkbox" data-px="on" data-pi="'+i+'"'+(p.on===false?'':' checked')+'><b>Includi nel fascicolo</b></label>'+
      [['photos','Foto'],['desc','Descrizione'],['specs','Caratteristiche'],['tags','Etichette'],['link','Link scheda'],['pdf','PDF allegato']].map(function(o){ return '<label class="chk sub"><input type="checkbox" data-px="'+o[0]+'" data-pi="'+i+'"'+((p.x&&p.x[o[0]])?'':' checked')+'>'+o[1]+'</label>'; }).join('')+'</div>'+
      (brOn()?prodSysSel(p,i):S.model==='vcit'?'<label class="f">Questo prodotto fa parte di<select data-pf="sol" data-pi="'+i+'"><option value=""'+(p.sol?'':' selected')+'>Tutte le soluzioni</option><option value="video"'+(p.sol==='video'?' selected':'')+'>Solo soluzione videocitofono</option><option value="cit"'+(p.sol==='cit'?' selected':'')+'>Solo soluzione citofono</option></select></label>':'')+
      '<div class="grid2"><label class="f">Nome prodotto<textarea rows="1" class="t1" data-pf="name" data-pi="'+i+'">'+esc(p.name)+'</textarea></label>'+
      '<label class="f">Marca<input type="text" data-pf="brand" data-pi="'+i+'" data-brsug autocomplete="off" autocapitalize="words" spellcheck="false" value="'+esc(p.brand)+'"></label>'+
      '<label class="f">Modello / codice<input type="text" data-pf="code" data-pi="'+i+'" value="'+esc(p.code)+'"></label>'+
      '<label class="f">Etichette (separate da virgola)<input type="text" data-pf="tags" data-pi="'+i+'" value="'+esc(p.tags)+'"></label></div>'+
      '<label class="f">Descrizione<textarea data-pf="desc" data-pi="'+i+'">'+esc(p.desc)+'</textarea></label>'+
      '<label class="f">Caratteristiche tecniche (una per riga: voce: valore)<textarea data-pf="specs" data-pi="'+i+'" style="min-height:100px">'+esc(p.specs)+'</textarea></label>'+
      '<label class="f">Link alla scheda tecnica (https://…)<textarea rows="1" class="t1" inputmode="url" autocapitalize="off" spellcheck="false" data-pf="link" data-pi="'+i+'">'+esc(p.link)+'</textarea></label>'+
      '<div class="row"><label class="btn ghost sm">'+(p.pdf?'Sostituisci scheda PDF':'Allega scheda tecnica PDF')+'<input type="file" accept="application/pdf,.pdf" hidden data-ppdf="'+i+'"></label>'+(p.pdf?'<span class="hint">'+esc(p.pdf.name)+'</span><button type="button" class="btn x" data-rpdf="'+i+'" aria-label="Rimuovi PDF">×</button>':'')+'</div>'+
      '<div class="row"><button type="button" class="btn ghost sm" data-act="lib" data-pi="'+i+'">Salva in libreria</button></div>'+
      '<label class="f">Grandezza della foto nel documento: <b class="psv">'+Math.max(15,Math.min(100,num(p.ps)||45))+'%</b><input type="range" min="15" max="100" step="5" value="'+Math.max(15,Math.min(100,num(p.ps)||45))+'" data-pf="ps" data-pi="'+i+'"></label>'+
      (function(){ var bm=p.bg||(cutOn()?'cut':'keep'); return '<div class="row" style="align-items:center"><span class="hint">Sfondo delle foto:</span><button type="button" class="tab" data-act="bgcut" data-pi="'+i+'" aria-pressed="'+(bm==='cut')+'">Senza sfondo, con alone</button><button type="button" class="tab" data-act="bgkeep" data-pi="'+i+'" aria-pressed="'+(bm==='keep')+'">Con sfondo originale</button></div>'; })()+
      (iwVero(p.brand)?(function(){ var lg=brandLogo(p.brand); return '<div class="iw-pl"><span class="iw-mi">'+(lg?'<img src="'+lg+'" alt="">':'<i>'+esc(iwBase(p.brand).slice(0,2).toUpperCase())+'</i>')+'</span><small>'+(lg?'Logo '+esc(iwBase(p.brand))+' nel fascicolo':'Nessun logo per '+esc(iwBase(p.brand)))+'</small><button type="button" class="btn ghost sm" data-act="iwlg" data-pi="'+i+'">'+(lg?'Cambia logo':'Trova il logo')+'</button></div>'; })():'')+
      '<div class="thumbs">'+th+'</div>'+
      ((p.photos||[]).length<MAXPH?'<div class="iw-ph"><button type="button" class="btn sm" data-act="iwph" data-pi="'+i+'">Trova foto sul web</button><label class="drop" data-drop="'+i+'">Trascina qui le foto oppure tocca per caricarle ('+(p.photos||[]).length+'/'+MAXPH+')<input type="file" accept="image/*" multiple hidden data-pphoto="'+i+'"></label></div>':'<p class="hint">Massimo '+MAXPH+' foto per prodotto.</p>')+
      '</div></details>';
  }).join('')));
  iwRenderMem();
}
function syncFields(){
  var st=S.style;
  $('m-title').value=S.meta.title; if($('m-type')) $('m-type').value=S.model; $('c-name').value=S.company.name; $('c-piva').value=S.company.piva;
  $('c-addr').value=S.company.addr; $('c-tel').value=S.company.tel; $('k-name').value=S.client.name; $('k-addr').value=S.client.addr;
  $('m-num').value=S.meta.num; $('m-date').value=S.meta.date; $('m-val').value=S.meta.val;
  $('m-iva').value=String(S.meta.iva); $('m-disc').value=S.meta.disc; $('m-dep').value=S.meta.dep;
  $('m-pay').value=S.pay; $('m-notes').value=S.notes;
  $('s-b1').value=st.b1; $('s-b2').value=st.b2; $('s-font').value=st.font; $('s-cover').value=st.cover; $('s-playout').value=st.prodLayout||'flow';
  $('s-clogo').value=st.coverLogo;
  Array.prototype.forEach.call(document.querySelectorAll('[data-pr]'),function(el){ el.value=S.profile[el.getAttribute('data-pr')]||''; });
  renderLogoPrev(); syncB();
}
function renderLogoPrev(){ var u=S.style.logo; $('logo-prev').innerHTML=u?'<div class="lp"><small>Pagine interne</small><div class="lpb" style="background:#fff"><img src="'+logoSrcPage()+'" alt=""></div></div><div class="lp"><small>Copertina</small><div class="lpb" id="lp2" style="background:'+S.style.b1+'"><img src="'+logoSrcCover()+'" alt=""></div></div>':'<span>Nessun logo caricato</span>'; $('logo-rm').disabled=!S.style.logo; $('logo-pal').disabled=!S.style.logo; }
function renderAll(){ try{ renderCondSave(); }catch(e){} if(S.products[0]&&openP[S.products[0].id]===undefined) openP[S.products[0].id]=true; renderTabs(); renderRooms(); renderVc(); renderCat(); renderLines(); renderProducts(); renderContent(); renderOrder(); renderCustom(); renderEcon(); renderTiers(); renderTrust(); renderIcons(); renderTpl(); syncFields(); sigDraw('cli'); sigDraw('dit'); renderStamp(); renderPlan(); renderFvRes(); renderInvio(); renderArchivio(); renderGd(); renderGh(); renderQbar(); renderAiSet(); renderImp(); renderArts(); renderAq(); schedule(); refreshVariants(); }
var docVer=0;
var lastEdit=0;
function touch(){ docVer++; lastEdit=Date.now(); save(); schedule(); iwSoon(); }

var TTL_G='Rifacimento impianto appartamento', TTL_T={wb:'Installazione wallbox per ricarica auto elettrica',rip:'Riparazione impianto elettrico',vid:'Impianto di videosorveglianza',all:'Impianto di allarme antintrusione',vcit:'Impianto videocitofonico',aut:'Automazione cancello e accessi',fv:'Impianto fotovoltaico',tv:'Impianto TV e antenna',ind:'Impianto elettrico industriale',sw:'Programmazione e messa in servizio'};
function typeTitle(prev){ if(S.meta.title===TTL_G||S.meta.title===TTL_T[prev]||(prev&&S.meta.title===(MODELS[prev]||{}).name)){ S.meta.title=TTL_T[S.model]||TTL_G; if($('m-title')) $('m-title').value=S.meta.title; } }
$('tabs').addEventListener('click',function(e){
  var b=e.target.closest('[data-m]'); if(!b) return;
  var prev=S.model; S.model=b.getAttribute('data-m');
  condSwitch(prev);
  typeTitle(prev); vmSync();
  ensureRooms(); renderTabs(); renderRooms(); renderVc(); renderCat(); renderLines(); renderPlan(); if($('m-type')) $('m-type').value=S.model; touch();
});
function bind(id,fn){ $(id).addEventListener('input',function(e){ fn(e.target.value); touch(); }); }
bind('m-title',function(v){S.meta.title=v;}); bind('c-name',function(v){S.company.name=v;}); bind('c-piva',function(v){S.company.piva=v;});
bind('c-addr',function(v){S.company.addr=v;}); bind('c-tel',function(v){S.company.tel=v;}); bind('k-name',function(v){S.client.name=v;});
bind('k-addr',function(v){S.client.addr=v;}); bind('m-num',function(v){S.meta.num=v;}); bind('m-date',function(v){S.meta.date=v;});
bind('m-val',function(v){S.meta.val=num(v);}); bind('m-disc',function(v){S.meta.disc=Math.min(100,Math.max(0,num(v)));});
bind('m-dep',function(v){S.meta.dep=Math.min(100,Math.max(0,num(v)));}); bind('m-pay',function(v){S.pay=v;}); bind('m-notes',function(v){S.notes=v;});
$('m-iva').addEventListener('change',function(e){ S.meta.iva=num(e.target.value); touch(); });
bind('s-b1',function(v){S.style.b1=v;}); bind('s-b2',function(v){S.style.b2=v;});
['s-font:font','s-cover:cover','s-playout:prodLayout'].forEach(function(p){ var a=p.split(':'); $(a[0]).addEventListener('change',function(e){ S.style[a[1]]=e.target.value; touch(); }); });
$('s-clogo').addEventListener('change',function(e){ S.style.coverLogo=e.target.value; renderLogoPrev(); touch(); });
Array.prototype.forEach.call(document.querySelectorAll('[data-pr]'),function(el){
  el.addEventListener('input',function(){ S.profile[el.getAttribute('data-pr')]=el.value; touch(); });
});

$('logo-file').addEventListener('change',function(e){
  var f=e.target.files&&e.target.files[0]; if(!f) return;
  readImage(f,800,f.type!=='image/jpeg',function(url){
    if(!url) return;
    S.style.logo=url; V={t:'',w:'',src:''}; renderLogoPrev(); refreshVariants();
    extractPalette(url,function(p){ if(p){ S.style.b1=p[0]; S.style.b2=p[1]; $('s-b1').value=p[0]; $('s-b2').value=p[1]; toast('Logo caricato: colori ricavati dal logo'); } else toast('Logo caricato: scegli i colori a mano'); touch(); });
  });
  e.target.value='';
});
$('logo-rm').addEventListener('click',function(){ S.style.logo=''; V={t:'',w:'',src:''}; renderLogoPrev(); touch(); });
$('logo-pal').addEventListener('click',function(){
  extractPalette(S.style.logo,function(p){ if(p){ S.style.b1=p[0]; S.style.b2=p[1]; $('s-b1').value=p[0]; $('s-b2').value=p[1]; touch(); toast('Colori ricalcolati dal logo'); } else toast('Non riesco a leggere i colori: scegli a mano'); });
});

$('cat').addEventListener('input',function(e){ var i=e.target.getAttribute('data-cp'); if(i==null) return; S.cat[S.model][+i][2]=num(e.target.value); save(); });
$('cat').addEventListener('click',function(e){
  var a=e.target.closest('[data-add]'), d=e.target.closest('[data-del]'), pr=e.target.closest('[data-prn]');
  if(pr){ var pv=prById(pr.getAttribute('data-prn')); if(!pv) return; var ni=prNelListino(pv,S.model); catAdd(ni,' · entrata nel tuo listino'); renderCat(); return; }
  if(a) catAdd(+a.getAttribute('data-add'));
  else if(d){ S.cat[S.model].splice(+d.getAttribute('data-del'),1); renderCat(); save(); }
});
function catAdd(ix,extra){
  {
    var it=S.cat[S.model][ix];
    var ad=addToRoom(it,1), np=false;
    if(S.model==='vcit'&&it[3]===VCG){ ad.pc=1; ad.q=vcN(); }
    if(brOn()){ var sy=sysCur(), pn=S.products.length; ad.tm=[brS().cur]; ad.sy=sy.id; ad.br=sy.b||''; linkLine(ad); np=S.products.length>pn; if(np) renderProducts(); }
    else if(S.model==='vcit'){
      { if(vcMode()==='both'&&vcSolOf(it)) ad.tm=[vcSolOf(it)==='cit'?0:1]; var lk=linkLine(ad,{sol:vcSolOf(it)}); np=!!(lk&&lk.created); if(np) renderProducts(); }
    } else { var lk2=linkLine(ad); np=!!(lk2&&lk2.created); if(np) renderProducts(); }
    renderLines(); renderRooms(); touch(); toast('Aggiunto: '+it[0]+(S.model==='app'?' → '+curRoomName():'')+(np?' · scheda creata in Prodotti':'')+(extra||''));
  }
}
$('cat-q').addEventListener('input',renderCat);
$('cat-f').addEventListener('click',function(){ catAll=!catAll; renderCat(); });
$('rooms').addEventListener('click',function(e){
  var c=e.target.closest('[data-room]'), a=e.target.closest('[data-addroom]'), b=e.target.closest('[data-rmact]');
  if(c){ S.curRoom=c.getAttribute('data-room'); renderRooms(); renderCat(); save(); return; }
  if(a){ var k=a.getAttribute('data-addroom'), r={id:rid(),name:uniqueRoomName(k),kind:k}; S.rooms.push(r); S.curRoom=r.id; afterRoomChange(); toast('Stanza aggiunta: '+r.name+'. Con «Aggiungi kit» inserisci le voci tipiche'); return; }
  if(!b) return; var act=b.getAttribute('data-rmact'), r2=roomById(curKey()), i=r2?S.rooms.indexOf(r2):-1;
  if(act==='kit'){ addKit(); return; }
  if(!r2) return;
  if(act==='left'&&i>0){ S.rooms.splice(i-1,0,S.rooms.splice(i,1)[0]); afterRoomChange(); }
  else if(act==='right'&&i<S.rooms.length-1){ S.rooms.splice(i+1,0,S.rooms.splice(i,1)[0]); afterRoomChange(); }
  else if(act==='dup'){
    var n={id:rid(),name:uniqueRoomName(r2.kind).replace(/ \d+$/,'')===r2.name?r2.name+' 2':r2.name+' (copia)',kind:r2.kind}, nm=n.name, t=2; while(S.rooms.some(function(x){return x.name===nm;})){ nm=r2.name+' ('+t+')'; t++; } n.name=nm;
    S.rooms.splice(i+1,0,n);
    S.lines.filter(function(l){ return roomKey(l)===r2.id; }).forEach(function(l){ var c2=JSON.parse(JSON.stringify(l)); c2.r=n.id; S.lines.push(c2); });
    S.curRoom=n.id; afterRoomChange(); toast('Stanza duplicata con le sue voci');
  }
  else if(act==='del'){
    var nl=S.lines.filter(function(l){ return roomKey(l)===r2.id; }).length;
    if(!window.confirm('Eliminare «'+r2.name+'»?'+(nl?' Le sue '+nl+' voci passano a «Parti comuni e generali».':''))) return;
    S.lines.forEach(function(l){ if(l.r===r2.id) delete l.r; });
    S.rooms.splice(i,1); S.curRoom=S.rooms[Math.min(i,S.rooms.length-1)]?S.rooms[Math.min(i,S.rooms.length-1)].id:''; afterRoomChange();
  }
});
$('rooms').addEventListener('input',function(e){
  var r=roomById(curKey()); if(!r) return;
  if(e.target.id==='rm-name'){
    r.name=e.target.value||'Stanza'; var ch=$('rooms').querySelector('[data-room="'+r.id+'"] .rl'); if(ch) ch.textContent=r.name;
    renderLines(); renderCat(); touch();
  } else if(e.target.id==='rm-kind'){ r.kind=e.target.value; renderRooms(); renderCat(); renderLines(); touch(); }
});

var lsModel='dom', lsQ='', lsClosed={};
function kindsText(k){
  if(!k||k==='*') return 'tutte le stanze';
  if(k==='x') return 'nessuna (solo in ricerca)';
  return k.split(',').map(function(c){ return c==='ge'?'Parti comuni':(ROOMNAME[c]||c); }).join(', ');
}
function renderListini(){
  var m=lsModel, items=S.cat[m]||[], gl=cgSync(m), app=m==='app', q=lsQ.trim().toLowerCase();
  $('ls-model').innerHTML=ORDER.map(function(k){ return '<option value="'+k+'"'+(k===m?' selected':'')+'>'+esc(MODELS[k].short)+'</option>'; }).join('');
  var cur=$('ls-ng').value; $('ls-ng').innerHTML=groupOpts(m,cur,'Categoria…'); $('ls-ng').value=gl.indexOf(cur)>-1?cur:'';
  var secs=gl.map(function(g,gi){ return {g:g,gi:gi}; }); secs.push({g:'',gi:-1});
  var html='';
  secs.forEach(function(sc){
    var idx=[]; items.forEach(function(it,i){ var gn=it[3]&&gl.indexOf(it[3])>-1?it[3]:''; if(gn===sc.g) idx.push(i); });
    var all=idx.length;
    if(q) idx=idx.filter(function(i){ return String(items[i][0]).toLowerCase().indexOf(q)>-1||sc.g.toLowerCase().indexOf(q)>-1; });
    if(q&&!idx.length) return; if(!sc.g&&!all) return;
    var key=sc.g||'~', closed=!q&&lsClosed[m+'|'+key];
    html+='<section class="lsg"><div class="lsh"><button type="button" class="lt" data-gtog="'+esc(key)+'" aria-label="Apri o chiudi" aria-expanded="'+(!closed)+'">'+(closed?'▸':'▾')+'</button>'+
      (sc.g?'<textarea rows="1" class="t1 gname" data-gren="'+sc.gi+'" aria-label="Nome categoria" maxlength="60">'+esc(sc.g)+'</textarea>':'<span class="gname plain">Senza categoria</span>')+
      '<em>'+all+'</em>'+
      (sc.g?'<button type="button" class="lt" data-gup="'+sc.gi+'" aria-label="Sposta categoria su"'+(sc.gi?'':' disabled')+'>▲</button><button type="button" class="lt" data-gdn="'+sc.gi+'" aria-label="Sposta categoria giù"'+(sc.gi<gl.length-1?'':' disabled')+'>▼</button><button type="button" class="btn x" data-gdel="'+sc.gi+'" aria-label="Elimina categoria">×</button>':'')+'</div>';
    if(!closed){
      html+=idx.map(function(i){
        var it=items[i];
        return '<div class="lsr" data-i="'+i+'"><textarea rows="1" class="t1 ld" data-lf="d" aria-label="Descrizione">'+esc(it[0])+'</textarea>'+
          '<div class="lr2"><label class="f sm">u.m.<input type="text" class="lu" data-lf="u" value="'+esc(it[1])+'"></label><label class="f sm">Prezzo €<input type="number" step="any" min="0" class="lp" data-lf="p" value="'+esc(it[2])+'"></label>'+
          '<label class="f sm lg">Categoria<select data-lf="g">'+groupOpts(m,sc.g)+'</select></label>'+
          '<span class="lacts"><button type="button" class="lt" data-lup="'+i+'" aria-label="Sposta su">▲</button><button type="button" class="lt" data-ldn="'+i+'" aria-label="Sposta giù">▼</button><button type="button" class="btn x" data-ldel="'+i+'" aria-label="Elimina voce">×</button></span></div>'+
          (app?'<details class="lsk"><summary>Adatta a: <span>'+esc(kindsText(it[4]))+'</span></summary><div class="kchk">'+ROOMORD.concat(['ge']).map(function(c){ var on=!it[4]||it[4]==='*'||(it[4]!=='x'&&it[4].split(',').indexOf(c)>-1); return '<label class="chk sub"><input type="checkbox" data-lk="'+c+'"'+(on?' checked':'')+'>'+esc(c==='ge'?'Parti comuni':ROOMNAME[c])+'</label>'; }).join('')+'</div></details>':'')+'</div>';
      }).join('')||'<div class="empty">Nessuna voce in questa categoria.</div>';
    }
    html+='</section>';
  });
  $('ls-body').innerHTML=html||'<div class="empty">'+(q?'Nessuna voce trovata.':'Questo listino è vuoto. Aggiungi una voce qui sopra.')+'</div>';
}
function lsChanged(){ renderCat(); save(); }
$('ls-model').addEventListener('change',function(e){ lsModel=e.target.value; renderListini(); });
$('ls-q').addEventListener('input',function(e){ lsQ=e.target.value; renderListini(); });
$('ls-back').addEventListener('click',function(){ showPanel('prev'); window.scrollTo(0,0); });
$('cat-edit').addEventListener('click',function(){ showPanel('listini'); window.scrollTo(0,0); });
$('ls-nadd').addEventListener('click',function(){
  var d=$('ls-nd').value.trim(); if(!d){ toast('Scrivi la descrizione della voce'); $('ls-nd').focus(); return; }
  var g=$('ls-ng').value, it=[d,$('ls-nu').value.trim()||'cad',num($('ls-np').value)]; if(g){ it.push(g); if(lsModel==='app') it.push('*'); }
  S.cat[lsModel].push(it); $('ls-nd').value=''; $('ls-np').value=''; lsQ=''; $('ls-q').value='';
  renderListini(); lsChanged(); toast('Voce aggiunta'+(g?' in «'+g+'»':''));
  if(lsModel===S.model&&S.model!=='app'&&false){}
});
$('ls-cgadd').addEventListener('click',function(){
  var n=$('ls-cg').value.trim(); if(!n){ toast('Scrivi il nome della categoria'); $('ls-cg').focus(); return; }
  var gl=cgSync(lsModel); if(gl.some(function(x){ return x.toLowerCase()===n.toLowerCase(); })){ toast('Esiste già una categoria con questo nome'); return; }
  gl.push(n); $('ls-cg').value=''; $('ls-ng').value=n; renderListini(); $('ls-ng').value=n; lsChanged(); toast('Categoria aggiunta: '+n+'. Ora puoi inserirci le voci');
});
$('ls-body').addEventListener('click',function(e){
  var m=lsModel, items=S.cat[m], gl=cgSync(m), t;
  if((t=e.target.closest('[data-gtog]'))){ var k=m+'|'+t.getAttribute('data-gtog'); lsClosed[k]=!lsClosed[k]; renderListini(); return; }
  if((t=e.target.closest('[data-gup],[data-gdn]'))){
    var up=t.hasAttribute('data-gup'), i=+t.getAttribute(up?'data-gup':'data-gdn'), j=up?i-1:i+1;
    if(j<0||j>=gl.length) return; gl.splice(j,0,gl.splice(i,1)[0]); renderListini(); lsChanged(); return; }
  if((t=e.target.closest('[data-gdel]'))){
    var gi=+t.getAttribute('data-gdel'), gn=gl[gi], cnt=items.filter(function(it){ return it[3]===gn; }).length;
    if(!window.confirm('Eliminare la categoria «'+gn+'»?'+(cnt?' Le sue '+cnt+' voci restano nel listino, sotto «Senza categoria».':''))) return;
    items.forEach(function(it){ if(it[3]===gn) it[3]=''; }); gl.splice(gi,1); renderListini(); lsChanged(); return; }
  if((t=e.target.closest('[data-lup],[data-ldn]'))){
    var u=t.hasAttribute('data-lup'), k2=+t.getAttribute(u?'data-lup':'data-ldn'), key=items[k2][3]||'';
    var j2=-1; for(var x=k2+(u?-1:1);x>=0&&x<items.length;x+=(u?-1:1)){ if((items[x][3]||'')===key){ j2=x; break; } }
    if(j2<0) return; items.splice(j2,0,items.splice(k2,1)[0]); renderListini(); lsChanged(); return; }
  if((t=e.target.closest('[data-ldel]'))){
    var di=+t.getAttribute('data-ldel');
    if(!window.confirm('Eliminare la voce «'+items[di][0]+'» dal listino?')) return;
    items.splice(di,1); renderListini(); lsChanged(); toast('Voce eliminata'); return; }
});
$('ls-body').addEventListener('change',function(e){
  var m=lsModel, items=S.cat[m], gl=cgSync(m), t=e.target;
  if(t.hasAttribute('data-gren')){
    var gi=+t.getAttribute('data-gren'), old=gl[gi], n=t.value.trim();
    if(!n){ t.value=old; toast('Il nome non può essere vuoto'); return; }
    if(gl.some(function(x,k){ return k!==gi&&x.toLowerCase()===n.toLowerCase(); })){ t.value=old; toast('Esiste già una categoria con questo nome'); return; }
    if(n===old) return; items.forEach(function(it){ if(it[3]===old) it[3]=n; }); gl[gi]=n; renderListini(); lsChanged(); toast('Categoria rinominata'); return; }
  var row=t.closest('.lsr'); if(!row) return; var it=items[+row.getAttribute('data-i')];
  if(t.getAttribute('data-lf')==='g'){ setItG(it,t.value); renderListini(); lsChanged(); toast(t.value?'Voce spostata in «'+t.value+'»':'Voce senza categoria'); return; }
  if(t.hasAttribute('data-lk')){
    var codes=[]; row.querySelectorAll('[data-lk]').forEach(function(c){ if(c.checked) codes.push(c.getAttribute('data-lk')); });
    var all=ROOMORD.length+1; setItG(it,it[3]||''); it[4]=codes.length===all?'*':(codes.length?codes.join(','):'x');
    row.querySelector('.lsk summary span').textContent=kindsText(it[4]); lsChanged(); }
});
$('ls-body').addEventListener('input',function(e){
  var t=e.target, f=t.getAttribute&&t.getAttribute('data-lf'); if(!f||f==='g') return;
  var row=t.closest('.lsr'); if(!row) return; var it=S.cat[lsModel][+row.getAttribute('data-i')];
  it[f==='d'?0:f==='u'?1:2]=(f==='p')?num(t.value):t.value; lsChanged();
});
$('ls-restore').addEventListener('click',function(){
  var m=lsModel, have=S.cat[m].map(function(it){return it[0];}), n=0;
  MODELS[m].items.forEach(function(it){ if(have.indexOf(it[0])<0){ S.cat[m].push(copy(it)); n++; } });
  cgSync(m); renderListini(); lsChanged(); toast(n?('Ripristinate '+n+' voci'):'Nessuna voce da ripristinare');
});
$('ls-reset').addEventListener('click',function(){
  if(!window.confirm('Riportare «'+MODELS[lsModel].name+'» alle voci originali? Le tue modifiche e le voci aggiunte a questo listino andranno perse.')) return;
  S.cat[lsModel]=copy(MODELS[lsModel].items); S.cgroups[lsModel]=[]; cgSync(lsModel); renderListini(); lsChanged(); toast('Listino riportato all\'originale');
});
$('n-add').addEventListener('click',function(){
  var d=$('n-d').value.trim(); if(!d){ toast('Scrivi la descrizione della voce'); return; }
  var ng=$('n-g').value, ni=[d,$('n-u').value.trim()||'cad',num($('n-p').value)]; if(ng){ ni.push(ng); if(S.model==='app') ni.push('*'); } S.cat[S.model].push(ni);
  $('n-d').value=''; $('n-u').value=''; $('n-p').value=''; renderCat(); save();
});
$('lines').addEventListener('input',function(e){
  var row=e.target.closest('.line'); if(!row) return;
  var i=+row.getAttribute('data-i'), L=S.lines[i], tm=e.target.getAttribute('data-tm');
  if(tm!=null){
    var j=+tm, n=tierN(), cur=[], k; for(k=0;k<n;k++) if(inTier(L,k)) cur.push(k);
    var at=cur.indexOf(j); if(e.target.checked){ if(at<0) cur.push(j); } else if(at>-1) cur.splice(at,1);
    if(cur.length===n) delete L.tm; else L.tm=cur.sort();
    touch(); return;
  }
  var f=e.target.getAttribute('data-f'); if(!f) return;
  if(f==='br'){ lineBrandSet(L,e.target.value,row); touch(); return; }
  if(f==='off'){ L.off=!e.target.checked; row.classList.toggle('off',!!L.off); touch(); return; }
  if(f==='r'){ if(e.target.value) L.r=e.target.value; else delete L.r; renderLines(); renderRooms(); touch(); return; }
  if(f==='opt'||f==='acc'){ L[f]=e.target.checked; if(f==='opt'&&!L.opt) delete L.acc; renderLines(); touch(); return; }
  var v=e.target.value; L[f]=(f==='d'||f==='u')?v:num(v); if(f==='q'&&L.pc) delete L.pc;
  var t=row.querySelector('.tot'); if(t) t.textContent=eur(lineTotal(L));
  touch();
});
$('lines').addEventListener('click',function(e){
  var u=e.target.closest('[data-lup],[data-ldn],[data-ldup]');
  if(u){ var k=u.hasAttribute('data-lup')?+u.getAttribute('data-lup'):u.hasAttribute('data-ldn')?+u.getAttribute('data-ldn'):+u.getAttribute('data-ldup'), L=S.lines;
    var nb=function(dir){ if(S.model!=='app') return k+dir; var kk=roomKey(L[k]); for(var j=k+dir;j>=0&&j<L.length;j+=dir) if(roomKey(L[j])===kk) return j; return -1; };
    if(u.hasAttribute('data-lup')){ var j1=nb(-1); if(j1>=0&&k>0) L.splice(j1,0,L.splice(k,1)[0]); }
    else if(u.hasAttribute('data-ldn')){ var j2=nb(1); if(j2>=0&&k<L.length-1) L.splice(j2,0,L.splice(k,1)[0]); }
    else if(u.hasAttribute('data-ldup')){ L.splice(k+1,0,JSON.parse(JSON.stringify(L[k]))); }
    renderLines(); renderRooms(); touch(); return; }
  var b=e.target.closest('[data-rm]'); if(!b) return;
  var ri=+b.getAttribute('data-rm'), RL=S.lines[ri], rp=prodOfLine(RL); S.lines.splice(ri,1);
  if(rp&&!prodUsers(rp).length){ if(prodEmpty(rp)){ S.products=S.products.filter(function(x){ return x!==rp; }); toast('Rimossa anche la scheda prodotto, che era vuota'); } else toast('La scheda «'+rp.name+'» resta in Prodotti con i suoi dati, segnata come non più nel preventivo'); renderProducts(); }
  renderLines(); renderRooms(); touch(); });
(function(){
  $('lines').addEventListener('click',function(e){
    var g=e.target.closest('[data-lgo]'), m=e.target.closest('[data-lmk]'); if(!g&&!m) return;
    var L=S.lines[+(g||m).getAttribute(g?'data-lgo':'data-lmk')]; if(!L) return;
    var r=linkLine(L,{force:true}); if(!r) return;
    openP[r.p.id]=true; renderProducts(); renderLines(); touch();
    if(m) toast('Scheda creata in Prodotti: '+r.p.name+(r.p.photos&&r.p.photos.length?' · con foto dalla libreria':''));
    if(g){ showPanel('prodotti'); setTimeout(function(){ var el=document.querySelector('#plist [data-pid="'+r.p.id+'"]'); if(el){ el.open=true; var y=el.getBoundingClientRect().top+(window.pageYOffset||0)-170; try{ window.scrollTo({top:Math.max(0,y),behavior:'smooth'}); }catch(x){ window.scrollTo(0,Math.max(0,y)); } } },60); }
  });
})();
$('add-free').addEventListener('click',function(){ var nl={d:'',u:'cad',q:1,p:0,s:0}; if(S.model==='app'&&curKey()) nl.r=curKey(); brTag(nl); S.lines.push(nl); renderLines(); renderRooms(); touch(); });
$('clear-lines').addEventListener('click',function(){ S.lines=[]; renderLines(); renderRooms(); touch(); });
$('reset-notes').addEventListener('click',function(){ S.notes=MODELS[S.model].notes; $('m-notes').value=S.notes; renderCondSave(); touch(); });

