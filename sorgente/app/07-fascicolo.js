/* ---------- fascicolo ---------- */
var V={t:'',w:'',src:''};
function buildVariants(url,cb){
  var im=new Image();
  im.onload=function(){
    try{
      var w0=im.naturalWidth||800,h0=im.naturalHeight||600,sc=Math.min(1,900/Math.max(w0,h0));
      var w=Math.max(1,Math.round(w0*sc)),h=Math.max(1,Math.round(h0*sc));
      var c=document.createElement('canvas'); c.width=w; c.height=h; var x=c.getContext('2d'); x.drawImage(im,0,0,w,h);
      var id=x.getImageData(0,0,w,h), d=id.data, n=w*h, bg=new Uint8Array(n), st=new Int32Array(n), sp=0, i;
      if(d[3]<12&&d[(w-1)*4+3]<12&&d[((h-1)*w)*4+3]<12&&d[(n-1)*4+3]<12) { for(i=0;i<n;i++){ var a1=d[i*4+3]; if(!a1) continue; var l1=lumAt(i), q=Math.max(0,Math.min(1,(255-l1)/130)); d[i*4]=255; d[i*4+1]=255; d[i*4+2]=255; d[i*4+3]=Math.round(a1*q); } x.putImageData(id,0,0); return cb(url,c.toDataURL('image/png')); }
      function lumAt(p){ return 0.299*d[p*4]+0.587*d[p*4+1]+0.114*d[p*4+2]; }
      function isBg(p){ return d[p*4+3]<12 || lumAt(p)>=236; }
      function push(p){ if(!bg[p]&&isBg(p)){ bg[p]=1; st[sp++]=p; } }
      for(i=0;i<w;i++){ push(i); push((h-1)*w+i); }
      for(i=0;i<h;i++){ push(i*w); push(i*w+w-1); }
      while(sp){ var p=st[--sp], px=p%w, py=(p-px)/w; if(px>0) push(p-1); if(px<w-1) push(p+1); if(py>0) push(p-w); if(py<h-1) push(p+w); }
      for(i=0;i<n;i++){
        if(bg[i]){ d[i*4+3]=0; continue; }
        var px2=i%w, nb=(px2>0&&bg[i-1])||(px2<w-1&&bg[i+1])||(i>=w&&bg[i-w])||(i<n-w&&bg[i+w]);
        if(nb){ var l=lumAt(i); if(l>200) d[i*4+3]=Math.round(d[i*4+3]*Math.max(0,Math.min(1,(255-l)/55))); }
      }
      x.putImageData(id,0,0); var t=c.toDataURL('image/png');
      for(i=0;i<n;i++){
        var a0=d[i*4+3]; if(!a0) continue;
        var ll=lumAt(i), a=Math.max(0,Math.min(1,(255-ll)/130));
        d[i*4]=255; d[i*4+1]=255; d[i*4+2]=255; d[i*4+3]=Math.round(a0*a);
      }
      x.putImageData(id,0,0); var wv=c.toDataURL('image/png');
      return cb(t,wv);
    }catch(e){}
    cb('','');
  };
  im.onerror=function(){ cb('',''); };
  im.src=url;
}
function refreshVariants(){
  var u=S.style.logo;
  if(!u){ V={t:'',w:'',src:''}; return; }
  if(V.src===u) return;
  // le versioni del logo (scontornata e bianca) si calcolano una volta e si ricordano: l'avvio resta veloce
  var k=imgKey(u), m=null; try{ m=JSON.parse(localStorage.getItem('ieci-logo-var')||'null'); }catch(e){}
  if(m&&m.k===k&&m.t){ V={t:m.t,w:m.w,src:u}; return; }
  buildVariants(u,function(t,w){ V={t:t,w:w,src:u}; renderLogoPrev(); schedule(); if(t&&(t.length+w.length)<1500000){ try{ localStorage.setItem('ieci-logo-var',JSON.stringify({k:k,t:t,w:w})); }catch(e){ try{ localStorage.removeItem('ieci-logo-var'); }catch(x){} } } });
}
function logoSrcPage(){ return V.src===S.style.logo&&V.t?V.t:S.style.logo; }
function logoSrcCover(){
  var m=S.style.coverLogo, line=S.style.cover==='line';
  if(line&&m==='white') m='transp';
  if(m==='plate'||V.src!==S.style.logo) return S.style.logo;
  if(m==='white') return V.w||S.style.logo;
  return V.t||S.style.logo;
}
function logoHtml(kind){
  var src=kind==='cover'?logoSrcCover():logoSrcPage();
  if(src) return '<img class="logo" src="'+src+'" alt="'+esc(S.company.name)+'">';
  var ini=(S.company.name||'?').trim().split(/\s+/).slice(0,2).map(function(w){return w.charAt(0).toUpperCase();}).join('');
  return '<span class="mark"><i>'+esc(ini)+'</i>'+esc(S.company.name)+'</span>';
}
function docTitle(){ return S.meta.title||MODELS[S.model].name; }
function pageHead(label){
  if(!S.show.pgHead) return '';
  return '<div class="pg-h"><div>'+logoHtml('page')+'</div><div class="pg-t"><b>'+esc(docTitle())+'</b>Preventivo n. '+esc(S.meta.num)+' · '+esc(label)+'</div></div>';
}
function pageFoot(){
  if(!S.show.pgFoot) return '';
  return '<div class="pg-f"><span>'+esc(S.company.name)+' · '+esc(S.company.piva)+'</span><span>'+esc(contactLine())+'</span></div>';
}
function validText(){
  var m=S.meta; if(!m.date||num(m.val)<=0) return '';
  var d=new Date(m.date+'T12:00:00'); d.setDate(d.getDate()+Math.round(num(m.val)));
  return dateIt(d.toISOString().slice(0,10));
}

