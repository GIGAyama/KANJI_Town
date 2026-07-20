import { formatDate } from '../utils/date-utils.js';

export const DAILY_GOAL_OPTIONS = [5, 10, 20];
export const DEFAULT_DAILY_GOAL = 10;
export const DEFAULT_WEAK_SESSION_LIMIT = 5;
export const WEAK_PRACTICE_SUCCESS_TARGET = 3;

const asLimit = (value) => Math.max(0, Math.floor(Number(value) || 0));

function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getDailyGoal(settings) {
  const value = Number(settings?.dailyGoal);
  return DAILY_GOAL_OPTIONS.includes(value) ? value : DEFAULT_DAILY_GOAL;
}

export function getDailyLearningProgress(stats, today) {
  const goal = getDailyGoal(stats?.settings);
  const reviewed = Math.max(0, Number(stats?.daily?.[today]?.reviewed) || 0);
  const remaining = Math.max(0, goal - reviewed);
  return {
    goal,
    reviewed,
    remaining,
    percent: Math.min(100, Math.round((reviewed / goal) * 100)),
    isComplete: reviewed >= goal,
  };
}

/**
 * 1日の残り目標に合わせて、次の通常セッションを短く区切る。
 * 目標達成後は設定済みのセッション量へ戻し、自由に学習を続けられる。
 */
export function getGoalAwareSessionLimits(limits, dailyProgress) {
  const review = asLimit(limits?.review);
  const newLimit = asLimit(limits?.new);
  const configuredTotal = review + newLimit;
  const remaining = asLimit(dailyProgress?.remaining);
  const shouldCapToGoal = !dailyProgress?.isComplete && remaining > 0;

  return {
    review,
    new: newLimit,
    total: shouldCapToGoal ? Math.min(configuredTotal, remaining) : configuredTotal,
  };
}

/**
 * 指定日までの7日間を、現在の1日目標と学習実績から集計する。
 * 旧データに挑戦数がない場合は正答率へ含めず、推測値を表示しない。
 */
export function getWeeklyLearningSummary(stats, endDate = new Date()) {
  const parsedEnd = new Date(endDate);
  const end = Number.isNaN(parsedEnd.getTime()) ? new Date() : parsedEnd;
  end.setHours(12, 0, 0, 0);

  const goal = getDailyGoal(stats?.settings);
  const days = [];

  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date(end);
    date.setDate(end.getDate() - offset);
    const key = formatDate(date);
    const record = stats?.daily?.[key] || {};
    const exp = Math.max(0, Number(record.exp) || 0);
    const reviewed = Math.max(0, Number(record.reviewed) || 0);
    const attempts = Math.max(0, Number(record.attempts) || 0);
    const correct = Math.min(attempts, Math.max(0, Number(record.correct) || 0));

    days.push({
      key,
      date,
      exp,
      reviewed,
      attempts,
      correct,
      studied: exp > 0 || reviewed > 0 || attempts > 0,
      goalComplete: reviewed >= goal,
    });
  }

  const totals = days.reduce((summary, day) => ({
    studiedDays: summary.studiedDays + (day.studied ? 1 : 0),
    goalDays: summary.goalDays + (day.goalComplete ? 1 : 0),
    reviewed: summary.reviewed + day.reviewed,
    attempts: summary.attempts + day.attempts,
    correct: summary.correct + day.correct,
  }), { studiedDays: 0, goalDays: 0, reviewed: 0, attempts: 0, correct: 0 });

  return {
    ...totals,
    goal,
    days,
    consistencyPercent: Math.round((totals.goalDays / days.length) * 100),
    accuracy: totals.attempts > 0
      ? Math.round((totals.correct / totals.attempts) * 100)
      : null,
  };
}

/**
 * 過去につまずいた漢字から、短い集中練習用のキューを作る。
 * 復習期限、ラプス、ミス、連続正解数、容易度の順で優先する。
 * 3回連続で正解した漢字は一度キューから外し、成功体験を可視化する。
 */
export function buildWeakKanjiPlan({
  kanjiData,
  kanjiStats = {},
  limit = DEFAULT_WEAK_SESSION_LIMIT,
  now = Date.now(),
}) {
  const safeLimit = asLimit(limit);
  const candidates = kanjiData
    .filter((kanji) => {
      const stat = kanjiStats[kanji.id];
      if (!stat || stat.status === 'new') return false;

      const hasDifficultySignal = (stat.mistakes || 0) > 0
        || (stat.lapses || 0) > 0
        || (stat.ease ?? 2.5) < 2.5;
      return hasDifficultySignal
        && (stat.practiceStreak || 0) < WEAK_PRACTICE_SUCCESS_TARGET;
    })
    .sort((a, b) => {
      const aStat = kanjiStats[a.id] || {};
      const bStat = kanjiStats[b.id] || {};
      const aDue = (aStat.nextReview || 0) <= now ? 1 : 0;
      const bDue = (bStat.nextReview || 0) <= now ? 1 : 0;

      return (bDue - aDue)
        || ((bStat.lapses || 0) - (aStat.lapses || 0))
        || ((bStat.mistakes || 0) - (aStat.mistakes || 0))
        || ((aStat.practiceStreak || 0) - (bStat.practiceStreak || 0))
        || ((aStat.ease ?? 2.5) - (bStat.ease ?? 2.5))
        || ((aStat.nextReview || 0) - (bStat.nextReview || 0))
        || String(a.id).localeCompare(String(b.id));
    });

  const queue = candidates.slice(0, safeLimit);
  return {
    queue,
    availableCount: candidates.length,
    dueCount: candidates.filter((kanji) => (kanjiStats[kanji.id]?.nextReview || 0) <= now).length,
  };
}

/**
 * 復習を最優先しつつ、設定された新出漢字も同じセッションに加える。
 * 既存UIの「復習N＋新出N」という表示と実際の出題数を一致させる。
 */
export function buildLearningPlan({
  kanjiData,
  kanjiStats = {},
  selectedGrade,
  limits,
  now = Date.now(),
  random = Math.random,
}) {
  const reviewLimit = asLimit(limits?.review);
  const newLimit = asLimit(limits?.new);
  const totalLimit = limits?.total === undefined
    ? reviewLimit + newLimit
    : asLimit(limits.total);

  const dueReviews = kanjiData
    .filter((kanji) => {
      const stat = kanjiStats[kanji.id];
      return stat && stat.status !== 'new' && (stat.nextReview || 0) <= now;
    })
    .sort((a, b) => {
      const aStat = kanjiStats[a.id] || {};
      const bStat = kanjiStats[b.id] || {};
      const dueOrder = (aStat.nextReview || 0) - (bStat.nextReview || 0);
      return dueOrder || (bStat.mistakes || 0) - (aStat.mistakes || 0);
    });

  const newCandidates = kanjiData.filter((kanji) => {
    const stat = kanjiStats[kanji.id];
    return kanji.grade === selectedGrade && (!stat || stat.status === 'new');
  });

  const reviewTargets = dueReviews.slice(0, Math.min(reviewLimit, totalLimit));
  const remainingSlots = Math.max(0, totalLimit - reviewTargets.length);
  const newTargets = shuffle(newCandidates, random).slice(0, Math.min(newLimit, remainingSlots));
  const queue = [...reviewTargets, ...newTargets];

  if (queue.length === 0) {
    const fallback = kanjiData.find((kanji) => kanji.grade === selectedGrade);
    if (fallback) queue.push(fallback);
  }

  return {
    queue,
    dueCount: dueReviews.length,
    reviewCount: reviewTargets.length,
    newCount: newTargets.length,
    newAvailableCount: newCandidates.length,
  };
}
