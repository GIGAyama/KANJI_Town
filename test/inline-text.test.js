import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Fragment, createElement, isValidElement } from 'react';
import { INLINE_RUBY, groupInlineText, isInlineText } from '../src/components/ui/inline-text.js';

// ボタン・見出しは、アイコンと字を横に並べるために flex の箱にしてある。その中に
// 「ならった{F("範囲","はんい")}を…」と書くと、ふつうの字と <ruby> が 1 つずつ別の部品になり、
//   ・部品のあいだに すきまが入る（「だんを 足 す」）
//   ・ふりがなの付いた字だけ下がる
//   ・せまい画面では「なら / った」のように 1 語が たてに割れる
// （2026-11-17、スマホで「ならった範囲を配る（先生向け）」の見出しが こうなっていた）。
// 字のかたまりを 1 つの <span> に まとめれば直る。MotionButton は自分で まとめるので、
// それ以外の flex・grid の箱に ばらばらの所が無いことを、ソースを読んで確かめる。

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const SRC = new URL('../src/', import.meta.url).pathname;

// ── groupInlineText ──

/** ふりがな付きの字の部品の代わり（FormatKun.jsx は JSX なので、ここからは読めない） */
const FakeRuby = () => null;
FakeRuby[INLINE_RUBY] = 'one';
const FakeRubyText = () => null;
FakeRubyText[INLINE_RUBY] = 'many';
const Icon = () => null;
const ruby = (base) => createElement(FakeRuby, { base });

test('groupInlineText: 字とふりがなが 2 つ以上の部品に分かれるときだけ <span> に まとめる', () => {
  // アイコン + 「だんを」 + 足 + 「す」 → アイコン + <span>だんを足す</span>
  const out = groupInlineText([createElement(Icon, { key: 'i' }), ' だんを', ruby('足'), 'す']);
  assert.equal(out.length, 2);
  assert.equal(out[0].type, Icon);
  assert.equal(out[1].type, 'span');
  const inner = [].concat(out[1].props.children);
  assert.equal(inner.length, 3);
  assert.equal(inner[0], ' だんを');
  assert.equal(inner[1].type, FakeRuby);
  assert.equal(inner[2], 'す');
});

test('groupInlineText: 分かれないもの（字だけ・ふりがな 1 つだけ）は そのまま', () => {
  const textOnly = groupInlineText([createElement(Icon, { key: 'i' }), ' テスト']);
  assert.deepEqual(textOnly.map((n) => (isValidElement(n) ? n.type : n)), [Icon, ' テスト']);
  // 空白 + ふりがな 1 つ（「<Icon/> {F('練習')}」）は 1 つの部品なので包まない
  const single = groupInlineText([createElement(Icon, { key: 'i' }), ' ', ruby('練習')]);
  assert.equal(single.filter((n) => isValidElement(n) && n.type === 'span').length, 0);
  assert.equal(groupInlineText(null).length, 0);
  assert.equal(groupInlineText('はい').length, 1);
});

test('groupInlineText: <>…</> の中や、1 字ずつ並べるふりがな（RubyText）も数える', () => {
  const frag = createElement(Fragment, { key: 'f' }, ruby('書'), 'けた👍');
  const out = groupInlineText([frag]);
  assert.equal(out.length, 1);
  assert.equal(out[0].type, 'span');
  // RubyText は 1 字ずつ <ruby> を並べる。1 つだけでも ばらばらになるので包む
  const many = groupInlineText([createElement(Icon, { key: 'i' }), createElement(FakeRubyText, { key: 'r', text: 'まちづくり' })]);
  assert.equal(many[1].type, 'span');
  // アイコンを はさむと、その前後で別のかたまり
  const split = groupInlineText(['のこり', ruby('文字'), createElement(Icon, { key: 'i' }), 'あと', ruby('字')]);
  assert.deepEqual(split.map((n) => n.type), ['span', Icon, 'span']);
});

test('isInlineText: アイコンや <span> は字のかたまりに入れない（すきまを そのまま残す）', () => {
  assert.equal(isInlineText('あ'), true);
  assert.equal(isInlineText(3), true);
  assert.equal(isInlineText(ruby('字')), true);
  assert.equal(isInlineText(createElement('ruby', null, '字')), true);
  assert.equal(isInlineText(createElement(Icon)), false);
  assert.equal(isInlineText(createElement('span', null, 'x')), false);
  assert.equal(isInlineText(createElement(Fragment, null, 'あ', createElement(Icon))), false);
  assert.equal(isInlineText(null), false);
});

