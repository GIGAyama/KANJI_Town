import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { KANJI_DATA } from '../../data/kanji-data';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';

const DrillEditorView = ({ setView, stats, setStats }) => {
  const [drillName, setDrillName] = useState('');
  const [selectedKanjis, setSelectedKanjis] = useState([]);
  const [filterGrade, setFilterGrade] = useState(0);

  const toggleKanji = (id) => { setSelectedKanjis(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]); audioCtrl.playSE('click'); };

  const handleSave = () => {
    if (!drillName.trim() || selectedKanjis.length === 0) { audioCtrl.playSE('stamp_bad'); return; }
    const newDrill = { name: drillName.trim(), kanjis: selectedKanjis, createdAt: Date.now() };
    const newStats = { ...stats, myDrills: [...(stats.myDrills || []), newDrill] };
    setStats(newStats); StorageAPI.saveStats(newStats); audioCtrl.playSE('success'); setView('myDrills');
  };

  const filtered = KANJI_DATA.filter(k => filterGrade === 0 || k.grade === filterGrade);

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('myDrills')} className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all"><ArrowLeft size={24} /></button>
          <h2 className="text-2xl font-black text-[var(--text)]">ドリルを{F("作","つく")}る</h2>
        </div>
        <input value={drillName} onChange={e => setDrillName(e.target.value)} placeholder="ドリルの名前を入力" className="w-full bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl px-4 py-3 font-bold text-[var(--text)] placeholder:opacity-40 focus:outline-none focus:border-[var(--primary)] text-lg" />
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {[0, 1, 2, 3, 4, 5, 6].map(g => (<button key={g} onClick={() => setFilterGrade(g)} className={`px-3 py-1.5 rounded-full text-sm font-black whitespace-nowrap border-[2px] transition-all ${filterGrade === g ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--panel)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>{g === 0 ? 'すべて' : <>{g}{F("年","ねん")}</>}</button>))}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar -mx-1 px-1">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 pb-2">
          {filtered.map(k => {
            const sel = selectedKanjis.includes(k.id);
            return (
              <button key={k.id} onClick={() => toggleKanji(k.id)} className={`py-3 rounded-xl border-[3px] font-black text-2xl transition-all ${sel ? 'bg-[var(--primary)] text-[var(--panel)] border-[var(--primary)] scale-105 shadow-md' : 'bg-[var(--panel)] text-[var(--text)] border-[var(--text)] opacity-70 hover:opacity-100'}`} style={{ fontFamily: "'Klee One', serif" }}>
                {k.char}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-shrink-0 flex flex-col gap-2">
        <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl p-3 flex items-center justify-between">
          <span className="font-bold text-[var(--text)] flex-shrink-0">{selectedKanjis.length}{F("文字","もじ")} {F("選択中","せんたくちゅう")}</span>
          {selectedKanjis.length > 0 && <div className="flex gap-1 overflow-x-auto no-scrollbar ml-2 min-w-0">{selectedKanjis.slice(0, 6).map(id => { const k = KANJI_DATA.find(k => k.id === id); return k ? <span key={id} className="text-xl font-black">{k.char}</span> : null; })}{selectedKanjis.length > 6 && <span className="text-sm font-bold opacity-60 self-end">+{selectedKanjis.length - 6}</span>}</div>}
        </div>
        <MotionButton variant="primary" onClick={handleSave} disabled={!drillName.trim() || selectedKanjis.length === 0} className="w-full py-4 text-xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239]">{F("保存","ほぞん")}する</MotionButton>
      </div>
    </div>
  );
};

export default DrillEditorView;
