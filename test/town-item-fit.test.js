import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FITTED_ITEM_IDS, itemFit } from '../src/data/town-item-fit.js';

// 建物の絵は 1 枚ずつ、足もとの位置も大きさも ちがう決まりで描いてある。置き方の表
// （town-item-fit.js）に載せ忘れた大きな建物は、置いたマスからずれて描かれる
// （以前は全部がそうで、建物を押しても動かせない・手前の建物に めりこむ、の原因だった）。

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const ITEMS = [...read('../src/data/town-items.jsx').matchAll(/^\s*\{ id: '(t_\w+)',(.*)\},?\s*$/gm)].map((m) => {
  const size = /size: \{ w: (\d+), h: (\d+) \}/.exec(m[2]);
  return { id: m[1], type: /type: '(\w+)'/.exec(m[2])[1], size: size ? { w: Number(size[1]), h: Number(size[2]) } : undefined };
});
const byId = new Map(ITEMS.map((item) => [item.id, item]));

test('大きさを持つアイテムは、すべて置き方の表に載っている', () => {
  const sized = ITEMS.filter((item) => item.size);
  assert.ok(sized.length >= 45);
  const missing = sized.filter((item) => !FITTED_ITEM_IDS.includes(item.id)).map((item) => item.id);
  assert.deepEqual(missing, []);
});

test('表の id は、すべて町のアイテムにある（消したアイテムの行が残っていない）', () => {
  const unknown = FITTED_ITEM_IDS.filter((id) => !byId.has(id));
  assert.deepEqual(unknown, []);
});

test('大きな建物の絵の足もとは、置いたマスに収まる', () => {
  for (const item of ITEMS.filter((it) => it.size)) {
    const fit = itemFit(item);
    assert.ok(fit.s > 0.2 && fit.s < 1.5, `${item.id} の大きさ ${fit.s}`);
    assert.ok(fit.bw > 0 && fit.bw <= item.size.w + 0.06, `${item.id}: 足もとの幅 ${fit.bw} が ${item.size.w} マスを超える`);
    assert.ok(fit.bh > 0 && fit.bh <= item.size.h + 0.06, `${item.id}: 足もとの奥行き ${fit.bh} が ${item.size.h} マスを超える`);
    assert.ok(Number.isFinite(fit.ax) && Number.isFinite(fit.ay));
  }
});

test('1 マスのものは大きさを変えず、足もとの位置だけを直す', () => {
  for (const id of FITTED_ITEM_IDS) {
    const item = byId.get(id);
    if (item.size) continue;
    const fit = itemFit(item);
    assert.equal(fit.s, 0.32, id);
    assert.equal(fit.flip, false, id);
    assert.ok(fit.bw <= 1 && fit.bh <= 1, id);
  }
  // 表に無い 1 マスのもの（木・お店など）は、足もとのまん中が (0, -50)
  assert.deepEqual(itemFit(byId.get('t_tree')), { ax: 0, ay: -50, s: 0.32, bw: 0.86, bh: 0.86, flip: false });
  assert.deepEqual(itemFit(null), itemFit(byId.get('t_tree')));
});

test('表に無い大きな建物は、足もとが 88% の ひし形の絵として、マスに収まる大きさで置く', () => {
  const fit = itemFit({ id: 't_future_building', size: { w: 3, h: 2 } });
  assert.equal(fit.ay, -47);
  assert.ok(fit.bw <= 2 && fit.bh <= 2, '短い辺（2 マス）に合わせる');
  assert.ok(Math.abs(fit.s * 88 - 0.94 * 64) < 1e-9, '足もとの半分の幅が、2 マス分の 94% になる');
});

test('うら返して置く絵は、長い向きが足もとの長い向きに合っている', () => {
  // 水車小屋を描きなおしてからは、うら返して置く絵は無い（描きなおした絵は、敷地の向きに合わせて描いてある）
  const flipped = FITTED_ITEM_IDS.filter((id) => itemFit(byId.get(id)).flip);
  assert.deepEqual(flipped, []);
  for (const id of flipped) {
    const item = byId.get(id);
    const fit = itemFit(item);
    assert.equal(fit.bw > fit.bh, item.size.w > item.size.h, id);
  }
});
