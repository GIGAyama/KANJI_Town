import test from 'node:test';
import assert from 'node:assert/strict';
import { KANJI_DATA } from '../src/data/kanji-data.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';

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
