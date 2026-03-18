// ==========================================
// レベルシステム＆報酬テーブル定義 (商業レベルデザイン)
// 児童が直感的に「次へ進みたくなる」動機付けを提供
// ==========================================

// 初期値: 0 EXP = Lv1
// 序盤の1セッション(5問~10問)での平均獲得EXPは 50〜100程度を想定。
// そのため、Lv2〜5までは1セッション程度でサクサク上がるように調整。
// 中盤以降も、1日で1〜2レベルは上がるペース（数回セッションを行えば上がる）にする。

const LEVEL_TABLE = [
  { level: 1,  exp: 0,      reward: null,                desc: '旅のはじまり' },
  { level: 2,  exp: 50,     reward: { type: 'coins', amount: 500 }, desc: '軍資金をゲット！' },
  { level: 3,  exp: 150,    reward: { type: 'feature', id: 'craft', text: '「クラフト」機能解放！' }, desc: 'アイテムを作ろう' },
  { level: 4,  exp: 300,    reward: { type: 'radius', amount: 4, text: 'マップが広がった！' }, desc: '広い世界へ' },
  { level: 5,  exp: 500,    reward: { type: 'item', id: 't_house1', amount: 1, text: '「民家」をもらった！' }, desc: '住民を増やそう' },
  { level: 6,  exp: 800,    reward: { type: 'coins', amount: 1000 }, desc: 'コイン1000枚ゲット！' },
  { level: 7,  exp: 1200,   reward: { type: 'radius', amount: 5, text: 'マップが広がった！' }, desc: '未開の地へ' },
  { level: 8,  exp: 1700,   reward: { type: 'item', id: 't_sakura_tree', amount: 1, text: '「桜の木」をもらった！' }, desc: '村を飾ろう' },
  { level: 9,  exp: 2300,   reward: { type: 'coins', amount: 1500 }, desc: 'お金持ちへの道' },
  { level: 10, exp: 3000,   reward: { type: 'feature', id: 'theme_sakura', text: 'テーマ色「さくら」解放！' }, desc: '春の訪れ' },
  // 以降、緩やかな二次曲線に近い形でテーブルを自動生成（Lv11〜Lv100まで）
];

// Lv11〜Lv100までのテーブルを動的生成して追加
// 成長曲線: 前のレベルの必要EXP + (レベル * 150)
(() => {
  let currentExpTarget = 3000;
  for (let i = 11; i <= 100; i++) {
    const step = Math.floor(i * 150);
    currentExpTarget += step;
    
    let reward = null;
    let desc = '日々の鍛錬';

    // 節目ごとの報酬設定
    if (i % 5 === 0) {
      // 5レベル毎にマップ拡大
      const newRad = Math.min(25, 5 + Math.floor((i - 10) / 5));
      reward = { type: 'radius', amount: newRad, text: 'マップがまた少し広がった！' };
      desc = '領土拡大';
    } else if (i % 10 === 0) {
      // 10レベル毎に大型報酬や色解放
      reward = { type: 'coins', amount: i * 500, text: `大量のコイン(${i*500}枚)をゲット！` };
      desc = '大台突破記念';
      
      // 特定レベルでテーマカラー解放
      if (i === 30) {
        reward = { type: 'feature', id: 'theme_ocean', text: 'テーマ色「オーシャン」解放！' };
        desc = '夏の海辺';
      } else if (i === 50) {
        reward = { type: 'feature', id: 'theme_sunset', text: 'テーマ色「サンセット」解放！' };
        desc = '夕暮れの町';
      } else if (i === 80) {
        reward = { type: 'feature', id: 'theme_gold', text: 'テーマ色「ゴールド」解放！' };
        desc = '黄金の夜明け';
      }
    } else if (i % 2 === 0) {
      // 2レベル刻みで少しコイン
      reward = { type: 'coins', amount: 500 };
    } else {
      // それ以外はランダムな素材など（軽量化のためここでは固定文字とする場合もあるが、表示用）
      reward = { type: 'item', id: 't_road', amount: 3, text: '「道」を3つもらった！' };
    }

    // 100レベル到達時
    if (i === 100) {
      reward = { type: 'feature', id: 'town_max', text: 'マップ探索範囲 最大解放！' };
      desc = '漢字マスターの領域';
    }

    LEVEL_TABLE.push({ level: i, exp: currentExpTarget, reward, desc });
  }
})();

