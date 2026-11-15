// まちづくり（配置）の計算 — マイ漢字タウン
// React に依存しない純粋な関数だけを置く（TownEditorView が使い、test/ から確かめる）。

import { GRID_SIZE } from './town-map-view.js';

/** 「建物を配置」のミッションに数える種類 */
export const MISSION_PLACE_TYPES = Object.freeze(['building', 'special', 'mega', 'rare']);

/**
 * 地図に置いてある数を、アイテムごとに 1 回で数える（"x,y:top" の上乗せも含む）。
 * もちものの残り数（持っている数 − 置いてある数）は、これを引いて求める。
 */
export function countPlacedItems(map) {
  const counts = {};
  for (const itemId of Object.values(map || {})) {
    if (typeof itemId !== 'string') continue;
    counts[itemId] = (counts[itemId] || 0) + 1;
  }
  return counts;
}

/** ミッションに数える建物が、地図にいくつ置いてあるか */
export function countMissionBuildings(map, itemMap) {
  let count = 0;
  for (const [itemId, n] of Object.entries(countPlacedItems(map))) {
    const item = itemMap.get(itemId);
    if (item && MISSION_PLACE_TYPES.includes(item.type)) count += n;
  }
  return count;
}

/**
 * 地図が変わったときに、ミッションに数える「新しく置いた」数を返す。
 * まちづくりを開いてからの最多の数（highWater）を超えた分だけを数えるので、
 * 動かす（持ち上げて置きなおす）・もとに戻してから置きなおす、では増えない。
 * @returns {{ gained: number, highWater: number }}
 */
export function trackPlacementGain(highWater, map, itemMap) {
  const placed = countMissionBuildings(map, itemMap);
  if (placed <= highWater) return { gained: 0, highWater };
  return { gained: placed - highWater, highWater: placed };
}

/**
 * もとに戻す履歴に、もう戻せない変更（開拓など、コインを払ったもの）を書きこむ。
 * 戻すと耕した地面だけが元の荒れ地に戻り、払ったコインは返らない、ということを防ぐ。
 * @param {object[]} history 地図の履歴
 * @param {object} patch 全部の履歴に当てる { "x,y": itemId }
 */
export function patchHistory(history, patch) {
  if (!patch) return history;
  return history.map((map) => ({ ...map, ...patch }));
}
/**
 * 大きな建物（size を持つもの）の左上のマスを、どのマスからでも引けるようにする。
 * @returns {Map<string, {anchorKey: string, ax: number, ay: number, item: object}>}
 */
export function buildMegaIndex(map, itemMap) {
  const index = new Map();
  for (const [key, itemId] of Object.entries(map || {})) {
    if (key.includes(':')) continue;
    const item = itemMap.get(itemId);
    if (!item || !item.size) continue;
    const [ax, ay] = key.split(',').map(Number);
    const entry = { anchorKey: key, ax, ay, item };
    for (let dy = 0; dy < item.size.h; dy++) {
      for (let dx = 0; dx < item.size.w; dx++) {
        index.set(`${ax + dx},${ay + dy}`, entry);
      }
    }
  }
  return index;
}

const isOpenGround = (id) => id === 't_cleared' || id === 't_weed';

/**
 * クラフトの「強化」（元の建物 → 上位の建物）を、もちものと地図の両方に反映する。
 *
 * もちもの（townItems）は「持っている数（置いてある分も含む）」なので、元の建物を
 * 使ったら地図の上からも減らさないと、起動時の整合補正（持っている数 = max(持っている数,
 * 置いてある数)）で元に戻ってしまう。
 * - まず、置いていない元の建物から使う
 * - 足りない分は地図の上の元の建物を使い、その場所に上位の建物が収まるなら置きかえる
 *   （収まらなければ更地に戻し、上位の建物はもちものに入る）
 *
 * @param {{ townMap: object, townItems: object }} state 強化する前の地図ともちもの
 * @param {{ requires: string, quantity: number, resultItemId: string, resultAmount: number }} upgrade
 * @param {Map<string, object>} itemMap
 * @returns {{ townMap: object, townItems: object, replacedOnMap: number, clearedOnMap: number }}
 */
export function applyUpgrade({ townMap, townItems }, { requires, quantity, resultItemId, resultAmount }, itemMap) {
  const map = { ...(townMap || {}) };
  const items = { ...(townItems || {}) };
  const owned = items[requires] || 0;
  const used = Math.max(0, Math.min(quantity, owned));
  const placedKeys = Object.keys(map).filter((key) => map[key] === requires);
  const unplaced = Math.max(0, owned - placedKeys.length);
  const fromMap = Math.max(0, used - unplaced);

  items[requires] = owned - used;
  items[resultItemId] = (items[resultItemId] || 0) + resultAmount;

  const source = itemMap.get(requires) || {};
  const result = itemMap.get(resultItemId) || {};
  const footprint = (item) => item.size || { w: 1, h: 1 };
  let replacedOnMap = 0;
  let clearedOnMap = 0;

  for (const key of placedKeys.slice(0, fromMap)) {
    const canReplace = replacedOnMap < resultAmount;
    if (key.endsWith(':top')) {
      // 道などの上に乗せた建物。上に乗せられる形（1 マス・平らでない）なら置きかえる
      if (canReplace && !result.size && !result.isFlat) { map[key] = resultItemId; replacedOnMap++; }
      else { delete map[key]; clearedOnMap++; }
      continue;
    }
    const [ax, ay] = key.split(',').map(Number);
    const src = footprint(source);
    const dst = footprint(result);
    const inSource = (x, y) => x >= ax && x < ax + src.w && y >= ay && y < ay + src.h;
    let fits = canReplace;
    for (let dy = 0; fits && dy < dst.h; dy++) {
      for (let dx = 0; fits && dx < dst.w; dx++) {
        const x = ax + dx;
        const y = ay + dy;
        const cell = `${x},${y}`;
        if (x >= GRID_SIZE || y >= GRID_SIZE) fits = false;
        else if (!inSource(x, y) && (!isOpenGround(map[cell]) || map[`${cell}:top`])) fits = false;
      }
    }
    // 元の建物の場所を更地に戻す（大きな建物なら足もと全部）
    for (let dy = 0; dy < src.h; dy++) {
      for (let dx = 0; dx < src.w; dx++) map[`${ax + dx},${ay + dy}`] = 't_cleared';
    }
    if (fits) {
      // 上位の建物は左上のマスに置き、ほかの足もとは更地にする（まちづくりで置くときと同じ決まり）
      for (let dy = 0; dy < dst.h; dy++) {
        for (let dx = 0; dx < dst.w; dx++) map[`${ax + dx},${ay + dy}`] = 't_cleared';
      }
      map[key] = resultItemId;
      replacedOnMap++;
    } else {
      clearedOnMap++;
    }
  }
  return { townMap: map, townItems: items, replacedOnMap, clearedOnMap };
}
