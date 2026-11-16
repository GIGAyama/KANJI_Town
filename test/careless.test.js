import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCarelessPenalty, carelessPenaltyRate } from '../src/systems/careless.js';
import { CARELESS, SESSION } from '../src/constants/gameConfig.js';

test('てきとう書きは、1回目は注意だけ。2回目から1回ごとに 10% ずつ EXP が減り、50% で止まる', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 30].map(carelessPenaltyRate), [0, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.5, 0.5]);
  assert.equal(CARELESS.FREE_WARNINGS, 1);
  assert.equal(CARELESS.EXP_PENALTY_MAX, 0.5);
});

test('数でない回数は 0 回として扱う', () => {
  for (const count of [undefined, null, NaN, -3, 'x']) assert.equal(carelessPenaltyRate(count), 0);
  assert.equal(carelessPenaltyRate('3'), 0.2);
});

test('減らした EXP と、減った分を返す（合計は元の EXP と同じ）', () => {
  assert.deepEqual(applyCarelessPenalty(100, 0), { exp: 100, lost: 0, rate: 0 });
  assert.deepEqual(applyCarelessPenalty(100, 1), { exp: 100, lost: 0, rate: 0 });
  assert.deepEqual(applyCarelessPenalty(100, 3), { exp: 80, lost: 20, rate: 0.2 });
  assert.deepEqual(applyCarelessPenalty(55, 2), { exp: 50, lost: 5, rate: 0.1 });
  assert.deepEqual(applyCarelessPenalty(0, 9), { exp: 0, lost: 0, rate: 0.5 });
  for (const exp of [1, 7, 33, 999]) {
    for (const count of [0, 2, 4, 10]) {
      const { exp: kept, lost } = applyCarelessPenalty(exp, count);
      assert.equal(kept + lost, exp);
      assert.ok(kept >= Math.floor(exp / 2), 'EXP は半分より多くは減らない');
    }
  }
});

test('同じ字のやり直しは3回まで（それでもできない字は次の学習へ回す）', () => {
  assert.equal(SESSION.MAX_RETRIES, 3);
});
