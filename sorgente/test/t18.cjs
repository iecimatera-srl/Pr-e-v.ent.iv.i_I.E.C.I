const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const ctx=await b.newContext({viewport:{width:430,height:1000},colorScheme:'dark'}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(require('./_amb.cjs').SRC); await pg.waitForTimeout(900);
await pg.click('#mn-btn'); await pg.click('.mit[data-p=menu]');
await pg.fill('[data-nm=prev]','Prezzi e voci'); await pg.fill('[data-nm=fornitori]','Listini fornitori');
console.log('h2 menu panel ok; nav:', await pg.textContent('#mn-btn'));
// frecce: sposta "Archivio" giu' oltre il gruppo
await pg.click('.mnrow[data-p=fornitori] [data-mm$=":1"]'); 
console.log('gruppo di fornitori:', await pg.$eval('.mnrow[data-p=fornitori]',e=>e.closest('.mgc2').querySelector('.gn').value));
await pg.click('.mnrow[data-p=fornitori] [data-mm$=":-1"]');
// drag: trascina "Invio" sopra "Dati"
const h=await pg.$('.mnrow[data-p=invio] .dh'); const hb=await h.boundingBox(); const t=await (await pg.$('.mnrow[data-p=dati]')).boundingBox();
await pg.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2); await pg.mouse.down(); await pg.mouse.move(hb.x+10,t.y+2,{steps:12}); await pg.mouse.up(); await pg.waitForTimeout(200);
console.log('ordine primo gruppo:',await pg.$$eval('.mgc2:first-child .mnrow',e=>e.map(x=>x.getAttribute('data-p')).join(',')));
await pg.uncheck('[data-mv=piante]');
await pg.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'e1.png'),fullPage:false});
await pg.click('#mn-btn'); console.log(await pg.$$eval('#mn-drop .mit',e=>e.map(x=>x.textContent).join(',')));
await pg.reload(); await pg.waitForTimeout(700); await pg.click('#mn-btn'); console.log('dopo reload:',await pg.$$eval('#mn-drop .mit',e=>e.map(x=>x.textContent).slice(0,5).join(',')));
await pg.click('.mit[data-p=fornitori]'); console.log('h2:',await pg.textContent('[data-panel=fornitori] h2'));
await pg.click('#mn-btn'); await pg.click('.mit[data-p=menu]'); await pg.click('[data-preset=ess]'); await pg.click('#mn-btn'); console.log('essenziale:',await pg.$$eval('#mn-drop .mit',e=>e.map(x=>x.textContent).join(',')));
console.log(errs); await b.close();})();
