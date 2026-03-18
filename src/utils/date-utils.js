/**
 * システム全体で共通の「今日」の日付文字列を取得する
 * ローカル時刻に基づき YYYY-MM-DD 形式を返す
 * @returns {string} 例: "2026-03-19"
 */
export function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 日付オブジェクトを YYYY-MM-DD 形式の文字列に変換する
 * @param {Date} date 
 * @returns {string}
 */
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
