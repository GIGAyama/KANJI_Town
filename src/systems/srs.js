// ==========================================
// SM-2+ 間隔反復アルゴリズム
// 学習フェーズ → 卒業 → レビューフェーズの3段階
// ==========================================
import { normalizeSkillMastery } from './mastery.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 学習ステップ間隔(ms): 1分 → 10分 */
export const LEARNING_STEPS = [1 * 60 * 1000, 10 * 60 * 1000];

/** 卒業間隔(ms): 1日 */
export const GRADUATING_INTERVAL = DAY_MS;

/** Easy評価時の初期間隔(ms): 4日 */
export const EASY_INTERVAL = 4 * DAY_MS;

/** 復習間隔の上限(ms): 1年。読みこみ時の補正（sanitizeNextReview）と合わせる */
export const MAX_INTERVAL = 365 * DAY_MS;

/** デフォルトの容易度 */
export const DEFAULT_EASE = 2.5;

/** 容易度の下限（これ以下にならない） */
export const MIN_EASE = 1.3;

/**
 * 容易度の上限。以前は上限が無く、ボスバトルで同じ字に easy が続くと
 * 3.25 まで上がり、数分で間隔が 630 日になっていた。
 */
export const MAX_EASE = 3.0;

/**
 * 1日以上の間隔の復習は、その日のこの時刻から出す（その日の朝3時）。
 * 以前は「卒業から24時間ちょうど」で、毎日同じ時間帯に学ぶ学級では、授業の後半に
 * 卒業した字の「翌日の復習」が翌々日にずれていた。
 */
export const DAY_START_HOUR = 3;

// 容易度の調整値
const EASE_BONUS = 0.15;
const EASE_HARD_PENALTY = 0.15;
const EASE_AGAIN_PENALTY = 0.2;
/** 卒業後の good で、下がった容易度を少しずつ戻す（DEFAULT_EASE まで） */
const EASE_GOOD_RECOVERY = 0.05;
const INTERVAL_MODIFIER = 1.0;

const clampEase = (ease) => Math.min(MAX_EASE, Math.max(MIN_EASE, ease));
const clampInterval = (interval) => Math.min(MAX_INTERVAL, Math.max(0, Math.round(interval)));

/**
 * 間隔から次の復習時刻を決める。1日以上の間隔は、その日の DAY_START_HOUR 時にそろえる
 * （端末の地方時で日付を数える）。1日未満の学習ステップはそのまま足す。
 * @param {number} now - Unix ms
 * @param {number} interval - ms
 * @returns {number} Unix ms
 */
export function dueAtLocalDay(now, interval) {
  if (!(interval >= DAY_MS)) return now + interval;
  const due = new Date(now + interval);
  due.setHours(DAY_START_HOUR, 0, 0, 0);
  return due.getTime();
}

/**
 * 卒業済みのカードを、復習期限の前に解いているか（期限前の早い復習）。
 * ボスバトル・サバイバル・1字の練習・特訓では、期限の来ていない字が何度も出る。
 * そのたびに間隔を掛け算で伸ばすと、数分で何百日も先になってしまう。
 */
export function isEarlyReview(card, now = Date.now()) {
  return Boolean(card?.graduated)
    && Number.isFinite(card?.nextReview)
    && now < card.nextReview;
}

/**
 * @typedef {'again'|'hard'|'good'|'easy'} Evaluation
 * ユーザーの自己評価
 * - again: 覚えていない → 最初からやり直し
 * - hard:  難しかった → 間隔を少し伸ばす
 * - good:  覚えていた → 通常の間隔伸長
 * - easy:  簡単だった → 大きく間隔を伸ばす
 */

/**
 * @typedef {object} CardState
 * @property {boolean} graduated - 学習フェーズを卒業したか
 * @property {number} stepIdx - 現在の学習ステップ
 * @property {number} interval - 次の復習までの間隔(ms)
 * @property {number} nextReview - 次の復習時刻(Unix ms)
 * @property {number} ease - 容易度(1.3-3.0)
 * @property {number} [lapses] - ラプス（卒業後に再度失敗した回数）
 * @property {string} [status] - 'new'|'learning'|'review'|'mastered'
 * @property {number} [mistakes] - 総ミス回数
 * @property {number} [practiceStreak] - 通常学習・特訓を通した連続正解数
 * @property {number} [practiceAttempts] - 練習した総回数
 * @property {number} [lastPracticedAt] - 最後に練習した時刻(Unix ms)
 */

