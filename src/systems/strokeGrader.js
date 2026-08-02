// ==========================================
// ストローク採点エンジン（テスト・ボスバトル・サバイバル・ドリル共通）
// 画数・字形・書き順・とめはね・点画の交差を100点満点で採点する
// ==========================================
//
// 設計方針
// 1. 「何を書いたか」と「どの順で書いたか」を分けて評価する。
//    まず各画を正解の画へ最適に対応づけ（割り当て問題として最適解を求める）、
//    字形・始点・終点・終筆はその対応づけ先と比べ、書き順は対応づけの
//    並び順そのもので評価する。これにより「形はきれいだが書き順が違う」を
//    正しく切り分けて指導できる。
// 2. 交差は「突き抜けの深さ」で測る。セグメント交差の本数はペンの
//    サンプリング密度（＝書く速さ）に左右されて安定しない。
// 3. 終筆（とめ・はね・はらい）は字体の許容幅が広いので、
//    配点を控えめにし、不一致でも部分点を残す。
//
import { STROKE_THRESHOLDS, getStrokeTolerances } from '../constants/strokeConfig.js';
import { GRADING } from '../constants/gameConfig.js';
import { Analyzer } from './analyzer.js';
import { endingSimilarity, endingVerb } from './strokeKind.js';

const { WEIGHTS } = GRADING;

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const distanceOf = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** 距離を 0-1 のスコアへ（0で満点、threshold で 0点） */
const distanceScore = (dist, threshold) => clamp01(1 - dist / threshold);

/**
 * 採点不能・不合格時の空の結果を作る
 * @param {string[]} details
 * @param {{ strokeCountMatch?: boolean, crossMatch?: boolean }} flags
 * @returns {object}
 */
function emptyResult(details, flags = {}) {
  return {
    total: 0,
    strokeCount: 0,
    shape: 0,
    order: 0,
    ending: 0,
    cross: 0,
    startPoints: 0,
    endPoints: 0,
    strokeCountMatch: flags.strokeCountMatch ?? false,
    crossMatch: flags.crossMatch ?? false,
    orderMatch: false,
    assignment: [],
    strokeFeedback: [],
    breakdown: [],
    details,
  };
}

/**
 * ポイント群の外接枠の中心を返す（サンプリング密度に影響されない基準点）
 * @param {Array<Array<{x: number, y: number}>>} strokes
 * @returns {{x: number, y: number}|null}
 */
function boundsCenter(strokes) {
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const stroke of strokes) {
    for (const p of stroke) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  if (minX === Infinity) return null;
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

/**
 * 割り当て問題（ハンガリー法 / O(n^3)）を解く。
 *
 * 貪欲法だと「三」「川」のように似た画が並ぶ字で対応づけを取り違え、
 * 正しく書いていても書き順が誤判定される。全体最適を取る必要がある。
 *
 * @param {number[][]} cost - cost[i][j] = ユーザーi画目を正解j画目に当てる費用
 * @returns {number[]} assignment[i] = 対応する正解の画index
 */
function solveAssignment(cost) {
  const n = cost.length;
  if (n === 0) return [];
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);
  const way = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity);
    const used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; }
        else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }

  const assignment = new Array(n).fill(-1);
  for (let j = 1; j <= n; j++) assignment[p[j] - 1] = j - 1;
  return assignment;
}

/**
 * 字形スコアの言い回し
 * @param {number} ratio - 0-1
 * @returns {string}
 */
function shapeComment(ratio) {
  if (ratio >= 0.85) return '字の形：とてもきれい ✓';
  if (ratio >= 0.6) return '字の形：いいかんじ！';
  if (ratio >= 0.35) return '字の形：もうすこし ていねいに';
  return '字の形：おてほんを よく見よう';
}

/**
 * ユーザーのストロークを正解データと比較して採点する
 *
 * 採点基準（合計100点。評価できない項目は他項目へ按分）:
 * - 画数の一致: 不一致なら 0点（別の字になってしまうため）
 * - 字形:       30点
 * - 書き順:     25点
 * - とめはね:   15点
 * - 点画の交差: 10点
 * - 始点:       10点
 * - 終点:       10点
 *
 * @param {Array<Array<{x: number, y: number, time: number}>>} userStrokes - キャンバス座標
 * @param {Array<{s: {x, y}, e: {x, y}, points: Array, endingType?: string|null}>} strokeData - 正規化済み正解
 * @param {number} canvasSize
 * @returns {object} 採点結果
 */
