import test from 'node:test';
import assert from 'node:assert/strict';
import { appendRound, countAdjacentRepeats, fillQueue, shuffled } from '../src/systems/question-queue.js';

/** 再現できる乱数（線形合同法） */
const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const A = { id: 'a' };
const B = { id: 'b' };
const C = { id: 'c' };

test('shuffled は元の配列を変えず、同じ要素を並べかえる', () => {
  const items = [A, B, C];
  const result = shuffled(items, seeded(1));
  assert.deepEqual(items, [A, B, C]);
  assert.equal(result.length, 3);
  assert.deepEqual(new Set(result), new Set(items));
});

test('fillQueue は学習済みが2字以上なら、周回しても同じ字をとなりに並べない', () => {
  for (let seed = 1; seed <= 500; seed++) {
    for (const items of [[A, B], [A, B, C]]) {
      const queue = fillQueue(items, 10, seeded(seed));
      assert.equal(queue.length, 10);
      assert.equal(countAdjacentRepeats(queue, { wrap: true }), 0, `seed=${seed} n=${items.length}`);
    }
  }
});

test('fillQueue は学習済みが1字なら、その字だけで埋める（ほかに選べない）', () => {
  assert.deepEqual(fillQueue([A], 3, seeded(1)), [A, A, A]);
  assert.deepEqual(fillQueue([], 10, seeded(1)), []);
});

test('fillQueue は足りているときは並びを変えない', () => {
  assert.deepEqual(fillQueue([A, B, C], 2, seeded(1)), [A, B, C]);
});

test('appendRound はつなぎ目で同じ字を続けない', () => {
  for (let seed = 1; seed <= 500; seed++) {
    const queue = appendRound([C, A], [A, B, C], seeded(seed));
    assert.equal(queue.length, 5);
    assert.notEqual(queue[2], A, `seed=${seed}`);
  }
});
