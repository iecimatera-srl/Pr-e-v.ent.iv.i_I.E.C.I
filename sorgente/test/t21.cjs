const {chromium}=require('./_amb.cjs');
const fs=require('fs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:1100,height:900}}); const pg=await ctx.newPage(); const errs=[];
pg.on('pageerror',e=>errs.push('PE '+e.message)); pg.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text())});
await pg.goto('http://localhost:8150/preventivi-elettrici.html'); await pg.waitForTimeout(2500);
const go=async(x)=>{await pg.click('#mn-btn'); await pg.click('.mit[data-p='+x+']'); await pg.waitForTimeout(200);};
const T=async(n,f)=>{try{console.log(n,JSON.stringify(await pg.evaluate(f)))}catch(e){console.log(n,'ERR',e.message)}};
await go('dati');
for(const m of ['dom','vid','all','fv','tv','ind','sw']){
  await pg.selectOption('#m-type',m); await pg.waitForTimeout(250);
  const n=await pg.evaluate(()=>{var c=document.querySelector('.cover .circuit'); return c?c.innerHTML.length:0});
  console.log('cover',m,n);
  await pg.evaluate(()=>{var c=document.querySelector('.cover'); if(c) c.scrollIntoView();});
  const el=await pg.$('.cover'); if(el) await el.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'cov_')+m+'.png'});
}
// slogan
await go('dati'); await pg.fill('[data-b="meta.slogan"]','Slogan di prova'); await pg.waitForTimeout(300);
await T('slogan',()=>document.querySelector('.cv-mid p').textContent);
// totale libero
await pg.evaluate(()=>{});
await go('prev');
await pg.selectOption('[data-b="econ.mode"]','totale'); await pg.waitForTimeout(200);
await pg.fill('[data-b="econ.total"]','1220'); await pg.waitForTimeout(400);
await T('tot',()=>Array.from(document.querySelectorAll('.tots div')).map(d=>d.textContent).join('|'));
await T('linesnoprice',()=>document.querySelectorAll('#lines [data-f=p]').length);
await pg.selectOption('[data-b="econ.vat"]','excl'); await pg.waitForTimeout(300);
await T('tot excl',()=>Array.from(document.querySelectorAll('.tots div')).map(d=>d.textContent).join('|'));
await pg.selectOption('[data-b="econ.mode"]','righe'); await pg.waitForTimeout(200);
await pg.fill('[data-b="econ.agreed"]','500'); await pg.waitForTimeout(400);
await T('agreed',()=>Array.from(document.querySelectorAll('.tots div')).map(d=>d.textContent).join('|'));
// timbro e lavori
await go('cond'); const png=require('path').join(require('./_amb.cjs').TMP,'stamp.png'); await pg.evaluate(()=>{}); 
require('fs').copyFileSync(require('path').join(require('./_amb.cjs').DATI,'stamp.png'),require('path').join(require('./_amb.cjs').TMP,'stamp.png'));
await pg.setInputFiles('#stamp-file',png); await go('fiducia'); await pg.setInputFiles('#wk-file',[png,png]); await pg.waitForTimeout(1200);
await T('stamp',()=>document.querySelectorAll('.stampimg').length+' works '+document.querySelectorAll('.works figure').length);
// nuovo preventivo
await go('dati'); await pg.fill('#k-name','Cliente Test'); await pg.waitForTimeout(2200);
await pg.click('#qb-new'); await pg.waitForTimeout(800);
await T('new',()=>JSON.stringify({lines:document.querySelectorAll('#lines .line').length,client:document.getElementById('k-name').value,prods:document.querySelectorAll('#plist .pe').length,stamp:document.querySelectorAll('.stampimg').length,works:document.querySelectorAll('.works figure').length,econ:document.querySelector('[data-b="econ.mode"]').value}));
await go('prev');
await T('arch',()=>document.getElementById('q-list').textContent);
await T('fname',()=>fileBase());
console.log(errs); await b.close();})();
