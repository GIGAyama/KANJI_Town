// ==========================================
// IndexedDB キャッシュ（KanjiVG SVGパスデータ用）
// localStorage の容量制限を回避し、GIGAスクール端末でも
// 十分な容量で全1,026漢字のストロークデータをキャッシュする
// ==========================================

const DB_NAME = 'kanji-town-cache';
const DB_VERSION = 1;
const STORE_NAME = 'kanji-vg';

/** @type {Promise<IDBDatabase>|null} */
let dbPromise = null;

/**
 * IndexedDBデータベースを開く（シングルトン）
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null; // 失敗時はリトライ可能にする
      reject(req.error);
    };
  });
  return dbPromise;
}

/**
 * IndexedDBからデータを取得する
 * @param {string} key - 漢字のUnicodeコードポイント(hex)
 * @returns {Promise<string[]|null>} SVGパスデータの配列、またはnull
 */
export async function idbGet(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * IndexedDBにデータを保存する
 * @param {string} key - 漢字のUnicodeコードポイント(hex)
 * @param {string[]} value - SVGパスデータの配列
 * @returns {Promise<void>}
 */
export async function idbSet(key, value) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB書き込み失敗は無視（容量制限時など）
    // 次回ネットワーク取得時に再度キャッシュが試みられる
  }
}

/**
 * IndexedDBに保存されている全キーを取得する
 * @returns {Promise<string[]>} キーの配列
 */
export async function idbGetAllKeys() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAllKeys();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * localStorageからIndexedDBへキャッシュデータを一括移行する
 * 旧バージョンで蓄積されたlocalStorageのキャッシュを
 * IndexedDBに移行し、localStorage容量を解放する
 *
 * @param {string} storageKey - localStorageのキー名
 * @returns {Promise<void>}
 */
export async function migrateFromLocalStorage(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;

    const cache = JSON.parse(raw);
    const entries = Object.entries(cache);
    if (entries.length === 0) return;

    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const [key, value] of entries) {
      store.put(value, key);
    }
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // 移行成功後にlocalStorageのデータを削除
    localStorage.removeItem(storageKey);
  } catch {
    // 移行失敗は無視（次回ネットワーク取得時にIndexedDBに保存される）
  }
}
