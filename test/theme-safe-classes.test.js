import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// テーマの文字色（--text / --text-muted）は、ダークテーマでは明るい色になる。
// 同じ要素に「固定の白・淡い色の地」を付けると、ダークでは白い地に白い文字になって読めない
// （以前は読みのチップが 1.12:1、なぞりの案内が 1.23:1 だった）。
// 淡い地を使うなら文字も固定の濃い色（text-slate-800 など）にし、テーマの文字色を使うなら
// 地も bg-[var(--bg)] / bg-[var(--panel)] にすること。
const SRC = fileURLToPath(new URL('../src/components/', import.meta.url));
const LIGHT_BG = /(?:^|\s)bg-(?:white|(?:gray|slate|stone|neutral|zinc|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200))(?=[\s/]|$)/;
const THEME_TEXT = /(?:^|\s)text-\[var\(--text(?:-muted)?\)\](?=\s|$)/;

function listJsx(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listJsx(path);
    return /\.(jsx|js)$/.test(name) ? [path] : [];
  });
}

test('固定の淡い地とテーマの文字色を、同じ要素に重ねていない', () => {
  const offenders = [];
  for (const file of listJsx(SRC)) {
    const source = readFileSync(file, 'utf8');
    // クラス名はたいてい 1 つの文字列リテラルに書かれる（三項演算子の枝ごとに別のリテラル）
    for (const match of source.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g)) {
      const literal = match[1] ?? match[2] ?? match[3] ?? '';
      // テンプレートの ${...} の中は別の文字列として上で拾うので、外だけを見る
      const outer = literal.replace(/\$\{[^}]*\}/g, ' ');
      if (LIGHT_BG.test(outer) && THEME_TEXT.test(outer)) {
        const line = source.slice(0, match.index).split('\n').length;
        offenders.push(`${relative(SRC, file)}:${line}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});
