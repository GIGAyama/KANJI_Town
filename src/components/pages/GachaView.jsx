import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Coins, ArrowLeft, RefreshCw, X, Gift, Check } from 'lucide-react';
import { MotionButton } from '../ui';
import { TOWN_ITEMS } from '../../data/town-items';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { gachaRoll, bulkGachaRoll, isRareItem } from '../../systems/gacha';
import { F } from '../ui/FormatKun';

const GachaView = ({ stats, setStats, onBack }) => {
  const [phase, setPhase] = useState('idle'); // 'idle', 'spinning', 'reveal'
  const [results, setResults] = useState([]);
  const [skipAnimation, setSkipAnimation] = useState(false);

  const handleRoll = useCallback((count) => {
    const cost = count * 100;
    if ((stats.coins || 0) < cost) {
      audioCtrl.playSE('stamp_bad');
      return;
    }

    audioCtrl.playSE('gacha');
    
    if (skipAnimation) {
      const newResults = count === 1 ? [gachaRoll()] : bulkGachaRoll(count);
      finalizeRoll(newResults, cost);
    } else {
      setPhase('spinning');
      setTimeout(() => {
        const newResults = count === 1 ? [gachaRoll()] : bulkGachaRoll(count);
        finalizeRoll(newResults, cost);
      }, count === 1 ? 1200 : 2000);
    }
  }, [stats.coins, skipAnimation]);

  const finalizeRoll = (newResults, cost) => {
    const hasRare = newResults.some(id => isRareItem(id));
    audioCtrl.playSE(hasRare ? 'rare' : 'chest_open');

    // Update stats
    const newTownItems = { ...(stats.townItems || {}) };
    newResults.forEach(id => {
      newTownItems[id] = (newTownItems[id] || 0) + 1;
    });

    const newStats = {
      ...stats,
      coins: Math.max(0, (stats.coins || 0) - cost),
      townItems: newTownItems
    };

    setStats(newStats);
    StorageAPI.saveStats(newStats);
    setResults(newResults);
    setPhase('reveal');
  };

  const reset = () => {
    setPhase('idle');
    setResults([]);
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors"
        >
          <ArrowLeft size={24} className="text-[var(--text)]" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2">
            <Sparkles className="text-amber-500" /> まちのガチャ
          </h2>
          <div className="text-xs font-bold text-[var(--text)] opacity-40">レアアイテムをゲットしよう！</div>
        </div>
        <div className="bg-[var(--accent)] px-4 py-1.5 rounded-full border-[3px] border-[var(--text)] font-black flex items-center gap-1.5 shadow-sm text-sm">
          <Coins size={16} /> {stats.coins}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-grow flex flex-col items-center justify-center min-h-[400px]">
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full space-y-8"
            >
              {/* Machine visual */}
              <div className="relative w-48 h-48 mx-auto">
                <div className="absolute inset-0 bg-[var(--primary)] rounded-full border-[6px] border-[var(--text)] shadow-[0_8px_0_var(--text)] flex items-center justify-center">
                  <div className="text-6xl">🎰</div>
                </div>
                <div className="absolute -bottom-2 right-0 w-16 h-16 bg-[var(--accent)] rounded-2xl border-[4px] border-[var(--text)] flex items-center justify-center text-2xl animate-bounce">
                  ✨
                </div>
              </div>

              {/* Controls */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <MotionButton 
                    variant="accent" 
                    onClick={() => handleRoll(1)}
                    disabled={(stats.coins || 0) < 100}
                    className="py-6 flex-col gap-2 border-[4px] border-[var(--text)] shadow-[0_4px_0_#b45309]"
                  >
                    <div className="text-2xl font-black">1回</div>
                    <div className="text-sm font-bold opacity-80 flex items-center gap-1">
                      <Coins size={14} /> 100
                    </div>
                  </MotionButton>
                  <MotionButton 
                    variant="primary" 
                    onClick={() => handleRoll(10)}
                    disabled={(stats.coins || 0) < 1000}
                    className="py-6 flex-col gap-2 border-[4px] border-[var(--text)] shadow-[0_4px_0_#9f1239]"
                  >
                    <div className="text-2xl font-black">10連</div>
                    <div className="text-sm font-bold opacity-80 flex items-center gap-1">
                      <Coins size={14} /> 1000
                    </div>
                  </MotionButton>
                </div>

                {/* Skip Animation Toggle */}
                <label className="flex items-center justify-center gap-2 cursor-pointer group py-2">
                  <div className={`w-6 h-6 rounded-md border-[3px] border-[var(--text)] flex items-center justify-center transition-colors ${skipAnimation ? 'bg-[var(--secondary)]' : 'bg-white'}`}>
                    {skipAnimation && <Check size={16} className="text-white" strokeWidth={4} />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={skipAnimation}
                    onChange={() => setSkipAnimation(!skipAnimation)}
                  />
                  <span className="text-sm font-black text-[var(--text)] opacity-60 group-hover:opacity-100 transition-opacity">演出をスキップする</span>
                </label>
              </div>
            </motion.div>
          )}

          {phase === 'spinning' && (
            <motion.div 
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="relative">
                <motion.div 
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { repeat: Infinity, duration: 0.5, ease: 'linear' },
                    scale: { repeat: Infinity, duration: 1 }
                  }}
                  className="text-8xl mb-8"
                >
                  🎭
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-32 h-32 border-8 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
              <div className="text-2xl font-black text-[var(--text)] mt-4 tracking-widest">{F("抽選中","ちゅうせんちゅう")}...</div>
            </motion.div>
          )}

          {phase === 'reveal' && (
            <motion.div 
              key="reveal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-[var(--text)] mb-1">ガチャの結果</h3>
                <div className="text-sm font-bold text-[var(--text)] opacity-40">{results.length}個のアイテムを獲得しました</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
                {results.map((id, index) => {
                  const item = TOWN_ITEMS.find(i => i.id === id);
                  const isRare = isRareItem(id);
                  return (
                    <motion.div 
                      key={index}
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        type: 'spring', 
                        damping: 15, 
                        delay: skipAnimation ? 0 : index * 0.1 
                      }}
                      className={`relative aspect-square rounded-2xl border-[3px] border-[var(--text)] flex items-center justify-center shadow-sm overflow-hidden ${item?.bg || 'bg-white'}`}
                    >
                      {item && <item.svg />}
                      {id === 't_kakejiku' && stats.kakejiku && (
                         <img src={stats.kakejiku} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="" />
                      )}
                      {isRare && (
                        <div className="absolute top-0 right-0 bg-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded-bl-lg border-l-2 border-b-2 border-[var(--text)]">RARE</div>
                      )}
                      
                      <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors" />
                    </motion.div>
                  )
                })}
              </div>

              <div className="flex gap-4">
                <MotionButton 
                  variant="secondary" 
                  onClick={reset}
                  className="flex-1 py-4 text-lg border-[3px] border-[var(--text)] shadow-[0_4px_0_var(--text)]"
                >
                  <RefreshCw size={20} className="mr-2" /> もう一度
                </MotionButton>
                <MotionButton 
                  variant="primary" 
                  onClick={onBack}
                  className="flex-1 py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#9f1239]"
                >
                  <ArrowLeft size={20} className="mr-2" /> もどる
                </MotionButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      {phase === 'idle' && (
        <div className="mt-8 bg-[var(--bg)] rounded-2xl p-4 border-[2px] border-[var(--text)] opacity-60">
          <div className="text-xs font-black mb-2 flex items-center gap-1 opacity-80">
            <Check size={14} className="text-[var(--secondary)]" /> アイテムは「まちづくり」で設置できます。
          </div>
          <div className="text-xs font-black flex items-center gap-1 opacity-80">
            <Check size={14} className="text-[var(--secondary)]" /> 学習を頑張ってコインを貯めよう！
          </div>
        </div>
      )}
    </div>
  );
};

export default GachaView;
