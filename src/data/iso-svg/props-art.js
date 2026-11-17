// 小さなものの絵（かざり・道ばたのもの・のりもの・庭）— マイ漢字タウン
//
// 建物（buildings-art.js）と同じ部品（kit.js）・同じ絵がらで描く。buildings-art.js が
// ここの表（PROP_ART）を 建物の表に足すので、絵の置き方・呼びだし方は建物と同じになる。
//
// ── 大きさの決まり ──
// 建物は「1 マス = 8m くらい・戸口の高さ 11」で描いてある。小さなものを それと同じ縮尺で描くと
// 小さすぎて何だか分からず、マスいっぱいに描くと 家と同じ大きさのポストになる（前の絵がそうだった）。
// ここでは、ほんとうの大きさの 1.5 倍くらいで描く。住民（ちびキャラ）が使って おかしくなく、
// となりの家より大きくならない大きさ。高さの めやす（1 = 町の拡大率 1 のとき 0.8px）:
//   ベンチ 9 / ゴミ箱 10 / ポスト 14 / 自動販売機 16 / 公衆電話 17 / 石灯籠 22 / 井戸 23 /
//   石像 24 / 街灯 30 / 風車 38（はねの先は 43）。くらべるもの: お店の かべが 17.5、小さな家の屋根の上が 54
//   （test/buildings-art.test.js の「大きさの決まり」が、お店より高くならないことを見る）
//
// ⚠️ ここで作る文字列は innerHTML に入れる。色と形は、すべてこのファイルと kit.js の中の値から作る。
// ⚠️ 道ばたのものは町に たくさん置かれる。図形に transform を付ける部品（onFace・billboard・shape）は
//    使わない（1 つずつ 別の合成の単位になる）。面の上の丸は、点を計算して多角形で描く（round）。

import { INK, lot, tone } from './kit.js';

const STONE = '#c9ced6';
const WOOD = '#c98a4b';
const WOOD_DARK = '#9a6433';
const METAL = '#5b6573';
const TIRE = '#2c2f36';

/**
 * 面の上の丸（車輪・しるし）。面 face の (t, z) をまん中に、半径 r（高さの単位）。
 * 面は ななめに見えるので、丸の点を 面の上に取って 多角形にする。
 */
const round = (k, face, t, z, r, fill, width = 0.9, n = 14) => {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    pts.push(face(t + (Math.cos(a) * r) / 44, z + Math.sin(a) * r));
  }
  return k.poly(pts, fill, width);
};
const n2 = (v) => Math.round(v * 100) / 100;
/** 地面と平行な円（半径 r マス）。kit の disc と ちがい、ふちの色を選べる */
const ring = (k, u, v, z, r, fill, color = INK, width = 0.7) => {
  const [x, y] = k.xy(u, v, z);
  return `<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="${n2(r * 56.57)}" ry="${n2(r * 28.28)}" fill="${fill}" stroke="${color}" stroke-width="${width}"/>`;
};
/** 丸い ふた（つつの上の まるみ）。hgt は高さ */
const cap = (k, u, v, z, r, hgt, fill, width = 0.9) => {
  const [x, y] = k.xy(u, v, z);
  const rx = n2(r * 56.57); const ry = n2(r * 28.28);
  return `<path d="M${n2(x - rx)} ${n2(y)}A${rx} ${n2(hgt)} 0 0 1 ${n2(x + rx)} ${n2(y)}A${rx} ${ry} 0 0 1 ${n2(x - rx)} ${n2(y)}Z" fill="${fill}" stroke="${INK}" stroke-width="${width}" stroke-linejoin="round"/>`;
};
/** タイヤ（黒い輪 + まん中の金具） */
const wheel = (k, face, t, z, r = 3) => round(k, face, t, z, r, TIRE, 0.9) + round(k, face, t, z, r * 0.45, '#c9ced6', 0.5, 10);

// ── 井戸（石の つつ・左右の柱・小さな屋根・つるべ） ──
function well() {
  const k = lot(1, 1);
  const d = 0.135; // 柱は、画面で つつの左と右に立つ（おくにも手前にも ずれない）
  let s = '';
  s += k.cyl(0.5, 0.5, 0.15, 0, 7.4, STONE, { top: '#9aa3ae', lw: 1 });
  s += k.disc(0.5, 0.5, 7.4, 0.105, '#3f9bd8', 0.8);
  s += k.seg([[0.43, 0.5, 7.4], [0.49, 0.45, 7.4]], '#c8e8fa', 0.8);
  s += k.seg([[0.37, 0.57, 3.8], [0.5, 0.65, 3.8], [0.63, 0.57, 3.8]], tone(STONE, -0.3), 0.6, 0.6);
  for (const sign of [-1, 1]) s += k.box(0.5 + sign * d - 0.022, 0.5 - sign * d - 0.022, 0.5 + sign * d + 0.022, 0.5 - sign * d + 0.022, 0, 18, WOOD, { se: WOOD_DARK, lw: 0.9 });
  // はり・なわ・おけ
  s += k.bar([[0.5 - d, 0.5 + d, 16.2], [0.5 + d, 0.5 - d, 16.2]], WOOD_DARK, 1.2, 0.7);
  s += k.seg([[0.5, 0.5, 16.2], [0.5, 0.5, 11.8]], '#7a5a3a', 0.7);
  s += k.cyl(0.5, 0.5, 0.034, 9.4, 12, '#b07a4c', { lw: 0.8 });
  s += k.hipRoof(0.33, 0.33, 0.67, 0.67, 18, 5.2, '#c9563c', { over: 0.03, drop: 0.6, thick: 1.2, plain: true });
  return s;
}

