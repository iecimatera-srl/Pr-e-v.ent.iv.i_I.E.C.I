/* ===== Salvataggio continuo su GitHub =====
   Un solo sistema, uguale su Windows e Android, senza pulsanti:
   - ogni modifica è salvata subito sul dispositivo e, dopo 20 secondi di calma (al massimo 90 secondi mentre
     scrivi), anche su GitHub; chiudendo o cambiando app salva all'istante;
   - mentre l'app è aperta, ogni minuto guarda (con una richiesta leggerissima) se un altro dispositivo ha
     cambiato qualcosa e lo porta qui; lo stesso quando riapri l'app o torna la rete;
   - senza rete o con GitHub che non risponde riprova da solo, con pause sempre più lunghe (max 10 minuti);
   - scrive su GitHub SOLO se qui c'è qualcosa di nuovo: due dispositivi non si rimbalzano mai l'archivio;
   - niente si perde: copia di conflitto se lo stesso preventivo cambia su due dispositivi, cestino di 30 giorni
     sincronizzato, una copia completa al giorno su GitHub (cartella «copie») e una sul dispositivo. */
var AUTO={t:0,primo:0,ancora:false,forza:false,letto:0,copiaIn:0,log:null,rT:0};
function autoPar(){ var o=window['IECI_AUTO']||{}; return {quiete:o.quiete||20000,max:o.max||90000,poll:o.poll||60000,ritorno:o.ritorno!=null?o.ritorno:15000}; }
function autoAttivo(){ var P=window.PINPAD; return !!(GH&&GH.on&&GH.token&&GH.repo&&dbReady&&!(P&&P.locked)); }
function autoRete(e){ return !!(e&&!e.status&&/Failed to fetch|NetworkError|Load failed|network|TypeError/i.test(String(e.message||e))); }
function devNome(){
  if(GH&&GH.nome) return GH.nome;
  var u=navigator.userAgent||'';
  return /Android/i.test(u)?'Android':/iPhone|iPad|iPod/i.test(u)?'iPhone/iPad':/Windows/i.test(u)?'Windows':/Macintosh|Mac OS X/i.test(u)?'Mac':/Linux/i.test(u)?'Linux':'Computer';
}
function devModo(){ try{ if(location.protocol==='file:') return 'file'; if(window.matchMedia&&matchMedia('(display-mode: standalone)').matches) return 'app'; }catch(e){} return 'browser'; }
// elenco dei dispositivi che usano l'archivio: ognuno scrive il suo nome, la versione e quando ha salvato
function autoDispositivi(r){
  var o={}, lim=Date.now()-180*864e5;
  Object.keys(r||{}).forEach(function(k){ var v=r[k]; if(v&&v.t>lim) o[k]=v; });
  o[GH.dev]={n:devNome(),a:APP_VER,t:Date.now(),m:devModo(),nq:qVivi(DB.quotes).length};
  var ef=GHFOTO.errScarico?GHFOTO.errScarico+' foto non arrivano da GitHub':GHFOTO.nonCaricate?GHFOTO.nonCaricate+' foto non riesce a caricarle su GitHub':''; if(ef) o[GH.dev].e=ef;
  return o;
}
/* preventivi cambiati qui e non ancora su GitHub: servono a riconoscere un vero conflitto (senza fidarsi degli
   orologi dei dispositivi). Il numero è il «momento» della modifica: dopo un salvataggio riuscito si tolgono solo
   quelli già compresi, non quelli cambiati mentre il salvataggio era in corso. */
function qmodSegna(id){ if(!GH||!GH.on||!id) return; var m=GH.qmod||(GH.qmod={}); m[id]=GH.gen+1; ghStore(); }
function qmodPulisci(gen0){ var m=GH.qmod||{}; Object.keys(m).forEach(function(k){ if(m[k]<=gen0) delete m[k]; }); }
function qDiverso(a,b){
  if(!a||!b) return true; if((a.st||'')!==(b.st||'')) return true;
  try{ return qNorm(a.data||{})!==qNorm(b.data||{}); }catch(e){ return true; }
}
/* ---------- versioni di un preventivo (al posto delle «copie di conflitto») ----------
   Se lo stesso preventivo è stato cambiato su due dispositivi, nell'elenco resta UN SOLO preventivo (il più recente);
   l'altra versione non si perde: è salvata DENTRO il preventivo («Versioni», con data e dispositivo) e con un tocco
   la puoi rimettere. Niente più preventivi doppi nell'archivio. */
