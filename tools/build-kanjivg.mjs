#!/usr/bin/env node
// ==========================================================================
// build-kanjivg.mjs — 書き順データ KanjiVG を、このアプリが使う形だけにして同梱する。
//
// このリポジトリ固有の道具（正本の配布物ではない）。
//
// 使い方（リポジトリの直下で）:
//   node tools/build-kanjivg.mjs                 固定した版を取り寄せて public/kanjivg/ に書く
//   node tools/build-kanjivg.mjs --src <dir>     取り寄せずに <dir>/<16進5桁>.svg を読む
//   node tools/build-kanjivg.mjs --check         書かずに、コミット済みの生成物と同じかだけ見る
//                                                （--src と一緒に使える）
//
// なぜ要るか:
//   以前は実行時に cdn.jsdelivr.net の KanjiVG（@master）から 1 字ずつ取っていた。
//   - 学校のフィルタが jsdelivr を止めると、書き順・なぞり・テストが使えなかった
//   - @master は中身が変わりうるので、取った時期によって端末ごとに手本と
//     採点の基準（kvg:type ＝ とめ・はね・はらい）が食い違いえた
//   教育漢字 1026 字ぶんでも、画の d と kvg:type だけにすれば約 0.9MB
//   （gzip で約 0.34MB）。数十MB にはならないので、同梱する。
//
// 出すもの:
//   public/kanjivg/grade-<1..6>.json   学年ごと。{ strokes: { "<16進5桁>": [[d, kvg:type], …] } }
//   public/kanjivg/LICENSE.txt         出典と CC BY-SA 3.0
//   画の並びは SVG に書かれた順（＝書き順）。以前の実行時の読み方
//   （DOMParser で path を文書順に拾う）と同じ並びになる。
//
// ⚠️ 版を上げるときは KANJIVG_TAG と KANJIVG_COMMIT を両方変える。
//    コミットは `git ls-remote https://github.com/KanjiVG/kanjivg.git refs/tags/<タグ>` で確かめる。
//    タグは付け替えられうるので、取り寄せにはコミットのほうを使う。
// ==========================================================================
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const KANJIVG_TAG = 'r20260714';
export const KANJIVG_COMMIT = 'd95a97627fd9fe5b2c8d06ca81e38149609c0c1e';
export const KANJIVG_LICENSE = 'CC BY-SA 3.0';
export const KANJIVG_LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/3.0/';
export const KANJIVG_SITE = 'https://kanjivg.tagaini.net';
export const KANJIVG_COPYRIGHT = 'Copyright (C) 2009/2010/2011 Ulrich Apel.';
export const OUT_DIR = 'public/kanjivg';

const rawUrl = (hex) =>
  `https://raw.githubusercontent.com/KanjiVG/kanjivg/${KANJIVG_COMMIT}/kanji/${hex}.svg`;

/** 漢字 1 字 → KanjiVG のファイル名に使う 16 進 5 桁 */
export const hexOf = (char) => char.codePointAt(0).toString(16).padStart(5, '0');

const decodeXml = (s) =>
  s.replace(/&(lt|gt|quot|apos|amp|#\d+|#x[0-9a-f]+);/gi, (m, e) => {
    const k = e.toLowerCase();
    if (k === 'lt') return '<';
    if (k === 'gt') return '>';
    if (k === 'quot') return '"';
    if (k === 'apos') return "'";
    if (k === 'amp') return '&';
    if (k.startsWith('#x')) return String.fromCodePoint(parseInt(k.slice(2), 16));
    return String.fromCodePoint(parseInt(k.slice(1), 10));
  });

/**
 * SVG の文字列から、画ごとの [d, kvg:type] を文書順に取り出す。
 * コメント（冒頭のライセンス文）の中の <path> は拾わない。
 */
export function extractStrokes(svg) {
  const body = String(svg).replace(/<!--[\s\S]*?-->/g, '');
  const strokes = [];
  for (const m of body.matchAll(/<path\b([^>]*?)\/?>/g)) {
    const attrs = {};
    for (const a of m[1].matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)) attrs[a[1]] = decodeXml(a[2]);
    if (!attrs.d) continue;
    strokes.push([attrs.d, attrs['kvg:type'] ?? null]);
  }
  return strokes;
}

/** KANJI_DATA を学年ごとの字の並びにする */
export function charsByGrade(kanjiData) {
  const out = new Map();
  for (const k of kanjiData) {
    if (!out.has(k.grade)) out.set(k.grade, []);
    out.get(k.grade).push(k.char);
  }
  return out;
}

/** 1 学年ぶんの JSON を組み立てる（キーは 16 進の昇順で、何度作っても同じになる） */
export function renderGrade(grade, entries) {
  const strokes = {};
  for (const [hex, s] of [...entries].sort((a, b) => (a[0] < b[0] ? -1 : 1))) strokes[hex] = s;
  const doc = {
    source: `KanjiVG ${KANJIVG_TAG} (commit ${KANJIVG_COMMIT}) ${KANJIVG_SITE}`,
    copyright: KANJIVG_COPYRIGHT,
    license: `${KANJIVG_LICENSE} ${KANJIVG_LICENSE_URL}`,
    changes: '教育漢字の各字について、画の d 属性と kvg:type だけを取り出して学年ごとに束ねた（形は変えていない）。',
    generator: 'tools/build-kanjivg.mjs',
    grade,
    strokes,
  };
  // 1 字 1 行にして、版を上げたときの差分を読めるようにする
  const lines = Object.entries(strokes).map(([hex, s]) => `    ${JSON.stringify(hex)}: ${JSON.stringify(s)}`);
  const head = Object.entries(doc)
    .filter(([k]) => k !== 'strokes')
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
  return `{\n${head.join(',\n')},\n  "strokes": {\n${lines.join(',\n')}\n  }\n}\n`;
}

