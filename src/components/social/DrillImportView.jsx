import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Home, PenTool, ClipboardCheck } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { KANJI_DATA } from '../../data/kanji-data';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';
import { addReceivedDrill } from '../../systems/homework-status';
import { HomeworkSummary, startHomeworkFor } from './HomeworkParts';
import { decodeDrillParam } from '../../systems/drill-share';
import { getTodayString } from '../../utils/date-utils';

const KNOWN_KANJI_IDS = new Set(KANJI_DATA.map(k => k.id));
const isKnownKanji = (id) => KNOWN_KANJI_IDS.has(id);

/**
 * リンク（?drill=...）でうけとったドリルを確認して、マイドリルに保存する画面。
 * URLの中身だけで完結するので、通信もアカウントも要らない。
 * 中身は外部入力として、ここで確かめてから見せる（drill-share.js の decodeDrillParam）。
 * 宿題のリンクなら、しめきりと やることを見せて、宿題として保存する。
 */
const DrillImportView = ({ setView, stats, setStats, drillParam, startDrillSession, startDrillTest }) => {
  const [savedDrill, setSavedDrill] = useState(null);
  const sharedDrill = useMemo(() => decodeDrillParam(drillParam), [drillParam]);

  // このアプリに無い漢字IDは落とす（データ更新の前後でリンクが行き来しても壊れないように）
  const resolved = useMemo(() => {
    const ids = sharedDrill?.kanjis || [];
    const kanjis = ids.filter(isKnownKanji);
    return { kanjis, droppedCount: ids.length - kanjis.length };
  }, [sharedDrill]);
  const homework = sharedDrill?.homework || null;

  // 同じリンクを2回ひらいたとき（名前・字・宿題がまったく同じ）は、2つめを作らない
  const preview = useMemo(
    () => addReceivedDrill(stats.myDrills, sharedDrill, { isKnownKanji }),
    [stats.myDrills, sharedDrill],
  );
  const isDuplicate = !savedDrill && preview.alreadySaved;

  const saveDrill = () => {
    if (savedDrill) return savedDrill;
    const { myDrills, drill, alreadySaved } = addReceivedDrill(stats.myDrills, sharedDrill, { isKnownKanji });
    if (!drill) return null;
    if (!alreadySaved) {
      const newStats = { ...stats, myDrills };
      setStats(newStats);
      // リンクからの受け取りは一度きり（URLはすでに消えている）ため、
      // 保存直後にタブを閉じられてもドリルが消えないよう即時保存する
      StorageAPI.saveStatsImmediate(newStats);
    }
    setSavedDrill(drill);
    return drill;
  };

  const handleSave = () => {
    saveDrill();
    audioCtrl.playSE('success');
    setView(homework ? 'home' : 'myDrills');
  };

  const handleSaveAndPractice = () => {
    const drill = saveDrill();
    if (!drill) return;
    audioCtrl.playSE('success');
    if (homework) startHomeworkFor(drill, { startDrillSession, startDrillTest });
    else startDrillSession(drill);
  };

  // リンクが壊れている / 漢字がひとつも見つからない
  if (!sharedDrill || resolved.kanjis.length === 0) {
    return (
      <div className="flex flex-col gap-4 pb-8">
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-8 text-center shadow-[4px_4px_0_var(--text)]">
          <div className="text-5xl mb-3">😢</div>
          <p className="font-black text-[var(--text)] text-lg">ドリルをひらけませんでした</p>
          <p className="text-sm text-[var(--text)] opacity-60 mt-2">
            リンクがとちゅうで{F("切","き")}れているかもしれません。<br />
            {F("先生","せんせい")}にもういちどリンクをおくってもらってください。
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
        <Gift size={24} className="text-[var(--secondary)]" /> <span>{homework ? <>{F("宿題","しゅくだい")}が とどきました</> : 'ドリルがとどきました'}</span>
      </h2>

      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--panel)] border-[4px] border-emerald-400 rounded-2xl p-5 shadow-[4px_4px_0_#059669] flex flex-col gap-3">
        <div>
          <div className="font-black text-[var(--text)] text-xl">{sharedDrill.name}</div>
          <div className="text-sm text-[var(--text)] opacity-60">{resolved.kanjis.length}{F("文字","もじ")}</div>
        </div>
        {homework && <HomeworkSummary homework={homework} kanjiCount={resolved.kanjis.length} today={getTodayString()} />}
        <div className="flex flex-wrap gap-1">
          {resolved.kanjis.map(id => {
            const k = KANJI_DATA.find(k => k.id === id);
            return k ? <span key={id} className="text-2xl font-black" style={{ fontFamily: "'Klee One', serif" }}>{k.char}</span> : null;
          })}
        </div>
        {resolved.droppedCount > 0 && (
          <p className="text-xs font-bold text-amber-700 bg-amber-50 border-2 border-amber-300 rounded-xl px-3 py-2">
            このアプリにない{F("漢字","かんじ")}が{resolved.droppedCount}{F("文字","もじ")}あったので、のぞきました。
          </p>
        )}
        {isDuplicate && (
          <p className="text-xs font-bold text-[var(--text)] opacity-60 bg-[var(--bg)] border-2 border-[var(--text)] rounded-xl px-3 py-2">
            {homework ? <>この{F("宿題","しゅくだい")}は もう{F("保存","ほぞん")}してあります。</> : <>{F("同","おな")}じドリルがもうマイドリルにあります。</>}
          </p>
        )}
      </motion.div>

      <div className="flex flex-col gap-2">
        {homework ? (
          <>
            <MotionButton variant="primary" onClick={handleSaveAndPractice} className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#9f1239]">
              {homework.mode === 'test' ? <ClipboardCheck size={20} /> : <PenTool size={20} />} {F("保存","ほぞん")}して いま やる
            </MotionButton>
            <MotionButton variant="success" onClick={handleSave} className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#065f46]">
              {F("保存","ほぞん")}して あとで やる
            </MotionButton>
          </>
        ) : (
          <>
            <MotionButton variant="success" onClick={handleSave} className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#065f46]">
              マイドリルに{F("保存","ほぞん")}する
            </MotionButton>
            <MotionButton variant="primary" onClick={handleSaveAndPractice} className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#9f1239]">
              <PenTool size={20} /> {F("保存","ほぞん")}してすぐ{F("練習","れんしゅう")}する
            </MotionButton>
          </>
        )}
        <MotionButton variant="secondary" onClick={() => setView('home')} className="w-full py-3 border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)] text-sm min-h-[48px]">
          あとにする（{F("保存","ほぞん")}しない）
        </MotionButton>
      </div>
    </div>
  );
};

export default DrillImportView;
