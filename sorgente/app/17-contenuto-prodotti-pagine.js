/* contenuto */
var GROUPS=[
  ['Copertina','cover',[['cvSocial','Contatti e social con link'],['cvRef','Numero e data'],['cvKicker','Tipo di impianto'],['cvSlogan','Slogan'],['cvCable','Decorazione a cavi'],['cvClient','Cliente'],['cvValid','Validità offerta'],['cvCompany','Dati ditta']]],
  ['Prodotti e soluzioni','@prodotti',[['prodIntro','Testo introduttivo']]],
  ['Chi siamo','@azienda',[['azSlogan','Slogan'],['azAbout','Presentazione'],['azStats','Numeri'],['azSteps','Come lavoriamo'],['azCerts','Abilitazioni'],['azGuar','Garanzie']]],
  ['Planimetria con posizioni','planimetria',[]],
  ['Preventivo economico','prev',[['pvStrip','Riepilogo in alto'],['pvBrand','Marca e modello di ogni voce'],['pvOpt','Opzioni facoltative'],['pvAcc','Acconto e saldo']]],
  ['Offerta a livelli','@tiers',[]],
  ['Stima fotovoltaico','fv',[]],
  ['Cronoprogramma','crono',[]],
  ['Lavori, recensioni e contatti','fiducia',[['trBA','Prima e dopo'],['trWorks','Lavori eseguiti'],['trRev','Recensioni'],['trBrand','Marche'],['trQR','Contatti con link e icone']]],
  ['Condizioni e accettazione','cond',[['cdPay','Pagamento'],['cdNotes','Note e clausole'],['cdChoice','Riepilogo offerta scelta'],['cdSign','Firme']]],
  ['Conferma d\'ordine','conferma',[]],
  ['Ordine di lavoro','lavoro',[]],
  ['Verbale di collaudo','collaudo',[]],
  ['Schede tecniche PDF accodate','@pdf',[]],
  ['Su tutte le pagine',null,[['pgHead','Intestazione con logo'],['pgFoot','Piè di pagina']]]
];
function groupOn(k){ if(k===null) return true; if(k==='@prodotti') return !!S.style.showProdotti; if(k==='@azienda') return !!S.style.showAzienda; if(k==='@tiers') return !!S.tiers.on; if(k==='@pdf') return !!S.style.attachPdf; return !!S.show[k]; }
function renderContent(){
  $('content-list').innerHTML=GROUPS.map(function(g){
    var on=groupOn(g[1]);
    var head=g[1]===null?'<b>'+esc(g[0])+'</b>':'<label class="chk"><input type="checkbox" data-sg="'+g[1]+'"'+(on?' checked':'')+'><b>'+esc(g[0])+'</b></label>';
    var subs=g[2].map(function(o){ return '<label class="chk"><input type="checkbox" data-sk="'+o[0]+'"'+(S.show[o[0]]?' checked':'')+'>'+esc(o[1])+'</label>'; }).join('');
    return '<div class="grp">'+head+'<div class="subs'+(on?'':' dim')+'">'+subs+'</div></div>';
  }).join('');
}
$('content-list').addEventListener('change',function(e){
  var g=e.target.getAttribute('data-sg'), k=e.target.getAttribute('data-sk');
  if(g){ if(g==='@prodotti') S.style.showProdotti=e.target.checked; else if(g==='@azienda') S.style.showAzienda=e.target.checked; else if(g==='@tiers'){ S.tiers.on=e.target.checked; renderTiers(); renderLines(); } else if(g==='@pdf'){ S.style.attachPdf=e.target.checked; renderInvio(); } else S.show[g]=e.target.checked; syncB(); }
  else if(k){ S.show[k]=e.target.checked; }
  else return;
  renderContent(); touch();
});
$('cat-restore').addEventListener('click',function(){
  var have=S.cat[S.model].map(function(it){return it[0];}), n=0;
  MODELS[S.model].items.forEach(function(it){ if(have.indexOf(it[0])<0){ S.cat[S.model].push(copy(it)); n++; } });
  cgSync(S.model); renderCat(); save(); toast(n?('Ripristinate '+n+' voci'):'Nessuna voce da ripristinare');
});

