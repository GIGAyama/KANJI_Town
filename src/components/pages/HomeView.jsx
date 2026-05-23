import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, PenTool, FileText, Download, AlertCircle, Zap, Flame, Ghost, Library, Map, Medal, BarChart3, ShieldAlert, Users, Hammer, Lock, Sparkles } from 'lucide-react';
import { MotionButton } from '../ui';
import DraggableTownMap from '../town/DraggableTownMap';
import DailyMissionsPanel from '../tutorial/DailyMissionsPanel';
import { KANJI_DATA } from '../../data/kanji-data';
import { MATERIALS } from '../../data/materials';
import { STORY_STAGES, getCurrentStage } from '../../data/story-stages';
import { StorageAPI, calculateProsperity, getLevelInfo } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';
import { calculateSatisfaction, getSatisfactionLabel } from '../../systems/residents';

const HomeView = ({ setView, stats, setStats, startSession, startFlashcard, startSurvival, startBossBattle, levelInfo, dailyMissions, onClaimMission, isMobile }) => {
  const currentLevelInfo = levelInfo || getLevelInfo(stats.totalExp, stats.townMap);
  const { level, title, badge, progress, remainingExp, targetReward, isMaxLevel } = currentLevelInfo;
  const now = Date.now();
  const [selectedGrade, setSelectedGrade] = useState(stats.targetGrade || 1);
  const handleGradeChange = (g) => { setSelectedGrade(g); let newStats = { ...stats, targetGrade: g }; setStats(newStats); StorageAPI.saveStats(newStats); };
  const reviewTargetsCount = KANJI_DATA.filter(k => {
    const s = stats.kanjiStats?.[k.id];
    return s && s.status !== 'new' && (s.nextReview || 0) <= now;
  }).length;
  const isReviewNeeded = reviewTargetsCount > 0;
  const prosperity = calculateProsperity(stats.townMap, reviewTargetsCount);
  const learnedCount = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new').length;
  const isSpecialTrainingUnlocked = learnedCount > 0;
  const satisfaction = calculateSatisfaction(stats);
  const satLabel = getSatisfactionLabel(satisfaction);

  const stage = getCurrentStage(level);

  const isCraftUnlocked = level >= 3;
  const isTownEditorUnlocked = level >= 1;
  const isResidentsUnlocked = (stats.population || 0) >= 1;

  // ── 共通パーツ ──

  /** ステータスバー（レベル・コイン・繁栄度） */
  const StatusBar = () => (
    <div className="flex items-center justify-between shrink-0 px-1">
      <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
        <span className="text-xs md:text-sm font-bold text-[var(--text)] opacity-60 truncate">{badge} {title}</span>
        <span className="text-base md:text-lg font-black text-[var(--text)]">Lv.{level}</span>
        <span className="hidden sm:inline text-xs font-bold text-[var(--text)] opacity-50">{stage.emoji} {stage.title}</span>
      </div>
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <span className="text-[10px] md:text-xs font-bold text-[var(--text)] opacity-60 flex items-center gap-0.5"><Users size={12} />{stats.population || 0}{F("人","にん")}</span>
        <span className="text-[10px] md:text-xs font-bold flex items-center gap-0.5" style={{ color: satLabel.color }}>{satLabel.emoji}{satLabel.text}</span>
        <span className="flex items-center gap-1 bg-[var(--accent)] px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[var(--text)] border-[2px] border-[var(--text)] font-black text-xs md:text-sm shadow-sm"><Coins size={14} />{stats.coins}</span>
        <span className="hidden sm:flex text-xs font-bold text-[var(--primary)] items-center gap-1"><TrendingUp size={12} />{prosperity}</span>
      </div>
    </div>
  );

  /** EXPバー */
  const ExpBar = () => (
    <div className="flex flex-col gap-0.5 md:gap-1 shrink-0">
      <div className="w-full h-2.5 md:h-3 bg-gray-200 rounded-full overflow-hidden border-2 border-[var(--text)]">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-[var(--secondary)]" />
      </div>
      {isMaxLevel ? (
        <div className="text-[10px] font-black text-right text-[var(--accent)] tracking-widest px-1">✨ MAX LEVEL!</div>
      ) : (
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-bold text-[var(--text)] opacity-60">
            あと <strong className="text-[var(--text)] text-xs">{remainingExp || 0}</strong> EXP で Lv.{(level || 1) + 1}
          </span>
          {targetReward && (
            <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full border border-[var(--primary)]/30 flex items-center gap-1 shadow-sm">
              🎁 {targetReward.text || 'ごほうび'}
            </span>
          )}
        </div>
      )}
    </div>
  );

  /** タウンマップ */
  const TownMap = ({ className = '' }) => (
    <div
      className={`relative rounded-2xl overflow-hidden border-[4px] ${isTownEditorUnlocked ? 'border-[var(--text)] cursor-pointer hover:border-[var(--secondary)] transition-colors' : 'border-[var(--text)]'} ${className}`}
      onClick={() => { if (isTownEditorUnlocked) { audioCtrl.playSE('click'); setView('townEditor'); } }}
      role={isTownEditorUnlocked ? "button" : undefined}
      aria-label={isTownEditorUnlocked ? "まちづくりモードへ" : undefined}
    >
      <DraggableTownMap mapData={stats.townMap} isDanger={isReviewNeeded} isEditing={false} reviewCount={reviewTargetsCount} villagers={stats.villagers || []} exploredRadius={stats.exploredRadius || 3} />
      {isTownEditorUnlocked && (
        <div className="absolute bottom-2 right-2 bg-[var(--panel)]/90 backdrop-blur-sm border-[2px] border-[var(--text)] rounded-xl px-2.5 md:px-3 py-1 md:py-1.5 flex items-center gap-1.5 z-10 pointer-events-none shadow-sm">
          <Map size={14} className="text-[var(--accent)]" />
          <span className="text-[10px] md:text-xs font-black text-[var(--text)]">タップでまちづくり</span>
        </div>
      )}
      {!isTownEditorUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
          <span className="bg-[var(--panel)] border-[2px] border-[var(--text)] rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1"><Lock size={12} /> {F("漢字","かんじ")}を{F("覚","おぼ")}えると{F("開放","かいほう")}</span>
        </div>
      )}
    </div>
  );

  /** 学年選択 + メインアクション */
  const GradeAndAction = () => (
    <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl p-2.5 md:p-3 flex flex-col gap-2 shadow-[2px_2px_0_var(--text)] shrink-0">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6].map(g => (
          <button key={g} onClick={() => { audioCtrl.playSE('click'); handleGradeChange(g); }} className={`flex-1 py-1.5 md:py-2 font-black text-sm md:text-base rounded-xl border-[2px] transition-all ${selectedGrade === g ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>{g}年</button>
        ))}
      </div>
      <MotionButton variant={isReviewNeeded ? "danger" : "primary"} className="w-full py-3 md:py-4 text-base md:text-lg font-black border-[3px] border-[var(--text)] shadow-[0_3px_0_rgba(0,0,0,0.3)]" onClick={() => startSession(selectedGrade)}>
        {isReviewNeeded ? <><ShieldAlert size={20} /> おばけを たいじする！</> : <><PenTool size={20} /> {selectedGrade}{F("年生","ねんせい")}の{F("漢字","かんじ")}を{F("覚","おぼ")}える！</>}
      </MotionButton>
    </div>
  );

  /** ドリルボタン */
  const DrillButtons = () => (
    <div className="grid grid-cols-2 gap-2 shrink-0">
      <MotionButton variant="success" className="py-2.5 md:py-3 flex-col gap-1 text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_#065f46]" onClick={() => setView('myDrills')}><FileText size={20} /> マイドリル</MotionButton>
      <MotionButton variant="accent" className="py-2.5 md:py-3 flex-col gap-1 text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_#b45309]" onClick={() => setView('peerClient')}><Download size={20} /> {F("通信","つうしん")}でもらう</MotionButton>
    </div>
  );

  /** 特別トレーニング */
  const SpecialTraining = () => (
    <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl p-2 md:p-2.5 relative overflow-hidden shrink-0">
      {!isSpecialTrainingUnlocked && (
        <div className="absolute inset-0 z-10 bg-[var(--panel)]/80 backdrop-blur-[2px] flex items-center justify-center">
          <span className="text-xs font-bold text-[var(--text)] bg-[var(--bg)] px-3 py-1.5 rounded-full border-2 border-[var(--text)] flex items-center gap-1 shadow-sm"><AlertCircle size={14} className="text-amber-500" /> まずは{F("漢字","かんじ")}を{F("覚","おぼ")}えよう！</span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <MotionButton variant="secondary" onClick={startFlashcard} disabled={!isSpecialTrainingUnlocked} className="flex-col py-2.5 md:py-3 border-[2px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Zap size={18} className="text-amber-500" /> フラッシュ</MotionButton>
        <MotionButton variant="secondary" onClick={startSurvival} disabled={!isSpecialTrainingUnlocked} className="flex-col py-2.5 md:py-3 border-[2px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Flame size={18} className="text-rose-500" /> サバイバル</MotionButton>
        <MotionButton variant="secondary" onClick={startBossBattle} disabled={!isSpecialTrainingUnlocked} className="flex-col py-2.5 md:py-3 border-[2px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Ghost size={18} className="text-purple-500" /> ボスバトル</MotionButton>
      </div>
    </div>
  );

  /** ナビゲーションボタン（PC/タブレット用サイドバー向け） */
  const NavButtons = () => (
    <>
      <div className="grid grid-cols-2 gap-2 shrink-0">
        <MotionButton variant="secondary" className="py-3 text-sm border-[2px] border-[var(--text)] shadow-sm gap-2" onClick={() => setView('dictionary')}><Library size={20} className="text-[var(--secondary)]" /> {F("図鑑","ずかん")}</MotionButton>
        <MotionButton variant="secondary" className="py-3 text-sm border-[2px] border-[var(--text)] border-amber-200 bg-amber-50 shadow-sm gap-2" onClick={() => setView('gacha')}><Sparkles size={20} className="text-amber-500" /> ガチャ</MotionButton>
      </div>
      <div className="grid grid-cols-2 gap-2 shrink-0">
        <MotionButton variant="secondary" className="py-3 text-sm border-[2px] border-[var(--text)] shadow-sm gap-2" onClick={() => setView('achievements')}><Medal size={20} className="text-amber-500" /> {F("実績","じっせき")}</MotionButton>
        <MotionButton variant="secondary" className="py-3 text-sm border-[2px] border-[var(--text)] shadow-sm gap-2" onClick={() => setView('stats')}><BarChart3 size={20} className="text-[var(--secondary)]" /> {F("記録","きろく")}</MotionButton>
      </div>
    </>
  );

  /** アンロックヒント */
  const UnlockHints = () => (
    <>
      {!isTownEditorUnlocked && (
        <div className="text-xs text-center text-[var(--text)] opacity-40 bg-[var(--bg)] rounded-lg px-2 py-1 shrink-0">
          {F("漢字","かんじ")}を1つ{F("覚","おぼ")}えると「まちづくり」が{F("使","つか")}えるよ
        </div>
      )}
      {isTownEditorUnlocked && !isCraftUnlocked && (
        <div className="text-xs text-center text-[var(--text)] opacity-40 bg-[var(--bg)] rounded-lg px-2 py-1 shrink-0">
          {F("漢字","かんじ")}を3つ{F("覚","おぼ")}えると「クラフト」が{F("使","つか")}えるよ
        </div>
      )}
    </>
  );

  // ━━━━━━━━━━ モバイルレイアウト（< md） ━━━━━━━━━━
  if (isMobile) {
    return (
      <div className="flex flex-col h-full gap-2 overflow-hidden">
        {/* ステータスバー */}
        <StatusBar />
        <ExpBar />

        {/* タウンマップ（コンパクト） */}
        <TownMap className="h-[35vh] min-h-[180px] shrink-0" />

        {/* コントロール（スクロール可能） */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar pb-2">
          {/* デイリーミッション */}
          {dailyMissions && dailyMissions.length > 0 && (
            <div className="shrink-0">
              <DailyMissionsPanel missions={dailyMissions} onClaim={onClaimMission} />
            </div>
          )}

          <GradeAndAction />
          <DrillButtons />
          <SpecialTraining />
          <UnlockHints />
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━ タブレット/PCレイアウト（>= md）━━━━━━━━━━
  return (
    <div className="flex h-full gap-3 overflow-hidden">
      {/* === LEFT: Town Map === */}
      <div className="flex-1 flex flex-col gap-2 min-w-0 h-full">
        <StatusBar />
        <ExpBar />
        <TownMap className="flex-1 min-h-0" />
      </div>

      {/* === RIGHT: Controls === */}
      <div className="w-[340px] shrink-0 flex flex-col gap-2 h-full overflow-y-auto no-scrollbar">
        {/* Daily missions */}
        {dailyMissions && dailyMissions.length > 0 && (
          <div className="shrink-0">
            <DailyMissionsPanel missions={dailyMissions} onClaim={onClaimMission} />
          </div>
        )}

        <GradeAndAction />
        <DrillButtons />
        <SpecialTraining />
        <NavButtons />
        <UnlockHints />
      </div>
    </div>
  );
};

export default HomeView;
