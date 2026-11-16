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
import { getLevelInfoFromExp, getThemeFromLevel, liftLevelCap } from '../utils/level-system.js';
import { MAP, ECONOMY, NEGLECT, DEBOUNCE } from '../constants/gameConfig.js';
import { applyLearningDayHabit, canProtectRestDay, normalizeHabitState } from './habit.js';
import { recordDiagnosticEvent } from './diagnostics.js';
import { sanitizeStats } from './stats-schema.js';
import { countStudyTotals, foldDailyIntoArchive } from './daily-archive.js';
import { STUDY_VIEW_SINCE_KEY } from './studyStats.js';

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
  recordDiagnosticEvent({
    severity: 'error',
    source: 'storage',
    code: context,
    message: entry.message,
  });
  if (import.meta.env.DEV) {
    console.warn(`[StorageAPI] ${context}:`, error);
  }
}

// ── ストレージキー定数 ──
const STORAGE_KEY = 'kanji_town_v7';
const ACTIVE_SESSION_KEY = 'kanji_town_active_session_v1';
const LEGACY_KEYS = ['kanji_mega_builder_final_v6', 'kanji_mega_builder_final_v5'];
/** 読めなかった記録を、新しく作りなおす前に退避しておく場所（1つだけ持つ） */
const BROKEN_COPY_KEY = 'kanji_town_v7_broken';
/** バックアップを読みこむ直前の記録（読みこみを取り消すため。1つだけ持つ） */
const BEFORE_IMPORT_KEY = 'kanji_town_v7_before_import';

// ── TOWN_ITEMSのルックアップマップ（O(1)検索用） ──
const _townItemMap = new Map(TOWN_ITEMS.map(i => [i.id, i]));
const _validTownIds = new Set(TOWN_ITEMS.map(i => i.id));
const _validKanjiIds = new Set(KANJI_DATA.map(k => k.id));

/**
 * TOWN_ITEMSからIDで検索する（Map使用でO(1)）
 * @param {string} id
 * @returns {object|undefined}
 */
/**
 * 容量超過の例外か。ブラウザによって名前とコードが違う
 * （Firefox は NS_ERROR_DOM_QUOTA_REACHED、古い Safari/Chrome は code 22、Firefox の古い版は 1014）。
 */
function isQuotaError(e) {
  return Boolean(e) && (
    e.name === 'QuotaExceededError'
    || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || e.code === 22
    || e.code === 1014
  );
}

function findTownItem(id) {
  return _townItemMap.get(id);
}

let _saveDebounceTimer = null;
/** デバウンス中でまだ書いていない stats（タブを止める前・離れる前に書き出すため） */
let _pendingStats = null;
/**
 * このタブが記録を書いてよいか。ほかのタブが「このタブで使う」と名乗ったら false にする
 * （古いタブがあとから全体を書いて、新しいタブの記録を消さないようにする。tab-coordinator.js）。
 */
let _writable = true;

/** @type {boolean} 前回の保存が容量不足で失敗したか */
let _lastSaveFailed = false;

/** @type {Set<(info: {reason: string}) => void>} 保存失敗リスナー */
const _saveErrorListeners = new Set();

