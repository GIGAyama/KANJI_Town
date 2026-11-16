import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEAD_LAND,
  applyHeavyPenalty,
  heavyPenaltiesOn,
  lastRestorableIndex,
  previewCarelessPenalty,
  restoreHeavyPenalty,
  summarizePenalty,
  totalPenalty,
} from '../src/systems/careless-penalty.js';
import { CARELESS, MAP } from '../src/constants/gameConfig.js';
import { getExpForLevel, getLevelInfoFromExp } from '../src/utils/level-system.js';

// てきとう書き（ほとんど書かずに答え合わせをした）への重いペナルティ。
// 子どもの持ち物を大きく減らすので、「何を・どれだけ・いつ」科すかと、元に戻せることを確かめる。

const ITEMS = new Map([
  ['t_cleared', { type: 'terrain' }], ['t_weed', { type: 'terrain' }], ['t_roughland', { type: 'terrain' }],
  ['t_grassland', { type: 'terrain' }], ['t_bedrock', { type: 'terrain' }], [DEAD_LAND, { type: 'terrain' }],
  ['t_house1', { type: 'building' }], ['t_shop', { type: 'building' }], ['t_tree', { type: 'nature' }],
  ['t_road', { type: 'decoration', isFlat: true }], ['t_castle', { type: 'mega', size: { w: 2, h: 2 } }],
]);
const C = MAP.CENTER;
const at = (dx, dy) => `${C + dx},${C + dy}`;
const TODAY = '2026-11-16';
const TOMORROW = '2026-11-17';

/** 0, 1, 2 … と順に返す乱数（0 以上 1 未満）。端数の切り上げ・並べかえを決まった形にする */
const sequence = (...values) => { let i = 0; return () => values[i++ % values.length]; };
const never = () => 0.99; // 端数は切り捨て・並びは変えない
const always = () => 0; // 端数は切り上げ

/** 中心のまわり 7x7 を更地にした町（外側は荒れ地） */
function town(extra = {}) {
  const townMap = {};
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) townMap[at(dx, dy)] = Math.max(Math.abs(dx), Math.abs(dy)) <= 3 ? 't_cleared' : 't_roughland';
  }
  return {
    totalExp: 0, coins: 1001, exploredRadius: 5, townMap,
    townItems: {}, materials: {}, ...extra,
  };
}
const freeze = (value) => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };

test('段は通算の回数で重くなり、最後の段をくり返す', () => {
  assert.deepEqual(previewCarelessPenalty({}, TODAY).step, CARELESS.HEAVY_STEPS[0]);
  assert.equal(previewCarelessPenalty({}, TODAY).strike, 1);
  assert.deepEqual(previewCarelessPenalty({ carelessStrikes: 1 }, TODAY).step, CARELESS.HEAVY_STEPS[1]);
  const last = CARELESS.HEAVY_STEPS[CARELESS.HEAVY_STEPS.length - 1];
  assert.deepEqual(previewCarelessPenalty({ carelessStrikes: 2 }, TODAY).step, last);
  assert.deepEqual(previewCarelessPenalty({ carelessStrikes: 40 }, TODAY).step, last);
  // 次に やると何が足されるか（画面で知らせる）
  assert.deepEqual(previewCarelessPenalty({}, TODAY).nextStep, CARELESS.HEAVY_STEPS[1]);
  // こわれた数でも落ちない
  assert.equal(previewCarelessPenalty({ carelessStrikes: 'x', carelessLog: 'y' }, TODAY).strike, 1);
  assert.equal(previewCarelessPenalty(null, TODAY).heavy, true);
});

test('いまの決まり: 1回目はコインともちものの半分と素材の全部、2回目からレベル10、3回目から土地5マス', () => {
  assert.deepEqual(CARELESS.HEAVY_STEPS, [
    { coins: 0.5, items: 0.5, materials: 1 },
    { coins: 0.5, items: 0.5, materials: 1, levels: 10 },
    { coins: 0.5, items: 0.5, materials: 1, levels: 10, land: 5 },
  ]);
  assert.equal(CARELESS.HEAVY_PER_DAY, 1);
});

