import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  checkLevelUp,
  EXP_PER_LEVEL_ABOVE_TABLE,
  getLevelInfoFromExp,
  getLevelReward,
  grantExpWithLevelRewards,
  liftLevelCap,
  MAX_LEVEL,
} from '../src/utils/level-system.js';

/** Lv100 に届く EXP（Lv10 の 3000 に、Lv11〜100 の「レベル×150」を足したもの） */
const EXP_AT_100 = 752250;

test('Lv100 までの必要 EXP は変えない（すでに遊んでいる子のレベルが下がらないように）', () => {
  // 上限を外すときに表を作りなおして、途中のレベルの境目がずれるのを防ぐ
  for (const [exp, level] of [[0, 1], [49, 1], [50, 2], [150, 3], [2999, 9], [3000, 10], [4649, 10], [4650, 11], [EXP_AT_100 - 1, 99], [EXP_AT_100, 100]]) {
    assert.equal(getLevelInfoFromExp(exp).level, level, `EXP ${exp}`);
  }
  assert.deepEqual(getLevelReward(2), { type: 'coins', amount: 500 });
  assert.equal(getLevelReward(3).id, 'craft');
  assert.equal(getLevelReward(100).id, 'town_max');
  assert.equal(getLevelReward(1), null);
});

test('Lv100 が上限ではなくなり、その先は1レベルごとに同じ EXP で上がる', () => {
  const at100 = getLevelInfoFromExp(EXP_AT_100);
  assert.equal(at100.level, 100);
  assert.equal(at100.isMaxLevel, false, '以前は Lv100 で MAX LEVEL になり、その先の表示もごほうびも無かった');
  assert.equal(at100.remainingExp, EXP_PER_LEVEL_ABOVE_TABLE);
  assert.ok(at100.targetReward, '次のレベルのごほうびが出る');

  // 上がるほど遠くなる形にしない（Lv99→100 と同じ 15,000）
  assert.equal(EXP_PER_LEVEL_ABOVE_TABLE, 15000);
  for (const [extra, level, progress] of [[14999, 100, 100], [15000, 101, 0], [15000 * 7 + 7500, 107, 50], [15000 * 400, 500, 0]]) {
    const info = getLevelInfoFromExp(EXP_AT_100 + extra);
    assert.equal(info.level, level, `+${extra}`);
    assert.equal(Math.round(info.progress), progress, `+${extra} の進み具合`);
    assert.equal(info.nextLevelExp - info.currentLevelExp, EXP_PER_LEVEL_ABOVE_TABLE);
    assert.equal(info.remainingExp, info.nextLevelExp - (EXP_AT_100 + extra));
  }
});

test('いちばん上は Lv999。そこから先は EXP をためてもレベルは変わらない', () => {
  assert.equal(MAX_LEVEL, 999);
  const top = EXP_AT_100 + (MAX_LEVEL - 100) * EXP_PER_LEVEL_ABOVE_TABLE;
  assert.equal(getLevelInfoFromExp(top - 1).level, 998);
  for (const exp of [top, top + 1, top * 10]) {
    const info = getLevelInfoFromExp(exp);
    assert.equal(info.level, 999);
    assert.equal(info.isMaxLevel, true);
    assert.equal(info.progress, 100);
    assert.equal(info.targetReward, null);
  }
  assert.equal(getLevelReward(1000), null);
  assert.equal(checkLevelUp(top, top * 2).isLevelUp, false);
});

test('Lv100 から先は、どのレベルにもごほうびがある（建物は町に置けるものだけ）', () => {
  const townItems = readFileSync(new URL('../src/data/town-items.jsx', import.meta.url), 'utf8');
  const counts = { coins: 0, item: 0 };
  for (let level = 101; level <= MAX_LEVEL; level++) {
    const reward = getLevelReward(level);
    assert.ok(reward, `Lv${level} にごほうびが無い`);
    assert.ok(reward.text, `Lv${level} のごほうびに、画面に出す名前が無い`);
    counts[reward.type] += 1;
    if (reward.type === 'item') {
      assert.ok(townItems.includes(`id: '${reward.id}'`), `Lv${level} の建物 ${reward.id} が town-items.jsx に無い`);
      assert.equal(reward.amount, 1);
    } else {
      assert.equal(reward.type, 'coins');
      assert.ok(reward.amount > 0);
    }
  }
  assert.equal(counts.coins + counts.item, MAX_LEVEL - 100);
  // 5レベルごとにレアな建物、10レベルごとに大きなコイン、100レベルごとと Lv999 は大きな建物
  assert.equal(getLevelReward(105).type, 'item');
  assert.equal(getLevelReward(110).amount, 50000);
  assert.match(getLevelReward(200).id, /^t_mega_/);
  assert.match(getLevelReward(MAX_LEVEL).id, /^t_mega_/);
  assert.notEqual(getLevelReward(105).id, getLevelReward(115).id, 'レアな建物は順にかわる');
});

test('Lv100 をまたいで上がったときも、とちゅうのレベルのごほうびをすべて渡す', () => {
  const up = checkLevelUp(EXP_AT_100 - 1, EXP_AT_100 + EXP_PER_LEVEL_ABOVE_TABLE * 5);
  assert.deepEqual([up.isLevelUp, up.oldLevel, up.newLevel], [true, 99, 105]);
  assert.deepEqual(up.rewards.map((r) => r.level), [100, 101, 102, 103, 104, 105]);

  const { stats, levelUpData } = grantExpWithLevelRewards({ totalExp: EXP_AT_100, coins: 0, townItems: {} }, EXP_PER_LEVEL_ABOVE_TABLE * 5);
  assert.equal(levelUpData.newLevel, 105);
  assert.equal(stats.coins, 3000 * 4);
  assert.deepEqual(stats.townItems, { [getLevelReward(105).id]: 1 });
});

test('上限だったころにためた EXP は、新しい版をはじめて開いたときに1回だけレベルとごほうびに直す', () => {
  // Lv100 に届いたあとも EXP は数えつづけていた。その分を、だまって消さずに渡す
  const saved = { totalExp: EXP_AT_100 + EXP_PER_LEVEL_ABOVE_TABLE * 12 + 5, coins: 10, townItems: { t_road: 2 } };
  const lifted = liftLevelCap(saved);
  assert.equal(lifted.levelCapLifted, true);
  assert.deepEqual([lifted.pendingLevelUp.oldLevel, lifted.pendingLevelUp.newLevel], [100, 112]);
  assert.equal(lifted.pendingLevelUp.rewards.length, 12);
  // Lv101〜112 のうち、Lv105 は建物、Lv110 は 50000 枚、のこりの10レベルは 3000 枚ずつ
  assert.equal(lifted.coins, 10 + 3000 * 10 + 50000);
  assert.deepEqual(lifted.townItems, { t_road: 2, [getLevelReward(105).id]: 1 });
  assert.equal(lifted.totalExp, saved.totalExp, 'EXP そのものは変えない');
  assert.equal(saved.coins, 10, '元の記録は書きかえない');

  // もう一度通しても、二重には渡さない
  assert.equal(liftLevelCap(lifted), lifted);
});

test('Lv100 に届いていない子・はじめての子には、しるしだけを付ける', () => {
  for (const stats of [{ totalExp: 0 }, { totalExp: 5000 }, { totalExp: EXP_AT_100 + EXP_PER_LEVEL_ABOVE_TABLE - 1 }, {}]) {
    const lifted = liftLevelCap(stats);
    assert.equal(lifted.levelCapLifted, true);
    assert.equal('pendingLevelUp' in lifted, false);
  }
  assert.equal(liftLevelCap(null), null);
});
