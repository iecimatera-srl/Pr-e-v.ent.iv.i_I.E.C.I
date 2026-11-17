/* ---------- Google Drive (cartella app nascosta, scope drive.appdata) ---------- */
var GD={cid:'',on:false,auto:true,last:0}, gdTok='', gdExp=0, gdBusy=false, gdT=0;
function gdLoad(){ try{ var o=JSON.parse(localStorage.getItem('ieci-gdrive')||'{}'); GD.cid=o.cid||''; GD.on=!!o.on; GD.auto=o.auto!==false; GD.last=o.last||0; }catch(e){} }
function gdStore(){ try{ localStorage.setItem('ieci-gdrive',JSON.stringify(GD)); }catch(e){} }
function gdStatus(t){ var el=$('gd-state'); if(el) el.textContent=t; }
function tokOk(){ return !!gdTok&&Date.now()<gdExp-60000; }
function renderGd(){
  if(!$('gd-cid')) return;
  $('gd-cid').value=GD.cid; $('gd-auto').checked=GD.auto; $('gd-origin').textContent=(location.protocol==='file:')?'(file locale: non utilizzabile, apri l\'app da un indirizzo https)':location.origin;
  $('gd-sync').disabled=!GD.on; $('gd-off').disabled=!GD.on;
  $('gd-on').textContent=GD.on?'Ricollega l\'account':'Collega Google Drive';
  if(!$('gd-state').textContent) gdStatus(GD.on?('Collegato'+(GD.last?'. Ultima sincronizzazione: '+new Date(GD.last).toLocaleString('it-IT'):'')+'. Premi «Sincronizza ora» per riprendere.'):'Non collegato.');
}
function gdScript(cb){
  if(window.google&&google.accounts&&google.accounts.oauth2) return cb(true);
  var s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client'; s.async=true; s.onload=function(){ cb(true); }; s.onerror=function(){ cb(false); }; document.head.appendChild(s);
}
function gdToken(interactive,cb){
  if(tokOk()) return cb(gdTok);
  if(!GD.cid){ gdStatus('Inserisci prima il Client ID Google.'); return cb(''); }
  if(location.protocol==='file:'){ gdStatus('Google non funziona da un file locale: apri l\'app dal suo indirizzo https.'); return cb(''); }
  gdScript(function(ok){
    if(!ok){ gdStatus('Impossibile raggiungere Google (connessione assente o sito bloccato).'); return cb(''); }
    var tc=google.accounts.oauth2.initTokenClient({client_id:GD.cid,scope:'https://www.googleapis.com/auth/drive.appdata',
      callback:function(r){ if(r&&r.access_token){ gdTok=r.access_token; gdExp=Date.now()+(r.expires_in||3600)*1000; cb(gdTok); } else { gdStatus('Accesso non riuscito'+(r&&r.error?': '+r.error:'')+'. Controlla Client ID e origine autorizzata.'); cb(''); } },
      error_callback:function(e){ gdStatus('Accesso annullato o finestra bloccata ('+((e&&e.type)||'errore')+').'); cb(''); }});
    tc.requestAccessToken({prompt:interactive?'consent':''});
  });
}
function gdFetch(url,opt){
  opt=opt||{}; opt.headers=Object.assign({Authorization:'Bearer '+gdTok},opt.headers||{});
  return fetch(url,opt).then(function(r){ if(!r.ok) return r.text().then(function(t){ throw new Error(r.status+' '+t.slice(0,140)); }); return r; });
}
var GDNAME='archivio-preventivi-ieci.json';
function gdFind(){
  return gdFetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields='+encodeURIComponent('files(id,modifiedTime)')+'&q='+encodeURIComponent("name='"+GDNAME+"' and trashed=false"))
    .then(function(r){ return r.json(); }).then(function(j){ return (j.files&&j.files[0])||null; });
}
function gdDownload(id){ return gdFetch('https://www.googleapis.com/drive/v3/files/'+id+'?alt=media').then(function(r){ return r.json(); }); }
function gdUpload(id,text){
  var meta=id?{}:{name:GDNAME,parents:['appDataFolder']};
  if(text.length<4000000){
    var bd='ieci'+Date.now().toString(36);
    var body='--'+bd+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(meta)+'\r\n--'+bd+'\r\nContent-Type: application/json\r\n\r\n'+text+'\r\n--'+bd+'--';
    return gdFetch('https://www.googleapis.com/upload/drive/v3/files'+(id?'/'+id:'')+'?uploadType=multipart',{method:id?'PATCH':'POST',headers:{'Content-Type':'multipart/related; boundary='+bd},body:body});
  }
  return gdFetch('https://www.googleapis.com/upload/drive/v3/files'+(id?'/'+id:'')+'?uploadType=resumable',{method:id?'PATCH':'POST',headers:{'Content-Type':'application/json; charset=UTF-8'},body:JSON.stringify(meta)})
    .then(function(r){ var loc=r.headers.get('Location'); if(!loc) throw new Error('upload non avviato'); return gdFetch(loc,{method:'PUT',headers:{'Content-Type':'application/json'},body:text}); });
}
function setHash(x){ return JSON.stringify([x.company,x.profile,x.style,x.trust,x.cat,x.cgroups]); }
var FACT_H='';
function facHash(x){ return JSON.stringify([x.company,x.profile,x.style,x.trust,x.cat,x.ccond&&Object.keys(x.ccond).length?x.ccond:{},x.mtpl,x.mdef]); }
function isFactory(){ if(!FACT_H){ try{ FACT_H=facHash(normalize(fresh())); }catch(e){ return false; } } return facHash(S)===FACT_H; }
function buildPayload(){
  return {tipo:'archivio-preventivi-ieci',v:2,su:DB.su||0,db:{clients:DB.clients,prods:DB.prods,quotes:DB.quotes,arts:DB.arts,logos:DB.logos||[],parole:DB.parole||[],del:DB.del||{},cest:DB.cest||[]},sus:DB.sus||{},msgs:S.msgs,aspetto:apCopia(),cat:S.cat,cgroups:S.cgroups,company:S.company,profile:S.profile,style:S.style,trust:S.trust,ccond:S.ccond||{},mtpl:S.mtpl,mdef:S.mdef,menu:MENU};
}
/* loghi delle marche e parole imparate: uno per chiave, vince il più recente */
function mergeByKey(name,arr,key,del){
  var L=DB[name]||(DB[name]=[]);
  (arr||[]).forEach(function(a){ if(!a) return; var k=key(a), ex=L.filter(function(x){ return key(x)===k; })[0]; if(!ex) L.push(a); else if((a.upd||0)>(ex.upd||0)) L[L.indexOf(ex)]=a; });
  DB[name]=L.filter(function(x){ var t=(del||{})[x.id]; return !(t&&t>=(x.upd||0)); }); if(name==='logos') DB.logos.sort(byName);
}
/* MI: mentre si unisce l'archivio di GitHub conta cosa arriva (nuovi, aggiornati), i conflitti e soprattutto
   se qui c'è qualcosa che lassù manca (mie): solo allora serve riscrivere l'archivio su GitHub */
