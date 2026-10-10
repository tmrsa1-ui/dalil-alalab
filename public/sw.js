/* Service worker بسيط: يخزن الصفحات والبطاقات اللي فتحها الأب عشان تشتغل بدون إنترنت.
   لا يخزن أي طلبات API، ولا يرسل شي. */
const VERSION = "dalil-v1";
const CORE = ["/", "/charter", "/privacy", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // ملفات البناء الثابتة: cache-first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // الصفحات: network-first مع رجوع للنسخة المخزنة.
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(url.pathname + url.search, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(url.pathname + url.search)
            .then((hit) => hit || caches.match(url.pathname))
            .then((hit) => hit || caches.match("/")),
        ),
    );
  }
});
