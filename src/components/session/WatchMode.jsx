import React, { useState } from 'react';
import { RefreshCw, ChevronRight } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import ModeLayout from '../ui/ModeLayout';
import { F } from '../ui/FormatKun';

const WatchMode = ({ paths, strokeData, isLoading, onNext, canvasSize, commonSidebar }) => {
  const [key, setKey] = useState(0);
  const main = isLoading ? <div className="animate-pulse font-bold text-2xl text-[var(--text)] opacity-50">ロード中...</div> : (
    <div className="relative border-[4px] border-[var(--text)] rounded-[20px] bg-[var(--panel)] transition-all duration-200 shrink-0 shadow-[8px_8px_0_var(--text)]" style={{ width: canvasSize, maxWidth: '100%', maxHeight: '100%', aspectRatio: '1/1' }}>
      <div className="absolute top-0 left-1/2 w-0 h-full border-l-4 border-dashed border-[var(--text)] opacity-10 -translate-x-1/2" /><div className="absolute top-1/2 left-0 w-full h-0 border-t-4 border-dashed border-[var(--text)] opacity-10 -translate-y-1/2" />
      <svg viewBox="0 0 109 109" className="w-full h-full relative z-10" key={key}>
        {paths.map((d, i) => (
          <g key={i}>
            <path d={d} fill="none" stroke="var(--bg)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} fill="none" stroke="var(--text)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1000" strokeDashoffset="1000" style={{ animation: `drawStroke 1.2s ease-in-out forwards`, animationDelay: `${i * 1.2}s` }} />
            {strokeData[i] && (<g style={{ animation: `fadeIn 0.2s ease-in forwards`, animationDelay: `${i * 1.2}s`, opacity: 0 }}><circle cx={strokeData[i].s.x * 109} cy={strokeData[i].s.y * 109} r="5" fill="var(--panel)" stroke="var(--primary)" strokeWidth="2" /><text x={strokeData[i].s.x * 109} y={strokeData[i].s.y * 109 + 0.5} dominantBaseline="central" textAnchor="middle" fontSize="6" fontWeight="bold" fill="var(--primary)">{i + 1}</text></g>)}
          </g>
        ))}
      </svg>
      <style>{`@keyframes drawStroke { to { stroke-dashoffset: 0; } } @keyframes fadeIn { to { opacity: 1; } }`}</style>
    </div>
  );
  const sidebar = (
    <>
      {commonSidebar}
      <div className="bg-[var(--panel)] p-4 rounded-2xl border-[4px] border-[var(--text)] shadow-[4px_4px_0_var(--text)] text-center flex flex-col gap-2 mt-4">
        <div className="text-base font-black text-[var(--panel)] bg-[var(--secondary)] py-2 rounded-xl border-[3px] border-[var(--text)] shadow-sm mx-2">1{F("画","かく")}ずつ よく{F("見","み")}よう！</div>
        <p className="text-xs md:text-sm text-[var(--text)] font-bold opacity-70 px-2 mt-2 leading-relaxed">{F("正","ただ")}しい{F("書","か")}き{F("順","じゅん")}で{F("書","か")}くと、<br />{F("漢字","かんじ")}がきれいに{F("書","か")}けるようになるよ。</p>
      </div>
      <div className="mt-auto pt-4 flex flex-col gap-3 pb-2">
        <MotionButton variant="secondary" onClick={() => setKey(k => k + 1)} className="py-4 text-lg border-[3px] border-[var(--text)] shadow-[0_4px_0_var(--text)]"><RefreshCw size={20} /> もう{F("一度","いちど")}みる</MotionButton>
        <MotionButton variant="primary" onClick={onNext} className="w-full py-6 text-2xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239]">なぞり{F("書","が")}きへ <ChevronRight size={28} /></MotionButton>
      </div>
    </>
  );
  return <ModeLayout mainContent={main} sidebarContent={sidebar} />;
};

export default WatchMode;
