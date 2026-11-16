// ストーリーステージ — マイ漢字タウン
// レベルで進む称号。ホームの上のバーと、学習の結果の画面に出る。
//
// ここは起動のときに読む（ホームが使う）ので、名前と絵文字だけを置く。
// ふりがなつきの名前と説明文は story-stage-text.js（結果の画面が開くときに読む）。
//
// Lv100「天下人」が最後だったが、レベルの上限を Lv999 に上げたので、その先の称号を足した。

export const STORY_STAGES = [
  { id: 0,  minLevel: 1,   title: '荒野の旅人',  emoji: '🏕️' },
  { id: 1,  minLevel: 10,  title: '開拓者',       emoji: '⛺' },
  { id: 2,  minLevel: 25,  title: '村の創設者',   emoji: '🏘️' },
  { id: 3,  minLevel: 40,  title: '町の領主',     emoji: '🏙️' },
  { id: 4,  minLevel: 60,  title: '城主',         emoji: '🏯' },
  { id: 5,  minLevel: 80,  title: '大名',         emoji: '⚔️' },
  { id: 6,  minLevel: 100, title: '天下人',       emoji: '👑' },
  { id: 7,  minLevel: 150, title: '名君',         emoji: '🎖️' },
  { id: 8,  minLevel: 200, title: '大王',         emoji: '🦁' },
  { id: 9,  minLevel: 300, title: '伝説の王',     emoji: '🌟' },
  { id: 10, minLevel: 500, title: '漢字の神',     emoji: '⛩️' },
  { id: 11, minLevel: 999, title: '永遠の伝説',   emoji: '🏆' },
];

/**
 * 現在のステータスからストーリーステージを取得する
 * @param {number} level - プレイヤーレベル
 * @returns {Object} 該当するSTORY_STAGESのエントリ
 */
export function getCurrentStage(level) {
  // 逆順で判定して該当する最高レベルのステージを返す
  for (let i = STORY_STAGES.length - 1; i >= 0; i--) {
    if (level >= STORY_STAGES[i].minLevel) {
      return STORY_STAGES[i];
    }
  }
  return STORY_STAGES[0];
}
