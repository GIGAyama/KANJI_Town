import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveThemeColor } from '../src/utils/theme-colors.js';
import { THEMES, LIGHT_SATISFACTION_COLORS, themeCssVars } from '../src/constants/themes.js';

test('DOMがない環境では既定のテーマ色にフォールバックする', () => {
  assert.equal(resolveThemeColor('--text'), '#292f36');
  assert.equal(resolveThemeColor('--secondary'), THEMES.default['--secondary']);
  assert.equal(resolveThemeColor('--bg'), '#fdfbf7');
});

test('未知の変数名でもキャンバスで使える色を返す', () => {
  assert.equal(resolveThemeColor('--unknown-variable'), '#292f36');
});

// ── WCAG 2.x のコントラスト比 ──
function luminance(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const AA = 4.5;
const isLight = (theme) => luminance(theme['--panel']) > 0.5;

test('コントラスト比の計算が WCAG の値と合う', () => {
  assert.equal(contrast('#ffffff', '#000000').toFixed(1), '21.0');
  // 調査で測った以前の既定テーマの値
  assert.equal(contrast('#ffffff', '#ef4444').toFixed(2), '3.76');
  assert.equal(contrast('#ffffff', '#10b981').toFixed(2), '2.54');
});

for (const [name, theme] of Object.entries(THEMES)) {
  test(`テーマ「${name}」: ボタンの文字（--panel）が --primary・--secondary の地で 4.5:1 以上`, () => {
    // MotionButton の primary / success は、この地にこの文字で描く。
    // 明るいテーマの --panel は白なので、これが「白い文字」の検査になる。
    for (const bg of ['--primary', '--secondary']) {
      const ratio = contrast(theme['--panel'], theme[bg]);
      assert.ok(ratio >= AA, `${name} ${bg} ${theme[bg]} の上の文字 ${theme['--panel']}: ${ratio.toFixed(2)}:1`);
    }
  });

  if (isLight(theme)) {
    test(`テーマ「${name}」: 白い文字が --primary・--secondary の地で 4.5:1 以上`, () => {
      for (const bg of ['--primary', '--secondary']) {
        const ratio = contrast('#ffffff', theme[bg]);
        assert.ok(ratio >= AA, `${name} ${bg} ${theme[bg]}: ${ratio.toFixed(2)}:1`);
      }
    });
  }

  test(`テーマ「${name}」: 文字の色がページの地とパネルの上で 4.5:1 以上`, () => {
    const fgs = ['--text', '--text-muted', '--primary', '--secondary'];
    for (const fg of fgs) {
      for (const bg of ['--bg', '--panel']) {
        const ratio = contrast(theme[fg], theme[bg]);
        assert.ok(ratio >= AA, `${name} ${fg} ${theme[fg]} on ${bg} ${theme[bg]}: ${ratio.toFixed(2)}:1`);
      }
    }
  });

  test(`テーマ「${name}」: --accent の地の上の文字（--text）が 4.5:1 以上`, () => {
    const ratio = contrast(theme['--text'], theme['--accent']);
    assert.ok(ratio >= AA, `${name} --text on --accent: ${ratio.toFixed(2)}:1`);
  });

  test(`テーマ「${name}」: 町の満足度の色がパネルの上で 4.5:1 以上`, () => {
    const colors = { ...LIGHT_SATISFACTION_COLORS, ...theme };
    for (const v of ['--sat-0', '--sat-1', '--sat-2', '--sat-3', '--sat-4']) {
      const ratio = contrast(colors[v], theme['--panel']);
      assert.ok(ratio >= AA, `${name} ${v} ${colors[v]}: ${ratio.toFixed(2)}:1`);
    }
  });

  test(`テーマ「${name}」: CSS に書き出す変数がそろっている`, () => {
    const css = themeCssVars(name);
    for (const v of ['--bg', '--primary', '--secondary', '--accent', '--text', '--text-muted', '--panel', '--sat-0', '--sat-4']) {
      assert.match(css, new RegExp(`${v}: #[0-9a-f]{6};`), `${name} に ${v} が無い`);
    }
  });
}

test('index.css の最初の色が、既定テーマの色と同じ', () => {
  // JS が動く前の 1 枚目は index.css の :root で描かれる。ずれると起動の瞬間だけ別の色になる
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
  const expected = { ...LIGHT_SATISFACTION_COLORS, ...THEMES.default };
  for (const [name, value] of Object.entries(expected)) {
    assert.match(root, new RegExp(`${name}: ${value};`), `index.css の ${name} が ${value} ではない`);
  }
});