function qNormCopia(q){ var d=JSON.parse(JSON.stringify(q.data||{})); if(q.conf&&d.meta&&d.meta.title) d.meta.title=String(d.meta.title).replace(/ · versione di .*$/,''); return qNorm(d); }
function versioneDa(v,dv){ return {id:uid(),t:v.upd||Date.now(),dv:dv||v.dvn||'un altro dispositivo',st:v.st||'',tot:v.tot||0,title:String(v.title||'').replace(/ · versione di .*$/,''),client:v.client||'',name:v.name||'',data:JSON.parse(JSON.stringify(v.data||{}))}; }
// mette la versione v dentro il preventivo q (se non è uguale al preventivo o a una versione che c'è già)
function versioneMetti(q,v,dv){
  if(!q||!v) return false; var x=versioneDa(v,dv); if(x.data&&x.data.meta&&x.data.meta.title) x.data.meta.title=String(x.data.meta.title).replace(/ · versione di .*$/,'');
  var h=qH(x); if(h===qH(q)) return false;
  var A=q.alt||(q.alt=[]); if(A.some(function(a){ return qH(a)===h; })) return false;
  A.unshift(x); q.alt=A.slice(0,8); return true;
}
// unisce le versioni di due copie dello stesso preventivo (arrivate da dispositivi diversi); true se «a» ha preso qualcosa
// (le versioni tolte apposta restano tolte anche sugli altri dispositivi: «altVia» ne tiene il ricordo)
function versioniUnisci(a,b){
  if(!a||!b) return false; var via={}, nuovo=false;
  (a.altVia||[]).concat(b.altVia||[]).forEach(function(id){ via[id]=1; }); var lv=Object.keys(via); if(lv.length){ if((a.altVia||[]).length!==lv.length) nuovo=true; a.altVia=lv.slice(-60); }
  var A=(a.alt||[]).filter(function(x){ return !via[x.id]; }), ids={}; A.forEach(function(x){ ids[x.id]=1; });
  (b.alt||[]).forEach(function(x){ if(!ids[x.id]&&!via[x.id]){ A.push(x); ids[x.id]=1; nuovo=true; } });
  // niente doppioni: la stessa versione arrivata da due dispositivi resta una (e non quella uguale al preventivo in uso)
  A.sort(function(p,q){ return ((q.t||0)-(p.t||0))||(p.id<q.id?-1:1); });
  var hs={}; hs[qH(a)]=1; A=A.filter(function(x){ var h=qH(x); if(hs[h]) return false; hs[h]=1; return true; });
  if(A.length) a.alt=A.slice(0,8); else delete a.alt; return nuovo;
}
function versioniVia(q,ids){ q.alt=(q.alt||[]).filter(function(x){ return ids.indexOf(x.id)<0; }); q.altVia=(q.altVia||[]).concat(ids).slice(-60); if(!q.alt.length) delete q.alt; }
// «Usa questa versione»: diventa il preventivo; quello di adesso diventa a sua volta una versione (niente si perde)
function versioneUsa(qid,vid){
  if(S.qid===qid&&dbReady) saveQuote(true);
  var q=DB.quotes.filter(function(x){ return x.id===qid; })[0]; if(!q||!q.alt) return; var v=q.alt.filter(function(x){ return x.id===vid; })[0]; if(!v) return;
  var ora=Date.now(), cur=versioneDa(q,devNome()); cur.t=q.upd||ora;
  if(!(GH.qmod||{})[q.id]) q.bu=q.upd||0;
  q.data=JSON.parse(JSON.stringify(v.data)); q.data.qid=q.id; q.st=v.st||q.st; q.tot=v.tot; if(v.title) q.title=v.title; if(v.client) q.client=v.client; if(v.name) q.name=v.name;
  q.alt=[cur].concat(q.alt.filter(function(x){ return x.id!==vid; })).slice(0,8); q.altVia=(q.altVia||[]).concat([vid]).slice(-60); q.upd=ora; q.dvn=devNome(); delete q.dsc; qmodSegna(q.id);
  dbSave(); qRicarica(q.id); renderArchivio(); toast('Rimessa la versione di '+v.dv+' del '+stamp(v.t)+': quella di prima resta tra le versioni');
}
function versioneTogli(qid,vid){ var q=DB.quotes.filter(function(x){ return x.id===qid; })[0]; if(!q) return; versioniVia(q,[vid]); if(!(q.alt||[]).length) delete q.dsc; q.upd=Date.now(); qmodSegna(q.id); dbSave(); renderArchivio(); toast('Versione tolta'); }
/* le «copie di conflitto» delle versioni di prima diventano versioni dentro il loro preventivo: l'elenco torna pulito.
   Se il preventivo originale non c'è più, la copia diventa un preventivo normale (non si perde). */
