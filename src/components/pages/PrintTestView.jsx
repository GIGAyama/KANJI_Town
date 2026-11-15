import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Printer, Shuffle } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { F } from '../ui/FormatKun';
import { KANJI_DATA } from '../../data/kanji-data';
import { audioCtrl } from '../../systems/audio';
import {
  DEFAULT_PRINT_OPTIONS,
  QUESTIONS_PER_PAGE,
  buildPrintTest,
  countOptions,
  parseRubySegments,
  resolveDrillKanji,
  sheetRuns,
} from '../../systems/print-test';

/*
 * 印刷用の漢字テスト（先生向け）。マイドリルから、紙で配る漢字テストを作って印刷する。
 *
 * 紙面（.pt-sheet）は 2 か所に描く。
 *   ・画面の見本: A4 の紙の形のまま、画面の幅に合わせて縮めて見せる
 *   ・印刷するもの: body の直下（#root の外）に置き、印刷のときだけ出す
 * アプリの画面は framer-motion の transform と overflow: hidden の入れ子の中にあり、
 * そのまま印刷すると縦書きの列や改ページが崩れる。印刷のときは #root ごと隠して、
 * 外に置いた紙面だけを出す（index.css の html.print-test-mode）。
 */

/** A4 の紙の大きさ（CSS の px。96px = 1in = 25.4mm） */
const MM = 96 / 25.4;
const PAPER_W = 210 * MM;
const PAPER_H = 297 * MM;

/**
 * 画面の見本に並べる紙の上限。1026 字ぜんぶのドリルだと 400 枚を超えるので、
 * 多いときは問題のはじめの 4 枚と答えのはじめの 2 枚だけを見せる（印刷はぜんぶ刷る）。
 */
const PREVIEW_LIMIT = 12;
const previewPagesOf = (pages) => (pages.length <= PREVIEW_LIMIT
  ? pages
  : [...pages.filter((p) => !p.answer).slice(0, 4), ...pages.filter((p) => p.answer).slice(0, 2)]);

