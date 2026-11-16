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
import { JUDGE, STROKE_THRESHOLDS, getStrokeTolerances } from '../constants/strokeConfig.js';
import { GRADING } from '../constants/gameConfig.js';
import { Analyzer } from './analyzer.js';
import { endingSimilarity, endingVerb } from './strokeKind.js';

const { WEIGHTS } = GRADING;

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const distanceOf = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** 交差の判定に使う、児童の1画あたりの点の数 */
const CROSS_SAMPLES = 64;

/**
 * 等間隔に取りなおした2つの画の、字形のずれ（Analyzer.shapeDistance と同じ計算）。
 * @returns {{ forward: number, reversed: number }}
 */
function sampledShapeDistance(a, b) {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return { forward: Infinity, reversed: Infinity };
  let forward = 0;
  let reversed = 0;
  for (let i = 0; i < a.length; i++) {
    forward += distanceOf(a[i], b[i]);
    reversed += distanceOf(a[i], b[a.length - 1 - i]);
  }
  return { forward: forward / a.length, reversed: reversed / a.length };
}

/** お手本どうしの交差表。字ごと（strokeData の配列ごと）に1回だけ求める */
const crossMatrixCache = new WeakMap();
function expectedCrossMatrix(strokeData, expected, provided) {
  const n = expected.length;
  const valid = (matrix) => Array.isArray(matrix) && matrix.length === n && matrix.every(row => Array.isArray(row) && row.length === n);
  if (valid(provided)) return provided;
  const cached = strokeData && typeof strokeData === 'object' ? crossMatrixCache.get(strokeData) : null;
  if (valid(cached)) return cached;
  const matrix = expected.map((_, i) => expected.map((__, j) => i !== j && Analyzer.isCrossed(expected[i].points, expected[j].points)));
  if (strokeData && typeof strokeData === 'object') crossMatrixCache.set(strokeData, matrix);
  return matrix;
}

/** 点の並びの長さ（正規化座標） */
function pathLength(points) {
  let length = 0;
  for (let i = 1; i < points.length; i++) length += distanceOf(points[i - 1], points[i]);
  return length;
}

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
 * ポイント群の外接枠の中心と大きさを返す（サンプリング密度に影響されない基準）
 * @param {Array<Array<{x: number, y: number}>>} strokes
 * @returns {{x: number, y: number, side: number}|null} side は幅と高さの大きい方（「一」のように高さ0の字があるため）
 */
function boundsOf(strokes) {
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
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, side: Math.max(maxX - minX, maxY - minY) };
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
const UNREACHABLE_COST = 1e6;
/** これより小さい字の外接枠は、大きさをそろえる基準にしない（点1つなど） */
const SIZE_EPSILON = 0.02;

const isFinitePoint = (p) => Boolean(p) && Number.isFinite(p.x) && Number.isFinite(p.y);

/** お手本の画から、数でない座標を除く（壊れたキャッシュでも採点が NaN にならないように） */
function sanitizeTarget(target) {
  const points = (Array.isArray(target?.points) ? target.points : []).filter(isFinitePoint);
  const fallback = { x: 0.5, y: 0.5 };
  return {
    ...target,
    points,
    s: isFinitePoint(target?.s) ? target.s : (points[0] ?? fallback),
    e: isFinitePoint(target?.e) ? target.e : (points[points.length - 1] ?? fallback),
  };
}

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
        // 費用が NaN だと比較が成り立たず、j1 が 0 のまま抜けられなくなる（タブが固まる）
        const raw = cost[i0 - 1][j - 1];
        const cur = (Number.isFinite(raw) ? raw : UNREACHABLE_COST) - u[i0] - v[j];
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
 * @param {{ expectedCross?: boolean[][] }} [options] - expectedCross: お手本どうしの交差表（SessionView の crossMatrix）
 * @returns {object} 採点結果
 */
