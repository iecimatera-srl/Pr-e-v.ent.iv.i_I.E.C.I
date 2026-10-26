const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:412,height:860},acceptDownloads:true}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:8150/preventivi-elettrici-standalone.html'); await pg.waitForTimeout(2000);
const go=async x=>{await pg.click('#mn-btn'); await pg.click('.mit[data-p='+x+']'); await pg.waitForTimeout(200);};
const T=async(n,f)=>console.log(n,JSON.stringify(await pg.evaluate(f)));
await T('hdr',()=>document.querySelector('header.top h1').textContent+' | '+document.title);
await go('dati'); await pg.fill('#k-name','Luca Bianchi'); await pg.fill('[data-b="client.tel"]','333 1234567'); await pg.waitForTimeout(1800);
await pg.click('#qb-share'); await pg.waitForFunction(()=>!document.getElementById('sh-dl').disabled,null,{timeout:60000});
await T('sheet',()=>({st:document.getElementById('sh-st').textContent,doc:document.getElementById('sh-doc').textContent}));
const [dl]=await Promise.all([pg.waitForEvent('download'),pg.click('#sh-dl')]); console.log('file',dl.suggestedFilename()); await dl.saveAs(require('path').join(require('./_amb.cjs').TMP,'out.pdf'));
await T('status',()=>document.getElementById('qb-sub').textContent);
await pg.evaluate(()=>{ navigator.canShare=function(){return true}; navigator.share=function(d){ window.__sh=d.files[0].name+'|'+d.files[0].size+'|'+d.text.slice(0,30); return Promise.resolve(); }; });
await pg.click('#sh-wa'); await pg.waitForTimeout(300); await T('shared',()=>window.__sh);
await pg.click('#sh-x');
// filtro stato e chip
await go('prev'); await pg.click('#acc-save>summary').catch(()=>{}); await T('list',()=>document.getElementById('q-list').textContent.slice(0,120)+' || '+document.getElementById('q-filt').textContent);
// righe: riordina/duplica
await T('lines',()=>document.querySelectorAll('#lines .line').length);
await pg.click('#lines [data-ldup="0"]'); await T('dup',()=>document.querySelectorAll('#lines .line').length);
await pg.click('#lines [data-ldn="0"]'); await T('order',()=>document.querySelector('#lines .line:nth-child(2) .lnum').textContent);
console.log(errs); await b.close();})();
