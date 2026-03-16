import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, PenTool, FileText, Download, AlertCircle, Zap, Flame, Ghost, Library, Map, Medal, BarChart3, ShieldAlert, Users, Hammer, Lock } from 'lucide-react';
import { MotionButton } from '../ui';
import DraggableTownMap from '../town/DraggableTownMap';
import DailyMissionsPanel from '../tutorial/DailyMissionsPanel';
import { KANJI_DATA } from '../../data/kanji-data';
import { STORY_STAGES } from '../../data/story-stages';
import { MATERIALS } from '../../data/materials';
import { StorageAPI, calculateProsperity, getLevelInfo } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { calculateSatisfaction, getSatisfactionLabel } from '../../systems/residents';

const HomeView = ({ setView, stats, setStats, startSession, startFlashcard, startSurvival, startBossBattle, levelInfo, dailyMissions, onClaimMission }) => {
  const { level, title, badge, progress } = levelInfo || getLevelInfo(stats.totalExp, stats.townMap);
  const now = Date.now();
  const [selectedGrade, setSelectedGrade] = useState(stats.targetGrade || 1);
  const handleGradeChange = (g) => { setSelectedGrade(g); let newStats = { ...stats, targetGrade: g }; setStats(newStats); StorageAPI.saveStats(newStats); };
  const reviewTargetsCount = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new' && stats.kanjiStats[k.id].nextReview <= now).length;
  const isReviewNeeded = reviewTargetsCount > 0;
  const prosperity = calculateProsperity(stats.townMap, reviewTargetsCount);
  const learnedCount = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new').length;
  const isSpecialTrainingUnlocked = learnedCount > 0;
  const satisfaction = calculateSatisfaction(stats);
  const satLabel = getSatisfactionLabel(satisfaction);

  const masteredCount = Object.values(stats.kanjiStats || {}).filter(s => s.status === 'mastered').length;
  const isCraftUnlocked = learnedCount >= 3;
  const isTownEditorUnlocked = learnedCount >= 1;
  const isResidentsUnlocked = (stats.population || 0) >= 1;

  const stage = STORY_STAGES.slice().reverse().find(s => masteredCount >= s.minKanji && (stats.population || 0) >= s.minPop) || STORY_STAGES[0];

  return (
    <div className="flex h-full gap-3 overflow-hidden">
      {/* === LEFT: Town Map === */}
      <div className="flex-1 flex flex-col gap-2 min-w-0 h-full">
        {/* Town header bar */}
        <div className="flex items-center justify-between shrink-0 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-[var(--text)] opacity-60">{badge} {title}</span>
            <span className="text-lg font-black text-[var(--text)]">Lv.{level}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1 bg-[var(--accent)] px-2.5 py-1 rounded-full text-[var(--text)] border-[2px] border-[var(--text)] font-black text-sm shadow-sm"><Coins size={14} />{stats.coins}</span>
            <span className="text-xs font-bold text-[var(--primary)] flex items-center gap-1"><TrendingUp size={12} />{prosperity}</span>
          </div>
        </div>

        {/* EXP bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border-2 border-[var(--text)] shrink-0">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-[var(--secondary)]" />
        </div>

        {/* Town map - clickable to enter town editor */}
        <div
          className={`flex-1 min-h-0 relative rounded-2xl overflow-hidden border-[4px] ${isTownEditorUnlocked ? 'border-[var(--text)] cursor-pointer hover:border-[var(--secondary)] transition-colors' : 'border-[var(--text)]'}`}
          onClick={() => { if (isTownEditorUnlocked) { audioCtrl.playSE('click'); setView('townEditor'); } }}
          role={isTownEditorUnlocked ? "button" : undefined}
          aria-label={isTownEditorUnlocked ? "まちづくりモードへ" : undefined}
        >
          <DraggableTownMap mapData={stats.townMap} biomeMap={stats.biomeMap} isDanger={isReviewNeeded} isEditing={false} reviewCount={reviewTargetsCount} kakejikuImg={stats.kakejiku} villagers={stats.villagers || []} exploredRadius={stats.exploredRadius || 3} />
          {/* Overlay label */}
          {isTownEditorUnlocked && (
            <div className="absolute bottom-2 right-2 bg-[var(--panel)]/90 backdrop-blur-sm border-[2px] border-[var(--text)] rounded-xl px-3 py-1.5 flex items-center gap-1.5 z-10 pointer-events-none shadow-sm">
              <Map size={14} className="text-[var(--accent)]" />
              <span className="text-xs font-black text-[var(--text)]">タップでまちづくり</span>
            </div>
          )}
          {!isTownEditorUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
              <span className="bg-[var(--panel)] border-[2px] border-[var(--text)] rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1"><Lock size={12} /> 漢字を覚えると開放</span>
            </div>
          )}
        </div>

        {/* Story stage bar */}
        <div className="bg-[var(--panel)] rounded-xl px-3 py-2 border-[2px] border-[var(--text)] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">{stage.emoji}</span>
            <span className="font-black text-[var(--text)] text-sm truncate">{stage.title}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs font-bold">
            <span className="text-[var(--text)] opacity-60">👥{stats.population || 0}人</span>
            <span style={{ color: satLabel.color }}>{satLabel.emoji}{satLabel.text}</span>
          </div>
        </div>
      </div>

      {/* === RIGHT: Controls === */}
      <div className="w-[340px] shrink-0 flex flex-col gap-2 h-full overflow-y-auto no-scrollbar">
        {/* Resource collection */}
        {stats.lastCollectionResult && Object.keys(stats.lastCollectionResult.materials || {}).length > 0 && (
          <div className="bg-emerald-50 border-[2px] border-emerald-400 rounded-xl px-3 py-2 shrink-0">
            <div className="text-xs font-black text-emerald-700 mb-1">住民が素材を集めたよ！</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(stats.lastCollectionResult.materials).map(([matId, amount]) => {
                const mat = MATERIALS[matId];
                return mat ? <span key={matId} className="text-[10px] bg-white rounded-full px-2 py-0.5 font-bold border border-emerald-300">{mat.icon} {mat.name} +{amount}</span> : null;
              })}
              {stats.lastCollectionResult.coins > 0 && <span className="text-[10px] bg-yellow-100 rounded-full px-2 py-0.5 font-bold border border-yellow-300">+{stats.lastCollectionResult.coins}</span>}
            </div>
          </div>
        )}

        {/* Daily missions */}
        {dailyMissions && dailyMissions.length > 0 && (
          <div className="shrink-0">
            <DailyMissionsPanel missions={dailyMissions} onClaim={onClaimMission} />
          </div>
        )}

        {/* Grade selector + Main action */}
        <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl p-3 flex flex-col gap-2 shadow-[2px_2px_0_var(--text)] shrink-0">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map(g => (
              <button key={g} onClick={() => { audioCtrl.playSE('click'); handleGradeChange(g); }} className={`flex-1 py-2 font-black text-base rounded-xl border-[2px] transition-all ${selectedGrade === g ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>{g}年</button>
            ))}
          </div>
          <MotionButton variant={isReviewNeeded ? "danger" : "primary"} className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_3px_0_rgba(0,0,0,0.3)]" onClick={() => startSession(selectedGrade)}>
            {isReviewNeeded ? <><ShieldAlert size={22} /> おばけを たいじする！</> : <><PenTool size={22} /> {selectedGrade}年生の漢字を覚える！</>}
          </MotionButton>
        </div>

        {/* Drill buttons */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          <MotionButton variant="success" className="py-3 flex-col gap-1 text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_#065f46]" onClick={() => setView('myDrills')}><FileText size={20} /> マイドリル</MotionButton>
          <MotionButton variant="accent" className="py-3 flex-col gap-1 text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_#b45309]" onClick={() => setView('peerClient')}><Download size={20} /> 通信でもらう</MotionButton>
        </div>

        {/* Special training */}
        <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl p-2.5 relative overflow-hidden shrink-0">
          {!isSpecialTrainingUnlocked && (
            <div className="absolute inset-0 z-10 bg-[var(--panel)]/80 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--text)] bg-[var(--bg)] px-3 py-1.5 rounded-full border-2 border-[var(--text)] flex items-center gap-1 shadow-sm"><AlertCircle size={14} className="text-amber-500" /> まずは漢字を覚えよう！</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <MotionButton variant="secondary" onClick={startFlashcard} disabled={!isSpecialTrainingUnlocked} className="flex-col py-3 border-[2px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Zap size={18} className="text-amber-500" /> フラッシュ</MotionButton>
            <MotionButton variant="secondary" onClick={startSurvival} disabled={!isSpecialTrainingUnlocked} className="flex-col py-3 border-[2px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Flame size={18} className="text-rose-500" /> サバイバル</MotionButton>
            <MotionButton variant="secondary" onClick={startBossBattle} disabled={!isSpecialTrainingUnlocked} className="flex-col py-3 border-[2px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Ghost size={18} className="text-purple-500" /> ボスバトル</MotionButton>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <MotionButton variant="secondary" className="py-3 text-xs border-[2px] border-[var(--text)] shadow-sm flex-col gap-0.5" onClick={() => setView('dictionary')}><Library size={16} className="text-[var(--secondary)]" /> ずかん</MotionButton>
          <MotionButton variant="secondary" className="py-3 text-xs border-[2px] border-[var(--text)] shadow-sm flex-col gap-0.5" onClick={() => setView('achievements')}><Medal size={16} className="text-amber-500" /> 実績</MotionButton>
          <MotionButton variant="secondary" className="py-3 text-xs border-[2px] border-[var(--text)] shadow-sm flex-col gap-0.5" onClick={() => setView('stats')}><BarChart3 size={16} className="text-[var(--secondary)]" /> きろく</MotionButton>
        </div>

        {/* Unlock hints */}
        {!isTownEditorUnlocked && (
          <div className="text-xs text-center text-[var(--text)] opacity-40 bg-[var(--bg)] rounded-lg px-2 py-1 shrink-0">
            漢字を1つ覚えると「まちづくり」が使えるよ
          </div>
        )}
        {isTownEditorUnlocked && !isCraftUnlocked && (
          <div className="text-xs text-center text-[var(--text)] opacity-40 bg-[var(--bg)] rounded-lg px-2 py-1 shrink-0">
            漢字を3つ覚えると「クラフト」が使えるよ
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeView;
