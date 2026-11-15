import { useEffect, useRef } from 'react';
import { prefetchKanjiVgGrades } from '../systems/kanjiVg';

/**
 * オンライン時に、対象学年までの書き順データ（学年ファイル）をキャッシュに入れておく。
 *
 * 書き順データはアプリに同梱していて、ふだんは Service Worker のインストール時の
 * 先読みで全学年が入る（そのときはここで通信は起きない）。ここはその先読みが
 * 途中で切れた端末の補い。学年ファイルは最大6本なので、1字ずつ取っていた
 * 以前のような大量の通信は起きない。
 *
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

    const grades = [...new Set(kanjiData.filter(k => k.grade <= targetGrade).map(k => k.grade))]
      .sort((a, b) => a - b);

    // バックグラウンドで実行（UIをブロックしない）
    const timer = setTimeout(() => {
      prefetchKanjiVgGrades(grades);
    }, 3000); // アプリ起動後3秒待ってから開始

    return () => clearTimeout(timer);
  }, [isOnline, targetGrade, kanjiData]);
}