// ── 石灯籠（台・さお・火ぶくろ・かさ） ──
function stoneLantern() {
  const k = lot(1, 1);
  const c = '#bfc5cd';
  let s = '';
  s += k.box(0.405, 0.405, 0.595, 0.595, 0, 2.1, c, { lw: 0.9 });
  s += k.box(0.465, 0.465, 0.535, 0.535, 2.1, 9, tone(c, 0.08), { lw: 0.9 });
  s += k.box(0.42, 0.42, 0.58, 0.58, 9, 10.6, c, { lw: 0.9 });
  // 火ぶくろ（あかりの入る はこ）。かさの下に かくれないよう、かさは ほとんど はり出さない
  s += k.box(0.44, 0.44, 0.56, 0.56, 10.6, 16.6, '#e3ddd0', { lw: 0.9 });
  s += k.panel(k.SW(0.56), 0.465, 0.535, 11.6, 15.4, '#ffd56b', 0.7) + k.panel(k.SE(0.56), 0.465, 0.535, 11.6, 15.4, '#f2b84a', 0.7);
  s += k.hipRoof(0.425, 0.425, 0.575, 0.575, 17, 3.6, '#8f96a0', { over: 0.012, drop: 0.4, thick: 1, plain: true });
  s += k.dot(0.5, 0.5, 21.4, 1.1, '#8f96a0', 0.7);
  return s;
}

// ── 噴水（石の水ばち 2 段と、ふき上がる水） ──
function fountain() {
  const k = lot(1, 1);
  const water = '#57b6ea'; const lite = '#c8ecfb';
  let s = '';
  s += k.cyl(0.5, 0.5, 0.25, 0, 3.8, STONE, { top: '#aab2bc', lw: 1.1 });
  s += k.disc(0.5, 0.5, 3.8, 0.205, water, 0.8);
  s += k.seg([[0.36, 0.52, 3.8], [0.44, 0.6, 3.8]], lite, 0.8) + k.seg([[0.6, 0.4, 3.8], [0.66, 0.46, 3.8]], lite, 0.8);
  s += k.cyl(0.5, 0.5, 0.04, 3.8, 10.4, tone(STONE, 0.12), { lw: 0.9 });
  s += k.cyl(0.5, 0.5, 0.115, 10.4, 12, STONE, { top: '#aab2bc', lw: 0.9 });
  s += k.disc(0.5, 0.5, 12, 0.085, water, 0.7);
  // こぼれる水（うすい青の すじ）と、ふき上がる水
  for (const [du, dv] of [[-0.1, 0.04], [0.02, 0.11], [0.11, -0.02]]) s += k.seg([[0.5 + du, 0.5 + dv, 11.6], [0.5 + du * 1.25, 0.5 + dv * 1.25, 4.2]], lite, 1.1, 0.85);
  s += k.curve([0.5, 0.5, 12.4], [0.47, 0.5, 19.5], [0.44, 0.52, 13.4], '#8fd3f7', 1, 0.5);
  s += k.curve([0.5, 0.5, 12.4], [0.53, 0.5, 19.5], [0.56, 0.48, 13.4], '#8fd3f7', 1, 0.5);
  s += k.bar([[0.5, 0.5, 12.4], [0.5, 0.5, 18.6]], lite, 1.3, 0.5);
  s += k.dot(0.5, 0.5, 19.6, 1.1, '#eaf7ff', 0.5);
  return s;
}

/** 台座（石の はこ 2 段）。top は台座の上の高さ */
const pedestal = (k, c, top) => k.box(0.37, 0.37, 0.63, 0.63, 0, 2.2, tone(c, -0.08), { lw: 1 })
  + k.box(0.41, 0.41, 0.59, 0.59, 2.2, top, c, { lw: 1 })
  + k.panel(k.SW(0.59), 0.45, 0.55, 3.6, top - 1.6, '#8a6a3a', 0.6);

/** 台座の上に立つ人の形（石像・黄金像）。arm=true で 片うでを上げる */
function figure(k, base, c, arm) {
  const dark = tone(c, -0.22);
  let s = '';
  // あし・どう・あたま（まるい柱と丸を重ねる）
  s += k.cyl(0.5, 0.5, 0.05, base, base + 6.2, c, { lw: 0.9, top: false });
  s += k.cyl(0.5, 0.5, 0.062, base + 5.4, base + 11.4, c, { lw: 0.9 });
  if (arm) s += k.bar([[0.53, 0.5, base + 10.6], [0.6, 0.5, base + 16.4]], c, 1.5, 0.7);
  s += k.bar([[0.45, 0.52, base + 10.4], [0.42, 0.54, base + 6.4]], dark, 1.4, 0.7);
  s += k.dot(0.5, 0.5, base + 14.2, 2.7, c, 0.9);
  s += k.seg([[0.47, 0.5, base + 15.2], [0.49, 0.5, base + 16.2]], tone(c, 0.4), 0.9);
  return s;
}

// ── 石像（台座の上の人の像） ──
function statue() {
  const k = lot(1, 1);
  return pedestal(k, STONE, 7.5) + figure(k, 7.5, '#a9b1bc', false);
}

// ── 黄金像（星を かかげる 金の像） ──
function goldStatue() {
  const k = lot(1, 1);
  const gold = '#f2c14e';
  let s = pedestal(k, '#ece6da', 8) + figure(k, 8, gold, true);
  // かかげた星と きらめき
  const [x, y] = k.xy(0.6, 0.5, 26.6);
  const star = (cx, cy, r) => `M${cx} ${cy - r}L${cx + r * 0.3} ${cy - r * 0.3}L${cx + r} ${cy}L${cx + r * 0.3} ${cy + r * 0.3}L${cx} ${cy + r}L${cx - r * 0.3} ${cy + r * 0.3}L${cx - r} ${cy}L${cx - r * 0.3} ${cy - r * 0.3}Z`;
  const n = (v) => Math.round(v * 100) / 100;
  s += `<path d="${star(n(x), n(y), 3.1)}" fill="#fff3a0" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>`;
  s += `<path d="${star(n(x - 9.5), n(y + 7), 1.3)}${star(n(x + 6.5), n(y + 9.5), 1.1)}" fill="#ffe27a"/>`;
  return s;
}