test('1回目: コインは半分（切り捨て）、素材は全部なくなる。レベルと土地はそのまま', () => {
  const before = freeze(town({ totalExp: getExpForLevel(30) + 5, materials: { wood: 12, stone: 3, kanjistone: 1 } }));
  const { stats, entry } = applyHeavyPenalty(before, { today: TODAY, itemMap: ITEMS, rng: never });
  assert.equal(stats.coins, 501);
  assert.equal(entry.coins, 500);
  assert.deepEqual(stats.materials, {});
  assert.deepEqual(entry.materials, { wood: 12, stone: 3, kanjistone: 1 });
  assert.equal(stats.totalExp, before.totalExp);
  assert.equal(entry.exp, undefined);
  assert.equal(entry.land, undefined);
  assert.deepEqual(stats.townMap, before.townMap);
  assert.equal(stats.carelessStrikes, 1);
  assert.deepEqual(stats.carelessLog, [entry]);
  assert.equal(entry.date, TODAY);
  assert.equal(entry.strike, 1);
  // もとの記録は書きかえない（凍らせてあるので、書きかえていれば例外になる）
  assert.equal(before.coins, 1001);
});

test('もちものは半分。置いていない分から先に減らし、足りなければ町の建物が無くなる', () => {
  // 家4軒（4軒とも町に置いてある）・木6本（2本だけ置いてある）
  const before = town({ townItems: { t_house1: 4, t_tree: 6 } });
  before.townMap[at(0, 0)] = 't_house1'; before.townMap[at(1, 0)] = 't_house1';
  before.townMap[at(2, 0)] = 't_house1'; before.townMap[at(3, 0)] = 't_house1';
  before.townMap[at(0, 2)] = 't_tree'; before.townMap[at(1, 2)] = 't_tree';
  const { stats, entry } = applyHeavyPenalty(freeze(before), { today: TODAY, itemMap: ITEMS, rng: never });
  assert.deepEqual(stats.townItems, { t_house1: 2, t_tree: 3 });
  assert.deepEqual(entry.items, { t_house1: 2, t_tree: 3 });
  // 家は2軒が町から無くなり（更地に戻る）、木は置いていない3本だけが減る
  const houses = Object.values(stats.townMap).filter((id) => id === 't_house1').length;
  const trees = Object.values(stats.townMap).filter((id) => id === 't_tree').length;
  assert.equal(houses, 2);
  assert.equal(trees, 2);
  assert.equal(entry.placed.length, 2);
  for (const [key, id] of entry.placed) { assert.equal(id, 't_house1'); assert.equal(stats.townMap[key], 't_cleared'); }
  // 持っている数は、置いてある数を下回らない（下回ると、起動のときの補正で元に戻ってしまう）
  for (const [id, owned] of Object.entries(stats.townItems)) {
    assert.ok(owned >= Object.values(stats.townMap).filter((v) => v === id).length, id);
  }
});

test('1個だけのもちものは、半分の確率で失う（端数は乱数で決める）', () => {
  const before = town({ townItems: { t_shop: 1, t_tree: 3 } });
  assert.deepEqual(applyHeavyPenalty(before, { today: TODAY, itemMap: ITEMS, rng: never }).stats.townItems, { t_shop: 1, t_tree: 2 });
  assert.deepEqual(applyHeavyPenalty(before, { today: TODAY, itemMap: ITEMS, rng: always }).stats.townItems, { t_tree: 1 });
});

test('地面（terrain）と、表に無いアイテムは、もちものとして数えない', () => {
  const before = town({ townItems: { t_cleared: 9, t_unknown: 8, t_tree: 2 } });
  const { stats, entry } = applyHeavyPenalty(before, { today: TODAY, itemMap: ITEMS, rng: never });
  assert.deepEqual(stats.townItems, { t_cleared: 9, t_unknown: 8, t_tree: 1 });
  assert.deepEqual(entry.items, { t_tree: 1 });
});

