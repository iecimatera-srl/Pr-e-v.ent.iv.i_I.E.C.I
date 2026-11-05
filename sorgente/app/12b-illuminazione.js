/* ===== Illuminazione: calcolatori luce =====
   Nel preventivo «Illuminazione» compaiono due strumenti con il disegno di quello che stai preventivando:
   - Strip LED: metri, tipo e tratti → potenza, alimentatore (con il 25% di margine), punti di alimentazione,
     sezione del cavo; il disegno mostra la strip accesa con il suo colore.
   - Faretti per stanza: misure e tipo di locale → quanti faretti servono per la luce giusta (lux), disposti
     su una griglia ordinata, con interasse e distanza dalle pareti; il disegno è la piantina della stanza.
   «Aggiungi al preventivo» inserisce tutte le voci, già con quantità e descrizione chiara per il cliente.
   Nel preventivo economico un riquadro riassume corpi illuminanti, potenza installata e consumo stimato. */
var LU_STRIP=[
  ['w','Bianca 14,4 W/m',14.4,'Strip LED 24 V bianca 14,4 W/m, posa inclusa',''],
  ['cob','COB 10 W/m, luce continua senza puntini',10,'Strip LED COB 24 V 10 W/m senza puntini',''],
  ['rgb','RGB / RGBW 14,4 W/m, a colori',14.4,'Strip LED RGB / RGBW 24 V',''],
  ['tw','Tunable White 19,2 W/m, bianco regolabile',19.2,'Strip LED Tunable White 24 V (bianco regolabile)',''],
  ['hp','Alta luminosità 20 W/m',20,'Strip LED 24 V bianca 14,4 W/m, posa inclusa','Strip LED 24 V alta luminosità 20 W/m, posa inclusa']];
var LU_LOC=[['so','Soggiorno',200],['cu','Cucina',300],['ca','Camera da letto',150],['ba','Bagno',250],['co','Corridoio e ingresso',100],['st','Studio e ufficio',500],['ne','Negozio e vetrina',500],['bx','Garage e cantina',100],['es','Portico ed esterno',50]];
var LU_SPOT=[[5,450],[7,600],[10,900],[15,1400]];
var LU_ALIM=[60,100,150,240,320];
var LU_SEZ=[0.75,1,1.5,2.5,4,6,10];
function luDef(){ return {st:{m:5,t:'w',v:24,tr:1,pr:'sup',ct:'dim',d:3,k:3000},sp:{r:'so',lx:200,l:5,w:4,h:2.7,f:7,k:3000,cg:true,dim:false},ore:4,show:true}; }
function luS(){ if(!S.luce||typeof S.luce!=='object') S.luce=luDef(); var d=luDef(); ['st','sp'].forEach(function(k){ if(!S.luce[k]||typeof S.luce[k]!=='object') S.luce[k]=d[k]; Object.keys(d[k]).forEach(function(x){ if(S.luce[k][x]===undefined) S.luce[k][x]=d[k][x]; }); }); if(S.luce.ore==null) S.luce.ore=4; if(S.luce.show==null) S.luce.show=true; return S.luce; }
function luF(n,d){ return Number(n||0).toLocaleString('it-IT',{maximumFractionDigits:d==null?1:d,minimumFractionDigits:0}); }
// potenza per metro dalla descrizione della strip
function luWm(desc){ var d=String(desc||''), m=d.match(/(\d+(?:[.,]\d+)?)\s*W\s*\/\s*m/i); if(m) return parseFloat(m[1].replace(',','.')); return /COB/i.test(d)?10:/Tunable/i.test(d)?19.2:14.4; }
// alimentatori: potenza con il 25% di margine, taglie commerciali; oltre 320 W più alimentatori uguali
function luAlim(P,V){ var need=Math.max(1,P)*1.25, n=1; while(need/n>LU_ALIM[LU_ALIM.length-1]) n++; var per=need/n, w=LU_ALIM.filter(function(x){ return x>=per; })[0]; return [{w:w,n:n,need:need}]; }
// lunghezza massima alimentata da un solo capo senza calo di luce visibile
function luRun(wm,V){ var b=wm<=10?6:(wm<=15?5:4); return V===12?b/2:b; }
// sezione del cavo tra alimentatore e strip (caduta massima 3% in bassissima tensione)
function luSez(I,d,V){ var s=2*d*I*0.0175/(0.03*V); return LU_SEZ.filter(function(x){ return x>=s; })[0]||0; }
// faretti per una stanza: metodo del flusso (utilanza in base all'altezza, manutenzione 0,8)
function luSpot(E,A,lm,h){ var uf=h<=2.8?0.55:(h<=3.3?0.5:0.45), mf=0.8; return {n:Math.max(1,Math.ceil(E*A/(lm*uf*mf))),uf:uf,mf:mf}; }
function luGrid(n,L,W){ var c=Math.max(1,Math.round(Math.sqrt(n*L/W))), r=Math.max(1,Math.ceil(n/c)); c=Math.max(1,Math.ceil(n/r)); return {r:r,c:c,n:r*c}; }
function luTipo(t){ return LU_STRIP.filter(function(x){ return x[0]===t; })[0]||LU_STRIP[0]; }
function luLoc(k){ return LU_LOC.filter(function(x){ return x[0]===k; })[0]||LU_LOC[0]; }

