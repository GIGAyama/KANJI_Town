import test from 'node:test';
import assert from 'node:assert/strict';
import {
  C,
  GRID_SIZE,
  VIEW_RANGE_STEP,
  computeViewRange,
  buildLayeredFogKeys,
  buildPointsOfInterest,
  nearbyPointsOfInterest,
  fogFieldBounds,
  isExplored,
  isFogRing,
  toIsoX,
  toIsoY,
  TILE_W,
  TILE_H,
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

test('表示範囲は VIEW_RANGE_STEP マスの境目にそろう', () => {
  const r = view(37, -333, 0.8);
  if (r.startX > 0) assert.equal(r.startX % VIEW_RANGE_STEP, 0);
  if (r.endX < GRID_SIZE - 1) assert.equal((r.endX + 1) % VIEW_RANGE_STEP, 0);
});

test('探索範囲と、そのすぐ外の 1 周', () => {
  assert.ok(isExplored(C + 3, C - 3, 3));
  assert.ok(!isExplored(C + 4, C, 3));
  assert.ok(isFogRing(C + 4, C - 2, 3));
  assert.ok(!isFogRing(C + 5, C, 3));
  assert.ok(!isFogRing(C, C, 3));
});

test('霧の SVG はマップ全体のひし形を覆う', () => {
  const b = fogFieldBounds();
  // マス (0, GRID_SIZE-1) の左の頂点と、マス (GRID_SIZE-1, 0) の右の頂点
  assert.equal(b.left, toIsoX(0, GRID_SIZE - 1) - TILE_W / 2);
  assert.equal(b.left + b.width, toIsoX(GRID_SIZE - 1, 0) + TILE_W / 2);
  assert.equal(b.top, toIsoY(0, 0));
  assert.equal(b.top + b.height, toIsoY(GRID_SIZE - 1, GRID_SIZE - 1) + TILE_H);
});

test('探索範囲の端にある大きな建物のまわりの霧は、奥行きつきで描く', () => {
  const R = 3;
  // 右下の角に 2x2 の建物。足もとの 3 マスは霧の中
  const keys = buildLayeredFogKeys([{ x: C + 3, y: C + 3, w: 2, h: 2 }], R);
  assert.ok(keys.has(`${C + 4},${C + 4}`));
  assert.ok(keys.has(`${C + 5},${C + 5}`), '手前にはみ出す絵を隠すマス');
  assert.ok(!keys.has(`${C + 3},${C + 3}`), '探索済みのマスは入れない');
  // 探索範囲のまん中の建物は、霧と関係しない
  assert.equal(buildLayeredFogKeys([{ x: C, y: C, w: 2, h: 2 }], R).size, 0);
});

test('住民の行き先の候補は地図から 1 回だけ作り、近いものを返す', () => {
  const items = new Map([
    ['t_house1', { type: 'building' }],
    ['t_tree', { type: 'nature' }],
    ['t_cleared', { type: 'terrain' }],
    ['t_bench', { type: 'decoration' }],
  ]);
  const map = {
    [`${C},${C}`]: 't_house1',
    [`${C + 3},${C}`]: 't_tree',
    [`${C + 1},${C}`]: 't_cleared',
    [`${C + 2},${C}`]: 't_bench',
    [`${C + 20},${C}`]: 't_house1',
    [`${C},${C}:top`]: 't_tree',
  };
  const points = buildPointsOfInterest(map, items);
  assert.deepEqual(points.map((p) => p.type).sort(), ['building', 'building', 'nature']);
  const near = nearbyPointsOfInterest(points, C, C, 6);
  // 足もと（距離 0）と遠いものは外れる
  assert.deepEqual(near, [{ x: C + 3, y: C, type: 'nature' }]);
});
