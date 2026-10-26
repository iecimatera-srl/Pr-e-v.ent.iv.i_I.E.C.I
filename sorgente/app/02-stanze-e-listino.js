var KITS={"cu": [["Punto luce semplice", 1], ["Punto luce sottopensile cucina", 1], ["Punto presa 10/16 A", 6], ["Linea dedicata forno", 1], ["Linea dedicata piano cottura a induzione", 1], ["Linea dedicata lavastoviglie", 1], ["Linea dedicata frigorifero / congelatore", 1], ["Linea dedicata cappa aspirante", 1], ["Rilevatore di gas", 1], ["Tracce murarie e ripristino", 12]], "so": [["Punto luce deviato", 1], ["Faretto LED da incasso, fornito e posato", 4], ["Punto presa 10/16 A", 8], ["Punto presa TV terrestre", 1], ["Punto presa TV + SAT", 1], ["Punto rete dati RJ45 cat. 6", 2], ["Linea dedicata climatizzatore (split)", 1], ["Comando tapparella elettrica, motore e pulsante", 1], ["Dimmer / regolatore di luce", 1], ["Tracce murarie e ripristino", 15]], "ca": [["Punto luce invertito", 1], ["Punto presa 10/16 A", 6], ["Presa con USB", 2], ["Punto rete dati RJ45 cat. 6", 1], ["Punto presa TV terrestre", 1], ["Comando tapparella elettrica, motore e pulsante", 1], ["Linea dedicata climatizzatore (split)", 1], ["Tracce murarie e ripristino", 12]], "ba": [["Punto luce semplice", 1], ["Punto luce specchio bagno", 1], ["Faretto LED da incasso, fornito e posato", 3], ["Punto presa 10/16 A", 2], ["Aspiratore bagno, linea e comando", 1], ["Linea dedicata boiler / scaldacqua elettrico", 1], ["Collegamento equipotenziale bagno", 1], ["Pulsante a tirante bagno / doccia", 1], ["Tracce murarie e ripristino", 8]], "in": [["Punto luce deviato", 1], ["Punto presa 10/16 A", 2], ["Videocitofono: monitor interno", 1], ["Videocitofono: posto esterno", 1], ["Campanello / suoneria", 1], ["Elettroserratura / apriporta", 1], ["Tracce murarie e ripristino", 6]], "co": [["Punto luce invertito", 1], ["Faretto LED da incasso, fornito e posato", 3], ["Punto presa 10/16 A", 1], ["Rilevatore di fumo", 1], ["Lampada di emergenza", 1], ["Tracce murarie e ripristino", 8]], "st": [["Punto luce semplice", 1], ["Punto presa 10/16 A", 8], ["Presa con USB", 2], ["Punto rete dati RJ45 cat. 6", 3], ["Access point Wi-Fi: punto rete e alimentazione", 1], ["Linea dedicata climatizzatore (split)", 1], ["Tracce murarie e ripristino", 10]], "cm": [["Punto luce semplice", 1], ["Punto presa 10/16 A", 5], ["Presa con USB", 2], ["Punto rete dati RJ45 cat. 6", 1], ["Comando tapparella elettrica, motore e pulsante", 1], ["Tracce murarie e ripristino", 10]], "la": [["Punto luce semplice", 1], ["Punto presa 10/16 A", 2], ["Linea dedicata lavatrice", 1], ["Linea dedicata asciugatrice", 1], ["Linea dedicata boiler / scaldacqua elettrico", 1], ["Sensore allagamento", 1], ["Tracce murarie e ripristino", 6]], "bl": [["Punto luce esterno IP55", 2], ["Presa esterna IP55", 1], ["Comando tapparella elettrica, motore e pulsante", 1]], "bx": [["Punto luce semplice", 2], ["Lampada di emergenza", 1], ["Presa schuko 16 A dedicata", 2], ["Linea per colonnina di ricarica auto (wallbox)", 1]], "ri": [["Punto luce con rilevatore di presenza", 1], ["Punto presa 10/16 A", 1]], "al": [["Punto luce semplice", 1], ["Punto presa 10/16 A", 3]], "ge": [["Quadro elettrico, fino a 18 moduli", 1], ["Interruttore differenziale tipo A 30 mA", 2], ["Scaricatore di sovratensione (SPD)", 1], ["Montante dal contatore al quadro (fino a 10 m)", 1], ["Impianto di messa a terra / dispersore", 1], ["Verifiche strumentali e collaudo", 1], ["Pratiche e documentazione tecnica", 1], ["Dichiarazione di conformità (DM 37/08)", 1]]};

