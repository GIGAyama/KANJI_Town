import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WALK_BLOCKED, WALK_GROUND, WALK_ROAD, buildWalkWorld, findPath, isCovered, isWalkable, nearestWalkable } from '../src/systems/town-walk.js';
import { createWalker, reconcileWalker, stepWalker, walkerCell } from '../src/systems/villager-walk.js';
import { C, GRID_SIZE } from '../src/systems/town-map-view.js';

// 住民は 地図の「歩ける所」だけを通る（前は 行き先へ まっすぐ歩き、家・水路・木の上を通りぬけていた）。

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

/** town-items.jsx から、テストに要る項目だけを読む（JSX なので import できない） */
const ITEMS = new Map([...read('../src/data/town-items.jsx').matchAll(/^\s*\{ id: '(t_\w+)',(.*)\},?\s*$/gm)].map((m) => {
  const rest = m[2];
  const size = /size: \{ w: (\d+), h: (\d+) \}/.exec(rest);
  return [m[1], {
    id: m[1],
    type: /type: '(\w+)'/.exec(rest)[1],
    isFlat: /isFlat: true/.test(rest),
    isoHeight: Number(/isoHeight: (\d+)/.exec(rest)?.[1] || 0),
    size: size ? { w: Number(size[1]), h: Number(size[2]) } : undefined,
  }];
}));

/** まわりを 草地（歩けない）にして、渡した所だけを置いた地図 */
function town(cells) {
  const map = {};
  for (let y = C - 8; y <= C + 8; y++) for (let x = C - 8; x <= C + 8; x++) map[`${x},${y}`] = 't_grassland';
  Object.assign(map, cells);
  return map;
}
/** 決まった順に数を返す（テストを くり返しても 同じ結果にする） */
function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; };
}

test('歩ける所: 道は 手間 1、更地などは 手間 3、建物・木・水・まだ ひらいていない土地・島の外は 歩けない', () => {
  const map = town({
    [`${C},${C}`]: 't_road', [`${C + 1},${C}`]: 't_bridge', [`${C + 2},${C}`]: 't_cleared', [`${C + 3},${C}`]: 't_grass_flat',
    [`${C},${C + 1}`]: 't_water', [`${C + 1},${C + 1}`]: 't_house1', [`${C + 2},${C + 1}`]: 't_tree', [`${C + 3},${C + 1}`]: 't_paddy',
    [`${C},${C + 2}`]: 't_road', [`${C},${C + 2}:top`]: 't_car', [`${C + 1},${C + 2}`]: 't_railway',
  });
  const world = buildWalkWorld(map, ITEMS, 6);
  const at = (dx, dy) => world.cost[(C + dy) * GRID_SIZE + C + dx];
  assert.deepEqual([at(0, 0), at(1, 0), at(2, 0), at(3, 0)], [WALK_ROAD, WALK_ROAD, WALK_GROUND, WALK_GROUND]);
  assert.deepEqual([at(0, 1), at(1, 1), at(2, 1), at(3, 1)], [WALK_BLOCKED, WALK_BLOCKED, WALK_BLOCKED, WALK_BLOCKED]);
  assert.equal(at(0, 2), WALK_BLOCKED, '車を のせた道');
  assert.equal(at(1, 2), WALK_BLOCKED, '線路');
  assert.equal(at(-5, 0), WALK_BLOCKED, '草地（まだ ひらいていない）');
  // 島の外（探索した範囲の外）は、更地でも歩けない
  const outside = buildWalkWorld({ [`${C + 9},${C}`]: 't_cleared' }, ITEMS, 6);
  assert.equal(isWalkable(outside, C + 9, C), false);
  assert.equal(isWalkable(world, -1, 0), false);
});

