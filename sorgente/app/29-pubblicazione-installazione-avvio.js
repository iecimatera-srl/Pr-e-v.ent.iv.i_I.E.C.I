/* ---------- pubblicazione su GitHub (un solo tocco) ---------- */
function zipRead(buf){
  var u=new Uint8Array(buf), dv=new DataView(buf), i, eocd=-1;
  for(i=u.length-22;i>=Math.max(0,u.length-65557);i--){ if(dv.getUint32(i,true)===0x06054b50){ eocd=i; break; } }
  if(eocd<0) return Promise.reject(new Error('Questo non sembra un file zip.'));
  var n=dv.getUint16(eocd+10,true), p=dv.getUint32(eocd+16,true), ents=[], k;
  for(k=0;k<n;k++){
    if(dv.getUint32(p,true)!==0x02014b50) break;
    var meth=dv.getUint16(p+10,true), csz=dv.getUint32(p+20,true), nl=dv.getUint16(p+28,true), el=dv.getUint16(p+30,true), cl=dv.getUint16(p+32,true), lo=dv.getUint32(p+42,true);
    ents.push({name:new TextDecoder('utf-8').decode(u.subarray(p+46,p+46+nl)),meth:meth,csz:csz,lo:lo}); p+=46+nl+el+cl;
  }
  ents=ents.filter(function(e){ return !/\/$/.test(e.name)&&!/^__MACOSX\//.test(e.name)&&!/(^|\/)\.DS_Store$/.test(e.name); });
  return Promise.all(ents.map(function(e){
    var ln=dv.getUint16(e.lo+26,true), le=dv.getUint16(e.lo+28,true), st=e.lo+30+ln+le, raw=u.subarray(st,st+e.csz);
    if(e.meth===0) return {name:e.name,data:raw};
    if(e.meth!==8||typeof DecompressionStream==='undefined') throw new Error('Zip non leggibile da questo browser: aggiornalo o usa Chrome.');
    var ds=new DecompressionStream('deflate-raw'), w=ds.writable.getWriter(); w.write(raw); w.close();
    return new Response(ds.readable).arrayBuffer().then(function(ab){ return {name:e.name,data:new Uint8Array(ab)}; });
  }));
}
function pbB64(u){ var s='', i, CH=0x8000; for(i=0;i<u.length;i+=CH) s+=String.fromCharCode.apply(null,u.subarray(i,i+CH)); return btoa(s); }
function pbApi(method,path,body,tok){
  return fetch('https://api.github.com'+path,{method:method,headers:{'Authorization':'Bearer '+tok,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined})
    .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ if(!r.ok){ var e=new Error(j.message||('Errore '+r.status)); e.status=r.status; throw e; } return j; }); });
}
function pbCfg(){ try{ return JSON.parse(lsGet('ieci-pub')||'{}'); }catch(e){ return {}; } }
function pbLoad(){
  var c=pbCfg(), h=location.hostname, guess='';
  if(/\.github\.io$/.test(h)){ var ow=h.split('.')[0], rp=location.pathname.split('/')[1]; guess=ow+'/'+(rp||(ow+'.github.io')); }
  $('pb-repo').value=c.repo||guess; $('pb-br').value=c.br||''; $('pb-tok').value=c.tok||'';
}
function pbStore(){ lsSet('ieci-pub',JSON.stringify({repo:$('pb-repo').value.trim(),br:$('pb-br').value.trim(),tok:$('pb-tok').value.trim()})); }
['pb-repo','pb-br','pb-tok'].forEach(function(id){ $(id).addEventListener('input',pbStore); });
$('pb-clr').addEventListener('click',function(){ $('pb-tok').value=''; pbStore(); toast('Token dimenticato su questo dispositivo'); });
function pbSay(t,bad){ var o=$('pb-out'); o.textContent=t; o.style.color=bad?'var(--danger,#b3261e)':''; }
function pbErr(e,repo){
  if(e.status===401) return 'Token non valido o scaduto. Creane uno nuovo (vedi «Come creo il token»).';
  if(e.status===403) return 'GitHub rifiuta l\'operazione: il token deve avere «Contents: Read and write» su questo repository ('+e.message+').';
  if(e.status===404) return 'Repository o ramo non trovato: controlla «'+repo+'», il nome del ramo e che il token sia stato creato per questo repository.';
  if(e.status===409) return 'Il repository è vuoto: crea prima un file qualsiasi da GitHub (Add file → Create new file, ad esempio LEGGIMI.md), poi riprova.';
  return e.message||'Errore sconosciuto';
}
function pbRun(file){
  var repo=$('pb-repo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/+$/,''), br=$('pb-br').value.trim(), tok=$('pb-tok').value.trim();
  if(!/^[\w.-]+\/[\w.-]+$/.test(repo)){ pbSay('Scrivi il repository nel formato utente/nome.',true); return; }
  if(!tok){ pbSay('Incolla il token GitHub (vedi «Come creo il token»).',true); return; }
  $('pb-repo').value=repo; pbStore(); pbSay('Leggo lo zip…');
  file.arrayBuffer().then(zipRead).then(function(files){
    var tops={}; files.forEach(function(f){ var a=f.name.split('/'); tops[a.length>1?a[0]:'']=1; });
    var keys=Object.keys(tops), pre=(keys.length===1&&keys[0])?keys[0]+'/':'';
    files=files.map(function(f){ return {name:f.name.slice(pre.length),data:f.data}; }).filter(function(f){ return f.name; });
    var names=files.map(function(f){ return f.name; });
    if(names.indexOf('index.html')<0) throw new Error('Nello zip manca index.html.');
    if(names.indexOf('sw.js')<0||names.indexOf('manifest.webmanifest')<0) throw new Error('Questo è lo zip sbagliato (probabilmente quello Windows). Serve «IECI-preventivi-Android-PWA.zip».');
    var ver='', vf=files.filter(function(f){ return f.name==='version.json'; })[0];
    if(vf){ try{ ver=JSON.parse(new TextDecoder().decode(vf.data)).v||''; }catch(e){} }
    if(!window.confirm('Pubblicare '+(ver?'la versione '+ver+' ':'')+'('+files.length+' file) su '+repo+'?\nTutti i dispositivi si aggiorneranno da soli in 1-2 minuti.')) { pbSay('Annullato.'); return; }
    var br0=br, sha, tree;
    return (br0?Promise.resolve(br0):pbApi('GET','/repos/'+repo,null,tok).then(function(r){ return r.default_branch||'main'; })).then(function(b){
      br=b; pbSay('Collego «'+repo+'» (ramo '+b+')…');
      return pbApi('GET','/repos/'+repo+'/git/ref/heads/'+encodeURIComponent(b).replace(/%2F/g,'/'),null,tok);
    }).then(function(ref){
      sha=ref.object.sha; return pbApi('GET','/repos/'+repo+'/git/commits/'+sha,null,tok);
    }).then(function(cm){
      tree=cm.tree.sha; var out=[], i=0;
      function next(){
        if(i>=files.length) return Promise.resolve(out);
        var f=files[i++]; pbSay('Carico i file… '+i+'/'+files.length+' ('+f.name+')');
        return pbApi('POST','/repos/'+repo+'/git/blobs',{content:pbB64(f.data),encoding:'base64'},tok).then(function(b){ out.push({path:f.name,mode:'100644',type:'blob',sha:b.sha}); return next(); });
      }
      return next();
    }).then(function(entries){
      pbSay('Creo la versione…');
      return pbApi('POST','/repos/'+repo+'/git/trees',{base_tree:tree,tree:entries},tok);
    }).then(function(t){
      return pbApi('POST','/repos/'+repo+'/git/commits',{message:'Aggiornamento IECI preventivi'+(ver?' '+ver:''),tree:t.sha,parents:[sha]},tok);
    }).then(function(c){
      return pbApi('PATCH','/repos/'+repo+'/git/refs/heads/'+encodeURIComponent(br).replace(/%2F/g,'/'),{sha:c.sha},tok).then(function(){ return c; });
    }).then(function(c){
      pbSay('✓ Pubblicata'+(ver?' la versione '+ver:'')+' (commit '+c.sha.slice(0,7)+'). GitHub Pages la mette online in 1-2 minuti: poi telefono e PC si aggiornano da soli.');
      toast('Versione pubblicata su GitHub');
      if(HTTP&&ver&&/\.github\.io$/.test(location.hostname)){ var tries=0; (function poll(){ if(++tries>24) return; setTimeout(function(){
        fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){ return r.json(); }).then(function(j){ if(j&&j.v===ver) pbSay('✓ Online la versione '+ver+': i dispositivi si stanno aggiornando.'); else poll(); }).catch(poll); },15000); })(); }
    });
  }).catch(function(e){ pbSay('✗ '+pbErr(e,repo),true); });
}
$('pb-file').addEventListener('change',function(e){ var f=e.target.files&&e.target.files[0]; e.target.value=''; if(f) pbRun(f); });
pbLoad();
/* installazione come app (diagnosi) */
var DEFER=null;
window.addEventListener('beforeinstallprompt',function(e){ e.preventDefault(); DEFER=e; renderInstall(); });
window.addEventListener('appinstalled',function(){ DEFER=null; renderInstall(); toast('App installata'); });
function isStandalone(){ try{ return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true; }catch(e){ return false; } }
function renderInstall(){
  var st=$('in-state'); if(!st) return; var web=/^https?:$/.test(location.protocol);
  $('in-btn').hidden=!DEFER;
  if(isStandalone()) st.textContent='Stai già usando l\'app installata.';
  else if(web&&!document.querySelector('link[rel="manifest"]')) st.textContent='⚠ Su questo sito hai caricato il file sbagliato: manca il «manifest» dell\'app, per questo Chrome dice «This app cannot be installed». Carica l\'INTERA cartella del pacchetto Android (Preventivi-IECI-Android-PWA.zip, scompattato), non il file HTML singolo né il pacchetto Windows.';
  else if(!web) st.textContent='Questo è il file locale: l\'installazione come app si fa dall\'indirizzo online (https) del programma, aperto con Chrome.';
  else if(DEFER) st.textContent='Pronta: premi «Installa IECI preventivi».';
  else st.textContent='Chrome non propone l\'installazione in questo momento (puo\' essere già installata, oppure serve qualche secondo). Premi «Controlla l\'installazione».';
}
$('in-btn').addEventListener('click',function(){ if(!DEFER) return; DEFER.prompt(); DEFER.userChoice.then(function(c){ DEFER=null; renderInstall(); if(c&&c.outcome==='accepted') toast('Installazione avviata'); }); });
$('in-diag').addEventListener('click',function(){
  var out=$('in-out'), L=[]; out.hidden=false; out.textContent='Controllo…';
  function ok(b,t){ L.push((b?'✓ ':'✗ ')+t); }
  var web=/^https?:$/.test(location.protocol); ok(web&&isSecureContext,'Indirizzo sicuro https'+(web?'':' (qui sei su un file locale)'));
  ok('serviceWorker' in navigator&&!!navigator.serviceWorker.controller,'Funzionamento offline attivo (service worker)');
  ok(isStandalone(),'Aperta come app installata'+(isStandalone()?'':' (adesso sei nel browser)'));
  ok(!!DEFER,'Chrome offre l\'installazione ora');
  var lk=document.querySelector('link[rel="manifest"]');
  if(!lk||!web){ ok(false,'Manifest dell\'app'+(web?' non trovato nella pagina':' (solo online)')); out.textContent=L.join('\n'); return; }
  fetch(lk.href,{cache:'no-store'}).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }).then(function(j){
    ok(true,'Manifest letto: nome «'+j.name+'»');
    var jobs=(j.icons||[]).map(function(ic){ var u=new URL(ic.src,lk.href).href; return fetch(u,{cache:'no-store'}).then(function(r){ ok(r.ok,'Icona '+ic.src+' ('+ic.sizes+(ic.purpose?', '+ic.purpose:'')+')'+(r.ok?'':' MANCANTE sul sito')); }).catch(function(){ ok(false,'Icona '+ic.src+' MANCANTE sul sito'); }); });
    return Promise.all(jobs);
  }).catch(function(e){ ok(false,'Manifest non leggibile ('+e.message+')'+(/40[13]/.test(e.message)?': il sito rifiuta l\'accesso al file (protezione/password di Netlify?)':': carica di nuovo TUTTA la cartella dell\'app')); }).then(function(){
    if(L.some(function(x){ return /HTTP 40[13]/.test(x); })) L.push('\n→ Il sito risponde 401/403 al file del manifest: Chrome lo scarica senza accesso e quindi non installa. Soluzione: spegni la protezione/password del sito (Netlify › Site configuration › Access) oppure pubblica l\'app su GitHub Pages (vedi LEGGIMI), che è pubblico e gratuito.');
    else if(L.some(function(x){ return /MANCANTE|non leggibile/.test(x); })) L.push('\n→ Sul sito mancano dei file: carica di nuovo l\'INTERA cartella dell\'app (non solo index.html), poi riapri Chrome.');
    else if(!DEFER&&!isStandalone()) L.push('\n→ Tutto a posto lato sito. Se Chrome non propone «Installa app»: chiudi e riapri Chrome, controlla se l\'app è già installata (Impostazioni › App), oppure usa il menu ⋮ › «Aggiungi a schermata Home».');
    out.textContent=L.join('\n'); renderInstall();
  });
});
// protezione dei dati dal browser: chiesta a app sbloccata e tranquilla (alcuni browser mostrano un «Consenti»)
function persistiDopo(){ setTimeout(function(){ var P=window.PINPAD; if(document.documentElement.classList.contains('locked')||P&&P.locked){ window.addEventListener('ieci-sbloccato',function(){ setTimeout(persistiDopo,4000); },{once:true}); return; } try{ if(navigator.storage&&navigator.storage.persisted) navigator.storage.persisted().then(function(p){ if(!p&&navigator.storage.persist) navigator.storage.persist().then(function(){ try{ renderPersist(); }catch(e){} }); }); }catch(e){} },4000); }
function afterLoad(){ setTimeout(libMigra,1200); renderArchivio(); renderRecover(); persistiDopo(); verCheck(); renderSnaps(); mirInit(); newBanner(); renderPersist(); renderInstall(); }
function exportAll(){
  if(S.qid&&dbReady) saveQuote(true);
  var txt=JSON.stringify(buildPayload()), name=backupName();
  if(!CAN_PRINT){ copyText(txt,'Copia negli appunti: incollala in un file di testo per conservarla'); markBackup(); return; }
  var f=null; try{ f=new File([txt],name,{type:'text/plain'}); }catch(e){}
  var touchDev=false; try{ touchDev=window.matchMedia('(pointer:coarse)').matches; }catch(e){}
  function down(){ dlBlob(new Blob([txt],{type:'application/json'}),name); toast('Copia salvata: '+name); markBackup(); }
  if(f&&touchDev&&navigator.canShare&&navigator.canShare({files:[f]})){
    navigator.share({files:[f],title:'Archivio preventivi IECI'}).then(function(){ toast('Copia condivisa'); markBackup(); }).catch(function(e){ if(!e||e.name!=='AbortError') down(); });
  } else down();
}
function importAll(o){
  if(!o||o.tipo!=='archivio-preventivi-ieci'||!o.db) throw new Error('x');
  var replace=document.querySelector('input[name="imp-mode"]:checked').value==='replace';
  var d=o.db, nC=0,nP=0,nQ=0;
  if(replace){
    DB.clients=(d.clients||[]).slice(); DB.prods=(d.prods||[]).slice(); DB.quotes=(d.quotes||[]).slice(); DB.arts=(d.arts||[]).slice(); DB.logos=(d.logos||[]).slice(); DB.parole=(d.parole||[]).slice(); DB.del=d.del||{}; DB.su=o.su||0;
    nC=DB.clients.length; nP=DB.prods.length; nQ=DB.quotes.length;
  } else {
    (d.clients||[]).forEach(function(c){ if(!DB.clients.some(function(x){ return lc(x.name)===lc(c.name); })){ DB.clients.push(c); nC++; } });
    (d.prods||[]).forEach(function(p){ if(!DB.prods.some(function(x){ return lc(x.name)===lc(p.name)&&lc(x.code)===lc(p.code); })){ DB.prods.push(p); nP++; } });
    (d.quotes||[]).forEach(function(q){ var ex=DB.quotes.filter(function(x){ return x.id===q.id; })[0]; if(!ex){ DB.quotes.push(q); nQ++; } else if(q.upd>ex.upd){ DB.quotes[DB.quotes.indexOf(ex)]=q; nQ++; } });
    (d.arts||[]).forEach(function(a){ var ex=DB.arts.filter(function(x){ return artKey(x)===artKey(a); })[0]; if(!ex) DB.arts.push(a); else if((a.upd||0)>(ex.upd||0)) DB.arts[DB.arts.indexOf(ex)]=a; });
    mergeByKey('logos',d.logos,function(x){ return iwK(x.name); }); mergeByKey('parole',d.parole,function(x){ return x.m+'|'+x.k; });
  }
  if(replace&&o.menu){ MENU=o.menu; menuFix(); menuSave(); renderNav(); }
  DB.clients.sort(byName); DB.prods.sort(byName);
  if(replace||!DB.su||(o.su||0)>DB.su){ if(o.company) S.company=o.company; if(o.profile) S.profile=o.profile; if(o.style) S.style=o.style; if(o.trust) S.trust=o.trust; if(o.ccond) S.ccond=o.ccond; if(o.mtpl&&o.mtpl.length){ S.mtpl=o.mtpl; S.mdef=o.mdef||o.mtpl[0].id; } if(o.cat){ S.cat=o.cat; S.cgroups=o.cgroups||{}; ORDER.forEach(function(k){ cgSync(k); }); } if(o.su) DB.su=o.su; S=normalize(S); doSave(); renderAll(); }
  if(replace){ var last=DB.quotes.slice().sort(function(a,b){ return b.upd-a.upd; })[0]; S.qid=''; if(last) openQuote(last.id); }
  dbSave(); renderArchivio(); toast((replace?'Ripristino completato: ':'Importati: ')+nQ+' preventivi, '+nC+' clienti, '+nP+' prodotti');
}
$('db-exp').addEventListener('click',exportAll);
$('bk-now').addEventListener('click',exportAll);
$('bk-banner').addEventListener('click',function(e){ if(e.target.id!=='bk-now') showPanel('salva'); });
$('db-imp').addEventListener('change',function(e){
  var f=e.target.files&&e.target.files[0]; e.target.value=''; if(!f) return;
  var fr=new FileReader(); fr.onload=function(){ try{ importAll(JSON.parse(String(fr.result))); }catch(x){ toast('File non valido: scegli una copia creata da questo programma'); } }; fr.readAsText(f);
});
$('db-imp-txt').addEventListener('click',function(){ var t=$('db-txt').value; try{ importAll(JSON.parse(t)); $('db-txt').value=''; }catch(x){ toast('Testo non valido'); } });

