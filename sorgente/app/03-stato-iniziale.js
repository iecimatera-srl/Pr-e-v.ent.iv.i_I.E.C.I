var LOGO0_OLD_LEN = 104519;
// il logo predefinito (700 KB) sta in un blocco di solo testo, non dentro il codice: l'app si apre più leggera
var LOGO0 = (function(){ var e=document.getElementById('logo0-dati'); return e?String(e.textContent||'').trim():''; })();
var KEY = 'preventivi-elettrici-v2', KEY1 = 'preventivi-elettrici-v1';
var FONTS = {
  tec:{fd:"'Barlow Condensed','Arial Narrow',sans-serif",fb:"'Barlow',Arial,sans-serif",tt:'uppercase',fs:'italic'},
  mod:{fd:"'Manrope',Arial,sans-serif",fb:"'Manrope',Arial,sans-serif",tt:'none',fs:'normal'},
  cla:{fd:"'Playfair Display',Georgia,serif",fb:"'Source Sans 3',Arial,sans-serif",tt:'none',fs:'normal'}
};

function today(){ return new Date().toISOString().slice(0,10); }
function copy(o){ return JSON.parse(JSON.stringify(o)); }
function defaultCat(){ var c={}; ORDER.forEach(function(k){ c[k]=copy(MODELS[k].items); }); return c; }
function payText(dep){ return 'Acconto del '+dep+'% all\'ordine, saldo a fine lavori. Bonifico bancario.'; }
function uid(){ return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function defaultCompany(){
  return {name:'IECI S.r.l.',piva:'P.IVA IT01296710773',addr:'Via dei Pesci 82/D, 75100 Matera (MT)',tel:'Tel. +39 392 762 2111',
    email:'info@iecisrlmatera.it',web:'iecisrlmatera.it',wa:'393927622111',wa2:'393890340920',
    fb:'https://www.facebook.com/IECIsrlmatera',ig:'https://www.instagram.com/ieci.srl.matera/',icons:{},stampW:90};
}
function defaultProfile(){
  return {
    slogan:'Energia che accende il tuo spazio.',
    about:'Dal 2004 progettiamo e realizziamo impianti elettrici civili e industriali, sistemi di sicurezza e videosorveglianza, impianti fotovoltaici con accumulo, domotica, reti dati e impianti TV.\n\nOgni lavoro parte da un sopralluogo, prosegue con un progetto chiaro e si conclude con collaudo, certificazioni e assistenza.',
    stats:'20+ | anni di attività\n1.200+ | impianti realizzati\n15+ | professionisti nel team\n2004 | anno di fondazione',
    certs:'Impianti certificati secondo le normative CEI vigenti\nCollaudo e certificazioni a norma con documentazione completa',
    steps:'Sopralluogo | Verifichiamo gli ambienti e ascoltiamo le tue esigenze.\nProgetto e preventivo | Definiamo soluzioni, materiali e costi in modo chiaro.\nInstallazione | Posa a regola d\'arte con personale qualificato.\nCollaudo | Prove, verifiche e consegna della documentazione.\nAssistenza | Supporto dopo la consegna e manutenzione programmata.',
    guar:'Garanzia legale sui lavori eseguiti\nGaranzia del costruttore sui prodotti installati\nDichiarazione di Conformità e documentazione tecnica a fine lavori\nAssistenza dopo l\'installazione',
    prodIntro:'I materiali che installeremo sono scelti per sicurezza, durata e facilità di assistenza. Per ogni prodotto trovi le caratteristiche principali e il collegamento alla scheda tecnica del produttore.'
  };
}
function defaultProducts(){
  return [
    {id:uid(),name:'Interruttore magnetotermico differenziale 1P+N',brand:'Marca esempio',code:'Modello XX-16-30',
     desc:'Protegge l\'impianto da sovraccarichi, cortocircuiti e dispersioni verso terra in un unico dispositivo compatto.',
     specs:'Corrente nominale: 16 A\nPotere di interruzione: 6 kA\nSensibilità differenziale: 30 mA, tipo A\nLarghezza: 2 moduli DIN\nNorma: CEI EN 61009-1',
     link:'',tags:'CE, Tipo A',photos:[]},
    {id:uid(),name:'Serie civile con placche in tecnopolimero',brand:'Marca esempio',code:'Serie XX',
     desc:'Prese e interruttori con finitura resistente, scelta di colori e supporti per ogni ambiente.',
     specs:'Tensione: 250 V~\nCorrente: 10/16 A\nGrado di protezione: IP20\nFinitura: opaca antigraffio',
     link:'',tags:'CE',photos:[]}
  ];
}
function fresh(){
  return {
    model:'dom',
    rooms:[],curRoom:'',cgroups:{},cond:{n:6,kind:'video',show:true,tc:'',tv:'',cur:0,sys:[],sol:{cit:{n:'',logo:''},video:{n:'',logo:''}},vm:{show:true,video:{b:'',o:[]},cit:{b:'',o:[]}}},
    company:defaultCompany(),
    client:{name:'Mario Rossi',addr:'Via Verdi 12, appartamento 3',tel:'',email:'',cf:''},
    meta:{title:'Rifacimento impianto appartamento',num:'2026/001',date:today(),val:30,iva:22,disc:0,dep:30,slogan:'',status:'bozza'},
    econ:{mode:'righe',total:'',vat:'incl',label:'',breakdown:true,note:'',agreed:''},
    pay:payText(30), notes:MODELS.dom.notes, ccond:{}, cmp:{on:false,cur:0,sys:[]}, mtpl:mtFactory(), mdef:'m0',
    lines:[
      {d:'Punto luce semplice',u:'pt',q:8,p:45,s:0},
      {d:'Punto presa 10/16 A',u:'pt',q:12,p:42,s:0},
      {d:'Quadro elettrico appartamento, fino a 12 moduli',u:'cad',q:1,p:380,s:0},
      {d:'Dichiarazione di conformità (DM 37/08)',u:'a corpo',q:1,p:120,s:0}
    ],
    cat:defaultCat(),
    style:{wmOn:true,wmMode:'tile',wmOp:9,wmSize:135,wmRot:-15,b1:'#2F65AE',b2:'#8793A3',font:'tec',cover:'band',order:'A',showAzienda:true,showProdotti:true,logo:LOGO0,coverLogo:'white',prodLayout:'flow',attachPdf:true},
    profile:defaultProfile(),
    products:defaultProducts(),
    layout:BASE_IDS.slice(),
    tiers:{on:false,n:3,names:['Base','Comfort','Premium'],rec:1,sel:-1},
    sign:{cli:{img:'',name:'',place:'',date:''},dit:{img:'',name:''}},
    plan:{img:'',w:0,h:0,marks:[]},
    fv:{kwp:6,yield:1400,auto:40,price:0.28,sell:0.09,cost:0,detr:0,deg:0.5,years:20},
    crono:{start:today(),bd:true,phases:'Sopralluogo e predisposizioni | 1\nPosa tubazioni e cavi | 3\nInstallazione apparecchiature | 2\nCollaudo e consegna | 1',note:'I tempi sono indicativi e dipendono dalla disponibilità del cantiere e dei materiali.'},
    trust:{ba:[],rev:[],works:[],brands:[],bgroups:[{id:'bg1',t:'Domotica',items:[]},{id:'bg2',t:'Videosorveglianza',items:[]},{id:'bg3',t:'Civile',items:[]}],qr:{wa:true,wa2:false,web:true,fb:true,ig:true,mail:false},qrTitle:'Contattaci'},
    docs:{conferma:{inizio:'',fine:'',accRic:0,note:''},lavoro:{data:'',squadra:'',mezzi:'',sicurezza:'',note:''},collaudo:{data:'',tecnico:'',list:'',note:''}},
    msgs:{tpl:'m0',wa:MSGT[0].wa,subj:MSGT[0].subj,body:MSGT[0].body},
    custom:[],
    show:{cover:true,cvSocial:true,cvRef:true,cvKicker:true,cvSlogan:true,cvCable:true,cvClient:true,cvValid:true,cvCompany:true,
      prodIntro:true,azSlogan:true,azAbout:true,azStats:true,azSteps:true,azCerts:true,azGuar:true,
      prev:true,pvStrip:true,pvAcc:true,pvOpt:true,pvBrand:true,cond:true,cdPay:true,cdNotes:true,cdSign:true,cdChoice:true,pgHead:true,pgFoot:true,
      fiducia:true,trBA:true,trWorks:true,trRev:true,trBrand:true,trQR:true,planimetria:false,fv:false,crono:false,conferma:false,lavoro:false,collaudo:false}
  };
}