// ── 風車（まるい塔・赤い とんがり屋根・4 まいの はね） ──
function windmill() {
  const k = lot(1, 1);
  const wall = '#f6e3a1'; const roof = '#c9563c';
  let s = '';
  s += k.cyl(0.5, 0.5, 0.175, 0, 3, STONE, { lw: 1 });
  s += k.cyl(0.5, 0.5, 0.15, 3, 27, wall, { top: false, lw: 1.1 });
  s += k.door(k.SW(0.647), 0.46, 0.54, 3, 11, { color: '#8a5a33', pane: false });
  s += k.win(k.SE(0.647), 0.46, 0.54, 15, 20, { bars: 'cross' });
  s += k.cone(0.5, 0.5, 0.185, 27, 37.5, roof, { lw: 1.1 });
  // はね（手前の かべに付く。じくから 4 方向へ）
  const [hx, hy] = k.xy(0.56, 0.62, 29.5);
  const n = (v) => Math.round(v * 100) / 100;
  let blades = ''; let spars = '';
  for (const deg of [22, 112, 202, 292]) {
    const a = (deg * Math.PI) / 180; const c = Math.cos(a); const sn = Math.sin(a);
    const p = (r, off) => `${n(hx + c * r - sn * off)} ${n(hy + sn * r + c * off)}`;
    blades += `M${p(4, 0.4)}L${p(17.5, 0.4)}L${p(17.5, 4.6)}L${p(4, 4.6)}Z`;
    spars += `M${p(0, 0)}L${p(18.2, 0)}M${p(8.5, 0.4)}L${p(8.5, 4.6)}M${p(13, 0.4)}L${p(13, 4.6)}`;
  }
  s += `<path d="${blades}" fill="#fffaf0" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/>`;
  s += `<path d="${spars}" fill="none" stroke="${WOOD_DARK}" stroke-width="0.9" stroke-linecap="round"/>`;
  s += `<circle cx="${n(hx)}" cy="${n(hy)}" r="1.7" fill="${roof}" stroke="${INK}" stroke-width="0.8"/>`;
  return s;
}

// ── 庭園（芝・花だん 2 つ・小道・丸く かりこんだ木） ──
function garden() {
  const k = lot(1, 1);
  let s = '';
  s += k.pad(0.04, 0.04, 0.96, 0.96, '#8fd46a', 0.9);
  s += k.flat([[0.04, 0.04, 0], [0.5, 0.04, 0], [0.04, 0.5, 0]], '#a2e07c', 0.8);
  // 小道（手前の左から 右おくへ）
  s += k.poly([[0.42, 0.96, 0], [0.58, 0.96, 0], [0.58, 0.6, 0], [0.96, 0.6, 0], [0.96, 0.44, 0], [0.42, 0.44, 0]], '#efe2c4', 0.8);
  s += k.seg([[0.5, 0.92, 0], [0.5, 0.52, 0], [0.92, 0.52, 0]], '#cdbd97', 0.7, 0.8);
  // 花だん（レンガの ふち・土・花）
  const bed = (u0, v0, u1, v1, colors) => k.box(u0, v0, u1, v1, 0, 1.8, '#c9794d', { top: '#7a5230', lw: 0.9 })
    + k.flowers([[u0 + 0.06, v0 + 0.07], [u0 + 0.14, v0 + 0.16], [u0 + 0.2, v0 + 0.06], [u0 + 0.08, v0 + 0.2], [u0 + 0.22, v0 + 0.2]], colors);
  s += bed(0.1, 0.1, 0.38, 0.38, ['#ff6fa3', '#ffd24a', '#ffffff']);
  s += k.bush(0.76, 0.22, 1.25) + k.bush(0.24, 0.72, 1.15);
  s += bed(0.64, 0.66, 0.9, 0.9, ['#ff8a3c', '#ffffff', '#c084fc']);
  return s;
}

// ── 日本庭園（木のわく・白い砂の もよう・岩・こけ・小さな もみじ） ──
function zenGarden() {
  const k = lot(1, 1);
  const frame = '#a8743f'; const sand = '#f7efd6'; const line = '#d9c89c';
  let s = '';
  s += k.box(0.04, 0.04, 0.96, 0.96, 0, 2.2, frame, { top: sand, lw: 1 });
  s += k.pad(0.08, 0.08, 0.92, 0.92, sand, 0.7, tone(frame, -0.2), 2.2);
  // 砂の すじ
  for (const v of [0.2, 0.32, 0.44, 0.56, 0.68, 0.8]) s += k.seg([[0.12, v, 2.2], [0.88, v, 2.2]], line, 0.7);
  // 岩と、まわりの波もん
  const rock = (u, v, r, c) => ring(k, u, v, 2.2, r * 1.75, sand, line) + ring(k, u, v, 2.2, r * 1.3, sand, line)
    + k.poly([[u - r, v + r * 0.2, 2.2], [u - r * 0.5, v - r * 0.5, 2.2 + r * 46], [u + r * 0.4, v - r * 0.6, 2.2 + r * 58], [u + r, v, 2.2 + r * 20], [u + r * 0.6, v + r * 0.8, 2.2]], c, 0.9)
    + k.flat([[u + r * 0.4, v - r * 0.6, 2.2 + r * 58], [u + r, v, 2.2 + r * 20], [u + r * 0.6, v + r * 0.8, 2.2], [u + r * 0.2, v + r * 0.2, 2.2 + r * 30]], tone(c, -0.25));
  s += rock(0.36, 0.38, 0.085, '#7d8590');
  s += rock(0.68, 0.64, 0.06, '#8e959f');
  // こけと 小さな もみじ
  s += k.disc(0.22, 0.76, 2.2, 0.085, '#5aa23d', 0.7) + k.disc(0.2, 0.74, 2.2, 0.045, '#7cc257', 0);
  s += k.bar([[0.22, 0.76, 2.2], [0.22, 0.76, 9]], '#7a4a2a', 1, 0.6);
  s += k.dot(0.2, 0.76, 11.5, 3.2, '#e2553c', 0.8) + k.dot(0.245, 0.76, 10.2, 2.6, '#f0703e', 0.8) + k.dot(0.215, 0.76, 13.4, 2.2, '#f28a4c', 0.7);
  return s;
}

