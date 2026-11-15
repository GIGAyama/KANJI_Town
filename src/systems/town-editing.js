// まちづくり（配置）の計算 — マイ漢字タウン
// React に依存しない純粋な関数だけを置く（TownEditorView が使い、test/ から確かめる）。

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
