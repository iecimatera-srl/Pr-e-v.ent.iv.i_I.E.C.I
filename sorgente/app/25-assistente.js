/* ===== Assistente: dal testo (scritto o dettato) al preventivo. Gratis, senza internet, nessun dato inviato ===== */
var AS={res:null, rec:null, ascolto:false, aperti:{}};
var AS_NUM={un:1,uno:1,una:1,due:2,tre:3,quattro:4,cinque:5,sei:6,sette:7,otto:8,nove:9,dieci:10,undici:11,dodici:12,tredici:13,quattordici:14,quindici:15,sedici:16,diciassette:17,diciotto:18,diciannove:19,venti:20,ventiquattro:24,trenta:30,quaranta:40,cinquanta:50,sessanta:60,settanta:70,ottanta:80,novanta:90,cento:100,mezzo:0.5,mezza:0.5};
var AS_STOP=' di da del dello della dei degli delle con per il lo la i gli le un una uno e ed a ad in su tipo nuovo nuova nuovi nuove anche circa tutto tutta tutti tutte al alla alle ai agli nel nella nei nelle sul sulla sui ogni mio mia vorrei voglio serve servono fare metti mettere aggiungi preventivo impianto installazione fornitura posa ';
var AS_SIN=[[/\bluci\b/g,'punti luce'],[/\bspot\b/g,'faretti'],[/\btvcc\b|\bcam\b/g,'telecamere'],[/\bpir\b/g,'sensori volumetrici'],[/\btelecomand[io]\b/g,'radiocomandi'],[/\bsalvavita\b/g,'magnetotermico differenziale'],[/\bpunti rete\b|\bprese rete\b|\bprese dati\b/g,'punto presa dati rj45'],[/\bprese tv\b/g,'presa tv sat'],[/\bcitofoni\b/g,'posto interno citofono'],[/\bmonitor\b/g,'monitor interno'],[/\bprese\b(?! (?:tv|bipasso|schuko|usb|dati|rete|cee|esterne|ip))/g,'punti presa']];
var AS_TIPI=[['vcit',/videocitofon|citofon|posto esterno|pulsantier|condomin/g],['vid',/telecamer|videosorveglian|\bnvr\b|\bdvr\b/g],['all',/allarm|antifurt|antintrusion|volumetric|contatt[io] magnetic/g],['aut',/cancell|automazion|sbarr|basculant|sezional|dissuasor/g],['fv',/fotovoltaic|pannell[io] solar|\bkwp\b|accumul|inverter/g],['wb',/wallbox|colonnin[ae] di ricarica|ricarica (auto|veicol|dell)|auto elettric/g],['tv',/antenn|parabol|digitale terrestre|centralino tv|\bsat\b/g],['ind',/capannon|industrial|officin|stabiliment|blindosbarr|\bcee\b/g],['sw',/\bplc\b|scada|\bhmi\b|\bknx\b|programmazion|firmware/g],['rip',/riparaz|guast|non funzion|salta|cortocircuit|scatta|emergenz|intervento/g],['app',/appartament|\bcamer[ae]\b|\bbagn[io]\b|\bcucin|soggiorn|ingress|corridoi|camerett/g],['dom',/impianto elettrico|\bcasa\b|villett|abitazion|punti? luce|\bprese\b/g]];
var AS_STANZE=[[/camerett[ae]/,'cm'],[/camer[ae](?: da letto| matrimonial[ei])?\b/,'ca'],[/bagn[io]|servizi igienici/,'ba'],[/cucin[ae]|angolo cottura/,'cu'],[/soggiorn[oi]|salon[ei]|salott[oi]|living/,'so'],[/ingress[oi]/,'in'],[/corridoi?o?|disimpegn[oi]/,'co'],[/studi[oi]/,'st'],[/lavanderi[ae]/,'la'],[/balcon[ei]|terrazz[oi]|giardin[oi]/,'bl'],[/\bbox\b|garage|cantin[ae]|autorimess[ae]/,'bx'],[/ripostigli[oi]/,'ri']];
var AS_MARCHE=['Bticino','Vimar','AVE','Gewiss','Schneider','Legrand','ABB','Hager','Siemens','Urmet','Comelit','Elvox','Fermax','Came','Nice','FAAC','BFT','Beninca','Fadini','RIB','Hikvision','Dahua','Uniview','Axis','Hanwha','Ajax','Tecnoalarm','EL.MO','Bentel','Inim','Huawei','SMA','Fronius','SolarEdge','SAJ','Sungrow','Zucchetti','Aiko','SunPower','Fibaro','Shelly','Fracarro','Emme Esse','Fte'];