export function gradeStrokes(userStrokes, strokeData, canvasSize, options = {}) {
  const details = [];
  const expected = Array.isArray(strokeData) ? strokeData.map(sanitizeTarget) : [];
  const expectedCount = expected.length;
  const actualCount = Array.isArray(userStrokes) ? userStrokes.length : 0;

  if (expectedCount === 0) {
    return emptyResult(['おてほんを よみこめませんでした']);
  }
  if (!(Number.isFinite(canvasSize) && canvasSize > 0)) {
    return emptyResult(['うまく よみとれなかったよ。もういちど 書いてね']);
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
  // 座標が数でない点（キャンバスの幅が 0 のときなど）は捨てる。1点でも混ざると採点が止まらなくなっていた
  const scaled = userStrokes.map(stroke => (Array.isArray(stroke) ? stroke : [])
    .filter(isFinitePoint)
    .map(p => ({
      x: p.x / canvasSize,
      y: p.y / canvasSize,
      time: Number.isFinite(p.time) ? p.time : 0,
    })));
  // ── 字全体の大きさをそろえる ──
  // マスの中に小さく書く・大きくはみ出すと、形も書き順も正しいのに全画が減点されていた
  // （「三」を 0.6 倍で書くと 62 点、0.5 倍で 57 点）。お手本の外接枠の大きい方の辺に合わせて、
  // 字の中心を基準に拡大・縮小する。補正には上限を設け、大きすぎる差は講評で伝える。
  const rawBounds = boundsOf(scaled);
  const expectedBounds = boundsOf(expected.map(s => s.points));
  let sizeRatio = 1; // 児童の字の大きさ ÷ お手本の大きさ
  if (rawBounds && expectedBounds && rawBounds.side > SIZE_EPSILON && expectedBounds.side > SIZE_EPSILON) {
    sizeRatio = rawBounds.side / expectedBounds.side;
  }
  const sizeScale = Math.max(STROKE_THRESHOLDS.SIZE_SCALE_MIN, Math.min(STROKE_THRESHOLDS.SIZE_SCALE_MAX, 1 / sizeRatio));
  const resized = rawBounds
    ? scaled.map(stroke => stroke.map(p => ({
      x: rawBounds.x + (p.x - rawBounds.x) * sizeScale,
      y: rawBounds.y + (p.y - rawBounds.y) * sizeScale,
      time: p.time,
    })))
    : scaled;

  // 拡大・縮小は中心を基準にしているので、中心は変わらない
  const userCenter = rawBounds;
  const expectedCenter = expectedBounds;
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
  const user = resized.map(stroke => stroke.map(p => ({
    x: p.x + shiftX,
    y: p.y + shiftY,
    time: p.time,
  })));

  // ── 画の対応づけ（どの画を書いたのか）──
  // 字形の比較は、画ごとに1回だけ等間隔に取りなおした点で行う（以前は組ごとに取りなおしていた）。
  const userSamples = user.map(stroke => (stroke.length > 0 ? Analyzer.resample(stroke, STROKE_THRESHOLDS.SHAPE_SAMPLES) : []));
  const targetSamples = expected.map(target => Analyzer.resample(target.points, STROKE_THRESHOLDS.SHAPE_SAMPLES));
  const shapes = user.map((_, i) => expected.map((__, j) => sampledShapeDistance(userSamples[i], targetSamples[j])));
  const cost = user.map((stroke, i) => expected.map((target, j) => {
    if (stroke.length === 0) return 10;
    const shapeDist = Math.min(shapes[i][j].forward, shapes[i][j].reversed);
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
  let orderPoints = 0;
  let orderMistakes = 0;
  const strokeFeedback = [];
  const reversedStrokes = [];
  const endingMisses = [];

  for (let i = 0; i < expectedCount; i++) {
    const stroke = user[i];
    const targetIndex = expected[assignment[i]] ? assignment[i] : i;
    const target = expected[targetIndex];
    // 対応づけが本来の位置とずれていても、正しい位置との費用差がわずかなら
    // （＝どちらを書いたのか幾何的に区別できない画なら）誤りと断定しない。
    const discriminable = assignment[i] !== i
      && cost[i][assignment[i]] < cost[i][i] - STROKE_THRESHOLDS.ORDER_AMBIGUITY_MARGIN;
    const inOrder = !discriminable;

    if (!stroke || stroke.length === 0) {
      strokeFeedback.push({ index: i, matched: assignment[i], inOrder, shape: 0, reversed: false, ending: null });
      continue;
    }

    const shape = shapes[i][targetIndex];
    // 逆走（例：横画を右から左へ）は、逆順で比べた方が明らかに近いことで分かる
    const isReversed = shape.reversed < shape.forward * 0.6 && shape.reversed < tolerances.shape;
    const shapeRatio = distanceScore(shape.forward, tolerances.shape);
    shapeTotal += shapeRatio;
    if (isReversed) reversedStrokes.push(i + 1);
    // お手本のどの画とも似ていない画（点を打っただけ、でたらめな線）は、書き順・とめの点に数えない。
    // 以前は対応づけの誤りがはっきりしない限り「書き順正しい」になり、3点未満の画は「とめ」と判定されて、
    // 点を1つ打つだけで 45 点（おすすめ「むずかしい」＝合格扱い）になっていた。
    // 形の分からない画は、どの画のつもりかも分からないので、書き順のまちがいとも数えない。
    // 長い画のところに点を打っただけのものも、形が近く見えることがあるので長さも見る（点の画はそのまま）
    const targetLength = pathLength(target.points);
    const lengthOk = targetLength < GRADING.SHORT_STROKE_LENGTH
      || pathLength(stroke) >= targetLength * GRADING.MIN_LENGTH_RATIO;
    const recognizable = shapeRatio >= GRADING.MIN_STROKE_SHAPE && lengthOk;
    if (inOrder && recognizable) orderPoints++;
    if (!inOrder && recognizable) orderMistakes++;

    startTotal += distanceScore(distanceOf(stroke[0], target.s), tolerances.start);
    endTotal += distanceScore(distanceOf(stroke[stroke.length - 1], target.e), tolerances.end);

    const actualEnding = Analyzer.analyzeEnding(stroke).code;
    const similarity = endingSimilarity(target.endingType ?? null, actualEnding);
    if (similarity !== null) {
      endingTotal += recognizable ? similarity : 0;
      endingCount++;
      if (recognizable && similarity < 1) {
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
  // 交差の判定は画の点の数どうしの掛け算になる。ペンでゆっくり書くと 1 画 600 点にもなり、
  // 20 画の字で 0.4 秒ほど固まっていたので、児童の画は CROSS_SAMPLES 点に取りなおしてから比べる。
  // お手本どうしの交差は字ごとに1回だけ求めて使いまわす。
  const expectedCross = expectedCrossMatrix(strokeData, expected, options.expectedCross);
  const userCross = user.map(stroke => (stroke.length > CROSS_SAMPLES ? Analyzer.resample(stroke, CROSS_SAMPLES) : stroke));

  for (let i = 0; i < expectedCount; i++) {
    for (let j = i + 1; j < expectedCount; j++) {
      const expectedCrossed = expectedCross[i][j];
      const ui = inverse[i];
      const uj = inverse[j];
      const actualDepth = (ui >= 0 && uj >= 0) ? Analyzer.crossingDepth(userCross[ui], userCross[uj]) : 0;
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
    { key: 'order', weight: WEIGHTS.ORDER, ratio: orderPoints / expectedCount },
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
  const orderMatch = orderMistakes === 0;
  if (!orderMatch) total = Math.min(total, GRADING.ORDER_FAIL_CAP);
  // 字の形がほとんどお手本と合わないときは、ほかの項目が残っていても「書けた」側に入れない
  const meanShape = shapeTotal / expectedCount;
  if (meanShape < GRADING.SHAPE_FAIL_RATIO) total = Math.min(total, GRADING.SHAPE_FAIL_CAP);

  // ── フィードバック文言 ──
  details.push(shapeComment(meanShape));
  // 大きさの講評は、形がお手本と合っているときだけ（形がちがうときは形を直すのが先）
  if (meanShape >= GRADING.SHAPE_FAIL_RATIO) {
    if (sizeRatio < STROKE_THRESHOLDS.SIZE_SMALL) details.push('字を もうすこし 大きく 書こう');
    else if (sizeRatio > STROKE_THRESHOLDS.SIZE_LARGE) details.push('字を もうすこし 小さく 書こう');
  }

  if (orderMatch) {
    // 形の分からない画があるときは、書き順が正しいとは言わない
    if (orderPoints === expectedCount) details.push('書き順：ぜんぶ正しい ✓');
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
  } else if (endingCount > 0 && endingTotal === endingCount) {
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
 * 画数と交差は合っているのに、書き順だけが違うか。
 * 見た目が同じでも合格させないため（README「書字の正誤判定」）、
 * 点数のしきい値より先にこれを見ること。ボス・サバイバルは点数だけで判定していて、
 * 上限69点の書き順ちがいが「成功」として扱われていた。
 * @param {object|null} result - gradeStrokes の結果
 * @returns {boolean}
 */
export function isOrderMistake(result) {
  return Boolean(result)
    && result.strokeCountMatch === true
    && result.crossMatch !== false
    && result.orderMatch === false;
}

/**
 * 採点結果から、間隔反復に渡す評価のおすすめを決める（毎日の学習のテストと同じ基準）。
 * 書き順ちがいは、点数にかかわらず 'hard' より上にしない。
 * @param {object|null} result - gradeStrokes の結果
 * @returns {'easy'|'good'|'hard'|'again'}
 */
export function recommendEvaluation(result) {
  if (!result || !result.strokeCountMatch || result.crossMatch === false) return 'again';
  if (result.orderMatch === false) return result.total >= 30 ? 'hard' : 'again';
  if (result.total >= 80) return 'easy';
  if (result.total >= 55) return 'good';
  if (result.total >= 30) return 'hard';
  return 'again';
}

/**
 * 線を、だいたい同じ間隔の点の並びにする（「字の線に重なっているか」を、画の切れ目に関係なく数えるため）。
 * @param {Array<Array<{x: number, y: number}>>} strokes
 * @param {number} step 点の間隔
 */
function inkPoints(strokes, step) {
  const points = [];
  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    points.push(stroke[0]);
    for (let i = 1; i < stroke.length; i++) {
      const a = stroke[i - 1];
      const b = stroke[i];
      const pieces = Math.max(1, Math.ceil(distanceOf(a, b) / step));
      for (let k = 1; k <= pieces; k++) points.push({ x: a.x + (b.x - a.x) * k / pieces, y: a.y + (b.y - a.y) * k / pieces });
    }
  }
  return points;
}

/** from の点のうち、to のどれかの点が radius 以内にあるものの割合 */
function nearRatio(from, to, radius) {
  if (from.length === 0 || to.length === 0) return 0;
  let hit = 0;
  for (const a of from) {
    for (const b of to) {
      if (Math.abs(a.x - b.x) <= radius && Math.abs(a.y - b.y) <= radius && distanceOf(a, b) <= radius) { hit++; break; }
    }
  }
  return hit / from.length;
}

/**
 * 「ほとんど書いていない」かどうかを、測った数から決める（読み取れる字かどうかは、呼ぶ側で別に見る）。
 * @param {{ expectedCount: number, markCount: number, inkRatio: number, inkCoverage: number }} measured
 * @returns {'ink'|'few'|null} ink: 点・ごく短い線だけ／few: 画がお手本の 1/3 以下で、お手本の線の半分も書けていない
 */
export function carelessReasonOf({ expectedCount, markCount, inkRatio, inkCoverage }) {
  if (inkRatio < JUDGE.CARELESS_MIN_INK_RATIO) return 'ink';
  // 割り算にすると 1/3 の丸めで境目がずれるので、掛け算で比べる
  const fewStrokes = expectedCount >= 3 && markCount * JUDGE.CARELESS_FEW_STROKES_DIVISOR <= expectedCount;
  return fewStrokes && inkCoverage < JUDGE.CARELESS_MAX_INK_COVERAGE ? 'few' : null;
}

/**
 * 書いた線が「お手本の字として読み取れるか」と「どれだけ書いたか」を測る。
 *
 * gradeStrokes は画数が合わないと採点しない（0点で内訳なし）ので、1画多い・少ないだけの字と、
 * 線を1本引いただけの字を見分けられない。ここでは画数が合っていなくても、
 * 字全体の大きさと位置をお手本にそろえてから（上限なし）、お手本の画ごとに
 * 「書いた線のどれかと形・位置が合うか」を数える。書く向きが逆でも合うものとして数える
 * （向きや順番のまちがいは、読み取れないこととは別なので）。
 *
 * てきとう書き（careless）は重いペナルティにつながるので、「ほとんど書いていない」ものだけにする:
 * - 線の長さの合計が、お手本の1割に満たない（点・ごく短い線だけ）
 * - 3画以上の字で、書いた画がお手本の 1/3 以下で、しかもお手本の線の半分も書けていない
 * 以前は画数だけで決めていたので、ペンをはなさずに続けて書いた字（1画に数えられる）や、
 * タッチがとぎれて画がいくつにも切れた字、手のひらが当たって点が入った字まで、てきとう書きにしていた
 * （試算で 74〜100%）。いまは「お手本の線のうち、書いた線が近くにある割合」（inkCoverage）を見るので、
 * 字の形に書けていれば、画の数え方がどうなっていても、てきとう書きにはしない。
 * でたらめな線をたくさん引いたものは、ほかの字と書きまちがえた字と見分けられないので、
 * てきとう書きにはしない（「もう1回」になるだけ）。
 *
 * @param {Array<Array<{x: number, y: number}>>} userStrokes
 * @param {Array<{points: Array}>} strokeData
 * @param {number} [canvasSize]
 * @returns {{ expectedCount: number, actualCount: number, markCount: number, inkRatio: number, sizeRatio: number,
 *   coverage: number, inkCoverage: number, recognized: boolean, careless: boolean, carelessReason: 'few'|'ink'|null }}
 *   markCount: 点・ごく短い線をのぞいた画数。inkCoverage: お手本の線のうち、書いた線が近くにある割合
 */
export function measureAttempt(userStrokes, strokeData, canvasSize = 1) {
  const expected = Array.isArray(strokeData) ? strokeData.map(sanitizeTarget) : [];
  const size = Number.isFinite(canvasSize) && canvasSize > 0 ? canvasSize : 1;
  const user = (Array.isArray(userStrokes) ? userStrokes : [])
    .map(stroke => (Array.isArray(stroke) ? stroke : []).filter(isFinitePoint).map(p => ({ x: p.x / size, y: p.y / size })))
    .filter(stroke => stroke.length > 0);
  const expectedCount = expected.length;
  const actualCount = user.length;
  if (expectedCount === 0) {
    return { expectedCount, actualCount, markCount: 0, inkRatio: 0, sizeRatio: 1, coverage: 0, inkCoverage: 0, recognized: false, careless: false, carelessReason: null };
  }

  const expectedInk = expected.reduce((sum, target) => sum + pathLength(target.points), 0);
  const userInk = user.reduce((sum, stroke) => sum + pathLength(stroke), 0);
  const inkRatio = expectedInk > 0 ? userInk / expectedInk : 1;

  // ── 字として読み取れるか ──
  const userBounds = boundsOf(user);
  const expectedBounds = boundsOf(expected.map(target => target.points));
  let sizeRatio = 1;
  let coverage = 0;
  if (userBounds && expectedBounds) {
    const comparable = userBounds.side > SIZE_EPSILON && expectedBounds.side > SIZE_EPSILON;
    if (comparable) sizeRatio = userBounds.side / expectedBounds.side;
    const scale = comparable ? 1 / sizeRatio : 1;
    const tolerances = getStrokeTolerances(expectedCount);
    const userSamples = user.map(stroke => ({
      length: pathLength(stroke) * scale,
      points: Analyzer.resample(stroke.map(p => ({
        x: expectedBounds.x + (p.x - userBounds.x) * scale,
        y: expectedBounds.y + (p.y - userBounds.y) * scale,
      })), STROKE_THRESHOLDS.SHAPE_SAMPLES),
    }));
    let matched = 0;
    for (const target of expected) {
      const targetSample = Analyzer.resample(target.points, STROKE_THRESHOLDS.SHAPE_SAMPLES);
      const targetLength = pathLength(target.points);
      const found = userSamples.some((sample) => {
        const lengthOk = targetLength < GRADING.SHORT_STROKE_LENGTH || sample.length >= targetLength * GRADING.MIN_LENGTH_RATIO;
        if (!lengthOk) return false;
        const shape = sampledShapeDistance(sample.points, targetSample);
        return distanceScore(Math.min(shape.forward, shape.reversed), tolerances.shape) >= GRADING.MIN_STROKE_SHAPE;
      });
      if (found) matched++;
    }
    coverage = matched / expectedCount;
  }
  const countDiffLimit = Math.max(1, Math.ceil(expectedCount * JUDGE.RECOGNIZED_COUNT_DIFF_RATIO));
  const recognized = coverage >= JUDGE.RECOGNIZED_COVERAGE && Math.abs(actualCount - expectedCount) <= countDiffLimit;

  // ── お手本の線に、どれだけ重なっているか ──
  // 点・ごく短い線（手のひらが当たったもの）は、画数にも、大きさをそろえる基準にも数えない。
  const marks = user.filter(stroke => pathLength(stroke) >= JUDGE.NOISE_STROKE_LENGTH);
  const markCount = marks.length;
  const markBounds = boundsOf(marks);
  let inkCoverage = 0;
  if (expectedBounds && markBounds) {
    // 点が多すぎて重くならないよう、長い字は間隔を広げる
    const step = Math.max(JUDGE.INK_POINT_STEP, Math.max(expectedInk, userInk) / JUDGE.INK_POINT_MAX);
    const modelPoints = inkPoints(expected.map(target => target.points), step);
    const alignable = markBounds.side > SIZE_EPSILON && expectedBounds.side > SIZE_EPSILON;
    const markScale = alignable ? expectedBounds.side / markBounds.side : 1;
    const aligned = inkPoints(marks.map(stroke => stroke.map(p => ({
      x: expectedBounds.x + (p.x - markBounds.x) * markScale,
      y: expectedBounds.y + (p.y - markBounds.y) * markScale,
    }))), step);
    // 大きさと位置をそろえたときと、書いたままのときの、よく重なるほうを採る（疑わしいときは書いた子の側に立つ）
    inkCoverage = Math.max(
      nearRatio(modelPoints, aligned, JUDGE.INK_NEAR_DISTANCE),
      nearRatio(modelPoints, inkPoints(marks, step), JUDGE.INK_NEAR_DISTANCE),
    );
  }

  const carelessReason = carelessReasonOf({ expectedCount, markCount, inkRatio, inkCoverage });

  return {
    expectedCount,
    actualCount,
    markCount,
    inkRatio,
    sizeRatio,
    coverage,
    inkCoverage,
    recognized,
    // 読み取れる字は、小さく書いただけ・1画多いだけ。てきとう書きとは数えない
    careless: !recognized && carelessReason !== null,
    carelessReason: recognized ? null : carelessReason,
  };
}

/**
 * 毎日の学習のテストで、書いた字を「できた／もう1回／てきとう書き」に分ける（自己採点のかわり）。
 *
 * 以前は採点のおすすめを出したうえで児童がボタンを選び、おすすめが「忘れた」でも
 * 「むずかしい」を選べば合格あつかいで先へ進めた。線を1本引くだけで新出字の EXP 50 が入り、
 * 1日の目標も進んでいた。ここで決めた評価がそのまま間隔反復と EXP に使われる。
 *
 * - pass: 画数が合っていて 40 点以上。評価は点数で決める（80 以上 easy・55 以上 good・ほか hard）。
 *   線の交わり・書き順がちがう字は 50 点以上で通し、評価は hard まで（まもなくまた出す）。
 * - retry: 画数がちがう・形が合わない。お手本を見てもう1回。
 *   ただし字として読み取れるもの（1画多い・小さく書いた など）は、同じ字で2回目からは
 *   hard で通す（ゆびがはなれて画が切れるような、子どもには直せない理由で止まらないように）。
 * - careless: ほとんど書いていない（点だけ・線を1本引いただけ など）。画面は、答えを見せる前に
 *   「書きなおす／わからない／このまま こたえあわせ」を確かめ、このまま進んだときだけ重いペナルティを科す。
 * - ungraded: お手本が無く採点できない（このときだけ自己申告にする）。
 *
 * @param {Array} userStrokes
 * @param {Array} strokeData
 * @param {number} [canvasSize]
 * @param {{ previousFails?: number, expectedCross?: boolean[][] }} [options]
 *   previousFails: このセッションで同じ字をやり直した回数
 * @returns {{ verdict: 'pass'|'retry'|'careless'|'ungraded', evaluation: 'easy'|'good'|'hard'|'again'|null,
 *   reason: string, result: object, attempt: object|null, lenient: boolean }}
 */
export function judgeWriting(userStrokes, strokeData, canvasSize = 1, options = {}) {
  const result = gradeStrokes(userStrokes, strokeData, canvasSize, options);
  if (!Array.isArray(strokeData) || strokeData.length === 0) {
    return { verdict: 'ungraded', evaluation: null, reason: 'no-model', result, attempt: null, lenient: false };
  }
  const flaw = result.crossMatch === false ? 'cross' : result.orderMatch === false ? 'order' : null;
  if (result.strokeCountMatch === true && result.total >= (flaw ? JUDGE.FLAWED_PASS_MIN_TOTAL : JUDGE.PASS_MIN_TOTAL)) {
    const evaluation = flaw ? 'hard'
      : result.total >= JUDGE.EASY_MIN_TOTAL ? 'easy'
        : result.total >= JUDGE.GOOD_MIN_TOTAL ? 'good' : 'hard';
    return { verdict: 'pass', evaluation, reason: flaw || 'ok', result, attempt: null, lenient: false };
  }

  const attempt = measureAttempt(userStrokes, strokeData, canvasSize);
  const reason = result.strokeCountMatch !== true ? 'count'
    : attempt.sizeRatio < JUDGE.SIZE_TOO_SMALL ? 'small'
      : attempt.sizeRatio > JUDGE.SIZE_TOO_LARGE ? 'large'
        : flaw || 'shape';
  if (attempt.recognized && (Number(options.previousFails) || 0) >= 1) {
    return { verdict: 'pass', evaluation: 'hard', reason, result, attempt, lenient: true };
  }
  if (attempt.careless) {
    return { verdict: 'careless', evaluation: 'again', reason: attempt.carelessReason, result, attempt, lenient: false };
  }
  return { verdict: 'retry', evaluation: 'again', reason, result, attempt, lenient: false };
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
