/* ===== Loghi e foto dal web: gratis, senza chiavi né account.
   Fonti: Wikidata (loghi ufficiali delle aziende), Wikimedia Commons e Openverse (immagini con licenza libera).
   Escono solo i nomi di marche e prodotti, mai i dati dei clienti. Le immagini scelte restano sul dispositivo e vengono ricordate. ===== */
var IW={run:false, t:0, seq:0, pk:null, secs:[], busy:false, fill:null};
var IW_WD='https://www.wikidata.org/w/api.php?', IW_CM='https://commons.wikimedia.org/w/api.php?', IW_OV='https://api.openverse.org/v1/images/?';
var IW_SITI={bticino:'bticino.it',vimar:'vimar.com',ave:'ave.it',gewiss:'gewiss.com',schneider:'se.com',legrand:'legrand.it',abb:'abb.com',hager:'hager.it',siemens:'siemens.com',urmet:'urmet.com',comelit:'comelitgroup.com',elvox:'vimar.com',fermax:'fermax.com',came:'came.com',nice:'niceforyou.com',faac:'faac.it',bft:'bft-automation.com',beninca:'beninca.com',fadini:'fadini.net',hikvision:'hikvision.com',dahua:'dahuasecurity.com',uniview:'uniview.com',axis:'axis.com',ajax:'ajax.systems',huawei:'solar.huawei.com',sma:'sma-italia.com',fronius:'fronius.com',solaredge:'solaredge.com',sungrow:'sungrowpower.com',fracarro:'fracarro.com',shelly:'shelly.com',fibaro:'fibaro.com',tecnoalarm:'tecnoalarm.com',bentel:'bentelsecurity.com',inim:'inim.biz'};
var IW_CO=/aziend|impres|societ|produtt|fabbric|multinazional|marchi|marca|grupp|compan|manufactur|brand|corporat|enterprise|business|firm|holding|electric|elettr|automazion|sicurezza|security|maker|fornitor|industr/i;

function iwMode(){ return APP.webimg||'auto'; }
function iwNet(){ return iwMode()!=='off'&&navigator.onLine!==false; }
function iwK(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,''); }
function iwQs(o){ return Object.keys(o).map(function(k){ return k+'='+encodeURIComponent(o[k]); }).join('&'); }
function iwTo(p,ms){ return new Promise(function(ok,ko){ var t=setTimeout(function(){ ko(new Error('tempo scaduto')); },ms||12000); p.then(function(v){ clearTimeout(t); ok(v); },function(e){ clearTimeout(t); ko(e); }); }); }
function iwGet(u){ return iwTo(fetch(u,{mode:'cors',credentials:'omit',referrerPolicy:'no-referrer'}).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })); }
function iwTxt(o){ var s=String(o&&o.value||''); if(s.indexOf('<')<0) return s.replace(/\s+/g,' ').trim().slice(0,70); try{ var d=new DOMParser().parseFromString(s,'text/html'); s=d.body?d.body.textContent||'':''; }catch(e){ s=s.replace(/<[^>]*>/g,''); } return s.replace(/\s+/g,' ').trim().slice(0,70); }
function iwSmall(u){ return String(u||'').replace(/\/(\d+)px-/,'/250px-'); }
function iwClaim(a){ var c=a&&a[0], v=c&&c.mainsnak&&c.mainsnak.datavalue&&c.mainsnak.datavalue.value; return typeof v==='string'?v:''; }
function iwLab(o){ return o?((o.it||o.en||{}).value||''):''; }
// "Bticino Living Now" -> "Bticino": il logo si cerca e si ricorda per la marca
function iwBase(b){ b=String(b||'').trim(); var lw=b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''), r='', rl=0;
  (typeof AS_MARCHE!=='undefined'?AS_MARCHE:[]).forEach(function(m){ var ml=m.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); if(ml.length>rl&&lw.indexOf(ml)===0&&!/[a-z0-9]/.test(lw.charAt(ml.length))){ r=m; rl=ml.length; } });
  return r||b; }
// i testi di esempio («Marca esempio», «Modello XX») non sono marche vere: non si cercano
function iwVero(s){ s=String(s||'').trim(); return !!s&&!/esempio|\bxx\b|^xx|-xx|xx-/i.test(s); }
function iwFree(lic){ return !lic||/public domain|pubblico dominio|^pd|cc0|pdm|no restrictions/i.test(lic); }

