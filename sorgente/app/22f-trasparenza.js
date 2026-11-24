/* ===== Salvataggio trasparente: si vede sempre cosa c'è, dove, e cosa non va =====
   - chi ha eliminato cosa e quando (per tutti i dispositivi);
   - controllo di coerenza dopo ogni sincronizzazione: preventivi qui e su GitHub, con le differenze per nome;
   - ogni dispositivo scrive nell'archivio il suo stato (versione, numero di preventivi, ultimo problema);
   - avviso ben visibile se questo dispositivo non salva da tempo, o se un altro è fermo o ha una versione vecchia;
   - «Dov'è il mio preventivo?»: cerca un nome ovunque (qui, versioni, cestino, eliminati, GitHub, copie dei giorni
     passati, copie sul dispositivo) e lo rimette con un tocco. */

/* ---------- chi ha eliminato cosa ---------- */
function delInfoMetti(id,k,x,t,altrove){
  var I=DB.delI||(DB.delI={}); if(I[id]&&(I[id].t||0)>=(t||0)) return;
  I[id]={t:t||Date.now(),dv:altrove?'':devNome(),k:k,n:k==='q'?qName(x):String((x&&(x.name||x.d))||'')};
}
function delInfoUnisci(R){
  var I=DB.delI||(DB.delI={}), mio=false, lim=Date.now()-365*864e5;
  Object.keys(R||{}).forEach(function(id){ var r=R[id]; if(!r) return; var l=I[id]; if(!l||(r.t||0)>(l.t||0)||(!l.dv&&r.dv)) I[id]=r; });
  Object.keys(I).forEach(function(id){ if((I[id].t||0)<lim){ delete I[id]; return; } var r=R&&R[id]; if(!r||(I[id].dv&&!r.dv)) mio=true; });
  return mio;
}

