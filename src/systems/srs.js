// SM-2+ 間隔反復アルゴリズム
export const LEARNING_STEPS = [1 * 60 * 1000, 10 * 60 * 1000]; // 1分, 10分
export const GRADUATING_INTERVAL = 24 * 60 * 60 * 1000; // 1日
export const EASY_INTERVAL = 4 * 24 * 60 * 60 * 1000;   // 4日
export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;
const EASE_BONUS = 0.15;
const EASE_HARD_PENALTY = 0.15;
const EASE_AGAIN_PENALTY = 0.2;
const INTERVAL_MODIFIER = 1.0;

export const calculateNextReview = (card, evaluation) => {
  const now = Date.now();
  const ease = card.ease || DEFAULT_EASE;
  const stepIdx = card.stepIdx ?? 0;

  // 新規カード（learningフェーズ）
  if (!card.graduated) {
    if (evaluation === 'again') {
      return { graduated: false, stepIdx: 0, interval: LEARNING_STEPS[0], nextReview: now + LEARNING_STEPS[0], ease: Math.max(MIN_EASE, ease - EASE_AGAIN_PENALTY) };
    }
    if (evaluation === 'hard') {
      const delay = stepIdx < LEARNING_STEPS.length ? LEARNING_STEPS[stepIdx] * 1.5 : LEARNING_STEPS[LEARNING_STEPS.length - 1];
      return { graduated: false, stepIdx, interval: delay, nextReview: now + delay, ease: Math.max(MIN_EASE, ease - EASE_HARD_PENALTY) };
    }
    if (evaluation === 'good') {
      const nextStep = stepIdx + 1;
      if (nextStep >= LEARNING_STEPS.length) {
        return { graduated: true, stepIdx: 0, interval: GRADUATING_INTERVAL, nextReview: now + GRADUATING_INTERVAL, ease };
      }
      return { graduated: false, stepIdx: nextStep, interval: LEARNING_STEPS[nextStep], nextReview: now + LEARNING_STEPS[nextStep], ease };
    }
    if (evaluation === 'easy') {
      return { graduated: true, stepIdx: 0, interval: EASY_INTERVAL, nextReview: now + EASY_INTERVAL, ease: ease + EASE_BONUS };
    }
  }

  // レビューフェーズ
  const currentInterval = card.interval || GRADUATING_INTERVAL;
  if (evaluation === 'again') {
    return { graduated: false, stepIdx: 0, interval: LEARNING_STEPS[0], nextReview: now + LEARNING_STEPS[0], ease: Math.max(MIN_EASE, ease - EASE_AGAIN_PENALTY), lapses: (card.lapses || 0) + 1 };
  }
  if (evaluation === 'hard') {
    const newInterval = Math.round(currentInterval * 1.2 * INTERVAL_MODIFIER);
    return { graduated: true, stepIdx: 0, interval: newInterval, nextReview: now + newInterval, ease: Math.max(MIN_EASE, ease - EASE_HARD_PENALTY) };
  }
  if (evaluation === 'good') {
    const newInterval = Math.round(currentInterval * ease * INTERVAL_MODIFIER);
    return { graduated: true, stepIdx: 0, interval: newInterval, nextReview: now + newInterval, ease };
  }
  if (evaluation === 'easy') {
    const newInterval = Math.round(currentInterval * ease * INTERVAL_MODIFIER * 1.3);
    return { graduated: true, stepIdx: 0, interval: newInterval, nextReview: now + newInterval, ease: ease + EASE_BONUS };
  }
  return { graduated: true, stepIdx: 0, interval: currentInterval, nextReview: now + currentInterval, ease };
};

export const migrateCard = (card) => {
  if (!card) return { graduated: false, stepIdx: 0, interval: LEARNING_STEPS[0], nextReview: 0, ease: DEFAULT_EASE, status: 'new', mistakes: 0, lapses: 0 };
  if (card.ease !== undefined) return card;
  return {
    ...card,
    ease: DEFAULT_EASE,
    graduated: (card.interval || 0) >= GRADUATING_INTERVAL,
    stepIdx: 0,
    lapses: 0,
  };
};
