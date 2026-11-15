import React from 'react';
import { motion } from 'framer-motion';
import { NotebookPen, ChevronRight, CheckCircle2, BookOpen, X } from 'lucide-react';
import { F } from '../ui/FormatKun';
import ModalDialog from '../ui/ModalDialog';
import { audioCtrl } from '../../systems/audio';
import { daysUntil, formatMonthDay, getHomeworkState, homeworkIdFor, homeworkQuestionCount } from '../../systems/homework-status';
import { readHomework } from '../../systems/homework';

// 宿題（と ならった範囲）の小さな部品。ホーム・マイドリル・受け取り・結果の画面で使う。
// ホームからは lazy() で読む（宿題も範囲も無い子の初回の JS を増やさないため）。

/**
 * 宿題の決められたやること（練習か、決められた問題数のテスト）を、宿題として始める。
 * start は App の { startDrillSession(drill, homeworkId), startDrillTest(drill, count, homeworkId) }
 */
export function startHomeworkFor(drill, { startDrillSession, startDrillTest }) {
  const hw = readHomework(drill);
  if (hw?.mode === 'test') {
    const count = homeworkQuestionCount(hw, drill.kanjis?.length);
    startDrillTest(drill, count, homeworkIdFor(drill, 'test', count));
  } else {
    startDrillSession(drill, homeworkIdFor(drill, 'practice'));
  }
}

/** しめきりの言い方（すぎていても責めない） */
export const dueLabel = (due, today) => {
  const days = daysUntil(due, today);
  if (days === null) return '';
  if (days === 0) return 'きょうまで';
  if (days === 1) return 'あしたまで';
  if (days < 0) return <>{formatMonthDay(due)}まで（すぎたけど、いまからでも できるよ）</>;
  return <>{formatMonthDay(due)}まで（あと{days}{F("日","にち")}）</>;
};

/** やることの言い方（テスト10問・80%で ごうかく など） */
export const taskLabel = (homework, kanjiCount) => (homework.mode === 'test'
  ? <>テスト{homeworkQuestionCount(homework, kanjiCount)}{F("問","もん")}・{homework.pass}{F("点","てん")}で {F("合格","ごうかく")}</>
  : <>{F("練習","れんしゅう")}（ぜんぶの{F("字","じ")}）</>);

const STATE_STYLE = {
  todo: { label: 'まだ', className: 'bg-[var(--bg)] text-[var(--text)] border-[var(--text)]' },
  doing: { label: 'とりくみ中', className: 'bg-amber-100 text-amber-900 border-amber-500' },
  done: { label: 'できた', className: 'bg-emerald-100 text-emerald-800 border-emerald-500' },
};

/** まだ／とりくみ中／できた のしるし */
export const HomeworkStateChip = ({ state }) => {
  const style = STATE_STYLE[state] || STATE_STYLE.todo;
  return (
    <span className={`shrink-0 inline-flex items-center gap-0.5 rounded-full border-2 px-2 py-0.5 text-[11px] font-black leading-none ${style.className}`}>
      {state === 'done' && <CheckCircle2 size={12} aria-hidden="true" />}{style.label}
    </span>
  );
};

/** 受け取った宿題の決まり（受け取りの画面） */
export const HomeworkSummary = ({ homework, kanjiCount, today }) => (
  <div className="rounded-xl border-[3px] border-[var(--primary)] bg-[var(--bg)] px-3 py-2 flex flex-col gap-1">
    <div className="font-black text-[var(--text)] flex items-center gap-1"><NotebookPen size={18} aria-hidden="true" /> {F("宿題","しゅくだい")}</div>
    <div className="text-sm font-bold text-[var(--text)]">しめきり：{today ? dueLabel(homework.due, today) : <>{formatMonthDay(homework.due)}まで</>}</div>
    <div className="text-sm font-bold text-[var(--text)]">やること：{taskLabel(homework, kanjiCount)}</div>
  </div>
);

/** マイドリルの一覧に出す宿題のようす（1行） */
export const HomeworkLine = ({ hw, kanjiCount, today }) => (
  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-bold text-[var(--text)]">
    <span className="inline-flex items-center gap-0.5 font-black text-[var(--primary)]"><NotebookPen size={13} aria-hidden="true" />{F("宿題","しゅくだい")}</span>
    <HomeworkStateChip state={hw.state} />
    <span>{dueLabel(hw.due, today)}</span>
    <span className="text-[var(--text-muted)]">{taskLabel(hw, kanjiCount)}</span>
    {hw.result.tries > 0 && (
      <span className="text-[var(--text-muted)]">
        {hw.mode === 'test' && hw.result.best !== null && <>いちばん {hw.result.best}{F("点","てん")}・</>}{hw.result.tries}{F("回","かい")}
        {hw.result.doneOn && <>・{formatMonthDay(hw.result.doneOn)}にできた</>}
      </span>
    )}
  </div>
);

