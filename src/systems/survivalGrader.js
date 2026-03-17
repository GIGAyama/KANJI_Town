// サバイバルモード専用 採点エンジン
// ボスバトルの gradeStrokes（精密な始点・終点チェック）とは異なり、
// 「全体の形がだいたい合っているか」+「スピード」で判定する

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

  // --- Step 1: 画数チェック（ゆるめ）---
  const strokeDiff = Math.abs(actualCount - expectedCount);
  let strokePenalty = 0; // 0=OK, 1=ランクダウン, 2=即MISS

  if (strokeDiff === 0) {
    details.push(`画数OK（${expectedCount}画）`);
  } else if (strokeDiff === 1) {
    strokePenalty = 1;
    details.push(`画数おしい（${actualCount}画→正解${expectedCount}画）`);
  } else {
    // ±2画以上は即MISS
    details.push(`画数ちがう（${actualCount}画→正解${expectedCount}画）`);
    return { rank: 'miss', message: '画数がちがう！', timeBonus: 0, details };
  }

  // --- Step 2: 全体の形チェック ---
  // ユーザーのストロークを正規化（0-1の範囲に）
  const userPoints = normalizePoints(userStrokes, canvasSize);
  const refPoints = getRefPoints(strokeData);

  // 2a. 重心位置の比較（40%）
  const userCenter = calcCenter(userPoints);
  const refCenter = calcCenter(refPoints);
  const centerDist = Math.hypot(userCenter.x - refCenter.x, userCenter.y - refCenter.y);
  // dist 0 → 1.0, dist 0.3+ → 0
  const centerScore = Math.max(0, 1 - centerDist / 0.3);
  if (centerScore > 0.7) details.push('位置：いいね！');
  else if (centerScore > 0.4) details.push('位置：おしい');
  else details.push('位置：ずれてる');

  // 2b. 広がり（バウンディングボックス）の比較（30%）
  const userBBox = calcBBox(userPoints);
  const refBBox = calcBBox(refPoints);
  const spreadScore = calcSpreadScore(userBBox, refBBox);
  if (spreadScore > 0.7) details.push('大きさ：いいね！');
  else if (spreadScore > 0.4) details.push('大きさ：おしい');
  else details.push('大きさ：ちがう');

  // 2c. ストロークの分布チェック 3×3グリッド（30%）
  const userGrid = calcGridDistribution(userPoints);
  const refGrid = calcGridDistribution(refPoints);
  const gridScore = calcGridMatchScore(userGrid, refGrid);
  if (gridScore > 0.7) details.push('形：いいね！');
  else if (gridScore > 0.4) details.push('形：おしい');
  else details.push('形：ちがう');

  // 形状スコア合計
  const shapeScore = centerScore * 0.4 + spreadScore * 0.3 + gridScore * 0.3;

  // ウェーブに応じた閾値調整（Wave1: 0.45, Wave3: 0.50, Wave5+: 0.55）
  const perfectThreshold = Math.min(0.65, 0.60 + (wave - 1) * 0.015);
  const okThreshold = Math.min(0.50, 0.45 + (wave - 1) * 0.015);

  // --- Step 3: ランク決定 ---
  let rank;
  if (shapeScore >= perfectThreshold && strokePenalty === 0) {
    rank = 'perfect';
  } else if (shapeScore >= okThreshold && strokePenalty <= 1) {
    rank = strokePenalty === 1 ? 'ok' : (shapeScore >= perfectThreshold ? 'perfect' : 'ok');
    // 画数±1でペナルティがある場合、perfectにはなれない
    if (strokePenalty === 1 && rank === 'perfect') rank = 'ok';
  } else {
    rank = 'miss';
  }

  // --- Step 4: スピードボーナス ---
  const baseTimeMs = expectedCount * 1500; // 画数 × 1.5秒
  const isFast = writingTimeMs > 0 && writingTimeMs < baseTimeMs;

  if (isFast && rank === 'ok') {
    rank = 'perfect';
    details.push('速い！ランクUP！');
  } else if (isFast && rank === 'perfect') {
    details.push('すばやい！');
  }

  // --- 時間ボーナス計算 ---
  let timeBonus = 0;
  let message = '';
  if (rank === 'perfect') {
    timeBonus = 8;
    message = 'PERFECT!';
  } else if (rank === 'ok') {
    timeBonus = 3;
    message = 'OK!';
  } else {
    timeBonus = -8;
    message = 'MISS...';
  }

  return { rank, message, timeBonus, details };
}

// --- ヘルパー関数 ---

/** ユーザーのストロークポイントを0-1に正規化 */
function normalizePoints(userStrokes, canvasSize) {
  const points = [];
  for (const stroke of userStrokes) {
    for (const pt of stroke) {
      points.push({ x: pt.x / canvasSize, y: pt.y / canvasSize });
    }
  }
  return points;
}

/** 正解データからポイント配列を取得 */
function getRefPoints(strokeData) {
  const points = [];
  for (const stroke of strokeData) {
    for (const pt of stroke.points) {
      points.push({ x: pt.x, y: pt.y });
    }
  }
  return points;
}

/** ポイント群の重心を計算 */
function calcCenter(points) {
  if (points.length === 0) return { x: 0.5, y: 0.5 };
  let sx = 0, sy = 0;
  for (const p of points) { sx += p.x; sy += p.y; }
  return { x: sx / points.length, y: sy / points.length };
}

/** ポイント群のバウンディングボックスを計算 */
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

/** バウンディングボックスの類似度スコア */
function calcSpreadScore(userBBox, refBBox) {
  // 幅と高さの比率を比較
  const wRatio = refBBox.w > 0.01 ? Math.min(userBBox.w, refBBox.w) / Math.max(userBBox.w, refBBox.w) : (userBBox.w < 0.1 ? 1 : 0);
  const hRatio = refBBox.h > 0.01 ? Math.min(userBBox.h, refBBox.h) / Math.max(userBBox.h, refBBox.h) : (userBBox.h < 0.1 ? 1 : 0);

  // 位置のずれも考慮（中心位置の差）
  const userCx = (userBBox.minX + userBBox.maxX) / 2;
  const userCy = (userBBox.minY + userBBox.maxY) / 2;
  const refCx = (refBBox.minX + refBBox.maxX) / 2;
  const refCy = (refBBox.minY + refBBox.maxY) / 2;
  const posDist = Math.hypot(userCx - refCx, userCy - refCy);
  const posScore = Math.max(0, 1 - posDist / 0.3);

  return (wRatio * 0.35 + hRatio * 0.35 + posScore * 0.3);
}

/** 3×3グリッドの分布を計算 */
function calcGridDistribution(points) {
  // 9セルのビットマップ（各セルにポイントがあるか）
  const grid = new Array(9).fill(0);
  for (const p of points) {
    const col = Math.min(2, Math.floor(p.x * 3));
    const row = Math.min(2, Math.floor(p.y * 3));
    const idx = row * 3 + col;
    if (idx >= 0 && idx < 9) grid[idx]++;
  }
  // 正規化（密度）
  const total = points.length || 1;
  return grid.map(v => v / total);
}

/** 3×3グリッドの分布一致度 */
function calcGridMatchScore(userGrid, refGrid) {
  // コサイン類似度
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
