import { useState } from 'react';
import { Hand, RotateCcw } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import ModalDialog from '../ui/ModalDialog';
import PenaltyLoss from '../ui/PenaltyLoss';
import { F } from '../ui/FormatKun';
import { StorageAPI } from '../../systems/storage';
import { calculateSatisfaction } from '../../systems/residents';
import { lastRestorableIndex, restoreHeavyPenalty, summarizePenalty } from '../../systems/careless-penalty';
import { TOWN_ITEM_MAP } from '../../data/town-items';
import { getTodayString } from '../../utils/date-utils';

/** 記録の日付（YYYY-MM-DD）を「11月16日」の形にする */
const dayLabel = (date) => {
  const [, month, day] = String(date || '').split('-').map(Number);
  return month && day ? `${month}月${day}日` : String(date || '');
};

/** おとなの確かめに出す かけ算（2けた × 2けた。毎回かえる） */
const newQuestion = () => {
  const pick = () => 12 + Math.floor(Math.random() * 38);
  const a = pick();
  const b = pick();
  return { a, b, answer: a * b };
};

/** 「元に戻す」の前の、おとなの確かめ */
function RestoreDialog({ entry, onCancel, onRestore }) {
  const [question, setQuestion] = useState(newQuestion);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    if (Number(value) === question.answer) { onRestore(); return; }
    setWrong(true); setValue(''); setQuestion(newQuestion());
  };
  return (
    <ModalDialog labelId="careless-restore-title" onEscape={onCancel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4">
      <form onSubmit={submit} data-testid="careless-restore-dialog" className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[24px] shadow-[6px_6px_0_var(--text)] p-5 max-w-sm w-full">
        <h3 id="careless-restore-title" className="text-base font-black text-[var(--text)]">ペナルティを元に戻す（先生・保護者向け）</h3>
        <p className="mt-2 text-xs font-bold text-[var(--text)] leading-relaxed">
          {dayLabel(entry.date)}のペナルティで失ったものを戻します。コイン・もちもの・素材・レベル・土地が戻り、
          町から無くなった建物は、元の場所が空いていれば置きなおします。戻した日は記録に残ります。
        </p>
        <label className="mt-3 block text-sm font-black text-[var(--text)]">
          確かめのため、答えを入れてください： <span data-testid="careless-restore-question">{question.a} × {question.b}</span> ＝
          <input
            type="text" inputMode="numeric" autoComplete="off" data-autofocus value={value}
            onChange={(event) => { setValue(event.target.value.replace(/[^0-9]/g, '')); setWrong(false); }}
            data-testid="careless-restore-answer"
            className="mt-1 block w-full min-h-[48px] rounded-xl border-[3px] border-[var(--text)] bg-[var(--bg)] px-3 text-lg font-black text-[var(--text)]"
          />
        </label>
        {wrong && <p role="alert" className="mt-1 text-xs font-black text-[var(--primary)]">答えがちがいます。問題を変えました。</p>}
        <div className="mt-4 flex gap-2">
          <MotionButton type="button" variant="secondary" onClick={onCancel} className="flex-1 py-3 text-sm font-black border-[3px] border-[var(--text)]">やめる</MotionButton>
          <MotionButton type="submit" variant="primary" data-testid="careless-restore-submit" className="flex-1 py-3 text-sm font-black border-[3px] border-[var(--text)]">元に戻す</MotionButton>
        </div>
      </form>
    </ModalDialog>
  );
}

/**
 * 学習きろくの「てきとう書き」のカード（先生・おうちの人が見る。何も無いあいだは出さない）。
 * 確かめの画面が出た回数・そのまま答え合わせをした回数・科したペナルティと、元に戻す操作。
 * @param {{ stats: object, setStats: Function, today: { careless: number, carelessWarned: number },
 *   week: { careless: number, carelessWarned: number } }} props
 */
