/* ===== Assistente: dal testo (scritto o dettato) al preventivo. Gratis, senza internet, nessun dato inviato =====
   Capisce anche richieste brevi («fv 6», «citofono 10», «8 cam»), errori di battitura, serie delle marche (Living Now, Plana…),
   comandi sul preventivo aperto («togli il quadro», «porta le prese a 20», «sconto 10%») e impara le parole che usi tu. */
var AS={res:null, doc:null, docPrima:null, cliRecente:null, rec:null, ascolto:false, aperti:{}, lt:0, diz:null, dizK:'', fix:{}, tk:{}};
var AS_NUM={un:1,uno:1,una:1,due:2,tre:3,quattro:4,cinque:5,sei:6,sette:7,otto:8,nove:9,dieci:10,undici:11,dodici:12,tredici:13,quattordici:14,quindici:15,sedici:16,diciassette:17,diciotto:18,diciannove:19,venti:20,ventiquattro:24,trenta:30,quaranta:40,cinquanta:50,sessanta:60,settanta:70,ottanta:80,novanta:90,cento:100,mezzo:0.5,mezza:0.5};
var AS_STOP=' di da del dello della dei degli delle con per il lo la i gli le un una uno e ed a ad in su tipo nuovo nuova nuovi nuove anche circa tutto tutta tutti tutte al alla alle ai agli nel nella nei nelle sul sulla sui ogni mio mia vorrei voglio serve servono fare metti mettere mettimi aggiungi aggiungere inserisci ancora altri altre altro altra preventivo impianto installazione fornitura posa ';
// abbreviazioni e parole tronche di chi scrive di fretta
var AS_ABBR=[[/\bftv\b|\bfv\b|\bpv\b|\bfotovolt(?!aic)[a-z]*/g,'fotovoltaico'],[/\bvideocit(?!ofon)[a-z]*|\bvc\b|\bvdc\b/g,'videocitofono'],[/\bcitof(?!on)[a-z]*/g,'citofono'],[/\bwb\b|\bwall box\b/g,'wallbox'],[/\bcctv\b|\bvideosorv(?!eglianz)[a-z]*/g,'videosorveglianza'],
  [/\bq\.?e\.?(?=\s|$)/g,'quadro elettrico'],[/\bp\.? ?luce\b|\bpl\b/g,'punti luce'],[/\bdiff\.?(?=\s|$)/g,'differenziale'],[/\bmagnetot\.?(?=\s|$)/g,'magnetotermico'],[/\bappart\.?(?=\s|$)|\bapp\.to\b|\bapt\b/g,'appartamento'],[/\bcanc\.?(?=\s|$)/g,'cancello'],
  [/\bn(?:r|°|\.)\.?\s*(?=\d)/g,''],[/(\d)\s*x\s+(?=[a-z])/g,'$1 '],[/\bpz\.?\s+/g,' '],[/\bcad\.?\s+/g,' ']];
