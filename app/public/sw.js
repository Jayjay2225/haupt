/* Jetztgut Service Worker — Offline nach dem ersten Besuch (Cache-first für die Shell). */
const CACHE = 'jetztgut-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/icon.svg'])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((namen) =>
      Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const anfrage = event.request;
  if (anfrage.method !== 'GET') return;
  const url = new URL(anfrage.url);
  if (url.origin !== self.location.origin && !url.hostname.endsWith('gstatic.com') && !url.hostname.endsWith('googleapis.com')) return;

  event.respondWith(
    caches.match(anfrage).then((getroffen) => {
      if (getroffen) return getroffen;
      return fetch(anfrage)
        .then((antwort) => {
          if (antwort.ok && (url.origin === self.location.origin || antwort.type === 'cors')) {
            const kopie = antwort.clone();
            caches.open(CACHE).then((cache) => cache.put(anfrage, kopie));
          }
          return antwort;
        })
        .catch(() => (anfrage.mode === 'navigate' ? caches.match('/') : Promise.reject(new Error('offline'))));
    }),
  );
});
