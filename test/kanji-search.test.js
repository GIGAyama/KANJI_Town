import test from 'node:test';
import assert from 'node:assert/strict';
import { KANJI_DATA } from '../src/data/kanji-data.js';
import { filterKanji, matchesKanjiQuery, normalizeReading } from '../src/utils/kanji-search.js';

const chars = (query, grade = 0) => filterKanji(KANJI_DATA, { query, grade }).map((k) => k.char);

test('読みを「ひらがな・記号なし」にそろえる', () => {
  assert.equal(normalizeReading('イチ'), 'いち');
  assert.equal(normalizeReading('ひと(つ)'), 'ひとつ');
  assert.equal(normalizeReading('ひと-'), 'ひと');
  assert.equal(normalizeReading('まな.ぶ'), 'まなぶ');
  assert.equal(normalizeReading('  サン '), 'さん');
});

test('ひらがなの音読みで見つかる（以前は 一 が出ず、さん は0件だった）', () => {
  assert.ok(chars('いち').includes('一'));
  assert.ok(chars('さん').includes('三'));
  assert.ok(chars('さん').includes('山'));
});

test('カタカナの音読みでも今までどおり見つかる', () => {
  assert.ok(chars('サン').includes('三'));
});

test('送りがな付きの訓読みで見つかる', () => {
  assert.ok(chars('ひとつ').includes('一'));
  assert.ok(chars('はいる').includes('入'));
  assert.ok(chars('まなぶ').includes('学'));
  assert.ok(chars('あたらしい').includes('新'));
});

test('字そのもの・前後の空白・学年のしぼりこみ', () => {
  assert.deepEqual(chars('一'), ['一']);
  assert.ok(chars('  やま ').includes('山'));
  assert.equal(chars('', 1).length, KANJI_DATA.filter((k) => k.grade === 1).length);
  assert.ok(chars('さん', 1).every((c) => KANJI_DATA.find((k) => k.char === c).grade === 1));
});

test('記号だけの入力では何も当てはまらない', () => {
  assert.equal(matchesKanjiQuery({ char: '一', on: ['イチ'], kun: ['ひと-'] }, '-'), false);
});

// ── 字えらびの画面の さがし方（ドリルを作る・ならった範囲を配る） ──
// 前は 学年タブと、その学年の字を ぜんぶ ならべた一覧だけだった（3 年は 200 字）。

import { readFileSync } from 'node:fs';
import { findKanji, strokeOptions } from '../src/utils/kanji-search.js';
import { KANJI_BY_STROKES, MAX_STROKES, strokeCountOf } from '../src/data/kanji-strokes.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const find = (query, options = {}) => findKanji(KANJI_DATA, { query, ...options });
const found = (query, options) => find(query, options).items.map((item) => item.kanji.char).join('');

test('画数の表: 1026 字が 1 回ずつ入り、書き順データ（KanjiVG）の 画の数と合う', () => {
  const all = KANJI_BY_STROKES.join('');
  assert.equal([...all].length, 1026);
  assert.equal(new Set(all).size, 1026);
  assert.equal(KANJI_BY_STROKES[0], '');
  assert.equal(MAX_STROKES, 20);
  const counts = new Map();
  for (let grade = 1; grade <= 6; grade++) {
    const { strokes } = JSON.parse(read(`../public/kanjivg/grade-${grade}.json`));
    for (const [hex, list] of Object.entries(strokes)) counts.set(String.fromCodePoint(parseInt(hex, 16)), list.length);
  }
  for (const kanji of KANJI_DATA) {
    assert.equal(strokeCountOf(kanji.char), counts.get(kanji.char), `${kanji.char} の画数`);
  }
  assert.equal(strokeCountOf('一'), 1);
  assert.equal(strokeCountOf('議'), 20);
  assert.equal(strokeCountOf('鬱'), 0, '小学校で習わない字');
});

test('字を ならべて さがす: 打った順に出る。学年・画数の しぼりこみは見ない', () => {
  const result = find('山川田', { grade: 6, strokes: 20 });
  assert.equal(result.mode, 'chars');
  assert.equal(result.items.map((item) => item.kanji.char).join(''), '山川田');
  assert.deepEqual(result.items.map((item) => item.strokes), [3, 3, 5]);
  // 教科書から写した ならび（空白・読点・かな まじり）。同じ字は 1 回
  assert.equal(found('世界、平和 と 主（しゅ）世'), '世界平和主');
  // 小学校で習わない字は 分けて返す（画面で知らせる）
  const mixed = find('鬱と山、川');
  assert.equal(mixed.items.map((item) => item.kanji.char).join(''), '山川');
  assert.deepEqual(mixed.unknown, ['鬱']);
});

