import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  VILLAGER_BOX, VILLAGER_KINDS, VILLAGER_SCALE, VILLAGER_VARIANTS,
  villagerArt, villagerArtDef, villagerArtId, villagerHeight, villagerKind, villagerSpriteSvg, villagerTagPath, villagerTagTextY,
  villagerTop, villagerVariantOf,
} from '../src/data/villager-art.js';
import { OCCUPATIONS } from '../src/data/residents.js';

// 住民の絵は、文字列で作る。住民の一覧の顔は 文書に 1 回だけ置き、<use href="#vil-職業-番号"> で呼びだす。
// 職業の id と絵の名前が食いちがうと、その職業の住民だけが見えなくなる（エラーにはならない）。
// 町を歩く住民は、同じ絵を 画像にして 1 枚の canvas に描く（VillagerCanvas.jsx）。

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('住民の絵: どの職業・色ちがいも壊れていない', () => {
  assert.equal(VILLAGER_KINDS.length, 6);
  for (const kind of VILLAGER_KINDS) {
    for (let variant = 0; variant < VILLAGER_VARIANTS; variant++) {
      const art = villagerArt(kind, variant);
      const label = `${kind}-${variant}`;
      assert.ok(art.length > 1500, `${label}: 絵が空に近い`);
      assert.ok(!/undefined|NaN|Infinity|null/.test(art), `${label}: 壊れた値 → ${/.{24}(?:undefined|NaN|Infinity|null).{24}/.exec(art)?.[0]}`);
      for (const m of art.matchAll(/(?:fill|stroke)="([^"]+)"/g)) {
        assert.ok(m[1] === 'none' || /^#[0-9a-f]{6}$/i.test(m[1]), `${label}: 色でない値 ${m[1]}`);
      }
      // 使う要素は 図形だけ。<g>・transform も使わない（合成の単位を増やさない）
      for (const m of art.matchAll(/<(\w+)/g)) assert.ok(['path', 'circle', 'ellipse'].includes(m[1]), `${label}: 思わぬ要素 <${m[1]}>`);
      assert.ok(!/<script|on\w+=|href=|url\(|filter|transform=|\sopacity=/i.test(art), `${label}: フィルター・opacity・transform などが混ざっている`);
      const def = villagerArtDef(kind, variant);
      assert.equal(def, `<g id="${villagerArtId(kind, variant)}">${art}</g>`);
    }
    assert.equal(villagerArt(kind, VILLAGER_VARIANTS), null, `${kind}: 色ちがいの数`);
    assert.equal(villagerArt(kind, -1), null);
    assert.equal(villagerArt(kind, 1.5), null);
  }
  assert.equal(villagerArt('no_such_job'), null);
  assert.equal(villagerArtDef('no_such_job'), '');
});

test('色ちがいは、ちがう絵になっている（職業どうしも）', () => {
  const all = new Set();
  for (const kind of VILLAGER_KINDS) {
    for (let variant = 0; variant < VILLAGER_VARIANTS; variant++) all.add(villagerArt(kind, variant));
  }
  assert.equal(all.size, VILLAGER_KINDS.length * VILLAGER_VARIANTS);
});

test('職業（data/residents.js）は、すべて絵がある', () => {
  assert.deepEqual(OCCUPATIONS.map((occ) => occ.id).sort(), [...VILLAGER_KINDS].sort());
  for (const occ of OCCUPATIONS) assert.equal(villagerKind(occ.id), occ.id);
  // 知らない職業・職業の無い古いデータは、農民の絵で出す
  assert.equal(villagerKind('astronaut'), 'farmer');
  assert.equal(villagerKind(undefined), 'farmer');
});

test('同じ住民は いつも同じ見た目で、住民どうしは ばらける', () => {
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    const id = `v_${i}_${String.fromCharCode(0x4e00 + i * 7)}`;
    const variant = villagerVariantOf(id);
    assert.ok(Number.isInteger(variant) && variant >= 0 && variant < VILLAGER_VARIANTS, id);
    assert.equal(villagerVariantOf(id), variant);
    seen.add(variant);
  }
  assert.equal(seen.size, VILLAGER_VARIANTS, '4 通りとも出る');
  // id の無い古いデータでも落ちない
  assert.equal(villagerVariantOf(undefined), villagerVariantOf(''));
});

test('絵は枠に収まり、名札は ぼうしの上に出る', () => {
  // 足もとの地面は、枠の下から 2px 上（影の下半分が入る）
  assert.equal(VILLAGER_BOX.y + VILLAGER_BOX.height, 2);
  assert.equal(VILLAGER_BOX.x * -2, VILLAGER_BOX.width);
  assert.ok(VILLAGER_SCALE > 0.6 && VILLAGER_SCALE <= 1);
  for (const kind of VILLAGER_KINDS) {
    const height = villagerHeight(kind);
    assert.ok(height >= 26 && height <= 40, `${kind}: 高さ ${height}`);
    assert.equal(villagerTop(kind), height * VILLAGER_SCALE);
    // 絵の中の いちばん上の点は、height をこえない（名札と ぼうしが重ならない）
    const ys = [];
    for (let variant = 0; variant < VILLAGER_VARIANTS; variant++) {
      const art = villagerArt(kind, variant);
      for (const m of art.matchAll(/cy="(-?[\d.]+)"(?: rx="[\d.]+")? r[y]?="([\d.]+)"/g)) ys.push(Number(m[1]) - Number(m[2]));
      for (const m of art.matchAll(/ d="([^"]+)"/g)) {
        // 絶対座標の命令（M・L・Q・H は x だけ）の y を拾う
        for (const p of m[1].matchAll(/[MLQ](-?[\d.]+) (-?[\d.]+)/g)) ys.push(Number(p[2]));
      }
    }
    const topmost = -Math.min(...ys);
    assert.ok(topmost <= height + 0.5, `${kind}: 絵の上のはし ${topmost} が、高さ ${height} をこえる`);
    assert.ok(topmost >= height - 4, `${kind}: 高さ ${height} が、絵の上のはし ${topmost} より高すぎる（名札が浮く）`);
  }
});

