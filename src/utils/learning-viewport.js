const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * 学習画面のレイアウトと正方形キャンバスの論理サイズを算出する。
 * 幅だけでなく高さと縦横比も考慮し、タブレット縦持ちでサイドバーが
 * 学習領域を圧迫しないようにする。
 */
export function calculateLearningViewport(width, height) {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 1024;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 768;
  const isPortrait = safeHeight >= safeWidth;
  const isStacked = safeWidth < 768 || (isPortrait && safeWidth < 960);

  if (isStacked) {
    const availableWidth = safeWidth - 32;
    const availableHeight = safeHeight * (safeHeight < 620 ? 0.42 : 0.5);
    return {
      isStacked,
      canvasSize: Math.round(clamp(Math.min(availableWidth, availableHeight), 220, 520)),
    };
  }

  const sidebarWidth = safeWidth >= 1200 ? 360 : 300;
  const availableWidth = safeWidth - sidebarWidth - 96;
  const availableHeight = safeHeight - (safeHeight < 620 ? 112 : 148);

  return {
    isStacked,
    canvasSize: Math.round(clamp(Math.min(availableWidth, availableHeight), 240, 560)),
  };
}
