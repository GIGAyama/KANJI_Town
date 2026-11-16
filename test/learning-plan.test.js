import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFlashcardQueue,
  buildLearningPlan,
  buildWeakKanjiPlan,
  getDailyGoal,
  getDailyLearningProgress,
  getGoalAwareSessionLimits,
  getReviewForecast,
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

test('フラッシュカードは習った字だけから10字を選び、データの先頭にかたよらない', () => {
  const data = Array.from({ length: 300 }, (_, i) => ({ id: `k${i}`, grade: 1 + Math.floor(i / 50) }));
  const kanjiStats = Object.fromEntries(data.map((k) => [k.id, { status: 'review' }]));
  kanjiStats.k299 = { status: 'new' }; // まだ習っていない字は出さない
  // 決まった乱数で、たくさん選んで数える
  let seed = 12345;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let head = 0;
  let tail = 0;
  const trials = 4000;
  for (let t = 0; t < trials; t++) {
    const queue = buildFlashcardQueue({ kanjiData: data, kanjiStats, random });
    assert.equal(queue.length, 10);
    assert.equal(new Set(queue).size, 10);
    assert.ok(!queue.some((k) => k.id === 'k299'));
    for (const k of queue) {
      const index = Number(k.id.slice(1));
      if (index < 30) head++;
      if (index >= 269 && index < 299) tail++;
    }
  }
  // 先頭30字と末尾30字は、どちらも約10%（以前の並べかえでは 15.8% と 4.7%）
  const share = (n) => n / (trials * 10);
  assert.ok(Math.abs(share(head) - 30 / 299) < 0.015, `先頭 ${share(head)}`);
  assert.ok(Math.abs(share(tail) - 30 / 299) < 0.015, `末尾 ${share(tail)}`);
  assert.deepEqual(buildFlashcardQueue({ kanjiData: data, kanjiStats: {} }), []);
});

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

test('新出漢字はデータの並び（画数の少ない順）に出し、乱数に左右されない', () => {
  // 以前はシャッフルしてから切り出していて、1年生の初日に「森」「校」が出ることがあった
  for (const value of [0, 0.5, 0.99]) {
    const plan = buildLearningPlan({
      kanjiData, kanjiStats: {}, selectedGrade: 1, limits: { review: 5, new: 2 }, now: 200, random: () => value,
    });
    assert.deepEqual(plan.queue.map((kanji) => kanji.id), ['a', 'b']);
  }
  const shuffledPlan = buildLearningPlan({
    kanjiData, kanjiStats: {}, selectedGrade: 1, limits: { review: 5, new: 3 }, now: 200, random: () => 0, newOrder: 'random',
  });
  assert.deepEqual(shuffledPlan.queue.map((kanji) => kanji.id), ['b', 'c', 'a']);
});

test('学年の字をすべて習い、期限の来た復習も無いときは、弱い字から練習を組む（「一」1字だけにしない）', () => {
  const skill = (score) => ({ reading: { score }, meaning: { score }, writing: { score }, stroke: { score } });
  const kanjiStats = {
    a: { status: 'review', graduated: true, nextReview: 5000, skillMastery: skill(90) },
    b: { status: 'review', graduated: true, nextReview: 9000, skillMastery: skill(40) },
    c: { status: 'mastered', graduated: true, nextReview: 3000, skillMastery: skill(40) },
  };
  const results = [0, 0.5, 0.99].map((value) => buildLearningPlan({
    kanjiData, kanjiStats, selectedGrade: 1, limits: { review: 5, new: 2, total: 3 }, now: 200, random: () => value,
  }));
  for (const plan of results) {
    // 弱い技能の点が低い順 → 次の期限が近い順
    assert.deepEqual(plan.queue.map((kanji) => kanji.id), ['c', 'b', 'a']);
    assert.equal(plan.isPractice, true);
    assert.equal(plan.practiceCount, 3);
    assert.equal(plan.newCount, 0);
  }
  // 出題数の上限を守る
  const short = buildLearningPlan({ kanjiData, kanjiStats, selectedGrade: 1, limits: { review: 1, new: 0, total: 1 }, now: 200 });
  assert.deepEqual(short.queue.map((kanji) => kanji.id), ['c']);
});

test('選んだ学年をすべて習ったら、下の学年でまだ習っていない字を新出にする', () => {
  const data = [...kanjiData, { id: 'e', grade: 2 }];
  const kanjiStats = {
    a: { status: 'review', nextReview: 5000 },
    d: { status: 'review', nextReview: 5000 },
    e: { status: 'review', nextReview: 5000 },
  };
  const plan = buildLearningPlan({ kanjiData: data, kanjiStats, selectedGrade: 2, limits: { review: 5, new: 2 }, now: 200 });
  assert.deepEqual(plan.queue.map((kanji) => kanji.id), ['b', 'c']);
  assert.equal(plan.isPractice, false);
  assert.equal(plan.newCount, 2);
});

test('学習目標は安全な既定値と当日進捗を返す', () => {
  assert.equal(getDailyGoal({ dailyGoal: 999 }), 10);
  assert.deepEqual(
    getDailyLearningProgress({ settings: { dailyGoal: 5 }, daily: { '2026-07-21': { reviewed: 7 } } }, '2026-07-21'),
    { goal: 5, reviewed: 7, remaining: 0, percent: 100, isComplete: true },
  );
});

