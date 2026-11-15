import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// 建物の絵は src/data/iso-svg/ の下に見出しごとに分けてあり、src/data/iso-svg.js が
// それらをまとめて再エクスポートする。town-items.jsx は import('./iso-svg') の 1 か所から
// 名前で引くので、分け方を変えたときに「名前が消えた・2 か所にある・まとめ忘れ」が
// 起きると、その建物だけが町に出なくなる（ビルドは通る）。ここで機械的に止める。

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const DIR = '../src/data/iso-svg/';

const barrel = read('../src/data/iso-svg.js');
const reexported = [...barrel.matchAll(/export \* from '\.\/iso-svg\/([\w-]+\.jsx)'/g)].map((m) => m[1]);
const sectionFiles = readdirSync(new URL(DIR, import.meta.url)).filter((f) => f.endsWith('.jsx'));

const exportsByFile = Object.fromEntries(sectionFiles.map((file) => [
  file,
  [...read(DIR + file).matchAll(/^export const (\w+)/gm)].map((m) => m[1]),
]));

test('共有部品以外の見出しファイルは、すべてまとめ役から再エクスポートされている', () => {
  const expected = sectionFiles.filter((f) => f !== 'shared.jsx').sort();
  assert.deepEqual([...reexported].sort(), expected);
  assert.ok(!reexported.includes('shared.jsx'), '共有部品は町のアイテムではないので外へ出さない');
});

test('建物の絵の名前は 1 つのファイルにだけある', () => {
  const seen = new Map();
  for (const file of reexported) {
    for (const name of exportsByFile[file]) {
      assert.ok(!seen.has(name), `${name} が ${seen.get(name)} と ${file} の両方にある`);
      seen.set(name, file);
    }
  }
  assert.ok(seen.size >= 100, `再エクスポートされる絵が少なすぎる（${seen.size}）`);
});

test('town-items.jsx が名前で引く絵は、すべてまとめ役から届く', () => {
  const available = new Set(reexported.flatMap((file) => exportsByFile[file]));
  const wanted = [...read('../src/data/town-items.jsx').matchAll(/lazySvg\('(\w+)'\)/g)].map((m) => m[1]);
  assert.ok(wanted.length > 100);
  const missing = wanted.filter((name) => !available.has(name));
  assert.deepEqual(missing, []);
});

test('どのファイルも品質ゲートの行数上限（5000 行）から十分に離れている', () => {
  for (const file of sectionFiles) {
    const lines = read(DIR + file).split('\n').length;
    assert.ok(lines < 2500, `${file} が ${lines} 行ある。見出しでさらに分けること`);
  }
});