test('大きな建物は 足もと全体を ふさぎ、正面（+y・+x がわ）の歩けるマスが 戸口になる', () => {
  const cells = {};
  for (let y = C - 3; y <= C + 4; y++) for (let x = C - 3; x <= C + 4; x++) cells[`${x},${y}`] = 't_cleared';
  cells[`${C},${C}`] = 't_department'; // 2×2。下の 3 マスには 更地の字が残っている
  const world = buildWalkWorld(town(cells), ITEMS, 6);
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) assert.equal(isWalkable(world, C + dx, C + dy), false);
  const visit = world.visits.find((v) => v.x === C && v.y === C);
  assert.ok(visit && visit.type === 'building' && visit.w === 2 && visit.h === 2);
  // 正面が先: +y がわ（左手前）の 2 マス、+x がわ（右手前）の 2 マス、それから うしろ
  assert.deepEqual(visit.doors.slice(0, 4), [{ x: C, y: C + 2 }, { x: C + 1, y: C + 2 }, { x: C + 2, y: C }, { x: C + 2, y: C + 1 }]);
  assert.equal(visit.doors.length, 8);
  // 戸口が 1 つも無い建物（まわりが ぜんぶ 歩けない）は、立ち寄り先に入れない
  const lonely = buildWalkWorld(town({ [`${C},${C}`]: 't_house1' }), ITEMS, 6);
  assert.equal(lonely.visits.length, 0);
});

test('道のり: 建物を よけて通り、道があれば 少し遠回りでも 道を通る', () => {
  // 更地の広場の まん中に 家。左の はしから 右の はしへ
  const cells = {};
  for (let y = C - 2; y <= C + 2; y++) for (let x = C - 3; x <= C + 3; x++) cells[`${x},${y}`] = 't_cleared';
  cells[`${C},${C}`] = 't_house1';
  const world = buildWalkWorld(town(cells), ITEMS, 6);
  const path = findPath(world, { x: C - 3, y: C }, { x: C + 3, y: C });
  assert.ok(path && path.length >= 8, '家を よけていない');
  assert.ok(path.every((c) => isWalkable(world, c.x, c.y)));
  assert.deepEqual(path.at(-1), { x: C + 3, y: C });
  // となりどうしの マスだけを通る（ななめに 飛ばない）
  let prev = { x: C - 3, y: C };
  for (const c of path) { assert.equal(Math.abs(c.x - prev.x) + Math.abs(c.y - prev.y), 1); prev = c; }

  // まっすぐなら 6 マス（更地: 手間 18）。1 列 上に 道が通っていれば、そちらを通る（8 マス・手間 3+6+... ）
  const road = { ...cells };
  for (let x = C - 3; x <= C + 3; x++) road[`${x},${C - 2}`] = 't_road';
  delete road[`${C},${C}`];
  const roadWorld = buildWalkWorld(town(road), ITEMS, 6);
  const viaRoad = findPath(roadWorld, { x: C - 3, y: C - 1 }, { x: C + 3, y: C - 1 });
  assert.ok(viaRoad.filter((c) => c.y === C - 2).length >= 5, '道を通っていない');
});

test('道のり: 行けない所・歩けない所は null、同じ所は 0 マス', () => {
  const cells = { [`${C},${C}`]: 't_cleared', [`${C + 1},${C}`]: 't_cleared', [`${C + 4},${C}`]: 't_cleared' };
  const world = buildWalkWorld(town(cells), ITEMS, 6);
  assert.equal(findPath(world, { x: C, y: C }, { x: C + 4, y: C }), null, '島が はなれている');
  assert.equal(findPath(world, { x: C, y: C }, { x: C, y: C + 1 }), null, '行き先が 草地');
  assert.deepEqual(findPath(world, { x: C, y: C }, { x: C, y: C }), []);
  assert.deepEqual(findPath(world, { x: C, y: C }, { x: C + 1, y: C }), [{ x: C + 1, y: C }]);
});

test('いちばん近い歩けるマス（足もとが ふさがれたとき）', () => {
  const world = buildWalkWorld(town({ [`${C + 2},${C}`]: 't_cleared', [`${C},${C + 3}`]: 't_road' }), ITEMS, 6);
  assert.deepEqual(nearestWalkable(world, C, C), { x: C + 2, y: C });
  assert.deepEqual(nearestWalkable(world, C + 2, C), { x: C + 2, y: C });
  assert.equal(nearestWalkable(world, C - 6, C - 6, 3), null);
});

