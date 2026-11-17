// 住民（町を歩く人）の絵のおおもと — マイ漢字タウン
// React に依存しない（components/town/VillagerArt.jsx が使い、test/ から確かめる）。
//
// 建物と同じ絵がら（こげ茶の細い線・左上からの光で明暗）の、頭の大きな「ちびキャラ」。
// 職業（6 種）ごとに ぼうし・服・持ちものが ちがい、同じ職業でも はだ・かみ・服の色が 4 通りある。
//
// 座標: 原点は「足もとのまん中の地面」。x は右、y は下（上は負）。1 単位 = 町の拡大率 1 のときの 1px。
// 絵は左を向いている。右を向かせるときは、呼びだす側で左右を うら返す。
//
// 絵は文書に 1 回だけ置き、住民 1 人は <use> で呼びだす（建物・木と同じ作り）。
// ⚠️ 影やフィルター・図形ごとの opacity は使わない。町の住民は 1 人ずつ別の合成レイヤーなので、
//    1 人の中に 合成の単位が増えると、人数分だけ重くなる（うすい色は fill-opacity で書く）。
// ⚠️ ここで作る文字列は innerHTML に入れる。色と形は、すべてこのファイルの中の値から作る。

const INK = '#2b211c';
const f = (v) => String(Math.round(v * 100) / 100);
const pen = (width = 0.9, color = INK) => ` stroke="${color}" stroke-width="${f(width)}" stroke-linejoin="round" stroke-linecap="round"`;
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}"${extra}/>`;
const ellipse = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${extra}/>`;
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"${extra}/>`;
/** うで・柄（え）のような、太さのある線。外がわの線を先に引き、その上に中の色を重ねる */
const limb = (d, color, width) => path(d, 'none', pen(width + 1.5)) + path(d, 'none', pen(width, color));

/** 職業（data/residents.js の id と同じ） */
export const VILLAGER_KINDS = Object.freeze(['farmer', 'merchant', 'craftsman', 'blacksmith', 'scholar', 'legendary']);
/** 職業ごとの色ちがいの数 */
export const VILLAGER_VARIANTS = 4;

const SKINS = [
  { skin: '#ffe2c6', blush: '#ff97a6' },
  { skin: '#f6cda4', blush: '#f58a8f' },
  { skin: '#dfae82', blush: '#e2776f' },
];
const HAIRS = [
  { hair: '#3a2c26', shine: '#6a5348' },
  { hair: '#6b4426', shine: '#9b6a42' },
  { hair: '#a9662f', shine: '#d2924f' },
  { hair: '#2f3a4f', shine: '#566684' },
  { hair: '#c98f3c', shine: '#ecc06c' },
];

// ── 体（どの職業も同じ形。服の色と すその長さだけが ちがう） ──
const shadow = () => ellipse(0, 0.5, 7.4, 2.4, '#1e2a3a', ' fill-opacity=".2"');

/** うしろ髪。bob は かたまで ある髪 */
const backHair = (c, bob) => (bob
  ? path('M-7.9 -20Q-9.4 -11.2 -5.4 -11.4L5.4 -11.4Q9.4 -11.2 7.9 -20Z', c.hair, pen(0.9))
  : '');

const legs = (c) => path('M-4 -5.8h3v4.2h-3z', c.pants, pen(0.8)) + path('M1 -5.8h3v4.2h-3z', c.pants, pen(0.8))
  + ellipse(-3, -1.1, 2.6, 1.5, c.shoes, pen(0.8)) + ellipse(2.6, -1.1, 2.6, 1.5, c.shoes, pen(0.8));

/** 奥の うで（体のうしろ） */
const backArm = (c) => limb('M5.3 -12.2Q7.7 -9.8 6.9 -7.4', c.sleeve || c.cloth, 2.3) + circle(6.9, -6.7, 1.25, c.skin, pen(0.7));
/** 手前の うで */
const frontArm = (c) => limb('M-5.3 -12.4Q-7.8 -10 -7 -7.5', c.sleeve || c.cloth, 2.3) + circle(-7, -6.8, 1.3, c.skin, pen(0.7));

