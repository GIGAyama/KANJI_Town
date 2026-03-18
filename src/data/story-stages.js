// ストーリーステージ — マイ漢字タウン
// 割合ベースの進行（学年の漢字数に依存しない設計）
// Phase 2: 50×50マップ対応 — 最大半径25で全マップ開放
//
// percentage: その学年の漢字のうち何%習得すればこのステージに到達するか

export const STORY_STAGES = [
  { id: 0, minLevel: 1,   radius: 3,  title: '荒野の旅人',  emoji: '🏕️', desc: 'ここは何もない荒野。だが、あなたの挑戦が今はじまる。' },
  { id: 1, minLevel: 10,  radius: 8,  title: '開拓者',       emoji: '⛺',  desc: '最初の仲間が集まった。小さな集落が生まれようとしている。' },
  { id: 2, minLevel: 25,  radius: 12, title: '村の創設者',   emoji: '🏘️', desc: '村人たちの笑い声が聞こえる。あなたは村長と呼ばれるようになった。' },
  { id: 3, minLevel: 40,  radius: 16, title: '町の領主',     emoji: '🏙️', desc: '商人や職人が集まり、町に活気があふれてきた。' },
  { id: 4, minLevel: 60,  radius: 20, title: '城主',         emoji: '🏯',  desc: 'あなたの名声は遠く広まった。城を建て、都を守れ。' },
  { id: 5, minLevel: 80,  radius: 23, title: '大名',         emoji: '⚔️', desc: '領土は広がり、民は豊かに暮らしている。' },
  { id: 6, minLevel: 100, radius: 25, title: '天下人',       emoji: '👑',  desc: 'すべての修行を乗り越えた。この街は永遠に語り継がれるだろう。' },
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