function copiePulisci(){
  if(!dbReady) return 0; var n=0, ora=Date.now();
  var aperto='';
  DB.quotes.filter(function(q){ return q.conf; }).forEach(function(c){
    var o=DB.quotes.filter(function(x){ return x.id===c.conf.orig&&!x.conf; })[0];
    if(o){ versioneMetti(o,c,c.conf.dv); o.upd=Math.max(o.upd||0,ora); DB.del[c.id]=Math.max(ora,(c.upd||0)+1); c._via=1; n++; if(CEST.vista) delete CEST.vista['q:'+c.id]; /* è già dentro il suo preventivo: nel cestino sarebbe solo un doppione */ if(S.qid===c.id) aperto=o.id; }
    else { c.title=String(c.title||'').replace(/ · versione di .*$/,''); if(c.data&&c.data.meta&&c.data.meta.title) c.data.meta.title=String(c.data.meta.title).replace(/ · versione di .*$/,''); delete c.conf; c.upd=ora; n++; }
  });
  if(n){ DB.quotes=DB.quotes.filter(function(q){ return !q._via; }); if(aperto){ S.qid=aperto; qRicarica(aperto); } dbSave(); renderArchivio(); autoLog('rip',{nome:n===1?'1 copia doppia rimessa dentro il suo preventivo, come versione':n+' copie doppie rimesse dentro i loro preventivi, come versioni'}); toast(n===1?'Sistemata 1 copia doppia: ora è una versione dentro il suo preventivo':'Sistemate '+n+' copie doppie: ora sono versioni dentro i loro preventivi'); }
  return n;
}
function copiaTieni(id){ var c=DB.quotes.filter(function(q){ return q.id===id; })[0]; if(c&&c.conf) copiePulisci(); }
function copieTutteVia(){ copiePulisci(); }
// conflitto durante la sincronizzazione: la versione che non vince va DENTRO il preventivo che vince
function copiaConflitto(v,vince){
  if(!vince){ return; }
  if(versioneMetti(vince,v,v.dvn)) autoLog('conf',{nome:qName(v),dv:v.dvn||'un altro dispositivo'});
}

