// ならった範囲の段を、マイドリル・プリント・授業モードで使う形にする — マイ漢字タウン
//
// 範囲の 1 段（1 週間ぶんの字）は、そのまま 週の小テストの範囲になる。前は、段と同じ字を
// マイドリルで もう一度 えらびなおさないと、テスト・宿題・プリントに できなかった。
// React・DOM に依存しない。

import { DRILL_NAME_MAX_LENGTH, normalizeDrillName } from './drill-share.js';

/** 範囲の名前が まだ無いときの、ドリルの名前の はじめ */
const UNTITLED = 'ならった範囲';

/**
 * 段から作るドリルの名前（「3年 2学期 1だんめ」）。40 字に収める（「◯だんめ」は けずらない）。
 * @param {string} rangeName 範囲の名前
 * @param {number} index 段の番号（0 はじまり）
 */
export function stageDrillName(rangeName, index) {
  const suffix = ` ${index + 1}だんめ`;
  const base = normalizeDrillName(typeof rangeName === 'string' ? rangeName : '') || UNTITLED;
  return `${[...base].slice(0, DRILL_NAME_MAX_LENGTH - [...suffix].length).join('').trim()}${suffix}`;
}

/**
 * 段を ドリルの形にする。字の無い段は null。
 * @param {{ name?: string, stages?: { kanjis?: string[] }[] }} range 範囲（先生の下書きでも よい）
 * @param {number} index 段の番号（0 はじまり）
 * @returns {{ name: string, kanjis: string[] } | null}
 */
export function stageToDrill(range, index) {
  const stage = range?.stages?.[index];
  const kanjis = Array.isArray(stage?.kanjis) ? stage.kanjis.filter((id) => typeof id === 'string') : [];
  if (kanjis.length === 0) return null;
  return { name: stageDrillName(range.name, index), kanjis: [...kanjis] };
}

const sameKanjis = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((id, i) => id === b[i]);

/**
 * 段から作ったドリルを マイドリルに足す。名前も字も同じドリルが もう あれば 足さない
 * （同じボタンを 2 回 おしても 2 つ できない）。
 * @returns {{ drills: object[], added: boolean }}
 */
export function addStageDrill(myDrills, drill, now = Date.now()) {
  const drills = Array.isArray(myDrills) ? myDrills : [];
  if (!drill || !Array.isArray(drill.kanjis) || drill.kanjis.length === 0) return { drills, added: false };
  if (drills.some((item) => item && item.name === drill.name && !item.homework && sameKanjis(item.kanjis, drill.kanjis))) return { drills, added: false };
  return { drills: [...drills, { name: drill.name, kanjis: [...drill.kanjis], createdAt: now }], added: true };
}