test('通常セッションは今日の残り目標を超えず、復習を優先して短く区切る', () => {
  const limits = getGoalAwareSessionLimits(
    { review: 20, new: 5 },
    { remaining: 3, isComplete: false },
  );
  const plan = buildLearningPlan({
    kanjiData,
    kanjiStats: {
      a: { status: 'review', nextReview: 100 },
      b: { status: 'learning', nextReview: 50 },
    },
    selectedGrade: 1,
    limits,
    now: 200,
    random: () => 0.5,
  });

  assert.equal(limits.total, 3);
  assert.deepEqual(plan.queue.map((kanji) => kanji.id), ['b', 'a', 'c']);
  assert.equal(plan.reviewCount, 2);
  assert.equal(plan.newCount, 1);
});

test('今日の目標達成後は設定済みのセッション量へ戻す', () => {
  assert.deepEqual(
    getGoalAwareSessionLimits(
      { review: 20, new: 5 },
      { remaining: 0, isComplete: true },
    ),
    { review: 20, new: 5, total: 25 },
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

test('週次サマリーは、てきとう書きの回数も日ごと・7日の合計で返す（学習きろくで先生が見る）', () => {
  const summary = getWeeklyLearningSummary({
    daily: {
      '2026-07-14': { exp: 0, reviewed: 0, attempts: 0, correct: 0, careless: 4 }, // 7日より前は数えない
      '2026-07-20': { exp: 0, reviewed: 0, attempts: 3, correct: 0, careless: 3 },
      '2026-07-21': { exp: 30, reviewed: 5, attempts: 6, correct: 5, careless: 1 },
    },
  }, new Date(2026, 6, 21, 12));
  assert.equal(summary.careless, 4);
  assert.deepEqual(summary.days.map((day) => day.careless), [0, 0, 0, 0, 0, 3, 1]);
  // てきとう書きだけの日（答えていない日）は、学習した日に数えない
  const only = getWeeklyLearningSummary({ daily: { '2026-07-21': { exp: 0, reviewed: 0, attempts: 0, correct: 0, careless: 2 } } }, new Date(2026, 6, 21, 12));
  assert.equal(only.studiedDays, 0);
  assert.equal(only.careless, 2);
  // 古い記録（欄が無い）は 0
  assert.equal(getWeeklyLearningSummary({ daily: { '2026-07-21': { exp: 30, reviewed: 5 } } }, new Date(2026, 6, 21, 12)).careless, 0);
});

test('週次サマリーは、てきとう書きの確かめが出た回数も返す（そのまま進んだ回数とは別に数える）', () => {
  const summary = getWeeklyLearningSummary({
    daily: {
      '2026-07-14': { exp: 0, reviewed: 0, carelessWarned: 9 }, // 7日より前は数えない
      '2026-07-20': { exp: 0, reviewed: 0, carelessWarned: 3, careless: 1 },
      '2026-07-21': { exp: 30, reviewed: 5, attempts: 6, correct: 5, carelessWarned: 2 },
    },
  }, new Date(2026, 6, 21, 12));
  assert.equal(summary.carelessWarned, 5);
  assert.equal(summary.careless, 1);
  assert.deepEqual(summary.days.map((day) => day.carelessWarned), [0, 0, 0, 0, 0, 3, 2]);
  // 確かめが出ただけの日は、学習した日に数えない
  assert.equal(summary.days[5].studied, false);
  assert.equal(getWeeklyLearningSummary({ daily: {} }, new Date(2026, 6, 21, 12)).carelessWarned, 0);
});

test('挑戦数のない旧日次データから正答率を推測しない', () => {
  const summary = getWeeklyLearningSummary({
    settings: { dailyGoal: 5 },
    daily: { '2026-07-21': { exp: 30, reviewed: 5 } },
  }, new Date(2026, 6, 21, 12));

  assert.equal(summary.goalDays, 1);
  assert.equal(summary.accuracy, null);
});

test('復習予報は期限超過を今日へまとめ、学習前カードを除外する', () => {
  const now = new Date(2026, 6, 21, 12, 0, 0);
  const forecast = getReviewForecast({
    overdue: { status: 'review', nextReview: new Date(2026, 6, 20, 9).getTime() },
    laterToday: { status: 'learning', nextReview: new Date(2026, 6, 21, 18).getTime() },
    tomorrow: { status: 'mastered', nextReview: new Date(2026, 6, 22, 8).getTime() },
    newCard: { status: 'new', nextReview: new Date(2026, 6, 21, 10).getTime() },
    beyondForecast: { status: 'review', nextReview: new Date(2026, 6, 30, 8).getTime() },
    invalid: { status: 'review', nextReview: 'not-a-date' },
  }, now);

  assert.equal(forecast.overdueCount, 1);
  assert.equal(forecast.todayCount, 2);
  assert.equal(forecast.tomorrowCount, 1);
  assert.equal(forecast.weekCount, 3);
  assert.equal(forecast.days.length, 7);
  assert.equal(forecast.nextReviewAt, new Date(2026, 6, 21, 18).getTime());
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
