import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useReducedMotionConfig } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Maximize2, Minimize2, Pause, Play, RotateCcw, StepBack, StepForward, Volume2, X } from 'lucide-react';
import ModalDialog from '../ui/ModalDialog';
import { F, FormatKun, RubyText, SurvivalRubyText } from '../ui/FormatKun';
import { KANJI_DATA } from '../../data/kanji-data';
import { audioCtrl } from '../../systems/audio';
import { fetchKanjiVg } from '../../systems/kanjiVg';
import { AUTO_STROKE_MS, DRAW_SECONDS, createLesson, lessonKeyAction, lessonReducer, strokeLook } from '../../systems/lesson-mode';
import { getLocalJaVoice, onVoicesChanged, speakJa, stopSpeaking, toSpeechText } from '../../utils/tts';

// 授業モード（先生向け）: ならった範囲の段・マイドリルの字を、電子黒板に 1 字ずつ大きく映す。
//
// 授業で 新しい字を教えるときの流れ（読む → 書き順を見る → 空書き → たしかめる）を、そのまま画面にした:
//   ・字と読み・例文を 大きく出す
//   ・書き順を「自動で」か「1 画ずつ」見せる。1 画ずつは、空書きの「いち、にー、さん」の かけ声に合わせて おす
//   ・字を かくして、書けるかを たしかめる（例文は ◯ にする）
// 同じ字が その日から 児童の毎日の学習の「新出」に出るので、授業と 家での学習が つながる。
// 進み方の計算は systems/lesson-mode.js（React に依存しない。test/lesson-mode.test.js）。
// 何も保存しない・どこへも送らない（映すだけ）。

const KANJI_BY_ID = new Map(KANJI_DATA.map((kanji) => [kanji.id, kanji]));
/** KanjiVG の座標系 */
const VIEWBOX = 109;
const EMPTY = { char: null, paths: [], strokeData: [], error: false };

const bigButton = 'min-h-[56px] px-3 rounded-2xl border-[3px] border-[var(--text)] font-black text-base md:text-lg flex items-center justify-center gap-2 active:translate-y-0.5 aria-disabled:opacity-40 aria-disabled:active:translate-y-0';

/**
 * @param {{ title: string, kanjiIds: string[], onClose: () => void }} props
 *   title … 上に出す名前（「3年 2学期 1だんめ」など）
 */
