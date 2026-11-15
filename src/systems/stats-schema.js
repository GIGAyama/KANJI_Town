/**
 * 保存データ（kanji_town_v7）の形を確かめて整える。
 *
 * ここを通さずに読みこむと、型の違う欄が1つあるだけで起動のたびに例外が出て、
 * 画面が真っ白のまま戻らなかった（例: kanjiStats が文字列、villagers がオブジェクト）。
 * バックアップの読み込みも中身を見ずに上書きしていたので、
 * {"totalExp":0} のようなファイル1つで記録がすべて消えていた。
 *
 * 方針:
 * - 型の違う欄は、その欄だけを捨てる（getStats の既定値で埋めなおされる）。全体は捨てない
 * - 数字の欄に数字の文字列が入っていたら数字に直す（"100" + 50 が "10050" になるのを防ぐ）
 * - __proto__ / constructor / prototype のキーは捨てる
 *
 * React や JSX に依存させない（node --test から読めるようにするため）。
 */

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** 0 以上の数を持つ欄 */
const COUNT_FIELDS = [
  'totalExp', 'coins', 'streak', 'population', 'perfectCountTotal', 'exploredRadius',
  'mapSize', 'sessionCount', 'craftCount', 'schemaVersion', 'restPassRechargeProgress',
  'satisfaction',
];

/** ふつうのオブジェクトを持つ欄 */
const OBJECT_FIELDS = ['kanjiStats', 'townMap', 'townItems', 'achievements', 'materials', 'daily', 'settings'];

/** 配列を持つ欄 */
const ARRAY_FIELDS = ['myDrills', 'villagers', 'unlockedKanji', 'seenHints', 'dailyMissions'];

/** 文字列を持つ欄 */
const STRING_FIELDS = [
  'lastDate', 'lastNeglectAppliedDate', 'lastCollectionDate', 'lastRestPassDate',
  'lastLoginBonusDate', 'dailyMissionsDate',
];

/** 1日の記録の中の数の欄 */
const DAILY_COUNT_FIELDS = ['exp', 'reviewed', 'perfects', 'attempts', 'correct'];

/** バックアップとして読みこめるファイルの大きさの上限（端末の localStorage より十分大きい） */
export const IMPORT_MAX_BYTES = 8 * 1024 * 1024;

export function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** 数字か数字の文字列なら 0 以上の有限の数にして返す。違えば undefined */
function toCount(value) {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof number !== 'number' || !Number.isFinite(number)) return undefined;
  return Math.max(0, number);
}

/** 学年は 1〜6 の整数。数字の文字列も受けつける。違えば undefined */
export function toGrade(value) {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return Number.isInteger(number) && number >= 1 && number <= 6 ? number : undefined;
}

/** ふつうのオブジェクトの中身を、keep が true を返すものだけにした新しいオブジェクト */
function filterEntries(object, keep) {
  const result = {};
  for (const [key, value] of Object.entries(object)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    const kept = keep(value, key);
    if (kept !== undefined) result[key] = kept;
  }
  return result;
}

const keepPlainObject = (value) => (isPlainObject(value) ? value : undefined);
const keepString = (value) => (typeof value === 'string' ? value : undefined);

function sanitizeDailyEntry(entry) {
  if (!isPlainObject(entry)) return undefined;
  const result = filterEntries(entry, (value) => value);
  for (const field of DAILY_COUNT_FIELDS) {
    if (field in result) {
      const count = toCount(result[field]);
      if (count === undefined) delete result[field];
      else result[field] = count;
    }
  }
  return result;
}

function sanitizeDrill(drill) {
  if (!isPlainObject(drill)) return undefined;
  const kanjis = Array.isArray(drill.kanjis) ? drill.kanjis.filter(id => typeof id === 'string') : [];
  if (kanjis.length === 0) return undefined;
  return {
    ...filterEntries(drill, (value) => value),
    name: typeof drill.name === 'string' ? drill.name : String(drill.name ?? ''),
    kanjis,
  };
}

/**
 * 保存データの型を整えた写しを返す。根がオブジェクトでなければ null。
 * @param {unknown} raw
 * @returns {{ stats: object, repaired: string[] } | null} repaired は直した欄の名前
 */
export function sanitizeStats(raw) {
  if (!isPlainObject(raw)) return null;
  const repaired = [];
  const stats = filterEntries(raw, (value) => value);
  const drop = (field) => { delete stats[field]; repaired.push(field); };

  for (const field of COUNT_FIELDS) {
    if (!(field in stats) || stats[field] === undefined) continue;
    const count = toCount(stats[field]);
    if (count === undefined) drop(field);
    else if (count !== stats[field]) { stats[field] = count; repaired.push(field); }
  }

  if ('targetGrade' in stats) {
    const grade = toGrade(stats.targetGrade);
    if (grade === undefined) drop('targetGrade');
    else stats.targetGrade = grade;
  }

  for (const field of OBJECT_FIELDS) {
    if (!(field in stats)) continue;
    if (!isPlainObject(stats[field])) drop(field);
  }
  for (const field of ARRAY_FIELDS) {
    if (!(field in stats)) continue;
    if (!Array.isArray(stats[field])) drop(field);
  }
  for (const field of STRING_FIELDS) {
    if (!(field in stats) || typeof stats[field] === 'string') continue;
    drop(field);
  }

  // 中身の型。1件だけ壊れていても、ほかの記録は残す。
  if (stats.kanjiStats) stats.kanjiStats = filterEntries(stats.kanjiStats, keepPlainObject);
  if (stats.townMap) stats.townMap = filterEntries(stats.townMap, keepString);
  if (stats.townItems) stats.townItems = filterEntries(stats.townItems, toCount);
  if (stats.materials) stats.materials = filterEntries(stats.materials, toCount);
  if (stats.achievements) stats.achievements = filterEntries(stats.achievements, keepPlainObject);
  if (stats.daily) stats.daily = filterEntries(stats.daily, sanitizeDailyEntry);
  if (stats.settings) stats.settings = filterEntries(stats.settings, (value) => value);
  if (stats.villagers) stats.villagers = stats.villagers.filter(isPlainObject);
  if (stats.unlockedKanji) stats.unlockedKanji = stats.unlockedKanji.filter(id => typeof id === 'string');
  if (stats.seenHints) stats.seenHints = stats.seenHints.filter(key => typeof key === 'string');
  if (stats.dailyMissions) stats.dailyMissions = stats.dailyMissions.filter(isPlainObject);
  if (stats.myDrills) stats.myDrills = stats.myDrills.map(sanitizeDrill).filter(Boolean);

  return { stats, repaired };
}

/**
 * バックアップとして読みこんでよいかを判定し、よければ整えた写しを返す。
 * このアプリが書き出したものだけを受けつける（学年と漢字の記録を持っていること）。
 * @param {unknown} raw - JSON.parse した値
 * @returns {{ ok: true, stats: object, repaired: string[] } | { ok: false, reason: string }}
 */
export function validateImportedStats(raw) {
  if (!isPlainObject(raw)) return { ok: false, reason: 'not-object' };
  if (toGrade(raw.targetGrade) === undefined) return { ok: false, reason: 'no-grade' };
  if (!isPlainObject(raw.kanjiStats)) return { ok: false, reason: 'no-kanji-stats' };
  if (toCount(raw.totalExp) === undefined) return { ok: false, reason: 'no-exp' };
  const result = sanitizeStats(raw);
  return { ok: true, stats: result.stats, repaired: result.repaired };
}
