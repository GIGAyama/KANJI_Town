import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, PlayCircle, Pencil, CheckCircle2, Star, ChevronRight } from 'lucide-react';
import StampEffect from '../ui/StampEffect';
import { audioCtrl } from '../../systems/audio';
import ReadMode from './ReadMode';
import WatchMode from './WatchMode';
import WriteMode from './WriteMode';
import TestMode from './TestMode';
import { Analyzer } from '../../systems/analyzer';
import { fetchKanjiVg } from '../../systems/kanjiVg';
import { F } from '../ui/FormatKun';
import { useLearningViewport } from '../../hooks/useLearningViewport';
import { getRecommendedPracticeMode } from '../../systems/mastery';

const MODE_LABELS = { read: '音読', watch: '書き順', write: 'なぞる', test: 'テスト' };
const WRITING_SKILLS = { skills: ['writing', 'stroke'] };

const SessionView = ({ queue: initialQueue, totalCount, stats, settings = {}, onUpdateStat, onRecordSkillEvidence, onProgress, onFinish, onRecordPerfect, onRecordEasy, onRecordVoiced, isResumed = false }) => {
  const [queue, setQueue] = useState(initialQueue); const [mode, setMode] = useState('read'); const [paths, setPaths] = useState([]); const [strokeData, setStrokeData] = useState([]); const [crossMatrix, setCrossMatrix] = useState([]); const [isLoading, setIsLoading] = useState(false);
  const { canvasSize, isStacked } = useLearningViewport();
  const [activeStamp, setActiveStamp] = useState(null); const [combo, setCombo] = useState(0); const [reachedStep, setReachedStep] = useState(0);
  const [focusMode, setFocusMode] = useState('read');
  const currentKanji = queue[0]; const isNew = !stats[currentKanji?.id] || stats[currentKanji?.id].status === 'new'; const MODES = useMemo(() => ['read', 'watch', 'write', 'test'], []);
  const [fetchError, setFetchError] = useState(null);
  const [showResumeNotice, setShowResumeNotice] = useState(isResumed);
  // 音読チャレンジ: クリア済み漢字ID(1漢字につきセッション中1回だけ)とセッション累計
  const [voicedKanjiIds, setVoicedKanjiIds] = useState(() => new Set());
  const [voicedCount, setVoicedCount] = useState(0);
  const sessionTotal = Math.max(Number(totalCount) || 0, initialQueue.length, 1);
  const completedCount = Math.max(0, sessionTotal - queue.length);

  useEffect(() => {
    if (!showResumeNotice) return undefined;
    const timer = setTimeout(() => setShowResumeNotice(false), 3200);
    return () => clearTimeout(timer);
  }, [showResumeNotice]);

  useEffect(() => {
    if (!currentKanji) return;
    const recommendedMode = getRecommendedPracticeMode(stats[currentKanji.id], { isNew });
    setMode(recommendedMode);
    setFocusMode(recommendedMode);
    setReachedStep(isNew ? 0 : MODES.indexOf(recommendedMode));
    const abortCtrl = new AbortController();
    const load = async () => {
      setIsLoading(true); setFetchError(null);
      try {
        const { paths: p, strokeData: data } = await fetchKanjiVg(currentKanji.char, { signal: abortCtrl.signal });
        if (abortCtrl.signal.aborted) return;
        setPaths(p); setStrokeData(data);
        const cMatrix = data.map((_, i) => data.map((__, j) => i !== j && Analyzer.isCrossed(data[i].points, data[j].points)));
        setCrossMatrix(cMatrix);
      } catch (e) {
        if (abortCtrl.signal.aborted || e?.name === 'AbortError') return;
        setPaths([]); setCrossMatrix([]); setStrokeData([]);
        setFetchError('よみこみに しっぱいしました。\nもういちど ためしてね。');
      } finally {
        if (!abortCtrl.signal.aborted) setIsLoading(false);
      }
    }; load();
    return () => { abortCtrl.abort(); };
  }, [currentKanji, isNew, MODES]);

  useEffect(() => { const stepIdx = MODES.indexOf(mode); if (stepIdx > reachedStep) setReachedStep(stepIdx); }, [mode, reachedStep, MODES]);

  // キーボードで mode をタブ切替（test モード以外。test は内部で書き取り操作と競合）
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (mode === 'test' || mode === 'write') return; // 描画系では無効
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const curIdx = MODES.indexOf(mode);
      const nextIdx = curIdx + dir;
      if (nextIdx < 0 || nextIdx >= MODES.length) return;
      if (isNew && nextIdx > reachedStep) return;
      e.preventDefault();
      audioCtrl.playSE('click');
      setMode(MODES[nextIdx]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, MODES, isNew, reachedStep]);

  const handleEvaluation = (evalType) => {
    if (evalType === 'easy') onRecordEasy();
    if (evalType === 'easy' || evalType === 'good') { const newC = combo + 1; setCombo(newC); }
    else { setCombo(0); }
    audioCtrl.playSE(evalType === 'again' ? 'stamp_bad' : evalType === 'easy' ? 'stamp_perfect' : evalType === 'hard' ? 'click' : 'stamp_good');
    setActiveStamp(evalType === 'hard' ? 'good' : evalType); // hard は good スタンプで表示
    setTimeout(() => {
      setActiveStamp(null);
      const success = onUpdateStat(currentKanji, evalType, WRITING_SKILLS);
      if (success) {
        const nextQueue = queue.slice(1);
        onProgress?.(nextQueue);
        if (nextQueue.length === 0) onFinish();
        else setQueue(nextQueue);
      } else {
        const nextQueue = [...queue.slice(1), currentKanji];
        onProgress?.(nextQueue);
        setQueue(nextQueue);
        setMode('watch');
      }
    }, evalType === 'again' ? 1500 : 900); // again以外は短めに
  };
  const recordSkills = (updates) => onRecordSkillEvidence?.(currentKanji, updates);

  const handleChallengeClear = () => {
    if (!currentKanji || voicedKanjiIds.has(currentKanji.id)) return;
    setVoicedKanjiIds((prev) => new Set(prev).add(currentKanji.id));
    setVoicedCount((c) => c + 1);
    recordSkills([{ skill: 'reading', evidence: 'voiced' }]);
    onRecordVoiced?.();
  };

  if (!currentKanji) return null;

  const commonSidebarTop = (
    <div className="flex flex-col gap-2 md:gap-3 shrink-0 mb-1 md:mb-4">
      <div className={`grid ${isStacked ? 'grid-cols-4' : 'grid-cols-2'} gap-1.5 md:gap-2`}>
        {[{ id: 'read', icon: <Volume2 size={18} />, label: <>{F("音","おん")}{F("読","どく")}</> }, { id: 'watch', icon: <PlayCircle size={18} />, label: <>{F("書","か")}き{F("順","じゅん")}</> }, { id: 'write', icon: <Pencil size={18} />, label: "なぞる" }, { id: 'test', icon: <CheckCircle2 size={18} />, label: "テスト" }].map((t, idx) => {
          const isDisabled = isNew && idx > reachedStep;
          return (
            <button
              key={t.id}
              onClick={() => { if (isDisabled) { audioCtrl.playSE('stamp_bad'); return; } audioCtrl.playSE('click'); setMode(t.id); }}
              disabled={isDisabled}
              aria-current={mode === t.id ? 'step' : undefined}
              aria-disabled={isDisabled || undefined}
              title={isDisabled ? `まずは「${MODES[reachedStep] === 'read' ? '音読' : MODES[reachedStep] === 'watch' ? '書き順' : MODES[reachedStep] === 'write' ? 'なぞる' : 'テスト'}」をやってみよう` : undefined}
              className={`flex flex-col items-center justify-center py-2.5 rounded-xl font-bold text-[10px] sm:text-xs border-[3px] transition-all ${mode === t.id ? "bg-[var(--text)] text-[var(--panel)] border-[var(--text)] shadow-[2px_2px_0_var(--primary)] scale-105" : isDisabled ? "bg-gray-100 text-gray-400 border-gray-300 opacity-50 cursor-not-allowed" : "bg-[var(--panel)] text-[var(--text)] border-[var(--text)] hover:bg-[var(--bg)]"}`}
            >
              {t.icon} <span className="mt-1">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[var(--panel)] rounded-none md:rounded-[24px] shadow-none md:shadow-[6px_6px_0_var(--text)] border-0 md:border-[4px] border-[var(--text)] p-2 md:p-3 flex flex-col h-full overflow-hidden relative">
      <AnimatePresence>
        {showResumeNotice && (
          <motion.div
            initial={{ opacity: 0, y: -12, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -8, x: '-50%' }}
            role="status"
            className="absolute top-14 md:top-16 left-1/2 z-40 whitespace-nowrap rounded-full border-[3px] border-[var(--text)] bg-emerald-100 px-4 py-2 text-xs md:text-sm font-black text-emerald-800 shadow-[3px_3px_0_var(--text)]"
          >
            ✓ つづきから再開しました
          </motion.div>
        )}
      </AnimatePresence>
      <StampEffect stamp={activeStamp} />
      <div className="flex justify-between items-center mb-1.5 md:mb-2 shrink-0 gap-2">
        <div className="text-[var(--text)] font-bold text-xs md:text-sm bg-[var(--bg)] px-2.5 md:px-4 py-1.5 md:py-2 rounded-full border-[3px] border-[var(--text)] shadow-sm flex items-center gap-1.5" aria-live="polite">のこり <span className="text-base md:text-lg font-black">{queue.length}</span> {F("文字","もじ")}</div>
        <div className="flex gap-2">
          {voicedCount > 0 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[var(--text)] font-black text-xs md:text-sm bg-emerald-100 px-2.5 md:px-4 py-1.5 md:py-2 rounded-full border-[3px] border-emerald-400 shadow-sm flex items-center gap-1">🎤 ×{voicedCount}</motion.div>}
          {combo > 1 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[var(--text)] font-black text-xs md:text-sm bg-[var(--accent)] px-2.5 md:px-4 py-1.5 md:py-2 rounded-full border-[3px] border-[var(--text)] shadow-sm flex items-center gap-1">{combo} COMBO 🔥</motion.div>}
          {!isNew && focusMode !== 'test' && <div className="text-[var(--text)] font-black text-[10px] md:text-xs bg-sky-100 px-2.5 md:px-3 py-1.5 md:py-2 rounded-full border-[3px] border-sky-400 shadow-sm">おすすめ：{MODE_LABELS[focusMode]}から</div>}
          {isNew && <div className="text-[var(--panel)] font-bold text-xs md:text-sm bg-[var(--primary)] px-2.5 md:px-4 py-1.5 md:py-2 rounded-full flex items-center gap-1 border-[3px] border-[var(--text)] shadow-sm"><Star size={15} /> {F("新出","しんしゅつ")}</div>}
        </div>
      </div>
      <div className="h-2 shrink-0 rounded-full bg-[var(--bg)] border-2 border-[var(--text)] overflow-hidden mb-1.5 md:mb-2" role="progressbar" aria-label="学習の進み具合" aria-valuemin="0" aria-valuemax={sessionTotal} aria-valuenow={completedCount}>
        <motion.div className="h-full bg-[var(--secondary)]" animate={{ width: `${(completedCount / sessionTotal) * 100}%` }} />
      </div>
      <div className="flex-1 min-h-0 w-full relative">
        {fetchError ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
            <div className="text-5xl">😢</div>
            <p className="text-[var(--text)] font-bold text-lg whitespace-pre-line">{fetchError}</p>
            <button
              disabled={isLoading}
              onClick={() => {
                if (isLoading) return;
                setFetchError(null);
                setIsLoading(true);
                fetchKanjiVg(currentKanji.char)
                  .then(({ paths: p, strokeData: data }) => {
                    setPaths(p); setStrokeData(data);
                    const cMatrix = data.map((_, i) => data.map((__, j) => i !== j && Analyzer.isCrossed(data[i].points, data[j].points)));
                    setCrossMatrix(cMatrix);
                  })
                  .catch(() => setFetchError('よみこみに しっぱいしました。\nもういちど ためしてね。'))
                  .finally(() => setIsLoading(false));
              }}
              className={`bg-[var(--primary)] text-white font-black text-lg px-8 py-3 rounded-2xl border-[3px] border-[var(--text)] shadow-[3px_3px_0_var(--text)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'よみこみ中...' : '🔄 もういちど ためす'}
            </button>
          </div>
        ) : (
          <>
            {mode === 'read' && <ReadMode kanji={currentKanji} settings={settings} challengeCleared={voicedKanjiIds.has(currentKanji.id)} onChallengeClear={handleChallengeClear} onNext={() => { recordSkills([{ skill: 'reading', evidence: 'exposed' }, { skill: 'meaning', evidence: 'exposed' }]); setMode('watch'); }} commonSidebar={commonSidebarTop} isStacked={isStacked} />}
            {mode === 'watch' && <WatchMode paths={paths} strokeData={strokeData} isLoading={isLoading} onNext={() => { recordSkills([{ skill: 'stroke', evidence: 'exposed' }]); setMode('write'); }} canvasSize={canvasSize} commonSidebar={commonSidebarTop} isStacked={isStacked} />}
            {mode === 'write' && <WriteMode paths={paths} strokeData={strokeData} crossMatrix={crossMatrix} onNext={() => setMode('test')} onPracticeComplete={(evidence) => recordSkills([{ skill: 'writing', evidence }, { skill: 'stroke', evidence }])} canvasSize={canvasSize} commonSidebar={commonSidebarTop} onRecordPerfect={onRecordPerfect} isStacked={isStacked} />}
            {mode === 'test' && <TestMode kanji={currentKanji} strokeData={strokeData} onEvaluate={handleEvaluation} canvasSize={canvasSize} commonSidebar={commonSidebarTop} isStacked={isStacked} />}
          </>
        )}
      </div>
    </div>
  );
};

export default SessionView;
