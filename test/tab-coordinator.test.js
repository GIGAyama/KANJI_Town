import test from 'node:test';
import assert from 'node:assert/strict';
import { createTabCoordinator } from '../src/systems/tab-coordinator.js';

/** 同じ端末の複数タブを模した通り道（送った合図は、ほかの全タブに届く） */
function createBus() {
  const listeners = new Set();
  return {
    transport: () => ({
      send: (message) => { for (const listener of [...listeners]) listener(structuredClone(message)); },
      listen: (handler) => { listeners.add(handler); return () => listeners.delete(handler); },
      close: () => {},
    }),
  };
}

test('あとから開いたタブが名乗ると、前のタブは保存待ちを書き出してから書くのをやめる', () => {
  const bus = createBus();
  const events = [];
  const first = createTabCoordinator({ transport: bus.transport(), tabId: 'A', onDeactivate: () => { events.push('A:flush'); return true; }, onPeerFlushed: () => events.push('A:reload') });
  first.claim();
  const second = createTabCoordinator({ transport: bus.transport(), tabId: 'B', onDeactivate: () => { events.push('B:flush'); return false; }, onPeerFlushed: () => events.push('B:reload') });
  second.claim();

  assert.equal(first.isActive(), false);
  assert.equal(second.isActive(), true);
  // A が書き出したので、B は読み直す
  assert.deepEqual(events, ['A:flush', 'B:reload']);
});

test('書き出すものが無ければ、名乗ったタブは読み直さない', () => {
  const bus = createBus();
  const events = [];
  const first = createTabCoordinator({ transport: bus.transport(), tabId: 'A', onDeactivate: () => false });
  first.claim();
  const second = createTabCoordinator({ transport: bus.transport(), tabId: 'B', onDeactivate: () => false, onPeerFlushed: () => events.push('B:reload') });
  second.claim();
  assert.deepEqual(events, []);
});

test('止まったタブが「このタブで つづける」と名乗りなおすと、入れかわる', () => {
  const bus = createBus();
  const a = createTabCoordinator({ transport: bus.transport(), tabId: 'A', onDeactivate: () => true });
  a.claim();
  const b = createTabCoordinator({ transport: bus.transport(), tabId: 'B', onDeactivate: () => true });
  b.claim();
  a.claim();
  assert.equal(a.isActive(), true);
  assert.equal(b.isActive(), false);
});

test('すでに止まっているタブは、もう一度書き出さない（3つめのタブ）', () => {
  const bus = createBus();
  let flushes = 0;
  const a = createTabCoordinator({ transport: bus.transport(), tabId: 'A', onDeactivate: () => { flushes++; return true; } });
  a.claim();
  createTabCoordinator({ transport: bus.transport(), tabId: 'B', onDeactivate: () => true }).claim();
  createTabCoordinator({ transport: bus.transport(), tabId: 'C', onDeactivate: () => true }).claim();
  assert.equal(flushes, 1);
});

test('通り道が無い環境では、いつも書けるタブとしてふるまう', () => {
  const lone = createTabCoordinator({ transport: null, onDeactivate: () => true });
  lone.claim();
  assert.equal(lone.isActive(), true);
});
