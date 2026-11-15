// ==========================================
// 書き順データ（KanjiVG）の読み込み・キャッシュ
//
// データはアプリに同梱している（public/kanjivg/grade-<学年>.json）。
// tools/build-kanjivg.mjs が、版を固定した KanjiVG から
// 画の d 属性と kvg:type だけを学年ごとに取り出して作る。
//
// 以前は jsDelivr の KanjiVG（@master）から1字ずつ取り、IndexedDB と
// Service Worker に二重に保存していた。校内フィルタで止められると書き順が
// 出ず、@master のため取った時期によって端末ごとに採点の基準が食い違いえた。
//
// キャッシュ: メモリ（学年ファイル単位）→ Service Worker（先読み済み）→ ネットワーク
// ==========================================
import { KANJI_VG } from '../constants/gameConfig.js';
import { KANJI_DATA } from '../data/kanji-data.js';
import { endingTypeFromKvgType } from './strokeKind.js';
import { resolveFromBase } from './base-path.js';

/** 学年ファイルの置き場（アプリの基点からの相対） */
const gradeFilePath = (grade) => `kanjivg/grade-${grade}.json`;

/** @type {Map<number, Promise<Record<string, Array<[string, string|null]>>>>} 学年 → 画データ */
const gradeCache = new Map();
/** @type {Set<number>} 読みこみ終えた学年 */
const loadedGrades = new Set();
/** @type {Map<string, Array<{d: string, type: string|null}>>} 16進 → 整えた画データ */
const memoryCache = new Map();

/** @type {Map<string, number>|null} 字 → 学年（初めて要るときに作る） */
let gradeOfChar = null;
const gradeOf = (char) => {
  if (!gradeOfChar) gradeOfChar = new Map(KANJI_DATA.map(k => [k.char, k.grade]));
  return gradeOfChar.get(char);
};

const hexOf = (char) => char.codePointAt(0).toString(16).padStart(5, '0');

const abortError = () => new DOMException('Aborted', 'AbortError');

// 旧版が端末に残した KanjiVG の写し（IndexedDB と、さらに古い localStorage）を片づける。
// 同梱データに替えたので読まない。残しておくと数MBを使い続けるうえ、
// @master から取った古い版が採点に混ざる余地が残る。
try { globalThis.indexedDB?.deleteDatabase('kanji-town-cache'); } catch { /* 使えない環境では何もしない */ }
try { globalThis.localStorage?.removeItem('kanji_vg_cache'); } catch { /* 同上 */ }

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
 * 学年ファイルを読む（指数バックオフ付きで数回ためす）。
 * 中身が期待した形でなければ失敗として扱い、メモリに残さない
 * （途中の機器が 200 で別のページを返しても、それを「画が0本」として覚えない）。
 * @param {number} grade
 * @returns {Promise<Record<string, Array<[string, string|null]>>>}
 */
async function fetchGradeFile(grade) {
  const url = resolveFromBase(gradeFilePath(grade));
  let lastError;
  for (let attempt = 0; attempt < KANJI_VG.MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, KANJI_VG.FETCH_TIMEOUT);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json || typeof json.strokes !== 'object' || json.strokes === null) throw new Error('kanjivg-broken');
      return json.strokes;
    } catch (e) {
      lastError = e;
    }
    if (attempt < KANJI_VG.MAX_RETRIES - 1) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

/** 学年ファイルを1回だけ読み、同時に来た呼び出しで分け合う。失敗したら次は読み直す。 */
function loadGrade(grade) {
  if (!gradeCache.has(grade)) {
    const pending = fetchGradeFile(grade).then((table) => {
      loadedGrades.add(grade);
      return table;
    }, (e) => {
      gradeCache.delete(grade);
      throw e;
    });
    gradeCache.set(grade, pending);
  }
  return gradeCache.get(grade);
}

/** 呼び出し側のキャンセルを待ちに反映する（共有している読み込み自体は止めない） */
function untilAborted(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (v) => { signal.removeEventListener('abort', onAbort); resolve(v); },
      (e) => { signal.removeEventListener('abort', onAbort); reject(e); },
    );
  });
}

/**
 * 学年ファイルの1字ぶんを {d, type} の並びに整える（形が違うものは捨てる）
 * @param {unknown} raw
 * @returns {Array<{d: string, type: string|null}>}
 */
