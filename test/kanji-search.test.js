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
