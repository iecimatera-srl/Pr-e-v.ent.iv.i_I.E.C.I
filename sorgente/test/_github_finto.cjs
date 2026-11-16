// GitHub finto per le prove: un archivio privato con il file dell'archivio e la cartella delle foto.
// archivio() restituisce il file dell'archivio con le foto già rimesse al loro posto (come lo vede l'app).
const stato={files:{},n:0,put:0,get:0,rotte:new Set(),storia:[]};
const FILE='archivio-preventivi-ieci.json';
function percorso(u){ const m=u.match(/\/contents\/(.+?)(\?|$)/); return m?decodeURIComponent(m[1]):''; }
async function finto(ctx,repo){
  await ctx.route('https://api.github.com/**',async r=>{
    const u=r.request().url(), m=r.request().method(), raw=/raw/.test(r.request().headers()['accept']||''), pth=percorso(u);
    // versioni precedenti dell'archivio (come la cronologia dei salvataggi di GitHub)
    if(/\/commits\?/.test(u)) return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(stato.storia.slice().reverse().map(v=>({sha:v.sha})))});
    if(pth){
      const ref=(u.match(/[?&]ref=([^&]+)/)||[])[1];
      if(ref&&m==='GET'){ const v=stato.storia.find(x=>x.sha===ref); if(!v) return r.fulfill({status:404,body:'{}'}); stato.get++; return r.fulfill({status:200,contentType:'application/octet-stream',body:Buffer.from(v.b64,'base64')}); }
      const f=stato.files[pth];
      if(m==='PUT'){ const b=JSON.parse(r.request().postData()); if(f&&b.sha!==f.sha) return r.fulfill({status:f&&!b.sha?422:409,body:'{}'}); stato.files[pth]={sha:'s'+(++stato.n),b64:b.content}; stato.put++; if(pth===FILE) stato.storia.push({sha:stato.files[pth].sha,b64:b.content}); return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({content:{sha:stato.files[pth].sha}})}); }
      if(!f||stato.rotte.has(pth)) return r.fulfill({status:404,body:'{}'});
      stato.get++;
      if(!raw) return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({sha:f.sha})});
      return r.fulfill({status:200,contentType:'application/octet-stream',body:Buffer.from(f.b64,'base64')});
    }
    return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({private:true})});
  });
  await ctx.addInitScript((repo)=>{ try{ if(!localStorage.getItem('ieci-gh')) localStorage.setItem('ieci-gh',JSON.stringify({repo:repo,token:'github_pat_prova',on:true,auto:true,every:10})); }catch(e){} },repo||'iecimatera/preventivi-ieci-dati');
}
function grezzo(){ const f=stato.files[FILE]; return f?JSON.parse(Buffer.from(f.b64,'base64').toString('utf8')):null; }
function archivio(){
  const o=grezzo(); if(!o) return null; const mi=o.foto||{};
  (function giro(x){ if(Array.isArray(x)){ x.forEach((v,i)=>{ if(typeof v==='string'&&v.startsWith('ghf:')){ const c=v.slice(4); const k=Object.keys(stato.files).find(p=>p.startsWith('foto/'+c+'.')); if(k) x[i]='data:'+(mi[c]||'image/jpeg')+';base64,'+stato.files[k].b64; } else if(v&&typeof v==='object') giro(v); }); return; } for(const k in x){ const w=x[k]; if(typeof w==='string'&&w.startsWith('ghf:')){ const c=w.slice(4); const kk=Object.keys(stato.files).find(p=>p.startsWith('foto/'+c+'.')); if(kk) x[k]='data:'+(mi[c]||'image/jpeg')+';base64,'+stato.files[kk].b64; } else if(w&&typeof w==='object') giro(w); } })(o);
  return o;
}
// riscrive il file dell'archivio (le foto in linea, come faceva una versione vecchia)
function scrivi(o){ stato.files[FILE]={sha:'s'+(++stato.n),b64:Buffer.from(JSON.stringify(o)).toString('base64')}; stato.storia.push({sha:stato.files[FILE].sha,b64:stato.files[FILE].b64}); }
module.exports={stato,finto,grezzo,archivio,scrivi,FILE};
