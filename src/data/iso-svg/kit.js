// 建物の絵を描く部品 — マイ漢字タウン
//
// 「小さな家」と同じ絵がら（こげ茶の細い線・面ごとの明暗・かわら・ガラスの窓）の建物は、
// ここの部品を組み合わせて、文字列で描く（data/iso-svg/buildings-art.js）。
// React に依存しない（test/ から確かめる）。
//
// ── 座標 ──
// 敷地（w × h マス）の上で、u は右手前へ 0→w、v は左手前へ 0→h、z は高さ。
// 1 マスは、画面で 幅 80・高さ 40 の ひし形。原点は敷地のまん中。
// 絵は <g transform="translate(50 50) scale(5/(w+h))"> で包む（wrap）。こうすると、敷地の
// 大きさによらず 足もとが viewBox（"0 -100 100 200"）の同じ場所（幅 200・高さ 100）に収まり、
// 置き方の表（data/town-item-fit.js）は「まん中 (0, -50)・大きさ 0.16 ×(w+h)」の 1 つの
// 決まりですむ。町では 1 単位が 0.8px になり、線の太さは敷地の大きさによらず同じに見える。
//
// ── 向き ──
// 光は左上から当たる。左手前の面（SW: v が一定）が明るく、右手前の面（SE: u が一定）が暗い。
// 重なりは描いた順（あとに描いたものが手前）。奥（u+v が小さい）から手前へ描くこと。
//
// ⚠️ ここで作る文字列は innerHTML に入れる。色と形は、すべてコードの中の値から作る
//    （地図の id など、外から来た値を混ぜない）。色は #rrggbb の 6 けたで書く。

const f = (v) => String(Math.round(v * 100) / 100);

/** 線の色（こげ茶。まっ黒にしない） */
export const INK = '#2b211c';

/** 色を明るく（amt > 0）・暗く（amt < 0）する */
export const tone = (hex, amt) => {
  const v = parseInt(hex.slice(1), 16);
  const ch = (shift) => {
    const c = (v >> shift) & 255;
    return Math.max(0, Math.min(255, Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt))));
  };
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};

