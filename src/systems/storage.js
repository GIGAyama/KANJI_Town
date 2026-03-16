// ==========================================
// ストレージAPI（商用グレード）
// デバウンス保存・データ検証・マイグレーション
// ==========================================
import { TOWN_ITEMS } from '../data/town-items.jsx';
import { KANJI_DATA } from '../data/kanji-data.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { migrateCard } from './srs.js';
import { getBiomeAt, getTerrainForBiome } from '../data/biomes.js';
import { migrateVillagers, collectDailyResources, calculateSatisfaction } from './residents.js';

let _saveDebounceTimer = null;

const StorageAPI = {
  safeGet: (key, fallback) => { try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
  safeSet: (key, val) => { try { window.localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; } },
  // デバウンス保存：400ms以内の連続保存をまとめる（パフォーマンス改善）
  saveStats: (stats) => {
    if (_saveDebounceTimer) clearTimeout(_saveDebounceTimer);
    _saveDebounceTimer = setTimeout(() => { StorageAPI.safeSet('kanji_town_v7', stats); }, 400);
  },
  saveStatsImmediate: (stats) => {
    if (_saveDebounceTimer) { clearTimeout(_saveDebounceTimer); _saveDebounceTimer = null; }
    StorageAPI.safeSet('kanji_town_v7', stats);
  },
  GRID_SIZE: 50,
  // Phase 2: 50×50マップ生成（バイオーム対応）
  buildInitialMap: () => {
    const SIZE = 50; const C = 25; const map = {}; const biomeMap = {};
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const biome = getBiomeAt(x, y);
      biomeMap[`${x},${y}`] = biome;
      map[`${x},${y}`] = getTerrainForBiome(x, y, biome);
    }
    // 初期拠点: 中央3×3を更地に
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      map[`${C + dx},${C + dy}`] = 't_cleared';
    }
    map[`${C},${C}`] = 't_house1'; // 最初の家
    return { map, biomeMap };
  },
  // 旧20×20マップ生成（マイグレーション用）
  buildLegacyMap: () => {
    const C = 10; const map = {};
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) {
      const dist = Math.max(Math.abs(x - C), Math.abs(y - C));
      map[`${x},${y}`] = dist <= 1 ? 't_cleared' : dist <= 4 ? 't_roughland' : 't_bedrock';
    }
    map['10,10'] = 't_house1';
    return map;
  },
  getStats: () => {
    let stats = StorageAPI.safeGet('kanji_town_v7', null)
              || StorageAPI.safeGet('kanji_mega_builder_final_v6', null)
              || StorageAPI.safeGet('kanji_mega_builder_final_v5', null);
    if (!stats || !stats.targetGrade) {
      const { map, biomeMap } = StorageAPI.buildInitialMap();
      stats = {
        totalExp: 0, streak: 0, lastDate: '', coins: 500, targetGrade: 1,
        townMap: map,
        biomeMap: biomeMap,
        townItems: { 't_grass': 5, 't_road': 5, 't_tree': 3 },
        daily: {}, kanjiStats: {}, unlockedKanji: [],
        kakejiku: null, achievements: {}, perfectCountTotal: 0, myDrills: [],
        population: 0,
        villagers: [],
        exploredRadius: 3,
        schemaVersion: 8,
        mapSize: 50,
      };
    }
    // フィールド補完
    if (!stats.myDrills) stats.myDrills = [];
    if (!stats.townItems) stats.townItems = {};
    if (!stats.kanjiStats) stats.kanjiStats = {};
    if (!stats.unlockedKanji) stats.unlockedKanji = [];
    if (!stats.achievements) stats.achievements = {};
    if (stats.coins === undefined) stats.coins = 0;
    if (!stats.population) stats.population = 0;
    if (!stats.villagers) stats.villagers = [];
    if (!stats.exploredRadius) stats.exploredRadius = 3;

    // ── 20×20 → 50×50 マイグレーション ──
    if (!stats.mapSize || stats.mapSize < 50) {
      const oldMap = stats.townMap || {};
      const { map: freshMap, biomeMap } = StorageAPI.buildInitialMap();
      // 旧マップの建物を新マップ中央に移植 (旧center=10,10 → 新center=25,25, offset=+15)
      Object.entries(oldMap).forEach(([key, val]) => {
        const item = TOWN_ITEMS.find(i => i.id === val);
        if (item && item.type !== 'terrain') {
          const [ox, oy] = key.split(',').map(Number);
          const nx = ox + 15;
          const ny = oy + 15;
          if (nx >= 0 && nx < 50 && ny >= 0 && ny < 50) {
            freshMap[`${nx},${ny}`] = val;
          }
        }
      });
      // 旧更地タイルも移植
      Object.entries(oldMap).forEach(([key, val]) => {
        if (val === 't_cleared') {
          const [ox, oy] = key.split(',').map(Number);
          const nx = ox + 15;
          const ny = oy + 15;
          if (nx >= 0 && nx < 50 && ny >= 0 && ny < 50 && freshMap[`${nx},${ny}`] !== 't_cleared') {
            const item = TOWN_ITEMS.find(i => i.id === freshMap[`${nx},${ny}`]);
            if (!item || item.type === 'terrain') freshMap[`${nx},${ny}`] = 't_cleared';
          }
        }
      });
      stats.townMap = freshMap;
      stats.biomeMap = biomeMap;
      stats.mapSize = 50;
      stats.schemaVersion = 8;
      // 旧データは少し広めに探索済みにする
      if (stats.exploredRadius < 6) stats.exploredRadius = 6;
      // 旧住民座標もオフセット
      if (stats.villagers) {
        stats.villagers = stats.villagers.map(v => ({ ...v, x: (v.x || 0) + 15, y: (v.y || 0) + 15 }));
      }
    }

    if (!stats.townMap) {
      const { map, biomeMap } = StorageAPI.buildInitialMap();
      stats.townMap = map;
      stats.biomeMap = biomeMap;
    }
    if (!stats.biomeMap) {
      // Generate biome map for existing save
      const biomeMap = {};
      for (let y = 0; y < 50; y++) for (let x = 0; x < 50; x++) {
        biomeMap[`${x},${y}`] = getBiomeAt(x, y);
      }
      stats.biomeMap = biomeMap;
    }

    // ── 住民マイグレーション（Phase 3: 職業・満足度フィールド付与）──
    stats.villagers = migrateVillagers(stats.villagers);
    if (stats.satisfaction === undefined) stats.satisfaction = calculateSatisfaction(stats);
    if (!stats.materials) stats.materials = {};
    if (!stats.lastCollectionDate) stats.lastCollectionDate = '';

    // データ整合性チェック
    const validIds = new Set(TOWN_ITEMS.map(i => i.id));
    Object.keys(stats.townMap).forEach(k => { if (!validIds.has(stats.townMap[k])) delete stats.townMap[k]; });
    Object.keys(stats.kanjiStats).forEach(id => { stats.kanjiStats[id] = migrateCard(stats.kanjiStats[id]); });
    const validKanjiIds = new Set(KANJI_DATA.map(k => k.id));
    Object.keys(stats.kanjiStats).forEach(id => { if (!validKanjiIds.has(id)) delete stats.kanjiStats[id]; });
    stats.coins = Math.max(0, stats.coins);

    // ── サボり検出：廃れる仕組み ──
    const todayStr = new Date().toLocaleDateString();
    if (stats.lastDate && stats.lastDate !== todayStr) {
      const last = new Date(stats.lastDate);
      if (!isNaN(last.getTime())) {
        const diffDays = Math.floor((new Date() - last) / 86400000);
        if (diffDays >= 1) {
          // 1日サボる → 更地に雑草が生える
          const clearedKeys = Object.keys(stats.townMap).filter(k => stats.townMap[k] === 't_cleared');
          const weedCount = Math.min(diffDays * 2, Math.floor(clearedKeys.length * 0.3));
          const shuffled = clearedKeys.sort(() => Math.random() - 0.5);
          for (let i = 0; i < weedCount; i++) stats.townMap[shuffled[i]] = 't_weed';
        }
        if (diffDays >= 3 && stats.population > 0) {
          // 3日サボる → 住民が去る（最大20%）
          const leave = Math.max(1, Math.floor(stats.population * 0.2));
          stats.population = Math.max(0, stats.population - leave);
          stats.villagers = stats.villagers.slice(leave);
        }
        if (diffDays >= 7 && stats.population > 0) {
          // 7日サボる → 建物が荒れ地に戻る（最大2つ）
          const buildingKeys = Object.keys(stats.townMap).filter(k => {
            const item = TOWN_ITEMS.find(i => i.id === stats.townMap[k]);
            return item && (item.type === 'building' || item.type === 'special');
          });
          for (let i = 0; i < Math.min(2, buildingKeys.length); i++) {
            const k = buildingKeys[Math.floor(Math.random() * buildingKeys.length)];
            if (k) { stats.townItems[stats.townMap[k]] = (stats.townItems[stats.townMap[k]] || 0) + 1; stats.townMap[k] = 't_roughland'; }
          }
        }
      }
    }
    return stats;
  },
  updateDaily: (stats, exp, sessionData) => {
    const today = new Date().toLocaleDateString();
    if (!stats.daily) stats.daily = {};
    if (!stats.daily[today]) stats.daily[today] = { exp: 0, reviewed: 0, perfects: 0 };
    stats.daily[today].exp += exp;
    stats.daily[today].reviewed = (stats.daily[today].reviewed || 0) + (sessionData.reviewedCount || 0);
    stats.daily[today].perfects = (stats.daily[today].perfects || 0) + (sessionData.perfectCount || 0);
    stats.totalExp += exp; stats.perfectCountTotal = (stats.perfectCountTotal || 0) + (sessionData.perfectCount || 0);
    // 学習による雑草除去（雑草→更地に戻す）
    if (exp > 0) {
      const weedKeys = Object.keys(stats.townMap || {}).filter(k => stats.townMap[k] === 't_weed');
      for (let i = 0; i < Math.min(5, weedKeys.length); i++) stats.townMap[weedKeys[i]] = 't_cleared';
    }
    // ストリーク更新
    if (stats.lastDate !== today) {
      if (stats.lastDate) { const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); stats.streak = stats.lastDate === yesterday.toLocaleDateString() ? stats.streak + 1 : 1; }
      else stats.streak = 1;
      stats.lastDate = today;
    }
    // ── 住民の自動素材収集（1日1回）──
    if (stats.lastCollectionDate !== today && (stats.villagers || []).length > 0) {
      const { materials: collected, coins: collectedCoins } = collectDailyResources(stats);
      if (!stats.materials) stats.materials = {};
      Object.entries(collected).forEach(([matId, amount]) => {
        stats.materials[matId] = (stats.materials[matId] || 0) + amount;
      });
      stats.coins = (stats.coins || 0) + collectedCoins;
      stats.lastCollectionDate = today;
      stats.lastCollectionResult = { materials: collected, coins: collectedCoins };
    }
    // 満足度更新
    stats.satisfaction = calculateSatisfaction(stats);

    // アイテム付与
    (sessionData.unlockedItems || []).forEach(i => stats.townItems[i] = (stats.townItems[i] || 0) + 1);
    if (sessionData.rareDrop) stats.townItems[sessionData.rareDrop] = (stats.townItems[sessionData.rareDrop] || 0) + 1;
    if (sessionData.bestKakejiku) stats.kakejiku = sessionData.bestKakejiku;
    // 実績更新
    const masteredCount = Object.values(stats.kanjiStats).filter(s => s.status === 'mastered').length;
    ACHIEVEMENTS.forEach(a => {
      if (!stats.achievements[a.id]) stats.achievements[a.id] = { claimed: false, current: 0 };
      if (a.type === 'streak') stats.achievements[a.id].current = stats.streak;
      if (a.type === 'perfect') stats.achievements[a.id].current = stats.perfectCountTotal;
      if (a.type === 'master') stats.achievements[a.id].current = masteredCount;
    });
    return stats;
  }
};

