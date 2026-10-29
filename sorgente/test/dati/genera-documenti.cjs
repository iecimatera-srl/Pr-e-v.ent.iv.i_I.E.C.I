// Crea i documenti di prova dei fornitori (PDF con foto dei prodotti). Uso: node test/dati/genera-documenti.cjs
const A=require('../_amb.cjs'), path=require('path'), fs=require('fs');
const OUT=path.join(__dirname,'documenti');
const css=`body{font:11px Arial,sans-serif;color:#222;margin:0}
.pg{padding:14mm 12mm;page-break-after:always;position:relative;min-height:265mm;box-sizing:border-box}
.hd{display:flex;gap:12px;align-items:center;border-bottom:2px solid #1b4d8f;padding-bottom:6px}
.hd img{width:120px;height:46px}.hd b{font-size:15px;color:#1b4d8f}
.to{margin:10px 0 0 auto;width:62mm;border:1px solid #999;padding:6px}
table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#1b4d8f;color:#fff;font-size:10px;padding:4px;text-align:left}
td{border-bottom:1px solid #ccc;padding:4px;vertical-align:middle}td.n{text-align:right;white-space:nowrap}td.im img{width:42px;height:42px;display:block}
.tot{margin:10px 0 0 auto;width:75mm}.tot div{display:flex;justify-content:space-between;padding:2px 0}
.ft{position:absolute;bottom:10mm;left:12mm;right:12mm;font-size:9px;color:#555;border-top:1px solid #ccc;padding-top:4px}`;
function head(){ return `<div class="hd"><img src="LOGO"><div><b>ELETTROFORNITURE LUCANE S.r.l.</b><br>Via dell'Artigianato 12 - 75100 Matera (MT)<br>P.IVA 01234567897 - Tel. 0835 334455 - Fax 0835 334456 - info@elettrolucane.it</div></div>`; }
function foot(n,t){ return `<div class="ft">Pagamento: bonifico 30 gg d.f. - IBAN IT60X0542811101000000123456 - Cap. soc. 50.000 € i.v. - REA MT-123456<br>Validità offerta 30 giorni. Pag. ${n} di ${t}</div>`; }
const R=[
 ['DS-2CD2143G2-I','#d32f2f','HIKVISION TELECAMERA DOME IP 4MP ACUSENSE OTTICA 2,8MM IR 30M POE','NR',4,'189,00','40','113,40','453,60'],
 ['DS-2CD2T46G2-4I','#2e7d32','HIKVISION TELECAMERA BULLET IP 4MP ACUSENSE 4MM IR 80M POE','NR',2,'235,00','40','141,00','282,00'],
 ['DS-7608NXI-K2/8P','#1565c0','HIKVISION NVR 8 CANALI 4K 8 PORTE POE 2 HDD','NR',1,'420,00','40','252,00','252,00'],
 ['WD43PURZ','#f9a825','WESTERN DIGITAL HARD DISK PURPLE 4TB SATA PER VIDEOSORVEGLIANZA','NR',1,'128,00','25','96,00','96,00'],
 ['UTP6-305','','CAVO UTP CAT.6 LSZH MATASSA 305 MT<br>colore grigio, guaina LSZH CPR Cca','NR',1,'165,00','30','115,50','115,50'],
 ['RJ45-C6','','CONNETTORE RJ45 CAT.6 SCHERMATO CONF. 100 PZ','CF',1,'38,00','30','26,60','26,60'],
 ['UPS-850','#6a1b9a',"GRUPPO DI CONTINUITA' UPS 850VA LINE INTERACTIVE",'NR',1,'145,00','20','116,00','116,00'],
 ['CART-TVCC','','CARTELLO AREA VIDEOSORVEGLIATA GDPR','NR',2,'6,50','','6,50','13,00']];