/* ---------- stato dei dispositivi e coerenza ---------- */
var COER={t:0,qui:0,gh:0,mancaQui:[],mancaGh:[]};
function qVivi(L){ return (L||[]).filter(function(q){ return q&&!q.conf&&!eliminato(q); }); }
function coerCalcola(o){
  if(!o||!o.db) return; var del=DB.del||{}, R={}, Lq={};
  (o.db.quotes||[]).forEach(function(q){ var t=(o.db.del||{})[q.id]||del[q.id]; if(!q.conf&&!(t&&t>=(q.upd||0))) R[q.id]=q; });
  qVivi(DB.quotes).forEach(function(q){ Lq[q.id]=q; });
  var rf=COER.rifatto||0; COER={rifatto:rf,t:Date.now(),qui:Object.keys(Lq).length,gh:Object.keys(R).length,
    mancaQui:Object.keys(R).filter(function(id){ return !Lq[id]; }).map(function(id){ return qName(R[id]); }),
    mancaGh:Object.keys(Lq).filter(function(id){ return !R[id]; }).map(function(id){ return qName(Lq[id]); })};
  if((COER.mancaQui.length||COER.mancaGh.length)&&!GH.dirty&&Date.now()-(COER.rifatto||0)>10*60000){ COER.rifatto=Date.now(); autoLog('err',{msg:'Archivio diverso da GitHub ('+COER.qui+' qui, '+COER.gh+' su GitHub): risistemo da solo.'}); if(typeof autoProgramma==='function') setTimeout(function(){ GH.dirty=true; autoProgramma(1500); },500); }
}
function dispProblemi(){
  var D=GH.disp||{}, ora=Date.now(), P=[];
  Object.keys(D).forEach(function(k){ if(k===GH.dev) return; var v=D[k]||{}, nome=(v.n||'Dispositivo')+(v.m==='file'?' (file sul computer)':v.m==='app'?' (app installata)':'');
    if(v.a&&verCmp(v.a,GH_MIN)<0) P.push({k:k,g:2,t:nome+' ha una versione vecchia dell\'app ('+v.a+'): non riceve e non salva più. Aggiornala su quel dispositivo.'});
    else if(v.t&&ora-v.t>3*864e5) P.push({k:k,g:1,t:nome+' non si collega da '+Math.round((ora-v.t)/864e5)+' giorni: aprilo, così prende le ultime modifiche.'});
    else if(v.e) P.push({k:k,g:1,t:nome+': '+v.e});
  });
  if(GH.on&&GH.err&&GH.errU==='versione vecchia, bloccato') P.unshift({k:GH.dev,g:2,t:GH.err});
  else if(GH.on&&GH.err&&!GH.rete&&(GH.errDa||0)&&ora-GH.errDa>30*60000) P.unshift({k:GH.dev,g:2,t:'Questo dispositivo non riesce a salvare su GitHub da '+Math.round((ora-GH.errDa)/60000)+' minuti: '+GH.err});
  if(GH.on&&GH.rete&&(GH.errDa||0)&&ora-GH.errDa>2*3600000) P.unshift({k:GH.dev,g:1,t:'Questo dispositivo è senza rete da più di 2 ore: le modifiche sono al sicuro qui e partono appena torna la connessione.'});
  var DS=typeof qDaScegliere==='function'?qDaScegliere():[]; if(DS.length) P.unshift({k:'dsc',g:2,t:(DS.length===1?'«'+qName(DS[0])+'» ha due versioni diverse: scegli quale vale (in Archivio).':DS.length+' preventivi hanno due versioni diverse da scegliere: '+DS.slice(0,4).map(qName).join(', ')+'.')});
  if(COER.t&&(COER.mancaQui.length||COER.mancaGh.length)) P.push({k:GH.dev,g:1,t:'Archivio non ancora allineato: '+COER.qui+' preventivi qui, '+COER.gh+' su GitHub. Lo sto risistemando.'});
  return P;
}
function trBanner(){
  if(!GH.on) return ''; var P=dispProblemi(); if(!P.length) return '';
  var g=P.some(function(x){ return x.g===2; });
  return '<div class="tr-ban'+(g?' grave':'')+'" role="status"><b>'+(g?'Salvataggio: c\'è un problema':'Salvataggio: da controllare')+'</b><ul>'+P.slice(0,4).map(function(x){ return '<li>'+esc(x.t)+'</li>'; }).join('')+'</ul><button type="button" class="btn sm" data-trvai>Vedi i dettagli</button></div>';
}
function trRender(){
  var el=$('tr-coer'); if(el){ el.innerHTML=!GH.on?'':(COER.t?'<b>'+(COER.mancaQui.length||COER.mancaGh.length?'⚠ ':'✓ ')+COER.qui+(COER.qui===1?' preventivo':' preventivi')+' qui · '+COER.gh+' su GitHub</b>'+((COER.mancaQui.length||COER.mancaGh.length)?'<small>'+(COER.mancaQui.length?'Su GitHub ma non qui: '+esc(COER.mancaQui.slice(0,5).join(', '))+'. ':'')+(COER.mancaGh.length?'Qui ma non su GitHub: '+esc(COER.mancaGh.slice(0,5).join(', '))+'.':'')+'</small>':'<small>Uguali: ogni preventivo di qui è anche su GitHub e viceversa (controllato '+esc(svQuando(COER.t))+').</small>'):'<small>Il controllo parte alla prossima sincronizzazione.</small>'); }
  if(el&&GH.on){ var P=dispProblemi(); if(P.length) el.innerHTML+='<ul class="tr-pr">'+P.map(function(x){ return '<li class="g'+x.g+'">'+esc(x.t)+'</li>'; }).join('')+'</ul>'; el.setAttribute('data-st',P.some(function(x){ return x.g===2; })?'err':(P.length||COER.mancaQui.length||COER.mancaGh.length)?'warn':'ok'); }
  if(typeof OG!=='undefined'&&$('og')&&!$('og').hidden){ var oh=$('og').querySelector('.tr-ban'), nh=trBanner(); if((oh?oh.outerHTML:'')!==nh){ OG.ult=''; try{ renderOggi(); }catch(x){} } }
}
document.addEventListener('click',function(e){ if(!e.target.closest('[data-trcerca]')) return; var v=($('q-search')||{}).value||''; showPanel('salva'); var a=$('acc-trova'); if(a){ a.open=true; $('tr-q').value=v; setTimeout(function(){ a.scrollIntoView({block:'start',behavior:'smooth'}); },80); if(v.trim()) trCerca(v); } });
document.addEventListener('click',function(e){ if(!e.target.closest('[data-trvai]')) return; showPanel('salva');
  if(typeof qDaScegliere==='function'&&qDaScegliere().length){ renderArchivio(); setTimeout(function(){ var r=document.querySelector('#q-list .rowc.qdsc'); if(r) r.scrollIntoView({block:'center',behavior:'smooth'}); },120); return; } var a=$('acc-sync'); if(a){ a.open=true; setTimeout(function(){ a.scrollIntoView({block:'start',behavior:'smooth'}); },80); } });

