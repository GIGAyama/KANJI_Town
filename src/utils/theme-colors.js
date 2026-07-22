// Canvas 2D API は "var(--text)" のようなCSS変数を色として解釈できず、
// 無効な色指定は無視されて直前の色（既定は黒）のまま描画される。
// キャンバスに描く前に必ずここで実際の色文字列へ解決する。
const THEME_COLOR_FALLBACKS = {
  '--bg': '#fdfbf7',
  '--primary': '#ef4444',
  '--secondary': '#10b981',
  '--accent': '#fbbf24',
  '--text': '#292f36',
  '--panel': '#ffffff',
};

/**
 * CSS変数名（例: '--text'）をキャンバスで使える具体的な色文字列に解決する
 * @param {string} variableName - CSS変数名
 * @returns {string} 色文字列
 */
export function resolveThemeColor(variableName) {
  const fallback = THEME_COLOR_FALLBACKS[variableName] || '#292f36';
  if (typeof document === 'undefined') return fallback;
  try {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
    return value || fallback;
  } catch {
    return fallback;
  }
}