export function renderLicense(counts) {
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return `書き順データ（grade-1.json 〜 grade-6.json）について

このフォルダの JSON は KanjiVG から作った派生物です。
KanjiVG と同じ ${KANJIVG_LICENSE} で配布します。

  出典:       KanjiVG ${KANJIVG_SITE}
  版:         ${KANJIVG_TAG}（commit ${KANJIVG_COMMIT}）
  著作権:     ${KANJIVG_COPYRIGHT}
  ライセンス: ${KANJIVG_LICENSE_URL}
  変更点:     教育漢字 ${total} 字について、各画の d 属性と kvg:type だけを
              取り出し、学年ごとの JSON に束ねました。画の形・順は変えていません。
  作り方:     node tools/build-kanjivg.mjs（マイ漢字タウンのリポジトリ）

This folder contains data derived from KanjiVG (${KANJIVG_SITE}),
${KANJIVG_COPYRIGHT}
Licensed under the Creative Commons Attribution-Share Alike 3.0 License
(${KANJIVG_LICENSE_URL}). Only the "d" and "kvg:type" attributes of each
stroke were extracted and grouped by school grade; strokes are unchanged.
`;
}

async function loadSvg(hex, srcDir) {
  if (srcDir) return readFileSync(join(srcDir, `${hex}.svg`), 'utf8');
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(rawUrl(hex));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (attempt >= 3) throw new Error(`${hex}.svg を取り寄せられない: ${e.message}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

export async function buildKanjiVg(root, { srcDir = null, check = false, log = console.log } = {}) {
  const { KANJI_DATA } = await import(pathToFileURL(join(root, 'src/data/kanji-data.js')).href);
  const byGrade = charsByGrade(KANJI_DATA);
  const outDir = join(root, OUT_DIR);
  const files = new Map();
  const counts = new Map();
  let strokeTotal = 0;

  for (const [grade, chars] of [...byGrade].sort((a, b) => a[0] - b[0])) {
    const entries = [];
    // 1026 本を順に取ると遅いので、16 本ずつ並べて取る
    for (let i = 0; i < chars.length; i += 16) {
      const batch = chars.slice(i, i + 16);
      const got = await Promise.all(batch.map(async (char) => {
        const hex = hexOf(char);
        const strokes = extractStrokes(await loadSvg(hex, srcDir));
        // 画が 0 本の字を黙って配ると、その字だけ書き順が出ない。ここで止める。
        if (strokes.length === 0) throw new Error(`${char}（${hex}）の画が 0 本。SVG が壊れている`);
        return [hex, strokes];
      }));
      entries.push(...got);
    }
    strokeTotal += entries.reduce((n, [, s]) => n + s.length, 0);
    counts.set(grade, entries.length);
    files.set(`grade-${grade}.json`, renderGrade(grade, entries));
  }
  files.set('LICENSE.txt', renderLicense(counts));

  let bytes = 0;
  const stale = [];
  for (const [name, text] of files) {
    bytes += Buffer.byteLength(text);
    const p = join(outDir, name);
    if (check) {
      if (!existsSync(p) || readFileSync(p, 'utf8') !== text) stale.push(name);
    }
  }
  if (check) {
    if (stale.length) {
      log(`❌ ${OUT_DIR}/ が生成し直した結果と違う: ${stale.join(', ')}`);
      log('   node tools/build-kanjivg.mjs を走らせてコミットすること。');
      return { ok: false, stale };
    }
    log(`✅ ${OUT_DIR}/ は ${KANJIVG_TAG} から作った結果と同じ（${[...counts.values()].reduce((a, b) => a + b, 0)} 字）`);
    return { ok: true, stale };
  }
  mkdirSync(outDir, { recursive: true });
  for (const [name, text] of files) writeFileSync(join(outDir, name), text);
  log(`KanjiVG ${KANJIVG_TAG}（${KANJIVG_COMMIT.slice(0, 8)}）${srcDir ? `を ${srcDir} から` : 'を取り寄せて'}書き出した:`);
  for (const [g, n] of counts) log(`  grade-${g}.json  ${n} 字  ${(Buffer.byteLength(files.get(`grade-${g}.json`)) / 1024).toFixed(1)} KB`);
  log(`  計 ${[...counts.values()].reduce((a, b) => a + b, 0)} 字 / ${strokeTotal} 画 / ${(bytes / 1024).toFixed(1)} KB`);
  return { ok: true, stale };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const srcIdx = args.indexOf('--src');
  const srcDir = srcIdx >= 0 ? resolve(args[srcIdx + 1] ?? '') : null;
  if (srcIdx >= 0 && !args[srcIdx + 1]) {
    console.error('使い方: node tools/build-kanjivg.mjs [--src <SVG のあるフォルダ>] [--check]');
    process.exit(2);
  }
  buildKanjiVg(process.cwd(), { srcDir, check: args.includes('--check') })
    .then((r) => process.exit(r.ok ? 0 : 1))
    .catch((err) => {
      console.error(`❌ ${err.message}`);
      process.exit(1);
    });
}