export default function CarelessRecordCard({ stats, setStats, today, week }) {
  const [restoring, setRestoring] = useState(false);
  const [done, setDone] = useState(false);
  const log = Array.isArray(stats.carelessLog) ? stats.carelessLog : [];
  const strikes = Math.max(0, Math.floor(Number(stats.carelessStrikes) || 0));
  if (week.careless === 0 && week.carelessWarned === 0 && strikes === 0 && log.length === 0) return null;

  const restorable = lastRestorableIndex(stats);
  const recent = log.map((entry, index) => ({ entry, index })).slice(-5).reverse();
  const restore = () => {
    setStats((current) => {
      const { stats: next, restored } = restoreHeavyPenalty(current, { today: getTodayString(), itemMap: TOWN_ITEM_MAP });
      if (!restored) return current;
      const fixed = { ...next, satisfaction: calculateSatisfaction(next) };
      StorageAPI.saveStatsImmediate(fixed);
      return fixed;
    });
    setRestoring(false);
    setDone(true);
  };

  return (
    <div className="bg-[var(--panel)] border-[4px] border-[var(--primary)] rounded-2xl p-4 shadow-sm" data-testid="stats-careless">
      <div className="flex items-start gap-3">
        <Hand size={24} className="shrink-0 text-[var(--primary)]" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-[var(--text)]">てきとう{F("書","が")}きの {F("記録","きろく")}（{F("先生","せんせい")}・おうちの{F("人","ひと")}へ）</div>
          <dl className="mt-1 text-xs font-bold text-[var(--text)] leading-relaxed">
            <div data-testid="stats-careless-warned">
              <dt className="inline">ほとんど {F("書","か")}かずに「こたえあわせ」を おした：</dt>
              <dd className="inline-block font-black"> きょう {today.carelessWarned}{F("回","かい")}・7{F("日","にち")}で {week.carelessWarned}{F("回","かい")}</dd>
            </div>
            <div data-testid="stats-careless-count">
              <dt className="inline">そのまま こたえあわせを した：</dt>
              <dd className="inline-block font-black"> きょう {today.careless}{F("回","かい")}・7{F("日","にち")}で {week.careless}{F("回","かい")}</dd>
            </div>
            <div data-testid="stats-careless-strikes">
              <dt className="inline">ペナルティ：</dt>
              <dd className="inline-block font-black"> これまでに {strikes}{F("回","かい")}</dd>
            </div>
          </dl>
        </div>
      </div>

      {recent.length > 0 && (
        <ul className="mt-2 space-y-1 text-[11px] font-bold text-[var(--text)]" data-testid="stats-careless-log">
          {recent.map(({ entry, index }) => (
            <li key={index} className="bg-[var(--bg)] rounded-lg border-2 border-[var(--text)] px-2 py-1 leading-relaxed">
              <span className="font-black">{dayLabel(entry.date)}（{entry.strike}{F("回目","かいめ")}）</span>{' '}
              <PenaltyLoss loss={summarizePenalty(entry)} />
              {entry.restoredOn && <span className="ml-1 text-[var(--text-muted)]">→ {dayLabel(entry.restoredOn)}に {F("元","もと")}に もどした</span>}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[11px] font-bold leading-relaxed text-[var(--text-muted)]">
        ペナルティは、たしかめの {F("画面","がめん")}で「このまま こたえあわせ」を えらんだ ときにだけ かかります（1{F("日","にち")}に 1{F("回","かい")}まで）。
        「{F("書","か")}きなおす」「わからない」を えらべば、なにも へりません。
      </p>
      {done && <p role="status" className="mt-1 text-xs font-black text-[var(--secondary)]" data-testid="stats-careless-restored">ペナルティを {F("元","もと")}に もどしました。</p>}
      {restorable >= 0 && (
        <MotionButton variant="secondary" onClick={() => { setDone(false); setRestoring(true); }} data-testid="stats-careless-restore" style={{ minHeight: 48 }} className="mt-2 w-full py-2 text-xs font-black border-[2px] border-[var(--text)]">
          <RotateCcw size={16} /> さいごの ペナルティを {F("元","もと")}に もどす（{F("先生","せんせい")}{F("向","む")}け）
        </MotionButton>
      )}
      {restoring && restorable >= 0 && <RestoreDialog entry={log[restorable]} onCancel={() => setRestoring(false)} onRestore={restore} />}
    </div>
  );
}
