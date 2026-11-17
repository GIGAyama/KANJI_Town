// 授業モードの進み方 — マイ漢字タウン
// 電子黒板に 字を 1 字ずつ大きく映し、書き順を「自動で」か「1 画ずつ」見せる（空書きの かけ声に合わせる）。
// ここは 進み方の計算だけを置く（画面は components/lesson/LessonMode.jsx）。React・DOM に依存しない。
//
// 状態:
//   index   … いま映している字（何番めか。0 はじまり）
//   stroke  … いま見せている画の数。-1 は「字ぜんたいを見せている」（はじめ・書きおえたあと）
//   playing … 自動で 1 画ずつ書いている途中か
//   hidden  … 字を かくしているか（書けるかを たしかめるとき）

/** 自動で書くときの、1 画あたりの時間（ミリ秒。線を引く動き ＋ 次の画までの間） */
export const AUTO_STROKE_MS = 950;
/** そのうち、線を引く動きの長さ（秒） */
export const DRAW_SECONDS = 0.6;

export const createLesson = () => ({ index: 0, stroke: -1, playing: false, hidden: false });

const clampIndex = (index, count) => Math.min(Math.max(0, index), Math.max(0, count - 1));

/**
 * 操作 1 つで、次の状態にする。
 * @param {ReturnType<typeof createLesson>} state
 * @param {{ type: string, index?: number }} action
 *   'next' / 'prev' / 'goto'（index）… 字を うつる（書き順・かくす は はじめに もどる）
 *   'step'      … 次の 1 画（字ぜんたいを見せているときは 1 画めから。さいごの画の次は 字ぜんたい）
 *   'back'      … 1 画 もどる
 *   'restart'   … 何も書いていない所から（1 画ずつ書く じゅんび）
 *   'play'      … 自動で 1 画めから書く    'pause' … 自動を止める
 *   'tick'      … 自動の 1 こま（次の 1 画。書きおえたら止まる）
 *   'showAll'   … 字ぜんたいを見せる
 *   'toggleHidden' … 字を かくす・見せる
 * @param {{ count: number, strokes: number }} context count: 字の数  strokes: いまの字の画数（まだ読めていなければ 0）
 */
export function lessonReducer(state, action, { count = 0, strokes = 0 } = {}) {
  const move = (index) => ({ index: clampIndex(index, count), stroke: -1, playing: false, hidden: false });
  switch (action.type) {
    case 'next': return state.index >= count - 1 ? state : move(state.index + 1);
    case 'prev': return state.index <= 0 ? state : move(state.index - 1);
    case 'goto': return move(Number.isFinite(action.index) ? action.index : state.index);
    case 'step': {
      if (strokes <= 0) return state;
      if (state.stroke < 0) return { ...state, stroke: 1, playing: false, hidden: false };
      if (state.stroke >= strokes) return { ...state, stroke: -1, playing: false };
      return { ...state, stroke: state.stroke + 1, playing: false, hidden: false };
    }
    case 'back': {
      if (strokes <= 0) return state;
      if (state.stroke < 0) return { ...state, stroke: strokes - 1, playing: false, hidden: false };
      return { ...state, stroke: Math.max(0, state.stroke - 1), playing: false };
    }
    case 'restart': return strokes <= 0 ? state : { ...state, stroke: 0, playing: false, hidden: false };
    case 'play': return strokes <= 0 ? state : { ...state, stroke: 0, playing: true, hidden: false };
    case 'pause': return { ...state, playing: false };
    case 'tick': {
      if (!state.playing || strokes <= 0) return state;
      const stroke = Math.min(strokes, Math.max(0, state.stroke) + 1);
      return { ...state, stroke, playing: stroke < strokes };
    }
    case 'showAll': return { ...state, stroke: -1, playing: false };
    case 'toggleHidden': return { ...state, hidden: !state.hidden, stroke: -1, playing: false };
    default: return state;
  }
}

/**
 * キーボード・クリッカー（プレゼン用リモコン）の キーを 操作にする。知らないキーは null。
 *   → / PageDown: 次の字   ← / PageUp: 前の字   スペース・Enter: 次の 1 画
 *   ↑: 1 画 もどる   ↓: 次の 1 画   Home: はじめの字   End: さいごの字
 */
export function lessonKeyAction(key, { count = 0 } = {}) {
  switch (key) {
    case 'ArrowRight': case 'PageDown': return { type: 'next' };
    case 'ArrowLeft': case 'PageUp': return { type: 'prev' };
    case ' ': case 'Spacebar': case 'Enter': case 'ArrowDown': return { type: 'step' };
    case 'ArrowUp': return { type: 'back' };
    case 'Home': return { type: 'goto', index: 0 };
    case 'End': return { type: 'goto', index: Math.max(0, count - 1) };
    default: return null;
  }
}

/** 画の見え方。'done': 書きおえた画  'now': いま書いた画  'guide': これから書く画（うすい お手本） */
export function strokeLook(strokeIndex, stroke) {
  if (stroke < 0) return 'done';
  if (strokeIndex < stroke - 1) return 'done';
  if (strokeIndex === stroke - 1) return 'now';
  return 'guide';
}
