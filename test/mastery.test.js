import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRecommendedPracticeMode,
  getSkillMasterySummary,
  getWeakestSkill,
  normalizeSkillMastery,
  recordSkillEvidence,
} from '../src/systems/mastery.js';
import { migrateCard } from '../src/systems/srs.js';

test('既存カードは現在の習得状態から4技能を安全に補完する', () => {
  const migrated = migrateCard({
    status: 'review',
    graduated: true,
    interval: 86_400_000,
    nextReview: Date.now() + 60_000,
    ease: 2.3,
  });

  assert.deepEqual(
    Object.fromEntries(Object.entries(migrated.skillMastery).map(([skill, value]) => [skill, value.score])),
    { reading: 55, meaning: 55, writing: 55, stroke: 55 },
  );
});

test('練習証拠は対象技能だけを更新し、苦手技能を判定する', () => {
  const card = { status: 'review', graduated: true };
  const skillMastery = recordSkillEvidence(card, [
    { skill: 'reading', evidence: 'good' },
    { skill: 'writing', evidence: 'again' },
  ], 1234);
  const updated = { ...card, skillMastery };

  assert.equal(skillMastery.reading.score, 65);
  assert.equal(skillMastery.writing.score, 37);
  assert.equal(skillMastery.meaning.score, 55);
  assert.equal(skillMastery.reading.lastPracticedAt, 1234);
  assert.equal(getWeakestSkill(updated).skill, 'writing');
  assert.equal(getRecommendedPracticeMode(updated), 'write');
});

test('見るだけ・ガイド付き練習では技能点を上限以上に押し上げない', () => {
  let card = { status: 'new', skillMastery: normalizeSkillMastery(null, { status: 'new' }) };
  for (let i = 0; i < 20; i++) {
    card = {
      ...card,
      skillMastery: recordSkillEvidence(card, [
        { skill: 'reading', evidence: 'exposed' },
        { skill: 'stroke', evidence: 'guided' },
      ], i + 1),
    };
  }

  assert.equal(card.skillMastery.reading.score, 60);
  assert.equal(card.skillMastery.stroke.score, 75);
});

test('新出漢字と技能別の弱点に合わせて開始モードを選ぶ', () => {
  const strong = normalizeSkillMastery(null, { status: 'mastered' });
  assert.equal(getRecommendedPracticeMode({ status: 'new' }, { isNew: true }), 'read');
  assert.equal(getRecommendedPracticeMode({ status: 'mastered', skillMastery: strong }), 'test');
  assert.equal(getRecommendedPracticeMode({
    status: 'learning',
    skillMastery: { ...strong, stroke: { ...strong.stroke, score: 20 } },
  }), 'watch');
});

test('学習済み漢字の4技能平均と証拠数を集計する', () => {
  const summary = getSkillMasterySummary({
    a: { status: 'review', skillMastery: recordSkillEvidence({ status: 'review' }, [{ skill: 'reading', evidence: 'good' }], 1) },
    b: { status: 'mastered' },
    c: { status: 'new' },
  });

  assert.deepEqual(summary.scores, { reading: 75, meaning: 70, writing: 70, stroke: 70 });
  assert.equal(summary.learnedCount, 2);
  assert.equal(summary.evidenceCount, 1);
});

test('音読チャレンジの証拠は読み技能を押し上げるが成功には数えない', () => {
  const first = recordSkillEvidence({ status: 'new' }, [{ skill: 'reading', evidence: 'voiced' }], 1);
  assert.equal(first.reading.score, 15);
  assert.equal(first.reading.attempts, 1);
  assert.equal(first.reading.successes, 0);

  // くり返しても上限75で頭打ち
  let card = { status: 'new' };
  for (let i = 0; i < 10; i++) {
    card = { ...card, skillMastery: recordSkillEvidence(card, [{ skill: 'reading', evidence: 'voiced' }], i + 1) };
  }
  assert.equal(card.skillMastery.reading.score, 75);

  // 上限を超えている既存スコアは下げない
  const high = recordSkillEvidence({ status: 'mastered' }, [{ skill: 'reading', evidence: 'voiced' }], 1);
  assert.equal(high.reading.score, 85);
});
