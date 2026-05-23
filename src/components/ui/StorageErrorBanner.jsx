import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { StorageAPI } from '../../systems/storage';

/**
 * localStorage 保存失敗を画面上部に通知するバナー。
 * 容量不足の段階に応じてメッセージを切り替える。
 */
const REASON_TEXT = {
  'compressed-30d': 'データ容量を整理したよ（30日より古い記録を圧縮）。プレイは続けられるよ！',
  'compressed-7d': 'データ容量がきびしいよ。古い記録を整理したよ（直近7日のみ残ります）。',
  'minimal': 'データ容量がいっぱいだよ！日次の記録を消したよ。続けるならブラウザを再起動してね。',
  'quota': 'データを保存できなかったよ！ブラウザのストレージ容量がいっぱいです。',
  'unknown': 'データの保存に失敗したよ。もういちど ためしてね。',
};

export default function StorageErrorBanner() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const unsubscribe = StorageAPI.onSaveError(({ reason }) => {
      setInfo({ reason, time: Date.now() });
      // 軽度（compressed-30d）の場合は5秒で自動消去
      if (reason === 'compressed-30d') {
        setTimeout(() => setInfo(prev => (prev && prev.reason === 'compressed-30d') ? null : prev), 5000);
      }
    });
    return unsubscribe;
  }, []);

  if (!info) return null;

  const isSevere = info.reason === 'quota' || info.reason === 'minimal' || info.reason === 'unknown';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between gap-2 py-2 px-3 text-xs sm:text-sm font-bold"
      style={{
        background: isSevere ? '#ef4444' : '#fbbf24',
        color: isSevere ? '#ffffff' : '#292f36',
        borderBottom: '3px solid #292f36',
      }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <AlertTriangle size={16} strokeWidth={3} className="shrink-0" />
        <span className="truncate sm:whitespace-normal">{REASON_TEXT[info.reason] || REASON_TEXT.unknown}</span>
      </div>
      <button
        onClick={() => setInfo(null)}
        aria-label="閉じる"
        className="shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
      >
        <X size={16} strokeWidth={3} />
      </button>
    </div>
  );
}
