/* ---------- archivio: clienti, libreria prodotti, preventivi salvati ---------- */
var pendDel=null, pendT=0;
function dbSave(ns){
  if(!dbReady) return; mirSoon(); if(!ns){ DB.lastChange=Date.now(); gdPushSoon(); if(typeof ghPushSoon==='function') ghPushSoon(); } clearTimeout(dbT);
  dbT=setTimeout(function(){
    if(IDB){ try{ var tx=IDB.transaction('kv','readwrite'); tx.objectStore('kv').put(DB,DBKEY); tx.onerror=tx.onabort=function(){ warnStore(); }; }catch(e){ warnStore(); } }
    else { try{ localStorage.setItem(DBKEY,JSON.stringify(DB)); }catch(e){ warnStore(); } }
  },300);
}
function dbLoad(cb){
  function fin(d){ if(d&&typeof d==='object'){ DB.clients=d.clients||[]; DB.prods=d.prods||[]; DB.quotes=d.quotes||[]; DB.arts=d.arts||[]; DB.logos=d.logos||[]; DB.parole=d.parole||[]; DB.del=d.del||{}; DB.su=d.su||0; DB.lastBackup=d.lastBackup||0; DB.lastChange=d.lastChange||0; } dbReady=true; if(cb) cb(); }
  if(IDB){ try{ var q=IDB.transaction('kv').objectStore('kv').get(DBKEY); q.onsuccess=function(){ fin(q.result); }; q.onerror=function(){ fin(null); }; }catch(e){ fin(null); } }
  else { var r=null; try{ r=JSON.parse(localStorage.getItem(DBKEY)); }catch(e){} fin(r); }
}
function byName(a,b){ return String(a.name||'').toLowerCase()<String(b.name||'').toLowerCase()?-1:1; }
function lc(s){ return String(s||'').trim().toLowerCase(); }
function saveClient(silent){
  var c=S.client, nm=(c.name||'').trim();
  if(!nm){ if(!silent) toast('Scrivi prima il nome del cliente'); return; }
  var ex=DB.clients.filter(function(x){ return lc(x.name)===lc(nm); })[0];
  if(ex){ ex.addr=c.addr||''; ex.tel=c.tel||''; ex.email=c.email||''; }
  else DB.clients.push({id:uid(),name:nm,addr:c.addr||'',tel:c.tel||'',email:c.email||''});
  DB.clients.sort(byName); dbSave(); renderArchivio();
  if(!silent) toast(ex?'Cliente aggiornato':'Cliente salvato in rubrica');
}
function useClient(id){
  var c=DB.clients.filter(function(x){ return x.id===id; })[0]; if(!c) return;
  S.client={name:c.name,addr:c.addr,tel:c.tel,email:c.email}; syncFields(); renderInvio(); touch(); toast('Cliente inserito: '+c.name);
}
function saveProd(i,silent){
  var p=copy(S.products[i]); if(!p||!(p.name||'').trim()){ if(!silent) toast('Dai prima un nome al prodotto'); return false; }
  delete p.on;
  var ex=DB.prods.filter(function(x){ return lc(x.name)===lc(p.name)&&lc(x.code)===lc(p.code); })[0];
  if(ex){ if(silent) return false; p.id=ex.id; DB.prods[DB.prods.indexOf(ex)]=p; } else { p.id=uid(); DB.prods.push(p); }
  DB.prods.sort(byName); dbSave(); renderArchivio(); if(!silent) toast(ex?'Prodotto aggiornato in libreria':'Prodotto salvato in libreria'); return true;
}
function useProd(id){
  var s=DB.prods.filter(function(x){ return x.id===id; })[0]; if(!s) return;
  var p=copy(s); p.id=uid(); p.on=true; S.products.push(p); openP[p.id]=true; renderProducts(); touch(); toast('Aggiunto: '+p.name);
}
function nextNum(){
  var y=new Date().getFullYear(), mx=0;
  DB.quotes.forEach(function(q){ var m=String(q.num).match(/^(\d{4})\/(\d+)$/); if(m&&+m[1]===y) mx=Math.max(mx,+m[2]); });
  return y+'/'+('00'+(mx+1)).slice(-3);
}
function quoteName(){ return (String(S.client.name||'').trim()||'Senza cliente')+' · '+dateIt(S.meta.date); }
function qName(q){ return q.name||((q.client||'Senza cliente')+' · '+dateIt((q.data&&q.data.meta&&q.data.meta.date)||'')); }
function fileBase(){ return ('Preventivo '+(String(S.client.name||'').trim()||'Senza cliente')+' '+dateIt(S.meta.date).replace(/\//g,'-')).replace(/[\\\/:*?"<>|]+/g,'-'); }
function saveQuote(silent){
  var isNew=!S.qid; if(isNew) S.qid=uid();
  if(!silent){
    saveClient(true);
    S.products.forEach(function(p,i){ saveProd(i,true); });
    var cat=S.cat[S.model], n=0;
    S.lines.forEach(function(l){ var d=String(l.d||'').trim(); if(d&&num(l.p)>0&&!cat.some(function(it){ return lc(it[0])===lc(d); })){ cat.push([d,l.u||'cad',num(l.p)]); n++; } });
    if(n) renderCat();
  }
  var meta={id:S.qid,num:S.meta.num,st:S.meta.status||'bozza',name:quoteName(),title:docTitle(),client:S.client.name,tot:acceptedCalc().tot,upd:Date.now(),model:S.model};
  var e=DB.quotes.filter(function(q){ return q.id===S.qid; })[0];
  if(e&&!isNew&&e.data){ var d0=JSON.parse(JSON.stringify(S)); delete d0.cat; if(JSON.stringify(e.data)===JSON.stringify(d0)&&e.name===meta.name&&e.title===meta.title&&e.tot===meta.tot&&e.client===meta.client&&e.st===meta.st){ if(!silent) toast('Preventivo salvato nell\'archivio'); return; } }
  if(!e){ e=meta; DB.quotes.push(e); } else { Object.keys(meta).forEach(function(k){ e[k]=meta[k]; }); }
  var d=JSON.parse(JSON.stringify(S)); delete d.cat; e.data=d;
  dbSave(); renderArchivio(); if(isNew) save();
  if(!silent) toast('Preventivo salvato nell\'archivio');
}
function syncQuoteSoon(){ clearTimeout(qT); qT=setTimeout(function(){ if(dbReady){ if(S.qid) saveQuote(true); else if(String(S.client.name||'').trim()&&S.client.name!=='Mario Rossi'&&S.lines.length) saveQuote(true); settingsStamp(); } },1500); }
function openQuote(id,asCopy){
  var e=DB.quotes.filter(function(q){ return q.id===id; })[0]; if(!e) return;
  if(S.qid&&S.qid!==id&&dbReady) saveQuote(true);
  var d=JSON.parse(JSON.stringify(e.data)); d.cat=S.cat; d.cgroups=S.cgroups; d.qid=asCopy?'':id;
  /* ditta, profilo, loghi dei marchi e messaggi sono dell'app, non del singolo preventivo: restano quelli attuali (un preventivo vecchio non li riporta indietro) */
  d.trust=JSON.parse(JSON.stringify((trustLogos(S.trust)===0&&trustLogos(e.data.trust)>0)?e.data.trust:S.trust)); d.profile=JSON.parse(JSON.stringify(S.profile)); d.company=JSON.parse(JSON.stringify(S.company)); d.msgs=JSON.parse(JSON.stringify(S.msgs)); d.ccond=JSON.parse(JSON.stringify(S.ccond||{})); d.mtpl=JSON.parse(JSON.stringify(S.mtpl||[])); d.mdef=S.mdef;
  if(asCopy){ d.meta.num=nextNum(); d.meta.title=(d.meta.title||'')+' (copia)'; d.meta.date=today(); d.sign={cli:{img:'',name:'',place:'',date:''},dit:{img:'',name:''}}; d.tiers.sel=-1; }
  S=normalize(d); doSave(); renderAll();
  if(asCopy){ saveQuote(true); toast('Copia creata: n. '+S.meta.num); } else toast('Aperto: n. '+S.meta.num);
  showPanel('dati');
}
function newQuote(){
  if(dbReady&&(S.qid||S.lines.length||String(S.client.name||'').trim())) saveQuote(true);
  var keep={cat:S.cat,cgroups:S.cgroups,company:S.company,style:S.style,profile:S.profile,custom:S.custom,layout:S.layout,show:S.show,trust:S.trust,msgs:S.msgs,ccond:S.ccond,mtpl:S.mtpl,mdef:S.mdef};
  var base=fresh();
  S=base; Object.keys(keep).forEach(function(k){ S[k]=keep[k]; });
  ['planimetria','fv','crono','conferma','lavoro','collaudo'].forEach(function(k){ S.show[k]=false; });
  condApplyNew(); (function(){ var t=mtDef(); if(t) S.msgs={tpl:t.id,wa:t.wa,subj:t.subj,body:t.body}; })(); S.products=[]; S.lines=[]; S.client={name:'',addr:'',tel:'',email:''}; S.meta.title=''; S.meta.num=nextNum(); S.meta.date=today(); S.meta.slogan=''; S.qid='';
  doSave(); renderAll(); showPanel('dati'); try{ window.scrollTo(0,0); }catch(e){}
  toast('Nuovo preventivo vuoto n. '+S.meta.num+': ditta, stile e listino mantenuti');
}
function delTwice(key,fn,btn){
  if(pendDel===key){ pendDel=null; fn(); return; }
  pendDel=key; clearTimeout(pendT); pendT=setTimeout(function(){ pendDel=null; renderArchivio(); },3000);
  btn.textContent='Conferma?'; btn.style.fontWeight='700';
}
function eurS(x){ return eur(x); }
var qAll=false, qFilt='';
var STL={bozza:'Bozza',inviato:'Inviato',accettato:'Accettato',rifiutato:'Rifiutato'}, STN=['bozza','inviato','accettato','rifiutato'];
function qSt(q){ return q.st||(q.data&&q.data.meta&&q.data.meta.status)||'bozza'; }
function renderArchivio(){
  if(typeof renderQbar==='function') renderQbar();
  try{ renderRecover(); }catch(e){}
  if(!$('q-list')) return;
  $('q-state').textContent=S.qid?'Preventivo in archivio: si aggiorna da solo a ogni modifica.':'Non ancora salvato in archivio.';
  var fq=lc($('q-search').value), fc=lc($('c-search').value), fl=lc($('l-search').value);
  var Q=DB.quotes.slice().sort(function(a,b){ return b.upd-a.upd; }).filter(function(q){ return !fq||lc(q.num+' '+q.title+' '+q.client+' '+qName(q)).indexOf(fq)>-1; });
  var cnt={bozza:0,inviato:0,accettato:0,rifiutato:0}, sum={inviato:0,accettato:0};
  DB.quotes.forEach(function(q){ var st=qSt(q); cnt[st]=(cnt[st]||0)+1; if(sum[st]!==undefined) sum[st]+=num(q.tot); });
  var fb=$('q-filt'); if(fb){ fb.innerHTML='<button type="button" class="chip'+(qFilt?'':' on')+'" data-qf="">Tutti '+DB.quotes.length+'</button>'+STN.map(function(k){ return '<button type="button" class="chip st-'+k+(qFilt===k?' on':'')+'" data-qf="'+k+'">'+STL[k]+' '+cnt[k]+'</button>'; }).join('');
    var sm=$('q-sum'); if(sm) sm.textContent=(cnt.inviato||cnt.accettato)?('In attesa di risposta: '+eur(sum.inviato)+' · Accettati: '+eur(sum.accettato)):''; }
  if(qFilt) Q=Q.filter(function(q){ return qSt(q)===qFilt; });
  var qTot=Q.length; if(!fq&&!qAll&&!qFilt) Q=Q.slice(0,5);
  var mb=$('q-more'); if(mb){ mb.hidden=!!fq||!!qFilt||qTot<=5; mb.textContent=qAll?'Mostra solo gli ultimi 5':'Mostra tutti ('+qTot+')'; }
  var an=$('acc-save-n'); if(an) an.textContent=DB.quotes.length?String(DB.quotes.length):'';
  $('q-list').innerHTML=Q.map(function(q){
    var cur=q.id===S.qid;
    return '<div class="rowc"><div style="flex:1 1 200px;min-width:0"><b>'+esc(qName(q))+(cur?' <span class="hint">(aperto)</span>':'')+'</b> <button type="button" class="chip st-'+qSt(q)+'" data-qst="'+q.id+'" title="Tocca per cambiare stato">'+STL[qSt(q)]+'</button><div class="hint">n. '+esc(q.num)+' · '+esc(q.title)+' · '+esc(MODELS[q.model]?MODELS[q.model].short:'')+' · '+esc(dateIt(new Date(q.upd).toISOString().slice(0,10)))+' · '+eur(q.tot)+'</div></div>'+
      '<button type="button" class="btn sm" data-qo="'+q.id+'">Apri</button><button type="button" class="btn ghost sm" data-qc="'+q.id+'">Duplica</button><button type="button" class="btn x" data-qx="'+q.id+'" aria-label="Elimina">×</button></div>';
  }).join('')||'<div class="empty">'+(DB.quotes.length?'Nessun risultato.':'Nessun preventivo salvato. Premi «Salva preventivo».')+'</div>';
  var C=DB.clients.filter(function(c){ return !fc||lc(c.name+' '+c.addr+' '+c.tel).indexOf(fc)>-1; });
  $('c-list').innerHTML=C.map(function(c){
    return '<div class="rowc"><div style="flex:1 1 200px;min-width:0"><b>'+esc(c.name)+'</b><div class="hint">'+esc([c.addr,c.tel,c.email].filter(Boolean).join(' · '))+'</div></div>'+
      '<button type="button" class="btn sm" data-cu="'+c.id+'">Usa</button><button type="button" class="btn x" data-cx="'+c.id+'" aria-label="Elimina">×</button></div>';
  }).join('')||'<div class="empty">'+(DB.clients.length?'Nessun risultato.':'Rubrica vuota. I clienti si salvano con il preventivo o col pulsante qui sopra.')+'</div>';
  var P=DB.prods.filter(function(p){ return !fl||lc(p.name+' '+p.brand+' '+p.code).indexOf(fl)>-1; });
  $('l-list').innerHTML=P.map(function(p){
    return '<div class="rowc"><div style="flex:1 1 200px;min-width:0"><b>'+esc(p.name)+'</b><div class="hint">'+esc([p.brand,p.code].filter(Boolean).join(' · '))+((p.photos||[]).length?' · '+p.photos.length+' foto':'')+(p.pdf?' · PDF':'')+'</div></div>'+
      '<button type="button" class="btn sm" data-lu="'+p.id+'">Aggiungi al preventivo</button><button type="button" class="btn x" data-lx="'+p.id+'" aria-label="Elimina">×</button></div>';
  }).join('')||'<div class="empty">'+(DB.prods.length?'Nessun risultato.':'Libreria vuota. Salva i prodotti dalla scheda Prodotti o salvando il preventivo.')+'</div>';
  renderBackupInfo();
  if(typeof renderArts==='function'&&$('art-list')){ renderArts(); renderAq(); }
  var lp=$('lib-pick'); if(lp) lp.innerHTML='<option value="">+ Aggiungi dalla libreria prodotti…</option>'+DB.prods.map(function(p){ return '<option value="'+p.id+'">'+esc(p.name+(p.brand?' · '+p.brand:''))+'</option>'; }).join('');
}
function archClick(e){
  var t=e.target, b;
  if((b=t.closest('[data-qo]'))) return openQuote(b.getAttribute('data-qo'));
  if((b=t.closest('[data-qc]'))) return openQuote(b.getAttribute('data-qc'),true);
  if((b=t.closest('[data-qx]'))){ var id=b.getAttribute('data-qx'); return delTwice('q'+id,function(){ DB.del[id]=Date.now(); DB.quotes=DB.quotes.filter(function(q){ return q.id!==id; }); if(S.qid===id){ S.qid=''; save(); } dbSave(); renderArchivio(); toast('Preventivo eliminato dall\'archivio'); },b); }
  if((b=t.closest('[data-cu]'))) return useClient(b.getAttribute('data-cu'));
  if((b=t.closest('[data-cx]'))){ var cid=b.getAttribute('data-cx'); return delTwice('c'+cid,function(){ DB.del[cid]=Date.now(); DB.clients=DB.clients.filter(function(c){ return c.id!==cid; }); dbSave(); renderArchivio(); },b); }
  if((b=t.closest('[data-lu]'))) return useProd(b.getAttribute('data-lu'));
  if((b=t.closest('[data-lx]'))){ var lid=b.getAttribute('data-lx'); return delTwice('l'+lid,function(){ DB.del[lid]=Date.now(); DB.prods=DB.prods.filter(function(p){ return p.id!==lid; }); dbSave(); renderArchivio(); },b); }
}
$('arch').addEventListener('click',archClick);
$('acc-save').addEventListener('click',archClick);
['q-search','c-search','l-search'].forEach(function(id){ $(id).addEventListener('input',renderArchivio); });
$('q-save').addEventListener('click',function(){ saveQuote(false); });
$('q-new').addEventListener('click',newQuote);
$('c-save').addEventListener('click',function(){ saveClient(false); });
$('l-saveall').addEventListener('click',function(){ var n=0; S.products.forEach(function(p,i){ if(saveProd(i,true)) n++; }); toast(n?('Salvati '+n+' prodotti nuovi in libreria'):'Nessun prodotto nuovo da salvare'); });
$('lib-pick').addEventListener('change',function(e){ if(e.target.value) useProd(e.target.value); e.target.value=''; });
$('k-name').addEventListener('change',function(e){
  var c=DB.clients.filter(function(x){ return lc(x.name)===lc(e.target.value); })[0];
  if(c&&(!S.client.addr||confirm_fill())){ S.client={name:c.name,addr:c.addr,tel:c.tel,email:c.email}; syncFields(); renderInvio(); touch(); toast('Dati cliente inseriti dalla rubrica'); }
});
function confirm_fill(){ return true; }
function kList(all){
  var el=$('k-list'), q=all?'':lc($('k-name').value.trim());
  var list=DB.clients.filter(function(c){ return !q||lc(c.name+' '+(c.addr||'')+' '+(c.tel||'')).indexOf(q)>-1; });
  el.innerHTML=list.length?list.map(function(c){ return '<button type="button" class="clit" role="option" data-cid="'+esc(c.id)+'"><b>'+esc(c.name)+'</b><small>'+esc([c.addr,c.tel].filter(Boolean).join(' · '))+'</small></button>'; }).join(''):
    '<div class="clempty">'+(DB.clients.length?'Nessun cliente corrisponde. Continua a scrivere per creare un cliente nuovo.':'La rubrica è vuota. Compila i dati del cliente e premi «Salva in rubrica».')+'</div>';
  el.hidden=false; $('k-open').setAttribute('aria-expanded','true');
}
function kClose(){ $('k-list').hidden=true; $('k-open').setAttribute('aria-expanded','false'); }
$('k-open').addEventListener('click',function(e){ e.stopPropagation(); if($('k-list').hidden) kList(true); else kClose(); });
$('k-name').addEventListener('focus',function(){ kList(true); });
$('k-name').addEventListener('input',function(){ kList(false); });
$('k-name').addEventListener('keydown',function(e){ if(e.key==='Escape') kClose(); });
$('k-list').addEventListener('click',function(e){ var b=e.target.closest('[data-cid]'); if(!b) return; useClient(b.getAttribute('data-cid')); kClose(); });
$('k-save').addEventListener('click',function(){ saveClient(false); });
document.addEventListener('click',function(e){ if(!$('k-list').hidden&&!e.target.closest('.cpk')) kClose(); });
$('lines-to-cat').addEventListener('click',function(){
  var cat=S.cat[S.model], n=0;
  S.lines.forEach(function(l){ var d=String(l.d||'').trim(); if(d&&!cat.some(function(it){ return lc(it[0])===lc(d); })){ cat.push([d,l.u||'cad',num(l.p)]); n++; } });
  renderCat(); save(); toast(n?('Aggiunte '+n+' voci al listino'):'Tutte le righe sono già nel listino');
});
