import test from 'node:test';
import assert from 'node:assert/strict';
import { KANJI_DATA } from '../src/data/kanji-data.js';
import { KANJI_BY_GRADE } from '../src/data/kanji-grades.js';
import { buildGradeLookup, getFuriganaMode, shouldShowRuby } from '../src/utils/furigana.js';

const lookup = buildGradeLookup(KANJI_BY_GRADE);

test('学年の字の表が、漢字データの学年と食い違わない', () => {
  assert.equal(lookup.size, KANJI_DATA.length);
  for (const k of KANJI_DATA) {
    assert.equal(lookup.get(k.char), k.grade, `${k.char} は ${k.grade}年の字`);
  }
});

test('設定が無いときは「すべて」。以前の showFurigana: false は「なし」として引き継ぐ', () => {
  assert.equal(getFuriganaMode(undefined), 'all');
  assert.equal(getFuriganaMode({}), 'all');
  assert.equal(getFuriganaMode({ showFurigana: true }), 'all');
  assert.equal(getFuriganaMode({ showFurigana: false }), 'none');
  assert.equal(getFuriganaMode({ furiganaMode: 'aboveGrade', showFurigana: false }), 'aboveGrade');
  assert.equal(getFuriganaMode({ furiganaMode: 'bogus' }), 'all');
});

test('「すべて」と「なし」は字によらない', () => {
  assert.equal(shouldShowRuby('一', { mode: 'all', grade: 6, gradeLookup: lookup }), true);
  assert.equal(shouldShowRuby('憂鬱', { mode: 'none', grade: 1, gradeLookup: lookup }), false);
});

test('「学年より上の字だけ」は、えらんだ学年より上の字をふくむことばにだけ出す', () => {
  const opts = (grade) => ({ mode: 'aboveGrade', grade, gradeLookup: lookup });
  // 漢(3年)+字(1年)
  assert.equal(shouldShowRuby('漢字', opts(1)), true);
  assert.equal(shouldShowRuby('漢字', opts(2)), true);
  assert.equal(shouldShowRuby('漢字', opts(3)), false);
  // 1年の字だけ
  assert.equal(shouldShowRuby('一年生', opts(1)), false);
  // 教育漢字に無い字は、6年でも出す
  assert.equal(shouldShowRuby('嬉', opts(6)), true);
  // かな・記号だけのものは出さない
  assert.equal(shouldShowRuby('レベル', opts(1)), false);
});

test('学年の表がまだ読めていないときは、出しておく', () => {
  assert.equal(shouldShowRuby('一', { mode: 'aboveGrade', grade: 6, gradeLookup: null }), true);
});
