// ドリルのリンク共有 — マイ漢字タウン
// 先生が作ったマイドリルを「URLを1本配るだけ」で渡せるようにする（Google Classroom への貼り付け用）。
// このアプリはサーバーを持たない静的サイトなので、ドリルの中身そのものをURLへ畳み込む。
// 端末をまたいでも、受け取り側がオフラインでも復元できるのが利点。
//
// URL例: https://kanji-town.giga-school.com/?drill=eyJ2IjoxLCJuIjoi...
//
// 中身（JSON を base64url にしたもの）:
//   { v: 1, n: ドリル名, k: 畳んだ漢字ID, h?: 宿題 }
//   h（任意）: { d: 'YYYYMMDD' しめきり, m: 'p' れんしゅう | 't' テスト, c?: 問題数(0=ぜんぶ), p?: 合格の目安(%) }
// 宿題は版を上げずに任意の欄として足した。更新前のアプリは知らない欄を読まないので、
// 宿題のリンクも「ふつうのドリル」として受け取れる（壊れたリンク扱いにならない）。
//
// 副作用を持たない純粋ロジックだけを置き、DOM・React・KANJI_DATA には依存しない。
// （存在しない漢字IDの除外は、表示側でKANJI_DATAと突き合わせて行う）

import { HOMEWORK_TEST_COUNTS, isValidDateKey, sanitizeHomework } from './homework.js';

/** 共有URLのクエリパラメータ名 */
export const DRILL_SHARE_PARAM = 'drill';

/** ペイロードの形式バージョン（形式を変えたら上げる。古いリンクは受け取り側で弾く） */
export const DRILL_SHARE_VERSION = 1;

/** ドリル名の最大長（これより長い名前は切り詰めて共有する） */
export const DRILL_NAME_MAX_LENGTH = 40;

/** 1つのドリルで共有できる漢字数の上限 */
export const DRILL_KANJI_MAX_COUNT = 300;

/** 受け取ったパラメータとして許す最大長（極端に長い入力を復号する前に弾く） */
export const DRILL_PARAM_MAX_LENGTH = 4000;

/** 主要ブラウザ・LMSが安全に扱えるURL長の目安。超えたら警告を出す */
export const SHARE_URL_SAFE_LENGTH = 1800;

/** QRコードにしても実用的に読み取れるURL長の目安 */
export const SHARE_URL_QR_LENGTH = 1000;

/** Google Classroom の「共有」エンドポイント */
export const CLASSROOM_SHARE_ENDPOINT = 'https://classroom.google.com/share';

/** 漢字ID（例: k3_128）の形式 */
export const KANJI_ID_PATTERN = /^k([1-6])_(\d{1,4})$/;

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

// ── 文字列ユーティリティ ──

/** ドリル名を共有できる形に整える（制御文字を除き、長すぎる名前は切り詰める） */
export function normalizeDrillName(name) {
  if (typeof name !== 'string') return '';
  const cleaned = name
    .replace(/[\u0000-\u001f\u007f]/g, ' ') // 改行やタブなどの制御文字は空白に均す
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, DRILL_NAME_MAX_LENGTH);
}