test('読みで さがす: ぴったり → はじまりが同じ → とちゅうに ふくむ の順。合った読みを返す', () => {
  const result = find('やま');
  assert.equal(result.mode, 'reading');
  assert.equal(result.items[0].kanji.char, '山');
  assert.deepEqual(result.items[0].hit, { text: 'やま', kind: 'kun' });
  assert.equal(result.items[1].kanji.char, '病', '「やまい」は はじまりが同じ');
  assert.ok(found('やま').includes('早'), '「はや(まる)」は とちゅうに ふくむ');
  assert.ok(found('やま').indexOf('病') < found('やま').indexOf('早'));
  // カタカナ・全角の空白でも同じ
  assert.equal(found('　コウ '), found('こう'));
  assert.deepEqual(find('こう').items[0].hit, { text: 'コウ', kind: 'on' });
  // 送りがなの前だけ・送りがな付き のどちらでも ぴったり
  assert.equal(find('ひと').items[0].kanji.char, '一');
  assert.equal(found('ひとつ'), '一');
  // 1 字だけ打ったときは「とちゅうに ふくむ」を出さない（出すと ほとんどの字が当てはまる）
  const one = find('か', { grade: 1 }).items;
  assert.ok(one.length > 0 && one.length < 20);
  for (const item of one) assert.ok(/^[かカ]/.test(item.hit.text), `${item.kanji.char}（${item.hit.text}）`);
});

test('読みで さがす: 学年・画数で しぼりこめる。かくれた字の数を返す', () => {
  const all = find('こう');
  const third = find('こう', { grade: 3 });
  assert.ok(third.items.length > 0 && third.items.every((item) => item.kanji.grade === 3));
  assert.equal(third.items.length + third.elsewhere, all.items.length);
  assert.equal(all.elsewhere, 0);
  const narrow = find('こう', { grade: 3, strokes: 6 });
  assert.equal(narrow.items.map((item) => item.kanji.char).join(''), '向');
  assert.equal(narrow.items.length + narrow.elsewhere, all.items.length);
  // 学年の低い字が先
  const grades = all.items.filter((item) => item.hit.text === 'コウ').map((item) => item.kanji.grade);
  assert.deepEqual(grades, [...grades].sort((a, b) => a - b));
});

test('数字で さがす: 「5」「５画」「5かく」は 5 画の字（「画」を 字として さがさない）', () => {
  for (const query of ['5', '５', '5画', '５画', '5かく', '5 カク']) {
    const result = find(query, { grade: 1 });
    assert.equal(result.mode, 'strokes', query);
    assert.equal(result.strokes, 5);
    assert.ok(result.items.length === 13 && result.items.every((item) => item.strokes === 5 && item.kanji.grade === 1), query);
  }
  assert.equal(find('5').items.length, [...KANJI_BY_STROKES[5]].length);
  assert.equal(find('25').items.length, 0);
  // 「画」だけなら 字として さがす
  assert.equal(found('画'), '画');
});

test('何も打たない: 学年と画数で しぼり、画数の順に ならべる', () => {
  const third = find('', { grade: 3 });
  assert.equal(third.mode, 'browse');
  assert.equal(third.items.length, 200);
  const strokes = third.items.map((item) => item.strokes);
  assert.deepEqual(strokes, [...strokes].sort((a, b) => a - b));
  assert.equal(third.items[0].kanji.char, '丁');
  const nine = find('', { grade: 3, strokes: 9 });
  assert.equal(nine.items.length, 30);
  assert.ok(nine.items.every((item) => item.strokes === 9 && item.kanji.grade === 3));
  assert.equal(find('').items.length, 1026);
  // 記号・空白だけは 何も打っていないのと同じ
  assert.equal(find(' - ', { grade: 1 }).mode, 'browse');
  assert.equal(find(' - ', { grade: 1 }).items.length, 80);
  // もとの一覧は ならべかえない
  assert.equal(KANJI_DATA[0].char, '一');
});

test('画数の えらぶ欄: その学年にある画数だけを、小さい順に', () => {
  const first = strokeOptions(KANJI_DATA, 1);
  assert.deepEqual(first.map((o) => o.strokes), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
  assert.equal(first.reduce((sum, o) => sum + o.count, 0), 80);
  const all = strokeOptions(KANJI_DATA);
  assert.equal(all.length, 20);
  assert.equal(all.reduce((sum, o) => sum + o.count, 0), 1026);
});

test('字えらびの画面: 2 つとも 同じ「さがす・しぼりこむ」を使い、入口の束には入れない', () => {
  const drill = read('../src/components/pages/DrillEditorView.jsx');
  const range = read('../src/components/social/RangeEditorView.jsx');
  for (const [name, source] of [['DrillEditorView.jsx', drill], ['RangeEditorView.jsx', range]]) {
    assert.match(source, /import \{ KanjiFinderControls, KanjiFinderResults, useKanjiFinder \} from '..\/ui\/KanjiFinder';/, name);
    assert.match(source, /<KanjiFinderControls\b/, name);
    assert.match(source, /<KanjiFinderResults\b/, name);
    assert.match(source, /onAddMany=/, `${name}: まとめて えらぶ`);
  }
  // ならった範囲: ほかの段の字は えらべないまま
  assert.match(range, /lockedLabels=\{locked\}/);
  assert.match(range, /canAdd=\{!full\}/);
  // components/ui/index.js から出すと、App.jsx を通って 入口の束（上限 220KiB）に入る
  assert.ok(!/KanjiFinder/.test(read('../src/components/ui/index.js')));
  assert.ok(!/kanji-strokes|KanjiFinder|kanji-search/.test(read('../src/App.jsx')));
});