test('町を歩く住民は 1 枚の canvas に描き、文書（DOM）には 1 人ずつの部品を置かない', () => {
  const canvas = read('../src/components/town/VillagerCanvas.jsx');
  const art = read('../src/components/town/VillagerArt.jsx');
  const map = read('../src/components/town/DraggableTownMap.jsx');
  // 住民が 1 歩うごくたびに 文書を書きかえると、町の建物 600 けん ぶんの 重ね合わせを ブラウザが 毎回 やりなおし、
  // 町を ずらすのが 3〜4 倍 重くなっていた。canvas に描けば、その やりなおしが 0 回になる（測った）
  assert.match(canvas, /<canvas\b/);
  assert.match(canvas, /getContext\('2d'\)/);
  assert.match(canvas, /villagerSpriteSvg/);
  assert.match(map, /<VillagerCanvas\b/);
  assert.ok(!/VillagerDot|VillagerLayer|VillagerFigure/.test(map), 'DraggableTownMap.jsx: 前の 住民の部品を使っている');
  for (const name of ['VillagerDot.jsx', 'VillagerLayer.jsx']) {
    assert.equal(existsSync(new URL(`../src/components/town/${name}`, import.meta.url)), false, `前の住民の部品 ${name} が残っている`);
  }
  assert.equal(existsSync(new URL('../src/data/iso-avatar.jsx', import.meta.url)), false, '前の絵のファイルが残っている');
  // 住民の一覧の顔は いまの絵（<use>）を使う
  assert.match(art, /villagerArtDef/);
  assert.ok(!/VillagerFigure/.test(art), 'VillagerArt.jsx: 町を歩く住民の部品が残っている');
  for (const [name, source] of [['VillagerCanvas.jsx', canvas], ['VillagerArt.jsx', art]]) {
    const code = source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/iso-avatar|IsoAvatar/.test(code), `${name}: 前の絵を読んでいる`);
    assert.ok(!/drop-shadow|filter=|filter:|\.filter = /.test(code), `${name}: フィルターを使っている`);
    for (const word of ['willChange', 'will-change', 'transition', '.animate(', 'translate3d', 'translateZ']) {
      assert.ok(!code.includes(word), `${name}: ${word} を使っている`);
    }
  }
  // 名札の漢字は うら返さない: 左右の うら返しは 体の絵だけ（save と restore の あいだ）
  assert.match(canvas, /ctx\.save\(\);\s*if \(w\.facesRight\) ctx\.scale\(-1, 1\);\s*ctx\.drawImage\([^;]+;\s*ctx\.restore\(\);/);
  assert.ok(canvas.indexOf('ctx.restore();') < canvas.indexOf('ctx.fillText('), '名札の字を 体と いっしょに うら返している');
});

test('canvas 用の 1 人ぶんの絵は、枠の大きさのまま 4 倍の こまかさで作り、名札の形は 絵の高さに合わせる', () => {
  for (const kind of VILLAGER_KINDS) {
    for (let variant = 0; variant < VILLAGER_VARIANTS; variant++) {
      const svg = villagerSpriteSvg(kind, variant);
      assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" /, `${kind}-${variant}`);
      assert.ok(svg.includes(`viewBox="${VILLAGER_BOX.x} ${VILLAGER_BOX.y} ${VILLAGER_BOX.width} ${VILLAGER_BOX.height}"`));
      assert.ok(svg.includes(`width="${VILLAGER_BOX.width * 4}" height="${VILLAGER_BOX.height * 4}"`));
      assert.ok(svg.includes(`<g transform="scale(${VILLAGER_SCALE})">${villagerArt(kind, variant)}</g>`));
      // data: URL の画像は 外の資源を読めない（読めば 絵が出ない）
      assert.ok(!/href="(?!#)|url\((?!#)/.test(svg), `${kind}-${variant}: 外を読んでいる`);
    }
    const top = villagerTop(kind);
    const ys = [...villagerTagPath(top).matchAll(/[MLHVA ](-?[\d.]+)/g)].map((m) => Number(m[1]));
    assert.ok(Math.min(...ys) < -top - 3, `${kind}: 名札が 絵に重なる`);
    const textY = villagerTagTextY(top);
    assert.ok(textY < -top - 3 && textY > -top - 17, `${kind}: 名札の字が ふだから はみ出す (${textY})`);
  }
  assert.equal(villagerSpriteSvg('nobody'), '', '絵の無い職業は 空');
});
