import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Coins, Map, Target, CheckCircle2, NotebookPen, Presentation, Hand } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import LevelUpModal from '../ui/LevelUpModal';
import AnimatedCounter from '../ui/AnimatedCounter';
import Confetti from '../ui/Confetti';
import { TOWN_ITEMS } from '../../data/town-items';
import { VillagerPortrait } from '../town/VillagerArt';
import { GACHA_POOL } from '../../data/gacha-pool';
import { STORY_STAGES, getCurrentStage } from '../../data/story-stages';
import { STORY_STAGE_TEXT } from '../../data/story-stage-text';
import { StorageAPI } from '../../systems/storage';
import { F, RubyText } from '../ui/FormatKun';
import { audioCtrl } from '../../systems/audio';
import { getOccupation } from '../../data/residents';
import { getLevelInfoFromExp } from '../../utils/level-system';
import { getDailyLearningProgress } from '../../systems/learning-plan';
import { getTodayString } from '../../utils/date-utils';
import { getHabitStatus } from '../../systems/habit';

import { gachaRoll, isRareItem } from '../../systems/gacha';
import { totalPenalty } from '../../systems/careless-penalty';
import PenaltyLoss from '../ui/PenaltyLoss';
import { ShowTeacherOverlay } from '../social/HomeworkParts';

/** ステージの、ふりがなつきの名前と説明（無ければ story-stages.js の名前のまま） */
const stageText = (stage) => STORY_STAGE_TEXT[stage.id] || { title: stage.title, desc: '' };