function tab(rows){ return `<table><tr><th>Codice</th><th>Foto</th><th>Descrizione</th><th>U.M.</th><th>Q.tà</th><th>Listino</th><th>Sc.%</th><th>Netto</th><th>Importo</th></tr>`+rows.map(r=>`<tr><td>${r[0]}</td><td class="im">${r[1]?`<img src="IMG:${r[1]}">`:''}</td><td>${r[2]}</td><td>${r[3]}</td><td class="n">${r[4]}</td><td class="n">${r[5]}</td><td class="n">${r[6]}</td><td class="n">${r[7]}</td><td class="n">${r[8]}</td></tr>`).join('')+`</table>`; }
const tvcc=`<div class="pg">${head()}<div class="to">Spett.le<br><b>IECI S.r.l.</b><br>Via dei Pesci 82/D<br>75100 Matera (MT)</div>
<p><b>OFFERTA N. 1543/2026 del 27/10/2026</b><br>Rif. cantiere: Bianchi Luca - Via Lucana 45, 75100 Matera - cell. 347 1122334</p>
<p>Come da Vostra gentile richiesta Vi sottoponiamo la nostra migliore offerta per il materiale sotto elencato.</p>${tab(R.slice(0,6))}<p style="text-align:right">A riportare 1.225,70</p>${foot(1,2)}</div>
<div class="pg">${head()}<p><b>OFFERTA N. 1543/2026 del 27/10/2026</b> - segue</p>${tab(R.slice(6))}
<div class="tot"><div><span>Totale merce</span><b>1.354,70</b></div><div><span>Spese di trasporto</span><b>15,00</b></div><div><span>Imponibile</span><b>1.369,70</b></div><div><span>IVA 22%</span><b>301,33</b></div><div><span>Totale documento €</span><b>1.671,03</b></div></div>
<p>Consegna: 5 giorni lavorativi dall'ordine. Resa: franco Vs. magazzino.</p>${foot(2,2)}</div>`;
const F=[['1','JAM54S30-430','MODULO FOTOVOLTAICO JA SOLAR 430W MONOCRISTALLINO FULL BLACK','14','PZ','98,50','1.379,00'],
 ['2','SUN2000-6KTL-M1','INVERTER TRIFASE HUAWEI SUN2000 6KTL-M1<br>con display e Wi-Fi integrato','1','PZ','1.190,00','1.190,00'],
 ['3','LUNA2000-5-S0','BATTERIA HUAWEI LUNA2000 5 KWH MODULO','2','PZ','2.050,00','4.100,00'],
 ['4','SDONGLE-A05','SMART DONGLE WLAN-FE HUAWEI','1','PZ','95,00','95,00'],
 ['5','H1Z2Z2-6','CAVO SOLARE H1Z2Z2-K 1X6MMQ ROSSO','100','MT','1,35','135,00'],
 ['6','MC4-KIT','CONNETTORI MC4 MASCHIO/FEMMINA (COPPIA)','10','PZ','2,40','24,00'],
 ['7','STR-K2','KIT STRUTTURA K2 TETTO A FALDA PER 14 MODULI','1','PZ','640,00','640,00']];