function coverSlogan(){ var sl=S.meta.slogan; return (sl!=null&&String(sl).trim()!=='')?sl:S.profile.slogan; }
var COVART={
  ind:function(){ return '<g stroke-width="3"><rect x="262" y="12" width="236" height="340" rx="8"/><rect x="276" y="26" width="104" height="310" rx="4" stroke-width="1.8"/><rect x="384" y="26" width="102" height="310" rx="4" stroke-width="1.8"/>'+
    '<rect x="362" y="150" width="9" height="62" rx="4"/><rect x="392" y="150" width="9" height="62" rx="4"/>'+
    '<path d="M262 40H190L160 10H0M262 64H196L166 34H0" stroke-width="2.4"/></g>'+
    '<g stroke-width="1.6" opacity=".75"><rect x="290" y="46" width="76" height="62" rx="4"/><circle cx="328" cy="82" r="18"/><path d="M328 82L338 70M328 62V66"/>'+
    '<circle cx="420" cy="62" r="8"/><circle cx="446" cy="62" r="8"/><circle cx="472" cy="62" r="8"/><circle cx="440" cy="116" r="19"/><circle cx="440" cy="116" r="9"/>'+
    '<path d="M292 272H350M292 284H350M292 296H350M292 308H350M402 272H472M402 284H472M402 296H472M402 308H472"/><path d="M292 150H346M292 168H330"/></g>'; },
  vcit:function(){ return '<g stroke-width="3"><rect x="292" y="34" width="190" height="262" rx="20"/><rect x="170" y="128" width="84" height="202" rx="14"/></g>'+
    '<g stroke-width="1.8" opacity=".85"><rect x="308" y="52" width="158" height="116" rx="9"/><circle cx="387" cy="96" r="17"/><path d="M350 156A37 34 0 0 1 424 156"/>'+
    '<circle cx="332" cy="206" r="10"/><circle cx="387" cy="206" r="10"/><circle cx="442" cy="206" r="10"/><path d="M350 252H424M350 264H424M350 276H424"/>'+
    '<circle cx="212" cy="162" r="14" stroke-width="3"/><circle cx="212" cy="162" r="5"/><rect x="190" y="204" width="44" height="18" rx="5"/><rect x="190" y="234" width="44" height="18" rx="5"/><rect x="190" y="264" width="44" height="18" rx="5"/>'+
    '<path d="M150 112A60 60 0 0 1 110 60M128 126A90 90 0 0 1 70 36" opacity=".7"/></g>'; },
  dom:function(){ return '<path d="M0 150H310M460 150H520M0 192H310M460 192H520" stroke-width="1.6" opacity=".55"/>'+
    '<rect x="310" y="22" width="150" height="304" rx="16" stroke-width="3"/>'+
    '<path d="M385 22V92M385 232V326" stroke-width="1.4" opacity=".6"/>'+
    '<rect x="326" y="92" width="118" height="140" rx="9" stroke-width="1.8" opacity=".8"/>'+
    '<rect x="338" y="128" width="94" height="44" rx="10" stroke-width="3"/><path d="M356 150H414" stroke-width="1.6" opacity=".7"/>'+
    '<path d="M342 200H428M342 212H400" stroke-width="1.4" opacity=".6"/>'+
    '<g stroke-width="2.4"><circle cx="350" cy="56" r="14"/><circle cx="420" cy="56" r="14"/><circle cx="350" cy="292" r="14"/><circle cx="420" cy="292" r="14"/></g>'+
    '<g stroke-width="1.6" opacity=".7"><path d="M342 56H358M350 48V64M412 56H428M420 48V64M342 292H358M350 284V300M412 292H428M420 284V300"/></g>'; },
  vid:function(){ var eyes='';
    [[-1,-26],[8,-24],[-1,26],[8,24],[-10,0]].forEach(function(q){ });
    return '<g transform="translate(310 146) rotate(-5)">'+
    '<g stroke-width="3"><path d="M-100 -44H110M-100 44H110"/><ellipse cx="-100" cy="0" rx="22" ry="44"/><path d="M110 -44A22 44 0 0 1 110 44"/>'+
    '<path d="M-126 -50Q-126 -64 -110 -64H96Q116 -64 116 -48"/><path d="M52 -44A22 44 0 0 1 52 44"/>'+
    '<rect x="130" y="-14" width="26" height="28" rx="7"/><path d="M156 0H180Q200 0 200 22V74"/>'+
    '<circle cx="8" cy="62" r="17"/><path d="M-8 78L-18 116M24 78L34 116"/><rect x="-60" y="116" width="120" height="16" rx="6"/></g>'+
    '<g stroke-width="1.8" opacity=".85"><ellipse cx="-104" cy="0" rx="15" ry="33"/><ellipse cx="-107" cy="0" rx="9" ry="21"/><ellipse cx="-109" cy="0" rx="4" ry="9"/>'+
    '<circle cx="-100" cy="-27" r="2.5"/><circle cx="-100" cy="27" r="2.5"/><circle cx="-94" cy="-17" r="2.5"/><circle cx="-94" cy="17" r="2.5"/>'+
    '<circle cx="-30" cy="-24" r="2"/><circle cx="-30" cy="-34" r="2"/><circle cx="-34" cy="124" r="3"/><circle cx="34" cy="124" r="3"/></g>'+
    '<g stroke-width="1.6" opacity=".6"><path d="M-160 -34A50 50 0 0 0 -160 34M-192 -58A88 88 0 0 0 -192 58M-224 -82A126 126 0 0 0 -224 82"/></g></g>'; },
  aut:function(){ return '<g stroke-width="3"><path d="M150 322H520"/>'+
    '<rect x="170" y="74" width="42" height="248" rx="4"/><rect x="164" y="60" width="54" height="14" rx="4"/>'+
    '<rect x="470" y="74" width="46" height="248" rx="4"/><rect x="464" y="60" width="58" height="14" rx="4"/>'+
    '<rect x="218" y="132" width="122" height="186" rx="4"/><rect x="344" y="132" width="122" height="186" rx="4"/></g>'+
    '<g stroke-width="1.8" opacity=".8"><path d="M218 176H340M218 276H340M344 176H466M344 276H466"/>'+
    '<path d="M236 132V318M254 132V318M272 132V318M290 132V318M308 132V318M326 132V318M362 132V318M380 132V318M398 132V318M416 132V318M434 132V318M452 132V318" stroke-width="1.4" opacity=".7"/>'+
    '<circle cx="191" cy="44" r="9"/><path d="M174 30A24 24 0 0 0 174 58M208 30A24 24 0 0 1 208 58"/>'+
    '<rect x="176" y="236" width="12" height="20" rx="3"/><rect x="494" y="236" width="12" height="20" rx="3"/>'+
    '<path d="M214 214L252 184L292 214"/><circle cx="214" cy="214" r="5"/><circle cx="252" cy="184" r="5"/><circle cx="292" cy="214" r="5"/>'+
    '<rect x="176" y="200" width="30" height="26" rx="6" stroke-width="2.4"/></g>'; },
  all:function(){ var sh='M0 -150C48 -120 100 -108 140 -108V0C140 62 78 110 0 150C-78 110 -140 62 -140 0V-108C-100 -108 -48 -120 0 -150Z';
    return '<g transform="translate(360 176)"><path d="'+sh+'" stroke-width="3"/><path d="'+sh+'" stroke-width="3" transform="scale(.78)"/><path d="'+sh+'" stroke-width="1.6" opacity=".75" transform="scale(.56)"/></g>'+
    '<g stroke-width="1.8" opacity=".75"><circle cx="360" cy="168" r="14"/><path d="M360 182V212"/></g>'; },
  fv:function(){ var r='<g stroke-width="3"><circle cx="410" cy="92" r="42"/></g><g stroke-width="1.6" opacity=".75"><circle cx="410" cy="92" r="66"/></g><g stroke-width="2.4">';
    for(var i=0;i<16;i++){ var a=i*Math.PI/8; r+='<path d="M'+(410+Math.cos(a)*84).toFixed(1)+' '+(92+Math.sin(a)*84).toFixed(1)+'L'+(410+Math.cos(a)*102).toFixed(1)+' '+(92+Math.sin(a)*102).toFixed(1)+'"/>'; }
    return r+'</g><g stroke-width="3"><path d="M60 330L130 222H480L520 330Z"/></g><g stroke-width="1.6" opacity=".75"><path d="M107 258H493M83 294H506M217 222L175 330M305 222L290 330M392 222L405 330"/></g>'; },
  tv:function(){ var r='<g stroke-width="3">';
    [60,118,176,234].forEach(function(q){ r+='<path d="M'+(420-q)+' 292A'+q+' '+q+' 0 0 1 420 '+(292-q)+'"/>'; });
    return r+'</g><g stroke-width="1.8" opacity=".75"><path d="M420 292V330M420 292L456 330M420 292L384 330"/><circle cx="420" cy="292" r="9"/></g>'; },
  sw:function(){ return '<g stroke-width="3"><rect x="318" y="108" width="132" height="132" rx="16"/><rect x="354" y="144" width="60" height="60" rx="8" stroke-width="1.6" opacity=".75"/></g>'+
    '<g stroke-width="2.4"><path d="M0 286H180L214 252H318"/><path d="M0 232H110L146 196H318"/><path d="M450 150H492L520 122"/><path d="M450 198H520"/><path d="M384 108V60L412 32H520"/><path d="M384 240V300L408 324H520"/></g>'+
    '<g stroke-width="2" opacity=".8"><circle cx="180" cy="286" r="5"/><circle cx="110" cy="232" r="5"/><circle cx="492" cy="150" r="5"/><circle cx="412" cy="32" r="5"/><circle cx="408" cy="324" r="5"/></g>'; }
};
COVART.app=function(){ return '<g stroke-width="3"><rect x="176" y="14" width="318" height="300" rx="6"/></g><g stroke-width="2.2"><path d="M176 150H300M300 14V150M300 96H494M390 96V314M176 232H296"/><path d="M300 150a30 30 0 01-30-0M390 232a26 26 0 01-26 26" opacity=".7"/></g>'+
    '<g stroke-width="1.7" opacity=".8"><circle cx="238" cy="82" r="14"/><circle cx="238" cy="190" r="10"/><circle cx="342" cy="55" r="10"/><circle cx="440" cy="205" r="12"/><circle cx="440" cy="55" r="9"/><rect x="326" y="250" width="20" height="14" rx="3"/><rect x="190" y="262" width="20" height="14" rx="3"/><rect x="470" y="140" width="14" height="20" rx="3"/></g>'+
    '<path d="M176 60H96L66 30H0M176 96H104L74 66H0M176 200H88L58 170H0M176 262H110L80 232H0" stroke-width="2.4"/>'; };
