importScripts("version.js");
const CACHE = "dogwalk-" + new URL(self.registration.scope).pathname + "-v" + self.APP_VERSION;
const FILES = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "version.js",
  "colors.js",
  "environment.js",
  "details.js",
  "time.js",
  "weather.js",
  "icons.js",
  "data.js",
  "bans-parks.json",
  "terminals.json",
  "construction.json",
  "wauz-up.png",
  "icon-192.png",
  "icon-512.png",
  "manifest.webmanifest",
];
// Take over right away, so old caches are cleaned up instead of piling up while a tab stays open.
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  ),
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
// Data of the City of Vienna: always ask the server first; if it fails, use the last good answer
// for the same map area. Old answers are trimmed so the store stays small.
const DATA = "dogwalk-data";
async function cityData(req) {
  const cache = await caches.open(DATA);
  try {
    const res = await fetch(req);
    if (res.ok) {
      await cache.put(req, res.clone());
      const keys = await cache.keys();
      for (const old of keys.slice(0, Math.max(0, keys.length - 300))) await cache.delete(old);
      return res;
    }
    return (await cache.match(req)) || res;
  } catch (error) {
    const saved = await cache.match(req);
    if (saved) return saved;
    throw error;
  }
}
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method === "GET" && req.url.startsWith("https://data.wien.gv.at/daten/geo"))
    return event.respondWith(cityData(req));
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
