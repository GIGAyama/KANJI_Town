import { useCallback, useEffect, useRef } from 'react';
import { StorageAPI } from '../../systems/storage';
import { addShareLog } from '../../systems/share-log';

/**
 * 配ったものを 控え（stats.shareLog）に残す関数を返す。
 * @param {Function} [setStats] App の setStats。渡されなければ 何もしない
 * @returns {(entry: { kind: 'drill'|'range', param: string, via?: 'link'|'number' }) => void}
 */
export function useShareRecorder(setStats) {
  return useCallback((entry) => {
    if (!setStats || !entry?.param) return;
    setStats((prev) => {
      const next = { ...prev, shareLog: addShareLog(prev.shareLog, entry) };
      StorageAPI.saveStats(next);
      return next;
    });
  }, [setStats]);
}

/**
 * 「リンクで配る」「ならった範囲を配る」の画面で、配ったものを 控えに残す。
 *
 * 残すとき:
 *   ・URL をコピーした・Classroom の共有を開いた（返す関数を呼ぶ）→ すぐ
 *   ・リンクを出したまま その画面を はなれた → はなれるとき（QR を映して配ったときも 残るように）
 * 宿題の決まりを えらんでいる途中の リンクは残さない（はなれるときの、さいごの中身だけ）。
 *
 * @param {Function} [setStats]
 * @param {'drill'|'range'} kind
 * @param {string|null} param いま出しているリンクの中身（出していなければ null）
 * @returns {() => void} 「いま配った」と知らせる関数
 */
export function useShareLogging(setStats, kind, param) {
  const record = useShareRecorder(setStats);
  const lastRef = useRef(null); // さいごに出していた リンクの中身
  if (param) lastRef.current = param;
  const recordedRef = useRef(null); // もう控えに入れた中身
  const shownRef = useRef(false); // いま リンクを出しているか
  const active = Boolean(param);

  useEffect(() => {
    if (!active) return undefined;
    shownRef.current = true;
    return () => {
      shownRef.current = false;
      // 開発時の StrictMode は、開いた直後に「はなれて もどる」を 1 回 ためす。
      // すぐには残さず、ほんとうに はなれていたとき（もどっていないとき）だけ残す
      setTimeout(() => {
        const last = lastRef.current;
        if (shownRef.current || !last || recordedRef.current === last) return;
        recordedRef.current = last;
        record({ kind, param: last, via: 'link' });
      }, 0);
    };
  }, [active, kind, record]);

  return useCallback(() => {
    const now = lastRef.current;
    if (!shownRef.current || !now) return;
    recordedRef.current = now;
    record({ kind, param: now, via: 'link' });
  }, [kind, record]);
}