function rid(){ return 'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }
function roomSvg(kind,cls){ return '<svg class="'+(cls||'rsvg')+'" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ROOMICO[kind]||ROOMICO.al)+'</svg>'; }
function roomById(id){ if(!id) return null; for(var i=0;i<S.rooms.length;i++) if(S.rooms[i].id===id) return S.rooms[i]; return null; }
function roomKey(l){ return (l&&l.r&&roomById(l.r))?l.r:''; }
function curKey(){ return (S.model==='app'&&roomById(S.curRoom))?S.curRoom:''; }
function curKind(){ var r=roomById(curKey()); return r?r.kind:'ge'; }
function curRoomName(){ var r=roomById(curKey()); return r?r.name:'Parti comuni e generali'; }
function uniqueRoomName(kind){
  var base=ROOMNAME[kind]||'Stanza', names=S.rooms.map(function(r){return r.name;}), n=base, i=2;
  while(names.indexOf(n)>-1){ n=base+' '+i; i++; } return n;
}
function defaultRooms(){ return ['in','cu','so','ca','ba'].map(function(k){ return {id:rid(),name:ROOMNAME[k],kind:k}; }); }
function ensureRooms(){
  if(S.model==='app'&&!S.__rm&&!S.rooms.length){ S.rooms=defaultRooms(); S.curRoom=S.rooms[0].id; }
  if(S.model==='app') S.__rm=1;
}
function groupLines(list){
  var out=[], map={}; S.rooms.forEach(function(r){ var g={room:r,items:[]}; map[r.id]=g; out.push(g); });
  var gen={room:null,items:[]}; out.push(gen);
  list.forEach(function(l,i){ var k=roomKey(l); (k?map[k]:gen).items.push({l:l,i:i}); });
  return out.filter(function(g){ return g.items.length; });
}
function groupSum(g){ return g.items.reduce(function(a,x){ return a+lineTotal(x.l); },0); }
function groupName(g){ return g.room?g.room.name:ROOMNAME.ge; }
function appRows(L,rowFn){
  return groupLines(L).map(function(g){
    var sum=groupSum(g);
    return '<tr class="rmh"><td colspan="7"><span class="ri">'+roomSvg(g.room?g.room.kind:'ge','rsvg')+'</span><b>'+esc(groupName(g))+'</b><span class="rs">'+g.items.length+(g.items.length===1?' voce':' voci')+' · '+eur(sum)+'</span></td></tr>'+
      g.items.map(function(x){ return rowFn(x.l,x.i); }).join('');
  }).join('');
}
function appSummary(L){
  var G=groupLines(L); if(G.length<2) return '';
  return '<div class="rsum"><div class="h4">Riepilogo per ambiente</div>'+G.map(function(g){ return '<div class="rsr"><span class="ri">'+roomSvg(g.room?g.room.kind:'ge','rsvg')+'</span><span class="rn">'+esc(groupName(g))+'</span><span class="ra">'+eur(groupSum(g))+'</span></div>'; }).join('')+'</div>';
}
function roomOpts(sel){
  var k=roomKey({r:sel});
  return '<option value=""'+(k?'':' selected')+'>'+ROOMNAME.ge+'</option>'+S.rooms.map(function(r){ return '<option value="'+esc(r.id)+'"'+(r.id===k?' selected':'')+'>'+esc(r.name)+'</option>'; }).join('');
}
var catAll=false;
function cgSync(m,st){
  st=st||S; if(!st.cgroups) st.cgroups={}; var l=st.cgroups[m]; if(!Array.isArray(l)) l=st.cgroups[m]=[];
  ((st.cat&&st.cat[m])||[]).forEach(function(it){ if(it[3]&&l.indexOf(it[3])<0) l.push(it[3]); });
  return l;
}
function catOrderIdx(m){
  var items=S.cat[m]||[], gl=cgSync(m), idx=[];
  gl.forEach(function(g){ items.forEach(function(it,i){ if(it[3]===g) idx.push(i); }); });
  items.forEach(function(it,i){ if(!it[3]||gl.indexOf(it[3])<0) idx.push(i); });
  return idx;
}
function setItG(it,g){ while(it.length<4) it.push(''); it[3]=g; }
function groupOpts(m,sel,first){
  return '<option value="">'+(first||'Senza categoria')+'</option>'+cgSync(m).map(function(g){ return '<option value="'+esc(g)+'"'+(g===sel?' selected':'')+'>'+esc(g)+'</option>'; }).join('');
}
function catItem(desc){
  var a=(S.cat.app||[]).concat(MODELS.app.items), i; for(i=0;i<a.length;i++) if(a[i][0]===desc) return a[i]; return null;
}
function addToRoom(it,qty){
  var key=curKey(), ex=S.lines.filter(function(l){ return l.d===it[0]&&num(l.p)===num(it[2])&&(S.model!=='app'||roomKey(l)===key); })[0];
  if(ex){ ex.q=num(ex.q)+qty; return ex; }
  var nl={d:it[0],u:it[1],q:qty,p:it[2],s:0}; if(S.model==='app'&&key) nl.r=key; S.lines.push(nl); return nl;
}
function renderRooms(){
  var box=$('acc-rooms'); if(!box) return;
  var on=S.model==='app'; box.hidden=!on; if(!on) return;
  var cnt={}; S.lines.forEach(function(l){ var k=roomKey(l); cnt[k]=(cnt[k]||0)+1; });
  var cur=curKey(), r=roomById(cur);
  var chips='<div class="rchips">'+S.rooms.map(function(x){
    return '<button type="button" class="rchip" data-room="'+esc(x.id)+'" aria-pressed="'+(x.id===cur)+'">'+roomSvg(x.kind,'rsvg')+'<span class="rl">'+esc(x.name)+'</span><em>'+(cnt[x.id]||0)+'</em></button>';
  }).join('')+'<button type="button" class="rchip" data-room="" aria-pressed="'+(!cur)+'">'+roomSvg('ge','rsvg')+'<span class="rl">Parti comuni</span><em>'+(cnt['']||0)+'</em></button></div>';
  var ed='<div class="redit">';
  if(r){
    ed+='<label class="f">Nome della stanza<input type="text" id="rm-name" value="'+esc(r.name)+'" maxlength="60"></label>'+
      '<label class="f">Tipo di locale<select id="rm-kind">'+ROOMORD.map(function(k){ return '<option value="'+k+'"'+(k===r.kind?' selected':'')+'>'+ROOMNAME[k]+'</option>'; }).join('')+'</select></label>';
  }
  ed+='<div class="row"><button type="button" class="btn sm" data-rmact="kit">Aggiungi kit '+(r?'«'+esc(ROOMNAME[r.kind])+'»':'impianto generale')+'</button>';
  if(r) ed+='<button type="button" class="btn ghost sm" data-rmact="left" aria-label="Sposta a sinistra">◀</button><button type="button" class="btn ghost sm" data-rmact="right" aria-label="Sposta a destra">▶</button><button type="button" class="btn ghost sm" data-rmact="dup">Duplica</button><button type="button" class="btn x" data-rmact="del" aria-label="Elimina stanza">×</button>';
  ed+='</div><p class="hint">'+(r?'Le voci che aggiungi dal listino qui sotto vanno in «'+esc(r.name)+'». Il kit inserisce le voci tipiche del locale: poi modifichi quantità e prezzi.':'Le voci qui vanno in «Parti comuni e generali»: quadro, messa a terra, pratiche, collaudo.')+'</p></div>';
  var add='<div class="radd"><span class="hint">Aggiungi una stanza:</span><div class="rkinds">'+ROOMORD.map(function(k){ return '<button type="button" class="rk" data-addroom="'+k+'" title="Aggiungi '+esc(ROOMNAME[k])+'">'+roomSvg(k,'rsvg')+'<span>'+esc(ROOMNAME[k])+'</span></button>'; }).join('')+'</div></div>';
  $('rooms').innerHTML=chips+ed+add;
}
function afterRoomChange(){ renderRooms(); renderCat(); renderLines(); touch(); }
function addKit(){
  var kind=curKind(), kit=KITS[kind]||[], key=curKey(), a=0, sk=0;
  kit.forEach(function(x){
    var it=catItem(x[0]); if(!it) return;
    var ex=S.lines.some(function(l){ return l.d===it[0]&&roomKey(l)===key; });
    if(ex){ sk++; return; }
    var nl={d:it[0],u:it[1],q:x[1],p:it[2],s:0}; if(key) nl.r=key; S.lines.push(nl); a++;
  });
  afterRoomChange();
  toast(a?('Kit inserito: '+a+' voci in «'+curRoomName()+'»'+(sk?' ('+sk+' già presenti)':'')):'Il kit è già presente in questa stanza');
}

