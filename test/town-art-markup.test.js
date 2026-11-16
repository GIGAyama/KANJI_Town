import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NATURE_VARIANTS, natureArt, natureArtMarkup } from '../src/data/iso-svg/nature-art.js';
import { HOUSE_PALETTES, houseArt, houseArtMarkup } from '../src/data/iso-svg/house-art.js';
import { WILD_PROP_BOX, WILD_PROP_NAMES, wildPropFor, wildPropsMarkup } from '../src/data/wild-props-art.js';
import { GRID_SIZE } from '../src/systems/town-map-view.js';

// 木・花・岩と「小さな家」、野生の木や岩は、絵を文書に 1 回だけ置いて <use href="#…"> で呼びだす。
// 呼びだす名前と、置いてある絵の id が食いちがうと、その絵だけが町に出なくなる（エラーにはならない）。

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

/** 絵として壊れていないか（数や色に undefined・NaN が混ざっていないか） */
function assertCleanArt(markup, label) {
  assert.ok(markup.length > 100, `${label}: 絵が空に近い`);
  assert.ok(!/undefined|NaN|Infinity|null/.test(markup), `${label}: 壊れた値 → ${/.{24}(?:undefined|NaN|Infinity|null).{24}/.exec(markup)?.[0]}`);
  for (const m of markup.matchAll(/(?:fill|stroke)="([^"]+)"/g)) {
    assert.ok(m[1] === 'none' || /^#[0-9a-f]{6}$/i.test(m[1]), `${label}: 色でない値 ${m[1]}`);
  }
  assert.ok(!/<script|on\w+=|href=|url\(/i.test(markup), `${label}: 絵のほかのものが混ざっている`);
  // タグは閉じている（<g>…</g> の数が合い、ほかは自分で閉じる）
  assert.equal((markup.match(/<g[ >]/g) || []).length, (markup.match(/<\/g>/g) || []).length, `${label}: <g> が閉じていない`);
}

test('自然物の絵: 種類ごとの数だけ id があり、壊れていない', () => {
  const markup = natureArtMarkup();
  for (const [kind, count] of Object.entries(NATURE_VARIANTS)) {
    assert.ok(count >= 1);
    for (let i = 0; i < count; i++) {
      assert.ok(markup.includes(`id="nat-${kind}-${i}"`), `nat-${kind}-${i} が無い`);
      assertCleanArt(natureArt(`${kind}-${i}`), `${kind}-${i}`);
    }
    assert.equal(natureArt(`${kind}-${count}`), null, `${kind} の数が表と合わない`);
  }
  assert.equal((markup.match(/ id="/g) || []).length, Object.values(NATURE_VARIANTS).reduce((sum, n) => sum + n, 0));
});

test('nature.jsx が呼びだす種類は、すべて絵がある', () => {
  const source = read('../src/data/iso-svg/nature.jsx');
  const kinds = [...source.matchAll(/kind="(\w+)"/g)].map((m) => m[1]);
  assert.ok(kinds.length >= 8);
  for (const kind of kinds) assert.ok(NATURE_VARIANTS[kind] >= 1, `${kind} の絵が無い`);
  // 出やすさ（weights）の数は、絵の数と同じ
  for (const m of source.matchAll(/kind="(\w+)"[^/]*weights=\{\[([^\]]+)\]\}/g)) {
    assert.equal(m[2].split(',').length, NATURE_VARIANTS[m[1]], `${m[1]} の weights の数`);
  }
});

test('「小さな家」の絵: 色は 8 通りで、壊れていない', () => {
  const markup = houseArtMarkup();
  assert.equal(HOUSE_PALETTES.length, 8);
  HOUSE_PALETTES.forEach((palette, i) => {
    assert.ok(markup.includes(`id="house1-${i}"`));
    assertCleanArt(houseArt(i), `house1-${i}`);
    for (const color of Object.values(palette)) assert.match(color, /^#[0-9a-f]{6}$/);
  });
});

test('野生の木や岩: 地形から決まる絵の名前は、すべて絵がある', () => {
  const markup = wildPropsMarkup();
  for (const name of WILD_PROP_NAMES) assert.ok(markup.includes(`<symbol id="wp-${name}"`), name);
  assertCleanArt(markup.replace(/<\/?symbol[^>]*>/g, ''), 'wild props');
  const used = new Set();
  for (const terrain of ['t_forest_floor', 't_roughland', 't_bedrock', 't_grassland', 't_cleared']) {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const name = wildPropFor(terrain, x, y);
        if (name === null) continue;
        assert.ok(WILD_PROP_NAMES.includes(name), `${terrain} → ${name}`);
        assert.equal(name, wildPropFor(terrain, x, y), '同じマスなら同じ絵');
        used.add(name);
      }
    }
  }
  assert.deepEqual([...used].sort(), [...WILD_PROP_NAMES].sort(), '使われない絵が無い');
  // 森林には必ず木が立ち、草地と更地には何も立てない
  assert.ok(wildPropFor('t_forest_floor', 7, 9));
  assert.equal(wildPropFor('t_grassland', 7, 9), null);
  assert.equal(wildPropFor('t_cleared', 7, 9), null);
  assert.ok(WILD_PROP_BOX.width > 0 && WILD_PROP_BOX.height > 0);
});
