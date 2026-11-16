import { formatDate } from '../utils/date-utils.js';
import { getWeakestSkill, MEASURED_SKILLS } from './mastery.js';

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
      // てきとう書き（線を1本引く・点を打つだけで答え合わせをした回数）
      careless: Math.max(0, Number(record.careless) || 0),
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
    careless: summary.careless + day.careless,
  }), { studiedDays: 0, goalDays: 0, reviewed: 0, attempts: 0, correct: 0, careless: 0 });

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
 * 間隔反復の次回日時をローカル日付へまとめ、今日からの復習量を予報する。
 * 期限超過分は今日へ含め、学習前のカードや不正な日時は集計しない。
 */
export function getReviewForecast(kanjiStats = {}, now = new Date(), dayCount = 7) {
  const parsedNow = new Date(now);
  const current = Number.isNaN(parsedNow.getTime()) ? new Date() : parsedNow;
  const currentTime = current.getTime();
  const safeDayCount = Math.min(31, Math.max(1, Math.floor(Number(dayCount) || 7)));
  const firstDay = new Date(current);
  firstDay.setHours(0, 0, 0, 0);

  const days = Array.from({ length: safeDayCount }, (_, index) => {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + index);
    date.setHours(12, 0, 0, 0);
    return { key: formatDate(date), date, count: 0 };
  });
  const dayIndex = new Map(days.map((day, index) => [day.key, index]));
  let overdueCount = 0;
  let nextReviewAt = null;

  Object.values(kanjiStats || {}).forEach((stat) => {
    if (!stat || stat.status === 'new') return;
    const dueAt = Number(stat.nextReview);
    if (!Number.isFinite(dueAt)) return;
    const dueDate = new Date(dueAt);
    if (Number.isNaN(dueDate.getTime())) return;

    if (dueAt <= currentTime) overdueCount += 1;
    if (dueAt > currentTime && (nextReviewAt === null || dueAt < nextReviewAt)) {
      nextReviewAt = dueAt;
    }

    const dueKey = formatDate(dueDate);
    const index = dueKey < days[0].key ? 0 : dayIndex.get(dueKey);
    if (index !== undefined) days[index].count += 1;
  });

  const weekCount = days.reduce((total, day) => total + day.count, 0);
  return {
    days,
    overdueCount,
    todayCount: days[0]?.count || 0,
    tomorrowCount: days[1]?.count || 0,
    weekCount,
    maxCount: Math.max(...days.map((day) => day.count), 1),
    nextReviewAt,
  };
}

export const FLASHCARD_COUNT = 10;

/**
 * フラッシュカードの出題を、習った字から一様に選ぶ（Fisher–Yates）。
 * 以前は sort(() => Math.random() - 0.5) で並べかえていて、一様にならなかった。
 * 習った字はデータの並び（1年→6年）なので、1年生の字ばかりが出て、最近覚えた字が出にくかった
 * （300字から10字を選ぶと、先頭の30字が選ばれる割合 15.8%、末尾の30字 4.7%。期待値はどちらも10%）。
 */
export function buildFlashcardQueue({ kanjiData, kanjiStats = {}, count = FLASHCARD_COUNT, random = Math.random }) {
  const learned = kanjiData.filter((kanji) => {
    const stat = kanjiStats[kanji.id];
    return stat && stat.status !== 'new';
  });
  return shuffle(learned, random).slice(0, asLimit(count));
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
 * 「ならった範囲」（learning-range.js。stats.settings.learningRange）から出す新出の候補。
 * 日付（端末のローカル日付 YYYY-MM-DD）が来た段の、まだ習っていない字を、段の順・段の中の順に返す。
 * 日付が来た段の字をすべて習っても、まだ日付の来ていない段に習っていない字があれば [] を返す
 * （次の段の日まで新出は出さない）。範囲が無い・範囲の字をすべて習ったときは null（学年の字に戻す）。
 * 範囲は受け取るときに確かめてあるので、ここでは形の崩れた段を飛ばすだけにする。
 */
export function getRangeNewCandidates(range, kanjiData, isUnlearned, today) {
  if (!Array.isArray(range?.stages)) return null;
  const byId = new Map(kanjiData.map((kanji) => [kanji.id, kanji]));
  const seen = new Set();
  const started = [];
  let waiting = false;
  for (const stage of range.stages) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(stage?.from) || !Array.isArray(stage.kanjis)) continue;
    const unlearned = stage.kanjis
      .map((id) => byId.get(id))
      .filter((kanji) => kanji && !seen.has(kanji.id) && seen.add(kanji.id) && isUnlearned(kanji));
    if (stage.from <= today) started.push(...unlearned);
    else if (unlearned.length > 0) waiting = true;
  }
  return started.length > 0 || waiting ? started : null;
}

