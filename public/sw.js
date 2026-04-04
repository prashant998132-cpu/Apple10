const C='jarvis-v10';const O='/offline.html';

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(['/','offline.html','/icons/icon-192.png','/icons/icon-512.png','/icons/maskable-192.png']).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.pathname.startsWith('/api/')){
    e.respondWith(fetch(e.request).catch(()=>new Response(JSON.stringify({error:'Offline',offline:true}),{headers:{'Content-Type':'application/json'}})));
    return;
  }
  if(u.pathname.startsWith('/icons/')||u.pathname.startsWith('/_next/static/')){
    e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{if(r.ok)caches.open(C).then(ca=>ca.put(e.request,r.clone()));return r;}).catch(()=>c)));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{if(r.ok)caches.open(C).then(ca=>ca.put(e.request,r.clone()));return r;}).catch(()=>caches.match(e.request).then(c=>c||new Response(`<!DOCTYPE html><html><body style="background:#0a0b0f;color:#e2e8f0;font-family:sans-serif;text-align:center;padding:40px"><h1>📵 Offline</h1><p>Internet nahi hai</p><button onclick="location.reload()" style="background:#6366f1;border:none;color:white;padding:12px 24px;border-radius:8px;cursor:pointer">Try Again</button></body></html>`,{headers:{'Content-Type':'text/html'}}))));
});

// ── Push notifications ────────────────────────────────────
self.addEventListener('push',e=>{
  let d={title:'JARVIS',body:'Update hai!',icon:'/icons/icon-192.png'};
  try{if(e.data)d={...d,...e.data.json()};}catch{}
  e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:d.icon,badge:'/icons/icon-96.png',vibrate:[200,100,200],data:d,actions:[{action:'open',title:'Open'},{action:'dismiss',title:'Dismiss'}]}));
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  if(e.action==='dismiss')return;
  const url=e.notification.data?.url||'/';
  e.waitUntil(clients.matchAll({type:'window'}).then(ws=>{
    for(const w of ws)if('focus' in w&&w.url.includes(self.location.origin))return w.focus();
    return clients.openWindow(url);
  }).catch(()=>{}));
});

// ── Background Proactive Engine ──────────────────────────
// Fires when OS allows background sync — even app closed
self.addEventListener('sync',e=>{
  if(e.tag==='jarvis-morning-check')e.waitUntil(morningCheck());
  if(e.tag==='jarvis-sync')e.waitUntil(self.clients.matchAll().then(cs=>cs.forEach(c=>c.postMessage({type:'SYNC'}))));
});

// Periodic background sync (Chrome Android supports this)
self.addEventListener('periodicsync',e=>{
  if(e.tag==='jarvis-proactive')e.waitUntil(proactiveCheck());
});

