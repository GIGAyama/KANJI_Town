// サバイバルモード専用 採点エンジン
// ボスバトルの gradeStrokes（精密な始点・終点チェック）とは異なり、
// 「個別ストロークのマッチング」+「全体の形」で判定する
// ボスよりはゆるいが、画数ミスや石↔右のような形の近い漢字は区別できる

/**
 * サバイバルモード用のストローク採点
 * @param {Array} userStrokes - ユーザーが書いたストローク配列 [[{x, y, time}, ...], ...]
 * @param {Array} strokeData - 正解のストロークデータ [{s: {x,y}, e: {x,y}, points: [...]}]
 * @param {number} canvasSize - キャンバスサイズ（座標正規化用）
 * @param {number} writingTimeMs - 書き始めから書き終わりまでの時間(ms)
 * @param {number} wave - 現在のウェーブ番号（1始まり）
 * @returns {{ rank: 'perfect' | 'ok' | 'miss', message: string, timeBonus: number, details: string[] }}
 */
export function survivalGrade(userStrokes, strokeData, canvasSize, writingTimeMs, wave = 1) {
  const details = [];
  const expectedCount = strokeData.length;
  const actualCount = userStrokes.length;

  // --- Step 1: 画数チェック（厳しめ）---
  const strokeDiff = Math.abs(actualCount - expectedCount);

  if (strokeDiff === 0) {
    details.push(`画数OK（${expectedCount}画）`);
  } else if (strokeDiff === 1) {
    // ±1画 → 最高でもOK、PERFECTにはなれない
    details.push(`画数おしい（${actualCount}→${expectedCount}画）`);
  } else {
    // ±2画以上は即MISS
    details.push(`画数ちがう（${actualCount}→${expectedCount}画）`);
    return { rank: 'miss', message: '画数がちがう！', timeBonus: -5, details };
  }

  // --- Step 2: 個別ストロークマッチング ---
  // ユーザーの各ストロークを正規化して、正解ストロークとの最良マッチを探す
  const normUserStrokes = userStrokes.map(s => normalizeStroke(s, canvasSize));
  const normRefStrokes = strokeData.map(s => ({
    center: calcCenter(s.points),
    direction: calcDirection(s.points),
    bbox: calcBBox(s.points),
    points: s.points,
  }));

  // 貪欲マッチング: ユーザーストロークを正解ストロークにマッチ
  const matchScores = matchStrokes(normUserStrokes, normRefStrokes);
  const avgMatchScore = matchScores.reduce((a, b) => a + b, 0) / (matchScores.length || 1);
  const worstMatch = Math.min(...matchScores, 1);
  // マッチしなかった正解ストロークの数
  const unmatchedRef = Math.max(0, expectedCount - actualCount);

  if (avgMatchScore > 0.55) details.push('形：いいね！');
  else if (avgMatchScore > 0.35) details.push('形：おしい');
  else details.push('形：ちがう');

  if (worstMatch < 0.15 && matchScores.length > 0) {
    details.push('ちがう線がある');
  }

  // --- Step 3: 全体形状チェック（補助） ---
  const userAllPts = flattenNormPoints(userStrokes, canvasSize);
  const refAllPts = flattenRefPoints(strokeData);
  const gridScore = calcGridMatchScore(
    calcGridDistribution(userAllPts),
    calcGridDistribution(refAllPts),
  );

  // --- Step 4: 総合スコア ---
  // 個別マッチ(60%) + 全体グリッド(20%) + 最悪マッチペナルティ(20%)
  const totalScore = avgMatchScore * 0.6 + gridScore * 0.2 + worstMatch * 0.2;
  // マッチしなかった正解ストロークのペナルティ
  const unmatchedPenalty = unmatchedRef * 0.1;
  const finalScore = Math.max(0, totalScore - unmatchedPenalty);

  // ウェーブに応じた閾値（後半ほど厳しく）
  const perfectThreshold = Math.min(0.60, 0.50 + (wave - 1) * 0.02);
  const okThreshold = Math.min(0.45, 0.35 + (wave - 1) * 0.02);

  // --- Step 5: ランク決定 ---
  let rank;
  if (strokeDiff > 0) {
    // 画数が違う → PERFECTにはなれない
    rank = finalScore >= okThreshold ? 'ok' : 'miss';
  } else if (finalScore >= perfectThreshold && worstMatch >= 0.2) {
    // 全ストロークがそこそこマッチ + 総合スコア高い → PERFECT
    rank = 'perfect';
  } else if (finalScore >= okThreshold) {
    rank = 'ok';
  } else {
    rank = 'miss';
  }

  // スピードボーナス: OKをPERFECTに上げるのは廃止。PERFECTの場合のみ追加メッセージ
  const baseTimeMs = expectedCount * 1500;
  const isFast = writingTimeMs > 0 && writingTimeMs < baseTimeMs;
  if (isFast && rank === 'perfect') {
    details.push('すばやい！');
  }

  // --- 時間ボーナス（控えめに）---
  let timeBonus = 0;
  let message = '';
  if (rank === 'perfect') {
    timeBonus = 4;
    message = 'PERFECT!';
  } else if (rank === 'ok') {
    timeBonus = 1;
    message = 'OK!';
  } else {
    timeBonus = -5;
    message = 'MISS...';
  }

  return { rank, message, timeBonus, details };
}

