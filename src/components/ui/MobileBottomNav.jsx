import React from 'react';
import { motion } from 'framer-motion';
import { Library, Medal, BarChart3, Sparkles, Hammer, Map } from 'lucide-react';
import { audioCtrl } from '../../systems/audio';
import { F } from './FormatKun';

/**
 * モバイル専用ボトムナビゲーション
 * スマートフォンで主要画面へのアクセスを提供する
 */
const MobileBottomNav = ({ setView, currentView, isCraftUnlocked, isTownEditorUnlocked }) => {
  const navItems = [
    { key: 'townEditor', icon: Map, label: 'まち', color: 'text-[var(--accent)]', locked: !isTownEditorUnlocked },
    { key: 'dictionary', icon: Library, label: F("図鑑", "ずかん"), color: 'text-[var(--secondary)]' },
    { key: 'gacha', icon: Sparkles, label: 'ガチャ', color: 'text-amber-500' },
    { key: 'achievements', icon: Medal, label: F("実績", "じっせき"), color: 'text-amber-500' },
    { key: 'stats', icon: BarChart3, label: F("記録", "きろく"), color: 'text-[var(--secondary)]' },
  ];

  return (
    <nav
      className="md:hidden flex-shrink-0 bg-[var(--panel)]/95 backdrop-blur-sm border-t-[3px] border-[var(--text)] z-50 safe-area-bottom"
      aria-label="メインナビゲーション"
    >
      <div className="flex justify-around items-center h-14 px-1">
        {navItems.map(({ key, icon: Icon, label, color, locked }) => {
          const isActive = currentView === key;
          return (
            <motion.button
              key={key}
              whileTap={!locked ? { scale: 0.9 } : {}}
              onClick={() => {
                if (locked) return;
                audioCtrl.playSE('click');
                setView(key);
              }}
              disabled={locked}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-[56px] touch-manipulation
                ${locked ? 'opacity-30' : ''}
                ${isActive ? 'bg-[var(--bg)] scale-105' : 'opacity-70 hover:opacity-100'}
              `}
              aria-label={typeof label === 'string' ? label : key}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} className={isActive ? color : 'text-[var(--text)]'} />
              <span className={`text-[10px] font-bold leading-none ${isActive ? 'text-[var(--text)]' : 'text-[var(--text)] opacity-60'}`}>
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
