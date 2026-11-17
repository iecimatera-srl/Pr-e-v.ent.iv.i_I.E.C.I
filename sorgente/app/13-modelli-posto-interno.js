/* ===== Modelli alternativi del posto interno: proposti a richiesta, ognuno con il suo prezzo (fuori dal totale) ===== */
var VM_NOTE={'Monitor interno a colori 4,3" (economico)':'Schermo 4,3": essenziale, con chiamata, video e apriporta','Monitor interno a colori 7"':'Schermo 7" a colori, viva voce e apriporta','Monitor interno a colori 7" con memoria immagini':'Schermo 7" con memoria delle immagini dei visitatori','Monitor interno Wi-Fi con app':'Wi-Fi: si risponde anche dallo smartphone, ovunque','Monitor interno 10" touch Wi-Fi con app':'Schermo 10" touch, Wi-Fi e app, design di alta gamma','Posto interno citofono con cornetta':'Citofono con cornetta, semplice e affidabile','Posto interno citofono vivavoce':'Citofono vivavoce, senza cornetta','Posto interno citofono vivavoce a sfioramento':'Vivavoce con tasti a sfioramento, design moderno'};
var VM_PRE={video:['Monitor interno a colori 4,3" (economico)','Monitor interno Wi-Fi con app','Monitor interno 10" touch Wi-Fi con app'],cit:['Posto interno citofono vivavoce','Posto interno citofono vivavoce a sfioramento']};
var VM_BASE={video:'Monitor interno a colori 7"',cit:'Posto interno citofono con cornetta'};
function vmKinds(){ var m=vcMode(); if(m==='brands') return sysList().map(function(x){ return x.id; }); return m==='both'?['cit','video']:[m]; }
function vmKindOf(k){ if(k==='cit'||k==='video') return k; var x=sysById(k); return x&&x.k==='cit'?'cit':'video'; }
function vmTier(k){ if(vcMode()==='brands'){ var i=sysIdx(k); return i<0?null:i; } return vcMode()==='both'?(k==='cit'?0:1):null; }
function vmData(k){ if(!S.cond.vm||typeof S.cond.vm!=='object') S.cond.vm={show:true}; var v=S.cond.vm; if(!v[k]||typeof v[k]!=='object') v[k]={b:'',o:[]}; if(v[k].b==null) v[k].b=''; if(!Array.isArray(v[k].o)) v[k].o=[]; return v[k]; }
function vmPrice(name){ var p=null; (S.cat.vcit||[]).forEach(function(c){ if(c[0]===name&&p==null) p=num(c[2]); }); return p; }
function vmSet(v){ return v!==''&&v!=null&&!isNaN(parseFloat(String(v).replace(',','.'))); }
function vmBaseLine(k){ var t=vmTier(k), kk=vmKindOf(k), r=null;
  S.lines.forEach(function(l){ if(!r&&l.vbk===k&&!l.vm&&!l.off&&!l.opt) r=l; }); if(r) return r;
  S.lines.forEach(function(l){ if(r||l.vm||!l.pc||l.off||l.opt) return; if(t!=null&&!inTier(l,t)) return; if(vcMode()==='brands'&&l.sy&&l.sy!==k) return;
    var c=null; (S.cat.vcit||[]).forEach(function(x){ if(!c&&x[0]===l.d) c=x; }); if(c&&c[3]===VCG&&c[4]===kk) r=l; });
  return r; }