/**
 * 復習を最優先しつつ、設定された新出漢字も同じセッションに加える。
 * 既存UIの「復習N＋新出N」という表示と実際の出題数を一致させる。
 *
 * 新出漢字は、データの並び（学年の中で画数の少ない順）に出す。以前はランダムで、
 * 1年生の初日に「森（12画）」や「校」が出ることがあった。newOrder: 'random' で従来の出し方にできる。
 *
 * 選んだ学年の新出が無ければ、それより下の学年でまだ習っていない字を新出にする。
 * それも無く、期限の来た復習も無いときは、選んだ学年の習った字から
 * 「いちばん弱い技能の点が低い順 → 次の期限が近い順」に練習を組む（isPractice: true）。
 * 以前はこの場合、学年の最初の1字（1年なら「一」）だけが毎回出ていた。
 *
 * 先生の配った「ならった範囲」（range）があるときは、新出を範囲の日付が来た段の字だけから
 * 段の順に出す（getRangeNewCandidates）。復習は今までどおりすべての字から。練習も範囲の字から組む。
 * 範囲の字をすべて習ったら、今までどおり学年の字に戻す（rangeActive: false）。
 */
export function buildLearningPlan({
  kanjiData,
  kanjiStats = {},
  selectedGrade,
  limits,
  now = Date.now(),
  random = Math.random,
  newOrder = 'data',
  range = null,
  today = formatDate(new Date(now)),
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

  const isUnlearned = (kanji) => {
    const stat = kanjiStats[kanji.id];
    return !stat || stat.status === 'new';
  };
  const rangeCandidates = range ? getRangeNewCandidates(range, kanjiData, isUnlearned, today) : null;
  const gradeCandidates = kanjiData.filter((kanji) => kanji.grade === selectedGrade && isUnlearned(kanji));
  // 選んだ学年をすべて習ったら、下の学年でまだ習っていない字（低い学年から）
  const newCandidates = rangeCandidates || (gradeCandidates.length > 0
    ? gradeCandidates
    : kanjiData
      .filter((kanji) => kanji.grade < selectedGrade && isUnlearned(kanji))
      .sort((a, b) => a.grade - b.grade));

  const reviewTargets = dueReviews.slice(0, Math.min(reviewLimit, totalLimit));
  const remainingSlots = Math.max(0, totalLimit - reviewTargets.length);
  const orderedNew = newOrder === 'random' ? shuffle(newCandidates, random) : newCandidates;
  const newTargets = orderedNew.slice(0, Math.min(newLimit, remainingSlots));
  const queue = [...reviewTargets, ...newTargets];

  let practiceCount = 0;
  if (queue.length === 0) {
    // 範囲があれば、日付が来た段の習った字から練習する（無ければ学年の字から）
    const rangeIds = rangeCandidates ? new Set(range.stages.filter((stage) => stage?.from <= today).flatMap((stage) => stage.kanjis)) : null;
    const limit = totalLimit || newLimit || 1;
    let practice = rangeIds ? buildPracticeTargets({ kanjiData, kanjiStats, inPool: (kanji) => rangeIds.has(kanji.id), limit }) : [];
    if (practice.length === 0) practice = buildPracticeTargets({ kanjiData, kanjiStats, inPool: (kanji) => kanji.grade === selectedGrade, limit });
    queue.push(...practice);
    practiceCount = practice.length;
    // 学年に1字も習った字が無い（データの不整合など）ときだけ、学年の最初の字を出す
    if (queue.length === 0) {
      const fallback = kanjiData.find((kanji) => kanji.grade === selectedGrade);
      if (fallback) queue.push(fallback);
    }
  }

  return {
    queue,
    dueCount: dueReviews.length,
    reviewCount: reviewTargets.length,
    newCount: newTargets.length,
    newAvailableCount: newCandidates.length,
    practiceCount,
    isPractice: practiceCount > 0,
    rangeActive: Boolean(rangeCandidates),
  };
}

/**
 * 期限の来た復習も新出も無いときの練習。選んだ学年（inPool）の習った字を、
 * いちばん弱い技能の点が低い順 → 次の期限が近い順に並べる。
 * 期限前の字なので、間隔反復は伸ばさない（App の handleUpdateStat が期限前の早い復習として扱う）。
 */
function buildPracticeTargets({ kanjiData, kanjiStats, inPool, limit }) {
  return kanjiData
    .filter((kanji) => {
      const stat = kanjiStats[kanji.id];
      return inPool(kanji) && stat && stat.status !== 'new';
    })
    .map((kanji, index) => {
      const stat = kanjiStats[kanji.id];
      return { kanji, index, weakest: getWeakestSkill(stat, { skills: MEASURED_SKILLS }).score, due: Number(stat.nextReview) || 0 };
    })
    .sort((a, b) => (a.weakest - b.weakest) || (a.due - b.due) || (a.index - b.index))
    .slice(0, Math.max(1, asLimit(limit)))
    .map(({ kanji }) => kanji);
}
