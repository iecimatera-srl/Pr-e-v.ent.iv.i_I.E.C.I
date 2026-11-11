// Riordino 2026.11: percorso Cliente → Voci → Prezzo → Invio con il prossimo passo, riquadri aperti solo se servono,
// voci compatte con «Altro», tipo di preventivo su una riga con icone, menu riordinato (e quello personalizzato rispettato), barra sottile
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.flowState,null,{timeout:30000});
const S=(f,a)=>p.evaluate(f,a);
const flow=()=>S(()=>({s:[...document.querySelectorAll('#flow .fl-b')].map(b=>b.className.replace('fl-b ','')+'|'+b.querySelector('b').textContent+'|'+b.querySelector('small').textContent),n:document.querySelector('#flow .fl-n p').innerText,a:[...document.querySelectorAll('#flow [data-fla]')].map(b=>b.getAttribute('data-fla'))}));

// 1. menu: «Ogni giorno» in cima con Preventivo, Dati, Invio, Archivio
let st=await S(()=>({g:[...document.querySelectorAll('#mn-drop .mgt')].map(e=>e.textContent),i:[...document.querySelectorAll('#mn-drop .mgi')][0]?[...[...document.querySelectorAll('#mn-drop .mgi')][0].querySelectorAll('.mit')].map(e=>e.getAttribute('data-p')):[]}));
ok(st.g.join('|')==='Ogni giorno|Fascicolo per il cliente|Listini, fornitori e messaggi|Azienda e app'&&st.i.join()==='home,prev,dati,invio,archivio','menu in 4 gruppi, «Ogni giorno» per primo: '+st.g.join(' | '));
// il menu com'era prima, mai toccato, passa al nuovo; uno personalizzato resta com'è
st=await S(()=>{ const T=window.IECI_T; const v2=(n)=>{ const g={g1:['dati','prev','prodotti','contenuto','pagine'],g5:['piante','stime','fiducia','cond','documenti','invio','messaggi'],g2:['archivio','fornitori','listini'],g3:['azienda','stile'],g4:['salva','app','menu']},it=[]; Object.keys(g).forEach(k=>g[k].forEach(x=>it.push({p:x,g:k,on:true}))); return {v:2,mode:'menu',names:n||{},groups:[{id:'g1',n:'Preventivo'},{id:'g5',n:'Allegati e invio'},{id:'g2',n:'Catalogo e archivio'},{id:'g3',n:'Azienda e stile'},{id:'g4',n:'Gestione app'}],items:it}; };
  const prova=(o)=>{ localStorage.setItem('ieci-menu',JSON.stringify(o)); T.menuLoad(); return T.MENU(); };
  const a=prova(v2({prev:'Prezzi e voci'})); const c=v2(); c.items[5].on=false; const b=prova(c);
  const r={a:[a.v,a.groups[0].n,a.names.prev],b:[b.v,b.groups[0].n,b.items.find(i=>i.p==='piante').on]}; localStorage.removeItem('ieci-menu'); T.menuLoad(); return r; });
ok(st.a.join()==='3,Ogni giorno,Prezzi e voci','menu mai personalizzato: passa al nuovo ordine e tiene i nomi che avevi dato');
ok(st.b.join()==='3,Preventivo,false','menu personalizzato: resta com\'era');

