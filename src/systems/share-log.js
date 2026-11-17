// 配ったものの控え — マイ漢字タウン
// 先生が リンク・QR・Classroom・4けたの数字で配ったもの（ドリル・宿題・ならった範囲）を、先生の端末に残す。
//
// サーバーが無いので、配ったあとに ドリルや範囲を直すと、何を配ったのかが 手もとに残らなかった
// （リンクの中身は 配ったときのまま。もう一度 QR を出すには、同じ決まりを えらびなおして 作りなおすしかなかった）。
// 控えには、配ったリンクの中身（?drill= / ?range= の値）を そのまま持つ。名前・字・宿題の決まり・段は、
// 中身を復元して出す（同じことを 2 か所に持たない）。
//
// 置き場所は stats.shareLog（端末の中だけ。バックアップには入る）。React・DOM に依存しない。

import { DRILL_PARAM_MAX_LENGTH, DRILL_SHARE_PARAM, decodeDrillParam, normalizeShareBaseUrl } from './drill-share.js';
import { RANGE_PARAM_MAX_LENGTH, RANGE_SHARE_PARAM, decodeRangeParam } from './learning-range.js';

/** 控えに残す数の上限（古いものから消える） */
export const SHARE_LOG_MAX = 20;

/** 配り方。link: リンク・QR・Classroom  number: 4けたの数字 */
const VIAS = new Set(['link', 'number']);
const MAX_LENGTH = { drill: DRILL_PARAM_MAX_LENGTH, range: RANGE_PARAM_MAX_LENGTH };

/** 控え 1 件を見分ける名前（同じ中身を 2 回 配ったら 1 件にまとめる） */
export const shareLogKey = (entry) => `${entry.kind}:${entry.param}`;

/**
 * 控え 1 件の中身を復元する。こわれていれば null。
 * @param {{ kind: string, param: string }} entry
 * @returns {{ kind: 'drill', name: string, kanjis: string[], homework: object|null }
 *          | { kind: 'range', name: string, stages: { from: string, kanjis: string[] }[], kanjiCount: number } | null}
 */
export function describeShareEntry(entry) {
  if (!entry || typeof entry.param !== 'string') return null;
  if (entry.kind === 'drill') {
    const drill = decodeDrillParam(entry.param);
    if (!drill) return null;
    return { kind: 'drill', name: drill.name, kanjis: drill.kanjis, homework: drill.homework || null };
  }
  if (entry.kind === 'range') {
    const range = decodeRangeParam(entry.param);
    if (!range) return null;
    return { kind: 'range', name: range.name, stages: range.stages, kanjiCount: range.stages.reduce((sum, stage) => sum + stage.kanjis.length, 0) };
  }
  return null;
}

function sanitizeEntry(value) {
  if (!value || typeof value !== 'object') return null;
  const { kind, param } = value;
  if ((kind !== 'drill' && kind !== 'range') || typeof param !== 'string' || !param || param.length > MAX_LENGTH[kind]) return null;
  const at = Number(value.at);
  const entry = { kind, param, at: Number.isFinite(at) && at > 0 ? Math.floor(at) : 0, via: VIAS.has(value.via) ? value.via : 'link' };
  // 中身を復元できないものは残さない（開いても 何も出せない）
  return describeShareEntry(entry) ? entry : null;
}

/**
 * 保存してある控え（stats.shareLog）を読む。形の崩れたもの・同じ中身の 2 件めは捨て、新しい順に並べる。
 * @param {unknown} value
 * @returns {{ kind: 'drill'|'range', param: string, at: number, via: 'link'|'number' }[]}
 */
export function readShareLog(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const list = [];
  for (const item of value) {
    const entry = sanitizeEntry(item);
    if (!entry || seen.has(shareLogKey(entry))) continue;
    seen.add(shareLogKey(entry));
    list.push(entry);
  }
  return list.sort((a, b) => b.at - a.at).slice(0, SHARE_LOG_MAX);
}

/**
 * 配ったものを 控えに足す。同じ中身が もう あれば、それを いちばん上へ動かして 日時を新しくする。
 * @param {unknown} log いまの控え
 * @param {{ kind: 'drill'|'range', param: string, via?: 'link'|'number' }} entry
 * @param {number} [now]
 * @returns {object[]} 新しい控え（足せないときは、いまの控えを整えたもの）
 */
export function addShareLog(log, entry, now = Date.now()) {
  const list = readShareLog(log);
  const next = sanitizeEntry({ ...entry, at: now });
  if (!next) return list;
  return [next, ...list.filter((item) => shareLogKey(item) !== shareLogKey(next))].slice(0, SHARE_LOG_MAX);
}

/** 控えから 1 件 消す */
export function removeShareLog(log, key) {
  return readShareLog(log).filter((item) => shareLogKey(item) !== key);
}

/** 控えの 1 件を、もう一度 配るための URL にする */
export function shareEntryUrl(entry, baseUrl) {
  const base = normalizeShareBaseUrl(baseUrl);
  if (!base || !describeShareEntry(entry)) return null;
  return `${base}?${entry.kind === 'range' ? RANGE_SHARE_PARAM : DRILL_SHARE_PARAM}=${entry.param}`;
}
