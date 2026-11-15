import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Wifi, ArrowLeft, Copy, Check, Link2 } from 'lucide-react';
import { usePeerJS, classifyPeerError, PEER_OPTIONS, PEER_ID_PREFIX } from '../../hooks/usePeerJS';
import { useQRCode } from '../../hooks/useQRCode';
import { F } from '../ui/FormatKun';
import MotionButton from '../ui/MotionButton';
import PresentationToggle from '../ui/PresentationToggle';
import { KANJI_DATA } from '../../data/kanji-data';
import { audioCtrl } from '../../systems/audio';
import { buildDrillMessage, drillCheckCode } from '../../systems/drill-p2p';

// 4桁のランダムな数字IDを生成
const generate4DigitId = () => {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
};

const STATUS_EMOJI = { wait: '📡', sending: '📨', sent: '✅', error: '❌' };

const TeacherHostView = ({ setView, drill }) => {
  const { Peer, loadError: peerLoadError, offline } = usePeerJS();
  const { lib: QRCode, isLoaded: isQRLoaded, loadError: qrLoadError } = useQRCode();
  const [numericId, setNumericId] = useState('');
  // tone: wait | sending | sent | error
  const [status, setStatus] = useState({ tone: 'wait', text: '起動中...' });
  // 送れないとき、リンク配布へ案内する理由（blocked | unsupported）
  const [blockedReason, setBlockedReason] = useState(null);
  const [copied, setCopied] = useState(false);
  const peerRef = useRef(null);
  const qrCanvasRef = useRef(null);
  const retryCountRef = useRef(0);

  // 送る中身はリンクと同じ形に整えてから送る（受け取る側も同じ検証に通す）
  const message = useMemo(() => (drill ? buildDrillMessage(drill) : null), [drill]);
  // 受け取った児童の画面にも同じ絵が出る。数字の打ちまちがいに気づいてもらうため
  const checkCode = useMemo(() => (drill ? drillCheckCode(drill) : ''), [drill]);

  // QRコード描画（接続用URLをエンコード）
  const renderQR = useCallback((numId) => {
    if (!QRCode || !qrCanvasRef.current || !numId) return;
    const url = `${window.location.origin}${window.location.pathname}?connect=${numId}`;
    Promise.resolve()
      .then(() => QRCode.toCanvas(qrCanvasRef.current, url, {
        width: 200,
        margin: 2,
        color: { dark: '#292f36', light: '#ffffff' },
      }))
      .catch((e) => console.error('QR code rendering failed:', e));
  }, [QRCode]);

  // Peer接続を開始（IDが衝突した場合はリトライ）
  const initPeer = useCallback(() => {
    if (!Peer || !message) return;
    const id4 = generate4DigitId();
    const fullId = PEER_ID_PREFIX + id4;
    try {
      if (peerRef.current) peerRef.current.destroy();
      const peer = new Peer(fullId, PEER_OPTIONS);
      peerRef.current = peer;

      peer.on('open', () => {
        setNumericId(id4);
        setStatus({ tone: 'wait', text: 'IDができました！' });
        setBlockedReason(null);
        retryCountRef.current = 0;
        renderQR(id4);
      });

      peer.on('connection', conn => {
        setStatus({ tone: 'sending', text: 'せつぞくしました！おくっています...' });
        conn.on('open', () => {
          conn.send(message);
          setTimeout(() => {
            setStatus({ tone: 'sent', text: 'おくれました！' });
            audioCtrl.playSE('success');
          }, 500);
        });
      });

      peer.on('error', err => {
        const kind = classifyPeerError(err);
        // IDが既に使われている場合は作り直す
        if (kind === 'id-taken' && retryCountRef.current < 5) {
          retryCountRef.current++;
          peer.destroy();
          initPeer();
          return;
        }
        // 相手が途中で抜けただけなら、ほかの児童への送信は続けられる
        if (kind === 'not-found') return;
        setStatus({ tone: 'error', text: 'つうしんが できませんでした' });
        setBlockedReason(kind === 'unsupported' ? 'unsupported' : 'blocked');
      });
    } catch (e) {
      setStatus({ tone: 'error', text: 'つうしんの じゅんびに しっぱいしました' });
      setBlockedReason('blocked');
    }
  }, [Peer, message, renderQR]);

  useEffect(() => {
    initPeer();
    return () => { if (peerRef.current) peerRef.current.destroy(); };
  }, [initPeer]);

  // QRコードが後からロードされた場合に再描画
  useEffect(() => {
    if (numericId && isQRLoaded) {
      renderQR(numericId);
    }
  }, [numericId, isQRLoaded, renderQR]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(numericId).then(() => {
      setCopied(true);
      audioCtrl.playSE('click');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const showLinkGuide = Boolean(blockedReason) || peerLoadError || !message;

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('myDrills')} aria-label="マイドリルに戻る" className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2">
          <Wifi size={22} /> ドリルを{F("送","おく")}る
        </h2>
        {/* この画面は電子黒板に映して使う。後ろの席から4けたの数字とQRが
            読めるよう、提示モードへ切り替えられるようにしておく。 */}
        <PresentationToggle className="ml-auto" />
      </div>

      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-6 shadow-[4px_4px_0_var(--text)] flex flex-col items-center gap-4">
        <div className="text-4xl" aria-hidden="true">{STATUS_EMOJI[status.tone]}</div>
        <div className="font-bold text-[var(--text)] text-center" role="status" aria-live="polite">{status.text}</div>

        {numericId && (
          <>
            {/* 4桁の数字ID表示 */}
            <div className="flex items-center gap-3">
              <div className="bg-[var(--bg)] border-[4px] border-[var(--text)] rounded-2xl px-8 py-4 font-black text-5xl tracking-[0.3em] text-[var(--primary)] text-center select-all" style={{ fontFamily: "'Zen Maru Gothic', sans-serif", letterSpacing: '0.3em' }}>
                {numericId}
              </div>
              <button onClick={handleCopy} className="p-3 rounded-xl border-[3px] border-[var(--text)] bg-[var(--bg)] hover:bg-[var(--accent)] transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center" aria-label="IDをコピー">
                {copied ? <Check size={24} className="text-emerald-500" /> : <Copy size={24} className="text-[var(--text)] opacity-60" />}
              </button>
            </div>

            <p className="text-sm text-[var(--text)] opacity-60 text-center">
              この<span className="font-black text-base text-[var(--primary)]">4けたのすうじ</span>を{F("相手","あいて")}に{F("伝","つた")}えてください
            </p>

            {checkCode && (
              <div className="flex flex-col items-center gap-1 bg-[var(--bg)] border-[3px] border-[var(--text)] rounded-2xl px-5 py-2">
                <span className="text-xs font-black text-[var(--text)] opacity-70">かくにんの しるし</span>
                <span className="text-4xl leading-none" aria-label={`かくにんのしるし ${checkCode}`}>{checkCode}</span>
                <span className="text-[11px] font-bold text-[var(--text)] opacity-60 text-center">うけとった {F("人","ひと")}の {F("画面","がめん")}にも おなじ しるしが でます</span>
              </div>
            )}

            {/* QRコード（読めなければ数字だけで使ってもらう） */}
            {qrLoadError ? (
              <p className="text-xs font-bold text-amber-700 bg-amber-50 border-2 border-amber-300 rounded-xl px-3 py-2 text-center">
                QRコードは だせませんでした。4けたの すうじを つたえてください。
              </p>
            ) : (
              <>
                <div className="bg-white rounded-2xl p-4 border-[3px] border-[var(--text)] shadow-inner">
                  <canvas ref={qrCanvasRef} />
                </div>
                <p className="text-xs text-[var(--text)] opacity-40 text-center">
                  QRコードをよみとってもつなげます
                </p>
              </>
            )}
          </>
        )}

        {!Peer && !peerLoadError && (
          <div className="text-sm text-[var(--text)] opacity-50">
            じゅんびしています...
          </div>
        )}

        {showLinkGuide && (
          <div role="alert" className="w-full flex flex-col gap-3 text-sm text-rose-700 font-bold bg-rose-50 border-2 border-rose-400 rounded-xl px-4 py-3 text-center">
            <p>
              {offline
                ? <>いまは インターネットに つながっていないため、4けたの すうじでは {F("送","おく")}れません。</>
                : blockedReason === 'unsupported'
                  ? <>この ブラウザでは 4けたの すうじで {F("送","おく")}れません。</>
                  : <>{F("学校","がっこう")}の ネットワークで つうしんが とめられているかもしれません。</>}
              <br />
              「リンクで{F("配","くば")}る」なら、{F("外","そと")}の サーバーを つかわずに {F("配","くば")}れます。
            </p>
            {drill && (
              <MotionButton variant="accent" onClick={() => setView('drillShare')} className="w-full py-3 border-[3px] border-[var(--text)] shadow-[0_3px_0_#b45309] text-base font-black">
                <Link2 size={18} /> リンクで{F("配","くば")}る
              </MotionButton>
            )}
          </div>
        )}
      </div>

      {drill && (
        <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl p-4">
          <div className="font-black text-[var(--text)] mb-2">
            {F("送","おく")}るドリル：{drill.name}
          </div>
          <div className="flex flex-wrap gap-1">
            {(drill.kanjis || []).map(id => {
              const k = KANJI_DATA.find(k => k.id === id);
              return k ? <span key={id} className="text-xl font-black">{k.char}</span> : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherHostView;