/** 2 つの色を まぜる（t=0 で a、t=1 で b） */
export const mix = (a, b, t) => {
  const va = parseInt(a.slice(1), 16);
  const vb = parseInt(b.slice(1), 16);
  const ch = (shift) => Math.round(((va >> shift) & 255) * (1 - t) + ((vb >> shift) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};

const pen = (width = 1.2, color = INK) => ` stroke="${color}" stroke-width="${f(width)}" stroke-linejoin="round" stroke-linecap="round"`;
const op = (opacity) => (opacity ? ` opacity="${f(opacity)}"` : '');

/** 地面と平行な円は、画面では だ円になる。半径 1 マスあたりの 横・たての半径 */
const RX = 40 * Math.SQRT2;
const RY = 20 * Math.SQRT2;

/**
 * 敷地（w × h マス）の上に絵を描く道具をひとそろい返す。
 * @param {number} w 敷地の幅（マス。u の向き）
 * @param {number} h 敷地の奥行き（マス。v の向き）
 */
export function lot(w = 1, h = 1) {
  const ox = (w - h) * 20;
  const oy = (w + h) * 10;
  const X = (u, v) => (u - v) * 40 - ox;
  const Y = (u, v, z = 0) => (u + v) * 20 - oy - z;
  /** 画面の座標 [x, y] */
  const xy = (u, v, z = 0) => [X(u, v), Y(u, v, z)];
  const pt = (p) => `${f(X(p[0], p[1]))} ${f(Y(p[0], p[1], p[2] || 0))}`;
  const path = (pts, close = true) => `M${pts.map(pt).join('L')}${close ? 'Z' : ''}`;

  // ── 面・線 ──
  /** ふちどりのある面（width=0 で ふちなし） */
  const poly = (pts, fill, width = 1.2, color = INK) => `<path d="${path(pts)}" fill="${fill}"${width ? pen(width, color) : ''}/>`;
  /** ふちどりの無い面（かげ・もよう） */
  const flat = (pts, fill, opacity) => `<path d="${path(pts)}" fill="${fill}"${op(opacity)}/>`;
  /** 線 */
  const seg = (pts, color = INK, width = 0.8, opacity) => `<path d="${path(pts, false)}" fill="none"${pen(width, color)}${op(opacity)}/>`;
  /** ふちどりのある太い線（丸太・手すり・さお など）。pts は 3 次元の点 */
  const bar = (pts, color, width = 2, edge = 0.8) => seg(pts, INK, width + edge * 2) + seg(pts, color, width);
  /** ふちどりのある太い曲線（p0 から p1 へ。c は曲がりの手がかりの点） */
  const curve = (p0, c, p1, color, width = 2, edge = 0.8) => {
    const d = `M${pt(p0)}Q${pt(c)} ${pt(p1)}`;
    return `<path d="${d}" fill="none"${pen(width + edge * 2)}/><path d="${d}" fill="none"${pen(width, color)}/>`;
  };
  /** 画面に正面を向いた丸（場所だけ 3 次元で決める） */
  const dot = (u, v, z, r, fill, width = 0.6, opacity) => {
    const [x, y] = xy(u, v, z);
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}"${width ? pen(width) : ''}${op(opacity)}/>`;
  };
  /** 画面に正面を向いた だ円 */
  const oval = (u, v, z, rx, ry, fill, width = 0, opacity) => {
    const [x, y] = xy(u, v, z);
    return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${width ? pen(width) : ''}${op(opacity)}/>`;
  };
  /** 地面と平行な円（半径 r マス） */
  const disc = (u, v, z, r, fill, width = 1.2, opacity) => oval(u, v, z, r * RX, r * RY, fill, width, opacity);
  /** 自由な形（画面の座標で書いた path の d）。at の場所を原点にする */
  const shape = (u, v, z, d, fill, width = 1, color = INK, opacity) => {
    const [x, y] = xy(u, v, z);
    return `<path transform="translate(${f(x)} ${f(y)})" d="${d}" fill="${fill}"${width ? pen(width, color) : ''}${op(opacity)}/>`;
  };

  // ── 壁の面 ──
  // 面は「面の上の場所 (t, z) → 3 次元の点」の関数で表す。t は面に沿った位置（マス）。
  /** 左手前を向いた面（v が一定）。t は u */
  const SW = (v) => Object.assign((t, z) => [t, v, z], { side: 'sw', out: (d) => SW(v + d) });
  /** 右手前を向いた面（u が一定）。t は v */
  const SE = (u) => Object.assign((t, z) => [u, t, z], { side: 'se', out: (d) => SE(u + d) });
  const rect = (face, t0, t1, z0, z1) => [face(t0, z0), face(t1, z0), face(t1, z1), face(t0, z1)];
  /** 面の上の、ふちどりのある四角 */
  const panel = (face, t0, t1, z0, z1, fill, width = 1) => poly(rect(face, t0, t1, z0, z1), fill, width);
  /** 面の上の、ふちどりの無い四角（かげ・色の帯） */
  const band = (face, t0, t1, z0, z1, fill, opacity) => flat(rect(face, t0, t1, z0, z1), fill, opacity);
  /** 面の上の線 */
  const rule = (face, t0, z0, t1, z1, color = INK, width = 0.7, opacity) => seg([face(t0, z0), face(t1, z1)], color, width, opacity);
  /**
   * 面に はりつけた絵（かんばんの しるし など）。markup は面の上の平らな座標
   * （x は面に沿って右へ、y は下へ）で書く。
   */
  const onFace = (face, t, z, markup) => {
    const [x, y] = xy(...face(t, z));
    return `<g transform="matrix(1 ${face.side === 'sw' ? 0.5 : -0.5} 0 1 ${f(x)} ${f(y)})">${markup}</g>`;
  };

  /** 画面に正面を向けて置く絵（かたむけない。しるし・きらめき など）。markup の原点が その場所になる */
  const billboard = (u, v, z, markup) => {
    const [x, y] = xy(u, v, z);
    return `<g transform="translate(${f(x)} ${f(y)})">${markup}</g>`;
  };

  // ── 箱 ──
  /**
   * 直方体。c は左手前の面の色。
   * @param {{ se?: string, top?: string, lw?: number }} [o] ほかの面の色・線の太さ
   */
  const box = (u0, v0, u1, v1, z0, z1, c, o = {}) => {
    const lw = o.lw ?? 1.2;
    return poly(rect(SW(v1), u0, u1, z0, z1), c, lw)
      + poly(rect(SE(u1), v0, v1, z0, z1), o.se || tone(c, -0.14), lw)
      + poly([[u0, v0, z1], [u1, v0, z1], [u1, v1, z1], [u0, v1, z1]], o.top || tone(c, 0.16), lw);
  };
  /** 地面の上の平らな四角（しき石・芝・水面など） */
  const pad = (u0, v0, u1, v1, fill, width = 0.9, color = INK, z = 0) => poly([[u0, v0, z], [u1, v0, z], [u1, v1, z], [u0, v1, z]], fill, width, color);
  /**
   * 建物が地面に落とす影（右手前へ のびる）。敷地に芝や しき石を しく絵は、地面のレイヤーが描く影が
   * その下に かくれるので、絵の中で描く（buildings-art.js の shadow: 'own'）。建物より先に描くこと。
   */
  const shadow = (u0, v0, u1, v1, reach = 0.22) => flat([[u0 + 0.03, v0 + 0.05, 0.1], [u1 + reach, v0 + 0.05, 0.1], [u1 + reach, v1 - 0.02, 0.1], [u0 + 0.03, v1 - 0.02, 0.1]], '#1e2a3a', 0.17);
  /** 丸いものが落とす影 */
  const roundShadow = (u, v, r) => oval(u + 0.05, v, 0.1, r * RX, r * RY, '#1e2a3a', 0, 0.17);
  /** 壁の下の はば木（左手前と右手前の 2 面） */
  const plinth = (u0, v0, u1, v1, z, c, z0 = 0) => panel(SW(v1), u0, u1, z0, z, c, 1) + panel(SE(u1), v0, v1, z0, z, tone(c, -0.14), 1);
  /** のき下の かげ（壁の上のほうを少し暗くする） */
  const eaveShade = (u0, v0, u1, v1, z, depth, wall) => band(SW(v1), u0, u1, z - depth, z, tone(wall, -0.18), 0.7)
    + band(SE(u1), v0, v1, z - depth, z, tone(wall, -0.3), 0.6);

  // ── 窓・ドア ──
  /**
   * 窓（白いわく・ガラス・光・さん）。
   * @param {{ frame?: string, glass?: string, bars?: 'cross'|'v'|'h'|'none', sill?: string, lw?: number }} [o]
   */
  const win = (face, t0, t1, z0, z1, o = {}) => {
    const it = (t1 - t0) * 0.14;
    const iz = Math.min(0.9, (z1 - z0) * 0.14);
    const dark = face.side === 'se';
    const glass = o.glass || (dark ? '#7cc4ec' : '#8fd3f7');
    const tm = (t0 + t1) / 2;
    const zm = (z0 + z1) / 2;
    const bars = o.bars || 'cross';
    let out = '';
    if (o.sill) out += panel(face.out(0.02), t0 - 0.012, t1 + 0.012, z0 - 1.1, z0 + 0.1, o.sill, 0.8);
    out += panel(face, t0, t1, z0, z1, o.frame || '#ffffff', o.lw ?? 1)
      + band(face, t0 + it, t1 - it, z0 + iz, z1 - iz, glass)
      + flat([face(t0 + it, z1 - iz), face(tm, z1 - iz), face(t0 + it, zm)], dark ? '#c4e8fa' : '#d6f1ff');
    if (bars === 'cross' || bars === 'v') out += rule(face, tm, z0 + iz * 0.6, tm, z1 - iz * 0.6, INK, 0.7);
    if (bars === 'cross' || bars === 'h') out += rule(face, t0 + it * 0.6, zm, t1 - it * 0.6, zm, INK, 0.7);
    return out;
  };
  /** 同じ大きさの窓を、面に沿って n こ ならべる */
  const wins = (face, t0, t1, n, z0, z1, o = {}) => {
    const gap = o.gap ?? 0.35;
    const step = (t1 - t0) / n;
    const width = step * (1 - gap);
    let out = '';
    for (let i = 0; i < n; i++) {
      const a = t0 + step * i + (step - width) / 2;
      out += win(face, a, a + width, z0, z1, o);
    }
    return out;
  };
  /**
   * 大きなガラス（店のショーウィンドウ・ビルの窓の帯）。n は たての さんの数 + 1
   * @param {{ frame?: string, glass?: string, lw?: number }} [o]
   */
  const glass = (face, t0, t1, z0, z1, n = 2, o = {}) => {
    const dark = face.side === 'se';
    const fill = o.glass || (dark ? '#7cc4ec' : '#8fd3f7');
    const it = Math.min(0.02, (t1 - t0) * 0.1);
    const iz = Math.min(0.7, (z1 - z0) * 0.12);
    let out = panel(face, t0, t1, z0, z1, o.frame || '#3d4a5c', o.lw ?? 1)
      + band(face, t0 + it, t1 - it, z0 + iz, z1 - iz, fill);
    // ななめの光
    const span = t1 - t0 - it * 2;
    const hgt = z1 - z0 - iz * 2;
    out += flat([face(t0 + it + span * 0.12, z1 - iz), face(t0 + it + span * 0.3, z1 - iz), face(t0 + it + span * 0.08, z0 + iz + hgt * 0.25), face(t0 + it, z0 + iz + hgt * 0.45), face(t0 + it, z0 + iz + hgt * 0.7)], '#dff4ff', 0.75);
    for (let i = 1; i < n; i++) {
      const t = t0 + ((t1 - t0) * i) / n;
      out += rule(face, t, z0 + iz * 0.5, t, z1 - iz * 0.5, o.frame || '#3d4a5c', 0.8);
    }
    return out;
  };
  /**
   * ドア（白いわく・板・明るい半分・のぞき窓・とって）
   * @param {{ color?: string, frame?: string, pane?: boolean, double?: boolean }} [o]
   */
  const door = (face, t0, t1, z0, z1, o = {}) => {
    const c = o.color || '#c9793a';
    const it = (t1 - t0) * 0.12;
    const tm = (t0 + t1) / 2;
    let out = panel(face, t0, t1, z0, z1, o.frame || '#ffffff', 1)
      + panel(face, t0 + it, t1 - it, z0, z1 - 0.8, c, 0.8)
      + band(face, t0 + it, tm, z0, z1 - 0.8, tone(c, 0.16));
    if (o.double) out += rule(face, tm, z0, tm, z1 - 0.8, INK, 0.7);
    if (o.pane !== false) out += panel(face, tm - (t1 - t0) * 0.2, tm + (t1 - t0) * 0.2, z0 + (z1 - z0) * 0.56, z1 - 2, '#bfe6fb', 0.6);
    const [kx, ky] = xy(...face(o.double ? tm + (t1 - t0) * 0.08 : t1 - it * 2.2, z0 + (z1 - z0) * 0.42));
    out += `<circle cx="${f(kx)}" cy="${f(ky)}" r="0.8" fill="#ffd24a"${pen(0.45)}/>`;
    return out;
  };
  /**
   * しまもようの ひさし（面から手前へ はり出す）
   * @param {{ depth?: number, drop?: number, n?: number, c1?: string, c2?: string }} [o]
   */
  const awning = (face, t0, t1, z, o = {}) => {
    const depth = o.depth ?? 0.11;
    const drop = o.drop ?? 3.4;
    const n = o.n ?? 5;
    const c1 = o.c1 || '#ef4444';
    const c2 = o.c2 || '#fff7ed';
    const outer = face.out(depth);
    let out = '';
    for (let i = 0; i < n; i++) {
      const a = t0 + ((t1 - t0) * i) / n;
      const b = t0 + ((t1 - t0) * (i + 1)) / n;
      out += poly([face(a, z), face(b, z), outer(b, z - drop), outer(a, z - drop)], i % 2 === 0 ? c1 : c2, 0.7);
    }
    // 手前に たれる ふち（しまの色を そのまま下ろす）
    for (let i = 0; i < n; i++) {
      const a = t0 + ((t1 - t0) * i) / n;
      const b = t0 + ((t1 - t0) * (i + 1)) / n;
      out += poly(rect(outer, a, b, z - drop - 1.7, z - drop), tone(i % 2 === 0 ? c1 : c2, -0.16), 0.7);
    }
    return out;
  };
  /** かんばん（板と、ふちの色）。中の しるしは onFace で重ねる */
  const sign = (face, t0, t1, z0, z1, fill = '#ffffff', edge = '#3d4a5c') => panel(face, t0, t1, z0, z1, edge, 1)
    + band(face, t0 + 0.012, t1 - 0.012, z0 + 0.8, z1 - 0.8, fill);

  // ── 屋根 ──
  /** かわらの段（よこの線）と、たがいちがいの つぎ目。slope(t, s): t=0 が むね、t=1 が のき。s は のきに沿った位置 0→1 */
  const tiles = (slope, length, color, rows = [0.26, 0.52, 0.78]) => {
    let out = '';
    for (const t of rows) out += seg([slope(t, 0), slope(t, 1)], color, 0.8, 0.75);
    const cols = Math.max(3, Math.round(length / 0.15));
    const edges = [0, ...rows, 1];
    for (let row = 0; row < edges.length - 1; row++) {
      for (let i = 0; i < cols; i++) {
        const s = (i + (row % 2 ? 0.5 : 0)) / cols + 0.1 / cols;
        if (s >= 0.985) continue;
        out += seg([slope(edges[row], s), slope(edges[row + 1], s)], color, 0.6, 0.45);
      }
    }
    return out;
  };
  /**
   * 切妻の家の壁（四角い壁と、三角に とがった妻の壁）。
   * axis 'u': むねが u の向き。左手前が四角い壁、右手前が妻。
   * axis 'v': むねが v の向き。左手前が妻、右手前が四角い壁。
   */
  const gableWalls = (u0, v0, u1, v1, wallH, rise, c, axis = 'u', o = {}) => {
    const z0 = o.z0 || 0;
    const se = o.se || tone(c, -0.1);
    if (axis === 'u') {
      const vm = (v0 + v1) / 2;
      return poly(rect(SW(v1), u0, u1, z0, wallH), c)
        + poly([[u1, v1, z0], [u1, v0, z0], [u1, v0, wallH], [u1, vm, wallH + rise], [u1, v1, wallH]], se);
    }
    const um = (u0 + u1) / 2;
    return poly([[u0, v1, z0], [u1, v1, z0], [u1, v1, wallH], [um, v1, wallH + rise], [u0, v1, wallH]], c)
      + poly(rect(SE(u1), v0, v1, z0, wallH), se);
  };
  /**
   * 切妻の屋根（かわらの面・のきの厚み・はふ・むね）。z は壁の上の高さ、rise は そこから むねまで。
   * @param {{ over?: number, drop?: number, thick?: number, dark?: string, plain?: boolean }} [o]
   *   over=のきの出（マス）、drop=のき先が壁の上より下がる分、plain=かわらの線を描かない
   */
  const gableRoof = (u0, v0, u1, v1, z, rise, c, axis = 'u', o = {}) => {
    const over = o.over ?? 0.05;
    const drop = o.drop ?? 1.2;
    const thick = o.thick ?? 1.9;
    const ridge = z + rise;
    const eave = z - drop;
    // むねを a の向きにとり、屋根の面は b の向きへ下がる、として 2 つの向きを 1 つの式で描く
    const at = axis === 'u' ? (a, b, zz) => [a, b, zz] : (a, b, zz) => [b, a, zz];
    const [a0, a1, b0, b1] = axis === 'u' ? [u0 - over, u1 + over, v0, v1] : [v0 - over, v1 + over, u0, u1];
    const bm = (b0 + b1) / 2;
    const be = b1 + over;
    // 右手前を向く面（axis 'v'）は、かげの側なので少し暗くする
    const face = axis === 'u' ? c : tone(c, -0.1);
    const dark = o.dark || tone(c, -0.3);
    const line = tone(dark, -0.25);
    const slope = (t, s) => at(a0 + (a1 - a0) * s, bm + (be - bm) * t, ridge + (eave - ridge) * t);
    let out = '';
    // ゆるい屋根は、むねの向こうの面も少し見える
    if (rise + drop < 20 * (bm - b0 + over)) {
      out += poly([at(a0, bm, ridge), at(a1, bm, ridge), at(a1, b0 - over, eave), at(a0, b0 - over, eave)], tone(face, 0.12));
    }
    out += poly([slope(0, 0), slope(0, 1), slope(1, 1), slope(1, 0)], face);
    out += flat([slope(0, 0), slope(0, 1), slope(0.26, 1), slope(0.26, 0)], tone(face, 0.2))
      + flat([slope(0.8, 0), slope(0.8, 1), slope(1, 1), slope(1, 0)], tone(face, -0.12));
    if (!o.plain) out += tiles(slope, a1 - a0, line);
    out += poly([slope(0, 0), slope(0, 1), slope(1, 1), slope(1, 0)], 'none');
    // のきの厚み
    out += poly([slope(1, 0), slope(1, 1), at(a1, be, eave - thick), at(a0, be, eave - thick)], dark, 1.1);
    // はふ（屋根の切り口）。むねの手前の はし（a1）に見える
    out += poly([at(a1, be, eave), at(a1, bm, ridge), at(a1, b0 - over, eave), at(a1, b0 - over, eave - thick - 0.3), at(a1, bm, ridge - thick - 1), at(a1, be, eave - thick - 0.3)], axis === 'u' ? dark : tone(dark, 0.14), 1.1);
    // むね
    out += seg([at(a0, bm, ridge), at(a1, bm, ridge)], INK, 3.2) + seg([at(a0, bm, ridge), at(a1, bm, ridge)], dark, 1.8);
    return out;
  };
  /**
   * 寄棟（よせむね）・方形（ほうぎょう）の屋根。四角が正方形なら、てっぺんが 1 点になる。
   * @param {{ over?: number, drop?: number, thick?: number, dark?: string, plain?: boolean, cap?: string, curl?: number, hip?: number }} [o]
   *   curl を付けると、のきの かどが そり上がる（お寺・お城の屋根）
   */
  const hipRoof = (u0, v0, u1, v1, z, rise, c, o = {}) => {
    const over = o.over ?? 0.06;
    const drop = o.drop ?? 1.2;
    const thick = o.thick ?? 1.8;
    const curl = o.curl || 0;
    const ua = u0 - over; const ub = u1 + over; const va = v0 - over; const vb = v1 + over;
    const ez = z - drop; const rz = z + rise;
    const lu = ub - ua; const lv = vb - va;
    // hip を 1 より小さくすると、むねが長くなる（つまの面が急になる。お寺の大屋根）
    const inset = (Math.min(lu, lv) / 2) * (o.hip ?? 1);
    const um = (ua + ub) / 2; const vm = (va + vb) / 2;
    // むねの 奥の はし（r1）と 手前の はし（r2）
    const alongU = lu >= lv;
    const r1 = alongU ? [ua + inset, vm, rz] : [um, va + inset, rz];
    const r2 = alongU ? [ub - inset, vm, rz] : [um, vb - inset, rz];
    // のきの かど（そり上がる分だけ高い）と、のきの まん中（そりの分だけ たるむ）
    const A = [ua, vb, ez + curl]; const B = [ub, vb, ez + curl]; const C = [ub, va, ez + curl];
    const sag = curl * 0.55;
    const dark = o.dark || tone(c, -0.3);
    const line = tone(dark, -0.25);
    const seC = tone(c, -0.16);
    const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
    const down = (p, d) => [p[0], p[1], p[2] - d];
    // 左手前の面: のき A→B、上の辺 L→R。右手前の面: のき B→C、上の辺 L→R（B の側が L）
    const swL = alongU ? r1 : r2; const swR = r2;
    const seL = r2; const seR = alongU ? r2 : r1;
    // のきから t だけ上がった所の線（t=1 が のき、t=0 が上の辺）。まん中が たるむ曲線
    const course = (L, R, E0, E1, t) => {
      const p0 = lerp(L, E0, t); const p1 = lerp(R, E1, t);
      const mid = down(lerp(p0, p1, 0.5), (curl + sag) * t);
      return [p0, mid, p1];
    };
    const q = (pts) => `Q${pt(pts[1])} ${pt(pts[2])}`;
    const faceD = (L, R, E0, E1) => { const e = course(L, R, E0, E1, 1); return `M${pt(e[0])}${q(e)}L${pt(R)}L${pt(L)}Z`; };
    const strip = (L, R, E0, E1, t0, t1) => {
      const a = course(L, R, E0, E1, t0); const b = course(L, R, E0, E1, t1);
      return `M${pt(a[0])}${q(a)}L${pt(b[2])}Q${pt(b[1])} ${pt(b[0])}Z`;
    };
    const fill = (d, color, width, opacity) => `<path d="${d}" fill="${color}"${width ? pen(width) : ''}${op(opacity)}/>`;
    const swD = faceD(swL, swR, A, B); const seD = faceD(seL, seR, B, C);
    let out = fill(swD, c, 1.2) + fill(seD, seC, 1.2);
    out += fill(strip(swL, swR, A, B, 0, 0.26), tone(c, 0.2)) + fill(strip(swL, swR, A, B, 0.8, 1), tone(c, -0.12))
      + fill(strip(seL, seR, B, C, 0.8, 1), tone(seC, -0.12));
    if (!o.plain) {
      for (const t of [0.3, 0.55, 0.8]) {
        const a = course(swL, swR, A, B, t); const b = course(seL, seR, B, C, t);
        out += `<path d="M${pt(a[0])}${q(a)}" fill="none"${pen(0.8, line)} opacity="0.7"/><path d="M${pt(b[0])}${q(b)}" fill="none"${pen(0.8, line)} opacity="0.7"/>`;
      }
    }
    out += fill(swD, 'none', 1.2) + fill(seD, 'none', 1.2);
    // のきの厚み（のきの曲線に沿わせる）
    const eaveBand = (E0, E1, color) => {
      const e = course(E0, E1, E0, E1, 1);
      const lo = e.map((p) => down(p, thick));
      return `<path d="M${pt(e[0])}${q(e)}L${pt(lo[2])}Q${pt(lo[1])} ${pt(lo[0])}Z" fill="${color}"${pen(1.1)}/>`;
    };
    out += eaveBand(A, B, dark) + eaveBand(B, C, tone(dark, -0.14));
    // すみむね（面と面の さかい）と むね
    out += seg([B, r2], INK, 2.6) + seg([B, r2], dark, 1.3);
    if (r1[0] !== r2[0] || r1[1] !== r2[1]) out += seg([r1, r2], INK, 3.2) + seg([r1, r2], dark, 1.8);
    if (o.cap) out += dot(r2[0], r2[1], rz + 0.6, 1.5, o.cap, 0.8);
    return out;
  };
  /** 平らな屋根の ふち（立ち上がり）と、その内がわの屋上 */
  const parapet = (u0, v0, u1, v1, z, hgt, c, o = {}) => {
    const e = o.over ?? 0.02;
    const rim = o.rim ?? 0.05;
    return box(u0 - e, v0 - e, u1 + e, v1 + e, z, z + hgt, c, { top: tone(c, 0.2), lw: 1.1 })
      + pad(u0 - e + rim, v0 - e + rim, u1 + e - rim, v1 + e - rim, o.floor || tone(c, -0.08), 0.7, INK, z + hgt);
  };

  // ── 丸いもの ──
  /** 円の ふちの上の点（画面の座標）。a は角度（0=右、90°=手前、180°=左） */
  const arc = (cx, cy, r, a0, a1, steps = 8) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = a0 + ((a1 - a0) * i) / steps;
      pts.push(`${f(cx + Math.cos(a) * r * RX)} ${f(cy + Math.sin(a) * r * RY)}`);
    }
    return pts;
  };
  /**
   * 円柱。c は明るい側の色。右がわを かげにして丸みを出す。
   * @param {{ top?: string|false, lw?: number }} [o] top=false で上の面を描かない（屋根を のせるとき）
   */
  const cyl = (u, v, r, z0, z1, c, o = {}) => {
    const cx = X(u, v);
    const yb = Y(u, v, z0);
    const yt = Y(u, v, z1);
    const rx = r * RX; const ry = r * RY;
    const lw = o.lw ?? 1.2;
    const side = (a0, a1) => `M${arc(cx, yt, r, a0, a1).join('L')}L${arc(cx, yb, r, a1, a0).join('L')}Z`;
    let out = `<path d="M${f(cx - rx)} ${f(yt)}L${f(cx - rx)} ${f(yb)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(yb)}L${f(cx + rx)} ${f(yt)}Z" fill="${c}"${pen(lw)}/>`;
    out += `<path d="${side(0, Math.PI * 0.38)}" fill="${tone(c, -0.2)}" opacity="0.85"/>`
      + `<path d="${side(Math.PI * 0.62, Math.PI * 0.8)}" fill="${tone(c, 0.22)}" opacity="0.8"/>`;
    out += `<path d="M${f(cx - rx)} ${f(yt)}L${f(cx - rx)} ${f(yb)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(yb)}L${f(cx + rx)} ${f(yt)}" fill="none"${pen(lw)}/>`;
    if (o.top !== false) out += `<ellipse cx="${f(cx)}" cy="${f(yt)}" rx="${f(rx)}" ry="${f(ry)}" fill="${o.top || tone(c, 0.18)}"${pen(lw)}/>`;
    return out;
  };
  /** 円すい（とんがり屋根）。z0 が のき、z1 が てっぺん */
  const cone = (u, v, r, z0, z1, c, o = {}) => {
    const cx = X(u, v);
    const yb = Y(u, v, z0);
    const yt = Y(u, v, z1);
    const rx = r * RX; const ry = r * RY;
    const lw = o.lw ?? 1.2;
    const d = `M${f(cx - rx)} ${f(yb)}L${f(cx)} ${f(yt)}L${f(cx + rx)} ${f(yb)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx)} ${f(yb)}Z`;
    return `<path d="${d}" fill="${c}"${pen(lw)}/>`
      + `<path d="M${f(cx)} ${f(yt)}L${arc(cx, yb, r, 0, Math.PI * 0.42).join('L')}Z" fill="${tone(c, -0.22)}" opacity="0.85"/>`
      + `<path d="M${f(cx)} ${f(yt)}L${arc(cx, yb, r, Math.PI * 0.6, Math.PI * 0.78).join('L')}Z" fill="${tone(c, 0.24)}" opacity="0.8"/>`
      + `<path d="${d}" fill="none"${pen(lw)}/>`;
  };
  /** 丸屋根（ドーム）。z0 が ふち、hgt が高さ */
  const dome = (u, v, r, z0, hgt, c, o = {}) => {
    const cx = X(u, v);
    const yb = Y(u, v, z0);
    const rx = r * RX; const ry = r * RY;
    const lw = o.lw ?? 1.2;
    const d = `M${f(cx - rx)} ${f(yb)}A${f(rx)} ${f(hgt)} 0 0 1 ${f(cx + rx)} ${f(yb)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx)} ${f(yb)}Z`;
    return `<path d="${d}" fill="${c}"${pen(lw)}/>`
      + `<path d="M${f(cx + rx * 0.2)} ${f(yb - hgt * 0.97)}A${f(rx)} ${f(hgt)} 0 0 1 ${f(cx + rx)} ${f(yb)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx + rx * 0.35)} ${f(yb + ry * 0.93)}Q${f(cx + rx * 0.62)} ${f(yb - hgt * 0.5)} ${f(cx + rx * 0.2)} ${f(yb - hgt * 0.97)}Z" fill="${tone(c, -0.2)}" opacity="0.8"/>`
      + `<ellipse cx="${f(cx - rx * 0.42)}" cy="${f(yb - hgt * 0.55)}" rx="${f(rx * 0.16)}" ry="${f(hgt * 0.22)}" fill="${tone(c, 0.4)}" opacity="0.7" transform="rotate(24 ${f(cx - rx * 0.42)} ${f(yb - hgt * 0.55)})"/>`
      + `<path d="${d}" fill="none"${pen(lw)}/>`;
  };

  // ── 草木・小物 ──
  /** しげみ。s は大きさ。o.flowers に色の配列を渡すと花がつく */
  const bush = (u, v, s = 1, o = {}) => {
    const [x, y] = xy(u, v, 0);
    const dark = o.dark || '#17402a'; const mid = o.mid || '#34994d'; const lite = o.lite || '#5cc45c'; const hi = o.hi || '#9be37a';
    const e = (dx, dy, rx, ry, fill) => `<ellipse cx="${f(x + dx * s)}" cy="${f(y + dy * s)}" rx="${f(rx * s)}" ry="${f(ry * s)}" fill="${fill}"/>`;
    let out = e(0, -3, 6.6, 5, dark) + e(5.2, -1.6, 4.6, 3.6, dark)
      + e(0, -3, 5.4, 3.9, mid) + e(5.2, -1.6, 3.5, 2.6, mid)
      + e(-1, -3.9, 4.2, 2.8, lite) + e(4.6, -2.2, 2.5, 1.7, lite)
      + e(-2.2, -5, 1.9, 1.2, hi);
    (o.flowers || []).forEach((color, i) => {
      const spots = [[1.6, -2.6], [-3, -2.4], [5.4, -1.2], [-0.6, -5.2]];
      const [dx, dy] = spots[i % spots.length];
      out += `<circle cx="${f(x + dx * s)}" cy="${f(y + dy * s)}" r="${f(1 * s)}" fill="${color}"/>`;
    });
    return out;
  };
  /** 丸い木（敷地の植えこみ用の小さな木）。s は大きさ */
  const tree = (u, v, s = 1, o = {}) => {
    const [x, y] = xy(u, v, 0);
    const dark = o.dark || '#17402a'; const mid = o.mid || '#2f9148'; const lite = o.lite || '#57c05a'; const hi = o.hi || '#9be37a';
    const c = (dx, dy, r, fill) => `<circle cx="${f(x + dx * s)}" cy="${f(y + dy * s)}" r="${f(r * s)}" fill="${fill}"/>`;
    return `<path d="M${f(x - 1.3 * s)} ${f(y)}L${f(x - 0.9 * s)} ${f(y - 8 * s)}L${f(x + 0.9 * s)} ${f(y - 8 * s)}L${f(x + 1.3 * s)} ${f(y)}Z" fill="#8a5a33"${pen(0.8)}/>`
      + c(0, -13.4, 7.4, dark) + c(-4.8, -10, 5.4, dark) + c(4.9, -10.2, 5.2, dark)
      + c(0, -13.4, 6.3, mid) + c(-4.8, -10, 4.3, mid) + c(4.9, -10.2, 4.1, mid)
      + c(-1.6, -14.8, 4.6, lite) + c(-5.2, -10.8, 2.8, lite) + c(4, -11.2, 2.6, lite)
      + c(-3, -16.2, 1.9, hi);
  };
  /** とがった木（もみの木のような形） */
  const fir = (u, v, s = 1, o = {}) => {
    const [x, y] = xy(u, v, 0);
    const dark = o.dark || '#14532d'; const mid = o.mid || '#1f7a3f'; const lite = o.lite || '#3fa65a';
    const tri = (yy, half, hgt, fill, width) => `<path d="M${f(x - half * s)} ${f(y - yy * s)}L${f(x)} ${f(y - (yy + hgt) * s)}L${f(x + half * s)} ${f(y - yy * s)}Z" fill="${fill}"${width ? pen(width, dark) : ''}/>`;
    return `<path d="M${f(x - 1 * s)} ${f(y)}L${f(x - 1 * s)} ${f(y - 4 * s)}L${f(x + 1 * s)} ${f(y - 4 * s)}L${f(x + 1 * s)} ${f(y)}Z" fill="#7a4a2a"${pen(0.7)}/>`
      + tri(3, 6.4, 9, mid, 1) + tri(8, 5.2, 8.4, mid, 1) + tri(13, 3.8, 7.6, mid, 1)
      + `<path d="M${f(x - 6.4 * s)} ${f(y - 3 * s)}L${f(x)} ${f(y - 12 * s)}L${f(x - 1.6 * s)} ${f(y - 3 * s)}Z" fill="${lite}"/>`
      + `<path d="M${f(x - 5.2 * s)} ${f(y - 8 * s)}L${f(x)} ${f(y - 16.4 * s)}L${f(x - 1.4 * s)} ${f(y - 8 * s)}Z" fill="${lite}"/>`
      + `<path d="M${f(x - 3.8 * s)} ${f(y - 13 * s)}L${f(x)} ${f(y - 20.6 * s)}L${f(x - 1 * s)} ${f(y - 13 * s)}Z" fill="${lite}"/>`;
  };
  /** 草の かたまり（地面の かざり） */
  const tuft = (u, v, s = 1, color = '#5aa23d') => {
    const [x, y] = xy(u, v, 0);
    return `<path transform="translate(${f(x)} ${f(y)}) scale(${f(s)})" d="M-2.6 .4q.5-2.4-.6-4.2 1.7 1.2 2 3.2.3-2.8 1.6-4.6.3 2.5-.2 4.6 1-1.6 2.5-2.1-.6 1.6-1.3 3.1z" fill="${color}"/>`;
  };
  /** はち植え（入口の よこに置く丸い木） */
  const pot = (u, v, s = 1, leaf = '#34994d') => {
    const [x, y] = xy(u, v, 0);
    return `<path d="M${f(x - 2.6 * s)} ${f(y - 4 * s)}L${f(x + 2.6 * s)} ${f(y - 4 * s)}L${f(x + 1.9 * s)} ${f(y)}L${f(x - 1.9 * s)} ${f(y)}Z" fill="#c26a3d"${pen(0.8)}/>`
      + `<circle cx="${f(x)}" cy="${f(y - 7.4 * s)}" r="${f(4.1 * s)}" fill="#17402a"/>`
      + `<circle cx="${f(x)}" cy="${f(y - 7.4 * s)}" r="${f(3.3 * s)}" fill="${leaf}"/>`
      + `<circle cx="${f(x - 1.1 * s)}" cy="${f(y - 8.6 * s)}" r="${f(1.7 * s)}" fill="${tone(leaf, 0.35)}"/>`;
  };
  /** 小さな花（地面に ちらす） */
  const flowers = (spots, colors = ['#ff8fb8', '#ffd24a', '#ffffff']) => spots
    .map(([u, v], i) => dot(u, v, 1.1, 1.05, colors[i % colors.length], 0.4))
    .join('');
  /** はたと さお。color は はたの色。dir=1 で右へ なびく */
  const flag = (u, v, z0, z1, color, o = {}) => {
    const dir = o.dir ?? 1;
    const len = o.len ?? 6.5;
    const hgt = o.hgt ?? 4;
    const [x, y] = xy(u, v, z1);
    return seg([[u, v, z0], [u, v, z1]], o.pole || '#5b4636', 1.1)
      + `<path d="M${f(x)} ${f(y)}L${f(x + dir * len)} ${f(y + hgt / 2)}L${f(x)} ${f(y + hgt)}Z" fill="${color}"${pen(0.7)}/>`
      + `<circle cx="${f(x)}" cy="${f(y - 0.7)}" r="0.9" fill="#ffd24a"${pen(0.45)}/>`;
  };
  /** けむり（白い丸を 3 つ、上へ うすく） */
  const smoke = (u, v, z, s = 1) => {
    const [x, y] = xy(u, v, z);
    return `<circle cx="${f(x + 1 * s)}" cy="${f(y)}" r="${f(2.3 * s)}" fill="#ffffff" opacity="0.85"/>`
      + `<circle cx="${f(x + 3.4 * s)}" cy="${f(y - 4.4 * s)}" r="${f(3 * s)}" fill="#ffffff" opacity="0.7"/>`
      + `<circle cx="${f(x + 1.4 * s)}" cy="${f(y - 9.6 * s)}" r="${f(2.2 * s)}" fill="#ffffff" opacity="0.5"/>`;
  };
  /** 石の かいだん（面から手前へ n 段） */
  const steps = (face, t0, t1, n = 2, o = {}) => {
    const rise = o.rise ?? 1.3;
    const run = o.run ?? 0.045;
    const c = o.color || '#ddd6ca';
    let out = '';
    for (let i = n; i >= 1; i--) {
      const near = face.out(run * i);
      const far = face.out(run * (i - 1));
      const zt = rise * (n - i + 1);
      out += poly([far(t0, zt), far(t1, zt), near(t1, zt), near(t0, zt)], c, 0.8)
        + poly(rect(near, t0, t1, zt - rise, zt), tone(c, -0.14), 0.8);
    }
    return out;
  };

  /** 屋上の 空調の機械（平らな屋根が のっぺりしないように置く） */
  const acUnit = (u, v, z, s = 1) => box(u, v, u + 0.11 * s, v + 0.09 * s, z, z + 2.6 * s, '#dfe4ea', { top: '#eef1f5', lw: 0.8 })
    + oval(u + 0.055 * s, v + 0.045 * s, z + 2.6 * s, 2.3 * s, 1.15 * s, '#8a94a3', 0.5);
  /** 屋上の 明かりとり（ガラスの天窓） */
  const skylight = (u0, v0, u1, v1, z) => poly([[u0, v0, z], [u1, v0, z], [u1, v1, z], [u0, v1, z]], '#9fdcf7', 0.8)
    + flat([[u0, v0, z], [u0 + (u1 - u0) * 0.45, v0, z], [u0, v0 + (v1 - v0) * 0.6, z]], '#dff4ff', 0.8);
  /** 絵を、置き方の決まりに合う形に包む（id を付けて <defs> に入れられる形） */
  const wrap = (markup, id) => `<g${id ? ` id="${id}"` : ''} transform="translate(50 50) scale(${f(5 / (w + h))})">${markup}</g>`;

  return {
    w, h, X, Y, xy, path, poly, flat, seg, bar, curve, dot, oval, disc, shape,
    SW, SE, rect, panel, band, rule, onFace, billboard,
    box, pad, shadow, roundShadow, plinth, eaveShade,
    win, wins, glass, door, awning, sign,
    tiles, gableWalls, gableRoof, hipRoof, parapet,
    cyl, cone, dome,
    bush, tree, fir, tuft, pot, flowers, flag, smoke, steps, acUnit, skylight,
    wrap,
  };
}

/** 画面の座標で絵を書くときの、線の書き方と 数の書き方（buildings-art.js が使う） */
export { pen, f as num };