function _notifySaveError(reason) {
  _saveErrorListeners.forEach(fn => { try { fn({ reason }); } catch {} });
}

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
      // QuotaExceededError: 多段階フォールバック
      if (isQuotaError(e) && val && typeof val === 'object') {
        logStorageError('safeSet:quota', 'ストレージ容量不足 - データを段階的に圧縮します');

        // ステージ1: 30日より古い日次データを削除
        try {
          const compressed = StorageAPI._compressDailyData(val, 30);
          window.localStorage.setItem(key, JSON.stringify(compressed));
          _lastSaveFailed = false;
          _notifySaveError('compressed-30d');
          return true;
        } catch (e2) {
          logStorageError('safeSet:quota:retry1', e2);
        }

        // ステージ2: 7日より古い日次データを削除 + 無関係なlocalStorageキーを掃除
        try {
          StorageAPI._purgeUnrelatedKeys();
          const compressed = StorageAPI._compressDailyData(val, 7);
          window.localStorage.setItem(key, JSON.stringify(compressed));
          _lastSaveFailed = false;
          _notifySaveError('compressed-7d');
          return true;
        } catch (e3) {
          logStorageError('safeSet:quota:retry2', e3);
        }

        // ステージ3: 日次データを完全に消し、必須フィールドのみ残す
        try {
          const minimal = StorageAPI._minimalStats(val);
          window.localStorage.setItem(key, JSON.stringify(minimal));
          _lastSaveFailed = false;
          _notifySaveError('minimal');
          return true;
        } catch (e4) {
          logStorageError('safeSet:quota:retry3', e4);
        }
      }
      logStorageError('safeSet', e);
      _lastSaveFailed = true;
      _notifySaveError(isQuotaError(e) ? 'quota' : 'unknown');
      return false;
    }
  },

  /**
   * 保存失敗イベントを購読する（UI で通知バナーを出すため）
   * @param {(info: {reason: string}) => void} listener
   * @returns {() => void} 解除関数
   */
  onSaveError: (listener) => {
    _saveErrorListeners.add(listener);
    return () => _saveErrorListeners.delete(listener);
  },

  /**
   * 古い日次データを削除する
   * @param {object} stats
   * @param {number} keepDays - 残す日数
   * @returns {object}
   */
  _compressDailyData: (stats, keepDays = 30) => {
    // 古い日を消すのではなく、月ごとの集計（dailyArchive）にたたむ（daily-archive.js）。
    if (keepDays <= 0) return foldDailyIntoArchive(stats, null);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - keepDays);
    return foldDailyIntoArchive(stats, formatDate(cutoff));
  },

  /**
   * アプリ管理外の localStorage キーや任意削除可能なキャッシュを削除する
   * 容量逼迫時の最終手段
   */
  _purgeUnrelatedKeys: () => {
    try {
      const KEEP = new Set([STORAGE_KEY, ACTIVE_SESSION_KEY, ...LEGACY_KEYS, 'kanji_town_resident_mode']);
      const removable = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        // 自アプリのエラーログ・旧キャッシュのみ削除する
        // （GitHub Pagesではオリジンを他アプリと共有するため、無関係なキーには触れない）
        if (!KEEP.has(k) && (
          k.startsWith('kanji_town_errors')
          || k === 'kanji_town_diagnostics_v1'
          || k === BROKEN_COPY_KEY
          || k === BEFORE_IMPORT_KEY
          || k.startsWith('kanji_vg_cache')
        )) {
          removable.push(k);
        }
      }
      removable.forEach(k => { try { window.localStorage.removeItem(k); } catch {} });
    } catch {}
  },

  /**
   * 最小限のフィールドだけ残した stats を返す（最終救援用）
   * @param {object} stats
   * @returns {object}
   */
  _minimalStats: (stats) => {
    // 残す欄を並べる形だと、並べ忘れた欄（sessionCount・lastLoginBonusDate・dailyMissions など）が
    // 黙って消え、その日のログインボーナスやミッション報酬をもう一度受け取れていた。
    // 捨てるものだけを挙げる: 1日ごとの記録（月ごとの集計にたたむ）と、表示用の一時的な結果。
    const folded = StorageAPI._compressDailyData(stats, 0);
    const { lastCollectionResult, ...rest } = folded;
    return { ...rest, daily: {} };
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
    if (!_writable) return;
    if (_saveDebounceTimer) clearTimeout(_saveDebounceTimer);
    _pendingStats = stats;
    _saveDebounceTimer = setTimeout(() => {
      _saveDebounceTimer = null;
      _pendingStats = null;
      StorageAPI.safeSet(STORAGE_KEY, stats);
    }, DEBOUNCE.SAVE);
  },

  /**
   * デバウンス中の保存があれば、すぐに書く。
   * @returns {boolean} 書き出すものがあったか
   */
  flushPendingSave: () => {
    if (!_saveDebounceTimer) return false;
    clearTimeout(_saveDebounceTimer);
    _saveDebounceTimer = null;
    const pending = _pendingStats;
    _pendingStats = null;
    if (!pending || !_writable) return false;
    StorageAPI.safeSet(STORAGE_KEY, pending);
    return true;
  },

  /** このタブが記録を書くかどうかを切りかえる（ほかのタブで開かれたら false） */
  setWritable: (writable) => {
    _writable = Boolean(writable);
  },

  isWritable: () => _writable,

  /**
   * 即時保存（セッション終了時など、データロスを防ぐ場面で使用）
   * @param {object} stats
   * @returns {boolean} 保存成功
   */
  saveStatsImmediate: (stats) => {
    if (_saveDebounceTimer) {
      clearTimeout(_saveDebounceTimer);
      _saveDebounceTimer = null;
    }
    _pendingStats = null;
    if (!_writable) return false;
    return StorageAPI.safeSet(STORAGE_KEY, stats);
  },

  /** 学習途中の小さなチェックポイントを即時保存する。 */
  saveActiveSession: (checkpoint) => {
    if (!_writable) return false;
    try {
      window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(checkpoint));
      return true;
    } catch (error) {
      logStorageError('saveActiveSession', error);
      _notifySaveError('active-session');
      return false;
    }
  },

  /**
   * バックアップを読みこむ前に、いまの記録を1つだけ控えておく（あとで取り消せるように）。
   * @returns {boolean} 控えられたか
   */
  keepBeforeImportCopy: () => {
    try {
      const current = window.localStorage.getItem(STORAGE_KEY);
      if (!current) return false;
      window.localStorage.setItem(BEFORE_IMPORT_KEY, current);
      return true;
    } catch (e) {
      logStorageError('keepBeforeImportCopy', e);
      return false;
    }
  },

  hasBeforeImportCopy: () => {
    try { return Boolean(window.localStorage.getItem(BEFORE_IMPORT_KEY)); } catch { return false; }
  },

  /**
   * 控えておいた「読みこむ前の記録」にもどす。
   * @returns {boolean} もどせたか
   */
  restoreBeforeImportCopy: () => {
    if (!_writable) return false;
    try {
      const saved = window.localStorage.getItem(BEFORE_IMPORT_KEY);
      if (!saved) return false;
      if (_saveDebounceTimer) { clearTimeout(_saveDebounceTimer); _saveDebounceTimer = null; }
      _pendingStats = null;
      window.localStorage.setItem(STORAGE_KEY, saved);
      window.localStorage.removeItem(BEFORE_IMPORT_KEY);
      return true;
    } catch (e) {
      logStorageError('restoreBeforeImportCopy', e);
      return false;
    }
  },

  /**
   * 「すべてのデータを消す」。端末を次の子に引き渡すときに使うので、控え（取り消し用・退避）も消す。
   * 学習ログ（study.records.v1）はほかのアプリと共通なので消さない（仕様 §1.1/§1.2）。
   * かわりに、消した時刻より前の記録はこのアプリの画面に出さない（studyStats.js）。
   */
  resetAll: () => {
    if (_saveDebounceTimer) { clearTimeout(_saveDebounceTimer); _saveDebounceTimer = null; }
    _pendingStats = null;
    if (!_writable) return false;
    [STORAGE_KEY, ...LEGACY_KEYS, ACTIVE_SESSION_KEY, BROKEN_COPY_KEY, BEFORE_IMPORT_KEY, 'kanji_town_cloud_owner_v1']
      .forEach(key => { try { window.localStorage.removeItem(key); } catch { /* 消せなくても先へ進む */ } });
    try { window.localStorage.setItem(STUDY_VIEW_SINCE_KEY, String(Date.now())); } catch { /* 表示の絞りこみだけなので無視 */ }
    return true;
  },

  /** 保存済みの学習チェックポイントを取得する。 */
  getActiveSession: () => StorageAPI.safeGet(ACTIVE_SESSION_KEY, null),

  /** 完了・破棄された学習チェックポイントを削除する。 */
  clearActiveSession: () => {
    if (!_writable) return;
    try {
      window.localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch (error) {
      logStorageError('clearActiveSession', error);
    }
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
  /**
   * 読めなかった保存データの原文を退避する。新しいデータで上書きする前に呼ぶ。
   * 壊れた JSON を空から作りなおすと、原文がどこにも残らず取り戻せなかった。
   * @param {string} rawText
   */
  _keepBrokenCopy: (rawText) => {
    try {
      if (window.localStorage.getItem(BROKEN_COPY_KEY) === rawText) return;
      window.localStorage.setItem(BROKEN_COPY_KEY, rawText);
      recordDiagnosticEvent({
        severity: 'error',
        source: 'storage',
        code: 'stats-unreadable',
        message: `Unreadable saved data was kept in ${BROKEN_COPY_KEY} before starting fresh.`,
      });
    } catch (e) {
      logStorageError('keepBrokenCopy', e);
    }
  },

  getStats: () => {
    let rawText = null;
    try { rawText = window.localStorage.getItem(STORAGE_KEY); } catch { rawText = null; }
    let stats = StorageAPI.safeGet(STORAGE_KEY, null);

    // レガシーキーからの復元
    if (!stats) {
      for (const key of LEGACY_KEYS) {
        stats = StorageAPI.safeGet(key, null);
        if (stats) break;
      }
    }

    // 型の違う欄は、その欄だけを捨てて既定値で埋めなおす（全体は捨てない）。
    // ここを通さないと、型の違う欄が1つあるだけで起動のたびに例外が出て真っ白になっていた。
    const checked = sanitizeStats(stats);
    stats = checked ? checked.stats : null;
    if (checked && checked.repaired.length > 0) {
      recordDiagnosticEvent({
        severity: 'warning',
        source: 'storage',
        code: 'stats-repaired',
        message: `Saved data had unexpected types: ${checked.repaired.join(', ')}`,
      });
    }

    // 新規データ生成
    if (!stats || !stats.targetGrade) {
      // 中身のある記録を読めなかったときは、作りなおす前に原文を残す
      if (rawText) StorageAPI._keepBrokenCopy(rawText);
      const { map } = StorageAPI.buildInitialMap();
      stats = {
        totalExp: 0,
        streak: 0,
        lastDate: '',
        lastNeglectAppliedDate: '',
        restPassAvailable: true,
        restPassRechargeProgress: 0,
        lastRestPassDate: '',
        lastHabitEvent: null,
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
      lastNeglectAppliedDate: '',
    };
    for (const [field, defaultVal] of Object.entries(defaults)) {
      if (!stats[field]) stats[field] = defaultVal;
    }
    if (stats.coins === undefined) stats.coins = 0;
    Object.assign(stats, normalizeHabitState(stats));

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
    const neglectApplied = StorageAPI._applyNeglectPenalties(stats);

    // ── Lv100 が上限だったころにためた EXP を、新しいレベルに直す（1つの記録につき1回だけ） ──
    stats = liftLevelCap(stats);

    // ── 実績の進捗を起動時に一括更新（新規追加分も反映） ──
    if (!stats.achievements) stats.achievements = {};
    StorageAPI._updateAchievements(stats);

    // ごほうびを渡したときは、お祝いを出す前に閉じても二重に渡さないよう、すぐ書く
    if (neglectApplied || stats.pendingLevelUp) StorageAPI.saveStatsImmediate(stats);
    return stats;
  },

  /**
   * 書きこまずに、いまの記録を読む（学習ログの拡張など、読み取りだけの用途）。
   * getStats は放置のペナルティを当てて保存まで行うので、読むたびに呼ぶと
   * 保存待ちの変更を上書きしたり、乱数のペナルティを何度もかけ直したりしていた。
   * @returns {object|null}
   */
  peekStats: () => {
    StorageAPI.flushPendingSave();
    const checked = sanitizeStats(StorageAPI.safeGet(STORAGE_KEY, null));
    if (!checked || !checked.stats.targetGrade) return null;
    const kanjiStats = {};
    Object.entries(checked.stats.kanjiStats || {}).forEach(([id, card]) => {
      if (_validKanjiIds.has(id)) kanjiStats[id] = migrateCard(card);
    });
    return { ...checked.stats, kanjiStats };
  },

  /**
   * 日をまたいだときの町の手入れ（放置のペナルティと実績の数え直し）を、メモリ上の記録に当てる。
   * 保存はしない（呼び出し側が saveStats する）。何も変わらなければ同じオブジェクトを返す。
   *
   * 以前は1分ごとの日付チェックが getStats() を呼び、保存済みのコピーにだけペナルティを当てて
   * 即時保存していた。そのため保存待ちの変更が消え、メモリ側にはペナルティが入らないので、
   * 次の保存で消えては1分後に別の乱数でかけ直される、をくり返していた。
   * @param {object} stats
   * @param {string} [today]
   * @returns {object}
   */
  applyDailyMaintenance: (stats, today = getTodayString()) => {
    if (!stats || !stats.lastDate || stats.lastDate === today || stats.lastNeglectAppliedDate === today) return stats;
    const copy = JSON.parse(JSON.stringify(stats));
    if (!StorageAPI._applyNeglectPenalties(copy)) return stats;
    StorageAPI._updateAchievements(copy);
    return copy;
  },

  /**
   * 実績の進み具合を、いまの記録から数え直す（stats.achievements を書きかえて、同じ stats を返す）。
   * 以前は起動時とセッション終了時にしか数えず、クラフト・建物・コインの実績はすぐ受け取れず、
   * セッション回数の実績は1回遅れていた。
   * @param {object} stats
   * @returns {object}
   */
  refreshAchievements: (stats) => {
    if (!stats) return stats;
    stats.achievements = JSON.parse(JSON.stringify(stats.achievements || {}));
    StorageAPI._updateAchievements(stats);
    return stats;
  },

  /**
   * サボり日数に応じたペナルティを適用する
   * @param {object} stats - 直接変更される
   */
  _applyNeglectPenalties: (stats) => {
    const todayStr = getTodayString();
    if (!stats.lastDate || stats.lastDate === todayStr) return false;
    if (stats.lastNeglectAppliedDate === todayStr) return false;
    // 1日だけの休息はおやすみパスの対象。実際に学習した時点でパスを消費する。
    if (canProtectRestDay(stats, todayStr)) return false;

    const last = new Date(`${stats.lastDate}T00:00:00`);
    const today = new Date(`${todayStr}T00:00:00`);
    if (isNaN(last.getTime()) || isNaN(today.getTime())) return false;

    const diffDays = Math.max(0, Math.floor((today - last) / 86400000));
    let previouslyAppliedDays = 0;
    if (stats.lastNeglectAppliedDate) {
      const previous = new Date(`${stats.lastNeglectAppliedDate}T00:00:00`);
      if (!isNaN(previous.getTime())) {
        previouslyAppliedDays = Math.max(0, Math.min(diffDays, Math.floor((previous - last) / 86400000)));
      }
    }

    // 雑草の発生
    if (diffDays >= NEGLECT.WEED_DAYS) {
      const clearedKeys = Object.keys(stats.townMap).filter(k => stats.townMap[k] === 't_cleared');
      const newlyElapsedPenaltyDays = Math.max(
        0,
        diffDays - Math.max(previouslyAppliedDays, NEGLECT.WEED_DAYS - 1),
      );
      const weedCount = Math.min(
        newlyElapsedPenaltyDays * NEGLECT.WEEDS_PER_DAY,
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
    if (previouslyAppliedDays < NEGLECT.LEAVE_DAYS && diffDays >= NEGLECT.LEAVE_DAYS && stats.population > 0) {
      const leave = Math.max(1, Math.floor(stats.population * NEGLECT.LEAVE_RATIO));
      stats.population = Math.max(0, stats.population - leave);
      stats.villagers = stats.villagers.slice(leave);
    }

    // 建物の荒廃
    if (previouslyAppliedDays < NEGLECT.DECAY_DAYS && diffDays >= NEGLECT.DECAY_DAYS && stats.population > 0) {
      const buildingKeys = Object.keys(stats.townMap).filter(k => {
        const item = findTownItem(stats.townMap[k]);
        return item && (item.type === 'building' || item.type === 'special');
      });
      const decayCount = Math.min(NEGLECT.DECAY_MAX_BUILDINGS, buildingKeys.length);
      const shuffledBuildings = [...buildingKeys];
      for (let i = shuffledBuildings.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledBuildings[i], shuffledBuildings[j]] = [shuffledBuildings[j], shuffledBuildings[i]];
      }
      for (let i = 0; i < decayCount; i++) {
        const k = shuffledBuildings[i];
        if (k) {
          stats.townItems[stats.townMap[k]] = (stats.townItems[stats.townMap[k]] || 0) + 1;
          stats.townMap[k] = 't_roughland';
        }
      }
    }

    // 同じ日にgetStatsが複数回呼ばれてもペナルティを重複適用しない。
    stats.lastNeglectAppliedDate = todayStr;
    return true;
  },

  /**
   * 住民の1日1回の収集だけを実行する。
   * 学習記録・ストリークは更新しないため、アプリを開くだけで学習日にならない。
   */
  collectDailyTownResources: (stats, today = getTodayString()) => {
    if (stats.lastCollectionDate === today || (stats.villagers || []).length === 0) return stats;

    const { materials: collected, coins: collectedCoins } = collectDailyResources(stats);
    if (!stats.materials) stats.materials = {};
    Object.entries(collected).forEach(([matId, amount]) => {
      stats.materials[matId] = (stats.materials[matId] || 0) + amount;
    });
    const maintenanceCost = calculateMaintenanceCost(stats);
    stats.coins = Math.max(0, (stats.coins || 0) + collectedCoins - maintenanceCost);
    stats.lastCollectionDate = today;
    stats.lastCollectionResult = { materials: collected, coins: collectedCoins, maintenanceCost };
    stats.satisfaction = calculateSatisfaction(stats);
    return stats;
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
    const reviewedCount = sessionData.reviewedCount || 0;
    const perfectCount = sessionData.perfectCount || 0;
    const attemptCount = Math.max(0, Number(sessionData.attemptCount) || 0);
    const correctCount = Math.min(attemptCount, Math.max(0, Number(sessionData.correctCount) || 0));
    const hasLearningActivity = exp > 0 || reviewedCount > 0 || attemptCount > 0;

    if (hasLearningActivity) {
      if (!stats.daily) stats.daily = {};
      if (!stats.daily[today]) stats.daily[today] = { exp: 0, reviewed: 0, perfects: 0, attempts: 0, correct: 0 };

      stats.daily[today].exp += exp;
      stats.daily[today].reviewed = (stats.daily[today].reviewed || 0) + reviewedCount;
      stats.daily[today].perfects = (stats.daily[today].perfects || 0) + perfectCount;
      stats.daily[today].attempts = (stats.daily[today].attempts || 0) + attemptCount;
      stats.daily[today].correct = (stats.daily[today].correct || 0) + correctCount;
      stats.totalExp += exp;
      stats.perfectCountTotal = (stats.perfectCountTotal || 0) + perfectCount;
    }

    // 学習による雑草除去
    if (exp > 0) {
      const weedKeys = Object.keys(stats.townMap || {}).filter(k => stats.townMap[k] === 't_weed');
      const clearCount = Math.min(NEGLECT.WEED_CLEAR_PER_SESSION, weedKeys.length);
      for (let i = 0; i < clearCount; i++) {
        stats.townMap[weedKeys[i]] = 't_cleared';
      }
    }

    // ストリーク更新（1日の休息はおやすみパスで自動保護）
    if (hasLearningActivity && stats.lastDate !== today) {
      Object.assign(stats, applyLearningDayHabit(stats, today));
      stats.lastNeglectAppliedDate = today;
    }

    // ── 住民の自動素材収集（1日1回）──
    StorageAPI.collectDailyTownResources(stats, today);

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

    // 通算の学習日数と復習回数（月ごとの集計にたたんだ古い日も数える）
    const { loginDays, reviewTotal } = countStudyTotals(stats);

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
      login_days: loginDays,
      review_total: reviewTotal,
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