// 2. percorso: preventivo d'esempio con cliente senza telefono
await S(()=>window.IECI_T.showPanel('prev'));
st=await flow();
ok(st.s[0]==='ok warn|Cliente|senza tel.'&&/^ok\|Voci\|4 voci$/.test(st.s[1])&&/^ok\|Prezzo\|1\.664,08 €$/.test(st.s[2])&&/^todo cur\|Invio\|da inviare$/.test(st.s[3]),'4 passi con lo stato: '+JSON.stringify(st.s));
ok(/Tutto pronto/.test(st.n)&&st.a.join()==='send','prossimo passo: «Tutto pronto … Invia il preventivo»');
// riquadri: con le voci già presenti assistente e listino chiusi, voci aperte, prezzo chiuso con il totale nel titolo
st=await S(()=>({as:document.getElementById('acc-as').open,li:document.getElementById('acc-list').open,ri:document.getElementById('acc-righe').open,pr:document.getElementById('acc-prezzo').open,prn:document.getElementById('acc-prezzo-n').textContent,sv:document.getElementById('acc-save').open,lin:document.getElementById('acc-list-n').textContent}));
ok(!st.as&&!st.li&&st.ri&&!st.pr&&!st.sv,'aperte solo le voci; assistente, listino, prezzo e salvati chiusi');
ok(st.prn==='1.664,08 €'&&/^\d+ voci$/.test(st.lin),'i titoli chiusi dicono già cosa c\'è: '+st.prn+' · listino '+st.lin);
// tocco «Invia il preventivo»: si apre la condivisione
await p.click('#flow [data-fla="send"]'); await p.waitForTimeout(500);
ok(await S(()=>!document.getElementById('sh-bg').hidden),'«Invia il preventivo» apre la condivisione');
await S(()=>{ document.getElementById('sh-bg').hidden=true; });
// segno inviato: compare «Accettato / Rifiutato»
await S(()=>{ const s=window.IECI_T.S(); s.meta.status='inviato'; window.IECI_T.touch(); window.IECI_T.renderFlow(); });
st=await flow(); ok(/^ok\|Invio\|inviato$/.test(st.s[3])&&st.a.join()==='ok,no','inviato: chiede com\'è andata (Accettato / Rifiutato)');
await p.click('#flow [data-fla="ok"]'); await p.waitForTimeout(300);
st=await flow(); ok(await S(()=>window.IECI_T.S().meta.status)==='accettato'&&/Accettato\|lavoro confermato/.test(st.s[3])&&/confermato/.test(st.n),'«Accettato» segna il preventivo e il percorso lo mostra');
// 3. preventivo nuovo: chiede il cliente, poi le voci; riquadri adatti a un preventivo vuoto
await S(()=>{ const s=window.IECI_T.S(); s.meta.status='bozza'; s.lines=[]; s.client={name:'',addr:'',tel:'',email:'',cf:''}; s.meta.num='2026/050'; window.IECI_T.renderAll(); window.IECI_T.touch(); window.IECI_T.renderFlow(); });
st=await flow();
ok(/^todo cur\|Cliente\|manca il nome$/.test(st.s[0])&&/a chi/.test(st.n)&&st.a.join()==='cli','preventivo vuoto: per prima cosa il cliente');
st=await S(()=>({as:document.getElementById('acc-as').open,li:document.getElementById('acc-list').open}));
ok(st.as&&st.li,'preventivo vuoto: assistente e listino aperti');
await p.click('#flow [data-fla="cli"]'); await p.waitForTimeout(500);
ok(await S(()=>!document.querySelector('[data-panel="dati"]').hidden&&document.activeElement&&document.activeElement.id==='k-name'),'«Scrivi il cliente» porta al nome del cliente');
await p.fill('#k-name','Paolo Neri'); await p.waitForTimeout(300); await S(()=>window.IECI_T.showPanel('prev')); await p.waitForTimeout(300);
st=await flow(); ok(/^ok warn\|Cliente\|senza tel\.$/.test(st.s[0])&&/^todo cur\|Voci\|nessuna voce$/.test(st.s[1])&&st.a.join()==='list,as',JSON.stringify(st)+' poi le voci: dal listino o con l\'assistente');
await p.click('#flow [data-fla="list"]'); await p.waitForTimeout(400);
await p.click('#cat [data-add="0"]'); await p.waitForTimeout(400);
await S(()=>{ const s=window.IECI_T.S(); s.lines.push({d:'Voce senza prezzo',u:'cad',q:1,p:0,s:0}); window.IECI_T.renderAll(); window.IECI_T.touch(); window.IECI_T.renderFlow(); });
st=await flow(); ok(/^warn cur\|Voci\|1 senza prezzo$/.test(st.s[1])&&/senza prezzo/.test(st.n)&&st.a.join()==='zero','una voce senza prezzo: lo dice e mostra quale');
await p.click('#flow [data-fla="zero"]'); await p.waitForTimeout(700);
ok(await S(()=>!!document.querySelector('#lines .line.flash')),'«Mostrami quali» evidenzia la voce');
await S(()=>{ const s=window.IECI_T.S(); s.lines[1].p=50; window.IECI_T.renderAll(); window.IECI_T.touch(); window.IECI_T.renderFlow(); });
st=await flow(); ok(/^ok\|Voci/.test(st.s[1])&&/^ok\|Prezzo/.test(st.s[2])&&/Tutto pronto/.test(st.n),'sistemato il prezzo: tutto pronto');
// totale libero a zero: il passo Prezzo lo segnala
await S(()=>{ const s=window.IECI_T.S(); s.econ.mode='totale'; s.econ.total=''; window.IECI_T.renderAll(); window.IECI_T.touch(); window.IECI_T.renderFlow(); });
st=await flow(); ok(/^todo cur\|Prezzo\|da fare$/.test(st.s[2])&&/totale è a zero/.test(st.n),'totale libero vuoto: il passo Prezzo lo chiede');
await S(()=>{ const s=window.IECI_T.S(); s.econ.mode='righe'; window.IECI_T.renderAll(); window.IECI_T.touch(); });

