import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BUILDING_ART, BUILDING_ART_NAMES, buildingArt, buildingArtDef, buildingArtId } from '../src/data/iso-svg/buildings-art.js';
import { INK, lot, mix, tone } from '../src/data/iso-svg/kit.js';
import { KIT_BASE_SIZES, itemFit } from '../src/data/town-item-fit.js';

// 新しい絵がらの建物は、絵を文字列で作って 文書の <defs> に置き、<use href="#b-名前-番号"> で呼びだす。
// 名前・番号・敷地の大きさが どこかで食いちがうと、その建物だけが町に出ない・ずれて出る
// （エラーにはならない）。ここで機械的に止める。

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const ITEMS = new Map([...read('../src/data/town-items.jsx').matchAll(/^\s*\{ id: '(t_\w+)',\s*svg: lazySvg\('(\w+)'\),(.*)\},?\s*$/gm)].map((m) => {
  const size = /size: \{ w: (\d+), h: (\d+) \}/.exec(m[3]);
  return [m[1], { id: m[1], svg: m[2], size: size ? { w: Number(size[1]), h: Number(size[2]) } : undefined }];
}));

/** 絵として壊れていないか（数や色に undefined・NaN が混ざっていないか、絵のほかのものが無いか） */
function assertCleanArt(markup, label) {
  assert.ok(markup.length > 200, `${label}: 絵が空に近い`);
  assert.ok(!/undefined|NaN|Infinity|null/.test(markup), `${label}: 壊れた値 → ${/.{24}(?:undefined|NaN|Infinity|null).{24}/.exec(markup)?.[0]}`);
  for (const m of markup.matchAll(/(?:fill|stroke)="([^"]+)"/g)) {
    assert.ok(m[1] === 'none' || /^#[0-9a-f]{6}$/i.test(m[1]), `${label}: 色でない値 ${m[1]}`);
  }
  assert.ok(!/<script|on\w+=|href=|url\(|<foreignObject|<image|<style/i.test(markup), `${label}: 絵のほかのものが混ざっている`);
  assert.equal((markup.match(/<g[ >]/g) || []).length, (markup.match(/<\/g>/g) || []).length, `${label}: <g> が閉じていない`);
  // 使う要素は 図形と <g> だけ
  for (const m of markup.matchAll(/<(\w+)/g)) assert.ok(['path', 'circle', 'ellipse', 'g'].includes(m[1]), `${label}: 思わぬ要素 <${m[1]}>`);
}

test('建物の絵: どれも（色ちがいも）壊れていない', () => {
  assert.ok(BUILDING_ART_NAMES.length >= 20);
  for (const name of BUILDING_ART_NAMES) {
    const count = BUILDING_ART[name].variants || 1;
    for (let variant = 0; variant < count; variant++) {
      const art = buildingArt(name, variant);
      assertCleanArt(art, `${name}-${variant}`);
      const def = buildingArtDef(name, variant);
      assert.ok(def.startsWith(`<g id="${buildingArtId(name, variant)}" transform="translate(50 50) scale(`), name);
      assert.ok(def.endsWith('</g>'), name);
    }
    assert.equal(buildingArt(name, count), null, `${name}: 色ちがいの数が合わない`);
    assert.equal(buildingArt(name, -1), null);
  }
  assert.equal(buildingArt('no_such_building'), null);
  assert.equal(buildingArtDef('no_such_building'), '');
});

test('色ちがいは、ちがう絵になっている', () => {
  for (const name of BUILDING_ART_NAMES.filter((n) => (BUILDING_ART[n].variants || 1) > 1)) {
    const arts = new Set(Array.from({ length: BUILDING_ART[name].variants }, (_, i) => buildingArt(name, i)));
    assert.equal(arts.size, BUILDING_ART[name].variants, name);
  }
});

test('絵の名前は 町のアイテム（t_名前）にあり、敷地の大きさが同じ', () => {
  for (const name of BUILDING_ART_NAMES) {
    const item = ITEMS.get(`t_${name}`);
    assert.ok(item, `t_${name} というアイテムが無い`);
    const [w, h] = BUILDING_ART[name].size;
    assert.deepEqual([item.size?.w || 1, item.size?.h || 1], [w, h], `${name}: 敷地の大きさ`);
    // 包む拡大率は、敷地の大きさで決まる（足もとが viewBox の同じ場所に収まる）
    const scale = Number(/scale\(([\d.]+)\)/.exec(buildingArtDef(name, 0))[1]);
    assert.ok(Math.abs(scale - 5 / (w + h)) < 0.006, `${name}: 拡大率 ${scale}`);
  }
});

test('置き方の表（town-item-fit.js）は、絵の足もとの大きさ・影のしるしと同じ', () => {
  assert.deepEqual(Object.keys(KIT_BASE_SIZES).sort(), BUILDING_ART_NAMES.map((n) => `t_${n}`).sort());
  for (const name of BUILDING_ART_NAMES) {
    const art = BUILDING_ART[name];
    const row = KIT_BASE_SIZES[`t_${name}`];
    assert.deepEqual([row[0], row[1]], art.base, name);
    // 'own' = 影は絵の中に描いてある、'none' = 平らなもの（プールなど）で影を落とさない。どちらも地面のレイヤーは描かない
    assert.ok([undefined, 'own', 'none'].includes(art.shadow), `${name}: shadow の値`);
    assert.equal(row[2] === 1, Boolean(art.shadow), `${name}: 影のしるし`);
    const [w, h] = art.size;
    assert.ok(art.base[0] > 0 && art.base[0] <= w && art.base[1] > 0 && art.base[1] <= h, `${name}: 足もとが敷地に収まらない`);
    // 置き方は どの絵も同じ決まり
    const fit = itemFit(ITEMS.get(`t_${name}`));
    assert.deepEqual(fit, { ax: 0, ay: -50, s: 0.16 * (w + h), bw: art.base[0], bh: art.base[1], flip: false, ownShadow: Boolean(art.shadow) });
    // 影を絵の中に描く絵は、絵の中に影がある（地面のレイヤーは描かない）
    if (art.shadow === 'own') assert.ok(buildingArt(name, 0).includes('fill="#1e2a3a"'), `${name}: 絵の中に影が無い`);
  }
});

test('buildings.jsx が呼びだす絵は すべてあり、使われない絵が無い', () => {
  const source = read('../src/data/iso-svg/buildings.jsx');
  const used = [...source.matchAll(/^export const (Svg\w+) = artOf\('(\w+)'\);$/gm)];
  assert.equal(used.length, BUILDING_ART_NAMES.length);
  assert.deepEqual(used.map((m) => m[2]).sort(), [...BUILDING_ART_NAMES].sort());
  // その部品の名前は、同じ名前のアイテムが引いている
  for (const [, component, name] of used) {
    assert.equal(ITEMS.get(`t_${name}`).svg, component, `${name} のアイテムが ${component} を引いていない`);
  }
});

test('部品（kit.js）: 座標と色', () => {
  const k = lot(2, 1);
  // 原点は敷地のまん中。1 マスは 幅 80・高さ 40
  assert.deepEqual(k.xy(1, 0.5, 0), [0, 0]);
  assert.deepEqual(k.xy(2, 0.5, 0), [40, 20]);
  assert.deepEqual(k.xy(1, 0.5, 10), [0, -10]);
  assert.equal(lot(1, 1).wrap('x', 'a'), '<g id="a" transform="translate(50 50) scale(2.5)">x</g>');
  assert.equal(lot(4, 4).wrap('x'), '<g transform="translate(50 50) scale(0.63)">x</g>');
  assert.match(INK, /^#[0-9a-f]{6}$/);
  assert.equal(tone('#808080', 0), '#808080');
  assert.equal(tone('#000000', 1), '#ffffff');
  assert.equal(tone('#ffffff', -1), '#000000');
  assert.equal(mix('#000000', '#ffffff', 0.5), '#808080');
  // 面の向き: 左手前（SW）は u に沿い、右手前（SE）は v に沿う
  assert.deepEqual(k.SW(0.8)(0.3, 5), [0.3, 0.8, 5]);
  assert.deepEqual(k.SE(1.2)(0.3, 5), [1.2, 0.3, 5]);
  assert.equal(k.SW(0.8).out(0.1)(0.3, 5)[1], 0.9);
});

test('部品（kit.js）: どの部品も壊れていない絵を返す', () => {
  const k = lot(2, 2);
  const f = k.SW(1.5); const e = k.SE(1.5);
  const parts = {
    box: k.box(0.2, 0.2, 1, 1, 0, 10, '#cccccc'),
    pad: k.pad(0, 0, 2, 2, '#aaddaa'),
    shadow: k.shadow(0.2, 0.2, 1, 1) + k.roundShadow(1, 1, 0.3),
    win: k.win(f, 0.2, 0.5, 3, 9) + k.win(e, 0.2, 0.5, 3, 9, { bars: 'none', sill: '#a9683a' }) + k.wins(f, 0.2, 1.4, 3, 3, 9),
    glass: k.glass(f, 0.2, 1.2, 2, 9, 4) + k.glass(e, 0.2, 1.2, 2, 9, 1),
    door: k.door(f, 0.6, 0.8, 0, 11) + k.door(e, 0.6, 0.9, 0, 11, { double: true, pane: false }),
    awning: k.awning(f, 0.2, 1.2, 13) + k.awning(e, 0.2, 1.2, 13, { n: 3 }),
    sign: k.sign(f, 0.4, 1, 14, 18) + k.onFace(f, 0.7, 16, '<circle r="1" fill="#ffffff"/>') + k.onFace(e, 0.7, 16, '<circle r="1" fill="#ffffff"/>') + k.billboard(1, 1, 20, '<circle r="1" fill="#ffffff"/>'),
    roofTop: k.acUnit(0.3, 0.3, 14) + k.skylight(0.5, 0.5, 0.8, 0.8, 14),
    gableU: k.gableWalls(0.2, 0.2, 1.4, 1.2, 14, 9, '#ffffff', 'u') + k.gableRoof(0.2, 0.2, 1.4, 1.2, 14, 9, '#cc3333', 'u'),
    gableV: k.gableWalls(0.2, 0.2, 1.4, 1.2, 14, 9, '#ffffff', 'v') + k.gableRoof(0.2, 0.2, 1.4, 1.2, 14, 2, '#cc3333', 'v', { plain: true }),
    hipWide: k.hipRoof(0.2, 0.2, 1.6, 1, 14, 9, '#cc3333'),
    hipDeep: k.hipRoof(0.2, 0.2, 1, 1.6, 14, 9, '#cc3333', { curl: 3, hip: 0.6 }),
    hipSquare: k.hipRoof(0.2, 0.2, 1, 1, 14, 9, '#cc3333', { plain: true, cap: '#ffd24a' }),
    parapet: k.parapet(0.2, 0.2, 1, 1, 14, 2, '#eeeeee'),
    round: k.cyl(1, 1, 0.3, 0, 20, '#cccccc') + k.cyl(1, 1, 0.3, 0, 20, '#cccccc', { top: false }) + k.cone(1, 1, 0.3, 20, 34, '#3366cc') + k.dome(1, 1, 0.3, 20, 12, '#33aa99'),
    plants: k.bush(0.3, 1.7) + k.bush(0.3, 1.7, 1, { flowers: ['#ffffff', '#ff8fb8'] }) + k.tree(0.5, 1.7) + k.fir(0.7, 1.7) + k.tuft(0.9, 1.7) + k.pot(1.1, 1.7) + k.flowers([[1.3, 1.7], [1.4, 1.7]]),
    props: k.flag(1, 1, 30, 40, '#ef4444') + k.smoke(1, 1, 40) + k.steps(f, 0.4, 0.8, 3) + k.bar([[0, 0, 0], [0, 0, 9]], '#aaaaaa') + k.curve([0, 0, 9], [1, 0, 6], [2, 0, 9], '#aaaaaa') + k.plinth(0.2, 0.2, 1, 1, 2, '#999999') + k.eaveShade(0.2, 0.2, 1, 1, 14, 3, '#ffffff'),
    shapes: k.dot(1, 1, 5, 2, '#ffffff') + k.oval(1, 1, 5, 4, 2, '#ffffff', 1) + k.disc(1, 1, 5, 0.2, '#ffffff') + k.shape(1, 1, 5, 'M0 0L2 2', '#ffffff') + k.rule(f, 0, 0, 1, 5) + k.band(f, 0, 1, 0, 5, '#ffffff', 0.5) + k.panel(e, 0, 1, 0, 5, '#ffffff'),
  };
  for (const [name, markup] of Object.entries(parts)) assertCleanArt(`${markup}${' '.repeat(200)}`, `kit.${name}`);
});
