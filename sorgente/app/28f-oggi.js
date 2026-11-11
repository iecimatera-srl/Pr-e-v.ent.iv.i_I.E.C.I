/* ===== «Oggi»: il cruscotto con cui si apre l'app =====
   - saluto, cosa c'è da fare, due pulsanti grandi (nuovo preventivo · descrivi il lavoro)
   - numeri che contano: in attesa, accettati nel mese, quanti dicono sì, bozze
   - andamento degli ultimi 6 mesi (preventivati e accettati)
   - «Da seguire»: inviati senza risposta, con il sollecito su WhatsApp a un tocco e l'esito
   - ultimi preventivi, da riaprire con un tocco
   Tutto calcolato sul dispositivo dai preventivi in archivio: non parte nessun dato.
   In più: passaggi animati tra le pagine, piccola vibrazione sui comandi importanti, scorciatoie dell'icona, numero sull'icona. */
var OG={avvio:'home',anim:{},ult:''};
try{ OG.avvio=localStorage.getItem('ieci-avvio')==='prev'?'prev':'home'; }catch(e){}
function ogGiorni(t){ return Math.max(0,Math.floor((Date.now()-t)/86400000)); }
function ogQuando(g){ return g===0?'oggi':g===1?'ieri':'da '+g+' giorni'; }
function ogData(q){ var d=q.data&&q.data.meta&&q.data.meta.date; var t=d?Date.parse(d+'T12:00:00'):NaN; return isNaN(t)?(q.upd||Date.now()):t; }
function ogEurK(x){ x=num(x); return x>=10000?itNum(x/1000,0,1)+' mila €':itNum(x,0,0)+' €'; }
function ogStato(){
  var Q=(typeof DB!=='undefined'&&DB&&DB.quotes)?DB.quotes:[], now=new Date(), m0=new Date(now.getFullYear(),now.getMonth(),1).getTime();
  var o={n:Q.length,att:{n:0,v:0},accM:{n:0,v:0},boz:0,si:0,no:0,seg:[],ult:[],mesi:[]};
  for(var i=5;i>=0;i--){ var d=new Date(now.getFullYear(),now.getMonth()-i,1); o.mesi.push({k:d.getFullYear()+'-'+d.getMonth(),l:d.toLocaleDateString('it-IT',{month:'short'}).replace('.',''),fatti:0,acc:0,n:0}); }
  var mi={}; o.mesi.forEach(function(m,ix){ mi[m.k]=ix; });
  Q.forEach(function(q){
    var st=qSt(q), v=num(q.tot);
    if(st==='inviato'){ if(!q.sat) q.sat=q.upd||Date.now(); o.att.n++; o.att.v+=v; o.seg.push(q); }
    if(st==='bozza') o.boz++;
    if(st==='accettato'){ o.si++; if((q.upd||0)>=m0){ o.accM.n++; o.accM.v+=v; } }
    if(st==='rifiutato') o.no++;
    var dq=new Date(ogData(q)), k=dq.getFullYear()+'-'+dq.getMonth();
    if(mi[k]!==undefined&&st!=='bozza'){ o.mesi[mi[k]].fatti+=v; o.mesi[mi[k]].n++; if(st==='accettato') o.mesi[mi[k]].acc+=v; }
  });
  o.tasso=(o.si+o.no)?Math.round(o.si/(o.si+o.no)*100):null;
  o.seg.sort(function(a,b){ return (a.sat||0)-(b.sat||0); });
  o.daSeg=o.seg.filter(function(q){ return ogGiorni(q.fu||q.sat)>=3; }).length;
  o.ult=Q.slice().sort(function(a,b){ return (b.upd||0)-(a.upd||0); }).slice(0,5);
  return o;
}
function ogSaluto(){ var h=new Date().getHours(); return (h<13?'Buongiorno':h<18?'Buon pomeriggio':'Buonasera')+(APP.greet?' '+APP.greet:''); }
function ogIc(k){
  var P={piu:'<path d="M12 5v14M5 12h14"/>',mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',wa:'<path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 19z"/><path d="M9.5 9.2c.2 2.3 2 4.3 4.6 4.8l1.1-1.2"/>',ok:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',no:'<path d="M6 6l12 12M18 6 6 18"/>',vai:'<path d="M9 6l6 6-6 6"/>',oro:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'};
  return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+P[k]+'</svg>';
}
function ogGrafico(M){
  var mx=0; M.forEach(function(m){ mx=Math.max(mx,m.fatti); }); if(!mx) return '';
  var W=320,H=132,bw=30,gap=(W-M.length*bw)/(M.length), s='';
  M.forEach(function(m,i){
    var x=gap/2+i*(bw+gap), hf=Math.max(m.fatti?3:0,Math.round(m.fatti/mx*96)), ha=Math.max(m.acc?3:0,Math.round(m.acc/mx*96)), cur=i===M.length-1;
    s+='<g class="og-col'+(cur?' cur':'')+'" style="--i:'+i+'"><title>'+esc(m.l+': '+eur(m.fatti)+' preventivati, '+eur(m.acc)+' accettati')+'</title>'+
       '<rect class="f" x="'+x+'" y="'+(106-hf)+'" width="'+bw+'" height="'+hf+'" rx="7"/>'+
       (ha?'<rect class="a" x="'+x+'" y="'+(106-ha)+'" width="'+bw+'" height="'+ha+'" rx="7"/>':'')+
       '<text x="'+(x+bw/2)+'" y="124" text-anchor="middle">'+esc(m.l)+'</text></g>';
  });
  return '<div class="og-card og-graf"><div class="og-ct"><b>Ultimi 6 mesi</b><span class="og-leg"><i class="f"></i>preventivati <i class="a"></i>accettati</span></div><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Andamento degli ultimi sei mesi">'+s+'</svg></div>';
}
function ogAnello(p){
  var r=26,c=2*Math.PI*r,v=p==null?0:p;
  return '<svg class="og-ring" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><circle cx="32" cy="32" r="'+r+'" class="b"/><circle cx="32" cy="32" r="'+r+'" class="v" stroke-dasharray="'+c.toFixed(1)+'" style="--off:'+(c*(1-v/100)).toFixed(1)+';--c:'+c.toFixed(1)+'" transform="rotate(-90 32 32)"/></svg>';
}
function renderOggi(){
  var el=$('og'); if(!el||typeof OG==='undefined'||!OG||typeof DB==='undefined') return;
  var o=ogStato(), dt=new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});
  var apN=String(S.client.name||'').trim(), apL=S.lines.length, demo=false; try{ demo=Object.keys(libDemo()).length>0&&!S.qid; }catch(e){}
  var tit=o.daSeg?('<b>'+o.daSeg+(o.daSeg===1?' preventivo aspetta':' preventivi aspettano')+'</b> una risposta da qualche giorno.'):o.att.n?('<b>'+o.att.n+(o.att.n===1?' preventivo inviato':' preventivi inviati')+'</b>, in attesa di risposta.'):o.n?'Tutto in ordine. <b>Pronto per il prossimo lavoro?</b>':'Prepara il tuo <b>primo preventivo</b>: bastano due minuti.';
  var h='<div class="og-hero"><div class="og-aur" aria-hidden="true"></div><p class="og-dt">'+esc(dt)+'</p><p class="og-sal">'+esc(ogSaluto())+'</p><p class="og-tit">'+tit+'</p>'+
    '<div class="og-cta"><button type="button" class="og-b1" data-og="nuovo">'+ogIc('piu')+'<span>Nuovo preventivo</span></button><button type="button" class="og-b2" data-og="detta">'+ogIc('mic')+'<span>Descrivi il lavoro</span></button></div>'+
    ((apN||apL)&&!demo?'<button type="button" class="og-rip" data-og="riprendi"><span><small>Riprendi</small><b>'+esc(apN||'Preventivo senza cliente')+'</b></span><em>'+esc(apL?headTotal():'vuoto')+'</em>'+ogIc('vai')+'</button>':'')+'</div>';
  if(!o.n){
    h+='<div class="og-card og-vuoto"><b>Come funziona</b><ol><li><span>1</span>Scrivi il cliente e scegli le voci dal listino, oppure descrivi il lavoro a voce.</li><li><span>2</span>L\'app prepara un fascicolo con copertina, prodotti e condizioni.</li><li><span>3</span>Lo mandi su WhatsApp o per email e segui la risposta da qui.</li></ol></div>';
  } else {
    h+='<div class="og-kpi">'+
      '<button type="button" class="og-k att" data-og="f-inviato"><small>In attesa di risposta</small><b data-n="'+Math.round(o.att.v)+'" data-u="€">'+ogEurK(o.att.v)+'</b><span>'+o.att.n+(o.att.n===1?' preventivo':' preventivi')+'</span></button>'+
      '<button type="button" class="og-k acc" data-og="f-accettato"><small>Accettati questo mese</small><b data-n="'+Math.round(o.accM.v)+'" data-u="€">'+ogEurK(o.accM.v)+'</b><span>'+o.accM.n+(o.accM.n===1?' lavoro':' lavori')+'</span></button>'+
      '<div class="og-k tas">'+ogAnello(o.tasso)+'<div><small>Dicono sì</small><b>'+(o.tasso==null?'–':'<span data-n="'+o.tasso+'" data-u="%">'+o.tasso+'%</span>')+'</b><span>'+(o.tasso==null?'ancora nessun esito':o.si+' sì · '+o.no+' no')+'</span></div></div>'+
      '<button type="button" class="og-k boz" data-og="f-bozza"><small>Bozze</small><b data-n="'+o.boz+'">'+o.boz+'</b><span>da finire</span></button></div>';
    if(o.seg.length){
      h+='<div class="og-card"><div class="og-ct"><b>Da seguire</b><span>'+o.seg.length+(o.seg.length===1?' in attesa':' in attesa')+'</span></div><div class="og-seg">'+o.seg.slice(0,6).map(function(q){
        var g=ogGiorni(q.sat), tel=q.data&&q.data.client&&waDigits(q.data.client.tel||''), caldo=ogGiorni(q.fu||q.sat)>=3;
        return '<div class="og-s'+(caldo?' caldo':'')+'"><button type="button" class="og-sm" data-ogq="'+q.id+'"><b>'+esc(q.client||'Senza cliente')+'</b><small>'+esc(eur(q.tot))+' · inviato '+ogQuando(g)+(q.fu?' · sollecitato '+ogQuando(ogGiorni(q.fu)):'')+'</small></button>'+
          '<span class="og-sa">'+(tel?'<button type="button" class="og-i wa" data-ogwa="'+q.id+'" aria-label="Sollecita su WhatsApp" title="Sollecita su WhatsApp">'+ogIc('wa')+'</button>':'')+
          '<button type="button" class="og-i si" data-ogst="'+q.id+'|accettato" aria-label="Accettato" title="Ha accettato">'+ogIc('ok')+'</button><button type="button" class="og-i no" data-ogst="'+q.id+'|rifiutato" aria-label="Rifiutato" title="Non ha accettato">'+ogIc('no')+'</button></span></div>';
      }).join('')+'</div></div>';
    }
    h+=ogGrafico(o.mesi);
    h+='<div class="og-card"><div class="og-ct"><b>Ultimi preventivi</b><button type="button" class="og-tutti" data-og="archivio">Tutti ›</button></div><div class="og-ul">'+o.ult.map(function(q){
      return '<button type="button" class="og-u" data-ogq="'+q.id+'"><span class="og-av" aria-hidden="true">'+esc((String(q.client||'?').trim()[0]||'?').toUpperCase())+'</span><span class="og-ut"><b>'+esc(q.client||'Senza cliente')+'</b><small>'+esc((MODELS[q.model]?MODELS[q.model].short:'')+' · n. '+q.num)+'</small></span><span class="og-ur"><b>'+esc(eur(q.tot))+'</b><i class="st-'+qSt(q)+'">'+STL[qSt(q)]+'</i></span></button>';
    }).join('')+'</div></div>';
  }
  if(OG.ult===h) return; var primo=!OG.ult; OG.ult=h; el.innerHTML=h;
  ogConta(el,primo); ogBadge(o.daSeg);
}
// i numeri salgono contando, una volta sola all'apertura
function ogConta(el,primo){
  var rid=false; try{ rid=matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){}
  if(rid||!primo) return;
  Array.prototype.forEach.call(el.querySelectorAll('[data-n]'),function(b){
    var fin=+b.getAttribute('data-n'), u=b.getAttribute('data-u')||'', txt=b.textContent, t0=0; if(!(fin>0)) return;
    function f(t){ if(!t0) t0=t; var k=Math.min(1,(t-t0)/700), e=1-Math.pow(1-k,3), v=fin*e; b.textContent=k<1?(u==='€'?ogEurK(v):Math.round(v)+u):txt; if(k<1) requestAnimationFrame(f); }
    requestAnimationFrame(f);
  });
}
function ogBadge(n){ try{ if(navigator.setAppBadge){ if(n>0) navigator.setAppBadge(n); else navigator.clearAppBadge(); } }catch(e){} }
function ogSollecito(q){
  var c=(q.data&&q.data.client)||{}, d=waDigits(c.tel||''); if(!d) return;
  var nome=String(c.name||'').trim(), t='Buongiorno {cliente}, ha avuto modo di vedere il preventivo n. {numero}? Se vuole, lo rivediamo insieme o possiamo adattarlo alle sue esigenze. {ditta}';
  var txt=t.replace('{cliente}',nome).replace('{numero}',q.num||'').replace('{ditta}',S.company.name||'').replace(/\s+/g,' ').trim();
  q.fu=Date.now(); dbSave(); OG.ult=''; renderOggi();
  window.open('https://wa.me/'+d+'?text='+encodeURIComponent(txt),'_blank');
}
function ogEsito(id,st){
  var q=DB.quotes.filter(function(x){ return x.id===id; })[0]; if(!q) return; var prima=qSt(q), pu=q.upd;
  q.st=st; if(q.data&&q.data.meta) q.data.meta.status=st; q.upd=Date.now();
  if(S.qid===id){ S.meta.status=st; syncB(); doSave(); } dbSave(); renderArchivio(); OG.ult=''; renderOggi(); tocco(st==='accettato'?[12,40,18]:10);
  toastAzione((q.client||'Preventivo')+': '+STL[st].toLowerCase(),'Annulla',function(){ q.st=prima; if(q.data&&q.data.meta) q.data.meta.status=prima; q.upd=pu; if(S.qid===id){ S.meta.status=prima; syncB(); doSave(); } dbSave(); renderArchivio(); OG.ult=''; renderOggi(); });
}
// piccola vibrazione sui comandi importanti (dove il telefono la prevede)
function tocco(p){ try{ if(navigator.vibrate&&!document.documentElement.classList.contains('locked')) navigator.vibrate(p||8); }catch(e){} }
$('og').addEventListener('click',function(e){
  var b;
  if((b=e.target.closest('[data-ogwa]'))){ var q=DB.quotes.filter(function(x){ return x.id===b.getAttribute('data-ogwa'); })[0]; if(q) ogSollecito(q); return; }
  if((b=e.target.closest('[data-ogst]'))){ var a=b.getAttribute('data-ogst').split('|'); ogEsito(a[0],a[1]); return; }
  if((b=e.target.closest('[data-ogq]'))){ tocco(); openQuote(b.getAttribute('data-ogq')); showPanel('prev'); window.scrollTo(0,0); return; }
  if(!(b=e.target.closest('[data-og]'))) return; var k=b.getAttribute('data-og'); tocco();
  if(k==='nuovo'){ newQuote(); }
  else if(k==='detta'){ var vuoto=!S.lines.length&&!String(S.client.name||'').trim(); if(!vuoto) newQuote(); showPanel('prev'); var d=$('acc-as'); if(d) d.open=true; setTimeout(function(){ var t=$('as-txt'); if(t){ try{ t.scrollIntoView({behavior:'smooth',block:'center'}); t.focus({preventScroll:true}); }catch(x){} } },120); }
  else if(k==='riprendi'){ showPanel('prev'); window.scrollTo(0,0); }
  else if(k==='archivio'||k.indexOf('f-')===0){ qFilt=k==='archivio'?'':k.slice(2); qAll=true; showPanel('prev'); var s=$('acc-save'); if(s){ s.open=true; renderArchivio(); setTimeout(function(){ try{ s.scrollIntoView({behavior:'smooth',block:'start'}); }catch(x){} },80); } }
});
// chiamata da renderArchivio: il cruscotto si aggiorna quando cambia l'archivio
function ogDopoArchivio(){ if(typeof OG==='undefined'||!OG) return; if(panel==='home') renderOggi(); else { try{ ogBadge(ogStato().daSeg); }catch(e){} } }
/* ---- scorciatoie dell'icona (tieni premuta l'icona dell'app): ?azione=nuovo | detta | archivio ---- */
function ogAzioneUrl(){
  var a=''; try{ a=new URLSearchParams(location.search).get('azione')||''; }catch(e){} if(!a) return false;
  try{ history.replaceState(null,'',location.pathname); }catch(e){}
  var b=document.createElement('button'); b.setAttribute('data-og',a==='detta'?'detta':a==='archivio'?'archivio':'nuovo'); b.hidden=true; $('og').appendChild(b); b.click(); return true;
}
/* ---- scelta della pagina d'apertura ---- */
(function(){
  var s=$('ap-avvio'); if(!s) return; s.value=OG.avvio;
  s.addEventListener('change',function(){ OG.avvio=s.value==='prev'?'prev':'home'; try{ localStorage.setItem('ieci-avvio',OG.avvio); }catch(e){} toast(OG.avvio==='home'?'All\'apertura vedrai «Oggi»':'All\'apertura vedrai il preventivo'); });
})();
document.addEventListener('visibilitychange',function(){ if(!document.hidden&&panel==='home'){ OG.ult=''; renderOggi(); } });
(function(T){ if(!T) return; T.ogStato=ogStato; T.renderOggi=function(){ OG.ult=''; renderOggi(); }; T.OG=OG; })(window.IECI_T);
