// 내신 계산기 서비스 워커: 한 번 열어 본 뒤에는 오프라인에서도 화면이 열립니다.
const CACHE = "naesin-v1";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const put = (req, res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const lib = url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/");
  if (!sameOrigin && !lib) return;               // 로그인·저장 통신은 건드리지 않습니다.
  if (lib) {                                      // 버전이 고정된 라이브러리: 캐시 우선
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => put(req, res))));
    return;
  }
  e.respondWith(                                  // 내 파일: 네트워크 우선(수정 즉시 반영), 오프라인이면 캐시
    fetch(req).then(res => put(req, res)).catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
  );
});
