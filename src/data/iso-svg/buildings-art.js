// 建物の絵（新しい絵がら）— マイ漢字タウン
//
// 「小さな家」と同じ絵がらで描きなおした建物。部品は kit.js にある。
// 絵は文字列で作り、文書の <defs> に「使うときに 1 回だけ」置いて <use> で呼びだす
// （buildings.jsx）。町に同じ建物が何十も建っても、1 つあたり 2 要素ですむ。
//
// 1 つの絵は { size: [w, h], base: [bw, bh], variants, draw(variant) }。
//   size : 敷地（マス）。town-items.jsx の size と同じにする
//   base : 建物の足もとの大きさ（マス）。影の大きさに使う（town-item-fit.js の KIT_BASE と同じ値）
//   draw : kit.js の座標（原点は敷地のまん中）で描いた絵の中身を返す
//
// ⚠️ ここで作る文字列は innerHTML に入れる。色と形は、すべてこのファイルと kit.js の中の値から作る。

import { INK, lot, num, pen, tone } from './kit.js';
import { HOUSE_PALETTES } from './house-art.js';

const CREAM = '#fff6e6';
const STONE = '#ddd6ca';
const PAVING = '#e9e2d6';
const PAVING_LINE = '#b9ae9c';

// ── お店（八百屋のような小さな店。屋根と ひさしの色が 3 通り） ──
const SHOP_COLORS = [
  { roof: '#3b9ae0', awn: '#2f7fd1', door: '#2f7fd1' },
  { roof: '#43b86a', awn: '#2f9e58', door: '#2f9e58' },
  { roof: '#f08a3c', awn: '#e2702a', door: '#d9632a' },
];
function shop(variant) {
  const k = lot(1, 1);
  const c = SHOP_COLORS[variant % SHOP_COLORS.length];
  const u0 = 0.14; const u1 = 0.86; const v0 = 0.22; const v1 = 0.8;
  const um = (u0 + u1) / 2;
  const wallH = 17.5; const rise = 12;
  const front = k.SW(v1);
  const side = k.SE(u1);
  let s = '';
  // 店の前の しき石
  s += k.pad(0.07, v1, 0.94, 0.985, PAVING, 0.8, PAVING_LINE);
  // 壁（左手前が、とがった妻の壁）・はば木・のき下の かげ
  s += k.gableWalls(u0, v0, u1, v1, wallH, rise, CREAM, 'v');
  s += k.plinth(u0, v0, u1, v1, 2.2, '#b9a58c');
  s += k.band(side, v0, v1, wallH - 3, wallH, tone(CREAM, -0.3), 0.6);
  // ショーウィンドウとドア
  s += k.glass(front, 0.2, 0.53, 3, 12, 2);
  s += k.door(front, 0.59, 0.79, 0, 12.4, { color: c.door });
  // 妻の丸い かんばん（買いものかご）
  s += k.dot(um, v1, wallH + 4.4, 4, '#ffffff', 1) + k.dot(um, v1, wallH + 4.4, 3, c.awn, 0)
    + k.onFace(front, um, wallH + 4.4, '<path d="M-1.9 -0.5L1.9 -0.5L1.4 1.7L-1.4 1.7Z" fill="#ffffff"/><path d="M-1.2 -0.5Q0 -2.8 1.2 -0.5" fill="none" stroke="#ffffff" stroke-width="0.7" stroke-linecap="round"/>');
  // よこの窓
  s += k.win(side, 0.38, 0.64, 5.4, 12.6);
  // 屋根（右手前へ下がる面が見える）
  s += k.gableRoof(u0, v0, u1, v1, wallH, rise, c.roof, 'v', { over: 0.06 });
  // ひさし（店の中が見えるよう、浅くする）
  s += k.awning(front, 0.17, 0.83, 16, { c1: c.awn, c2: '#fff7ed', n: 6, depth: 0.1, drop: 2.2 });
  // 店先の木箱（くだもの・やさい）
  s += k.box(0.2, 0.87, 0.33, 0.96, 0, 2.6, '#c98a4b', { lw: 0.9 });
  s += k.dot(0.235, 0.905, 3.3, 1.3, '#ff6b5e', 0.5) + k.dot(0.295, 0.925, 3.3, 1.3, '#ffb02e', 0.5) + k.dot(0.27, 0.885, 3.9, 1.2, '#ff6b5e', 0.5);
  s += k.box(0.37, 0.87, 0.5, 0.96, 0, 2.6, '#c98a4b', { lw: 0.9 });
  s += k.dot(0.405, 0.905, 3.3, 1.3, '#7ac74f', 0.5) + k.dot(0.465, 0.925, 3.3, 1.3, '#7ac74f', 0.5) + k.dot(0.44, 0.885, 3.9, 1.2, '#f6e05e', 0.5);
  // 入口の よこの はち植え
  s += k.pot(0.89, 0.91, 0.85);
  return s;
}

// ── 城壁（石づみの かべ。ならべると とりでの かべになる） ──
function wall() {
  const k = lot(1, 1);
  const stone = '#c5cad3'; const shade = '#9ca5b3'; const top = '#dadee6'; const joint = '#6f7887';
  const a = 0.03; const b = 0.97; const H = 16.5;
  const front = k.SW(b); const side = k.SE(b);
  let s = k.box(a, a, b, b, 0, H, stone, { se: shade, top });
  // 石の目地（よこの段と、たがいちがいの たての つぎ目）
  const rows = [0, 4.2, 8.3, 12.4, H];
  for (const [face, lite] of [[front, true], [side, false]]) {
    for (let i = 1; i < rows.length - 1; i++) s += k.rule(face, a, rows[i], b, rows[i], joint, 0.7, 0.65);
    for (let i = 0; i < rows.length - 1; i++) {
      for (let j = 0; j < 4; j++) {
        const t = a + (j + (i % 2 ? 0.5 : 0.08)) * 0.235;
        if (t < b - 0.03) s += k.rule(face, t, rows[i], t, rows[i + 1], joint, 0.7, 0.55);
      }
    }
    // 色の ちがう石
    s += k.band(face, a + 0.26, a + 0.47, 4.4, 8.1, lite ? '#d6dbe3' : '#aab2bf', 0.9)
      + k.band(face, a + 0.6, a + 0.8, 8.5, 12.2, lite ? '#b4bbc7' : '#8e97a6', 0.8)
      + k.band(face, a + 0.02, a + 0.2, 12.6, H - 0.2, lite ? '#b9c0cb' : '#929baa', 0.7);
  }
  // 上の通り道
  s += k.pad(a + 0.15, a + 0.15, b - 0.15, b - 0.15, '#b9c0cb', 0.7, joint, H);
  // のこぎり形の かべ（ぐるりと 1 周。奥から手前へ描く）
  const starts = [a, a + 0.26, a + 0.52, a + 0.78];
  const merlons = [];
  for (const t of starts) {
    merlons.push([t, a, t + 0.16, a + 0.14]);
    merlons.push([t, b - 0.14, t + 0.16, b]);
  }
  for (const t of starts.slice(1, 3)) {
    merlons.push([a, t, a + 0.14, t + 0.16]);
    merlons.push([b - 0.14, t, b, t + 0.16]);
  }
  merlons.sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]));
  for (const [ua, va, ub, vb] of merlons) s += k.box(ua, va, ub, vb, H, H + 4.6, stone, { se: shade, top, lw: 1 });
  return s;
}

// ── 柵（木の さく。足もとに草と花） ──
function fence() {
  const k = lot(1, 1);
  const wood = '#d39a5c'; const dark = '#a8743f';
  const v = 0.5;
  let s = '';
  s += k.tuft(0.2, 0.44, 1.1) + k.tuft(0.56, 0.45, 0.9, '#6fb84a') + k.tuft(0.84, 0.44, 1);
  // よこ木（2 本）
  for (const z of [3.4, 7]) s += k.box(0.02, v - 0.015, 0.98, v + 0.015, z, z + 1.7, wood, { se: dark, top: tone(wood, 0.25), lw: 0.9 });
  // くい（4 本。先を とがらせる）
  for (const u of [0.08, 0.36, 0.64, 0.92]) {
    s += k.box(u - 0.03, v - 0.03, u + 0.03, v + 0.03, 0, 10, wood, { se: dark, top: tone(wood, 0.25), lw: 0.9 });
    s += k.poly([[u - 0.03, v + 0.03, 10], [u + 0.03, v + 0.03, 10], [u, v, 12.4]], tone(wood, 0.12), 0.9)
      + k.poly([[u + 0.03, v + 0.03, 10], [u + 0.03, v - 0.03, 10], [u, v, 12.4]], dark, 0.9);
  }
  s += k.tuft(0.14, 0.6, 1.2) + k.tuft(0.48, 0.6, 1.1, '#6fb84a') + k.tuft(0.78, 0.61, 1.2);
  s += k.flowers([[0.26, 0.6], [0.3, 0.64], [0.62, 0.6], [0.9, 0.62]], ['#ff8fb8', '#ffffff', '#ffd24a']);
  return s;
}

// ── 鉱山（岩山に 木のわくの入口。手前に トロッコ） ──
function mine() {
  const k = lot(1, 1);
  const rock = '#9199a6'; const lite = '#b9c0ca'; const dark = '#6b7381'; const deep = '#555d6b';
  const fv = 0.82; const su = 0.9;
  const front = k.SW(fv); const side = k.SE(su);
  let s = '';
  // 岩山（左手前の面・右手前の面・上の かたまり）
  const swRidge = [[0.1, fv, 11], [0.24, fv, 21], [0.46, fv, 27], [0.72, fv, 22], [su, fv, 13]];
  const seRidge = [[su, 0.58, 19], [su, 0.34, 17], [su, 0.16, 8]];
  const peaks = [[0.7, 0.2, 22], [0.44, 0.24, 35], [0.2, 0.44, 23]];
  s += k.poly([...swRidge, ...seRidge, ...peaks], rock);
  s += k.flat([[0.2, 0.44, 23], [0.44, 0.24, 35], [0.46, fv, 27], [0.24, fv, 21], [0.1, fv, 11]], lite, 0.9);
  s += k.flat([[0.44, 0.24, 35], [0.7, 0.2, 22], [su, 0.34, 17], [su, 0.58, 19], [0.72, fv, 22], [0.46, fv, 27]], tone(rock, 0.08));
  s += k.flat([[0.7, 0.2, 22], [su, 0.16, 8], [su, 0.34, 17]], dark, 0.9);
  s += k.seg([[0.44, 0.24, 35], [0.46, fv, 27]], deep, 0.9, 0.7) + k.seg([[0.44, 0.24, 35], [su, 0.58, 19]], deep, 0.9, 0.7)
    + k.seg([[0.2, 0.44, 23], [0.24, fv, 21]], deep, 0.8, 0.6) + k.seg([[0.7, 0.2, 22], [su, 0.34, 17]], deep, 0.8, 0.6);
  s += k.poly([[0.1, fv, 0], [su, fv, 0], ...swRidge.slice().reverse()], tone(rock, 0.06));
  s += k.poly([[su, fv, 0], [su, 0.16, 0], [su, 0.16, 8], [su, 0.34, 17], [su, 0.58, 19], [su, fv, 13]], dark);
  s += k.flat([[0.12, fv, 2], [0.26, fv, 0.4], [0.3, fv, 8], [0.16, fv, 9]], lite, 0.7) + k.flat([[0.78, fv, 14], [0.87, fv, 10], [0.86, fv, 3], [0.79, fv, 6]], dark, 0.6);
  s += k.rule(side, 0.5, 2, 0.4, 12, deep, 0.8, 0.6) + k.rule(side, 0.7, 0.5, 0.64, 9, deep, 0.8, 0.5);
  // 入口（暗い あな・木のわく・ランプ）
  s += k.panel(front, 0.33, 0.67, 0, 15, '#2a2320', 1);
  s += k.flat([front(0.35, 0), front(0.65, 0), front(0.57, 7), front(0.43, 7)], '#4a3c33', 0.9);
  s += k.panel(front.out(0.01), 0.285, 0.36, 0, 15.6, '#b58150', 0.9) + k.panel(front.out(0.01), 0.64, 0.715, 0, 15.6, '#b58150', 0.9)
    + k.panel(front.out(0.012), 0.25, 0.75, 14.8, 18.4, '#c8935c', 0.9);
  s += k.dot(0.5, fv + 0.012, 12.4, 1.7, '#ffd24a', 0.6) + k.dot(0.5, fv + 0.012, 12.4, 0.8, '#fff6c2', 0);
  // レールと まくら木
  for (const v of [0.86, 0.91, 0.96]) s += k.seg([[0.4, v, 0.3], [0.6, v, 0.3]], '#8a5a33', 1.3);
  s += k.seg([[0.44, fv, 0.5], [0.44, 1, 0.5]], '#5b6470', 1) + k.seg([[0.56, fv, 0.5], [0.56, 1, 0.5]], '#5b6470', 1);
  // トロッコ（金の かたまりを つんでいる）
  s += k.box(0.41, 0.87, 0.59, 0.97, 1.6, 5.6, '#7d8896', { se: '#5d6775', top: '#3f4651', lw: 1 });
  s += k.dot(0.47, 0.91, 6.3, 1.5, '#ffc93c', 0.5) + k.dot(0.53, 0.93, 6.2, 1.4, '#ffd966', 0.5) + k.dot(0.5, 0.9, 7.1, 1.2, '#ffe9a0', 0.5);
  s += k.dot(0.44, 0.975, 1.5, 1.2, '#3b424c', 0.5) + k.dot(0.56, 0.975, 1.5, 1.2, '#3b424c', 0.5);
  // つるはし
  s += k.seg([[0.2, 0.9, 0.4], [0.27, 0.86, 7]], '#8a5a33', 1.2) + k.curve([0.22, 0.86, 7.4], [0.27, 0.86, 9], [0.33, 0.86, 6.6], '#aab3bf', 1.1, 0.5);
  return s;
}

// ── 鳥居（朱色の門。上の横木が そり上がる） ──
function torii() {
  const k = lot(1, 1);
  const red = '#e8452f'; const redDark = '#b9301f'; const black = '#33313a';
  const v = 0.5; const ul = 0.21; const ur = 0.79;
  let s = '';
  // 台石
  for (const u of [ul, ur]) s += k.cyl(u, v, 0.075, 0, 2.6, '#b9b2a6', { lw: 1 });
  // 貫（ぬき。柱を つらぬく下の横木）
  s += k.box(0.07, v - 0.028, 0.93, v + 0.028, 17.4, 20.2, red, { se: redDark, top: tone(red, 0.25), lw: 1 });
  // 柱（奥の左、手前の右）
  for (const u of [ul, ur]) s += k.cyl(u, v, 0.05, 2.6, 26, red, { lw: 1.1, top: false });
  // まん中の ふだ（額束）
  s += k.box(0.47, v - 0.02, 0.53, v + 0.02, 20.2, 25.6, redDark, { lw: 0.9 });
  s += k.panel(k.SW(v + 0.022), 0.455, 0.545, 20.8, 25.2, '#3a4a7a', 0.8) + k.band(k.SW(v + 0.023), 0.47, 0.53, 21.6, 24.4, '#f3d98a');
  // 島木（朱）と 笠木（黒）。はしが そり上がる
  s += k.curve([-0.02, v, 27.6], [0.5, v, 25.2], [1.02, v, 27.6], red, 3, 0.8);
  s += k.curve([-0.06, v, 31], [0.5, v, 27.8], [1.06, v, 31], black, 3.4, 0.8);
  s += k.curve([-0.05, v, 31.9], [0.5, v, 28.7], [1.05, v, 31.9], '#55535e', 0.9, 0);
  // くさび
  s += k.dot(ul, v + 0.03, 18.8, 0.9, '#ffd24a', 0.4) + k.dot(ur, v + 0.03, 18.8, 0.9, '#ffd24a', 0.4);
  return s;
}

// ── 守り神（石の台に とぐろを まく、みどりの竜） ──
function dragon() {
  const k = lot(1, 1);
  const green = '#2fa866'; const belly = '#f2df8c'; const deep = '#1d7a48';
  const [cx, cy] = k.xy(0.5, 0.5, 0);
  const g = (d, w, c) => `<path d="${d}" fill="none"${pen(w, c)}/>`;
  let s = '';
  // 石の台
  s += k.cyl(0.5, 0.5, 0.3, 0, 3.4, '#c9c2b6', { lw: 1.1 });
  s += k.disc(0.5, 0.5, 3.4, 0.22, '#b4ad9f', 0.7);
  // からだ（とぐろ → 立ち上がる首）
  const body = 'M11 -5C13 2 -3 6 -11 1C-17 -3 -12 -11 -3 -9C7 -7 12 -14 6 -20C2 -24 -4 -22 -5 -27';
  let art = g(body, 8.2, INK) + g(body, 6.6, green);
  art += g('M-10.5 -1.5C-13 -5 -9 -8.5 -3.6 -7.2C6 -5 11.6 -12 7.4 -18.6C4.6 -22.6 -1.4 -21.4 -2.6 -26.4', 2, belly);
  // せびれ
  art += `<path d="M9.6 -15.4l3.6 -1.6-2.2 3.4zM7.8 -21.6l2.8 -2.6-.8 3.8zM-12.6 -8.4l-3.2 -2.4 1 3.8zM12.6 -1l3.8 -.4-2.8 2.6z" fill="${deep}"${pen(0.7)}/>`;
  // しっぽの先
  art += `<path d="M10.6 -6.6l3.4 -3.2.6 4.2z" fill="${deep}"${pen(0.7)}/>`;
  // 頭（つの・目・ひげ）
  art += `<path d="M-1 -27.5C-1 -32.5 -8 -34.5 -12.5 -31.5L-16.5 -29.5C-17.8 -28.8 -17.6 -26.8 -16 -26.6L-11 -26C-9 -23.4 -3 -23 -1 -27.5Z" fill="${green}"${pen(1.1)}/>`
    + `<path d="M-15.8 -27.4L-11.2 -27" fill="none"${pen(0.7)}/>`
    + `<path d="M-4.6 -32.4l1 -4.4 2.4 3.8zM-8.4 -33.2l-.6 -4.2 2.8 3z" fill="#fff3c4"${pen(0.7)}/>`
    + `<circle cx="-8.2" cy="-29.6" r="1.7" fill="#ffffff"${pen(0.6)}/><circle cx="-8.6" cy="-29.5" r="0.75" fill="${INK}"/>`
    + `<path d="M-15 -28.6q-3 -.4 -4.6 -3M-14.4 -26.6q-2.6 1.4 -5.4 .6" fill="none"${pen(0.7, '#f2df8c')}/>`;
  // 宝の玉
  art += `<circle cx="-6.6" cy="-14.6" r="3.3" fill="#ffc93c"${pen(0.9)}/><circle cx="-7.6" cy="-15.7" r="1.1" fill="#fff3c4"/>`;
  s += `<g transform="translate(${num(cx)} ${num(cy - 3.4)})">${art}</g>`;
  return s;
}

// ── 鐘楼（石の台・4 本の柱・かわら屋根の下に つりがね） ──
function bellTower() {
  const k = lot(1, 1);
  const wood = '#a8683a'; const woodDark = '#7f4c28'; const roof = '#5a6680';
  const a = 0.26; const b = 0.74; const baseH = 3.6; const postH = 24;
  let s = '';
  s += k.box(a - 0.07, a - 0.07, b + 0.07, b + 0.07, 0, baseH, STONE, { lw: 1.1 });
  s += k.steps(k.SW(b + 0.07), 0.4, 0.6, 1, { rise: 1.8, run: 0.05 });
  const post = (u, v) => k.box(u - 0.026, v - 0.026, u + 0.026, v + 0.026, baseH, postH, wood, { se: woodDark, lw: 0.9 });
  s += post(a, a) + post(b, a) + post(a, b);
  // 横木（柱を つなぐ）
  s += k.bar([[a, a, postH - 2.6], [b, a, postH - 2.6]], woodDark, 1.4, 0.6) + k.bar([[a, a, postH - 2.6], [a, b, postH - 2.6]], wood, 1.4, 0.6);
  // つりがね（手前の柱の うしろに下がるので、柱より ずっと太く描く）
  const [bx, by] = k.xy(0.5, 0.5, postH - 5.4);
  s += k.seg([[0.5, 0.5, postH - 2], [0.5, 0.5, postH - 5.4]], woodDark, 1.2);
  s += `<path d="M${num(bx - 4.4)} ${num(by + 2.2)}Q${num(bx - 4.6)} ${num(by)} ${num(bx)} ${num(by)}Q${num(bx + 4.6)} ${num(by)} ${num(bx + 4.4)} ${num(by + 2.2)}L${num(bx + 6.4)} ${num(by + 11.6)}Q${num(bx)} ${num(by + 14.4)} ${num(bx - 6.4)} ${num(by + 11.6)}Z" fill="#6f9a8a"${pen(1.1)}/>`
    + `<path d="M${num(bx - 3.8)} ${num(by + 2.4)}Q${num(bx - 3.6)} ${num(by + 1)} ${num(bx - 1.4)} ${num(by + 0.8)}L${num(bx - 3)} ${num(by + 12)}L${num(bx - 5.6)} ${num(by + 11)}Z" fill="#a4c7b6" opacity="0.9"/>`
    + `<path d="M${num(bx + 2.2)} ${num(by + 1.2)}L${num(bx + 4.2)} ${num(by + 2.6)}L${num(bx + 5.8)} ${num(by + 11.2)}L${num(bx + 3.4)} ${num(by + 12.4)}Z" fill="#4f7668" opacity="0.8"/>`
    + `<path d="M${num(bx - 5.9)} ${num(by + 9.2)}Q${num(bx)} ${num(by + 11.8)} ${num(bx + 5.9)} ${num(by + 9.2)}" fill="none"${pen(0.8, '#3f5f54')}/>`;
  s += k.bar([[a, b, postH - 2.6], [b, b, postH - 2.6]], wood, 1.4, 0.6) + k.bar([[b, a, postH - 2.6], [b, b, postH - 2.6]], woodDark, 1.4, 0.6);
  s += post(b, b);
  // かわら屋根（方形）と てっぺんの玉
  s += k.hipRoof(a - 0.03, a - 0.03, b + 0.03, b + 0.03, postH, 9, roof, { over: 0.07, drop: 0.5, cap: '#ffd24a' });
  return s;
}

