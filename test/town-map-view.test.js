import test from 'node:test';
import assert from 'node:assert/strict';
import {
  C,
  GRID_SIZE,
  VIEW_RANGE_STEP,
  computeViewRange,
  isExplored,
  toIsoX,
  toIsoY,
  fromIso,
  TILE_W,
  TILE_H,
  ZOOM_MIN,
  ZOOM_MAX,
  clampZoom,
  zoomAround,
  fitTownView,
} from '../src/systems/town-map-view.js';

const view = (offsetX, offsetY, zoom = 0.6) => computeViewRange({ offsetX, offsetY, zoom, width: 900, height: 520 });

test('表示範囲は整数 4 つで、マップの外へはみ出さない', () => {
  const r = view(0, -200);
  for (const k of ['startX', 'startY', 'endX', 'endY']) assert.ok(Number.isInteger(r[k]), k);
  assert.ok(r.startX >= 0 && r.startY >= 0);
  assert.ok(r.endX <= GRID_SIZE - 1 && r.endY <= GRID_SIZE - 1);
  assert.ok(r.startX <= C && r.endX >= C, '中心が入っている');
});

test('数 px ずらしただけでは表示範囲が変わらない（ドラッグ中に全マスを作り直さない）', () => {
  const base = view(0, -400, 1);
  let changes = 0;
  let prev = base;
  for (let i = 1; i <= 40; i++) {
    const next = view(i * 2, -400 + i, 1);
    if (JSON.stringify(next) !== JSON.stringify(prev)) changes++;
    prev = next;
  }
  // 80px・40px ずらす間に、範囲が変わるのは境目をまたいだ数回だけ
  assert.ok(changes <= 4, `範囲が ${changes} 回変わった`);
});

test('画面に見えているマスは、かならず表示範囲に入る（横長の画面の 左の角も）', () => {
  // 町のレイヤーの原点は「枠の横のまん中」（left: 50%）。以前は 横を「原点から右へ 枠の幅の分」と
  // して計算していたので、窓が 枠の幅の半分だけ右へ ずれていた。横長の画面で町を小さくして見ると、
  // 左上と左下の角で 地面と建物が ななめに切れて消えた。
  let visible = 0;
  for (const [width, height] of [[1280, 616], [430, 500], [820, 1100]]) {
    for (const zoom of [0.25, 0.33, 0.5, 0.8, 1, 1.6, 2.5]) {
      // 町の いろいろな場所 (tx, ty) を、画面の上のほう・まん中・下のほうに置く
      for (let tx = 0; tx <= GRID_SIZE; tx += 10) for (let ty = 0; ty <= GRID_SIZE; ty += 10) for (const fy of [0.15, 0.5, 0.85]) {
        const offsetX = -toIsoX(tx, ty) * zoom;
        const offsetY = height * fy - toIsoY(tx, ty) * zoom;
        const r = computeViewRange({ offsetX, offsetY, zoom, width, height });
        const inRange = (x, y) => x >= r.startX && x <= r.endX && y >= r.startY && y <= r.endY;
        for (let y = 0; y < GRID_SIZE; y++) for (let x = 0; x < GRID_SIZE; x++) {
          const sx = width / 2 + offsetX + toIsoX(x + 0.5, y + 0.5) * zoom;
          const sy = offsetY + toIsoY(x + 0.5, y + 0.5) * zoom;
          if (sx < 0 || sx > width || sy < 0 || sy > height) continue;
          visible++;
          assert.ok(inRange(x, y), `${width}×${height} 拡大率 ${zoom}: 画面の (${Math.round(sx)}, ${Math.round(sy)}) に見えるマス (${x}, ${y}) が範囲の外 ${JSON.stringify(r)}`);
          // 大きな建物（4×5 マスまで）は 左上のマスにだけ id がある。そのマスも範囲に入っていないと、建物ごと消える
          assert.ok(inRange(Math.max(0, x - 3), Math.max(0, y - 4)), `${width}×${height} 拡大率 ${zoom}: (${x}, ${y}) を足もとに持つ建物の 左上のマスが範囲の外`);
        }
      }
    }
  }
  assert.ok(visible > 100000, '見えているマスを数えている');
});

test('表示範囲は、画面の右へ よぶんに広がらない', () => {
  // 横 1280 の画面で、町のまん中を 2 倍で見る。画面に見えるのは 町の座標で 横 -320〜320
  const zoom = 2;
  const r = computeViewRange({ offsetX: -toIsoX(C, C) * zoom, offsetY: 308 - toIsoY(C, C) * zoom, zoom, width: 1280, height: 616 });
  // 左上の角のマスは (11, 23)、右上の角のマスは (23, 11)。そこから よゆう 4 マスを取り、4 マスの境目に そろえる
  assert.equal(r.startX, 4, '左（以前は 12 で、左上の角のマスが 範囲の外だった）');
  assert.equal(r.startY, 4, '右（以前は 0 で、画面の外のマスを よぶんに作っていた）');
});

