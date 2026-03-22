// ==========================================
// 住民システム — マイ漢字タウン
// 自動素材収集・満足度・職業管理
// ==========================================

import { OCCUPATIONS, getOccupation, assignOccupation } from '../data/residents';
import { TOWN_ITEMS } from '../data/town-items';
import { RESIDENTS } from '../constants/gameConfig';

// ── TOWN_ITEMSのルックアップマップ（O(1)検索） ──
const _townItemMap = new Map(TOWN_ITEMS.map(i => [i.id, i]));

/**
 * TOWN_ITEMSからIDで検索する
 * @param {string} id
 * @returns {object|undefined}
 */
function findTownItem(id) {
  return _townItemMap.get(id);
}

// ── 住居として扱うタイルID ──
const HOUSE_IDS = new Set(['t_house1', 't_house2', 't_house3']);
// ── 自然物として扱うタイルID ──
const NATURE_IDS = new Set(['t_tree', 't_sakura', 't_flower', 't_pine']);

/**
 * 街の満足度を計算する（0〜100）
 *
 * 構成要素:
 * - ベース値: 50
 * - 建物種類ボーナス: 種類数 × 2（最大+20）
 * - ストリークボーナス: 連続日数 × 3（最大+15）
 * - 住居バランスボーナス: 住居率 × 10（最大+10）
 * - 自然環境ボーナス: 自然物3個以上で+5
 * - 過密ペナルティ: 超過人口 × 2（最大-20）
 * - 雑草ペナルティ: 雑草数 × 1（最大-15）
 *
 * @param {object} stats - ゲーム統計データ
 * @returns {number} 0-100
 */
export function calculateSatisfaction(stats) {
  const population = stats.population || 0;
  if (population === 0) return 0;

  let satisfaction = RESIDENTS.BASE_SATISFACTION;

  // タウンマップを1回だけ走査して必要な情報を収集する
  const buildingTypes = new Set();
  let houseCount = 0;
  let natureCount = 0;
  let weedCount = 0;

  Object.values(stats.townMap || {}).forEach(itemId => {
    const item = findTownItem(itemId);
    if (item && (item.type === 'building' || item.type === 'special')) {
      buildingTypes.add(itemId);
    }
    if (HOUSE_IDS.has(itemId)) houseCount++;
    if (NATURE_IDS.has(itemId)) natureCount++;
    if (itemId === 't_weed') weedCount++;
  });

  // 建物種類ボーナス
  satisfaction += Math.min(
    RESIDENTS.BUILDING_DIVERSITY_MAX,
    buildingTypes.size * RESIDENTS.BUILDING_DIVERSITY_MULTIPLIER
  );

  // ストリークボーナス
  satisfaction += Math.min(
    RESIDENTS.STREAK_BONUS_MAX,
    (stats.streak || 0) * RESIDENTS.STREAK_BONUS_MULTIPLIER
  );

  // 住居バランスボーナス（家の数と人口のバランス）
  const housingCapacity = Math.ceil(population / RESIDENTS.HOUSING_CAPACITY);
  const housingRatio = houseCount > 0 ? Math.min(1, houseCount / housingCapacity) : 0;
  satisfaction += Math.floor(housingRatio * 10);

  // 自然環境ボーナス
  if (natureCount >= RESIDENTS.NATURE_BONUS_THRESHOLD) {
    satisfaction += RESIDENTS.NATURE_BONUS;
  }

  // 過密ペナルティ（初期拠点で+3人の余裕）
  const capacity = houseCount * RESIDENTS.HOUSING_CAPACITY + RESIDENTS.HOUSING_CAPACITY;
  if (population > capacity) {
    const overcrowding = population - capacity;
    satisfaction -= Math.min(20, overcrowding * RESIDENTS.OVERCROWDING_MULTIPLIER);
  }

  // 雑草ペナルティ
  satisfaction -= Math.min(15, weedCount * RESIDENTS.WEED_PENALTY_MULTIPLIER);

  return Math.max(0, Math.min(100, Math.round(satisfaction)));
}

/**
 * 満足度に基づくEXP・収集効率倍率を取得する
 * @param {number} satisfaction - 0-100
 * @returns {number} 倍率(0.7-1.3)
 */
export function getSatisfactionMultiplier(satisfaction) {
  const tier = RESIDENTS.SATISFACTION_TIERS.find(t => satisfaction >= t.min);
  return tier ? tier.multiplier : RESIDENTS.SATISFACTION_TIERS[RESIDENTS.SATISFACTION_TIERS.length - 1].multiplier;
}

