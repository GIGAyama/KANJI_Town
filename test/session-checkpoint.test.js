import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSessionCheckpoint,
  restoreSessionCheckpoint,
  SESSION_CHECKPOINT_MAX_AGE_MS,
} from '../src/systems/session-checkpoint.js';

const kanjiData = [
  { id: 'one', char: '一' },
  { id: 'two', char: '二' },
  { id: 'three', char: '三' },
];

test('学習途中の残りキューと獲得記録をIDベースで復元する', () => {
  const now = Date.UTC(2026, 6, 21, 12);
  const checkpoint = createSessionCheckpoint({
    queue: kanjiData,
    remainingQueue: [kanjiData[1], kanjiData[2]],
    earnedExp: 15,
    reviewedCount: 1,
    attemptCount: 2,
    correctCount: 1,
    expMultiplier: 1.15,
    isDrill: true,
    unlockedItems: ['t_tree'],
  }, now);

  assert.deepEqual(checkpoint.queueIds, ['one', 'two', 'three']);
  assert.deepEqual(checkpoint.remainingQueueIds, ['two', 'three']);

  const restored = restoreSessionCheckpoint(checkpoint, kanjiData, now + 60_000);
  assert.deepEqual(restored.queue.map((kanji) => kanji.id), ['one', 'two', 'three']);
  assert.deepEqual(restored.remainingQueue.map((kanji) => kanji.id), ['two', 'three']);
  assert.equal(restored.earnedExp, 15);
  assert.equal(restored.attemptCount, 2);
  assert.equal(restored.isDrill, true);
  assert.equal(restored.expMultiplier, 1.15);
});

test('期限切れまたは未知の漢字を含むチェックポイントは復元しない', () => {
  const now = Date.UTC(2026, 6, 21, 12);
  const checkpoint = createSessionCheckpoint({
    queue: kanjiData,
    remainingQueue: [kanjiData[2]],
  }, now);

  assert.equal(
    restoreSessionCheckpoint(checkpoint, kanjiData, now + SESSION_CHECKPOINT_MAX_AGE_MS + 1),
    null,
  );
  assert.equal(
    restoreSessionCheckpoint({ ...checkpoint, remainingQueueIds: ['unknown'] }, kanjiData, now),
    null,
  );
  assert.equal(
    restoreSessionCheckpoint({ ...checkpoint, queueIds: ['one'], remainingQueueIds: ['two'] }, kanjiData, now),
    null,
  );
});
