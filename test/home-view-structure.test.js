import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// HomeView の中で部品（大文字で始まる関数）を定義すると、描画のたびに別の部品として
// 扱われる。学年や音を切り替えるだけで町マップ（重い町では 3 万個を超える要素）が
// 捨てられて作り直され、低速な端末では数秒固まっていた。部品はファイル直下に置く。

const source = readFileSync(new URL('../src/components/pages/HomeView.jsx', import.meta.url), 'utf8');

/** `const HomeView = (...) => {` から、対応する閉じ括弧までの本文を返す */
function componentBody(text, name) {
  const start = text.indexOf(`const ${name} = (`);
  assert.ok(start >= 0, `${name} が見つからない`);
  const open = text.indexOf('=> {', start) + 3;
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  throw new Error(`${name} の終わりが見つからない`);
}

test('HomeView の中で部品を定義していない', () => {
  const body = componentBody(source, 'HomeView');
  const inner = [...body.matchAll(/(?:const|let|function)\s+([A-Z]\w*)\s*(?:=\s*(?:\([^)]*\)|\w+)\s*=>|\()/g)].map((m) => m[1]);
  assert.deepEqual(inner, [], `HomeView の中に部品がある: ${inner.join(', ')}`);
});

test('町マップは memo した部品から描き、住民が空でも毎回新しい配列を渡さない', () => {
  assert.match(source, /const TownMap = memo\(/);
  assert.doesNotMatch(source, /villagers=\{stats\.villagers \|\| \[\]\}/);
  assert.doesNotMatch(source, /villagers: stats\.villagers \|\| \[\]/);
});
