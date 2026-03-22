// ==========================================
// ストローク採点エンジン（ボスバトル・テスト用）
// 画数・始点・終点・書き順を100点満点で客観的に採点
// ==========================================
import { STROKE_THRESHOLDS } from '../constants/strokeConfig';
import { GRADING } from '../constants/gameConfig';

const { WEIGHTS } = GRADING;

/**
 * ユーザーの手書きポイントを正規化する（キャンバス座標 → 0-1正規化座標）
 * @param {{x: number, y: number}} point
 * @param {number} canvasSize
 * @returns {{x: number, y: number}}
 */
function normalizePoint(point, canvasSize) {
  return { x: point.x / canvasSize, y: point.y / canvasSize };
}

/**
 * ストロークの最初のポイントを正規化して取得する
 * @param {Array<{x: number, y: number}>} stroke
 * @param {number} canvasSize
 * @returns {{x: number, y: number}|null}
 */
function getStrokeStart(stroke, canvasSize) {
  if (!stroke || stroke.length === 0) return null;
  return normalizePoint(stroke[0], canvasSize);
}

/**
 * ストロークの最後のポイントを正規化して取得する
 * @param {Array<{x: number, y: number}>} stroke
 * @param {number} canvasSize
 * @returns {{x: number, y: number}|null}
 */
function getStrokeEnd(stroke, canvasSize) {
  if (!stroke || stroke.length === 0) return null;
  return normalizePoint(stroke[stroke.length - 1], canvasSize);
}

/**
 * 2点間の距離スコアを計算する（0-1、1が完璧）
 * @param {{x: number, y: number}} userPoint
 * @param {{x: number, y: number}} targetPoint
 * @param {number} threshold - 許容距離
 * @returns {number} 0-1
 */
function distanceScore(userPoint, targetPoint, threshold) {
  const dist = Math.hypot(userPoint.x - targetPoint.x, userPoint.y - targetPoint.y);
  return Math.max(0, 1 - dist / threshold);
}

/**
 * 精度スコアに基づくフィードバックメッセージを生成する
 * @param {string} label - 項目名（始点、終点など）
 * @param {number} score - 獲得点
 * @param {number} maxScore - 満点
 * @returns {string}
 */
function getAccuracyFeedback(label, score, maxScore) {
  const ratio = score / maxScore;
  if (ratio >= 0.83) return `${label}：正確！`;
  if (ratio >= 0.50) return `${label}：おしい…`;
  return `${label}：ずれている`;
}

/**
 * ユーザーのストロークを正解データと比較して採点する
 *
 * 採点基準（合計100点）:
 * - 画数の一致:  20点（不一致は即0点）
 * - 始点の精度:  30点
 * - 終点の精度:  30点
 * - 書き順:      20点
 *
 * @param {Array<Array<{x: number, y: number, time: number}>>} userStrokes
 * @param {Array<{s: {x: number, y: number}, e: {x: number, y: number}, points: Array}>} strokeData
 * @param {number} canvasSize
 * @returns {{ total: number, strokeCount: number, startPoints: number, endPoints: number, order: number, strokeCountMatch: boolean, details: string[] }}
 */
export function gradeStrokes(userStrokes, strokeData, canvasSize) {
  const details = [];
  const expectedCount = strokeData.length;
  const actualCount = userStrokes.length;

  // ── 画数チェック ──
  if (actualCount !== expectedCount) {
    details.push(`画数が違う！（${actualCount}画 → 正解は${expectedCount}画）`);
    return {
      total: 0,
      strokeCount: 0,
      startPoints: 0,
      endPoints: 0,
      order: 0,
      strokeCountMatch: false,
      details,
    };
  }

  const strokeCountScore = WEIGHTS.STROKE_COUNT;
  details.push(`画数：${expectedCount}画 ✓`);

  // ── 始点精度 ──
  let startTotal = 0;
  for (let i = 0; i < expectedCount; i++) {
    const userStart = getStrokeStart(userStrokes[i], canvasSize);
    if (!userStart) continue;
    startTotal += distanceScore(userStart, strokeData[i].s, STROKE_THRESHOLDS.START_POINT);
  }
  const startScore = Math.round((startTotal / expectedCount) * WEIGHTS.START_ACCURACY);
  details.push(getAccuracyFeedback('始点', startScore, WEIGHTS.START_ACCURACY));

  // ── 終点精度 ──
  let endTotal = 0;
  for (let i = 0; i < expectedCount; i++) {
    const userEnd = getStrokeEnd(userStrokes[i], canvasSize);
    if (!userEnd) continue;
    endTotal += distanceScore(userEnd, strokeData[i].e, STROKE_THRESHOLDS.END_POINT);
  }
  const endScore = Math.round((endTotal / expectedCount) * WEIGHTS.END_ACCURACY);
  details.push(getAccuracyFeedback('終点', endScore, WEIGHTS.END_ACCURACY));

  // ── 書き順の正確さ ──
  // 各ストロークの始点を最も近い正解ストロークにマッチングし、
  // マッチ順序が正解と一致しているかを判定する
  let orderCorrect = 0;
  const usedTargets = new Set();

  for (let i = 0; i < expectedCount; i++) {
    const userStart = getStrokeStart(userStrokes[i], canvasSize);
    if (!userStart) continue;

    let bestIdx = -1;
    let bestDist = Infinity;
    for (let j = 0; j < expectedCount; j++) {
      if (usedTargets.has(j)) continue;
      const d = Math.hypot(userStart.x - strokeData[j].s.x, userStart.y - strokeData[j].s.y);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = j;
      }
    }
    if (bestIdx >= 0 && bestDist < STROKE_THRESHOLDS.CROSS_DISTANCE) {
      usedTargets.add(bestIdx);
      if (bestIdx === i) orderCorrect++;
    }
  }

  const orderScore = Math.round((orderCorrect / expectedCount) * WEIGHTS.CROSS_ACCURACY);
  details.push(getAccuracyFeedback('書き順', orderScore, WEIGHTS.CROSS_ACCURACY));

  const total = strokeCountScore + startScore + endScore + orderScore;

  return {
    total,
    strokeCount: strokeCountScore,
    startPoints: startScore,
    endPoints: endScore,
    order: orderScore,
    strokeCountMatch: true,
    details,
  };
}

/**
 * 合計スコアから評価ラベルを取得する
 * @param {number} total - 合計スコア(0-100)
 * @returns {{ label: string, grade: string }}
 */
export function getGradeLabel(total) {
  const found = GRADING.LABELS.find(l => total >= l.min);
  return found || GRADING.LABELS[GRADING.LABELS.length - 1];
}
