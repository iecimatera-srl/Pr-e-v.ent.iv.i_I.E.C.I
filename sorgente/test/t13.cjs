const {chromium}=require('./_amb.cjs'); const fs=require('fs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const pg=await b.newPage({viewport:{width:1300,height:1500}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{ if(m.type()==='error') errs.push('C:'+m.text()); });
await pg.goto(require('./_amb.cjs').SA); await pg.waitForTimeout(900);
await pg.click('#mn-btn');await pg.click('.mit[data-p=fornitori]');
await pg.setInputFiles('#im-file',[''+require('./_amb.cjs').DATI+'/q1.pdf']); await pg.click('#im-go'); await pg.waitForTimeout(3500);
console.log(await pg.textContent('#im-state'));
console.log(await pg.$$eval('#im-rows .rowc',els=>els.map(e=>[...e.querySelectorAll('input[data-rf]')].map(i=>i.value).join(' | '))));
console.log('sup',await pg.inputValue('#im-sup'),await pg.inputValue('#im-date'));
// photo by link & paste text
await pg.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'forn3.png')});
await pg.click('#im-clear');
await pg.click('summary:has-text("Oppure incolla")'); await pg.fill('#im-paste','Codice\tDescrizione\tQta\tListino\tSconto\tNetto\nVP123\tPresa Vimar Plana bianca\t10\t5,40\t30\t3,78\nZZ9\tFrutto interruttore\t4\t7,00\t\t7,00');
await pg.click('#im-go'); await pg.waitForTimeout(500);
console.log(await pg.$$eval('#im-rows .rowc',els=>els.map(e=>[...e.querySelectorAll('input[data-rf]')].map(i=>i.value).join(' | '))));
// add image via file
fs.writeFileSync(require('path').join(require('./_amb.cjs').TMP,'p.png'),Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==','base64'));
await pg.click('#im-rows details >> nth=0 >> summary');
await pg.setInputFiles('#im-rows [data-rphoto="0"]',require('path').join(require('./_amb.cjs').TMP,'p.png')); await pg.waitForTimeout(500);
console.log('thumbs',await pg.$$eval('#im-rows .rowc:first-child .thumb',e=>e.length));
await pg.fill('#im-sup','TestForn'); await pg.click('#im-save'); await pg.waitForTimeout(800);
console.log(await pg.textContent('#im-state'));
console.log(errs); await b.close();})();
