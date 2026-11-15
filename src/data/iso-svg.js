// 建物の絵（SVG）。ファイル内の見出しごとに src/data/iso-svg/ の下へ分けてある。
// town-items.jsx が import('./iso-svg') の 1 か所から読むので、分けても遅延チャンクは 1 本のまま。
export * from './iso-svg/terrain.jsx';
export * from './iso-svg/nature.jsx';
export * from './iso-svg/structures.jsx';
export * from './iso-svg/economy.jsx';
export * from './iso-svg/special.jsx';
export * from './iso-svg/commercial.jsx';
export * from './iso-svg/public.jsx';
export * from './iso-svg/modern.jsx';
export * from './iso-svg/leisure.jsx';
export * from './iso-svg/vehicles.jsx';
export * from './iso-svg/street.jsx';
