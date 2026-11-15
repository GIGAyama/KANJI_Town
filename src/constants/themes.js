// テーマ別の色。App.jsx が <style> に書き出し、canvas 用の色（utils/theme-colors.js）と
// テスト（test/theme-colors.test.js）もここを読む。色を足す・変えるのはここだけにする。
//
// ⚠️ 色を選ぶときの約束（test/theme-colors.test.js が全テーマで確かめる）
//   - ボタンは「--primary / --secondary の地に --panel の文字」で描く（MotionButton の
//     primary・success）。明るいテーマの --panel は白なので、これが「白い文字」になる。
//     ダークテーマだけは --panel が暗い色なので、ボタンの文字も暗い色になる。
//     そのため、地の色に text-white を直接書かないこと（ダークで読めなくなる）。
//   - --primary と --secondary は、文字の色としても --panel と --bg の上で使う。
//   - どれも WCAG AA の 4.5:1 以上。以前は既定テーマの赤 #ef4444 が白文字に 3.76:1、
//     緑 #10b981 が 2.54:1 で、いちばん押してほしいボタンの文字が読みにくかった。
//   - --text-muted は「補足の文字」用。opacity で薄くすると 4.5:1 を割るので、
//     文字を薄く見せたいときは opacity ではなくこれを使う。
export const THEMES = {
  default: {
    '--bg': '#fdfbf7',
    '--primary': '#dc2626',
    '--secondary': '#047857',
    '--accent': '#fbbf24',
    '--text': '#292f36',
    '--text-muted': '#5b6470',
    '--panel': '#ffffff',
  },
  dark: {
    '--bg': '#0f172a',
    '--primary': '#fb7185',
    '--secondary': '#60a5fa',
    // 地に --text（明るい色）の文字をのせるので、ダークでは暗めの琥珀にする
    '--accent': '#92400e',
    '--text': '#e2e8f0',
    '--text-muted': '#94a3b8',
    '--panel': '#1e293b',
    // 満足度の色（systems/residents.js）。暗い地の上で読める明るさにする
    '--sat-4': '#4ade80',
    '--sat-3': '#a3e635',
    '--sat-2': '#facc15',
    '--sat-1': '#fb923c',
    '--sat-0': '#f87171',
  },
  sakura: {
    '--bg': '#fdf2f8',
    '--primary': '#a21caf',
    '--secondary': '#be185d',
    '--accent': '#fbcfe8',
    '--text': '#831843',
    '--text-muted': '#9e486b',
    '--panel': '#ffffff',
  },
  ocean: {
    '--bg': '#f0f9ff',
    '--primary': '#0369a1',
    '--secondary': '#0f766e',
    '--accent': '#7dd3fc',
    '--text': '#0c4a6e',
    '--text-muted': '#356988',
    '--panel': '#ffffff',
  },
  sunset: {
    '--bg': '#fff7ed',
    '--primary': '#c2410c',
    '--secondary': '#a16207',
    '--accent': '#fcd34d',
    '--text': '#7c2d12',
    '--text-muted': '#96553e',
    '--panel': '#ffffff',
  },
  gold: {
    '--bg': '#fefce8',
    '--primary': '#b45309',
    '--secondary': '#854d0e',
    '--accent': '#fef08a',
    '--text': '#713f12',
    '--text-muted': '#885d34',
    '--panel': '#ffffff',
  },
};

/** 明るいテーマで使う満足度の色（白い地の上で 4.5:1 以上）。index.css の :root と同じ値 */
export const LIGHT_SATISFACTION_COLORS = {
  '--sat-4': '#15803d',
  '--sat-3': '#4d7c0f',
  '--sat-2': '#a16207',
  '--sat-1': '#c2410c',
  '--sat-0': '#b91c1c',
};

export const DEFAULT_THEME = 'default';

/** テーマ名 → :root に書く CSS 変数の宣言（例: "--bg: #fdfbf7; --primary: …;"） */
export function themeCssVars(themeName) {
  const theme = THEMES[themeName] || THEMES[DEFAULT_THEME];
  const vars = { ...LIGHT_SATISFACTION_COLORS, ...theme };
  return Object.entries(vars).map(([name, value]) => `${name}: ${value};`).join(' ');
}
