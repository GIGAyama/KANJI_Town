import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CHUNK,
  GROUND_KINDS,
  KIND_NAMES,
  KIND_INDEX,
  buildGroundModel,
  castAt,
  chunkSignature,
  chunksInRange,
  groundKindOf,
  isGroundItem,
  isLandAt,
  kindAt,
} from '../src/systems/town-ground.js';
import { GROUND_ICON_VIEWBOX, cellHash, paintChunk, paintGroundIcon, shade } from '../src/systems/town-ground-paint.js';
import { C, GRID_SIZE } from '../src/systems/town-map-view.js';

// 町の地面は、1 マスずつ要素を作らず、かたまり（CHUNK × CHUNK マス）ごとに作った SVG の文字列を
// 1 枚の SVG に並べる。ここが例外を出すと町マップ全体が出なくなる（ホームがエラー画面になる）ので、
// 地面の種類を 1 つずつ・となりあわせで全部描いてみて、壊れた文字列が出ないことを確かめる。

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

const filled = (id) => {
  const map = {};
  for (let y = 0; y < GRID_SIZE; y++) for (let x = 0; x < GRID_SIZE; x++) map[`${x},${y}`] = id;
  return map;
};
const centerChunk = { cx: Math.floor(C / CHUNK), cy: Math.floor(C / CHUNK) };
const paintAll = (model, options) => chunksInRange({ startX: 0, startY: 0, endX: GRID_SIZE - 1, endY: GRID_SIZE - 1 })
  .filter(({ cx, cy }) => chunkSignature(model, cx, cy) !== '')
  .map(({ cx, cy }) => paintChunk(model, cx, cy, options));
const joined = (art) => art.under + art.ground + art.shadow + art.over;

/** SVG の文字列として壊れていないか（色や数に undefined・NaN が混ざっていないか） */
function assertCleanMarkup(markup, label) {
  assert.ok(!/undefined|NaN|Infinity|null/.test(markup), `${label}: 壊れた値が混ざっている → ${/.{30}(?:undefined|NaN|Infinity|null).{30}/.exec(markup)?.[0]}`);
  // 色はすべて #rrggbb
  for (const m of markup.matchAll(/(?:fill|stroke)="([^"]+)"/g)) {
    assert.ok(m[1] === 'none' || /^#[0-9a-f]{6}$/i.test(m[1]), `${label}: 色でない値 ${m[1]}`);
  }
  // path の d は、数と命令だけ
  for (const m of markup.matchAll(/ d="([^"]*)"/g)) {
    assert.ok(m[1].length > 0, `${label}: 空の path`);
    assert.ok(/^[MmLlHhVvQqTtAaCcSsZz0-9 .,\-]+$/.test(m[1]), `${label}: path に使えない文字 → ${/[^MmLlHhVvQqTtAaCcSsZz0-9 .,\-]/.exec(m[1])?.[0]}`);
  }
  assert.ok(!/<script|on\w+=|href=|url\(/i.test(markup), `${label}: 絵のほかのものが混ざっている`);
}

test('地図に置ける id は、すべて地面の種類が決まる', () => {
  for (const [id, item] of ITEMS) {
    const kind = groundKindOf(id, item);
    assert.ok(GROUND_KINDS[kind], `${id} → ${kind}`);
    assert.notEqual(kind, 'void', `${id} は地面を描く`);
  }
  assert.equal(groundKindOf(undefined, null), 'soil', '何も書いていないマスは更地');
  assert.equal(groundKindOf('t_house1', ITEMS.get('t_house1')), 'soil', '建物の足もとは更地');
  assert.equal(groundKindOf('t_tree', ITEMS.get('t_tree')), 'grass', '木の足もとは草地');
  assert.equal(groundKindOf('t_bridge', ITEMS.get('t_bridge')), 'water', '橋の下は水');
});

test('平らなアイテムは地面として描き、建物のレイヤーには出さない', () => {
  const flat = [...ITEMS.values()].filter((item) => item.isFlat);
  assert.ok(flat.length >= 10);
  for (const item of flat) {
    assert.ok(isGroundItem(item.id), `${item.id} は地面のレイヤーが描く`);
    assert.notEqual(groundKindOf(item.id, item), 'soil', `${item.id} に専用の地面の絵がある`);
  }
  // 橋・桜並木・ヤシの木・ざっそうは、地面（水・小道・砂・更地）の上に絵も立てる
  for (const id of ['t_bridge', 't_cherry_road', 't_palm', 't_weed']) assert.equal(isGroundItem(id), false, id);
  assert.equal(groundKindOf('t_palm', ITEMS.get('t_palm')), 'sand');
  for (const id of ['t_house1', 't_tree', 't_castle', 't_bench']) assert.equal(isGroundItem(id), false, id);
  // 地形そのものは、もちろん地面のレイヤーが描く
  for (const id of ['t_cleared', 't_grassland', 't_bedrock']) assert.equal(isGroundItem(id), true, id);
});

