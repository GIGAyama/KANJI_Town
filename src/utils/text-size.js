/**
 * 文字の大きさの設定（ふつう・大きめ・とても大きい）。
 *
 * Tailwind の text-* や余白は rem（html の文字の大きさが基準）なので、body ではなく
 * html に掛ける（App が --font-scale を html に置き、index.css が使う）。
 * 以前の提示モードは body に font-size を付けていたため、rem の文字は大きくならなかった。
 */
export const FONT_SCALES = { normal: 1, large: 1.15, xlarge: 1.3 };
export const DEFAULT_FONT_SCALE = 'normal';

export function getFontScaleId(settings) {
  const id = settings?.fontScale;
  return Object.hasOwn(FONT_SCALES, id) ? id : DEFAULT_FONT_SCALE;
}

export function getFontScale(settings) {
  return FONT_SCALES[getFontScaleId(settings)];
}
