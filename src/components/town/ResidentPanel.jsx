import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Heart, Package, Coins, ChevronDown, ChevronUp } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { OCCUPATIONS, getOccupation } from '../../data/residents';
import { MATERIALS } from '../../data/materials';
import {
  calculateSatisfaction,
  getSatisfactionLabel,
  getSatisfactionMultiplier,
  getResidentStats,
  collectDailyResources,
} from '../../systems/residents';
import { audioCtrl } from '../../systems/audio';

const ResidentPanel = ({ stats, setView }) => {
  const [expandedOcc, setExpandedOcc] = useState(null);

  const satisfaction = useMemo(() => calculateSatisfaction(stats), [stats]);
  const satLabel = getSatisfactionLabel(satisfaction);
  const multiplier = getSatisfactionMultiplier(satisfaction);
  const residentStats = useMemo(() => getResidentStats(stats.villagers), [stats.villagers]);
  const dailyPreview = useMemo(() => collectDailyResources(stats), [stats]);

  const villagers = stats.villagers || [];

  return (
    <div className="flex flex-col h-full gap-3 p-4 overflow-y-auto no-scrollbar pb-8">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => { audioCtrl.playSE('click'); setView('home'); }} aria-label="ホームに戻る" className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-xl font-black text-[var(--text)] flex items-center gap-2">
          <Users size={20} className="text-[var(--primary)]" /> 住民のようす
        </h2>
      </div>

      {/* 概要カード */}
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] p-4 shadow-[4px_4px_0_var(--text)]">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-2xl font-black text-[var(--text)]">👥 {residentStats.total}人</div>
            <div className="text-xs text-[var(--text)] opacity-60">住民数</div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-2xl">{satLabel.emoji}</span>
              <span className="text-xl font-black" style={{ color: satLabel.color }}>{satisfaction}</span>
            </div>
            <div className="text-xs font-bold" style={{ color: satLabel.color }}>{satLabel.text}</div>
          </div>
        </div>

        {/* 満足度バー */}
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-[var(--text)] mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${satisfaction}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: satLabel.color }}
          />
        </div>
        <div className="text-[10px] text-[var(--text)] opacity-50 text-center">
          収集効率: ×{multiplier.toFixed(1)} {multiplier >= 1.2 ? '↑' : multiplier < 1.0 ? '↓' : ''}
        </div>
      </div>

      {/* 毎日の収集予定 */}
      {residentStats.total > 0 && (
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] p-4 shadow-[2px_2px_0_var(--text)]">
          <h3 className="text-sm font-black text-[var(--text)] flex items-center gap-1 mb-3">
            <Package size={16} className="text-[var(--secondary)]" /> 毎日の収集量（見込み）
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(dailyPreview.materials).map(([matId, amount]) => {
              const mat = MATERIALS[matId];
              if (!mat) return null;
              return (
                <div key={matId} className="flex items-center gap-1 bg-[var(--bg)] rounded-full px-3 py-1.5 border-2 border-[var(--text)]">
                  <span>{mat.icon}</span>
                  <span className="text-xs font-black text-[var(--text)]">{mat.name}</span>
                  <span className="text-xs font-black text-[var(--primary)]">+{amount}</span>
                </div>
              );
            })}
            {dailyPreview.coins > 0 && (
              <div className="flex items-center gap-1 bg-[var(--accent)] rounded-full px-3 py-1.5 border-2 border-[var(--text)]">
                <Coins size={14} />
                <span className="text-xs font-black text-[var(--text)]">+{dailyPreview.coins}</span>
              </div>
            )}
          </div>
          {Object.keys(dailyPreview.materials).length === 0 && dailyPreview.coins === 0 && (
            <div className="text-xs text-[var(--text)] opacity-50 text-center py-2">住民がいません</div>
          )}
        </div>
      )}

      {/* 職業別一覧 */}
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] p-4 shadow-[2px_2px_0_var(--text)]">
        <h3 className="text-sm font-black text-[var(--text)] mb-3">職業一覧</h3>
        <div className="flex flex-col gap-2">
          {OCCUPATIONS.map(occ => {
            const count = residentStats.occupationCounts[occ.id] || 0;
            const isExpanded = expandedOcc === occ.id;
            const isUnlocked = (stats.targetGrade || 1) >= occ.minGrade;
            const occVillagers = villagers.filter(v => (v.occupation || 'farmer') === occ.id);

            return (
              <div key={occ.id} className={`border-[3px] border-[var(--text)] rounded-xl overflow-hidden transition-all ${!isUnlocked ? 'opacity-40 grayscale' : ''}`}>
                <button
                  onClick={() => {
                    audioCtrl.playSE('click');
                    setExpandedOcc(isExpanded ? null : occ.id);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-[var(--bg)] hover:bg-[var(--bg)]/80 transition-colors text-left"
                >
                  <span className="text-xl shrink-0">{occ.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-[var(--text)]">{occ.name}</div>
                    <div className="text-[10px] text-[var(--text)] opacity-50 truncate">{occ.desc}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-black text-[var(--primary)]">{count}人</span>
                    <span className="text-[10px] bg-[var(--panel)] px-1.5 py-0.5 rounded border border-[var(--text)] font-bold">{occ.minGrade}年〜</span>
                    {count > 0 ? (isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : null}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && count > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 py-2 bg-[var(--panel)] border-t-2 border-[var(--text)]">
                        {/* 収集素材 */}
                        <div className="text-[10px] font-bold text-[var(--text)] opacity-60 mb-1">収集素材:</div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {occ.collectibles.map(c => {
                            const mat = MATERIALS[c.material];
                            return mat ? (
                              <span key={c.material} className="text-[10px] bg-[var(--bg)] rounded px-1.5 py-0.5 font-bold border border-[var(--text)]">
                                {mat.icon} {mat.name} ×{Math.max(1, Math.round(c.baseAmount * multiplier))}/人
                              </span>
                            ) : null;
                          })}
                          {occ.coinBonus > 0 && (
                            <span className="text-[10px] bg-[var(--accent)] rounded px-1.5 py-0.5 font-bold border border-[var(--text)]">
                              🪙 +{Math.round(occ.coinBonus * multiplier)}/人
                            </span>
                          )}
                        </div>

                        {/* 住民リスト */}
                        <div className="text-[10px] font-bold text-[var(--text)] opacity-60 mb-1">住民:</div>
                        <div className="flex flex-wrap gap-1">
                          {occVillagers.map(v => (
                            <span key={v.id} className="inline-flex items-center gap-0.5 bg-[var(--bg)] rounded-full px-2 py-0.5 text-[10px] font-bold border border-[var(--text)]">
                              <span className="text-[var(--primary)]">{v.kanjiChar}</span>
                              <span className="text-[var(--text)] opacity-50">🧑</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* 満足度の仕組み説明 */}
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] p-4 shadow-[2px_2px_0_var(--text)]">
        <h3 className="text-sm font-black text-[var(--text)] flex items-center gap-1 mb-2">
          <Heart size={16} className="text-rose-500" /> 満足度を上げるには
        </h3>
        <div className="flex flex-col gap-1.5 text-[11px] text-[var(--text)]">
          <div className="flex items-start gap-2"><span className="shrink-0">🏠</span><span>家を建てて住む場所を増やす（3人/1軒）</span></div>
          <div className="flex items-start gap-2"><span className="shrink-0">🏛️</span><span>いろいろな種類の建物を建てる</span></div>
          <div className="flex items-start gap-2"><span className="shrink-0">🌸</span><span>木や花で自然環境をととのえる</span></div>
          <div className="flex items-start gap-2"><span className="shrink-0">🔥</span><span>毎日連続で学習する（ストリーク）</span></div>
          <div className="flex items-start gap-2"><span className="shrink-0">⚠️</span><span className="text-amber-600">雑草が生えると不満が増えるよ！</span></div>
        </div>
      </div>
    </div>
  );
};

export default ResidentPanel;
