// Rubrica clienti: eliminare un cliente dal menu dei Dati o più clienti insieme dall'Archivio, con «Annulla»
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.DB,null,{timeout:20000}).catch(()=>{});await p.waitForTimeout(600);
const S=(f,a)=>p.evaluate(f,a);
const nomi=()=>S(()=>window.IECI_T.DB().clients.map(c=>c.name).sort());
await S(()=>{ const D=window.IECI_T.DB(); const t=Date.now(); D.clients=[{id:'c1',name:'Anna Verdi',addr:'Via Dante 10',tel:'347 1234567',email:'',cf:''},{id:'c2',name:'Bruno Neri',addr:'',tel:'333 1',email:'',cf:''},{id:'c3',name:'Carla Blu',addr:'',tel:'',email:'',cf:''},{id:'c4',name:'Dario Gialli',addr:'',tel:'',email:'',cf:''}];
  D.quotes=D.quotes.concat([{id:'q1',num:'2026/900',client:'Anna Verdi',name:'Anna Verdi',title:'Prova',tot:10,upd:t,model:'dom',st:'bozza',data:JSON.parse(JSON.stringify(window.IECI_T.S()))}]); });

// 1. dal menu «Rubrica» nei Dati: cestino accanto al cliente, conferma con il secondo tocco
await A.mostra(p,'#k-open'); await p.click('#k-open'); await p.waitForTimeout(200);
let st=await S(()=>({n:document.querySelectorAll('#k-list [data-kdel]').length,g:!!document.querySelector('#k-list [data-kgest]')}));
ok(st.n===4&&st.g,'menu Rubrica: cestino accanto a ogni cliente e «Gestisci la rubrica»');
await p.click('#k-list [data-kdel="c2"]'); await p.waitForTimeout(150);
ok((await nomi()).length===4&&await S(()=>document.querySelector('#k-list [data-kdel="c2"]').textContent==='Elimina?'),'primo tocco: chiede conferma («Elimina?»), non cancella');
await p.click('#k-list [data-kdel="c2"]'); await p.waitForTimeout(200);
st=await S(()=>({t:document.getElementById('toast').innerText,b:!!document.querySelector('#toast .toast-b'),open:!document.getElementById('k-list').hidden,n:document.querySelectorAll('#k-list [data-kdel]').length,del:!!window.IECI_T.DB().del.c2}));
ok(JSON.stringify(await nomi())==='["Anna Verdi","Carla Blu","Dario Gialli"]'&&st.del,'secondo tocco: Bruno Neri eliminato dalla rubrica');
ok(st.b&&/I preventivi salvati restano/.test(st.t)&&st.open&&st.n===3,'avviso con «Annulla», il menu resta aperto e aggiornato');
await p.click('#toast .toast-b'); await p.waitForTimeout(200);
ok((await nomi()).length===4&&!(await S(()=>window.IECI_T.DB().del.c2)),'«Annulla»: il cliente torna in rubrica');

// 2. dall'Archivio: più clienti insieme, «Seleziona chi non ha preventivi»
await S(()=>document.querySelector('#k-list [data-kgest]').click()); await p.waitForTimeout(300);
ok(await S(()=>!document.querySelector('[data-panel="archivio"]').hidden),'«Gestisci la rubrica» apre l\'elenco dei clienti');
st=await S(()=>({rows:document.querySelectorAll('#c-list .rubr').length,info:document.querySelector('#c-list .rubr').innerText}));
ok(st.rows===4&&/1 preventivo in archivio/.test(st.info),'per ogni cliente: quanti preventivi ha in archivio');
await p.click('#c-list [data-csz]'); await p.waitForTimeout(200);
st=await S(()=>({sel:[...document.querySelectorAll('#c-list [data-csel]:checked')].map(x=>x.getAttribute('data-csel')).sort(),bar:document.querySelector('#c-list .rubdel')&&document.querySelector('#c-list .rubdel').innerText}));
ok(JSON.stringify(st.sel)==='["c2","c3","c4"]'&&/3 clienti selezionati/.test(st.bar),'«Seleziona chi non ha preventivi»: 3 clienti');
await p.click('#c-list [data-csel="c4"]'); await p.waitForTimeout(150);
ok(await S(()=>/2 clienti selezionati/.test(document.querySelector('#c-list .rubdel').innerText)),'tolgo uno dalla selezione');
await p.click('#c-list [data-cxs]'); await p.waitForTimeout(200);
ok(JSON.stringify(await nomi())==='["Anna Verdi","Dario Gialli"]','eliminati i 2 clienti selezionati');
ok(await S(()=>window.IECI_T.DB().quotes.some(q=>q.client==='Anna Verdi')),'i preventivi in archivio non si toccano');
// singolo dall'Archivio con conferma
await p.click('#c-list [data-cx="c4"]'); await p.waitForTimeout(100); await p.click('#c-list [data-cx="c4"]'); await p.waitForTimeout(200);
ok(JSON.stringify(await nomi())==='["Anna Verdi"]','«Elimina» sul singolo cliente (con conferma)');
// resta eliminato dopo aver riaperto l'app
await p.waitForTimeout(800); await p.reload(); await p.waitForTimeout(2000);
ok(JSON.stringify(await nomi())==='["Anna Verdi"]','riaprendo l\'app i clienti eliminati non tornano');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
