import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { PenTool, Volume2, VolumeX, Settings, Users } from 'lucide-react';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useIsMobile } from './hooks/useIsMobile';
import { useViewNavigation } from './hooks/useViewNavigation';
import { EXIT_CONFIRM_WINDOW, isLearningView } from './systems/view-navigation';
import { usePrefetchKanji } from './hooks/usePrefetchKanji';
import OfflineBanner from './components/ui/OfflineBanner';
import OtherTabNotice from './components/ui/OtherTabNotice';
import StorageErrorBanner from './components/ui/StorageErrorBanner';
import UpdateToast from './components/ui/UpdateToast';
import MobileBottomNav from './components/ui/MobileBottomNav';

import { StorageAPI, getLevelInfo } from './systems/storage';
import { calculateNextReview, isEarlyReview, migrateCard, recordPracticeAttempt, recordSelfReport } from './systems/srs';
import { buildFlashcardQueue, buildLearningPlan, buildWeakKanjiPlan, getDailyLearningProgress, getGoalAwareSessionLimits } from './systems/learning-plan';
import { createSessionCheckpoint, restoreSessionCheckpoint } from './systems/session-checkpoint';
import { recordHomeworkResult } from './systems/homework';
import { beginStudySession, buildDrillStudyUnit, buildStudyMeta, finishStudySession, markStudySessionCompleted, recordStudyAttempt } from './systems/studySession';
import { audioCtrl } from './systems/audio';
import { checkLevelUp, grantExpWithLevelRewards } from './utils/level-system';
import { SESSION, EXP, RARE_DROP, ECONOMY, DEBOUNCE, TEST, READING } from './constants/gameConfig';

// Data
import { KANJI_DATA, KANJI_UNLOCK_EXTRA } from './data/kanji-data';
import { createVillager, calculateSatisfaction, getSatisfactionLabel, getSatisfactionMultiplier } from './systems/residents';
import { calculateMaterialDrops } from './systems/material-drops';
import { getDailyMissions, updateMissionProgress } from './data/daily-missions';
import { getLoginBonusDay, getLoginBonusReward, applyLoginBonus } from './data/login-bonus';
import { getTodayString } from './utils/date-utils';
import { getEffectiveStreak } from './systems/habit';
import { getMotionPreference, shouldReduceMotion } from './utils/motion-preference';
import { recordSkillEvidence } from './systems/mastery';
import { applyCarelessPenalty } from './systems/careless';
import { fillQueue, shuffled } from './systems/question-queue';
import { THEMES, themeCssVars } from './constants/themes';
import { createTabCoordinator } from './systems/tab-coordinator';
import { requestPersistentStorageOnce } from './systems/persistence';

// UI
import { PageWrapper, FullScreenWrapper, ErrorBoundary, Footer, BackExitHint, LeaveLearningDialog } from './components/ui';
import { F, FuriganaContext } from './components/ui/FormatKun';
import { buildGradeLookup, getFuriganaMode } from './utils/furigana';
import { getFontScale } from './utils/text-size';

// Pages - HomeViewは常にロード、他はlazy
import HomeView from './components/pages/HomeView';
const DictionaryView = lazy(() => import('./components/pages/DictionaryView'));
const AchievementView = lazy(() => import('./components/pages/AchievementView'));
const StatsView = lazy(() => import('./components/pages/StatsView'));
const ResultView = lazy(() => import('./components/pages/ResultView'));
const MyDrillsView = lazy(() => import('./components/pages/MyDrillsView'));
const DrillEditorView = lazy(() => import('./components/pages/DrillEditorView'));
const PrintTestView = lazy(() => import('./components/pages/PrintTestView'));
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
const DrillShareView = lazy(() => import('./components/social/DrillShareView'));
const DrillImportView = lazy(() => import('./components/social/DrillImportView'));
const RangeEditorView = lazy(() => import('./components/social/RangeEditorView'));
const RangeImportView = lazy(() => import('./components/social/RangeImportView'));

// Tutorial & Phase 7
// ときどきしか出ない重ね画面は、出すときにだけ読みこむ（初回に読む JS を軽くするため）
const TutorialOverlay = lazy(() => import('./components/tutorial/TutorialOverlay'));
const LoginBonusPopup = lazy(() => import('./components/tutorial/LoginBonusPopup'));
const ResidentCollectionPopup = lazy(() => import('./components/tutorial/ResidentCollectionPopup'));
const LevelUpModal = lazy(() => import('./components/ui/LevelUpModal'));
import FeatureHint from './components/tutorial/FeatureHint';

// テーマ別CSS変数。色の正本は constants/themes.js（テストが全テーマのコントラストを確かめる）
const THEME_VARS = Object.fromEntries(Object.keys(THEMES).map((name) => [name, themeCssVars(name)]));