// ── 時計塔（レンガの塔。2 つの面に時計、とんがり屋根） ──
function clockTower() {
  const k = lot(1, 1);
  const brick = '#d9825a'; const trim = '#fff1dc'; const roof = '#3f6fb5';
  const a = 0.3; const b = 0.7; const H = 33.5;
  const front = k.SW(b); const side = k.SE(b);
  let s = '';
  s += k.box(a - 0.05, a - 0.05, b + 0.05, b + 0.05, 0, 3, STONE, { lw: 1.1 });
  s += k.box(a, a, b, b, 3, H, brick, { se: tone(brick, -0.2) });
  // レンガの目地
  for (const [face, c] of [[front, tone(brick, -0.25)], [side, tone(brick, -0.4)]]) {
    for (let z = 6; z < 20; z += 3) s += k.rule(face, a, z, b, z, c, 0.6, 0.6);
  }
  // 入口と小窓
  s += k.door(front, 0.43, 0.57, 3, 11, { color: '#8a5a33', pane: false });
  s += k.win(side, 0.45, 0.55, 12, 17, { bars: 'none' });
  s += k.win(front, 0.45, 0.55, 13, 18, { bars: 'none' });
  // 時計の だん（白い帯）
  s += k.box(a - 0.025, a - 0.025, b + 0.025, b + 0.025, 20, 21.6, trim, { lw: 0.9 });
  const clock = (face) => k.onFace(face, 0.5, 26.2, `<circle r="4.3" fill="#ffffff"${pen(1)}/><circle r="3.2" fill="none"${pen(0.5, '#c9b78f')}/><path d="M0 0V-2.6M0 0L1.8 .9" fill="none"${pen(0.8)}/><circle r="0.55" fill="${INK}"/>`);
  s += clock(front) + clock(side);
  s += k.box(a - 0.025, a - 0.025, b + 0.025, b + 0.025, H - 0.4, H + 1.2, trim, { lw: 0.9 });
  // とんがり屋根と はた
  s += k.hipRoof(a, a, b, b, H + 1.2, 13, roof, { over: 0.05, drop: 0.2, plain: true });
  s += k.flag(0.5, 0.5, H + 14, H + 20, '#ef4444', { len: 5, hgt: 3.2 });
  return s;
}

// ── 祭りの舞台（紅白の まくの やぐら。上に たいこ、四方へ ちょうちん） ──
function festivalStage() {
  const k = lot(1, 1);
  const wood = '#c98a4b'; const woodDark = '#9a6433'; const roof = '#d93a3a';
  const a = 0.24; const b = 0.76; const deck = 9; const postH = 26;
  const front = k.SW(b); const side = k.SE(b);
  let s = '';
  // ちょうちんの ひも（奥の 2 本）
  const lanterns = (from, to, colors) => {
    let out = k.seg([from, to], '#5b4636', 0.7);
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      out += k.dot(from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t - 1.6, 1.7, colors[i % colors.length], 0.6);
    }
    return out;
  };
  s += lanterns([a, a, postH + 2], [0.02, 0.02, 3], ['#ffffff', '#ff5a4d', '#ffd24a']);
  // 台（紅白の まく）
  s += k.box(a, a, b, b, 0, deck, '#ffffff', { se: '#e6e6ea', top: wood });
  for (const face of [front, side]) {
    for (let i = 0; i < 4; i++) {
      const t0 = a + ((b - a) * (i * 2)) / 8;
      s += k.band(face, t0, t0 + (b - a) / 8, 0.4, deck - 1.4, face.side === 'sw' ? '#ef4444' : '#cf3030');
    }
    s += k.panel(face, a, b, deck - 1.4, deck, face.side === 'sw' ? wood : woodDark, 0.9);
    s += k.panel(face, a, b, 0, deck - 1.4, 'none', 1);
  }
  // 手すり
  const post = (u, v, top) => k.box(u - 0.025, v - 0.025, u + 0.025, v + 0.025, deck, top, wood, { se: woodDark, lw: 0.8 });
  s += post(a, a, postH);
  s += k.bar([[a, a, deck + 4], [b, a, deck + 4]], wood, 1) + k.bar([[a, a, deck + 4], [a, b, deck + 4]], wood, 1);
  s += post(b, a, postH) + post(a, b, postH);
  // たいこ
  s += k.cyl(0.5, 0.5, 0.11, deck + 1, deck + 6.4, '#b5442f', { top: '#fff1dc', lw: 1 });
  s += k.bar([[a, b, deck + 4], [b, b, deck + 4]], wood, 1) + k.bar([[b, a, deck + 4], [b, b, deck + 4]], wood, 1);
  s += post(b, b, postH);
  // 屋根
  s += k.hipRoof(a - 0.02, a - 0.02, b + 0.02, b + 0.02, postH, 8, roof, { over: 0.08, drop: 0.4, plain: true, cap: '#ffd24a' });
  // ちょうちんの ひも（手前の 3 本）
  s += lanterns([b, a, postH + 2], [0.98, 0.02, 3], ['#ffd24a', '#ffffff', '#ff5a4d']);
  s += lanterns([a, b, postH + 2], [0.02, 0.98, 3], ['#ff5a4d', '#ffd24a', '#ffffff']);
  s += lanterns([b, b, postH + 2], [0.98, 0.98, 3], ['#ffffff', '#ff5a4d', '#ffd24a']);
  return s;
}

// ── 大きな家（2 階だて と 車庫。色は「小さな家」と同じ 8 通り） ──
function house2(variant) {
  const k = lot(2, 1);
  const p = HOUSE_PALETTES[variant % HOUSE_PALETTES.length];
  const u0 = 0.14; const u1 = 1.3; const v0 = 0.2; const v1 = 0.82;
  const H = 24; const rise = 12.5; const vm = (v0 + v1) / 2;
  const front = k.SW(v1); const side = k.SE(u1);
  const sill = '#a9683a';
  let s = '';
  // 車庫の前の しき石と、玄関の ふみ石
  s += k.pad(1.36, v1, 1.82, 0.99, PAVING, 0.8, PAVING_LINE);
  s += k.oval(0.74, 0.97, 0, 3.6, 1.8, '#e6dfd4', 0.9);
  // 母屋の壁
  s += k.gableWalls(u0, v0, u1, v1, H, rise, p.wallSW, 'u', { se: p.wallSE });
  s += k.panel(front, u0, u1, 0, 2.4, p.baseSW, 1.1) + k.panel(side, v0, v1, 0, 2.4, p.baseSE, 1.1);
  s += k.band(front, u0, u1, 12.2, 13.2, tone(p.wallSW, -0.12)) + k.band(side, v0, v1, 12.2, 13.2, tone(p.wallSE, -0.12));
  s += k.band(front, u0, u1, H - 3.2, H, tone(p.wallSW, -0.18), 0.7);
  // 玄関
  s += k.steps(front, 0.6, 0.88, 1, { rise: 1.3, run: 0.085 });
  s += k.door(front, 0.64, 0.84, 1.3, 11.6);
  // 1 階の窓（花の箱つき）と 2 階の窓
  s += k.win(front, 0.24, 0.48, 5.2, 11.2, { sill }) + k.win(front, 0.96, 1.2, 5.2, 11.2, { sill });
  [[0.28, '#ff6b81'], [0.36, '#ffd24a'], [0.44, '#ffffff'], [1, '#ffd24a'], [1.08, '#ff6b81'], [1.16, '#ffffff']]
    .forEach(([u, color]) => { s += k.dot(u, v1 + 0.03, 4.9, 1.15, color, 0.4); });
  s += k.wins(front, 0.2, 1.24, 3, 15.4, 21.2);
  s += k.win(side, 0.3, 0.5, 15.4, 21.2);
  // 屋根うらの丸窓
  s += k.onFace(side, vm, H + 5, `<circle r="2.6" fill="#8fd3f7"${pen(1)}/>`);
  // 母屋の屋根と えんとつ
  s += k.gableRoof(u0, v0, u1, v1, H, rise, p.roofL, 'u', { dark: p.roofD });
  s += k.box(0.36, 0.36, 0.47, 0.47, H + 6, H + rise + 4.5, p.baseSW, { se: p.baseSE, lw: 1.1 });
  s += k.smoke(0.415, 0.415, H + rise + 8.5);
  // 車庫
  const g0 = u1; const g1 = 1.86; const gv0 = 0.32; const gH = 11; const gRise = 6;
  const gFront = k.SW(v1); const gSide = k.SE(g1);
  s += k.gableWalls(g0, gv0, g1, v1, gH, gRise, p.wallSW, 'u', { se: p.wallSE });
  s += k.panel(gFront, g0, g1, 0, 2.4, p.baseSW, 1.1) + k.panel(gSide, gv0, v1, 0, 2.4, p.baseSE, 1.1);
  s += k.panel(gFront, 1.38, 1.78, 0, 8.8, '#ffffff', 1) + k.band(gFront, 1.4, 1.76, 0.3, 8.2, '#e9e4dc');
  for (const z of [2.3, 4.3, 6.3]) s += k.rule(gFront, 1.4, z, 1.76, z, '#b9ae9c', 0.7);
  s += k.win(gSide, 0.46, 0.68, 4.2, 8.6);
  s += k.gableRoof(g0, gv0, g1, v1, gH, gRise, p.roofL, 'u', { dark: p.roofD });
  // 庭の しげみ
  s += k.bush(0.2, 0.95, 1, { flowers: ['#fff3a0', '#ff8fb8'] }) + k.bush(1.93, 0.95, 0.75);
  return s;
}

// ── 豪邸（寄棟の大屋根・まん中の はり出し・庭。色は 8 通り） ──
function house3(variant) {
  const k = lot(3, 2);
  const p = HOUSE_PALETTES[variant % HOUSE_PALETTES.length];
  const u0 = 0.42; const u1 = 2.58; const v0 = 0.24; const v1 = 1.16; const H = 26;
  const front = k.SW(v1); const side = k.SE(u1);
  const sill = '#a9683a';
  let s = '';
  // 庭（芝・小道・うしろの木）
  s += k.pad(0.05, 0.05, 2.95, 1.95, '#a8dd76', 0.9, '#6aa84a');
  s += k.pad(1.37, 1.56, 1.63, 1.95, PAVING, 0.8, PAVING_LINE);
  s += k.fir(0.2, 0.34, 1.5) + k.tree(2.8, 0.3, 1.25);
  s += k.shadow(u0, v0, u1, v1, 0.2);
  // 母屋
  s += k.box(u0, v0, u1, v1, 0, H, p.wallSW, { se: p.wallSE });
  s += k.panel(front, u0, u1, 0, 2.6, p.baseSW, 1.1) + k.panel(side, v0, v1, 0, 2.6, p.baseSE, 1.1);
  s += k.band(front, u0, u1, 12.8, 13.9, tone(p.wallSW, -0.12)) + k.band(side, v0, v1, 12.8, 13.9, tone(p.wallSE, -0.12));
  s += k.eaveShade(u0, v0, u1, v1, H, 3.4, p.wallSW);
  s += k.wins(front, 0.5, 1.14, 2, 5.4, 11.6, { sill }) + k.wins(front, 1.86, 2.5, 2, 5.4, 11.6, { sill });
  s += k.wins(front, 0.5, 1.14, 2, 16, 22.2) + k.wins(front, 1.86, 2.5, 2, 16, 22.2);
  s += k.wins(side, 0.34, 1.06, 2, 5.4, 11.6, { sill }) + k.wins(side, 0.34, 1.06, 2, 16, 22.2);
  s += k.hipRoof(u0, v0, u1, v1, H, 13.5, p.roofL, { dark: p.roofD, over: 0.07 });
  // えんとつ（2 本）
  for (const [cu, cv] of [[0.9, 0.5], [2.1, 0.52]]) {
    s += k.box(cu, cv, cu + 0.12, cv + 0.12, H + 8, H + 20, p.baseSW, { se: p.baseSE, lw: 1.1 });
  }
  s += k.smoke(0.96, 0.56, H + 24);
  // まん中の はり出し（妻が正面を向く）
  const b0 = 1.18; const b1 = 1.82; const bv0 = 0.9; const bv1 = 1.46; const bRise = 10;
  const bay = k.SW(bv1); const baySide = k.SE(b1);
  s += k.gableWalls(b0, bv0, b1, bv1, H, bRise, p.wallSW, 'v', { se: p.wallSE });
  s += k.panel(bay, b0, b1, 0, 2.6, p.baseSW, 1.1) + k.panel(baySide, v1, bv1, 0, 2.6, p.baseSE, 1.1);
  s += k.band(bay, b0, b1, 12.8, 13.9, tone(p.wallSW, -0.12));
  s += k.steps(bay, 1.34, 1.66, 2, { rise: 1.3, run: 0.05 });
  s += k.door(bay, 1.39, 1.61, 2.6, 12.4, { double: true, color: '#b5652f' });
  s += k.win(bay, 1.36, 1.64, 16, 22.4);
  s += k.onFace(bay, 1.5, H + 4.6, `<circle r="2.5" fill="#8fd3f7"${pen(1)}/>`);
  s += k.win(baySide, 1.22, 1.4, 16, 22.2, { bars: 'v' });
  s += k.gableRoof(b0, bv0, b1, bv1, H, bRise, p.roofL, 'v', { dark: p.roofD });
  // 玄関の ひさし（白い柱 2 本）
  s += k.bar([[1.3, bv1 + 0.16, 0], [1.3, bv1 + 0.16, 13]], '#ffffff', 1.6, 0.6);
  s += k.box(1.26, bv1, 1.74, bv1 + 0.2, 13, 14.6, '#ffffff', { se: '#e3ddd2', lw: 1 });
  s += k.bar([[1.7, bv1 + 0.16, 0], [1.7, bv1 + 0.16, 13]], '#ffffff', 1.6, 0.6);
  // 庭（生けがき・木・花）
  s += k.box(0.14, 1.8, 1.22, 1.9, 0, 3.6, '#3f9a4f', { se: '#2f7d3f', top: '#62bd62', lw: 1 });
  s += k.box(1.78, 1.8, 2.86, 1.9, 0, 3.6, '#3f9a4f', { se: '#2f7d3f', top: '#62bd62', lw: 1 });
  s += k.tree(0.36, 1.5, 1.35) + k.bush(0.82, 1.5, 1, { flowers: ['#ff8fb8', '#ffffff', '#ffd24a'] });
  s += k.bush(2.16, 1.52, 1, { flowers: ['#ffd24a', '#ff8fb8'] }) + k.tree(2.66, 1.5, 1.2);
  s += k.flowers([[1.2, 1.7], [1.26, 1.74], [1.74, 1.7], [1.8, 1.74], [0.6, 1.72], [2.4, 1.72]]);
  return s;
}

// ── 工場（のこぎり屋根の作業場・事務所・しましまの えんとつ） ──
function factory() {
  const k = lot(2, 1);
  const brick = '#cf7a57'; const brickD = tone(brick, -0.18); const roof = '#8a94a3';
  const u0 = 0.1; const u1 = 1.42; const v0 = 0.14; const v1 = 0.84; const H = 15; const T = 7.5;
  const front = k.SW(v1);
  let s = '';
  s += k.pad(0.04, 0.04, 1.96, 0.985, '#ddd7cd', 0.8, PAVING_LINE);
  s += k.shadow(u0, v0, 1.9, v1, 0.1);
  // 作業場の壁
  s += k.box(u0, v0, u1, v1, 0, H, brick, { se: brickD });
  s += k.panel(front, u0, u1, 0, 2.6, '#8f8a84', 1.1);
  for (const z of [5.6, 8.6, 11.6]) s += k.rule(front, u0, z, u1, z, tone(brick, -0.25), 0.6, 0.5);
  s += k.wins(front, 0.16, 0.86, 3, 5.4, 11.6, { bars: 'cross', frame: '#f4efe6' });
  // 大きな シャッター
  s += k.panel(front, 0.94, 1.34, 0, 12, '#3d4a5c', 1) + k.band(front, 0.96, 1.32, 0.4, 11.4, '#dfe5ec');
  for (const z of [2.4, 4.6, 6.8, 9]) s += k.rule(front, 0.96, z, 1.32, z, '#9aa6b5', 0.7);
  // のこぎり屋根（3 山。右手前を向く面が ガラス）
  const n = 3; const tw = (u1 - u0) / n;
  for (let i = 0; i < n; i++) {
    const a = u0 + tw * i; const b = a + tw;
    s += k.poly([[a, v0, H], [b, v0, H + T], [b, v1, H + T], [a, v1, H]], roof);
    s += k.flat([[b - tw * 0.3, v0, H + T * 0.7], [b, v0, H + T], [b, v1, H + T], [b - tw * 0.3, v1, H + T * 0.7]], tone(roof, 0.2));
    s += k.poly([[a, v0, H], [b, v0, H + T], [b, v1, H + T], [a, v1, H]], 'none');
    s += k.poly([[a, v1, H], [b, v1, H], [b, v1, H + T]], tone(brick, 0.06));
    if (i === 0) {
      // えんとつ（赤と白の しま。1 山目の うしろから立つ）
      for (const [cu, cv, top] of [[0.3, 0.3, 47], [0.5, 0.24, 40]]) {
        s += k.cyl(cu, cv, 0.06, H + 2, top, '#f3efe8', { lw: 1.1 });
        for (const z of [top - 3.4, top - 10.4]) s += k.cyl(cu, cv, 0.062, z - 3.4, z, '#e2473f', { lw: 0.8, top: false });
        s += k.disc(cu, cv, top, 0.06, '#5b6470', 1) + k.smoke(cu, cv, top + 4, 1.15);
      }
    }
    s += k.panel(k.SE(b), v0, v1, H, H + T, brickD, 1.1);
    s += k.glass(k.SE(b), v0 + 0.05, v1 - 0.05, H + 1, H + T - 0.9, 4, { frame: '#4a5568' });
  }
  // 事務所
  const a0 = u1; const a1 = 1.9; const av0 = 0.34; const aH = 12.5;
  const office = '#f3ead8';
  s += k.box(a0, av0, a1, v1, 0, aH, office, { se: tone(office, -0.14) });
  s += k.panel(k.SW(v1), a0, a1, 0, 2.6, '#8f8a84', 1.1) + k.panel(k.SE(a1), av0, v1, 0, 2.6, '#7b7670', 1.1);
  s += k.door(k.SW(v1), 1.5, 1.66, 0, 9.4, { color: '#4a7fb5' });
  s += k.win(k.SW(v1), 1.7, 1.86, 4.6, 9.4, { bars: 'v' });
  s += k.wins(k.SE(a1), 0.4, 0.8, 2, 4.6, 9.4);
  s += k.parapet(a0, av0, a1, v1, aH, 1.6, '#e2d8c4');
  // 木箱と ドラムかん
  s += k.box(0.2, 0.88, 0.34, 0.97, 0, 3.4, '#c98a4b', { lw: 0.9 }) + k.box(0.36, 0.89, 0.48, 0.97, 0, 2.6, '#d6a05e', { lw: 0.9 });
  s += k.cyl(0.62, 0.93, 0.04, 0, 4.2, '#3f8fd1', { lw: 0.9 }) + k.cyl(0.72, 0.94, 0.04, 0, 4.2, '#f2b233', { lw: 0.9 });
  return s;
}

