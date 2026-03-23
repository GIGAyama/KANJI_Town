import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { getCachedKanjiCount } from '../../systems/kanjiVg';

/**
 * オフライン状態を画面上部に固定表示するバナー
 * キャッシュ状況に応じてメッセージを切り替える
 */
export default function OfflineBanner() {
  const [cachedCount, setCachedCount] = useState(null);

  useEffect(() => {
    getCachedKanjiCount().then(setCachedCount).catch(() => setCachedCount(0));
  }, []);

  const hasCachedData = cachedCount !== null && cachedCount > 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 px-4 text-sm font-bold"
      style={{
        background: '#fbbf24',
        color: '#292f36',
        borderBottom: '3px solid #292f36',
      }}
    >
      <WifiOff size={16} strokeWidth={3} />
      <span>
        {hasCachedData
          ? `オフラインモード — ダウンロードずみの ${cachedCount}もじ でべんきょうできるよ！`
          : 'オフラインモード — ネットにつないで もじデータを ダウンロードしてね'}
      </span>
    </div>
  );
}
