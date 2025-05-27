const CACHE_NAME = "noteease-pwa-v1";
const OFFLINE_URL = "/offline.html";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  // Add main icons for installability/offline use:
  "/icon-192.png",
  "/icon-512.png"
];

// Install: cache core assets.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: clean up old caches.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Serve from cache first, fallback for offline.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        // If navigation, show offline fallback
        if (event.request.destination === "document") {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