test('MotionButton は中身を groupInlineText に通し、FormatKun の部品には しるしが付いている', () => {
  const button = read('../src/components/ui/MotionButton.jsx');
  assert.match(button, /\{groupInlineText\(children\)\}/);
  const kun = read('../src/components/ui/FormatKun.jsx');
  for (const name of ['Ruby', 'R']) assert.match(kun, new RegExp(`\\n${name}\\[INLINE_RUBY\\] = 'one';`));
  for (const name of ['RubyText', 'SurvivalRubyText']) assert.match(kun, new RegExp(`\\n${name}\\[INLINE_RUBY\\] = 'many';`));
});

// ── ソースの中に、ばらばらの所が無いか ──

// JSX を読むのに、vite の React プラグインが使っている Babel を借りる（同じ版が必ず入っている）
const babel = createRequire(createRequire(new URL('../package.json', import.meta.url)).resolve('@vitejs/plugin-react'))('@babel/core');
const t = babel.types;

const jsxFiles = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.jsx')) jsxFiles.push(p);
  }
};
walk(SRC);
const parse = (file) => babel.parseSync(readFileSync(file, 'utf8'), { filename: file, sourceType: 'module', babelrc: false, configFile: false, parserOpts: { plugins: ['jsx'] } });

const RUBY_TAGS = new Set(['Ruby', 'R', 'RubyText', 'SurvivalRubyText', 'ruby']);
const MANY_TAGS = new Set(['RubyText', 'SurvivalRubyText']);
const LAYOUT = /(^|\s|:)(flex|inline-flex|grid|inline-grid)(\s|$)/;
const tagName = (el) => (el.openingElement.name.type === 'JSXIdentifier' ? el.openingElement.name.name : '');
const isF = (e) => e.type === 'CallExpression' && e.callee.type === 'Identifier' && e.callee.name === 'F';
/** className に書いてある字（文字列・テンプレートの部分）をつなげる */
function classText(el) {
  const attr = el.openingElement.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === 'className');
  if (!attr || !attr.value) return '';
  if (attr.value.type === 'StringLiteral') return attr.value.value;
  let s = '';
  babel.traverse(t.file(t.program([t.expressionStatement(attr.value.expression)])), {
    StringLiteral(p) { s += ` ${p.node.value} `; },
    TemplateElement(p) { s += ` ${p.node.value.raw} `; },
  });
  return s;
}

/**
 * 子を、画面に並ぶ部品の種類にする（'ruby' | 'text' | 'other'）。<>…</> は中身が そのまま並ぶ。
 * cond && <>…</> や a ? <>…</> : <>…</> の中身は、どれか 1 つだけが出るので、別のかたまりとして
 * branches に入れ、外がわでは 'other' と数える。
 */
function kinds(node, out, branches) {
  switch (node.type) {
    case 'JSXText': if (node.value.trim()) out.push('text'); return;
    case 'JSXFragment': for (const c of node.children) kinds(c, out, branches); return;
    case 'JSXExpressionContainer': kinds(node.expression, out, branches); return;
    case 'JSXEmptyExpression': return;
    case 'StringLiteral': case 'TemplateLiteral': case 'NumericLiteral': case 'Identifier': case 'MemberExpression': case 'BinaryExpression':
      out.push('text'); return;
    case 'CallExpression': out.push(isF(node) ? 'ruby' : 'text'); return;
    case 'LogicalExpression': case 'ConditionalExpression': {
      const parts = node.type === 'LogicalExpression' ? [node.right] : [node.consequent, node.alternate];
      for (const part of parts) {
        if (part.type === 'JSXFragment' || part.type === 'JSXElement') {
          const inner = [];
          kinds(part.type === 'JSXFragment' ? part : { type: 'JSXFragment', children: [part] }, inner, branches);
          branches.push(inner);
          out.push('other');
        } else {
          kinds(part, out, branches);
        }
      }
      return;
    }
    case 'JSXElement': {
      const name = tagName(node);
      if (MANY_TAGS.has(name)) out.push('ruby', 'ruby');
      else out.push(RUBY_TAGS.has(name) ? 'ruby' : 'other');
      return;
    }
    default: out.push('other');
  }
}
const scattered = (list) => list.includes('ruby') && list.filter((k) => k !== 'other').length >= 2;

