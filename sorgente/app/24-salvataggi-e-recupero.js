/* ===== aggiornamenti e dati al sicuro ===== */
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function kvGet(k,cb){ try{ var q=IDB.transaction('kv').objectStore('kv').get(k); q.onsuccess=function(){ cb(q.result); }; q.onerror=function(){ cb(null); }; }catch(e){ cb(null); } }
function kvPut(k,v,cb){ try{ var tx=IDB.transaction('kv','readwrite'); tx.objectStore('kv').put(v,k); tx.oncomplete=function(){ if(cb) cb(true); }; tx.onerror=tx.onabort=function(){ if(cb) cb(false); }; }catch(e){ if(cb) cb(false); } }
function kvDel(k){ try{ IDB.transaction('kv','readwrite').objectStore('kv').delete(k); }catch(e){} }
function dbEmpty(){ return !(DB.quotes.length||DB.clients.length||DB.arts.length||DB.prods.length); }
function stamp(t){ return new Date(t).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'}); }
function restoreObj(o){
  var r=document.querySelector('input[name="imp-mode"][value="replace"]'), old=document.querySelector('input[name="imp-mode"]:checked'); r.checked=true;
  try{ importAll(o); } finally { if(old) old.checked=true; }
}
/* copie prima dell'aggiornamento */
function snapList(cb){ kvGet('snaps',function(a){ cb(Array.isArray(a)?a:[]); }); }
function snapSave(why,cb){
  if(!IDB){ if(cb) cb(); return; }
  var pv=lsGet('ieci-ver')||'?', js=JSON.stringify(buildPayload());
  snapList(function(a){ a.unshift({t:Date.now(),ver:pv,why:why,json:js}); kvPut('snaps',a.slice(0,6),function(){ renderSnaps(); if(cb) cb(); }); });
}
function renderSnaps(){
  var el=$('sn-list'); if(!el) return;
  snapList(function(a){
    el.innerHTML=a.map(function(s,i){ return '<div class="rowc"><div style="flex:1;min-width:0"><b>'+esc(stamp(s.t))+'</b><div class="hint">'+esc(s.why)+' · versione '+esc(s.ver)+' · '+Math.round(s.json.length/1024)+' KB</div></div><button class="btn sm ghost" data-snap="'+i+'" type="button">Ripristina</button></div>'; }).join('')||'<p class="hint">Le copie compaiono qui da sole, prima che una nuova versione tocchi i tuoi dati (ne tengo 3). Per ora non ce ne sono.</p>';
  });
}
$('sn-list').addEventListener('click',function(e){
  var b=e.target.closest('[data-snap]'); if(!b) return;
  snapList(function(a){ var s=a[+b.getAttribute('data-snap')]; if(!s) return; if(!confirm('Ripristinare lo stato del '+stamp(s.t)+'? Sostituisce i dati attuali.')) return; try{ restoreObj(JSON.parse(s.json)); toast('Ripristinato lo stato del '+stamp(s.t)); }catch(x){ toast('Copia non leggibile'); } });
});
/* ===== recupero impostazioni dai preventivi salvati ===== */
function trustLogos(t){ if(!t) return 0; var n=0; (t.bgroups||[]).forEach(function(g){ n+=(g.items||[]).length; }); n+=(t.brands||[]).length; return n; }
function renderRecover(){
  var el=$('rc-list'); if(!el) return;
  var cur=trustLogos(S.trust), rows=[];
  DB.quotes.forEach(function(q){ if(q&&q.data&&q.data.trust){ var n=trustLogos(q.data.trust); if(n>0) rows.push({q:q,n:n}); } });
  rows.sort(function(a,b){ return (b.q.upd||0)-(a.q.upd||0); });
  var max=0; rows.forEach(function(r){ if(r.n>max) max=r.n; });
  if(!rows.length){ el.innerHTML='<p class="hint" style="margin:0">Nessun preventivo salvato contiene loghi dei marchi.</p>'; return; }
  el.innerHTML='<p class="hint" style="margin:0">Ora nell\'app: <b>'+cur+'</b> loghi dei marchi.</p>'+rows.slice(0,10).map(function(r,i){
    return '<div class="rowc"><div style="flex:1;min-width:0"><b>'+esc(r.q.name||('n. '+r.q.num))+'</b><div class="hint">'+esc(stamp(r.q.upd||0))+' · '+r.n+' loghi'+(r.n===max?' · il più completo':'')+'</div></div><button class="btn sm" data-rcb="'+esc(r.q.id)+'" type="button">Recupera i marchi</button><button class="btn sm ghost" data-rca="'+esc(r.q.id)+'" type="button">Recupera tutto</button></div>';
  }).join('');
}
$('bg-from').addEventListener('click',function(){ showPanel('salva'); var a=$('acc-auto'); if(a) a.open=true; renderRecover(); setTimeout(function(){ var r=$('rc-list'); if(r&&r.scrollIntoView) r.scrollIntoView({block:'center'}); },120); });
$('rc-list').addEventListener('click',function(e){
  var b=e.target.closest('[data-rcb],[data-rca]'); if(!b) return;
  var all=b.hasAttribute('data-rca'), id=b.getAttribute(all?'data-rca':'data-rcb');
  var q=DB.quotes.filter(function(x){ return x.id===id; })[0]; if(!q||!q.data||!q.data.trust) return;
  if(!confirm(all?'Recupero ditta, profilo, stile e marchi da questo preventivo? Sostituisce quelli attuali.':'Recupero i loghi dei marchi da questo preventivo? Sostituisce quelli attuali.')) return;
  snapSave('Prima di recuperare le impostazioni da un preventivo',function(){
    var d=JSON.parse(JSON.stringify(q.data));
    if(all){ var st=S.company&&S.company.stamp; S.company=d.company||S.company; if(!S.company.stamp&&st) S.company.stamp=st; S.profile=d.profile||S.profile; S.style=d.style||S.style; S.trust=d.trust; }
    else { S.trust.bgroups=d.trust.bgroups||[]; S.trust.brands=d.trust.brands||[]; }
    S=normalize(S); doSave(); renderAll(); renderRecover(); try{ settingsStamp(); }catch(x){}
    toast('Recuperato: ora ci sono '+trustLogos(S.trust)+' loghi dei marchi');
  });
});
function verCheck(){
  var prev=lsGet('ieci-ver');
  if(prev&&prev!==APP_VER){
    if(!dbEmpty()||!isFactory()) snapSave('Prima di passare alla versione '+APP_VER);
    toast('Aggiornato alla versione '+APP_VER+': i tuoi dati sono intatti');
  }
  lsSet('ieci-ver',APP_VER);
  $('up-ver').textContent='Versione installata: '+APP_VER;
}
/* copia automatica su file (cartella scelta dall'utente) */
var MIR={h:null,t:0,last:0,need:false,err:'',busy:false}, FS_OK=!!window.showDirectoryPicker;
function mirInit(){
  renderMir(); if(!FS_OK||!IDB) return;
  kvGet('mirror-handle',function(h){ if(!h) return; MIR.h=h; mirPerm(false,function(ok){ renderMir(); if(ok) mirWrite(); }); });
}
function mirPerm(ask,cb){
  if(!MIR.h) return cb(false);
  try{
    MIR.h.queryPermission({mode:'readwrite'}).then(function(p){
      if(p==='granted'){ MIR.need=false; return cb(true); }
      if(!ask){ MIR.need=true; return cb(false); }
      return MIR.h.requestPermission({mode:'readwrite'}).then(function(q){ MIR.need=q!=='granted'; cb(q==='granted'); });
    }).catch(function(){ cb(false); });
  }catch(e){ cb(false); }
}
// il permesso della cartella NON si chiede più al primo tocco (finiva sul tastierino del PIN):
// a app sbloccata e tranquilla compare una barra discreta con «Riattiva»; e si chiede quando premi «Salva»
var MIRB={x:false,t:0,save:false,pronto:false};
function mirLibera(){ var P=window.PINPAD; return !document.documentElement.classList.contains('locked')&&!(P&&(P.locked||P.state&&P.state.ask)); }
function mirArm(){
  if(!MIR.h||!MIR.need||MIRB.x||MIRB.pronto) return mirBar();
  clearTimeout(MIRB.t); MIRB.t=setTimeout(function(){ if(!mirLibera()){ mirArm(); return; } MIRB.pronto=true; mirBar(); },5000);
}
function mirBar(){
  var b=$('mi-banner'); if(!b) return; var on=!!(MIR.h&&MIR.need&&MIRB.pronto&&!MIRB.x&&mirLibera());
  if(on) $('mi-bmsg').textContent='Copia automatica nella cartella «'+MIR.h.name+'» in pausa: il browser chiede di riconfermare il permesso. Nella richiesta scegli «Consenti a ogni visita» e non te lo chiederà più.';
  b.hidden=!on;
}
function mirChiedi(){
  if(MIR.asking||!MIR.h) return; MIR.asking=true;
  mirPerm(true,function(ok){ MIR.asking=false; renderMir(); if(ok){ mirWrite(); toast('Copia automatica riattivata'); } });
}
window.addEventListener('ieci-sbloccato',function(){ if(MIR.h&&MIR.need&&!MIRB.pronto) mirArm(); });
function mirSoon(){ if(typeof MIR==='undefined'||!MIR||!MIR.h) return; clearTimeout(MIR.t); MIR.t=setTimeout(mirWrite,3500); }
function mirWrite(){
  if(!MIR.h||MIR.busy||!dbReady) return;
  mirPerm(false,function(ok){
    if(!ok){ renderMir(); return; }
    MIR.busy=true; var txt=JSON.stringify(buildPayload());
    function wr(fh,s){ return fh.createWritable().then(function(w){ return w.write(s).then(function(){ return w.close(); }); }); }
    MIR.h.getFileHandle('archivio-IECI.json',{create:true}).then(function(fh){
      return fh.getFile().then(function(f){
        if(f.size>50&&Date.now()-f.lastModified>12*3600*1000) return f.text().then(function(prev){ return MIR.h.getFileHandle('archivio-IECI-precedente.json',{create:true}).then(function(h2){ return wr(h2,prev); }); });
      }).catch(function(){}).then(function(){ return wr(fh,txt); });
    }).then(function(){ MIR.busy=false; MIR.last=Date.now(); MIR.err=''; renderMir(); }).catch(function(e){ MIR.busy=false; MIR.err=(e&&e.message)||'errore'; renderMir(); });
  });
}
function renderMir(){
  var st=$('mi-state'); if(!st) return;
  $('mi-pick').disabled=!FS_OK; $('mi-rest').disabled=!FS_OK;
  $('mi-on').hidden=!(MIR.h&&MIR.need); $('mi-off').hidden=!MIR.h; $('mi-pick').textContent=MIR.h?'Cambia cartella':'Scegli la cartella dati';
  if(MIR.h&&MIR.need) mirArm(); else mirBar();
  var msg;
  if(!FS_OK) msg='Su questo dispositivo il browser non permette di scrivere in una cartella (succede su telefoni e tablet). Qui i dati restano al sicuro con l\'app installata dall\'indirizzo online, con la sincronizzazione Google Drive e con la copia di sicurezza manuale.';
  else if(!MIR.h) msg='Non attiva. Consigliata su PC: premi «Scegli la cartella dati».';
  else if(MIR.need) msg='Cartella «'+MIR.h.name+'»: il browser chiede di riconfermare il permesso. Premi «Riattiva» (o «Salva» in alto) e nella richiesta scegli «Consenti a ogni visita»: non te lo chiederà più.';
  else if(MIR.err) msg='Cartella «'+MIR.h.name+'»: errore di scrittura ('+MIR.err+').';
  else msg='Attiva sulla cartella «'+MIR.h.name+'»'+(MIR.last?' · ultimo salvataggio '+stamp(MIR.last):' · in attesa della prima modifica')+'.';
  st.textContent=msg;
}
$('mi-pick').addEventListener('click',function(){
  window.showDirectoryPicker({mode:'readwrite',id:'ieci-dati'}).then(function(h){ MIR.h=h; MIR.need=false; kvPut('mirror-handle',h); renderMir(); mirWrite(); toast('Copia automatica attivata'); }).catch(function(){});
});
$('mi-on').addEventListener('click',function(){ if(MIR.asking) return; mirPerm(true,function(ok){ renderMir(); if(ok) mirWrite(); }); });
$('mi-bok').addEventListener('click',function(){ MIRB.x=true; mirBar(); mirChiedi(); });
$('mi-bx').addEventListener('click',function(){ MIRB.x=true; mirBar(); toast('Va bene: la copia nella cartella riparte quando premi «Salva»'); });
// «Salva»: il momento giusto per chiedere il permesso (una volta per apertura)
$('qb-save').addEventListener('click',function(){ if(MIR.h&&MIR.need&&!MIRB.save){ MIRB.save=true; MIRB.x=true; mirBar(); mirChiedi(); } });
$('mi-off').addEventListener('click',function(){ MIR.h=null; kvDel('mirror-handle'); renderMir(); toast('Copia automatica scollegata (i file restano nella cartella)'); });
window.IECI_T.merge=function(o){ gdMerge(o); }; window.IECI_T.S=function(){ return S; }; window.IECI_T.touch=function(){ touch(); }; window.IECI_T.isFactory=isFactory; window.IECI_T.payload=buildPayload; window.IECI_T.mir=function(){ return MIR; }; window.IECI_T.renderMir=renderMir; window.IECI_T.db=function(){ return DB; };
function mirRestore(){
  if(!FS_OK) return;
  window.showDirectoryPicker({mode:'readwrite',id:'ieci-dati'}).then(function(h){
    return h.getFileHandle('archivio-IECI.json').then(function(fh){ return fh.getFile(); }).then(function(f){ return f.text(); }).then(function(t){
      var o=JSON.parse(t); if(!o||o.tipo!=='archivio-preventivi-ieci') throw new Error('x');
      if(!dbEmpty()&&!confirm('Sostituire i dati di questo programma con quelli trovati nella cartella?')) return;
      snapSave('Prima di recuperare dalla cartella',function(){ restoreObj(o); MIR.h=h; kvPut('mirror-handle',h); renderMir(); $('nw-banner').hidden=true; toast('Dati recuperati dalla cartella «'+h.name+'»'); });
    });
  }).catch(function(e){ if(e&&e.name==='AbortError') return; toast('In quella cartella non trovo archivio-IECI.json'); });
}
$('mi-rest').addEventListener('click',mirRestore);
$('nw-dir').addEventListener('click',mirRestore);
$('nw-file').addEventListener('click',function(){ $('nw-banner').hidden=true; showPanel('salva'); toast('Premi «Ripristina da file» e scegli la tua copia di sicurezza'); });
$('nw-x').addEventListener('click',function(){ $('nw-banner').hidden=true; });
function newBanner(){ $('nw-dir').hidden=!FS_OK; $('nw-banner').hidden=!dbEmpty()||!!lsGet('ieci-nwx'); }
$('nw-x').addEventListener('click',function(){ lsSet('ieci-nwx','1'); });
/* protezione dati e aggiornamenti dell'app installata */
function renderPersist(){
  var st=$('pe-state'); if(!st) return;
  var sw=('serviceWorker' in navigator)&&!!navigator.serviceWorker.controller;
  $('up-chk').hidden=!(sw||HTTP); $('up-rl').hidden=!sw; $('up-auto').checked=autoUpdOn(); updStat();
  if(!(navigator.storage&&navigator.storage.persisted)){ st.textContent='Questo browser non offre la protezione avanzata: tieni attiva la copia automatica o fai la copia di sicurezza.'; $('pe-btn').hidden=true; return; }
  navigator.storage.persisted().then(function(p){ st.textContent=p?'Protezione attiva: il browser non cancellerà i dati da solo per fare spazio.':'Non ancora garantita: il browser potrebbe cancellare i dati se il telefono resta senza spazio. Premi «Proteggi i dati».'; $('pe-btn').hidden=!!p; });
}
$('pe-btn').addEventListener('click',function(){ navigator.storage.persist().then(function(ok){ renderPersist(); toast(ok?'Dati protetti':'Il browser non l\'ha concesso: installa l\'app dalla schermata Home e riprova'); }); });
$('up-chk').addEventListener('click',function(){ checkRemote(true); if(navigator.serviceWorker) navigator.serviceWorker.getRegistration().then(function(r){ if(r) r.update(); }); });
$('up-auto').addEventListener('change',function(e){ lsSet('ieci-autoupd',e.target.checked?'on':'off'); toast(e.target.checked?'Aggiornamento automatico attivo':'Ti avviso io quando c\'è una versione nuova'); });
$('up-rl').addEventListener('click',function(){
  var go=function(){ location.reload(); };
  (window.caches?caches.keys().then(function(k){ return Promise.all(k.map(function(x){ return caches.delete(x); })); }):Promise.resolve()).then(function(){ return navigator.serviceWorker.getRegistration(); }).then(function(r){ return r?r.unregister():0; }).then(go,go);
});
function showUpdBar(ver){
  if($('upd-bar')) return;
  var d=document.createElement('div'); d.id='upd-bar'; d.className='noprint';
  d.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:60;background:var(--brand);color:var(--on-brand);border-radius:8px;padding:12px 14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;box-shadow:0 8px 28px rgba(0,0,0,.35)';
  d.innerHTML='<span style="flex:1;min-width:180px"><b>Nuova versione '+(ver&&ver!=='nuova'?esc(ver)+' ':'')+'pronta.</b> I tuoi dati sono al sicuro.</span><button type="button" class="btn sm" style="background:#fff;color:#111" id="upd-go">Ricarica ora</button><button type="button" class="btn sm ghost" style="color:inherit;border-color:currentColor" id="upd-x">Più tardi</button>';
  document.body.appendChild(d);
  $('upd-go').onclick=function(){ doSave(); dbSave(true); setTimeout(function(){ location.reload(); },500); };
  $('upd-x').onclick=function(){ d.remove(); };
};
var HTTP=/^https?:$/.test(location.protocol), updBusy=false;
function vnum(v){ return String(v).split('.').map(function(x){ return parseInt(x,10)||0; }); }
function vnewer(a,b){ var x=vnum(a), y=vnum(b), i; for(i=0;i<Math.max(x.length,y.length);i++){ var d=(x[i]||0)-(y[i]||0); if(d) return d>0; } return false; }
function autoUpdOn(){ return lsGet('ieci-autoupd')!=='off'; }
function updStat(){ var el=$('up-stat'); if(!el) return; var t=+lsGet('ieci-chk')||0; el.textContent=HTTP?(t?'Ultimo controllo: '+stamp(t)+'.':'Non ancora controllato.'):'Questo è il file locale: il controllo automatico funziona con l\'app installata da GitHub Pages.'; }
function applyUpdate(){
  if(updBusy) return; updBusy=true;
  try{ doSave(); dbSave(true); }catch(e){}
  var go=function(){ try{ sessionStorage.setItem('ieci-rl',String(Date.now())); }catch(e){} location.reload(); };
  setTimeout(function(){
    (window.caches?caches.keys().then(function(ks){ return Promise.all(ks.map(function(k){ return caches.delete(k); })); }):Promise.resolve())
      .then(function(){ return navigator.serviceWorker?navigator.serviceWorker.getRegistration():null; }).then(function(r){ return r?r.update().catch(function(){}):0; }).then(go,go);
  },700);
}
function updateReady(ver){
  if(updBusy) return;
  var rl=0; try{ rl=+sessionStorage.getItem('ieci-rl')||0; }catch(e){}
  if(autoUpdOn()&&Date.now()-rl>90000){
    if(Date.now()-lastEdit<10000){ setTimeout(function(){ updateReady(ver); },5000); return; }
    toast('Aggiorno alla versione '+(ver||'nuova')+'…'); applyUpdate(); return;
  }
  showUpdBar(ver);
}
window.ieciUpdated=function(ver){ updateReady(ver||'nuova'); };
function checkRemote(manual){
  if(!HTTP){ if(manual) toast('Il controllo online funziona con l\'app installata da GitHub Pages'); return; }
  fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(j){
    lsSet('ieci-chk',String(Date.now())); updStat();
    var v=j&&j.v;
    if(v&&vnewer(v,APP_VER)) updateReady(v); else if(manual) toast('Hai già l\'ultima versione ('+APP_VER+')');
  }).catch(function(){ if(manual) toast('Controllo non riuscito: sei online? Il file version.json è stato caricato su GitHub?'); });
}
if(HTTP){
  setTimeout(function(){ checkRemote(false); },2500);
  setInterval(function(){ if(!document.hidden) checkRemote(false); },15*60*1000);
  document.addEventListener('visibilitychange',function(){ if(!document.hidden) setTimeout(function(){ checkRemote(false); },800); });
  window.addEventListener('online',function(){ checkRemote(false); });
}

