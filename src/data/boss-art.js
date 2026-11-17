// ボスバトルのボスの絵 — マイ漢字タウン
// React に依存しない（components/training/BossBattleView.jsx が使い、test/ から確かめる）。
//
// 町の建物・住民と同じ絵がら（こげ茶の線・左上からの光で明暗）で描いた 4 体。
//   ghost   … けしけしおばけ（消しゴムで 字を消してしまう）
//   octopus … スミダコだいおう（すみを はいて 字を かくす）
//   oni     … バツバツおに（何にでも バツを つける）
//   dragon  … まっくろりゅうおう（おぼえた字を 黒い ほのおで やく）
// ボスごとに 表情が 6 つある（idle ふつう・smug にやり・hurt いたい・angry いかり・attack こうげき・down やられた）。
//
// 座標: 原点は「足もとのまん中の地面」。x は右、y は下（上は負）。枠は BOSS_ART_BOX。
// ⚠️ フィルター（ぼかし・光）は使わない。前の おばけは filter で光らせていて、動かすたびに 描きなおしが重かった。
// ⚠️ ここで作る文字列は innerHTML に入れる。色と形は、すべて このファイルの中の値から作る（外から来た文字を入れない）。

const INK = '#2b211c';
const WHITE = '#ffffff';
const f = (v) => String(Math.round(v * 10) / 10);
const pen = (width = 2.6, color = INK) => ` stroke="${color}" stroke-width="${f(width)}" stroke-linejoin="round" stroke-linecap="round"`;
const soft = (opacity) => ` fill-opacity="${opacity}"`;
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}"${extra}/>`;
const line = (d, width = 2.6, color = INK) => path(d, 'none', pen(width, color));
const ellipse = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${extra}/>`;
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"${extra}/>`;
const group = (inner, transform) => `<g transform="${transform}">${inner}</g>`;
/** 左右に 1 つずつ（s = -1 が 見る人の左、+1 が右） */
const both = (draw) => draw(-1) + draw(1);

/** ボスの絵の枠（viewBox）。どのボスも この中に収まる */
export const BOSS_ART_BOX = Object.freeze({ x: -124, y: -214, width: 248, height: 232 });
export const BOSS_ART_IDS = Object.freeze(['ghost', 'octopus', 'oni', 'dragon']);
export const BOSS_MOODS = Object.freeze(['idle', 'smug', 'hurt', 'angry', 'attack', 'down']);

// ── 太さの変わる線（しょくしゅ・しっぽ・つの） ──

/** 3 次ベジェ曲線を つないだ線の上の点。pts は [始点, 制御点 1, 制御点 2, 終点, 制御点 1, 制御点 2, 終点, …] */
function curvePoints(pts, steps = 10) {
  const out = [pts[0]];
  for (let i = 0; i + 3 < pts.length; i += 3) {
    const [p0, c1, c2, p1] = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]];
    for (let k = 1; k <= steps; k++) {
      const t = k / steps; const u = 1 - t;
      out.push([
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1],
      ]);
    }
  }
  return out;
}

/** 点の列に そって、太さが w0 から w1 へ 変わる おび（閉じた形の d） */
function ribbonPath(points, w0, w1) {
  const left = []; const right = [];
  const last = points.length - 1;
  for (let i = 0; i <= last; i++) {
    const a = points[Math.max(0, i - 1)]; const b = points[Math.min(last, i + 1)];
    const dx = b[0] - a[0]; const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const half = (w0 + (w1 - w0) * (i / last)) / 2;
    const nx = (-dy / len) * half; const ny = (dx / len) * half;
    left.push(`${f(points[i][0] + nx)} ${f(points[i][1] + ny)}`);
    right.push(`${f(points[i][0] - nx)} ${f(points[i][1] - ny)}`);
  }
  return `M${left.join('L')}L${right.reverse().join('L')}Z`;
}
const ribbon = (pts, w0, w1, fill, width = 2.6, steps = 10) => path(ribbonPath(curvePoints(pts, steps), w0, w1), fill, pen(width));
/** 線の上の t（0〜1）の所の点 */
const pointAt = (pts, t, steps = 10) => { const all = curvePoints(pts, steps); return all[Math.round(t * (all.length - 1))]; };
/** 線の上の t の所の、進む向き（度） */
const angleAt = (pts, t, steps = 10) => {
  const all = curvePoints(pts, steps);
  const i = Math.round(t * (all.length - 1));
  const a = all[Math.max(0, i - 1)]; const b = all[Math.min(all.length - 1, i + 1)];
  return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
};

// ── 顔の部品（どのボスも同じ作り） ──

/**
 * 目（左右）。x: まん中から目までの距離  y: 高さ  r: 大きさ
 *   white: 白目の色  iris: ひとみの色  lid: まぶたの色（体の色。いかり・ふつうの ねむそうな目で使う）
 */
