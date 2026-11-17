import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import MotionButton from '../../ui/MotionButton';
import Confetti from '../../ui/Confetti';
import { F } from '../../ui/FormatKun';
import { audioCtrl } from '../../../systems/audio';
import { bossProfile } from '../../../data/boss-profiles';
import { BossBackdrop, BossSprite } from './BossStage';
import { BOSS_SE } from './boss-sounds';

const Stat = ({ label, value }) => (
  <div className="rounded-xl bg-slate-800 border-2 border-slate-600 px-2 py-1.5 text-center">
    <div className="text-[11px] font-bold text-slate-300">{label}</div>
    <div className="text-lg md:text-xl font-black text-white tabular-nums">{value}</div>
  </div>
);

/** ★ が 1 つずつ ふえる */
const BigStars = ({ stars }) => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= stars) return undefined;
    const id = setTimeout(() => { setShown((n) => n + 1); audioCtrl.playSE(BOSS_SE.star); }, shown === 0 ? 500 : 420);
    return () => clearTimeout(id);
  }, [shown, stars]);
  return (
    <div className="flex items-center justify-center gap-2" role="img" aria-label={`ほし ${stars}こ`} data-testid="boss-stars" data-stars={stars}>
      {[1, 2, 3].map((n) => (
        <motion.div key={n} animate={n <= shown ? { scale: [0.4, 1.35, 1], rotate: [-30, 8, 0] } : { scale: 1, rotate: 0 }} transition={{ duration: 0.45 }}>
          <Star size={54} aria-hidden="true" strokeWidth={2.2} className={n <= shown ? 'text-yellow-300' : 'text-slate-600'} fill={n <= shown ? 'currentColor' : 'none'} />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * たたかいの おわりの画面。
 * 勝ったとき: ★・たたかいの数・もらえるもの・次のボス。
 * 負けたとき: どこまで へらせたか・れんしゅうする字（しかる ことばは書かない。もう一度 やりたくなるように）。
 * 「つぎへ」を おすと、結果を かくていして 学習の結果の画面へ進む（onDone）。
 */
const BossResult = ({ won, bossId, state, stars, coins, earnedExp, unlockedBossId, isStacked = true, onDone }) => {
  const profile = bossProfile(bossId);
  const dealt = Math.round(((state.bossMaxHp - state.bossHp) / state.bossMaxHp) * 100);
  const landed = state.criticals + state.hits + state.grazes;
  // ボスの絵。横に広い画面では 左に大きく、スマホ・たて向きでは 上に小さく置く
  const scene = (
    <div className={`relative rounded-2xl overflow-hidden border-[3px] border-slate-700 ${isStacked ? 'w-full h-[clamp(120px,19dvh,200px)] shrink-0' : 'flex-1 min-w-0 self-stretch'}`}>
      <BossBackdrop bossId={bossId} />
      <div className="absolute inset-x-0 bottom-1 top-2 flex items-end justify-center">
        <BossSprite bossId={bossId} mood={won ? 'down' : 'idle'} label={profile.name} className="h-full max-w-full" style={won ? { transform: 'rotate(8deg)' } : undefined} />
      </div>
      <div className="absolute inset-x-2 bottom-2 flex justify-center">
        <span className="px-3 py-1.5 rounded-2xl bg-slate-950/85 border-2 border-slate-300 text-white text-xs md:text-sm font-bold leading-snug">「{won ? profile.lose : profile.cheer}」</span>
      </div>
    </div>
  );
  return (
    <div className={`flex h-full w-full bg-slate-950 text-white overflow-hidden ${isStacked ? 'flex-col' : 'flex-row gap-5 p-4'}`} data-testid="boss-result" data-won={won ? 'true' : 'false'}>
      <Confetti active={won} />
      {!isStacked && scene}
      <div className={`flex flex-col min-h-0 ${isStacked ? 'flex-1' : 'w-[460px] shrink-0'}`}>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className={`mx-auto w-full max-w-[560px] flex flex-col items-center gap-3 text-center ${isStacked ? 'px-3 py-4 md:py-6' : 'min-h-full justify-center py-1'}`}>
          <motion.h1 initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220 }}
            className={`text-3xl md:text-4xl font-black ${won ? 'text-yellow-300' : 'text-sky-200'}`}>
            {won ? 'ボスを たおした！' : 'おしい！ もう すこし'}
          </motion.h1>

          {won && <BigStars stars={stars} />}

          {isStacked && scene}

          {won ? (
            <>
              <div className="grid grid-cols-4 gap-2 w-full">
                <Stat label="あてた" value={landed} />
                <Stat label="かいしん" value={state.criticals} />
                <Stat label="コンボ" value={state.maxCombo} />
                <Stat label="リベンジ" value={state.revenges} />
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <div className="rounded-xl bg-slate-800 border-2 border-yellow-500 px-3 py-2">
                  <div className="text-xs font-bold text-slate-300">EXP</div>
                  <div className="text-2xl font-black text-yellow-300 tabular-nums">+{earnedExp}</div>
                </div>
                <div className="rounded-xl bg-slate-800 border-2 border-yellow-500 px-3 py-2">
                  <div className="text-xs font-bold text-slate-300">コイン</div>
                  <div className="text-2xl font-black text-yellow-300 tabular-nums">+{coins}</div>
                </div>
              </div>
              {unlockedBossId && (
                <div className="w-full rounded-2xl bg-rose-950 border-[3px] border-rose-400 p-2 flex items-center gap-3 text-left" data-testid="boss-unlocked">
                  <BossSprite bossId={unlockedBossId} className="w-16 h-16 shrink-0" />
                  <span className="text-sm md:text-base font-black text-rose-100 leading-snug" style={{ wordBreak: 'keep-all' }}>あたらしい ボス 「{bossProfile(unlockedBossId).name}」が あらわれた！</span>
                </div>
              )}
              {stars < 3 && (
                <p className="text-sm font-bold text-slate-300 leading-relaxed">ハートを 1つも へらさずに かつと、ほしが 3つに なるよ</p>
              )}
            </>
          ) : (
            <>
              {/* 1 回も当たらなかったときは、0% とは出さない */}
              {dealt > 0 && (
              <div className="w-full rounded-2xl bg-slate-900 border-2 border-slate-700 p-3">
                <div className="text-sm font-bold text-slate-200">ボスの たいりょくを ここまで へらしたよ</div>
                <div className="mt-2 h-5 rounded-full bg-slate-800 border-2 border-slate-300 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dealt} aria-label="へらした たいりょく">
                  <div className="h-full bg-emerald-400" style={{ width: `${dealt}%` }} />
                </div>
                <div className="mt-1 text-lg font-black text-emerald-300 tabular-nums" data-testid="boss-dealt">{dealt}%</div>
              </div>
              )}
              {state.failed.length > 0 && (
                <div className="w-full rounded-2xl bg-slate-900 border-2 border-amber-400 p-3">
                  <div className="text-sm font-bold text-amber-200">
                    <span>この {F('字', 'じ')}を れんしゅうすると、つぎは かてるよ</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 justify-center">
                    {state.failed.map((k) => (
                      <span key={k.id} className="w-14 h-14 rounded-xl bg-slate-800 border-2 border-amber-300 text-white text-3xl font-black flex items-center justify-center">{k.char}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-300 leading-relaxed">この {F('字', 'じ')}は、このあとの ふくしゅうに {F('出', 'で')}るよ</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 w-full">
                <Stat label="EXP" value={`+${earnedExp}`} />
                <Stat label="コイン" value={`+${coins}`} />
              </div>
            </>
          )}
        </div>
      </div>
      <div className={`shrink-0 flex justify-center ${isStacked ? 'px-3 pb-3 pt-2' : 'pt-2'}`}>
        <MotionButton variant="primary" onClick={onDone} data-testid="boss-done"
          className="w-full max-w-[560px] min-h-[56px] py-3 text-lg md:text-xl font-black border-[3px] border-emerald-900 bg-emerald-500 text-slate-950 shadow-[0_5px_0_#064e3b]">
          つぎへ <ArrowRight size={22} aria-hidden="true" />
        </MotionButton>
      </div>
      </div>
    </div>
  );
};

export default BossResult;
