// Listino ⇄ Prodotti: «Le mie voci» (create da me o col mio prezzo), filtri, contrassegni, foto e scheda sulla voce,
// «+» al preventivo da qualsiasi listino, scheda creata/aperta in Prodotti, libreria prodotti in «Aggiungi dal listino»,
// e dalle schede di Prodotti «Nel listino…» / «Aggiungi al listino»
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.lsTipo&&window.IECI_T.S,null,{timeout:30000});
const S=(f,a)=>p.evaluate(f,a);
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4AWP4z8DwnwEIGBhgAAqTAAD//wMAj3wF+wAAAABJRU5ErkJggg==';
// 1. riconosce le voci mie e i prezzi miei
await S(()=>window.IECI_T.showPanel('listini'));
await p.selectOption('#ls-model','dom'); await p.waitForTimeout(200);
let st=await S(()=>{ const T=window.IECI_T,s=T.S(); return {a:T.lsTipo('dom',s.cat.dom[0]),c:T.lsConta('dom')}; });
ok(st.a===''&&st.c.mie===0,'listino originale: nessuna voce «mia» ('+JSON.stringify(st.c)+')');
await p.click('#ls-new>summary'); await p.waitForTimeout(150);
ok(await S(()=>document.activeElement&&document.activeElement.id==='ls-nd'),'«Nuova voce o categoria» apre il modulo col cursore sulla descrizione');
await p.fill('#ls-nd','Rilevatore fumo radio Pro'); await p.fill('#ls-nu','cad'); await p.fill('#ls-np','72'); await p.click('#ls-nadd'); await p.waitForTimeout(400);
await S(()=>{ const s=window.IECI_T.S(); s.cat.dom[1][2]=s.cat.dom[1][2]+7; window.IECI_T.renderAll(); });
await S(()=>window.IECI_T.showPanel('listini')); await p.waitForTimeout(200);
st=await S(()=>{ const T=window.IECI_T,s=T.S(), n=s.cat.dom.length-1; return {a:T.lsTipo('dom',s.cat.dom[n]),b:T.lsTipo('dom',s.cat.dom[1]),c:T.lsConta('dom'),chips:[...document.querySelectorAll('#ls-f .lsc')].map(x=>x.textContent)}; });
ok(st.a==='mia'&&st.b==='prezzo'&&st.c.mie===2,'voce creata = «Mia», prezzo cambiato = «Prezzo tuo» (2 voci mie)');
ok(st.chips[0]==='Tutte '+st.c.tutte&&st.chips[1]==='Le mie voci 2','filtri con il conteggio: '+st.chips.join(' · '));
// 2. filtro «Le mie voci»: solo le mie, con le categorie aperte e i contrassegni
await p.click('#ls-f [data-lsf="mie"]'); await p.waitForTimeout(250);
st=await S(()=>({r:[...document.querySelectorAll('#ls-body .lsr')].map(r=>r.querySelector('.ld').value+'|'+((r.querySelector('.lsb')||{}).textContent||'')),on:document.querySelector('#ls-f [data-lsf="mie"]').getAttribute('aria-pressed')}));
ok(st.on==='true'&&st.r.length===2&&st.r.some(x=>x==='Rilevatore fumo radio Pro|Mia')&&st.r.some(x=>/\|Prezzo tuo$/.test(x)),'«Le mie voci» mostra solo le mie, aperte, con il contrassegno '+JSON.stringify(st.r));
await p.reload(); await p.waitForTimeout(1500); await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.lsTipo); await S(()=>window.IECI_T.showPanel('listini')); await p.selectOption('#ls-model','dom'); await p.waitForTimeout(250);
ok(await S(()=>document.querySelector('#ls-f [data-lsf="mie"]').getAttribute('aria-pressed')==='true'),'il filtro scelto resta anche riaprendo l\'app');
// 3. «+» mette la voce nel preventivo, anche da un altro listino
const n0=await S(()=>window.IECI_T.S().lines.length);
await p.click('#ls-body .lsr.t-mia [data-lsadd]'); await p.waitForTimeout(300);
st=await S(()=>{ const L=window.IECI_T.S().lines; return {n:L.length,l:L[L.length-1],ok:!!document.querySelector('#ls-body .lsadd.fatto')}; });
ok(st.n===n0+1&&st.l.d==='Rilevatore fumo radio Pro'&&st.l.p===72&&st.ok,'«+» aggiunge «Rilevatore fumo radio Pro» a 72 € e il pulsante diventa verde');
await p.click('#ls-f [data-lsf="tutte"]'); await p.selectOption('#ls-model','fv'); await p.waitForTimeout(250);
await S(()=>{ document.querySelectorAll('#ls-body .lsg .lsh [data-gtog]')[0].click(); }); await p.waitForTimeout(200);
const fvIt=await S(()=>{ const r=document.querySelector('#ls-body .lsr'); return {i:+r.getAttribute('data-i'),d:r.querySelector('.ld').value}; });
await p.click('#ls-body .lsr[data-i="'+fvIt.i+'"] [data-lsadd]'); await p.waitForTimeout(300);
ok(await S(d=>{ const s=window.IECI_T.S(); return s.model==='dom'&&s.lines[s.lines.length-1].d===d; },fvIt.d),'da un altro listino (fotovoltaico) la voce va nel preventivo aperto, senza cambiare tipo');
// 4. scheda prodotto dalla voce: crea, poi apre
await p.selectOption('#ls-model','dom'); await p.click('#ls-f [data-lsf="mie"]'); await p.waitForTimeout(250);
const np0=await S(()=>window.IECI_T.S().products.length);
st=await S(()=>{ const r=[...document.querySelectorAll('#ls-body .lsr')].find(x=>x.querySelector('.ld').value==='Rilevatore fumo radio Pro'); const c=r.querySelector('[data-lsp]'); return c.textContent; });
ok(/Scheda|Crea la scheda/.test(st),'sulla voce c\'è la scheda prodotto: «'+st+'»');
await S(()=>{ const s=window.IECI_T.S(); s.products=s.products.filter(x=>x.name!=='Rilevatore fumo radio Pro'); window.IECI_T.renderAll(); window.IECI_T.showPanel('listini'); });
await p.waitForTimeout(200);
await S(()=>{ const r=[...document.querySelectorAll('#ls-body .lsr')].find(x=>x.querySelector('.ld').value==='Rilevatore fumo radio Pro'); r.querySelector('[data-lsp]').click(); });
await p.waitForTimeout(600);
st=await S(()=>{ const s=window.IECI_T.S(), pr=s.products.find(x=>x.name==='Rilevatore fumo radio Pro'); const d=pr&&document.querySelector('#plist details.pe[data-pid="'+pr.id+'"]'); return {pr:!!pr,open:d&&d.open,pan:!document.querySelector('[data-panel="prodotti"]').hidden}; });
ok(st.pr&&st.open&&st.pan,'«Crea la scheda prodotto»: scheda creata e aperta in Prodotti');
await S(png=>{ const s=window.IECI_T.S(), pr=s.products.find(x=>x.name==='Rilevatore fumo radio Pro'); pr.photos=[png]; pr.brand='Vimar'; window.IECI_T.touch(); },PNG);
await S(()=>window.IECI_T.showPanel('listini')); await p.waitForTimeout(700); await S(()=>window.IECI_T.renderAll()); await S(()=>window.IECI_T.showPanel('listini')); await p.waitForTimeout(300);
st=await S(()=>{ const r=[...document.querySelectorAll('#ls-body .lsr')].find(x=>x.querySelector('.ld').value==='Rilevatore fumo radio Pro'); return {img:!!r.querySelector('img.lth'),chip:r.querySelector('[data-lsp]').textContent}; });
ok(st.img&&/Scheda · Vimar · 1 foto/.test(st.chip),'la voce del listino mostra la foto e la scheda: «'+st.chip+'»');
// 5. Aggiungi dal listino (Preventivo): filtro «Le mie voci», foto, libreria prodotti
await S(()=>{ window.IECI_T.showPanel('prev'); document.getElementById('acc-list').open=true; });
await p.waitForTimeout(300);
st=await S(()=>[...document.querySelectorAll('#cat-fl .lsc')].map(x=>x.textContent));
ok(st.length===2&&/^Le mie voci \d+$/.test(st[1]),'«Aggiungi dal listino» ha i filtri Tutte / Le mie voci: '+st.join(' · '));
await p.click('#cat-fl [data-lsf="mie"]'); await p.waitForTimeout(250);
st=await S(()=>({r:[...document.querySelectorAll('#cat .crow:not(.lib)')].map(x=>x.querySelector('.d').textContent+'|'+((x.querySelector('.lsb')||{}).textContent||'')),img:!!document.querySelector('#cat .crow img.cth')}));
ok(st.r.length===2&&st.r.some(x=>x==='Rilevatore fumo radio Pro|Mia')&&st.img,'«Le mie voci»: solo le mie, con la foto della scheda '+JSON.stringify(st.r));
await S(()=>{ const T=window.IECI_T; T.S().products.push({id:'libtest',name:'Centralina meteo Wi-Fi',brand:'Somfy',code:'MT1',desc:'',specs:'',link:'',tags:'',photos:[]}); T.touch(); });
await p.waitForTimeout(2200); await S(()=>{ if(window.IECI_T.libSync) window.IECI_T.libSync(true); const s=window.IECI_T.S(); s.products=s.products.filter(x=>x.id!=='libtest'); window.IECI_T.renderAll(); });
await p.fill('#cat-q','centralina'); await p.waitForTimeout(300);
st=await S(()=>[...document.querySelectorAll('#cat .crow.lib')].map(x=>x.querySelector('.d').textContent));
ok(st.some(x=>/^Centralina meteo Wi-Fi/.test(x)),'cercando trovi anche i prodotti della tua libreria: '+JSON.stringify(st));
const nl=await S(()=>window.IECI_T.S().lines.length);
await p.click('#cat .crow.lib [data-libadd]'); await p.waitForTimeout(300);
ok(await S(n=>{ const s=window.IECI_T.S(); return s.lines.length===n+1&&s.lines[s.lines.length-1].d==='Centralina meteo Wi-Fi'&&s.products.some(x=>x.name==='Centralina meteo Wi-Fi'); },nl),'«+» sul prodotto di libreria: voce e scheda nel preventivo');
await p.fill('#cat-q',''); await p.click('#cat-fl [data-lsf="tutte"]');
// 6. Prodotti → listino
await S(()=>window.IECI_T.showPanel('prodotti')); await p.waitForTimeout(300);
st=await S(()=>{ const s=window.IECI_T.S(), pr=s.products.find(x=>x.name==='Centralina meteo Wi-Fi'); const d=document.querySelector('#plist details.pe[data-pid="'+pr.id+'"]'); d.open=true; return {t:d.querySelector('.plist-ls').textContent}; });
ok(/Non è nel listino/.test(st.t)&&/Aggiungi al listino «Domestico»/.test(st.t),'scheda non nel listino: propone «Aggiungi al listino»');
await S(()=>{ const s=window.IECI_T.S(), pr=s.products.find(x=>x.name==='Centralina meteo Wi-Fi'); const ln=s.lines.find(l=>l.d==='Centralina meteo Wi-Fi'); ln.p=185; window.IECI_T.touch(); document.querySelector('#plist details.pe[data-pid="'+pr.id+'"] [data-plsadd]').click(); });
await p.waitForTimeout(400);
st=await S(()=>{ const T=window.IECI_T,s=T.S(), it=s.cat.dom.find(x=>x[0]==='Centralina meteo Wi-Fi'); const pr=s.products.find(x=>x.name==='Centralina meteo Wi-Fi'); const d=document.querySelector('#plist details.pe[data-pid="'+pr.id+'"]'); return {it:it,tp:it&&T.lsTipo('dom',it),t:d.querySelector('.plist-ls').textContent}; });
ok(st.it&&st.it[2]===185&&st.tp==='mia'&&/Nel listino «Domestico» · 185,00 €\/cad/.test(st.t),'aggiunta al listino col prezzo del preventivo (185 €): ora è tra «Le mie voci»');
await S(()=>{ const s=window.IECI_T.S(), pr=s.products.find(x=>x.name==='Centralina meteo Wi-Fi'); document.querySelector('#plist details.pe[data-pid="'+pr.id+'"] [data-plsgo]').click(); });
await p.waitForTimeout(600);
st=await S(()=>{ const r=document.querySelector('#ls-body .lsr.trovato'); return {pan:!document.querySelector('[data-panel="listini"]').hidden,r:r&&r.querySelector('.ld').value}; });
ok(st.pan&&st.r==='Centralina meteo Wi-Fi','«Apri nel listino» porta alla voce, evidenziata');
// 7. 360 px: niente esce dallo schermo
await p.setViewportSize({width:360,height:780}); await p.waitForTimeout(300);
st=await S(()=>{ const o=[]; document.querySelectorAll('[data-panel="listini"] *').forEach(e=>{ if(e.closest('.lsf')) return; const r=e.getBoundingClientRect(); if(r.width&&r.right>innerWidth+1) o.push(e.className||e.tagName); }); return o; });
ok(!st.length,'360 px: niente esce dallo schermo '+JSON.stringify(st.slice(0,4)));
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
