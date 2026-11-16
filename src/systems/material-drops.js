// 字を書けたときに手に入る素材 — マイ漢字タウン
//
// 学習の記録（App.jsx の handleUpdateStat）が使う。クラフトの処理（crafting.js）と同じファイルに
// 置くと、町づくりの画面でしか使わない変換表まで初回の JS に入るので、ここだけを分けてある。

import { BASE_MATERIALS } from '../data/materials';

/**
 * Calculate material drops for mastering a kanji.
 *
 * If the kanji object already contains a `materialDrops` array (as defined in
 * the grade JSON files), that is used directly. Otherwise a deterministic
 * fallback is generated based on the kanji's stroke count and grade so that
 * every kanji yields *something*.
 *
 * @param {Object} kanji - Kanji object from KANJI_DATA
 * @returns {Object} materials gained {wood: 2, stone: 1, ...}
 */
export function calculateMaterialDrops(kanji) {
  if (!kanji) return {};

  // If the kanji data already specifies drops, aggregate them into an object
  if (kanji.materialDrops && Array.isArray(kanji.materialDrops)) {
    const drops = {};
    for (const drop of kanji.materialDrops) {
      drops[drop.type] = (drops[drop.type] || 0) + drop.amount;
    }
    return drops;
  }

  // Deterministic fallback based on stroke count and character code
  const baseKeys = Object.keys(BASE_MATERIALS);
  const strokes = kanji.strokes || kanji.strokeCount || 1;
  const charCode = kanji.char ? kanji.char.charCodeAt(0) : 0;

  const drops = {};

  // Primary material — determined by character code for even distribution
  const primaryIdx = charCode % baseKeys.length;
  const primaryMaterial = baseKeys[primaryIdx];
  drops[primaryMaterial] = Math.max(1, Math.floor(strokes / 3) + 1);

  // Secondary material — offset by half the palette
  const secondaryIdx = (charCode + Math.floor(baseKeys.length / 2)) % baseKeys.length;
  const secondaryMaterial = baseKeys[secondaryIdx];
  if (secondaryMaterial !== primaryMaterial) {
    drops[secondaryMaterial] = Math.max(1, Math.floor(strokes / 5) + 1);
  }

  // Every kanji also drops a small amount of kanjistone
  drops.kanjistone = (drops.kanjistone || 0) + 1;

  return drops;
}
