import test from 'node:test';
import assert from 'node:assert/strict';
import { countStudyTotals, foldDailyIntoArchive } from '../src/systems/daily-archive.js';

const makeDaily = (days) => Object.fromEntries(days.map((date, i) => [date, { exp: 10, reviewed: 3, perfects: 1, attempts: 4, correct: 2 + (i % 2) }]));

test('古い日を月ごとの集計にたたんでも、通算の学習日数と復習回数は変わらない', () => {
  const stats = {
    daily: makeDaily(['2026-08-30', '2026-08-31', '2026-09-01', '2026-11-14', '2026-11-15']),
  };
  const before = countStudyTotals(stats);
  const folded = foldDailyIntoArchive(stats, '2026-11-01');
  assert.deepEqual(Object.keys(folded.daily), ['2026-11-14', '2026-11-15']);
  assert.deepEqual(folded.dailyArchive['2026-08'], { days: 2, exp: 20, reviewed: 6, perfects: 2, attempts: 8, correct: 5 });
  assert.equal(folded.dailyArchive['2026-09'].days, 1);
  assert.deepEqual(countStudyTotals(folded), before);
  assert.deepEqual(before, { loginDays: 5, reviewTotal: 15 });
});

test('すでにある月の集計に足しこみ、元の stats は変えない', () => {
  const stats = { daily: makeDaily(['2026-08-31']), dailyArchive: { '2026-08': { days: 4, reviewed: 10 } } };
  const folded = foldDailyIntoArchive(stats, null);
  assert.deepEqual(folded.daily, {});
  assert.equal(folded.dailyArchive['2026-08'].days, 5);
  assert.equal(folded.dailyArchive['2026-08'].reviewed, 13);
  assert.deepEqual(Object.keys(stats.daily), ['2026-08-31']);
  assert.equal(stats.dailyArchive['2026-08'].days, 4);
});

test('記録が無くても数えられる', () => {
  assert.deepEqual(countStudyTotals({}), { loginDays: 0, reviewTotal: 0 });
  assert.equal(foldDailyIntoArchive(null, null), null);
});

test('てきとう書きの回数も月ごとの集計に足す（0 回の月には欄を作らない）', () => {
  const stats = { daily: {
    '2026-08-30': { exp: 0, reviewed: 0, perfects: 0, attempts: 3, correct: 0, careless: 2 },
    '2026-08-31': { exp: 10, reviewed: 3, perfects: 0, attempts: 4, correct: 3, careless: 1 },
    '2026-09-01': { exp: 10, reviewed: 3, perfects: 0, attempts: 4, correct: 3 },
  } };
  const folded = foldDailyIntoArchive(stats, null);
  assert.equal(folded.dailyArchive['2026-08'].careless, 3);
  assert.equal('careless' in folded.dailyArchive['2026-09'], false);
});
