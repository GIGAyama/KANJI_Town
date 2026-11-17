import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotionConfig } from 'framer-motion';
import { ArrowRight, Flame, Heart, Lightbulb, RefreshCw, Swords, Timer } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import LeaveLearningButton from '../ui/LeaveLearningButton';
import { FormatKun, F, RubyText, SurvivalRubyText } from '../ui/FormatKun';
import { audioCtrl } from '../../systems/audio';
import { pickPromptExample } from '../../systems/prompt-example';
import { judgeWriting } from '../../systems/strokeGrader';
import { writingSkillEvidence } from '../../systems/mastery';
import { fetchKanjiVg } from '../../systems/kanjiVg';
import { useLearningViewport } from '../../hooks/useLearningViewport';
import {
  BOSSES, bossPhase, coinsFor, createBattle, isBossUnlocked, judgeAttack, recordBossResult,
  resolveTurn, starsFor, suggestedBossId, timeLimitFor,
} from '../../systems/boss-battle';
import { bossProfile } from '../../data/boss-profiles';
import BossStage from './boss/BossStage';
import BossCanvas from './boss/BossCanvas';
import BossIntro from './boss/BossIntro';
import BossResult from './boss/BossResult';
import { BOSS_SE } from './boss/boss-sounds';

// ボスバトル: まちがいの多い字の「書きとりテスト」を、ボスとの たたかいにした画面。
// 勝ち負け・ダメージ・リベンジの計算は systems/boss-battle.js（React に依存しない。test/boss-battle.test.js）。
// ここは、その結果を 順に見せる（字が とぶ → 当たる → 数字 → 次の問題）。
//
// 流れ（phase）:
//   writing    … 書いている（のこり時間が進む）
//   shot       … 書いた字が ボスへ とんでいく
//   impact     … 当たった（ダメージの数字・ボスが ひるむ）
//   guard      … おしい字を ボスが ふせいだ
//   bossAttack … 書けなかった。ボスが こうげきして ハートが 1 つ へる
//   review     … こたえを見る（「つぎへ」を おすまで 待つ。時間は進まない）
//   ending     … 勝ち負けが決まった

const WRITING_SKILLS = { skills: ['writing', 'stroke'] };
const EMPTY = [];
/** 結果の画面を、おさずに置いたときに 自動で進むまで（ごほうびを 受けとりそこねないように） */
const RESULT_AUTO_MS = 25000;

/** ふわふわ うく動き・いかりの ひかり。「動きを へらす」設定のときは App.jsx の決まりで 止まる */
const BOSS_CSS = `
@keyframes boss-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3%); } }
.boss-float { animation: boss-float 2.8s ease-in-out infinite; }
@keyframes boss-aura { 0%, 100% { opacity: .35; } 50% { opacity: .9; } }
.boss-aura { animation: boss-aura 1.4s ease-in-out infinite; }
`;

/** 書けなかった・おしかった わけを、子どもに伝えることばにする（毎日のテストと同じ言い方） */
function reasonText({ reason, judgment }) {
  const attempt = judgment?.attempt;
  const diff = attempt ? attempt.actualCount - attempt.expectedCount : 0;
  if (reason === 'timeout') return <>じかんぎれ… {F('書', 'か')}けなかったね</>;
  if (reason === 'careless') return <>ほとんど {F('書', 'か')}けなかったね</>;
  if (reason === 'count') return <>かくすうが ちがうよ{diff > 0 ? `（${diff}かく おおいよ）` : diff < 0 ? `（${-diff}かく たりないよ）` : ''}</>;
  if (reason === 'small') return <>{F('字', 'じ')}が {F('小', 'ちい')}さいよ。ますいっぱいに {F('書', 'か')}こう</>;
  if (reason === 'large') return <>{F('字', 'じ')}が {F('大', 'おお')}きすぎるよ。ますの {F('中', 'なか')}に {F('書', 'か')}こう</>;
  if (reason === 'cross') return <>せんの まじわりが ちがうよ</>;
  if (reason === 'order') return <>かきじゅんが ちがうよ。すうじの じゅんに {F('書', 'か')}こう</>;
  return <>{F('形', 'かたち')}が ちがうよ。こたえを よく {F('見', 'み')}よう</>;
}

