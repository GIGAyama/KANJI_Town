// ならった範囲（先生が日付つきで前もって配る「新出に出す字」の予定）— マイ漢字タウン
//
// サーバーを持たないので、予約配信は「リンクの中に全部の段と日付を入れておき、
// 児童の端末が自分の日付を見て、日付が来た段の字だけを新出に出す」形にする。
// そのため、リンクの中身を読めば日付の前の段の字も分かる（画面には出さない）。
//
// URL例: https://kanji-town.giga-school.com/?range=eyJ2IjoxLCJuIjoi...
// 中身（JSON を base64url にしたもの）:
//   { v: 1, n: 範囲の名前, s: [[ 'YYYYMMDD'（この日から）, 畳んだ漢字ID ], ...] }
// 漢字IDの畳み方はドリルのリンク（drill-share.js）と同じ。段の並びが教科書の順。
//
// 児童の端末では stats.settings.learningRange に1つだけ持つ:
//   { name, stages: [{ from: 'YYYY-MM-DD', kanjis: ['k3_1', ...] }], receivedAt }
// 学習の組み立て（learning-plan.js の buildLearningPlan）がこれを読む。
//
// ここは先生の画面・受け取りの画面・ホームの小さな表示から読む（起動時には読まない）。
// 副作用を持たない純粋ロジックだけを置き、DOM・React・KANJI_DATA には依存しない。
import {
  KANJI_ID_PATTERN,
  base64UrlToBytes,
  bytesToBase64Url,
  decodeKanjiSpec,
  encodeKanjiIds,
  isValidDateKey,
  normalizeDrillName,
  normalizeShareBaseUrl,
  unpackDate,
} from './drill-share.js';

/** 共有URLのクエリパラメータ名 */
export const RANGE_SHARE_PARAM = 'range';

/** 中身の形式の版（形式を変えたら上げる。知らない版は受け取らない） */
export const RANGE_SHARE_VERSION = 1;

/** 1つの範囲に入れられる段の数（1年間の週の数より少し多め） */
export const RANGE_STAGE_MAX = 40;

/** 1つの範囲に入れられる字の数（すべての段の合計。いちばん多い学年は202字） */
export const RANGE_KANJI_MAX = 300;

/**
 * 受け取るパラメータの最大長。上の上限いっぱい（40段・300字で学年が1字ごとに入れかわる、
 * いちばん長くなる形）でも収まる長さにしてある（test/learning-range.test.js が確かめる）。
 */
export const RANGE_PARAM_MAX_LENGTH = 4000;

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * 範囲（リンク・保存データ・先生の下書き）を確かめて整える。だめなら null。
 * - 名前は制御文字を除いて40字まで（空はだめ）
 * - 段は1〜40。日付が正しくない段があれば、範囲ぜんたいを受け取らない（予定がずれるため）
 * - 字は ID の形のものだけ。前の段に出た字は、あとの段から除く。字が無くなった段は除く
 * - 字はぜんぶで300字まで。こえていれば受け取らない（あとの段を黙って切ると予定が欠けるため）
 * 余分な欄は捨てる。
 */
export function sanitizeLearningRange(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const name = normalizeDrillName(value.name);
  if (!name || !Array.isArray(value.stages) || value.stages.length === 0 || value.stages.length > RANGE_STAGE_MAX) return null;
  const seen = new Set();
  const stages = [];
  for (const stage of value.stages) {
    if (!stage || typeof stage !== 'object' || !isValidDateKey(stage.from) || !Array.isArray(stage.kanjis)) return null;
    const kanjis = [];
    for (const id of stage.kanjis) {
      if (typeof id !== 'string' || !KANJI_ID_PATTERN.test(id) || seen.has(id)) continue;
      seen.add(id);
      kanjis.push(id);
    }
    if (kanjis.length > 0) stages.push({ from: stage.from, kanjis });
  }
  if (stages.length === 0 || seen.size > RANGE_KANJI_MAX) return null;
  return { name, stages };
}