/**
 * 満足度のラベル・絵文字・色を取得する
 * @param {number} satisfaction
 * @returns {{ text: string, emoji: string, color: string }}
 */
export function getSatisfactionLabel(satisfaction) {
  if (satisfaction >= 80) return { text: 'とても幸せ', emoji: '😄', color: '#22c55e' };
  if (satisfaction >= 60) return { text: '満足', emoji: '😊', color: '#84cc16' };
  if (satisfaction >= 40) return { text: 'ふつう', emoji: '😐', color: '#eab308' };
  if (satisfaction >= 20) return { text: '不満', emoji: '😟', color: '#f97316' };
  return { text: 'とても不満', emoji: '😢', color: '#ef4444' };
}

// ── 自動素材収集 ──

/**
 * 住民による日次素材収集を実行する
 * @param {object} stats
 * @returns {{ materials: Object<string, number>, coins: number }}
 */
export function collectDailyResources(stats) {
  const villagers = stats.villagers || [];
  if (villagers.length === 0) return { materials: {}, coins: 0 };

  const satisfaction = calculateSatisfaction(stats);
  const multiplier = getSatisfactionMultiplier(satisfaction);

  const collected = {};
  let totalCoins = 0;

  for (const villager of villagers) {
    const occ = getOccupation(villager.occupation || 'farmer');
    if (!occ) continue;

    if (occ.collectibles) {
      for (const drop of occ.collectibles) {
        const amount = Math.max(1, Math.round(drop.baseAmount * multiplier));
        collected[drop.material] = (collected[drop.material] || 0) + amount;
      }
    }

    totalCoins += Math.round((occ.coinBonus || 0) * multiplier);
  }

  return { materials: collected, coins: totalCoins };
}

// ── 建物維持費 ──

/** 建物タイプごとの維持費（1日あたりのコイン） */
const MAINTENANCE_RATES = {
  building: 3,
  special: 8,
  mega: 15,
  rare: 10,
  decoration: 2,
};

/**
 * 全建物の日次維持費を計算する
 * @param {object} stats
 * @returns {number} 合計維持費(コイン)
 */
export function calculateMaintenanceCost(stats) {
  const townMap = stats.townMap || {};
  let totalCost = 0;

  // タイプごとの建物数を集計
  const typeCounts = {};
  for (const itemId of Object.values(townMap)) {
    const item = findTownItem(itemId);
    if (!item || !MAINTENANCE_RATES[item.type]) continue;
    typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
  }

  for (const [type, count] of Object.entries(typeCounts)) {
    totalCost += (MAINTENANCE_RATES[type] || 0) * count;
  }

  return totalCost;
}

// ── 住民生成 ──

/**
 * 漢字習得時に新しい住民を生成する
 * @param {object} kanjiObj - 漢字データ
 * @param {number} spawnX - 出現X座標
 * @param {number} spawnY - 出現Y座標
 * @returns {object} 住民データ
 */
export function createVillager(kanjiObj, spawnX, spawnY) {
  const occupation = assignOccupation(kanjiObj.grade || 1);
  return {
    id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    x: spawnX,
    y: spawnY,
    kanjiChar: kanjiObj.char,
    kanjiGrade: kanjiObj.grade || 1,
    occupation,
    born: Date.now(),
    happiness: RESIDENTS.BASE_SATISFACTION,
  };
}

// ── 住民統計 ──

/**
 * 住民の職業分布統計を取得する
 * @param {Array} villagers
 * @returns {{ occupationCounts: Object<string, number>, total: number }}
 */
export function getResidentStats(villagers) {
  const occupationCounts = {};
  for (const occ of OCCUPATIONS) {
    occupationCounts[occ.id] = 0;
  }
  for (const v of (villagers || [])) {
    const occId = v.occupation || 'farmer';
    occupationCounts[occId] = (occupationCounts[occId] || 0) + 1;
  }
  return { occupationCounts, total: (villagers || []).length };
}

/**
 * 既存の住民データに職業フィールドを付与する（マイグレーション）
 * @param {Array} villagers
 * @returns {Array}
 */
export function migrateVillagers(villagers) {
  if (!villagers || !Array.isArray(villagers)) return [];
  return villagers.map(v => {
    if (v.occupation) return v;
    const grade = v.kanjiGrade || 1;
    return {
      ...v,
      kanjiGrade: grade,
      occupation: assignOccupation(grade),
      happiness: v.happiness || RESIDENTS.BASE_SATISFACTION,
    };
  });
}