/* ---------- «Dov'è il mio preventivo?» ---------- */
var TR={seq:0,ris:[],oggetti:{}};
function trNorm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim(); }
function trCombacia(q,parole){ var t=trNorm([q.client,q.name,q.title,q.num,q.data&&q.data.client&&q.data.client.addr].join(' ')); return parole.every(function(p){ return t.indexOf(p)>-1; }); }
function trAggiungi(r){ TR.ris.push(r); trMostra(); }
function trMostra(fine){
  var el=$('tr-ris'); if(!el) return;
  el.innerHTML=TR.ris.map(function(r,i){ return '<div class="rowc tr-r trc-'+r.c+'"><div class="tr-t"><b>'+esc(r.nome)+'</b><span class="tr-dove">'+esc(r.dove)+'</span>'+(r.det?'<small>'+esc(r.det)+'</small>':'')+'</div>'+(r.az?'<button type="button" class="btn sm" data-tra="'+i+'">'+esc(r.az)+'</button>':'')+'</div>'; }).join('')||(fine?'<div class="empty">Non l\'ho trovato da nessuna parte: né qui, né su GitHub, né nel cestino, né nelle copie dei giorni passati. Prova con un\'altra parola (cognome, via, numero del preventivo).</div>':'');
}
function trStato(t){ var e=$('tr-st'); if(e) e.textContent=t||''; }
function trCerca(testo){
  var parole=trNorm(testo).split(' ').filter(function(p){ return p.length>1; }); if(!parole.length){ trStato('Scrivi il nome del cliente (o una parola del titolo).'); return; }
  var my=++TR.seq; TR.ris=[]; TR.oggetti={}; trMostra(); trStato('Cerco «'+testo+'»…');
  var visti={};
  // 1. qui
  DB.quotes.forEach(function(q){ if(q.conf||!trCombacia(q,parole)) return; visti[q.id]=1; trAggiungi({nome:qName(q),dove:'È qui, nell\'archivio di questo dispositivo',det:'salvato '+stamp(q.upd||0)+(q.dvn?' da '+q.dvn:'')+' · '+eur(q.tot||0),c:'ok',az:'Apri',fa:function(){ openQuote(q.id); }});
    (q.alt||[]).forEach(function(v){ trAggiungi({nome:v.title||qName(q),dove:'È una versione dentro «'+qName(q)+'»',det:(v.dv||'')+' · '+stamp(v.t),c:'ver',az:'Usa questa',fa:function(){ versioneUsa(q.id,v.id); }}); }); });
  // 2. cestino e eliminati
  (DB.cest||[]).forEach(function(e){ if(e.k!=='q'||e.r||!trCombacia(e.it||{},parole)||(!e.v&&visti[e.oid])) return; var di=(DB.delI||{})[e.oid]; trAggiungi({nome:qName(e.it),dove:e.v?'Versione sostituita, nel cestino':'Eliminato'+(di&&di.dv?' su '+di.dv:'')+', è nel cestino',det:stamp(e.t)+(e.dv?' · '+e.dv:''),c:'cest',az:'Ripristina',fa:function(){ cestRipristina(e.id); }}); if(!e.v) visti[e.oid]=1; });
  Object.keys(DB.delI||{}).forEach(function(id){ var d=DB.delI[id]; if(d.k!=='q'||visti[id]||parole.some(function(p){ return trNorm(d.n).indexOf(p)<0; })) return; visti['del:'+id]=1;
    trAggiungi({nome:d.n,dove:'Eliminato'+(d.dv?' su '+d.dv:'')+' il '+stamp(d.t),det:'cerco una copia per rimetterlo…',c:'via'}); });
  var fonti=[];
  if(GH.on&&GH.token){
    fonti.push(function(){ trStato('Guardo su GitHub…'); return ghFetchFile().then(function(res){ var o=res&&res.o; if(!o||!o.db) return; trDaArchivio(o,'È su GitHub ma non su questo dispositivo','salvato su GitHub',parole,visti,'gh'); }); });
    fonti.push(function(){ trStato('Guardo le copie dei giorni passati su GitHub…'); return ghApi('/contents/copie').then(function(r){ return r.json(); }).then(function(arr){
      var L=(Array.isArray(arr)?arr:[]).filter(function(f){ return /^\d{4}-\d{2}-\d{2}\.json$/.test(f.name); }).sort(function(a,b){ return a.name<b.name?1:-1; }).slice(0,20), p=Promise.resolve();
      L.forEach(function(f){ p=p.then(function(){ if(my!==TR.seq) return; return ghApi('/contents/'+f.path,{},true).then(function(r){ return r.json(); }).then(function(o){ trDaArchivio(o,'Nella copia del giorno '+dateIt(f.name.slice(0,10))+' su GitHub','',parole,visti,'copia'); }).catch(function(){}); }); });
      return p; }).catch(function(){}); });
  }
  fonti.push(function(){ trStato('Guardo le copie su questo dispositivo…'); return new Promise(function(ok){ snapList(function(a){ (a||[]).forEach(function(s){ try{ trDaArchivio(JSON.parse(s.json),'Nella copia su questo dispositivo del '+stamp(s.t),'',parole,visti,'copia'); }catch(e){} }); ok(); }); }); });
  var p=Promise.resolve(); fonti.forEach(function(f){ p=p.then(function(){ if(my===TR.seq) return f(); }).catch(function(){}); });
  p.then(function(){ if(my!==TR.seq) return;
    TR.ris.forEach(function(r){ if(r.c==='via'&&r.det==='cerco una copia per rimetterlo…') r.det='nessuna copia trovata da rimettere'; });
    trStato(TR.ris.length?'Ricerca finita: '+TR.ris.length+(TR.ris.length===1?' risultato.':' risultati.'):''); trMostra(true); });
}
function trDaArchivio(o,dove,det,parole,visti,c){
  if(!o||!o.db) return;
  (o.db.quotes||[]).forEach(function(q){ if(q.conf||!trCombacia(q,parole)) return; var qui=DB.quotes.filter(function(x){ return x.id===q.id; })[0];
    var x=JSON.parse(JSON.stringify(q)), foto=o.foto||{};
    if(qui){
      /* è qui: mostro solo le versioni DIVERSE da quella in uso (e da quelle già tra le versioni), con il loro totale:
         così ritrovi, per esempio, il preventivo da 3.500 € quando qui ne vedi uno da 2.400 € */
      var h=qH(q); if(!h||h===qH(qui)||visti['h:'+h]||(qui.alt||[]).some(function(a){ return qH(a)===h; })) return; visti['h:'+h]=1;
      trAggiungi({nome:qName(q)+' · '+eur(q.tot||0),dove:dove+': una versione diversa da quella in uso qui ('+eur(qui.tot||0)+')',det:(det?det+' ':'')+stamp(q.upd||0)+(q.dvn?' da '+q.dvn:''),c:'ver',az:'Mettila tra le versioni',fa:function(){
        var y=DB.quotes.filter(function(z){ return z.id===x.id; })[0]; if(!y) return;
        if(versioneMetti(y,x,x.dvn||'copia')){ daScegliere(y); y.upd=Date.now(); qmodSegna(y.id); dbSave(); renderArchivio(); toast('Aggiunta tra le versioni di «'+qName(y)+'»: in Archivio scegli quella giusta'); } else toast('Questa versione c\'è già'); }});
      return;
    }
    if(visti[q.id]||visti['x:'+q.id]) return; visti['x:'+q.id]=1; // nel cestino, o già trovato in una copia più recente
    TR.ris.forEach(function(r){ if(r.c==='via'&&visti['del:'+q.id]&&r.det==='cerco una copia per rimetterlo…') r.det='qui sotto c\'è una copia da rimettere'; });
    trAggiungi({nome:qName(q),dove:dove,det:(det?det+' ':'')+stamp(q.upd||0)+(q.dvn?' da '+q.dvn:'')+' · '+eur(q.tot||0),c:c,az:'Rimettilo qui',fa:function(){
      if(DB.quotes.some(function(y){ return y.id===x.id; })){ toast('È già nell\'archivio'); return; }
      rimetti('q',x,foto).then(function(y){ toast('Rimesso: «'+qName(y)+'». Va su GitHub e sugli altri dispositivi da solo.'); }); }});
  });
}
$('tr-go').addEventListener('click',function(){ trCerca($('tr-q').value); });
$('tr-q').addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); trCerca(e.target.value); } });
$('tr-ris').addEventListener('click',function(e){ var b=e.target.closest('[data-tra]'); if(!b) return; var r=TR.ris[+b.getAttribute('data-tra')]; if(r&&r.fa){ r.fa(); b.disabled=true; b.textContent='Fatto'; } });
(function(T){ if(!T) return; T.tr={cerca:trCerca,ris:function(){ return TR.ris.map(function(r){ return {nome:r.nome,dove:r.dove,det:r.det,az:r.az||''}; }); },fai:function(i){ var r=TR.ris[i]; if(r&&r.fa) r.fa(); },coer:function(){ return COER; },problemi:dispProblemi,oggi:function(){ var o=ogStato(); return {n:o.n,att:o.att,accM:o.accM,boz:o.boz,si:o.si,no:o.no,daSeg:o.daSeg}; },delI:function(){ return DB.delI||{}; }}; })(window.IECI_T);
