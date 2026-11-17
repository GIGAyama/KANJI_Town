import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { useQRCode } from '../../hooks/useQRCode';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';
import { buildClassroomShareUrl, isQrFriendlyUrl, isShareUrlTooLong } from '../../systems/drill-share';

// Google Classroom のブランドカラー
const CLASSROOM_GREEN = '#0f9d58';

/**
 * リンクで配る部分（URL とコピー・Google Classroom・QR コード）。
 * マイドリル（宿題を含む）と、ならった範囲の配る画面で使う。
 *   shareUrl      … 配る URL（null なら何も出さない）
 *   title         … Classroom の共有画面に渡す題
 *   label         … URL の欄の名前
 *   tooLongNote   … URL が長すぎるときに出す文
 */
const ShareLinkPanel = ({ shareUrl, title, label = 'ドリルのURL', inputId = 'drill-share-url', tooLongNote }) => {
  const { lib: QRCode, isLoaded: isQRLoaded, loadError: qrLoadError } = useQRCode();
  const qrCanvasRef = useRef(null);
  const urlInputRef = useRef(null);
  const copyTimerRef = useRef(null);
  const [copyState, setCopyState] = useState('idle'); // idle | copied | failed

  const classroomUrl = useMemo(() => (shareUrl ? buildClassroomShareUrl(shareUrl, title) : null), [shareUrl, title]);
  const canShowQR = isQrFriendlyUrl(shareUrl);
  const isTooLong = isShareUrlTooLong(shareUrl);

  // QRコードを描画（URLが長すぎるときは読み取りづらいので出さない）
  useEffect(() => {
    if (!QRCode || !canShowQR || !qrCanvasRef.current || !shareUrl) return;
    Promise.resolve()
      .then(() => QRCode.toCanvas(qrCanvasRef.current, shareUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#292f36', light: '#ffffff' },
      }))
      .catch((e) => console.error('QR code rendering failed:', e));
  }, [QRCode, canShowQR, shareUrl]);

  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); }, []);
  // 中身（宿題の決まりなど）を変えたら、「コピーしました」を消す（古いURLをコピーしたと思わないように）
  useEffect(() => { setCopyState('idle'); }, [shareUrl]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(shareUrl);
      setCopyState('copied');
      audioCtrl.playSE('success');
    } catch {
      // コピーできない環境（権限なし・古いブラウザ）では手で選べるようにする
      urlInputRef.current?.focus();
      urlInputRef.current?.select();
      setCopyState('failed');
    }
    copyTimerRef.current = setTimeout(() => setCopyState('idle'), 2500);
  }, [shareUrl]);

  if (!shareUrl) return null;

  return (
    <>
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-5 shadow-[4px_4px_0_var(--text)] flex flex-col gap-4">
        {/* 共有URL */}
        <div className="flex flex-col gap-2">
          <label htmlFor={inputId} className="text-sm font-black text-[var(--text)]">{label}</label>
          <div className="flex gap-2">
            <input
              id={inputId}
              ref={urlInputRef}
              value={shareUrl}
              readOnly
              onFocus={e => e.target.select()}
              className="flex-1 min-w-0 bg-[var(--bg)] border-[3px] border-[var(--text)] rounded-xl px-3 py-3 text-sm text-[var(--text)] font-mono focus:outline-none focus:border-[var(--primary)]"
            />
            <button
              onClick={handleCopy}
              aria-label="URLをコピー"
              className="shrink-0 px-4 rounded-xl border-[3px] border-[var(--text)] bg-[var(--panel)] hover:bg-[var(--accent)] transition-colors min-w-[56px] min-h-[48px] flex items-center justify-center"
            >
              {copyState === 'copied'
                ? <Check size={24} className="text-emerald-500" />
                : <Copy size={24} className="text-[var(--text)] opacity-60" />}
            </button>
          </div>
          {copyState === 'copied' && (
            <p className="text-sm font-bold text-emerald-600">コピーしました！Classroomにはりつけてください</p>
          )}
          {copyState === 'failed' && (
            <p className="text-sm font-bold text-amber-700">じどうコピーできませんでした。えらばれているURLを手でコピーしてください</p>
          )}
        </div>

        {/* Google Classroom へ共有 */}
        <a
          href={classroomUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => audioCtrl.playSE('click')}
          className="w-full py-4 rounded-[20px] font-black text-white text-base flex items-center justify-center gap-2 border-none shadow-[0_4px_0_#0b7043] hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all touch-manipulation"
          style={{ backgroundColor: CLASSROOM_GREEN }}
        >
          <ExternalLink size={20} /> <span>Google Classroom で{F("共有","きょうゆう")}する</span>
        </a>
        <p className="text-xs text-[var(--text)] opacity-50 -mt-2">
          Classroomがひらいたら、クラスと「{F("課題","かだい")}」「{F("資料","しりょう")}」などをえらんで{F("投稿","とうこう")}してください。
        </p>

        {isTooLong && (
          <div role="status" className="text-sm text-amber-800 font-bold bg-amber-50 border-2 border-amber-400 rounded-xl px-3 py-2">
            {tooLongNote || <>{F("漢字","かんじ")}が多いためURLがとても長くなっています。うまく{F("開","ひら")}けないときは、ドリルを分けて{F("配","くば")}ってください。</>}
          </div>
        )}
      </div>

      {/* QRコード */}
      {canShowQR && (
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-5 shadow-[4px_4px_0_var(--text)] flex flex-col items-center gap-3">
          <div className={`bg-white rounded-2xl p-4 border-[3px] border-[var(--text)] shadow-inner ${isQRLoaded ? '' : 'hidden'}`}>
            <canvas ref={qrCanvasRef} />
          </div>
          {qrLoadError ? (
            <p className="text-xs font-bold text-amber-700 text-center">
              QRコードは だせませんでした。上のURLを コピーして くばってください。
            </p>
          ) : (
            <p className="text-xs text-[var(--text)] opacity-50 text-center">
              {isQRLoaded ? 'QRコードをよみとっても うけとれます' : 'QRコードをよみこみ中...'}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default ShareLinkPanel;
