import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Library, ArrowLeft } from 'lucide-react';
import { KANJI_DATA } from '../../data/kanji-data';
import { audioCtrl } from '../../systems/audio';

const DictionaryView = ({ kanjiStats, onBack, onSelectKanji }) => {
  const [search, setSearch] = useState(''); const [filterGrade, setFilterGrade] = useState(0);
  const filtered = KANJI_DATA.filter(k => {
    const matchGrade = filterGrade === 0 || k.grade === filterGrade;
    const matchSearch = search === '' || k.char.includes(search) || k.on.some(o => o.includes(search.toUpperCase())) || k.kun.some(ku => ku.includes(search));
    return matchGrade && matchSearch;
  });
  const getStatusColor = (id) => { const s = kanjiStats?.[id]?.status; if (s === 'mastered') return 'bg-emerald-100 border-emerald-400'; if (s === 'review') return 'bg-violet-100 border-violet-400'; if (s === 'learning') return 'bg-sky-100 border-sky-400'; return 'bg-gray-100 border-gray-300'; };
  const getStatusLabel = (id) => { const s = kanjiStats?.[id]?.status; if (s === 'mastered') return '習得'; if (s === 'review') return '復習中'; if (s === 'learning') return '学習中'; return '未学習'; };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2"><Library size={24} className="text-[var(--secondary)]" /> 漢字ずかん</h2>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 relative"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="漢字・読みで検索" className="w-full bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl px-4 py-2.5 font-bold text-[var(--text)] placeholder:opacity-40 focus:outline-none focus:border-[var(--primary)]" /></div>
      </div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {[0, 1, 2, 3, 4, 5, 6].map(g => (
          <button key={g} onClick={() => setFilterGrade(g)} className={`px-3 py-1.5 rounded-full text-sm font-black whitespace-nowrap border-[2px] transition-all ${filterGrade === g ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--panel)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>
            {g === 0 ? 'すべて' : `${g}年`}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {filtered.map(k => (
          <motion.button key={k.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { audioCtrl.playSE('click'); onSelectKanji(k); }} className={`${getStatusColor(k.id)} rounded-2xl border-[3px] p-3 flex flex-col items-center gap-1 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="text-4xl font-black text-[var(--text)]" style={{ fontFamily: "'Klee One', serif" }}>{k.char}</div>
            <div className="text-[10px] font-bold text-[var(--text)] opacity-60">{k.on[0] || k.kun[0] || ''}</div>
            <div className="text-[9px] font-black bg-white/70 px-2 py-0.5 rounded-full border border-current opacity-70">{getStatusLabel(k.id)}</div>
          </motion.button>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-[var(--text)] opacity-40 font-bold">見つかりませんでした</div>}
    </div>
  );
};

export default DictionaryView;
