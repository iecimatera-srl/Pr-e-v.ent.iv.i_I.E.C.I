const {chromium}=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const fs=require('fs');const PNG=Buffer.from(fs.readFileSync(require('path').join(__dirname,'t65.cjs'),'utf8').match(/Buffer.from\('([^']+)'/)[1],'base64');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(require('./_amb.cjs').SRC);await p.waitForTimeout(1500);
const S=(f,a)=>p.evaluate(f,a);
const set=async(sel,v)=>{await p.fill(sel,v);await p.dispatchEvent(sel,'change');await p.waitForTimeout(250);};
await p.click('[data-m="vcit"]');await S(()=>{const s=window.IECI_T.S();s.lines=[];s.products=[];s.style.prodLayout='flow';window.IECI_T.touch();});
ok(!(await p.$('#vc-sol .vms')),'una soluzione sola: riquadro nascosto');
await p.click('[data-vck="both"]');await p.waitForTimeout(500);
ok(await S(()=>document.querySelectorAll('#vc-sol .vms').length===2),'«Entrambe»: riquadro con le due soluzioni');
await set('[data-solf="n:video"]','Videocitofono Bticino Classe 100');await set('[data-solf="n:cit"]','Citofono Urmet 1150');
ok(await S(()=>window.IECI_T.S().tiers.names.join('|')==='Citofono Urmet 1150|Videocitofono Bticino Classe 100'),'titoli usati per le due soluzioni');
await p.setInputFiles('[data-sollogo="video"]',{name:'b.png',mimeType:'image/png',buffer:PNG});await p.waitForTimeout(700);
await p.setInputFiles('[data-sollogo="cit"]',{name:'u.png',mimeType:'image/png',buffer:PNG});await p.waitForTimeout(700);
ok(await S(()=>{const s=window.IECI_T.S().cond.sol;return /^data:image/.test(s.video.logo)&&/^data:image/.test(s.cit.logo)}),'logo caricato per entrambe');
const head=await S(()=>document.querySelector('#doc .qt.cmp thead').innerText);console.log(head.replace(/\n+/g,' | '));
ok(/Citofono Urmet 1150/i.test(head)&&/Videocitofono Bticino Classe 100/i.test(head),'titoli nella tabella del preventivo');
ok(await S(()=>document.querySelectorAll('#doc .qt.cmp thead .thlg img').length===2),'loghi nelle colonne della tabella');
ok(await S(()=>{const v=document.querySelector('#doc .vcbox').innerText;return /Citofono Urmet 1150/.test(v)&&/Videocitofono Bticino/.test(v)&&document.querySelectorAll('#doc .vcbox .vrlg').length===2}),'titoli e loghi nella quota a condomino');
const g=await S(()=>[...document.querySelectorAll('#doc .pgrp .pgrp-t')].map(e=>e.textContent));console.log(g.join(' / '));
ok(g.includes('Videocitofono Bticino Classe 100')&&g.includes('Citofono Urmet 1150'),'titoli nella sezione Prodotti');
ok(await S(()=>document.querySelectorAll('#doc .pgrp-l img').length>=2&&document.querySelectorAll('#doc .pcmp-lg img').length===2),'loghi nella sezione Prodotti');
ok(await S(()=>/Videocitofono Bticino Classe 100/.test(document.getElementById('vc-res').innerText)),'titoli anche nel riepilogo del pannello');
// rimuovi logo e titolo vuoto -> valori predefiniti
await S(()=>document.querySelector('[data-solx="cit"]').click());await p.waitForTimeout(300);
await set('[data-solf="n:cit"]','');
ok(await S(()=>window.IECI_T.S().tiers.names[0]==='Solo citofono'&&!window.IECI_T.S().cond.sol.cit.logo),'titolo vuoto e logo rimosso: torna «Solo citofono»');
// livelli: niente nomi da modificare li
ok(await S(()=>!document.querySelector('#tier-box [data-b^="tiers.names"]')),'i nomi non si cambiano più in due posti diversi');
// rimangono dopo la riapertura
await p.reload();await p.waitForTimeout(1500);
ok(await S(()=>window.IECI_T.S().cond.sol.video.n==='Videocitofono Bticino Classe 100'&&!!window.IECI_T.S().cond.sol.video.logo),'salvati nel preventivo');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
