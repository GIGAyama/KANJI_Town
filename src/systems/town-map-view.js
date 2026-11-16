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

/** 探索済み（島として見えている）マスか */
export const isExplored = (x, y, exploredRadius) => Math.max(Math.abs(x - C), Math.abs(y - C)) <= exploredRadius;

/** 拡大率の下限と上限 */
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 2.5;
export const clampZoom = (zoom) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));

/**
 * 画面の 1 点（anchorX, anchorY。町の枠の左上からの px）を動かさずに拡大率を変えたときの、
 * 町のレイヤーの位置を返す。
 *
 * 町のレイヤーは「枠の横のまん中」を原点に置き（left: 50%）、translate(offset) のあとに
 * 左上を基点にして scale(zoom) している。拡大率だけを変えると、町は原点（マップの
 * いちばん上の頂点）から遠ざかる向きへ動くので、大きくするたびに町が画面の下へ流れて
 * 見えなくなっていた。見ている場所を保つには、位置もいっしょに動かす。
 * @param {{ offsetX: number, offsetY: number, zoom: number }} view いまの位置と拡大率
 * @param {number} nextZoom 変えたあとの拡大率
 * @param {number} width 町の枠の幅（px）
 */
export function zoomAround({ offsetX, offsetY, zoom }, nextZoom, anchorX, anchorY, width) {
  const z = zoom > 0 ? zoom : 1;
  const mapX = (anchorX - width / 2 - offsetX) / z;
  const mapY = (anchorY - offsetY) / z;
  return {
    zoom: nextZoom,
    offsetX: anchorX - width / 2 - mapX * nextZoom,
    offsetY: anchorY - mapY * nextZoom,
  };
}

/**
 * 町がはじめて出るときの拡大率と位置（探索範囲の島が、枠にちょうど収まるように）。
 * @param {{ width: number, height: number, exploredRadius: number, isEditing?: boolean }} frame
 */
export function fitTownView({ width, height, exploredRadius, isEditing = false }) {
  const R = exploredRadius || 3;
  // 島の幅と高さ。高さには、建物の背・手前の がけ・その下の雲の分を足す
  const islandW = (2 * R + 2) * TILE_W;
  const islandH = (2 * R + 2) * TILE_H + 130;
  // まわりの余白。まちづくりでは上と下のボタンが重なるので広めにとる。
  // せまい画面（スマホ）では、余白が広すぎると町が豆つぶになるので、枠の大きさに合わせて減らす
  const padX = isEditing ? Math.min(110, width * 0.1) : Math.min(28, width * 0.05);
  const padY = isEditing ? Math.min(110, height * 0.14) : Math.min(28, height * 0.06);
  const zoom = Math.min(1.8, Math.max(ZOOM_MIN, Math.min((width - padX * 2) / islandW, (height - padY * 2) / islandH)));
  // 島のまん中（中心のマスのまん中）より少し下を、枠のまん中に合わせる
  const centerY = toIsoY(C, C) + TILE_H / 2 + 10;
  return { zoom, offsetX: 0, offsetY: height / 2 - centerY * zoom + (isEditing ? -36 : 0) };
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