// FIX: townMap defaults to {} to prevent Object.values(undefined) crash
// terrain タイルは繁栄度計算から除外
const calculateProsperity = (townMap, reviewCount) => {
  let p = 0;
  Object.values(townMap || {}).forEach(itemId => {
    const item = TOWN_ITEMS.find(i => i.id === itemId);
    if (item && item.pros && item.type !== 'terrain') p += item.pros;
    else if (item && item.type === 'terrain' && item.pros < 0) p += item.pros; // 荒れ地・雑草はマイナス
  });
  return Math.max(0, p - (reviewCount * 50));
};

const getTownRank = (prosperity) => {
  const rank = [{ min: 5000, text: "黄金の都", badge: "🏯✨" }, { min: 2000, text: "大都市", badge: "🏙️" }, { min: 1000, text: "城下町", badge: "🏯" }, { min: 500, text: "にぎやかな町", badge: "🏘️" }, { min: 100, text: "開拓村", badge: "🛖" }, { min: 0, text: "あき地", badge: "🌱" }].find(r => prosperity >= r.min);
  return rank || { text: "あき地", badge: "🌱" };
};

// FIX: getLevelInfo no longer calls StorageAPI inside (removed circular dependency)
const getLevelInfo = (exp, townMap) => {
  const level = Math.floor(Math.cbrt(exp / 200)) + 1;
  const currentLevelExp = 200 * Math.pow(level - 1, 3);
  const nextLevelExp = 200 * Math.pow(level, 3);
  const progress = ((exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
  let themeName = 'default';
  if (level >= 80) themeName = 'gold';
  else if (level >= 50) themeName = 'sunset';
  else if (level >= 30) themeName = 'ocean';
  else if (level >= 15) themeName = 'sakura';
  const prosperity = calculateProsperity(townMap || {}, 0);
  const rank = getTownRank(prosperity);
  return { level, title: rank.text, badge: rank.badge, progress, nextLevelExp, themeName };
};

export { StorageAPI, calculateProsperity, getTownRank, getLevelInfo };
