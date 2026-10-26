/* ---------- foto prodotto senza sfondo ---------- */
function cutOn(){ return APP.cut!=='off'; }
function cutTol(){ return APP.cutt||38; }
function cutout(url,cb,tol){
  var T=tol||cutTol(), im=new Image();
  im.onload=function(){ try{
    var W0=im.naturalWidth,H0=im.naturalHeight, sc=Math.min(1,1000/Math.max(W0,H0)), w=Math.max(2,Math.round(W0*sc)), h=Math.max(2,Math.round(H0*sc)), n=w*h, i,j,k;
    var c=document.createElement('canvas'); c.width=w; c.height=h; var x=c.getContext('2d'); x.drawImage(im,0,0,w,h);
    var id=x.getImageData(0,0,w,h), d=id.data;
    if(d[3]<12&&d[(w-1)*4+3]<12&&d[(n-1)*4+3]<12) return cb(url,true);
    /* sfondo: colori dominanti sul bordo */
    var bins={}, tot=0, ring=Math.max(2,Math.round(Math.min(w,h)*0.006));
    function samp(px,py){ var p=(py*w+px)*4, key=(d[p]>>4)+','+(d[p+1]>>4)+','+(d[p+2]>>4), b=bins[key]; if(!b) b=bins[key]={n:0,r:0,g:0,b:0}; b.n++; b.r+=d[p]; b.g+=d[p+1]; b.b+=d[p+2]; tot++; }
    for(i=0;i<w;i++) for(j=0;j<ring;j++){ samp(i,j); samp(i,h-1-j); }
    for(j=0;j<h;j++) for(i=0;i<ring;i++){ samp(i,j); samp(w-1-i,j); }
    var refs=Object.keys(bins).map(function(k){ return bins[k]; }).sort(function(a,b){ return b.n-a.n; }).filter(function(b){ return b.n>=tot*0.06; }).slice(0,4).map(function(b){ return [b.r/b.n,b.g/b.n,b.b/b.n]; });
    if(!refs.length) return cb(url,false);
    var dist=new Float32Array(n), gray=new Float32Array(n), sat=new Uint8Array(n);
    for(i=0;i<n;i++){ var r=d[i*4],g=d[i*4+1],b=d[i*4+2], m=1e9; for(k=0;k<refs.length;k++){ var dr=r-refs[k][0],dg=g-refs[k][1],db=b-refs[k][2], q=Math.sqrt(dr*dr+dg*dg+db*db); if(q<m) m=q; } dist[i]=m; gray[i]=0.299*r+0.587*g+0.114*b; sat[i]=Math.max(r,g,b)-Math.min(r,g,b); }
    /* sfumatura 3x3 e gradiente */
    var bl=new Float32Array(n), gr=new Float32Array(n);
    for(j=0;j<h;j++) for(i=0;i<w;i++){ var s0=0,c0=0; for(var yy=Math.max(0,j-1);yy<=Math.min(h-1,j+1);yy++) for(var xx=Math.max(0,i-1);xx<=Math.min(w-1,i+1);xx++){ s0+=gray[yy*w+xx]; c0++; } bl[j*w+i]=s0/c0; }
    for(j=0;j<h-1;j++) for(i=0;i<w-1;i++){ var p0=j*w+i; gr[p0]=Math.max(Math.abs(bl[p0+1]-bl[p0]),Math.abs(bl[p0+w]-bl[p0])); }
    var G=Math.max(8,T*0.42), G2=4.5;
    var neutral=refs.every(function(r){ return Math.max(r[0],r[1],r[2])-Math.min(r[0],r[1],r[2])<=30; }), rgs=refs.map(function(r){ return 0.299*r[0]+0.587*r[1]+0.114*r[2]; });
    function ok(p){ var dd=dist[p], g=gr[p]; if(dd<=T&&g<=G) return true; if(dd<=T*2.1&&g<=G2&&sat[p]<=34) return true;
      if(neutral&&sat[p]<=30&&g<=3.2){ var gg=gray[p]; for(var q=0;q<rgs.length;q++){ var df=rgs[q]-gg; if(df>=-3&&df<=125) return true; } } return false; }
    var bg=new Uint8Array(n), st=new Int32Array(n), sp=0;
    function push(p){ if(!bg[p]&&ok(p)){ bg[p]=1; st[sp++]=p; } }
    for(i=0;i<w;i++){ push(i); push((h-1)*w+i); } for(j=0;j<h;j++){ push(j*w); push(j*w+w-1); }
    while(sp){ var p=st[--sp], px=p%w, py=(p-px)/w; if(px>0) push(p-1); if(px<w-1) push(p+1); if(py>0) push(p-w); if(py<h-1) push(p+w); }
    if(T>=55&&refs.length===1){ /* sfondo uniforme: tolgo anche i buchi interni dello stesso colore */
      var seen=new Uint8Array(n), hs=0;
      for(i=0;i<n;i++){ if(bg[i]||seen[i]||dist[i]>T*0.12) continue; var comp=[], sp2=0; st[sp2++]=i; seen[i]=1; while(sp2){ var q2=st[--sp2], qx2=q2%w, qy2=(q2-qx2)/w; comp.push(q2);
          var nbs=[]; if(qx2>0) nbs.push(q2-1); if(qx2<w-1) nbs.push(q2+1); if(qy2>0) nbs.push(q2-w); if(qy2<h-1) nbs.push(q2+w);
          nbs.forEach(function(z){ if(!bg[z]&&!seen[z]&&dist[z]<=T*0.12){ seen[z]=1; st[sp2++]=z; } }); }
        if(comp.length>=n*0.01) comp.forEach(function(z){ bg[z]=1; }); }
    }
    var nb=0; for(i=0;i<n;i++) nb+=bg[i];
    if(nb<n*0.04||nb>n*0.97) return cb(url,false);
    /* isole piccole (polvere) */
    var lab=new Int32Array(n), cnt=[0], nl=0;
    for(i=0;i<n;i++){ if(bg[i]||lab[i]) continue; nl++; var c1=0; sp=0; st[sp++]=i; lab[i]=nl; while(sp){ var q=st[--sp], qx=q%w, qy=(q-qx)/w; c1++;
      if(qx>0&&!bg[q-1]&&!lab[q-1]){ lab[q-1]=nl; st[sp++]=q-1; } if(qx<w-1&&!bg[q+1]&&!lab[q+1]){ lab[q+1]=nl; st[sp++]=q+1; } if(qy>0&&!bg[q-w]&&!lab[q-w]){ lab[q-w]=nl; st[sp++]=q-w; } if(qy<h-1&&!bg[q+w]&&!lab[q+w]){ lab[q+w]=nl; st[sp++]=q+w; } } cnt.push(c1); }
    var mx=0; for(k=1;k<=nl;k++) if(cnt[k]>mx) mx=cnt[k];
    if(mx<n*0.02) return cb(url,false);
    var minA=Math.max(30,Math.min(n*0.0015,mx*0.04));
    for(i=0;i<n;i++) if(!bg[i]&&cnt[lab[i]]<minA) bg[i]=1;
    /* bordo: 1px sfumato + colori ripuliti */
    var minx=w,miny=h,maxx=0,maxy=0, ref0=refs[0];
    for(j=0;j<h;j++) for(i=0;i<w;i++){ var p=j*w+i, o=p*4;
      if(bg[p]){ d[o+3]=0; continue; }
      var edge=(i>0&&bg[p-1])||(i<w-1&&bg[p+1])||(j>0&&bg[p-w])||(j<h-1&&bg[p+w]);
      if(edge){ var a=Math.max(0.2,Math.min(1,(dist[p]-T*0.25)/(T*0.75))); if(a<1){ for(k=0;k<3;k++) d[o+k]=Math.max(0,Math.min(255,(d[o+k]-(1-a)*ref0[k])/a)); d[o+3]=Math.round(a*255); } }
      if(i<minx) minx=i; if(i>maxx) maxx=i; if(j<miny) miny=j; if(j>maxy) maxy=j; }
    x.putImageData(id,0,0);
    var pad=Math.round(Math.max(w,h)*0.02), cx0=Math.max(0,minx-pad), cy0=Math.max(0,miny-pad), cw=Math.min(w,maxx+pad+1)-cx0, ch=Math.min(h,maxy+pad+1)-cy0;
    var o2=document.createElement('canvas'); o2.width=cw; o2.height=ch; o2.getContext('2d').drawImage(c,cx0,cy0,cw,ch,0,0,cw,ch);
    var out=o2.toDataURL('image/webp',0.9); if(out.indexOf('data:image/webp')!==0) out=o2.toDataURL('image/png');
    cb(out,true);
  }catch(e){ cb(url,false); } };
  im.onerror=function(){ cb(url,false); };
  im.src=url;
}
window.IECI_T={cutout:cutout,normalize:normalize,fresh:fresh};
function haloize(url,cb){
  var lv=APP.halo||'soft'; if(lv==='none') return cb(url);
  var passes=lv==='mid'?[[1.2,.95],[2.2,.7],[6,.45]]:[[1.2,.8],[4.5,.3]];
  var im=new Image(); im.onload=function(){ try{
    var u=Math.max(1,Math.max(im.naturalWidth,im.naturalHeight)/450), pad=Math.ceil(16*u), w=im.naturalWidth+pad*2, h=im.naturalHeight+pad*2, c=document.createElement('canvas'); c.width=w; c.height=h;
    var x=c.getContext('2d'), OFF=w+80;
    passes.forEach(function(p){ x.save(); x.shadowColor='rgba(0,0,0,'+p[1]+')'; x.shadowBlur=p[0]*u; x.shadowOffsetX=OFF; x.shadowOffsetY=0; x.drawImage(im,pad-OFF,pad); x.restore(); });
    x.drawImage(im,pad,pad);
    var out=c.toDataURL('image/webp',0.9); if(out.indexOf('data:image/webp')!==0) out=c.toDataURL('image/png');
    cb(out);
  }catch(e){ cb(url); } };
  im.onerror=function(){ cb(url); }; im.src=url;
}
function cutHalo(url,cb,tol){ cutout(url,function(r,ok){ if(!ok||r===url) return cb(r,ok); haloize(r,function(h){ cb(h,true); }); },tol); }
function readProdImg(file,max,cb,mode){
  readImage(file,max,false,function(u){
    if(!u||mode==='keep'||(mode!=='cut'&&!cutOn())||u.indexOf('data:image/svg')===0) return cb(u,u);
    cutHalo(u,function(r,ok){ if(ok) return cb(r,u); cutHalo(u,function(r2,ok2){ if(!ok2) toast('Sfondo complesso: foto lasciata com\'è. Usa «Senza sfondo» nel prodotto o una foto su sfondo uniforme'); cb(ok2?r2:u,u); },Math.min(95,cutTol()+25)); });
  });
}
function setBg(i,mode){
  var p=S.products[i]; if(!p) return; p.bg=mode;
  if(!(p.photos||[]).length){ renderProducts(); touch(); toast(mode==='keep'?'Le prossime foto restano con lo sfondo originale':'Le prossime foto saranno senza sfondo'); return; }
  if(!p.po) p.po=[]; while(p.po.length<p.photos.length) p.po.push('');
  var jobs=[]; p.photos.forEach(function(u,j){ if(u.indexOf('data:image/svg')!==0) jobs.push(j); });
  var okn=0, miss=0; if(mode==='cut') toast('Tolgo lo sfondo…');
  (function next(){
    var j=jobs.shift();
    if(j==null){ openP[p.id]=true; renderProducts(); touch();
      toast(mode==='keep'?(okn?'Sfondo originale ripristinato su '+okn+' foto':'Originale non disponibile per queste foto')+(miss&&okn?' ('+miss+' senza originale)':''):(okn?'Sfondo tolto a '+okn+' foto':'Sfondo complesso: nessuna foto modificata. Prova con una foto su sfondo più uniforme')); return; }
    if(mode==='keep'){ if(p.po[j]){ p.photos[j]=p.po[j]; okn++; } else miss++; return next(); }
    var src=p.po[j]||p.photos[j]; if(!p.po[j]) p.po[j]=p.photos[j];
    cutHalo(src,function(r,ok){ if(ok){ p.photos[j]=r; okn++; setTimeout(next,0); } else cutHalo(src,function(r2,ok2){ if(ok2){ p.photos[j]=r2; okn++; } setTimeout(next,0); },Math.min(95,cutTol()+25)); });
  })();
}
function cutAll(){
  var jobs=[]; (S.products||[]).forEach(function(p){ (p.photos||[]).forEach(function(u,j){ jobs.push([p.photos,j]); }); }); (S.custom||[]).forEach(function(c){ (c.photos||[]).forEach(function(u,j){ jobs.push([c.photos,j]); }); });
  jobs=jobs.filter(function(a){ return /^data:image\/(jpeg|jpg)/.test(a[0][a[1]]); });
  if(!jobs.length){ toast('Nessuna foto da elaborare'); return; }
  var done=0, okn=0; toast('Tolgo lo sfondo a '+jobs.length+' foto…');
  (function next(){ var a=jobs.shift(); if(!a){ renderProducts(); try{ renderCustom(); }catch(e){} touch(); toast('Sfondo tolto a '+okn+' foto'); return; }
    cutHalo(a[0][a[1]],function(r,ok){ if(ok){ a[0][a[1]]=r; okn++; } setTimeout(next,0); }); })();
}
/* ---------- personalizza app ---------- */
var APP={cut:'on',cutt:38,halo:'soft',autop:'on',webimg:'auto',name:'',suf:'',lm:'quote',logo:'',bg:'keep',ls:86,view:'',theme:'auto',col:'',fz:1,dens:'n',sub:true,greet:''};
function apLoad(){ try{ var o=JSON.parse(localStorage.getItem('ieci-app')||'null'); if(o) Object.keys(o).forEach(function(k){ if(k in APP) APP[k]=o[k]; }); }catch(e){} }
function apStore(){ try{ var o={}; Object.keys(APP).forEach(function(k){ if(k!=='view') o[k]=APP[k]; }); localStorage.setItem('ieci-app',JSON.stringify(o)); }catch(e){ toast('Memoria piena: logo non salvato'); } }
function procLogo(url,mode,cb){
  if(!url||mode==='keep') return cb(url);
  if(mode==='out') return buildVariants(url,function(t){ cb(t||url); });
  var im=new Image(); im.onload=function(){ try{
    var sc=Math.min(1,900/Math.max(im.naturalWidth,im.naturalHeight)), w=Math.max(1,Math.round(im.naturalWidth*sc)), h=Math.max(1,Math.round(im.naturalHeight*sc));
    var c=document.createElement('canvas'); c.width=w; c.height=h; var x=c.getContext('2d'); x.drawImage(im,0,0,w,h);
    var id=x.getImageData(0,0,w,h), d=id.data;
    for(var i=0;i<d.length;i+=4){ var m=Math.min(d[i],d[i+1],d[i+2]), a=Math.max(0,Math.min(1,(255-m)/208))*(d[i+3]/255); if(m>=250) a=0; var q=Math.max(a,0.001); for(var k=0;k<3;k++) d[i+k]=Math.max(0,Math.min(255,(d[i+k]-(1-q)*255)/q)); d[i+3]=Math.round(a*255); }
    x.putImageData(id,0,0); cb(c.toDataURL('image/png'));
  }catch(e){ cb(url); } }; im.onerror=function(){ cb(url); }; im.src=url;
}
var apTok=0;
function apRefresh(){
  var tk=++apTok;
  if(APP.lm!=='own'||!APP.logo){ APP.view=''; brandUI(); return; }
  procLogo(APP.logo,APP.bg,function(v){ if(tk!==apTok) return; APP.view=v; brandUI(); });
}
function apApply(){
  var d=document.documentElement;
  if(APP.theme==='light'||APP.theme==='dark') d.setAttribute('data-theme',APP.theme); else d.removeAttribute('data-theme');
  d.style.setProperty('--fz',String(APP.fz||1)); d.classList.toggle('dens-c',APP.dens==='c');
  lastAppLogo=''; brandUI(); fit&&fit();
}
function apSub(){
  var el=$('app-sub'); if(!el) return; el.hidden=!APP.sub; if(!APP.sub) return;
  var n=new Date(), h=n.getHours(), g=h<13?'Buongiorno':(h<18?'Buon pomeriggio':'Buonasera');
  var p=0; try{ p=DB.quotes.filter(function(q){ return qSt(q)==='inviato'; }).length; }catch(e){}
  var dt=n.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});
  var tx=g+(APP.greet?' '+APP.greet:'')+' · '+dt+(p?' · '+p+(p===1?' preventivo inviato in attesa di risposta':' preventivi inviati in attesa di risposta'):'');
  if(el.textContent!==tx) el.textContent=tx;
}
function apPrev(){
  var pv=$('ap-prev'), hb=document.querySelector('.hbrand'); if(!pv||!hb) return;
  var cl=hb.cloneNode(true); Array.prototype.forEach.call(cl.querySelectorAll('[id]'),function(e){ e.removeAttribute('id'); });
  pv.innerHTML=''; pv.appendChild(cl);
}
var AP_TH=[{n:'Classico IECI',col:'',theme:'auto'},{n:'Notte',col:'#3B82F6',theme:'dark'},{n:'Bosco',col:'#0F766E',theme:'light'},{n:'Ambra',col:'#B45309',theme:'light'},{n:'Rubino',col:'#BE123C',theme:'light'},{n:'Grafite',col:'#1F2933',theme:'auto',dens:'c'}];
var AP_COLS=['#2F65AE','#0F766E','#B45309','#7C3AED','#BE123C','#1F2933'];
function apUI(){
  var th=$('ap-themes'); if(th) th.innerHTML=AP_TH.map(function(t,i){ return '<button type="button" class="btn ghost sm" data-th="'+i+'"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:6px;vertical-align:-1px;background:'+(t.col||S.style.b1)+'"></span>'+t.n+'</button>'; }).join('');
  $('ap-name').value=APP.name; $('ap-suf').value=APP.suf; $('ap-lmode').value=APP.lm; $('ap-lbg').value=APP.bg;
  $('ap-lsize').value=APP.ls; $('ap-lsv').textContent=APP.ls+' px'; $('ap-theme').value=APP.theme; $('ap-fz').value=String(APP.fz);
  $('ap-dens').value=APP.dens; $('ap-sub').checked=!!APP.sub; $('ap-cut').checked=APP.cut!=='off'; $('ap-cutt').value=String(APP.cutt||38); $('ap-halo').value=APP.halo||'soft'; $('ap-autop').checked=APP.autop!=='off'; $('ap-webimg').value=APP.webimg||'auto'; $('ap-greet').value=APP.greet; $('ap-col').value=APP.col||S.style.b1;
  $('ap-sw').innerHTML=AP_COLS.map(function(c){ return '<button type="button" data-c="'+c+'" style="background:'+c+'" aria-label="Colore '+c+'" aria-pressed="'+(APP.col.toLowerCase()===c.toLowerCase())+'"></button>'; }).join('');
}
function apSet(k,v,refresh){ APP[k]=v; apStore(); if(refresh) apRefresh(); else brandUI(); }
function apInit(){
  $('ap-name').addEventListener('input',function(e){ apSet('name',e.target.value.trim()); });
  $('ap-suf').addEventListener('input',function(e){ apSet('suf',e.target.value); });
  $('ap-greet').addEventListener('input',function(e){ apSet('greet',e.target.value.trim()); });
  $('ap-sub').addEventListener('change',function(e){ apSet('sub',e.target.checked); });
  $('ap-cut').addEventListener('change',function(e){ apSet('cut',e.target.checked?'on':'off'); });
  $('ap-cutt').addEventListener('change',function(e){ apSet('cutt',+e.target.value); });
  $('ap-halo').addEventListener('change',function(e){ apSet('halo',e.target.value); });
  $('ap-autop').addEventListener('change',function(e){ apSet('autop',e.target.checked?'on':'off'); });
  $('ap-cutall').addEventListener('click',cutAll);
  $('ap-gomenu').addEventListener('click',function(){ showPanel('menu'); window.scrollTo(0,0); });
  $('ap-themes').addEventListener('click',function(e){ var b=e.target.closest('[data-th]'); if(!b) return; var t=AP_TH[+b.getAttribute('data-th')]; APP.col=t.col; APP.theme=t.theme; APP.dens=t.dens||APP.dens; apStore(); apUI(); apApply(); toast('Tema «'+t.n+'»'); });
  $('ap-lmode').addEventListener('change',function(e){ var v=e.target.value; if(v==='own'&&!APP.logo){ APP.logo=S.style.logo||LOGO0; } apSet('lm',v,true); });
  $('ap-lbg').addEventListener('change',function(e){ apSet('bg',e.target.value,true); });
  $('ap-lsize').addEventListener('input',function(e){ APP.ls=+e.target.value; $('ap-lsv').textContent=APP.ls+' px'; apStore(); brandUI(); });
  $('ap-theme').addEventListener('change',function(e){ APP.theme=e.target.value; apStore(); apApply(); });
  $('ap-fz').addEventListener('change',function(e){ APP.fz=+e.target.value; apStore(); apApply(); });
  $('ap-dens').addEventListener('change',function(e){ APP.dens=e.target.value; apStore(); apApply(); });
  $('ap-col').addEventListener('input',function(e){ APP.col=e.target.value; apStore(); brandUI(); apUI(); });
  $('ap-colauto').addEventListener('click',function(){ APP.col=''; apStore(); brandUI(); apUI(); toast('Colori del logo'); });
  $('ap-sw').addEventListener('click',function(e){ var b=e.target.closest('[data-c]'); if(!b) return; APP.col=b.getAttribute('data-c'); apStore(); brandUI(); apUI(); });
  $('ap-file').addEventListener('change',function(e){
    var f=e.target.files&&e.target.files[0]; if(!f) return;
    readImage(f,800,f.type!=='image/jpeg',function(url){ if(!url) return; APP.logo=url; APP.lm='own'; if(f.type==='image/jpeg'&&APP.bg==='keep') APP.bg='out'; apStore(); apUI(); apRefresh(); toast('Logo dell\'app aggiornato'); });
    e.target.value='';
  });
  $('ap-orig').addEventListener('click',function(){ APP.logo=LOGO0; APP.lm='own'; APP.bg='keep'; apStore(); apUI(); apRefresh(); toast('Logo IECI originale ripristinato'); });
  $('ap-toq').addEventListener('click',function(){ var u=APP.lm==='own'&&APP.logo?APP.logo:LOGO0; S.style.logo=u; V={t:'',w:'',src:''}; refreshVariants(); touch(); toast('Logo usato anche nei preventivi'); });
  $('ap-reset').addEventListener('click',function(){ if(!confirm('Ripristinare nome, logo e aspetto originali dell\'app?')) return; APP={cut:'on',cutt:38,halo:'soft',autop:'on',webimg:'auto',name:'',suf:'',lm:'quote',logo:'',bg:'keep',ls:86,view:'',theme:'auto',col:'',fz:1,dens:'n',sub:true,greet:''}; apStore(); apUI(); apApply(); apRefresh(); });
}
apLoad();