/** 服。robe は 足もとまである長い服（学者・賢者） */
const body = (c, robe) => {
  const hem = robe ? -2.1 : -4.5;
  const wide = robe ? 7 : 6.2;
  return path(`M-5 -13.4Q-${f(wide + 0.9)} -8.4 -${f(wide)} ${f(hem)}Q0 ${f(hem + 1.2)} ${f(wide)} ${f(hem)}Q${f(wide + 0.9)} -8.4 5 -13.4Q0 -14.6 -5 -13.4Z`, c.cloth, pen(0.9))
    + path(`M1.9 -13.9Q4 -13.9 5 -13.4Q${f(wide + 0.9)} -8.4 ${f(wide)} ${f(hem)}Q${f(wide * 0.72)} ${f(hem + 0.5)} ${f(wide * 0.44)} ${f(hem + 0.7)}Q3.8 -9 1.9 -13.9Z`, c.clothDark);
};

const head = (c) => ellipse(0, -19.4, 7.5, 7, c.skin, pen(1));

const face = (c) => ellipse(-3.3, -18.9, 0.95, 1.4, INK) + ellipse(1.3, -18.9, 0.95, 1.4, INK)
  + circle(-3.6, -19.5, 0.4, '#ffffff') + circle(1, -19.5, 0.4, '#ffffff')
  + ellipse(-5, -16.8, 1.3, 0.8, c.blush, ' fill-opacity=".7"') + ellipse(3, -16.8, 1.3, 0.8, c.blush, ' fill-opacity=".7"')
  + path('M-2 -16.4Q-1 -15.4 0 -16.4', 'none', pen(0.7));

/** 前髪。ぼうしを かぶっても、ふちの下から見える */
const frontHair = (c) => path('M-7.5 -19.6Q-8.3 -27 0 -27Q8.3 -27 7.5 -19.6Q6.4 -22.6 3.6 -23.1Q1 -21.5 -2.6 -22.4Q-5.8 -22.5 -7.5 -19.6Z', c.hair, pen(0.9))
  + path('M-4.4 -25.1Q-1.4 -26.2 1.8 -25.4', 'none', pen(0.9, c.shine));

