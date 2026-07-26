import React, { useState, useEffect, useCallback, useMemo, useRef, lazy } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { PenTool, Volume2, VolumeX, Settings, Users } from 'lucide-react';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useIsMobile } from './hooks/useIsMobile';
import { useViewNavigation } from './hooks/useViewNavigation';
import { EXIT_CONFIRM_WINDOW, isLearningView } from './systems/view-navigation';
import { usePrefetchKanji } from './hooks/usePrefetchKanji';
import { useCloudSync } from './hooks/useCloudSync';
import OfflineBanner from './components/ui/OfflineBanner';
import StorageErrorBanner from './components/ui/StorageErrorBanner';
import MobileBottomNav from './components/ui/MobileBottomNav';

import { StorageAPI, getLevelInfo } from './systems/storage';
import { calculateNextReview, migrateCard, recordPracticeAttempt } from './systems/srs';
import { buildLearningPlan, buildWeakKanjiPlan, getDailyLearningProgress, getGoalAwareSessionLimits } from './systems/learning-plan';
import { createSessionCheckpoint, restoreSessionCheckpoint } from './systems/session-checkpoint';
import { audioCtrl } from './systems/audio';
import { checkLevelUp, grantExpWithLevelRewards } from './utils/level-system';
import { SESSION, EXP, RARE_DROP, ECONOMY, DEBOUNCE, TEST } from './constants/gameConfig';

// Data
import { KANJI_DATA, KANJI_UNLOCK_EXTRA } from './data/kanji-data';
import { STORY_STAGES } from './data/story-stages';
import { createVillager, calculateSatisfaction, getSatisfactionLabel, getSatisfactionMultiplier } from './systems/residents';
import { calculateMaterialDrops } from './systems/crafting';
import { getDailyMissions, updateMissionProgress } from './data/daily-missions';
import { getLoginBonusDay, getLoginBonusReward, applyLoginBonus } from './data/login-bonus';
import { getTodayString } from './utils/date-utils';
import { getMotionPreference, shouldReduceMotion } from './utils/motion-preference';
import { recordSkillEvidence } from './systems/mastery';

// UI
import { PageWrapper, FullScreenWrapper, ErrorBoundary, Footer, BackExitHint, LeaveLearningDialog } from './components/ui';
import { F } from './components/ui/FormatKun';

// Pages - HomeViewは常にロード、他はlazy
import HomeView from './components/pages/HomeView';
const DictionaryView = lazy(() => import('./components/pages/DictionaryView'));
const AchievementView = lazy(() => import('./components/pages/AchievementView'));
const StatsView = lazy(() => import('./components/pages/StatsView'));
const ResultView = lazy(() => import('./components/pages/ResultView'));
const MyDrillsView = lazy(() => import('./components/pages/MyDrillsView'));
const DrillEditorView = lazy(() => import('./components/pages/DrillEditorView'));
const CraftView = lazy(() => import('./components/pages/CraftView'));
const SettingsView = lazy(() => import('./components/pages/SettingsView'));

// Town
const TownEditorView = lazy(() => import('./components/town/TownEditorView'));
const ResidentPanel = lazy(() => import('./components/town/ResidentPanel'));

// Gacha
const GachaView = lazy(() => import('./components/pages/GachaView'));

// Session & Training
const SessionView = lazy(() => import('./components/session/SessionView'));
const FlashcardView = lazy(() => import('./components/training/FlashcardView'));
const SurvivalView = lazy(() => import('./components/training/SurvivalView'));
const BossBattleView = lazy(() => import('./components/training/BossBattleView'));
const DrillTestView = lazy(() => import('./components/training/DrillTestView'));

// Social
const TeacherHostView = lazy(() => import('./components/social/TeacherHostView'));
const StudentClientView = lazy(() => import('./components/social/StudentClientView'));

// Tutorial & Phase 7
import TutorialOverlay from './components/tutorial/TutorialOverlay';
import LoginBonusPopup from './components/tutorial/LoginBonusPopup';
import ResidentCollectionPopup from './components/tutorial/ResidentCollectionPopup';
import FeatureHint from './components/tutorial/FeatureHint';

// テーマ別CSS変数（コンポーネント外に定義して再マウントを防ぐ）
const THEME_VARS = {
  default: `--bg: #fdfbf7; --primary: #ef4444; --secondary: #10b981; --accent: #fbbf24; --text: #292f36; --panel: #ffffff;`,
  dark: `--bg: #0f172a; --primary: #f43f5e; --secondary: #3b82f6; --accent: #f59e0b; --text: #e2e8f0; --panel: #1e293b;`,
  sakura: `--bg: #fdf2f8; --primary: #d946ef; --secondary: #f472b6; --accent: #fbcfe8; --text: #831843; --panel: #ffffff;`,
  ocean: `--bg: #f0f9ff; --primary: #0284c7; --secondary: #38bdf8; --accent: #7dd3fc; --text: #0c4a6e; --panel: #ffffff;`,
  sunset: `--bg: #fff7ed; --primary: #ea580c; --secondary: #f97316; --accent: #fcd34d; --text: #7c2d12; --panel: #ffffff;`,
  gold: `--bg: #fefce8; --primary: #b45309; --secondary: #eab308; --accent: #fef08a; --text: #713f12; --panel: #ffffff;`,
};

const GlobalStyle = ({ themeName, reducedMotion }) => {
  const tv = THEME_VARS[themeName] || THEME_VARS.default;
  const reducedMotionStyle = reducedMotion
    ? `body { transition: none; } [data-reduced-motion="true"] *, [data-reduced-motion="true"] *::before, [data-reduced-motion="true"] *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }`
    : '';
  return (
    <style>{`:root { ${tv} } body { font-family: 'Zen Maru Gothic', sans-serif; background-color: var(--bg); color: var(--text); touch-action: manipulation; transition: background-color 0.3s ease; } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } ::selection { background-color: var(--accent); color: var(--text); } ruby { ruby-align: center; ruby-position: over; vertical-align: baseline; } ruby rt { font-size: 0.5em; font-weight: 500; letter-spacing: 0; line-height: 1; } ruby rt:empty { display: inline-block; height: 0; overflow: hidden; } .ruby-text { line-height: 2.5; } ${reducedMotionStyle}`}</style>
  );
};

