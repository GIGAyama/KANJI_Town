import test from 'node:test';
import assert from 'node:assert/strict';
import { isPlainObject, sanitizeStats, validateImportedStats } from '../src/systems/stats-schema.js';

const validBackup = () => ({
  targetGrade: 2,
  totalExp: 9999,
  coins: 120,
  kanjiStats: { k1_1: { status: 'review', interval: 86400000 } },
  townMap: { '1,1': 't_house1' },
  townItems: { t_house1: 2 },
  myDrills: [{ name: 'しゅくだい', kanjis: ['k1_1', 'k1_2'], createdAt: 1 }],
  villagers: [{ kanjiChar: '一' }],
  daily: { '2026-11-01': { exp: 10, reviewed: 2 } },
  achievements: { grade1_all: { claimed: false, current: 3 } },
});

test('このアプリのバックアップは受けつけ、中身は変えない', () => {
  const backup = validBackup();
  const result = validateImportedStats(JSON.parse(JSON.stringify(backup)));
  assert.equal(result.ok, true);
  assert.deepEqual(result.stats, backup);
  assert.deepEqual(result.repaired, []);
});

test('学年や漢字の記録を持たないファイルは、上書きする前に断る', () => {
  // 以前はどれも通り、上書きした直後に記録がすべて消えていた
  for (const raw of [
    { totalExp: 0 },
    { kanjiStats: { k1_1: {} } },
    { targetGrade: 1, totalExp: 10, kanjiStats: 'abc' },
    { targetGrade: 9, totalExp: 10, kanjiStats: {} },
    { targetGrade: 1, kanjiStats: {} },
    [],
    'kanji',
    null,
  ]) {
    assert.equal(validateImportedStats(raw).ok, false, JSON.stringify(raw));
  }
});

test('型の違う欄はその欄だけを捨て、ほかの記録は残す', () => {
  const result = sanitizeStats({
    ...validBackup(),
    townMap: 'xy',
    townItems: 'zz',
    villagers: { a: 1 },
    achievements: 'x',
    myDrills: [null, 'x', { name: 'ok', kanjis: ['k1_1'] }, { name: 'から', kanjis: [] }],
  });
  assert.deepEqual(result.repaired.sort(), ['achievements', 'townItems', 'townMap', 'villagers']);
  assert.equal('townMap' in result.stats, false);
  assert.equal(result.stats.totalExp, 9999);
  assert.deepEqual(Object.keys(result.stats.kanjiStats), ['k1_1']);
  assert.deepEqual(result.stats.myDrills, [{ name: 'ok', kanjis: ['k1_1'] }]);
});

test('数字の欄の文字列は数に直す（"100" に足し算すると "10050" になっていた）', () => {
  const result = sanitizeStats({ ...validBackup(), totalExp: '100', coins: -5, streak: 'abc' });
  assert.equal(result.stats.totalExp, 100);
  assert.equal(result.stats.coins, 0);
  assert.equal('streak' in result.stats, false);
  assert.ok(result.repaired.includes('totalExp'));
  assert.ok(result.repaired.includes('streak'));
});

test('1日の記録の「てきとう書きの回数」も、数でなければその欄だけを捨てる', () => {
  const result = sanitizeStats({
    ...validBackup(),
    daily: {
      '2026-11-15': { exp: 10, reviewed: 3, careless: '2' },
      '2026-11-16': { exp: 10, reviewed: 3, careless: 'たくさん' },
      '2026-11-17': { exp: 10, reviewed: 3, careless: -4 },
    },
  });
  assert.equal(result.stats.daily['2026-11-15'].careless, 2);
  assert.equal('careless' in result.stats.daily['2026-11-16'], false);
  assert.equal(result.stats.daily['2026-11-16'].reviewed, 3);
  assert.equal(result.stats.daily['2026-11-17'].careless, 0);
});

test('中の1件が壊れていても、その1件だけを捨てる', () => {
  const result = sanitizeStats({
    ...validBackup(),
    kanjiStats: { k1_1: { status: 'review' }, k1_2: 'broken', k1_3: null },
    daily: { '2026-01-01': null, '2026-01-02': { exp: '5', reviewed: 'x' } },
    townItems: { t_house1: 2, t_road: 'many' },
  });
  assert.deepEqual(Object.keys(result.stats.kanjiStats), ['k1_1']);
  assert.deepEqual(result.stats.daily, { '2026-01-02': { exp: 5 } });
  assert.deepEqual(result.stats.townItems, { t_house1: 2 });
});

test('__proto__ などのキーは持ちこまない', () => {
  const raw = JSON.parse('{"targetGrade":1,"totalExp":0,"kanjiStats":{"__proto__":{"polluted":true}},"__proto__":{"polluted":true},"constructor":1}');
  const result = validateImportedStats(raw);
  assert.equal(result.ok, true);
  assert.equal(Object.hasOwn(result.stats, '__proto__'), false);
  assert.equal(Object.hasOwn(result.stats, 'constructor'), false);
  assert.equal(Object.hasOwn(result.stats.kanjiStats, '__proto__'), false);
  assert.equal({}.polluted, undefined);
});

test('isPlainObject は配列や null を対象にしない', () => {
  assert.equal(isPlainObject({}), true);
  assert.equal(isPlainObject(Object.create(null)), true);
  assert.equal(isPlainObject([]), false);
  assert.equal(isPlainObject(null), false);
  assert.equal(isPlainObject('a'), false);
});
