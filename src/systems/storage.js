// ==========================================
// ストレージAPI（商用グレード）
// デバウンス保存・データ検証・マイグレーション
// エラーログ・容量管理・整合性チェック
// ==========================================
import { TOWN_ITEMS } from '../data/town-items.jsx';
import { KANJI_DATA } from '../data/kanji-data.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { migrateCard } from './srs.js';
import { migrateVillagers, collectDailyResources, calculateSatisfaction, calculateMaintenanceCost } from './residents.js';
import { getTodayString, formatDate } from '../utils/date-utils.js';
import { getLevelInfoFromExp, getThemeFromLevel } from '../utils/level-system.js';
import { MAP, ECONOMY, NEGLECT, DEBOUNCE } from '../constants/gameConfig.js';

// ── 内部エラーログ（直近20件を保持、デバッグ用） ──
const _errorLog = [];
const MAX_ERROR_LOG = 20;

/**
 * 内部エラーを記録する（本番環境でもデバッグ可能にする）
 * @param {string} context - エラー発生箇所
 * @param {Error|string} error - エラー内容
 */
function logStorageError(context, error) {
  const entry = {
    time: new Date().toISOString(),
    context,
    message: error instanceof Error ? error.message : String(error),
  };
  _errorLog.push(entry);
  if (_errorLog.length > MAX_ERROR_LOG) _errorLog.shift();
  if (import.meta.env.DEV) {
    console.warn(`[StorageAPI] ${context}:`, error);
  }
}

// ── ストレージキー定数 ──
const STORAGE_KEY = 'kanji_town_v7';
const LEGACY_KEYS = ['kanji_mega_builder_final_v6', 'kanji_mega_builder_final_v5'];

// ── TOWN_ITEMSのルックアップマップ（O(1)検索用） ──
const _townItemMap = new Map(TOWN_ITEMS.map(i => [i.id, i]));
const _validTownIds = new Set(TOWN_ITEMS.map(i => i.id));
const _validKanjiIds = new Set(KANJI_DATA.map(k => k.id));

/**
 * TOWN_ITEMSからIDで検索する（Map使用でO(1)）
 * @param {string} id
 * @returns {object|undefined}
 */
function findTownItem(id) {
  return _townItemMap.get(id);
}

let _saveDebounceTimer = null;

/** @type {boolean} 前回の保存が容量不足で失敗したか */
let _lastSaveFailed = false;

