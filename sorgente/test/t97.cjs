// Tipo «Rifacimento impianto elettrico»: listino dedicato per categorie, titolo, icona, copertina disegnata,
// collaudo e cronoprogramma propri, assistente che lo riconosce (senza rubare «appartamento a stanze», «casa» e «riparazione»)
const A=require('./_amb.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
(async()=>{const b=await A.chromium.launch();
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(A.SA);await p.waitForTimeout(1500);await p.waitForFunction(()=>window.IECI_T&&window.IECI_T.S&&window.IECI_T.asAnalizza,null,{timeout:30000});
const S=(f,a)=>p.evaluate(f,a);
let st=await S(()=>{ const t=document.querySelector('#tabs [data-m="rif"]'); const all=[...document.querySelectorAll('#tabs [data-m]')].map(x=>x.getAttribute('data-m')); return {t:t&&t.innerText.trim(),ic:!!(t&&t.querySelector('svg.ti')),pos:all.indexOf('rif')-all.indexOf('app')}; });
ok(st.t==='Rifacimento'&&st.ic&&st.pos===1,'nuovo tipo «Rifacimento» con la sua icona, subito dopo «Appartamento»');
await S(()=>document.querySelector('#tabs [data-m="rif"]').click()); await p.waitForTimeout(1600);
st=await S(()=>{ const s=window.IECI_T.S(); return {m:s.model,t:s.meta.title,n:s.cat.rif.length,g:[...new Set(s.cat.rif.map(x=>x[3]))],cov:(document.querySelector('#doc .page svg.circuit')||{innerHTML:''}).innerHTML.length,doc:document.getElementById('doc').innerText}; });
ok(st.m==='rif'&&st.t==='Rifacimento impianto elettrico','titolo «Rifacimento impianto elettrico»');
ok(st.n>=30&&['Smantellamento e opere murarie','Quadro e protezioni','Messa a terra','Linee e punti','Frutti e placche','Pratiche e certificazioni'].every(g=>st.g.indexOf(g)>-1),'listino dedicato: '+st.n+' voci in '+st.g.length+' categorie');
ok(st.cov>1500,'copertina con il disegno dedicato (vecchi cavi → quadro nuovo, linee, presa, luce, terra)');
ok(/RIFACIMENTO IMPIANTO ELETTRICO/i.test(st.doc),'il fascicolo porta il titolo');
// voci dal listino e totale
await S(()=>{ const s=window.IECI_T.S(); s.lines=[]; window.IECI_T.renderAll(); document.getElementById('acc-list').open=true; });
await p.fill('#qa-in','quadro 24'); await p.waitForTimeout(200); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
await p.fill('#qa-in','20 punto luce sempl'); await p.waitForTimeout(200); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
st=await S(()=>window.IECI_T.S().lines.map(l=>[l.d,l.q,l.p]));
ok(JSON.stringify(st)==='[["Quadro elettrico 24 moduli cablato, con differenziali e magnetotermici",1,650],["Punto luce semplice",20,45]]','aggiunta rapida dal listino del rifacimento: quadro 650 € e 20 punti luce');
ok(await S(()=>Math.abs(window.IECI_T.totals().imp-1550)<0.01),'imponibile 1.550 €');
// collaudo e cronoprogramma
st=await S(()=>{ window.IECI_T.S().show.collaudo=true; window.IECI_T.S().show.crono=true; document.getElementById('cr-def').click(); return new Promise(r=>setTimeout(()=>r(document.getElementById('doc').innerText),1800)); });
ok(/Misura della resistenza di terra/.test(st)&&/Smontaggio del vecchio impianto/.test(st),'collaudo e cronoprogramma propri del rifacimento');
// assistente
st=await S(()=>{ const f=t=>window.IECI_T.asAnalizza(t).model; return [f('rifacimento impianto elettrico villetta anni 70 con messa a terra, 20 punti luce e 30 prese'),f('impianto vecchio da mettere a norma, cavi in stoffa, nuovo quadro'),f('rifacimento appartamento con 2 camere, cucina e bagno'),f('impianto elettrico casa con 10 punti luce e 15 prese'),f('riparazione presa che fa scattare il salvavita')]; });
ok(st.join()==='rif,rif,app,dom,rip','assistente: rifacimento e messa a norma → «Rifacimento»; stanze, casa e riparazione restano come prima ('+st.join()+')');
st=await S(()=>{ const r=window.IECI_T.asAnalizza('rifacimento impianto elettrico villetta con messa a terra, quadro elettrico, 20 punti luce e 30 prese'); return r.righe.map(x=>x.q+'|'+x.d); });
ok(st.indexOf('20|Punto luce semplice')>-1&&st.indexOf('30|Punto presa 10/16 A')>-1&&st.some(x=>/^1\|Quadro elettrico 24 moduli/.test(x))&&st.some(x=>/^1\|Impianto di messa a terra/.test(x))&&st.some(x=>/^1\|Smontaggio e smaltimento/.test(x))&&st.some(x=>/^1\|Dichiarazione di conformità/.test(x)),'l\'assistente prepara le voci del rifacimento, con smontaggio, collaudo e certificazione: '+JSON.stringify(st));
// preventivi salvati prima: il listino nuovo compare
ok(await S(()=>{ const T=window.IECI_T, o=JSON.parse(JSON.stringify(T.S())); delete o.cat.rif; return T.normalize(o).cat.rif.length>=30; }),'nei dati salvati prima di oggi il listino del rifacimento si aggiunge da solo');
// prontuario
ok(await S(()=>window.IECI_T.S().model==='rif'),'il tipo resta scelto');
console.log(fail?'FAIL '+fail:'FAIL 0','ERR',JSON.stringify(errs));await b.close()})();
