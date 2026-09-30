const CACHE_NAME = 'trip-app-shell-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/vue@3.5.13/dist/vue.global.prod.js',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js',
  'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
];

// 地圖底圖（GSI／Esri／OSM／MapLibre）不快取：離線時地圖本來就顯示不出來，
// 這裡只確保「行程、記帳、照片」等你自己的資料在離線時仍能打開。
const NEVER_CACHE_HOSTS = [
  'cyberjapandata.gsi.go.jp',
  'arcgisonline.com',
  'tile.openstreetmap.org',
  'basemaps.cartocdn.com',
  'open.er-api.com',
  'nominatim.openstreetmap.org',
  'api.open-meteo.com',
  'geocoding-api.open-meteo.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch(() => {}) // 單一資源失敗不影響其他資源快取
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (NEVER_CACHE_HOSTS.some((h) => url.hostname.includes(h))) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      // 有快取先顯示快取（離線可用、速度快），背景仍嘗試更新
      return cached || fetchPromise;
    })
  );
});
