// 絵（SVG の文字列）を、ある点を動かさずに 大きく・小さくする — マイ漢字タウン
//
// 絵の大きさを直したいとき、<g transform="scale(…)"> で包むと、ブラウザが その絵を
// 「別の合成の単位」として扱う（町に たくさん置く絵では、その数だけ重くなる）。
// ここでは 絵の中の数（座標・半径）そのものを書きかえるので、合成の単位は増えない。
//
// あつかう形: <path d="…">・<circle>・<ellipse>。path は M L H V C S Q T A Z（大文字・小文字）。
// 線の太さ（stroke-width）は、ことわりが無ければ変えない（ほかの絵と 線の太さを そろえるため）。
// 図形を回すとき（rotatePath・ellipsePath）も、transform を付けずに 座標を書きかえる。
// ⚠️ scaleArt は、transform の付いた図形を あつかわない（回した図形の まん中が ずれる）。付いていたら例外にする。

const fmt = (v) => String(Math.round(v * 100) / 100);

/** 命令ごとの、数の意味。x・y は座標、r は半径（倍率だけ かける）、- は そのまま（角度・しるし） */
const PARAMS = {
  M: 'xy', L: 'xy', T: 'xy', H: 'x', V: 'y', C: 'xyxyxy', S: 'xyxy', Q: 'xyxy', A: 'rr---xy', Z: '',
};

/**
 * path の d を書きかえる。
 * @param {string} d
 * @param {number} s 倍率
 * @param {number} cx 動かさない点の x
 * @param {number} cy 動かさない点の y
 */
export function scalePath(d, s, cx = 0, cy = 0) {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
  let out = '';
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i++];
    const kinds = PARAMS[cmd.toUpperCase()];
    if (kinds === undefined) throw new Error(`scalePath: 知らない命令 ${cmd}`);
    const relative = cmd !== cmd.toUpperCase();
    if (kinds === '') { out += cmd; continue; }
    // 同じ命令の くり返し（M 1 2 3 4 のように、命令の字を はぶいた書き方）も そのまま写す
    let first = true;
    do {
      const nums = [];
      for (const kind of kinds) {
        const value = Number(tokens[i++]);
        if (!Number.isFinite(value)) throw new Error(`scalePath: 数が足りない（${cmd}）`);
        if (kind === '-') nums.push(fmt(value));
        else if (kind === 'r' || relative) nums.push(fmt(value * s));
        else nums.push(fmt((kind === 'x' ? cx : cy) + (value - (kind === 'x' ? cx : cy)) * s));
      }
      out += (first ? cmd : ' ') + nums.join(' ');
      first = false;
    } while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i]));
  }
  return out;
}

/**
 * 絵ぜんたい（図形を並べた文字列）を書きかえる。
 * @param {string} markup
 * @param {number} s 倍率
 * @param {number} cx 動かさない点の x（ふつうは 足もと）
 * @param {number} cy 動かさない点の y
 * @param {number} [strokeScale] 線の太さに かける倍率（ふつうは 1 = 変えない。うんと小さくするときだけ 細くする）
 */
export function scaleArt(markup, s, cx = 0, cy = 0, strokeScale = 1) {
  if (/\stransform=/.test(markup)) throw new Error('scaleArt: transform の付いた図形は あつかえない');
  const X = (v) => fmt(cx + (Number(v) - cx) * s);
  const Y = (v) => fmt(cy + (Number(v) - cy) * s);
  const R = (v) => fmt(Number(v) * s);
  const out = markup
    .replace(/\sd="([^"]*)"/g, (all, d) => ` d="${scalePath(d, s, cx, cy)}"`)
    .replace(/\scx="([^"]*)"/g, (all, v) => ` cx="${X(v)}"`)
    .replace(/\scy="([^"]*)"/g, (all, v) => ` cy="${Y(v)}"`)
    .replace(/\s(r|rx|ry)="([^"]*)"/g, (all, name, v) => ` ${name}="${R(v)}"`);
  return strokeScale === 1 ? out : out.replace(/\sstroke-width="([^"]*)"/g, (all, v) => ` stroke-width="${fmt(Number(v) * strokeScale)}"`);
}

/**
 * path の d を、点 (cx, cy) のまわりに deg 度 回す（時計まわりが正。SVG の rotate と同じ向き）。
 * よこ・たての線（H・V）は ななめの線（L）に書きかえる。
 */
