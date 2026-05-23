// ==========================================
// KanjiVG SVG データの取得・パース・キャッシュ
// 三層キャッシュ: メモリ → IndexedDB → ネットワーク
// タイムアウト・リトライ・指数バックオフ対応
// ==========================================
import { idbGet, idbSet, idbGetAllKeys, migrateFromLocalStorage } from './idb-cache';
import { KANJI_VG } from '../constants/gameConfig';

const LEGACY_STORAGE_KEY = 'kanji_vg_cache';

/** @type {Map<string, string[]>} メモリキャッシュ（セッション中は即返却） */
const memoryCache = new Map();

// 起動時に localStorage → IndexedDB へ移行（非同期・失敗無視）
migrateFromLocalStorage(LEGACY_STORAGE_KEY);

/**
 * タイムアウト付きfetch（外部 AbortSignal も連携）
 * @param {string} url
 * @param {number} timeout - タイムアウト(ms)
 * @param {AbortSignal} [externalSignal] - 呼び出し側のキャンセル信号
 * @returns {Promise<Response>}
 */
function fetchWithTimeout(url, timeout, externalSignal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  // 外部 signal が aborted されたら自分も abort
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }
  return fetch(url, { signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
  });
}

/**
 * 指数バックオフ付きリトライfetch
 * @param {string} url
 * @param {number} maxRetries
 * @param {number} timeout
 * @param {AbortSignal} [externalSignal]
 * @returns {Promise<Response>}
 * @throws {Error} 全リトライ失敗時
 */
async function fetchWithRetry(url, maxRetries, timeout, externalSignal) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (externalSignal?.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      const res = await fetchWithTimeout(url, timeout, externalSignal);
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      // 外部からのキャンセルは即座に伝播
      if (externalSignal?.aborted) throw e;
      lastError = e;
    }
    if (attempt < maxRetries - 1) {
      await new Promise((r, rej) => {
        const t = setTimeout(r, 1000 * Math.pow(2, attempt));
        if (externalSignal) {
          externalSignal.addEventListener('abort', () => { clearTimeout(t); rej(new DOMException('Aborted', 'AbortError')); }, { once: true });
        }
      });
    }
  }
  throw lastError;
}

/**
 * SVGテキストからpath要素のd属性文字列を抽出する
 * @param {string} svgText - SVG文字列
 * @returns {string[]} path d属性の配列
 */
function extractPathStrings(svgText) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  return Array.from(doc.querySelectorAll('path')).map(p => p.getAttribute('d'));
}

/**
 * path文字列配列をstrokeData（正規化座標のポイント群）に変換する
 * @param {string[]} pathStrings
 * @returns {Array<{s: {x: number, y: number}, e: {x: number, y: number}, points: Array<{x: number, y: number}>}>}
 */
function buildStrokeData(pathStrings) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svg.appendChild(pathEl);
  document.body.appendChild(svg);
  try {
    return pathStrings.map(d => {
      pathEl.setAttribute('d', d);
      const len = pathEl.getTotalLength();
      const points = [];
      for (let i = 0; i <= len; i += KANJI_VG.SAMPLE_INTERVAL) {
        const pt = pathEl.getPointAtLength(i);
        points.push({ x: pt.x / KANJI_VG.VIEWBOX_SIZE, y: pt.y / KANJI_VG.VIEWBOX_SIZE });
      }
      const endPt = pathEl.getPointAtLength(len);
      points.push({ x: endPt.x / KANJI_VG.VIEWBOX_SIZE, y: endPt.y / KANJI_VG.VIEWBOX_SIZE });
      const startPt = pathEl.getPointAtLength(0);
      return {
        s: { x: startPt.x / KANJI_VG.VIEWBOX_SIZE, y: startPt.y / KANJI_VG.VIEWBOX_SIZE },
        e: { x: endPt.x / KANJI_VG.VIEWBOX_SIZE, y: endPt.y / KANJI_VG.VIEWBOX_SIZE },
        points,
      };
    });
  } finally {
    document.body.removeChild(svg);
  }
}

/**
 * 漢字のKanjiVGデータを取得する
 *
 * キャッシュ戦略:
 * 1. メモリキャッシュ（即返却）
 * 2. IndexedDBキャッシュ（容量制限なし）
 * 3. ネットワーク取得（リトライ付き）
 *
 * @param {string} char - 漢字1文字
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - キャンセル用シグナル
 * @returns {Promise<{ paths: string[], strokeData: Array<{s: {x: number, y: number}, e: {x: number, y: number}, points: Array}> }>}
 * @throws {Error} 全リトライ失敗時 or AbortError
 */
export async function fetchKanjiVg(char, options = {}) {
  const { signal } = options;
  const hex = char.charCodeAt(0).toString(16).padStart(5, '0');

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  // 1. メモリキャッシュ
  if (memoryCache.has(hex)) {
    const cached = memoryCache.get(hex);
    return { paths: cached, strokeData: buildStrokeData(cached) };
  }

  // 2. IndexedDB キャッシュ
  const idbCached = await idbGet(hex);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (idbCached) {
    memoryCache.set(hex, idbCached);
    return { paths: idbCached, strokeData: buildStrokeData(idbCached) };
  }

  // 3. ネットワーク取得（リトライ付き）
  const res = await fetchWithRetry(
    `${KANJI_VG.CDN_URL}/${hex}.svg`,
    KANJI_VG.MAX_RETRIES,
    KANJI_VG.FETCH_TIMEOUT,
    signal
  );
  const text = await res.text();
  const pathStrings = extractPathStrings(text);

  // キャッシュ保存（非同期・失敗無視）
  memoryCache.set(hex, pathStrings);
  idbSet(hex, pathStrings);

  return { paths: pathStrings, strokeData: buildStrokeData(pathStrings) };
}

/**
 * 指定された漢字リストのKanjiVG SVGデータをバックグラウンドで事前キャッシュする
 * オンライン時に呼び出し、オフライン学習に備える
 *
 * @param {Array<{char: string}>} kanjiList - 漢字オブジェクトの配列
 * @returns {Promise<{cached: number, total: number}>} キャッシュ結果
 */
export async function prefetchKanjiVg(kanjiList) {
  // 既にキャッシュ済みのキーを取得
  const cachedKeys = new Set(await idbGetAllKeys());
  const uncached = kanjiList.filter(k => {
    const hex = k.char.charCodeAt(0).toString(16).padStart(5, '0');
    return !memoryCache.has(hex) && !cachedKeys.has(hex);
  });

  let cached = kanjiList.length - uncached.length;
  for (const k of uncached) {
    // オフラインになったら中断
    if (!navigator.onLine) break;
    const hex = k.char.charCodeAt(0).toString(16).padStart(5, '0');
    try {
      const res = await fetchWithTimeout(
        `${KANJI_VG.CDN_URL}/${hex}.svg`,
        KANJI_VG.FETCH_TIMEOUT
      );
      if (res.ok) {
        const text = await res.text();
        const pathStrings = extractPathStrings(text);
        memoryCache.set(hex, pathStrings);
        await idbSet(hex, pathStrings);
        cached++;
      }
    } catch {
      // 個別の失敗は無視して次へ
    }
    // サーバー負荷軽減のため少し間隔を空ける
    await new Promise(r => setTimeout(r, 50));
  }
  return { cached, total: kanjiList.length };
}

/**
 * キャッシュ済み漢字数を取得する
 * @returns {Promise<number>}
 */
export async function getCachedKanjiCount() {
  const keys = await idbGetAllKeys();
  return keys.length;
}
