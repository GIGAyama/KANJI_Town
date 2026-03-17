// ==========================================
// 住民システム — マイ漢字タウン Phase 3
// 自動素材収集・満足度・職業管理
// ==========================================

import { OCCUPATIONS, getOccupation, assignOccupation } from '../data/residents';
import { TOWN_ITEMS } from '../data/town-items';

// ── 満足度計算 ──────────────────────────────
// 満足度は0〜100で、住民の収集効率に直結する
export function calculateSatisfaction(stats) {
  let satisfaction = 50; // ベース値

  const population = stats.population || 0;
  if (population === 0) return 0;

  // 建物ボーナス: 種類が多いほど満足度UP（最大+20）
  const buildingTypes = new Set();
  Object.values(stats.townMap || {}).forEach(itemId => {
    const item = TOWN_ITEMS.find(i => i.id === itemId);
    if (item && (item.type === 'building' || item.type === 'special')) {
      buildingTypes.add(itemId);
    }
  });
  satisfaction += Math.min(20, buildingTypes.size * 2);

  // ストリークボーナス: 連続学習で満足度UP（最大+15）
  satisfaction += Math.min(15, (stats.streak || 0) * 3);

  // 住居バランス: 家の数と人口のバランス（最大+10）
  const houseCount = Object.values(stats.townMap || {}).filter(v =>
    v === 't_house1' || v === 't_house2' || v === 't_house3'
  ).length;
  const housingRatio = houseCount > 0 ? Math.min(1, houseCount / Math.ceil(population / 3)) : 0;
  satisfaction += Math.floor(housingRatio * 10);

  // 自然環境ボーナス: 花・木・桜があると+5
  const natureCount = Object.values(stats.townMap || {}).filter(v =>
    v === 't_tree' || v === 't_sakura' || v === 't_flower' || v === 't_pine'
  ).length;
  if (natureCount >= 3) satisfaction += 5;

  // 過密ペナルティ: 人口が家の収容数（1軒=3人）を超えると減少
  if (population > houseCount * 3 + 3) { // 初期拠点で+3人の余裕
    const overcrowding = population - (houseCount * 3 + 3);
    satisfaction -= Math.min(20, overcrowding * 2);
  }

  // サボりペナルティ: 雑草が多いと不満
  const weedCount = Object.values(stats.townMap || {}).filter(v => v === 't_weed').length;
  satisfaction -= Math.min(15, weedCount);

  return Math.max(0, Math.min(100, Math.round(satisfaction)));
}

// 満足度に基づく収集効率倍率（0.3〜1.5）
export function getSatisfactionMultiplier(satisfaction) {
  if (satisfaction >= 80) return 1.5;
  if (satisfaction >= 60) return 1.2;
  if (satisfaction >= 40) return 1.0;
  if (satisfaction >= 20) return 0.6;
  return 0.3;
}

// 満足度のラベルと色
export function getSatisfactionLabel(satisfaction) {
  if (satisfaction >= 80) return { text: "とても幸せ", emoji: "😄", color: "#22c55e" };
  if (satisfaction >= 60) return { text: "満足", emoji: "😊", color: "#84cc16" };
  if (satisfaction >= 40) return { text: "ふつう", emoji: "😐", color: "#eab308" };
  if (satisfaction >= 20) return { text: "不満", emoji: "😟", color: "#f97316" };
  return { text: "とても不満", emoji: "😢", color: "#ef4444" };
}

// ── 自動素材収集 ──────────────────────────────
// 住民が毎日ログイン時に素材を集める
export function collectDailyResources(stats) {
  const villagers = stats.villagers || [];
  if (villagers.length === 0) return { materials: {}, coins: 0 };

  const satisfaction = calculateSatisfaction(stats);
  const multiplier = getSatisfactionMultiplier(satisfaction);

  const collected = {};
  let totalCoins = 0;

  for (const villager of villagers) {
    const occ = getOccupation(villager.occupation || 'farmer');

    for (const drop of occ.collectibles) {
      const amount = Math.max(1, Math.round(drop.baseAmount * multiplier));
      collected[drop.material] = (collected[drop.material] || 0) + amount;
    }

    totalCoins += Math.round(occ.coinBonus * multiplier);
  }

  return { materials: collected, coins: totalCoins };
}

// ── 建物維持費システム ──────────────────────────
// 建物の種類に応じて毎日コインを消費する
export function calculateMaintenanceCost(stats) {
  const townMap = stats.townMap || {};
  let totalCost = 0;

  // 建物タイプごとの維持費（1日あたり）
  const MAINTENANCE_RATES = {
    'building': 3,    // 一般建物
    'special': 8,     // 特殊建物
    'mega': 15,       // メガ建築
    'rare': 10,       // レア建物
    'decoration': 2,  // 装飾
  };

  const counted = {};
  for (const itemId of Object.values(townMap)) {
    if (counted[itemId]) { counted[itemId]++; continue; }
    counted[itemId] = 1;
  }

  for (const [itemId, count] of Object.entries(counted)) {
    const item = TOWN_ITEMS.find(i => i.id === itemId);
    if (!item) continue;
    const rate = MAINTENANCE_RATES[item.type] || 0;
    totalCost += rate * count;
  }

  return totalCost;
}

// ── 住民生成（漢字習得時）──────────────────────────
// 既存のvillager生成ロジックを拡張して職業を付与
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
    happiness: 50,
  };
}

// ── 住民統計ヘルパー ──────────────────────────────
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

// 既存の住民データに職業を付与（マイグレーション）
export function migrateVillagers(villagers) {
  if (!villagers || !Array.isArray(villagers)) return [];
  return villagers.map(v => {
    if (v.occupation) return v;
    // kanjiGradeがない場合は漢字文字からKANJI_DATAを探す（importが重いので簡易推定）
    const grade = v.kanjiGrade || 1;
    return {
      ...v,
      kanjiGrade: grade,
      occupation: assignOccupation(grade),
      happiness: v.happiness || 50,
    };
  });
}
