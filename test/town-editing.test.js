import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countPlacedItems,
  countMissionBuildings,
  trackPlacementGain,
  patchHistory,
  buildMegaIndex,
} from '../src/systems/town-editing.js';

const ITEMS = new Map([
  ['t_cleared', { id: 't_cleared', type: 'terrain' }],
  ['t_roughland', { id: 't_roughland', type: 'terrain' }],
  ['t_road', { id: 't_road', type: 'building', isFlat: true }],
  ['t_house1', { id: 't_house1', type: 'building' }],
  ['t_tree', { id: 't_tree', type: 'nature' }],
  ['t_temple', { id: 't_temple', type: 'special', size: { w: 2, h: 2 } }],
  ['t_bench', { id: 't_bench', type: 'decoration' }],
]);

test('置いてある数をアイテムごとに 1 回で数える（上乗せも含む）', () => {
  const map = { '1,1': 't_house1', '1,2': 't_house1', '2,2': 't_road', '2,2:top': 't_house1', '3,3': 't_cleared' };
  assert.deepEqual(countPlacedItems(map), { t_house1: 3, t_road: 1, t_cleared: 1 });
  assert.deepEqual(countPlacedItems(undefined), {});
});

test('ミッションに数えるのは建物・特別・大型・レアだけ', () => {
  const map = { '1,1': 't_house1', '1,2': 't_tree', '2,2': 't_bench', '3,3': 't_temple', '4,4': 't_cleared' };
  assert.equal(countMissionBuildings(map, ITEMS), 2);
});

test('新しく置いたときだけミッションが進み、動かす・置きなおすでは進まない', () => {
  const start = { '1,1': 't_house1', '1,2': 't_cleared', '1,3': 't_cleared' };
  let hw = countMissionBuildings(start, ITEMS);

  // 家を持ち上げる（地図から消える）→ 別の場所に置きなおす
  let r = trackPlacementGain(hw, { ...start, '1,1': 't_cleared' }, ITEMS);
  assert.equal(r.gained, 0); hw = r.highWater;
  r = trackPlacementGain(hw, { ...start, '1,1': 't_cleared', '1,3': 't_house1' }, ITEMS);
  assert.equal(r.gained, 0); hw = r.highWater;

  // もちものから新しく置く
  const placed = { ...start, '1,1': 't_cleared', '1,3': 't_house1', '1,2': 't_house1' };
  r = trackPlacementGain(hw, placed, ITEMS);
  assert.equal(r.gained, 1); hw = r.highWater;

  // もとに戻す → また置く、では増えない
  r = trackPlacementGain(hw, { ...placed, '1,2': 't_cleared' }, ITEMS);
  assert.equal(r.gained, 0); hw = r.highWater;
  r = trackPlacementGain(hw, placed, ITEMS);
  assert.equal(r.gained, 0);

  // 大きな建物（size を持つもの）も数える
  r = trackPlacementGain(hw, { ...placed, '5,5': 't_temple' }, ITEMS);
  assert.equal(r.gained, 1);
});

test('開拓は、もとに戻す履歴の全部に書きこむ（戻しても荒れ地に戻らない）', () => {
  const history = [
    { '1,1': 't_roughland', '2,2': 't_cleared' },
    { '1,1': 't_roughland', '2,2': 't_house1' },
  ];
  const patched = patchHistory(history, { '1,1': 't_cleared' });
  assert.deepEqual(patched.map((m) => m['1,1']), ['t_cleared', 't_cleared']);
  assert.deepEqual(patched.map((m) => m['2,2']), ['t_cleared', 't_house1'], 'ほかのマスはそのまま');
  assert.equal(history[0]['1,1'], 't_roughland', '元の履歴は書きかえない');
  assert.equal(patchHistory(history, undefined), history);
});

test('大きな建物は、どのマスからでも左上のマスを引ける', () => {
  const map = { '5,5': 't_temple', '6,5': 't_cleared', '5,6': 't_cleared', '6,6': 't_cleared', '7,7': 't_house1', '8,8': 't_road', '8,8:top': 't_house1' };
  const index = buildMegaIndex(map, ITEMS);
  for (const key of ['5,5', '6,5', '5,6', '6,6']) {
    assert.equal(index.get(key)?.anchorKey, '5,5', key);
    assert.equal(index.get(key)?.item.id, 't_temple');
  }
  assert.equal(index.get('7,7'), undefined, '1 マスの建物は入れない');
  assert.equal(index.get('7,6'), undefined);
  assert.equal(index.size, 4);
});
