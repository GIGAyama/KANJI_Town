// 「小さな家」の絵のおおもと。
//
// いちばん最初から持っていて、町にいちばん多く建つ建物。木と同じく、絵は文書に 1 回だけ
// 置き（shared.jsx の mountSharedDefs）、置いたマスでは <use> で呼びだす（1 軒 2 要素）。
// 屋根と壁の色は 8 通りあり、置いた場所（seed）で決まる。
//
// 座標は、ほかの建物の絵と同じ（viewBox "0 -100 100 200"・translate(50,100) scale(2.5)）。
// 原点はマスの手前の頂点。マスは 幅 80・高さ 40 のひし形で、(u, v, z) で場所を指す
// （u は右手前へ、v は左手前へ 0→1、z は高さ）。
//
// ⚠️ ここで作る文字列は innerHTML に入れる。色と形は、すべてこのファイルの中の値から作る。

import { flattenOpacity } from './flatten-opacity.js';

const f = (v) => String(Math.round(v * 100) / 100);
const P = (u, v, z = 0) => `${f((u - v) * 40)} ${f(-40 + (u + v) * 20 - z)}`;
const INK = '#2b211c';
const line = (width = 1.3, color = INK) => ` stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;
const poly = (points, fill, extra = '') => `<path d="M${points.map((p) => P(...p)).join('L')}Z" fill="${fill}"${extra}/>`;
const seg = (points, color, width, extra = '') => `<path d="M${points.map((p) => P(...p)).join('L')}" fill="none"${line(width, color)}${extra}/>`;

/** 色を明るく（amt > 0）・暗く（amt < 0）する */
const tone = (hex, amt) => {
  const v = parseInt(hex.slice(1), 16);
  const ch = (shift) => {
    const c = (v >> shift) & 255;
    return Math.max(0, Math.min(255, Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt))));
  };
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};

export const HOUSE_PALETTES = [
  { wallSW: '#fdf8f6', wallSE: '#e7e5e4', baseSW: '#a8a29e', baseSE: '#78716c', roofL: '#ef4444', roofD: '#b91c1c' }, // Classic Red
  { wallSW: '#f8fafc', wallSE: '#e2e8f0', baseSW: '#94a3b8', baseSE: '#64748b', roofL: '#3b82f6', roofD: '#1d4ed8' }, // Slate Blue
  { wallSW: '#fef3c7', wallSE: '#fde68a', baseSW: '#fbbf24', baseSE: '#f59e0b', roofL: '#22c55e', roofD: '#15803d' }, // Forest Green
  { wallSW: '#f5f5f4', wallSE: '#d6d3d1', baseSW: '#57534e', baseSE: '#44403c', roofL: '#475569', roofD: '#1e293b' }, // Dark Modern
  { wallSW: '#fdf2f8', wallSE: '#fbcfe8', baseSW: '#f472b6', baseSE: '#db2777', roofL: '#ec4899', roofD: '#be185d' }, // Pink Pop
  { wallSW: '#ecfdf5', wallSE: '#a7f3d0', baseSW: '#6ee7b7', baseSE: '#34d399', roofL: '#f59e0b', roofD: '#b45309' }, // Mint Orange
  { wallSW: '#f5f3ff', wallSE: '#ddd6fe', baseSW: '#c4b5fd', baseSE: '#a78bfa', roofL: '#a855f7', roofD: '#7e22ce' }, // Lavender
  { wallSW: '#ffedd5', wallSE: '#fed7aa', baseSW: '#fdba74', baseSE: '#f97316', roofL: '#0ea5e9', roofD: '#0369a1' }, // Warm Cyan
];

/** 窓（わく・ガラス・十字のさん）。face='sw' は左手前の壁（v 一定）、'se' は右手前の壁（u 一定） */
function windowOn(face, at, from, to, z0, z1) {
  const pt = (t, z) => (face === 'sw' ? [t, at, z] : [at, t, z]);
  const mid = (from + to) / 2;
  const inset = (to - from) * 0.14;
  return poly([pt(from, z0), pt(to, z0), pt(to, z1), pt(from, z1)], '#ffffff', line(1.1))
    + poly([pt(from + inset, z0 + 0.9), pt(to - inset, z0 + 0.9), pt(to - inset, z1 - 0.9), pt(from + inset, z1 - 0.9)], '#8fd3f7')
    + poly([pt(from + inset, z1 - 0.9), pt(mid, z1 - 0.9), pt(from + inset, (z0 + z1) / 2)], '#d6f1ff')
    + seg([pt(mid, z0 + 0.6), pt(mid, z1 - 0.6)], INK, 0.7) + seg([pt(from + inset * 0.6, (z0 + z1) / 2), pt(to - inset * 0.6, (z0 + z1) / 2)], INK, 0.7);
}

function house(pal) {
  const u0 = 0.17; const u1 = 0.83; const v0 = 0.2; const v1 = 0.8;
  const vm = (v0 + v1) / 2;
  const wallH = 15.5; const ridgeH = 31; const eave = 0.045; const eaveZ = wallH - 1.2;
  const roofLite = tone(pal.roofL, 0.22);
  const roofLine = tone(pal.roofD, -0.25);
  let out = '';

  // 玄関の前の ふみ石
  out += `<ellipse cx="${f((0.64 - 0.94) * 40)}" cy="${f(-40 + (0.64 + 0.94) * 20)}" rx="3.6" ry="1.8" fill="#e6dfd4"${line(0.9, '#8a8175')}/>`;

  // 壁（左手前 = 明るい面、右手前 = 妻の面）
  out += poly([[u0, v1, 0], [u1, v1, 0], [u1, v1, wallH], [u0, v1, wallH]], pal.wallSW, line())
    + poly([[u1, v1, 0], [u1, v0, 0], [u1, v0, wallH], [u1, vm, ridgeH], [u1, v1, wallH]], pal.wallSE, line());
  // 土台
  out += poly([[u0, v1, 0], [u1, v1, 0], [u1, v1, 2.4], [u0, v1, 2.4]], pal.baseSW, line(1.1))
    + poly([[u1, v1, 0], [u1, v0, 0], [u1, v0, 2.4], [u1, v1, 2.4]], pal.baseSE, line(1.1));
  // のき下の かげ
  out += poly([[u0, v1, wallH - 3.4], [u1, v1, wallH - 3.4], [u1, v1, wallH], [u0, v1, wallH]], tone(pal.wallSW, -0.16), ' opacity=".7"')
    + poly([[u1, v1, wallH - 2.4], [u1, vm, ridgeH - 3.6], [u1, v0, wallH - 2.4], [u1, v0, wallH], [u1, vm, ridgeH], [u1, v1, wallH]], tone(pal.wallSE, -0.16), ' opacity=".7"');

  // 玄関（ドア・のぞき窓・とって・ふみ台）
  out += poly([[0.54, v1 + 0.085, 0], [0.76, v1 + 0.085, 0], [0.76, v1 + 0.085, 1.3], [0.54, v1 + 0.085, 1.3]], '#bdb4a6', line(1))
    + poly([[0.54, v1, 1.3], [0.76, v1, 1.3], [0.76, v1 + 0.085, 1.3], [0.54, v1 + 0.085, 1.3]], '#ddd6ca', line(1));
  out += poly([[0.565, v1, 1.3], [0.735, v1, 1.3], [0.735, v1, 12.2], [0.565, v1, 12.2]], '#ffffff', line(1.1))
    + poly([[0.585, v1, 1.3], [0.715, v1, 1.3], [0.715, v1, 11.4], [0.585, v1, 11.4]], '#c9793a', line(0.9))
    + poly([[0.585, v1, 1.3], [0.65, v1, 1.3], [0.65, v1, 11.4], [0.585, v1, 11.4]], '#dc9150')
    + poly([[0.61, v1, 7.4], [0.69, v1, 7.4], [0.69, v1, 10.2], [0.61, v1, 10.2]], '#bfe6fb', line(0.7))
    + `<circle cx="${f((0.695 - v1) * 40)}" cy="${f(-40 + (0.695 + v1) * 20 - 5.6)}" r="0.9" fill="#ffd24a"${line(0.5)}/>`;

  // 窓と、その下の花の箱
  out += windowOn('sw', v1, 0.25, 0.45, 5.6, 12.2);
  out += poly([[0.235, v1 + 0.03, 3.4], [0.465, v1 + 0.03, 3.4], [0.465, v1 + 0.03, 5.5], [0.235, v1 + 0.03, 5.5]], '#a9683a', line(0.9));
  for (const [t, color] of [[0.27, '#ff6b81'], [0.32, '#ffd24a'], [0.37, '#ff8fb8'], [0.42, '#ffffff']]) {
    out += `<circle cx="${f((t - v1 - 0.03) * 40)}" cy="${f(-40 + (t + v1 + 0.03) * 20 - 6.4)}" r="1.35" fill="${color}"${line(0.5)}/>`;
  }
  out += seg([[0.25, v1 + 0.03, 5.6], [0.45, v1 + 0.03, 5.6]], '#4fae53', 1.6);
  out += windowOn('se', u1, 0.4, 0.6, 5.6, 12.2);
  // 屋根うらの丸窓
  const ring = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ring.push([u1, vm + Math.cos(a) * 0.055, 21 + Math.sin(a) * 2.5]);
  }
  out += poly(ring, '#8fd3f7', line(1, INK));

  // 屋根（左手前の大きな面）。むねに近いほど明るく、のきに近いほど暗く
  const slope = (t, u) => [u, vm + (v1 + eave - vm) * t, ridgeH + (eaveZ - ridgeH) * t];
  const ua = u0 - eave; const ub = u1 + eave;
  out += poly([slope(0, ua), slope(0, ub), slope(1, ub), slope(1, ua)], pal.roofL, line());
  out += poly([slope(0, ua), slope(0, ub), slope(0.26, ub), slope(0.26, ua)], roofLite)
    + poly([slope(0.8, ua), slope(0.8, ub), slope(1, ub), slope(1, ua)], tone(pal.roofL, -0.12));
  // かわらの段と、たがいちがいの つぎ目
  for (const t of [0.26, 0.52, 0.78]) out += seg([slope(t, ua), slope(t, ub)], roofLine, 0.8, ' opacity=".75"');
  [0, 0.26, 0.52, 0.78].forEach((t, row) => {
    const next = Math.min(1, t + 0.26);
    for (let i = 0; i < 5; i++) {
      const u = ua + (ub - ua) * ((i + (row % 2 ? 0.5 : 0)) / 5 + 0.1);
      if (u >= ub - 0.02) continue;
      out += seg([slope(t, u), slope(next, u)], roofLine, 0.6, ' opacity=".45"');
    }
  });
  out += poly([slope(0, ua), slope(0, ub), slope(1, ub), slope(1, ua)], 'none', line());
  // のきの厚みと、右手前の はふ（屋根の切り口）
  out += poly([slope(1, ua), slope(1, ub), [ub, v1 + eave, eaveZ - 1.9], [ua, v1 + eave, eaveZ - 1.9]], pal.roofD, line(1.1));
  out += poly([[ub, v1 + eave, eaveZ], [ub, vm, ridgeH], [ub, v0 - eave, eaveZ], [ub, v0 - eave, eaveZ - 2.2], [ub, vm, ridgeH - 2.9], [ub, v1 + eave, eaveZ - 2.2]], pal.roofD, line(1.1));
  // むね
  out += seg([[ua, vm, ridgeH], [ub, vm, ridgeH]], INK, 3.2) + seg([[ua, vm, ridgeH], [ub, vm, ridgeH]], pal.roofD, 1.8);

  // えんとつ と けむり
  const cu = 0.3; const cv = 0.44; const cz0 = 23; const cz1 = 35;
  out += poly([[cu, cv + 0.1, cz0], [cu + 0.1, cv + 0.1, cz0 + 1.6], [cu + 0.1, cv + 0.1, cz1], [cu, cv + 0.1, cz1]], pal.baseSW, line(1.1))
    + poly([[cu + 0.1, cv + 0.1, cz0 + 1.6], [cu + 0.1, cv, cz0 + 3.6], [cu + 0.1, cv, cz1], [cu + 0.1, cv + 0.1, cz1]], pal.baseSE, line(1.1))
    + poly([[cu - 0.015, cv + 0.115, cz1], [cu + 0.115, cv + 0.115, cz1], [cu + 0.115, cv - 0.015, cz1], [cu - 0.015, cv - 0.015, cz1]], tone(pal.baseSW, 0.25), line(1.1));
  const [sx, sy] = P(cu + 0.05, cv + 0.05, cz1 + 4).split(' ').map(Number);
  out += `<circle cx="${f(sx + 1)}" cy="${f(sy)}" r="2.3" fill="#ffffff" opacity=".85"/><circle cx="${f(sx + 3.4)}" cy="${f(sy - 4.4)}" r="3" fill="#ffffff" opacity=".7"/><circle cx="${f(sx + 1.4)}" cy="${f(sy - 9.6)}" r="2.2" fill="#ffffff" opacity=".5"/>`;

  // しげみ（左手前の かど）
  const [bx, by] = P(0.2, 0.9, 0).split(' ').map(Number);
  out += `<ellipse cx="${f(bx)}" cy="${f(by - 3)}" rx="6.6" ry="5" fill="#17402a"/><ellipse cx="${f(bx + 5.2)}" cy="${f(by - 1.6)}" rx="4.6" ry="3.6" fill="#17402a"/>`
    + `<ellipse cx="${f(bx)}" cy="${f(by - 3)}" rx="5.4" ry="3.9" fill="#34994d"/><ellipse cx="${f(bx + 5.2)}" cy="${f(by - 1.6)}" rx="3.5" ry="2.6" fill="#34994d"/>`
    + `<ellipse cx="${f(bx - 1)}" cy="${f(by - 3.9)}" rx="4.2" ry="2.8" fill="#5cc45c"/><ellipse cx="${f(bx + 4.6)}" cy="${f(by - 2.2)}" rx="2.5" ry="1.7" fill="#5cc45c"/>`
    + `<ellipse cx="${f(bx - 2.2)}" cy="${f(by - 5)}" rx="1.9" ry="1.2" fill="#9be37a"/>`
    + `<circle cx="${f(bx + 1.6)}" cy="${f(by - 2.6)}" r="1" fill="#fff3a0"/><circle cx="${f(bx - 3)}" cy="${f(by - 2.4)}" r="1" fill="#ff8fb8"/>`;
  return out;
}

/** そのまま <defs> に入れられる形にする（id は house1-0 〜 house1-7） */
export const houseArtMarkup = () => HOUSE_PALETTES
  .map((pal, i) => `<g id="house1-${i}" transform="translate(50 100) scale(2.5)">${flattenOpacity(house(pal))}</g>`)
  .join('');

/** 画面で確かめるために、絵の中身を番号で引く（見本用） */
export const houseArt = (index) => flattenOpacity(house(HOUSE_PALETTES[index % HOUSE_PALETTES.length]));