/** 設定の音量レベルID → 実音量値 */
const VOLUME_VALUES = { off: 0, low: 0.3, mid: 0.6, high: 1.0 };

/** セッションデータの初期値を生成する */
function createInitialSessionData(overrides = {}) {
  const data = {
    queue: [],
    remainingQueue: null,
    earnedExp: 0,
    oldExp: 0,
    expMultiplier: 1,
    perfectCount: 0,
    easyCount: 0,
    reviewedCount: 0,
    attemptCount: 0,
    correctCount: 0,
    newKanjiCount: 0,
    masteredCount: 0,
    unlockedItems: [],
    rareDrop: null,
    isDrill: false,
    isTest: false,
    isWeakPractice: false,
    newVillager: null,
    ...overrides,
  };
  return {
    ...data,
    remainingQueue: Array.isArray(data.remainingQueue) ? data.remainingQueue : data.queue,
  };
}

export default function App() {
  // URLパラメータ ?connect=XXXX でQRコードからの接続をハンドル
  const connectParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('connect');
    if (id && /^\d{4}$/.test(id)) {
      // パラメータを消してURLをクリーンにする
      window.history.replaceState({}, '', window.location.pathname);
      return id;
    }
    return null;
  }, []);

  const [initialAppState] = useState(() => {
    const loadedStats = StorageAPI.getStats();
    const savedCheckpoint = StorageAPI.getActiveSession();
    const restoredSession = restoreSessionCheckpoint(savedCheckpoint, KANJI_DATA);
    if (savedCheckpoint && !restoredSession) StorageAPI.clearActiveSession();
    return { loadedStats, restoredSession };
  });

  const initialView = connectParam ? 'peerClient' : initialAppState.restoredSession ? 'session' : 'home';
  // 端末の「戻る」操作でアプリが終了しないよう、いつ横取りするかを保持する
  const backInterceptorRef = useRef(null);
  const [exitHintAt, setExitHintAt] = useState(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const handleBeforeBack = useCallback((currentView) => Boolean(backInterceptorRef.current?.(currentView)), []);
  const handleExitBlocked = useCallback(() => setExitHintAt(Date.now()), []);
  // 画面下のナビゲーションバーや端からのスワイプによる戻る操作を、アプリ内の1つ前の画面へ割り当てる
  const { view, navigate: setView } = useViewNavigation(initialView, {
    onBeforeBack: handleBeforeBack,
    onExitBlocked: handleExitBlocked,
  });
  const [isMuted, setIsMuted] = useState(audioCtrl.muted);
  const [stats, setStats] = useState(initialAppState.loadedStats);
  const cloudSync = useCloudSync({ stats, setStats });
  useEffect(() => {
    if (cloudSync.needsPasswordReset) setView('settings');
  }, [cloudSync.needsPasswordReset]);
  const [sessionData, setSessionDataState] = useState(() => createInitialSessionData(initialAppState.restoredSession || {}));
  const sessionDataRef = useRef(sessionData);
  const setSessionData = useCallback((update) => {
    const next = typeof update === 'function' ? update(sessionDataRef.current) : update;
    sessionDataRef.current = next;
    setSessionDataState(next);
  }, []);
  const [isResumedSession, setIsResumedSession] = useState(Boolean(initialAppState.restoredSession));
  const [hostDrill, setHostDrill] = useState(null);

  // Phase 5: チュートリアル
  const [showTutorial, setShowTutorial] = useState(!stats.tutorialCompleted && stats.totalExp === 0);
  // Phase 7: ログインボーナス
  const [showLoginBonus, setShowLoginBonus] = useState(false);
  const [loginBonusReward, setLoginBonusReward] = useState(null);
  // Phase 7: 住民素材収集
  const [showResidentCollection, setShowResidentCollection] = useState(false);
  const [residentCollectionResult, setResidentCollectionResult] = useState(null);
  // Phase 7: デイリーミッション
  const [dailyMissions, setDailyMissions] = useState([]);
  // Phase 5: ヒント
  const [seenHints, setSeenHints] = useState(stats.seenHints || []);
  const isOnline = useOnlineStatus();
  const isMobile = useIsMobile();
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = useState(() => (
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ));
  const motionPreference = getMotionPreference(stats.settings);
  const isReducedMotion = shouldReduceMotion(motionPreference, systemPrefersReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event) => setSystemPrefersReducedMotion(event.matches);
    handleChange(mediaQuery);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }

    return undefined;
  }, []);

  // オンライン時に対象学年の漢字筆順データを事前キャッシュ（オフライン学習対応）
  usePrefetchKanji(isOnline, stats.targetGrade, KANJI_DATA);

  const levelInfo = useMemo(() => getLevelInfo(stats.totalExp, stats.townMap), [stats.totalExp, stats.townMap]);

  // コア学習中は回答記録と残りキューを同じタイミングで端末へ保存する。
  useEffect(() => {
    if (view !== 'session' || !sessionData.remainingQueue?.length) return;
    const checkpoint = createSessionCheckpoint(sessionData);
    if (!checkpoint) return;
    StorageAPI.saveStatsImmediate(stats);
    StorageAPI.saveActiveSession(checkpoint);
  }, [view, stats, sessionData]);

  // ログインボーナス＆デイリーミッション初期化関数
  // 関数型 setStats を使い、stale な currentStats を上書きしないようにする
  const refreshDailyData = useCallback((currentStats, isInitial = false) => {
    const today = getTodayString();

    // 日付が変わっていなければ何もしない（初回ロード時を除く）
    const dateChanged = currentStats.dailyMissionsDate !== today
      || currentStats.lastLoginBonusDate !== today
      || currentStats.lastCollectionDate !== today;
    if (!isInitial && !dateChanged) return;

    let needsSave = false;
    let missionsToSet = null;

    // デイリーミッション初期化
    if (currentStats.dailyMissionsDate !== today) {
      missionsToSet = getDailyMissions(today).map(m => ({ ...m, current: 0, claimed: false }));
      setDailyMissions(missionsToSet);
      needsSave = true;
    } else if (isInitial) {
      setDailyMissions(currentStats.dailyMissions || []);
    }

    // ログインボーナス受取
    if (currentStats.tutorialCompleted && currentStats.lastLoginBonusDate !== today && (currentStats.streak || 0) >= 1) {
      const bonusDay = getLoginBonusDay(currentStats.streak);
      const reward = getLoginBonusReward(bonusDay);
      setLoginBonusReward({ ...reward, bonusDay, streak: currentStats.streak });
      setShowLoginBonus(true);
    }

    const willCollect = currentStats.lastCollectionDate !== today && (currentStats.villagers || []).length > 0;

    if (needsSave || willCollect) {
      setStats(prev => {
        let updated = { ...prev };
        if (missionsToSet) {
          updated.dailyMissions = missionsToSet;
          updated.dailyMissionsDate = today;
        }
        if (willCollect && updated.lastCollectionDate !== today) {
          updated = StorageAPI.collectDailyTownResources(updated, today);
          if (updated.lastCollectionResult) {
            const sat = updated.satisfaction || 0;
            setResidentCollectionResult({
              result: updated.lastCollectionResult,
              satisfaction: sat,
              satLabel: getSatisfactionLabel(sat),
            });
            setShowResidentCollection(true);
          }
        }
        StorageAPI.saveStats(updated);
        return updated;
      });
    }
  }, []);

  // 初回ロード時
  useEffect(() => {
    refreshDailyData(stats, true);
    // 保存済みの音量設定を適用
    const savedLevel = stats.settings?.volumeLevel;
    if (savedLevel && VOLUME_VALUES[savedLevel] !== undefined) {
      audioCtrl.volume = VOLUME_VALUES[savedLevel];
    }
  }, []);

  // 日付変更の監視（開きっぱなし対策）
  useEffect(() => {
    // 1分ごとに日付変更をチェック
    const timer = setInterval(() => {
      refreshDailyData(StorageAPI.getStats());
    }, DEBOUNCE.DATE_CHECK_INTERVAL);

    // タブに戻った時にチェック
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshDailyData(StorageAPI.getStats());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshDailyData]);

  // フォントはindex.htmlで事前読み込み済み

  useEffect(() => {
    if (isMuted) { audioCtrl.stopBGM(); return; }
    const gameViews = new Set(['session', 'survival', 'flashcard', 'boss', 'drillTest']);
    if (gameViews.has(view)) {
      audioCtrl.playBGM(view === 'boss' ? 'boss' : 'game');
    } else if (view === 'result') {
      audioCtrl.stopBGM();
    } else {
      audioCtrl.playBGM('home');
    }
  }, [view, isMuted]);

  // チュートリアル完了
  const handleTutorialComplete = () => {
    setShowTutorial(false);
    const newStats = { ...stats, tutorialCompleted: true };
    setStats(newStats);
    StorageAPI.saveStats(newStats);
    audioCtrl.playSE('success');
  };

  // ログインボーナス受取
  const handleClaimLoginBonus = () => {
    if (!loginBonusReward) return;
    const today = getTodayString();
    const newStats = applyLoginBonus({ ...stats, lastLoginBonusDate: today }, loginBonusReward);
    setStats(newStats);
    StorageAPI.saveStats(newStats);
    setShowLoginBonus(false);
    audioCtrl.playSE('coin');
  };

  // デイリーミッション受取
  const handleClaimMission = (mission) => {
    const updated = dailyMissions.map(m => m.id === mission.id ? { ...m, claimed: true } : m);
    setDailyMissions(updated);
    // rewardExpでレベルアップした場合も報酬（コイン・アイテム・探索半径）を確実に付与する
    const { stats: granted, levelUpData } = grantExpWithLevelRewards(stats, mission.rewardExp || 0);
    const newStats = {
      ...granted,
      coins: (granted.coins || 0) + mission.reward,
      dailyMissions: updated
    };
    setStats(newStats);
    StorageAPI.saveStats(newStats);
    audioCtrl.playSE('coin');
    if (levelUpData.isLevelUp) {
      setTimeout(() => audioCtrl.playSE('level_up', 0.5), 400);
    }
  };

  // ヒント消去
  const handleDismissHint = (featureKey) => {
    const newSeen = [...seenHints, featureKey];
    setSeenHints(newSeen);
    const newStats = { ...stats, seenHints: newSeen };
    setStats(newStats);
    StorageAPI.saveStats(newStats);
  };

  const beginSession = useCallback((nextView, overrides) => {
    StorageAPI.clearActiveSession();
    setIsResumedSession(false);
    setSessionData(createInitialSessionData(overrides));
    setView(nextView);
  }, [setSessionData]);

  const handleSessionProgress = useCallback((remainingQueue) => {
    setSessionData((current) => ({ ...current, remainingQueue }));
  }, [setSessionData]);

  const abandonLearningSession = useCallback(() => {
    StorageAPI.clearActiveSession();
    setIsResumedSession(false);
    setView('home');
  }, [setView]);

  // 戻る操作の横取り。オーバーレイ表示中と学習中は、画面を離れる前に受け止める
  useEffect(() => {
    backInterceptorRef.current = (currentView) => {
      if (showTutorial || showLoginBonus) return true; // 進行が必要な案内中は戻る操作を無効化
      if (showResidentCollection) {
        setShowResidentCollection(false);
        audioCtrl.playSE('click');
        return true;
      }
      if (showLeaveConfirm) {
        setShowLeaveConfirm(false);
        return true;
      }
      if (isLearningView(currentView)) {
        setShowLeaveConfirm(true); // 誤操作で学習が終わらないよう確認する
        return true;
      }
      return false;
    };
  });

  // 「もう1回でアプリを閉じます」の案内は一定時間で消す
  useEffect(() => {
    if (!exitHintAt) return undefined;
    const timer = setTimeout(() => setExitHintAt(0), EXIT_CONFIRM_WINDOW);
    return () => clearTimeout(timer);
  }, [exitHintAt]);

  const handleLeaveLearning = useCallback(() => {
    setShowLeaveConfirm(false);
    abandonLearningSession();
  }, [abandonLearningSession]);

  const startSession = (selectedGrade) => {
    audioCtrl.init();
    const sessionSize = stats.settings?.sessionSize || 'normal';
    const baseLimits = SESSION.SIZE_LIMITS[sessionSize] || SESSION.SIZE_LIMITS.normal;
    const dailyProgress = getDailyLearningProgress(stats, getTodayString());
    const limits = getGoalAwareSessionLimits(baseLimits, dailyProgress);
    const { queue } = buildLearningPlan({
      kanjiData: KANJI_DATA,
      kanjiStats: stats.kanjiStats,
      selectedGrade,
      limits,
    });
    const expMultiplier = getSatisfactionMultiplier(calculateSatisfaction(stats));
    if (queue.length > 0) {
      beginSession('session', { queue, oldExp: stats.totalExp, expMultiplier });
    }
  };

  const startDrillSession = (drill) => {
    audioCtrl.init();
    const queue = KANJI_DATA.filter(k => drill.kanjis?.includes(k.id));
    const expMultiplier = getSatisfactionMultiplier(calculateSatisfaction(stats));
    if (queue.length > 0) {
      beginSession('session', { queue, oldExp: stats.totalExp, expMultiplier, isDrill: true });
    }
  };

  const startDrillTest = (drill, questionCount) => {
    audioCtrl.init();
    let candidates = KANJI_DATA.filter(k => drill.kanjis?.includes(k.id));
    if (questionCount < candidates.length) {
      candidates.sort((a, b) => {
        const aMistakes = stats.kanjiStats?.[a.id]?.mistakes || 0;
        const bMistakes = stats.kanjiStats?.[b.id]?.mistakes || 0;
        if (bMistakes !== aMistakes) return bMistakes - aMistakes;
        const aReview = stats.kanjiStats?.[a.id]?.nextReview || 0;
        const bReview = stats.kanjiStats?.[b.id]?.nextReview || 0;
        return aReview - bReview;
      });
      candidates = candidates.slice(0, questionCount);
    }
    candidates.sort(() => Math.random() - 0.5);
    const expMultiplier = getSatisfactionMultiplier(calculateSatisfaction(stats));
    if (candidates.length > 0) {
      beginSession('drillTest', { queue: candidates, oldExp: stats.totalExp, expMultiplier, isDrill: true, isTest: true });
    }
  };

  const startSingleSession = (kanji) => {
    audioCtrl.init();
    const expMultiplier = getSatisfactionMultiplier(calculateSatisfaction(stats));
    beginSession('session', { queue: [kanji], oldExp: stats.totalExp, expMultiplier });
  };

  const startFlashcard = () => {
    audioCtrl.init();
    const learned = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new');
    if (learned.length === 0) return;
    const queue = [...learned].sort(() => Math.random() - 0.5).slice(0, 10);
    const expMultiplier = getSatisfactionMultiplier(calculateSatisfaction(stats));
    beginSession('flashcard', { queue, oldExp: stats.totalExp, expMultiplier });
  };

  const startWeakSession = () => {
    audioCtrl.init();
    const { queue } = buildWeakKanjiPlan({
      kanjiData: KANJI_DATA,
      kanjiStats: stats.kanjiStats,
    });
    if (queue.length === 0) return;

    const expMultiplier = getSatisfactionMultiplier(calculateSatisfaction(stats));
    beginSession('session', {
      queue,
      oldExp: stats.totalExp,
      expMultiplier,
      isDrill: true,
      isWeakPractice: true,
    });
  };

  const startSurvival = () => {
    audioCtrl.init();
    const learned = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new');
    if (learned.length === 0) return;
    const queue = [...learned].sort(() => Math.random() - 0.5);
    const expMultiplier = getSatisfactionMultiplier(calculateSatisfaction(stats));
    beginSession('survival', { queue, oldExp: stats.totalExp, expMultiplier });
  };

  const startBossBattle = () => {
    audioCtrl.init();
    const learned = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new');
    if (learned.length === 0) return;
    const queue = [...learned]
      .sort((a, b) => (stats.kanjiStats?.[b.id]?.mistakes || 0) - (stats.kanjiStats?.[a.id]?.mistakes || 0))
      .slice(0, 10);
    // 10問に満たない場合はランダムに複製して埋める
    while (queue.length > 0 && queue.length < 10) {
      queue.push(queue[Math.floor(Math.random() * queue.length)]);
    }
    const expMultiplier = getSatisfactionMultiplier(calculateSatisfaction(stats));
    beginSession('boss', { queue, oldExp: stats.totalExp, expMultiplier });
  };

  const handleRecordSkillEvidence = useCallback((kanjiObj, updates) => {
    if (!kanjiObj?.id || !Array.isArray(updates) || updates.length === 0) return;
    setStats(s => {
      const latest = migrateCard(s.kanjiStats?.[kanjiObj.id]);
      return {
        ...s,
        kanjiStats: {
          ...s.kanjiStats,
          [kanjiObj.id]: {
            ...latest,
            skillMastery: recordSkillEvidence(latest, updates),
          },
        },
      };
    });
  }, []);

  const handleUpdateStat = (kanjiObj, evalType, { skills = [] } = {}) => {
    const id = kanjiObj.id;
    const cur = migrateCard(stats.kanjiStats?.[id]);
    const curWithMastery = skills.length > 0
      ? { ...cur, skillMastery: recordSkillEvidence(cur, skills.map(skill => ({ skill, evidence: evalType }))) }
      : cur;
    if (sessionData.isDrill) {
      setStats(s => {
        const latest = migrateCard(s.kanjiStats?.[id]);
        const latestWithMastery = skills.length > 0
          ? { ...latest, skillMastery: recordSkillEvidence(latest, skills.map(skill => ({ skill, evidence: evalType }))) }
          : latest;
        return {
          ...s,
          kanjiStats: {
            ...s.kanjiStats,
            [id]: {
              ...latestWithMastery,
              ...recordPracticeAttempt(latestWithMastery, evalType),
            },
          },
        };
      });
      setSessionData(d => ({
        ...d,
        earnedExp: d.earnedExp + (evalType === 'again' ? 0 : EXP.DRILL),
        reviewedCount: (d.reviewedCount || 0) + (evalType === 'again' ? 0 : 1),
        attemptCount: (d.attemptCount || 0) + 1,
        correctCount: (d.correctCount || 0) + (evalType === 'again' ? 0 : 1),
      }));
      return evalType !== 'again';
    }

    const next = calculateNextReview(curWithMastery, evalType);
    const wasNew = curWithMastery.status === 'new';
    const isMastering = next.graduated && next.interval >= 7 * 24 * 60 * 60 * 1000;
    const newStatus = isMastering ? 'mastered' : next.graduated ? 'review' : 'learning';
    let exp = 0; let unlockedItem = null; let newVillager = null;

    if (evalType !== 'again') {
      const baseExp = wasNew ? EXP.NEW_KANJI : evalType === 'easy' ? EXP.EASY : evalType === 'good' ? EXP.GOOD : EXP.HARD;
      exp = Math.round(baseExp * (sessionData.expMultiplier || 1));

      // 素材ドロップ（漢字回答成功時）
      const drops = calculateMaterialDrops(kanjiObj);
      if (Object.keys(drops).length > 0) {
        setStats(s => {
          const newMats = { ...(s.materials || {}) };
          Object.entries(drops).forEach(([matId, amount]) => {
            newMats[matId] = (newMats[matId] || 0) + amount;
          });
          return { ...s, materials: newMats };
        });
      }

      if (isMastering && cur.status !== 'mastered') {
        const unlockId = kanjiObj.unlocks || KANJI_UNLOCK_EXTRA[id];
        if (unlockId && !stats.unlockedKanji?.includes(id)) {
          unlockedItem = unlockId;
          setStats(s => ({ ...s, unlockedKanji: [...(s.unlockedKanji || []), id] }));
        }

        const C = 25; // 50×50マップの中心
        const clearedKeys = Object.keys(stats.townMap || {}).filter(k => {
          const v = stats.townMap[k];
          const [cx, cy] = k.split(',').map(Number);
          const d = Math.max(Math.abs(cx - C), Math.abs(cy - C));
          return d <= (stats.exploredRadius || 3) && (v === 't_cleared' || v === 't_grass' || v === 't_road');
        });
        const spawnKey = clearedKeys[Math.floor(Math.random() * clearedKeys.length)] || `${C},${C}`;
        const [vx, vy] = spawnKey.split(',').map(Number);
        newVillager = createVillager(kanjiObj, vx, vy);

        // 以前の漢字習得数ベースでの探索半径拡大は廃止しレベルシステムに統合
      }
    }

    setStats(s => ({
      ...s,
      kanjiStats: {
        ...s.kanjiStats,
        [id]: {
          ...curWithMastery,
          ...next,
          status: newStatus,
          mistakes: evalType === 'again' ? (curWithMastery.mistakes || 0) + 1 : (curWithMastery.mistakes || 0),
          ...recordPracticeAttempt(curWithMastery, evalType),
        },
      },
      ...(newVillager ? { population: (s.population || 0) + 1, villagers: [...(s.villagers || []), newVillager] } : {}),
    }));
    setSessionData(d => ({
      ...d,
      earnedExp: d.earnedExp + exp,
      reviewedCount: (d.reviewedCount || 0) + (evalType === 'again' ? 0 : 1),
      attemptCount: (d.attemptCount || 0) + 1,
      correctCount: (d.correctCount || 0) + (evalType === 'again' ? 0 : 1),
      newKanjiCount: (d.newKanjiCount || 0) + (wasNew ? 1 : 0),
      masteredCount: (d.masteredCount || 0) + (isMastering && cur.status !== 'mastered' ? 1 : 0),
      unlockedItems: unlockedItem ? [...d.unlockedItems, unlockedItem] : d.unlockedItems,
      newVillager: d.newVillager || newVillager,
    }));
    return evalType !== 'again';
  };

  const handleRecordPerfect = useCallback(() => {
    setSessionData(d => ({
      ...d,
      perfectCount: d.perfectCount + 1,
      earnedExp: d.earnedExp + Math.round(EXP.PERFECT_BONUS * (d.expMultiplier || 1))
    }));
  }, []);
  const handleRecordEasy = useCallback(() => { setSessionData(d => ({ ...d, easyCount: d.easyCount + 1 })); }, []);

  const handleFinishSession = (additionalResults = {}) => {
    // setSessionData はrefも同期更新するため、最後の回答直後でも最新集計を確定できる。
    const activeSession = sessionDataRef.current;
    const totalExp = activeSession.earnedExp + (additionalResults.exp || 0);
    const coinBonus = Math.floor(totalExp / ECONOMY.EXP_TO_COIN_DIVISOR) + (additionalResults.coins || 0);
    const rareChance = RARE_DROP.BASE_CHANCE + (stats.streak * RARE_DROP.STREAK_BONUS);
    let rareDrop = additionalResults.rareDrop || null;
    if (!rareDrop && Math.random() < Math.min(rareChance, RARE_DROP.MAX_CHANCE)) {
      rareDrop = RARE_DROP.ITEMS[Math.floor(Math.random() * RARE_DROP.ITEMS.length)];
    }
    
    // レベルアップ判定と報酬計算
    const oldExp = activeSession.oldExp;
    const newExp = oldExp + totalExp;
    const levelUpData = checkLevelUp(oldExp, newExp);
    
    let earnedCoins = coinBonus;
    const unlockedItemsThisSession = [...activeSession.unlockedItems];
    let addedRadius = 0;

    if (levelUpData.isLevelUp) {
      levelUpData.rewards.forEach(({ reward }) => {
        if (!reward) return;
        if (reward.type === 'coins') earnedCoins += reward.amount;
        if (reward.type === 'item') {
          for(let i=0; i<reward.amount; i++) unlockedItemsThisSession.push(reward.id);
        }
        if (reward.type === 'radius') addedRadius = Math.max(addedRadius, reward.amount);
      });
      // ファンファーレ鳴らす
      setTimeout(() => audioCtrl.playSE('level_up', 0.5), 500);
    }

    const finalSessionData = { 
      ...activeSession,
      earnedExp: totalExp, 
      rareDrop, 
      perfectCount: activeSession.perfectCount + (additionalResults.perfectCount || 0),
      reviewedCount: activeSession.reviewedCount + (additionalResults.reviewedCount || 0),
      attemptCount: activeSession.attemptCount + (additionalResults.attemptCount || 0),
      correctCount: activeSession.correctCount
        + (additionalResults.correctCount ?? additionalResults.reviewedCount ?? 0),
      unlockedItems: unlockedItemsThisSession,
      levelUpData // ResultViewに渡すレベルアップ情報
    };
    
    setSessionData(finalSessionData);
    setStats(prevStats => {
      const copy = JSON.parse(JSON.stringify(prevStats));
      const newStats = StorageAPI.updateDaily(copy, totalExp, finalSessionData);
      newStats.coins = (newStats.coins || 0) + earnedCoins;
      // 半径拡大
      if (addedRadius > 0) newStats.exploredRadius = Math.max(newStats.exploredRadius || 3, addedRadius);
      // セッション数カウント更新
      newStats.sessionCount = (newStats.sessionCount || 0) + 1;

      // learningフェーズの漢字がセッション直後にお化けとして出ないよう、
      // nextReviewに猶予を持たせる
      const minNextReview = Date.now() + SESSION.GRACE_PERIOD;
      activeSession.queue.forEach(k => {
        const ks = newStats.kanjiStats?.[k.id];
        if (ks && !ks.graduated && ks.status !== 'new' && ks.nextReview < minNextReview) {
          ks.nextReview = minNextReview;
        }
      });

      StorageAPI.saveStatsImmediate(newStats);
      return newStats;
    });

    // デイリーミッション進捗更新
    setDailyMissions(prev => {
      const reviewCount = activeSession.reviewedCount + (additionalResults.reviewedCount || 0);
      const perfectCount = activeSession.perfectCount + (additionalResults.perfectCount || 0);
      const newKanjiCount = (activeSession.newKanjiCount || 0) + (additionalResults.newKanjiCount || 0);
      const masteredCount = (activeSession.masteredCount || 0) + (additionalResults.masteredCount || 0);
      let updated = updateMissionProgress(prev, 'session', 1);
      updated = updateMissionProgress(updated, 'review', reviewCount);
      updated = updateMissionProgress(updated, 'perfect', perfectCount);
      updated = updateMissionProgress(updated, 'exp', totalExp);
      updated = updateMissionProgress(updated, 'new_kanji', newKanjiCount);
      updated = updateMissionProgress(updated, 'master', masteredCount);
      updated = updateMissionProgress(updated, 'earn_coins', coinBonus);
      // statsに保存
      setStats(s => { const ns = { ...s, dailyMissions: updated }; StorageAPI.saveStats(ns); return ns; });
      return updated;
    });

    StorageAPI.clearActiveSession();
    setIsResumedSession(false);
    setView('result');
  };

  // ボスバトル敗北処理
  const handleBossDefeat = (defeatResults = {}) => {
    // 失敗した漢字を復習リストに追加（nextReviewを即時に設定）
    if (defeatResults.failedKanji && defeatResults.failedKanji.length > 0) {
      setStats(s => {
        const newKanjiStats = { ...s.kanjiStats };
        defeatResults.failedKanji.forEach(k => {
          if (newKanjiStats[k.id]) {
            newKanjiStats[k.id] = { ...newKanjiStats[k.id], nextReview: Date.now(), mistakes: (newKanjiStats[k.id].mistakes || 0) + 1 };
          }
        });
        const ns = { ...s, kanjiStats: newKanjiStats };
        StorageAPI.saveStats(ns);
        return ns;
      });
    }
    // 敗北時は報酬半額でリザルトへ
    handleFinishSession({
      exp: defeatResults.exp || 0,
      coins: defeatResults.coins || 0,
      perfectCount: defeatResults.perfectCount || 0,
    });
  };

  const themeOverride = stats.settings?.themeOverride || 'auto';
  const activeThemeName = themeOverride === 'auto' ? levelInfo.themeName : themeOverride;

  return (
    <MotionConfig reducedMotion={isReducedMotion ? 'always' : 'never'}>
      <div data-reduced-motion={isReducedMotion ? 'true' : 'false'} className="flex flex-col h-[100dvh] w-full bg-[var(--bg)] relative overflow-hidden transition-colors duration-500">
      <GlobalStyle themeName={activeThemeName} reducedMotion={isReducedMotion} />

      {/* ストレージ保存失敗バナー（オフラインバナーより上に表示） */}
      <StorageErrorBanner />

      {/* オフラインバナー */}
      {!isOnline && <OfflineBanner />}

      {/* Phase 5: チュートリアルオーバーレイ */}
      <AnimatePresence>
        {showTutorial && <TutorialOverlay onComplete={handleTutorialComplete} />}
      </AnimatePresence>

      {/* Phase 7: ログインボーナスポップアップ */}
      <AnimatePresence>
        {showLoginBonus && !showTutorial && loginBonusReward && (
          <LoginBonusPopup
            streak={loginBonusReward.streak}
            bonusDay={loginBonusReward.bonusDay}
            reward={loginBonusReward}
            onClaim={handleClaimLoginBonus}
          />
        )}
      </AnimatePresence>
      {/* Phase 7: 住民素材収集ポップアップ */}
      <AnimatePresence>
        {showResidentCollection && !showTutorial && !showLoginBonus && residentCollectionResult && (
          <ResidentCollectionPopup
            result={residentCollectionResult.result}
            satisfaction={residentCollectionResult.satisfaction}
            satLabel={residentCollectionResult.satLabel}
            onConfirm={() => {
              setShowResidentCollection(false);
              audioCtrl.playSE('click');
            }}
          />
        )}
      </AnimatePresence>

      {/* 学習中の戻る操作の確認 */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <LeaveLearningDialog
            onCancel={() => setShowLeaveConfirm(false)}
            onLeave={handleLeaveLearning}
          />
        )}
      </AnimatePresence>

      {/* ホームでの戻る操作の案内（1回目ではアプリを閉じない） */}
      <AnimatePresence>
        {exitHintAt > 0 && <BackExitHint />}
      </AnimatePresence>

      {view !== 'session' && view !== 'townEditor' && view !== 'flashcard' && view !== 'survival' && view !== 'boss' && view !== 'drillTest' && (
        <header className="flex-shrink-0 bg-[var(--panel)]/90 backdrop-blur border-b-[3px] md:border-b-[4px] border-[var(--text)] py-2 md:py-3 px-3 md:px-5 flex justify-between items-center z-50 sticky top-0 shadow-[0_4px_0_var(--text)] transition-colors duration-500" role="banner">
          <button className="flex items-center cursor-pointer gap-1.5 md:gap-2 bg-transparent border-none p-0 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] rounded-lg" onClick={() => { audioCtrl.playSE('click'); setView('home'); }} aria-label="ホームに戻る">
            <div className="bg-[var(--primary)] p-1 md:p-1.5 rounded-lg text-[var(--panel)] shadow-sm border-2 border-[var(--text)]" aria-hidden="true"><PenTool size={isMobile ? 18 : 22} strokeWidth={3} /></div>
            <h1 className="text-base md:text-xl font-black text-[var(--text)] tracking-wide">マイ{F("漢字","かんじ")}タウン</h1>
          </button>
          <nav className="flex items-center gap-0.5 md:gap-1" aria-label="メイン操作">
            <button onClick={() => setIsMuted(audioCtrl.toggle())} aria-label={isMuted ? "音をオンにする" : "音をオフにする"} aria-pressed={!isMuted} className="text-[var(--text)] opacity-50 hover:opacity-100 p-1.5 md:p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-2 border-transparent hover:border-[var(--text)] hover:bg-[var(--bg)] min-w-[40px] min-h-[40px] md:min-w-[44px] md:min-h-[44px] flex items-center justify-center">
              {isMuted ? <VolumeX size={isMobile ? 20 : 24} aria-hidden="true" /> : <Volume2 size={isMobile ? 20 : 24} className="text-[var(--secondary)]" aria-hidden="true" />}
            </button>
            <button onClick={() => { audioCtrl.playSE('click'); setView('settings'); }} aria-label="設定を開く" className="text-[var(--text)] opacity-50 hover:opacity-100 p-1.5 md:p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-2 border-transparent hover:border-[var(--text)] hover:bg-[var(--bg)] min-w-[40px] min-h-[40px] md:min-w-[44px] md:min-h-[44px] flex items-center justify-center">
              <Settings size={isMobile ? 20 : 24} aria-hidden="true" />
            </button>
          </nav>
        </header>
      )}

      <main className="flex-grow relative overflow-hidden p-0 md:p-4 min-h-0">
        {/* Suspense境界はPageWrapper/FullScreenWrapper内部にある。
            AnimatePresenceの外側でサスペンドを捕捉するとツリー全体が
            非表示化されて遷移状態が壊れ、ホワイトアウトするため。 */}
        <AnimatePresence mode="wait">
          {view === 'home' && <PageWrapper key="home" wide><ErrorBoundary onReset={() => setView('home')}><HomeView setView={setView} stats={stats} setStats={setStats} startSession={startSession} startFlashcard={startFlashcard} startSurvival={startSurvival} startBossBattle={startBossBattle} levelInfo={levelInfo} dailyMissions={dailyMissions} onClaimMission={handleClaimMission} isMobile={isMobile} /></ErrorBoundary></PageWrapper>}
          {view === 'dictionary' && <PageWrapper key="dict" wide><ErrorBoundary onReset={() => setView('home')}><FeatureHint featureKey="dictionary" seenHints={seenHints} onDismiss={handleDismissHint} /><DictionaryView kanjiStats={stats.kanjiStats} onBack={() => setView('home')} onSelectKanji={startSingleSession} /></ErrorBoundary></PageWrapper>}
          {view === 'townEditor' && <FullScreenWrapper key="townEditor"><ErrorBoundary onReset={() => setView('home')}><TownEditorView setView={setView} stats={stats} setStats={setStats} onCraft={() => {
                setDailyMissions(prev => {
                  const updated = updateMissionProgress(prev, 'craft', 1);
                  setStats(s => { const ns = { ...s, dailyMissions: updated }; StorageAPI.saveStats(ns); return ns; });
                  return updated;
                });
              }} onPlace={() => {
                setDailyMissions(prev => {
                  const updated = updateMissionProgress(prev, 'place', 1);
                  setStats(s => { const ns = { ...s, dailyMissions: updated }; StorageAPI.saveStats(ns); return ns; });
                  return updated;
                });
              }} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'residents' && <PageWrapper key="residents"><ErrorBoundary onReset={() => setView('home')}><FeatureHint featureKey="residents" seenHints={seenHints} onDismiss={handleDismissHint} /><ResidentPanel stats={stats} setView={setView} /></ErrorBoundary></PageWrapper>}
          {view === 'craft' && <PageWrapper key="craft"><ErrorBoundary onReset={() => setView('home')}><FeatureHint featureKey="craft" seenHints={seenHints} onDismiss={handleDismissHint} /><CraftView stats={stats} setStats={setStats} setView={setView} onCraft={() => {
                setDailyMissions(prev => {
                  const updated = updateMissionProgress(prev, 'craft', 1);
                  setStats(s => { const ns = { ...s, dailyMissions: updated }; StorageAPI.saveStats(ns); return ns; });
                  return updated;
                });
              }} /></ErrorBoundary></PageWrapper>}
          {view === 'achievements' && <PageWrapper key="achievements"><ErrorBoundary onReset={() => setView('home')}><FeatureHint featureKey="achievements" seenHints={seenHints} onDismiss={handleDismissHint} /><AchievementView setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></PageWrapper>}
          {view === 'stats' && <PageWrapper key="stats"><ErrorBoundary onReset={() => setView('home')}><FeatureHint featureKey="stats" seenHints={seenHints} onDismiss={handleDismissHint} /><StatsView setView={setView} stats={stats} startWeakSession={startWeakSession} /></ErrorBoundary></PageWrapper>}
          {view === 'settings' && <PageWrapper key="settings"><ErrorBoundary onReset={() => setView('home')}><SettingsView setView={setView} stats={stats} setStats={setStats} isMuted={isMuted} setIsMuted={setIsMuted} levelInfo={levelInfo} cloudSync={cloudSync} /></ErrorBoundary></PageWrapper>}
          {view === 'myDrills' && <PageWrapper key="myDrills"><ErrorBoundary onReset={() => setView('home')}><MyDrillsView setView={setView} stats={stats} setStats={setStats} startDrillSession={startDrillSession} startDrillTest={startDrillTest} setHostDrill={setHostDrill} /></ErrorBoundary></PageWrapper>}
          {view === 'drillEditor' && <PageWrapper key="drillEditor" wide><ErrorBoundary onReset={() => setView('home')}><DrillEditorView setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></PageWrapper>}
          {view === 'peerHost' && <PageWrapper key="peerHost"><ErrorBoundary onReset={() => setView('home')}><TeacherHostView setView={setView} drill={hostDrill} /></ErrorBoundary></PageWrapper>}
          {view === 'peerClient' && <PageWrapper key="peerClient"><ErrorBoundary onReset={() => setView('home')}><StudentClientView setView={setView} stats={stats} setStats={setStats} initialConnectId={connectParam} /></ErrorBoundary></PageWrapper>}
          {view === 'gacha' && <PageWrapper key="gacha"><ErrorBoundary onReset={() => setView('home')}><GachaView stats={stats} setStats={setStats} onBack={() => setView('home')} /></ErrorBoundary></PageWrapper>}
          {view === 'session' && <FullScreenWrapper key="session"><ErrorBoundary onReset={abandonLearningSession}><SessionView queue={sessionData.remainingQueue || sessionData.queue} totalCount={sessionData.queue.length} stats={stats.kanjiStats || {}} onUpdateStat={handleUpdateStat} onRecordSkillEvidence={handleRecordSkillEvidence} onProgress={handleSessionProgress} onFinish={handleFinishSession} onRecordPerfect={handleRecordPerfect} onRecordEasy={handleRecordEasy} isResumed={isResumedSession} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'flashcard' && <FullScreenWrapper key="flashcard"><ErrorBoundary onReset={() => setView('home')}><FlashcardView queue={sessionData.queue} stats={stats} setStats={setStats} onFinish={handleFinishSession} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'survival' && <FullScreenWrapper key="survival"><ErrorBoundary onReset={() => setView('home')}><SurvivalView queue={sessionData.queue} onUpdateStat={handleUpdateStat} onFinish={handleFinishSession} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'boss' && <FullScreenWrapper key="boss"><ErrorBoundary onReset={() => setView('home')}><BossBattleView queue={sessionData.queue} onUpdateStat={handleUpdateStat} onFinish={handleFinishSession} onBossDefeat={handleBossDefeat} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'drillTest' && <FullScreenWrapper key="drillTest"><ErrorBoundary onReset={() => setView('home')}><DrillTestView queue={sessionData.queue} stats={stats} onUpdateStat={handleUpdateStat} onFinish={handleFinishSession} startDrillSession={startDrillSession} setView={setView} setSessionData={setSessionData} createInitialSessionData={createInitialSessionData} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'result' && <PageWrapper key="result"><ErrorBoundary onReset={() => setView('home')}><ResultView sessionMetrics={sessionData} oldExp={sessionData.oldExp} setView={setView} stats={stats} setStats={setStats} onContinueLearning={() => startSession(stats.targetGrade || 1)} /></ErrorBoundary></PageWrapper>}
        </AnimatePresence>
      </main>
      {/* モバイルボトムナビ（ホーム画面のみ表示） */}
      {isMobile && view === 'home' && (
        <MobileBottomNav
          setView={setView}
          currentView={view}
          isCraftUnlocked={levelInfo.level >= 3}
          isTownEditorUnlocked={levelInfo.level >= 1}
        />
      )}
      <Footer />
      </div>
    </MotionConfig>
  );
}
