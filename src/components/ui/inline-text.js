// ふりがな付きの字を、ボタンや見出しの中で ひとつづきの文として並べる — マイ漢字タウン
//
// ボタン・見出しは、アイコンと字を横に並べるために flex の箱にしてある。flex の箱の中では、
// ふつうの字のかたまりと <ruby>（ふりがな付きの字）が 1 つずつ別の部品として並ぶ。すると、
//   ・部品のあいだに gap の すきまが入る（「だんを 足 す」）
//   ・<ruby> はふりがなの分だけ背が高く、たてのまん中で そろえると その字だけ下がる
//   ・せまい画面では部品ごとに折り返し、「なら / った」のように 1 語が たてに割れる
// 字のかたまり（ふつうの字・<ruby>・その 2 つだけの <>…</>）を 1 つの <span> に まとめると、
// 箱の中では 1 つの部品になり、中では ふつうの文と同じに並んで折り返す。
//
// MotionButton は中身を この関数に通す。ほかの flex の箱では、字の所を <span> で包むこと
// （test/inline-text.test.js が、ソースの中に ばらばらの所が無いかを見る）。

import { Children, Fragment, createElement, isValidElement } from 'react';

/**
 * ふりがな付きの字を返す部品（FormatKun.jsx の Ruby・R・RubyText）に付ける しるし。
 * 値は 'one'（<ruby> を 1 つ返す）か 'many'（1 字ずつの <ruby> を並べて返す。RubyText など）。
 * ここから FormatKun.jsx を読まないのは、この関数を JSX なしで（node のテストから）使えるようにするため。
 */
export const INLINE_RUBY = Symbol.for('kanji-town.inline-ruby');
const isRubyType = (type) => type === 'ruby' || Boolean(type && type[INLINE_RUBY]);

/** 字のかたまりの一部か（ふつうの字・数・ふりがな付きの字・それだけを入れた <>…</>） */
export function isInlineText(node) {
  if (typeof node === 'string' || typeof node === 'number') return true;
  if (!isValidElement(node)) return false;
  if (isRubyType(node.type)) return true;
  if (node.type === Fragment) return Children.toArray(node.props.children).every(isInlineText);
  return false;
}

/** 画面の上で いくつの部品に分かれるか（<>…</> は中身が そのまま並ぶ。空白だけの字は数えない） */
function pieces(node) {
  if (typeof node === 'string') return node.trim() ? 1 : 0;
  if (typeof node === 'number') return 1;
  if (isValidElement(node) && node.type && node.type[INLINE_RUBY] === 'many') return 2;
  if (isValidElement(node) && node.type === Fragment) {
    return Children.toArray(node.props.children).reduce((sum, child) => sum + pieces(child), 0);
  }
  return 1;
}

/**
 * 中身のうち、2 つ以上の部品に分かれる字のかたまりを <span> で包む。アイコンなど ほかの部品は そのまま。
 * 分かれないもの（字だけ・ふりがな 1 つだけ）は包まない（画面の形を変えない）。
 * @param {import('react').ReactNode} children
 * @returns {import('react').ReactNode}
 */
export function groupInlineText(children) {
  const list = Children.toArray(children);
  const out = [];
  let run = [];
  const flush = () => {
    if (run.length === 0) return;
    if (run.reduce((sum, node) => sum + pieces(node), 0) >= 2) {
      out.push(createElement('span', { key: `inline-${out.length}` }, ...run));
    } else {
      out.push(...run);
    }
    run = [];
  };
  for (const node of list) {
    if (isInlineText(node)) run.push(node);
    else { flush(); out.push(node); }
  }
  flush();
  return out;
}
