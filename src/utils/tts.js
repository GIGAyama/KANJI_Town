/**
 * お手本読み上げ（端末内蔵の音声合成）。
 *
 * プライバシー方針（外部送信は一切行わない）のため、localService な
 * 日本語音声だけを使う。リモート音声しかない端末では読み上げ機能を
 * 出さない（speakJa が false を返し、ボタンは非表示になる）。
 */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** 端末内蔵(localService)の日本語音声を選ぶ。なければ null。 */
export function pickLocalJaVoice(voices) {
  if (!Array.isArray(voices)) return null;
  const jaVoices = voices.filter(
    (v) => v && v.localService && typeof v.lang === 'string' && v.lang.toLowerCase().startsWith('ja'),
  );
  return jaVoices.find((v) => v.default) || jaVoices[0] || null;
}

/** 例文の「漢字（かな）」からふりがなを除いた読み上げ用テキストを作る。 */
export function toSpeechText(example) {
  return typeof example === 'string' ? example.replace(/（[^）]*）/g, '') : '';
}

/** 訓読みの送り仮名マーカー（ハイフン・括弧）を除いた読み上げ用テキストを作る。 */
export function toKunSpeech(kun) {
  return typeof kun === 'string' ? kun.replace(/[-()（）]/g, '') : '';
}

/** いま使える端末内蔵の日本語音声。ブラウザ以外・未対応環境では null。 */
export function getLocalJaVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  try {
    return pickLocalJaVoice(window.speechSynthesis.getVoices());
  } catch {
    return null;
  }
}

/**
 * 音声リストは非同期に届くことがある(getVoicesが最初は空)。
 * 変化を購読して再チェックできるようにする。戻り値は購読解除関数。
 */
export function onVoicesChanged(callback) {
  if (typeof window === 'undefined' || !window.speechSynthesis?.addEventListener) return () => {};
  window.speechSynthesis.addEventListener('voiceschanged', callback);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', callback);
}

/** 日本語テキストを端末内蔵音声で読み上げる。読み上げを開始できたら true。 */
export function speakJa(text, { volume = 1, rate = 0.9 } = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  const clean = (text || '').trim();
  if (!clean) return false;
  const voice = getLocalJaVoice();
  if (!voice) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = clamp(rate, 0.5, 1.5);
    utterance.volume = clamp(volume, 0, 1);
    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

/** 進行中の読み上げを止める（フェーズ移動・アンマウント時に呼ぶ）。 */
export function stopSpeaking() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // no-op
  }
}
