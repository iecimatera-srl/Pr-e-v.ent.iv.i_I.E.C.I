/* ---------- PDF e condivisione ---------- */
var pdfCache=null, shBusy=false;
function h2iLoad(){
  if(window.htmlToImage) return true;
  var el=$('h2i-lib'); if(!el) return false;
  try{ var sc=document.createElement('script'); sc.textContent=el.textContent; document.head.appendChild(sc); }catch(e){}
  return !!window.htmlToImage;
}
// librerie grandi incluse come testo: nell'app installata stanno in file a parte e si scaricano (una volta) solo quando servono
function libText(id){
  var el=document.getElementById(id); if(!el) return Promise.resolve('');
  var t=el.textContent; if(t&&t.trim()) return Promise.resolve(t);
  var src=el.getAttribute('data-src'); if(!src) return Promise.resolve('');
  return fetch(src).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.text(); }).catch(function(){ return ''; });
}
// pdf-lib si avvia solo la prima volta che serve un PDF
function pdfLibLoad(){ return typeof PDFLib!=='undefined'; }
function pdfLibReady(){
  if(typeof PDFLib!=='undefined') return Promise.resolve(true);
  return libText('pdflib-lib').then(function(t){ if(!t) return false; try{ var sc=document.createElement('script'); sc.textContent=t; document.head.appendChild(sc); var el=$('pdflib-lib'); if(el) el.textContent=''; }catch(e){} return typeof PDFLib!=='undefined'; });
}
function buildPdf(withAtt,prog){ return pdfLibReady().then(function(ok){ if(!ok) throw new Error('Creazione PDF non disponibile: controlla la connessione e riprova'); return buildPdf0(withAtt,prog); }); }
function buildPdf0(withAtt,prog){
  return new Promise(function(resolve,reject){
    if(!pdfLibLoad()) return reject(new Error('Creazione PDF non disponibile in questa versione'));
    if(!h2iLoad()) return reject(new Error('Motore immagini non disponibile'));
    var pages=Array.prototype.slice.call(document.querySelectorAll('#doc .page'));
    if(!pages.length) return reject(new Error('Nessuna pagina nel fascicolo: attiva almeno una sezione da Contenuto'));
    var d=$('doc'), z=d.style.zoom; d.style.zoom=1; d.classList.add('cattura');
    var D=PDFLib.PDFDocument, out, fontCss='', i=0, ok=false;
    function done(){ d.style.zoom=z; d.classList.remove('cattura'); try{ fit(); }catch(e){} }
    D.create().then(function(o){
      out=o; out.setTitle(fileBase()); out.setAuthor(S.company.name||''); out.setCreator('IECI preventivi');
      return window.htmlToImage.getFontEmbedCSS(pages[0]).catch(function(){ return ''; });
    }).then(function(css){
      fontCss=css||'';
      function opts(r){ var o={pixelRatio:r,quality:.9,backgroundColor:'#ffffff',cacheBust:false}; if(fontCss) o.fontEmbedCSS=fontCss; else o.skipFonts=true; return o; }
      function next(){
        if(i>=pages.length) return Promise.resolve();
        if(prog) prog('Preparo il PDF… pagina '+(i+1)+' di '+pages.length);
        var pg=pages[i];
        return window.htmlToImage.toJpeg(pg,opts(2)).catch(function(){ return window.htmlToImage.toJpeg(pg,opts(1.4)); }).then(function(u){
          var bytes=b64bytes(u); return out.embedJpg(bytes).then(function(img){
            var w=595.28, h=w*img.height/img.width, page=out.addPage([w,h]); page.drawImage(img,{x:0,y:0,width:w,height:h});
          });
        }).then(function(){ i++; return new Promise(function(r){ setTimeout(r,0); }).then(next); });
      }
      return next();
    }).then(function(){
      if(!withAtt) return;
      var list=pdfProducts(), ch=Promise.resolve();
      list.forEach(function(pp){ ch=ch.then(function(){ return D.load(b64bytes(pp.pdf.data),{ignoreEncryption:true}); }).then(function(dd){ return out.copyPages(dd,dd.getPageIndices()); }).then(function(ps){ ps.forEach(function(x){ out.addPage(x); }); }).catch(function(){}); });
      return ch;
    }).then(function(){ return out.save(); }).then(function(bytes){ done(); resolve(new Blob([bytes],{type:'application/pdf'})); })
    .catch(function(e){ done(); reject(e); });
  });
}
function shFile(){ return pdfCache&&pdfCache.blob?new File([pdfCache.blob],fileBase()+'.pdf',{type:'application/pdf'}):null; }
function shEnable(on){ ['sh-wa','sh-ml','sh-dl'].forEach(function(id){ $(id).disabled=!on; }); }
function shPrepare(){
  var att=$('sh-att').checked&&pdfProducts().length>0, key=docVer+'|'+(att?1:0);
  if(pdfCache&&pdfCache.key===key){ shReady(); return; }
  if(shBusy) return; shBusy=true; shEnable(false); pdfCache=null;
  $('sh-st').textContent='Preparo il PDF…'; $('sh-st').className='sh-st';
  buildPdf(att,function(t){ $('sh-st').textContent=t; }).then(function(b){ pdfCache={key:key,blob:b}; shBusy=false; shReady(); })
  .catch(function(e){ shBusy=false; $('sh-st').className='sh-st err'; $('sh-st').textContent='Non riesco a creare il PDF: '+(e&&e.message||e)+'. Puoi comunque usare «Solo testo» qui sotto.'; });
}
function shReady(){
  var mb=pdfCache.blob.size/1048576;
  $('sh-st').className='sh-st ok'; $('sh-st').textContent='PDF pronto · '+(mb<1?Math.round(pdfCache.blob.size/1024)+' KB':mb.toFixed(1).replace('.',',')+' MB');
  shEnable(true);
}
function shTxt(){ var t=$('sh-txt'); return t&&!$('sh-bg').hidden?t.value:fillMsg(S.msgs.wa); }
function shSubj(){ var t=$('sh-subj'); return t&&!$('sh-bg').hidden?t.value:fillMsg(S.msgs.subj); }
function shBody(){ var t=$('sh-body'); return t&&!$('sh-bg').hidden?t.value:fillMsg(S.msgs.body); }
function shLinks(){
  var txt=shTxt(), d=waDigits(S.client.tel);
  $('sh-wat').href='https://wa.me/'+d+'?text='+encodeURIComponent(txt);
  $('sh-mlt').href='mailto:'+encodeURIComponent(S.client.email||'').replace('%40','@')+'?subject='+encodeURIComponent(shSubj())+'&body='+encodeURIComponent(shBody());
}
function markSent(){ if((S.meta.status||'bozza')==='bozza'){ S.meta.status='inviato'; syncB(); touch(); if(dbReady) saveQuote(true); } }
// iPhone/iPad: se alla condivisione si passa anche il testo, Safari scarta il file (bug WebKit 251500).
// Lì si condivide solo il PDF e il messaggio va negli appunti, pronto come didascalia.
function shIOS(){ var u=navigator.userAgent||''; return /iP(hone|ad|od)/.test(u)||(/Macintosh/.test(u)&&(navigator.maxTouchPoints||0)>1); }
function shSend(kind){
  var f=shFile(); if(!f) return;
  var txt=shTxt(), subj=shSubj(), body=shBody(), msg=kind==='ml'?body:txt, ios=shIOS();
  var data={files:[f],title:kind==='ml'?subj:fileBase()};
  if(!ios) data.text=msg;
  function fallback(){
    dlBlob(pdfCache.blob,fileBase()+'.pdf');
    if(kind==='wa'){ window.open('https://wa.me/'+waDigits(S.client.tel)+'?text='+encodeURIComponent(txt),'_blank'); toast('Chat aperta con il messaggio · PDF salvato: trascinalo nella chat'); }
    else { window.location.href=$('sh-mlt').href; toast('Email pronta con il testo · PDF salvato: allegalo'); }
    markSent();
  }
  var ok=navigator.canShare&&navigator.share; try{ ok=ok&&navigator.canShare(data); }catch(e){ ok=false; }
  if(!ok&&data.text&&navigator.canShare&&navigator.share){ try{ if(navigator.canShare({files:[f]})){ delete data.text; ios=true; ok=true; } }catch(e){} }
  if(ok){
    // WhatsApp spesso scarta il testo quando riceve un PDF: il messaggio va sempre anche negli appunti
    // e, dopo l'invio del PDF, un tocco lo manda direttamente nella chat del cliente
    if(ios||kind==='wa') copySilent(msg);
    navigator.share(data).then(function(){ markSent();
      if(kind==='wa'){ shDopo(msg); toast('PDF inviato · ora tocca «Invia il messaggio» (è anche negli appunti)'); }
      else toast(ios?'PDF condiviso · il testo è negli appunti: incollalo nell\'email':'PDF e testo condivisi'); })
    .catch(function(e){ if(e&&e.name==='AbortError') return; fallback(); });
  } else fallback();
}
// passo 2 dopo il PDF: il messaggio nella chat del cliente, già scritto
function shDopo(msg){
  var el=$('sh-dopo'); if(!el) return; var d=waDigits(S.client.tel), nm=String(S.client.name||'').trim(), a=$('sh-wa2');
  a.href='https://wa.me/'+d+'?text='+encodeURIComponent(msg);
  a.textContent=d?'Invia il messaggio'+(nm?' a '+nm:' al cliente'):'Invia il messaggio (scegli il contatto)';
  $('sh-dopo-ok').hidden=true; el.hidden=false;
  try{ el.scrollIntoView({block:'nearest'}); }catch(e){}
}
function openShare(){
  if(S.qid===''&&dbReady&&(String(S.client.name||'').trim()||S.lines.length)) saveQuote(true);
  $('sh-doc').textContent=quoteName()+' · '+headTotal();
  var np=pdfProducts().length; $('sh-att-w').hidden=!np; $('sh-att').checked=np>0;
  if($('sh-dopo')) $('sh-dopo').hidden=true;
  $('sh-bg').hidden=false; shMsgFill(); shLinks(); ckShare(); document.body.style.overflow='hidden';
  setTimeout(shPrepare,50);
}
function closeShare(){ $('sh-bg').hidden=true; document.body.style.overflow=''; }
$('qb-share').addEventListener('click',openShare);
$('sh-x').addEventListener('click',closeShare);
$('sh-bg').addEventListener('click',function(e){ if(e.target===$('sh-bg')) closeShare(); });
document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!$('sh-bg').hidden) closeShare(); });
$('sh-att').addEventListener('change',shPrepare);
$('sh-wa').addEventListener('click',function(){ shSend('wa'); });
$('sh-wa2').addEventListener('click',function(){ $('sh-dopo-ok').hidden=false; });
$('sh-ml').addEventListener('click',function(){ shSend('ml'); });
$('sh-dl').addEventListener('click',function(){ if(pdfCache){ dlBlob(pdfCache.blob,fileBase()+'.pdf'); markSent(); toast('PDF salvato'); } });
$('sh-cp').addEventListener('click',function(){ copyText(shTxt(),'Messaggio copiato'); });
$('sh-wat').addEventListener('click',function(){ markSent(); }); $('sh-mlt').addEventListener('click',function(){ markSent(); });
function openSaved(){ showPanel('prev'); var a=$('acc-save'); if(a) a.open=true; setTimeout(function(){ var t=$('acc-save'); if(t) t.scrollIntoView({behavior:'smooth',block:'start'}); },60); }
$('qb-list').addEventListener('click',openSaved);
$('go-prev').addEventListener('click',openSaved);
document.addEventListener('click',function(e){
  var f=e.target.closest('[data-qf]'); if(f){ qFilt=f.getAttribute('data-qf'); renderArchivio(); return; }
  var c=e.target.closest('[data-qst]'); if(!c) return;
  var id=c.getAttribute('data-qst'), q=DB.quotes.filter(function(x){ return x.id===id; })[0]; if(!q) return;
  var nx=STN[(STN.indexOf(qSt(q))+1)%STN.length]; q.st=nx; if(q.data&&q.data.meta) q.data.meta.status=nx; q.upd=Date.now();
  if(S.qid===id){ S.meta.status=nx; syncB(); doSave(); } dbSave(); renderArchivio(); toast('Stato: '+STL[nx]);
});
$('q-more').addEventListener('click',function(){ qAll=!qAll; renderArchivio(); });
function inPreview(){ var w=$('paperWrap'); if(!w) return false; var r=w.getBoundingClientRect(); return r.top<window.innerHeight*0.45; }
function updView(){ var b=$('qb-view'); if(!b) return; b.textContent=inPreview()?'Modifica':'Anteprima'; }
$('qb-view').addEventListener('click',function(){
  if(inPreview()){ var t=$('ptabs'); if(t) t.scrollIntoView({behavior:'smooth',block:'start'}); }
  else { var w=$('paperWrap'); if(w) w.scrollIntoView({behavior:'smooth',block:'start'}); }
});
window.addEventListener('scroll',updView,{passive:true}); window.addEventListener('resize',updView);
var NAVIC={listini:'<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',salva:'<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>',app:'<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5"/>',
  dati:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  prev:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  contenuto:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  pagine:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  prodotti:'<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  piante:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  stime:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  fiducia:'<path d="M12 2l3 7 7 .6-5.3 4.7 1.7 7.2L12 17.8 5.6 21.5l1.7-7.2L2 9.6 9 9z"/>',
  cond:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  documenti:'<path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z"/><rect x="5" y="6" width="14" height="15" rx="2"/><path d="M9 14l2 2 4-4"/>',
  invio:'<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  archivio:'<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/>',
  fornitori:'<path d="M1 6h13v10H1zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  azienda:'<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
  stile:'<path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="1.8" fill="currentColor"/><circle cx="15" cy="12" r="1.8" fill="currentColor"/><circle cx="10" cy="18" r="1.8" fill="currentColor"/>'
};
function navIc(p){ return '<svg class="ni" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(NAVIC[p]||'<circle cx="12" cy="12" r="3"/>')+'</svg>'; }
function showPanel(p){
  panel=p; mnOpen=false;
  Array.prototype.forEach.call(document.querySelectorAll('[data-panel]'),function(s){ s.hidden=(s.getAttribute('data-panel')!==p); });
  renderNav(); if(p==='menu') renderMenuEd(); if(p==='app') apUI(); if(p==='salva') svDash(); if(p==='messaggi') renderMt(); if(p==='listini'){ lsModel=S.model; renderListini(); } if(p==='invio') ckRender(); if(p==='prodotti'&&PLAZY) renderProducts(); renderQbar();
}
$('ptabs').addEventListener('click',function(e){
  e.stopPropagation();
  var st=e.target.closest('[data-step]');
  if(st){ var f=menuFlat(), i=f.indexOf(panel), n=f.length; if(!n) return; showPanel(f[((i<0?0:i)+(+st.getAttribute('data-step'))+n)%n]); window.scrollTo(0,0); return; }
  if(e.target.closest('#mn-btn')){ mnOpen=!mnOpen; renderNav(); return; }
  var b=e.target.closest('[data-p]'); if(b) showPanel(b.getAttribute('data-p'));
});
document.addEventListener('click',function(e){ if(mnOpen&&!e.target.closest('#ptabs')){ mnOpen=false; renderNav(); } });
document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&mnOpen){ mnOpen=false; renderNav(); } });
function renderMenuEd(){
  var el=$('mn-list'); if(!el) return;
  Array.prototype.forEach.call(document.querySelectorAll('#mn-mode button'),function(b){ b.setAttribute('aria-pressed',String(b.getAttribute('data-mode')===MENU.mode)); });
  var last=MENU.groups.length-1;
  el.innerHTML=MENU.groups.map(function(g,gi){
    var its=MENU.items.filter(function(i){ return i.g===g.id; });
    return '<div class="mgc2" data-gid="'+g.id+'"><div class="mngrp"><textarea rows="1" class="t1 gn" data-gn="'+g.id+'" aria-label="Nome del gruppo" placeholder="Nome del gruppo">'+esc(g.n)+'</textarea><button type="button" class="sq" data-gm="'+g.id+':-1"'+(gi===0?' disabled':'')+' aria-label="Sposta il gruppo su">▲</button><button type="button" class="sq" data-gm="'+g.id+':1"'+(gi===last?' disabled':'')+' aria-label="Sposta il gruppo giù">▼</button>'+(MENU.groups.length>1?'<button type="button" class="sq x" data-gd="'+g.id+'" aria-label="Elimina il gruppo">✕</button>':'')+'</div><div class="mgc">'+
      its.map(function(i){
        var ren=!!(MENU.names[i.p]);
        return '<div class="mnrow'+(i.on?'':' off')+'" data-p="'+i.p+'"><span class="dh" aria-label="Trascina per spostare" title="Trascina">≡</span><textarea rows="1" class="t1 mnn" data-nm="'+i.p+'" placeholder="'+esc(secDef(i.p))+'" aria-label="Nome della sezione '+esc(secDef(i.p))+'">'+esc(secLabel(i.p))+'</textarea>'+
          '<label class="sw" title="Mostra nel menu"><input type="checkbox" data-mv="'+i.p+'"'+(i.on?' checked':'')+(i.p==='menu'?' disabled':'')+'><span></span></label>'+
          '<button type="button" class="sq" data-mm="'+i.p+':-1" aria-label="Su">▲</button><button type="button" class="sq" data-mm="'+i.p+':1" aria-label="Giù">▼</button></div>';
      }).join('')+'</div></div>';
  }).join('');
  var ups=el.querySelectorAll('[data-mm$=":-1"]'), dns=el.querySelectorAll('[data-mm$=":1"]'); if(ups.length) ups[0].disabled=true; if(dns.length) dns[dns.length-1].disabled=true;
}
function menuMoveItem(p,d){
  var a=MENU.items, i=a.map(function(x){ return x.p; }).indexOf(p), it=a[i], g=it.g, gi=MENU.groups.map(function(x){ return x.id; }).indexOf(g);
  for(var j=i+d;j>=0&&j<a.length;j+=d){ if(a[j].g===g){ a[i]=a[j]; a[j]=it; return; } }
  var ng=MENU.groups[gi+d]; if(!ng) return;
  a.splice(i,1); it.g=ng.id;
  if(d<0){ a.push(it); }
  else { var f=-1; for(var k=0;k<a.length;k++){ if(a[k].g===ng.id){ f=k; break; } } if(f<0) a.push(it); else a.splice(f,0,it); }
}
function menuChanged(re){ menuSave(); renderNav(); if(re) renderMenuEd(); }
$('mn-list').addEventListener('click',function(e){
  var t=e.target.closest('button'); if(!t) return;
  var mm=t.getAttribute('data-mm'), gm=t.getAttribute('data-gm'), gd=t.getAttribute('data-gd');
  if(mm){ var s=mm.split(':'); menuMoveItem(s[0],+s[1]); menuChanged(true); var r=$('mn-list').querySelector('.mnrow[data-p="'+s[0]+'"]'); if(r&&r.scrollIntoView) r.scrollIntoView({block:'nearest'}); }
  else if(gm){ var q=gm.split(':'), a=MENU.groups, i=a.map(function(x){ return x.id; }).indexOf(q[0]), j=i+(+q[1]); if(j>=0&&j<a.length){ var tmp=a[i]; a[i]=a[j]; a[j]=tmp; menuChanged(true); } }
  else if(gd){ if(MENU.groups.length<2) return; var gi=MENU.groups.map(function(x){ return x.id; }).indexOf(gd), rest=MENU.groups.filter(function(x){ return x.id!==gd; }), to=rest[Math.max(0,gi-1)]; MENU.items.forEach(function(i){ if(i.g===gd) i.g=to.id; }); MENU.groups=rest; menuChanged(true); toast('Gruppo eliminato: le sue sezioni sono in «'+to.n+'»'); }
});
$('mn-list').addEventListener('change',function(e){
  var v=e.target.getAttribute('data-mv'); if(v){ MENU.items.forEach(function(i){ if(i.p===v) i.on=e.target.checked; }); var r=e.target.closest('.mnrow'); if(r) r.classList.toggle('off',!e.target.checked); menuChanged(false); }
});
$('mn-list').addEventListener('focusout',function(e){ var t=e.target; if(t.classList&&t.classList.contains('mnn')&&!t.value.trim()) renderMenuEd(); });
$('mn-list').addEventListener('input',function(e){
  var t=e.target, gn=t.getAttribute('data-gn'), nm=t.getAttribute('data-nm');
  if(gn){ MENU.groups.forEach(function(g){ if(g.id===gn) g.n=t.value; }); menuSave(); renderNav(); }
  else if(nm){ var v=t.value.trim(); if(v&&v!==secDef(nm)) MENU.names[nm]=v; else delete MENU.names[nm]; menuSave(); renderNav(); }
});
/* trascinamento (mouse e dito) */
var DRG=null;
$('mn-list').addEventListener('pointerdown',function(e){
  var h=e.target.closest('.dh'); if(!h) return; var row=h.closest('.mnrow'); e.preventDefault();
  DRG={row:row,p:row.getAttribute('data-p')}; row.classList.add('drag'); document.body.style.userSelect='none';
  document.addEventListener('pointermove',dragMove); document.addEventListener('pointerup',dragEnd); document.addEventListener('pointercancel',dragEnd);
});
function dragMove(e){
  if(!DRG) return; e.preventDefault();
  var list=$('mn-list'), r=list.getBoundingClientRect();
  if(e.clientY<r.top+30) window.scrollBy(0,-14); else if(e.clientY>window.innerHeight-60) window.scrollBy(0,14);
  var under=document.elementFromPoint(e.clientX,e.clientY), card=under&&under.closest&&under.closest('.mgc2'); if(!card||!list.contains(card)) return;
  var box=card.querySelector('.mgc'), rows=Array.prototype.filter.call(box.children,function(x){ return x!==DRG.row; }), before=null;
  for(var i=0;i<rows.length;i++){ var b=rows[i].getBoundingClientRect(); if(e.clientY<b.top+b.height/2){ before=rows[i]; break; } }
  if(before){ if(DRG.row.nextSibling!==before) box.insertBefore(DRG.row,before); } else if(box.lastChild!==DRG.row) box.appendChild(DRG.row);
}
function dragEnd(){
  document.removeEventListener('pointermove',dragMove); document.removeEventListener('pointerup',dragEnd); document.removeEventListener('pointercancel',dragEnd);
  document.body.style.userSelect=''; if(!DRG) return; DRG=null;
  var byP={}; MENU.items.forEach(function(i){ byP[i.p]=i; }); var items=[], groups=[], gby={}; MENU.groups.forEach(function(g){ gby[g.id]=g; });
  Array.prototype.forEach.call($('mn-list').querySelectorAll('.mgc2'),function(c){ var gid=c.getAttribute('data-gid'); groups.push(gby[gid]); Array.prototype.forEach.call(c.querySelectorAll('.mnrow'),function(r){ var it=byP[r.getAttribute('data-p')]; it.g=gid; items.push(it); }); });
  MENU.items=items; MENU.groups=groups; menuChanged(true);
}
$('mn-mode').addEventListener('click',function(e){ var b=e.target.closest('[data-mode]'); if(!b) return; MENU.mode=b.getAttribute('data-mode'); menuChanged(true); });
$('mn-add').addEventListener('click',function(){ MENU.groups.push({id:'g'+Date.now().toString(36),n:'Nuovo gruppo'}); menuChanged(true); var inp=$('mn-list').querySelector('.mgc2:last-child .gn'); if(inp){ inp.focus(); inp.select(); inp.scrollIntoView({block:'center'}); } });
$('mn-reset').addEventListener('click',function(){ if(!confirm('Ripristinare ordine, gruppi e nomi originali?')) return; MENU=menuDefault(); menuChanged(true); toast('Menu ripristinato'); });
$('mn-presets').addEventListener('click',function(e){
  var b=e.target.closest('[data-preset]'); if(!b) return; var k=b.getAttribute('data-preset'), keep=MENU.names, mode=MENU.mode; MENU=menuDefault(); MENU.names=keep; MENU.mode=mode;
  if(k==='ess'){ var vis={dati:1,prev:1,prodotti:1,fornitori:1,archivio:1,cond:1,invio:1,salva:1,menu:1}; MENU.items.forEach(function(i){ i.on=!!vis[i.p]; }); }
  if(k==='uno'){ MENU.groups=[{id:'g1',n:'Menu'}]; MENU.items.forEach(function(i){ i.g='g1'; }); var o=['dati','prev','contenuto','pagine','prodotti','fornitori','archivio','piante','stime','fiducia','cond','documenti','invio','azienda','stile','salva','app','menu'], by={}; MENU.items.forEach(function(i){ by[i.p]=i; }); MENU.items=o.map(function(p){ return by[p]; }); }
  menuChanged(true); toast(k==='ess'?'Solo le sezioni essenziali (le altre sono nascoste, le riattivi con l\'interruttore)':k==='uno'?'Un solo elenco':'Menu standard');
});


