// Service worker do FaculFood: guarda o app para abrir offline e permitir "instalar na tela inicial".
const CACHE = "faculfood-v11";
const ARQUIVOS = ["./", "./index.html", "./manifest.json", "./assets/icon-192.png", "./assets/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
// rede primeiro (pega a versão nova), cache se estiver offline
self.addEventListener("fetch", e => {
  if(e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
