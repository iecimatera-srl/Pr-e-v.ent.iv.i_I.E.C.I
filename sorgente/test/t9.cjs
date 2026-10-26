const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ca=await b.newContext({acceptDownloads:true}), A=await ca.newPage(); const errs=[]; A.on('pageerror',e=>errs.push(e.message));
await A.goto(require('./_amb.cjs').SA); await A.waitForTimeout(600);
await A.click('#mn-btn');await A.click('.mit[data-p=dati]'); await require('./_amb.cjs').mostra(A,'#k-name'); await A.fill('#k-name','Verdi Anna'); await require('./_amb.cjs').mostra(A,'#m-title'); await A.fill('#m-title','Prova trasferimento'); await require('./_amb.cjs').mostra(A,'#c-addr'); await A.fill('#c-addr','Indirizzo modificato 9');
await A.click('#mn-btn');await A.click('.mit[data-p=archivio]'); await A.waitForTimeout(300);
console.log('banner prima:',await A.$eval('#bk-banner',e=>!e.hidden), await A.textContent('#bk-state'));
await require('./_amb.cjs').mostra(A,'#q-save'); await A.click('#q-save'); await A.waitForTimeout(400);
console.log('banner dopo salvataggio:',await A.$eval('#bk-banner',e=>!e.hidden)+' | '+await A.textContent('#bk-msg'));
await require('./_amb.cjs').mostra(A,'#db-exp'); const [d]=await Promise.all([A.waitForEvent('download'),A.click('#db-exp')]); await d.saveAs(require('path').join(require('./_amb.cjs').TMP,'bk.json')); await A.waitForTimeout(300);
console.log('file',d.suggestedFilename(),'| banner:',await A.$eval('#bk-banner',e=>!e.hidden),'|',await A.textContent('#bk-state'));
// nuovo dispositivo
const cb=await b.newContext(), B=await cb.newPage(); B.on('pageerror',e=>errs.push(e.message));
await B.goto(require('./_amb.cjs').SA); await B.waitForTimeout(600);
await B.click('#mn-btn');await B.click('.mit[data-p=archivio]'); await require('./_amb.cjs').mostra(B,'input[name=imp-mode][value=replace]'); await B.check('input[name=imp-mode][value=replace]'); await B.setInputFiles('#db-imp',require('path').join(require('./_amb.cjs').TMP,'bk.json')); await B.waitForTimeout(900);
console.log('B q:',await B.$eval('#q-list',e=>e.innerText.replace(/\s+/g,' ')));
console.log('B c:',await B.$eval('#c-list',e=>e.innerText.replace(/\s+/g,' ')));
await B.click('#mn-btn');await B.click('.mit[data-p=dati]'); console.log('B ditta:',await B.inputValue('#c-addr'),'| titolo:',await B.inputValue('#m-title'));
console.log(errs); await b.close();})();
