import test from 'node:test';
import assert from 'node:assert/strict';
import { getStorageProtection, requestPersistentStorage } from '../src/systems/persistence.js';

test('すでに守られていれば、もう一度は頼まない', async () => {
  let asked = 0;
  const storage = { persisted: async () => true, persist: async () => { asked++; return true; } };
  assert.equal(await requestPersistentStorage(storage), 'persisted');
  assert.equal(asked, 0);
});

test('頼んで許されたか、断られたかを返す', async () => {
  assert.equal(await requestPersistentStorage({ persisted: async () => false, persist: async () => true }), 'persisted');
  assert.equal(await requestPersistentStorage({ persisted: async () => false, persist: async () => false }), 'denied');
});

test('使えないブラウザや例外では unsupported を返し、止まらない', async () => {
  assert.equal(await requestPersistentStorage(undefined), 'unsupported');
  assert.equal(await requestPersistentStorage({}), 'unsupported');
  assert.equal(await requestPersistentStorage({ persist: async () => { throw new Error('x'); } }), 'unsupported');
});

test('守られているかと使っている量を返す', async () => {
  const storage = { persisted: async () => false, estimate: async () => ({ usage: 1200, quota: 5000 }) };
  assert.deepEqual(await getStorageProtection(storage), { persisted: false, usage: 1200, quota: 5000 });
  assert.deepEqual(await getStorageProtection(undefined), { persisted: null, usage: null, quota: null });
});
