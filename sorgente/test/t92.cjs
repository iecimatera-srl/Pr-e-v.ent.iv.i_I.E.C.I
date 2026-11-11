// Menu e funzioni: barra in basso sul telefono, menu che sale dal basso con le spiegazioni, «Cerca una funzione» che porta
// alla casella giusta, Ctrl+K sul computer, sottotitoli delle pagine, testi lunghi ridotti, gruppi pieghevoli, listini per categoria
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.cerca,null,{timeout:30000});
const S=(f,a)=>p.evaluate(f,a);
// 1. barra in basso
let st=await S(()=>{ const n=document.getElementById('bnav'), r=n.getBoundingClientRect(); return {v:n.checkVisibility(),b:Math.round(r.bottom),t:[...n.querySelectorAll('button')].map(b=>b.innerText.trim()),cur:(n.querySelector('[aria-current="page"]')||{}).innerText}; });
ok(st.v&&st.b===844&&st.t.join()==='Oggi,Preventivo,Cliente,Invio,Menu'&&st.cur==='Preventivo','barra in basso: Oggi, Preventivo, Cliente, Invio, Menu ('+st.t.join(' · ')+')');
await p.click('#bnav [data-bp="dati"]'); await p.waitForTimeout(300);
st=await S(()=>({p:[...document.querySelectorAll('[data-panel]')].find(s=>!s.hidden).getAttribute('data-panel'),cur:document.querySelector('#bnav [aria-current="page"]').innerText.trim(),sub:(document.querySelector('[data-panel="dati"] .psub')||{}).textContent}));
ok(st.p==='dati'&&st.cur==='Cliente','«Cliente» apre i dati del cliente e si accende');
ok(st.sub==='Cliente, numero, date e stato','sotto il titolo una riga dice a cosa serve la pagina');
// 2. menu dal basso con le spiegazioni
await p.click('#bnav [data-bm]'); await p.waitForTimeout(400);
st=await S(()=>{ const d=document.getElementById('mn-drop'), r=d.getBoundingClientRect(), bk=document.querySelector('.mback'); const m=[...d.querySelectorAll('.mit')]; return {open:!d.hidden,bot:Math.round(r.bottom),top:Math.round(r.top),back:bk&&!bk.hidden&&getComputedStyle(bk).position==='fixed',n:m.length,desc:m.map(x=>getComputedStyle(x.querySelector('.mtx'),'::after').content),txt:m[0].textContent}; });
ok(st.open&&st.back&&st.bot>700&&st.top>100,'il menu sale dal basso sopra la barra, con lo sfondo scurito');
ok(st.n===21&&st.desc.every(c=>c.length>8),'ogni voce del menu ha la sua riga di spiegazione');
ok(st.txt==='Oggi','il nome della voce resta pulito (la spiegazione è a parte)');
await p.click('.mback',{position:{x:200,y:40}}); await p.waitForTimeout(250);
ok(await S(()=>document.getElementById('mn-drop').hidden),'toccando fuori il menu si chiude');
// 3. cerca una funzione
await p.click('#bnav [data-bm]'); await p.waitForTimeout(300);
await p.fill('#mn-q','iva'); await p.waitForTimeout(200);
st=await S(()=>[...document.querySelectorAll('#mn-res .msr')].map(b=>b.querySelector('b').textContent+' | '+b.querySelector('small').textContent));
console.log(JSON.stringify(st));
ok(st[0]==='IVA | Preventivo › Prezzo, IVA e sconto'&&!st.some(x=>/GitHub|Drive/.test(x)),'«iva» trova la casella IVA dentro «Prezzo, IVA e sconto» (e niente di sbagliato)');
ok(await S(()=>document.getElementById('mn-gs').hidden),'mentre cerchi, l\'elenco delle sezioni lascia posto ai risultati');
await p.click('#mn-res .msr >> nth=0'); await p.waitForTimeout(900);
st=await S(()=>({p:[...document.querySelectorAll('[data-panel]')].find(s=>!s.hidden).getAttribute('data-panel'),acc:document.getElementById('acc-prezzo').open,f:document.activeElement&&document.activeElement.id,tr:!!document.querySelector('.trovato'),y:Math.round(document.getElementById('m-iva').getBoundingClientRect().top)}));
ok(st.p==='prev'&&st.acc&&st.f==='m-iva'&&st.tr&&st.y>0&&st.y<844,'scelto il risultato: pagina giusta, riquadro aperto, casella IVA in vista, evidenziata e pronta');
for(const [q,att] of [['pin','Blocco con PIN'],['firma','Firma del cliente sullo schermo'],['sconto','Sconto commerciale %'],['logo app','Logo mostrato nell\'app'],['backup','Copia di sicurezza'],['tema scuro','Tema'],['whatsap','WhatsApp']]){
  const r=await S(q=>window.IECI_T.cerca(q).slice(0,3).map(e=>e.t),q);
  ok(r.some(x=>x.indexOf(att)===0),'«'+q+'» → '+r.join(' / '));
}
ok(await S(()=>window.IECI_T.cerca('xyzqw').length===0),'parola che non c\'è: nessun risultato');
// voce del menu nascosta: non compare nei risultati
await S(()=>{ const M=window.IECI_T.MENU(); M.items.find(i=>i.p==='piante').on=false; });
ok(await S(()=>{ window.IECI_T.cerca('zz'); return !window.IECI_T.cerca('planimetria').some(e=>e.p==='piante'); }),'le sezioni nascoste nel menu non compaiono nella ricerca');
await S(()=>{ const M=window.IECI_T.MENU(); M.items.find(i=>i.p==='piante').on=true; });
// 4. testi lunghi ridotti
await S(()=>window.IECI_T.showPanel('listini')); await p.waitForTimeout(300);
st=await S(()=>{ const h=[...document.querySelectorAll('[data-panel="listini"] p.hint.lunga')].find(x=>x.checkVisibility()), b=h&&h.nextElementSibling; if(h) h.id||h.setAttribute('data-t1','1'); return {h:!!h,hh:h?Math.round(h.getBoundingClientRect().height):0,b:b&&b.textContent}; });
ok(st.h&&st.hh<50&&st.b==='Leggi tutto','testo lungo: due righe e «Leggi tutto» ('+st.hh+' px)');
await p.click('[data-t1] + .hl-more'); await p.waitForTimeout(150);
ok(await S(()=>document.querySelector('[data-t1]').getBoundingClientRect().height>50&&document.querySelector('[data-t1] + .hl-more').textContent==='Meno'),'«Leggi tutto» mostra il testo intero');
// 5. listini: categorie chiuse, si aprono toccando il titolo
st=await S(()=>({n:document.querySelectorAll('#ls-body .lsg').length,r:document.querySelectorAll('#ls-body .lsr').length,h:Math.round(document.querySelector('[data-panel="listini"]').getBoundingClientRect().height)}));
ok(st.n>=3&&st.r===0&&st.h<3000,'listini: '+st.n+' categorie chiuse, pagina corta ('+st.h+' px)');
await p.click('#ls-body .lsg >> nth=0 >> .lsh em'); await p.waitForTimeout(250);
ok(await S(()=>document.querySelectorAll('#ls-body .lsg')[0].querySelectorAll('.lsr').length>0),'toccando il titolo della categoria si apre');
await p.fill('#ls-q','punto'); await p.waitForTimeout(400);
ok(await S(()=>document.querySelectorAll('#ls-body .lsr').length>1),'cercando, le voci trovate si vedono anche nelle categorie chiuse');
await p.fill('#ls-q',''); await p.waitForTimeout(200);
// 6. Personalizza app: gruppi pieghevoli con sottotitolo
await S(()=>window.IECI_T.showPanel('app')); await p.waitForTimeout(300);
st=await S(()=>({n:document.querySelectorAll('[data-panel="app"] details.acc.apg').length,o:document.querySelectorAll('[data-panel="app"] details.acc.apg[open]').length,s:[...document.querySelectorAll('[data-panel="app"] details.apg .acc-sub')].length,h:Math.round(document.querySelector('[data-panel="app"]').getBoundingClientRect().height)}));
ok(st.n===7&&st.o===0&&st.s===7&&st.h<1500,'Personalizza app: 7 gruppi chiusi con la spiegazione ('+st.h+' px)');
await p.click('#pin-box>summary'); await p.waitForTimeout(200);
ok(await S(()=>document.getElementById('pn-set').checkVisibility()),'aperto «Blocco con PIN» si vede «Imposta il PIN»');
// Fiducia a riquadri
await S(()=>window.IECI_T.showPanel('fiducia')); await p.waitForTimeout(300);
ok(await S(()=>document.querySelectorAll('[data-panel="fiducia"] details.acc').length===6),'Fiducia: 6 riquadri (prima e dopo, lavori, recensioni, marchi, contatti, icone)');
// 7. computer: niente barra in basso, Ctrl+K apre la ricerca
await p.setViewportSize({width:1366,height:900}); await p.waitForTimeout(300);
ok(await S(()=>!document.getElementById('bnav').checkVisibility()),'sul computer la barra in basso non c\'è');
await S(()=>{ document.activeElement&&document.activeElement.blur&&document.activeElement.blur(); window.IECI_T.showPanel('prev'); });
await p.keyboard.press('Control+k'); await p.waitForTimeout(300);
ok(await S(()=>!document.getElementById('mn-drop').hidden&&document.activeElement.id==='mn-q'),'Ctrl+K apre il menu con il cursore nella ricerca');
await p.keyboard.type('acconto'); await p.keyboard.press('Enter'); await p.waitForTimeout(700);
ok(await S(()=>document.activeElement&&document.activeElement.id==='m-dep'),'scrivi «acconto» + Invio: sei sulla casella dell\'acconto');
await p.keyboard.press('Escape');
// 8. con il PIN la barra sparisce
ok(await S(()=>{ document.documentElement.classList.add('locked'); const v=document.getElementById('bnav').checkVisibility(); document.documentElement.classList.remove('locked'); return !v; }),'con l\'app bloccata la barra in basso non si vede');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
