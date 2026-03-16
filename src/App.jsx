import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PenTool, Volume2, VolumeX } from 'lucide-react';

// Systems
import { StorageAPI, getLevelInfo } from './systems/storage';
import { calculateNextReview, migrateCard } from './systems/srs';
import { audioCtrl } from './systems/audio';

// Data
import { KANJI_DATA, KANJI_UNLOCK_EXTRA } from './data/kanji-data';
import { STORY_STAGES } from './data/story-stages';
import { TOWN_ITEMS } from './data/town-items';

// UI
import { PageWrapper, FullScreenWrapper, ErrorBoundary } from './components/ui';

// Pages
import HomeView from './components/pages/HomeView';
import DictionaryView from './components/pages/DictionaryView';
import AchievementView from './components/pages/AchievementView';
import StatsView from './components/pages/StatsView';
import ResultView from './components/pages/ResultView';
import MyDrillsView from './components/pages/MyDrillsView';
import DrillEditorView from './components/pages/DrillEditorView';

// Town
import TownEditorView from './components/town/TownEditorView';

// Session & Training
import SessionView from './components/session/SessionView';
import FlashcardView from './components/training/FlashcardView';
import SurvivalView from './components/training/SurvivalView';
import BossBattleView from './components/training/BossBattleView';

// Social
import TeacherHostView from './components/social/TeacherHostView';
import StudentClientView from './components/social/StudentClientView';