const LessonMode = ({ title, kanjiIds, onClose }) => {
  const reduceMotion = useReducedMotionConfig();
  const list = useMemo(() => (kanjiIds || []).map((id) => KANJI_BY_ID.get(id)).filter(Boolean), [kanjiIds]);
  const [vg, setVg] = useState(EMPTY);
  const [loadTry, setLoadTry] = useState(0);
  const contextRef = useRef({ count: list.length, strokes: 0 });
  const [state, dispatch] = useReducer((s, action) => lessonReducer(s, action, contextRef.current), undefined, createLesson);
  const kanji = list[state.index] || null;
  const char = kanji?.char || null;

  // お手本の線（KanjiVG）。どの字のものかを いっしょに持つ（字を うつった しゅんかんに、前の字の線を出さない）
  useEffect(() => {
    if (!char) return undefined;
    let cancelled = false;
    fetchKanjiVg(char).then(({ paths, strokeData }) => {
      if (!cancelled) setVg({ char, paths, strokeData, error: false });
    }).catch(() => {
      if (!cancelled) setVg({ char, paths: [], strokeData: [], error: true });
    });
    return () => { cancelled = true; };
  }, [char, loadTry]);
  // 次の字の お手本を 先に読んでおく
  useEffect(() => {
    const next = list[state.index + 1];
    if (next) fetchKanjiVg(next.char).catch(() => {});
  }, [list, state.index]);

  const ready = vg.char === char && !vg.error;
  const paths = ready ? vg.paths : EMPTY.paths;
  const strokes = paths.length;
  contextRef.current = { count: list.length, strokes };

  // 自動で書く: 1 画ずつ進める
  useEffect(() => {
    if (!state.playing) return undefined;
    const id = setTimeout(() => dispatch({ type: 'tick' }), state.stroke <= 0 ? 400 : AUTO_STROKE_MS);
    return () => clearTimeout(id);
  }, [state.playing, state.stroke]);

  // キーボード・プレゼン用リモコン
  useEffect(() => {
    const onKey = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      // ボタンの上の スペース・Enter は、そのボタンを おす（2 回 動かさない）
      if ((event.key === ' ' || event.key === 'Enter') && event.target instanceof Element && event.target.closest('button, a, input, select')) return;
      const action = lessonKeyAction(event.key, contextRef.current);
      if (!action) return;
      event.preventDefault();
      dispatch(action);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 全画面（電子黒板で ブラウザの わくを かくす）。ことわられても そのまま使える
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      stopSpeaking();
    };
  }, []);
  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
      else await document.documentElement.requestFullscreen?.();
    } catch {
      // 全画面にできない端末でも、ふつうの大きさで使える
    }
  }, []);

  // 例文の読み上げ（端末に入っている日本語の声があるときだけ。外へは送らない）
  const [hasVoice, setHasVoice] = useState(() => Boolean(getLocalJaVoice()));
  useEffect(() => onVoicesChanged(() => setHasVoice(Boolean(getLocalJaVoice()))), []);
  useEffect(() => { stopSpeaking(); }, [state.index]);

  // おせない間の ボタンは disabled にせず aria-disabled にする。disabled にすると 焦点を持てず、
  // 開いたときの焦点が うしろの画面に残ったり、おした ボタンから焦点が消えたりして、リモコンの Enter・スペースが効かなくなる
  const act = (type, off = false) => { if (off) return; audioCtrl.playSE('click'); dispatch({ type }); };

  if (list.length === 0 || !kanji) {
    return (
      <ModalDialog labelId="lesson-title" onEscape={onClose} className="fixed inset-0 z-[70] bg-[var(--bg)] flex flex-col items-center justify-center gap-4 p-6">
        <p id="lesson-title" className="text-xl font-black text-[var(--text)]"><span>うつせる{F('字', 'じ')}が ありません</span></p>
        <button type="button" onClick={onClose} data-autofocus className={`${bigButton} bg-[var(--panel)] text-[var(--text)]`}>とじる</button>
      </ModalDialog>
    );
  }

  const showingAll = state.stroke < 0;
  const numberAt = !showingAll && state.stroke > 0 && ready ? vg.strokeData[state.stroke - 1] : null;
  const examples = (kanji.examples || []).slice(0, 2);
  const strokeLabel = !ready ? '' : showingAll ? `${strokes}かく` : `${state.stroke} / ${strokes}かく`;

  return (
    <ModalDialog labelId="lesson-title" onEscape={onClose} className="fixed inset-0 z-[70] bg-[var(--bg)] text-[var(--text)] flex flex-col" data-testid="lesson-mode" data-index={state.index} data-stroke={state.stroke} data-strokes={strokes} data-hidden={state.hidden ? 'true' : 'false'} data-playing={state.playing ? 'true' : 'false'}>
      <style>{'@keyframes lesson-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }'}</style>

      {/* 上の帯: とじる・名前・字の ならび・全画面 */}
      <div className="shrink-0 flex items-center gap-2 px-2 md:px-4 py-2 border-b-[3px] border-[var(--text)] bg-[var(--panel)]">
        <button type="button" onClick={onClose} aria-label="授業モードを とじる" className="shrink-0 min-w-[48px] min-h-[48px] px-3 rounded-full border-[3px] border-[var(--text)] bg-[var(--panel)] font-black text-sm flex items-center justify-center gap-1">
          <X size={20} aria-hidden="true" />
          <span className="max-sm:hidden">とじる</span>
        </button>
        <h2 id="lesson-title" className="shrink min-w-0 max-w-[34%] truncate text-sm md:text-lg font-black">{title}</h2>
        <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" role="group" aria-label="うつす字">
          {list.map((item, i) => (
            <button key={item.id} type="button" aria-pressed={i === state.index} aria-label={`${i + 1}ばんめ ${item.char}`} onClick={() => { audioCtrl.playSE('click'); dispatch({ type: 'goto', index: i }); }}
              className={`shrink-0 min-w-[48px] min-h-[48px] rounded-xl border-[3px] text-2xl font-black ${i === state.index ? 'bg-[var(--primary)] text-[var(--panel)] border-[var(--primary)]' : 'bg-[var(--panel)] text-[var(--text)] border-[var(--text)]/30'}`}
              style={{ fontFamily: "'Klee One', serif" }} data-lesson-chip={item.char}>
              {state.hidden && i === state.index ? '？' : item.char}
            </button>
          ))}
        </div>
        <button type="button" onClick={toggleFullscreen} aria-pressed={fullscreen} aria-label={fullscreen ? '全画面を やめる' : '全画面に する'} className="shrink-0 min-w-[48px] min-h-[48px] px-3 rounded-xl border-[3px] border-[var(--text)] bg-[var(--panel)] font-black text-sm flex items-center justify-center gap-1">
          {fullscreen ? <Minimize2 size={20} aria-hidden="true" /> : <Maximize2 size={20} aria-hidden="true" />}
          <span className="max-md:hidden">{fullscreen ? 'もとに もどす' : <span>{F('全画面', 'ぜんがめん')}</span>}</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 md:gap-5 p-2 md:p-4 overflow-y-auto">
        {/* 字と 書き順 */}
        <div className="flex flex-col items-center gap-2 lg:flex-1 lg:min-w-0 lg:justify-center">
          <div className="relative rounded-[24px] border-[5px] border-[var(--text)] bg-[var(--panel)] shadow-[6px_6px_0_var(--text)] aspect-square shrink-0" style={{ width: 'min(100%, 60dvh, 680px)' }} data-testid="lesson-board">
            <div className="absolute top-0 left-1/2 w-0 h-full border-l-4 border-dashed border-[var(--text)] opacity-10 -translate-x-1/2" />
            <div className="absolute top-1/2 left-0 w-full h-0 border-t-4 border-dashed border-[var(--text)] opacity-10 -translate-y-1/2" />
            {state.hidden ? (
              <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] font-black" style={{ fontSize: 'min(34dvh, 40vw)' }} aria-label="字を かくしています">？</div>
            ) : vg.char === char && vg.error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                {/* 書き順が読めないときも、字（フォント）と読み・例文は映せる */}
                <span className="font-black leading-none" style={{ fontFamily: "'Klee One', serif", fontSize: 'min(30dvh, 36vw)' }}>{char}</span>
                <button type="button" onClick={() => { setVg(EMPTY); setLoadTry((n) => n + 1); }} className="min-h-[48px] px-4 rounded-xl border-[3px] border-[var(--text)] bg-[var(--bg)] text-sm font-black">
                  <span>{F('書', 'か')}き{F('順', 'じゅん')}を もういちど {F('読', 'よ')}みこむ</span>
                </button>
              </div>
            ) : !ready ? (
              <div className="absolute inset-0 flex items-center justify-center" role="status" aria-label="よみこみ中">
                <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="absolute inset-0 w-full h-full" role="img" aria-label={`${char}（${strokeLabel}）`}>
                {paths.map((d, i) => {
                  const look = strokeLook(i, state.stroke);
                  if (look === 'guide') return <path key={i} d={d} fill="none" stroke="var(--text)" strokeOpacity="0.13" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />;
                  if (look === 'now') {
                    // いま書いた画: 色を変えて、線を引く動きを付ける（「動きを へらす」設定では、はじめから引いた形で出す）
                    return (
                      <path key={`now-${i}`} d={d} fill="none" stroke="var(--primary)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
                        pathLength="1" strokeDasharray="1" strokeDashoffset={reduceMotion ? 0 : 1}
                        style={reduceMotion ? undefined : { animation: `lesson-draw ${DRAW_SECONDS}s ease-out forwards` }} />
                    );
                  }
                  return <path key={i} d={d} fill="none" stroke="var(--text)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />;
                })}
                {numberAt && (
                  <g>
                    <circle cx={numberAt.s.x * VIEWBOX} cy={numberAt.s.y * VIEWBOX} r="5.2" fill="var(--panel)" stroke="var(--primary)" strokeWidth="1.4" />
                    <text x={numberAt.s.x * VIEWBOX} y={numberAt.s.y * VIEWBOX + 2.6} textAnchor="middle" fontSize="7.2" fontWeight="900" fill="var(--primary)">{state.stroke}</text>
                  </g>
                )}
              </svg>
            )}
            {ready && !state.hidden && (
              <div className="absolute right-2 bottom-2 px-3 py-1 rounded-full bg-[var(--text)] text-[var(--panel)] text-base md:text-xl font-black tabular-nums" data-testid="lesson-stroke-count">{strokeLabel}</div>
            )}
          </div>

          {/* 書き順の ボタン */}
          {/* 広い画面では 1 行に ならべて、字の ますを 大きく使う */}
          <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2" style={{ maxWidth: 'min(100%, 760px)' }}>
            <button type="button" onClick={() => act('back', !ready)} aria-disabled={!ready} className={`${bigButton} bg-[var(--panel)] text-[var(--text)]`} data-testid="lesson-back">
              <StepBack size={22} aria-hidden="true" />
              <span>1かく もどる</span>
            </button>
            <button type="button" onClick={() => act('step', !ready)} aria-disabled={!ready} data-autofocus className={`${bigButton} bg-[var(--primary)] text-[var(--panel)] shadow-[0_4px_0_var(--text)]`} data-testid="lesson-step">
              <span>つぎの 1かく</span>
              <StepForward size={22} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => act(state.playing ? 'pause' : 'play', !ready)} aria-disabled={!ready} aria-pressed={state.playing} className={`${bigButton} bg-[var(--accent)] text-[var(--text)]`} data-testid="lesson-play">
              {state.playing ? <Pause size={22} aria-hidden="true" /> : <Play size={22} aria-hidden="true" />}
              <span>{state.playing ? 'とめる' : <span>じどうで {F('書', 'か')}く</span>}</span>
            </button>
            <button type="button" onClick={() => act('restart', !ready)} aria-disabled={!ready} className={`${bigButton} bg-[var(--panel)] text-[var(--text)]`} data-testid="lesson-restart">
              <RotateCcw size={22} aria-hidden="true" />
              <span>はじめから</span>
            </button>
          </div>
        </div>

        {/* 読み・例文・たしかめ */}
        <div className="flex flex-col gap-3 lg:w-[38%] lg:min-w-[320px] lg:max-w-[560px] lg:justify-center">
          <div className="rounded-2xl border-[4px] border-[var(--text)] bg-[var(--panel)] p-3 md:p-4 flex flex-col gap-2">
            <div className="flex items-baseline gap-3 flex-wrap text-sm font-black text-[var(--text-muted)]">
              <span>{kanji.grade}{F('年', 'ねん')}</span>
              <span>{state.index + 1} / {list.length}</span>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 items-baseline" data-testid="lesson-readings">
              <dt className="px-2 py-0.5 rounded-lg bg-[var(--primary)] text-[var(--panel)] text-sm md:text-base font-black">{F('音', 'おん')}</dt>
              <dd className="text-2xl md:text-4xl font-black leading-snug">{kanji.on.length > 0 ? kanji.on.join('・') : '—'}</dd>
              <dt className="px-2 py-0.5 rounded-lg bg-[var(--secondary)] text-[var(--panel)] text-sm md:text-base font-black">{F('訓', 'くん')}</dt>
              <dd className="text-2xl md:text-4xl font-black leading-snug">
                {kanji.kun.length > 0 ? kanji.kun.map((kun, i) => <React.Fragment key={i}>{i > 0 ? '・' : ''}<FormatKun text={kun} /></React.Fragment>) : '—'}
              </dd>
            </dl>
          </div>

          {examples.length > 0 && (
            <div className="rounded-2xl border-[4px] border-[var(--text)] bg-[var(--panel)] p-3 md:p-4 flex flex-col gap-1" data-testid="lesson-examples">
              <div className="text-sm font-black text-[var(--text-muted)]">{state.hidden ? <span>◯に {F('入', 'はい')}る{F('字', 'じ')}は？</span> : <span>つかいかた</span>}</div>
              {examples.map((example, i) => (
                <div key={i} className="flex items-center gap-2">
                  {/* 例文の ふりがなは、設定にかかわらず出す（読みを教える所）。かくしているときは 字を ◯ にする */}
                  <p className="flex-1 min-w-0 text-xl md:text-3xl font-black ruby-text !leading-[2.2]">
                    {state.hidden ? <SurvivalRubyText text={example} targetChar={kanji.char} /> : <RubyText text={example} always />}
                  </p>
                  {hasVoice && !state.hidden && (
                    <button type="button" onClick={() => speakJa(toSpeechText(example), { volume: audioCtrl.volume })} aria-label="例文を 読み上げる" className="shrink-0 min-w-[48px] min-h-[48px] rounded-xl border-[3px] border-[var(--text)] bg-[var(--bg)] flex items-center justify-center">
                      <Volume2 size={22} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={() => act('toggleHidden')} aria-pressed={state.hidden} className={`${bigButton} ${state.hidden ? 'bg-[var(--secondary)] text-[var(--panel)]' : 'bg-[var(--panel)] text-[var(--text)]'}`} data-testid="lesson-hide">
            {state.hidden ? <Eye size={22} aria-hidden="true" /> : <EyeOff size={22} aria-hidden="true" />}
            <span>{state.hidden ? <span>こたえを {F('見', 'み')}る</span> : <span>{F('字', 'じ')}を かくして たしかめる</span>}</span>
          </button>
        </div>
      </div>

      {/* 下の帯: 前の字・次の字 */}
      <div className="shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 md:px-4 py-2 border-t-[3px] border-[var(--text)] bg-[var(--panel)]">
        <button type="button" onClick={() => act('prev', state.index === 0)} aria-disabled={state.index === 0} className={`${bigButton} bg-[var(--panel)] text-[var(--text)]`} data-testid="lesson-prev">
          <ChevronLeft size={24} aria-hidden="true" />
          <span>まえの{F('字', 'じ')}</span>
        </button>
        <div className="px-2 text-lg md:text-2xl font-black tabular-nums" aria-hidden="true">{state.index + 1} / {list.length}</div>
        <button type="button" onClick={() => act('next', state.index >= list.length - 1)} aria-disabled={state.index >= list.length - 1} className={`${bigButton} bg-[var(--panel)] text-[var(--text)]`} data-testid="lesson-next">
          <span>つぎの{F('字', 'じ')}</span>
          <ChevronRight size={24} aria-hidden="true" />
        </button>
      </div>
    </ModalDialog>
  );
};

export default LessonMode;
