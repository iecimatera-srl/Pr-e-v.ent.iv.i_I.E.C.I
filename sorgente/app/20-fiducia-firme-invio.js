/* ---------- fiducia ---------- */
function photoBox(src,attr,label){
  return '<div class="thumb" style="width:120px;height:90px">'+(src?'<img src="'+src+'" alt="">':'')+'</div>'+
    '<label class="btn ghost sm">'+label+'<input type="file" accept="image/*" hidden '+attr+'></label>';
}
function renderTrust(){
  var T=S.trust;
  $('tr-ba').innerHTML=T.ba.map(function(b,i){
    return '<div class="rowc"><label class="f">Titolo (facoltativo)<textarea rows="1" class="t1" data-tf="ba:'+i+':title">'+esc(b.title)+'</textarea></label>'+
      '<div class="row">'+photoBox(b.before,'data-bap="'+i+':before"','Foto prima')+'</div><div class="row">'+photoBox(b.after,'data-bap="'+i+':after"','Foto dopo')+'</div>'+
      '<button type="button" class="btn x" data-bard="'+i+'" aria-label="Rimuovi">×</button></div>';
  }).join('')||'<div class="empty">Nessuna coppia di foto.</div>';
  if(!T.works) T.works=[];
  $('tr-works').innerHTML=T.works.map(function(w,i){
    return '<div class="rowc"><div class="thumb" style="width:96px;height:72px"><img src="'+w.img+'" alt=""></div><label class="f" style="flex:1 1 160px">Didascalia<input type="text" data-tf="works:'+i+':cap" value="'+esc(w.cap)+'"></label>'+
      '<button type="button" class="btn x" data-wkd="'+i+'" aria-label="Rimuovi">×</button></div>';
  }).join('')||'<div class="empty">Nessuna foto di lavori.</div>';
  $('tr-rev').innerHTML=T.rev.map(function(r,i){
    return '<div class="rowc"><label class="f">Nome<input type="text" data-tf="rev:'+i+':name" value="'+esc(r.name)+'"></label>'+
      '<label class="f" style="flex:0 1 90px">Stelle<select data-tf="rev:'+i+':stars">'+[5,4,3,2,1,0].map(function(s){ return '<option value="'+s+'"'+(+r.stars===s?' selected':'')+'>'+s+'</option>'; }).join('')+'</select></label>'+
      '<label class="f" style="flex:1 1 100%">Testo<textarea data-tf="rev:'+i+':text">'+esc(r.text)+'</textarea></label>'+
      '<div style="flex:1 1 100%;display:flex;gap:10px;align-items:center;flex-wrap:wrap">'+(r.img?'<div class="thumb" style="width:96px;height:72px"><img src="'+r.img+'" alt=""></div>':'')+
      '<label class="btn ghost sm">'+(r.img?'Cambia foto':'+ Foto del lavoro eseguito')+'<input type="file" accept="image/*" hidden data-rvp="'+i+'"></label>'+
      (r.img?'<button type="button" class="btn ghost sm" data-rvpx="'+i+'">Togli foto</button><label class="f" style="flex:0 1 150px">Dimensione foto<select data-tf="rev:'+i+':size">'+[['s','Piccola'],['m','Media'],['l','Grande, a tutta larghezza']].map(function(o){ return '<option value="'+o[0]+'"'+(((r.size||'m')===o[0])?' selected':'')+'>'+o[1]+'</option>'; }).join('')+'</select></label>':'')+'</div>'+
      '<button type="button" class="btn x" data-revd="'+i+'" aria-label="Rimuovi">×</button></div>';
  }).join('')||'<div class="empty">Nessuna recensione.</div>';
  var BGs=T.bgroups||(T.bgroups=[]);
  $('tr-brand').innerHTML=BGs.map(function(g,gi){
    return '<div class="bgx" data-bg="'+gi+'"><div class="mngrp"><textarea rows="1" class="t1 gn" data-bgt="'+gi+'" aria-label="Titolo della riga" placeholder="Titolo (es. Domotica)">'+esc(g.t)+'</textarea><button type="button" class="sq" data-bgm="'+gi+':-1"'+(gi===0?' disabled':'')+' aria-label="Sposta su">▲</button><button type="button" class="sq" data-bgm="'+gi+':1"'+(gi===BGs.length-1?' disabled':'')+' aria-label="Sposta giù">▼</button><button type="button" class="sq" data-bgd="'+gi+'" aria-label="Elimina la riga">×</button></div>'+
      '<div class="thumbs">'+(g.items.map(function(b,j){ return '<div class="thumb logo" title="'+esc(b.name)+'"><img src="'+b.img+'" alt=""><button type="button" data-brd="'+gi+':'+j+'" aria-label="Rimuovi">×</button></div>'; }).join('')||'<div class="empty" style="width:100%">Nessun logo in questa riga.</div>')+'</div>'+
      '<div class="iw-q"><input type="text" data-bgn="'+gi+'" placeholder="Scrivi le marche: Bticino, Vimar…" aria-label="Marche da aggiungere" autocomplete="off" enterkeyhint="go"><button type="button" class="btn ghost sm" data-bgw="'+gi+'">Aggiungi i loghi</button></div>'+
      '<div class="row"><label class="btn ghost sm">+ Carica loghi dal dispositivo<input type="file" accept="image/*" multiple hidden data-bgf="'+gi+'"></label></div></div>';
  }).join('')+'<datalist id="bg-sug"><option value="Domotica"><option value="Videosorveglianza"><option value="Civile"><option value="Industriale"><option value="Fotovoltaico"><option value="Automazioni"><option value="Videocitofonia"><option value="Illuminazione"></datalist>';
}
$('ba-add').addEventListener('click',function(){ if(S.trust.ba.length>=4){ toast('Massimo 4 coppie'); return; } S.trust.ba.push({title:'',before:'',after:''}); renderTrust(); touch(); });
$('rev-add').addEventListener('click',function(){ if(S.trust.rev.length>=6){ toast('Massimo 6 recensioni'); return; } S.trust.rev.push({name:'',stars:5,text:''}); renderTrust(); touch(); });
$('tr-ba').addEventListener('click',function(e){ var d=e.target.closest('[data-bard]'); if(d){ S.trust.ba.splice(+d.getAttribute('data-bard'),1); renderTrust(); touch(); } });
$('tr-rev').addEventListener('click',function(e){ var d=e.target.closest('[data-revd]'); if(d){ S.trust.rev.splice(+d.getAttribute('data-revd'),1); renderTrust(); touch(); return; } var x=e.target.closest('[data-rvpx]'); if(x){ var r=S.trust.rev[+x.getAttribute('data-rvpx')]; if(r){ r.img=''; renderTrust(); touch(); } } });
$('tr-rev').addEventListener('change',function(e){ var t=e.target, v=t.getAttribute&&t.getAttribute('data-rvp'); if(v==null) return; var f=t.files&&t.files[0]; t.value=''; if(!f) return; readImage(f,1000,false,function(url){ if(!url) return; var r=S.trust.rev[+v]; if(!r) return; r.img=url; if(!r.size) r.size='m'; renderTrust(); touch(); }); });
$('tr-works').addEventListener('click',function(e){ var d=e.target.closest('[data-wkd]'); if(d){ S.trust.works.splice(+d.getAttribute('data-wkd'),1); renderTrust(); touch(); } });
$('tr-works').addEventListener('input',function(e){ var t=e.target, f=t.getAttribute('data-tf'); if(!f) return; var a=f.split(':'); S.trust.works[+a[1]][a[2]]=t.value; touch(); });
$('wk-file').addEventListener('change',function(e){
  if(!S.trust.works) S.trust.works=[];
  var files=Array.prototype.slice.call(e.target.files||[]).slice(0,Math.max(0,9-S.trust.works.length)); e.target.value='';
  if(!files.length){ toast('Massimo 9 foto'); return; }
  var left=files.length, out=new Array(left);
  files.forEach(function(f,k){ readImage(f,1000,false,function(url){ out[k]=url?{img:url,cap:''}:null; left--; if(!left){ out.forEach(function(o){ if(o) S.trust.works.push(o); }); renderTrust(); touch(); } }); });
});
$('tr-brand').addEventListener('click',function(e){
  var T=S.trust, d=e.target.closest('[data-brd]');
  if(d){ var a=d.getAttribute('data-brd').split(':'); T.bgroups[+a[0]].items.splice(+a[1],1); renderTrust(); touch(); return; }
  var m=e.target.closest('[data-bgm]'); if(m){ var q=m.getAttribute('data-bgm').split(':'), i=+q[0], j=i+(+q[1]); if(j>=0&&j<T.bgroups.length){ var tmp=T.bgroups[i]; T.bgroups[i]=T.bgroups[j]; T.bgroups[j]=tmp; renderTrust(); touch(); } return; }
  var x=e.target.closest('[data-bgd]'); if(x){ var gi=+x.getAttribute('data-bgd'), g=T.bgroups[gi]; if(g.items.length&&!confirm('Eliminare la riga «'+(g.t||'senza titolo')+'» e i suoi loghi?')) return; T.bgroups.splice(gi,1); renderTrust(); touch(); }
});
$('tr-brand').addEventListener('input',function(e){ var t=e.target, v=t.getAttribute('data-bgt'); if(v==null) return; S.trust.bgroups[+v].t=t.value; touch(); });
$('tr-brand').addEventListener('change',function(e){
  var t=e.target, v=t.getAttribute&&t.getAttribute('data-bgf'); if(v==null) return;
  var g=S.trust.bgroups[+v], files=Array.prototype.slice.call(t.files||[]).slice(0,Math.max(0,10-g.items.length)); t.value='';
  if(!files.length){ toast('Massimo 10 loghi per riga'); return; }
  var left=files.length, out=new Array(left);
  files.forEach(function(f,k){ readImage(f,360,true,function(url){ out[k]=url?{name:f.name.replace(/\.[^.]+$/,''),img:url}:null; left--; if(!left){ out.forEach(function(o){ if(o) g.items.push(o); }); renderTrust(); touch(); } }); });
});
$('bg-add').addEventListener('click',function(){ if(S.trust.bgroups.length>=8){ toast('Massimo 8 righe'); return; } S.trust.bgroups.push({id:'bg'+Date.now().toString(36),t:'',items:[]}); renderTrust(); touch(); var i=$('tr-brand').querySelector('.bgx:last-child .gn'); if(i){ i.focus(); i.scrollIntoView({block:'center'}); } });
function tfHandler(e){
  var t=e.target, f=t.getAttribute('data-tf'); if(!f) return;
  var a=f.split(':'); S.trust[a[0]][+a[1]][a[2]]=t.value; touch();
}
$('tr-ba').addEventListener('input',tfHandler); $('tr-rev').addEventListener('input',tfHandler); $('tr-rev').addEventListener('change',tfHandler);
$('tr-ba').addEventListener('change',function(e){
  var t=e.target, v=t.getAttribute('data-bap'); if(!v) return;
  var a=v.split(':'), f=t.files&&t.files[0]; t.value=''; if(!f) return;
  readImage(f,900,false,function(url){ if(!url) return; S.trust.ba[+a[0]][a[1]]=url; renderTrust(); touch(); });
});
/* ---------- icone social ---------- */
var ICONKEYS=[['wa','WhatsApp'],['web','Sito web'],['fb','Facebook'],['ig','Instagram'],['mail','Email']];
function renderIcons(){
  var el=$('ico-list'); if(!el) return; var I=S.company.icons||{};
  el.innerHTML=ICONKEYS.map(function(k){
    var u=I[k[0]];
    return '<div class="rowc"><div class="thumb logo" style="width:56px;height:44px">'+(u?'<img src="'+u+'" alt="">':'<span style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;color:#5d646c"><span style="width:24px;height:24px;display:block">'+ICO[k[0]]+'</span></span>')+'</div>'+
      '<b style="flex:1 1 90px">'+k[1]+'</b><label class="btn ghost sm">'+(u?'Sostituisci':'Carica icona')+'<input type="file" accept="image/*,.svg" hidden data-icf="'+k[0]+'"></label>'+(u?'<button type="button" class="btn x" data-icx="'+k[0]+'" aria-label="Rimuovi icona">×</button>':'')+'</div>';
  }).join('');
}
$('ico-list').addEventListener('change',function(e){
  var k=e.target.getAttribute('data-icf'), f=e.target.files&&e.target.files[0]; if(!k) return; e.target.value=''; if(!f) return;
  readImage(f,200,true,function(url){ if(!url){ toast('Immagine non valida'); return; } if(!S.company.icons) S.company.icons={}; S.company.icons[k]=url; renderIcons(); touch(); });
});
$('ico-list').addEventListener('click',function(e){ var b=e.target.closest('[data-icx]'); if(!b) return; delete S.company.icons[b.getAttribute('data-icx')]; renderIcons(); touch(); });
/* ---------- firme ---------- */
var SIGS=['cli','dit'];
function sigDraw(k){
  var cv=$('sig-'+k), x=cv.getContext('2d'); x.clearRect(0,0,800,200);
  var u=S.sign[k].img; if(u){ var im=new Image(); im.onload=function(){ x.drawImage(im,0,0,800,200); }; im.src=u; }
}
SIGS.forEach(function(k){
  var cv=$('sig-'+k), x=cv.getContext('2d'), dn=false, lx=0, ly=0;
  function pt(e){ var r=cv.getBoundingClientRect(); return [(e.clientX-r.left)*800/r.width,(e.clientY-r.top)*200/r.height]; }
  cv.addEventListener('pointerdown',function(e){
    e.preventDefault(); dn=true; try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    var p=pt(e); lx=p[0]; ly=p[1]; x.lineWidth=3.2; x.lineCap='round'; x.lineJoin='round'; x.strokeStyle='#111'; x.beginPath(); x.moveTo(lx,ly); x.lineTo(lx+0.1,ly+0.1); x.stroke();
  });
  cv.addEventListener('pointermove',function(e){ if(!dn) return; var p=pt(e); x.beginPath(); x.moveTo(lx,ly); x.lineTo(p[0],p[1]); x.stroke(); lx=p[0]; ly=p[1]; });
  function end(){
    if(!dn) return; dn=false; S.sign[k].img=cv.toDataURL('image/png');
    if(k==='cli'&&!S.sign.cli.date){ S.sign.cli.date=today(); syncB(); }
    touch();
  }
  cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',end);
});
document.addEventListener('click',function(e){ var b=e.target.closest('[data-sigclr]'); if(!b) return; var k=b.getAttribute('data-sigclr'); S.sign[k].img=''; sigDraw(k); touch(); });
/* ---------- invio ---------- */
function renderInvio(){
  if(!$('msg-prev')) return;
  var txt=fillMsg(S.msgs.wa); $('msg-prev').textContent=txt;
  var d=waDigits(S.client.tel);
  $('i-wa').href='https://wa.me/'+d+'?text='+encodeURIComponent(txt);
  $('i-mail').href='mailto:'+encodeURIComponent(S.client.email||'').replace('%40','@')+'?subject='+encodeURIComponent(fillMsg(S.msgs.subj))+'&body='+encodeURIComponent(fillMsg(S.msgs.body));
  ckRender();
  var n=pdfProducts().length, pc=$('pdf-count'); if(pc) pc.textContent=n?('Schede PDF che verranno accodate: '+n+'.'):'Nessuna scheda PDF allegata ai prodotti (si allegano dalla scheda Prodotti).';
}
function renderTpl(){ $('msg-tpl').innerHTML=S.mtpl.map(function(t){ return '<option value="'+esc(t.id)+'">'+esc(t.n||'Senza nome')+(t.id===S.mdef?' (predefinito)':'')+'</option>'; }).join('')+(mtById(S.msgs.tpl)?'':'<option value="">Messaggio modificato</option>'); $('msg-tpl').value=mtById(S.msgs.tpl)?S.msgs.tpl:''; }
$('msg-tpl').addEventListener('change',function(e){ var t=mtById(e.target.value); if(!t) return; S.msgs={tpl:t.id,wa:t.wa,subj:t.subj,body:t.body}; syncB(); renderInvio(); touch(); });
$('i-copy').addEventListener('click',function(){ copyText(fillMsg(S.msgs.wa),'Messaggio copiato'); });
/* ---------- PDF: schede tecniche e unione ---------- */
function pdfProducts(){ return S.style.attachPdf?S.products.filter(function(p){ return p.on!==false&&p.pdf&&p.pdf.data&&!(p.x&&p.x.pdf); }):[]; }
function b64bytes(u){ var b=atob(u.split(',')[1]), a=new Uint8Array(b.length), i; for(i=0;i<b.length;i++) a[i]=b.charCodeAt(i); return a; }
function dlBlob(blob,name){ var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.parentNode&&a.parentNode.removeChild(a); },2000); }
function mergePdf(mainFile){ pdfLibReady().then(function(ok){ if(!ok){ toast('Unione PDF non disponibile: controlla la connessione e riprova'); return; } mergePdf0(mainFile); }); }
function mergePdf0(mainFile){
  var list=pdfProducts(); if(!list.length&&!mainFile){ toast('Nessuna scheda PDF da accodare'); return; }
  var D=PDFLib.PDFDocument;
  D.create().then(function(out){
    var ch=Promise.resolve();
    function add(bytes){ return D.load(bytes,{ignoreEncryption:true}).then(function(d){ return out.copyPages(d,d.getPageIndices()); }).then(function(ps){ ps.forEach(function(p){ out.addPage(p); }); }); }
    if(mainFile) ch=ch.then(function(){ return mainFile.arrayBuffer(); }).then(add);
    list.forEach(function(p){ ch=ch.then(function(){ return add(b64bytes(p.pdf.data)); }); });
    return ch.then(function(){ return out.save(); });
  }).then(function(bytes){
    dlBlob(new Blob([bytes],{type:'application/pdf'}),fileBase().replace(/ /g,'-')+(mainFile?'':'-schede')+'.pdf'); toast('PDF creato');
  }).catch(function(){ toast('Impossibile unire: controlla che i PDF non siano protetti da password'); });
}
$('pdf-main').addEventListener('change',function(e){ var f=e.target.files&&e.target.files[0]; e.target.value=''; if(f) mergePdf(f); });
$('pdf-only').addEventListener('click',function(){ mergePdf(null); });
if(!CAN_PRINT){ $('pdf-box').innerHTML='<p class="hint">L\'unione dei PDF funziona nel file .html scaricato, nel programma Windows e nell\'app Android, non in questa anteprima.</p>'; }

