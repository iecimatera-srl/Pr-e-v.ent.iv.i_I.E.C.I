const {chromium}=require('./_amb.cjs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:900,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const R=[];const ck=(n,v)=>R.push((v?'OK   ':'FAIL ')+n);
const calls=[];let treeBody=null,commitBody=null,refBody=null,mode='ok';
await p.route('https://api.github.com/**',async route=>{const rq=route.request();const u=new URL(rq.url());const m=rq.method();const path=u.pathname;let body=null;try{body=rq.postDataJSON();}catch(e){}
 calls.push(m+' '+path);const J=(o,s=200)=>route.fulfill({status:s,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'},body:JSON.stringify(o)});
 if(m==='OPTIONS') return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});
 if(mode==='401') return J({message:'Bad credentials'},401);
 if(path==='/repos/me/prev'&&m==='GET') return J({default_branch:'main'});
 if(path==='/repos/me/prev/git/ref/heads/main'&&m==='GET') return J({object:{sha:'c0ffee1'}});
 if(path==='/repos/me/prev/git/refs/heads/main'&&m==='PATCH'){refBody=body;return J({ok:1});}
 if(path==='/repos/me/prev/git/commits/c0ffee1') return J({tree:{sha:'t0'}});
 if(path==='/repos/me/prev/git/blobs'){(global.BL=global.BL||[]).push(Buffer.from(body.content,'base64'));return J({sha:'b'+calls.length});}
 if(path==='/repos/me/prev/git/trees'){treeBody=body;return J({sha:'t1'});}
 if(path==='/repos/me/prev/git/commits'&&m==='POST'){commitBody=body;return J({sha:'abcdef123456'});}
 return J({message:'Not Found'},404);});
await p.goto(require('./_amb.cjs').SA);await p.waitForTimeout(1500);
p.on('dialog',d=>d.accept());
await p.click('#mn-btn');await p.click('.mit[data-p=salva]');await p.evaluate(()=>document.getElementById('acc-pub').open=true);
await p.fill('#pb-repo','https://github.com/me/prev.git');await p.fill('#pb-tok','github_pat_TEST');
// zip sbagliato (Windows)
await p.setInputFiles('#pb-file',require('./_amb.cjs').ZIPW);await p.waitForTimeout(1500);
ck('zip Windows rifiutato',await p.evaluate(()=>/zip sbagliato/.test(document.getElementById('pb-out').textContent)));
// token invalido
mode='401';await p.setInputFiles('#pb-file',require('./_amb.cjs').ZIPA);await p.waitForTimeout(1500);
ck('401 spiegato',await p.evaluate(()=>/Token non valido/.test(document.getElementById('pb-out').textContent)));
mode='ok';calls.length=0;
await p.setInputFiles('#pb-file',require('./_amb.cjs').ZIPA);await p.waitForTimeout(4000);
const out=await p.evaluate(()=>document.getElementById('pb-out').textContent);
ck('pubblicazione riuscita: '+out.slice(0,90),/Pubblicata/.test(out));
const paths=treeBody?treeBody.tree.map(t=>t.path).sort():[];
ck('albero: index.html, sw.js, version.json senza cartella '+paths.join(','),paths.includes('index.html')&&paths.includes('sw.js')&&paths.includes('version.json')&&paths.every(x=>!x.includes('/')));
ck('base_tree e parent',treeBody&&treeBody.base_tree==='t0'&&commitBody&&commitBody.parents[0]==='c0ffee1'&&/Aggiornamento IECI preventivi 2026/.test(commitBody.message));
ck('ref aggiornato',refBody&&refBody.sha==='abcdef123456');
ck('un blob per file',calls.filter(c=>c.includes('/git/blobs')).length===paths.length);
// contenuto blob = index.html corretto? (controlla dimensione base64 via ultima chiamata non possibile) -> verifica persistenza campi
await p.reload();await p.waitForTimeout(1200);
ck('config ricordata',await p.evaluate(()=>document.getElementById('pb-repo').value==='me/prev'&&document.getElementById('pb-tok').value==='github_pat_TEST'));
await p.click('#mn-btn');await p.click('.mit[data-p=salva]');await p.evaluate(()=>document.getElementById('acc-pub').open=true);await p.click('#pb-clr');
ck('dimentica token',await p.evaluate(()=>document.getElementById('pb-tok').value===''&&!JSON.parse(localStorage.getItem('ieci-pub')).tok));
const fs=require('fs');const sz=fs.statSync(require('./_amb.cjs').PWA_INDEX).size;ck('contenuto index.html identico (byte)',(global.BL||[]).some(b=>b.length===sz&&b.equals(fs.readFileSync(require('./_amb.cjs').PWA_INDEX))));
console.log(R.join('\n'));console.log('errs',errs);await b.close();})();