test('地面を描くのは、探索ずみのマスと、大きな建物の足もとだけ', () => {
  const map = filled('t_grassland');
  // 探索範囲（半径 3）の右下の角に 2×2 のお城。足もとの 3 マスは探索範囲の外
  map[`${C + 3},${C + 3}`] = 't_castle';
  const model = buildGroundModel(map, ITEMS, 3);
  assert.ok(isLandAt(model, C, C));
  assert.ok(isLandAt(model, C - 3, C + 3));
  assert.ok(!isLandAt(model, C - 4, C), '探索範囲の外');
  assert.ok(isLandAt(model, C + 4, C + 4), 'お城の足もとは、探索範囲の外でも地面を描く（建物が空に浮かないように）');
  assert.ok(!isLandAt(model, C + 5, C + 4));
  assert.ok(!isLandAt(model, -1, 0) && !isLandAt(model, GRID_SIZE, 0), 'マップの外');
  assert.equal(kindAt(model, C - 4, C), KIND_INDEX.void);
  // お城の足もとは、下に何が書いてあっても更地として描く
  assert.equal(KIND_NAMES[kindAt(model, C + 4, C + 4)], 'soil');
  assert.equal(KIND_NAMES[kindAt(model, C, C)], 'grass');
});

test('影を落とすのは立っているものだけ。大きさは絵の足もとに合わせる', () => {
  const map = filled('t_cleared');
  map[`${C},${C}`] = 't_house1';
  map[`${C + 2},${C}`] = 't_tree';
  map[`${C + 4},${C}`] = 't_road';
  map[`${C + 4},${C}:top`] = 't_car';
  map[`${C},${C + 2}`] = 't_castle';
  map[`${C + 3},${C + 2}`] = 't_garden';
  map[`${C - 2},${C}`] = 't_road';
  const model = buildGroundModel(map, ITEMS, 6);
  const house = castAt(model, C, C);
  assert.ok(house && !house.round && house.height > 0);
  assert.ok(castAt(model, C + 2, C).round, '木の影は丸い');
  assert.ok(castAt(model, C + 4, C).round, '道の上に乗せた車の影');
  assert.equal(castAt(model, C - 2, C), null, '道そのものは影を落とさない');
  const castle = castAt(model, C, C + 2);
  assert.deepEqual([castle.w, castle.h], [2, 2]);
  assert.ok(castle.bw > 1.5 && castle.bw <= 2, `お城の足もとの幅 ${castle.bw}`);
  assert.equal(castAt(model, C + 1, C + 3), null, '大きな建物の影は、左上のマスにだけ入れる');
  assert.equal(castAt(model, C + 3, C + 2), null, '庭園のような平たいものは影を落とさない');
});

test('地面の種類を 1 つずつ・となりあわせで全部描いても、壊れた SVG にならない', () => {
  const ids = [...ITEMS.keys()];
  // 1) 全部が同じ地面
  for (const id of ids) {
    const model = buildGroundModel(filled(id), ITEMS, 4);
    for (const art of paintAll(model, {})) assertCleanMarkup(joined(art), id);
  }
  // 2) いろいろな地面がとなりあう（境目・道のつながり・水ぎわ・がけ を全部通る）
  const kindsOnce = [];
  for (const id of ids) {
    const kind = groundKindOf(id, ITEMS.get(id));
    if (!ITEMS.get(id).size && !kindsOnce.some((k) => k.kind === kind)) kindsOnce.push({ id, kind });
  }
  assert.ok(kindsOnce.length >= KIND_NAMES.length - 1, `地面の種類を全部ためす（${kindsOnce.length} 種類）`);
  for (let shift = 0; shift < kindsOnce.length; shift++) {
    const map = {};
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) map[`${x},${y}`] = kindsOnce[(x * 3 + y * 5 + shift) % kindsOnce.length].id;
    }
    const model = buildGroundModel(map, ITEMS, 5);
    for (const options of [{}, { grid: true }, { danger: true }, { clouds: false }]) {
      for (const art of paintAll(model, options)) assertCleanMarkup(joined(art), `shift ${shift}`);
    }
  }
});