function vmIvaF(){ return 1+num(S.meta.iva)/100; }
function vmNetto(v,m){ return m==='inc'?num(v)/vmIvaF():r2(num(v)); }
function vmBP(k){ var d=vmData(k); if(vmSet(d.bp)) return vmNetto(d.bp,d.bpm); if(d.b){ var p=vmPrice(d.b); if(p!=null) return p; } var l=vmBaseLine(k); return l?r2(num(l.p)):null; }
function vmOP(o){ if(vmSet(o.p)) return vmNetto(o.p,o.pm); return o.d?vmPrice(o.d):null; }
function vmHas(o){ return !!(String(o.n||'').trim()||o.d); }
function vmOk(k,o){ return vmSet(o.s)||(vmOP(o)!=null&&vmBP(k)!=null); }
function vmDelta(k,o){ if(vmSet(o.s)) return r2(vmNetto(o.s,o.pm)); var a=vmOP(o), b=vmBP(k); return (a==null||b==null)?0:r2(a-b); }
function vmProd(k,nm){ if(vcMode()==='brands'){ var x=sysById(k); if(x) return sysProd(nm,'cad',x); return null; } return autoProd(nm,'cad',{sol:vcMode()==='both'?k:''}); }
function vmDn(o){ return String(o.n||'').trim()||o.d||'Nuovo modello'; }
function vmBn(d,k){ var n=String(d.bn||'').trim()||d.b; if(n) return n; var l=k!=null?vmBaseLine(k):null; return l?l.d:'Modello base'; }
function vmCands(k){ return (S.cat.vcit||[]).filter(function(c){ return c[3]===VCG&&c[4]===vmKindOf(k); }).map(function(c){ return c[0]; }); }
function vmCount(k){ return vmData(k).o.reduce(function(a,o){ return a+Math.max(0,parseInt(o.q,10)||0); },0); }
function vmClamp(){ Object.keys(S.cond.vm||{}).filter(function(k){ return k!=='show'&&typeof S.cond.vm[k]==='object'; }).forEach(function(k){ var d=vmData(k), n=vcN(), tot=0; d.o.forEach(function(o){ var q=Math.max(0,parseInt(o.q,10)||0); if(tot+q>n) q=Math.max(0,n-tot); o.q=q; tot+=q; }); }); }
function vmSync(){
  /* i modelli alternativi non entrano nel totale: restano una voce a parte (surplus) */
  S.lines=S.lines.filter(function(l){ return !l.vm; });
}
function vmExtra(){ return 0; }
function vmBase(j,t){
  if(!vcOn()) return t;
  var r; VM_OFF=true; try{ r=(j==null?totals():totals(j)); } finally { VM_OFF=false; } return r;
}
function vmIncl(d){ return r2(d*(econOn()?1:(1-num(S.meta.disc)/100))*(1+num(S.meta.iva)/100)); }
function vmBrand(name){ var p=null,nm=String(name||'').trim().toLowerCase(); S.products.forEach(function(x){ if(!p&&String(x.name||'').trim().toLowerCase()===nm) p=x; }); return p&&p.brand?p.brand:''; }
/* differenza dei modelli nel preventivo: IVA inclusa (come prima) oppure IVA esclusa, «+ IVA» */
function vmIvaInc(){ return !(S.cond.vm&&S.cond.vm.iva==='esc'); }
function vmShow(dl){ return vmIvaInc()?vmIncl(dl):r2(dl*(econOn()?1:(1-num(S.meta.disc)/100))); }
function vmIvaLbl(){ return vmIvaInc()?'IVA inclusa':'IVA esclusa'; }
/* il prezzo del modello alternativo, come lo scrivi (con o senza IVA), riportato a IVA esclusa */
function vmPrezzo(o){ if(vmSet(o.p)) return vmNetto(o.p,o.pm); if(o.d){ var lp=vmPrice(o.d); if(lp!=null) return lp; } if(vmSet(o.s)) return vmNetto(o.s,o.pm); return null; }
/* una sola scelta per ogni modello: se il prezzo è «IVA inclusa», il cliente vede il prezzo finale già ivato;
   se è «IVA esclusa», vede il prezzo con la scritta «+ IVA» */
function vmAmtP(net,o){ var inc=!!o&&o.pm==='inc'; if(inc) return eur(vmSet(o.p)?r2(num(o.p)):r2(net*vmIvaF()))+' IVA inclusa'; return eur(r2(net))+' + IVA'; }
function vmAmt(dl){ var v=vmShow(dl); return (v>0?'+ ':v<0?'− ':'')+eur(Math.abs(v))+(vmIvaInc()?'':' + IVA'); }
/* ogni modello (base e alternativi) ha la sua scheda prodotto: lì stanno foto e marca, così compaiono
   nella tabella dei modelli, nella scheda del fascicolo e nella sezione Prodotti */
