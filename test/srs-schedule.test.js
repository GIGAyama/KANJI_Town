import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextReview,
  describeNextReview,
  dueAtLocalDay,
  isEarlyReview,
  DEFAULT_EASE,
  EASY_INTERVAL,
  GRADUATING_INTERVAL,
  LEARNING_STEPS,
  MAX_EASE,
  MAX_INTERVAL,
  MIN_EASE,
} from '../src/systems/srs.js';

const DAY = 24 * 60 * 60 * 1000;
// 端末の地方時で組み立てる（どのタイムゾーンで走らせても同じ意味になる）
const at = (day, hour, minute = 0) => new Date(2026, 10, day, hour, minute).getTime();

const newCard = () => ({ graduated: false, stepIdx: 0, interval: LEARNING_STEPS[0], nextReview: 0, ease: DEFAULT_EASE });
const reviewCard = (intervalDays, overrides = {}) => ({
  graduated: true, stepIdx: 0, interval: intervalDays * DAY, nextReview: at(16, 3), ease: DEFAULT_EASE, ...overrides,
});

test('学習段階: good で 1分 → 10分 と進み、もう一度 good で卒業する', () => {
  const now = at(16, 10, 0);
  const first = calculateNextReview(newCard(), 'good', now);
  assert.equal(first.graduated, false);
  assert.equal(first.stepIdx, 1);
  assert.equal(first.nextReview, now + LEARNING_STEPS[1]);
  const graduated = calculateNextReview({ ...newCard(), ...first }, 'good', now + LEARNING_STEPS[1]);
  assert.equal(graduated.graduated, true);
  assert.equal(graduated.interval, GRADUATING_INTERVAL);
});

test('卒業した字の「あしたの復習」は、24時間後ではなく翌日の朝から出る', () => {
  // 1日目の 10:40 に卒業した字は、2日目の 10:00（同じ2時間目の授業）には復習に出る
  const graduatedAt = at(16, 10, 40);
  const next = calculateNextReview({ ...newCard(), stepIdx: 1 }, 'good', graduatedAt);
  assert.ok(next.nextReview <= at(17, 10, 0), new Date(next.nextReview).toString());
  assert.equal(next.nextReview, at(17, 3, 0));
  // 間隔の値そのものは 1 日のまま（次の掛け算に使う）
  assert.equal(next.interval, GRADUATING_INTERVAL);
});

test('dueAtLocalDay: 1日以上は その日の朝3時、1日未満の学習ステップはそのまま', () => {
  assert.equal(dueAtLocalDay(at(16, 23, 30), DAY), at(17, 3, 0));
  assert.equal(dueAtLocalDay(at(16, 10, 0), 3 * DAY), at(19, 3, 0));
  assert.equal(dueAtLocalDay(at(16, 10, 0), 10 * 60 * 1000), at(16, 10, 10));
});

test('学習段階でまちがえても、容易度（ease）は下がらない', () => {
  let card = newCard();
  for (let i = 0; i < 6; i++) card = { ...card, ...calculateNextReview(card, 'again', at(16, 10, i)) };
  assert.equal(card.ease, DEFAULT_EASE);
  for (let i = 0; i < 6; i++) card = { ...card, ...calculateNextReview(card, 'hard', at(16, 11, i)) };
  assert.equal(card.ease, DEFAULT_EASE);
});

test('新出字の easy は 4日後の朝に卒業し、容易度は変えない', () => {
  const next = calculateNextReview(newCard(), 'easy', at(16, 10, 0));
  assert.equal(next.graduated, true);
  assert.equal(next.interval, EASY_INTERVAL);
  assert.equal(next.nextReview, at(20, 3, 0));
  assert.equal(next.ease, DEFAULT_EASE);
});

test('復習: hard は ×1.2、good は ×ease、easy は ×ease×1.3', () => {
  const now = at(16, 10, 0); // 期限（16日 3:00）は過ぎている
  const card = reviewCard(10);
  assert.equal(calculateNextReview(card, 'hard', now).interval, 12 * DAY);
  assert.equal(calculateNextReview(card, 'good', now).interval, 25 * DAY);
  assert.equal(calculateNextReview(card, 'easy', now).interval, Math.round(10 * DAY * 2.5 * 1.3));
  assert.equal(calculateNextReview(card, 'hard', now).nextReview, at(28, 3, 0));
});

