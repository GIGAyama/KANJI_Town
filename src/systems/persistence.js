/**
 * 端末に残した記録を、ブラウザに消されにくくする（navigator.storage.persist）。
 *
 * 守っていない記録は、ブラウザの都合で消されうる。iOS Safari はしばらく開かないと
 * localStorage を消し（ITP）、Chromebook の Chrome もディスクが足りなくなると消す。
 * persist() が許されると、その心配が小さくなる。
 *
 * 許可を求める画面を出すブラウザ（Firefox）があるため、起動直後ではなく、
 * 学習を1回終えたあと（使う気がはっきりした時）に1回だけ頼む。
 */

let requested = false;

/** @returns {Promise<'persisted'|'denied'|'unsupported'>} */
export async function requestPersistentStorage(storage = globalThis.navigator?.storage) {
  try {
    if (!storage || typeof storage.persist !== 'function') return 'unsupported';
    if (typeof storage.persisted === 'function' && await storage.persisted()) return 'persisted';
    return (await storage.persist()) ? 'persisted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

/** 学習を終えたときに呼ぶ。1回の起動につき1回だけ頼む */
export function requestPersistentStorageOnce(storage) {
  if (requested) return Promise.resolve(null);
  requested = true;
  return requestPersistentStorage(storage);
}

/**
 * 記録が守られているかと、使っている量。
 * @returns {Promise<{ persisted: boolean|null, usage: number|null, quota: number|null }>}
 */
export async function getStorageProtection(storage = globalThis.navigator?.storage) {
  const result = { persisted: null, usage: null, quota: null };
  try {
    if (storage && typeof storage.persisted === 'function') result.persisted = await storage.persisted();
    if (storage && typeof storage.estimate === 'function') {
      const { usage, quota } = await storage.estimate();
      result.usage = Number.isFinite(usage) ? usage : null;
      result.quota = Number.isFinite(quota) ? quota : null;
    }
  } catch {
    // 調べられなくても画面は出す
  }
  return result;
}
