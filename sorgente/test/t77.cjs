// Telefono: i riquadri delle marche si scrivono senza perdere il campo (proposte a confronto, righe, schede), suggerimenti toccabili
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SRC);await p.waitForTimeout(1500);
const S=(f,a)=>p.evaluate(f,a);
for(const testo of ['Appartamento 80 mq, Bticino oppure Vimar a confronto','Videocitofono 8 condomini, Bticino oppure Comelit a confronto']){
  const vc=/Videocitofono/.test(testo);
  await A.mostra(p,'#as-txt'); await p.fill('#as-txt',testo); await p.click('#as-go'); await p.waitForTimeout(300); await p.click('#as-ok'); await p.waitForTimeout(1200);
  const scrivi=async(sel,txt)=>{ await A.mostra(p,sel); await p.locator(sel).scrollIntoViewIfNeeded(); await p.tap(sel); await p.waitForTimeout(250); await p.keyboard.press('Control+A'); await p.keyboard.type(txt,{delay:40}); await p.waitForTimeout(250);
    return S(sel=>{ const el=document.querySelector(sel); return {v:el&&el.value,a:document.activeElement===el}; },sel); };
  const tag=vc?'videocitofono':'appartamento';
  let r=await scrivi('[data-syf="b:0"]','Gewiss'); ok(r.v==='Gewiss'&&r.a,tag+': marca della proposta A');
  r=await scrivi('[data-syf="n:0"]','Proposta economica'); ok(r.v==='Proposta economica'&&r.a,tag+': dalla marca al nome, il campo toccato resta attivo');
  r=await scrivi('[data-syf="b:1"]','Hager'); ok(r.v==='Hager'&&r.a,tag+': marca della proposta B');
  await p.keyboard.press('Tab'); await p.waitForTimeout(300);
  ok(await S(vc=>{ const s=window.IECI_T.S(), L=(vc?s.cond:s.cmp).sys; return L[0].b==='Gewiss'&&L[0].n==='Proposta economica'&&L[1].b==='Hager'; },vc),tag+': salvate marca e nome');
  const sel='#lines .line[data-i="0"] [data-f="br"]';
  ok(await S(sel=>document.querySelector(sel).getBoundingClientRect().width>=180,sel),tag+': campo marca della riga largo abbastanza');
  r=await scrivi(sel,'Siemens'); ok(r.v==='Siemens'&&r.a&&await S(()=>window.IECI_T.S().lines[0].br==='Siemens'),tag+': marca scritta nella riga');
}
// suggerimenti: niente elenco nativo, chip da toccare che non chiudono la tastiera
const sel='#lines .line[data-i="0"] [data-f="br"]';
ok(await S(()=>!document.querySelector('[data-panel="prev"] [list], [data-brsug][list]')),'nessun elenco nativo del browser sui campi marca (copriva la tastiera)');
await p.tap(sel); await p.keyboard.press('Control+A'); await p.keyboard.type('Urm',{delay:60}); await p.waitForTimeout(250);
ok(await S(()=>!!document.querySelector('#br-sug [data-brs="Urmet"]')),'scrivendo «Urm» compare «Urmet»');
await p.tap('#br-sug [data-brs="Urmet"]'); await p.waitForTimeout(300);
ok(await S(sel=>document.querySelector(sel).value==='Urmet'&&window.IECI_T.S().lines[0].br==='Urmet'&&!document.getElementById('br-sug'),sel),'un tocco sul suggerimento: marca inserita');
// campi a 16px sui telefoni (niente zoom automatico di iPhone)
ok(await S(sel=>parseFloat(getComputedStyle(document.querySelector(sel)).fontSize)>=16&&parseFloat(getComputedStyle(document.querySelector('[data-syf="n:0"]')).fontSize)>=16,sel),'campi a 16px: il telefono non ingrandisce la pagina');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
