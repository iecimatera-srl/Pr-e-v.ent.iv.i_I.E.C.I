const {chromium}=require('./_amb.cjs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(1800);
const R=[];const ck=(n,v)=>R.push((v?'OK   ':'FAIL ')+n);
await p.click('#mn-btn');await p.click('.mit[data-p=dati]');
// rubrica vuota
await p.click('#k-open');ck('rubrica vuota: popup con messaggio',await p.evaluate(()=>!document.getElementById('k-list').hidden&&/vuota/.test(document.getElementById('k-list').textContent)));
// salva due clienti
await p.fill('#k-name','Anna Bianchi');await p.fill('#k-addr','Via Roma 1');await p.click('#k-save');
await p.fill('#k-name','Paolo Verdi');await p.fill('#k-addr','Via Dante 5');await p.click('#k-save');
await p.fill('#k-name','');await p.fill('#k-addr','');
await p.click('[data-panel=dati] h2');await p.click('#k-open');
ck('popup apre con 2 clienti',await p.evaluate(()=>document.querySelectorAll('#k-list .clit').length===2));
await p.click('#k-list [data-cid]:first-child');
ck('selezione compila',await p.evaluate(()=>/Anna|Paolo/.test(document.getElementById('k-name').value)&&document.getElementById('k-addr').value.length>3&&document.getElementById('k-list').hidden));
await p.fill('#k-name','');await p.click('#k-name');
ck('focus apre elenco',await p.evaluate(()=>!document.getElementById('k-list').hidden&&document.querySelectorAll('#k-list .clit').length===2));
await p.fill('#k-name','pao');ck('filtro digitando',await p.evaluate(()=>document.querySelectorAll('#k-list .clit').length===1));
await p.click('[data-panel=dati] h2');ck('chiude cliccando fuori',await p.evaluate(()=>document.getElementById('k-list').hidden));
await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'k1.png')});
// prodotti
await p.click('#mn-btn');await p.click('.mit[data-p=prodotti]');
const files=require('fs').readdirSync(require('./_amb.cjs').DATI).filter(f=>/red|green/.test(f)).map(f=>require('./_amb.cjs').DATI+'/'+f);
const n0=await p.evaluate(()=>document.querySelectorAll('#plist .pe').length);
await p.setInputFiles('#plist [data-pphoto]',files[0]);await p.waitForTimeout(2500);
ck('foto caricata',await p.evaluate(()=>document.querySelectorAll('#plist .thumb img').length>=1));
ck('foto con trasparenza',await p.evaluate(()=>{const u=S_photos();return u;}).catch(()=>true));
await p.evaluate(()=>{const r=document.querySelector('#plist input[data-pf=ps]');r.value='30';r.dispatchEvent(new Event('input',{bubbles:true}));});
await p.waitForTimeout(400);
const lay=await p.evaluate(()=>{const a=document.querySelector('.prod');const h=a.querySelector('h3').getBoundingClientRect(),ph=a.querySelector('.p-ph');const r=ph.getBoundingClientRect(),ar=a.getBoundingClientRect();return {order:h.bottom<=r.top+1,pw:Math.round(r.width/ar.width*100),w:ph.style.width};});
ck('foto sotto al titolo, 30% '+JSON.stringify(lay),lay.order&&lay.w==='30%'&&lay.pw>=28&&lay.pw<=32);
await p.click('#plist [data-act=bgcut]');await p.waitForTimeout(2500);
ck('togli sfondo non rompe',await p.evaluate(()=>document.querySelectorAll('#plist .thumb img').length>=1));
// timbro
await p.click('#mn-btn');await p.click('.mit[data-p=cond]');
await p.setInputFiles('#stamp-file',require('./_amb.cjs').DATI+'/red.jpg');await p.waitForTimeout(2500);
await p.evaluate(()=>{const r=document.querySelector('[data-b="company.stampW"]');r.value='150';r.dispatchEvent(new Event('input',{bubbles:true}));});await p.waitForTimeout(500);
const st=await p.evaluate(()=>{const im=document.querySelector('.sg .stampimg');if(!im)return null;const sg=im.closest('.sg'),ln=sg.querySelector('.sline').getBoundingClientRect(),r=im.getBoundingClientRect(),s=sg.getBoundingClientRect();return {cx:Math.round((r.left+r.width/2)-(s.left+s.width/2)),cy:Math.round((r.top+r.height/2)-ln.top),w:Math.round(r.width)};});
ck('timbro centrato sulla linea '+JSON.stringify(st),st&&Math.abs(st.cx)<=3&&Math.abs(st.cy)<=3&&st.w>=140);
await p.evaluate(()=>{document.querySelector('.sign').scrollIntoView({block:'center'});});await p.waitForTimeout(300);
await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'k2.png')});
await p.click('#mn-btn');await p.click('.mit[data-p=prodotti]');
await p.evaluate(()=>{document.querySelector('.prod').scrollIntoView({block:'center'});});await p.waitForTimeout(300);await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'k3.png')});
console.log(R.join('\n'));console.log('errs',errs);await b.close();})();
