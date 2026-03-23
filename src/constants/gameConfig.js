// ==========================================
// ゲームバランス設定（一元管理）
// 全てのゲームバランスに関わる数値をここで管理する
// ==========================================

/** マップ設定 */
export const MAP = {
  GRID_SIZE: 50,
  CENTER: 25,
  INITIAL_EXPLORE_RADIUS: 3,
  LEGACY_GRID_SIZE: 20,
  LEGACY_CENTER: 10,
  LEGACY_OFFSET: 15,
  /** マイグレーション時の最小探索半径 */
  MIGRATION_MIN_RADIUS: 6,
};

/** タイル設定 */
export const TILE = {
  WIDTH: 64,
  HEIGHT: 32,
  /** ズーム下限 */
  ZOOM_MIN: 0.25,
  /** ズーム上限 */
  ZOOM_MAX: 1.8,
  /** ドラッグ判定の閾値(px) */
  DRAG_THRESHOLD: 8,
};

/** 学習セッション設定 */
export const SESSION = {
  SIZE_LIMITS: {
    small: { review: 10, new: 3 },
    normal: { review: 20, new: 5 },
    large: { review: 30, new: 8 },
  },
  /** セッション直後の復習猶予時間(ms) */
  GRACE_PERIOD: 30 * 60 * 1000,
};

/** 経済設定 */
export const ECONOMY = {
  /** 初期コイン */
  INITIAL_COINS: 200,
  /** EXP→コイン変換レート (÷4) */
  EXP_TO_COIN_DIVISOR: 4,
  /** ガチャ1回のコスト */
  GACHA_COST: 100,
};

/** レアドロップ設定 */
export const RARE_DROP = {
  BASE_CHANCE: 0.10,
  STREAK_BONUS: 0.01,
  MAX_CHANCE: 0.50,
  ITEMS: ['t_torii', 't_temple', 't_castle', 't_dragon'],
};

/** 住民・満足度設定 */
export const RESIDENTS = {
  /** 基本満足度 */
  BASE_SATISFACTION: 50,
  /** 建物種類のボーナス上限 */
  BUILDING_DIVERSITY_MAX: 20,
  /** 建物種類ボーナスの倍率 */
  BUILDING_DIVERSITY_MULTIPLIER: 2,
  /** ストリークボーナス上限 */
  STREAK_BONUS_MAX: 15,
  /** ストリークボーナス倍率 */
  STREAK_BONUS_MULTIPLIER: 3,
  /** 1軒あたりの住民キャパシティ */
  HOUSING_CAPACITY: 3,
  /** 自然物ボーナス閾値 */
  NATURE_BONUS_THRESHOLD: 3,
  /** 自然物ボーナス */
  NATURE_BONUS: 5,
  /** 過密ペナルティ倍率 */
  OVERCROWDING_MULTIPLIER: 2,
  /** 雑草ペナルティ倍率 */
  WEED_PENALTY_MULTIPLIER: 1,
  /** 満足度→EXP倍率の閾値 */
  SATISFACTION_TIERS: [
    { min: 80, multiplier: 1.3 },
    { min: 60, multiplier: 1.15 },
    { min: 40, multiplier: 1.0 },
    { min: 20, multiplier: 0.85 },
    { min: 0, multiplier: 0.7 },
  ],
};

/** サボりペナルティ設定 */
export const NEGLECT = {
  /** 雑草が生える日数 */
  WEED_DAYS: 1,
  /** 1日あたりの雑草数 */
  WEEDS_PER_DAY: 2,
  /** 雑草化する更地の最大割合 */
  WEED_MAX_RATIO: 0.3,
  /** 住民が去る日数 */
  LEAVE_DAYS: 3,
  /** 去る住民の割合 */
  LEAVE_RATIO: 0.2,
  /** 建物が荒れ地に戻る日数 */
  DECAY_DAYS: 7,
  /** 荒れ地に戻る建物の最大数 */
  DECAY_MAX_BUILDINGS: 2,
  /** 学習時に除去する雑草の最大数 */
  WEED_CLEAR_PER_SESSION: 5,
};

/** EXP設定 */
export const EXP = {
  /** 新規漢字の基本EXP */
  NEW_KANJI: 50,
  /** easy評価時のEXP */
  EASY: 15,
  /** good評価時のEXP */
  GOOD: 10,
  /** hard評価時のEXP */
  HARD: 5,
  /** パーフェクトボーナスEXP */
  PERFECT_BONUS: 5,
  /** ドリルモードの固定EXP */
  DRILL: 5,
};

/** ストローク解析設定 */
export const STROKE_ANALYSIS = {
  /** 最小ポイント数 */
  MIN_POINTS: 3,
  /** 終筆検出の開始位置（全体の割合） */
  ENDING_START_RATIO: 0.85,
  /** 終筆方向検出の開始位置 */
  ENDING_DIRECTION_RATIO: 0.70,
  /** 角度変化の閾値(度) */
  ANGLE_DIFF_THRESHOLD: 35,
  /** 終筆の大きさ閾値 */
  MAGNITUDE_THRESHOLD: 0.045,
  /** 速度閾値 */
  VELOCITY_THRESHOLD: 0.0025,
};

/** 採点の重み設定 */
export const GRADING = {
  WEIGHTS: {
    STROKE_COUNT: 20,
    START_ACCURACY: 30,
    END_ACCURACY: 30,
    CROSS_ACCURACY: 20,
  },
  /** 評価ラベルの閾値 */
  LABELS: [
    { min: 90, label: '💮 たいへんよくできました！', grade: 'excellent' },
    { min: 70, label: '⭕ よくできました！', grade: 'good' },
    { min: 50, label: '🔺 もうすこし！', grade: 'fair' },
    { min: 0, label: '❌ もういちど！', grade: 'poor' },
  ],
};

/** デバウンス設定(ms) */
export const DEBOUNCE = {
  SAVE: 400,
  DATE_CHECK_INTERVAL: 60000,
};

/** KanjiVG設定 */
export const KANJI_VG = {
  CDN_URL: 'https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji',
  FETCH_TIMEOUT: 5000,
  MAX_RETRIES: 3,
  VIEWBOX_SIZE: 109,
  SAMPLE_INTERVAL: 2,
};

/** 天気設定 */
export const WEATHER = {
  /** 天気の確率(%) */
  RAIN_CHANCE: 15,
  SNOW_MONTHS: [11, 0, 1],
  SNOW_CHANCE: 10,
  SAKURA_MONTHS: [2, 3],
  SAKURA_CHANCE: 20,
};

/** テストモード設定 */
export const TEST = {
  PASS_THRESHOLD: 70,
  QUESTION_OPTIONS: [10, 20, 50, 100],
};

/** PWA / Service Worker */
export const PWA = {
  SW_PATH: '/KANJI_Town/sw.js',
};
