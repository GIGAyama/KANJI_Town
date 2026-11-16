import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCarelessPenalty, carelessPenaltyRate } from '../src/systems/careless.js';
import { CARELESS, SESSION } from '../src/constants/gameConfig.js';

test('てきとう書きのまま答え合わせをした回は、1回でもあれば EXP を全部失う', () => {
  assert.deepEqual([0, 1, 2, 3, 30].map(carelessPenaltyRate), [0, 1, 1, 1, 1]);
  assert.equal(CARELESS.FREE_WARNINGS, 0);
  assert.equal(CARELESS.EXP_PENALTY_STEP, 1);
  assert.equal(CARELESS.EXP_PENALTY_MAX, 1);
});

test('数でない回数は 0 回として扱う', () => {
  for (const count of [undefined, null, NaN, -3, 'x']) assert.equal(carelessPenaltyRate(count), 0);
  assert.equal(carelessPenaltyRate('3'), 1);
});

test('減らした EXP と、減った分を返す（合計は元の EXP と同じ）', () => {
  assert.deepEqual(applyCarelessPenalty(100, 0), { exp: 100, lost: 0, rate: 0 });
  assert.deepEqual(applyCarelessPenalty(100, 1), { exp: 0, lost: 100, rate: 1 });
  assert.deepEqual(applyCarelessPenalty(55, 4), { exp: 0, lost: 55, rate: 1 });
  assert.deepEqual(applyCarelessPenalty(0, 9), { exp: 0, lost: 0, rate: 1 });
  for (const exp of [1, 7, 33, 999]) {
    for (const count of [0, 1, 4, 10]) {
      const { exp: kept, lost } = applyCarelessPenalty(exp, count);
      assert.equal(kept + lost, exp);
      assert.ok(kept >= 0 && lost >= 0);
    }
  }
});

test('同じ字のやり直しは3回まで（それでもできない字は次の学習へ回す）', () => {
  assert.equal(SESSION.MAX_RETRIES, 3);
});
