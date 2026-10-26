const {chromium}=require('./_amb.cjs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const W of [360,768,1280]){
const p=await b.newPage({viewport:{width:W,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(1800);
const out=[];
for(const pn of ['dati','prev','contenuto','pagine','prodotti','piante','stime','fiducia','cond','documenti','invio','messaggi','archivio','listini','salva','fornitori','azienda','stile','app','menu']){
 await p.click('#mn-btn');await p.click('.mit[data-p='+pn+']');await p.waitForTimeout(150);
 await p.evaluate(()=>document.querySelectorAll('details.acc').forEach(d=>d.open=true));
 const r=await p.evaluate(pn=>{const sec=document.querySelector('[data-panel="'+pn+'"]');const sr=sec.getBoundingClientRect();const bad=[];sec.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();if(r.width>0&&(r.right>sr.right+2||r.left<sr.left-2)&&getComputedStyle(e).position!=='absolute'&&!e.closest('.thumbs,.cat,.lines')&&bad.length<3)bad.push(e.tagName+'.'+e.className+'#'+e.id+' '+Math.round(r.right-sr.right));});return {pn,page:document.documentElement.scrollWidth-innerWidth,bad};},pn);
 if(r.page>2||r.bad.length)out.push(r);
}
await p.click('#mn-btn');const dd=await p.evaluate(()=>{const names=[...document.querySelectorAll('.mdrop .mit')].map(b=>b.textContent.trim());const dup=names.filter((n,i)=>names.indexOf(n)!==i);return {n:names.length,dup};});
console.log(W,JSON.stringify(dd),JSON.stringify(out),errs);await p.close();}
await b.close();})();
