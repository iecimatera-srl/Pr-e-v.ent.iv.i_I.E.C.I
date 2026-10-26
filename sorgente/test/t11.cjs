const {chromium}=require('./_amb.cjs'); const fs=require('fs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const pg=await b.newPage({viewport:{width:1300,height:1000}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
const png=await pg.evaluate(()=>{const c=document.createElement('canvas');c.width=400;c.height=300;const x=c.getContext('2d');x.fillStyle='#ddd';x.fillRect(0,0,400,300);x.fillStyle='#07c';x.fillRect(100,80,200,140);return c.toDataURL('image/png').split(',')[1];});
fs.writeFileSync(require('path').join(require('./_amb.cjs').TMP,'prev_fornitore.png'),Buffer.from(png,'base64'));
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
let calls=[];
await pg.route('https://api.anthropic.com/v1/messages',async r=>{
  if(r.request().method()==='OPTIONS') return r.fulfill({status:204,headers:cors});
  const body=JSON.parse(r.request().postData()); calls.push({hdr:r.request().headers()['x-api-key'],tools:!!body.tools,model:body.model});
  let text;
  if(body.tools){ const t=body.messages[0].content;
    text=/ABC123/.test(t)?JSON.stringify({trovato:true,confidenza:'alta',marca:'Marca X',nome:'Interruttore magnetotermico 1P+N 16A',descrizione:'Protegge da sovraccarichi e cortocircuiti.',caratteristiche:['Corrente nominale: 16 A','Poli: 1P+N'],immagini:['https://img.example.com/ok.png','https://img.example.com/rotta.png'],fonte:'https://www.costruttore.example/abc123',scheda_pdf:'https://www.costruttore.example/abc123.pdf'}):'{"trovato":false}';
  } else text='Ecco: ```json\n'+JSON.stringify({fornitore:'Rexel',data:'2026-10-08',righe:[{codice:'ABC123',descrizione:'Magnetotermico 1P+N 16A',marca:'Marca X',um:'pz',qta:10,prezzo_listino:20,sconto:'40+10',prezzo_netto:null,note:''},{codice:'ZZ9',descrizione:'Cavo FG16 3x1,5',marca:'',um:'m',qta:100,prezzo_listino:null,sconto:'',prezzo_netto:1.2,note:''}]})+'\n```';
  r.fulfill({status:200,headers:cors,contentType:'application/json',body:JSON.stringify({stop_reason:'end_turn',content:[{type:'text',text}]})});
});
await pg.route('https://img.example.com/ok.png',r=>r.fulfill({status:200,headers:cors,contentType:'image/png',body:Buffer.from(png,'base64')}));
await pg.route('https://img.example.com/rotta.png',r=>r.fulfill({status:404,body:'no'}));
await pg.goto(require('./_amb.cjs').SRC); await pg.waitForTimeout(700);
await pg.click('#mn-btn');await pg.click('.mit[data-p=fornitori]');
await require('./_amb.cjs').mostra(pg,'#ai-key'); await pg.check('#ai-use'); await pg.fill('#ai-key','sk-ant-test');
await pg.setInputFiles('#im-file',require('path').join(require('./_amb.cjs').TMP,'prev_fornitore.png'));
await require('./_amb.cjs').mostra(pg,'#im-go'); await pg.click('#im-go'); await pg.waitForTimeout(1200);
console.log('state:',await pg.textContent('#im-state'),'| sup:',await pg.inputValue('#im-sup'));
console.log('righe',await pg.$$eval('#im-rows .rowc',x=>x.map(e=>e.innerText.replace(/\s+/g,' ').slice(0,150))));
console.log('costo riga1',await pg.$eval('#im-rows [data-rf=cost]',e=>e.value));
await require('./_amb.cjs').mostra(pg,'#im-web'); await pg.click('#im-web'); await pg.waitForTimeout(2500);
console.log('state:',await pg.textContent('#im-state'));
console.log('thumbs',await pg.$$eval('#im-rows .enr .thumb',x=>x.length), await pg.$eval('#im-rows .enr',e=>e.innerText.replace(/\s+/g,' ').slice(0,200)));
await require('./_amb.cjs').mostra(pg,'#im-save'); await pg.click('#im-save'); await pg.waitForTimeout(1500);
console.log('state:',await pg.textContent('#im-state'));
console.log('arts',await pg.$$eval('#art-list details',x=>x.map(e=>e.querySelector('summary').innerText.replace(/\s+/g,' '))));
// add to quote
await require('./_amb.cjs').mostra(pg,'#art-list details >> nth=0 >> summary button'); await pg.click('#art-list details >> nth=0 >> summary button');
await pg.click('#mn-btn');await pg.click('.mit[data-p=prev]'); console.log('lines',await pg.$$eval('#lines .line',x=>x.length), await pg.$eval('#aq-list',e=>e.innerText.replace(/\s+/g,' ')));
await pg.click('#mn-btn');await pg.click('.mit[data-p=prodotti]'); console.log('prodotti',await pg.$$eval('#plist details .pn',x=>x.map(e=>e.textContent)));
console.log('photo embedded:',await pg.evaluate(()=>[...document.querySelectorAll('#doc .p-ph img')].map(i=>i.src.slice(0,22))));
console.log('calls',JSON.stringify(calls));
console.log(errs); await pg.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'forn.png')}); await b.close();})();
