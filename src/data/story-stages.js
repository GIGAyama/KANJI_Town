// ストーリーステージ — マイ漢字タウン
// 割合ベースの進行（学年の漢字数に依存しない設計）
// Phase 2: 50×50マップ対応 — 最大半径25で全マップ開放
//
// percentage: その学年の漢字のうち何%習得すればこのステージに到達するか

export const STORY_STAGES = [
  { id: 0, percentage: 0,    minKanji: 0,  minPop: 0,  radius: 3,  title: '荒野の旅人',  emoji: '🏕️', desc: 'ここは何もない荒野。だが、あなたの挑戦が今はじまる。' },
  { id: 1, percentage: 0.05, minKanji: 2,  minPop: 2,  radius: 6,  title: '開拓者',       emoji: '⛺',  desc: '最初の仲間が集まった。小さな集落が生まれようとしている。' },
  { id: 2, percentage: 0.15, minKanji: 5,  minPop: 5,  radius: 10, title: '村の創設者',   emoji: '🏘️', desc: '村人たちの笑い声が聞こえる。あなたは村長と呼ばれるようになった。' },
  { id: 3, percentage: 0.30, minKanji: 9,  minPop: 9,  radius: 14, title: '町の領主',     emoji: '🏙️', desc: '商人や職人が集まり、町に活気があふれてきた。' },
  { id: 4, percentage: 0.50, minKanji: 13, minPop: 13, radius: 18, title: '城主',         emoji: '🏯',  desc: 'あなたの名声は遠く広まった。城を建て、都を守れ。' },
  { id: 5, percentage: 0.75, minKanji: 16, minPop: 16, radius: 22, title: '大名',         emoji: '⚔️', desc: '領土は広がり、民は豊かに暮らしている。' },
  { id: 6, percentage: 1.00, minKanji: 20, minPop: 20, radius: 25, title: '天下人',       emoji: '👑',  desc: 'すべての漢字を習得した。この街は永遠に語り継がれるだろう。' },
];

/**
 * Get the current story stage based on mastered kanji count and total kanji in grade.
 *
 * Uses percentage-based thresholds so progression is consistent regardless
 * of which grade the player is studying.
 *
 * @param {number} masteredCount - Number of kanji mastered in the current grade
 * @param {number} totalKanjiInGrade - Total kanji available in the current grade
 * @returns {Object} The highest STORY_STAGES entry where percentage >= threshold
 */
export function getCurrentStage(masteredCount, totalKanjiInGrade) {
  const percentage = totalKanjiInGrade > 0 ? masteredCount / totalKanjiInGrade : 0;
  // Walk backwards to find the highest stage the player qualifies for
  for (let i = STORY_STAGES.length - 1; i >= 0; i--) {
    if (percentage >= STORY_STAGES[i].percentage) {
      return STORY_STAGES[i];
    }
  }
  return STORY_STAGES[0];
}
