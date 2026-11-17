// 町の絵（SVG）。種類ごとに src/data/iso-svg/ の下へ分けてある。
// town-items.jsx が import('./iso-svg') の 1 か所から読むので、分けても遅延チャンクは 1 本のまま。
//   terrain・structures : 地形と、平らなアイテムの見本・「小さな家」
//   nature              : 木・花・岩など（絵は nature-art.js）
//   buildings           : 建物 69 種と 小さなもの 23 種（絵は buildings-art.js・props-art.js、部品は kit.js）
import { mountSharedDefs } from './iso-svg/shared.jsx';

// 絵が参照する影・光・グラデーション（url(#…)）を、文書に 1 回だけ置く
mountSharedDefs();

export * from './iso-svg/terrain.jsx';
export * from './iso-svg/nature.jsx';
export * from './iso-svg/structures.jsx';
export * from './iso-svg/buildings.jsx';
