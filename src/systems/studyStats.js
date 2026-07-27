// study.v1 学習ログの読み出し側 — 児童本人が自分の記録を見るための集計・表示用。
// 仕様 §5.5 に従い読み出し専用とし、`study.records.v1` への書き込み・削除は行わない。
// 保存側（studyLog.js）とは分離して管理する。

export const STUDY_MODE_LABELS = {
  drill: 'れんしゅう',
  test: 'テスト',
  flashcard: 'フラッシュカード',
  survival: 'サバイバル',
  boss: 'ボスバトル',
};

/**
 * 自アプリの学習レコードを新しい順に返す。
 * パース失敗時は空配列を返し、アプリの表示を壊さない。
 */
export function loadStudyRecords(appId) {
  try {
    const raw = localStorage.getItem('study.records.v1');
    if (!raw) return [];
    const log = JSON.parse(raw);
    if (!Array.isArray(log)) return [];
    return log.filter((r) => r && r.schema === 'study.v1' && r.appId === appId).reverse();
  } catch (e) {
    return [];
  }
}

/**
 * 直近のとりくみを表示用に整形する。
 * 正答率は firstTryCorrect / attempted を用いる（§5.5。correct は採点方式により満点に張り付く）。
 * multiplayer: true のレコードは学力指標から除外する規定だが、漢字タウンは常に false。
 */
export function summarizeRecentStudy(records, limit = 5) {
  return (Array.isArray(records) ? records : [])
    .filter((r) => r && r.summary && !r.multiplayer)
    .slice(0, limit)
    .map((r) => {
      const attempted = Math.max(0, Number(r.summary.attempted ?? r.summary.count) || 0);
      const firstTryCorrect = Math.max(0, Number(r.summary.firstTryCorrect) || 0);
      const startedAt = new Date(r.startedAt);
      return {
        id: r.id,
        modeLabel: STUDY_MODE_LABELS[r.mode] || r.mode,
        unitTitle: r.unit?.title || '',
        startedAt: Number.isNaN(startedAt.getTime()) ? null : startedAt,
        attempted,
        firstTryCorrect,
        minutes: Math.max(1, Math.round((Number(r.elapsedMs) || 0) / 60000)),
        aborted: r.status === 'aborted',
      };
    });
}
