/**
 * ⚡ SPEAKY — sw.js (Service Worker)
 * 오프라인 지원 + 캐시 관리
 *
 * 전략:
 *   - 앱 셸(HTML·JS·CSS·폰트) → Cache First (오프라인 우선)
 *   - MyMemory 번역 API → Network First (실패 시 캐시)
 *   - 그 외 외부 리소스 → Network First
 */

const CACHE_NAME    = 'speaky-v1';
const SHELL_CACHE   = 'speaky-shell-v1';
const DYNAMIC_CACHE = 'speaky-dynamic-v1';

// 앱 셸 — 설치 시 미리 캐시
const SHELL_ASSETS = [
  './',
  './index.html',
  './add.html',
  './vocab.html',
  './stats.html',
  './quiz.html',
  './settings.html',
  './js/main.js',
  './js/core/logger.js',
  './js/core/storage.js',
  './js/data/expressionManager.js',
  './js/data/settingsManager.js',
  './js/data/backupManager.js',
  './js/data/chunkBuilder.js',
  './js/data/quizGenerator.js',
  './js/data/scoreTracker.js',
  './data/builtin_30.json',
  // compromise.js CDN → 동적 캐시에서 처리
];

// ── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => {
      console.log('[SW] 앱 셸 캐싱 시작');
      // 개별 실패해도 설치 계속 (allSettled 방식)
      return Promise.allSettled(
        SHELL_ASSETS.map(url => cache.add(url).catch(e => console.warn('[SW] 캐시 실패:', url, e)))
      );
    }).then(() => {
      console.log('[SW] 설치 완료 — skipWaiting');
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== DYNAMIC_CACHE)
          .map(k => {
            console.log('[SW] 구버전 캐시 삭제:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // POST 요청은 캐시 안 함
  if (request.method !== 'GET') return;

  // MyMemory 번역 API → Network First
  if (url.hostname === 'api.mymemory.translated.net') {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Google Fonts → Cache First
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // compromise.js CDN → Cache First
  if (url.hostname === 'unpkg.com') {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // 앱 내부 파일 → Cache First
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // 그 외 → Network First
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// ── 캐시 전략 ────────────────────────────────────────────────────────────────

/**
 * Cache First: 캐시 있으면 즉시 반환, 없으면 네트워크 → 캐시 저장
 */
async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    // 오프라인 + 캐시 없음 → 오프라인 페이지
    return offlineFallback(request);
  }
}

/**
 * Network First: 네트워크 우선, 실패 시 캐시 반환
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return offlineFallback(request);
  }
}

/**
 * 오프라인 폴백
 */
function offlineFallback(request) {
  if (request.headers.get('Accept')?.includes('text/html')) {
    return caches.match('./index.html');
  }
  return new Response(JSON.stringify({ error: 'offline' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── PUSH 알림 ────────────────────────────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? '⚡ SPEAKY';
  const body  = data.body  ?? '오늘 학습 잊지 않으셨죠? 💪';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon   : './assets/icon-192.png',
      badge  : './assets/icon-72.png',
      tag    : 'speaky-daily',
      renotify: true,
      actions: [
        { action: 'open',   title: '지금 공부하기 ⚡' },
        { action: 'dismiss',title: '나중에' },
      ],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        const existing = windowClients.find(c => c.url.includes('index.html') && 'focus' in c);
        if (existing) return existing.focus();
        return clients.openWindow('./index.html');
      })
    );
  }
});
