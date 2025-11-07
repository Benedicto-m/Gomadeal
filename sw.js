const CACHE = 'gomadeal-v1';
const ASSETS = [
  '/',
  '/src/pages/register.html',
  '/src/pages/verify.html',
  '/src/pages/lost.html',
  'manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/src/pages/verify.html')))
  );
});
