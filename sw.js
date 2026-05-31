// DELOS Sim — Service Worker
// Caches the simulation shell so it runs fully offline once installed.
// Strategy: cache-first for shell assets, network-first for everything else.

// Bump CACHE version when SHELL changes so old caches get purged on activate
const CACHE = 'delos-sim-v49';
const SHELL = [
  './',
  './bas_pump_performance_simulation.html',
  './manifest.json',
  './icon.svg',
  './farm_map.jpg'
];

self.addEventListener('install', (event) => {
  // Pre-cache the app shell on first install
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Purge any stale caches from previous versions
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET; let everything else pass through
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((resp) => {
          // Cache new GET responses (same-origin only) for next time
          if (resp.ok && new URL(event.request.url).origin === self.location.origin) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy));
          }
          return resp;
        })
        .catch(() => cached); // network failed; fall back to cache (or undefined)
    })
  );
});