test('建物・木の うしろのマスは「かくれる」しるしが付く（背の低い 花・くさ では付かない）', () => {
  const cells = {};
  for (let y = C - 3; y <= C + 3; y++) for (let x = C - 3; x <= C + 3; x++) cells[`${x},${y}`] = 't_cleared';
  cells[`${C},${C}`] = 't_house1'; // isoHeight 24: ななめ うしろだけ
  cells[`${C + 2},${C + 2}`] = 't_flower'; // 8: 付かない
  const world = buildWalkWorld(town(cells), ITEMS, 6);
  assert.equal(isCovered(world, C - 1, C - 1), true);
  assert.equal(isCovered(world, C - 1, C), false);
  assert.equal(isCovered(world, C + 1, C + 1), false, '手前は かくれない');
  assert.equal(isCovered(world, C + 1, C + 1), false);
  // 木（28）は となりの うしろも
  const tree = buildWalkWorld(town({ ...cells, [`${C},${C}`]: 't_tree' }), ITEMS, 6);
  assert.equal(isCovered(tree, C - 1, C), true);
  assert.equal(isCovered(tree, C, C - 1), true);
});

// ── 住民 1 人の ふるまい ──

/** 道で つながった 2 つの店と、家のある町 */
function shoppingTown() {
  const cells = {};
  for (let y = C - 4; y <= C + 4; y++) for (let x = C - 4; x <= C + 4; x++) cells[`${x},${y}`] = 't_cleared';
  for (let x = C - 4; x <= C + 4; x++) cells[`${x},${C}`] = 't_road';
  cells[`${C - 2},${C - 2}`] = 't_shop';
  cells[`${C + 2},${C - 2}`] = 't_cafe';
  cells[`${C},${C + 2}`] = 't_house1';
  cells[`${C + 3},${C + 3}`] = 't_tree';
  return buildWalkWorld(town(cells), ITEMS, 6);
}

test('住民は 歩ける所だけを通り、建物の前に 立ち寄って ふきだしを出す', () => {
  const world = shoppingTown();
  const rand = seeded(7);
  const walkers = ['a', 'b', 'c', 'd'].map((id, i) => createWalker({ id, x: C - 3 + i * 2, y: C }, world, rand));
  const seen = { visit: 0, walk: 0, heart: 0, note: 0, chat: 0 };
  for (let t = 0; t < 4000; t++) {
    for (const w of walkers) {
      stepWalker(w, 1 / 30, world, walkers, rand);
      const cell = walkerCell(w);
      assert.ok(isWalkable(world, cell.x, cell.y), `${w.id} が 歩けない所 (${cell.x},${cell.y}) にいる`);
      seen[w.mode] = (seen[w.mode] || 0) + 1;
      if (w.emotion) seen[w.emotion] = (seen[w.emotion] || 0) + 1;
    }
  }
  assert.ok(seen.walk > 0 && seen.visit > 0, `歩いて 立ち寄っていない ${JSON.stringify(seen)}`);
  assert.ok(seen.heart > 0, '建物の前で ♥ を出していない');
  assert.ok(seen.note > 0, '木の前や 話すときに ♪ を出していない');
});

test('住民: 建物の前（戸口）で 建物のほうを向いて止まる', () => {
  const world = shoppingTown();
  const rand = seeded(3);
  const w = createWalker({ id: 'x', x: C, y: C }, world, rand);
  let visits = 0;
  for (let t = 0; t < 6000 && visits < 3; t++) {
    const before = w.mode;
    stepWalker(w, 1 / 30, world, [w], rand);
    if (before === 'walk' && w.mode === 'visit') {
      visits++;
      const cell = walkerCell(w);
      const visit = world.visits.find((v) => v.doors.some((d) => d.x === cell.x && d.y === cell.y));
      assert.ok(visit, '戸口ではない所で 立ち寄った');
      // 画面で 建物が 右にあれば 右を向く
      const screenDx = (visit.x + visit.w / 2 - w.x) - (visit.y + visit.h / 2 - w.y);
      if (Math.abs(screenDx) > 0.01) assert.equal(w.facesRight, screenDx > 0);
      // マスの まん中に 立つ
      assert.equal(w.x, cell.x + 0.5);
      assert.equal(w.y, cell.y + 0.5);
    }
  }
  assert.equal(visits, 3);
});

