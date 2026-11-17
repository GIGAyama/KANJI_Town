import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, Plus, Trash2, Pencil, FileText, FilePlus2, Link2, Presentation, Printer, X, Check } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import ModalDialog from '../ui/ModalDialog';
import { KANJI_DATA } from '../../data/kanji-data';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';
import { DRILL_NAME_MAX_LENGTH, SHARE_URL_SAFE_LENGTH, isValidDateKey } from '../../systems/drill-share';
import { RANGE_KANJI_MAX, RANGE_STAGE_MAX, buildRangeShareUrl, encodeRangeParam, sanitizeLearningRange } from '../../systems/learning-range';
import { addStageDrill, stageToDrill } from '../../systems/range-tools';
import { addDays, formatMonthDay } from '../../systems/homework-status';
import { getTodayString } from '../../utils/date-utils';
import ShareLinkPanel from './ShareLinkPanel';
import { KanjiFinderControls, KanjiFinderResults, useKanjiFinder } from '../ui/KanjiFinder';
import { useShareLogging } from './useShareRecorder';

// 段から開く画面は、使うときにだけ読む（プリント・授業モード）
const PrintTestView = lazy(() => import('../pages/PrintTestView'));
const LessonMode = lazy(() => import('../lesson/LessonMode'));

const KANJI_BY_ID = new Map(KANJI_DATA.map(k => [k.id, k]));
const GRADES = [1, 2, 3, 4, 5, 6];
const WEEK = 7;

/** 先生の下書き（stats.rangeDraft）を読む。形の崩れた所は直す */
function readDraft(value, today) {
  const stages = (Array.isArray(value?.stages) ? value.stages : [])
    .slice(0, RANGE_STAGE_MAX)
    .map(stage => ({
      from: typeof stage?.from === 'string' ? stage.from : today,
      kanjis: Array.isArray(stage?.kanjis) ? stage.kanjis.filter(id => KANJI_BY_ID.has(id)) : [],
    }));
  return {
    name: typeof value?.name === 'string' ? value.name.slice(0, DRILL_NAME_MAX_LENGTH) : '',
    stages: stages.length > 0 ? stages : [{ from: today, kanjis: [] }],
  };
}

const nextDate = (stages, today) => {
  const last = [...stages].reverse().find(stage => isValidDateKey(stage.from));
  return last ? addDays(last.from, WEEK) : today;
};