const StorageAPI = {
  /**
   * localStorageからJSONを安全に取得する
   * @param {string} key
   * @param {*} fallback
   * @returns {*}
   */
  safeGet: (key, fallback) => {
    try {
      const v = window.localStorage.getItem(key);
      if (v === null) return fallback;
      return JSON.parse(v);
    } catch (e) {
      logStorageError('safeGet', e);
      return fallback;
    }
  },

  /**
   * localStorageにJSONを安全に保存する
   * 容量不足の場合は古い日次データを自動で圧縮して再試行する
   * @param {string} key
   * @param {*} val
   * @returns {boolean} 保存成功
   */
  safeSet: (key, val) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(val));
      _lastSaveFailed = false;
      return true;
    } catch (e) {
      // QuotaExceededError: 古い日次データを圧縮して再試行
      if (e.name === 'QuotaExceededError' && val && val.daily) {
        logStorageError('safeSet:quota', 'ストレージ容量不足 - 古いデータを圧縮します');
        const compressed = StorageAPI._compressDailyData(val);
        try {
          window.localStorage.setItem(key, JSON.stringify(compressed));
          _lastSaveFailed = false;
          return true;
        } catch (e2) {
          logStorageError('safeSet:quota:retry', e2);
        }
      }
      logStorageError('safeSet', e);
      _lastSaveFailed = true;
      return false;
    }
  },

  /**
   * 古い日次データを圧縮する（30日より古いデータを月単位に集約）
   * @param {object} stats
   * @returns {object}
   */
  _compressDailyData: (stats) => {
    if (!stats.daily) return stats;
    const compressed = { ...stats, daily: { ...stats.daily } };
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = formatDate(cutoff);

    Object.keys(compressed.daily).forEach(dateKey => {
      if (dateKey < cutoffStr) {
        delete compressed.daily[dateKey];
      }
    });
    return compressed;
  },

  /**
   * 前回の保存が失敗したかどうか
   * @returns {boolean}
   */
  get lastSaveFailed() { return _lastSaveFailed; },

  /**
   * デバッグ用のエラーログを取得する
   * @returns {Array<{time: string, context: string, message: string}>}
   */
  getErrorLog: () => [..._errorLog],

  /**
   * デバウンス保存: DEBOUNCE.SAVE ms以内の連続保存をまとめる
   * @param {object} stats
   */
  saveStats: (stats) => {
    if (_saveDebounceTimer) clearTimeout(_saveDebounceTimer);
    _saveDebounceTimer = setTimeout(() => {
      StorageAPI.safeSet(STORAGE_KEY, stats);
    }, DEBOUNCE.SAVE);
  },

  /**
   * 即時保存（セッション終了時など、データロスを防ぐ場面で使用）
   * @param {object} stats
   */
  saveStatsImmediate: (stats) => {
    if (_saveDebounceTimer) {
      clearTimeout(_saveDebounceTimer);
      _saveDebounceTimer = null;
    }
    StorageAPI.safeSet(STORAGE_KEY, stats);
  },

  GRID_SIZE: MAP.GRID_SIZE,

  /**
   * 50×50マップを生成する
   * @returns {{ map: Object<string, string> }}
   */
  buildInitialMap: () => {
    const SIZE = MAP.GRID_SIZE;
    const C = MAP.CENTER;
    const map = {};

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const dist = Math.max(Math.abs(x - C), Math.abs(y - C));
        const seed = (x * 7919 + y * 104729) % 1000;
        const rand = seed / 1000;

        let terrain = 't_grassland';
        if (dist >= 23) terrain = rand < 0.6 ? 't_bedrock' : 't_roughland';
        else if (dist >= 20) terrain = rand < 0.3 ? 't_bedrock' : 't_roughland';
        else if (dist <= 5) terrain = rand < 0.5 ? 't_cleared' : 't_grassland';
        else {
          if (rand < 0.4) terrain = 't_grassland';
          else if (rand < 0.7) terrain = 't_cleared';
          else if (rand < 0.9) terrain = 't_roughland';
          else terrain = 't_forest_floor';
        }
        map[`${x},${y}`] = terrain;
      }
    }
    // 初期拠点: 中央3×3を更地に
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        map[`${C + dx},${C + dy}`] = 't_cleared';
      }
    }
    map[`${C},${C}`] = 't_house1';
    return { map };
  },

  /**
   * 旧20×20マップ生成（マイグレーション用）
   */
  buildLegacyMap: () => {
    const C = MAP.LEGACY_CENTER;
    const map = {};
    for (let y = 0; y < MAP.LEGACY_GRID_SIZE; y++) {
      for (let x = 0; x < MAP.LEGACY_GRID_SIZE; x++) {
        const dist = Math.max(Math.abs(x - C), Math.abs(y - C));
        map[`${x},${y}`] = dist <= 1 ? 't_cleared' : dist <= 4 ? 't_roughland' : 't_bedrock';
      }
    }
    map[`${C},${C}`] = 't_house1';
    return map;
  },

  /**
   * ゲームデータを読み込む（マイグレーション・整合性チェック付き）
   * @returns {object} stats
   */
  getStats: () => {
    let stats = StorageAPI.safeGet(STORAGE_KEY, null);

    // レガシーキーからの復元
    if (!stats) {
      for (const key of LEGACY_KEYS) {
        stats = StorageAPI.safeGet(key, null);
        if (stats) break;
      }
    }

    // 新規データ生成
    if (!stats || !stats.targetGrade) {
      const { map } = StorageAPI.buildInitialMap();
      stats = {
        totalExp: 0,
        streak: 0,
        lastDate: '',
        coins: ECONOMY.INITIAL_COINS,
        targetGrade: 1,
        townMap: map,
        townItems: { 't_grass': 5, 't_road': 5, 't_tree': 3, 't_house1': 1 },
        daily: {},
        kanjiStats: {},
        unlockedKanji: [],
        achievements: {},
        perfectCountTotal: 0,
        myDrills: [],
        population: 0,
        villagers: [],
        exploredRadius: MAP.INITIAL_EXPLORE_RADIUS,
        schemaVersion: 8,
        mapSize: MAP.GRID_SIZE,
      };
    }

    // ── フィールド補完（欠損フィールドのデフォルト値付与） ──
    const defaults = {
      myDrills: [],
      townItems: {},
      kanjiStats: {},
      unlockedKanji: [],
      achievements: {},
      population: 0,
      villagers: [],
      exploredRadius: MAP.INITIAL_EXPLORE_RADIUS,
      materials: {},
      lastCollectionDate: '',
    };
    for (const [field, defaultVal] of Object.entries(defaults)) {
      if (!stats[field]) stats[field] = defaultVal;
    }
    if (stats.coins === undefined) stats.coins = 0;

    // ── 20×20 → 50×50 マイグレーション ──
    if (!stats.mapSize || stats.mapSize < MAP.GRID_SIZE) {
      const oldMap = stats.townMap || {};
      const { map: freshMap } = StorageAPI.buildInitialMap();
      const offset = MAP.LEGACY_OFFSET;

      // 旧マップの建物を新マップ中央に移植
      Object.entries(oldMap).forEach(([key, val]) => {
        const item = findTownItem(val);
        if (item && item.type !== 'terrain') {
          const [ox, oy] = key.split(',').map(Number);
          const nx = ox + offset;
          const ny = oy + offset;
          if (nx >= 0 && nx < MAP.GRID_SIZE && ny >= 0 && ny < MAP.GRID_SIZE) {
            freshMap[`${nx},${ny}`] = val;
          }
        }
      });
      // 旧更地タイルも移植
      Object.entries(oldMap).forEach(([key, val]) => {
        if (val === 't_cleared') {
          const [ox, oy] = key.split(',').map(Number);
          const nx = ox + offset;
          const ny = oy + offset;
          if (nx >= 0 && nx < MAP.GRID_SIZE && ny >= 0 && ny < MAP.GRID_SIZE && freshMap[`${nx},${ny}`] !== 't_cleared') {
            const item = findTownItem(freshMap[`${nx},${ny}`]);
            if (!item || item.type === 'terrain') freshMap[`${nx},${ny}`] = 't_cleared';
          }
        }
      });
      stats.townMap = freshMap;
      stats.mapSize = MAP.GRID_SIZE;
      stats.schemaVersion = 8;
      if (stats.exploredRadius < MAP.MIGRATION_MIN_RADIUS) {
        stats.exploredRadius = MAP.MIGRATION_MIN_RADIUS;
      }
      if (stats.villagers) {
        stats.villagers = stats.villagers.map(v => ({
          ...v,
          x: (v.x || 0) + offset,
          y: (v.y || 0) + offset,
        }));
      }
    }

    if (!stats.townMap) {
      const { map } = StorageAPI.buildInitialMap();
      stats.townMap = map;
    }
    if (stats.biomeMap) delete stats.biomeMap;

    // ── 住民マイグレーション ──
    stats.villagers = migrateVillagers(stats.villagers);
    if (stats.satisfaction === undefined) {
      stats.satisfaction = calculateSatisfaction(stats);
    }

    // ── データ整合性チェック（不正なIDを除去） ──
    Object.keys(stats.townMap).forEach(k => {
      if (!_validTownIds.has(stats.townMap[k])) delete stats.townMap[k];
    });

    // インベントリとマップ配置の整合性補正
    const placedCounts = {};
    Object.values(stats.townMap).forEach(itemId => {
      const item = findTownItem(itemId);
      if (item && item.type !== 'terrain') {
        placedCounts[itemId] = (placedCounts[itemId] || 0) + 1;
      }
    });
    Object.entries(placedCounts).forEach(([itemId, count]) => {
      stats.townItems[itemId] = Math.max(stats.townItems[itemId] || 0, count);
    });

    Object.keys(stats.kanjiStats).forEach(id => {
      stats.kanjiStats[id] = migrateCard(stats.kanjiStats[id]);
    });
    Object.keys(stats.kanjiStats).forEach(id => {
      if (!_validKanjiIds.has(id)) delete stats.kanjiStats[id];
    });
    stats.coins = Math.max(0, stats.coins);

    // ── サボり検出：街が廃れる仕組み ──
    StorageAPI._applyNeglectPenalties(stats);

    return stats;
  },

  /**
   * サボり日数に応じたペナルティを適用する
   * @param {object} stats - 直接変更される
   */
  _applyNeglectPenalties: (stats) => {
    const todayStr = getTodayString();
    if (!stats.lastDate || stats.lastDate === todayStr) return;

    const last = new Date(stats.lastDate);
    if (isNaN(last.getTime())) return;

    const diffDays = Math.floor((new Date() - last) / 86400000);

    // 雑草の発生
    if (diffDays >= NEGLECT.WEED_DAYS) {
      const clearedKeys = Object.keys(stats.townMap).filter(k => stats.townMap[k] === 't_cleared');
      const weedCount = Math.min(
        diffDays * NEGLECT.WEEDS_PER_DAY,
        Math.floor(clearedKeys.length * NEGLECT.WEED_MAX_RATIO)
      );
      // Fisher-Yates シャッフル（偏りのないランダム選択）
      const shuffled = [...clearedKeys];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      for (let i = 0; i < weedCount && i < shuffled.length; i++) {
        stats.townMap[shuffled[i]] = 't_weed';
      }
    }

    // 住民の離脱
    if (diffDays >= NEGLECT.LEAVE_DAYS && stats.population > 0) {
      const leave = Math.max(1, Math.floor(stats.population * NEGLECT.LEAVE_RATIO));
      stats.population = Math.max(0, stats.population - leave);
      stats.villagers = stats.villagers.slice(leave);
    }

    // 建物の荒廃
    if (diffDays >= NEGLECT.DECAY_DAYS && stats.population > 0) {
      const buildingKeys = Object.keys(stats.townMap).filter(k => {
        const item = findTownItem(stats.townMap[k]);
        return item && (item.type === 'building' || item.type === 'special');
      });
      const decayCount = Math.min(NEGLECT.DECAY_MAX_BUILDINGS, buildingKeys.length);
      for (let i = 0; i < decayCount; i++) {
        const k = buildingKeys[Math.floor(Math.random() * buildingKeys.length)];
        if (k) {
          stats.townItems[stats.townMap[k]] = (stats.townItems[stats.townMap[k]] || 0) + 1;
          stats.townMap[k] = 't_roughland';
        }
      }
    }
  },

  /**
   * セッション終了時の日次データ更新
   * @param {object} stats - 直接変更される
   * @param {number} exp - 獲得EXP
   * @param {object} sessionData - セッション結果
   * @returns {object} stats
   */
  updateDaily: (stats, exp, sessionData) => {
    const today = getTodayString();
    if (!stats.daily) stats.daily = {};
    if (!stats.daily[today]) stats.daily[today] = { exp: 0, reviewed: 0, perfects: 0 };

    stats.daily[today].exp += exp;
    stats.daily[today].reviewed = (stats.daily[today].reviewed || 0) + (sessionData.reviewedCount || 0);
    stats.daily[today].perfects = (stats.daily[today].perfects || 0) + (sessionData.perfectCount || 0);
    stats.totalExp += exp;
    stats.perfectCountTotal = (stats.perfectCountTotal || 0) + (sessionData.perfectCount || 0);

    // 学習による雑草除去
    if (exp > 0) {
      const weedKeys = Object.keys(stats.townMap || {}).filter(k => stats.townMap[k] === 't_weed');
      const clearCount = Math.min(NEGLECT.WEED_CLEAR_PER_SESSION, weedKeys.length);
      for (let i = 0; i < clearCount; i++) {
        stats.townMap[weedKeys[i]] = 't_cleared';
      }
    }

    // ストリーク更新
    if (stats.lastDate !== today) {
      if (stats.lastDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatDate(yesterday);
        stats.streak = stats.lastDate === yesterdayStr ? stats.streak + 1 : 1;
      } else {
        stats.streak = 1;
      }
      stats.lastDate = today;
    }

    // ── 住民の自動素材収集（1日1回）──
    if (stats.lastCollectionDate !== today && (stats.villagers || []).length > 0) {
      const { materials: collected, coins: collectedCoins } = collectDailyResources(stats);
      if (!stats.materials) stats.materials = {};
      Object.entries(collected).forEach(([matId, amount]) => {
        stats.materials[matId] = (stats.materials[matId] || 0) + amount;
      });
      const maintenanceCost = calculateMaintenanceCost(stats);
      const netCoins = collectedCoins - maintenanceCost;
      stats.coins = Math.max(0, (stats.coins || 0) + netCoins);
      stats.lastCollectionDate = today;
      stats.lastCollectionResult = { materials: collected, coins: collectedCoins, maintenanceCost };
    }

    // 満足度更新
    stats.satisfaction = calculateSatisfaction(stats);

    // アイテム付与
    (sessionData.unlockedItems || []).forEach(i => {
      stats.townItems[i] = (stats.townItems[i] || 0) + 1;
    });
    if (sessionData.rareDrop) {
      stats.townItems[sessionData.rareDrop] = (stats.townItems[sessionData.rareDrop] || 0) + 1;
    }

    // ── 実績更新 ──
    StorageAPI._updateAchievements(stats);

    return stats;
  },

  /**
   * 実績の進捗を一括更新する
   * @param {object} stats - 直接変更される
   */
  _updateAchievements: (stats) => {
    const masteredCount = Object.values(stats.kanjiStats).filter(s => s.status === 'mastered').length;
    const buildingCount = Object.values(stats.townMap || {}).filter(id => {
      const item = findTownItem(id);
      return item && (item.type === 'building' || item.type === 'special');
    }).length;

    // 学年別マスター数
    const gradeMastered = {};
    Object.entries(stats.kanjiStats).forEach(([id, s]) => {
      if (s.status === 'mastered') {
        const k = KANJI_DATA.find(kd => kd.id === id);
        if (k) gradeMastered[k.grade] = (gradeMastered[k.grade] || 0) + 1;
      }
    });

    // 実績タイプ → 現在値のマッピング
    const currentValues = {
      streak: stats.streak,
      perfect: stats.perfectCountTotal,
      master: masteredCount,
      craft: stats.craftCount || 0,
      building: buildingCount,
      population: stats.population || 0,
      session: stats.sessionCount || 0,
      coins: stats.coins || 0,
      exp: stats.totalExp || 0,
    };

    ACHIEVEMENTS.forEach(a => {
      if (!stats.achievements[a.id]) {
        stats.achievements[a.id] = { claimed: false, current: 0 };
      }
      if (a.type === 'grade') {
        stats.achievements[a.id].current = gradeMastered[a.gradeNum] || 0;
      } else if (currentValues[a.type] !== undefined) {
        stats.achievements[a.id].current = currentValues[a.type];
      }
    });
  },

  /**
   * 繁栄度を計算する（terrain以外の建物のpros値合計）
   * @param {Object<string, string>} townMap
   * @param {number} reviewCount
   * @returns {number}
   */
  calculateProsperity: (townMap, reviewCount) => {
    let p = 0;
    Object.values(townMap || {}).forEach(itemId => {
      const item = findTownItem(itemId);
      if (!item) return;
      if (item.pros && item.type !== 'terrain') p += item.pros;
      else if (item.type === 'terrain' && item.pros < 0) p += item.pros;
    });
    return Math.max(0, p - (reviewCount * 50));
  },

  /** @type {Array<{min: number, text: string, badge: string}>} */
  _TOWN_RANKS: [
    { min: 5000, text: '黄金の都', badge: '🏯✨' },
    { min: 2000, text: '大都市', badge: '🏙️' },
    { min: 1000, text: '城下町', badge: '🏯' },
    { min: 500, text: 'にぎやかな町', badge: '🏘️' },
    { min: 100, text: '開拓村', badge: '🛖' },
    { min: 0, text: 'あき地', badge: '🌱' },
  ],

  /**
   * 繁栄度から街のランクを取得する
   * @param {number} prosperity
   * @returns {{ text: string, badge: string }}
   */
  getTownRank: (prosperity) => {
    return StorageAPI._TOWN_RANKS.find(r => prosperity >= r.min)
      || { text: 'あき地', badge: '🌱' };
  },

  /**
   * レベル情報を取得する（UIレンダリング用の追加データ付き）
   * @param {number} exp
   * @param {Object<string, string>} townMap
   * @returns {object}
   */
  getLevelInfo: (exp, townMap) => {
    const info = getLevelInfoFromExp(exp || 0);
    const themeName = getThemeFromLevel(info.level);
    const prosperity = StorageAPI.calculateProsperity(townMap || {}, 0);
    const rank = StorageAPI.getTownRank(prosperity);
    return {
      level: info.level,
      title: rank.text,
      badge: rank.badge,
      progress: info.progress,
      currentLevelExp: info.currentLevelExp,
      nextLevelExp: info.nextLevelExp,
      remainingExp: info.remainingExp,
      themeName,
      targetReward: info.targetReward,
      isMaxLevel: info.isMaxLevel,
    };
  },
};

const calculateProsperity = StorageAPI.calculateProsperity;
const getTownRank = StorageAPI.getTownRank;
const getLevelInfo = StorageAPI.getLevelInfo;

export { StorageAPI, calculateProsperity, getTownRank, getLevelInfo };
