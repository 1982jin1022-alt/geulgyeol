/* 글결 서비스 워커
   ── 원칙: 항상 인터넷에서 먼저 받아옵니다(그래야 새 버전이 바로 반영돼요).
      인터넷이 안 되면 그때만 저장해 둔 것을 꺼내 씁니다.               */

const CACHE = 'geulgyeol-v2';

// 설치할 때 앱 껍데기를 미리 담아둡니다.
// 이게 없으면 설치 직후 바로 인터넷이 끊겼을 때 앱이 아예 안 열려요.
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

// 신호가 약하면 fetch 가 실패할 때까지 수십 초 흰 화면이 됩니다.
// 저장해 둔 것이 있으면 이만큼만 기다리고 그걸 먼저 보여줍니다.
const SLOW_MS = 4000;

self.addEventListener('install', (e) => {
  self.skipWaiting();          // 새 워커를 기다리지 않고 바로 교체
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // 하나가 실패해도 나머지는 담기도록 따로따로 넣습니다
    await Promise.all(SHELL.map(u =>
      cache.add(new Request(u, { cache: 'reload' })).catch(() => {})
    ));
  })());
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

  // 페이지(index.html)는 브라우저 HTTP 캐시도 건너뜁니다.
  // 깃허브 페이지가 max-age=600 을 보내서, 그냥 fetch 하면 푸시한 뒤에도 최대 10분 동안 옛 버전이 열렸어요.
  const isPage = req.mode === 'navigate' || /\.html$|\/$/.test(url.pathname);

  const fromNet = (async () => {
    const fresh = await fetch(req, isPage ? { cache: 'no-cache' } : undefined);
    if (fresh && fresh.ok) {
      const copy = fresh.clone();
      e.waitUntil(caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}));
    }
    return fresh;
  })();
  fromNet.catch(() => {});     // 저장본을 먼저 내준 뒤 실패해도 오류로 남지 않게

  const fromCache = async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    if (req.mode === 'navigate') return (await caches.match('./')) || (await caches.match('index.html'));
    return undefined;
  };

  e.respondWith((async () => {
    // 인터넷이 먼저 답하면 그걸, SLOW_MS 가 지나도록 답이 없으면 저장해 둔 것을 씁니다
    const slow = new Promise(res => setTimeout(res, SLOW_MS, 'slow'));
    try {
      const first = await Promise.race([fromNet, slow]);
      if (first !== 'slow') return first;
      const saved = await fromCache();
      return saved || await fromNet;
    } catch (err) {
      const saved = await fromCache();
      if (saved) return saved;
      throw err;
    }
  })());
});
