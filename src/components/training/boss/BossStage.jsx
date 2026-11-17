import React, { forwardRef, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BOSS_ART_BOX, BOSS_STAGE_BOX, bossArt, bossStage } from '../../../data/boss-art';

const ART_VIEW_BOX = `${BOSS_ART_BOX.x} ${BOSS_ART_BOX.y} ${BOSS_ART_BOX.width} ${BOSS_ART_BOX.height}`;
const STAGE_VIEW_BOX = `0 0 ${BOSS_STAGE_BOX.width} ${BOSS_STAGE_BOX.height}`;

/** ボスの絵（表情つき）。絵は data/boss-art.js が文字列で作る（色と形は そのファイルの中の値だけ） */
export const BossSprite = memo(({ bossId, mood = 'idle', className, style, label }) => {
  const html = useMemo(() => ({ __html: bossArt(bossId, mood) }), [bossId, mood]);
  return (
    <svg viewBox={ART_VIEW_BOX} className={className} style={style} role="img" aria-label={label}
      aria-hidden={label ? undefined : 'true'} dangerouslySetInnerHTML={html} />
  );
});

/** 舞台の背景 */
export const BossBackdrop = memo(({ bossId, className = 'absolute inset-0 w-full h-full' }) => {
  const html = useMemo(() => ({ __html: bossStage(bossId) }), [bossId]);
  return <svg viewBox={STAGE_VIEW_BOX} preserveAspectRatio="xMidYMax slice" aria-hidden="true" className={className} dangerouslySetInnerHTML={html} />;
});

/**
 * ボスの動き（1 回きり）。ふわふわ うく動きは CSS（.boss-float）で、こちらは 当たった・こうげき などの ひと動き。
 * 「動きを へらす」設定のときは、framer-motion が 位置・大きさの動きを はぶく（表情と数字は そのまま出る）。
 */
const POSES = {
  rest: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, transition: { duration: 0.25 } },
  hurt: { x: [0, -12, 12, -9, 9, 0], y: 0, scale: 1, rotate: 0, opacity: 1, transition: { duration: 0.45 } },
  big: { x: [0, -16, 16, -12, 12, -6, 0], y: 0, scale: [1, 0.92, 1], rotate: 0, opacity: 1, transition: { duration: 0.6 } },
  guard: { x: 0, y: [0, -8, 0], scale: [1, 1.06, 1], rotate: 0, opacity: 1, transition: { duration: 0.45 } },
  attack: { x: 0, y: [0, -10, 18, 0], scale: [1, 1.05, 1.24, 1], rotate: 0, opacity: 1, transition: { duration: 0.7 } },
  down: { x: 0, y: 40, scale: 0.82, rotate: 14, opacity: 0, transition: { duration: 1.3, ease: 'easeIn' } },
};

/** 当たったときの 星がたの ひかり */
const Burst = ({ color, big }) => (
  <motion.svg viewBox="-50 -50 100 100" aria-hidden="true"
    className="absolute left-1/2 top-[52%] pointer-events-none"
    style={{ width: big ? '78%' : '56%', marginLeft: big ? '-39%' : '-28%', marginTop: big ? '-39%' : '-28%' }}
    initial={{ scale: 0.3, opacity: 1, rotate: -10 }} animate={{ scale: 1.15, opacity: 0, rotate: 12 }} transition={{ duration: 0.55, ease: 'easeOut' }}>
    <path d="M0 -48L11 -16L44 -22L20 2L40 30L8 22L0 48L-8 22L-40 30L-20 2L-44 -22L-11 -16Z" fill={color} stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
    <circle r="13" fill="#ffffff" />
  </motion.svg>
);

/** ふせいだときの たて */
const Shield = () => (
  <motion.svg viewBox="-40 -46 80 92" aria-hidden="true" className="absolute left-1/2 top-[50%] w-[34%] -ml-[17%] -mt-[20%] pointer-events-none"
    initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: [0.6, 1.08, 1], opacity: [0, 1, 1, 0] }} transition={{ duration: 0.9, times: [0, 0.25, 0.7, 1] }}>
    <path d="M0 -40L32 -28V2C32 22 18 36 0 42C-18 36 -32 22 -32 2V-28Z" fill="#bae6fd" fillOpacity="0.85" stroke="#f8fafc" strokeWidth="5" strokeLinejoin="round" />
    <path d="M0 -28V30M-20 -6H20" stroke="#f8fafc" strokeWidth="5" strokeLinecap="round" />
  </motion.svg>
);

/**
 * 舞台（背景・ボス・ボスの体力・当たったときの絵と数字・せりふ）。
 *
 * fx: いま出している できごと。{ id, kind, damage, parts } など（BossBattleView が作る）
 *   kind … 'critical' | 'hit' | 'graze'（当たった）/ 'blocked'（ふせがれた）/ 'miss'（ボスの こうげき）
 * stage: 'impact'（当たった絵と数字を出す）/ 'guard' / 'bossAttack' / null
 */
