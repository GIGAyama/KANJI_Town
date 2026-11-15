// 「4けたの数字で送る」（P2P）で受け渡すドリルのメッセージ — マイ漢字タウン
//
// リンク配布（drill-share.js）と同じ形・同じ検証を使う。drill-share.js は起動時の
// 読みこみに入るので、P2P の画面でしか使わないものはこちらに分けて初回の JS を増やさない。
// 副作用を持たない純粋ロジックだけを置き、DOM・React・KANJI_DATA には依存しない。
import {
  DRILL_KANJI_MAX_COUNT,
  DRILL_SHARE_VERSION,
  KANJI_ID_PATTERN,
  decodeDrillParam,
  encodeDrillParam,
  normalizeDrillName,
} from './drill-share.js';

// ── メッセージ ──
// 相手は公開の PeerJS サーバーの上で 4 けたの数字だけを頼りに見つけるので、
// 打ちまちがえれば別の学級の先生に、悪意のある相手が先にその数字を取っていれば
// その相手につながりうる。受け取ったものは外部入力として、リンクと同じ検証に通す。

/** P2P で受け取るメッセージの上限（文字数）。これより大きいものは開かずに捨てる */
export const P2P_MESSAGE_MAX_LENGTH = 8192;

/**
 * ドリル（外部入力）を { name, kanjis } だけの形に整える。
 * 名前は制御文字を除いて40字まで、漢字は ID の形のものだけを重複なく300字まで。
 * 余分な欄は捨てる。整えた結果が空なら null。
 * （このアプリに無い漢字IDの除外は、表示・保存の側で KANJI_DATA と突き合わせて行う）
 */
export function sanitizeDrill(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const name = normalizeDrillName(data.name);
  if (!name || !Array.isArray(data.kanjis)) return null;
  const seen = new Set();
  const kanjis = [];
  for (const id of data.kanjis) {
    if (typeof id !== 'string' || !KANJI_ID_PATTERN.test(id) || seen.has(id)) continue;
    seen.add(id);
    kanjis.push(id);
    if (kanjis.length >= DRILL_KANJI_MAX_COUNT) break;
  }
  return kanjis.length > 0 ? { name, kanjis } : null;
}

/**
 * 先生の端末から送るメッセージを作る。
 * 中身はリンクと同じ形（param）にして、受け取る側の検証を1つにする。
 * data は、更新前の版のアプリ（param を知らない）でも受け取れるように残している。
 */
export function buildDrillMessage(drill) {
  const clean = sanitizeDrill(drill);
  const param = clean ? encodeDrillParam(clean) : null;
  if (!param) return null;
  return JSON.stringify({ type: 'drill', v: DRILL_SHARE_VERSION, param, data: clean });
}

/** 受け取ったメッセージからドリルを取り出す（大きすぎる・壊れている・形が違うときは null） */
export function parseDrillMessage(raw) {
  if (typeof raw !== 'string' || raw.length > P2P_MESSAGE_MAX_LENGTH) return null;
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!msg || typeof msg !== 'object' || msg.type !== 'drill') return null;
  if (typeof msg.param === 'string') return decodeDrillParam(msg.param);
  // 更新前の版の先生の端末は data だけを送ってくる
  return sanitizeDrill(msg.data);
}

/** 「かくにんの しるし」に使う絵（低学年でも見くらべやすいもの） */
export const CHECK_MARKS = ['🐶', '🐱', '🐰', '🐻', '🐼', '🐸', '🐧', '🐤', '🍎', '🍌', '🍓', '🍉', '🌻', '⭐', '🚗', '⚽'];

/**
 * ドリルの中身から作る「かくにんの しるし」（絵2つ）。
 * 先生の画面と児童の受け取り画面に同じものが出る。数字の打ちまちがいや、
 * 別の相手につながったことに、保存する前に気づけるようにする。
 * @returns {string} 絵2つ（ドリルが空なら ''）
 */
export function drillCheckCode(drill) {
  const clean = sanitizeDrill(drill);
  const param = clean ? encodeDrillParam(clean) : null;
  if (!param) return '';
  // FNV-1a（32bit）。暗号ではなく「見くらべる」ための短い印
  let h = 0x811c9dc5;
  for (let i = 0; i < param.length; i++) {
    h ^= param.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const n = CHECK_MARKS.length;
  return CHECK_MARKS[h % n] + CHECK_MARKS[(h >>> 8) % n];
}