/** ボスの こうげきが 当たったときに、書く ますの上に出る絵（ボスごと） */
const AttackSplash = ({ bossId }) => (
  <motion.svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"
    className="absolute inset-0 w-full h-full z-40 pointer-events-none rounded-[20px]"
    initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1.1, delay: 0.25 }}>
    {bossId === 'octopus' && (
      <g fill="#1f2440">
        <path d="M30 22C44 12 62 18 66 32C82 34 88 52 76 62C80 78 62 90 48 80C34 92 14 80 20 64C6 56 12 30 30 22Z" />
        <circle cx="16" cy="18" r="6" /><circle cx="88" cy="24" r="4.5" /><circle cx="84" cy="84" r="6.5" /><circle cx="10" cy="88" r="4" />
      </g>
    )}
    {bossId === 'oni' && (
      <g stroke="#e11d48" strokeWidth="13" strokeLinecap="round"><path d="M18 18L82 82M82 18L18 82" /></g>
    )}
    {bossId === 'dragon' && (
      <g>
        <path d="M0 0H100V34C92 60 84 40 76 62C68 86 60 52 50 78C40 52 32 86 24 62C16 40 8 60 0 34Z" fill="#8b5cf6" />
        <path d="M14 0H86V20C78 40 72 26 64 44C58 58 54 36 50 52C46 36 42 58 36 44C28 26 22 40 14 20Z" fill="#ddd0ff" />
      </g>
    )}
    {/* おばけ: 消しゴムで ごしごし こすった あと（書いた線と まぎれないように、ぎざぎざの 1 本にする） */}
    {bossId !== 'octopus' && bossId !== 'oni' && bossId !== 'dragon' && (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 22L88 10L14 40L90 30L12 60L88 52L16 80L90 72L30 92" stroke="#fbcfe8" strokeWidth="13" strokeOpacity="0.55" />
        <path d="M10 22L88 10L14 40L90 30L12 60L88 52L16 80L90 72L30 92" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.9" strokeDasharray="1 7" />
      </g>
    )}
  </motion.svg>
);

