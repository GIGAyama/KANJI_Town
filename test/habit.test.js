import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyLearningDayHabit,
  canProtectRestDay,
  getDayDifference,
  getHabitStatus,
  normalizeHabitState,
  REST_PASS_RECHARGE_DAYS,
} from '../src/systems/habit.js';

test('旧保存データには使用可能なおやすみパスを安全に補完する', () => {
  assert.deepEqual(normalizeHabitState({}), {
    restPassAvailable: true,
    restPassRechargeProgress: 0,
    lastRestPassDate: '',
    lastHabitEvent: null,
  });
  assert.equal(getHabitStatus({}, '2026-07-21').rechargeRemaining, 0);
  assert.equal(normalizeHabitState({ lastHabitEvent: { type: 'unknown', date: '2026-07-21' } }).lastHabitEvent, null);
});

test('ローカル日付キーの日数差を夏時間の影響なく判定する', () => {
  assert.equal(getDayDifference('2026-03-07', '2026-03-09'), 2);
  assert.equal(getDayDifference('2026-02-28', '2026-03-01'), 1);
  assert.equal(getDayDifference('invalid', '2026-03-01'), null);
});

test('1日の休息はパスを自動使用して連続記録を守る', () => {
  const before = { lastDate: '2026-07-19', streak: 8, restPassAvailable: true };
  assert.equal(canProtectRestDay(before, '2026-07-21'), true);

  const next = applyLearningDayHabit(before, '2026-07-21');
  assert.equal(next.streak, 9);
  assert.equal(next.restPassAvailable, false);
  assert.equal(next.restPassRechargeProgress, 1);
  assert.equal(next.lastRestPassDate, '2026-07-20');
  assert.deepEqual(next.lastHabitEvent, {
    type: 'rest_protected',
    date: '2026-07-21',
    restDate: '2026-07-20',
  });
});

test('2日以上の休みではパスを消費せず連続記録を再開する', () => {
  const next = applyLearningDayHabit({
    lastDate: '2026-07-18',
    streak: 8,
    restPassAvailable: true,
  }, '2026-07-21');

  assert.equal(next.streak, 1);
  assert.equal(next.restPassAvailable, true);
  assert.equal(next.lastHabitEvent, null);
});

test('同じ日の追加学習ではパスと再獲得進捗を重複更新しない', () => {
  const current = {
    lastDate: '2026-07-21',
    streak: 9,
    restPassAvailable: false,
    restPassRechargeProgress: 1,
    lastRestPassDate: '2026-07-20',
    lastHabitEvent: { type: 'rest_protected', date: '2026-07-21' },
  };
  const next = applyLearningDayHabit(current, '2026-07-21');

  assert.equal(next.streak, 9);
  assert.equal(next.restPassAvailable, false);
  assert.equal(next.restPassRechargeProgress, 1);
});

test('パスがない状態で休むと連続記録を1日目から再開する', () => {
  const next = applyLearningDayHabit({
    lastDate: '2026-07-19',
    streak: 9,
    restPassAvailable: false,
    restPassRechargeProgress: 2,
  }, '2026-07-21');

  assert.equal(next.streak, 1);
  assert.equal(next.restPassAvailable, false);
  assert.equal(next.restPassRechargeProgress, 3);
});

test('パス使用後は合計5日の学習で再獲得する', () => {
  let stats = {
    lastDate: '2026-07-21',
    streak: 9,
    restPassAvailable: false,
    restPassRechargeProgress: 1,
  };

  for (let day = 22; day <= 25; day++) {
    const today = `2026-07-${day}`;
    stats = { ...stats, ...applyLearningDayHabit(stats, today) };
  }

  assert.equal(stats.restPassAvailable, true);
  assert.equal(stats.restPassRechargeProgress, 0);
  assert.equal(stats.streak, 13);
  assert.equal(stats.lastHabitEvent.type, 'rest_pass_recharged');
  assert.equal(REST_PASS_RECHARGE_DAYS, 5);
});
