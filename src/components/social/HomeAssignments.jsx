import React, { useMemo } from 'react';
import { BookOpen, NotebookPen } from 'lucide-react';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';
import { KANJI_DATA } from '../../data/kanji-data';
import { listHomeworkForHome, formatMonthDay } from '../../systems/homework-status';
import { getLearningRangeStatus } from '../../systems/learning-range';
import { HomeworkCard, startHomeworkFor } from './HomeworkParts';

// ホームに出す「しゅくだい」と「ならった範囲」。HomeView から lazy() で読む
// （宿題も範囲も無い子の初回の JS を増やさないため）。

const KNOWN_KANJI_IDS = new Set(KANJI_DATA.map((k) => k.id));
const isKnownKanji = (id) => KNOWN_KANJI_IDS.has(id);

/** ホームの「しゅくだい」カード（まだの宿題と、しめきりの日までの できた宿題） */
export const HomeworkCardForHome = ({ drills, today, start, onOpenList, max }) => {
  const items = useMemo(() => listHomeworkForHome(drills, today), [drills, today]);
  return <HomeworkCard items={items} today={today} onStart={(drill) => startHomeworkFor(drill, start)} onOpenList={onOpenList} max={max} />;
};

/**
 * スマホでは「しゅくだい」のカードが学習を始めるボタンの下（最初の画面の外）になるので、
 * 町の左上に小さな札を重ねて知らせる（重ねるだけなので、ほかの部品の位置は変わらない）。
 * 押すと、宿題のカードまでスクロールする。
 */
export const HomeworkBadge = ({ drills, today }) => {
  const count = useMemo(() => listHomeworkForHome(drills, today).filter(({ hw }) => hw.state !== 'done').length, [drills, today]);
  if (count === 0) return null;
  return (
    <button
      type="button"
      onClick={() => { audioCtrl.playSE('click'); document.getElementById('home-homework')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
      className="absolute top-1.5 left-1.5 z-20 min-h-[44px] px-3 rounded-full border-[3px] border-[var(--primary)] bg-[var(--panel)] text-sm font-black text-[var(--text)] shadow-md flex items-center gap-1"
    >
      <NotebookPen size={16} className="text-[var(--primary)]" aria-hidden="true" /> しゅくだい {count}
    </button>
  );
};

/**
 * ならった範囲の小さな表示（学習を始めるボタンの下）。
 * 例「📘 3年 2学期（5/17字）・11/20から あたらしい字が 12字」（5/17 は日付が来た字の数／ぜんぶの字の数）
 */
export const RangeStatusLine = ({ range, kanjiStats, today, grade }) => {
  const status = useMemo(() => getLearningRangeStatus(range, kanjiStats, today, isKnownKanji), [range, kanjiStats, today]);
  if (!status) return null;
  const next = status.nextStage;
  let detail;
  if (status.complete) {
    detail = <>{F("字","じ")}は ぜんぶ ならったよ！ いまは {grade}{F("年","ねん")}の{F("字","じ")}が でるよ</>;
  } else if (status.waitingCount > 0) {
    detail = next
      ? <>（{status.startedCount}/{status.totalCount}{F("字","じ")}）・{formatMonthDay(next.from)}から あたらしい{F("字","じ")}が {next.count}{F("字","じ")}</>
      : <>（{status.totalCount}{F("字","じ")}）から あたらしい{F("字","じ")}が でるよ</>;
  } else if (next) {
    detail = <>：つぎは {formatMonthDay(next.from)}から あたらしい{F("字","じ")}が {next.count}{F("字","じ")}（それまでは {F("復習","ふくしゅう")}）</>;
  } else {
    detail = <>（{status.totalCount}{F("字","じ")}）</>;
  }
  return (
    <div className="flex items-start gap-1 px-1 text-[11px] font-bold leading-snug text-[var(--text-muted)]" role="note" aria-label="ならった範囲">
      <BookOpen size={13} className="shrink-0 mt-[2px] text-[var(--secondary)]" aria-hidden="true" />
      <span className="min-w-0"><span className="font-black text-[var(--text)]">{status.name}</span>{detail}</span>
    </div>
  );
};
