export const SESSION_CHECKPOINT_VERSION = 1;
export const SESSION_CHECKPOINT_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const NUMBER_FIELDS = [
  'earnedExp',
  'oldExp',
  'perfectCount',
  'easyCount',
  'reviewedCount',
  'attemptCount',
  'correctCount',
  'newKanjiCount',
  'masteredCount',
];

const BOOLEAN_FIELDS = ['isDrill', 'isTest', 'isWeakPractice'];

const asNonNegativeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

const asMultiplier = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(10, Math.max(0, number)) : 1;
};

function getQueueIds(queue) {
  if (!Array.isArray(queue)) return [];
  return queue
    .map((kanji) => kanji?.id)
    .filter((id) => typeof id === 'string' && id.length > 0);
}

/**
 * 学習セッションを小さなIDベースのチェックポイントへ変換する。
 * 漢字データ本体は保存せず、アプリ更新後も現在のマスターデータから復元する。
 */
export function createSessionCheckpoint(sessionData, now = Date.now()) {
  const queueIds = getQueueIds(sessionData?.queue);
  const remainingQueueIds = getQueueIds(
    Array.isArray(sessionData?.remainingQueue)
      ? sessionData.remainingQueue
      : sessionData?.queue,
  );

  if (queueIds.length === 0 || remainingQueueIds.length === 0) return null;

  const metrics = {};
  NUMBER_FIELDS.forEach((field) => {
    metrics[field] = asNonNegativeNumber(sessionData?.[field]);
  });
  BOOLEAN_FIELDS.forEach((field) => {
    metrics[field] = Boolean(sessionData?.[field]);
  });

  return {
    version: SESSION_CHECKPOINT_VERSION,
    savedAt: Number(now),
    queueIds,
    remainingQueueIds,
    metrics: {
      ...metrics,
      expMultiplier: asMultiplier(sessionData?.expMultiplier),
      unlockedItems: Array.isArray(sessionData?.unlockedItems)
        ? sessionData.unlockedItems.filter((id) => typeof id === 'string')
        : [],
      rareDrop: typeof sessionData?.rareDrop === 'string' ? sessionData.rareDrop : null,
      newVillager: sessionData?.newVillager && typeof sessionData.newVillager === 'object'
        ? sessionData.newVillager
        : null,
    },
  };
}

/**
 * 保存済みチェックポイントを検証し、現在の漢字データへ安全に再接続する。
 */
export function restoreSessionCheckpoint(checkpoint, kanjiData, now = Date.now()) {
  if (!checkpoint || checkpoint.version !== SESSION_CHECKPOINT_VERSION) return null;

  const savedAt = Number(checkpoint.savedAt);
  const age = Number(now) - savedAt;
  if (!Number.isFinite(savedAt) || age < -5 * 60 * 1000 || age > SESSION_CHECKPOINT_MAX_AGE_MS) {
    return null;
  }

  if (!Array.isArray(checkpoint.queueIds) || !Array.isArray(checkpoint.remainingQueueIds)) {
    return null;
  }

  const originalIds = new Set(checkpoint.queueIds);
  if (!checkpoint.remainingQueueIds.every((id) => originalIds.has(id))) return null;

  const byId = new Map((kanjiData || []).map((kanji) => [kanji.id, kanji]));
  const queue = checkpoint.queueIds.map((id) => byId.get(id));
  const remainingQueue = checkpoint.remainingQueueIds.map((id) => byId.get(id));

  if (queue.length === 0 || remainingQueue.length === 0 || queue.some((kanji) => !kanji) || remainingQueue.some((kanji) => !kanji)) {
    return null;
  }

  const savedMetrics = checkpoint.metrics || {};
  const metrics = {};
  NUMBER_FIELDS.forEach((field) => {
    metrics[field] = asNonNegativeNumber(savedMetrics[field]);
  });
  BOOLEAN_FIELDS.forEach((field) => {
    metrics[field] = Boolean(savedMetrics[field]);
  });

  return {
    queue,
    remainingQueue,
    ...metrics,
    expMultiplier: asMultiplier(savedMetrics.expMultiplier),
    unlockedItems: Array.isArray(savedMetrics.unlockedItems)
      ? savedMetrics.unlockedItems.filter((id) => typeof id === 'string')
      : [],
    rareDrop: typeof savedMetrics.rareDrop === 'string' ? savedMetrics.rareDrop : null,
    newVillager: savedMetrics.newVillager && typeof savedMetrics.newVillager === 'object'
      ? savedMetrics.newVillager
      : null,
  };
}
