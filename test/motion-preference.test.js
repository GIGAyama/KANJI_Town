import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMotionPreference,
  shouldReduceMotion,
} from '../src/utils/motion-preference.js';

test('未設定・不正な値は端末設定に合わせる', () => {
  assert.equal(getMotionPreference(), 'system');
  assert.equal(getMotionPreference({ motionPreference: 'unknown' }), 'system');
  assert.equal(shouldReduceMotion('system', true), true);
  assert.equal(shouldReduceMotion('system', false), false);
});

test('手動設定は端末設定より優先される', () => {
  assert.equal(shouldReduceMotion('reduced', false), true);
  assert.equal(shouldReduceMotion('full', true), false);
});