function eyes({ x, y, r, mood, white = WHITE, iris = INK, lid = null, slit = false, sleepy = false }) {
  if (mood === 'smug') return both((s) => line(`M${f(s * x - r)} ${f(y + r * 0.2)}Q${f(s * x)} ${f(y - r * 1.25)} ${f(s * x + r)} ${f(y + r * 0.2)}`, 3.4));
  if (mood === 'hurt') {
    return both((s) => line(`M${f(s * x - s * r * 0.8)} ${f(y - r * 0.75)}L${f(s * x + s * r * 0.55)} ${f(y)}L${f(s * x - s * r * 0.8)} ${f(y + r * 0.75)}`, 3.6));
  }
  if (mood === 'down') {
    const k = r * 0.72;
    return both((s) => line(`M${f(s * x - k)} ${f(y - k)}L${f(s * x + k)} ${f(y + k)}M${f(s * x + k)} ${f(y - k)}L${f(s * x - k)} ${f(y + k)}`, 3.6));
  }
  const wide = mood === 'attack';
  const angry = mood === 'angry' || mood === 'attack';
  const rr = wide ? r * 1.08 : r;
  const pr = wide ? rr * 0.34 : angry ? rr * 0.42 : rr * 0.52;
  const color = angry && !slit ? '#c81e3a' : iris;
  return both((s) => {
    const cx = s * x; const px = cx - s * rr * 0.14; const py = y + rr * (wide ? 0.05 : 0.16);
    let out = circle(cx, y, rr, white, pen(2.4));
    out += slit
      ? ellipse(px, py, pr * 0.5, rr * 0.72, angry ? '#c81e3a' : iris)
      : circle(px, py, pr, color) + (angry ? circle(px, py, pr * 0.45, INK) : '');
    out += circle(px - rr * 0.22, py - rr * 0.3, rr * 0.17, WHITE);
    if (lid && (angry || sleepy)) {
      // まぶた: 目の上を ななめに かくす（いかりは 内がわが下がる。ねむそうな目は まっすぐ）
      const inner = angry ? y - rr * 0.1 : y - rr * 0.38;
      const outer = angry ? y - rr * 0.95 : y - rr * 0.38;
      const xi = cx - s * rr * 1.12; const xo = cx + s * rr * 1.12;
      out += path(`M${f(xi)} ${f(inner)}L${f(xo)} ${f(outer)}L${f(xo)} ${f(y - rr * 1.3)}L${f(xi)} ${f(y - rr * 1.3)}Z`, lid)
        + line(`M${f(xi)} ${f(inner)}L${f(xo)} ${f(outer)}`, 3);
    }
    return out;
  });
}

/** まゆ（太い線）。tilt が大きいほど 内がわが下がる（おこった顔） */
const brows = (x, y, w, tilt, width = 4.2) => both((s) => line(`M${f(s * (x - w))} ${f(y + tilt)}Q${f(s * x)} ${f(y - 2)} ${f(s * (x + w))} ${f(y - tilt)}`, width));
/** ほっぺの赤み */
const cheeks = (x, y, color, rx = 9, ry = 5.5) => both((s) => ellipse(s * x, y, rx, ry, color, soft(0.55)));
/** あせ（いたいとき） */
const sweat = (x, y) => path(`M${f(x)} ${f(y)}q-5 9 0 12q5 -3 0 -12Z`, '#8fd3ff', pen(1.6));
/** いかりの しるし */
const angerMark = (x, y, size = 9) => line(`M${f(x - size)} ${f(y - 3)}q5 0 5 -6M${f(x + size)} ${f(y - 3)}q-5 0 -5 -6M${f(x - size)} ${f(y + 3)}q5 0 5 6M${f(x + size)} ${f(y + 3)}q-5 0 -5 6`, 3, '#e11d48');
/** 足もとの影 */
const groundShadow = (rx, y = 4) => ellipse(0, y, rx, rx * 0.14, '#0b1020', soft(0.32));