/* ---------- fonti ---------- */
function iwPages(j){
  var pg=(j&&j.query&&j.query.pages)||{}, out=[];
  Object.keys(pg).forEach(function(k){ var p=pg[k], ii=p&&p.imageinfo&&p.imageinfo[0]; if(!ii||!/^image\/(png|jpe?g|svg\+xml|webp|gif)$/.test(ii.mime||'')) return;
    var md=ii.extmetadata||{}, full=ii.thumburl||ii.url, nm=String(p.title||'').replace(/^File:/,'');
    out.push({file:nm,thumb:iwSmall(full),full:full,alt:(ii.url&&!/\.svg$/i.test(ii.url))?ii.url:'',title:nm.replace(/\.[a-z0-9]+$/i,'').replace(/_/g,' '),lic:iwTxt(md.LicenseShortName),by:iwTxt(md.Artist),page:ii.descriptionurl||'',i:p.index||0}); });
  return out.sort(function(a,b){ return a.i-b.i; });
}
function iwInfo(files,w){
  if(!files.length) return Promise.resolve([]);
  return iwGet(IW_CM+iwQs({action:'query',titles:files.slice(0,20).map(function(f){ return 'File:'+f; }).join('|'),prop:'imageinfo',iiprop:'url|mime|extmetadata',iiextmetadatafilter:'LicenseShortName|Artist',iiurlwidth:w||500,format:'json',origin:'*'})).then(iwPages);
}
// Wikidata: l'azienda con quel nome e il suo logo ufficiale (proprietà P154)
function iwWdLogos(brand){
  var b=String(brand||'').trim(); if(b.length<2) return Promise.resolve([]);
  return iwGet(IW_WD+iwQs({action:'wbsearchentities',search:b,language:'it',uselang:'it',type:'item',limit:8,format:'json',origin:'*'})).then(function(j){
    var ids=((j&&j.search)||[]).map(function(x){ return x&&x.id; }).filter(Boolean); if(!ids.length) return [];
    return iwGet(IW_WD+iwQs({action:'wbgetentities',ids:ids.join('|'),props:'claims|labels|descriptions',languages:'it|en',format:'json',origin:'*'})).then(function(e){
      var ents=(e&&e.entities)||{}, files=[], meta={}, kb=iwK(b);
      ids.forEach(function(id,rank){
        var x=ents[id]; if(!x||!x.claims) return; var f=iwClaim(x.claims.P154); if(!f) return; var fk=iwK(f); if(meta[fk]) return;
        var lab=iwLab(x.labels), des=iwLab(x.descriptions), kl=iwK(lab);
        meta[fk]={rank:rank,lab:lab,des:des,exact:kl===kb||(kl.indexOf(kb)===0&&kl.length-kb.length<=6),co:IW_CO.test(des),site:iwClaim(x.claims.P856)};
        files.push(f);
      });
      return iwInfo(files,500).then(function(list){
        list.forEach(function(c){ var m=meta[iwK(c.file)]||{}; c.src='Logo ufficiale · Wikidata'; c.exact=!!m.exact; c.co=!!m.co; c.rank=m.rank||0; c.site=m.site||''; c.title=m.lab||c.title; c.sub=m.des||''; });
        return list.sort(function(a,b){ return ((b.exact&&b.co)-(a.exact&&a.co))||(b.exact-a.exact)||(a.rank-b.rank); });
      });
    });
  });
}
function iwCmSearch(q,logo){
  return iwGet(IW_CM+iwQs({action:'query',generator:'search',gsrsearch:q+(logo?' logo':''),gsrnamespace:6,gsrlimit:20,prop:'imageinfo',iiprop:'url|mime|extmetadata',iiextmetadatafilter:'LicenseShortName|Artist',iiurlwidth:logo?500:960,format:'json',origin:'*'})).then(function(j){ return iwPages(j).map(function(c){ c.src='Wikimedia Commons'; return c; }); });
}
function iwOv(q){
  return iwGet(IW_OV+iwQs({q:q,page_size:20,license_type:'commercial',mature:'false'})).then(function(j){
    return ((j&&j.results)||[]).filter(function(r){ return r&&(r.thumbnail||r.url); }).map(function(r){ var l=String(r.license||'').toLowerCase();
      return {thumb:r.thumbnail||r.url,full:r.url||r.thumbnail,alt:r.thumbnail||'',title:String(r.title||'').slice(0,80),lic:l==='cc0'?'CC0':l==='pdm'?'Pubblico dominio':'CC '+l.toUpperCase()+(r.license_version?' '+r.license_version:''),by:String(r.creator||'').slice(0,60),page:r.foreign_landing_url||'',src:'Openverse'}; });
  });
}
function iwToks(q){ return String(q||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(function(w){ return w.length>=2&&!/^(di|da|il|lo|la|le|con|per|ed|in|un|una)$/.test(w); }); }
// prima di tutto: quello che hai già (loghi salvati, marchi, libreria prodotti, articoli dei fornitori)
function iwMine(q,kind,self){
  var tk=iwToks(q), out=[], seen={}; if(!tk.length) return out;
  var need=Math.max(1,Math.ceil(tk.length*0.6));
  function sc(s){ var t=' '+iwToks(s).join(' ')+' ', m=0; tk.forEach(function(w){ if(t.indexOf(' '+w)>-1) m++; }); return m; }
  function add(d,t,src,s){ if(!d||!/^data:image\//.test(d)) return; var h=iwH(d); if(seen[h]) return; seen[h]=1; out.push({data:d,thumb:d,title:t||'',src:src,sc:s,lic:''}); }
  if(kind==='logo'){
    (DB.logos||[]).forEach(function(x){ var s=sc(x.name); if(s>=need) add(x.img,x.name,'Già salvato',s+1); });
    (S.trust.bgroups||[]).forEach(function(g){ (g.items||[]).forEach(function(it){ var s=sc(it.name); if(s>=need) add(it.img,it.name,'Marchi che installiamo',s); }); });
  } else {
    DB.prods.concat(DB.arts||[]).forEach(function(x){ var s=sc([x.brand,x.name,x.code].join(' ')); if(s>=need) (x.photos||[]).slice(0,3).forEach(function(u){ add(u,x.name,'Dalla tua libreria',s); }); });
    S.products.forEach(function(x){ if(x===self) return; var s=sc([x.brand,x.name,x.code].join(' ')); if(s>=need) (x.photos||[]).slice(0,2).forEach(function(u){ add(u,x.name,'In questo preventivo',s); }); });
  }
  return out.sort(function(a,b){ return b.sc-a.sc; }).slice(0,12);
}

/* ---------- scaricare e preparare l'immagine ---------- */
function iwProxy(u){ return 'https://wsrv.nl/?url='+encodeURIComponent(u)+'&w=1200&we&output=png'; }
function iwBlobOf(c){
  if(c.data) return fetch(c.data).then(function(r){ return r.blob(); });
  var urls=[]; [c.full,c.alt,c.thumb].forEach(function(u){ if(u&&/^https?:\/\//i.test(u)&&urls.indexOf(u)<0) urls.push(u); });
  if(urls[0]) urls.push(iwProxy(urls[0]));
  var i=0;
  function next(){
    if(i>=urls.length) return Promise.reject(new Error('immagine non scaricabile'));
    var u=urls[i++];
    return iwTo(fetch(u,{mode:'cors',credentials:'omit',referrerPolicy:'no-referrer'}).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.blob(); }),15000)
      .then(function(b){ if(!b||b.size<100||(b.type&&!/^image\//.test(b.type))) throw new Error('non è un\'immagine'); return b; })
      .catch(function(){ return next(); });
  }
  return next();
}
function iwH(u){ u=String(u||''); var h=5381, st=Math.max(1,Math.floor(u.length/600)); for(var i=0;i<u.length;i+=st) h=((h<<5)+h+u.charCodeAt(i))|0; return (h>>>0).toString(36)+'_'+u.length; }
// taglia i bordi vuoti del logo: tutti i loghi hanno lo stesso "peso" nel documento
function iwTrim(url,cb){
  var im=new Image();
  im.onload=function(){ try{
    var w=im.naturalWidth, h=im.naturalHeight; if(!w||!h) return cb(url);
    var c=document.createElement('canvas'); c.width=w; c.height=h; var x=c.getContext('2d'); x.drawImage(im,0,0);
    var d=x.getImageData(0,0,w,h).data, x0=w, y0=h, x1=-1, y1=-1, X, Y, i;
    for(Y=0;Y<h;Y++) for(X=0;X<w;X++){ i=(Y*w+X)*4; if(d[i+3]>24&&!(d[i]>240&&d[i+1]>240&&d[i+2]>240)){ if(X<x0) x0=X; if(X>x1) x1=X; if(Y<y0) y0=Y; if(Y>y1) y1=Y; } }
    if(x1<0) return cb(url);
    var pad=Math.round(Math.max(x1-x0,y1-y0)*0.03); x0=Math.max(0,x0-pad); y0=Math.max(0,y0-pad); x1=Math.min(w-1,x1+pad); y1=Math.min(h-1,y1+pad);
    var cw=x1-x0+1, ch=y1-y0+1; if(cw>=w-1&&ch>=h-1) return cb(url);
    var o=document.createElement('canvas'); o.width=cw; o.height=ch; o.getContext('2d').drawImage(c,x0,y0,cw,ch,0,0,cw,ch); cb(o.toDataURL('image/png'));
  }catch(e){ cb(url); } };
  im.onerror=function(){ cb(url); }; im.src=url;
}
function iwLogoData(blob,cb){ readImage(blob,420,true,function(d){ if(!d) return cb(''); if(d.indexOf('data:image/svg')===0) return cb(d); iwTrim(d,cb); }); }

/* ---------- loghi ricordati per tutti i preventivi ---------- */
function iwMem(brand){
  var k=iwK(brand), r='', p=''; if(k.length<2) return '';
  (DB.logos||[]).forEach(function(x){ var n=iwK(x.name); if(!n) return; if(n===k&&!r) r=x.img; else if(!p&&((n.length>=3&&k.indexOf(n)===0)||(k.length>=3&&n.indexOf(k)===0))) p=x.img; });
  return r||p;
}
function iwLogoSrc(brand){
  if(!brandLogo(brand)) return '';
  var b=String(brand||'').toLowerCase().replace(/[^a-z0-9]/g,''), t=false;
  (S.trust.bgroups||[]).forEach(function(g){ (g.items||[]).forEach(function(it){ var n=String(it.name||'').toLowerCase().replace(/[^a-z0-9]/g,''); if(n&&(n.indexOf(b)>-1||(n.length>=3&&b.indexOf(n)>-1))) t=true; }); });
  return t?'trust':'mem';
}
function iwSaveLogo(name,img,src,site){
  name=String(name||'').trim(); var k=iwK(name); if(k.length<2||!img) return;
  if(!DB.logos) DB.logos=[]; var ex=null; DB.logos.forEach(function(x){ if(iwK(x.name)===k) ex=x; });
  if(ex){ ex.img=img; ex.src=src||''; ex.upd=Date.now(); if(site) ex.site=site; } else DB.logos.push({id:uid(),name:name,img:img,src:src||'',site:site||'',upd:Date.now()});
  DB.logos.sort(byName); dbSave(); iwUnmark(name);
}
function iwNoMap(){ try{ return JSON.parse(localStorage.getItem('ieci-iw-no')||'{}')||{}; }catch(e){ return {}; } }
function iwTried(b){ var t=iwNoMap()[iwK(iwBase(b))]; return !!t&&Date.now()-t<3*864e5; }
function iwMark(b){ try{ var m=iwNoMap(); m[iwK(iwBase(b))]=Date.now(); localStorage.setItem('ieci-iw-no',JSON.stringify(m)); }catch(e){} }
function iwUnmark(b){ try{ var m=iwNoMap(); delete m[iwK(iwBase(b))]; localStorage.setItem('ieci-iw-no',JSON.stringify(m)); }catch(e){} }
// le marche usate nel preventivo
function iwBrands(){
  var out=[], seen={};
  function add(b){ if(!iwVero(b)) return; b=iwBase(b); var k=iwK(b); if(k.length<2||seen[k]) return; seen[k]=1; out.push(b); }
  if(brOn()) sysList().forEach(function(x){ add(x.b); });
  S.products.forEach(function(p){ if(p.on!==false&&prodUsers(p).length) add(p.brand); });
  S.lines.forEach(function(l){ if(!l.off) add(l.br); });
  return out;
}
function iwBest(b){ return iwWdLogos(iwBase(b)).then(function(l){ return l.filter(function(x){ return x.exact&&x.co; })[0]||null; }); }
function iwRefresh(){ [renderVc,renderProducts,renderTrust,renderDoc,iwRenderMem,ckRender,maRender].forEach(function(fn){ try{ fn(); }catch(e){} }); }
// automatico: le marche nuove trovano il loro logo da sole, una volta sola, poi valgono per sempre
function iwSoon(){ if(!IW||iwMode()!=='auto') return; clearTimeout(IW.t); IW.t=setTimeout(iwScan,2000); }
function iwScan(){
  if(!IW||IW.run||!iwNet()||iwMode()!=='auto'||!dbReady) return;
  var todo=iwBrands().filter(function(b){ return !brandLogo(b)&&!iwTried(b); }).slice(0,4); if(!todo.length) return;
  IW.run=true; var found=[];
  (function next(){
    var b=todo.shift();
    if(b==null){ IW.run=false; if(found.length){ iwRefresh(); toast(found.length===1?'Logo «'+found[0]+'» trovato da solo e salvato: lo uso in tutti i preventivi':'Loghi trovati da soli: '+found.join(', ')+'. Li uso in tutti i preventivi'); } return; }
    iwMark(b);
    iwBest(b).then(function(c){
      if(!c){ next(); return; }
      iwBlobOf(c).then(function(bl){ iwLogoData(bl,function(d){ if(d){ iwSaveLogo(b,d,c.src,c.site); found.push(b); } next(); }); },function(){ next(); });
    },function(){ next(); });
  })();
}

/* ---------- finestra «Trova» ---------- */
function iwOpen(pk){
  IW.pk=pk; IW.secs=[];
  $('iw-h').textContent=pk.kind==='logo'?'Trova il logo':'Trova le foto';
  $('iw-for').innerHTML=pk.label||''; $('iw-q').value=pk.q||''; $('iw-url').value='';
  $('iw-bg').hidden=false; document.body.style.overflow='hidden';
  iwSearch(); var tc=false; try{ tc=window.matchMedia('(pointer:coarse)').matches; }catch(e){} if(!tc) setTimeout(function(){ try{ $('iw-q').focus({preventScroll:true}); }catch(e){} },60);
}
function iwClose(){ $('iw-bg').hidden=true; if($('iwf-bg').hidden) document.body.style.overflow=''; var pk=IW.pk; IW.pk=null; IW.seq++; if(pk&&pk.after) pk.after(); }
function iwSite(b){ var k=iwK(iwBase(b)), ma=maTrova(iwBase(b)), r=(ma&&ma.sito)||IW_SITI[k]||''; (DB.logos||[]).forEach(function(x){ if(!r&&iwK(x.name)===k&&x.site) r=String(x.site); }); return r.replace(/^https?:\/\/(www\.)?/,'').replace(/\/.*$/,''); }
function iwLinks(){
  var pk=IW.pk; if(!pk) return; var q=$('iw-q').value.trim(), s=iwSite(pk.brand||q);
  $('iw-gimg').href='https://www.google.com/search?tbm=isch&q='+encodeURIComponent(q+(pk.kind==='logo'?' logo':''));
  $('iw-site').hidden=!s; if(s) $('iw-site').href='https://www.google.com/search?tbm=isch&q='+encodeURIComponent((pk.kind==='logo'?iwBase(q)+' logo':q)+' site:'+s);
}
function iwSearch(){
  var pk=IW.pk; if(!pk) return; var q=$('iw-q').value.trim(), my=++IW.seq; iwLinks();
  IW.secs=[{t:pk.kind==='logo'?'Già tuoi':'Dalla tua libreria',items:iwMine(q,pk.kind,pk.self),st:'ok',mine:true}];
  if(q&&!iwNet()) IW.secs.push({t:'Internet',items:[],st:'off'});
  else if(q){
    var jobs=pk.kind==='logo'?[{t:'Logo ufficiale · Wikidata',f:function(){ return iwWdLogos(iwBase(q)); }},{t:'Altri loghi · Wikimedia Commons',f:function(){ return iwCmSearch(iwBase(q),true); }}]
      :[{t:'Wikimedia Commons · licenza libera',f:function(){ return iwCmSearch(q,false); }},{t:'Openverse · licenza libera',f:function(){ return iwOv(q); }}];
    jobs.forEach(function(j){ var sec={t:j.t,items:[],st:'run'}; IW.secs.push(sec);
      j.f().then(function(l){ if(my!==IW.seq) return; sec.items=l.slice(0,12); sec.st='ok'; iwRenderRes(); },function(){ if(my!==IW.seq) return; sec.st='err'; iwRenderRes(); }); });
  }
  iwRenderRes();
}
function iwCand(c,key,cls){
  return '<button type="button" class="iw-c'+(c.done?' ok':'')+(c.exact&&c.co?' best':'')+(cls||'')+'" '+key+' title="'+esc((c.title||'')+(c.sub?' · '+c.sub:''))+'"><span class="iw-im"><img src="'+esc(c.thumb)+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.parentNode.classList.add(\'bad\')"></span>'+
    '<span class="iw-t">'+esc(c.title||'Immagine')+'</span><small>'+esc(c.mine?c.src:[c.lic,c.by].filter(Boolean).join(' · ')||c.src)+'</small>'+(c.exact&&c.co?'<em>consigliato</em>':'')+'</button>';
}
function iwSk(n){ var s=''; for(var i=0;i<n;i++) s+='<span class="iw-c sk"><span class="iw-im"></span></span>'; return s; }
function iwRenderRes(){
  var el=$('iw-res'); if(!el) return; var pk=IW.pk;
  el.innerHTML=IW.secs.map(function(s,si){
    if(s.mine&&!s.items.length) return '';
    var body;
    if(s.st==='run') body='<div class="iw-grid">'+iwSk(4)+'</div>';
    else if(s.st==='off') body='<p class="hint">'+(navigator.onLine===false?'Sei senza internet: scegli dalla tua libreria, incolla una foto copiata o prendila dal dispositivo.':'La ricerca su internet è spenta («Personalizza app» › Foto dei prodotti).')+'</p>';
    else if(s.st==='err') body='<p class="hint">Questa fonte non risponde adesso. Riprova tra poco o usa «Cerca su Google Immagini».</p>';
    else if(!s.items.length) body='<p class="hint">Niente qui'+(pk&&pk.kind==='logo'?': prova a scrivere il nome dell\'azienda per intero.':': prova con meno parole (es. solo marca e modello).')+'</p>';
    else body='<div class="iw-grid">'+s.items.map(function(c,ci){ c.mine=!!s.mine; return iwCand(c,'data-iwc="'+si+':'+ci+'"'); }).join('')+'</div>';
    return '<div class="iw-sec"><div class="iw-st">'+esc(s.t)+'</div>'+body+'</div>';
  }).join('');
}
function iwPickC(c,btn){
  var pk=IW.pk; if(!pk||IW.busy) return; IW.busy=true; if(btn) btn.classList.add('run');
  function end(ok){ IW.busy=false; if(btn){ btn.classList.remove('run'); if(ok) btn.classList.add('ok'); } if(ok) c.done=true; }
  iwBlobOf(c).then(function(bl){ iwUse(bl,c,end); },function(){ end(false); toast('Non riesco a scaricare questa immagine: scegline un\'altra, oppure copiala e premi «Incolla»'); });
}
function iwUse(bl,c,cb){
  var pk=IW.pk; if(!pk){ cb(false); return; }
  if(pk.kind==='logo') iwLogoData(bl,function(d){ if(!d){ toast('Immagine non valida'); cb(false); return; } pk.apply(d,c); cb(true); iwClose(); });
  else pk.apply(bl,c,function(ok){ cb(ok); });
}
function iwFromUrl(u){
  u=String(u||'').trim(); if(!u) return;
  if(!/^https?:\/\//i.test(u)){ toast('Incolla un link che inizia con http, oppure la foto stessa'); return; }
  toast('Scarico l\'immagine…');
  iwBlobOf({full:u}).then(function(bl){ iwUse(bl,{src:'Dal web',lic:''},function(ok){ if(ok) toast('Fatto'); }); },function(){ toast('Quel link non è una foto: tieni premuto sulla foto e scegli «Copia immagine» o «Copia indirizzo immagine»'); });
}
function iwFromClip(){
  var cl=navigator.clipboard;
  if(!cl){ toast('Incolla con Ctrl+V (o tieni premuto) nel riquadro qui sotto'); $('iw-url').focus(); return; }
  var viaTesto=function(){ if(!cl.readText){ toast('Incolla nel riquadro qui sotto'); $('iw-url').focus(); return; } cl.readText().then(function(t){ if(/^https?:\/\//i.test(String(t).trim())) iwFromUrl(t); else { toast('Negli appunti non c\'è una foto: copiala prima (tieni premuto › Copia immagine)'); } },function(){ toast('Permesso negato: incolla nel riquadro qui sotto'); $('iw-url').focus(); }); };
  if(!cl.read){ viaTesto(); return; }
  cl.read().then(function(items){
    var it=null, ty=''; (items||[]).forEach(function(x){ if(it) return; (x.types||[]).forEach(function(t){ if(!it&&/^image\//.test(t)){ it=x; ty=t; } }); });
    if(!it){ viaTesto(); return; }
    it.getType(ty).then(function(bl){ iwUse(bl,{src:'Incollata',lic:''},function(ok){ if(ok) toast('Foto incollata'); }); });
  },function(){ viaTesto(); });
}
(function(){
  if(!$('iw-bg')) return;
  $('iw-x').addEventListener('click',iwClose);
  $('iw-bg').addEventListener('click',function(e){ if(e.target===$('iw-bg')) iwClose(); });
  $('iw-go').addEventListener('click',iwSearch);
  $('iw-q').addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); iwSearch(); } });
  $('iw-res').addEventListener('click',function(e){ var b=e.target.closest('[data-iwc]'); if(!b) return; var a=b.getAttribute('data-iwc').split(':'), s=IW.secs[+a[0]], c=s&&s.items[+a[1]]; if(c) iwPickC(c,b); });
  $('iw-clip').addEventListener('click',iwFromClip);
  $('iw-file').addEventListener('change',function(e){ var f=e.target.files&&e.target.files[0]; e.target.value=''; if(f) iwUse(f,{src:'Dal dispositivo',lic:''},function(){}); });
  $('iw-url').addEventListener('paste',function(e){ var fl=e.clipboardData&&e.clipboardData.files; if(fl&&fl.length&&/^image\//.test(fl[0].type)){ e.preventDefault(); iwUse(fl[0],{src:'Incollata',lic:''},function(ok){ if(ok) toast('Foto incollata'); }); } });
  $('iw-url').addEventListener('change',function(e){ var v=e.target.value; e.target.value=''; iwFromUrl(v); });
  document.addEventListener('keydown',function(e){ if(e.key!=='Escape') return; if(!$('iw-bg').hidden) iwClose(); else if(!$('iwf-bg').hidden) iwFillClose(); });
})();

/* ---------- i punti del programma dove servono loghi e foto ---------- */
function iwProdQ(p){ return [iwVero(p.brand)?p.brand:'',String(p.name||'').split(/\s+/).slice(0,6).join(' '),iwVero(p.code)&&String(p.name||'').indexOf(p.code)<0?p.code:''].filter(function(x){ return String(x||'').trim(); }).join(' ').replace(/\s+/g,' ').trim(); }
function iwCredit(c){ if(!c||c.mine||iwFree(c.lic)||!c.lic) return ''; return (c.by?c.by+' · ':'')+c.lic+(c.src?' ('+c.src.replace(/ · .*/,'')+')':''); }
function iwAddPhoto(p,blob,c,cb){
  if(!p.photos) p.photos=[]; if(!p.po) p.po=[];
  if(p.photos.length>=MAXPH){ toast('Massimo '+MAXPH+' foto per prodotto'); cb(false); return; }
  addPhotos(p.photos,MAXPH,[blob],function(){
    var j=p.photos.length-1, cr=iwCredit(c);
    if(cr){ if(!p.cr) p.cr={}; p.cr[iwH(p.photos[j])]=cr; if(p.po[j]) p.cr[iwH(p.po[j])]=cr; }
    openP[p.id]=true; iwRemember(p); renderProducts(); touch(); cb(true);
    toast('Foto aggiunta a «'+(p.name||'prodotto')+'» e ricordata per i prossimi preventivi');
  },p.po,p.bg);
}
// la foto scelta resta in libreria: la prossima volta la scheda con lo stesso nome la prende da sola
function iwRemember(p){
  if(!p||!String(p.name||'').trim()) return;
  var ex=DB.prods.filter(function(x){ return lc(x.name)===lc(p.name)&&lc(x.code)===lc(p.code); })[0];
  if(ex){ ex.photos=(p.photos||[]).slice(0,MAXPH); ex.po=(p.po||[]).slice(0,MAXPH); if(p.cr) ex.cr=p.cr; if(!ex.brand&&p.brand) ex.brand=p.brand; }
  else { var c=copy(p); delete c.on; delete c.sys; delete c.sol; c.id=uid(); DB.prods.push(c); DB.prods.sort(byName); }
  dbSave(); try{ renderArchivio(); }catch(e){}
}
function prodCred(p,ph){
  if(!p.cr||!ph.length) return ''; var out=[];
  ph.forEach(function(u,j){ var c=p.cr[iwH(u)]||(p.po&&p.po[j]?p.cr[iwH(p.po[j])]:''); if(c&&out.indexOf(c)<0) out.push(c); });
  return out.length?'<div class="pcred">Foto: '+esc(out.join(' · '))+'</div>':'';
}
function iwProd(i,act){
  var p=S.products[i]; if(!p) return;
  if(act==='iwlg'){ iwBrandLogo(p.brand,function(){ renderProducts(); }); return; }
  iwOpen({kind:'foto',q:iwProdQ(p),brand:p.brand,self:p,label:'Per la scheda <b>'+esc(p.name||'prodotto')+'</b>. Tocca una o più immagini: vengono aggiunte alla scheda.',
    apply:function(bl,c,cb){ iwAddPhoto(p,bl,c,cb); }});
}
function iwBrandLogo(brand,after){
  var b=iwBase(brand); if(!String(b||'').trim()){ toast('Scrivi prima la marca'); return; }
  iwOpen({kind:'logo',q:b,brand:b,label:'Logo di <b>'+esc(b)+'</b>: lo ricordo e lo uso in tutti i preventivi.',
    apply:function(d,c){ iwSaveLogo(b,d,c.src||'',c.site||''); iwRefresh(); toast('Logo «'+b+'» salvato: vale per tutti i preventivi'); if(after) after(); }});
}
function iwSysLogo(i){
  var x=sysList()[i]; if(!x) return; var b=String(x.b||'').trim();
  iwOpen({kind:'logo',q:iwBase(b||sysName(x,i)),brand:b,label:'Logo di <b>'+esc(sysName(x,i))+'</b>'+(b?': lo ricordo per tutti i preventivi con la marca '+esc(iwBase(b))+'.':'.'),
    apply:function(d,c){ if(b){ delete x.logo; iwSaveLogo(iwBase(b),d,c.src||'',c.site||''); } else x.logo=d; sysTiers(); renderSys(); renderBrPanel(); renderProducts(); renderTiers(); renderEcon(); touch(); toast('Logo impostato per «'+sysName(x,i)+'»'); }});
}
function iwSolLogo(k){
  var t=vcSolTitle(k);
  iwOpen({kind:'logo',q:iwBase(vcSolData(k).n||'')||'',brand:iwBase(vcSolData(k).n||''),label:'Logo della soluzione <b>'+esc(t)+'</b>. Scrivi qui sopra la marca da cercare.',
    apply:function(d){ vcSolData(k).logo=d; vcSolSync(); renderTiers(); renderLines(); renderEcon(); renderProducts(); renderVc(); touch(); toast('Logo impostato per «'+t+'»'); }});
}
// «Marchi che installiamo»: scrivi i nomi, i loghi arrivano da soli
function iwTrustAdd(gi,names){
  var g=S.trust.bgroups[gi]; if(!g) return;
  var L=String(names||'').split(/[,;\n]+/).map(function(s){ return s.trim(); }).filter(Boolean); if(!L.length){ toast('Scrivi una o più marche separate da virgola'); return; }
  var have=function(n){ return g.items.some(function(it){ return iwK(it.name)===iwK(n); }); };
  var ok=[], miss=[], left=L.length;
  function done(){ if(--left>0) return; renderTrust(); touch(); iwRenderMem();
    if(miss.length===1&&!ok.length){ iwOpen({kind:'logo',q:miss[0],brand:miss[0],label:'Logo di <b>'+esc(miss[0])+'</b> per «'+esc(g.t||'Marchi')+'».',apply:function(d,c){ g.items.push({name:miss[0],img:d}); iwSaveLogo(miss[0],d,c.src||'',c.site||''); renderTrust(); touch(); }}); return; }
    toast((ok.length?'Aggiunti: '+ok.join(', '):'Nessun logo aggiunto')+(miss.length?' · non trovati: '+miss.join(', ')+' (usa «Trova» o carica il file)':'')); }
  L.forEach(function(n){
    if(have(n)){ ok.push(n); done(); return; }
    var m=iwMem(n); if(m){ g.items.push({name:n,img:m}); ok.push(n); done(); return; }
    if(!iwNet()||g.items.length>=10){ miss.push(n); done(); return; }
    iwBest(n).then(function(c){ if(!c){ miss.push(n); done(); return; }
      iwBlobOf(c).then(function(bl){ iwLogoData(bl,function(d){ if(d&&g.items.length<10){ g.items.push({name:n,img:d}); iwSaveLogo(n,d,c.src,c.site); ok.push(n); } else miss.push(n); done(); }); },function(){ miss.push(n); done(); });
    },function(){ miss.push(n); done(); });
  });
}
(function(){
  var tb=$('tr-brand'); if(!tb) return;
  tb.addEventListener('click',function(e){ var b=e.target.closest('[data-bgw]'); if(!b) return; var gi=+b.getAttribute('data-bgw'), inp=tb.querySelector('[data-bgn="'+gi+'"]'); var v=inp?inp.value:''; if(inp) inp.value=''; iwTrustAdd(gi,v); });
  tb.addEventListener('keydown',function(e){ var t=e.target; if(e.key!=='Enter'||!t.getAttribute||t.getAttribute('data-bgn')==null) return; e.preventDefault(); var v=t.value; t.value=''; iwTrustAdd(+t.getAttribute('data-bgn'),v); });
})();

/* ---------- elenco dei loghi delle marche (Prodotti) ---------- */
function iwRenderMem(){
  var el=$('iw-mem'); if(!el) return; var L=DB.logos||[];
  $('iw-mem-n').textContent=L.length?'· '+L.length:'';
  el.innerHTML=L.map(function(x){ return '<div class="iw-m"><span class="iw-mi"><img src="'+x.img+'" alt=""></span><span class="iw-mn"><b>'+esc(x.name)+'</b><small>'+esc(x.src||'Caricato da te')+'</small></span>'+
    '<button type="button" class="btn ghost sm" data-iwmc="'+esc(x.id)+'">Cambia</button><label class="btn ghost sm">Carica<input type="file" accept="image/*" hidden data-iwmf="'+esc(x.id)+'"></label><button type="button" class="btn x" data-iwmx="'+esc(x.id)+'" aria-label="Elimina il logo">×</button></div>'; }).join('')||'<div class="empty">Ancora nessun logo: scrivi le marche qui sotto, oppure lascia fare al programma quando le usi in un preventivo.</div>';
}
function iwMemById(id){ return (DB.logos||[]).filter(function(x){ return x.id===id; })[0]; }
(function(){
  var el=$('iw-mem'); if(!el) return;
  el.addEventListener('click',function(e){
    var c=e.target.closest('[data-iwmc]'), x=e.target.closest('[data-iwmx]');
    if(c){ var m=iwMemById(c.getAttribute('data-iwmc')); if(m) iwBrandLogo(m.name); return; }
    if(x){ var m2=iwMemById(x.getAttribute('data-iwmx')); if(!m2) return; DB.logos=DB.logos.filter(function(y){ return y!==m2; }); DB.del[m2.id]=Date.now(); iwMark(m2.name); dbSave(); iwRefresh(); toast('Logo «'+m2.name+'» eliminato'); }
  });
  el.addEventListener('change',function(e){ var t=e.target, id=t.getAttribute('data-iwmf'); if(!id) return; var f=t.files&&t.files[0]; t.value=''; var m=iwMemById(id); if(!f||!m) return; iwLogoData(f,function(d){ if(!d) return; iwSaveLogo(m.name,d,'Caricato da te'); iwRefresh(); toast('Logo «'+m.name+'» aggiornato'); }); });
  function go(){ var v=$('iw-mem-in').value; var L=v.split(/[,;\n]+/).map(function(s){ return s.trim(); }).filter(Boolean); if(!L.length){ toast('Scrivi una o più marche separate da virgola'); return; } $('iw-mem-in').value='';
    if(!iwNet()){ toast('Senza internet non posso cercare: carica i loghi dal dispositivo'); return; }
    toast('Cerco '+L.length+(L.length===1?' logo…':' loghi…')); var ok=[], miss=[], left=L.length;
    function fin(){ if(--left>0) return; iwRefresh(); if(miss.length===1&&!ok.length){ iwBrandLogo(miss[0]); return; } toast((ok.length?'Trovati: '+ok.join(', '):'Nessun logo trovato')+(miss.length?' · da cercare a mano: '+miss.join(', '):'')); }
    L.forEach(function(n){ iwBest(n).then(function(c){ if(!c){ miss.push(n); fin(); return; } iwBlobOf(c).then(function(bl){ iwLogoData(bl,function(d){ if(d){ iwSaveLogo(n,d,c.src,c.site); ok.push(n); } else miss.push(n); fin(); }); },function(){ miss.push(n); fin(); }); },function(){ miss.push(n); fin(); }); });
  }
  $('iw-mem-go').addEventListener('click',go);
  $('iw-mem-in').addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); go(); } });
})();

/* ---------- «Trova foto e loghi mancanti»: tutto il preventivo in una schermata, un tocco per riga ---------- */
function iwFill(){
  var rows=[];
  iwBrands().forEach(function(b){ if(!brandLogo(b)) rows.push({kind:'logo',b:b,label:b,st:'run',items:[]}); });
  var perNome={};
  S.products.forEach(function(p){ if(p.on===false||(p.photos&&p.photos.length)) return; var k=lc(p.name)+'|'+lc(p.code);
    if(perNome[k]){ perNome[k].pids.push(p.id); return; } var r={kind:'foto',pid:p.id,pids:[p.id],label:p.name||'Prodotto',q:iwProdQ(p),st:'idle',items:[]}; perNome[k]=r; rows.push(r); });
  if(!rows.length){ toast('Tutto a posto: ogni scheda ha la sua foto e ogni marca il suo logo'); return; }
  IW.fill={rows:rows,seq:++IW.seq,q:[],act:0};
  $('iwf-bg').hidden=false; document.body.style.overflow='hidden'; iwFillRender();
  // le righe si caricano quando arrivano sullo schermo: niente decine di ricerche inutili
  var my=IW.fill;
  rows.forEach(function(r,i){ if(r.kind==='logo'||i<6) iwFillLoad(r); });
  iwFillWatch();
}
function iwFillWatch(){
  var F=IW.fill; if(!F) return;
  if(!('IntersectionObserver' in window)){ F.rows.forEach(iwFillLoad); return; }
  if(F.io) F.io.disconnect();
  F.io=new IntersectionObserver(function(en){ en.forEach(function(e){ if(!e.isIntersecting) return; var r=F.rows[+e.target.getAttribute('data-iwr')]; if(r) iwFillLoad(r); }); },{root:$('iwf-bg').querySelector('.sheet'),rootMargin:'200px'});
  Array.prototype.forEach.call(document.querySelectorAll('#iwf-rows [data-iwr]'),function(el){ F.io.observe(el); });
}
function iwFillLoad(r){
  var F=IW.fill; if(!F||r.st!=='idle'&&r.st!=='run'||r.q0) return; r.q0=1; r.st='run'; F.q.push(r); iwFillWork();
}
function iwFillWork(){
  var my=IW.fill; if(!my||my.act>=2) return; var r=my.q.shift(); if(!r) return; my.act++;
  function work(){ my.act--; iwFillWork(); }
  (function(){
    var mine=iwMine(r.kind==='logo'?r.b:r.q,r.kind,r.pid?prodById(r.pid):null);
    if(!iwNet()){ r.items=mine.slice(0,6); r.st=mine.length?'ok':'off'; iwFillRender(); work(); return; }
    var P=r.kind==='logo'?[iwWdLogos(r.b),iwCmSearch(r.b,true)]:[iwCmSearch(r.q,false),iwOv(r.q)];
    var res=[[],[]], n=P.length;
    P.forEach(function(pr,k){ pr.then(function(l){ res[k]=l; },function(){}).then(function(){ if(--n) return;
      var mix=[]; for(var i=0;i<6;i++){ if(res[0][i]) mix.push(res[0][i]); if(res[1][i]) mix.push(res[1][i]); }
      r.items=mine.slice(0,3).concat(mix).slice(0,8); r.st=r.items.length?'ok':'none'; if(IW.fill===my){ iwFillRender(); work(); } }); });
  })();
}
function iwFillRender(){
  var F=IW.fill, el=$('iwf-rows'); if(!F||!el) return;
  var nd=F.rows.filter(function(r){ return r.done; }).length;
  $('iwf-n').textContent=nd+' di '+F.rows.length+' sistemati';
  if(F.io){ F.io.disconnect(); F.io=null; setTimeout(iwFillWatch,0); }
  el.innerHTML=F.rows.map(function(r,ri){
    var g=(r.st==='run'||r.st==='idle')?iwSk(4):r.st==='off'?'<p class="hint">Senza internet: niente nella tua libreria. Usa «Altre…» per incollare o caricare.</p>':r.st==='none'?'<p class="hint">Nessuna immagine trovata in automatico: tocca «Altre…».</p>':r.items.map(function(c,ci){ c.mine=!!c.data; return iwCand(c,'data-iwfc="'+ri+':'+ci+'"'); }).join('');
    return '<div class="iwf-r'+(r.done?' done':'')+'" data-iwr="'+ri+'"><div class="iwf-h"><span class="iwf-k">'+(r.kind==='logo'?'Logo della marca':'Foto del prodotto')+'</span><b>'+esc(r.label)+'</b>'+(r.done?'<span class="iwf-ok">✓ fatto</span>':'')+'<button type="button" class="btn ghost sm" data-iwfm="'+ri+'">Altre…</button></div><div class="iw-grid">'+g+'</div></div>';
  }).join('');
}
function iwAddAll(pids,bl,c,cb){
  var L=pids.map(prodById).filter(Boolean); if(!L.length){ cb(false); return; }
  var k=0, any=false; (function nx(){ var p=L[k++]; if(!p){ cb(any); return; } iwAddPhoto(p,bl,c,function(ok){ any=any||ok; nx(); }); })();
}
function iwFillClose(){ $('iwf-bg').hidden=true; if($('iw-bg').hidden) document.body.style.overflow=''; if(IW.fill&&IW.fill.io) IW.fill.io.disconnect(); IW.fill=null; IW.seq++; renderProducts(); try{ ckRender(); }catch(e){} }
function iwFillApply(r,c,btn){
  if(IW.busy) return; IW.busy=true; if(btn) btn.classList.add('run');
  function end(ok){ IW.busy=false; if(btn){ btn.classList.remove('run'); if(ok) btn.classList.add('ok'); } if(ok){ r.done=true; iwFillRender(); } }
  iwBlobOf(c).then(function(bl){
    if(r.kind==='logo') iwLogoData(bl,function(d){ if(!d){ end(false); return; } iwSaveLogo(r.b,d,c.src||'',c.site||''); iwRefresh(); end(true); });
    else iwAddAll(r.pids||[r.pid],bl,c,end);
  },function(){ end(false); toast('Non riesco a scaricare questa immagine: scegline un\'altra'); });
}
(function(){
  if(!$('iwf-bg')) return;
  $('iw-fill').addEventListener('click',iwFill);
  $('iwf-x').addEventListener('click',iwFillClose); $('iwf-ok').addEventListener('click',iwFillClose);
  $('iwf-bg').addEventListener('click',function(e){ if(e.target===$('iwf-bg')) iwFillClose(); });
  $('iwf-rows').addEventListener('click',function(e){
    var F=IW.fill; if(!F) return;
    var b=e.target.closest('[data-iwfc]'); if(b){ var a=b.getAttribute('data-iwfc').split(':'), r=F.rows[+a[0]], c=r&&r.items[+a[1]]; if(c) iwFillApply(r,c,b); return; }
    var m=e.target.closest('[data-iwfm]'); if(!m) return; var r2=F.rows[+m.getAttribute('data-iwfm')]; if(!r2) return;
    var back=function(){ if(IW.fill===F) iwFillRender(); };
    if(r2.kind==='logo') iwOpen({kind:'logo',q:r2.b,brand:r2.b,label:'Logo di <b>'+esc(r2.b)+'</b>: vale per tutti i preventivi.',after:back,apply:function(d,c){ iwSaveLogo(r2.b,d,c.src||'',c.site||''); iwRefresh(); r2.done=true; }});
    else { var p=prodById(r2.pid); if(!p) return; iwOpen({kind:'foto',q:r2.q,brand:p.brand,self:p,after:back,label:'Per la scheda <b>'+esc(p.name||'prodotto')+'</b>.',apply:function(bl,c,cb){ iwAddAll(r2.pids||[r2.pid],bl,c,function(ok){ if(ok) r2.done=true; cb(ok); }); }}); }
  });
  var sel=$('ap-webimg'); if(sel){ sel.addEventListener('change',function(e){ apSet('webimg',e.target.value); if(e.target.value==='auto') iwSoon(); toast(e.target.value==='off'?'Ricerca di loghi e foto su internet spenta':e.target.value==='ask'?'Cerco loghi e foto solo quando premi «Trova»':'I loghi delle marche arrivano da soli'); }); }
})();

/* ---------- libreria marche per settore ---------- */
var MA_UI={set:'',q:'',run:false};
function maRender(){
  var el=$('ma-grid'); if(!el) return; var V=maVoci();
  $('ma-n').textContent=V.length+' marche in '+Object.keys(MA_SETTORI).length+' settori';
  $('ma-set').innerHTML='<button type="button" class="chip'+(MA_UI.set?'':' on')+'" data-mas="">Tutte</button>'+Object.keys(MA_SETTORI).map(function(k){ var n=V.filter(function(m){ return m.a.indexOf(k)>-1; }).length; return '<button type="button" class="chip'+(MA_UI.set===k?' on':'')+'" data-mas="'+k+'">'+esc(MA_SETTORI[k])+' <em>'+n+'</em></button>'; }).join('');
  var q=String(MA_UI.q||'').toLowerCase().trim();
  var L=V.filter(function(m){ return (q||!MA_UI.set||m.a.indexOf(MA_UI.set)>-1)&&(!q||(m.n+' '+m.serie.join(' ')).toLowerCase().indexOf(q)>-1); });
  var nl=L.filter(function(m){ return brandLogo(m.n); }).length;
  $('ma-all').textContent=nl<L.length?'Prendi i loghi '+(MA_UI.set?'del settore':'di questo elenco')+' ('+(L.length-nl)+')':'✓ Tutti i loghi presi'; $('ma-all').disabled=nl>=L.length||MA_UI.run;
  el.innerHTML=L.map(function(m){ var lg=brandLogo(m.n);
    return '<div class="ma-c'+(lg?' has':'')+'"><span class="iw-mi">'+(lg?'<img src="'+lg+'" alt="">':'<i>'+esc(m.n.replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase())+'</i>')+'</span><span class="ma-t"><b>'+esc(m.n)+'</b><small>'+esc(m.a.map(function(a){ return MA_SETTORI[a]; }).join(' · '))+'</small>'+(m.serie.length?'<small class="ma-s">'+esc(m.serie.join(', '))+'</small>':'')+'</span>'+
      '<span class="ma-b"><button type="button" class="btn ghost sm" data-mal="'+esc(m.n)+'">'+(lg?'Cambia':'Logo')+'</button>'+(m.sito?'<a class="btn ghost sm" href="https://'+esc(m.sito)+'" target="_blank" rel="noopener">Sito</a>':'')+'</span></div>'; }).join('')||'<div class="empty">Nessuna marca trovata: aggiungila in «Loghi delle marche» qui sotto.</div>';
}
function maLogo(n){
  if(brandLogo(n)){ iwBrandLogo(n,maRender); return; }
  if(!iwNet()){ iwBrandLogo(n,maRender); return; }
  toast('Cerco il logo di '+n+'…');
  iwBest(n).then(function(c){ if(!c){ iwBrandLogo(n,maRender); return; }
    iwBlobOf(c).then(function(bl){ iwLogoData(bl,function(d){ if(!d){ iwBrandLogo(n,maRender); return; } iwSaveLogo(n,d,c.src,c.site); iwRefresh(); maRender(); toast('Logo «'+n+'» trovato e salvato'); }); },function(){ iwBrandLogo(n,maRender); });
  },function(){ iwBrandLogo(n,maRender); });
}
function maTutti(){
  if(MA_UI.run) return; if(!iwNet()){ toast('Serve internet per cercare i loghi'); return; }
  var q=String(MA_UI.q||'').toLowerCase().trim(), L=maVoci().filter(function(m){ return (q||!MA_UI.set||m.a.indexOf(MA_UI.set)>-1)&&(!q||(m.n+' '+m.serie.join(' ')).toLowerCase().indexOf(q)>-1)&&!brandLogo(m.n); }).map(function(m){ return m.n; });
  if(!L.length) return; MA_UI.run=true; var ok=[], no=[], tot=L.length, act=0;
  function fine(){ MA_UI.run=false; iwRefresh(); maRender(); toast('Loghi trovati: '+ok.length+' su '+tot+(no.length?'. Senza logo ufficiale: '+no.slice(0,6).join(', ')+(no.length>6?'…':'')+' (tocca «Logo» per sceglierlo tu)':'')); }
  function next(){
    if(!L.length){ if(act===0) fine(); return; }
    var n=L.shift(); act++; $('ma-all').textContent='Cerco… '+(tot-L.length)+'/'+tot;
    var done=function(){ act--; next(); };
    iwBest(n).then(function(c){ if(!c){ no.push(n); done(); return; } iwBlobOf(c).then(function(bl){ iwLogoData(bl,function(d){ if(d){ iwSaveLogo(n,d,c.src,c.site); ok.push(n); } else no.push(n); done(); }); },function(){ no.push(n); done(); }); },function(){ no.push(n); done(); });
  }
  next(); next(); next();
}
(function(){
  var g=$('ma-grid'); if(!g) return;
  $('ma-d').addEventListener('toggle',function(){ if($('ma-d').open) maRender(); });
  $('ma-set').addEventListener('click',function(e){ var b=e.target.closest('[data-mas]'); if(!b) return; MA_UI.set=b.getAttribute('data-mas'); maRender(); });
  $('ma-q').addEventListener('input',function(e){ MA_UI.q=e.target.value; maRender(); });
  $('ma-all').addEventListener('click',maTutti);
  g.addEventListener('click',function(e){ var b=e.target.closest('[data-mal]'); if(b) maLogo(b.getAttribute('data-mal')); });
  setTimeout(function(){ try{ $('ma-n').textContent=maVoci().length+' marche in '+Object.keys(MA_SETTORI).length+' settori'; }catch(e){} },0);
})();