/* ---------- calcoli ---------- */
function luStripCalc(){
  var o=luS().st, ty=luTipo(o.t), M=Math.max(0.1,num(o.m)), tr=Math.max(1,Math.round(num(o.tr))||1), V=+o.v===12?12:24, wm=ty[2];
  var Ls=M/tr, P=M*wm, Ps=Ls*wm, al=luAlim(Ps,V)[0], I=Ps/V, run=luRun(wm,V), feeds=Math.max(1,Math.ceil(Ls/run)), sez=luSez(I/feeds,Math.max(0.5,num(o.d)||3),V);
  return {ty:ty,M:M,tr:tr,V:V,wm:wm,Ls:Ls,P:P,Ps:Ps,al:al,I:I,run:run,feeds:feeds,sez:sez,d:Math.max(0.5,num(o.d)||3)};
}
function luSpotCalc(){
  var o=luS().sp, L=Math.max(0.5,num(o.l)), W=Math.max(0.5,num(o.w)), A=L*W, E=Math.max(10,num(o.lx)||luLoc(o.r)[2]), f=LU_SPOT.filter(function(x){ return x[0]===+o.f; })[0]||LU_SPOT[1], h=Math.max(2,num(o.h)||2.7);
  var c=luSpot(E,A,f[1],h), g=luGrid(c.n,L,W), Em=g.n*f[1]*c.uf*c.mf/A;
  return {L:L,W:W,A:A,E:E,f:f,h:h,c:c,g:g,Em:Em,dx:L/g.c,dy:W/g.r,P:g.n*f[0]};
}