test('表示範囲は VIEW_RANGE_STEP マスの境目にそろう', () => {
  const r = view(37, -333, 0.8);
  if (r.startX > 0) assert.equal(r.startX % VIEW_RANGE_STEP, 0);
  if (r.endX < GRID_SIZE - 1) assert.equal((r.endX + 1) % VIEW_RANGE_STEP, 0);
});

test('探索範囲（島として見えているマス）', () => {
  assert.ok(isExplored(C + 3, C - 3, 3));
  assert.ok(isExplored(C, C, 3));
  assert.ok(!isExplored(C + 4, C, 3));
  assert.ok(!isExplored(C, C - 4, 3));
});

// 町のレイヤーは「枠の横のまん中」を原点に置き、translate(offset) のあとに左上を基点に scale(zoom) する。
// 画面の点 (px, py) に見えているマップ上の点は、その逆変換で求まる
const mapPointAt = (view, px, py, width) => ({
  x: (px - width / 2 - view.offsetX) / view.zoom,
  y: (py - view.offsetY) / view.zoom,
});

test('拡大率を変えても、基点に見えている場所は動かない（町が画面の外へ流れない）', () => {
  const width = 900;
  const height = 520;
  const start = { offsetX: 40, offsetY: -300, zoom: 0.8 };
  // 画面のまん中を基点に、大きく → 小さく
  let view = start;
  const center = mapPointAt(view, width / 2, height / 2, width);
  for (const nextZoom of [1, 1.25, 1.6, 2, 1.2, 0.5]) {
    view = zoomAround(view, nextZoom, width / 2, height / 2, width);
    assert.equal(view.zoom, nextZoom);
    const now = mapPointAt(view, width / 2, height / 2, width);
    assert.ok(Math.abs(now.x - center.x) < 1e-6 && Math.abs(now.y - center.y) < 1e-6, `拡大率 ${nextZoom} で中心がずれた`);
  }
  // 指のあいだ（まん中ではない点）を基点にしても同じ
  const finger = mapPointAt(start, 120, 400, width);
  const pinched = zoomAround(start, 1.7, 120, 400, width);
  const after = mapPointAt(pinched, 120, 400, width);
  assert.ok(Math.abs(after.x - finger.x) < 1e-6 && Math.abs(after.y - finger.y) < 1e-6);
});

test('拡大率だけを変えると町が流れることを、位置もいっしょに動かして防いでいる', () => {
  const width = 900;
  const height = 520;
  const start = { offsetX: 0, offsetY: -300, zoom: 0.6 };
  const next = zoomAround(start, 1.5, width / 2, height / 2, width);
  // 以前は offset を変えなかったので、中心のマスが画面の下へ 700px 以上流れていた
  const centerY = (toIsoY(C, C) + TILE_H / 2);
  const before = centerY * start.zoom + start.offsetY;
  const naive = centerY * 1.5 + start.offsetY;
  const fixed = centerY * next.zoom + next.offsetY;
  assert.ok(naive - before > 700, '位置を動かさないと、町は大きく流れる');
  assert.ok(Math.abs(fixed - height / 2) < Math.abs(naive - height / 2), '基点つきなら、画面のまん中の近くにとどまる');
  assert.ok(fixed > 0 && fixed < height, '中心のマスは画面の中にある');
});

test('拡大率は下限と上限のあいだに収める', () => {
  assert.equal(clampZoom(0.01), ZOOM_MIN);
  assert.equal(clampZoom(99), ZOOM_MAX);
  assert.equal(clampZoom(1), 1);
  assert.ok(ZOOM_MIN < 1 && ZOOM_MAX > 1);
});

test('はじめの表示: 島が枠に収まり、中心のマスが枠のまん中あたりに来る', () => {
  for (const [width, height, exploredRadius, isEditing] of [[900, 520, 3, false], [1280, 650, 9, true], [360, 300, 3, false], [1280, 650, 23, true]]) {
    const fit = fitTownView({ width, height, exploredRadius, isEditing });
    assert.ok(fit.zoom >= ZOOM_MIN && fit.zoom <= 1.8, `拡大率 ${fit.zoom}`);
    assert.equal(fit.offsetX, 0);
    // 島の左右の端（探索範囲の左の頂点・右の頂点）が枠に入る（下限の拡大率に当たるほど大きい町は除く）
    const left = width / 2 + toIsoX(C - exploredRadius, C + exploredRadius + 1) * fit.zoom;
    const right = width / 2 + toIsoX(C + exploredRadius + 1, C - exploredRadius) * fit.zoom;
    if (fit.zoom > ZOOM_MIN) assert.ok(left >= 0 && right <= width, `島が枠からはみ出す (${left}, ${right})`);
    // 中心のマスは、枠の上下のまん中から 枠の高さの 2 割以内
    const centerY = (toIsoY(C, C) + TILE_H / 2) * fit.zoom + fit.offsetY;
    assert.ok(Math.abs(centerY - height / 2) < height * 0.2, `中心が ${centerY}`);
    // その拡大率と位置で、中心のマスを指せる
    const grid = fromIso((width / 2 - width / 2 - fit.offsetX) / fit.zoom, (centerY - fit.offsetY) / fit.zoom);
    assert.deepEqual(grid, { x: C, y: C });
  }
});

