import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLearningPlan,
  buildWeakKanjiPlan,
  getDailyGoal,
  getDailyLearningProgress,
  getWeeklyLearningSummary,
  WEAK_PRACTICE_SUCCESS_TARGET,
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

test('週次サマリーは目標達成日と記録済み回答の正答率を集計する', () => {
  const summary = getWeeklyLearningSummary({
    settings: { dailyGoal: 5 },
    daily: {
      '2026-07-15': { exp: 40, reviewed: 5, attempts: 6, correct: 5 },
      '2026-07-16': { exp: 20, reviewed: 3, attempts: 5, correct: 3 },
      '2026-07-21': { exp: 0, reviewed: 0, attempts: 2, correct: 0 },
    },
  }, new Date(2026, 6, 21, 12));

  assert.equal(summary.studiedDays, 3);
  assert.equal(summary.goalDays, 1);
  assert.equal(summary.reviewed, 8);
  assert.equal(summary.attempts, 13);
  assert.equal(summary.correct, 8);
  assert.equal(summary.accuracy, 62);
  assert.equal(summary.consistencyPercent, 14);
});

test('挑戦数のない旧日次データから正答率を推測しない', () => {
  const summary = getWeeklyLearningSummary({
    settings: { dailyGoal: 5 },
    daily: { '2026-07-21': { exp: 30, reviewed: 5 } },
  }, new Date(2026, 6, 21, 12));

  assert.equal(summary.goalDays, 1);
  assert.equal(summary.accuracy, null);
});

test('苦手特訓は期限内のつまずきを優先し、3回連続正解した漢字を外す', () => {
  const plan = buildWeakKanjiPlan({
    kanjiData,
    kanjiStats: {
      a: { status: 'review', nextReview: 100, mistakes: 5, lapses: 0, practiceStreak: 0 },
      b: { status: 'learning', nextReview: 50, mistakes: 1, lapses: 2, practiceStreak: 1 },
      c: { status: 'review', nextReview: 0, mistakes: 10, lapses: 3, practiceStreak: WEAK_PRACTICE_SUCCESS_TARGET },
      d: { status: 'review', nextReview: 500, mistakes: 20, lapses: 4, practiceStreak: 0 },
    },
    now: 200,
    limit: 5,
  });

  assert.deepEqual(plan.queue.map((kanji) => kanji.id), ['b', 'a', 'd']);
  assert.equal(plan.availableCount, 3);
  assert.equal(plan.dueCount, 2);
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
