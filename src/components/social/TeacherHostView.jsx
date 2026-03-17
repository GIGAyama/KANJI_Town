import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wifi, ArrowLeft, Copy, Check } from 'lucide-react';
import { usePeerJS } from '../../hooks/usePeerJS';
import { useQRCode } from '../../hooks/useQRCode';
import { F } from '../ui/FormatKun';
import { KANJI_DATA } from '../../data/kanji-data';
import { audioCtrl } from '../../systems/audio';

// 4桁のランダムな数字IDを生成
const generate4DigitId = () => {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
};

const PEER_ID_PREFIX = 'kanji-town-';

const TeacherHostView = ({ setView, drill }) => {
  const isPeerLoaded = usePeerJS();
  const isQRLoaded = useQRCode();
  const [numericId, setNumericId] = useState('');
  const [status, setStatus] = useState('起動中...');
  const [copied, setCopied] = useState(false);
  const peerRef = useRef(null);
  const qrCanvasRef = useRef(null);
  const retryCountRef = useRef(0);

  // QRコード描画
  const renderQR = useCallback((id) => {
    if (!isQRLoaded || !qrCanvasRef.current || !id) return;
    try {
      window.QRCode.toCanvas(qrCanvasRef.current, id, {
        width: 200,
        margin: 2,
        color: { dark: '#292f36', light: '#ffffff' },
      });
    } catch (e) {
      console.error('QR code rendering failed:', e);
    }
  }, [isQRLoaded]);

  // Peer接続を開始（IDが衝突した場合はリトライ）
  const initPeer = useCallback(() => {
    if (!isPeerLoaded || !drill) return;
    const id4 = generate4DigitId();
    const fullId = PEER_ID_PREFIX + id4;
    try {
      if (peerRef.current) peerRef.current.destroy();
      const peer = new window.Peer(fullId);
      peerRef.current = peer;

      peer.on('open', () => {
        setNumericId(id4);
        setStatus('IDができました！');
        retryCountRef.current = 0;
        renderQR(fullId);
      });

      peer.on('connection', conn => {
        setStatus('せつぞくしました！おくっています...');
        conn.on('open', () => {
          conn.send(JSON.stringify({ type: 'drill', data: drill }));
          setTimeout(() => {
            setStatus('おくれました！');
            audioCtrl.playSE('success');
          }, 500);
        });
      });

      peer.on('error', err => {
        // IDが既に使われている場合はリトライ
        if (err.type === 'unavailable-id' && retryCountRef.current < 5) {
          retryCountRef.current++;
          peer.destroy();
          initPeer();
        } else {
          setStatus('エラーがおきました');
        }
      });
    } catch (e) {
      setStatus('PeerJS のじゅんびにしっぱいしました');
    }
  }, [isPeerLoaded, drill, renderQR]);

  useEffect(() => {
    initPeer();
    return () => { if (peerRef.current) peerRef.current.destroy(); };
  }, [initPeer]);

  // QRコードが後からロードされた場合に再描画
  useEffect(() => {
    if (numericId && isQRLoaded) {
      renderQR(PEER_ID_PREFIX + numericId);
    }
  }, [numericId, isQRLoaded, renderQR]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(numericId).then(() => {
      setCopied(true);
      audioCtrl.playSE('click');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const statusEmoji = status.includes('おくれました') ? '✅' : status.includes('エラー') || status.includes('しっぱい') ? '❌' : status.includes('おくって') ? '📨' : '📡';

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('myDrills')} className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2">
          <Wifi size={22} /> ドリルを{F("送","おく")}る
        </h2>
      </div>

      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-6 shadow-[4px_4px_0_var(--text)] flex flex-col items-center gap-4">
        <div className="text-4xl">{statusEmoji}</div>
        <div className="font-bold text-[var(--text)] text-center">{status}</div>

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

            {/* QRコード */}
            <div className="bg-white rounded-2xl p-4 border-[3px] border-[var(--text)] shadow-inner">
              <canvas ref={qrCanvasRef} />
            </div>
            <p className="text-xs text-[var(--text)] opacity-40 text-center">
              QRコードをよみとってもつなげます
            </p>
          </>
        )}

        {!isPeerLoaded && (
          <div className="text-sm text-[var(--text)] opacity-50">
            じゅんびしています...
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