COLL.rip='Ripristino del funzionamento verificato\nMisura di isolamento e continuità dei circuiti interessati\nProva di intervento dei differenziali\nVerifica del serraggio di morsetti e collegamenti\nControllo dell\'assenza di surriscaldamenti\nConsegna al cliente con indicazioni sull\'uso';
CRONO_DEF.rip='Sopralluogo e ricerca del guasto | 1\nFornitura dei materiali | 1\nIntervento di riparazione | 1\nVerifiche e collaudo | 1';
MARKT.rip=[['Guasto individuato','#C0392B'],['Parte da sostituire','#F5B800'],['Quadro','#2F65AE'],['Punto verificato','#2E9E5B'],['Altro','#555555']];
COVART.rip=function(){
  var bz='M0 -120C0 -120 0 -120 0 -120';
  return '<g transform="translate(384 168)"><g stroke-width="3"><rect x="-56" y="-118" width="112" height="236" rx="12"/><rect x="-40" y="-100" width="80" height="92" rx="8" stroke-width="2"/>'+
    '<rect x="-16" y="-86" width="32" height="64" rx="6" stroke-width="2.2"/><rect x="-12" y="-52" width="24" height="26" rx="5"/></g>'+
    '<g stroke-width="3"><rect x="-44" y="-134" width="30" height="16" rx="4"/><rect x="14" y="-134" width="30" height="16" rx="4"/><rect x="-44" y="118" width="30" height="16" rx="4"/><rect x="14" y="118" width="30" height="16" rx="4"/></g>'+
    '<g stroke-width="1.8" opacity=".85"><circle cx="-29" cy="-126" r="4"/><circle cx="29" cy="-126" r="4"/><circle cx="-29" cy="126" r="4"/><circle cx="29" cy="126" r="4"/>'+
    '<path d="M-32 18H32M-32 38H32M-32 58H4"/><path d="M-32 84H-10M10 84H32"/><circle cx="0" cy="84" r="6"/><path d="M-6 -70H6M-6 -62H6" opacity=".7"/></g></g>'+
    '<g transform="translate(288 252) rotate(-38)"><g stroke-width="3"><rect x="-13" y="-106" width="26" height="70" rx="11"/><rect x="-9" y="-36" width="18" height="16" rx="3"/><path d="M0 -20V70"/><path d="M-6 70L0 86L6 70Z"/></g>'+
    '<g stroke-width="1.8" opacity=".8"><path d="M-13 -90H13M-13 -76H13M-13 -62H13M-13 -48H13"/></g></g>'+
    '<g stroke-width="3"><path d="M206 20L168 88H198L180 138L234 64H204Z"/></g>'+
    '<g stroke-width="1.8" opacity=".75"><path d="M150 40L132 30M146 74L124 76M160 112L144 126M236 36L252 24M244 80L266 80"/></g>'+
    '<g stroke-width="2.4"><path d="M0 292H176L208 260H340V252"/><path d="M0 238H112L144 206"/><path d="M413 36V16H520"/></g>'+
    '<g stroke-width="1.8" opacity=".8"><circle cx="144" cy="206" r="5"/><circle cx="520" cy="16" r="0.1"/></g>';
};
COLL.wb='Verifica di continuità e resistenza di terra\nMisura di isolamento della linea dedicata\nProva dei dispositivi differenziali e di protezione\nVerifica di serraggio dei morsetti e della polarità\nProva di ricarica con il veicolo e controllo della corrente erogata\nConfigurazione dell\'app e consegna delle istruzioni';
CRONO_DEF.wb='Sopralluogo e definizione del percorso | 1\nPratiche e ordine dei materiali | 3\nPosa della linea e delle protezioni | 1\nInstallazione e collegamento della wallbox | 1\nCollaudo e prova di ricarica | 1';
MARKT.wb=[['Wallbox','#2E9E5B'],['Quadro e protezioni','#C0392B'],['Contatore','#F5B800'],['Percorso della linea','#2F65AE'],['Altro','#555555']];
COVART.wb=function(){
  return '<g transform="translate(398 150)"><g stroke-width="3"><rect x="-64" y="-120" width="128" height="240" rx="26"/><rect x="-48" y="-104" width="96" height="116" rx="16" stroke-width="2"/>'+
    '<circle cx="0" cy="-50" r="28"/><rect x="-32" y="46" width="64" height="52" rx="14"/></g>'+
    '<g stroke-width="1.8" opacity=".85"><circle cx="0" cy="-50" r="11"/><path d="M-4 -58L4 -50L-4 -42" /><path d="M-26 -2H26M-18 10H18"/>'+
    '<circle cx="-14" cy="66" r="5"/><circle cx="14" cy="66" r="5"/><circle cx="0" cy="82" r="5"/><circle cx="-18" cy="82" r="3"/><circle cx="18" cy="82" r="3"/></g>'+
    '<g stroke-width="1.6" opacity=".6"><path d="M-36 -86A52 52 0 0 1 36 -86"/></g></g>'+
    '<g stroke-width="3"><path d="M398 248C398 318 310 322 262 290"/></g>'+
    '<g transform="translate(246 280) rotate(-28)"><g stroke-width="3"><rect x="-30" y="-20" width="60" height="40" rx="12"/><circle cx="0" cy="0" r="13"/></g>'+
    '<g stroke-width="1.8" opacity=".85"><circle cx="-5" cy="-5" r="2"/><circle cx="5" cy="-5" r="2"/><circle cx="-6" cy="4" r="2"/><circle cx="6" cy="4" r="2"/><circle cx="0" cy="8" r="2"/></g></g>'+
    '<g stroke-width="3"><path d="M212 18L176 82H206L188 132L236 66H208Z"/></g>'+
    '<g stroke-width="1.8" opacity=".75"><path d="M154 38L136 28M150 74L128 76M164 112L148 126M246 30L262 18M254 76L276 76"/></g>'+
    '<g stroke-width="2.4"><path d="M0 214H116L148 182H334"/><path d="M0 150H70L98 122"/></g>'+
    '<g stroke-width="1.8" opacity=".8"><circle cx="98" cy="122" r="5"/></g>';
};
COLL.dom="Continuità dei conduttori di protezione\nResistenza di isolamento dei circuiti\nMisura della resistenza di terra\nProva di intervento dei differenziali\nVerifica polarità e funzionamento di prese e punti luce\nVerifica della caduta di tensione sulle linee più lunghe\nVerifica targhette e identificazione dei circuiti\nConsegna Dichiarazione di Conformità e istruzioni";
CRONO_DEF.dom="Sopralluogo e predisposizioni | 1\nTracce e posa tubazioni | 3\nPosa cavi e scatole | 3\nQuadro e collegamenti | 2\nFrutti, placche e apparecchi | 2\nVerifiche e collaudo | 1\nConsegna e Dichiarazione di Conformità | 1";
COLL.vid="Funzionamento e inquadratura di ogni telecamera\nRegistrazione e riproduzione sul registratore\nAccesso remoto da app configurato e provato\nVisione notturna / infrarossi\nPrestazioni dell'alimentazione PoE e della rete\nData e ora del registratore e tempo di conservazione\nPassword personalizzate impostate e consegnate\nCartello informativo posizionato\nFormazione al cliente sull'uso";
CRONO_DEF.vid="Sopralluogo e definizione posizioni | 1\nPratiche e ordine materiali | 3\nPosa cavi e tubazioni | 2\nInstallazione telecamere | 1\nConfigurazione registratore, rete e app | 1\nCollaudo e formazione | 1";
COLL.all="Prova di ogni sensore e contatto\nProva di sirene interne ed esterne\nProva di inserimento e disinserimento\nProva di allarme sabotaggio e mancanza rete\nComunicatore e notifiche verificati\nControllo carica batterie e alimentazione\nCodici utente e telecomandi consegnati\nFormazione al cliente sull'uso";
CRONO_DEF.all="Sopralluogo e definizione sensori | 1\nPosa linee e tubazioni | 2\nInstallazione sensori e sirene | 1\nCentrale, programmazione e comunicatore | 1\nCollaudo e formazione | 1";
COLL.aut="Verifica della forza di spinta e arresto per ostacolo\nProva delle fotocellule e della costa di sicurezza\nProva dello sblocco manuale\nProgrammazione e prova dei radiocomandi\nVerifica di lampeggiante e finecorsa\nVerifica della messa a terra e delle protezioni\nFascicolo tecnico, marcatura e istruzioni consegnati";
CRONO_DEF.aut="Sopralluogo e misure | 1\nOrdine e fornitura materiali | 5\nScavi, tubazioni e fissaggi | 1\nInstallazione motori e fotocellule | 2\nCablaggi e programmazione centrale | 1\nCollaudo e consegna | 1";
COLL.fv="Controllo serraggio e fissaggio della struttura\nVerifica polarità e tensioni delle stringhe\nProva di isolamento lato DC\nMisura della corrente di cortocircuito delle stringhe\nMessa in servizio e collegamento dell'inverter\nVerifica protezioni, SPD e messa a terra\nProva di funzionamento dell'accumulo\nMonitoraggio configurato e accessibile\nConsegna Dichiarazione di Conformità e documentazione";
CRONO_DEF.fv="Sopralluogo, progetto e pratiche | 10\nOrdine materiali | 7\nAllestimento cantiere e ponteggi | 1\nInstallazione struttura e moduli | 3\nCablaggi e quadri | 2\nInverter e accumulo | 1\nCollaudo e messa in servizio | 1\nConnessione alla rete e attivazione | 15";
COLL.tv="Livello di segnale su tutte le prese\nSintonizzazione dei canali\nVerifica orientamento antenna / parabola\nProva su ogni presa TV e SAT\nVerifica della tenuta degli ancoraggi\nConsegna istruzioni al cliente";
CRONO_DEF.tv="Sopralluogo e misure di segnale | 1\nInstallazione antenna e cavi | 1\nPrese e centralino | 1\nSintonizzazione e collaudo | 1";
COLL.ind="Controllo conformità del quadro agli schemi\nProva di isolamento dei circuiti\nVerifica continuità di protezione e impianto di terra\nProva di intervento delle protezioni\nProva funzionale dei carichi e dei motori\nVerifica del senso di rotazione\nMisura dell'illuminamento nelle zone di lavoro\nConsegna Dichiarazione di Conformità e schemi as built";
CRONO_DEF.ind="Progetto esecutivo | 10\nApprovvigionamento materiali | 10\nPosa passerelle e tubazioni | 6\nPosa cavi | 6\nMontaggio quadri e collegamenti | 6\nVerifiche e collaudo | 3\nDocumentazione finale | 2";
COLL.sw="Verifica delle specifiche funzionali concordate\nProva degli ingressi e delle uscite in campo\nProva dei casi di allarme ed errore\nVerifica dei tempi di risposta e di riavvio dopo un'interruzione\nBackup del programma consegnato\nDocumentazione tecnica e credenziali consegnate\nFormazione agli operatori";
CRONO_DEF.sw="Analisi e specifiche | 3\nSviluppo | 10\nTest in laboratorio | 3\nInstallazione e collaudo in campo | 2\nFormazione e consegna | 1";
MARKT.vid=[["Telecamera", "#2F65AE"], ["Registratore (NVR)", "#C0392B"], ["Switch PoE", "#2E9E5B"], ["Alimentazione / UPS", "#F5B800"], ["Monitor", "#8E44AD"], ["Altro", "#555555"]];
MARKT.all=[["Sensore volumetrico", "#2F65AE"], ["Contatto porta / finestra", "#2E9E5B"], ["Sirena", "#C0392B"], ["Centrale", "#8E44AD"], ["Tastiera", "#F5B800"], ["Rilevatore fumo / gas", "#E67E22"], ["Altro", "#555555"]];
MARKT.aut=[["Motore", "#C0392B"], ["Fotocellula", "#2F65AE"], ["Lampeggiante", "#F5B800"], ["Centrale / quadro", "#8E44AD"], ["Selettore / tastiera", "#2E9E5B"], ["Costa di sicurezza", "#E67E22"], ["Altro", "#555555"]];
MARKT.fv=[["Pannelli", "#2F65AE"], ["Inverter", "#C0392B"], ["Batteria", "#2E9E5B"], ["Quadro", "#F5B800"], ["Accesso / ponteggio", "#8E44AD"], ["Contatore", "#E67E22"], ["Altro", "#555555"]];
MARKT.ind=[["Quadro", "#C0392B"], ["Corpo illuminante", "#F5B800"], ["Presa CEE", "#2F65AE"], ["Passerella", "#2E9E5B"], ["Motore / utenza", "#8E44AD"], ["Emergenza", "#E67E22"], ["Altro", "#555555"]];
function covArt(){
  if(!S.show.cvCable) return '';
  var a=COVART[S.model]||COVART.ind;
  return '<svg class="circuit" viewBox="0 0 520 330" width="520" height="330" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+a()+'</svg>';
}
function secCover(){
  var sh=S.show; if(!sh.cover) return '';
  var m=S.meta,c=S.company,k=S.client,v=validText();
  var cable=covArt();
  var soc='';
  if(sh.cvSocial){ var ci=contactItems(); if(ci.length) soc='<div class="cv-soc">'+ci.map(function(c){ return '<a class="cs" href="'+esc(c.url)+'" target="_blank" rel="noopener">'+iconHtml(c)+'<span>'+esc(c.sub)+'</span></a>'; }).join('')+'</div>'; }
  var plain=(S.style.coverLogo!=='plate'||S.style.cover==='line');
  var cols=[];
  if(sh.cvClient) cols.push('<div><small>Preparato per</small><b>'+esc(k.name)+'</b>'+esc(k.addr)+(k.cf?'<br>'+esc(/^[A-Z]{6}\d/.test(k.cf)?'C.F. '+k.cf:k.cf):'')+'</div>');
  if(sh.cvValid) cols.push('<div><small>Validità offerta</small><b>'+(v?'fino al '+esc(v):'—')+'</b>'+(num(m.val)>0?esc(String(num(m.val)))+' giorni':'')+'</div>');
  if(sh.cvCompany) cols.push('<div><small>La tua ditta di fiducia</small><b>'+esc(c.name)+'</b>'+esc(c.addr)+'<br>'+esc(c.tel)+(c.email?'<br>'+esc(c.email):'')+(c.web?' · '+esc(String(c.web).replace(/^https?:\/\//i,'')):'')+'</div>');
  return '<section class="page cover cv-'+S.style.cover+'">'+
    '<div class="cv-head">'+cable+
      '<div class="cv-top"><div class="plate'+(plain?' plain':'')+'">'+logoHtml('cover')+'</div>'+
      (sh.cvRef?'<div class="cv-ref">Preventivo n.<b>'+esc(m.num)+'</b>'+esc(dateIt(m.date))+'</div>':'')+'</div>'+
      '<div class="cv-mid">'+(sh.cvKicker?'<div class="kicker">'+esc(MODELS[S.model].name)+'</div>':'')+'<h1>'+esc(docTitle())+'</h1>'+
      (sh.cvSlogan&&coverSlogan()?'<p>'+esc(coverSlogan())+'</p>':'')+'</div>'+soc+'</div>'+
    (cols.length?'<div class="cv-bot" style="--n:'+cols.length+'">'+cols.join('')+'</div>':'')+'</section>';
}
function specsHtml(t){
  var rows=lines(t); if(!rows.length) return '';
  return '<table class="specs"><tbody>'+rows.map(function(r){
    var i=r.indexOf(':'); if(i<1) return '<tr><td colspan="2">'+esc(r)+'</td></tr>';
    return '<tr><td>'+esc(r.slice(0,i).trim())+'</td><td>'+esc(r.slice(i+1).trim())+'</td></tr>';
  }).join('')+'</tbody></table>';
}
// marca nella scheda: il logo se lo conosco, il resto (es. la serie) scritto accanto
function brandLine(b){
  var lg=brandLogo(b); if(!lg) return '<div class="brand">'+esc(b)+'</div>';
  var base=iwBase(b), rest=String(b).trim(); if(base&&rest.toLowerCase().indexOf(base.toLowerCase())===0) rest=rest.slice(base.length).replace(/^[\s\-·:]+/,'');
  return '<div class="brand lg"><img src="'+lg+'" alt="'+esc(base||b)+'">'+(rest?'<span>'+esc(rest)+'</span>':'')+'</div>';
}
function prodHtml(p,big){
  var x=p.x||{}, ph=x.photos?[]:(p.photos||[]), has=ph.length>0, ps=Math.max(15,Math.min(100,num(p.ps)||45));
  var photos=has?'<div class="p-ph" style="width:'+ps+'%"><img class="main" src="'+ph[0]+'" alt="'+esc(p.name)+'" referrerpolicy="no-referrer">'+
    (ph.length>1?'<div class="th">'+ph.slice(1).map(function(u){return '<img src="'+u+'" alt="" referrerpolicy="no-referrer">';}).join('')+'</div>':'')+prodCred(p,ph)+'</div>':'';
  var tags=x.tags?'':String(p.tags||'').split(',').map(function(t){return t.trim();}).filter(Boolean).map(function(t){return '<span class="tag">'+esc(t)+'</span>';}).join('');
  var link=(!x.link&&p.link)?'<a class="ds" href="'+esc(p.link)+'" target="_blank" rel="noopener">Scheda tecnica: '+esc(p.link)+'</a>':'';
  var pdfn=(p.pdf&&!x.pdf&&S.style.attachPdf)?'<div class="ds">Scheda tecnica completa allegata in fondo al fascicolo ('+esc(p.pdf.name)+')</div>':'';
  var rest=(x.specs?'':specsHtml(p.specs))+tags+link+pdfn;
  var solb=brOn()?prodSysLabel(p):(vcBoth()&&(p.sol==='video'||p.sol==='cit'))?'<div><span class="solb '+(p.sol==='cit'?'c':'')+'">'+vcSolName(p.sol)+'</span></div>':(vcBoth()?'<div><span class="solb t">Per entrambe le soluzioni</span></div>':'');
  if(PG_GROUPED) solb='';
  var alt=prodAlt(p);
  return '<article class="prod'+(has?'':' nophoto')+(big?' big':'')+(alt?' alt':'')+'"><div class="p-i">'+solb+prodBadge(p,alt)+
    (p.brand?brandLine(p.brand):'')+'<h3>'+esc(p.name)+'</h3>'+(p.code?'<div class="code">'+esc(p.code)+'</div>':'')+
    ((!x.desc&&p.desc)?'<p>'+esc(p.desc)+'</p>':'')+'</div>'+photos+(rest?'<div class="p-i">'+rest+'</div>':'')+'</article>';
}

