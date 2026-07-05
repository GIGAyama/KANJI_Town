import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Download, Wifi, Gift, ArrowLeft, Camera, X, Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MotionButton from '../ui/MotionButton';
import { usePeerJSStatus } from '../../hooks/usePeerJS';
import { useJsQR } from '../../hooks/useQRCode';
import { KANJI_DATA } from '../../data/kanji-data';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';

const PEER_ID_PREFIX = 'kanji-town-';

// ソフトウェア数字キーボード
const NumericKeypad = ({ value, onChange, onSubmit, disabled }) => {
  const handleKey = (digit) => {
    if (value.length >= 4) return;
    audioCtrl.playSE('click');
    onChange(value + digit);
  };

  const handleDelete = () => {
    if (value.length === 0) return;
    audioCtrl.playSE('click');
    onChange(value.slice(0, -1));
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['del', '0', 'ok'],
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* 入力表示エリア - 4桁のドット */}
      <div className="flex justify-center gap-4 mb-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`w-14 h-16 rounded-xl border-[4px] flex items-center justify-center text-3xl font-black transition-all ${
            value[i]
              ? 'border-[var(--primary)] bg-[var(--bg)] text-[var(--text)] scale-105'
              : i === value.length
                ? 'border-[var(--primary)] bg-[var(--bg)] animate-pulse'
                : 'border-[var(--text)] opacity-30 bg-[var(--bg)]'
          }`}>
            {value[i] || ''}
          </div>
        ))}
      </div>

      {/* キーパッド */}
      <div className="grid grid-cols-3 gap-2">
        {keys.flat().map((key) => {
          if (key === 'del') {
            return (
              <button key={key} onClick={handleDelete} disabled={value.length === 0}
                className="h-14 rounded-xl border-[3px] border-[var(--text)] bg-[var(--bg)] font-bold text-[var(--text)] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30 touch-manipulation">
                <Delete size={24} />
              </button>
            );
          }
          if (key === 'ok') {
            return (
              <button key={key} onClick={onSubmit} disabled={disabled || value.length !== 4}
                className={`h-14 rounded-xl border-[3px] font-black text-lg flex items-center justify-center active:scale-95 transition-all touch-manipulation ${
                  value.length === 4 && !disabled
                    ? 'border-[var(--text)] bg-[var(--primary)] text-white shadow-[0_3px_0_#9f1239]'
                    : 'border-[var(--text)] bg-[var(--bg)] text-[var(--text)] opacity-30'
                }`}>
                OK
              </button>
            );
          }
          return (
            <button key={key} onClick={() => handleKey(key)} disabled={value.length >= 4}
              className="h-14 rounded-xl border-[3px] border-[var(--text)] bg-[var(--panel)] font-black text-2xl text-[var(--text)] flex items-center justify-center active:scale-95 active:bg-[var(--accent)] transition-all disabled:opacity-30 touch-manipulation shadow-[0_3px_0_var(--text)]">
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// QRコードスキャナー
const QRScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const onScanRef = useRef(onScan);
  const isJsQRLoaded = useJsQR();
  const [error, setError] = useState('');

  // onScanの最新値をrefで保持（useEffect/useCallbackの依存に含めない）
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // スキャンループ（依存が安定しているため、カメラのuseEffectが不要に再実行されない）
  const startScanLoop = useCallback(() => {
    const tick = () => {
      if (!videoRef.current || !canvasRef.current || !window.jsQR) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imageData.data, canvas.width, canvas.height);
      if (code && code.data) {
        // URL形式（?connect=XXXX）、kanji-town-プレフィックス、または4桁の数字を検出
        let peerId = code.data;
        try {
          const url = new URL(peerId);
          const connectParam = url.searchParams.get('connect');
          if (connectParam) peerId = connectParam;
        } catch {
          // URL形式でない場合はそのまま処理
          if (peerId.startsWith(PEER_ID_PREFIX)) {
            peerId = peerId.replace(PEER_ID_PREFIX, '');
          }
        }
        if (/^\d{4}$/.test(peerId)) {
          audioCtrl.playSE('success');
          stopCamera();
          onScanRef.current(peerId);
          return;
        }
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, [stopCamera]);

  // カメラ初期化（isJsQRLoadedのみに依存し、安定して1回だけ実行）
  useEffect(() => {
    if (!isJsQRLoaded) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('このブラウザではカメラがつかえません');
      return;
    }
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          startScanLoop();
        }
      })
      .catch(() => { if (!cancelled) setError('カメラをつかえません'); });
    return () => { cancelled = true; stopCamera(); };
  }, [isJsQRLoaded, startScanLoop, stopCamera]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        <button onClick={() => { stopCamera(); onClose(); }}
          className="absolute -top-12 right-0 text-white p-2 rounded-full bg-white/20 z-10">
          <X size={28} />
        </button>
        {error ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">📷</div>
            <p className="font-bold text-gray-700">{error}</p>
            <p className="text-sm text-gray-400 mt-2">すうじをにゅうりょくしてください</p>
          </div>
        ) : (
          <>
            <div className="relative rounded-2xl overflow-hidden border-4 border-white/50">
              <video ref={videoRef} className="w-full" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              {/* スキャンエリアガイド */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-4 border-white/70 rounded-2xl" />
              </div>
            </div>
            <p className="text-white text-center mt-3 font-bold text-sm">
              QRコードをうつしてください
            </p>
            {!isJsQRLoaded && (
              <p className="text-white/50 text-center mt-1 text-xs">スキャナーをよみこみ中...</p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

const StudentClientView = ({ setView, stats, setStats, initialConnectId }) => {
  const { isLoaded: isPeerLoaded, loadError: peerLoadError } = usePeerJSStatus();
  const [hostId, setHostId] = useState(initialConnectId || '');
  const [status, setStatus] = useState('');
  const [receivedDrill, setReceivedDrill] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const peerRef = useRef(null);

  // 画面を離れるときにPeer接続を破棄する（接続リーク防止）
  useEffect(() => {
    return () => { if (peerRef.current) peerRef.current.destroy(); };
  }, []);

  const handleConnect = useCallback(() => {
    if (!isPeerLoaded || hostId.length !== 4) return;
    const fullId = PEER_ID_PREFIX + hostId;
    try {
      if (peerRef.current) peerRef.current.destroy();
      const peer = new window.Peer();
      peerRef.current = peer;
      setStatus('つないでいます...');
      peer.on('open', () => {
        const conn = peer.connect(fullId);
        conn.on('open', () => setStatus('つながりました！まっています...'));
        conn.on('data', data => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'drill') {
              setReceivedDrill(parsed.data);
              setStatus('ドリルをうけとりました！');
              audioCtrl.playSE('chest_open');
            }
          } catch (e) { setStatus('データのうけとりにしっぱいしました'); }
        });
        conn.on('error', () => setStatus('せつぞくエラーがおきました'));
      });
      peer.on('error', () => setStatus('つなげませんでした。IDをかくにんしてください'));
    } catch (e) { setStatus('PeerJS のじゅんびにしっぱいしました'); }
  }, [isPeerLoaded, hostId]);

  // 4桁入力完了で自動接続
  useEffect(() => {
    if (hostId.length === 4 && isPeerLoaded && !receivedDrill) {
      // 少し待ってから接続（キーパッドアニメーション用）
      const timer = setTimeout(handleConnect, 300);
      return () => clearTimeout(timer);
    }
  }, [hostId, isPeerLoaded, receivedDrill, handleConnect]);

  const handleSaveDrill = () => {
    if (!receivedDrill) return;
    const newStats = { ...stats, myDrills: [...(stats.myDrills || []), { ...receivedDrill, createdAt: Date.now() }] };
    setStats(newStats);
    StorageAPI.saveStats(newStats);
    audioCtrl.playSE('success');
    setView('myDrills');
  };

  const handleQRScan = useCallback((scannedId) => {
    setShowScanner(false);
    setHostId(scannedId);
  }, []);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('home')} className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2">
          <Download size={22} /> {F("通信","つうしん")}でもらう
        </h2>
      </div>

      {!receivedDrill && (
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-5 shadow-[4px_4px_0_var(--text)] flex flex-col gap-4">
          <div className="text-center font-bold text-[var(--text)]">
            <span className="text-lg">4けたのすうじ</span>をいれてね
          </div>

          {/* 数字キーパッド */}
          <NumericKeypad
            value={hostId}
            onChange={setHostId}
            onSubmit={handleConnect}
            disabled={!isPeerLoaded}
          />

          {/* QRコードスキャンボタン */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[2px] bg-[var(--text)] opacity-10" />
            <span className="text-xs font-bold text-[var(--text)] opacity-40">または</span>
            <div className="flex-1 h-[2px] bg-[var(--text)] opacity-10" />
          </div>

          <MotionButton variant="secondary" onClick={() => setShowScanner(true)}
            className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)]">
            <Camera size={22} /> QRコードでよみとる
          </MotionButton>

          {!isPeerLoaded && !peerLoadError && (
            <div className="text-xs text-center text-[var(--text)] opacity-50">
              じゅんびしています...
            </div>
          )}
          {peerLoadError && (
            <div className="text-xs text-center text-rose-600 font-bold bg-rose-50 border-2 border-rose-400 rounded-xl px-3 py-2">
              つうしんライブラリのよみこみに しっぱいしました。<br />
              ネットワークをかくにんしてください。
            </div>
          )}
        </div>
      )}

      {/* 接続ステータス */}
      {status !== '' && (
        <div className={`border-[3px] rounded-xl p-4 font-bold text-center transition-colors ${
          status.includes('うけとり') ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
            : status.includes('エラー') || status.includes('しっぱい') ? 'bg-rose-50 border-rose-400 text-rose-700'
            : 'bg-[var(--bg)] border-[var(--text)] text-[var(--text)]'
        }`}>
          <div className="text-2xl mb-1">
            {status.includes('うけとり') ? '🎉' : status.includes('エラー') || status.includes('しっぱい') ? '😢' : '⏳'}
          </div>
          {status}
        </div>
      )}

      {/* 受信したドリル */}
      <AnimatePresence>
        {receivedDrill && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--panel)] border-[4px] border-emerald-400 rounded-2xl p-5 shadow-[4px_4px_0_#059669] flex flex-col gap-3">
            <div className="font-black text-[var(--text)] text-lg flex items-center gap-2">
              <Gift size={20} className="text-emerald-500" /> {receivedDrill.name}
            </div>
            <div className="flex flex-wrap gap-1">
              {(receivedDrill.kanjis || []).map(id => {
                const k = KANJI_DATA.find(k => k.id === id);
                return k ? <span key={id} className="text-2xl font-black">{k.char}</span> : null;
              })}
            </div>
            <MotionButton variant="success" onClick={handleSaveDrill}
              className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#065f46]">
              マイドリルに{F("保存","ほぞん")}する
            </MotionButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QRスキャナーモーダル */}
      <AnimatePresence>
        {showScanner && (
          <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentClientView;
