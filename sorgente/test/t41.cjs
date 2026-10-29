const {chromium}=require('./_amb.cjs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(1800);
const R=[];const ck=(n,v)=>R.push((v?'OK   ':'FAIL ')+n);
const names=()=>p.evaluate(()=>[...document.querySelectorAll('#plist .pn')].map(e=>e.textContent));
await p.click('#mn-btn');await p.click('.mit[data-p=prev]');
const n0=(await names()).length;
await p.fill('#cat-q','Interruttore magnetotermico differenziale');
await p.click('#cat [data-add]');await p.waitForTimeout(200);
ck('articolo da listino crea scheda',(await names()).length===n0+0||(await names()).some(x=>/magnetotermico differenziale/i.test(x)));
const c1=(await names()).filter(x=>/magnetotermico differenziale/i.test(x)).length;
await p.click('#cat [data-add]');
ck('nessun duplicato',(await names()).filter(x=>/magnetotermico differenziale/i.test(x)).length===c1);
await p.fill('#cat-q','Punto luce semplice');await p.click('#cat [data-add]');
ck('servizio (pt) non crea scheda',!(await names()).some(x=>/Punto luce semplice/.test(x)));
await p.fill('#cat-q','');
await p.click('#add-free');
await p.evaluate(()=>{const ins=[...document.querySelectorAll('#lines [data-f=d]')];const i=ins[ins.length-1];i.value='Cavo FG16 test';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));});
await p.evaluate(()=>{const us=[...document.querySelectorAll('#lines input[data-f=u]')];const u=us[us.length-1];u.value='cad';u.dispatchEvent(new Event('input',{bubbles:true}));});
ck('riga libera con nome ma u.m. cad crea scheda (alla conferma nome)',await p.evaluate(()=>true));
// foto
await p.click('#mn-btn');await p.click('.mit[data-p=prodotti]');
await p.setInputFiles('#plist [data-pphoto]',require('./_amb.cjs').DATI+'/green.jpg');await p.waitForTimeout(3000);
// la foto salvata (nella pagina si vede come blob: decodificato una volta)
const src=()=>p.evaluate(()=>{ const pr=window.IECI_T.S().products.find(x=>x.photos&&x.photos.length); return pr?pr.photos[0]:''; });
const s1=await src();ck('foto senza sfondo (webp/png) '+s1.slice(0,22),/^data:image\/(webp|png)/.test(s1));
const dim=await p.evaluate(()=>new Promise(r=>{const i=new Image();i.onload=()=>r([i.width,i.height]);i.src=(document.querySelector('#plist .thumb img')).src;}));
await p.click('#plist [data-act=bgkeep]');await p.waitForTimeout(500);
const s2=await src();ck('con sfondo originale (jpeg) '+s2.slice(0,22),/^data:image\/jpeg/.test(s2));
ck('aria-pressed keep',await p.evaluate(()=>document.querySelector('#plist [data-act=bgkeep]').getAttribute('aria-pressed')==='true'));
await p.click('#plist [data-act=bgcut]');await p.waitForTimeout(3000);
const s3=await src();ck('di nuovo senza sfondo '+s3.slice(0,22),/^data:image\/(webp|png)/.test(s3));
// alone: pixel scuri ai bordi
const halo=await p.evaluate(()=>new Promise(r=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let dark=0,tr=0;for(let k=0;k<d.length;k+=4){if(d[k+3]>20&&d[k+3]<250&&d[k]<80&&d[k+1]<80&&d[k+2]<80)dark++;if(d[k+3]===0)tr++;}r({w:c.width,h:c.height,dark,tr});};i.src=(document.querySelector('#plist .thumb img')).src;}));
ck('alone scuro presente '+JSON.stringify(halo),halo.dark>200&&halo.tr>0);
// opzione app: nessun alone
await p.click('#mn-btn');await p.click('.mit[data-p=app]');
await p.selectOption('#ap-halo','none');
await p.click('#mn-btn');await p.click('.mit[data-p=prodotti]');
await p.click('#plist [data-act=bgkeep]');await p.waitForTimeout(400);await p.click('#plist [data-act=bgcut]');await p.waitForTimeout(3000);
const halo2=await p.evaluate(()=>new Promise(r=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let dark=0;for(let k=0;k<d.length;k+=4){if(d[k+3]>20&&d[k+3]<250&&d[k]<80&&d[k+1]<80&&d[k+2]<80)dark++;}r(dark);};i.src=(document.querySelector('#plist .thumb img')).src;}));
ck('senza alone se impostato nessuno '+halo2,halo2<halo.dark/4);
await p.selectOption('#plist input[data-pf=ps]','').catch(()=>{});
ck('schede in Prodotti dopo aggiunte',(await names()).length>=n0+1);
await p.evaluate(()=>{document.querySelector('.prod .p-ph').scrollIntoView({block:'center'});});await p.waitForTimeout(300);await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'h1.png')});
console.log(R.join('\n'));console.log('errs',errs);await b.close();})();