/** マイドリルの1つのドリルの宿題のようす（宿題でなければ何も出さない） */
export const DrillHomeworkLine = ({ drill, today }) => {
  const hw = getHomeworkState(drill, today);
  return hw ? <HomeworkLine hw={hw} kanjiCount={drill.kanjis?.length || 0} today={today} /> : null;
};

/**
 * ホームの「しゅくだい」カード。しめきりが近い順。押すと、その宿題の練習かテストを始める。
 * スマホでは学習を始めるボタンの下に出す（ボタンを押し下げない）。出すのは上から max 件まで。
 */
export const HomeworkCard = ({ items, today, onStart, onOpenList, max = 2 }) => {
  if (!items || items.length === 0) return null;
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  return (
    <div id="home-homework" className="bg-[var(--panel)] border-[3px] border-[var(--primary)] rounded-2xl p-2 shadow-[2px_2px_0_var(--primary)] shrink-0 flex flex-col gap-1.5 scroll-mb-4">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-sm font-black text-[var(--text)] flex items-center gap-1"><NotebookPen size={16} className="text-[var(--primary)]" aria-hidden="true" /> しゅくだい</span>
        {rest > 0 && (
          <button type="button" onClick={() => { audioCtrl.playSE('click'); onOpenList(); }} className="min-h-[44px] px-2 text-xs font-black text-[var(--text)] underline underline-offset-2">
            ほかに {rest}{F("件","けん")}
          </button>
        )}
      </div>
      {shown.map(({ drill, hw }) => (
        <button
          key={hw.id}
          type="button"
          onClick={() => { audioCtrl.playSE('click'); onStart(drill); }}
          className="w-full min-h-[48px] rounded-xl border-2 border-[var(--text)] bg-[var(--bg)] px-2 py-1.5 flex items-center gap-2 text-left active:scale-[0.98] transition-transform"
        >
          <HomeworkStateChip state={hw.state} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black text-[var(--text)]">{drill.name}</span>
            <span className={`block truncate text-[11px] ${hw.overdue ? 'font-black text-[var(--text)]' : 'font-bold text-[var(--text-muted)]'}`}>
              {hw.mode === 'test' ? 'テスト' : <>{F("練習","れんしゅう")}</>}・{dueLabel(hw.due, today)}
            </span>
          </span>
          <ChevronRight size={20} className="shrink-0 text-[var(--text)]" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
};

/**
 * 結果の画面の「先生に見せる」。ドリルの名前・点数・できた日を大きく出す（児童の名前は出さない）。
 * 先生は児童の端末を見られない（サーバーが無い）ので、これを見て確かめてもらう。
 */
export const ShowTeacherOverlay = ({ report, onClose }) => {
  const date = report.passed ? (report.doneOn || report.today) : report.today;
  const [, m, d] = String(date).split('-').map(Number);
  return (
    <ModalDialog labelId="show-teacher-title" onEscape={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/60">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-full max-w-xl bg-white text-slate-900 rounded-3xl border-[6px] border-slate-900 p-6 sm:p-8 flex flex-col items-center gap-3 text-center shadow-2xl">
        <button type="button" onClick={onClose} aria-label="とじる" className="absolute top-2 right-2 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100">
          <X size={28} />
        </button>
        <div id="show-teacher-title" className="text-lg font-black text-slate-700 flex items-center gap-1"><NotebookPen size={22} aria-hidden="true" /> {F("宿題","しゅくだい")}</div>
        <div className="text-2xl sm:text-3xl font-black break-all">{report.name}</div>
        {report.mode === 'test' ? (
          <>
            <div className="text-6xl sm:text-7xl font-black leading-none">{report.score}<span className="text-2xl sm:text-3xl">{F("点","てん")}</span></div>
            <div className={`text-xl font-black ${report.passed ? 'text-emerald-700' : 'text-slate-700'}`}>
              {report.passed ? <>{F("合格","ごうかく")}（{report.pass}{F("点","てん")}{F("以上","いじょう")}）</> : <>{F("合格","ごうかく")}は {report.pass}{F("点","てん")}{F("以上","いじょう")}</>}
            </div>
          </>
        ) : (
          <div className="text-4xl sm:text-5xl font-black text-emerald-700 flex items-center gap-2"><BookOpen size={40} aria-hidden="true" />{F("練習","れんしゅう")} できた</div>
        )}
        <div className="text-2xl font-black">{m}{F("月","がつ")}{d}{F("日","にち")}に {report.passed ? 'できた' : <>やった</>}</div>
        <button type="button" onClick={onClose} className="mt-2 w-full min-h-[56px] rounded-2xl border-[3px] border-slate-900 bg-slate-100 text-lg font-black">とじる</button>
      </motion.div>
    </ModalDialog>
  );
};
