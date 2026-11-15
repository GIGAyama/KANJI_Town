/**
 * ふりがな（ルビ）をどこに出すかの決まり。React に依存しない純粋な関数だけを置く。
 *
 *   all        … すべての漢字にふりがなを出す（既定。1年生でも読める）
 *   aboveGrade … えらんだ学年（ホームの「N年」）より上の学年で習う字と、
 *                教育漢字でない字をふくむことばにだけ出す
 *   none       … 出さない
 *
 * ただし、ふりがなそのものが学ぶ中身になっている所（音読の例文、書き取りの◯の上）は、
 * この設定にかかわらず出す。それは呼ぶ側（RubyText の always・SurvivalRubyText）が決める。
 */
export const FURIGANA_MODES = ['all', 'aboveGrade', 'none'];
export const DEFAULT_FURIGANA_MODE = 'all';

/** 設定からふりがなの出し方を決める。以前の showFurigana: false は「なし」として引き継ぐ */
export function getFuriganaMode(settings) {
  const mode = settings?.furiganaMode;
  if (FURIGANA_MODES.includes(mode)) return mode;
  if (settings?.showFurigana === false) return 'none';
  return DEFAULT_FURIGANA_MODE;
}

/** 学年ごとの字の文字列（['一右…', '引羽…', …]）から、字 → 学年 の表を作る */
export function buildGradeLookup(rows) {
  const lookup = new Map();
  (rows || []).forEach((row, index) => {
    for (const char of row) lookup.set(char, index + 1);
  });
  return lookup;
}

// CJK 統合漢字と「々」。かな・カナ・記号・数字はふりがなの判断に使わない
const KANJI_CHAR = /[々一-鿿㐀-䶿豈-﫿]/u;

/**
 * そのことばにふりがなを出すか。
 * @param {string} base - ふりがなを付ける文字（例: '漢字'）
 * @param {{ mode?: string, grade?: number, gradeLookup?: Map<string, number>|null }} options
 */
export function shouldShowRuby(base, { mode = DEFAULT_FURIGANA_MODE, grade = 1, gradeLookup = null } = {}) {
  if (mode === 'none') return false;
  if (mode !== 'aboveGrade') return true;
  // 学年の表がまだ読めていないときは、出しておく（読めない字を隠すほうが困る）
  if (!gradeLookup) return true;
  const current = Number(grade) || 1;
  for (const char of String(base ?? '')) {
    if (!KANJI_CHAR.test(char)) continue;
    const charGrade = gradeLookup.get(char);
    // 教育漢字に無い字（常用漢字の中学校以上の字など）は、どの学年でもまだ習っていない
    if (charGrade === undefined || charGrade > current) return true;
  }
  return false;
}