// ── 病院（白い 2 階だて。屋上に みどりの十字） ──
function hospital() {
  const k = lot(2, 1);
  const wall = '#f8fafc'; const wallD = '#dde5ee'; const teal = '#2fb3a4';
  const u0 = 0.1; const u1 = 1.9; const v0 = 0.16; const v1 = 0.8; const H = 23;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  s += k.pad(0.03, v1, 1.97, 0.99, PAVING, 0.8, PAVING_LINE);
  s += k.box(u0, v0, u1, v1, 0, H, wall, { se: wallD });
  s += k.panel(front, u0, u1, 0, 2.4, '#b8c2cc', 1.1) + k.panel(side, v0, v1, 0, 2.4, '#a3adb8', 1.1);
  // 窓の帯（1 階は入口の左右、2 階は はしからはしまで）
  s += k.glass(front, 0.18, 0.74, 5, 10.8, 4) + k.glass(front, 1.26, 1.82, 5, 10.8, 4) + k.glass(front, 0.18, 1.82, 14.4, 19.8, 10);
  s += k.glass(side, 0.24, 0.72, 5, 10.8, 3) + k.glass(side, 0.24, 0.72, 14.4, 19.8, 3);
  s += k.band(front, u0, u1, 20.8, 22, teal) + k.band(side, v0, v1, 20.8, 22, tone(teal, -0.18));
  // 屋上と、十字の しるしの小屋
  s += k.parapet(u0, v0, u1, v1, H, 2, '#eef2f6');
  s += k.acUnit(0.24, 0.3, H + 2) + k.acUnit(0.42, 0.3, H + 2) + k.skylight(1.42, 0.3, 1.74, 0.56, H + 2.1);
  s += k.box(0.76, 0.28, 1.24, 0.62, H + 2, H + 12, wall, { se: wallD });
  const cross = `<circle r="3.9" fill="#ffffff"${pen(0.9)}/><path d="M-1 -2.7h2v1.7h1.7v2h-1.7v1.7h-2v-1.7h-1.7v-2h1.7z" fill="${teal}"/>`;
  s += k.onFace(k.SW(0.62), 1, H + 7, cross) + k.onFace(k.SE(1.24), 0.45, H + 7, cross);
  s += k.parapet(0.76, 0.28, 1.24, 0.62, H + 12, 1.2, '#eef2f6', { rim: 0.03 });
  // 入口（ガラスの戸と、ひさし）
  s += k.glass(front, 0.86, 1.14, 0, 10.6, 2, { frame: '#5b6b7c' });
  s += k.bar([[0.84, v1 + 0.15, 0], [0.84, v1 + 0.15, 11.6]], '#dfe6ee', 1.4, 0.6);
  s += k.box(0.8, v1, 1.2, v1 + 0.19, 11.6, 13.2, teal, { lw: 1 });
  s += k.bar([[1.16, v1 + 0.15, 0], [1.16, v1 + 0.15, 11.6]], '#dfe6ee', 1.4, 0.6);
  // 植えこみ
  s += k.bush(0.3, 0.93, 0.9) + k.bush(0.56, 0.93, 0.8, { flowers: ['#ff8fb8', '#ffffff'] }) + k.bush(1.5, 0.93, 0.85) + k.tree(1.84, 0.93, 0.95);
  return s;
}

// ── 消防署（赤い車庫に白い シャッター 2 つ、見はりの塔） ──
function fireStation() {
  const k = lot(2, 1);
  const red = '#e2473f'; const redD = '#b9342b'; const white = '#f7f3ea';
  const u0 = 0.08; const u1 = 1.46; const v0 = 0.2; const v1 = 0.82; const H = 17;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  s += k.pad(0.03, v1, 1.97, 0.99, '#ddd7cd', 0.8, PAVING_LINE);
  s += k.box(u0, v0, u1, v1, 0, H, red, { se: redD });
  s += k.band(front, u0, u1, 13.4, 15, white) + k.band(side, v0, v1, 13.4, 15, tone(white, -0.14));
  // シャッター（2 台ぶん）
  for (const [a, b] of [[0.17, 0.7], [0.84, 1.37]]) {
    s += k.panel(front, a, b, 0, 12, '#3d4a5c', 1) + k.band(front, a + 0.02, b - 0.02, 0.4, 11.4, '#f1f3f6');
    for (const z of [2.4, 4.8]) s += k.rule(front, a + 0.02, z, b - 0.02, z, '#aab4c0', 0.7);
    s += k.band(front, a + 0.06, b - 0.06, 7, 9.8, '#8fd3f7');
    for (let i = 1; i < 4; i++) s += k.rule(front, a + 0.06 + ((b - a - 0.12) * i) / 4, 7, a + 0.06 + ((b - a - 0.12) * i) / 4, 9.8, '#3d4a5c', 0.7);
  }
  // 金の しるし
  s += k.onFace(front, 0.77, 9, `<path d="M0 -3L2.6 -1.6V1.2Q0 3.4 -2.6 1.2V-1.6Z" fill="#ffd24a"${pen(0.8)}/>`);
  s += k.parapet(u0, v0, u1, v1, H, 1.6, white);
  s += k.acUnit(0.26, 0.32, H + 1.6) + k.skylight(0.7, 0.36, 1.1, 0.62, H + 1.7);
  // 見はりの塔
  const t0 = u1; const t1 = 1.9; const tv0 = 0.34; const TH = 35;
  const tFront = k.SW(v1); const tSide = k.SE(t1);
  s += k.box(t0, tv0, t1, v1, 0, TH, red, { se: redD });
  s += k.band(tFront, t0, t1, TH - 4.6, TH - 3, white) + k.band(tSide, tv0, v1, TH - 4.6, TH - 3, tone(white, -0.14));
  s += k.door(tFront, 1.58, 1.78, 0, 10, { color: '#f1f3f6', pane: true });
  s += k.win(tFront, 1.58, 1.78, 14, 20) + k.win(tFront, 1.58, 1.78, 23, 29);
  s += k.win(tSide, 0.48, 0.68, 14, 20) + k.win(tSide, 0.48, 0.68, 23, 29);
  s += k.parapet(t0, tv0, t1, v1, TH, 2, white);
  // サイレンと はた
  s += k.cyl(1.68, 0.58, 0.05, TH + 2, TH + 4, '#aab4c0', { lw: 0.9 }) + k.dome(1.68, 0.58, 0.05, TH + 4, 3.4, '#ff5a4d', { lw: 0.9 });
  s += k.flag(1.84, 0.4, TH + 2, TH + 11, '#ffd24a', { len: 5.4, hgt: 3.4 });
  return s;
}

// ── 黄金の塔（金色の 三重の塔） ──
function goldenTower() {
  const k = lot(1, 2);
  const gold = '#f9cf4f'; const goldD = '#dfa325'; const roof = '#eaa92c'; const red = '#d9442f';
  const cu = 0.5; const cv = 1;
  let s = '';
  // 石の広場と、金の とうろう
  s += k.pad(0.07, 0.18, 0.93, 1.82, '#efe6d2', 0.9, PAVING_LINE);
  const lamp = (u, v) => k.cyl(u, v, 0.03, 0, 4.4, '#cfc7b8', { lw: 0.8 }) + k.box(u - 0.04, v - 0.04, u + 0.04, v + 0.04, 4.4, 7.2, gold, { lw: 0.8 }) + k.dot(u, v, 8, 1, '#fff3c4', 0.5);
  s += lamp(0.2, 0.32) + lamp(0.8, 0.32);
  s += k.shadow(cu - 0.43, cv - 0.43, cu + 0.43, cv + 0.43, 0.1);
  // 台
  s += k.box(cu - 0.43, cv - 0.43, cu + 0.43, cv + 0.43, 0, 3.2, STONE, { lw: 1.1 });
  s += k.steps(k.SW(cv + 0.43), 0.38, 0.62, 2, { rise: 1.6, run: 0.05 });
  // 3 つの層（下から。上へ行くほど小さい）
  const tier = (half, z0, wallH, rise, over) => {
    const f = k.SW(cv + half); const sd = k.SE(cu + half);
    let out = k.box(cu - half, cv - half, cu + half, cv + half, z0, z0 + wallH, gold, { se: goldD });
    out += k.panel(f, cu - half * 0.36, cu + half * 0.36, z0, z0 + wallH - 1.6, red, 0.9)
      + k.rule(f, cu, z0, cu, z0 + wallH - 1.6, INK, 0.7);
    out += k.panel(sd, cv - half * 0.36, cv + half * 0.36, z0 + 1.4, z0 + wallH - 1.6, '#fff3c4', 0.8);
    out += k.band(f, cu - half, cu + half, z0 + wallH - 1.4, z0 + wallH, red, 0.9) + k.band(sd, cv - half, cv + half, z0 + wallH - 1.4, z0 + wallH, tone(red, -0.18), 0.9);
    out += k.hipRoof(cu - half, cv - half, cu + half, cv + half, z0 + wallH, rise, roof, { over, drop: 0.8, thick: 1.5, dark: '#c9861c' });
    return out;
  };
  s += tier(0.34, 3.2, 10, 6.5, 0.1);
  s += tier(0.25, 15.6, 8.6, 6, 0.09);
  s += tier(0.17, 26.4, 8, 9, 0.08);
  // てっぺんの かざり（相輪）と玉
  s += k.bar([[cu, cv, 43], [cu, cv, 54]], goldD, 1.3, 0.6);
  for (const z of [45.4, 47.8, 50.2]) s += k.oval(cu, cv, z, 2.5, 1.1, gold, 0.6);
  s += k.dot(cu, cv, 55.4, 2.2, '#fff0a8', 0.8) + k.dot(cu - 0.01, cv - 0.01, 56.2, 0.8, '#ffffff', 0);
  s += lamp(0.2, 1.68) + lamp(0.8, 1.68);
  return s;
}

// ── 水晶の塔（岩の上に そびえる、青い水晶） ──
function crystalTower() {
  const k = lot(1, 2);
  const [cx, cy] = k.xy(0.5, 1, 0);
  const lite = '#aeeaff'; const mid = '#5cc3f0'; const dark = '#2f8fd0'; const deep = '#1f5f9e';
  let s = '';
  // 岩の台
  s += k.oval(0.5, 1, 0, 31, 14, '#8b93a3', 1.1) + k.oval(0.48, 0.98, 1.6, 26, 11, '#a7afbd', 0);
  const shard = (dx, dy, w, hgt, lean, o = {}) => {
    const x = cx + dx; const y = cy + dy; const tip = [x + lean, y - hgt]; const sh = hgt * 0.56;
    const l = [x - w, y - sh + 1]; const r = [x + w, y - sh + 1];
    const c1 = o.lite || lite; const c2 = o.mid || mid; const c3 = o.dark || dark;
    return `<path d="M${num(x - w * 0.82)} ${num(y)}L${num(l[0] + lean * 0.5)} ${num(l[1])}L${num(tip[0])} ${num(tip[1])}L${num(x)} ${num(y + w * 0.28)}Z" fill="${c1}"/>`
      + `<path d="M${num(x + w * 0.82)} ${num(y)}L${num(r[0] + lean * 0.5)} ${num(r[1])}L${num(tip[0])} ${num(tip[1])}L${num(x)} ${num(y + w * 0.28)}Z" fill="${c3}"/>`
      + `<path d="M${num(x - w * 0.26)} ${num(y + w * 0.2)}L${num(x - w * 0.3 + lean * 0.5)} ${num(l[1] - 1)}L${num(tip[0])} ${num(tip[1])}L${num(x + w * 0.24 + lean * 0.5)} ${num(r[1] - 1)}L${num(x + w * 0.22)} ${num(y + w * 0.2)}Z" fill="${c2}"/>`
      + `<path d="M${num(x - w * 0.82)} ${num(y)}L${num(l[0] + lean * 0.5)} ${num(l[1])}L${num(tip[0])} ${num(tip[1])}L${num(r[0] + lean * 0.5)} ${num(r[1])}L${num(x + w * 0.82)} ${num(y)}L${num(x)} ${num(y + w * 0.28)}Z" fill="none"${pen(1.1, deep)}/>`
      + `<path d="M${num(x - w * 0.5 + lean * 0.5)} ${num(l[1] + 2)}L${num(x - w * 0.42)} ${num(y - 3)}" fill="none"${pen(0.9, '#ffffff')} opacity="0.85"/>`;
  };
  // うしろ → 手前
  s += shard(-13, -3, 5.4, 30, -5) + shard(13, -2, 5, 26, 5) + shard(4, -6, 4.4, 36, 2);
  s += shard(0, 1, 9, 62, 0);
  s += shard(-19, 4, 4.4, 17, -4, { lite: '#d7c8ff', mid: '#a58bf0', dark: '#7a5fd0' }) + shard(18, 5, 4.2, 15, 4, { lite: '#d7c8ff', mid: '#a58bf0', dark: '#7a5fd0' });
  s += shard(-7, 7, 3.8, 14, -1.4) + shard(8, 8, 3.4, 11, 1.6);
  // きらめき
  const star = (dx, dy, r) => `<path transform="translate(${num(cx + dx)} ${num(cy + dy)}) scale(${num(r)})" d="M0 -3L.7 -.7L3 0L.7 .7L0 3L-.7 .7L-3 0L-.7 -.7Z" fill="#ffffff"/>`;
  s += star(-6, -48, 1) + star(11, -30, 0.8) + star(-17, -22, 0.7) + star(3, -66, 0.9);
  return s;
}

// ── 駅（駅舎・ホーム・線路に とまる電車） ──
function station() {
  const k = lot(2, 2);
  const wall = '#f6ead4'; const wallD = tone(wall, -0.13); const brick = '#c8674a'; const roof = '#b5482f';
  const u0 = 0.3; const u1 = 1.7; const v0 = 0.08; const v1 = 0.82; const H = 17;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  s += k.pad(0.03, 0.03, 1.97, 1.2, PAVING, 0.9, PAVING_LINE);
  s += k.shadow(u0, v0, u1, v1, 0.2);
  // 駅舎
  s += k.box(u0, v0, u1, v1, 0, H, wall, { se: wallD });
  s += k.panel(front, u0, u1, 0, 3, brick, 1.1) + k.panel(side, v0, v1, 0, 3, tone(brick, -0.16), 1.1);
  s += k.glass(front, 0.86, 1.14, 0, 11.6, 2, { frame: '#5a4636' });
  s += k.wins(front, 0.37, 0.8, 2, 5.6, 12.2) + k.wins(front, 1.2, 1.63, 2, 5.6, 12.2);
  s += k.wins(side, 0.16, 0.74, 2, 5.6, 12.2);
  // 駅の かんばん（青い板に 白い電車）
  s += k.sign(front, 0.82, 1.18, 12.2, 15.8, '#2f7fd1', '#1f5a9a')
    + k.onFace(front, 1, 14, `<path d="M-3.4 -1.2Q-3.4 -1.8 -2.8 -1.8H2.8Q3.4 -1.8 3.4 -1.2V.8H-3.4Z" fill="#ffffff"/><path d="M-2.6 -1.1H-.4V-.1H-2.6ZM.4 -1.1H2.6V-.1H.4Z" fill="#2f7fd1"/><circle cx="-1.8" cy="1.2" r=".55" fill="#ffffff"/><circle cx="1.8" cy="1.2" r=".55" fill="#ffffff"/>`);
  s += k.eaveShade(u0, v0, u1, v1, H, 2.6, wall);
  s += k.hipRoof(u0, v0, u1, v1, H, 10, roof, { over: 0.08 });
  // 時計の塔
  const t0 = 0.85; const t1 = 1.15; const tv0 = 0.3; const tv1 = 0.6; const TH = 37;
  s += k.box(t0, tv0, t1, tv1, H + 3, TH, wall, { se: wallD });
  const clock = `<circle r="3.4" fill="#ffffff"${pen(0.9)}/><path d="M0 0V-2.1M0 0L1.5 .8" fill="none"${pen(0.7)}/>`;
  s += k.onFace(k.SW(tv1), 1, TH - 5.2, clock) + k.onFace(k.SE(t1), 0.45, TH - 5.2, clock);
  s += k.hipRoof(t0, tv0, t1, tv1, TH, 8, roof, { over: 0.05, drop: 0.3, plain: true, cap: '#ffd24a' });
  // ホーム（黄色い線・ベンチ・駅名の板・あかり）
  s += k.box(0.04, 0.86, 1.96, 1.18, 0, 2.6, '#e3ded4', { se: '#c9c3b7', top: '#f0ebe1', lw: 1 });
  s += k.flat([[0.04, 1.1, 2.6], [1.96, 1.1, 2.6], [1.96, 1.135, 2.6], [0.04, 1.135, 2.6]], '#f6c93c');
  s += k.box(0.24, 0.92, 0.46, 0.98, 2.6, 4.6, '#3f8fd1', { lw: 0.9 }) + k.box(1.52, 0.92, 1.74, 0.98, 2.6, 4.6, '#3f8fd1', { lw: 0.9 });
  for (const u of [0.14, 1.86]) {
    s += k.bar([[u, 0.94, 2.6], [u, 0.94, 13.4]], '#5b6470', 0.9, 0.5) + k.dot(u, 0.94, 14.2, 1.5, '#fff3c4', 0.6);
  }
  // 線路（じゃり・まくら木・レール）
  s += k.pad(0, 1.2, 2, 1.8, '#c0b9ab', 0.8, '#a39b8a');
  for (let i = 0; i < 10; i++) {
    const u = 0.06 + i * 0.2;
    s += k.flat([[u, 1.27, 0.2], [u + 0.08, 1.27, 0.2], [u + 0.08, 1.73, 0.2], [u, 1.73, 0.2]], '#7d5735');
  }
  for (const v of [1.34, 1.66]) s += k.seg([[0, v, 0.6], [2, v, 0.6]], '#7a8491', 2.2) + k.seg([[0, v, 0.6], [2, v, 0.6]], '#f0f3f6', 1.1);
  // 電車（2 両）
  const car = (a, b, head) => {
    const f = k.SW(1.67); const e = k.SE(b);
    let o = k.box(a, 1.33, b, 1.67, 1.8, 11, '#f6f3ea', { se: '#ddd8cb', top: '#fdfcf8', lw: 1.1 });
    o += k.band(f, a, b, 3.2, 5.2, '#2f9e58') + k.band(e, 1.33, 1.67, 3.2, 5.2, '#27854a');
    o += k.band(f, a + 0.05, b - 0.05, 6.2, 9.4, '#8fd3f7');
    for (let i = 1; i < 5; i++) o += k.rule(f, a + 0.05 + ((b - a - 0.1) * i) / 5, 6.2, a + 0.05 + ((b - a - 0.1) * i) / 5, 9.4, '#f6f3ea', 1.1);
    o += k.rule(f, a + 0.05, 6.2, b - 0.05, 6.2, INK, 0.6) + k.rule(f, a + 0.05, 9.4, b - 0.05, 9.4, INK, 0.6);
    if (head) {
      o += k.band(e, 1.37, 1.63, 6, 9.6, '#7cc4ec') + k.panel(e, 1.37, 1.63, 6, 9.6, 'none', 0.7);
      o += k.dot(b, 1.4, 2.8, 0.8, '#fff3a0', 0.4) + k.dot(b, 1.6, 2.8, 0.8, '#fff3a0', 0.4);
    }
    for (const t of [a + 0.12, b - 0.12]) o += k.dot(t, 1.675, 1.5, 1.2, '#3b424c', 0.5);
    return o;
  };
  s += car(0.16, 0.95, false) + car(0.99, 1.8, true);
  // 駅前の植えこみ
  s += k.bush(0.16, 0.5, 0.9, { flowers: ['#ff8fb8', '#ffffff'] }) + k.tree(1.86, 0.36, 1.05);
  return s;
}

// ── お寺（石の基壇・白い壁と こげ茶の柱・そり上がる大屋根） ──
function temple() {
  const k = lot(2, 2);
  const wood = '#8a5a3a'; const woodD = '#6d4429'; const wall = '#f7f0e1'; const roof = '#56617b';
  let s = '';
  // 境内（じゃり・石の道・うしろの木）
  s += k.pad(0.04, 0.04, 1.96, 1.96, '#ebe4d5', 0.9, PAVING_LINE);
  s += k.pad(0.86, 1.46, 1.14, 1.96, '#d2cbbd', 0.8, '#a39b8a');
  s += k.tree(0.2, 0.26, 1.3, { mid: '#2c7a45', lite: '#4a9c58' });
  s += k.shadow(0.28, 0.2, 1.72, 1.42, 0.16);
  // 基壇と かいだん
  s += k.box(0.28, 0.2, 1.72, 1.42, 0, 4, STONE, { lw: 1.1 });
  s += k.steps(k.SW(1.42), 0.8, 1.2, 3, { rise: 1.34, run: 0.045 });
  // 本堂
  const u0 = 0.46; const u1 = 1.54; const v0 = 0.38; const v1 = 1.26; const z0 = 4; const H = 23;
  const front = k.SW(v1); const side = k.SE(u1);
  s += k.box(u0, v0, u1, v1, z0, H, wall, { se: tone(wall, -0.13) });
  for (const t of [u0 + 0.02, 0.72, 1.28, u1 - 0.02]) s += k.panel(front, t - 0.022, t + 0.022, z0, H, wood, 0.7);
  for (const t of [v0 + 0.02, 0.68, 0.96, v1 - 0.02]) s += k.panel(side, t - 0.022, t + 0.022, z0, H, woodD, 0.7);
  s += k.panel(front, u0, u1, H - 2.6, H - 0.8, woodD, 0.8) + k.panel(side, v0, v1, H - 2.6, H - 0.8, tone(woodD, -0.18), 0.8);
  // 正面の とびら（こうし戸）と、左右の こうし窓
  s += k.panel(front, 0.82, 1.18, z0, 17, '#5a3b26', 1);
  for (const t of [0.91, 1, 1.09]) s += k.rule(front, t, z0, t, 17, '#3b2517', 0.7);
  for (const z of [8.4, 12.8]) s += k.rule(front, 0.82, z, 1.18, z, '#3b2517', 0.7);
  s += k.dot(0.97, v1, 10.4, 0.8, '#ffd24a', 0.4) + k.dot(1.03, v1, 10.4, 0.8, '#ffd24a', 0.4);
  for (const [a, b] of [[0.5, 0.66], [1.34, 1.5]]) {
    s += k.panel(front, a, b, 9, 16, '#fff8e8', 0.8);
    for (let i = 1; i < 4; i++) s += k.rule(front, a + ((b - a) * i) / 4, 9, a + ((b - a) * i) / 4, 16, wood, 0.6);
  }
  for (const [a, b] of [[0.46, 0.62], [1.02, 1.18]]) {
    s += k.panel(side, a, b, 9, 16, '#fff8e8', 0.8);
    for (let i = 1; i < 4; i++) s += k.rule(side, a + ((b - a) * i) / 4, 9, a + ((b - a) * i) / 4, 16, woodD, 0.6);
  }
  // 大屋根と、むねの はしの かざり
  s += k.hipRoof(u0, v0, u1, v1, H, 15, roof, { over: 0.13, drop: 0.8, curl: 3, thick: 2.2, hip: 0.56 });
  s += k.dot(0.62, 0.82, H + 16.4, 1.5, '#ffd24a', 0.7) + k.dot(1.38, 0.82, H + 16.4, 1.5, '#ffd24a', 0.7);
  // 香炉（こうろ）と けむり、石どうろう
  s += k.cyl(1, 1.68, 0.055, 0, 2.6, '#8c7a4f', { lw: 0.9 }) + k.oval(1, 1.68, 3.4, 5, 2.4, '#b59a5a', 0.9) + k.smoke(1, 1.68, 6.4, 0.8);
  for (const u of [0.38, 1.62]) {
    s += k.cyl(u, 1.7, 0.035, 0, 5, '#cfc7b8', { lw: 0.8 }) + k.box(u - 0.05, 1.65, u + 0.05, 1.75, 5, 8, '#e6dfd0', { lw: 0.8 })
      + k.dot(u, 1.752, 6.5, 0.9, '#ffd24a', 0.4) + k.hipRoof(u - 0.05, 1.65, u + 0.05, 1.75, 8, 2.6, '#8f8a80', { over: 0.03, drop: 0.2, thick: 0.9, plain: true });
  }
  s += k.bush(1.84, 1.3, 0.9) + k.bush(0.16, 1.5, 0.85);
  return s;
}

