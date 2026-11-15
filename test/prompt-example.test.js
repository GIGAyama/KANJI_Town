import test from 'node:test';
import assert from 'node:assert/strict';
import { KANJI_DATA } from '../src/data/kanji-data.js';
import { hasRubyOnTarget, pickPromptExample } from '../src/systems/prompt-example.js';

test('どの字にも、対象字にルビの付いた出題用の例文がある', () => {
  const missing = KANJI_DATA.filter((kanji) => {
    const example = pickPromptExample(kanji);
    return !example || !hasRubyOnTarget(example, kanji.char);
  });
  assert.deepEqual(missing.map((kanji) => kanji.char), []);
});

test('読みの並びが同じ字（漢・感・完・官・刊）でも、出題文は字ごとに違う', () => {
  const chars = ['漢', '感', '完', '官', '刊'];
  const prompts = chars.map((char) => pickPromptExample(KANJI_DATA.find((k) => k.char === char)));
  assert.equal(new Set(prompts).size, chars.length);
});

test('対象字にルビの無い例文より、ルビの付いた例文を選ぶ', () => {
  const kanji = { char: '人', examples: ['三人の 子。', '人（ひと）が いる。'] };
  assert.equal(pickPromptExample(kanji, 0), '人（ひと）が いる。');
  assert.equal(pickPromptExample(kanji, 1), '人（ひと）が いる。');
});

test('同じ字を続けて出すときは、候補の例文を順に使う', () => {
  const kanji = { char: '山', examples: ['山（やま）に のぼる。', '火山（かざん）。'] };
  assert.equal(pickPromptExample(kanji, 0), '山（やま）に のぼる。');
  assert.equal(pickPromptExample(kanji, 1), '火山（かざん）。');
  assert.equal(pickPromptExample(kanji, 2), '山（やま）に のぼる。');
});

test('例文が無い字は null を返し、呼び出し側が読みの出題に戻せる', () => {
  assert.equal(pickPromptExample({ char: '山', examples: [] }), null);
  assert.equal(pickPromptExample({ char: '山', examples: ['川（かわ）。'] }), null);
  assert.equal(pickPromptExample(null), null);
});