// ── 遊具（すな場・すべり台・ぶらんこ） ──
function playground() {
  const k = lot(1, 1);
  const red = '#e2553c'; const blue = '#3f86d8'; const yellow = '#f5c542';
  let s = '';
  s += k.pad(0.04, 0.04, 0.96, 0.96, '#f2dfae', 0.9);
  s += k.flat([[0.04, 0.04, 0], [0.5, 0.04, 0], [0.04, 0.5, 0]], '#f7e8c0', 0.8);
  // ぶらんこ（おく。山形の柱 2 組と よこ木）
  const swingV = 0.26;
  for (const u of [0.16, 0.52]) s += k.bar([[u - 0.05, swingV + 0.07, 0], [u, swingV, 12.5], [u + 0.05, swingV - 0.07, 0]], blue, 1.1, 0.6);
  s += k.bar([[0.16, swingV, 12.5], [0.52, swingV, 12.5]], blue, 1.3, 0.6);
  for (const u of [0.28, 0.41]) {
    s += k.seg([[u - 0.025, swingV, 12.5], [u - 0.025, swingV, 4]], '#6b7280', 0.6) + k.seg([[u + 0.025, swingV, 12.5], [u + 0.025, swingV, 4]], '#6b7280', 0.6);
    s += k.box(u - 0.035, swingV - 0.02, u + 0.035, swingV + 0.02, 3.4, 4.2, red, { lw: 0.7 });
  }
  // すべり台（やぐら・はしご・すべる板）
  const a = 0.6; const b = 0.78; const top = 9.5;
  for (const [u, v] of [[a, 0.5], [b, 0.5], [a, 0.66], [b, 0.66]]) s += k.bar([[u, v, 0], [u, v, top + 3.4]], '#8b96a4', 0.9, 0.5);
  s += k.box(a, 0.5, b, 0.66, top - 0.8, top, WOOD, { lw: 0.8 });
  s += k.poly([[a, 0.5, top + 3.4], [b, 0.5, top + 3.4], [b, 0.66, top + 3.4], [a, 0.66, top + 3.4]], red, 0.8);
  for (const z of [2.4, 4.8, 7.2]) s += k.seg([[a, 0.5, z], [b, 0.5, z]], '#8b96a4', 0.8);
  // すべる板（手前の左へ下りる）
  s += k.poly([[a, 0.66, top], [b, 0.66, top], [b, 0.93, 0.6], [a, 0.93, 0.6]], yellow, 0.9);
  s += k.bar([[a, 0.66, top + 1.4], [a, 0.93, 2]], tone(yellow, -0.2), 0.9, 0.5) + k.bar([[b, 0.66, top + 1.4], [b, 0.93, 2]], tone(yellow, -0.2), 0.9, 0.5);
  // すな場の おもちゃ
  s += ring(k, 0.24, 0.74, 0, 0.1, '#e9cf8f', '#c9ad6a') + k.cyl(0.22, 0.74, 0.026, 0, 2.6, red, { lw: 0.7 }) + k.dot(0.29, 0.78, 1.2, 1.5, blue, 0.6);
  return s;
}

// ── ベンチ（木の すわる板と せもたれ・鉄の あし） ──
function bench() {
  const k = lot(1, 1);
  const u0 = 0.3; const u1 = 0.7; const v0 = 0.45; const v1 = 0.57;
  let s = '';
  for (const u of [u0 + 0.03, u1 - 0.05]) s += k.box(u, v0, u + 0.025, v0 + 0.02, 0, 9, METAL, { lw: 0.7 });
  s += k.box(u0, v0, u1, v0 + 0.022, 5.6, 9.2, WOOD, { se: WOOD_DARK, lw: 0.9 });
  s += k.rule(k.SW(v0 + 0.022), u0, 7.4, u1, 7.4, WOOD_DARK, 0.6);
  for (const u of [u0 + 0.03, u1 - 0.05]) s += k.box(u, v1 - 0.03, u + 0.025, v1 - 0.01, 0, 3.6, METAL, { lw: 0.7 });
  s += k.box(u0, v0, u1, v1, 3.6, 4.8, WOOD, { se: WOOD_DARK, top: tone(WOOD, 0.2), lw: 0.9 });
  s += k.seg([[u0, (v0 + v1) / 2 + 0.01, 4.8], [u1, (v0 + v1) / 2 + 0.01, 4.8]], WOOD_DARK, 0.6);
  return s;
}

// ── ポスト（赤い丸い ゆうびんポスト） ──
function mailbox() {
  const k = lot(1, 1);
  const red = '#e23d36';
  let s = '';
  s += k.cyl(0.5, 0.5, 0.085, 0, 1.4, tone(red, -0.3), { lw: 0.8 });
  s += k.cyl(0.5, 0.5, 0.07, 1.4, 10.2, red, { top: false, lw: 0.9 });
  s += k.cyl(0.5, 0.5, 0.086, 10.2, 11.6, tone(red, -0.12), { top: false, lw: 0.9 });
  s += cap(k, 0.5, 0.5, 11.6, 0.086, 2.8, red);
  // さし入れ口と、白い ふだ
  const [x, y] = k.xy(0.47, 0.565, 0);
  const n = (v) => Math.round(v * 100) / 100;
  s += `<path d="M${n(x - 2.6)} ${n(y - 8.6)}h4.6v1.3h-4.6z" fill="#3a1512" stroke="${INK}" stroke-width="0.5"/>`;
  s += `<path d="M${n(x - 2.2)} ${n(y - 5.9)}h3.8v2.9h-3.8z" fill="#fff6e6" stroke="${INK}" stroke-width="0.5"/>`;
  s += `<path d="M${n(x - 1.4)} ${n(y - 5)}h2.2M${n(x - 1.4)} ${n(y - 4.2)}h2.2M${n(x - 0.3)} ${n(y - 4.2)}v0.9" fill="none" stroke="${red}" stroke-width="0.55"/>`;
  return s;
}

