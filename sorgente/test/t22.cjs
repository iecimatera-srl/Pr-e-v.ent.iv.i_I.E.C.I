const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:430,height:900}}); const pg=await ctx.newPage(); const errs=[];
pg.on('pageerror',e=>errs.push('PE '+e.message));
await pg.goto('http://localhost:8141/old.html'); await pg.waitForTimeout(2000);
await pg.click('#mn-btn'); await pg.click('.mit[data-p=prev]'); await pg.fill('#k-name','x').catch(()=>{}); await pg.waitForTimeout(1500);
await pg.goto('http://localhost:8141/preventivi-elettrici.html'); await pg.waitForTimeout(2500);
console.log(await pg.evaluate(()=>Array.from(document.querySelectorAll('.mit')).map(x=>x.dataset.p+':'+x.textContent.trim()).join(' | ')));
console.log(await pg.evaluate(()=>localStorage.getItem('ieci-menu')));
await pg.click('#mn-btn'); await pg.click('.mit[data-p=prev]').catch(e=>console.log('noprev',e.message.slice(0,80)));
console.log(await pg.evaluate(()=>{var p=document.querySelector('[data-panel=prev]');return p?getComputedStyle(p).display+' '+p.innerText.slice(0,60):'none'}));
console.log(errs); await b.close();})();
