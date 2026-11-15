import test from 'node:test';
import assert from 'node:assert/strict';
import { DRILL_KANJI_MAX_COUNT } from '../src/systems/drill-share.js';
import {
  CHECK_MARKS,
  P2P_MESSAGE_MAX_LENGTH,
  buildDrillMessage,
  drillCheckCode,
  parseDrillMessage,
  sanitizeDrill,
} from '../src/systems/drill-p2p.js';

// 「4けたの数字で送る」で受け取ったドリルは、公開サーバーの上で数字だけを頼りに
// つながった相手から来る外部入力。リンクと同じ検証に通してから保存する。

test('受け取ったドリルは name と kanjis だけを、形を確かめて残す', () => {
  assert.deepEqual(
    sanitizeDrill({ name: ' 1年\nまとめ ', kanjis: ['k1_1', 'k1_1', 'k9_999', 42, 'k2_10'], pad: 'あ'.repeat(10), createdAt: 1 }),
    { name: '1年 まとめ', kanjis: ['k1_1', 'k2_10'] },
  );
  assert.equal(sanitizeDrill({ name: '', kanjis: ['k1_1'] }), null);
  assert.equal(sanitizeDrill({ name: 'x', kanjis: [] }), null);
  assert.equal(sanitizeDrill({ name: 'x', kanjis: 'k1_1' }), null);
  assert.equal(sanitizeDrill(['k1_1']), null);
  assert.equal(sanitizeDrill(null), null);
  const many = Array.from({ length: 400 }, (_, i) => `k3_${i + 1}`);
  assert.equal(sanitizeDrill({ name: 'おおい', kanjis: many }).kanjis.length, DRILL_KANJI_MAX_COUNT);
});

test('送るメッセージはリンクと同じ形で、受け取ると同じドリルに戻る', () => {
  const drill = { name: 'テスト', kanjis: ['k1_1', 'k1_2', 'k2_10'], createdAt: 123 };
  const raw = buildDrillMessage(drill);
  const msg = JSON.parse(raw);
  assert.equal(msg.type, 'drill');
  assert.equal(typeof msg.param, 'string');
  // 更新前の版の受け手のために data も入れておく（余分な欄は落とす）
  assert.deepEqual(msg.data, { name: 'テスト', kanjis: ['k1_1', 'k1_2', 'k2_10'] });
  assert.deepEqual(parseDrillMessage(raw), { name: 'テスト', kanjis: ['k1_1', 'k1_2', 'k2_10'] });
  assert.equal(buildDrillMessage({ name: '', kanjis: [] }), null);
});

test('更新前の版の先生から来る data だけのメッセージも、検証して受け取る', () => {
  const old = JSON.stringify({ type: 'drill', data: { name: 'むかしの', kanjis: ['k1_3', 'bad'], extra: { a: 1 } } });
  assert.deepEqual(parseDrillMessage(old), { name: 'むかしの', kanjis: ['k1_3'] });
});

test('大きすぎる・壊れている・形が違うメッセージは開かずに捨てる', () => {
  // 調査で再現した「極端に大きいデータで以後の保存が止まる」形
  const huge = JSON.stringify({ type: 'drill', data: { name: 'x', kanjis: ['k1_1'], pad: 'あ'.repeat(P2P_MESSAGE_MAX_LENGTH) } });
  assert.equal(parseDrillMessage(huge), null);
  assert.equal(parseDrillMessage('{not json'), null);
  assert.equal(parseDrillMessage(JSON.stringify({ type: 'chat', data: { name: 'x', kanjis: ['k1_1'] } })), null);
  assert.equal(parseDrillMessage(JSON.stringify({ type: 'drill', param: '!!!' })), null);
  assert.equal(parseDrillMessage({ type: 'drill', data: { name: 'x', kanjis: ['k1_1'] } }), null);
  assert.equal(parseDrillMessage(null), null);
});

test('かくにんのしるしは、送る側と受け取る側で同じになり、中身が違えばたいてい変わる', () => {
  const drill = { name: 'テスト', kanjis: ['k1_1', 'k1_2', 'k2_10'] };
  const received = parseDrillMessage(buildDrillMessage(drill));
  const code = drillCheckCode(drill);
  assert.equal(drillCheckCode(received), code);
  assert.equal([...code].length, 2);
  for (const mark of code) assert.ok(CHECK_MARKS.includes(mark));
  // 余分な欄や重複があっても、中身が同じなら同じしるし
  assert.equal(drillCheckCode({ ...drill, kanjis: [...drill.kanjis, 'k1_1'], createdAt: 9 }), code);
  // 中身の違う 200 通りで、しるしが全部同じになることはない
  const codes = new Set(Array.from({ length: 200 }, (_, i) => drillCheckCode({ name: `d${i}`, kanjis: ['k1_1'] })));
  assert.ok(codes.size > 50, `しるしの種類が少なすぎる: ${codes.size}`);
  assert.equal(drillCheckCode({ name: '', kanjis: [] }), '');
});
