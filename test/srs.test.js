import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateCard, recordPracticeAttempt } from '../src/systems/srs.js';

test('既存カードへ苦手特訓の進捗フィールドを安全に追加する', () => {
  const migrated = migrateCard({
    status: 'review',
    graduated: true,
    interval: 86_400_000,
    nextReview: Date.now() + 60_000,
    ease: 2.3,
    mistakes: 2,
  });

  assert.equal(migrated.practiceStreak, 0);
  assert.equal(migrated.practiceAttempts, 0);
  assert.equal(migrated.lastPracticedAt, 0);
  assert.equal(migrated.mistakes, 2);
});

test('保存済みの苦手特訓進捗を移行時に維持する', () => {
  const migrated = migrateCard({
    status: 'learning',
    graduated: false,
    interval: 600_000,
    nextReview: Date.now() + 60_000,
    ease: 2.1,
    practiceStreak: 2,
    practiceAttempts: 7,
    lastPracticedAt: 12345,
  });

  assert.equal(migrated.practiceStreak, 2);
  assert.equal(migrated.practiceAttempts, 7);
  assert.equal(migrated.lastPracticedAt, 12345);
});

test('正解で連続記録を進め、もう一度でリセットする', () => {
  assert.deepEqual(
    recordPracticeAttempt({ practiceStreak: 1, practiceAttempts: 4 }, 'good', 200),
    { practiceStreak: 2, practiceAttempts: 5, lastPracticedAt: 200 },
  );
  assert.deepEqual(
    recordPracticeAttempt({ practiceStreak: 2, practiceAttempts: 5 }, 'again', 300),
    { practiceStreak: 0, practiceAttempts: 6, lastPracticedAt: 300 },
  );
});
