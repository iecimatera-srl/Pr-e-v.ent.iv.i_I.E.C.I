/* ===== Blocco con PIN =====
   Il tastierino, la verifica, i tentativi e lo sblocco sono nel motore che parte per primo (window.PINPAD, in testa
   alla pagina): così ogni tocco viene preso subito, anche mentre l'app si prepara dietro. Qui ci sono le impostazioni:
   attivare, cambiare e togliere il PIN, il blocco automatico e l'impronta. */
var PIN=null, LK={on:false,last:Date.now(),hid:0,okT:0}, PIN_IT=600000, PP=window.PINPAD;
function pinLoad(){ PIN=PP?PP.load():null; return PIN; }
function pinSave(){ if(PP) PP.save(PIN); }
function lkHex(b){ var a=new Uint8Array(b),r='',i; for(i=0;i<a.length;i++) r+=('0'+a[i].toString(16)).slice(-2); return r; }
function lkRnd(n){ var a=new Uint8Array(n); (window.crypto||window.msCrypto).getRandomValues(a); return a; }
function pinMode(){ return (window.crypto&&crypto.subtle&&window.TextEncoder)?'p':'w'; }
function pinHash(txt,salt,mode,it,cb){ PP.hash(txt,salt,mode,it,cb); }
// quante iterazioni reggono ~200 ms su QUESTO dispositivo (minimo 150.000, massimo 600.000)
function pinCalib(cb){
  if(pinMode()!=='p') return cb(PIN_IT);
  var t0=performance.now(); pinHash('000000','calibrazione','p',50000,function(){ var dt=Math.max(1,performance.now()-t0); cb(Math.max(150000,Math.min(PIN_IT,Math.round(50000*200/dt/10000)*10000))); });
}
// un PIN creato con troppe iterazioni per questo telefono viene ricifrato in silenzio: lo sblocco diventa immediato
function pinTune(code){
  pinLoad(); if(!code||!PIN||PIN.m!=='p'||PIN.tuned) return;
  setTimeout(function(){ pinCalib(function(it){ pinLoad(); if(!PIN) return; if(it>=PIN.i*0.8){ PIN.tuned=1; pinSave(); return; }
    var salt=lkHex(lkRnd(16)); pinHash(code,salt,'p',it,function(h){ pinLoad(); if(!h||!PIN) return; if(!PIN.ri){ PIN.ri=PIN.i; } PIN.h=h; PIN.s=salt; PIN.i=it; PIN.tuned=1; pinSave(); }); }); },2500);
}
function recNorm(t){ return String(t||'').toUpperCase().replace(/[^A-Z0-9]/g,''); }
function recGen(){ var al='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',a=lkRnd(12),r='',i; for(i=0;i<12;i++){ r+=al.charAt(a[i]%32); if(i%4===3&&i<11) r+='-'; } return r; }
function lkInert(on){ var w=document.querySelector('.wrap'); if(!w) return; if(on) w.setAttribute('inert',''); else w.removeAttribute('inert'); }
// finestre del PIN usate dalle impostazioni (non bloccano l'app)
function lkShow(o){ lkInert(true); PP.show(o); }
function lkClose(){ PP.hide(false); if(!PP.locked){ document.documentElement.classList.remove('locked'); lkInert(false); } }
function lkLock(){ pinLoad(); if(!PIN) return; LK.on=true; lkInert(true); PP.lock(); pinUI(); }
function pinMark(force){ var n=Date.now(); if(force||n-LK.okT>8000){ LK.okT=n; PP.mark(); } }
// sblocco (arriva dal motore): l'app è già pronta dietro, si completa solo il fascicolo
window.addEventListener('ieci-sbloccato',function(e){
  var how=e.detail&&e.detail.how; LK.on=false; LK.last=Date.now(); lkInert(false); pinMark(true); pinLoad(); pinUI();
  if(how==='pin') pinTune(PP.code());
  if(how==='rec'){ PP.ultimo(); toast('PIN rimosso: impostane uno nuovo qui'); showPanel('app'); window.scrollTo(0,0); }
  // l'app torna a essere impaginata: riadatto anteprima e caselle
  try{ FITW=0; fit(); t1All(); }catch(x){}
  if(DOCC.pend){ DOCC.pend=false; setTimeout(function(){ requestAnimationFrame(function(){ schedule(); }); },60); }
  if(typeof avvioInAttesa!=='undefined'&&avvioInAttesa) setTimeout(avvia,0);
});
function pinNew(cb,cancel,msg){
  lkShow({title:'Scegli un PIN',msg:msg||'6 cifre facili da ricordare ma non ovvie',cancel:cancel,done:function(a){
    if(/^(\d)\1{5}$/.test(a)||a==='123456'||a==='654321'||a==='012345'||a==='123123'){ PP.bad('PIN troppo semplice: cambia le cifre'); return; }
    lkShow({title:'Ripeti il PIN',msg:'Scrivilo un\'altra volta per conferma',cancel:cancel,done:function(b){
      if(a!==b){ PP.bad('I due PIN non coincidono'); setTimeout(function(){ if(PP.state.ask) pinNew(cb,cancel,'Non coincidevano: riprova dall\'inizio'); },900); return; }
      cb(a);
    }});
  }});
}
function pinVerify(title,okcb){
  lkShow({title:title,cancel:lkClose,verify:true,bio:true,bioOk:okcb,done:function(c){ PP.check(c,function(ok){ if(ok) okcb(c); }); }});
}
function recShow(code){
  PP.state.ask=null; PP.view('out'); $('lk-title').textContent='Codice di recupero'; $('lk-code').textContent=code;
  PP.msg('Scrivilo su un foglio e conservalo: serve solo se dimentichi il PIN. Non verrà mostrato più.');
}
/* ---------- impronta: chiave del dispositivo (WebAuthn), niente server ---------- */
var BIO={ok:false};
function bioPuo(){ return !!(window.PublicKeyCredential&&navigator.credentials&&window.crypto&&crypto.subtle&&(location.protocol==='https:'||location.hostname==='localhost')); }
function bioControlla(){
  BIO.ok=false; if(!bioPuo()){ pinUI(); return; }
  var f=PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable; if(!f){ pinUI(); return; }
  f.call(PublicKeyCredential).then(function(v){ BIO.ok=!!v; pinUI(); },function(){ pinUI(); });
}
function bioAttiva(){
  pinVerify('Conferma con il PIN',function(){
    lkClose();
    var uid=lkRnd(16), ch=lkRnd(32);
    navigator.credentials.create({publicKey:{rp:{name:'IECI preventivi',id:location.hostname},user:{id:uid,name:'ieci-preventivi',displayName:'IECI preventivi'},challenge:ch,
      pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},timeout:60000,attestation:'none'}})
    .then(function(cr){
      var r=cr.response, pk=r.getPublicKey&&r.getPublicKey(), alg=r.getPublicKeyAlgorithm?r.getPublicKeyAlgorithm():-7;
      if(!pk){ toast('Questo browser non permette l\'impronta per l\'app'); return; }
      pinLoad(); if(!PIN) return; PIN.bio={id:PP.b64u(cr.rawId),pk:PP.b64u(pk).replace(/-/g,'+').replace(/_/g,'/'),alg:alg}; pinSave(); pinUI(); toast('Impronta attivata: la prossima volta basta il dito');
    },function(e){ toast(e&&e.name==='NotAllowedError'?'Impronta non attivata (annullato)':'Impronta non disponibile su questo dispositivo'); });
  });
}
function pinUI(){
  pinLoad(); var on=!!PIN; $('pn-off').hidden=on; $('pn-on').hidden=!on; $('lk-now').hidden=!on; if(on) $('pn-auto').value=String(PIN.auto);
  var bx=$('pn-bio'); if(bx){ bx.hidden=!on||!(BIO.ok||PIN&&PIN.bio); var b=!!(PIN&&PIN.bio); $('pn-bio-on').hidden=b; $('pn-bio-off').hidden=!b; $('pn-bio-st').textContent=b?'Attiva: all\'apertura appoggi il dito e l\'app si sblocca. Il PIN resta valido.':'Più veloce del PIN: appoggi il dito e l\'app si apre. Il PIN resta valido.'; }
}
function pinInit(){
  pinLoad(); LK.on=!!(PP&&PP.locked); if(LK.on) lkInert(true);
  $('lk-copy').addEventListener('click',function(){ var t=$('lk-code').textContent; try{ navigator.clipboard.writeText(t).then(function(){ toast('Codice copiato'); },function(){ toast('Copia non riuscita: scrivilo a mano'); }); }catch(e){ toast('Copia non riuscita: scrivilo a mano'); } });
  $('lk-done').addEventListener('click',function(){ lkClose(); pinMark(true); pinUI(); toast('PIN attivato'); });
  $('pn-set').addEventListener('click',function(){
    pinNew(function(code){
      var mode=pinMode(), salt=lkHex(lkRnd(16)), rs=lkHex(lkRnd(16)), rec=recGen();
      PP.msg('Proteggo il PIN…'); $('lk-dots').className='lk-dots wait';
      pinCalib(function(it){ Promise.all([new Promise(function(r){ pinHash(code,salt,mode,it,r); }),new Promise(function(r){ pinHash(recNorm(rec),rs,mode,it,r); })]).then(function(v){
        PP.idle(); var h=v[0], rh=v[1];
        if(!h||!rh){ lkClose(); toast('Il browser non permette la cifratura: PIN non attivato'); return; }
        PIN={h:h,s:salt,m:mode,i:it,rh:rh,rs:rs,auto:5,f:0,u:0,r:0,tuned:1}; pinSave(); pinUI(); recShow(rec);
      }); });
    },lkClose);
  });
  $('pn-chg').addEventListener('click',function(){
    pinVerify('PIN attuale',function(){
      pinNew(function(code){ pinLoad(); var salt=lkHex(lkRnd(16)); pinHash(code,salt,PIN.m,PIN.i,function(h){ if(!h){ lkClose(); toast('Cambio non riuscito'); return; } pinLoad(); PIN.h=h; PIN.s=salt; PIN.f=0; pinSave(); lkClose(); toast('PIN cambiato'); }); },lkClose);
    });
  });
  $('pn-del').addEventListener('click',function(){
    pinVerify('Inserisci il PIN per disattivarlo',function(){ PIN=null; pinSave(); lkClose(); pinUI(); try{ sessionStorage.removeItem('ieci-pin-ok'); }catch(e){} toast('PIN disattivato'); });
  });
  $('pn-bio-on').addEventListener('click',bioAttiva);
  $('pn-bio-off').addEventListener('click',function(){ pinLoad(); if(!PIN) return; delete PIN.bio; pinSave(); pinUI(); toast('Impronta disattivata: si sblocca con il PIN'); });
  $('pn-lock').addEventListener('click',function(){ lkLock(); });
  $('lk-now').addEventListener('click',function(){ lkLock(); });
  $('pn-auto').addEventListener('change',function(){ pinLoad(); if(!PIN) return; PIN.auto=parseInt($('pn-auto').value,10); pinSave(); toast('Blocco automatico impostato'); });
  ['pointerdown','keydown','touchstart','wheel'].forEach(function(ev){ document.addEventListener(ev,function(){ if(LK.on||PP.locked||!PIN) return; LK.last=Date.now(); pinMark(false); },{capture:true,passive:true}); });
  setInterval(function(){
    if(!PIN||LK.on||PP.locked) return; var n=Date.now();
    if(PIN.auto>0&&n-LK.last>PIN.auto*60000&&!PP.state.ask) lkLock(); else if(n-LK.last<60000) pinMark(false);
  },10000);
  document.addEventListener('visibilitychange',function(){
    if(!PIN||LK.on||PP.locked) return;
    if(document.hidden){ LK.hid=Date.now(); return; }
    if(LK.hid&&PIN.auto>=0&&Date.now()-LK.hid>=PIN.auto*60000&&!PP.state.ask) lkLock();
    LK.hid=0;
  });
  if(!LK.on){ document.documentElement.classList.remove('locked'); if(PIN) pinMark(true); }
  if(!PIN){ try{ sessionStorage.removeItem('ieci-pin-ok'); }catch(e){} }
  if(!LK.on){ pinTune(PP.code()); if(PP.ultimo()==='rec') setTimeout(function(){ toast('PIN rimosso: impostane uno nuovo qui'); showPanel('app'); window.scrollTo(0,0); },300); }
  pinUI(); bioControlla();
  window.IECI_T.pin=function(){ return {PIN:pinLoad(),LK:LK,PP:PP}; };
}
pinInit();

menuLoad();
