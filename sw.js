/* 글결 서비스 워커
   ── 원칙: 항상 인터넷에서 먼저 받아옵니다(그래야 새 버전이 바로 반영돼요).
      인터넷이 안 되면 그때만 저장해 둔 것을 꺼내 씁니다.               */

const CACHE = 'geulgyeol-v1';

self.addEventListener('install', () => {
  self.skipWaiting();          // 새 워커를 기다리지 않고 바로 교체
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // 옛 캐시 정리
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 구글 번역 API·웹폰트 같은 외부 요청은 손대지 않습니다
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const hit = await caches.match(req);
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const home = await caches.match('./') || await caches.match('index.html');
        if (home) return home;
      }
      throw err;
    }
  })());
});
