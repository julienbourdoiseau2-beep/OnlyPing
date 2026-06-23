const CACHE_NAME = "onlyping-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  // For page navigations, always hit the network first so F5 reflects fresh DB data.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) {
            return cached;
          }
          return Response.error();
        })
    );
    return;
  }

  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response("Offline", { status: 503 });
      })
    );
    return;
  }

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isStaticAsset = ["image", "style", "script", "font"].includes(event.request.destination);

  if (!isSameOrigin || !isStaticAsset) {
    return;
  }

  // For static assets, use stale-while-revalidate for speed.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
