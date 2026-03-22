// ==========================================
// SM-2+ 間隔反復アルゴリズム
// 学習フェーズ → 卒業 → レビューフェーズの3段階
// ==========================================

/** 学習ステップ間隔(ms): 1分 → 10分 */
export const LEARNING_STEPS = [1 * 60 * 1000, 10 * 60 * 1000];

/** 卒業間隔(ms): 1日 */
export const GRADUATING_INTERVAL = 24 * 60 * 60 * 1000;

/** Easy評価時の初期間隔(ms): 4日 */
export const EASY_INTERVAL = 4 * 24 * 60 * 60 * 1000;

/** デフォルトの容易度 */
export const DEFAULT_EASE = 2.5;

/** 容易度の下限（これ以下にならない） */
export const MIN_EASE = 1.3;

// 容易度の調整値
const EASE_BONUS = 0.15;
const EASE_HARD_PENALTY = 0.15;
const EASE_AGAIN_PENALTY = 0.2;
const INTERVAL_MODIFIER = 1.0;

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
 * @property {number} ease - 容易度(1.3-3.0+)
 * @property {number} [lapses] - ラプス（卒業後に再度失敗した回数）
 * @property {string} [status] - 'new'|'learning'|'review'|'mastered'
 * @property {number} [mistakes] - 総ミス回数
 */

/**
 * 次の復習スケジュールを計算する
 *
 * アルゴリズム概要:
 * - 学習フェーズ: LEARNING_STEPS に沿って段階的に間隔を伸ばす
 * - 卒業: 全ステップをクリアすると24時間後に復習
 * - レビューフェーズ: 間隔 × 容易度で次の復習日を決定
 *
 * @param {CardState} card - 現在のカード状態
 * @param {Evaluation} evaluation - ユーザーの自己評価
 * @returns {Partial<CardState>} 更新されたカード状態の差分
 */
export const calculateNextReview = (card, evaluation) => {
  const now = Date.now();
  const ease = card.ease || DEFAULT_EASE;
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
          ease: Math.max(MIN_EASE, ease - EASE_AGAIN_PENALTY),
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
          ease: Math.max(MIN_EASE, ease - EASE_HARD_PENALTY),
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
            nextReview: now + GRADUATING_INTERVAL,
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
          nextReview: now + EASY_INTERVAL,
          ease: ease + EASE_BONUS,
        };

      default:
        break;
    }
  }

  // ── レビューフェーズ（卒業済みカード） ──
  const currentInterval = card.interval || GRADUATING_INTERVAL;

  switch (evaluation) {
    case 'again':
      // ラプス: 学習フェーズに戻す
      return {
        graduated: false,
        stepIdx: 0,
        interval: LEARNING_STEPS[0],
        nextReview: now + LEARNING_STEPS[0],
        ease: Math.max(MIN_EASE, ease - EASE_AGAIN_PENALTY),
        lapses: (card.lapses || 0) + 1,
      };

    case 'hard': {
      const newInterval = Math.round(currentInterval * 1.2 * INTERVAL_MODIFIER);
      return {
        graduated: true,
        stepIdx: 0,
        interval: newInterval,
        nextReview: now + newInterval,
        ease: Math.max(MIN_EASE, ease - EASE_HARD_PENALTY),
      };
    }

    case 'good': {
      const newInterval = Math.round(currentInterval * ease * INTERVAL_MODIFIER);
      return {
        graduated: true,
        stepIdx: 0,
        interval: newInterval,
        nextReview: now + newInterval,
        ease,
      };
    }

    case 'easy': {
      const newInterval = Math.round(currentInterval * ease * INTERVAL_MODIFIER * 1.3);
      return {
        graduated: true,
        stepIdx: 0,
        interval: newInterval,
        nextReview: now + newInterval,
        ease: ease + EASE_BONUS,
      };
    }

    default:
      return {
        graduated: true,
        stepIdx: 0,
        interval: currentInterval,
        nextReview: now + currentInterval,
        ease,
      };
  }
};

/**
 * 古いカードデータを現在のスキーマに移行する
 * @param {object|null} card
 * @returns {CardState}
 */
export const migrateCard = (card) => {
  if (!card) {
    return {
      graduated: false,
      stepIdx: 0,
      interval: LEARNING_STEPS[0],
      nextReview: 0,
      ease: DEFAULT_EASE,
      status: 'new',
      mistakes: 0,
      lapses: 0,
    };
  }
  // easeフィールドがあれば移行済み
  if (card.ease !== undefined) return card;
  return {
    ...card,
    ease: DEFAULT_EASE,
    graduated: (card.interval || 0) >= GRADUATING_INTERVAL,
    stepIdx: 0,
    lapses: 0,
  };
};
