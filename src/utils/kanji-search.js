/**
 * 図鑑の検索。React に依存しない純粋な関数。
 *
 * 音読みはカタカナ（イチ）、訓読みは送りがなを ( ) や - で区切って（ひと(つ)・ひと-）
 * 持っている。Chromebook の IME ではふつうひらがなで打つので、以前の
 * 「音読みに toUpperCase をかけて比べる」だけでは「いち」「さん」「ひとつ」「まなぶ」が
 * 見つからなかった。入力も読みも「ひらがな・記号なし」にそろえてから比べる。
 */

/** カタカナ → ひらがな（ー などはそのまま） */
export function toHiragana(text) {
  return String(text ?? '').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/** 読みの区切り記号と空白を取りのぞく（ひと(つ) → ひとつ、ひと- → ひと） */
export function stripReadingMarks(text) {
  return String(text ?? '').replace(/[()（）.．\-－‐・\s　]/g, '');
}

/** 読みを比べられる形にする */
export function normalizeReading(text) {
  return toHiragana(stripReadingMarks(text));
}

/**
 * その字が検索に当てはまるか。
 * @param {{ char: string, on?: string[], kun?: string[] }} kanji
 * @param {string} query - 入力（字・ひらがな・カタカナ）
 */
export function matchesKanjiQuery(kanji, query) {
  const q = String(query ?? '').trim();
  if (!q) return true;
  if (kanji.char && q.includes(kanji.char)) return true;
  const reading = normalizeReading(q);
  if (!reading) return false;
  return [...(kanji.on || []), ...(kanji.kun || [])].some((r) => normalizeReading(r).includes(reading));
}

/** 学年（0 はすべて）と入力で、字の一覧をしぼる */
export function filterKanji(list, { query = '', grade = 0 } = {}) {
  return list.filter((k) => (grade === 0 || k.grade === grade) && matchesKanjiQuery(k, query));
}
