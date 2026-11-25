importScripts('./release-state.js');
const VERSION='3.1.0',CACHE='otetsudai-offline-v'+VERSION;
const ASSETS=['./index.html','./app.js','./local-store.js','./growth.js','./growth.css','./release-state.js','./update.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const active=await ReleaseState.get('activeVersion');
 if(active&&active!==VERSION&&await ReleaseState.get('approvedVersion')!==VERSION)throw Error('Update needs approval');
 const cache=await caches.open(CACHE);
 try{await cache.addAll(ASSETS.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload',credentials:'same-origin',redirect:'error'})))}catch(e){await caches.delete(CACHE);throw e}
 // Later releases are approved before installation, not forced into open pages.
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await ReleaseState.put({activeVersion:VERSION,approvedVersion:null});
 for(const key of await caches.keys())if(key.startsWith('otetsudai-offline-')&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 const source=event.source;if(!source||!source.url)return;
 const url=new URL(source.url),scope=new URL(self.registration.scope);
 if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 if(event.data?.type==='APPLY_UPDATE'&&event.data.version===VERSION)event.waitUntil((async()=>{if(await ReleaseState.get('approvedVersion')===VERSION)await self.skipWaiting()})());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 if(url.pathname===new URL('./family-login',self.registration.scope).pathname)return;
 if(url.pathname===new URL('./release.json',self.registration.scope).pathname)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);if(event.request.mode==='navigate')return await cache.match(new URL('./index.html',self.registration.scope).href)||Response.error();return await cache.match(event.request)||fetch(event.request)})());
});
