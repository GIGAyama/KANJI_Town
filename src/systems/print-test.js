/**
 * 印刷用の漢字テスト（マイドリル → 紙）の組み立て。React に依存しない純粋な関数だけを置く。
 *
 * 家に端末を持ち帰れない子にも、アプリで配ったのと同じ字・同じ例文で紙のテストを渡すためのもの。
 * 例文は毎日のテストと同じ選び方（prompt-example.js の pickPromptExample）で選ぶ。
 * 紙面は教室の漢字テストと同じ縦書きで、1 ページ 10 問。
 *
 * 問題は「トークン」の並びで持つ。画面の部品（PrintTestView）はトークンを
 * そのまま並べるだけにして、答えを出すか出さないかの判断はここ（sheetRuns）に集める。
 * 問題のページに答えが紛れこまないことを、テストで全 1026 字について確かめられるようにするため。
 */
import { pickPromptExample } from './prompt-example.js';

/** 種類: 書き取り（例文の対象字を□に）／読み（対象字のことばに傍線）／両方 */
export const PRINT_KINDS = Object.freeze(['write', 'read', 'both']);
/** 問題数: 10・20・ぜんぶ */
export const PRINT_COUNTS = Object.freeze([10, 20, 'all']);
/** 順番: ドリルの順／ばらばら */
export const PRINT_ORDERS = Object.freeze(['drill', 'shuffle']);
/** 1 ページに載せる問題の数（A4 縦・縦書きで 1 問 19mm の列が 10 本） */
export const QUESTIONS_PER_PAGE = 10;
/** ドリル名の上限（drill-share.js と同じ 40 字） */
export const MAX_DRILL_NAME_LENGTH = 40;

export const DEFAULT_PRINT_OPTIONS = Object.freeze({
  kind: 'write',
  count: 'all',
  order: 'drill',
  withAnswers: true,
});

const RUBY_SEGMENT = /([^\s（）]+?)（([^）]+)）/g;

/**
 * 「漢字（よみ）」の書き方の文を、ふつうの文字とルビ付きのことばに分ける。
 * 書き方は FormatKun.jsx の RubyText と同じ（同じ正規表現）。
 * @returns {Array<{text: string} | {base: string, reading: string}>}
 */
export function parseRubySegments(text) {
  if (typeof text !== 'string' || text === '') return [];
  const out = [];
  const pushText = (t) => {
    if (!t) return;
    const prev = out[out.length - 1];
    if (prev && 'text' in prev) prev.text += t;
    else out.push({ text: t });
  };
  let last = 0;
  for (const m of text.matchAll(RUBY_SEGMENT)) {
    pushText(text.slice(last, m.index));
    // 「供（ども）。提（てい）」のように句点のすぐあとにルビがあると、正規表現は句点まで
    // ことばに入れてしまう。読みが句点にかかることは無いので、前の文へ戻す
    // （紙面では傍線が句点にかかり、□の手がかりのルビもずれる）
    const lead = m[1].match(/^[\p{P}\p{S}]+/u)?.[0] || '';
    pushText(lead);
    if (lead.length < m[1].length) out.push({ base: m[1].slice(lead.length), reading: m[2] });
    else pushText(m[0].slice(lead.length));
    last = m.index + m[0].length;
  }
  pushText(text.slice(last));
  return out;
}

/** 文字列を「対象字」と「それ以外のまとまり」に分ける（サロゲートペアも 1 字として扱う） */
function splitByChar(text, char) {
  const parts = [];
  let run = '';
  for (const ch of Array.from(text)) {
    if (ch === char) {
      if (run) parts.push({ text: run });
      run = '';
      parts.push({ box: true });
    } else {
      run += ch;
    }
  }
  if (run) parts.push({ text: run });
  return parts;
}

/**
 * 例文が無い字のための読み（ふだんは使わない。全 1026 字に例文がある）。
 * 訓読みの「ひと(つ)」は、語幹を読み・かっこの中を送りがなにする。無ければ音読み。
 */
export function fallbackReading(kanji) {
  const kun = Array.isArray(kanji?.kun) ? kanji.kun.find((r) => typeof r === 'string' && r.replace(/-/g, '')) : null;
  if (kun) {
    const clean = kun.replace(/^-+|-+$/g, '');
    const m = clean.match(/^(.*?)\((.*?)\)$/);
    return m ? { reading: m[1], okurigana: m[2] } : { reading: clean, okurigana: '' };
  }
  const on = Array.isArray(kanji?.on) ? kanji.on.find((r) => typeof r === 'string' && r) : null;
  return { reading: on || '', okurigana: '' };
}

/**
 * 書き取りの問題のトークン。対象字はすべて□（box）にする（毎日のテストの◯と同じ。
 * 1 つでも字のまま残すと、それが答えになってしまう）。
 * 対象字を含むことばのルビは、何を書くかの手がかりなので残す。
 */