/* ---------- il motore ---------- */
function ghPushSoon(){
  if(!GH) return; GH.gen++;
  if(GH.on&&!GH.dirty){ GH.dirty=true; ghStore(); }
  ghChip(); autoProgramma();
}
function autoProgramma(rit){
  if(!AUTO||!autoAttivo()) return;
  var ora=Date.now(), P=autoPar();
  if(!AUTO.primo) AUTO.primo=ora;
  var d=rit!=null?rit:Math.max(500,Math.min(P.quiete,AUTO.primo+P.max-ora));
  if(GH.prossimo&&GH.prossimo-ora>d) d=GH.prossimo-ora;
  clearTimeout(AUTO.t); AUTO.t=setTimeout(autoVai,d);
}
function autoVai(){
  AUTO.t=0; if(!autoAttivo()) return;
  if(ghBusy){ AUTO.ancora=true; return; }
  ghPrepara();
  if(GH.dirty) ghSync(false); else { AUTO.primo=0; ghChip(); }
}
// c'è qualcosa di nuovo su GitHub? (con ETag: se non è cambiato niente GitHub risponde «304» senza dati)
function autoControlla(forza){
  if(!autoAttivo()||ghBusy) return;
  if(!forza&&(document.hidden||(GH.prossimo&&Date.now()<GH.prossimo))) return;
  AUTO.letto=Date.now();
  if(GH.dirty){ if(!AUTO.t) autoProgramma(); return; }
  var h={}; if(GH.etag) h['If-None-Match']=GH.etag;
  ghApi('/contents/'+GHFILE,{headers:h}).then(function(r){
    var et=r.headers.get('ETag')||'';
    return r.json().then(function(m){
      if(GH.rete||GH.err){ GH.rete=false; GH.err=''; GH.errN=0; GH.prossimo=0; ghStore(); ghChip(); }
      if(m&&m.sha&&m.sha!==GH.sha) ghSync(false); else if(et) GH.etag=et;
    });
  }).catch(function(e){
    if(e&&e.status===304){ if(GH.rete||GH.err){ GH.rete=false; GH.err=''; ghChip(); } return; }
    if(e&&e.status===404){ ghSync(false); return; } // l'archivio su GitHub non c'è più: lo riscrivo con quello di qui
    if(autoRete(e)){ if(!GH.rete){ GH.rete=true; GH.err=ghErr(e); ghChip(); } return; }
    GH.err=ghErr(e); GH.rete=false; ghChip();
  });
}
function autoEsci(){ if(!autoAttivo()) return; ghPrepara(); if(GH.dirty&&!ghBusy){ GH.prossimo=0; ghSync(false); } }
function autoTorna(){ if(!autoAttivo()) return; if(Date.now()-(AUTO.letto||0)>autoPar().ritorno) autoControlla(true); }
document.addEventListener('visibilitychange',function(){ if(document.hidden) autoEsci(); else autoTorna(); });
window.addEventListener('pagehide',autoEsci);
window.addEventListener('focus',autoTorna);
window.addEventListener('online',function(){ if(!autoAttivo()) return; GH.prossimo=0; if(GH.dirty) autoProgramma(800); else autoControlla(true); });
(function giro(){ var P=autoPar(); setTimeout(function(){ if(autoAttivo()&&!document.hidden&&Date.now()-(AUTO.letto||0)>=P.poll-500) autoControlla(); giro(); },Math.max(1000,Math.min(15000,P.poll/2))); })();

/* ---------- registro delle attività ---------- */
function autoLogLeggi(){ if(!AUTO) return []; if(!AUTO.log){ try{ AUTO.log=JSON.parse(localStorage.getItem('ieci-gh-log')||'[]'); }catch(e){ AUTO.log=[]; } if(!Array.isArray(AUTO.log)) AUTO.log=[]; } return AUTO.log; }
function autoLog(k,x){
  x=x||{}; var L=autoLogLeggi(), n='', arr=(x.nuovi||0)+(x.agg||0);
  if(k==='su') n='Salvato su GitHub'+(arr?(arr===1?' · arrivato 1 preventivo':' · arrivati '+arr+' preventivi')+' da un altro dispositivo':'');
  else if(k==='giu'){ if(!arr) return; n='Arrivati da un altro dispositivo: '+arr+(arr===1?' preventivo':' preventivi'); }
  else if(k==='rete') n='Senza rete: modifiche tenute al sicuro qui, riprovo da solo';
  else if(k==='err') n='GitHub non ha risposto: '+(x.msg||'')+' Riprovo da solo.';
  else if(k==='copia') n='Copia del giorno su GitHub (copie/'+x.g+'.json)';
  else if(k==='conf') n='«'+x.nome+'» cambiato su due dispositivi: tenute tutte e due le versioni, scegli tu quale vale';
  else if(k==='rip') n='Ripristinato: '+x.nome;
  else n=String(x.msg||k);
  if(L[0]&&L[0].k===k&&L[0].n===n&&(k==='rete'||k==='err')){ L[0].t=Date.now(); }
  else L.unshift({t:Date.now(),k:k,n:n});
  AUTO.log=L.slice(0,40); try{ localStorage.setItem('ieci-gh-log',JSON.stringify(AUTO.log)); }catch(e){}
  autoRender();
}
// una copia completa al giorno anche su GitHub, in un file a parte (la scrive il primo dispositivo che salva)
function autoCopiaGh(txt){
  var dd=new Date(), g=dd.getFullYear()+'-'+('0'+(dd.getMonth()+1)).slice(-2)+'-'+('0'+dd.getDate()).slice(-2); if(GH.copiaGh===g||AUTO.copiaIn||!txt) return; AUTO.copiaIn=1;
  ghPut(null,txt,'copie/'+g+'.json','Copia del giorno '+g+' ('+devNome()+')')
    .then(function(){ GH.copiaGh=g; ghStore(); autoLog('copia',{g:g}); },function(e){ if(e&&e.status===422){ GH.copiaGh=g; ghStore(); } })
    .then(function(){ AUTO.copiaIn=0; });
}