test('住民: 足もとが歩けない所なら いちばん近い歩けるマスから はじめ、近くに無ければ かくす', () => {
  const world = shoppingTown();
  const onShop = createWalker({ id: 'p', x: C - 2, y: C - 2 }, world);
  const cell = walkerCell(onShop);
  assert.ok(isWalkable(world, cell.x, cell.y));
  assert.ok(Math.abs(cell.x - (C - 2)) + Math.abs(cell.y - (C - 2)) <= 2);
  assert.equal(onShop.stranded, false);
  const lost = createWalker({ id: 'q', x: 2, y: 2 }, world);
  assert.equal(lost.stranded, true);
  stepWalker(lost, 1, world, [lost]);
  assert.equal(lost.mode, 'idle', 'かくした住民は 動かない');
  // 同じ住民は いつも同じ ずれ・速さ
  const again = createWalker({ id: 'p', x: C - 2, y: C - 2 }, world);
  assert.deepEqual([again.offsetX, again.offsetY, again.speed, again.phase], [onShop.offsetX, onShop.offsetY, onShop.speed, onShop.phase]);
});

test('住民: 地図が かわったら（足もとに 建物を置いた・道を消した）、歩ける所へ移り、通れない道のりは やめる', () => {
  const world = shoppingTown();
  const rand = seeded(11);
  const w = createWalker({ id: 'r', x: C - 4, y: C }, world, rand);
  // 歩きだすまで すすめる
  for (let t = 0; t < 600 && w.mode !== 'walk'; t++) stepWalker(w, 1 / 30, world, [w], rand);
  assert.equal(w.mode, 'walk');
  const here = walkerCell(w);
  // いまのマスに 家を建てる
  const cells = {};
  for (let y = C - 4; y <= C + 4; y++) for (let x = C - 4; x <= C + 4; x++) cells[`${x},${y}`] = 't_cleared';
  cells[`${here.x},${here.y}`] = 't_house1';
  const next = buildWalkWorld(town(cells), ITEMS, 6);
  reconcileWalker(w, next);
  const moved = walkerCell(w);
  assert.ok(isWalkable(next, moved.x, moved.y));
  assert.notDeepEqual(moved, here);
  assert.equal(w.mode, 'idle');
  assert.deepEqual(w.path, []);
  // 歩いている先の マスが ふさがれたら、そこで止まる
  const w2 = createWalker({ id: 's', x: C - 4, y: C }, world, rand);
  w2.mode = 'walk'; w2.path = findPath(world, { x: C - 4, y: C }, { x: C + 4, y: C }); w2.target = { kind: 'stroll' };
  const blocked = { ...cells };
  delete blocked[`${here.x},${here.y}`];
  blocked[`${C},${C}`] = 't_house1';
  const world3 = buildWalkWorld(town(blocked), ITEMS, 6);
  reconcileWalker(w2, world3);
  assert.equal(w2.mode, 'idle');
  assert.deepEqual(w2.path, []);
});

test('住民: となりで 立ち止まっている住民どうしは、向かいあって 話す', () => {
  const world = shoppingTown();
  const a = createWalker({ id: 'a1', x: C - 1, y: C }, world);
  const b = createWalker({ id: 'b1', x: C + 1, y: C }, world);
  a.timer = 0; b.timer = 99;
  // 「話す」を えらぶ数だけを返す
  const values = [0.55];
  stepWalker(a, 0.1, world, [a, b], () => values.shift() ?? 0.99);
  assert.equal(a.mode, 'chat');
  assert.equal(b.mode, 'chat');
  assert.equal(a.facesRight, true, 'a は 右の b を向く');
  assert.equal(b.facesRight, false, 'b は 左の a を向く');
  assert.ok(a.emotion && b.emotion);
});
