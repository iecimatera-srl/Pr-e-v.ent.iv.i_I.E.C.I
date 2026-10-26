/* ===== Condizioni personalizzate per tipo di preventivo ===== */
function ccAll(){ if(!S.ccond||typeof S.ccond!=='object') S.ccond={}; return S.ccond; }
function ccGet(k){ var c=ccAll()[k]; return c&&typeof c==='object'&&(c.notes!=null||c.pay!=null)?c:null; }
function condDefNotes(k){ var c=ccGet(k); return c&&c.notes!=null?c.notes:(MODELS[k]?MODELS[k].notes:''); }
function condDefPay(k){ var c=ccGet(k); return c&&c.pay!=null?c.pay:null; }
function condSwitch(prev){
  var dn=condDefNotes(prev);
  if(!String(S.notes||'').trim()||S.notes===dn||(MODELS[prev]&&S.notes===MODELS[prev].notes)) S.notes=condDefNotes(S.model);
  var pp=condDefPay(prev), np=condDefPay(S.model), pd=payText(num(S.meta.dep)), pf=payText(30);
  if(np!=null){ if(!String(S.pay||'').trim()||S.pay===pp||S.pay===pd||S.pay===pf) S.pay=np; }
  else if(pp!=null&&S.pay===pp) S.pay=pd;
  if($('m-notes')) $('m-notes').value=S.notes; if($('m-pay')) $('m-pay').value=S.pay;
  renderCondSave();
}
function condApplyNew(){ var c=ccGet(S.model); if(!c) return; if(c.notes!=null) S.notes=c.notes; if(c.pay!=null) S.pay=c.pay; }
function renderCondSave(){
  var el=$('cc-box'); if(!el||!MODELS[S.model]) return;
  var k=S.model, nm=MODELS[k].short||MODELS[k].name, c=ccGet(k), st;
  if(c){
    var same=(c.notes==null||S.notes===c.notes)&&(c.pay==null||S.pay===c.pay);
    st=same?'✓ In uso le <b>tue condizioni</b> per «'+esc(nm)+'»'+(c.t?', salvate il '+esc(new Date(c.t).toLocaleDateString('it-IT')):'')+'.':'Le condizioni di questo preventivo sono diverse dalle <b>tue condizioni</b> salvate per «'+esc(nm)+'».';
  } else st=(S.notes===MODELS[k].notes)?'In uso le condizioni predefinite dell\'app per «'+esc(nm)+'». Modificale e salvale come tue.':'Condizioni modificate in questo preventivo, non ancora salvate come tue per «'+esc(nm)+'».';
  var saved=ORDER.filter(function(x){ return !!ccGet(x); }).map(function(x){ return MODELS[x].short||MODELS[x].name; });
  var h='<div class="ccst">'+st+'</div><div class="row"><button class="btn sm" type="button" data-cc="save">Salva come mie condizioni per «'+esc(nm)+'»</button>'+
    (c?'<button class="btn ghost sm" type="button" data-cc="use">Usa le mie condizioni</button><button class="btn ghost sm" type="button" data-cc="del">Elimina le mie condizioni</button>':'')+'</div>'+
    '<p class="hint">Pagamento e clausole salvati valgono per ogni nuovo preventivo di tipo «'+esc(nm)+'» e quando passi a questo tipo. I preventivi già fatti tengono le loro condizioni.'+(saved.length?' Tipi con condizioni tue: <b>'+esc(saved.join(', '))+'</b>.':'')+'</p>';
  if(el.getAttribute('data-k')!==h){ el.innerHTML=h; el.setAttribute('data-k',h); }
}
(function(){
  var w=$('cc-box'); if(!w) return;
  w.addEventListener('click',function(e){
    var b=e.target.closest('[data-cc]'); if(!b) return; var a=b.getAttribute('data-cc'), k=S.model, nm=MODELS[k].short||MODELS[k].name, all=ccAll();
    if(a==='save'){ if(ccGet(k)&&!confirm('Sostituisco le tue condizioni salvate per «'+nm+'» con quelle di questo preventivo?')) return; all[k]={notes:S.notes,pay:S.pay,t:Date.now()}; toast('Condizioni salvate per «'+nm+'»: le ritrovi in ogni nuovo preventivo di questo tipo'); }
    else if(a==='use'){ var c=ccGet(k); if(!c) return; if(c.notes!=null) S.notes=c.notes; if(c.pay!=null) S.pay=c.pay; $('m-notes').value=S.notes; $('m-pay').value=S.pay; toast('Applicate le tue condizioni per «'+nm+'»'); }
    else if(a==='del'){ if(!confirm('Elimino le tue condizioni salvate per «'+nm+'»? Questo preventivo non cambia.')) return; delete all[k]; toast('Condizioni salvate eliminate per «'+nm+'»'); }
    else return;
    renderCondSave(); touch(); try{ settingsStamp(); }catch(x){}
  });
  ['m-notes','m-pay'].forEach(function(id){ var t=$(id); if(t) t.addEventListener('input',function(){ renderCondSave(); }); });
})();


