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
ok(!(await p.$('[data-vmf="bp:video:0"]'))&&!(await p.$('[data-vmf="bn:video:0"]'))&&!/Modello base/i.test(await S(()=>document.getElementById('vc-vm').textContent)),'nella sezione dei modelli alternativi non c\'è più il modello base');
ok(!(await p.$('[data-vmf="s:video:0"]')),'niente «differenza a mano»: si scrive solo il prezzo del modello');
ok(!!(await p.$('[data-vmph="video:0"]'))&&!!(await p.$('[data-vmlg="video:0"]'))&&!!(await p.$('[data-vmf="br:video:0"]')),'modello alternativo: ci sono «+ Foto», «Carica logo» e la marca');
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
// nel preventivo
await S(()=>{ window.IECI_T.renderDoc&&window.IECI_T.renderDoc(); }); await p.waitForTimeout(500);
let box=await S(()=>{ const x=document.querySelector('#doc .vmbox'); return x?{t:x.innerText.replace(/\n+/g,' | '),th:x.querySelectorAll('img.vmth').length,lg:x.querySelectorAll('img.vmlg').length}:null; });
console.log('     '+(box&&box.t).slice(0,260));
ok(box&&box.th===1&&box.lg>=1,'preventivo: nella tabella dei modelli ci sono la foto e il logo della marca');
ok(box&&!/Modello base|Incluso nel prezzo/i.test(box.t),'preventivo: nessuna riga «modello base»');
ok(box&&/260,00 € \+ IVA/.test(box.t),'prezzo scritto IVA esclusa: nel preventivo compare 260,00 € + IVA');
ok(!(await p.$('[data-vm^="iva:"]')),'una sola scelta dell\'IVA, sul prezzo del modello (niente seconda scelta che crea confusione)');
// IVA inclusa: il cliente vede il prezzo finale già ivato
const cl=async sel=>{ await A.mostra(p,sel); await p.click(sel); await p.waitForTimeout(350); };
await cl('[data-vm="pm:video:0:inc"]');
ok(await S(()=>window.IECI_T.S().cond.vm.video.o[0].p===317.2&&window.IECI_T.S().cond.vm.video.o[0].pm==='inc'),'«IVA inclusa» sul prezzo: 260 + IVA diventa 317,20 (stesso prezzo, scritto con l\'IVA)');
ok(await S(()=>/= 260,00 € \+ IVA/.test(document.getElementById('vc-vm').textContent)),'sotto il prezzo c\'è la conversione: = 260,00 € + IVA');
box=await S(()=>document.querySelector('#doc .vmbox').innerText);
ok(/317,20 € IVA inclusa/.test(box)&&!/\+ IVA/.test(box),'«IVA inclusa»: nel preventivo il prezzo finale già ivato, 317,20 € IVA inclusa (niente «+ IVA»)');
const fasc=await S(()=>{ const a=[...document.querySelectorAll('#doc .altb')].map(x=>x.innerText).join(' | '); return a; });
ok(/317,20 € IVA inclusa/.test(fasc)||fasc==='','fascicolo: la scheda del modello mostra lo stesso prezzo ivato ('+fasc.replace(/\n/g,' ').slice(0,90)+')');
await set('p:video:0',366);
box=await S(()=>document.querySelector('#doc .vmbox').innerText);
ok(/366,00 € IVA inclusa/.test(box),'scritto 366 € IVA inclusa: nel preventivo compare esattamente 366,00 € IVA inclusa');
await cl('[data-vm="pm:video:0:esc"]');
ok(await S(()=>window.IECI_T.S().cond.vm.video.o[0].p===300),'tornando a «IVA esclusa»: 366 diventa 300');
box=await S(()=>document.querySelector('#doc .vmbox').innerText);
ok(/300,00 € \+ IVA/.test(box),'…e nel preventivo: 300,00 € + IVA');
// due modelli, uno con IVA e uno senza: ognuno come l'hai scelto
await cl('[data-vm="add:video:0"]'); await set('n:video:1','Monitor economico'); await cl('[data-vm="pm:video:1:inc"]'); await set('p:video:1',150);
box=await S(()=>document.querySelector('#doc .vmbox').innerText);
ok(/300,00 € \+ IVA/.test(box)&&/150,00 € IVA inclusa/.test(box),'due modelli: ognuno con la sua scelta (300,00 € + IVA e 150,00 € IVA inclusa)');
await cl('[data-vm="del:video:1"]');
// sfondo delle foto
await cl('[data-vm="bg:video:0:keep"]'); await p.waitForTimeout(500);
ok(await S(()=>window.IECI_T.S().products.find(x=>x.name==='Monitor 10 Wi-Fi Prova').bg==='keep')&&await S(()=>document.querySelector('[data-vm="bg:video:0:keep"]').getAttribute('aria-pressed')==='true'),'«Con sfondo originale»: scelta salvata nella scheda del modello');
await cl('[data-vm="bg:video:0:cut"]'); await p.waitForTimeout(1500);
ok(await S(()=>window.IECI_T.S().products.find(x=>x.name==='Monitor 10 Wi-Fi Prova').bg==='cut'),'«Senza sfondo, con alone»: scelta salvata');
// il caso del monitor scritto a mano nel preventivo (la riga la metti tu): il prezzo dell'alternativo compare lo stesso
await S(()=>{ const T=window.IECI_T,S=T.S(); S.lines=S.lines.filter(l=>!l.vbk&&!/monitor/i.test(l.d)); S.lines.unshift({d:'Monitor BTicino Classe 100X scritto a mano',u:'cad',q:10,p:150,s:0}); T.touch(); T.renderAll&&T.renderAll(); });
await p.waitForTimeout(500);
box=await S(()=>document.querySelector('#doc .vmbox').innerText);
ok(/300,00 € \+ IVA/.test(box)&&!/—/.test(box),'riga del monitor scritta a mano: il prezzo del modello alternativo compare lo stesso');
// togliere una foto
await p.click('[data-vm="phx:video:0:0"]'); await p.waitForTimeout(300);
ok(await S(()=>window.IECI_T.S().products.find(x=>x.name==='Monitor 10 Wi-Fi Prova').photos.length===1),'× sulla miniatura: la foto si toglie');
// rinominare il modello: foto e marca restano
await set('n:video:0','Monitor 10 Wi-Fi Nuovo nome');
ok(await S(()=>{ const pr=window.IECI_T.S().products.find(x=>x.name==='Monitor 10 Wi-Fi Nuovo nome'); return pr&&pr.photos.length===1&&pr.brand==='Marcaprova'&&!window.IECI_T.S().products.some(x=>x.name==='Monitor 10 Wi-Fi Prova'); }),'rinominato il modello: foto e marca restano, nessuna scheda doppia');
// dicitura accanto al prezzo (per i condomini: prezzo in più rispetto alla propria quota)
ok(!!(await p.$('[data-vmf="dic:video:0"]')),'c\'è il campo «Dicitura accanto al prezzo»');
await cl('[data-vm="dic:video:0:0"]');
ok(await S(()=>window.IECI_T.S().cond.vm.video.o[0].dic==='in più rispetto alla propria quota'),'tocco su una frase pronta: la dicitura si mette da sola');
box=await S(()=>document.querySelector('#doc .vmbox').innerText.replace(/\n+/g,' | '));
ok(/\+ IVA \| in più rispetto alla propria quota/.test(box),'nel preventivo la dicitura compare subito sotto il prezzo ('+box.slice(box.indexOf('Monitor 10'),box.indexOf('Monitor 10')+110)+')');
const fd=await S(()=>[...document.querySelectorAll('#doc .altb')].map(x=>x.innerText.replace(/\n/g,' ')).join(' | '));
ok(/in più rispetto alla propria quota/.test(fd)||fd==='','anche nella scheda del modello nel fascicolo');
await set('dic:video:0','da versare in aggiunta alla quota del condominio');
box=await S(()=>document.querySelector('#doc .vmbox').innerText);
ok(/da versare in aggiunta alla quota del condominio/.test(box),'dicitura scritta a mano: compare così com\'è');
await cl('[data-vm="add:video:0"]');
ok(await S(()=>window.IECI_T.S().cond.vm.video.o[1].dic==='da versare in aggiunta alla quota del condominio'),'un nuovo modello alternativo prende già la dicitura dell\'ultimo');
await cl('[data-vm="del:video:1"]');
await cl('[data-vm="dic:video:0:x"]');
box=await S(()=>document.querySelector('#doc .vmbox').innerText);
ok(!/da versare in aggiunta/.test(box)&&await S(()=>!window.IECI_T.S().cond.vm.video.o[0].dic),'«Nessuna dicitura»: si toglie');
await cl('[data-vm="dic:video:0:1"]');
// salvato e riaperto: tutto c'è
await S(()=>{ const T=window.IECI_T; T.S().client={name:'Condominio Prova',addr:'',tel:'',email:'',cf:''}; T.touch(); T.saveQuote(true); });
const id=await S(()=>window.IECI_T.S().qid);
await S(()=>{ window.IECI_T.S().qid=''; window.IECI_T.S().products=[]; });
await S(i=>window.IECI_T.openQuote(i),id); await p.waitForTimeout(600);
ok(await S(()=>{ const pr=window.IECI_T.S().products.find(x=>x.name==='Monitor 10 Wi-Fi Nuovo nome'); return pr&&pr.photos.length===1&&pr.brand==='Marcaprova'; }),'preventivo salvato e riaperto: foto e marca dei modelli ci sono');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