// ── 職業ごとの ぼうし・服のかざり・持ちもの ──
// どれも { colors(tint), wear(c), prop(c), hat(c), top, robe } を持つ。
//   wear … 服の上に重ねるもの（エプロン・おび など）   prop … 手前の手に持つもの
//   top  … ぼうしの いちばん上の高さ（名札を その上に出す）
const KINDS = {
  // 農民: 麦わらぼうし・くわ
  farmer: {
    top: 31,
    colors: (tint) => (tint
      ? { cloth: '#62a374', clothDark: '#4a8a5c', pants: '#4a5f7f' }
      : { cloth: '#5486c4', clothDark: '#3f6ea8', pants: '#445a7a' }),
    wear: () => path('M-3.2 -13.7Q0 -11.2 3.2 -13.7Q0 -12.6 -3.2 -13.7Z', '#ffffff', pen(0.7)),
    prop: () => limb('M-7 -6.3L-9.7 -23.6', '#b07a4c', 1.1)
      + path('M-9.9 -24.4l-3.9 0.9l0.5 2.9l3.7 -1.3z', '#b4bec9', pen(0.8)),
    hat: () => ellipse(0, -24.2, 10.4, 3.1, '#f1cd62', pen(0.9))
      + path('M-10.4 -24.2A10.4 3.1 0 0 0 10.4 -24.2Q0 -22.4 -10.4 -24.2Z', '#d9ae45')
      + path('M-5.5 -24.7Q-5.6 -30.9 0 -30.9Q5.6 -30.9 5.5 -24.7Q0 -23.4 -5.5 -24.7Z', '#f7de86', pen(0.9))
      + path('M-5.5 -25.9Q0 -24.5 5.5 -25.9L5.5 -24.7Q0 -23.4 -5.5 -24.7Z', '#c9563c'),
  },
  // 商人: ぼうし・前かけ・お金のふくろ
  merchant: {
    top: 29,
    colors: (tint) => (tint
      ? { cloth: '#e58f3d', clothDark: '#c9732a', pants: '#6b4a32', cap: '#d0762a', capDark: '#a85a1c' }
      : { cloth: '#3fae8f', clothDark: '#2f9077', pants: '#3c5a52', cap: '#2f9379', capDark: '#22705c' }),
    wear: () => path('M-3.5 -11.8H3.5L4.3 -4.5Q0 -3.5 -4.3 -4.5Z', '#fff6e6', pen(0.7))
      + path('M-1.7 -8.2H1.7V-6H-1.7Z', 'none', pen(0.6, '#c9b99a')),
    prop: () => path('M-9.9 -4.6Q-11.5 -8 -8.9 -9.3Q-8 -10.2 -8.6 -11.1H-5.6Q-6.2 -10.2 -5.3 -9.3Q-2.7 -8 -4.3 -4.6Q-7.1 -3.6 -9.9 -4.6Z', '#f3c64e', pen(0.8))
      + path('M-8.6 -9.4H-5.6', 'none', pen(0.8, '#b9822b'))
      + circle(-7.1, -6.7, 1.15, '#fff3c4', pen(0.5, '#b9822b')),
    hat: (c) => path('M-7.3 -22.5Q-7.7 -28.7 0 -28.7Q7.7 -28.7 7.3 -22.5Q0 -24.6 -7.3 -22.5Z', c.cap, pen(0.9))
      + path('M-8.8 -22Q-4.8 -24.1 -0.6 -23.6Q-3.6 -20.7 -8.8 -22Z', c.capDark, pen(0.9))
      + circle(0, -28.5, 0.9, c.capDark, pen(0.6)),
  },
  // 職人: はちまき・道具のおび・のこぎり
  craftsman: {
    top: 27.5,
    colors: (tint) => (tint
      ? { cloth: '#c9544f', clothDark: '#a8403c', pants: '#3f4656' }
      : { cloth: '#3d5f9a', clothDark: '#2e4a7c', pants: '#3f4656' }),
    wear: () => path('M-1.6 -13.9L0 -9.6L1.6 -13.9', 'none', pen(0.9, '#ffffff'))
      + path('M-6.3 -7.5Q0 -6.2 6.3 -7.5L6.25 -5.9Q0 -4.6 -6.25 -5.9Z', '#8a5a2b', pen(0.7))
      + path('M-0.9 -7.1h1.8v1.6h-1.8z', '#f2c14e', pen(0.5)),
    prop: () => path('M-6.4 -8.6L-12.8 -16.4L-10.6 -17.4L-5 -9.6Z', '#d3dae2', pen(0.8))
      + path('M-11.6 -15.9l0.9 -0.4M-10.4 -14.4l0.9 -0.4M-9.2 -12.9l0.9 -0.4M-8 -11.4l0.9 -0.4', 'none', pen(0.5, '#8c97a4'))
      + path('M-7.9 -5.6l2 -2.9l1.9 1.3l-2 2.9z', '#a9683a', pen(0.8)),
    hat: () => path('M-7.5 -22.6Q0 -25 7.5 -22.6L7.4 -20.8Q0 -23.2 -7.4 -20.8Z', '#ffffff', pen(0.8))
      + path('M7 -22.4l3 -1.4l-0.4 2.2zM7 -21.4l2.8 1.6l-1.8 0.8z', '#ffffff', pen(0.7)),
  },
  // 鍛冶師: ゴーグル・革のエプロン・大きな金づち
  blacksmith: {
    top: 27.5,
    colors: (tint) => (tint
      ? { cloth: '#b9613c', clothDark: '#9a4b2b', pants: '#4a4038', apron: '#5f4a3a' }
      : { cloth: '#717a88', clothDark: '#5a6270', pants: '#3a3f4a', apron: '#8d5c38' }),
    wear: (c) => path('M-3.9 -12.8H3.9L4.7 -4.5Q0 -3.5 -4.7 -4.5Z', c.apron, pen(0.7))
      + path('M-3.9 -12.8L-2.2 -14.1M3.9 -12.8L2.2 -14.1', 'none', pen(0.8, c.apron))
      + path('M-2 -8.4H2', 'none', pen(0.6, '#3b2a1c')),
    prop: () => limb('M-7 -6.5L-8.9 -16.6', '#a9744a', 1.2)
      + path('M-12.4 -18.3l6 -1.6l1 3.7l-6 1.6z', '#8b96a4', pen(0.9))
      + path('M-11.6 -18l4.4 -1.2', 'none', pen(0.7, '#c3ccd6')),
    hat: () => path('M-7.5 -22.9Q0 -25.3 7.5 -22.9L7.4 -21.5Q0 -23.9 -7.4 -21.5Z', '#3b3f47', pen(0.8))
      + ellipse(-3.3, -23.5, 2.1, 1.6, '#8fd3f7', pen(0.8)) + ellipse(1.5, -23.8, 2.1, 1.6, '#8fd3f7', pen(0.8))
      + path('M-4.2 -24.1l1 -0.5M0.6 -24.4l1 -0.5', 'none', pen(0.5, '#ffffff')),
  },
  // 学者: 四角いぼうし・めがね・本
  scholar: {
    top: 30,
    robe: true,
    colors: (tint) => (tint
      ? { cloth: '#2f8a84', clothDark: '#226e69', pants: '#2c3a4a' }
      : { cloth: '#4767b8', clothDark: '#35509a', pants: '#2c3a4a' }),
    wear: () => path('M-2.6 -13.9L0 -10.2L2.6 -13.9Q0 -14.7 -2.6 -13.9Z', '#ffffff', pen(0.7)),
    prop: () => path('M-10.2 -10.3l4.6 -1.3l1 5l-4.6 1.3z', '#c9423d', pen(0.8))
      + path('M-9.7 -5.9l4.5 -1.2', 'none', pen(0.6, '#fff6e6'))
      + path('M-8.9 -9.3l2.3 -0.6', 'none', pen(0.6, '#f2c14e')),
    hat: () => path('M-5.7 -25.4Q-5.5 -22.3 0 -21.9Q5.5 -22.3 5.7 -25.4Z', '#1f2740', pen(0.8))
      + path('M-9.2 -26.4L0 -29.8L9.2 -26.4L0 -23.4Z', '#2b3657', pen(0.9))
      + path('M0 -26.6L6.6 -25.1V-21.6', 'none', pen(0.8, '#f2c14e'))
      + circle(6.6, -21.2, 0.9, '#f2c14e', pen(0.5)),
    glasses: () => circle(-3.3, -18.9, 2.2, 'none', pen(0.6)) + circle(1.3, -18.9, 2.2, 'none', pen(0.6))
      + path('M-1.1 -19H-0.9M-5.5 -19.2L-7.2 -19.8', 'none', pen(0.6)),
  },
  // 賢者: とんがりぼうし・金のふちの長い服・光る つえ・白いひげ
  legendary: {
    top: 36,
    robe: true,
    colors: (tint) => (tint
      ? { cloth: '#c9484a', clothDark: '#a63638', pants: '#3a2a3a', hat: '#c9484a', hatDark: '#a63638' }
      : { cloth: '#8b62d2', clothDark: '#6f49b4', pants: '#3a2a4a', hat: '#8b62d2', hatDark: '#6f49b4' }),
    wear: () => path('M-6.9 -3.6Q0 -2.2 6.9 -3.6L7 -2.1Q0 -0.9 -7 -2.1Z', '#f2c14e', pen(0.6))
      + path('M-2.6 -13.9L0 -10.6L2.6 -13.9', 'none', pen(0.9, '#f2c14e')),
    prop: () => limb('M-7 -6.4L-9.5 -25.4', '#c79a3e', 1.1)
      + circle(-9.7, -27.9, 2.7, '#ffe27a', pen(0.8)) + circle(-10.3, -28.6, 1.1, '#fffbe0')
      + path('M-14 -28.2h-1.6M-9.7 -32.2v-1.5M-13 -31.4l-1.1 -1.1', 'none', pen(0.7, '#f2c14e')),
    beard: () => path('M-5 -15.8Q-1 -8.6 3.2 -15.8Q-0.9 -14 -5 -15.8Z', '#f7f5ee', pen(0.7)),
    hat: (c) => ellipse(0, -23.7, 9.6, 2.8, c.hatDark, pen(0.9))
      + path('M-5.7 -24.5Q-3 -31 1.6 -35.6Q3.6 -29.6 5.7 -24.5Q0 -22.9 -5.7 -24.5Z', c.hat, pen(0.9))
      + path('M-5.7 -24.5Q0 -22.9 5.7 -24.5L5.3 -25.9Q0 -24.4 -5.2 -25.9Z', '#f2c14e')
      + path('M0.3 -31.6l0.6 1.3l1.3 0.6l-1.3 0.6l-0.6 1.3l-0.6 -1.3l-1.3 -0.6l1.3 -0.6z', '#ffe27a'),
  },
};