/* ===== Messaggi di invio: testi dell'utente ===== */
function mtFactory(){ return MSGT.map(function(t,i){ return {id:'m'+i,n:t.n,wa:t.wa,subj:t.subj,body:t.body}; }); }
function mtById(id){ var r=null; (S.mtpl||[]).forEach(function(t){ if(t.id===id) r=t; }); return r; }
function mtDef(){ return mtById(S.mdef)||S.mtpl[0]; }
var MT_PH=[['cliente','Cliente'],['numero','N. preventivo'],['titolo','Titolo'],['totale','Totale'],['validita','Validità'],['ditta','Ditta'],['tel','Tuo telefono']], mtOpen=null, mtLast=null;
function unfillMsg(t){
  var m=S.meta, map={cliente:S.client.name,numero:m.num,titolo:docTitle(),totale:headTotal(),validita:validText(),ditta:S.company.name,tel:S.company.tel};
  Object.keys(map).map(function(k){ return [k,String(map[k]||'')]; }).filter(function(a){ return a[1].length>=3; }).sort(function(a,b){ return b[1].length-a[1].length; })
    .forEach(function(a){ t=t.split(a[1]).join('{'+a[0]+'}'); });
  return t;
}
function renderMt(){
  var el=$('mt-list'); if(!el) return;
  el.innerHTML=S.mtpl.map(function(t,i){
    var def=t.id===S.mdef, open=mtOpen===t.id||(mtOpen==null&&def);
    return '<details class="mt'+(def?' def':'')+'" data-mtid="'+esc(t.id)+'"'+(open?' open':'')+'><summary><span class="mtn">'+esc(t.n||'Senza nome')+'</span>'+(def?'<span class="mtd">Predefinito</span>':'')+'</summary><div class="mtb">'+
      '<label class="f">Nome del messaggio<input type="text" data-mtf="n" value="'+esc(t.n)+'" placeholder="es. Invio preventivo condominio"></label>'+
      '<label class="f">Testo per WhatsApp<textarea data-mtf="wa" rows="5">'+esc(t.wa)+'</textarea></label>'+
      '<div class="mtph"><small>Inserisci:</small>'+MT_PH.map(function(p){ return '<button type="button" class="chip" data-mtph="'+p[0]+'">'+p[1]+'</button>'; }).join('')+'</div>'+
      '<div class="mtp"><small>Anteprima con questo preventivo</small><div class="msgprev" data-mtprev>'+esc(fillMsg(t.wa))+'</div></div>'+
      '<details class="sv"><summary>Testo per l\'email</summary><label class="f">Oggetto<input type="text" data-mtf="subj" value="'+esc(t.subj)+'"></label><label class="f">Testo<textarea data-mtf="body" rows="7">'+esc(t.body)+'</textarea></label></details>'+
      '<div class="row">'+(def?'':'<button type="button" class="btn sm" data-mta="def">Usa come predefinito</button>')+'<button type="button" class="btn ghost sm" data-mta="use">Usa ora in questo preventivo</button><button type="button" class="btn ghost sm" data-mta="dup">Duplica</button>'+(S.mtpl.length>1?'<button type="button" class="btn ghost sm" data-mta="del">Elimina</button>':'')+'</div></div></details>';
  }).join('');
}
function mtChanged(){ renderTpl(); try{ settingsStamp(); }catch(e){} touch(); }
(function(){
  var el=$('mt-list'); if(!el) return;
  el.addEventListener('focusin',function(e){ if(e.target.matches('[data-mtf]')) mtLast=e.target; });
  el.addEventListener('input',function(e){
    var f=e.target.getAttribute('data-mtf'); if(!f) return; var box=e.target.closest('[data-mtid]'), t=mtById(box.getAttribute('data-mtid')); if(!t) return;
    t[f]=e.target.value; if(f==='wa'){ var pv=box.querySelector('[data-mtprev]'); if(pv) pv.textContent=fillMsg(t.wa); }
    if(f==='n'){ var nn=box.querySelector('.mtn'); if(nn) nn.textContent=t.n||'Senza nome'; }
    if(S.msgs.tpl===t.id){ S.msgs.wa=t.wa; S.msgs.subj=t.subj; S.msgs.body=t.body; }
    mtChanged();
  });
  el.addEventListener('toggle',function(e){ var d=e.target; if(d.matches&&d.matches('details.mt')&&d.open) mtOpen=d.getAttribute('data-mtid'); },true);
  el.addEventListener('click',function(e){
    var ph=e.target.closest('[data-mtph]');
    if(ph){ var box=ph.closest('[data-mtid]'), ta=(mtLast&&box.contains(mtLast))?mtLast:box.querySelector('[data-mtf="wa"]'), v='{'+ph.getAttribute('data-mtph')+'}';
      var a=ta.selectionStart!=null?ta.selectionStart:ta.value.length, b=ta.selectionEnd!=null?ta.selectionEnd:a; ta.value=ta.value.slice(0,a)+v+ta.value.slice(b); ta.focus(); try{ ta.setSelectionRange(a+v.length,a+v.length); }catch(x){} ta.dispatchEvent(new Event('input',{bubbles:true})); return; }
    var b2=e.target.closest('[data-mta]'); if(!b2) return; var act=b2.getAttribute('data-mta'), box2=b2.closest('[data-mtid]'), id=box2.getAttribute('data-mtid'), t=mtById(id), i=S.mtpl.indexOf(t);
    if(act==='def'){ S.mdef=id; S.msgs={tpl:t.id,wa:t.wa,subj:t.subj,body:t.body}; toast('«'+(t.n||'Messaggio')+'» è il messaggio predefinito'); }
    else if(act==='use'){ S.msgs={tpl:t.id,wa:t.wa,subj:t.subj,body:t.body}; syncB(); renderInvio(); toast('Messaggio in uso in questo preventivo'); }
    else if(act==='dup'){ var c={id:'m'+Date.now().toString(36),n:(t.n||'Messaggio')+' (copia)',wa:t.wa,subj:t.subj,body:t.body}; S.mtpl.splice(i+1,0,c); mtOpen=c.id; }
    else if(act==='del'){ if(S.mtpl.length<=1||!confirm('Elimino il messaggio «'+(t.n||'Senza nome')+'»?')) return; S.mtpl.splice(i,1); if(S.mdef===id) S.mdef=S.mtpl[0].id; }
    renderMt(); mtChanged();
  });
  $('mt-add').addEventListener('click',function(){ var c={id:'m'+Date.now().toString(36),n:'Nuovo messaggio',wa:'Buongiorno {cliente}, le invio il preventivo n. {numero} «{titolo}». {ditta}',subj:'Preventivo n. {numero} - {titolo}',body:'Gentile {cliente},\\n\\nin allegato il preventivo n. {numero} «{titolo}».\\n\\nCordiali saluti\\n{ditta}\\n{tel}'}; S.mtpl.push(c); mtOpen=c.id; renderMt(); mtChanged(); var d=document.querySelector('[data-mtid="'+c.id+'"] [data-mtf="n"]'); if(d){ d.focus(); d.select(); } });
  $('mt-reset').addEventListener('click',function(){ if(!confirm('Ripristino i messaggi originali dell\'app? I tuoi messaggi vengono sostituiti.')) return; S.mtpl=mtFactory(); S.mdef='m0'; mtOpen=null; renderMt(); mtChanged(); toast('Messaggi originali ripristinati'); });
  document.addEventListener('click',function(e){ if(!e.target.closest('[data-gomt]')) return; if(!$('sh-bg').hidden) closeShare(); showPanel('messaggi'); try{ window.scrollTo(0,0); }catch(x){} });
})();
/* finestra Condividi: messaggio modificabile prima dell'invio */
function shMsgFill(){
  var sel=$('sh-tpl'); if(!sel) return;
  var cur=mtById(S.msgs.tpl);
  sel.innerHTML=S.mtpl.map(function(t){ return '<option value="'+esc(t.id)+'">'+esc(t.n||'Senza nome')+(t.id===S.mdef?' (predefinito)':'')+'</option>'; }).join('')+(cur?'':'<option value="">Messaggio della scheda Invio</option>');
  sel.value=cur?cur.id:'';
  $('sh-txt').value=fillMsg(S.msgs.wa); $('sh-subj').value=fillMsg(S.msgs.subj); $('sh-body').value=fillMsg(S.msgs.body);
}
(function(){
  var sel=$('sh-tpl'); if(!sel) return;
  sel.addEventListener('change',function(){ var t=mtById(sel.value); if(!t) return; S.msgs={tpl:t.id,wa:t.wa,subj:t.subj,body:t.body}; $('sh-txt').value=fillMsg(t.wa); $('sh-subj').value=fillMsg(t.subj); $('sh-body').value=fillMsg(t.body); shLinks(); syncB(); touch(); });
  ['sh-txt','sh-subj','sh-body'].forEach(function(id){ $(id).addEventListener('input',shLinks); });
  $('sh-cp2').addEventListener('click',function(){ copyText(shTxt(),'Messaggio copiato: incollalo nella chat'); });
  $('sh-save').addEventListener('click',function(){
    var n=prompt('Nome del nuovo messaggio','Il mio messaggio'); if(n==null) return;
    var c={id:'m'+Date.now().toString(36),n:String(n).trim()||'Il mio messaggio',wa:unfillMsg($('sh-txt').value),subj:unfillMsg($('sh-subj').value),body:unfillMsg($('sh-body').value)};
    S.mtpl.push(c); S.msgs={tpl:c.id,wa:c.wa,subj:c.subj,body:c.body}; shMsgFill(); mtChanged();
    toast('Salvato «'+c.n+'»: i dati del cliente sono diventati segnaposto, così vale per tutti i preventivi');
  });
})();


/* ===== Codici di accesso GitHub: mostra / copia ===== */
document.addEventListener('click',function(e){
  var sh=e.target.closest('[data-tokshow]'), cp=e.target.closest('[data-tokcp]'); if(!sh&&!cp) return;
  var inp=$((sh||cp).getAttribute(sh?'data-tokshow':'data-tokcp')); if(!inp) return;
  var v=String(inp.value||'').trim();
  if(!v){ toast('Nessun codice salvato su questo dispositivo'); return; }
  if(sh){ var vis=inp.type==='text'; inp.type=vis?'password':'text'; sh.textContent=vis?'Mostra codice':'Nascondi codice'; if(!vis){ clearTimeout(inp._tokT); inp._tokT=setTimeout(function(){ inp.type='password'; sh.textContent='Mostra codice'; },60000); } return; }
  copyText(v,'Codice copiato: incollalo sull\'altro dispositivo e poi cancellalo dagli appunti');
});