test('道の上に建物が乗っているとき、下の道は残し、上の建物だけを取りのぞける', () => {
  const before = town({ townItems: { t_road: 2, t_shop: 2 } });
  before.townMap[at(0, 0)] = 't_road'; before.townMap[`${at(0, 0)}:top`] = 't_shop';
  before.townMap[at(1, 0)] = 't_road'; before.townMap[`${at(1, 0)}:top`] = 't_shop';
  const { stats, entry } = applyHeavyPenalty(freeze(before), { today: TODAY, itemMap: ITEMS, rng: never });
  // 道は2本とも上に建物があるので取りのぞけない → 持っている数も減らさない
  assert.equal(stats.townItems.t_road, 2);
  assert.equal(entry.items.t_road, undefined);
  // 建物は1つ無くなる（上乗せの記録ごと消える）
  assert.equal(stats.townItems.t_shop, 1);
  assert.equal(Object.keys(stats.townMap).filter((key) => key.endsWith(':top')).length, 1);
  assert.equal(stats.townMap[at(0, 0)], 't_road');
  assert.equal(stats.townMap[at(1, 0)], 't_road');
});

test('大きな建物は、左上のマスごと無くなる', () => {
  const before = town({ townItems: { t_castle: 2 } });
  before.townMap[at(0, 0)] = 't_castle';
  before.townMap[at(-3, -3)] = 't_castle';
  const { stats, entry } = applyHeavyPenalty(freeze(before), { today: TODAY, itemMap: ITEMS, rng: never });
  assert.equal(stats.townItems.t_castle, 1);
  assert.equal(Object.values(stats.townMap).filter((id) => id === 't_castle').length, 1);
  assert.equal(entry.placed.length, 1);
});

test('2回目: レベルが10下がり、下がった先のレベルの始まりの EXP になる', () => {
  const totalExp = getExpForLevel(112) + 4321;
  const { stats, entry } = applyHeavyPenalty(town({ totalExp, carelessStrikes: 1 }), { today: TODAY, itemMap: ITEMS, rng: never });
  assert.equal(getLevelInfoFromExp(stats.totalExp).level, 102);
  assert.equal(stats.totalExp, getExpForLevel(102));
  assert.equal(entry.levels, 10);
  assert.equal(entry.exp, totalExp - getExpForLevel(102));
  assert.equal(entry.land, undefined);
  assert.equal(stats.carelessStrikes, 2);
});

test('レベルが10に満たない子は Lv1 まで。下がった数は、実際に下がった分だけを記録する', () => {
  const low = applyHeavyPenalty(town({ totalExp: getExpForLevel(4) + 10, carelessStrikes: 1 }), { today: TODAY, itemMap: ITEMS, rng: never });
  assert.equal(low.stats.totalExp, 0);
  assert.equal(low.entry.levels, 3);
  // Lv1 の はじめ（EXP 0）なら、レベルについては何も記録しない
  const zero = applyHeavyPenalty(town({ totalExp: 0, carelessStrikes: 1 }), { today: TODAY, itemMap: ITEMS, rng: never });
  assert.equal(zero.entry.levels, undefined);
  assert.equal(zero.entry.exp, undefined);
});

test('3回目から: 町の中心に近い、使える地面が かれた土地になる（建物・大きな建物の足もとは避ける）', () => {
  const before = town({ carelessStrikes: 2, townItems: { t_house1: 1, t_castle: 1 } });
  before.townMap[at(0, 0)] = 't_house1';
  before.townMap[at(1, 0)] = 't_castle'; // (1,0)(2,0)(1,1)(2,1) が足もと。左上のほかは更地として入っている
  before.townMap[at(0, 1)] = 't_road'; before.townMap[`${at(0, 1)}:top`] = 't_house1';
  const { stats, entry } = applyHeavyPenalty(freeze(before), { today: TODAY, itemMap: ITEMS, rng: never });
  assert.equal(entry.land.length, 5);
  const footprint = new Set([at(1, 0), at(2, 0), at(1, 1), at(2, 1)]);
  for (const [key, was] of entry.land) {
    assert.equal(stats.townMap[key], DEAD_LAND);
    assert.equal(was, 't_cleared');
    assert.ok(!footprint.has(key), `大きな建物の足もと ${key} を枯らしている`);
    const [x, y] = key.split(',').map(Number);
    assert.ok(Math.max(Math.abs(x - C), Math.abs(y - C)) <= 1, `${key} は中心から遠い`);
  }
  // 建物は残る
  assert.equal(stats.townMap[at(0, 0)], 't_house1');
  assert.equal(stats.townMap[at(1, 0)], 't_castle');
  assert.equal(stats.townMap[`${at(0, 1)}:top`], 't_house1');
});

