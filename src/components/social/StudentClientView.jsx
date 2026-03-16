import React, { useState, useRef } from 'react';
import { Download, Wifi, Gift, ArrowLeft } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { usePeerJS } from '../../hooks/usePeerJS';
import { KANJI_DATA } from '../../data/kanji-data';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';

const StudentClientView = ({ setView, stats, setStats }) => {
  const isPeerLoaded = usePeerJS();
  const [hostId, setHostId] = useState('');
  const [status, setStatus] = useState('');
  const [receivedDrill, setReceivedDrill] = useState(null);
  const peerRef = useRef(null);

  const handleConnect = () => {
    if (!isPeerLoaded || !hostId.trim()) return;
    try {
      if (peerRef.current) peerRef.current.destroy();
      const peer = new window.Peer();
      peerRef.current = peer;
      setStatus('接続中...');
      peer.on('open', () => {
        const conn = peer.connect(hostId.trim());
        conn.on('open', () => setStatus('接続しました！データを待っています'));
        conn.on('data', data => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'drill') {
              setReceivedDrill(parsed.data);
              setStatus('ドリルを受け取りました！');
              audioCtrl.playSE('chest_open');
            }
          } catch (e) { setStatus('データの受け取りに失敗しました'); }
        });
        conn.on('error', () => setStatus('接続エラーが発生しました'));
      });
      peer.on('error', () => setStatus('接続に失敗しました。IDを確認してください'));
    } catch (e) { setStatus('PeerJS の初期化に失敗しました'); }
  };

  const handleSaveDrill = () => {
    if (!receivedDrill) return;
    const newStats = { ...stats, myDrills: [...(stats.myDrills || []), { ...receivedDrill, createdAt: Date.now() }] };
    setStats(newStats); StorageAPI.saveStats(newStats); audioCtrl.playSE('success'); setView('myDrills');
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('home')} className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2"><Download size={22} /> 通信でもらう</h2>
      </div>
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-5 shadow-[4px_4px_0_var(--text)] flex flex-col gap-3">
        <div className="text-sm font-bold text-[var(--text)] opacity-70">先生から教えてもらったIDを入力してください</div>
        <input value={hostId} onChange={e => setHostId(e.target.value)} placeholder="ID を入力" className="w-full bg-[var(--bg)] border-[3px] border-[var(--text)] rounded-xl px-4 py-3 font-black text-[var(--text)] placeholder:opacity-30 focus:outline-none focus:border-[var(--primary)] text-xl tracking-widest" />
        <MotionButton variant="primary" onClick={handleConnect} disabled={!isPeerLoaded || !hostId.trim()} className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#9f1239]">
          <Wifi size={20} /> つなぐ
        </MotionButton>
        {!isPeerLoaded && <div className="text-xs text-center text-[var(--text)] opacity-50">PeerJS 読み込み中...</div>}
      </div>
      {status !== '' && (
        <div className={`border-[3px] rounded-xl p-4 font-bold text-center transition-colors ${status.includes('受け取り') ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : status.includes('エラー') || status.includes('失敗') ? 'bg-rose-50 border-rose-400 text-rose-700' : 'bg-[var(--bg)] border-[var(--text)] text-[var(--text)]'}`}>
          {status}
        </div>
      )}
      {receivedDrill && (
        <div className="bg-[var(--panel)] border-[4px] border-emerald-400 rounded-2xl p-5 shadow-[4px_4px_0_#059669] flex flex-col gap-3">
          <div className="font-black text-[var(--text)] text-lg flex items-center gap-2"><Gift size={20} className="text-emerald-500" /> {receivedDrill.name}</div>
          <div className="flex flex-wrap gap-1">{(receivedDrill.kanjis || []).map(id => { const k = KANJI_DATA.find(k => k.id === id); return k ? <span key={id} className="text-2xl font-black">{k.char}</span> : null; })}</div>
          <MotionButton variant="success" onClick={handleSaveDrill} className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#065f46]">
            マイドリルに保存する
          </MotionButton>
        </div>
      )}
    </div>
  );
};

export default StudentClientView;
