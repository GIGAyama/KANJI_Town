import test from 'node:test';
import assert from 'node:assert/strict';
import { strokeNormalizedPaths, toCanvasStroke, toNormalizedStroke } from '../src/systems/stroke-coords.js';
import { gradeStrokes } from '../src/systems/strokeGrader.js';

const line = (from, to, size, steps = 20) => Array.from({ length: steps + 1 }, (_, i) => ({
  x: (from.x + (to.x - from.x) * (i / steps)) * size,
  y: (from.y + (to.y - from.y) * (i / steps)) * size,
  time: i * 20,
}));

test('書いた線を比率にして、別の大きさのキャンバスへ同じ形で描きなおせる', () => {
  const drawnAt300 = line({ x: 0.2, y: 0.25 }, { x: 0.8, y: 0.25 }, 300);
  const normalized = toNormalizedStroke(drawnAt300, 300);
  assert.deepEqual(normalized[0], { x: 0.2, y: 0.25, time: 0 });
  // 画面を回してキャンバスが 220px になっても、同じ位置（比率）に描ける
  const at220 = toCanvasStroke(normalized, 220);
  assert.ok(Math.abs(at220.at(-1).x - 0.8 * 220) < 1e-9);
  assert.equal(at220.at(-1).time, drawnAt300.at(-1).time);
});

test('比率で持った線は、キャンバスの大きさ 1 として採点すると px のままと同じ点数になる', () => {
  const model = [0.25, 0.5, 0.75].map((y) => {
    const points = Array.from({ length: 25 }, (_, i) => ({ x: 0.2 + 0.6 * i / 24, y }));
    return { s: points[0], e: points[24], points, endingType: 'tome' };
  });
  const strokesPx = [0.25, 0.5, 0.75].map((y) => line({ x: 0.2, y }, { x: 0.8, y }, 300));
  const normalized = strokesPx.map((stroke) => toNormalizedStroke(stroke, 300));
  assert.equal(gradeStrokes(normalized, model, 1).total, gradeStrokes(strokesPx, model, 300).total);
});

test('描きなおしは、比率をいまの大きさに直して線を引く', () => {
  const calls = [];
  const ctx = {
    beginPath: () => calls.push(['beginPath']),
    moveTo: (x, y) => calls.push(['moveTo', x, y]),
    lineTo: (x, y) => calls.push(['lineTo', x, y]),
    stroke: () => calls.push(['stroke']),
  };
  strokeNormalizedPaths(ctx, [[{ x: 0.5, y: 0.1 }, { x: 0.5, y: 0.9 }], []], 200);
  assert.deepEqual(calls, [['beginPath'], ['moveTo', 100, 20], ['lineTo', 100, 180], ['stroke']]);
});

test('大きさが分からないときは空にする（NaN の座標を作らない）', () => {
  assert.deepEqual(toNormalizedStroke([{ x: 1, y: 1 }], 0), []);
  assert.deepEqual(toCanvasStroke([{ x: 1, y: 1 }], NaN), []);
  assert.deepEqual(toNormalizedStroke(null, 300), []);
});