var MI=null, BASEO=null;
function gdMerge(o){
  if(!o||o.tipo!=='archivio-preventivi-ieci'||!o.db) return;
  var d=o.db, replaced=[], del=DB.del||(DB.del={}), mi=MI||{}, qm=(GH&&GH.qmod)||{};
  mi.mie=mi.mie||0;
  Object.keys(del).forEach(function(k){ if(!(d.del||{})[k]||(d.del[k]<del[k])) mi.mie++; });
  Object.keys(d.del||{}).forEach(function(k){ del[k]=Math.max(del[k]||0,d.del[k]); });
  // ciò che c'è qui e non lassù
  var rc={}, rp={}, rq={}, ra={};
  (d.clients||[]).forEach(function(c){ rc[lc(c.name)]=c; }); (d.prods||[]).forEach(function(p){ rp[lc(p.name)+'|'+lc(p.code)]=p; }); (d.quotes||[]).forEach(function(q){ rq[q.id]=q; }); (d.arts||[]).forEach(function(a){ ra[a.id]=a; ra[artKey(a)]=a; });
  DB.clients.forEach(function(c){ var r=rc[lc(c.name)]; if(eliminato(c)) return; if(!r||(c.upd||0)>(r.upd||0)) mi.mie++; });
  DB.prods.forEach(function(p){ var r=rp[lc(p.name)+'|'+lc(p.code)]; if(eliminato(p)) return; if(!r||(p.upd||0)>(r.upd||0)||(p.phu||0)>(r.phu||0)) mi.mie++; });
  DB.quotes.forEach(function(q){ var r=rq[q.id]; if(eliminato(q)) return; if(!r||(q.upd||0)>(r.upd||0)) mi.mie++; else if((q.upd||0)===(r.upd||0)&&phUnisciQuote(r,q)) mi.mie++; });
  DB.arts.forEach(function(a){ var r=ra[a.id]||ra[artKey(a)]; if(eliminato(a)) return; if(!r||(a.upd||0)>(r.upd||0)) mi.mie++; });
  if(cestUnisci(d.cest)) mi.mie++;
  // clienti e libreria prodotti: i nuovi si aggiungono; in quelli che ci sono già arriva la versione più recente
  // (un dato pieno non viene mai sostituito da uno vuoto) e le foto più recenti
  (d.clients||[]).forEach(function(c){ var ex=DB.clients.filter(function(x){ return lc(x.name)===lc(c.name); })[0];
    if(!ex){ DB.clients.push(c); return; } schedaUnisci(ex,c,{id:1,name:1}); });
  (d.prods||[]).forEach(function(p){ var ex=DB.prods.filter(function(x){ return lc(x.name)===lc(p.name)&&lc(x.code)===lc(p.code); })[0];
    if(!ex){ DB.prods.push(p); return; }
    phPrendi(ex,p); schedaUnisci(ex,p,{id:1,photos:1,po:1,phu:1,phs:1,cr:1}); });
  (d.quotes||[]).forEach(function(q){
    var ex=DB.quotes.filter(function(x){ return x.id===q.id; })[0];
    if(!ex){ if(!eliminato(q)){ DB.quotes.push(q); mi.nuovi=(mi.nuovi||0)+1; } return; }
    /* lo stesso preventivo cambiato qui (e non ancora su GitHub) e anche su un altro dispositivo: vince il più
       recente, l'altra versione NON si perde, resta nell'archivio come copia segnata. «bu» è la versione da cui
       sono partite le modifiche di qui: se lassù c'è ancora quella, nessun conflitto (non conta l'orologio) */
    var due=!!qm[ex.id]&&(q.upd||0)!==(ex.bu||0)&&(q.upd||0)!==(ex.upd||0)&&qDiverso(ex,q);
    if(q.upd>ex.upd){ if(due){ copiaConflitto(ex); mi.conf=(mi.conf||0)+1; mi.mie++; } delete qm[ex.id]; if(phUnisciQuote(q,ex)) mi.mie++; DB.quotes[DB.quotes.indexOf(ex)]=q; replaced.push(q.id); mi.agg=(mi.agg||0)+1; }
    else { if(due){ copiaConflitto(q); ex.bu=q.upd; mi.conf=(mi.conf||0)+1; } if(phUnisciQuote(ex,q)) replaced.push(ex.id); } // la versione di qui resta, ma con le foto più recenti dell'altra
  });
  (d.arts||[]).forEach(function(a){ var ex=DB.arts.filter(function(x){ return x.id===a.id||artKey(x)===artKey(a); })[0]; if(!ex) DB.arts.push(a); else if((a.upd||0)>(ex.upd||0)) DB.arts[DB.arts.indexOf(ex)]=a; });
  DB.arts=DB.arts.filter(function(x){ return !eliminato(x); }).sort(byName);
  mergeByKey('logos',d.logos,function(x){ return iwK(x.name); },del); mergeByKey('parole',d.parole,function(x){ return x.m+'|'+x.k; },del);
  DB.clients=DB.clients.filter(function(x){ return !eliminato(x); }).sort(byName);
  DB.prods=DB.prods.filter(function(x){ return !eliminato(x); }).sort(byName);
  DB.quotes=DB.quotes.filter(function(x){ return !eliminato(x); });
  updOsserva(false);
  // impostazioni: unite sezione per sezione, voce per voce (vedi 22e): nessuna sezione ne cancella un'altra
  var reload=sezUnisci(o,mi,MI!==null);
  if(S.qid&&replaced.indexOf(S.qid)>-1){
    var e=DB.quotes.filter(function(x){ return x.id===S.qid; })[0];
    if(e){ var dd=JSON.parse(JSON.stringify(e.data)); dd.cat=S.cat; dd.cgroups=S.cgroups; dd.trust=S.trust; dd.profile=S.profile; dd.company=S.company; dd.msgs=S.msgs; dd.ccond=S.ccond; dd.mtpl=S.mtpl; dd.mdef=S.mdef; dd.qid=S.qid; S=normalize(dd); reload=true; }
  } else if(S.qid&&!DB.quotes.some(function(x){ return x.id===S.qid; })){ S.qid=''; }
  if(reload){ S=normalize(S); doSave(); renderAll(); }
  lastSez=sezStampa();
}
function gdSync(interactive){
  if(gdBusy||!GD.on) return;
  gdBusy=true; gdStatus('Sincronizzazione in corso…');
  if(S.qid&&dbReady) saveQuote(true);
  gdToken(interactive,function(t){
    if(!t){ gdBusy=false; return; }
    gdFind().then(function(f){ return f?gdDownload(f.id).then(function(o){ return {f:f,o:o}; }):null; })
      .then(function(res){
        if(res&&res.o) gdMerge(res.o);
        settingsStamp(); renderArchivio();
        return gdUpload(res&&res.f?res.f.id:null,JSON.stringify(buildPayload()));
      })
      .then(function(){ GD.last=Date.now(); gdStore(); dbSave(true); gdStatus('Sincronizzato alle '+new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})+'. Archivio, listino, dati ditta e stile sono su Drive.'); })
      .catch(function(e){ var m=String(e.message||e); gdStatus('Errore di sincronizzazione: '+m+(/401/.test(m)?' (sessione scaduta: premi di nuovo Sincronizza)':'')); if(/401/.test(m)) gdTok=''; })
      .then(function(){ gdBusy=false; });
  });
}
function gdPushSoon(){
  if(!GD.on||!GD.auto||!tokOk()) return;
  clearTimeout(gdT); gdT=setTimeout(function(){ gdSync(false); },20000);
}
/* ---------- GitHub (archivio privato, file JSON) ---------- */
var GH={repo:'',token:'',on:false,auto:true,last:0,err:'',dirty:false,sha:'',etag:'',errN:0,prossimo:0,rete:false,dev:'',nome:'',copiaGh:'',disp:{},gen:0}, ghBusy=false, ghT=0, GHFILE='archivio-preventivi-ieci.json';
function ghLoad(){ try{ var o=JSON.parse(localStorage.getItem('ieci-gh')||'{}'); GH.repo=o.repo||''; GH.token=o.token||''; GH.on=!!o.on; GH.auto=true; GH.last=o.last||0; GH.dirty=!!o.dirty; GH.sha=o.sha||''; GH.errN=o.errN||0; GH.prossimo=o.prossimo||0; GH.dev=o.dev||''; GH.nome=o.nome||''; GH.copiaGh=o.copiaGh||''; GH.disp=o.disp||{}; GH.err=o.err||''; GH.rete=!!o.rete; }catch(e){}
  if(!GH.dev){ GH.dev='d'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); ghStore(); } }
