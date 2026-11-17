import test from 'node:test';
import assert from 'node:assert/strict';
import { SHARE_LOG_MAX, addShareLog, describeShareEntry, readShareLog, removeShareLog, shareEntryUrl, shareLogKey } from '../src/systems/share-log.js';
import { buildDrillShareUrl, encodeDrillParam } from '../src/systems/drill-share.js';
import { buildRangeShareUrl, encodeRangeParam } from '../src/systems/learning-range.js';
import { addStageDrill, stageDrillName, stageToDrill } from '../src/systems/range-tools.js';

// 配ったものの控え: 先生が配った リンクの中身を、先生の端末に残す。
// サーバーが無いので、配ったあとに直すと 何を配ったのかが残らず、QR を もう一度 出すには 作りなおすしかなかった。

const drill = { name: '3年 1学期', kanjis: ['k3_1', 'k3_2', 'k3_3'] };
const homework = { ...drill, homework: { due: '2026-12-01', mode: 'test', count: 0, pass: 80 } };
const range = { name: '3年 2学期', stages: [{ from: '2026-11-17', kanjis: ['k3_1', 'k3_2'] }, { from: '2026-11-24', kanjis: ['k3_3'] }] };
const drillParam = encodeDrillParam(drill);
const homeworkParam = encodeDrillParam(homework);
const rangeParam = encodeRangeParam(range);
const BASE = 'https://kanji-town.giga-school.com/';

test('控え: 配ったものを 新しい順に残す。中身は リンクの値から復元する', () => {
  let log = addShareLog(undefined, { kind: 'drill', param: drillParam }, 1000);
  log = addShareLog(log, { kind: 'range', param: rangeParam }, 2000);
  log = addShareLog(log, { kind: 'drill', param: homeworkParam, via: 'number' }, 3000);
  assert.deepEqual(log.map((e) => [e.kind, e.at, e.via]), [['drill', 3000, 'number'], ['range', 2000, 'link'], ['drill', 1000, 'link']]);
  // 持つのは 種類・リンクの値・日時・配り方だけ（名前や字を 別に持たない）
  assert.deepEqual(Object.keys(log[0]).sort(), ['at', 'kind', 'param', 'via']);

  assert.deepEqual(describeShareEntry(log[2]), { kind: 'drill', name: '3年 1学期', kanjis: ['k3_1', 'k3_2', 'k3_3'], homework: null });
  const hw = describeShareEntry(log[0]);
  assert.equal(hw.homework.due, '2026-12-01');
  assert.equal(hw.homework.mode, 'test');
  const described = describeShareEntry(log[1]);
  assert.equal(described.name, '3年 2学期');
  assert.equal(described.kanjiCount, 3);
  assert.deepEqual(described.stages.map((s) => s.from), ['2026-11-17', '2026-11-24']);
});

test('控え: 同じ中身を もう一度 配ったら 1 件のまま、いちばん上へ動く', () => {
  let log = addShareLog([], { kind: 'drill', param: drillParam }, 1000);
  log = addShareLog(log, { kind: 'range', param: rangeParam }, 2000);
  log = addShareLog(log, { kind: 'drill', param: drillParam, via: 'number' }, 3000);
  assert.equal(log.length, 2);
  assert.deepEqual(log.map((e) => [e.kind, e.at]), [['drill', 3000], ['range', 2000]]);
  assert.equal(log[0].via, 'number');
  // 宿題を付けたものは 別の中身
  assert.equal(addShareLog(log, { kind: 'drill', param: homeworkParam }, 4000).length, 3);
});

test('控え: 20 件まで。古いものから消える。1 件ずつ消せる', () => {
  let log = [];
  for (let i = 0; i < SHARE_LOG_MAX + 5; i++) {
    log = addShareLog(log, { kind: 'drill', param: encodeDrillParam({ name: `ドリル${i}`, kanjis: ['k1_1'] }) }, 1000 + i);
  }
  assert.equal(log.length, SHARE_LOG_MAX);
  assert.equal(describeShareEntry(log[0]).name, `ドリル${SHARE_LOG_MAX + 4}`);
  assert.equal(describeShareEntry(log.at(-1)).name, 'ドリル5');
  const removed = removeShareLog(log, shareLogKey(log[0]));
  assert.equal(removed.length, SHARE_LOG_MAX - 1);
  assert.equal(describeShareEntry(removed[0]).name, `ドリル${SHARE_LOG_MAX + 3}`);
  assert.deepEqual(removeShareLog(log, 'drill:nothing'), log);
});