/* ---------- cestino: 30 giorni, uguale su tutti i dispositivi ---------- */
var CEST={vista:null}, CEST_K={q:'quotes',c:'clients',p:'prods',a:'arts'}, CEST_N={q:'Preventivo',c:'Cliente',p:'Prodotto',a:'Articolo del listino'};
// a ogni salvataggio dell'archivio: quello che è sparito ed è segnato come eliminato va nel cestino
function cestOsserva(ns){
  if(!dbReady) return;
  var nuova={}, del=DB.del||{};
  Object.keys(CEST_K).forEach(function(k){ (DB[CEST_K[k]]||[]).forEach(function(x){ if(x&&x.id) nuova[k+':'+x.id]=x; }); });
  if(CEST.vista){ var n=0; Object.keys(CEST.vista).forEach(function(key){ if(nuova[key]) return; var id=key.slice(2); if(del[id]){ delInfoMetti(id,key[0],CEST.vista[key],del[id],ns); if(cestMetti(key[0],CEST.vista[key],del[id])) n++; } }); if(n) setTimeout(renderCest,0); }
  CEST.vista=nuova;
}
function cestMetti(k,x,t,v){
  var C=DB.cest||(DB.cest=[]);
  if(!v&&C.some(function(e){ return e.oid===x.id&&!e.v&&!e.r; })) return false;
  C.unshift({id:uid(),oid:x.id,k:k,t:t||Date.now(),dv:devNome(),v:v?1:0,it:JSON.parse(JSON.stringify(x))});
  cestPulisci(); return true;
}
function cestPulisci(){ var lim=Date.now()-30*864e5; DB.cest=(DB.cest||[]).filter(function(e){ return e&&e.t>lim; }).sort(function(a,b){ return b.t-a.t; }).slice(0,80); }
function cestUnisci(R){
  var C=DB.cest||(DB.cest=[]), mio=false, idx={};
  (R||[]).forEach(function(e){ if(e&&e.id) idx[e.id]=e; });
  var lim=Date.now()-30*864e5;
  C.forEach(function(e){ var r=idx[e.id]; if(e.t>lim&&(!r||(e.r||0)>(r.r||0))) mio=true; });
  (R||[]).forEach(function(r){ if(!r||!r.id) return; var e=C.filter(function(x){ return x.id===r.id; })[0]; if(!e) C.push(r); else if((r.r||0)>(e.r||0)) e.r=r.r; });
  cestPulisci(); return mio;
}
function cestNome(e){ var x=e.it||{}; return e.k==='q'?qName(x):(x.name||x.d||'senza nome'); }
function cestVisibili(){
  return (DB.cest||[]).filter(function(e){ if(e.r) return false; if(e.v) return true; var L=DB[CEST_K[e.k]]||[]; return !L.some(function(x){ return x.id===e.oid; }); });
}
function renderCest(){
  var el=$('cs-list'); if(!el) return; var L=cestVisibili(), n=$('cs-n'); if(n) n.textContent=L.length?String(L.length):'';
  el.innerHTML=L.map(function(e){
    return '<div class="rowc cs-r"><span class="cs-k cs-'+e.k+'">'+esc(CEST_N[e.k]||'')+'</span><div style="flex:1 1 180px;min-width:0"><b>'+esc(cestNome(e))+'</b><div class="hint">'+(e.k==='q'&&e.it&&e.it.title?esc(e.it.title)+' · ':'')+(e.v?'versione sostituita il ':'eliminato il ')+esc(stamp(e.t))+(e.dv?' · '+esc(e.dv):'')+(e.k==='q'&&e.it&&e.it.tot!=null?' · '+eur(e.it.tot):'')+'</div></div><button type="button" class="btn sm" data-csr="'+esc(e.id)+'">Ripristina</button></div>';
  }).join('')||'<div class="empty">Il cestino è vuoto. Quello che elimini resta qui 30 giorni, su tutti i dispositivi.</div>';
}
function qRicarica(id){
  if(S.qid!==id) return; var e=DB.quotes.filter(function(x){ return x.id===id; })[0]; if(!e||!e.data) return;
  var dd=JSON.parse(JSON.stringify(e.data)); dd.cat=S.cat; dd.cgroups=S.cgroups; dd.trust=S.trust; dd.profile=S.profile; dd.company=S.company; dd.msgs=S.msgs; dd.ccond=S.ccond; dd.mtpl=S.mtpl; dd.mdef=S.mdef; dd.qid=id;
  S=normalize(dd); QDV[id]=docVer; edFissa(e); doSave(); renderAll();
}
// rimette un elemento (preventivo, cliente, prodotto, articolo) nell'archivio; le foto su GitHub si riscaricano
function rimetti(k,x,fotoMappa){
  var L=DB[CEST_K[k]]||(DB[CEST_K[k]]=[]), ex=L.filter(function(y){ return y.id===x.id; })[0];
  if(ex){ cestMetti(k,ex,Date.now(),true); if(k==='q'){ x.bu=(GH.qmod||{})[ex.id]?ex.bu:ex.upd; } L[L.indexOf(ex)]=x; }
  else { if((DB.del||{})[x.id]) x.id=uid(); L.push(x); }
  x.upd=Date.now(); delete x.conf;
  if(k==='q'){ if(x.data) x.data.qid=x.id; qmodSegna(x.id); } else L.sort(byName);
  var tmp={foto:fotoMappa||{},x:x}, serve=GH.on&&GH.token&&ghfRif(tmp).length;
  return (serve?ghfScarica(tmp,true).catch(function(){}):Promise.resolve()).then(function(){
    L[L.indexOf(x)]=tmp.x; dbSave(); if(k==='q') qRicarica(tmp.x.id); renderArchivio(); renderCest();
    autoLog('rip',{nome:k==='q'?qName(tmp.x):(tmp.x.name||'')}); return tmp.x;
  });
}
function cestRipristina(eid){
  var e=(DB.cest||[]).filter(function(x){ return x.id===eid; })[0]; if(!e) return;
  var x=JSON.parse(JSON.stringify(e.it)); e.r=Date.now();
  rimetti(e.k,x,AUTO.foto||{}).then(function(y){ toast('Ripristinato: «'+(e.k==='q'?qName(y):(y.name||''))+'»'); });
}
$('cs-list').addEventListener('click',function(ev){ var b=ev.target.closest('[data-csr]'); if(b) cestRipristina(b.getAttribute('data-csr')); });

