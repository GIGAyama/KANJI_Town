import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { KANJI_DATA } from '../src/data/kanji-data.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';

// 常用漢字表（平成22年内閣告示第2号）の音訓。出典と取り方は fixture の source に書いてある。
// 告示は著作権法第13条第2号により権利の目的とならない。
const JOYO = JSON.parse(readFileSync(new URL('./fixtures/joyo-kanji-readings.json', import.meta.url), 'utf8')).kanji;
const KATAKANA = /^[ァ-ヶー]+$/;
const KUN = /^[ぁ-ゖー]+(\([ぁ-ゖー]+\))?$/;
const plain = (reading) => reading.replace(/[()]/g, '');

// 学年別漢字配当表（2017年告示・2020年度施行）の字数。
// 4〜6年は都道府県名の20字の追加と、37字の学年の移動で旧表から変わった。
const GRADE_COUNTS_2020 = { 1: 80, 2: 160, 3: 200, 4: 202, 5: 193, 6: 191 };

// 2020年度の改訂で学年が移った字。旧表のままになっていた実績があるので固定しておく。
const MOVED_2020 = {
  4: '賀群徳富城',
  5: '囲紀喜救型航告殺士史象賞貯停堂得毒費粉脈歴',
  6: '胃腸恩券承舌銭退敵俵預',
};

const countByGrade = () => {
  const counts = {};
  for (const kanji of KANJI_DATA) counts[kanji.grade] = (counts[kanji.grade] || 0) + 1;
  return counts;
};

test('教育漢字は1026字で、学年ごとの字数が2020年度の配当表と一致する', () => {
  assert.equal(KANJI_DATA.length, 1026);
  assert.deepEqual(countByGrade(), GRADE_COUNTS_2020);
});

test('2020年度の改訂で学年が移った字は、新しい学年に入っている', () => {
  for (const [grade, chars] of Object.entries(MOVED_2020)) {
    for (const char of chars) {
      const kanji = KANJI_DATA.find((k) => k.char === char);
      assert.ok(kanji, `${char} が見つからない`);
      assert.equal(kanji.grade, Number(grade), `${char} は ${grade}年`);
    }
  }
});

test('漢字の id と字は重複しない（id は学習記録と共有リンクのキー）', () => {
  assert.equal(new Set(KANJI_DATA.map((k) => k.id)).size, KANJI_DATA.length);
  assert.equal(new Set(KANJI_DATA.map((k) => k.char)).size, KANJI_DATA.length);
});

test('学年の「すべてマスター」実績は、その学年の字数ちょうどで達成できる', () => {
  const counts = countByGrade();
  for (const achievement of ACHIEVEMENTS.filter((a) => a.type === 'grade')) {
    const total = counts[achievement.gradeNum];
    assert.ok(achievement.target <= total, `${achievement.id} の目標 ${achievement.target} は ${total} 字を超えている`);
    if (achievement.id.endsWith('_all')) {
      assert.equal(achievement.target, total, `${achievement.id} は ${total} 字`);
      assert.match(achievement.desc, new RegExp(`${total}字`));
    }
  }
});

test('読みはすべて常用漢字表の音訓（備考で認めた別の読みを含む）で、送り仮名の切れ目も表どおり', () => {
  const wrong = [];
  for (const kanji of KANJI_DATA) {
    const entry = JOYO[kanji.char];
    assert.ok(entry, `${kanji.char} が常用漢字表に無い`);
    const allowed = new Set([...entry.readings, ...(entry.alternates || [])]);
    for (const on of kanji.on) {
      assert.match(on, KATAKANA, `${kanji.char} の音読み「${on}」はカタカナで書く`);
      if (!allowed.has(on)) wrong.push(`${kanji.char}:${on}`);
    }
    for (const kun of kanji.kun) {
      assert.match(kun, KUN, `${kanji.char} の訓読み「${kun}」は ひらがな(送り仮名) の形で書く`);
      if (!allowed.has(kun)) wrong.push(`${kanji.char}:${kun}`);
    }
  }
  // 以前は「愛＝かなしい」「画＝えがく」のような表外の読みが 495 字に 866 個混ざり、そのまま教え・読み上げていた
  assert.deepEqual(wrong, [], `常用漢字表に無い読み: ${wrong.slice(0, 20).join(' ')}`);
});

test('常用漢字表の音訓は、どの字でも欠けずに載っている', () => {
  const missing = [];
  for (const kanji of KANJI_DATA) {
    const listed = new Set([...kanji.on, ...kanji.kun]);
    for (const reading of JOYO[kanji.char].readings) {
      if (!listed.has(reading)) missing.push(`${kanji.char}:${reading}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('同じ字の中で、同じ読みが重ならない', () => {
  const duplicated = [];
  for (const kanji of KANJI_DATA) {
    const seen = new Set();
    for (const reading of [...kanji.on, ...kanji.kun].map(plain)) {
      if (seen.has(reading)) duplicated.push(`${kanji.char}:${reading}`);
      seen.add(reading);
    }
  }
  // 以前は「下 くだ(す)」「方 かた」など 13 字で同じ読みが2回並んでいた
  assert.deepEqual(duplicated, []);
});
