// ==========================================
// ストローク解析（終筆判定・交差検出・字形比較）
// 入力はすべて 0-1 の正規化座標のポイント列を前提とする
// ==========================================
import { STROKE_ANALYSIS } from '../constants/gameConfig.js';
import { STROKE_THRESHOLDS } from '../constants/strokeConfig.js';

/**
 * 2Dベクトルの大きさを計算する
 * @param {{x: number, y: number}} v
 * @returns {number}
 */
function magnitude(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * 2点間の距離を計算する
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} b
 * @returns {number}
 */
function distance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 2つのベクトル間の角度(度)を計算する
 * @param {{x: number, y: number}} v1
 * @param {{x: number, y: number}} v2
 * @returns {number} 角度(度)
 */
function angleBetween(v1, v2) {
  const mag1 = magnitude(v1);
  const mag2 = magnitude(v2);
  if (mag1 === 0 || mag2 === 0) return 0;
  const dot = v1.x * v2.x + v1.y * v2.y;
  const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.acos(cosTheta) * (180 / Math.PI);
}

/**
 * 各ポイントまでの累積弧長を返す
 * @param {Array<{x: number, y: number}>} points
 * @returns {number[]} points と同じ長さ。先頭は 0。
 */
function cumulativeLengths(points) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + distance(points[i - 1], points[i]));
  }
  return cum;
}

/**
 * 2つの線分の交点をパラメータで求める
 * @param {{x: number, y: number}} p1 - 線分Aの始点
 * @param {{x: number, y: number}} p2 - 線分Aの終点
 * @param {{x: number, y: number}} p3 - 線分Bの始点
 * @param {{x: number, y: number}} p4 - 線分Bの終点
 * @returns {{t: number, u: number}|null} t,u は各線分上の位置(0-1)。交わらなければ null。
 */
function segmentIntersection(p1, p2, p3, p4) {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-12) return null; // 平行または退化
  const ox = p3.x - p1.x;
  const oy = p3.y - p1.y;
  const t = (ox * d2y - oy * d2x) / denom;
  const u = (ox * d1y - oy * d1x) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { t, u };
}

