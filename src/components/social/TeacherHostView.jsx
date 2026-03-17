import React, { useState, useEffect, useRef } from 'react';
import { Wifi, ArrowLeft } from 'lucide-react';
import { usePeerJS } from '../../hooks/usePeerJS';
import { F } from '../ui/FormatKun';
import { KANJI_DATA } from '../../data/kanji-data';

const TeacherHostView = ({ setView, drill }) => {
  const isPeerLoaded = usePeerJS();
  const [peerId, setPeerId] = useState('');
  const [status, setStatus] = useState('起動中...');
  const peerRef = useRef(null);

  useEffect(() => {
    if (!isPeerLoaded || !drill) return;
    try {
      const peer = new window.Peer();
      peerRef.current = peer;
      peer.on('open', id => { setPeerId(id); setStatus('生徒の接続を待っています'); });
      peer.on('connection', conn => {
        setStatus('生徒が接続しました！送信中...');
        conn.on('open', () => {
          conn.send(JSON.stringify({ type: 'drill', data: drill }));
          setTimeout(() => setStatus('送信完了！'), 500);
        });
      });
      peer.on('error', () => setStatus('エラーが発生しました'));
      return () => { peer.destroy(); };
    } catch (e) { setStatus('PeerJS の初期化に失敗しました'); }
  }, [isPeerLoaded, drill]);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('myDrills')} className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2"><Wifi size={22} /> ドリルを{F("送","おく")}る</h2>
      </div>
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-6 shadow-[4px_4px_0_var(--text)] flex flex-col items-center gap-4">
        <div className="text-4xl">{status.includes('完了') ? '✅' : status.includes('エラー') ? '❌' : '📡'}</div>
        <div className="font-bold text-[var(--text)] text-center">{status}</div>
        {peerId && (
          <>
            <div className="bg-[var(--bg)] border-[3px] border-[var(--text)] rounded-xl px-6 py-3 font-black text-2xl tracking-widest text-[var(--primary)]">{peerId}</div>
            <p className="text-sm text-[var(--text)] opacity-60 text-center">このIDを{F("生徒","せいと")}に{F("伝","つた")}えてください</p>
          </>
        )}
        {!isPeerLoaded && <div className="text-sm text-[var(--text)] opacity-50">PeerJS を{F("読","よ")}み{F("込","こ")}み{F("中","ちゅう")}...</div>}
      </div>
      {drill && (
        <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl p-4">
          <div className="font-black text-[var(--text)] mb-2">{F("送","おく")}るドリル：{drill.name}</div>
          <div className="flex flex-wrap gap-1">{(drill.kanjis || []).map(id => { const k = KANJI_DATA.find(k => k.id === id); return k ? <span key={id} className="text-xl font-black">{k.char}</span> : null; })}</div>
        </div>
      )}
    </div>
  );
};

export default TeacherHostView;
