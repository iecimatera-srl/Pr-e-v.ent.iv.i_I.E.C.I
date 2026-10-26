/* ---------- Google Drive (cartella app nascosta, scope drive.appdata) ---------- */
var GD={cid:'',on:false,auto:true,last:0}, gdTok='', gdExp=0, gdBusy=false, gdT=0, lastSet=null;
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
function settingsStamp(){
  var h=JSON.stringify([S.company,S.profile,S.style,S.trust,S.cat,S.cgroups,S.ccond||{},S.mtpl,S.mdef]);
  if(lastSet!==null&&h!==lastSet){ DB.su=Date.now(); dbSave(); }
  lastSet=h;
}
function buildPayload(){
  return {tipo:'archivio-preventivi-ieci',v:2,su:DB.su||0,db:{clients:DB.clients,prods:DB.prods,quotes:DB.quotes,arts:DB.arts,logos:DB.logos||[],parole:DB.parole||[],del:DB.del||{}},cat:S.cat,cgroups:S.cgroups,company:S.company,profile:S.profile,style:S.style,trust:S.trust,ccond:S.ccond||{},mtpl:S.mtpl,mdef:S.mdef,menu:MENU};
}
/* loghi delle marche e parole imparate: uno per chiave, vince il più recente */
function mergeByKey(name,arr,key,del){
  var L=DB[name]||(DB[name]=[]);
  (arr||[]).forEach(function(a){ if(!a) return; var k=key(a), ex=L.filter(function(x){ return key(x)===k; })[0]; if(!ex) L.push(a); else if((a.upd||0)>(ex.upd||0)) L[L.indexOf(ex)]=a; });
  DB[name]=L.filter(function(x){ return !(del||{})[x.id]; }); if(name==='logos') DB.logos.sort(byName);
}
function gdMerge(o){
  if(!o||o.tipo!=='archivio-preventivi-ieci'||!o.db) return;
  var d=o.db, replaced=[], del=DB.del||(DB.del={});
  Object.keys(d.del||{}).forEach(function(k){ del[k]=Math.max(del[k]||0,d.del[k]); });
  (d.clients||[]).forEach(function(c){ if(!DB.clients.some(function(x){ return lc(x.name)===lc(c.name); })) DB.clients.push(c); });
  (d.prods||[]).forEach(function(p){ if(!DB.prods.some(function(x){ return lc(x.name)===lc(p.name)&&lc(x.code)===lc(p.code); })) DB.prods.push(p); });
  (d.quotes||[]).forEach(function(q){
    var ex=DB.quotes.filter(function(x){ return x.id===q.id; })[0];
    if(!ex) DB.quotes.push(q); else if(q.upd>ex.upd){ DB.quotes[DB.quotes.indexOf(ex)]=q; replaced.push(q.id); }
  });
  (d.arts||[]).forEach(function(a){ var ex=DB.arts.filter(function(x){ return x.id===a.id||artKey(x)===artKey(a); })[0]; if(!ex) DB.arts.push(a); else if((a.upd||0)>(ex.upd||0)) DB.arts[DB.arts.indexOf(ex)]=a; });
  DB.arts=DB.arts.filter(function(x){ return !del[x.id]; }).sort(byName);
  mergeByKey('logos',d.logos,function(x){ return iwK(x.name); },del); mergeByKey('parole',d.parole,function(x){ return x.m+'|'+x.k; },del);
  DB.clients=DB.clients.filter(function(x){ return !del[x.id]; }).sort(byName);
  DB.prods=DB.prods.filter(function(x){ return !del[x.id]; }).sort(byName);
  DB.quotes=DB.quotes.filter(function(x){ return !del[x.id]; });
  var reload=false, adopt=(o.su||0)>(DB.su||0);
  /* un dispositivo nuovo (impostazioni mai toccate) prende SEMPRE quelle dell'archivio: non deve mai sovrascriverle con le sue di fabbrica */
  if(!adopt&&!(DB.su>0)&&(o.company||o.profile||o.style||o.trust||o.cat||o.ccond||o.mtpl)&&isFactory()) adopt=true;
  if(adopt){
    if(!isFactory()) snapSave('Prima di unire le impostazioni dell\'altro dispositivo');
    if(o.company) S.company=o.company; if(o.profile) S.profile=o.profile; if(o.style) S.style=o.style; if(o.trust) S.trust=o.trust; if(o.ccond) S.ccond=o.ccond; if(o.mtpl&&o.mtpl.length){ S.mtpl=o.mtpl; S.mdef=o.mdef||o.mtpl[0].id; } if(o.cat){ S.cat=o.cat; S.cgroups=o.cgroups||{}; ORDER.forEach(function(k){ cgSync(k); }); }
    DB.su=o.su; reload=true;
  }
  if(S.qid&&replaced.indexOf(S.qid)>-1){
    var e=DB.quotes.filter(function(x){ return x.id===S.qid; })[0];
    if(e){ var dd=JSON.parse(JSON.stringify(e.data)); dd.cat=S.cat; dd.cgroups=S.cgroups; dd.trust=S.trust; dd.profile=S.profile; dd.company=S.company; dd.msgs=S.msgs; dd.ccond=S.ccond; dd.mtpl=S.mtpl; dd.mdef=S.mdef; dd.qid=S.qid; S=normalize(dd); reload=true; }
  } else if(S.qid&&!DB.quotes.some(function(x){ return x.id===S.qid; })){ S.qid=''; }
  if(reload){ S=normalize(S); doSave(); renderAll(); }
  lastSet=JSON.stringify([S.company,S.profile,S.style,S.trust,S.cat,S.cgroups,S.ccond||{},S.mtpl,S.mdef]);
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
var GH={repo:'',token:'',on:false,auto:true,last:0}, ghBusy=false, ghT=0, GHFILE='archivio-preventivi-ieci.json';
function ghLoad(){ try{ var o=JSON.parse(localStorage.getItem('ieci-gh')||'{}'); GH.repo=o.repo||''; GH.token=o.token||''; GH.on=!!o.on; GH.auto=o.auto!==false; GH.last=o.last||0; }catch(e){} }
function ghStore(){ try{ localStorage.setItem('ieci-gh',JSON.stringify(GH)); }catch(e){} }
function ghStatus(t){ var el=$('gh-state'); if(el) el.textContent=t; }
function ghClean(v){ return String(v||'').trim().replace(/^https?:\/\/github\.com\//i,'').replace(/\.git$/i,'').replace(/^\/+|\/+$/g,''); }
function renderGh(){
  if(!$('gh-repo')) return;
  $('gh-repo').value=GH.repo; $('gh-token').value=GH.token; $('gh-auto').checked=GH.auto;
  $('gh-sync').disabled=!GH.on; $('gh-off').disabled=!GH.on;
  $('gh-on').textContent=GH.on?'Salva e sincronizza':'Collega e sincronizza';
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
function ghPut(sha,text){
  var body={message:'Sincronizzazione '+new Date().toISOString(),content:b64utf8(text)}; if(sha) body.sha=sha;
  return ghApi('/contents/'+GHFILE,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
}
function ghSync(interactive,retry){
  if(ghBusy||!GH.on||!GH.token||!GH.repo) return;
  ghBusy=true; ghStatus('Sincronizzazione in corso…');
  if(S.qid&&dbReady) saveQuote(true);
  clearTimeout(ghT);
  var again=false;
  ghFetchFile().then(function(res){
    if(res&&res.o) gdMerge(res.o);
    settingsStamp(); renderArchivio();
    return ghPut(res&&res.sha,JSON.stringify(buildPayload()));
  }).then(function(){
    GH.last=Date.now(); ghStore(); dbSave(true); clearTimeout(ghT);
    ghStatus('Sincronizzato alle '+new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})+'. Archivio, listino, dati ditta e stile sono aggiornati su GitHub.');
  }).catch(function(e){
    if((e.status===409||e.status===422)&&!retry){ again=true; return; }
    ghStatus(ghErr(e));
  }).then(function(){ ghBusy=false; if(again) ghSync(interactive,true); });
}
function ghPushSoon(){
  if(!GH.on||!GH.auto||!GH.token) return;
  clearTimeout(ghT); ghT=setTimeout(function(){ ghSync(false); },15000);
}
$('gh-auto').addEventListener('change',function(e){ GH.auto=e.target.checked; ghStore(); });
$('gh-on').addEventListener('click',function(){
  var repo=ghClean($('gh-repo').value), tok=$('gh-token').value.trim();
  if(!/^[\w.-]+\/[\w.-]+$/.test(repo)){ ghStatus('Scrivi il nome dell\'archivio come utente/nome, ad esempio mario/preventivi-ieci-dati.'); return; }
  if(!tok){ ghStatus('Incolla il codice di accesso (inizia con github_pat_).'); return; }
  GH.repo=repo; GH.token=tok; ghStatus('Controllo l\'archivio…');
  ghApi('').then(function(r){ return r.json(); }).then(function(j){
    if(j&&j.private===false){ ghStatus('Questo archivio è PUBBLICO: i tuoi clienti e prezzi sarebbero visibili a tutti. Su GitHub: Settings → Danger Zone → «Change visibility» → Private, poi riprova.'); return; }
    GH.on=true; ghStore(); renderGh(); ghSync(true);
  }).catch(function(e){ ghStatus(ghErr(e)); });
});
$('gh-sync').addEventListener('click',function(){ ghSync(true); });
$('gh-off').addEventListener('click',function(){ GH.on=false; GH.token=''; ghStore(); ghStatus('Scollegato. I dati restano su questo dispositivo e su GitHub.'); renderGh(); });
document.addEventListener('visibilitychange',function(){ if(!document.hidden&&GH.on&&GH.auto&&Date.now()-GH.last>60000) ghSync(false); });
ghLoad();
(function(){ var n=0, iv=setInterval(function(){ n++; if(dbReady){ clearInterval(iv); if(GH.on&&GH.auto) ghSync(false); } else if(n>40) clearInterval(iv); },500); })();
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

