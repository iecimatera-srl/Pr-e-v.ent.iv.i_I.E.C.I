// Modelli alternativi con TRE impianti a confronto (A, B, C): niente incroci tra impianti.
// Stesso nome in A e B = due schede separate (foto, marca, logo, prezzo, IVA, dicitura); rinominare / eliminare /
// togliere un impianto tocca solo il suo; grandezza di foto e logo come nei prodotti.
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
function png(c){ const zlib=require('zlib'); const w=40,h=30, raw=Buffer.alloc((w*3+1)*h); for(let y=0;y<h;y++){ raw[y*(w*3+1)]=0; for(let x=0;x<w;x++){ const o=y*(w*3+1)+1+x*3; raw[o]=c[0]; raw[o+1]=c[1]; raw[o+2]=c[2]; } }
  const crc=b=>{ let c2=~0; for(const x of b){ c2^=x; for(let k=0;k<8;k++) c2=(c2>>>1)^(0xEDB88320&-(c2&1)); } return (~c2)>>>0; };
  const ch=(t,d)=>{ const l=Buffer.alloc(4); l.writeUInt32BE(d.length); const td=Buffer.concat([Buffer.from(t),d]); const cr=Buffer.alloc(4); cr.writeUInt32BE(crc(td)); return Buffer.concat([l,td,cr]); };
  const ih=Buffer.alloc(13); ih.writeUInt32BE(w,0); ih.writeUInt32BE(h,4); ih[8]=8; ih[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch('IHDR',ih),ch('IDAT',zlib.deflateSync(raw)),ch('IEND',Buffer.alloc(0))]); }
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:420,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S,null,{timeout:30000});await p.waitForTimeout(800);
const S=(f,a)=>p.evaluate(f,a);
const set=async(f,v)=>{await A.mostra(p,'[data-vmf="'+f+'"]');await p.fill('[data-vmf="'+f+'"]',String(v));await p.dispatchEvent('[data-vmf="'+f+'"]','change');await p.waitForTimeout(350);};
const cl=async s=>{ await A.mostra(p,s); await p.click(s); await p.waitForTimeout(400); };
await S(()=>document.querySelector('[data-m="vcit"]').click()); await p.waitForTimeout(300);
await S(()=>document.querySelector('[data-vck="brands"]').click()); await p.waitForTimeout(600);
await S(()=>{ const b=document.querySelector('[data-sy^="add:"]'); b&&b.click(); }); await p.waitForTimeout(600);
await S(()=>{ const s=window.IECI_T.S(); s.cond.sys[0].b='Bticino'; s.cond.sys[1].b='Urmet'; s.cond.sys[2].b='Comelit'; window.IECI_T.touch(); window.IECI_T.renderAll(); }); await p.waitForTimeout(500);
const ids=await S(()=>window.IECI_T.S().cond.sys.map(x=>x.id));
const nomi=['Monitor Smart Wifi','Monitor Smart Wifi','Monitor Mini'], marche=['Bticino','Urmet','Comelit'];
for(let j=0;j<3;j++){ const k=ids[j];
  await cl('[data-vm="add:'+k+':0"]'); await set('n:'+k+':0',nomi[j]); await set('p:'+k+':0',100*(j+1)); await set('br:'+k+':0',marche[j]);
  await p.setInputFiles('[data-vmph="'+k+':0"]',[{name:'a.png',mimeType:'image/png',buffer:png([60*j,100,200-60*j])}]); await p.waitForTimeout(900);
}
const schede=()=>S(ids=>ids.map(k=>{ const s=window.IECI_T.S(); const pr=s.products.filter(p=>p.sys&&p.sys.split('|').includes(k)&&/Smart|Mini|Note/.test(p.name)); return pr.map(p=>p.name+'·'+p.brand+'·'+(p.photos||[]).length).join(',')||'-'; }),ids);
let sc=await schede(); console.log('     schede per impianto: '+JSON.stringify(sc));
ok(sc[0]==='Monitor Smart Wifi·Bticino·1'&&sc[1]==='Monitor Smart Wifi·Urmet·1'&&sc[2]==='Monitor Mini·Comelit·1','stesso nome in A e B: due schede separate, ognuna con la sua marca e la sua foto');
ok(await S(ids=>ids.every(k=>document.querySelectorAll('[data-vm^="phx:'+k+':0:"]').length===1),ids),'nel riquadro di ogni impianto si vede solo la sua foto');
await S(()=>window.IECI_T.renderDoc&&window.IECI_T.renderDoc()); await p.waitForTimeout(500);
const boxes=()=>S(()=>{ const out=[]; let cur=null; document.querySelectorAll('#doc .sysh, #doc .vmbox').forEach(e=>{ if(e.matches('.sysh')){ cur={imp:e.innerText.replace(/\n+/g,' ').slice(0,40),box:'',th:0}; out.push(cur); } else if(cur){ cur.box+=e.innerText.replace(/\n+/g,' | '); cur.th+=e.querySelectorAll('img.vmth').length; } }); return out; });
let bx=await boxes(); bx.forEach(x=>console.log('     '+x.imp+' → '+x.box.slice(x.box.indexOf('Monitor'),x.box.indexOf('Monitor')+60)));
ok(bx.length===3&&/Bticino/.test(bx[0].imp)&&/100,00/.test(bx[0].box)&&!/200,00|300,00/.test(bx[0].box),'preventivo, impianto Bticino: solo il suo modello (100 €)');
ok(/Urmet/.test(bx[1].imp)&&/200,00/.test(bx[1].box)&&!/100,00|300,00/.test(bx[1].box),'impianto Urmet: solo il suo modello (200 €)');
ok(/Comelit/.test(bx[2].imp)&&/300,00/.test(bx[2].box)&&/Monitor Mini/.test(bx[2].box),'impianto Comelit: solo il suo modello (300 €)');
ok(bx.every(x=>x.th===1),'ogni impianto con la foto del suo modello');
// IVA e dicitura diverse per impianto
await cl('[data-vm="pm:'+ids[1]+':0:inc"]'); await cl('[data-vm="dic:'+ids[2]+':0:0"]');
bx=await boxes();
ok(/100,00 € \+ IVA/.test(bx[0].box)&&/244,00 € IVA inclusa/.test(bx[1].box)&&/300,00 € \+ IVA/.test(bx[2].box),'IVA inclusa solo per Urmet: 100 + IVA · 244,00 IVA inclusa · 300 + IVA');
ok(/in più rispetto alla propria quota/.test(bx[2].box)&&!/in più rispetto/.test(bx[0].box+bx[1].box),'dicitura messa solo su Comelit: compare solo lì');
// grandezza di foto e logo
await S(ids=>{ const s=window.IECI_T.S(); }, ids);
await set('ps:'+ids[0]+':0',90);
ok(await S(k=>{ const pr=window.IECI_T.S().products.find(p=>p.sys===k&&/Smart/.test(p.name)); return pr&&pr.ps===90; },ids[0]),'«Grandezza della foto» del modello: salvata nella sua scheda (come nei prodotti)');
const w0=await S(()=>{ const i=document.querySelector('#doc .sysb .vmbox img.vmth'); return i?i.getBoundingClientRect().width/(document.querySelector('#doc .page').getBoundingClientRect().width/794):0; });
ok(w0>85,'nel preventivo la foto del modello Bticino è più grande ('+Math.round(w0)+' px)');
const w1=await S(()=>{ const i=[...document.querySelectorAll('#doc .sysb .vmbox img.vmth')][1]; return i?i.getBoundingClientRect().width/(document.querySelector('#doc .page').getBoundingClientRect().width/794):0; });
ok(w1>30&&w1<60,'…e quella di Urmet resta normale ('+Math.round(w1)+' px)');
ok(!!(await p.$('[data-vmf="ps:'+ids[1]+':0"]')),'la barra della grandezza c\'è in ogni modello con foto');
// rinomino il modello di B: A non cambia
await set('n:'+ids[1]+':0','Monitor Urmet Note');
sc=await schede();
ok(sc[0]==='Monitor Smart Wifi·Bticino·1'&&sc[1]==='Monitor Urmet Note·Urmet·1','rinominato il modello di Urmet: la sua scheda cambia nome (con foto e marca), quella di Bticino resta com\'era');
// elimino il modello di A: B e C restano
await cl('[data-vm="del:'+ids[0]+':0"]');
bx=await boxes();
ok(!/Monitor/.test(bx[0].box)&&/Monitor Urmet Note/.test(bx[1].box)&&/Monitor Mini/.test(bx[2].box),'eliminato il modello di Bticino: gli altri impianti non cambiano');
// tolgo l'impianto C
await S(()=>{ const b=[...document.querySelectorAll('[data-sy^="del:"]')].pop(); b&&b.click(); }); await p.waitForTimeout(600);
ok(await S(()=>window.IECI_T.S().cond.sys.length===2&&!window.IECI_T.S().products.some(p=>p.name==='Monitor Mini')),'tolto l\'impianto Comelit: spariscono anche il suo modello e la sua scheda');
bx=await boxes();
ok(bx.length===2&&/Monitor Urmet Note/.test(bx[1].box),'Bticino e Urmet restano a posto');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