/* ---------- disegni ---------- */
function luStripSvg(R){
  var Wv=340, n=Math.min(R.tr,3), rows='', rgb=R.ty[0]==='rgb', col=R.ty[0]==='tw'?'#FFF1D6':(+luS().st.k>=4000?'#FFF6E0':'#FFD27A');
  var h=40+n*50, y0=48;
  for(var i=0;i<n;i++){
    var y=y0+i*50, x0=88, x1=Wv-22, len=x1-x0, gl=rgb?'url(#lu-rgb)':col;
    rows+='<rect x="12" y="'+(y-13)+'" width="56" height="26" rx="6" fill="#16283F" stroke="#4C6A93"/><text x="40" y="'+(y+4)+'" text-anchor="middle" font-size="10.5" font-weight="700" fill="#EAF0F7">'+R.al.w+' W</text>'+
      '<path d="M68 '+y+'H'+x0+'" stroke="#93A1B4" stroke-width="2"/>'+
      '<rect x="'+x0+'" y="'+(y-5)+'" width="'+len+'" height="10" rx="5" fill="'+gl+'" opacity=".55" filter="url(#lu-glow)"/>'+
      '<rect x="'+x0+'" y="'+(y-4)+'" width="'+len+'" height="8" rx="4" fill="#0B1522" stroke="#3B5578"/>';
    if(R.ty[0]==='cob') rows+='<rect x="'+(x0+3)+'" y="'+(y-1.6)+'" width="'+(len-6)+'" height="3.2" rx="1.6" fill="'+gl+'"/>';
    else { var nd=Math.max(8,Math.min(46,Math.round(R.Ls*6))); for(var j=0;j<nd;j++){ var cx=x0+6+j*(len-12)/(nd-1); rows+='<circle cx="'+cx.toFixed(1)+'" cy="'+y+'" r="1.9" fill="'+(rgb?['#FF5A5A','#5AFF8C','#5AA8FF'][j%3]:col)+'"/>'; } }
    // punti di alimentazione aggiuntivi
    for(var k=1;k<R.feeds;k++){ var fx=x0+len*k/R.feeds; rows+='<path d="M'+fx.toFixed(1)+' '+(y-14)+'V'+(y-5)+'" stroke="#F2B705" stroke-width="2"/><circle cx="'+fx.toFixed(1)+'" cy="'+(y-15)+'" r="2.6" fill="#F2B705"/>'; }
    rows+='<text x="'+(x0+len/2)+'" y="'+(y+18)+'" text-anchor="middle" font-size="10" fill="#93A1B4">'+luF(R.Ls)+' m'+(R.feeds>1?' · '+R.feeds+' punti di alimentazione':'')+'</text>';
  }
  if(R.tr>3) rows+='<text x="'+(Wv/2)+'" y="'+(y0+3*50-12)+'" text-anchor="middle" font-size="10.5" fill="#EAF0F7">… e altri '+(R.tr-3)+' tratti uguali</text>';
  return '<svg class="lu-svg" viewBox="0 0 '+Wv+' '+h+'" role="img" aria-label="Disegno della strip LED"><defs><filter id="lu-glow" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="5"/></filter>'+
    '<linearGradient id="lu-rgb" x1="0" x2="1"><stop offset="0" stop-color="#FF4D6D"/><stop offset=".35" stop-color="#FFC94D"/><stop offset=".65" stop-color="#4DFF9A"/><stop offset="1" stop-color="#4DA3FF"/></linearGradient></defs>'+
    '<rect width="'+Wv+'" height="'+h+'" rx="14" fill="#0A1320"/><text x="40" y="22" text-anchor="middle" font-size="9.5" font-weight="700" fill="#93A1B4">Alimentatore</text><text x="96" y="22" font-size="9.5" font-weight="700" fill="#93A1B4">Strip '+R.V+' V · '+luF(R.wm)+' W/m · '+esc(luTipo(luS().st.t)[1].split(' ')[0])+'</text>'+rows+'</svg>';
}
function luRoomSvg(R){
  var Wv=340, Hv=230, pad=34, sc=Math.min((Wv-pad*2)/R.L,(Hv-pad*2-14)/R.W), w=R.L*sc, h=R.W*sc, x0=(Wv-w)/2, y0=pad, s='';
  var rad=Math.max(12,Math.max(R.dx,R.dy)*sc*0.95);
  s+='<rect x="'+x0.toFixed(1)+'" y="'+y0+'" width="'+w.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="3" fill="#0F1D2E" stroke="#4C6A93" stroke-width="2"/>';
  for(var i=0;i<R.g.r;i++) for(var j=0;j<R.g.c;j++){
    var cx=x0+(j+0.5)*R.dx*sc, cy=y0+(i+0.5)*R.dy*sc;
    s+='<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="'+rad.toFixed(1)+'" fill="url(#lu-halo)" style="mix-blend-mode:screen"/><circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="4.2" fill="#FFF3C4" stroke="#F2B705" stroke-width="1.6"/>';
  }
  // quote
  s+='<path d="M'+x0.toFixed(1)+' '+(y0+h+12).toFixed(1)+'H'+(x0+w).toFixed(1)+'" stroke="#93A1B4" stroke-width="1"/><text x="'+(x0+w/2).toFixed(1)+'" y="'+(y0+h+25).toFixed(1)+'" text-anchor="middle" font-size="10.5" fill="#C9D4E3">'+luF(R.L,2)+' m</text>'+
    '<path d="M'+(x0-12).toFixed(1)+' '+y0+'V'+(y0+h).toFixed(1)+'" stroke="#93A1B4" stroke-width="1"/><text x="'+(x0-16).toFixed(1)+'" y="'+(y0+h/2).toFixed(1)+'" text-anchor="middle" font-size="10.5" fill="#C9D4E3" transform="rotate(-90 '+(x0-16).toFixed(1)+' '+(y0+h/2).toFixed(1)+')">'+luF(R.W,2)+' m</text>';
  if(R.g.c>1) s+='<text x="'+(x0+R.dx*sc).toFixed(1)+'" y="'+(y0-8)+'" text-anchor="middle" font-size="9.5" fill="#F2B705">↔ '+luF(R.dx,2)+' m</text>';
  return '<svg class="lu-svg" viewBox="0 0 '+Wv+' '+Hv+'" role="img" aria-label="Piantina della stanza con i faretti"><defs><radialGradient id="lu-halo"><stop offset="0" stop-color="#FFD978" stop-opacity=".42"/><stop offset=".6" stop-color="#FFC94D" stop-opacity=".14"/><stop offset="1" stop-color="#FFC94D" stop-opacity="0"/></radialGradient></defs>'+
    '<rect width="'+Wv+'" height="'+Hv+'" rx="14" fill="#0A1320"/>'+s+'</svg>';
}

