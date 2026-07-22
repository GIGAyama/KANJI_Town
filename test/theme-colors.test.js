import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveThemeColor } from '../src/utils/theme-colors.js';

test('DOMがない環境では既定のテーマ色にフォールバックする', () => {
  assert.equal(resolveThemeColor('--text'), '#292f36');
  assert.equal(resolveThemeColor('--secondary'), '#10b981');
  assert.equal(resolveThemeColor('--bg'), '#fdfbf7');
});

test('未知の変数名でもキャンバスで使える色を返す', () => {
  assert.equal(resolveThemeColor('--unknown-variable'), '#292f36');
});
