// マイ漢字タウン Service Worker
const CACHE_NAME = 'kanji-town-v1';
const BASE = '/KANJI_Town/';

// ビルド時に生成されるアセットはランタイムキャッシュで対応
const PRECACHE_URLS = [
  BASE,
  BASE + 'offline.html',
];

// インストール: 最低限のファイルをプリキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// アクティベート: 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// フェッチ: Network-first + キャッシュフォールバック戦略
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // POST, non-HTTP requests はスキップ
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  // Google Fonts: Cache-first (変更されないため)
  if (request.url.includes('fonts.googleapis.com') || request.url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // ナビゲーション: Network-first → オフラインページ
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(BASE + 'offline.html'))
    );
    return;
  }

  // JS/CSS/画像アセット: Network-first + キャッシュ
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
