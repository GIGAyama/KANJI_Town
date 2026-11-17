import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTO_STROKE_MS, DRAW_SECONDS, createLesson, lessonKeyAction, lessonReducer, strokeLook } from '../src/systems/lesson-mode.js';

// 授業モード: 電子黒板に 字を 1 字ずつ大きく映し、書き順を「自動で」か「1 画ずつ」見せる。
// ここは 進み方の計算（どの字を・何画めまで 見せるか）を確かめる。

const ctx = { count: 3, strokes: 5 };
const run = (actions, context = ctx, state = createLesson()) => actions.reduce((s, type) => lessonReducer(s, typeof type === 'string' ? { type } : type, context), state);

test('はじめは 1 字めの 字ぜんたいを見せる', () => {
  assert.deepEqual(createLesson(), { index: 0, stroke: -1, playing: false, hidden: false });
});

test('1 画ずつ: 字ぜんたい → 1 画め → … → さいごの画 → 字ぜんたい（空書きの かけ声に合わせて おす）', () => {
  const strokes = [];
  let state = createLesson();
  for (let i = 0; i < 7; i++) { state = lessonReducer(state, { type: 'step' }, ctx); strokes.push(state.stroke); }
  assert.deepEqual(strokes, [1, 2, 3, 4, 5, -1, 1]);
  // もどる: 1 画ずつ へる。0（何も書いていない）より前には行かない
  assert.equal(run(['step', 'step', 'step', 'back']).stroke, 2);
  assert.equal(run(['step', 'back', 'back', 'back']).stroke, 0);
  // 字ぜんたいから もどると、さいごの 1 画を消した所
  assert.equal(run(['back']).stroke, 4);
  // はじめから: 何も書いていない所
  assert.equal(run(['step', 'step', 'restart']).stroke, 0);
  assert.equal(run(['restart', 'step']).stroke, 1);
});

test('自動で書く: 1 画めから 1 こまに 1 画ずつ進み、書きおえたら止まる', () => {
  let state = run(['play']);
  assert.deepEqual([state.stroke, state.playing], [0, true]);
  const seen = [];
  for (let i = 0; i < 7; i++) { state = lessonReducer(state, { type: 'tick' }, ctx); seen.push([state.stroke, state.playing]); }
  assert.deepEqual(seen, [[1, true], [2, true], [3, true], [4, true], [5, false], [5, false], [5, false]]);
  // とちゅうで止める・1 画ずつに切りかえる
  assert.deepEqual(run(['play', 'tick', 'tick', 'pause', 'tick']).stroke, 2);
  assert.equal(run(['play', 'tick', 'step']).playing, false);
  assert.equal(run(['play', 'tick', 'step']).stroke, 2);
  // 止まっているときの 1 こまは 何もしない
  assert.equal(run(['step', 'tick']).stroke, 1);
});

test('字を うつると、書き順・かくす・自動は はじめに もどる。はしでは 止まる', () => {
  const moved = run(['play', 'tick', 'next']);
  assert.deepEqual(moved, { index: 1, stroke: -1, playing: false, hidden: false });
  assert.equal(run(['next', 'next', 'next', 'next']).index, 2);
  assert.equal(run(['prev']).index, 0);
  assert.equal(run([{ type: 'goto', index: 2 }, 'prev']).index, 1);
  assert.equal(run([{ type: 'goto', index: 99 }]).index, 2);
  assert.equal(run([{ type: 'goto', index: -4 }]).index, 0);
  // はしで おしても、見せている画は そのまま
  const atEnd = run([{ type: 'goto', index: 2 }, 'step', 'step']);
  assert.equal(lessonReducer(atEnd, { type: 'next' }, ctx), atEnd);
});

test('字を かくす: 字ぜんたいを かくして たしかめる。書き順を動かすと 見える', () => {
  const hidden = run(['step', 'step', 'toggleHidden']);
  assert.deepEqual([hidden.hidden, hidden.stroke, hidden.playing], [true, -1, false]);
  assert.equal(lessonReducer(hidden, { type: 'toggleHidden' }, ctx).hidden, false);
  assert.equal(lessonReducer(hidden, { type: 'step' }, ctx).hidden, false);
  assert.equal(lessonReducer(hidden, { type: 'play' }, ctx).hidden, false);
  assert.equal(lessonReducer(hidden, { type: 'next' }, ctx).hidden, false);
});

test('お手本が まだ読めていない字（画数 0）では、書き順の操作は 何もしない', () => {
  const empty = { count: 3, strokes: 0 };
  for (const type of ['step', 'back', 'restart', 'play', 'tick']) {
    assert.deepEqual(run([type], empty), createLesson(), type);
  }
  assert.equal(run(['next'], empty).index, 1);
  assert.deepEqual(lessonReducer(createLesson(), { type: 'unknown' }, ctx), createLesson());
});

