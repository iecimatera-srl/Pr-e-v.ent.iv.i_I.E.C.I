const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const pg=await (await b.newContext({viewport:{width:1100,height:900}})).newPage(); const errs=[];
pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:8143/preventivi-elettrici.html'); await pg.waitForTimeout(2000);
await pg.click('#mn-btn'); await pg.click('.mit[data-p=dati]');
for(const m of ['vid','aut']){ await pg.selectOption('#m-type',m); await pg.waitForTimeout(300);
 const el=await pg.$('.cover'); await el.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'c2_')+m+'.png'}); }
await pg.click('#mn-btn'); await pg.click('.mit[data-p=prev]');
console.log(await pg.evaluate(()=>Array.from(document.querySelectorAll('#tabs .tab')).map(t=>t.textContent).join(',')+' | cat:'+document.querySelectorAll('#cat .item, #cat > *').length));
console.log(errs); await b.close();})();
