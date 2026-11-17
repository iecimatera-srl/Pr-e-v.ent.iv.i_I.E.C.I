/* ===== Modelli del posto interno: variante con differenza di prezzo ===== */
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
function vmBP(k){ var d=vmData(k); if(vmSet(d.bp)) return r2(num(d.bp)); if(d.b){ var p=vmPrice(d.b); if(p!=null) return p; } var l=vmBaseLine(k); return l?r2(num(l.p)):null; }
function vmOP(o){ if(vmSet(o.p)) return r2(num(o.p)); return o.d?vmPrice(o.d):null; }
function vmHas(o){ return !!(String(o.n||'').trim()||o.d); }
function vmOk(k,o){ return vmSet(o.s)||(vmOP(o)!=null&&vmBP(k)!=null); }
function vmDelta(k,o){ if(vmSet(o.s)) return r2(num(o.s)); var a=vmOP(o), b=vmBP(k); return (a==null||b==null)?0:r2(a-b); }
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
      (navigator.onLine!==false?'<button type="button" class="btn ghost sm" data-vm="phw:'+id+'">Cerca foto sul web</button>':'')+'</div></div>';
}
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
    h+='<div class="vmr vm2 vmhd"><div>Modello</div><div class="vmq">Surplus per '+w+', '+vmIvaLbl()+'</div></div>';
    var bl=vmBaseLine(k); h+=row(vmBn(d,k),d.bt||VM_NOTE[d.b]||'',(bl&&prodOfLine(bl))||vmPOf(d.b||vmBn(d,k)),'Incluso nel prezzo','');
    os.forEach(function(o,i){ var dl=vmDelta(k,o); h+=row(vmDn(o),o.t||VM_NOTE[o.d]||'',vmPOf(vmDn(o))||vmPOf(o.d),dl?vmAmt(dl):'—',vmSurTxt(k,dl)); });
    var title=(vcMode()==='both'?vcSolName(k)+' · ':'')+'Modelli alternativi del '+(w==='monitor'?'monitor':'citofono')+', a richiesta';
    out+='<div class="vcbox vmbox"><div class="vh">'+esc(title)+'</div>'+h+'<div class="vs">I modelli alternativi non sono compresi nel totale del preventivo. Chi sceglie un modello diverso da quello incluso aggiunge il surplus indicato (o detrae la riduzione), per ogni '+w+(vmIvaInc()?'':', più IVA')+'.</div></div>';
  });
  return out;
}
var VMI0=[];
function renderVm(){
  var el=$('vc-vm'); if(!el) return; VMI=[]; VMI0=VMI;
  if(!vcOn()){ el.innerHTML=''; el.removeAttribute('data-k'); return; }
  var sg=function(v){ return v>0?'+ ':(v<0?'− ':''); };
  var h='<div class="vmp"><b>Modelli del posto interno</b><small>Crei tu i modelli da proporre, con nome, prezzo e caratteristiche. Il totale resta quello del modello base; per gli altri modelli il preventivo indica a parte il surplus.</small>';
  vmKinds().forEach(function(k){
    var d=vmData(k), cands=vmCands(k), n=vcN(), left=Math.max(0,n-vmCount(k)), bl=vmBaseLine(k), bp=vmBP(k);
    var optSel=function(cur,attr){ var l=cands.slice(); if(cur&&l.indexOf(cur)<0) l.push(cur); return '<select '+attr+'><option value=""'+(cur?'':' selected')+'>Nessuno: lo scrivo io</option>'+l.map(function(c){ var p=vmPrice(c); return '<option value="'+esc(c)+'"'+(c===cur?' selected':'')+'>'+esc(c)+(p!=null?' · '+eur(p):'')+'</option>'; }).join('')+'</select>'; };
    var bpPh=d.b&&vmPrice(d.b)!=null?vmPrice(d.b):(bl?num(bl.p):null);
    h+='<div class="vms"><div class="vmt">'+(vcMode()==='brands'?esc(sysName(sysById(k)||{},sysIdx(k))):(k==='cit'?'Citofono':'Videocitofono')+(vcMode()==='both'?' · soluzione '+(k==='cit'?'«Solo citofono»':'«Videocitofono»'):''))+'</div>'+
      '<div class="vmo vmb"><div class="vmo-h"><b>Modello base, incluso nel prezzo</b></div>'+
      '<label class="f">Nome del modello<input type="text" data-vmf="bn:'+k+':0" value="'+esc(d.bn||(bl&&bl.vbk===k?bl.d:''))+'" placeholder="'+esc(d.b||(bl?bl.d:'es. Monitor 7" vivavoce'))+'"></label>'+
      '<div class="grid2"><label class="f">Prezzo per posto interno (€, IVA esclusa)<input type="number" step="any" min="0" inputmode="decimal" data-vmf="bp:'+k+':0" value="'+esc(vmSet(d.bp)?d.bp:(bl?num(bl.p):''))+'" placeholder="'+(bpPh!=null?fmt.format(bpPh):'es. 180')+'"></label>'+
      '<label class="f">Caratteristiche<input type="text" data-vmf="bt:'+k+':0" value="'+esc(d.bt||'')+'" placeholder="'+esc(VM_NOTE[d.b]||'es. schermo 7", vivavoce')+'"></label></div>'+
      '<div class="hint">'+(bl?'Nome e prezzo del modello base sono quelli della riga «'+esc(bl.d)+'» del preventivo: se li cambi qui, cambia anche la riga.':'Scrivi il prezzo del modello base, così l\'app calcola le differenze. Con «Aggiungi le voci tipiche» il modello base diventa una riga del preventivo.')+'</div>'+
      vmMedia(k,'b')+
      '<details class="vmadv"'+(d.b?' open':'')+'><summary>Prendi dal listino (facoltativo)</summary><label class="f">Modello del listino'+optSel(d.b,'data-vmf="b:'+k+':0"')+'</label></details></div>';
    d.o.forEach(function(o,i){
      var dl=vmDelta(k,o), q=Math.max(0,parseInt(o.q,10)||0), ok=vmOk(k,o), op=vmOP(o), lp=o.d?vmPrice(o.d):null, auto=(op!=null&&bp!=null)?r2(op-bp):null;
      h+='<div class="vmo"><div class="vmo-h"><b>Modello alternativo '+(i+1)+'</b><button type="button" class="btn ghost sm" data-vm="del:'+k+':'+i+'" aria-label="Elimina questo modello">Elimina</button></div>'+
        '<label class="f">Nome del modello<input type="text" data-vmf="n:'+k+':'+i+'" value="'+esc(o.n||'')+'" placeholder="'+esc(o.d||'es. Monitor 10" Wi-Fi')+'"></label>'+
        '<div class="grid2"><label class="f">Prezzo per posto interno (€, IVA esclusa)<input type="number" step="any" min="0" inputmode="decimal" data-vmf="p:'+k+':'+i+'" value="'+esc(vmSet(o.p)?o.p:'')+'" placeholder="'+(lp!=null?fmt.format(lp):'es. 260')+'"></label>'+
        '</div>'+
        '<label class="f">Caratteristiche da mostrare al cliente<input type="text" data-vmf="t:'+k+':'+i+'" value="'+esc(o.t||'')+'" placeholder="'+esc(VM_NOTE[o.d]||'es. schermo 10" touch, Wi-Fi e app')+'"></label>'+
        vmMedia(k,i)+
        '<details class="vmadv"'+(o.d||vmSet(o.s)?' open':'')+'><summary>Altre opzioni: listino o differenza a mano</summary>'+
          '<label class="f">Prendi dal listino (facoltativo)'+optSel(o.d,'data-vmf="d:'+k+':'+i+'"')+'</label>'+
          '<label class="f">Differenza scritta a mano (€, IVA esclusa)<input type="number" step="any" inputmode="decimal" data-vmf="s:'+k+':'+i+'" value="'+esc(vmSet(o.s)?o.s:'')+'" placeholder="'+(auto!=null?'auto: '+sg(auto)+fmt.format(Math.abs(auto)):'es. +80 oppure -40')+'"></label></details>'+
        '<div class="hint">'+(!vmHas(o)?'Scrivi il nome del modello.':!ok?'Scrivi il prezzo di questo modello'+(bp==null?' e del modello base':'')+', oppure la differenza a mano.':(dl>0?'Surplus per questo '+vmWord(k):dl<0?'Riduzione per questo '+vmWord(k):'Stesso prezzo del base')+(dl?': <b>'+sg(dl)+eur(Math.abs(dl))+'</b> + IVA ('+sg(dl)+eur(Math.abs(vmIncl(dl)))+' IVA inclusa). Nel preventivo: <b>'+vmAmt(dl)+(vmIvaInc()?' IVA inclusa':'')+'</b>. Non entra nel totale.':''))+'</div></div>';
    });
    h+='<div class="row"><button type="button" class="btn ghost" data-vm="add:'+k+':0">+ Aggiungi un modello alternativo</button></div>'+
      (d.o.length?'<div class="hint">Nel preventivo i modelli alternativi compaiono in una voce a parte con il loro surplus: il totale resta quello del modello base.</div>':'')+'</div>';
  });
  var inc=vmIvaInc();
  h+='<div class="vmiva"><span><b>Differenza di prezzo nel preventivo</b><small>'+(inc?'Il cliente vede il surplus già con l\'IVA.':'Il cliente vede il surplus senza IVA, con la scritta «+ IVA».')+'</small></span><div class="tabs vmiva-t" role="group" aria-label="IVA della differenza"><button type="button" class="tab" data-vm="iva:inc:0" aria-pressed="'+inc+'">IVA inclusa</button><button type="button" class="tab" data-vm="iva:esc:0" aria-pressed="'+!inc+'">IVA esclusa (+ IVA)</button></div></div>';
  h+='<label class="chk"><input type="checkbox" id="vm-show"'+(S.cond.vm&&S.cond.vm.show===false?'':' checked')+'>Mostra la scelta dei modelli nel preventivo</label></div>';
  var key=h; VMI=[];
  if(el.getAttribute('data-k')!==key){ var IM=VMI0; morph(el,docImgs(h.replace(/@@VMI(\d+):[^@]*@@/g,function(m,n){ return IM[+n]||''; }))); el.setAttribute('data-k',key); }
}
(function(){
  var w=$('vc-vm'); if(!w) return;
  function after(){ vmClamp(); vmSync(); renderLines(); renderTiers(); renderEcon(); renderProducts(); renderVc(); touch(); }
  w.addEventListener('click',function(e){
    var t=e.target.closest('[data-vm]'); if(!t) return; var a=t.getAttribute('data-vm').split(':'), act=a[0], k=a[1], i=+a[2];
    if(act==='iva'){ if(!S.cond.vm||typeof S.cond.vm!=='object') S.cond.vm={show:true}; S.cond.vm.iva=k==='esc'?'esc':'inc'; renderVm(); renderProducts(); touch(); toast(k==='esc'?'Differenze dei modelli senza IVA, con «+ IVA»':'Differenze dei modelli con l\'IVA inclusa'); return; }
    if(act==='phx'||act==='phw'||act==='lgw'){ var pp=vmPDi(k,a[2],true); if(!pp) return;
      if(act==='phx'){ var j=+a[3]; (pp.photos||[]).splice(j,1); if(pp.po) pp.po.splice(j,1); renderVm(); renderProducts(); touch(); return; }
      if(act==='phw'){ iwProd(S.products.indexOf(pp)); return; }
      if(!String(pp.brand||'').trim()){ toast('Scrivi prima la marca del modello'); var inp=w.querySelector('[data-vmf="br:'+k+':'+a[2]+'"]'); if(inp) inp.focus(); return; }
      iwBrandLogo(pp.brand,function(){ renderVm(); }); return; }
    var d=vmData(k);
    if(act==='add'){
      d.o.push({id:uid(),d:'',n:'',p:'',q:0,s:'',t:''});
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
    else if(fld==='bp'){ var bl=vmBaseLine(k); if(bl&&t.value.trim()!==''){ bl.vbk=k; bl.p=num(t.value); d.bp=''; } else d.bp=t.value.trim()===''?'':num(t.value); }
    else if(fld==='bn'){ d.bn=t.value.trim(); var bl2=vmBaseLine(k); if(bl2&&d.bn){ bl2.vbk=k; bl2.d=d.bn; vmProd(k,d.bn); } }
    else if(fld==='bt') d.bt=t.value.trim();
    else { var o=d.o[i]; if(!o) return;
      if(fld==='d'){ o.d=t.value; if(o.d){ if(!o.t) o.t=''; vmProd(k,o.d); } }
      else if(fld==='s') o.s=t.value.trim()===''?'':num(t.value);
      else if(fld==='q') o.q=Math.max(0,parseInt(t.value,10)||0);
      else if(fld==='t') o.t=t.value.trim();
      else if(fld==='n'){ var vec=vmHas(o)?vmDn(o):'', pv=vec?vmPOf(vec):null; o.n=t.value.trim(); var nuovo=vmDn(o);
        if(pv&&o.n&&lcn(vec)!==lcn(nuovo)&&!vmPOf(nuovo)&&!S.lines.some(function(l){ return lcn(l.d)===lcn(vec); })) pv.name=nuovo; else if(o.n&&!o.d) vmProd(k,o.n); }
      else if(fld==='p') o.p=t.value.trim()===''?'':num(t.value); }
    after();
  });
})();


