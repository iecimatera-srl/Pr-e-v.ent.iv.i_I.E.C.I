const {chromium}=require('./_amb.cjs'); const fs=require('fs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const pg=await b.newPage({viewport:{width:1300,height:1500}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
fs.writeFileSync(require('path').join(require('./_amb.cjs').TMP,'imp.json'),JSON.stringify({fornitore:'Rexel',data:'2026-10-01',righe:[{codice:'ABC123',descrizione:'Magnetotermico 1P+N 16A',um:'pz',qta:5,prezzo_netto:10.8},{codice:'Q1',descrizione:'Quadro 12 moduli',um:'pz',prezzo_netto:30}]}));
fs.writeFileSync(require('path').join(require('./_amb.cjs').TMP,'imp2.json'),JSON.stringify({fornitore:'Rexel',data:'2026-10-11',righe:[{codice:'ABC123',descrizione:'Magnetotermico 1P+N 16A',um:'pz',qta:5,prezzo_netto:11.9}]}));
await pg.goto(require('./_amb.cjs').SRC); await pg.waitForTimeout(700);
await pg.click('#mn-btn');await pg.click('.mit[data-p=fornitori]');
await pg.setInputFiles('#im-file',require('path').join(require('./_amb.cjs').TMP,'imp.json')); await pg.click('#im-go'); await pg.waitForTimeout(500); await pg.click('#im-save'); await pg.waitForTimeout(500);
await pg.setInputFiles('#im-file',require('path').join(require('./_amb.cjs').TMP,'imp2.json')); await pg.fill('#im-sup','Rexel'); await pg.click('#im-go'); await pg.waitForTimeout(500);
console.log(await pg.$eval('#im-rows .chip',e=>e.textContent));
await pg.click('#im-save'); await pg.waitForTimeout(500);
console.log(await pg.textContent('#im-state'));
await pg.click('#art-list details >> nth=0 >> summary'); 
console.log(await pg.$eval('#art-list details[open] .pbody',e=>e.innerText.replace(/\s+/g,' ').slice(0,300)));
await pg.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'forn2.png'),fullPage:false});
console.log(errs); await b.close();})();
