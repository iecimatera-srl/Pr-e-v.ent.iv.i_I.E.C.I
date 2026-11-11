/* ===== Menu e funzioni più intuitivi =====
   - ogni sezione dice in una riga cosa contiene (nel menu e sotto il titolo della pagina)
   - «Cerca una funzione»: scrivi IVA, PIN, logo, firma… e ti porto proprio lì, riquadro aperto e casella evidenziata
   - sul telefono: menu che sale dal basso e barra fissa in basso con le 4 sezioni di tutti i giorni
   - testi di aiuto lunghi ridotti a due righe con «Leggi tutto» */
function secDesc(p){
  var D={home:'Cosa c\'è da fare e come va',prev:'Voci, prezzi, totale e invio',dati:'Cliente, numero, date e stato',invio:'Controllo finale, WhatsApp ed email',archivio:'Tutti i preventivi e i clienti',
    prodotti:'Schede, foto e loghi dei prodotti',contenuto:'Cosa mostrare nel fascicolo',pagine:'Quali pagine e in che ordine',piante:'Planimetria con i punti',
    stime:'Risparmi, consumi e tempi',fiducia:'La pagina che rassicura il cliente',cond:'Pagamento, note e firma',documenti:'Allegati e certificazioni',
    listini:'Le tue voci e i tuoi prezzi',fornitori:'Offerte e articoli dei fornitori',messaggi:'Testi per WhatsApp ed email',azienda:'Dati e presentazione della ditta',
    stile:'Logo, colori e caratteri del fascicolo',salva:'Copie, GitHub e aggiornamenti',app:'Aspetto, PIN, foto e intestazione',menu:'Nomi e ordine del menu'};
  return D[p]||'';
}
var NAVX={bar:null,ix:null,ixT:0,res:[]};
function navDopo(){
  if(typeof NAVX==='undefined'||!NAVX) return;
  bnavSync(); panelSub(); hintLunghe();
}
/* ---- sottotitolo della pagina: a cosa serve ---- */
function panelSub(){
  if(typeof panel==='undefined'||panel==='prev') return;
  var sec=document.querySelector('[data-panel="'+panel+'"]'), h=sec&&sec.querySelector('h2'); if(!h) return;
  var d=secDesc(panel), nx=h.nextElementSibling;
  if(nx&&nx.classList.contains('psub')){ if(nx.textContent!==d) nx.textContent=d; return; }
  if(!d) return; var p=document.createElement('p'); p.className='psub'; p.textContent=d; h.parentNode.insertBefore(p,h.nextSibling);
}
/* ---- testi lunghi: due righe e «Leggi tutto» ---- */
function hintLunghe(){
  if(typeof panel==='undefined') return;
  var sec=document.querySelector('[data-panel="'+panel+'"]'); if(!sec) return;
  Array.prototype.forEach.call(sec.querySelectorAll('p.hint:not([id]):not(.hl-ok)'),function(h){
    h.classList.add('hl-ok');
    if(h.querySelector('input,select,textarea,button')||(h.textContent||'').trim().length<160) return;
    h.classList.add('lunga');
    var b=document.createElement('button'); b.type='button'; b.className='hl-more'; b.textContent='Leggi tutto'; b.setAttribute('aria-expanded','false');
    b.addEventListener('click',function(){ var o=h.classList.toggle('aperta'); b.textContent=o?'Meno':'Leggi tutto'; b.setAttribute('aria-expanded',String(o)); });
    h.parentNode.insertBefore(b,h.nextSibling);
  });
}
/* ---- barra in basso (telefono) ---- */
function bnavItems(){ var on={}; MENU.items.forEach(function(i){ if(i.on) on[i.p]=1; }); return ['home','prev','dati','invio'].filter(function(p){ return on[p]; }); }
function bnavSync(){
  var lab={home:'Oggi',prev:'Preventivo',dati:'Cliente',invio:'Invio',archivio:'Archivio'};
  if(!NAVX.bar){
    var n=document.createElement('nav'); n.className='bnav noprint'; n.id='bnav'; n.setAttribute('aria-label','Sezioni principali'); document.body.appendChild(n); NAVX.bar=n;
    n.addEventListener('click',function(e){
      var b=e.target.closest('button'); if(!b) return; e.stopPropagation();
      if(b.hasAttribute('data-bm')){ mnOpen=!mnOpen; renderNav(); if(mnOpen) menuAperto(); return; }
      var p=b.getAttribute('data-bp'); if(p===panel&&!mnOpen){ window.scrollTo({top:0,behavior:'smooth'}); return; }
      showPanel(p); window.scrollTo(0,0);
    });
  }
  var its=bnavItems(), key=its.join()+'|'+panel+'|'+mnOpen+'|'+its.map(function(p){ return secLabel(p); }).join();
  if(NAVX.bar.getAttribute('data-k')===key) return; NAVX.bar.setAttribute('data-k',key); NAVX.bar.style.setProperty('--bn',String(its.length+1));
  NAVX.bar.innerHTML=its.map(function(p){ var nm=MENU.names&&MENU.names[p]?secLabel(p):lab[p]; return '<button type="button" data-bp="'+p+'"'+(p===panel&&!mnOpen?' aria-current="page"':'')+'>'+navIc(p)+'<span>'+esc(nm)+'</span></button>'; }).join('')+
    '<button type="button" data-bm aria-expanded="'+mnOpen+'"'+(mnOpen?' aria-current="page"':'')+'>'+navIc('menu')+'<span>Menu</span></button>';
}
function menuAperto(){
  // sul computer il cursore va subito nella ricerca; sul telefono no (aprirebbe la tastiera)
  try{ if(window.matchMedia('(pointer:fine)').matches){ var q=$('mn-q'); if(q) q.focus({preventScroll:true}); } }catch(e){}
  var cur=document.querySelector('#mn-drop .mit[aria-current="true"]'); if(cur&&cur.scrollIntoView) try{ cur.scrollIntoView({block:'nearest'}); }catch(e){}
}
/* ---- «Cerca una funzione» ---- */
function cNorm(t){ return String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9%€ ]+/g,' ').replace(/\s+/g,' ').trim(); }
function cTesto(el){
  var t='';
  if(el.tagName==='SUMMARY'){ var sp=el.querySelector('span')||el; Array.prototype.forEach.call(sp.childNodes,function(n){ if(n.nodeType===3) t+=n.nodeValue; }); var sb=el.querySelector('.acc-sub'); return [t.trim(),sb?sb.textContent.trim():'']; }
  if(el.tagName==='LABEL'){ Array.prototype.forEach.call(el.childNodes,function(n){ if(n.nodeType===3) t+=n.nodeValue; else if(n.nodeType===1&&/^(B|SPAN|SMALL|EM)$/.test(n.tagName)) t+=' '+n.textContent; }); return [t.trim(),'']; }
  return [(el.textContent||'').trim(),''];
}
var C_SIN={iva:'aliquota',logo:'marchio',firma:'firmare accettazione',sconto:'ribasso',acconto:'anticipo',backup:'copia salvataggio',tema:'scuro chiaro colore',whatsapp:'invia messaggio',foto:'immagini',telefono:'cellulare numero',prezzo:'costo listino',stampa:'pdf',impronta:'dito'};
function cIndice(){
  var mk=menuFlat().join();
  if(NAVX.ix&&NAVX.ixK===mk&&Date.now()-NAVX.ixT<8000) return NAVX.ix;
  var ix=[], seen={}, salta='#lines,#cat,#q-list,#aq-list,#mn-list,#as-out,#as-ex,#ls-body,#plist,#art-list,#c-list,#l-list,#k-list,#doc,#content-list,#order-list,#clist,#mt-list,#ico-list,#rc-list,#sn-list,#ma-grid,#pr-list,#im-rows,#iwf-rows,.flow,#qbar';
  var vis={}; MENU.items.forEach(function(i){ if(i.on) vis[i.p]=1; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-panel]'),function(sec){
    var p=sec.getAttribute('data-panel'); if(!vis[p]) return;
    var nome=secLabel(p);
    ix.push({p:p,t:nome,d:secDesc(p),el:null,w:5,dove:'Sezione'});
    Array.prototype.forEach.call(sec.querySelectorAll('summary,h3,.apg>b,label.f,label.chk,button,.f>b'),function(el){
      if(el.closest(salta)) return;
      for(var a=el.parentElement;a&&a!==sec;a=a.parentElement) if(a.hidden) return;
      var tt=cTesto(el), t=tt[0].replace(/\s+/g,' ').replace(/[:…]+$/,'').trim(); if(t.length<3||t.length>80||/^[▲▼×+−‹›]/.test(t)) return;
      var k=p+'|'+cNorm(t); if(seen[k]) return; seen[k]=1;
      var box=el.closest('details.acc'), bs=box&&box!==el.parentElement?box.querySelector('summary'):null, ctx=bs?cTesto(bs)[0]:'';
      var w=el.tagName==='SUMMARY'||el.tagName==='H3'||el.tagName==='B'?4:el.tagName==='LABEL'?3:2.5;
      ix.push({p:p,t:t,d:tt[1],el:el,w:w,dove:nome+(ctx&&ctx!==t?' › '+ctx:'')});
    });
  });
  NAVX.ix=ix; NAVX.ixT=Date.now(); NAVX.ixK=mk; return ix;
}
function cerca(q){
  var qn=cNorm(q); if(!qn) return [];
  var w=qn.split(' '), ex=[]; w.forEach(function(x){ Object.keys(C_SIN).forEach(function(k){ if(k.indexOf(x)===0||C_SIN[k].split(' ').indexOf(x)>-1){ ex.push(k); ex=ex.concat(C_SIN[k].split(' ')); } }); });
  var out=[];
  cIndice().forEach(function(e){
    var tn=cNorm(e.t+' '+e.d), sc=0, all=true;
    w.forEach(function(x){
      var re=new RegExp('(^| )'+x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
      if(re.test(tn)) sc+=10; else if(x.length>3&&tn.indexOf(x)>-1) sc+=4; else all=false;
    });
    if(!all){ sc=0; ex.forEach(function(x){ if(x&&new RegExp('(^| )'+x).test(tn)) sc=Math.max(sc,3); }); if(!sc) return; }
    sc=sc*e.w+(cNorm(e.t).indexOf(qn)===0?15:0)-e.t.length/40;
    out.push({e:e,s:sc});
  });
  out.sort(function(a,b){ return b.s-a.s; });
  var uniq=[], vis={}; out.forEach(function(o){ var k=o.e.p+'|'+cNorm(o.e.t); if(!vis[k]&&uniq.length<8){ vis[k]=1; uniq.push(o.e); } });
  return uniq;
}
function cercaMostra(q){
  var box=$('mn-res'), gs=$('mn-gs'); if(!box) return;
  var r=cerca(q); NAVX.res=r;
  if(!String(q||'').trim()){ box.hidden=true; box.innerHTML=''; if(gs) gs.hidden=false; return; }
  if(gs) gs.hidden=true; box.hidden=false;
  box.innerHTML=r.length?r.map(function(e,i){ return '<button type="button" class="msr" data-msr="'+i+'">'+navIc(e.p)+'<span><b>'+esc(e.t)+'</b><small>'+esc(e.el?e.dove:e.d)+'</small></span><i aria-hidden="true">›</i></button>'; }).join('')
    :'<div class="mres-0">Nessuna funzione trovata per «'+esc(q)+'». Prova con un\'altra parola, per esempio «sconto», «logo» o «backup».</div>';
}
function cercaVai(i){
  var e=NAVX.res[i]; if(!e) return;
  mnOpen=false; showPanel(e.p); window.scrollTo(0,0);
  var el=e.el; if(!el) return;
  var d=el.tagName==='SUMMARY'?el.parentElement:el.closest('details'); while(d){ d.open=true; d=d.parentElement&&d.parentElement.closest('details'); }
  if(el.tagName==='SUMMARY') el.parentElement.open=true;
  setTimeout(function(){
    var t=el.tagName==='SUMMARY'?el:(el.closest('label,.apg,.row,.f')||el);
    try{ t.scrollIntoView({behavior:'smooth',block:'center'}); }catch(x){}
    t.classList.remove('trovato'); void t.offsetWidth; t.classList.add('trovato'); setTimeout(function(){ t.classList.remove('trovato'); },2200);
    var f=el.tagName==='LABEL'?el.querySelector('input:not([type=checkbox]):not([type=radio]),select,textarea'):null; if(f) try{ f.focus({preventScroll:true}); }catch(x){}
  },80);
}
$('ptabs').addEventListener('input',function(e){ if(e.target.id==='mn-q') cercaMostra(e.target.value); });
$('ptabs').addEventListener('keydown',function(e){
  if(e.target.id!=='mn-q') return;
  if(e.key==='Enter'){ e.preventDefault(); if(NAVX.res.length) cercaVai(0); }
  if(e.key==='ArrowDown'){ var f=document.querySelector('#mn-res .msr'); if(f){ e.preventDefault(); f.focus(); } }
});
// Ctrl+K (o /) apre la ricerca delle funzioni, come nei programmi per computer
document.addEventListener('keydown',function(e){
  var ae=document.activeElement, scrive=ae&&(/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)||ae.isContentEditable);
  if((e.key==='k'&&(e.ctrlKey||e.metaKey))||(e.key==='/'&&!scrive)){ if(document.documentElement.classList.contains('locked')) return; e.preventDefault(); if(!mnOpen){ mnOpen=true; renderNav(); } var q=$('mn-q'); if(q) q.focus(); }
});
(function(T){ if(!T) return; T.cerca=cerca; T.cercaVai=function(q){ cercaMostra(q); cercaVai(0); }; T.secDesc=secDesc; })(window.IECI_T);
navDopo();
