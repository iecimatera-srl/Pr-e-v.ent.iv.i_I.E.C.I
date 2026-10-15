const C='preventivi-ieci-v38';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./maskable-192.png','./maskable-512.png','./icon-180.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
/* prima la rete (così trovi sempre la versione nuova), se manca internet o e' lenta usa la copia salvata */
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url); if(u.origin!==location.origin) return;
  e.respondWith(new Promise(res=>{
    let done=false; const fallback=()=>caches.match(e.request).then(h=>h||caches.match('./index.html'));
    const t=setTimeout(()=>{ if(!done) fallback().then(h=>{ if(h&&!done){ done=true; res(h); } }); },3500);
    fetch(e.request,{cache:'no-store'}).then(r=>{
      if(r&&r.ok){ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); }
      if(!done){ done=true; clearTimeout(t); res(r); }
    }).catch(()=>{ if(!done){ clearTimeout(t); fallback().then(h=>{ done=true; res(h||Response.error()); }); } });
  }));
});
