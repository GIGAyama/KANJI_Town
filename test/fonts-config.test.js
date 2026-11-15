import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KANJI_DATA } from '../src/data/kanji-data.js';

// 同梱した書体（src/fonts/）が、アプリの字と食い違っていないかを見る。
// 作り直しは fonts.config.json を読んで build-fonts.mjs が行う（README「素材とライセンス」）。

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(readFileSync(join(ROOT, 'fonts.config.json'), 'utf8'));
const css = readFileSync(join(ROOT, 'src/fonts/fonts.css'), 'utf8');

/** fonts.css の @font-face を { family, weight, src, ranges } に読む */
function parseFaces(text) {
  return [...text.matchAll(/@font-face\s*{([^}]*)}/g)].map(([, body]) => {
    const family = body.match(/font-family:\s*'([^']+)'/)[1];
    const weight = Number(body.match(/font-weight:\s*(\d+)/)[1]);
    const src = body.match(/url\('([^']+)'\)/)[1];
    const ranges = body.match(/unicode-range:\s*([^;]+);/)[1].split(',').map((r) => {
      const [a, b] = r.trim().replace(/^U\+/i, '').split('-');
      return [parseInt(a, 16), parseInt(b ?? a, 16)];
    });
    return { family, weight, src, ranges };
  });
}
const faces = parseFaces(css);
const covered = (family, weight, char) => {
  const cp = char.codePointAt(0);
  return faces.some((f) => f.family === family && f.weight === weight
    && f.ranges.some(([a, b]) => cp >= a && cp <= b));
};
const kanji = [...new Set(KANJI_DATA.map((k) => k.char))];

test('書体ファイルはすべて同梱されていて、外から取りに行かない', () => {
  assert.ok(faces.length > 0);
  for (const f of faces) {
    assert.match(f.src, /^\.\/[a-z0-9-]+\.woff2$/, `${f.src} が同梱のファイルを指していない`);
    const p = join(ROOT, 'src/fonts', f.src);
    assert.ok(existsSync(p) && statSync(p).size > 1000, `${f.src} が無い`);
  }
  // CSS が指していない woff2 が残っていると、配信物だけが重くなる
  const referenced = new Set(faces.map((f) => f.src.slice(2)));
  for (const name of readdirSync(join(ROOT, 'src/fonts')).filter((n) => n.endsWith('.woff2'))) {
    assert.ok(referenced.has(name), `${name} はどの @font-face からも使われていない`);
  }
  assert.ok(existsSync(join(ROOT, 'public/fonts/OFL.txt')), 'OFL の本文（public/fonts/OFL.txt）が無い');
});

test('Zen Maru Gothic の各ウェイトに、かな・英数・教育漢字1026字が入っている', () => {
  const base = [];
  for (let cp = 0x21; cp <= 0x7e; cp++) base.push(String.fromCodePoint(cp));
  for (let cp = 0x3041; cp <= 0x3093; cp++) base.push(String.fromCodePoint(cp));
  for (let cp = 0x30a1; cp <= 0x30f6; cp++) base.push(String.fromCodePoint(cp));
  for (const weight of [500, 700, 900]) {
    const missing = [...base, ...kanji].filter((c) => !covered('Zen Maru Gothic', weight, c));
    assert.equal(missing.join(''), '', `Zen Maru Gothic ${weight} に無い字`);
  }
});

test('Klee One は教育漢字1026字だけを、使っている 600 だけで持つ', () => {
  const klee = config.families.find((f) => f.family === 'Klee One');
  assert.deepEqual(klee.weights, [600]);
  // 設定の text は漢字一覧から写したもの。学年の配当を直して字が増減したら写し直す。
  assert.equal(klee.text, [...kanji].sort().join(''));
  assert.equal(kanji.filter((c) => !covered('Klee One', 600, c)).join(''), '');
});

test('画面に出る字のうち、書体に入っていないものを知らせる（落ちても端末の書体で出る）', (t) => {
  const strip = (s) => s.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  const walk = (dir) => readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (n === 'fonts') return [];
    return statSync(p).isDirectory() ? walk(p) : (/\.(jsx?|css)$/.test(n) ? [p] : []);
  });
  const seen = new Set();
  for (const p of walk(join(ROOT, 'src'))) for (const c of strip(readFileSync(p, 'utf8'))) seen.add(c);
  const missing = [...seen].filter((c) => {
    const cp = c.codePointAt(0);
    if (cp < 0x3000 || cp > 0xffff || (cp >= 0xd800 && cp <= 0xdfff)) return false; // 英数と絵文字は見ない
    return !covered('Zen Maru Gothic', 700, c);
  });
  if (missing.length) t.diagnostic(`書体に無い字 ${missing.length} 字: ${missing.join('')}（fonts.config.json から作り直すと入る）`);
  assert.ok(true);
});
