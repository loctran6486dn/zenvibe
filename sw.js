// sw.js - ZenVibe Service Worker for Offline PWA Support
const CACHE_NAME = 'zenvibe-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/icons.js',
  './js/audio-data.js',
  './js/audio-engine.js',
  './js/presets.js',
  './js/timer.js',
  './js/app.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Đối với request âm thanh
  if (requestUrl.pathname.includes('/assets/audio/')) {
    // Nếu có range header (stream), cho qua network
    if (event.request.headers.get('range')) {
      event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
      );
      return;
    }
    // Ngược lại (fetch đầy đủ cho Web Audio API): Cache-first fallback Network & lưu cache
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const respClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, respClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Đối với tài nguyên web tĩnh (HTML, CSS, JS, Icon): Cache-first fallback Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