function normalizeStrokes(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(s => (Array.isArray(s) ? { d: s[0], type: typeof s[1] === 'string' ? s[1] : null } : null))
    .filter(s => s && typeof s.d === 'string' && s.d);
}

/**
 * 各画をstrokeData（正規化座標のポイント群）に変換する
 * @param {Array<{d: string, type: string|null}>} strokes
 * @returns {Array<{s: {x: number, y: number}, e: {x: number, y: number}, points: Array<{x: number, y: number}>, endingType: string|null}>}
 */
function buildStrokeData(strokes) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svg.appendChild(pathEl);
  document.body.appendChild(svg);
  try {
    return strokes.map(({ d, type }) => {
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
        endingType: endingTypeFromKvgType(type),
      };
    });
  } finally {
    document.body.removeChild(svg);
  }
}

/**
 * 漢字の画データ（d属性＋筆画種）を取得する
 *
 * @param {string} char - 漢字1文字
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - キャンセル用シグナル
 * @returns {Promise<Array<{d: string, type: string|null}>>}
 * @throws {Error} 読めないとき・その字のデータが無いとき、または AbortError
 */
async function loadStrokes(char, options = {}) {
  const { signal } = options;
  if (signal?.aborted) throw abortError();
  if (typeof char !== 'string' || !char) throw new Error('kanjivg-missing');
  const hex = hexOf(char);
  if (memoryCache.has(hex)) return memoryCache.get(hex);

  // 教育漢字なら学年が決まっている。万一一覧に無い字なら、全学年を順に探す。
  const known = gradeOf(char);
  const grades = known ? [known] : [1, 2, 3, 4, 5, 6];
  for (const grade of grades) {
    const table = await untilAborted(loadGrade(grade), signal);
    const strokes = normalizeStrokes(table[hex]);
    if (strokes.length > 0) {
      memoryCache.set(hex, strokes);
      return strokes;
    }
  }
  // 画が0本のまま返すと、手本もなぞりも空のまま進んでしまう。失敗として扱う。
  throw new Error('kanjivg-missing');
}

/**
 * 漢字のKanjiVGデータ（描画用パス＋採点用の座標列）を取得する
 *
 * @param {string} char - 漢字1文字
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - キャンセル用シグナル
 * @returns {Promise<{ paths: string[], strokeData: Array<{s: {x: number, y: number}, e: {x: number, y: number}, points: Array}> }>}
 * @throws {Error} 読めないとき or AbortError
 */
export async function fetchKanjiVg(char, options = {}) {
  const strokes = await loadStrokes(char, options);
  return { paths: strokes.map(s => s.d), strokeData: buildStrokeData(strokes) };
}

/**
 * 表示だけに使う画パスを取得する（採点用の座標列は組み立てない軽量版）
 *
 * @param {string} char - 漢字1文字
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - キャンセル用シグナル
 * @returns {Promise<string[]>} 各画の d 属性
 * @throws {Error} 読めないとき or AbortError
 */
export async function fetchKanjiVgPaths(char, options = {}) {
  const strokes = await loadStrokes(char, options);
  return strokes.map(s => s.d);
}

/**
 * 学年ファイルを Service Worker のキャッシュに入れておく（中身は読まない）。
 * ふだんはインストール時の先読みで入っているので、通信は起きない。
 * 先読みが途中で切れた端末だけ、ここで足りない学年が補われる。
 *
 * @param {number[]} grades - 学年の並び
 * @returns {Promise<void>}
 */
export async function prefetchKanjiVgGrades(grades) {
  for (const grade of grades) {
    try {
      const res = await fetchWithTimeout(resolveFromBase(gradeFilePath(grade)), KANJI_VG.FETCH_TIMEOUT);
      if (res.ok) await res.arrayBuffer();
    } catch {
      // 圏外などで取れなければ次の起動でまたためす
    }
  }
}

/**
 * 圏外でも書き順を出せる漢字の数（Service Worker のキャッシュにある学年＋読みこみ済みの学年）
 * @returns {Promise<number>}
 */
export async function getCachedKanjiCount() {
  let count = 0;
  for (const grade of [1, 2, 3, 4, 5, 6]) {
    let available = loadedGrades.has(grade);
    if (!available && typeof caches !== 'undefined') {
      try {
        available = Boolean(await caches.match(resolveFromBase(gradeFilePath(grade))));
      } catch {
        available = false;
      }
    }
    if (available) count += KANJI_DATA.filter(k => k.grade === grade).length;
  }
  return count;
}
