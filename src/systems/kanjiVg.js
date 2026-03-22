// ==========================================
// KanjiVG SVG データの取得・パース・キャッシュ
// 三層キャッシュ: メモリ → IndexedDB → ネットワーク
// タイムアウト・リトライ・指数バックオフ対応
// ==========================================
import { idbGet, idbSet, migrateFromLocalStorage } from './idb-cache';
import { KANJI_VG } from '../constants/gameConfig';

const LEGACY_STORAGE_KEY = 'kanji_vg_cache';

/** @type {Map<string, string[]>} メモリキャッシュ（セッション中は即返却） */
const memoryCache = new Map();

// 起動時に localStorage → IndexedDB へ移行（非同期・失敗無視）
migrateFromLocalStorage(LEGACY_STORAGE_KEY);

/**
 * タイムアウト付きfetch
 * @param {string} url
 * @param {number} timeout - タイムアウト(ms)
 * @returns {Promise<Response>}
 */
function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

/**
 * 指数バックオフ付きリトライfetch
 * @param {string} url
 * @param {number} maxRetries
 * @param {number} timeout
 * @returns {Promise<Response>}
 * @throws {Error} 全リトライ失敗時
 */
async function fetchWithRetry(url, maxRetries, timeout) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, timeout);
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    if (attempt < maxRetries - 1) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
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
 * @returns {Promise<{ paths: string[], strokeData: Array<{s: {x: number, y: number}, e: {x: number, y: number}, points: Array}> }>}
 * @throws {Error} 全リトライ失敗時
 */
export async function fetchKanjiVg(char) {
  const hex = char.charCodeAt(0).toString(16).padStart(5, '0');

  // 1. メモリキャッシュ
  if (memoryCache.has(hex)) {
    const cached = memoryCache.get(hex);
    return { paths: cached, strokeData: buildStrokeData(cached) };
  }

  // 2. IndexedDB キャッシュ
  const idbCached = await idbGet(hex);
  if (idbCached) {
    memoryCache.set(hex, idbCached);
    return { paths: idbCached, strokeData: buildStrokeData(idbCached) };
  }

  // 3. ネットワーク取得（リトライ付き）
  const res = await fetchWithRetry(
    `${KANJI_VG.CDN_URL}/${hex}.svg`,
    KANJI_VG.MAX_RETRIES,
    KANJI_VG.FETCH_TIMEOUT
  );
  const text = await res.text();
  const pathStrings = extractPathStrings(text);

  // キャッシュ保存（非同期・失敗無視）
  memoryCache.set(hex, pathStrings);
  idbSet(hex, pathStrings);

  return { paths: pathStrings, strokeData: buildStrokeData(pathStrings) };
}
