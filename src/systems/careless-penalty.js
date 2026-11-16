// てきとう書き（ほとんど書かずに答え合わせをした）への重いペナルティ — マイ漢字タウン
//
// 画面（TestMode）が「このまま こたえあわせ」を確かめたあとにだけ呼ぶ。ここは計算だけを行い、
// React にも .jsx のデータにも依存しない（アイテムの表は呼ぶ側が渡す。test/ から確かめるため）。
//
// 科すもの（constants/gameConfig.js の CARELESS.HEAVY_STEPS。通算の回数で重くなる）:
// - コインと、もちもの（町に置いた建物もふくむ）の半分
// - 素材の全部
// - レベル（下げた先のレベルの始まりまで、総EXP を減らす）
// - 町の土地（「かれた土地」になり、開拓も建築もできない。学習しても戻らない）
//
// 何を失ったかは記録（stats.carelessLog）に残す。まちがって科されたときに、先生が元に戻せるようにするため。

import { CARELESS, MAP } from '../constants/gameConfig.js';
import { getExpForLevel, getLevelInfoFromExp } from '../utils/level-system.js';

/** かれた土地（開拓できない・建物を置けない・学習しても戻らない） */
export const DEAD_LAND = 't_deadland';

/** 建物を置ける地面 */
const OPEN_GROUND = new Set(['t_cleared', 't_weed']);
/** まだ開拓していない地面（開拓すれば使える） */
const WILD_GROUND = new Set(['t_roughland', 't_grassland', 't_forest_floor', 't_sand', 't_highland']);

const countOf = (value) => Math.max(0, Math.floor(Number(value) || 0));
const logOf = (stats) => (Array.isArray(stats?.carelessLog) ? stats.carelessLog : []);

/** その日に科した重いペナルティの数（元に戻したものは数えない） */
export function heavyPenaltiesOn(stats, today) {
  return logOf(stats).filter((entry) => entry?.date === today && !entry.restoredOn).length;
}

/**
 * いま「このまま こたえあわせ」を選ぶと何が起きるか（確かめの画面に出す）。
 * @returns {{ heavy: boolean, strike: number, step: object|null, nextStep: object|null }}
 *   heavy: 重いペナルティを科すか（1日の上限に届いていれば false）。strike: 通算で何回目になるか
 */
export function previewCarelessPenalty(stats, today) {
  const steps = CARELESS.HEAVY_STEPS;
  const strikes = countOf(stats?.carelessStrikes);
  const heavy = steps.length > 0 && heavyPenaltiesOn(stats, today) < CARELESS.HEAVY_PER_DAY;
  const stepAt = (index) => steps[Math.min(index, steps.length - 1)] || null;
  return { heavy, strike: strikes + 1, step: heavy ? stepAt(strikes) : null, nextStep: stepAt(strikes + (heavy ? 1 : 0)) };
}

/** 割合ぶんの数（端数は rng で切り上げ・切り捨てを決める。1個だけの持ち物も半分の確率で失う） */
function portionOf(count, rate, rng) {
  const exact = count * Math.max(0, Math.min(1, Number(rate) || 0));
  const whole = Math.floor(exact);
  return whole + (rng() < exact - whole ? 1 : 0);
}

/** 並びをかきまぜた写し */
function shuffled(list, rng) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 大きな建物の足もとのマス（左上のマスにだけ建物の ID が入り、ほかは更地として記録されている） */
function megaFootprint(map, itemMap) {
  const cells = new Set();
  for (const [key, itemId] of Object.entries(map)) {
    if (key.includes(':')) continue;
    const size = itemMap.get(itemId)?.size;
    if (!size) continue;
    const [ax, ay] = key.split(',').map(Number);
    for (let dy = 0; dy < size.h; dy++) for (let dx = 0; dx < size.w; dx++) cells.add(`${ax + dx},${ay + dy}`);
  }
  return cells;
}