// ── 公衆電話（ガラスの はこ・みどりの電話） ──
function phoneBooth() {
  const k = lot(1, 1);
  const frame = '#3f9a72'; const a = 0.42; const b = 0.58; const H = 16;
  let s = '';
  s += k.box(a - 0.01, a - 0.01, b + 0.01, b + 0.01, 0, 1, '#7c8591', { lw: 0.8 });
  s += k.box(a, a, b, b, 1, H, '#cfeaf7', { se: '#a9d6ec', top: frame, lw: 0.9 });
  // わくと、中の電話
  s += k.panel(k.SW(b), a + 0.085, b - 0.012, 6.2, 10.4, '#58b97f', 0.6);
  for (const [face] of [[k.SW(b)], [k.SE(b)]]) {
    s += k.band(face, a, b, 1, 2.6, frame) + k.band(face, a, b, H - 2.2, H, frame);
    s += k.rule(face, a, 1, a, H, frame, 1.1) + k.rule(face, b, 1, b, H, frame, 1.1) + k.rule(face, a, 8.4, b, 8.4, frame, 0.8);
  }
  s += k.flat([[a + 0.02, b, H - 3], [a + 0.07, b, H - 3], [a + 0.02, b, 11]], '#ffffff', 0.7);
  s += k.box(a - 0.012, a - 0.012, b + 0.012, b + 0.012, H, H + 1.4, tone(frame, -0.15), { lw: 0.8 });
  return s;
}

// ── 街灯（柱・手前へ のびる うで・あかり） ──
function streetLight() {
  const k = lot(1, 1);
  const pole = '#566170';
  let s = '';
  s += k.cyl(0.5, 0.5, 0.04, 0, 2, '#3f4854', { lw: 0.8 });
  s += k.bar([[0.5, 0.5, 2], [0.5, 0.5, 26]], pole, 1.3, 0.7);
  s += k.curve([0.5, 0.5, 26], [0.5, 0.5, 30.5], [0.62, 0.5, 29.6], pole, 1.3, 0.7);
  // あかり（かさ + でんきゅう）
  const [x, y] = k.xy(0.66, 0.5, 29);
  const n = (v) => Math.round(v * 100) / 100;
  s += `<path d="M${n(x - 4)} ${n(y)}Q${n(x)} ${n(y - 4.4)} ${n(x + 4)} ${n(y)}Z" fill="#3f4854" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/>`;
  s += `<ellipse cx="${n(x)}" cy="${n(y + 0.5)}" rx="2.9" ry="1.5" fill="#ffe27a" stroke="${INK}" stroke-width="0.7"/>`;
  return s;
}

// ── バス停（丸い かんばん・時こく表・おもり） ──
function busStop() {
  const k = lot(1, 1);
  const blue = '#3f86d8';
  let s = '';
  s += k.cyl(0.5, 0.5, 0.06, 0, 1.6, '#8b96a4', { lw: 0.8 });
  s += k.bar([[0.5, 0.5, 1.6], [0.5, 0.5, 15]], '#c9ced6', 1.1, 0.6);
  // 時こく表（白い板）
  s += k.box(0.455, 0.5, 0.545, 0.512, 6, 11.6, '#fffdf5', { lw: 0.7 });
  for (const z of [7.4, 8.8, 10.2]) s += k.rule(k.SW(0.512), 0.47, z, 0.53, z, '#9aa3ae', 0.5);
  // 丸い かんばん（バスの しるし）
  const [x, y] = k.xy(0.5, 0.5, 18.4);
  const n = (v) => Math.round(v * 100) / 100;
  s += `<circle cx="${n(x)}" cy="${n(y)}" r="4.3" fill="${blue}" stroke="${INK}" stroke-width="0.9"/>`;
  s += `<circle cx="${n(x)}" cy="${n(y)}" r="3.1" fill="#ffffff"/>`;
  s += `<path d="M${n(x - 2)} ${n(y - 1.6)}h4v2.9h-4z" fill="${blue}"/><path d="M${n(x - 1.5)} ${n(y - 1.1)}h3v1h-3z" fill="#ffffff"/>`;
  s += `<circle cx="${n(x - 1.1)}" cy="${n(y + 1.5)}" r="0.55" fill="${INK}"/><circle cx="${n(x + 1.1)}" cy="${n(y + 1.5)}" r="0.55" fill="${INK}"/>`;
  return s;
}

// ── 自動販売機（赤い はこ・のみものの見本・とり出し口） ──
function vendingMachine() {
  const k = lot(1, 1);
  const red = '#e2463c'; const a = 0.41; const b = 0.59; const v0 = 0.44; const v1 = 0.56; const H = 15.5;
  const front = k.SW(v1);
  let s = '';
  s += k.box(a, v0, b, v1, 0, H, red, { se: tone(red, -0.2), top: tone(red, 0.18), lw: 0.9 });
  s += k.panel(front, a + 0.02, b - 0.05, 7.6, H - 1.6, '#f4fbff', 0.6);
  const drinks = ['#3f86d8', '#f5c542', '#43b86a', '#ff8a3c', '#ffffff', '#c084fc'];
  drinks.forEach((c, i) => {
    const t = a + 0.036 + (i % 3) * 0.037; const z = i < 3 ? 11.2 : 8.4;
    s += k.panel(front, t, t + 0.022, z, z + 2, c, 0.4);
  });
  s += k.panel(front, b - 0.04, b - 0.015, 9, 12.4, '#2f3440', 0.5);
  s += k.panel(front, a + 0.03, b - 0.05, 2, 4.6, '#3a1512', 0.6);
  s += k.band(front, a, b, 0, 1.2, tone(red, -0.35));
  return s;
}

// ── ゴミ箱（あみの つつ・ふた） ──
function trashCan() {
  const k = lot(1, 1);
  const c = '#7fa98b';
  let s = '';
  s += k.cyl(0.5, 0.5, 0.068, 0, 8.4, c, { top: false, lw: 0.9 });
  for (const [u, v] of [[0.452, 0.552], [0.5, 0.568], [0.548, 0.552]]) s += k.seg([[u, v, 1], [u, v, 7.6]], tone(c, -0.3), 0.5);
  s += k.cyl(0.5, 0.5, 0.08, 8.4, 9.8, '#4f6f5c', { top: '#2f3f36', lw: 0.9 });
  return s;
}

const CAR_COLORS = ['#e2463c', '#3f86d8', '#f5c542', '#f4f1ea'];

