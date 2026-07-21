import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSyncMeta,
  decideSyncAction,
  hashCloudPayload,
  isEmptyLearningData,
  prepareCloudPayload,
  stableSerialize,
  summarizeCloudData,
} from '../src/systems/cloud-sync.js';

test('クラウド用データは端末固有の一時情報を除外し、元データを変更しない', () => {
  const stats = {
    totalExp: 20,
    cloudSync: { status: 'syncing' },
    lastCollectionResult: { coins: 3 },
    kanjiStats: { one: { status: 'review' } },
  };
  const payload = prepareCloudPayload(stats);

  assert.equal(payload.cloudSync, undefined);
  assert.equal(payload.lastCollectionResult, undefined);
  assert.equal(stats.cloudSync.status, 'syncing');
  assert.equal(payload.kanjiStats.one.status, 'review');
});

test('キー順が違っても同じクラウドハッシュになる', async () => {
  const left = { b: 2, a: { d: 4, c: 3 } };
  const right = { a: { c: 3, d: 4 }, b: 2 };
  assert.equal(stableSerialize(left), stableSerialize(right));
  assert.equal(await hashCloudPayload(left), await hashCloudPayload(right));
});

test('クラウドが空ならローカルを新規保存する', () => {
  assert.deepEqual(decideSyncAction({ localHash: 'local', localIsEmpty: false, remote: null, meta: null }), {
    action: 'create_remote',
    reason: 'cloud_empty',
  });
});

test('新しい端末の初期データにはクラウドを安全に復元する', () => {
  assert.equal(decideSyncAction({
    localHash: 'empty',
    localIsEmpty: true,
    remote: { revision: 3, payload_hash: 'cloud' },
    meta: null,
  }).action, 'pull_remote');
});

test('初回同期で双方に学習記録がある場合は自動上書きしない', () => {
  assert.equal(decideSyncAction({
    localHash: 'local',
    localIsEmpty: false,
    remote: { revision: 3, payload_hash: 'cloud' },
    meta: null,
  }).action, 'conflict');
});

test('最後の同期後に片側だけ変わった場合はその側を採用する', () => {
  const meta = { lastSyncedHash: 'base', remoteRevision: 2 };
  assert.equal(decideSyncAction({
    localHash: 'local',
    localIsEmpty: false,
    remote: { revision: 2, payload_hash: 'base' },
    meta,
  }).action, 'push_local');
  assert.equal(decideSyncAction({
    localHash: 'base',
    localIsEmpty: false,
    remote: { revision: 3, payload_hash: 'cloud' },
    meta,
  }).action, 'pull_remote');
});

test('双方が変更された場合は競合として停止する', () => {
  assert.equal(decideSyncAction({
    localHash: 'local',
    localIsEmpty: false,
    remote: { revision: 4, payload_hash: 'cloud' },
    meta: { lastSyncedHash: 'base', remoteRevision: 2 },
  }).action, 'conflict');
});

test('共有端末で別アカウントへ切り替えた場合は自動送信しない', () => {
  assert.deepEqual(decideSyncAction({
    localHash: 'local',
    localIsEmpty: false,
    remote: null,
    meta: null,
    localOwnerId: 'previous-user',
    userId: 'next-user',
  }), { action: 'conflict', reason: 'account_switch' });
});

test('競合表示向けサマリーと同期メタデータを正規化する', () => {
  assert.deepEqual(summarizeCloudData({
    totalExp: 120,
    streak: 4,
    sessionCount: 7,
    kanjiStats: { a: { status: 'review' }, b: { status: 'new' } },
  }), { totalExp: 120, learned: 1, streak: 4, sessions: 7 });
  assert.deepEqual(createSyncMeta({ revision: 5, payload_hash: 'hash' }, 'now'), {
    remoteRevision: 5,
    lastSyncedHash: 'hash',
    lastSyncedAt: 'now',
  });
  assert.equal(isEmptyLearningData({ totalExp: 0, kanjiStats: {} }), true);
  assert.equal(isEmptyLearningData({ totalExp: 0, kanjiStats: {}, myDrills: [{ id: 'local' }] }), false);
});
