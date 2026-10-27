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
$('lines').addEventListener('change',function(e){
  if(e.target.getAttribute('data-f')!=='d') return; var row=e.target.closest('.line'); if(!row) return;
  var L=S.lines[+row.getAttribute('data-i')]; if(!L||!String(L.d||'').trim()) return;
  var p=L.pid?prodById(L.pid):null;
  var i=+row.getAttribute('data-i');
  if(p&&!p.man&&prodUsers(p).length<=1){ if(p.name!==String(L.d).trim()){ p.name=String(L.d).trim(); libFill(p,L); renderProducts(); lineChip(i); touch(); toast('Scheda prodotto aggiornata: '+p.name); } return; }
  var r=linkLine(L); if(r&&r.created){ renderProducts(); lineChip(i); touch(); toast('Scheda creata in Prodotti: '+r.p.name); } else lineChip(i);
});
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

