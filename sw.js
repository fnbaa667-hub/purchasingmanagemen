const CACHE_NAME = "kas-purchasing-v1";
const ASSETS = ["./index.html", "./icon.jpg", "./icon-192.png", "./icon-512.png", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first untuk index.html (biar selalu dapat versi terbaru saat online),
// fallback ke cache kalau offline. File lain (ikon dsb) cache-first.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if(req.mode === "navigate" || req.url.endsWith("index.html")){
    event.respondWith(
      fetch(req).then((res) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
