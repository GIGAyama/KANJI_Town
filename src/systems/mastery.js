export const MASTERY_SKILLS = ['reading', 'meaning', 'writing', 'stroke'];

export const MASTERY_SKILL_DEFINITIONS = {
  reading: { label: '読み', shortLabel: '音読', icon: '📖', mode: 'read' },
  meaning: { label: '意味', shortLabel: '意味', icon: '💡', mode: 'read' },
  writing: { label: '書字', shortLabel: 'なぞり', icon: '✍️', mode: 'write' },
  stroke: { label: '筆順', shortLabel: '書き順', icon: '🖌️', mode: 'watch' },
};

const EVIDENCE_RULES = {
  exposed: { delta: 8, cap: 60, success: false },
  // 音読チャレンジクリア。声に出して読んだ行動の証拠。
  // 音量検出のため読みの正誤までは保証できず success には数えない。
  voiced: { delta: 15, cap: 75, success: false },
  guided: { delta: 6, cap: 75, success: true },
  again: { delta: -18, success: false },
  hard: { delta: 2, success: true },
  good: { delta: 10, success: true },
  easy: { delta: 15, success: true },
};

const clampScore = (score) => Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

function getLegacyBaseScore(card = {}) {
  if (card.status === 'mastered') return 85;
  if (card.status === 'review' || card.graduated) return 55;
  if (card.status === 'learning') return 30;
  return 0;
}

function normalizeEntry(entry, fallbackScore) {
  return {
    score: clampScore(entry?.score ?? fallbackScore),
    attempts: Math.max(0, Number(entry?.attempts) || 0),
    successes: Math.max(0, Number(entry?.successes) || 0),
    lastPracticedAt: Math.max(0, Number(entry?.lastPracticedAt) || 0),
    lastEvidence: typeof entry?.lastEvidence === 'string' ? entry.lastEvidence : null,
  };
}

/** 旧カードや部分的な保存データを4技能の共通形式へ補完する。 */
export function normalizeSkillMastery(skillMastery, card = {}) {
  const fallbackScore = getLegacyBaseScore(card);
  return Object.fromEntries(
    MASTERY_SKILLS.map((skill) => [skill, normalizeEntry(skillMastery?.[skill], fallbackScore)]),
  );
}

/** 複数技能の練習証拠を1回の状態更新で記録する。 */
export function recordSkillEvidence(card, updates, now = Date.now()) {
  const mastery = normalizeSkillMastery(card?.skillMastery, card);

  (Array.isArray(updates) ? updates : []).forEach(({ skill, evidence }) => {
    if (!MASTERY_SKILLS.includes(skill) || !EVIDENCE_RULES[evidence]) return;
    const current = mastery[skill];
    const rule = EVIDENCE_RULES[evidence];
    const proposedScore = clampScore(current.score + rule.delta);
    const nextScore = rule.cap === undefined
      ? proposedScore
      : Math.max(current.score, Math.min(proposedScore, rule.cap));

    mastery[skill] = {
      score: nextScore,
      attempts: current.attempts + 1,
      successes: current.successes + (rule.success ? 1 : 0),
      lastPracticedAt: now,
      lastEvidence: evidence,
    };
  });

  return mastery;
}

export function getWeakestSkill(card) {
  const mastery = normalizeSkillMastery(card?.skillMastery, card);
  return MASTERY_SKILLS
    .map((skill) => ({ skill, ...MASTERY_SKILL_DEFINITIONS[skill], ...mastery[skill] }))
    .reduce((weakest, current) => (current.score < weakest.score ? current : weakest));
}

/** 新出は基礎から、復習は50点未満の最弱技能から始める。 */
export function getRecommendedPracticeMode(card, { isNew = false, threshold = 50 } = {}) {
  if (isNew) return 'read';
  const weakest = getWeakestSkill(card);
  return weakest.score < threshold ? weakest.mode : 'test';
}

/** 学習済み漢字全体の4技能平均を学習記録画面向けに集計する。 */
export function getSkillMasterySummary(kanjiStats = {}) {
  const learnedCards = Object.values(kanjiStats || {}).filter((card) => card && card.status !== 'new');
  const totals = Object.fromEntries(MASTERY_SKILLS.map((skill) => [skill, 0]));
  let evidenceCount = 0;

  learnedCards.forEach((card) => {
    const mastery = normalizeSkillMastery(card.skillMastery, card);
    MASTERY_SKILLS.forEach((skill) => {
      totals[skill] += mastery[skill].score;
      evidenceCount += mastery[skill].attempts;
    });
  });

  const scores = Object.fromEntries(MASTERY_SKILLS.map((skill) => [
    skill,
    learnedCards.length > 0 ? Math.round(totals[skill] / learnedCards.length) : 0,
  ]));

  return { scores, learnedCount: learnedCards.length, evidenceCount };
}