test('キー: 矢印・PageUp/PageDown（プレゼン用リモコン）で 字を うつり、スペース・Enter で 1 画', () => {
  assert.deepEqual(lessonKeyAction('ArrowRight'), { type: 'next' });
  assert.deepEqual(lessonKeyAction('PageDown'), { type: 'next' });
  assert.deepEqual(lessonKeyAction('ArrowLeft'), { type: 'prev' });
  assert.deepEqual(lessonKeyAction('PageUp'), { type: 'prev' });
  assert.deepEqual(lessonKeyAction(' '), { type: 'step' });
  assert.deepEqual(lessonKeyAction('Enter'), { type: 'step' });
  assert.deepEqual(lessonKeyAction('ArrowDown'), { type: 'step' });
  assert.deepEqual(lessonKeyAction('ArrowUp'), { type: 'back' });
  assert.deepEqual(lessonKeyAction('Home'), { type: 'goto', index: 0 });
  assert.deepEqual(lessonKeyAction('End', { count: 5 }), { type: 'goto', index: 4 });
  assert.equal(lessonKeyAction('a'), null);
  assert.equal(lessonKeyAction('Escape'), null, 'とじるのは ダイアログの側');
});

test('画の見え方: 書きおえた画・いま書いた画・これから書く画（うすい お手本）', () => {
  assert.deepEqual([0, 1, 2, 3].map((i) => strokeLook(i, 2)), ['done', 'now', 'guide', 'guide']);
  assert.deepEqual([0, 1, 2].map((i) => strokeLook(i, 0)), ['guide', 'guide', 'guide']);
  assert.deepEqual([0, 1, 2].map((i) => strokeLook(i, -1)), ['done', 'done', 'done']);
  assert.deepEqual([0, 1, 2].map((i) => strokeLook(i, 3)), ['done', 'done', 'now']);
  // 線を引く動きは、次の画へ進む前に おわる
  assert.ok(DRAW_SECONDS * 1000 < AUTO_STROKE_MS);
});

// ── 画面（ソースを読んで確かめる） ──

import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('授業モードの画面: 映すだけ（保存しない・送らない）。マイドリルと 範囲の段から開く', () => {
  const view = read('../src/components/lesson/LessonMode.jsx');
  const code = view.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.ok(!/StorageAPI|setStats|localStorage|fetch\(|onUpdateStat/.test(code), '授業モードが 記録や通信を している');
  assert.match(code, /lessonReducer\(s, action, contextRef\.current\)/);
  assert.match(code, /lessonKeyAction\(event\.key, contextRef\.current\)/);
  // ボタンの上の スペース・Enter で 2 回 動かさない
  assert.match(code, /event\.target\.closest\('button, a, input, select'\)/);
  // 「動きを へらす」設定では、線を引く動きを付けない
  assert.match(code, /strokeDashoffset=\{reduceMotion \? 0 : 1\}/);
  assert.match(code, /style=\{reduceMotion \? undefined : \{ animation: `lesson-draw \$\{DRAW_SECONDS\}s ease-out forwards` \}\}/);
  // 読み上げは 端末に入っている声だけ（utils/tts.js。外へ送らない）
  assert.match(code, /speakJa\(toSpeechText\(example\)/);
  assert.match(read('../src/components/pages/MyDrillsView.jsx'), /const LessonMode = lazy\(\(\) => import\('\.\.\/lesson\/LessonMode'\)\);/);
  assert.match(read('../src/components/social/RangeEditorView.jsx'), /<LessonMode title=\{lesson\.title\} kanjiIds=\{lesson\.kanjiIds\} onClose=/);
});

test('授業モードの画面: 黒板に映る文に、ふりがなの無い漢字が無い', () => {
  const code = read('../src/components/lesson/LessonMode.jsx')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    // ふりがなを付ける書き方 F('字', 'じ')、読み上げ用の名前（画面には出ない）
    .replace(/F\('[^']+',\s*'[^']+'\)/g, '')
    .replace(/aria-label=("[^"]*"|\{`[^`]*`\}|\{[^}]*\})/g, '');
  const kanjiLeft = [...code.matchAll(/[^\n]*[㐀-鿿][^\n]*/g)].map((m) => m[0].trim());
  assert.deepEqual(kanjiLeft, []);
});

test('授業モードの画面: おせない間の ボタンも 焦点を持てる（disabled にしない）', () => {
  // disabled の ボタンは 焦点を持てない。開いたときの焦点が うしろの画面に残り、
  // リモコン・キーボードの Enter・スペースが「うしろの ボタン」を おしてしまっていた
  const code = read('../src/components/lesson/LessonMode.jsx').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(code, /\sdisabled=/);
  assert.match(code, /onClick=\{\(\) => act\('step', !ready\)\} aria-disabled=\{!ready\} data-autofocus/);
  assert.match(code, /const act = \(type, off = false\) => \{ if \(off\) return;/);
  assert.match(code, /aria-disabled:opacity-40/);
});
