/* ===== Blocco con PIN ===== */
var PIN=null, LK={on:false,buf:'',ask:null,busy:false,wait:false,tm:0,last:Date.now(),hid:0,okT:0}, PIN_IT=600000;
function pinLoad(){ try{ PIN=JSON.parse(localStorage.getItem('ieci-pin')||'null'); }catch(e){ PIN=null; } if(PIN&&!PIN.h) PIN=null; }
function pinSave(){ try{ if(PIN) localStorage.setItem('ieci-pin',JSON.stringify(PIN)); else localStorage.removeItem('ieci-pin'); }catch(e){ toast('Impossibile salvare il PIN su questo dispositivo'); } }
function lkHex(b){ var a=new Uint8Array(b),r='',i; for(i=0;i<a.length;i++) r+=('0'+a[i].toString(16)).slice(-2); return r; }
function lkRnd(n){ var a=new Uint8Array(n); (window.crypto||window.msCrypto).getRandomValues(a); return a; }
function pinWeak(t,sl){ var a=0x811c9dc5,b=0x1234567,str=sl+'|'+t,r,i; for(r=0;r<3000;r++){ for(i=0;i<str.length;i++){ a^=str.charCodeAt(i); a=Math.imul(a,16777619)>>>0; b=(b+a+(b<<5))>>>0; } } return a.toString(16)+b.toString(16); }
function pinHash(txt,salt,mode,it,cb){
  if(mode==='p'&&window.crypto&&crypto.subtle&&window.TextEncoder){
    var enc=new TextEncoder();
    crypto.subtle.importKey('raw',enc.encode(txt),'PBKDF2',false,['deriveBits']).then(function(k){
      return crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:it,hash:'SHA-256'},k,256);
    }).then(function(b){ cb(lkHex(b)); }).catch(function(){ cb(''); });
  } else cb(pinWeak(txt,salt));
}
function pinMode(){ return (window.crypto&&crypto.subtle&&window.TextEncoder)?'p':'w'; }
function lkEq(a,b){ if(!a||!b||a.length!==b.length) return false; var d=0,i; for(i=0;i<a.length;i++) d|=a.charCodeAt(i)^b.charCodeAt(i); return d===0; }
function pinCheck(code,cb){ pinHash(code,PIN.s,PIN.m,PIN.i,function(h){ cb(lkEq(h,PIN.h)); }); }
function recNorm(t){ return String(t||'').toUpperCase().replace(/[^A-Z0-9]/g,''); }
function recGen(){ var al='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',a=lkRnd(12),r='',i; for(i=0;i<12;i++){ r+=al.charAt(a[i]%32); if(i%4===3&&i<11) r+='-'; } return r; }
function lkInert(on){ var w=document.querySelector('.wrap'); if(!w) return; if(on) w.setAttribute('inert',''); else w.removeAttribute('inert'); }
function lkView(v){ ['pad','in','out'].forEach(function(k){ $('lk-v-'+k).hidden=(k!==v); }); }
function lkMsg(t,err){ var m=$('lk-msg'); m.textContent=t||' '; m.className='lk-msg'+(err?' err':''); }
function lkRender(){ var d=$('lk-dots').children,i; for(i=0;i<d.length;i++) d[i].className=(i<LK.buf.length)?'on':''; }
function lkShow(o){
  LK.ask=o; LK.buf=''; LK.busy=false;
  var lg=$('app-logo'); $('lk-logo').innerHTML=lg?lg.innerHTML:'';
  $('lock').hidden=false; lkInert(true); lkView('pad');
  $('lk-title').textContent=o.title; lkMsg(o.msg||''); $('lk-cancel').hidden=!o.cancel; $('lk-forgot').hidden=!o.forgot;
  $('lk-pad').classList.remove('dis'); lkRender(); if(o.verify) lkTick();
}
function lkClose(){ LK.ask=null; clearInterval(LK.tm); $('lock').hidden=true; if(!LK.on) document.documentElement.classList.remove('locked'); lkInert(LK.on); }
function lkPress(d){ if(!LK.ask||LK.busy||LK.wait||LK.buf.length>=6) return; LK.buf+=d; lkRender(); if(LK.buf.length===6){ LK.busy=true; var c=LK.buf, a=LK.ask; setTimeout(function(){ if(LK.ask===a) a.done(c); },130); } }
function lkDel(){ if(!LK.ask||LK.busy) return; LK.buf=LK.buf.slice(0,-1); lkRender(); }
function lkBad(msg){ LK.busy=false; LK.buf=''; var d=$('lk-dots'); d.className='lk-dots bad'; var i; for(i=0;i<d.children.length;i++) d.children[i].className=''; setTimeout(function(){ d.className='lk-dots'; },480); lkMsg(msg,true); try{ if(navigator.vibrate) navigator.vibrate(120); }catch(e){} }
function lkTick(){
  clearInterval(LK.tm);
  function t(){
    var left=Math.ceil(((PIN&&PIN.u)||0)-Date.now())/1000; left=Math.ceil(left);
    if(left>0){ LK.wait=true; $('lk-pad').classList.add('dis'); var m=Math.floor(left/60),s2=left%60; lkMsg('Troppi tentativi. Riprova tra '+(m?m+' min ':'')+s2+' s',true); }
    else { clearInterval(LK.tm); if(LK.wait){ LK.wait=false; $('lk-pad').classList.remove('dis'); lkMsg(''); } }
  }
  t(); if(PIN&&PIN.u>Date.now()) LK.tm=setInterval(t,500);
}
function lkFail(rec){
  PIN.f=(PIN.f||0)+1; var msg;
  if(PIN.f>=5){ PIN.r=(PIN.r||0)+1; var dl=[30,60,300,900,3600][Math.min(PIN.r-1,4)]; PIN.u=Date.now()+dl*1000; PIN.f=0; pinSave(); if(rec){ lkMsg('Troppi tentativi. Riprova tra '+dl+' s',true); LK.busy=false; return; } lkBad(''); lkTick(); return; }
  pinSave(); msg=(rec?'Codice non valido':'PIN errato')+' · restano '+(5-PIN.f)+' tentativi'; if(rec){ lkMsg(msg,true); } else lkBad(msg);
}
function lkUnlock(){
  LK.on=false; LK.last=Date.now(); lkClose(); document.documentElement.classList.remove('locked'); lkInert(false); pinMark(true); pinUI();
}
function lkLock(){
  if(!PIN) return; LK.on=true; try{ sessionStorage.removeItem('ieci-pin-ok'); }catch(e){}
  document.documentElement.classList.add('locked'); lkAskUnlock(); pinUI();
}
function lkAskUnlock(){
  lkShow({title:'Inserisci il PIN',forgot:true,verify:true,done:function(c){
    if(PIN.u>Date.now()){ lkBad(''); lkTick(); return; }
    pinCheck(c,function(ok){ if(ok){ PIN.f=0; PIN.u=0; PIN.r=0; pinSave(); lkUnlock(); } else lkFail(false); });
  }});
}
function pinMark(force){ var n=Date.now(); if(force||n-LK.okT>8000){ LK.okT=n; try{ sessionStorage.setItem('ieci-pin-ok',String(n)); }catch(e){} } }
function pinNew(cb,cancel,msg){
  lkShow({title:'Scegli un PIN',msg:msg||'6 cifre facili da ricordare ma non ovvie',cancel:cancel,done:function(a){
    if(/^(\d)\1{5}$/.test(a)||a==='123456'||a==='654321'||a==='012345'||a==='123123'){ lkBad('PIN troppo semplice: cambia le cifre'); return; }
    lkShow({title:'Ripeti il PIN',cancel:cancel,done:function(b){
      if(a!==b){ lkBad('I due PIN non coincidono'); setTimeout(function(){ if(LK.ask) pinNew(cb,cancel,'Non coincidevano: riprova dall\'inizio'); },900); return; }
      cb(a);
    }});
  }});
}
function pinVerify(title,okcb){
  lkShow({title:title,cancel:lkClose,verify:true,done:function(c){
    if(PIN.u>Date.now()){ lkBad(''); lkTick(); return; }
    pinCheck(c,function(ok){ if(ok){ PIN.f=0; pinSave(); okcb(); } else lkFail(false); });
  }});
}
function recShow(code){
  LK.ask=null; lkView('out'); $('lk-title').textContent='Codice di recupero'; $('lk-code').textContent=code;
  lkMsg('Scrivilo su un foglio e conservalo: serve solo se dimentichi il PIN. Non verrà mostrato più.');
}
function pinUI(){
  var on=!!PIN; $('pn-off').hidden=on; $('pn-on').hidden=!on; $('lk-now').hidden=!on; if(on) $('pn-auto').value=String(PIN.auto);
}
function pinInit(){
  pinLoad(); pinUI();
  var recent=false; try{ recent=Date.now()-(+sessionStorage.getItem('ieci-pin-ok')||0)<120000; }catch(e){}
  var pad=$('lk-pad'),k; for(k=1;k<=9;k++) pad.insertAdjacentHTML('beforeend','<button type="button" data-k="'+k+'" aria-label="'+k+'">'+k+'</button>');
  pad.insertAdjacentHTML('beforeend','<button type="button" class="lk-ph" tabindex="-1" aria-hidden="true"></button><button type="button" data-k="0" aria-label="0">0</button><button type="button" data-k="del" aria-label="Cancella"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="M17 9l-5 6M12 9l5 6"/></svg></button>');
  pad.addEventListener('click',function(e){ var b=e.target.closest('button[data-k]'); if(!b) return; var v=b.getAttribute('data-k'); if(v==='del') lkDel(); else lkPress(v); });
  document.addEventListener('keydown',function(e){
    if($('lock').hidden||!LK.ask||!$('lk-v-pad')||$('lk-v-pad').hidden) return;
    if(e.key>='0'&&e.key<='9'&&e.key.length===1){ e.preventDefault(); lkPress(e.key); }
    else if(e.key==='Backspace'){ e.preventDefault(); lkDel(); }
    else if(e.key==='Escape'&&LK.ask.cancel){ e.preventDefault(); LK.ask.cancel(); }
  },true);
  $('lk-cancel').addEventListener('click',function(){ if(LK.ask&&LK.ask.cancel) LK.ask.cancel(); });
  $('lk-forgot').addEventListener('click',function(){ lkView('in'); $('lk-title').textContent='Codice di recupero'; lkMsg('Inserisci il codice che hai ricevuto quando hai impostato il PIN'); $('lk-recin').value=''; setTimeout(function(){ $('lk-recin').focus(); },50); });
  $('lk-recback').addEventListener('click',function(){ if(LK.on) lkAskUnlock(); else lkClose(); });
  function recGo(){
    if(PIN.u>Date.now()){ lkTickRec(); return; }
    var c=recNorm($('lk-recin').value); if(c.length!==12){ lkMsg('Il codice ha 12 caratteri (XXXX-XXXX-XXXX)',true); return; }
    pinHash(c,PIN.rs,PIN.m,PIN.i,function(h){
      if(lkEq(h,PIN.rh)){ PIN=null; pinSave(); lkUnlock(); toast('PIN rimosso: impostane uno nuovo qui'); showPanel('app'); window.scrollTo(0,0); }
      else lkFail(true);
    });
  }
  function lkTickRec(){ var l=Math.ceil((PIN.u-Date.now())/1000); lkMsg('Troppi tentativi. Riprova tra '+l+' s',true); }
  $('lk-recok').addEventListener('click',recGo);
  $('lk-recin').addEventListener('keydown',function(e){ if(e.key==='Enter') recGo(); });
  $('lk-copy').addEventListener('click',function(){ var t=$('lk-code').textContent; try{ navigator.clipboard.writeText(t).then(function(){ toast('Codice copiato'); },function(){ toast('Copia non riuscita: scrivilo a mano'); }); }catch(e){ toast('Copia non riuscita: scrivilo a mano'); } });
  $('lk-done').addEventListener('click',function(){ lkClose(); pinMark(true); pinUI(); toast('PIN attivato'); });
  $('pn-set').addEventListener('click',function(){
    pinNew(function(code){
      var mode=pinMode(), salt=lkHex(lkRnd(16)), rs=lkHex(lkRnd(16)), rec=recGen();
      pinHash(code,salt,mode,PIN_IT,function(h){ pinHash(recNorm(rec),rs,mode,PIN_IT,function(rh){
        if(!h||!rh){ lkClose(); toast('Il browser non permette la cifratura: PIN non attivato'); return; }
        PIN={h:h,s:salt,m:mode,i:PIN_IT,rh:rh,rs:rs,auto:5,f:0,u:0,r:0}; pinSave(); pinUI(); recShow(rec);
      }); });
    },lkClose);
  });
  $('pn-chg').addEventListener('click',function(){
    pinVerify('PIN attuale',function(){
      pinNew(function(code){ var salt=lkHex(lkRnd(16)); pinHash(code,salt,PIN.m,PIN.i,function(h){ if(!h){ lkClose(); toast('Cambio non riuscito'); return; } PIN.h=h; PIN.s=salt; PIN.f=0; pinSave(); lkClose(); toast('PIN cambiato'); }); },lkClose);
    });
  });
  $('pn-del').addEventListener('click',function(){
    pinVerify('Inserisci il PIN per disattivarlo',function(){ PIN=null; pinSave(); lkClose(); pinUI(); try{ sessionStorage.removeItem('ieci-pin-ok'); }catch(e){} toast('PIN disattivato'); });
  });
  $('pn-lock').addEventListener('click',function(){ lkLock(); });
  $('lk-now').addEventListener('click',function(){ lkLock(); });
  $('pn-auto').addEventListener('change',function(){ if(!PIN) return; PIN.auto=parseInt($('pn-auto').value,10); pinSave(); toast('Blocco automatico impostato'); });
  ['pointerdown','keydown','touchstart','wheel'].forEach(function(ev){ document.addEventListener(ev,function(){ if(LK.on||!PIN) return; LK.last=Date.now(); pinMark(false); },true); });
  setInterval(function(){
    if(!PIN||LK.on) return; var n=Date.now();
    if(PIN.auto>0&&n-LK.last>PIN.auto*60000&&!LK.ask) lkLock(); else if(n-LK.last<60000) pinMark(false);
  },10000);
  document.addEventListener('visibilitychange',function(){
    if(!PIN||LK.on) return;
    if(document.hidden){ LK.hid=Date.now(); return; }
    if(LK.hid&&PIN.auto>=0&&Date.now()-LK.hid>=PIN.auto*60000&&!LK.ask) lkLock();
    LK.hid=0;
  });
  if(PIN&&!recent) lkLock(); else { LK.on=false; lkClose(); pinMark(true); }
  if(PIN&&recent){ pinMark(true); }
  if(!PIN){ try{ sessionStorage.removeItem('ieci-pin-ok'); }catch(e){} }
  window.IECI_T.pin=function(){ return {PIN:PIN,LK:LK}; };
}
pinInit();

menuLoad();

