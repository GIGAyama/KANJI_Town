// ==========================================
// ストローク解析（終筆判定・交差検出）
// ==========================================
import { STROKE_ANALYSIS } from '../constants/gameConfig';

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

export const Analyzer = {
  /**
   * ストロークの終筆タイプを解析する
   * とめ(tome): 筆を止めて終わる
   * はね(hane): 角度をつけて跳ねる
   * はらい(harai): 速度を保って払う
   * @param {Array<{x: number, y: number, time: number}>} points - ストロークのポイント群
   * @returns {{ type: string, code: string }}
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
   * 2つの線分(p1-p2, p3-p4)が交差するかどうかを判定する
   * アルゴリズム: 外積の符号による交差判定
   * @param {{x: number, y: number}} p1
   * @param {{x: number, y: number}} p2
   * @param {{x: number, y: number}} p3
   * @param {{x: number, y: number}} p4
   * @returns {boolean}
   */
  isIntersecting: (p1, p2, p3, p4) => {
    // 線分p1-p2から見たp3,p4の外積（異なる側にあれば交差の可能性）
    const crossA = (p3.x - p4.x) * (p1.y - p3.y) + (p3.y - p4.y) * (p3.x - p1.x);
    const crossB = (p3.x - p4.x) * (p2.y - p3.y) + (p3.y - p4.y) * (p3.x - p2.x);
    // 線分p3-p4から見たp1,p2の外積
    const crossC = (p1.x - p2.x) * (p3.y - p1.y) + (p1.y - p2.y) * (p1.x - p3.x);
    const crossD = (p1.x - p2.x) * (p4.y - p1.y) + (p1.y - p2.y) * (p1.x - p4.x);
    // 両方の組で異なる符号 → 交差
    return crossC * crossD < 0 && crossA * crossB < 0;
  },

  /**
   * 2つのストロークが交差するかどうかをチェックする
   * @param {Array<{x: number, y: number}>} stroke1
   * @param {Array<{x: number, y: number}>} stroke2
   * @returns {boolean}
   */
  checkCross: (stroke1, stroke2) => {
    if (!stroke1 || !stroke2 || stroke1.length < 2 || stroke2.length < 2) {
      return false;
    }
    for (let i = 0; i < stroke1.length - 1; i++) {
      for (let j = 0; j < stroke2.length - 1; j++) {
        if (Analyzer.isIntersecting(stroke1[i], stroke1[i + 1], stroke2[j], stroke2[j + 1])) {
          return true;
        }
      }
    }
    return false;
  },

  /**
   * 2つのストローク間の交差セグメント対の数を返す
   * checkCross が真偽だけを返すのに対し、こちらは交差の「程度」を測定する。
   * わずかなドット単位の接触（1-2対）と明確な突き抜け（多数対）を区別するために使う。
   * @param {Array<{x: number, y: number}>} stroke1
   * @param {Array<{x: number, y: number}>} stroke2
   * @returns {number} 交差しているセグメント対の数
   */
  countCrossings: (stroke1, stroke2) => {
    if (!stroke1 || !stroke2 || stroke1.length < 2 || stroke2.length < 2) {
      return 0;
    }
    let count = 0;
    for (let i = 0; i < stroke1.length - 1; i++) {
      for (let j = 0; j < stroke2.length - 1; j++) {
        if (Analyzer.isIntersecting(stroke1[i], stroke1[i + 1], stroke2[j], stroke2[j + 1])) {
          count++;
        }
      }
    }
    return count;
  },
};