// «citofono 10», «fv 6», «wallbox 22», «cam 8», «tv 5», «prese 15»: il numero dopo la parola
var AS_SWAP=[[/\b(videocitofono|citofono|videocitofoni|citofoni|condominio|palazzina|palazzo|stabile)\s+(?:da\s+|per\s+|con\s+|di\s+)?(\d+)\b(?!\s*(?:mq|kw|m\b|metri|mt|mp|tb|pollici|"|condomin|utenz|famigli|appartament|interni|campanell|piani|unita))/g,'$1 $2 condomini'],
  [/\bfotovoltaico\s+(?:da\s+|di\s+)?(\d+(?:\.\d+)?)\b(?!\s*(?:kw|mq|m\b|metri|moduli|pannelli))/g,'fotovoltaico $1 kw'],
  [/\bwallbox\s+(?:da\s+)?(3\.7|7\.4|7|11|22)\b(?!\s*kw)/g,'wallbox $1 kw'],
  [/\b(batteria|batterie|accumulo)\s+(?:da\s+|di\s+)?(\d+(?:\.\d+)?)\b(?!\s*(?:kw|anni))/g,'$1 $2 kwh'],
  [/\b(?:telecamere|telecamera|cam)\s+(\d+)\b(?!\s*(?:mp|tb|canali|megapixel))/g,'$1 telecamere'],
  [/\b(tv|antenna)\s+(\d+)\b(?!\s*(?:prese|punti))/g,'$1 $2 prese tv'],
  [/\b(prese|punti presa|punti luce|luci|faretti|punti rete|sensori|contatti|telecomandi|radiocomandi)\s+(\d+)\b(?!\s*(?:mp|kw|tb|\.\d))/g,'$2 $1']];
var AS_SIN=[[/\bluci\b/g,'punti luce'],[/\bspot\b/g,'faretti'],[/\btvcc\b|\bcam\b/g,'telecamere'],[/\bpir\b/g,'sensori volumetrici'],[/\btelecomand[io]\b/g,'radiocomandi'],[/\bsalvavita\b/g,'magnetotermico differenziale'],[/\bpunti rete\b|\bprese rete\b|\bprese dati\b/g,'punto presa dati rj45'],[/\bprese tv\b/g,'presa tv sat'],[/\bcitofoni\b/g,'posto interno citofono'],[/\bmonitor\b/g,'monitor interno'],[/\bprese\b(?! (?:tv|bipasso|schuko|usb|dati|rete|cee|esterne|ip))/g,'punti presa']];
var AS_TIPI=[['vcit',/videocitofon|citofon|posto esterno|pulsantier|condomin/g],['vid',/telecamer|videosorveglian|\bnvr\b|\bdvr\b/g],['all',/allarm|antifurt|antintrusion|volumetric|contatt[io] magnetic/g],['aut',/cancell|automazion|sbarr|basculant|sezional|dissuasor/g],['fv',/fotovoltaic|pannell[io] solar|\bkwp\b|accumul|inverter/g],['wb',/wallbox|colonnin[ae] di ricarica|ricarica (auto|veicol|dell)|auto elettric/g],['tv',/antenn|parabol|digitale terrestre|centralino tv|\bsat\b|^ tv\b|impianto tv/g],['ind',/capannon|industrial|officin|stabiliment|blindosbarr|\bcee\b/g],['sw',/\bplc\b|scada|\bhmi\b|\bknx\b|programmazion|firmware/g],['rip',/riparaz|guast|non funzion|salta|cortocircuit|scatta|emergenz|intervento/g],['app',/appartament|\bcamer[ae]\b|\bbagn[io]\b|\bcucin|soggiorn|ingress|corridoi|camerett|monolocal|bilocal|trilocal|quadrilocal|pentalocal|\bvilla\b|attico|mansard/g],['dom',/impianto elettrico|\bcasa\b|villett|abitazion|punti? luce|\bprese\b/g]];
var AS_STANZE=[[/camerett[ae]/,'cm'],[/camer[ae](?: da letto| matrimonial[ei])?\b/,'ca'],[/bagn[io]|servizi igienici/,'ba'],[/cucin[ae]|angolo cottura/,'cu'],[/soggiorn[oi]|salon[ei]|salott[oi]|living(?! ?(?:now|light))/,'so'],[/ingress[oi]/,'in'],[/corridoi?o?|disimpegn[oi]/,'co'],[/studi[oi]/,'st'],[/lavanderi[ae]/,'la'],[/balcon[ei]|terrazz[oi]|giardin[oi]/,'bl'],[/\bbox\b|garage|cantin[ae]|autorimess[ae]/,'bx'],[/ripostigli[oi]/,'ri']];
var AS_TAGLI={mono:[['so',1],['cu',1],['ba',1]],bi:[['in',1],['cu',1],['so',1],['ca',1],['ba',1]],tri:[['in',1],['cu',1],['so',1],['ca',2],['ba',1],['co',1]],quadri:[['in',1],['cu',1],['so',1],['ca',2],['cm',1],['ba',2],['co',1]],penta:[['in',1],['cu',1],['so',1],['ca',3],['cm',1],['ba',2],['co',1]]};
// tutte le marche della libreria (oltre 200), più i nomi brevi con cui le chiami
var AS_MARCHE=maVoci().map(function(m){ return m.n; });
var AS_ALIAS={schneider:'Schneider Electric',bentel:'Bentel Security',ksenia:'Ksenia Security',hanwha:'Hanwha Vision',wisenet:'Hanwha Vision',victron:'Victron Energy',mitsubishi:'Mitsubishi Electric',jinko:'Jinko Solar',trina:'Trina Solar',rockwell:'Rockwell Automation','allen bradley':'Rockwell Automation',erico:'nVent ERICO',phoenix:'Phoenix Contact',lovato:'Lovato Electric',emmeesse:'Emme Esse',fritz:'AVM',unifi:'Ubiquiti',elmo:'EL.MO',azzurro:'ZCS Azzurro',zcs:'ZCS Azzurro',fte:'Fte maximal','enel x':'Enel X Way',sunpower:'Maxeon',longi:'LONGi',hormann:'Hörmann',weidmuller:'Weidmüller',schreder:'Schréder',tado:'tado°',ledvance:'Ledvance'};
// nomi che sono anche parole comuni: valgono solo scritti con la maiuscola
var AS_AMBIGUE=/^(Sick|Genius|REC|SEA|LG|V2|2N|Simon|Gira|Signify|ifm|Delta Electronics|Home Assistant|Samsung|Panasonic|Toshiba|Bosch|Cisco|Optex|Imou|Philips|Osram)$/;
function asRx(b){ return b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 .\-]/g,'').replace(/[.\-]/g,function(c){ return '\\'+c; }); }
// serie commerciali: riconosco la marca e, se serve, il tipo di lavoro
var AS_SERIE=[[/\bliving ?now\b/,'Bticino','Living Now',''],[/\bliving ?light\b/,'Bticino','LivingLight',''],[/\baxolute\b/,'Bticino','Axolute',''],[/\bmatix\b/,'Bticino','Matix',''],[/\bmy ?home\b/,'Bticino','MyHOME',''],[/\bclasse ?100\b/,'Bticino','Classe 100','vcit'],[/\bclasse ?300\w*/,'Bticino','Classe 300','vcit'],[/\bclasse ?500\b/,'Bticino','Classe 500','vcit'],[/\blinea ?3000\b/,'Bticino','Linea 3000','vcit'],
  [/\bplana\b/,'Vimar','Plana',''],[/\beikon\b/,'Vimar','Eikon',''],[/\barke\b/,'Vimar','Arké',''],[/\bneve ?up\b/,'Vimar','Neve Up',''],[/\bk40\b/,'Vimar','K40','vcit'],[/\btab ?[57] ?s?\b/,'Vimar','Tab','vcit'],
  [/\bzenit\b/,'AVE','Zenit',''],[/\bchorus\w*/,'Gewiss','Chorus',''],[/\bvalena\b/,'Legrand','Valena',''],[/\barteor\b/,'Legrand','Arteor',''],[/\bmini ?note\b|\bnote ?2\b/,'Urmet','Note','vcit'],[/\bsimplebus\b/,'Comelit','Simplebus','vcit'],
  [/\brobus\b/,'Nice','Robus','aut'],[/\btoona\b/,'Nice','Toona','aut'],[/\bwingo\b/,'Nice','Wingo','aut'],[/\bkrono\b/,'Came','Krono','aut'],[/\bbxv?[ -]?\d{2,}/,'Came','BX','aut'],[/\bdeimos\b/,'BFT','Deimos','aut'],[/\bphobos\b/,'BFT','Phobos','aut'],
  [/\bsun ?2000\b/,'Huawei','SUN2000','fv'],[/\bluna ?2000\b/,'Huawei','LUNA2000','fv'],[/\bsunny ?(?:boy|tripower)\b/,'SMA','Sunny','fv'],[/\bsymo\b|\bgen ?24\b/,'Fronius','Symo','fv'],[/\bax ?pro\b/,'Hikvision','AX PRO','all'],
  [/\bmylos\b/,'ABB','Mylos',''],[/\bodace\b/,'Schneider Electric','Odace',''],[/\bceliane\b/,'Legrand','Céliane',''],[/\bpulsar\b/,'Wallbox','Pulsar','wb'],[/\bpowerwall\b/,'Tesla','Powerwall','fv'],[/\bwall connector\b/,'Tesla','Wall Connector','wb'],
  [/\bcolorvu\b/,'Hikvision','ColorVu','vid'],[/\bacusense\b/,'Hikvision','AcuSense','vid'],[/\bwizsense\b/,'Dahua','WizSense','vid'],[/\babsoluta\b/,'Bentel Security','Absoluta','all'],[/\bsmartliving\b/,'Inim','SmartLiving','all'],[/\blares\b/,'Ksenia Security','lares','all'],
  [/\btahoma\b/,'Somfy','TaHoma',''],[/\bixengo\b|\belixo\b/,'Somfy','Elixo','aut'],[/\bdexxo\b/,'Somfy','Dexxo','aut'],[/\biq ?8\b/,'Enphase','IQ8','fv'],[/\btiger neo\b/,'Jinko Solar','Tiger Neo','fv'],[/\bbattery-?box\b/,'BYD','Battery-Box','fv'],
  [/\bkecontact\b/,'KEBA','KeContact','wb'],[/\bjuicebox\b/,'Enel X Way','JuiceBox','wb'],[/\bamtron\b/,'Mennekes','Amtron','wb'],[/\bevlink\b/,'Schneider Electric','EVlink','wb'],[/\bterra ac\b/,'ABB','Terra AC','wb'],[/\bjoinon\b/,'Gewiss','Joinon','wb'],[/\bgreen ?'?up\b/,'Bticino','Green\'up','wb'],
  [/\bunifi\b/,'Ubiquiti','UniFi',''],[/\bfritz ?!?box\b/,'AVM','FRITZ!Box',''],[/\bip verso\b/,'2N','IP Verso','vcit']];
var AS_LESSICO='appartamento villetta villa casa abitazione ufficio negozio capannone magazzino officina laboratorio cucina soggiorno salone salotto ingresso corridoio camera camere cameretta camerette bagno bagni studio lavanderia balcone terrazzo terrazza giardino garage cantina ripostiglio taverna mansarda attico veranda portico monolocale bilocale trilocale quadrilocale pentalocale '+
  'videocitofono videocitofoni citofono citofoni condominio condomini condomino famiglie famiglia palazzina palazzo stabile edificio pulsantiera monitor interno esterno telecamera telecamere videosorveglianza allarme antifurto sensore sensori volumetrico volumetrici contatto contatti magnetico magnetici sirena tastiera '+
  'cancello cancelli scorrevole battente automazione motore motori basculante sezionale sbarra telecomando telecomandi radiocomando radiocomandi fotocellule lampeggiante fotovoltaico pannelli moduli inverter batteria batterie accumulo trifase monofase ibrido wallbox ricarica colonnina antenna parabola satellitare centralino '+
  'prese presa punti punto luce luci faretti faretto interruttore interruttori deviatore deviatori pulsante pulsanti quadro quadri elettrico elettrica differenziale magnetotermico salvavita messa terra rifacimento rifare impianto installazione manodopera metri tetto falda piano piani scala '+
  'sostituzione sostituire riparazione guasto cortocircuito domotica tapparelle tapparella termostato cronotermostato rilevatore fumo dati rete smartphone applicazione completo completa cavi cavo tubazione canalina linea dedicata condizionatore climatizzatore lampade lampadario plafoniera striscia strisce '+
  'irrigazione pompa caldaia forno cottura lavatrice lavastoviglie frigorifero cliente signor signora ditta sopra sotto dentro fuori porta porte cambia togli toglimi elimina rimuovi cancella aggiungi sconto acconto validita giorni prezzo prezzi totale marca marche modello serie colore bianco nero grigio argento '+
  'oppure confronto alternativa proposta proposte soluzione soluzioni entrambe almeno massimo primo secondo terzo telefono cellulare email indirizzo contatore potenza kilowatt urgente festivo domenica sabato notte sopralluogo verifica controllo certificazione dichiarazione conformita progetto pratica detrazione bonus '+
  'ancora altri altre senza niente tranne escluso esclusa metti mettere porta portare imposta modifica aumenta diminuisci riduci raddoppia stanza stanze ambiente ambienti generale comuni wireless radio filare smart remoto vista cablaggio scavo interrato interrata ponteggio vita quanto quanta quanti quante quale quali come dove quando perche cosa costo costa serve sezione caduta tensione corrente potenza ampere produce produzione consiglio consigli differenziali dimensionare';

function asDiz(){
  var key=ORDER.map(function(m){ return (S.cat[m]||[]).length; }).join(',')+'|'+((DB.parole||[]).length);
  if(AS.diz&&AS.dizK===key) return AS.diz;
  var d={}; function w(s){ String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z]+/).forEach(function(x){ if(x.length>=4) d[x]=1; }); }
  w(AS_LESSICO); w(AS_STOP); Object.keys(AS_NUM).forEach(w); AS_MARCHE.forEach(w); AS_SERIE.forEach(function(s){ w(s[2]); });
  ORDER.forEach(function(m){ (S.cat[m]||[]).forEach(function(c){ w(c[0]); }); ((MODELS[m]&&MODELS[m].items)||[]).forEach(function(c){ w(c[0]); }); });
  Object.keys(ROOMNAME).forEach(function(k){ w(ROOMNAME[k]); }); (DB.parole||[]).forEach(function(p){ w(p.k); });
  var byL={}; Object.keys(d).forEach(function(x){ var c=x.charAt(0); (byL[c]=byL[c]||[]).push(x); });
  AS.diz={has:d,byL:byL}; AS.dizK=key; AS.fix={}; AS.tk={}; return AS.diz;
}
// distanza tra parole (con lettere scambiate): «fotovoltacio» -> «fotovoltaico»
function asDist(a,b,max){
  var la=a.length, lb=b.length, i, j; if(Math.abs(la-lb)>max) return max+1;
  var p2=null, p1=[], cur; for(j=0;j<=lb;j++) p1[j]=j;
  for(i=1;i<=la;i++){ cur=[i]; var mn=i;
    for(j=1;j<=lb;j++){ var v=Math.min(p1[j]+1,cur[j-1]+1,p1[j-1]+(a.charAt(i-1)===b.charAt(j-1)?0:1)); if(p2&&i>1&&j>1&&a.charAt(i-1)===b.charAt(j-2)&&a.charAt(i-2)===b.charAt(j-1)) v=Math.min(v,p2[j-2]+1); cur[j]=v; if(v<mn) mn=v; }
    if(mn>max) return max+1; p2=p1; p1=cur; }
  return p1[lb];
}
function asCorreggi(t){
  var D=asDiz();
  return t.replace(/[a-z]{5,}/g,function(w){
    if(D.has[w]) return w; if(AS.fix[w]!=null) return AS.fix[w];
    var max=w.length>=8?2:1, best=w, bd=max+1;
    (D.byL[w.charAt(0)]||[]).forEach(function(x){ if(Math.abs(x.length-w.length)>max) return; var d=asDist(w,x,max); if(d<bd){ bd=d; best=x; } });
    AS.fix[w]=bd<=max?best:w; return AS.fix[w];
  });
}
function asNorm(t){
  t=' '+String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’`]/g,"'")+' ';
  t=t.replace(/\b(\d+),(\d+)\b/g,'$1.$2').replace(/\bmetri quadr[ia]\b|\bm2\b|\bm²/g,' mq ').replace(/(\d)\s*(mq|kwp|kwh|kw|mp|tb|mm|m|metri|mt|ml|x|pz)\b/g,'$1 $2');
  t=asCorreggi(t);
  Object.keys(AS_NUM).forEach(function(w){ t=t.replace(new RegExp('\\b'+w+'\\b','g'),String(AS_NUM[w])); });
  AS_ABBR.forEach(function(s){ t=t.replace(s[0],s[1]); });
  // il numero dopo la parola, ma solo se prima non c'e' gia' un numero («10 luci 15 prese» resta com'e')
  AS_SWAP.forEach(function(s){ var uno=new RegExp(s[0].source); t=t.replace(s[0],function(){ var a=arguments, all=a[0], off=a[a.length-2], str=a[a.length-1]; return /\d\s*$/.test(str.slice(0,off))?all:all.replace(uno,s[1]); }); });
  AS_SIN.forEach(function(s){ t=t.replace(s[0],s[1]); });
  return t.replace(/\s+/g,' ');
}
function asStem(w){ w=w.replace(/[^a-z0-9"]/g,''); if(/^\d/.test(w)) return w; w=w.replace(/[aeiou]+$/,''); return w.slice(0,6); }
function asToks(t){ return asNorm(t).replace(/(\d+(?:\.\d+)?)\s+(mp|tb|kw|kwp|kwh|mm|canali|porte|cm)\b/g,'$1$2').split(/[^a-z0-9."]+/).filter(function(w){ return w&&w.length>1&&AS_STOP.indexOf(' '+w+' ')<0; }).map(asStem).filter(Boolean); }
function asToksC(s){ asDiz(); if(!AS.tk[s]) AS.tk[s]=asToks(s); return AS.tk[s]; }
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
    var it=asToksC(c[0]), m=0; ft.forEach(function(w){ if(it.indexOf(w)>-1) m+=(/\d/.test(w)?1.5:1); });
    if(!m) return;
    var sc=m*2-0.08*it.length+(it[0]===ft[0]?0.5:0);
    if(sc>bs){ bs=sc; best={it:c,m:m,ft:ft.length}; }
  });
  if(!best) return null;
  if(best.m<(min||1)||best.m<Math.min(2,best.ft)*0.5) return null;
  return best.it;
}
// parole che hai insegnato tu: «faretti incasso» = «Faretto LED da incasso…»
function asChiave(f){ return asNorm(f).replace(/^\s*\d+(?:\.\d+)?\s+/,'').replace(/\b(il|lo|la|i|gli|le|un|una|uno|di|del|della|dei|delle)\b/g,' ').replace(/\s+/g,' ').trim(); }
function asImparata(model,frase){
  var f=' '+asChiave(frase)+' ', r=null, lung=0;
  (DB.parole||[]).forEach(function(p){ if(p.m!==model||!p.k||p.k.length<=lung) return; if(f.indexOf(' '+p.k+' ')>-1){ var it=asItem(model,p.d); if(it){ r=it; lung=p.k.length; } } });
  return r;
}
function asTipo(n,hint){
  var sc={}; AS_TIPI.forEach(function(x){ var m=n.match(x[1]); sc[x[0]]=m?m.length:0; });
  if(sc.vcit&&/\btelecamer/.test(n)===false) sc.vcit+=1;
  (hint||[]).forEach(function(t){ if(t&&sc[t]!=null) sc[t]+=2; });
  var best=null, bv=0; AS_TIPI.forEach(function(x){ if(sc[x[0]]>bv){ bv=sc[x[0]]; best=x[0]; } });
  if(best==='dom'&&sc.app) best='app';
  return best;
}
// la voce «normale» quando dici solo la parola generica («5 telecamere», «4 sensori»)
var AS_BASE={vid:[[/^telecamer\w*$/,'Telecamera IP 4 MP bullet PoE']],all:[[/^sensor\w*( volumetric\w*)?$/,'Sensore volumetrico PIR'],[/^contatt\w*( magnetic\w*)?$/,'Contatto magnetico porta / finestra']],aut:[[/^(radiocomandi|telecomandi)$/,'Radiocomando 4 canali']],tv:[[/^(punti presa|prese|presa tv sat)$/,'Presa TV / SAT']],
  app:[[/^punti presa$/,'Punto presa 10/16 A'],[/^punti luce$/,'Punto luce semplice']],dom:[[/^punti presa$/,'Punto presa 10/16 A'],[/^punti luce$/,'Punto luce semplice']]};
function asBase(model,r){ var it=null; (AS_BASE[model]||[]).forEach(function(x){ if(!it&&x[0].test(String(r||'').trim())) it=asItem(model,x[1]); }); return it; }
// dati del cliente nel testo: li legge clLeggi (assistente-documenti), che esclude la tua ditta e controlla C.F. e P.IVA
function asCliente(t){ var c=clLeggi(t,'libero'), o={}; ['name','addr','tel','email','cf'].forEach(function(k){ if(c[k]) o[k]=c[k]; }); if(c.n) o.info=c; return o; }
// marche e serie, nell'ordine in cui le hai scritte
function asTipoMarca(b){ var m=maTrova(b), t=[]; if(m) m.a.forEach(function(a){ var x=MA_TIPO[a]; if(x&&t.indexOf(x)<0) t.push(x); }); return t.length===1?t[0]:''; }
function asMarche(n,testo){
  var r=[], visto={};
  function push(b,i){ if(visto[b]) return; visto[b]=1; r.push({b:b,i:i,s:'',t:asTipoMarca(b)}); }
  AS_MARCHE.forEach(function(b){ var m;
    if(AS_AMBIGUE.test(b)) m=String(testo||'').match(new RegExp('(?:^|[^A-Za-z0-9])'+b.replace(/[.]/g,'\\.')+'(?![A-Za-z0-9])'));
    else m=n.match(new RegExp('(?:^|[^a-z0-9])'+asRx(b)+'(?![a-z0-9])'));
    if(m) push(b,m.index); });
  Object.keys(AS_ALIAS).forEach(function(k){ var m=n.match(new RegExp('(?:^|[^a-z0-9])'+k+'(?![a-z0-9])')); if(m) push(AS_ALIAS[k],m.index); });
  AS_SERIE.forEach(function(s){ var m=n.match(s[0]); if(!m) return; var ex=r.filter(function(x){ return x.b===s[1]; })[0]; if(ex){ if(!ex.s){ ex.s=s[2]; ex.t=s[3]; } } else r.push({b:s[1],i:m.index,s:s[2],t:s[3]}); });
  return r.sort(function(a,b){ return a.i-b.i; });
}
function asMarcaNome(x){ return x.b+(x.s&&x.s!==x.b?' '+x.s:''); }
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
var AS_IN=new RegExp('\\b(?:in|nel|nella|nello|nei|nelle|dal|dalla|dallo|dai|dalle|della|del|dello|per (?:la|il|lo)|in ogni|ogni)\\s+((?:'+AS_STANZE.map(function(s){ return s[0].source; }).join('|')+'))(?:\\s+(\\d+))?');
// «3 prese in cucina», «togli i faretti dal bagno 2»
function asDove(fr){
  var m=fr.match(AS_IN); if(!m) return null; var k=null;
  AS_STANZE.forEach(function(s){ if(!k&&new RegExp('^(?:'+s[0].source+')').test(m[1])) k=s[1]; });
  return k?{k:k,n:m[2]?parseInt(m[2],10):0,rest:(fr.slice(0,m.index)+' '+fr.slice(m.index+m[0].length)).replace(/\s+/g,' ').trim()}:null;
}
// «10 punti luce 15 prese» sono due richieste: divido dove comincia un nuovo numero (non le unità: «4 mp», «25 metri»)
var AS_NUOVA=/\s(?=\d+(?:\.\d+)?\s+(?!(?:mp|tb|gb|kw|kwh|kwp|mm|m|mt|metri|ml|mq|canali|porte|pollici|cm|a|v|w|ah|ore|h|anni|giorni|kg|x)\b)[a-z])/;
function asFrasi(n){ return n.split(/[,;\n]|\.\s|\s(?:e|ed|piu|con|inoltre|poi)\s/).reduce(function(a,s){ return a.concat(/[a-z]/.test(s)?s.split(AS_NUOVA):[s]); },[]).map(function(s){ return s.trim(); }).filter(function(s){ return s.length>2; }); }
function asQta(fr){ var m=fr.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:x\s+|pz\.?\s+|pezzi\s+)?([a-z].*)$/); return m?{q:parseFloat(m[1]),r:m[2]}:null; }
var AS_VERBO=/^\s*(?:aggiungi|aggiungere|aggiungimi|metti|mettimi|inserisci|togli|toglimi|togliere|elimina|rimuovi|cancella|leva|levami|cambia|porta|portare|imposta|modifica|sostituisci|aumenta|diminuisci|riduci|sconto|acconto|iva|validita)\b/;
var AS_TOGLI=/^(?:togli|toglimi|togliere|elimina|eliminare|rimuovi|cancella|leva|levami|senza|niente|tranne|escluso|esclusa|esclusi|non (?:serve|servono|mettere|voglio)|no)\s+(?:(?:il|lo|la|i|gli|le|l'|un|una|uno)\s*)?(.+)$/;
var AS_CAMBIA=/^(?:porta|portare|cambia|metti|mettimi|imposta|modifica|aumenta|riduci|diminuisci)\s+(?:(?:il|lo|la|i|gli|le|l')\s*)?(.+?)\s+(?:a|in|da)\s+(\d+(?:\.\d+)?)(?:\s*(?:pz|pezzi|cad|unita))?$/;
var AS_COND=/\b(?:sconto|acconto|iva|validit\w*)\b/;
function asLineaInfo(l){ var rm=roomById(l.r); return {d:l.d,k:rm?rm.kind:'',st:rm?rm.name:''}; }
function asRigaInfo(x){ return {d:x.d,k:x.kind||'',st:x.stanza||''}; }
// le righe che corrispondono a una frase («il quadro», «le prese in cucina»)
function asTrova(list,frase,dove,get){
  var ft=asToks(frase); if(!ft.length) return [];
  var ok=function(o){ if(!dove) return true; if(o.k!==dove.k) return false; return !dove.n||/\s(\d+)$/.test(o.st)&&+o.st.match(/\s(\d+)$/)[1]===dove.n||(dove.n===1&&!/\s\d+$/.test(o.st)); };
  var best=0, bd=null, need=ft.length<=1?1:2;
  list.forEach(function(x){ var o=get(x); if(!ok(o)) return; var it=asToksC(o.d), m=0, hit=0; ft.forEach(function(w){ if(it.indexOf(w)>-1){ m+=(/\d/.test(w)?1.5:1); hit++; } }); if(hit<need) return; var sc=m*2-0.08*it.length; if(sc>best){ best=sc; bd=o.d; } });
  if(!bd||best<1.2) return [];
  return list.filter(function(x){ var o=get(x); return o.d===bd&&ok(o); });
}

// la voce migliore: il tuo listino se la descrive bene, altrimenti il prontuario se la descrive meglio
function asCopre(it,frase){ var ft=asToks(frase), t=asToksC(it[0]), h=0; ft.forEach(function(w){ if(t.indexOf(w)>-1) h++; }); return {h:h,n:ft.length}; }
function asMigliore(model,frase){
  var it=asBase(model,frase); if(it) return {it:it};
  it=asMatch(model,frase,1); var pv=asProntuario(model,frase);
  if(it&&pv){ var c=asCopre(it,frase); if(c.h<c.n){ var b=prCerca(frase,model,1)[0]; if(b&&b.hit>c.h) return {pv:pv}; } return {it:it}; }
  return it?{it:it}:pv?{pv:pv}:null;
}
// la voce giusta dal prontuario IECI quando nel tuo listino non c'e'
function asProntuario(model,frase){
  var L=prCerca(frase,model,3); if(!L.length) return null;
  var ft=prTok(frase), b=L[0]; if(b.hit<Math.max(1,Math.min(2,ft.length)*0.5)) return null;
  if(b.v.m.indexOf(model)<0&&b.hit<2&&ft.length>1) return null;
  return b.v;
}
function prById(id){ var r=null; prVoci().forEach(function(v){ if(v.id===id) r=v; }); return r; }
/* ---------- calcoli da cantiere e indicazioni di buona pratica ---------- */
var AS_PORT2={'1.5':16.5,'2.5':23,'4':30,'6':38,'10':52,'16':69,'25':90,'35':111,'50':133,'70':168,'95':201};
var AS_PORT3={'1.5':15,'2.5':20,'4':27,'6':34,'10':46,'16':62,'25':80,'35':99,'50':118,'70':149,'95':179};
var AS_SEZ=[1.5,2.5,4,6,10,16,25,35,50,70,95], AS_INT=[6,10,16,20,25,32,40,50,63,80,100,125];
var AS_CONSIGLI=[
 [/differenzial\w*.*(wallbox|ricarica|auto elettric|colonnin)|(wallbox|ricarica|colonnin)\w*.*differenzial/,'Ricarica auto: linea dedicata con differenziale di tipo B, oppure tipo A/F se la wallbox ha già la rilevazione delle correnti continue 6 mA (controlla la scheda). CEI 64-8 sezione 722.'],
 [/differenzial\w*.*(lavatric|asciugatric|condizionat|climatizz|pompa di calore|induzion)/,'Apparecchi con inverter (lavatrice, climatizzatore, pompa di calore, piano a induzione): differenziale di tipo F, o almeno di tipo A. Il tipo AC non è adatto.'],
 [/differenzial\w*.*fotovolt|fotovolt\w*.*differenzial/,'Fotovoltaico: lato AC di norma differenziale di tipo A; il tipo B serve solo se lo chiede il costruttore dell\'inverter (vedi il manuale).'],
 [/(sezion|cavo|cavi)\w*.*(punti luce|luce|illuminazion)/,'Circuiti luce: cavo 1,5 mm² protetto con magnetotermico da 10 A.'],
 [/(sezion|cavo|cavi)\w*.*(punti presa|prese)/,'Circuiti prese: cavo 2,5 mm² protetto con 16 A.'],
 [/(sezion|cavo|cavi)\w*.*(induzion|piano cottura)/,'Piano a induzione: linea dedicata, di norma 6 mm² con 32 A (alcuni modelli 25 A con 4 mm²: vale la scheda tecnica).'],
 [/(sezion|cavo|cavi)\w*.*(forno|lavastovigl|lavatric|boiler|scaldabagn)/,'Forno, lavatrice, lavastoviglie, boiler: linea dedicata 2,5 mm² con 16 A.'],
 [/(sezion|cavo|cavi)\w*.*(climatizz|condizionat|split)/,'Climatizzatore domestico: 2,5 mm² con 16 A; per potenze maggiori vale la scheda tecnica dell\'unità esterna.'],
 [/(sezion|cavo|cavi)\w*.*(wallbox|ricarica)/,'Wallbox: 7,4 kW monofase (32 A) di norma 6 mm²; 11 kW trifase (16 A) 5G4, o 5G6 sulle distanze lunghe; 22 kW trifase (32 A) 5G6 o 5G10 secondo la distanza. Per il calcolo preciso scrivi potenza e metri, es. «sezione 22 kw trifase 40 m».'],
 [/(sezion|cavo|cavi)\w*.*(montante|contatore)/,'Montante dal contatore al quadro: 6 mm² per 3–4,5 kW; 10 mm² per 6 kW o tratti lunghi (oltre 15–20 m). Verifica sempre la caduta di tensione.'],
 [/resistenza di terra|(terra|dispersor)\w*.*(quant|valore|resistenza)/,'Sistema TT: deve valere Rt × Idn ≤ 50 V. Con differenziali da 30 mA basterebbero 1.666 Ω, ma un buon impianto sta sotto i 100–200 Ω e va misurato a ogni verifica.'],
 [/livell\w* (1|2|3|minimo)|64-8.*(punti|dotazion)|dotazioni minime/,'CEI 64-8 capitolo 37: nelle abitazioni nuove o ristrutturate il livello 1 è il minimo e fissa, per ogni locale in base alla superficie, il numero di punti presa, punti luce e prese TV/dati; i livelli 2 e 3 aggiungono dotazioni e domotica. Controlla la tabella aggiornata della norma.'],
 [/che contatore|quale contatore|potenza (del )?contatore|quanti kw (di )?contatore/,'Potenze tipiche: 3 kW per una casa senza grandi carichi elettrici; 4,5 kW con piano a induzione; 6 kW o più con induzione, pompa di calore o wallbox. Fino a 30 kW la potenza disponibile è il 10% in più di quella impegnata.']
];
function asF(x,d){ var k=Math.pow(10,d==null?1:d); return String(Math.round(x*k)/k).replace('.',','); }
function asCalcolo(n){
  var dom=/\b(sezion\w*|dimension\w*|che cavo|quale cavo|caduta|quanti ampere|che corrente|quanta corrente|assorbe|quanti kw|che potenza|quanta potenza|quanto produce|produzione|produce|che differenziale|quale differenziale|che interruttore|quale interruttore|resistenza di terra|livello|livelli|che contatore|quale contatore|potenza (del )?contatore)\b/;
  if(!dom.test(n)) return null;
  var cards=[], righe=[], m;
  var I=(m=n.match(/(\d+(?:\.\d+)?)\s*(?:a|amp|ampere)\b(?!\s*(?:incasso|parete|vista|terra|soffitto))/))?parseFloat(m[1]):0;
  var P=(m=n.match(/(\d+(?:\.\d+)?)\s*kwp?\b/))?parseFloat(m[1]):0;
  var L=(m=n.match(/(\d+(?:\.\d+)?)\s*(?:m|metri|mt|ml)\b(?!\s*q)/))?parseFloat(m[1]):0;
  var SZ=(m=n.match(/(\d+(?:\.\d+)?)\s*(?:mm|mmq|mm2|mm²|quadri)\b/))?parseFloat(m[1]):0;
  var tri=/trifase|400 ?v|\btri\b/.test(n), V=tri?400:230, cos=(m=n.match(/cos\D{0,6}(0\.\d+)/))?parseFloat(m[1]):(/wallbox|ricarica|colonnin|boiler|scaldabagn|forno|resistiv/.test(n)?1:0.9), rho=0.0225;
  AS_CONSIGLI.forEach(function(c){ if(c[0].test(n)) cards.push({t:'Buona pratica',h:esc(c[1])}); });
  if(/produc|produzion/.test(n)&&P&&!I){ var y=1400, e=P*y; cards.push({t:'Produzione fotovoltaica stimata',h:'Un impianto da <b>'+asF(P)+' kWp</b> nel Sud Italia produce circa <b>'+asF(e,0)+' kWh all\'anno</b> (≈ '+asF(e/12,0)+' kWh al mese in media, molto di più d\'estate). Con il 35–50% di autoconsumo e l\'energia a 0,30 €/kWh il risparmio è di circa <b>'+asF(e*0.35*0.3,0)+'–'+asF(e*0.5*0.3,0)+' € l\'anno</b>, più quanto ricevi per l\'energia ceduta. Per il fascicolo usa «Stime e tempi».'}); }
  else if(P&&!L&&/ampere|corrente|assorbe/.test(n)){ var ib=tri?P*1000/(Math.sqrt(3)*400*cos):P*1000/(230*cos); cards.push({t:'Corrente assorbita',h:'<b>'+asF(P)+' kW</b> '+(tri?'trifase':'monofase')+' con cosφ '+asF(cos,2)+' assorbono circa <b>'+asF(ib)+' A</b>'+(tri?' per fase':'')+'. Interruttore consigliato: <b>'+(AS_INT.filter(function(x){ return x>=ib; })[0]||'>125')+' A</b>.'}); }
  else if(I&&!L&&/quanti kw|potenza/.test(n)){ var pw=tri?Math.sqrt(3)*400*I*cos/1000:230*I*cos/1000; cards.push({t:'Potenza',h:'<b>'+asF(I)+' A</b> '+(tri?'trifase':'monofase')+' con cosφ '+asF(cos,2)+' corrispondono a circa <b>'+asF(pw,2)+' kW</b>.'}); }
  if(L&&(I||P)){
    var Ib=I||(tri?P*1000/(Math.sqrt(3)*400*cos):P*1000/(230*cos)), In=AS_INT.filter(function(x){ return x>=Ib*0.98; })[0]||0, K=tri?Math.sqrt(3):2, T=tri?AS_PORT3:AS_PORT2;
    var dv=function(s){ return K*L*Ib*rho*cos/s/V*100; };
    if(SZ){ var d1=dv(SZ), ok=d1<=4&&(T[String(SZ)]||0)>=In; cards.push({t:'Caduta di tensione',h:'Cavo <b>'+asF(SZ)+' mm²</b>, '+asF(L,0)+' m, '+asF(Ib)+' A '+(tri?'trifase':'monofase')+': caduta <b>'+asF(d1,2)+'%</b> ('+asF(d1*V/100,1)+' V). '+(d1<=4?'Entro il 4%':'<b>Oltre il 4%</b>: aumenta la sezione')+((T[String(SZ)]||0)<In?'; la portata del cavo ('+(T[String(SZ)]||'?')+' A) è inferiore all\'interruttore da '+In+' A':'')+(ok?'. Va bene.':'.')}); }
    else if(In){
      var Sx=0; AS_SEZ.forEach(function(s){ if(!Sx&&(T[String(s)]||0)>=In&&dv(s)<=4) Sx=s; });
      if(Sx){ var Sp=AS_SEZ[AS_SEZ.indexOf(Sx)-1];
        cards.push({t:'Sezione del cavo',h:'Corrente di impiego <b>'+asF(Ib)+' A</b> → magnetotermico <b>'+In+' A</b> → sezione minima <b>'+asF(Sx)+' mm²</b> '+(tri?'(5 conduttori)':'(3 conduttori)')+': portata circa '+T[String(Sx)]+' A, caduta di tensione <b>'+asF(dv(Sx),2)+'%</b> su '+asF(L,0)+' m.'+(Sp?' Con '+asF(Sp)+' mm² la caduta sarebbe '+asF(dv(Sp),2)+'%'+((T[String(Sp)]||0)<In?' e la portata non basta':'')+'.':'')});
        var nc='Cavo FG16OR16 '+(tri?'5G':'3G')+asF(Sx)+' mm²', vc=null, vb=null; prVoci().forEach(function(v){ if(v.d===nc) vc=v; if(v.d==='Magnetotermico '+(tri?'4P':'1P+N')+' '+In+' A') vb=v; });
        if(vc) righe.push({d:vc.d,u:vc.u,q:Math.ceil(L),p:vc.p,perche:'calcolo',stanza:'',pr:vc.id});
        if(vb) righe.push({d:vb.d,u:vb.u,q:1,p:vb.p,perche:'calcolo',stanza:'',pr:vb.id});
      } else cards.push({t:'Sezione del cavo',h:'Con '+asF(Ib)+' A su '+asF(L,0)+' m serve più di 95 mm²: conviene un progetto dedicato.'});
    }
  }
  if(!cards.length) return null;
  if(L&&(I||P)) cards.push({t:'',h:'<small>Valori indicativi: cavo in rame in tubo, 30 °C, caduta massima 4%. Verifica sempre con il progetto e la CEI 64-8.</small>'});
  return {cards:cards,righe:righe};
}
// Analisi completa del testo: non cambia nulla, prepara una proposta da mostrare in anteprima
function asAnalizza(testo){
  var n=asNorm(testo), mk=asMarche(n,testo), nPos=n.replace(/\b(?:senza|niente|tranne|escluso|esclusa|esclusi|no)\s+[^,;.]+/g,' ');
  var calc=asCalcolo(n);
  if(calc){ var m0=S.lines.length>0; return {model:S.model,mode:m0?'mod':'nuovo',cliente:{},marche:[],serie:[],righe:calc.righe,stanze:[],note:[],ignorate:[],mods:[],cond:null,titolo:m0?'':(S.meta.title||''),tipoTrovato:null,calc:calc.cards}; }
  var hint=mk.map(function(x){ return x.t; }), tipoTrovato=asTipo(nPos.replace(/presa tv sat/g,'presa tv'),hint);
  var verbo=AS_VERBO.test(n), mod=S.lines.length>0&&(verbo||!tipoTrovato);
  var model=mod?S.model:(tipoTrovato||S.model);
  var res={model:model,mode:mod?'mod':'nuovo',cliente:asCliente(testo),marche:mk.map(asMarcaNome),serie:mk.filter(function(x){ return x.s; }).map(function(x){ return x.b+' '+x.s; }),righe:[],stanze:[],note:[],ignorate:[],mods:[],cond:null,titolo:'',tipoTrovato:tipoTrovato};
  var esplicite={};
  var senzaMarche=function(t){ mk.forEach(function(x){ t=t.replace(new RegExp('(^|[^a-z0-9])'+asRx(x.b)+'(?![a-z0-9])','g'),' '); }); Object.keys(AS_ALIAS).forEach(function(k){ t=t.replace(new RegExp('(^|[^a-z0-9])'+k+'(?![a-z0-9])','g'),' '); }); return t.replace(/\s+/g,' ').trim()||t; };
  var addPr=function(v,q,sd,perche){ var st0=sd?sd.nome:'', ex=null; esplicite[v.d+'|'+st0]=q; res.righe.forEach(function(r){ if(r.d===v.d&&(r.stanza||'')===st0) ex=r; }); if(ex){ ex.q=q; return; }
    res.righe.push({d:v.d,u:v.u,q:q,p:v.p,perche:perche||'prontuario',stanza:st0,kind:sd?sd.k:'',pr:v.id}); };
  var add=function(nome,q,perche,stanza,kind){ var it=asItem(model,nome); if(!it||!(q>0)) return; var k=it[0]+'|'+(stanza||''); if(esplicite[k]!=null&&perche!=='richiesta'&&perche!=='imparata') return;
    var ex=null; res.righe.forEach(function(r){ if(r.d===it[0]&&(r.stanza||'')===(stanza||'')) ex=r; });
    if(ex){ if(perche==='richiesta'||perche==='imparata'){ ex.q=q; ex.perche=perche; } return; }
    res.righe.push({d:it[0],u:it[1],q:q,p:num(it[2]),perche:perche,stanza:stanza||'',kind:kind||''}); };
  var mq=(nPos.match(/(\d+(?:\.\d+)?) mq/)||[])[1], kw=(nPos.match(/(\d+(?:\.\d+)?) kwp?\b/)||[])[1], kwh=(nPos.match(/(\d+(?:\.\d+)?) kwh/)||[])[1], metri=(nPos.match(/(\d+) (?:m|metri|mt|ml)\b(?! ?q)/)||[])[1];
  mq=mq?parseFloat(mq):0; kw=kw?parseFloat(kw):0; kwh=kwh?parseFloat(kwh):0; metri=metri?parseInt(metri,10):0;
  var has=function(re){ return re.test(nPos); };
  // stanze dell'appartamento (servono prima, per «3 prese in cucina»)
  var st=[];
  if(!mod&&model==='app'){
    st=asStanze(nPos); var tg=nPos.match(/\b(mono|bi|tri|quadri|penta)local/);
    if(!st.length&&tg){ st=AS_TAGLI[tg[1]].map(function(a){ return {k:a[0],q:a[1]}; }); res.note.push('Stanze di un '+tg[1]+'locale tipo: controllale prima di applicare.'); }
    else if(!st.length&&mq){ st=[{k:'in',q:1},{k:'cu',q:1},{k:'so',q:1},{k:'ca',q:mq>=75?2:1},{k:'ba',q:mq>=90?2:1}]; if(mq>=110) st.push({k:'cm',q:1}); if(mq>=70) st.push({k:'co',q:1}); res.note.push('Stanze stimate dai '+mq+' mq: controllale prima di applicare.'); }
    if(!st.length){ st=[{k:'in',q:1},{k:'cu',q:1},{k:'so',q:1},{k:'ca',q:1},{k:'ba',q:1}]; res.note.push('Non ho trovato le stanze: uso un appartamento tipo, modificalo pure.'); }
  }
  function stanzaDi(dove){
    if(!dove||model!=='app') return null;
    if(mod){ var L=S.rooms.filter(function(r){ return r.kind===dove.k; }); var rm=L[(dove.n||1)-1]||L[0]; return {nome:rm?rm.name:ROOMNAME[dove.k],k:dove.k}; }
    var s=st.filter(function(x){ return x.k===dove.k; })[0]; if(!s){ s={k:dove.k,q:1,nokit:true}; st.push(s); }
    return {nome:ROOMNAME[dove.k]+(s.q>1?' '+Math.min(s.q,dove.n||1):''),k:dove.k};
  }
  var curSt=null; if(mod&&model==='app'){ var cr=roomById(curKey()); if(cr) curSt={nome:cr.name,k:cr.kind}; }
  // 1. frase per frase: comandi, quantità, parole imparate
  var stanzeRe=new RegExp('\\b(?:'+AS_STANZE.map(function(s){ return s[0].source; }).join('|')+')'), cmds=[], ultimo='', libere=[];
  asFrasi(n).forEach(function(fr){
    if(AS_COND.test(fr)&&!asQta(fr.replace(/\b(?:sconto|acconto|iva|validit\w*)\b.*$/,''))) { ultimo=''; return; }
    var mT=fr.match(AS_TOGLI), mC=fr.match(AS_CAMBIA);
    if(!mT&&ultimo==='togli'&&!/\d/.test(fr)&&!AS_VERBO.test(fr)) mT=[fr,fr.replace(/^(?:(?:il|lo|la|i|gli|le|l'|un|una|uno)\s*)/,'')];
    if(mT){ ultimo='togli'; cmds.push({t:'togli',x:mT[1],dove:asDove(mT[1])}); return; }
    if(mC){ ultimo=''; cmds.push({t:'qta',x:mC[1],q:parseFloat(mC[2]),dove:asDove(mC[1])}); return; }
    ultimo='';
    var dove=asDove(fr), base=dove?dove.rest:fr, q=asQta(base), sd=dove?stanzaDi(dove):curSt;
    var imp=asImparata(model,q?q.r:base);
    if(imp&&(q||!/\d/.test(base))){ esplicite[imp[0]+'|'+(sd?sd.nome:'')]=q?q.q:1; add(imp[0],q?q.q:1,'imparata',sd?sd.nome:'',sd?sd.k:''); return; }
    if(!q){
      var mv=base.match(/^(?:aggiungi|aggiungere|aggiungimi|metti|mettimi|inserisci|serve|servono|anche|poi|installa|monta|montare|installare)\s+(?:(?:il|lo|la|i|gli|le|l'|un|una|uno|anche|pure)\s*)?(.{3,})$/);
      if(mv){ var b0=asMigliore(model,senzaMarche(mv[1])); if(b0&&b0.it){ esplicite[b0.it[0]+'|'+(sd?sd.nome:'')]=1; add(b0.it[0],1,'richiesta',sd?sd.nome:'',sd?sd.k:''); return; }
        if(b0&&b0.pv){ addPr(b0.pv,1,sd); return; } }
      libere.push(fr); return; }
    if(/^(mq|kwp?|kwh|condomin\w*|utenz\w*|famigli\w*|appartament\w*|interni|anni|giorni|mesi|m|metri|mt|ml|km|ore|h|tb|gb|mp|canali|porte|kw\w*|percento|per cento)\b/.test(q.r)) return;
    if(model==='app'&&stanzeRe.test(q.r)&&!/punt|pres|luc|faret|linea|rete|interrut|devia|tappar|termost/.test(q.r)) return;
    var bm=asMigliore(model,senzaMarche(q.r)), it=bm&&bm.it;
    if(it){ esplicite[it[0]+'|'+(sd?sd.nome:'')]=q.q; add(it[0],q.q,'richiesta',sd?sd.nome:'',sd?sd.k:''); return; }
    if(bm&&bm.pv){ addPr(bm.pv,q.q,sd); return; }
    res.ignorate.push({f:fr.trim(),k:asChiave(q.r),q:q.q});
  });
  var nAdd=' '+libere.join(' , ')+' ';
  // 2. ricette per tipo (solo per un preventivo nuovo e se il testo dice che lavoro e')
  if(mod){ /* sul preventivo aperto: solo quello che chiedi */ }
  else if(!tipoTrovato){ if(res.righe.length) res.note.push('Non ho capito il tipo di lavoro: aggiungo le voci al preventivo «'+(MODELS[model].short||MODELS[model].name)+'».'); }
  else if(model==='app'){
    res.stanze=st;
    st.forEach(function(s){ for(var i=0;i<s.q;i++){ var nome=ROOMNAME[s.k]+(s.q>1?' '+(i+1):''); if(s.nokit) continue; (KITS[s.k]||[]).forEach(function(x){ var it=catItem(x[0]); if(it&&esplicite[it[0]+'|'+nome]==null) res.righe.push({d:it[0],u:it[1],q:x[1],p:num(it[2]),perche:'stanza',stanza:nome,kind:s.k}); }); } });
    (KITS.ge||[]).forEach(function(x){ var it=catItem(x[0]); if(it&&esplicite[it[0]+'|']==null) res.righe.push({d:it[0],u:it[1],q:x[1],p:num(it[2]),perche:'tipico',stanza:''}); });
    res.titolo='Rifacimento impianto elettrico appartamento'+(mq?' di '+mq+' mq':'');
  }
  else if(model==='vcit'){
    var cn=(nPos.match(/(\d+)\s*(?:condomin|utenz|famigli|appartament|interni|campanell)/)||[])[1];
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
    var mot=has(/sezional/)?'Automazione porta garage sezionale':has(/basculant/)?'Automazione per porta basculante':has(/sbarr/)?'Sbarra automatica per parcheggio':has(/scorrevol|robus|krono|bxv?[ -]?\d|deimos/)?(has(/pesant|industrial/)?'Motore per cancello scorrevole pesante':'Motore per cancello scorrevole'):(has(/interrat/)?'Motore interrato per cancello a battente (coppia)':'Motori per cancello a battente (coppia)');
    add(mot,1,'tipico');
    if(/battente/.test(mot)) add('Centrale di comando',1,'tipico');
    add('Radiocomando 4 canali',2,'tipico'); add('Coppia di fotocellule',1,'tipico'); add('Lampeggiante con antenna',1,'tipico');
    ['Cavi e canalizzazioni','Installazione, regolazione e collaudo','Programmazione dei radiocomandi','Analisi dei rischi e fascicolo tecnico'].forEach(function(x){ add(x,1,'tipico'); });
    if(has(/smartphone|app\b|wi-?fi/)) add('Modulo Wi-Fi per comando da smartphone',1,'richiesta');
    if(has(/costa/)) add('Costa di sicurezza',1,'richiesta');
    res.titolo=mot.replace(/^Motor[ei] (interrato )?per /,'Automazione ').replace(' (coppia)','');
  }
  else if(model==='all'){
    add(has(/radio|senza fili|wireless|app\b/)||mk.some(function(x){ return /^(Ajax|Daitem)$/.test(x.b); })?'Centrale di allarme radio con app':'Centrale di allarme ibrida filare / radio',1,'tipico');
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
    if(!ncam){ var mc=nPos.match(/(\d+)\s*(?:telecamer|punti di ripresa)/); ncam=mc?parseInt(mc[1],10):4; add(has(/\b8 ?mp|4k/)?'Telecamera IP 8 MP 4K bullet PoE':(has(/dome/)?'Telecamera IP 5 MP dome PoE':'Telecamera IP 4 MP bullet PoE'),ncam,mc?'richiesta':'stima'); if(!mc) res.note.push('Numero di telecamere non indicato: ne metto 4.'); }
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
    if(!np){ var mp=nPos.match(/(\d+)\s*(?:prese?|punti tv|televisor)/); np=mp?parseInt(mp[1],10):3; add('Presa TV / SAT',np,mp?'richiesta':'stima'); }
    add(has(/5g|interferen/)?'Antenna digitale terrestre con filtro 5G':'Antenna UHF / VHF',1,'tipico');
    if(has(/parabol|satellit|sky|tivusat/)||/\bsat\b/.test(nPos.replace(/presa tv sat/g,''))) add('Parabola 80 cm con LNB quad',1,'richiesta');
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
  else res.titolo=(TTL_T&&TTL_T[model])||MODELS[model].name;
  if(!tipoTrovato||mod) res.titolo=mod?'':(S.meta.title||'');
  // richieste senza numero ma chiare ("quadro nuovo", "salvavita", "messa a terra")
  if(/^(dom|app|ind|rip)$/.test(model)){
    var gia=function(re){ return res.righe.some(function(r){ return re.test(r.d); })||(mod&&S.lines.some(function(l){ return re.test(l.d)&&!l.off; })); };
    [[/\bquadr[oi]\b/,/^Quadro/,'quadro elettrico'],[/salvavita|differenzial/,/differenziale/i,'interruttore magnetotermico differenziale'],[/messa a terra|impianto di terra|dispersor/,/terra/i,'impianto di messa a terra'],[/videocitofon/,/[Vv]ideocitofono/,'videocitofono con posto esterno']].forEach(function(x){
      if(model==='rip'&&x[0].source.indexOf('differenzial')>-1) return;
      if(x[0].test(mod?nAdd:nAdd+nPos.replace(/\b(?:togli|elimina|rimuovi|cancella|leva)\b[^,;.]*/g,' '))&&!gia(x[1])){ var it=asMatch(model,x[2],1); if(it) add(it[0],1,'richiesta',curSt?curSt.nome:'',curSt?curSt.k:''); }
    });
  }
  // ore di manodopera ("8 ore di manodopera")
  var ore=(mod?nAdd:nPos).match(/(\d+(?:\.\d+)?)\s*(?:ore|h)\b/); if(ore){ var mo=asMatch(model,'manodopera oraria',1); if(mo) add(mo[0],parseFloat(ore[1]),'richiesta'); }
  // comandi: togli, cambia quantità (sul preventivo aperto o su quello nuovo)
  cmds.forEach(function(c){
    var src=mod?S.lines.filter(function(l){ return !l.vm; }):res.righe, get=mod?asLineaInfo:asRigaInfo, L=asTrova(src,c.dove?c.dove.rest:c.x,c.dove,get);
    if(!L.length){ if(mod&&model==='vcit'&&c.t==='qta'&&/condomin/.test(c.x)) res.mods.push({tipo:'s',k:'cond',v:Math.max(1,Math.round(c.q)),t:'Condomini: '+vcN()+' → '+Math.round(c.q),on:true}); else res.note.push('Non ho trovato «'+c.x+'» '+(mod?'nel preventivo':'tra le voci')+': controlla come è scritto.'); return; }
    if(c.t==='togli'){
      if(mod) L.forEach(function(l){ if(res.mods.some(function(z){ return z.ref===l; })) return; var o=get(l); res.mods.push({tipo:'t',ref:l,t:o.d+(o.st?' · '+o.st:'')+' · '+qfmt(num(l.q))+' '+(l.u||''),on:true}); });
      else { res.righe=res.righe.filter(function(x){ return L.indexOf(x)<0; }); res.note.push('Senza «'+L[0].d+'»'+(L.length>1?' ('+L.length+' righe)':'')+', come hai chiesto.'); }
    } else {
      var T=L.length>1&&!c.dove?[L[0]]:L; if(T.length<L.length) res.note.push('«'+L[0].d+'» è in '+L.length+' stanze: ho cambiato solo «'+(get(L[0]).st||'la prima')+'». Scrivi la stanza, es. «in cucina».');
      T.forEach(function(x){ var o=get(x); if(mod) res.mods.push({tipo:'c',ref:x,a:c.q,t:o.d+(o.st?' · '+o.st:'')+': '+qfmt(num(x.q))+' → '+qfmt(c.q),on:true}); else { x.q=c.q; x.perche='richiesta'; } });
    }
  });
  // condizioni economiche
  var m;
  if((m=n.match(/\bsconto\s+(?:del\s+|di\s+|al\s+)?(\d+(?:\.\d+)?)\s*(?:%|percento|per cento)?/))) res.mods.push({tipo:'s',k:'disc',v:Math.min(100,parseFloat(m[1])),t:'Sconto '+m[1].replace('.',',')+'%',on:true});
  if((m=n.match(/\bacconto\s+(?:del\s+|di\s+|al\s+)?(\d+(?:\.\d+)?)\s*(?:%|percento|per cento)?/))) res.mods.push({tipo:'s',k:'dep',v:Math.min(100,parseFloat(m[1])),t:'Acconto '+m[1].replace('.',',')+'%',on:true});
  if((m=n.match(/\biva\s+(?:al\s+|a\s+)?(22|10|4|0)\b/))||/\biva agevolata\b/.test(n)) res.mods.push({tipo:'s',k:'iva',v:m?+m[1]:10,t:'IVA '+(m?m[1]:'10')+'%',on:true});
  if((m=n.match(/\bvalid\w*\s+(?:di\s+|a\s+)?(\d+)\s*(?:giorni|gg)\b/))) res.mods.push({tipo:'s',k:'val',v:parseInt(m[1],10),t:'Validità '+m[1]+' giorni',on:true});
  if(mod&&model==='vcit'){ var cm=nPos.match(/(\d+)\s*(?:condomin|utenz|famigli|appartament)/); if(cm&&+cm[1]!==vcN()&&!res.mods.some(function(x){ return x.k==='cond'; })) res.mods.push({tipo:'s',k:'cond',v:+cm[1],t:'Condomini: '+vcN()+' → '+cm[1],on:true}); }
  // marche: confronto, marca unica, cambio marca
  res.confronto=!mod&&mk.length>=2&&/confront|oppure|alternativ|due proposte|due soluzioni|o in alternativa|\bvs\b/.test(n);
  if(!res.confronto&&mk.length){ res.marca=res.marche[0]; if(mod&&/\b(marca|tutto|tutta|tutti|cambia|passa)\b/.test(n)&&!brOn()){ res.mods.push({tipo:'b',v:res.marca,t:'Marca di tutte le voci → '+res.marca,on:true}); } }
  res.ignorate=res.ignorate.filter(function(f){ return !/^\d+ (mq|kwp?|kwh|condomin|m|metri|ore|h)\b/.test(f.f); });
  if(!res.righe.length&&!res.mods.length) res.note.push(mod?'Non ho riconosciuto voci o modifiche: prova con «aggiungi 3 prese in cucina», «togli il quadro», «sconto 10%».':'Non ho riconosciuto voci del listino: prova a indicare quantità e cosa serve (es. «6 prese, 4 punti luce»).');
  return res;
}
function asTot(res){ var s=0; res.righe.forEach(function(r){ if(r.on!==false) s+=num(r.q)*num(r.p); }); var iva=num(S.meta.iva); return {imp:r2(s),tot:r2(s*(1+iva/100))}; }
function asDelta(res){
  var s=asTot(res).imp; (res.mods||[]).forEach(function(x){ if(x.on===false||!x.ref) return; if(x.tipo==='t') s-=lineTotal(x.ref); else if(x.tipo==='c') s+=num(x.ref.p)*(1-num(x.ref.s)/100)*(num(x.a)-num(x.ref.q)); });
  return r2(s*(1+num(S.meta.iva)/100));
}
// «ho capito»: cosa ha letto l'assistente, mentre scrivi
function asCapito(r){
  if(r.calc) return r.calc.filter(function(x){ return x.t; }).map(function(x){ return [x.t,'m']; });
  var c=[], n=r.righe.filter(function(x){ return x.on!==false; }).length, tm=r.mods.filter(function(x){ return x.tipo==='t'; }).length, cm=r.mods.filter(function(x){ return x.tipo==='c'; }).length;
  if(r.mode==='mod') c.push(['Modifico il preventivo aperto','m']);
  else if(r.tipoTrovato) c.push([MODELS[r.model].short||MODELS[r.model].name,'']);
  if(r.stanze&&r.stanze.length) c.push([r.stanze.reduce(function(a,s){ return a+s.q; },0)+' stanze','']);
  if(r.cond) c.push([r.cond.n+' condomini','']);
  var kw=r.titolo.match(/(\d+(?:,\d+)?) kWp/); if(kw) c.push([kw[1]+' kWp','']);
  if(r.confronto) c.push([r.marche.join(' vs '),'']); else if(r.marca) c.push([r.marca,'']);
  if(r.cliente.name) c.push([r.cliente.name,'']); if(r.cliente.tel) c.push(['tel. '+r.cliente.tel,'']); if(r.cliente.cf) c.push([(/^P\.IVA/.test(r.cliente.cf)?'P.IVA':'C.F.')+(r.cliente.info&&(r.cliente.info.chk.cf||r.cliente.info.chk.piva)?' ✓':''),'']);
  r.mods.forEach(function(x){ if(x.tipo==='s'||x.tipo==='b') c.push([x.t,'m']); });
  if(n) c.push([(r.mode==='mod'?'+':'')+n+(n===1?' voce':' voci'),'']); if(tm) c.push(['−'+tm+' da togliere','m']); if(cm) c.push([cm+' quantità','m']);
  if(n||tm||cm) c.push([(r.mode==='mod'?'variazione ':'≈ ')+eur(r.mode==='mod'?asDelta(r):asTot(r).tot),'']);
  return c;
}
function asLive(){
  var el=$('as-live'); if(!el) return; var t=$('as-txt').value.trim();
  if(t.length<3){ el.innerHTML=''; return; }
  var r; try{ r=asAnalizza(t); }catch(e){ el.innerHTML=''; return; }
  var c=asCapito(r); el.innerHTML=c.length?'<small>Ho capito:</small>'+c.map(function(x){ return '<span class="as-k'+(x[1]?' '+x[1]:'')+'">'+esc(x[0])+'</span>'; }).join(''):'<small>Scrivi cosa ti serve: tipo di lavoro, quantità, marca…</small>';
}

// ---------- interfaccia ----------
function asOpzioni(model,frase){
  var it=S.cat[model]||[], tk=asToks(frase).map(function(w){ return w.slice(0,4); });
  var sc=it.map(function(c,i){ var t=asToksC(c[0]), m=0; tk.forEach(function(w){ if(t.some(function(x){ return x.indexOf(w)===0||w.indexOf(x.slice(0,4))===0; })) m++; }); return {i:i,m:m}; }).filter(function(x){ return x.m>0; }).sort(function(a,b){ return b.m-a.m; }).slice(0,5);
  return '<option value="">Associa a una voce del listino…</option>'+(sc.length?'<optgroup label="Più simili">'+sc.map(function(x){ return '<option value="'+x.i+'">'+esc(it[x.i][0])+'</option>'; }).join('')+'</optgroup>':'')+
    (function(){ var P=prCerca(frase,model,6).filter(function(x){ return !it.some(function(c){ return c[0]===x.v.d; }); }); return P.length?'<optgroup label="Dal prontuario IECI">'+P.map(function(x){ return '<option value="p:'+esc(x.v.id)+'">'+esc(x.v.d)+' · '+eur(x.v.p)+'/'+esc(x.v.u)+'</option>'; }).join('')+'</optgroup>':''; })()+
    '<optgroup label="Tutto il listino «'+esc(MODELS[model].short||MODELS[model].name)+'»">'+it.map(function(c,i){ return '<option value="'+i+'">'+esc(c[0])+'</option>'; }).join('')+'</optgroup>';
}
function asRender(){
  var box=$('as-out'); if(!box) return; var r=AS.res; asRenderParole(); if(AS.doc){ docRender(); return; } if(!r){ box.innerHTML=''; return; }
  var T=asTot(r), PER={richiesta:'chiesto',stanza:'stanza',tipico:'tipico',stima:'stimato',imparata:'imparata',prontuario:'prontuario',calcolo:'calcolato'}, mod=r.mode==='mod';
  var gruppi={}, ord=[]; r.righe.forEach(function(x,i){ var g=x.stanza||(mod?'Voci da aggiungere':'Generale e parti comuni'); if(!gruppi[g]){ gruppi[g]=[]; ord.push(g); } gruppi[g].push(i); });
  var h=r.calc&&!r.righe.length?'':mod?'<div class="as-sum"><div><small>Preventivo aperto</small><b>'+esc(MODELS[r.model].short||MODELS[r.model].name)+'</b></div><div><small>Modifiche</small><b>'+(r.righe.filter(function(x){ return x.on!==false; }).length+r.mods.filter(function(x){ return x.on!==false; }).length)+'</b></div><div><small>Variazione</small><b>'+(asDelta(r)>=0?'+':'−')+'\u00a0'+eur(Math.abs(asDelta(r)))+'</b></div></div>'
    :'<div class="as-sum"><div><small>Tipo</small><b>'+esc(MODELS[r.model].short||MODELS[r.model].name)+'</b></div><div><small>Voci</small><b>'+r.righe.filter(function(x){ return x.on!==false; }).length+'</b></div><div><small>Totale stimato</small><b>'+eur(T.tot)+'</b></div></div>'+
    '<label class="f">Titolo<input type="text" id="as-tit" value="'+esc(r.titolo)+'"></label>';
  var c=r.cliente; if(c.name||c.addr||c.tel||c.email||c.cf) h+='<div class="as-cli"><b>Cliente</b> '+esc([c.name,c.addr,c.tel,c.email,c.cf].filter(Boolean).join(' · '))+(c.info&&c.info.chk.cf?' <span class="as-k">C.F. valido'+(c.info.chk.nomeCf?' e corrisponde al nome':'')+'</span>':'')+(c.info&&c.info.chk.cf===false?' <span class="as-k m">C.F. da controllare</span>':'')+(c.info&&c.info.chk.piva?' <span class="as-k">P.IVA valida</span>':'')+(c.info&&c.info.rubrica?' <span class="as-k">già in rubrica</span>':'')+'</div>';
  if(r.cond) h+='<div class="as-cli"><b>Condomini</b> '+r.cond.n+' · '+(r.cond.kind==='cit'?'solo citofono':r.cond.kind==='both'?'videocitofono e citofono a confronto':'videocitofono')+'</div>';
  if(r.confronto) h+='<div class="as-cli"><b>Proposte a confronto</b> '+esc(r.marche.join(' · '))+'</div>'; else if(r.marca&&!r.mods.some(function(x){ return x.tipo==='b'; })) h+='<div class="as-cli"><b>Marca</b> '+esc(r.marca)+'</div>';
  r.note.forEach(function(x){ h+='<div class="as-note">'+esc(x)+'</div>'; });
  if(r.calc) h+='<div class="as-calc">'+r.calc.map(function(c){ return '<div class="as-cc">'+(c.t?'<b>'+esc(c.t)+'</b>':'')+'<p>'+c.h+'</p></div>'; }).join('')+(r.righe.length?'<p class="hint">Se vuoi, aggiungo al preventivo il cavo e l\'interruttore calcolati:</p>':'')+'</div>';
  if(r.mods.length){ var TY={t:['t','togli'],c:['c','quantità'],s:['s','condizioni'],b:['s','marca']};
    h+='<div class="as-mods"><div class="as-mt">'+(mod?'Modifiche al preventivo aperto':'Condizioni')+'</div>'+r.mods.map(function(x,i){ return '<label class="as-mod'+(x.on===false?' off':'')+'"><input type="checkbox" data-asm="'+i+'"'+(x.on===false?'':' checked')+'><span class="as-ty '+TY[x.tipo][0]+'">'+TY[x.tipo][1]+'</span><span>'+esc(x.t)+'</span></label>'; }).join('')+'</div>'; }
  var molte=r.righe.length>15;
  if(r.righe.length) h+='<div class="as-righe">'+ord.map(function(g){ var sub=0, nv=0; gruppi[g].forEach(function(i){ var x=r.righe[i]; if(x.on!==false){ sub+=num(x.q)*num(x.p); nv++; } });
    return '<details class="as-gd" data-asg="'+esc(g)+'"'+((!molte||AS.aperti[g])?' open':'')+'><summary class="as-g"><span>'+esc(g)+'</span><span>'+nv+(nv===1?' voce':' voci')+' · '+eur(sub)+'</span></summary>'+gruppi[g].map(function(i){ var x=r.righe[i];
    return '<label class="as-r'+(x.on===false?' off':'')+'"><input type="checkbox" data-asr="'+i+'"'+(x.on===false?'':' checked')+'><span class="as-d">'+esc(x.d)+((x.perche==='richiesta'||x.perche==='stima'||x.perche==='imparata'||x.perche==='prontuario'||x.perche==='calcolo')?'<small class="as-p '+x.perche+'">'+PER[x.perche]+'</small>':'')+'</span><input type="number" min="0" step="any" class="as-q" data-asq="'+i+'" value="'+x.q+'" aria-label="Quantità"><span class="as-u">'+esc(x.u)+'</span><span class="as-e">'+eur(num(x.q)*num(x.p))+'</span></label>'; }).join('')+'</details>'; }).join('')+'</div>'+(molte?'<p class="hint">Tocca una stanza per vedere e modificare le sue voci.</p>':'');
  if(r.ignorate.length) h+='<div class="as-note as-learn"><div>Non ho trovato nel listino: <b>'+esc(r.ignorate.map(function(f){ return f.f; }).join(' · '))+'</b>. Insegnamelo una volta e la prossima lo capisco da solo:</div>'+
    r.ignorate.map(function(f,i){ return '<div class="as-lr"><b>«'+esc(f.f)+'»</b><select data-asl="'+i+'" aria-label="Voce per «'+esc(f.f)+'»">'+asOpzioni(r.model,f.k||f.f)+'</select></div>'; }).join('')+'</div>';
  var vuoto=!S.lines.length;
  if(r.calc&&!r.righe.length){ box.innerHTML=h+'<div class="row"><button type="button" class="btn ghost" id="as-x">Chiudi</button></div>'; return; }
  h+='<div class="row">'+(mod?'<button type="button" class="btn" id="as-add">Applica le modifiche</button>':'<button type="button" class="btn" id="as-ok">'+(vuoto?'Crea il preventivo':'Sostituisci le voci attuali')+'</button>'+(vuoto?'':'<button type="button" class="btn ghost" id="as-add">Aggiungi alle voci attuali</button>'))+'<button type="button" class="btn ghost" id="as-x">Annulla</button></div>'+
    '<p class="hint">'+(mod?'Le voci uguali già presenti aumentano di quantità. ':'')+'Prezzi del tuo listino. «Stimato» indica una quantità che ho calcolato io: controllala.</p>';
  box.innerHTML=h;
}
function asRenderParole(){
  var el=$('as-par'); if(!el) return; var L=DB.parole||[];
  $('as-par-n').textContent=L.length?'· '+L.length:''; $('as-par-d').hidden=!L.length;
  el.innerHTML=L.map(function(p){ return '<span class="chip" title="'+esc((MODELS[p.m]||{}).name||'')+'">«'+esc(p.k)+'» → '+esc(p.d)+'<button type="button" class="btn x" data-asdel="'+esc(p.id)+'" aria-label="Dimentica">×</button></span>'; }).join('');
}
function asImpara(i,val){
  var r=AS.res; if(!r) return; var idx=String(val);
  if(idx.indexOf('p:')===0){ var v=prById(idx.slice(2)); if(!v) return; idx=prNelListino(v,r.model); save(); }
  var f=r.ignorate[i], it=(S.cat[r.model]||[])[+idx]; if(!f||!it) return;
  var k=f.k||asChiave(f.f); if(!k) return;
  DB.parole=(DB.parole||[]).filter(function(p){ return !(p.m===r.model&&p.k===k); });
  DB.parole.push({id:uid(),m:r.model,k:k,d:it[0],upd:Date.now()}); dbSave();
  var sd=r.mode==='mod'&&r.model==='app'?roomById(curKey()):null;
  r.righe.push({d:it[0],u:it[1],q:f.q||1,p:num(it[2]),perche:'imparata',stanza:sd?sd.name:'',kind:sd?sd.kind:''});
  r.ignorate.splice(i,1); asRender(); toast('Imparato: «'+k+'» = «'+it[0]+'». La prossima volta lo capisco da solo');
}
function asApplica(sostituisci){
  var r=AS.res; if(!r) return; var mod=r.mode==='mod';
  var tit=$('as-tit')?$('as-tit').value.trim():r.titolo, righe=r.righe.filter(function(x){ return x.on!==false&&num(x.q)>0; }), mods=(r.mods||[]).filter(function(x){ return x.on!==false; });
  if(sostituisci&&S.lines.length&&!confirm('Sostituisco le '+S.lines.length+' voci attuali con le '+righe.length+' preparate dall\'assistente?')) return;
  var prev=S.model;
  if(sostituisci){ S.lines=[]; S.products=S.products.filter(function(p){ return !prodEmpty(p); }); if(S.cmp) S.cmp.on=false; S.tiers.on=false; }
  if(!mod&&r.model!==prev){ S.model=r.model; typeTitle(prev); condSwitch(prev); }
  var c=r.cliente; if(c.name) S.client.name=c.name; if(c.addr) S.client.addr=c.addr; if(c.tel) S.client.tel=c.tel; if(c.email) S.client.email=c.email; if(c.cf) S.client.cf=c.cf;
  if(tit&&!mod) S.meta.title=tit;
  // modifiche al preventivo aperto
  var nt=0, nc=0, ns=0;
  mods.forEach(function(x){
    if(x.tipo==='t'&&S.lines.indexOf(x.ref)>-1){ S.lines.splice(S.lines.indexOf(x.ref),1); nt++; }
    else if(x.tipo==='c'&&S.lines.indexOf(x.ref)>-1){ x.ref.q=num(x.a); nc++; }
    else if(x.tipo==='s'){ ns++; if(x.k==='cond'){ S.cond.n=x.v; vcSyncQty(); } else S.meta[x.k]=x.v; }
    else if(x.tipo==='b'){ ns++; S.lines.forEach(function(l){ if(!l.sy&&!l.vm) l.br=x.v; }); S.products.forEach(function(p){ if(!p.sys&&prodUsers(p).length) p.brand=x.v; }); }
  });
  if(nt) S.products=S.products.filter(function(p){ return prodUsers(p).length||!prodEmpty(p); });
  var mappa={};
  if(r.model==='app'){
    if(sostituisci) S.rooms=[]; S.__rm=1; var nuove=!S.rooms.length;
    righe.forEach(function(x){ if(x.stanza&&!mappa[x.stanza]){ var esiste=null; S.rooms.forEach(function(o){ if(o.name===x.stanza) esiste=o; }); var rm=esiste||{id:rid(),name:x.stanza,kind:x.kind||'al'}; if(!esiste) S.rooms.push(rm); mappa[x.stanza]=rm.id; } });
    if(S.rooms.length&&(nuove||!roomById(S.curRoom))) S.curRoom=S.rooms[0].id;
  }
  if(!mod&&r.model==='vcit'&&r.cond){ S.cond.n=r.cond.n; S.cond.kind=r.cond.kind==='both'?'both':r.cond.kind; if(r.cond.kind==='both'){ S.tiers.on=true; S.tiers.n=2; S.tiers.names=[vcSolTitle('cit'),vcSolTitle('video')]; S.tiers.rec=1; S.tiers.sel=-1; } }
  var nn=0, npr=0;
  righe.forEach(function(x){ if(!x.pr) return; var v=prById(x.pr); if(!v) return; var L0=(S.cat[r.model]||[]).length; prNelListino(v,r.model); if((S.cat[r.model]||[]).length>L0) npr++; });
  righe.forEach(function(x){
    var rk=(r.model==='app'&&x.stanza)?mappa[x.stanza]:'';
    if(mod){ var ex=S.lines.filter(function(l){ return l.d===x.d&&!l.vm&&!l.off&&(l.r||'')===(rk||'')&&(!brOn()||l.sy===sysCur().id); })[0]; if(ex){ ex.q=num(ex.q)+num(x.q); nn++; return; } }
    var l={d:x.d,u:x.u,q:num(x.q),p:num(x.p),s:0};
    if(rk) l.r=rk;
    if(x.pc){ l.pc=1; l.tp=1; } else if(r.model==='vcit'&&!mod) l.tp=1;
    if(!mod&&r.model==='vcit'&&r.cond&&r.cond.kind==='both'&&(x.sol==='cit'||x.sol==='video')) l.tm=[x.sol==='cit'?0:1];
    if(r.marca) l.br=r.marca;
    if(mod) brTag(l);
    S.lines.push(l); nn++; linkLine(l,{brand:l.br||r.marca||'',sol:!mod&&r.model==='vcit'&&r.cond&&r.cond.kind==='both'?(x.sol==='*'?'':x.sol):''});
  });
  if(r.confronto){
    var mk=r.marche.slice(0,3);
    if(r.model==='vcit'){ S.cond.kind='brands'; S.cond.sys=mk.map(function(b){ return {id:uid(),n:'',b:b,k:r.cond&&r.cond.kind==='cit'?'cit':'video',tot:''}; }); S.cond.cur=0; S.lines=S.lines.filter(function(l){ return !l.tp; }); sysTiers(); vcTypicalBr(); }
    else { S.cmp={on:true,cur:0,sys:mk.map(function(b){ return {id:uid(),n:'',b:b,k:'video',tot:''}; })}; var A0=S.cmp.sys[0];
      S.lines.forEach(function(l){ if(l.opt||l.vm||l.sy) return; l.sy=A0.id; l.tm=[0]; l.br=A0.b; var p=prodOfLine(l); if(p&&!p.sys){ p.sys=A0.id; p.brand=A0.b; } });
      for(var i=1;i<mk.length;i++) brCopy(0,i); sysTiers(); S.tiers.rec=-1; S.tiers.sel=-1; }
  }
  if(r.model==='vcit') vmSync();
  AS.res=null; asRender(); $('as-txt').value=''; asLive();
  renderAll(); touch();
  toast((mod?'Fatto: '+[nn?nn+(nn===1?' voce aggiunta':' voci aggiunte'):'',nt?nt+' tolte':'',nc?nc+' quantità cambiate':'',ns?ns+(ns===1?' condizione':' condizioni'):''].filter(Boolean).join(', '):'Preventivo preparato: '+righe.length+' voci. Controllalo e completalo')+(npr?' · '+npr+(npr===1?' voce nuova dal prontuario nel tuo listino':' voci nuove dal prontuario nel tuo listino'):''));
  try{ var lb=$('lines'); if(lb) lb.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){}
}
var AS_ESEMPI=[
  'Rifacimento impianto appartamento 95 mq per Rossi Mario, via Roma 3, Matera: ingresso, cucina, soggiorno, 2 camere, 2 bagni, Bticino Living Now',
  'Trilocale Vimar Plana per Bianchi Anna',
  'citofono 10',
  'fv 6 con batteria 10',
  'wallbox 22 25m',
  '8 cam 4 mp',
  'Cancello scorrevole con 3 telecomandi e app sullo smartphone',
  'Allarme radio con app, 5 sensori volumetrici e 6 contatti magnetici',
  'Appartamento 80 mq, Bticino oppure Vimar a confronto',
  'aggiungi 3 prese in cucina, togli il quadro, sconto 10%'
];
(function(){
  var go=$('as-go'); if(!go) return;
  $('as-ex').innerHTML=AS_ESEMPI.map(function(e,i){ return '<button type="button" class="chip" data-asex="'+i+'">'+esc(e.length>46?e.slice(0,44)+'…':e)+'</button>'; }).join('');
  $('as-ex').addEventListener('click',function(e){ var b=e.target.closest('[data-asex]'); if(!b) return; $('as-txt').value=AS_ESEMPI[+b.getAttribute('data-asex')]; asLive(); $('as-txt').focus(); });
  function prepara(){ var t=$('as-txt').value.trim(); if(t.length<3){ toast('Scrivi o detta cosa ti serve'); return; } AS.doc=null; if(docSembraFornitore(t)){ docApri([new File([t],'Testo incollato.txt',{type:'text/plain'})]); return; } var r0=asAnalizza(t); if(!r0.righe.length&&!r0.mods.length&&!r0.calc&&r0.cliente.info&&r0.cliente.info.n>=2&&!r0.tipoTrovato){ docApri([new File([t],'Testo incollato.txt',{type:'text/plain'})]); return; } AS.res=r0; AS.aperti={}; asRender(); }
  go.addEventListener('click',prepara);
  $('as-txt').addEventListener('input',function(){ clearTimeout(AS.lt); AS.lt=setTimeout(asLive,280); });
  $('as-txt').addEventListener('keydown',function(e){ if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){ e.preventDefault(); prepara(); } });
  $('as-out').addEventListener('toggle',function(e){ var d=e.target; if(d.matches&&d.matches('details.as-gd')) AS.aperti[d.getAttribute('data-asg')]=d.open; },true);
  $('as-out').addEventListener('click',function(e){
    if(e.target.id==='as-ok') return asApplica(true);
    if(e.target.id==='as-add') return asApplica(false);
    if(e.target.id==='as-x'){ AS.res=null; asRender(); }
  });
  $('as-out').addEventListener('change',function(e){
    var r=AS.res; if(!r) return; var t=e.target, i=t.getAttribute('data-asr'), q=t.getAttribute('data-asq'), m=t.getAttribute('data-asm'), l=t.getAttribute('data-asl');
    if(i!=null){ r.righe[+i].on=t.checked; asRender(); }
    else if(q!=null){ r.righe[+q].q=Math.max(0,num(t.value)); asRender(); }
    else if(m!=null){ r.mods[+m].on=t.checked; asRender(); }
    else if(l!=null&&t.value!==''){ asImpara(+l,t.value); }
  });
  var pd=$('as-par'); if(pd) pd.addEventListener('click',function(e){ var b=e.target.closest('[data-asdel]'); if(!b) return; var id=b.getAttribute('data-asdel'), p=(DB.parole||[]).filter(function(x){ return x.id===id; })[0]; if(!p) return; DB.parole=DB.parole.filter(function(x){ return x!==p; }); DB.del[id]=Date.now(); dbSave(); asRenderParole(); toast('Dimenticato «'+p.k+'»'); });
  var acc=$('acc-as'); if(acc) acc.addEventListener('toggle',asRenderParole);
  setTimeout(asRenderParole,1500);
  // dettato: riconoscimento vocale del browser, se disponibile
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition, mic=$('as-mic');
  if(!SR){ mic.hidden=true; return; }
  mic.addEventListener('click',function(){
    if(AS.ascolto&&AS.rec){ AS.rec.stop(); return; }
    var rec=new SR(); AS.rec=rec; rec.lang='it-IT'; rec.continuous=true; rec.interimResults=true;
    var base=$('as-txt').value.trim();
    rec.onresult=function(ev){ var t=''; for(var i=0;i<ev.results.length;i++) t+=ev.results[i][0].transcript+' '; $('as-txt').value=(base?base+' ':'')+t.trim(); clearTimeout(AS.lt); AS.lt=setTimeout(asLive,200); };
    rec.onend=function(){ AS.ascolto=false; mic.classList.remove('on'); mic.textContent='Detta'; if($('as-txt').value.trim().length>3){ AS.res=asAnalizza($('as-txt').value.trim()); AS.aperti={}; asRender(); } };
    rec.onerror=function(ev){ toast(ev&&ev.error==='not-allowed'?'Consenti l\'uso del microfono per dettare':'Dettato non disponibile ora: puoi usare il microfono della tastiera'); };
    try{ rec.start(); AS.ascolto=true; mic.classList.add('on'); mic.textContent='Ferma'; }catch(e){ toast('Dettato non disponibile: usa il microfono della tastiera'); }
  });
})();
