import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { KANJI_DATA } from '../src/data/kanji-data.js';
import { pickPromptExample } from '../src/systems/prompt-example.js';
import {
  QUESTIONS_PER_PAGE,
  buildPrintTest,
  buildQuestion,
  buildReadTokens,
  buildWriteTokens,
  countOptions,
  normalizePrintOptions,
  paginate,
  parseRubySegments,
  resolveDrillKanji,
  runsToPlainText,
  sanitizeDrillName,
  selectKanji,
  sheetRuns,
  shuffleWithSeed,
} from '../src/systems/print-test.js';

const byChar = (char) => KANJI_DATA.find((k) => k.char === char);
const drillOf = (chars, name = '1年のふくしゅう') => ({ name, kanjis: chars.map((c) => byChar(c).id) });
const GRADE1 = KANJI_DATA.filter((k) => k.grade === 1);

test('「漢字（よみ）」の文を、ふつうの文字とルビ付きのことばに分ける', () => {
  assert.deepEqual(parseRubySegments('一人（ひとり）で 一りん車（いちりんしゃ）に 乗（の）る。'), [
    { base: '一人', reading: 'ひとり' },
    { text: 'で ' },
    { base: '一りん車', reading: 'いちりんしゃ' },
    { text: 'に ' },
    { base: '乗', reading: 'の' },
    { text: 'る。' },
  ]);
  assert.deepEqual(parseRubySegments(''), []);
  assert.deepEqual(parseRubySegments(null), []);
});

test('書き取り: 対象字を□にして、そのことばの読みを手がかりに残す', () => {
  assert.deepEqual(buildWriteTokens('山（やま）に のぼる。', '山'), [
    { kind: 'write', parts: [{ box: true }], reading: 'やま' },
    { kind: 'text', text: 'に のぼる。' },
  ]);
  assert.deepEqual(buildWriteTokens('火山（かざん）。', '山'), [
    { kind: 'write', parts: [{ text: '火' }, { box: true }], reading: 'かざん' },
    { kind: 'text', text: '。' },
  ]);
});

test('書き取り: 対象字が2か所にあれば、どちらも□にする（1つでも残すと答えになる）', () => {
  const tokens = buildWriteTokens('一人（ひとり）で 一りん車（いちりんしゃ）に 乗（の）る。', '一');
  const boxes = tokens.filter((t) => t.kind === 'write');
  assert.equal(boxes.length, 2);
  assert.deepEqual(boxes[1], { kind: 'write', parts: [{ box: true }, { text: 'りん車' }], reading: 'いちりんしゃ' });
  // ルビの無い所の対象字も□にする（読みは付けられない）
  assert.deepEqual(buildWriteTokens('三人の 子（こ）。人（ひと）が いる。', '人')[0], { kind: 'text', text: '三' });
  assert.deepEqual(buildWriteTokens('三人の 子（こ）。', '人')[1], { kind: 'write', parts: [{ box: true }], reading: '' });
});

test('読み: 対象字を含むことばに傍線を引き、その読みが答えになる', () => {
  assert.deepEqual(buildReadTokens('一人（ひとり）で 一りん車（いちりんしゃ）に 乗（の）る。', '一'), [
    { kind: 'read', base: '一人', reading: 'ひとり' },
    { kind: 'text', text: 'で ' },
    { kind: 'read', base: '一りん車', reading: 'いちりんしゃ' },
    { kind: 'text', text: 'に ' },
    { kind: 'ruby', base: '乗', reading: 'の' },
    { kind: 'text', text: 'る。' },
  ]);
  const q = buildQuestion(byChar('一'), 'read');
  assert.deepEqual(q.answers, ['ひとり', 'いちりんしゃ']);
});

test('例文は毎日のテストと同じ選び方（pickPromptExample）で選ぶ', () => {
  for (const kanji of GRADE1) {
    assert.equal(buildQuestion(kanji, 'write').example, pickPromptExample(kanji, 0));
    assert.equal(buildQuestion(kanji, 'read', 1).example, pickPromptExample(kanji, 1));
  }
});

test('全1026字で、問題のページに答えが出ない（書き取りの字・読みの問題のルビ）', () => {
  for (const kanji of KANJI_DATA) {
    const write = buildQuestion(kanji, 'write');
    const writeText = runsToPlainText(sheetRuns(write, false));
    assert.ok(!writeText.includes(kanji.char), `${kanji.char}: ${writeText}`);
    assert.ok(writeText.includes('□'), `${kanji.char}: □が無い`);
    // 答えのページには字が入る
    assert.ok(runsToPlainText(sheetRuns(write, true)).includes(kanji.char));

    const read = buildQuestion(kanji, 'read');
    const readRuns = sheetRuns(read, false);
    assert.ok(readRuns.some((r) => r.type === 'read'), `${kanji.char}: 傍線の所が無い`);
    assert.ok(readRuns.filter((r) => r.type === 'read').every((r) => r.answer === null));
    assert.deepEqual(sheetRuns(read, true).filter((r) => r.type === 'read').map((r) => r.answer), read.answers);
  }
});

