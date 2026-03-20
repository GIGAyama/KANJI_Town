// IndexedDB キャッシュ（KanjiVG SVGパスデータ用）
// localStorage の 200漢字制限を撤廃し、GIGAスクール端末でも十分な容量を確保

const DB_NAME = 'kanji-town-cache';
const DB_VERSION = 1;
const STORE_NAME = 'kanji-vg';

let dbPromise = null;

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
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

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
  }
}

// localStorage から IndexedDB への一括移行
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
    localStorage.removeItem(storageKey);
  } catch {
    // 移行失敗は無視（次回ネットワーク取得時にIndexedDBに保存される）
  }
}