function ghStore(){ try{ localStorage.setItem('ieci-gh',JSON.stringify(GH)); }catch(e){} }
function ghStatus(t){ var el=$('gh-state'); if(el) el.textContent=t; ghChip(); }
// comando sempre in alto nella prima schermata: stato della sincronizzazione e un tocco per salvare e sincronizzare
function ghOpenDirty(){ return !!(S&&S.qid&&QDV[S.qid]!=null&&QDV[S.qid]!==docVer); }
function ghChip(){
  if(!GH) return; var b=$('gh-chip'), t=$('gh-chip-t'); if(!b||!t) return;
  var auto=' Il salvataggio è automatico: non serve premere niente.';
  var st, tx, tip, ora=GH.last?new Date(GH.last).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}):'';
  if(!GH.on){ st='off'; tx='Collega GitHub'; tip='GitHub non collegato: tocca per collegarlo e tenere uguali telefono e computer'; }
  else if(ghBusy){ st='run'; tx='Salvo…'; tip='Salvataggio su GitHub in corso'; }
  else if(GH.err&&GH.rete){ st='net'; tx='Offline'; tip='Nessuna connessione: le modifiche sono al sicuro su questo dispositivo e vanno su GitHub da sole appena torna la rete. Tocca per riprovare.'; }
  else if(GH.err){ st='err'; tx='Riprova'; tip='Sincronizzazione non riuscita: '+GH.err+' Tocca per riprovare.'; }
  else if(GH.dirty||ghOpenDirty()){ st='dirty'; tx='Salvo tra poco'; tip='Modifiche al sicuro su questo dispositivo: vanno su GitHub da sole tra pochi secondi. Tocca per salvarle subito.'; }
  else { st='ok'; tx=ora?'Salvato '+ora:'Salvato'; tip='Tutto salvato su GitHub'+(GH.last?' ('+new Date(GH.last).toLocaleString('it-IT')+')':'')+'. Tocca per controllare subito.'+auto; }
  b.setAttribute('data-st',st); t.textContent=tx; b.title=tip; b.setAttribute('aria-label',tip);
  if(typeof autoRender==='function') autoRender();
}
function ghClean(v){ return String(v||'').trim().replace(/^https?:\/\/github\.com\//i,'').replace(/\.git$/i,'').replace(/^\/+|\/+$/g,''); }
function renderGh(){
  if(!$('gh-repo')) return;
  $('gh-repo').value=GH.repo; $('gh-token').value=GH.token;
  $('gh-sync').disabled=!GH.on; $('gh-off').disabled=!GH.on;
  $('gh-on').textContent=GH.on?'Ricollega':'Collega e sincronizza';
  if(!$('gh-state').textContent) ghStatus(GH.on?('Collegato a '+GH.repo+(GH.last?'. Ultima sincronizzazione: '+new Date(GH.last).toLocaleString('it-IT'):'')+'.'):'Non collegato.');
}
function ghApi(path,opt,raw,noRepo){
  opt=opt||{};
  opt.headers=Object.assign({Authorization:'Bearer '+GH.token,Accept:raw?'application/vnd.github.raw+json':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},opt.headers||{});
  opt.cache='no-store';
  return fetch('https://api.github.com/repos/'+GH.repo+path,opt).then(function(r){
    if(!r.ok){ var e=new Error(String(r.status)); e.status=r.status; throw e; }
    return r;
  });
}
function b64utf8(str){ var u=new TextEncoder().encode(str), bin='', i, n=0x8000; for(i=0;i<u.length;i+=n) bin+=String.fromCharCode.apply(null,u.subarray(i,i+n)); return btoa(bin); }
function ghErr(e){
  if(e&&e.vecchia) return 'Questo dispositivo ha una versione vecchia dell\'app ('+APP_VER+'): l\'archivio su GitHub è stato scritto da una versione più nuova. Per sicurezza non ho unito né scritto nulla. Aggiorna l\'app (serve almeno la '+e.vecchia+') e sincronizza di nuovo.';
  if(e&&e.foto) return 'Non sono riuscito a scaricare '+e.foto+(e.foto===1?' foto':' foto')+' da GitHub (connessione debole?). Non ho cambiato niente qui: riprovo alla prossima sincronizzazione.';
  var c=e&&e.status;
  if(c===401) return 'Codice di accesso non valido o scaduto: creane uno nuovo su GitHub e incollalo qui.';
  if(c===403) return 'Accesso negato: il codice deve avere il permesso «Contents: Read and write» su questo archivio (o hai fatto troppe richieste: riprova tra poco).';
  if(c===404) return 'Archivio non trovato: controlla il nome (utente/archivio) e che il codice sia stato creato proprio per quell\'archivio.';
  if(c===409||c===422) return 'Conflitto di salvataggio: riprova.';
  if(e&&/Failed to fetch|NetworkError|Load failed/i.test(String(e.message))) return 'Nessuna connessione a GitHub: riprova quando sei online.';
  return 'Errore: '+((e&&e.message)||e);
}
function ghFetchFile(){
  return ghApi('/contents/'+GHFILE).then(function(r){ return r.json(); }).then(function(m){
    return ghApi('/contents/'+GHFILE,{},true).then(function(r){ return r.json(); }).then(function(o){ return {sha:m.sha,o:o}; });
  },function(e){ if(e.status===404) return null; throw e; });
}
function ghPut(sha,text,path,msg){
  var body={message:msg||('Salvataggio da '+devNome()+' · '+new Date().toLocaleString('it-IT')),content:b64utf8(text)}; if(sha) body.sha=sha;
  return ghApi('/contents/'+(path||GHFILE),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
}
/* Sincronizzazione: scarica l'archivio di GitHub, lo unisce a quello di qui e, SOLO se qui c'è qualcosa che lassù
   manca, lo riscrive. Le modifiche fatte mentre la sincronizzazione è in corso non vanno perse (contatore GH.gen):
   restano «da salvare» e partono subito dopo. Se nel frattempo un altro dispositivo ha scritto (409), si riparte da capo. */
function ghSync(interactive,tent){
  tent=tent||0;
  if(!GH.on||!GH.token||!GH.repo) return;
  if(ghBusy){ AUTO.ancora=true; if(interactive) AUTO.forza=true; return; }
  ghBusy=true; GH.err=''; ghStatus('Sincronizzazione in corso…');
  copiaDelGiorno();
  if(dbReady) ghPrepara();
  clearTimeout(AUTO.t); AUTO.t=0; AUTO.primo=0;
  var forza=!!interactive||!!AUTO.forza; AUTO.forza=false;
  var again=false, remoto=null, gen0=GH.gen, eraSporco=GH.dirty, mi={nuovi:0,agg:0,conf:0,via:0}, scritto=false;
  ghFetchFile().then(function(res){
    remoto=res;
    // archivio scritto da una versione dell'app più nuova di questa, in un formato che questa non sa gestire: mi fermo
    if(res&&res.o&&res.o.min&&verCmp(res.o.min,APP_VER)>0){ var ev=new Error('vecchia'); ev.vecchia=res.o.min; throw ev; }
    if(res&&res.o&&res.o.app&&verCmp(res.o.app,APP_VER)>0&&!GH.avvNuova){ GH.avvNuova=1; setTimeout(function(){ toast('Su un altro dispositivo c\'è una versione più nuova dell\'app ('+res.o.app+'): aggiorna anche questo'); },1500); }
    if(res&&res.o&&res.o.disp) GH.disp=res.o.disp;
    if(res&&res.o&&res.o.foto) AUTO.foto=res.o.foto;
    // prima riparo le foto rimaste qui come riferimento (da una versione vecchia), poi scarico quelle che mancano e unisco
    return ghfRipara(res&&res.o&&res.o.foto).then(function(){ return res&&res.o?ghfScarica(res.o).then(function(){ MI=mi; try{ gdMerge(res.o); } finally { MI=null; } }):null; });
  }).then(function(){
    settingsStamp(); renderArchivio();
    gen0=GH.gen;
    var ro=remoto&&remoto.o;
    // si scrive solo se serve: modifiche di qui, archivio assente o in un formato più vecchio, o richiesta a mano
    var serve=forza||eraSporco||GH.dirty||mi.mie>0||!ro||ro.v!==3||!ro.min||verCmp(ro.min,GH_MIN)<0||!(ro.disp&&ro.disp[GH.dev]);
    if(!serve) return null;
    return ghfPayload(ro).then(function(o){
      o.disp=autoDispositivi(ro&&ro.disp);
      BASEO=o; var txt=JSON.stringify(o); GH.peso=txt.length; GH.nfoto=Object.keys(o.foto||{}).length;
      return ghPut(remoto&&remoto.sha,txt).then(function(r){ return r.json().catch(function(){ return {}; }); }).then(function(j){ scritto=true; GH.sha=(j&&j.content&&j.content.sha)||''; GH.disp=o.disp; return txt; });
    });
  }).then(function(txt){
    if(!scritto&&remoto) GH.sha=remoto.sha||'';
    if(scritto) qmodPulisci(gen0);
    sezBase(scritto?BASEO:(remoto&&remoto.o));
    GH.etag=''; GH.last=Date.now(); GH.dirty=GH.gen!==gen0; GH.errN=0; GH.prossimo=0; GH.rete=false; AUTO.letto=GH.last; ghStore(); dbSave(true);
    autoLog(scritto?'su':'giu',mi); renderCest(); if(copiePulisci()) autoProgramma();
    if(mi.conf) toast(mi.conf===1?'Un preventivo era stato cambiato su due dispositivi: ho tenuto tutte e due le versioni':'Alcuni preventivi erano stati cambiati su due dispositivi: ho tenuto tutte e due le versioni');
    else if(mi.nuovi+mi.agg&&!interactive) toast('Arrivati dall\'altro dispositivo: '+(mi.nuovi+mi.agg)+(mi.nuovi+mi.agg===1?' preventivo':' preventivi'));
    ghStatus((scritto?'Salvato su GitHub alle ':'Controllato alle ')+new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})+(scritto?'. Archivio, listino, dati ditta e stile sono aggiornati'+(GH.peso?' (archivio '+(GH.peso>1048576?itNum(GH.peso/1048576,0,1)+' MB':Math.max(1,Math.round(GH.peso/1024))+' KB')+(GH.nfoto?', '+GH.nfoto+' foto come file a parte':'')+')':'')+'.':': tutto uguale a GitHub.')+(GHFOTO.errScarico?' Attenzione: '+GHFOTO.errScarico+' foto non scaricate, riprovo alla prossima sincronizzazione.':''));
    if(txt) autoCopiaGh(txt);
  }).catch(function(e){
    if((e.status===409||e.status===422)&&tent<4){ again=true; return; }
    GH.err=ghErr(e); GH.rete=autoRete(e); GH.errN=(GH.errN||0)+1; GH.prossimo=Date.now()+Math.min(600000,15000*Math.pow(2,GH.errN-1));
    if(eraSporco) GH.dirty=true; ghStore(); ghStatus(GH.err); autoLog(GH.rete?'rete':'err',{msg:GH.err});
  }).then(function(){
    ghBusy=false; ghChip();
    if(again){ setTimeout(function(){ ghSync(interactive,tent+1); },300+Math.round(Math.random()*1200)); return; }
    if(AUTO.ancora||GH.dirty){ AUTO.ancora=false; autoProgramma(); }
  });
}
// prima di sincronizzare: il preventivo aperto va nell'archivio (se è cambiato)
function ghPrepara(){
  if(!dbReady||!S) return;
  var demo=false; try{ demo=Object.keys(libDemo()).length>0; }catch(e){}
  if(S.qid) saveQuote(true); else if(S.lines.length&&!demo&&QDV['']!==docVer) saveQuote(true);
}
$('gh-on').addEventListener('click',function(){
  var repo=ghClean($('gh-repo').value), tok=$('gh-token').value.trim();
  if(!/^[\w.-]+\/[\w.-]+$/.test(repo)){ ghStatus('Scrivi il nome dell\'archivio come utente/nome, ad esempio mario/preventivi-ieci-dati.'); return; }
  if(!tok){ ghStatus('Incolla il codice di accesso (inizia con github_pat_).'); return; }
  GH.repo=repo; GH.token=tok; ghStatus('Controllo l\'archivio…');
  ghApi('').then(function(r){ return r.json(); }).then(function(j){
    if(j&&j.private===false){ ghStatus('Questo archivio è PUBBLICO: i tuoi clienti e prezzi sarebbero visibili a tutti. Su GitHub: Settings → Danger Zone → «Change visibility» → Private, poi riprova.'); return; }
    GH.on=true; GH.sha=''; GH.err=''; GH.errN=0; GH.prossimo=0; ghStore(); renderGh(); ghSync(true);
  }).catch(function(e){ ghStatus(ghErr(e)); });
});
$('gh-sync').addEventListener('click',function(){ ghSync(true); });
$('gh-off').addEventListener('click',function(){ GH.on=false; GH.token=''; ghStore(); ghStatus('Scollegato. I dati restano su questo dispositivo e su GitHub.'); renderGh(); });
ghLoad();
$('gh-chip').addEventListener('click',function(){
  if(GH.on&&GH.token){ GH.prossimo=0; ghSync(true); return; }
  showPanel('salva'); var r=$('gh-repo'); if(r){ var d=r.closest('details'); if(d) d.open=true; setTimeout(function(){ r.scrollIntoView({block:'center'}); try{ r.focus({preventScroll:true}); }catch(e){} },120); }
});
ghChip();
(function(){ var n=0, iv=setInterval(function(){ n++; if(dbReady){ clearInterval(iv); setTimeout(copiaDelGiorno,4000); if(GH.on) ghSync(false); } else if(n>40) clearInterval(iv); },500); })();
$('gd-cid').addEventListener('input',function(e){ GD.cid=e.target.value.trim(); gdStore(); });
$('gd-auto').addEventListener('change',function(e){ GD.auto=e.target.checked; gdStore(); });
$('gd-on').addEventListener('click',function(){
  if(!GD.cid){ gdStatus('Inserisci prima il Client ID Google (vedi istruzioni qui sopra).'); return; }
  gdTok=''; GD.on=true; gdStore(); renderGd(); gdSync(true);
});
$('gd-sync').addEventListener('click',function(){ gdSync(true); });
$('gd-off').addEventListener('click',function(){
  try{ if(gdTok&&window.google&&google.accounts) google.accounts.oauth2.revoke(gdTok,function(){}); }catch(e){}
  gdTok=''; GD.on=false; gdStore(); gdStatus('Scollegato. I dati restano su questo dispositivo e su Drive.'); renderGd();
});
document.addEventListener('visibilitychange',function(){ if(!document.hidden&&GD.on&&GD.auto&&tokOk()) gdSync(false); });
gdLoad();


(function(T){ if(!T) return; T.ghTick=function(){ autoVai(); return true; }; T.GH=function(){ return GH; }; T.ghSync=ghSync; T.dbSave=dbSave; T.ghBusy=function(){ return ghBusy; }; T.saveQuote=saveQuote; T.openQuote=openQuote; })(window.IECI_T);
