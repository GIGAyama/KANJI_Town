import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLASSROOM_SHARE_ENDPOINT,
  DRILL_KANJI_MAX_COUNT,
  DRILL_NAME_MAX_LENGTH,
  DRILL_SHARE_PARAM,
  SHARE_URL_QR_LENGTH,
  SHARE_URL_SAFE_LENGTH,
  buildClassroomShareUrl,
  buildDrillShareUrl,
  decodeDrillParam,
  decodeKanjiSpec,
  encodeDrillParam,
  encodeKanjiIds,
  isQrFriendlyUrl,
  isShareUrlTooLong,
  normalizeDrillName,
  readSharedDrill,
} from '../src/systems/drill-share.js';

const BASE_URL = 'https://gigayama.github.io/KANJI_Town/';

test('漢字IDは学年ごとのまとまりに畳んで短くする', () => {
  assert.equal(encodeKanjiIds(['k1_1', 'k1_2', 'k2_5']), '1:1.2-2:5');
  // 学年が行き来しても先生が選んだ順番は保たれる
  assert.equal(encodeKanjiIds(['k2_5', 'k1_1', 'k2_6']), '2:5-1:1-2:6');
  // 連番は36進数
  assert.equal(encodeKanjiIds(['k6_191']), '6:5b');
  // 形式が違うID・重複は落とす
  assert.equal(encodeKanjiIds(['k1_1', 'k1_1', 'bogus', null, 'k9_1']), '1:1');
  assert.equal(encodeKanjiIds('k1_1'), '');
});

test('畳んだ漢字IDは元どおりに戻る', () => {
  const ids = ['k1_1', 'k1_2', 'k2_5', 'k6_191'];
  assert.deepEqual(decodeKanjiSpec(encodeKanjiIds(ids)), ids);
  assert.deepEqual(decodeKanjiSpec('1:1.2-2:5'), ['k1_1', 'k1_2', 'k2_5']);
  // 同じ漢字が二度入っていても1つにまとめる
  assert.deepEqual(decodeKanjiSpec('1:1.1'), ['k1_1']);
});

test('壊れた漢字IDの並びは受け取らない', () => {
  assert.equal(decodeKanjiSpec(''), null);
  assert.equal(decodeKanjiSpec('7:1'), null); // 学年は1〜6だけ
  assert.equal(decodeKanjiSpec('1'), null); // 区切りが無い
  assert.equal(decodeKanjiSpec('1:'), null); // 中身が無い
  assert.equal(decodeKanjiSpec('1:0'), null); // 連番は1から
  assert.equal(decodeKanjiSpec('1:1:2'), null);
  assert.equal(decodeKanjiSpec('1:あ'), null);
  assert.equal(decodeKanjiSpec(null), null);
});

test('ドリル名は制御文字をならし、長すぎる名前は切り詰める', () => {
  assert.equal(normalizeDrillName('  かん字テスト\n1回目 '), 'かん字テスト 1回目');
  assert.equal(normalizeDrillName('あ'.repeat(60)).length, DRILL_NAME_MAX_LENGTH);
  assert.equal(normalizeDrillName('   '), '');
  assert.equal(normalizeDrillName(undefined), '');
});

test('ドリルをURL用の文字列にして元どおりに戻せる', () => {
  const drill = { name: '2年生かん字テスト', kanjis: ['k2_1', 'k2_2', 'k3_10'], createdAt: 1700000000000 };
  const param = encodeDrillParam(drill);
  assert.ok(param);
  // URLに直接置ける文字だけで構成する（エスケープ不要）
  assert.match(param, /^[A-Za-z0-9_-]+$/);
  assert.equal(encodeURIComponent(param), param);

  const restored = decodeDrillParam(param);
  assert.deepEqual(restored, { name: '2年生かん字テスト', kanjis: ['k2_1', 'k2_2', 'k3_10'] });
});

test('共有できないドリルはURLにしない', () => {
  assert.equal(encodeDrillParam({ name: 'からっぽ', kanjis: [] }), null);
  assert.equal(encodeDrillParam({ name: '  ', kanjis: ['k1_1'] }), null);
  assert.equal(encodeDrillParam({ name: '名前だけ', kanjis: ['bogus'] }), null);
  assert.equal(encodeDrillParam(null), null);
  assert.equal(buildDrillShareUrl({ name: 'からっぽ', kanjis: [] }, BASE_URL), null);
  assert.equal(buildDrillShareUrl({ name: 'ドリル', kanjis: ['k1_1'] }, ''), null);
});

