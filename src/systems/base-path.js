/* アプリが配信されている場所を、実際のURLから読み取る。
 *
 * 以前は `/KANJI_Town/` を各所に直書きしていた。独自ドメイン
 * （kanji-town.giga-school.com）へ移ったあとはアプリがドメイン直下に
 * 置かれるため、その直書きが全て存在しないパスを指し、
 * Service Worker の登録先も manifest の start_url も 404 になっていた。
 *
 * 配信先が変わっても書き換えが要らないよう、`document.baseURI` から
 * 「いま自分が置かれている場所」を求める。ドメイン直下なら "/"、
 * 将来サブパスへ戻したときは "/なにか/" が返る。
 */

/** アプリの基点パス（必ず "/" で終わる） */
export function getBasePath() {
  if (typeof document === 'undefined') return '/';
  try {
    return new URL('.', document.baseURI).pathname;
  } catch {
    return '/';
  }
}

/** 基点からの相対パスを絶対URLに解決する（例: 'sw.js' → 'https://.../sw.js'） */
export function resolveFromBase(path) {
  const origin = typeof location === 'undefined' ? 'http://localhost' : location.origin;
  return new URL(path, origin + getBasePath()).href;
}
