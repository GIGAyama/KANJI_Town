// KanjiVG SVG データの取得・パース・キャッシュ
// - タイムアウト (5秒)
// - リトライ (3回、指数バックオフ)
// - メモリキャッシュ + localStorage キャッシュ

const CDN_URL = 'https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji';
const FETCH_TIMEOUT = 5000;
const MAX_RETRIES = 3;
const STORAGE_KEY = 'kanji_vg_cache';
const VIEWBOX_SIZE = 109;
const SAMPLE_INTERVAL = 2;

// メモリキャッシュ（セッション中は即返却）
const memoryCache = new Map();

// localStorage キャッシュの読み書き
function readDiskCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeDiskCache(key, pathStrings) {
  try {
    const cache = readDiskCache();
    cache[key] = pathStrings;
    // 最大200漢字分を保持（古いものから削除）
    const keys = Object.keys(cache);
    if (keys.length > 200) {
      keys.slice(0, keys.length - 200).forEach(k => delete cache[k]);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch { /* localStorage容量超過時は無視 */ }
}

// タイムアウト付きfetch
function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

// 指数バックオフ付きリトライ
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

// SVGテキストから path の d 属性文字列を抽出
function extractPathStrings(svgText) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  return Array.from(doc.querySelectorAll('path')).map(p => p.getAttribute('d'));
}

// path 文字列配列 → strokeData（正規化座標のポイント群）
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
      for (let i = 0; i <= len; i += SAMPLE_INTERVAL) {
        const pt = pathEl.getPointAtLength(i);
        points.push({ x: pt.x / VIEWBOX_SIZE, y: pt.y / VIEWBOX_SIZE });
      }
      const endPt = pathEl.getPointAtLength(len);
      points.push({ x: endPt.x / VIEWBOX_SIZE, y: endPt.y / VIEWBOX_SIZE });
      return {
        s: { x: pathEl.getPointAtLength(0).x / VIEWBOX_SIZE, y: pathEl.getPointAtLength(0).y / VIEWBOX_SIZE },
        e: { x: endPt.x / VIEWBOX_SIZE, y: endPt.y / VIEWBOX_SIZE },
        points,
      };
    });
  } finally {
    document.body.removeChild(svg);
  }
}

/**
 * 漢字のKanjiVGデータを取得する
 * @param {string} char - 漢字1文字
 * @returns {Promise<{ paths: string[], strokeData: Array<{s,e,points}> }>}
 * @throws {Error} 全リトライ失敗時
 */
export async function fetchKanjiVg(char) {
  const hex = char.charCodeAt(0).toString(16).padStart(5, '0');

  // 1. メモリキャッシュ
  if (memoryCache.has(hex)) {
    const cached = memoryCache.get(hex);
    return { paths: cached, strokeData: buildStrokeData(cached) };
  }

  // 2. localStorage キャッシュ
  const disk = readDiskCache();
  if (disk[hex]) {
    memoryCache.set(hex, disk[hex]);
    return { paths: disk[hex], strokeData: buildStrokeData(disk[hex]) };
  }

  // 3. ネットワーク取得（リトライ付き）
  const res = await fetchWithRetry(`${CDN_URL}/${hex}.svg`, MAX_RETRIES, FETCH_TIMEOUT);
  const text = await res.text();
  const pathStrings = extractPathStrings(text);

  // キャッシュ保存
  memoryCache.set(hex, pathStrings);
  writeDiskCache(hex, pathStrings);

  return { paths: pathStrings, strokeData: buildStrokeData(pathStrings) };
}