/** 範囲を共有URL用の文字列にする（整えられない・長すぎるときは null） */
export function encodeRangeParam(range) {
  const clean = sanitizeLearningRange(range);
  if (!clean) return null;
  const payload = JSON.stringify({
    v: RANGE_SHARE_VERSION,
    n: clean.name,
    s: clean.stages.map((stage) => [stage.from.replace(/-/g, ''), encodeKanjiIds(stage.kanjis)]),
  });
  try {
    const param = bytesToBase64Url(new TextEncoder().encode(payload));
    return param.length <= RANGE_PARAM_MAX_LENGTH ? param : null;
  } catch {
    return null;
  }
}

/** 共有URLの文字列を範囲に戻す（壊れている・形式が違う・上限をこえるときは null） */
export function decodeRangeParam(param) {
  if (typeof param !== 'string') return null;
  const trimmed = param.trim();
  if (!trimmed || trimmed.length > RANGE_PARAM_MAX_LENGTH || !BASE64URL_PATTERN.test(trimmed)) return null;
  let parsed;
  try {
    parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(base64UrlToBytes(trimmed)));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || parsed.v !== RANGE_SHARE_VERSION) return null;
  if (!Array.isArray(parsed.s) || parsed.s.length > RANGE_STAGE_MAX) return null;
  const stages = [];
  for (const entry of parsed.s) {
    if (!Array.isArray(entry) || entry.length !== 2) return null;
    const from = unpackDate(entry[0]);
    const kanjis = decodeKanjiSpec(entry[1]);
    if (!from || !kanjis) return null;
    stages.push({ from, kanjis });
  }
  return sanitizeLearningRange({ name: parsed.n, stages });
}

/** 範囲の共有URLを組み立てる（共有できないときは null） */
export function buildRangeShareUrl(range, baseUrl) {
  const param = encodeRangeParam(range);
  const base = normalizeShareBaseUrl(baseUrl);
  if (!param || !base) return null;
  return `${base}?${RANGE_SHARE_PARAM}=${param}`;
}

/**
 * 範囲の今のようす（ホーム・設定・受け取りの画面に出す）。範囲が無ければ null。
 *   totalCount    : 範囲の字の数（このアプリに無い字は数えない）
 *   startedCount  : 日付が来た段の字の数
 *   learnedCount  : 範囲の字のうち、もう習った字の数
 *   waitingCount  : 日付が来た段の字のうち、まだ習っていない字の数（これが新出に出る）
 *   nextStage     : まだ日付が来ていない段のうち いちばん早いもの { from, count }。無ければ null
 *   complete      : 範囲の字をすべて習った（新出は学年の字に戻る）
 */
export function getLearningRangeStatus(range, kanjiStats = {}, today, isKnownKanji = () => true) {
  const clean = sanitizeLearningRange(range);
  if (!clean) return null;
  const learned = (id) => Boolean(kanjiStats?.[id]) && kanjiStats[id].status !== 'new';
  let totalCount = 0; let startedCount = 0; let learnedCount = 0; let waitingCount = 0;
  let nextStage = null;
  clean.stages.forEach((stage) => {
    const ids = stage.kanjis.filter((id) => isKnownKanji(id));
    totalCount += ids.length;
    learnedCount += ids.filter(learned).length;
    if (stage.from <= today) {
      startedCount += ids.length;
      waitingCount += ids.filter((id) => !learned(id)).length;
    } else if (ids.length > 0) {
      // 同じ日から始まる段が2つあれば、字の数を合わせる
      if (!nextStage || stage.from < nextStage.from) nextStage = { from: stage.from, count: ids.length };
      else if (stage.from === nextStage.from) nextStage.count += ids.length;
    }
  });
  return {
    name: clean.name,
    stageCount: clean.stages.length,
    totalCount,
    startedCount,
    learnedCount,
    waitingCount,
    nextStage,
    complete: totalCount > 0 && learnedCount >= totalCount,
  };
}