/** バイト列を base64url にする（ならった範囲のリンク learning-range.js でも使う） */
export function bytesToBase64Url(bytes) {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** base64url をバイト列に戻す（壊れていれば atob が例外を投げる） */
export function base64UrlToBytes(text) {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/')
    + '='.repeat((4 - (text.length % 4)) % 4);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── 漢字IDの圧縮 ──
// URLを短くするため、漢字IDを「学年ごとのまとまり」に畳む。
//   ["k1_1","k1_2","k2_5"] → "1:1.2-2:5"
// 学年が切り替わるたびに新しいまとまりを作るので、先生が選んだ順番は保たれる。
// 連番部分は36進数にして、1000番台でも2文字に収める。

/** 漢字IDの配列を圧縮した文字列にする（未知の形式のIDは無視する） */
export function encodeKanjiIds(ids) {
  if (!Array.isArray(ids)) return '';
  const groups = [];
  const seen = new Set();
  for (const id of ids) {
    const matched = typeof id === 'string' ? id.match(KANJI_ID_PATTERN) : null;
    if (!matched) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    const grade = matched[1];
    const index = Number(matched[2]);
    if (!Number.isInteger(index) || index <= 0) continue;
    const last = groups[groups.length - 1];
    if (last && last.grade === grade) last.indices.push(index);
    else groups.push({ grade, indices: [index] });
  }
  return groups
    .map(group => `${group.grade}:${group.indices.map(n => n.toString(36)).join('.')}`)
    .join('-');
}

/** 圧縮した文字列を漢字IDの配列に戻す（壊れていればnull） */
export function decodeKanjiSpec(spec) {
  if (typeof spec !== 'string' || spec === '') return null;
  const ids = [];
  const seen = new Set();
  for (const group of spec.split('-')) {
    const parts = group.split(':');
    if (parts.length !== 2) return null;
    const [grade, indexList] = parts;
    if (!/^[1-6]$/.test(grade) || indexList === '') return null;
    for (const token of indexList.split('.')) {
      if (!/^[0-9a-z]{1,3}$/.test(token)) return null;
      const index = parseInt(token, 36);
      if (!Number.isInteger(index) || index <= 0) return null;
      const id = `k${grade}_${index}`;
      if (seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

// ── 日付・宿題 ──
// 宿題のしめきり・ならった範囲の「この日から」は、端末のローカル日付（date-utils の
// getTodayString と同じ YYYY-MM-DD）で持ち、リンクの中では - を抜いた8けたにする。
// 日付と宿題の決まりの検証は homework.js に置く（宿題の記録の確定で起動時に読むため。
// このファイルは起動時には読まない）。ここからも同じものを出す。
export { HOMEWORK_TEST_COUNTS, isValidDateKey, sanitizeHomework };

/** リンクの中の8けたの日付（YYYYMMDD）を YYYY-MM-DD に戻す（だめなら null） */
export function unpackDate(text) {
  if (typeof text !== 'string' || !/^\d{8}$/.test(text)) return null;
  const key = `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6)}`;
  return isValidDateKey(key) ? key : null;
}

function packHomework(value) {
  const hw = sanitizeHomework(value);
  if (!hw) return null;
  const d = hw.due.replace(/-/g, '');
  return hw.mode === 'practice' ? { d, m: 'p' } : { d, m: 't', c: hw.count, p: hw.pass };
}

function unpackHomework(h) {
  if (!h || typeof h !== 'object') return null;
  return sanitizeHomework({
    due: unpackDate(h.d),
    mode: h.m === 'p' ? 'practice' : h.m === 't' ? 'test' : null,
    count: h.c,
    pass: h.p,
  });
}

// ── ドリル本体のエンコード / デコード ──

/** ドリルを共有URL用の文字列にする（共有できない場合はnull）。drill.homework があれば宿題も入れる */
export function encodeDrillParam(drill) {
  const name = normalizeDrillName(drill?.name);
  const kanjis = Array.isArray(drill?.kanjis) ? drill.kanjis.slice(0, DRILL_KANJI_MAX_COUNT) : [];
  const spec = encodeKanjiIds(kanjis);
  if (!name || !spec) return null;
  const h = packHomework(drill?.homework);
  const payload = JSON.stringify({ v: DRILL_SHARE_VERSION, n: name, k: spec, ...(h ? { h } : {}) });
  try {
    return bytesToBase64Url(new TextEncoder().encode(payload));
  } catch {
    return null;
  }
}

/**
 * 共有URLの文字列をドリルに戻す（壊れている・形式が違う場合はnull）。
 * 宿題（h）が正しければ homework を付ける。宿題の欄だけが壊れているときは、宿題を捨ててドリルとして受け取る。
 */
export function decodeDrillParam(param) {
  if (typeof param !== 'string') return null;
  const trimmed = param.trim();
  if (!trimmed || trimmed.length > DRILL_PARAM_MAX_LENGTH) return null;
  if (!BASE64URL_PATTERN.test(trimmed)) return null;

  let parsed;
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(base64UrlToBytes(trimmed));
    parsed = JSON.parse(decoded);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  if (parsed.v !== DRILL_SHARE_VERSION) return null;

  const name = normalizeDrillName(parsed.n);
  const kanjis = decodeKanjiSpec(parsed.k);
  if (!name || !kanjis || kanjis.length === 0) return null;
  const drill = { name, kanjis: kanjis.slice(0, DRILL_KANJI_MAX_COUNT) };
  const homework = unpackHomework(parsed.h);
  return homework ? { ...drill, homework } : drill;
}

// ── URLの組み立て / 読み取り ──

/** 共有URLの土台（クエリ・ハッシュを除いたアプリのURL）を整える */
export function normalizeShareBaseUrl(baseUrl) {
  if (typeof baseUrl !== 'string') return '';
  return baseUrl.split('#')[0].split('?')[0].trim();
}

/** ドリルの共有URLを組み立てる（共有できない場合はnull） */
export function buildDrillShareUrl(drill, baseUrl) {
  const param = encodeDrillParam(drill);
  const base = normalizeShareBaseUrl(baseUrl);
  if (!param || !base) return null;
  return `${base}?${DRILL_SHARE_PARAM}=${param}`;
}

/**
 * Google Classroom の共有画面へ渡すURLを組み立てる。
 * 先生はこのリンクから「授業に投稿」を選ぶだけでドリルを配れる。
 */
export function buildClassroomShareUrl(shareUrl, title) {
  if (typeof shareUrl !== 'string' || !/^https?:\/\//.test(shareUrl)) return null;
  const params = new URLSearchParams({ url: shareUrl });
  const normalizedTitle = normalizeDrillName(title);
  if (normalizedTitle) params.set('title', normalizedTitle);
  return `${CLASSROOM_SHARE_ENDPOINT}?${params.toString()}`;
}

/**
 * 起動時のURL（location.search）から共有ドリルを読み取る。
 * - none    : 共有リンクではない通常の起動
 * - ok      : ドリルを復元できた
 * - invalid : 共有リンクだが壊れている（受け取り側に理由を伝える）
 */
export function readSharedDrill(search) {
  let param = null;
  try {
    param = new URLSearchParams(typeof search === 'string' ? search : '').get(DRILL_SHARE_PARAM);
  } catch {
    return { status: 'none', drill: null };
  }
  if (param === null || param === '') return { status: 'none', drill: null };
  const drill = decodeDrillParam(param);
  if (!drill) return { status: 'invalid', drill: null };
  return { status: 'ok', drill };
}

// ── 長さのチェック ──

/** URLが長すぎて一部の環境で切れるおそれがあるか */
export function isShareUrlTooLong(url) {
  return typeof url === 'string' && url.length > SHARE_URL_SAFE_LENGTH;
}

/** QRコードにしても無理なく読み取れる長さか */
export function isQrFriendlyUrl(url) {
  return typeof url === 'string' && url.length > 0 && url.length <= SHARE_URL_QR_LENGTH;
}