// ── お城・黄金の城（石の台に かどの丸い塔と、まん中の天守） ──
const CASTLE_COLORS = {
  castle: { stone: '#d3d8e0', stoneD: '#aab2bf', joint: '#7d8696', roof: '#3f7fd6', flag: '#ef4444', gate: '#7a5230', lawn: '#a8dd76', lawnLine: '#6aa84a' },
  gold_castle: { stone: '#f9d65c', stoneD: '#e0a82c', joint: '#b9811c', roof: '#d9442f', flag: '#ffffff', gate: '#8a3a22', lawn: '#f3e6b8', lawnLine: '#c9b582' },
};
function castleArt(c) {
  const k = lot(2, 2);
  const a = 0.26; const b = 1.74; const WH = 13;
  const front = k.SW(b); const side = k.SE(b);
  let s = '';
  s += k.pad(0.03, 0.03, 1.97, 1.97, c.lawn, 0.9, c.lawnLine);
  s += k.shadow(a, a, b, b, 0.16);
  const tower = (u, v, h) => {
    let o = k.cyl(u, v, 0.2, 0, h, c.stone, { lw: 1.2, top: false });
    const [x, y] = k.xy(u, v, h * 0.58);
    o += `<path d="M${num(x - 6.4)} ${num(y)}v-4.6q1.3 -1.6 2.6 0v4.6z" fill="${c.joint}"${pen(0.7)}/>`;
    o += k.cyl(u, v, 0.225, h, h + 2.6, tone(c.stone, 0.1), { lw: 1 });
    o += k.cone(u, v, 0.235, h + 2.6, h + 19, c.roof);
    o += k.flag(u, v, h + 19, h + 26.5, c.flag, { len: 6, hgt: 3.8 });
    return o;
  };
  // 奥の塔
  s += tower(a, a, 30);
  // 石の台（城壁）と 目地
  s += k.box(a, a, b, b, 0, WH, c.stone, { se: c.stoneD, top: tone(c.stone, 0.12) });
  for (const [face, col] of [[front, c.joint], [side, tone(c.joint, -0.12)]]) {
    for (const z of [4.3, 8.6]) s += k.rule(face, a, z, b, z, col, 0.7, 0.6);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 7; j++) {
        const t = a + 0.2 + (j + (i % 2 ? 0.5 : 0)) * 0.19;
        if (t < b - 0.2) s += k.rule(face, t, i * 4.3, t, i * 4.3 + 4.3, col, 0.7, 0.5);
      }
    }
  }
  s += k.pad(a + 0.14, a + 0.14, b - 0.14, b - 0.14, tone(c.stoneD, 0.1), 0.7, c.joint, WH);
  // 奥の のこぎり形の かべ
  const merlon = (ua, va, ub, vb) => k.box(ua, va, ub, vb, WH, WH + 4, c.stone, { se: c.stoneD, top: tone(c.stone, 0.16), lw: 0.9 });
  const spots = [0.52, 0.76, 1.0, 1.24, 1.48];
  for (const t of spots) s += merlon(t - 0.07, a, t + 0.07, a + 0.12);
  for (const t of spots) s += merlon(a, t - 0.07, a + 0.12, t + 0.07);
  // 左と右の塔
  s += tower(a, b, 26) + tower(b, a, 26);
  // 天守
  const k0 = 0.6; const k1 = 1.4; const KH = 40;
  const kFront = k.SW(k1); const kSide = k.SE(k1);
  s += k.box(k0, k0, k1, k1, WH, KH, c.stone, { se: c.stoneD });
  s += k.band(kFront, k0, k1, KH - 3.4, KH - 1.6, c.roof) + k.band(kSide, k0, k1, KH - 3.4, KH - 1.6, tone(c.roof, -0.18));
  for (const t of [0.78, 1.0, 1.22]) {
    s += k.onFace(kFront, t, 27, `<path d="M-2 4V-1.6Q-2 -4.2 0 -4.2Q2 -4.2 2 -1.6V4Z" fill="#8fd3f7"${pen(0.8)}/><path d="M0 -4V4" fill="none"${pen(0.6)}/>`);
    s += k.onFace(kSide, t, 27, `<path d="M-2 4V-1.6Q-2 -4.2 0 -4.2Q2 -4.2 2 -1.6V4Z" fill="#7cc4ec"${pen(0.8)}/><path d="M0 -4V4" fill="none"${pen(0.6)}/>`);
  }
  s += k.hipRoof(k0, k0, k1, k1, KH, 22, c.roof, { over: 0.07, plain: true });
  s += k.flag(1, 1, KH + 22, KH + 31, c.flag, { len: 7, hgt: 4.4 });
  // 手前の のこぎり形の かべ
  for (const t of spots) s += merlon(t - 0.07, b - 0.12, t + 0.07, b);
  for (const t of spots) s += merlon(b - 0.12, t - 0.07, b, t + 0.07);
  // 門
  s += k.onFace(front, 1, 0, `<path d="M-6 0V-7Q-6 -12.4 0 -12.4Q6 -12.4 6 -7V0Z" fill="${c.gate}"${pen(1.1)}/><path d="M0 -12.2V0M-3 -11.2V0M3 -11.2V0M-6 -5H6" fill="none"${pen(0.6, tone(c.gate, -0.35))}/>`);
  // 手前の塔
  s += tower(b, b, 26);
  return s;
}

// ── 国立図書館（柱の ならぶ正面・三角の破風・みどりの丸屋根） ──
function nationalLibrary() {
  const k = lot(2, 2);
  const stone = '#f3ead6'; const stoneD = tone(stone, -0.14); const dome = '#3fa99b';
  const u0 = 0.26; const u1 = 1.74; const v0 = 0.26; const v1 = 1.44; const z0 = 3; const H = 23;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  s += k.pad(0.03, 0.03, 1.97, 1.97, '#a8dd76', 0.9, '#6aa84a');
  s += k.pad(0.7, 1.7, 1.3, 1.97, PAVING, 0.8, PAVING_LINE);
  s += k.tree(0.16, 0.2, 1.15);
  s += k.shadow(0.18, 0.18, 1.82, 1.52, 0.14);
  // 基壇と本館
  s += k.box(0.18, 0.18, 1.82, 1.52, 0, z0, STONE, { lw: 1.1 });
  s += k.box(u0, v0, u1, v1, z0, H, stone, { se: stoneD });
  s += k.wins(front, 0.3, 0.6, 2, 7, 18, { bars: 'h', gap: 0.4 }) + k.wins(front, 1.4, 1.7, 2, 7, 18, { bars: 'h', gap: 0.4 });
  s += k.wins(side, 0.34, 1.36, 5, 7, 18, { bars: 'h', gap: 0.42 });
  s += k.band(front, u0, u1, H - 2.4, H - 0.9, tone(stone, -0.2)) + k.band(side, v0, v1, H - 2.4, H - 0.9, tone(stoneD, -0.2));
  s += k.parapet(u0, v0, u1, v1, H, 1.8, stone);
  // 丸屋根
  s += k.cyl(1, 0.85, 0.3, H + 1.8, H + 8.4, stone, { lw: 1.1 });
  for (const dx of [-9, -3, 3, 9]) {
    const [x, y] = k.xy(1, 0.85, H + 5);
    s += `<path d="M${num(x + dx - 1.3)} ${num(y + 4.4 - Math.abs(dx) * 0.12)}v-3.8q1.3 -1.5 2.6 0v3.8z" fill="#7cc4ec"${pen(0.6)}/>`;
  }
  s += k.dome(1, 0.85, 0.33, H + 8.4, 14, dome);
  s += k.cyl(1, 0.85, 0.05, H + 21.6, H + 25, stone, { lw: 0.9 }) + k.dot(1, 0.85, H + 26.6, 1.6, '#ffd24a', 0.7);
  // 正面の 柱ろう（ゆか・とびら・柱・はり・三角の破風）
  const p0 = 0.62; const p1 = 1.38; const pd = 1.7;
  s += k.box(p0, v1, p1, pd, 0, z0, STONE, { lw: 1.1 });
  s += k.steps(k.SW(pd), 0.72, 1.28, 2, { rise: 1.5, run: 0.045 });
  s += k.door(front, 0.9, 1.1, z0, 15, { double: true, color: '#7a4e2d', pane: false });
  const cols = [0.67, 0.835, 1.0, 1.165, 1.33];
  for (const u of cols) s += k.bar([[u, pd - 0.05, z0], [u, pd - 0.05, 17.6]], '#fffaf0', 2.2, 0.7);
  s += k.box(p0, v1, p1, pd, 17.6, 20, stone, { se: stoneD, lw: 1.1 });
  s += k.poly([[p1, pd, 20], [p1, v1, 20], [1, v1, 27], [1, pd, 27]], tone(dome, -0.1));
  s += k.poly([[p0, pd, 20], [p1, pd, 20], [1, pd, 27]], stone);
  s += k.onFace(k.SW(pd), 1, 22.6, `<circle r="1.7" fill="#ffd24a"${pen(0.6)}/>`);
  // 庭の木と花
  s += k.tree(0.2, 1.72, 1.15) + k.bush(0.5, 1.8, 0.9, { flowers: ['#ff8fb8', '#ffffff'] }) + k.bush(1.52, 1.8, 0.9, { flowers: ['#ffd24a', '#ff8fb8'] }) + k.tree(1.82, 1.7, 1.1);
  return s;
}

// ── 学校（3 階だての校舎・時計の塔・体育館・トラックのある校庭） ──
function school() {
  const k = lot(4, 4);
  const wall = '#f8f1e3'; const wallD = tone(wall, -0.13); const trim = '#d9634a'; const gym = '#4f86c6';
  let s = '';
  // 敷地（みどりの ふち）と 校庭（すな）
  s += k.pad(0.04, 0.04, 3.96, 3.96, '#a8dd76', 0.9, '#6aa84a');
  s += k.pad(0.34, 1.34, 3.74, 3.72, '#ecdcb2', 0.8, '#c9b582');
  // トラック（白い線）
  const track = [];
  for (let i = 0; i <= 12; i++) { const t = -Math.PI / 2 + (Math.PI * i) / 12; track.push([2.0 + Math.cos(t) * 0.5, 2.66 + Math.sin(t) * 0.5, 0.15]); }
  for (let i = 0; i <= 12; i++) { const t = Math.PI / 2 + (Math.PI * i) / 12; track.push([0.98 + Math.cos(t) * 0.5, 2.66 + Math.sin(t) * 0.5, 0.15]); }
  track.push(track[0]);
  s += k.seg(track, '#ffffff', 2.2, 0.95);
  s += k.seg(track.map(([u, v, z]) => [1.49 + (u - 1.49) * 0.72, 2.66 + (v - 2.66) * 0.6, z]), '#ffffff', 1.1, 0.8);
  // うしろの木
  s += k.tree(0.16, 0.5, 1.4) + k.tree(3.84, 0.3, 1.3);
  // 校舎
  const u0 = 0.36; const u1 = 3.3; const v0 = 0.22; const v1 = 1.12; const H = 34;
  const front = k.SW(v1); const side = k.SE(u1);
  s += k.shadow(u0, v0, u1, v1, 0.3);
  s += k.box(u0, v0, u1, v1, 0, H, wall, { se: wallD });
  s += k.panel(front, u0, u1, 0, 2.6, '#b9a58c', 1.1) + k.panel(side, v0, v1, 0, 2.6, '#a39078', 1.1);
  for (let f = 0; f < 3; f++) {
    const z = 5 + f * 9.8;
    s += k.glass(front, 0.46, 1.56, z, z + 6, 9) + k.glass(front, 2.2, 3.2, z, z + 6, 8);
    s += k.glass(side, 0.3, 1.04, z, z + 6, 5);
    if (f > 0) s += k.band(front, u0, u1, z - 2.6, z - 1.6, trim) + k.band(side, v0, v1, z - 2.6, z - 1.6, tone(trim, -0.18));
  }
  s += k.parapet(u0, v0, u1, v1, H, 2, wall);
  // 時計の塔（玄関の上）
  const t0 = 1.64; const t1 = 2.12; const tv1 = v1 + 0.12; const TH = 47;
  const tFront = k.SW(tv1); const tSide = k.SE(t1);
  s += k.box(t0, v0 + 0.1, t1, tv1, 0, TH, wall, { se: wallD });
  s += k.glass(tFront, 1.72, 2.04, 0, 9.6, 2, { frame: '#5a4636' });
  s += k.box(1.66, tv1, 2.1, tv1 + 0.16, 10.4, 12, trim, { lw: 1 });
  s += k.win(tFront, 1.76, 2.0, 15, 21, { bars: 'cross' }) + k.win(tFront, 1.76, 2.0, 24.6, 30.6, { bars: 'cross' });
  const clock = `<circle r="4.6" fill="#ffffff"${pen(1)}/><circle r="3.5" fill="none"${pen(0.5, '#c9b78f')}/><path d="M0 0V-2.9M0 0L2 1" fill="none"${pen(0.8)}/><circle r="0.6" fill="${INK}"/>`;
  s += k.onFace(tFront, 1.88, TH - 7.4, clock) + k.onFace(tSide, 0.74, TH - 7.4, clock);
  s += k.hipRoof(t0, v0 + 0.1, t1, tv1, TH, 9, trim, { over: 0.05, drop: 0.3, plain: true });
  s += k.flag(1.88, 0.72, TH + 9, TH + 17, '#ffd24a', { len: 6, hgt: 3.8 });
  // 体育館（青い屋根）
  const g0 = 2.74; const g1 = 3.72; const gv0 = 1.56; const gv1 = 3.06; const GH = 17; const gRise = 9;
  s += k.shadow(g0, gv0, g1, gv1, 0.12);
  s += k.gableWalls(g0, gv0, g1, gv1, GH, gRise, wall, 'v', { se: wallD });
  s += k.panel(k.SW(gv1), g0, g1, 0, 2.6, '#b9a58c', 1.1) + k.panel(k.SE(g1), gv0, gv1, 0, 2.6, '#a39078', 1.1);
  s += k.door(k.SW(gv1), 3.06, 3.4, 0, 11, { double: true, color: '#4a7fb5' });
  s += k.onFace(k.SW(gv1), 3.23, GH + 3.4, `<circle r="2.8" fill="#8fd3f7"${pen(1)}/>`);
  s += k.wins(k.SE(g1), 1.66, 2.96, 5, 8.6, 13.8, { bars: 'v' });
  s += k.gableRoof(g0, gv0, g1, gv1, GH, gRise, gym, 'v', { over: 0.05 });
  // 校庭のもの（はた・サッカーゴール・鉄ぼう・木・花だん）
  s += k.flag(2.44, 1.36, 0, 27, '#ef4444', { len: 7, hgt: 4.4 });
  const goal = (u, v) => k.seg([[u, v - 0.16, 0], [u, v - 0.16, 5], [u, v + 0.16, 5], [u, v + 0.16, 0]], '#ffffff', 1.3) + k.seg([[u, v - 0.16, 0], [u, v - 0.16, 5], [u, v + 0.16, 5], [u, v + 0.16, 0]], '#8a94a3', 0.5);
  s += goal(0.62, 2.66) + goal(2.38, 2.66);
  for (let i = 0; i < 3; i++) {
    const u = 0.62 + i * 0.22;
    s += k.seg([[u, 3.44, 0], [u, 3.44, 4.6 + i * 0.9], [u + 0.2, 3.44, 4.6 + i * 0.9], [u + 0.2, 3.44, 0]], '#4a7fb5', 1.1);
  }
  s += k.tree(0.2, 1.7, 1.4) + k.tree(0.2, 2.5, 1.35) + k.tree(0.2, 3.3, 1.4);
  // 手前の 生けがきと 門
  s += k.box(0.12, 3.82, 1.6, 3.92, 0, 3.4, '#3f9a4f', { se: '#2f7d3f', top: '#62bd62', lw: 1 });
  s += k.box(2.4, 3.82, 3.88, 3.92, 0, 3.4, '#3f9a4f', { se: '#2f7d3f', top: '#62bd62', lw: 1 });
  s += k.box(1.6, 3.8, 1.72, 3.94, 0, 6, STONE, { lw: 1 }) + k.box(2.28, 3.8, 2.4, 3.94, 0, 6, STONE, { lw: 1 });
  s += k.flowers([[1.84, 1.5], [1.92, 1.54], [2.0, 1.5], [1.4, 1.5], [1.48, 1.54]], ['#ff8fb8', '#ffd24a', '#ffffff']);
  return s;
}

// ── 面に はる しるし（かんばんの絵）。原点が まん中 ──
const ARCH_WINDOW = (glass) => `<path d="M-3.2 0V-6.2Q-3.2 -10 0 -10Q3.2 -10 3.2 -6.2V0Z" fill="#ffffff"${pen(0.9)}/><path d="M-2.2 -.9V-6.1Q-2.2 -8.8 0 -8.8Q2.2 -8.8 2.2 -6.1V-.9Z" fill="${glass}"/><path d="M0 -8.8V-.9M-2.2 -5H2.2" fill="none"${pen(0.6)}/>`;
const ARCH_DOOR = (color) => `<path d="M-3.6 0V-8Q-3.6 -12 0 -12Q3.6 -12 3.6 -8V0Z" fill="#ffffff"${pen(1)}/><path d="M-2.7 0V-7.8Q-2.7 -11 0 -11Q2.7 -11 2.7 -7.8V0Z" fill="${color}"${pen(0.7)}/><path d="M0 -11V0" fill="none"${pen(0.6)}/><circle cx=".9" cy="-4.6" r=".6" fill="#ffd24a"/>`;
const GLYPH_BOOK = `<path d="M0 -1.6Q-2 -3 -4.2 -2V2.2Q-2 1.2 0 2.6Q2 1.2 4.2 2.2V-2Q2 -3 0 -1.6Z" fill="#ffffff"${pen(0.7)}/><path d="M0 -1.6V2.6" fill="none"${pen(0.6)}/><path d="M-3.2 -.6Q-2 -1.2 -.9 -.5M.9 -.5Q2 -1.2 3.2 -.6" fill="none"${pen(0.45, '#7a8aa0')}/>`;
const GLYPH_FORK = `<circle r="3.6" fill="#ffffff"${pen(0.7)}/><circle r="2.1" fill="#ffe9a8"/><path d="M-6 -3.4V3.6M-7.2 -3.4V-1.2Q-7.2 -.2 -6 -.2Q-4.8 -.2 -4.8 -1.2V-3.4M6.2 3.6V-3.4Q4.6 -2.4 4.9 -.2H6.2" fill="none"${pen(0.8, '#5b6470')}/>`;
const GLYPH_CLAPPER = `<path d="M-4.2 -.8H4.2V3.4H-4.2Z" fill="#2b2f3a"${pen(0.7)}/><path d="M-4.4 -3.2L4 -4.6L4.4 -2.4L-4 -1Z" fill="#ffffff"${pen(0.7)}/><path d="M-2.6 -3.5L-1.6 -1.4M-.2 -3.9L.8 -1.8M2.2 -4.3L3.2 -2.2" fill="none"${pen(0.9, '#2b2f3a')}/><circle cy="1.3" r="1.1" fill="#ffd24a"/>`;
const GLYPH_ONSEN = `<ellipse cy="1.6" rx="3.4" ry="1.5" fill="none"${pen(0.8, '#ffffff')}/><path d="M-1.8 .6Q-2.8 -.8 -1.8 -2.2Q-.8 -3.4 -1.8 -4.6M0 .9Q-1 -.6 0 -2Q1 -3.3 0 -4.8M1.8 .6Q.8 -.8 1.8 -2.2Q2.8 -3.4 1.8 -4.6" fill="none"${pen(0.8, '#ffffff')}/>`;

