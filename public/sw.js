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
// APP_VERSION は手で上げない。tools/build-sw.mjs がビルド後に dist/sw.js の
// この行を、配信物の内容ハッシュで書き換える（原本のここは 'dev' のまま）。
const APP_VERSION = 'dev'; /* __APP_VERSION__ */

// APP_VERSION は 'v' ＋ 16進12桁（build-sw.mjs が刻む）。ここで 'v' を足すと 'vv…' になる。
const CACHE_STATIC = `${CACHE_PREFIX}static-${APP_VERSION}`;
const CACHE_RUNTIME = `${CACHE_PREFIX}runtime-${APP_VERSION}`;
// 以前あった kanji-town-kanjivg-v1（jsDelivr から1字ずつ取った KanjiVG）と
// kanji-town-fonts-v1（Google Fonts）はここに無いので、activate で消える。
// 書き順データと書体は同梱に替えた。
const KEEP_CACHES = [CACHE_STATIC, CACHE_RUNTIME];

// アプリの基点。sw.js は必ずアプリ直下に置かれるので、自分の場所から求める。
// 直書きすると、配信先（独自ドメイン直下 / サブパス）が変わった瞬間に
// プリキャッシュもオフライン応答も存在しないパスを指して黙って壊れる。
const BASE = new URL('./', self.location).pathname;

// プリキャッシュ: アプリシェルの最低限。
// ⚠️ 中身は tools/build-sw.mjs がビルド後に実体で埋める（目印の行）。
//    ここを手で書き並べない。書き並べると、ハッシュ付きのファイル名が
//    リリースごとに変わるたびに古い一覧が残る。
const PRECACHE_URLS = []; /* __PRECACHE_URLS__ */

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

/* ファイル名にビルドのハッシュが付いたもの（assets/ と net/ の中）。
 * 名前が同じなら中身も同じなので、HTTP キャッシュや前の版のキャッシュから使ってよい。 */
const isHashedAsset = (pathname) => /\/(assets|net)\/[^/]+-[\w-]{8}\.[a-z0-9]+$/i.test(pathname);

/* 先読みの1件を入れる。
 * - ハッシュ付きのファイル: 前の版のキャッシュにあればそれを写す（通信しない）。
 *   無ければ HTTP キャッシュを使ってよい（cache: 'default'）。初回の訪問でページが
 *   読んだばかりのファイルを、ここでもう一度ダウンロードしないため。
 *   以前は全件 'reload' で、初回に1台あたり約0.24MBを二重に取っていた。
 * - それ以外（index.html・書き順データ・manifest など名前が変わらないもの）:
 *   'no-cache' でサーバーに確かめる。変わっていなければ 304 で中身は送られない。 */
async function precacheOne(cache, url) {
  const { pathname } = new URL(url, self.location.href);
  if (isHashedAsset(pathname)) {
    const previous = await caches.match(url, { ignoreVary: true });
    if (previous && previous.ok) {
      await cache.put(url, previous);
      return;
    }
    await cache.add(new Request(url, { cache: 'default' }));
    return;
  }
  await cache.add(new Request(url, { cache: 'no-cache' }));
}

// ── インストール ──
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_STATIC);

    // アプリシェル本体に加えて、最初の画面に必要な JS/CSS まで入れておく。
    // これが無いと、初回に開いたあと圏外になった児童が真っ白な画面に
    // なってしまう（Service Worker が動き出すのは初回の読み込みより後で、
    // 初回に読まれたアセットはキャッシュに残らないため）。
    // 一覧は build-sw.mjs が埋める。埋まっていない（開発中の 'dev'）ときだけ
    // index.html から拾う（両方を足すと同じファイルを2回取っていた）。
    const urls = PRECACHE_URLS.length > 0 ? PRECACHE_URLS : ['./', ...await collectAppShellAssets()];

    // addAll は1本でも失敗すると全体が落ちる。校内Wi-Fiが不安定な場面で
    // インストールごと失敗するのを避けるため、1件ずつ入れて失敗は握りつぶす。
    await Promise.all(urls.map((url) => precacheOne(cache, url).catch(() => {})));
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

// ハッシュ付きアセット・書き順データ・Webフォントは「その版のあいだ中身が変わらない」
// ためキャッシュ優先。ネットワークに出る回数を減らし、40人同時でも待たせない。
// accept を渡すと、それが真の応答だけを保存する（途中の機器が 200 で別のページを
// 返したときに、それを正しいデータとして覚えてしまわないように）。
//
// ignoreVary: 配信によっては `Vary: Origin` が付く（vite preview など）。モジュールの JS・
// 書体・fetch は Origin 付きで要求されるので、Origin なしで先読みしたものと一致せず、
// 圏外で学習画面が開けなかった。同じオリジンの、版の中で中身が変わらないものなので Vary を見ない。
const cacheFirst = (request, cacheName, accept = () => true) =>
  caches.match(request, { ignoreVary: true }).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok && accept(response)) {
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

  // ほかのオリジンへの要求には関わらない（書き順データ・書体・部品は同梱したので、
  // 外から取ってキャッシュするものは無い）。以前は「その他」の network-first に落ち、
  // 「4けたの数字で送る」の ID 発行の応答（毎回ちがう URL）まで CACHE_RUNTIME に溜めていた。
  const { origin, pathname } = new URL(url);
  if (origin !== self.location.origin) return;

  // ── 書き順データ（同梱の学年ファイル kanjivg/grade-N.json）: Cache-first ──
  // インストール時に先読みしてある。版（APP_VERSION）は先読みするものの中身から
  // 作るので、データが変われば新しい版として入れ直される。
  if (pathname.startsWith(BASE + 'kanjivg/')) {
    event.respondWith(cacheFirst(request, CACHE_RUNTIME,
      (response) => (response.headers.get('content-type') || '').includes('json')));
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
          // （privacy.html / terms.html も先読みしてあるので、圏外でもアプリに化けない）
          caches.match(request, { ignoreSearch: true }).then((exact) =>
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
  if (isHashedAsset(pathname) || /\.(js|css|png|svg|ico|woff2)$/.test(pathname)) {
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
      .catch(() => caches.match(request, { ignoreVary: true }).then((cached) => cached || new Response('', { status: 503 })))
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
