const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const pg=await b.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>errs.push(m.type()+':'+m.text().slice(0,200)));
await pg.goto(require('./_amb.cjs').SRC); await pg.waitForTimeout(900);
await pg.click('#mn-btn');await pg.click('.mit[data-p=fornitori]');
await pg.setInputFiles('#im-file',[''+require('./_amb.cjs').DATI+'/q1.pdf']); await pg.waitForTimeout(300);
console.log('files:',await pg.textContent('#im-files'));
await pg.click('#im-go'); await pg.waitForTimeout(4000);
console.log('state:',await pg.textContent('#im-state'), await pg.$eval('#im-state',e=>e.hidden));
console.log(errs); await b.close();})();