function asNorm(t){
  t=' '+String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’`]/g,"'")+' ';
  t=t.replace(/\b(\d+),(\d+)\b/g,'$1.$2').replace(/\bmetri quadr[ia]\b|\bm2\b|\bm²/g,' mq ').replace(/(\d)\s*(mq|kwp|kwh|kw|mp|tb|mm|m|metri|mt|ml)\b/g,'$1 $2');
  Object.keys(AS_NUM).forEach(function(w){ t=t.replace(new RegExp('\\b'+w+'\\b','g'),String(AS_NUM[w])); });
  AS_SIN.forEach(function(s){ t=t.replace(s[0],s[1]); });
  return t.replace(/\s+/g,' ');
}
function asStem(w){ w=w.replace(/[^a-z0-9"]/g,''); if(/^\d/.test(w)) return w; w=w.replace(/[aeiou]+$/,''); return w.slice(0,6); }
function asToks(t){ return asNorm(t).replace(/(\d+(?:\.\d+)?)\s+(mp|tb|kw|kwp|kwh|mm|canali|porte|cm)\b/g,'$1$2').split(/[^a-z0-9."]+/).filter(function(w){ return w&&w.length>1&&AS_STOP.indexOf(' '+w+' ')<0; }).map(asStem).filter(Boolean); }
function asItem(model,name){
  var r=null; (S.cat[model]||[]).forEach(function(c){ if(!r&&c[0]===name) r=c; });
  if(!r) (MODELS[model]?MODELS[model].items:[]).forEach(function(c){ if(!r&&c[0]===name) r=c; });
  return r;
}
// voce del listino che corrisponde meglio a una frase ("8 telecamere 4 mp" -> "Telecamera IP 4 MP bullet PoE")
function asMatch(model,frase,min){
  var ft=asToks(frase); if(!ft.length) return null;
  var best=null, bs=0;
  (S.cat[model]||[]).forEach(function(c){
    var it=asToks(c[0]), m=0; ft.forEach(function(w){ if(it.indexOf(w)>-1) m+=(/\d/.test(w)?1.5:1); });
    if(!m) return;
    var sc=m*2-0.08*it.length+(it[0]===ft[0]?0.5:0);
    if(sc>bs){ bs=sc; best={it:c,m:m,ft:ft.length}; }
  });
  if(!best) return null;
  if(best.m<(min||1)||best.m<Math.min(2,best.ft)*0.5) return null;
  return best.it;
}
function asTipo(n,attuale){
  var sc={}; AS_TIPI.forEach(function(x){ var m=n.match(x[1]); sc[x[0]]=m?m.length:0; });
  if(sc.vcit&&/\btelecamer/.test(n)===false) sc.vcit+=1;
  var best=null, bv=0; AS_TIPI.forEach(function(x){ if(sc[x[0]]>bv){ bv=sc[x[0]]; best=x[0]; } });
  if(best==='dom'&&sc.app) best='app';
  return best;
}
function asCliente(t){
  var o={}, m;
  m=t.match(/(?:\bper\s+(?:il\s+|la\s+)?(?:sig(?:\.|nor)?(?:ra|a)?\.?\s+|dott(?:\.|or)?(?:ssa)?\.?\s+|famiglia\s+|ditta\s+|cliente\s+)?|\bcliente[:\s]+)((?:[A-Z][\wàèéìòù']+)(?:\s+(?:[A-Z][\wàèéìòù']+|di|de|del|della|d'))*)/);
  if(m&&!/^(Via|Viale|Piazza|Corso|Il|La|Un|Una)$/.test(m[1].split(' ')[0])&&!AS_MARCHE.some(function(b){ return b.toLowerCase()===m[1].split(' ')[0].toLowerCase(); })) o.name=m[1].trim();
  m=t.match(/\b((?:via|viale|v\.le|piazza|p\.zza|corso|c\.so|vico|vicolo|contrada|c\.da|largo|strada|localit[aà]|loc\.)\s+[^,;\n]+?)(?:\s*,\s*([A-Z][\wàèéìòù' ]{2,30}?))?(?=\s*(?:[,;.:\n]|$|\s(?:con|tel|telefono|cell)\b))/i);
  if(m){ o.addr=m[1].trim().replace(/\s+/g,' ')+(m[2]?', '+m[2].trim():''); }
  m=t.match(/((?:\+39[\s.]?)?3\d{2}[\s.]?\d{3}[\s.]?\d{3,4})/); if(m) o.tel=m[1].replace(/[\s.]+/g,' ').trim();
  m=t.match(/[\w.+-]+@[\w-]+\.[\w.]+/); if(m) o.email=m[0];
  return o;
}
function asMarche(t){ var r=[]; AS_MARCHE.forEach(function(b){ var re=new RegExp('\\b'+b.replace(/[.]/g,'\\.')+'\\b','i'); var m=t.match(re); if(m&&r.indexOf(b)<0) r.push({b:b,i:m.index}); }); return r.sort(function(a,b){ return a.i-b.i; }).map(function(x){ return x.b; }); }
function asStanze(n){
  var out=[], visti={};
  n.split(/[,;.\n]|\se\s|\scon\s/).forEach(function(seg){
    AS_STANZE.forEach(function(s){
      var re=new RegExp('(?:\\b(\\d+)\\s+)?\\b(?:'+s[0].source+')'), m=seg.match(re); if(!m) return;
      if(s[1]==='ca'&&/camerett/.test(seg)&&!/camer[ae] da letto|camer[ae]\b(?!tt)/.test(seg.replace(/camerett[ae]/g,''))) return;
      var q=m[1]?Math.min(12,parseInt(m[1],10)):1; if(visti[s[1]]) return; visti[s[1]]=1; out.push({k:s[1],q:q});
    });
  });
  return out;
}
function asFrasi(n){ return n.split(/[,;\n]|\.\s|\s(?:e|ed|piu|con|inoltre)\s/).map(function(s){ return s.trim(); }).filter(function(s){ return s.length>2; }); }
function asQta(fr){ var m=fr.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:x\s+|pz\.?\s+|pezzi\s+)?([a-z].*)$/); return m?{q:parseFloat(m[1]),r:m[2]}:null; }

// Analisi completa del testo: non cambia nulla, prepara una proposta da mostrare in anteprima
function asAnalizza(testo){
  var n=asNorm(testo), tipoTrovato=asTipo(n,S.model), model=tipoTrovato||S.model, res={model:model,cliente:asCliente(testo),marche:asMarche(testo),righe:[],stanze:[],note:[],ignorate:[],cond:null,titolo:''};
  var esplicite={}; // voce -> quantità chiesta
  var add=function(nome,q,perche,stanza){ var it=asItem(model,nome); if(!it||!(q>0)) return; var k=nome+'|'+(stanza||''); if(esplicite[k]!=null&&perche!=='richiesta') return;
    var ex=null; res.righe.forEach(function(r){ if(r.d===it[0]&&(r.stanza||'')===(stanza||'')) ex=r; });
    if(ex){ if(perche==='richiesta'){ ex.q=q; ex.perche='richiesta'; } return; }
    res.righe.push({d:it[0],u:it[1],q:q,p:num(it[2]),perche:perche,stanza:stanza||''}); };
  var mq=(n.match(/(\d+(?:\.\d+)?) mq/)||[])[1], kw=(n.match(/(\d+(?:\.\d+)?) kwp?\b/)||[])[1], kwh=(n.match(/(\d+(?:\.\d+)?) kwh/)||[])[1], metri=(n.match(/(\d+) (?:m|metri|mt|ml)\b(?! ?q)/)||[])[1];
  mq=mq?parseFloat(mq):0; kw=kw?parseFloat(kw):0; kwh=kwh?parseFloat(kwh):0; metri=metri?parseInt(metri,10):0;
  // 1. richieste esplicite con quantità ("6 prese", "8 telecamere 4 mp", "3 radiocomandi")
  var stanzeRe=new RegExp('\\b(?:'+AS_STANZE.map(function(s){ return s[0].source; }).join('|')+')');
  asFrasi(n).forEach(function(fr){
    var q=asQta(fr); if(!q) return;
    if(/^(mq|kwp?|kwh|condomin\w*|utenz\w*|famigli\w*|appartament\w*|interni|anni|giorni|mesi|m|metri|mt|ml|km|ore|h|tb|gb|mp|canali|porte|kw\w*)\b/.test(q.r)) return;
    if(model==='app'&&stanzeRe.test(q.r)&&!/punt|pres|luc|faret|linea|rete/.test(q.r)) return;
    var it=asMatch(model,q.r,1);
    if(it){ var k=it[0]+'|'; esplicite[k]=q.q; add(it[0],q.q,'richiesta'); }
    else res.ignorate.push(fr.trim());
  });
  // 2. ricette per tipo (solo se il testo dice che lavoro e')
  var has=function(re){ return re.test(n); };
  if(!tipoTrovato){ if(res.righe.length) res.note.push('Non ho capito il tipo di lavoro: aggiungo le voci al preventivo «'+(MODELS[model].short||MODELS[model].name)+'».'); }
  else if(model==='app'){
    var st=asStanze(n);
    if(!st.length&&mq){ st=[{k:'in',q:1},{k:'cu',q:1},{k:'so',q:1},{k:'ca',q:mq>=75?2:1},{k:'ba',q:mq>=90?2:1}]; if(mq>=110) st.push({k:'cm',q:1}); if(mq>=70) st.push({k:'co',q:1}); res.note.push('Stanze stimate dai '+mq+' mq: controllale prima di applicare.'); }
    if(!st.length){ st=[{k:'in',q:1},{k:'cu',q:1},{k:'so',q:1},{k:'ca',q:1},{k:'ba',q:1}]; res.note.push('Non ho trovato le stanze: uso un appartamento tipo, modificalo pure.'); }
    res.stanze=st;
    st.forEach(function(s){ for(var i=0;i<s.q;i++){ var nome=ROOMNAME[s.k]+(s.q>1?' '+(i+1):''); (KITS[s.k]||[]).forEach(function(x){ var it=catItem(x[0]); if(it) res.righe.push({d:it[0],u:it[1],q:x[1],p:num(it[2]),perche:'stanza',stanza:nome,kind:s.k}); }); } });
    (KITS.ge||[]).forEach(function(x){ var it=catItem(x[0]); if(it) res.righe.push({d:it[0],u:it[1],q:x[1],p:num(it[2]),perche:'tipico',stanza:''}); });
    // le richieste esplicite in un appartamento vanno nelle parti comuni
    res.titolo='Rifacimento impianto elettrico appartamento'+(mq?' di '+mq+' mq':'');
  }
  else if(model==='vcit'){
    var cn=(n.match(/(\d+)\s*(?:condomin|utenz|famigli|appartament|interni|campanell)/)||[])[1];
    var kind=has(/\b(solo )?citofon(o|ico|ia)\b/)&&!has(/videocitofon/)?'cit':(has(/entramb|sia .*citofon.* sia|confronto tra citofono/)?'both':'video');
    res.cond={n:cn?parseInt(cn,10):6,kind:kind}; if(!cn) res.note.push('Numero di condomini non indicato: ne metto 6, cambialo pure.');
    VCSET.forEach(function(x){ if(kind!=='both'&&x[2]!=='*'&&x[2]!==kind) return; var it=asItem('vcit',x[0]); if(it) res.righe.push({d:it[0],u:it[1],q:x[1]?res.cond.n:1,p:num(it[2]),perche:'tipico',stanza:'',pc:!!x[1],sol:x[2]}); });
    res.titolo=(kind==='cit'?'Impianto citofonico':'Impianto videocitofonico')+' condominiale · '+res.cond.n+' condomini';
  }
  else if(model==='fv'){
    if(!kw){ kw=6; res.note.push('Potenza non indicata: imposto 6 kWp.'); }
    var tri=has(/trifase/)||(kw>6&&!has(/monofase/)), bat=kwh||(has(/batteri|accumul/)?(kw>6?10:5):0);
    add('Modulo fotovoltaico 430 Wp',Math.ceil(kw*1000/430),'stima');
    add(tri?(bat?'Inverter trifase 10 kW ibrido':'Inverter trifase 6 kW'):(kw<=3.5&&!bat?'Inverter monofase 3 kW':'Inverter monofase 6 kW ibrido'),1,'tipico');
    if(bat){ if(bat>=10){ add('Batteria di accumulo 10 kWh',1,'tipico'); if(bat>10) add('Modulo batteria aggiuntivo',Math.ceil((bat-10)/5),'stima'); } else add('Batteria di accumulo 5 kWh',1,'tipico'); }
    add(has(/tetto piano|lastrico|terrazz/)?'Struttura per tetto piano con zavorre':(has(/a terra|giardino|terreno/)?'Struttura a terra':'Struttura di supporto su tetto'),kw,'tipico');
    ['Quadro di campo DC e AC con protezioni','Cavi DC / AC e protezioni','Impianto di messa a terra e equipotenziale','Sistema di monitoraggio','Pratiche di connessione e GSE','Collaudo e messa in servizio','Dichiarazione di conformità e documentazione'].forEach(function(x){ add(x,1,'tipico'); });
    add('Montaggio e cablaggio',kw,'tipico');
    if(has(/ponteggi|linea vita|falda/)) add('Ponteggio e linea vita',1,'richiesta');
    if(has(/detrazion|bonus|50 ?%/)) add('Pratica per detrazioni fiscali',1,'richiesta');
    res.titolo='Impianto fotovoltaico '+String(kw).replace('.',',')+' kWp'+(bat?' con accumulo '+String(bat).replace('.',',')+' kWh':'');
  }
  else if(model==='wb'){
    var p22=has(/\b22 kw/), p11=has(/\b11 kw/)||(has(/trifase/)&&!p22), tri2=p11||p22;
    add(p22?'Wallbox trifase 22 kW con connettore Type 2':(p11?'Wallbox trifase 11 kW con connettore Type 2':'Wallbox monofase 7,4 kW con connettore Type 2'),1,'tipico');
    if(!metri){ metri=15; res.note.push('Distanza dal quadro non indicata: stimo 15 m di linea.'); }
    add(tri2?'Linea dedicata FG16OR16 5G6 mm² (trifase)':'Linea dedicata FG16OR16 3x6 mm² (monofase)',metri,'stima');
    add('Tubazione e canalina di protezione',metri,'stima');
    ['Quadro di protezione dedicato','Interruttore magnetotermico dedicato','Differenziale tipo B per ricarica veicoli','Posa e fissaggio della wallbox','Collegamento e configurazione','Sopralluogo e progetto della linea','Dichiarazione di conformità','Collaudo e prova di ricarica con il veicolo'].forEach(function(x){ add(x,1,'tipico'); });
    if(has(/condomin/)) add('Supporto tecnico per pratica condominiale',1,'richiesta');
    if(has(/fotovoltaic|surplus/)) add('Integrazione con il fotovoltaico (ricarica da surplus)',1,'richiesta');
    if(has(/scav|interrat/)) add('Scavo e posa interrata',metri,'stima');
    res.titolo='Installazione wallbox '+(p22?'22':(p11?'11':'7,4'))+' kW per ricarica auto elettrica';
  }
  else if(model==='aut'){
    var mot=has(/sezional/)?'Automazione porta garage sezionale':has(/basculant/)?'Automazione per porta basculante':has(/sbarr/)?'Sbarra automatica per parcheggio':has(/scorrevol/)?(has(/pesant|industrial/)?'Motore per cancello scorrevole pesante':'Motore per cancello scorrevole'):(has(/interrat/)?'Motore interrato per cancello a battente (coppia)':'Motori per cancello a battente (coppia)');
    add(mot,1,'tipico');
    if(/battente/.test(mot)) add('Centrale di comando',1,'tipico');
    add('Radiocomando 4 canali',2,'tipico'); add('Coppia di fotocellule',1,'tipico'); add('Lampeggiante con antenna',1,'tipico');
    ['Cavi e canalizzazioni','Installazione, regolazione e collaudo','Programmazione dei radiocomandi','Analisi dei rischi e fascicolo tecnico'].forEach(function(x){ add(x,1,'tipico'); });
    if(has(/smartphone|app\b|wi-?fi/)) add('Modulo Wi-Fi per comando da smartphone',1,'richiesta');
    if(has(/costa/)) add('Costa di sicurezza',1,'richiesta');
    res.titolo=mot.replace(/^Motor[ei] (interrato )?per /,'Automazione ').replace(' (coppia)','');
  }
  else if(model==='all'){
    add(has(/radio|senza fili|wireless|app\b/)?'Centrale di allarme radio con app':'Centrale di allarme ibrida filare / radio',1,'tipico');
    add('Tastiera di comando',1,'tipico'); add('Sirena esterna autoalimentata con lampeggiante',1,'tipico'); add('Sirena interna',1,'tipico');
    if(!Object.keys(esplicite).some(function(k){ return /Sensore volumetrico/.test(k); })) add('Sensore volumetrico PIR',3,'stima');
    if(!Object.keys(esplicite).some(function(k){ return /Contatto magnetico/.test(k); })) add('Contatto magnetico porta / finestra',4,'stima');
    if(has(/gsm|app\b|smartphone|notific|chiam/)) add('Comunicatore GSM / IP',1,'richiesta');
    add('Batteria 12 V 7 Ah',1,'tipico'); add('Telecomando / tag di prossimità',2,'tipico');
    var nsens=0; res.righe.forEach(function(r){ if(/Sensore|Contatto|Rilevatore/.test(r.d)) nsens+=r.q; });
    add('Posa e fissaggio sensori',nsens,'tipico'); add('Programmazione, collaudo e istruzioni d\'uso',1,'tipico');
    res.titolo='Impianto di allarme antintrusione';
  }
  else if(model==='vid'){
    var ncam=0; res.righe.forEach(function(r){ if(/^Telecamera/.test(r.d)) ncam+=r.q; });
    if(!ncam){ var mc=n.match(/(\d+)\s*(?:telecamer|punti di ripresa)/); ncam=mc?parseInt(mc[1],10):4; add(has(/\b8 ?mp|4k/)?'Telecamera IP 8 MP 4K bullet PoE':(has(/dome/)?'Telecamera IP 5 MP dome PoE':'Telecamera IP 4 MP bullet PoE'),ncam,mc?'richiesta':'stima'); if(!mc) res.note.push('Numero di telecamere non indicato: ne metto 4.'); }
    add(ncam>8?'NVR 16 canali 4K':'NVR 8 canali 4K',1,'tipico');
    add(has(/8 ?tb/)?'Hard disk 8 TB per videosorveglianza':'Hard disk 4 TB per videosorveglianza',1,'tipico');
    add(ncam>8?'Switch PoE 16 porte':'Switch PoE 8 porte',1,'tipico');
    add('Posa cavo UTP cat. 6',metri||ncam*20,metri?'richiesta':'stima');
    add('Installazione e puntamento telecamera',ncam,'tipico');
    ['Configurazione accesso remoto da app','Cartello informativo videosorveglianza','Collaudo e formazione al cliente'].forEach(function(x){ add(x,1,'tipico'); });
    res.titolo='Impianto di videosorveglianza · '+ncam+' telecamere';
  }
  else if(model==='tv'){
    var np=0; res.righe.forEach(function(r){ if(/^Presa TV/.test(r.d)) np+=r.q; });
    if(!np){ var mp=n.match(/(\d+)\s*(?:prese?|punti tv|televisor)/); np=mp?parseInt(mp[1],10):3; add('Presa TV / SAT',np,mp?'richiesta':'stima'); }
    add(has(/5g|interferen/)?'Antenna digitale terrestre con filtro 5G':'Antenna UHF / VHF',1,'tipico');
    if(has(/\bsat\b|parabol|satellit|sky|tivusat/)) add('Parabola 80 cm con LNB quad',1,'richiesta');
    add('Centralino amplificatore',1,'tipico'); add('Partitore / derivatore',Math.max(1,Math.ceil(np/2)),'stima'); add('Cavo coassiale',metri||np*15,metri?'richiesta':'stima');
    add('Installazione e orientamento antenna',1,'tipico'); add('Sintonizzazione e configurazione',1,'tipico');
    res.titolo='Impianto TV e antenna';
  }
  else if(model==='rip'){
    add('Diritto di chiamata e sopralluogo',1,'tipico'); add('Ricerca guasto e diagnosi',has(/difficil|intermittent|non si trova/)?3:2,'stima');
    if(has(/urgent|festiv|notte|sabato|domenica/)) add('Maggiorazione per intervento urgente o festivo',1,'richiesta');
    add('Materiale di consumo e minuteria',1,'tipico'); add('Verifica dell\'impianto di terra e dei differenziali',1,'tipico'); add('Dichiarazione di conformità dell\'intervento',1,'tipico');
    res.titolo='Intervento di riparazione impianto elettrico';
  }
  else {
    res.titolo=(TTL_T&&TTL_T[model])||MODELS[model].name;
  }
  if(!tipoTrovato) res.titolo=S.meta.title||'';
  // richieste senza numero ma chiare ("quadro nuovo", "salvavita", "messa a terra")
  if(/^(dom|app|ind|rip)$/.test(model)){
    var gia=function(re){ return res.righe.some(function(r){ return re.test(r.d); }); };
    [[/\bquadr[oi]\b/,/^Quadro/,'quadro elettrico'],[/salvavita|differenzial/,/differenziale/i,'interruttore magnetotermico differenziale'],[/messa a terra|impianto di terra|dispersor/,/terra/i,'impianto di messa a terra'],[/videocitofon/,/[Vv]ideocitofono/,'videocitofono con posto esterno']].forEach(function(x){
      if(model==='rip'&&x[0].source.indexOf('differenzial')>-1) return;
      if(x[0].test(n)&&!gia(x[1])){ var it=asMatch(model,x[2],1); if(it) add(it[0],1,'richiesta'); }
    });
  }
  // ore di manodopera ("8 ore di manodopera")
  var ore=n.match(/(\d+(?:\.\d+)?)\s*(?:ore|h)\b/); if(ore){ var mo=asMatch(model,'manodopera oraria',1); if(mo) add(mo[0],parseFloat(ore[1]),'richiesta'); }
  // proposte a confronto ("Bticino oppure Vimar", "due proposte", "a confronto")
  res.confronto=res.marche.length>=2&&/confront|oppure|alternativ|due proposte|due soluzioni|o in alternativa|\bvs\b/.test(n);
  if(!res.confronto&&res.marche.length) res.marca=res.marche[0];
  res.ignorate=res.ignorate.filter(function(f){ return !/^\d+ (mq|kwp?|kwh|condomin|m|metri|ore|h)\b/.test(f); });
  if(!res.righe.length) res.note.push('Non ho riconosciuto voci del listino: prova a indicare quantità e cosa serve (es. «6 prese, 4 punti luce»).');
  return res;
}
function asTot(res){ var s=0; res.righe.forEach(function(r){ if(r.on!==false) s+=num(r.q)*num(r.p); }); var iva=num(S.meta.iva); return {imp:r2(s),tot:r2(s*(1+iva/100))}; }

// ---------- interfaccia ----------
function asRender(){
  var box=$('as-out'); if(!box) return; var r=AS.res; if(!r){ box.innerHTML=''; return; }
  var T=asTot(r), PER={richiesta:'chiesto',stanza:'stanza',tipico:'tipico',stima:'stimato'};
  var gruppi={}, ord=[]; r.righe.forEach(function(x,i){ var g=x.stanza||'Generale e parti comuni'; if(!gruppi[g]){ gruppi[g]=[]; ord.push(g); } gruppi[g].push(i); });
  var h='<div class="as-sum"><div><small>Tipo</small><b>'+esc(MODELS[r.model].short||MODELS[r.model].name)+'</b></div><div><small>Voci</small><b>'+r.righe.filter(function(x){ return x.on!==false; }).length+'</b></div><div><small>Totale stimato</small><b>'+eur(T.tot)+'</b></div></div>'+
    '<label class="f">Titolo<input type="text" id="as-tit" value="'+esc(r.titolo)+'"></label>';
  var c=r.cliente; if(c.name||c.addr||c.tel||c.email) h+='<div class="as-cli"><b>Cliente</b> '+esc([c.name,c.addr,c.tel,c.email].filter(Boolean).join(' · '))+'</div>';
  if(r.cond) h+='<div class="as-cli"><b>Condomini</b> '+r.cond.n+' · '+(r.cond.kind==='cit'?'solo citofono':r.cond.kind==='both'?'videocitofono e citofono a confronto':'videocitofono')+'</div>';
  if(r.confronto) h+='<div class="as-cli"><b>Proposte a confronto</b> '+esc(r.marche.join(' · '))+'</div>'; else if(r.marca) h+='<div class="as-cli"><b>Marca</b> '+esc(r.marca)+'</div>';
  r.note.forEach(function(x){ h+='<div class="as-note">'+esc(x)+'</div>'; });
  var molte=r.righe.length>15;
  h+='<div class="as-righe">'+ord.map(function(g){ var sub=0, nv=0; gruppi[g].forEach(function(i){ var x=r.righe[i]; if(x.on!==false){ sub+=num(x.q)*num(x.p); nv++; } });
    return '<details class="as-gd" data-asg="'+esc(g)+'"'+((!molte||AS.aperti[g])?' open':'')+'><summary class="as-g"><span>'+esc(g)+'</span><span>'+nv+(nv===1?' voce':' voci')+' · '+eur(sub)+'</span></summary>'+gruppi[g].map(function(i){ var x=r.righe[i];
    return '<label class="as-r'+(x.on===false?' off':'')+'"><input type="checkbox" data-asr="'+i+'"'+(x.on===false?'':' checked')+'><span class="as-d">'+esc(x.d)+((x.perche==='richiesta'||x.perche==='stima')?'<small class="as-p '+x.perche+'">'+PER[x.perche]+'</small>':'')+'</span><input type="number" min="0" step="any" class="as-q" data-asq="'+i+'" value="'+x.q+'" aria-label="Quantità"><span class="as-u">'+esc(x.u)+'</span><span class="as-e">'+eur(num(x.q)*num(x.p))+'</span></label>'; }).join('')+'</details>'; }).join('')+'</div>'+(molte?'<p class="hint">Tocca una stanza per vedere e modificare le sue voci.</p>':'');
  if(r.ignorate.length) h+='<div class="as-note">Non ho trovato nel listino: <b>'+esc(r.ignorate.join(' · '))+'</b>. Aggiungile a mano o scrivile in modo diverso.</div>';
  var vuoto=!S.lines.length;
  h+='<div class="row"><button type="button" class="btn" id="as-ok">'+(vuoto?'Crea il preventivo':'Sostituisci le voci attuali')+'</button>'+(vuoto?'':'<button type="button" class="btn ghost" id="as-add">Aggiungi alle voci attuali</button>')+'<button type="button" class="btn ghost" id="as-x">Annulla</button></div>'+
    '<p class="hint">Prezzi del tuo listino. «Stimato» indica una quantità che ho calcolato io: controllala.</p>';
  box.innerHTML=h;
}
function asApplica(sostituisci){
  var r=AS.res; if(!r) return;
  var tit=$('as-tit')?$('as-tit').value.trim():r.titolo, righe=r.righe.filter(function(x){ return x.on!==false&&num(x.q)>0; });
  if(sostituisci&&S.lines.length&&!confirm('Sostituisco le '+S.lines.length+' voci attuali con le '+righe.length+' preparate dall\'assistente?')) return;
  var prev=S.model;
  if(sostituisci){ S.lines=[]; S.products=S.products.filter(function(p){ return !prodEmpty(p); }); if(S.cmp) S.cmp.on=false; S.tiers.on=false; }
  if(r.model!==prev){ S.model=r.model; typeTitle(prev); condSwitch(prev); }
  var c=r.cliente; if(c.name) S.client.name=c.name; if(c.addr) S.client.addr=c.addr; if(c.tel) S.client.tel=c.tel; if(c.email) S.client.email=c.email;
  if(tit) S.meta.title=tit;
  if(r.model==='app'){
    if(sostituisci) S.rooms=[]; S.__rm=1; var mappa={};
    righe.forEach(function(x){ if(x.stanza&&!mappa[x.stanza]){ var esiste=null; S.rooms.forEach(function(o){ if(o.name===x.stanza) esiste=o; }); var rm=esiste||{id:rid(),name:x.stanza,kind:x.kind||'al'}; if(!esiste) S.rooms.push(rm); mappa[x.stanza]=rm.id; } });
    if(S.rooms.length) S.curRoom=S.rooms[0].id;
  }
  if(r.model==='vcit'&&r.cond){ S.cond.n=r.cond.n; S.cond.kind=r.cond.kind==='both'?'both':r.cond.kind; if(r.cond.kind==='both'){ S.tiers.on=true; S.tiers.n=2; S.tiers.names=[vcSolTitle('cit'),vcSolTitle('video')]; S.tiers.rec=1; S.tiers.sel=-1; } }
  righe.forEach(function(x){
    var l={d:x.d,u:x.u,q:num(x.q),p:num(x.p),s:0};
    if(r.model==='app'&&x.stanza) l.r=mappa[x.stanza];
    if(x.pc){ l.pc=1; l.tp=1; } else if(r.model==='vcit') l.tp=1;
    if(r.model==='vcit'&&r.cond&&r.cond.kind==='both'&&(x.sol==='cit'||x.sol==='video')) l.tm=[x.sol==='cit'?0:1];
    if(r.marca) l.br=r.marca;
    S.lines.push(l); linkLine(l,{brand:r.marca||'',sol:r.model==='vcit'&&r.cond&&r.cond.kind==='both'?(x.sol==='*'?'':x.sol):''});
  });
  if(r.confronto){
    var mk=r.marche.slice(0,3);
    if(r.model==='vcit'){ S.cond.kind='brands'; S.cond.sys=mk.map(function(b){ return {id:uid(),n:'',b:b,k:r.cond&&r.cond.kind==='cit'?'cit':'video',tot:''}; }); S.cond.cur=0; S.lines=S.lines.filter(function(l){ return !l.tp; }); sysTiers(); vcTypicalBr(); }
    else { S.cmp={on:true,cur:0,sys:mk.map(function(b){ return {id:uid(),n:'',b:b,k:'video',tot:''}; })}; var A0=S.cmp.sys[0];
      S.lines.forEach(function(l){ if(l.opt||l.vm||l.sy) return; l.sy=A0.id; l.tm=[0]; l.br=A0.b; var p=prodOfLine(l); if(p&&!p.sys){ p.sys=A0.id; p.brand=A0.b; } });
      for(var i=1;i<mk.length;i++) brCopy(0,i); sysTiers(); S.tiers.rec=-1; S.tiers.sel=-1; }
  }
  if(r.model==='vcit') vmSync();
  AS.res=null; asRender(); $('as-txt').value='';
  renderAll(); touch();
  toast('Preventivo preparato: '+righe.length+' voci. Controllalo e completalo');
  try{ var lb=$('lines'); if(lb) lb.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){}
}
var AS_ESEMPI=[
  'Rifacimento impianto appartamento 95 mq per Rossi Mario, via Roma 3, Matera: ingresso, cucina, soggiorno, 2 camere, 2 bagni, Bticino',
  'Videocitofono per condominio di 12 condomini, via Lucana 40',
  'Fotovoltaico 6 kW trifase con batteria 10 kWh su tetto a falda per Bianchi Luca',
  'Wallbox 11 kW trifase, 25 metri dal quadro, cliente Verdi Anna',
  'Cancello scorrevole con 3 telecomandi e app sullo smartphone',
  'Videosorveglianza 6 telecamere 4 mp con hard disk 8 tb',
  'Allarme radio con app, 5 sensori volumetrici e 6 contatti magnetici',
  'Appartamento 80 mq, Bticino oppure Vimar a confronto'
];
(function(){
  var go=$('as-go'); if(!go) return;
  $('as-ex').innerHTML=AS_ESEMPI.map(function(e,i){ return '<button type="button" class="chip" data-asex="'+i+'">'+esc(e.length>46?e.slice(0,44)+'…':e)+'</button>'; }).join('');
  $('as-ex').addEventListener('click',function(e){ var b=e.target.closest('[data-asex]'); if(!b) return; $('as-txt').value=AS_ESEMPI[+b.getAttribute('data-asex')]; $('as-txt').focus(); });
  go.addEventListener('click',function(){ var t=$('as-txt').value.trim(); if(t.length<4){ toast('Scrivi o detta cosa ti serve'); return; } AS.res=asAnalizza(t); AS.aperti={}; asRender(); });
  $('as-out').addEventListener('toggle',function(e){ var d=e.target; if(d.matches&&d.matches('details.as-gd')) AS.aperti[d.getAttribute('data-asg')]=d.open; },true);
  $('as-out').addEventListener('click',function(e){
    if(e.target.id==='as-ok') return asApplica(true);
    if(e.target.id==='as-add') return asApplica(false);
    if(e.target.id==='as-x'){ AS.res=null; asRender(); }
  });
  $('as-out').addEventListener('change',function(e){
    var r=AS.res; if(!r) return; var i=e.target.getAttribute('data-asr'), q=e.target.getAttribute('data-asq');
    if(i!=null){ r.righe[+i].on=e.target.checked; asRender(); }
    else if(q!=null){ r.righe[+q].q=Math.max(0,num(e.target.value)); asRender(); }
  });
  // dettato: riconoscimento vocale del browser, se disponibile
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition, mic=$('as-mic');
  if(!SR){ mic.hidden=true; return; }
  mic.addEventListener('click',function(){
    if(AS.ascolto&&AS.rec){ AS.rec.stop(); return; }
    var rec=new SR(); AS.rec=rec; rec.lang='it-IT'; rec.continuous=true; rec.interimResults=false;
    var base=$('as-txt').value.trim();
    rec.onresult=function(ev){ var t=''; for(var i=0;i<ev.results.length;i++) t+=ev.results[i][0].transcript+' '; $('as-txt').value=(base?base+' ':'')+t.trim(); };
    rec.onend=function(){ AS.ascolto=false; mic.classList.remove('on'); mic.textContent='Detta'; };
    rec.onerror=function(ev){ toast(ev&&ev.error==='not-allowed'?'Consenti l\'uso del microfono per dettare':'Dettato non disponibile ora: puoi usare il microfono della tastiera'); };
    try{ rec.start(); AS.ascolto=true; mic.classList.add('on'); mic.textContent='Ferma'; }catch(e){ toast('Dettato non disponibile: usa il microfono della tastiera'); }
  });
})();