test('例文が無い字は、読みの手がかりだけの問題にする', () => {
  const kanji = { id: 'x', char: '山', on: ['サン'], kun: ['やま'], examples: [] };
  assert.equal(runsToPlainText(sheetRuns(buildQuestion(kanji, 'write'), false)), '□（やま）');
  assert.equal(runsToPlainText(sheetRuns(buildQuestion(kanji, 'read'), true)), '山（やま）');
  const okuri = { id: 'y', char: '一', on: ['イチ'], kun: ['ひと(つ)'], examples: ['いち。'] };
  assert.equal(runsToPlainText(sheetRuns(buildQuestion(okuri, 'write'), false)), '□（ひと）つ');
  assert.deepEqual(buildQuestion(okuri, 'read').answers, ['ひとつ']);
  assert.deepEqual(buildQuestion({ id: 'z', char: '円', on: ['エン'], kun: [] }, 'read').answers, ['エン']);
});

test('ドリルの字は、知っている字だけ・重ならずに・ドリルの順で使う', () => {
  const ids = [byChar('山').id, 'k9_999', byChar('川').id, byChar('山').id, 42, null];
  assert.deepEqual(resolveDrillKanji(ids, KANJI_DATA).map((k) => k.char), ['山', '川']);
  assert.deepEqual(resolveDrillKanji('k1_1', KANJI_DATA), []);
  assert.deepEqual(resolveDrillKanji(undefined, KANJI_DATA), []);
});

test('問題数の選択肢は、ドリルの字数より少ないものと「ぜんぶ」', () => {
  assert.deepEqual(countOptions(0), ['all']);
  assert.deepEqual(countOptions(8), ['all']);
  assert.deepEqual(countOptions(10), ['all']);
  assert.deepEqual(countOptions(15), [10, 'all']);
  assert.deepEqual(countOptions(20), [10, 'all']);
  assert.deepEqual(countOptions(25), [10, 20, 'all']);
});

test('知らない選択は既定に戻し、字数より多い問題数は「ぜんぶ」にする', () => {
  assert.deepEqual(normalizePrintOptions({ kind: 'x', count: 50, order: 'y', withAnswers: 'yes', seed: 'a' }, 30),
    { kind: 'write', count: 'all', order: 'drill', withAnswers: true, seed: 1 });
  assert.equal(normalizePrintOptions({ count: 20 }, 15).count, 'all');
  assert.equal(normalizePrintOptions({ count: 10 }, 15).count, 10);
  assert.equal(normalizePrintOptions(null, 5).kind, 'write');
});

test('ドリルの順は初めから、ばらばらは種で決まった並び（同じ種なら同じ）', () => {
  const list = GRADE1.slice(0, 25);
  assert.deepEqual(selectKanji(list, { count: 10, order: 'drill' }), list.slice(0, 10));
  const a = selectKanji(list, { count: 10, order: 'shuffle', seed: 7 });
  const b = selectKanji(list, { count: 10, order: 'shuffle', seed: 7 });
  const c = selectKanji(list, { count: 'all', order: 'shuffle', seed: 8 });
  assert.deepEqual(a, b);
  assert.equal(a.length, 10);
  assert.equal(new Set(a).size, 10);
  assert.notDeepEqual(c, list);
  assert.deepEqual([...c].sort((x, y) => x.id.localeCompare(y.id)), [...list].sort((x, y) => x.id.localeCompare(y.id)));
  assert.deepEqual(shuffleWithSeed([], 3), []);
});