/* ---------- pannello ---------- */
function luOpt(list,val,lab){ return list.map(function(x){ var v=x[0]; return '<option value="'+v+'"'+(String(v)===String(val)?' selected':'')+'>'+esc(lab(x))+'</option>'; }).join(''); }
function luForm(){
  var o=luS(), a=o.st, b=o.sp, tab=o.tab==='sp'?'sp':'st';
  return '<div class="lu-tabs" role="tablist"><button type="button" role="tab" class="lu-tab" data-lutab="st" aria-selected="'+(tab==='st')+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2.5" y="10" width="19" height="4" rx="2"/><path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01M5 7l1 1M12 5v2M19 7l-1 1"/></svg>Strip LED</button>'+
    '<button type="button" role="tab" class="lu-tab" data-lutab="sp" aria-selected="'+(tab==='sp')+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.3"/><circle cx="16" cy="9" r="1.3"/><circle cx="8" cy="15" r="1.3"/><circle cx="16" cy="15" r="1.3"/></svg>Faretti per stanza</button></div>'+
  '<div class="lu-pane" data-lupane="st"'+(tab==='st'?'':' hidden')+'>'+
    '<div class="lu-g"><label class="f">Metri di strip<input type="number" min="0.1" step="0.1" inputmode="decimal" data-lu="st.m" value="'+esc(a.m)+'"></label>'+
    '<label class="f">In quanti tratti<input type="number" min="1" step="1" inputmode="numeric" data-lu="st.tr" value="'+esc(a.tr)+'"></label>'+
    '<label class="f lu-w2">Tipo di strip<select data-lu="st.t">'+luOpt(LU_STRIP,a.t,function(x){ return x[1]; })+'</select></label>'+
    '<label class="f">Tensione<select data-lu="st.v"><option value="24"'+(+a.v!==12?' selected':'')+'>24 V (consigliata)</option><option value="12"'+(+a.v===12?' selected':'')+'>12 V</option></select></label>'+
    '<label class="f">Luce<select data-lu="st.k">'+luOpt([[2700,'2700 K molto calda'],[3000,'3000 K calda'],[4000,'4000 K naturale'],[6000,'6000 K fredda']],a.k,function(x){ return x[1]; })+'</select></label>'+
    '<label class="f">Profilo<select data-lu="st.pr"><option value="no"'+(a.pr==='no'?' selected':'')+'>Senza profilo</option><option value="sup"'+(a.pr==='sup'?' selected':'')+'>Alluminio con diffusore</option><option value="inc"'+(a.pr==='inc'?' selected':'')+'>Da incasso in cartongesso</option></select></label>'+
    '<label class="f">Comando<select data-lu="st.ct"><option value="no"'+(a.ct==='no'?' selected':'')+'>Interruttore</option><option value="dim"'+(a.ct==='dim'?' selected':'')+'>Dimmer con telecomando</option><option value="wifi"'+(a.ct==='wifi'?' selected':'')+'>Wi-Fi con app</option><option value="dali"'+(a.ct==='dali'?' selected':'')+'>DALI</option></select></label>'+
    '<label class="f lu-w2">Distanza alimentatore → strip (m)<input type="number" min="0.5" step="0.5" inputmode="decimal" data-lu="st.d" value="'+esc(a.d)+'"></label></div>'+
    '<div class="lu-out" data-luout="st" aria-live="polite"></div>'+
    '<div class="row"><button type="button" class="btn" data-luadd="st">Aggiungi la strip al preventivo</button></div></div>'+
  '<div class="lu-pane" data-lupane="sp"'+(tab==='sp'?'':' hidden')+'>'+
    '<div class="lu-g"><label class="f lu-w2">Locale<select data-lu="sp.r">'+luOpt(LU_LOC,b.r,function(x){ return x[1]+' · '+x[2]+' lux'; })+'</select></label>'+
    '<label class="f">Lunghezza (m)<input type="number" min="0.5" step="0.1" inputmode="decimal" data-lu="sp.l" value="'+esc(b.l)+'"></label>'+
    '<label class="f">Larghezza (m)<input type="number" min="0.5" step="0.1" inputmode="decimal" data-lu="sp.w" value="'+esc(b.w)+'"></label>'+
    '<label class="f">Altezza soffitto (m)<input type="number" min="2" step="0.1" inputmode="decimal" data-lu="sp.h" value="'+esc(b.h)+'"></label>'+
    '<label class="f">Luce voluta (lux)<input type="number" min="10" step="10" inputmode="numeric" data-lu="sp.lx" value="'+esc(b.lx)+'"></label>'+
    '<label class="f">Faretto<select data-lu="sp.f">'+luOpt(LU_SPOT,b.f,function(x){ return x[0]+' W · circa '+x[1]+' lumen'; })+'</select></label>'+
    '<label class="f">Luce<select data-lu="sp.k">'+luOpt([[2700,'2700 K molto calda'],[3000,'3000 K calda'],[4000,'4000 K naturale']],b.k,function(x){ return x[1]; })+'</select></label>'+
    '<label class="chk lu-w2"><input type="checkbox" data-lu="sp.cg"'+(b.cg?' checked':'')+'>Controsoffitto in cartongesso (fori compresi)</label>'+
    '<label class="chk lu-w2"><input type="checkbox" data-lu="sp.dim"'+(b.dim?' checked':'')+'>Con dimmer per regolare la luce</label></div>'+
    '<div class="lu-out" data-luout="sp" aria-live="polite"></div>'+
    '<div class="row"><button type="button" class="btn" data-luadd="sp">Aggiungi i faretti al preventivo</button></div></div>'+
  '<div class="lu-foot"><label class="chk"><input type="checkbox" data-lu="show"'+(o.show!==false?' checked':'')+'>Nel preventivo, riepilogo luce con potenza e consumo stimati</label>'+
    '<label class="f lu-ore">Ore di accensione al giorno<input type="number" min="0.5" max="24" step="0.5" inputmode="decimal" data-lu="ore" value="'+esc(o.ore)+'"></label></div>'+
  '<p class="hint">Valori indicativi per scegliere in fretta: per locali speciali (negozi, uffici, esterni pubblici) vale il progetto illuminotecnico.</p>';
}
function luOut(){
  var box=$('acc-lu'); if(!box||box.hidden) return;
  var o1=box.querySelector('[data-luout="st"]'), o2=box.querySelector('[data-luout="sp"]');
  if(o1){ var R=luStripCalc();
    o1.innerHTML=luStripSvg(R)+'<div class="lu-k">'+
      '<div><b>'+luF(R.P,0)+' W</b><small>potenza della strip</small></div>'+
      '<div><b>'+(R.al.n>1?R.al.n+' × ':'')+R.al.w+' W</b><small>alimentatore '+(R.tr>1?'per ogni tratto':'')+' (margine 25%)</small></div>'+
      '<div><b>'+luF(R.Ps/R.V,1)+' A</b><small>corrente '+(R.tr>1?'per tratto':'')+' a '+R.V+' V</small></div>'+
      '<div><b>'+(R.sez?luF(R.sez,2)+' mm²':'—')+'</b><small>cavo fino a '+luF(R.d)+' m</small></div></div>'+
      '<p class="lu-tip">'+(R.feeds>1?'Ogni tratto da '+luF(R.Ls)+' m va alimentato in <b>'+R.feeds+' punti</b> (al massimo '+luF(R.run)+' m da un solo capo), altrimenti la luce cala in fondo.':'Ogni tratto da '+luF(R.Ls)+' m si alimenta da un solo capo (fino a '+luF(R.run)+' m).')+(R.V===12?' A 12 V i tratti devono restare corti: dove puoi, usa 24 V.':'')+'</p>';
  }
  if(o2){ var Q=luSpotCalc();
    o2.innerHTML=luRoomSvg(Q)+'<div class="lu-k">'+
      '<div><b>'+Q.g.n+' faretti</b><small>griglia '+Q.g.r+' × '+Q.g.c+'</small></div>'+
      '<div><b>≈ '+luF(Q.Em,0)+' lux</b><small>luce media ('+luF(Q.E,0)+' richiesti)</small></div>'+
      '<div><b>'+luF(Q.dx,2)+' × '+luF(Q.dy,2)+' m</b><small>interasse</small></div>'+
      '<div><b>'+luF(Q.P,0)+' W</b><small>potenza totale</small></div></div>'+
      '<p class="lu-tip">Primo faretto a <b>'+luF(Q.dx/2,2)+' m</b> dalla parete lunga e a <b>'+luF(Q.dy/2,2)+' m</b> da quella corta. Stanza di '+luF(Q.A,1)+' m², soffitto a '+luF(Q.h,2)+' m.'+(Q.c.n<Q.g.n?' Il calcolo dà '+Q.c.n+' faretti: ne metto '+Q.g.n+' per una griglia regolare.':'')+'</p>';
  }
}
function renderLu(){
  var box=$('acc-lu'); if(!box) return; var on=S.model==='luce'; box.hidden=!on; if(!on) return;
  var inn=$('lu-in'); if(inn&&!inn.contains(document.activeElement)){ inn.innerHTML=luForm(); }
  luOut();
}
function luItem(name){ var a=(S.cat.luce||[]).concat(MODELS.luce.items), i; for(i=0;i<a.length;i++) if(a[i][0]===name) return a[i]; return null; }
function luAddLine(name,q,desc){
  var it=luItem(name); if(!it||!(q>0)) return null;
  var ad=addToRoom([desc||it[0],it[1],it[2]],r2(q)); var lk=linkLine(ad); return lk&&lk.created;
}
function luAdd(what){
  var o=luS(), n=0, nuove=0, add=function(nm,q,d){ var c=luAddLine(nm,q,d); if(c!==null){ n++; if(c) nuove++; } };
  if(what==='st'){
    var R=luStripCalc(), v=R.V===12?function(t){ return t.replace(/24 V/,'12 V'); }:function(t){ return t; };
    var dS=v(R.ty[4]||R.ty[3]); if(R.ty[0]==='w'||R.ty[0]==='hp'||R.ty[0]==='cob') dS=dS.replace(/, posa inclusa$/,'')+', '+o.st.k+' K, posa inclusa';
    add(R.ty[3],r2(R.M),dS);
    if(o.st.pr!=='no') add(o.st.pr==='inc'?'Profilo in alluminio da incasso in cartongesso':'Profilo in alluminio con diffusore opale',r2(R.M));
    add('Alimentatore LED 24 V '+R.al.w+' W',R.al.n*R.tr,v('Alimentatore LED 24 V '+R.al.w+' W'));
    if(o.st.ct==='dim') add('Controller / dimmer per strip LED con telecomando',R.tr);
    else if(o.st.ct==='wifi') add('Controller RGB / RGBW Wi-Fi con app',R.tr);
    else if(o.st.ct==='dali') add('Driver o centralina DALI',R.tr);
    toast('Strip LED aggiunta: '+luF(R.M)+' m, '+(R.al.n*R.tr)+' alimentator'+(R.al.n*R.tr>1?'i':'e')+' da '+R.al.w+' W'+(nuove?' · schede create in Prodotti':''));
  } else {
    var Q=luSpotCalc(), loc=luLoc(o.sp.r), ba=o.sp.r==='ba', base=ba?'Faretto LED da incasso IP65 per bagno / doccia':(Q.f[0]>=10?'Faretto LED da incasso orientabile 10 W':'Faretto LED da incasso fisso 7 W, fornito e posato');
    var d=(ba?'Faretto LED da incasso IP65 ':'Faretto LED da incasso ')+Q.f[0]+' W '+o.sp.k+' K · '+loc[1]+', fornito e posato';
    add(base,Q.g.n,d);
    if(o.sp.cg) add('Foro su cartongesso o controsoffitto',Q.g.n,'Foro su cartongesso o controsoffitto · '+loc[1]);
    if(o.sp.dim) add('Dimmer da incasso per LED',1,'Dimmer da incasso per LED · '+loc[1]);
    toast(Q.g.n+' faretti aggiunti per «'+loc[1]+'»'+(nuove?' · schede create in Prodotti':''));
  }
  if(n){ renderLines(); renderProducts(); touch(); }
}
(function(){
  var box=$('acc-lu'); if(!box) return;
  box.addEventListener('click',function(e){
    var t=e.target.closest('[data-lutab]'), a=e.target.closest('[data-luadd]');
    if(t){ luS().tab=t.getAttribute('data-lutab'); Array.prototype.forEach.call(box.querySelectorAll('[data-lutab]'),function(b){ b.setAttribute('aria-selected',String(b===t)); }); Array.prototype.forEach.call(box.querySelectorAll('[data-lupane]'),function(p){ p.hidden=p.getAttribute('data-lupane')!==luS().tab; }); save(); return; }
    if(a) luAdd(a.getAttribute('data-luadd'));
  });
  function cambia(e){
    var el=e.target.closest('[data-lu]'); if(!el) return;
    var p=el.getAttribute('data-lu').split('.'), o=luS(), v=el.type==='checkbox'?el.checked:(el.type==='number'?num(el.value):el.value);
    if(p.length===2) o[p[0]][p[1]]=v; else o[p[0]]=v;
    if(p[1]==='r'){ o.sp.lx=luLoc(v).length?luLoc(v)[2]:o.sp.lx; var lx=box.querySelector('[data-lu="sp.lx"]'); if(lx) lx.value=String(o.sp.lx); }
    if(p[1]==='t'&&v==='rgb'&&o.st.ct!=='wifi'){ o.st.ct='wifi'; var ct=box.querySelector('[data-lu="st.ct"]'); if(ct) ct.value='wifi'; }
    luOut(); save(); if(p[0]==='show'||p[0]==='ore') schedule();
  }
  box.addEventListener('input',cambia); box.addEventListener('change',cambia);
})();