/**
 * 現在の総EXPからレベル情報を取得する
 * @param {number} totalExp - プレイヤーの総獲得EXP
 * @returns {Object} { level, progress, currentLevelExp, nextLevelExp, targetReward }
 */
export const getLevelInfoFromExp = (totalExp) => {
  // 該当するレベルを検索（逆順）
  let currentLevelData = LEVEL_TABLE[0];
  let nextLevelData = LEVEL_TABLE[1];
  let levelIndex = 0;

  for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
    if (totalExp >= LEVEL_TABLE[i].exp) {
      currentLevelData = LEVEL_TABLE[i];
      levelIndex = i;
      nextLevelData = LEVEL_TABLE[Math.min(i + 1, LEVEL_TABLE.length - 1)];
      break;
    }
  }

  // レベル100以降（カンスト状態）
  if (levelIndex === LEVEL_TABLE.length - 1) {
    return {
      level: currentLevelData.level,
      progress: 100, // MAX
      currentLevelExp: currentLevelData.exp,
      nextLevelExp: currentLevelData.exp,
      targetReward: null,
      isMaxLevel: true
    };
  }

  const expInCurrentLevel = totalExp - currentLevelData.exp;
  const expNeededForNextLevel = nextLevelData.exp - currentLevelData.exp;
  const progress = Math.min(100, Math.max(0, (expInCurrentLevel / expNeededForNextLevel) * 100));

  return {
    level: currentLevelData.level,
    progress: progress,
    currentLevelExp: currentLevelData.exp,
    nextLevelExp: nextLevelData.exp,
    remainingExp: nextLevelData.exp - totalExp,
    targetReward: nextLevelData.reward,
    isMaxLevel: false
  };
};

/**
 * テーマカラーを決定する
 */
export const getThemeFromLevel = (level) => {
  if (level >= 80) return 'gold';
  if (level >= 50) return 'sunset';
  if (level >= 30) return 'ocean';
  if (level >= 10) return 'sakura';
  return 'default';
};

/**
 * レベルアップ検知と比較（前回EXPと今回EXPを渡す）
 * レベルが上がっていれば、取得した報酬の配列を返す
 */
export const checkLevelUp = (oldExp, newExp) => {
  const oldLvlInfo = getLevelInfoFromExp(oldExp);
  const newLvlInfo = getLevelInfoFromExp(newExp);

  if (newLvlInfo.level > oldLvlInfo.level) {
    const rewards = [];
    // 飛んでレベルアップした場合も対応（Lv1 -> Lv3など）
    for (let l = oldLvlInfo.level + 1; l <= newLvlInfo.level; l++) {
      const data = LEVEL_TABLE.find(t => t.level === l);
      if (data && data.reward) {
        rewards.push({ level: l, reward: data.reward });
      }
    }
    return { isLevelUp: true, oldLevel: oldLvlInfo.level, newLevel: newLvlInfo.level, rewards };
  }
  return { isLevelUp: false, oldLevel: oldLvlInfo.level, newLevel: newLvlInfo.level, rewards: [] };
};

/**
 * 学年(1-6)から、その学年の要素を解放するのに必要なプレイヤーレベルを返す
 * @param {number} grade - 学年 (1-6)
 * @returns {number} 必要なプレイヤーレベル
 */
export const getMinLevelForGrade = (grade) => {
  // マッピング: 1年:Lv1, 2年:Lv10, 3年:Lv25, 4年:Lv40, 5年:Lv60, 6年:Lv80
  const levels = [0, 1, 10, 25, 40, 60, 80];
  return levels[grade] || 0;
};
