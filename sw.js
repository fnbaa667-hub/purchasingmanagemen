const CACHE_NAME = "kas-purchasing-v2";
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

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Hanya tangani GET dari origin sendiri. Request ke Supabase, CDN, dsb
  // dibiarkan lewat apa adanya (tanpa diintervensi service worker) supaya
  // tidak ada penundaan sama sekali pada panggilan data.
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate" || url.pathname.endsWith("index.html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // PENTING: clone SEBELUM response dipakai/dikembalikan.
          const salinan = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, salinan)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
