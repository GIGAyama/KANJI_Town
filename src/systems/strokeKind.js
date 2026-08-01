// ==========================================
// KanjiVG の kvg:type（CJK Strokes）から
// 終筆処理「とめ・はね・はらい」の正解を導く
// ==========================================
//
// KanjiVG の各 <path> は `kvg:type` に CJK Strokes ブロック(U+31C0–U+31E3)の
// 文字で筆画の種類を持つ（例: 横画 "㇐"、竖钩 "㇚"、撇 "㇒"）。
// 筆画の種類が決まれば終筆の処理も決まるので、この対応表で正解を引く。
//
// 教育上の注意:
// 文部科学省「常用漢字表の字体・字形に関する指針」では、はねるか否かなど
// 終筆の細部に幅を認めている字が多い。そのため終筆は「減点の主役」にはせず、
// 助言として返し、配点も控えめ・不一致でも部分点を与える設計にしている。

/** 終筆タイプ */
export const ENDING_TYPES = {
  TOME: 'tome',
  HANE: 'hane',
  HARAI: 'harai',
};

export const ENDING_LABELS = {
  tome: 'とめ',
  hane: 'はね',
  harai: 'はらい',
};

const { TOME, HANE, HARAI } = ENDING_TYPES;

/**
 * CJK Strokes 1文字 → 終筆タイプ。
 * 「钩(こう)」「提(てい)」で終わる筆画＝はね、
 * 「撇(へつ)」「捺(な)」で終わる筆画＝はらい、それ以外＝とめ。
 */
const ENDING_BY_STROKE_CHAR = {
  '㇀': HANE,   // ㇀ 提
  '㇁': HANE,   // ㇁ 弯钩
  '㇂': HANE,   // ㇂ 斜钩
  '㇃': HANE,   // ㇃ 扁斜钩
  '㇄': TOME,   // ㇄ 竖弯
  '㇅': TOME,   // ㇅ 横折折
  '㇆': HANE,   // ㇆ 横折钩
  '㇇': HARAI,  // ㇇ 横撇
  '㇈': HANE,   // ㇈ 横折弯钩
  '㇉': HANE,   // ㇉ 竖折弯钩
  '㇊': HANE,   // ㇊ 横折提
  '㇋': HARAI,  // ㇋ 横折折撇
  '㇌': HANE,   // ㇌ 横撇弯钩
  '㇍': TOME,   // ㇍ 横折弯
  '㇎': TOME,   // ㇎ 横折折折
  '㇏': HARAI,  // ㇏ 捺
  '㇐': TOME,   // ㇐ 横
  '㇑': TOME,   // ㇑ 竖
  '㇒': HARAI,  // ㇒ 撇
  '㇓': HARAI,  // ㇓ 竖撇
  '㇔': TOME,   // ㇔ 点
  '㇕': TOME,   // ㇕ 横折
  '㇖': HANE,   // ㇖ 横钩
  '㇗': TOME,   // ㇗ 竖折
  '㇘': TOME,   // ㇘ 竖弯折
  '㇙': HANE,   // ㇙ 竖提
  '㇚': HANE,   // ㇚ 竖钩
  '㇛': TOME,   // ㇛ 撇点
  '㇜': TOME,   // ㇜ 撇折
  '㇝': HARAI,  // ㇝ 提捺
  '㇞': TOME,   // ㇞ 竖折折
  '㇟': HANE,   // ㇟ 竖弯钩
  '㇠': HANE,   // ㇠ 横斜弯钩
  '㇡': HANE,   // ㇡ 横折折折钩
  '㇢': HANE,   // ㇢ 撇钩
  '㇣': TOME,   // ㇣ 圈
};

/**
 * kvg:type 文字列から終筆タイプを判定する。
 * "㇐a" のような形状バリエーション接尾辞や "㇒/㇖" のような併記は
 * 先頭の CJK Strokes 文字を筆画の本体として採用する。
 *
 * @param {string|null|undefined} kvgType
 * @returns {'tome'|'hane'|'harai'|null} 判定できないときは null（減点に使わない）
 */
export function endingTypeFromKvgType(kvgType) {
  if (typeof kvgType !== 'string') return null;
  for (const char of kvgType) {
    const ending = ENDING_BY_STROKE_CHAR[char];
    if (ending) return ending;
  }
  return null;
}

/**
 * 終筆どうしの近さ。とめ↔はねは字によって許容されるため強く減点しない。
 * キーは組を並べ替えて作るので、辞書順で登録する。
 */
const ENDING_SIMILARITY = {
  [[TOME, HANE].sort().join('|')]: 0.5,
  [[TOME, HARAI].sort().join('|')]: 0.2,
  [[HANE, HARAI].sort().join('|')]: 0.2,
};

/**
 * 期待される終筆と実際の終筆の一致度（0-1）を返す。
 * @param {'tome'|'hane'|'harai'|null} expected
 * @param {'tome'|'hane'|'harai'|null} actual
 * @returns {number|null} 期待値が不明なら null（採点対象外）
 */
export function endingSimilarity(expected, actual) {
  if (!expected || !actual) return null;
  if (expected === actual) return 1;
  const key = [expected, actual].sort().join('|');
  return ENDING_SIMILARITY[key] ?? 0;
}

/** 「◯◯ ところだよ」に続けられる終筆の動詞 */
const ENDING_VERBS = {
  [TOME]: 'とめる',
  [HANE]: 'はねる',
  [HARAI]: 'はらう',
};

/**
 * 期待される終筆の指示語（「とめる」「はねる」「はらう」）を返す
 * @param {'tome'|'hane'|'harai'|null} expected
 * @returns {string|null}
 */
export function endingVerb(expected) {
  return ENDING_VERBS[expected] ?? null;
}

/**
 * なぞり書き中に出す終筆フィードバックを組み立てる。
 * 正解が不明なときは「褒める」ことをせず、書けた事実だけを中立に返す。
 *
 * @param {'tome'|'hane'|'harai'|null} expected
 * @param {'tome'|'hane'|'harai'|null} actual
 * @returns {{ text: string, ok: boolean }}
 */
export function describeEndingFeedback(expected, actual) {
  const actualLabel = ENDING_LABELS[actual] ?? 'とめ';
  if (!expected) return { text: `${actualLabel}で かけたね`, ok: true };
  if (expected === actual) {
    const praise = {
      tome: 'しっかり トメたね！✨',
      hane: 'きれいな ハネ！✨',
      harai: 'きれいな ハライ！✨',
    };
    return { text: praise[expected], ok: true };
  }
  return { text: `ここは ${ENDING_VERBS[expected]} ところだよ`, ok: false };
}