const GlobalStyle = ({ themeName, reducedMotion }) => {
  const tv = THEME_VARS[themeName] || THEME_VARS.default;
  const reducedMotionStyle = reducedMotion
    ? `body { transition: none; } [data-reduced-motion="true"] *, [data-reduced-motion="true"] *::before, [data-reduced-motion="true"] *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }`
    : '';
  return (
    <style>{`:root { ${tv} } body { font-family: 'Zen Maru Gothic', sans-serif; background-color: var(--bg); color: var(--text); touch-action: manipulation; transition: background-color 0.3s ease; } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } ::selection { background-color: var(--accent); color: var(--text); } ruby { ruby-align: center; ruby-position: over; vertical-align: baseline; } ruby rt { font-size: 0.5em; font-weight: 500; letter-spacing: 0; line-height: 1; } ruby rt:empty { display: inline-block; height: 0; overflow: hidden; } .ruby-text { line-height: 2.5; } ${reducedMotionStyle}`}</style>
  );
};

// ふりがなの「学年より上の字だけ」で使う、字 → 学年 の表。
// 字の一覧（約3KB）は初回のJSに入れず、起動と同時に別に読む。読めるまではすべてに出す。
let gradeLookupCache = null;
const gradeLookupPromise = import('./data/kanji-grades')
  .then(({ KANJI_BY_GRADE }) => { gradeLookupCache = buildGradeLookup(KANJI_BY_GRADE); return gradeLookupCache; })
  .catch(() => null);

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
    voicedCount: 0,
    reviewedCount: 0,
    attemptCount: 0,
    correctCount: 0,
    // てきとう書きのまま答え合わせをした回数（その回の EXP を失う）と、そのとき失ったものの記録、
    // やり直してもできずに次の学習へ回した字の数
    carelessCount: 0,
    carelessPenalties: [],
    deferredCount: 0,
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
  // 起動時のURLパラメータを1回だけ読む
  //  ?connect=XXXX : QRコード／4桁IDからのP2P接続
  //  ?drill=...    : リンクで配られたドリル・宿題（Google Classroomなどからの起動）
  //  ?range=...    : 先生が配った「ならった範囲」
  // ドリル・範囲の中身は、受け取りの画面で読んで確かめる（drill-share.js / learning-range.js は
  // 起動時に読まない。初回の JS を小さくするため）
  const launchParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const rawConnectId = params.get('connect');
    const connectId = rawConnectId && /^\d{4}$/.test(rawConnectId) ? rawConnectId : null;
    const drillParam = params.get('drill') || null;
    const rangeParam = params.get('range') || null;
    if (connectId || drillParam || rangeParam) {
      // パラメータを消してURLをクリーンにする（再読み込みで同じ画面に戻らないように）
      window.history.replaceState({}, '', window.location.pathname);
    }
    return { connectId, drillParam, rangeParam };
  }, []);
  const connectParam = launchParams.connectId;

  const [initialAppState] = useState(() => {
    const loadedStats = StorageAPI.getStats();
    const savedCheckpoint = StorageAPI.getActiveSession();
    const restoredSession = restoreSessionCheckpoint(savedCheckpoint, KANJI_DATA);
    if (savedCheckpoint && !restoredSession) StorageAPI.clearActiveSession();
    return { loadedStats, restoredSession };
  });

  const initialView = connectParam
    ? 'peerClient'
    : launchParams.drillParam
      ? 'drillImport'
      : launchParams.rangeParam
        ? 'rangeImport'
        : initialAppState.restoredSession ? 'session' : 'home';
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
  // 終了処理のタイマーが、学習をやめたあとに動いても結果画面へ飛ばないように、いまの画面を参照できるようにする
  const viewRef = useRef(view);
  viewRef.current = view;
  const [isMuted, setIsMuted] = useState(audioCtrl.muted);
  const [stats, setStats] = useState(initialAppState.loadedStats);
  // いまの記録（effect やタイマーの中から、古いクロージャではなく最新を読むため）
  const statsRef = useRef(stats);
  statsRef.current = stats;
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
  // ふりがなの設定を画面へ渡す（F()・RubyText が読む）
  const [gradeLookup, setGradeLookup] = useState(gradeLookupCache);
  useEffect(() => {
    if (gradeLookup) return undefined;
    let alive = true;
    gradeLookupPromise.then((lookup) => { if (alive && lookup) setGradeLookup(lookup); });
    return () => { alive = false; };
  }, [gradeLookup]);
  // 文字の大きさ（設定）。rem の基準になる html に倍率を置く（index.css の html の font-size）
  const fontScale = getFontScale(stats.settings);
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(fontScale));
  }, [fontScale]);
  const furiganaMode = getFuriganaMode(stats.settings);
  const furiganaValue = useMemo(
    () => ({ mode: furiganaMode, grade: stats.targetGrade || 1, gradeLookup }),
    [furiganaMode, stats.targetGrade, gradeLookup],
  );
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

  // 学習画面に入っている間だけ study.v1 の学習ログを組み立てる（§5.2）。
  // handleFinishSession が完走を宣言（markStudySessionCompleted）しない限り、
  // 画面を離れた時点で中断（aborted）として確定する。
  useEffect(() => {
    if (!isLearningView(view)) return undefined;
    beginStudySession(buildStudyMeta(view, sessionDataRef.current));
    return () => finishStudySession();
  }, [view]);

  // コア学習中は、答えが確定したとき（残りの出題が変わったとき）に、記録とチェックポイントを
  // 同じタイミングで即時保存する。以前は stats・sessionData のどれかが変わるたびに即時保存し、
  // 1字につき2〜4回、記録全体（重い子で約75万文字）を書いていた（低速の端末で1回40ms）。
  useEffect(() => {
    if (view !== 'session' || !sessionData.remainingQueue?.length) return;
    const checkpoint = createSessionCheckpoint(sessionDataRef.current);
    if (!checkpoint) return;
    StorageAPI.saveStatsImmediate(statsRef.current);
    StorageAPI.saveActiveSession(checkpoint);
  }, [view, sessionData.remainingQueue]);

  // 学習中のそれ以外の更新（技能の記録、ボス・サバイバル・ドリルテストの1問ごとの記録）は、
  // まとめて保存する。以前はボス・サバイバル・テストは終わるまで漢字の記録を一度も保存せず、
  // 途中で閉じると消えていた。画面を離れる・閉じるときは保存待ちをすぐ書く（flushPendingSave）。
  useEffect(() => {
    if (!isLearningView(view)) return;
    StorageAPI.saveStats(stats);
  }, [view, stats]);

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

    // 連続学習日数は学習した日にしか更新されないので、休みが続いて途切れていたら、
    // 起動したとき（と日付が変わったとき）に 0 へ直す。以前は2週間休んでも「6日連続」のまま、
    // ホーム・満足度（EXP倍率）・レアドロップ・先生向けの記録に使われていた。
    const effectiveStreak = getEffectiveStreak(currentStats, today);
    const streakBroken = effectiveStreak !== (Number(currentStats.streak) || 0);
    if (streakBroken) needsSave = true;

    // ログインボーナス受取（休みのあとに戻ってきた日は1日目として受けとる）
    const bonusStreak = currentStats.lastDate ? Math.max(1, effectiveStreak) : effectiveStreak;
    if (currentStats.tutorialCompleted && currentStats.lastLoginBonusDate !== today && bonusStreak >= 1) {
      const bonusDay = getLoginBonusDay(bonusStreak);
      const reward = getLoginBonusReward(bonusDay);
      setLoginBonusReward({ ...reward, bonusDay, streak: bonusStreak });
      setShowLoginBonus(true);
    }

    const willCollect = currentStats.lastCollectionDate !== today && (currentStats.villagers || []).length > 0;

    if (needsSave || willCollect) {
      setStats(prev => {
        let updated = { ...prev };
        if (streakBroken) updated.streak = getEffectiveStreak(updated, today);
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

  // 同じ端末で複数のタブに開いたとき、記録を書くのは最後に開いたタブだけにする。
  // 以前は古いタブがあとから1回保存しただけで、新しいタブで学んだ記録やドリルが消えていた。
  const [tabInactive, setTabInactive] = useState(false);
  useEffect(() => {
    const coordinator = createTabCoordinator({
      onDeactivate: () => {
        const flushed = StorageAPI.flushPendingSave();
        StorageAPI.setWritable(false);
        audioCtrl.stopBGM();
        setTabInactive(true);
        return flushed;
      },
      // こちらが開いた直後に、前のタブが保存待ちを書き出したときは読み直す
      onPeerFlushed: () => {
        const fresh = StorageAPI.getStats();
        setStats(fresh);
        setSeenHints(fresh.seenHints || []);
        setDailyMissions(fresh.dailyMissions || []);
      },
    });
    coordinator.claim();
    return () => coordinator.destroy();
  }, []);

  // 画面を離れる・タブを閉じるときは、保存待ちの変更をすぐに書く（待ち時間のあいだに閉じると消えていた）
  useEffect(() => {
    const flush = () => { StorageAPI.flushPendingSave(); };
    const handleVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // 初回ロード時
  useEffect(() => {
    refreshDailyData(stats, true);
    // 保存済みの音量設定を適用。「小・中・大」を選んでいたら音ありで始める
    // （以前は音量だけ戻して毎回消音で始まり、設定画面の表示と食い違っていた）。
    // 何も選んでいなければ、学校で急に鳴らないよう今までどおり消音で始める。
    const savedLevel = stats.settings?.volumeLevel;
    if (savedLevel && VOLUME_VALUES[savedLevel] !== undefined) {
      audioCtrl.volume = VOLUME_VALUES[savedLevel];
      if (savedLevel !== 'off' && audioCtrl.muted) {
        audioCtrl.muted = false;
        setIsMuted(false);
      }
    }
  }, []);

  // 日付変更の監視（開きっぱなし対策）
  // 保存済みのデータ（getStats）ではなく、メモリ上の記録で判定する。以前は getStats が
  // 保存済みのコピーにだけ放置のペナルティを当てて即時保存し、保存待ちの変更を消していた。
  useEffect(() => {
    const checkDate = () => {
      const current = statsRef.current;
      const maintained = StorageAPI.applyDailyMaintenance(current);
      if (maintained !== current) {
        statsRef.current = maintained;
        setStats(maintained);
        StorageAPI.saveStats(maintained);
      }
      refreshDailyData(maintained);
    };
    // 1分ごとに日付変更をチェック
    const timer = setInterval(checkDate, DEBOUNCE.DATE_CHECK_INTERVAL);

    // タブに戻った時にチェック
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkDate();
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
    // 答えた字ごとの記録（間隔反復・技能点）は残す。ボス・サバイバルなどは記録をすぐ保存していないので、
    // やめたときに書き出す（ダイアログの「書いた字の記録は のこるよ」のとおりにする）
    setStats(prev => { StorageAPI.saveStatsImmediate(prev); return prev; });
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

  // 実績の画面を開いたときは、いまの記録で進み具合を数え直す（クラフト・建物・コインをすぐ反映する）
  useEffect(() => {
    if (view !== 'achievements') return;
    setStats(prev => {
      const next = StorageAPI.refreshAchievements({ ...prev });
      if (JSON.stringify(next.achievements) === JSON.stringify(prev.achievements)) return prev;
      StorageAPI.saveStats(next);
      return next;
    });
  }, [view]);

  // 学習画面の「やめる」ボタン。戻る操作と同じ確認ダイアログを出す
  const requestLeaveLearning = useCallback(() => setShowLeaveConfirm(true), []);

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
      // 先生が配った「ならった範囲」があれば、新出は日付が来た段の字だけから出す
      range: stats.settings?.learningRange,
      today: getTodayString(),
    });
    const expMultiplier = getSatisfactionMultiplier(calculateSatisfaction(stats));
    if (queue.length > 0) {
      beginSession('session', {
        queue,
        oldExp: stats.totalExp,
        expMultiplier,
        studyUnit: { id: `g${selectedGrade}-daily`, title: `${selectedGrade}年の漢字れんしゅう`, grade: selectedGrade, preset: true },
      });
    }
  };

  // homeworkId: 宿題として記録するときの宿題の印。宿題になるかは呼ぶ側（宿題のカード・マイドリル）が
  // homework-status.js の homeworkIdFor で決める（やることが合っていて、テストは決められた問題数以上のとき）
  const startDrillSession = (drill, homeworkId = null) => {
    audioCtrl.init();
    const queue = KANJI_DATA.filter(k => drill.kanjis?.includes(k.id));
    const expMultiplier = getSatisfactionMultiplier(calculateSatisfaction(stats));
    if (queue.length > 0) {
      beginSession('session', { queue, oldExp: stats.totalExp, expMultiplier, isDrill: true, studyUnit: buildDrillStudyUnit(drill), homeworkId });
    }
  };

  const startDrillTest = (drill, questionCount, homeworkId = null) => {
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
      beginSession('drillTest', { queue: candidates, oldExp: stats.totalExp, expMultiplier, isDrill: true, isTest: true, studyUnit: buildDrillStudyUnit(drill), homeworkId });
    }
  };

  const startSingleSession = (kanji) => {
    audioCtrl.init();
    const expMultiplier = getSatisfactionMultiplier(calculateSatisfaction(stats));
    beginSession('session', {
      queue: [kanji],
      oldExp: stats.totalExp,
      expMultiplier,
      studyUnit: { id: `g${kanji.grade || 1}-single`, title: `「${kanji.char}」のれんしゅう`, grade: kanji.grade || 1, preset: true },
    });
  };

  const startFlashcard = () => {
    audioCtrl.init();
    // 習った字から一様に選ぶ（以前の sort(() => Math.random() - 0.5) は1年生の字にかたよっていた）
    const queue = buildFlashcardQueue({ kanjiData: KANJI_DATA, kanjiStats: stats.kanjiStats || {} });
    if (queue.length === 0) return;
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
    const queue = shuffled(learned);
    const expMultiplier = getSatisfactionMultiplier(calculateSatisfaction(stats));
    beginSession('survival', { queue, oldExp: stats.totalExp, expMultiplier });
  };

  const startBossBattle = () => {
    audioCtrl.init();
    const learned = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new');
    if (learned.length === 0) return;
    const weakest = [...learned]
      .sort((a, b) => (stats.kanjiStats?.[b.id]?.mistakes || 0) - (stats.kanjiStats?.[a.id]?.mistakes || 0))
      .slice(0, 10);
    // 10問に満たない場合は複製して埋める。同じ字は、ほかに選べる限りとなりに並べない
    const queue = fillQueue(weakest, 10);
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

  const handleUpdateStat = (kanjiObj, evalType, { skills = [], selfReport = false, skillEvidence = null } = {}) => {
    const id = kanjiObj.id;
    recordStudyAttempt(id, { ok: evalType !== 'again', skill: skills[0] });
    // 技能ごとの証拠（毎日のテストでは書字と筆順を採点結果から別々に決める）。無ければ全技能に同じ評価
    const skillUpdates = Array.isArray(skillEvidence) && skillEvidence.length > 0
      ? skillEvidence
      : skills.map(skill => ({ skill, evidence: evalType }));
    const cur = migrateCard(stats.kanjiStats?.[id]);
    const curWithMastery = skillUpdates.length > 0
      ? { ...cur, skillMastery: recordSkillEvidence(cur, skillUpdates) }
      : cur;
    // 期限前の早い復習（ボス・サバイバル・1字の練習で、期限の来ていない字）は、特訓と同じく
    // 練習の記録だけにする。以前は正解のたびに間隔を掛け算で伸ばし、数分で何百日も先になっていた。
    // 忘れていた（again）ときは、期限前でも間隔反復に記録する。
    const now = Date.now();
    const practiceOnly = sessionData.isDrill || (evalType !== 'again' && isEarlyReview(cur, now));
    if (practiceOnly) {
      setStats(s => {
        const latest = migrateCard(s.kanjiStats?.[id]);
        const latestWithMastery = skillUpdates.length > 0
          ? { ...latest, skillMastery: recordSkillEvidence(latest, skillUpdates) }
          : latest;
        return {
          ...s,
          kanjiStats: {
            ...s.kanjiStats,
            [id]: {
              ...latestWithMastery,
              ...recordPracticeAttempt(latestWithMastery, evalType),
              ...recordSelfReport(latestWithMastery, selfReport),
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

    const next = calculateNextReview(curWithMastery, evalType, now);
    // はじめての字（まだ1回もできていない字）。1回目でできなくても、できたときに新出字として数える。
    // 以前は1回目の評価だけを見ていたので、やり直してできた字は EXP 50 をもらえず、
    // 逆に、書けなかった字も「新しい漢字」のミッションに数えていた。
    const wasNew = curWithMastery.status === 'new' || curWithMastery.pendingNew === true;
    const learnedNew = wasNew && evalType !== 'again';
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
          ...recordSelfReport(curWithMastery, selfReport),
          pendingNew: wasNew && !learnedNew ? true : undefined,
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
      newKanjiCount: (d.newKanjiCount || 0) + (learnedNew ? 1 : 0),
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
  const handleRecordVoiced = useCallback(() => {
    setSessionData(d => ({
      ...d,
      voicedCount: (d.voicedCount || 0) + 1,
      earnedExp: d.earnedExp + Math.round(READING.CHALLENGE_BONUS_EXP * (d.expMultiplier || 1))
    }));
  }, []);

  // てきとう書き（ほとんど書かずに「こたえあわせ」を押した）。テストの画面は、答えを見せる前に確かめを出す。
  // 確かめが出た回数は、その日の記録に残す（先生が学習きろくで見る）。
  const handleCarelessWarned = useCallback(() => {
    const next = StorageAPI.recordCareless(statsRef.current, getTodayString(), 'carelessWarned');
    statsRef.current = next;
    setStats(next);
    StorageAPI.saveStats(next);
  }, []);
  // 確かめで「このまま こたえあわせ」を選んだ。ペナルティを科して、すぐ保存する
  // （取り返しのつかない変更なので、保存の前に閉じても無かったことにならないように）。
  // applyPenalty は systems/careless-penalty.js の計算（テストの画面が渡す。初回の JS に入れないため）。
  const handleRecordCareless = useCallback((applyPenalty) => {
    const today = getTodayString();
    const counted = StorageAPI.recordCareless(statsRef.current, today);
    const result = applyPenalty ? applyPenalty(counted, today) : { stats: counted, entry: null };
    const entry = result?.entry || null;
    // 町の建物や土地が変わったら、住民の満足度も数えなおす
    const next = entry ? { ...result.stats, satisfaction: calculateSatisfaction(result.stats) } : counted;
    statsRef.current = next;
    setStats(next);
    StorageAPI.saveStatsImmediate(next);
    setSessionData(d => ({
      ...d,
      carelessCount: (d.carelessCount || 0) + 1,
      carelessPenalties: entry ? [...(d.carelessPenalties || []), entry] : (d.carelessPenalties || []),
      // レベルが下がったら、この回の「学習の前の EXP」も下がった所にそろえる（結果の画面のレベルがずれないように）
      oldExp: entry?.exp ? Math.max(0, (d.oldExp || 0) - entry.exp) : d.oldExp,
    }));
    const checkpoint = createSessionCheckpoint(sessionDataRef.current);
    if (checkpoint) StorageAPI.saveActiveSession(checkpoint);
    return entry;
  }, [setSessionData]);
  const handleDeferKanji = useCallback(() => {
    setSessionData(d => ({ ...d, deferredCount: (d.deferredCount || 0) + 1 }));
  }, [setSessionData]);

  const handleFinishSession = (additionalResults = {}) => {
    // setSessionData はrefも同期更新するため、最後の回答直後でも最新集計を確定できる。
    const activeSession = sessionDataRef.current;
    // 1つのセッションは1回だけ確定する。二重に呼ばれると EXP・コイン・セッション数・
    // ミッションが二重に入っていた（ボタンの連打や、画面切り替え中のタップ）。
    if (activeSession.finalized) return;
    // 「やめる」でホームに戻ったあとに、ボス・サバイバルなどの演出のタイマーから呼ばれても確定しない
    if (!isLearningView(viewRef.current)) return;
    // 規定の終了条件に到達。学習ログは統計保存後（学習画面を離れるタイミング）に確定する。
    markStudySessionCompleted();
    // てきとう書きがあった回は、もらえる EXP（と、そこから換算するコイン）を減らす
    const penalty = applyCarelessPenalty(activeSession.earnedExp + (additionalResults.exp || 0), activeSession.carelessCount);
    const totalExp = penalty.exp;
    const coinBonus = Math.floor(totalExp / ECONOMY.EXP_TO_COIN_DIVISOR) + (additionalResults.coins || 0);
    const correctTotal = activeSession.correctCount + (additionalResults.correctCount ?? additionalResults.reviewedCount ?? 0);
    // 1字もできていない学習は、学習の回数・ミッション・レアドロップに数えない。
    // 以前は書かずに終えても1回と数え、「セッション」のミッションやレアアイテムが手に入った。
    const counted = correctTotal > 0;
    const rareChance = RARE_DROP.BASE_CHANCE + (stats.streak * RARE_DROP.STREAK_BONUS);
    let rareDrop = additionalResults.rareDrop || null;
    if (counted && !rareDrop && Math.random() < Math.min(rareChance, RARE_DROP.MAX_CHANCE)) {
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

    // 宿題の学習なら、そのドリルに最高点・できた日・回数を残す（学習ログ study.v1 の形は変えない）
    // 次の学習へ回した字があるうちは、宿題の練習を「できた」にしない
    const homeworkArgs = { correct: correctTotal, attempts: activeSession.attemptCount + (additionalResults.attemptCount || 0), today: getTodayString(), incomplete: (activeSession.deferredCount || 0) > 0 };
    const homeworkReport = activeSession.homeworkId
      ? recordHomeworkResult(statsRef.current.myDrills, activeSession.homeworkId, homeworkArgs).report
      : null;

    const finalSessionData = { 
      ...activeSession,
      finalized: true,
      earnedExp: totalExp, 
      // 結果画面に出すコインは、実際に足す量（EXP からの換算＋ボス・サバイバルの報酬＋レベルアップ）
      earnedCoins,
      rareDrop, 
      perfectCount: activeSession.perfectCount + (additionalResults.perfectCount || 0),
      reviewedCount: activeSession.reviewedCount + (additionalResults.reviewedCount || 0),
      attemptCount: activeSession.attemptCount + (additionalResults.attemptCount || 0),
      correctCount: correctTotal,
      // 結果の画面で、減った EXP と、数えなかった理由を知らせる
      carelessLostExp: penalty.lost,
      counted,
      unlockedItems: unlockedItemsThisSession,
      levelUpData, // ResultViewに渡すレベルアップ情報
      // 結果の画面の「先生に見せる」に出す（宿題でなければ前の宿題の結果を引き継がない）
      homeworkReport: homeworkReport || activeSession.homeworkReport || null,
    };
    
    setSessionData(finalSessionData);
    setStats(prevStats => {
      const copy = JSON.parse(JSON.stringify(prevStats));
      const newStats = StorageAPI.updateDaily(copy, totalExp, finalSessionData);
      newStats.coins = (newStats.coins || 0) + earnedCoins;
      // 半径拡大
      if (addedRadius > 0) newStats.exploredRadius = Math.max(newStats.exploredRadius || 3, addedRadius);
      // セッション数カウント更新
      if (counted) newStats.sessionCount = (newStats.sessionCount || 0) + 1;
      if (homeworkReport) newStats.myDrills = recordHomeworkResult(newStats.myDrills, activeSession.homeworkId, homeworkArgs).drills;
      // 実績の進み具合は、セッション数とコインを足したあとで数え直す（以前は1回遅れていた）
      StorageAPI.refreshAchievements(newStats);

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
      let updated = counted ? updateMissionProgress(prev, 'session', 1) : prev;
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
    // 学習を1回終えたら、記録をブラウザに消されにくくするよう頼む（iOS の7日消去・容量不足時の削除への備え）
    requestPersistentStorageOnce();
  };

  // テスト結果から、間違えた漢字だけの学習セッションへ移る。
  // テストの成績を確定してから続けて始めるので、リザルト画面は挟まない。
  const startMistakeReview = (kanjiList) => {
    if (!Array.isArray(kanjiList) || kanjiList.length === 0) return;
    const finishedSession = sessionDataRef.current;
    const earnedExp = finishedSession.earnedExp || 0;
    const studyUnit = finishedSession.studyUnit;
    handleFinishSession();
    const expMultiplier = getSatisfactionMultiplier(calculateSatisfaction(stats));
    beginSession('session', {
      queue: kanjiList,
      // テストで得たEXPを反映した位置から、復習セッションの獲得量を数える
      oldExp: (stats.totalExp || 0) + earnedExp,
      expMultiplier,
      // 出題元は同じマイドリルなので、学習ログの単元もテストから引き継ぐ
      isDrill: true,
      studyUnit,
      // 宿題のテストの結果は確定ずみ。復習のあとの結果の画面でも「先生に見せる」を出す（2回は記録しない）
      homeworkReport: sessionDataRef.current.homeworkReport || null,
    });
  };

  // ボスバトル敗北処理
  const handleBossDefeat = (defeatResults = {}) => {
    // 失敗した漢字を復習リストに追加（nextReviewを即時に設定）
    if (defeatResults.failedKanji && defeatResults.failedKanji.length > 0) {
      setStats(s => {
        const newKanjiStats = { ...s.kanjiStats };
        defeatResults.failedKanji.forEach(k => {
          if (newKanjiStats[k.id]) {
            // ミスの数は、失敗したときの onUpdateStat('again') ですでに数えている。
            // ここでも足すと、負けたときだけ二重に数えていた（勝ったときは1回）。復習の前倒しだけにする。
            newKanjiStats[k.id] = { ...newKanjiStats[k.id], nextReview: Date.now() };
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
      <FuriganaContext.Provider value={furiganaValue}>
      <div data-reduced-motion={isReducedMotion ? 'true' : 'false'} className="flex flex-col h-[100dvh] w-full bg-[var(--bg)] relative overflow-hidden transition-colors duration-500">
      <GlobalStyle themeName={activeThemeName} reducedMotion={isReducedMotion} />

      {/* ストレージ保存失敗バナー（オフラインバナーより上に表示） */}
      <StorageErrorBanner />

      {/* オフラインバナー */}
      {!isOnline && <OfflineBanner />}

      {/* 新しい版が用意できたときの案内（押したときだけ切り替わる） */}
      <UpdateToast />

      {/* Phase 5: チュートリアルオーバーレイ（重ね画面は、それぞれの Suspense で読みこみ中は何も出さない。
          AnimatePresence の外を Suspense で包むと、退場の追跡が壊れることがある。PageWrapper.jsx 参照） */}
      <AnimatePresence>
        {showTutorial && <Suspense key="tutorial" fallback={null}><TutorialOverlay onComplete={handleTutorialComplete} /></Suspense>}
      </AnimatePresence>

      {/* Phase 7: ログインボーナスポップアップ */}
      <AnimatePresence>
        {showLoginBonus && !showTutorial && loginBonusReward && (
          <Suspense key="login-bonus" fallback={null}>
            <LoginBonusPopup
              streak={loginBonusReward.streak}
              bonusDay={loginBonusReward.bonusDay}
              reward={loginBonusReward}
              onClaim={handleClaimLoginBonus}
            />
          </Suspense>
        )}
      </AnimatePresence>
      {/* Phase 7: 住民素材収集ポップアップ */}
      <AnimatePresence>
        {showResidentCollection && !showTutorial && !showLoginBonus && residentCollectionResult && (
          <Suspense key="resident-collection" fallback={null}>
          <ResidentCollectionPopup
            result={residentCollectionResult.result}
            satisfaction={residentCollectionResult.satisfaction}
            satLabel={residentCollectionResult.satLabel}
            onConfirm={() => {
              setShowResidentCollection(false);
              audioCtrl.playSE('click');
            }}
          />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Lv100 の上限を外した版をはじめて開いたとき: ためていた EXP の分だけ上がったレベルを祝う（1回だけ） */}
      <AnimatePresence>
        {stats.pendingLevelUp?.rewards && view === 'home' && !showTutorial && !showLoginBonus && !showResidentCollection && (
          <Suspense key="level-cap-lifted" fallback={null}>
            <LevelUpModal
              levelUpData={stats.pendingLevelUp}
              capLifted
              onClose={() => setStats((s) => {
                const { pendingLevelUp: _shown, ...rest } = s;
                StorageAPI.saveStats(rest);
                return rest;
              })}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* ほかのタブで開かれたとき。「このタブで つづける」で読みなおして、こちらを使うタブにする */}
      {tabInactive && <OtherTabNotice onResume={() => window.location.reload()} />}

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
          {view === 'home' && <PageWrapper key="home" wide><ErrorBoundary onReset={() => setView('home')}><HomeView setView={setView} stats={stats} setStats={setStats} startSession={startSession} startDrillSession={startDrillSession} startDrillTest={startDrillTest} startFlashcard={startFlashcard} startSurvival={startSurvival} startBossBattle={startBossBattle} levelInfo={levelInfo} dailyMissions={dailyMissions} onClaimMission={handleClaimMission} isMobile={isMobile} /></ErrorBoundary></PageWrapper>}
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
          {view === 'achievements' && <PageWrapper key="achievements"><ErrorBoundary onReset={() => setView('home')}><FeatureHint featureKey="achievements" seenHints={seenHints} onDismiss={handleDismissHint} /><AchievementView setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></PageWrapper>}
          {view === 'stats' && <PageWrapper key="stats"><ErrorBoundary onReset={() => setView('home')}><FeatureHint featureKey="stats" seenHints={seenHints} onDismiss={handleDismissHint} /><StatsView setView={setView} stats={stats} setStats={setStats} startWeakSession={startWeakSession} /></ErrorBoundary></PageWrapper>}
          {view === 'settings' && <PageWrapper key="settings"><ErrorBoundary onReset={() => setView('home')}><SettingsView setView={setView} stats={stats} setStats={setStats} isMuted={isMuted} setIsMuted={setIsMuted} levelInfo={levelInfo} /></ErrorBoundary></PageWrapper>}
          {view === 'myDrills' && <PageWrapper key="myDrills"><ErrorBoundary onReset={() => setView('home')}><MyDrillsView setView={setView} stats={stats} setStats={setStats} startDrillSession={startDrillSession} startDrillTest={startDrillTest} setHostDrill={setHostDrill} /></ErrorBoundary></PageWrapper>}
          {view === 'drillEditor' && <PageWrapper key="drillEditor" wide><ErrorBoundary onReset={() => setView('home')}><DrillEditorView setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></PageWrapper>}
          {view === 'peerHost' && <PageWrapper key="peerHost"><ErrorBoundary onReset={() => setView('home')}><TeacherHostView setView={setView} drill={hostDrill} /></ErrorBoundary></PageWrapper>}
          {view === 'peerClient' && <PageWrapper key="peerClient"><ErrorBoundary onReset={() => setView('home')}><StudentClientView setView={setView} stats={stats} setStats={setStats} initialConnectId={connectParam} /></ErrorBoundary></PageWrapper>}
          {view === 'printTest' && <PageWrapper key="printTest" wide><ErrorBoundary onReset={() => setView('myDrills')}><PrintTestView setView={setView} drill={hostDrill} /></ErrorBoundary></PageWrapper>}
          {view === 'drillShare' && <PageWrapper key="drillShare"><ErrorBoundary onReset={() => setView('myDrills')}><DrillShareView setView={setView} drill={hostDrill} setHostDrill={setHostDrill} /></ErrorBoundary></PageWrapper>}
          {view === 'drillImport' && <PageWrapper key="drillImport"><ErrorBoundary onReset={() => setView('home')}><DrillImportView setView={setView} stats={stats} setStats={setStats} drillParam={launchParams.drillParam} startDrillSession={startDrillSession} startDrillTest={startDrillTest} /></ErrorBoundary></PageWrapper>}
          {view === 'rangeEditor' && <PageWrapper key="rangeEditor" wide><ErrorBoundary onReset={() => setView('myDrills')}><RangeEditorView setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></PageWrapper>}
          {view === 'rangeImport' && <PageWrapper key="rangeImport"><ErrorBoundary onReset={() => setView('home')}><RangeImportView setView={setView} stats={stats} setStats={setStats} rangeParam={launchParams.rangeParam} /></ErrorBoundary></PageWrapper>}
          {view === 'gacha' && <PageWrapper key="gacha"><ErrorBoundary onReset={() => setView('home')}><GachaView stats={stats} setStats={setStats} onBack={() => setView('home')} /></ErrorBoundary></PageWrapper>}
          {view === 'session' && <FullScreenWrapper key="session"><ErrorBoundary onReset={abandonLearningSession}>{(stats.settings?.readingCheck !== false) && <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 w-[min(560px,92%)]"><FeatureHint featureKey="readingCheck" seenHints={seenHints} onDismiss={handleDismissHint} /></div>}<SessionView queue={sessionData.remainingQueue || sessionData.queue} totalCount={sessionData.queue.length} stats={stats.kanjiStats || {}} settings={stats.settings || {}} onUpdateStat={handleUpdateStat} onRecordSkillEvidence={handleRecordSkillEvidence} onProgress={handleSessionProgress} onFinish={handleFinishSession} onRecordPerfect={handleRecordPerfect} onRecordEasy={handleRecordEasy} onRecordVoiced={handleRecordVoiced} onRecordCareless={handleRecordCareless} onCarelessWarned={handleCarelessWarned} onDefer={handleDeferKanji} carelessRecord={stats} onRequestLeave={requestLeaveLearning} isResumed={isResumedSession} isPractice={sessionData.isDrill} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'flashcard' && <FullScreenWrapper key="flashcard"><ErrorBoundary onReset={() => setView('home')}><FlashcardView queue={sessionData.queue} stats={stats} setStats={setStats} onFinish={handleFinishSession} onRequestLeave={requestLeaveLearning} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'survival' && <FullScreenWrapper key="survival"><ErrorBoundary onReset={() => setView('home')}><SurvivalView queue={sessionData.queue} onUpdateStat={handleUpdateStat} onFinish={handleFinishSession} onRequestLeave={requestLeaveLearning} paused={showLeaveConfirm || tabInactive} sessionEarnedExp={sessionData.earnedExp} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'boss' && <FullScreenWrapper key="boss"><ErrorBoundary onReset={() => setView('home')}><BossBattleView queue={sessionData.queue} onUpdateStat={handleUpdateStat} onFinish={handleFinishSession} onBossDefeat={handleBossDefeat} onRequestLeave={requestLeaveLearning} paused={showLeaveConfirm || tabInactive} sessionEarnedExp={sessionData.earnedExp} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'drillTest' && <FullScreenWrapper key="drillTest"><ErrorBoundary onReset={() => setView('home')}><DrillTestView queue={sessionData.queue} onUpdateStat={handleUpdateStat} onFinish={handleFinishSession} onReviewMistakes={startMistakeReview} onRequestLeave={requestLeaveLearning} /></ErrorBoundary></FullScreenWrapper>}
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
      {/* 学習中はリンクの無い 1 行にする（押しそこねて学習の途中で別のタブへ飛ばないように） */}
      <Footer compact={isLearningView(view)} />
      </div>
      </FuriganaContext.Provider>
    </MotionConfig>
  );
}
