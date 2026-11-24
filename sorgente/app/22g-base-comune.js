/* ===== Il preventivo giusto, sempre: base comune ed editor protetto =====
   Prima, quando lo stesso preventivo era diverso tra un dispositivo e GitHub, vinceva «il più recente» secondo
   l'orologio del dispositivo. Bastava che un dispositivo rimasto indietro lo risalvasse (anche solo riaprendo l'app
   con quel preventivo aperto) per riportare tutti alla versione vecchia: è il caso del preventivo Bruno, tornato a
   2.400 € invece di 3.500 €.

   Adesso non conta l'orologio, conta il CONTENUTO:
   - ogni dispositivo ricorda com'era ogni preventivo l'ultima volta che era uguale a GitHub (la «base comune»);
   - se qui è ancora com'era → arriva quello di GitHub (anche se l'orologio di qui dice altro);
   - se su GitHub è ancora com'era → vale quello di qui;
   - se è cambiato da tutte e due le parti → nessuno sovrascrive nessuno: resta UN preventivo con dentro le due
     versioni, segnato «da scegliere», e scegli tu con un tocco.
   L'editor (il preventivo aperto) ricorda da quale versione è partito: se intanto è arrivata una versione nuova e
   qui non hai toccato niente, prende quella nuova; non risalva mai una versione vecchia sopra una nuova. */

function hTesto(s){ var h=5381, i=s.length; while(i) h=(h*33)^s.charCodeAt(--i); return (h>>>0).toString(36)+'.'+s.length; }
function hSenzaFoto(s){ return String(s).replace(/"(?:data:|ghf:)[^"]*"/g,'"F"'); }   // le foto viaggiano a parte
function qH(q){ if(!q||!q.data) return ''; try{ return hTesto(hSenzaFoto(qNorm(q.data))); }catch(e){ return ''; } }
function edH(){ try{ var d=JSON.parse(JSON.stringify(S)); delete d.cat; return qH({data:d}); }catch(e){ return ''; } } // stesso calcolo dell'archivio: confronti alla pari

/* base comune: com'era ogni preventivo l'ultima volta che questo dispositivo e GitHub erano d'accordo */
function qBaseFissa(o){ if(!o||!o.db) return; var B={}; (o.db.quotes||[]).forEach(function(q){ B[q.id]=qH(q); }); DB.qb=B; }

/* unione di un preventivo: ex = quello di qui, q = quello di GitHub. Torna {prendi, conflitto} */
function qUnione(ex,q,qm){
  var hl=qH(ex), hr=qH(q), hb=(DB.qb||{})[q.id];
  if(hl===hr) return {prendi:(q.upd||0)>(ex.upd||0),conflitto:false};               // uguali: solo dettagli (versioni, foto)
  if(hb){ if(hl===hb) return {prendi:true,conflitto:false};                          // qui non è cambiato: arriva quello di GitHub
          if(hr===hb) return {prendi:false,conflitto:false}; }                       // su GitHub non è cambiato: vale quello di qui
  // prima volta con questa versione (base non ancora nota) e contenuti diversi: non decido io, li tengo tutti e due
  return {prendi:(q.upd||0)>(ex.upd||0),conflitto:true};                             // cambiato da tutte e due le parti
}
function daScegliere(q){ if(q){ q.dsc=Date.now(); } }
function qDaScegliere(){ return DB.quotes.filter(function(q){ return q.dsc&&q.alt&&q.alt.length&&!eliminato(q); }); }
function tieniQuesta(qid){
  var q=DB.quotes.filter(function(x){ return x.id===qid; })[0]; if(!q) return;
  delete q.dsc; q.upd=Date.now(); qmodSegna(q.id); dbSave(); renderArchivio(); trRender&&trRender();
  toast('Tenuta questa versione di «'+qName(q)+'». Le altre restano tra le versioni, se ti servono.');
}

/* ---------- editor: da quale versione dell'archivio è partito il preventivo aperto ---------- */
var ED=null; try{ ED=JSON.parse(localStorage.getItem('ieci-ed')||'null'); }catch(e){ ED=null; }
function edFissa(e){ ED=e?{id:e.id,u:e.upd||0,h:qH(e)}:null; /* h = com'era il preventivo nell'archivio quando l'editor l'ha preso */ try{ localStorage.setItem('ieci-ed',JSON.stringify(ED)); }catch(x){} }
/* chiamata da saveQuote prima di scrivere: 'ok' = salva; 'conflitto' = salva tenendo l'altra versione dentro;
   'fatto' = non salvare (l'editor è stato riallineato all'archivio) */
function edControlla(e){
  if(!e||!e.data) return 'ok';
  if(!ED||ED.id!==e.id){
    // editor rimasto da una versione di prima dell'app: non so da dove parte. Se è uguale all'archivio, nulla da fare;
    // se è diverso NON lo salvo sopra: l'archivio resta com'è e quello dell'editor diventa una versione da scegliere
    try{ if(qNorm(e.data)===qContenuto(S)){ edFissa(e); return 'ok'; } }catch(x){}
    edMettiVersione(e,' (era aperto qui)'); return 'fatto';
  }
  if((e.upd||0)===ED.u) return 'ok';                       // nessuno l'ha cambiato da quando è aperto
  if(edH()===ED.h){ qRicarica(e.id); return 'fatto'; }      // qui non hai toccato niente: prende quello arrivato
  return 'conflitto';                                       // hai cambiato qui e intanto è arrivata un'altra versione
}
function edMettiVersione(e,nota){
  var d=JSON.parse(JSON.stringify(S)); delete d.cat;
  var v={upd:Date.now(),dvn:devNome()+(nota||''),st:S.meta.status||'bozza',tot:acceptedCalc().tot,title:docTitle(),client:S.client.name,name:quoteName(),data:d};
  if(versioneMetti(e,v,v.dvn)){ daScegliere(e); e.upd=Date.now(); qmodSegna(e.id); dbSave(); autoLog('conf',{nome:qName(e)}); }
  qRicarica(e.id); renderArchivio();
}
/* sta arrivando una versione nuova del preventivo aperto mentre qui ci sono modifiche non ancora salvate:
   non le butto, diventano una versione dentro il preventivo, da scegliere */
function edModificheDentro(e){
  if(!ED||ED.id!==e.id||!S||S.qid!==e.id||edH()===ED.h) return;
  var d=JSON.parse(JSON.stringify(S)); delete d.cat;
  var v={upd:Date.now(),dvn:devNome(),st:S.meta.status||'bozza',tot:acceptedCalc().tot,title:docTitle(),client:S.client.name,name:quoteName(),data:d};
  if(versioneMetti(e,v,v.dvn)){ daScegliere(e); e.upd=Math.max(Date.now(),(e.upd||0)+1); qmodSegna(e.id); autoLog('conf',{nome:qName(e)}); }
}
(function(T){ if(!T) return; T.base={norm:function(qid){ var q=DB.quotes.filter(function(x){ return x.id===qid; })[0]; return [qNorm(q.data)].concat((q.alt||[]).map(function(a){ return qNorm(a.data); })); },edVia:function(){ ED=null; try{ localStorage.removeItem('ieci-ed'); }catch(e){} },qH:qH,ed:function(){ return ED; },edH:edH,qb:function(){ return DB.qb||{}; },scegliere:function(){ return qDaScegliere().map(function(q){ return q.id; }); },tieni:tieniQuesta}; })(window.IECI_T);