/**
 * 次の復習スケジュールを計算する
 *
 * アルゴリズム概要:
 * - 学習フェーズ: LEARNING_STEPS に沿って段階的に間隔を伸ばす。容易度は変えない
 *   （つまずいた直後の失敗で容易度が恒久的に下がり、苦手のまま抜けられなくなっていた）
 * - 卒業: 全ステップをクリアすると翌日に復習（その日の朝3時から出る）
 * - レビューフェーズ: 間隔 × 容易度で次の復習日を決める
 * - 期限前の早い復習: again 以外では間隔も容易度も変えない
 *
 * @param {CardState} card - 現在のカード状態
 * @param {Evaluation} evaluation - ユーザーの自己評価
 * @param {number} [now] - いまの時刻(Unix ms)
 * @returns {Partial<CardState>} 更新されたカード状態の差分
 */
export const calculateNextReview = (card, evaluation, now = Date.now()) => {
  const ease = clampEase(card.ease || DEFAULT_EASE);
  const stepIdx = card.stepIdx ?? 0;

  // ── 学習フェーズ（未卒業カード） ──
  if (!card.graduated) {
    switch (evaluation) {
      case 'again':
        return {
          graduated: false,
          stepIdx: 0,
          interval: LEARNING_STEPS[0],
          nextReview: now + LEARNING_STEPS[0],
          ease,
        };

      case 'hard': {
        const delay = stepIdx < LEARNING_STEPS.length
          ? LEARNING_STEPS[stepIdx] * 1.5
          : LEARNING_STEPS[LEARNING_STEPS.length - 1];
        return {
          graduated: false,
          stepIdx,
          interval: delay,
          nextReview: now + delay,
          ease,
        };
      }

      case 'good': {
        const nextStep = stepIdx + 1;
        if (nextStep >= LEARNING_STEPS.length) {
          // 全ステップクリア → 卒業
          return {
            graduated: true,
            stepIdx: 0,
            interval: GRADUATING_INTERVAL,
            nextReview: dueAtLocalDay(now, GRADUATING_INTERVAL),
            ease,
          };
        }
        return {
          graduated: false,
          stepIdx: nextStep,
          interval: LEARNING_STEPS[nextStep],
          nextReview: now + LEARNING_STEPS[nextStep],
          ease,
        };
      }

      case 'easy':
        // 即卒業＋長い間隔
        return {
          graduated: true,
          stepIdx: 0,
          interval: EASY_INTERVAL,
          nextReview: dueAtLocalDay(now, EASY_INTERVAL),
          ease,
        };

      default:
        break;
    }
  }

  // ── レビューフェーズ（卒業済みカード） ──
  const currentInterval = card.interval || GRADUATING_INTERVAL;

  if (evaluation === 'again') {
    // ラプス: 学習フェーズに戻す（期限前でも、忘れていたことは記録する）
    return {
      graduated: false,
      stepIdx: 0,
      interval: LEARNING_STEPS[0],
      nextReview: now + LEARNING_STEPS[0],
      ease: clampEase(ease - EASE_AGAIN_PENALTY),
      lapses: (card.lapses || 0) + 1,
    };
  }

  // 期限前の早い復習では、間隔も容易度も変えない
  if (isEarlyReview(card, now)) {
    return {
      graduated: true,
      stepIdx: 0,
      interval: currentInterval,
      nextReview: card.nextReview,
      ease,
    };
  }

  switch (evaluation) {
    case 'hard': {
      const newInterval = clampInterval(currentInterval * 1.2 * INTERVAL_MODIFIER);
      return {
        graduated: true,
        stepIdx: 0,
        interval: newInterval,
        nextReview: dueAtLocalDay(now, newInterval),
        ease: clampEase(ease - EASE_HARD_PENALTY),
      };
    }

    case 'good': {
      const newInterval = clampInterval(currentInterval * ease * INTERVAL_MODIFIER);
      return {
        graduated: true,
        stepIdx: 0,
        interval: newInterval,
        nextReview: dueAtLocalDay(now, newInterval),
        ease: ease < DEFAULT_EASE ? Math.min(DEFAULT_EASE, ease + EASE_GOOD_RECOVERY) : ease,
      };
    }

    case 'easy': {
      const newInterval = clampInterval(currentInterval * ease * INTERVAL_MODIFIER * 1.3);
      return {
        graduated: true,
        stepIdx: 0,
        interval: newInterval,
        nextReview: dueAtLocalDay(now, newInterval),
        ease: clampEase(ease + EASE_BONUS),
      };
    }

    default:
      return {
        graduated: true,
        stepIdx: 0,
        interval: currentInterval,
        nextReview: dueAtLocalDay(now, currentInterval),
        ease,
      };
  }
};

