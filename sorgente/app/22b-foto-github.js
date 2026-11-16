/* ===== Foto su GitHub come file separati =====
   Prima tutte le foto viaggiavano dentro l'unico file dell'archivio, ripetute in ogni preventivo e nella libreria
   (con l'originale accanto alla versione ritagliata): con tanti prodotti il file arrivava a decine di MB, il telefono
   faticava a scaricarlo e GitHub oltre i 100 MB lo rifiuta. Ora ogni foto è un file a sé nella cartella «foto/»
   dell'archivio privato, caricato una volta sola; nel file dell'archivio resta solo il riferimento «ghf:codice».
   Ogni dispositivo scarica soltanto le foto che non ha. Le foto restano nell'archivio privato del titolare. */
var GHFOTO={mappa:new Map(),mime:{},soglia:1500};
function ghfCodice(u){
  var c=GHFOTO.mappa.get(u); if(c) return c;
  var i=u.indexOf(','), s=u.slice(i+1), h1=0x811c9dc5|0, h2=0x01000193|0, n=s.length;
  for(var k=0;k<n;k++){ var x=s.charCodeAt(k); h1=Math.imul(h1^x,16777619); h2=Math.imul(h2^x,2246822519)^(h2>>>13); }
  c=(h1>>>0).toString(16).padStart(8,'0')+(h2>>>0).toString(16).padStart(8,'0')+n.toString(36);
  GHFOTO.mappa.set(u,c); return c;
}
function ghfMime(u){ var m=/^data:(image\/[\w.+-]+);base64,/.exec(u); return m?m[1]:''; }
function ghfEst(m){ return m==='image/png'?'png':m==='image/webp'?'webp':m==='image/gif'?'gif':m==='image/svg+xml'?'svg':'jpg'; }
// sostituisce nell'oggetto ogni foto grande con «ghf:codice»; restituisce {codice:dataURL}
function ghfEstrai(o){
  var trovate={};
  (function giro(x){
    if(Array.isArray(x)){ for(var i=0;i<x.length;i++){ var v=x[i]; if(typeof v==='string'){ if(v.length>GHFOTO.soglia&&v.indexOf('data:image/')===0&&ghfMime(v)){ var c=ghfCodice(v); trovate[c]=v; x[i]='ghf:'+c; } } else if(v&&typeof v==='object') giro(v); } return; }
    for(var k in x){ if(!Object.prototype.hasOwnProperty.call(x,k)) continue; var w=x[k]; if(typeof w==='string'){ if(w.length>GHFOTO.soglia&&w.indexOf('data:image/')===0&&ghfMime(w)){ var cc=ghfCodice(w); trovate[cc]=w; x[k]='ghf:'+cc; } } else if(w&&typeof w==='object') giro(w); }
  })(o);
  return trovate;
}
// elenco dei riferimenti «ghf:» presenti
function ghfRif(o){ var r={}; (function giro(x){ if(Array.isArray(x)){ x.forEach(function(v){ if(typeof v==='string'){ if(v.indexOf('ghf:')===0) r[v.slice(4)]=1; } else if(v&&typeof v==='object') giro(v); }); return; } for(var k in x){ var w=x[k]; if(typeof w==='string'){ if(w.indexOf('ghf:')===0) r[w.slice(4)]=1; } else if(w&&typeof w==='object') giro(w); } })(o); return Object.keys(r); }
function ghfMetti(o,dati){ (function giro(x){ if(Array.isArray(x)){ for(var i=0;i<x.length;i++){ var v=x[i]; if(typeof v==='string'){ if(v.indexOf('ghf:')===0&&dati[v.slice(4)]) x[i]=dati[v.slice(4)]; } else if(v&&typeof v==='object') giro(v); } return; } for(var k in x){ var w=x[k]; if(typeof w==='string'){ if(w.indexOf('ghf:')===0&&dati[w.slice(4)]) x[k]=dati[w.slice(4)]; } else if(w&&typeof w==='object') giro(w); } })(o); }
// le foto che questo dispositivo ha già (per non riscaricarle)
function ghfLocali(){ var m={}; try{ var o={db:{quotes:DB.quotes,prods:DB.prods,arts:DB.arts,logos:DB.logos},s:S}; (function giro(x,d){ if(d>14) return; if(Array.isArray(x)){ x.forEach(function(v){ if(typeof v==='string'){ if(v.length>GHFOTO.soglia&&v.indexOf('data:image/')===0) m[ghfCodice(v)]=v; } else if(v&&typeof v==='object') giro(v,d+1); }); return; } for(var k in x){ var w=x[k]; if(typeof w==='string'){ if(w.length>GHFOTO.soglia&&w.indexOf('data:image/')===0) m[ghfCodice(w)]=w; } else if(w&&typeof w==='object') giro(w,d+1); } })(o,0); }catch(e){} return m; }
function ghfB64(buf){ var u=new Uint8Array(buf), s='', i, n=0x8000; for(i=0;i<u.length;i+=n) s+=String.fromCharCode.apply(null,u.subarray(i,i+n)); return btoa(s); }
// scarica le foto mancanti (4 alla volta) e le rimette nell'archivio arrivato da GitHub
function ghfScarica(o){
  var cod=ghfRif(o); if(!cod.length) return Promise.resolve();
  var loc=ghfLocali(), dati={}, manca=[], mi=o.foto||{};
  cod.forEach(function(c){ if(loc[c]) dati[c]=loc[c]; else manca.push(c); });
  var fatte=0, errori=0;
  function una(c){
    // il tipo della foto è nell'elenco; se manca (archivio scritto da una versione vecchia) provo i formati più comuni
    var tipi=mi[c]?[mi[c]]:['image/jpeg','image/png','image/webp'];
    function prova(k){ var m=tipi[k]; if(!m){ errori++; return Promise.resolve(); }
      return ghApi('/contents/foto/'+c+'.'+ghfEst(m),{},true).then(function(r){ return r.arrayBuffer(); }).then(function(b){ dati[c]='data:'+m+';base64,'+ghfB64(b); fatte++; if(manca.length>3) ghStatus('Scarico le foto da GitHub: '+fatte+' di '+manca.length+'…'); },function(){ return prova(k+1); }); }
    return prova(0); }
  var coda=manca.slice(); function lavora(){ var c=coda.shift(); return c?una(c).then(lavora):Promise.resolve(); }
  return Promise.all([lavora(),lavora(),lavora(),lavora()]).then(function(){
    GHFOTO.errScarico=errori;
    // se anche una sola foto non arriva non unisco: i dati di qui restano intatti e riprovo alla prossima sincronizzazione
    if(errori){ var e=new Error('foto'); e.foto=errori; throw e; }
    ghfMetti(o,dati);
  });
}
// carica su GitHub le foto che non ci sono ancora (una alla volta: ogni file è un salvataggio nell'archivio)
function ghfCarica(trovate,giaSu){
  var nuove=Object.keys(trovate).filter(function(c){ return !giaSu[c]; }), fatte=0, ok={};
  Object.keys(trovate).forEach(function(c){ if(giaSu[c]) ok[c]=giaSu[c]; });
  function una(c){ var u=trovate[c], m=ghfMime(u);
    return ghApi('/contents/foto/'+c+'.'+ghfEst(m),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Foto '+c,content:u.slice(u.indexOf(',')+1)})})
      .then(function(){ ok[c]=m; },function(e){ if(e.status===422){ ok[c]=m; return; } throw e; }) // 422: c'era già
      .then(function(){ fatte++; if(nuove.length>2) ghStatus('Carico le foto su GitHub: '+fatte+' di '+nuove.length+'…'); }); }
  var p=Promise.resolve(); nuove.forEach(function(c){ p=p.then(function(){ return una(c); }); });
  return p.then(function(){ return ok; });
}
// il file dell'archivio da mettere su GitHub: leggero, con le foto come riferimenti
function ghfPayload(remoto){
  var o=JSON.parse(JSON.stringify(buildPayload())), tr=ghfEstrai(o);
  var giaSu=(remoto&&remoto.foto)||{};
  return ghfCarica(tr,giaSu).then(function(ok){ o.foto=ok; o.v=3; return o; });
}
(function(T){ if(!T) return; T.ghfCodice=ghfCodice; T.ghfEstrai=ghfEstrai; T.GHFOTO=GHFOTO; })(window.IECI_T);
