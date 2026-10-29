/* ---------- fornitori, articoli e analisi con Claude ---------- */
var AI={key:'',model:'claude-sonnet-5-5',markup:30,use:false}, IMP={rows:[],files:[],busy:false,stop:false};
function aiLoad(){ try{ var o=JSON.parse(localStorage.getItem('ieci-ai')||'{}'); if(o.key) AI.key=o.key; if(o.model) AI.model=o.model; if(o.markup!=null) AI.markup=num(o.markup); AI.use=!!o.use; }catch(e){} }
function aiStore(){ try{ localStorage.setItem('ieci-ai',JSON.stringify(AI)); }catch(e){} }
function aiPost(body,cb){
  if(!AI.key){ cb(new Error('Inserisci prima la chiave API nelle impostazioni.')); return; }
  fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':AI.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify(body)})
    .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){
      if(!r.ok){ var e=new Error(r.status===401?'Chiave API non valida.':(r.status===429?'Troppe richieste: riprova tra un minuto.':((j.error&&j.error.message)||('Errore '+r.status)))); e.status=r.status; throw e; }
      return j; }); })
    .then(function(j){ cb(null,j); })
    .catch(function(e){ cb(e.status?e:new Error('Connessione non riuscita o bloccata dal browser.')); });
}
function aiRun(body,cb,n){
  n=n||0;
  aiPost(body,function(e,j){
    if(e) return cb(e);
    if(j.stop_reason==='pause_turn'&&n<3){ var b2={}; Object.keys(body).forEach(function(k){ b2[k]=body[k]; }); b2.messages=body.messages.concat([{role:'assistant',content:j.content}]); return aiRun(b2,cb,n+1); }
    cb(null,j);
  });
}
function aiText(j){ return (j.content||[]).filter(function(b){ return b.type==='text'; }).map(function(b){ return b.text; }).join('\n'); }
function aiJson(t){ var a=t.indexOf('{'), b=t.lastIndexOf('}'); if(a<0||b<a) throw new Error('Risposta non leggibile'); return JSON.parse(t.slice(a,b+1)); }
function parseDisc(s){
  if(s==null||s==='') return 1; if(typeof s==='number') return 1-s/100;
  var f=1; String(s).replace(',','.').split(/[+\/\s]+/).forEach(function(p){ var v=parseFloat(p); if(isFinite(v)&&v>0&&v<100) f*=(1-v/100); }); return f;
}
var EXTRACT_PROMPT='Questo è un preventivo o listino di un fornitore italiano di materiale elettrico. Estrai TUTTE le righe articolo. Rispondi SOLO con un oggetto JSON, senza altro testo, con questa forma: {"fornitore":"","data":"AAAA-MM-GG oppure vuoto","righe":[{"codice":"","descrizione":"","marca":"","um":"","qta":1,"prezzo_listino":null,"sconto":"","prezzo_netto":null,"note":""}]}. Regole: numeri con il punto decimale; prezzo_netto è il prezzo UNITARIO netto IVA esclusa che il fornitore applica (se manca ma ci sono listino e sconti, calcolalo); se non leggi un valore metti null o stringa vuota, non inventare; ignora totali, IVA, trasporto e note legali; scrivi la marca solo se compare nel documento o se è inequivocabile dal codice; mantieni i codici esattamente come scritti.';
function fileBlock(f,cb){
  if(/pdf/i.test(f.type)||/\.pdf$/i.test(f.name)){
    if(f.size>24*1048576){ cb(null,'PDF troppo grande (massimo 24 MB)'); return; }
    var fr=new FileReader(); fr.onload=function(){ cb({type:'document',source:{type:'base64',media_type:'application/pdf',data:String(fr.result).split(',')[1]}}); }; fr.onerror=function(){ cb(null,'File non leggibile'); }; fr.readAsDataURL(f);
  } else readImage(f,2200,false,function(u){ if(!u) return cb(null,'Immagine non valida'); cb({type:'image',source:{type:'base64',media_type:u.slice(5,u.indexOf(';')),data:u.split(',')[1]}}); });
}
function normRow(r,sup){
  var disc=r.sconto==null?'':String(r.sconto), list=num(r.prezzo_listino), cost=(r.prezzo_netto==null||r.prezzo_netto==='')?null:num(r.prezzo_netto);
  if(cost==null&&list>0) cost=r2(list*parseDisc(r.sconto));
  var enr=null; if(r.descrizione_web||(r.foto&&r.foto.length)||(r.caratteristiche&&r.caratteristiche.length)){ enr={status:'ok',conf:'controllata da Claude',brand:'',name:'',desc:String(r.descrizione_web||''),specs:(r.caratteristiche||[]).map(String).slice(0,8),images:(r.foto||[]).filter(function(u){ return /^https?:\/\//i.test(u); }).slice(0,5).map(function(u,i){ return {url:u,sel:i===0}; }),src:/^https?:/i.test(r.fonte||'')?r.fonte:'',pdf:/^https?:/i.test(r.scheda_pdf||'')?r.scheda_pdf:''}; }
  return {inc:true,dubt:!!r.dubbio,code:String(r.codice||'').trim(),name:String(r.descrizione||'').trim(),brand:String(r.marca||'').trim(),um:String(r.um||'').trim()||'cad',qty:num(r.qta)||1,list:list,disc:disc,cost:cost==null?0:cost,note:String(r.note||''),enr:enr,miss:cost==null};
}
function impState(t,warn){ var el=$('im-state'); el.hidden=!t; el.textContent=t||''; el.style.borderLeftColor=warn?'var(--danger)':''; }
/* ===== lettura gratuita dei preventivi: testo del PDF, OCR per le foto, testo incollato ===== */
var BRANDS=['Bticino','BTicino','Vimar','Gewiss','Schneider','ABB','Legrand','Siemens','Hager','Ave','Beghelli','Philips','Osram','Ledvance','Fibaro','Huawei','SolarEdge','Fronius','SMA','Victron','Eaton','Finder','Lovato','Prysmian','Nexans','General Cavi','Fratelli Beneduce','Cemb','Elettrocanali','Palazzoli','Thorn','Disano','Fael','Ekoenergy','Sonoff','Shelly','Ring','Comelit','Urmet','Hikvision','Dahua','Ajax','Bpt','Came','Nice','Faac','Zucchetti','Enphase','Jinko','Trina','Longi','Canadian Solar','Daikin','Mitsubishi','Samsung','Pce','Wallbox','Easee','Ecoflow'];
function inferBrand(t){ var s=' '+t.toLowerCase()+' '; for(var i=0;i<BRANDS.length;i++){ if(s.indexOf(' '+BRANDS[i].toLowerCase()+' ')>=0||s.indexOf(' '+BRANDS[i].toLowerCase()+'-')>=0) return BRANDS[i]; } return ''; }
var LH={pos:/^(pos\.?|n\.|nr\.?|n°|#|rig[ah]?|rif\.?)$/i,code:/^(cod\.?|codice|cod\.?\s*art\.?|art\.?|cod\.?\s*prod\.?)/i,um:/^(u\.?\s?m\.?|um|unit[aà]\s*(di\s*)?(misura)?)$/i,qta:/^(q\.?t[aà]\.?|quant|n\.?\s?pz|pezzi|pz\.?)/i,listino:/listino|lordo/i,sconto:/^sc|sconto|^%/i,importo:/import|^totale|valore|^tot\.?$/i,netto:/netto|prezzo|unitario|p\.?\s?u\.?$|^€/i,descr:/descr|denominaz|articolo|prodotto|oggetto|materiale/i,marca:/^(marca|produttore|costruttore|brand|marchio)$/i};
var LHO=['marca','listino','sconto','importo','qta','um','pos','code','netto','descr'];
function hdrKind(s){ s=s.trim(); for(var i=0;i<LHO.length;i++){ if(LH[LHO[i]].test(s)) return LHO[i]; } return ''; }
var NUMRE=/^[-+]?(?:€\s*)?\d{1,3}(?:\.\d{3})*(?:,\d+)?\s*(?:€|%)?$|^[-+]?(?:€\s*)?\d+(?:[.,]\d+)?\s*(?:€|%)?$/;
var DISCRE=/^\d{1,2}(?:[.,]\d+)?\s*(?:[+\/]\s*\d{1,2}(?:[.,]\d+)?\s*)+%?$/;
var UMRE=/^(n|nr|n\.|pz|pz\.|pezzi|cad|cd|mt|m|ml|mq|kg|conf|cf|set|kit|rt|rotolo|bobina|coll|collo|cp|crt|ct|ora|h|lt|l)\.?$/i;
var STOPRE=/(^|\s)(totale|tot\.|imponibile|i\.?v\.?a\.?|trasporto|spese|netto a pagare|pagina|pag\.|banca|iban|pagamento|condizioni|riporto|a riportare|segue|validit|consegna|resa|vettore|scadenza|p\.?\s?iva|c\.?f\.?|tel\.?|fax|e-?mail|www\.|pec)(\s|:|$)/i;
function pnum(s){
  var t=String(s).replace(/[€\s]/g,''), pct=/%$/.test(t); t=t.replace('%','');
  var th=/^\d{1,3}(\.\d{3})+$/.test(t), dec=!th&&/[.,]\d+$/.test(t);
  if(/,\d+$/.test(t)) t=t.replace(/\./g,'').replace(',','.'); else if(th) t=t.replace(/\./g,'');
  var v=parseFloat(t); return isFinite(v)?{v:v,pct:pct,dec:dec}:null;
}
function close(a,b){ return Math.abs(a-b)<=Math.max(0.02,Math.abs(b)*0.012); }
/* elementi {x,w,h,y,s} -> righe di celle [{x,x2,s}] */
function itemsToLines(items,gapK){
  gapK=gapK||0.6;
  var its=items.filter(function(i){ return String(i.s).trim(); }).sort(function(a,b){ return b.y-a.y||a.x-b.x; });
  var rows=[];
  its.forEach(function(it){
    var r=rows[rows.length-1], tol=Math.max(2,(it.h||8)*0.55);
    if(r&&Math.abs(r.y-it.y)<=tol){ r.its.push(it); r.y=(r.y*(r.its.length-1)+it.y)/r.its.length; } else rows.push({y:it.y,its:[it]});
  });
  return rows.map(function(r){
    r.its.sort(function(a,b){ return a.x-b.x; });
    var cells=[];
    r.its.forEach(function(it){
      var c=cells[cells.length-1], h=it.h||8, s=String(it.s).replace(/\s+/g,' ');
      if(c&&it.x-c.x2<h*((NUMRE.test(s)||NUMRE.test(c.s)||UMRE.test(s))?0.12:gapK)){ c.s=(c.s+(it.x-c.x2>h*0.12?' ':'')+s).replace(/\s+/g,' '); c.x2=Math.max(c.x2,it.x+(it.w||s.length*h*0.5)); }
      else cells.push({x:it.x,x2:it.x+(it.w||s.length*h*0.5),s:s.trim()});
    });
    cells.forEach(function(c){ c.s=c.s.trim(); });
    var out=cells.filter(function(c){ return c.s; }); out.y=r.y; out.h=r.its.reduce(function(m,i){ return Math.max(m,i.h||8); },0); return out;
  }).filter(function(c){ return c.length; });
}
function textToLines(txt){
  return String(txt).split(/\r?\n/).map(function(l){ return l.replace(/\s+$/,''); }).filter(function(l){ return l.trim(); }).map(function(l){
    var parts=l.indexOf('\t')>=0?l.split('\t'):(l.indexOf(';')>=0?l.split(';'):l.split(/\s{2,}/));
    return parts.map(function(p,i){ return {x:i*100,x2:i*100+90,s:p.trim()}; }).filter(function(c){ return c.s; });
  }).filter(function(c){ return c.length; });
}
function detectHeader(cells){
  var kinds=cells.map(function(c){ return {k:hdrKind(c.s),x:c.x,x2:c.x2}; });
  var distinct={}; kinds.forEach(function(k){ if(k.k) distinct[k.k]=1; });
  var n=Object.keys(distinct).length;
  if(n<3||(!distinct.descr&&!distinct.code)||!(distinct.netto||distinct.importo||distinct.listino)) return null;
  if(cells.some(function(c){ return NUMRE.test(c.s); })) return null;
  return kinds.filter(function(k){ return k.k; });
}
function isCodeTok(t){ return /^[A-Za-z0-9][A-Za-z0-9\-_.\/+]{2,24}$/.test(t)&&/\d/.test(t)&&!/^\d{1,2}$/.test(t)&&!/^\d+[.,]\d+$/.test(t); }
function parseLines(lines){
  var rows=[], hdr=null, lastPos=0, supplier='', date='', cont=0;
  lines.slice(0,25).forEach(function(cells){
    var t=cells.map(function(c){ return c.s; }).join(' ');
    if(!date){ var m=t.match(/(?:data|del|preventivo|offerta|ordine)[^\d]{0,25}(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/i); if(m){ var y=m[3].length===2?'20'+m[3]:m[3]; date=y+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2); } }
    if(!supplier&&!/ieci|matera/i.test(t)){ var s=t.match(/^([A-Z0-9][\w&.'\- ]{2,45}?\s(?:S\.?\s?r\.?\s?l\.?s?|S\.?\s?p\.?\s?A\.?|S\.?\s?n\.?\s?c\.?|S\.?\s?a\.?\s?s\.?))\b/i); if(s) supplier=s[1].trim(); }
  });
  lines.forEach(function(cells){
    var pos={pg:cells.pg||1,y:cells.yTop!=null?cells.yTop:cells.y,yb:cells.yBot!=null?cells.yBot:cells.y,h:cells.h||9};
    var h=detectHeader(cells); if(h){ hdr=h; cont=0; return; }
    var splitDone=false; cells=cells.reduce(function(acc,c){
      var s0=c.s.replace(/([a-zà-ù\)\]])(NR|PZ|MT|ML|CF)(?=\s\d)/,'$1 $2'), tk=s0.split(' '), i=tk.length, isN=function(t){ return NUMRE.test(t)||DISCRE.test(t)||/^(NR|PZ|MT|ML|CF|KG|CAD)\.?$/.test(t); };
      while(i>0&&isN(tk[i-1])) i--;
      var tail=tk.slice(i);
      if(tail.length>=2&&(i===0||tail.some(function(t){ return /,\d{2}$/.test(t); }))){
        var w=c.x2-c.x, tot=s0.length||1, off=0;
        if(i>0){ var head=tk.slice(0,i).join(' '); acc.push({x:c.x,x2:c.x+w*head.length/tot,s:head}); off=head.length+1; }
        tail.forEach(function(t){ var xa=c.x+w*off/tot, xb=c.x+w*(off+t.length)/tot; acc.push({x:xa,x2:xb,s:t}); off+=t.length+1; });
        splitDone=true;
      } else acc.push(c);
      return acc;
    },[]);
    var txt=cells.map(function(c){ return c.s; }).join(' ');
    if(STOPRE.test(cells[0].s)||(cells.length<=3&&STOPRE.test(txt)&&!cells.some(function(c){ return /\d+,\d{2}/.test(c.s); }))){ cont=99; return; }
    var cs=cells.slice();
    /* numero di riga */
    var p0=pnum(cs[0].s);
    if(cs.length>2&&p0&&!p0.dec&&!p0.pct&&/^\d{1,3}$/.test(cs[0].s)&&(p0.v===lastPos+1||(hdr&&hdr.some(function(k){ return k.k==='pos'&&Math.abs(k.x-cs[0].x)<30; })))&&!NUMRE.test(cs[1].s)){ lastPos=p0.v; cs.shift(); }
    var f=-1;
    for(var i=0;i<cs.length;i++){ if(i===0&&NUMRE.test(cs[0].s)&&!/[.,]/.test(cs[0].s)&&cs[0].s.length>=4&&cs.length>2){ continue; } if(NUMRE.test(cs[i].s)||DISCRE.test(cs[i].s)){ f=i; break; } }
    if(f<1){
      /* nessun numero: eventuale continuazione della descrizione */
      var prev=rows[rows.length-1];
      if(prev&&cont<3&&f<0&&txt.length<90&&!/^\W*$/.test(txt)&&(prev._pg||1)===pos.pg&&!/^(via|viale|piazza|p\.zza|corso|c\.so|contrada|c\.da|loc\.|località|largo|vico)\s|\b\d{5}\b|@|www\.|\b(tel|fax|cell|p\.?\s?iva|iban)\b/i.test(txt)){ prev.descrizione=(prev.descrizione+' '+txt).replace(/\s+/g,' ').trim(); if(pos.y!=null) prev._y1=pos.y; prev._cont=(prev._cont||0)+1; cont++; }
      return;
    }
    cont=0;
    var left=cs.slice(0,f), code='', um='', note='';
    var marca='', hm=hdr&&hdr.filter(function(k){ return k.k==='marca'; })[0];
    if(hm&&left.length>1){ for(var li=left.length-1;li>=0;li--){ var lc0=left[li], cx=(lc0.x+lc0.x2)/2; if(cx>=hm.x-25&&cx<=hm.x2+25&&!/\d{3}/.test(lc0.s)&&lc0.s.length<=30){ marca=lc0.s; left.splice(li,1); break; } } }
    var hck=hdr&&hdr.filter(function(k){ return k.k==='code'; })[0], ci=-1;
    if(hck&&left.length>=2){ var bd=1e9; left.forEach(function(c,i){ var d=Math.abs(c.x-hck.x); if(d<40&&d<bd&&!/\s/.test(c.s)&&i<left.length-1){ bd=d; ci=i; } }); }
    if(ci>-1){ code=left[ci].s; left=left.slice(0,ci).filter(function(c){ return /\s/.test(c.s)||c.s.length>8; }).concat(left.slice(ci+1)); }
    else if(left.length>=2&&isCodeTok(left[0].s)){ code=left.shift().s; }
    else if(left.length===1){ var m=left[0].s.match(/^(\S+)\s+(.{8,})$/); if(m&&isCodeTok(m[1])&&/[A-Za-z]{3}/.test(m[2])){ code=m[1]; left[0]={x:left[0].x,x2:left[0].x2,s:m[2]}; } }
    if(left.length>1&&UMRE.test(left[left.length-1].s)){ um=left.pop().s.replace(/\.$/,''); }
    var descr=left.map(function(c){ return c.s; }).join(' ').trim();
    var tu=descr.match(/^(.*?[a-z0-9\)])\s?(NR|PZ|MT|ML|MQ|CF|KG|CAD|CONF)\.?$/);
    if(tu){ descr=tu[1].trim(); um=tu[2]; }
    else if(/\s(NR|PZ|MT|ML|CF|KG|CAD|CONF)\.?\s/.test(descr+' ')&&false){ }
    var nums=[];
    for(var j=f;j<cs.length;j++){
      var c=cs[j];
      if(DISCRE.test(c.s)) nums.push({c:c,disc:c.s.replace(',','.').replace(/%/g,'').replace(/\s/g,'')});
      else if(NUMRE.test(c.s)){ var pv=pnum(c.s); if(pv) nums.push({c:c,p:pv}); }
      else if(UMRE.test(c.s)&&!um) um=c.s.replace(/\.$/,'');
      else if(c.s.length>1) note+=(note?' ':'')+c.s;
    }
    if(!nums.length||!descr&&!code) return;
    var qty=null,list=null,net=null,tot=null,disc='',dubbio=false;
    var discCells=nums.filter(function(n){ return n.disc||(n.p&&n.p.pct); });
    discCells.forEach(function(n){ disc=n.disc||String(n.p.v).replace('.',','); });
    var vals=nums.filter(function(n){ return n.p&&!n.p.pct; }).map(function(n){ return {v:n.p.v,dec:n.p.dec,x:(n.c.x+n.c.x2)/2}; });
    var L=hdr?hdr.filter(function(k){ return k.k==='qta'||k.k==='listino'||k.k==='sconto'||k.k==='netto'||k.k==='importo'; }):[];
    var used=false;
    if(L.length>=2&&vals.length>=1){
      var map={}, ok=true;
      vals.forEach(function(v){ var best=null,bd=1e9; L.forEach(function(k){ var d=Math.abs((k.x+k.x2)/2-v.x); if(d<bd){ bd=d; best=k.k; } }); if(map[best]!=null) ok=false; map[best]=v; });
      if(ok){
        if(map.qta) qty=map.qta.v; if(map.listino) list=map.listino.v; if(map.netto) net=map.netto.v; if(map.importo) tot=map.importo.v; if(map.sconto&&!disc) disc=String(map.sconto.v).replace('.',',');
        used=true;
        if(list!=null&&net!=null&&list<net&&!tot){ tot=net; net=list; list=null; }
      }
    }
    if(!used){
      var rest=vals.map(function(v){ return v.v; });
      if(rest.length>=2&&!vals[0].dec&&rest[0]>0&&rest[0]<100000){ qty=rest.shift(); }
      var q=qty||1, m2=rest.length;
      if(m2===1){ net=rest[0]; }
      else if(m2===2){ if(close(rest[1],q*rest[0])&&q>0){ net=rest[0]; tot=rest[1]; } else if(rest[1]<=rest[0]){ list=rest[0]; net=rest[1]; } else { net=rest[0]; tot=rest[1]; } }
      else if(m2===3){ if(close(rest[2],q*rest[1])){ list=rest[0]; net=rest[1]; tot=rest[2]; } else if(rest[1]<100&&close(rest[0]*(1-rest[1]/100),rest[2])){ list=rest[0]; disc=String(rest[1]).replace('.',','); net=rest[2]; } else { list=rest[0]; net=rest[1]; tot=rest[2]; dubbio=true; } }
      else if(m2>=4){ if(rest[1]<100&&close(rest[0]*(1-rest[1]/100),rest[2])){ list=rest[0]; disc=String(rest[1]).replace('.',','); net=rest[2]; tot=rest[3]; } else { list=rest[0]; net=rest[m2-2]; tot=rest[m2-1]; dubbio=true; } }
    }
    if(net==null&&list!=null){ net=disc?list*parseDisc(disc):list; }
    if(net==null&&tot!=null&&qty){ net=tot/qty; }
    if(qty==null&&tot!=null&&net){ var qq=tot/net; if(qq>=1&&Math.abs(qq-Math.round(qq))<0.02) qty=Math.round(qq); }
    if(net!=null&&qty&&tot!=null&&!close(net*qty,tot)&&!(list!=null&&disc&&close(list*parseDisc(disc)*qty,tot))) dubbio=true;
    if(net==null||!(net>0)) return;
    if(descr.length<3&&!code) return;
    rows.push({codice:code,descrizione:descr,marca:marca||inferBrand(descr+' '+code),um:um||'',qta:qty||1,prezzo_listino:list,sconto:disc,prezzo_netto:Math.round(net*100)/100,note:note,dubbio:dubbio,importo:tot,_pg:pos.pg,_y0:pos.y,_y1:pos.yb,_h:pos.h,_hdr:!!hdr,_marcaCol:!!marca});
  });
  var d=rows.length;
  return {fornitore:supplier,data:date,righe:rows};
}
/* ---- PDF (pdf.js incorporato) ---- */
var PDFJS=null;
function loadPdfjs(cb){
  if(PDFJS){ cb(null,PDFJS); return; }
  Promise.all([libText('pdfjs-lib'),libText('pdfjs-wk')]).then(function(t){
    if(!t[0]||!t[1]){ cb(new Error('Lettore PDF non disponibile: controlla la connessione e riprova.')); return; }
    try{
      var bytes=function(x){ var s=atob(x.replace(/\s+/g,'')), u=new Uint8Array(s.length); for(var i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u; };
      var lib=URL.createObjectURL(new Blob([bytes(t[0])],{type:'text/javascript'})), wk=URL.createObjectURL(new Blob([bytes(t[1])],{type:'text/javascript'}));
      import(lib).then(function(m){ m.GlobalWorkerOptions.workerSrc=wk; PDFJS=m; cb(null,m); }).catch(function(e){ cb(e); });
    }catch(e){ cb(e); }
  });
}
function loadTess(cb){
  if(window.Tesseract){ cb(); return; }
  var s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  s.onload=function(){ cb(); }; s.onerror=function(){ cb(new Error('Per leggere le foto serve internet (scarica il lettore di testo la prima volta).')); }; document.head.appendChild(s);
}
function ocrImage(src,cb,prog){
  loadTess(function(e){
    if(e) return cb(null,e.message);
    window.Tesseract.createWorker('ita',1,{logger:function(m){ if(prog&&m.status==='recognizing text') prog(m.progress); }}).then(function(w){
      return w.recognize(src,{},{blocks:true,text:true}).then(function(r){
        var d=r.data, words=d.words||[];
        if(!words.length&&d.blocks){ d.blocks.forEach(function(b){ (b.paragraphs||[]).forEach(function(p){ (p.lines||[]).forEach(function(l){ (l.words||[]).forEach(function(x){ words.push(x); }); }); }); }); }
        var its=words.filter(function(x){ return x.text&&x.text.trim(); }).map(function(x){ var h=x.bbox.y1-x.bbox.y0; return {x:x.bbox.x0,w:x.bbox.x1-x.bbox.x0,h:h,y:-(x.bbox.y0+x.bbox.y1)/2,s:x.text}; });
        return w.terminate().then(function(){ cb(its); });
      });
    }).catch(function(x){ cb(null,'Lettura della foto non riuscita: '+(x&&x.message||x)); });
  });
}
function localFile(f,cb,msg){
  var name=f.name||'';
  function done(lines){ var r=parseLines(lines); r.nlines=lines.length; cb(r); }
  if(/\.(csv|txt|tsv)$/i.test(name)||/^text\//.test(f.type)){ f.text().then(function(t){ done(textToLines(t)); }); return; }
  if(/pdf/i.test(f.type)||/\.pdf$/i.test(name)){
    loadPdfjs(function(e,P){
      if(e) return cb(null,'Lettore PDF non disponibile ('+(e.message||e)+').');
      f.arrayBuffer().then(function(buf){ return P.getDocument({data:buf}).promise; }).then(function(doc){
        var all=[], k=1, ocr=0;
        (function next(){
          if(k>doc.numPages){ if(!all.length) return cb(null,'Nessun testo leggibile.'); return done(all); }
          var pn=k++; msg('Leggo '+name+' · pagina '+pn+'/'+doc.numPages+'…');
          doc.getPage(pn).then(function(pg){
            return pg.getTextContent().then(function(tc){
              var items=tc.items.filter(function(i){ return i.str&&i.str.trim(); }).map(function(i){ return {x:i.transform[4],y:i.transform[5],w:i.width,h:i.height||Math.abs(i.transform[3]),s:i.str}; });
              if(items.length>=8){ all=all.concat(itemsToLines(items)); return next(); }
              /* pagina scansionata: la trasformo in immagine e uso l'OCR */
              var vp=pg.getViewport({scale:2.2}), cv=document.createElement('canvas'); cv.width=vp.width; cv.height=vp.height;
              return pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise.then(function(){
                ocrImage(cv,function(its,err){ if(its) all=all.concat(itemsToLines(its,0.9)); else if(!ocr++) msg(err); next(); },function(p){ msg('Leggo '+name+' (scansione) pagina '+pn+' '+Math.round(p*100)+'%'); });
              });
            });
          }).catch(function(x){ cb(null,'PDF non leggibile ('+(x&&x.message||x)+').'); });
        })();
      }).catch(function(x){ cb(null,'PDF non leggibile ('+(x&&x.message||x)+').'); });
    });
    return;
  }
  readImage(f,2600,false,function(u){
    if(!u) return cb(null,'Immagine non valida');
    msg('Leggo la foto '+name+'…');
    ocrImage(u,function(its,err){ if(!its) return cb(null,err); done(itemsToLines(its,0.9)); },function(p){ msg('Leggo la foto '+name+' '+Math.round(p*100)+'%'); });
  });
}
function runExtract(){
  if(IMP.busy) return;
  var pt=($('im-paste')&&$('im-paste').value||'').trim();
  if(!IMP.files.length&&!pt){ impState('Scegli un file oppure incolla il testo del preventivo.',true); return; }
  var jsonF=IMP.files.filter(function(f){ return /\.json$/i.test(f.name); });
  var docs=IMP.files.filter(function(f){ return !/\.json$/i.test(f.name); });
  IMP.busy=true; IMP.stop=false; var added=0, errs=[];
  function done(){ IMP.busy=false; renderImp(); var dub=IMP.rows.filter(function(r){ return r.dubt||r.miss; }).length; impState(added?('Trovati '+added+' articoli'+(dub?' ('+dub+' da controllare)':'')+'. Controlla nomi e prezzi, aggiungi se vuoi le foto, poi salva.'):'Nessun articolo trovato.'+(errs.length?' '+errs.join(' '):''),!added); if(errs.length&&added) toast(errs[0]); }
  var sup=$('im-sup').value.trim();
  function addRows(j){
    if(!sup&&j.fornitore){ sup=String(j.fornitore); $('im-sup').value=sup; }
    if(!$('im-date').value&&/^\d{4}-\d{2}-\d{2}$/.test(j.data||'')) $('im-date').value=j.data;
    (j.righe||[]).forEach(function(r){ var row=normRow(r,sup); if(row.name||row.code){ IMP.rows.push(row); added++; } });
  }
  var chain=Promise.resolve();
  if(pt) chain=chain.then(function(){ var r=parseLines(textToLines(pt)); if(!r.righe.length) errs.push('Testo incollato: nessuna riga riconosciuta.'); addRows(r); });
  jsonF.forEach(function(f){ chain=chain.then(function(){ return f.text().then(function(t){ try{ addRows(JSON.parse(t)); }catch(e){ errs.push('File '+f.name+' non valido.'); } }); }); });
  docs.forEach(function(f,k){
    chain=chain.then(function(){ return new Promise(function(res){
      if(IMP.stop){ res(); return; }
      impState('Analizzo '+f.name+' ('+(k+1)+'/'+docs.length+')…');
      if(!(AI.use&&AI.key)){ localFile(f,function(r,err){ if(!r) errs.push(f.name+': '+err); else { if(!r.righe.length) errs.push(f.name+': nessuna riga riconosciuta. Se è una foto o scansione poco nitida, incolla il testo oppure mandami il file in chat.'); addRows(r); } res(); },function(t){ impState(t); }); return; }
      fileBlock(f,function(block,err){
        if(!block){ errs.push(f.name+': '+err); res(); return; }
        aiRun({model:AI.model,max_tokens:12000,messages:[{role:'user',content:[block,{type:'text',text:EXTRACT_PROMPT}]}]},function(e,j){
          if(e){ errs.push(f.name+': '+e.message); res(); return; }
          try{ addRows(aiJson(aiText(j))); }catch(x){ errs.push(f.name+': risposta non leggibile, riprova.'); }
          res();
        });
      });
    }); });
  });
  chain.then(done,done);
}
/* ricerca sul web: descrizione, caratteristiche e foto verificate */
function verifyImg(u,cb){
  if(!/^https?:\/\//i.test(u)){ cb(false); return; }
  var im=new Image(), fin=false, t=setTimeout(function(){ end(false); },9000);
  function end(v){ if(fin) return; fin=true; clearTimeout(t); cb(v); }
  im.referrerPolicy='no-referrer'; im.onload=function(){ end(im.naturalWidth>=200&&im.naturalHeight>=150); }; im.onerror=function(){ end(false); }; im.src=u;
}
function enrichPrompt(a){
  return 'Articolo di un fornitore italiano di materiale elettrico. Marca: '+(a.brand||'(non indicata)')+'. Codice: '+(a.code||'(non indicato)')+'. Descrizione: '+(a.name||'')+'.\\n'+
  'Usa la ricerca web (preferisci il sito del costruttore, poi grandi distributori) per trovare la scheda ESATTA di questo prodotto, cioè con lo stesso codice. Rispondi SOLO con un oggetto JSON: {"trovato":true,"confidenza":"alta|media|bassa","marca":"","nome":"nome commerciale pulito","descrizione":"2 o 3 frasi in italiano per un cliente finale, basate solo su ciò che dice la scheda","caratteristiche":["Voce: valore"],"immagini":["URL diretto di un file immagine jpg/png/webp del prodotto"],"fonte":"URL della pagina","scheda_pdf":"URL del PDF della scheda tecnica se trovato"}. '+
  'Regole: se non sei sicuro che sia lo stesso prodotto o codice, rispondi {"trovato":false}. Massimo 8 caratteristiche, solo dati presenti nella fonte. Inserisci solo URL che hai visto davvero nei risultati o nelle pagine, mai URL inventati o dedotti; se non ne hai, lascia la lista vuota.';
}
function aiEnrich(a,cb){
  aiRun({model:AI.model,max_tokens:2500,tools:[{type:'web_search_20250305',name:'web_search',max_uses:3}],messages:[{role:'user',content:enrichPrompt(a).replace(/\\n/g,'\n')}]},function(e,j){
    if(e) return cb(e);
    var o; try{ o=aiJson(aiText(j)); }catch(x){ return cb(null,{found:false}); }
    if(!o||!o.trovato) return cb(null,{found:false});
    var urls=(o.immagini||[]).filter(function(u){ return typeof u==='string'; }).slice(0,5), ok=[], k=0;
    var res={found:true,conf:o.confidenza||'media',brand:o.marca||'',name:o.nome||'',desc:o.descrizione||'',specs:(o.caratteristiche||[]).slice(0,8).map(String),images:[],src:/^https?:\/\//i.test(o.fonte||'')?o.fonte:'',pdf:/^https?:\/\//i.test(o.scheda_pdf||'')?o.scheda_pdf:''};
    (function next(){
      if(k>=urls.length){ res.images=ok.map(function(u,i){ return {url:u,sel:i===0}; }); return cb(null,res); }
      var u=urls[k++]; verifyImg(u,function(v){ if(v) ok.push(u); next(); });
    })();
  });
}
function runWeb(){
  if(IMP.busy) return;
  var idx=[]; IMP.rows.forEach(function(r,i){ if(r.inc&&(!r.enr||r.enr.status==='err')) idx.push(i); });
  if(!idx.length){ impState('Nessun articolo selezionato da cercare.',true); return; }
  IMP.busy=true; IMP.stop=false; var n=0, tot=idx.length, fin=0;
  function upd(){ impState('Ricerca sul web: '+fin+'/'+tot+'…'); }
  function worker(){
    if(IMP.stop||!idx.length){ if(--workers===0) end(); return; }
    var i=idx.shift(), r=IMP.rows[i]; r.enr={status:'run'}; renderImp();
    aiEnrich(r,function(e,res){
      fin++; if(e){ r.enr={status:'err',msg:e.message}; if(e.status===401||e.status===429){ IMP.stop=true; impState(e.message,true); } }
      else r.enr=res.found?{status:'ok',conf:res.conf,brand:res.brand,name:res.name,desc:res.desc,specs:res.specs,images:res.images,src:res.src,pdf:res.pdf}:{status:'none'};
      renderImp(); upd(); worker();
    });
  }
  var workers=2; function end(){ IMP.busy=false; renderImp(); var ok=IMP.rows.filter(function(r){ return r.enr&&r.enr.status==='ok'; }).length; impState('Ricerca terminata: schede trovate per '+ok+' articoli su '+tot+'. Controlla foto e descrizioni prima di salvare.'); }
  upd(); worker(); worker();
}
/* articoli salvati */
function artKey(a){ return lc(a.sup)+'|'+lc(a.code||a.name); }
function findArt(sup,code,name){ var k=lc(sup)+'|'+lc(code||name); return DB.arts.filter(function(a){ return artKey(a)===k; })[0]; }
function artPrice(a){ return r2(num(a.cost)*(1+num(a.markup)/100)); }
function embedImg(u,cb){
  if(u.indexOf('data:')===0){ cb(u); return; }
  fetch(u,{mode:'cors',referrerPolicy:'no-referrer'}).then(function(r){ if(!r.ok) throw 0; return r.blob(); }).then(function(b){ readProdImg(b,1000,function(d){ cb(d||u); }); }).catch(function(){ cb(u); });
}
function saveImport(){
  var sup=$('im-sup').value.trim(), date=$('im-date').value||today();
  if(!sup){ impState('Scrivi il nome del fornitore.',true); $('im-sup').focus(); return; }
  var rows=IMP.rows.filter(function(r){ return r.inc&&(r.name||r.code); });
  if(!rows.length){ impState('Nessun articolo selezionato.',true); return; }
  IMP.busy=true; impState('Salvo gli articoli e le foto…');
  var jobs=[]; rows.forEach(function(r){ if(r.enr&&r.enr.status==='ok') r.enr.images.forEach(function(im){ if(im.sel) jobs.push(im); }); });
  var left=jobs.length;
  function finish(){
    var nNew=0,nUp=0,nPh=0;
    rows.forEach(function(r){
      var a=findArt(sup,r.code,r.name), isNew=!a;
      if(!a){ a={id:uid(),sup:sup,code:r.code,name:r.name,brand:r.brand,um:r.um,cost:0,markup:AI.markup,price:0,desc:'',specs:'',link:'',pdfurl:'',photos:[],hist:[],upd:0}; DB.arts.push(a); nNew++; }
      else if(num(a.cost)!==num(r.cost)){ (a.hist=a.hist||[]).push({d:date,c:a.cost}); nUp++; }
      a.cost=num(r.cost); if(r.um) a.um=r.um; if(r.brand&&!a.brand) a.brand=r.brand; a.price=artPrice(a);
      var e=r.enr; if(e&&e.status==='ok'){
        if(!a.desc) a.desc=e.desc; if(!a.specs) a.specs=(e.specs||[]).join('\n'); if(!a.link) a.link=e.src; if(!a.pdfurl) a.pdfurl=e.pdf||''; if(!a.brand&&e.brand) a.brand=e.brand;
        e.images.forEach(function(im){ if(im.sel&&im.saved&&(a.photos||[]).indexOf(im.saved)<0&&(a.photos||[]).length<6){ (a.photos=a.photos||[]).push(im.saved); nPh++; } });
      }
      a.sdate=date; a.upd=Date.now();
    });
    DB.arts.sort(byName); dbSave(); IMP.rows=[]; IMP.files=[]; IMP.busy=false; renderImp(); renderArts(); renderAq(); renderFiles();
    impState('Salvati: '+nNew+' articoli nuovi, '+nUp+' prezzi aggiornati, '+nPh+' foto.');
  }
  if(!left) finish(); else jobs.forEach(function(im){ embedImg(im.url,function(d){ im.saved=d; if(--left===0) finish(); }); });
}
function addArtToQuote(id){
  var a=DB.arts.filter(function(x){ return x.id===id; })[0]; if(!a) return;
  var ex=S.lines.filter(function(l){ return l.art===id; })[0];
  if(ex) ex.q=num(ex.q)+1; else { var nl2={d:a.name+(a.code?' ('+a.code+')':''),u:a.um||'cad',q:1,p:num(a.price)||artPrice(a),s:0,art:id}; if(S.model==='app'&&curKey()) nl2.r=curKey(); brTag(nl2); S.lines.push(nl2); var lka=linkLine(nl2,{force:$('art-card').checked,name:a.name,brand:a.brand,code:a.code}); if(lka){ openP[lka.p.id]=true; renderProducts(); } }
  renderLines(); touch(); toast('Aggiunto al preventivo: '+a.name);
}
function chipFor(r){
  var sup=$('im-sup').value.trim(), a=sup?findArt(sup,r.code,r.name):null;
  if(!a) return '<span class="chip">nuovo articolo</span>';
  var d=num(r.cost)-num(a.cost); if(!d) return '<span class="chip">già presente, prezzo invariato</span>';
  var pc=num(a.cost)?Math.round(d/num(a.cost)*1000)/10:0;
  return '<span class="chip warn2">prezzo '+(d>0?'in aumento ':'in calo ')+eur(num(a.cost))+' → '+eur(num(r.cost))+(pc?' ('+(pc>0?'+':'')+qfmt(pc)+'%)':'')+'</span>';
}
function enrHtml(r,i){
  var e=r.enr; if(!e) return '';
  if(e.status==='run') return '<p class="hint">Ricerca sul web in corso…</p>';
  if(e.status==='none') return '<p class="hint">Scheda esatta non trovata: puoi scrivere tu la descrizione dopo il salvataggio.</p>';
  if(e.status==='err') return '<p class="hint" style="color:var(--danger)">'+esc(e.msg||'Errore')+'</p>';
  var th=(e.images||[]).map(function(im,k){ return '<label class="thumb" style="width:92px;height:70px;cursor:pointer" title="foto"><img src="'+esc(im.url)+'" alt="" referrerpolicy="no-referrer"><span style="position:absolute;left:3px;bottom:3px;background:rgba(255,255,255,.9);border-radius:3px;padding:0 3px"><input type="checkbox" data-ri="'+i+'" data-ik="'+k+'"'+(im.sel?' checked':'')+'></span></label>'; }).join('')||'<span class="hint">Nessuna foto verificata.</span>';
  return '<div class="enr"><div class="row">'+(e.conf==='manuale'?'':'<span class="chip">'+(/^(alta|media|bassa)$/.test(e.conf)?'fiducia ':'')+esc(e.conf)+'</span>')+(e.src?'<a class="hint" href="'+esc(e.src)+'" target="_blank" rel="noopener">fonte: '+esc(e.src.replace(/^https?:\/\//,'').slice(0,50))+'</a>':'')+'</div>'+
    '<div class="thumbs">'+th+'</div><label class="f">Descrizione trovata<textarea data-ri="'+i+'" data-ef="desc" style="min-height:70px">'+esc(e.desc)+'</textarea></label>'+
    '<label class="f">Caratteristiche<textarea data-ri="'+i+'" data-ef="specs" style="min-height:70px">'+esc((e.specs||[]).join('\n'))+'</textarea></label></div>';
}
function toolsHtml(r,i){
  var q=encodeURIComponent((String(r.brand||'')+' '+(r.code||r.name)).trim()), st=r.enr&&r.enr.status, ok=st==='ok', n=ok?(r.enr.images||[]).length:0;
  var pre=(st&&!ok)?enrHtml(r,i):'', blank={enr:ok?r.enr:{status:'ok',conf:'manuale',desc:'',specs:[],images:[]}};
  return '<details class="sv"'+((r.open||ok&&AI.use)?' open':'')+'><summary>Foto e descrizione (facoltative)'+(n?' · '+n+' foto':'')+'</summary>'+pre+
    '<div class="row"><a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&q='+q+'">Cerca foto</a><a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/search?q='+q+'+scheda+tecnica">Cerca scheda</a><label class="btn ghost">Scegli foto<input type="file" accept="image/*" hidden data-rphoto="'+i+'"></label></div>'+
    '<input type="text" data-rurl="'+i+'" placeholder="Incolla qui (Ctrl+V) la foto copiata, oppure il suo link" autocomplete="off">'+enrHtml(blank,i)+'</details>';
}
function addRowImg(i,url){
  var r=IMP.rows[i]; if(!r) return;
  if(!r.enr||r.enr.status!=='ok') r.enr={status:'ok',conf:'manuale',desc:'',specs:[],images:[]};
  if(r.enr.images.length>=6){ toast('Massimo 6 foto per articolo'); return; }
  r.enr.images.push({url:url,sel:true}); r.open=true; renderImp();
}
function renderImp(){
  var el=$('im-rows'); if(!el) return;
  $('im-save').disabled=!IMP.rows.length||IMP.busy; $('im-web').disabled=!IMP.rows.length||IMP.busy; $('im-go').disabled=IMP.busy; $('im-stop').hidden=!IMP.busy;
  el.innerHTML=IMP.rows.map(function(r,i){
    var pr=r2(num(r.cost)*(1+num(AI.markup)/100));
    return '<div class="rowc" style="flex-direction:column;align-items:stretch" data-ri="'+i+'"><div class="row"><label class="chk"><input type="checkbox" data-rf="inc" data-ri="'+i+'"'+(r.inc?' checked':'')+'><b>Includi</b></label>'+chipFor(r)+(r.miss?'<span class="chip warn2">prezzo non letto: controlla</span>':'')+(r.dubt?'<span class="chip warn2">controlla i prezzi</span>':'')+'</div>'+
      '<div class="grid2"><label class="f">Codice<input type="text" data-rf="code" data-ri="'+i+'" value="'+esc(r.code)+'"></label><label class="f" style="grid-column:span 2">Descrizione<input type="text" data-rf="name" data-ri="'+i+'" value="'+esc(r.name)+'"></label>'+
      '<label class="f">Marca<input type="text" data-rf="brand" data-ri="'+i+'" value="'+esc(r.brand)+'"></label><label class="f">U.m.<input type="text" data-rf="um" data-ri="'+i+'" value="'+esc(r.um)+'"></label>'+
      '<label class="f">Costo netto unitario €<input type="number" step="any" min="0" data-rf="cost" data-ri="'+i+'" value="'+esc(r.cost)+'"></label></div>'+
      (r.list?'<p class="hint">Listino '+eur(r.list)+(r.disc?' · sconto '+esc(r.disc):'')+' · prezzo di vendita con ricarico '+qfmt(num(AI.markup))+'%: <b>'+eur(pr)+'</b></p>':'<p class="hint">Prezzo di vendita con ricarico '+qfmt(num(AI.markup))+'%: <b>'+eur(pr)+'</b></p>')+
      toolsHtml(r,i)+'</div>';
  }).join('')||'<div class="empty">Carica il preventivo di un fornitore (PDF o foto), oppure incolla il testo, e premi «Leggi il preventivo».</div>';
}
$('im-rows').addEventListener('input',function(e){
  var t=e.target, i=t.getAttribute('data-ri'); if(i==null) return; var r=IMP.rows[+i], f=t.getAttribute('data-rf'), ef=t.getAttribute('data-ef'), ik=t.getAttribute('data-ik');
  if(ik!=null){ r.enr.images[+ik].sel=t.checked; return; }
  if(ef){ if(!r.enr||r.enr.status!=='ok') r.enr={status:'ok',conf:'manuale',desc:'',specs:[],images:[]}; r.enr[ef]=(ef==='specs')?t.value.split('\n').filter(Boolean):t.value; return; }
  if(!f) return;
  if(f==='inc'){ r.inc=t.checked; return; }
  r[f]=(f==='cost')?num(t.value):t.value;
  if(f==='cost'){ var p=t.closest('.rowc').querySelector('p.hint b'); if(p) p.textContent=eur(r2(num(r.cost)*(1+num(AI.markup)/100))); }
});
function renderFiles(){
  $('im-files').textContent=IMP.files.length?('File scelti: '+IMP.files.map(function(f){ return f.name; }).join(', ')):'';
}
function setFiles(list){ IMP.files=IMP.files.concat(Array.prototype.slice.call(list||[])).slice(0,8); renderFiles(); }
$('im-file').addEventListener('change',function(e){ setFiles(e.target.files); e.target.value=''; });
['dragover','dragleave','drop'].forEach(function(ev){ $('im-drop').addEventListener(ev,function(e){ e.preventDefault(); $('im-drop').classList.toggle('over',ev==='dragover'); if(ev==='drop') setFiles(e.dataTransfer.files); }); });
$('im-rows').addEventListener('change',function(e){
  var t=e.target, a=t.getAttribute('data-rphoto'), u=t.getAttribute('data-rurl');
  if(a!=null&&t.files&&t.files[0]){ var f=t.files[0]; readProdImg(f,1000,function(d){ if(d) addRowImg(+a,d); }); t.value=''; }
  else if(u!=null){ var v=t.value.trim(); t.value=''; if(!v) return; if(!/^https?:\/\//i.test(v)){ toast('Incolla un link che inizia con http'); return; } verifyImg(v,function(ok){ if(ok) addRowImg(+u,v); else toast('Quel link non è una foto leggibile'); }); }
});
$('im-rows').addEventListener('paste',function(e){
  var t=e.target, u=t.getAttribute&&t.getAttribute('data-rurl'); if(u==null) return;
  var fl=e.clipboardData&&e.clipboardData.files; if(fl&&fl.length&&/^image\//.test(fl[0].type)){ e.preventDefault(); readProdImg(fl[0],1000,function(d){ if(d) addRowImg(+u,d); }); }
});
$('im-go').addEventListener('click',runExtract);
$('im-web').addEventListener('click',runWeb);
$('im-stop').addEventListener('click',function(){ IMP.stop=true; impState('Mi fermo dopo l\'articolo in corso…'); });
$('im-save').addEventListener('click',saveImport);
$('im-clear').addEventListener('click',function(){ IMP.rows=[]; IMP.files=[]; $('im-paste').value=''; renderImp(); renderFiles(); impState(''); });
$('im-sup').addEventListener('input',function(){ renderImp(); });
$('ai-use').addEventListener('change',function(e){ AI.use=e.target.checked; aiStore(); var op=$('ai-set').open; renderAiSet(); $('ai-set').open=op; renderImp(); });
['ai-key:key','ai-model:model','ai-mk:markup'].forEach(function(p){ var a=p.split(':'); $(a[0]).addEventListener('input',function(e){ AI[a[1]]=a[1]==='markup'?num(e.target.value):e.target.value.trim(); aiStore(); renderImp(); }); });
function renderAiSet(){ $('ai-use').checked=AI.use; $('ai-adv').hidden=!AI.use; $('im-web').hidden=!AI.use; $('ai-key').value=AI.key; $('ai-model').value=AI.model; $('ai-mk').value=AI.markup; $('ai-set').open=false; }
/* elenco articoli */
var openA={};
function renderArts(){
  var el=$('art-list'); if(!el) return;
  var q=lc($('art-search').value), sf=$('art-sup').value;
  var sups=[]; DB.arts.forEach(function(a){ if(a.sup&&sups.indexOf(a.sup)<0) sups.push(a.sup); }); sups.sort();
  $('art-sup').innerHTML='<option value="">Tutti i fornitori</option>'+sups.map(function(s){ return '<option'+(s===sf?' selected':'')+'>'+esc(s)+'</option>'; }).join('');
  $('sup-dl').innerHTML=sups.map(function(s){ return '<option value="'+esc(s)+'">'; }).join('');
  var L=DB.arts.filter(function(a){ return (!sf||a.sup===sf)&&(!q||lc(a.name+' '+a.code+' '+a.brand+' '+a.sup).indexOf(q)>-1); }).slice(0,60);
  $('art-count').textContent=DB.arts.length?(DB.arts.length+' articoli salvati'+(DB.arts.length>L.length?' (ne mostro '+L.length+')':'')):'';
  el.innerHTML=L.map(function(a){
    var th=(a.photos||[]).map(function(u,j){ return '<div class="thumb"><img src="'+u+'" alt="" referrerpolicy="no-referrer"><button type="button" data-arph="'+a.id+':'+j+'" aria-label="Rimuovi foto">×</button></div>'; }).join('');
    var prev=(a.hist&&a.hist.length)?'<p class="hint">Costi precedenti: '+a.hist.slice(-4).map(function(h){ return eur(h.c)+(h.d?' ('+dateIt(h.d)+')':''); }).join(' · ')+'</p>':'';
    return '<details class="pe" data-aid="'+a.id+'"'+(openA[a.id]?' open':'')+'><summary><span class="pn">'+esc(a.name)+'<span class="hint"> · '+esc(a.sup)+(a.code?' · '+esc(a.code):'')+'</span></span><b>'+eur(num(a.price))+'</b>'+
      '<button type="button" class="btn sm" data-aadd="'+a.id+'" aria-label="Aggiungi al preventivo">+ Preventivo</button></summary><div class="pbody">'+
      '<div class="grid2"><label class="f">Nome<input type="text" data-af="name" data-ai="'+a.id+'" value="'+esc(a.name)+'"></label><label class="f">Codice<input type="text" data-af="code" data-ai="'+a.id+'" value="'+esc(a.code)+'"></label>'+
      '<label class="f">Marca<input type="text" data-af="brand" data-ai="'+a.id+'" value="'+esc(a.brand)+'"></label><label class="f">Fornitore<input type="text" data-af="sup" data-ai="'+a.id+'" value="'+esc(a.sup)+'"></label>'+
      '<label class="f">U.m.<input type="text" data-af="um" data-ai="'+a.id+'" value="'+esc(a.um)+'"></label><label class="f">Costo €<input type="number" step="any" min="0" data-af="cost" data-ai="'+a.id+'" value="'+esc(a.cost)+'"></label>'+
      '<label class="f">Ricarico %<input type="number" step="any" data-af="markup" data-ai="'+a.id+'" value="'+esc(a.markup)+'"></label><label class="f">Prezzo di vendita €<input type="number" step="any" min="0" data-af="price" data-ai="'+a.id+'" value="'+esc(a.price)+'"></label></div>'+prev+
      '<label class="f">Descrizione<textarea data-af="desc" data-ai="'+a.id+'">'+esc(a.desc)+'</textarea></label><label class="f">Caratteristiche (voce: valore, una per riga)<textarea data-af="specs" data-ai="'+a.id+'" style="min-height:90px">'+esc(a.specs)+'</textarea></label>'+
      '<label class="f">Scheda / fonte (link)<input type="url" data-af="link" data-ai="'+a.id+'" value="'+esc(a.link)+'"></label>'+
      (a.pdfurl?'<p class="hint">Scheda tecnica PDF: <a href="'+esc(a.pdfurl)+'" target="_blank" rel="noopener">apri</a></p>':'')+
      '<div class="thumbs">'+th+'</div><div class="row"><label class="btn ghost sm">Aggiungi foto<input type="file" accept="image/*" multiple hidden data-aph="'+a.id+'"></label><button type="button" class="btn ghost sm" data-aweb="'+a.id+'">Cerca descrizione e foto sul web</button><button type="button" class="btn x" data-adel="'+a.id+'" aria-label="Elimina articolo">× Elimina</button></div></div></details>';
  }).join('')||'<div class="empty">'+(DB.arts.length?'Nessun risultato.':'Nessun articolo salvato. Importa il preventivo di un fornitore per iniziare.')+'</div>';
}
$('art-list').addEventListener('toggle',function(e){ var d=e.target; if(d&&d.getAttribute&&d.getAttribute('data-aid')) openA[d.getAttribute('data-aid')]=d.open; },true);
$('art-list').addEventListener('input',function(e){
  var t=e.target, id=t.getAttribute('data-ai'), f=t.getAttribute('data-af'); if(!f) return;
  var a=DB.arts.filter(function(x){ return x.id===id; })[0]; if(!a) return;
  a[f]=(f==='cost'||f==='markup'||f==='price')?num(t.value):t.value;
  var box=t.closest('.pbody');
  if(f==='cost'||f==='markup'){ a.price=artPrice(a); box.querySelector('[data-af="price"]').value=a.price; }
  if(f==='price'&&num(a.cost)>0){ a.markup=Math.round((num(a.price)/num(a.cost)-1)*1000)/10; box.querySelector('[data-af="markup"]').value=a.markup; }
  if(f==='name'){ var pn=t.closest('.pe').querySelector('.pn'); if(pn) pn.firstChild.textContent=t.value; }
  a.upd=Date.now(); dbSave(); renderAq();
});
$('art-list').addEventListener('click',function(e){
  var b;
  if((b=e.target.closest('[data-aadd]'))){ e.preventDefault(); return addArtToQuote(b.getAttribute('data-aadd')); }
  if((b=e.target.closest('[data-arph]'))){ var p=b.getAttribute('data-arph').split(':'), a=DB.arts.filter(function(x){ return x.id===p[0]; })[0]; a.photos.splice(+p[1],1); dbSave(); renderArts(); return; }
  if((b=e.target.closest('[data-adel]'))){ var id=b.getAttribute('data-adel'); return delTwice('a'+id,function(){ DB.del[id]=Date.now(); DB.arts=DB.arts.filter(function(x){ return x.id!==id; }); dbSave(); renderArts(); renderAq(); },b); }
  if((b=e.target.closest('[data-aweb]'))){
    var art=DB.arts.filter(function(x){ return x.id===b.getAttribute('data-aweb'); })[0]; b.disabled=true; b.textContent='Ricerca in corso…';
    aiEnrich(art,function(er,res){
      if(er){ toast(er.message); renderArts(); return; }
      if(!res.found){ toast('Scheda esatta non trovata'); renderArts(); return; }
      var jobs=res.images.slice(0,2), left=jobs.length;
      function fin(){ if(!art.desc) art.desc=res.desc; if(!art.specs) art.specs=res.specs.join('\n'); if(!art.link) art.link=res.src; if(!art.pdfurl) art.pdfurl=res.pdf; if(!art.brand) art.brand=res.brand; art.upd=Date.now(); dbSave(); renderArts(); toast('Scheda trovata ('+res.conf+'): controlla descrizione e foto'); }
      if(!left) fin(); else jobs.forEach(function(im){ embedImg(im.url,function(d){ if((art.photos=art.photos||[]).indexOf(d)<0&&art.photos.length<6) art.photos.push(d); if(--left===0) fin(); }); });
    });
  }
});
$('art-list').addEventListener('change',function(e){
  var id=e.target.getAttribute('data-aph'); if(id==null) return; var fl=Array.prototype.slice.call(e.target.files||[]); e.target.value='';
  var a=DB.arts.filter(function(x){ return x.id===id; })[0]; if(!a) return; if(!a.photos) a.photos=[];
  addPhotos(a.photos,6,fl,function(){ dbSave(); renderArts(); });
});
['art-search','art-sup'].forEach(function(id){ $(id).addEventListener('input',renderArts); });
/* ricerca rapida nel preventivo */
function renderAq(){
  var el=$('aq-list'); if(!el) return; var q=lc($('aq-search').value);
  var L=DB.arts.filter(function(a){ return !q||lc(a.name+' '+a.code+' '+a.brand+' '+a.sup).indexOf(q)>-1; }).slice(0,40);
  el.innerHTML=L.map(function(a){ return '<div class="crow"><span class="d">'+esc(a.name)+'<span class="hint"> · '+esc(a.sup)+(a.code?' · '+esc(a.code):'')+'</span></span><span class="u">'+eur(num(a.price))+'</span><button type="button" class="btn sm" data-aqa="'+a.id+'" aria-label="Aggiungi">+</button></div>'; }).join('')||'<div class="empty">'+(DB.arts.length?'Nessun risultato.':'Nessun articolo dai fornitori: importa un preventivo dalla scheda Fornitori.')+'</div>';
}
$('aq-search').addEventListener('input',renderAq);
$('aq-list').addEventListener('click',function(e){ var b=e.target.closest('[data-aqa]'); if(b) addArtToQuote(b.getAttribute('data-aqa')); });
aiLoad();

/* copia di sicurezza */
function markBackup(){ DB.lastBackup=Date.now(); dbSave(true); renderArchivio(); }
function backupName(){ var d=new Date(); return 'archivio-ieci-'+today()+'-'+('0'+d.getHours()).slice(-2)+('0'+d.getMinutes()).slice(-2)+'.json'; }
