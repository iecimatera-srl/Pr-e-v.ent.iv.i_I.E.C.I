const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SRC);await p.waitForTimeout(1500);
const titles=()=>p.evaluate(()=>window.IECI_T.S().trust.bgroups.map(g=>g.t+':'+g.items.length).join(','));
const setT=(arr)=>p.evaluate(([png,arr])=>{const S=window.IECI_T.S();S.trust.bgroups=arr.map((a,i)=>({id:'g'+i,t:a[0],items:Array.from({length:a[1]},(_,k)=>({name:'m'+k,img:png}))}));window.IECI_T.touch();},[PNG,arr]);
const setName=(n)=>p.evaluate((n)=>{window.IECI_T.S().client.name=n;window.IECI_T.touch();},n);
const open=(n)=>p.evaluate((n)=>{const b=[...document.querySelectorAll('#q-list [data-qo]')].find(x=>x.closest('.rowc,.qrow,div').textContent.includes(n));b.click();},n);
// vecchio preventivo con disposizione vecchia
await setT([['Domotica',1]]);await setName('Vecchio');await p.click('#qb-save');await p.waitForTimeout(500);
await p.click('#qb-new');await p.waitForTimeout(500);
// Via Agri: disposizione voluta
await setT([['Sicurezza',6],['Civile',3],['Fotovoltaico',5],['Automazioni',5]]);await setName('Via Agri 10');await p.click('#qb-save');await p.waitForTimeout(500);
// riapro il vecchio: la disposizione attuale non cambia
await open('Vecchio');await p.waitForTimeout(700);
const t1=await titles();console.log(t1);ok(t1==='Sicurezza:6,Civile:3,Fotovoltaico:5,Automazioni:5','aprendo il vecchio: disposizione di Via Agri');
// simulo di essere rimasto con la vecchia disposizione
await setT([['Domotica',1]]);await p.waitForTimeout(300);
await p.click('#qb-new');await p.waitForTimeout(500);
ok((await titles())==='Domotica:1','(il nuovo preventivo eredita quella attuale)');
// scelgo di usare i loghi di Via Agri
await p.evaluate(()=>document.getElementById('bg-from').click());await p.waitForTimeout(500);
await p.evaluate(()=>{const b=[...document.querySelectorAll('#rc-list [data-rcb]')].find(x=>x.parentElement.textContent.includes('Via Agri'));b.click();});await p.waitForTimeout(1200);
console.log(await p.evaluate(()=>document.getElementById('rc-list').innerText.replace(/\n+/g,' | ')));ok((await titles())==='Sicurezza:6,Civile:3,Fotovoltaico:5,Automazioni:5','«Usa i loghi di un altro preventivo»: Via Agri diventa la disposizione di tutti');
await p.click('#qb-new');await p.waitForTimeout(500);ok((await titles()).startsWith('Sicurezza:6'),'nuovo preventivo: disposizione corretta');
await open('Vecchio');await p.waitForTimeout(700);ok((await titles()).startsWith('Sicurezza:6'),'vecchio preventivo: disposizione corretta');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
