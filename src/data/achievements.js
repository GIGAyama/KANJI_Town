// 実績定義 — マイ漢字タウン（Phase 7: 5個 → 35個に大幅拡張）
// type: streak | perfect | master | craft | building | population | collection | exploration | session | grade

export const ACHIEVEMENTS = [
  // ── ストリーク系 ──────────────────────────
  { id: 'login_3', type: 'streak', target: 3, name: '三日坊主からの卒業', desc: '3日連続で修行する', reward: 500, rewardItem: null, category: 'daily' },
  { id: 'login_7', type: 'streak', target: 7, name: '修行の鬼', desc: '7日連続で修行する', reward: 1500, rewardItem: null, category: 'daily' },
  { id: 'login_14', type: 'streak', target: 14, name: '鉄の意志', desc: '14日連続で修行する', reward: 3000, rewardItem: 't_pine', category: 'daily' },
  { id: 'login_30', type: 'streak', target: 30, name: '漢字の修行僧', desc: '30日連続で修行する', reward: 5000, rewardItem: 't_torii', category: 'daily' },

  // ── Perfect系 ─────────────────────────────
  { id: 'perfect_10', type: 'perfect', target: 10, name: '美文字のはじまり', desc: 'なぞり書きでPerfectを10回だす', reward: 300, rewardItem: null, category: 'study' },
  { id: 'perfect_50', type: 'perfect', target: 50, name: '美文字の才能', desc: 'なぞり書きでPerfectを50回だす', reward: 1000, rewardItem: 't_sakura', category: 'study' },
  { id: 'perfect_100', type: 'perfect', target: 100, name: '書道の達人', desc: 'なぞり書きでPerfectを100回だす', reward: 2000, rewardItem: 't_kakejiku', category: 'study' },
  { id: 'perfect_300', type: 'perfect', target: 300, name: '筆の神', desc: 'なぞり書きでPerfectを300回だす', reward: 5000, rewardItem: null, category: 'study' },

  // ── マスター系 ─────────────────────────────
  { id: 'master_1', type: 'master', target: 1, name: 'はじめの一歩', desc: '漢字を1文字マスターする', reward: 200, rewardItem: null, category: 'study' },
  { id: 'master_10', type: 'master', target: 10, name: 'はじめてのマスター', desc: '漢字を10文字マスターする', reward: 1000, rewardItem: null, category: 'study' },
  { id: 'master_50', type: 'master', target: 50, name: '漢字の達人', desc: '漢字を50文字マスターする', reward: 3000, rewardItem: 't_dragon', category: 'study' },
  { id: 'master_100', type: 'master', target: 100, name: '百の知識', desc: '漢字を100文字マスターする', reward: 5000, rewardItem: 't_temple', category: 'study' },
  { id: 'master_200', type: 'master', target: 200, name: '二百字の壁を越えて', desc: '漢字を200文字マスターする', reward: 8000, rewardItem: null, category: 'study' },
  { id: 'master_500', type: 'master', target: 500, name: '漢字博士', desc: '漢字を500文字マスターする', reward: 15000, rewardItem: 't_castle', category: 'study' },
  { id: 'master_1026', type: 'master', target: 1026, name: '全漢字制覇', desc: '1026字すべてをマスターする', reward: 50000, rewardItem: null, category: 'study' },

  // ── 学年別制覇 ─────────────────────────────
  { id: 'grade1_all', type: 'grade', target: 80, gradeNum: 1, name: '一年生マスター', desc: '小学1年の漢字80字をすべてマスター', reward: 2000, rewardItem: null, category: 'grade' },
  { id: 'grade2_all', type: 'grade', target: 160, gradeNum: 2, name: '二年生マスター', desc: '小学2年の漢字160字をすべてマスター', reward: 3000, rewardItem: null, category: 'grade' },
  { id: 'grade3_all', type: 'grade', target: 200, gradeNum: 3, name: '三年生マスター', desc: '小学3年の漢字200字をすべてマスター', reward: 4000, rewardItem: null, category: 'grade' },
  { id: 'grade4_all', type: 'grade', target: 197, gradeNum: 4, name: '四年生マスター', desc: '小学4年の漢字197字をすべてマスター', reward: 5000, rewardItem: null, category: 'grade' },
  { id: 'grade5_all', type: 'grade', target: 197, gradeNum: 5, name: '五年生マスター', desc: '小学5年の漢字197字をすべてマスター', reward: 6000, rewardItem: null, category: 'grade' },
  { id: 'grade6_all', type: 'grade', target: 192, gradeNum: 6, name: '六年生マスター', desc: '小学6年の漢字192字をすべてマスター', reward: 7000, rewardItem: null, category: 'grade' },

  // ── クラフト系 ─────────────────────────────
  { id: 'craft_1', type: 'craft', target: 1, name: 'はじめてのクラフト', desc: 'アイテムを1回クラフトする', reward: 200, rewardItem: null, category: 'town' },
  { id: 'craft_10', type: 'craft', target: 10, name: '見習い職人', desc: 'アイテムを10回クラフトする', reward: 1000, rewardItem: null, category: 'town' },
  { id: 'craft_50', type: 'craft', target: 50, name: '匠の技', desc: 'アイテムを50回クラフトする', reward: 3000, rewardItem: null, category: 'town' },

  // ── 建物・人口系 ───────────────────────────
  { id: 'building_5', type: 'building', target: 5, name: 'まちの第一歩', desc: '建物を5つ配置する', reward: 500, rewardItem: null, category: 'town' },
  { id: 'building_20', type: 'building', target: 20, name: 'にぎやかな町', desc: '建物を20個配置する', reward: 2000, rewardItem: null, category: 'town' },
  { id: 'building_50', type: 'building', target: 50, name: '大都市の建築家', desc: '建物を50個配置する', reward: 5000, rewardItem: null, category: 'town' },
  { id: 'pop_5', type: 'population', target: 5, name: 'はじめての村', desc: '人口を5人にする', reward: 500, rewardItem: null, category: 'town' },
  { id: 'pop_20', type: 'population', target: 20, name: '成長する町', desc: '人口を20人にする', reward: 2000, rewardItem: null, category: 'town' },
  { id: 'pop_50', type: 'population', target: 50, name: '繁栄の都', desc: '人口を50人にする', reward: 5000, rewardItem: null, category: 'town' },

  // ── セッション系 ───────────────────────────
  { id: 'session_total_10', type: 'session', target: 10, name: 'がんばり屋さん', desc: '合計10回セッションをする', reward: 500, rewardItem: null, category: 'daily' },
  { id: 'session_total_50', type: 'session', target: 50, name: '努力の人', desc: '合計50回セッションをする', reward: 2000, rewardItem: null, category: 'daily' },
  { id: 'session_total_100', type: 'session', target: 100, name: '修行の鉄人', desc: '合計100回セッションをする', reward: 5000, rewardItem: null, category: 'daily' },
];

// カテゴリ定義
export const ACHIEVEMENT_CATEGORIES = {
  study: { name: '学習', emoji: '📚', order: 0 },
  grade: { name: '学年制覇', emoji: '🎓', order: 1 },
  town: { name: 'まちづくり', emoji: '🏘️', order: 2 },
  daily: { name: '毎日のがんばり', emoji: '🔥', order: 3 },
};