test('使える地面が足りないときは、まだ開拓していない地面を枯らす。見えていない土地（探索の外）は選ばない', () => {
  const before = { coins: 0, totalExp: 0, exploredRadius: 1, carelessStrikes: 2, townItems: {}, materials: {}, townMap: {} };
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) before.townMap[at(dx, dy)] = 't_grassland';
  before.townMap[at(0, 0)] = 't_cleared';
  before.townMap[at(1, 1)] = 't_bedrock';
  const { stats, entry } = applyHeavyPenalty(freeze(before), { today: TODAY, itemMap: ITEMS, rng: never });
  assert.equal(entry.land.length, 5);
  assert.deepEqual(entry.land[0], [at(0, 0), 't_cleared']);
  for (const [key, was] of entry.land.slice(1)) {
    assert.equal(was, 't_grassland');
    const [x, y] = key.split(',').map(Number);
    assert.ok(Math.max(Math.abs(x - C), Math.abs(y - C)) <= 1, `${key} は探索の外`);
  }
  assert.equal(stats.townMap[at(1, 1)], 't_bedrock');
});

test('重いペナルティは1日に1回まで。同じ日の2回目は何も変えない', () => {
  const first = applyHeavyPenalty(town({ materials: { wood: 4 } }), { today: TODAY, itemMap: ITEMS, rng: never });
  assert.equal(heavyPenaltiesOn(first.stats, TODAY), 1);
  assert.equal(previewCarelessPenalty(first.stats, TODAY).heavy, false);
  assert.equal(previewCarelessPenalty(first.stats, TODAY).step, null);
  const second = applyHeavyPenalty(first.stats, { today: TODAY, itemMap: ITEMS, rng: never });
  assert.equal(second.entry, null);
  assert.equal(second.stats, first.stats);
  // 次の日は、次の段になる
  const next = previewCarelessPenalty(first.stats, TOMORROW);
  assert.equal(next.heavy, true);
  assert.equal(next.strike, 2);
  assert.deepEqual(next.step, CARELESS.HEAVY_STEPS[1]);
  const third = applyHeavyPenalty(first.stats, { today: TOMORROW, itemMap: ITEMS, rng: never });
  assert.equal(third.stats.coins, 251);
  assert.equal(third.stats.carelessLog.length, 2);
});

test('記録は決めた件数までしか残さない', () => {
  let stats = town({ coins: 10 });
  for (let day = 0; day < CARELESS.LOG_MAX + 5; day++) {
    stats = applyHeavyPenalty(stats, { today: `2027-01-${String(day + 1).padStart(2, '0')}`.slice(0, 10), itemMap: ITEMS, rng: never }).stats;
  }
  assert.equal(stats.carelessLog.length, CARELESS.LOG_MAX);
  assert.equal(stats.carelessStrikes, CARELESS.LOG_MAX + 5);
});

test('失ったものを、画面に出す数にまとめる', () => {
  const entry = { coins: 500, items: { t_house1: 2, t_tree: 3 }, materials: { wood: 12, stone: 3 }, levels: 10, exp: 150000, land: [['1,1', 't_cleared'], ['1,2', 't_weed']] };
  assert.deepEqual(summarizePenalty(entry), { coins: 500, items: 5, materials: 15, levels: 10, land: 2 });
  assert.deepEqual(summarizePenalty({}), { coins: 0, items: 0, materials: 0, levels: 0, land: 0 });
  assert.deepEqual(summarizePenalty(null), { coins: 0, items: 0, materials: 0, levels: 0, land: 0 });
  assert.deepEqual(totalPenalty([entry, { coins: 20 }, null]), { coins: 520, items: 5, materials: 15, levels: 10, land: 2 });
  assert.deepEqual(totalPenalty(undefined), { coins: 0, items: 0, materials: 0, levels: 0, land: 0 });
});

