/* ---------- libreria prodotti automatica ----------
   Ogni scheda prodotto con un nome (creata a mano, dall'assistente, da un documento o da una foto) finisce da sola
   nella libreria con tutto quello che contiene: marca, codice, descrizione, caratteristiche, foto (anche gli originali
   con lo sfondo), link, scheda PDF, etichette, grandezza della foto e l'ultimo prezzo e unità usati nel preventivo.
   Modificando la scheda si aggiorna anche la libreria. Un prodotto eliminato dalla libreria non torna da solo. */
var LIB={t:0, sig:{}};
var LIB_VIA=['on','sys','sol','libId','x','pc','pcs'];
function libKey(p){ return lc(p.name)+'|'+lc(p.code); }
function libVuoto(v){ return v==null||v===''||(Array.isArray(v)&&!v.length)||(typeof v==='object'&&!Array.isArray(v)&&!Object.keys(v).length); }
function libSig(p,pz){ var ph=(p.photos||[]).map(function(u){ return iwH(u); }).join(','); return [p.name,p.brand,p.code,p.desc,p.specs,p.link,p.tags,p.ps,p.bg,ph,p.pdf?p.pdf.name+String(p.pdf.data||'').length:'',pz?pz.p+'/'+pz.u:''].join('§'); }
function libNo(p){ return (DB.libNo||[]).indexOf(libKey(p))>-1; }
// ultimo prezzo e unità della voce collegata alla scheda
function libPrezzo(p,lines){
  var l=null; (lines||[]).forEach(function(x){ if(l||x.vm) return; if((x.pid&&x.pid===p.id)||lcn(x.d)===lcn(p.name)) l=x; });
  return l&&num(l.p)>0?{p:num(l.p),u:String(l.u||'cad')}:null;
}
function libCerca(p){
  var e=null;
  if(p.libId) DB.prods.forEach(function(x){ if(!e&&x.id===p.libId) e=x; });
  if(!e){ var k=libKey(p); DB.prods.forEach(function(x){ if(!e&&libKey(x)===k) e=x; }); }
  if(!e&&String(p.code||'').trim()) DB.prods.forEach(function(x){ if(!e&&lc(x.code)===lc(p.code)&&(!x.brand||!p.brand||lc(x.brand)===lc(p.brand))) e=x; });
  return e;
}
// salva o aggiorna un prodotto nella libreria; i campi vuoti della scheda non cancellano quelli già in libreria
function libSalva(p,pz){
  if(!p||!String(p.name||'').trim()||libNo(p)) return 0;
  var c=copy(p), e=libCerca(p), nuovo=!e;
  LIB_VIA.forEach(function(k){ delete c[k]; });
  if(pz){ c.lp=pz.p; c.lu=pz.u; }
  if(nuovo){ c.id=uid(); c.upd=Date.now(); DB.prods.push(c); p.libId=c.id; return 1; }
  var cambi=0;
  Object.keys(c).forEach(function(k){ if(k==='id') return; var v=c[k];
    if(k==='photos'){ if(v&&v.length&&JSON.stringify(v)!==JSON.stringify(e.photos||[])){ e.photos=v.slice(); e.po=(c.po||[]).slice(); if(c.cr) e.cr=copy(c.cr); cambi++; } return; }
    if(k==='po'||k==='cr') return;
    if(libVuoto(v)) return;
    if(JSON.stringify(e[k])!==JSON.stringify(v)){ e[k]=copy(v); cambi++; } });
  if(cambi) e.upd=Date.now();
  p.libId=e.id; return cambi?2:0;
}
// tutte le schede del preventivo aperto (chiamata poco dopo ogni modifica)
function libSync(silenzio){
  if(!dbReady||!S||!S.products) return {n:0,a:0};
  var demo=libDemo(); // le schede del preventivo di esempio non riempiono la libreria
  var n=0, a=0;
  S.products.forEach(function(p){ if(!String(p.name||'').trim()||demo[lcn(p.name)]&&!(p.photos&&p.photos.length)&&!p.libId) return; var pz=libPrezzo(p,S.lines), sg=libSig(p,pz); if(LIB.sig[p.id]===sg) return; LIB.sig[p.id]=sg; var r=libSalva(p,pz); if(r===1) n++; else if(r===2) a++; });
  if(n||a){ DB.prods.sort(byName); dbSave(); try{ renderArchivio(); }catch(e){} if(n) try{ renderProducts(); }catch(e){} if(!silenzio&&n) toast(n===1?'Prodotto salvato nella libreria prodotti':n+' prodotti salvati nella libreria prodotti'); }
  return {n:n,a:a};
}
var LIB_DEMO=null;
function libDemo(){ if(!LIB_DEMO){ LIB_DEMO={}; try{ (fresh().products||[]).forEach(function(p){ LIB_DEMO[lcn(p.name)]=1; }); }catch(e){} } var c=S.client||{}; return (c.name==='Mario Rossi'&&/^Via Verdi 12/.test(c.addr||''))?LIB_DEMO:{}; }
function libSoon(){ clearTimeout(LIB.t); LIB.t=setTimeout(function(){ idle(function(){ libSync(true); }); },1500); }
// una volta sola: recupero i prodotti dei preventivi già salvati
function libMigra(){
  if(!dbReady||DB.libMig>=1) return;
  var n=0;
  DB.quotes.forEach(function(q){ var d=q.data; if(!d||!d.products) return; d.products.forEach(function(p){ if(libSalva(p,libPrezzo(p,d.lines||[]))===1) n++; }); });
  libSync(true);
  DB.libMig=1; DB.prods.sort(byName); dbSave(true); try{ renderArchivio(); }catch(e){}
  if(n) toast('Libreria prodotti: '+n+(n===1?' prodotto recuperato':' prodotti recuperati')+' dai tuoi preventivi');
}
// «Aggiungi al preventivo» dalla libreria: voce con l'ultimo prezzo usato e scheda collegata con tutto
function libAggiungi(id){
  var s=DB.prods.filter(function(x){ return x.id===id; })[0]; if(!s) return;
  var p=copy(s); p.id=uid(); p.on=true; p.libId=s.id; delete p.lp; delete p.lu; delete p.upd;
  var l={d:s.name,u:s.lu||'cad',q:1,p:num(s.lp),s:0,pid:p.id}; if(s.brand) l.br=s.brand;
  if(S.model==='app'&&curKey()) l.r=curKey(); brTag(l);
  S.products.push(p); S.lines.push(l); openP[p.id]=true; LIB.sig[p.id]=libSig(p,libPrezzo(p,S.lines));
  renderLines(); renderProducts(); touch(); toast('Aggiunto al preventivo: '+s.name+(num(s.lp)?' · '+eur(num(s.lp)):' · scrivi il prezzo'));
}
(function(T){ if(!T) return; T.libMigra=libMigra; T.libSync=libSync; })(window.IECI_T);