export const Analyzer = {
  /**
   * ストロークの終筆タイプを解析する
   * とめ(tome): 筆を止めて終わる
   * はね(hane): 角度をつけて跳ねる
   * はらい(harai): 速度を保って払う
   * @param {Array<{x: number, y: number, time: number}>} points - 正規化座標＋時刻
   * @returns {{ type: string, code: 'tome'|'hane'|'harai' }}
   */
  analyzeEnding: (points) => {
    if (!points || points.length < STROKE_ANALYSIS.MIN_POINTS) {
      return { type: 'とめ', code: 'tome' };
    }

    const len = points.length;
    const pEnd = points[len - 1];
    const pMid = points[Math.max(0, Math.floor(len * STROKE_ANALYSIS.ENDING_START_RATIO))];
    const pBeforeMid = points[Math.max(0, Math.floor(len * STROKE_ANALYSIS.ENDING_DIRECTION_RATIO))];

    // メイン方向ベクトル（ストローク後半の進行方向）
    const mainVec = { x: pMid.x - pBeforeMid.x, y: pMid.y - pBeforeMid.y };
    // 終筆方向ベクトル（末端の方向変化）
    const endVec = { x: pEnd.x - pMid.x, y: pEnd.y - pMid.y };
    const magEnd = magnitude(endVec);

    // 角度変化の計算（終筆が十分な長さを持つ場合のみ）
    let angleDiff = 0;
    if (magnitude(mainVec) > 0 && magEnd > STROKE_ANALYSIS.MAGNITUDE_THRESHOLD) {
      angleDiff = angleBetween(mainVec, endVec);
    }

    // 終筆の速度計算（最後の数ポイント）
    const calcEnd = Math.max(1, len - 1);
    const calcStart = Math.max(0, len - 8);
    let totalDist = 0;
    for (let i = calcStart + 1; i <= calcEnd; i++) {
      totalDist += distance(points[i], points[i - 1]);
    }
    const totalTime = points[calcEnd].time - points[calcStart].time;
    const velocity = totalTime > 0 ? totalDist / totalTime : 0;

    // 判定: はね → はらい → とめ の優先順位
    if (angleDiff > STROKE_ANALYSIS.ANGLE_DIFF_THRESHOLD && magEnd > STROKE_ANALYSIS.MAGNITUDE_THRESHOLD) {
      return { type: 'はね', code: 'hane' };
    }
    if (velocity > STROKE_ANALYSIS.VELOCITY_THRESHOLD) {
      return { type: 'はらい', code: 'harai' };
    }
    return { type: 'とめ', code: 'tome' };
  },

  /**
   * 2つのストロークの「突き抜けの深さ」を返す。
   *
   * 交差点から両ストロークの端までの距離のうち最小のものが「突き抜け量」。
   * - 「土」のように画の端どうしが接するだけ → 端までの距離が 0 に近い → 深さ ≒ 0
   * - 「牛」のように画が突き抜ける          → どちら側にも長さが残る → 深さが大きい
   *
   * 交差セグメント対の「数」で測るとペンのサンプリング密度（＝書く速さ）で
   * 結果が変わってしまうが、この深さは密度に依存しない。
   *
   * @param {Array<{x: number, y: number}>} stroke1
   * @param {Array<{x: number, y: number}>} stroke2
   * @returns {number} 突き抜けの深さ（正規化座標。交差しなければ 0）
   */
  crossingDepth: (stroke1, stroke2) => {
    if (!stroke1 || !stroke2 || stroke1.length < 2 || stroke2.length < 2) return 0;
    const cum1 = cumulativeLengths(stroke1);
    const cum2 = cumulativeLengths(stroke2);
    const len1 = cum1[cum1.length - 1];
    const len2 = cum2[cum2.length - 1];
    if (len1 === 0 || len2 === 0) return 0;

    let deepest = 0;
    for (let i = 0; i < stroke1.length - 1; i++) {
      for (let j = 0; j < stroke2.length - 1; j++) {
        const hit = segmentIntersection(stroke1[i], stroke1[i + 1], stroke2[j], stroke2[j + 1]);
        if (!hit) continue;
        const at1 = cum1[i] + hit.t * (cum1[i + 1] - cum1[i]);
        const at2 = cum2[j] + hit.u * (cum2[j + 1] - cum2[j]);
        const depth = Math.min(
          Math.min(at1, len1 - at1),
          Math.min(at2, len2 - at2),
        );
        if (depth > deepest) deepest = depth;
      }
    }
    return deepest;
  },

  /**
   * 2つのストロークが（接触ではなく）交差しているかを判定する
   * @param {Array<{x: number, y: number}>} stroke1
   * @param {Array<{x: number, y: number}>} stroke2
   * @param {number} [minDepth] - 交差とみなす最小の突き抜け深さ
   * @returns {boolean}
   */
  isCrossed: (stroke1, stroke2, minDepth = STROKE_THRESHOLDS.CROSS_DEPTH_NONE) => (
    Analyzer.crossingDepth(stroke1, stroke2) > minDepth
  ),

  /**
   * 突き抜け深さから交差の正しさ（0-1）を返す。
   *
   * CROSS_DEPTH_NONE〜CROSS_DEPTH_CLEAR の間はなだらかに変化させ、
   * 「わずかにはみ出した」程度でいきなり不正解にしない。
   *
   * @param {boolean} expectedCrossed - 正解の字で交差しているか
   * @param {number} actualDepth - ユーザーの突き抜け深さ
   * @returns {number} 0-1
   */
  crossingScore: (expectedCrossed, actualDepth) => {
    const { CROSS_DEPTH_NONE, CROSS_DEPTH_CLEAR } = STROKE_THRESHOLDS;
    const ratio = Math.max(0, Math.min(1,
      (actualDepth - CROSS_DEPTH_NONE) / (CROSS_DEPTH_CLEAR - CROSS_DEPTH_NONE),
    ));
    return expectedCrossed ? ratio : 1 - ratio;
  },

  /**
   * 交差の状態を3値で判定する（画面表示用）
   * @param {boolean} expectedCrossed
   * @param {number} actualDepth
   * @returns {'ok'|'extra'|'missing'} extra=突き抜けすぎ, missing=交わっていない
   */
  judgeCrossing: (expectedCrossed, actualDepth) => {
    if (Analyzer.crossingScore(expectedCrossed, actualDepth) >= 0.5) return 'ok';
    return expectedCrossed ? 'missing' : 'extra';
  },

  /**
   * ストロークを弧長で等間隔にリサンプリングする
   * ポイント数がペンの速さに左右されるため、比較の前に必ず揃える。
   * @param {Array<{x: number, y: number}>} points
   * @param {number} count - 出力する点数(2以上)
   * @returns {Array<{x: number, y: number}>}
   */
  resample: (points, count) => {
    const n = Math.max(2, Math.floor(count));
    if (!points || points.length === 0) return [];
    if (points.length === 1) {
      return Array.from({ length: n }, () => ({ x: points[0].x, y: points[0].y }));
    }
    const cum = cumulativeLengths(points);
    const total = cum[cum.length - 1];
    if (total === 0) {
      return Array.from({ length: n }, () => ({ x: points[0].x, y: points[0].y }));
    }
    const step = total / (n - 1);
    const out = [];
    let seg = 0;
    for (let k = 0; k < n; k++) {
      const target = Math.min(total, step * k);
      while (seg < points.length - 2 && cum[seg + 1] < target) seg++;
      const segLen = cum[seg + 1] - cum[seg];
      const ratio = segLen > 0 ? (target - cum[seg]) / segLen : 0;
      out.push({
        x: points[seg].x + (points[seg + 1].x - points[seg].x) * ratio,
        y: points[seg].y + (points[seg + 1].y - points[seg].y) * ratio,
      });
    }
    return out;
  },

  /**
   * 2つのストロークの字形のずれを返す。
   *
   * 等間隔リサンプリング後の対応点どうしの平均距離。
   * reversed は片方を逆順にしたときの値で、これが forward より明らかに
   * 小さければ「書く向きが逆」と判定できる。
   *
   * @param {Array<{x: number, y: number}>} stroke1
   * @param {Array<{x: number, y: number}>} stroke2
   * @param {number} [samples]
   * @returns {{ forward: number, reversed: number }}
   */
  shapeDistance: (stroke1, stroke2, samples = STROKE_THRESHOLDS.SHAPE_SAMPLES) => {
    const a = Analyzer.resample(stroke1, samples);
    const b = Analyzer.resample(stroke2, samples);
    if (a.length === 0 || b.length === 0 || a.length !== b.length) {
      return { forward: Infinity, reversed: Infinity };
    }
    let forward = 0;
    let reversed = 0;
    for (let i = 0; i < a.length; i++) {
      forward += distance(a[i], b[i]);
      reversed += distance(a[i], b[a.length - 1 - i]);
    }
    return { forward: forward / a.length, reversed: reversed / a.length };
  },
};
