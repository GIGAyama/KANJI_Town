import React, { useMemo, useState } from 'react';
import { ArrowLeft, Link2, NotebookPen } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { KANJI_DATA } from '../../data/kanji-data';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';
import { HOMEWORK_TEST_COUNTS, buildDrillShareUrl, isValidDateKey, sanitizeHomework } from '../../systems/drill-share';
import { addDays, daysUntil, formatMonthDay } from '../../systems/homework-status';
import { getTodayString } from '../../utils/date-utils';
import ShareLinkPanel from './ShareLinkPanel';

/** 合格の目安（%）のえらびかた */
const PASS_OPTIONS = [60, 70, 80, 90, 100];
const DEFAULT_PASS = 80;
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const weekdayOf = (key) => (isValidDateKey(key) ? WEEKDAYS[new Date(`${key}T12:00:00`).getDay()] : '');

/** えらぶボタン（宿題の決まり） */
const Choice = ({ active, onClick, children, className = '' }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={() => { audioCtrl.playSE('click'); onClick(); }}
    className={`min-h-[48px] px-2 rounded-xl border-[3px] text-sm font-black whitespace-nowrap transition-all ${className} ${active ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text)] shadow-[2px_2px_0_var(--primary)]' : 'border-[var(--text)]/25 text-[var(--text)] hover:border-[var(--text)]'}`}
  >
    {children}
  </button>
);

/**
 * ドリルをリンク・QR・Classroom・4けたの数字で配る画面。
 * 「宿題にする（先生向け）」を選ぶと、しめきり・やること・問題数・合格の目安もリンクに入る。
 * どの配り方でも同じ中身（drill-share.js の param）が届く。
 */