/** 字を えらぶ（さがす・学年・画数で しぼりこむ・タップ）。ほかの段にある字は えらべない */
const KanjiPicker = ({ stageIndex, stages, onToggle, onAddMany, onRemoveMany, onClose, totalCount, initialGrade }) => {
  const finder = useKanjiFinder({ initialGrade });
  // ほかの段にある字（ふだに 段の番号を出す）
  const locked = useMemo(() => {
    const map = new Map();
    stages.forEach((stage, i) => {
      if (i !== stageIndex) stage.kanjis.forEach(id => map.set(id, { badge: String(i + 1), label: `${i + 1}だんめ` }));
    });
    return map;
  }, [stages, stageIndex]);
  const full = totalCount >= RANGE_KANJI_MAX;
  return (
    <ModalDialog labelId="range-picker-title" onEscape={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-stretch justify-center p-2 md:p-6 bg-black/40">
      <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl w-full max-w-4xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2 p-3 border-b-[3px] border-[var(--text)]">
          <h3 id="range-picker-title" className="font-black text-[var(--text)]">{stageIndex + 1}だんめの{F("字","じ")}を えらぶ（{stages[stageIndex].kanjis.length}{F("字","じ")}）</h3>
          <MotionButton variant="primary" onClick={onClose} data-autofocus className="px-4 min-h-[48px] text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_#9f1239]"><Check size={18} /> できた</MotionButton>
        </div>
        <div className="p-2 border-b-2 border-[var(--text)]/15">
          <KanjiFinderControls finder={finder} idPrefix="range-finder" />
        </div>
        {full && <p className="px-3 pt-2 text-xs font-bold text-amber-700">{F("字","じ")}は ぜんぶで {RANGE_KANJI_MAX}{F("字","じ")}までです。{F("範囲","はんい")}を{F("分","わ")}けてください。</p>}
        <div className="flex-1 min-h-0 overflow-y-auto p-2">
          <KanjiFinderResults
            finder={finder}
            selectedIds={stages[stageIndex].kanjis}
            lockedLabels={locked}
            canAdd={!full}
            onToggle={onToggle}
            onAddMany={onAddMany}
            onRemoveMany={onRemoveMany}
            gridClassName="grid-cols-5 sm:grid-cols-8 md:grid-cols-10"
          />
        </div>
      </motion.div>
    </ModalDialog>
  );
};

/** マイドリルを えらぶ。'stage' は その段に字を足す、'stages' は えらんだドリルを1つずつ段にする */
const DrillPicker = ({ mode, drills, onPick, onClose }) => {
  const [selected, setSelected] = useState([]);
  const toggle = (i) => setSelected(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]));
  return (
    <ModalDialog labelId="range-drill-title" onEscape={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2 p-3 border-b-[3px] border-[var(--text)]">
          <h3 id="range-drill-title" className="font-black text-[var(--text)]">{mode === 'stages' ? <>マイドリルから だんを{F("作","つく")}る</> : <>マイドリルの{F("字","じ")}を{F("足","た")}す</>}</h3>
          <button type="button" onClick={onClose} aria-label="とじる" className="min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-[var(--text)]"><X size={24} /></button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2">
          {drills.length === 0 && <p className="text-sm font-bold text-[var(--text-muted)]">マイドリルが まだ ありません。</p>}
          {mode === 'stages' && drills.length > 0 && <p className="text-xs font-bold text-[var(--text-muted)]">えらんだ じゅんに、1つのドリルを 1つの だんにします（{F("日","ひ")}づけは 1しゅうかんずつ）。</p>}
          {drills.map((drill, i) => {
            const on = selected.includes(i);
            return (
              <button key={i} type="button" aria-pressed={mode === 'stages' ? on : undefined}
                onClick={() => { audioCtrl.playSE('click'); if (mode === 'stages') toggle(i); else onPick([drill]); }}
                className={`w-full min-h-[48px] rounded-xl border-[3px] px-3 py-2 text-left flex items-center gap-2 ${on ? 'border-[var(--primary)] bg-[var(--bg)]' : 'border-[var(--text)]/30 hover:border-[var(--text)]'}`}>
                {mode === 'stages' && <span className={`w-7 h-7 shrink-0 rounded-lg border-2 border-[var(--text)] flex items-center justify-center text-xs font-black ${on ? 'bg-[var(--primary)] text-[var(--panel)]' : 'text-[var(--text)]'}`}>{on ? selected.indexOf(i) + 1 : ''}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block font-black text-[var(--text)] truncate">{drill.name}</span>
                  <span className="block text-xs font-bold text-[var(--text-muted)] truncate">{(drill.kanjis || []).length}{F("字","じ")}：{(drill.kanjis || []).slice(0, 12).map(id => KANJI_BY_ID.get(id)?.char).join('')}</span>
                </span>
              </button>
            );
          })}
        </div>
        {mode === 'stages' && (
          <div className="p-3 border-t-[3px] border-[var(--text)]">
            <MotionButton variant="primary" disabled={selected.length === 0} onClick={() => onPick(selected.map(i => drills[i]))} className="w-full py-3 min-h-[48px] font-black border-[3px] border-[var(--text)] shadow-[0_3px_0_#9f1239]">
              {selected.length}つの だんを{F("作","つく")}る
            </MotionButton>
          </div>
        )}
      </motion.div>
    </ModalDialog>
  );
};

/**
 * ならった範囲を配る（先生向け）。段ごとに字と「この日から」を決め、リンクで配る。
 * サーバーが無いので、全部の段と日付をリンクの中に入れる。児童の端末が日付を見て、
 * 日付が来た段の字だけを毎日の学習の新出に出す（learning-range.js / learning-plan.js）。
 * 作りかけは先生の端末に1つだけ下書きとして残す（stats.rangeDraft）。
 */
const RangeEditorView = ({ setView, stats, setStats }) => {
  const today = getTodayString();
  const [draft, setDraft] = useState(() => readDraft(stats.rangeDraft, today));
  const [picker, setPicker] = useState(null); // 字をえらぶ段の番号
  const [drillPicker, setDrillPicker] = useState(null); // { mode: 'stage', index } | { mode: 'stages' }
  const [step, setStep] = useState('edit'); // edit | share
  const [confirmReset, setConfirmReset] = useState(false);
  const drills = stats.myDrills || [];
  // 段を そのまま使う: プリント（その段の字の紙のテスト）・授業モード（電子黒板に映す）・マイドリルにした知らせ
  const [printDrill, setPrintDrill] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [stageNotice, setStageNotice] = useState(null); // { index, added, name }

  // 下書きは、変えるたびに端末へ残す（タブを閉じても作りかけが消えないように）
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setStats(prev => {
      const next = { ...prev, rangeDraft: draft };
      StorageAPI.saveStats(next);
      return next;
    });
  }, [draft, setStats]);

  const range = useMemo(() => sanitizeLearningRange(draft), [draft]);
  const totalCount = draft.stages.reduce((sum, stage) => sum + stage.kanjis.length, 0);
  const shareUrl = useMemo(() => (range ? buildRangeShareUrl(range, `${window.location.origin}${window.location.pathname}`) : null), [range]);
  const badDate = draft.stages.some(stage => !isValidDateKey(stage.from));
  const tooBig = totalCount > RANGE_KANJI_MAX || (range && !shareUrl);
  const tooLong = shareUrl && shareUrl.length > SHARE_URL_SAFE_LENGTH;

  const updateStage = (index, patch) => { setStageNotice(null); setDraft(d => ({ ...d, stages: d.stages.map((stage, i) => (i === index ? { ...stage, ...patch } : stage)) })); };
  const addKanjisToStage = (index, ids) => setDraft(d => {
    const used = new Set(d.stages.flatMap(stage => stage.kanjis));
    let room = RANGE_KANJI_MAX - used.size;
    const add = [];
    for (const id of ids) {
      if (room <= 0) break;
      if (!KANJI_BY_ID.has(id) || used.has(id)) continue;
      used.add(id); add.push(id); room -= 1;
    }
    return { ...d, stages: d.stages.map((stage, i) => (i === index ? { ...stage, kanjis: [...stage.kanjis, ...add] } : stage)) };
  });
  const toggleKanji = (id) => {
    audioCtrl.playSE('click');
    const stage = draft.stages[picker];
    if (stage.kanjis.includes(id)) updateStage(picker, { kanjis: stage.kanjis.filter(k => k !== id) });
    else addKanjisToStage(picker, [id]);
  };
  const addStage = () => {
    if (draft.stages.length >= RANGE_STAGE_MAX) return;
    audioCtrl.playSE('click');
    setDraft(d => ({ ...d, stages: [...d.stages, { from: nextDate(d.stages, today), kanjis: [] }] }));
  };
  const removeStage = (index) => {
    audioCtrl.playSE('click');
    setDraft(d => {
      const stages = d.stages.filter((_, i) => i !== index);
      return { ...d, stages: stages.length > 0 ? stages : [{ from: today, kanjis: [] }] };
    });
  };
  const handlePickDrills = (picked) => {
    const target = drillPicker;
    setDrillPicker(null);
    if (!target) return;
    if (target.mode === 'stage') {
      addKanjisToStage(target.index, picked.flatMap(drill => drill.kanjis || []));
      return;
    }
    // えらんだドリルを1つずつ段にする（空の段が1つだけなら、そこから使う）
    setDraft(d => {
      const used = new Set(d.stages.flatMap(stage => stage.kanjis));
      const onlyEmpty = d.stages.length === 1 && d.stages[0].kanjis.length === 0;
      const stages = onlyEmpty ? [] : [...d.stages];
      let from = onlyEmpty && isValidDateKey(d.stages[0].from) ? d.stages[0].from : nextDate(stages, today);
      for (const drill of picked) {
        if (stages.length >= RANGE_STAGE_MAX) break;
        const kanjis = [];
        for (const id of drill.kanjis || []) {
          if (used.size >= RANGE_KANJI_MAX) break;
          if (!KANJI_BY_ID.has(id) || used.has(id)) continue;
          used.add(id); kanjis.push(id);
        }
        if (kanjis.length === 0) continue;
        stages.push({ from, kanjis });
        from = addDays(from, WEEK) || from;
      }
      return { ...d, stages: stages.length > 0 ? stages : d.stages };
    });
  };
  // 段を マイドリルにする（テスト・宿題・4けたの数字で送る は マイドリルから）
  const saveStageAsDrill = (index) => {
    const drill = stageToDrill(draft, index);
    if (!drill) return;
    const { added } = addStageDrill(stats.myDrills, drill);
    if (added) {
      setStats(prev => {
        const next = { ...prev, myDrills: addStageDrill(prev.myDrills, drill).drills };
        StorageAPI.saveStatsImmediate(next);
        return next;
      });
    }
    audioCtrl.playSE(added ? 'success' : 'click');
    setStageNotice({ index, added, name: drill.name });
  };

  // 配ったものの控え（先生の端末に残す）。URL をコピーした・Classroom を開いた ときと、配る画面を はなれるときに残す
  const recordShared = useShareLogging(setStats, 'range', step === 'share' && range && shareUrl ? encodeRangeParam(range) : null);

  const handleReset = () => {
    audioCtrl.playSE('click');
    setDraft({ name: '', stages: [{ from: today, kanjis: [] }] });
    setConfirmReset(false);
    setStep('edit');
  };

  const header = (
    <div className="flex items-center gap-3">
      <button onClick={() => (step === 'share' ? setStep('edit') : setView('myDrills'))} aria-label={step === 'share' ? '範囲を直す' : 'マイドリルに戻る'} className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
        <ArrowLeft size={24} />
      </button>
      <h2 className="text-xl md:text-2xl font-black text-[var(--text)] flex items-center gap-2">
        <CalendarDays size={22} /> <span>ならった{F("範囲","はんい")}を{F("配","くば")}る（{F("先生","せんせい")}{F("向","む")}け）</span>
      </h2>
    </div>
  );

  if (printDrill) {
    return (
      <Suspense fallback={null}>
        <PrintTestView drill={printDrill} setView={setView} onBack={() => setPrintDrill(null)} backLabel="ならった範囲に戻る" />
      </Suspense>
    );
  }

  if (step === 'share' && range && shareUrl) {
    return (
      <div className="flex flex-col gap-4 pb-8 max-w-2xl mx-auto w-full">
        {header}
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-5 shadow-[4px_4px_0_var(--text)] flex flex-col gap-2">
          <div className="font-black text-[var(--text)] text-lg break-all">{range.name}</div>
          <div className="text-sm font-bold text-[var(--text-muted)]">{range.stages.length}だん・{totalCount}{F("字","じ")}</div>
          <ol className="flex flex-col gap-1">
            {range.stages.map((stage, i) => (
              <li key={i} className="text-sm text-[var(--text)]">
                <span className="font-black">{i + 1}だんめ {formatMonthDay(stage.from)}から</span>：{stage.kanjis.map(id => KANJI_BY_ID.get(id)?.char).join('')}
              </li>
            ))}
          </ol>
        </div>
        <ShareLinkPanel
          shareUrl={shareUrl}
          title={`ならった範囲：${range.name}`}
          label="範囲のURL"
          inputId="range-share-url"
          onShared={recordShared}
          tooLongNote={<>{F("字","じ")}と だんが {F("多","おお")}いため、URLが とても{F("長","なが")}くなっています。うまく{F("開","ひら")}けない{F("端末","たんまつ")}があるときは、{F("範囲","はんい")}を{F("分","わ")}けて（{F("例","れい")}：1{F("学期","がっき")}・2{F("学期","がっき")}）{F("配","くば")}ってください。</>}
        />
        <div className="bg-[var(--bg)] border-[3px] border-[var(--text)] rounded-xl p-4 flex flex-col gap-1 text-sm text-[var(--text)]">
          <p className="font-black">このリンクについて</p>
          <p>・ぜんぶの だんと{F("日付","ひづけ")}が、URLの{F("中","なか")}に{F("入","はい")}っています。サーバーには{F("保存","ほぞん")}されません。</p>
          <p>・{F("児童","じどう")}の{F("端末","たんまつ")}は、じぶんの{F("日付","ひづけ")}を{F("見","み")}て、{F("日付","ひづけ")}が{F("来","き")}た だんの{F("字","じ")}だけを{F("毎日","まいにち")}の{F("学習","がくしゅう")}の「{F("新出","しんしゅつ")}」に{F("出","だ")}します。{F("復習","ふくしゅう")}は いままでどおりです。</p>
          <p>・{F("画面","がめん")}には{F("出","だ")}しませんが、URLの{F("中身","なかみ")}を{F("読","よ")}めば、{F("日付","ひづけ")}の{F("前","まえ")}の だんの{F("字","じ")}も わかります。</p>
          <p>・{F("配","くば")}ったあとに{F("直","なお")}したときは、{F("新","あたら")}しいリンクを{F("配","くば")}りなおしてください。{F("新","あたら")}しいリンクを{F("開","ひら")}いた{F("児童","じどう")}の{F("範囲","はんい")}が おきかわります。</p>
        </div>
        <MotionButton variant="secondary" onClick={() => setStep('edit')} className="w-full py-3 min-h-[48px] border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)] text-sm">
          <Pencil size={16} /> {F("範囲","はんい")}を{F("直","なお")}す
        </MotionButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-8 max-w-2xl mx-auto w-full">
      {header}

      <div className="bg-[var(--bg)] border-[3px] border-[var(--text)] rounded-xl p-3 text-sm font-bold text-[var(--text)] leading-relaxed">
        {F("授業","じゅぎょう")}で{F("習","なら")}った{F("字","じ")}だけを、{F("児童","じどう")}の{F("毎日","まいにち")}の{F("学習","がくしゅう")}の「{F("新出","しんしゅつ")}」に{F("出","だ")}します。
        だんごとに「この{F("日","ひ")}から」を{F("決","き")}めておくと、その{F("日","ひ")}になった だんの{F("字","じ")}が、だんの じゅんに{F("出","で")}ます。
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="range-name" className="text-sm font-black text-[var(--text)]">{F("範囲","はんい")}の{F("名前","なまえ")}</label>
        <input id="range-name" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} maxLength={DRILL_NAME_MAX_LENGTH} aria-describedby="range-name-note" placeholder="れい：3年 2学期" className="w-full min-h-[48px] bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl px-4 font-bold text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] text-lg" />
        <p id="range-name-note" className="text-xs font-bold text-[var(--text-muted)]">
          {F("学級名","がっきゅうめい")}や{F("名前","なまえ")}は {F("書","か")}かないでください（リンクで{F("配","くば")}ると みんなに{F("見","み")}えます）。{DRILL_NAME_MAX_LENGTH}{F("字","じ")}まで。
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {draft.stages.map((stage, i) => {
          const before = i > 0 && isValidDateKey(stage.from) && isValidDateKey(draft.stages[i - 1].from) && stage.from < draft.stages[i - 1].from;
          return (
            <li key={i} className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl p-3 shadow-[3px_3px_0_var(--text)] flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-[var(--text)]">{i + 1}だんめ</span>
                <label className="flex items-center gap-1 text-sm font-bold text-[var(--text)]">
                  <span>この{F("日","ひ")}から</span>
                  <input type="date" value={stage.from} min="2020-01-01" max="2099-12-31" onChange={e => updateStage(i, { from: e.target.value })} aria-label={`${i + 1}だんめの はじまる日`} className="min-h-[44px] bg-[var(--bg)] border-[3px] border-[var(--text)] rounded-xl px-2 font-bold text-[var(--text)] focus:outline-none focus:border-[var(--primary)]" />
                </label>
                <button type="button" onClick={() => removeStage(i)} aria-label={`${i + 1}だんめを けす`} className="ml-auto min-w-[44px] min-h-[44px] rounded-xl border-2 border-rose-300 text-rose-600 flex items-center justify-center hover:bg-[var(--bg)]"><Trash2 size={18} /></button>
              </div>
              {!isValidDateKey(stage.from) && <p className="text-xs font-bold text-rose-700">{F("日付","ひづけ")}を{F("入","い")}れてください。</p>}
              {before && <p className="text-xs font-bold text-[var(--text-muted)]">{F("前","まえ")}の だんより{F("前","まえ")}の{F("日","ひ")}です（そのままでも{F("配","くば")}れます）。</p>}
              {stage.kanjis.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {stage.kanjis.map(id => (
                    <button key={id} type="button" onClick={() => { audioCtrl.playSE('click'); updateStage(i, { kanjis: stage.kanjis.filter(k => k !== id) }); }} aria-label={`${KANJI_BY_ID.get(id)?.char}を のぞく`} className="min-w-[44px] min-h-[44px] rounded-lg border-2 border-[var(--text)]/30 bg-[var(--bg)] text-xl font-black text-[var(--text)] hover:border-rose-400" style={{ fontFamily: "'Klee One', serif" }}>
                      {KANJI_BY_ID.get(id)?.char}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-bold text-[var(--text-muted)]">まだ {F("字","じ")}が ありません（{F("字","じ")}の ない だんは {F("配","くば")}りません）。</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <MotionButton variant="primary" onClick={() => setPicker(i)} className="min-h-[48px] text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_#9f1239]"><Pencil size={16} /> {F("字","じ")}を えらぶ</MotionButton>
                <MotionButton variant="secondary" onClick={() => setDrillPicker({ mode: 'stage', index: i })} disabled={drills.length === 0} className="min-h-[48px] text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)]"><FileText size={16} /> マイドリルから</MotionButton>
              </div>
              {/* この段の字を そのまま使う（週の小テスト・授業）。字を えらびなおさなくてよい */}
              {stage.kanjis.length > 0 && (
                <div className="flex flex-col gap-1 border-t-2 border-[var(--text)]/15 pt-2" data-testid="range-stage-tools">
                  <div className="text-xs font-black text-[var(--text-muted)]"><span>この だんの{F("字","じ")}を つかう</span></div>
                  <div className="grid grid-cols-3 gap-2">
                    <MotionButton variant="secondary" onClick={() => saveStageAsDrill(i)} className="min-h-[48px] px-1 text-xs flex-col gap-0.5 border-[2px] border-[var(--text)] shadow-[0_2px_0_var(--text)]" data-testid="range-stage-drill"><FilePlus2 size={18} /> マイドリルに する</MotionButton>
                    <MotionButton variant="secondary" onClick={() => setPrintDrill(stageToDrill(draft, i))} className="min-h-[48px] px-1 text-xs flex-col gap-0.5 border-[2px] border-[var(--text)] shadow-[0_2px_0_var(--text)]" data-testid="range-stage-print"><Printer size={18} /> プリントに する</MotionButton>
                    <MotionButton variant="secondary" onClick={() => { const drill = stageToDrill(draft, i); if (drill) setLesson({ title: drill.name, kanjiIds: drill.kanjis }); }} className="min-h-[48px] px-1 text-xs flex-col gap-0.5 border-[2px] border-[var(--text)] shadow-[0_2px_0_var(--text)]" data-testid="range-stage-lesson"><Presentation size={18} /> {F("授業","じゅぎょう")}で うつす</MotionButton>
                  </div>
                  {stageNotice?.index === i && (
                    <p role="status" className="text-xs font-bold text-[var(--text)] bg-[var(--bg)] rounded-lg px-2 py-1.5 leading-relaxed" data-testid="range-stage-notice">
                      <span>{stageNotice.added
                        ? <>マイドリルに「{stageNotice.name}」を {F("入","い")}れました。テスト・{F("宿題","しゅくだい")}・4けたの すうじで{F("送","おく")}る は、マイドリルから できます。</>
                        : <>「{stageNotice.name}」は、もう マイドリルに あります。</>}</span>
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <MotionButton variant="secondary" onClick={addStage} disabled={draft.stages.length >= RANGE_STAGE_MAX} className="min-h-[48px] text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)]"><Plus size={16} /> だんを{F("足","た")}す</MotionButton>
        <MotionButton variant="secondary" onClick={() => setDrillPicker({ mode: 'stages' })} disabled={drills.length === 0} className="min-h-[48px] text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)]"><FileText size={16} /> マイドリルから だんを{F("作","つく")}る</MotionButton>
      </div>

      <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl p-3 flex flex-col gap-1 text-sm font-bold text-[var(--text)]" role="status">
        <div>{draft.stages.length}だん・{totalCount}{F("字","じ")}（{RANGE_STAGE_MAX}だん・{RANGE_KANJI_MAX}{F("字","じ")}まで）</div>
        {shareUrl && <div className="text-xs text-[var(--text-muted)]">リンクの{F("長","なが")}さ：{shareUrl.length}{F("字","じ")}（めやす {SHARE_URL_SAFE_LENGTH}{F("字","じ")}まで）</div>}
        {tooLong && <div className="text-xs text-amber-800 bg-amber-50 border-2 border-amber-400 rounded-lg px-2 py-1">リンクが{F("長","なが")}くなっています。うまく{F("開","ひら")}けない{F("端末","たんまつ")}があるので、{F("範囲","はんい")}を{F("分","わ")}けて（{F("例","れい")}：1{F("学期","がっき")}・2{F("学期","がっき")}）{F("配","くば")}ることを すすめます。</div>}
        {tooBig && <div className="text-xs text-rose-700">{F("大","おお")}きすぎて リンクに できません。{F("範囲","はんい")}を{F("分","わ")}けてください。</div>}
        {badDate && <div className="text-xs text-rose-700">{F("日付","ひづけ")}の ない だんが あります。</div>}
        {!draft.name.trim() && <div className="text-xs text-[var(--text-muted)]">{F("範囲","はんい")}の{F("名前","なまえ")}を{F("入","い")}れてください。</div>}
      </div>

      <MotionButton variant="primary" onClick={() => setStep('share')} disabled={!range || !shareUrl || badDate} className="w-full py-4 text-lg font-black border-[4px] border-[var(--text)] shadow-[0_5px_0_#9f1239]">
        <Link2 size={20} /> リンクを{F("作","つく")}る
      </MotionButton>

      {confirmReset ? (
        <div className="flex gap-2">
          <MotionButton variant="secondary" onClick={() => setConfirmReset(false)} className="flex-1 min-h-[48px] text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)]">やめる</MotionButton>
          <MotionButton variant="danger" onClick={handleReset} className="flex-1 min-h-[48px] text-sm">{F("消","け")}して はじめから</MotionButton>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmReset(true)} className="self-center min-h-[44px] px-3 text-xs font-bold text-[var(--text-muted)] underline underline-offset-2">{F("下書","したが")}きを{F("消","け")}して はじめから{F("作","つく")}る</button>
      )}

      <AnimatePresence>
        {picker !== null && draft.stages[picker] && (
          <KanjiPicker
            stageIndex={picker}
            stages={draft.stages}
            totalCount={totalCount}
            onToggle={toggleKanji}
            onAddMany={(ids) => addKanjisToStage(picker, ids)}
            onRemoveMany={(ids) => updateStage(picker, { kanjis: draft.stages[picker].kanjis.filter(id => !ids.includes(id)) })}
            onClose={() => setPicker(null)}
            initialGrade={KANJI_BY_ID.get(draft.stages[picker].kanjis[draft.stages[picker].kanjis.length - 1])?.grade || stats.targetGrade || 1}
          />
        )}
        {drillPicker && <DrillPicker mode={drillPicker.mode} drills={drills} onPick={handlePickDrills} onClose={() => setDrillPicker(null)} />}
      </AnimatePresence>
      {lesson && (
        <Suspense fallback={null}>
          <LessonMode title={lesson.title} kanjiIds={lesson.kanjiIds} onClose={() => setLesson(null)} />
        </Suspense>
      )}
    </div>
  );
};

export default RangeEditorView;