const BossBattleView = ({ queue, bossRecord = null, onUpdateStat, onFinish, onBossDefeat, onRequestLeave, paused = false, sessionEarnedExp = 0 }) => {
  const reduceMotion = useReducedMotionConfig();
  // 画面回転にも追従する。サイズ変更時は BossCanvas 側で書きかけの画が消える（通常モードと同じ挙動）
  const { canvasSize, isStacked } = useLearningViewport('boss');

  const [screen, setScreen] = useState('intro'); // intro | battle | result
  const [bossId, setBossId] = useState(() => suggestedBossId(bossRecord));
  const profile = bossProfile(bossId);

  // たたかいの計算の結果（いつも最新）。画面は shown を見る
  const battleRef = useRef(null);
  // 画面に出している状態。えんしゅつの あいだは、計算より おくれて進む
  const [shown, setShown] = useState(null); // { entry: { kanji, revenge }, turn, bossHp, bossMaxHp, playerHp, playerMaxHp, combo }
  const [phase, setPhase] = useState('writing');
  const [fx, setFx] = useState(null);
  const [banner, setBanner] = useState(null);
  const [speech, setSpeech] = useState(null);
  const [review, setReview] = useState(null);
  const [shot, setShot] = useState(null);
  const [heartFx, setHeartFx] = useState(null);
  const [strokeCount, setStrokeCount] = useState(0);
  // ヒントを ひらいている問題（何問めか）。次の問題に進むと、ひとりでに とじる
  const [hintTurn, setHintTurn] = useState(0);
  const [final, setFinal] = useState(null);
  const fxIdRef = useRef(0);
  const doneRef = useRef(false);
  // 1 問に 1 回だけ こうげきを受けつける（ボタンの 2 度おし・時間切れと ボタンが 同時のとき）。次の問題で もどす
  const lockRef = useRef(false);
  const rootRef = useRef(null);
  const bossRef = useRef(null);
  const canvasBoxRef = useRef(null);
  const canvasRef = useRef(null);

  // お手本の線（KanjiVG）。どの字のものかを いっしょに持つ（次の問題に進んだ しゅんかんに、前の字の線で採点しないように）
  const [vg, setVg] = useState({ char: null, paths: [], strokeData: [], error: false });
  const [loadTry, setLoadTry] = useState(0);

  // タイマー
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeLimit, setTimeLimit] = useState(30);
  const timerRef = useRef(null);
  const timeLeftRef = useRef(0);
  // 演出のタイマー（setTimeout）は画面を離れたら止める。以前は離れたあとも動き、
  // やめたはずの問題の記録（again）が入ったり、結果画面へ飛んだりしていた。
  const pendingTimeoutsRef = useRef(new Set());
  const later = useCallback((fn, ms) => {
    const id = setTimeout(() => { pendingTimeoutsRef.current.delete(id); fn(); }, ms);
    pendingTimeoutsRef.current.add(id);
    return id;
  }, []);
  // タブが見えていないあいだは制限時間を進めない
  const [pageHidden, setPageHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    const pending = pendingTimeoutsRef.current;
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      pending.forEach(clearTimeout);
      pending.clear();
      clearInterval(timerRef.current);
    };
  }, []);

  // BGM
  useEffect(() => {
    audioCtrl.playBGM('boss');
    return () => audioCtrl.stopBGM();
  }, []);

  const say = useCallback((text, ms = 2400) => {
    const id = ++fxIdRef.current;
    setSpeech({ id, text });
    later(() => setSpeech((cur) => (cur?.id === id ? null : cur)), ms);
  }, [later]);
  const announce = useCallback((text, tone = 'plain', ms = 1300) => {
    const id = ++fxIdRef.current;
    setBanner({ id, text, tone });
    later(() => setBanner((cur) => (cur?.id === id ? null : cur)), ms);
  }, [later]);

  const kanji = shown?.entry?.kanji || null;
  const char = kanji?.char || null;

  // KanjiVGデータ取得（リトライ・キャッシュ付き）
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
  const vgReady = vg.char === char;
  const paths = vgReady ? vg.paths : EMPTY;
  const strokeData = vgReady ? vg.strokeData : EMPTY;
  const fetchError = vgReady && vg.error;
  const isLoading = !vgReady;

  // 新しい問題の制限時間を決める
  const turn = shown?.turn || 0;
  useEffect(() => {
    if (screen !== 'battle' || phase !== 'writing' || isLoading || !strokeData.length) return;
    const limit = timeLimitFor(strokeData.length);
    setTimeLimit(limit);
    setTimeLeft(limit);
    timeLeftRef.current = limit;
  }, [screen, phase, isLoading, strokeData, turn]);

  // ── たたかいを はじめる ──
  const startBattle = () => {
    audioCtrl.init();
    const state = createBattle(queue, { bossId });
    if (!state.current) return;
    battleRef.current = state;
    lockRef.current = false;
    setShown({ entry: state.current, turn: state.turn, bossHp: state.bossHp, bossMaxHp: state.bossMaxHp, playerHp: state.playerHp, playerMaxHp: state.playerMaxHp, combo: 0 });
    setPhase('writing');
    setScreen('battle');
    audioCtrl.playSE(BOSS_SE.appear);
    say(profile.intro, 2600);
  };

  // ── 次の問題へ ──
  const advance = () => {
    const state = battleRef.current;
    if (!state || state.status !== 'fighting') return;
    setFx(null); setReview(null); setBanner(null); setShot(null);
    setStrokeCount(0);
    setShown((s) => ({ ...s, entry: state.current, turn: state.turn }));
    setPhase('writing');
    lockRef.current = false;
  };

  // ── 勝ち負けが決まった ──
  const finishBattle = (won) => {
    const state = battleRef.current;
    setPhase('ending');
    setReview(null); setShot(null);
    if (won) { audioCtrl.playSE(BOSS_SE.win); say(profile.lose, 2200); } else { audioCtrl.playSE(BOSS_SE.lose); }
    const stars = starsFor(state);
    const index = BOSSES.findIndex((boss) => boss.id === bossId);
    const nextBoss = BOSSES[index + 1];
    // はじめて たおしたときだけ、次のボスが あらわれる
    const unlockedBossId = won && nextBoss && !isBossUnlocked(bossRecord, nextBoss.id) ? nextBoss.id : null;
    later(() => {
      setFinal({ won, stars, state, coins: coinsFor(state), unlockedBossId, record: recordBossResult(bossRecord, { bossId, stars }) });
      setScreen('result');
    }, won ? 1900 : 1300);
  };

  // 結果を かくていして、学習の結果の画面へ
  const completeResult = useCallback(() => {
    if (doneRef.current || !final) return;
    doneRef.current = true;
    const { won, state, coins, record } = final;
    if (won) onFinish({ coins, perfectCount: state.criticals, rareDrop: 't_gold_castle', bossRecord: record });
    else onBossDefeat({ coins, perfectCount: state.criticals, failedKanji: state.failed });
  }, [final, onFinish, onBossDefeat]);
  useEffect(() => {
    if (screen !== 'result' || !final || paused) return undefined;
    const id = setTimeout(completeResult, RESULT_AUTO_MS);
    return () => clearTimeout(id);
  }, [screen, final, paused, completeResult]);

  // ── 書いた字で こうげきする（timedOut: 時間切れで、書いた所まで） ──
  const submitStrokes = (strokes, timedOut = false) => {
    const before = battleRef.current;
    if (!before || before.status !== 'fighting' || phase !== 'writing' || !shown || !strokeData.length || lockRef.current) return;
    lockRef.current = true;
    clearInterval(timerRef.current);
    const entry = shown.entry;
    // リベンジ（こたえを見たあとの 2 回目）は、毎日のテストの「2 回目」と同じに、読み取れる字を通す
    const judgment = strokes.length > 0 ? judgeWriting(strokes, strokeData, canvasSize, { previousFails: entry.revenge ? 1 : 0 }) : null;
    const attack = judgeAttack(judgment);
    const result = resolveTurn(before, attack);
    const next = result.state;
    battleRef.current = next;
    onUpdateStat(entry.kanji, result.evaluation, judgment
      ? { ...WRITING_SKILLS, skillEvidence: writingSkillEvidence(judgment.result, result.evaluation) }
      : WRITING_SKILLS);
    // 次の字の お手本を 先に読んでおく（えんしゅつの あいだに そろう）
    if (next.status === 'fighting' && next.current) fetchKanjiVg(next.current.kanji.char).catch(() => {});

    const id = ++fxIdRef.current;
    const effect = { id, kind: attack.kind, reason: attack.reason, damage: result.damage, parts: result.parts, healed: result.healed, revenge: result.revenge, timedOut, judgment };
    setFx(effect);

    if (result.damage > 0) {
      const impact = () => {
        setPhase('impact');
        setShot(null);
        setShown((s) => ({ ...s, bossHp: next.bossHp, combo: next.combo }));
        audioCtrl.playSE(attack.kind === 'critical' ? BOSS_SE.critical : BOSS_SE.hit);
        if (attack.kind === 'critical') announce('かいしんの いちげき！', 'gold');
        else if (attack.kind === 'hit') announce('ヒット！', 'plain');
        else announce('かすった！ もっと ていねいに', 'plain');
        if (result.revenge) {
          later(() => {
            announce(result.healed ? 'リベンジ せいこう！ ハート かいふく' : 'リベンジ せいこう！', 'heal', 1200);
            if (result.healed) { setShown((s) => ({ ...s, playerHp: next.playerHp })); setHeartFx({ id, kind: 'heal' }); audioCtrl.playSE(BOSS_SE.heal); }
          }, 650);
        }
        // 体力が半分を切ったら ボスが おこる
        if (next.status === 'fighting' && bossPhase(before.bossHp, before.bossMaxHp) === 0 && bossPhase(next.bossHp, next.bossMaxHp) >= 1) {
          // ダメージの数字が消えてから（次の問題が出るころ）に言う
          later(() => { say(profile.rage, 2400); audioCtrl.playSE(BOSS_SE.rage); }, 1450);
        }
        later(() => (next.status === 'won' ? finishBattle(true) : advance()), result.revenge ? 1900 : 1350);
      };
      if (reduceMotion) { impact(); return; }
      // 書いた字を、ますの まん中から ボスへ とばす
      const root = rootRef.current?.getBoundingClientRect();
      const from = canvasBoxRef.current?.getBoundingClientRect();
      const to = bossRef.current?.getBoundingClientRect();
      if (!root || !from || !to) { impact(); return; }
      setPhase('shot');
      setShot({
        id, char: entry.kanji.char, critical: attack.kind === 'critical',
        from: { x: from.left + from.width / 2 - root.left, y: from.top + from.height / 2 - root.top },
        to: { x: to.left + to.width / 2 - root.left, y: to.top + to.height * 0.55 - root.top },
      });
      audioCtrl.playSE(BOSS_SE.shot);
      later(impact, 430);
      return;
    }

    setShown((s) => ({ ...s, combo: 0 }));
    const openReview = () => {
      setBanner(null);
      setReview({ id, effect, showOrder: attack.reason === 'order' });
      setPhase('review');
    };
    if (attack.kind === 'blocked') {
      setPhase('guard');
      audioCtrl.playSE(BOSS_SE.guard);
      announce('おしい！ ふせがれた', 'cool', 1100);
      say(profile.guard, 1800);
      later(openReview, 1100);
      return;
    }
    // 書けなかった: ボスの こうげき
    setPhase('bossAttack');
    audioCtrl.playSE(BOSS_SE.roar);
    announce(`${profile.attack}！`, 'bad', 1400);
    later(() => {
      setShown((s) => ({ ...s, playerHp: next.playerHp }));
      setHeartFx({ id, kind: 'hurt' });
      audioCtrl.playSE(BOSS_SE.hurt);
    }, 650);
    later(() => (next.status === 'lost' ? finishBattle(false) : openReview()), 1700);
  };

  // 時間を進める。「やめる？」の確認中・タブが見えていない間は止める
  // （以前は確認中も進み、時間切れでボスの強攻撃と「忘れた」の記録が入っていた）
  const isTimerRunning = screen === 'battle' && phase === 'writing' && !isLoading && strokeData.length > 0 && !paused && !pageHidden;
  const submitRef = useRef(submitStrokes);
  submitRef.current = submitStrokes;
  useEffect(() => {
    if (!isTimerRunning) return undefined;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current);
        // 時間切れ: 書いた所までで こうげきする（書きおえて ボタンを おしていない字は、そのまま採点する）
        submitRef.current(canvasRef.current?.takeStrokes() || [], true);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, turn]);

  if (screen === 'intro') {
    return (
      <BossIntro bossId={bossId} record={bossRecord} isStacked={isStacked}
        onSelect={(id) => { if (isBossUnlocked(bossRecord, id)) { setBossId(id); audioCtrl.playSE('pop'); } }}
        onStart={startBattle} onRequestLeave={onRequestLeave} />
    );
  }
  if (screen === 'result' && final) {
    return (
      <BossResult won={final.won} bossId={bossId} state={final.state} stars={final.stars} coins={final.coins}
        earnedExp={sessionEarnedExp} unlockedBossId={final.unlockedBossId} isStacked={isStacked} onDone={completeResult} />
    );
  }
  if (!shown || !kanji) return null;

  const won = battleRef.current?.status === 'won';
  const angry = bossPhase(shown.bossHp, shown.bossMaxHp) >= 1 && shown.bossHp > 0;
  const mood = phase === 'impact' ? 'hurt'
    : phase === 'guard' ? 'smug'
      : phase === 'bossAttack' ? 'attack'
        : phase === 'ending' && won ? 'down'
          : angry ? 'angry' : 'idle';
  const pose = phase === 'impact' ? (fx?.kind === 'critical' ? 'big' : 'hurt')
    : phase === 'guard' ? 'guard'
      : phase === 'bossAttack' ? 'attack'
        : phase === 'ending' && won ? 'down' : 'rest';
  const stageFx = phase === 'impact' ? 'impact' : phase === 'guard' ? 'guard' : null;

  const timeRatio = Math.max(0, Math.min(1, timeLeft / (timeLimit || 1)));
  const timerColor = timeRatio > 0.5 ? '#34d399' : timeRatio > 0.25 ? '#facc15' : '#f87171';
  const writing = phase === 'writing';
  const canWrite = writing && !isLoading && !fetchError && strokeData.length > 0;

  const promptExample = pickPromptExample(kanji, shown.turn - 1);
  const hintOpen = hintTurn === shown.turn;
  const readings = (
    <>
      {kanji.on.length > 0 ? kanji.on.join(' / ') : ''}
      {kanji.on.length > 0 && kanji.kun.length > 0 ? ' / ' : ''}
      {kanji.kun.length > 0 ? kanji.kun.map((k, i) => (
        <React.Fragment key={i}><FormatKun text={k} />{i < kanji.kun.length - 1 ? ' / ' : ''}</React.Fragment>
      )) : ''}
    </>
  );

  return (
    <div ref={rootRef} className="flex flex-col h-full w-full bg-slate-950 text-white relative overflow-hidden" data-testid="boss-battle" data-phase={phase}>
      <style>{BOSS_CSS}</style>

      {/* 上の帯: やめる・ハート・コンボ・何問め */}
      <div className="shrink-0 flex items-center gap-2 px-2 md:px-4 pt-2 z-10">
        {phase !== 'ending' && <LeaveLearningButton onClick={onRequestLeave} tone="dark" />}
        <motion.div key={heartFx?.kind === 'hurt' ? `hurt-${heartFx.id}` : 'hearts'}
          animate={heartFx?.kind === 'hurt' ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }} transition={{ duration: 0.4 }}
          className="flex items-center gap-0.5" role="img" aria-label={`ハート ${shown.playerHp}こ`} data-testid="boss-hearts" data-hp={shown.playerHp}>
          {Array.from({ length: shown.playerMaxHp }, (_, i) => {
            const full = i < shown.playerHp;
            const healed = heartFx?.kind === 'heal' && i === shown.playerHp - 1;
            return (
              <motion.span key={healed ? `heal-${heartFx.id}` : i} animate={healed ? { scale: [0.4, 1.5, 1] } : { scale: 1 }} transition={{ duration: 0.45 }}>
                <Heart size={28} aria-hidden="true" strokeWidth={2.4} className={full ? 'text-rose-500' : 'text-slate-600'} fill={full ? 'currentColor' : 'none'} />
              </motion.span>
            );
          })}
        </motion.div>
        <div className="flex-1 min-w-0" />
        {shown.combo >= 2 && (
          <motion.div key={shown.combo} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}
            className="shrink-0 px-2.5 py-1 rounded-full bg-amber-400 text-slate-900 text-sm font-black whitespace-nowrap flex items-center gap-1" data-testid="boss-combo">
            <Flame size={16} aria-hidden="true" />
            <span>{shown.combo} コンボ</span>
          </motion.div>
        )}
        <div className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-600 text-xs md:text-sm font-black text-slate-100 whitespace-nowrap tabular-nums" data-testid="boss-turn">
          {shown.turn}もんめ
        </div>
      </div>

      {/* 読み上げ用（いまの できごと） */}
      <div className="sr-only" aria-live="polite">{banner?.text || ''}{stageFx === 'impact' && fx ? ` ${fx.damage} ダメージ` : ''}</div>

      <div className={`flex-1 min-h-0 flex ${isStacked ? 'flex-col justify-center gap-2' : 'flex-row gap-4'} px-2 md:px-4 py-2 overflow-y-auto no-scrollbar`}>
        {/* ボスと問題 */}
        {/* 縦積みでは 舞台・問題・ますを 1 列に ならべる（contents）。ますが はばで決まって 高さが あまるときは、
            舞台が その分だけ大きくなる（250px まで） */}
        <div className={isStacked ? 'contents' : 'flex flex-col gap-3 w-[clamp(360px,34vw,460px)] shrink-0 min-h-0'}>
          <BossStage ref={bossRef} bossId={bossId} profile={profile} mood={mood} pose={pose}
            hp={shown.bossHp} maxHp={shown.bossMaxHp} angry={angry} fx={fx} stage={stageFx} banner={banner} speech={speech} side={isStacked}
            className={isStacked ? 'w-full flex-1 min-h-[clamp(110px,21dvh,250px)] max-h-[250px]' : 'flex-1 min-h-[200px]'} />

          {/* 出題: 例文の中の ◯ を書く。読みの並びは ヒント（同じ字が もう一度出るときは 例文を変える）。
              こたえを見ているあいだは、書けなかった わけと、字の入った例文を出す */}
          <div className={`relative shrink-0 rounded-2xl border-2 px-3 py-2 text-center ${review ? 'bg-amber-950 border-amber-300' : shown.entry.revenge ? 'bg-emerald-950 border-emerald-400' : 'bg-slate-800 border-slate-600'}`} data-testid="boss-question" data-revenge={shown.entry.revenge ? 'true' : 'false'}>
            {review ? (
              <p className="text-sm md:text-base font-black text-amber-200 leading-snug" data-testid="boss-reason">{reasonText(review.effect)}</p>
            ) : (
              <div className={`text-xs font-black ${shown.entry.revenge ? 'text-emerald-300' : 'text-rose-300'}`}>
                {shown.entry.revenge
                  ? <span>リベンジ！ {F('書', 'か')}けたら ハートが もどるよ</span>
                  : <span>じゃくてん：「◯」の {F('字', 'じ')}を {F('書', 'か')}け！</span>}
              </div>
            )}
            {promptExample ? (
              <>
                <div className="flex items-center gap-1 min-h-[48px]">
                  <p className="flex-1 min-w-0 text-lg md:text-xl font-black text-white ruby-text !leading-[2.3]" data-testid="boss-prompt">
                    {review ? <RubyText text={promptExample} always /> : <SurvivalRubyText text={promptExample} targetChar={kanji.char} />}
                  </p>
                  {/* ヒント（読みかた）。おすと 下に出る。問題が かわると とじる */}
                  {!review && (
                    <button type="button" onClick={() => setHintTurn((t) => (t === shown.turn ? 0 : shown.turn))} aria-expanded={hintOpen} data-testid="boss-hint"
                      className={`shrink-0 min-w-[48px] min-h-[48px] px-1 rounded-xl border-2 text-[11px] font-black leading-tight flex flex-col items-center justify-center ${hintOpen ? 'bg-amber-300 border-amber-500 text-slate-900' : 'bg-slate-700 border-slate-500 text-slate-100'}`}>
                      <Lightbulb size={18} aria-hidden="true" />
                      <span>ヒント</span>
                    </button>
                  )}
                </div>
                {hintOpen && !review && <div className="text-sm font-black text-amber-100 leading-snug pb-1" data-testid="boss-readings">{readings}</div>}
              </>
            ) : (
              <div className="text-lg md:text-xl font-black text-white leading-tight py-1" data-testid="boss-prompt">{readings}</div>
            )}
          </div>
        </div>

        {/* 書く ます */}
        <div className={`min-w-0 flex flex-col items-center justify-center gap-2 ${isStacked ? 'shrink-0' : 'flex-1'}`}>
          {isLoading ? (
            <div className="flex items-center justify-center" style={{ width: canvasSize, maxWidth: '100%', aspectRatio: '1/1' }}>
              <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="text-5xl">😢</div>
              <p className="text-slate-200 font-bold text-lg">よみこみに しっぱいしました</p>
              <button type="button" onClick={() => { setVg({ char: null, paths: [], strokeData: [], error: false }); setLoadTry((n) => n + 1); }} className="min-h-[48px] bg-rose-600 text-white font-black text-lg px-8 py-3 rounded-2xl border-[3px] border-rose-800 active:translate-y-0.5">🔄 もういちど ためす</button>
            </div>
          ) : (
            <>
              <div ref={canvasBoxRef} className="relative max-w-full">
                <BossCanvas
                  // 問題ごとに作り直す。同じ字が続くと strokeData が変わらず、前の問題の線が
                  // キャンバスに残って「画数ちがい」と誤って採点されていた
                  key={shown.turn}
                  ref={canvasRef}
                  strokeData={strokeData}
                  paths={paths}
                  canvasSize={canvasSize}
                  disabled={!canWrite}
                  review={review}
                  accent={profile.color}
                  onCountChange={setStrokeCount}
                />
                {heartFx?.kind === 'hurt' && fx && heartFx.id === fx.id && <AttackSplash key={heartFx.id} bossId={bossId} />}
                {!review && (
                  // のこり時間（ますの上のはしに重ねる。さわっても 線は書ける）
                  <div className="absolute left-3 right-3 top-2.5 z-30 flex items-center gap-1.5 pointer-events-none">
                    <div className="flex-1 h-2 rounded-full bg-slate-700/90 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(canWrite ? timeRatio : 1) * 100}%`, background: timerColor, transition: 'width 1s linear, background-color 0.3s' }} />
                    </div>
                    <Timer size={14} aria-hidden="true" className={timeRatio > 0.25 || !writing ? 'text-slate-300' : 'text-red-400'} />
                    <span className={`w-6 text-right text-sm font-black tabular-nums ${timeRatio > 0.25 || !writing ? 'text-slate-200' : 'text-red-400'}`} data-testid="boss-time" aria-label={`のこり ${timeLeft}びょう`}>{canWrite ? timeLeft : '--'}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 w-full min-h-[56px]" style={{ maxWidth: canvasSize }}>
                {review ? (
                  <MotionButton key="next" variant="primary" onClick={advance} data-testid="boss-next"
                    className="flex-1 py-3 text-lg font-black border-[3px] border-amber-700 bg-amber-300 text-slate-900 shadow-[0_4px_0_#92400e]">
                    <span>つぎへ<span className="max-[380px]:hidden">（あとで リベンジ！）</span></span> <ArrowRight size={20} aria-hidden="true" />
                  </MotionButton>
                ) : (
                  <>
                    <MotionButton key="clear" variant="secondary" onClick={() => canvasRef.current?.clear()} disabled={!canWrite || strokeCount === 0}
                      className="flex-[2] min-w-0 py-3 text-sm font-bold whitespace-nowrap border-[3px] border-slate-500 bg-slate-700 text-slate-100">
                      <RefreshCw size={16} aria-hidden="true" /> {F('書', 'か')}き{F('直', 'なお')}す
                    </MotionButton>
                    <MotionButton key="attack" variant="primary" onClick={() => submitStrokes(canvasRef.current?.takeStrokes() || [])} disabled={!canWrite || strokeCount === 0} data-testid="boss-attack"
                      className="flex-[3] min-w-0 py-3 text-lg font-black whitespace-nowrap border-[3px] border-rose-900 bg-rose-600 text-white shadow-[0_4px_0_#881337]">
                      <Swords size={20} aria-hidden="true" /> {F('攻撃', 'こうげき')}する！
                    </MotionButton>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ハートが へったときの 赤い ふち */}
      {heartFx?.kind === 'hurt' && (
        <motion.div key={`flash-${heartFx.id}`} aria-hidden="true" className="absolute inset-0 z-30 pointer-events-none"
          style={{ boxShadow: 'inset 0 0 90px 30px rgba(244,63,94,0.6)' }}
          initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.9 }} />
      )}

      {/* 書いた字が ボスへ とんでいく */}
      <AnimatePresence>
        {shot && phase === 'shot' && (
          <motion.div key={shot.id} aria-hidden="true"
            className="absolute z-40 pointer-events-none flex items-center justify-center rounded-full font-black text-slate-900"
            style={{
              left: 0, top: 0, width: 76, height: 76, marginLeft: -38, marginTop: -38, fontSize: 46, lineHeight: 1,
              background: shot.critical ? 'radial-gradient(circle, #ffffff 20%, #fde047 62%, #f59e0b)' : 'radial-gradient(circle, #ffffff 20%, #fdba74 62%, #f97316)',
              border: '3px solid #ffffff',
            }}
            initial={{ x: shot.from.x, y: shot.from.y, scale: 1.7, opacity: 0.3 }}
            animate={{ x: shot.to.x, y: shot.to.y, scale: 0.75, opacity: 1 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.42, ease: [0.5, 0, 0.9, 0.6] }}>
            {shot.char}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BossBattleView;
