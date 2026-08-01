import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotionConfig } from 'framer-motion';
import { Volume2, ChevronRight, Mic } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import ModeLayout from '../ui/ModeLayout';
import { FormatKun, RubyText, F } from '../ui/FormatKun';
import { audioCtrl } from '../../systems/audio';
import { useVoiceCheck } from '../../hooks/useVoiceCheck';
import { isReadingCheckEnabled, isAutoPlayEnabled } from '../../utils/reading-preference';
import { getLocalJaVoice, onVoicesChanged, speakJa, stopSpeaking, toSpeechText, toKunSpeech } from '../../utils/tts';
import { READING } from '../../constants/gameConfig';

const ReadMode = ({ kanji, onNext, commonSidebar, isStacked, settings = {}, challengeCleared = false, onChallengeClear }) => {
  const [exampleIdx, setExampleIdx] = useState(() => Math.floor(Math.random() * kanji.examples.length));
  // キュー前進時は remount されず kanji だけ差し替わるため、範囲外アクセスを防ぐ
  const safeIdx = kanji.examples.length > 0 ? exampleIdx % kanji.examples.length : 0;
  const example = kanji.examples[safeIdx];

  const readingCheckOn = isReadingCheckEnabled(settings);
  const { status, progress, level, showGentlePrompt, start, stop } = useVoiceCheck({
    enabled: readingCheckOn && !challengeCleared,
    resetKey: kanji.id,
  });
  const micActive = status === 'requesting' || status === 'calibrating' || status === 'listening';
  const cleared = challengeCleared || status === 'passed';
  const reduceMotion = useReducedMotionConfig();

  // 端末内蔵の日本語音声(お手本読み上げ)。リストは非同期に届くことがある
  const [hasJaVoice, setHasJaVoice] = useState(() => Boolean(getLocalJaVoice()));
  useEffect(() => onVoicesChanged(() => setHasJaVoice(Boolean(getLocalJaVoice()))), []);
  const speak = (text) => {
    if (audioCtrl.muted || micActive) return;
    speakJa(text, { volume: audioCtrl.volume });
  };

  // チャレンジクリア: SE と報酬記録は1漢字1回だけ
  const clearHandledRef = useRef(false);
  const onChallengeClearRef = useRef(onChallengeClear);
  useEffect(() => { onChallengeClearRef.current = onChallengeClear; });
  useEffect(() => {
    if (status === 'passed' && !clearHandledRef.current) {
      clearHandledRef.current = true;
      audioCtrl.playSE('stamp_good');
      onChallengeClearRef.current?.();
    }
  }, [status]);

  // 漢字が変わったら例文を引き直し、設定ONならお手本を1回だけ自動再生する
  useEffect(() => {
    const idx = Math.floor(Math.random() * Math.max(kanji.examples.length, 1));
    setExampleIdx(idx);
    clearHandledRef.current = false;
    let timer = null;
    if (isAutoPlayEnabled(settings) && !audioCtrl.muted && kanji.examples[idx]) {
      timer = setTimeout(() => speakJa(toSpeechText(kanji.examples[idx]), { volume: audioCtrl.volume }), 400);
    }
    return () => {
      if (timer) clearTimeout(timer);
      stopSpeaking();
    };
    // settings はレンダーごとに新しいオブジェクトになるため kanji.id だけを見る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kanji.id]);

  const handleStartChallenge = () => {
    stopSpeaking(); // お手本の音声をマイクが拾わないように止めてから開始
    audioCtrl.playSE('click');
    start();
  };

  const handleNextExample = () => {
    setExampleIdx((prev) => (prev + 1) % kanji.examples.length);
    // チェック中は効果音がマイクに入らないよう鳴らさない
    if (!micActive) audioCtrl.playSE('click');
  };

  const main = (<div className="text-[clamp(10rem,30vmin,22rem)] leading-none font-black text-[var(--text)] drop-shadow-md select-none" style={{ fontFamily: "'Klee One', serif" }}>{kanji.char}</div>);

  const statusCopy = status === 'requesting'
    ? <>マイクの じゅんびちゅう…</>
    : status === 'calibrating'
      ? <>きいてるよ…</>
      : showGentlePrompt
        ? <>もうすこし おおきな {F("声","こえ")}で よんでみよう</>
        : progress > 0
          ? <>きこえてるよ！ そのちょうし！</>
          : <>{F("声","こえ")}に だして よんでみよう！</>;

  const challengeCard = readingCheckOn && (
    <div className="bg-[var(--panel)] rounded-xl px-4 py-3 border-[3px] border-[var(--text)] shadow-sm flex flex-col gap-2">
      {cleared ? (
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="font-black text-emerald-600 text-sm md:text-base">💮 じょうずに よめました！</div>
          <div className="text-[11px] font-bold text-[var(--text)] opacity-60 mt-0.5">{F("音読","おんどく")}チャレンジ クリア ＋{READING.CHALLENGE_BONUS_EXP} EXP</div>
        </motion.div>
      ) : status === 'unsupported' || status === 'denied' || status === 'error' ? (
        <div className="text-xs font-bold text-[var(--text)] opacity-60 text-center leading-relaxed">マイクが つかえないから、{F("声","こえ")}に だして よんでみてね</div>
      ) : micActive ? (
        <>
          <div className="text-xs font-black text-[var(--text)] text-center" aria-live="polite">{statusCopy}</div>
          <div className="flex items-center gap-2" aria-hidden="true">
            <Mic size={14} className={level > 0.2 ? 'text-rose-500' : 'text-[var(--text)] opacity-40'} />
            <div className="flex-1 h-2.5 rounded-full bg-[var(--bg)] border-2 border-[var(--text)] overflow-hidden">
              <div className="h-full bg-rose-400 transition-[width] duration-100" style={{ width: `${Math.round(level * 100)}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[var(--text)] opacity-50 shrink-0">クリアまで</span>
            <div className="flex-1 h-2.5 rounded-full bg-[var(--bg)] border-2 border-[var(--text)] overflow-hidden" role="progressbar" aria-label="音読チャレンジの進み具合" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)}>
              <motion.div className="h-full bg-[var(--secondary)]" animate={{ width: `${Math.round(progress * 100)}%` }} transition={{ duration: 0.15 }} />
            </div>
          </div>
          <button onClick={() => stop()} className="text-[10px] font-bold text-[var(--text)] opacity-50 underline mx-auto hover:opacity-80">やめる</button>
        </>
      ) : (
        <>
          <MotionButton
            variant="secondary"
            onClick={handleStartChallenge}
            animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
            transition={reduceMotion ? undefined : { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="w-full py-2.5 text-sm font-black border-[3px] border-[var(--text)]"
          >
            <Mic size={18} className="text-rose-500" /> {F("音読","おんどく")}チャレンジ
          </MotionButton>
          <div className="text-[10px] font-bold text-[var(--text)] text-center opacity-50">{F("声","こえ")}に だして よむと ボーナスEXP！ろくおんは しないよ</div>
        </>
      )}
    </div>
  );

  const info = (
    <>
      <div className="flex flex-col gap-4 bg-[var(--panel)] p-4 rounded-2xl border-[4px] border-[var(--text)] shadow-[4px_4px_0_var(--text)]">
        <div className="bg-[var(--accent)] text-[var(--text)] px-4 py-1.5 rounded-full text-sm font-black border-[3px] border-[var(--text)] text-center shadow-sm -mt-8 mx-auto w-max">{F("声","こえ")}にだそう！</div>
        <div className="relative min-h-[80px] flex items-center justify-center">
          <AnimatePresence mode="wait"><motion.p key={safeIdx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="ruby-text text-xl md:text-2xl font-bold text-[var(--text)] text-center py-2"><RubyText text={example} /></motion.p></AnimatePresence>
          {hasJaVoice && (<button onClick={() => speak(toSpeechText(example))} disabled={micActive} aria-label="例文を読み上げる" className={`absolute -left-2 top-1/2 -translate-y-1/2 bg-[var(--bg)] border-2 border-[var(--text)] rounded-full p-1 transition-colors shadow-sm ${micActive ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--text)] hover:text-white'}`}><Volume2 size={20} /></button>)}
          {kanji.examples.length > 1 && (<button onClick={handleNextExample} className="absolute -right-2 top-1/2 -translate-y-1/2 bg-[var(--bg)] border-2 border-[var(--text)] rounded-full p-1 hover:bg-[var(--text)] hover:text-white transition-colors shadow-sm"><ChevronRight size={20} /></button>)}
        </div>
        {kanji.examples.length > 1 && (<div className="flex justify-center gap-1.5">{kanji.examples.map((_, i) => (<div key={i} className={`w-2 h-2 rounded-full border border-[var(--text)] ${i === safeIdx ? 'bg-[var(--text)]' : 'bg-transparent'}`} />))}</div>)}
      </div>
      {challengeCard}
      <div className="flex flex-col gap-3">
        <div className="bg-[var(--panel)] rounded-xl px-4 py-3 border-[3px] border-[var(--text)] shadow-sm flex items-start justify-between gap-4">
          <span className="text-sm font-bold text-[var(--primary)] bg-[var(--bg)] px-3 py-1 rounded-lg border-2 border-[var(--primary)] shrink-0 flex items-center gap-1">{F("音","おん")}{hasJaVoice && kanji.on.length > 0 && (<button onClick={() => speak(kanji.on.join('、'))} disabled={micActive} aria-label="音読みを読み上げる" className={micActive ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-60'}><Volume2 size={14} /></button>)}</span>
          <div className="flex flex-wrap gap-1.5 justify-end">{kanji.on.length > 0 ? kanji.on.map((o, i) => (<span key={i} className="font-black text-xl text-[var(--text)] bg-gray-100 px-2 py-0.5 rounded-md border border-gray-300">{o}</span>)) : <span className="font-black text-xl text-gray-400">-</span>}</div>
        </div>
        <div className="bg-[var(--panel)] rounded-xl px-4 py-3 border-[3px] border-[var(--text)] shadow-sm flex items-start justify-between gap-4">
          <span className="text-sm font-bold text-[var(--secondary)] bg-[var(--bg)] px-3 py-1 rounded-lg border-2 border-[var(--secondary)] shrink-0 flex items-center gap-1">{F("訓","くん")}{hasJaVoice && kanji.kun.length > 0 && (<button onClick={() => speak(kanji.kun.map(toKunSpeech).join('、'))} disabled={micActive} aria-label="訓読みを読み上げる" className={micActive ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-60'}><Volume2 size={14} /></button>)}</span>
          <div className="flex flex-wrap gap-1.5 justify-end">{kanji.kun.length > 0 ? kanji.kun.map((k, i) => (<span key={i} className="font-black text-xl text-[var(--text)] bg-gray-100 px-2 py-0.5 rounded-md border border-gray-300"><FormatKun text={k} /></span>)) : <span className="font-black text-xl text-gray-400">-</span>}</div>
        </div>
      </div>
    </>
  );

  const action = (
    <MotionButton variant="primary" onClick={onNext} className="w-full py-4 md:py-6 text-xl md:text-2xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239]">{F("書","か")}き{F("順","じゅん")}をみる <ChevronRight size={28} /></MotionButton>
  );

  return <ModeLayout mainContent={main} tabsContent={commonSidebar} infoContent={info} actionContent={action} isStacked={isStacked} />;
};

export default ReadMode;