// ── けしけしおばけ ──
function ghost(mood) {
  const c = { body: '#9d80ec', shade: '#7c5fd3', light: '#d5c8fb', mouth: '#3a1d4c', tongue: '#ff8fa6', cheek: '#ff9fb8' };
  const down = mood === 'down';
  // 消しゴムを持つ手。こうげきのときは ふりあげる
  const swing = mood === 'attack' ? -42 : mood === 'hurt' || down ? 22 : 0;
  const eraser = group(
    path('M56 -92C72 -98 88 -90 92 -78C94 -68 84 -62 76 -67C70 -74 62 -78 54 -76Z', c.body, pen())
    + group(
      path('M72 -104h52a6 6 0 0 1 6 6v20a6 6 0 0 1 -6 6h-52a6 6 0 0 1 -6 -6v-20a6 6 0 0 1 6 -6Z', '#fdfdfb', pen())
      + path('M66 -84v6a6 6 0 0 0 6 6h10q-12 -4 -16 -12Z', '#c9ced8')
      + path('M88 -104h34v32h-34Z', '#34b3a0', pen())
      + path('M88 -96h34M88 -80h34', 'none', pen(2.4, '#e9fbf6'))
      + path('M105 -93l2.6 4.6l5.2 0.6l-3.9 3.5l1.1 5.1l-5 -2.6l-5 2.6l1.1 -5.1l-3.9 -3.5l5.2 -0.6Z', '#ffe27a', pen(1.4)),
      'rotate(-24 98 -88)',
    )
    + circle(83, -75, 8.5, c.body, pen()),
    `rotate(${swing} 58 -88)`,
  );
  const wave = path('M-56 -98C-76 -100 -90 -116 -88 -132C-86 -143 -72 -143 -70 -132C-69 -121 -63 -113 -54 -110Z', c.body, pen())
    + path('M-88 -131C-96 -138 -92 -148 -84 -144C-84 -152 -74 -152 -73 -144C-66 -146 -64 -136 -70 -131Z', c.body, pen())
    // すその はね（ふわりと うく）
    + path('M-50 -30C-62 -22 -78 -22 -86 -32C-78 -30 -70 -34 -66 -42Z', c.body, pen());
  const body = path('M-60 -74C-66 -132 -38 -176 0 -176C38 -176 66 -132 60 -74C58 -54 64 -38 56 -22Q46 -6 35 -22Q24 -4 12 -20Q0 -2 -12 -20Q-24 -4 -35 -22Q-46 -6 -56 -22C-64 -38 -58 -54 -60 -74Z', c.body, pen(3))
    + path('M22 -172C50 -162 66 -128 60 -74C58 -54 64 -38 56 -22Q50 -12 43 -17C53 -70 51 -130 22 -172Z', c.shade)
    + path('M-44 -112C-46 -142 -32 -160 -16 -164C-30 -150 -36 -132 -36 -112Z', c.light, soft(0.7))
    + path('M-58 -52C-60 -40 -62 -32 -56 -22Q-46 -6 -35 -22Q-24 -4 -12 -20Q0 -2 12 -20Q24 -4 35 -22Q40 -14 44 -16C30 -40 -30 -44 -58 -52Z', c.light, soft(0.35))
    + path('M-60 -74C-66 -132 -38 -176 0 -176C38 -176 66 -132 60 -74C58 -54 64 -38 56 -22Q46 -6 35 -22Q24 -4 12 -20Q0 -2 -12 -20Q-24 -4 -35 -22Q-46 -6 -56 -22C-64 -38 -58 -54 -60 -74Z', 'none', pen(3));
  // ひたいの三角の ぬの
  const cloth = group(
    path('M-46 -147C-30 -169 30 -169 46 -147L44 -139C28 -160 -28 -160 -44 -139Z', '#fdfdfb', pen(2.2))
    + path('M-15 -160L0 -194L15 -160Q0 -166 -15 -160Z', '#fdfdfb', pen(2.4))
    + line('M-6 -168L0 -182L6 -168', 1.6, '#c9ced8'),
    down || mood === 'hurt' ? 'rotate(-12 0 -150)' : 'rotate(0)',
  );
  let face = eyes({ x: 23, y: -118, r: 15, mood, lid: c.body }) + cheeks(43, -99, c.cheek);
  if (mood === 'idle') {
    face += brows(26, -139, 13, 4)
      + path('M-28 -93Q0 -62 28 -93Q0 -85 -28 -93Z', c.mouth, pen(2.4))
      + path('M-20 -90.5l5 7l4 -8.3Z', WHITE, pen(1.4)) + path('M20 -90.5l-5 7l-4 -8.3Z', WHITE, pen(1.4))
      + path('M-8 -78C-10 -58 10 -56 10 -78Q1 -82 -8 -78Z', c.tongue, pen(2.2)) + line('M1 -76L1 -65', 1.6, '#e0607c');
  } else if (mood === 'smug') {
    face += path('M-30 -96Q0 -60 30 -96Q0 -90 -30 -96Z', c.mouth, pen(2.4))
      + path('M-22 -93l5 8l5 -9.4Z', WHITE, pen(1.4)) + path('M22 -93l-5 8l-5 -9.4Z', WHITE, pen(1.4))
      + path('M-9 -80C-12 -56 12 -54 11 -80Q1 -85 -9 -80Z', c.tongue, pen(2.2)) + line('M1 -78L1 -64', 1.6, '#e0607c');
  } else if (mood === 'hurt') {
    face += ellipse(0, -84, 11, 13, c.mouth, pen(2.4)) + ellipse(0, -79, 6, 5, c.tongue) + sweat(50, -150) + sweat(-52, -138);
  } else if (mood === 'angry') {
    face += path('M-26 -92Q0 -80 26 -92L22 -80Q0 -72 -22 -80Z', WHITE, pen(2.4))
      + line('M-13 -88L-12 -78M0 -86L0 -76M13 -88L12 -78', 1.8) + angerMark(-38, -156);
  } else if (mood === 'attack') {
    face += path('M-24 -100Q0 -108 24 -100Q30 -64 0 -60Q-30 -64 -24 -100Z', c.mouth, pen(2.6))
      + path('M-18 -99l5 9l5 -10.4Z', WHITE, pen(1.4)) + path('M18 -99l-5 9l-5 -10.4Z', WHITE, pen(1.4))
      + ellipse(0, -70, 12, 7, c.tongue) + angerMark(-38, -156);
  } else {
    face += path('M-18 -86Q-9 -94 0 -86Q9 -78 18 -86', 'none', pen(3))
      + path('M2 -86C0 -66 18 -64 16 -84Z', c.tongue, pen(2.2));
  }
  const crumbs = path('M96 -44l7 -2l2 6l-7 2Z', '#fdfdfb', pen(1.6)) + path('M82 -30l5 -3l3 5l-5 3Z', '#fdfdfb', pen(1.6)) + path('M104 -22l4 2l-2 5l-4 -2Z', '#fdfdfb', pen(1.6));
  return groundShadow(48, 6) + wave + eraser + body + cloth + face + crumbs;
}