export function rotatePath(d, deg, cx = 0, cy = 0) {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad); const sin = Math.sin(rad);
  const point = (x, y) => `${fmt(cx + (x - cx) * cos - (y - cy) * sin)} ${fmt(cy + (x - cx) * sin + (y - cy) * cos)}`;
  const vector = (x, y) => `${fmt(x * cos - y * sin)} ${fmt(x * sin + y * cos)}`;
  let out = '';
  let i = 0;
  // いまの点（回す前の座標）。H・V を点にするのに要る
  let px = 0; let py = 0; let sx = 0; let sy = 0;
  const next = () => {
    const value = Number(tokens[i++]);
    if (!Number.isFinite(value)) throw new Error('rotatePath: 数が足りない');
    return value;
  };
  while (i < tokens.length) {
    const cmd = tokens[i++];
    const upper = cmd.toUpperCase();
    const relative = cmd !== upper;
    if (PARAMS[upper] === undefined) throw new Error(`rotatePath: 知らない命令 ${cmd}`);
    if (upper === 'Z') { out += 'Z'; px = sx; py = sy; continue; }
    let first = true;
    do {
      if (upper === 'H' || upper === 'V') {
        const value = next();
        const x = upper === 'H' ? (relative ? px + value : value) : px;
        const y = upper === 'V' ? (relative ? py + value : value) : py;
        out += (relative ? 'l' + vector(x - px, y - py) : 'L' + point(x, y));
        px = x; py = y;
      } else if (upper === 'A') {
        const rx = next(); const ry = next(); const rot = next(); const large = next(); const sweep = next(); const x = next(); const y = next();
        out += `${first ? cmd : ' '}${fmt(rx)} ${fmt(ry)} ${fmt(rot + deg)} ${large} ${sweep} ${relative ? vector(x, y) : point(x, y)}`;
        px = relative ? px + x : x; py = relative ? py + y : y;
      } else {
        const count = PARAMS[upper].length / 2;
        const parts = [];
        let x = px; let y = py;
        for (let n = 0; n < count; n++) {
          const vx = next(); const vy = next();
          parts.push(relative ? vector(vx, vy) : point(vx, vy));
          x = relative ? px + vx : vx; y = relative ? py + vy : vy;
        }
        out += (first ? cmd : ' ') + parts.join(' ');
        px = x; py = y;
        if (upper === 'M' && first) { sx = px; sy = py; }
      }
      first = false;
    } while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i]));
  }
  return out;
}

/** だ円を path の d にする（deg 度 回せる）。回した だ円を、transform を使わずに描くため */
export function ellipsePath(cx, cy, rx, ry, deg = 0) {
  const k = 0.5523;
  const d = `M${fmt(cx + rx)} ${fmt(cy)}C${fmt(cx + rx)} ${fmt(cy + ry * k)} ${fmt(cx + rx * k)} ${fmt(cy + ry)} ${fmt(cx)} ${fmt(cy + ry)}`
    + `C${fmt(cx - rx * k)} ${fmt(cy + ry)} ${fmt(cx - rx)} ${fmt(cy + ry * k)} ${fmt(cx - rx)} ${fmt(cy)}`
    + `C${fmt(cx - rx)} ${fmt(cy - ry * k)} ${fmt(cx - rx * k)} ${fmt(cy - ry)} ${fmt(cx)} ${fmt(cy - ry)}`
    + `C${fmt(cx + rx * k)} ${fmt(cy - ry)} ${fmt(cx + rx)} ${fmt(cy - ry * k)} ${fmt(cx + rx)} ${fmt(cy)}Z`;
  return deg ? rotatePath(d, deg, cx, cy) : d;
}

/**
 * 絵の おおよその はんい（図形の座標の 最小・最大）。もちもの欄などで、絵を わくに合わせるのに使う。
 * 曲線は「手がかりの点」まで ふくめるので、ほんとうの はんいより 少し大きめに出る。線の太さは ふくめない。
 * <g transform> の中の図形は、その中の座標のまま数える（小さな しるし用。はんいが大きく くるうことは無い）。
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number } | null} 図形が無ければ null
 */
export function artBounds(markup) {
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  const add = (x, y) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };
  for (const m of markup.matchAll(/\sd="([^"]*)"/g)) {
    const tokens = m[1].match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
    let i = 0; let px = 0; let py = 0; let sx = 0; let sy = 0;
    while (i < tokens.length) {
      const cmd = tokens[i++];
      const upper = cmd.toUpperCase();
      const relative = cmd !== upper;
      if (PARAMS[upper] === undefined) throw new Error(`artBounds: 知らない命令 ${cmd}`);
      if (upper === 'Z') { px = sx; py = sy; continue; }
      let first = true;
      do {
        if (upper === 'H') { const v = Number(tokens[i++]); px = relative ? px + v : v; add(px, py); }
        else if (upper === 'V') { const v = Number(tokens[i++]); py = relative ? py + v : v; add(px, py); }
        else if (upper === 'A') {
          const ry = Number(tokens[i + 1]);
          const x = Number(tokens[i + 5]); const y = Number(tokens[i + 6]);
          i += 7;
          const ex = relative ? px + x : x; const ey = relative ? py + y : y;
          // 弧は 両はしの点より ふくらむ。たての ふくらみ（半径）だけ、大きめに見ておく
          add(px, py - ry); add(px, py + ry); add(ex, ey - ry); add(ex, ey + ry);
          px = ex; py = ey;
        } else {
          const count = PARAMS[upper].length / 2;
          let x = px; let y = py;
          for (let n = 0; n < count; n++) {
            const vx = Number(tokens[i++]); const vy = Number(tokens[i++]);
            x = relative ? px + vx : vx; y = relative ? py + vy : vy;
            add(x, y);
          }
          px = x; py = y;
          if (upper === 'M' && first) { sx = px; sy = py; }
        }
        first = false;
      } while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i]));
    }
  }
  for (const m of markup.matchAll(/<(?:circle|ellipse)\b[^>]*>/g)) {
    const num = (name) => { const v = new RegExp(`\\s${name}="([^"]*)"`).exec(m[0]); return v ? Number(v[1]) : 0; };
    const r = num('r');
    const rx = num('rx') || r; const ry = num('ry') || r;
    add(num('cx') - rx, num('cy') - ry); add(num('cx') + rx, num('cy') + ry);
  }
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
}

