// Doctor Plant service worker — غيّر رقم النسخة هون كل ما ترفع تحديث جديد
const VER='v19',CACHE='doctor-plant-'+VER;
const CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png','favicon-32.png','favicon.ico','Doctor-Plant-User-Guide.pdf','doctor-plant-card.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('doctor-plant-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  // لا نلمس الطلبات الخارجية (GitHub API، الذكاء الاصطناعي، العدّاد) ولا غير GET
  if(r.method!=='GET'||u.origin!==location.origin)return;
  // الصفحة نفسها: الشبكة أولاً عشان التحديثات توصل، والكاش عند انقطاع النت
  if(r.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.endsWith('/')){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html')||caches.match('./'))));
    return;
  }
  // باقي الملفات: من الكاش فوراً وتتحدث بالخلفية
  e.respondWith(caches.match(r).then(m=>{
    const net=fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res}).catch(()=>m);
    return m||net;
  }));
});
