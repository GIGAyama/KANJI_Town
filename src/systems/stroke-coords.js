/**
 * 書いた線の座標を、キャンバスの大きさに左右されない 0〜1 の比率で持つための変換。
 *
 * 以前は書いた線をキャンバスの px で持っていたので、画面を回したりブラウザの枠が
 * 伸び縮みしたりしてキャンバスの大きさが変わると、なぞりの回数・書いた線・書きかけの
 * テストを全部消して最初からにしていた。比率で持てば、新しい大きさで描きなおせる。
 * 採点（gradeStrokes）と字形の解析（Analyzer）も、もともと 0〜1 の座標を使う。
 */

/**
 * キャンバスの px の点の並びを、0〜1 の比率にする。
 * @param {Array<{x: number, y: number, time?: number}>} points
 * @param {number} canvasSize - CSS px での一辺
 * @returns {Array<{x: number, y: number, time?: number}>}
 */
export function toNormalizedStroke(points, canvasSize) {
  if (!Array.isArray(points) || !(canvasSize > 0)) return [];
  return points.map((p) => ({ ...p, x: p.x / canvasSize, y: p.y / canvasSize }));
}

/**
 * 0〜1 の比率の点の並びを、いまのキャンバスの px にする。
 * @param {Array<{x: number, y: number, time?: number}>} points
 * @param {number} canvasSize - CSS px での一辺
 * @returns {Array<{x: number, y: number, time?: number}>}
 */
export function toCanvasStroke(points, canvasSize) {
  if (!Array.isArray(points) || !(canvasSize > 0)) return [];
  return points.map((p) => ({ ...p, x: p.x * canvasSize, y: p.y * canvasSize }));
}

/**
 * 比率で持っている線を、キャンバスに描きなおす。
 * @param {CanvasRenderingContext2D|null|undefined} ctx
 * @param {Array<Array<{x: number, y: number}>>} strokes - 0〜1 の比率
 * @param {number} canvasSize
 */
export function strokeNormalizedPaths(ctx, strokes, canvasSize) {
  if (!ctx || !Array.isArray(strokes)) return;
  strokes.forEach((stroke) => {
    const points = toCanvasStroke(stroke, canvasSize);
    if (points.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    if (points.length === 1) ctx.lineTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  });
}
