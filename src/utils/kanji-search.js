/**
 * 図鑑の検索。React に依存しない純粋な関数。
 *
 * 音読みはカタカナ（イチ）、訓読みは送りがなを ( ) や - で区切って（ひと(つ)・ひと-）
 * 持っている。Chromebook の IME ではふつうひらがなで打つので、以前の
 * 「音読みに toUpperCase をかけて比べる」だけでは「いち」「さん」「ひとつ」「まなぶ」が
 * 見つからなかった。入力も読みも「ひらがな・記号なし」にそろえてから比べる。
 */

/** カタカナ → ひらがな（ー などはそのまま） */
export function toHiragana(text) {
  return String(text ?? '').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/** 読みの区切り記号と空白を取りのぞく（ひと(つ) → ひとつ、ひと- → ひと） */
export function stripReadingMarks(text) {
  return String(text ?? '').replace(/[()（）.．\-－‐・\s　]/g, '');
}

/** 読みを比べられる形にする */
export function normalizeReading(text) {
  return toHiragana(stripReadingMarks(text));
}

/**
 * その字が検索に当てはまるか。
 * @param {{ char: string, on?: string[], kun?: string[] }} kanji
 * @param {string} query - 入力（字・ひらがな・カタカナ）
 */
export function matchesKanjiQuery(kanji, query) {
  const q = String(query ?? '').trim();
  if (!q) return true;
  if (kanji.char && q.includes(kanji.char)) return true;
  const reading = normalizeReading(q);
  if (!reading) return false;
  return [...(kanji.on || []), ...(kanji.kun || [])].some((r) => normalizeReading(r).includes(reading));
}

/** 学年（0 はすべて）と入力で、字の一覧をしぼる */
export function filterKanji(list, { query = '', grade = 0 } = {}) {
  return list.filter((k) => (grade === 0 || k.grade === grade) && matchesKanjiQuery(k, query));
}

// ── 字えらびの画面の さがし方（ドリルを作る・ならった範囲を配る） ──
//
// 前は 学年タブと、その学年の字を ぜんぶ ならべた一覧だけだった（3 年は 200 字）。ならびも 画数の順に
// なっていない所があり、目当ての字を 目で さがすしかなかった。ここでは 4 通りの さがし方をする:
//   字を ならべる … 「山川田」→ 山・川・田（打った順。学年・画数の しぼりこみは見ない）。教科書の単元の字を そのまま打てる
//   読み         … 「やま」「コウ」→ 読みが合う字（ぴったり → はじまりが同じ → とちゅうに ふくむ の順）
//   数字         … 「5」「5画」「5かく」→ 5 画の字
//   何も打たない … 学年と画数で しぼった字を、画数の順に

import { strokeCountOf } from '../data/kanji-strokes.js';

/** 全角の数字・英字を半角にする（NFKC。「５画」→「5画」） */
const toHalfWidth = (text) => String(text ?? '').normalize('NFKC');
/** 漢字 1 字か（々 などの記号は ふくめない） */
const isKanjiChar = (char) => /[㐀-鿿豈-﫿]/u.test(char);

/** 字ごとの、比べる読み（1 回だけ作る）。音読みは ひらがなに、訓読みは「ひとつ」と 送りがなの前の「ひと」の両方 */
const readingCache = new WeakMap();
function readingsOf(kanji) {
  let list = readingCache.get(kanji);
  if (!list) {
    list = [];
    for (const text of kanji.on || []) list.push({ text, kind: 'on', forms: [normalizeReading(text)] });
    for (const text of kanji.kun || []) {
      const full = normalizeReading(text);
      const stem = normalizeReading(String(text).split(/[(（.．]/)[0]);
      list.push({ text, kind: 'kun', forms: stem && stem !== full ? [full, stem] : [full] });
    }
    readingCache.set(kanji, list);
  }
  return list;
}

/** 読みの合い方。0: ぴったり  1: はじまりが同じ  2: とちゅうに ふくむ（2 字以上 打ったときだけ）  -1: 合わない */
function readingRank(kanji, reading) {
  let best = -1;
  let hit = null;
  for (const entry of readingsOf(kanji)) {
    for (const form of entry.forms) {
      const rank = form === reading ? 0 : form.startsWith(reading) ? 1 : reading.length >= 2 && form.includes(reading) ? 2 : -1;
      if (rank >= 0 && (best < 0 || rank < best)) { best = rank; hit = { text: entry.text, kind: entry.kind }; }
    }
  }
  return { rank: best, hit };
}

/**
 * 字えらびの画面で、字を さがす。
 * @param {Array<{ id: string, char: string, grade: number, on?: string[], kun?: string[] }>} list 字の一覧（KANJI_DATA）
 * @param {{ query?: string, grade?: number, strokes?: number }} [options] grade・strokes は 0 で「すべて」
 * @returns {{
 *   mode: 'browse'|'chars'|'reading'|'strokes',
 *   items: Array<{ kanji: object, strokes: number, hit?: { text: string, kind: 'on'|'kun' } }>,
 *   unknown: string[],   // 打った字のうち、小学校で習う字でないもの（字を ならべたとき）
 *   elsewhere: number,   // 学年・画数の しぼりこみで かくれている、合う字の数（読みで さがしたとき）
 *   strokes: number,     // 数字で さがしたときの画数（ほかは しぼりこみの画数）
 * }}
 */
export function findKanji(list, { query = '', grade = 0, strokes = 0 } = {}) {
  const text = toHalfWidth(query).trim();
  const inGrade = (kanji) => grade === 0 || kanji.grade === grade;
  const byStrokes = (a, b) => a.strokes - b.strokes;
  const withStrokes = (kanji) => ({ kanji, strokes: strokeCountOf(kanji.char) });

  // 数字: 画数で さがす（「5画」の「画」を 字として さがさないよう、字の検索より先に見る）
  const number = /^(\d{1,2})\s*(画|かく|カク)?$/.exec(text);
  if (number) {
    const count = Number(number[1]);
    const items = list.filter(inGrade).map(withStrokes).filter((item) => item.strokes === count);
    return { mode: 'strokes', items, unknown: [], elsewhere: 0, strokes: count };
  }

  // 字を ならべる: 打った順に、同じ字は 1 回だけ
  const typed = [...text].filter(isKanjiChar);
  if (typed.length > 0) {
    const byChar = new Map(list.map((kanji) => [kanji.char, kanji]));
    const seen = new Set();
    const items = [];
    const unknown = [];
    for (const char of typed) {
      if (seen.has(char)) continue;
      seen.add(char);
      const kanji = byChar.get(char);
      if (kanji) items.push(withStrokes(kanji));
      else unknown.push(char);
    }
    return { mode: 'chars', items, unknown, elsewhere: 0, strokes };
  }

  const reading = normalizeReading(text);
  if (!reading) {
    // 何も打っていない（記号だけも ここ）: 学年と画数で しぼり、画数の順に（同じ画数は もとの順）
    const items = list.filter(inGrade).map(withStrokes).filter((item) => strokes === 0 || item.strokes === strokes).sort(byStrokes);
    return { mode: 'browse', items, unknown: [], elsewhere: 0, strokes };
  }

  // 読み
  const ranked = [];
  let elsewhere = 0;
  for (const kanji of list) {
    const { rank, hit } = readingRank(kanji, reading);
    if (rank < 0) continue;
    const item = { ...withStrokes(kanji), hit, rank };
    if (!inGrade(kanji) || (strokes !== 0 && item.strokes !== strokes)) { elsewhere++; continue; }
    ranked.push(item);
  }
  ranked.sort((a, b) => a.rank - b.rank || a.kanji.grade - b.kanji.grade || a.strokes - b.strokes);
  return { mode: 'reading', items: ranked.map(({ rank: _rank, ...item }) => item), unknown: [], elsewhere, strokes };
}

/**
 * 画数の ボタンに出す数（その学年にある画数と、字の数）。
 * @returns {Array<{ strokes: number, count: number }>} 画数の小さい順
 */
export function strokeOptions(list, grade = 0) {
  const counts = new Map();
  for (const kanji of list) {
    if (grade !== 0 && kanji.grade !== grade) continue;
    const n = strokeCountOf(kanji.char);
    if (n > 0) counts.set(n, (counts.get(n) || 0) + 1);
  }
  return [...counts].sort((a, b) => a[0] - b[0]).map(([strokes, count]) => ({ strokes, count }));
}
