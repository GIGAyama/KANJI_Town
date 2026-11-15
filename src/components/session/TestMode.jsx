import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Eye, RotateCcw, Undo2 } from 'lucide-react';
import { motion } from 'framer-motion';
import MotionButton from '../ui/MotionButton';
import ModeLayout from '../ui/ModeLayout';
import KanjiGlyph from '../ui/KanjiGlyph';
import { FormatKun, F, SurvivalRubyText } from '../ui/FormatKun';
import { audioCtrl } from '../../systems/audio';
import { allowedEvaluations, gradeStrokes, recommendEvaluation } from '../../systems/strokeGrader';
import { resolveThemeColor } from '../../utils/theme-colors';
import { attachDrawListeners } from '../../utils/draw-pointer-events';
import { fitSquareCanvas } from '../../utils/canvas-dpr';
import { pickPromptExample } from '../../systems/prompt-example';
import { strokeNormalizedPaths, toNormalizedStroke } from '../../systems/stroke-coords';
import { describeNextReview, migrateCard } from '../../systems/srs';
import { SESSION } from '../../constants/gameConfig';

function getScoreBanner(result) {
  if (!result) return null;
  if (!result.strokeCountMatch) return { text: 'かくすうが ちがうよ💦', color: 'var(--primary)', textColor: 'var(--panel)' };
  if (!result.crossMatch) return { text: 'せんの まじわりが ちがうよ💦', color: 'var(--primary)', textColor: 'var(--panel)' };
  if (result.orderMatch === false) return { text: 'かきじゅんを たしかめよう💦', color: 'var(--accent)', textColor: 'var(--text)' };
  if (result.total >= 80) return { text: 'よく 書けているよ！✨', color: 'var(--secondary)', textColor: 'var(--panel)' };
  if (result.total >= 55) return { text: 'おしい！もうすこし！', color: 'var(--accent)', textColor: 'var(--text)' };
  if (result.total >= 30) return { text: 'むずかしかったね…', color: '#fbbf24', textColor: 'var(--text)' };
  return { text: 'もうすこし れんしゅう しよう', color: 'var(--primary)', textColor: 'var(--panel)' };
}

const EVAL_BUTTONS = [
  { key: 'easy', variant: 'primary', label: 'よくできた！✨', shadow: 'shadow-[0_6px_0_#9f1239]' },
  { key: 'good', variant: 'success', label: '書けた👍', shadow: 'shadow-[0_6px_0_#065f46]' },
  { key: 'hard', variant: 'warning', label: 'むずかしい😓', shadow: 'shadow-[0_4px_0_#92400e]' },
  { key: 'again', variant: 'danger', label: '忘れた💦', shadow: 'shadow-[0_4px_0_#334155]' },
];

/** 評価したあとの次の復習を、子ども向けのことばにする（実際の間隔と同じ計算） */
function nextReviewText(card, evaluation, isPractice) {
  if (evaluation === 'again') return <>もう{F("一度","いちど")}</>;
  // 特訓・ドリルは間隔反復を進めない練習なので、日付は出さない
  if (isPractice) return 'れんしゅう';
  const { unit, value } = describeNextReview(migrateCard(card), evaluation, Date.now(), { minLearningDelay: SESSION.GRACE_PERIOD });
  if (unit === 'minutes') return value >= 60 ? `${Math.round(value / 60)}じかんご` : `${value}ぷんご`;
  return value === 1 ? 'あした' : `${value}にちご`;
}