// ── 図書館（みどりの大屋根・アーチ窓・本の しるしの玄関） ──
function library() {
  const k = lot(2, 1);
  const wall = '#fbf1d8'; const wallD = tone(wall, -0.13); const roof = '#3fae62'; const brick = '#b9764f';
  const u0 = 0.14; const u1 = 1.86; const v0 = 0.12; const v1 = 0.78; const H = 16.5;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  s += k.pad(0.05, v1, 1.95, 0.99, PAVING, 0.8, PAVING_LINE);
  s += k.box(u0, v0, u1, v1, 0, H, wall, { se: wallD });
  s += k.panel(front, u0, u1, 0, 2.6, brick, 1.1) + k.panel(side, v0, v1, 0, 2.6, tone(brick, -0.16), 1.1);
  for (const t of [0.3, 0.52, 1.48, 1.7]) s += k.onFace(front, t, 4.4, ARCH_WINDOW('#8fd3f7'));
  for (const t of [0.32, 0.58]) s += k.onFace(side, t, 4.4, ARCH_WINDOW('#7cc4ec'));
  s += k.eaveShade(u0, v0, u1, v1, H, 2.4, wall);
  s += k.hipRoof(u0, v0, u1, v1, H, 10.5, roof, { over: 0.07 });
  // 玄関の はり出し（妻に 本の しるし）
  const b0 = 0.78; const b1 = 1.22; const bv1 = 0.95;
  const bay = k.SW(bv1);
  s += k.gableWalls(b0, 0.56, b1, bv1, H, 7.5, wall, 'v', { se: wallD });
  s += k.panel(bay, b0, b1, 0, 2.6, brick, 1.1) + k.panel(k.SE(b1), v1, bv1, 0, 2.6, tone(brick, -0.16), 1.1);
  s += k.onFace(bay, 1, 0, ARCH_DOOR('#8a5a33'));
  s += k.onFace(bay, 1, H + 1.2, `<circle r="4.6" fill="#2f7fd1"${pen(0.9)}/>${GLYPH_BOOK}`);
  s += k.gableRoof(b0, 0.56, b1, bv1, H, 7.5, roof, 'v', { over: 0.05 });
  // 植えこみと ベンチ
  s += k.bush(0.3, 0.92, 0.9, { flowers: ['#ff8fb8', '#ffffff'] }) + k.bush(0.58, 0.93, 0.8);
  s += k.box(1.42, 0.9, 1.66, 0.95, 0, 2.4, '#c98a4b', { lw: 0.9 }) + k.pot(1.84, 0.92, 0.85);
  return s;
}

// ── 役所（石の庁舎・正面の柱・時計の塔と はた） ──
function townhall() {
  const k = lot(2, 1);
  const wall = '#e9edf2'; const wallD = tone(wall, -0.13); const roof = '#5b6f8f'; const base = '#aeb6c2';
  const u0 = 0.12; const u1 = 1.88; const v0 = 0.16; const v1 = 0.78; const H = 19.5;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  s += k.pad(0.05, v1, 1.95, 0.99, PAVING, 0.8, PAVING_LINE);
  s += k.box(u0, v0, u1, v1, 0, H, wall, { se: wallD });
  s += k.panel(front, u0, u1, 0, 2.6, base, 1.1) + k.panel(side, v0, v1, 0, 2.6, tone(base, -0.14), 1.1);
  s += k.wins(front, 0.18, 0.72, 3, 4.6, 9.2) + k.wins(front, 1.28, 1.82, 3, 4.6, 9.2);
  s += k.wins(front, 0.18, 0.72, 3, 11.6, 16.2) + k.wins(front, 1.28, 1.82, 3, 11.6, 16.2);
  s += k.wins(side, 0.22, 0.72, 2, 4.6, 9.2) + k.wins(side, 0.22, 0.72, 2, 11.6, 16.2);
  s += k.band(front, u0, u1, H - 2, H - 0.7, tone(wall, -0.2)) + k.band(side, v0, v1, H - 2, H - 0.7, tone(wallD, -0.2));
  s += k.hipRoof(u0, v0, u1, v1, H, 7, roof, { over: 0.05 });
  // 時計の塔
  const t0 = 0.82; const t1 = 1.18; const tv0 = 0.3; const tv1 = 0.64; const TH = 39;
  s += k.box(t0, tv0, t1, tv1, H + 2, TH, wall, { se: wallD });
  const clock = `<circle r="3.8" fill="#ffffff"${pen(0.9)}/><path d="M0 0V-2.4M0 0L1.7 .9" fill="none"${pen(0.7)}/>`;
  s += k.onFace(k.SW(tv1), 1, TH - 6, clock) + k.onFace(k.SE(t1), 0.47, TH - 6, clock);
  s += k.box(t0 - 0.03, tv0 - 0.03, t1 + 0.03, tv1 + 0.03, TH, TH + 1.6, tone(wall, 0.3), { lw: 0.9 });
  s += k.dome(1, 0.47, 0.17, TH + 1.6, 7.4, roof);
  s += k.flag(1, 0.47, TH + 9, TH + 18, '#2f7fd1', { len: 6.4, hgt: 4 });
  // 正面の柱ろう（ゆか・柱・はり・三角の破風）
  const p0 = 0.7; const p1 = 1.3; const pd = 0.95;
  s += k.box(p0, v1, p1, pd, 0, 2.6, STONE, { lw: 1 });
  s += k.steps(k.SW(pd), 0.8, 1.2, 1, { rise: 1.3, run: 0.04 });
  s += k.door(front, 0.9, 1.1, 2.6, 12, { double: true, color: '#6b4a2f' });
  for (const u of [0.75, 0.92, 1.08, 1.25]) s += k.bar([[u, pd - 0.04, 2.6], [u, pd - 0.04, 13.4]], '#fbfcfd', 1.9, 0.6);
  s += k.box(p0, v1, p1, pd, 13.4, 15.4, wall, { se: wallD, lw: 1 });
  s += k.poly([[p1, pd, 15.4], [p1, v1, 15.4], [1, v1, 20.6], [1, pd, 20.6]], tone(roof, -0.1));
  s += k.poly([[p0, pd, 15.4], [p1, pd, 15.4], [1, pd, 20.6]], wall);
  s += k.onFace(k.SW(pd), 1, 17.2, `<circle r="1.4" fill="#ffd24a"${pen(0.5)}/>`);
  // 植えこみ
  s += k.pot(0.3, 0.92, 0.9) + k.pot(0.56, 0.92, 0.9) + k.pot(1.44, 0.92, 0.9) + k.pot(1.7, 0.92, 0.9);
  return s;
}

// ── 大使館（白い やかた・芝の庭と てつの さく・はた） ──
function embassy() {
  const k = lot(2, 1);
  const wall = '#fbfaf6'; const wallD = tone(wall, -0.12); const roof = '#566178'; const iron = '#2f4a3a';
  const u0 = 0.36; const u1 = 1.62; const v0 = 0.2; const v1 = 0.74; const H = 20.5;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  s += k.pad(0.04, 0.04, 1.96, 0.96, '#a8dd76', 0.9, '#6aa84a');
  s += k.pad(0.9, v1, 1.1, 0.96, PAVING, 0.8, PAVING_LINE);
  // 奥と左の さく
  const rail = (p, q) => k.seg([[p[0], p[1], 4.4], [q[0], q[1], 4.4]], iron, 0.9) + k.seg([[p[0], p[1], 1.4], [q[0], q[1], 1.4]], iron, 0.9);
  const posts = (p, q, n) => {
    let o = '';
    for (let i = 0; i <= n; i++) { const t = i / n; o += k.seg([[p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, 0], [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, 5.6]], iron, 1); }
    return o;
  };
  s += rail([0.06, 0.06], [1.94, 0.06]) + posts([0.06, 0.06], [1.94, 0.06], 12) + rail([0.06, 0.06], [0.06, 0.94]) + posts([0.06, 0.06], [0.06, 0.94], 6);
  s += k.tree(0.2, 0.3, 1.1);
  s += k.shadow(u0, v0, u1, v1, 0.18);
  // やかた
  s += k.box(u0, v0, u1, v1, 0, H, wall, { se: wallD });
  s += k.panel(front, u0, u1, 0, 2.4, '#c9c2b6', 1.1) + k.panel(side, v0, v1, 0, 2.4, '#b4ad9f', 1.1);
  s += k.band(front, u0, u1, 10.6, 11.6, tone(wall, -0.1)) + k.band(side, v0, v1, 10.6, 11.6, tone(wallD, -0.1));
  const shutter = '#5d7ea8';
  for (const z of [4.4, 13.2]) {
    for (const t of [0.5, 0.72, 1.28, 1.5]) {
      if (z < 10 && t > 0.6 && t < 1.4) continue;
      s += k.panel(front, t - 0.115, t - 0.07, z, z + 5.4, shutter, 0.6) + k.panel(front, t + 0.07, t + 0.115, z, z + 5.4, shutter, 0.6);
      s += k.win(front, t - 0.07, t + 0.07, z, z + 5.4);
    }
    s += k.wins(side, 0.26, 0.68, 2, z, z + 5.4);
  }
  s += k.win(front, 0.93, 1.07, 13.2, 18.6);
  s += k.eaveShade(u0, v0, u1, v1, H, 2.4, wall);
  s += k.hipRoof(u0, v0, u1, v1, H, 9.5, roof, { over: 0.06 });
  for (const cu of [0.62, 1.3]) s += k.box(cu, 0.42, cu + 0.1, 0.52, H + 5, H + 14, '#c9c2b6', { lw: 1 });
  // 玄関（かいだん・とびら・白い柱の バルコニー）
  s += k.steps(front, 0.86, 1.14, 2, { rise: 1.2, run: 0.04 });
  s += k.door(front, 0.91, 1.09, 2.4, 10.4, { double: true, color: '#2f4a6a', pane: false });
  s += k.bar([[0.86, v1 + 0.1, 0], [0.86, v1 + 0.1, 11]], '#ffffff', 1.5, 0.6);
  s += k.box(0.82, v1, 1.18, v1 + 0.13, 11, 12.4, '#ffffff', { se: '#e3ddd2', lw: 1 });
  s += k.bar([[1.14, v1 + 0.1, 0], [1.14, v1 + 0.1, 11]], '#ffffff', 1.5, 0.6);
  // はた
  s += k.flag(1.8, 0.56, 0, 30, '#2f6fd1', { len: 8, hgt: 5 });
  s += k.bush(0.56, 0.86, 0.85, { flowers: ['#ffffff', '#ff8fb8'] }) + k.bush(1.44, 0.86, 0.85, { flowers: ['#ffd24a', '#ffffff'] });
  // 手前と右の さく・門の柱
  s += rail([1.94, 0.06], [1.94, 0.94]) + posts([1.94, 0.06], [1.94, 0.94], 6);
  s += rail([0.06, 0.94], [0.84, 0.94]) + posts([0.06, 0.94], [0.84, 0.94], 5) + rail([1.16, 0.94], [1.94, 0.94]) + posts([1.16, 0.94], [1.94, 0.94], 5);
  s += k.box(0.82, 0.91, 0.9, 0.97, 0, 7, STONE, { lw: 0.9 }) + k.box(1.1, 0.91, 1.18, 0.97, 0, 7, STONE, { lw: 0.9 });
  return s;
}

// ── 大鍛冶場（火の入った大きな炉・2 本の えんとつ・かなとこ） ──
function grandSmithy() {
  const k = lot(2, 1);
  const stone = '#a3a6ad'; const stoneD = '#7f838c'; const roof = '#4c5160'; const brick = '#b9614a';
  const u0 = 0.12; const u1 = 1.28; const v0 = 0.14; const v1 = 0.8; const H = 15; const rise = 10.5;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  s += k.pad(0.05, v1, 1.95, 0.99, '#d6cab4', 0.8, PAVING_LINE);
  s += k.gableWalls(u0, v0, u1, v1, H, rise, stone, 'u', { se: stoneD });
  for (const z of [4.6, 9.2]) s += k.rule(front, u0, z, u1, z, '#6f7480', 0.7, 0.6);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 6; j++) {
    const t = u0 + 0.1 + (j + (i % 2 ? 0.5 : 0)) * 0.2;
    if (t < u1 - 0.05) s += k.rule(front, t, i * 4.6, t, i * 4.6 + 4.6, '#6f7480', 0.7, 0.5);
  }
  // 炉の口（アーチの中に火）
  s += k.onFace(front, 0.5, 0, `<path d="M-9 0V-8Q-9 -13.6 0 -13.6Q9 -13.6 9 -8V0Z" fill="#2a2320"${pen(1.1)}/><path d="M-6.4 0Q-7 -4.6 -4 -6.6Q-4.2 -3.6 -2.2 -4.4Q-2.6 -8.4 .4 -10.6Q.2 -7 2.4 -6.2Q3.2 -8.2 4.6 -8.6Q4.2 -5.6 6 -4Q7 -2 6.4 0Z" fill="#ff7a1a"/><path d="M-3.6 0Q-4 -2.8 -2 -4Q-1.8 -2.4 -.6 -3Q-.8 -5.6 1 -6.8Q1 -4.4 2.6 -3.6Q3.8 -1.8 3.6 0Z" fill="#ffd24a"/>`);
  s += k.win(front, 0.86, 1.04, 5, 10.6) + k.win(side, 0.38, 0.58, 5, 10.6);
  s += k.gableRoof(u0, v0, u1, v1, H, rise, roof, 'u', { over: 0.06 });
  // えんとつ（レンガ・けむり）
  for (const [cu, top] of [[0.34, 38], [0.86, 34]]) {
    s += k.box(cu, 0.4, cu + 0.13, 0.53, H + 6, top, brick, { se: tone(brick, -0.2), lw: 1.1 });
    s += k.box(cu - 0.015, 0.385, cu + 0.145, 0.545, top, top + 1.6, tone(brick, -0.12), { lw: 0.9 }) + k.smoke(cu + 0.065, 0.465, top + 6, 1.2);
  }
  // ぶきの作業場（たてと けん）
  const w1 = 1.86; const wv0 = 0.32; const wH = 10.5;
  s += k.gableWalls(u1, wv0, w1, v1, wH, 5.5, '#c9925a', 'u', { se: '#a8743f' });
  const wFront = k.SW(v1);
  s += k.panel(wFront, 1.36, 1.78, 0, 8.6, '#5a4130', 1);
  for (const t of [1.44, 1.52, 1.6]) s += k.rule(wFront, t, 1.2, t, 7.4, '#dfe5ec', 1.1) + k.rule(wFront, t - 0.02, 2.4, t + 0.02, 2.4, '#ffd24a', 1);
  s += k.onFace(wFront, 1.71, 4.4, `<path d="M0 -3L2.4 -1.8V1.2Q0 3.6 -2.4 1.2V-1.8Z" fill="#3f8fd1"${pen(0.6)}/>`);
  s += k.gableRoof(u1, wv0, w1, v1, wH, 5.5, roof, 'u', { over: 0.05 });
  // かなとこ・水おけ・石炭
  const [ax, ay] = k.xy(0.9, 0.93, 0);
  s += `<path d="M${num(ax - 2.2)} ${num(ay)}h4.4l-.6 -3.2h-3.2z" fill="#8a5a33"${pen(0.8)}/><path d="M${num(ax - 4.4)} ${num(ay - 6.4)}h7.4q1.8 .2 2.6 1.4h-3.4l-1 1.8h-4.2l-.8 -1.8h-1.6z" fill="#5b6470"${pen(0.8)}/>`;
  s += k.cyl(1.16, 0.93, 0.045, 0, 4.4, '#9a6a3c', { top: '#66c8ee', lw: 0.9 });
  s += k.dot(0.24, 0.92, 1, 1.6, '#3b3f48', 0.5) + k.dot(0.3, 0.94, 1, 1.8, '#2b2f36', 0.5) + k.dot(0.27, 0.91, 2.2, 1.4, '#4a4f58', 0.5);
  return s;
}

// ── ファミレス（オレンジの屋根・大きな窓・屋根の上の かんばん） ──
function familyRestaurant() {
  const k = lot(2, 1);
  const wall = '#fff4dc'; const wallD = tone(wall, -0.13); const roof = '#f08a3c'; const base = '#b9764f';
  const u0 = 0.12; const u1 = 1.88; const v0 = 0.14; const v1 = 0.76; const H = 14.5;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  s += k.pad(0.04, v1, 1.96, 0.99, '#d9dde3', 0.8, '#aab2bd');
  for (const u of [0.4, 0.7, 1.0]) s += k.seg([[u, 0.86, 0.1], [u, 0.99, 0.1]], '#ffffff', 1.2, 0.9);
  s += k.box(u0, v0, u1, v1, 0, H, wall, { se: wallD });
  s += k.panel(front, u0, u1, 0, 2.4, base, 1.1) + k.panel(side, v0, v1, 0, 2.4, tone(base, -0.16), 1.1);
  s += k.glass(front, 0.2, 1.14, 3.4, 10.6, 6) + k.glass(front, 1.5, 1.8, 3.4, 10.6, 2);
  s += k.door(front, 1.22, 1.42, 0, 10.8, { color: '#d9632a' });
  s += k.glass(side, 0.24, 0.68, 3.4, 10.6, 3);
  s += k.hipRoof(u0, v0, u1, v1, H, 9.5, roof, { over: 0.07 });
  s += k.awning(front, 0.17, 1.83, 13, { c1: '#f97316', c2: '#fffbeb', n: 12, depth: 0.09, drop: 2 });
  // 屋根の上の かんばん（さら・フォーク・ナイフ）
  const board = k.SW(0.5);
  s += k.bar([[0.82, 0.5, H + 5], [0.82, 0.5, H + 11]], '#8a5a33', 1.2, 0.5) + k.bar([[1.18, 0.5, H + 5], [1.18, 0.5, H + 11]], '#8a5a33', 1.2, 0.5);
  s += k.sign(board, 0.66, 1.34, H + 10, H + 21, '#fffbeb', '#ea580c') + k.onFace(board, 1, H + 15.5, GLYPH_FORK);
  // 植えこみ
  s += k.bush(1.6, 0.9, 0.85, { flowers: ['#ffd24a', '#ffffff'] }) + k.pot(1.9, 0.9, 0.85) + k.bush(0.16, 0.9, 0.8);
  return s;
}

// ── 映画館（こん色の はこ・あかりの ならぶ ひさし・ポスター） ──
function cinema() {
  const k = lot(2, 1);
  const wall = '#55609a'; const wallD = '#3d4674'; const gold = '#ffd24a'; const red = '#e2473f';
  const u0 = 0.12; const u1 = 1.88; const v0 = 0.14; const v1 = 0.78; const H = 19;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  s += k.pad(0.05, v1, 1.95, 0.99, PAVING, 0.8, PAVING_LINE);
  s += k.pad(0.8, v1, 1.2, 0.99, '#d93b4a', 0.8, '#a82432');
  s += k.box(u0, v0, u1, v1, 0, H, wall, { se: wallD });
  s += k.panel(front, u0, u1, 0, 2.2, '#2f3558', 1.1) + k.panel(side, v0, v1, 0, 2.2, '#252a47', 1.1);
  // ポスター（左右と よこ）
  const poster = (face, a, b, c1, c2) => k.panel(face, a, b, 3.4, 11.4, '#ffffff', 0.9) + k.band(face, a + 0.02, b - 0.02, 4.2, 10.6, c1)
    + k.flat([face(a + 0.02, 4.2), face(b - 0.02, 4.2), face(b - 0.02, 6.4), face(a + 0.02, 7.6)], c2);
  s += poster(front, 0.2, 0.44, '#ffb347', '#e2473f') + poster(front, 1.56, 1.8, '#7cc4ec', '#2f9e58');
  s += poster(side, 0.3, 0.56, '#c4a3ff', '#5b3fc0');
  // 入口の ガラス戸
  s += k.glass(front, 0.68, 1.32, 0, 9.4, 4, { frame: '#2b2f3a' });
  // 金の ふちと 屋上（機械・明かりとり）
  s += k.band(front, u0, u1, H - 1.4, H - 0.4, gold) + k.band(side, v0, v1, H - 1.4, H - 0.4, tone(gold, -0.2));
  s += k.parapet(u0, v0, u1, v1, H, 1.6, tone(wall, 0.1));
  s += k.acUnit(0.3, 0.26, H + 1.6) + k.acUnit(0.48, 0.26, H + 1.6) + k.skylight(1.4, 0.3, 1.7, 0.56, H + 1.7);
  // 屋根の上の 大かんばん（カチンコ。あかりの ふち）
  const board = k.SW(0.52);
  s += k.bar([[0.8, 0.52, H + 1.6], [0.8, 0.52, H + 6]], '#2b2f3a', 1.2, 0.5) + k.bar([[1.2, 0.52, H + 1.6], [1.2, 0.52, H + 6]], '#2b2f3a', 1.2, 0.5);
  s += k.sign(board, 0.6, 1.4, H + 5, H + 18, '#fff3c4', red) + k.onFace(board, 1, H + 11.5, `<g transform="scale(1.5)">${GLYPH_CLAPPER}</g>`);
  for (let i = 0; i <= 6; i++) s += k.dot(0.63 + i * 0.123, 0.522, H + 17.2, 0.8, '#fff3a0', 0.35) + k.dot(0.63 + i * 0.123, 0.522, H + 5.8, 0.8, '#fff3a0', 0.35);
  // あかりの ならぶ ひさし
  s += k.box(0.56, v1, 1.44, v1 + 0.17, 10, 12.6, red, { lw: 1 });
  for (let i = 0; i < 8; i++) s += k.dot(0.61 + i * 0.111, v1 + 0.172, 11.3, 0.9, '#fff3a0', 0.4);
  for (let i = 0; i < 2; i++) s += k.dot(1.442, v1 + 0.04 + i * 0.09, 11.3, 0.9, '#fff3a0', 0.4);
  s += k.pot(0.5, 0.92, 0.85) + k.pot(1.5, 0.92, 0.85);
  return s;
}

