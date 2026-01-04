const CACHE = 'liquorne-v3.6.4';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './assets/icon-64.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/favicon.png',
  './assets/licorne-head-512-v333.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : Promise.resolve()))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});