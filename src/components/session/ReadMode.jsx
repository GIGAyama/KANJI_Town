import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ChevronRight } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import ModeLayout from '../ui/ModeLayout';
import { FormatKun, RubyText } from '../ui/FormatKun';
import { audioCtrl } from '../../systems/audio';

const ReadMode = ({ kanji, onNext, commonSidebar }) => {
  const [exampleIdx, setExampleIdx] = useState(Math.floor(Math.random() * kanji.examples.length));
  const main = (<div className="text-[12rem] md:text-[18rem] lg:text-[22rem] leading-none font-black text-[var(--text)] drop-shadow-md select-none" style={{ fontFamily: "'Klee One', serif" }}>{kanji.char}</div>);
  const handleNextExample = () => { setExampleIdx((prev) => (prev + 1) % kanji.examples.length); audioCtrl.playSE('click'); };
  const sidebar = (
    <>
      {commonSidebar}
      <div className="flex flex-col gap-4 bg-[var(--panel)] p-4 rounded-2xl border-[4px] border-[var(--text)] shadow-[4px_4px_0_var(--text)] mt-4">
        <div className="bg-[var(--accent)] text-[var(--text)] px-4 py-1.5 rounded-full text-sm font-black border-[3px] border-[var(--text)] text-center shadow-sm -mt-8 mx-auto w-max">声にだそう！</div>
        <div className="relative min-h-[80px] flex items-center justify-center">
          <AnimatePresence mode="wait"><motion.p key={exampleIdx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="ruby-text text-xl md:text-2xl font-bold text-[var(--text)] text-center py-2"><RubyText text={kanji.examples[exampleIdx]} /></motion.p></AnimatePresence>
          {kanji.examples.length > 1 && (<button onClick={handleNextExample} className="absolute -right-2 top-1/2 -translate-y-1/2 bg-[var(--bg)] border-2 border-[var(--text)] rounded-full p-1 hover:bg-[var(--text)] hover:text-white transition-colors shadow-sm"><ChevronRight size={20} /></button>)}
        </div>
        {kanji.examples.length > 1 && (<div className="flex justify-center gap-1.5">{kanji.examples.map((_, i) => (<div key={i} className={`w-2 h-2 rounded-full border border-[var(--text)] ${i === exampleIdx ? 'bg-[var(--text)]' : 'bg-transparent'}`} />))}</div>)}
      </div>
      <div className="flex flex-col gap-3 mt-4">
        <div className="bg-[var(--panel)] rounded-xl px-4 py-3 border-[3px] border-[var(--text)] shadow-sm flex items-start justify-between gap-4">
          <span className="text-sm font-bold text-[var(--primary)] bg-[var(--bg)] px-3 py-1 rounded-lg border-2 border-[var(--primary)] shrink-0">音</span>
          <div className="flex flex-wrap gap-1.5 justify-end">{kanji.on.length > 0 ? kanji.on.map((o, i) => (<span key={i} className="font-black text-xl text-[var(--text)] bg-gray-100 px-2 py-0.5 rounded-md border border-gray-300">{o}</span>)) : <span className="font-black text-xl text-gray-400">-</span>}</div>
        </div>
        <div className="bg-[var(--panel)] rounded-xl px-4 py-3 border-[3px] border-[var(--text)] shadow-sm flex items-start justify-between gap-4">
          <span className="text-sm font-bold text-[var(--secondary)] bg-[var(--bg)] px-3 py-1 rounded-lg border-2 border-[var(--secondary)] shrink-0">訓</span>
          <div className="flex flex-wrap gap-1.5 justify-end">{kanji.kun.length > 0 ? kanji.kun.map((k, i) => (<span key={i} className="font-black text-xl text-[var(--text)] bg-gray-100 px-2 py-0.5 rounded-md border border-gray-300"><FormatKun text={k} /></span>)) : <span className="font-black text-xl text-gray-400">-</span>}</div>
        </div>
      </div>
      <div className="mt-auto pt-4 pb-2"><MotionButton variant="primary" onClick={onNext} className="w-full py-6 text-2xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239]">書き順をみる <ChevronRight size={28} /></MotionButton></div>
    </>
  );
  return <ModeLayout mainContent={main} sidebarContent={sidebar} />;
};

export default ReadMode;
