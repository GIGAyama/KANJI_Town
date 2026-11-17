import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Home, Check } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { KANJI_DATA } from '../../data/kanji-data';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';
import { decodeRangeParam, getLearningRangeStatus, sanitizeLearningRange } from '../../systems/learning-range';
import { formatMonthDay } from '../../systems/homework-status';
import { getTodayString } from '../../utils/date-utils';
import { withRangeDrills } from '../../systems/range-tools';

const KANJI_BY_ID = new Map(KANJI_DATA.map(k => [k.id, k]));

/** このアプリに無い字を落とした範囲（字の無くなった段も落とす）。だめなら null */
function resolveRange(param) {
  const range = decodeRangeParam(param);
  if (!range) return null;
  return sanitizeLearningRange({
    name: range.name,
    stages: range.stages.map(stage => ({ from: stage.from, kanjis: stage.kanjis.filter(id => KANJI_BY_ID.has(id)) })),
  });
}

const sameRange = (a, b) => Boolean(a && b) && JSON.stringify(a) === JSON.stringify(b);

/**
 * リンク（?range=...）で受け取った「ならった範囲」を確かめて、使うかどうかを決める画面。
 * 範囲は端末に1つだけ持つ（stats.settings.learningRange）。もうあれば、おきかえるかを確かめる。
 * 日付がまだ来ていない段の字は、ここでは見せない（その日になったら新出に出る）。
 */
const RangeImportView = ({ setView, stats, setStats, rangeParam }) => {
  const today = getTodayString();
  const range = useMemo(() => resolveRange(rangeParam), [rangeParam]);
  const status = useMemo(() => (range ? getLearningRangeStatus(range, stats.kanjiStats, today) : null), [range, stats.kanjiStats, today]);
  const current = useMemo(() => {
    const saved = sanitizeLearningRange(stats.settings?.learningRange);
    return saved;
  }, [stats.settings?.learningRange]);
  const alreadyUsing = sameRange(current, range);

  const handleUse = () => {
    if (!range) return;
    const received = { ...stats, settings: { ...(stats.settings || {}), learningRange: { ...range, receivedAt: Date.now() } } };
    // 日付が来た段は、マイドリルにも 入れる（あとの段は、その日に ホームで 入る）
    const newStats = withRangeDrills(received, today)?.stats || received;
    setStats(newStats);
    // リンクからの受け取りは一度きり（URLはすでに消えている）なので、すぐに保存する
    StorageAPI.saveStatsImmediate(newStats);
    audioCtrl.playSE('success');
    setView('home');
  };

  if (!range) {
    return (
      <div className="flex flex-col gap-4 pb-8">
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-8 text-center shadow-[4px_4px_0_var(--text)]">
          <div className="text-5xl mb-3" aria-hidden="true">😢</div>
          <p className="font-black text-[var(--text)] text-lg">ならった{F("範囲","はんい")}を ひらけませんでした</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            リンクが とちゅうで {F("切","き")}れているかもしれません。<br />
            {F("先生","せんせい")}に もういちど リンクを おくってもらってください。
          </p>
        </div>
        <MotionButton variant="secondary" onClick={() => setView('home')} className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_var(--text)]">
          <Home size={20} /> ホームにもどる
        </MotionButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2">
        <BookOpen size={24} className="text-[var(--secondary)]" /> <span>ならった{F("範囲","はんい")}が とどきました</span>
      </h2>

      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--panel)] border-[4px] border-[var(--secondary)] rounded-2xl p-5 shadow-[4px_4px_0_var(--secondary)] flex flex-col gap-3">
        <div>
          <div className="font-black text-[var(--text)] text-xl break-all">{range.name}</div>
          <div className="text-sm font-bold text-[var(--text-muted)]">{range.stages.length}だん・{status.totalCount}{F("字","じ")}</div>
        </div>
        <p className="text-sm font-bold text-[var(--text)] leading-relaxed">
          まいにちの {F("学習","がくしゅう")}の「{F("新出","しんしゅつ")}」に、この {F("範囲","はんい")}の {F("字","じ")}だけが でるよ。
          {F("日","ひ")}づけが きた だんの {F("字","じ")}から、じゅんばんに でるよ。{F("復習","ふくしゅう")}は いままでどおり。
        </p>
        <p className="text-sm font-bold text-[var(--text)] leading-relaxed" data-testid="range-import-drills">
          <span>{F("日","ひ")}づけが きた だんは、マイドリルにも はいるよ（「{range.name} 1だんめ」など）。</span>
        </p>
        <ol className="flex flex-col gap-1.5">
          {range.stages.map((stage, i) => {
            const started = stage.from <= today;
            return (
              <li key={i} className={`rounded-xl border-2 px-3 py-2 ${started ? 'border-[var(--secondary)] bg-[var(--bg)]' : 'border-[var(--text)]/25'}`}>
                <div className="text-xs font-black text-[var(--text)] flex items-center gap-1">
                  {started && <Check size={14} className="text-[var(--secondary)]" aria-hidden="true" />}
                  <span>{i + 1}だんめ・{formatMonthDay(stage.from)}から {stage.kanjis.length}{F("字","じ")}</span>
                </div>
                {started ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {stage.kanjis.map(id => <span key={id} className="text-xl font-black text-[var(--text)]" style={{ fontFamily: "'Klee One', serif" }}>{KANJI_BY_ID.get(id)?.char}</span>)}
                  </div>
                ) : (
                  <div className="text-xs font-bold text-[var(--text-muted)] mt-0.5">その{F("日","ひ")}に なったら でるよ</div>
                )}
              </li>
            );
          })}
        </ol>
        {current && !alreadyUsing && (
          <p className="text-sm font-bold text-[var(--text)] bg-[var(--bg)] border-2 border-[var(--primary)] rounded-xl px-3 py-2">
            いまの {F("範囲","はんい")}「{current.name}」と おきかえます。
          </p>
        )}
        {alreadyUsing && (
          <p className="text-sm font-bold text-[var(--text-muted)] bg-[var(--bg)] border-2 border-[var(--text)] rounded-xl px-3 py-2">
            この {F("範囲","はんい")}は もう つかっています。
          </p>
        )}
      </motion.div>

      <div className="flex flex-col gap-2">
        {alreadyUsing ? (
          <MotionButton variant="primary" onClick={() => setView('home')} className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#9f1239]">
            <Home size={20} /> ホームへ
          </MotionButton>
        ) : (
          <MotionButton variant="primary" onClick={handleUse} className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#9f1239]">
            <Check size={20} /> {current ? <>おきかえて つかう</> : <>ならった{F("範囲","はんい")}として つかう</>}
          </MotionButton>
        )}
        {!alreadyUsing && (
          <MotionButton variant="secondary" onClick={() => setView('home')} className="w-full py-3 border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)] text-sm min-h-[48px]">
            つかわない（ホームへ）
          </MotionButton>
        )}
      </div>
    </div>
  );
};

export default RangeImportView;
