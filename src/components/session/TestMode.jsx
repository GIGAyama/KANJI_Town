import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronRight, Eye, HelpCircle, RotateCcw, Undo2 } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import ModeLayout from '../ui/ModeLayout';
import KanjiGlyph from '../ui/KanjiGlyph';
import { FormatKun, F, SurvivalRubyText } from '../ui/FormatKun';
import { audioCtrl } from '../../systems/audio';
import { judgeWriting } from '../../systems/strokeGrader';
import { carelessPenaltyRate } from '../../systems/careless';
import { resolveThemeColor } from '../../utils/theme-colors';
import { attachDrawListeners } from '../../utils/draw-pointer-events';
import { fitSquareCanvas } from '../../utils/canvas-dpr';
import { pickPromptExample } from '../../systems/prompt-example';
import { strokeNormalizedPaths, toNormalizedStroke } from '../../systems/stroke-coords';
import { describeNextReview, migrateCard } from '../../systems/srs';
import { SESSION } from '../../constants/gameConfig';

// 判定の帯の色。どれも「テーマの地の色＋その上で読める文字色」の組にする（test/theme-colors.test.js）
const TONES = {
  great: { backgroundColor: 'var(--secondary)', color: 'var(--panel)' },
  soso: { backgroundColor: 'var(--accent)', color: 'var(--text)' },
  retry: { backgroundColor: 'var(--primary)', color: 'var(--panel)' },
  plain: { backgroundColor: 'var(--bg)', color: 'var(--text)' },
};

/** 採点の講評（strokeGrader の details）のうち、どの画のことかが分かるものを、ひらがなにして出す */
function strokeHints(result) {
  return (result?.details || [])
    .filter((detail) => detail.includes('かくめ'))
    .map((detail) => detail.replace(/^書き順：/, '').replace('書いているよ', 'かいているよ').replace('書く向きが', 'かく むきが'))
    .slice(0, 2);
}

/**
 * 判定（judgeWriting の結果、または「わからない」）を、子どもに見せることばにする。
 * できたかどうかはコンピューターが決める。ここは理由を伝えるだけで、評価は変えない。
 */
function describeJudgment(judgment) {
  const { verdict, evaluation, reason, result, attempt, lenient } = judgment;
  const hints = strokeHints(result);
  if (verdict === 'giveup') {
    return { tone: 'plain', title: <>こたえを よく {F("見","み")}て、もう1{F("回","かい")} {F("書","か")}こう</>, hints: [] };
  }
  if (verdict === 'careless') {
    return { tone: 'retry', title: <>✋ ていねいに {F("書","か")}こう！</>, hints: [] };
  }
  const diff = attempt ? attempt.actualCount - attempt.expectedCount : 0;
  const countHint = diff > 0 ? `${diff}かく おおいよ` : diff < 0 ? `${-diff}かく たりないよ` : null;
  if (verdict === 'pass') {
    if (evaluation === 'easy') return { tone: 'great', title: <>💮 よく {F("書","か")}けているよ！</>, hints };
    if (evaluation === 'good') return { tone: 'great', title: <>⭕ {F("書","か")}けたね！</>, hints };
    if (reason === 'cross') return { tone: 'soso', title: <>🔺 せんの まじわりが ちがうよ</>, hints };
    if (reason === 'order') return { tone: 'soso', title: <>🔺 かきじゅんを たしかめよう</>, hints };
    if (lenient && reason === 'count') return { tone: 'soso', title: <>🔺 かくすうが ちがうよ。つぎは {F("気","き")}をつけよう</>, hints: countHint ? [countHint] : [] };
    if (lenient && reason === 'small') return { tone: 'soso', title: <>🔺 つぎは もっと {F("大","おお")}きく {F("書","か")}こう</>, hints: [] };
    return { tone: 'soso', title: <>🔺 もうすこし ていねいに {F("書","か")}こう</>, hints };
  }
  if (reason === 'count') return { tone: 'retry', title: <>かくすうが ちがうよ💦</>, hints: countHint ? [countHint] : [] };
  if (reason === 'small') return { tone: 'retry', title: <>{F("字","じ")}が {F("小","ちい")}さいよ。ますいっぱいに {F("大","おお")}きく {F("書","か")}こう</>, hints: [] };
  if (reason === 'large') return { tone: 'retry', title: <>{F("字","じ")}が {F("大","おお")}きすぎるよ。ますの {F("中","なか")}に {F("書","か")}こう</>, hints: [] };
  return { tone: 'retry', title: <>{F("形","かたち")}が ちがうよ。お{F("手本","てほん")}を よく {F("見","み")}よう</>, hints };
}

