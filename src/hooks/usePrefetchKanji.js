import { useEffect, useRef } from 'react';
import { prefetchKanjiVg } from '../systems/kanjiVg';

/**
 * オンライン時に対象学年の漢字データをバックグラウンドで事前キャッシュする
 * @param {boolean} isOnline - オンライン状態
 * @param {number} targetGrade - 対象学年
 * @param {Array<{char: string, grade: number}>} kanjiData - 全漢字データ
 */
export function usePrefetchKanji(isOnline, targetGrade, kanjiData) {
  const hasPrefetched = useRef(new Set());

  useEffect(() => {
    if (!isOnline || !targetGrade || !kanjiData?.length) return;
    if (hasPrefetched.current.has(targetGrade)) return;
    hasPrefetched.current.add(targetGrade);

    // 対象学年の漢字をフィルタ
    const gradeKanji = kanjiData.filter(k => k.grade <= targetGrade);

    // バックグラウンドで実行（UIをブロックしない）
    const timer = setTimeout(() => {
      prefetchKanjiVg(gradeKanji).catch(() => {
        // 失敗時は次回オンライン時にリトライできるようフラグを解除
        hasPrefetched.current.delete(targetGrade);
      });
    }, 3000); // アプリ起動後3秒待ってから開始

    return () => clearTimeout(timer);
  }, [isOnline, targetGrade, kanjiData]);
}
