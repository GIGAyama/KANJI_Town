// まだ ひらいていない土地（森林・荒れ地・岩盤）に立つ、木や岩の絵のおおもと — マイ漢字タウン
// React に依存しない（components/town/WildProps.jsx が使い、test/ から確かめる）。
//
// 子どもが置いた木（t_tree など）と見分けがつくよう、小さめ・暗めの色で、かたまって生やす。
//
// ⚠️ ここで作る文字列は innerHTML に入れる。色と形は、すべてこのファイルの中の値から作る。

import { cellHash } from '../systems/town-ground-paint.js';

const OUTLINE = '#17301f';
const conifer = (x, y, s, light, dark) => {
  const p = (px, py) => `${(x + px * s).toFixed(1)} ${(y + py * s).toFixed(1)}`;
  const tier = (top, base, half) => `M${p(0, top)}L${p(-half, base)}Q${p(0, base + 2.2)} ${p(half, base)}Z`;
  const half = (top, base, w) => `M${p(0, top)}L${p(w, base)}Q${p(w * 0.5, base + 1.6)} ${p(0, base + 1.1)}Z`;
  return `<path d="M${p(-1.3, -1)}h${(2.6 * s).toFixed(1)}v${(4 * s).toFixed(1)}h${(-2.6 * s).toFixed(1)}Z" fill="#7a5230" stroke="${OUTLINE}" stroke-width="1" stroke-linejoin="round"/>`
    + `<path d="${tier(-12, -2, 7.2)}${tier(-18, -8.5, 5.8)}${tier(-23.5, -14.5, 4.2)}" fill="${light}" stroke="${OUTLINE}" stroke-width="1.2" stroke-linejoin="round"/>`
    + `<path d="${half(-12, -2, 7.2)}${half(-18, -8.5, 5.8)}${half(-23.5, -14.5, 4.2)}" fill="${dark}"/>`;
};
const roundTree = (x, y, s, light, dark, shine) => {
  const c = (cx, cy, r, fill, extra = '') => `<circle cx="${(x + cx * s).toFixed(1)}" cy="${(y + cy * s).toFixed(1)}" r="${(r * s).toFixed(1)}" fill="${fill}"${extra}/>`;
  const line = ` stroke="${OUTLINE}" stroke-width="1.2"`;
  return `<path d="M${(x - 1.4 * s).toFixed(1)} ${(y + 3 * s).toFixed(1)}v${(-9 * s).toFixed(1)}h${(2.8 * s).toFixed(1)}v${(9 * s).toFixed(1)}Z" fill="#7a5230" stroke="${OUTLINE}" stroke-width="1" stroke-linejoin="round"/>`
    + c(-4.6, -9, 5.6, dark, line) + c(4.8, -9.4, 5.4, dark, line) + c(0, -14, 6.6, dark, line)
    + c(-4.6, -9, 4.9, light) + c(4.8, -9.4, 4.7, dark) + c(0, -14, 5.9, light)
    + c(2.4, -11.6, 4.6, dark) + c(-2.2, -15.6, 2.4, shine);
};
const bush = (x, y, s, light, dark) => {
  const f = (v) => v.toFixed(1);
  return `<path d="M${f(x - 7 * s)} ${f(y + 1.5 * s)}q${f(-2.2 * s)} ${f(-4.6 * s)} ${f(2.4 * s)} ${f(-5.6 * s)}q${f(1.6 * s)} ${f(-4.2 * s)} ${f(5.2 * s)} ${f(-2 * s)}q${f(4.4 * s)} ${f(-1.6 * s)} ${f(5 * s)} ${f(2.8 * s)}q${f(3 * s)} ${f(2.2 * s)} ${f(0.6 * s)} ${f(4.8 * s)}Z" fill="${light}" stroke="${OUTLINE}" stroke-width="1.1" stroke-linejoin="round"/>`
    + `<path d="M${f(x + 0.4 * s)} ${f(y - 5.6 * s)}q${f(4.4 * s)} ${f(-1.4 * s)} ${f(5 * s)} ${f(2.6 * s)}q${f(3 * s)} ${f(2.2 * s)} ${f(0.6 * s)} ${f(4.6 * s)}h${f(-5.8 * s)}q${f(2 * s)} ${f(-3.6 * s)} ${f(0.2 * s)} ${f(-7.2 * s)}Z" fill="${dark}"/>`;
};
const boulder = (x, y, s, top, left, right) => {
  const p = (px, py) => `${(x + px * s).toFixed(1)} ${(y + py * s).toFixed(1)}`;
  return `<path d="M${p(-8, 1)}L${p(-6.4, -6)}L${p(-1, -9.6)}L${p(5.4, -7.4)}L${p(8.4, -1)}L${p(4.6, 3)}L${p(-4.4, 3.2)}Z" fill="${left}" stroke="#1f2733" stroke-width="1.2" stroke-linejoin="round"/>`
    + `<path d="M${p(-1, -9.6)}L${p(5.4, -7.4)}L${p(8.4, -1)}L${p(4.6, 3)}L${p(1.2, -2.6)}Z" fill="${right}"/>`
    + `<path d="M${p(-6.4, -6)}L${p(-1, -9.6)}L${p(5.4, -7.4)}L${p(1.2, -2.6)}L${p(-3.6, -3.4)}Z" fill="${top}"/>`;
};

