// WhatsApp: il PDF parte con il messaggio; dato che WhatsApp spesso scarta il testo dei PDF, il messaggio è negli appunti
// e subito dopo un tocco lo manda nella chat del cliente già scritto
const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const MSG='Gentile Mario Rossi, il mio messaggio personale.';
async function prova(b,opt,share){
  const ctx=await b.newContext(Object.assign({viewport:{width:390,height:844},isMobile:true,hasTouch:true},opt));
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(share);
  await p.addInitScript(()=>{ window.__opened=[]; window.open=function(u){ window.__opened.push(u); return null; };
    const orig=document.execCommand.bind(document); document.execCommand=function(c){ if(c==='copy'){ const a=document.activeElement; window.__copied=a&&a.value; return true; } return orig.apply(document,arguments); }; });
  await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(1800);
  const S=(f,a)=>p.evaluate(f,a);
  await S(()=>{const s=window.IECI_T.S();s.client.tel='333 1234567';window.IECI_T.touch();});
  await S(()=>document.getElementById('qb-share').click());await p.waitForTimeout(300);
  await p.fill('#sh-txt',MSG);await p.dispatchEvent('#sh-txt','input');
  await p.waitForFunction(()=>!document.getElementById('sh-wa').disabled,null,{timeout:60000});
  const pulsanti=await S(()=>({prima:!document.getElementById('sh-dopo').hidden,hint:document.querySelector('#sh-bg .hint').textContent}));
  await S(()=>document.getElementById('sh-wa').click());await p.waitForTimeout(700);
  const r=await S(()=>({dopo:!document.getElementById('sh-dopo').hidden,wa2:document.getElementById('sh-wa2').getAttribute('href'),wa2t:document.getElementById('sh-wa2').textContent,dopoVis:(()=>{ const r=document.getElementById('sh-wa2').getBoundingClientRect(); return r.width>0&&r.right<=innerWidth+1; })(),text:window.__shared&&window.__shared.text,files:window.__shared&&window.__shared.files&&window.__shared.files.length,type:window.__shared&&window.__shared.files&&window.__shared.files[0].type,copied:window.__copied,opened:window.__opened,toast:document.getElementById('toast').textContent,status:window.IECI_T.S().meta.status}));
  await ctx.close(); return Object.assign(r,pulsanti,{errs});
}
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const condividi=()=>{ Object.defineProperty(navigator,'canShare',{value:()=>true,configurable:true}); Object.defineProperty(navigator,'share',{value:d=>{ window.__shared=d; return Promise.resolve(); },configurable:true}); };
// 1. Android: un tocco, PDF + messaggio insieme
let r=await prova(b,{},condividi); console.log(JSON.stringify(r));
ok(!r.prima,'prima dell\'invio il riquadro del messaggio non c\'è');
ok(r.files===1&&r.type==='application/pdf'&&r.text===MSG,'Android: il PDF parte con il messaggio (se WhatsApp lo accetta come didascalia)');
ok(r.copied===MSG&&r.opened.length===0,'il messaggio è già negli appunti, nessuna chat aperta da sola');
ok(r.dopo&&r.dopoVis&&decodeURIComponent(r.wa2)==='https://wa.me/393331234567?text='+MSG&&/Invia il messaggio a Mario Rossi/.test(r.wa2t),'dopo il PDF: «Invia il messaggio a Mario Rossi» apre la sua chat con il testo già scritto');
ok(/Invia il messaggio/.test(r.toast)&&r.status==='inviato','avviso chiaro e preventivo segnato come inviato');
ok(/Invia il messaggio/.test(r.hint)&&!/un solo tocco/i.test(r.hint),'la spiegazione dice come arriva il messaggio');
const E=[].concat(r.errs);
// 2. iPhone: Safari scarta il file se c'è anche il testo → si condivide il PDF e il messaggio è negli appunti
r=await prova(b,{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'},condividi); console.log(JSON.stringify(r));
ok(r.files===1&&r.text===undefined,'iPhone: il PDF parte sicuro (senza testo, che lì farebbe sparire il file)');
ok(r.copied===MSG&&/appunti/.test(r.toast)&&r.dopo,'iPhone: messaggio già negli appunti e pulsante per mandarlo nella chat');
E.push(...r.errs);
// 3. telefono che accetta solo il file: niente errore, PDF condiviso e messaggio copiato
r=await prova(b,{},()=>{ Object.defineProperty(navigator,'canShare',{value:d=>!d.text,configurable:true}); Object.defineProperty(navigator,'share',{value:d=>{ window.__shared=d; return Promise.resolve(); },configurable:true}); }); console.log(JSON.stringify(r));
ok(r.files===1&&r.text===undefined&&r.copied===MSG&&r.dopo,'se il telefono non accetta file+testo: PDF condiviso e messaggio copiato');
E.push(...r.errs);
// 4. computer senza condivisione: un tocco salva il PDF e apre la chat col messaggio
r=await prova(b,{isMobile:false,hasTouch:false,viewport:{width:1280,height:900},acceptDownloads:true},()=>{ Object.defineProperty(navigator,'canShare',{value:undefined,configurable:true}); }); console.log(JSON.stringify(r));
ok(!r.dopo&&r.opened.length===1&&decodeURIComponent(r.opened[0]).indexOf('https://wa.me/393331234567?text='+MSG)===0,'computer: chat del cliente aperta con il messaggio e PDF salvato, con lo stesso tocco');
E.push(...r.errs);
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(E));await b.close()})();
