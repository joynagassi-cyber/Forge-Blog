/**
 * Service Worker for Forge-Blog PWA
 * Cache-first strategy for static assets, network-first for content.
 */

const CACHE_NAME = "forge-blog-v1";

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/en",
  "/fr",
];

// Install: pre-cache key pages
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }),
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch: network-first for articles, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Always use network for API calls
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Cache-first for static assets (fonts, images, CSS, JS)
  if (
    url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff2?)$/) ||
    url.pathname.startsWith("/_next/")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached ?? fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        });
      }),
    );
    return;
  }

  // Network-first for everything else (articles, pages)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached ?? new Response("Offline", { status: 503 });
        });
      }),
  );
});