// ── スミダコだいおう ──
function octopus(mood) {
  const c = { body: '#ee6558', shade: '#c9433f', light: '#ffb09c', under: '#ffd9c9', ink: '#1f2440', inkLight: '#4a5488', gold: '#f8c84a', goldDark: '#d99b1f', hole: '#3a1220' };
  const down = mood === 'down';
  const puddle = path('M-104 4C-110 -8 -80 -14 -52 -12C-20 -18 30 -18 60 -12C92 -14 112 -6 104 4C96 14 -92 16 -104 4Z', c.ink)
    + path('M-70 -4Q-40 -9 -12 -6', 'none', pen(2.4, c.inkLight)) + ellipse(74, 2, 10, 2.6, c.inkLight)
    + ellipse(-112, -6, 5, 2.4, c.ink) + ellipse(116, 0, 4, 2, c.ink);
  // うしろの しょくしゅ（左右 2 本ずつ）
  const armOuter = (s) => [[s * 44, -74], [s * 78, -72], [s * 108, -52], [s * 104, -26], [s * 102, -8], [s * 82, -4], [s * 80, -20]];
  const armInner = (s) => [[s * 26, -68], [s * 44, -44], [s * 66, -34], [s * 68, -14], [s * 68, 0], [s * 50, 2], [s * 48, -10]];
  const suckers = (pts, s) => [0.3, 0.45, 0.6].map((t) => { const p = pointAt(pts, t); return circle(p[0] - s * 3, p[1] + 3, 3.4, c.under, pen(1.4)); }).join('');
  const backArms = both((s) => ribbon(armOuter(s), 24, 7, c.body) + suckers(armOuter(s), s))
    + both((s) => ribbon(armInner(s), 22, 7, c.shade) + suckers(armInner(s), s));
  // 筆を持つ しょくしゅ。こうげきのときは 高く上げる
  const lift = mood === 'attack' ? -16 : mood === 'hurt' || down ? 26 : 0;
  const brushArm = (s) => {
    const pts = [[s * 50, -84], [s * 72, -84], [s * 92, -98], [s * 90, -118], [s * 88, -130], [s * 76, -130], [s * 76, -120]];
    const brush = group(
      path('M-4 -42h8v60h-8Z', '#e0ad62', pen(2)) + path('M-4 -30h8M-4 -8h8', 'none', pen(1.6, '#b9843f'))
      + path('M-5 -52h10v10h-10Z', '#f8c84a', pen(2))
      + path('M-6 -52C-9 -66 -5 -78 0 -88C5 -78 9 -66 6 -52Z', c.ink, pen(2))
      + path('M-2 -62Q-3 -72 0 -80', 'none', pen(1.6, c.inkLight)),
      `translate(${f(s * 84)} -124) rotate(${s * 16})`,
    );
    return group(brush + ribbon(pts, 22, 12, c.body), `rotate(${s * lift} ${s * 52} -84)`);
  };
  const head = path('M-60 -98C-72 -152 -36 -184 0 -184C36 -184 72 -152 60 -98C55 -74 40 -60 0 -60C-40 -60 -55 -74 -60 -98Z', c.body, pen(3))
    + path('M24 -180C58 -168 72 -138 60 -98C55 -76 42 -64 16 -61C46 -76 58 -130 24 -180Z', c.shade)
    + path('M-46 -118C-50 -150 -32 -168 -14 -172C-30 -158 -38 -140 -37 -118Z', c.light, soft(0.75))
    + circle(-40, -92, 4, c.light, soft(0.8)) + circle(-30, -82, 2.8, c.light, soft(0.8)) + circle(44, -150, 3.4, c.light, soft(0.5))
    + path('M-60 -98C-72 -152 -36 -184 0 -184C36 -184 72 -152 60 -98C55 -74 40 -60 0 -60C-40 -60 -55 -74 -60 -98Z', 'none', pen(3));
  const crown = group(
    path('M-27 -172L-32 -202L-15 -188L0 -210L15 -188L32 -202L27 -172Q0 -165 -27 -172Z', c.gold, pen(2.6))
    + path('M-27 -172Q0 -165 27 -172L26 -180Q0 -173 -26 -180Z', c.goldDark)
    + circle(-32, -203, 3.6, '#e11d48', pen(1.6)) + circle(0, -211, 4, '#38bdf8', pen(1.6)) + circle(32, -203, 3.6, '#e11d48', pen(1.6))
    + circle(0, -180, 3.4, '#e11d48', pen(1.4)),
    down || mood === 'hurt' ? 'rotate(16 0 -172)' : 'rotate(-5 0 -172)',
  );
  let face = eyes({ x: 25, y: -116, r: 14.5, mood, lid: c.body, sleepy: mood === 'idle' }) + cheeks(46, -98, '#ff8e8e');
  // たこの口（つつ）。こうげきのときは すみを はく
  const spout = (open) => ellipse(0, -84, 13, 10, c.shade, pen(2.6)) + ellipse(0, -84, open ? 8.5 : 6, open ? 6.5 : 3.6, c.hole);
  if (mood === 'idle') face += brows(26, -137, 13, 2) + spout(false);
  else if (mood === 'smug') face += spout(false) + line('M-9 -72Q0 -66 9 -72', 2.4);
  else if (mood === 'hurt') face += spout(true) + sweat(56, -154) + sweat(-58, -140);
  else if (mood === 'angry') face += spout(false) + angerMark(-40, -160) + path('M0 -80C-4 -70 4 -66 0 -58', 'none', pen(3.4, c.ink));
  else if (mood === 'attack') {
    face += spout(true) + angerMark(-40, -160)
      + path('M-7 -82C-16 -62 -22 -44 -14 -30C-6 -18 14 -20 18 -34C22 -48 12 -66 7 -82Z', c.ink, pen(2.2))
      + path('M-8 -52Q-10 -40 -4 -34', 'none', pen(2, c.inkLight)) + circle(26, -40, 4.5, c.ink) + circle(-26, -52, 3.4, c.ink) + circle(30, -58, 2.6, c.ink);
  } else face += spout(true) + path('M-4 -80C-8 -68 6 -64 2 -54', 'none', pen(3, c.ink));
  return puddle + backArms + brushArm(-1) + brushArm(1) + head + crown + face;
}

