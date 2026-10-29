const C='preventivi-ieci-2026.10.29.1';
const SHELL=['./','./index.html','./lib-pdf.js','./lib-pdfjs.txt','./lib-pdfjs-worker.txt','./manifest.webmanifest','./icon-192.png','./icon-512.png','./maskable-192.png','./maskable-512.png','./icon-180.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
/* documenti condivisi da altre app (WhatsApp, email, file): li tengo da parte e apro l'assistente */
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='POST'||u.origin!==location.origin||!u.pathname.endsWith('/condividi')) return;
  e.respondWith((async()=>{
    try{
      const fd=await e.request.formData(), c=await caches.open('ieci-condivisi');
      for(const k of await c.keys()) await c.delete(k);
      let i=0; for(const f of fd.getAll('file')){ if(f&&typeof f!=='string') await c.put('./condiviso/'+(i++),new Response(f,{headers:{'content-type':f.type||'application/octet-stream','x-nome':encodeURIComponent(f.name||'documento')}})); }
      const t=['title','text','url'].map(k=>fd.get(k)).filter(x=>typeof x==='string'&&x.trim()).join('\n');
      if(t) await c.put('./condiviso/testo',new Response(t,{headers:{'content-type':'text/plain;charset=utf-8'}}));
    }catch(x){}
    return Response.redirect('./index.html?condiviso=1',303);
  })());
});
/* prima la rete (così trovi sempre la versione nuova), se manca internet o e' lenta usa la copia salvata */
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url); if(u.origin!==location.origin) return; if(u.pathname.endsWith('version.json')) return;
  e.respondWith(new Promise(res=>{
    let done=false; const fallback=()=>caches.match(e.request).then(h=>h||caches.match('./index.html'));
    const t=setTimeout(()=>{ if(!done) fallback().then(h=>{ if(h&&!done){ done=true; res(h); } }); },3500);
    fetch(e.request,{cache:'no-store'}).then(r=>{
      if(r&&r.ok){ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); }
      if(!done){ done=true; clearTimeout(t); res(r); }
    }).catch(()=>{ if(!done){ clearTimeout(t); fallback().then(h=>{ done=true; res(h||Response.error()); }); } });
  }));
});
