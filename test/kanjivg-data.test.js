import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { KANJI_DATA } from '../src/data/kanji-data.js';
import {
  extractStrokes, hexOf, KANJIVG_TAG, KANJIVG_COMMIT,
} from '../tools/build-kanjivg.mjs';

// 同梱した書き順データ（public/kanjivg/grade-N.json）が、アプリの漢字一覧と
// ずれていないことを見る。学年の配当を直したのに作り直し忘れると、
// その字だけ「書き順を読めない」になる（実行時は学年ファイルを1本だけ読むため）。
const readGrade = (grade) => JSON.parse(readFileSync(new URL(`../public/kanjivg/grade-${grade}.json`, import.meta.url), 'utf8'));

test('教育漢字1026字すべてが、その字の学年のファイルに入っている', () => {
  const files = Object.fromEntries([1, 2, 3, 4, 5, 6].map(g => [g, readGrade(g)]));
  for (const k of KANJI_DATA) {
    const strokes = files[k.grade].strokes[hexOf(k.char)];
    assert.ok(Array.isArray(strokes) && strokes.length > 0, `${k.char}（${k.id}）が grade-${k.grade}.json に無い`);
  }
  const total = Object.values(files).reduce((n, f) => n + Object.keys(f.strokes).length, 0);
  assert.equal(total, KANJI_DATA.length, '学年ファイルに一覧に無い字が混ざっている');
});

test('どの画も d と kvg:type を持ち、出典・版・ライセンスが書いてある', () => {
  for (const grade of [1, 2, 3, 4, 5, 6]) {
    const file = readGrade(grade);
    assert.equal(file.grade, grade);
    assert.match(file.source, new RegExp(`KanjiVG ${KANJIVG_TAG} \\(commit ${KANJIVG_COMMIT}\\)`));
    assert.match(file.license, /CC BY-SA 3\.0/);
    for (const [hex, strokes] of Object.entries(file.strokes)) {
      for (const [d, type] of strokes) {
        assert.ok(typeof d === 'string' && /^[Mm]/.test(d), `${hex} の d が壊れている`);
        // kvg:type は終筆（とめ・はね・はらい）の採点の根拠
        assert.ok(typeof type === 'string' && type.length > 0, `${hex} に kvg:type が無い画がある`);
      }
    }
  }
});

test('SVG からは画を書かれた順に取り出し、コメント中の path は拾わない', () => {
  const svg = `<?xml version="1.0"?>
<!-- <path d="M0,0" kvg:type="x"/> -->
<svg><g id="kvg:StrokePaths_04e8c">
  <path id="kvg:04e8c-s1" kvg:type="㇐" d="M31,29c1,0,2,1,3,1"/>
  <path id="kvg:04e8c-s2" kvg:type="㇐" d="M13,74c2,1,5,1,8,1"/>
</g><g id="kvg:StrokeNumbers_04e8c"><text>1</text></g></svg>`;
  assert.deepEqual(extractStrokes(svg), [
    ['M31,29c1,0,2,1,3,1', '㇐'],
    ['M13,74c2,1,5,1,8,1', '㇐'],
  ]);
  assert.deepEqual(extractStrokes('<svg><path d="M1,1"/></svg>'), [['M1,1', null]]);
  assert.deepEqual(extractStrokes('<html><body>ブロックされました</body></html>'), []);
});