test('復習の again は学習段階へ戻し、容易度を下げてラプスを数える', () => {
  const next = calculateNextReview(reviewCard(10, { lapses: 1 }), 'again', at(16, 10, 0));
  assert.equal(next.graduated, false);
  assert.equal(next.interval, LEARNING_STEPS[0]);
  assert.equal(next.ease, DEFAULT_EASE - 0.2);
  assert.equal(next.lapses, 2);
  // 下限
  assert.equal(calculateNextReview(reviewCard(10, { ease: MIN_EASE }), 'again', at(16, 10, 0)).ease, MIN_EASE);
});

test('期限前の早い復習では、hard/good/easy でも間隔と容易度を伸ばさない', () => {
  const card = reviewCard(3, { nextReview: at(19, 3, 0) });
  const now = at(16, 10, 0);
  assert.equal(isEarlyReview(card, now), true);
  for (const evaluation of ['hard', 'good', 'easy']) {
    const next = calculateNextReview(card, evaluation, now);
    assert.equal(next.interval, card.interval, evaluation);
    assert.equal(next.nextReview, card.nextReview, evaluation);
    assert.equal(next.ease, card.ease, evaluation);
  }
  // 忘れていたことは期限前でも記録する
  assert.equal(calculateNextReview(card, 'again', now).graduated, false);
});

test('ボスバトルで同じ字に「easy」が数分のうちに5回続いても、間隔は伸びない', () => {
  // 以前は 3.25日 → 11.2日 → 40.8日 → 156日 → 630日 と伸び、ease も 3.25 まで上がった
  let card = { ...reviewCard(1, { nextReview: at(16, 3, 0) }) };
  const start = at(16, 10, 0); // 期限は過ぎている → 1回目だけ本当の復習
  for (let i = 0; i < 5; i++) card = { ...card, ...calculateNextReview(card, 'easy', start + i * 60_000) };
  assert.equal(card.interval, Math.round(DAY * DEFAULT_EASE * 1.3));
  assert.ok(card.ease <= MAX_EASE);
});

test('容易度には上限があり、卒業後の good で既定値まで少しずつ戻る', () => {
  let card = reviewCard(1, { ease: 2.95 });
  let now = at(16, 10, 0);
  for (let i = 0; i < 5; i++) {
    card = { ...card, ...calculateNextReview(card, 'easy', now) };
    now = card.nextReview + 1;
  }
  assert.equal(card.ease, MAX_EASE);

  let low = reviewCard(1, { ease: MIN_EASE });
  now = at(16, 10, 0);
  low = { ...low, ...calculateNextReview(low, 'good', now) };
  assert.equal(Math.round(low.ease * 100), Math.round((MIN_EASE + 0.05) * 100));
  const atDefault = calculateNextReview(reviewCard(1, { ease: DEFAULT_EASE }), 'good', at(16, 10, 0));
  assert.equal(atDefault.ease, DEFAULT_EASE);
});

test('復習間隔は1年を超えない', () => {
  const next = calculateNextReview(reviewCard(300, { ease: MAX_EASE }), 'easy', at(16, 10, 0));
  assert.equal(next.interval, MAX_INTERVAL);
});

test('評価ボタンの「次回」は、実際の間隔と同じ言いかえになる', () => {
  const now = at(16, 10, 0);
  // 新出字の good は 10 分後。セッションのあとに出すまでの最短 30 分を入れると 30 分後
  assert.deepEqual(describeNextReview(newCard(), 'good', now), { unit: 'minutes', value: 10 });
  assert.deepEqual(describeNextReview(newCard(), 'good', now, { minLearningDelay: 30 * 60_000 }), { unit: 'minutes', value: 30 });
  // 新出字の easy は 4 日後
  assert.deepEqual(describeNextReview(newCard(), 'easy', now), { unit: 'days', value: 4 });
  // 卒業の good は あした
  assert.deepEqual(describeNextReview({ ...newCard(), stepIdx: 1 }, 'good', now), { unit: 'days', value: 1 });
  // 10日間隔の hard は 12 日後（以前は「まもなく」と出ていた）
  assert.deepEqual(describeNextReview(reviewCard(10), 'hard', now), { unit: 'days', value: 12 });
  // 期限前の早い復習は、いまの予定のまま
  assert.deepEqual(describeNextReview(reviewCard(3, { nextReview: at(19, 3, 0) }), 'good', now), { unit: 'days', value: 3 });
});