const fv=`<div class="pg"><div class="hd"><div><b>SOLARE SUD DISTRIBUZIONE S.p.A.</b><br>Zona Industriale La Martella - 75100 Matera (MT) - P.IVA 09876543217<br>tel 0835 998877 - ordini@solaresud.it - www.solaresud.it</div></div>
<div class="to">Spett.le IECI S.r.l.<br>Via dei Pesci 82/D - 75100 Matera</div>
<p>Preventivo n. P-2026-0981 del 26/10/2026</p>
<p>Destinazione merce: Az. Agricola Rossi Mario, C.da Pantano snc, 75015 Pisticci (MT)</p>
<table><tr><th>Pos.</th><th>Articolo</th><th>Descrizione</th><th>Q.tà</th><th>U.M.</th><th>Prezzo unit.</th><th>Importo</th></tr>${F.map(r=>`<tr>${r.map((c,i)=>`<td${i>2&&i!==4?' class="n"':''}>${c}</td>`).join('')}</tr>`).join('')}</table>
<div class="tot"><div><span>Totale imponibile</span><b>7.563,00</b></div><div><span>IVA 10%</span><b>756,30</b></div><div><span>Totale</span><b>8.319,30</b></div></div>
<p>Prezzi validi fino al 30/11/2026. Garanzia secondo le condizioni del costruttore.</p></div>`;
// gestionale: tabella fitta, righe da una linea, descrizioni che vanno a capo sotto, mittente e destinatario affiancati
const E=[['PL1','BTICINO','KM4001','INTERRUTTORE 1P 16A LIVING NOW BIANCO','PZ','20','4,10','82,00'],['PL2','BTICINO','KM4141','PRESA BIPASSO 2P+T 16A LIVING NOW BIANCA CON ALVEOLI PROTETTI','PZ','24','5,30','127,20'],['PL3','BTICINO','KA4803KW','PLACCA 3 MODULI LIVING NOW BIANCA','PZ','30','2,95','88,50'],['MG1','HAGER','MFN716','MAGNETOTERMICO 1P+N 16A 4,5KA C','PZ','8','11,20','89,60'],['DF1','HAGER','ADA240G','DIFFERENZIALE PURO 2P 40A 30MA TIPO A','PZ','2','46,00','92,00'],['CV1','','FS17-2,5-BL','CAVO FS17 450/750V 1X2,5 MMQ BLU','MT','200','0,39','78,00']];
const erp=`<div class="pg" style="font-size:8.5px"><table style="width:100%;margin:0;border:0"><tr><td style="border:0;width:50%;vertical-align:top"><b style="font-size:12px">ELETTRICA MURGIA SRL</b><br>Via Appia Antica 7<br>70022 Altamura (BA)<br>Tel 080 3141592<br>P.IVA 09876543217</td><td style="border:0;vertical-align:top">Spett.le<br><b>IECI S.R.L.</b><br>VIA DEI PESCI 82/D<br>75100 MATERA MT</td></tr></table>
<p>PREVENTIVO N. 2026/00777 DEL 28/10/2026 - Rif. cliente: Sig. Esposito Gennaro, Via Cererie 9, 75100 Matera, tel. 339 7654321, CF SPSGNR68D15F839S</p>
<table style="font-size:8.5px"><tr><th>Rif</th><th>Marca</th><th>Codice</th><th>Descrizione</th><th>UM</th><th>Qta</th><th>Prezzo</th><th>Importo</th></tr>${E.map(r=>`<tr>${r.map((c,i)=>`<td style="padding:1px 3px;border:0;vertical-align:top;${i===3?'width:200px':''}"${i>4?' class="n"':''}>${c}</td>`).join('')}</tr>`).join('')}</table>
<p style="text-align:right">TOTALE MERCE € 557,30<br>IVA 22% € 122,61<br>TOTALE DOCUMENTO € 679,91</p></div>`;
(async()=>{ fs.mkdirSync(OUT,{recursive:true}); const b=await A.chromium.launch(); const p=await b.newPage();
  for(const [nome,html] of [['fornitore-videosorveglianza.pdf',tvcc],['fornitore-fotovoltaico.pdf',fv],['fornitore-gestionale.pdf',erp]]){
    await p.setContent('<style>'+css+'</style>'+html);
    await p.evaluate(()=>{ const lg=document.createElement('canvas'); lg.width=240; lg.height=92; const x=lg.getContext('2d'); x.fillStyle='#1b4d8f'; x.fillRect(0,0,240,92); x.fillStyle='#ffd400'; x.font='bold 40px Arial'; x.fillText('ELU',60,62); const L=lg.toDataURL('image/png');
      document.querySelectorAll('img').forEach(im=>{ const s=im.getAttribute('src'); if(s==='LOGO') im.src=L; else if(s.startsWith('IMG:')){ const col=s.slice(4); const c=document.createElement('canvas'); c.width=160;c.height=160; const y=c.getContext('2d'); y.fillStyle=col; y.fillRect(0,0,160,160); y.fillStyle='#fff'; y.beginPath(); y.arc(80,80,38,0,7); y.fill(); im.src=c.toDataURL('image/png'); } }); });
    await p.waitForTimeout(200);
    await p.pdf({path:path.join(OUT,nome),format:'A4',printBackground:true});
    console.log('creato',nome);
  }
  // foto dei dati del cliente (documenti di prova, dati inventati): leggermente storte e sfocate come una foto vera
  const foto=[
   ['cliente-carta-identita.jpg',`<div style="width:860px;height:540px;border-radius:28px;background:linear-gradient(135deg,#e9eef3,#cfdbe6);padding:30px 36px;box-sizing:border-box;font-family:Arial;color:#1d2733;position:relative">
     <div style="font-size:22px;letter-spacing:2px">REPUBBLICA ITALIANA</div><div style="font-size:30px;font-weight:bold;margin-bottom:18px">CARTA DI IDENTITÀ <span style="font-size:16px;color:#b00">FAC-SIMILE DI PROVA</span></div>
     <div style="display:flex;gap:30px"><div style="width:190px;height:240px;background:#9aa9b8;border-radius:8px"></div><div style="font-size:21px;line-height:1.25">
     <div style="font-size:15px;color:#566">COGNOME / SURNAME</div><div style="font-size:28px;font-weight:bold">ESPOSITO</div>
     <div style="font-size:15px;color:#566;margin-top:8px">NOME / NAME</div><div style="font-size:28px;font-weight:bold">GENNARO</div>
     <div style="font-size:15px;color:#566;margin-top:8px">LUOGO E DATA DI NASCITA / PLACE AND DATE OF BIRTH</div><div>NAPOLI (NA) 15.04.1968</div>
     <div style="font-size:15px;color:#566;margin-top:8px">CODICE FISCALE / FISCAL CODE</div><div style="font-size:26px;font-weight:bold;letter-spacing:1px">SPSGNR68D15F839S</div>
     <div style="font-size:15px;color:#566;margin-top:8px">INDIRIZZO DI RESIDENZA / RESIDENCE</div><div>VIA CERERIE 9 MATERA (MT)</div></div></div></div>`],
   ['cliente-biglietto.jpg',`<div style="width:900px;height:500px;background:#fffdf7;padding:46px 56px;box-sizing:border-box;font-family:Georgia,serif;color:#2b2b2b;border-left:22px solid #7a5c3e">
     <div style="font-size:30px;letter-spacing:6px;color:#7a5c3e">STUDIO ROSSI</div><div style="font-size:44px;margin:26px 0 6px">Arch. Giulia Rossi</div><div style="font-size:24px;color:#555;margin-bottom:30px">progettazione e interni</div>
     <div style="font-size:26px;line-height:1.5;font-family:Arial">Corso Umberto I, 45 - 75100 Matera (MT)<br>Tel. 0835 123456 - Cell. 338 1234567<br>giulia@studiorossi.it<br>C.F. RSSGLI85M41F052O</div></div>`],
   ['cliente-messaggio.jpg',`<div style="width:720px;padding:30px;background:#efe7dd;font-family:Arial;box-sizing:border-box"><div style="background:#fff;border-radius:16px;padding:20px 24px;font-size:28px;line-height:1.4;color:#111;max-width:640px">
     Buongiorno, sono Anna Verdi. Vi lascio i miei dati per il preventivo: Via Dante 10, 75100 Matera. Cell. 347 1234567, email anna.verdi@gmail.com, codice fiscale VRDNNA80A41F052D.<div style="text-align:right;font-size:18px;color:#888">10:42</div></div></div>`]];
  // preventivo del fornitore fotografato con il telefono (stessa tabella del gestionale, un po' storto)
  await p.setViewportSize({width:1100,height:900}); await p.setContent('<style>'+css+'</style><body style="margin:0;background:#555;padding:30px"><div style="background:#fff;transform:rotate(0.8deg);filter:blur(0.35px);width:1000px;padding:10px">'+erp.replace('font-size:8.5px','font-size:15px').replace('font-size:8.5px','font-size:15px')+'</div></body>');
  await p.screenshot({path:path.join(OUT,'fornitore-foto.jpg'),type:'jpeg',quality:75}); console.log('creato fornitore-foto.jpg');
  for(const [nome,html] of foto){
    await p.setViewportSize({width:1000,height:700}); await p.setContent('<body style="margin:0;background:#6b6b6b;display:grid;place-items:center;height:700px"><div style="transform:rotate(-1.6deg);filter:blur(0.5px)">'+html+'</div></body>');
    await p.screenshot({path:path.join(OUT,nome),type:'jpeg',quality:72}); console.log('creato',nome);
  }
  await b.close(); })();
