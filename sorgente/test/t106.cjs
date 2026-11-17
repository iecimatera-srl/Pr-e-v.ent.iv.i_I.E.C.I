// Videocitofono: foto, marca e logo dei modelli (base e alternativi) e differenza con IVA inclusa o esclusa
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
function png(c){ // immagine PNG vera, piccola, di un colore
  const zlib=require('zlib'); const w=40,h=30, raw=Buffer.alloc((w*3+1)*h); for(let y=0;y<h;y++){ raw[y*(w*3+1)]=0; for(let x=0;x<w;x++){ const o=y*(w*3+1)+1+x*3; raw[o]=c[0]; raw[o+1]=c[1]; raw[o+2]=c[2]; } }
  const crc=b=>{ let c2=~0; for(const x of b){ c2^=x; for(let k=0;k<8;k++) c2=(c2>>>1)^(0xEDB88320&-(c2&1)); } return (~c2)>>>0; };
  const ch=(t,d)=>{ const l=Buffer.alloc(4); l.writeUInt32BE(d.length); const td=Buffer.concat([Buffer.from(t),d]); const cr=Buffer.alloc(4); cr.writeUInt32BE(crc(td)); return Buffer.concat([l,td,cr]); };
  const ih=Buffer.alloc(13); ih.writeUInt32BE(w,0); ih.writeUInt32BE(h,4); ih[8]=8; ih[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch('IHDR',ih),ch('IDAT',zlib.deflateSync(raw)),ch('IEND',Buffer.alloc(0))]);
}
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S,null,{timeout:30000});await p.waitForTimeout(800);
const S=(f,a)=>p.evaluate(f,a);
await S(()=>{ window.IECI_APP_AUTOP=1; });
const set=async(f,v)=>{await A.mostra(p,'[data-vmf="'+f+'"]');await p.fill('[data-vmf="'+f+'"]',String(v));await p.dispatchEvent('[data-vmf="'+f+'"]','change');await p.waitForTimeout(300);};
await A.mostra(p,'[data-m="vcit"]'); await p.click('[data-m="vcit"]'); await A.mostra(p,'#vc-fill'); await p.click('#vc-fill'); await p.waitForTimeout(400);
await A.mostra(p,'[data-vm="add:video:0"]'); await p.click('[data-vm="add:video:0"]'); await p.waitForTimeout(300);
ok(await S(()=>/Scrivi il nome del modello: poi puoi aggiungere foto/.test(document.getElementById('vc-vm').textContent)),'modello nuovo senza nome: invita a scrivere il nome prima delle foto');
await set('n:video:0','Monitor 10 Wi-Fi Prova'); await set('p:video:0',260);
await set('bp:video:0',200);
ok(!!(await p.$('[data-vmph="video:0"]'))&&!!(await p.$('[data-vmlg="video:0"]'))&&!!(await p.$('[data-vmf="br:video:0"]')),'modello alternativo: ci sono «+ Foto», «Carica logo» e la marca');
ok(!!(await p.$('[data-vmph="video:b"]'))&&!!(await p.$('[data-vmf="br:video:b"]')),'anche il modello base ha foto, marca e logo');
// foto del modello alternativo
await p.setInputFiles('[data-vmph="video:0"]',[{name:'a.png',mimeType:'image/png',buffer:png([200,30,30])},{name:'b.png',mimeType:'image/png',buffer:png([30,30,200])}]);
await p.waitForFunction(()=>{ const pr=window.IECI_T.S().products.find(x=>x.name==='Monitor 10 Wi-Fi Prova'); return pr&&pr.photos&&pr.photos.length===2; },null,{timeout:10000}).catch(()=>{});
ok(await S(()=>{ const pr=window.IECI_T.S().products.find(x=>x.name==='Monitor 10 Wi-Fi Prova'); return pr&&pr.photos.length===2; }),'due foto aggiunte: stanno nella scheda del modello');
ok(await S(()=>document.querySelectorAll('#vc-vm .vmm-t img').length)===2,'le miniature si vedono nel riquadro del modello');
// marca e logo
await set('br:video:0','Marcaprova');
ok(await S(()=>window.IECI_T.S().products.find(x=>x.name==='Monitor 10 Wi-Fi Prova').brand==='Marcaprova'),'marca scritta: va nella scheda del modello');
await p.setInputFiles('[data-vmlg="video:0"]',[{name:'logo.png',mimeType:'image/png',buffer:png([10,120,60])}]);
await p.waitForFunction(()=>!!document.querySelector('#vc-vm .vmm-lgp img'),null,{timeout:10000}).catch(()=>{});
ok(await S(()=>(window.IECI_T.DB().logos||[]).some(x=>x.name==='Marcaprova'&&/^data:image/.test(x.img))),'logo caricato: ricordato per la marca (vale per tutti i preventivi)');
ok(await S(()=>!!document.querySelector('#vc-vm .vmm-lgp img')),'il logo si vede nel riquadro del modello');
// foto del modello base
await p.setInputFiles('[data-vmph="video:b"]',[{name:'c.png',mimeType:'image/png',buffer:png([30,160,30])}]);
await p.waitForTimeout(1200);
// nel preventivo
await S(()=>{ window.IECI_T.renderDoc&&window.IECI_T.renderDoc(); }); await p.waitForTimeout(500);
let box=await S(()=>{ const x=document.querySelector('#doc .vmbox'); return x?{t:x.innerText.replace(/\n+/g,' | '),th:x.querySelectorAll('img.vmth').length,lg:x.querySelectorAll('img.vmlg').length}:null; });
console.log('     '+(box&&box.t).slice(0,260));
ok(box&&box.th===2&&box.lg>=1,'preventivo: nella tabella dei modelli ci sono le foto (base e alternativo) e il logo della marca');
ok(box&&/IVA inclusa/.test(box.t)&&/\+ 73,20/.test(box.t),'preventivo: differenza IVA inclusa (+ 73,20 €)');
// IVA esclusa
await A.mostra(p,'[data-vm="iva:esc:0"]'); await p.click('[data-vm="iva:esc:0"]'); await p.waitForTimeout(500);
box=await S(()=>{ const x=document.querySelector('#doc .vmbox'); return x?x.innerText.replace(/\n+/g,' | '):''; });
console.log('     '+box.slice(0,260));
ok(/IVA esclusa/i.test(box)&&/\+ 60,00 € \+ IVA/.test(box)&&!/73,20/.test(box),'«IVA esclusa»: la differenza diventa + 60,00 € + IVA');
ok(/più IVA/.test(box),'la nota spiega che il surplus è più IVA');
ok(await S(()=>window.IECI_T.S().cond.vm.iva==='esc'),'la scelta resta salvata nel preventivo');
const fasc=await S(()=>{ const a=[...document.querySelectorAll('#doc .altb')].map(x=>x.innerText).join(' | '); return a; });
ok(/\+ 60,00 € \+ IVA/.test(fasc)||fasc==='','fascicolo: la scheda del modello alternativo usa la stessa scelta ('+fasc.slice(0,80)+')');
await p.click('[data-vm="iva:inc:0"]'); await p.waitForTimeout(400);
box=await S(()=>document.querySelector('#doc .vmbox').innerText);
ok(/73,20/.test(box)&&/IVA inclusa/.test(box),'tornando a «IVA inclusa»: + 73,20 € IVA inclusa');
// togliere una foto
await p.click('[data-vm="phx:video:0:0"]'); await p.waitForTimeout(300);
ok(await S(()=>window.IECI_T.S().products.find(x=>x.name==='Monitor 10 Wi-Fi Prova').photos.length===1),'× sulla miniatura: la foto si toglie');
// rinominare il modello: foto e marca restano
await set('n:video:0','Monitor 10 Wi-Fi Nuovo nome');
ok(await S(()=>{ const pr=window.IECI_T.S().products.find(x=>x.name==='Monitor 10 Wi-Fi Nuovo nome'); return pr&&pr.photos.length===1&&pr.brand==='Marcaprova'&&!window.IECI_T.S().products.some(x=>x.name==='Monitor 10 Wi-Fi Prova'); }),'rinominato il modello: foto e marca restano, nessuna scheda doppia');
// salvato e riaperto: tutto c'è
await S(()=>{ const T=window.IECI_T; T.S().client={name:'Condominio Prova',addr:'',tel:'',email:'',cf:''}; T.touch(); T.saveQuote(true); });
const id=await S(()=>window.IECI_T.S().qid);
await S(()=>{ window.IECI_T.S().qid=''; window.IECI_T.S().products=[]; });
await S(i=>window.IECI_T.openQuote(i),id); await p.waitForTimeout(600);
ok(await S(()=>{ const pr=window.IECI_T.S().products.find(x=>x.name==='Monitor 10 Wi-Fi Nuovo nome'); return pr&&pr.photos.length===1&&pr.brand==='Marcaprova'; }),'preventivo salvato e riaperto: foto e marca dei modelli ci sono');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