// ── 水車小屋（わらぶきの小屋・大きな水車・手前の水路） ──
function watermill() {
  const k = lot(2, 1);
  const wall = '#f2e3c2'; const wood = '#a8683a'; const woodD = '#7f4c28'; const thatch = '#d6ab57';
  const u0 = 0.66; const u1 = 1.84; const v0 = 0.14; const v1 = 0.78; const H = 15; const rise = 12;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  // 水路（石の ふち・白い波）
  s += k.pad(0.03, 0.82, 1.3, 0.995, '#cfc8ba', 0.9, '#8f887a') + k.pad(0.03, 0.845, 1.27, 0.975, '#66c8ee', 0.7, '#3d9fd0');
  for (const [u, v] of [[0.14, 0.9], [0.5, 0.93], [0.9, 0.9], [1.14, 0.94]]) s += k.seg([[u, v, 0.1], [u + 0.1, v, 0.1]], '#ffffff', 0.9, 0.8);
  // うしろの木と草
  s += k.tree(0.36, 0.18, 1.1) + k.bush(0.2, 0.4, 0.9) + k.tuft(0.14, 0.66, 1.2) + k.tuft(0.44, 0.56, 1);
  // 小屋
  s += k.gableWalls(u0, v0, u1, v1, H, rise, wall, 'u', { se: tone(wall, -0.12) });
  s += k.panel(front, u0, u1, 0, 2.6, '#b9b2a6', 1.1) + k.panel(side, v0, v1, 0, 2.6, '#a39b8e', 1.1);
  for (const t of [u0 + 0.02, 1.1, u1 - 0.02]) s += k.panel(front, t - 0.02, t + 0.02, 2.6, H, wood, 0.7);
  s += k.panel(front, u0, u1, H - 2.2, H - 0.8, woodD, 0.8);
  s += k.door(front, 1.3, 1.5, 0, 10.6, { color: wood, pane: false });
  s += k.win(front, 1.56, 1.76, 5.2, 10.6) + k.win(side, 0.34, 0.56, 5.2, 10.6);
  s += k.onFace(side, (v0 + v1) / 2, H + 5, `<circle r="2.4" fill="#5a3b26"${pen(0.9)}/>`);
  s += k.gableRoof(u0, v0, u1, v1, H, rise, thatch, 'u', { over: 0.08, plain: true, dark: '#a8792e' });
  // 水車（わ・や・水かき・じく）
  const cu = 0.54; const wv = 0.9; const cz = 15.4; const r = 0.37; const rz = r * 49;
  const ring = (f) => Array.from({ length: 25 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return [cu + Math.cos(a) * r * f, wv, cz + Math.sin(a) * rz * f]; });
  s += k.seg([[cu, v1, cz], [cu, wv, cz]], woodD, 2.2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    s += k.seg([[cu, wv, cz], [cu + Math.cos(a) * r, wv, cz + Math.sin(a) * rz]], woodD, 1.3);
  }
  s += k.bar(ring(1), wood, 2, 0.7) + k.seg(ring(0.7), woodD, 1.2);
  for (let i = 0; i < 12; i++) {
    const a = ((i + 0.5) / 12) * Math.PI * 2;
    s += k.bar([[cu + Math.cos(a) * r, wv - 0.05, cz + Math.sin(a) * rz], [cu + Math.cos(a) * r, wv + 0.05, cz + Math.sin(a) * rz]], '#c98a4b', 1.3, 0.5);
  }
  s += k.dot(cu, wv, cz, 1.9, woodD, 0.8);
  s += k.seg([[cu - 0.2, wv + 0.04, 0.4], [cu + 0.22, wv + 0.04, 0.4]], '#ffffff', 1.4, 0.85);
  // こなの ふくろ と 草
  s += k.oval(1.62, 0.92, 2, 3.4, 2.6, '#f3ead6', 0.8) + k.oval(1.74, 0.94, 1.8, 3, 2.3, '#e6dcc4', 0.8);
  return s;
}

// ── 温泉宿（そり屋根の宿・のれん・岩の ろてんぶろ） ──
function hotSpring() {
  const k = lot(2, 1);
  const wall = '#f6ecd6'; const wood = '#8a5a3a'; const woodD = '#6d4429'; const roof = '#b5562f';
  const u0 = 0.1; const u1 = 1.06; const v0 = 0.14; const v1 = 0.78; const H = 15;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  // 竹の かき（おふろの うしろ）
  s += k.box(1.12, 0.1, 1.94, 0.13, 0, 9, '#c9c36a', { se: '#a8a24e', top: '#dcd68a', lw: 0.9 });
  for (let i = 1; i < 10; i++) s += k.rule(k.SW(0.13), 1.12 + i * 0.082, 0, 1.12 + i * 0.082, 9, '#8f8a3e', 0.6);
  s += k.rule(k.SW(0.13), 1.12, 6.4, 1.94, 6.4, '#6d4429', 0.9);
  // 宿
  s += k.box(u0, v0, u1, v1, 0, H, wall, { se: tone(wall, -0.13) });
  s += k.panel(front, u0, u1, 0, 2.4, '#b9b2a6', 1.1) + k.panel(side, v0, v1, 0, 2.4, '#a39b8e', 1.1);
  for (const t of [u0 + 0.02, 0.4, 0.78, u1 - 0.02]) s += k.panel(front, t - 0.02, t + 0.02, 2.4, H, wood, 0.7);
  for (const t of [v0 + 0.02, 0.46, v1 - 0.02]) s += k.panel(side, t - 0.02, t + 0.02, 2.4, H, woodD, 0.7);
  // 入口（暗い戸口に 青い のれん）
  s += k.panel(front, 0.44, 0.74, 2.4, 11.6, '#4a3626', 1);
  for (let i = 0; i < 3; i++) s += k.panel(front.out(0.01), 0.45 + i * 0.097, 0.54 + i * 0.097, 6.6, 11.6, '#2f6fb5', 0.7);
  s += k.onFace(front.out(0.012), 0.59, 9.2, GLYPH_ONSEN);
  s += k.win(front, 0.16, 0.34, 5.2, 10.6, { bars: 'cross' }) + k.win(front, 0.84, 1.0, 5.2, 10.6, { bars: 'cross' });
  s += k.win(side, 0.24, 0.4, 5.2, 10.6) + k.win(side, 0.54, 0.7, 5.2, 10.6);
  s += k.hipRoof(u0, v0, u1, v1, H, 11, roof, { over: 0.1, curl: 2, hip: 0.6 });
  s += k.dot(0.4, v1 + 0.1, 11.2, 1.7, '#ff5a4d', 0.6) + k.dot(0.78, v1 + 0.1, 11.2, 1.7, '#ff5a4d', 0.6);
  // ろてんぶろ（岩の ふち・ゆ・ゆげ）
  const bu = 1.5; const bv = 0.54;
  s += k.disc(bu, bv, 0.4, 0.34, '#8d939c', 1.1);
  s += k.disc(bu, bv, 0.6, 0.27, '#7fd3e8', 0.9) + k.disc(bu - 0.03, bv - 0.03, 0.6, 0.16, '#b6e9f4', 0);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    s += k.oval(bu + Math.cos(a) * 0.31, bv + Math.sin(a) * 0.31, 1.2, 4.2 + (i % 3), 3 + (i % 2), i % 2 ? '#9aa1ab' : '#b3b9c1', 0.8);
  }
  s += k.smoke(bu - 0.1, bv - 0.04, 5, 1) + k.smoke(bu + 0.08, bv + 0.06, 4, 0.8);
  // おけ・石どうろう・ふみ石
  s += k.cyl(1.2, 0.86, 0.04, 0, 2.8, '#c98a4b', { lw: 0.8 });
  s += k.cyl(1.86, 0.84, 0.03, 0, 4.6, '#cfc7b8', { lw: 0.8 }) + k.box(1.82, 0.8, 1.9, 0.88, 4.6, 7.4, '#e6dfd0', { lw: 0.8 }) + k.dot(1.86, 0.882, 6, 0.8, '#ffd24a', 0.4);
  s += k.oval(0.59, 0.9, 0, 3.2, 1.6, '#d6cfc2', 0.8) + k.oval(0.64, 0.97, 0, 2.8, 1.4, '#d6cfc2', 0.8);
  s += k.bush(0.16, 0.92, 0.85);
  return s;
}

// ── 賢者の研究所（星の とんがり屋根の塔・まほうじん・なべ） ──
function philosophersLab() {
  const k = lot(2, 1);
  const stone = '#bdb8cc'; const roof = '#6a4fc0'; const gold = '#ffd24a';
  let s = '';
  // まほうじん
  const mu = 1.46; const mv = 0.58;
  s += k.disc(mu, mv, 0.2, 0.34, '#4c3a8f', 1) + k.disc(mu, mv, 0.2, 0.27, '#5d49a8', 0);
  const star = Array.from({ length: 6 }, (_, i) => { const a = (i * 2 / 5) * Math.PI * 2 - Math.PI / 2; return [mu + Math.cos(a) * 0.25, mv + Math.sin(a) * 0.25, 0.3]; });
  s += k.seg(star, gold, 0.9, 0.9);
  s += k.seg(Array.from({ length: 25 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return [mu + Math.cos(a) * 0.29, mv + Math.sin(a) * 0.29, 0.3]; }), gold, 0.8, 0.9);
  // 小屋（うしろ）
  s += k.gableWalls(1.02, 0.1, 1.6, 0.42, 10.5, 6.5, stone, 'u', { se: tone(stone, -0.15) });
  s += k.win(k.SW(0.42), 1.22, 1.4, 4, 8.4, { glass: '#ffe9a0' });
  s += k.gableRoof(1.02, 0.1, 1.6, 0.42, 10.5, 6.5, roof, 'u', { over: 0.05, plain: true });
  s += k.box(1.42, 0.2, 1.5, 0.28, 12, 20, '#8f8a9c', { lw: 0.9 });
  s += k.dot(1.46, 0.24, 23, 1.7, '#7be08a', 0.5, 0.9) + k.dot(1.5, 0.24, 27, 2.2, '#7be08a', 0.5, 0.7) + k.dot(1.44, 0.24, 31.4, 1.5, '#7be08a', 0.5, 0.5);
  // 塔
  const tu = 0.58; const tv = 0.5; const TH = 33;
  s += k.cyl(tu, tv, 0.33, 0, 2.6, '#8f8a9c', { lw: 1.1 });
  s += k.cyl(tu, tv, 0.28, 2.6, TH, stone, { lw: 1.2, top: false });
  const [tx, ty] = k.xy(tu, tv, 0);
  s += `<path d="M${num(tx - 4.6)} ${num(ty + 6.4)}v-9.4q0 -4.2 4 -4.2q4 0 4 4.2v10.6z" fill="#5a3b26"${pen(1)}/>`;
  for (const [dx, z] of [[-8.6, 16], [6.4, 20], [-3, 26.6]]) {
    s += `<path d="M${num(tx + dx - 2)} ${num(ty - z + 3 + dx * 0.16)}v-5q0 -2.6 2 -2.6q2 0 2 2.6v5z" fill="#ffe9a0"${pen(0.8)}/>`;
  }
  s += k.cyl(tu, tv, 0.31, TH, TH + 2.4, '#a39fb4', { lw: 1 });
  s += k.cone(tu, tv, 0.36, TH + 2.4, TH + 25, roof);
  const [rx, ry] = k.xy(tu, tv, TH + 2.4);
  for (const [dx, dy, r] of [[-9, -6, 1.1], [3, -9, 0.9], [-3, -14.4, 0.8], [8, -4, 0.8]]) {
    s += `<path transform="translate(${num(rx + dx)} ${num(ry + dy)}) scale(${r})" d="M0 -2.4L.6 -.6L2.4 0L.6 .6L0 2.4L-.6 .6L-2.4 0L-.6 -.6Z" fill="${gold}"/>`;
  }
  s += `<path transform="translate(${num(rx)} ${num(ry - 25.6)})" d="M1.4 -3.6A3.4 3.4 0 1 0 1.4 3.2A2.7 2.7 0 1 1 1.4 -3.6Z" fill="${gold}"${pen(0.6)}/>`;
  // なべ（みどりの くすり）と びん
  s += k.cyl(1.04, 0.84, 0.075, 0, 4.4, '#3b3f48', { top: '#57d38c', lw: 1 });
  s += k.dot(1.02, 0.84, 6.4, 1, '#9af0b4', 0.4) + k.dot(1.07, 0.84, 8.2, 0.7, '#9af0b4', 0.4);
  const bottle = (u, v, c) => { const [x, y] = k.xy(u, v, 0); return `<path d="M${num(x - 1.6)} ${num(y)}h3.2l-.4 -3l-.6 -.8v-1.6h-1.2v1.6l-.6 .8z" fill="${c}"${pen(0.6)}/>`; };
  s += bottle(1.24, 0.92, '#ff7ab8') + bottle(1.32, 0.94, '#62c7ff') + bottle(0.2, 0.88, '#ffd24a');
  s += k.tuft(1.84, 0.9, 1) + k.bush(1.86, 0.3, 0.8, { mid: '#5d49a8', lite: '#8a76d6', hi: '#b9a8f0', dark: '#33266a' });
  return s;
}

// ── 守り神の祠（石の台の 小さな やしろ・しめなわ・こまいぬ） ──
function guardianShrine() {
  const k = lot(2, 1);
  const red = '#d9442f'; const redD = '#a82f20'; const gold = '#ffd24a'; const roof = '#3f8f7a';
  let s = '';
  s += k.pad(0.04, 0.04, 1.96, 0.96, '#a8dd76', 0.9, '#6aa84a');
  s += k.pad(0.86, 0.6, 1.14, 0.96, '#d6cfc2', 0.8, '#a39b8e');
  s += k.tree(0.26, 0.24, 1.25, { mid: '#2c7a45', lite: '#4a9c58' }) + k.tree(1.76, 0.22, 1.2, { mid: '#2c7a45', lite: '#4a9c58' });
  s += k.shadow(0.58, 0.08, 1.42, 0.6, 0.14);
  // 石の台と かいだん
  s += k.box(0.58, 0.08, 1.42, 0.6, 0, 3.6, STONE, { lw: 1.1 });
  s += k.steps(k.SW(0.6), 0.84, 1.16, 2, { rise: 1.8, run: 0.045 });
  // やしろ
  const u0 = 0.72; const u1 = 1.28; const v0 = 0.16; const v1 = 0.5; const z0 = 3.6; const H = 14;
  const front = k.SW(v1); const side = k.SE(u1);
  s += k.gableWalls(u0, v0, u1, v1, H, 6.5, red, 'u', { se: redD, z0 });
  s += k.panel(front, 0.86, 1.14, z0, 11.6, '#fff3c4', 0.9);
  for (const t of [0.93, 1, 1.07]) s += k.rule(front, t, z0, t, 11.6, redD, 0.6);
  s += k.rule(front, 0.86, 7.6, 1.14, 7.6, redD, 0.6);
  s += k.panel(front, u0, u1, H - 2, H - 0.6, gold, 0.7);
  s += k.gableRoof(u0, v0, u1, v1, H, 6.5, roof, 'u', { over: 0.1, drop: 1, plain: true });
  // ちぎ（屋根の はしの 交差した かざり）
  for (const u of [u0 - 0.06, u1 + 0.06]) {
    s += k.bar([[u, 0.27, H + 5.2], [u, 0.39, H + 10.4]], gold, 1, 0.5) + k.bar([[u, 0.39, H + 5.2], [u, 0.27, H + 10.4]], gold, 1, 0.5);
  }
  // 守り神の玉（かがやく）
  s += k.dot(1, 0.33, H + 14.5, 5.4, '#fff3a0', 0, 0.45) + k.dot(1, 0.33, H + 14.5, 3.3, gold, 0.9) + k.dot(0.99, 0.32, H + 15.6, 1.1, '#fffbe0', 0);
  // さいせんばこ
  s += k.box(0.9, 0.52, 1.1, 0.58, z0, z0 + 2.8, '#a8683a', { lw: 0.9 });
  // しめなわ と しで
  s += k.bar([[0.62, 0.72, 0], [0.62, 0.72, 12.4]], '#a8683a', 1.4, 0.6);
  s += k.curve([0.62, 0.72, 11.4], [1, 0.72, 8.6], [1.38, 0.72, 11.4], '#e6d7a8', 1.6, 0.6);
  for (const [u, z] of [[0.8, 9.6], [1, 9], [1.2, 9.6]]) {
    const [x, y] = k.xy(u, 0.72, z);
    s += `<path d="M${num(x - 1)} ${num(y)}h2l-1.2 2h1.6l-1.4 2.6h1.4l-1.6 2.6" fill="none"${pen(1.2, '#ffffff')}/>`;
  }
  s += k.bar([[1.38, 0.72, 0], [1.38, 0.72, 12.4]], '#a8683a', 1.4, 0.6);
  // こまいぬ（左右）
  const koma = (u, flip) => {
    const [x, y] = k.xy(u, 0.86, 0);
    return k.box(u - 0.07, 0.81, u + 0.07, 0.91, 0, 2.6, '#c9c2b6', { lw: 0.9 })
      + `<path transform="translate(${num(x)} ${num(y - 2.6)}) scale(${flip ? -1 : 1} 1)" d="M-2.8 0V-3.2Q-3 -6.4 -.4 -6.8Q-.6 -8.6 1.2 -8.8Q3.4 -8.8 3.4 -6.6Q3.4 -5.2 2.2 -4.8L2.6 0Z" fill="#b4ad9f"${pen(0.8)}/>`;
  };
  s += koma(0.5, false) + koma(1.5, true);
  return s;
}

// ── プール（青い水・コースの ロープ・パラソル） ──
function pool() {
  const k = lot(2, 1);
  const deck = '#e9eef3'; const water = '#4dbdee';
  const a = 0.2; const b = 1.8; const c = 0.18; const d = 0.8;
  let s = '';
  s += k.pad(0.03, 0.03, 1.97, 0.97, deck, 0.9, '#aeb9c4');
  for (const u of [0.5, 1, 1.5]) s += k.seg([[u, 0.03, 0.05], [u, 0.97, 0.05]], '#c9d3dd', 0.6, 0.7);
  s += k.seg([[0.03, 0.5, 0.05], [1.97, 0.5, 0.05]], '#c9d3dd', 0.6, 0.7);
  // 水（ふちの白い石・奥の かべの かげ）
  s += k.pad(a - 0.04, c - 0.04, b + 0.04, d + 0.04, '#ffffff', 0.9, '#8ea0b3');
  s += k.pad(a, c, b, d, water, 0.8, '#2b8fc4');
  s += k.flat([[a, c, 0], [b, c, 0], [b, c + 0.06, 0], [a + 0.03, c + 0.06, 0], [a + 0.03, d, 0], [a, d, 0]], '#2f9ad0', 0.9);
  s += k.flat([[a + 0.2, c + 0.16, 0], [a + 0.7, c + 0.16, 0], [a + 0.62, c + 0.3, 0], [a + 0.12, c + 0.3, 0]], '#9fe2fb', 0.6);
  // コースの ロープ（赤と白）
  for (const v of [0.34, 0.5, 0.66]) {
    s += k.seg([[a + 0.02, v, 0.1], [b - 0.02, v, 0.1]], '#ffffff', 1.3);
    for (let i = 0; i < 8; i++) s += k.seg([[a + 0.06 + i * 0.2, v, 0.1], [a + 0.14 + i * 0.2, v, 0.1]], '#ef4444', 1.3);
  }
  // とびこみ台
  for (const v of [0.26, 0.42, 0.58, 0.74]) s += k.box(b + 0.01, v - 0.035, b + 0.1, v + 0.035, 0, 2.6, '#f8fafc', { top: '#3f8fd1', lw: 0.8 });
  // はしご
  for (const v of [c + 0.07, c + 0.13]) s += k.curve([a - 0.03, v, 0], [a - 0.01, v, 5], [a + 0.03, v, 0.4], '#aab4c0', 0.9, 0.4);
  // うきわ と ボール
  s += k.oval(0.62, 0.58, 0.4, 5, 2.6, '#ff8fb8', 0.8) + k.oval(0.62, 0.58, 0.5, 2.4, 1.2, water, 0.6);
  s += k.dot(1.3, 0.42, 1.4, 2.2, '#ffffff', 0.7) + k.dot(1.29, 0.41, 1.8, 0.9, '#ef4444', 0);
  // かんしの いす・パラソルと ねいす
  s += k.bar([[0.1, 0.24, 0], [0.1, 0.24, 9]], '#aab4c0', 1, 0.5) + k.box(0.06, 0.2, 0.14, 0.28, 9, 10.4, '#f8fafc', { lw: 0.8 });
  s += k.box(0.3, 0.87, 0.5, 0.94, 0, 1.6, '#ffd24a', { lw: 0.8 }) + k.box(0.56, 0.87, 0.76, 0.94, 0, 1.6, '#ff8a5c', { lw: 0.8 });
  s += k.bar([[0.53, 0.9, 0], [0.53, 0.9, 10]], '#8a5a33', 0.9, 0.4) + k.cone(0.53, 0.9, 0.17, 9.4, 14, '#ef4444', { lw: 0.9 });
  s += k.box(1.3, 0.87, 1.5, 0.94, 0, 1.6, '#5cc4f0', { lw: 0.8 });
  s += k.bar([[1.58, 0.9, 0], [1.58, 0.9, 10]], '#8a5a33', 0.9, 0.4) + k.cone(1.58, 0.9, 0.17, 9.4, 14, '#3f8fd1', { lw: 0.9 });
  return s;
}

