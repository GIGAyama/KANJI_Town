import React from 'react';
import { Heart, Lock, PenLine, Sparkles, Star, Swords } from 'lucide-react';
import MotionButton from '../../ui/MotionButton';
import LeaveLearningButton from '../../ui/LeaveLearningButton';
import { F } from '../../ui/FormatKun';
import { BOSSES, bestStars, bossWins, isBossUnlocked } from '../../../systems/boss-battle';
import { bossProfile } from '../../../data/boss-profiles';
import BossStage, { BossSprite } from './BossStage';

/** ★ 3 つ（とった数だけ 金色） */
export const Stars = ({ count, size = 16, className = '' }) => (
  <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`ほし ${count}こ`}>
    {[1, 2, 3].map((n) => (
      <Star key={n} size={size} aria-hidden="true" className={n <= count ? 'text-yellow-300' : 'text-slate-500'} fill={n <= count ? 'currentColor' : 'none'} strokeWidth={2.4} />
    ))}
  </span>
);

const RULES = [
  { icon: PenLine, color: 'text-sky-300', text: <>「◯」の {F('字', 'じ')}を {F('書', 'か')}いて、ボスを こうげき！</> },
  { icon: Sparkles, color: 'text-yellow-300', text: <>ていねいに {F('書', 'か')}くと「かいしんの いちげき」。つづけて あてると コンボ！</> },
  { icon: Heart, color: 'text-rose-400', text: <>{F('書', 'か')}けないと ハートが へるよ。こたえを {F('見', 'み')}て、リベンジで {F('書', 'か')}けたら かいふく！</> },
];

/**
 * ボスバトルの はじめの画面。たたかうボスを えらんで はじめる。
 * ボスは 前から順に出てくる（前のボスを たおすと、次のボスと たたかえる）。たおしたボスには、★ を ふやしに もう一度 いどめる。
 */
const BossIntro = ({ bossId, record, isStacked, onSelect, onStart, onRequestLeave }) => {
  const profile = bossProfile(bossId);
  const wins = bossWins(record, bossId);
  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-white overflow-hidden" data-testid="boss-intro">
      <div className="shrink-0 flex items-center gap-2 px-2 md:px-4 pt-2">
        <LeaveLearningButton onClick={onRequestLeave} tone="dark" />
        <h1 className="flex-1 text-center text-lg md:text-2xl font-black text-rose-300 pr-[44px]">ボスバトル</h1>
      </div>
      <div className={`flex-1 min-h-0 flex ${isStacked ? 'flex-col' : 'flex-row items-stretch'} gap-3 md:gap-5 px-2 md:px-4 py-2 md:py-4 overflow-y-auto no-scrollbar`}>
        <div className={isStacked ? 'shrink-0' : 'flex-1 min-w-0 flex'}>
          <BossStage
            bossId={bossId} profile={profile} mood="idle" hp={BOSSES.find((boss) => boss.id === bossId)?.hp || 0} maxHp={BOSSES.find((boss) => boss.id === bossId)?.hp || 1}
            speech={{ id: bossId, text: profile.intro }}
            className={isStacked ? 'w-full h-[clamp(190px,34dvh,360px)]' : 'flex-1 min-h-[260px]'}
          />
        </div>
        <div className={`flex flex-col gap-3 ${isStacked ? '' : 'w-[400px] shrink-0 justify-center'}`}>
          <div className="text-center">
            <div className="text-xs font-bold text-slate-300">{profile.place}</div>
            <div className="text-xl md:text-2xl font-black text-white">{profile.name}</div>
            <div className="mt-1 flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
              <Stars count={bestStars(record, bossId)} size={18} />
              <span>{wins > 0 ? `たおした かず ${wins}` : 'まだ たおしていない'}</span>
            </div>
          </div>

          {/* ボスを えらぶ */}
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="たたかう ボス">
            {BOSSES.map((boss) => {
              const unlocked = isBossUnlocked(record, boss.id);
              const selected = boss.id === bossId;
              const name = bossProfile(boss.id).name;
              return (
                <button key={boss.id} type="button" disabled={!unlocked} aria-pressed={selected}
                  aria-label={unlocked ? name : 'まえの ボスを たおすと たたかえる'}
                  onClick={() => onSelect(boss.id)} data-testid={`boss-pick-${boss.id}`}
                  className={`relative min-h-[76px] rounded-2xl border-[3px] flex flex-col items-center justify-center gap-0.5 p-1 ${selected ? 'border-yellow-300 bg-slate-700' : unlocked ? 'border-slate-500 bg-slate-800 active:translate-y-0.5' : 'border-slate-700 bg-slate-900'}`}>
                  <BossSprite bossId={boss.id} className="w-12 h-12" style={unlocked ? undefined : { filter: 'brightness(0)', opacity: 0.55 }} />
                  {unlocked ? <Stars count={bestStars(record, boss.id)} size={12} /> : <Lock size={14} aria-hidden="true" className="text-slate-400" />}
                </button>
              );
            })}
          </div>

          <ul className="flex flex-col gap-1.5 rounded-2xl bg-slate-900 border-2 border-slate-700 p-3">
            {RULES.map(({ icon: Icon, color, text }, i) => (
              <li key={i} className="flex items-start gap-2 text-sm md:text-base font-bold text-slate-100 leading-relaxed">
                <Icon size={18} aria-hidden="true" className={`${color} shrink-0 mt-1`} />
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <MotionButton variant="primary" onClick={onStart} data-testid="boss-start"
            className="w-full min-h-[60px] py-3 text-xl md:text-2xl font-black border-[3px] border-rose-900 bg-rose-600 text-white shadow-[0_5px_0_#881337]">
            <Swords size={26} aria-hidden="true" /> たたかう！
          </MotionButton>
        </div>
      </div>
    </div>
  );
};

export default BossIntro;
