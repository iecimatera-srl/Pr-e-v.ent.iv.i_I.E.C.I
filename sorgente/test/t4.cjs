const {chromium}=require('./_amb.cjs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const pg=await b.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(require('./_amb.cjs').SRC);
await pg.evaluate(()=>{localStorage.setItem('preventivi-elettrici-v2',JSON.stringify({model:'fv',company:{name:'IECI Impianti Elettrici',piva:'P.IVA 00000000000',addr:'x',tel:'y'},client:{name:'A',addr:'B'},meta:{title:'T',num:'1',date:'2026-01-01',val:30,iva:22,disc:0,dep:30},pay:'p',notes:'n',lines:[{d:'x',u:'cad',q:1,p:100,s:0}],cat:{},style:{b1:'#111111',b2:'#222222',font:'tec',cover:'band',logo:'',coverLogo:'white'},profile:{about:'Questo testo è un esempio: sostituiscilo con la storia',stats:'XX | a',slogan:'s',certs:'c',steps:'a|b',guar:'g',prodIntro:'i'},products:[],layout:['cover','azienda','prodotti','prev','cond'],custom:[],show:{cover:true}}));});
await pg.reload(); await pg.waitForTimeout(700);
console.log(await pg.$$eval('.page .sec',x=>x.map(e=>e.textContent)), await pg.$eval('#order-list',e=>e.innerText.replace(/\s+/g,' ')));
console.log(errs); await b.close();})();