function vmPOf(name){ var n=lcn(name); if(!n) return null; return S.products.filter(function(p){ return lcn(p.name)===n; })[0]||null; }
function vmPEnsure(k,name){
  name=String(name||'').trim(); if(!name) return null; var p=vmPOf(name); if(p) return p;
  vmProd(k,name); p=vmPOf(name);
  if(!p){ p={id:uid(),name:name,brand:'',code:'',desc:'',specs:'',link:'',tags:'',photos:[],sol:vcMode()==='both'?k:''}; if(vcMode()==='brands') p.sys=k; S.products.push(p); }
  return p;
}
function vmNomeDi(k,i){ var d=vmData(k); if(i==='b'){ var bl=vmBaseLine(k); return bl?String(bl.d||'').trim():vmBn(d,k); } var o=d.o[+i]; return o&&vmHas(o)?vmDn(o):''; }
function vmPDi(k,i,crea){ var d=vmData(k); if(i==='b'){ var bl=vmBaseLine(k), pb=bl?prodOfLine(bl):null; if(pb) return pb; } var nm=vmNomeDi(k,i); return crea?vmPEnsure(k,nm):vmPOf(nm); }
function vmImg(u){ VMI.push(u); return '@@VMI'+(VMI.length-1)+':'+u.length+u.slice(-16).replace(/[@<>"]/g,'')+'@@'; }
var VMI=[];
function vmMedia(k,i){
  var nm=vmNomeDi(k,i), p=vmPDi(k,i,false), ph=(p&&p.photos)||[], br=p?String(p.brand||'').trim():'', lg=br?brandLogo(br):'', id=k+':'+i;
  if(!nm) return '<div class="vmm vmm-0">Scrivi il nome del modello: poi puoi aggiungere foto, marca e logo.</div>';
  return '<div class="vmm"><div class="vmm-lg"><div class="vmm-lgp">'+(lg?'<img src="'+vmImg(lg)+'" alt="'+esc(br)+'">':'<span>'+(br?esc(br.slice(0,2).toUpperCase()):'Logo')+'</span>')+'</div>'+
    '<div class="vmm-lgt"><label class="f">Marca<input type="text" data-vmf="br:'+id+'" value="'+esc(br)+'" placeholder="es. BTicino, Comelit, Urmet" autocomplete="off"></label>'+
    '<div class="vmm-b"><label class="btn ghost sm">'+(lg?'Cambia logo':'Carica logo')+'<input type="file" accept="image/*" data-vmlg="'+id+'" hidden></label>'+(navigator.onLine!==false?'<button type="button" class="btn ghost sm" data-vm="lgw:'+id+'">Cerca il logo sul web</button>':'')+'</div></div></div>'+
    '<div class="vmm-ph">'+ph.map(function(u,j){ return '<span class="vmm-t"><img src="'+vmImg(u)+'" alt="Foto '+(j+1)+'"><button type="button" data-vm="phx:'+id+':'+j+'" aria-label="Togli questa foto">×</button></span>'; }).join('')+
      (ph.length<MAXPH?'<label class="vmm-add" title="Aggiungi foto del modello"><input type="file" accept="image/*" multiple data-vmph="'+id+'" hidden><b>+</b><small>Foto</small></label>':'')+
      (navigator.onLine!==false?'<button type="button" class="btn ghost sm" data-vm="phw:'+id+'">Cerca foto sul web</button>':'')+'</div>'+
    (function(){ var bm=(p&&p.bg)||(cutOn()?'cut':'keep'); return '<div class="vmbg"><span class="hint">Sfondo delle foto:</span><button type="button" class="tab" data-vm="bg:'+id+':cut" aria-pressed="'+(bm==='cut')+'">Senza sfondo, con alone</button><button type="button" class="tab" data-vm="bg:'+id+':keep" aria-pressed="'+(bm==='keep')+'">Con sfondo originale</button></div>'; })()+'</div>';
}
function vmPmSel(k,i,m){ var inc=m==='inc'; return '<div class="vmpm" role="group" aria-label="Il prezzo che scrivi è"><button type="button" class="tab" data-vm="pm:'+k+':'+i+':esc" aria-pressed="'+!inc+'">IVA esclusa</button><button type="button" class="tab" data-vm="pm:'+k+':'+i+':inc" aria-pressed="'+inc+'">IVA inclusa</button></div>'; }
function vmPmAltro(v,m){ if(v==null||v==='') return ''; var n=m==='inc'?num(v)/vmIvaF():num(v); return '<small class="vmpm-a">'+(m==='inc'?'= '+eur(n)+' + IVA':'= '+eur(n*vmIvaF())+' IVA inclusa')+'</small>'; }
/* dicitura accanto al prezzo del modello alternativo (per i condomini: è un prezzo IN PIÙ rispetto alla propria quota) */
var VM_DIC=['in più rispetto alla propria quota','da aggiungere alla propria quota condominiale','supplemento a carico del singolo condomino'];
function vmDicHtml(o){ var d=String(o.dic||'').trim(); return d?'<small class="vmdc">'+esc(d)+'</small>':''; }
function vmDiffTxt(inc){ return inc>0?'+ '+eur(inc):(inc<0?'− '+eur(-inc):'Stesso prezzo'); }
function vmWord(k){ return vmKindOf(k)==='cit'?'citofono':'monitor'; }
function vmSurTxt(k,dl){ var w=vmWord(k); if(!dl) return 'Stesso prezzo del modello base'; return (dl>0?'Surplus per questo ':'Riduzione per questo ')+w+': '+vmAmt(dl)+(vmIvaInc()?' IVA inclusa':''); }
function vmBox(onlyK){
  if(!vcOn()||S.cond.show===false||(S.cond.vm&&S.cond.vm.show===false)) return '';
  var out='';
  vmKinds().forEach(function(k){
    if(onlyK&&k!==onlyK) return;
    var d=vmData(k), os=d.o.filter(vmHas); if(!os.length) return;
    var w=vmWord(k), h='';
    var row=function(name,note,p,right,sub){ var br=p?String(p.brand||'').trim():'', lg=br?brandLogo(br):'', ph=p&&p.photos&&p.photos[0];
      return '<div class="vmr vm2"><div class="vmn">'+(ph?'<img class="vmth" src="'+ph+'" alt="">':'')+'<div>'+(lg?'<img class="vmlg" src="'+lg+'" alt="'+esc(br)+'">':'')+'<b>'+esc(name)+'</b>'+(note?'<small>'+esc(note)+'</small>':'')+(br&&!lg?'<small>Marca: '+esc(br)+'</small>':'')+(sub?'<small class="vmx">'+sub+'</small>':'')+'</div></div><div class="vmq">'+right+'</div></div>'; };
    h+='<div class="vmr vm2 vmhd"><div>Modello</div><div class="vmq">Prezzo per '+w+'</div></div>';
    os.forEach(function(o){ var pr=vmPrezzo(o); h+=row(vmDn(o),o.t||VM_NOTE[o.d]||'',vmPOf(vmDn(o))||vmPOf(o.d),pr!=null?vmAmtP(pr,o)+vmDicHtml(o):'Su richiesta',''); });
    var title=(vcMode()==='both'?vcSolName(k)+' · ':'')+'Modelli alternativi del '+(w==='monitor'?'monitor':'citofono')+', a richiesta';
    out+='<div class="vcbox vmbox"><div class="vh">'+esc(title)+'</div>'+h+'<div class="vs">I modelli alternativi sono a richiesta e non sono compresi nel totale del preventivo. Il prezzo indicato è per ogni '+w+'.</div></div>';
  });
  return out;
}
var VMI0=[];
function renderVm(){
  var el=$('vc-vm'); if(!el) return; VMI=[]; VMI0=VMI;
  if(!vcOn()){ el.innerHTML=''; el.removeAttribute('data-k'); return; }
  var sg=function(v){ return v>0?'+ ':(v<0?'− ':''); };
  var h='<div class="vmp"><b>Modelli alternativi del posto interno</b><small>Aggiungi i modelli da proporre a richiesta, con nome, prezzo, foto e caratteristiche. Non entrano nel totale: il preventivo li mostra a parte, ognuno con il suo prezzo.</small>';
  vmKinds().forEach(function(k){
    var d=vmData(k), cands=vmCands(k), n=vcN(), left=Math.max(0,n-vmCount(k)), bl=vmBaseLine(k), bp=vmBP(k);
    var optSel=function(cur,attr){ var l=cands.slice(); if(cur&&l.indexOf(cur)<0) l.push(cur); return '<select '+attr+'><option value=""'+(cur?'':' selected')+'>Nessuno: lo scrivo io</option>'+l.map(function(c){ var p=vmPrice(c); return '<option value="'+esc(c)+'"'+(c===cur?' selected':'')+'>'+esc(c)+(p!=null?' · '+eur(p):'')+'</option>'; }).join('')+'</select>'; };
    var bpPh=d.b&&vmPrice(d.b)!=null?vmPrice(d.b):(bl?num(bl.p):null);
    h+='<div class="vms"><div class="vmt">'+(vcMode()==='brands'?esc(sysName(sysById(k)||{},sysIdx(k))):(k==='cit'?'Citofono':'Videocitofono')+(vcMode()==='both'?' · soluzione '+(k==='cit'?'«Solo citofono»':'«Videocitofono»'):''))+'</div>';
    d.o.forEach(function(o,i){
      var pr=vmPrezzo(o), lp=o.d?vmPrice(o.d):null;
      h+='<div class="vmo"><div class="vmo-h"><b>Modello alternativo '+(i+1)+'</b><button type="button" class="btn ghost sm" data-vm="del:'+k+':'+i+'" aria-label="Elimina questo modello">Elimina</button></div>'+
        '<label class="f">Nome del modello<input type="text" data-vmf="n:'+k+':'+i+'" value="'+esc(o.n||'')+'" placeholder="'+esc(o.d||'es. Monitor 10" Wi-Fi')+'"></label>'+
        (function(){ var m=o.pm==='inc'?'inc':'', F=m?vmIvaF():1;
          return '<div class="vmpr"><label class="f">Prezzo per posto interno (€, '+(m?'IVA inclusa':'IVA esclusa')+')<input type="number" step="any" min="0" inputmode="decimal" data-vmf="p:'+k+':'+i+'" value="'+esc(vmSet(o.p)?o.p:'')+'" placeholder="'+(lp!=null?fmt.format(r2(lp*F)):'es. 260')+'"></label>'+vmPmSel(k,i,m)+vmPmAltro(vmSet(o.p)?o.p:'',m)+'</div>'; })()+
        '<div class="vmdic"><label class="f">Dicitura accanto al prezzo<input type="text" maxlength="90" data-vmf="dic:'+k+':'+i+'" value="'+esc(o.dic||'')+'" placeholder="es. in più rispetto alla propria quota"></label>'+
          '<div class="vmdic-c">'+VM_DIC.map(function(t2,j){ return '<button type="button" class="pchip'+(o.dic===t2?' on':'')+'" data-vm="dic:'+k+':'+i+':'+j+'">'+esc(t2)+'</button>'; }).join('')+(o.dic?'<button type="button" class="pchip" data-vm="dic:'+k+':'+i+':x">Nessuna dicitura</button>':'')+'</div></div>'+
        '<label class="f">Caratteristiche da mostrare al cliente<input type="text" data-vmf="t:'+k+':'+i+'" value="'+esc(o.t||'')+'" placeholder="'+esc(VM_NOTE[o.d]||'es. schermo 10" touch, Wi-Fi e app')+'"></label>'+
        vmMedia(k,i)+
        '<details class="vmadv"'+(o.d?' open':'')+'><summary>Prendi dal listino (facoltativo)</summary>'+
          '<label class="f">Modello del listino'+optSel(o.d,'data-vmf="d:'+k+':'+i+'"')+'</label></details>'+
        '<div class="hint">'+(!vmHas(o)?'Scrivi il nome del modello.':pr==null?'Scrivi il prezzo del modello.':'Nel preventivo: <b>'+vmAmtP(pr,o)+'</b>'+(String(o.dic||'').trim()?' «'+esc(o.dic)+'»':' per ogni '+vmWord(k))+'. Non entra nel totale.')+'</div></div>';
    });
    h+='<div class="row"><button type="button" class="btn ghost" data-vm="add:'+k+':0">+ Aggiungi un modello alternativo</button></div>'+
      (d.o.length?'<div class="hint">Nel preventivo i modelli alternativi compaiono in una voce a parte, ognuno con il suo prezzo: il totale non cambia.</div>':'')+'</div>';
  });
  h+='<label class="chk"><input type="checkbox" id="vm-show"'+(S.cond.vm&&S.cond.vm.show===false?'':' checked')+'>Mostra la scelta dei modelli nel preventivo</label></div>';
  var key=h; VMI=[];
  if(el.getAttribute('data-k')!==key){ var IM=VMI0; morph(el,docImgs(h.replace(/@@VMI(\d+):[^@]*@@/g,function(m,n){ return IM[+n]||''; }))); el.setAttribute('data-k',key); }
}
(function(){
  var w=$('vc-vm'); if(!w) return;
  function after(){ vmClamp(); vmSync(); renderLines(); renderTiers(); renderEcon(); renderProducts(); renderVc(); touch(); }
  w.addEventListener('click',function(e){
    var t=e.target.closest('[data-vm]'); if(!t) return; var a=t.getAttribute('data-vm').split(':'), act=a[0], k=a[1], i=+a[2];
    if(act==='iva'){ if(!S.cond.vm||typeof S.cond.vm!=='object') S.cond.vm={show:true}; S.cond.vm.iva=k==='esc'?'esc':'inc'; renderVm(); renderProducts(); touch(); toast(k==='esc'?'Prezzi dei modelli senza IVA, con «+ IVA»':'Prezzi dei modelli con l\'IVA inclusa'); return; }
    if(act==='pm'){ var md=a[3]==='inc'?'inc':'', dd=vmData(k), F=vmIvaF();
      if(a[2]==='b'){ if((dd.bpm==='inc'?'inc':'')===md) return; if(vmSet(dd.bp)) dd.bp=r2(md?num(dd.bp)*F:num(dd.bp)/F); dd.bpm=md; }
      else { var oo=dd.o[+a[2]]; if(!oo||(oo.pm==='inc'?'inc':'')===md) return; if(vmSet(oo.p)) oo.p=r2(md?num(oo.p)*F:num(oo.p)/F); if(vmSet(oo.s)) oo.s=r2(md?num(oo.s)*F:num(oo.s)/F); oo.pm=md; }
      after(); toast(md?'Prezzo con IVA inclusa: nel preventivo il cliente vede il prezzo finale già ivato':'Prezzo senza IVA: nel preventivo compare con «+ IVA»'); return; }
    if(act==='dic'){ var od=vmData(k).o[+a[2]]; if(!od) return; od.dic=a[3]==='x'?'':(VM_DIC[+a[3]]||''); after(); return; }
    if(act==='bg'){ var pb=vmPDi(k,a[2],true); if(!pb) return; setBg(S.products.indexOf(pb),a[3]==='keep'?'keep':'cut',function(){ renderVm(); renderDoc(); }); renderVm(); return; }
    if(act==='phx'||act==='phw'||act==='lgw'){ var pp=vmPDi(k,a[2],true); if(!pp) return;
      if(act==='phx'){ var j=+a[3]; (pp.photos||[]).splice(j,1); if(pp.po) pp.po.splice(j,1); renderVm(); renderProducts(); touch(); return; }
      if(act==='phw'){ iwProd(S.products.indexOf(pp)); return; }
      if(!String(pp.brand||'').trim()){ toast('Scrivi prima la marca del modello'); var inp=w.querySelector('[data-vmf="br:'+k+':'+a[2]+'"]'); if(inp) inp.focus(); return; }
      iwBrandLogo(pp.brand,function(){ renderVm(); }); return; }
    var d=vmData(k);
    if(act==='add'){
      var ul=d.o[d.o.length-1]; d.o.push({id:uid(),d:'',n:'',p:'',q:0,s:'',t:'',dic:ul&&ul.dic?ul.dic:'',pm:ul&&ul.pm?ul.pm:''});
    } else if(act==='del'){ d.o.splice(i,1); }
    else if(act==='up'||act==='dn'){ var o=d.o[i]; if(!o) return; o.q=Math.max(0,(parseInt(o.q,10)||0)+(act==='up'?1:-1)); }
    else if(act==='pre'){
      if(d.o.length&&!confirm('Sostituisco i modelli alternativi già inseriti con quelli tipici?')) return;
      var have=vmCands(k); d.b=VM_BASE[k]; d.o=[];
      VM_PRE[k].forEach(function(nm){ if(have.indexOf(nm)>-1){ d.o.push({id:uid(),d:nm,q:0,s:'',t:''}); vmProd(k,nm); } });
      if(!d.o.length){ toast('Nel listino mancano i modelli tipici: aggiungili dal listino'); return; }
    } else return;
    after();
  });
  w.addEventListener('change',function(e){
    var t=e.target, fa;
    if((fa=t.getAttribute('data-vmph'))){ var fs=t.files; var q=fa.split(':'), p1=vmPDi(q[0],q[1],true); if(!p1||!fs||!fs.length) return; if(!p1.photos) p1.photos=[]; if(!p1.po) p1.po=[];
      addPhotos(p1.photos,MAXPH,fs,function(){ t.value=''; renderVm(); renderProducts(); touch(); toast('Foto aggiunte al modello «'+p1.name+'»'); },p1.po,p1.bg); return; }
    if((fa=t.getAttribute('data-vmlg'))){ var f2=t.files&&t.files[0]; t.value=''; var q2=fa.split(':'), p2=vmPDi(q2[0],q2[1],true); if(!p2||!f2) return;
      var br2=iwBase(p2.brand||''); if(!String(br2||'').trim()){ toast('Scrivi prima la marca del modello: il logo vale per quella marca'); return; }
      iwLogoData(f2,function(dl){ if(!dl){ toast('Immagine non valida'); return; } iwSaveLogo(br2,dl,'',''); iwRefresh(); renderVm(); toast('Logo «'+br2+'» salvato: vale per tutti i preventivi'); }); return; }
    if(t.id==='vm-show'){ if(!S.cond.vm) S.cond.vm={}; S.cond.vm.show=t.checked; touch(); return; }
    var f=t.getAttribute('data-vmf'); if(!f) return; var a=f.split(':'), fld=a[0], k=a[1], i=+a[2], d=vmData(k);
    if(fld==='br'){ var p3=vmPDi(k,a[2],true); if(!p3) return; p3.brand=t.value.trim(); try{ brDatalist(); iwSoon(); }catch(x){} renderVm(); renderProducts(); touch(); return; }
    if(fld==='b'){ d.b=t.value; if(d.b) vmProd(k,d.b); }
    else if(fld==='bp'){ var bl=vmBaseLine(k); if(bl&&t.value.trim()!==''){ bl.vbk=k; bl.p=d.bpm==='inc'?Math.round(num(t.value)/vmIvaF()*10000)/10000:num(t.value); d.bp=''; } else d.bp=t.value.trim()===''?'':num(t.value); }
    else if(fld==='bn'){ d.bn=t.value.trim(); var bl2=vmBaseLine(k); if(bl2&&d.bn){ bl2.vbk=k; bl2.d=d.bn; vmProd(k,d.bn); } }
    else if(fld==='bt') d.bt=t.value.trim();
    else { var o=d.o[i]; if(!o) return;
      if(fld==='d'){ o.d=t.value; if(o.d){ if(!o.t) o.t=''; vmProd(k,o.d); } }
      else if(fld==='s') o.s=t.value.trim()===''?'':num(t.value);
      else if(fld==='q') o.q=Math.max(0,parseInt(t.value,10)||0);
      else if(fld==='t') o.t=t.value.trim();
      else if(fld==='dic') o.dic=t.value.trim().slice(0,90);
      else if(fld==='n'){ var vec=vmHas(o)?vmDn(o):'', pv=vec?vmPOf(vec):null; o.n=t.value.trim(); var nuovo=vmDn(o);
        if(pv&&o.n&&lcn(vec)!==lcn(nuovo)&&!vmPOf(nuovo)&&!S.lines.some(function(l){ return lcn(l.d)===lcn(vec); })) pv.name=nuovo; else if(o.n&&!o.d) vmProd(k,o.n); }
      else if(fld==='p') o.p=t.value.trim()===''?'':num(t.value); }
    after();
  });
})();