test('壊れた・古い共有パラメータは受け取らない', () => {
  assert.equal(decodeDrillParam(''), null);
  assert.equal(decodeDrillParam('!!!'), null); // base64urlではない
  assert.equal(decodeDrillParam('YWJj'), null); // JSONではない
  assert.equal(decodeDrillParam(toParam({ v: 1, n: 'なまえ' })), null); // 漢字が無い
  assert.equal(decodeDrillParam(toParam({ v: 1, n: '', k: '1:1' })), null); // 名前が無い
  assert.equal(decodeDrillParam(toParam({ v: 2, n: 'みらい', k: '1:1' })), null); // 未来の形式
  assert.equal(decodeDrillParam(toParam([1, 2, 3])), null);
  assert.equal(decodeDrillParam(toParam({ v: 1, n: 'こわれ', k: '9:9' })), null);
  assert.equal(decodeDrillParam('a'.repeat(5000)), null);
  assert.equal(decodeDrillParam(undefined), null);
});

test('受け取った漢字は上限までに切りそろえる', () => {
  const many = Array.from({ length: DRILL_KANJI_MAX_COUNT + 50 }, (_, i) => `k1_${i + 1}`);
  const restored = decodeDrillParam(encodeDrillParam({ name: 'たくさん', kanjis: many }));
  assert.equal(restored.kanjis.length, DRILL_KANJI_MAX_COUNT);
  assert.equal(restored.kanjis[0], 'k1_1');
});

test('共有URLはアプリのURLにパラメータを足すだけにする', () => {
  const drill = { name: 'かん字ドリル', kanjis: ['k1_1', 'k1_2'] };
  const url = buildDrillShareUrl(drill, `${BASE_URL}?connect=1234#hash`);
  assert.ok(url.startsWith(`${BASE_URL}?${DRILL_SHARE_PARAM}=`));
  // 受け取り側は同じURLからドリルを復元できる
  const search = url.slice(url.indexOf('?'));
  const shared = readSharedDrill(search);
  assert.equal(shared.status, 'ok');
  assert.deepEqual(shared.drill, { name: 'かん字ドリル', kanjis: ['k1_1', 'k1_2'] });
});

test('起動時のURLから共有ドリルかどうかを見分ける', () => {
  assert.equal(readSharedDrill('').status, 'none');
  assert.equal(readSharedDrill('?connect=1234').status, 'none');
  assert.equal(readSharedDrill(undefined).status, 'none');
  // 共有リンクだが壊れている場合は、通常起動と区別して理由を出せるようにする
  assert.equal(readSharedDrill('?drill=%21%21%21').status, 'invalid');
  assert.equal(readSharedDrill('?drill=').status, 'none');
});

test('Google Classroom への共有URLを組み立てる', () => {
  const shareUrl = `${BASE_URL}?drill=abc`;
  const classroomUrl = buildClassroomShareUrl(shareUrl, 'かん字テスト');
  assert.ok(classroomUrl.startsWith(`${CLASSROOM_SHARE_ENDPOINT}?`));
  const params = new URL(classroomUrl).searchParams;
  assert.equal(params.get('url'), shareUrl);
  assert.equal(params.get('title'), 'かん字テスト');

  assert.equal(buildClassroomShareUrl('javascript:alert(1)', 'わるいURL'), null);
  assert.equal(buildClassroomShareUrl(null, 'なし'), null);
});

test('URLが長すぎないかを判定できる', () => {
  const shortUrl = `${BASE_URL}?drill=abc`;
  assert.equal(isShareUrlTooLong(shortUrl), false);
  assert.equal(isQrFriendlyUrl(shortUrl), true);
  assert.equal(isShareUrlTooLong(`x${'a'.repeat(SHARE_URL_SAFE_LENGTH)}`), true);
  assert.equal(isQrFriendlyUrl(`x${'a'.repeat(SHARE_URL_QR_LENGTH)}`), false);
  assert.equal(isQrFriendlyUrl(''), false);

  // 実際に使う規模（1学年ぶん相当）でもQRコードに収まる長さに収まる
  const kanjis = Array.from({ length: 100 }, (_, i) => `k3_${i + 1}`);
  const url = buildDrillShareUrl({ name: '3年生ぜんぶ', kanjis }, BASE_URL);
  assert.equal(isQrFriendlyUrl(url), true);
});

function toParam(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}