const ResultView = ({ sessionMetrics, oldExp, setView, stats, setStats, onContinueLearning }) => {
  const { earnedExp, perfectCount, voicedCount, unlockedItems, rareDrop, newVillager, levelUpData } = sessionMetrics;
  const carelessCount = sessionMetrics.carelessCount || 0;
  const carelessLostExp = sessionMetrics.carelessLostExp || 0;
  // この回に、てきとう書きのペナルティで失ったもの（コイン・もちもの・素材・レベル・土地）
  const carelessLoss = totalPenalty(sessionMetrics.carelessPenalties);
  // 答えたのに1字もできなかった学習（App が学習の回数・ミッションに数えなかったもの）
  const notCounted = sessionMetrics.counted === false && (sessionMetrics.attemptCount || 0) > 0;
  const [showConfetti, setShowConfetti] = useState(earnedExp > 20 || !!newVillager || levelUpData?.isLevelUp);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [gachaResult, setGachaResult] = useState(null);
  const [gachaPhase, setGachaPhase] = useState('idle');
  // 宿題を終えたとき: 「先生に見せる」（ドリルの名前・点数・できた日を大きく出す）
  const homeworkReport = sessionMetrics.homeworkReport;
  const [showTeacher, setShowTeacher] = useState(false);
  // 実際に足したコイン（App が sessionData.earnedCoins に入れる）があれば、それを出す
  const coinBonus = Number.isFinite(sessionMetrics.earnedCoins) ? sessionMetrics.earnedCoins : Math.floor(earnedExp / 4);
  const today = getTodayString();
  const dailyProgress = getDailyLearningProgress(stats, today);
  const habitStatus = getHabitStatus(stats, today);

  const oldLevelInfo = getLevelInfoFromExp(oldExp);
  const newLevelInfo = getLevelInfoFromExp(oldExp + earnedExp);

  // ステージはレベルで決まる（story-stages.js は minKanji / minPop を持たない）。
  // ここで存在しないキーを見ていたため、ステージが「荒野の旅人」から動かず、
  // 次のステージまでの表示も NaN になっていた。
  const currentStage = getCurrentStage(newLevelInfo.level);
  const nextStage = STORY_STAGES.find(s => s.id === currentStage.id + 1);

  useEffect(() => {
    if (showConfetti) {
      audioCtrl.playSE(newVillager ? 'rare' : 'chest_open');
      setTimeout(() => setShowConfetti(false), 3000);
    }
    if (levelUpData?.isLevelUp) {
      setTimeout(() => setShowLevelUpModal(true), 1500);
    }
  }, []);

  const unlockedItemDefs = (unlockedItems || []).map(id => TOWN_ITEMS.find(i => i.id === id)).filter(Boolean);
  const rareItemDef = rareDrop ? TOWN_ITEMS.find(i => i.id === rareDrop) : null;

  const handleGacha = () => {
    if ((stats.coins || 0) < 100) { audioCtrl.playSE('stamp_bad'); return; }
    audioCtrl.playSE('gacha'); setGachaPhase('spinning');
    const result = gachaRoll();
    setTimeout(() => {
      setGachaResult(result); setGachaPhase('reveal');
      const isRare = isRareItem(result);
      audioCtrl.playSE(isRare ? 'rare' : 'chest_open');
      const newStats = { ...stats, coins: Math.max(0, (stats.coins || 0) - 100), townItems: { ...stats.townItems, [result]: (stats.townItems?.[result] || 0) + 1 } };
      setStats(newStats); StorageAPI.saveStats(newStats);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-4 pb-8 pt-2">
      <Confetti active={showConfetti || showLevelUpModal} />

      {/* レベルアップモーダル */}
      <AnimatePresence>
        {showLevelUpModal && levelUpData && <LevelUpModal levelUpData={levelUpData} onClose={() => setShowLevelUpModal(false)} />}
      </AnimatePresence>

      {/* 先生に見せる（宿題のときだけ） */}
      <AnimatePresence>
        {showTeacher && homeworkReport && <ShowTeacherOverlay report={homeworkReport} onClose={() => setShowTeacher(false)} />}
      </AnimatePresence>
      {homeworkReport && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--panel)] border-[4px] border-[var(--primary)] rounded-2xl p-4 shadow-[4px_4px_0_var(--primary)] flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <NotebookPen size={24} className="shrink-0 text-[var(--primary)]" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-xs font-black text-[var(--text-muted)]">{F("宿題","しゅくだい")}</div>
              <div className="font-black text-[var(--text)] text-lg break-all">{homeworkReport.name}</div>
              <div className="font-black text-[var(--text)]">
                {homeworkReport.mode === 'test'
                  ? (homeworkReport.passed
                    ? <>テスト {homeworkReport.score}{F("点","てん")}・{F("合格","ごうかく")}！ できたよ 🎉</>
                    : <>テスト {homeworkReport.score}{F("点","てん")}。{homeworkReport.pass}{F("点","てん")}で {F("合格","ごうかく")}だよ。もう{F("一度","いちど")} ちょうせんできるよ</>)
                  : homeworkReport.passed
                    ? <>{F("練習","れんしゅう")} できたよ 🎉</>
                    : <>まだ {F("書","か")}けていない{F("字","じ")}が あるよ。もう{F("一度","いちど")} ちょうせんできるよ</>}
              </div>
            </div>
          </div>
          <MotionButton variant="primary" onClick={() => setShowTeacher(true)} className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#9f1239]">
            <Presentation size={22} /> {F("先生","せんせい")}に{F("見","み")}せる
          </MotionButton>
        </motion.div>
      )}

      {/* てきとう書きで失ったものがあるとき・1字も書けなかったときは、理由を先に伝える */}
      {(carelessCount > 0 || notCounted) && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} role="status" data-testid="result-careless" className="bg-[var(--panel)] border-[4px] border-[var(--primary)] rounded-2xl p-4 shadow-[4px_4px_0_var(--primary)] flex items-start gap-3">
          <Hand size={28} className="shrink-0 text-[var(--primary)]" aria-hidden="true" />
          <div className="min-w-0 text-sm font-bold leading-relaxed text-[var(--text)]">
            {carelessCount > 0 && (
              <>
                <p>
                  <span className="font-black">ほとんど {F("書","か")}かずに こたえあわせを した {F("回数","かいすう")}：{carelessCount}{F("回","かい")}</span>
                  。この{F("回","かい")}の EXP と コインは もらえないよ
                  {carelessLostExp > 0 && <>（EXP <strong data-testid="result-careless-lost">{carelessLostExp}</strong> が なくなった）</>}。
                </p>
                {Object.values(carelessLoss).some((amount) => amount > 0) && (
                  <p data-testid="result-careless-loss">なくなったもの：<PenaltyLoss loss={carelessLoss} /></p>
                )}
              </>
            )}
            {notCounted && <p>{F("書","か")}けた{F("字","じ")}が なかったので、この{F("回","かい")}は {F("学習","がくしゅう")}の {F("回数","かいすう")}に {F("入","はい")}らないよ。</p>}
            <p className="text-[var(--text-muted)]">ていねいに {F("書","か")}けば、なにも なくならないよ。わからないときは「わからない」を おしてね。</p>
          </div>
        </motion.div>
      )}

      {/* 新EXPゲージ（ストーリーナレーションの前に配置） */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)] relative overflow-hidden">
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-[var(--text-muted)]">プレイヤー</span>
            <span className="text-3xl font-black text-[var(--primary)]">Lv.{newLevelInfo.level}</span>
          </div>
          <div className="text-sm font-bold text-[var(--text-muted)]">
            +{earnedExp} EXP
          </div>
        </div>
        
        {/* レベルゲージ */}
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-[var(--text)] relative">
          <motion.div 
            initial={{ width: `${oldLevelInfo.progress}%` }} 
            animate={{ width: `${newLevelInfo.progress}%` }} 
            transition={{ duration: 1.5, ease: "easeOut" }} 
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-yellow-400 to-[var(--accent)]" 
          />
        </div>
        {!newLevelInfo.isMaxLevel && (
          <div className="text-xs font-bold text-right text-[var(--text-muted)] mt-1">
            {F("次","つぎ")}の報酬まで あと {newLevelInfo.remainingExp} EXP
          </div>
        )}
      </motion.div>

      {/* 今日の目標：結果を次の学習行動につなげる */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className={`bg-[var(--panel)] border-[4px] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)] ${dailyProgress.isComplete ? 'border-emerald-400' : 'border-[var(--text)]'}`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-10 h-10 rounded-xl border-[3px] border-[var(--text)] flex items-center justify-center shrink-0 ${dailyProgress.isComplete ? 'bg-emerald-400' : 'bg-[var(--accent)]'}`}>
              {dailyProgress.isComplete ? <CheckCircle2 size={22} /> : <Target size={22} />}
            </div>
            <div className="min-w-0">
              <div className="font-black text-[var(--text)]">{dailyProgress.isComplete ? <>きょうの{F("目標","もくひょう")}クリア！</> : <>あと {dailyProgress.remaining}{F("字","じ")}で{F("目標","もくひょう")}クリア</>}</div>
              <div className="mt-0.5 text-xs font-bold leading-loose text-[var(--text-muted)]">{F("学習","がくしゅう")}した{F("漢字","かんじ")}は{F("毎日","まいにち")}の{F("記録","きろく")}にのこります</div>
            </div>
          </div>
          <div className="font-black text-[var(--text)] shrink-0"><span className="text-xl text-[var(--primary)]">{dailyProgress.reviewed}</span><span className="text-xs text-[var(--text-muted)]"> / {dailyProgress.goal}字</span></div>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden border-2 border-[var(--text)]" role="progressbar" aria-label="今日の学習目標" aria-valuemin="0" aria-valuemax={dailyProgress.goal} aria-valuenow={Math.min(dailyProgress.reviewed, dailyProgress.goal)}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${dailyProgress.percent}%` }} className={`h-full ${dailyProgress.isComplete ? 'bg-emerald-400' : 'bg-[var(--primary)]'}`} />
        </div>
        {habitStatus.event && (
          <div className="mt-3 rounded-xl border-2 border-sky-300 bg-sky-50 px-3 py-2 text-center text-xs font-black text-sky-700" role="status">
            {habitStatus.event.type === 'rest_protected'
              ? <>🛡️ おやすみパスで、{F("休","やす")}んだ{F("日","ひ")}も{F("連続","れんぞく")}{F("記録","きろく")}を{F("守","まも")}りました！</>
              : <>🛡️ 5{F("日間","にちかん")}の{F("学習","がくしゅう")}で、おやすみパスがもどりました！</>}
          </div>
        )}
      </motion.div>

      {/* ストーリーナレーション */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)] text-center">
        <div className="text-4xl mb-1">{currentStage.emoji}</div>
        <div className="font-black text-[var(--primary)] text-lg ruby-text"><RubyText text={stageText(currentStage).title} /></div>
        <p className="text-xs text-[var(--text-muted)] mt-1 ruby-text"><RubyText text={stageText(currentStage).desc} /></p>
        {nextStage && (
          <div className="mt-2 text-xs text-[var(--text-muted)] bg-[var(--bg)] rounded-lg px-2 py-1 ruby-text" data-testid="next-stage">
            {F("次","つぎ")}のステージ「<RubyText text={stageText(nextStage).title} />」まで あと {Math.max(0, nextStage.minLevel - newLevelInfo.level)}レベル
          </div>
        )}
      </motion.div>

      {/* 住民誕生 */}
      {newVillager && (
        <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          className="bg-emerald-50 border-[4px] border-emerald-400 rounded-2xl p-4 shadow-[4px_4px_0_#059669] flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 bg-emerald-100 rounded-2xl flex items-center justify-center border-[3px] border-emerald-400">
            <VillagerPortrait occupation={newVillager.occupation} id={newVillager.id} size={46} />
          </div>
          <div className="flex-1">
            <div className="font-black text-emerald-700 text-base">🎉 {F("新","あたら")}しい{F("住民","じゅうみん")}が{F("誕生","たんじょう")}！</div>
            <div className="text-sm text-emerald-800 mt-0.5">
              「<span className="font-black text-xl" style={{ fontFamily: "'Klee One',serif" }}>{newVillager.kanjiChar}</span>」を{F("習得","しゅうとく")}した{F("住民","じゅうみん")}が{F("街","まち")}にやってきた！
            </div>
            <div className="text-xs text-emerald-700 mt-1 flex items-center gap-2">
              <span>{F("現在","げんざい")}の{F("人口","じんこう")}：{stats.population || 0}{F("人","にん")}</span>
              <span className="bg-emerald-200 px-2 py-0.5 rounded-full font-black">{getOccupation(newVillager.occupation).emoji} {getOccupation(newVillager.occupation).name}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* EXP・コイン・Perfect・音読チャレンジ */}
      <div className={(voicedCount || 0) > 0 ? 'grid grid-cols-4 gap-3' : 'grid grid-cols-3 gap-3'}>
        {[
          { label: <>{F("獲得","かくとく")}EXP</>, value: earnedExp, icon: '⚡', color: 'bg-amber-50 border-amber-300' },
          { label: 'まちコイン', value: coinBonus, icon: '🪙', color: 'bg-yellow-50 border-yellow-300', prefix: '+' },
          { label: 'Perfect', value: perfectCount, icon: '💮', color: 'bg-rose-50 border-rose-300' },
          ...((voicedCount || 0) > 0 ? [{ label: <>{F("音読","おんどく")}チャレンジ</>, value: voicedCount, icon: '🎤', color: 'bg-emerald-50 border-emerald-300' }] : []),
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
            className={`${stat.color} rounded-2xl border-[3px] p-3 text-center shadow-sm`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-black text-slate-800">{stat.prefix}<AnimatedCounter target={stat.value} duration={1000} /></div>
            <div className="text-xs font-bold text-slate-600">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* 解放アイテム */}
      {(unlockedItemDefs.length > 0 || rareItemDef) && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
          className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)]">
          <div className="text-sm font-black text-center mb-3 flex items-center justify-center gap-2">
            <Gift size={18} className="text-[var(--primary)]" /> まちのアイテムをゲット！
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {[...unlockedItemDefs, ...(rareItemDef ? [rareItemDef] : [])].map((item, i) => (
              <motion.div key={i} initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.6 + i * 0.1 }}
                className={`${item.bg} w-16 h-16 rounded-xl border-[3px] border-[var(--text)] shadow-sm relative overflow-hidden flex items-center justify-center`}>
                <item.svg />
                {rareItemDef && item.id === rareItemDef.id && <div className="absolute top-0 right-0 text-[8px] font-black bg-yellow-400 text-yellow-900 px-1 rounded-bl-lg">RARE</div>}
              </motion.div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 justify-center mt-2">
            {[...unlockedItemDefs, ...(rareItemDef ? [rareItemDef] : [])].map((item, i) => (
              <span key={i} className="text-xs font-bold text-[var(--text-muted)] bg-[var(--bg)] px-2 py-0.5 rounded-full">{item.name}</span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ガチャ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)]">
        <div className="text-sm font-black text-center mb-3 flex items-center justify-center gap-2">
          <Sparkles size={18} className="text-amber-500" /> まちのガチャ
        </div>
        {gachaPhase === 'idle' && (
          <div>
            <MotionButton variant="accent" onClick={handleGacha} disabled={(stats.coins || 0) < 100}
              className="w-full py-4 text-lg border-[3px] border-[var(--text)] shadow-[0_3px_0_#b45309]">
              <Coins size={18} /> 100コインでひく
            </MotionButton>
            {(stats.coins || 0) < 100 && <p className="text-xs text-center text-[var(--text-muted)] mt-2">コインが{F("足","た")}りません（{F("現在","げんざい")} {stats.coins || 0}{F("枚","まい")}）</p>}
          </div>
        )}
        {gachaPhase === 'spinning' && (
          <div className="text-center py-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.4, ease: 'linear' }} className="text-4xl inline-block">🎲</motion.div>
            <div className="text-sm font-bold text-[var(--text-muted)] mt-2">ひいています...</div>
          </div>
        )}
        {gachaPhase === 'reveal' && gachaResult && (() => {
          const item = TOWN_ITEMS.find(i => i.id === gachaResult);
          const isRare = GACHA_POOL.findIndex(t => t.items.includes(gachaResult)) >= 3;
          return (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }} className="flex flex-col items-center gap-2">
              {isRare && <div className="text-xs font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-full border-2 border-amber-400 animate-pulse">✨ レアアイテム！</div>}
              <div className={`w-20 h-20 ${item?.bg || 'bg-gray-100'} rounded-2xl border-[3px] border-[var(--text)] shadow-lg flex items-center justify-center`}>
                {item && <item.svg />}
              </div>
              <div className="font-black text-[var(--text)]">{item?.name}</div>
              <MotionButton variant="secondary" onClick={() => setGachaPhase('idle')} className="px-4 py-2 text-sm border-[2px] border-[var(--text)] shadow-sm mt-1"><span>もう{F("一度","いちど")}ひく</span></MotionButton>
            </motion.div>
          );
        })()}
      </motion.div>

      {/* ボタン */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-col gap-3">
        {!dailyProgress.isComplete && onContinueLearning && (
          <MotionButton variant="primary" onClick={onContinueLearning} className="w-full py-5 text-xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239]">
            <Target size={24} /> <span>あと{dailyProgress.remaining}{F("字","じ")} {F("学習","がくしゅう")}をつづける</span>
          </MotionButton>
        )}
        <MotionButton variant={dailyProgress.isComplete ? "primary" : "secondary"} onClick={() => setView('home')} className="w-full py-5 text-xl font-black border-[4px] border-[var(--text)] shadow-[0_5px_0_var(--text)]">まちに もどる 🏠</MotionButton>
        <MotionButton variant="secondary" onClick={() => setView('townEditor')} className="w-full py-4 text-lg border-[3px] border-[var(--text)] shadow-[0_4px_0_var(--text)]">
          <Map size={20} /> まちをつくる
        </MotionButton>
      </motion.div>
    </div>
  );
};

export default ResultView;
