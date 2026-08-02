import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, Link2, ExternalLink } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { useQRCode } from '../../hooks/useQRCode';
import { KANJI_DATA } from '../../data/kanji-data';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';
import {
  buildClassroomShareUrl,
  buildDrillShareUrl,
  isQrFriendlyUrl,
  isShareUrlTooLong,
} from '../../systems/drill-share';

// Google Classroom のブランドカラー
const CLASSROOM_GREEN = '#0f9d58';

const DrillShareView = ({ setView, drill }) => {
  const isQRLoaded = useQRCode();
  const qrCanvasRef = useRef(null);
  const urlInputRef = useRef(null);
  const copyTimerRef = useRef(null);
  const [copyState, setCopyState] = useState('idle'); // idle | copied | failed

  const shareUrl = useMemo(() => {
    if (!drill) return null;
    return buildDrillShareUrl(drill, `${window.location.origin}${window.location.pathname}`);
  }, [drill]);

  const classroomUrl = useMemo(
    () => (shareUrl ? buildClassroomShareUrl(shareUrl, drill?.name) : null),
    [shareUrl, drill],
  );

  const canShowQR = isQrFriendlyUrl(shareUrl);
  const isTooLong = isShareUrlTooLong(shareUrl);

  // QRコードを描画（URLが長すぎるときは読み取りづらいので出さない）
  useEffect(() => {
    if (!isQRLoaded || !canShowQR || !qrCanvasRef.current || !shareUrl) return;
    try {
      window.QRCode.toCanvas(qrCanvasRef.current, shareUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#292f36', light: '#ffffff' },
      });
    } catch (e) {
      console.error('QR code rendering failed:', e);
    }
  }, [isQRLoaded, canShowQR, shareUrl]);

  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); }, []);

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

  const handleOpenClassroom = useCallback(() => {
    audioCtrl.playSE('click');
  }, []);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('myDrills')} aria-label="マイドリルに戻る" className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2">
          <Link2 size={22} /> リンクで{F("配","くば")}る
        </h2>
      </div>

      {!drill || !shareUrl ? (
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">🔗</div>
          <p className="font-bold text-[var(--text)] opacity-60">このドリルはリンクにできませんでした</p>
          <p className="text-sm text-[var(--text)] opacity-40 mt-1">マイドリルからもう一度えらんでください</p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-5 shadow-[4px_4px_0_var(--text)] flex flex-col gap-4">
            <div>
              <div className="font-black text-[var(--text)] text-lg">{drill.name}</div>
              <div className="text-sm text-[var(--text)] opacity-60">{drill.kanjis?.length || 0}{F("文字","もじ")}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {(drill.kanjis || []).map(id => {
                  const k = KANJI_DATA.find(k => k.id === id);
                  return k ? <span key={id} className="text-xl font-black">{k.char}</span> : null;
                })}
              </div>
            </div>

            {/* 共有URL */}
            <div className="flex flex-col gap-2">
              <label htmlFor="drill-share-url" className="text-sm font-black text-[var(--text)]">
                ドリルのURL
              </label>
              <div className="flex gap-2">
                <input
                  id="drill-share-url"
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
              onClick={handleOpenClassroom}
              className="w-full py-4 rounded-[20px] font-black text-white text-base flex items-center justify-center gap-2 border-none shadow-[0_4px_0_#0b7043] hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all touch-manipulation"
              style={{ backgroundColor: CLASSROOM_GREEN }}
            >
              <ExternalLink size={20} /> Google Classroom で{F("共有","きょうゆう")}する
            </a>
            <p className="text-xs text-[var(--text)] opacity-50 -mt-2">
              Classroomがひらいたら、クラスと「{F("課題","かだい")}」「{F("資料","しりょう")}」などをえらんで{F("投稿","とうこう")}してください。
            </p>

            {isTooLong && (
              <div className="text-sm text-amber-800 font-bold bg-amber-50 border-2 border-amber-400 rounded-xl px-3 py-2">
                {F("漢字","かんじ")}が多いためURLがとても長くなっています。
                うまく{F("開","ひら")}けないときは、ドリルを分けて{F("配","くば")}ってください。
              </div>
            )}
          </div>

          {/* QRコード */}
          {canShowQR && (
            <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-5 shadow-[4px_4px_0_var(--text)] flex flex-col items-center gap-3">
              <div className={`bg-white rounded-2xl p-4 border-[3px] border-[var(--text)] shadow-inner ${isQRLoaded ? '' : 'hidden'}`}>
                <canvas ref={qrCanvasRef} />
              </div>
              <p className="text-xs text-[var(--text)] opacity-50 text-center">
                {isQRLoaded ? 'QRコードをよみとってもドリルをうけとれます' : 'QRコードをよみこみ中...'}
              </p>
            </div>
          )}

          <div className="bg-[var(--bg)] border-[3px] border-[var(--text)] rounded-xl p-4 flex flex-col gap-1 text-sm text-[var(--text)] opacity-70">
            <p className="font-black opacity-100">リンクについて</p>
            <p>・ドリルの{F("中身","なかみ")}はURLの中に{F("入","はい")}っています。サーバーに{F("保存","ほぞん")}されません。</p>
            <p>・リンクを{F("開","ひら")}くと、そのままマイドリルに{F("保存","ほぞん")}できます。アプリを{F("入","い")}れなおす{F("必要","ひつよう")}はありません。</p>
            <p>・あとからドリルを{F("直","なお")}しても、{F("配","くば")}ったリンクは{F("変","か")}わりません。新しいリンクを{F("配","くば")}りなおしてください。</p>
          </div>

          <MotionButton variant="secondary" onClick={() => setView('peerHost')} className="w-full py-3 border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)] text-sm">
            4けたのすうじで{F("送","おく")}る（{F("同","おな")}じ{F("教室","きょうしつ")}のとき）
          </MotionButton>
        </>
      )}
    </div>
  );
};

export default DrillShareView;