// ── ホテル（クリーム色の高い建物・たての かんばん・星の屋上） ──
const HOTEL_LETTERS = ['M-1 -1.4V1.4M1 -1.4V1.4M-1 0H1', 'M0 -1.4Q1.1 -1.4 1.1 0Q1.1 1.4 0 1.4Q-1.1 1.4 -1.1 0Q-1.1 -1.4 0 -1.4Z', 'M-1.1 -1.4H1.1M0 -1.4V1.4', 'M1 -1.4H-1V1.4H1M-1 0H.6', 'M-1 -1.4V1.4H1'];
function hotel() {
  const k = lot(1, 2);
  const wall = '#f8e6cb'; const wallD = tone(wall, -0.14); const trim = '#a23a55';
  const u0 = 0.12; const u1 = 0.88; const v0 = 0.14; const v1 = 1.4; const H = 66; const floorH = 9.2;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  s += k.pad(0.04, v1, 0.96, 1.97, PAVING, 0.8, PAVING_LINE);
  s += k.pad(0.38, v1, 0.62, 1.97, '#d93b4a', 0.8, '#a82432');
  s += k.box(u0, v0, u1, v1, 0, H, wall, { se: wallD });
  s += k.panel(front, u0, u1, 0, 2.4, '#b9a58c', 1.1) + k.panel(side, v0, v1, 0, 2.4, '#a39078', 1.1);
  // 1 階（ロビー）
  s += k.glass(front, 0.32, 0.68, 0, 8.6, 2, { frame: '#5a4636' }) + k.glass(side, 0.24, 1.3, 3, 8.2, 7);
  // 客室の窓（6 階ぶん）
  for (let f = 0; f < 6; f++) {
    const z = 11.4 + f * floorH;
    s += k.glass(front, 0.36, 0.8, z, z + 5.6, 3) + k.glass(side, 0.22, 1.32, z, z + 5.6, 8);
    s += k.band(front, u0, u1, z - 1.8, z - 1, tone(wall, -0.1)) + k.band(side, v0, v1, z - 1.8, z - 1, tone(wallD, -0.1));
  }
  // たての かんばん「HOTEL」
  s += k.panel(front, 0.16, 0.3, 12, 60, trim, 0.9);
  HOTEL_LETTERS.forEach((d, i) => { s += k.onFace(front, 0.23, 54.4 - i * 9.2, `<path transform="scale(1.9)" d="${d}" fill="none"${pen(0.5, '#ffffff')}/>`); });
  s += k.band(front, u0, u1, H - 2.6, H - 0.8, trim) + k.band(side, v0, v1, H - 2.6, H - 0.8, tone(trim, -0.18));
  s += k.parapet(u0, v0, u1, v1, H, 2, tone(wall, 0.2));
  // 屋上の小屋と 金の星
  s += k.box(0.3, 0.5, 0.7, 0.96, H + 2, H + 10, wall, { se: wallD });
  s += k.onFace(k.SW(0.96), 0.5, H + 6, `<path d="M0 -3.4L1 -1.1L3.4 -1L1.5 .5L2.2 2.9L0 1.5L-2.2 2.9L-1.5 .5L-3.4 -1L-1 -1.1Z" fill="#ffd24a"${pen(0.6)}/>`);
  s += k.acUnit(0.3, 0.2, H + 2) + k.acUnit(0.56, 1.1, H + 2);
  // 入口の ひさしと 木
  s += k.bar([[0.3, v1 + 0.22, 0], [0.3, v1 + 0.22, 10]], '#d9b24a', 1.2, 0.5);
  s += k.box(0.26, v1, 0.74, v1 + 0.26, 10, 11.8, trim, { lw: 1 });
  s += k.bar([[0.7, v1 + 0.22, 0], [0.7, v1 + 0.22, 10]], '#d9b24a', 1.2, 0.5);
  s += k.pot(0.16, 1.6, 1) + k.pot(0.84, 1.6, 1) + k.bush(0.18, 1.86, 0.8, { flowers: ['#ff8fb8', '#ffffff'] }) + k.bush(0.8, 1.87, 0.8, { flowers: ['#ffd24a'] });
  return s;
}

// ── オフィスビル（青いガラスの高い ビル・屋上の アンテナ） ──
function officeBuilding() {
  const k = lot(1, 2);
  const frame = '#e9eef4'; const frameD = '#cdd6e0';
  const u0 = 0.14; const u1 = 0.86; const v0 = 0.18; const v1 = 1.42; const H = 76; const floorH = 8.4;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  s += k.pad(0.04, v1, 0.96, 1.97, PAVING, 0.8, PAVING_LINE);
  s += k.box(u0, v0, u1, v1, 0, H, frame, { se: frameD });
  // 1 階（ロビー）
  s += k.glass(front, 0.2, 0.8, 0, 7.4, 4, { frame: '#3d4a5c' }) + k.glass(side, 0.24, 1.36, 0.6, 7.2, 8, { frame: '#3d4a5c' });
  // ガラスの帯（8 階ぶん）
  for (let f = 0; f < 8; f++) {
    const z = 9.4 + f * floorH;
    s += k.glass(front, 0.18, 0.82, z, z + 6, 4, { glass: '#5fb2ea', frame: '#3a5a86' }) + k.glass(side, 0.22, 1.38, z, z + 6, 8, { glass: '#4f9fd8', frame: '#33507a' });
  }
  s += k.parapet(u0, v0, u1, v1, H, 2, frame);
  // 屋上（機械室・アンテナ・赤い あかり）
  s += k.box(0.3, 0.4, 0.66, 0.8, H + 2, H + 8, '#b9c4d0', { lw: 1 });
  s += k.acUnit(0.26, 0.98, H + 2, 1.2) + k.acUnit(0.5, 1.1, H + 2, 1.2);
  s += k.bar([[0.48, 0.6, H + 8], [0.48, 0.6, H + 24]], '#8a94a3', 1, 0.5) + k.seg([[0.4, 0.6, H + 16], [0.56, 0.6, H + 16]], '#8a94a3', 0.9) + k.dot(0.48, 0.6, H + 25, 1.5, '#ff5a4d', 0.6);
  // 入口の ひさし・広場の木
  s += k.box(0.3, v1, 0.7, v1 + 0.16, 8, 9.4, '#3a5a86', { lw: 1 });
  s += k.tree(0.18, 1.7, 1.05) + k.tree(0.82, 1.7, 1.05) + k.box(0.4, 1.84, 0.6, 1.9, 0, 2.2, '#c98a4b', { lw: 0.9 });
  return s;
}

// ── タワマン（白い高い集合住宅・ベランダ・屋上の水そう） ──
function towerApartment() {
  const k = lot(1, 2);
  const wall = '#fbf7ef'; const wallD = tone(wall, -0.13); const accent = '#d9825a';
  const u0 = 0.14; const u1 = 0.86; const v0 = 0.18; const v1 = 1.38; const H = 82; const floorH = 8.2;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  s += k.pad(0.04, v1, 0.96, 1.97, PAVING, 0.8, PAVING_LINE);
  s += k.box(u0, v0, u1, v1, 0, H, wall, { se: wallD });
  s += k.panel(front, u0, u1, 0, 2.4, '#b9a58c', 1.1) + k.panel(side, v0, v1, 0, 2.4, '#a39078', 1.1);
  // たての色の帯（かいだん室）
  s += k.band(front, 0.66, 0.86, 2.4, H, accent) + k.band(side, v0, 0.4, 2.4, H, tone(accent, -0.16));
  s += k.glass(front, 0.24, 0.58, 0, 7, 2, { frame: '#5a4636' });
  // 9 階ぶんの 窓と ベランダ
  for (let f = 0; f < 9; f++) {
    const z = 9.6 + f * floorH;
    s += k.glass(front, 0.2, 0.62, z, z + 5.4, 3) + k.glass(side, 0.46, 1.32, z, z + 5.4, 6);
    s += k.panel(front, 0.71, 0.81, z + 0.6, z + 4.6, '#8fd3f7', 0.6);
    // ベランダ（ゆかと 手すり）
    s += k.box(0.17, v1, 0.65, v1 + 0.05, z - 1.4, z + 1.8, '#f1ebdf', { se: '#d9d2c4', top: '#fffdf8', lw: 0.7 });
  }
  s += k.parapet(u0, v0, u1, v1, H, 2, tone(wall, 0.3));
  // 屋上（水そう・太陽光パネル）
  s += k.cyl(0.36, 0.5, 0.11, H + 2, H + 9, '#dfe4ea', { lw: 1 });
  s += k.skylight(0.3, 0.86, 0.72, 1.18, H + 2.4);
  // 入口の ひさし・生けがき・木
  s += k.box(0.2, v1, 0.62, v1 + 0.16, 7.6, 9, accent, { lw: 1 });
  s += k.box(0.1, 1.84, 0.4, 1.92, 0, 3.4, '#3f9a4f', { se: '#2f7d3f', top: '#62bd62', lw: 1 }) + k.box(0.62, 1.84, 0.92, 1.92, 0, 3.4, '#3f9a4f', { se: '#2f7d3f', top: '#62bd62', lw: 1 });
  s += k.tree(0.82, 1.62, 1.1) + k.bush(0.18, 1.6, 0.9, { flowers: ['#ff8fb8', '#ffffff'] });
  return s;
}

// ── 大倉庫（長い切妻の倉・大きな引き戸・木箱と たる） ──
function grandWarehouse() {
  const k = lot(1, 2);
  const wall = '#e6e9ee'; const wallD = tone(wall, -0.14); const roof = '#4f86c6';
  const u0 = 0.12; const u1 = 0.88; const v0 = 0.1; const v1 = 1.66; const H = 16; const rise = 9.5;
  const front = k.SW(v1); const side = k.SE(u1);
  let s = '';
  s += k.pad(0.04, v1, 0.96, 1.97, '#ddd7cd', 0.8, PAVING_LINE);
  s += k.gableWalls(u0, v0, u1, v1, H, rise, wall, 'v', { se: wallD });
  s += k.panel(front, u0, u1, 0, 2.6, '#8f8a84', 1.1) + k.panel(side, v0, v1, 0, 2.6, '#7b7670', 1.1);
  // なみ板の たての線
  for (let i = 1; i < 12; i++) s += k.rule(side, v0 + ((v1 - v0) * i) / 12, 2.6, v0 + ((v1 - v0) * i) / 12, H, '#aeb6c2', 0.6, 0.7);
  // 正面の 引き戸（2 まい）と 丸い かんきこう
  s += k.panel(front, 0.24, 0.76, 0, 13, '#3d4a5c', 1) + k.band(front, 0.26, 0.495, 0.4, 12.4, '#4a7fb5') + k.band(front, 0.505, 0.74, 0.4, 12.4, '#3f6f9f');
  for (const z of [4.4, 8.4]) s += k.rule(front, 0.26, z, 0.74, z, '#2f5578', 0.7);
  s += k.onFace(front, 0.5, H + 3.6, `<circle r="2.8" fill="#5b6470"${pen(0.9)}/><path d="M-2 0H2M0 -2V2" fill="none"${pen(0.6, '#c9d3dd')}/>`);
  // よこの 高い窓と つみおろし口
  s += k.wins(side, 0.2, 1.56, 5, 9.6, 13.4, { bars: 'v' });
  for (const [a, b] of [[0.4, 0.7], [1.06, 1.36]]) {
    s += k.panel(side, a, b, 0, 8, '#3d4a5c', 1) + k.band(side, a + 0.02, b - 0.02, 0.4, 7.4, '#cfd6de');
    for (const z of [2.4, 4.8]) s += k.rule(side, a + 0.02, z, b - 0.02, z, '#9aa6b5', 0.7);
  }
  s += k.gableRoof(u0, v0, u1, v1, H, rise, roof, 'v', { over: 0.05, plain: true });
  for (let i = 1; i < 9; i++) {
    const v = v0 - 0.05 + ((v1 - v0 + 0.1) * i) / 9;
    s += k.seg([[0.5, v, H + rise], [u1 + 0.05, v, H - 1.2]], tone(roof, -0.3), 0.6, 0.6);
  }
  // 木箱・たる・パレット
  s += k.box(0.14, 1.72, 0.32, 1.86, 0, 4, '#c98a4b', { lw: 0.9 }) + k.box(0.18, 1.75, 0.3, 1.84, 4, 7, '#d6a05e', { lw: 0.9 });
  s += k.box(0.34, 1.78, 0.48, 1.9, 0, 3.4, '#d6a05e', { lw: 0.9 });
  s += k.cyl(0.78, 1.8, 0.05, 0, 5, '#9a6a3c', { lw: 0.9 }) + k.cyl(0.66, 1.86, 0.05, 0, 5, '#b07a45', { lw: 0.9 });
  return s;
}

// ── 記念碑（3 だんの台に 石の はしら。金の てっぺん） ──
function monument() {
  const k = lot(1, 2);
  const cu = 0.5; const cv = 1; const stone = '#e3e6ea'; const stoneD = '#bcc3cc';
  let s = '';
  s += k.pad(0.06, 0.14, 0.94, 1.86, PAVING, 0.9, PAVING_LINE);
  // 花だん（奥）
  s += k.disc(0.5, 0.36, 0.2, 0.2, '#7fcf6a', 0.9) + k.flowers([[0.42, 0.34], [0.5, 0.3], [0.58, 0.36], [0.5, 0.42], [0.44, 0.42]], ['#ff8fb8', '#ffd24a', '#ffffff']);
  s += k.shadow(cu - 0.4, cv - 0.4, cu + 0.4, cv + 0.4, 0.1);
  for (const [half, z] of [[0.4, 0], [0.31, 2.6], [0.22, 5.2]]) s += k.box(cu - half, cv - half, cu + half, cv + half, z, z + 2.6, STONE, { lw: 1.1 });
  // はしら（上へ行くほど細い）
  const b = 0.11; const t = 0.06; const z0 = 7.8; const z1 = 50;
  s += k.poly([[cu - b, cv + b, z0], [cu + b, cv + b, z0], [cu + t, cv + t, z1], [cu - t, cv + t, z1]], stone);
  s += k.poly([[cu + b, cv + b, z0], [cu + b, cv - b, z0], [cu + t, cv - t, z1], [cu + t, cv + t, z1]], stoneD);
  s += k.flat([[cu - b + 0.02, cv + b, z0 + 2], [cu - b + 0.06, cv + b, z0 + 2], [cu - t + 0.03, cv + t, z1 - 4], [cu - t + 0.01, cv + t, z1 - 4]], '#ffffff', 0.7);
  // 金の てっぺん と ふだ
  s += k.poly([[cu - t, cv + t, z1], [cu + t, cv + t, z1], [cu, cv, z1 + 6]], '#ffd24a') + k.poly([[cu + t, cv + t, z1], [cu + t, cv - t, z1], [cu, cv, z1 + 6]], '#dba42b');
  s += k.panel(k.SW(cv + 0.222), cu - 0.1, cu + 0.1, 5.8, 7.4, '#ffd24a', 0.7);
  // 花わ と 手前の花だん
  s += k.oval(cu, cv + 0.34, 3.2, 3.4, 2.4, '#3f9a4f', 0.8) + k.dot(cu - 0.03, cv + 0.34, 3.6, 0.9, '#ff5a4d', 0) + k.dot(cu + 0.03, cv + 0.34, 3.2, 0.9, '#ffffff', 0);
  s += k.disc(0.5, 1.64, 0.2, 0.2, '#7fcf6a', 0.9) + k.flowers([[0.42, 1.62], [0.5, 1.58], [0.58, 1.64], [0.5, 1.7], [0.44, 1.7]], ['#ffd24a', '#ff8fb8', '#ffffff']);
  return s;
}

// ── 天文台（白い丸屋根から ぼうえんきょう） ──
function observatory() {
  const k = lot(1, 2);
  const wall = '#f1f4f8'; const wallD = tone(wall, -0.14); const dome = '#dfe6ef';
  const cu = 0.5; const cv = 0.72;
  let s = '';
  s += k.pad(0.05, 0.1, 0.95, 1.9, '#3a3f6b', 0.9, '#252a4d');
  // 星の もよう
  for (const [u, v] of [[0.16, 0.3], [0.84, 0.4], [0.2, 1.5], [0.8, 1.72], [0.5, 1.84], [0.86, 1.2], [0.14, 1.0]]) {
    const [x, y] = k.xy(u, v, 0.1);
    s += `<path transform="translate(${num(x)} ${num(y)}) scale(.8 .4)" d="M0 -3L.7 -.7L3 0L.7 .7L0 3L-.7 .7L-3 0L-.7 -.7Z" fill="#ffe9a0"/>`;
  }
  s += k.roundShadow(cu, cv, 0.4);
  // 丸い本体と 丸屋根
  s += k.cyl(cu, cv, 0.38, 0, 2.4, '#b8c2cc', { lw: 1.1 });
  s += k.cyl(cu, cv, 0.34, 2.4, 20, wall, { lw: 1.2, top: false });
  const [x0, y0] = k.xy(cu, cv, 0);
  for (const dx of [-13, -5, 9]) s += `<path d="M${num(x0 + dx - 1.8)} ${num(y0 - 9 + (dx < 0 ? 6.5 + dx * 0.18 : 7 - dx * 0.22))}v-5q0 -2.4 1.8 -2.4q1.8 0 1.8 2.4v5z" fill="#8fd3f7"${pen(0.7)}/>`;
  s += k.cyl(cu, cv, 0.37, 20, 22.4, '#c9d3dd', { lw: 1 });
  s += k.dome(cu, cv, 0.37, 22.4, 19, dome);
  // 丸屋根の すきまと、ぼうえんきょう
  const [dx0, dy0] = k.xy(cu, cv, 22.4);
  s += `<path d="M${num(dx0 + 2)} ${num(dy0 + 8.6)}Q${num(dx0 + 9)} ${num(dy0 - 10)} ${num(dx0 + 3)} ${num(dy0 - 18.6)}L${num(dx0 + 8.4)} ${num(dy0 - 17)}Q${num(dx0 + 15.4)} ${num(dy0 - 7)} ${num(dx0 + 9.6)} ${num(dy0 + 9.6)}Z" fill="#2b3350"${pen(1)}/>`;
  s += `<path d="M${num(dx0 + 5)} ${num(dy0 - 4)}L${num(dx0 + 17)} ${num(dy0 - 19)}" fill="none"${pen(5.6)}/><path d="M${num(dx0 + 5)} ${num(dy0 - 4)}L${num(dx0 + 17)} ${num(dy0 - 19)}" fill="none"${pen(4, '#c9d3dd')}/>`
    + `<circle cx="${num(dx0 + 17.6)}" cy="${num(dy0 - 19.8)}" r="2.6" fill="#8fd3f7"${pen(0.9)}/>`;
  // 入口の小屋と 月の かんばん
  const a0 = 0.26; const a1 = 0.74; const av0 = 1.06; const av1 = 1.5; const aH = 11;
  s += k.box(a0, av0, a1, av1, 0, aH, wall, { se: wallD });
  s += k.door(k.SW(av1), 0.42, 0.58, 0, 8.6, { color: '#3d5a9a' });
  s += k.win(k.SE(a1), 1.16, 1.36, 3.6, 8);
  s += k.parapet(a0, av0, a1, av1, aH, 1.4, wall);
  s += k.bar([[0.2, 1.72, 0], [0.2, 1.72, 13]], '#8a94a3', 1, 0.5);
  const [mx, my] = k.xy(0.2, 1.72, 16.4);
  s += `<path transform="translate(${num(mx)} ${num(my)})" d="M1.6 -4.2A4 4 0 1 0 1.6 3.8A3.2 3.2 0 1 1 1.6 -4.2Z" fill="#ffd24a"${pen(0.7)}/>`;
  return s;
}

// ── 完璧の碑（白い台の上に、金の わの「はなまる」） ──
function perfectMonument() {
  const k = lot(1, 2);
  const cu = 0.5; const cv = 1; const marble = '#fbfbf7'; const marbleD = '#dcdcd4'; const gold = '#ffd24a';
  let s = '';
  s += k.pad(0.06, 0.14, 0.94, 1.86, '#f3ead6', 0.9, PAVING_LINE);
  s += k.shadow(cu - 0.4, cv - 0.4, cu + 0.4, cv + 0.4, 0.1);
  for (const [half, z] of [[0.4, 0], [0.3, 2.8]]) s += k.box(cu - half, cv - half, cu + half, cv + half, z, z + 2.8, marble, { se: marbleD, lw: 1.1 });
  // 台（金の ふち）
  s += k.box(cu - 0.18, cv - 0.18, cu + 0.18, cv + 0.18, 5.6, 20, marble, { se: marbleD });
  s += k.band(k.SW(cv + 0.18), cu - 0.18, cu + 0.18, 17.6, 19.2, gold) + k.band(k.SE(cu + 0.18), cv - 0.18, cv + 0.18, 17.6, 19.2, '#dba42b');
  s += k.panel(k.SW(cv + 0.181), cu - 0.1, cu + 0.1, 9, 14, gold, 0.7);
  // はなまる（金の花びらの わ・白い面・赤い うずまき）。正面を向けて大きく見せる
  let mark = '';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    mark += `<circle cx="${num(Math.cos(a) * 12.4)}" cy="${num(Math.sin(a) * 12.4)}" r="3.5" fill="${gold}"${pen(0.8)}/>`;
  }
  mark += `<circle r="12.4" fill="${gold}"${pen(1)}/><circle r="9.8" fill="#ffffff"${pen(0.8)}/>`
    + `<path d="M0 .5Q2.6 -1.7 .2 -3.4Q-3.8 -4.1 -4.3 .2Q-4.3 5.5 .7 5.7Q6.9 5.3 6.7 -.7Q6.2 -7.4 -1 -7.6" fill="none"${pen(1.8, '#ef4444')}/>`;
  s += k.bar([[cu, cv, 20], [cu, cv, 25]], '#dba42b', 1.8, 0.6);
  s += k.billboard(cu, cv, 39, mark);
  // きらめき・リボン・花
  for (const [dx, dz, r] of [[-20, 50, 1], [19, 44, 0.8], [15, 57, 0.7], [-17, 30, 0.7]]) {
    const [x, y] = k.xy(cu, cv, dz);
    s += `<path transform="translate(${num(x + dx)} ${num(y)}) scale(${r})" d="M0 -3L.7 -.7L3 0L.7 .7L0 3L-.7 .7L-3 0L-.7 -.7Z" fill="#fff3a0"${pen(0.4, '#dba42b')}/>`;
  }
  s += k.flowers([[0.2, 1.56], [0.28, 1.62], [0.72, 1.62], [0.8, 1.56], [0.24, 0.44], [0.76, 0.44]], ['#ff8fb8', '#ffffff', '#ffd24a']);
  s += k.bush(0.16, 1.74, 0.8, { flowers: ['#ff8fb8', '#ffffff'] }) + k.bush(0.82, 1.75, 0.8, { flowers: ['#ffd24a', '#ffffff'] });
  return s;
}

