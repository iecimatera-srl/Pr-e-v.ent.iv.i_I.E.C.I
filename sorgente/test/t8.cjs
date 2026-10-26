const {chromium}=require('./_amb.cjs'); const fs=require('fs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const pg=await b.newPage({viewport:{width:1500,height:1200}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(require('./_amb.cjs').SRC); await pg.waitForTimeout(600);
const png=await pg.evaluate(()=>{const c=document.createElement('canvas');c.width=120;c.height=120;const x=c.getContext('2d');x.fillStyle='#25D366';x.fillRect(0,0,120,120);x.fillStyle='#fff';x.font='bold 70px Arial';x.fillText('T',40,85);return c.toDataURL('image/png').split(',')[1];});
fs.writeFileSync(require('path').join(require('./_amb.cjs').TMP,'ic.png'),Buffer.from(png,'base64'));
await pg.click('#mn-btn');await pg.click('.mit[data-p=fiducia]'); await pg.setInputFiles('[data-icf="fb"]',require('path').join(require('./_amb.cjs').TMP,'ic.png')); await pg.waitForTimeout(500);
console.log(await pg.$$eval('.cs',x=>x.map(a=>a.getAttribute('href')+' | '+a.innerText)));
await pg.evaluate(()=>{document.getElementById('paperWrap').scrollTop=0;});
const c=await pg.$('.cover'); await c.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'cover.png')});
console.log(errs); await b.close();})();
