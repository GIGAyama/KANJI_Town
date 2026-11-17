import React, { lazy, Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, PenTool, FileText, Download, AlertCircle, Zap, Flame, Ghost, Library, Map, Medal, BarChart3, ShieldAlert, Users, Lock, Sparkles, Target, CheckCircle2 } from 'lucide-react';
import { MotionButton } from '../ui';
import DailyMissionsPanel from '../tutorial/DailyMissionsPanel';
import { KANJI_DATA } from '../../data/kanji-data';
import { getCurrentStage } from '../../data/story-stages';
import { StorageAPI, calculateProsperity, getLevelInfo } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';
import { calculateSatisfaction, getSatisfactionLabel } from '../../systems/residents';
import { buildLearningPlan, getDailyLearningProgress, getGoalAwareSessionLimits, getReviewForecast } from '../../systems/learning-plan';
import { getTodayString } from '../../utils/date-utils';
import { SESSION } from '../../constants/gameConfig';
import { getHabitStatus } from '../../systems/habit';

const DraggableTownMap = lazy(() => import('../town/DraggableTownMap'));
// 宿題・ならった範囲があるときだけ読む（無い子の初回の JS を増やさない）
const HomeworkCard = lazy(() => import('../social/HomeAssignments').then((m) => ({ default: m.HomeworkCardForHome })));
const RangeStatusLine = lazy(() => import('../social/HomeAssignments').then((m) => ({ default: m.RangeStatusLine })));
const HomeworkBadge = lazy(() => import('../social/HomeAssignments').then((m) => ({ default: m.HomeworkBadge })));

/** 住民がまだいないときに毎回新しい [] を渡すと、町マップが「変わった」とみなして描き直すため */
const EMPTY_VILLAGERS = Object.freeze([]);

const TownMapFallback = () => (
  <div
    className="h-full min-h-[160px] w-full flex items-center justify-center bg-gradient-to-b from-sky-100 to-emerald-100"
    role="status"
    aria-label="まちを読み込み中"
  >
    <div className="flex items-center gap-2 rounded-full border-2 border-[var(--text)] bg-[var(--panel)]/90 px-4 py-2 text-xs font-black text-[var(--text)] shadow-sm">
      <span className="h-3 w-3 animate-pulse rounded-full bg-[var(--secondary)]" aria-hidden="true" />
      <span>まちを{F("準備","じゅんび")}しています...</span>
    </div>
  </div>
);

// ── 共通パーツ ──
// ⚠️ ここの部品は HomeView の中で定義しないこと。描画のたびに「別の部品」として扱われ、
//    学年や音を切り替えるだけで町マップ（数万個の要素）が捨てられて作り直される。

/** ステータスバー（レベル・コイン・繁栄度） */
const StatusBar = ({ levelInfo: { badge, title, level }, stage, population, satLabel, coins, prosperity }) => (
  // 入らないとき（せまい画面で 文字を大きくしたとき）は、右がわを 2 行めへ送る。前は ステージの名前が
  // 「🏯…」まで切れていた。右がわは 2 行めでも右に寄せる（ml-auto）
  <div className="flex flex-wrap items-center justify-between gap-y-1 shrink-0 px-1">
    <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
      <span className="text-xs md:text-sm font-bold text-[var(--text-muted)] truncate">{badge} {title}</span>
      <span className="text-base md:text-lg font-black text-[var(--text)]">Lv.{level}</span>
      <span className="hidden sm:inline text-xs font-bold text-[var(--text-muted)]">{stage.emoji} {stage.title}</span>
    </div>
    <div className="flex items-center gap-1.5 md:gap-2 shrink-0 ml-auto">
      <span className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] flex items-center gap-0.5"><Users size={12} /><span>{population || 0}{F("人","にん")}</span></span>
      {/* 住民がまだいないときは満足度を出さない（初回から「😢とても ふまん」と出ていた） */}
      {(population || 0) > 0 && <span className="text-[10px] md:text-xs font-bold flex items-center gap-0.5" style={{ color: satLabel.color }}>{satLabel.emoji}{satLabel.text}</span>}
      <span className="flex items-center gap-1 bg-[var(--accent)] px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[var(--text)] border-[2px] border-[var(--text)] font-black text-xs md:text-sm shadow-sm"><Coins size={14} />{coins}</span>
      <span className="hidden sm:flex text-xs font-bold text-[var(--primary)] items-center gap-1"><TrendingUp size={12} />{prosperity}</span>
    </div>
  </div>
);