test('flex・grid の箱の中で、ふりがな付きの字が ばらばらの部品になっている所が無い', () => {
  const found = [];
  for (const file of jsxFiles) {
    babel.traverse(parse(file), {
      JSXElement(p) {
        const name = tagName(p.node);
        if (name === 'MotionButton') return; // 自分で まとめる
        if (!LAYOUT.test(classText(p.node))) return;
        const out = []; const branches = [];
        for (const c of p.node.children) kinds(c, out, branches);
        if (scattered(out) || branches.some(scattered)) {
          found.push(`${file.replace(SRC, 'src/')}:${p.node.loc.start.line} <${name}>`);
        }
      },
    });
  }
  assert.deepEqual(found, [], '字のかたまりを <span> で包むこと');
  assert.ok(jsxFiles.length > 50);
});

test('検査のしかけ: ばらばらの書き方を見つけ、包んだ書き方は通す', () => {
  const check = (code) => {
    let hit = false;
    babel.traverse(babel.parseSync(code, { sourceType: 'module', babelrc: false, configFile: false, parserOpts: { plugins: ['jsx'] } }), {
      JSXElement(p) {
        if (!LAYOUT.test(classText(p.node)) || tagName(p.node) === 'MotionButton') return;
        const out = []; const branches = [];
        for (const c of p.node.children) kinds(c, out, branches);
        if (scattered(out) || branches.some(scattered)) hit = true;
      },
    });
    return hit;
  };
  assert.equal(check('const a = <h2 className="flex items-center gap-2"><Icon /> ならった{F("範囲","はんい")}を配る</h2>;'), true);
  assert.equal(check('const a = <h2 className="flex items-center gap-2"><Icon /> <span>ならった{F("範囲","はんい")}を配る</span></h2>;'), false);
  assert.equal(check('const a = <div className={`text-xs ${x ? "flex" : ""}`}>{n}{F("人","にん")}</div>;'), true);
  assert.equal(check('const a = <div className="flex">{x ? <><Eraser /> けす</> : <>{name} を{F("置","お")}く</>}</div>;'), true);
  assert.equal(check('const a = <h3 className="flex">{a && <><Package /> もちもの</>}{b && <><Users /> {F("住民","じゅうみん")}</>}</h3>;'), false);
  assert.equal(check('const a = <button className="flex">{cat.emoji} <RubyText text={cat.name} /></button>;'), true);
  assert.equal(check('const a = <MotionButton className="flex"><Icon /> だんを{F("足","た")}す</MotionButton>;'), false);
  assert.equal(check('const a = <p className="text-sm">だんを{F("足","た")}す</p>;'), false);
});

// ── 横に流す列（学年のタブなど） ──

test('横に流す列の中の ボタンは縮まない（縮むと 字が となりに重なる）', () => {
  // 2026-11-17、漢字ずかんの学年のタブが「すべ」「1年 1/」のように重なって切れていた
  const found = [];
  for (const file of jsxFiles) {
    babel.traverse(parse(file), {
      JSXElement(p) {
        const cls = classText(p.node);
        if (!/(^|\s)overflow-x-auto(\s|$)/.test(cls) || !/(^|\s)flex(\s|$)/.test(cls)) return;
        p.traverse({
          JSXElement(q) {
            if (q.findParent((x) => x.isJSXElement()) !== p) return;
            if (tagName(q.node) !== 'button') return;
            if (!/(^|\s)shrink-0(\s|$)/.test(classText(q.node))) found.push(`${file.replace(SRC, 'src/')}:${q.node.loc.start.line}`);
          },
        });
      },
    });
  }
  assert.deepEqual(found, []);
});

// ── フッター ──

test('フッター: KanjiVG の表示は切らず、入らないときは 2 行めへ送る', () => {
  const footer = read('../src/components/ui/Footer.jsx');
  const box = /<footer className="([^"]+)"/.exec(footer)[1].split(/\s+/);
  // 前は 1 行のまま まん中に寄せていたので、スマホでは入らない分が 両はしで切れ、「© Ulrich Ape」になっていた
  assert.ok(box.includes('max-sm:flex-wrap'), 'スマホで フッターが折り返せない');
  assert.ok(box.includes('flex-nowrap'), 'タブレットでも 2 行になる');
  assert.ok(!box.includes('h-8') && box.includes('min-h-8'), '高さを 1 行に決めうちしている');
  const credit = /<div className="([^"]+)">\s*©2026/.exec(footer)[1].split(/\s+/);
  assert.ok(credit.includes('truncate') && credit.includes('max-sm:basis-0'), 'クレジットだけで 2 行めに落ちる');
  const license = /<div className="([^"]+)">\s*書き順データ/.exec(footer)[1].split(/\s+/);
  assert.ok(license.includes('whitespace-nowrap') && !license.includes('truncate'), 'KanjiVG の表示が切れる');
  assert.match(footer, /\) © Ulrich Apel/);
});
