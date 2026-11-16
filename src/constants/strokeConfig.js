// ストローク判定の共有閾値
// WriteMode（書き中）と strokeGrader（採点時）で同一の定数を使用する
// 座標はすべて 0-1 の正規化座標（字の外接枠を 1 とする）

export const STROKE_THRESHOLDS = {
  /** 始点の許容距離（基準画数のときの値） */
  START_POINT: 0.20,
  /** 終点の許容距離（基準画数のときの値） */
  END_POINT: 0.25,
  /** 画の対応づけ・書き順マッチングの許容距離 */
  CROSS_DISTANCE: 0.3,
  /** 字形（経路全体）のずれの許容距離 */
  SHAPE: 0.16,

  // ── 点画の交差判定 ──
  // 交差は「セグメントが何対交差したか」ではなく「どれだけ突き抜けたか（深さ）」で測る。
  // 対数ではペン入力のサンプリング密度に結果が左右されてしまうため。
  /** これ以下の突き抜けは「接しているだけ（交差なし）」とみなす */
  CROSS_DEPTH_NONE: 0.015,
  /** これ以上突き抜けたら「明確に交差している」とみなす */
  CROSS_DEPTH_CLEAR: 0.045,

  /** 字全体の位置ずれとして補正する最大量（これを超えるずれは減点対象として残す） */
  GLOBAL_SHIFT_MAX: 0.06,

  // ── 字全体の大きさの補正 ──
  /** 大きさをそろえるときの倍率の下限・上限（これを超える差は減点として残す） */
  SIZE_SCALE_MIN: 0.7,
  SIZE_SCALE_MAX: 1.4,
  /** お手本に対する大きさがこれ未満なら「大きく書こう」、これを超えたら「小さく書こう」と伝える */
  SIZE_SMALL: 0.8,
  SIZE_LARGE: 1.25,

  /** 字形比較のリサンプリング点数 */
  SHAPE_SAMPLES: 16,

  /**
   * 書き順の誤りと断定するために必要な、対応づけの費用差。
   * ほぼ同じ形・同じ位置の画（どちらを先に書いたか幾何的に判別できない画）では、
   * 誤りと決めつけずに正しく書けたものとして扱う。
   */
  ORDER_AMBIGUITY_MARGIN: 0.02,
};

/**
 * 毎日の学習のテストの判定（strokeGrader.js の judgeWriting）で使う値。
 *
 * 自己採点をやめ、書いた字を採点して「できた／もう1回／てきとう書き」を決める。
 * 点数だけで決めると、ていねいに書いた子でも線の交わりのわずかなずれで「もう1回」になる
 * （ゆびで書く低学年の字をまねた試算で 3〜6 割）。そこで「字として読み取れるか」を別に測り、
 * 読み取れる字は先へ進ませ、読み取れない字だけをやり直しにする。
 */
export const JUDGE = {
  /**
   * 画数・線の交わり・書き順が合っていて、これ以上の点なら「できた」。
   * 30 点（以前の「むずかしい」のおすすめの下限）のままだと、同じ画数のほかの字
   * （「土」に「工」など）を書いても 3 画の字ではよく通る。試算では、ほかの字で通るものの
   * 点は 30〜42 点に集まり、ていねいに書いた字は雑な子でも 59 点以上だった。
   */
  PASS_MIN_TOTAL: 40,
  /** 線の交わり・書き順がちがう字を「むずかしい」で通す下限（ちがう字を通しにくくするため高めにする） */
  FLAWED_PASS_MIN_TOTAL: 50,
  /** よくできた（easy）・書けた（good）の下限（recommendEvaluation と同じ） */
  EASY_MIN_TOTAL: 80,
  GOOD_MIN_TOTAL: 55,
  /** お手本の画のうち、書いた線のどれかと形・位置が合う画がこの割合以上なら「読み取れる」 */
  RECOGNIZED_COVERAGE: 0.6,
  /** 読み取れる字とみなす画数の差の上限（お手本の画数に対する割合。1画の差はいつも認める） */
  RECOGNIZED_COUNT_DIFF_RATIO: 0.3,
  /** 書いた画数の 3倍が、お手本の画数以下（＝ 1/3 以下しか書いていない。3画以上の字）→ てきとう書き */
  CARELESS_FEW_STROKES_DIVISOR: 3,
  /** お手本の画数の 2倍＋5 以上書いた → てきとう書き（線をたくさん引く） */
  CARELESS_MANY_STROKES_FACTOR: 2,
  CARELESS_MANY_STROKES_EXTRA: 5,
  /**
   * 書いた線の長さの合計が、お手本のこの割合に満たない → てきとう書き（点を打っただけ）。
   * 「池」のさんずいだけを書いた字（0.14）のような、とちゅうまで書いた字は入れない。
   */
  CARELESS_MIN_INK_RATIO: 0.1,
  /** お手本に対する大きさがこれ未満・これを超えるときは、大きさを直すよう伝える */
  SIZE_TOO_SMALL: 0.55,
  SIZE_TOO_LARGE: 1.6,
};

/** この画数までは許容距離を緩めない基準画数 */
const TOLERANCE_REFERENCE_STROKES = 6;
/** 画数が増えたときに許容距離を縮める下限比率 */
const TOLERANCE_MIN_SCALE = 0.42;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * 画数に応じた許容距離を返す。
 *
 * 画数が多い漢字ほど1画あたりの間隔が狭くなるため、固定閾値のままだと
 * 「隣の画の始点」まで正解圏に入ってしまい判定が事実上機能しなくなる。
 * 基準画数（6画）までは従来値、それ以上は 1/√画数 で縮める。
 *
 * @param {number} strokeCount - 正解の画数
 * @returns {{ start: number, end: number, match: number, shape: number }}
 */
export function getStrokeTolerances(strokeCount) {
  const n = Math.max(1, Number(strokeCount) || 1);
  const scale = clamp(Math.sqrt(TOLERANCE_REFERENCE_STROKES / n), TOLERANCE_MIN_SCALE, 1);
  return {
    start: STROKE_THRESHOLDS.START_POINT * scale,
    end: STROKE_THRESHOLDS.END_POINT * scale,
    match: STROKE_THRESHOLDS.CROSS_DISTANCE * scale,
    shape: STROKE_THRESHOLDS.SHAPE * scale,
  };
}

/**
 * なぞり書き中の「書きはじめ」ゲート用の許容距離。
 * 採点時より少し甘くして、低学年が書き出せずに詰まるのを防ぐ。
 * @param {number} strokeCount
 * @returns {{ start: number, end: number }}
 */
export function getGuideTolerances(strokeCount) {
  const { start, end } = getStrokeTolerances(strokeCount);
  return {
    start: Math.max(start * 1.3, 0.12),
    end: Math.max(end * 1.3, 0.15),
  };
}
