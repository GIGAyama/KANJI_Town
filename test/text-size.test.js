import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FONT_SCALES, getFontScale, getFontScaleId } from '../src/utils/text-size.js';

test('文字の大きさは3段階。知らない値は「ふつう」', () => {
  assert.deepEqual(Object.keys(FONT_SCALES), ['normal', 'large', 'xlarge']);
  assert.equal(getFontScaleId(undefined), 'normal');
  assert.equal(getFontScaleId({ fontScale: 'huge' }), 'normal');
  assert.equal(getFontScaleId({ fontScale: 'toString' }), 'normal');
  assert.equal(getFontScale({ fontScale: 'large' }), 1.15);
  assert.equal(getFontScale({ fontScale: 'xlarge' }), 1.3);
});

test('倍率は rem の基準（html）に掛ける。提示モードも html に付ける', () => {
  // body に掛けると Tailwind の text-*（rem）は大きくならない（提示モードがそうだった）
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  const html = css.slice(css.indexOf('\nhtml {'), css.indexOf('}', css.indexOf('\nhtml {')));
  assert.match(html, /font-size:\s*calc\(100% \* var\(--font-scale, 1\) \* var\(--presentation-scale, 1\)\)/);
  assert.match(css, /html\.presentation\s*\{\s*--presentation-scale:\s*1\.5;/);
  assert.doesNotMatch(css, /\n\.presentation\s*\{\s*font-size/);
  const toggle = readFileSync(new URL('../src/components/ui/PresentationToggle.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(toggle, /document\.body\.classList/);
});
