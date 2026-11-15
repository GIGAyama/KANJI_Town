import { useEffect, useState } from 'react';

/**
 * 必要になったときだけ読む部品（PeerJS・qrcode・jsQR）を読み、結果を分け合う。
 *
 * どれも npm の依存として同梱し、動的 import で別の塊にしている。
 * 以前は CDN（jsDelivr → unpkg）から <script> で読んでいて、校内フィルタで
 * 止まると QR が「よみこみ中...」のまま止まり、理由も代わりの手も出なかった。
 * ここでは失敗を loadError として返し、画面の側で代わりの案内を出す。
 */

/** @type {Map<string, Promise<unknown>>} */
const pending = new Map();

/** 1回だけ読む。失敗したら次に呼ばれたときに読み直す。 */
export function loadModuleOnce(key, importer) {
  if (!pending.has(key)) {
    const p = importer().catch((e) => {
      pending.delete(key);
      throw e;
    });
    pending.set(key, p);
  }
  return pending.get(key);
}

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

/**
 * @template T
 * @param {string} key - 読みこみを分け合うための名前
 * @param {() => Promise<T>} importer - モジュールの外に置いた関数（毎回作り直さない）
 * @param {object} [options]
 * @param {boolean} [options.requiresNetwork] - 通信できるときにしか役に立たない部品。
 *   先読みに入れていない（net/ に出している）ので、圏外では読みに行かずに loadError を返す。
 *   読みに行って失敗すると main.jsx の vite:preloadError が「新しい版が出た」とみなして
 *   画面を読み直し、児童がホームへ戻されてしまうため。つながったら読み直す。
 * @returns {{ lib: T|null, isLoaded: boolean, loadError: boolean, offline: boolean }}
 */
export function useLazyModule(key, importer, { requiresNetwork = false } = {}) {
  const [state, setState] = useState({ lib: null, isLoaded: false, loadError: false, offline: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!requiresNetwork) return undefined;
    const onOnline = () => setAttempt((n) => n + 1);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [requiresNetwork]);

  useEffect(() => {
    let alive = true;
    if (requiresNetwork && isOffline() && !pending.has(key)) {
      setState({ lib: null, isLoaded: false, loadError: true, offline: true });
      return () => { alive = false; };
    }
    loadModuleOnce(key, importer).then(
      (lib) => { if (alive) setState({ lib, isLoaded: true, loadError: false, offline: false }); },
      (e) => {
        if (!alive) return;
        console.error(`${key} を読みこめませんでした:`, e);
        setState({ lib: null, isLoaded: false, loadError: true, offline: isOffline() });
      },
    );
    return () => { alive = false; };
  }, [key, importer, requiresNetwork, attempt]);

  return state;
}
