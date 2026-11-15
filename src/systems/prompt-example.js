/**
 * 書き取りの出題に使う例文を選ぶ。
 *
 * 読みの並び（「カン」）だけでは、漢・感・完・官・刊 のどれを書くのか決まらない字が
 * 68 字ある。教室の漢字テストと同じように、例文の中の対象字を◯にして
 * （SurvivalRubyText）書かせると、答えが1つに決まる。
 */

const RUBY_SEGMENT = /([^\s（）]+?)（([^）]+)）/g;

/** 例文の中で、対象字にルビが付いているか（◯にしたときに読みが分かるか） */
export function hasRubyOnTarget(example, targetChar) {
  if (typeof example !== 'string' || !targetChar) return false;
  for (const [, base] of example.matchAll(RUBY_SEGMENT)) {
    if (base.includes(targetChar)) return true;
  }
  return false;
}

/**
 * 出題に使う例文を返す。対象字にルビの付いた例文を優先し、無ければ対象字を含む例文、
 * それも無ければ null（呼び出し側は読みの並びの出題に戻す）。
 * @param {{char: string, examples?: string[]}} kanji
 * @param {number} [variant] - 何番目の候補を使うか。同じ字を続けて出すときに例文を変える
 * @returns {string|null}
 */
export function pickPromptExample(kanji, variant = 0) {
  const examples = Array.isArray(kanji?.examples) ? kanji.examples : [];
  const withTarget = examples.filter((example) => typeof example === 'string' && example.includes(kanji.char));
  const withRuby = withTarget.filter((example) => hasRubyOnTarget(example, kanji.char));
  const candidates = withRuby.length > 0 ? withRuby : withTarget;
  if (candidates.length === 0) return null;
  const index = Math.abs(Math.floor(Number(variant) || 0)) % candidates.length;
  return candidates[index];
}