// ── バツバツおに ──
function oni(mood) {
  const c = { skin: '#e85a50', shade: '#c13d3c', light: '#ff9c88', hair: '#2f3554', hairLight: '#525b86', horn: '#f9d65c', hornDark: '#dba62c', pants: '#f6c544', club: '#646b7c', clubLight: '#9099ab', wrap: '#8f5d2c', gold: '#f8c84a' };
  const down = mood === 'down';
  const feet = both((s) => path(`M${s * 34} -26L${s * 37} -8Q${s * 22} -2 ${s * 9} -8L${s * 8} -24Z`, c.skin, pen())
    + ellipse(s * 25, -3, 18, 6.5, c.skin, pen())
    + path(`M${s * 36} -5l${s * 6} 3l${s * -5} 3Z`, WHITE, pen(1.4)) + path(`M${s * 27} -1l${s * 4} 5l${s * -7} 0Z`, WHITE, pen(1.4)) + path(`M${s * 15} -2l${s * 2} 5l${s * -6} -1Z`, WHITE, pen(1.4)));
  // こんぼうを持つ うで。こうげきのときは ふりおろす
  const swing = mood === 'attack' ? 46 : mood === 'hurt' || down ? 20 : 0;
  const club = group(
    path('M68 -108L60 -184Q76 -204 92 -184L84 -108Z', c.club, pen(2.8))
    + path('M80 -196Q90 -192 92 -184L84 -108L79 -108Z', '#4b5161')
    + path('M66 -176Q64 -150 69 -120', 'none', pen(2.4, c.clubLight))
    + both((s) => [-178, -160, -142, -124].map((y, i) => path(`M${f(76 + s * (14 - i * 1.6))} ${y}l${s * 8} 4l${s * -8} 5Z`, c.clubLight, pen(1.6))).join(''))
    + circle(76, -164, 11, '#fdfdfb', pen(2.2)) + line('M70 -170L82 -158M82 -170L70 -158', 3.6, '#e11d48')
    + path('M67 -114h18v14h-18Z', c.wrap, pen(2)) + line('M67 -109h18M67 -104h18', 1.4, '#6b431d')
    + circle(76, -96, 5, c.gold, pen(1.8)),
    'rotate(16 76 -108)',
  );
  const armR = group(
    club + ribbon([[42, -72], [60, -74], [74, -84], [76, -104]], 22, 18, c.skin)
    + circle(77, -108, 12, c.skin, pen()) + line('M67 -110Q77 -116 87 -110', 1.8) + path('M66 -96h22v6h-22Z', c.gold, pen(1.8)),
    `rotate(${swing} 44 -72)`,
  );
  const armL = ribbon([[-42, -72], [-62, -66], [-70, -52], [-56, -42]], 22, 18, c.skin)
    + circle(-52, -40, 11.5, c.skin, pen()) + path('M-70 -58l8 -4l3 6l-8 4Z', c.gold, pen(1.8));
  const body = path('M-40 -80C-54 -62 -52 -36 -40 -28L40 -28C52 -36 54 -62 40 -80Z', c.skin, pen(3))
    + path('M22 -80L40 -80C54 -62 52 -36 40 -28L26 -28C38 -44 36 -64 22 -80Z', c.shade)
    + line('M-12 -62Q-2 -56 0 -64Q2 -56 12 -62', 2) + ellipse(0, -44, 2.2, 2.8, c.shade);
  const pants = path('M-42 -46Q0 -38 42 -46L44 -22Q24 -13 4 -20L0 -27L-4 -20Q-24 -13 -44 -22Z', c.pants, pen(2.8))
    + path('M-30 -44l5 10l4 -9ZM-8 -41l4 9l5 -9ZM14 -41l4 9l5 -10ZM32 -44l2 9l5 -10ZM-36 -30l6 8l2 -9ZM24 -28l6 8l3 -10Z', INK);
  // かみ（もこもこ）と つの
  const hair = path('M-58 -112C-70 -122 -66 -140 -54 -142C-60 -158 -44 -172 -30 -166C-26 -182 -6 -186 0 -174C6 -186 26 -182 30 -166C44 -172 60 -158 54 -142C66 -140 70 -122 58 -112C40 -134 -40 -134 -58 -112Z', c.hair, pen(2.8))
    + path('M-44 -150Q-38 -160 -28 -158M-8 -172Q0 -178 8 -172M30 -158Q40 -158 44 -148', 'none', pen(2.4, c.hairLight));
  const horns = both((s) => ribbon([[s * 26, -160], [s * 28, -178], [s * 34, -194], [s * 46, -204]], 17, 2, c.horn, 2.4)
    + line(`M${s * 20} -176l${s * 13} -4M${s * 26} -189l${s * 10} -6`, 2, c.hornDark));
  const head = both((s) => path(`M${s * 50} -126L${s * 68} -134L${s * 54} -108Z`, c.skin, pen()))
    + path('M-52 -106C-58 -150 -34 -166 0 -166C34 -166 58 -150 52 -106C50 -84 30 -74 0 -74C-30 -74 -50 -84 -52 -106Z', c.skin, pen(3))
    + path('M26 -162C52 -152 58 -128 52 -106C50 -86 34 -76 12 -74.5C38 -84 46 -130 26 -162Z', c.shade)
    + path('M-40 -112C-42 -130 -34 -142 -24 -146C-32 -136 -34 -124 -33 -112Z', c.light, soft(0.7));
  let face = eyes({ x: 22, y: -120, r: 11.5, mood, lid: c.skin }) + cheeks(40, -104, '#ff7b6b', 8, 5)
    + path('M-7 -106Q0 -112 7 -106Q0 -100 -7 -106Z', c.shade, pen(2));
  const fangs = (y) => path(`M-17 ${y}l4 -11l5 11Z`, WHITE, pen(1.6)) + path(`M17 ${y}l-4 -11l-5 11Z`, WHITE, pen(1.6));
  if (mood === 'idle') face += brows(23, -137, 12, 6, 5.5) + path('M-24 -94Q0 -82 24 -94Q0 -80 -24 -94Z', '#4a1220', pen(2.4)) + fangs(-86);
  else if (mood === 'smug') face += path('M-26 -96Q0 -74 26 -96Q0 -86 -26 -96Z', '#4a1220', pen(2.4)) + fangs(-86.5);
  else if (mood === 'hurt') face += ellipse(0, -88, 10, 9, '#4a1220', pen(2.4)) + sweat(48, -150) + sweat(-50, -140);
  else if (mood === 'angry') face += brows(23, -136, 12, 8, 6) + path('M-24 -96Q0 -90 24 -96L20 -84Q0 -78 -20 -84Z', WHITE, pen(2.4)) + line('M-12 -93L-11 -83M0 -91L0 -81M12 -93L11 -83', 1.8) + angerMark(40, -164);
  else if (mood === 'attack') face += brows(23, -136, 12, 8, 6) + path('M-22 -100Q0 -106 22 -100Q26 -78 0 -76Q-26 -78 -22 -100Z', '#4a1220', pen(2.6)) + fangs(-78.5) + ellipse(0, -82, 10, 4.5, '#ff8fa6') + angerMark(40, -164);
  else face += path('M-16 -90Q-8 -96 0 -90Q8 -84 16 -90', 'none', pen(3));
  return groundShadow(58) + feet + armR + armL + body + pants + horns + head + hair + face;
}