const G = { light: '#5fae4e', dark: '#3f8a3e', shine: '#86cf6c' };
const D = { light: '#4f9d4b', dark: '#357a38', shine: '#74c064' };

/** 絵の名前 → 中身。原点は「マスのまん中の地面」。 */
const ART = {
  'forest-a': conifer(-9, -3, 0.82, D.light, D.dark) + conifer(8, 2, 1.05, G.light, G.dark),
  'forest-b': roundTree(-6, 0, 1.02, G.light, G.dark, G.shine) + bush(10, 4, 0.7, D.light, D.dark),
  'forest-c': conifer(0, -5, 0.8, D.light, D.dark) + conifer(-11, 1, 0.9, G.light, G.dark) + conifer(11, 3, 0.86, D.light, D.dark),
  'forest-d': roundTree(7, -3, 0.86, D.light, D.dark, D.shine) + conifer(-8, 2, 1, G.light, G.dark),
  'scrub-a': bush(0, 3, 0.86, '#a9b257', '#8a9442'),
  'scrub-b': boulder(-4, 3, 0.7, '#c9c3b9', '#a59f95', '#8b857c') + bush(8, 4, 0.56, '#a9b257', '#8a9442'),
  'boulder-a': boulder(0, 3, 1, '#a9b3c1', '#7f8998', '#626c7b'),
  'boulder-b': boulder(-6, 1, 0.74, '#a9b3c1', '#7f8998', '#626c7b') + boulder(7, 4, 0.6, '#9aa4b3', '#737d8c', '#58616f'),
};

/** 絵の枠（原点は「マスのまん中の地面」） */
export const WILD_PROP_BOX = Object.freeze({ x: -32, y: -44, width: 64, height: 54 });

/** 絵の名前の一覧 */
export const WILD_PROP_NAMES = Object.freeze(Object.keys(ART));

/** そのまま <svg> に入れられる形（<symbol id="wp-名前">）にする */
export function wildPropsMarkup() {
  const { x, y, width, height } = WILD_PROP_BOX;
  return Object.entries(ART)
    .map(([name, body]) => `<symbol id="wp-${name}" viewBox="${x} ${y} ${width} ${height}" overflow="visible">${body}</symbol>`)
    .join('');
}

/**
 * そのマスに立てる絵の名前を返す（無ければ null）。同じマスなら、いつも同じ絵になる。
 * @param {string} terrainId 地図に書いてある地形の id
 */
export function wildPropFor(terrainId, x, y) {
  const pick = cellHash(x, y, 500);
  if (terrainId === 't_forest_floor') return `forest-${'abcd'[Math.floor(pick * 4)]}`;
  if (terrainId === 't_roughland') return pick < 0.22 ? 'scrub-a' : pick < 0.4 ? 'scrub-b' : null;
  if (terrainId === 't_bedrock') return pick < 0.35 ? 'boulder-a' : pick < 0.6 ? 'boulder-b' : null;
  return null;
}
