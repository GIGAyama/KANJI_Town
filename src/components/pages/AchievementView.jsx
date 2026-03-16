import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Medal, Trophy, Gift, Lock, Coins, ArrowLeft, Check } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../../data/achievements';
import { TOWN_ITEMS } from '../../data/town-items';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';

const AchievementView = ({ setView, stats, setStats }) => {
  const [activeCategory, setActiveCategory] = useState('study');

  const handleClaim = (achievement) => {
    const current = stats.achievements?.[achievement.id];
    if (!current || current.claimed || current.current < achievement.target) return;
    const newStats = { ...stats, coins: stats.coins + achievement.reward, achievements: { ...stats.achievements, [achievement.id]: { ...current, claimed: true } } };
    if (achievement.rewardItem) newStats.townItems = { ...newStats.townItems, [achievement.rewardItem]: (newStats.townItems?.[achievement.rewardItem] || 0) + 1 };
    setStats(newStats); StorageAPI.saveStats(newStats); audioCtrl.playSE('chest_open');
  };

  const categories = Object.entries(ACHIEVEMENT_CATEGORIES).sort((a, b) => a[1].order - b[1].order);
  const filtered = ACHIEVEMENTS.filter(a => a.category === activeCategory);

  // 達成率
  const totalCount = ACHIEVEMENTS.length;
  const claimedCount = ACHIEVEMENTS.filter(a => stats.achievements?.[a.id]?.claimed).length;
  const completedCount = ACHIEVEMENTS.filter(a => (stats.achievements?.[a.id]?.current || 0) >= a.target).length;

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('home')} className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all"><ArrowLeft size={24} /></button>
        <div className="flex-1">
          <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2"><Medal size={24} className="text-amber-500" /> 実績</h2>
          <div className="text-xs text-[var(--text)] opacity-50">{claimedCount}/{totalCount} 達成 ({completedCount}個受取可能)</div>
        </div>
      </div>

      {/* 達成率バー */}
      <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden border border-gray-300">
        <motion.div animate={{ width: `${(claimedCount / totalCount) * 100}%` }} className="h-full rounded-full bg-amber-400" />
      </div>

      {/* カテゴリタブ */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map(([key, cat]) => {
          const catAchievements = ACHIEVEMENTS.filter(a => a.category === key);
          const catClaimed = catAchievements.filter(a => stats.achievements?.[a.id]?.claimed).length;
          const isActive = activeCategory === key;
          return (
            <button
              key={key}
              onClick={() => { audioCtrl.playSE('click'); setActiveCategory(key); }}
              className={`shrink-0 px-3 py-2 rounded-xl border-[2px] text-xs font-black transition-all flex items-center gap-1 ${
                isActive ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {cat.emoji} {cat.name}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-[var(--panel)] text-[var(--text)]' : 'bg-[var(--text)]/10'}`}>
                {catClaimed}/{catAchievements.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* 実績リスト */}
      <div className="flex flex-col gap-3">
        {filtered.map(a => {
          const progress = stats.achievements?.[a.id] || { claimed: false, current: 0 };
          const pct = Math.min((progress.current / a.target) * 100, 100);
          const canClaim = progress.current >= a.target && !progress.claimed;
          const rewardItemDef = a.rewardItem ? TOWN_ITEMS.find(i => i.id === a.rewardItem) : null;

          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-[var(--panel)] border-[4px] rounded-2xl p-4 shadow-sm transition-all ${canClaim ? 'border-amber-400 shadow-[4px_4px_0_#b45309]' : progress.claimed ? 'border-emerald-400 opacity-70' : 'border-[var(--text)]'}`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {progress.claimed ? <Trophy size={18} className="text-emerald-500 shrink-0" /> : canClaim ? <Gift size={18} className="text-amber-500 shrink-0" /> : <Lock size={18} className="text-[var(--text)] opacity-30 shrink-0" />}
                    <span className="font-black text-[var(--text)]">{a.name}</span>
                  </div>
                  <p className="text-xs text-[var(--text)] opacity-60 mb-2">{a.desc}</p>
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden border border-gray-300">
                    <motion.div animate={{ width: `${pct}%` }} className={`h-full rounded-full ${progress.claimed ? 'bg-emerald-400' : canClaim ? 'bg-amber-400' : 'bg-[var(--secondary)]'}`} />
                  </div>
                  <div className="text-xs font-bold text-[var(--text)] opacity-50 mt-1">{progress.current} / {a.target}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-xs font-black text-amber-600"><Coins size={12} />{a.reward}</div>
                  {rewardItemDef && <div className={`w-10 h-10 ${rewardItemDef.bg} rounded-lg border-2 border-[var(--text)] flex items-center justify-center`}><rewardItemDef.svg /></div>}
                  {canClaim && (<MotionButton variant="accent" onClick={() => handleClaim(a)} className="px-3 py-1.5 text-xs border-[2px] border-[var(--text)] shadow-[0_2px_0_#b45309] mt-1">うけとる！</MotionButton>)}
                  {progress.claimed && <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-300">受取済</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementView;
