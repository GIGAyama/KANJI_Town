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

// ── 例文のルビ ──
// 例文は「漢字（よみ）」の形で書き、サバイバル・ドリルテスト・毎日のテストでは対象字を◯にして出題に使う。
// ルビは、その字の常用漢字表の音訓（連濁・促音化・連用形の名詞を含む）か、表の備考・付表の語
// （果物＝くだもの、笑顔＝えがお などの熟字訓）で読めなければならない。
const toHiragana = (s) => s.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
const isKanji = (ch) => /[一-龯々〆ヶ]/.test(ch);
const VOICED = { か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご', さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ', た: 'だ', ち: 'ぢ', つ: 'づ', て: 'で', と: 'ど', は: 'ば', ひ: 'び', ふ: 'ぶ', へ: 'べ', ほ: 'ぼ' };
const HALF_VOICED = { は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ' };
const I_ROW = { う: 'い', く: 'き', ぐ: 'ぎ', す: 'し', つ: 'ち', ぬ: 'に', ぶ: 'び', む: 'み', る: 'り' };
// 表の音訓から機械的に作れない読みは、理由をつけてここに足す
const EXTRA_READINGS = { 来: ['こ', 'き'] }; // カ行変格活用（来ない・来ます）
const EXTRA_WORDS = { 日本: ['にほん', 'にっぽん'] }; // 国名。付表に無いが、日本語・日本人などで使う

function readingFormsOf(char) {
  const entry = JOYO[char];
  const forms = new Set();
  for (const raw of [...entry.readings, ...(entry.alternates || []), ...(EXTRA_READINGS[char] || [])]) {
    const reading = toHiragana(raw);
    const split = reading.match(/^(.*?)\((.*)\)$/);
    const bases = split ? [split[1], split[1] + split[2]] : [reading];
    if (split) {
      const last = split[2].at(-1);
      if (I_ROW[last]) bases.push(split[1] + split[2].slice(0, -1) + I_ROW[last]); // 合う→試合（あい）
      if (last === 'る' && split[2].length >= 2) bases.push(split[1] + split[2].slice(0, -1)); // 建てる→建物（たて）
    }
    for (const base of bases) {
      const heads = [base];
      if (VOICED[base[0]]) heads.push(VOICED[base[0]] + base.slice(1)); // 三本→ぼん
      if (HALF_VOICED[base[0]]) heads.push(HALF_VOICED[base[0]] + base.slice(1)); // 一本→ぽん
      for (const head of heads) {
        forms.add(head);
        if (/[つちくき]$/.test(head) && head.length >= 2) forms.add(`${head.slice(0, -1)}っ`); // 一回→いっ
      }
    }
  }
  return forms;
}

const WORDS = new Map(Object.entries(EXTRA_WORDS));
for (const entry of Object.values(JOYO)) {
  for (const word of entry.words || []) {
    const [, base, reading] = word.match(/^(.+)（(.+)）$/);
    WORDS.set(base, [...(WORDS.get(base) || []), reading]);
  }
}

function canRead(base, reading) {
  const memo = new Map();
  const walk = (i, j) => {
    const key = `${i},${j}`;
    if (memo.has(key)) return memo.get(key);
    let ok = false;
    if (i === base.length) {
      ok = j === reading.length;
    } else {
      for (const [word, readings] of WORDS) {
        if (ok || !base.startsWith(word, i)) continue;
        ok = readings.some((r) => reading.startsWith(r, j) && walk(i + word.length, j + r.length));
      }
      const ch = base[i];
      if (!ok && !isKanji(ch)) {
        ok = reading[j] === toHiragana(ch) && walk(i + 1, j + 1);
      } else if (!ok && JOYO[ch]) {
        ok = [...readingFormsOf(ch)].some((form) => reading.startsWith(form, j) && walk(i + 1, j + form.length));
      } else if (!ok) {
        // 踊り字（々）と表外字は読みを決められないので、1〜4字のどれかに当てる
        ok = [1, 2, 3, 4].some((len) => j + len <= reading.length && walk(i + 1, j + len));
      }
    }
    memo.set(key, ok);
    return ok;
  };
  return walk(0, 0);
}

test('例文のルビは、その字の常用漢字表の音訓か、付表・備考の語で読める', () => {
  const wrong = [];
  for (const kanji of KANJI_DATA) {
    for (const example of kanji.examples) {
      for (const [, rawBase, rawReading] of example.matchAll(/([^\s（）]+?)（([^）]+)）/g)) {
        const reading = toHiragana(rawReading);
        // 「お花見（はなみ）」の「お」のように、前にくっついただけのかなは外して見る
        let base = rawBase;
        while (base.length > 1 && !isKanji(base[0]) && reading[0] !== toHiragana(base[0])) base = base.slice(1);
        if (!canRead(base, reading)) wrong.push(`${kanji.char}: ${rawBase}（${rawReading}）`);
      }
    }
  }
  // 以前は 神（かな）奈（がわ）川、香（かが）川、漁（ぎょう）業、笑（ば）顔（がお）のような誤りと、
  // 愛（いと）しい・陽（ひ）のような表外の読みがあった
  assert.deepEqual(wrong, []);
});

// 付表・備考の語を1字ずつのルビで書いたときに、語として認める読み（表の読みのほかに、音読みでも読む語）
const SPLIT_WORD_READINGS = {
  兄弟: ['きょうだい'],
  昨日: ['さくじつ'],
  梅雨: ['ばいう'],
  博士: ['はくし'],
  老若: ['ろうにゃく'],
};

test('付表・備考の語（熟字訓など）は、語として正しい読みで書く', () => {
  // 1字ずつは読める読みでも、語としては誤りになる（時（じ）計（けい）、田（でん）舎（しゃ）、一（ひと）人で）
  const wrong = [];
  for (const kanji of KANJI_DATA) {
    for (const example of kanji.examples) {
      for (const [word, readings] of WORDS) {
        if (word.length < 2) continue;
        const pattern = new RegExp([...word].map((ch) => `${ch}（([^）]+)）`).join(''), 'g');
        for (const match of example.matchAll(pattern)) {
          const joined = toHiragana(match.slice(1).join(''));
          if (![...readings, ...(SPLIT_WORD_READINGS[word] || [])].includes(joined)) {
            wrong.push(`${kanji.char}: ${match[0]}（${word}は ${readings.join('・')}）`);
          }
        }
      }
      if (/一（ひと）人/.test(example)) wrong.push(`${kanji.char}: ${example}`);
    }
  }
  assert.deepEqual(wrong, []);
});

test('どの字にも、その字を含む例文がある（書き取りの出題文に使う）', () => {
  const missing = KANJI_DATA.filter((kanji) => !kanji.examples.some((example) => example.includes(kanji.char)));
  assert.deepEqual(missing.map((kanji) => kanji.char), []);
});
