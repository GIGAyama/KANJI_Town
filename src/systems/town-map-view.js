// 町マップの見え方の計算 — マイ漢字タウン
// React に依存しない純粋な関数だけを置く（DraggableTownMap が使い、test/ から確かめる）。

export const TILE_W = 64;
export const TILE_H = 32;
export const GRID_SIZE = 50;
/** マップ中心 */
export const C = 25;

export const toIsoX = (gx, gy) => (gx - gy) * (TILE_W / 2);
export const toIsoY = (gx, gy) => (gx + gy) * (TILE_H / 2);
export const fromIso = (sx, sy) => ({
  x: Math.floor((sx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2),
  y: Math.floor((sy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2),
});

/** 表示範囲をこの幅のマス目にそろえる。ドラッグで少しずらしただけでは範囲が変わらない */
export const VIEW_RANGE_STEP = 4;
const VIEW_RANGE_MARGIN = 4;

/**
 * 画面に入るマスの範囲（整数 4 つ）を返す。
 * ドラッグ中は位置が 1px ずつ変わるが、範囲は VIEW_RANGE_STEP マスの境目を
 * またぐまで同じ値を返すので、全マスの作り直しが起きない。
 */
export function computeViewRange({ offsetX, offsetY, zoom, width, height }) {
  const z = zoom > 0 ? zoom : 1;
  const vl = -offsetX / z - TILE_W;
  const vt = -offsetY / z - 100;
  const vr = (-offsetX + width) / z + TILE_W;
  const vb = (-offsetY + height) / z + 100;
  const corners = [fromIso(vl, vt), fromIso(vr, vt), fromIso(vl, vb), fromIso(vr, vb)];
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const down = (v) => Math.floor(v / VIEW_RANGE_STEP) * VIEW_RANGE_STEP;
  const up = (v) => Math.ceil((v + 1) / VIEW_RANGE_STEP) * VIEW_RANGE_STEP - 1;
  return {
    startX: Math.max(0, down(Math.min(...xs) - VIEW_RANGE_MARGIN)),
    startY: Math.max(0, down(Math.min(...ys) - VIEW_RANGE_MARGIN)),
    endX: Math.min(GRID_SIZE - 1, up(Math.max(...xs) + VIEW_RANGE_MARGIN)),
    endY: Math.min(GRID_SIZE - 1, up(Math.max(...ys) + VIEW_RANGE_MARGIN)),
  };
}

/** 探索済み（霧が晴れている）マスか */
export const isExplored = (x, y, exploredRadius) => Math.max(Math.abs(x - C), Math.abs(y - C)) <= exploredRadius;

/**
 * 霧を描く SVG 1 枚の置き場所（町レイヤーの座標）。マップ全体（GRID_SIZE × GRID_SIZE マス）を覆う。
 * 霧はマスごとに div と svg を作らず、この 1 枚の中にひし形を並べる。
 */
export function fogFieldBounds() {
  const width = GRID_SIZE * TILE_W;
  const height = GRID_SIZE * TILE_H;
  // マス (0, GRID_SIZE-1) の左の頂点が x の最小（= -width/2）、マス (0,0) の上の頂点が y の最小（= 0）
  return { left: -width / 2, top: 0, width, height };
}

/** 探索範囲のすぐ外の 1 周か（ここだけは霧を 1 マスずつ描く） */
export const isFogRing = (x, y, exploredRadius) => Math.max(Math.abs(x - C), Math.abs(y - C)) === exploredRadius + 1;

/**
 * 大きな建物（size を持つもの）の絵は、足もとのマスより手前へはみ出す。霧に接している
 * ところでは、これまで手前の霧のマスがその絵の端を隠していたので、まわりの霧のマスも
 * 奥行き（z-index）つきで 1 マスずつ描く。そのマスの "x,y" を返す。
 * @param {{x:number,y:number,w:number,h:number}[]} anchors 大きな建物の左上のマスと大きさ
 */
export function buildLayeredFogKeys(anchors, exploredRadius) {
  const keys = new Set();
  for (const { x, y, w, h } of anchors) {
    for (let fy = y - 2; fy <= y + h + 1; fy++) {
      for (let fx = x - 2; fx <= x + w + 1; fx++) {
        if (fx < 0 || fy < 0 || fx >= GRID_SIZE || fy >= GRID_SIZE) continue;
        if (!isExplored(fx, fy, exploredRadius)) keys.add(`${fx},${fy}`);
      }
    }
  }
  return keys;
}

/** 住民の重なり順（奥行き）。マスの地面（depth）・平面（+10）・建物（+140）と同じものさし */
export const villagerDepth = (x, y) => Math.floor((x + y) * 100);

/** 住民が立ち寄りたくなる建物の種類 */
const POI_TYPES = new Set(['building', 'mega', 'rare', 'nature']);

/**
 * 住民の行き先の候補（建物のある座標）を 1 回だけ作る。
 * 住民が立ち止まるたびに 2,500 マスを調べなおさないため。
 */
export function buildPointsOfInterest(mapData, itemMap) {
  const points = [];
  for (const [key, itemId] of Object.entries(mapData || {})) {
    const item = itemMap.get(itemId);
    if (!item || !POI_TYPES.has(item.type)) continue;
    const [x, y] = key.split(',').map(Number);
    if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y, type: item.type });
  }
  return points;
}

/** (x,y) から半径 radius 以内（自分の足もとは除く）の候補を返す */
export function nearbyPointsOfInterest(points, x, y, radius = 6) {
  const out = [];
  for (const p of points) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d > 0.5 && d <= radius) out.push(p);
  }
  return out;
}
