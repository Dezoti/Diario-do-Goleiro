// Guarda os arquivos do app para abrir rápido e funcionar sem internet.
const CACHE = 'diario-goleiro-v12';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'parser.js', 'games.js', 'photos.js', 'share-image.js', 'stats.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'assets/fonts/oswald-500.woff2', 'assets/fonts/oswald-700.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // Rede primeiro (pega atualizações), cache como reserva.
  e.respondWith(fetch(e.request).then((r) => {
    const copy = r.clone();
    caches.open(CACHE).then((c) => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request).then((m) => m || caches.match('index.html'))));
});