// ── まっくろりゅうおう ──
function dragon(mood) {
  const c = { body: '#444a85', shade: '#30345f', light: '#6c74bd', belly: '#f5dc92', bellyDark: '#d6ad52', gold: '#f8c84a', goldDark: '#d99b1f', wing: '#8558c4', wingDark: '#5f3d97', eye: '#ffe55f', fire: '#8b5cf6', fireLight: '#ddd0ff' };
  const down = mood === 'down';
  const spread = mood === 'attack' ? -10 : mood === 'hurt' || down ? 18 : 0;
  const wing = (s) => group(
    path(`M${s * 28} -96L${s * 72} -164Q${s * 96} -178 ${s * 112} -152Q${s * 96} -142 ${s * 100} -118Q${s * 84} -118 ${s * 82} -98Q${s * 66} -100 ${s * 60} -84Q${s * 46} -90 ${s * 30} -80Z`, c.wing, pen(2.8))
    + path(`M${s * 28} -96L${s * 100} -118Q${s * 84} -118 ${s * 82} -98Q${s * 66} -100 ${s * 60} -84Q${s * 46} -90 ${s * 30} -80Z`, c.wingDark)
    + line(`M${s * 28} -96L${s * 112} -152M${s * 28} -96L${s * 100} -118M${s * 28} -96L${s * 82} -98M${s * 28} -96L${s * 60} -84`, 2.2)
    + path(`M${s * 72} -164l${s * -4} -13l${s * 11} 7Z`, c.gold, pen(1.8)),
    `rotate(${s * spread} ${s * 28} -96)`,
  );
  const tailPts = [[30, -24], [62, -8], [100, -12], [104, -42], [106, -62], [86, -70], [80, -54]];
  const tip = pointAt(tailPts, 1);
  // しっぽの先の やじり と、外がわの とげ（どちらも しっぽの向きに合わせる）
  const tail = group(path('M-5 -11L17 0L-5 11Q1 0 -5 -11Z', c.gold, pen(2)), `translate(${f(tip[0])} ${f(tip[1])}) rotate(${f(angleAt(tailPts, 1))})`)
    + [0.25, 0.4, 0.55, 0.7].map((t) => {
      const p = pointAt(tailPts, t);
      return group(path('M-5 0L0 -11L5 0Z', c.gold, pen(1.6)), `translate(${f(p[0])} ${f(p[1])}) rotate(${f(angleAt(tailPts, t) + 180)}) translate(0 ${f(-(26 - 19 * t) / 2 + 1.5)})`);
    }).join('')
    + ribbon(tailPts, 26, 7, c.body);
  const feet = both((s) => ellipse(s * 28, -5, 21, 9.5, c.body, pen())
    + [-11, 0, 11].map((dx) => path(`M${f(s * 28 + dx - 4)} 1l4 7l4 -7Z`, c.gold, pen(1.5))).join(''));
  const body = path('M-46 -42C-52 -84 -32 -104 0 -104C32 -104 52 -84 46 -42C42 -12 24 -5 0 -5C-24 -5 -42 -12 -46 -42Z', c.body, pen(3))
    + path('M20 -102C46 -96 52 -70 46 -42C42 -14 26 -6 8 -5C34 -18 42 -70 20 -102Z', c.shade)
    + path('M-25 -88C-36 -62 -32 -24 0 -14C32 -24 36 -62 25 -88Q0 -98 -25 -88Z', c.belly, pen(2.4))
    + line('M-28 -66Q0 -58 28 -66M-28 -46Q0 -38 28 -46M-20 -28Q0 -22 20 -28', 2, c.bellyDark);
  const arms = both((s) => ribbon([[s * 42, -82], [s * 56, -74], [s * 54, -58], [s * 42, -54]], 16, 13, c.body)
    + [-5, 1, 7].map((d) => path(`M${f(s * (40 + d * 0.3) - 3)} ${f(-52 + d * 0.4)}l${s * -6} 5l${s * 1} -8Z`, c.gold, pen(1.4))).join(''));
  const horns = both((s) => ribbon([[s * 24, -172], [s * 30, -192], [s * 46, -204], [s * 66, -198]], 15, 2, c.gold, 2.4)
    + line(`M${s * 22} -184l${s * 11} -6M${s * 32} -196l${s * 8} -8`, 2, c.goldDark));
  const head = both((s) => path(`M${s * 48} -138L${s * 72} -150L${s * 62} -128L${s * 74} -116L${s * 50} -114Z`, c.wing, pen(2.4)))
    + path('M-52 -132C-56 -170 -30 -186 0 -186C30 -186 56 -170 52 -132C50 -106 30 -94 0 -94C-30 -94 -50 -106 -52 -132Z', c.body, pen(3))
    + path('M26 -182C52 -172 56 -150 52 -132C50 -108 34 -97 12 -94.5C40 -106 46 -152 26 -182Z', c.shade)
    + path('M-40 -138C-42 -158 -32 -170 -20 -174C-30 -164 -34 -152 -33 -138Z', c.light, soft(0.7))
    + path('M-8 -182L0 -204L8 -182Z', c.gold, pen(2)) + path('M-20 -178L-15 -194L-7 -181Z', c.gold, pen(2)) + path('M20 -178L15 -194L7 -181Z', c.gold, pen(2));
  // 鼻づら
  const snout = ellipse(0, -112, 27, 16.5, c.light, pen(2.6)) + both((s) => ellipse(s * 9, -119, 3, 2.2, c.shade));
  let face = eyes({ x: 25, y: -144, r: 12, mood, white: c.eye, iris: '#7a1022', lid: c.body, slit: true });
  const fangs = (y) => path(`M-17 ${y}l4 9l4 -9Z`, WHITE, pen(1.5)) + path(`M17 ${y}l-4 9l-4 -9Z`, WHITE, pen(1.5));
  let extra = '';
  if (mood === 'idle') face += brows(26, -161, 12, 5, 5) + snout + line('M-21 -106Q0 -98 21 -106', 2.6) + fangs(-104);
  else if (mood === 'smug') face += snout + line('M-22 -108Q0 -94 22 -108', 2.6) + fangs(-104.5) + path('M-30 -100q-8 6 -4 14q7 -4 4 -14Z', c.fire, pen(1.6));
  else if (mood === 'hurt') face += snout + ellipse(0, -103, 9, 6, '#3a1220', pen(2.2)) + sweat(58, -170) + sweat(-60, -158);
  else if (mood === 'angry') face += snout + path('M-20 -108Q0 -104 20 -108L17 -99Q0 -95 -17 -99Z', WHITE, pen(2.2)) + line('M-9 -106L-8 -98M0 -105L0 -97M9 -106L8 -98', 1.6) + angerMark(42, -178)
    + path('M22 -100q10 4 8 14q-9 -3 -8 -14Z', c.fire, pen(1.6));
  else if (mood === 'attack') {
    face += snout + path('M-19 -110Q0 -114 19 -110Q22 -92 0 -90Q-22 -92 -19 -110Z', '#3a1220', pen(2.4)) + fangs(-109) + angerMark(42, -178);
    // 黒い ほのお
    extra = path('M-16 -94C-34 -70 -40 -40 -22 -16C-10 0 14 0 24 -16C40 -40 30 -66 14 -94C10 -78 6 -70 0 -66C-6 -72 -12 -80 -16 -94Z', c.fire, pen(2.4))
      + path('M-6 -62C-16 -46 -14 -28 -4 -18C6 -12 16 -22 14 -36C12 -46 6 -52 2 -60C0 -54 -2 -54 -6 -62Z', c.fireLight);
  } else face += snout + path('M-14 -104Q-7 -110 0 -104Q7 -98 14 -104', 'none', pen(2.8));
  return groundShadow(62) + wing(-1) + wing(1) + tail + feet + body + arms + horns + head + face + extra;
}

