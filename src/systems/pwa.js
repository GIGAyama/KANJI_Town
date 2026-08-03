/* PWA（ホーム画面へのインストールと更新）の窓口。
 *
 * インストールの合図（beforeinstallprompt）は index.html の <head> 最上部で
 * 受け取っている。Chrome は条件が揃うと即座にこのイベントを出すため、
 * React の読み込みを待っていると合図を取りこぼし、通信が遅い端末で
 * 「ホームにいれる」ボタンが出なくなる。ここではその結果だけを読む。
 */

const SW_URL = '/KANJI_Town/sw.js';
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6時間

/** ホーム画面から起動しているか（＝もうインストール済み） */
export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches === true
    || window.navigator.standalone === true;
}

/** iOS Safari には beforeinstallprompt が無いため、手順の案内に切り替える */
export function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua)
    || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1); // iPadOS はMac を名乗る
  return isIos && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

/** いま「ホームにいれる」ボタンを出せるか */
export function canPromptInstall() {
  return typeof window !== 'undefined' && Boolean(window.__deferredInstallPrompt);
}

/**
 * インストールを実行する。
 * @returns {Promise<'accepted'|'dismissed'|'unavailable'>}
 */
export async function promptInstall() {
  const deferred = typeof window !== 'undefined' ? window.__deferredInstallPrompt : null;
  if (!deferred) return 'unavailable';
  try {
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // 合図は一度しか使えない。押した後は必ず捨てる。
    window.__deferredInstallPrompt = null;
    return outcome === 'accepted' ? 'accepted' : 'dismissed';
  } catch {
    window.__deferredInstallPrompt = null;
    return 'unavailable';
  }
}

/** インストール可能／完了の変化を購読する。戻り値を呼ぶと購読を解除する。 */
export function subscribeInstallState(listener) {
  if (typeof window === 'undefined') return () => {};
  const notify = () => listener({
    canInstall: canPromptInstall(),
    installed: isStandalone(),
  });
  window.addEventListener('pwa-installable', notify);
  window.addEventListener('pwa-installed', notify);
  return () => {
    window.removeEventListener('pwa-installable', notify);
    window.removeEventListener('pwa-installed', notify);
  };
}

// ── 更新まわり ──
// 待機中の新しい Service Worker。児童が「さいしんにする」を押すまで適用しない。
let waitingWorker = null;
let applying = false;

/** 新しい版が待機したときに呼ばれる。戻り値を呼ぶと購読を解除する。 */
export function subscribeUpdateAvailable(listener) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => listener();
  window.addEventListener('pwa-update-available', handler);
  // 購読より先に更新が見つかっていた場合も拾う
  if (waitingWorker) listener();
  return () => window.removeEventListener('pwa-update-available', handler);
}

/** 待機中の新版に切り替えて読み込み直す */
export function applyUpdate() {
  if (!waitingWorker || applying) return;
  applying = true;
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  // 切り替わったことは controllerchange で検知してリロードする
}

function markWaiting(worker) {
  if (!worker) return;
  waitingWorker = worker;
  window.dispatchEvent(new Event('pwa-update-available'));
}

/**
 * Service Worker を登録する。
 * 初回インストール時はリロードしない。更新の適用は児童の操作を待つ。
 */
export function registerServiceWorker({ onError } = {}) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // 「さいしんにする」を押していないのに切り替わった場合は、学習中に
    // 画面が飛ばないようリロードしない。
    if (refreshing || !applying) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(SW_URL);

      // 登録した時点で既に新版が待機していることがある（前回タブを閉じた場合など）
      if (reg.waiting && navigator.serviceWorker.controller) markWaiting(reg.waiting);

      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          // controller がある＝初回インストールではない＝「更新」である
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            markWaiting(reg.waiting || installing);
          }
        });
      });

      setInterval(() => { reg.update().catch(() => {}); }, UPDATE_CHECK_INTERVAL_MS);
    } catch (e) {
      onError?.(e);
    }
  });
}
