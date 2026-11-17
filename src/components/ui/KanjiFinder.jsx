import React, { useMemo, useState } from 'react';
import { Search, X, CheckCheck, ListChecks } from 'lucide-react';
import { KANJI_DATA } from '../../data/kanji-data';
import { audioCtrl } from '../../systems/audio';
import { findKanji, strokeOptions } from '../../utils/kanji-search';
import { F } from './FormatKun';

// 字えらびの画面の「さがす・しぼりこむ」（ドリルを作る・ならった範囲を配る）。
//
// 前は 学年タブと、その学年の字を ぜんぶ ならべた一覧だけで、目当ての字を 目で さがすしかなかった
// （3 年は 200 字。ならびも 画数の順に なっていない所がある）。ここでは:
//   ・字を そのまま打つ（「山川田」。教科書の単元の字を まとめて打てる）／読みで さがす／数字で 画数
//   ・学年と 画数で しぼりこむ。一覧は 画数の順に、画数ごとに 見出しを付けて ならべる
//   ・見つかった字を まとめて えらぶ
// さがし方の計算は utils/kanji-search.js の findKanji（React に依存しない。test/kanji-search.test.js）。
//
// ⚠️ ここは components/ui/index.js から出さない。出すと 入口の束（初回に読む JS。上限 220KiB）に入る。
//    使う画面（DrillEditorView・RangeEditorView）から じかに import する。

const GRADES = [0, 1, 2, 3, 4, 5, 6];
/** 「まとめて えらぶ」を出す 字の数の上限（学年ぜんぶ などを まちがって えらばないように） */
const BULK_MAX = 60;

const chip = (on) => `min-h-[44px] px-3.5 rounded-full text-sm font-black whitespace-nowrap border-[2px] transition-colors ${on ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--panel)] text-[var(--text)] border-[var(--text)]/25 hover:border-[var(--text)]'}`;

/**
 * さがす・しぼりこむ の状態と、その結果。
 * @param {{ initialGrade?: number, selectedIds?: string[] }} [options]
 *   selectedIds を渡すと「えらんだ字」だけを見る切りかえ（onlySelected）が使える
 */
export function useKanjiFinder({ initialGrade = 0, selectedIds = null } = {}) {
  const [query, setQuery] = useState('');
  const [grade, setGradeState] = useState(initialGrade);
  const [strokes, setStrokes] = useState(0);
  const [onlySelected, setOnlySelected] = useState(false);

  const options = useMemo(() => strokeOptions(KANJI_DATA, grade), [grade]);
  const setGrade = (next) => {
    setGradeState(next);
    // その学年に無い画数を えらんだままにしない
    if (strokes !== 0 && !strokeOptions(KANJI_DATA, next).some((o) => o.strokes === strokes)) setStrokes(0);
  };
  const found = useMemo(() => findKanji(KANJI_DATA, { query, grade, strokes }), [query, grade, strokes]);
  const result = useMemo(() => {
    if (!onlySelected || !selectedIds) return found;
    // えらんだ字だけ（えらんだ順）。さがす・しぼりこむ は見ない
    const byId = new Map(KANJI_DATA.map((kanji) => [kanji.id, kanji]));
    const items = selectedIds.map((id) => byId.get(id)).filter(Boolean).map((kanji) => ({ kanji, strokes: 0 }));
    return { mode: 'selected', items, unknown: [], elsewhere: 0, strokes: 0 };
  }, [found, onlySelected, selectedIds]);

  const reset = () => { setQuery(''); setStrokes(0); setGradeState(0); setOnlySelected(false); };
  return { query, setQuery, grade, setGrade, strokes, setStrokes, strokeOptions: options, onlySelected, setOnlySelected, result, reset };
}

