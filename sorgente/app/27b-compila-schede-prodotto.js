/* ---------- schede prodotto che si compilano da sole ----------
   Tre fonti, tutte gratuite:
   1. «Compilatore IECI» (sempre, anche senza internet): legge nome, codice e marca e scrive descrizione e
      caratteristiche usando SOLO i dati presenti (4 MP, 2,8 mm, PoE…) più una frase generica vera per quel tipo.
   2. Schede ufficiali Open Icecat (internet): descrizione, caratteristiche e foto del produttore, solo se
      marca + codice corrispondono esattamente. Si manda solo marca e codice, mai dati del cliente.
   3. IA sul telefono (facoltativa): l'IA di Chrome se c'è, altrimenti un modello piccolo scaricato una volta
      (WebLLM, ~1 GB). Riscrive il testo in modo più scorrevole; se aggiunge numeri o promesse che non sono nei
      dati, il testo viene scartato. Tutto resta sul telefono. */
var PC={q:[], run:false, res:{}, t:0, ia:null, iaTipo:'', iaStato:'', iaProg:0};
function pcMode(){ return APP.pcomp||'auto'; }
function pcN(s){ return ' '+String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/(\d),(\d)/g,'$1.$2').replace(/\s+/g,' ')+' '; }
function pcNum(x){ return String(x).replace('.',','); }
// tipi di prodotto: [riconoscimento, nome leggibile, frase d'uso sempre vera per quel tipo]
var PC_TIPI=[
 [/telecamer\w*.*\b(dome|minidome)\b|\bdome\b.*telecamer/,'Telecamera dome','Discreta e compatta, si fissa a soffitto o a parete per sorvegliare ingressi, locali e aree di passaggio.'],
 [/telecamer\w*.*\bbullet\b|\bbullet\b.*telecamer/,'Telecamera bullet','Pensata per controllare cortili, accessi e perimetri con un\'inquadratura ben definita.'],
 [/telecamer\w*.*\bturret\b/,'Telecamera turret','Facile da orientare, adatta a interni ed esterni.'],
 [/telecamer|\bipc\b/,'Telecamera di videosorveglianza','Permette di controllare la propria casa o attività, anche a distanza dallo smartphone.'],
 [/\bnvr\b|videoregistrator/,'Videoregistratore di rete (NVR)','Registra le immagini delle telecamere e permette di rivederle e di guardarle in diretta dallo smartphone.'],
 [/\bdvr\b|\bxvr\b/,'Videoregistratore (DVR)','Registra le immagini delle telecamere e permette di rivederle in ogni momento.'],
 [/hard ?disk|\bhdd\b/,'Hard disk','Memoria in cui il videoregistratore conserva le registrazioni.'],
 [/switch/,'Switch di rete','Collega tra loro i dispositivi di rete dell\'impianto.'],
 [/\bups\b|gruppo di continuita/,'Gruppo di continuità (UPS)','Mantiene acceso l\'impianto durante le interruzioni di corrente e lo protegge dagli sbalzi di tensione.'],
 [/cavo (utp|ftp|di rete|lan)|\butp\b.*cavo|cavo.*cat\.? ?[5-7]/,'Cavo di rete','Porta dati e, dove previsto, alimentazione ai dispositivi di rete.'],
 [/connettor\w* rj ?45|\brj ?45\b/,'Connettori RJ45','Servono a terminare i cavi di rete e collegarli ai dispositivi.'],
 [/cartell/,'Cartello informativo','Segnala la presenza dell\'impianto, come richiesto dalla normativa sulla privacy.'],
 [/modul\w* (fotovolt|fv)|pannell\w* (fotovolt|solar)/,'Modulo fotovoltaico','Trasforma la luce del sole in energia elettrica per la casa o l\'attività.'],
 [/inverter/,'Inverter','Converte l\'energia prodotta dai moduli fotovoltaici in corrente utilizzabile in casa e gestisce l\'impianto.'],
 [/batteri\w*.*(accumul|litio|lifepo|kwh)|accumulo|luna2000/,'Batteria di accumulo','Conserva l\'energia prodotta di giorno per usarla la sera e di notte.'],
 [/smart ?meter|contator\w* (di energia|bidirez)|meter\b/,'Misuratore di energia (smart meter)','Misura i consumi e la produzione e permette all\'impianto di ottimizzare l\'autoconsumo.'],
 [/dongle/,'Modulo di comunicazione','Collega l\'impianto a internet per controllarlo dall\'app.'],
 [/struttur\w*|staff\w*.*(modul|tetto)/,'Struttura di fissaggio','Sostiene i moduli fotovoltaici sulla copertura in modo sicuro.'],
 [/\bmc4\b/,'Connettori MC4','Collegano in modo sicuro i cavi del campo fotovoltaico.'],
 [/cavo solare|h1z2z2/,'Cavo solare','Cavo specifico per i collegamenti in corrente continua del fotovoltaico.'],
 [/wallbox|colonnin\w* di ricarica|stazione di ricarica/,'Stazione di ricarica (wallbox)','Permette di ricaricare l\'auto elettrica a casa in modo sicuro.'],
 [/centrale.*(allarm|antifurto)|\bhub\b/,'Centrale di allarme','Il cuore dell\'impianto di sicurezza: riceve i segnali dei sensori e attiva sirene e notifiche.'],
 [/volumetric|\bpir\b|motionprotect|sensore di movimento/,'Sensore di movimento','Rileva la presenza di persone negli ambienti protetti.'],
 [/contatt\w* magnetic|doorprotect/,'Contatto magnetico','Segnala l\'apertura di porte e finestre.'],
 [/sirena|homesiren|streetsiren/,'Sirena','Segnala l\'allarme con suono e, dove previsto, luce lampeggiante.'],
 [/tastiera|keypad/,'Tastiera','Permette di inserire e disinserire l\'allarme con un codice.'],
 [/rilevator\w* (di )?fumo|fireprotect/,'Rilevatore di fumo','Avvisa subito in caso di fumo.'],
 [/rilevator\w* (di )?gas/,'Rilevatore di gas','Avvisa in caso di fughe di gas.'],
 [/monitor.*(videocit|vivavoce|interno)|videocitofon\w*.*monitor/,'Monitor videocitofonico','Permette di vedere e parlare con chi suona e di aprire la porta.'],
 [/posto esterno|pulsantier|targa/,'Posto esterno','Si installa all\'ingresso: chi arriva suona e si fa vedere e sentire.'],
 [/citofon/,'Citofono','Permette di parlare con chi suona e di aprire la porta.'],
 [/alimentator/,'Alimentatore','Fornisce l\'alimentazione corretta ai dispositivi dell\'impianto.'],
 [/elettroserratur|apriporta/,'Elettroserratura','Permette di aprire porta o cancello a distanza.'],
 [/motor\w*.*(cancell|scorrevol|battent)|motoriduttor/,'Motore per cancello','Automatizza l\'apertura e la chiusura del cancello.'],
 [/fotocellul/,'Fotocellule','Fermano il cancello se qualcuno passa durante il movimento.'],
 [/lampeggiant/,'Lampeggiante','Segnala il movimento del cancello.'],
 [/radiocomand|telecomand|trasmettitor/,'Radiocomando','Apre e chiude il cancello a distanza.'],
 [/antenn/,'Antenna','Riceve il segnale TV.'],
 [/parabol/,'Parabola','Riceve i canali satellitari.'],
 [/multiswitch|centralin\w* (tv|da palo)|amplificator/,'Componente impianto TV','Distribuisce il segnale TV a tutte le prese della casa.'],
 [/magnetotermic\w* differenzial|differenzial\w* magnetotermic|\brcbo\b/,'Interruttore magnetotermico differenziale','Protegge la linea dai sovraccarichi, dai cortocircuiti e le persone dalle dispersioni di corrente.'],
 [/differenzial/,'Interruttore differenziale','Protegge le persone dalle dispersioni di corrente.'],
 [/magnetotermic|\bmcb\b/,'Interruttore magnetotermico','Protegge la linea da sovraccarichi e cortocircuiti.'],
 [/scaricator|\bspd\b|sovratension/,'Scaricatore di sovratensione','Protegge l\'impianto e gli apparecchi dalle sovratensioni, per esempio dovute ai fulmini.'],
 [/centralin|quadr\w* (elettric|di distribuz)|\bquadro\b/,'Centralino','Contiene e protegge gli interruttori dell\'impianto.'],
 [/placc/,'Placca','Completa i comandi e le prese, dando il tocco estetico finale.'],
 [/pres\w* (bipasso|schuko|unel|universal|2p\+t|usb|10\/16)|\bpresa\b/,'Presa','Per collegare gli apparecchi elettrici in sicurezza.'],
 [/deviator|invertitor/,'Deviatore','Permette di accendere la stessa luce da più punti.'],
 [/pulsant/,'Pulsante','Comando a pressione, per esempio per campanelli, luci temporizzate o tapparelle.'],
 [/interruttor/,'Interruttore','Per accendere e spegnere le luci in modo semplice.'],
 [/scatol\w*|cassett\w* di deriv/,'Scatola da incasso','Accoglie in sicurezza comandi, prese e collegamenti.'],
 [/corrugat|\btubo\b|guaina/,'Tubo di protezione','Protegge i cavi all\'interno delle pareti e dei pavimenti.'],
 [/\bcavo\b|\bfs17\b|\bfg16|n07v/,'Cavo elettrico','Cavo per realizzare le linee dell\'impianto.'],
 [/faretto|downlight/,'Faretto LED','Illuminazione a incasso, a basso consumo.'],
 [/plafonier|lampad\w*|\bled\b|striscia/,'Illuminazione LED','Luce a basso consumo e lunga durata.'],
 [/cronotermostat|termostat/,'Termostato','Regola la temperatura degli ambienti per comfort e risparmio.']];
