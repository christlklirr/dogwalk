const CACHE = "dogwalk-" + new URL(self.registration.scope).pathname + "-v21";
const FILES = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "environment.js",
  "police.js",
  "details.js",
  "nearpaths.js",
  "icons.js",
  "data.js",
  "wauz-up.png",
  "dog-zone-paw.png",
  "icon-192.png",
  "icon-512.png",
  "manifest.webmanifest",
];
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES))),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      const prefix = CACHE.slice(0, CACHE.lastIndexOf("-v") + 2);
      for (const key of await caches.keys())
        if (key.startsWith(prefix) && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.registration.scope)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res.ok) await cache.put(req, res.clone());
        return res;
      } catch (error) {
        const saved =
          (await cache.match(req)) || (req.mode === "navigate" && (await cache.match("./")));
        if (saved) return saved;
        throw error;
      }
    })(),
  );
});
