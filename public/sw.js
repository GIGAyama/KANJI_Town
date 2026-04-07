// マイ漢字タウン Service Worker
// 戦略キャッシュでGIGAスクール端末のオフライン環境に完全対応
const CACHE_VERSION = 3;
const CACHE_STATIC = `kanji-town-static-v${CACHE_VERSION}`;
const CACHE_KANJIVG = `kanji-town-kanjivg-v${CACHE_VERSION}`;
const CACHE_FONTS = `kanji-town-fonts-v${CACHE_VERSION}`;
const CACHE_RUNTIME = `kanji-town-runtime-v${CACHE_VERSION}`;
const ALL_CACHES = [CACHE_STATIC, CACHE_KANJIVG, CACHE_FONTS, CACHE_RUNTIME];
const BASE = '/KANJI_Town/';

// プリキャッシュ: アプリシェルの最低限
const PRECACHE_URLS = [
  BASE,
  BASE + 'offline.html',
];

// ── インストール ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── アクティベート: 古いバージョンのキャッシュを削除 ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── フェッチ: リソース種別ごとの戦略キャッシュ ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // POST, non-HTTP はスキップ
  if (request.method !== 'GET' || !url.startsWith('http')) return;

  // ── KanjiVG CDN: Cache-first → Network ──
  // 一度取得したSVGは変更されないためキャッシュ優先
  if (url.includes('cdn.jsdelivr.net') && url.includes('kanjivg')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_KANJIVG).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── Google Fonts: Cache-first ──
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_FONTS).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── ナビゲーション(SPA): Network-first → キャッシュ(ルート) → オフラインページ ──
  // SPAなので全てのナビゲーションをルートページ(index.html)で処理する
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 200のみキャッシュ（404等をキャッシュしない）
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(BASE, clone));
          }
          return response;
        })
        .catch(() =>
          // オフライン時はルートページのキャッシュで応答（SPA対応）
          caches.match(BASE).then((cached) =>
            cached || caches.match(BASE + 'offline.html')
          )
        )
    );
    return;
  }

  // ── JS/CSS/画像 (ビルドアセット): Stale-While-Revalidate ──
  // ハッシュ付きアセットは変わらないのでキャッシュ優先、なければネットワーク
  if (url.includes('/assets/') || url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.png') || url.endsWith('.svg') || url.endsWith('.ico')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_RUNTIME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // ── その他: Network-first → キャッシュ ──
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_RUNTIME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ── SW更新通知 ──
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