test('控え: こわれた保存データは、読める分だけを残す', () => {
  assert.deepEqual(readShareLog(undefined), []);
  assert.deepEqual(readShareLog('broken'), []);
  const log = readShareLog([
    { kind: 'drill', param: drillParam, at: 5 },
    null, 'text', { kind: 'drill' }, { kind: 'other', param: drillParam, at: 9 },
    { kind: 'drill', param: 'not-a-link', at: 9 },
    { kind: 'range', param: drillParam, at: 9 }, // 種類と中身が合わない
    { kind: 'drill', param: 'x'.repeat(5000), at: 9 },
    { kind: 'drill', param: drillParam, at: 1 }, // 同じ中身の 2 件め
    { kind: 'range', param: rangeParam, at: '7', via: 'fax' },
  ]);
  assert.deepEqual(log, [{ kind: 'range', param: rangeParam, at: 7, via: 'link' }, { kind: 'drill', param: drillParam, at: 5, via: 'link' }]);
  // 足せないものを足そうとしても、いまの控えは残る
  assert.deepEqual(addShareLog(log, { kind: 'drill', param: '' }, 10), log);
  assert.deepEqual(addShareLog(log, null, 10), log);
});

test('控え: もう一度 配る URL は、配ったときの URL と同じ', () => {
  assert.equal(shareEntryUrl({ kind: 'drill', param: homeworkParam }, BASE), buildDrillShareUrl(homework, BASE));
  assert.equal(shareEntryUrl({ kind: 'range', param: rangeParam }, `${BASE}?drill=old#x`), buildRangeShareUrl(range, BASE));
  assert.equal(shareEntryUrl({ kind: 'drill', param: 'broken' }, BASE), null);
  assert.equal(shareEntryUrl({ kind: 'drill', param: drillParam }, ''), null);
});

// ── 段から マイドリル・プリントを作る ──
// 範囲の 1 段は そのまま 週の小テストの範囲になる。前は 同じ字を マイドリルで えらびなおす必要があった。

test('段から作るドリルの名前: 「範囲の名前 ◯だんめ」。40 字に収め、「◯だんめ」は けずらない', () => {
  assert.equal(stageDrillName('3年 2学期', 0), '3年 2学期 1だんめ');
  assert.equal(stageDrillName('  3年　2学期  ', 11), '3年 2学期 12だんめ');
  assert.equal(stageDrillName('', 2), 'ならった範囲 3だんめ');
  assert.equal(stageDrillName(undefined, 0), 'ならった範囲 1だんめ');
  const long = stageDrillName('あ'.repeat(40), 39);
  assert.equal([...long].length, 40);
  assert.ok(long.endsWith(' 40だんめ'));
});

test('段を ドリルの形にする。字の無い段は 作らない', () => {
  assert.deepEqual(stageToDrill(range, 0), { name: '3年 2学期 1だんめ', kanjis: ['k3_1', 'k3_2'] });
  assert.deepEqual(stageToDrill(range, 1), { name: '3年 2学期 2だんめ', kanjis: ['k3_3'] });
  assert.equal(stageToDrill(range, 2), null);
  assert.equal(stageToDrill({ name: 'x', stages: [{ from: '2026-11-17', kanjis: [] }] }, 0), null);
  assert.equal(stageToDrill(null, 0), null);
  // もとの段の字の ならびを 書きかえない
  const made = stageToDrill(range, 0);
  made.kanjis.push('k1_1');
  assert.deepEqual(range.stages[0].kanjis, ['k3_1', 'k3_2']);
});

test('マイドリルに足す: 名前も字も同じドリルが あれば 足さない（2 回 おしても 2 つ できない）', () => {
  const made = stageToDrill(range, 0);
  const first = addStageDrill([{ name: 'ほかのドリル', kanjis: ['k1_1'] }], made, 123);
  assert.equal(first.added, true);
  assert.deepEqual(first.drills.at(-1), { name: '3年 2学期 1だんめ', kanjis: ['k3_1', 'k3_2'], createdAt: 123 });
  const second = addStageDrill(first.drills, made, 456);
  assert.equal(second.added, false);
  assert.equal(second.drills.length, 2);
  // 段の字を直したあとは、別のドリルとして足す
  const changed = addStageDrill(first.drills, { ...made, kanjis: ['k3_1'] }, 789);
  assert.equal(changed.added, true);
  assert.equal(changed.drills.length, 3);
  // 同じ名前でも、受け取った宿題のドリルとは まぜない
  const withHomework = addStageDrill([{ ...made, homework: { due: '2026-12-01', mode: 'practice' } }], made, 1);
  assert.equal(withHomework.added, true);
  assert.deepEqual(addStageDrill(undefined, null), { drills: [], added: false });
});