/* ---------- torna indietro nel tempo: copie dei giorni passati (GitHub e dispositivo) ---------- */
var TP={fonti:[],o:null,fonte:null};
function tpStato(t){ var e=$('tp-st'); if(e) e.textContent=t||''; }
function tempoFonti(){
  tpStato('Cerco le copie…'); TP.o=null;
  snapList(function(a){
    var L=a.map(function(s,i){ return {k:'loc',i:i,t:s.t,nome:'Copia su questo dispositivo',sub:s.why}; });
    var gh=(GH.on&&GH.token)?ghApi('/contents/copie').then(function(r){ return r.json(); }).then(function(arr){
      (Array.isArray(arr)?arr:[]).filter(function(f){ return /^\d{4}-\d{2}-\d{2}\.json$/.test(f.name); }).forEach(function(f){ L.push({k:'gh',path:f.path,t:Date.parse(f.name.slice(0,10)+'T23:59:00'),g:f.name.slice(0,10),nome:'Copia del giorno su GitHub',sub:'copie/'+f.name}); });
    }).catch(function(){}):Promise.resolve();
    gh.then(function(){ L.sort(function(a,b){ return b.t-a.t; }); TP.fonti=L; tempoMostraFonti(); });
  });
}
function tempoMostraFonti(){
  var el=$('tp-list'); if(!el) return; var L=TP.fonti;
  tpStato(L.length?'Scegli un giorno: vedi i preventivi di allora e rimetti quello che ti serve.':'Ancora nessuna copia: la prima si crea da sola oggi.');
  el.innerHTML=L.map(function(f,i){ return '<div class="rowc"><span class="tp-ico '+f.k+'">'+(f.k==='gh'?'GitHub':'Qui')+'</span><div style="flex:1 1 180px;min-width:0"><b>'+esc(f.g?dateIt(f.g):stamp(f.t))+'</b><div class="hint">'+esc(f.nome)+' · '+esc(f.sub||'')+'</div></div><button type="button" class="btn sm ghost" data-tpo="'+i+'">Apri</button></div>'; }).join('');
}
function tempoApri(i){
  var f=TP.fonti[i]; if(!f) return; tpStato('Apro la copia…');
  var pr=f.k==='gh'?ghApi('/contents/'+f.path,{},true).then(function(r){ return r.json(); }):new Promise(function(ok,ko){ snapList(function(a){ try{ ok(JSON.parse(a[f.i].json)); }catch(e){ ko(e); } }); });
  pr.then(function(o){ if(!o||!o.db) throw new Error('x'); TP.o=o; TP.fonte=f; tempoMostra(); }).catch(function(){ tpStato('Non riesco ad aprire questa copia. Riprova o scegline un\'altra.'); });
}
function tempoMostra(){
  var o=TP.o, el=$('tp-list'); if(!o||!el) return;
  var Q=(o.db.quotes||[]).slice().sort(function(a,b){ return (b.upd||0)-(a.upd||0); }), nd=0;
  var righe=Q.map(function(q){
    var cur=DB.quotes.filter(function(x){ return x.id===q.id; })[0], st, cl;
    if(!cur){ st=(DB.del||{})[q.id]?'eliminato dopo':'non c\'è più'; cl='via'; nd++; }
    else if(qDiverso(cur,q)){ st='diverso da adesso'; cl='div'; nd++; }
    else { st='uguale ad adesso'; cl='ug'; }
    return '<div class="rowc tp-q '+cl+'"><div style="flex:1 1 180px;min-width:0"><b>'+esc(qName(q))+'</b><div class="hint">n. '+esc(q.num||'')+' · '+eur(q.tot||0)+' · salvato '+esc(stamp(q.upd||0))+' · <b class="tp-'+cl+'">'+st+'</b></div></div>'+(cl==='ug'?'':'<button type="button" class="btn sm" data-tpr="'+esc(q.id)+'">'+(cl==='via'?'Rimetti':'Torna a questa')+'</button>')+'</div>';
  }).join('');
  tpStato((TP.fonte.g?dateIt(TP.fonte.g):stamp(TP.fonte.t))+': '+Q.length+' preventivi, '+nd+' diversi da adesso. La versione di adesso non si perde: va nel cestino.');
  el.innerHTML='<div class="row"><button type="button" class="btn ghost sm" id="tp-back">‹ Tutte le copie</button></div>'+(righe||'<div class="empty">In questa copia non ci sono preventivi.</div>');
}
function tempoRipristina(id){
  var o=TP.o; if(!o) return; var q=(o.db.quotes||[]).filter(function(x){ return x.id===id; })[0]; if(!q) return;
  rimetti('q',JSON.parse(JSON.stringify(q)),o.foto||{}).then(function(y){ toast('Rimesso: «'+qName(y)+'»'); tempoMostra(); });
}
$('tp-go').addEventListener('click',tempoFonti);
$('tp-list').addEventListener('click',function(ev){ var b;
  if((b=ev.target.closest('[data-tpo]'))) return tempoApri(+b.getAttribute('data-tpo'));
  if((b=ev.target.closest('[data-tpr]'))) return tempoRipristina(b.getAttribute('data-tpr'));
  if(ev.target.closest('#tp-back')){ TP.o=null; tempoMostraFonti(); }
});

