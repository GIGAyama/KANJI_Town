import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, PenTool, FileText, Download, AlertCircle, Zap, Flame, Ghost, Library, Map, Medal, BarChart3, ShieldAlert, Users } from 'lucide-react';
import { MotionButton } from '../ui';
import DraggableTownMap from '../town/DraggableTownMap';
import { KANJI_DATA } from '../../data/kanji-data';
import { STORY_STAGES } from '../../data/story-stages';
import { MATERIALS } from '../../data/materials';
import { StorageAPI, calculateProsperity, getLevelInfo } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { calculateSatisfaction, getSatisfactionLabel } from '../../systems/residents';

const HomeView = ({ setView, stats, setStats, startSession, startFlashcard, startSurvival, startBossBattle, levelInfo }) => {
  const { level, title, badge, progress } = levelInfo || getLevelInfo(stats.totalExp, stats.townMap);
  const now = Date.now();
  const [selectedGrade, setSelectedGrade] = useState(stats.targetGrade || 1);
  const handleGradeChange = (g) => { setSelectedGrade(g); let newStats = { ...stats, targetGrade: g }; setStats(newStats); StorageAPI.saveStats(newStats); };
  const reviewTargetsCount = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new' && stats.kanjiStats[k.id].nextReview <= now).length;
  const isReviewNeeded = reviewTargetsCount > 0;
  const prosperity = calculateProsperity(stats.townMap, reviewTargetsCount);
  const isSpecialTrainingUnlocked = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new').length > 0;
  const satisfaction = calculateSatisfaction(stats);
  const satLabel = getSatisfactionLabel(satisfaction);

  return (
    <div className="flex flex-col items-center gap-4 pb-6 h-full overflow-y-auto no-scrollbar">
      <div className="w-full bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] shadow-[4px_4px_0_var(--text)] p-4 flex flex-col gap-3 shrink-0">
        <div className="flex justify-between items-end shrink-0">
          <div className="text-left">
            <div className="text-xs font-bold text-[var(--text)] opacity-70 mb-0.5">{badge} {title}</div>
            <div className="text-2xl md:text-3xl font-black text-[var(--text)] tracking-wide">マイタウン Lv.{level}</div>
          </div>
          <div className="text-right text-xs font-bold text-[var(--text)] opacity-60 mb-1 flex flex-col items-end gap-1">
            <span className="flex items-center gap-1 bg-[var(--accent)] px-3 py-1 rounded-full text-[var(--text)] border-[3px] border-[var(--text)] font-black text-sm shadow-[2px_2px_0_rgba(0,0,0,0.2)]"><Coins size={16} />{stats.coins}</span>
            <span className="font-bold flex items-center gap-1 text-[var(--primary)]"><TrendingUp size={14} /> 繁栄度: {prosperity}</span>
          </div>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-[var(--text)]"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-[var(--secondary)]"></motion.div></div>
        <div className="w-full h-[150px] relative">
          <DraggableTownMap mapData={stats.townMap} biomeMap={stats.biomeMap} isDanger={isReviewNeeded} isEditing={false} reviewCount={reviewTargetsCount} kakejikuImg={stats.kakejiku} villagers={stats.villagers || []} exploredRadius={stats.exploredRadius || 3} />
        </div>
        {(() => {
          const masteredCount = Object.values(stats.kanjiStats || {}).filter(s => s.status === 'mastered').length;
          const stage = STORY_STAGES.slice().reverse().find(s => masteredCount >= s.minKanji && (stats.population || 0) >= s.minPop) || STORY_STAGES[0];
          const nextStage = STORY_STAGES.find(s => s.id === stage.id + 1);
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[var(--bg)] rounded-xl px-3 py-2 border-[2px] border-[var(--text)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl shrink-0">{stage.emoji}</span>
                <div className="min-w-0">
                  <div className="font-black text-[var(--text)] text-sm truncate">{stage.title}</div>
                  <div className="text-[10px] text-[var(--text)] opacity-50 leading-tight truncate">{stage.desc}</div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs font-black text-[var(--text)] opacity-60">👥 {stats.population || 0}人</div>
                <div className="text-[10px] font-bold" style={{ color: satLabel.color }}>{satLabel.emoji} {satLabel.text}</div>
                {nextStage && <div className="text-[9px] text-[var(--text)] opacity-40">次: {nextStage.minKanji}字・{nextStage.minPop}人</div>}
              </div>
            </motion.div>
          );
        })()}
      </div>

      {/* 住民の収集報告 */}
      {stats.lastCollectionResult && Object.keys(stats.lastCollectionResult.materials || {}).length > 0 && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-emerald-50 border-[3px] border-emerald-400 rounded-[16px] px-4 py-2.5 shadow-sm">
          <div className="text-xs font-black text-emerald-700 mb-1.5">🌾 住民が素材を集めてくれたよ！</div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.lastCollectionResult.materials).map(([matId, amount]) => {
              const mat = MATERIALS[matId];
              return mat ? <span key={matId} className="text-[10px] bg-white rounded-full px-2 py-0.5 font-bold border border-emerald-300">{mat.icon} {mat.name} +{amount}</span> : null;
            })}
            {stats.lastCollectionResult.coins > 0 && <span className="text-[10px] bg-yellow-100 rounded-full px-2 py-0.5 font-bold border border-yellow-300">🪙 +{stats.lastCollectionResult.coins}</span>}
          </div>
        </motion.div>
      )}

      <div className="flex flex-col w-full gap-2 shrink-0">
        <div className="w-full bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] p-3 flex flex-col gap-2 shadow-[2px_2px_0_var(--text)]">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {[1, 2, 3, 4, 5, 6].map(g => (
              <button key={g} onClick={() => { audioCtrl.playSE('click'); handleGradeChange(g); }} className={`flex-1 py-2 font-black text-sm rounded-xl border-[2px] transition-all whitespace-nowrap px-1 ${selectedGrade === g ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>{g}年</button>
            ))}
          </div>
          <MotionButton variant={isReviewNeeded ? "danger" : "primary"} className="w-full py-5 text-xl font-black border-[4px] border-[var(--text)] shadow-[0_4px_0_rgba(0,0,0,0.3)] mt-1" onClick={() => startSession(selectedGrade)}>
            {isReviewNeeded ? <><ShieldAlert size={24} /> おばけを たいじする！</> : <><PenTool size={24} /> {selectedGrade}年生の 漢字を覚える！</>}
          </MotionButton>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full mt-1">
          <MotionButton variant="success" className="py-4 flex-col gap-1 text-sm border-[4px] border-[var(--text)] shadow-[0_4px_0_#065f46]" onClick={() => setView('myDrills')}><FileText size={24} /> マイドリル</MotionButton>
          <MotionButton variant="accent" className="py-4 flex-col gap-1 text-sm border-[4px] border-[var(--text)] shadow-[0_4px_0_#b45309]" onClick={() => setView('peerClient')}><Download size={24} /> 通信でもらう</MotionButton>
        </div>

        <div className="w-full bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] p-3 flex flex-col gap-2 mt-1 relative overflow-hidden">
          {!isSpecialTrainingUnlocked && (
            <div className="absolute inset-0 z-10 bg-[var(--panel)]/80 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--text)] bg-[var(--bg)] px-3 py-1.5 rounded-full border-2 border-[var(--text)] flex items-center gap-1 shadow-sm"><AlertCircle size={14} className="text-amber-500" /> まずは漢字を覚えよう！</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <MotionButton variant="secondary" onClick={startFlashcard} disabled={!isSpecialTrainingUnlocked} className="flex-col py-3 border-[3px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Zap size={20} className="text-amber-500" /> フラッシュ</MotionButton>
            <MotionButton variant="secondary" onClick={startSurvival} disabled={!isSpecialTrainingUnlocked} className="flex-col py-3 border-[3px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Flame size={20} className="text-rose-500" /> サバイバル</MotionButton>
            <MotionButton variant="secondary" onClick={startBossBattle} disabled={!isSpecialTrainingUnlocked} className="flex-col py-3 border-[3px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Ghost size={20} className="text-purple-500" /> ボスバトル</MotionButton>
          </div>
        </div>

        <div className="flex gap-2 mt-1">
          <MotionButton variant="secondary" className="py-3 flex-1 text-xs border-[3px] border-[var(--text)] shadow-sm min-h-[44px]" onClick={() => setView('dictionary')}><Library size={16} className="text-[var(--secondary)]" /> ずかん</MotionButton>
          <MotionButton variant="secondary" className="py-3 flex-1 text-xs border-[3px] border-[var(--text)] shadow-sm min-h-[44px]" onClick={() => setView('townEditor')}><Map size={16} className="text-[var(--accent)]" /> まちづくり</MotionButton>
          <MotionButton variant="secondary" className="py-3 flex-1 text-xs border-[3px] border-[var(--text)] shadow-sm min-h-[44px]" onClick={() => setView('residents')}><Users size={16} className="text-[var(--primary)]" /> 住民</MotionButton>
        </div>
        <div className="flex gap-2">
          <MotionButton variant="secondary" className="py-3 flex-1 text-xs border-[3px] border-[var(--text)] shadow-sm min-h-[44px]" onClick={() => setView('achievements')}><Medal size={16} className="text-amber-500" /> 実績</MotionButton>
          <MotionButton variant="secondary" className="py-3 flex-1 text-xs border-[3px] border-[var(--text)] shadow-sm min-h-[44px]" onClick={() => setView('stats')}><BarChart3 size={16} className="text-[var(--secondary)]" /> きろく</MotionButton>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
