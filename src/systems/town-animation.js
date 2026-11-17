/** 刻みの間隔（30 回/秒）。住民は canvas に描くので、町の要素は さわらない（VillagerCanvas.jsx） */
export const TOWN_ANIMATION_INTERVAL_MS = 33;
export const TOWN_ANIMATION_MAX_DELTA_SECONDS = 0.1;

/**
 * 時計で次の刻みを予約する（requestAnimationFrame は使わない）。
 * rAF を毎フレーム予約していると、何も描き変えなくてもブラウザが毎フレーム
 * 画面の更新を走らせ、そのたびに町マップ全体の合成をやり直していた（重い町では
 * 1 回 10〜20ms）。住民は この刻みで ふるまいを進め、canvas に描きなおす
 * （components/town/VillagerCanvas.jsx）。
 */
const now = () => (globalThis.performance?.now ? globalThis.performance.now() : Date.now());
const requestTimerFrame = (callback, delayMs) => globalThis.setTimeout(() => callback(now()), delayMs);
const cancelTimerFrame = (frameId) => globalThis.clearTimeout(frameId);

/**
 * 複数の住民が1本の刻みを共有するスケジューラー。
 * 30fpsへ間引き、非表示タブや購読者がいない間は完全に停止する。
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