/** EXPバー */
const ExpBar = ({ levelInfo: { progress, isMaxLevel, remainingExp, level, targetReward } }) => (
  <div className="flex flex-col gap-0.5 md:gap-1 shrink-0">
    <div className="w-full h-2.5 md:h-3 bg-gray-200 rounded-full overflow-hidden border-2 border-[var(--text)]">
      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-[var(--secondary)]" />
    </div>
    {isMaxLevel ? (
      <div className="text-[10px] font-black text-right text-[var(--accent)] tracking-widest px-1">✨ MAX LEVEL!</div>
    ) : (
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-bold text-[var(--text-muted)]">
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

/** 毎日の学習習慣を一目で把握できる進捗カード */
const DailyGoalCard = ({ dailyProgress, habitStatus, streak, nextReviewHint }) => (
  <div className={`bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl p-2.5 md:p-3 shadow-[2px_2px_0_var(--text)] shrink-0 ${dailyProgress.isComplete ? 'ring-2 ring-emerald-300' : ''}`}>
    <div className="flex items-center justify-between gap-3 mb-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-8 h-8 rounded-xl border-2 border-[var(--text)] flex items-center justify-center shrink-0 ${dailyProgress.isComplete ? 'bg-emerald-400' : 'bg-[var(--accent)]'}`}>
          {dailyProgress.isComplete ? <CheckCircle2 size={18} /> : <Target size={18} />}
        </div>
        <div className="min-w-0">
          <div className="text-xs md:text-sm font-black text-[var(--text)] truncate">{dailyProgress.isComplete ? <>きょうの{F("目標","もくひょう")}クリア！</> : <>きょうの{F("学習","がくしゅう")}{F("目標","もくひょう")}</>}</div>
          <div className="text-[10px] font-bold text-[var(--text)] opacity-55">
            🔥 {streak || 0}{F("日","にち")} ・ 🛡️ {habitStatus.canProtectToday
              ? <>きょう{F("自動","じどう")}で{F("守","まも")}ります</>
              : habitStatus.restPassAvailable
                ? 'おやすみパスあり'
                : <>あと{habitStatus.rechargeRemaining}{F("日","にち")}でパス</>}
          </div>
        </div>
      </div>
      <div className="font-black text-[var(--text)] shrink-0"><span className="text-lg text-[var(--primary)]">{dailyProgress.reviewed}</span><span className="text-xs text-[var(--text-muted)]"> / {dailyProgress.goal}{F("字","じ")}</span></div>
    </div>
    <div className="h-3 bg-gray-200 rounded-full overflow-hidden border-2 border-[var(--text)]" role="progressbar" aria-label="今日の学習目標" aria-valuemin="0" aria-valuemax={dailyProgress.goal} aria-valuenow={Math.min(dailyProgress.reviewed, dailyProgress.goal)}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${dailyProgress.percent}%` }} className={`h-full ${dailyProgress.isComplete ? 'bg-emerald-400' : 'bg-[var(--primary)]'}`} />
    </div>
    {/* 背の低いスマホでは、学習を始めるボタンを最初の画面に入れるため、この行を省く */}
    <div className="flex justify-between mt-1.5 text-[10px] font-bold text-[var(--text-muted)] max-md:[@media(max-height:620px)]:hidden">
      <span>{habitStatus.canProtectToday
        ? <>きょう{F("学","まな")}ぶと{F("連続","れんぞく")}{F("記録","きろく")}を{F("守","まも")}れます</>
        : dailyProgress.isComplete
          ? 'よくがんばりました！'
          : <>あと {dailyProgress.remaining}{F("字","じ")}でクリア</>}</span>
      <span>{nextReviewHint}</span>
    </div>
  </div>
);

/**
 * タウンマップ。
 * memo で包み、値の props だけを受け取る。学年・音・ポップアップなど町と関係のない
 * 切り替えでは描き直さない（ずらした地図の位置も保たれる）。
 */
const TownMap = memo(({ className = '', isTownEditorUnlocked, onOpenEditor, townMap, isDanger, reviewCount, villagers, exploredRadius }) => (
  <div
    className={`relative rounded-2xl overflow-hidden border-[4px] ${isTownEditorUnlocked ? 'border-[var(--text)] cursor-pointer hover:border-[var(--secondary)] transition-colors' : 'border-[var(--text)]'} ${className}`}
    onClick={() => { if (isTownEditorUnlocked) onOpenEditor(); }}
    onKeyDown={(e) => {
      if (!isTownEditorUnlocked || e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenEditor(); }
    }}
    role={isTownEditorUnlocked ? "button" : undefined}
    tabIndex={isTownEditorUnlocked ? 0 : undefined}
    aria-label={isTownEditorUnlocked ? "まちづくりモードへ" : undefined}
  >
    <Suspense fallback={<TownMapFallback />}>
      <DraggableTownMap mapData={townMap} isDanger={isDanger} isEditing={false} reviewCount={reviewCount} villagers={villagers} exploredRadius={exploredRadius} />
    </Suspense>
    {isTownEditorUnlocked && (
      <div className="absolute bottom-2 right-2 bg-[var(--panel)]/95 border-[2px] border-[var(--text)] rounded-xl px-2.5 md:px-3 py-1 md:py-1.5 flex items-center gap-1.5 z-10 pointer-events-none shadow-sm">
        <Map size={14} className="text-[var(--accent)]" />
        <span className="text-[10px] md:text-xs font-black text-[var(--text)]">タップでまちづくり</span>
      </div>
    )}
    {!isTownEditorUnlocked && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
        <span className="bg-[var(--panel)] border-[2px] border-[var(--text)] rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1"><Lock size={12} /> <span>{F("漢字","かんじ")}を{F("覚","おぼ")}えると{F("開放","かいほう")}</span></span>
      </div>
    )}
  </div>
));

/** 学年選択 + メインアクション */
const GradeAndAction = ({ selectedGrade, onGradeChange, onStart, isReviewNeeded, dailyProgress, plannedTotalCount, plannedReviewCount, plannedNewCount, footer }) => (
  <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl p-2.5 md:p-3 flex flex-col gap-2 shadow-[2px_2px_0_var(--text)] shrink-0">
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5, 6].map(g => (
        <button key={g} onClick={() => { audioCtrl.playSE('click'); onGradeChange(g); }} className={`flex-1 py-1.5 md:py-2 font-black text-sm md:text-base rounded-xl border-[2px] transition-all ${selectedGrade === g ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-[var(--text)]/25 hover:border-[var(--text)]'}`} aria-pressed={selectedGrade === g}>{g}{F("年","ねん")}</button>
      ))}
    </div>
    <MotionButton variant={isReviewNeeded ? "danger" : "primary"} className="w-full py-3 md:py-4 text-sm sm:text-base lg:text-lg font-black border-[3px] border-[var(--text)] shadow-[0_3px_0_rgba(0,0,0,0.3)]" onClick={() => onStart(selectedGrade)}>
      {!dailyProgress.isComplete && plannedTotalCount > 0
        ? <><Target size={20} className="shrink-0" /> <span className="min-w-0 leading-snug">きょうの{plannedTotalCount}{F("字","じ")}：{F("復習","ふくしゅう")}{plannedReviewCount}＋{F("新出","しんしゅつ")}{plannedNewCount}</span></>
        : isReviewNeeded
        ? <><ShieldAlert size={20} className="shrink-0" /> <span className="min-w-0 leading-snug">{F("復習","ふくしゅう")}{plannedReviewCount}＋{F("新出","しんしゅつ")}{plannedNewCount}</span></>
        : plannedNewCount > 0
          ? <><PenTool size={20} className="shrink-0" /> <span className="min-w-0 leading-snug">{F("新出","しんしゅつ")}{F("漢字","かんじ")}{plannedNewCount}{F("文字","もじ")}を{F("覚","おぼ")}える！</span></>
          : <><PenTool size={20} className="shrink-0" /> <span className="min-w-0 leading-snug">{selectedGrade}{F("年生","ねんせい")}の{F("漢字","かんじ")}を{F("練習","れんしゅう")}！</span></>}
    </MotionButton>
    {/* ならった範囲の小さな表示。ボタンの下に置き、ボタンを押し下げない */}
    {footer}
  </div>
);

/** ドリルボタン */
const DrillButtons = ({ setView }) => (
  <div className="grid grid-cols-2 gap-2 shrink-0">
    <MotionButton variant="success" className="py-2.5 md:py-3 flex-col gap-1 text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_#065f46]" onClick={() => setView('myDrills')}><FileText size={20} /> マイドリル</MotionButton>
    <MotionButton variant="accent" className="py-2.5 md:py-3 flex-col gap-1 text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_#b45309]" onClick={() => setView('peerClient')}><Download size={20} /> {F("通信","つうしん")}でもらう</MotionButton>
  </div>
);

/** 特別トレーニング */
const SpecialTraining = ({ isUnlocked, startFlashcard, startSurvival, startBossBattle }) => (
  <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl p-2 md:p-2.5 relative overflow-hidden shrink-0">
    {!isUnlocked && (
      <div className="absolute inset-0 z-10 bg-[var(--panel)]/80 backdrop-blur-[2px] flex items-center justify-center">
        <span className="text-xs font-bold text-[var(--text)] bg-[var(--bg)] px-3 py-1.5 rounded-full border-2 border-[var(--text)] flex items-center gap-1 shadow-sm"><AlertCircle size={14} className="text-amber-500" /> <span>まずは{F("漢字","かんじ")}を{F("覚","おぼ")}えよう！</span></span>
      </div>
    )}
    <div className="grid grid-cols-3 gap-2">
      <MotionButton variant="secondary" onClick={startFlashcard} disabled={!isUnlocked} className="flex-col py-2.5 md:py-3 border-[2px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Zap size={18} className="text-amber-500" /> フラッシュ</MotionButton>
      <MotionButton variant="secondary" onClick={startSurvival} disabled={!isUnlocked} className="flex-col py-2.5 md:py-3 border-[2px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Flame size={18} className="text-rose-500" /> サバイバル</MotionButton>
      <MotionButton variant="secondary" onClick={startBossBattle} disabled={!isUnlocked} className="flex-col py-2.5 md:py-3 border-[2px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Ghost size={18} className="text-purple-500" /> ボスバトル</MotionButton>
    </div>
  </div>
);

/** ナビゲーションボタン（PC/タブレット用サイドバー向け） */
const NavButtons = ({ setView }) => (
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
const UnlockHints = ({ isTownEditorUnlocked, isCraftUnlocked }) => (
  <>
    {!isTownEditorUnlocked && (
      <div className="text-xs text-center text-[var(--text-muted)] bg-[var(--bg)] rounded-lg px-2 py-1 shrink-0">
        {F("漢字","かんじ")}を1つ{F("覚","おぼ")}えると「まちづくり」が{F("使","つか")}えるよ
      </div>
    )}
    {isTownEditorUnlocked && !isCraftUnlocked && (
      <div className="text-xs text-center text-[var(--text-muted)] bg-[var(--bg)] rounded-lg px-2 py-1 shrink-0">
        {F("漢字","かんじ")}を3つ{F("覚","おぼ")}えると「クラフト」が{F("使","つか")}えるよ
      </div>
    )}
  </>
);

/**
 * スマホ幅では画面全体を 1 つのスクロールにしている。スクロールバーは出ないので、
 * 下に続き（ミッション・ドリルなど）があるときは、下の端に「▼」を出して知らせる
 */
const ScrollMoreHint = ({ scrollRef, watch }) => {
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const update = () => setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [scrollRef, watch]);
  if (!more) return null;
  return (
    // 学習を始めるボタンに重ならないよう、下の端の 16px だけを使う
    <div className="sticky bottom-0 -mt-4 h-4 shrink-0 pointer-events-none flex items-end justify-center bg-gradient-to-t from-[var(--bg)] to-transparent" aria-hidden="true">
      <span className="rounded-full bg-[var(--panel)] border border-[var(--text)] px-2 py-[2px] text-[10px] leading-none font-black text-[var(--text)] shadow-sm">▼ したにも あるよ</span>
    </div>
  );
};

const HomeView = ({ setView, stats, setStats, startSession, startDrillSession, startDrillTest, startFlashcard, startSurvival, startBossBattle, levelInfo, dailyMissions, onClaimMission, isMobile }) => {
  const currentLevelInfo = levelInfo || getLevelInfo(stats.totalExp, stats.townMap);
  const { level } = currentLevelInfo;
  const [selectedGrade, setSelectedGrade] = useState(stats.targetGrade || 1);
  const handleGradeChange = (g) => { setSelectedGrade(g); let newStats = { ...stats, targetGrade: g }; setStats(newStats); StorageAPI.saveStats(newStats); };
  const today = getTodayString();
  const dailyProgress = getDailyLearningProgress(stats, today);
  const habitStatus = getHabitStatus(stats, today);
  const sessionSize = stats.settings?.sessionSize || 'normal';
  const baseSessionLimits = SESSION.SIZE_LIMITS[sessionSize] || SESSION.SIZE_LIMITS.normal;
  const sessionLimits = getGoalAwareSessionLimits(baseSessionLimits, dailyProgress);
  const learningRange = stats.settings?.learningRange;
  const learningPlan = useMemo(() => buildLearningPlan({
    kanjiData: KANJI_DATA,
    kanjiStats: stats.kanjiStats,
    selectedGrade,
    limits: sessionLimits,
    now: Date.now(),
    random: () => 0.5,
    range: learningRange,
    today,
  }), [stats.kanjiStats, selectedGrade, sessionLimits.review, sessionLimits.new, sessionLimits.total, learningRange, today]);
  const reviewTargetsCount = learningPlan.dueCount;
  const plannedReviewCount = learningPlan.reviewCount;
  const plannedNewCount = learningPlan.newCount;
  const plannedTotalCount = plannedReviewCount + plannedNewCount;
  const isReviewNeeded = reviewTargetsCount > 0;
  const reviewForecast = useMemo(
    () => getReviewForecast(stats.kanjiStats),
    [stats.kanjiStats],
  );
  const nextForecastDay = reviewForecast.days.slice(2).find((day) => day.count > 0);
  // 低学年も読めるように、漢字にはルビを付ける（ふりがなの設定に従う）
  const nextReviewHint = reviewTargetsCount > 0
    ? <>{F("復習","ふくしゅう")} {reviewTargetsCount}{F("字","じ")}</>
    : reviewForecast.todayCount > 0
      ? <>きょう{F("後","あと")}で {reviewForecast.todayCount}{F("字","じ")}</>
      : reviewForecast.tomorrowCount > 0
        ? <>あした {F("復習","ふくしゅう")}{reviewForecast.tomorrowCount}{F("字","じ")}</>
        : nextForecastDay
          ? <>{nextForecastDay.date.getMonth() + 1}/{nextForecastDay.date.getDate()} {F("復習","ふくしゅう")}{nextForecastDay.count}{F("字","じ")}</>
          : reviewForecast.nextReviewAt
            ? <>{F("次","つぎ")}は {new Date(reviewForecast.nextReviewAt).getMonth() + 1}/{new Date(reviewForecast.nextReviewAt).getDate()}</>
            : <>{F("復習","ふくしゅう")}は かんりょう</>;
  const prosperity = calculateProsperity(stats.townMap, reviewTargetsCount);
  const learnedCount = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new').length;
  const isSpecialTrainingUnlocked = learnedCount > 0;
  const satisfaction = calculateSatisfaction(stats);
  const satLabel = getSatisfactionLabel(satisfaction);

  const stage = getCurrentStage(level);

  const isCraftUnlocked = level >= 3;
  const isTownEditorUnlocked = level >= 1;

  const mobileScrollRef = useRef(null);
  const openTownEditor = useCallback(() => { audioCtrl.playSE('click'); setView('townEditor'); }, [setView]);

  const statusBar = <StatusBar levelInfo={currentLevelInfo} stage={stage} population={stats.population} satLabel={satLabel} coins={stats.coins} prosperity={prosperity} />;
  const expBar = <ExpBar levelInfo={currentLevelInfo} />;
  const dailyGoalCard = <DailyGoalCard dailyProgress={dailyProgress} habitStatus={habitStatus} streak={stats.streak} nextReviewHint={nextReviewHint} />;
  const townMapProps = {
    isTownEditorUnlocked,
    onOpenEditor: openTownEditor,
    townMap: stats.townMap,
    isDanger: isReviewNeeded,
    reviewCount: reviewTargetsCount,
    villagers: stats.villagers || EMPTY_VILLAGERS,
    exploredRadius: stats.exploredRadius || 3,
  };
  const gradeAndAction = (
    <GradeAndAction
      selectedGrade={selectedGrade}
      onGradeChange={handleGradeChange}
      onStart={startSession}
      isReviewNeeded={isReviewNeeded}
      dailyProgress={dailyProgress}
      plannedTotalCount={plannedTotalCount}
      plannedReviewCount={plannedReviewCount}
      plannedNewCount={plannedNewCount}
      footer={learningRange ? <Suspense fallback={null}><RangeStatusLine range={learningRange} kanjiStats={stats.kanjiStats} today={today} grade={selectedGrade} setStats={setStats} /></Suspense> : null}
    />
  );
  // 宿題があるときだけ出す（学習を始めるボタンの下）
  const hasHomework = (stats.myDrills || []).some((d) => d?.homework);
  const homeworkCard = hasHomework && (
    <Suspense fallback={null}><HomeworkCard drills={stats.myDrills} today={today} start={{ startDrillSession, startDrillTest }} onOpenList={() => setView('myDrills')} max={isMobile ? 2 : 3} /></Suspense>
  );
  const drillButtons = <DrillButtons setView={setView} />;
  const specialTraining = <SpecialTraining isUnlocked={isSpecialTrainingUnlocked} startFlashcard={startFlashcard} startSurvival={startSurvival} startBossBattle={startBossBattle} />;
  const unlockHints = <UnlockHints isTownEditorUnlocked={isTownEditorUnlocked} isCraftUnlocked={isCraftUnlocked} />;
  const missionsPanel = dailyMissions && dailyMissions.length > 0 && (
    <div className="shrink-0">
      <DailyMissionsPanel missions={dailyMissions} onClaim={onClaimMission} />
    </div>
  );

  // ━━━━━━━━━━ モバイルレイアウト（< md） ━━━━━━━━━━
  // 学年えらびと「きょうのN字」は、320x568 でもスクロールせずに見える位置（町のすぐ下）に置く。
  // 以前は町の下の小さなスクロール領域の中、ミッションのあとにあり、最初の画面に見えなかった
  if (isMobile) {
    return (
      <div ref={mobileScrollRef} className="flex flex-col h-full gap-1.5 overflow-y-auto pb-2">
        {/* ステータスバー */}
        {statusBar}
        {expBar}
        {dailyGoalCard}

        {/* タウンマップ（コンパクト）。宿題があれば左上に札を重ねる（下のカードは最初の画面の外になるため） */}
        <div className="relative shrink-0">
          <TownMap className="h-[20vh] min-h-[110px]" {...townMapProps} />
          {hasHomework && <Suspense fallback={null}><HomeworkBadge drills={stats.myDrills} today={today} /></Suspense>}
        </div>

        {gradeAndAction}
        {homeworkCard}

        {/* デイリーミッション */}
        {missionsPanel}
        {drillButtons}
        {specialTraining}
        {unlockHints}
        <ScrollMoreHint scrollRef={mobileScrollRef} watch={dailyMissions} />
      </div>
    );
  }

  // ━━━━━━━━━━ タブレット/PCレイアウト（>= md）━━━━━━━━━━
  return (
    <div className="flex h-full gap-3 overflow-hidden">
      {/* === LEFT: Town Map === */}
      <div className="flex-1 flex flex-col gap-2 min-w-0 h-full">
        {statusBar}
        {expBar}
        <TownMap className="flex-1 min-h-0" {...townMapProps} />
      </div>

      {/* === RIGHT: Controls === */}
      <div className="w-[340px] shrink-0 flex flex-col gap-2 h-full overflow-y-auto no-scrollbar">
        {dailyGoalCard}

        {/* Daily missions */}
        {missionsPanel}

        {gradeAndAction}
        {homeworkCard}
        {drillButtons}
        {specialTraining}
        <NavButtons setView={setView} />
        {unlockHints}
      </div>
    </div>
  );
};

export default HomeView;
