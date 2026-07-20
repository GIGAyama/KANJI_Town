import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLearningPlan,
  getDailyGoal,
  getDailyLearningProgress,
} from '../src/systems/learning-plan.js';
import { calculateLearningViewport } from '../src/utils/learning-viewport.js';

const kanjiData = [
  { id: 'a', grade: 1 },
  { id: 'b', grade: 1 },
  { id: 'c', grade: 1 },
  { id: 'd', grade: 2 },
];

test('復習と新出漢字を同じセッションへ復習優先で組み込む', () => {
  const plan = buildLearningPlan({
    kanjiData,
    kanjiStats: {
      a: { status: 'review', nextReview: 100, mistakes: 1 },
      b: { status: 'learning', nextReview: 50, mistakes: 2 },
    },
    selectedGrade: 1,
    limits: { review: 2, new: 1 },
    now: 200,
    random: () => 0.5,
  });

  assert.deepEqual(plan.queue.map((kanji) => kanji.id), ['b', 'a', 'c']);
  assert.equal(plan.reviewCount, 2);
  assert.equal(plan.newCount, 1);
});

test('学習目標は安全な既定値と当日進捗を返す', () => {
  assert.equal(getDailyGoal({ dailyGoal: 999 }), 10);
  assert.deepEqual(
    getDailyLearningProgress({ settings: { dailyGoal: 5 }, daily: { '2026-07-21': { reviewed: 7 } } }, '2026-07-21'),
    { goal: 5, reviewed: 7, remaining: 0, percent: 100, isComplete: true },
  );
});

test('タブレット縦持ちは積層、横持ちは広い学習面を使う', () => {
  const portrait = calculateLearningViewport(768, 1024);
  const landscape = calculateLearningViewport(1024, 768);
  assert.equal(portrait.isStacked, true);
  assert.ok(portrait.canvasSize >= 480);
  assert.equal(landscape.isStacked, false);
  assert.ok(landscape.canvasSize >= 500);
});

test('小型スマートフォンでもキャンバスが画面幅を越えない', () => {
  const viewport = calculateLearningViewport(320, 568);
  assert.equal(viewport.isStacked, true);
  assert.ok(viewport.canvasSize <= 288);
  assert.ok(viewport.canvasSize >= 220);
});
