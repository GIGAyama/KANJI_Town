import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  VILLAGER_BOX, VILLAGER_KINDS, VILLAGER_SCALE, VILLAGER_VARIANTS,
  villagerArt, villagerArtDef, villagerArtId, villagerHeight, villagerKind, villagerTop, villagerVariantOf,
} from '../src/data/villager-art.js';
import { OCCUPATIONS } from '../src/data/residents.js';

// 住民の絵は、文字列で作って文書に 1 回だけ置き、住民 1 人は <use href="#vil-職業-番号"> で呼びだす。
// 職業の id と絵の名前が食いちがうと、その職業の住民だけが見えなくなる（エラーにはならない）。
// また、住民は 1 人ずつ別の合成レイヤーなので、絵の中に フィルターや opacity を入れると 人数分だけ重くなる。

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

test('住民を描く部品は、新しい絵を使い、フィルターを使わない', () => {
  const dot = read('../src/components/town/VillagerDot.jsx');
  const art = read('../src/components/town/VillagerArt.jsx');
  assert.match(dot, /VillagerFigure/);
  assert.match(art, /villagerArtDef/);
  for (const [name, source] of [['VillagerDot.jsx', dot], ['VillagerArt.jsx', art]]) {
    assert.ok(!/iso-avatar|IsoAvatar/.test(source), `${name}: 前の絵を読んでいる`);
    assert.ok(!/drop-shadow|filter=|filter:/.test(source), `${name}: フィルターを使っている`);
  }
  assert.equal(existsSync(new URL('../src/data/iso-avatar.jsx', import.meta.url)), false, '前の絵のファイルが残っている');
  // 名札の漢字は うら返さない: 向きは <use> だけに付ける
  assert.match(art, /<use href=\{`#\$\{villagerArtId\(kind, variant\)\}`\} transform=\{facesRight \? FACE_RIGHT : FACE_LEFT\} \/>/);
});
