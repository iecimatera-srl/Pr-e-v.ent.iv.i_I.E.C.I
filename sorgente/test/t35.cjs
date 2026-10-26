const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(n,c,x)=>{console.log((c?'OK  ':'FAIL')+' '+n+(x!==undefined?' '+JSON.stringify(x):''));if(!c)fail++;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1280,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(2000);
const go=async x=>{await p.click('#mn-btn');await p.click('.mit[data-p='+x+']');await p.waitForTimeout(250);};
// migrazione
const mg=await p.evaluate(()=>{const f=IECI_T.fresh();f.trust.brands=[{name:'x',img:'data:image/png;base64,AAAA'}];delete f.trust.bgroups;const n=IECI_T.normalize(JSON.parse(JSON.stringify(f)));return n.trust.bgroups.map(g=>g.t+':'+g.items.length).join('|')+' brands='+n.trust.brands.length;});
ok('migrazione marchi',mg.indexOf('Marchi che installiamo:1')===0,mg);
await go('fiducia');
await p.evaluate(()=>{const c=document.querySelector('[data-b="show.fiducia"]');if(!c.checked){c.checked=true;c.dispatchEvent(new Event('input',{bubbles:true}));}['trBrand','trRev'].forEach(k=>{const e=document.querySelector('[data-b="show.'+k+'"]');if(!e.checked){e.checked=true;e.dispatchEvent(new Event('input',{bubbles:true}));}});});
ok('3 righe default',(await p.$$('#tr-brand .bgx')).length===3);
const ins=await p.$$('#tr-brand input[data-bgf]');
await ins[0].setInputFiles([require('./_amb.cjs').DATI+'/b0.png',require('./_amb.cjs').DATI+'/b1.png',require('./_amb.cjs').DATI+'/b3.png']);await p.waitForTimeout(500);
const ins2=await p.$$('#tr-brand input[data-bgf]');await ins2[1].setInputFiles([require('./_amb.cjs').DATI+'/b2.png']);await p.waitForTimeout(500);
const ins3=await p.$$('#tr-brand input[data-bgf]');await ins3[2].setInputFiles([require('./_amb.cjs').DATI+'/b4.png',require('./_amb.cjs').DATI+'/b0.png']);await p.waitForTimeout(500);
await p.click('#bg-add');await p.waitForTimeout(200);
ok('riga aggiunta',(await p.$$('#tr-brand .bgx')).length===4);
await p.evaluate(()=>{const i=document.querySelectorAll('#tr-brand [data-bgt]');i[3].value='Industriale';i[3].dispatchEvent(new Event('input',{bubbles:true}));});
await p.evaluate(()=>document.querySelectorAll('#tr-brand [data-bgd]')[3].click());await p.waitForTimeout(200);
ok('riga eliminata',(await p.$$('#tr-brand .bgx')).length===3);
await p.evaluate(()=>document.querySelector('#tr-brand [data-bgm="0:1"]').click());await p.waitForTimeout(200);
// recensioni
await p.click('#rev-add');await p.waitForTimeout(200);
await p.fill('#tr-rev [data-tf="rev:0:name"]','Marco R.');await p.fill('#tr-rev [data-tf="rev:0:text"]','Lavoro preciso e pulito, consigliatissimi!');
await (await p.$('#tr-rev input[data-rvp]')).setInputFiles(require('./_amb.cjs').DATI+'/lavoro.jpg');await p.waitForTimeout(600);
await p.selectOption('#tr-rev [data-tf="rev:0:size"]','l');await p.waitForTimeout(400);
await p.click('#rev-add');await p.fill('#tr-rev [data-tf="rev:1:name"]','Giulia');await p.fill('#tr-rev [data-tf="rev:1:text"]','Tutto ok.');
await (await p.$$('#tr-rev input[data-rvp]'))[1].setInputFiles(require('./_amb.cjs').DATI+'/lavoro.jpg');await p.waitForTimeout(600);
await p.selectOption('#tr-rev [data-tf="rev:1:size"]','s');await p.waitForTimeout(500);
ok('rev img doc',(await p.$$('#doc .rev .rvimg')).length===2);
const pg=await p.$$('#doc .page');let idx=-1;for(let i=0;i<pg.length;i++){if(await pg[i].$('.bgs')){idx=i;}}
ok('pagina fiducia',idx>=0);if(idx>=0){await pg[idx].scrollIntoViewIfNeeded();await p.waitForTimeout(300);const bb=await pg[idx].boundingBox();console.log(JSON.stringify(bb));await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'fid.png'),clip:{x:Math.max(0,bb.x),y:Math.max(0,bb.y),width:Math.min(bb.width,1280-Math.max(0,bb.x)),height:Math.min(bb.height,900-Math.max(0,bb.y))}});}
// menu shortcut + temi
await p.click('#mn-btn');await p.keyboard.press('Escape');
await go('app');await p.click('#ap-themes [data-th="1"]');ok('tema notte',(await p.evaluate(()=>document.documentElement.getAttribute('data-theme')))==='dark');
await p.click('#ap-themes [data-th="0"]');
await p.click('#ap-gomenu');await p.waitForTimeout(200);ok('vai al menu',await p.evaluate(()=>!document.querySelector('[data-panel="menu"]').hidden));
// persistenza dopo reload
await p.reload();await p.waitForTimeout(2200);
await go('fiducia');ok('persist righe',(await p.$$('#tr-brand .bgx')).length===3&&(await p.$$('#tr-brand .thumb.logo')).length>=6);
console.log('ERR',errs,'FAIL',fail);await b.close();})();