const DRAW = { ghost, octopus, oni, dragon };

/**
 * ボスの絵（<svg viewBox=BOSS_ART_BOX> の中身）。
 * @param {string} id ボスの id（BOSS_ART_IDS）。知らない id は ghost
 * @param {string} [mood] 表情（BOSS_MOODS）。知らない表情は idle
 */
export function bossArt(id, mood = 'idle') {
  const draw = Object.hasOwn(DRAW, id) ? DRAW[id] : DRAW.ghost;
  return draw(BOSS_MOODS.includes(mood) ? mood : 'idle');
}

// ── 舞台の背景（<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice"> の中身） ──
export const BOSS_STAGE_BOX = Object.freeze({ width: 400, height: 240 });

const rect = (x, y, w, h, fill, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}"${extra}/>`;
const star = (x, y, r = 1.4, o = 0.8) => circle(x, y, r, '#fff8d6', soft(o));
const STARS = [[24, 30], [62, 58], [96, 22], [132, 44], [178, 18], [214, 52], [252, 26], [300, 60], [338, 20], [372, 46], [44, 92], [356, 96], [148, 78], [274, 84]];

const STAGES = {
  // 夜の学校
  ghost: () => rect(0, 0, 400, 240, '#231a4d') + rect(0, 110, 400, 130, '#2e2264')
    + STARS.map(([x, y], i) => star(x, y, i % 3 ? 1.2 : 1.9, i % 2 ? 0.55 : 0.9)).join('')
    + circle(318, 58, 34, '#fff3b8') + circle(306, 48, 30, '#231a4d', soft(0.16)) + circle(330, 70, 6, '#f0dc8c', soft(0.7)) + circle(308, 62, 4, '#f0dc8c', soft(0.7))
    + path('M0 240V150h70v-22h34v-26l17 -14l17 14v26h34v22h70v90Z', '#171138')
    + rect(112, 108, 18, 12, '#ffd66b', soft(0.9)) + circle(121, 95, 5, '#fff3b8', soft(0.85))
    + [16, 40, 148, 172, 196, 220].map((x) => rect(x, 164, 12, 14, '#ffd66b', soft(x % 3 ? 0.25 : 0.8))).join('')
    + path('M300 240C298 200 306 180 296 150M302 196C312 184 326 186 334 172M300 176C290 166 280 168 274 156', 'none', pen(5, '#171138'))
    + path('M0 240V214Q100 200 200 210Q300 200 400 214V240Z', '#120d2c'),
  // すみの海
  octopus: () => rect(0, 0, 400, 240, '#0f3b57') + rect(0, 90, 400, 150, '#0b2e47')
    + path('M0 40Q50 28 100 40T200 40T300 40T400 40V0H0Z', '#165070')
    + [[40, 150, 5], [70, 96, 3], [330, 120, 6], [362, 70, 3], [300, 176, 4], [110, 190, 3], [250, 64, 2.4]].map(([x, y, r]) => circle(x, y, r, 'none', pen(1.6, '#7fd3ee')) + circle(x - r * 0.3, y - r * 0.3, r * 0.25, '#c9f1fb', soft(0.9))).join('')
    + path('M24 240C18 200 36 190 28 160C44 186 34 206 44 240Z', '#0d5a4e') + path('M52 240C50 214 62 204 58 186C70 204 64 220 70 240Z', '#127060')
    + path('M352 240C346 196 366 186 356 150C376 182 362 206 374 240Z', '#0d5a4e') + path('M322 240C320 214 332 206 328 190C340 206 334 222 340 240Z', '#127060')
    + path('M0 240V212Q60 196 130 208Q200 220 270 206Q340 194 400 210V240Z', '#07202f')
    + path('M90 214Q130 206 170 214', 'none', pen(2, '#165070')) + path('M250 212Q290 204 330 212', 'none', pen(2, '#165070')),
  // おにの山（夕やけ）
  oni: () => rect(0, 0, 400, 240, '#5a1f2a') + rect(0, 0, 400, 90, '#7a2a2e') + rect(0, 0, 400, 44, '#9c3a30')
    + circle(86, 70, 30, '#ffb347', soft(0.95)) + circle(86, 70, 40, '#ffb347', soft(0.18))
    + path('M0 240V150L46 96L84 148L120 110L160 170L200 130L240 172L286 104L324 150L360 116L400 160V240Z', '#3a141e')
    + path('M46 96L58 114L46 120L38 110ZM286 104L298 122L284 128L276 116Z', '#5a1f2a')
    + path('M0 240V196Q100 180 200 192Q300 180 400 196V240Z', '#250c14')
    + both((s) => rect(200 + s * 150 - 3, 166, 6, 34, '#1a080e') + path(`M${200 + s * 150 - 9} 168Q${200 + s * 150 - 12} 150 ${200 + s * 150} 138Q${200 + s * 150 + 12} 150 ${200 + s * 150 + 9} 168Z`, '#ff9d2e') + path(`M${200 + s * 150 - 4} 168Q${200 + s * 150 - 5} 158 ${200 + s * 150} 150Q${200 + s * 150 + 5} 158 ${200 + s * 150 + 4} 168Z`, '#ffe08a')),
  // あらしの城
  dragon: () => rect(0, 0, 400, 240, '#191c3a') + rect(0, 100, 400, 140, '#22264d')
    + path('M-10 60C20 30 60 34 80 50C100 26 150 26 170 52C200 34 240 40 250 64C290 44 330 50 340 70C370 56 410 66 410 90H-10Z', '#2c3160')
    + path('M-10 40C30 14 70 20 96 36C130 10 190 14 210 40C250 20 300 26 320 46C360 30 400 40 410 60V0H-10Z', '#3a4078')
    + path('M118 44L104 84H118L100 128L136 74H120L134 44Z', '#ffe55f') + path('M292 60L282 88H292L280 118L304 82H294L302 60Z', '#ffe55f', soft(0.8))
    + path('M0 240V170h26v-20h10v20h20v-44h8v-12h10v12h8v44h24v-26h10v26h30v70Z', '#10122a')
    + path('M400 240V176h-24v-22h-10v22h-22v-50h-8v-14h-10v14h-8v50h-26v70Z', '#10122a')
    + rect(60, 136, 8, 10, '#ffd66b', soft(0.8)) + rect(330, 132, 8, 10, '#ffd66b', soft(0.8))
    + path('M0 240V214Q100 202 200 212Q300 202 400 214V240Z', '#0a0b1c'),
};

/** 舞台の背景（<svg viewBox="0 0 400 240"> の中身）。知らない id は ghost */
export function bossStage(id) {
  return (Object.hasOwn(STAGES, id) ? STAGES[id] : STAGES.ghost)();
}