// ── 画面への つなぎ（ソースを読んで確かめる） ──

import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const code = (path) => read(path).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

test('控えに残す所: リンクで配る・ならった範囲を配る・4けたの数字で送る', () => {
  const drillShare = code('../src/components/social/DrillShareView.jsx');
  const range = code('../src/components/social/RangeEditorView.jsx');
  const host = code('../src/components/social/TeacherHostView.jsx');
  const panel = code('../src/components/social/ShareLinkPanel.jsx');
  assert.match(drillShare, /useShareLogging\(setStats, 'drill', shareUrl && sharedDrill \? encodeDrillParam\(sharedDrill\) : null\)/);
  assert.match(drillShare, /onShared=\{recordShared\}/);
  // 範囲は、配る画面（リンクを作ったあと）に いるあいだだけ
  assert.match(range, /useShareLogging\(setStats, 'range', step === 'share' && range && shareUrl \? encodeRangeParam\(range\) : null\)/);
  assert.match(range, /onShared=\{recordShared\}/);
  // 数字で送るのは、送れたときだけ
  assert.match(host, /record\(\{ kind: 'drill', param: encodeDrillParam\(drill\), via: 'number' \}\)/);
  assert.match(host, /setStatus\(\{ tone: 'sent'[^}]*\}\);\s*audioCtrl\.playSE\('success'\);\s*recordRef\.current\?\.\(\);/);
  // URL のコピー・Classroom の共有を開いたときに 合図を出す
  assert.equal((panel.match(/onShared\?\.\(\)/g) || []).length, 2);
  // App は setStats を わたすだけ（控えの計算は あとから読む束に置く。入口の束は上限 220KiB）
  const app = read('../src/App.jsx');
  assert.match(app, /<DrillShareView setView=\{setView\} drill=\{hostDrill\} setHostDrill=\{setHostDrill\} setStats=\{setStats\} \/>/);
  assert.match(app, /<TeacherHostView setView=\{setView\} drill=\{hostDrill\} setStats=\{setStats\} \/>/);
  assert.ok(!/share-log|range-tools|lesson-mode|LessonMode|ShareLogDialog|useShareRecorder/.test(app), 'App.jsx が 先生向けの部品を じかに読んでいる');
});

