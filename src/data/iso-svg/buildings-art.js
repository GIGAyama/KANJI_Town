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
