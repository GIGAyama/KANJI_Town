import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTownAnimationScheduler,
  TOWN_ANIMATION_INTERVAL_MS,
} from '../src/systems/town-animation.js';

test('複数の住民は1本のフレーム予約を共有し30fpsで更新される', () => {
  const frames = [];
  const cancelled = [];
  const scheduler = createTownAnimationScheduler({
    requestFrame: (callback) => {
      frames.push(callback);
      return frames.length;
    },
    cancelFrame: (frameId) => cancelled.push(frameId),
  });
  const ticks = [];
  const unsubscribeFirst = scheduler.subscribe((_now, delta) => ticks.push(['first', delta]));
  const unsubscribeSecond = scheduler.subscribe((_now, delta) => ticks.push(['second', delta]));

  assert.equal(frames.length, 1);
  assert.equal(scheduler.getSubscriberCount(), 2);

  frames.shift()(0);
  frames.shift()(TOWN_ANIMATION_INTERVAL_MS - 1);
  assert.equal(ticks.length, 0);
  frames.shift()(TOWN_ANIMATION_INTERVAL_MS);

  const delta = TOWN_ANIMATION_INTERVAL_MS / 1000;
  assert.deepEqual(ticks, [['first', delta], ['second', delta]]);
  unsubscribeFirst();
  unsubscribeSecond();
  assert.equal(scheduler.getSubscriberCount(), 0);
  assert.equal(cancelled.length, 1);
});

test('一時停止中はフレームを予約せず、再開時に1本だけ予約する', () => {
  const frames = [];
  const scheduler = createTownAnimationScheduler({
    requestFrame: (callback) => {
      frames.push(callback);
      return frames.length;
    },
    cancelFrame: () => {},
  });

  scheduler.pause();
  const unsubscribe = scheduler.subscribe(() => {});
  assert.equal(frames.length, 0);

  scheduler.resume();
  assert.equal(frames.length, 1);
  unsubscribe();
});

test('既定では requestAnimationFrame を使わず、時計で刻む（毎フレームの画面更新を起こさない）', async () => {
  const original = globalThis.requestAnimationFrame;
  let rafCalls = 0;
  globalThis.requestAnimationFrame = () => { rafCalls++; return 0; };
  try {
    const scheduler = createTownAnimationScheduler();
    const ticks = [];
    const unsubscribe = scheduler.subscribe((_now, delta) => ticks.push(delta));
    await new Promise((resolve) => setTimeout(resolve, TOWN_ANIMATION_INTERVAL_MS * 4));
    unsubscribe();
    assert.equal(rafCalls, 0);
    assert.ok(ticks.length >= 1, `刻みが来ていない（${ticks.length}）`);
    assert.ok(ticks.every((delta) => delta > 0 && delta <= 0.1));
    const after = ticks.length;
    await new Promise((resolve) => setTimeout(resolve, TOWN_ANIMATION_INTERVAL_MS * 2));
    assert.equal(ticks.length, after, '購読をやめたら止まる');
  } finally {
    if (original === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = original;
  }
});