var PC_COL=/\b(bianc[oa]|ner[oa]|grigi[oa]|antracite|argento|silver|blu|ross[oa]|marrone|beige|titanio|sabbia|nichel|bronzo|ardesia)\b/;
// i dati del prodotto: solo quello che c'è scritto nel nome, nel codice o nella marca
function pcFatti(p){
  var nome=String(p.name||''), t=pcN(nome+' '+(p.code||'')), F=[], tipo=null, m, seen={};
  function add(k,v,f,adj){ if(seen[k]) return; seen[k]=1; F.push({k:k,v:v,f:f,adj:!!adj}); }
  PC_TIPI.some(function(x){ if(x[0].test(t)){ tipo={nome:x[1],uso:x[2]}; return true; } return false; });
  var serie=''; AS_SERIE.forEach(function(s){ if(!serie&&s[0].test(t)&&(!p.brand||lc(s[1])===lc(p.brand))&&!/acusense|colorvu/i.test(s[2])) serie=s[2]; });
  if(serie) add('Serie',serie,'');
  if((m=t.match(/\b(\d+(?:\.\d+)?) ?mp\b/))) add('Risoluzione',pcNum(m[1])+' MP','risoluzione '+pcNum(m[1])+' megapixel');
  if((m=t.match(/\b(\d+(?:\.\d+)?) ?mm\b(?! ?(?:2|²|q))/))&&tipo&&/Telecamera/.test(tipo.nome)) add('Ottica',pcNum(m[1])+' mm','ottica da '+pcNum(m[1])+' mm');
  if((m=t.match(/\bir (?:fino a )?(\d+) ?m\b/))) add('Visione notturna','infrarossi fino a '+m[1]+' m','visione notturna a infrarossi fino a '+m[1]+' metri');
  if(/acusense/.test(t)) add('Tecnologia','AcuSense','tecnologia AcuSense che distingue persone e veicoli');
  if(/colorvu/.test(t)) add('Tecnologia','ColorVu','immagini a colori anche di notte (ColorVu)');
  if((m=t.match(/\b(\d+) ?canali\b/))) add('Canali',m[1],m[1]+' canali');
  if((m=t.match(/\b(\d+) ?porte\b/))) add('Porte',m[1],m[1]+' porte');
  if(/\bpoe\b/.test(t)) add('Alimentazione','PoE (dati e alimentazione su un solo cavo)','alimentazione PoE');
  if(/\b4k\b/.test(t)) add('Uscita video','4K','uscita video 4K');
  if((m=t.match(/\b(\d+(?:\.\d+)?) ?tb\b/))) add('Capacità',pcNum(m[1])+' TB','capacità di '+pcNum(m[1])+' TB');
  if((m=t.match(/\b(\d+(?:\.\d+)?) ?kwh\b/))) add('Capacità',pcNum(m[1])+' kWh','capacità di '+pcNum(m[1])+' kWh');
  if((m=t.match(/\b(\d+(?:\.\d+)?) ?kwp?\b/))&&!/kwh/.test(m[0])) add('Potenza',pcNum(m[1])+' kW','potenza di '+pcNum(m[1])+' kW');
  else if((m=t.match(/\b(\d{2,4}) ?wp?\b/))) add('Potenza',m[1]+(/modul|pannell/.test(t)?' Wp':' W'),(/modul|pannell/.test(t)?'potenza di picco di '+m[1]+' Wp':'potenza di '+m[1]+' W'));
  if((m=t.match(/\b(\d{3,5}) ?va\b/))) add('Potenza',m[1]+' VA','potenza di '+m[1]+' VA');
  if(/line interactive/.test(t)) add('Tecnologia','line interactive','tecnologia line interactive');
  if(/monocristallin/.test(t)) add('Celle','monocristalline','celle monocristalline');
  if(/bifacciale/.test(t)) add('Tipo','bifacciale','modulo bifacciale, che produce anche con la luce riflessa');
  if(/full black/.test(t)) add('Aspetto','full black','aspetto full black');
  if(/trifase/.test(t)) add('Collegamento','trifase','collegamento trifase'); else if(/monofase/.test(t)) add('Collegamento','monofase','collegamento monofase');
  if((m=t.match(/\b([1-4]p(?:\+n)?)\b/))){ var po=m[1].toUpperCase(), ad={'1P':'unipolare','2P':'bipolare','3P':'tripolare','4P':'tetrapolare'}[po]; add('Poli',po,ad||po,true); }
  if((m=t.match(/\b(\d{1,3}) ?a(x)?\b/))&&!/(\d) ?ah\b/.test(t)) add('Corrente nominale',m[1]+' A'+(m[2]?'X':''),'corrente nominale di '+m[1]+' A');
  if((m=t.match(/\b(\d+(?:\.\d+)?) ?ka\b/))) add('Potere di interruzione',pcNum(m[1])+' kA','potere di interruzione di '+pcNum(m[1])+' kA');
  if((m=t.match(/\b(\d{2,3}) ?ma\b/))) add('Sensibilità',m[1]+' mA','sensibilità di '+m[1]+' mA');
  if((m=t.match(/\btipo (a|ac|b|f)\b/))) add('Classe','tipo '+m[1].toUpperCase(),'tipo '+m[1].toUpperCase(),true);
  if((m=t.match(/\bcurva ([bcd])\b/))) add('Curva',m[1].toUpperCase(),'curva '+m[1].toUpperCase());
  if((m=t.match(/\b(\d{1,2}) ?moduli\b/))) add('Moduli',m[1],m[1]+' moduli');
  if((m=t.match(/\bip ?(\d{2})\b/))) add('Grado di protezione','IP'+m[1],'grado di protezione IP'+m[1]);
  if((m=t.match(/\b(\d+x)?(\d+(?:\.\d+)?) ?(?:mm2|mm²|mmq)(?=\W|$)/))) add('Sezione',(m[1]||'')+pcNum(m[2])+' mm²','sezione '+(m[1]||'')+pcNum(m[2])+' mm²');
  if((m=t.match(/\bcat\.? ?(5e|6a?|7)\b/))) add('Categoria','Cat. '+m[1].toUpperCase(),'categoria '+m[1].toUpperCase());
  if(/\blszh\b/.test(t)) add('Guaina','LSZH (bassa emissione di fumi)','guaina LSZH a bassa emissione di fumi');
  if((m=t.match(/\b(matassa|bobina|rotolo) (?:da )?(\d+) ?m\b/))) add('Confezione',m[1]+' da '+m[2]+' m',m[1]+' da '+m[2]+' metri');
  if((m=t.match(/\bconf(?:ezione)?\.? (?:da )?(\d+) ?(?:pz|pezzi)?\b/))) add('Confezione',m[1]+' pezzi','confezione da '+m[1]+' pezzi');
  if(/wi-?fi|\bwlan\b/.test(t)) add('Connessione','Wi-Fi','connessione Wi-Fi'); else if(/\bradio\b|wireless|senza fili/.test(t)) add('Connessione','senza fili (radio)','collegamento senza fili');
  if(/\bbms\b/.test(t)) add('Gestione','BMS integrato','BMS integrato');
  if((m=t.match(/\b(\d{2,4})\/(\d{2,4}) ?v\b/))) add('Tensione',m[1]+'/'+m[2]+' V','tensione nominale '+m[1]+'/'+m[2]+' V'); else if((m=t.match(/\b(\d{2,3}) ?v\b/))) add('Tensione',m[1]+' V','tensione '+m[1]+' V');
  if((m=t.match(/\b(fs17|fg16or16|fg16r16|fg16m16|n07v-?k|h07rn-?f|h1z2z2-?k)\b/))) add('Tipo di cavo',m[1].toUpperCase(),'tipo '+m[1].toUpperCase());
  if(/\bpir\b/.test(t)) add('Rilevazione','PIR (infrarossi passivi)','rilevazione a infrarossi passivi');
  if((m=t.match(PC_COL))) add('Colore',m[1].replace(/a$/,'o').replace(/^full black$/,'nero'),'');
  if(p.brand) add('Marca',iwBase(p.brand)||p.brand,'');
  if(p.code) add('Codice',String(p.code),'');
  return {tipo:tipo,attr:F,serie:serie};
}
function pcScrivi(p){
  var X=pcFatti(p), nome=String(p.name||'').trim(), br=iwVero(p.brand)?(iwBase(p.brand)||p.brand):'', fr=X.attr.filter(function(a){ return a.f&&!a.adj; }).map(function(a){ return a.f; }), adj=X.attr.filter(function(a){ return a.f&&a.adj; }).map(function(a){ return a.f; });
  if(!X.tipo&&!fr.length&&!adj.length) return null;
  var testa=(X.tipo?X.tipo.nome+(adj.length?' '+adj.join(' '):'')+(br&&!new RegExp(br,'i').test(X.tipo.nome)?' '+br:''):nome)+(X.serie?' della serie '+X.serie:'');
  var lista=fr.slice(0,4), frase=lista.length?(lista.length===1?lista[0]:lista.slice(0,-1).join(', ')+' e '+lista[lista.length-1]):'';
  var d=testa+(frase?' con '+frase:'')+'.';
  if(X.tipo) d+=' '+X.tipo.uso;
  if(/alimentazione PoE/.test(frase)) d+=' Con il PoE un solo cavo di rete porta dati e alimentazione.';
  var specs=X.attr.map(function(a){ return a.k+': '+a.v; }).join('\n');
  return {desc:d.charAt(0).toUpperCase()+d.slice(1),specs:specs,fonte:'auto',fatti:X};
}
/* ---------- Open Icecat: scheda ufficiale del produttore (solo marca + codice) ---------- */
function pcTesto(h){ try{ var d=new DOMParser().parseFromString('<div>'+String(h||'').replace(/<br\s*\/?>/gi,'\n').replace(/<\/(p|li|div)>/gi,'\n')+'</div>','text/html'); return (d.body.textContent||'').replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n').trim(); }catch(e){ return ''; } }
function pcIcecat(p,lang){
  var br=iwBase(p.brand||''), cd=String(p.code||'').trim();
  if(!iwNet()||!br||!cd) return Promise.resolve(null);
  var u='https://live.icecat.biz/api?lang='+(lang||'it')+'&shopname=openicecat-live&Brand='+encodeURIComponent(br)+'&ProductCode='+encodeURIComponent(cd);
  return iwTo(fetch(u,{mode:'cors',credentials:'omit',referrerPolicy:'no-referrer'}).then(function(r){ return r.ok?r.json():null; }),9000).then(function(j){
    var D=j&&j.data, G=D&&D.GeneralInfo; if(!G) return null;
    var desc=pcTesto(G.Description&&G.Description.LongDesc)||String((G.SummaryDescription&&(G.SummaryDescription.LongSummaryDescription||G.SummaryDescription.ShortSummaryDescription))||'');
    var imgs=[]; (D.Gallery||[]).forEach(function(g){ var x=g.Pic500x500||g.Pic||g.LowPic; if(x&&imgs.indexOf(x)<0) imgs.push(x); }); if(D.Image&&D.Image.HighPic&&imgs.indexOf(D.Image.HighPic)<0) imgs.unshift(D.Image.HighPic);
    var sp=[]; (D.FeaturesGroups||[]).forEach(function(g){ (g.Features||[]).forEach(function(f){ var n=f.Feature&&f.Feature.Name&&(f.Feature.Name.Value||f.Feature.Name), v=f.PresentationValue; if(n&&v&&sp.length<14) sp.push(String(n).trim()+': '+String(v).trim()); }); });
    return {desc:desc.slice(0,900),specs:sp.join('\n'),img:imgs.slice(0,4),titolo:G.Title||'',logo:G.BrandLogo||'',fonte:'icecat',lang:lang||'it'};
  }).catch(function(){ return null; });
}
/* ---------- IA sul telefono (facoltativa) ---------- */
var PC_MOD='Qwen2.5-1.5B-Instruct-q4f16_1-MLC', PC_MOD2='Qwen2.5-0.5B-Instruct-q4f16_1-MLC', PC_WL='https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.84/+esm';
function pcIAChrome(){ return typeof window.LanguageModel!=='undefined'&&window.LanguageModel&&typeof window.LanguageModel.create==='function'; }
function pcIAPossibile(){ return pcIAChrome()||!!navigator.gpu; }
function pcIAStato(t,prog){ PC.iaStato=t; if(prog!=null) PC.iaProg=prog; var el=$('ap-pcia-st'); if(el){ el.textContent=t; el.hidden=!t; } }
function pcIAPrepara(chiedi){
  if(PC.ia) return Promise.resolve(PC.ia);
  if(PC.iaP) return PC.iaP;
  PC.iaP=(function(){
    if(pcIAChrome()){
      var LM=window.LanguageModel, opz={expectedInputs:[{type:'text',languages:['it']}],expectedOutputs:[{type:'text',languages:['it']}]};
      return Promise.resolve(LM.availability?LM.availability(opz):'available').then(function(a){
        if(a==='unavailable') throw new Error('IA di Chrome non disponibile');
        pcIAStato('Preparo l\'IA di Chrome…',0);
        return LM.create(Object.assign({monitor:function(m){ try{ m.addEventListener('downloadprogress',function(e){ pcIAStato('Scarico l\'IA di Chrome: '+Math.round((e.loaded||0)*100)+'%',e.loaded); }); }catch(x){} }},opz));
      }).then(function(s){ PC.ia={tipo:'chrome',chiedi:function(sys,u){ return s.prompt(sys+'\n\n'+u); }}; pcIAStato('IA di Chrome pronta: lavora sul telefono, senza internet',1); return PC.ia; });
    }
    if(!navigator.gpu) return Promise.reject(new Error('Questo telefono o browser non può usare l\'IA sul dispositivo (serve WebGPU: Chrome aggiornato).'));
    if(chiedi&&!confirm('Per l\'IA sul telefono scarico un modello di circa 1 GB, una volta sola: poi funziona anche senza internet e i tuoi dati restano sul telefono. Meglio con il Wi-Fi. Procedo?')) return Promise.reject(new Error('annullato'));
    pcIAStato('Scarico l\'IA sul telefono… 0%',0);
    return import(PC_WL).then(function(W){
      function crea(id){ return W.CreateMLCEngine(id,{initProgressCallback:function(r){ pcIAStato('Scarico e preparo l\'IA sul telefono… '+Math.round((r.progress||0)*100)+'%',r.progress||0); }}); }
      return crea(PC_MOD).catch(function(){ return crea(PC_MOD2); }).then(function(E){
        PC.ia={tipo:'webllm',chiedi:function(sys,u){ return E.chat.completions.create({messages:[{role:'system',content:sys},{role:'user',content:u}],temperature:0.2,max_tokens:260}).then(function(r){ return r.choices[0].message.content||''; }); }};
        pcIAStato('IA sul telefono pronta: lavora senza internet',1); return PC.ia; });
    });
  })().catch(function(e){ PC.iaP=null; pcIAStato(e&&e.message==='annullato'?'':'IA non disponibile: '+(e&&e.message||e)); throw e; });
  return PC.iaP;
}
// l'IA riscrive, ma non può aggiungere numeri o promesse che non sono nei dati
var PC_NO=/garanzi|certificat|omologat|brevett|miglior|numero uno|\bn\.? ?1\b|leader|garantit|anni di|vita utile|risparmi\w* (del|fino)|%/i;
function pcIAControlla(txt,fonte){
  txt=String(txt||'').replace(/^["«\s]+|["»\s]+$/g,'').replace(/\*\*/g,'').replace(/\n{2,}/g,'\n').trim();
  if(txt.length<40||txt.length>700) return '';
  var nf=(pcN(fonte).match(/\d+(?:\.\d+)?/g)||[]), nt=(pcN(txt).match(/\d+(?:\.\d+)?/g)||[]);
  if(nt.some(function(n){ return nf.indexOf(n)<0; })) return '';
  if(PC_NO.test(txt)&&!PC_NO.test(fonte)) return '';
  if(/\b(the|and|with|for|camera)\b/i.test(txt)) return '';
  return txt;
}
function pcIARiscrivi(p,base){
  var X=pcFatti(p), dati=X.attr.map(function(a){ return a.k+': '+a.v; }).join('\n');
  var sys='Sei un elettricista italiano che descrive i prodotti ai clienti in un preventivo. Scrivi in italiano, 2 o 3 frasi semplici e professionali. Usa SOLO i dati forniti: non aggiungere numeri, misure, certificazioni, garanzie o caratteristiche che non ci sono. Niente elenchi, niente titoli.';
  var u='Prodotto: '+p.name+(p.brand?'\nMarca: '+p.brand:'')+(dati?'\nDati:\n'+dati:'')+(base?'\nTesto da migliorare: '+base:'')+'\nScrivi la descrizione:';
  var fonte=[p.name,p.brand,p.code,dati,base].join(' ');
  return pcIAPrepara(false).then(function(ia){ return ia.chiedi(sys,u); }).then(function(t){ var ok=pcIAControlla(t,fonte); if(!ok) throw new Error('testo dell\'IA scartato: aggiungeva dati non presenti'); return ok; });
}
/* ---------- completa una scheda ---------- */
function pcCompleta(p,opt){
  opt=opt||{}; var R={desc:'',specs:'',img:[],fonte:{desc:'',specs:'',img:''},nota:[],titolo:'',logo:''};
  var auto=pcScrivi(p);
  if(auto){ R.desc=auto.desc; R.specs=auto.specs; R.fonte.desc='auto'; R.fonte.specs='auto'; }
  return pcIcecat(p,'it').then(function(ic){ return ic&&(ic.desc||ic.img.length)?ic:pcIcecat(p,'en'); }).then(function(ic){
    if(ic){ if(ic.lang==='it'&&ic.desc){ R.desc=ic.desc; R.fonte.desc='icecat'; } if(ic.specs){ R.specs=ic.specs; R.fonte.specs='icecat'; } if(ic.img.length){ R.img=ic.img; R.fonte.img='icecat'; } if(ic.titolo) R.titolo=ic.titolo; if(ic.logo) R.logo=ic.logo; }
    var vuoleIA=opt.ia||(pcMode()==='ia'&&(PC.ia||pcIAChrome()));
    if(vuoleIA&&R.fonte.desc!=='icecat') return pcIARiscrivi(p,R.desc).then(function(t){ R.desc=t; R.fonte.desc='ia'; return R; },function(e){ if(opt.ia) R.nota.push(String(e&&e.message||e)); return R; });
    return R;
  });
}
var PC_FONTE={auto:'scritta in automatico dai dati del prodotto',icecat:'dalla scheda ufficiale del produttore (Open Icecat)',ia:'scritta dall\'IA sul telefono'};
// applica solo ai campi vuoti (modalità automatica) o a quelli scelti
function pcSegna(p,k,v){ if(!p.pcs) p.pcs={desc:'',specs:'',img:''}; p.pcs[k]=v; }
function pcApplica(p,R,campi,cb){
  var fatto=[];
  if(campi.desc&&R.desc&&(campi.forza||!String(p.desc||'').trim())){ p.desc=R.desc; pcSegna(p,'desc',R.fonte.desc); fatto.push('descrizione'); }
  if(campi.specs&&R.specs&&(campi.forza||!String(p.specs||'').trim())){ p.specs=R.specs; pcSegna(p,'specs',R.fonte.specs); fatto.push('caratteristiche'); }
  // logo della marca dalla scheda ufficiale, solo se non c'è già (vale per tutti i preventivi)
  var br=iwBase(p.brand||'');
  if(campi.logo&&R.logo&&br&&iwVero(br)&&!brandLogo(br)) iwBlobOf({full:R.logo}).then(function(bl){ iwLogoData(bl,function(d){ if(d&&!brandLogo(br)){ iwSaveLogo(br,d,'Open Icecat',''); try{ iwRefresh(); }catch(e){} renderProducts(); } }); },function(){});
  var url=campi.img&&R.img[campi.imgK||0];
  if(url&&(campi.forza||!(p.photos&&p.photos.length))){
    iwBlobOf({full:url}).then(function(bl){ var f=new File([bl],'foto.jpg',{type:bl.type||'image/jpeg'}); if(!p.photos) p.photos=[]; if(!p.po) p.po=[];
      addPhotos(p.photos,MAXPH,[f],function(){ var cr=p.cr||(p.cr={}); cr[iwH(p.photos[p.photos.length-1])]='Foto: scheda del produttore (Open Icecat)'; pcSegna(p,'img','icecat'); renderProducts(); touch(); fatto.push('foto'); if(cb) cb(fatto); },p.po,p.bg);
    },function(){ if(cb) cb(fatto); });
    return;
  }
  if(cb) cb(fatto);
}
// in automatico, poco dopo la creazione di un prodotto: una volta per scheda, solo campi vuoti
// solo i prodotti creati da quando c'è questa funzione: le schede dei preventivi già fatti non cambiano da sole
PC.t0=(function(){ var k='ieci-pc-t0', v=0; try{ v=+localStorage.getItem(k)||0; if(!v){ v=Date.now()-60000; localStorage.setItem(k,String(v)); } }catch(e){ v=Date.now()-60000; } return v; })();
function pcNuovo(p){ var m=/^p([0-9a-z]{8})[0-9a-z]{0,4}$/.exec(String(p.id||'')), t=m?parseInt(m[1],36):0; return t>=PC.t0; }
function pcSoon(){ if(pcMode()==='man') return; clearTimeout(PC.t); PC.t=setTimeout(function(){ idle(pcScan); },2500); }
function pcScan(){
  if(pcMode()==='man'||PC.run) return;
  var demo=libDemo();
  S.products.forEach(function(p){ if(p.pc||!String(p.name||'').trim()||demo[lcn(p.name)]||!pcNuovo(p)) return; if(String(p.desc||'').trim()&&String(p.specs||'').trim()&&p.photos&&p.photos.length){ p.pc=1; return; } if(PC.q.indexOf(p)<0) PC.q.push(p); });
  pcLavora();
}
function pcLavora(){
  if(PC.run) return; var p=PC.q.shift(); if(!p) return; PC.run=true;
  pcCompleta(p,{}).then(function(R){
    p.pc=1; PC.run=false;
    if(S.products.indexOf(p)<0){ pcLavora(); return; }
    pcApplica(p,R,{desc:1,specs:1,img:R.fonte.img==='icecat'?1:0,logo:1},function(f){ if(f.length){ renderProducts(); touch(); } pcLavora(); });
  },function(){ p.pc=1; PC.run=false; pcLavora(); });
}
function pcBox(p,i){
  var r=PC.res[p.id], h='<div class="pcbox" data-pcb="'+i+'"><div class="row"><button type="button" class="btn ghost sm pcgo" data-pcgo="'+i+'">✨ Completa la scheda</button>'+(pcIAPossibile()?'<button type="button" class="btn ghost sm" data-pcia="'+i+'">Riscrivi con l\'IA sul telefono</button>':'')+'</div>';
  if(p.pcs&&(p.pcs.desc||p.pcs.img)) h+='<p class="hint pcnota">'+(p.pcs.desc?'Descrizione '+esc(PC_FONTE[p.pcs.desc]||'')+'. ':'')+(p.pcs.img?'Foto dalla scheda del produttore. ':'')+'Controlla e correggi se serve.</p>';
  if(r==='run') h+='<p class="hint">Cerco descrizione, caratteristiche e foto…</p>';
  else if(r&&r.desc!=null){
    h+='<div class="pcres">'+(r.desc?'<div class="pcit"><small>Descrizione · '+esc(PC_FONTE[r.fonte.desc]||'')+'</small><p>'+esc(r.desc)+'</p><button type="button" class="btn sm" data-pcuse="'+i+':desc">Usa</button></div>':'')+
      (r.specs?'<div class="pcit"><small>Caratteristiche · '+esc(PC_FONTE[r.fonte.specs]||'')+'</small><pre>'+esc(r.specs)+'</pre><button type="button" class="btn sm" data-pcuse="'+i+':specs">Usa</button></div>':'')+
      (r.img.length?'<div class="pcit"><small>Foto · scheda del produttore</small><div class="pcimg">'+r.img.map(function(u,k){ return '<button type="button" data-pcuse="'+i+':img:'+k+'" title="Aggiungi questa foto"><img src="'+esc(u)+'" alt="" referrerpolicy="no-referrer"></button>'; }).join('')+'</div></div>':'<p class="hint">Nessuna foto ufficiale trovata: usa «Trova foto» o aggiungine una tua.</p>')+
      (r.nota.length?'<p class="hint">'+esc(r.nota.join(' · '))+'</p>':'')+
      '<div class="row"><button type="button" class="btn sm" data-pcuse="'+i+':tutto">Usa tutto</button><button type="button" class="btn ghost sm" data-pcx="'+i+'">Chiudi</button></div></div>';
  }
  return h+'</div>';
}
(function(){
  var pl=$('plist'); if(!pl) return;
  pl.addEventListener('click',function(e){
    var b=e.target.closest('[data-pcgo],[data-pcia],[data-pcuse],[data-pcx]'); if(!b) return; e.preventDefault();
    var a=b.getAttribute('data-pcgo')||b.getAttribute('data-pcia')||b.getAttribute('data-pcx')||b.getAttribute('data-pcuse'), parti=String(a).split(':'), i=+parti[0], p=S.products[i]; if(!p) return;
    if(b.hasAttribute('data-pcx')){ delete PC.res[p.id]; renderProducts(); return; }
    if(b.hasAttribute('data-pcgo')||b.hasAttribute('data-pcia')){
      var ia=b.hasAttribute('data-pcia'); PC.res[p.id]='run'; renderProducts();
      var go=function(){ pcCompleta(p,{ia:ia}).then(function(R){ PC.res[p.id]=R; renderProducts(); if(!R.desc&&!R.specs&&!R.img.length) toast('Non trovo dati: aggiungi marca e codice esatti e riprova'); }); };
      if(ia&&!PC.ia&&!pcIAChrome()) pcIAPrepara(true).then(go,function(){ delete PC.res[p.id]; renderProducts(); }); else go();
      return;
    }
    var R=PC.res[p.id]; if(!R||R==='run') return; var w=parti[1];
    var campi=w==='tutto'?{desc:1,specs:1,img:R.img.length?1:0,logo:1,forza:1}:w==='img'?{img:1,imgK:+parti[2],forza:1}:(function(){ var c={forza:1}; c[w]=1; return c; })();
    pcApplica(p,R,campi,function(f){ if(w==='tutto') delete PC.res[p.id]; renderProducts(); touch(); toast(f.length?'Aggiunto alla scheda: '+f.join(', '):'Niente da aggiungere'); });
  });
  var sel=$('ap-pcomp'); if(sel){ sel.value=pcMode(); sel.addEventListener('change',function(e){ apSet('pcomp',e.target.value); toast(e.target.value==='man'?'Le schede si completano solo quando premi «Completa la scheda»':e.target.value==='ia'?'Le schede si completano da sole, con l\'IA sul telefono quando è pronta':'Le schede si completano da sole, senza IA'); if(e.target.value==='ia'&&!PC.ia) pcIAPrepara(true).catch(function(){}); if(e.target.value!=='man') pcSoon(); }); }
  var pia=$('ap-pcia'); if(pia){ pia.hidden=!pcIAPossibile(); pia.addEventListener('click',function(){ pcIAPrepara(true).then(function(){ toast('IA sul telefono pronta'); },function(){}); }); }
})();
(function(T){ if(!T) return; T.pcScrivi=pcScrivi; T.pcCompleta=pcCompleta; T.pcApplica=pcApplica; T.pcIAControlla=pcIAControlla; T.PC=function(){ return PC; }; })(window.IECI_T);