test('描く種類は、表（GROUND_KINDS）にあるもの全部', () => {
  for (const name of KIND_NAMES) {
    if (name === 'void') continue;
    const icon = paintGroundIcon(name);
    assert.ok(icon.includes('<path'), `${name} の絵が出る`);
    assertCleanMarkup(icon, `icon ${name}`);
  }
  assert.match(GROUND_ICON_VIEWBOX, /^-?\d+ -?\d+ \d+ \d+$/);
  // 知らない名前は更地として描く（例外にしない）
  assert.ok(paintGroundIcon('no-such-kind').includes('<path'));
});

test('草は土の上へ はみ出し、土は草の上へ はみ出さない', () => {
  const map = filled('t_cleared');
  const cx = centerChunk.cx * CHUNK + 2;
  const cy = centerChunk.cy * CHUNK + 2;
  map[`${cx},${cy}`] = 't_grassland';
  const model = buildGroundModel(map, ITEMS, 6);
  const { ground } = paintChunk(model, centerChunk.cx, centerChunk.cy, { clouds: false });
  const grassFill = /<path fill="(#[0-9a-f]{6})" d="[^"]*"\/>/g;
  const fills = [...ground.matchAll(grassFill)].map((m) => m[1]);
  // 草の色の path が 2 本ある: 草のマスそのものと、まわりの土のマスへの はみ出し
  const soilOnly = paintChunk(buildGroundModel(filled('t_cleared'), ITEMS, 6), centerChunk.cx, centerChunk.cy, { clouds: false }).ground;
  const soilFills = new Set([...soilOnly.matchAll(grassFill)].map((m) => m[1]));
  const grassColors = fills.filter((c) => !soilFills.has(c));
  assert.ok(grassColors.length >= 2, '草の地面と、はみ出しの 2 本');
  const grassOnly = paintChunk(buildGroundModel(filled('t_grassland'), ITEMS, 6), centerChunk.cx, centerChunk.cy, { clouds: false }).ground;
  // 全部が草なら、はみ出しは要らない（同じ色の path は地面の 1 本だけ）
  const base = [...grassOnly.matchAll(grassFill)].map((m) => m[1]);
  assert.equal(base.filter((c) => c === base[0]).length, 1);
});