function svAgo(t){ if(!t) return 'mai'; var d=Math.floor((Date.now()-t)/86400000), h=new Date(t).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}); return d<1?('oggi '+h):d===1?('ieri '+h):(d+' giorni fa'); }
function svDash(){
  var el=$('sv-dash'); if(!el) return;
  var lb=DB.lastBackup||0, ch=DB.lastChange||0, old=!lb||ch>lb&&Date.now()-lb>86400000*3, gh=!!(GH&&GH.on), gd=!!(GD&&GD.on);
  var sy=gh?('GitHub attivo'+(GH.last?' · '+svAgo(GH.last):'')):gd?('Google Drive attivo'+(GD.last?' · '+svAgo(GD.last):'')):'Non attiva';
  el.innerHTML='<div class="t"><small>Preventivi</small><b>'+DB.quotes.length+'</b></div><div class="t"><small>Clienti</small><b>'+DB.clients.length+'</b></div><div class="t"><small>Prodotti</small><b>'+DB.prods.length+'</b></div>'+
    '<div class="t '+(old?'warn':'ok')+'"><small>Ultima copia</small><b>'+svAgo(lb)+'</b></div>'+
    '<div class="t '+((gh||gd)?'ok':'')+'"><small>Sincronizzazione</small><b>'+esc(sy)+'</b></div>'+
    '<div class="t"><small>Versione app</small><b>'+esc(APP_VER)+'</b></div>'+
    '<div class="t wide"><span>'+(old?'Conviene fare una copia di sicurezza adesso.':'Tutto in ordine: i tuoi dati sono al sicuro.')+'</span><button class="btn sm" id="sv-now" type="button">Salva copia ora</button></div>';
}
document.addEventListener('click',function(e){ if(e.target.id==='sv-now'){ var b=$('db-exp'); if(b) b.click(); setTimeout(svDash,600); } });
function renderBackupInfo(){
  svDash();
  var lb=DB.lastBackup||0, ch=DB.lastChange||0, has=DB.quotes.length+DB.clients.length+DB.prods.length>0;
  var days=lb?Math.floor((Date.now()-lb)/86400000):-1;
  $('bk-state').textContent=lb?('Ultima copia di sicurezza: '+new Date(lb).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'})+(ch>lb?' · ci sono modifiche successive.':' · tutto è salvato nella copia.')):'Non hai ancora fatto nessuna copia di sicurezza.';
  var need=has&&ch>lb&&(!lb||days>=7||(ch-lb)>0&&Date.now()-lb>86400000*3);
  $('bk-banner').hidden=!need;
  if(need) $('bk-msg').textContent=lb?('Ultima copia di sicurezza: '+(days<1?'oggi':days+' giorni fa')+'. Hai dati nuovi non ancora salvati in una copia.'):'Non hai ancora una copia di sicurezza dei tuoi dati.';
}

/* testo, dati, stampa */
function plainText(){
  var T=totals(),m=S.meta,out=[];
  out.push(S.company.name); out.push(S.company.piva+' · '+S.company.addr); out.push('');
  out.push('PREVENTIVO N. '+m.num+' del '+dateIt(m.date)); out.push(docTitle().toUpperCase());
  out.push('Cliente: '+S.client.name+(S.client.addr?' — '+S.client.addr:'')); out.push('');
  var ptL=function(l,i){ out.push((i+1)+'. '+l.d+' — '+qfmt(num(l.q))+' '+l.u+' × '+eur(num(l.p))+(num(l.s)?' (−'+qfmt(num(l.s))+'%)':'')+' = '+eur(lineTotal(l))); }, AL=activeLines();
  if(S.model==='app'){ groupLines(AL).forEach(function(g){ out.push(groupName(g).toUpperCase()+' ('+eur(groupSum(g))+')'); g.items.forEach(function(x){ ptL(x.l,x.i); }); out.push(''); }); }
  else AL.forEach(ptL);
  out.push(''); out.push('Totale lavori: '+eur(T.sub));
  if(T.disc) out.push('Sconto '+qfmt(num(m.disc))+'%: −'+eur(T.disc)+' · Imponibile: '+eur(T.imp));
  out.push('IVA '+qfmt(num(m.iva))+'%: '+eur(T.iva)); out.push('TOTALE: '+eur(T.tot));
  if(num(m.dep)>0){ out.push('Acconto '+qfmt(num(m.dep))+'%: '+eur(T.dep)); out.push('Saldo: '+eur(T.saldo)); }
  out.push(''); out.push(S.pay); out.push(''); out.push(S.notes);
  return out.join('\n');
}
function copySilent(t){ var done=false; try{ var ta=document.createElement('textarea'); ta.value=t; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); try{ done=document.execCommand('copy'); }catch(x){} document.body.removeChild(ta); }catch(e){} try{ if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(t).catch(function(){}); }catch(e){} return done; }
function copyText(txt,ok){
  function fallback(){
    var ta=document.createElement('textarea'); ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select(); var done=false; try{ done=document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta); toast(done?ok:'Copia non riuscita: seleziona il testo a mano');
  }
  try{ navigator.clipboard.writeText(txt).then(function(){toast(ok);},fallback); }catch(e){ fallback(); }
}
$('copy-text').addEventListener('click',function(){ copyText(plainText(),'Preventivo copiato'); });
$('j-copy').addEventListener('click',function(){ $('json').value=JSON.stringify(S); copyText($('json').value,'Dati copiati'); });
$('j-load').addEventListener('click',function(){
  try{
    var d=JSON.parse($('json').value);
    if(!d.meta||!d.lines||!d.cat||!d.company||!d.client) throw new Error('x');
    var base=fresh(); Object.keys(base).forEach(function(k){ if(d[k]===undefined) d[k]=base[k]; });
    S=normalize(d);
    save(); renderAll(); toast('Dati caricati');
  }catch(e){ toast('Testo non valido: incolla i dati copiati con "Copia dati"'); }
});
$('j-new').addEventListener('click',newQuote);
if(CAN_PRINT){ $('print').hidden=false; $('print').addEventListener('click',function(){ window.print(); }); }
else { $('print-hint').hidden=false; }

