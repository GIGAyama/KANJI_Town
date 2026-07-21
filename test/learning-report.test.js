import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attachReportSource,
  buildLearningReport,
  isLearningReportCurrent,
} from '../src/systems/learning-report.js';

test('見守りレポートは学習支援に必要な要約だけを含む', () => {
  const report = buildLearningReport({
    targetGrade: 2,
    totalExp: 480,
    streak: 6,
    lastDate: '2026-07-21',
    sessionCount: 9,
    townMap: { secret: 't_house1' },
    myDrills: [{ name: '非公開ドリル' }],
    settings: { theme: 'private' },
    kanjiStats: {
      k1_1: { status: 'mastered', mistakes: 0, nextReview: Date.parse('2026-07-22T00:00:00Z') },
      k1_2: { status: 'review', mistakes: 3, lapses: 1, nextReview: Date.parse('2026-07-20T00:00:00Z') },
    },
    daily: {
      '2026-07-21': { reviewed: 10, attempts: 12, correct: 9, exp: 50 },
    },
  }, new Date('2026-07-21T12:00:00Z'));

  assert.equal(report.grade, 2);
  assert.deepEqual(report.progress, { learned: 2, mastered: 1, totalExp: 480, sessions: 9 });
  assert.equal(report.habit.accuracy, 75);
  assert.equal(report.support.overdueReviews, 1);
  assert.deepEqual(report.support.weakKanjiIds, ['k1_2']);
  assert.equal(report.townMap, undefined);
  assert.equal(report.myDrills, undefined);
  assert.equal(report.settings, undefined);
  assert.equal(report.kanjiStats, undefined);
});

test('不正値を安全な既定値へ正規化する', () => {
  const report = buildLearningReport({
    targetGrade: 99,
    totalExp: -10,
    sessionCount: 'invalid',
    lastDate: 'not-a-date',
  }, new Date('2026-07-21T00:00:00Z'));

  assert.equal(report.grade, 6);
  assert.equal(report.progress.totalExp, 0);
  assert.equal(report.progress.sessions, 0);
  assert.equal(report.habit.lastLearningDate, null);
});

test('レポートが同じ学習データから生成されたか判定する', () => {
  const report = attachReportSource(buildLearningReport({}, new Date('2026-07-21T00:00:00Z')), 'payload-hash');
  assert.equal(isLearningReportCurrent(report, 'payload-hash'), true);
  assert.equal(isLearningReportCurrent(report, 'new-hash'), false);
  assert.equal(isLearningReportCurrent(null, 'payload-hash'), false);
});