// === ヘルパー関数 ===

/** ユーザーストロークを正規化して特徴量を抽出 */
function normalizeStroke(stroke, canvasSize) {
  const pts = stroke.map(p => ({ x: p.x / canvasSize, y: p.y / canvasSize }));
  return {
    center: calcCenter(pts),
    direction: calcDirection(pts),
    bbox: calcBBox(pts),
    points: pts,
  };
}

/** ポイント群の重心 */
function calcCenter(points) {
  if (points.length === 0) return { x: 0.5, y: 0.5 };
  let sx = 0, sy = 0;
  for (const p of points) { sx += p.x; sy += p.y; }
  return { x: sx / points.length, y: sy / points.length };
}

/** ストロークの主方向（始点→終点のベクトル） */
function calcDirection(points) {
  if (points.length < 2) return { dx: 0, dy: 0 };
  const first = points[0];
  const last = points[points.length - 1];
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.01) return { dx: 0, dy: 0 };
  return { dx: dx / len, dy: dy / len };
}

/** バウンディングボックス */
function calcBBox(points) {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1, w: 1, h: 1 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/** 2つのストローク間の類似度 (0-1) */
function strokeSimilarity(userStroke, refStroke) {
  // 1. 重心距離 (0-1, 近いほど高い)
  const centerDist = Math.hypot(
    userStroke.center.x - refStroke.center.x,
    userStroke.center.y - refStroke.center.y,
  );
  const centerScore = Math.max(0, 1 - centerDist / 0.4);

  // 2. 方向の類似度（コサイン類似度、-1~1 → 0~1に変換）
  const dot = userStroke.direction.dx * refStroke.direction.dx +
              userStroke.direction.dy * refStroke.direction.dy;
  // dot: 1=同方向, -1=逆方向, 0=直交
  const dirScore = (dot + 1) / 2; // 0~1

  // 3. サイズ（長さ）の類似度
  const userLen = Math.hypot(userStroke.bbox.w, userStroke.bbox.h);
  const refLen = Math.hypot(refStroke.bbox.w, refStroke.bbox.h);
  const maxLen = Math.max(userLen, refLen, 0.01);
  const minLen = Math.min(userLen, refLen);
  const sizeScore = minLen / maxLen;

  // 重み: 重心40%, 方向35%, サイズ25%
  return centerScore * 0.40 + dirScore * 0.35 + sizeScore * 0.25;
}

/**
 * 貪欲マッチング: 各ユーザーストロークを最も似ている正解ストロークにマッチ
 * 一度マッチした正解ストロークは再利用しない
 * @returns {number[]} 各ユーザーストロークのマッチスコア配列
 */
function matchStrokes(userStrokes, refStrokes) {
  if (userStrokes.length === 0 || refStrokes.length === 0) return [0];

  const usedRef = new Set();
  const scores = [];

  // コスト行列を構築
  const costMatrix = userStrokes.map(us =>
    refStrokes.map(rs => strokeSimilarity(us, rs)),
  );

  // 貪欲に最良マッチから割り当て
  const pairs = [];
  for (let i = 0; i < userStrokes.length; i++) {
    for (let j = 0; j < refStrokes.length; j++) {
      pairs.push({ i, j, score: costMatrix[i][j] });
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  const usedUser = new Set();
  for (const { i, j, score } of pairs) {
    if (usedUser.has(i) || usedRef.has(j)) continue;
    usedUser.add(i);
    usedRef.add(j);
    scores[i] = score;
  }

  // マッチしなかったユーザーストローク → スコア0
  for (let i = 0; i < userStrokes.length; i++) {
    if (scores[i] === undefined) scores[i] = 0;
  }

  return scores;
}

/** ユーザーの全ポイントをフラットに（全体形状チェック用） */
function flattenNormPoints(userStrokes, canvasSize) {
  const points = [];
  for (const stroke of userStrokes) {
    for (const pt of stroke) {
      points.push({ x: pt.x / canvasSize, y: pt.y / canvasSize });
    }
  }
  return points;
}

/** 正解の全ポイントをフラットに */
function flattenRefPoints(strokeData) {
  const points = [];
  for (const stroke of strokeData) {
    for (const pt of stroke.points) {
      points.push({ x: pt.x, y: pt.y });
    }
  }
  return points;
}

/** 3×3グリッドの分布 */
function calcGridDistribution(points) {
  const grid = new Array(9).fill(0);
  for (const p of points) {
    const col = Math.min(2, Math.floor(p.x * 3));
    const row = Math.min(2, Math.floor(p.y * 3));
    const idx = row * 3 + col;
    if (idx >= 0 && idx < 9) grid[idx]++;
  }
  const total = points.length || 1;
  return grid.map(v => v / total);
}

/** 3×3グリッドのコサイン類似度 */
function calcGridMatchScore(userGrid, refGrid) {
  let dot = 0, magU = 0, magR = 0;
  for (let i = 0; i < 9; i++) {
    dot += userGrid[i] * refGrid[i];
    magU += userGrid[i] * userGrid[i];
    magR += refGrid[i] * refGrid[i];
  }
  magU = Math.sqrt(magU);
  magR = Math.sqrt(magR);
  if (magU === 0 || magR === 0) return 0;
  return dot / (magU * magR);
}
