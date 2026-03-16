// デイリーミッションパネル — マイ漢字タウン（Phase 7）
// HomeView に表示する今日のミッション進捗
import React from 'react';
import { motion } from 'framer-motion';
import { Target, Check, Coins } from 'lucide-react';
import MotionButton from '../ui/MotionButton';

const MISSION_ICONS = {
  review: '📖',
  perfect: '💮',
  craft: '🔨',
  session: '✏️',
  place: '🏠',
  exp: '⚡',
  new_kanji: '🆕',
};

const DailyMissionsPanel = ({ missions, onClaim }) => {
  if (!missions || missions.length === 0) return null;

  const allDone = missions.every(m => m.claimed);

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-[16px] p-3 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-2">
        <Target size={16} className="text-[var(--primary)]" />
        <span className="text-sm font-black text-[var(--text)]">今日のミッション</span>
        {allDone && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-300">達成！</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        {missions.map((m, i) => {
          const pct = Math.min(((m.current || 0) / m.target) * 100, 100);
          const canClaim = (m.current || 0) >= m.target && !m.claimed;

          return (
            <div
              key={m.id}
              className={`flex items-center gap-2 bg-[var(--bg)] rounded-xl px-3 py-2 border-[2px] transition-all ${
                m.claimed ? 'border-emerald-300 opacity-60' : canClaim ? 'border-amber-400' : 'border-transparent'
              }`}
            >
              <span className="text-lg shrink-0">{MISSION_ICONS[m.type] || '📋'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-[var(--text)] truncate">{m.name}</span>
                  <span className="text-[10px] text-[var(--text)] opacity-50 shrink-0">
                    {m.current || 0}/{m.target}
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-0.5">
                  <div
                    className={`h-full rounded-full transition-all ${m.claimed ? 'bg-emerald-400' : canClaim ? 'bg-amber-400' : 'bg-[var(--secondary)]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {canClaim && (
                <button
                  onClick={() => onClaim(m)}
                  className="shrink-0 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-1 rounded-lg border-2 border-amber-600 shadow-[0_1px_0_#92400e] active:shadow-none active:translate-y-[1px] transition-all"
                >
                  <Coins size={10} className="inline mr-0.5" />{m.reward}
                </button>
              )}
              {m.claimed && <Check size={14} className="shrink-0 text-emerald-500" />}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DailyMissionsPanel;
