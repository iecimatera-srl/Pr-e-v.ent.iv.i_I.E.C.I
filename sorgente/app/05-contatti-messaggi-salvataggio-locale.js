/* ---------- contatti e QR ---------- */
function waDigits(t){
  var d=String(t||'').replace(/\D/g,''); if(d.indexOf('00')===0) d=d.slice(2);
  if(d.length===10&&d.charAt(0)==='3') d='39'+d;
  return d.length>=11?d:'';
}
function phoneNice(t){ var d=waDigits(t); return d.indexOf('39')===0&&d.length===12?'+39 '+d.slice(2,5)+' '+d.slice(5,8)+' '+d.slice(8):(d?'+'+d:''); }
function webUrl(w){ w=String(w||'').trim(); if(!w) return ''; return /^https?:\/\//i.test(w)?w:'https://'+w; }
function lastSeg(u){ var s=String(u||'').replace(/[?#].*$/,'').replace(/\/+$/,'').split('/'); return s[s.length-1]||''; }
var ICO={
  wa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1.4-4.2A8 8 0 1 1 8.4 18.8z"/><path d="M9.2 8.8c0 3.2 2.8 6 6 6l1.2-1.4-2.2-1-.9.8a4 4 0 0 1-2-2l.8-.9-1-2.2z"/></svg>',
  web:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
  fb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M15.5 14c3 0 5.5 1.7 5.5 4.5"/></svg>',
  ig:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.6-2.4h6.8L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.6"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/></svg>'
};
function iconHtml(c){
  var u=(S.company.icons||{})[c.ico];
  return u?'<img class="cimg" src="'+u+'" alt="'+esc(c.k)+'">':'<span class="cic">'+ICO[c.ico]+'</span>';
}
function contactItems(){
  var c=S.company, q=S.trust.qr, o=[];
  if(q.wa&&waDigits(c.wa)) o.push({k:'WhatsApp',ico:'wa',sub:phoneNice(c.wa),url:'https://wa.me/'+waDigits(c.wa)});
  if(q.wa2&&waDigits(c.wa2)) o.push({k:'WhatsApp',ico:'wa',sub:phoneNice(c.wa2),url:'https://wa.me/'+waDigits(c.wa2)});
  if(q.web&&c.web) o.push({k:'Sito web',ico:'web',sub:String(c.web).replace(/^https?:\/\//i,'').replace(/\/$/,''),url:webUrl(c.web)});
  if(q.fb&&c.fb) o.push({k:'Facebook',ico:'fb',sub:lastSeg(c.fb),url:webUrl(c.fb)});
  if(q.ig&&c.ig) o.push({k:'Instagram',ico:'ig',sub:'@'+lastSeg(c.ig),url:webUrl(c.ig)});
  if(q.mail&&c.email) o.push({k:'Email',ico:'mail',sub:c.email,url:'mailto:'+c.email});
  return o;
}
function contactLine(){ var c=S.company; return [c.tel,c.email,String(c.web||'').replace(/^https?:\/\//i,'')].filter(Boolean).join(' · '); }
/* dati per modello */
var COLL={
  dom:'Continuità dei conduttori di protezione\nResistenza di isolamento dei circuiti\nMisura della resistenza di terra\nProva di intervento dei differenziali\nVerifica polarità e funzionamento di prese e punti luce\nVerifica targhette e identificazione dei circuiti\nConsegna Dichiarazione di Conformità e istruzioni',
  vid:'Funzionamento e inquadratura di ogni telecamera\nRegistrazione e riproduzione sul registratore\nAccesso remoto da app configurato e provato\nVisione notturna / infrarossi\nPassword personalizzate impostate e consegnate\nCartello informativo posizionato\nFormazione al cliente sull\'uso',
  all:'Prova di ogni sensore e contatto\nPrelievo di sirene interne ed esterne\nProva di inserimento e disinserimento\nComunicatore e notifiche verificati\nControllo carica batterie e alimentazione\nCodici utente e telecomandi consegnati\nFormazione al cliente sull\'uso',
  vcit:'Prova di chiamata da ogni pulsante\nVerifica audio e video su ogni monitor\nProva di apertura della serratura o del cancello\nVerifica visione notturna e inquadratura\nConfigurazione app e notifiche sullo smartphone\nConsegna delle istruzioni al cliente',
  aut:'Verifica della forza di spinta e arresto per ostacolo\nProva delle fotocellule e della costa di sicurezza\nProva dello sblocco manuale\nProgrammazione e prova dei radiocomandi\nVerifica di lampeggiante e finecorsa\nConsegna di istruzioni e documentazione al cliente',
  fv:'Controllo serraggio e fissaggio della struttura\nVerifica polarità e tensioni delle stringhe\nProva di isolamento lato DC\nMessa in servizio e collegamento dell\'inverter\nVerifica protezioni e messa a terra\nMonitoraggio configurato e accessibile\nConsegna Dichiarazione di Conformità e documentazione',
  tv:'Livello di segnale su tutte le prese\nSintonizzazione dei canali\nVerifica orientamento antenna / parabola\nProva su ogni presa TV e SAT\nConsegna istruzioni al cliente',
  ind:'Controllo conformità del quadro agli schemi\nProva di isolamento dei circuiti\nVerifica continuità di protezione e impianto di terra\nProva di intervento delle protezioni\nProva funzionale dei carichi e dei motori\nVerifica del senso di rotazione\nConsegna Dichiarazione di Conformità e schemi as built',
  sw:'Verifica delle specifiche funzionali concordate\nProva degli ingressi e delle uscite in campo\nProva dei casi di allarme ed errore\nBackup del programma consegnato\nDocumentazione tecnica e credenziali consegnate\nFormazione agli operatori'
};
var CRONO_DEF={
  dom:'Sopralluogo e predisposizioni | 1\nTracce e posa tubazioni | 3\nPosa cavi e scatole | 3\nQuadro e collegamenti | 2\nFrutti, placche e apparecchi | 2\nCollaudo e consegna | 1',
  vid:'Sopralluogo e definizione posizioni | 1\nPosa cavi | 2\nInstallazione telecamere | 1\nConfigurazione registratore e app | 1\nCollaudo e formazione | 1',
  all:'Sopralluogo e definizione sensori | 1\nPosa linee | 2\nInstallazione sensori e sirene | 1\nCentrale e programmazione | 1\nCollaudo e formazione | 1',
  vcit:'Sopralluogo e definizione posizioni | 1\nPosa cavi e tubazioni | 2\nInstallazione postazione esterna e monitor | 1\nCollegamento serratura e configurazione | 1\nCollaudo e consegna | 1',
  aut:'Sopralluogo e misure | 1\nFornitura materiali | 5\nInstallazione motori e fotocellule | 2\nCablaggi e programmazione centrale | 1\nCollaudo e consegna | 1',
  fv:'Pratiche e ordine materiali | 10\nAllestimento cantiere e ponteggi | 1\nInstallazione struttura e moduli | 3\nCablaggi e quadri | 2\nInverter e accumulo | 1\nCollaudo e messa in servizio | 1',
  tv:'Sopralluogo | 1\nInstallazione antenna e cavi | 1\nPrese e centralino | 1\nSintonizzazione e collaudo | 1',
  ind:'Progetto esecutivo | 10\nApprovvigionamento materiali | 10\nPosa passerelle e cavi | 8\nMontaggio quadri e collegamenti | 6\nVerifiche e collaudo | 3',
  sw:'Analisi e specifiche | 3\nSviluppo | 10\nTest in laboratorio | 3\nInstallazione e collaudo in campo | 2\nFormazione e consegna | 1'
};
var MARKT={
  dom:[['Punto luce','#F5B800'],['Presa','#2F65AE'],['Interruttore','#2E9E5B'],['Quadro elettrico','#C0392B'],['Dati / TV','#8E44AD'],['Altro','#555555']],
  vid:[['Telecamera','#2F65AE'],['Registratore (NVR)','#C0392B'],['Switch PoE','#2E9E5B'],['Alimentazione / UPS','#F5B800'],['Altro','#555555']],
  all:[['Sensore volumetrico','#2F65AE'],['Contatto porta / finestra','#2E9E5B'],['Sirena','#C0392B'],['Centrale','#8E44AD'],['Tastiera','#F5B800'],['Altro','#555555']],
  vcit:[['Postazione esterna','#2F65AE'],['Monitor interno','#2E9E5B'],['Alimentatore','#F5B800'],['Serratura / apriporta','#C0392B'],['Altro','#555555']],
  aut:[['Motore','#C0392B'],['Fotocellula','#2F65AE'],['Lampeggiante','#F5B800'],['Centrale / quadro','#8E44AD'],['Selettore / tastiera','#2E9E5B'],['Altro','#555555']],
  fv:[['Pannelli','#2F65AE'],['Inverter','#C0392B'],['Batteria','#2E9E5B'],['Quadro','#F5B800'],['Accesso / ponteggio','#8E44AD'],['Altro','#555555']],
  tv:[['Antenna / parabola','#2F65AE'],['Presa TV','#2E9E5B'],['Centralino','#C0392B'],['Partitore','#F5B800'],['Altro','#555555']],
  ind:[['Quadro','#C0392B'],['Corpo illuminante','#F5B800'],['Presa CEE','#2F65AE'],['Passerella','#2E9E5B'],['Motore / utenza','#8E44AD'],['Altro','#555555']],
  sw:[['PLC / HMI','#2F65AE'],['Sensore','#2E9E5B'],['Pannello','#C0392B'],['Rete','#F5B800'],['Altro','#555555']]
};
var MSGT=[
  {n:'Invio preventivo',
   wa:'Buongiorno {cliente}, le invio il preventivo n. {numero} «{titolo}» per un importo di {totale} IVA inclusa, valido fino al {validita}. Resto a disposizione per ogni chiarimento. {ditta}',
   subj:'Preventivo n. {numero} - {titolo}',
   body:'Gentile {cliente},\n\nin allegato trova il preventivo n. {numero} «{titolo}» per un importo di {totale} IVA inclusa, valido fino al {validita}.\n\nSono a disposizione per un sopralluogo o per qualsiasi chiarimento.\n\nCordiali saluti\n{ditta}\n{tel}'},
  {n:'Sollecito cortese',
   wa:'Buongiorno {cliente}, ha avuto modo di vedere il preventivo n. {numero}? Se vuole, lo rivediamo insieme o possiamo adattarlo alle sue esigenze. {ditta}',
   subj:'Preventivo n. {numero}: ha bisogno di chiarimenti?',
   body:'Gentile {cliente},\n\nle scrivo per sapere se ha potuto valutare il preventivo n. {numero} «{titolo}». Posso rispondere a ogni dubbio o proporre una variante.\n\nCordiali saluti\n{ditta}\n{tel}'},
  {n:'Conferma ordine e inizio lavori',
   wa:'Buongiorno {cliente}, la ringrazio per la fiducia. Confermiamo l\'ordine relativo al preventivo n. {numero}. Ci sentiamo a breve per concordare la data di inizio lavori. {ditta}',
   subj:'Conferma ordine - preventivo n. {numero}',
   body:'Gentile {cliente},\n\nla ringrazio per aver scelto {ditta}. Confermiamo l\'ordine relativo al preventivo n. {numero} «{titolo}» e a breve concorderemo la data di inizio lavori.\n\nCordiali saluti\n{ditta}\n{tel}'},
  {n:'Lavori conclusi',
   wa:'Buongiorno {cliente}, i lavori «{titolo}» sono conclusi. Se è soddisfatto, una breve recensione ci aiuta molto. Grazie ancora! {ditta}',
   subj:'Lavori conclusi - {titolo}',
   body:'Gentile {cliente},\n\ni lavori «{titolo}» sono conclusi. La documentazione e le istruzioni sono state consegnate; per qualsiasi necessità siamo a disposizione.\n\nGrazie per la fiducia.\n{ditta}\n{tel}'}
];
function fillMsg(t){
  var m=S.meta, map={cliente:S.client.name||'cliente',numero:m.num,titolo:docTitle(),totale:headTotal(),validita:validText()||'—',ditta:S.company.name,tel:S.company.tel};
  return String(t||'').replace(/\{(\w+)\}/g,function(a,k){ return map[k]!=null?map[k]:a; });
}

var DB={clients:[],prods:[],quotes:[],arts:[],logos:[],parole:[],del:{},su:0,lastBackup:0,lastChange:0}, DBKEY='preventivi-db-v1', dbT=0, qT=0, dbReady=false;
var S, panel='stile', storageWarned=false, IDB=null, saveT=0;
var BASE_IDS=['cover','prodotti','planimetria','azienda','crono','fv','prev','fiducia','cond','conferma','lavoro','collaudo'];
function fixLayout(lay,custom){
  var ids=BASE_IDS.concat((custom||[]).map(function(c){return 'c:'+c.id;})), out=[];
  (lay||[]).forEach(function(id){ if(ids.indexOf(id)>-1&&out.indexOf(id)<0) out.push(id); });
  ids.forEach(function(id){ if(out.indexOf(id)<0) out.push(id); });
  return out;
}
function normalize(old){
  var base=fresh();
  if(!old||!old.meta||!old.cat) return base;
  Object.keys(base).forEach(function(k){ if(old[k]===undefined) old[k]=base[k]; });
  if(old.style&&typeof old.style.logo==='string'&&((old.style.logo.indexOf('data:image/jpeg')===0&&old.style.logo.length===LOGO0_OLD_LEN)||(old.style.logo.indexOf('data:image/png')===0&&old.style.logo.length===816282))) old.style.logo=LOGO0;
  ['style','profile','show','company','tiers','fv','crono','docs','msgs','client','econ','meta','cond'].forEach(function(k){ if(!old[k]||typeof old[k]!=='object') old[k]=base[k]; Object.keys(base[k]).forEach(function(kk){ if(old[k][kk]===undefined) old[k][kk]=base[k][kk]; }); });
  ['trust','sign','plan'].forEach(function(k){ if(!old[k]||typeof old[k]!=='object') old[k]=base[k]; Object.keys(base[k]).forEach(function(kk){ if(old[k][kk]===undefined) old[k][kk]=base[k][kk]; }); });
  (function(T){ if(T.brands&&T.brands.length){ var oldB=T.brands; T.brands=[]; var has=(T.bgroups||[]).some(function(g){ return g.items&&g.items.length; }); if(!has){ T.bgroups=[{id:'bg0',t:'Marchi che installiamo',items:oldB}].concat((T.bgroups||[]).filter(function(g){ return !(g.items&&g.items.length); })); } } if(!Array.isArray(T.bgroups)) T.bgroups=[]; T.bgroups.forEach(function(g){ if(!g.id) g.id='bg'+Math.random().toString(36).slice(2,7); if(!Array.isArray(g.items)) g.items=[]; if(typeof g.t!=='string') g.t=''; }); })(old.trust);
  if(!old.__v3){
    if(old.company.piva==='P.IVA 00000000000'||/^IECI Impianti Elettrici/.test(old.company.name)) old.company=defaultCompany();
    if(/sostituiscilo con la storia/.test(old.profile.about||'')||/^XX/.test(old.profile.stats||'')){ var dp=defaultProfile(); ['slogan','about','stats','certs'].forEach(function(k){ old.profile[k]=dp[k]; }); }
    var lay=(old.layout||[]).slice();
    function ins(id,after,before){ if(lay.indexOf(id)>-1) return; var i=after?lay.indexOf(after)+1:(before?lay.indexOf(before):-1); if(i<=0&&!(after&&lay.indexOf(after)>-1)) i=lay.length; lay.splice(i,0,id); }
    ins('planimetria','prodotti'); ins('crono','azienda'); ins('fv',null,'prev'); ins('fiducia',null,'cond');
    old.layout=lay; old.__v3=1;
  }
  ORDER.forEach(function(k){ if(!old.cat[k]) old.cat[k]=copy(MODELS[k].items); });
  if(Array.isArray(old.lines)) old.lines=old.lines.filter(function(l){ return !l.vm; });
  if(!Array.isArray(old.mtpl)||!old.mtpl.length) old.mtpl=mtFactory();
  old.mtpl.forEach(function(t,i){ if(!t.id) t.id='m'+i+Date.now().toString(36); ['n','wa','subj','body'].forEach(function(k){ if(t[k]==null) t[k]=''; }); });
  if(!old.mtpl.some(function(t){ return t.id===old.mdef; })) old.mdef=old.mtpl[0].id;
  if(old.msgs&&typeof old.msgs.tpl==='number') old.msgs.tpl='m'+old.msgs.tpl;
  if(!old.__cat2){
    ['dom','vid','all','aut','fv','tv','ind','sw'].forEach(function(k){
      var cur=old.cat[k]; if(!Array.isArray(cur)) return;
      MODELS[k].items.forEach(function(f){
        var hit=null; cur.forEach(function(c){ if(c[0]===f[0]&&!hit) hit=c; });
        if(!hit) cur.push(copy(f)); else { if(!hit[3]) hit[3]=f[3]; if(hit[4]===undefined) hit[4]='*'; }
      });
      var gl=[]; MODELS[k].items.forEach(function(f){ if(f[3]&&gl.indexOf(f[3])<0) gl.push(f[3]); });
      (old.cgroups&&old.cgroups[k]||[]).forEach(function(g){ if(gl.indexOf(g)<0) gl.push(g); });
      if(!old.cgroups) old.cgroups={}; old.cgroups[k]=gl;
    });
    old.__cat2=1;
  }
  if(!old.__vc2&&old.cat.vcit){ MODELS.vcit.items.forEach(function(d){ var f=null; old.cat.vcit.forEach(function(x){ if(x[0]===d[0]) f=x; }); if(!f) old.cat.vcit.push(copy(d)); }); old.__vc2=1; }
  if(!old.__vc){ var cvv=old.cat.vcit; MODELS.vcit.items.forEach(function(d){ var f=null; cvv.forEach(function(x){ if(x[0]===d[0]) f=x; }); if(f){ f[3]=f[3]||d[3]; f[4]=f[4]||d[4]; } else cvv.push(copy(d)); }); old.__vc=1; }
  if(!old.cgroups||typeof old.cgroups!=='object'||Array.isArray(old.cgroups)) old.cgroups={};
  ORDER.forEach(function(k){ cgSync(k,old); });
  if(!Array.isArray(old.rooms)) old.rooms=[];
  old.rooms=old.rooms.filter(function(r){ return r&&r.id; }).map(function(r){ return {id:String(r.id),name:String(r.name||'Stanza'),kind:ROOMICO[r.kind]?r.kind:'al'}; });
  if(typeof old.curRoom!=='string') old.curRoom='';
  if(old.model==='app'&&!old.__rm&&!old.rooms.length){ old.rooms=defaultRooms(); old.curRoom=old.rooms[0].id; }
  if(old.model==='app') old.__rm=1;
  if(old.curRoom&&!old.rooms.some(function(r){ return r.id===old.curRoom; })) old.curRoom='';
  delete old.notesModel;
  if(old.style&&old.style.order==='B'&&!old.__lay){ old.layout=['cover','azienda','prodotti','prev','cond']; }
  old.__lay=1;
  old.layout=fixLayout(old.layout,old.custom);
  return old;
}
function readLocal(){
  var raw=null; try{ raw=localStorage.getItem(KEY)||localStorage.getItem(KEY1); }catch(e){}
  try{ return raw?JSON.parse(raw):null; }catch(e){ return null; }
}
function warnStore(){ if(!storageWarned){ storageWarned=true; toast('Memoria piena: alcune modifiche non si salvano. Riduci il numero di foto.'); } }
function idbOpen(cb){
  try{
    var r=indexedDB.open('preventivi-ieci',1);
    r.onupgradeneeded=function(){ r.result.createObjectStore('kv'); };
    r.onsuccess=function(){ IDB=r.result; cb(true); };
    r.onerror=function(){ cb(false); };
  }catch(e){ cb(false); }
}
function idbGet(cb){ try{ var q=IDB.transaction('kv').objectStore('kv').get(KEY); q.onsuccess=function(){ cb(q.result); }; q.onerror=function(){ cb(null); }; }catch(e){ cb(null); } }
function doSave(){
  syncQuoteSoon(); mirSoon();
  if(IDB){ try{ var tx=IDB.transaction('kv','readwrite'); tx.objectStore('kv').put(S,KEY); tx.onerror=tx.onabort=function(){ warnStore(); }; }catch(e){ warnStore(); } return; }
  try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){ warnStore(); }
}

// salvataggio quando smetti di scrivere, nei momenti liberi del telefono (e subito se chiudi o cambi app)
function idle(fn,t){ if(window.requestIdleCallback) requestIdleCallback(fn,{timeout:t||1500}); else setTimeout(fn,1); }
function save(){ clearTimeout(saveT); saveT=setTimeout(function(){ saveT=0; idle(doSave,1200); },600); }
document.addEventListener('visibilitychange',function(){ if(document.hidden&&saveT){ clearTimeout(saveT); saveT=0; doSave(); } });
window.addEventListener('pagehide',function(){ if(saveT){ clearTimeout(saveT); saveT=0; doSave(); } });
S=normalize(readLocal());

function $(id){ return document.getElementById(id); }
/* Aggiorna un riquadro SENZA sostituirlo: si cambiano solo testi, attributi e valori diversi.
   Così il campo che stai toccando, la tastiera del telefono e il cursore restano dove sono. */
function morph(box,html){ var t=document.createElement('template'); t.innerHTML=html; morphKids(box,t.content); }
function morphKids(a,b){
  var an=a.childNodes, bn=b.childNodes, i, x, y;
  for(i=0;i<bn.length;i++){
    x=an[i]; y=bn[i];
    if(!x){ a.appendChild(y.cloneNode(true)); continue; }
    if(x.nodeType!==y.nodeType||x.nodeName!==y.nodeName){ a.replaceChild(y.cloneNode(true),x); continue; }
    if(x.nodeType!==1){ if(x.nodeValue!==y.nodeValue) x.nodeValue=y.nodeValue; continue; }
    if((x.getAttribute('data-pid')||'')!==(y.getAttribute('data-pid')||'')){ a.replaceChild(y.cloneNode(true),x); continue; }
    morphAttrs(x,y);
    var tg=x.tagName;
    if(tg==='INPUT'){ morphVal(x,y); continue; }
    if(tg==='TEXTAREA'){ if(document.activeElement!==x&&x.value!==y.textContent) x.value=y.textContent; continue; }
    morphKids(x,y);
    if(tg==='SELECT'&&document.activeElement!==x){ var so=y.querySelector('option[selected]'); var v=so?so.getAttribute('value'):null; if(v==null&&so) v=so.textContent; if(v!=null&&x.value!==v) x.value=v; else if(!so&&x.selectedIndex<0&&x.options.length) x.selectedIndex=0; }
  }
  while(an.length>bn.length) a.removeChild(a.lastChild);
}
function morphAttrs(x,y){
  var i, at;
  for(i=x.attributes.length-1;i>=0;i--){ at=x.attributes[i].name; if(!y.hasAttribute(at)&&!(at==='open'&&x.tagName==='DETAILS')) x.removeAttribute(at); }
  for(i=0;i<y.attributes.length;i++){ at=y.attributes[i]; if(x.getAttribute(at.name)!==at.value&&!(at.name==='value'&&x.tagName==='INPUT')) x.setAttribute(at.name,at.value); }
}
function morphVal(x,y){
  if(x.type==='checkbox'||x.type==='radio'){ var c=y.hasAttribute('checked'); if(x.checked!==c) x.checked=c; return; }
  if(x.type==='file') return;
  var v=y.getAttribute('value')||''; if(document.activeElement===x) return; if(x.value!==v) x.value=v;
}
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function num(v){ var n=parseFloat(String(v).replace(',','.')); return isFinite(n)?n:0; }
function r2(x){ return Math.round(x*100)/100; }
var fmt=new Intl.NumberFormat('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});
function eur(x){ return fmt.format(r2(x))+' €'; }
function qfmt(x){ return new Intl.NumberFormat('it-IT',{maximumFractionDigits:3}).format(x); }
function dateIt(iso){ if(!iso) return ''; var p=iso.split('-'); return p.length===3? p[2]+'/'+p[1]+'/'+p[0] : iso; }
function lines(t){ return String(t||'').split('\n').map(function(x){return x.trim();}).filter(Boolean); }
function activeLines(){ return S.lines.filter(function(l){return !l.off;}); }
function lineTotal(l){ return r2(num(l.q)*num(l.p)*(1-num(l.s)/100)); }
var toastT;
function toast(msg){ var t=$('toast'); t.classList.remove('az'); t.textContent=msg; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(function(){t.hidden=true;},2600); }
// avviso con un pulsante (es. «Annulla») che resta qualche secondo in più
function toastAzione(msg,lab,fn){ var t=$('toast'); t.textContent=''; var sp=document.createElement('span'); sp.textContent=msg; var b=document.createElement('button'); b.type='button'; b.className='toast-b'; b.textContent=lab; b.onclick=function(){ t.hidden=true; clearTimeout(toastT); fn(); }; t.appendChild(sp); t.appendChild(b); t.hidden=false; t.classList.add('az'); clearTimeout(toastT); toastT=setTimeout(function(){ t.hidden=true; t.classList.remove('az'); },7000); }

/* caselle di testo su una riga che vanno a capo (textarea.t1): sul telefono il testo lungo si legge tutto.
   Invio non va a capo; dove il browser non allarga da solo la casella (field-sizing) la adatto io. */
var T1_JS=!(window.CSS&&CSS.supports&&CSS.supports('field-sizing','content')), T1_RAF=0;
function t1Fit(el){ if(!T1_JS||!el||!el.offsetParent) return; el.style.height='auto'; var h=el.scrollHeight+(el.offsetHeight-el.clientHeight); if(h>8) el.style.height=h+'px'; }
function t1All(){ T1_RAF=0; if(!T1_JS) return; Array.prototype.forEach.call(document.querySelectorAll('textarea.t1'),t1Fit); }
function t1Soon(){ if(T1_JS&&!T1_RAF) T1_RAF=requestAnimationFrame(t1All); }
document.addEventListener('keydown',function(e){ var t=e.target; if(e.key==='Enter'&&t&&t.tagName==='TEXTAREA'&&t.classList.contains('t1')){ e.preventDefault(); if(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) t.blur(); } },true);
document.addEventListener('input',function(e){ var t=e.target; if(!t||t.tagName!=='TEXTAREA'||!t.classList.contains('t1')) return; if(/[\r\n]/.test(t.value)){ var p=t.selectionStart; t.value=t.value.replace(/\s*[\r\n]+\s*/g,' '); try{ t.setSelectionRange(p,p); }catch(x){} } t1Fit(t); },true);
if(T1_JS){ try{ new MutationObserver(t1Soon).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open','class']}); }catch(e){} window.addEventListener('resize',t1Soon); document.addEventListener('toggle',t1Soon,true); }
