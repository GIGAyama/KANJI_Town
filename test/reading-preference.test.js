import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isReadingCheckEnabled,
  isAutoPlayEnabled,
} from '../src/utils/reading-preference.js';

test('音読チャレンジは未設定ならON', () => {
  assert.equal(isReadingCheckEnabled(), true);
  assert.equal(isReadingCheckEnabled({}), true);
  assert.equal(isReadingCheckEnabled({ readingCheck: true }), true);
  assert.equal(isReadingCheckEnabled({ readingCheck: false }), false);
});

test('お手本の自動再生は未設定ならON', () => {
  assert.equal(isAutoPlayEnabled(), true);
  assert.equal(isAutoPlayEnabled({}), true);
  assert.equal(isAutoPlayEnabled({ autoPlay: false }), false);
});
