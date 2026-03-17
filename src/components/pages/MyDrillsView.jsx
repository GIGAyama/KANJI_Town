import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, PenTool, Share2, Trash2, ArrowLeft } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { KANJI_DATA } from '../../data/kanji-data';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';

const MyDrillsView = ({ setView, stats, setStats, startDrillSession, setHostDrill }) => {
  const drills = stats.myDrills || [];
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = (idx) => {
    const newDrills = drills.filter((_, i) => i !== idx);
    const newStats = { ...stats, myDrills: newDrills };
    setStats(newStats); StorageAPI.saveStats(newStats); audioCtrl.playSE('click'); setConfirmDelete(null);
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('home')} aria-label="ホームに戻る" className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"><ArrowLeft size={24} /></button>
          <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2"><FileText size={24} className="text-[var(--secondary)]" /> マイドリル</h2>
        </div>
        <MotionButton variant="primary" onClick={() => setView('drillEditor')} className="px-4 py-2 text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_#9f1239] min-h-[44px]"><Plus size={16} /> {F("作","つく")}る</MotionButton>
      </div>
      {drills.length === 0 ? (
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-8 text-center shadow-sm">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-bold text-[var(--text)] opacity-60">ドリルがまだありません</p>
          <p className="text-sm text-[var(--text)] opacity-40 mt-1">「{F("作","つく")}る」ボタンで{F("作成","さくせい")}しよう</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {drills.map((drill, i) => (
            <div key={i} className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)] flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-black text-[var(--text)] text-lg truncate">{drill.name}</div>
                <div className="text-sm text-[var(--text)] opacity-60">{drill.kanjis?.length || 0}{F("文字","もじ")}</div>
                <div className="flex flex-wrap gap-1 mt-1">{(drill.kanjis || []).slice(0, 8).map(id => { const k = KANJI_DATA.find(k => k.id === id); return k ? <span key={id} className="text-lg font-black">{k.char}</span> : null; })}{(drill.kanjis?.length || 0) > 8 && <span className="text-xs font-bold text-[var(--text)] opacity-50 self-center">+{drill.kanjis.length - 8}</span>}</div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <MotionButton variant="primary" onClick={() => startDrillSession(drill)} className="px-3 py-2 text-xs border-[2px] border-[var(--text)] shadow-[0_2px_0_#9f1239] min-h-[36px]"><PenTool size={14} /> {F("練習","れんしゅう")}</MotionButton>
                <MotionButton variant="accent" onClick={() => { setHostDrill(drill); setView('peerHost'); }} className="px-3 py-2 text-xs border-[2px] border-[var(--text)] shadow-[0_2px_0_#b45309] min-h-[36px]"><Share2 size={14} /> {F("送","おく")}る</MotionButton>
                <button onClick={() => setConfirmDelete(i)} aria-label="ドリルを削除" className="px-3 py-2 text-xs border-[2px] border-rose-300 text-rose-500 rounded-[16px] font-bold hover:bg-rose-50 transition-colors min-h-[36px] flex items-center gap-1"><Trash2 size={14} /> {F("削除","さくじょ")}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 削除確認モーダル */}
      <AnimatePresence>
        {confirmDelete !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-6 shadow-[8px_8px_0_var(--text)] max-w-sm w-full">
              <div className="text-3xl text-center mb-3">🗑️</div>
              <p className="font-black text-[var(--text)] text-center text-lg mb-1">「{drills[confirmDelete]?.name}」</p>
              <p className="text-sm text-[var(--text)] opacity-60 text-center mb-4">を{F("削除","さくじょ")}してもよいですか？</p>
              <div className="flex gap-3">
                <MotionButton variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1 py-3 border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)]">キャンセル</MotionButton>
                <MotionButton variant="primary" onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 border-[3px] border-[var(--text)] shadow-[0_3px_0_#9f1239]">{F("削除","さくじょ")}する</MotionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyDrillsView;