/** 色ちがい（0〜3）から、はだ・かみ・服の色を決める */
function palette(kind, variant) {
  const index = VILLAGER_KINDS.indexOf(kind);
  const skin = SKINS[(variant + index) % SKINS.length];
  const hair = HAIRS[(variant * 2 + index) % HAIRS.length];
  return { ...skin, ...hair, shoes: '#5b3a24', ...KINDS[kind].colors(variant >= 2 ? 1 : 0) };
}

/**
 * 住民の絵の中身。無い職業・無い番号は null。
 * @param {string} kind 職業の id
 * @param {number} [variant] 色ちがい（0 〜 VILLAGER_VARIANTS - 1）
 */
export function villagerArt(kind, variant = 0) {
  const def = KINDS[kind];
  if (!def || !Number.isInteger(variant) || variant < 0 || variant >= VILLAGER_VARIANTS) return null;
  const c = palette(kind, variant);
  const bob = variant % 2 === 1;
  return shadow()
    + backHair(c, bob)
    + legs(c)
    + backArm(c)
    + body(c, Boolean(def.robe))
    + def.wear(c)
    + head(c)
    + face(c)
    + (def.glasses ? def.glasses(c) : '')
    + (def.beard ? def.beard(c) : '')
    + frontHair(c)
    + def.hat(c)
    + frontArm(c)
    + def.prop(c);
}