/** もちものを減らす。足りない分は町に置いた建物から取りのぞく */
function takeItems(townItems, map, rate, itemMap, rng) {
  const items = { ...townItems };
  const lost = {};
  const placed = [];
  for (const [itemId, raw] of Object.entries(townItems)) {
    const item = itemMap.get(itemId);
    const owned = countOf(raw);
    if (!item || item.type === 'terrain' || owned === 0) continue;
    const want = portionOf(owned, rate, rng);
    if (want === 0) continue;
    const placedKeys = Object.keys(map).filter((key) => map[key] === itemId);
    const spare = Math.max(0, owned - placedKeys.length);
    // 上に建物が乗っている道などは、そのままにする（上の建物だけが宙に残らないように）
    const removable = shuffled(placedKeys.filter((key) => key.endsWith(':top') || !map[`${key}:top`]), rng);
    const fromMap = removable.slice(0, Math.max(0, want - spare));
    for (const key of fromMap) {
      if (key.endsWith(':top')) delete map[key];
      else map[key] = 't_cleared';
      placed.push([key, itemId]);
    }
    const taken = Math.min(want, spare) + fromMap.length;
    if (taken === 0) continue;
    lost[itemId] = taken;
    if (owned - taken > 0) items[itemId] = owned - taken;
    else delete items[itemId];
  }
  return { items, lost, placed };
}

/** 町の中心に近い土地から、かれた土地にする。建物は壊さない（使える地面 → まだ開拓していない地面 の順） */
function killLand(map, count, exploredRadius, itemMap, rng) {
  const footprint = megaFootprint(map, itemMap);
  const candidates = [];
  for (const [key, itemId] of Object.entries(map)) {
    if (key.includes(':')) continue;
    const open = OPEN_GROUND.has(itemId) && !map[`${key}:top`] && !footprint.has(key);
    if (!open && !WILD_GROUND.has(itemId)) continue;
    const [x, y] = key.split(',').map(Number);
    const distance = Math.max(Math.abs(x - MAP.CENTER), Math.abs(y - MAP.CENTER));
    if (distance > exploredRadius) continue;
    // 使える地面を先に（tier 0）、同じ距離の中では かきまぜる
    candidates.push({ key, itemId, order: (open ? 0 : 1000) + distance + rng() * 0.99 });
  }
  candidates.sort((a, b) => a.order - b.order);
  const dead = [];
  for (const { key, itemId } of candidates.slice(0, count)) {
    map[key] = DEAD_LAND;
    dead.push([key, itemId]);
  }
  return dead;
}

/**
 * 重いペナルティを科した新しい記録を返す（1日の上限に届いているときは何もしない）。
 * @param {object} stats
 * @param {{ today: string, itemMap: Map<string, object>, rng?: () => number }} context
 * @returns {{ stats: object, entry: object|null }} entry: 失ったもの（記録にも同じものが入る）
 */
export function applyHeavyPenalty(stats, { today, itemMap, rng = Math.random }) {
  const { heavy, strike, step } = previewCarelessPenalty(stats, today);
  if (!heavy || !step) return { stats, entry: null };

  const entry = { date: today, strike };
  const next = { ...stats, carelessStrikes: strike };
  const map = { ...(stats.townMap || {}) };

  if (step.coins) {
    const coins = countOf(stats.coins);
    const lost = Math.floor(coins * Math.min(1, step.coins));
    if (lost > 0) { entry.coins = lost; next.coins = coins - lost; }
  }
  if (step.items) {
    const taken = takeItems(stats.townItems || {}, map, step.items, itemMap, rng);
    if (Object.keys(taken.lost).length > 0) {
      entry.items = taken.lost;
      if (taken.placed.length > 0) entry.placed = taken.placed;
      next.townItems = taken.items;
    }
  }
  if (step.materials) {
    const kept = {};
    const lost = {};
    for (const [id, raw] of Object.entries(stats.materials || {})) {
      const amount = countOf(raw);
      const gone = Math.min(amount, Math.ceil(amount * Math.min(1, step.materials)));
      if (gone > 0) lost[id] = gone;
      if (amount - gone > 0) kept[id] = amount - gone;
    }
    if (Object.keys(lost).length > 0) { entry.materials = lost; next.materials = kept; }
  }
  if (step.levels) {
    const totalExp = countOf(stats.totalExp);
    const level = getLevelInfoFromExp(totalExp).level;
    const target = Math.max(1, level - step.levels);
    const lostExp = totalExp - getExpForLevel(target);
    if (lostExp > 0) { entry.exp = lostExp; entry.levels = level - target; next.totalExp = totalExp - lostExp; }
  }
  if (step.land) {
    const dead = killLand(map, step.land, countOf(stats.exploredRadius) || MAP.INITIAL_EXPLORE_RADIUS, itemMap, rng);
    if (dead.length > 0) entry.land = dead;
  }

  next.townMap = map;
  next.carelessLog = [...logOf(stats), entry].slice(-CARELESS.LOG_MAX);
  return { stats: next, entry };
}

