/**
 * 音読チャレンジ・お手本自動再生の設定解決。
 * 設定は保存時ではなく読み取り時にデフォルトを補完する（既存の慣例に合わせる）。
 */

/** 音読チャレンジ（マイクによる発声チェック）を表示するか。デフォルトON。 */
export function isReadingCheckEnabled(settings) {
  return settings?.readingCheck !== false;
}

/** 音読フェーズ表示時にお手本音声を自動再生するか。デフォルトON。 */
export function isAutoPlayEnabled(settings) {
  return settings?.autoPlay !== false;
}
