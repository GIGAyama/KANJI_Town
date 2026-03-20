// ボスバトル用 客観的ストローク採点エンジン
// 画数・始点・終点・書き順を100点満点で採点
import { STROKE_THRESHOLDS } from '../constants/strokeConfig';

/**
 * ユーザーのストロークを正解データと比較して採点する
 * @param {Array} userStrokes - ユーザーが書いたストローク配列 [{x, y, time}, ...]
 * @param {Array} strokeData - 正解のストロークデータ [{s: {x,y}, e: {x,y}, points: [...]}]
 * @param {number} canvasSize - キャンバスサイズ（座標正規化用）
 * @returns {{ total: number, strokeCount: number, startPoints: number, endPoints: number, order: number, strokeCountMatch: boolean, details: string[] }}
 */
export function gradeStrokes(userStrokes, strokeData, canvasSize) {
  const details = [];
  const expectedCount = strokeData.length;
  const actualCount = userStrokes.length;

  // --- 画数チェック（20点）---
  // 画数が違う場合は0点（一撃アウト）
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

  let strokeCountScore = 20;
  details.push(`画数：${expectedCount}画 ✓`);

  // --- 各画の始点精度（30点）---
  let startTotal = 0;
  for (let i = 0; i < expectedCount; i++) {
    const userStroke = userStrokes[i];
    if (!userStroke || userStroke.length === 0) continue;
    const userStart = { x: userStroke[0].x / canvasSize, y: userStroke[0].y / canvasSize };
    const targetStart = strokeData[i].s;
    const dist = Math.hypot(userStart.x - targetStart.x, userStart.y - targetStart.y);
    // dist 0 → 1.0, dist 0.2+ → 0
    const score = Math.max(0, 1 - dist / STROKE_THRESHOLDS.START_POINT);
    startTotal += score;
  }
  const startScore = Math.round((startTotal / expectedCount) * 30);
  if (startScore >= 25) details.push('始点：正確！');
  else if (startScore >= 15) details.push('始点：おしい…');
  else details.push('始点：ずれている');

  // --- 各画の終点精度（30点）---
  let endTotal = 0;
  for (let i = 0; i < expectedCount; i++) {
    const userStroke = userStrokes[i];
    if (!userStroke || userStroke.length === 0) continue;
    const lastPt = userStroke[userStroke.length - 1];
    const userEnd = { x: lastPt.x / canvasSize, y: lastPt.y / canvasSize };
    const targetEnd = strokeData[i].e;
    const dist = Math.hypot(userEnd.x - targetEnd.x, userEnd.y - targetEnd.y);
    const score = Math.max(0, 1 - dist / STROKE_THRESHOLDS.END_POINT);
    endTotal += score;
  }
  const endScore = Math.round((endTotal / expectedCount) * 30);
  if (endScore >= 25) details.push('終点：正確！');
  else if (endScore >= 15) details.push('終点：おしい…');
  else details.push('終点：ずれている');

  // --- 書き順の正確さ（20点）---
  // 各ストロークの始点が、正解の書き順と一致しているかをチェック
  // ストロークiのユーザー始点が、正解ストロークjの始点に最も近い → j === i なら正解
  let orderCorrect = 0;
  const usedTargets = new Set();
  const matchMap = new Array(expectedCount).fill(-1);

  // まず各ユーザーストロークを最も近い正解ストロークにマッチ
  for (let i = 0; i < expectedCount; i++) {
    const userStroke = userStrokes[i];
    if (!userStroke || userStroke.length === 0) continue;
    const userStart = { x: userStroke[0].x / canvasSize, y: userStroke[0].y / canvasSize };
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let j = 0; j < expectedCount; j++) {
      if (usedTargets.has(j)) continue;
      const d = Math.hypot(userStart.x - strokeData[j].s.x, userStart.y - strokeData[j].s.y);
      if (d < bestDist) { bestDist = d; bestIdx = j; }
    }
    if (bestIdx >= 0 && bestDist < STROKE_THRESHOLDS.CROSS_DISTANCE) {
      usedTargets.add(bestIdx);
      matchMap[i] = bestIdx;
      if (bestIdx === i) orderCorrect++;
    }
  }
  const orderScore = Math.round((orderCorrect / expectedCount) * 20);
  if (orderScore >= 16) details.push('書き順：正しい！');
  else if (orderScore >= 10) details.push('書き順：一部まちがい');
  else details.push('書き順：まちがっている');

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