const TestMode = ({ kanji, card = null, isPractice = false, paths = [], isLoading = false, strokeData, onEvaluate, evaluationLocked = false, canvasSize, commonSidebar, isStacked }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [userStrokes, setUserStrokes] = useState([]);
  const currentPathRef = useRef([]);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [gradeResult, setGradeResult] = useState(null);
  const [recommendedEval, setRecommendedEval] = useState(null);
  // 出題は例文の対象字を◯にした形にする。読みの並び（「カン」）だけでは
  // 漢・感・完・官・刊 のどれか決まらず、正しく書いても不正解になっていた。
  const promptExample = useMemo(() => pickPromptExample(kanji, Math.floor(Math.random() * 8)), [kanji]);

  // 書いた線は 0〜1 の比率で持つ（キャンバスの大きさが変わっても描きなおせるように）
  const userStrokesRef = useRef(userStrokes);
  userStrokesRef.current = userStrokes;

  // 字が変わったら、書いた線と答え合わせを消して次の問題にする
  useEffect(() => {
    setShowAnswer(false); setUserStrokes([]); setGradeResult(null); setRecommendedEval(null);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, [kanji]);

  // キャンバスの大きさが変わったとき（画面の回転・ブラウザの枠の伸び縮み）は、大きさを合わせて描きなおすだけにする。
  // 以前はここで書いた線も答え合わせも消していたので、持ちかえるだけで書きかけのテストが消えていた。
  useEffect(() => {
    // 端末の devicePixelRatio に合わせて鮮明化（上限2）。座標は CSS px のまま。
    const ctx = fitSquareCanvas(canvasRef.current, canvasSize);
    // 書いている途中の1画は、大きさが変わると座標が合わなくなるので取りやめる
    currentPathRef.current = [];
    setIsDrawing(false);
    if (ctx) {
      ctx.strokeStyle = resolveThemeColor('--text'); ctx.lineWidth = canvasSize * 0.06;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      strokeNormalizedPaths(ctx, userStrokesRef.current, canvasSize);
    }
  }, [canvasSize]);

  const startDrawRef = useRef(null); const drawRef = useRef(null); const stopDrawRef = useRef(null);

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasSize / rect.width; const scaleY = canvasSize / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    e.preventDefault(); setIsDrawing(true);
    const { x, y } = getCoords(e);
    lastPosRef.current = { x, y };
    currentPathRef.current = [{ x, y, time: Date.now() }];
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.strokeStyle = resolveThemeColor('--text'); ctx.lineWidth = canvasSize * 0.06;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
  };

  const draw = (e) => {
    e.preventDefault(); if (!isDrawing) return;
    const { x, y } = getCoords(e);
    currentPathRef.current.push({ x, y, time: Date.now() });
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(x, y); ctx.stroke();
    lastPosRef.current = { x, y };
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPathRef.current.length > 1) {
      const stroke = toNormalizedStroke(currentPathRef.current, canvasSize);
      setUserStrokes(prev => [...prev, stroke]);
    }
  };

  startDrawRef.current = startDraw; drawRef.current = draw; stopDrawRef.current = stopDraw;
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    return attachDrawListeners(canvas, {
      onStart: (e) => startDrawRef.current(e),
      onMove: (e) => drawRef.current(e),
      onEnd: (e) => stopDrawRef.current(e),
    });
  }, []);

  const redrawStrokes = (strokes) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.strokeStyle = resolveThemeColor('--text'); ctx.lineWidth = canvasSize * 0.06;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    strokeNormalizedPaths(ctx, strokes, canvasSize);
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasSize, canvasSize);
    setUserStrokes([]);
  };

  const undoLastStroke = () => {
    if (userStrokes.length <= 0 || isDrawing) return;
    const newStrokes = userStrokes.slice(0, -1);
    setUserStrokes(newStrokes);
    redrawStrokes(newStrokes);
    audioCtrl.playSE('click');
  };

  // 1本も書かずに答えを見て「よくできた」を押せないよう、書いてからでないと答え合わせに進めない。
  // 書き順データの読みこみ中は、前の字のお手本で採点してしまうので待つ。
  const canReveal = userStrokes.length > 0 && !isDrawing && !isLoading;
  const handleReveal = () => {
    if (!canReveal) return;
    setShowAnswer(true);
    audioCtrl.playSE('click');
    if (strokeData && strokeData.length > 0) {
      // 線は 0〜1 の比率で持っているので、大きさ 1 として採点する
      const result = gradeStrokes(userStrokes, strokeData, 1);
      setGradeResult(result);
      setRecommendedEval(recommendEvaluation(result));
    }
  };

  const banner = getScoreBanner(gradeResult);
  const allowedKeys = allowedEvaluations(recommendedEval);

  const main = (
    <div className="flex flex-row flex-wrap gap-4 md:gap-6 justify-center items-center w-full h-full overflow-y-auto no-scrollbar content-center pb-4 pt-4">
      <div className="relative border-[4px] border-[var(--text)] rounded-[20px] bg-[var(--panel)] overflow-hidden touch-none transition-all duration-200 shadow-[4px_4px_0_var(--text)] md:shadow-[8px_8px_0_var(--text)] shrink-0" style={{ width: canvasSize, maxWidth: showAnswer ? 'calc(50% - 16px)' : '100%', maxHeight: '100%', aspectRatio: '1/1' }}>
        <div className="absolute top-0 left-1/2 w-0 h-full border-l-4 border-dashed border-[var(--text)] opacity-10 -translate-x-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-full h-0 border-t-4 border-dashed border-[var(--text)] opacity-10 -translate-y-1/2 pointer-events-none" />
        <canvas ref={canvasRef} className="absolute inset-0 z-10 cursor-crosshair w-full h-full touch-none" />
        <div className="absolute top-3 left-3 bg-[var(--text)] text-[var(--panel)] text-[10px] md:text-xs font-bold px-3 py-1 rounded-full opacity-50 pointer-events-none">かくところ</div>
      </div>
      {showAnswer && (
        <div className="relative border-[4px] border-[var(--primary)] rounded-[20px] bg-[var(--bg)] overflow-hidden flex items-center justify-center transition-all duration-200 shadow-[4px_4px_0_var(--primary)] md:shadow-[8px_8px_0_var(--primary)] animate-in fade-in slide-in-from-left-4 shrink-0" style={{ width: canvasSize, maxWidth: 'calc(50% - 16px)', maxHeight: '100%', aspectRatio: '1/1' }}>
          <div className="absolute top-0 left-1/2 w-0 h-full border-l-4 border-dashed border-[var(--primary)] opacity-20 -translate-x-1/2 pointer-events-none" />
          <div className="absolute top-1/2 left-0 w-full h-0 border-t-4 border-dashed border-[var(--primary)] opacity-20 -translate-y-1/2 pointer-events-none" />
          <KanjiGlyph char={kanji.char} paths={paths} loading={isLoading} color="var(--primary)" className="w-full h-full relative z-10 pointer-events-none select-none drop-shadow-sm" />
          <div className="absolute top-3 right-3 bg-[var(--primary)] text-[var(--panel)] text-[10px] md:text-xs font-black px-3 md:px-4 py-1.5 rounded-full border-[3px] border-[var(--text)] shadow-sm z-20">こたえ</div>
        </div>
      )}
    </div>
  );

  const readings = (
    <>
      {kanji.on.length > 0 ? kanji.on.join(' / ') : ''}
      {kanji.on.length > 0 && kanji.kun.length > 0 ? ' / ' : ''}
      {kanji.kun.length > 0 ? kanji.kun.map((k, i) => (<React.Fragment key={i}><FormatKun text={k} />{i < kanji.kun.length - 1 ? ' / ' : ''}</React.Fragment>)) : ''}
    </>
  );

  const info = (
    <div className="bg-[var(--panel)] rounded-2xl p-3 md:p-4 text-center border-[4px] border-[var(--text)] shadow-[4px_4px_0_var(--text)] flex flex-col gap-2">
      {promptExample ? (
        <>
          <div className="text-xs font-bold text-[var(--panel)] bg-[var(--text)] py-1.5 px-4 rounded-full mx-auto w-max mb-1">「◯」の{F("漢字","かんじ")}を {F("書","か")}こう</div>
          <p className="text-xl md:text-2xl font-black text-[var(--text)] ruby-text leading-relaxed" data-testid="test-prompt">
            <SurvivalRubyText text={promptExample} targetChar={kanji.char} />
          </p>
          <details className="text-[var(--text)]">
            <summary className="min-h-[44px] flex items-center justify-center gap-1 cursor-pointer list-none text-xs md:text-sm font-bold opacity-70 rounded-xl hover:bg-[var(--bg)] [&::-webkit-details-marker]:hidden">
              💡 ヒント：{F("読","よ")}みかた
            </summary>
            <div className="text-base md:text-lg font-black tracking-wider pb-1">{readings}</div>
          </details>
        </>
      ) : (
        <>
          <div className="text-xs font-bold text-[var(--panel)] bg-[var(--text)] py-1.5 px-4 rounded-full mx-auto w-max mb-1">この{F("漢字","かんじ")}、{F("書","か")}ける？</div>
          <div className="text-xl md:text-3xl font-black text-[var(--text)] tracking-wider">{readings}</div>
        </>
      )}
    </div>
  );

  const action = (
    <div className="flex flex-col gap-2 md:gap-3">
      {!showAnswer && (
        // 「1画もどす／書きなおす」はキャンバスの外に置く。以前はキャンバスの右下に重ねていたため、
        // 狭い画面では下のほうの画の書きはじめをボタンが受けとり、「かくすうが ちがう」と誤って採点されていた。
        <div className="flex gap-2">
          <MotionButton variant="secondary" onClick={undoLastStroke} disabled={userStrokes.length === 0} className="py-2 text-sm border-[2px] border-[var(--text)] flex-1 shadow-[0_2px_0_var(--text)]"><Undo2 size={16} /> 1{F("画","かく")}もどす</MotionButton>
          <MotionButton variant="secondary" onClick={clearCanvas} disabled={userStrokes.length === 0} className="py-2 text-sm border-[2px] border-[var(--text)] flex-1 shadow-[0_2px_0_var(--text)]"><RotateCcw size={16} /> {F("書","か")}きなおす</MotionButton>
        </div>
      )}
      {!showAnswer ? (
        <>
          {userStrokes.length === 0 && (
            <div className="text-center text-xs md:text-sm font-bold text-[var(--text)] opacity-70" role="status">✏️ まず {F("書","か")}いてみよう</div>
          )}
          <MotionButton variant="primary" onClick={handleReveal} disabled={!canReveal} aria-disabled={!canReveal || undefined} className={`w-full py-5 md:py-8 text-xl md:text-3xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239] ${canReveal ? 'animate-pulse' : ''}`}><Eye size={28} /> こたえあわせ</MotionButton>
        </>
      ) : (
        <div className="flex flex-col gap-2 md:gap-3 animate-in slide-in-from-bottom-2">
          {banner ? (
            <div className="text-center text-sm font-bold py-2 px-3 rounded-xl border-[3px] border-[var(--text)] shadow-sm" style={{ backgroundColor: banner.color, color: banner.textColor }}>
              {banner.text}
            </div>
          ) : (
            <div className="text-center text-sm font-bold text-[var(--text)] bg-[var(--accent)] py-2 rounded-xl border-[3px] border-[var(--text)] shadow-sm">
              {F("自分","じぶん")}に{F("正直","しょうじき")}に{F("評価","ひょうか")}しよう！
            </div>
          )}
          {recommendedEval && (
            <div className="text-center text-[10px] md:text-xs font-bold text-[var(--text)] opacity-70">
              コンピューターの おすすめより 1つ{F("上","うえ")}まで えらべるよ
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {EVAL_BUTTONS.map(btn => {
              const isRecommended = recommendedEval === btn.key;
              const hasRecommendation = recommendedEval !== null;
              const isAllowed = allowedKeys.includes(btn.key);
              return (
                <div key={btn.key} className="relative">
                  {isRecommended && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-2 -right-2 z-10 bg-[var(--accent)] text-[var(--text)] text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[var(--text)] animate-bounce"
                    >
                      おすすめ！
                    </motion.div>
                  )}
                  <MotionButton
                    variant={btn.variant}
                    // 採点できなかった（お手本が無い）ときの評価は、自己申告として記録で区別する
                    onClick={() => { if (isAllowed) onEvaluate(btn.key, { selfReport: !hasRecommendation, gradeResult }); }}
                    disabled={evaluationLocked || !isAllowed}
                    aria-disabled={!isAllowed || undefined}
                    className={`w-full font-black border-[var(--text)] ${
                      isRecommended
                        ? `py-3 md:py-5 text-base md:text-2xl border-[4px] ${btn.shadow} ring-4 ring-[var(--accent)] ring-offset-1`
                        : hasRecommendation
                          ? `py-2 md:py-3 text-sm md:text-base border-[3px] opacity-60`
                          : `py-3 md:py-5 text-base md:text-2xl border-[4px] ${btn.shadow}`
                    }`}
                  >
                    {btn.key === 'good' ? <>{F("書","か")}けた👍</> : btn.key === 'again' ? <>{F("忘","わす")}れた💦</> : btn.label}
                    <span className="text-[10px] md:text-sm font-bold opacity-70 ml-1">
                      （{btn.key === 'again' || isPractice ? null : <>{F("次回","じかい")}：</>}{nextReviewText(card, btn.key, isPractice)}）
                    </span>
                  </MotionButton>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return <ModeLayout mainContent={main} tabsContent={commonSidebar} infoContent={info} actionContent={action} isStacked={isStacked} />;
};

export default TestMode;