/* ---------- pannello: stato, dispositivi, registro ---------- */
function autoRender(){
  if(!AUTO) return; clearTimeout(AUTO.rT); AUTO.rT=setTimeout(autoRenderOra,60);
}
function svQuando(t){ if(!t) return 'mai'; var s=Math.round((Date.now()-t)/1000); if(s<60) return 'adesso'; if(s<3600) return Math.round(s/60)+' min fa'; return svAgo(t); }
function autoRenderOra(){
  var em=$('as-em'); if(em) em.textContent=!GH.on?'non collegato':ghBusy?'salvo…':GH.err?(GH.rete?'offline':'da controllare'):'automatico ✓';
  if(em) em.setAttribute('data-st',!GH.on?'off':GH.err?(GH.rete?'net':'err'):'ok');
  var top=$('as-top'); if(!top) return;
  var box=$('as-box'); if(box) box.hidden=!GH.on;
  if(!GH.on) return;
  var st=$('gh-chip')?$('gh-chip').getAttribute('data-st'):'ok';
  var tit={ok:'Tutto salvato su GitHub',run:'Sto salvando su GitHub…',dirty:'Modifiche al sicuro qui, su GitHub tra pochi secondi',net:'Senza rete: tutto al sicuro qui, riprovo da solo',err:'GitHub non risponde: riprovo da solo',off:''}[st]||'';
  top.setAttribute('data-st',st);
  top.innerHTML='<i aria-hidden="true"></i><div><b>Salvataggio automatico attivo</b><small>'+esc(tit)+(GH.last&&st==='ok'?' · ultimo controllo '+esc(svQuando(GH.last)):'')+(GH.err&&!GH.rete?' · '+esc(GH.err):'')+'</small></div>';
  var D=GH.disp||{}, ks=Object.keys(D).sort(function(a,b){ return (a===GH.dev?-1:b===GH.dev?1:(D[b].t||0)-(D[a].t||0)); });
  if(!D[GH.dev]) ks.unshift(GH.dev);
  var md={app:'app installata',browser:'nel browser',file:'file sul computer'};
  $('as-disp').innerHTML=ks.map(function(k){ var v=D[k]||{n:devNome(),a:APP_VER,m:devModo()}, me=k===GH.dev, vec=v.a&&verCmp(v.a,APP_VER)<0;
    return '<div class="as-d'+(me?' me':'')+'"><span class="as-di '+(/Android|iPhone/i.test(v.n||'')?'tel':'pc')+'" aria-hidden="true"></span><div><b>'+esc(me?devNome():(v.n||'Dispositivo'))+(me?' <small>(questo)</small>':'')+'</b><small>'+esc(md[v.m]||'')+' · versione '+esc(v.a||'?')+(v.nq!=null?' · '+v.nq+(v.nq===1?' preventivo':' preventivi'):'')+(v.t?' · salvato '+esc(svQuando(v.t)):'')+'</small>'+(v.e?'<small class="as-vec">'+esc(v.e)+'</small>':'')+(vec?'<small class="as-vec">Versione vecchia: aggiornala su quel dispositivo</small>':'')+'</div></div>';
  }).join('');
  var L=autoLogLeggi().slice(0,8);
  $('as-log').innerHTML=L.map(function(x){ return '<li class="as-l '+esc(x.k)+'"><time>'+esc(stamp(x.t))+'</time><span>'+esc(x.n)+'</span></li>'; }).join('')||'<li class="as-l"><span>Qui compaiono i salvataggi e quello che arriva dagli altri dispositivi.</span></li>';
  if(typeof trRender==='function') trRender();
  var nm=$('as-nome'); if(nm&&document.activeElement!==nm){ nm.value=GH.nome||''; nm.placeholder=devNome(); }
}
$('as-nome').addEventListener('change',function(e){ GH.nome=String(e.target.value||'').trim().slice(0,30); ghStore(); autoRender(); toast('Nome del dispositivo: '+devNome()); if(GH.on){ GH.dirty=true; autoProgramma(1500); } });
(function(){ var iv=setInterval(function(){ if(dbReady){ clearInterval(iv); if(!CEST.vista) cestOsserva(); cestPulisci(); copiePulisci(); renderCest(); autoRender(); } },300); })();
(function(T){ if(!T) return; T.APP=function(){ return APP; }; T.snapSave=snapSave; T.snapList=snapList; T.restoreObj=restoreObj; T.MENU=function(){ return MENU; }; T.settingsStamp=settingsStamp; T.menuSave=menuSave; T.apStore=apStore; T.auto={copiePulisci:copiePulisci,copiaTieni:copiaTieni,vai:autoVai,controlla:autoControlla,programma:autoProgramma,stato:function(){ return AUTO; },log:autoLogLeggi,cest:function(){ return DB.cest||[]; },cestRipristina:cestRipristina,tempoFonti:tempoFonti,tempoApri:tempoApri,tempoRipristina:tempoRipristina,qmod:function(){ return GH.qmod||{}; }}; })(window.IECI_T);
