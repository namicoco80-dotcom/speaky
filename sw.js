const CACHE = 'speaky-assets-v7';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;
  if (url.hostname === 'api.mymemory.translated.net') return;

  if (request.headers.get('Accept')?.includes('text/html') ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('/speaky/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const res = await fetch(request);
      if (res.ok) cache.put(request, res.clone());
      return res;
    }).catch(() => caches.match(request))
  );
});