// お手本が読めず採点できないときだけ出す、自己申告のボタン
const SELF_REPORT_BUTTONS = [
  { key: 'easy', variant: 'primary', label: <>よくできた！✨</> },
  { key: 'good', variant: 'success', label: <>{F("書","か")}けた👍</> },
  { key: 'hard', variant: 'warning', label: <>むずかしい😓</> },
  { key: 'again', variant: 'danger', label: <>{F("忘","わす")}れた💦</> },
];

/** 評価したあとの次の復習を、子ども向けのことばにする（実際の間隔と同じ計算） */
function nextReviewText(card, evaluation, isPractice) {
  // 特訓・ドリルは間隔反復を進めない練習なので、日付は出さない
  if (isPractice) return 'れんしゅう';
  const { unit, value } = describeNextReview(migrateCard(card), evaluation, Date.now(), { minLearningDelay: SESSION.GRACE_PERIOD });
  if (unit === 'minutes') return value >= 60 ? `${Math.round(value / 60)}じかんご` : `${value}ぷんご`;
  return value === 1 ? 'あした' : `${value}にちご`;
}

/**
 * 毎日の学習のテスト。お手本を見ないで書き、「こたえあわせ」でコンピューターが採点する。
 *
 * 以前は採点のあとに4つのボタンから児童が評価を選んでいた（おすすめの1段上まで）。
 * おすすめが「忘れた」でも「むずかしい」を選べば先へ進めたので、線を1本引くだけで学習が進んだ。
 * いまは評価を採点で決め、児童が押すのは「つぎへ」か「もう1回」だけ（strokeGrader.js の judgeWriting）。
 *
 * previousFails: この学習で同じ字をやり直した回数。carelessCount: この学習でのてきとう書きの回数。
 * onJudged: 判定が出たとき（スタンプと音）。onCareless: てきとう書きと判定したとき（すぐ数える）。
 * onRevealChange: 答えを見せているあいだはタブを切りかえさせない（見てから書きなおせてしまうため）。
 */