const BossStage = forwardRef(({ bossId, profile, mood, pose = 'rest', hp, maxHp, angry, fx, stage, banner, speech, side = false, className = '', style }, bossRef) => {
  const ratio = Math.max(0, Math.min(1, hp / (maxHp || 1)));
  const landed = stage === 'impact' && fx;
  // side: 横に長い 小さな舞台（スマホの たたかい）。ボスを右に よせて、左に 知らせとダメージの数字を出す
  const bossBox = `absolute inset-x-0 flex items-end pointer-events-none ${side ? 'bottom-[2%] top-[13%] justify-end pr-[3%]' : 'bottom-[3%] top-[20%] justify-center'}`;
  return (
    <div className={`relative overflow-hidden rounded-2xl border-[3px] border-slate-700 bg-slate-900 ${className}`} style={style}>
      <BossBackdrop bossId={bossId} />
      {/* いかりの ひかり（体力が半分より少ない） */}
      {angry && <div className="boss-aura absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 62%, rgba(244,63,94,0.5), rgba(244,63,94,0) 62%)' }} />}

      {/* ボス */}
      <div className={bossBox}>
        <motion.div ref={bossRef} animate={POSES[pose] || POSES.rest} className="h-full" style={{ aspectRatio: `${BOSS_ART_BOX.width} / ${BOSS_ART_BOX.height}` }} data-testid="boss-sprite" data-mood={mood}>
          <BossSprite bossId={bossId} mood={mood} label={profile.name} className={`w-full h-full ${pose === 'down' ? '' : 'boss-float'}`} />
        </motion.div>
      </div>

      {/* 当たった絵・ふせいだ絵 */}
      <div className={bossBox}>
        <div className="relative h-full" style={{ aspectRatio: `${BOSS_ART_BOX.width} / ${BOSS_ART_BOX.height}` }}>
          {landed && <Burst key={`burst-${fx.id}`} color={fx.kind === 'critical' ? '#fde047' : fx.kind === 'graze' ? '#cbd5e1' : '#fb923c'} big={fx.kind === 'critical'} />}
          {stage === 'guard' && fx && <Shield key={`shield-${fx.id}`} />}
        </div>
      </div>

      {/* ボスの名前と体力 */}
      <div className="absolute inset-x-0 top-0 px-2.5 pt-2 pb-5 bg-gradient-to-b from-slate-950/85 to-slate-950/0">
        <div className="flex items-center gap-2">
          <span className="shrink-0 max-w-[55%] truncate text-xs md:text-sm font-black text-white" data-testid="boss-name">{profile.name}</span>
          <div className="relative flex-1 h-4 md:h-5 rounded-full bg-slate-800 border-2 border-slate-300 overflow-hidden" role="progressbar" aria-label="ボスの たいりょく" aria-valuemin={0} aria-valuemax={maxHp} aria-valuenow={hp}>
            {/* へった分が 白く のこってから ちぢむ */}
            <div className="absolute inset-y-0 left-0 bg-white/80" style={{ width: `${ratio * 100}%`, transition: 'width 0.9s ease-out 0.25s' }} />
            <div className="absolute inset-y-0 left-0" style={{ width: `${ratio * 100}%`, background: ratio > 0.5 ? profile.color : ratio > 0.2 ? '#f59e0b' : '#ef4444', transition: 'width 0.3s ease-out' }} />
          </div>
          <span className="shrink-0 w-[62px] text-right text-xs md:text-sm font-black text-white tabular-nums" data-testid="boss-hp">{hp}<span className="text-slate-300">/{maxHp}</span></span>
        </div>
      </div>

      {/* 大きな 知らせ（会心の一撃・ボスの わざの名前）と、ダメージの数字 */}
      <div className={`absolute pointer-events-none flex flex-col gap-1 ${side ? 'left-2 top-[25%] w-[46%] items-start' : 'inset-x-2 top-[12%] items-center'}`}>
        <AnimatePresence>
          {banner && (
            <motion.div key={banner.id} data-testid="boss-banner"
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              style={{ wordBreak: 'keep-all', overflowWrap: 'anywhere' }}
              className={`px-3 py-1 rounded-2xl border-[3px] text-sm md:text-xl font-black leading-snug ${side ? 'text-left' : 'text-center'} ${banner.tone === 'gold' ? 'bg-yellow-300 border-yellow-600 text-slate-900' : banner.tone === 'bad' ? 'bg-rose-600 border-rose-900 text-white' : banner.tone === 'cool' ? 'bg-sky-200 border-sky-600 text-slate-900' : banner.tone === 'heal' ? 'bg-emerald-300 border-emerald-700 text-slate-900' : 'bg-white border-slate-700 text-slate-900'}`}>
              {banner.text}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {landed && (
            <motion.div key={`dmg-${fx.id}`} data-testid="boss-damage"
              className={`flex flex-col ${side ? 'items-start' : 'items-center'} whitespace-nowrap`}
              initial={{ y: 12, opacity: 0, scale: 0.7 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 16 }}>
              <span className={`font-black leading-none ${fx.kind === 'critical' ? 'text-5xl md:text-7xl text-yellow-300' : 'text-4xl md:text-6xl text-white'}`} style={{ WebkitTextStroke: '2px #0f172a', paintOrder: 'stroke fill' }}>-{fx.damage}</span>
              {(fx.parts.combo > 0 || fx.parts.revenge > 0) && (
                <span className="mt-1 flex gap-1 text-[11px] md:text-sm font-black">
                  {fx.parts.combo > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900">コンボ +{fx.parts.combo}</span>}
                  {fx.parts.revenge > 0 && <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-900">リベンジ +{fx.parts.revenge}</span>}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ボスの せりふ */}
      <AnimatePresence>
        {speech && (
          <motion.div key={speech.id} data-testid="boss-speech"
            className={`absolute bottom-2 flex pointer-events-none ${side ? 'left-2 w-[56%] justify-start' : 'inset-x-2 justify-center'}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <span className={`max-w-full px-3 py-1.5 rounded-2xl bg-slate-950/85 border-2 border-slate-300 text-white text-xs md:text-sm font-bold leading-snug ${side ? 'text-left' : 'text-center'}`}>「{speech.text}」</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default BossStage;
