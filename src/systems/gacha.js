import { GACHA_POOL } from '../data/gacha-pool';

/**
 * ガチャを1回引く
 * @returns {string} 獲得したアイテムのID
 */
export const gachaRoll = () => {
  const totalWeight = GACHA_POOL.reduce((s, t) => s + t.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const tier of GACHA_POOL) {
    rand -= tier.weight;
    if (rand <= 0) {
      return tier.items[Math.floor(Math.random() * tier.items.length)];
    }
  }
  return GACHA_POOL[0].items[0];
};

/**
 * ガチャを複数回引く
 * @param {number} count 引く回数
 * @returns {string[]} 獲得したアイテムIDの配列
 */
export const bulkGachaRoll = (count = 10) => {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(gachaRoll());
  }
  return results;
};

/**
 * アイテムが「レア」かどうかを判定する
 * @param {string} itemId アイテムID
 * @returns {boolean}
 */
export const isRareItem = (itemId) => {
  // GACHA_POOL の後ろ2つのティア（weight 40 と 10）をレアとする
  const rareTiers = GACHA_POOL.slice(-2);
  return rareTiers.some(tier => tier.items.includes(itemId));
};
