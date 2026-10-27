/* ===== Controllo prima dell'invio: quello che un collega guarderebbe prima di mandare il preventivo al cliente ===== */
var CK_SERV=/manodopera|installazion|posa|montaggio|collaud|programmazion|configurazion|sopralluog|pratic|dichiarazion|progett|diritto di chiamata|ricerca guasto|messa in servizio|cablaggio|puntamento|orientamento|sintonizzazion|formazion|analisi dei rischi|smaltiment|assistenza/i;
function ckDays(d){ var t=Date.parse(String(d||'')+'T00:00:00'); if(!isFinite(t)) return 0; return Math.floor((Date.now()-t)/864e5); }
function ckList(){
  var out=[], c=S.client||{}, L=S.lines.filter(function(l){ return !l.off&&!l.vm; });
  function add(lv,t,a,b){ out.push({l:lv,t:t,a:a,b:b}); }
  if(!String(c.name||'').trim()) add('err','Manca il nome del cliente','cli','Scrivilo');
  if(!String(c.tel||'').trim()&&!String(c.email||'').trim()) add('warn','Nessun telefono né email del cliente: servono per l\'invio','tel','Aggiungi');
  if(!L.length) add('err','Il preventivo non ha ancora voci','voci','Aggiungi voci');
  if(!FREE()){
    var z=L.filter(function(l){ return !l.opt&&num(l.p)<=0&&String(l.d||'').trim(); });
    if(z.length) add('warn',(z.length===1?'1 voce senza prezzo':z.length+' voci senza prezzo')+': «'+String(z[0].d).slice(0,40)+'»'+(z.length>1?' e altre':''),'zero','Mostra');
  }
  var q0=L.filter(function(l){ return num(l.q)<=0&&!l.opt; }); if(q0.length) add('warn',(q0.length===1?'1 voce con quantità zero':q0.length+' voci con quantità zero')+': «'+String(q0[0].d).slice(0,40)+'»','q0','Mostra');
  var vu=L.filter(function(l){ return !String(l.d||'').trim(); }); if(vu.length) add('warn',vu.length===1?'1 riga senza descrizione':vu.length+' righe senza descrizione','vuote','Mostra');
  if(brOn()) sysList().forEach(function(x,i){ if(!S.lines.some(function(l){ return l.sy===x.id&&!l.vm&&!l.off; })) add('err','«'+sysName(x,i)+'» non ha voci: completala o chiudi il confronto','prop','Apri'); });
  if(!String(S.meta.num||'').trim()) add('warn','Manca il numero del preventivo','num','Numera');
  var age=ckDays(S.meta.date), val=num(S.meta.val)||30;
  if(!S.meta.date) add('warn','Manca la data del preventivo','data','Metti oggi');
  else if(age>val) add('warn','La data è di '+age+' giorni fa: il preventivo risulterebbe già scaduto','data','Metti oggi');
  if(vcOn()&&vcN()<=1) add('warn','Videocitofono per 1 solo condomino: è giusto?','cond','Controlla');
  if(!String(S.pay||'').trim()) add('warn','Mancano le condizioni di pagamento','pay','Scrivile');
  if(S.style.showProdotti){
    var np=S.products.filter(function(p){ return p.on!==false&&prodUsers(p).length&&!(p.photos&&p.photos.length)&&!(p.x&&p.x.photos); }).length;
    if(np) add('info',np===1?'1 scheda prodotto senza foto':np+' schede prodotto senza foto','foto','Trova le foto');
  }
  var nb=iwBrands().filter(function(b){ return !brandLogo(b); }); if(nb.length&&(brOn()||S.style.showProdotti)) add('info','Marche senza logo: '+nb.slice(0,4).join(', ')+(nb.length>4?'…':''),'foto','Trova i loghi');
  return out;
}
// solo per te: dove vanno i soldi del preventivo (non compare mai nel PDF)
function ckMe(){
  var L=mainLines().filter(function(l){ return !l.vm; }); if(brOn()||(S.tiers&&S.tiers.on)||FREE()||!L.length) return '';
  var mat=0, lav=0, ore=0, cost=0, sale=0, nk=0;
  L.forEach(function(l){ var t=lineTotal(l); if(SERVICE_U.test(String(l.u||'').trim())&&/^(h|ore?)$/i.test(String(l.u||'').trim())) ore+=num(l.q);
    var u=String(l.u||'').trim(); if(/^(h|ore?|giornat[ae]|a corpo|corpo|forfait)$/i.test(u)||(CK_SERV.test(String(l.d||''))&&!/fornit|punto|punti|^linea|^posa cavo/i.test(String(l.d||'')))) lav+=t; else mat+=t;
    var a=l.art?DB.arts.filter(function(x){ return x.id===l.art; })[0]:null; if(a&&num(a.cost)>0){ cost+=num(a.cost)*num(l.q); sale+=t; nk++; } });
  var T=totals(), sc=num(S.meta.disc)/100;
  var h='<div class="ck-me"><b>Solo per te · non compare nel preventivo</b><div class="ck-g"><div><small>Forniture, punti e linee</small>'+eur(mat*(1-sc))+'</div><div><small>Solo lavoro e servizi</small>'+eur(lav*(1-sc))+(ore?' · '+qfmt(ore)+' h':'')+'</div><div><small>Imponibile</small>'+eur(T.imp)+'</div>';
  if(nk){ var m=sale*(1-sc)-cost; h+='<div><small>Guadagno sugli articoli dei fornitori ('+nk+')</small>'+eur(m)+(sale>0?' · '+qfmt(Math.round(m/(sale*(1-sc))*1000)/10)+'%':'')+'</div>'; }
  return h+'</div></div>';
}
function ckHtml(list,short){
  var bad=list.filter(function(x){ return x.l!=='info'; }).length;
  if(!list.length) return '<div class="ck ok"><div class="ck-h"><span class="ck-i">✓</span><b>Pronto da inviare</b></div><p class="hint" style="margin:0">Cliente, voci, prezzi, date, condizioni, foto e loghi: è tutto a posto.</p>'+(short?'':ckMe())+'</div>';
  return '<div class="ck '+(bad?'ko':'ok')+'"><div class="ck-h"><span class="ck-i">'+(bad?'!':'✓')+'</span><b>'+(bad?(bad===1?'1 cosa da controllare':bad+' cose da controllare')+' prima di inviare':'Pronto da inviare')+'</b></div>'+
    '<ul class="ck-l">'+list.map(function(x,i){ return '<li class="'+x.l+'"><span>'+esc(x.t)+'</span><button type="button" class="btn ghost sm" data-ck="'+i+'">'+esc(x.b)+'</button></li>'; }).join('')+'</ul>'+(short?'':ckMe())+'</div>';
}
var CK_LAST=[];
function ckRender(){ var el=$('ck-box'); if(!el) return; CK_LAST=ckList(); el.innerHTML=ckHtml(CK_LAST,false); }
function ckShare(){ var el=$('sh-ck'); if(!el) return; CK_LAST=ckList(); el.innerHTML=CK_LAST.some(function(x){ return x.l!=='info'; })?ckHtml(CK_LAST,true):''; }
function ckGo(sel,panel){ showPanel(panel); setTimeout(function(){ var e=typeof sel==='string'?document.querySelector(sel):sel; if(!e) return; try{ e.scrollIntoView({behavior:'smooth',block:'center'}); }catch(x){} if(e.focus&&/INPUT|TEXTAREA|SELECT/.test(e.tagName)) try{ e.focus({preventScroll:true}); }catch(x){} },80); }
function ckFlash(test){
  showPanel('prev'); var acc=$('acc-righe'); if(acc) acc.open=true;
  setTimeout(function(){ var first=null; Array.prototype.forEach.call(document.querySelectorAll('#lines .line'),function(r){ var l=S.lines[+r.getAttribute('data-i')]; if(l&&test(l)){ r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash'); if(!first) first=r; } }); if(first) try{ first.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){} },80);
}
function ckDo(x){
  if(!$('sh-bg').hidden) closeShare();
  var a=x.a;
  if(a==='cli') ckGo('#k-name','dati');
  else if(a==='tel') ckGo('[data-panel="invio"] [data-b="client.tel"]','invio');
  else if(a==='voci'||a==='prop') ckGo('#acc-as','prev');
  else if(a==='zero') ckFlash(function(l){ return !l.off&&!l.vm&&!l.opt&&num(l.p)<=0; });
  else if(a==='q0') ckFlash(function(l){ return !l.off&&!l.vm&&!l.opt&&num(l.q)<=0; });
  else if(a==='vuote') ckFlash(function(l){ return !l.off&&!l.vm&&!String(l.d||'').trim(); });
  else if(a==='num'){ S.meta.num=nextNum(); syncFields(); touch(); renderDoc(); toast('Numero assegnato: '+S.meta.num); }
  else if(a==='data'){ S.meta.date=today(); syncFields(); touch(); renderDoc(); toast('Data aggiornata a oggi'); }
  else if(a==='cond') ckGo('#vc-n','prev');
  else if(a==='pay') ckGo('#m-pay','cond');
  else if(a==='foto') iwFill();
  setTimeout(function(){ ckRender(); ckShare(); },60);
}
(function(){
  function h(e){ var b=e.target.closest('[data-ck]'); if(!b) return; var x=CK_LAST[+b.getAttribute('data-ck')]; if(x) ckDo(x); }
  if($('ck-box')) $('ck-box').addEventListener('click',h);
  if($('sh-ck')) $('sh-ck').addEventListener('click',h);
})();
(function(T){ if(!T) return; T.DB=function(){ return DB; }; T.APP=function(){ return APP; }; T.iwScan=iwScan; T.iwProd=iwProd; T.iwFill=iwFill; T.linkLine=linkLine; T.ckList=ckList; T.asNorm=asNorm; T.asAnalizza=asAnalizza; T.prVoci=prVoci; T.prCerca=prCerca; T.maVoci=maVoci; T.buildPdf=buildPdf; T.prodotti=function(){ renderProducts(true); }; T.renderAll=renderAll; })(window.IECI_T);
