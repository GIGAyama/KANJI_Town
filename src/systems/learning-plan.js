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

  const reviewTargets = dueReviews.slice(0, reviewLimit);
  const newTargets = shuffle(newCandidates, random).slice(0, newLimit);
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
