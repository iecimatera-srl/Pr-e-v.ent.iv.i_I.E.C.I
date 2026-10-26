const {chromium}=require('./_amb.cjs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const W of [360,768]){const p=await b.newPage({viewport:{width:W,height:900}});
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(1500);
await p.click('#mn-btn');await p.click('.mit[data-p=prev]');await p.click('#tabs [data-m=app]');await p.click('[data-rmact=kit]');
await p.evaluate(()=>document.querySelectorAll('details.acc').forEach(d=>d.open=true));await p.waitForTimeout(200);
const r=await p.evaluate(()=>{const sec=document.querySelector('[data-panel="prev"]');const sr=sec.getBoundingClientRect();const bad=[];sec.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();if(r.width>0&&(r.right>sr.right+2)&&getComputedStyle(e).position!=='absolute'&&!e.closest('.cat')&&bad.length<4)bad.push(e.tagName+'.'+e.className+' '+Math.round(r.right-sr.right));});return {page:document.documentElement.scrollWidth-innerWidth,bad};});
console.log(W,JSON.stringify(r));
if(W===360){await p.evaluate(()=>document.getElementById('acc-rooms').scrollIntoView());await p.screenshot({path:require('path').join(require('./_amb.cjs').TMP,'app3.png')});}
await p.close();}
await b.close();})();