test('控えの画面: マイドリルから開き、リンク・QR を もう一度 出せる。範囲は 直して配りなおせる', () => {
  const drills = code('../src/components/pages/MyDrillsView.jsx');
  const dialog = code('../src/components/social/ShareLogDialog.jsx');
  assert.match(drills, /const ShareLogDialog = lazy\(\(\) => import\('\.\.\/social\/ShareLogDialog'\)\);/);
  assert.match(drills, /<ShareLogDialog stats=\{stats\} setStats=\{setStats\} setView=\{setView\} onClose=/);
  assert.match(dialog, /readShareLog\(stats\.shareLog\)/);
  assert.match(dialog, /shareEntryUrl\(open\.entry, `\$\{window\.location\.origin\}\$\{window\.location\.pathname\}`\)/);
  assert.match(dialog, /<ShareLinkPanel\b/);
  assert.match(dialog, /removeShareLog\(prev\.shareLog, key\)/);
  // 下書きに もどすときは、たしかめてから（いまの下書きが おきかわる）
  assert.match(dialog, /confirm === 'draft'/);
  assert.match(dialog, /rangeDraft: \{ name: info\.name, stages: info\.stages\.map/);
  // 控えの画面は 何も配らない（開いただけで 控えを ふやさない）
  assert.ok(!/onShared=|useShareLogging|addShareLog/.test(dialog));
});

test('段を そのまま使う: マイドリルにする・プリントにする・授業で うつす', () => {
  const range = code('../src/components/social/RangeEditorView.jsx');
  assert.match(range, /const PrintTestView = lazy\(\(\) => import\('\.\.\/pages\/PrintTestView'\)\);/);
  assert.match(range, /const LessonMode = lazy\(\(\) => import\('\.\.\/lesson\/LessonMode'\)\);/);
  assert.match(range, /addStageDrill\(prev\.myDrills, drill\)\.drills/);
  assert.match(range, /setPrintDrill\(stageToDrill\(draft, i\)\)/);
  assert.match(range, /setLesson\(\{ title: drill\.name, kanjiIds: drill\.kanjis \}\)/);
  // 字の無い段には 出さない
  assert.match(range, /\{stage\.kanjis\.length > 0 && \(\s*<div[^>]*data-testid="range-stage-tools"/);
  // プリントから もどると、範囲の画面に もどる（マイドリルへ とばない）
  assert.match(range, /<PrintTestView drill=\{printDrill\} setView=\{setView\} onBack=\{\(\) => setPrintDrill\(null\)\} backLabel="ならった範囲に戻る" \/>/);
  const print = code('../src/components/pages/PrintTestView.jsx');
  assert.match(print, /if \(onBack\) onBack\(\); else setView\('myDrills'\);/);
  assert.ok(!/onClick=\{\(\) => setView\('myDrills'\)\}/.test(print), 'もどるボタンが onBack を通っていない');
});

test('受け取った範囲: 日付が来た段だけ マイドリルに入り、あとの段は その日に入る', async () => {
  const { syncRangeDrills, withRangeDrills } = await import('../src/systems/range-tools.js');
  const range = {
    name: '1年 1学期',
    stages: [
      { from: '2026-11-01', kanjis: ['k1_1', 'k1_2'] },
      { from: '2026-11-10', kanjis: ['k1_3'] },
      { from: '2026-11-20', kanjis: ['k1_4', 'k1_5'] },
    ],
  };
  const first = syncRangeDrills([], range, '2026-11-10', 5);
  assert.deepEqual(first.added, ['1年 1学期 1だんめ', '1年 1学期 2だんめ']);
  assert.deepEqual(first.drillStages, [0, 1]);
  assert.deepEqual(first.drills.map((d) => d.kanjis), [['k1_1', 'k1_2'], ['k1_3']]);
  // 日付の前の段は 入れない（字を 先に見せない）
  assert.equal(syncRangeDrills(first.drills, { ...range, drillStages: first.drillStages }, '2026-11-19'), null);
  // その日が来たら 入る
  const later = syncRangeDrills(first.drills, { ...range, drillStages: first.drillStages }, '2026-11-20');
  assert.deepEqual(later.added, ['1年 1学期 3だんめ']);
  assert.deepEqual(later.drillStages, [0, 1, 2]);
  // 児童が けした ドリルは、もう一度 入れない
  assert.equal(syncRangeDrills([], { ...range, drillStages: [0, 1, 2] }, '2026-12-01'), null);
  // 同じ ドリルが もう あれば 足さない（番号は のこす）
  const dup = syncRangeDrills(first.drills, range, '2026-11-10');
  assert.deepEqual(dup.added, []);
  assert.equal(dup.drills.length, 2);
  assert.deepEqual(dup.drillStages, [0, 1]);
  // 範囲が無いときは 何もしない
  assert.equal(syncRangeDrills([], null, '2026-11-10'), null);

  const stats = { myDrills: [{ name: 'じぶんの', kanjis: ['k2_1'], createdAt: 1 }], settings: { volume: 0.5, learningRange: range } };
  const applied = withRangeDrills(stats, '2026-11-01', 7);
  assert.equal(applied.stats.myDrills.length, 2);
  assert.equal(applied.stats.myDrills[0].name, 'じぶんの');
  assert.equal(applied.stats.settings.volume, 0.5);
  assert.deepEqual(applied.stats.settings.learningRange.drillStages, [0]);
  assert.equal(stats.myDrills.length, 1, '元の stats は かえない');
  assert.equal(withRangeDrills(applied.stats, '2026-11-01'), null);
});

test('受け取った範囲の段を マイドリルに入れる画面の つなぎ', async () => {
  const { readFileSync } = await import('node:fs');
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  assert.match(read('../src/components/social/RangeImportView.jsx'), /const newStats = withRangeDrills\(received, today\)\?\.stats \|\| received;/);
  const home = read('../src/components/social/HomeAssignments.jsx');
  assert.match(home, /const next = withRangeDrills\(prev, today\)\?\.stats;/);
  assert.match(read('../src/components/pages/HomeView.jsx'), /grade=\{selectedGrade\} setStats=\{setStats\} \/>/);
});