async function proactiveCheck(){
  const now=new Date();
  const hour=now.getHours();
  const min=now.getMinutes();
  const dateKey=now.toDateString();
  
  // Get stored data
  let done=[];
  try{
    const db=await openDB();
    const tx=db.transaction('proactive','readonly');
    const store=tx.objectStore('proactive');
    const req=store.get(dateKey);
    done=await promisify(req)||[];
  }catch{
    // IndexedDB failed — use cache storage as fallback
    try{
      const cache=await caches.open('jarvis-proactive');
      const resp=await cache.match('done-'+dateKey);
      if(resp)done=await resp.json();
    }catch{}
  }
  
  // Get user profile from cache
  let name='Bhai';
  let lat=24.5362,lon=81.3003,city='Aapke Shehar';
  try{
    const cache=await caches.open('jarvis-proactive');
    const profResp=await cache.match('profile');
    if(profResp){const p=await profResp.json();name=p.name||'Bhai';lat=p.lat||lat;lon=p.lon||lon;city=p.city||city;}
  }catch{}
  
  const notify=async(id,title,body,url='/')=>{
    if(done.includes(id))return;
    await self.registration.showNotification(title,{
      body,icon:'/icons/icon-192.png',badge:'/icons/icon-96.png',
      vibrate:[150,80,150],data:{url},
      tag:id,renotify:false,
    });
    done.push(id);
    // Save done list
    try{
      const cache=await caches.open('jarvis-proactive');
      await cache.put('done-'+dateKey,new Response(JSON.stringify(done),{headers:{'Content-Type':'application/json'}}));
    }catch{}
  };
  
  // Morning weather + brief (8:00-8:10 AM)
  if(hour===8&&min<10){
    try{
      const w=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`,{signal:AbortSignal.timeout(5000)});
      if(w.ok){
        const wd=await w.json();const c=wd.current;
        const temp=Math.round(c.temperature_2m);
        const wc=c.weathercode;
        const desc=wc<=1?'Saaf asmaan ☀️':wc<=3?'Thode badal ⛅':wc<=48?'Kohra 🌫️':wc<=67?'Baarish 🌧️':'Toofan ⛈️';
        const tip=wc>=51?'Chhata le jaana!':temp>38?'Bahut garmi — paani piyo!':temp<12?'Thandi hai — jacket pehno!':'Mausam sahi hai!';
        await notify('morning',`🌅 Subah Mubarak, ${name}!`,`${city}: ${temp}°C — ${desc}. ${tip}`,'/');
      }else{
        await notify('morning',`🌅 Subah Mubarak, ${name}!`,`Aaj ka din mast jayega! 💪`,'/');
      }
    }catch{
      await notify('morning',`🌅 Subah Mubarak, ${name}!`,`Naya din, nayi energy! 💪`,'/');
    }
  }
  
  // Rain alert (10 AM check)
  if(hour===10&&min<10){
    try{
      const w=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weathercode,temperature_2m&timezone=auto`,{signal:AbortSignal.timeout(4000)});
      if(w.ok){
        const wd=await w.json();const wc=wd.current.weathercode;const temp=Math.round(wd.current.temperature_2m);
        if(wc>=51)await notify('rain',`☂️ Baarish alert, ${name}!`,`${city} mein baarish ho sakti hai. Chhata le jaana!`);
        else if(temp>38)await notify('heat',`🥵 Garmi alert, ${name}!`,`${temp}°C! Paani peete raho, dhoop 12-4 avoid karo.`);
      }
    }catch{}
  }
  
  // Lunch reminder (1:00-1:05 PM)
  if(hour===13&&min<5){
    await notify('lunch',`🍽️ Lunch time, ${name}!`,`Kha lo — aur 2 glass paani bhi piyo 💧`);
  }
  
  // Evening review (8:00-8:05 PM)
  if(hour===20&&min<5){
    await notify('evening',`🌙 Shaam ho gayi, ${name}!`,`Aaj ka din kaisa raha? Goals check karo! 🎯`,'/');
  }
  
  // Eye care every 2 hrs (8 AM - 8 PM)
  if(min<5&&hour%2===0&&hour>=8&&hour<=20){
    await notify(`eye_${hour}`,`👁️ Screen break, ${name}!`,`20-20-20 rule: 20 seconds ke liye 20 feet door dekho!`);
  }
  
  // Late night (midnight-4 AM)
  if(hour>=0&&hour<4&&min<5){
    await notify('midnight',`🦉 Raat ke ${hour} baj gaye!`,`${name}, so jao — neend se brain recharge hota hai 😴`);
  }
}

async function morningCheck(){
  return proactiveCheck();
}

// ── Message handler ──────────────────────────────────────
self.addEventListener('message',e=>{
  if(e.data?.type==='SKIP_WAITING')self.skipWaiting();
  
  // Store profile data for background use
  if(e.data?.type==='STORE_PROFILE'){
    const{name,lat,lon,city}=e.data;
    caches.open('jarvis-proactive').then(cache=>{
      cache.put('profile',new Response(JSON.stringify({name,lat,lon,city}),{headers:{'Content-Type':'application/json'}}));
    });
  }
  
  // Register periodic sync from app
  if(e.data?.type==='REGISTER_PERIODIC_SYNC'){
    if('periodicSync' in self.registration){
      self.registration.periodicSync.register('jarvis-proactive',{minInterval:60*60*1000}).catch(()=>{});
    }
    // Also register one-time background sync for morning
    self.registration.sync.register('jarvis-morning-check').catch(()=>{});
  }
  
  if(e.data?.type==='QUEUE_FLUSHED'){
    self.clients.matchAll().then(cs=>cs.forEach(c=>c.postMessage({type:'QUEUE_FLUSHED',count:e.data.count})));
  }
});

// Helper: promisify IDBRequest
function promisify(req){
  return new Promise((res,rej)=>{req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error);});
}
function openDB(){
  return new Promise((res,rej)=>{
    const req=indexedDB.open('jarvis-sw',1);
    req.onupgradeneeded=e=>{const db=e.target.result;if(!db.objectStoreNames.contains('proactive'))db.createObjectStore('proactive');};
    req.onsuccess=()=>res(req.result);
    req.onerror=()=>rej(req.error);
  });
}