/** <defs> の中での id */
export const villagerArtId = (kind, variant = 0) => `vil-${kind}-${variant}`;

/** <defs> に入れる形（id つきの <g>）。無い職業は '' */
export function villagerArtDef(kind, variant = 0) {
  const inner = villagerArt(kind, variant);
  return inner === null ? '' : `<g id="${villagerArtId(kind, variant)}">${inner}</g>`;
}

/**
 * 町に置くときの大きさ（絵の 1 単位 = 何 px か。町の拡大率 1 のとき）。
 * 絵は 顔が つぶれない大きさで描いてあり、町では少し小さくして 建物との つりあいを取る
 * （戸口の高さが 9px。住民は その 2〜3 倍の、頭の大きな ちびキャラ）。
 */
export const VILLAGER_SCALE = 0.8;

/** 絵の中での、ぼうしの いちばん上の高さ（足もとから。絵の単位） */
export const villagerHeight = (kind) => (KINDS[kind] || KINDS.farmer).top;

/** 町に置いたときの、ぼうしの いちばん上の高さ（足もとからの px）。名札を その上に出す */
export const villagerTop = (kind) => villagerHeight(kind) * VILLAGER_SCALE;

/** 職業の id を、絵のある職業にそろえる（知らない職業は農民） */
export const villagerKind = (occupationId) => (KINDS[occupationId] ? occupationId : 'farmer');

/**
 * 住民の id から、色ちがいの番号を決める（同じ住民は いつも同じ見た目）。
 * @param {string} id
 */
export function villagerVariantOf(id) {
  const text = String(id ?? '');
  // FNV-1a（文字を 1 つずつ まぜる）。id の終わりの字だけで決まらないよう、最後に上の位も まぜる
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  hash ^= hash >>> 15;
  return (hash >>> 0) % VILLAGER_VARIANTS;
}

/** 絵の枠（原点は「足もとのまん中の地面」）。よこ 40・たて 48、地面は下から 2px 上 */
export const VILLAGER_BOX = Object.freeze({ x: -20, y: -46, width: 40, height: 48 });

const r2 = (v) => Math.round(v * 100) / 100;

/**
 * 名札（角の丸い ふだ + 下向きの とがり）の形（path の d）。top は ぼうしの いちばん上の高さ（px）。
 * ふだの下は ぼうしの 3px 上、ふだの高さは 13.2px、とがりは 2.4px。原点は 足もと。
 */
export function villagerTagPath(top) {
  const y1 = r2(-(top + 3)); // ふだの下
  const y0 = r2(y1 - 13.2); // ふだの上
  return `M-3.5 ${y0}H3.5A4 4 0 0 1 7.5 ${r2(y0 + 4)}V${r2(y1 - 4)}A4 4 0 0 1 3.5 ${y1}H2.1L0 ${r2(y1 + 2.4)}L-2.1 ${y1}H-3.5A4 4 0 0 1 -7.5 ${r2(y1 - 4)}V${r2(y0 + 4)}A4 4 0 0 1 -3.5 ${y0}Z`;
}
/** 名札の字の 下の位置（y。足もとから） */
export const villagerTagTextY = (top) => r2(-(top + 5.7));

/**
 * 町の canvas に描くための、住民 1 人の絵（ひとりだちの SVG）。町に置く大きさ（VILLAGER_SCALE 倍）で、
 * viewBox は VILLAGER_BOX（原点は 足もと）。画像は 4 倍の大きさで作る（拡大しても あらくならないように）。
 * 名札は入れない（左右を うら返さないので、canvas で別に描く）。無い職業は ''。
 */
export function villagerSpriteSvg(kind, variant = 0) {
  const art = villagerArt(kind, variant);
  if (art === null) return '';
  const b = VILLAGER_BOX;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x} ${b.y} ${b.width} ${b.height}" width="${b.width * 4}" height="${b.height * 4}">`
    + `<g transform="scale(${VILLAGER_SCALE})">${art}</g></svg>`;
}