/** 車の はこ（下の はこ + まどのある上の はこ）。向きは u（右手前）。 */
function carBody(k, o) {
  const { u0, u1, v0, v1, body, cabin, z0 = 2, zBody, zTop } = o;
  const side = k.SW(v1); const front = k.SE(u1);
  let s = '';
  s += k.shadow(u0, v0, u1, v1, 0.1);
  s += k.box(u0, v0, u1, v1, z0, zBody, body, { se: tone(body, -0.18), top: tone(body, 0.14), lw: 1 });
  const [c0, c1] = cabin;
  const inset = (v1 - v0) * 0.1;
  s += k.box(c0, v0 + inset, c1, v1 - inset, zBody, zTop, tone(body, 0.08), { se: tone(body, -0.14), top: tone(body, 0.22), lw: 1 });
  // まど（よこ・前）
  const cs = k.SW(v1 - inset); const cf = k.SE(c1);
  s += k.band(cs, c0 + 0.02, c1 - 0.02, zBody + 0.7, zTop - 0.9, '#bfe6fb') + k.flat([cs(c0 + 0.02, zTop - 0.9), cs(c0 + 0.09, zTop - 0.9), cs(c0 + 0.02, zBody + 1.6)], '#ffffff', 0.7);
  s += k.band(cf, v0 + inset + 0.02, v1 - inset - 0.02, zBody + 0.7, zTop - 0.9, '#8fd3f7');
  // ライトと バンパー
  s += k.panel(front, v0 + 0.02, v0 + 0.07, zBody - 2.6, zBody - 1.1, '#fff3a0', 0.5) + k.panel(front, v1 - 0.07, v1 - 0.02, zBody - 2.6, zBody - 1.1, '#fff3a0', 0.5);
  s += k.band(front, v0, v1, z0, z0 + 1.1, '#aab2bc') + k.band(side, u0, u1, z0, z0 + 1.1, '#c9ced6');
  return s;
}

// ── 自動車（色は 4 通り） ──
function car(variant) {
  const k = lot(1, 1);
  const body = CAR_COLORS[variant % CAR_COLORS.length];
  let s = carBody(k, { u0: 0.14, u1: 0.86, v0: 0.33, v1: 0.67, body, cabin: [0.28, 0.66], zBody: 7.8, zTop: 13.2 });
  s += wheel(k, k.SW(0.67), 0.29, 2.9, 3.1) + wheel(k, k.SW(0.67), 0.71, 2.9, 3.1);
  return s;
}

// ── バス（色は 2 通り） ──
function bus(variant) {
  const k = lot(1, 1);
  const body = variant % 2 ? '#3f86d8' : '#43b86a';
  const u0 = 0.05; const u1 = 0.95; const v0 = 0.32; const v1 = 0.68; const H = 17.4;
  const side = k.SW(v1); const front = k.SE(u1);
  let s = '';
  s += k.shadow(u0, v0, u1, v1, 0.1);
  s += k.box(u0, v0, u1, v1, 2, H, '#fff6e6', { se: '#e8dcc6', top: '#ffffff', lw: 1 });
  s += k.band(side, u0, u1, 2, 8.4, body) + k.band(front, v0, v1, 2, 8.4, tone(body, -0.18));
  s += k.band(side, u0, u1, 2, 3.2, '#c9ced6') + k.band(front, v0, v1, 2, 3.2, '#aab2bc');
  // まどの列・ドア・行き先
  for (let i = 0; i < 5; i++) s += k.panel(side, u0 + 0.05 + i * 0.152, u0 + 0.172 + i * 0.152, 9.4, 14.6, '#bfe6fb', 0.6);
  s += k.panel(side, u1 - 0.12, u1 - 0.03, 3.2, 14.6, '#8fd3f7', 0.7) + k.rule(side, u1 - 0.075, 3.2, u1 - 0.075, 14.6, INK, 0.5);
  s += k.panel(front, v0 + 0.03, v1 - 0.03, 9, 14.6, '#8fd3f7', 0.7);
  s += k.panel(front, v0 + 0.08, v1 - 0.08, 15.1, 16.7, '#2f3440', 0.5);
  s += k.panel(front, v0 + 0.02, v0 + 0.08, 4, 5.8, '#fff3a0', 0.5) + k.panel(front, v1 - 0.08, v1 - 0.02, 4, 5.8, '#fff3a0', 0.5);
  s += wheel(k, side, 0.23, 3, 3.3) + wheel(k, side, 0.77, 3, 3.3);
  return s;
}

// ── 消防車（赤い車・はしご・赤いランプ） ──
function fireTruck() {
  const k = lot(1, 1);
  const red = '#e2463c';
  const u0 = 0.06; const u1 = 0.94; const v0 = 0.33; const v1 = 0.67;
  const side = k.SW(v1); const front = k.SE(u1);
  let s = '';
  s += k.shadow(u0, v0, u1, v1, 0.1);
  // うしろの はこ（ホースの たな）と、前の うんてん席
  s += k.box(u0, v0, 0.62, v1, 2, 11.8, red, { se: tone(red, -0.2), top: tone(red, 0.16), lw: 1 });
  s += k.box(0.62, v0, u1, v1, 2, 14.4, red, { se: tone(red, -0.2), top: tone(red, 0.2), lw: 1 });
  s += k.band(side, u0, u1, 2, 3.3, '#c9ced6') + k.band(front, v0, v1, 2, 3.3, '#aab2bc');
  s += k.panel(side, 0.66, 0.89, 8.2, 12.8, '#bfe6fb', 0.6) + k.panel(front, v0 + 0.03, v1 - 0.03, 8.2, 12.8, '#8fd3f7', 0.6);
  s += k.panel(side, u0 + 0.04, 0.3, 5, 9.6, '#f4f1ea', 0.6) + k.panel(side, 0.34, 0.58, 5, 9.6, '#f4f1ea', 0.6);
  s += round(k, side, 0.17, 7.3, 1.7, '#c9a23a', 0.5, 10) + round(k, side, 0.46, 7.3, 1.7, '#c9a23a', 0.5, 10);
  s += k.panel(front, v0 + 0.02, v0 + 0.08, 4.2, 6, '#fff3a0', 0.5) + k.panel(front, v1 - 0.08, v1 - 0.02, 4.2, 6, '#fff3a0', 0.5);
  // はしご（うしろの はこの上）
  s += k.bar([[u0 + 0.02, 0.43, 12.8], [0.66, 0.43, 14.2]], '#d5dbe2', 0.8, 0.5) + k.bar([[u0 + 0.02, 0.57, 12.8], [0.66, 0.57, 14.2]], '#d5dbe2', 0.8, 0.5);
  for (let i = 0; i < 6; i++) { const u = u0 + 0.06 + i * 0.1; const z = 12.9 + i * 0.22; s += k.seg([[u, 0.43, z], [u, 0.57, z]], '#8b96a4', 0.7); }
  // 赤いランプ
  s += k.box(0.73, 0.45, 0.82, 0.55, 14.4, 16.2, '#ff5a4f', { top: '#ffb3ad', lw: 0.7 });
  s += wheel(k, side, 0.22, 3, 3.3) + wheel(k, side, 0.78, 3, 3.3);
  return s;
}