export function gradeStrokes(userStrokes, strokeData, canvasSize) {
  const details = [];
  const expected = Array.isArray(strokeData) ? strokeData : [];
  const expectedCount = expected.length;
  const actualCount = Array.isArray(userStrokes) ? userStrokes.length : 0;

  if (expectedCount === 0) {
    return emptyResult(['おてほんを よみこめませんでした']);
  }

  // ── 画数チェック ──
  if (actualCount !== expectedCount) {
    const diff = actualCount - expectedCount;
    details.push(`画数が違う！（${actualCount}画 → 正解は${expectedCount}画）`);
    details.push(diff > 0 ? `${diff}画 おおいよ` : `${-diff}画 たりないよ`);
    return emptyResult(details, { strokeCountMatch: false });
  }
  details.push(`画数：${expectedCount}画 ✓`);

  const tolerances = getStrokeTolerances(expectedCount);

  // ── 正規化と字全体の位置ずれ補正 ──
  // 字全体が少しずれただけで全画が減点されるのを防ぐ。
  // ただし補正量には上限を設け、大きなずれは減点として残す。
  const scaled = userStrokes.map(stroke => (stroke ?? []).map(p => ({
    x: p.x / canvasSize,
    y: p.y / canvasSize,
    time: p.time,
  })));
  const userCenter = boundsCenter(scaled);
  const expectedCenter = boundsCenter(expected.map(s => s.points));
  let shiftX = 0;
  let shiftY = 0;
  if (userCenter && expectedCenter) {
    const dx = expectedCenter.x - userCenter.x;
    const dy = expectedCenter.y - userCenter.y;
    const dist = Math.hypot(dx, dy);
    const limit = STROKE_THRESHOLDS.GLOBAL_SHIFT_MAX;
    const factor = dist > limit ? limit / dist : 1;
    shiftX = dx * factor;
    shiftY = dy * factor;
  }
  const user = scaled.map(stroke => stroke.map(p => ({
    x: p.x + shiftX,
    y: p.y + shiftY,
    time: p.time,
  })));

  // ── 画の対応づけ（どの画を書いたのか）──
  const cost = user.map(stroke => expected.map(target => {
    if (stroke.length === 0) return 10;
    const shape = Analyzer.shapeDistance(stroke, target.points);
    const shapeDist = Math.min(shape.forward, shape.reversed);
    const startDist = distanceOf(stroke[0], target.s);
    const endDist = distanceOf(stroke[stroke.length - 1], target.e);
    return shapeDist * 0.6 + startDist * 0.2 + endDist * 0.2;
  }));
  const assignment = solveAssignment(cost);

  // ── 画ごとの評価 ──
  let shapeTotal = 0;
  let startTotal = 0;
  let endTotal = 0;
  let endingTotal = 0;
  let endingCount = 0;
  let orderCorrect = 0;
  const strokeFeedback = [];
  const reversedStrokes = [];
  const endingMisses = [];

  for (let i = 0; i < expectedCount; i++) {
    const stroke = user[i];
    const target = expected[assignment[i]] ?? expected[i];
    // 対応づけが本来の位置とずれていても、正しい位置との費用差がわずかなら
    // （＝どちらを書いたのか幾何的に区別できない画なら）誤りと断定しない。
    const discriminable = assignment[i] !== i
      && cost[i][assignment[i]] < cost[i][i] - STROKE_THRESHOLDS.ORDER_AMBIGUITY_MARGIN;
    const inOrder = !discriminable;
    if (inOrder) orderCorrect++;

    if (!stroke || stroke.length === 0) {
      strokeFeedback.push({ index: i, matched: assignment[i], inOrder, shape: 0, reversed: false, ending: null });
      continue;
    }

    const shape = Analyzer.shapeDistance(stroke, target.points);
    // 逆走（例：横画を右から左へ）は、逆順で比べた方が明らかに近いことで分かる
    const isReversed = shape.reversed < shape.forward * 0.6 && shape.reversed < tolerances.shape;
    const shapeRatio = distanceScore(shape.forward, tolerances.shape);
    shapeTotal += shapeRatio;
    if (isReversed) reversedStrokes.push(i + 1);

    startTotal += distanceScore(distanceOf(stroke[0], target.s), tolerances.start);
    endTotal += distanceScore(distanceOf(stroke[stroke.length - 1], target.e), tolerances.end);

    const actualEnding = Analyzer.analyzeEnding(stroke).code;
    const similarity = endingSimilarity(target.endingType ?? null, actualEnding);
    if (similarity !== null) {
      endingTotal += similarity;
      endingCount++;
      if (similarity < 1) {
        endingMisses.push({ index: i + 1, expected: target.endingType, actual: actualEnding });
      }
    }

    strokeFeedback.push({
      index: i,
      matched: assignment[i],
      inOrder,
      shape: shapeRatio,
      reversed: isReversed,
      ending: similarity,
    });
  }

  // ── 点画の交差 ──
  // 対応づけの逆写像を使い、「正解のi画目に当たるユーザーの画」どうしで比べる。
  // こうすることで書き順の誤りが交差の判定に二重で響かない。
  const inverse = new Array(expectedCount).fill(-1);
  assignment.forEach((target, i) => { if (target >= 0) inverse[target] = i; });

  let crossTotal = 0;
  let crossPairs = 0;
  let crossMatch = true;
  const crossIssues = [];

  for (let i = 0; i < expectedCount; i++) {
    for (let j = i + 1; j < expectedCount; j++) {
      const expectedCrossed = Analyzer.isCrossed(expected[i].points, expected[j].points);
      const ui = inverse[i];
      const uj = inverse[j];
      const actualDepth = (ui >= 0 && uj >= 0) ? Analyzer.crossingDepth(user[ui], user[uj]) : 0;
      // 交わるべき組と、交わってはいけないのに交わった組だけを評価対象にする
      // （無関係な組を含めると平均が薄まり、誤りが点数に表れなくなる）
      if (!expectedCrossed && actualDepth <= STROKE_THRESHOLDS.CROSS_DEPTH_NONE) continue;
      const score = Analyzer.crossingScore(expectedCrossed, actualDepth);
      crossTotal += score;
      crossPairs++;
      if (score < 0.5) {
        crossMatch = false;
        crossIssues.push({ a: i + 1, b: j + 1, kind: expectedCrossed ? 'missing' : 'extra' });
      }
    }
  }

  // ── 配点（評価できない項目は他項目へ按分）──
  const components = [
    { key: 'shape', weight: WEIGHTS.SHAPE, ratio: shapeTotal / expectedCount },
    { key: 'order', weight: WEIGHTS.ORDER, ratio: orderCorrect / expectedCount },
    { key: 'ending', weight: WEIGHTS.ENDING, ratio: endingCount > 0 ? endingTotal / endingCount : null },
    { key: 'cross', weight: WEIGHTS.CROSS, ratio: crossPairs > 0 ? crossTotal / crossPairs : null },
    { key: 'start', weight: WEIGHTS.START, ratio: startTotal / expectedCount },
    { key: 'end', weight: WEIGHTS.END, ratio: endTotal / expectedCount },
  ];
  const activeWeight = components
    .filter(c => c.ratio !== null)
    .reduce((sum, c) => sum + c.weight, 0);
  const scale = activeWeight > 0 ? 100 / activeWeight : 0;

  const scores = {};
  // 内訳（結果画面で「なぜこの点数か」を示すため、満点と評価有無も添える）
  const breakdown = [];
  let total = 0;
  for (const c of components) {
    const evaluated = c.ratio !== null;
    const points = evaluated ? Math.round(clamp01(c.ratio) * c.weight * scale) : 0;
    scores[c.key] = points;
    breakdown.push({
      key: c.key,
      points,
      max: evaluated ? Math.round(c.weight * scale) : 0,
      evaluated,
    });
    total += points;
  }
  total = Math.max(0, Math.min(100, total));

  // 書き順の誤りは、見た目が同じでも別の学びなので合格させない
  const orderMatch = orderCorrect === expectedCount;
  if (!orderMatch) total = Math.min(total, GRADING.ORDER_FAIL_CAP);

  // ── フィードバック文言 ──
  details.push(shapeComment(shapeTotal / expectedCount));

  if (orderMatch) {
    details.push('書き順：ぜんぶ正しい ✓');
  } else {
    const firstWrong = strokeFeedback.find(f => !f.inOrder);
    const wrote = firstWrong ? firstWrong.matched + 1 : null;
    details.push(
      wrote
        ? `書き順：${firstWrong.index + 1}かくめに ${wrote}かくめを 書いているよ`
        : '書き順：じゅんばんを たしかめよう',
    );
  }

  if (reversedStrokes.length > 0) {
    details.push(`${reversedStrokes[0]}かくめは 書く向きが ぎゃくだよ`);
  }

  if (crossIssues.length > 0) {
    const issue = crossIssues[0];
    details.push(
      issue.kind === 'missing'
        ? `${issue.a}かくめと${issue.b}かくめは つきぬけるよ`
        : `${issue.a}かくめと${issue.b}かくめは つきぬけないよ`,
    );
  } else if (crossPairs > 0) {
    details.push('点画の交わり：正しい ✓');
  }

  if (endingMisses.length > 0) {
    const miss = endingMisses[0];
    details.push(`${miss.index}かくめは ${endingVerb(miss.expected)} ところだよ`);
  } else if (endingCount > 0) {
    details.push('とめ・はね・はらい：ばっちり ✓');
  }

  return {
    total,
    strokeCount: 0,
    shape: scores.shape,
    order: scores.order,
    ending: scores.ending,
    cross: scores.cross,
    startPoints: scores.start,
    endPoints: scores.end,
    strokeCountMatch: true,
    crossMatch,
    orderMatch,
    assignment,
    strokeFeedback,
    breakdown,
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
