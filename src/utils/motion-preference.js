export const MOTION_PREFERENCES = ['system', 'full', 'reduced'];
export const DEFAULT_MOTION_PREFERENCE = 'system';

export function getMotionPreference(settings) {
  const preference = settings?.motionPreference;
  return MOTION_PREFERENCES.includes(preference)
    ? preference
    : DEFAULT_MOTION_PREFERENCE;
}

/** 端末設定とアプリ内の上書き設定から、動きを減らすか決定する。 */
export function shouldReduceMotion(preference, systemPrefersReducedMotion = false) {
  if (preference === 'reduced') return true;
  if (preference === 'full') return false;
  return Boolean(systemPrefersReducedMotion);
}
