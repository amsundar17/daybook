// Bump both this and the "?v=" query on index.html's <script>/<link> tags
// together on every release -- that's what forces browsers (and this SW's own
// cache) to stop serving a stale JS/CSS file after an update ships.
const CACHE = "daybook-v4";
const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./css/styles.css?v=4",
  "./js/icons.js?v=4", "./js/dates.js?v=4", "./js/quotes.js?v=4", "./js/supabase-sync.js?v=4",
  "./js/store.js?v=4", "./js/google-integration.js?v=4", "./js/finance-extract.js?v=4",
  "./js/capture.js?v=4", "./js/search.js?v=4",
  "./js/views-core.js?v=4", "./js/views-work.js?v=4", "./js/views-life.js?v=4", "./js/views-financial.js?v=4",
  "./js/health-calc.js?v=4", "./js/views-health.js?v=4", "./js/app.js?v=4",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first for navigations so a fresh deploy is picked up when online.
// Stale-while-revalidate for static assets: serve the cached copy instantly,
// but always fetch a fresh one in the background so an edited app.js/CSS
// shows up on the *next* load instead of being stuck behind a cache forever.
self.addEventListener("fetch", (e) => {
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      const network = fetch(e.request).then((res) => {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => null);
      return cached || (await network) || fetch(e.request);
    })
  );
});