/** nextReview の妥当範囲（クライアント時刻ズレ対策） */
const MAX_FUTURE_MS = MAX_INTERVAL + DAY_MS; // 1年（朝3時にそろえた分の余裕を含む）
const MAX_PAST_MS = 365 * 24 * 60 * 60 * 1000; // 1年前まで許容

/**
 * nextReview が時刻ズレで異常値になっていないか確認し、必要なら補正する
 * @param {object} card
 * @returns {object} 補正後のカード
 */
function sanitizeNextReview(card) {
  const now = Date.now();
  const nr = card.nextReview;
  if (typeof nr !== 'number' || !isFinite(nr)) {
    return { ...card, nextReview: now };
  }
  // 未来に1年以上はあり得ない → 適切な間隔で再計算
  if (nr - now > MAX_FUTURE_MS) {
    const interval = Math.min(card.interval || GRADUATING_INTERVAL, MAX_INTERVAL);
    return { ...card, interval, nextReview: now + interval };
  }
  // 過去に1年以上は古すぎる → いますぐ復習対象に
  if (now - nr > MAX_PAST_MS) {
    return { ...card, nextReview: now };
  }
  return card;
}

/**
 * 通常学習と特訓で共通の練習進捗を記録する。
 * 「もう一度」で連続正解をリセットし、それ以外は1つ進める。
 */
export function recordPracticeAttempt(card, evaluation, now = Date.now()) {
  return {
    practiceStreak: evaluation === 'again' ? 0 : (card?.practiceStreak || 0) + 1,
    practiceAttempts: (card?.practiceAttempts || 0) + 1,
    lastPracticedAt: now,
  };
}

/**
 * お手本が読めずに採点できず、自己申告だけで評価した回数を数える。
 * 先生が「採点した結果」と「本人の申告」を記録で見分けられるようにする。
 */
export function recordSelfReport(card, selfReport, now = Date.now()) {
  if (!selfReport) return {};
  return { selfReports: (card?.selfReports || 0) + 1, lastSelfReportAt: now };
}

/**
 * 古いカードデータを現在のスキーマに移行する
 * @param {object|null} card
 * @returns {CardState}
 */
export const migrateCard = (card) => {
  if (!card) {
    const migrated = {
      graduated: false,
      stepIdx: 0,
      interval: LEARNING_STEPS[0],
      nextReview: 0,
      ease: DEFAULT_EASE,
      status: 'new',
      mistakes: 0,
      lapses: 0,
      practiceStreak: 0,
      practiceAttempts: 0,
      lastPracticedAt: 0,
    };
    return { ...migrated, skillMastery: normalizeSkillMastery(null, migrated) };
  }
  // easeフィールドがあれば移行済み
  if (card.ease !== undefined) {
    const migrated = sanitizeNextReview({
      practiceStreak: 0,
      practiceAttempts: 0,
      lastPracticedAt: 0,
      ...card,
    });
    return { ...migrated, skillMastery: normalizeSkillMastery(card.skillMastery, migrated) };
  }
  const migrated = sanitizeNextReview({
    ...card,
    ease: DEFAULT_EASE,
    graduated: (card.interval || 0) >= GRADUATING_INTERVAL,
    stepIdx: 0,
    lapses: 0,
    practiceStreak: 0,
    practiceAttempts: 0,
    lastPracticedAt: 0,
  });
  return { ...migrated, skillMastery: normalizeSkillMastery(card.skillMastery, migrated) };
};
