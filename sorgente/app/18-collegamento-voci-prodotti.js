/* ===== Collegamento stabile voci del preventivo <-> schede Prodotti ===== */
function lcn(x){ return String(x||'').trim().toLowerCase().replace(/\s+/g,' '); }
function prodById(id){ var r=null; if(id) S.products.forEach(function(p){ if(p.id===id) r=p; }); return r; }
function prodOfLine(l){
  if(!l||l.vm) return null; var p=l.pid?prodById(l.pid):null; if(p) return p;
  var n=lcn(l.vmn||l.d); if(!n&&!l.art) return null;
  S.products.forEach(function(x){ if(!p&&((n&&lcn(x.name)===n)||(l.art&&x.artId===l.art))&&(!l.sy||!x.sys||x.sys===l.sy)) p=x; });
  return p;
}
function prodWorthy(l){ var nm=String(l.d||'').trim(); return !!nm&&!SERVICE_U.test(String(l.u||'').trim())&&!SKIP_P.test(nm); }
function prodUsers(p){ var r=[]; S.lines.forEach(function(l,i){ if(!l.vm&&prodOfLine(l)===p) r.push(i); }); return r; }
function prodEmpty(p){ return !(p.photos&&p.photos.length)&&!String(p.desc||'').trim()&&!String(p.specs||'').trim()&&!String(p.code||'').trim()&&!String(p.link||'').trim()&&!p.pdf; }
function libFill(p,l){
  var a=l&&l.art?DB.arts.filter(function(x){ return x.id===l.art; })[0]:null, lib=null, n=lcn(p.name);
  DB.prods.forEach(function(x){ if(!lib&&lcn(x.name)===n) lib=x; });
  var src=a||lib; if(!src) return false;
  ['brand','code','desc','specs','link'].forEach(function(k){ if(!p[k]&&src[k]) p[k]=src[k]; });
  if((!p.photos||!p.photos.length)&&src.photos&&src.photos.length){ p.photos=src.photos.slice(0,MAXPH); if(src.po) p.po=src.po.slice(0,MAXPH); if(src.cr) p.cr=copy(src.cr); }
  if(a) p.artId=a.id; return true;
}
function linkLine(l,opt){
  opt=opt||{}; if(!l||l.vm) return null;
  var p=prodOfLine(l);
  if(!p){
    if(!opt.force&&(APP.autop==='off'||!prodWorthy(l))) return null;
    var nm=String(opt.name||l.vmn||l.d||'').trim(); if(!nm) return null;
    p={id:uid(),name:nm,brand:opt.brand||l.br||'',code:opt.code||'',desc:'',specs:'',link:'',tags:'',photos:[],sol:opt.sol||''}; if(l.sy) p.sys=l.sy;
    libFill(p,l); S.products.push(p); l.pid=p.id; return {p:p,created:true};
  }
  l.pid=p.id; return {p:p,created:false};
}
function prodChip(l,i){
  if(l.vm) return ''; var p=prodOfLine(l);
  if(p) return '<button type="button" class="pchip on" data-lgo="'+i+'" title="Apri la scheda in Prodotti"><span class="pdot"></span>Scheda prodotto: '+esc(p.name||'senza nome')+(p.photos&&p.photos.length?' · '+p.photos.length+' foto':'')+' ›</button>';
  if(!String(l.d||'').trim()) return '';
  return '<button type="button" class="pchip" data-lmk="'+i+'">+ Crea la scheda prodotto</button>';
}
function prodLinkInfo(p,i){
  var u=prodUsers(p);
  if(u.length) return '<div class="plink ok">Nel preventivo: '+u.map(function(k){ var l=S.lines[k]; return 'riga '+(k+1)+' ('+qfmt(num(l.q))+' '+esc(l.u)+')'; }).join(', ')+(p.name!==String(S.lines[u[0]].vmn||S.lines[u[0]].d).trim()?' · voce «'+esc(S.lines[u[0]].d)+'»':'')+'</div>';
  return '<div class="plink no">Questo prodotto non è più tra le voci del preventivo.<button type="button" class="btn ghost sm" data-act="rm" data-pi="'+i+'">Elimina la scheda</button></div>';
}
function prodOrderLikeLines(){
  var pos={}; S.lines.forEach(function(l,i){ var p=prodOfLine(l); if(p&&pos[p.id]==null) pos[p.id]=i; });
  S.products=S.products.map(function(p,i){ return {p:p,i:i}; }).sort(function(a,b){ var x=(pos[a.p.id]!=null?pos[a.p.id]:1e6)-(pos[b.p.id]!=null?pos[b.p.id]:1e6); return x||a.i-b.i; }).map(function(o){ return o.p; });
}
function autoProd(name,unit,extra){
  if(APP.autop==='off') return false;
  var nm=String(name||'').trim(); if(!nm||SERVICE_U.test(String(unit||'').trim())||SKIP_P.test(nm)) return false;
  var low=nm.toLowerCase(); if(S.products.some(function(p){ return String(p.name||'').trim().toLowerCase()===low; })) return false;
  extra=extra||{};
  S.products.push({id:uid(),name:nm,brand:extra.brand||'',code:extra.code||'',desc:'',specs:'',link:'',tags:'',photos:[],sol:extra.sol||''});
  renderProducts(); return true;
}
// Preventivo → Prodotti: ricordo com'era la descrizione quando inizi a modificarla
$('lines').addEventListener('focusin',function(e){ var t=e.target; if(t.getAttribute&&t.getAttribute('data-f')==='d'){ var row=t.closest('.line'), L=row&&S.lines[+row.getAttribute('data-i')]; if(L){ t.setAttribute('data-old',String(L.d||'')); var p0=prodOfLine(L); if(p0) L.pid=p0.id; } } });
$('lines').addEventListener('change',function(e){
  var fb=e.target.getAttribute('data-f'); if(fb==='br'){ var rb=e.target.closest('.line'), Lb=rb&&S.lines[+rb.getAttribute('data-i')], pb=Lb&&prodOfLine(Lb); if(pb){ var nb=prodUsers(pb).length; toast('Marca «'+(Lb.br||'nessuna')+'» anche nella scheda «'+pb.name+'»'+(nb>1?' e nelle altre '+(nb-1)+' righe collegate':'')); } brDatalist(); return; }
  if(fb!=='d') return; var row=e.target.closest('.line'); if(!row) return;
  var L=S.lines[+row.getAttribute('data-i')]; if(!L||!String(L.d||'').trim()) return;
  var p=L.pid?prodById(L.pid):null, old=String(e.target.getAttribute('data-old')||'').trim(), nuovo=String(L.d).trim();
  var i=+row.getAttribute('data-i');
  if(p&&prodUsers(p).length<=1&&(!p.man||lcn(p.name)===lcn(old)||(old&&String(p.name).indexOf(old)>-1))){ if(p.name!==nuovo){ var pn=p.name; p.name=(lcn(pn)===lcn(old)||!p.man)?nuovo:String(pn).replace(old,nuovo); if(!p.man) libFill(p,L); renderProducts(); lineChip(i); touch(); toast('Anche la scheda in Prodotti ora si chiama «'+p.name+'»'); } e.target.setAttribute('data-old',nuovo); return; }
  var r=linkLine(L); if(r&&r.created){ renderProducts(); lineChip(i); touch(); toast('Scheda creata in Prodotti: '+r.p.name); } else lineChip(i);
});
/* Prodotti → Preventivo: cambiando nome o marca nella scheda, le righe collegate si correggono da sole */
function prodLinkAll(p){ S.lines.forEach(function(l){ if(!l.vm&&prodOfLine(l)===p) l.pid=p.id; }); }
// all'inizio della modifica fotografo come sono le righe collegate (testo prima e dopo il nome), così posso
// riscriverle a ogni lettera senza perdere nulla, anche se cancelli tutto e riscrivi
function prodSess(p,f,old){
  var k=p.id+'|'+f; if(SYNC.sess&&SYNC.sess.k===k) return SYNC.sess;
  old=String(old||''); var ov=lcn(old), R=[];
  S.lines.forEach(function(l){ if(l.vm||l.pid!==p.id) return;
    if(f==='name'){ ['d','vmn'].forEach(function(key){ if(l[key]==null) return; var t=String(l[key]), at=old?t.indexOf(old):-1;
      if(lcn(t)===ov) R.push({l:l,key:key,pre:'',suf:''}); else if(at>-1) R.push({l:l,key:key,pre:t.slice(0,at),suf:t.slice(at+old.length)}); }); }
    else if(!l.br||lcn(l.br)===ov) R.push({l:l,key:'br',pre:'',suf:''}); });
  var V=[]; if(f==='name'&&old&&typeof vcOn==='function'&&vcOn()) vmKinds().forEach(function(kk){ vmData(kk).o.forEach(function(o){ if(vmHas(o)&&lcn(vmDn(o))===ov) V.push(o); }); });
  SYNC.sess={k:k,r:R,v:V}; return SYNC.sess;
}
function prodSync(p,f,old,val){
  var se=prodSess(p,f,old); val=String(val||'');
  se.r.forEach(function(x){ x.l[x.key]=x.pre+val+x.suf; SYNC.set.add(x.l); }); SYNC.addT=Date.now();
  if(se.v.length){ se.v.forEach(function(o){ o.n=val; }); vmSync(); }
  var n=se.r.filter(function(x){ return x.key!=='vmn'; }).length+(se.v.length?1:0);
  SYNC.n=n; if(n){ clearTimeout(SYNC.t); SYNC.t=setTimeout(function(){ renderLines(); },200); }
  return n;
}
// aggiorna solo il collegamento alla scheda di quella riga: il resto dell'elenco (e il campo in cui stai scrivendo) non si tocca
function lineChip(i){
  var row=$('lines').querySelector('.line[data-i="'+i+'"]'), L=S.lines[i]; if(!row||!L){ renderLines(); return; }
  var old=row.querySelector('.pchip'), h=prodChip(L,i), box=row.querySelector('.nums2');
  if(old){ if(h){ var t=document.createElement('template'); t.innerHTML=h; old.replaceWith(t.content.firstChild); } else old.remove(); }
  else if(h&&box){ box.insertAdjacentHTML('beforeend',h); }
}
$('p-import').addEventListener('click',function(){
  var n=0, lk=0; S.lines.forEach(function(l){ if(l.off||l.vm) return; var r=linkLine(l); if(r){ if(r.created){ n++; openP[r.p.id]=true; } else lk++; } });
  prodOrderLikeLines(); renderProducts(); renderLines(); touch();
  toast(n?('Create '+n+' schede'+(lk?', '+lk+' già collegate':'')+': ordinate come le voci del preventivo'):'Tutte le voci con un prodotto hanno già la loro scheda');
});

// una marca per tutte le voci (materiali, non lavorazioni): righe e schede insieme
$('l-brgo').addEventListener('click',function(){
  var v=$('l-brall').value.trim(); if(!v){ toast('Scrivi la marca da applicare'); $('l-brall').focus(); return; }
  var n=0, np=0, ps=[];
  S.lines.forEach(function(l){ if(l.vm||l.off||(brOn()&&l.sy)) return; var p=prodOfLine(l); if(!p&&!prodWorthy(l)) return; l.br=v; n++; SYNC.set.add(l); SYNC.addT=Date.now(); if(p&&ps.indexOf(p)<0){ ps.push(p); p.brand=v; l.pid=p.id; np++; } });
  if(!n){ toast(brOn()?'Nel confronto la marca si cambia nelle proposte qui sopra':'Nessuna voce di materiale a cui dare la marca'); return; }
  $('l-brall').value=''; renderLines(); renderProducts(); touch(); toast('Marca «'+v+'» su '+n+' voci'+(np?' e '+np+' schede prodotto':''));
});