const DrillShareView = ({ setView, drill, setHostDrill }) => {
  const today = getTodayString();
  const kanjiCount = drill?.kanjis?.length || 0;
  // 4けたの数字の画面から戻ってきたときは、えらんでいた宿題の決まりを続ける
  const initial = sanitizeHomework(drill?.homework);
  const [isHomework, setIsHomework] = useState(Boolean(initial));
  const [due, setDue] = useState(initial?.due || addDays(today, 7) || today);
  const [mode, setMode] = useState(initial?.mode || 'test');
  const [count, setCount] = useState(initial?.mode === 'test' ? initial.count : (kanjiCount > 10 ? 10 : 0));
  const [pass, setPass] = useState(initial?.mode === 'test' ? initial.pass : DEFAULT_PASS);

  // 問題数は、ドリルの字数より少ないものと「ぜんぶ」だけを出す
  const countOptions = [...HOMEWORK_TEST_COUNTS.filter(n => n > 0 && n < kanjiCount), 0];
  const homework = isHomework ? sanitizeHomework({ due, mode, count, pass }) : null;
  const homeworkInvalid = isHomework && !homework;
  const daysLeft = homework ? daysUntil(homework.due, today) : null;

  const homeworkKey = homework ? JSON.stringify(homework) : '';
  const sharedDrill = useMemo(
    () => (drill ? { name: drill.name, kanjis: drill.kanjis, ...(homeworkKey ? { homework: JSON.parse(homeworkKey) } : {}) } : null),
    [drill, homeworkKey],
  );
  const shareUrl = useMemo(() => {
    if (!sharedDrill || homeworkInvalid) return null;
    return buildDrillShareUrl(sharedDrill, `${window.location.origin}${window.location.pathname}`);
  }, [sharedDrill, homeworkInvalid]);
  const title = homework ? `しゅくだい ${formatMonthDay(homework.due)}まで：${drill?.name || ''}` : drill?.name;

  const sendByNumber = () => {
    setHostDrill?.(sharedDrill);
    setView('peerHost');
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('myDrills')} aria-label="マイドリルに戻る" className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2">
          <Link2 size={22} /> リンクで{F("配","くば")}る
        </h2>
      </div>

      {!drill || !buildDrillShareUrl(drill, 'https://x/') ? (
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">🔗</div>
          <p className="font-bold text-[var(--text)] opacity-60">このドリルはリンクにできませんでした</p>
          <p className="text-sm text-[var(--text)] opacity-40 mt-1">マイドリルからもう一度えらんでください</p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-5 shadow-[4px_4px_0_var(--text)]">
            <div className="font-black text-[var(--text)] text-lg">{drill.name}</div>
            <div className="text-sm text-[var(--text)] opacity-60">{kanjiCount}{F("文字","もじ")}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {(drill.kanjis || []).map(id => {
                const k = KANJI_DATA.find(k => k.id === id);
                return k ? <span key={id} className="text-xl font-black">{k.char}</span> : null;
              })}
            </div>
          </div>

          {/* 宿題にする（先生向け） */}
          <div className={`bg-[var(--panel)] border-[4px] rounded-2xl p-5 flex flex-col gap-4 ${isHomework ? 'border-[var(--primary)] shadow-[4px_4px_0_var(--primary)]' : 'border-[var(--text)] shadow-[4px_4px_0_var(--text)]'}`}>
            <label className="flex items-center gap-3 cursor-pointer min-h-[48px]">
              <input
                type="checkbox"
                checked={isHomework}
                onChange={(e) => { audioCtrl.playSE('click'); setIsHomework(e.target.checked); }}
                className="w-7 h-7 shrink-0 accent-[var(--primary)]"
              />
              <span className="flex flex-col">
                <span className="font-black text-[var(--text)] flex items-center gap-1"><NotebookPen size={18} aria-hidden="true" /> {F("宿題","しゅくだい")}にする（{F("先生","せんせい")}{F("向","む")}け）</span>
                <span className="text-xs font-bold text-[var(--text-muted)]">しめきりと やることも いっしょに {F("配","くば")}ります。{F("児童","じどう")}のホームに「しゅくだい」が{F("出","で")}ます。</span>
              </span>
            </label>

            {isHomework && (
              <>
                <div className="flex flex-col gap-1">
                  <label htmlFor="homework-due" className="text-sm font-black text-[var(--text)]">しめきり</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      id="homework-due"
                      type="date"
                      value={due}
                      min="2020-01-01"
                      max="2099-12-31"
                      onChange={(e) => setDue(e.target.value)}
                      className="min-h-[48px] bg-[var(--bg)] border-[3px] border-[var(--text)] rounded-xl px-3 font-bold text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                    />
                    {homework && <span className="text-sm font-bold text-[var(--text)]">{formatMonthDay(homework.due)}（{weekdayOf(homework.due)}）まで</span>}
                  </div>
                  {daysLeft !== null && daysLeft < 0 && (
                    <p className="text-xs font-bold text-amber-700">きょうより{F("前","まえ")}の{F("日","ひ")}です。このまま{F("配","くば")}ると、{F("児童","じどう")}の{F("画面","がめん")}では「しめきりを すぎた」と{F("出","で")}ます。</p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <div id="homework-mode" className="text-sm font-black text-[var(--text)]">やること</div>
                  <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="homework-mode">
                    <Choice active={mode === 'practice'} onClick={() => setMode('practice')}>{F("練習","れんしゅう")}</Choice>
                    <Choice active={mode === 'test'} onClick={() => setMode('test')}>テスト</Choice>
                  </div>
                  <p className="text-xs font-bold text-[var(--text-muted)]">
                    {mode === 'practice'
                      ? <>ドリルの{F("字","じ")}を ぜんぶ {F("練習","れんしゅう")}したら「できた」になります。</>
                      : <>テストの{F("点","てん")}が {F("合格","ごうかく")}の めやす{F("以上","いじょう")}になったら「できた」になります。</>}
                  </p>
                </div>

                {mode === 'test' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <div id="homework-count" className="text-sm font-black text-[var(--text)]">テストの{F("問題数","もんだいすう")}</div>
                      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="homework-count">
                        {countOptions.map(n => (
                          <Choice key={n} active={count === n} onClick={() => setCount(n)} className="min-w-[72px] px-3">
                            {n === 0 ? <>ぜんぶ<span className="text-xs">（{kanjiCount}）</span></> : <>{n}{F("問","もん")}</>}
                          </Choice>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div id="homework-pass" className="text-sm font-black text-[var(--text)]">{F("合格","ごうかく")}の めやす（{F("正","せい")}かいの わりあい）</div>
                      <div className="grid grid-cols-5 gap-2" role="group" aria-labelledby="homework-pass">
                        {PASS_OPTIONS.map(p => (
                          <Choice key={p} active={pass === p} onClick={() => setPass(p)}>{p}%</Choice>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {homeworkInvalid && (
                  <p role="alert" className="text-sm font-bold text-rose-700">しめきりの{F("日","ひ")}を えらんでください。</p>
                )}
                <p className="text-xs font-bold text-[var(--text-muted)] bg-[var(--bg)] rounded-xl px-3 py-2">
                  サーバーが ないので、{F("児童","じどう")}の{F("結果","けっか")}は {F("先生","せんせい")}の{F("端末","たんまつ")}には とどきません。
                  {F("児童","じどう")}は おわったあとの{F("画面","がめん")}の「{F("先生","せんせい")}に{F("見","み")}せる」で、ドリルの{F("名前","なまえ")}・{F("点数","てんすう")}・できた{F("日","ひ")}を{F("見","み")}せます。
                </p>
              </>
            )}
          </div>

          <ShareLinkPanel shareUrl={shareUrl} title={title} label={homework ? '宿題のURL' : 'ドリルのURL'} />

          <div className="bg-[var(--bg)] border-[3px] border-[var(--text)] rounded-xl p-4 flex flex-col gap-1 text-sm text-[var(--text)] opacity-70">
            <p className="font-black opacity-100">リンクについて</p>
            <p>・ドリルの{F("中身","なかみ")}（{F("宿題","しゅくだい")}の{F("決","き")}まりも）はURLの中に{F("入","はい")}っています。サーバーに{F("保存","ほぞん")}されません。</p>
            <p>・リンクを{F("開","ひら")}くと、そのままマイドリルに{F("保存","ほぞん")}できます。アプリを{F("入","い")}れなおす{F("必要","ひつよう")}はありません。</p>
            <p>・あとからドリルを{F("直","なお")}しても、{F("配","くば")}ったリンクは{F("変","か")}わりません。新しいリンクを{F("配","くば")}りなおしてください。</p>
          </div>

          <MotionButton variant="secondary" onClick={sendByNumber} disabled={homeworkInvalid} className="w-full py-3 border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)] text-sm min-h-[48px]">
            4けたのすうじで{F("送","おく")}る（{F("同","おな")}じ{F("教室","きょうしつ")}のとき）
          </MotionButton>
        </>
      )}
    </div>
  );
};

export default DrillShareView;