/* prodotti */
$('plist').addEventListener('toggle',function(e){ var d=e.target; if(d&&d.getAttribute&&d.getAttribute('data-pid')) openP[d.getAttribute('data-pid')]=d.open; },true);
$('plist').addEventListener('input',function(e){
  var px=e.target.getAttribute('data-px');
  if(px){
    var pp=S.products[+e.target.getAttribute('data-pi')];
    if(px==='on'){ pp.on=e.target.checked; var sm=e.target.closest('.pe').querySelector('.pn'); if(sm) sm.style.opacity=pp.on?'':'.5'; }
    else { if(!pp.x) pp.x={}; pp.x[px]=!e.target.checked; }
    touch(); return;
  }
  var f=e.target.getAttribute('data-pf'); if(!f) return;
  var i=+e.target.getAttribute('data-pi'); S.products[i][f]=(f==='ps')?num(e.target.value):e.target.value;
  if(f==='ps'){ var pv=e.target.closest('.pe').querySelector('.psv'); if(pv) pv.textContent=S.products[i].ps+'%'; }
  if(f==='name'){ S.products[i].man=true; var pn=e.target.closest('.pe').querySelector('.pn'); if(pn) pn.textContent=e.target.value||'Nuovo prodotto'; }
  touch();
});
$('plist').addEventListener('click',function(e){
  var rp=e.target.closest('[data-rpdf]');
  if(rp){ delete S.products[+rp.getAttribute('data-rpdf')].pdf; renderProducts(); renderInvio(); touch(); return; }
  var mp=e.target.closest('[data-mph]');
  if(mp){ var m=mp.getAttribute('data-mph').split(':'); var pm=S.products[+m[0]], arr=pm.photos; if(pm.po){ while(pm.po.length<arr.length) pm.po.push(''); pm.po.unshift(pm.po.splice(+m[1],1)[0]); } arr.unshift(arr.splice(+m[1],1)[0]); renderProducts(); touch(); return; }
  var r=e.target.closest('[data-rph]');
  if(r){ var a=r.getAttribute('data-rph').split(':'); S.products[+a[0]].photos.splice(+a[1],1); if(S.products[+a[0]].po) S.products[+a[0]].po.splice(+a[1],1); renderProducts(); touch(); return; }
  var b=e.target.closest('[data-act]'); if(!b) return;
  e.preventDefault();
  var i=+b.getAttribute('data-pi'), act=b.getAttribute('data-act');
  if(act==='lib'){ saveProd(i); return; }
  if(act==='iwph'||act==='iwlg'){ iwProd(i,act); return; }
  if(act==='bgcut'||act==='bgkeep'){ setBg(i,act==='bgcut'?'cut':'keep'); return; }
  if(act==='rm'){ S.products.splice(i,1); }
  else if(act==='up'&&i>0){ var t=S.products[i]; S.products[i]=S.products[i-1]; S.products[i-1]=t; }
  else if(act==='down'&&i<S.products.length-1){ var u=S.products[i]; S.products[i]=S.products[i+1]; S.products[i+1]=u; }
  renderProducts(); touch();
});
function addPhotos(arr,max,files,done,orig,mode){
  files=Array.prototype.slice.call(files||[]).filter(function(f){ return /^image\//.test(f.type)||/\.(jpe?g|png|webp|gif|svg)$/i.test(f.name); }).slice(0,Math.max(0,max-arr.length));
  var left=files.length, slots=new Array(left);
  if(!left){ toast(arr.length>=max?'Massimo '+max+' foto':'Nessuna immagine valida'); return; }
  files.forEach(function(f,k){ readProdImg(f,1000,function(url,o){ slots[k]=[url,o]; left--; if(left===0){
    if(orig) while(orig.length<arr.length) orig.push('');
    slots.forEach(function(u){ if(u&&u[0]){ arr.push(u[0]); if(orig) orig.push(u[1]&&u[1]!==u[0]?u[1]:''); } }); done(); } },mode); });
}
function prodPhotos(i,files){ var p=S.products[i]; if(!p) return; if(!p.photos) p.photos=[]; if(!p.po) p.po=[]; addPhotos(p.photos,MAXPH,files,function(){ openP[p.id]=true; renderProducts(); touch(); },p.po,p.bg); }
function custPhotos(i,files){ var c=S.custom[i]; if(!c) return; if(!c.photos) c.photos=[]; addPhotos(c.photos,MAXCP,files,function(){ renderCustom(); touch(); }); }
function dropHandlers(list,attr,fn){
  list.addEventListener('dragover',function(e){ var d=e.target.closest('.drop'); if(d){ e.preventDefault(); d.classList.add('over'); } });
  list.addEventListener('dragleave',function(e){ var d=e.target.closest('.drop'); if(d) d.classList.remove('over'); });
  list.addEventListener('drop',function(e){ var d=e.target.closest('.drop'); if(!d) return; e.preventDefault(); d.classList.remove('over'); fn(+d.getAttribute(attr),e.dataTransfer.files); });
}
$('plist').addEventListener('change',function(e){
  var pi=e.target.getAttribute('data-ppdf');
  if(pi!=null){
    var pf=e.target.files&&e.target.files[0]; e.target.value=''; if(!pf) return;
    if(pf.size>8*1024*1024){ toast('PDF troppo grande (massimo 8 MB)'); return; }
    var fr=new FileReader(); fr.onload=function(){ var pr=S.products[+pi]; pr.pdf={name:pf.name,data:String(fr.result)}; if(pr.x) pr.x.pdf=false; openP[pr.id]=true; renderProducts(); renderInvio(); touch(); toast('Scheda PDF allegata'); }; fr.onerror=function(){ toast('Impossibile leggere il PDF'); }; fr.readAsDataURL(pf);
    return;
  }
  var i=e.target.getAttribute('data-pphoto'); if(i==null) return;
  var fl=Array.prototype.slice.call(e.target.files||[]); e.target.value=''; prodPhotos(+i,fl);
});
dropHandlers($('plist'),'data-drop',prodPhotos);
$('p-bulk').addEventListener('change',function(e){
  var files=Array.prototype.slice.call(e.target.files||[]); e.target.value='';
  var left=files.length; if(!left) return; var out=new Array(left);
  files.forEach(function(f,k){ readProdImg(f,1000,function(url,orig){
    out[k]={f:f,u:url,o:orig}; left--;
    if(left===0){
      var n=0;
      out.forEach(function(o){ if(!o||!o.u) return; var nm=o.f.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim();
        var p={id:uid(),name:nm,brand:'',code:'',desc:'',specs:'',link:'',tags:'',photos:[o.u],po:[o.o&&o.o!==o.u?o.o:'']}; S.products.push(p); openP[p.id]=true; n++; });
      renderProducts(); touch(); toast(n?('Create '+n+' schede dalle foto'):'Nessuna immagine valida');
    }
  }); });
});

/* pagine */
var PNAMES={cover:'Copertina',prodotti:'Prodotti e soluzioni',planimetria:'Planimetria con posizioni',azienda:'Chi siamo',crono:'Cronoprogramma',fv:'Stima fotovoltaico',prev:'Preventivo economico',fiducia:'Lavori, recensioni e contatti',cond:'Condizioni e accettazione',conferma:'Conferma d\'ordine',lavoro:'Ordine di lavoro',collaudo:'Verbale di collaudo'};
function pageName(id){ if(id.indexOf('c:')===0){ var c=findCustom(id.slice(2)); return (c&&c.title)||'Pagina libera'; } return PNAMES[id]; }
function pageOn(id){
  if(id.indexOf('c:')===0){ var c=findCustom(id.slice(2)); return !!c&&c.on!==false; }
  if(id==='prodotti') return !!S.style.showProdotti; if(id==='azienda') return !!S.style.showAzienda; return !!S.show[id];
}
function setPageOn(id,v){
  if(id.indexOf('c:')===0){ var c=findCustom(id.slice(2)); if(c) c.on=v; }
  else if(id==='prodotti') S.style.showProdotti=v; else if(id==='azienda') S.style.showAzienda=v; else S.show[id]=v;
}
function renderOrder(){
  $('order-list').innerHTML=S.layout.map(function(id,i){
    return '<div class="ord" draggable="true" data-oi="'+i+'"><span class="grab" aria-hidden="true">⠿</span>'+
      '<label class="chk"><input type="checkbox" data-oon="'+i+'"'+(pageOn(id)?' checked':'')+'><span>'+(i+1)+'. '+esc(pageName(id))+'</span></label><span class="sp"></span>'+
      '<button type="button" class="btn ghost sm" data-oup="'+i+'" aria-label="Sposta su"'+(i===0?' disabled':'')+'>▲</button>'+
      '<button type="button" class="btn ghost sm" data-odn="'+i+'" aria-label="Sposta giù"'+(i===S.layout.length-1?' disabled':'')+'>▼</button></div>';
  }).join('');
}
function moveLayout(from,to){ if(to<0||to>=S.layout.length||from===to) return; var it=S.layout.splice(from,1)[0]; S.layout.splice(to,0,it); renderOrder(); touch(); }
var dragFrom=-1;
$('order-list').addEventListener('click',function(e){
  var u=e.target.closest('[data-oup]'), d=e.target.closest('[data-odn]');
  if(u){ var i=+u.getAttribute('data-oup'); moveLayout(i,i-1); } else if(d){ var j=+d.getAttribute('data-odn'); moveLayout(j,j+1); }
});
$('order-list').addEventListener('change',function(e){
  var i=e.target.getAttribute('data-oon'); if(i==null) return;
  setPageOn(S.layout[+i],e.target.checked); renderContent(); renderCustom(); touch();
});
$('order-list').addEventListener('dragstart',function(e){ var r=e.target.closest('.ord'); if(!r) return; dragFrom=+r.getAttribute('data-oi'); try{ e.dataTransfer.setData('text/plain',String(dragFrom)); e.dataTransfer.effectAllowed='move'; }catch(x){} });
$('order-list').addEventListener('dragover',function(e){ var r=e.target.closest('.ord'); if(!r||dragFrom<0) return; e.preventDefault(); Array.prototype.forEach.call($('order-list').children,function(c){c.classList.remove('over');}); r.classList.add('over'); });
$('order-list').addEventListener('drop',function(e){ var r=e.target.closest('.ord'); if(!r||dragFrom<0) return; e.preventDefault(); var to=+r.getAttribute('data-oi'), from=dragFrom; dragFrom=-1; moveLayout(from,to); });
$('order-list').addEventListener('dragend',function(){ dragFrom=-1; Array.prototype.forEach.call($('order-list').children,function(c){c.classList.remove('over');}); });

var openC={};
function renderCustom(){
  if(!S.custom.length){ $('clist').innerHTML='<div class="empty">Nessuna pagina libera.</div>'; return; }
  $('clist').innerHTML=S.custom.map(function(c,i){
    var th=(c.photos||[]).map(function(u,j){ return '<div class="thumb"><img src="'+u+'" alt=""><button type="button" data-crph="'+i+':'+j+'" aria-label="Rimuovi foto">×</button></div>'; }).join('');
    return '<details class="pe" data-cid="'+esc(c.id)+'"'+(openC[c.id]?' open':'')+'><summary><span class="pn"'+(c.on===false?' style="opacity:.5"':'')+'>'+esc(c.title||'Pagina libera')+'</span>'+
      '<button type="button" class="btn x" data-crm="'+i+'" aria-label="Elimina pagina">×</button></summary><div class="pbody">'+
      '<label class="f">Titolo<input type="text" data-cf="title" data-ci="'+i+'" value="'+esc(c.title)+'"></label>'+
      '<label class="f">Testo<textarea data-cf="text" data-ci="'+i+'" style="min-height:100px">'+esc(c.text)+'</textarea></label>'+
      '<div class="thumbs">'+th+'</div>'+
      ((c.photos||[]).length<MAXCP?'<label class="drop" data-cdrop="'+i+'">Trascina qui le foto oppure tocca per caricarle ('+(c.photos||[]).length+'/'+MAXCP+')<input type="file" accept="image/*" multiple hidden data-cphoto="'+i+'"></label>':'<p class="hint">Massimo '+MAXCP+' foto per pagina.</p>')+
      '</div></details>';
  }).join('');
}
$('clist').addEventListener('toggle',function(e){ var d=e.target; if(d&&d.getAttribute&&d.getAttribute('data-cid')) openC[d.getAttribute('data-cid')]=d.open; },true);
$('clist').addEventListener('input',function(e){
  var f=e.target.getAttribute('data-cf'); if(!f) return;
  var c=S.custom[+e.target.getAttribute('data-ci')]; c[f]=e.target.value;
  if(f==='title'){ var pn=e.target.closest('.pe').querySelector('.pn'); if(pn) pn.textContent=e.target.value||'Pagina libera'; renderOrder(); }
  touch();
});
$('clist').addEventListener('click',function(e){
  var r=e.target.closest('[data-crph]');
  if(r){ var a=r.getAttribute('data-crph').split(':'); S.custom[+a[0]].photos.splice(+a[1],1); renderCustom(); touch(); return; }
  var d=e.target.closest('[data-crm]'); if(!d) return;
  e.preventDefault();
  var c=S.custom.splice(+d.getAttribute('data-crm'),1)[0];
  S.layout=fixLayout(S.layout,S.custom); renderCustom(); renderOrder(); touch();
});
$('clist').addEventListener('change',function(e){
  var i=e.target.getAttribute('data-cphoto'); if(i==null) return;
  var fl=Array.prototype.slice.call(e.target.files||[]); e.target.value=''; custPhotos(+i,fl);
});
dropHandlers($('clist'),'data-cdrop',custPhotos);
$('c-add').addEventListener('click',function(){
  var c={id:uid(),title:'Lavori realizzati',text:'',photos:[],on:true}; S.custom.push(c); openC[c.id]=true;
  var at=S.layout.indexOf('cond'); S.layout.splice(at<0?S.layout.length:at,0,'c:'+c.id);
  renderCustom(); renderOrder(); touch(); toast('Pagina libera aggiunta prima delle condizioni');
});
$('p-add').addEventListener('click',function(){
  var p={id:uid(),name:'',brand:'',code:'',desc:'',specs:'',link:'',tags:'',photos:[]}; S.products.push(p); openP[p.id]=true;
  renderProducts(); touch();
});
var SERVICE_U=/^(h|ore?|giornat[ae]|a corpo|corpo|pt|m|ml|mq|m2|forfait)$/i, SKIP_P=/posa e fissaggio|foratura|collegamento e configurazione|posa e collegamento|trasferta|smaltimento|materiale di consumo|maggiorazione|ricerca guasto|ripristino|manodopera|diritto di chiamata|dichiarazione|collaudo|pratiche|progett|verific|installazione|configurazione|programmazione|formazione|assistenza|documentazione|sintonizzazione|analisi|montaggio|manutenzione|ponteggio|tracce|smantellamento|sopralluogo/i;

