/* マイ漢字タウン Service Worker
 *
 * 【最重要】activate では自アプリ以外のキャッシュを削除しない。
 *   いまは独自ドメイン kanji-town.giga-school.com を単独で使っているが、
 *   旧配信元 gigayama.github.io は数十個のアプリで同一オリジンを共有していた。
 *   caches.keys() を接頭辞で絞らずに消すと、このアプリを開いただけで
 *   他のアプリがオフラインで起動しなくなる。
 *   必ず CACHE_PREFIX で始まるものだけを掃除すること。
 *
 * 【禁止】Service Worker は localStorage を一切操作しない。
 *   study.records.v1 を含む学習データには触れない。
 */
const CACHE_PREFIX = 'kanji-town-';
// リリースごとに必ず上げる。package.json の version と一致させること
// （不一致は scripts/check-project.mjs が検出して CI を落とす）。
const APP_VERSION = '0.4.0';

const CACHE_STATIC = `${CACHE_PREFIX}static-v${APP_VERSION}`;
const CACHE_KANJIVG = `${CACHE_PREFIX}kanjivg-v1`;
const CACHE_FONTS = `${CACHE_PREFIX}fonts-v1`;
const CACHE_RUNTIME = `${CACHE_PREFIX}runtime-v${APP_VERSION}`;
const KEEP_CACHES = [CACHE_STATIC, CACHE_KANJIVG, CACHE_FONTS, CACHE_RUNTIME];

// アプリの基点。sw.js は必ずアプリ直下に置かれるので、自分の場所から求める。
// 直書きすると、配信先（独自ドメイン直下 / サブパス）が変わった瞬間に
// プリキャッシュもオフライン応答も存在しないパスを指して黙って壊れる。
const BASE = new URL('./', self.location).pathname;

// プリキャッシュ: アプリシェルの最低限
const PRECACHE_URLS = [BASE, BASE + 'offline.html'];

/* index.html を読んで、そこに書かれているビルド成果物（JS/CSS）の URL を拾う。
 *
 * ファイル名にはビルドごとのハッシュが付くため、この sw.js に一覧を
 * 書き並べておくことができない。実物の index.html から読み取ることで、
 * リリースのたびに一覧を書き換える手間と、書き換え忘れを無くす。 */
async function collectAppShellAssets() {
  try {
    const res = await fetch(new Request(BASE, { cache: 'reload' }));
    if (!res.ok) return [];
    const html = await res.text();
    const urls = new Set();
    const pattern = /(?:src|href)="([^"]+\.(?:js|css))"/g;
    let m;
    while ((m = pattern.exec(html)) !== null) {
      // 外部CDNは対象外（オフラインでは届かないため precache しても意味がない）
      if (/^https?:\/\//.test(m[1])) continue;
      urls.add(new URL(m[1], self.location.origin + BASE).pathname);
    }
    return [...urls];
  } catch {
    return [];
  }
}

// ── インストール ──
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_STATIC);

    // アプリシェル本体に加えて、最初の画面に必要な JS/CSS まで入れておく。
    // これが無いと、初回に開いたあと圏外になった児童が真っ白な画面に
    // なってしまう（Service Worker が動き出すのは初回の読み込みより後で、
    // 初回に読まれたアセットはキャッシュに残らないため）。
    const assets = await collectAppShellAssets();

    // addAll は1本でも失敗すると全体が落ちる。校内Wi-Fiが不安定な場面で
    // インストールごと失敗するのを避けるため、1件ずつ入れて失敗は握りつぶす。
    await Promise.all([...PRECACHE_URLS, ...assets].map((url) =>
      cache.add(new Request(url, { cache: 'reload' })).catch(() => {})
    ));
    // ここでは skipWaiting しない。学習中に予告なく画面が切り替わらないよう、
    // 更新の適用は児童が「さいしんにする」を押したときだけ行う（message ハンドラ）。
  })());
});

// ── アクティベート: 自アプリの古いキャッシュだけを削除してからクライアントを引き取る ──
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith(CACHE_PREFIX) && !KEEP_CACHES.includes(k))
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// KanjiVG の書き順SVG・Webフォントは「一度取れたら中身が変わらない」ため
// キャッシュ優先。ネットワークに出る回数を減らし、40人同時でも待たせない。
const cacheFirst = (request, cacheName) =>
  caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, clone));
      }
      return response;
    // キャッシュにも無く圏外でもある場合。ここで例外のまま投げると
    // 「取得に失敗した理由が分からないエラー」がコンソールに並ぶため、
    // 503 を返して呼び出し側で扱えるようにする。
    }).catch(() => new Response('', { status: 503, statusText: 'offline' }));
  });

// ── フェッチ: リソース種別ごとの戦略キャッシュ ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // POST, non-HTTP はスキップ
  if (request.method !== 'GET' || !url.startsWith('http')) return;

  // ── KanjiVG CDN ──
  if (url.includes('cdn.jsdelivr.net') && url.includes('kanjivg')) {
    event.respondWith(cacheFirst(request, CACHE_KANJIVG));
    return;
  }

  // ── Google Fonts ──
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, CACHE_FONTS));
    return;
  }

  // ── ナビゲーション(SPA): Network-first → キャッシュ(ルート) → オフラインページ ──
  // SPAなので全てのナビゲーションをルートページ(index.html)で処理する
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // ⚠️ どのナビゲーションでも BASE として保存してはいけない。
          //    このサイトには SPA の入口のほかに offline.html と
          //    records-export.html（学習ログの受け渡し口）という
          //    中身の違う実ファイルがある。それを開いたときの応答を
          //    BASE に入れてしまうと、次に圏外でアプリを開いたときに
          //    アプリのかわりにそれらのページが出る。
          const path = new URL(request.url).pathname;
          const isAppRoot = path === BASE || path === BASE + 'index.html';
          // 200のみキャッシュ（404等をキャッシュしない）
          if (isAppRoot && response.ok && !response.redirected) {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(BASE, clone));
          }
          return response;
        })
        .catch(() =>
          // オフライン時は、まず開こうとした画面そのものを探し、
          // 無ければルートページのキャッシュで応答（SPA対応）
          caches.match(request).then((exact) =>
            exact || caches.match(BASE).then((cached) =>
              cached || caches.match(BASE + 'offline.html')
            )
          )
        )
    );
    return;
  }

  // ── JS/CSS/画像 (ビルドアセット): Cache-first → Network ──
  // ハッシュ付きアセットは変わらないのでキャッシュ優先、なければネットワーク
  if (url.includes('/assets/') || url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.png') || url.endsWith('.svg') || url.endsWith('.ico') || url.endsWith('.woff2')) {
    event.respondWith(cacheFirst(request, CACHE_RUNTIME));
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
      .catch(() => caches.match(request).then((cached) => cached || new Response('', { status: 503 })))
  );
});

// ── 更新の適用 ──
// 児童が「さいしんにする」を押したときだけ待機中の新版に切り替える。
// 旧実装（文字列 'SKIP_WAITING'）からの移行中でも動くよう、両方の形を受ける。
self.addEventListener('message', (event) => {
  const data = event.data;
  if (data === 'SKIP_WAITING' || (data && data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});