// 4. voci compatte: a vista descrizione, quantità, unità, prezzo e totale; il resto in «Altro»
await A.mostra(p,'#lines');
st=await S(()=>{ const r=document.querySelector('#lines .line[data-i="0"]'); const vis=e=>!!e&&e.checkVisibility(); return {d:vis(r.querySelector('[data-f="d"]')),q:vis(r.querySelector('[data-f="q"]')),u:vis(r.querySelector('[data-f="u"]')),p:vis(r.querySelector('[data-f="p"]')),t:vis(r.querySelector('.tot')),x:vis(r.querySelector('[data-rm]')),s:vis(r.querySelector('[data-f="s"]')),dup:vis(r.querySelector('[data-ldup]')),h:r.getBoundingClientRect().height}; });
ok(st.d&&st.q&&st.u&&st.p&&st.t&&st.x&&!st.s&&!st.dup&&st.h<230,JSON.stringify(st)+' voce compatta ('+Math.round(st.h)+' px): a vista l\'essenziale, sconto e duplica in «Altro»');
await p.click('#lines .line[data-i="0"] .lmore>summary'); await p.waitForTimeout(250);
await p.fill('#lines .line[data-i="0"] [data-f="s"]','10'); await p.waitForTimeout(400);
await S(()=>{ window.IECI_T.S().lines.unshift({d:'Voce nuova in cima',u:'cad',q:1,p:5,s:0}); window.IECI_T.renderAll(); }); await p.waitForTimeout(300);
st=await S(()=>{ const r=document.querySelector('#lines .line[data-i="1"]'), r0=document.querySelector('#lines .line[data-i="0"]'); return {o1:r.querySelector('.lmore').open,o0:r0.querySelector('.lmore').open,sm:r.querySelector('.lmore>summary small').textContent}; });
ok(st.o1&&!st.o0,'«Altro» resta aperto sulla sua voce anche se l\'ordine cambia');
ok(/sconto 10%/.test(st.sm),'il titolo di «Altro» riassume le scelte: '+st.sm);
await p.click('#lines .line[data-i="1"] .lmore>summary'); await p.waitForTimeout(250);
ok(await S(()=>!document.querySelector('#lines .line[data-i="1"] .lmore').open),'«Altro» si richiude');
const n0=await S(()=>window.IECI_T.S().lines.length); await p.click('#lines .line[data-i="0"] [data-rm]'); await p.waitForTimeout(300);
ok(await S(()=>window.IECI_T.S().lines.length)===n0-1,'il cestino toglie la voce');

// 5. tipo di preventivo: una riga con icone, il tipo scelto si vede
st=await S(()=>{ const t=document.getElementById('tabs'); return {n:t.querySelectorAll('.tab svg.ti').length,h:t.getBoundingClientRect().height,sc:t.scrollWidth>t.clientWidth}; });
ok(st.n===13&&st.h<60&&st.sc,'13 tipi con icona su una riga sola che scorre');
await S(()=>document.querySelector('#tabs [data-m="sw"]').click()); await p.waitForTimeout(300);
st=await S(()=>{ const t=document.getElementById('tabs'), b=t.querySelector('[aria-pressed="true"]'), tr=t.getBoundingClientRect(), br=b.getBoundingClientRect(); return {m:window.IECI_T.S().model,in:br.left>=tr.left-1&&br.right<=tr.right+1}; });
ok(st.m==='sw'&&st.in,'scelto l\'ultimo tipo, resta in vista nella fila');
await S(()=>document.querySelector('#tabs [data-m="dom"]').click()); await p.waitForTimeout(300);

// 6. barra del preventivo: scorrendo diventa sottile, tornando su torna grande, senza tremolii
await S(()=>window.scrollTo(0,900)); await p.waitForTimeout(300);
const h1=await S(()=>({m:document.getElementById('qbar').classList.contains('mini'),h:document.getElementById('qbar').getBoundingClientRect().height}));
await S(()=>window.scrollTo(0,0)); await p.waitForTimeout(300);
const h0=await S(()=>({m:document.getElementById('qbar').classList.contains('mini'),h:document.getElementById('qbar').getBoundingClientRect().height}));
ok(h1.m&&!h0.m&&h1.h<h0.h-20,'barra sottile scorrendo ('+Math.round(h1.h)+' px invece di '+Math.round(h0.h)+')');
let cambi=0; await S(()=>{ window.__mc=0; new MutationObserver(()=>window.__mc++).observe(document.getElementById('qbar'),{attributes:true,attributeFilter:['class']}); });
for(const y of [150,300,421,430,300,200,141,139,300]){ await S(y=>window.scrollTo(0,y),y); await p.waitForTimeout(80); }
cambi=await S(()=>window.__mc); ok(cambi<=3,'nessun tremolio vicino al punto di passaggio ('+cambi+' cambi)');

// 7. telefono stretto: niente esce dallo schermo nel pannello Preventivo
await p.setViewportSize({width:360,height:780}); await S(()=>{ window.scrollTo(0,0); document.querySelectorAll('[data-panel="prev"] details').forEach(d=>d.open=true); }); await p.waitForTimeout(400);
st=await S(()=>{ const o=[]; document.querySelectorAll('[data-panel="prev"] *').forEach(e=>{ if(e.closest('.tabs.tipo')) return; const r=e.getBoundingClientRect(); if(r.width&&r.right>innerWidth+1) o.push((e.className||e.tagName)+''); }); return o; });
ok(!st.length,'360 px: niente esce dallo schermo '+JSON.stringify(st.slice(0,4)));
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