export function buildWriteTokens(example, char) {
  const tokens = [];
  for (const seg of parseRubySegments(example)) {
    if ('reading' in seg) {
      if (seg.base.includes(char)) tokens.push({ kind: 'write', parts: splitByChar(seg.base, char), reading: seg.reading });
      else tokens.push({ kind: 'ruby', base: seg.base, reading: seg.reading });
    } else {
      // ルビの無いところに対象字があれば、読みの無い□にする
      for (const part of splitByChar(seg.text, char)) {
        if (part.box) tokens.push({ kind: 'write', parts: [part], reading: '' });
        else tokens.push({ kind: 'text', text: part.text });
      }
    }
  }
  return tokens;
}

/**
 * 読みの問題のトークン。対象字を含むルビ付きのことばに傍線を引き、そのルビ（答え）は隠す。
 * ルビの無いところの対象字は、読みが分からないので問題にしない（字のまま出す）。
 */
export function buildReadTokens(example, char) {
  const tokens = [];
  for (const seg of parseRubySegments(example)) {
    if ('reading' in seg) {
      if (seg.base.includes(char)) tokens.push({ kind: 'read', base: seg.base, reading: seg.reading });
      else tokens.push({ kind: 'ruby', base: seg.base, reading: seg.reading });
    } else {
      tokens.push({ kind: 'text', text: seg.text });
    }
  }
  return tokens;
}

/**
 * 1 問を作る。
 * @param {{id: string, char: string, examples?: string[], on?: string[], kun?: string[]}} kanji
 * @param {'write'|'read'} type
 * @param {number} [variant] - pickPromptExample の何番目の候補を使うか
 */
export function buildQuestion(kanji, type, variant = 0) {
  let example = pickPromptExample(kanji, variant);
  let tokens = [];
  if (example) {
    tokens = type === 'read' ? buildReadTokens(example, kanji.char) : buildWriteTokens(example, kanji.char);
    // 問いになる所が 1 つも無い例文（読みの付いていない所にしか対象字が無いなど）は使わない
    if (!tokens.some((t) => t.kind === type)) example = null;
  }
  if (!example) {
    const { reading, okurigana } = fallbackReading(kanji);
    tokens = type === 'read'
      ? [{ kind: 'read', base: kanji.char + okurigana, reading: reading + okurigana }]
      : [{ kind: 'write', parts: [{ box: true }], reading }, ...(okurigana ? [{ kind: 'text', text: okurigana }] : [])];
  }
  const answers = type === 'read'
    ? tokens.filter((t) => t.kind === 'read').map((t) => t.reading)
    : [kanji.char];
  return { kanjiId: kanji.id, char: kanji.char, type, example, tokens, answers };
}

/**
 * 紙面に並べる「ひとかたまり」。showAnswers が false のとき、答え（書き取りの字・
 * 読みの問題のルビ）はどこにも入らない。部品はこれを順に描くだけにする。
 *   { type: 'text', text }
 *   { type: 'ruby', base, reading }                     ふつうのルビ（紙面では設定にかかわらず出す）
 *   { type: 'write', parts: [{text}|{box, answer}], reading }  □（answer は答えのページだけ字が入る）
 *   { type: 'read', base, answer }                      傍線（answer は答えのページだけ読みが入る）
 */
export function sheetRuns(question, showAnswers) {
  return question.tokens.map((t) => {
    if (t.kind === 'write') {
      return {
        type: 'write',
        reading: t.reading,
        parts: t.parts.map((p) => (p.box ? { box: true, answer: showAnswers ? question.char : null } : { text: p.text })),
      };
    }
    if (t.kind === 'read') return { type: 'read', base: t.base, answer: showAnswers ? t.reading : null };
    if (t.kind === 'ruby') return { type: 'ruby', base: t.base, reading: t.reading };
    return { type: 'text', text: t.text };
  });
}

/** 紙面のかたまりを、目で見える文字だけの 1 行にする（テストと読み上げ用） */
export function runsToPlainText(runs) {
  return runs.map((r) => {
    if (r.type === 'write') {
      const base = r.parts.map((p) => (p.box ? (p.answer || '□') : p.text)).join('');
      return r.reading ? `${base}（${r.reading}）` : base;
    }
    if (r.type === 'read') return r.answer ? `${r.base}（${r.answer}）` : r.base;
    if (r.type === 'ruby') return `${r.base}（${r.reading}）`;
    return r.text;
  }).join('');
}