// ── テレビ塔（赤と白の てっとう。とちゅうに 見はらし台） ──
function tvTower() {
  const k = lot(1, 2);
  const cu = 0.5; const cv = 1; const red = '#f2622e'; const white = '#fbf7ef';
  const leg = (su, sv, z) => { const t = z / 46; const half = 0.42 - (0.42 - 0.075) * Math.pow(t, 0.72); return [cu + su * half, cv + sv * half, z]; };
  const legLine = (su, sv) => Array.from({ length: 9 }, (_, i) => leg(su, sv, (46 * i) / 8));
  let s = '';
  s += k.pad(0.06, 0.5, 0.94, 1.5, PAVING, 0.9, PAVING_LINE);
  // 足もとの建物
  s += k.box(cu - 0.2, cv - 0.2, cu + 0.2, cv + 0.2, 0, 7, white, { se: '#ddd8cb' });
  s += k.glass(k.SW(cv + 0.2), cu - 0.14, cu + 0.14, 1.4, 5.6, 3) + k.glass(k.SE(cu + 0.2), cv - 0.14, cv + 0.14, 1.4, 5.6, 3);
  // 奥の足・ほね組み
  s += k.bar(legLine(-1, -1), red, 2, 0.6);
  const brace = (a, b, z0, z1) => k.seg([leg(a[0], a[1], z0), leg(b[0], b[1], z1)], red, 1.2) + k.seg([leg(b[0], b[1], z0), leg(a[0], a[1], z1)], red, 1.2);
  for (const [z0, z1] of [[4, 14], [14, 23], [23, 30]]) {
    s += brace([-1, -1], [1, -1], z0, z1) + brace([-1, -1], [-1, 1], z0, z1);
  }
  s += k.bar(legLine(1, -1), red, 2, 0.6) + k.bar(legLine(-1, 1), red, 2, 0.6);
  for (const [z0, z1] of [[4, 14], [14, 23], [23, 30]]) {
    s += brace([-1, 1], [1, 1], z0, z1) + brace([1, -1], [1, 1], z0, z1);
    s += k.seg([leg(-1, 1, z1), leg(1, 1, z1)], white, 1.3) + k.seg([leg(1, -1, z1), leg(1, 1, z1)], '#ddd8cb', 1.3);
  }
  s += k.bar(legLine(1, 1), red, 2, 0.6);
  // 見はらし台
  s += k.box(cu - 0.17, cv - 0.17, cu + 0.17, cv + 0.17, 30, 36.5, white, { se: '#ddd8cb' });
  s += k.glass(k.SW(cv + 0.17), cu - 0.15, cu + 0.15, 31.4, 35, 4) + k.glass(k.SE(cu + 0.17), cv - 0.15, cv + 0.15, 31.4, 35, 4);
  // 上の はしら（赤と白の しま）と アンテナ
  for (let i = 0; i < 6; i++) {
    const z = 46 + i * 7; const half = 0.07 - i * 0.008;
    s += k.box(cu - half, cv - half, cu + half, cv + half, z, z + 7, i % 2 ? white : red, { lw: 0.9 });
  }
  s += k.bar([[cu, cv, 88], [cu, cv, 101]], '#8a94a3', 0.9, 0.4) + k.dot(cu, cv, 102, 1.5, '#ff5a4d', 0.6);
  // 木
  s += k.tree(0.2, 1.72, 1) + k.tree(0.8, 1.72, 1) + k.bush(0.2, 0.3, 0.9) + k.bush(0.78, 0.3, 0.9);
  return s;
}

// ── 観覧車（色とりどりの ゴンドラ） ──
function ferrisWheel() {
  const k = lot(1, 2);
  const cu = 0.5; const cv = 1; const cz = 41; const r = 0.74; const rz = r * 49;
  const at = (a, f = 1, u = cu) => [u, cv + Math.cos(a) * r * f, cz + Math.sin(a) * rz * f];
  const ring = (f) => Array.from({ length: 49 }, (_, i) => at((i / 48) * Math.PI * 2, f));
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#facc15', '#f97316', '#6366f1'];
  let s = '';
  s += k.pad(0.05, 0.12, 0.95, 1.88, PAVING, 0.9, PAVING_LINE);
  // 台と きっぷ売り場
  s += k.box(0.24, 0.42, 0.76, 1.58, 0, 2.6, '#e3ded4', { lw: 1 });
  // 奥の ささえ
  s += k.bar([[0.34, 0.52, 2.6], [0.4, cv, cz]], '#8a94a3', 2, 0.7) + k.bar([[0.34, 1.48, 2.6], [0.4, cv, cz]], '#8a94a3', 2, 0.7);
  // わ・や
  for (let i = 0; i < 10; i++) s += k.seg([[cu, cv, cz], at((i / 10) * Math.PI * 2)], '#b8c2cc', 0.9);
  s += k.bar(ring(1), '#f6c93c', 1.6, 0.6) + k.seg(ring(0.84), '#f6c93c', 0.9) + k.seg(ring(0.46), '#b8c2cc', 0.8);
  // ゴンドラ
  for (let i = 0; i < 10; i++) {
    const p = at((i / 10) * Math.PI * 2 + 0.31);
    const [x, y] = k.xy(...p);
    s += `<path d="M${num(x)} ${num(y)}v2" fill="none"${pen(0.7)}/><path d="M${num(x - 3.4)} ${num(y + 2)}h6.8v4.4q0 1.6 -1.6 1.6h-3.6q-1.6 0 -1.6 -1.6z" fill="${colors[i]}"${pen(0.8)}/><path d="M${num(x - 2.4)} ${num(y + 3)}h4.8v2h-4.8z" fill="#dff4ff"/>`;
  }
  // 手前の ささえ と じく
  s += k.bar([[0.66, 0.52, 2.6], [0.6, cv, cz]], '#aab4c0', 2, 0.7) + k.bar([[0.66, 1.48, 2.6], [0.6, cv, cz]], '#aab4c0', 2, 0.7);
  s += k.bar([[0.4, cv, cz], [0.6, cv, cz]], '#5b6470', 2.4, 0.7) + k.dot(0.6, cv, cz, 3, '#ef4444', 0.9) + k.dot(0.6, cv, cz, 1.2, '#ffffff', 0);
  s += k.box(0.3, 1.62, 0.58, 1.82, 0, 8, '#fff4dc', { lw: 1 }) + k.hipRoof(0.3, 1.62, 0.58, 1.82, 8, 4.6, '#ef4444', { over: 0.04, drop: 0.3, plain: true });
  s += k.panel(k.SW(1.82), 0.36, 0.52, 3, 6.4, '#8fd3f7', 0.7);
  s += k.flag(0.82, 1.72, 0, 11, '#22c55e', { len: 5, hgt: 3.2 }) + k.flag(0.18, 1.72, 0, 11, '#f59e0b', { len: 5, hgt: 3.2 });
  return s;
}

// ── 公園（ふんすいの広場・池・あずまや・あそび場・木） ──
function park() {
  const k = lot(4, 5);
  const path = '#e9e2d6'; const water = '#66c8ee';
  let s = '';
  s += k.pad(0.04, 0.04, 3.96, 4.96, '#a8dd76', 0.9, '#6aa84a');
  // 小道（入口 → ふんすいの広場 → 池・あずまや・あそび場）
  s += k.pad(1.8, 2.9, 2.2, 4.96, path, 0.8, PAVING_LINE);
  s += k.pad(0.9, 2.3, 3.4, 2.62, path, 0.8, PAVING_LINE) + k.pad(1.84, 1.1, 2.16, 2.4, path, 0.8, PAVING_LINE);
  s += k.pad(2.9, 2.5, 3.2, 3.9, path, 0.8, PAVING_LINE);
  s += k.disc(2, 2.46, 0.1, 0.74, path, 0.8) ;
  // うしろの木（奥から）
  for (const [u, v, sz] of [[0.3, 0.3, 1.5], [1.2, 0.26, 1.35], [2.5, 0.22, 1.4], [3.6, 0.3, 1.5], [0.26, 1.2, 1.4], [3.7, 1.4, 1.35]]) s += k.tree(u, v, sz);
  s += k.fir(1.76, 0.4, 1.6) + k.fir(0.7, 0.7, 1.4);
  // 池（すいれん・小さな橋）
  s += k.disc(0.95, 1.5, 0.15, 0.62, '#d2cbbd', 1) + k.disc(0.95, 1.5, 0.2, 0.54, water, 0.8) + k.disc(0.88, 1.44, 0.2, 0.3, '#a3e3f8', 0);
  for (const [u, v] of [[0.7, 1.4], [1.1, 1.7], [1.2, 1.3]]) s += k.oval(u, v, 0.3, 3.4, 1.7, '#4fae5d', 0.6) + k.dot(u + 0.02, v, 1, 0.9, '#ff9ec4', 0);
  s += k.curve([0.62, 1.84, 0.4], [0.95, 1.84, 6], [1.28, 1.84, 0.4], '#c98a4b', 3, 0.7);
  // あずまや（右の奥）
  const g0 = 2.74; const g1 = 3.34; const gv0 = 1.1; const gv1 = 1.7; const gH = 13;
  s += k.shadow(g0, gv0, g1, gv1, 0.12);
  s += k.box(g0 - 0.05, gv0 - 0.05, g1 + 0.05, gv1 + 0.05, 0, 1.6, STONE, { lw: 1 });
  const post = (u, v) => k.bar([[u, v, 1.6], [u, v, gH]], '#a8683a', 1.6, 0.6);
  s += post(g0, gv0) + post(g1, gv0) + post(g0, gv1);
  s += k.box(g0 + 0.16, gv0 + 0.2, g1 - 0.16, gv0 + 0.32, 1.6, 4, '#c98a4b', { lw: 0.9 });
  s += post(g1, gv1);
  s += k.hipRoof(g0, gv0, g1, gv1, gH, 9, '#d9634a', { over: 0.1, drop: 0.5, cap: '#ffd24a' });
  // ふんすい（広場の まん中）
  s += k.cyl(2, 2.46, 0.3, 0.1, 2.6, '#d6dde6', { top: water, lw: 1.1 });
  s += k.cyl(2, 2.46, 0.07, 2.6, 7, '#d6dde6', { lw: 0.9 }) + k.disc(2, 2.46, 7, 0.15, water, 0.8);
  const [fx, fy] = k.xy(2, 2.46, 7);
  s += `<path d="M${num(fx)} ${num(fy)}q-.6 -8 0 -12.4q.6 4.4 0 12.4zM${num(fx - 1)} ${num(fy)}q-5 -7 -8.4 -3.4M${num(fx + 1)} ${num(fy)}q5 -7 8.4 -3.4" fill="#dff4ff"${pen(0.8, '#8fd3f7')}/>`;
  // 花だん（広場の まわり）
  for (const [u, v, c] of [[1.42, 2.02, '#ff8fb8'], [2.58, 2.02, '#ffd24a'], [1.42, 2.9, '#ffffff'], [2.58, 2.9, '#ff8a5c']]) {
    s += k.disc(u, v, 0.2, 0.2, '#6fc45a', 0.8) + k.flowers([[u - 0.08, v], [u + 0.06, v - 0.06], [u, v + 0.08], [u + 0.08, v + 0.06], [u - 0.04, v - 0.08]], [c, '#ffffff', c]);
  }
  // ベンチと あかり
  const bench = (u, v) => k.box(u, v, u + 0.3, v + 0.09, 0, 2.2, '#c98a4b', { lw: 0.9 }) + k.box(u, v, u + 0.3, v + 0.025, 2.2, 4.4, '#b07a45', { lw: 0.8 });
  s += bench(1.3, 3.5) + bench(2.4, 3.5);
  const lamp = (u, v) => k.bar([[u, v, 0], [u, v, 12]], '#5b6470', 1, 0.5) + k.dot(u, v, 13, 1.7, '#fff3c4', 0.6);
  s += lamp(1.7, 3.2) + lamp(2.3, 3.2) + lamp(1.7, 4.6) + lamp(2.3, 4.6);
  // あそび場（すな場・すべり台・ブランコ・ジャングルジム）
  s += k.pad(2.66, 3.0, 3.6, 4.3, '#ecdcb2', 0.8, '#c9b582');
  s += k.pad(2.76, 3.9, 3.14, 4.2, '#f7e6ad', 0.8, '#c9a66d') + k.dot(2.9, 4.04, 1, 1.5, '#ef4444', 0.5) + k.dot(3, 4.1, 0.8, 1.2, '#3b82f6', 0.5);
  // ブランコ
  s += k.seg([[2.8, 3.16, 0], [2.86, 3.26, 10], [2.92, 3.36, 0]], '#3b82f6', 1.3) + k.seg([[3.3, 3.16, 0], [3.36, 3.26, 10], [3.42, 3.36, 0]], '#3b82f6', 1.3);
  s += k.bar([[2.86, 3.26, 10], [3.36, 3.26, 10]], '#3b82f6', 1.2, 0.5);
  for (const u of [3.0, 3.2]) s += k.seg([[u, 3.26, 10], [u, 3.26, 3.4]], '#8a94a3', 0.6) + k.box(u - 0.04, 3.23, u + 0.04, 3.29, 2.8, 3.6, '#ef4444', { lw: 0.6 });
  // すべり台
  s += k.box(3.3, 3.74, 3.46, 3.9, 0, 8, '#f59e0b', { lw: 0.9 });
  s += k.poly([[3.3, 3.76, 8], [3.3, 3.88, 8], [2.94, 3.88, 0.6], [2.94, 3.76, 0.6]], '#ef4444', 0.9);
  s += k.seg([[3.46, 3.82, 0], [3.56, 3.82, 8]], '#8a94a3', 1);
  // 手前の木と 生けがき・門
  for (const [u, v, sz] of [[0.3, 2.6, 1.45], [0.3, 3.7, 1.4], [0.9, 4.5, 1.35], [3.7, 4.6, 1.4], [3.2, 4.7, 1.2]]) s += k.tree(u, v, sz);
  s += k.bush(1.2, 3.9, 1.1, { flowers: ['#ff8fb8', '#ffffff'] }) + k.bush(0.7, 3.2, 1) + k.bush(3.66, 2.4, 1, { flowers: ['#ffd24a'] });
  s += k.box(0.1, 4.84, 1.72, 4.94, 0, 3.4, '#3f9a4f', { se: '#2f7d3f', top: '#62bd62', lw: 1 });
  s += k.box(2.28, 4.84, 3.9, 4.94, 0, 3.4, '#3f9a4f', { se: '#2f7d3f', top: '#62bd62', lw: 1 });
  s += k.box(1.72, 4.82, 1.82, 4.96, 0, 6, STONE, { lw: 1 }) + k.box(2.18, 4.82, 2.28, 4.96, 0, 6, STONE, { lw: 1 });
  return s;
}

/** 絵の一覧。名前は buildings.jsx が artOf('…') で引く */
export const BUILDING_ART = {
  shop: { size: [1, 1], base: [0.76, 0.62], variants: SHOP_COLORS.length, draw: shop },
  wall: { size: [1, 1], base: [0.94, 0.94], draw: wall },
  fence: { size: [1, 1], base: [0.96, 0.1], draw: fence },
  mine: { size: [1, 1], base: [0.8, 0.66], draw: mine },
  torii: { size: [1, 1], base: [0.8, 0.14], draw: torii },
  dragon: { size: [1, 1], base: [0.6, 0.6], draw: dragon },
  bell_tower: { size: [1, 1], base: [0.6, 0.6], draw: bellTower },
  clock_tower: { size: [1, 1], base: [0.46, 0.46], draw: clockTower },
  festival_stage: { size: [1, 1], base: [0.52, 0.52], draw: festivalStage },
  house2: { size: [2, 1], base: [1.72, 0.62], variants: HOUSE_PALETTES.length, draw: house2 },
  house3: { size: [3, 2], base: [2.16, 0.92], shadow: 'own', variants: HOUSE_PALETTES.length, draw: house3 },
  factory: { size: [2, 1], base: [1.8, 0.7], shadow: 'own', draw: factory },
  hospital: { size: [2, 1], base: [1.8, 0.64], draw: hospital },
  fire_station: { size: [2, 1], base: [1.82, 0.62], draw: fireStation },
  golden_tower: { size: [1, 2], base: [0.86, 0.86], shadow: 'own', draw: goldenTower },
  crystal_tower: { size: [1, 2], base: [0.7, 0.7], draw: crystalTower },
  station: { size: [2, 2], base: [1.4, 0.74], shadow: 'own', draw: station },
  temple: { size: [2, 2], base: [1.44, 1.22], shadow: 'own', draw: temple },
  castle: { size: [2, 2], base: [1.5, 1.5], shadow: 'own', draw: () => castleArt(CASTLE_COLORS.castle) },
  gold_castle: { size: [2, 2], base: [1.5, 1.5], shadow: 'own', draw: () => castleArt(CASTLE_COLORS.gold_castle) },
  national_library: { size: [2, 2], base: [1.64, 1.34], shadow: 'own', draw: nationalLibrary },
  school: { size: [4, 4], base: [2.94, 0.9], shadow: 'own', draw: school },
  library: { size: [2, 1], base: [1.72, 0.66], draw: library },
  townhall: { size: [2, 1], base: [1.76, 0.62], draw: townhall },
  embassy: { size: [2, 1], base: [1.26, 0.54], shadow: 'own', draw: embassy },
  grand_smithy: { size: [2, 1], base: [1.74, 0.66], draw: grandSmithy },
  family_restaurant: { size: [2, 1], base: [1.76, 0.62], draw: familyRestaurant },
  cinema: { size: [2, 1], base: [1.76, 0.64], draw: cinema },
  watermill: { size: [2, 1], base: [1.18, 0.64], draw: watermill },
  hot_spring: { size: [2, 1], base: [0.96, 0.64], draw: hotSpring },
  philosophers_lab: { size: [2, 1], base: [0.66, 0.66], draw: philosophersLab },
  guardian_shrine: { size: [2, 1], base: [0.84, 0.52], shadow: 'own', draw: guardianShrine },
  pool: { size: [2, 1], base: [1.9, 0.9], shadow: 'none', draw: pool },
  hotel: { size: [1, 2], base: [0.76, 1.26], draw: hotel },
  office_building: { size: [1, 2], base: [0.72, 1.24], draw: officeBuilding },
  tower_apartment: { size: [1, 2], base: [0.72, 1.2], draw: towerApartment },
  grand_warehouse: { size: [1, 2], base: [0.76, 1.56], draw: grandWarehouse },
  monument: { size: [1, 2], base: [0.8, 0.8], shadow: 'own', draw: monument },
  observatory: { size: [1, 2], base: [0.76, 0.76], shadow: 'own', draw: observatory },
  perfect_monument: { size: [1, 2], base: [0.8, 0.8], shadow: 'own', draw: perfectMonument },
  tv_tower: { size: [1, 2], base: [0.72, 0.72], draw: tvTower },
  ferris_wheel: { size: [1, 2], base: [0.52, 1.16], draw: ferrisWheel },
  park: { size: [4, 5], base: [3.9, 4.9], shadow: 'own', draw: park },
};

export const BUILDING_ART_NAMES = Object.freeze(Object.keys(BUILDING_ART));

/** <defs> の中での id */
export const buildingArtId = (name, variant = 0) => `b-${name}-${variant}`;

/** 絵の中身（見本・テスト用）。無い名前・無い番号は null */
export function buildingArt(name, variant = 0) {
  const art = BUILDING_ART[name];
  if (!art || variant < 0 || variant >= (art.variants || 1)) return null;
  return art.draw(variant);
}

/** <defs> に入れる形（id つきの <g>）。無い名前は '' */
export function buildingArtDef(name, variant = 0) {
  const art = BUILDING_ART[name];
  const inner = buildingArt(name, variant);
  if (inner === null) return '';
  return lot(art.size[0], art.size[1]).wrap(inner, buildingArtId(name, variant));
}

export { INK, tone };