test('10問ずつのページに分ける', () => {
  assert.deepEqual(paginate([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(paginate([], 10), []);
  assert.equal(QUESTIONS_PER_PAGE, 10);
});

test('書き取り23字・答えあり → 問題3ページ（10・10・3）、答え3ページを改ページして後ろに', () => {
  const drill = { name: 'まとめ', kanjis: GRADE1.slice(0, 23).map((k) => k.id) };
  const t = buildPrintTest({ drill, kanjiList: KANJI_DATA, options: { kind: 'write', count: 'all', withAnswers: true } });
  assert.equal(t.total, 23);
  assert.equal(t.questionPageCount, 3);
  assert.equal(t.answerPageCount, 3);
  assert.deepEqual(t.pages.map((p) => p.questions.length), [10, 10, 3, 10, 10, 3]);
  assert.deepEqual(t.pages.map((p) => p.answer), [false, false, false, true, true, true]);
  assert.deepEqual(t.pages.map((p) => `${p.index}/${p.count}`), ['1/3', '2/3', '3/3', '1/3', '2/3', '3/3']);
  assert.deepEqual(t.pages[2].questions.map((q) => q.number), [21, 22, 23]);
  assert.equal(new Set(t.pages.map((p) => p.key)).size, t.pages.length);
  // 答えのページは問題のページと同じ字・同じ例文
  assert.deepEqual(t.pages[3].questions, t.pages[0].questions);
});

test('答えなし・10問 → 問題1ページだけ', () => {
  const drill = { name: 'x', kanjis: GRADE1.slice(0, 25).map((k) => k.id) };
  const t = buildPrintTest({ drill, kanjiList: KANJI_DATA, options: { kind: 'read', count: 10, withAnswers: false } });
  assert.equal(t.pages.length, 1);
  assert.equal(t.pages[0].type, 'read');
  assert.equal(t.pages[0].questions.length, 10);
});

test('両方: 読みのページのあとに書き取りのページ。番号はそれぞれ1から', () => {
  const drill = drillOf(['一', '二', '三', '山', '川', '林', '森', '花', '草', '虫', '犬', '貝']);
  const t = buildPrintTest({ drill, kanjiList: KANJI_DATA, options: { kind: 'both', count: 'all', withAnswers: true } });
  assert.deepEqual(t.sections.map((s) => s.type), ['read', 'write']);
  assert.deepEqual(t.pages.map((p) => `${p.answer ? 'こたえ' : 'もんだい'}:${p.type}:${p.questions.length}`), [
    'もんだい:read:10', 'もんだい:read:2', 'もんだい:write:10', 'もんだい:write:2',
    'こたえ:read:10', 'こたえ:read:2', 'こたえ:write:10', 'こたえ:write:2',
  ]);
  assert.equal(t.sections[0].questions[0].number, 1);
  assert.equal(t.sections[1].questions[0].number, 1);
  // 読みには2番目の候補の例文を使い、同じ紙で書き取りの答えを見せにくくする
  const one = byChar('一');
  assert.equal(t.sections[0].questions[0].example, pickPromptExample(one, 1));
  assert.equal(t.sections[1].questions[0].example, pickPromptExample(one, 0));
});

test('両方・ばらばら: 読みと書き取りは同じ字の組で、並びは別', () => {
  const drill = { name: 'x', kanjis: GRADE1.slice(0, 30).map((k) => k.id) };
  const t = buildPrintTest({ drill, kanjiList: KANJI_DATA, options: { kind: 'both', count: 20, order: 'shuffle', seed: 12345 } });
  const read = t.sections[0].questions.map((q) => q.char);
  const write = t.sections[1].questions.map((q) => q.char);
  assert.equal(read.length, 20);
  assert.deepEqual([...read].sort(), [...write].sort());
  assert.notDeepEqual(read, write);
  // 同じ種なら、画面の見本と印刷が同じ並びになる
  const again = buildPrintTest({ drill, kanjiList: KANJI_DATA, options: { kind: 'both', count: 20, order: 'shuffle', seed: 12345 } });
  assert.deepEqual(again.sections, t.sections);
});

test('ドリル名は文字列だけ・制御文字なし・40字まで（紙に載るのはこれだけ）', () => {
  assert.equal(sanitizeDrillName('  1年の\nふくしゅう  '), '1年のふくしゅう');
  assert.equal(sanitizeDrillName('あ'.repeat(60)).length, 40);
  assert.equal(sanitizeDrillName(123), '');
  assert.equal(sanitizeDrillName(undefined), '');
  const t = buildPrintTest({ drill: { name: { evil: true }, kanjis: 'nope' }, kanjiList: KANJI_DATA });
  assert.equal(t.title, '');
  assert.equal(t.total, 0);
  assert.deepEqual(t.pages, []);
});

test('紙面の CSS: A4 縦・縦書き・同梱の書体だけを使い、外から読まない', () => {
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(css, /@page\s*\{[^}]*size:\s*A4 portrait/);
  const sheet = css.slice(css.indexOf('/* ── 印刷用の漢字テスト'));
  assert.ok(sheet.length > 0 && css.includes('/* ── 印刷用の漢字テスト'), '紙面の CSS の見出しが無い');
  assert.match(sheet, /writing-mode:\s*vertical-rl/);
  assert.match(sheet, /'Klee One'/);
  assert.match(sheet, /'Zen Maru Gothic'/);
  assert.doesNotMatch(sheet, /url\(|@import|https?:/);
});