/* ---------- riepilogo luce nel preventivo economico ---------- */
function luRiepilogo(){
  var c={far:0,pla:0,fari:0,est:0,m:0,W:0,K:{}};
  S.lines.forEach(function(l){ if(l.off||l.vm) return; var d=String(l.d||''), q=num(l.q); if(!(q>0)) return;
    var k=d.match(/\b(2700|3000|4000|6000|6500)\s?K\b/); if(k) c.K[k[1]]=1;
    if(/alimentator|driver|controller|ventilatore|dimmer|centralina|foro|smontaggio|smaltimento|montaggio/i.test(d)&&!/^Montaggio (lampadario|applique)/i.test(d)){ return; }
    if(/strip|strisc|nastro led/i.test(d)&&/^m/i.test(String(l.u||''))){ c.m+=q; c.W+=q*luWm(d); return; }
    if(/^Faretto|faretto/i.test(d)) c.far+=q; else if(/plafonier|pannello led|sospension|lampadario|applique(?! da esterno)/i.test(d)) c.pla+=q; else if(/proiettor|\bfar[oi]\b/i.test(d)) c.fari+=q; else if(/segnapass|paletto|picchetto|calpestabil|applique da esterno|lampion/i.test(d)) c.est+=q;
    var w=d.match(/(\d+(?:[.,]\d+)?)\s*W\b(?!\s*\/)/); if(w&&!/Wp\b/.test(d)) c.W+=q*parseFloat(w[1].replace(',','.'));
  });
  return c;
}
function luBox(){
  if(S.model!=='luce') return ''; var o=luS(); if(o.show===false) return '';
  var c=luRiepilogo(), it=[];
  if(c.far) it.push([luF(c.far,0),c.far===1?'faretto':'faretti']); if(c.pla) it.push([luF(c.pla,0),c.pla===1?'plafoniera o lampada':'plafoniere e lampade']); if(c.fari) it.push([luF(c.fari,0),c.fari===1?'faro':'fari']); if(c.est) it.push([luF(c.est,0),'luci da esterno']); if(c.m) it.push([luF(c.m),'m di strip LED']);
  if(!it.length&&!c.W) return '';
  var ore=Math.max(0.5,num(o.ore)||4), kwh=c.W*ore*365/1000, K=Object.keys(c.K).sort();
  return '<div class="lubox"><div class="lu-h">La tua illuminazione in breve</div><div class="lu-chips">'+it.map(function(x){ return '<span><b>'+esc(x[0])+'</b> '+esc(x[1])+'</span>'; }).join('')+'</div>'+
    (c.W?'<div class="lu-r"><span>Potenza LED installata</span><b>≈ '+luF(c.W,0)+' W</b></div><div class="lu-r"><span>Consumo con '+luF(ore)+' ore di accensione al giorno</span><b>≈ '+luF(kwh,0)+' kWh all\'anno</b></div>':'')+
    (K.length?'<div class="lu-r"><span>Colore della luce</span><b>'+K.map(function(k){ return k+' K'; }).join(' · ')+'</b></div>':'')+
    '<div class="lu-s">Valori stimati sulla potenza dichiarata degli apparecchi: il consumo reale dipende dall\'uso e dalle regolazioni.</div></div>';
}
(function(T){ if(!T) return; T.luStripCalc=luStripCalc; T.luSpotCalc=luSpotCalc; T.luAlim=luAlim; T.luSpot=luSpot; T.luRiepilogo=luRiepilogo; T.luBox=luBox; T.luAdd=luAdd; })(window.IECI_T);
