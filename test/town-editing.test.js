import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countPlacedItems,
  countMissionBuildings,
  trackPlacementGain,
  patchHistory,
  buildMegaIndex,
  applyUpgrade,
  canPlaceAt,
  releaseHiddenItems,
} from '../src/systems/town-editing.js';

const ITEMS = new Map([
  ['t_cleared', { id: 't_cleared', type: 'terrain' }],
  ['t_roughland', { id: 't_roughland', type: 'terrain' }],
  ['t_weed', { id: 't_weed', type: 'terrain' }],
  ['t_road', { id: 't_road', type: 'building', isFlat: true }],
  ['t_house1', { id: 't_house1', type: 'building' }],
  ['t_tree', { id: 't_tree', type: 'nature' }],
  ['t_temple', { id: 't_temple', type: 'special', size: { w: 2, h: 2 } }],
  ['t_bench', { id: 't_bench', type: 'decoration' }],
  ['t_shop', { id: 't_shop', type: 'building' }],
  ['t_house2', { id: 't_house2', type: 'building', size: { w: 2, h: 1 } }],
  ['t_house3', { id: 't_house3', type: 'building', size: { w: 3, h: 2 } }],
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

// 起動時の整合補正（storage.js getStats）と同じ: 持っている数 = max(持っている数, 置いてある数)
const reconcile = ({ townMap, townItems }) => {
  const placed = countPlacedItems(townMap);
  const items = { ...townItems };
  for (const [id, n] of Object.entries(placed)) {
    if (ITEMS.get(id)?.type !== 'terrain') items[id] = Math.max(items[id] || 0, n);
  }
  return items;
};

test('強化: 置いていない元の建物から使い、地図はそのまま', () => {
  const state = { townMap: { '1,1': 't_house1', '2,2': 't_cleared' }, townItems: { t_house1: 2 } };
  const r = applyUpgrade(state, { requires: 't_house1', quantity: 1, resultItemId: 't_house2', resultAmount: 1 }, ITEMS);
  assert.deepEqual(r.townItems, { t_house1: 1, t_house2: 1 });
  assert.equal(r.townMap['1,1'], 't_house1');
  assert.equal(r.replacedOnMap + r.clearedOnMap, 0);
  assert.deepEqual(reconcile(r), r.townItems, '次に起動しても数が変わらない');
});

test('強化: 置いてある元の建物を使うときは、その場で上位の建物に置きかえる', () => {
  const state = { townMap: { '1,1': 't_house1', '2,1': 't_cleared' }, townItems: { t_house1: 1 } };
  const r = applyUpgrade(state, { requires: 't_house1', quantity: 1, resultItemId: 't_house2', resultAmount: 1 }, ITEMS);
  assert.equal(r.townMap['1,1'], 't_house2');
  assert.equal(r.townMap['2,1'], 't_cleared', '2x1 の残りの足もとは更地');
  assert.equal(r.replacedOnMap, 1);
  assert.deepEqual(r.townItems, { t_house1: 0, t_house2: 1 });
  assert.deepEqual(reconcile(r), r.townItems, '次に起動しても元の建物が戻らない');
});

test('強化: 上位の建物が収まらなければ更地に戻し、上位の建物はもちものに入る', () => {
  // 右どなりに木があるので 2x1 は収まらない
  const state = { townMap: { '1,1': 't_house1', '2,1': 't_tree' }, townItems: { t_house1: 1, t_tree: 1 } };
  const r = applyUpgrade(state, { requires: 't_house1', quantity: 1, resultItemId: 't_house2', resultAmount: 1 }, ITEMS);
  assert.equal(r.townMap['1,1'], 't_cleared');
  assert.equal(r.townMap['2,1'], 't_tree');
  assert.equal(r.clearedOnMap, 1);
  assert.equal(r.townItems.t_house2, 1);
  assert.deepEqual(reconcile(r), r.townItems);
});

test('強化: 大きな建物から大きな建物へ（足もとを全部片づけてから置く）', () => {
  const state = {
    townMap: { '4,4': 't_house2', '5,4': 't_cleared', '6,4': 't_cleared', '4,5': 't_cleared', '5,5': 't_weed', '6,5': 't_cleared' },
    townItems: { t_house2: 1 },
  };
  const r = applyUpgrade(state, { requires: 't_house2', quantity: 1, resultItemId: 't_house3', resultAmount: 1 }, ITEMS);
  assert.equal(r.townMap['4,4'], 't_house3');
  assert.equal(r.townMap['5,4'], 't_cleared');
  assert.equal(r.townMap['5,5'], 't_cleared', 'ざっそうの上も更地にしてから置く');
  assert.equal(r.replacedOnMap, 1);
  assert.deepEqual(reconcile(r), r.townItems);
});

test('強化: 道の上に乗せた建物は、上に乗せられる形なら置きかえ、そうでなければ外す', () => {
  const state = { townMap: { '1,1': 't_road', '1,1:top': 't_house1', '3,3': 't_road', '3,3:top': 't_house1' }, townItems: { t_house1: 2, t_road: 2 } };
  const toShop = applyUpgrade(state, { requires: 't_house1', quantity: 1, resultItemId: 't_shop', resultAmount: 1 }, ITEMS);
  assert.equal(toShop.townMap['1,1:top'], 't_shop');
  assert.equal(toShop.townMap['3,3:top'], 't_house1');
  const toBig = applyUpgrade(state, { requires: 't_house1', quantity: 2, resultItemId: 't_house2', resultAmount: 2 }, ITEMS);
  assert.equal(toBig.townMap['1,1:top'], undefined);
  assert.equal(toBig.townMap['3,3:top'], undefined);
  assert.equal(toBig.townMap['1,1'], 't_road', '下の道は残る');
  assert.deepEqual(reconcile(toBig), toBig.townItems);
});

test('大きな建物の足もと（地図には更地と書いてあるマス）には、何も置けない', () => {
  const map = { '5,5': 't_temple', '6,5': 't_cleared', '5,6': 't_cleared', '6,6': 't_cleared', '7,5': 't_cleared', '7,6': 't_weed', '8,5': 't_roughland', '8,6': 't_cleared' };
  const index = buildMegaIndex(map, ITEMS);
  assert.equal(canPlaceAt(map, index, 6, 6), false, '足もとの右下のマス');
  assert.equal(canPlaceAt(map, index, 5, 5), false, '左上のマス（建物の id が書いてある）');
  assert.equal(canPlaceAt(map, index, 7, 5), true, 'となりの更地');
  assert.equal(canPlaceAt(map, index, 7, 6), true, 'ざっそうの上には置ける');
  assert.equal(canPlaceAt(map, index, 8, 5), false, '開拓していない土地');
  // 2×1 の建物: 足もとに かかるなら置けない
  assert.equal(canPlaceAt(map, index, 6, 6, 2, 1), false);
  assert.equal(canPlaceAt(map, index, 7, 6, 2, 1), true);
  assert.equal(canPlaceAt(map, index, 7, 5, 2, 1), false, '右のマスが荒れ地');
  // マップの外へ はみ出す場所には置けない
  assert.equal(canPlaceAt({ '49,49': 't_cleared' }, new Map(), 49, 49, 2, 1), false);
});

test('大きな建物の足もとに かくれていたものは、地図から外す（もちものに戻る）', () => {
  const map = {
    '5,5': 't_temple', '6,5': 't_house1', '5,6': 't_cleared', '6,6': 't_cleared', '6,6:top': 't_bench',
    '9,9': 't_house1', '9,10': 't_road', '9,10:top': 't_bench',
  };
  const { map: next, freed } = releaseHiddenItems(map, ITEMS);
  assert.deepEqual([...freed].sort(), ['t_bench', 't_house1']);
  assert.equal(next['6,5'], 't_cleared');
  assert.equal(next['6,6:top'], undefined);
  assert.equal(next['5,5'], 't_temple', '大きな建物そのものは残る');
  assert.equal(next['9,9'], 't_house1', 'ふつうに置いたものは残る');
  assert.equal(next['9,10:top'], 't_bench', '道の上に乗せたものは残る');
  assert.notEqual(next, map, '元の地図は書きかえない');
  assert.equal(map['6,5'], 't_house1');
});

test('大きな建物どうしが重なっていたら、あとの建物を外す。重なりが無ければ地図はそのまま', () => {
  // (5,5) のお寺の足もと (6,6) に、もう 1 つのお寺の左上がある
  const map = { '5,5': 't_temple', '6,5': 't_cleared', '5,6': 't_cleared', '6,6': 't_temple', '7,6': 't_cleared', '6,7': 't_cleared', '7,7': 't_cleared' };
  const { map: next, freed } = releaseHiddenItems(map, ITEMS);
  assert.deepEqual(freed, ['t_temple']);
  assert.equal(next['5,5'], 't_temple');
  assert.equal(next['6,6'], 't_cleared');

  const clean = { '5,5': 't_temple', '6,5': 't_cleared', '5,6': 't_cleared', '6,6': 't_cleared', '9,9': 't_house1' };
  const same = releaseHiddenItems(clean, ITEMS);
  assert.deepEqual(same.freed, []);
  assert.equal(same.map, clean, '何も外さないときは同じ地図を返す');
});

test('強化: 置きかえ先が、ほかの大きな建物の足もとに重なるなら置きかえない', () => {
  // 小さな家 (4,5) を 2×1 の大きな家にすると (5,5) に かかる。そこは お寺の足もと
  const townMap = { '4,5': 't_house1', '5,5': 't_cleared', '5,4': 't_temple', '6,4': 't_cleared', '6,5': 't_cleared' };
  const r = applyUpgrade({ townMap, townItems: { t_house1: 1 } },
    { requires: 't_house1', quantity: 1, resultItemId: 't_house2', resultAmount: 1 }, ITEMS);
  assert.equal(r.replacedOnMap, 0);
  assert.equal(r.clearedOnMap, 1);
  assert.equal(r.townMap['4,5'], 't_cleared');
  assert.equal(r.townItems.t_house2, 1, '上位の建物はもちものに入る');
});
