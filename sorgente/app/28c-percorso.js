/* ===== Percorso del preventivo: Cliente → Voci → Prezzo → Invio, con il prossimo passo sempre in vista =====
   più: riquadri aperti solo quando servono, riassunti nei titoli, barra del preventivo che si fa sottile scorrendo */
function tipoIc(k){
  var P={
    dom:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M12.6 11.5 10.5 15h3l-2.1 3.5"/>',
    app:'<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
    rip:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8V20h3.2l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    luce:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.3 1 2.2h5.2c0-.9.4-1.7 1-2.2A6 6 0 0 0 12 3z"/>',
    vid:'<path d="M3 7h11l3 3-3 3H3z"/><path d="M8 13v4M5 21h6M17 10h4"/>',
    vcit:'<rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="9" r="2.5"/><path d="M9.5 15h5M10.5 18h3"/>',
    aut:'<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-9h10v9M7 15h10M7 18h10"/>',
    all:'<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/><path d="M12 9v4M12 16h.01"/>',
    fv:'<path d="M4 15 7 5h10l3 10z"/><path d="M5.5 10h13M10 5l-1 10M14 5l1 10M12 15v5M9 20h6"/>',
    wb:'<rect x="5" y="3" width="9" height="18" rx="2"/><path d="M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-2-2"/><path d="M10.2 8.5 8.5 12h2.5l-1.7 3.5"/>',
    tv:'<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 3l4 4 4-4"/>',
    ind:'<path d="M3 21V10l5 3V10l5 3V10l5 3V4h3v17z"/><path d="M7 17h2M12 17h2"/>',
    sw:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M9 8l-2 2 2 2M15 8l2 2-2 2"/>'
  };
  return '<svg class="ti" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(P[k]||P.dom)+'</svg>';
}
var FLOW={key:null};
function flowLines(){ return S.lines.filter(function(l){ return !l.vm&&!l.off; }); }
function flowState(){
  var nm=String(S.client.name||'').trim(), tel=String(S.client.tel||'').trim()||String(S.client.email||'').trim();
  var L=flowLines(), zero=FREE()?0:L.filter(function(l){ return !l.opt&&num(l.p)<=0; }).length, vuote=L.filter(function(l){ return !String(l.d||'').trim(); }).length;
  var ck=[]; try{ ck=ckList(); }catch(e){}
  var totErr=ck.some(function(x){ return x.a==='tot'; }), tt=headTotal(), tnum=0;
  try{ if(S.tiers.on){ for(var k=0;k<tierN();k++) tnum=Math.max(tnum,totals(k).tot||0); } else tnum=totals().tot; }catch(e){ tnum=0; }
  var st=S.meta.status||'bozza';
  var s=[
    {k:'cli',l:'Cliente',ok:!!nm,w:!!nm&&!tel,sub:nm?(tel?nm:'senza tel.'):'manca il nome'},
    {k:'voci',l:'Voci',ok:L.length>0&&!zero&&!vuote,w:L.length>0&&(zero>0||vuote>0),sub:L.length?(zero?zero+(zero===1?' senza prezzo':' senza prezzo'):(vuote?vuote+' senza nome':L.length+(L.length===1?' voce':' voci'))):'nessuna voce'},
    {k:'prezzo',l:'Prezzo',ok:tnum>0&&!totErr,w:false,sub:tnum>0&&!totErr?tt:'da fare'},
    {k:'invio',l:st==='accettato'?'Accettato':st==='rifiutato'?'Rifiutato':'Invio',ok:st==='inviato'||st==='accettato',w:st==='rifiutato',sub:st==='inviato'?'inviato':st==='accettato'?'lavoro confermato':st==='rifiutato'?'non accettato':'da inviare'}
  ];
  var cur=-1; for(var i=0;i<3;i++) if(!s[i].ok){ cur=i; break; } if(cur<0) cur=3;
  return {s:s,cur:cur,nm:nm,zero:zero,vuote:vuote,n:L.length,st:st,totErr:totErr};
}
function flowNext(F){
  var nm=F.nm?esc(F.nm.split(/\s+/)[0]):'il cliente', a=function(id,t,cl){ return '<button type="button" class="btn '+(cl||'')+'" data-fla="'+id+'">'+t+'</button>'; };
  if(F.cur===0) return {t:'Per cominciare, <b>a chi</b> fai il preventivo?',b:a('cli','Scrivi il cliente')};
  if(F.cur===1){
    if(!F.n) return {t:'Ora le <b>voci</b>: prendile dal listino oppure descrivi il lavoro e le preparo io.',b:a('list','Dal listino')+a('as','Descrivi il lavoro','ghost')};
    if(F.zero) return {t:'<b>'+F.zero+(F.zero===1?' voce è':' voci sono')+' senza prezzo.</b> Scrivilo, o togli la voce.',b:a('zero','Mostrami quali')};
    return {t:'<b>'+F.vuote+(F.vuote===1?' voce non ha':' voci non hanno')+' la descrizione.</b>',b:a('vuote','Mostrami quali')};
  }
  if(F.cur===2) return {t:F.totErr?'<b>Il totale è a zero:</b> scrivi il prezzo concordato.':'Controlla <b>prezzo, IVA e sconto</b>.',b:a('prezzo','Apri il prezzo')};
  if(F.st==='inviato') return {t:'<b>Inviato.</b> Quando '+nm+' risponde, segna com\'è andata.',b:a('ok','Accettato','ok')+a('no','Rifiutato','ghost')};
  if(F.st==='accettato') return {t:'<b>Lavoro confermato.</b> Ottimo! Il preventivo resta in archivio.',b:a('new','Nuovo preventivo','ghost')};
  if(F.st==='rifiutato') return {t:'Non accettato: puoi rivederlo e mandare una nuova proposta.',b:a('send','Invia di nuovo','ghost')};
  return {t:'<b>Tutto pronto.</b> Manda il preventivo a '+nm+'.',b:a('send','Invia il preventivo','go')};
}
function renderFlow(){
  if(typeof FLOW==='undefined'||!FLOW) return;
  var el=$('flow'); if(!el||!S||!S.client) return;
  var F=flowState(), N=flowNext(F), done=F.s.filter(function(x){ return x.ok; }).length;
  var ck='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  var h='<ol class="fl-s" style="--fl:'+(done/4)+'">'+F.s.map(function(x,i){
    var c=x.ok?(x.w?'ok warn':'ok'):(x.w?'warn':'todo'); if(i===F.cur&&!(i===3&&x.ok)) c+=' cur';
    return '<li><button type="button" class="fl-b '+c+'" data-flg="'+x.k+'" aria-label="'+esc(x.l+': '+x.sub)+'"><i>'+(x.ok?ck:(i+1))+'</i><b>'+esc(x.l)+'</b><small>'+esc(x.sub)+'</small></button></li>';
  }).join('')+'</ol>';
  h+='<div class="fl-n"><p>'+N.t+'</p><div class="fl-a">'+N.b+'</div></div>';
  if(el.getAttribute('data-h')!==h){ el.innerHTML=h; el.setAttribute('data-h',h); }
  // riassunti nei titoli dei riquadri
  var pn=$('acc-prezzo-n'); if(pn) pn.textContent=F.n?headTotal():'';
  var ln=$('acc-list-n'); if(ln){ var c=(S.cat&&S.cat[S.model]||[]).length; ln.textContent=c?c+' voci':''; }
  var bn=$('acc-br-n'); if(bn) bn.textContent=brOn()?'attive':'';
  var tn=$('acc-tier-n'); if(tn) tn.textContent=S.tiers.on&&!brOn()?'attiva':'';
  // preventivo appena aperto o nuovo: aperto solo quello che serve
  var key=(S.qid||'')+'|'+S.meta.num;
  if(FLOW.key!==key){ FLOW.key=key; accInit(); }
}
function accInit(){
  // non chiudo il riquadro che si sta usando (per esempio l'assistente che ha appena preparato il preventivo)
  var has=flowLines().length>0, ae=document.activeElement, o=function(id,v){ var d=$(id); if(!d) return; if(!v&&d.open&&((ae&&d.contains(ae))||(id==='acc-as'&&String(($('as-out')||{}).innerHTML||'').trim()))) return; d.open=v; };
  o('acc-as',!has); o('acc-list',!has); o('acc-righe',true); o('acc-prezzo',false);
  o('acc-br',brOn()); o('acc-tier',S.tiers.on&&!brOn()); o('acc-forn',false); o('acc-save',false);
}
function flowGo(sel,open){ showPanel('prev'); var d=$(open); if(d) d.open=true; setTimeout(function(){ var e=document.querySelector(sel)||d; if(!e) return; try{ e.scrollIntoView({behavior:'smooth',block:'start'}); }catch(x){} if(/INPUT|TEXTAREA/.test(e.tagName)) try{ e.focus({preventScroll:true}); }catch(x){} },60); }
function flowStatus(v){ S.meta.status=v; syncB(); touch(); if(dbReady&&(S.qid||S.lines.length)) saveQuote(true); renderFlow(); toast(v==='accettato'?'Segnato come accettato':'Segnato come rifiutato'); }
$('flow').addEventListener('click',function(e){
  var g=e.target.closest('[data-flg]'), a=e.target.closest('[data-fla]'); if(!g&&!a) return;
  var k=g?g.getAttribute('data-flg'):a.getAttribute('data-fla');
  if(k==='cli') ckGo('#k-name','dati');
  else if(k==='voci'){ var F=flowState(); if(!F.n) flowGo('#acc-list','acc-list'); else if(F.zero) ckDo({a:'zero'}); else flowGo('#acc-righe','acc-righe'); }
  else if(k==='list') flowGo('#acc-list','acc-list');
  else if(k==='as') flowGo('#as-txt','acc-as');
  else if(k==='zero'||k==='vuote') ckDo({a:k});
  else if(k==='prezzo'){ if(flowState().totErr) ckDo({a:'tot'}); else flowGo('#acc-prezzo','acc-prezzo'); }
  else if(k==='invio'||k==='send') $('qb-share').click();
  else if(k==='ok') flowStatus('accettato');
  else if(k==='no') flowStatus('rifiutato');
  else if(k==='new') $('qb-new').click();
});
// barra del preventivo: scorrendo diventa sottile e lascia spazio al lavoro
(function(){
  var q=$('qbar'), on=false, tk=false; if(!q) return;
  function chk(){ tk=false; var y=window.scrollY, m=on?y>140:y>420; if(m!==on){ on=m; q.classList.toggle('mini',m); } }
  window.addEventListener('scroll',function(){ if(!tk){ tk=true; requestAnimationFrame(chk); } },{passive:true});
})();
// tipo di preventivo: la rotella del mouse scorre la fila di lato, e il tipo scelto resta sempre in vista
(function(){
  var t=$('tabs'); if(!t) return;
  t.addEventListener('wheel',function(e){ if(Math.abs(e.deltaY)>Math.abs(e.deltaX)&&t.scrollWidth>t.clientWidth){ var x=t.scrollLeft; t.scrollLeft+=e.deltaY; if(t.scrollLeft!==x) e.preventDefault(); } },{passive:false});
})();
function tipoInVista(){ var t=$('tabs'), b=t&&t.querySelector('[aria-pressed="true"]'); if(!b||t.scrollWidth<=t.clientWidth) return; var l=b.offsetLeft-t.offsetLeft, r=l+b.offsetWidth; if(l<t.scrollLeft||r>t.scrollLeft+t.clientWidth) t.scrollLeft=Math.max(0,l-24); }
(function(T){ if(!T) return; T.menuLoad=function(){ menuLoad(); menuFix(); renderNav(); }; T.MENU=function(){ return MENU; }; T.flowState=flowState; T.renderFlow=renderFlow; T.accInit=accInit; })(window.IECI_T);
