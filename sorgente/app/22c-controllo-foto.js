/* ===== Controllo foto dei preventivi =====
   Esamina tutti i preventivi salvati: per ogni preventivo conta le schede prodotto con le foto, quelle con foto
   «in arrivo» (riferimenti a file su GitHub non ancora scaricati) e quelle senza foto. «Recupera» prova, in ordine:
   1) i file delle foto su GitHub; 2) la libreria prodotti (scheda con lo stesso nome); 3) le versioni precedenti
   dell'archivio che GitHub conserva (ogni sincronizzazione è una versione), dalla più recente alla più vecchia.
   Le foto ritrovate vengono segnate come nuove, così arrivano anche agli altri dispositivi alla sincronizzazione. */
var CF={ris:[],busy:false};
function cfFoto(p){ var f=(p&&p.photos)||[]; return f.filter(function(x){ return typeof x==='string'&&x; }); }
function cfAnalizza(){
  return DB.quotes.map(function(q){
    var P=(q.data&&q.data.products)||[], r={id:q.id,num:q.num||'',cli:q.client||'',tit:q.title||q.name||'',upd:q.upd||0,n:P.length,con:0,rif:0,senza:0,nomi:[]};
    P.forEach(function(p){ var f=cfFoto(p); if(f.some(function(x){ return x.indexOf('ghf:')===0; })) r.rif++; else if(f.length) r.con++; else { r.senza++; r.nomi.push(p.name||'senza nome'); } });
    return r;
  }).sort(function(a,b){ return b.upd-a.upd; });
}
function cfMostra(){
  var R=CF.ris, el=$('cf-list'); if(!el) return;
  var guai=R.filter(function(r){ return r.rif||r.senza; });
  $('cf-n').textContent=R.length?(guai.length?guai.length+' da vedere':'tutto a posto'):'';
  $('cf-fix').hidden=!guai.length;
  el.innerHTML=R.filter(function(r){ return r.n; }).map(function(r){
    var st=r.rif?'<b class="cf-b w">'+r.rif+' in arrivo</b>':'', se=r.senza?'<b class="cf-b n">'+r.senza+' senza foto</b>':'', ok=!r.rif&&!r.senza;
    return '<div class="cf-r'+(ok?' ok':'')+'"><div class="cf-t"><b>'+esc(r.cli||'Senza cliente')+'</b><small>n. '+esc(r.num)+' · '+esc(r.tit)+'</small>'+(r.senza?'<small class="cf-nm">Senza foto: '+esc(r.nomi.slice(0,4).join(', ')+(r.nomi.length>4?'…':''))+'</small>':'')+'</div><div class="cf-s">'+(ok?'<b class="cf-b ok">'+r.con+'/'+r.n+' con foto</b>':'<span>'+r.con+'/'+r.n+' con foto</span>'+st+se)+'</div></div>';
  }).join('')||'<div class="empty">Nessun preventivo con schede prodotto.</div>';
}
function cfStato(t){ var e=$('cf-st'); if(e) e.textContent=t; }
function cfSegna(p,foto,po,cr){ p.photos=foto.slice(0,MAXPH); p.po=(po||[]).slice(0,p.photos.length); while(p.po.length<p.photos.length) p.po.push(''); if(cr) p.cr=JSON.parse(JSON.stringify(cr)); p.phu=Date.now(); p.phs=phSig(p); }
function cfManca(){ var L=[]; DB.quotes.forEach(function(q){ ((q.data&&q.data.products)||[]).forEach(function(p){ if(!cfFoto(p).length) L.push({q:q,p:p}); }); }); return L; }
// cerca in una versione dell'archivio (copia di sicurezza sul dispositivo o versione precedente su GitHub) le foto
// delle schede che qui non ne hanno; restituisce quante schede ha sistemato
function cfDaVersione(o,toccati){
  var M=cfManca(); if(!o||!o.db||!o.db.quotes||!M.length) return Promise.resolve(0);
  var cerca=[];
  M.forEach(function(m){ var q=o.db.quotes.filter(function(x){ return x.id===m.q.id; })[0], P=(q&&q.data&&q.data.products)||[];
    var p=P.filter(function(x){ return x.id===m.p.id; })[0]||P.filter(function(x){ return lcn(x.name)&&lcn(x.name)===lcn(m.p.name); })[0];
    if(!p||!cfFoto(p).length){ var l=(o.db.prods||[]).filter(function(x){ return lcn(x.name)===lcn(m.p.name)&&cfFoto(x).length; })[0]; p=l||null; }
    if(p&&cfFoto(p).length) cerca.push({m:m,src:p}); });
  if(!cerca.length) return Promise.resolve(0);
  var tmp={foto:o.foto||{},x:cerca.map(function(c){ return {f:cfFoto(c.src).slice(),po:(c.src.po||[]).slice()}; })};
  var serve=ghfRif(tmp).length&&GH.on&&GH.token;
  return (serve?ghfScarica(tmp,true):Promise.resolve()).then(function(){ var n=0;
    cerca.forEach(function(c,k){ if(cfFoto(c.m.p).length) return; var f=tmp.x[k].f.filter(function(u){ return u.indexOf('data:image/')===0; }); if(f.length){ cfSegna(c.m.p,f,tmp.x[k].po.filter(function(u){ return !u||u.indexOf('ghf:')!==0; }),c.src.cr); n++; toccati[c.m.q.id]=1; } });
    return n; });
}
function cfRecupera(){
  if(CF.busy) return; CF.busy=true; $('cf-fix').disabled=true; $('cf-go').disabled=true;
  var trov={gh:0,lib:0,sto:0}, toccati={};
  function fine(msg){
    CF.busy=false; $('cf-fix').disabled=false; $('cf-go').disabled=false;
    var n=trov.gh+trov.lib+trov.sto;
    Object.keys(toccati).forEach(function(id){ var q=DB.quotes.filter(function(x){ return x.id===id; })[0]; if(q) q.upd=Date.now(); });
    if(n){ dbSave(); if(S.qid&&toccati[S.qid]){ var e=DB.quotes.filter(function(x){ return x.id===S.qid; })[0]; if(e){ var dd=JSON.parse(JSON.stringify(e.data)); dd.cat=S.cat; dd.cgroups=S.cgroups; dd.qid=S.qid; S=normalize(dd); doSave(); renderAll(); } } }
    CF.ris=cfAnalizza(); cfMostra();
    var resta=CF.ris.reduce(function(a,r){ return a+r.senza+r.rif; },0);
    cfStato((n?'Recuperate '+n+' schede con foto ('+[trov.gh?trov.gh+' da GitHub':'',trov.lib?trov.lib+' dalla libreria':'',trov.sto?trov.sto+' dalle copie e dalle versioni precedenti':''].filter(Boolean).join(', ')+'). ':'')+(resta?resta+' schede restano senza foto: probabilmente non le hanno mai avute (puoi aggiungerle tu in Prodotti).':'Tutte le schede hanno le loro foto.')+(msg?' '+msg:''));
    if(n){ toast('Foto recuperate: '+n+' schede'); if(GH.on&&GH.token) setTimeout(function(){ ghSync(false); },300); }
  }
  // 1) riferimenti da scaricare
  var p1=(GH.on&&GH.token)?ghFetchFile().then(function(res){ var prima=ghfMancanti(); return ghfRipara(res&&res.o&&res.o.foto).then(function(){ trov.gh=Math.max(0,prima-ghfMancanti()); }); }).catch(function(){}):Promise.resolve();
  p1.then(function(){
    // 2) libreria prodotti
    cfManca().forEach(function(m){ var n=lcn(m.p.name); if(!n) return; var l=DB.prods.filter(function(x){ return lcn(x.name)===n&&cfFoto(x).length&&!cfFoto(x).some(function(f){ return f.indexOf('ghf:')===0; }); })[0]; if(l){ cfSegna(m.p,cfFoto(l),l.po,l.cr); trov.lib++; toccati[m.q.id]=1; } });
    // 2b) copie di sicurezza automatiche su questo dispositivo (le ultime 6)
    return new Promise(function(ris){ if(!cfManca().length) return ris(); snapList(function(A){ var i=0; (function giro(){ if(i>=A.length||!cfManca().length) return ris(); var sn=A[i++]; cfStato('Cerco nelle copie di sicurezza di questo dispositivo: '+i+' di '+A.length+'…'); var o=null; try{ o=JSON.parse(sn.json); }catch(e){} cfDaVersione(o,toccati).then(function(n){ trov.sto+=n; },function(){}).then(giro); })(); }); });
  }).then(function(){
    // 3) versioni precedenti su GitHub
    var M=cfManca(); if(!M.length||!(GH.on&&GH.token)) return fine(!M.length?'':'Collega GitHub per cercare anche nelle versioni precedenti.');
    cfStato('Cerco le foto nelle versioni precedenti dell\'archivio su GitHub…');
    return ghApi('/commits?path='+encodeURIComponent(GHFILE)+'&per_page=60').then(function(r){ return r.json(); }).then(function(C){
      var shas=(C||[]).map(function(c){ return c.sha; }), i=0;
      function prossima(){
        var M=cfManca(); if(!M.length||i>=shas.length) return fine(M.length&&shas.length?'Ho guardato '+i+' versioni precedenti.':'');
        var sha=shas[i++]; cfStato('Cerco nelle versioni precedenti su GitHub: '+i+' di '+shas.length+'…');
        return ghApi('/contents/'+GHFILE+'?ref='+sha,{},true).then(function(r){ return r.json(); }).then(function(o){ return cfDaVersione(o,toccati).then(function(n){ trov.sto+=n; });
        }).catch(function(){}).then(prossima);
      }
      return prossima();
    });
  }).catch(function(e){ fine('Errore: '+(e&&e.message||e)); });
}
$('cf-go').addEventListener('click',function(){ CF.ris=cfAnalizza(); cfMostra(); var g=CF.ris.filter(function(r){ return r.rif||r.senza; }).length; cfStato(CF.ris.length?(g?g+(g===1?' preventivo ha':' preventivi hanno')+' schede senza foto o con foto in arrivo: tocca «Recupera le foto mancanti».':'Controllati '+CF.ris.length+' preventivi: tutte le schede hanno le foto.'):'Nessun preventivo salvato.'); });
$('cf-fix').addEventListener('click',cfRecupera);
(function(T){ if(!T) return; T.cfAnalizza=cfAnalizza; T.cfRecupera=cfRecupera; T.CF=CF; })(window.IECI_T);