/** 記録の1件を、画面に出す数にまとめる */
export function summarizePenalty(entry) {
  const sum = (object) => Object.values(object || {}).reduce((total, value) => total + countOf(value), 0);
  return {
    coins: countOf(entry?.coins),
    items: sum(entry?.items),
    materials: sum(entry?.materials),
    levels: countOf(entry?.levels),
    land: Array.isArray(entry?.land) ? entry.land.length : 0,
  };
}

/** いくつかの記録を1つにまとめる（結果の画面で、その回に失ったものを出す） */
export function totalPenalty(entries) {
  const total = { coins: 0, items: 0, materials: 0, levels: 0, land: 0 };
  for (const entry of entries || []) {
    const one = summarizePenalty(entry);
    for (const key of Object.keys(total)) total[key] += one[key];
  }
  return total;
}

/** 元に戻せる、いちばん新しい記録の位置（無ければ -1） */
export function lastRestorableIndex(stats) {
  const log = logOf(stats);
  for (let i = log.length - 1; i >= 0; i--) if (log[i] && !log[i].restoredOn) return i;
  return -1;
}

/**
 * 科したペナルティを元に戻す（先生向け。まちがって科されたとき）。
 * コイン・もちもの・素材・EXP を足しなおし、かれた土地を元の地面に戻す。町から取りのぞいた建物は、
 * 元の場所が空いていれば置きなおし、空いていなければ もちものに戻るだけになる。
 * @param {object} stats
 * @param {{ index?: number, today: string, itemMap: Map<string, object> }} context
 * @returns {{ stats: object, restored: boolean }}
 */
export function restoreHeavyPenalty(stats, { index = lastRestorableIndex(stats), today, itemMap }) {
  const log = logOf(stats);
  const entry = log[index];
  if (!entry || entry.restoredOn) return { stats, restored: false };

  const next = { ...stats };
  const map = { ...(stats.townMap || {}) };
  if (entry.coins) next.coins = countOf(stats.coins) + countOf(entry.coins);
  if (entry.exp) next.totalExp = countOf(stats.totalExp) + countOf(entry.exp);
  if (entry.materials) {
    next.materials = { ...(stats.materials || {}) };
    for (const [id, amount] of Object.entries(entry.materials)) next.materials[id] = countOf(next.materials[id]) + countOf(amount);
  }
  // かれた土地を先に戻す（建物を置きなおす場所が空くように）
  for (const [key, was] of entry.land || []) {
    if (map[key] === DEAD_LAND) map[key] = was;
  }
  if (entry.items) {
    next.townItems = { ...(stats.townItems || {}) };
    for (const [id, amount] of Object.entries(entry.items)) next.townItems[id] = countOf(next.townItems[id]) + countOf(amount);
    for (const [key, itemId] of entry.placed || []) {
      const item = itemMap.get(itemId);
      if (!item) continue;
      if (key.endsWith(':top')) {
        const base = itemMap.get(map[key.slice(0, -4)]);
        if (base?.isFlat && !map[key]) map[key] = itemId;
        continue;
      }
      const [ax, ay] = key.split(',').map(Number);
      const size = item.size || { w: 1, h: 1 };
      let free = true;
      for (let dy = 0; free && dy < size.h; dy++) {
        for (let dx = 0; free && dx < size.w; dx++) {
          const cell = `${ax + dx},${ay + dy}`;
          if (!OPEN_GROUND.has(map[cell]) || map[`${cell}:top`]) free = false;
        }
      }
      if (!free) continue;
      for (let dy = 0; dy < size.h; dy++) for (let dx = 0; dx < size.w; dx++) map[`${ax + dx},${ay + dy}`] = 't_cleared';
      map[key] = itemId;
    }
  }
  next.townMap = map;
  next.carelessStrikes = Math.max(0, countOf(stats.carelessStrikes) - 1);
  next.carelessLog = log.map((one, i) => (i === index ? { ...one, restoredOn: today } : one));
  return { stats: next, restored: true };
}
