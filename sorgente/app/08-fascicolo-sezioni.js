/* ===== Prodotti del videocitofono: impianti e modelli alternativi ben separati ===== */
var PG_GROUPED=false, PG_COL=['var(--pbrand,#2F65AE)','#0F766E','#B45309'];
function prodAlt(p){
  if(!vcOn()||!p) return null; var r=null, n=lcn(p.name);
  vmKinds().forEach(function(k){ if(r) return; if(brOn()&&p.sys&&p.sys!==k) return;
    vmData(k).o.forEach(function(o){ if(r||!vmHas(o)) return; if(lcn(vmDn(o))===n||(o.d&&lcn(o.d)===n)) r={k:k,o:o,dl:vmDelta(k,o)}; }); });
  return r;
}
function prodIsBase(p){
  if(!vcOn()||!p) return null; var r=null;
  vmKinds().forEach(function(k){ if(r) return; if(!vmData(k).o.some(vmHas)) return; var bl=vmBaseLine(k); if(bl&&prodOfLine(bl)===p) r=k; });
  return r;
}
function prodBadge(p,alt){
  if(!vcOn()) return '';
  if(alt){ var w=vmWord(alt.k), inc=vmIncl(alt.dl);
    return '<div class="altb"><span class="altt">Modello alternativo · a richiesta</span><span class="altp">'+(alt.dl>0?'Surplus per questo '+w+' <b>+ '+eur(inc)+'</b>':alt.dl<0?'Riduzione per questo '+w+' <b>− '+eur(-inc)+'</b>':'<b>Stesso prezzo</b> del modello incluso')+(alt.dl?' <small>IVA inclusa, per ogni '+w+'</small>':'')+'</span></div>'+(!String(p.desc||'').trim()&&alt.o.t?'<div class="altn">'+esc(alt.o.t)+'</div>':''); }
  if(prodIsBase(p)) return '<div class="incb">✓ Modello incluso nel prezzo</div>';
  return '';
}
function brandLogo(brand){
  var b=String(brand||'').toLowerCase().replace(/[^a-z0-9]/g,''); if(b.length<2) return '';
  var r=''; (S.trust.bgroups||[]).forEach(function(g){ (g.items||[]).forEach(function(it){ if(r) return; var n=String(it.name||'').toLowerCase().replace(/[^a-z0-9]/g,''); if(n&&(n.indexOf(b)>-1||(n.length>=3&&b.indexOf(n)>-1))) r=it.img; }); });
  return r;
}
function vcProdGroups(list){
  var G=[];
  if(brOn()){
    sysList().forEach(function(x,i){ var T=totals(i); G.push({i:i,key:x.id,kicker:brW()+' '+String.fromCharCode(65+i)+(i===tierRec()?' · '+brRec():''),title:x.b||sysName(x,i),sub:sysName(x,i)+(vcOn()?' · '+sysKindName(x.k):''),brand:x.b,logo:sysLogo(x),T:T,q:T.tot>0&&vcOn()?vcQuota(T,i):0,items:list.filter(function(p){ return p.sys===x.id; })}); });
    var com=list.filter(function(p){ return !p.sys||!sysById(p.sys); }); if(com.length) G.push({i:-1,key:'',kicker:vcOn()?'Per tutti gli impianti':'Per tutte le proposte',title:'Componenti comuni',sub:'Presenti in ciascuna delle proposte',items:com});
  } else if(vcBoth()){
    [['video',1],['cit',0]].forEach(function(a,n){ var T=totals(a[1]); G.push({i:n,key:a[0],kicker:'Soluzione '+(n+1)+(a[1]===tierRec()?' · consigliata':''),title:vcSolTitle(a[0]),logo:vcSolLogo(a[0]),sub:a[0]==='cit'?'Parli con chi suona, senza immagine':'Parli e vedi chi suona, con monitor a colori',T:T,q:T.tot>0?vcQuota(T,a[1]):0,items:list.filter(function(p){ return p.sol===a[0]; })}); });
    var c2=list.filter(function(p){ return p.sol!=='video'&&p.sol!=='cit'; }); if(c2.length) G.push({i:-1,key:'',kicker:'Per entrambe le soluzioni',title:'Componenti comuni',sub:'Presenti in tutte e due le soluzioni',items:c2});
  } else {
    var kk=vcKind(); G.push({i:-2,key:kk,items:list.filter(function(p){ return !p.sol||p.sol===kk; })});
  }
  return G.filter(function(g){ return g.items.length; });
}
function grpHead(g){
  if(g.i===-2) return '';
  var col=g.i>=0?PG_COL[g.i%3]:'#6B7280', logo=g.logo||(g.brand?brandLogo(g.brand):''), showQ=vcOn()&&S.cond.show!==false;
  return '<div class="pgrp" style="--gc:'+col+'"><div class="pgrp-l">'+(logo?'<img src="'+logo+'" alt="'+esc(g.brand)+'">':(g.key==='video'||g.key==='cit'||g.i===-1?'<svg class="pgrp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(g.key==='video'?'<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M9 21h6M12 17v4"/><circle cx="12" cy="11" r="2.5"/>':g.key==='cit'?'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>':'<path d="M4 7h16M4 12h16M4 17h10"/>')+'</svg>':'<span class="pgrp-m">'+esc(String(g.title||'?').slice(0,2).toUpperCase())+'</span>'))+'</div>'+
    '<div class="pgrp-r"><div class="pgrp-k">'+esc(g.kicker)+'</div><div class="pgrp-t">'+esc(g.title)+'</div><div class="pgrp-s">'+esc(g.sub)+' · '+g.items.length+(g.items.length===1?' prodotto':' prodotti')+'</div></div>'+
    (g.T&&g.T.tot>0?'<div class="pgrp-n"><small>Totale IVA incl.</small><b>'+eur(g.T.tot)+'</b>'+(showQ?'<small>A condomino</small><b>'+eur(g.q)+'</b>':'')+'</div>':'')+'</div>';
}
function grpStrip(G){
  var R=G.filter(function(g){ return g.i>=0&&g.T; }); if(R.length<2) return '';
  var showQ=vcOn()&&S.cond.show!==false;
  return '<div class="pcmp">'+R.map(function(g){ var logo=g.logo||(g.brand?brandLogo(g.brand):'');
    return '<div class="pcmp-c" style="--gc:'+PG_COL[g.i%3]+'"><div class="pcmp-k">'+esc(g.kicker)+'</div><div class="pcmp-lg">'+(logo?'<img src="'+logo+'" alt="'+esc(g.brand)+'">':'<b>'+esc(g.title)+'</b>')+'</div><div class="pcmp-s">'+esc(g.sub)+'</div>'+
      '<div class="pcmp-n"><span>Totale</span><b>'+eur(g.T.tot)+'</b></div>'+(showQ?'<div class="pcmp-n"><span>A condomino</span><b>'+eur(g.q)+'</b></div>':'')+'<div class="pcmp-p">'+g.items.length+(g.items.length===1?' prodotto':' prodotti')+' nelle pagine seguenti</div></div>'; }).join('')+'</div>';
}
function secProdottiVc(list){
  var G=vcProdGroups(list); if(!G.length) return '';
  var per=S.style.prodLayout==='one'?1:(S.style.prodLayout==='two'?2:0), out='', first=true;
  var intro=(brOn()?(vcOn()?'<p class="lead">Ecco gli impianti a confronto: per ognuno trovi i prodotti che installiamo. Scegli quello che preferisci.</p>':'<p class="lead">Ecco le proposte a confronto, ognuna con la sua marca: per ciascuna trovi i prodotti che installiamo. Scegli quella che preferisci.</p>'):vcBoth()?'<p class="lead"><b>'+esc(vcSolTitle('video'))+'</b>: parli e vedi chi suona, con monitor a colori. <b>'+esc(vcSolTitle('cit'))+'</b>: parli con chi suona, senza immagine. Qui sotto i prodotti di ciascuna soluzione.</p>':'')+(S.show.prodIntro&&S.profile.prodIntro?'<p class="lead">'+esc(S.profile.prodIntro)+'</p>':'');
  PG_GROUPED=G.length>1||G[0].i!==-2;
  G.forEach(function(g){
    var main=g.items.filter(function(p){ return !prodAlt(p); }), alts=g.items.filter(function(p){ return !!prodAlt(p); });
    var seq=main.map(function(p){ return {p:p}; }); if(alts.length){ var w=vmWord(prodAlt(alts[0]).k); seq.push({h:'<div class="alth"><b>Modelli alternativi del '+w+'</b><span>Acquistabili a richiesta con un surplus, non compresi nel totale</span></div>'}); alts.forEach(function(p){ seq.push({p:p}); }); }
    var chunks=[], cur=[], np=0;
    seq.forEach(function(e){ if(e.p&&per&&np>=per){ chunks.push(cur); cur=[]; np=0; } cur.push(e); if(e.p) np++; }); if(cur.length) chunks.push(cur);
    chunks.forEach(function(ch,ci){
      var bigP=per===1;
      out+='<section class="page">'+pageHead('Prodotti e soluzioni')+'<div class="pg-b">'+
        (first?'<h2 class="sec">Prodotti e soluzioni</h2>'+intro+grpStrip(G):'<div class="h4">Prodotti e soluzioni</div>')+
        (ci===0?grpHead(g):(g.i===-2?'':'<div class="pgrp-mini" style="--gc:'+(g.i>=0?PG_COL[g.i%3]:'#6B7280')+'">'+esc(g.title)+' · continua</div>'))+
        ch.map(function(e){ return e.h?e.h:prodHtml(e.p,bigP); }).join('')+'</div>'+pageFoot()+'</section>';
      first=false;
    });
  });
  PG_GROUPED=false;
  return out;
}
function secProdotti(){
  if(!S.style.showProdotti) return '';
  var list=S.products.filter(function(p){return p.on!==false;});
  if(vcOn()||brOn()) return secProdottiVc(list);
  if(vcOn()){
    if(brOn()){ list=list.map(function(p,i){ return {p:p,i:i}; }).sort(function(a,b){ var x=(a.p.sys?sysIdx(a.p.sys):99)-(b.p.sys?sysIdx(b.p.sys):99); return x||a.i-b.i; }).map(function(o){ return o.p; }); }
    else if(vcBoth()){ var ord={video:0,cit:1,'':2}; list=list.map(function(p,i){ return {p:p,i:i}; }).sort(function(a,b){ var x=ord[a.p.sol||'']-ord[b.p.sol||'']; return x||a.i-b.i; }).map(function(o){ return o.p; }); }
    else { var kk=vcKind(); list=list.filter(function(p){ return !p.sol||p.sol===kk; }); }
  }
  if(!list.length) return '';
  var per=S.style.prodLayout==='one'?1:(S.style.prodLayout==='two'?2:list.length), chunks=[], i;
  for(i=0;i<list.length;i+=per) chunks.push(list.slice(i,i+per));
  return chunks.map(function(ch,idx){
    return '<section class="page">'+pageHead('Prodotti e soluzioni')+'<div class="pg-b">'+
      (idx===0?'<h2 class="sec">Prodotti e soluzioni</h2>'+(brOn()?brLead():vcBoth()?'<p class="lead"><b>Videocitofono</b>: parli e vedi chi suona, con monitor a colori. <b>Solo citofono</b>: parli con chi suona, senza immagine. Qui sotto trovi i prodotti di ciascuna soluzione.</p>':'')+(S.show.prodIntro&&S.profile.prodIntro?'<p class="lead">'+esc(S.profile.prodIntro)+'</p>':''):'<div class="h4">Prodotti e soluzioni</div>')+
      ch.map(function(p){return prodHtml(p,per===1);}).join('')+'</div>'+pageFoot()+'</section>';
  }).join('');
}
function findCustom(id){ return S.custom.filter(function(c){return c.id===id;})[0]; }
function secCustom(id){
  var c=findCustom(id); if(!c||c.on===false) return '';
  var ph=c.photos||[], t=c.title||'Pagina';
  return '<section class="page">'+pageHead(t)+'<div class="pg-b"><h2 class="sec">'+esc(t)+'</h2>'+
    (c.text?'<p class="about" style="margin-top:14px">'+esc(c.text)+'</p>':'')+
    (ph.length?'<div class="cp n'+Math.min(ph.length,4)+'">'+ph.map(function(u){return '<img src="'+u+'" alt="">';}).join('')+'</div>':'')+'</div>'+pageFoot()+'</section>';
}
function secAzienda(){
  if(!S.style.showAzienda) return '';
  var P=S.profile, sh=S.show;
  var stats=sh.azStats?lines(P.stats).slice(0,4).map(function(l){var a=l.split('|'); return '<div><strong>'+esc((a[0]||'').trim())+'</strong><span>'+esc((a[1]||'').trim())+'</span></div>';}).join(''):'';
  var certs=sh.azCerts?lines(P.certs).map(function(l){return '<li>'+esc(l)+'</li>';}).join(''):'';
  var guar=sh.azGuar?lines(P.guar).map(function(l){return '<li>'+esc(l)+'</li>';}).join(''):'';
  var steps=sh.azSteps?lines(P.steps).slice(0,6).map(function(l){var a=l.split('|'); return '<div class="step"><b>'+esc((a[0]||'').trim())+'</b><span>'+esc((a[1]||'').trim())+'</span></div>';}).join(''):'';
  var two=(certs||guar)?'<div class="two">'+(certs?'<div><div class="h4">Abilitazioni e certificazioni</div><ul class="ticks">'+certs+'</ul></div>':'<div></div>')+
    (guar?'<div><div class="h4">Le nostre garanzie</div><ul class="ticks">'+guar+'</ul></div>':'<div></div>')+'</div>':'';
  return '<section class="page">'+pageHead('Chi siamo')+'<div class="pg-b"><h2 class="sec">Chi siamo</h2>'+
    (sh.azSlogan&&P.slogan?'<p class="slogan">'+esc(P.slogan)+'</p>':'')+(sh.azAbout&&P.about?'<p class="about">'+esc(P.about)+'</p>':'')+
    (stats?'<div class="stats">'+stats+'</div>':'')+
    (steps?'<div class="h4">Come lavoriamo</div><div class="steps">'+steps+'</div>':'')+two+'</div>'+pageFoot()+'</section>';
}
function lineBrand(l){
  if(!S.show.pvBrand) return '';
  var nm=String(l.vmn||l.d||'').trim().toLowerCase(); if(!nm) return '';
  var p=null; if(l.pid) S.products.forEach(function(x){ if(x.id===l.pid) p=x; });
  if(!p) S.products.forEach(function(x){ if(!p&&String(x.name||'').trim().toLowerCase()===nm&&(!l.sy||!x.sys||x.sys===l.sy)) p=x; });
  if((!p||!(p.brand||p.code))&&l.br) return '<div class="cap br">Marca: <b>'+esc(l.br)+'</b></div>';
  if(!p||!(p.brand||p.code)) return '';
  return '<div class="cap br">'+(p.brand?'Marca: <b>'+esc(p.brand)+'</b>':'')+(p.brand&&p.code?' · ':'')+(p.code?'Modello: '+esc(p.code):'')+'</div>';
}

function vcBoxSys(j){
  if(!vcOn()||S.cond.show===false) return '';
  var n=vcN(), T=totals(j), B=vmBase(j,T);
  return '<div class="vcbox"><div class="vh">Ripartizione della spesa tra i condomini</div><div class="vr"><span>Quota a condomino, IVA inclusa</span><b>'+eur(vcQuota(T,j))+'</b></div><div class="vr" style="margin-top:2px"><span>Quota IVA esclusa</span><span>'+eur(r2(B.imp/n))+' + IVA</span></div><div class="vs">'+n+' condomini · totale '+eur(B.tot)+' IVA inclusa ÷ '+n+'</div></div>';
}
function sysBlock(j,T){
  var x=sysList()[j], m=S.meta, sh=S.show, E=S.econ, ecT=econOn(), L=mainLines().filter(function(l){ return inTier(l,j); }), body, tots;
  if(ecT){
    var rowsF=L.map(function(l,i){ var q=num(l.q); return '<tr><td class="n">'+(i+1)+'</td><td>'+esc(l.d)+lineBrand(l)+'</td><td class="n">'+(q>0?qfmt(q)+' '+esc(l.u):'')+'</td></tr>'; }).join('');
    tots='';
    if(E.breakdown!==false&&num(m.iva)>=0) tots+='<div><span>Imponibile</span><span>'+eur(T.imp)+'</span></div><div><span>IVA '+qfmt(num(m.iva))+'%</span><span>'+eur(T.iva)+'</span></div>';
    tots+='<div class="grand"><span>'+esc(E.label||(E.breakdown!==false?'Totale':'Totale IVA inclusa'))+'</span><span>'+eur(T.tot)+'</span></div>';
    body=(rowsF?'<table class="qt"><thead><tr><th class="n">#</th><th>Descrizione dei lavori</th><th class="n">Quantità</th></tr></thead><tbody>'+rowsF+'</tbody></table>':'');
  } else {
    var rowF=function(l,i){ return '<tr><td class="n">'+(i+1)+'</td><td>'+esc(l.d)+lineBrand(l)+'</td><td>'+esc(l.u)+'</td><td class="n">'+qfmt(num(l.q))+'</td><td class="n">'+eur(num(l.p))+'</td><td class="n">'+(num(l.s)?qfmt(num(l.s))+'%':'')+'</td><td class="n">'+eur(lineTotal(l))+'</td></tr>'; };
    var rows=(S.model==='app'?appRows(L,rowF):L.map(rowF).join(''))||'<tr><td colspan="7" style="text-align:center;padding:14px">Nessuna voce</td></tr>';
    tots='<div><span>Totale lavori</span><span>'+eur(T.sub)+'</span></div>';
    if(T.disc) tots+='<div><span>'+(T.ag?'Sconto concordato':'Sconto '+qfmt(num(m.disc))+'%')+'</span><span>− '+eur(T.disc)+'</span></div><div><span>Imponibile</span><span>'+eur(T.imp)+'</span></div>';
    tots+='<div><span>IVA '+qfmt(num(m.iva))+'%</span><span>'+eur(T.iva)+'</span></div><div class="grand"><span>Totale</span><span>'+eur(T.tot)+'</span></div>';
    body='<table class="qt"><thead><tr><th class="n">#</th><th>Descrizione</th><th>U.m.</th><th class="n">Q.tà</th><th class="n">Prezzo</th><th class="n">Sc.</th><th class="n">Importo</th></tr></thead><tbody>'+rows+'</tbody></table>';
  }
  if(sh.pvAcc&&num(m.dep)>0) tots+='<div style="margin-top:6px"><span>Acconto '+qfmt(num(m.dep))+'%</span><span>'+eur(T.dep)+'</span></div><div class="bal"><span>Saldo</span><span>'+eur(T.saldo)+'</span></div>';
  var rec=(j===tierRec());
  var lg=sysLogo(x);
  return '<div class="sysb"><div class="sysh">'+(lg?'<img class="syslg" src="'+lg+'" alt="'+esc(x.b||'')+'">':'')+'<span class="sysl">'+brW()+' '+String.fromCharCode(65+j)+(rec?' · '+brRec():'')+'</span><h3>'+esc(sysName(x,j))+'</h3><div class="sysm">'+(x.b?'Marca: <b>'+esc(x.b)+'</b>':'')+(vcOn()?(x.b?' · ':'')+sysKindName(x.k):'')+'</div></div>'+body+'<div class="tots">'+tots+'</div>'+(ecT&&E.note?'<p class="note-s" style="white-space:pre-line">'+esc(E.note)+'</p>':'')+vcBoxSys(j)+vmBox(x.id)+'</div>';
}
function secPreventivoBr(){
  var sh=S.show, m=S.meta, v=validText(), l=sysList(), rec=tierRec(), TT=l.map(function(x,i){ return totals(i); }), showQ=vcOn()&&S.cond.show!==false;
  var min=Math.min.apply(null,TT.map(function(t){ return t.tot; }));
  var strip=sh.pvStrip?'<div class="strip"><div><small>Preventivo n.</small><b>'+esc(m.num)+'</b></div><div><small>Data</small><b>'+esc(dateIt(m.date))+'</b></div><div><small>Valido fino al</small><b>'+(v?esc(v):'—')+'</b></div><div class="big"><small>A partire da</small><b>'+eur(min)+'</b></div></div>':'';
  var sum='<div class="h4" style="margin-top:6px">'+(vcOn()?'Gli impianti a confronto':'Le proposte a confronto')+'</div><table class="qt cmp sysum"><thead><tr><th>'+brW()+'</th><th>Marca</th><th class="n">Totale IVA inclusa</th>'+(showQ?'<th class="n">Quota a condomino</th>':'')+'</tr></thead><tbody>'+
    l.map(function(x,i){ var lg=sysLogo(x); return '<tr><td><b>'+esc(sysName(x,i))+'</b>'+(i===rec?' <span class="solb t">'+brRec()+'</span>':'')+(vcOn()?'<div class="cap">'+sysKindName(x.k)+'</div>':'')+'</td><td>'+(lg?'<img class="sumlg" src="'+lg+'" alt="">':'')+esc(x.b||'—')+'</td><td class="n">'+eur(TT[i].tot)+'</td>'+(showQ?'<td class="n rc">'+(TT[i].tot>0?eur(vcQuota(TT[i],i)):'—')+'</td>':'')+'</tr>'; }).join('')+'</tbody></table>'+
    '<p class="note-s">'+(vcOn()?'Ogni impianto è completo e autonomo: scegli quello che preferisci. Nelle pagine seguenti trovi il dettaglio delle voci di ciascuno.':'Ogni proposta è completa e autonoma: scegli quella che preferisci. Nelle pagine seguenti trovi il dettaglio delle voci di ciascuna.')+'</p>';
  var O=optLines(), opt='';
  if(sh.pvOpt&&O.length&&!econOn()) opt='<div class="h4" style="margin-top:20px">Opzioni facoltative, non incluse nel totale</div><table class="qt"><thead><tr><th>Descrizione</th><th class="n">Q.tà</th><th class="n">Importo</th><th class="n">IVA incl.</th></tr></thead><tbody>'+O.map(function(o){ return '<tr><td>'+esc(o.d)+'</td><td class="n">'+qfmt(num(o.q))+' '+esc(o.u)+'</td><td class="n">'+eur(lineTotal(o))+'</td><td class="n">'+eur(r2(lineTotal(o)*(1+num(m.iva)/100)))+'</td></tr>'; }).join('')+'</tbody></table>';
  var pages='<section class="page">'+pageHead('Preventivo economico')+'<div class="pg-b"><h2 class="sec">Preventivo economico</h2>'+strip+sum+'</div>'+pageFoot()+'</section>';
  l.forEach(function(x,j){
    pages+='<section class="page">'+pageHead('Preventivo economico · '+sysName(x,j))+'<div class="pg-b">'+(j===0?'<h2 class="sec">Dettaglio '+(vcOn()?'degli impianti':'delle proposte')+'</h2>':'<div class="h4">Dettaglio '+(vcOn()?'degli impianti':'delle proposte')+'</div>')+sysBlock(j,TT[j])+(j===l.length-1?opt:'')+'</div>'+pageFoot()+'</section>';
  });
  return pages;
}
function secPreventivo(){
  var sh=S.show; if(!sh.prev) return '';
  if(brOn()&&S.tiers.on) return secPreventivoBr();
  var m=S.meta, v=validText(), L=mainLines(), O=optLines(), T=totals(), tiers=tiersOn(), n=tierN(), names=S.tiers.names.slice(0,n), j;
  var body='', bigCell;
  if(tiers){
    var TT=[]; for(j=0;j<n;j++) TT.push(totals(j));
    var rec=tierRec();
    var head='<th class="n">#</th><th>Descrizione</th>'+names.map(function(nm,k){ var tl=tierLogo(k); return '<th class="n'+(k===rec?' rec':'')+'">'+(tl?'<span class="thlg"><img src="'+tl+'" alt=""></span>':'')+esc(nm)+(k===rec?'<br>consigliata':'')+'</th>'; }).join('');
    var E0=S.econ, ecT=econOn();
    var rows=L.map(function(l,i){
      var q0=num(l.q);
      return '<tr><td class="n">'+(i+1)+'</td><td>'+esc(l.d)+(ecT?'':'<div class="cap">'+qfmt(num(l.q))+' '+esc(l.u)+' × '+eur(num(l.p))+(num(l.s)?' (−'+qfmt(num(l.s))+'%)':'')+'</div>')+lineBrand(l)+'</td>'+
        names.map(function(x,k){ return '<td class="n">'+(inTier(l,k)?(ecT?(q0>0?qfmt(q0)+' '+esc(l.u):'incluso'):eur(lineTotal(l))):'—')+'</td>'; }).join('')+'</tr>';
    }).join('')||'<tr><td colspan="'+(2+n)+'" style="text-align:center;padding:18px">Nessuna voce</td></tr>';
    var trow=function(label,fn,cls){ return '<tr class="'+(cls||'')+'"><td></td><td>'+label+'</td>'+TT.map(function(t){ return '<td class="n">'+fn(t)+'</td>'; }).join('')+'</tr>'; };
    var foot='';
    if(ecT){
      if(E0.breakdown!==false) foot+=trow('Imponibile',function(t){return eur(t.imp);},'fr')+trow('IVA '+qfmt(num(m.iva))+'%',function(t){return eur(t.iva);},'fr');
      foot+=trow(esc(E0.label||(E0.breakdown!==false?'Totale':'Totale IVA inclusa')),function(t){return eur(t.tot);},'g');
    } else {
      foot=trow('Totale lavori',function(t){return eur(t.sub);},'fr');
      if(T.disc) foot+=trow('Sconto '+qfmt(num(m.disc))+'%',function(t){return '− '+eur(t.disc);},'fr');
      foot+=trow('IVA '+qfmt(num(m.iva))+'%',function(t){return eur(t.iva);},'fr')+trow('Totale IVA inclusa',function(t){return eur(t.tot);},'g');
    }
    if(sh.pvAcc&&num(m.dep)>0) foot+=trow('Acconto '+qfmt(num(m.dep))+'%',function(t){return eur(t.dep);},'fr')+trow('Saldo',function(t){return eur(t.saldo);},'fr');
    body='<table class="qt cmp"><thead><tr>'+head+'</tr></thead><tbody>'+rows+foot+'</tbody></table>'+(ecT&&E0.note?'<p class="note-s" style="white-space:pre-line">'+esc(E0.note)+'</p>':'');
    bigCell='<div class="big"><small>A partire da</small><b>'+eur(Math.min.apply(null,TT.map(function(t){return t.tot;})))+'</b></div>';
  } else if(econOn()){
    var E=S.econ, rowsF=L.map(function(l,i){ var q=num(l.q); return '<tr><td class="n">'+(i+1)+'</td><td>'+esc(l.d)+lineBrand(l)+'</td><td class="n">'+(q>0?qfmt(q)+' '+esc(l.u):'')+'</td></tr>'; }).join('');
    var totsF='';
    if(E.breakdown!==false&&num(m.iva)>=0) totsF+='<div><span>Imponibile</span><span>'+eur(T.imp)+'</span></div><div><span>IVA '+qfmt(num(m.iva))+'%</span><span>'+eur(T.iva)+'</span></div>';
    totsF+='<div class="grand"><span>'+esc(E.label||(E.breakdown!==false?'Totale':'Totale IVA inclusa'))+'</span><span>'+eur(T.tot)+'</span></div>';
    if(sh.pvAcc&&num(m.dep)>0) totsF+='<div style="margin-top:6px"><span>Acconto '+qfmt(num(m.dep))+'%</span><span>'+eur(T.dep)+'</span></div><div class="bal"><span>Saldo</span><span>'+eur(T.saldo)+'</span></div>';
    body=(rowsF?'<table class="qt"><thead><tr><th class="n">#</th><th>Descrizione dei lavori</th><th class="n">Quantità</th></tr></thead><tbody>'+rowsF+'</tbody></table>':'')+'<div class="tots">'+totsF+'</div>'+(E.note?'<p class="note-s" style="white-space:pre-line">'+esc(E.note)+'</p>':'');
    bigCell='<div class="big"><small>Totale IVA incl.</small><b>'+eur(T.tot)+'</b></div>';
  } else {
    var rowFn=function(l,i){
      return '<tr><td class="n">'+(i+1)+'</td><td>'+esc(l.d)+lineBrand(l)+'</td><td>'+esc(l.u)+'</td><td class="n">'+qfmt(num(l.q))+'</td><td class="n">'+eur(num(l.p))+'</td><td class="n">'+(num(l.s)?qfmt(num(l.s))+'%':'')+'</td><td class="n">'+eur(lineTotal(l))+'</td></tr>';
    };
    var rows2=(S.model==='app'?appRows(L,rowFn):L.map(rowFn).join(''))||'<tr><td colspan="7" style="text-align:center;padding:18px">Nessuna voce</td></tr>';
    var tots='<div><span>Totale lavori</span><span>'+eur(T.sub)+'</span></div>';
    if(T.disc) tots+='<div><span>'+(T.ag?'Sconto concordato':'Sconto '+qfmt(num(m.disc))+'%')+'</span><span>− '+eur(T.disc)+'</span></div><div><span>Imponibile</span><span>'+eur(T.imp)+'</span></div>';
    tots+='<div><span>IVA '+qfmt(num(m.iva))+'%</span><span>'+eur(T.iva)+'</span></div><div class="grand"><span>Totale</span><span>'+eur(T.tot)+'</span></div>';
    if(sh.pvAcc&&num(m.dep)>0) tots+='<div style="margin-top:6px"><span>Acconto '+qfmt(num(m.dep))+'%</span><span>'+eur(T.dep)+'</span></div><div class="bal"><span>Saldo</span><span>'+eur(T.saldo)+'</span></div>';
    body='<table class="qt"><thead><tr><th class="n">#</th><th>Descrizione</th><th>U.m.</th><th class="n">Q.tà</th><th class="n">Prezzo</th><th class="n">Sc.</th><th class="n">Importo</th></tr></thead><tbody>'+rows2+'</tbody></table>'+(S.model==='app'?appSummary(L):'')+'<div class="tots">'+tots+'</div>';
    bigCell='<div class="big"><small>Totale IVA incl.</small><b>'+eur(T.tot)+'</b></div>';
  }
  var strip=sh.pvStrip?'<div class="strip"><div><small>Preventivo n.</small><b>'+esc(m.num)+'</b></div><div><small>Data</small><b>'+esc(dateIt(m.date))+'</b></div>'+
    '<div><small>Valido fino al</small><b>'+(v?esc(v):'—')+'</b></div>'+bigCell+'</div>':'';
  var opt='';
  if(sh.pvOpt&&O.length&&!econOn()){
    var optSum=O.reduce(function(a,l){return a+lineTotal(l);},0), withAll=calc(totals().sub+optSum);
    opt='<div class="h4" style="margin-top:24px">Opzioni facoltative, non incluse nel totale</div>'+
      '<table class="qt"><thead><tr><th>Descrizione</th><th class="n">Q.tà</th><th class="n">Importo</th><th class="n">IVA incl.</th><th class="n">Scelta</th></tr></thead><tbody>'+
      O.map(function(l){ return '<tr><td>'+esc(l.d)+'</td><td class="n">'+qfmt(num(l.q))+' '+esc(l.u)+'</td><td class="n">'+eur(lineTotal(l))+'</td><td class="n">'+eur(r2(lineTotal(l)*(1+num(S.meta.iva)/100)))+'</td><td class="n"><span class="chkbox">'+(l.acc?'✓':'')+'</span></td></tr>'; }).join('')+
      '</tbody></table>'+(tiers?'':'<p class="note-s">Con tutte le opzioni il totale diventa '+eur(withAll.tot)+' IVA inclusa.</p>');
  }
  return '<section class="page">'+pageHead('Preventivo economico')+'<div class="pg-b"><h2 class="sec">Preventivo economico</h2>'+strip+body+vcBox()+vmBox()+opt+'</div>'+pageFoot()+'</section>';
}
function sigBox(label,img,name,extra,stamp){
  var W=Math.max(30,Math.min(300,num(S.company.stampW)||90)), ar=num(S.company.stampAr)||1.4, h=Math.max(72,Math.round(W/ar/2)+10);
  return '<div class="sg"><div class="simg" style="min-height:'+(stamp?h:72)+'px">'+(img?'<img class="sigimg" src="'+img+'" alt="">':'')+(stamp?'<img class="stampimg" style="width:'+W+'px" src="'+stamp+'" alt="">':'')+'</div><div class="sline">'+esc(label)+'<b>'+esc(name)+'</b>'+(extra||'')+'</div></div>';
}
function acceptedLines(){
  var L=mainLines(), j=(S.tiers.on&&tierSel()>=0)?tierSel():null;
  if(j!=null) L=L.filter(function(l){return inTier(l,j);});
  return L.concat(optLines().filter(function(l){return l.acc;}));
}
function secCond(){
  var sh=S.show; if(!sh.cond) return '';
  var sg=S.sign, A=acceptedCalc(), hasChoice=(S.tiers.on&&tierSel()>=0)||optLines().some(function(l){return l.acc;});
  var choice='';
  if(sh.cdChoice&&hasChoice){
    var accOpts=optLines().filter(function(l){return l.acc;});
    choice='<div class="blk"><div class="h4">Offerta scelta</div><p>'+(S.tiers.on&&tierSel()>=0?'Livello: <b>'+esc(S.tiers.names[tierSel()])+'</b>':'Offerta base')+
      (accOpts.length?'\nOpzioni accettate: '+accOpts.map(function(l){return esc(l.d);}).join(', '):'')+'\nImporto accettato: <b>'+eur(A.tot)+'</b> IVA inclusa</p></div>';
  }
  var cli=sg.cli, extra=(cli.place||cli.date)?'<br>'+esc(cli.place)+(cli.place&&cli.date?', ':'')+esc(dateIt(cli.date)):'<br>Data e luogo';
  return '<section class="page">'+pageHead('Condizioni e accettazione')+'<div class="pg-b"><h2 class="sec">Condizioni e accettazione</h2>'+
    (sh.cdPay?'<div class="blk"><div class="h4">Pagamento</div><p>'+esc(S.pay)+'</p></div>':'')+
    (sh.cdNotes?'<div class="blk"><div class="h4">Note e condizioni</div><p>'+esc(S.notes)+'</p></div>':'')+choice+
    (sh.cdSign?'<div class="sign">'+sigBox('Per la ditta',sg.dit.img,sg.dit.name||S.company.name,'',S.company.stamp)+sigBox('Per accettazione del cliente',cli.img,cli.name||S.client.name,extra)+'</div>':'')+
    '</div>'+pageFoot()+'</section>';
}
function secPlan(){
  var P=S.plan; if(!S.show.planimetria||!P.img) return '';
  var groups={}, order=[];
  P.marks.forEach(function(k,i){ var key=k.k+'|'+k.c; if(!groups[key]){ groups[key]={k:k.k,c:k.c,n:[]}; order.push(key); } groups[key].n.push(i+1); });
  var asp=(P.h&&P.w)?P.h/P.w:0.7, wpx=asp>1.05?Math.round(690*1.05/asp):690;
  var marks=P.marks.map(function(k,i){ return '<span class="mk" style="left:'+(k.x*100)+'%;top:'+(k.y*100)+'%;background:'+k.c+';color:'+(lum(k.c)>0.6?'#111':'#fff')+'">'+(i+1)+'</span>'; }).join('');
  var leg=order.length?'<table class="leg"><tbody>'+order.map(function(key){ var g=groups[key]; return '<tr><td><span class="dot" style="background:'+g.c+'"></span>'+esc(g.k)+'</td><td class="n">'+g.n.length+' pz</td><td>n. '+g.n.join(', ')+'</td></tr>'; }).join('')+'</tbody></table>':'';
  return '<section class="page">'+pageHead('Planimetria')+'<div class="pg-b"><h2 class="sec">Planimetria e posizioni</h2>'+
    '<div class="plan" style="width:'+wpx+'px"><img src="'+P.img+'" alt="">'+marks+'</div>'+leg+'</div>'+pageFoot()+'</section>';
}
function niceStep(range){ var raw=range/4, p=Math.pow(10,Math.floor(Math.log(raw)/Math.LN10)), f=raw/p; return (f<=1?1:f<=2?2:f<=5?5:10)*p; }
function fvChart(R){
  var W=660,H=240,ml=70,mr=16,mt=16,mb=32, N=R.N, lo=Math.min.apply(null,R.cum), hi=Math.max.apply(null,R.cum.concat([0]));
  if(lo>0) lo=0; if(hi<=lo) hi=lo+1;
  var st=niceStep(hi-lo), y0=Math.floor(lo/st)*st, y1=Math.ceil(hi/st)*st;
  var X=function(k){ return ml+(W-ml-mr)*k/N; }, Y=function(v){ return mt+(H-mt-mb)*(1-(v-y0)/(y1-y0)); };
  var g='', v, k;
  for(v=y0;v<=y1+st/2;v+=st){ g+='<line x1="'+ml+'" x2="'+(W-mr)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="#e1e4de"/><text x="'+(ml-8)+'" y="'+(Y(v)+3)+'" text-anchor="end" font-size="10" fill="#5d646c">'+fmt0(v)+'</text>'; }
  var step=N>20?5:(N>10?2:1);
  for(k=0;k<=N;k+=step) g+='<text x="'+X(k)+'" y="'+(H-12)+'" text-anchor="middle" font-size="10" fill="#5d646c">'+k+'</text>';
  var pts=R.cum.map(function(c,i){ return X(i).toFixed(1)+','+Y(c).toFixed(1); }).join(' ');
  var zero='<line x1="'+ml+'" x2="'+(W-mr)+'" y1="'+Y(0)+'" y2="'+Y(0)+'" stroke="#1A1D21" stroke-dasharray="4 3"/>';
  var pay=R.pay!=null&&R.pay<=N?'<circle cx="'+X(R.pay)+'" cy="'+Y(0)+'" r="5" style="fill:var(--b2)" stroke="#1A1D21"/><text x="'+Math.min(W-mr-80,X(R.pay)+8)+'" y="'+(Y(0)-8)+'" font-size="11" font-weight="700" fill="#1A1D21">rientro ≈ '+qfmt(Math.round(R.pay*10)/10)+' anni</text>':'';
  return '<svg class="fvchart" viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg">'+g+zero+'<polyline points="'+pts+'" fill="none" style="stroke:var(--b1)" stroke-width="3" stroke-linejoin="round"/>'+pay+
    '<text x="'+(ml+(W-ml-mr)/2)+'" y="'+(H-1)+'" text-anchor="middle" font-size="10" fill="#5d646c">anni dall\'installazione</text></svg>';
}
function fmt0(v){ return new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(v)+' €'; }
function fvCalc(){
  var f=S.fv, N=Math.max(5,Math.min(30,Math.round(num(f.years))||20));
  var cost=num(f.cost)>0?num(f.cost):totals().tot, net=r2(cost*(1-num(f.detr)/100));
  var prod1=num(f.kwp)*num(f.yield), auto=Math.min(100,Math.max(0,num(f.auto)))/100, c=-net, cum=[c], pay=null, save1=0, k;
  for(k=1;k<=N;k++){
    var prod=prod1*Math.pow(1-num(f.deg)/100,k-1), s=prod*auto*num(f.price)+prod*(1-auto)*num(f.sell);
    if(k===1) save1=s; var prev=c; c+=s; cum.push(c);
    if(pay===null&&c>=0&&s>0) pay=(k-1)+(-prev/s);
  }
  return {N:N,cost:cost,net:net,prod1:prod1,save1:save1,cum:cum,pay:pay,gain:c};
}
function secFv(){
  if(!S.show.fv) return '';
  var f=S.fv, R=fvCalc();
  var kp=function(label,val,sub){ return '<div><small>'+label+'</small><b>'+val+'</b>'+(sub?'<span class="cap">'+sub+'</span>':'')+'</div>'; };
  var rows=[['Potenza dell\'impianto',qfmt(num(f.kwp))+' kWp'],['Producibilità stimata',qfmt(num(f.yield))+' kWh/kWp all\'anno'],['Quota di energia autoconsumata',qfmt(num(f.auto))+'%'],
    ['Costo dell\'energia acquistata',eur(num(f.price))+'/kWh'],['Valore dell\'energia immessa in rete',eur(num(f.sell))+'/kWh'],['Costo dell\'impianto (IVA incl.)',eur(R.cost)]];
  if(num(f.detr)>0) rows.push(['Detrazione o incentivo considerato',qfmt(num(f.detr))+'% del costo']);
  rows.push(['Calo annuo di rendimento dei moduli',qfmt(num(f.deg))+'%']);
  return '<section class="page">'+pageHead('Stima fotovoltaico')+'<div class="pg-b"><h2 class="sec">Stima di produzione e risparmio</h2>'+
    '<div class="kpis">'+kp('Produzione 1° anno',fmt0n(R.prod1)+' kWh')+kp('Risparmio 1° anno',fmt0(R.save1))+kp('Rientro dell\'investimento',R.pay!=null?'≈ '+qfmt(Math.round(R.pay*10)/10)+' anni':'oltre '+R.N+' anni')+'</div>'+
    '<div class="h4">Andamento del guadagno netto, in euro</div>'+fvChart(R)+
    '<p class="note-s">Dopo '+R.N+' anni il saldo cumulato stimato è di '+fmt0(R.gain)+', al netto del costo dell\'impianto.</p>'+
    '<div class="h4" style="margin-top:18px">Ipotesi di calcolo</div><table class="leg"><tbody>'+rows.map(function(r){ return '<tr><td>'+esc(r[0])+'</td><td class="n">'+esc(r[1])+'</td></tr>'; }).join('')+'</tbody></table>'+
    '<p class="note-s">Stima indicativa basata sulle ipotesi indicate: non è una garanzia di produzione o di risparmio. Producibilità, consumi e prezzi dell\'energia possono variare nel tempo.</p></div>'+pageFoot()+'</section>';
}
function fmt0n(v){ return new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(v); }
function parsePhases(){ return lines(S.crono.phases).map(function(l){ var a=l.split('|'); return {n:(a[0]||'').trim(),d:Math.max(1,Math.round(num(a[1]))||1)}; }); }
function isoDate(s){ var p=String(s||'').split('-'); return p.length===3?new Date(+p[0],+p[1]-1,+p[2]):new Date(); }
function addDays(d,n){ var x=new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }
function nextBD(d){ var x=new Date(d.getTime()); while(x.getDay()===0||x.getDay()===6) x.setDate(x.getDate()+1); return x; }
function fmtD(d){ return ('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear(); }
function cronoPlan(){
  var C=S.crono, bd=!!C.bd, cur=isoDate(C.start); if(bd) cur=nextBD(cur);
  return parsePhases().map(function(p){
    var s=cur, e=s, i;
    if(bd){ for(i=1;i<p.d;i++) e=nextBD(addDays(e,1)); cur=nextBD(addDays(e,1)); } else { e=addDays(s,p.d-1); cur=addDays(e,1); }
    return {n:p.n,d:p.d,s:s,e:e};
  });
}
function secCrono(){
  if(!S.show.crono) return '';
  var P=cronoPlan(); if(!P.length) return '';
  var first=P[0].s, last=P[P.length-1].e, DAY=86400000, span=Math.round((last-first)/DAY)+1;
  var weeks=Math.ceil(span/7), ax='', w;
  for(w=0;w<weeks;w++) ax+='<span style="left:'+(w*7/span*100)+'%">sett. '+(w+1)+'</span>';
  var rows=P.map(function(p){
    var l=Math.round((p.s-first)/DAY)/span*100, wd=(Math.round((p.e-p.s)/DAY)+1)/span*100;
    return '<div class="grow"><div><b>'+esc(p.n)+'</b><div class="cap">'+p.d+' '+(p.d===1?'giorno':'giorni')+(S.crono.bd?' lavorativi':'')+' · '+fmtD(p.s)+(p.d>1?' – '+fmtD(p.e):'')+'</div></div><div class="gbar"><i style="left:'+l+'%;width:'+wd+'%"></i></div></div>';
  }).join('');
  return '<section class="page">'+pageHead('Cronoprogramma')+'<div class="pg-b"><h2 class="sec">Tempi di realizzazione</h2>'+
    '<div class="strip" style="grid-template-columns:repeat(3,1fr)"><div><small>Inizio lavori</small><b>'+fmtD(first)+'</b></div><div><small>Fine prevista</small><b>'+fmtD(last)+'</b></div><div class="big"><small>Durata</small><b>'+span+' giorni di calendario</b></div></div>'+
    '<div class="gantt"><div class="gax"><div></div><div class="gaxl">'+ax+'</div></div>'+rows+'</div>'+
    (S.crono.note?'<p class="note-s" style="white-space:pre-line">'+esc(S.crono.note)+'</p>':'')+'</div>'+pageFoot()+'</section>';
}
function secFiducia(){
  var sh=S.show; if(!sh.fiducia) return '';
  var T=S.trust, blocks='', hasWork=false;
  if(sh.trBA&&T.ba.length){ hasWork=true;
    blocks+='<div class="h4" style="margin-top:20px">Prima e dopo</div>'+T.ba.map(function(b){
      return '<div class="ba"><figure>'+(b.before?'<img src="'+b.before+'" alt="">':'<div class="noimg"></div>')+'<figcaption class="cap">Prima'+(b.title?' · '+esc(b.title):'')+'</figcaption></figure><figure>'+(b.after?'<img src="'+b.after+'" alt="">':'<div class="noimg"></div>')+'<figcaption class="cap">Dopo</figcaption></figure></div>';
    }).join('');
  }
  if(sh.trWorks!==false&&(T.works||[]).length){ hasWork=true;
    blocks+='<div class="h4" style="margin-top:24px">Lavori eseguiti</div><div class="works">'+T.works.map(function(w){
      return '<figure><img src="'+w.img+'" alt="">'+(w.cap?'<figcaption class="cap">'+esc(w.cap)+'</figcaption>':'')+'</figure>';
    }).join('')+'</div>';
  }
  if(sh.trRev&&T.rev.length){ hasWork=true;
    blocks+='<div class="h4" style="margin-top:24px">Dicono di noi</div><div class="revs">'+T.rev.map(function(r){
      var st=Math.max(0,Math.min(5,Math.round(num(r.stars))));
      var sz=(r.size==='s'||r.size==='l')?r.size:'m';
      return '<div class="rev'+(r.img&&sz==='l'?' wide':'')+'">'+(st?'<div class="stars">'+new Array(st+1).join('★')+'</div>':'')+'<p>'+esc(r.text)+'</p>'+(r.img?'<img class="rvimg s-'+sz+'" src="'+r.img+'" alt="">':'')+'<b>'+esc(r.name)+'</b></div>';
    }).join('')+'</div>';
  }
  var BG=(T.bgroups||[]).filter(function(g){ return g.items&&g.items.length; });
  if(sh.trBrand&&BG.length){ hasWork=true;
    blocks+='<div class="h4" style="margin-top:24px">Marchi che installiamo</div><div class="bgs">'+BG.map(function(g){
      var tt=String(g.t||'').trim();
      return '<div class="bgr'+(tt?'':' nt')+'">'+(tt?'<div class="bgt">'+esc(tt)+'</div>':'')+'<div class="brands">'+g.items.map(function(b){ return '<img src="'+b.img+'" alt="'+esc(b.name)+'">'; }).join('')+'</div></div>';
    }).join('')+'</div>';
  }
  var ci=sh.trQR?contactItems():[];
  if(ci.length) blocks+='<div class="h4" style="margin-top:26px">'+esc(T.qrTitle||'Contattaci')+'</div><div class="ctl">'+ci.map(function(c){
    return '<a class="cti" href="'+esc(c.url)+'" target="_blank" rel="noopener">'+iconHtml(c)+'<span><b>'+esc(c.k)+'</b><span class="cap">'+esc(c.sub)+'</span></span></a>';
  }).join('')+'</div><p class="note-s">Tocca o clicca su un contatto per aprirlo.</p>';
  if(!blocks) return '';
  var title=hasWork?'Lavori e contatti':'Contatti';
  return '<section class="page">'+pageHead(title)+'<div class="pg-b"><h2 class="sec">'+title+'</h2>'+blocks+'</div>'+pageFoot()+'</section>';
}
function docIntro(title,sub){ return '<h2 class="sec">'+esc(title)+'</h2><p class="lead">'+sub+'</p>'; }
function secConferma(){
  if(!S.show.conferma) return '';
  var D=S.docs.conferma, A=acceptedCalc(), m=S.meta, L=acceptedLines();
  var acc=num(D.accRic);
  var rows=L.map(function(l,i){ return '<tr><td class="n">'+(i+1)+'</td><td>'+esc(l.d)+'</td><td class="n">'+qfmt(num(l.q))+' '+esc(l.u)+'</td><td class="n">'+(econOn()?'':eur(lineTotal(l)))+'</td></tr>'; }).join('')||'<tr><td colspan="4" style="text-align:center;padding:16px">Nessuna voce</td></tr>';
  var tots='<div><span>Imponibile</span><span>'+eur(A.imp)+'</span></div><div><span>IVA '+qfmt(num(m.iva))+'%</span><span>'+eur(A.iva)+'</span></div><div class="grand"><span>Totale</span><span>'+eur(A.tot)+'</span></div>';
  if(acc>0) tots+='<div style="margin-top:6px"><span>Acconto ricevuto</span><span>'+eur(acc)+'</span></div><div class="bal"><span>Saldo residuo</span><span>'+eur(r2(A.tot-acc))+'</span></div>';
  return '<section class="page">'+pageHead('Conferma d\'ordine')+'<div class="pg-b">'+docIntro('Conferma d\'ordine','Si conferma l\'ordine relativo al preventivo n. '+esc(m.num)+' del '+esc(dateIt(m.date))+', per i lavori di seguito indicati.')+
    '<div class="strip" style="grid-template-columns:repeat(3,1fr)"><div><small>Cliente</small><b>'+esc(S.client.name)+'</b></div><div><small>Cantiere</small><b>'+esc(S.client.addr)+'</b></div><div><small>Inizio / fine prevista</small><b>'+(D.inizio?esc(dateIt(D.inizio)):'da definire')+' / '+(D.fine?esc(dateIt(D.fine)):'da definire')+'</b></div></div>'+
    '<table class="qt"><thead><tr><th class="n">#</th><th>Lavorazione</th><th class="n">Q.tà</th><th class="n">Importo</th></tr></thead><tbody>'+rows+'</tbody></table><div class="tots">'+tots+'</div>'+
    '<div class="blk"><div class="h4">Pagamento</div><p>'+esc(S.pay)+'</p></div>'+(D.note?'<div class="blk"><div class="h4">Note</div><p>'+esc(D.note)+'</p></div>':'')+
    '<div class="sign">'+sigBox('Per la ditta',S.sign.dit.img,S.sign.dit.name||S.company.name,'',S.company.stamp)+sigBox('Per il cliente',S.sign.cli.img,S.sign.cli.name||S.client.name,'<br>Data e luogo')+'</div></div>'+pageFoot()+'</section>';
}
function secLavoro(){
  if(!S.show.lavoro) return '';
  var D=S.docs.lavoro, L=acceptedLines();
  var rows=L.map(function(l,i){ return '<tr><td class="n">'+(i+1)+'</td><td>'+esc(l.d)+'</td><td class="n">'+qfmt(num(l.q))+' '+esc(l.u)+'</td><td class="n"><span class="chkbox"></span></td></tr>'; }).join('')||'<tr><td colspan="4" style="text-align:center;padding:16px">Nessuna voce</td></tr>';
  return '<section class="page">'+pageHead('Ordine di lavoro')+'<div class="pg-b">'+docIntro('Ordine di lavoro','Documento interno di cantiere, senza prezzi. Riferimento: preventivo n. '+esc(S.meta.num)+'.')+
    '<div class="strip" style="grid-template-columns:1fr 1fr 1fr"><div><small>Cliente</small><b>'+esc(S.client.name)+'</b></div><div><small>Cantiere</small><b>'+esc(S.client.addr)+'</b></div><div><small>Data intervento</small><b>'+(D.data?esc(dateIt(D.data)):'da definire')+'</b></div></div>'+
    '<div class="two" style="margin-bottom:16px"><div><div class="h4">Squadra</div><p style="margin:0">'+esc(D.squadra||'—')+'</p></div><div><div class="h4">Mezzi e attrezzature</div><p style="margin:0">'+esc(D.mezzi||'—')+'</p></div></div>'+
    '<table class="qt"><thead><tr><th class="n">#</th><th>Lavorazione</th><th class="n">Q.tà</th><th class="n">Eseguito</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    (D.sicurezza?'<div class="blk"><div class="h4">Sicurezza</div><p>'+esc(D.sicurezza)+'</p></div>':'')+(D.note?'<div class="blk"><div class="h4">Note</div><p>'+esc(D.note)+'</p></div>':'')+
    '<div class="sign">'+sigBox('Capo squadra','',S.docs.lavoro.squadra?'':'')+sigBox('Verificato da','','')+'</div></div>'+pageFoot()+'</section>';
}
function colList(){ var t=S.docs.collaudo.list; return lines(t&&t.trim()?t:(COLL[S.model]||'')); }
function secCollaudo(){
  if(!S.show.collaudo) return '';
  var D=S.docs.collaudo, L=colList();
  var rows=L.map(function(l,i){ return '<tr><td class="n">'+(i+1)+'</td><td>'+esc(l)+'</td><td class="n"><span class="chkbox"></span> OK &nbsp; <span class="chkbox"></span> KO &nbsp; <span class="chkbox"></span> N/A</td><td style="width:26%"></td></tr>'; }).join('');
  return '<section class="page">'+pageHead('Verbale di collaudo')+'<div class="pg-b">'+docIntro('Verbale di collaudo e consegna','Impianto: '+esc(MODELS[S.model].name)+'. Riferimento: preventivo n. '+esc(S.meta.num)+'.')+
    '<div class="strip" style="grid-template-columns:1fr 1fr 1fr"><div><small>Cliente</small><b>'+esc(S.client.name)+'</b></div><div><small>Cantiere</small><b>'+esc(S.client.addr)+'</b></div><div><small>Data collaudo</small><b>'+(D.data?esc(dateIt(D.data)):'____ / ____ / ________')+'</b></div></div>'+
    '<table class="qt"><thead><tr><th class="n">#</th><th>Prova o controllo</th><th class="n">Esito</th><th>Note</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    (D.note?'<div class="blk"><div class="h4">Note</div><p>'+esc(D.note)+'</p></div>':'')+
    '<div class="sign">'+sigBox('Il tecnico',S.sign.dit.img,D.tecnico||S.sign.dit.name||'','',S.company.stamp)+sigBox('Per ricevuta e presa in consegna, il cliente',S.sign.cli.img,S.sign.cli.name||S.client.name,'<br>Data e luogo')+'</div></div>'+pageFoot()+'</section>';
}

var lastAppLogo='';
function brandUI(){
  var st=S.style, r=document.documentElement.style, on=lum(st.b1)>0.6?'#111111':'#FFFFFF';
  var bc=APP.col||st.b1; on=lum(bc)>0.6?'#111111':'#FFFFFF'; r.setProperty('--brand',bc); r.setProperty('--on-brand',on); r.setProperty('--accent',bc); r.setProperty('--accent-ink',on);
  var dk=false; try{ var th=document.documentElement.getAttribute('data-theme'); dk=th==='dark'||(th!=='light'&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches); }catch(e){}
  var src=APP.lm==='none'?'':(APP.lm==='own'&&APP.view?APP.view:(st.logo?logoSrcPage():''));
  r.setProperty('--hl',(APP.ls||86)+'px');
  if(src!==lastAppLogo){ lastAppLogo=src; var el=$('app-logo'); if(el) el.innerHTML=src?'<img src="'+src+'" alt="'+esc(S.company.name)+'">':''; }
  var nm=String(S.company.name||'').replace(/\s*(s\.?r\.?l\.?s?|s\.?p\.?a\.?)\s*$/i,'').trim()||'';
  if(APP.name) nm=APP.name; var an=$('app-name'); if(an&&an.textContent!==(nm||'IECI')) an.textContent=nm||'IECI';
  var sf=APP.suf!==''&&APP.suf!=null?APP.suf:'preventivi', a2=document.querySelector('.an2'); if(a2){ var tx=sf?' '+sf:''; if(a2.textContent!==tx) a2.textContent=tx; }
  apSub(); apPrev();
  var t=(nm||'IECI')+(sf?' '+sf:''); if(document.title!==t) document.title=t;
}
function applyBrand(){
  var d=$('doc'),st=S.style,f=FONTS[st.font]||FONTS.tec;
  d.style.setProperty('--b1',st.b1); d.style.setProperty('--b2',st.b2);
  d.style.setProperty('--on1',lum(st.b1)>0.6?'#111111':'#FFFFFF'); d.style.setProperty('--on2',lum(st.b2)>0.6?'#111111':'#FFFFFF');
  d.style.setProperty('--b1t',lum(st.b1)>0.5?mix(st.b1,'#000000',.5):st.b1);
  var lp=$('lp2'); if(lp) lp.style.background=st.b1;
  brandUI();
  d.style.setProperty('--fd',f.fd); d.style.setProperty('--fb',f.fb); d.style.setProperty('--tt',f.tt); d.style.setProperty('--fs',f.fs);
}
var raf=0;