test('元に戻す（先生向け）: コイン・もちもの・素材・EXP・土地が戻り、町の建物は元の場所に置きなおす', () => {
  const before = town({ carelessStrikes: 2, totalExp: getExpForLevel(40) + 77, materials: { wood: 9 }, townItems: { t_house1: 4, t_castle: 1, t_tree: 1 } });
  before.townMap[at(-3, 0)] = 't_house1'; before.townMap[at(-3, 1)] = 't_house1';
  before.townMap[at(-3, 2)] = 't_house1'; before.townMap[at(-3, 3)] = 't_house1';
  before.townMap[at(2, 2)] = 't_castle';
  const penalized = applyHeavyPenalty(freeze(before), { today: TODAY, itemMap: ITEMS, rng: always });
  assert.notDeepEqual(penalized.stats.townMap, before.townMap);
  assert.equal(penalized.entry.land.length, 5);
  assert.equal(lastRestorableIndex(penalized.stats), 0);

  const { stats, restored } = restoreHeavyPenalty(freeze(penalized.stats), { today: TOMORROW, itemMap: ITEMS });
  assert.equal(restored, true);
  assert.equal(stats.coins, before.coins);
  assert.equal(stats.totalExp, before.totalExp);
  assert.deepEqual(stats.materials, before.materials);
  assert.deepEqual(stats.townItems, before.townItems);
  assert.deepEqual(stats.townMap, before.townMap);
  assert.equal(stats.carelessStrikes, 2);
  // 記録は消さず、戻した日を残す（だれかが戻したことが、あとから分かるように）
  assert.equal(stats.carelessLog.length, 1);
  assert.equal(stats.carelessLog[0].restoredOn, TOMORROW);
  assert.equal(lastRestorableIndex(stats), -1);
  // 2回は戻せない
  const again = restoreHeavyPenalty(stats, { today: TOMORROW, itemMap: ITEMS });
  assert.equal(again.restored, false);
  assert.equal(again.stats, stats);
});

test('元に戻す: 建物のあった場所がふさがっていたら、もちものに戻るだけにする。使ったコインの分はそのまま足す', () => {
  const before = town({ townItems: { t_house1: 2, t_shop: 2, t_road: 1 } });
  before.townMap[at(0, 0)] = 't_house1'; before.townMap[at(1, 0)] = 't_house1';
  before.townMap[at(0, 2)] = 't_road'; before.townMap[`${at(0, 2)}:top`] = 't_shop';
  before.townMap[at(1, 2)] = 't_shop';
  const penalized = applyHeavyPenalty(freeze(before), { today: TODAY, itemMap: ITEMS, rng: never });
  const removed = penalized.entry.placed.find(([, id]) => id === 't_house1')[0];
  // ペナルティのあとで、空いた場所に木を置き、コインを 100 使った
  const later = { ...penalized.stats, coins: penalized.stats.coins - 100, townItems: { ...penalized.stats.townItems, t_tree: 1 }, townMap: { ...penalized.stats.townMap, [removed]: 't_tree' } };
  const { stats } = restoreHeavyPenalty(freeze(later), { today: TODAY, itemMap: ITEMS });
  assert.equal(stats.townMap[removed], 't_tree');
  assert.equal(stats.townItems.t_house1, 2);
  assert.equal(Object.values(stats.townMap).filter((id) => id === 't_house1').length, 1);
  assert.equal(stats.coins, before.coins - 100);
  // 戻した日のうちは、もう一度 科せる（まちがいを取り消したので、その日の上限には数えない）
  assert.equal(heavyPenaltiesOn(stats, TODAY), 0);
  assert.equal(previewCarelessPenalty(stats, TODAY).heavy, true);
});

test('元に戻す: 記録が無い・こわれているときは何もしない', () => {
  const empty = town();
  assert.equal(restoreHeavyPenalty(empty, { today: TODAY, itemMap: ITEMS }).restored, false);
  assert.equal(restoreHeavyPenalty({ ...empty, carelessLog: 'x' }, { today: TODAY, itemMap: ITEMS }).restored, false);
  assert.equal(restoreHeavyPenalty({ ...empty, carelessLog: [null] }, { today: TODAY, itemMap: ITEMS }).restored, false);
  assert.equal(lastRestorableIndex(null), -1);
});