// ── 自転車（車輪 2 つ・青い わく・ハンドル・サドル） ──
function bicycle() {
  const k = lot(1, 1);
  const face = k.SW(0.5); const blue = '#3f86d8';
  const a = 0.34; const b = 0.66; const R = 4;
  const p = (t, z) => face(t, z);
  let s = '';
  s += k.roundShadow(0.5, 0.5, 0.14);
  // 車輪（黒い輪の中に、うすい色の スポーク）
  for (const t of [a, b]) {
    s += round(k, face, t, R, R, '#eef1f5', 1.5, 16);
    s += k.seg([p(t - 0.06, R), p(t + 0.06, R)], '#aab2bc', 0.5) + k.seg([p(t, R - 2.8), p(t, R + 2.8)], '#aab2bc', 0.5);
    s += round(k, face, t, R, 0.8, '#8b96a4', 0.5, 8);
  }
  // わく（三角 2 つ）
  s += k.bar([p(a, R), p(0.45, R + 4.6), p(0.61, R + 5), p(b, R)], blue, 1.1, 0.5);
  s += k.bar([p(0.45, R + 4.6), p(0.5, R), p(a, R)], blue, 1.1, 0.5) + k.bar([p(0.5, R), p(0.61, R + 5)], blue, 1.1, 0.5);
  // サドルと ハンドル
  s += k.bar([p(0.45, R + 4.6), p(0.44, R + 6.2)], '#566170', 0.8, 0.4) + k.bar([p(0.41, R + 6.4), p(0.47, R + 6.4)], '#3a2c26', 1.5, 0.5);
  s += k.bar([p(0.61, R + 5), p(0.615, R + 7.2)], '#566170', 0.8, 0.4) + k.bar([p(0.59, R + 7.5), p(0.65, R + 6.8)], '#3a2c26', 1.2, 0.5);
  return s;
}

// ── 船（水の上の 小さな ぎょ船） ──
function ship() {
  const k = lot(1, 1);
  const hull = '#c9563c'; const deck = '#f2dfae';
  let s = '';
  s += k.pad(0.04, 0.04, 0.96, 0.96, '#57b6ea', 0.9, '#2f7fb8');
  s += k.flat([[0.04, 0.04, 0], [0.5, 0.04, 0], [0.04, 0.5, 0]], '#6cc3f0', 0.8);
  for (const [u, v] of [[0.16, 0.24], [0.7, 0.16], [0.14, 0.7], [0.62, 0.84]]) s += k.seg([[u, v, 0], [u + 0.07, v + 0.02, 0], [u + 0.14, v, 0]], '#c8ecfb', 0.8);
  // 船体（へさきは右手前）
  const z = 4.6; const v0 = 0.38; const v1 = 0.62;
  s += k.poly([[0.16, v1, 0.4], [0.74, v1, 0.4], [0.9, 0.5, z], [0.74, v1, z], [0.16, v1, z]], hull, 1);
  s += k.poly([[0.74, v1, 0.4], [0.9, 0.5, z], [0.9, 0.5, 0.4]], tone(hull, -0.2), 1);
  s += k.poly([[0.16, v0, z], [0.74, v0, z], [0.9, 0.5, z], [0.74, v1, z], [0.16, v1, z]], deck, 1);
  s += k.rule(k.SW(v1), 0.16, 3.2, 0.76, 3.2, '#fff6e6', 0.9);
  // そうだ室・えんとつ・はた
  s += k.box(0.3, 0.42, 0.52, 0.58, z, z + 5.4, '#fff6e6', { lw: 0.9 });
  s += k.panel(k.SW(0.58), 0.33, 0.49, z + 2, z + 4.4, '#8fd3f7', 0.5) + k.panel(k.SE(0.52), 0.445, 0.555, z + 2, z + 4.4, '#7cc4ec', 0.5);
  s += k.box(0.28, 0.4, 0.54, 0.6, z + 5.4, z + 6.4, '#3f6fb5', { lw: 0.8 });
  s += k.flag(0.62, 0.5, z, z + 10, '#f5c542', { len: 4.4, hgt: 3 });
  return s;
}

