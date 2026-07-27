import { KANJI_DATA } from '../data/kanji-data.js';
import {
  buildWeakKanjiPlan,
  getReviewForecast,
  getWeeklyLearningSummary,
} from './learning-plan.js';
import { getSkillMasterySummary, MASTERY_SKILLS } from './mastery.js';

export const LEARNING_REPORT_VERSION = 1;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const asCount = (value) => Math.max(0, Math.floor(Number(value) || 0));

/**
 * 学習支援に必要な最小限の要約。study.v1 学習ログの ext（拡張層）の生成元として使う。
 * まち、メール、設定、ドリルの中身は含めない。
 * 設問ごとの記録は study.v1 の items（設問層）が担う（仕様 §8.4 の方針変更）。
 */
export function buildLearningReport(stats = {}, now = new Date()) {
  const parsedNow = new Date(now);
  const safeNow = Number.isNaN(parsedNow.getTime()) ? new Date() : parsedNow;
  const kanjiStats = stats.kanjiStats || {};
  const learnedCards = Object.values(kanjiStats).filter((card) => card && card.status !== 'new');
  const weekly = getWeeklyLearningSummary(stats, safeNow);
  const mastery = getSkillMasterySummary(kanjiStats);
  const review = getReviewForecast(kanjiStats, safeNow);
  const weak = buildWeakKanjiPlan({
    kanjiData: KANJI_DATA,
    kanjiStats,
    limit: 5,
    now: safeNow.getTime(),
  });

  return {
    version: LEARNING_REPORT_VERSION,
    generatedAt: safeNow.toISOString(),
    grade: Math.min(6, Math.max(1, Math.floor(Number(stats.targetGrade) || 1))),
    progress: {
      learned: learnedCards.length,
      mastered: learnedCards.filter((card) => card.status === 'mastered').length,
      totalExp: asCount(stats.totalExp),
      sessions: asCount(stats.sessionCount),
    },
    habit: {
      streak: asCount(stats.streak),
      lastLearningDate: DATE_KEY_PATTERN.test(stats.lastDate || '') ? stats.lastDate : null,
      studiedDays: weekly.studiedDays,
      goalDays: weekly.goalDays,
      weeklyGoal: weekly.goal,
      reviewed: weekly.reviewed,
      accuracy: weekly.accuracy,
    },
    mastery: Object.fromEntries(MASTERY_SKILLS.map((skill) => [skill, mastery.scores[skill]])),
    support: {
      overdueReviews: review.overdueCount,
      weekReviews: review.weekCount,
      weakKanjiIds: weak.queue.map((kanji) => kanji.id),
    },
  };
}