test('道は、となりの道へつながる中央線を引く。十字路には引かない', () => {
  const lines = (map) => {
    const art = paintChunk(buildGroundModel(map, ITEMS, 6), centerChunk.cx, centerChunk.cy, { clouds: false }).ground;
    return [...art.matchAll(/stroke-dasharray="[^"]+"[^>]* d="([^"]*)"/g)].map((m) => m[1]).join('');
  };
  const x = centerChunk.cx * CHUNK + 2;
  const y = centerChunk.cy * CHUNK + 2;
  const alone = filled('t_cleared');
  alone[`${x},${y}`] = 't_road';
  const straight = { ...alone, [`${x - 1},${y}`]: 't_road', [`${x + 1},${y}`]: 't_road' };
  const corner = { ...alone, [`${x + 1},${y}`]: 't_road', [`${x},${y + 1}`]: 't_asphalt' };
  const cross = { ...straight, [`${x},${y - 1}`]: 't_road', [`${x},${y + 1}`]: 't_road' };
  assert.ok(lines(alone).length > 0, '1 マスだけの道にも短い線');
  assert.ok(/Q/.test(lines(corner)), '角は曲線でつなぐ（アスファルトと道は同じ なかま）');
  assert.ok(!/Q/.test(lines(straight)), 'まっすぐな道は直線');
  // 十字路のマスには線を引かない（腕の 4 マスの線だけになる）
  const count = (d) => (d.match(/M/g) || []).length;
  assert.equal(count(lines(cross)), 4);
  assert.equal(count(lines(straight)), 3);
});

test('島の ふち: 手前の辺に がけ、その下に雲。まん中の かたまりには無い', () => {
  const model = buildGroundModel(filled('t_grassland'), ITEMS, 3);
  const all = paintAll(model, {});
  assert.ok(all.some((art) => art.under.length > 0), 'がけ');
  assert.ok(all.some((art) => art.over.length > 0), 'がけの下の雲');
  const wide = buildGroundModel(filled('t_grassland'), ITEMS, 20);
  const middle = paintChunk(wide, centerChunk.cx, centerChunk.cy, {});
  assert.equal(middle.under, '');
  assert.equal(middle.over, '');
  // clouds: false なら雲を描かない（もちもの欄の見本）
  assert.ok(paintAll(model, { clouds: false }).every((art) => art.over === ''));
});

test('まちづくりの ます目と、復習がたまったときの雲の色', () => {
  const model = buildGroundModel(filled('t_grassland'), ITEMS, 3);
  const plain = paintChunk(model, centerChunk.cx, centerChunk.cy, {});
  const grid = paintChunk(model, centerChunk.cx, centerChunk.cy, { grid: true });
  assert.ok(grid.ground.length > plain.ground.length, 'ます目の線が足される');
  assert.equal(grid.under, plain.under);
  const day = paintAll(model, {}).map((art) => art.over).join('');
  const dark = paintAll(model, { danger: true }).map((art) => art.over).join('');
  assert.ok(day.includes('#ffffff') && !dark.includes('#ffffff'), '暗い町では白い雲にしない');
});

test('かたまりの絵は、中身と まわり 1 マスだけで決まる（同じなら作りなおさない）', () => {
  const map = filled('t_cleared');
  const before = buildGroundModel(map, ITEMS, 10);
  const { cx, cy } = centerChunk;
  const x0 = cx * CHUNK;
  const y0 = cy * CHUNK;
  const sig = chunkSignature(before, cx, cy);
  assert.ok(sig.length > 0);
  // かたまりの中に建物を置く → 変わる
  assert.notEqual(chunkSignature(buildGroundModel({ ...map, [`${x0 + 1},${y0 + 1}`]: 't_house1' }, ITEMS, 10), cx, cy), sig);
  // すぐ外（まわり 1 マス）に道を置く → 境目が変わるので、変わる
  assert.notEqual(chunkSignature(buildGroundModel({ ...map, [`${x0 - 1},${y0}`]: 't_road' }, ITEMS, 10), cx, cy), sig);
  // 2 マス以上はなれた場所 → 変わらない
  assert.equal(chunkSignature(buildGroundModel({ ...map, [`${x0 - 2},${y0}`]: 't_road' }, ITEMS, 10), cx, cy), sig);
  assert.equal(chunkSignature(buildGroundModel({ ...map, [`${x0 + CHUNK + 3},${y0 + CHUNK + 3}`]: 't_house1' }, ITEMS, 10), cx, cy), sig);
  // 地面を描くマスが無い かたまりは、何も描かない
  assert.equal(chunkSignature(buildGroundModel(map, ITEMS, 3), 0, 0), '');
  // 同じ入力なら、同じ絵
  assert.deepEqual(paintChunk(before, cx, cy, {}), paintChunk(buildGroundModel(map, ITEMS, 10), cx, cy, {}));
});

test('表示範囲にかかる かたまりを返す（マップの外へは出ない）', () => {
  const all = chunksInRange({ startX: 0, startY: 0, endX: GRID_SIZE - 1, endY: GRID_SIZE - 1 });
  assert.equal(all.length, (GRID_SIZE / CHUNK) ** 2);
  assert.equal(GRID_SIZE % CHUNK, 0, 'かたまりの 1 辺は、マップの 1 辺を割りきる');
  const some = chunksInRange({ startX: 12, startY: 8, endX: 19, endY: 11 });
  assert.deepEqual(some.map((c) => c.key), ['2,1', '3,1', '2,2', '3,2']);
  assert.deepEqual(chunksInRange({ startX: -8, startY: -8, endX: 2, endY: 2 }).map((c) => c.key), ['0,0']);
});

test('マスごとの でたらめな数は 0 以上 1 未満で、同じマスなら同じ。色の明暗も決まった値になる', () => {
  const seen = new Set();
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const v = cellHash(x, y, 3);
      assert.ok(v >= 0 && v < 1);
      assert.equal(v, cellHash(x, y, 3));
      seen.add(Math.floor(v * 10));
    }
  }
  assert.equal(seen.size, 10, 'かたよらない');
  assert.notEqual(cellHash(3, 4, 0), cellHash(4, 3, 0));
  assert.equal(shade('#808080', 0), '#808080');
  assert.equal(shade('#000000', 1), '#ffffff');
  assert.equal(shade('#ffffff', -1), '#000000');
  assert.match(shade('#9dd86b', -0.2), /^#[0-9a-f]{6}$/);
});