// ── 飛行機（ちゅうき場の 小さな飛行機） ──
function airplane() {
  const k = lot(1, 1);
  const white = '#f4f6f9'; const blue = '#3f86d8';
  let s = '';
  s += k.pad(0.04, 0.04, 0.96, 0.96, '#a3acb8', 0.9);
  s += k.seg([[0.1, 0.5, 0], [0.9, 0.5, 0]], '#f5c542', 1, 0.9);
  s += k.flat([[0.2, 0.2, 0.1], [0.86, 0.36, 0.1], [0.92, 0.5, 0.1], [0.86, 0.66, 0.1], [0.24, 0.82, 0.1], [0.34, 0.5, 0.1]], '#1e2a3a', 0.16);
  const z = 4.2;
  // おくの つばさ → 胴体 → 手前の つばさ → しっぽ
  s += k.poly([[0.44, 0.44, z + 1.6], [0.6, 0.44, z + 1.6], [0.5, 0.14, z + 1.2], [0.4, 0.14, z + 1.2]], white, 0.9);
  s += k.box(0.14, 0.44, 0.78, 0.56, z, z + 4.4, white, { se: '#d5dbe2', top: '#ffffff', lw: 1 });
  s += k.poly([[0.78, 0.44, z + 4.4], [0.9, 0.5, z + 2.6], [0.78, 0.56, z + 4.4]], '#ffffff', 0.9);
  s += k.poly([[0.78, 0.56, z], [0.9, 0.5, z + 1.2], [0.9, 0.5, z + 2.6], [0.78, 0.56, z + 4.4]], white, 0.9);
  s += k.band(k.SW(0.56), 0.14, 0.78, z + 1.4, z + 2.4, blue);
  for (let i = 0; i < 5; i++) s += k.panel(k.SW(0.56), 0.28 + i * 0.09, 0.33 + i * 0.09, z + 2.8, z + 3.8, '#8fd3f7', 0.4);
  s += k.poly([[0.44, 0.56, z + 1.6], [0.6, 0.56, z + 1.6], [0.5, 0.86, z + 1.2], [0.4, 0.86, z + 1.2]], white, 0.9);
  s += k.poly([[0.14, 0.5, z + 4.4], [0.26, 0.5, z + 4.4], [0.17, 0.5, z + 10], [0.12, 0.5, z + 10]], blue, 0.9);
  s += k.poly([[0.13, 0.4, z + 3.4], [0.22, 0.44, z + 3.4], [0.22, 0.56, z + 3.4], [0.13, 0.6, z + 3.4]], white, 0.8);
  return s;
}

// ── 橋（水路に かかる 赤い たいこ橋。v の向き（右おく ↔ 左手前）に わたる） ──
function bridge() {
  const k = lot(1, 1);
  const red = '#d9483b'; const deck = '#e9d3a8';
  const u0 = 0.3; const u1 = 0.7;
  // 橋のゆか: v に沿って山なりに そる（高さは まん中で 5.5）
  const arch = (v) => 0.6 + 5.4 * Math.sin(Math.PI * Math.min(1, Math.max(0, (v - 0.02) / 0.96)));
  const vs = [0.02, 0.18, 0.34, 0.5, 0.66, 0.82, 0.98];
  let s = '';
  // おくの らんかん
  s += k.bar(vs.map((v) => [u0, v, arch(v) + 4.4]), red, 1, 0.5);
  for (const v of [0.1, 0.34, 0.66, 0.9]) s += k.bar([[u0, v, arch(v)], [u0, v, arch(v) + 5.2]], red, 1.1, 0.5);
  // ゆか（板を つなぐ）と、手前の けた
  for (let i = 0; i < vs.length - 1; i++) {
    const a = vs[i]; const b = vs[i + 1];
    s += k.poly([[u0, a, arch(a)], [u1, a, arch(a)], [u1, b, arch(b)], [u0, b, arch(b)]], deck, 0.8);
  }
  s += k.poly([...vs.map((v) => [u1, v, arch(v)]), ...[...vs].reverse().map((v) => [u1, v, Math.max(0, arch(v) - 2.2)])], tone(red, -0.2), 0.9);
  // 手前の らんかん
  for (const v of [0.1, 0.34, 0.66, 0.9]) s += k.bar([[u1, v, arch(v)], [u1, v, arch(v) + 5.2]], red, 1.1, 0.5);
  s += k.bar(vs.map((v) => [u1, v, arch(v) + 4.4]), red, 1, 0.5);
  return s;
}

/**
 * 小さなものの絵の表（buildings-art.js の BUILDING_ART に足す）。形は建物と同じ:
 * { size: [w, h], base: [bw, bh], variants?, shadow?, draw(variant) }
 */
export const PROP_ART = {
  well: { size: [1, 1], base: [0.34, 0.34], draw: well },
  stone_lantern: { size: [1, 1], base: [0.18, 0.18], draw: stoneLantern },
  fountain: { size: [1, 1], base: [0.5, 0.5], draw: fountain },
  statue: { size: [1, 1], base: [0.28, 0.28], draw: statue },
  gold_statue: { size: [1, 1], base: [0.28, 0.28], draw: goldStatue },
  windmill: { size: [1, 1], base: [0.36, 0.36], draw: windmill },
  garden: { size: [1, 1], base: [0.92, 0.92], shadow: 'none', draw: garden },
  zen_garden: { size: [1, 1], base: [0.92, 0.92], shadow: 'none', draw: zenGarden },
  playground: { size: [1, 1], base: [0.92, 0.92], shadow: 'none', draw: playground },
  bench: { size: [1, 1], base: [0.4, 0.12], draw: bench },
  mailbox: { size: [1, 1], base: [0.17, 0.17], draw: mailbox },
  phone_booth: { size: [1, 1], base: [0.18, 0.18], draw: phoneBooth },
  street_light: { size: [1, 1], base: [0.1, 0.1], draw: streetLight },
  bus_stop: { size: [1, 1], base: [0.12, 0.12], draw: busStop },
  vending_machine: { size: [1, 1], base: [0.18, 0.12], draw: vendingMachine },
  trash_can: { size: [1, 1], base: [0.15, 0.15], draw: trashCan },
  car: { size: [1, 1], base: [0.72, 0.34], shadow: 'own', variants: CAR_COLORS.length, draw: car },
  bus: { size: [1, 1], base: [0.9, 0.36], shadow: 'own', variants: 2, draw: bus },
  fire_truck: { size: [1, 1], base: [0.88, 0.34], shadow: 'own', draw: fireTruck },
  bicycle: { size: [1, 1], base: [0.4, 0.08], shadow: 'own', draw: bicycle },
  ship_vehicle: { size: [1, 1], base: [0.92, 0.92], shadow: 'none', draw: ship },
  airplane: { size: [1, 1], base: [0.92, 0.92], shadow: 'none', draw: airplane },
  bridge: { size: [1, 1], base: [0.4, 0.96], shadow: 'none', draw: bridge },
};