function renderStamp(){ var el=$('stamp-prev'); if(el) el.innerHTML=S.company.stamp?'<img src="'+S.company.stamp+'" alt="">':'';
  if(S.company.stamp&&!S.company.stampAr){ var im=new Image(); im.onload=function(){ S.company.stampAr=(im.width/im.height)||1.4; schedule(); }; im.src=S.company.stamp; } }
$('stamp-file').addEventListener('change',function(e){ var f=e.target.files&&e.target.files[0]; e.target.value=''; if(!f) return; readImage(f,600,false,function(u){ if(!u) return;
  var fin=function(v){ var im=new Image(); im.onload=function(){ S.company.stamp=v; S.company.stampAr=(im.width/im.height)||1.4; renderStamp(); touch(); }; im.onerror=function(){ S.company.stamp=v; renderStamp(); touch(); }; im.src=v; };
  try{ cutout(u,function(r,ok){ fin(ok&&r?r:u); },60); }catch(err){ fin(u); } }); });
$('stamp-rm').addEventListener('click',function(){ S.company.stamp=''; renderStamp(); touch(); });
$('m-type').innerHTML=ORDER.map(function(k){ return '<option value="'+k+'">'+esc(MODELS[k].name)+'</option>'; }).join('');
$('m-type').addEventListener('change',function(e){
  var prev=S.model; S.model=e.target.value;
  condSwitch(prev);
  typeTitle(prev); vmSync();
  ensureRooms(); renderTabs(); renderRooms(); renderVc(); renderCat(); renderLines(); renderPlan(); touch();
});
var _ttl='';
window.addEventListener('beforeprint',function(){ _ttl=document.title; document.title=fileBase(); });
window.addEventListener('afterprint',function(){ if(_ttl) document.title=_ttl; });
try{ if(window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){ lastAppLogo=''; brandUI(); }); }catch(e){}
COLL.app=COLL.dom; CRONO_DEF.app=CRONO_DEF.dom; MARKT.app=MARKT.dom;
showPanel('prev');
// un solo disegno all'avvio, con i dati veri: prima si legge il preventivo salvato, poi si disegna (al massimo si aspetta 600 ms)
// con il PIN attivo l'app si prepara dietro il tastierino (che ha il suo motore e risponde comunque):
// allo sblocco è già pronta, manca solo il fascicolo, che si disegna subito dopo
var avviato=false, avvioInAttesa=false;
// mentre scrivi il PIN l'app non lavora: riparte quando il PIN è in verifica o se non tocchi niente
function dopoPin(fn){ var P=window.PINPAD; if(P&&P.locked&&!P.calmo()){ setTimeout(function(){ dopoPin(fn); },100); return; } fn(); }
function avvia(){ if(avviato) return; var PPd=window.PINPAD; if(PPd&&PPd.locked&&!PPd.calmo()){ clearTimeout(tAvvio); tAvvio=setTimeout(avvia,100); return; } avviato=true; avvioInAttesa=false; renderAll(); apInit(); apApply(); apRefresh(); }
var tAvvio=setTimeout(avvia,600);
idbOpen(function(ok){
  if(!ok){ clearTimeout(tAvvio); avvia(); dbLoad(afterLoad); return; }
  idbGet(function(st){ clearTimeout(tAvvio); dopoPin(function(){
    clearTimeout(tAvvio);
    if(st&&st.meta){ S=normalize(st); if(avviato) renderAll(); else if(!avvioInAttesa) avvia(); }
    else { avvia(); doSave(); }
    dbLoad(function(){ dopoPin(afterLoad); });
  }); });
});
};
(function parti(){ var P=window.PINPAD; if(P&&P.locked&&!P.calmo()){ setTimeout(parti,100); return; } __ieciApp(); })();
