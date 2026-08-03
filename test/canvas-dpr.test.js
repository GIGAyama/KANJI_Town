import test from 'node:test';
import assert from 'node:assert/strict';

import { getRenderScale, fitSquareCanvas, fitCanvasToSize } from '../src/utils/canvas-dpr.js';

/** 最小限のキャンバス代役。setTransform に渡された倍率を記録する。 */
function makeCanvas() {
  const calls = [];
  const canvas = {
    width: 0,
    height: 0,
    style: {},
    getContext: () => ({
      setTransform: (a, b, c, d, e, f) => calls.push([a, b, c, d, e, f]),
      clearRect: () => {},
    }),
  };
  return { canvas, calls };
}

function withDevicePixelRatio(value, fn) {
  const previous = globalThis.window;
  globalThis.window = { devicePixelRatio: value };
  try {
    return fn();
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
}

test('描画倍率は端末のdevicePixelRatioに従う', () => {
  assert.equal(withDevicePixelRatio(1, getRenderScale), 1);
  assert.equal(withDevicePixelRatio(1.5, getRenderScale), 1.5);
  assert.equal(withDevicePixelRatio(2, getRenderScale), 2);
});

test('描画倍率は2で頭打ちにする（メモリ4GBのChromebookでタブが落ちるため）', () => {
  assert.equal(withDevicePixelRatio(3, getRenderScale), 2);
  assert.equal(withDevicePixelRatio(4, getRenderScale), 2);
});

test('devicePixelRatio が取れない端末では等倍にする', () => {
  assert.equal(withDevicePixelRatio(undefined, getRenderScale), 1);
});

test('正方形キャンバスはCSSサイズ×倍率のピクセル数を持つ', () => {
  withDevicePixelRatio(2, () => {
    const { canvas, calls } = makeCanvas();
    fitSquareCanvas(canvas, 320);
    assert.equal(canvas.width, 640);
    assert.equal(canvas.height, 640);
    // 以降 CSS px のまま描けるよう、変換行列に倍率が入っていること
    assert.deepEqual(calls.at(-1), [2, 0, 0, 2, 0, 0]);
  });
});

test('等倍の端末では無駄に大きなバッファを確保しない', () => {
  withDevicePixelRatio(1, () => {
    const { canvas, calls } = makeCanvas();
    fitSquareCanvas(canvas, 320);
    assert.equal(canvas.width, 320);
    assert.deepEqual(calls.at(-1), [1, 0, 0, 1, 0, 0]);
  });
});

test('3倍端末でも面積は4倍までに抑える', () => {
  withDevicePixelRatio(3, () => {
    const { canvas } = makeCanvas();
    fitSquareCanvas(canvas, 300);
    assert.equal(canvas.width, 600);
    assert.equal(canvas.height, 600);
  });
});

test('stretch を渡すと親いっぱいに伸ばす／渡さなければ style を触らない', () => {
  withDevicePixelRatio(2, () => {
    const a = makeCanvas();
    fitSquareCanvas(a.canvas, 100);
    assert.equal(a.canvas.style.width, '100%');

    const b = makeCanvas();
    fitSquareCanvas(b.canvas, 100, { stretch: false });
    assert.equal(b.canvas.style.width, undefined);
  });
});

test('同じ大きさで呼び直してもバッファを作り直さない（描いた線が消えないため）', () => {
  withDevicePixelRatio(2, () => {
    const { canvas } = makeCanvas();
    fitSquareCanvas(canvas, 200);
    let assigned = 0;
    let stored = canvas.width;
    Object.defineProperty(canvas, 'width', {
      get: () => stored,
      set: (v) => { assigned += 1; stored = v; },
    });
    fitSquareCanvas(canvas, 200);
    assert.equal(assigned, 0);
  });
});

test('矩形キャンバスも幅・高さそれぞれに倍率がかかる', () => {
  withDevicePixelRatio(2, () => {
    const { canvas, calls } = makeCanvas();
    fitCanvasToSize(canvas, 1366, 768);
    assert.equal(canvas.width, 2732);
    assert.equal(canvas.height, 1536);
    assert.deepEqual(calls.at(-1), [2, 0, 0, 2, 0, 0]);
  });
});

test('キャンバスや大きさが未確定のときは何もせず null を返す', () => {
  withDevicePixelRatio(2, () => {
    assert.equal(fitSquareCanvas(null, 100), null);
    assert.equal(fitSquareCanvas(makeCanvas().canvas, 0), null);
    assert.equal(fitCanvasToSize(makeCanvas().canvas, 100, 0), null);
  });
});
