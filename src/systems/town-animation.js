export const TOWN_ANIMATION_INTERVAL_MS = 50;
export const TOWN_ANIMATION_MAX_DELTA_SECONDS = 0.1;

/**
 * 時計で次の刻みを予約する（requestAnimationFrame は使わない）。
 * rAF を毎フレーム予約していると、何も描き変えなくてもブラウザが毎フレーム
 * 画面の更新を走らせ、そのたびに町マップ全体の合成をやり直していた（重い町では
 * 1 回 10〜20ms）。住民の移動は CSS の transition に任せているので、ここは
 * 行動を決める刻みだけがあればよい。
 */
const now = () => (globalThis.performance?.now ? globalThis.performance.now() : Date.now());
const requestTimerFrame = (callback, delayMs) => globalThis.setTimeout(() => callback(now()), delayMs);
const cancelTimerFrame = (frameId) => globalThis.clearTimeout(frameId);

/**
 * 複数の住民が1本の刻みを共有するスケジューラー。
 * 20fpsへ間引き、非表示タブや購読者がいない間は完全に停止する。
 */
export function createTownAnimationScheduler({
  requestFrame = (callback) => requestTimerFrame(callback, TOWN_ANIMATION_INTERVAL_MS),
  cancelFrame = cancelTimerFrame,
  intervalMs = TOWN_ANIMATION_INTERVAL_MS,
  maxDeltaSeconds = TOWN_ANIMATION_MAX_DELTA_SECONDS,
} = {}) {
  const subscribers = new Set();
  let frameId = null;
  let lastTickAt = null;
  let paused = false;

  const schedule = () => {
    if (paused || frameId !== null || subscribers.size === 0) return;
    frameId = requestFrame(tick);
  };

  const tick = (now) => {
    frameId = null;
    if (paused || subscribers.size === 0) return;

    if (lastTickAt === null) lastTickAt = now;
    const elapsed = now - lastTickAt;
    if (elapsed >= intervalMs) {
      const deltaSeconds = Math.min(elapsed / 1000, maxDeltaSeconds);
      lastTickAt = now;
      [...subscribers].forEach((subscriber) => {
        try {
          subscriber(now, deltaSeconds);
        } catch (error) {
          if (import.meta.env?.DEV) console.warn('[TownAnimation] subscriber failed:', error);
        }
      });
    }

    schedule();
  };

  const subscribe = (subscriber) => {
    subscribers.add(subscriber);
    schedule();

    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        if (frameId !== null) cancelFrame(frameId);
        frameId = null;
        lastTickAt = null;
      }
    };
  };

  const pause = () => {
    paused = true;
    if (frameId !== null) cancelFrame(frameId);
    frameId = null;
    lastTickAt = null;
  };

  const resume = () => {
    if (!paused) return;
    paused = false;
    schedule();
  };

  return {
    subscribe,
    pause,
    resume,
    getSubscriberCount: () => subscribers.size,
  };
}

/** 画面外の住民を、移動余白を含めて描画対象から外す。 */
export function isVillagerInViewRange(villager, viewRange, margin = 6) {
  if (!villager || !viewRange) return false;
  return villager.x >= viewRange.startX - margin
    && villager.x <= viewRange.endX + margin
    && villager.y >= viewRange.startY - margin
    && villager.y <= viewRange.endY + margin;
}

export const townAnimationScheduler = createTownAnimationScheduler();

if (typeof document !== 'undefined') {
  const syncVisibility = () => {
    if (document.hidden) townAnimationScheduler.pause();
    else townAnimationScheduler.resume();
  };
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();
}

export const subscribeTownAnimation = (subscriber) => townAnimationScheduler.subscribe(subscriber);