const TestMode = ({ kanji, card = null, isPractice = false, paths = [], isLoading = false, strokeData, onEvaluate, evaluationLocked = false, canvasSize, commonSidebar, isStacked, previousFails = 0, carelessCount = 0, onJudged, onCareless, onRevealChange }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [userStrokes, setUserStrokes] = useState([]);
  const currentPathRef = useRef([]);
  const lastPosRef = useRef({ x: 0, y: 0 });
  // 答え合わせの結果。null のあいだは書いている途中
  const [judgment, setJudgment] = useState(null);
  // 縦に重ねたレイアウトの問題文で、読みかたのヒントを開いているか
  const [hintOpen, setHintOpen] = useState(false);
  const showAnswer = judgment !== null;
  // 出題は例文の対象字を◯にした形にする。読みの並び（「カン」）だけでは
  // 漢・感・完・官・刊 のどれか決まらず、正しく書いても不正解になっていた。
  const promptExample = useMemo(() => pickPromptExample(kanji, Math.floor(Math.random() * 8)), [kanji]);

  // 書いた線は 0〜1 の比率で持つ（キャンバスの大きさが変わっても描きなおせるように）
  const userStrokesRef = useRef(userStrokes);
  userStrokesRef.current = userStrokes;
  const onRevealChangeRef = useRef(onRevealChange);
  onRevealChangeRef.current = onRevealChange;

  // 字が変わったら、書いた線と答え合わせを消して次の問題にする
  useEffect(() => {
    setUserStrokes([]); setJudgment(null); setHintOpen(false);
    onRevealChangeRef.current?.(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, [kanji]);
  // 画面を離れるときは、タブの切りかえをもどす
  useEffect(() => () => onRevealChangeRef.current?.(false), []);

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
    e.preventDefault();
    // 答え合わせのあとは書き足せない（答えを見てから直した字を、もう一度採点させないため）
    if (showAnswer) return;
    setIsDrawing(true);
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

  const reveal = (judged) => {
    setJudgment(judged);
    onRevealChangeRef.current?.(true);
    onJudged?.(judged);
  };

  // 1本も書かずに答え合わせへは進めない。書き順データの読みこみ中は、前の字のお手本で採点してしまうので待つ。
  const canReveal = userStrokes.length > 0 && !isDrawing && !isLoading;
  const handleReveal = () => {
    if (!canReveal || showAnswer) return;
    // 線は 0〜1 の比率で持っているので、大きさ 1 として採点する
    const judged = judgeWriting(userStrokes, strokeData, 1, { previousFails });
    if (judged.verdict === 'careless') {
      // てきとう書きは、ボタンを押す前にやめても数が残るよう、ここで数える
      onCareless?.();
      reveal({ ...judged, carelessNth: carelessCount + 1 });
      return;
    }
    reveal(judged);
  };

  // わからないときは、でたらめに書くかわりに答えを見られる（その字はもう1回。ペナルティは無い）
  const canGiveUp = !isDrawing && !isLoading;
  const handleGiveUp = () => {
    if (!canGiveUp || showAnswer) return;
    reveal({ verdict: 'giveup', evaluation: 'again', reason: 'giveup', result: null, attempt: null, lenient: false });
  };

  const view = judgment && judgment.verdict !== 'ungraded' ? describeJudgment(judgment) : null;
  const passed = judgment?.verdict === 'pass';
  // この字のやり直しが上限に届いたら、次の学習へ回す
  const willDefer = Boolean(judgment) && !passed && previousFails + 1 >= SESSION.MAX_RETRIES;
  // 点数は、画数が合っていて採点できたときだけ出す（てきとう書き・わからない には出さない）
  const score = judgment?.result?.strokeCountMatch && judgment.verdict !== 'careless' ? judgment.result.total : null;
  const penaltyPercent = judgment?.verdict === 'careless' ? Math.round(carelessPenaltyRate(judgment.carelessNth) * 100) : 0;

  const main = (
    // 上下の余白は、答えを並べて見せるときだけ付ける。書いているあいだも付けていたときは、
    // 高さで大きさが決まる画面（タブレットの縦持ちなど）でマスが 30px つぶれて、正方形でなくなっていた。
    <div className={`flex flex-row flex-wrap gap-4 md:gap-6 justify-center items-center w-full h-full overflow-y-auto no-scrollbar content-center ${showAnswer ? 'py-4' : ''}`}>
      <div className="relative border-[4px] border-[var(--text)] rounded-[20px] bg-[var(--panel)] overflow-hidden touch-none transition-all duration-200 shadow-[4px_4px_0_var(--text)] md:shadow-[8px_8px_0_var(--text)] shrink-0" style={{ width: canvasSize, maxWidth: showAnswer ? 'calc(50% - 16px)' : '100%', maxHeight: '100%', aspectRatio: '1/1' }}>
        <div className="absolute top-0 left-1/2 w-0 h-full border-l-4 border-dashed border-[var(--text)] opacity-10 -translate-x-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-full h-0 border-t-4 border-dashed border-[var(--text)] opacity-10 -translate-y-1/2 pointer-events-none" />
        <canvas ref={canvasRef} className="absolute inset-0 z-10 cursor-crosshair w-full h-full touch-none" />
        <div className="absolute top-3 left-3 bg-[var(--text-muted)] text-[var(--panel)] text-xs font-bold px-3 py-1 rounded-full pointer-events-none">かくところ</div>
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

  // 横に並べたレイアウトでは、問題文を右の列に出す。
  const info = isStacked ? null : (
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

  // 縦に重ねたレイアウト（スマホ・タブレットの縦持ち）では、問題文をボタンのすぐ上に出す。
  // 以前はキャンバスの下のスクロールする所にあり、タブレットの縦持ちでは下のボタンに隠れて、
  // スクロールしないと「何を書くか」が見えなかった。自己採点をやめたので、見えないまま書かせない。
  const compactPrompt = isStacked && (
    <div className="bg-[var(--panel)] rounded-xl border-[3px] border-[var(--text)] px-2 py-1 [@media(max-height:699px)]:py-0.5 flex items-center gap-1">
      <div className="flex-1 min-w-0 text-center">
        {/* 背の低いスマホでは、キャンバスを隠さないよう見出しを省く（文の「◯」が問題そのもの） */}
        <div className="text-[10px] font-bold text-[var(--text-muted)] leading-tight [@media(max-height:699px)]:hidden">{promptExample ? <>「◯」の{F("漢字","かんじ")}を {F("書","か")}こう</> : <>この{F("漢字","かんじ")}、{F("書","か")}ける？</>}</div>
        {promptExample && (
          <p className="text-lg [@media(max-height:699px)]:text-base font-black text-[var(--text)] ruby-text !leading-[2.1]" data-testid="test-prompt">
            <SurvivalRubyText text={promptExample} targetChar={kanji.char} />
          </p>
        )}
        {(hintOpen || !promptExample) && <div className="text-sm font-black tracking-wider text-[var(--text)] pb-0.5">{readings}</div>}
      </div>
      {promptExample && (
        <button type="button" onClick={() => setHintOpen((open) => !open)} aria-expanded={hintOpen} aria-label="ヒント：読みかた" className="shrink-0 w-12 h-12 [@media(max-height:699px)]:w-11 [@media(max-height:699px)]:h-11 rounded-xl border-2 border-[var(--text)] bg-[var(--bg)] text-lg flex items-center justify-center">💡</button>
      )}
    </div>
  );

  // 「1画もどす／書きなおす」はキャンバスの外に置く。以前はキャンバスの右下に重ねていたため、
  // 狭い画面では下のほうの画の書きはじめをボタンが受けとり、「かくすうが ちがう」と誤って採点されていた。
  const undoButton = (
    <MotionButton variant="secondary" onClick={undoLastStroke} disabled={userStrokes.length === 0} className="py-2 text-xs sm:text-sm border-[2px] border-[var(--text)] flex-1 shadow-[0_2px_0_var(--text)] !gap-1"><Undo2 size={16} className="shrink-0" /> 1{F("画","かく")}もどす</MotionButton>
  );
  const clearButton = (
    <MotionButton variant="secondary" onClick={clearCanvas} disabled={userStrokes.length === 0} className="py-2 text-xs sm:text-sm border-[2px] border-[var(--text)] flex-1 shadow-[0_2px_0_var(--text)] !gap-1"><RotateCcw size={16} className="shrink-0" /> {F("書","か")}きなおす</MotionButton>
  );
  const revealButton = (
    <MotionButton variant="primary" onClick={handleReveal} disabled={!canReveal} aria-disabled={!canReveal || undefined} data-testid="test-reveal" className={`w-full ${isStacked ? 'py-3 [@media(max-height:699px)]:py-2 text-xl' : 'py-5 md:py-8 text-xl md:text-3xl'} font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239] ${canReveal ? 'animate-pulse' : ''}`}><Eye size={28} /> こたえあわせ</MotionButton>
  );
  // 高さの下限は style で置く（index.css の button の 44px が、min-h のユーティリティより強いため）
  const writingActions = isStacked ? (
    <>
      {compactPrompt}
      <div className="flex gap-1.5">
        {undoButton}
        {clearButton}
        <MotionButton variant="secondary" onClick={handleGiveUp} disabled={!canGiveUp} data-testid="test-giveup" style={{ minHeight: 48 }} className="py-2 text-xs sm:text-sm border-[2px] border-[var(--text)] flex-1 shadow-[0_2px_0_var(--text)] !gap-1"><HelpCircle size={16} className="shrink-0" /> わからない</MotionButton>
      </div>
      {revealButton}
    </>
  ) : (
    <>
      <div className="flex gap-2">
        {undoButton}
        {clearButton}
      </div>
      {userStrokes.length === 0 && (
        <div className="text-center text-xs md:text-sm font-bold text-[var(--text-muted)]" role="status">✏️ まず {F("書","か")}いてみよう</div>
      )}
      {revealButton}
      <MotionButton variant="secondary" onClick={handleGiveUp} disabled={!canGiveUp} data-testid="test-giveup" style={{ minHeight: 48 }} className="w-full py-2 text-sm md:text-base border-[2px] border-[var(--text)] shadow-[0_2px_0_var(--text)]"><HelpCircle size={18} /> わからない（こたえを {F("見","み")}る）</MotionButton>
    </>
  );

  const selfReportActions = (
    <>
      <div className="text-center text-sm font-bold text-[var(--text)] bg-[var(--accent)] py-2 rounded-xl border-[3px] border-[var(--text)] shadow-sm">
        {F("自分","じぶん")}に{F("正直","しょうじき")}に{F("評価","ひょうか")}しよう！
      </div>
      <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
        {SELF_REPORT_BUTTONS.map(btn => (
          <MotionButton
            key={btn.key}
            variant={btn.variant}
            // 採点できなかった（お手本が無い）ときの評価は、自己申告として記録で区別する
            onClick={() => onEvaluate(btn.key, { selfReport: true, gradeResult: null })}
            disabled={evaluationLocked}
            className="w-full py-3 md:py-5 text-base md:text-2xl font-black border-[4px] border-[var(--text)]"
          >
            {btn.label}
          </MotionButton>
        ))}
      </div>
    </>
  );

  const judgedActions = view && (
    <>
      <div
        role="status"
        data-testid="test-verdict"
        data-verdict={judgment.verdict}
        data-evaluation={judgment.evaluation}
        className="text-center text-sm md:text-base font-black py-2 px-3 rounded-xl border-[3px] border-[var(--text)] shadow-sm leading-relaxed"
        style={TONES[view.tone]}
      >
        {view.title}
        {score !== null && <span className="ml-2 whitespace-nowrap" data-testid="test-score">{score}{F("点","てん")}</span>}
      </div>
      {view.hints.length > 0 && (
        <ul className="text-xs md:text-sm font-bold text-[var(--text)] bg-[var(--bg)] rounded-xl border-2 border-[var(--text)] px-3 py-1.5 leading-relaxed">
          {view.hints.map((hint) => <li key={hint}>・{hint}</li>)}
        </ul>
      )}
      {judgment.verdict === 'careless' && (
        <div className="text-xs md:text-sm font-bold text-[var(--text)] bg-[var(--bg)] rounded-xl border-2 border-[var(--text)] px-3 py-2 leading-relaxed" data-testid="test-careless-note">
          {penaltyPercent > 0
            ? <>てきとうに {F("書","か")}いたので、この{F("回","かい")}に もらえる EXP が <strong>{penaltyPercent}%</strong> へるよ。</>
            : <>つぎに てきとうに {F("書","か")}くと、もらえる EXP が へるよ。</>}
          <br />わからないときは「わからない」を おしてね。
        </div>
      )}
      {passed ? (
        <MotionButton
          variant="primary"
          onClick={() => onEvaluate(judgment.evaluation, { gradeResult: judgment.result })}
          disabled={evaluationLocked}
          aria-disabled={evaluationLocked || undefined}
          data-testid="test-next"
          className="w-full py-4 md:py-6 text-xl md:text-2xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239]"
        >
          つぎへ <ChevronRight size={26} />
          <span className="text-[10px] md:text-sm font-bold opacity-80">（{isPractice ? null : <>{F("次回","じかい")}：</>}{nextReviewText(card, judgment.evaluation, isPractice)}）</span>
        </MotionButton>
      ) : (
        <>
          <MotionButton
            variant={willDefer ? 'secondary' : 'primary'}
            onClick={() => onEvaluate('again', { gradeResult: judgment.result })}
            disabled={evaluationLocked}
            aria-disabled={evaluationLocked || undefined}
            data-testid="test-retry"
            className={`w-full py-4 md:py-6 text-lg md:text-2xl font-black border-[4px] border-[var(--text)] ${willDefer ? 'shadow-[0_4px_0_var(--text)]' : 'shadow-[0_6px_0_#9f1239]'}`}
          >
            {willDefer
              ? <>この{F("字","じ")}は また こんど <ChevronRight size={24} /></>
              : <>お{F("手本","てほん")}を {F("見","み")}て もう1{F("回","かい")} <ChevronRight size={24} /></>}
          </MotionButton>
          {willDefer && (
            <p className="text-[11px] md:text-xs font-bold text-[var(--text-muted)] text-center">つぎの {F("学習","がくしゅう")}で また {F("出","で")}てくるよ</p>
          )}
        </>
      )}
    </>
  );

  const action = (
    <div className={`flex flex-col ${isStacked ? 'gap-1.5 [@media(max-height:699px)]:gap-1 sm:gap-2' : 'gap-2 md:gap-3'}`}>
      {!showAnswer
        ? writingActions
        : <div className="flex flex-col gap-2 md:gap-3 animate-in slide-in-from-bottom-2">{view ? judgedActions : selfReportActions}</div>}
    </div>
  );

  return <ModeLayout mainContent={main} tabsContent={commonSidebar} infoContent={info} actionContent={action} isStacked={isStacked} />;
};

export default TestMode;
