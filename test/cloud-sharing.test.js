import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeShareToken,
  formatShareToken,
  hashShareToken,
  normalizeShareToken,
} from '../src/systems/cloud-sharing.js';

test('80bitの招待値を読み間違えにくい16文字へ変換する', () => {
  const token = encodeShareToken(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
  assert.equal(token.length, 16);
  assert.match(token, /^[A-HJ-NP-Z2-9]{16}$/);
  assert.equal(formatShareToken(token).split('-').length, 4);
});

test('招待コードは空白とハイフンを除去して正規化する', () => {
  assert.equal(normalizeShareToken('abcd-efgh-jkmn-pqrs'), 'ABCDEFGHJKMNPQRS');
  assert.equal(normalizeShareToken('IIII-OOOO-1111-0000'), null);
  assert.equal(normalizeShareToken('short'), null);
});

test('招待コードはSHA-256でサーバー保存用ハッシュにする', async () => {
  const left = await hashShareToken('ABCD-EFGH-JKMN-PQRS');
  const right = await hashShareToken('abcdefghjkmnpqrs');
  assert.equal(left, right);
  assert.match(left, /^[0-9a-f]{64}$/);
});