export default function App() {
  const [view, setView] = useState('home');
  const [isMuted, setIsMuted] = useState(audioCtrl.muted);
  const [stats, setStats] = useState(StorageAPI.getStats());
  const [sessionData, setSessionData] = useState({ queue: [], earnedExp: 0, oldExp: 0, perfectCount: 0, easyCount: 0, reviewedCount: 0, unlockedItems: [], rareDrop: null, bestKakejiku: null, isDrill: false, newVillager: null });
  const [hostDrill, setHostDrill] = useState(null);

  const levelInfo = useMemo(() => getLevelInfo(stats.totalExp, stats.townMap), [stats.totalExp, stats.townMap]);

  useEffect(() => {
    const link1 = document.createElement('link'); link1.href = 'https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&display=swap'; link1.rel = 'stylesheet'; document.head.appendChild(link1);
    const link2 = document.createElement('link'); link2.href = 'https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&display=swap'; link2.rel = 'stylesheet'; document.head.appendChild(link2);
  }, []);

  useEffect(() => {
    if (!isMuted) { if (view === 'session' || view === 'survival' || view === 'flashcard' || view === 'boss') audioCtrl.playBGM(view === 'boss' ? 'boss' : 'game'); else if (view === 'result') { audioCtrl.stopBGM(); } else audioCtrl.playBGM('home'); }
    else audioCtrl.stopBGM();
  }, [view, isMuted]);

  const startSession = (selectedGrade) => {
    audioCtrl.init(); const now = Date.now();
    const reviewTargets = KANJI_DATA
      .filter(k => {
        const s = stats.kanjiStats?.[k.id];
        return s && s.status !== 'new' && (s.nextReview || 0) <= now;
      })
      .sort((a, b) => (stats.kanjiStats[a.id].nextReview || 0) - (stats.kanjiStats[b.id].nextReview || 0))
      .slice(0, 20);
    const newTargets = KANJI_DATA
      .filter(k => k.grade === selectedGrade && (!stats.kanjiStats?.[k.id] || stats.kanjiStats[k.id].status === 'new'))
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    const queue = [...reviewTargets, ...newTargets];
    if (queue.length === 0) { const fallback = KANJI_DATA.find(k => k.grade === selectedGrade); if (fallback) queue.push(fallback); }
    if (queue.length > 0) { setSessionData({ queue, earnedExp: 0, oldExp: stats.totalExp, perfectCount: 0, easyCount: 0, reviewedCount: 0, unlockedItems: [], rareDrop: null, bestKakejiku: null, isDrill: false, newVillager: null }); setView('session'); }
  };

  const startDrillSession = (drill) => {
    audioCtrl.init(); const queue = KANJI_DATA.filter(k => drill.kanjis?.includes(k.id));
    if (queue.length > 0) { setSessionData({ queue, earnedExp: 0, oldExp: stats.totalExp, perfectCount: 0, easyCount: 0, reviewedCount: 0, unlockedItems: [], rareDrop: null, bestKakejiku: null, isDrill: true, newVillager: null }); setView('session'); }
  };

  const startSingleSession = (kanji) => { audioCtrl.init(); setSessionData({ queue: [kanji], earnedExp: 0, oldExp: stats.totalExp, perfectCount: 0, easyCount: 0, reviewedCount: 0, unlockedItems: [], rareDrop: null, bestKakejiku: null, isDrill: false, newVillager: null }); setView('session'); };
  const startFlashcard = () => { audioCtrl.init(); const learned = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new'); if (learned.length === 0) return; const queue = [...learned].sort(() => Math.random() - 0.5).slice(0, 10); setSessionData({ queue, earnedExp: 0, oldExp: stats.totalExp, perfectCount: 0, easyCount: 0, reviewedCount: 0, unlockedItems: [], rareDrop: null, bestKakejiku: null, isDrill: false, newVillager: null }); setView('flashcard'); };
  const startSurvival = () => { audioCtrl.init(); const learned = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new' && k.examples && k.examples.length > 0); if (learned.length === 0) return; const queue = [...learned].sort(() => Math.random() - 0.5); setSessionData({ queue, earnedExp: 0, oldExp: stats.totalExp, perfectCount: 0, easyCount: 0, reviewedCount: 0, unlockedItems: [], rareDrop: null, bestKakejiku: null, isDrill: false, newVillager: null }); setView('survival'); };
  const startBossBattle = () => { audioCtrl.init(); const learned = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new'); if (learned.length === 0) return; const queue = [...learned].sort((a, b) => { const ma = stats.kanjiStats[a.id].mistakes || 0; const mb = stats.kanjiStats[b.id].mistakes || 0; return mb - ma; }).slice(0, 10); while (queue.length > 0 && queue.length < 10) queue.push(queue[Math.floor(Math.random() * queue.length)]); setSessionData({ queue, earnedExp: 0, oldExp: stats.totalExp, perfectCount: 0, easyCount: 0, reviewedCount: 0, unlockedItems: [], rareDrop: null, bestKakejiku: null, isDrill: false, newVillager: null }); setView('boss'); };

  const handleUpdateStat = (kanjiObj, evalType) => {
    const id = kanjiObj.id;
    const cur = migrateCard(stats.kanjiStats?.[id]);
    if (sessionData.isDrill) { setSessionData(d => ({ ...d, earnedExp: d.earnedExp + (evalType === 'again' ? 0 : 5), reviewedCount: (d.reviewedCount || 0) + 1 })); return evalType !== 'again'; }

    const next = calculateNextReview(cur, evalType);
    const wasNew = cur.status === 'new';
    const isMastering = next.graduated && next.interval >= 7 * 24 * 60 * 60 * 1000;
    const newStatus = isMastering ? 'mastered' : next.graduated ? 'review' : 'learning';
    let exp = 0; let unlockedItem = null; let newVillager = null;

    if (evalType !== 'again') {
      exp = wasNew ? 50 : evalType === 'easy' ? 15 : evalType === 'good' ? 10 : 5;

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
        newVillager = { id: `v_${Date.now()}`, x: vx, y: vy, kanjiChar: kanjiObj.char, born: Date.now() };

        // 漢字習得ごとに探索半径が段階的に拡大（1026字全習得で半径25=全域開放）
        setStats(s => {
          const masteredCount = Object.values({ ...s.kanjiStats, [id]: { status: 'mastered' } }).filter(v => v.status === 'mastered').length;
          // sqrtカーブ: 序盤は速く、終盤は緩やかに拡大（80字→半径9、1026字→半径25）
          const calcRadius = Math.min(25, 3 + 22 * Math.sqrt(masteredCount / 1026));
          const newRadius = Math.max(s.exploredRadius || 3, calcRadius);
          if (newRadius <= (s.exploredRadius || 3)) return s;
          return { ...s, exploredRadius: newRadius };
        });
      }
    }

    setStats(s => ({
      ...s,
      kanjiStats: { ...s.kanjiStats, [id]: { ...cur, ...next, status: newStatus, mistakes: evalType === 'again' ? (cur.mistakes || 0) + 1 : (cur.mistakes || 0) } },
      ...(newVillager ? { population: (s.population || 0) + 1, villagers: [...(s.villagers || []), newVillager] } : {}),
    }));
    setSessionData(d => ({
      ...d,
      earnedExp: d.earnedExp + exp,
      reviewedCount: (d.reviewedCount || 0) + 1,
      unlockedItems: unlockedItem ? [...d.unlockedItems, unlockedItem] : d.unlockedItems,
      newVillager: d.newVillager || newVillager,
    }));
    return evalType !== 'again';
  };

  const handleRecordPerfect = useCallback((imgUrl) => { setSessionData(d => ({ ...d, perfectCount: d.perfectCount + 1, earnedExp: d.earnedExp + 5, bestKakejiku: imgUrl || d.bestKakejiku })); }, []);
  const handleRecordEasy = useCallback(() => { setSessionData(d => ({ ...d, easyCount: d.easyCount + 1 })); }, []);

  const handleFinishSession = (additionalResults = {}) => {
    const totalExp = sessionData.earnedExp + (additionalResults.exp || 0); const coinBonus = Math.floor(totalExp / 2) + (additionalResults.coins || 0); const rareChance = 0.1 + (stats.streak * 0.01); let rareDrop = additionalResults.rareDrop || null;
    if (!rareDrop && Math.random() < Math.min(rareChance, 0.5)) { const rares = ['t_torii', 't_temple', 't_castle', 't_dragon', 't_kakejiku']; rareDrop = rares[Math.floor(Math.random() * rares.length)]; }
    const finalSessionData = { ...sessionData, earnedExp: totalExp, rareDrop, perfectCount: sessionData.perfectCount + (additionalResults.perfectCount || 0) };
    setSessionData(finalSessionData);
    setStats(prevStats => {
      const copy = JSON.parse(JSON.stringify(prevStats));
      const newStats = StorageAPI.updateDaily(copy, totalExp, finalSessionData);
      newStats.coins = (newStats.coins || 0) + coinBonus;
      StorageAPI.saveStatsImmediate(newStats);
      return newStats;
    });
    setView('result');
  };

  const GlobalStyle = () => {
    const { themeName } = levelInfo;
    let tv = `--bg: #fdfbf7; --primary: #ef4444; --secondary: #10b981; --accent: #fbbf24; --text: #292f36; --panel: #ffffff;`;
    if (themeName === 'dark') tv = `--bg: #0f172a; --primary: #f43f5e; --secondary: #3b82f6; --accent: #f59e0b; --text: #e2e8f0; --panel: #1e293b;`;
    if (themeName === 'sakura') tv = `--bg: #fdf2f8; --primary: #d946ef; --secondary: #f472b6; --accent: #fbcfe8; --text: #831843; --panel: #ffffff;`;
    if (themeName === 'ocean') tv = `--bg: #f0f9ff; --primary: #0284c7; --secondary: #38bdf8; --accent: #7dd3fc; --text: #0c4a6e; --panel: #ffffff;`;
    if (themeName === 'sunset') tv = `--bg: #fff7ed; --primary: #ea580c; --secondary: #f97316; --accent: #fcd34d; --text: #7c2d12; --panel: #ffffff;`;
    if (themeName === 'gold') tv = `--bg: #fefce8; --primary: #b45309; --secondary: #eab308; --accent: #fef08a; --text: #713f12; --panel: #ffffff;`;
    return (
      <style>{`:root { ${tv} } body { font-family: 'Zen Maru Gothic', sans-serif; background-color: var(--bg); color: var(--text); touch-action: manipulation; transition: background-color 0.3s ease; } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } ::selection { background-color: var(--accent); color: var(--text); } ruby { ruby-align: center; } ruby rt { font-size: 0.5em; font-weight: 700; letter-spacing: 0; } .ruby-text { line-height: 1.8; }`}</style>
    );
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[var(--bg)] relative overflow-hidden transition-colors duration-500">
      <GlobalStyle />
      {view !== 'session' && view !== 'townEditor' && view !== 'flashcard' && view !== 'survival' && view !== 'boss' && (
        <header className="flex-shrink-0 bg-[var(--panel)]/90 backdrop-blur border-b-[4px] border-[var(--text)] py-3 px-5 flex justify-between items-center z-50 sticky top-0 shadow-[0_4px_0_var(--text)] transition-colors duration-500">
          <div className="flex items-center cursor-pointer gap-2" onClick={() => { audioCtrl.playSE('click'); setView('home'); }} role="button" aria-label="ホームに戻る">
            <div className="bg-[var(--primary)] p-1.5 rounded-lg text-[var(--panel)] shadow-sm border-2 border-[var(--text)]"><PenTool size={22} strokeWidth={3} /></div>
            <h1 className="text-xl font-black text-[var(--text)] tracking-wide">マイ漢字タウン</h1>
          </div>
          <button onClick={() => setIsMuted(audioCtrl.toggle())} aria-label={isMuted ? "音をオンにする" : "音をオフにする"} className="text-[var(--text)] opacity-50 hover:opacity-100 p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-2 border-transparent hover:border-[var(--text)] hover:bg-[var(--bg)] min-w-[44px] min-h-[44px] flex items-center justify-center">
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} className="text-[var(--secondary)]" />}
          </button>
        </header>
      )}

      <main className="flex-grow relative overflow-hidden p-0 md:p-4">
        <AnimatePresence mode="wait">
          {view === 'home' && <PageWrapper key="home"><ErrorBoundary onReset={() => setView('home')}><HomeView setView={setView} stats={stats} setStats={setStats} startSession={startSession} startFlashcard={startFlashcard} startSurvival={startSurvival} startBossBattle={startBossBattle} levelInfo={levelInfo} /></ErrorBoundary></PageWrapper>}
          {view === 'dictionary' && <PageWrapper key="dict"><ErrorBoundary onReset={() => setView('home')}><DictionaryView kanjiStats={stats.kanjiStats} onBack={() => setView('home')} onSelectKanji={startSingleSession} /></ErrorBoundary></PageWrapper>}
          {view === 'townEditor' && <FullScreenWrapper key="townEditor"><ErrorBoundary onReset={() => setView('home')}><TownEditorView setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'achievements' && <PageWrapper key="achievements"><ErrorBoundary onReset={() => setView('home')}><AchievementView setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></PageWrapper>}
          {view === 'stats' && <PageWrapper key="stats"><ErrorBoundary onReset={() => setView('home')}><StatsView setView={setView} stats={stats} /></ErrorBoundary></PageWrapper>}
          {view === 'myDrills' && <PageWrapper key="myDrills"><ErrorBoundary onReset={() => setView('home')}><MyDrillsView setView={setView} stats={stats} setStats={setStats} startDrillSession={startDrillSession} setHostDrill={setHostDrill} /></ErrorBoundary></PageWrapper>}
          {view === 'drillEditor' && <PageWrapper key="drillEditor"><ErrorBoundary onReset={() => setView('home')}><DrillEditorView setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></PageWrapper>}
          {view === 'peerHost' && <PageWrapper key="peerHost"><ErrorBoundary onReset={() => setView('home')}><TeacherHostView setView={setView} drill={hostDrill} /></ErrorBoundary></PageWrapper>}
          {view === 'peerClient' && <PageWrapper key="peerClient"><ErrorBoundary onReset={() => setView('home')}><StudentClientView setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></PageWrapper>}
          {view === 'session' && <FullScreenWrapper key="session"><ErrorBoundary onReset={() => setView('home')}><SessionView queue={sessionData.queue} stats={stats.kanjiStats || {}} onUpdateStat={handleUpdateStat} onFinish={handleFinishSession} onRecordPerfect={handleRecordPerfect} onRecordEasy={handleRecordEasy} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'flashcard' && <FullScreenWrapper key="flashcard"><ErrorBoundary onReset={() => setView('home')}><FlashcardView queue={sessionData.queue} stats={stats} setStats={setStats} onFinish={handleFinishSession} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'survival' && <FullScreenWrapper key="survival"><ErrorBoundary onReset={() => setView('home')}><SurvivalView queue={sessionData.queue} onUpdateStat={handleUpdateStat} onFinish={handleFinishSession} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'boss' && <FullScreenWrapper key="boss"><ErrorBoundary onReset={() => setView('home')}><BossBattleView queue={sessionData.queue} onUpdateStat={handleUpdateStat} onFinish={handleFinishSession} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'result' && <PageWrapper key="result"><ErrorBoundary onReset={() => setView('home')}><ResultView sessionMetrics={sessionData} oldExp={sessionData.oldExp} setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></PageWrapper>}
        </AnimatePresence>
      </main>
    </div>
  );
}
