// Fascicolo sempre in A4: quello che non sta in una pagina passa alla pagina dopo (prodotti, preventivo, ogni sezione),
// con intestazione e piè di pagina ripetuti, tabelle con l'intestazione ripetuta, niente titoli soli in fondo;
// le pagine si aggiornano bene quando cambi qualcosa, quando arrivano le foto e quando togli voci; il PDF ha solo pagine A4
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:1366,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.buildPdf&&window.IECI_T.S,null,{timeout:30000});
const S=(f,a)=>p.evaluate(f,a);
const pagine=()=>S(()=>[...document.querySelectorAll('#doc>.page')].map(pg=>{ pg.style.contentVisibility='visible'; const r={h:pg.offsetHeight,c:pg.classList.contains('pg-cont'),hd:!!pg.querySelector(':scope>.pg-h'),ft:!!pg.querySelector(':scope>.pg-f'),n:(pg.querySelector(':scope>.pg-b')||{children:[]}).children.length,t:(pg.querySelector(':scope>.pg-b')||{innerText:''}).innerText.slice(0,60)}; pg.style.contentVisibility=''; return r; }));
await S(()=>{ const T=window.IECI_T,s=T.S(); s.lines=[]; s.products=[]; for(let i=1;i<=14;i++){ s.lines.push({d:'Prodotto di prova numero '+i,u:'cad',q:1,p:100,s:0}); s.products.push({id:'x'+i,name:'Prodotto di prova numero '+i,brand:'Bticino',code:'AB'+i,desc:'Descrizione del prodotto con alcune righe di testo che spiegano a cosa serve e perché è stato scelto per questo impianto. '.repeat(2),specs:'Tensione: 230 V\nPotenza: 10 W\nGrado IP: IP44',link:'',tags:'',photos:[]}); } for(let i=15;i<=60;i++) s.lines.push({d:'Voce del preventivo numero '+i,u:'cad',q:1,p:10,s:0}); T.renderAll(); T.touch(); });
await p.waitForTimeout(3000);
let P=await pagine();
console.log(P.map(x=>x.h+(x.c?'c':'')).join(' '));
ok(P.length>=10&&P.every(x=>x.h===1123),'tutte le '+P.length+' pagine sono alte esattamente un A4 (1123 px)');
ok(P.filter(x=>x.c).length>=5&&P.filter(x=>x.c).every(x=>x.hd&&x.ft),'le pagine di continuazione ('+P.filter(x=>x.c).length+') hanno intestazione e piè di pagina');
let st=await S(()=>{ const all=[...document.querySelectorAll('#doc>.page')]; const nomi=[]; all.forEach(pg=>pg.querySelectorAll('article.prod h3').forEach(h=>nomi.push(h.textContent))); return nomi; });
ok(st.length===14&&st.every((n,i)=>n==='Prodotto di prova numero '+(i+1)),'tutti i 14 prodotti ci sono, nell\'ordine, distribuiti sulle pagine');
st=await S(()=>{ const all=[...document.querySelectorAll('#doc>.page')]; const rows=[]; let tab=0, thead=0; all.forEach(pg=>pg.querySelectorAll('table').forEach(t=>{ if(/Voce del preventivo/.test(t.innerText)){ tab++; if(t.tHead) thead++; t.querySelectorAll('tbody tr').forEach(r=>{ const m=r.innerText.match(/(Prodotto di prova numero|Voce del preventivo numero) (\d+)/); if(m) rows.push(+m[2]); }); } })); return {tab,thead,rows}; });
ok(st.tab>=2&&st.thead===st.tab,'la tabella del preventivo prosegue su '+st.tab+' pagine, con l\'intestazione ripetuta su ognuna');
ok(st.rows.length===60&&st.rows.every((n,i)=>n===i+1),'tutte le 60 righe ci sono una volta sola e in ordine');
ok(await S(()=>{ const all=[...document.querySelectorAll('#doc>.page .pg-b')]; return all.every(b=>{ const l=b.lastElementChild; return !l||!/^H[1-6]$/.test(l.tagName); }); }),'nessun titolo resta da solo in fondo a una pagina');
// modifiche: niente pagine doppie o perse
const n0=P.length;
await S(()=>{ const s=window.IECI_T.S(); s.lines[20].p=12; window.IECI_T.touch(); }); await p.waitForTimeout(1500);
P=await pagine(); ok(P.length===n0&&P.every(x=>x.h===1123),'cambiando un prezzo le pagine restano giuste ('+P.length+')');
await S(()=>{ const s=window.IECI_T.S(); s.lines=s.lines.slice(0,20); window.IECI_T.touch(); }); await p.waitForTimeout(1500);
P=await pagine(); st=await S(()=>{ const r=[]; document.querySelectorAll('#doc>.page tbody tr').forEach(t=>{ const m=t.innerText.match(/Voce del preventivo numero (\d+)/); if(m) r.push(+m[1]); }); return r; });
ok(P.length<n0&&P.every(x=>x.h===1123)&&st.join()==='15,16,17,18,19,20','togliendo voci le pagine in più spariscono ('+P.length+')');
await S(()=>{ const s=window.IECI_T.S(); s.products=s.products.slice(0,2); window.IECI_T.touch(); }); await p.waitForTimeout(1500);
st=await S(()=>[...document.querySelectorAll('#doc>.page')].filter(pg=>pg.querySelector('article.prod')).length);
ok(st===1,'con 2 prodotti resta una pagina sola di prodotti');
// foto che arrivano dopo: la pagina non si allunga
await S(()=>{ const c=document.createElement('canvas'); c.width=800; c.height=600; const x=c.getContext('2d'); x.fillStyle='#4a7'; x.fillRect(0,0,800,600); const u=c.toDataURL('image/jpeg',.8); const s=window.IECI_T.S(); s.products=[]; for(let i=1;i<=8;i++) s.products.push({id:'f'+i,name:'Prodotto di prova numero '+i,brand:'Vimar',code:'',desc:'Con foto grande.',specs:'',link:'',tags:'',photos:[u,u]}); window.IECI_T.touch(); });
await p.waitForTimeout(3000);
P=await pagine(); ok(P.every(x=>x.h===1123),'con le foto (che arrivano dopo il testo) tutte le pagine restano A4');
// elemento più alto di una pagina: rimpicciolito, non tagliato
await S(()=>{ const s=window.IECI_T.S(); s.products=[{id:'big',name:'Prodotto di prova numero 1',brand:'',code:'',desc:'Testo lunghissimo. '.repeat(900),specs:'',link:'',tags:'',photos:[]}]; window.IECI_T.touch(); });
await p.waitForTimeout(2500);
P=await pagine(); ok(P.every(x=>x.h===1123),'anche una scheda più lunga di una pagina intera resta dentro l\'A4');
// stampa
ok(await S(()=>{ const r=[...document.styleSheets].some(ss=>{ try{ return [...ss.cssRules].some(x=>x.media&&/print/.test(x.media.mediaText)&&/break-after:\s*page/.test(x.cssText)); }catch(e){ return false; } }); return r; }),'in stampa ogni pagina va a capo da sola');
// PDF: solo pagine A4
await S(()=>{ const T=window.IECI_T,s=T.S(); s.lines=[]; s.products=[]; for(let i=1;i<=10;i++){ s.lines.push({d:'Prodotto di prova numero '+i,u:'cad',q:1,p:100,s:0}); s.products.push({id:'x'+i,name:'Prodotto di prova numero '+i,brand:'Bticino',code:'AB'+i,desc:'Descrizione del prodotto. '.repeat(12),specs:'Tensione: 230 V',link:'',tags:'',photos:[]}); } T.touch(); });
await p.waitForTimeout(2500);
const npag=(await pagine()).length;
st=await S(()=>window.IECI_T.buildPdf(false).then(bl=>bl.arrayBuffer()).then(ab=>window.PDFLib.PDFDocument.load(ab)).then(doc=>doc.getPages().map(pg=>{ const z=pg.getSize(); return Math.round(z.width)+'x'+Math.round(z.height); })));
ok(st.length===npag&&st.every(x=>x==='595x842'),'PDF: '+st.length+' pagine, tutte A4 (595 × 842 punti)');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