/** さがす欄・学年・画数（・えらんだ字） */
export const KanjiFinderControls = ({ finder, idPrefix = 'kanji-finder', selectedCount = null }) => {
  const { query, setQuery, grade, setGrade, strokes, setStrokes, strokeOptions: options, onlySelected, setOnlySelected } = finder;
  const inputId = `${idPrefix}-query`;
  const strokesId = `${idPrefix}-strokes`;
  return (
    <div className="flex flex-col gap-2" data-testid="kanji-finder">
      {/* 広い画面では さがす欄・画数・えらんだ字 を 1 行に。せまい画面では さがす欄が 1 行、のこりが 次の行に折り返す */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <label htmlFor={inputId} className="sr-only">よみ・かんじ・かくすうで さがす</label>
          <Search size={20} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            id={inputId} type="search" value={query} onChange={(e) => { setQuery(e.target.value); if (onlySelected) setOnlySelected(false); }}
            placeholder="さがす（れい：やま・山川田・5かく）" autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="search"
            className="w-full min-h-[48px] bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl pl-10 pr-12 font-bold text-base text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="さがす字を けす" className="absolute right-0 top-0 min-w-[48px] min-h-[48px] flex items-center justify-center text-[var(--text)]">
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={strokesId} className="text-sm font-black text-[var(--text)]"><span>{F('画数', 'かくすう')}</span></label>
          <select
            id={strokesId} value={strokes} onChange={(e) => { setStrokes(Number(e.target.value)); setOnlySelected(false); }}
            className="min-h-[44px] bg-[var(--panel)] border-[2px] border-[var(--text)] rounded-xl px-2 font-black text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
          >
            <option value={0}>すべて</option>
            {options.map((o) => <option key={o.strokes} value={o.strokes}>{o.strokes}かく（{o.count}じ）</option>)}
          </select>
        </div>
        {selectedCount !== null && (
          <button type="button" aria-pressed={onlySelected} disabled={selectedCount === 0} onClick={() => { audioCtrl.playSE('click'); setOnlySelected(!onlySelected); }}
            className={`shrink-0 ${chip(onlySelected)} ml-auto flex items-center gap-1 disabled:opacity-50`} data-testid="kanji-finder-selected">
            <ListChecks size={16} aria-hidden="true" />
            <span>えらんだ{F('字', 'じ')} {selectedCount}</span>
          </button>
        )}
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar" role="group" aria-label="がくねん">
        {GRADES.map((g) => (
          <button key={g} type="button" aria-pressed={grade === g && !onlySelected} onClick={() => { audioCtrl.playSE('click'); setGrade(g); setOnlySelected(false); }} className={`shrink-0 ${chip(grade === g && !onlySelected)}`}>
            {g === 0 ? 'すべて' : <span>{g}{F('年', 'ねん')}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * 見つかった字の一覧と、その上の 知らせ（何字 見つかったか・まとめて えらぶ）。
 *
 * selectedIds  … えらんである字
 * lockedLabels … えらべない字（Map<字の id, { badge: ふだに出す文字, label: 読み上げ用 }>。ならった範囲の、ほかの段にある字）
 * canAdd       … これ以上 えらべるか（上限に達したら false）
 * onToggle(id) … 1 字を えらぶ・はずす
 * onAddMany(ids) / onRemoveMany(ids) … まとめて えらぶ・はずす（渡さなければ ボタンを出さない）
 */
export const KanjiFinderResults = ({ finder, selectedIds, lockedLabels = null, canAdd = true, onToggle, onAddMany = null, onRemoveMany = null, gridClassName = 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12' }) => {
  const { result, query, grade, strokes, setGrade, setStrokes } = finder;
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const { mode, items, unknown, elsewhere } = result;

  // 画数の順に ならべた一覧は、画数ごとに 見出しを付ける（読み・字で さがした結果は 見つかった順のまま）
  const groups = useMemo(() => {
    if (mode !== 'browse') return [{ strokes: 0, items }];
    const out = [];
    for (const item of items) {
      const last = out[out.length - 1];
      if (last && last.strokes === item.strokes) last.items.push(item);
      else out.push({ strokes: item.strokes, items: [item] });
    }
    return out;
  }, [mode, items]);

  const open = items.filter((item) => !lockedLabels?.has(item.kanji.id));
  const unselected = open.filter((item) => !selected.has(item.kanji.id)).map((item) => item.kanji.id);
  const narrowed = mode !== 'browse' || strokes !== 0;
  const showBulk = narrowed && mode !== 'selected' && open.length > 0 && open.length <= BULK_MAX;

  let summary;
  if (mode === 'selected') summary = <>えらんだ{F('字', 'じ')}：{items.length}{F('字', 'じ')}（おすと はずせます）</>;
  else if (mode === 'chars') summary = <>{items.length}{F('字', 'じ')} {F('見', 'み')}つかりました</>;
  else if (mode === 'reading') summary = <>「{query.trim()}」と {F('読', 'よ')}む{F('字', 'じ')}：{items.length}{F('字', 'じ')}</>;
  else if (mode === 'strokes') summary = <>{result.strokes}かくの{F('字', 'じ')}：{items.length}{F('字', 'じ')}</>;
  else summary = <>{grade === 0 ? 'すべての がくねん' : <>{grade}{F('年', 'ねん')}</>}{strokes ? `・${strokes}かく` : ''}：{items.length}{F('字', 'じ')}</>;

  return (
    <div className="flex flex-col gap-2" data-testid="kanji-finder-results" data-mode={mode} data-count={items.length}>
      <div className="flex items-center gap-2 flex-wrap">
        <p role="status" className="flex-1 min-w-[10rem] text-sm font-bold text-[var(--text)]">
          <span>{summary}</span>
        </p>
        {showBulk && unselected.length > 0 && onAddMany && (
          <button type="button" disabled={!canAdd} onClick={() => { audioCtrl.playSE('click'); onAddMany(unselected); }} data-testid="kanji-finder-add-all"
            className="shrink-0 min-h-[44px] px-3 rounded-xl border-[3px] border-[var(--text)] bg-[var(--accent)] text-[var(--text)] text-sm font-black flex items-center gap-1 disabled:opacity-50">
            <CheckCheck size={16} aria-hidden="true" />
            <span>{unselected.length}{F('字', 'じ')}を まとめて えらぶ</span>
          </button>
        )}
        {showBulk && unselected.length === 0 && onRemoveMany && (
          <button type="button" onClick={() => { audioCtrl.playSE('click'); onRemoveMany(open.map((item) => item.kanji.id)); }} data-testid="kanji-finder-remove-all"
            className="shrink-0 min-h-[44px] px-3 rounded-xl border-[3px] border-[var(--text)]/40 bg-[var(--panel)] text-[var(--text)] text-sm font-black">
            <span>{open.length}{F('字', 'じ')}を まとめて はずす</span>
          </button>
        )}
      </div>
      {unknown.length > 0 && (
        <p className="text-xs font-bold text-amber-800 bg-amber-50 border-2 border-amber-400 rounded-lg px-2 py-1" data-testid="kanji-finder-unknown">
          <span>「{unknown.join('')}」は、{F('小学校', 'しょうがっこう')}で {F('習', 'なら')}う{F('字', 'じ')}に ありません。</span>
        </p>
      )}
      {mode === 'reading' && elsewhere > 0 && (
        <p className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
          <span>ほかの がくねん・かくすうに {elsewhere}{F('字', 'じ')} あります。</span>
          <button type="button" onClick={() => { audioCtrl.playSE('click'); setGrade(0); setStrokes(0); }} data-testid="kanji-finder-widen" className="min-h-[44px] px-2 underline underline-offset-2 text-[var(--text)]">
            すべての がくねんで {F('見', 'み')}る
          </button>
        </p>
      )}
      {items.length === 0 && mode !== 'selected' && (
        <p className="py-6 text-center text-sm font-bold text-[var(--text-muted)]">
          <span>{F('見', 'み')}つかりませんでした。{F('読', 'よ')}みを ひらがなで {F('入', 'い')}れるか、{F('字', 'じ')}を そのまま {F('入', 'い')}れてください。</span>
        </p>
      )}
      {groups.map((group) => (
        <section key={group.strokes} aria-label={group.strokes ? `${group.strokes}かく` : undefined}>
          {group.strokes > 0 && strokes === 0 && (
            <h4 className="text-xs font-black text-[var(--text-muted)] mb-1 mt-1">{group.strokes}かく</h4>
          )}
          <div className={`grid ${gridClassName} gap-2`}>
            {group.items.map(({ kanji, hit }) => {
              const mine = selected.has(kanji.id);
              const lock = lockedLabels?.get(kanji.id);
              const locked = lock !== undefined;
              return (
                <button
                  key={kanji.id} type="button" aria-pressed={mine} disabled={locked || (!mine && !canAdd)}
                  aria-label={locked ? `${kanji.char}（${lock.label}）` : kanji.char}
                  onClick={() => onToggle(kanji.id)} data-kanji={kanji.char}
                  className={`relative min-h-[52px] py-1.5 rounded-xl border-[3px] flex flex-col items-center justify-center transition-colors ${mine ? 'bg-[var(--primary)] text-[var(--panel)] border-[var(--primary)] shadow-md' : locked ? 'bg-[var(--bg)] text-[var(--text-muted)] border-transparent opacity-60' : 'bg-[var(--panel)] text-[var(--text)] border-[var(--text)]/40 hover:border-[var(--text)]'}`}
                >
                  <span className="font-black text-2xl leading-none" style={{ fontFamily: "'Klee One', serif" }}>{kanji.char}</span>
                  {/* 読みで さがしたときは、合った読みを 字の下に出す（同じ読みの字を 見分けるため） */}
                  {hit && <span className="mt-0.5 max-w-full truncate px-0.5 text-[10px] font-bold leading-none">{hit.text.replace(/[()（）\-]/g, '')}</span>}
                  {locked && <span className="absolute -top-1 -right-1 rounded-full bg-[var(--text)] text-[var(--panel)] text-[10px] font-black px-1 leading-4" aria-hidden="true">{lock.badge}</span>}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