const newSeed = () => (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;

/** 紙面の文。ルビは設定にかかわらず出す（紙は設定を持ち帰れない） */
const PaperRuby = ({ text }) => parseRubySegments(text).map((seg, i) => (
  'reading' in seg
    ? <ruby key={i}>{seg.base}<rt>{seg.reading}</rt></ruby>
    : <React.Fragment key={i}>{seg.text}</React.Fragment>
));

const KIND_LABEL = { write: '書（か）き取（と）り', read: '読（よ）み' };
const INSTRUCTION = {
  write: '□に あてはまる 漢字（かんじ）を 書（か）きましょう。',
  read: '――の ことばの 読（よ）みを、ひらがなで 右（みぎ）がわに 書（か）きましょう。',
};

/** 1 問の例文。答えを出すかどうかは sheetRuns が決めてある */
const QuestionLine = ({ question, answer }) => sheetRuns(question, answer).map((run, i) => {
  if (run.type === 'ruby') return <ruby key={i}>{run.base}<rt>{run.reading}</rt></ruby>;
  if (run.type === 'write') {
    const base = run.parts.map((part, j) => (part.box
      ? <span key={j} className="pt-box">{part.answer || '　'}</span>
      : <React.Fragment key={j}>{part.text}</React.Fragment>));
    return run.reading
      ? <ruby key={i} className="pt-write">{base}<rt>{run.reading}</rt></ruby>
      : <span key={i} className="pt-write">{base}</span>;
  }
  if (run.type === 'read') {
    return (
      <span key={i} className="pt-read">
        {run.base}
        {run.answer && <span className="pt-read-ans">{run.answer}</span>}
      </span>
    );
  }
  return <React.Fragment key={i}>{run.text}</React.Fragment>;
});

/** A4 1 ページぶんの紙面 */
const PrintSheet = ({ page, title }) => {
  const slots = Array.from({ length: QUESTIONS_PER_PAGE }, (_, i) => page.questions[i] || null);
  return (
    <section className={`pt-sheet pt-sheet-${page.type}${page.answer ? ' pt-sheet-answer' : ''}`}>
      <header className="pt-head">
        <div className="pt-head-row">
          <div className="pt-title">
            <PaperRuby text="漢字（かんじ）テスト" />
            <span className="pt-kind">（<PaperRuby text={KIND_LABEL[page.type]} />）</span>
            {page.answer && <span className="pt-answer-mark">こたえ</span>}
          </div>
          <div className="pt-page-no">{page.index} / {page.count}</div>
        </div>
        <div className="pt-head-row">
          <div className="pt-drill">{title}</div>
          {!page.answer && (
            <div className="pt-fields">
              <span className="pt-field"><span className="pt-blank pt-blank-s" /><PaperRuby text="月（がつ）" /><span className="pt-blank pt-blank-s" /><PaperRuby text="日（にち）" /></span>
              <span className="pt-field">なまえ<span className="pt-blank pt-blank-l" /></span>
            </div>
          )}
        </div>
        <p className="pt-instruction"><PaperRuby text={INSTRUCTION[page.type]} /></p>
      </header>
      <ol className="pt-grid">
        {slots.map((question, i) => (
          <li key={question ? question.kanjiId : `empty-${i}`} className="pt-q">
            {question && (
              <>
                <span className="pt-no">{question.number}</span>
                <span className="pt-line"><QuestionLine question={question} answer={page.answer} /></span>
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
};

/** 見本を並べる場所の幅に合わせて、紙を何倍に縮めて何列に並べるかを決める */
function usePreviewLayout(ref) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(el.clientWidth);
    update();
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [ref]);
  const gap = 16;
  const columns = width >= 760 ? 2 : 1;
  const scale = width > 0 ? Math.min(0.75, (width - gap * (columns - 1)) / columns / PAPER_W) : 0.4;
  return { scale, gap };
}

/** 選ぶボタンの並び（押されているものが分かるように aria-pressed を付ける） */
const Choice = ({ id, legend, options, value, onChange }) => (
  <div role="group" aria-labelledby={id} className="flex flex-col gap-2">
    <div id={id} className="text-sm font-black text-[var(--text)]">{legend}</div>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={selected}
            onClick={() => { audioCtrl.playSE('click'); onChange(option.value); }}
            className={`min-h-[48px] px-4 rounded-xl border-[3px] border-[var(--text)] font-black text-sm transition-colors ${selected ? 'bg-[var(--primary)] text-[var(--panel)]' : 'bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--bg)]'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  </div>
);

const PrintTestView = ({ setView, drill }) => {
  const [options, setOptions] = useState(() => ({ ...DEFAULT_PRINT_OPTIONS, seed: newSeed() }));
  const previewRef = useRef(null);
  const { scale, gap } = usePreviewLayout(previewRef);

  const total = useMemo(() => resolveDrillKanji(drill?.kanjis, KANJI_DATA).length, [drill]);
  const test = useMemo(() => buildPrintTest({ drill, kanjiList: KANJI_DATA, options }), [drill, options]);
  const counts = countOptions(total);

  const update = (patch) => setOptions((prev) => ({ ...prev, ...patch }));

  // 印刷のときだけ、#root を隠して外に置いた紙面を出す（index.css）
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('print-test-mode');
    return () => root.classList.remove('print-test-mode');
  }, []);

  // 「PDF に保存」の名前は document.title になる。刷るあいだだけ、ドリル名の入った名前にする
  const printTitle = `${test.title || 'マイドリル'} 漢字テスト`;
  useEffect(() => {
    let saved = null;
    const before = () => { saved = document.title; document.title = printTitle; };
    const after = () => { if (saved !== null) document.title = saved; saved = null; };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      after();
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, [printTitle]);

  // 書体を読み終わる前に印刷すると、端末の書体で刷られて字の形が変わる。
  // 刷るほうの紙面は画面では隠れていて、書体の面（unicode-range ごとのファイル）が
  // 読みこまれないことがあるので、紙面の字を渡して先に読んでおく（同梱のファイルだけ）。
  const printRootRef = useRef(null);
  const loadPrintFonts = useCallback(() => {
    const text = printRootRef.current?.textContent || '';
    if (!text || typeof document.fonts?.load !== 'function') return Promise.resolve();
    const faces = ['600 16px "Klee One"', '500 16px "Zen Maru Gothic"', '700 16px "Zen Maru Gothic"'];
    return Promise.all(faces.map((face) => document.fonts.load(face, text).catch(() => []))).then(() => undefined);
  }, []);
  useEffect(() => { loadPrintFonts(); }, [test, loadPrintFonts]);

  const handlePrint = useCallback(() => {
    const go = () => window.print();
    loadPrintFonts().then(go, go);
  }, [loadPrintFonts]);

  const goBack = () => { audioCtrl.playSE('click'); setView('myDrills'); };

  const header = (
    <div className="flex items-center gap-3">
      <button onClick={goBack} aria-label="マイドリルに戻る" className="text-[var(--text-muted)] hover:text-[var(--text)] p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[48px] min-h-[48px] flex items-center justify-center">
        <ArrowLeft size={24} />
      </button>
      <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2">
        <Printer size={22} className="text-[var(--secondary)] shrink-0" /> <span>プリント（{F("先生","せんせい")}{F("向","む")}け）</span>
      </h2>
    </div>
  );

  if (!drill || total === 0) {
    return (
      <div className="flex flex-col gap-4 pb-8">
        {header}
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-8 text-center shadow-sm">
          <div className="text-4xl mb-3" aria-hidden="true">🖨️</div>
          <p className="font-bold text-[var(--text)]">プリントにできる{F("字","じ")}がありません</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">マイドリルからもう{F("一度","いちど")}えらんでください</p>
        </div>
        <MotionButton variant="secondary" onClick={() => setView('myDrills')} className="w-full py-3 min-h-[48px] border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)]">もどる</MotionButton>
      </div>
    );
  }

  const opts = test.options;
  const previewPages = previewPagesOf(test.pages);
  const perKind = opts.count === 'all' ? total : opts.count;

  return (
    <div className="flex flex-col gap-4 pb-8">
      {header}

      <div className="flex flex-col md:grid md:grid-cols-[minmax(280px,340px)_1fr] gap-4 md:items-start">
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)] flex flex-col gap-4 md:sticky md:top-0">
          <div>
            <div className="font-black text-[var(--text)] text-lg break-all">{test.title || 'マイドリル'}</div>
            <div className="text-sm text-[var(--text-muted)]">{total}{F("文字","もじ")}</div>
          </div>

          <Choice
            id="pt-kind"
            legend={<>{F("種類","しゅるい")}</>}
            value={opts.kind}
            onChange={(kind) => update({ kind })}
            options={[
              { value: 'write', label: <>{F("書","か")}き{F("取","と")}り</> },
              { value: 'read', label: <>{F("読","よ")}み</> },
              { value: 'both', label: <>{F("両方","りょうほう")}</> },
            ]}
          />
          <Choice
            id="pt-count"
            legend={<>{F("問題","もんだい")}の{F("数","かず")}{opts.kind === 'both' ? <>（{F("読","よ")}み・{F("書","か")}き{F("取","と")}りそれぞれ）</> : null}</>}
            value={opts.count}
            onChange={(count) => update({ count })}
            options={counts.map((c) => (c === 'all'
              ? { value: 'all', label: <>ぜんぶ（{total}{F("問","もん")}）</> }
              : { value: c, label: <>{c}{F("問","もん")}</> }))}
          />
          <Choice
            id="pt-order"
            legend={<>{F("順番","じゅんばん")}</>}
            value={opts.order}
            onChange={(order) => update(order === 'shuffle' ? { order, seed: newSeed() } : { order })}
            options={[
              { value: 'drill', label: <>ドリルの{F("順","じゅん")}</> },
              { value: 'shuffle', label: <>ばらばら</> },
            ]}
          />
          {opts.order === 'shuffle' && (
            <button
              type="button"
              onClick={() => { audioCtrl.playSE('click'); update({ seed: newSeed() }); }}
              className="-mt-2 self-start min-h-[48px] px-4 rounded-xl border-[3px] border-dashed border-[var(--text)] bg-[var(--panel)] text-[var(--text)] font-bold text-sm flex items-center gap-2 hover:bg-[var(--bg)]"
            >
              <Shuffle size={16} aria-hidden="true" /> <span>{F("並","なら")}べなおす</span>
            </button>
          )}
          <Choice
            id="pt-answers"
            legend={<>{F("答","こた")}えのページ</>}
            value={opts.withAnswers}
            onChange={(withAnswers) => update({ withAnswers })}
            options={[
              { value: true, label: <>つける</> },
              { value: false, label: <>つけない</> },
            ]}
          />

          <p className="text-sm font-bold text-[var(--text)]" aria-live="polite">
            A4たて {test.questionPageCount}まい
            {test.answerPageCount > 0 && <>＋{F("答","こた")}え {test.answerPageCount}まい</>}
            （{perKind}{F("問","もん")}{opts.kind === 'both' ? '×2' : ''}）
          </p>

          <MotionButton variant="primary" onClick={handlePrint} className="w-full py-3 min-h-[52px] text-base font-black border-[3px] border-[var(--text)] shadow-[0_3px_0_#9f1239]">
            <Printer size={20} aria-hidden="true" /> <span>{F("印刷","いんさつ")}する</span>
          </MotionButton>
          <MotionButton variant="secondary" onClick={() => setView('myDrills')} className="w-full py-3 min-h-[48px] border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)]">
            もどる
          </MotionButton>

          <div className="text-xs text-[var(--text-muted)] flex flex-col gap-1">
            <p>・{F("印刷","いんさつ")}の{F("画面","がめん")}で、{F("用紙","ようし")}を A4・{F("縦","たて")}、{F("倍率","ばいりつ")}を 100%（{F("既定","きてい")}）にしてください。</p>
            <p>・「ヘッダーとフッター」はオフにすると、{F("紙","かみ")}にアドレスが{F("出","で")}ません。</p>
            <p>・{F("名前","なまえ")}は{F("紙","かみ")}に{F("手","て")}で{F("書","か")}きます。アプリは{F("名前","なまえ")}を{F("保存","ほぞん")}しません。</p>
          </div>
        </div>

        <div ref={previewRef} className="min-w-0 flex flex-col gap-3" role="region" aria-label="印刷の見本">
          {previewPages.length < test.pages.length && (
            <p className="text-sm font-bold text-[var(--text-muted)]">
              {F("見本","みほん")}は{previewPages.length}まいだけです。{F("印刷","いんさつ")}では ぜんぶ（{test.pages.length}まい）{F("刷","す")}ります。
            </p>
          )}
          <div className="flex flex-wrap" style={{ gap }}>
            {previewPages.map((page) => (
              <div key={page.key} className="pt-paper-frame" style={{ width: PAPER_W * scale, height: PAPER_H * scale }}>
                <div className="pt-paper" style={{ transform: `scale(${scale})` }}>
                  <PrintSheet page={page} title={test.title} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {createPortal(
        <div ref={printRootRef} className="pt-print-root" aria-hidden="true">
          {test.pages.map((page) => <PrintSheet key={page.key} page={page} title={test.title} />)}
        </div>,
        document.body,
      )}
    </div>
  );
};

export default PrintTestView;
