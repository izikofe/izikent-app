const CACHE_NAME = "izikent-v8-9-approved-icon";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-approved.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith("izikent-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Всегда сначала запрашиваем свежую версию с сервера.
  // Кеш используется только если сеть недоступна.
  event.respondWith((async () => {
    try {
      const request = event.request.mode === "navigate"
        ? new Request(event.request, { cache: "no-store" })
        : event.request;
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        event.waitUntil(cache.put(event.request, response.clone()));
      }
      return response;
    } catch (error) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === "navigate") {
        const shell = await caches.match("./index.html");
        if (shell) return shell;
      }
      throw error;
    }
  })());
});
