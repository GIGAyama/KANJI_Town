export const REST_PASS_RECHARGE_DAYS = 5;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HABIT_EVENT_TYPES = new Set(['rest_protected', 'rest_pass_recharged']);

function parseDateKey(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) return null;
  return timestamp;
}

export function getDayDifference(fromDate, toDate) {
  const from = parseDateKey(fromDate);
  const to = parseDateKey(toDate);
  if (from === null || to === null) return null;
  return Math.round((to - from) / 86_400_000);
}

function getPreviousDate(dateKey) {
  const timestamp = parseDateKey(dateKey);
  if (timestamp === null) return '';
  return new Date(timestamp - 86_400_000).toISOString().slice(0, 10);
}

export function normalizeHabitState(stats = {}) {
  const available = stats.restPassAvailable !== false;
  const rawProgress = Math.max(0, Math.floor(Number(stats.restPassRechargeProgress) || 0));
  const rawEvent = stats.lastHabitEvent;
  const lastHabitEvent = rawEvent
    && typeof rawEvent === 'object'
    && HABIT_EVENT_TYPES.has(rawEvent.type)
    && parseDateKey(rawEvent.date) !== null
    ? {
      type: rawEvent.type,
      date: rawEvent.date,
      ...(rawEvent.type === 'rest_protected' && parseDateKey(rawEvent.restDate) !== null
        ? { restDate: rawEvent.restDate }
        : {}),
    }
    : null;
  return {
    restPassAvailable: available,
    restPassRechargeProgress: available ? 0 : Math.min(rawProgress, REST_PASS_RECHARGE_DAYS - 1),
    lastRestPassDate: typeof stats.lastRestPassDate === 'string' ? stats.lastRestPassDate : '',
    lastHabitEvent,
  };
}

/** 直前の学習から1日だけ空いており、パスで休息日を守れるかを返す。 */
export function canProtectRestDay(stats, today) {
  const habit = normalizeHabitState(stats);
  return habit.restPassAvailable && getDayDifference(stats?.lastDate, today) === 2;
}

export function getHabitStatus(stats, today) {
  const habit = normalizeHabitState(stats);
  const event = habit.lastHabitEvent?.date === today ? habit.lastHabitEvent : null;
  return {
    ...habit,
    rechargeRemaining: habit.restPassAvailable
      ? 0
      : REST_PASS_RECHARGE_DAYS - habit.restPassRechargeProgress,
    canProtectToday: canProtectRestDay(stats, today),
    event,
  };
}

/**
 * 新しい学習日をストリークへ反映する。
 * 1日だけ休んだ場合はパスを自動使用し、学習5日で再獲得する。
 */
export function applyLearningDayHabit(stats, today) {
  const habit = normalizeHabitState(stats);
  const difference = getDayDifference(stats?.lastDate, today);

  if (difference === 0) return { ...habit, streak: Math.max(0, Number(stats?.streak) || 0), lastDate: today };

  const currentStreak = Math.max(0, Number(stats?.streak) || 0);
  const isConsecutive = difference === 1;
  const usesRestPass = difference === 2 && habit.restPassAvailable;
  let streak = isConsecutive || usesRestPass ? Math.max(1, currentStreak + 1) : 1;
  let restPassAvailable = habit.restPassAvailable;
  let restPassRechargeProgress = habit.restPassRechargeProgress;
  let lastRestPassDate = habit.lastRestPassDate;
  let lastHabitEvent = habit.lastHabitEvent;

  if (usesRestPass) {
    restPassAvailable = false;
    restPassRechargeProgress = 1;
    lastRestPassDate = getPreviousDate(today);
    lastHabitEvent = { type: 'rest_protected', date: today, restDate: lastRestPassDate };
  } else if (!restPassAvailable) {
    restPassRechargeProgress += 1;
    if (restPassRechargeProgress >= REST_PASS_RECHARGE_DAYS) {
      restPassAvailable = true;
      restPassRechargeProgress = 0;
      lastHabitEvent = { type: 'rest_pass_recharged', date: today };
    }
  }

  return {
    restPassAvailable,
    restPassRechargeProgress,
    lastRestPassDate,
    lastHabitEvent,
    streak,
    lastDate: today,
  };
}