/** ドリル名を紙に載せる形にする（文字列以外は空、制御文字を消し、40 字まで） */
export function sanitizeDrillName(name) {
  if (typeof name !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const clean = name.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return Array.from(clean).slice(0, MAX_DRILL_NAME_LENGTH).join('');
}

/**
 * ドリルの漢字 ID を、知っている字だけ・重ならないように・ドリルの順で字のデータにする。
 * @param {unknown} kanjiIds
 * @param {Array<{id: string}>} kanjiList - KANJI_DATA
 */
export function resolveDrillKanji(kanjiIds, kanjiList) {
  if (!Array.isArray(kanjiIds) || !Array.isArray(kanjiList)) return [];
  const byId = new Map(kanjiList.map((k) => [k.id, k]));
  const seen = new Set();
  const out = [];
  for (const id of kanjiIds) {
    if (typeof id !== 'string' || seen.has(id)) continue;
    const kanji = byId.get(id);
    if (!kanji) continue;
    seen.add(id);
    out.push(kanji);
  }
  return out;
}

/** 種の決まった乱数（mulberry32）。同じ種なら、画面の見本と印刷と答えが同じ並びになる */
export function createRng(seed) {
  let a = (Number(seed) >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed(items, seed) {
  const out = [...items];
  const rand = createRng(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 問題数の選択肢。ドリルの字数より少ないものだけと「ぜんぶ」。
 * 例: 8 字 → ['all']、15 字 → [10, 'all']、25 字 → [10, 20, 'all']
 */
export function countOptions(total) {
  const n = Math.max(0, Math.floor(Number(total) || 0));
  return [...PRINT_COUNTS.filter((c) => typeof c === 'number' && c < n), 'all'];
}

/** 画面の選択を、知っている値だけにそろえる（字数より多い問題数は「ぜんぶ」にする） */
export function normalizePrintOptions(options, total) {
  const o = options && typeof options === 'object' ? options : {};
  const kind = PRINT_KINDS.includes(o.kind) ? o.kind : DEFAULT_PRINT_OPTIONS.kind;
  const order = PRINT_ORDERS.includes(o.order) ? o.order : DEFAULT_PRINT_OPTIONS.order;
  const count = countOptions(total).includes(o.count) ? o.count : 'all';
  const withAnswers = typeof o.withAnswers === 'boolean' ? o.withAnswers : DEFAULT_PRINT_OPTIONS.withAnswers;
  const seed = Number.isFinite(Number(o.seed)) ? (Number(o.seed) >>> 0) : 1;
  return { kind, count, order, withAnswers, seed };
}

/**
 * 出す字を選んで並べる。
 * - ドリルの順: ドリルの初めから count 字
 * - ばらばら: 種で混ぜてから count 字
 */
export function selectKanji(kanjis, { count = 'all', order = 'drill', seed = 1 } = {}) {
  const list = Array.isArray(kanjis) ? kanjis : [];
  const ordered = order === 'shuffle' ? shuffleWithSeed(list, seed) : [...list];
  return typeof count === 'number' ? ordered.slice(0, count) : ordered;
}

/** 決まった数ずつに分ける */
export function paginate(items, perPage = QUESTIONS_PER_PAGE) {
  const size = Math.max(1, Math.floor(perPage) || 1);
  const pages = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

/**
 * 印刷するテストをまるごと組み立てる。
 *
 * 「両方」は、読みのページのあとに書き取りのページを改ページして続ける。
 * 同じ紙に同じ字の読みと書き取りが並ぶと、読みの問題の字が書き取りの答えになるので、
 * 書き取りは別のページにし、例文もなるべく別のもの（2 番目の候補）を読みに使う。
 * ばらばらのときは、書き取りの並びも読みとは別に混ぜる。
 *
 * @param {{drill: {name?: string, kanjis?: string[]}, kanjiList: object[], options?: object, perPage?: number}} args
 * @returns {{
 *   title: string, total: number, options: object,
 *   sections: Array<{type: 'write'|'read', questions: object[]}>,
 *   pages: Array<{key: string, type: 'write'|'read', answer: boolean, index: number, count: number, questions: object[]}>,
 *   questionPageCount: number, answerPageCount: number,
 * }}
 */
export function buildPrintTest({ drill, kanjiList, options, perPage = QUESTIONS_PER_PAGE } = {}) {
  const all = resolveDrillKanji(drill?.kanjis, kanjiList);
  const opts = normalizePrintOptions(options, all.length);
  const title = sanitizeDrillName(drill?.name);
  const types = opts.kind === 'both' ? ['read', 'write'] : [opts.kind];

  const sections = types.map((type) => {
    // 両方のときは、書き取りの並びを読みとは別の種で混ぜる
    const seed = opts.kind === 'both' && type === 'write' ? opts.seed + 1 : opts.seed;
    const picked = opts.kind === 'both' && type === 'write' && opts.order === 'shuffle'
      ? shuffleWithSeed(selectKanji(all, { ...opts, seed: opts.seed }), seed)
      : selectKanji(all, opts);
    const variant = opts.kind === 'both' && type === 'read' ? 1 : 0;
    const questions = picked.map((kanji, i) => ({ ...buildQuestion(kanji, type, variant), number: i + 1 }));
    return { type, questions };
  });

  const questionPages = [];
  for (const section of sections) {
    const chunks = paginate(section.questions, perPage);
    chunks.forEach((questions, i) => {
      questionPages.push({ type: section.type, answer: false, index: i + 1, count: chunks.length, questions });
    });
  }
  const answerPages = opts.withAnswers ? questionPages.map((p) => ({ ...p, answer: true })) : [];
  const pages = [...questionPages, ...answerPages].map((p, i) => ({ ...p, key: `${p.answer ? 'a' : 'q'}-${p.type}-${p.index}-${i}` }));

  return {
    title,
    total: all.length,
    options: opts,
    sections,
    pages,
    questionPageCount: questionPages.length,
    answerPageCount: answerPages.length,
  };
}
