// 自然物（木・桜・松・くさ・花壇・岩・ざっそう など）と、小さな かざり（かかし・こいのぼり・信号機）の絵のおおもと。
//
// 町に何十本も置かれるものなので、絵は文書に 1 回だけ置き（mountNatureArt）、
// 置いたマスでは <use> で呼びだす（1 本 2 要素）。以前は 1 本ごとに 16〜30 要素あった。
// 同じ種類でも、置いた場所（seed）で色や形が少し変わる。
//
// 座標は、ほかの建物の絵と同じ（viewBox "0 -100 100 200"・translate(50,100) scale(2.5)）。
// 原点はマスの手前の頂点で、マスのまん中は (0, -20)。木の根もとは、まん中に置く。
//
// ⚠️ ここで作る文字列は innerHTML に入れる。色と形は、すべてこのファイルの中の値から作る。

const f = (v) => String(Math.round(v * 100) / 100);
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"${extra}/>`;
const ellipse = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${extra}/>`;
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}"${extra}/>`;
const line = (color, width) => ` stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;

/**
 * もこもこした葉のかたまり。まず全部を ふちの色で少し大きく描き、その上に
 * 「かげ → 中間 → ひかり」の 3 色を、左上へ少しずつ ずらして重ねる（左上から光が当たる）。
 * @param {Array<[number, number, number, number?]>} list [cx, cy, rx, ry]（ry を省くと円）
 */
function foliage(list, pal, edge = 1.5) {
  let out = '';
  for (const [cx, cy, rx, ry = rx] of list) out += ellipse(cx, cy, rx + edge, ry + edge, pal.line);
  for (const [cx, cy, rx, ry = rx] of list) {
    out += ellipse(cx, cy, rx, ry, pal.dark)
      + ellipse(cx - rx * 0.16, cy - ry * 0.2, rx * 0.86, ry * 0.84, pal.mid)
      + ellipse(cx - rx * 0.34, cy - ry * 0.44, rx * 0.44, ry * 0.4, pal.light);
  }
  return out;
}

/** 幹（根もとが広がる）。base は根もとの y、top は葉に入る y */
function trunk(x, base, top, width, pal, lean = 0) {
  const w = width / 2;
  const d = `M${f(x - w - 1.6)} ${f(base)}Q${f(x - w)} ${f(base - 5)} ${f(x - w * 0.8 + lean * 0.5)} ${f((base + top) / 2)}L${f(x - w * 0.6 + lean)} ${f(top)}`
    + `L${f(x + w * 0.6 + lean)} ${f(top)}L${f(x + w * 0.8 + lean * 0.5)} ${f((base + top) / 2)}Q${f(x + w)} ${f(base - 5)} ${f(x + w + 1.6)} ${f(base)}Z`;
  const shade = `M${f(x + lean * 0.5)} ${f((base + top) / 2)}L${f(x + lean)} ${f(top)}L${f(x + w * 0.6 + lean)} ${f(top)}L${f(x + w * 0.8 + lean * 0.5)} ${f((base + top) / 2)}Q${f(x + w)} ${f(base - 5)} ${f(x + w + 1.6)} ${f(base)}L${f(x + 0.4)} ${f(base)}Z`;
  return path(d, pal.bark, line(pal.barkLine, 1.5)) + path(shade, pal.barkDark);
}

const BARK = { bark: '#9a6639', barkDark: '#754a28', barkLine: '#2b1a10' };
const DARK_BARK = { bark: '#77472e', barkDark: '#55301e', barkLine: '#24130c' };

// ── 木 ──
const TREE_PALETTES = [
  { light: '#9be37a', mid: '#5cc45c', dark: '#34994d', line: '#143d27' },
  { light: '#6fd597', mid: '#33ad72', dark: '#1f8358', line: '#0e3a2b' },
  { light: '#c6ea78', mid: '#93cf52', dark: '#66a83f', line: '#2a4c1b' },
];
const tree = (pal, fruit) => trunk(0, -19, -42, 5.4, BARK)
  + foliage([[-11.5, -46, 10.5], [11.5, -47, 10.5], [0, -60, 13], [-7, -39, 7.5], [8, -40, 7.5], [0.5, -49, 11.5]], pal)
  + ellipse(-5.5, -66, 2.2, 1.5, '#ffffff', ' opacity=".45"')
  + ellipse(8, -53, 1.6, 1.1, pal.light) + ellipse(-13, -51, 1.4, 1, pal.light) + ellipse(4, -42, 1.5, 1, pal.dark)
  + (fruit ? [[-9, -44], [6, -58], [10, -43], [-2, -52]].map(([x, y]) => circle(x, y, 2.1, fruit, line('#5a1414', 0.8)) + circle(x - 0.6, y - 0.7, 0.6, '#ffffff', ' opacity=".7"')).join('') : '');

// ── 桜 ──
const SAKURA_PALETTES = [
  { light: '#ffe3ee', mid: '#ffabcb', dark: '#ee74a6', line: '#7c1f49' },
  { light: '#fff3f7', mid: '#ffcfe0', dark: '#f39dbd', line: '#8a3559' },
  { light: '#ffc9df', mid: '#fb86b4', dark: '#dd4f8c', line: '#6d1640' },
];
const sakura = (pal) => [[-13, -17, 0], [9, -14, 1], [15, -22, 0], [-5, -10, 1]].map(([x, y, r]) => ellipse(x, y, 1.9, 1.1, r ? pal.mid : pal.light)).join('')
  + trunk(0, -19, -40, 6.2, DARK_BARK, 1.4)
  + path('M1.4 -34Q7 -40 12 -41M.6 -30Q-6 -37 -11 -38', 'none', line(DARK_BARK.barkLine, 2.6))
  + path('M1.4 -34Q7 -40 12 -41M.6 -30Q-6 -37 -11 -38', 'none', line(DARK_BARK.bark, 1.3))
  + foliage([[-13.5, -45, 11.5], [13.5, -46, 11.5], [1, -60, 14], [-7, -37, 8], [9, -38, 8], [1, -48, 12]], pal)
  + [[-15, -50], [-4, -63], [7, -56], [15, -43], [-8, -42], [3, -47], [10, -64], [-1, -55]].map(([x, y], i) => ellipse(x, y, 1.5, 1.1, i % 3 ? '#ffffff' : pal.light, ' opacity=".9"')).join('');

// ── 松 ──
const PINE_PALETTES = [
  { light: '#7cc98a', mid: '#3f9f68', dark: '#23744e', line: '#0f3324' },
  { light: '#8fce7a', mid: '#57a554', dark: '#337a40', line: '#173a1f' },
];
const pine = (pal) => path('M-5 -19Q-3.4 -24 -2.6 -30Q-1.6 -40 3 -47Q6.4 -53 5 -62L8.4 -62Q10 -52 6.6 -45Q3 -38 2.6 -30Q2.6 -24 5 -19Z', BARK.bark, line(BARK.barkLine, 1.5))
  + path('M1 -19Q.6 -26 1.6 -32Q2.4 -39 6 -45.6Q9.2 -52 8 -62L8.4 -62Q10 -52 6.6 -45Q3 -38 2.6 -30Q2.6 -24 5 -19Z', BARK.barkDark)
  + path('M-1 -36Q-7 -39 -11 -37M3.4 -45Q9 -47 13 -45', 'none', line(BARK.barkLine, 2.8)) + path('M-1 -36Q-7 -39 -11 -37M3.4 -45Q9 -47 13 -45', 'none', line(BARK.bark, 1.4))
  + foliage([[-12, -39, 10.5, 5.6], [12.5, -47, 11.5, 6], [-3, -56, 11, 5.8], [7, -65, 8.6, 5]], pal, 1.4)
  + [[-15, -41], [-8, -42], [9, -49], [16, -50], [-6, -58], [1, -59], [5, -67]].map(([x, y]) => path(`M${f(x)} ${f(y)}l-1.2 -2.4M${f(x + 1.6)} ${f(y - 0.2)}l.2 -2.6M${f(x + 3.2)} ${f(y)}l1.4 -2.2`, 'none', line(pal.light, 0.7))).join('');

// ── くさ ──
const GRASS_PALETTES = [
  { light: '#a8e57f', mid: '#66c458', dark: '#3d9a4a', line: '#17402a', bloom: '#ffffff' },
  { light: '#c9ec7c', mid: '#96cf52', dark: '#68a640', line: '#2a4c1b', bloom: '#fff3a0' },
];
const blade = (x, y, h, lean, w, fill, pal) => path(`M${f(x - w)} ${f(y)}Q${f(x - w * 0.6 + lean * 0.3)} ${f(y - h * 0.6)} ${f(x + lean)} ${f(y - h)}Q${f(x + w * 0.9 + lean * 0.4)} ${f(y - h * 0.5)} ${f(x + w)} ${f(y)}Z`, fill, line(pal.line, 1.1));
const grass = (pal) => blade(-8, -17, 13, -7, 2.6, pal.dark, pal) + blade(8.5, -17.5, 12, 7, 2.6, pal.dark, pal)
  + blade(-3.5, -16.5, 19, -3, 2.8, pal.mid, pal) + blade(4, -16.8, 17, 4, 2.8, pal.mid, pal)
  + blade(0, -15.8, 22, 0.6, 3, pal.light, pal) + blade(-11, -15.5, 8, -5, 2, pal.mid, pal) + blade(11.5, -15.8, 7.5, 5, 2, pal.light, pal)
  + [[-9, -31], [7.5, -30], [1, -39]].map(([x, y]) => circle(x, y, 1.6, pal.bloom, line(pal.line, 0.7))).join('');

// ── 花壇 ──
const FLOWER_PALETTES = [
  { blooms: ['#ff5d6c', '#ffd24a', '#ff8fb8'], center: '#fff6c9' },
  { blooms: ['#7aa8ff', '#ffffff', '#b78bff'], center: '#ffe27a' },
  { blooms: ['#ffa53d', '#fff06a', '#ff7b59'], center: '#7a4b22' },
];
const bloom = (x, y, r, color, center) => path(`M${f(x)} ${f(y)}V${f(y + 9)}`, 'none', line('#2f7a3c', 1.3))
  + ellipse(x - 2.4, y + 5.4, 2.4, 1.2, '#4fae53', ` transform="rotate(-28 ${f(x - 2.4)} ${f(y + 5.4)})"`)
  + [0, 72, 144, 216, 288].map((a) => {
    const rad = (a - 90) * Math.PI / 180;
    return circle(x + Math.cos(rad) * r * 0.62, y + Math.sin(rad) * r * 0.62, r * 0.56, color, line('#3a1a22', 0.7));
  }).join('')
  + circle(x, y, r * 0.42, center, line('#3a1a22', 0.6));
const flower = (pal) => path('M-21 -20L0 -9.5L0 -4.5L-21 -15Z', '#b9774a', line('#3b2314', 1.3)) + path('M21 -20L0 -9.5L0 -4.5L21 -15Z', '#935a30', line('#3b2314', 1.3))
  + path('M0 -30.5L21 -20L0 -9.5L-21 -20Z', '#d9a06c', line('#3b2314', 1.3)) + path('M0 -27.6L15.4 -20L0 -12.4L-15.4 -20Z', '#6f4b2e')
  + path('M-9 -21.5q2 -1.6 4 0M3 -17.5q2 -1.6 4 0M5 -23.5q2 -1.6 4 0', 'none', line('#8a6a45', 0.8))
  + bloom(0, -35, 4.6, pal.blooms[0], pal.center) + bloom(-9.5, -31, 4, pal.blooms[1], pal.center) + bloom(9.5, -30.5, 4, pal.blooms[2], pal.center)
  + bloom(-3.5, -26.5, 3.6, pal.blooms[2], pal.center) + bloom(5, -25.5, 3.6, pal.blooms[1], pal.center);

// ── 岩 ──
const ROCK_PALETTES = [
  { top: '#d5dbe3', left: '#a3adba', right: '#778392', line: '#262e38', moss: '#84c463' },
  { top: '#dccbb6', left: '#b09b83', right: '#86725d', line: '#30261c', moss: '#9bc55f' },
  { top: '#b4bdca', left: '#808b9b', right: '#596474', line: '#1e2530', moss: '#6fb56a' },
];
const rock = (pal) => path('M-17 -15L-14 -31L-4 -42L9 -39L18 -26L16 -14L4 -9L-9 -10Z', pal.left, line(pal.line, 1.6))
  + path('M-4 -42L9 -39L18 -26L16 -14L4 -9L2 -24Z', pal.right)
  + path('M-14 -31L-4 -42L9 -39L2 -24L-8 -26Z', pal.top)
  + path('M-14 -31L-8 -26L2 -24L4 -9M2 -24L9 -39', 'none', line(pal.line, 0.8) + ' opacity=".45"')
  + path('M-9 -36q4 -4.4 9 -4q-1 3 -4.4 4.6q-3 .8 -4.6 -.6Z', pal.moss) + path('M-12 -30q2.4 -1.6 4.4 -.4q-1.4 2 -4.4 .4Z', pal.moss)
  + path('M12 -12L13.6 -19L19 -20.6L23 -16L21.6 -11L16 -9.4Z', pal.left, line(pal.line, 1.3)) + path('M19 -20.6L23 -16L21.6 -11L16 -9.4L17.4 -15.6Z', pal.right)
  + blade(-15, -12, 8, -4, 1.8, '#66c458', { line: '#17402a' }) + blade(-11.5, -11.4, 6, 2.4, 1.6, '#96cf52', { line: '#17402a' });

// ── ざっそう ──
const weed = () => {
  const pal = { line: '#3b4a17' };
  return blade(-7, -17, 14, -8, 2.2, '#8fa83a', pal) + blade(7, -17, 13, 8, 2.2, '#7d9a34', pal) + blade(-2.5, -16.5, 19, -4, 2.4, '#a7bf45', pal)
    + blade(3, -16.6, 17, 5, 2.4, '#93ad3c', pal) + blade(0.4, -16, 12, 0, 2.2, '#bcd15a', pal)
    + path('M-6.5 -35l1.6 -3.4M2.6 -33.4l3 -3', 'none', line('#3b4a17', 1.1))
    + ellipse(-4.6, -39.6, 1.9, 2.6, '#e8d27a', line('#3b4a17', 0.8)) + ellipse(6.2, -37.4, 1.7, 2.3, '#e8d27a', line('#3b4a17', 0.8));
};

// ── 竹林 ──
const BAMBOO = { light: '#b8e986', mid: '#7fcf5c', dark: '#4fa24a', line: '#1c4a24', leaf: '#5cb85a', leafLight: '#9bdc74' };
const stalk = (x, base, h, w, lean) => {
  const top = base - h;
  const dx = lean;
  let out = path(`M${f(x - w)} ${f(base)}L${f(x - w + dx)} ${f(top)}L${f(x + w + dx)} ${f(top)}L${f(x + w)} ${f(base)}Z`, BAMBOO.mid, line(BAMBOO.line, 1.3))
    + path(`M${f(x - w)} ${f(base)}L${f(x - w + dx)} ${f(top)}L${f(x - w * 0.2 + dx)} ${f(top)}L${f(x - w * 0.2)} ${f(base)}Z`, BAMBOO.light)
    + path(`M${f(x + w * 0.45)} ${f(base)}L${f(x + w * 0.45 + dx)} ${f(top)}L${f(x + w + dx)} ${f(top)}L${f(x + w)} ${f(base)}Z`, BAMBOO.dark);
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    out += path(`M${f(x - w + dx * t)} ${f(base - h * t)}h${f(w * 2)}`, 'none', line(BAMBOO.line, 0.9));
  }
  return out;
};
const leaf = (x, y, len, angle, fill) => path(`M${f(x)} ${f(y)}q${f(len * 0.5)} ${f(-len * 0.32)} ${f(len)} 0q${f(-len * 0.5)} ${f(len * 0.2)} ${f(-len)} 0Z`, fill,
  `${line(BAMBOO.line, 0.8)} transform="rotate(${angle} ${f(x)} ${f(y)})"`);
const bamboo = () => stalk(-12, -22, 44, 2.3, -1.5) + stalk(11, -20, 40, 2.2, 1.2)
  + leaf(-13, -62, 11, -160, BAMBOO.leaf) + leaf(-13, -62, 10, -20, BAMBOO.leafLight) + leaf(12, -56, 11, -30, BAMBOO.leaf) + leaf(12, -56, 9, -150, BAMBOO.leafLight)
  + stalk(-4, -15, 54, 2.7, 0.8) + stalk(5, -17, 47, 2.5, -0.6)
  + leaf(-3.4, -66, 12, -35, BAMBOO.leafLight) + leaf(-3.4, -66, 12, -150, BAMBOO.leaf) + leaf(-3.6, -52, 10, -165, BAMBOO.leafLight)
  + leaf(4.6, -61, 11, -25, BAMBOO.leaf) + leaf(4.6, -61, 10, -140, BAMBOO.leafLight) + leaf(4.8, -46, 10, -15, BAMBOO.leaf)
  + leaf(-12.6, -48, 9, -170, BAMBOO.leaf) + leaf(11.4, -42, 9, -10, BAMBOO.leafLight)
  + blade(-16, -16, 7, -4, 1.7, '#66c458', { line: '#17402a' }) + blade(15, -15, 7, 4, 1.7, '#96cf52', { line: '#17402a' });

// ── もみじ・いちょう（木と同じ形で、秋の色。足もとに落ち葉） ──
const MAPLE_PALETTES = [
  { light: '#ffb07a', mid: '#f4683c', dark: '#cf3d2b', line: '#5c1712' },
  { light: '#ffd27a', mid: '#f79a34', dark: '#d96a1e', line: '#5e2a0c' },
];
const GINKGO_PALETTES = [
  { light: '#fff3a0', mid: '#ffd84a', dark: '#eaa91f', line: '#6b4a0a' },
];
const fallen = (pal) => [[-12, -16, 20], [10, -13, -30], [16, -21, 50], [-4, -10, 0]].map(([x, y, a], i) => ellipse(x, y, 2, 1.1, i % 2 ? pal.mid : pal.light, ` transform="rotate(${a} ${f(x)} ${f(y)})"`)).join('');
const maple = (pal) => fallen(pal) + trunk(0, -19, -42, 5.2, DARK_BARK, 0.8)
  + foliage([[-12, -45, 10.5], [12, -46, 10.5], [0, -59, 13], [-7, -38, 7.5], [8, -39, 7.5], [0.5, -48, 11.5]], pal)
  + [[-13, -49], [-3, -62], [8, -55], [13, -42], [-7, -41], [3, -46]].map(([x, y]) => path(`M${f(x)} ${f(y - 1.6)}l.9 1.1 1.3-.4-.5 1.3 1 .9-1.3.3-.1 1.4-1.3-.7-1.3.7-.1-1.4-1.3-.3 1-.9-.5-1.3 1.3.4z`, pal.light, ' opacity=".85"')).join('');
const ginkgo = (pal) => fallen(pal) + trunk(0, -19, -40, 4.8, BARK)
  + foliage([[-8.5, -43, 8.5], [8.5, -44, 8.5], [0, -54, 10.5], [0, -66, 8.5], [-5, -37, 6], [5.5, -38, 6], [0, -46, 9.5]], pal)
  + ellipse(-3.6, -70, 1.8, 1.2, '#ffffff', ' opacity=".5"');

// ── ヤシの木 ──
const PALM = { light: '#9be37a', mid: '#4fbf5a', dark: '#2f8f4a', line: '#143d27' };
const frond = (angle, len, fill) => path(`M0 -58q${f(len * 0.5)} ${f(-len * 0.34)} ${f(len)} ${f(len * 0.1)}q${f(-len * 0.5)} ${f(-len * 0.08)} ${f(-len)} ${f(len * 0.02)}Z`, fill,
  `${line(PALM.line, 1.2)} transform="rotate(${angle} 0 -58)"`);
const palm = () => ellipse(4, -17, 5, 2.2, '#e8cf8a')
  + path('M-3.4 -19Q-1 -34 1.6 -44Q3.4 -52 1.4 -58L4.6 -58Q7 -51 5 -43Q2.6 -33 3.2 -19Z', '#c79a5e', line('#3b2a14', 1.4))
  + path('M-2 -26h5M-.6 -33h4.6M1 -40h4.4M2.2 -47h4', 'none', line('#7a5a2e', 0.9))
  + frond(-168, 21, PALM.dark) + frond(-12, 21, PALM.dark) + frond(-140, 22, PALM.mid) + frond(-40, 22, PALM.mid)
  + frond(-105, 20, PALM.light) + frond(-72, 20, PALM.light) + frond(162, 17, PALM.mid) + frond(18, 17, PALM.mid)
  + circle(-1.6, -56, 2.2, '#8a5a33', line('#3b2a14', 0.8)) + circle(2.6, -55.4, 2.2, '#9a6639', line('#3b2a14', 0.8));

// ── ひまわり ──
const sunflowerHead = (x, y, r) => path(`M${f(x)} ${f(y + r * 0.6)}V${f(-16)}`, 'none', line('#2f7a3c', 1.6))
  + ellipse(x - 3, (y - 16) / 2 + 2, 3.4, 1.7, '#4fae53', `${line('#17402a', 0.7)} transform="rotate(-30 ${f(x - 3)} ${f((y - 16) / 2 + 2)})"`)
  + ellipse(x + 3, (y - 16) / 2 - 2, 3.4, 1.7, '#66c458', `${line('#17402a', 0.7)} transform="rotate(30 ${f(x + 3)} ${f((y - 16) / 2 - 2)})"`)
  + [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
    const rad = a * Math.PI / 180;
    return ellipse(x + Math.cos(rad) * r * 0.82, y + Math.sin(rad) * r * 0.82, r * 0.5, r * 0.32, '#ffd23a', `${line('#7a4b06', 0.6)} transform="rotate(${a} ${f(x + Math.cos(rad) * r * 0.82)} ${f(y + Math.sin(rad) * r * 0.82)})"`);
  }).join('')
  + circle(x, y, r * 0.56, '#7a4b22', line('#3b2314', 0.8)) + circle(x - r * 0.14, y - r * 0.16, r * 0.2, '#a36a34');
const sunflower = () => sunflowerHead(-9, -40, 6) + sunflowerHead(8.5, -37, 5.6) + sunflowerHead(0, -50, 6.8)
  + blade(-13, -15.5, 7, -4, 1.7, '#66c458', { line: '#17402a' }) + blade(12.5, -15.6, 7, 4, 1.7, '#96cf52', { line: '#17402a' });

// ── しげみ ──
const BUSH_PALETTES = [TREE_PALETTES[0], TREE_PALETTES[1]];
const bushArt = (pal, berry) => foliage([[-9, -22, 8.5, 7], [9, -22.5, 8.5, 7], [0, -27, 10.5, 8.5], [0, -20, 9, 6]], pal, 1.4)
  + (berry ? [[-8, -24], [3, -30], [9, -21], [-1, -21]].map(([x, y]) => circle(x, y, 1.5, berry, line('#5a1414', 0.6))).join('') : '');

// ── かかし ──
const scarecrow = () => path('M0 -18V-50', 'none', line('#3b2314', 3.2)) + path('M0 -18V-50', 'none', line('#a9744a', 1.8))
  + path('M-13 -40H13', 'none', line('#3b2314', 3)) + path('M-13 -40H13', 'none', line('#a9744a', 1.6))
  + path('M-9 -44L9 -44L7 -28L-7 -28Z', '#4f8fe0', line('#1c2f57', 1.2)) + path('M0 -44L9 -44L7 -28L0 -28Z', '#3a74c2')
  + path('M-13 -41.6l-3.4 -1.6M-13 -38.4l-3.4 1.6M13 -41.6l3.4 -1.6M13 -38.4l3.4 1.6M-5 -28l-1.6 4M0 -28v4.4M5 -28l1.6 4', 'none', line('#e3c15a', 1.2))
  + circle(0, -50.5, 6.2, '#f4dfb0', line('#3b2314', 1.2)) + path('M-2.4 -51.4h.1M2.4 -51.4h.1', 'none', line('#3b2314', 1.6)) + path('M-2 -48q2 1.8 4 0', 'none', line('#3b2314', 0.9))
  + path('M-10.5 -54.5Q0 -51.5 10.5 -54.5L5.4 -57.4Q0 -66 -5.4 -57.4Z', '#e3c15a', line('#6b4a0a', 1.2)) + path('M-5 -57.6Q0 -55.8 5 -57.6', 'none', line('#c2413b', 1.6));

// ── こいのぼり ──
const carp = (y, len, body, belly) => path(`M1.4 ${f(y)}Q${f(len * 0.5)} ${f(y - 5.4)} ${f(len)} ${f(y - 2.4)}L${f(len + 4.6)} ${f(y - 5.6)}L${f(len + 3.4)} ${f(y)}L${f(len + 4.6)} ${f(y + 5.6)}L${f(len)} ${f(y + 2.4)}Q${f(len * 0.5)} ${f(y + 5.4)} 1.4 ${f(y)}Z`, body, line('#2b211c', 1.1))
  + path(`M1.4 ${f(y)}Q${f(len * 0.5)} ${f(y + 5.4)} ${f(len)} ${f(y + 2.4)}L${f(len)} ${f(y)}Z`, belly)
  + circle(5.2, y - 0.8, 1.7, '#ffffff', line('#2b211c', 0.7)) + circle(5.4, y - 0.8, 0.7, '#2b211c')
  + path(`M${f(len * 0.42)} ${f(y - 2.6)}q2 2.6 0 5.2M${f(len * 0.64)} ${f(y - 2.4)}q1.8 2.4 0 4.8`, 'none', line('#ffffff', 0.8) + ' opacity=".8"');
const koinobori = () => path('M0 -17V-78', 'none', line('#2b211c', 3)) + path('M0 -17V-78', 'none', line('#d7dbe2', 1.6))
  + circle(0, -79.5, 2.4, '#ffd24a', line('#6b4a0a', 0.9))
  + path('M1 -75l11 -3 3 2.6 -4 1.2 3.6 2 -4.2 .8Z', '#ff8fb8', line('#2b211c', 0.8))
  + carp(-66, 21, '#2b2f3a', '#565d6d') + carp(-54, 18, '#e5484d', '#ff9a8a') + carp(-43, 15, '#3b82f6', '#9cc4ff');

// ── 信号機 ──
const trafficLight = () => path('M0 -17V-56', 'none', line('#1f2733', 3.4)) + path('M0 -17V-56', 'none', line('#8d98a6', 1.9))
  + ellipse(0, -17.4, 3.6, 1.7, '#5c6573', line('#1f2733', 0.9))
  + path('M-5.4 -72h10.8q2 0 2 2v15q0 2 -2 2h-10.8q-2 0 -2 -2v-15q0 -2 2 -2Z', '#39424f', line('#141a22', 1.3))
  + path('M0 -72h5.4q2 0 2 2v15q0 2 -2 2H0Z', '#2a323d')
  + circle(0, -67.6, 2.9, '#3ddc6f', line('#141a22', 0.8)) + circle(0, -62.5, 2.9, '#ffd23a', line('#141a22', 0.8)) + circle(0, -57.4, 2.9, '#ff5a52', line('#141a22', 0.8))
  + circle(-0.9, -68.5, 0.9, '#ffffff', ' opacity=".7"') + circle(-0.9, -63.4, 0.9, '#ffffff', ' opacity=".7"') + circle(-0.9, -58.3, 0.9, '#ffffff', ' opacity=".7"');

// ── 桜並木（小道の両がわに立つ、小さな桜 2 本。足もとの小道は地面のレイヤーが描く） ──
const cherryRoad = (pal) => `<g transform="translate(-23 -9.4) scale(.56)">${sakura(pal)}</g><g transform="translate(23 -9.4) scale(.56)">${sakura(pal)}</g>`;

/** 絵の名前 → 中身。名前は `${種類}-${番号}` */
const ART = {};
TREE_PALETTES.forEach((pal, i) => { ART[`tree-${i}`] = tree(pal, null); });
ART['tree-3'] = tree(TREE_PALETTES[0], '#f0483e');
ART['tree-4'] = tree(TREE_PALETTES[1], '#ffa62b');
SAKURA_PALETTES.forEach((pal, i) => { ART[`sakura-${i}`] = sakura(pal); });
PINE_PALETTES.forEach((pal, i) => { ART[`pine-${i}`] = pine(pal); });
GRASS_PALETTES.forEach((pal, i) => { ART[`grass-${i}`] = grass(pal); });
FLOWER_PALETTES.forEach((pal, i) => { ART[`flower-${i}`] = flower(pal); });
ROCK_PALETTES.forEach((pal, i) => { ART[`rock-${i}`] = rock(pal); });
ART['weed-0'] = weed();
ART['bamboo-0'] = bamboo();
MAPLE_PALETTES.forEach((pal, i) => { ART[`maple-${i}`] = maple(pal); });
GINKGO_PALETTES.forEach((pal, i) => { ART[`ginkgo-${i}`] = ginkgo(pal); });
ART['palm-0'] = palm();
ART['sunflower-0'] = sunflower();
ART['bush-0'] = bushArt(BUSH_PALETTES[0], null);
ART['bush-1'] = bushArt(BUSH_PALETTES[1], '#f0483e');
ART['scarecrow-0'] = scarecrow();
ART['koinobori-0'] = koinobori();
ART['signal-0'] = trafficLight();
ART['cherryroad-0'] = cherryRoad(SAKURA_PALETTES[0]);
ART['cherryroad-1'] = cherryRoad(SAKURA_PALETTES[1]);

/** 種類ごとの絵の数（seed からえらぶ） */
export const NATURE_VARIANTS = Object.freeze({
  tree: 5, sakura: 3, pine: 2, grass: 2, flower: 3, rock: 3, weed: 1, bamboo: 1, cherryroad: 2,
  maple: 2, ginkgo: 1, palm: 1, sunflower: 1, bush: 2, scarecrow: 1, koinobori: 1, signal: 1,
});

/** そのまま <defs> に入れられる形にする */
export const natureArtMarkup = () => Object.entries(ART)
  .map(([name, body]) => `<g id="nat-${name}" transform="translate(50 100) scale(2.5)">${body}</g>`)
  .join('');

/** 画面で確かめるために、絵の中身を名前で引く（テスト・見本用） */
export const natureArt = (name) => ART[name] || null;
