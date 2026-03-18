import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Coins, Map, ChevronRight } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import AnimatedCounter from '../ui/AnimatedCounter';
import Confetti from '../ui/Confetti';
import { TOWN_ITEMS, SvgVillager } from '../../data/town-items';
import { GACHA_POOL } from '../../data/gacha-pool';
import { STORY_STAGES } from '../../data/story-stages';
import { StorageAPI } from '../../systems/storage';
import { F } from '../ui/FormatKun';
import { audioCtrl } from '../../systems/audio';
import { getOccupation } from '../../data/residents';
import { getLevelInfoFromExp } from '../../utils/level-system';

const gachaRoll = () => {
  const totalWeight = GACHA_POOL.reduce((s, t) => s + t.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const tier of GACHA_POOL) { rand -= tier.weight; if (rand <= 0) return tier.items[Math.floor(Math.random() * tier.items.length)]; }
  return GACHA_POOL[0].items[0];
};

const ResultView = ({ sessionMetrics, oldExp, setView, stats, setStats }) => {
  const { earnedExp, perfectCount, unlockedItems, rareDrop, newVillager, levelUpData } = sessionMetrics;
  const [showConfetti, setShowConfetti] = useState(earnedExp > 20 || !!newVillager || levelUpData?.isLevelUp);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [gachaResult, setGachaResult] = useState(null);
  const [gachaPhase, setGachaPhase] = useState('idle');
  const coinBonus = Math.floor(earnedExp / 4);

  const oldLevelInfo = getLevelInfoFromExp(oldExp);
  const newLevelInfo = getLevelInfoFromExp(oldExp + earnedExp);

  const masteredCount = Object.values(stats.kanjiStats || {}).filter(s => s.status === 'mastered').length;
  const currentStage = STORY_STAGES.slice().reverse().find(s => masteredCount >= s.minKanji && (stats.population || 0) >= s.minPop) || STORY_STAGES[0];
  const nextStage = STORY_STAGES.find(s => s.id === currentStage.id + 1);

  useEffect(() => {
    if (showConfetti) {
      audioCtrl.playSE(newVillager ? 'rare' : 'chest_open');
      setTimeout(() => setShowConfetti(false), 3000);
    }
    if (levelUpData?.isLevelUp) {
      setTimeout(() => setShowLevelUpModal(true), 1500);
    }
  }, []);

  const unlockedItemDefs = (unlockedItems || []).map(id => TOWN_ITEMS.find(i => i.id === id)).filter(Boolean);
  const rareItemDef = rareDrop ? TOWN_ITEMS.find(i => i.id === rareDrop) : null;

  const handleGacha = () => {
    if ((stats.coins || 0) < 100) { audioCtrl.playSE('stamp_bad'); return; }
    audioCtrl.playSE('gacha'); setGachaPhase('spinning');
    const result = gachaRoll();
    setTimeout(() => {
      setGachaResult(result); setGachaPhase('reveal');
      const isRare = GACHA_POOL.findIndex(t => t.items.includes(result)) >= 3;
      audioCtrl.playSE(isRare ? 'rare' : 'chest_open');
      const newStats = { ...stats, coins: Math.max(0, (stats.coins || 0) - 100), townItems: { ...stats.townItems, [result]: (stats.townItems?.[result] || 0) + 1 } };
      setStats(newStats); StorageAPI.saveStats(newStats);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-4 pb-8 pt-2">
      <Confetti active={showConfetti || showLevelUpModal} />

      {/* レベルアップモーダル */}
      <AnimatePresence>
        {showLevelUpModal && levelUpData && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--panel)] w-full max-w-sm rounded-3xl border-[4px] border-[var(--primary)] shadow-[0_8px_0_var(--primary)] overflow-hidden">
              <div className="bg-[var(--primary)] text-white text-center py-4 relative">
                <div className="text-3xl font-black tracking-widest">{F("昇","しょう")}{F("格","かく")}！</div>
                <div className="absolute top-0 right-0 left-0 bottom-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0iI2ZmZiI+PHBhdGggZD0iTTExIDEwaDJ2NGgtem0wLThoMnY0aC0yem0wIDEyaDJ2NGgtMnpNNCAxMHYyaDQtMnYtem0tNCAwaDJ2Mkgwem0xNiAwaDZWMTBoLTZ6Ii8+PC9zdmc+')] bg-repeat" />
              </div>
              <div className="p-6 text-center">
                <div className="text-[var(--text)] font-bold mb-1">レベルが上がった！</div>
                <div className="flex items-center justify-center gap-3 my-4">
                  <div className="text-4xl font-black text-gray-400">Lv.{levelUpData.oldLevel}</div>
                  <ChevronRight size={32} className="text-[var(--primary)]" />
                  <div className="text-6xl font-black text-[var(--accent)] drop-shadow-md">Lv.{levelUpData.newLevel}</div>
                </div>
                <div className="bg-[var(--bg)] rounded-xl p-3 border-2 border-[var(--text)] text-left mb-6">
                  <div className="text-sm font-black mb-2 text-center text-[var(--text)] opacity-80 border-b-2 border-dashed border-[var(--text)] pb-2">ごほうび</div>
                  <ul className="space-y-2">
                    {levelUpData.rewards.map((r, i) => r.reward && (
                      <motion.li key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.5 + (i*0.2) }} className="flex items-start gap-2 text-sm font-bold text-[var(--text)]">
                        <span className="shrink-0 text-[var(--primary)]">🎁</span> {r.reward.text || 'アイテム解放！'}
                      </motion.li>
                    ))}
                  </ul>
                </div>
                <MotionButton variant="primary" onClick={() => setShowLevelUpModal(false)} className="w-full py-4 text-xl border-[4px] border-[var(--text)] shadow-[0_4px_0_#9f1239]">
                  やったー！ 🎉
                </MotionButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 新EXPゲージ（ストーリーナレーションの前に配置） */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)] relative overflow-hidden">
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-[var(--text)] opacity-60">プレイヤー</span>
            <span className="text-3xl font-black text-[var(--primary)]">Lv.{newLevelInfo.level}</span>
          </div>
          <div className="text-sm font-bold text-[var(--text)] opacity-60">
            +{earnedExp} EXP
          </div>
        </div>
        
        {/* レベルゲージ */}
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-[var(--text)] relative">
          <motion.div 
            initial={{ width: `${oldLevelInfo.progress}%` }} 
            animate={{ width: `${newLevelInfo.progress}%` }} 
            transition={{ duration: 1.5, ease: "easeOut" }} 
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-yellow-400 to-[var(--accent)]" 
          />
        </div>
        {!newLevelInfo.isMaxLevel && (
          <div className="text-xs font-bold text-right text-[var(--text)] opacity-50 mt-1">
            {F("次","つぎ")}の報酬まで あと {newLevelInfo.remainingExp} EXP
          </div>
        )}
      </motion.div>

      {/* ストーリーナレーション */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)] text-center">
        <div className="text-4xl mb-1">{currentStage.emoji}</div>
        <div className="font-black text-[var(--primary)] text-lg">{currentStage.title}</div>
        <p className="text-xs text-[var(--text)] opacity-60 mt-1 leading-relaxed">{currentStage.desc}</p>
        {nextStage && (
          <div className="mt-2 text-[10px] text-[var(--text)] opacity-40 bg-[var(--bg)] rounded-lg px-2 py-1">
            {F("次","つぎ")}のステージまで：{F("漢字","かんじ")}{Math.max(0, nextStage.minKanji - masteredCount)}{F("文字","もじ")} / {F("人口","じんこう")}{Math.max(0, nextStage.minPop - (stats.population || 0))}{F("人","にん")}
          </div>
        )}
      </motion.div>

      {/* 住民誕生 */}
      {newVillager && (
        <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          className="bg-emerald-50 border-[4px] border-emerald-400 rounded-2xl p-4 shadow-[4px_4px_0_#059669] flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 bg-emerald-100 rounded-2xl flex items-center justify-center border-[3px] border-emerald-400">
            <SvgVillager />
          </div>
          <div className="flex-1">
            <div className="font-black text-emerald-700 text-base">🎉 {F("新","あたら")}しい{F("住民","じゅうみん")}が{F("誕生","たんじょう")}！</div>
            <div className="text-sm text-emerald-600 mt-0.5">
              「<span className="font-black text-xl" style={{ fontFamily: "'Klee One',serif" }}>{newVillager.kanjiChar}</span>」を{F("習得","しゅうとく")}した{F("住民","じゅうみん")}が{F("街","まち")}にやってきた！
            </div>
            <div className="text-xs text-emerald-500 mt-1 flex items-center gap-2">
              <span>{F("現在","げんざい")}の{F("人口","じんこう")}：{stats.population || 0}{F("人","にん")}</span>
              <span className="bg-emerald-200 px-2 py-0.5 rounded-full font-black">{getOccupation(newVillager.occupation).emoji} {getOccupation(newVillager.occupation).name}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* EXP・コイン・Perfect */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: <>{F("獲得","かくとく")}EXP</>, value: earnedExp, icon: '⚡', color: 'bg-amber-50 border-amber-300' },
          { label: 'まちコイン', value: coinBonus, icon: '🪙', color: 'bg-yellow-50 border-yellow-300', prefix: '+' },
          { label: 'Perfect', value: perfectCount, icon: '💮', color: 'bg-rose-50 border-rose-300' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
            className={`${stat.color} rounded-2xl border-[3px] p-3 text-center shadow-sm`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-black text-[var(--text)]">{stat.prefix}<AnimatedCounter target={stat.value} duration={1000} /></div>
            <div className="text-xs font-bold text-[var(--text)] opacity-60">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* 解放アイテム */}
      {(unlockedItemDefs.length > 0 || rareItemDef) && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
          className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)]">
          <div className="text-sm font-black text-center mb-3 flex items-center justify-center gap-2">
            <Gift size={18} className="text-[var(--primary)]" /> まちのアイテムをゲット！
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {[...unlockedItemDefs, ...(rareItemDef ? [rareItemDef] : [])].map((item, i) => (
              <motion.div key={i} initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.6 + i * 0.1 }}
                className={`${item.bg} w-16 h-16 rounded-xl border-[3px] border-[var(--text)] shadow-sm relative overflow-hidden flex items-center justify-center`}>
                <item.svg />
                {rareItemDef && item.id === rareItemDef.id && <div className="absolute top-0 right-0 text-[8px] font-black bg-yellow-400 text-yellow-900 px-1 rounded-bl-lg">RARE</div>}
              </motion.div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 justify-center mt-2">
            {[...unlockedItemDefs, ...(rareItemDef ? [rareItemDef] : [])].map((item, i) => (
              <span key={i} className="text-xs font-bold text-[var(--text)] opacity-60 bg-[var(--bg)] px-2 py-0.5 rounded-full">{item.name}</span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ガチャ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)]">
        <div className="text-sm font-black text-center mb-3 flex items-center justify-center gap-2">
          <Sparkles size={18} className="text-amber-500" /> まちのガチャ
        </div>
        {gachaPhase === 'idle' && (
          <div>
            <MotionButton variant="accent" onClick={handleGacha} disabled={(stats.coins || 0) < 100}
              className="w-full py-4 text-lg border-[3px] border-[var(--text)] shadow-[0_3px_0_#b45309]">
              <Coins size={18} /> 100コインでひく
            </MotionButton>
            {(stats.coins || 0) < 100 && <p className="text-xs text-center text-[var(--text)] opacity-40 mt-2">コインが{F("足","た")}りません（{F("現在","げんざい")} {stats.coins || 0}{F("枚","まい")}）</p>}
          </div>
        )}
        {gachaPhase === 'spinning' && (
          <div className="text-center py-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.4, ease: 'linear' }} className="text-4xl inline-block">🎲</motion.div>
            <div className="text-sm font-bold text-[var(--text)] opacity-60 mt-2">ひいています...</div>
          </div>
        )}
        {gachaPhase === 'reveal' && gachaResult && (() => {
          const item = TOWN_ITEMS.find(i => i.id === gachaResult);
          const isRare = GACHA_POOL.findIndex(t => t.items.includes(gachaResult)) >= 3;
          return (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }} className="flex flex-col items-center gap-2">
              {isRare && <div className="text-xs font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-full border-2 border-amber-400 animate-pulse">✨ レアアイテム！</div>}
              <div className={`w-20 h-20 ${item?.bg || 'bg-gray-100'} rounded-2xl border-[3px] border-[var(--text)] shadow-lg flex items-center justify-center`}>
                {item && <item.svg />}
              </div>
              <div className="font-black text-[var(--text)]">{item?.name}</div>
              <MotionButton variant="secondary" onClick={() => setGachaPhase('idle')} className="px-4 py-2 text-sm border-[2px] border-[var(--text)] shadow-sm mt-1">もう一度ひく</MotionButton>
            </motion.div>
          );
        })()}
      </motion.div>

      {/* ボタン */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-col gap-3">
        <MotionButton variant="primary" onClick={() => setView('home')} className="w-full py-6 text-2xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239]">まちに もどる 🏠</MotionButton>
        <MotionButton variant="secondary" onClick={() => setView('townEditor')} className="w-full py-4 text-lg border-[3px] border-[var(--text)] shadow-[0_4px_0_var(--text)]">
          <Map size={20} /> まちをつくる
        </MotionButton>
      </motion.div>
    </div>
  );
};

export default ResultView;
